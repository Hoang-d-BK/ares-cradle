from django.urls import path
from .views import (
    CreateSessionAPIView,
    RecordTurnAPIView,
    CompleteSessionAPIView,
    StudentLogAPIView,
    RoomLeaderboardAPIView
)

urlpatterns = [
    # General Telemetry & Sessions
    path('sessions/', CreateSessionAPIView.as_view(), name='session-create'),
    path('sessions/<uuid:id>/turn/', RecordTurnAPIView.as_view(), name='session-turn'),
    path('sessions/<uuid:id>/complete/', CompleteSessionAPIView.as_view(), name='session-complete-uuid'),
    path('sessions/complete/', CompleteSessionAPIView.as_view(), name='session-complete-direct'),

    # Task 11.2: Classroom PIN Telemetry & Live Leaderboard
    path('log/', StudentLogAPIView.as_view(), name='student-log'),
    path('leaderboard/', RoomLeaderboardAPIView.as_view(), name='leaderboard'),
    path('room-leaderboard/', RoomLeaderboardAPIView.as_view(), name='room-leaderboard'),
]
