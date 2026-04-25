"""
care/timeline.py
----------------
Utilities for logging chronological care events (Timeline View feature).
"""

from .models import TimelineEvent


def log_event(patient, event_type: str, description: str) -> TimelineEvent:
    """
    Create and persist a TimelineEvent for a patient.

    Args:
        patient:     Patient model instance
        event_type:  One of the EVENT_TYPE_CHOICES from TimelineEvent
        description: Human-readable description of what happened

    Returns:
        The saved TimelineEvent instance
    """
    return TimelineEvent.objects.create(
        patient=patient,
        event_type=event_type,
        description=description,
    )
