"""
care/task_engine.py
-------------------
Converts an AI-generated care plan into structured Task records.
This is AI Call 2 in the pipeline.
"""

import logging
from datetime import date, timedelta

from .models import CarePlan, Task
from . import ai
from .timeline import log_event

logger = logging.getLogger(__name__)


def generate_and_save_tasks(care_plan: CarePlan) -> list:
    """
    Call the AI task generator, persist the resulting Task objects,
    and log a timeline event for each one.

    Args:
        care_plan: The CarePlan model instance to extract tasks from.

    Returns:
        List of saved Task instances (may be empty if AI returns nothing).
    """
    raw_tasks = ai.generate_tasks_from_plan(
        care_plan_content=care_plan.content,
        patient_name=care_plan.patient.name,
    )

    if not raw_tasks:
        logger.warning(
            "Task engine: AI returned no tasks for care plan %s — using defaults.",
            care_plan.id,
        )
        raw_tasks = _default_tasks()

    today = date.today()
    created: list[Task] = []

    for task_data in raw_tasks:
        try:
            deadline_days = max(1, int(task_data.get('deadline_days', 7)))
        except (TypeError, ValueError):
            deadline_days = 7

        priority = task_data.get('priority', 'medium')
        if priority not in ('low', 'medium', 'high', 'critical'):
            priority = 'medium'

        owner = task_data.get('owner', 'doctor')
        if owner not in ('doctor', 'nurse', 'lab', 'specialist', 'patient'):
            owner = 'doctor'

        task = Task.objects.create(
            care_plan=care_plan,
            patient=care_plan.patient,
            title=str(task_data.get('title', 'Follow-up task'))[:500],
            description=str(task_data.get('description', '')),
            owner=owner,
            priority=priority,
            deadline=today + timedelta(days=deadline_days),
            status='pending',
        )
        created.append(task)

        log_event(
            patient=care_plan.patient,
            event_type='task_created',
            description=f"Task created: {task.title}",
        )

    return created


def _default_tasks() -> list:
    """Minimal default tasks used when AI call produces no output."""
    return [
        {
            'title': 'Schedule initial follow-up appointment',
            'owner': 'doctor',
            'priority': 'high',
            'deadline_days': 7,
            'description': 'Book a follow-up to review the care plan and patient status.',
        },
        {
            'title': 'Complete baseline lab work',
            'owner': 'lab',
            'priority': 'medium',
            'deadline_days': 5,
            'description': 'Order and collect baseline laboratory tests.',
        },
        {
            'title': 'Patient education session',
            'owner': 'nurse',
            'priority': 'medium',
            'deadline_days': 10,
            'description': 'Educate patient on care plan goals and self-monitoring.',
        },
    ]
