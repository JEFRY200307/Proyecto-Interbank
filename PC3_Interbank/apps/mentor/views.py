from django.views.generic import TemplateView
from apps.empresas.models import Empresa
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.empresas.serializers import EmpresaSerializer, EmpresaDetalleSerializer

# API para listar empresas del mentor
class EmpresasMentorAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        empresas = Empresa.objects.filter(mentores=request.user)
        serializer = EmpresaSerializer(empresas, many=True)
        return Response(serializer.data)

# API para detalle y edición de empresa
class EmpresaDetalleMentorAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            empresa = Empresa.objects.get(pk=pk, mentores=request.user)
        except Empresa.DoesNotExist:
            return Response({'error': 'Empresa no encontrada o no asignada.'}, status=404)
        serializer = EmpresaDetalleSerializer(empresa)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            empresa = Empresa.objects.get(pk=pk, mentores=request.user)
        except Empresa.DoesNotExist:
            return Response({'error': 'Empresa no encontrada o no asignada.'}, status=404)
        serializer = EmpresaDetalleSerializer(empresa, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
class EmpresasSolicitanMentoriaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        empresas = Empresa.objects.filter(solicita_mentoria=True, mentores=None)
        serializer = EmpresaSerializer(empresas, many=True)
        return Response(serializer.data)
    
# Vista base para dashboard mentor (solo renderiza el HTML)
class DashboardMentorView(TemplateView):
    template_name = "dashboard_mentor.html"

class AceptarMentoriaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            empresa = Empresa.objects.get(pk=pk, solicita_mentoria=True)
        except Empresa.DoesNotExist:
            return Response({'error': 'Empresa no encontrada o no solicita mentoría.'}, status=404)
        empresa.mentores.add(request.user)
        empresa.solicita_mentoria = False
        empresa.save()
        return Response({'mensaje': 'Ahora eres mentor de esta empresa.'})