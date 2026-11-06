from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.telemetry.models import CadetSession, DebriefResult

class TelemetryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_session(self):
        url = reverse('session-create')
        data = {'cadetName': 'Cadet Leo', 'currentStage': 1}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['cadetName'], 'Cadet Leo')
        self.assertEqual(response.data['status'], 'in_progress')

    def test_record_turn_telemetry(self):
        session = CadetSession.objects.create(cadet_name='Cadet Maya', current_stage=2)
        url = reverse('session-turn', kwargs={'id': str(session.id)})
        turn_data = {
            'sol': 5,
            'solTime': 16.5,
            'batteryPercent': 68.2,
            'oxygenPercent': 20.8,
            'temperatureCelsius': 19.1,
            'solarIntakeKw': 18.0,
            'netPowerKw': -2.5,
            'powerPriorityOxygen': 60,
            'powerPriorityHeaters': 40,
            'emergencySaverActive': False
        }
        response = self.client.post(url, turn_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['recorded'])
        self.assertEqual(session.telemetry_logs.count(), 1)

    def test_complete_session_debrief(self):
        session = CadetSession.objects.create(cadet_name='Cadet Alex', current_stage=1)
        url = reverse('session-complete-uuid', kwargs={'id': str(session.id)})
        debrief_data = {
            'stageId': 1,
            'stageTitle': 'Sol 1: The Frigid Night',
            'success': True,
            'score': 95,
            'survivedSols': 1,
            'finalBatteryPercent': 45.2,
            'finalOxygenPercent': 20.6,
            'finalTemperatureCelsius': 18.8,
            'tradeOffSummary': 'Managed heaters without oxygen starvation.',
            'educationalTakeaway': 'Energy conservation is vital on Mars.'
        }
        response = self.client.post(url, debrief_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['received'])
        self.assertEqual(response.data['score'], 95)
        
        session.refresh_from_db()
        self.assertEqual(session.status, 'completed')

    def test_leaderboard(self):
        DebriefResult.objects.create(
            cadet_name='Cadet Star',
            stage_id=1,
            stage_title='Sol 1',
            success=True,
            score=98,
            survived_sols=1
        )
        url = reverse('leaderboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['cadetName'], 'Cadet Star')
        self.assertEqual(response.data[0]['score'], 98)
