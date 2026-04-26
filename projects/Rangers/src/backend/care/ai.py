"""
care/ai.py
----------
All Hugging Face Inference API calls for CareSync AI.

AI Call 1 — Care Plan Generation
AI Call 2 — Task Extraction
AI Call 3 — Risk Scoring (with rule-based fallback)
"""

import json
import os
import logging

from huggingface_hub import InferenceClient

logger = logging.getLogger(__name__)

HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_MODEL = os.environ.get("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")


def _get_client() -> InferenceClient:
    return InferenceClient(token=HF_TOKEN if HF_TOKEN else None)


def _chat(prompt: str, max_tokens: int = 1024, temperature: float = 0.3) -> str:
    """Send a single-turn chat message and return the response text."""
    client = _get_client()
    response = client.chat_completion(
        messages=[{"role": "user", "content": prompt}],
        model=HF_MODEL,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# AI Call 1 — Care Plan Generation
# ---------------------------------------------------------------------------


def generate_care_plan(patient_name: str, patient_summary: str) -> str:
    """
    Generate a structured care coordination plan from free-text patient data.
    Returns the plan as plain text.
    """
    prompt = f"""You are a medical care coordinator AI assistant. Your job is to help care teams
coordinate patient care — NOT to diagnose or prescribe.

PATIENT NAME: {patient_name}
PATIENT SUMMARY: {patient_summary}

Generate a comprehensive care coordination plan that covers:
1. Key medical concerns identified from the summary
2. Required monitoring activities (vitals, labs, symptoms)
3. Diagnostic tests or referrals needed
4. Follow-up appointment schedule
5. Coordination steps between care team members
6. Patient education and self-management goals

Be specific, actionable, and realistic. Use clear section headers.

DISCLAIMER: This is a care coordination aid only — not medical advice or diagnosis."""

    return _chat(prompt, max_tokens=1200, temperature=0.3)


# ---------------------------------------------------------------------------
# AI Call 2 — Task Generation
# ---------------------------------------------------------------------------


def generate_tasks_from_plan(care_plan_content: str, patient_name: str) -> list:
    """
    Convert a care plan into a structured list of tasks.
    Returns a list of dicts, each representing one task.
    Falls back to an empty list on parse failure.
    """
    prompt = f"""You are a clinical task manager. Convert the care plan below into actionable tasks.

PATIENT: {patient_name}

CARE PLAN:
{care_plan_content}

Return ONLY a valid JSON array. Each task object must have exactly these fields:
- "title": short action title (string)
- "owner": one of "doctor", "nurse", "lab", "specialist", "patient"
- "priority": one of "low", "medium", "high", "critical"
- "deadline_days": integer — number of days from today by which this must be done
- "description": one sentence describing what needs to be done

Example:
[
  {{
    "title": "Schedule HbA1c lab test",
    "owner": "lab",
    "priority": "high",
    "deadline_days": 7,
    "description": "Order fasting HbA1c to assess glycemic control over past 3 months."
  }}
]

Return ONLY the JSON array, with no markdown fences or extra text."""

    raw = _chat(prompt, max_tokens=1200, temperature=0.1)

    # Extract JSON array robustly
    start = raw.find("[")
    end = raw.rfind("]") + 1
    if start == -1 or end <= start:
        logger.warning("Task generation: no JSON array found in response.")
        return []

    try:
        tasks = json.loads(raw[start:end])
        if isinstance(tasks, list):
            return tasks
    except json.JSONDecodeError as exc:
        logger.warning("Task generation: JSON parse error — %s", exc)

    return []


# ---------------------------------------------------------------------------
# AI Call 3 — Risk Scoring
# ---------------------------------------------------------------------------


def generate_risk_score(
    patient_name: str, patient_summary: str, care_plan: str
) -> dict:
    """
    Assign a risk score (0–100), level (LOW/MEDIUM/HIGH), and reasoning.
    Falls back to rule-based scoring if the AI call fails or returns bad JSON.
    """
    prompt = f"""You are a clinical risk assessment AI. Analyze the patient below and produce a risk score.

PATIENT: {patient_name}
SUMMARY: {patient_summary}
CARE PLAN CONTEXT (excerpt): {care_plan[:600]}

Consider:
- Number and severity of chronic conditions
- Complexity of medication regimen
- Risk of missed follow-ups or non-adherence
- Social and functional factors mentioned
- Recent acute events implied by the summary

Return ONLY a valid JSON object with exactly these fields:
{{
  "score": <integer 0-100>,
  "level": "<LOW|MEDIUM|HIGH>",
  "reasoning": "<2-3 sentences explaining the key risk drivers>"
}}

No markdown, no extra text."""

    try:
        raw = _chat(prompt, max_tokens=512, temperature=0.1)
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            data = json.loads(raw[start:end])
            score = max(0, min(100, int(data.get("score", 50))))
            level = str(data.get("level", "MEDIUM")).upper()
            if level not in ("LOW", "MEDIUM", "HIGH"):
                level = _score_to_level(score)
            return {
                "score": score,
                "level": level,
                "reasoning": data.get("reasoning", "Risk assessed by AI model."),
            }
    except Exception as exc:
        logger.warning("AI risk scoring failed (%s) — falling back to rules.", exc)

    return _rule_based_risk(patient_summary)


def _score_to_level(score: int) -> str:
    if score >= 70:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"


def _rule_based_risk(summary: str) -> dict:
    """Hybrid rule-based fallback for risk scoring."""
    text = summary.lower()
    score = 25
    factors = []

    high_risk_terms = [
        "cancer",
        "heart failure",
        "chf",
        "end-stage",
        "sepsis",
        "stroke",
        "renal failure",
        "ckd stage 4",
        "ckd stage 5",
        "dialysis",
        "copd",
        "cirrhosis",
        "dementia",
        "alzheimer",
    ]
    medium_risk_terms = [
        "diabetes",
        "hypertension",
        "asthma",
        "atrial fibrillation",
        "afib",
        "obesity",
        "depression",
        "anxiety",
        "hypothyroidism",
        "osteoporosis",
        "ckd",
        "chronic kidney",
        "coronary artery disease",
    ]

    for term in high_risk_terms:
        if term in text:
            score += 15
            factors.append(term)

    for term in medium_risk_terms:
        if term in text:
            score += 8
            factors.append(term)

    score = min(score, 100)
    level = _score_to_level(score)

    reasoning = (
        f"Rule-based assessment. Identified risk factors: " f"{', '.join(factors)}."
        if factors
        else "Rule-based assessment. No major high-risk conditions explicitly identified."
    )
    return {"score": score, "level": level, "reasoning": reasoning}
