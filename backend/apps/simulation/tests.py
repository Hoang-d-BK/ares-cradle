from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.simulation.models import StageConfig, GameEvent, ClassroomSession

class SimulationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.stage1 = StageConfig.objects.create(
            id=1,
            title='Sol 1: The Frigid Night',
            sol=1,
            duration_seconds=60,
            description='Survive the 12-hour Martian night without battery brownout.',
            target_objective='Maintain battery > 0% until sunrise (+20°C target).',
            initial_battery_kwh=85.0,
            battery_capacity_kwh=100.0,
            initial_oxygen_percent=20.9,
            initial_temperature_celsius=20.0,
            initial_dust_coverage=0.10,
            base_solar_max_kw=45.0,
            hab_base_load_kw=4.0,
            controllable_power_kw=16.0,
            ambient_temperature_celsius=-60.0
        )
        self.event1 = GameEvent.objects.create(
            stage=self.stage1,
            event_id='evt-sol1-cold',
            title='Martian Sunset: Sub-Zero Plunge',
            description='Sun has dipped below the crater rim.',
            hint='Throttle heaters just enough to stay above freezing.',
            severity='warning',
            event_type='extreme_cold',
            trigger_sol_time=32.0,
            duration_seconds=28.0,
            effects={'ambientTempShift': -5.0}
        )

    def test_list_stages(self):
        url = reverse('stage-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], 1)
        self.assertEqual(response.data[0]['title'], 'Sol 1: The Frigid Night')
        self.assertEqual(len(response.data[0]['events']), 1)
        self.assertEqual(response.data[0]['events'][0]['type'], 'extreme_cold')

    def test_retrieve_stage_detail(self):
        url = reverse('stage-detail', kwargs={'id': 1})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], 1)
        self.assertEqual(response.data['initialBatteryKwh'], 85.0)
        self.assertEqual(response.data['ambientTemperatureCelsius'], -60.0)

    def test_retrieve_non_existent_stage(self):
        url = reverse('stage-detail', kwargs={'id': 99})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # Task 11.1 Classroom PIN Tests
    def test_create_classroom_room(self):
        url = reverse('room-create')
        payload = {
            'teacher_name': 'Dr. Eleanor Arroway',
            'difficulty_modifier': 1.2
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('pin', response.data)
        self.assertEqual(len(response.data['pin']), 6)
        self.assertEqual(response.data['teacher_name'], 'Dr. Eleanor Arroway')
        self.assertEqual(response.data['difficulty_modifier'], 1.2)
        self.assertTrue(response.data['is_active'])

        # Check DB
        room = ClassroomSession.objects.get(pin=response.data['pin'])
        self.assertEqual(room.teacher_name, 'Dr. Eleanor Arroway')

    def test_join_classroom_room_valid(self):
        room = ClassroomSession.objects.create(
            pin='MARS88',
            teacher_name='Teacher John',
            is_active=True
        )
        url = reverse('room-join')
        response = self.client.post(url, {'pin': 'mars88'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        self.assertEqual(response.data['pin'], 'MARS88')
        self.assertEqual(response.data['teacher_name'], 'Teacher John')

    def test_join_classroom_room_invalid(self):
        url = reverse('room-join')
        response = self.client.post(url, {'pin': 'NOPE99'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['valid'])
