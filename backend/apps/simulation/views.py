from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import StageConfig, ClassroomSession, generate_pin
from .serializers import StageConfigSerializer, ClassroomSessionSerializer

class StageListAPIView(generics.ListAPIView):
    queryset = StageConfig.objects.prefetch_related('events').all()
    serializer_class = StageConfigSerializer


class StageDetailAPIView(generics.RetrieveAPIView):
    queryset = StageConfig.objects.prefetch_related('events').all()
    serializer_class = StageConfigSerializer
    lookup_field = 'id'


class CreateRoomAPIView(APIView):
    """
    Task 11.1: POST /api/simulation/rooms/create/
    Teacher creates classroom battle session, generating a 6-digit alphanumeric PIN.
    """
    def post(self, request):
        teacher_name = request.data.get('teacher_name') or request.data.get('teacherName') or 'Commander Teacher'
        difficulty = float(request.data.get('difficulty_modifier', 1.0))

        # Guarantee unique PIN
        pin = generate_pin(6)
        while ClassroomSession.objects.filter(pin=pin).exists():
            pin = generate_pin(6)

        room = ClassroomSession.objects.create(
            pin=pin,
            teacher_name=teacher_name,
            difficulty_modifier=difficulty
        )

        return Response({
            'pin': room.pin,
            'teacher_name': room.teacher_name,
            'difficulty_modifier': room.difficulty_modifier,
            'is_active': room.is_active,
            'created_at': room.created_at.isoformat()
        }, status=status.HTTP_201_CREATED)


class JoinRoomAPIView(APIView):
    """
    Task 11.1: POST /api/simulation/rooms/join/
    Student cadets validate and enter classroom simulation by 6-digit PIN.
    """
    def post(self, request):
        pin = (request.data.get('pin') or '').strip().upper()
        if not pin:
            return Response({'error': 'PIN code required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            room = ClassroomSession.objects.get(pin=pin, is_active=True)
            return Response({
                'valid': True,
                'pin': room.pin,
                'teacher_name': room.teacher_name,
                'difficulty_modifier': room.difficulty_modifier
            }, status=status.HTTP_200_OK)
        except ClassroomSession.DoesNotExist:
            return Response({
                'valid': False,
                'error': f'Classroom PIN {pin} not found or inactive.'
            }, status=status.HTTP_404_NOT_FOUND)
