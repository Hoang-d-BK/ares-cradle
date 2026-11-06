from rest_framework import serializers
from .models import CadetSession, TelemetryLog, DebriefResult, StudentSurvivalLog

class StudentSurvivalLogSerializer(serializers.ModelSerializer):
    sessionPin = serializers.CharField(source='session_pin')
    cadetName = serializers.CharField(source='cadet_name', required=False, default='Cadet Leo')
    solsSurvived = serializers.IntegerField(source='sols_survived', required=False, default=1)
    powerSavedKwh = serializers.FloatField(source='power_saved_kwh', required=False, default=0.0)
    crystalsHarvested = serializers.IntegerField(source='crystals_harvested', required=False, default=0)
    brownoutCount = serializers.IntegerField(source='brownout_count', required=False, default=0)

    class Meta:
        model = StudentSurvivalLog
        fields = [
            'id',
            'sessionPin',
            'cadetName',
            'solsSurvived',
            'powerSavedKwh',
            'crystalsHarvested',
            'brownoutCount',
            'score',
            'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class CadetSessionSerializer(serializers.ModelSerializer):
    cadetName = serializers.CharField(source='cadet_name', required=False)
    currentStage = serializers.IntegerField(source='current_stage', required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = CadetSession
        fields = ['id', 'cadetName', 'currentStage', 'status', 'createdAt']


class TelemetryTurnSerializer(serializers.ModelSerializer):
    solTime = serializers.FloatField(source='sol_time')
    batteryPercent = serializers.FloatField(source='battery_percent')
    oxygenPercent = serializers.FloatField(source='oxygen_percent')
    temperatureCelsius = serializers.FloatField(source='temperature_celsius')
    solarIntakeKw = serializers.FloatField(source='solar_intake_kw', required=False, default=0.0)
    netPowerKw = serializers.FloatField(source='net_power_kw', required=False, default=0.0)
    powerPriorityOxygen = serializers.IntegerField(source='power_priority_oxygen', required=False, default=50)
    powerPriorityHeaters = serializers.IntegerField(source='power_priority_heaters', required=False, default=50)
    emergencySaverActive = serializers.BooleanField(source='emergency_saver_active', required=False, default=False)

    class Meta:
        model = TelemetryLog
        fields = [
            'sol',
            'solTime',
            'batteryPercent',
            'oxygenPercent',
            'temperatureCelsius',
            'solarIntakeKw',
            'netPowerKw',
            'powerPriorityOxygen',
            'powerPriorityHeaters',
            'emergencySaverActive'
        ]


class DebriefResultSerializer(serializers.ModelSerializer):
    stageId = serializers.IntegerField(source='stage_id')
    stageTitle = serializers.CharField(source='stage_title', required=False, default='')
    survivedSols = serializers.IntegerField(source='survived_sols', required=False, default=1)
    finalBatteryPercent = serializers.FloatField(source='final_battery_percent', required=False, default=0.0)
    finalOxygenPercent = serializers.FloatField(source='final_oxygen_percent', required=False, default=0.0)
    finalTemperatureCelsius = serializers.FloatField(source='final_temperature_celsius', required=False, default=0.0)
    tradeOffSummary = serializers.CharField(source='trade_off_summary', required=False, default='')
    educationalTakeaway = serializers.CharField(source='educational_takeaway', required=False, default='')
    failureReason = serializers.CharField(source='failure_reason', required=False, allow_null=True)
    cadetName = serializers.CharField(source='cadet_name', required=False, default='Cadet Leo')

    class Meta:
        model = DebriefResult
        fields = [
            'id',
            'stageId',
            'stageTitle',
            'success',
            'score',
            'survivedSols',
            'finalBatteryPercent',
            'finalOxygenPercent',
            'finalTemperatureCelsius',
            'tradeOffSummary',
            'educationalTakeaway',
            'failureReason',
            'cadetName',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    cadetName = serializers.CharField(source='cadet_name')
    solAchieved = serializers.IntegerField(source='survived_sols')
    timestamp = serializers.SerializerMethodField()

    class Meta:
        model = DebriefResult
        fields = ['cadetName', 'score', 'solAchieved', 'timestamp']

    def get_timestamp(self, obj):
        return obj.created_at.strftime("Sol %d %H:%M")
