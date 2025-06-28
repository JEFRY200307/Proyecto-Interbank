from django.views.generic import TemplateView, DetailView
from apps.empresas.models import Empresa
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
        empresas = Empresa.objects.filter(mentores=request.user)
        serializer = EmpresaSerializer(empresas, many=True)
        return Response(serializer.data)

# API para detalle y edición de empresa
class EmpresaDetalleMentorAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            # Nos aseguramos que el mentor solo pueda ver empresas que le pertenecen
            empresa = Empresa.objects.get(pk=pk, mentores=request.user)
        except Empresa.DoesNotExist:
            return Response({"error": "Empresa no encontrada o no tienes permiso."}, status=status.HTTP_404_NOT_FOUND)
        # Usamos el serializador completo para la respuesta GET
        serializer = EmpresaParaMentorSerializer(empresa)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            empresa = Empresa.objects.get(pk=pk, mentores=request.user)
        except Empresa.DoesNotExist:
            return Response({"error": "Empresa no encontrada o no tienes permiso."}, status=status.HTTP_404_NOT_FOUND)
        
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
        
        # Filtrar por especialidad del mentor si tiene una
        especialidad_mentor = request.user.especialidades
        
        if especialidad_mentor:
            estrategias = Estrategia.objects.filter(
                solicita_mentoria=True,
                mentor_asignado__isnull=True,
                especialidad_requerida=especialidad_mentor
            ).select_related('empresa', 'usuario')
        else:
            # Si el mentor no tiene especialidad definida, mostrar todas
            estrategias = Estrategia.objects.filter(
                solicita_mentoria=True,
                mentor_asignado__isnull=True
            ).select_related('empresa', 'usuario')
        
        data = []
        for estrategia in estrategias:
            data.append({
                'id': estrategia.id,
                'titulo': estrategia.titulo,
                'descripcion': estrategia.descripcion,
                'categoria': estrategia.categoria,
                'especialidad_requerida': estrategia.especialidad_requerida,
                'fecha_solicitud': estrategia.fecha_solicitud_mentoria,
                'empresa': {
                    'id': estrategia.empresa.id,
                    'razon_social': estrategia.empresa.razon_social,
                    'ruc': estrategia.empresa.ruc
                },
                'usuario_solicitante': {
                    'id': estrategia.usuario.id,
                    'nombre': estrategia.usuario.nombre,
                    'correo': estrategia.usuario.correo
                } if estrategia.usuario else None
            })
        
        return Response({
            'estrategias': data,
            'total': len(data),
            'especialidad_mentor': especialidad_mentor
        }, status=status.HTTP_200_OK)
    
# Vista base para dashboard mentor (solo renderiza el HTML)
class DashboardMentorView(TemplateView):
    template_name = "dashboard_mentor.html"


class DashboardMentorBotsView(TemplateView):
    template_name = "dashboard_mentor_bots.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = ChatCategory.objects.all()  # Pasamos las categorías al template
        return context

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
        
        # También agregar la empresa a la lista de empresas asesoradas del mentor
        estrategia.empresa.mentores.add(request.user)
        
        return Response({
            'mensaje': 'Mentoría aceptada correctamente.',
            'estrategia': estrategia.titulo,
            'empresa': estrategia.empresa.razon_social
        }, status=status.HTTP_200_OK)

# Vista antigua mantenida para compatibilidad
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
        return Response({'mensaje': 'Ahora eres mentor de esta empresa.'})
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