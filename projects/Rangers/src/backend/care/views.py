"""
care/views.py
-------------
All API endpoints for CareSync AI.

POST /api/care/create/      — Patient intake → full AI pipeline
GET  /api/patients/         — List all patients (summary cards)
GET  /api/patient/<id>/     — Full dashboard for one patient
POST /api/task/update/      — Update task status (Kanban drag-and-drop)
POST /api/rag/query/        — RAG medical insight query
"""

import logging

from django.db import transaction
from django.db.models import Case, IntegerField, Prefetch, Value, When
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CarePlan, Patient, RiskScore, Task, TimelineEvent
from .serializers import PatientDashboardSerializer, TaskSerializer
from . import ai
from .task_engine import generate_and_save_tasks
from .risk_engine import calculate_and_save_risk
from .timeline import log_event
from .rag import query_rag
from .fhir import build_fhir_bundle

logger = logging.getLogger(__name__)

# Correct priority ordering: critical(0) > high(1) > medium(2) > low(3)
_PRIORITY_ORDER = Case(
    When(priority='critical', then=Value(0)),
    When(priority='high', then=Value(1)),
    When(priority='medium', then=Value(2)),
    When(priority='low', then=Value(3)),
    default=Value(4),
    output_field=IntegerField(),
)


def _prefetch_patient(patient_id: int) -> Patient:
    """
    Fetch a Patient with all related data needed for PatientDashboardSerializer
    in a fixed number of queries regardless of how many tasks/plans/events exist.
    Reused by both CreateCareFlowView and PatientDashboardView.
    """
    task_qs = Task.objects.annotate(porder=_PRIORITY_ORDER).order_by('porder', 'deadline')
    return Patient.objects.prefetch_related(
        Prefetch('tasks', queryset=task_qs),
        Prefetch(
            'care_plans',
            queryset=CarePlan.objects.prefetch_related(
                Prefetch('tasks', queryset=task_qs),
            ).order_by('-created_at'),
        ),
        Prefetch('risk_scores', queryset=RiskScore.objects.order_by('-created_at')),
        Prefetch('timeline_events', queryset=TimelineEvent.objects.order_by('-timestamp')),
    ).get(id=patient_id)


# ---------------------------------------------------------------------------
# POST /api/care/create/
# ---------------------------------------------------------------------------

