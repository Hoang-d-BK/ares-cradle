from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import CadetSession, TelemetryLog, DebriefResult
from .serializers import (
    CadetSessionSerializer,
    TelemetryTurnSerializer,
    DebriefResultSerializer,
    LeaderboardEntrySerializer
)

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

            # Return response matching TypeScript SubmissionResponse contract
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


class LeaderboardAPIView(APIView):
    def get(self, request):
        top_debriefs = DebriefResult.objects.filter(success=True).order_by('-score', '-created_at')[:10]
        serializer = LeaderboardEntrySerializer(top_debriefs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
