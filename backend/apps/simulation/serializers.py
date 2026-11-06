from rest_framework import serializers
from .models import StageConfig, GameEvent

class GameEventSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='event_id')
    type = serializers.CharField(source='event_type')
    triggerSolTime = serializers.FloatField(source='trigger_sol_time')
    durationSeconds = serializers.FloatField(source='duration_seconds')
    active = serializers.SerializerMethodField()
    resolved = serializers.SerializerMethodField()

    class Meta:
        model = GameEvent
        fields = [
            'id',
            'title',
            'description',
            'hint',
            'severity',
            'type',
            'triggerSolTime',
            'durationSeconds',
            'active',
            'resolved',
            'effects'
        ]

    def get_active(self, obj):
        return False

    def get_resolved(self, obj):
        return False


class StageConfigSerializer(serializers.ModelSerializer):
    durationSeconds = serializers.IntegerField(source='duration_seconds')
    targetObjective = serializers.CharField(source='target_objective')
    initialBatteryKwh = serializers.FloatField(source='initial_battery_kwh')
    batteryCapacityKwh = serializers.FloatField(source='battery_capacity_kwh')
    initialOxygenPercent = serializers.FloatField(source='initial_oxygen_percent')
    initialTemperatureCelsius = serializers.FloatField(source='initial_temperature_celsius')
    initialDustCoverage = serializers.FloatField(source='initial_dust_coverage')
    baseSolarMaxKw = serializers.FloatField(source='base_solar_max_kw')
    habBaseLoadKw = serializers.FloatField(source='hab_base_load_kw')
    controllablePowerKw = serializers.FloatField(source='controllable_power_kw')
    ambientTemperatureCelsius = serializers.FloatField(source='ambient_temperature_celsius')
    events = GameEventSerializer(many=True, read_only=True)

    class Meta:
        model = StageConfig
        fields = [
            'id',
            'title',
            'sol',
            'durationSeconds',
            'description',
            'targetObjective',
            'initialBatteryKwh',
            'batteryCapacityKwh',
            'initialOxygenPercent',
            'initialTemperatureCelsius',
            'initialDustCoverage',
            'baseSolarMaxKw',
            'habBaseLoadKw',
            'controllablePowerKw',
            'ambientTemperatureCelsius',
            'events'
        ]