class CreateCareFlowView(APIView):
    """
    Full patient intake pipeline:
      1. Create Patient record
      2. AI → Care Plan (HF Call 1)
      3. AI → Tasks from plan (HF Call 2)
      4. AI → Risk Score (HF Call 3, with rule-based fallback)
      5. Return complete dashboard payload
    """

    def post(self, request):
        name = request.data.get('name', '').strip()
        summary = request.data.get('summary', '').strip()

        if not name:
            return Response(
                {'error': 'Patient name is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not summary:
            return Response(
                {'error': 'Patient summary is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Wrap DB writes in a transaction so no orphaned Patient on partial failure
        with transaction.atomic():
            # ── Step 1: Create patient ──────────────────────────────────────
            patient = Patient.objects.create(name=name, summary=summary)
            log_event(patient, 'patient_created', f"Patient '{name}' added to CareSync.")

            # ── Step 2: Generate AI care plan ───────────────────────────────
            try:
                care_plan_content = ai.generate_care_plan(name, summary)
            except Exception as exc:
                logger.error("Care plan generation failed for patient %s: %s", patient.id, exc)
                care_plan_content = _fallback_care_plan(name)

            care_plan = CarePlan.objects.create(patient=patient, content=care_plan_content)
            log_event(patient, 'plan_created', "AI care plan generated.")

            # ── Step 3: Generate tasks ──────────────────────────────────────
            try:
                generate_and_save_tasks(care_plan)
            except Exception as exc:
                logger.error("Task generation failed for care plan %s: %s", care_plan.id, exc)

            # ── Step 4: Risk scoring ────────────────────────────────────────
            try:
                risk = calculate_and_save_risk(patient, care_plan_content)
                log_event(
                    patient, 'risk_assessed',
                    f"Risk assessed: {risk.level} ({risk.score}/100).",
                )
            except Exception as exc:
                logger.error("Risk scoring failed for patient %s: %s", patient.id, exc)

        # ── Step 5: Return full dashboard with proper prefetch ───────────────
        patient = _prefetch_patient(patient.id)
        serializer = PatientDashboardSerializer(patient)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


def _fallback_care_plan(patient_name: str) -> str:
    return (
        f"Care Coordination Plan for {patient_name}\n\n"
        "Note: AI care plan generation is temporarily unavailable. "
        "This is a placeholder plan — please update manually.\n\n"
        "Recommended initial steps:\n"
        "1. Schedule comprehensive intake appointment\n"
        "2. Order baseline laboratory panel\n"
        "3. Conduct medication reconciliation\n"
        "4. Identify primary care provider and specialists\n"
        "5. Assess social determinants of health (SDOH)\n"
        "6. Set up patient education and self-monitoring goals"
    )


def _build_rag_coordination_context(patient: Patient) -> str:
    """
    Build a concise coordination context string from a patient's tasks,
    risk score and recent timeline events — injected into the RAG prompt
    so the LLM can answer questions grounded in the patient's current state.
    """
    parts: list[str] = []

    # Risk
    risk_scores = list(patient.risk_scores.all())
    if risk_scores:
        r = risk_scores[0]
        parts.append(f"Risk: {r.level} ({r.score}/100). {r.reasoning or ''}")

    # Active tasks (not completed)
    tasks = list(patient.tasks.all())
    active = [t for t in tasks if t.status != 'completed']
    if active:
        lines = [f"  - [{t.status.upper()}] {t.title} (due {t.deadline}, owner: {t.owner})" for t in active[:10]]
        parts.append("Active coordination tasks:\n" + "\n".join(lines))

    # Overdue tasks
    overdue = [t for t in tasks if t.status == 'overdue']
    if overdue:
        parts.append(f"Overdue tasks ({len(overdue)}): " + ", ".join(t.title for t in overdue[:5]))

    # Recent timeline events
    events = list(patient.timeline_events.all())[:6]
    if events:
        event_lines = [f"  - {e.event_type}: {e.description}" for e in events]
        parts.append("Recent events:\n" + "\n".join(event_lines))

    return "\n\n".join(parts)


# ---------------------------------------------------------------------------
# GET /api/patients/
# ---------------------------------------------------------------------------

class PatientListView(APIView):
    """List all patients with their latest risk score and task summary."""

    def get(self, request):
        # prefetch_related avoids N+1: one query for patients, one for tasks, one for risk_scores
        patients = Patient.objects.prefetch_related(
            Prefetch('tasks'),
            Prefetch('risk_scores', queryset=RiskScore.objects.order_by('-created_at')),
        ).order_by('-created_at')

        result = []
        for p in patients:
            risk_scores = list(p.risk_scores.all())   # uses prefetch cache
            latest_risk = risk_scores[0] if risk_scores else None
            tasks = list(p.tasks.all())               # uses prefetch cache
            result.append({
                'id': p.id,
                'name': p.name,
                'summary_preview': p.summary[:200],
                'created_at': p.created_at,
                'risk': {
                    'score': latest_risk.score,
                    'level': latest_risk.level,
                } if latest_risk else None,
                'task_counts': {
                    'total': len(tasks),
                    'pending':    sum(1 for t in tasks if t.status == 'pending'),
                    'in_progress': sum(1 for t in tasks if t.status == 'in_progress'),
                    'completed':  sum(1 for t in tasks if t.status == 'completed'),
                    'overdue':    sum(1 for t in tasks if t.status == 'overdue'),
                },
            })
        return Response(result)


# ---------------------------------------------------------------------------
# GET /api/patient/<id>/
# ---------------------------------------------------------------------------

class PatientDashboardView(APIView):
    """Return the full dashboard payload for a single patient."""

    def get(self, request, patient_id):
        # Single existence check before the overdue scan
        if not Patient.objects.filter(id=patient_id).exists():
            return Response(
                {'error': f'Patient {patient_id} not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Auto-mark tasks whose deadline has passed as overdue
        today = timezone.now().date()
        stale = Task.objects.filter(
            patient_id=patient_id,
            status__in=['pending', 'in_progress'],
            deadline__lt=today,
        ).select_related('patient')
        for task in stale:
            task.status = 'overdue'
            task.save(update_fields=['status', 'updated_at'])
            log_event(task.patient, 'missed_deadline', f"Task overdue: {task.title}")

        # Single prefetch call covers all serializer needs
        patient = _prefetch_patient(patient_id)
        serializer = PatientDashboardSerializer(patient)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# POST /api/task/update/
# ---------------------------------------------------------------------------

class UpdateTaskView(APIView):
    """
    Update a task's status (supports Kanban drag-and-drop).

    Body: { "task_id": <int>, "status": "<pending|in_progress|completed|overdue>" }
    """

    VALID_STATUSES = {'pending', 'in_progress', 'completed', 'overdue'}

    def post(self, request):
        task_id = request.data.get('task_id')
        new_status = str(request.data.get('status', '')).strip()

        if not task_id:
            return Response(
                {'error': 'task_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if new_status not in self.VALID_STATUSES:
            return Response(
                {'error': f'status must be one of: {", ".join(sorted(self.VALID_STATUSES))}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response(
                {'error': f'Task {task_id} not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        old_status = task.status
        task.status = new_status
        task.save(update_fields=['status', 'updated_at'])

        if new_status == 'completed':
            log_event(task.patient, 'task_completed', f"Task completed: {task.title}")
        else:
            log_event(
                task.patient, 'task_updated',
                f"Task '{task.title}' status changed: {old_status} → {new_status}",
            )

        return Response(TaskSerializer(task).data)


# ---------------------------------------------------------------------------
# POST /api/rag/query/
# ---------------------------------------------------------------------------

class RAGQueryView(APIView):
    """
    RAG-powered medical insight endpoint.

    Body: { "patient_id": <int|null>, "question": "<string>" }

    Returns: { "question": ..., "answer": ..., "patient_id": ... }
    """

    def post(self, request):
        patient_id = request.data.get('patient_id')
        question = str(request.data.get('question', '')).strip()

        if not question:
            return Response(
                {'error': 'question is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        patient_summary = ""
        care_plan_content = ""
        coordination_context = ""

        if patient_id:
            try:
                patient = Patient.objects.prefetch_related(
                    Prefetch('tasks', queryset=Task.objects.annotate(porder=_PRIORITY_ORDER).order_by('porder', 'deadline')),
                    Prefetch('risk_scores', queryset=RiskScore.objects.order_by('-created_at')),
                    Prefetch('timeline_events', queryset=TimelineEvent.objects.order_by('-timestamp')),
                    Prefetch('care_plans', queryset=CarePlan.objects.order_by('-created_at')),
                ).get(id=patient_id)
                patient_summary = f"Name: {patient.name}\n{patient.summary}"
                care_plans = list(patient.care_plans.all())
                latest_plan = care_plans[0] if care_plans else None
                if latest_plan:
                    care_plan_content = latest_plan.content
                coordination_context = _build_rag_coordination_context(patient)
            except Patient.DoesNotExist:
                pass  # Query proceeds without patient context

        try:
            answer = query_rag(patient_summary, question, care_plan_content, coordination_context)
        except Exception as exc:
            logger.error("RAG query failed: %s", exc)
            answer = (
                "RAG service is temporarily unavailable. "
                "Please consult clinical guidelines directly."
            )

        return Response({
            'question': question,
            'answer': answer,
            'patient_id': patient_id,
        })


# ---------------------------------------------------------------------------
# GET /api/health/
# ---------------------------------------------------------------------------

class HealthCheckView(APIView):
    """Simple health check — confirms the API server is running."""

    def get(self, request):
        return Response({'status': 'ok', 'service': 'CareSync AI', 'version': '1.0.0'})


# ---------------------------------------------------------------------------
# GET /api/patient/<id>/fhir/
# ---------------------------------------------------------------------------

class FHIRExportView(APIView):
    """
    Export a patient's full record as a FHIR R4 Bundle (type: collection).

    Returns HL7 FHIR R4-compliant JSON containing:
      - Patient resource
      - CarePlan resource(s)
      - Task resource(s)
      - RiskAssessment resource(s)
      - AuditEvent resource(s) (timeline)

    Demonstrates interoperability readiness with Epic / Cerner / HL7 FHIR systems.
    This is a read-only export — no FHIR server required.
    """

    def get(self, request, patient_id):
        try:
            patient = Patient.objects.prefetch_related(
                Prefetch(
                    'care_plans',
                    queryset=CarePlan.objects.select_related('patient'),
                ),
                Prefetch(
                    'tasks',
                    queryset=Task.objects.select_related('patient', 'care_plan'),
                ),
                Prefetch(
                    'risk_scores',
                    queryset=RiskScore.objects.select_related('patient'),
                ),
                Prefetch(
                    'timeline_events',
                    queryset=TimelineEvent.objects.select_related('patient'),
                ),
            ).get(id=patient_id)
        except Patient.DoesNotExist:
            return Response(
                {'error': f'Patient {patient_id} not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        bundle = build_fhir_bundle(patient)
        return Response(bundle)
