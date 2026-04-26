"""
care/fhir.py
------------
FHIR R4 export layer for CareSync AI.

Converts internal Django model instances into valid HL7 FHIR R4 JSON resources.
This demonstrates interoperability readiness (Epic/Cerner integration vision
from system_info.md) without requiring a live FHIR server.

Resources implemented:
  Patient           → FHIR Patient R4
  CarePlan          → FHIR CarePlan R4
  Task              → FHIR Task R4
  RiskScore         → FHIR RiskAssessment R4
  TimelineEvent     → FHIR AuditEvent R4

Exported as a FHIR Bundle (type: collection) via GET /api/patient/<id>/fhir/
"""

from datetime import datetime, timezone as dt_timezone


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    return datetime.now(dt_timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _date_iso(d) -> str:
    """Convert a date or datetime to ISO-8601 string."""
    if d is None:
        return None
    if hasattr(d, 'strftime'):
        return d.strftime("%Y-%m-%dT%H:%M:%SZ") if hasattr(d, 'hour') else d.strftime("%Y-%m-%d")
    return str(d)


# ---------------------------------------------------------------------------
# FHIR R4 — Patient
# ---------------------------------------------------------------------------

def patient_to_fhir(patient) -> dict:
    """
    Map a CareSync Patient to a FHIR R4 Patient resource.
    https://www.hl7.org/fhir/patient.html
    """
    return {
        "resourceType": "Patient",
        "id": str(patient.id),
        "meta": {
            "profile": ["http://hl7.org/fhir/StructureDefinition/Patient"],
            "lastUpdated": _date_iso(patient.created_at),
        },
        "text": {
            "status": "generated",
            "div": f"<div xmlns='http://www.w3.org/1999/xhtml'>{patient.name}</div>",
        },
        "identifier": [
            {
                "system": "urn:caresync:patient",
                "value": str(patient.id),
            }
        ],
        "name": [
            {
                "use": "official",
                "text": patient.name,
            }
        ],
        # Store clinical summary as an extension (no PHI concern in synthetic data)
        "extension": [
            {
                "url": "http://caresync.ai/fhir/StructureDefinition/clinical-summary",
                "valueString": patient.summary,
            }
        ],
    }


# ---------------------------------------------------------------------------
# FHIR R4 — CarePlan
# ---------------------------------------------------------------------------

def care_plan_to_fhir(care_plan) -> dict:
    """
    Map a CareSync CarePlan to a FHIR R4 CarePlan resource.
    https://www.hl7.org/fhir/careplan.html
    """
    return {
        "resourceType": "CarePlan",
        "id": f"careplan-{care_plan.id}",
        "meta": {
            "profile": ["http://hl7.org/fhir/StructureDefinition/CarePlan"],
            "lastUpdated": _date_iso(care_plan.updated_at),
        },
        "status": "active",
        "intent": "plan",
        "title": f"AI Care Plan — {care_plan.patient.name}",
        "description": care_plan.content,
        "subject": {
            "reference": f"Patient/{care_plan.patient.id}",
            "display": care_plan.patient.name,
        },
        "created": _date_iso(care_plan.created_at),
        "activity": [
            {
                "detail": {
                    "status": "in-progress",
                    "description": "AI-generated care coordination plan.",
                }
            }
        ],
    }


# ---------------------------------------------------------------------------
# FHIR R4 — Task
# ---------------------------------------------------------------------------

# CareSync owner → FHIR Task performer type
_OWNER_TO_FHIR_ROLE = {
    "doctor":     "Practitioner",
    "nurse":      "Practitioner",
    "specialist": "Practitioner",
    "lab":        "Organization",
    "patient":    "Patient",
}

# CareSync status → FHIR Task status
_STATUS_MAP = {
    "pending":     "requested",
    "in_progress": "in-progress",
    "completed":   "completed",
    "overdue":     "failed",
}

# CareSync priority → FHIR Task priority
_PRIORITY_MAP = {
    "critical": "stat",
    "high":     "urgent",
    "medium":   "routine",
    "low":      "routine",
}


def task_to_fhir(task) -> dict:
    """
    Map a CareSync Task to a FHIR R4 Task resource.
    https://www.hl7.org/fhir/task.html
    """
    resource = {
        "resourceType": "Task",
        "id": f"task-{task.id}",
        "meta": {
            "profile": ["http://hl7.org/fhir/StructureDefinition/Task"],
            "lastUpdated": _date_iso(task.updated_at),
        },
        "status": _STATUS_MAP.get(task.status, "requested"),
        "intent": "order",
        "priority": _PRIORITY_MAP.get(task.priority, "routine"),
        "description": task.title,
        "note": [{"text": task.description}] if task.description else [],
        "for": {
            "reference": f"Patient/{task.patient.id}",
            "display": task.patient.name,
        },
        "basedOn": [
            {"reference": f"CarePlan/careplan-{task.care_plan.id}"}
        ],
        "authoredOn": _date_iso(task.created_at),
        "lastModified": _date_iso(task.updated_at),
        "performerType": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/task-performer-type",
                        "code": _OWNER_TO_FHIR_ROLE.get(task.owner, "Practitioner"),
                        "display": task.owner.capitalize(),
                    }
                ]
            }
        ],
    }

    if task.deadline:
        resource["restriction"] = {
            "period": {"end": _date_iso(task.deadline)}
        }

    return resource


# ---------------------------------------------------------------------------
# FHIR R4 — RiskAssessment
# ---------------------------------------------------------------------------

