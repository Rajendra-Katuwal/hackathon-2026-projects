from django.urls import path

from .views import (
    CreateCareFlowView,
    HealthCheckView,
    PatientListView,
    PatientDashboardView,
    UpdateTaskView,
    RAGQueryView,
)

urlpatterns = [
    # Patient intake + full AI pipeline
    path('care/create/', CreateCareFlowView.as_view(), name='care-create'),

    # Patient listing (summary cards)
    path('patients/', PatientListView.as_view(), name='patient-list'),

    # Full dashboard for a single patient
    path('patient/<int:patient_id>/', PatientDashboardView.as_view(), name='patient-dashboard'),

    # Task status update (Kanban)
    path('task/update/', UpdateTaskView.as_view(), name='task-update'),

    # RAG medical insight query
    path('rag/query/', RAGQueryView.as_view(), name='rag-query'),

    # Health check
    path('health/', HealthCheckView.as_view(), name='health'),
]
