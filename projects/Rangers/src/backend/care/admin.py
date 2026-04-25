from django.contrib import admin

from .models import CarePlan, Patient, RiskScore, Task, TimelineEvent


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at')
    search_fields = ('name',)
    ordering = ('-created_at',)


@admin.register(CarePlan)
class CarePlanAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'created_at', 'updated_at')
    list_select_related = ('patient',)
    search_fields = ('patient__name',)
    ordering = ('-created_at',)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'patient', 'owner', 'priority', 'status', 'deadline')
    list_filter = ('status', 'priority', 'owner')
    search_fields = ('title', 'patient__name')
    list_select_related = ('patient', 'care_plan')
    ordering = ('deadline',)


@admin.register(RiskScore)
class RiskScoreAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'score', 'level', 'created_at')
    list_filter = ('level',)
    search_fields = ('patient__name',)
    list_select_related = ('patient',)
    ordering = ('-created_at',)


@admin.register(TimelineEvent)
class TimelineEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'event_type', 'timestamp', 'description')
    list_filter = ('event_type',)
    search_fields = ('patient__name', 'description')
    list_select_related = ('patient',)
    ordering = ('-timestamp',)