# CareSync level → SNOMED CT risk code
_RISK_LEVEL_CODING = {
    "LOW":    {"code": "281NL0500X", "display": "Low Risk"},
    "MEDIUM": {"code": "281NM1300X", "display": "Medium Risk"},
    "HIGH":   {"code": "281NHP1000X", "display": "High Risk"},
}


def risk_score_to_fhir(risk_score) -> dict:
    """
    Map a CareSync RiskScore to a FHIR R4 RiskAssessment resource.
    https://www.hl7.org/fhir/riskassessment.html
    """
    coding = _RISK_LEVEL_CODING.get(risk_score.level, _RISK_LEVEL_CODING["MEDIUM"])
    return {
        "resourceType": "RiskAssessment",
        "id": f"risk-{risk_score.id}",
        "meta": {
            "profile": ["http://hl7.org/fhir/StructureDefinition/RiskAssessment"],
            "lastUpdated": _date_iso(risk_score.created_at),
        },
        "status": "final",
        "subject": {
            "reference": f"Patient/{risk_score.patient.id}",
            "display": risk_score.patient.name,
        },
        "occurrenceDateTime": _date_iso(risk_score.created_at),
        "method": {
            "coding": [
                {
                    "system": "http://caresync.ai/fhir/CodeSystem/risk-method",
                    "code": "hybrid-ai-rules",
                    "display": "Hybrid AI + Rule-Based Risk Assessment",
                }
            ]
        },
        "prediction": [
            {
                "outcome": {
                    "coding": [
                        {
                            "system": "http://caresync.ai/fhir/CodeSystem/risk-level",
                            "code": coding["code"],
                            "display": coding["display"],
                        }
                    ]
                },
                "probabilityDecimal": round(risk_score.score / 100, 2),
                "qualitativeRisk": {
                    "coding": [
                        {
                            "system": "http://caresync.ai/fhir/CodeSystem/risk-level",
                            "code": risk_score.level,
                            "display": coding["display"],
                        }
                    ]
                },
            }
        ],
        "note": [{"text": risk_score.reasoning}],
    }


# ---------------------------------------------------------------------------
# FHIR R4 — AuditEvent (Timeline)
# ---------------------------------------------------------------------------

# CareSync event type → FHIR AuditEvent action
_EVENT_TYPE_MAP = {
    "patient_created":  {"action": "C", "display": "Patient Created"},
    "plan_created":     {"action": "C", "display": "Care Plan Created"},
    "plan_updated":     {"action": "U", "display": "Care Plan Updated"},
    "task_created":     {"action": "C", "display": "Task Created"},
    "task_updated":     {"action": "U", "display": "Task Updated"},
    "task_completed":   {"action": "U", "display": "Task Completed"},
    "missed_deadline":  {"action": "U", "display": "Missed Deadline"},
    "risk_assessed":    {"action": "C", "display": "Risk Assessment Performed"},
}


def timeline_event_to_fhir(event) -> dict:
    """
    Map a CareSync TimelineEvent to a FHIR R4 AuditEvent resource.
    https://www.hl7.org/fhir/auditevent.html
    """
    mapping = _EVENT_TYPE_MAP.get(event.event_type, {"action": "E", "display": event.event_type})
    return {
        "resourceType": "AuditEvent",
        "id": f"audit-{event.id}",
        "meta": {
            "profile": ["http://hl7.org/fhir/StructureDefinition/AuditEvent"],
            "lastUpdated": _date_iso(event.timestamp),
        },
        "type": {
            "system": "http://terminology.hl7.org/CodeSystem/audit-event-type",
            "code": "care-coordination",
            "display": "Care Coordination Event",
        },
        "subtype": [
            {
                "system": "http://caresync.ai/fhir/CodeSystem/event-type",
                "code": event.event_type,
                "display": mapping["display"],
            }
        ],
        "action": mapping["action"],
        "recorded": _date_iso(event.timestamp),
        "outcome": "0",  # 0 = Success
        "outcomeDesc": event.description,
        "entity": [
            {
                "what": {
                    "reference": f"Patient/{event.patient.id}",
                    "display": event.patient.name,
                },
                "description": event.description,
            }
        ],
    }


# ---------------------------------------------------------------------------
# FHIR R4 Bundle — full patient export
# ---------------------------------------------------------------------------

def build_fhir_bundle(patient) -> dict:
    """
    Build a FHIR R4 Bundle (type: collection) containing all resources
    for a single patient.

    Includes: Patient, CarePlan(s), Task(s), RiskAssessment(s), AuditEvent(s)
    """
    entries = []

    def _add(resource: dict):
        entries.append({
            "fullUrl": f"urn:uuid:{resource['resourceType']}/{resource['id']}",
            "resource": resource,
        })

    # Patient
    _add(patient_to_fhir(patient))

    # Care plans
    for cp in patient.care_plans.all():
        _add(care_plan_to_fhir(cp))

    # Tasks
    for task in patient.tasks.all():
        _add(task_to_fhir(task))

    # Risk assessments
    for rs in patient.risk_scores.all():
        _add(risk_score_to_fhir(rs))

    # Timeline / audit events
    for event in patient.timeline_events.all():
        _add(timeline_event_to_fhir(event))

    return {
        "resourceType": "Bundle",
        "id": f"bundle-patient-{patient.id}",
        "meta": {
            "lastUpdated": _now_iso(),
            "profile": ["http://hl7.org/fhir/StructureDefinition/Bundle"],
        },
        "type": "collection",
        "timestamp": _now_iso(),
        "total": len(entries),
        "entry": entries,
    }
