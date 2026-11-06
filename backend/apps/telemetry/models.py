import uuid
from django.db import models

class StudentSurvivalLog(models.Model):
    """
    Task 11.2: Student Survival Telemetry & Classroom Leaderboard
    Records cadet performance metrics during a classroom session.
    """
    session_pin = models.CharField(max_length=6, db_index=True)
    cadet_name = models.CharField(max_length=100, default='Cadet Leo')
    sols_survived = models.IntegerField(default=1)
    power_saved_kwh = models.FloatField(default=0.0)
    crystals_harvested = models.IntegerField(default=0)
    brownout_count = models.IntegerField(default=0)
    score = models.IntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', '-sols_survived', '-timestamp']

    def __str__(self):
        return f"{self.cadet_name} ({self.session_pin}) - Score {self.score}"


class CadetSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cadet_name = models.CharField(max_length=100, default='Cadet Leo')
    current_stage = models.IntegerField(default=1)
    status = models.CharField(
        max_length=20,
        choices=[
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='in_progress'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Session {self.id} ({self.cadet_name} - Stage {self.current_stage})"


class TelemetryLog(models.Model):
    session = models.ForeignKey(
        CadetSession,
        related_name='telemetry_logs',
        on_delete=models.CASCADE
    )
    sol = models.IntegerField(default=1)
    sol_time = models.FloatField()
    battery_percent = models.FloatField()
    oxygen_percent = models.FloatField()
    temperature_celsius = models.FloatField()
    solar_intake_kw = models.FloatField(default=0.0)
    net_power_kw = models.FloatField(default=0.0)
    power_priority_oxygen = models.IntegerField(default=50)
    power_priority_heaters = models.IntegerField(default=50)
    emergency_saver_active = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Log {self.session_id} @ Sol {self.sol}:{self.sol_time:.1f}s"


class DebriefResult(models.Model):
    session = models.ForeignKey(
        CadetSession,
        related_name='debriefs',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    cadet_name = models.CharField(max_length=100, default='Cadet Leo')
    stage_id = models.IntegerField()
    stage_title = models.CharField(max_length=120)
    success = models.BooleanField(default=True)
    score = models.IntegerField(default=0)
    survived_sols = models.IntegerField(default=1)
    final_battery_percent = models.FloatField(default=0.0)
    final_oxygen_percent = models.FloatField(default=0.0)
    final_temperature_celsius = models.FloatField(default=0.0)
    trade_off_summary = models.TextField(blank=True, default='')
    educational_takeaway = models.TextField(blank=True, default='')
    failure_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', '-created_at']

    def __str__(self):
        return f"Debrief Stage {self.stage_id} - Score {self.score} ({'Success' if self.success else 'Failed'})"
