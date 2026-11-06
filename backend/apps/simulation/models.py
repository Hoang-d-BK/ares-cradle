from django.db import models

class StageConfig(models.Model):
    id = models.IntegerField(primary_key=True)
    title = models.CharField(max_length=120)
    sol = models.IntegerField()
    duration_seconds = models.IntegerField(default=60)
    description = models.TextField()
    target_objective = models.TextField()

    # Initial baselines
    initial_battery_kwh = models.FloatField(default=85.0)
    battery_capacity_kwh = models.FloatField(default=100.0)
    initial_oxygen_percent = models.FloatField(default=20.9)
    initial_temperature_celsius = models.FloatField(default=20.0)
    initial_dust_coverage = models.FloatField(default=0.10)

    # Power & environmental thresholds
    base_solar_max_kw = models.FloatField(default=45.0)
    hab_base_load_kw = models.FloatField(default=4.0)
    controllable_power_kw = models.FloatField(default=16.0)
    ambient_temperature_celsius = models.FloatField(default=-60.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"Stage {self.id}: {self.title} (Sol {self.sol})"


class GameEvent(models.Model):
    stage = models.ForeignKey(
        StageConfig,
        related_name='events',
        on_delete=models.CASCADE
    )
    event_id = models.CharField(max_length=64)
    title = models.CharField(max_length=120)
    description = models.TextField()
    hint = models.TextField(blank=True, default='')
    severity = models.CharField(
        max_length=20,
        choices=[
            ('info', 'Info'),
            ('warning', 'Warning'),
            ('critical', 'Critical')
        ],
        default='warning'
    )
    event_type = models.CharField(
        max_length=40,
        choices=[
            ('dust_storm', 'Dust Storm'),
            ('hull_leak', 'Hull Leak'),
            ('extreme_cold', 'Extreme Cold'),
            ('solar_flare', 'Solar Flare')
        ]
    )
    trigger_sol_time = models.FloatField(default=16.0)
    duration_seconds = models.FloatField(default=24.0)
    effects = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['trigger_sol_time']

    def __str__(self):
        return f"{self.title} ({self.event_type} at {self.trigger_sol_time}s)"
