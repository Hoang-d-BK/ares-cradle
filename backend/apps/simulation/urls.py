from django.urls import path
from .views import (
    StageListAPIView,
    StageDetailAPIView,
    CreateRoomAPIView,
    JoinRoomAPIView
)

urlpatterns = [
    path('', StageListAPIView.as_view(), name='stage-list'),
    path('<int:id>/', StageDetailAPIView.as_view(), name='stage-detail'),
    path('rooms/create/', CreateRoomAPIView.as_view(), name='room-create'),
    path('rooms/join/', JoinRoomAPIView.as_view(), name='room-join'),
]
