from django.urls import path
from .views import StageListAPIView, StageDetailAPIView

urlpatterns = [
    path('', StageListAPIView.as_view(), name='stage-list'),
    path('<int:id>/', StageDetailAPIView.as_view(), name='stage-detail'),
]
