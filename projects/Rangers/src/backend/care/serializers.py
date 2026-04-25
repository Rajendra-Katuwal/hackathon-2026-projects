from rest_framework import serializers

from .models import Patient, CarePlan, Task, RiskScore, TimelineEvent


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'id', 'care_plan', 'title', 'description',
            'owner', 'priority', 'deadline', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RiskScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskScore
        fields = ['id', 'score', 'level', 'reasoning', 'created_at']
        read_only_fields = ['id', 'created_at']


class TimelineEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimelineEvent
        fields = ['id', 'event_type', 'timestamp', 'description']
        read_only_fields = ['id', 'timestamp']


class CarePlanSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = CarePlan
        fields = ['id', 'content', 'tasks', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'name', 'summary', 'created_at']
        read_only_fields = ['id', 'created_at']


class PatientDashboardSerializer(serializers.ModelSerializer):
    """Full dashboard payload — includes all related data + derived fields."""

    care_plans = CarePlanSerializer(many=True, read_only=True)
    risk_scores = RiskScoreSerializer(many=True, read_only=True)
    timeline_events = TimelineEventSerializer(many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    latest_risk = serializers.SerializerMethodField()
    latest_care_plan = serializers.SerializerMethodField()
    care_graph = serializers.SerializerMethodField()
    alerts = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'name', 'summary', 'created_at',
            'care_plans', 'risk_scores', 'timeline_events', 'tasks',
            'latest_risk', 'latest_care_plan', 'care_graph', 'alerts',
        ]

    def get_latest_risk(self, obj):
        # list() uses prefetch cache; view pre-orders by -created_at
        risk_scores = list(obj.risk_scores.all())
        latest = risk_scores[0] if risk_scores else None
        return RiskScoreSerializer(latest).data if latest else None

    def get_latest_care_plan(self, obj):
        # list() uses prefetch cache; view pre-orders by -created_at
        care_plans = list(obj.care_plans.all())
        latest = care_plans[0] if care_plans else None
        return CarePlanSerializer(latest).data if latest else None

    def get_care_graph(self, obj):
        """
        Build React Flow–compatible nodes and edges.
        Patient is the root node; each task is a child node.
        """
        nodes = [
            {
                'id': f'patient-{obj.id}',
                'type': 'input',
                'data': {'label': obj.name},
                'position': {'x': 400, 'y': 0},
                'style': {'backgroundColor': '#6366f1', 'color': '#fff', 'borderRadius': '8px'},
            }
        ]
        edges = []

        priority_colors = {
            'critical': '#ef4444',
            'high': '#f97316',
            'medium': '#eab308',
            'low': '#22c55e',
        }

        tasks = list(obj.tasks.all())
        cols = 4
        for idx, task in enumerate(tasks):
            node_id = f'task-{task.id}'
            x_pos = (idx % cols) * 220
            y_pos = 150 + (idx // cols) * 160

            nodes.append({
                'id': node_id,
                'data': {
                    'label': task.title,
                    'owner': task.owner,
                    'status': task.status,
                    'priority': task.priority,
                },
                'position': {'x': x_pos, 'y': y_pos},
                'style': {
                    'backgroundColor': priority_colors.get(task.priority, '#94a3b8'),
                    'color': '#fff',
                    'borderRadius': '6px',
                    'fontSize': '12px',
                },
            })
            edges.append({
                'id': f'edge-{obj.id}-{task.id}',
                'source': f'patient-{obj.id}',
                'target': node_id,
                'label': task.owner,
                'animated': task.status == 'in_progress',
            })

        return {'nodes': nodes, 'edges': edges}

    def get_alerts(self, obj):
        """Surface overdue and high-priority pending tasks as alerts."""
        alerts = []
        overdue = obj.tasks.filter(status='overdue')
        for t in overdue:
            alerts.append({
                'type': 'overdue',
                'task_id': t.id,
                'message': f"Overdue: {t.title}",
            })
        critical = obj.tasks.filter(priority='critical', status__in=['pending', 'in_progress'])
        for t in critical:
            alerts.append({
                'type': 'critical',
                'task_id': t.id,
                'message': f"Critical priority: {t.title}",
            })
        return alerts
