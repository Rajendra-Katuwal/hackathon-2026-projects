from django.db import models


class Patient(models.Model):
    name = models.CharField(max_length=255)
    summary = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class CarePlan(models.Model):
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='care_plans'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Care Plan for {self.patient.name}"


class Task(models.Model):
    OWNER_CHOICES = [
        ('doctor', 'Doctor'),
        ('lab', 'Lab'),
        ('patient', 'Patient'),
        ('nurse', 'Nurse'),
        ('specialist', 'Specialist'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    care_plan = models.ForeignKey(
        CarePlan, on_delete=models.CASCADE, related_name='tasks'
    )
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='tasks'
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default='')
    owner = models.CharField(max_length=50, choices=OWNER_CHOICES, default='doctor')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class RiskScore(models.Model):
    LEVEL_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='risk_scores'
    )
    score = models.IntegerField()  # 0–100
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES)
    reasoning = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Risk {self.score} ({self.level}) — {self.patient.name}"


class TimelineEvent(models.Model):
    EVENT_TYPE_CHOICES = [
        ('patient_created', 'Patient Created'),
        ('plan_created', 'Plan Created'),
        ('plan_updated', 'Plan Updated'),
        ('task_created', 'Task Created'),
        ('task_updated', 'Task Updated'),
        ('task_completed', 'Task Completed'),
        ('missed_deadline', 'Missed Deadline'),
        ('risk_assessed', 'Risk Assessed'),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='timeline_events'
    )
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField()

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.event_type} — {self.patient.name}"
