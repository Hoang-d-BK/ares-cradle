from django.core.management.base import BaseCommand
from apps.simulation.models import StageConfig, GameEvent

STAGES_DATA = [
    {
        'id': 1,
        'title': 'Sol 1: The Frigid Night',
        'sol': 1,
        'duration_seconds': 60,
        'description': 'Survive the 12-hour Martian night without battery brownout.',
        'target_objective': 'Maintain battery > 0% until sunrise (+20°C target).',
        'initial_battery_kwh': 85.0,
        'battery_capacity_kwh': 100.0,
        'initial_oxygen_percent': 20.9,
        'initial_temperature_celsius': 20.0,
        'initial_dust_coverage': 0.10,
        'base_solar_max_kw': 45.0,
        'hab_base_load_kw': 4.0,
        'controllable_power_kw': 16.0,
        'ambient_temperature_celsius': -60.0,
        'events': [
            {
                'event_id': 'evt-sol1-cold',
                'title': 'Martian Sunset: Sub-Zero Plunge',
                'description': 'Sun has dipped below the crater rim. External temperature drops to -65°C.',
                'hint': 'Throttle heaters just enough to stay above freezing while conserving battery for oxygen scrubbers.',
                'severity': 'warning',
                'event_type': 'extreme_cold',
                'trigger_sol_time': 32.0,
                'duration_seconds': 28.0,
                'effects': {
                    'ambientTempShift': -5.0
                }
            }
        ]
    },
    {
        'id': 2,
        'title': 'Sol 5: Red Dust Approaching',
        'sol': 5,
        'duration_seconds': 60,
        'description': 'Maintain base stability during an unexpected Martian dust storm.',
        'target_objective': 'Active solar array wiping & throttle non-critical systems.',
        'initial_battery_kwh': 70.0,
        'battery_capacity_kwh': 100.0,
        'initial_oxygen_percent': 20.9,
        'initial_temperature_celsius': 19.5,
        'initial_dust_coverage': 0.20,
        'base_solar_max_kw': 45.0,
        'hab_base_load_kw': 4.5,
        'controllable_power_kw': 16.0,
        'ambient_temperature_celsius': -55.0,
        'events': [
            {
                'event_id': 'evt-sol5-storm',
                'title': 'Dust Storm Inbound: 60% Solar Attenuation',
                'description': 'Atmospheric opacity spikes. Solar panels are rapidly covered in fine Martian regolith.',
                'hint': 'Click the Solar Array to wipe away dust and enable the Emergency Power Saver to preserve battery.',
                'severity': 'critical',
                'event_type': 'dust_storm',
                'trigger_sol_time': 16.0,
                'duration_seconds': 24.0,
                'effects': {
                    'solarEfficiencyMultiplier': 0.40,
                    'dustAccumulationRate': 0.015
                }
            }
        ]
    },
    {
        'id': 3,
        'title': 'Sol 12: Hull Micro-Fracture',
        'sol': 12,
        'duration_seconds': 60,
        'description': 'Manage an oxygen leak until maintenance drones seal the breach.',
        'target_objective': 'Surge oxygen generator power while balancing thermal comfort.',
        'initial_battery_kwh': 60.0,
        'battery_capacity_kwh': 100.0,
        'initial_oxygen_percent': 20.5,
        'initial_temperature_celsius': 18.0,
        'initial_dust_coverage': 0.15,
        'base_solar_max_kw': 45.0,
        'hab_base_load_kw': 5.0,
        'controllable_power_kw': 18.0,
        'ambient_temperature_celsius': -60.0,
        'events': [
            {
                'event_id': 'evt-sol12-leak',
                'title': 'Depressurization Alarm: Hull Micro-Fracture',
                'description': 'Micro-meteorite impact created a seal leak in Module Bravo! Oxygen escaping at 2x rate.',
                'hint': 'Divert priority slider toward Oxygen (70%+) to compensate until repair drones finish sealing.',
                'severity': 'critical',
                'event_type': 'hull_leak',
                'trigger_sol_time': 12.0,
                'duration_seconds': 28.0,
                'effects': {
                    'leakRateMultiplier': 0.22
                }
            }
        ]
    }
]

class Command(BaseCommand):
    help = 'Seeds initial Stage configurations and environmental events for Ares Cradle.'

    def handle(self, *args, **options):
        for data in STAGES_DATA:
            events_data = data.pop('events')
            stage, created = StageConfig.objects.update_or_create(
                id=data['id'],
                defaults=data
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f"{action} {stage}"))

            # Seed events
            GameEvent.objects.filter(stage=stage).delete()
            for evt_data in events_data:
                GameEvent.objects.create(stage=stage, **evt_data)
                self.stdout.write(f"  + Added event: {evt_data['title']}")

        self.stdout.write(self.style.SUCCESS("Successfully seeded all Ares Cradle mission stages!"))
