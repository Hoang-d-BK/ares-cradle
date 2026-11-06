from django.urls import path
from .views import (
    CreateSessionAPIView,
    RecordTurnAPIView,
    CompleteSessionAPIView,
    LeaderboardAPIView
)

urlpatterns = [
    path('sessions/', CreateSessionAPIView.as_view(), name='session-create'),
    path('sessions/<uuid:id>/turn/', RecordTurnAPIView.as_view(), name='session-turn'),
    path('sessions/<uuid:id>/complete/', CompleteSessionAPIView.as_view(), name='session-complete-uuid'),
    path('sessions/complete/', CompleteSessionAPIView.as_view(), name='session-complete-direct'),
    path('leaderboard/', LeaderboardAPIView.as_view(), name='leaderboard'),
]
