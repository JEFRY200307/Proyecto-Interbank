from django.views.generic import TemplateView
from apps.empresas.models import Empresa
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.empresas.serializers import EmpresaParaMentorSerializer, EmpresaSerializer, EmpresaDetalleSerializer

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
        # Los mentores ven empresas que solicitan y aún no tienen mentor asignado
        empresas = Empresa.objects.filter(solicita_mentoria=True, mentores__isnull=True)
        serializer = EmpresaParaMentorSerializer(empresas, many=True)
        return Response(serializer.data)
    
# Vista base para dashboard mentor (solo renderiza el HTML)
class DashboardMentorView(TemplateView):
    template_name = "dashboard_mentor.html"

class AceptarMentoriaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # 1. Verificación de rol: Asegurarse de que solo un mentor puede aceptar.
        if not hasattr(request.user, 'rol') or request.user.rol != 'mentor':
            return Response(
                {'error': 'Acción no permitida. Solo los mentores pueden aceptar empresas.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Búsqueda más segura: La empresa debe solicitar Y NO tener ya un mentor.
        try:
            empresa = Empresa.objects.get(pk=pk, solicita_mentoria=True, mentores__isnull=True)
        except Empresa.DoesNotExist:
            return Response(
                {'error': 'Empresa no encontrada, ya no solicita mentoría o ya fue asignada a otro mentor.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 3. Asignación y guardado (esto ya estaba bien)
        empresa.mentores.add(request.user)
        empresa.solicita_mentoria = False
        empresa.save()

        return Response({'mensaje': f'Ahora eres mentor de {empresa.razon_social}.'}, status=status.HTTP_200_OK)