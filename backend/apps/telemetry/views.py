from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import CadetSession, TelemetryLog, DebriefResult, StudentSurvivalLog
from .serializers import (
    CadetSessionSerializer,
    TelemetryTurnSerializer,
    DebriefResultSerializer,
    LeaderboardEntrySerializer,
    StudentSurvivalLogSerializer
)

class StudentLogAPIView(APIView):
    """
    Task 11.2: POST /api/telemetry/log/
    Logs cadet survival telemetry during classroom session.
    """
    def post(self, request):
        pin = (request.data.get('session_pin') or request.data.get('sessionPin') or '').strip().upper()
        if not pin:
            return Response({'error': 'session_pin is required.'}, status=status.HTTP_400_BAD_REQUEST)

        cadet_name = request.data.get('cadet_name') or request.data.get('cadetName') or 'Cadet Leo'
        sols_survived = int(request.data.get('sols_survived') or request.data.get('solsSurvived') or 1)
        power_saved = float(request.data.get('power_saved_kwh') or request.data.get('powerSavedKwh') or 0.0)
        crystals = int(request.data.get('crystals_harvested') or request.data.get('crystalsHarvested') or 0)
        brownouts = int(request.data.get('brownout_count') or request.data.get('brownoutCount') or 0)
        score = int(request.data.get('score') or 0)

        log = StudentSurvivalLog.objects.create(
            session_pin=pin,
            cadet_name=cadet_name,
            sols_survived=sols_survived,
            power_saved_kwh=power_saved,
            crystals_harvested=crystals,
            brownout_count=brownouts,
            score=score
        )

        return Response({
            'recorded': True,
            'id': log.id,
            'sessionPin': log.session_pin,
            'cadetName': log.cadet_name,
            'score': log.score
        }, status=status.HTTP_201_CREATED)


class RoomLeaderboardAPIView(APIView):
    """
    Task 11.2: GET /api/telemetry/leaderboard/?room=<PIN>
    Returns ranked leaderboard for specified classroom room PIN or global rankings.
    """
    def get(self, request):
        room_pin = (request.query_params.get('room') or request.query_params.get('pin') or '').strip().upper()

        if room_pin:
            logs = StudentSurvivalLog.objects.filter(session_pin=room_pin).order_by('-score', '-sols_survived', '-timestamp')[:20]
            results = []
            for rank, entry in enumerate(logs, start=1):
                results.append({
                    'rank': rank,
                    'cadetName': entry.cadet_name,
                    'sessionPin': entry.session_pin,
                    'solsSurvived': entry.sols_survived,
                    'powerSavedKwh': entry.power_saved_kwh,
                    'crystalsHarvested': entry.crystals_harvested,
                    'brownoutCount': entry.brownout_count,
                    'score': entry.score,
                    'timestamp': entry.timestamp.strftime("Sol %d %H:%M")
                })
            return Response(results, status=status.HTTP_200_OK)

        # General / Global Leaderboard fallback
        top_debriefs = DebriefResult.objects.filter(success=True).order_by('-score', '-created_at')[:10]
        serializer = LeaderboardEntrySerializer(top_debriefs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateSessionAPIView(APIView):
    def post(self, request):
        serializer = CadetSessionSerializer(data=request.data)
        if serializer.is_valid():
            session = serializer.save()
            return Response(CadetSessionSerializer(session).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecordTurnAPIView(APIView):
    def post(self, request, id):
        session = get_object_or_404(CadetSession, id=id)
        serializer = TelemetryTurnSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(session=session)
            return Response({'recorded': True, 'sessionId': str(session.id)}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CompleteSessionAPIView(APIView):
    def post(self, request, id=None):
        session = None
        if id:
            session = get_object_or_404(CadetSession, id=id)

        serializer = DebriefResultSerializer(data=request.data)
        if serializer.is_valid():
            debrief = serializer.save(session=session)
            if session:
                session.status = 'completed' if debrief.success else 'failed'
                session.save()

            return Response({
                'received': True,
                'score': debrief.score,
                'message': (
                    f"Cadet mission debrief Stage {debrief.stage_id} verified on Mars Central."
                    if debrief.success
                    else f"Mission Stage {debrief.stage_id} aborted: Life support failure logged."
                )
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
