from rest_framework import generics
from rest_framework.response import Response
from .models import StageConfig
from .serializers import StageConfigSerializer

class StageListAPIView(generics.ListAPIView):
    queryset = StageConfig.objects.prefetch_related('events').all()
    serializer_class = StageConfigSerializer


class StageDetailAPIView(generics.RetrieveAPIView):
    queryset = StageConfig.objects.prefetch_related('events').all()
    serializer_class = StageConfigSerializer
    lookup_field = 'id'
