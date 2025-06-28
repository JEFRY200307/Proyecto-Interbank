from django.views.generic import TemplateView, DetailView
from apps.empresas.models import Empresa, Estrategia
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
# CORRECCIÓN: Importamos el serializador correcto
from apps.empresas.serializers import EmpresaParaMentorSerializer, EmpresaSerializer

from apps.chat.models import ChatCategory, Estrategia, Etapa, Actividad  # Importa las categorías de bots
from apps.chat.serializers import EstrategiaSerializer, EtapaSerializer, ActividadSerializer

# API para listar empresas del mentor
class EmpresasMentorAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # En el nuevo sistema, obtener empresas a través de las estrategias que el mentor tiene asignadas
        estrategias_mentor = Estrategia.objects.filter(mentor_asignado=request.user)
        empresas_ids = estrategias_mentor.values_list('empresa_id', flat=True).distinct()
        empresas = Empresa.objects.filter(id__in=empresas_ids)
        serializer = EmpresaSerializer(empresas, many=True)
        return Response(serializer.data)

# API para detalle y edición de empresa
class EmpresaDetalleMentorAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            # Verificar que el mentor tenga al menos una estrategia asignada en esta empresa
            estrategias_mentor = Estrategia.objects.filter(mentor_asignado=request.user, empresa_id=pk)
            if not estrategias_mentor.exists():
                return Response({"error": "No tienes estrategias asignadas en esta empresa."}, status=status.HTTP_404_NOT_FOUND)
            
            empresa = Empresa.objects.get(pk=pk)
        except Empresa.DoesNotExist:
            return Response({"error": "Empresa no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        # Usamos el serializador completo para la respuesta GET
        serializer = EmpresaParaMentorSerializer(empresa)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            # Verificar que el mentor tenga al menos una estrategia asignada en esta empresa
            estrategias_mentor = Estrategia.objects.filter(mentor_asignado=request.user, empresa_id=pk)
            if not estrategias_mentor.exists():
                return Response({"error": "No tienes estrategias asignadas en esta empresa."}, status=status.HTTP_404_NOT_FOUND)
            
            empresa = Empresa.objects.get(pk=pk)
        except Empresa.DoesNotExist:
            return Response({"error": "Empresa no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        
        # CORRECCIÓN: Usamos el serializador correcto para actualizar (PUT/PATCH)
        serializer = EmpresaParaMentorSerializer(empresa, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EstrategiasSolicitanMentoriaAPIView(APIView):
    """
    API para que los mentores vean las estrategias que solicitan mentoría
    según su especialidad
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.rol != 'mentor':
            return Response({'error': 'Solo los mentores pueden acceder a esta información.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Importar el modelo desde la app correcta
        from apps.empresas.models import Estrategia
        
        # Los mentores ven TODAS las solicitudes de mentoría
        estrategias = Estrategia.objects.filter(
            solicita_mentoria=True,
            mentor_asignado__isnull=True
        ).select_related('empresa')
        
        data = []
        for estrategia in estrategias:
            data.append({
                'id': estrategia.id,
                'titulo': estrategia.titulo,
                'descripcion': estrategia.descripcion,
                'categoria': estrategia.categoria,
                'fecha_solicitud_mentoria': estrategia.fecha_solicitud_mentoria,
                'empresa_nombre': estrategia.empresa.razon_social,
                'empresa_ruc': estrategia.empresa.ruc,
                'empresa_telefono': estrategia.empresa.telefono,
            })
        
        return Response(data, status=status.HTTP_200_OK)
    
# Vista base para dashboard mentor (solo renderiza el HTML)
class DashboardMentorView(TemplateView):
    template_name = "dashboard_mentor.html"


class DashboardMentorBotsView(TemplateView):
    template_name = "dashboard_mentor_bots.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = ChatCategory.objects.all()  # Pasamos las categorías al template
        return context

class SolicitudesMentoriaView(TemplateView):
    """
    Vista para mostrar las solicitudes de mentoría por estrategias a los mentores
    """
    template_name = "mentor_solicitudes_estrategias.html"

class AceptarMentoriaEstrategiaAPIView(APIView):
    """
    API para que los mentores acepten mentoría de estrategias específicas
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.rol != 'mentor':
            return Response({'error': 'Solo los mentores pueden aceptar mentoría.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Importar el modelo desde la app correcta
        from apps.empresas.models import Estrategia
        from django.utils import timezone
        
        try:
            estrategia = Estrategia.objects.get(id=pk, solicita_mentoria=True, mentor_asignado__isnull=True)
        except Estrategia.DoesNotExist:
            return Response({'error': 'Estrategia no encontrada o ya tiene mentor asignado.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verificar si el mentor tiene la especialidad requerida
        if estrategia.especialidad_requerida and request.user.especialidades != estrategia.especialidad_requerida:
            return Response({
                'error': f'Tu especialidad ({request.user.especialidades}) no coincide con la requerida ({estrategia.especialidad_requerida}).'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Asignar mentor
        estrategia.mentor_asignado = request.user
        estrategia.fecha_asignacion_mentor = timezone.now()
        estrategia.save()
        
        # En el nuevo sistema, la relación mentor-empresa se establece a través de las estrategias
        
        return Response({
            'mensaje': 'Mentoría aceptada correctamente.',
            'estrategia': estrategia.titulo,
            'empresa': estrategia.empresa.razon_social
        }, status=status.HTTP_200_OK)

# Vista antigua mantenida para compatibilidad (DESHABILITADA - usar AceptarMentoriaEstrategiaAPIView)
class AceptarMentoriaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # ESTA VISTA YA NO FUNCIONA - EL CAMPO solicita_mentoria DE EMPRESA YA NO EXISTE
        # USAR AceptarMentoriaEstrategiaAPIView EN SU LUGAR
        return Response(
            {'error': 'Esta funcionalidad ha sido reemplazada. Usa el sistema de mentoría por estrategias.'}, 
            status=status.HTTP_410_GONE
        )
class DashboardMentorBotsDetailView(DetailView):
    model = ChatCategory
    template_name = "dashboard_mentor_bots_detail.html"
    context_object_name = "bot"
    pk_url_kwarg = "bot_id"

# Estrategias de un bot
class BotEstrategiasListCreateView(generics.ListCreateAPIView):
    serializer_class = EstrategiaSerializer

    def get_queryset(self):
        bot_id = self.kwargs['bot_id']
        return Estrategia.objects.filter(chatbot_id=bot_id)

    def perform_create(self, serializer):
        bot_id = self.kwargs['bot_id']
        serializer.save(chatbot_id=bot_id)

class EstrategiaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Estrategia.objects.all()
    serializer_class = EstrategiaSerializer

# Etapas de una estrategia
class EstrategiaEtapasListCreateView(generics.ListCreateAPIView):
    serializer_class = EtapaSerializer

    def get_queryset(self):
        estrategia_id = self.kwargs['estrategia_id']
        return Etapa.objects.filter(estrategia_id=estrategia_id)

    def perform_create(self, serializer):
        estrategia_id = self.kwargs['estrategia_id']
        serializer.save(estrategia_id=estrategia_id)

class EtapaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Etapa.objects.all()
    serializer_class = EtapaSerializer

# Actividades de una etapa
class EtapaActividadesListCreateView(generics.ListCreateAPIView):
    serializer_class = ActividadSerializer

    def get_queryset(self):
        etapa_id = self.kwargs['etapa_id']
        return Actividad.objects.filter(etapa_id=etapa_id)

    def perform_create(self, serializer):
        etapa_id = self.kwargs['etapa_id']
        serializer.save(etapa_id=etapa_id)

class ActividadDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Actividad.objects.all()
    serializer_class = ActividadSerializer