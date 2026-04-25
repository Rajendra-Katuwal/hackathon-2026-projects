"""
care/risk_engine.py
-------------------
Hybrid risk scoring engine.
Primary: AI-generated score via Hugging Face (AI Call 3).
Fallback: rule-based scoring embedded in ai._rule_based_risk().
"""

import logging

from .models import RiskScore
from . import ai

logger = logging.getLogger(__name__)


def calculate_and_save_risk(patient, care_plan_content: str) -> RiskScore:
    """
    Run risk scoring for a patient and persist the result.

    Args:
        patient:            Patient model instance
        care_plan_content:  Text of the generated care plan (for AI context)

    Returns:
        Saved RiskScore instance
    """
    risk_data = ai.generate_risk_score(
        patient_name=patient.name,
        patient_summary=patient.summary,
        care_plan=care_plan_content,
    )

    risk_score = RiskScore.objects.create(
        patient=patient,
        score=risk_data['score'],
        level=risk_data['level'],
        reasoning=risk_data['reasoning'],
    )

    logger.info(
        "Risk scored for patient %s: %s/100 (%s)",
        patient.id,
        risk_score.score,
        risk_score.level,
    )
    return risk_score
