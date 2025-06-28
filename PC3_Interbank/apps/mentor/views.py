from django.views.generic import TemplateView, DetailView
from django.db import models
from apps.empresas.models import Empresa, Estrategia as EstrategiaEmpresa, Etapa as EtapaEmpresa, Actividad as ActividadEmpresa
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework import status
# CORRECCIÓN: Importamos el serializador correcto
from apps.empresas.serializers import EmpresaParaMentorSerializer, EmpresaSerializer

from apps.chat.models import ChatCategory, Estrategia as EstrategiaChat, Etapa as EtapaChat, Actividad as ActividadChat
from apps.chat.serializers import EstrategiaSerializer as EstrategiaChatSerializer, EtapaSerializer as EtapaChatSerializer, ActividadSerializer as ActividadChatSerializer
from apps.empresas.serializers import EstrategiaSerializer as EstrategiaEmpresaSerializer, EtapaSerializer as EtapaEmpresaSerializer, ActividadSerializer as ActividadEmpresaSerializer

# API para listar empresas del mentor
class EmpresasMentorAPIView(APIView):
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # En el nuevo sistema, obtener empresas a través de las estrategias que el mentor tiene asignadas
        estrategias_mentor = EstrategiaEmpresa.objects.filter(mentor_asignado=request.user)
        empresas_ids = estrategias_mentor.values_list('empresa_id', flat=True).distinct()
        empresas = Empresa.objects.filter(id__in=empresas_ids)
        serializer = EmpresaSerializer(empresas, many=True)
        return Response(serializer.data)

# API para detalle y edición de empresa
class EmpresaDetalleMentorAPIView(APIView):
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            # Verificar que el mentor tenga al menos una estrategia asignada en esta empresa
            estrategias_mentor = EstrategiaEmpresa.objects.filter(mentor_asignado=request.user, empresa_id=pk)
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
            estrategias_mentor = EstrategiaEmpresa.objects.filter(mentor_asignado=request.user, empresa_id=pk)
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
        
        # Filtrar solicitudes según la especialidad del mentor
        especialidad_mentor = request.user.especialidades
        
        # Base queryset para solicitudes disponibles
        base_queryset = EstrategiaEmpresa.objects.filter(
            solicita_mentoria=True,
            mentor_asignado__isnull=True
        ).select_related('empresa')
        
        # Lógica de filtrado por especialidad
        if especialidad_mentor == 'general':
            # Los mentores con especialidad "general" pueden ver TODAS las solicitudes
            estrategias = base_queryset
        elif especialidad_mentor:
            # Los mentores con especialidad específica solo ven:
            # 1. Solicitudes que requieren su especialidad
            # 2. Solicitudes que no requieren especialidad específica (especialidad_requerida null/blank)
            # 3. Solicitudes que requieren especialidad "general"
            estrategias = base_queryset.filter(
                models.Q(especialidad_requerida=especialidad_mentor) |
                models.Q(especialidad_requerida__isnull=True) |
                models.Q(especialidad_requerida='') |
                models.Q(especialidad_requerida='general')
            )
        else:
            # Mentores sin especialidad asignada solo ven solicitudes generales
            estrategias = base_queryset.filter(
                models.Q(especialidad_requerida__isnull=True) |
                models.Q(especialidad_requerida='') |
                models.Q(especialidad_requerida='general')
            )
        
        data = []
        for estrategia in estrategias:
            data.append({
                'id': estrategia.id,
                'titulo': estrategia.titulo,
                'descripcion': estrategia.descripcion,
                'categoria': estrategia.categoria,
                'especialidad_requerida': estrategia.especialidad_requerida,
                'fecha_solicitud_mentoria': estrategia.fecha_solicitud_mentoria,
                'empresa_nombre': estrategia.empresa.razon_social,
                'empresa_ruc': estrategia.empresa.ruc,
                'empresa_telefono': estrategia.empresa.telefono,
                'empresa_correo': estrategia.empresa.correo,
                'empresa_sector': estrategia.empresa.sector if hasattr(estrategia.empresa, 'sector') else None,
                'mentor_puede_tomar': True,  # Todas las que se muestran se pueden tomar
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
        
        from django.utils import timezone
        
        try:
            estrategia = EstrategiaEmpresa.objects.get(id=pk, solicita_mentoria=True, mentor_asignado__isnull=True)
        except EstrategiaEmpresa.DoesNotExist:
            return Response({'error': 'Estrategia no encontrada o ya tiene mentor asignado.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verificar si el mentor puede tomar esta estrategia según las nuevas reglas de especialidad
        especialidad_mentor = request.user.especialidades
        especialidad_requerida = estrategia.especialidad_requerida
        
        puede_tomar = False
        
        if especialidad_mentor == 'general':
            # Los mentores "general" pueden tomar cualquier solicitud
            puede_tomar = True
        elif not especialidad_requerida or especialidad_requerida == '' or especialidad_requerida == 'general':
            # Las solicitudes sin especialidad específica o "general" pueden ser tomadas por cualquier mentor
            puede_tomar = True
        elif especialidad_mentor == especialidad_requerida:
            # La especialidad del mentor coincide exactamente con la requerida
            puede_tomar = True
        
        if not puede_tomar:
            especialidad_mentor_display = dict(request.user.ESPECIALIDADES_CHOICES).get(especialidad_mentor, especialidad_mentor)
            especialidad_requerida_display = dict(request.user.ESPECIALIDADES_CHOICES).get(especialidad_requerida, especialidad_requerida)
            return Response({
                'error': f'Tu especialidad ({especialidad_mentor_display}) no es compatible con la requerida ({especialidad_requerida_display}).'
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

class EstrategiasEmpresaMentorAPIView(APIView):
    """
    API para que los mentores vean las estrategias de una empresa específica donde son mentores
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, empresa_id):
        if request.user.rol != 'mentor':
            return Response({'error': 'Solo los mentores pueden acceder a esta información.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Verificar que el mentor tenga estrategias asignadas en esta empresa
            estrategias_mentor = EstrategiaEmpresa.objects.filter(
                mentor_asignado=request.user,
                empresa_id=empresa_id
            ).select_related('empresa')
            
            if not estrategias_mentor.exists():
                return Response({'error': 'No tienes estrategias asignadas en esta empresa.'}, status=status.HTTP_404_NOT_FOUND)
            
            empresa = estrategias_mentor.first().empresa
            
            data = {
                'empresa': {
                    'id': empresa.id,
                    'razon_social': empresa.razon_social,
                    'ruc': empresa.ruc,
                    'correo': empresa.correo,
                    'telefono': empresa.telefono,
                },
                'estrategias': []
            }
            
            for estrategia in estrategias_mentor:
                etapas_data = []
                etapas = estrategia.etapas.all().order_by('orden')
                
                for etapa in etapas:
                    actividades_data = []
                    actividades = etapa.actividades.all().order_by('orden')
                    
                    for actividad in actividades:
                        actividades_data.append({
                            'id': actividad.id,
                            'descripcion': actividad.descripcion,
                            'completada': actividad.completada,
                            'fecha_limite': actividad.fecha_limite,
                            'orden': actividad.orden
                        })
                    
                    etapas_data.append({
                        'id': etapa.id,
                        'titulo': etapa.titulo,
                        'descripcion': etapa.descripcion,
                        'orden': etapa.orden,
                        'actividades': actividades_data
                    })
                
                data['estrategias'].append({
                    'id': estrategia.id,
                    'titulo': estrategia.titulo,
                    'descripcion': estrategia.descripcion,
                    'categoria': estrategia.categoria,
                    'fecha_asignacion_mentor': estrategia.fecha_asignacion_mentor,
                    'etapas': etapas_data
                })
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ActividadMentorUpdateAPIView(APIView):
    """
    API para que los mentores puedan actualizar actividades de estrategias asignadas
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, actividad_id):
        if request.user.rol != 'mentor':
            return Response({'error': 'Solo los mentores pueden editar actividades.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from apps.empresas.models import Actividad as ActividadEmpresa
            
            actividad = ActividadEmpresa.objects.select_related(
                'etapa__estrategia'
            ).get(id=actividad_id)
            
            # Verificar que el mentor esté asignado a la estrategia
            if actividad.etapa.estrategia.mentor_asignado != request.user:
                return Response({'error': 'No tienes permisos para editar esta actividad.'}, status=status.HTTP_403_FORBIDDEN)
            
            # Actualizar campos permitidos
            if 'completada' in request.data:
                actividad.completada = request.data['completada']
            
            if 'descripcion' in request.data:
                actividad.descripcion = request.data['descripcion']
            
            if 'fecha_limite' in request.data:
                from datetime import datetime
                if request.data['fecha_limite']:
                    actividad.fecha_limite = datetime.strptime(request.data['fecha_limite'], '%Y-%m-%d').date()
                else:
                    actividad.fecha_limite = None
            
            actividad.save()
            
            return Response({
                'mensaje': 'Actividad actualizada correctamente.',
                'actividad': {
                    'id': actividad.id,
                    'descripcion': actividad.descripcion,
                    'completada': actividad.completada,
                    'fecha_limite': actividad.fecha_limite
                }
            }, status=status.HTTP_200_OK)
            
        except ActividadEmpresa.DoesNotExist:
            return Response({'error': 'Actividad no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DashboardMentorBotsDetailView(DetailView):
    model = ChatCategory
    template_name = "dashboard_mentor_bots_detail.html"
    context_object_name = "bot"
    pk_url_kwarg = "bot_id"

# === VISTAS PARA SISTEMA DE CHATBOTS ===
# Estrategias de un bot (Sistema de chatbots)
class BotEstrategiasListCreateView(generics.ListCreateAPIView):
    serializer_class = EstrategiaChatSerializer

    def get_queryset(self):
        bot_id = self.kwargs['bot_id']
        return EstrategiaChat.objects.filter(chatbot_id=bot_id)

    def perform_create(self, serializer):
        bot_id = self.kwargs['bot_id']
        serializer.save(chatbot_id=bot_id)

class EstrategiaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EstrategiaChat.objects.all()
    serializer_class = EstrategiaChatSerializer

# Etapas de una estrategia (Sistema de chatbots)
class EstrategiaEtapasListCreateView(generics.ListCreateAPIView):
    serializer_class = EtapaChatSerializer

    def get_queryset(self):
        estrategia_id = self.kwargs['estrategia_id']
        return EtapaChat.objects.filter(estrategia_id=estrategia_id)

    def perform_create(self, serializer):
        estrategia_id = self.kwargs['estrategia_id']
        serializer.save(estrategia_id=estrategia_id)

class EtapaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EtapaChat.objects.all()
    serializer_class = EtapaChatSerializer

# Actividades de una etapa (Sistema de chatbots)
class EtapaActividadesListCreateView(generics.ListCreateAPIView):
    serializer_class = ActividadChatSerializer

    def get_queryset(self):
        etapa_id = self.kwargs['etapa_id']
        return ActividadChat.objects.filter(etapa_id=etapa_id)

    def perform_create(self, serializer):
        etapa_id = self.kwargs['etapa_id']
        serializer.save(etapa_id=etapa_id)

class ActividadDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ActividadChat.objects.all()
    serializer_class = ActividadChatSerializer

# API para obtener especialidades disponibles
class EspecialidadesAPIView(APIView):
    """
    API para obtener las especialidades disponibles para mentores.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.users.models import Usuario
        especialidades = Usuario.get_especialidades_choices()
        
        # Convertir a formato dict para el frontend
        especialidades_dict = {}
        for codigo, nombre in especialidades:
            especialidades_dict[codigo] = nombre
        
        return Response({
            'especialidades': especialidades_dict,
            'choices': especialidades  # Lista de tuplas para formularios
        })

# Vista para el dashboard de estrategias del mentor
class DashboardEstrategiasView(TemplateView):
    template_name = 'dashboard_mentor_estrategias.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.request.user.is_authenticated and self.request.user.rol == 'mentor':
            # Obtener estrategias asignadas al mentor
            estrategias_mentor = EstrategiaEmpresa.objects.filter(
                mentor_asignado=self.request.user
            ).select_related('empresa').prefetch_related('etapas__actividades')
            context['estrategias_count'] = estrategias_mentor.count()
        return context

# API para obtener estrategias asignadas al mentor con detalles completos
class EstrategiasMentorAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.rol != 'mentor':
            return Response({'error': 'Solo los mentores pueden acceder a esta información.'}, status=status.HTTP_403_FORBIDDEN)
        
        estrategias = EstrategiaEmpresa.objects.filter(
            mentor_asignado=request.user
        ).select_related('empresa').prefetch_related('etapas__actividades')
        
        data = []
        for estrategia in estrategias:
            # Calcular progreso de la estrategia
            total_actividades = ActividadEmpresa.objects.filter(etapa__estrategia=estrategia).count()
            actividades_completadas = ActividadEmpresa.objects.filter(
                etapa__estrategia=estrategia, 
                completada=True
            ).count()
            progreso = (actividades_completadas / total_actividades * 100) if total_actividades > 0 else 0
            
            estrategia_data = {
                'id': estrategia.id,
                'titulo': estrategia.titulo,
                'descripcion': estrategia.descripcion,
                'categoria': estrategia.categoria,
                'estado': estrategia.estado,
                'fecha_inicio': estrategia.fecha_registro,  # Mapear fecha_registro a fecha_inicio
                'fecha_fin': estrategia.fecha_cumplimiento,  # Mapear fecha_cumplimiento a fecha_fin
                'fecha_asignacion_mentor': estrategia.fecha_asignacion_mentor,
                'progreso': round(progreso, 1),
                'total_etapas': estrategia.etapas.count(),
                'total_actividades': total_actividades,
                'actividades_completadas': actividades_completadas,
                'empresa': {
                    'id': estrategia.empresa.id,
                    'razon_social': estrategia.empresa.razon_social,
                    'ruc': estrategia.empresa.ruc,
                    'telefono': getattr(estrategia.empresa, 'telefono', ''),
                    'correo': estrategia.empresa.correo,
                    'sector': getattr(estrategia.empresa, 'sector', None)
                }
            }
            data.append(estrategia_data)
        
        return Response(data)

# API para obtener detalles completos de una estrategia específica del mentor
class EstrategiaDetailMentorAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            estrategia = EstrategiaEmpresa.objects.get(
                id=pk, 
                mentor_asignado=request.user
            )
        except EstrategiaEmpresa.DoesNotExist:
            return Response({'error': 'Estrategia no encontrada o no asignada a ti.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Obtener etapas con actividades
        etapas = EtapaEmpresa.objects.filter(estrategia=estrategia).prefetch_related('actividades')
        
        etapas_data = []
        for etapa in etapas:
            actividades_data = []
            for actividad in etapa.actividades.all():
                actividades_data.append({
                    'id': actividad.id,
                    'descripcion': actividad.descripcion,
                    'completada': actividad.completada,
                    'fecha_limite': actividad.fecha_limite,
                    'fecha_completada': actividad.fecha_completada,
                    'notas_mentor': getattr(actividad, 'notas_mentor', ''),
                })
            
            etapas_data.append({
                'id': etapa.id,
                'titulo': etapa.titulo,
                'nombre': etapa.nombre,
                'descripcion': etapa.descripcion,
                'actividades': actividades_data
            })
        
        # Calcular progreso
        total_actividades = sum(len(etapa['actividades']) for etapa in etapas_data)
        actividades_completadas = sum(
            sum(1 for act in etapa['actividades'] if act['completada']) 
            for etapa in etapas_data
        )
        progreso = (actividades_completadas / total_actividades * 100) if total_actividades > 0 else 0
        
        data = {
            'id': estrategia.id,
            'titulo': estrategia.titulo,
            'descripcion': estrategia.descripcion,
            'categoria': estrategia.categoria,
            'estado': estrategia.estado,
            'fecha_inicio': estrategia.fecha_registro,  # Mapear fecha_registro a fecha_inicio
            'fecha_fin': estrategia.fecha_cumplimiento,  # Mapear fecha_cumplimiento a fecha_fin
            'fecha_asignacion_mentor': estrategia.fecha_asignacion_mentor,
            'progreso': round(progreso, 1),
            'empresa': {
                'id': estrategia.empresa.id,
                'razon_social': estrategia.empresa.razon_social,
                'ruc': estrategia.empresa.ruc,
                'telefono': estrategia.empresa.telefono,
                'correo': estrategia.empresa.correo,
            },
            'etapas': etapas_data
        }
        
        return Response(data)
    
    def put(self, request, pk):
        """Permitir al mentor editar datos básicos de la estrategia"""
        try:
            estrategia = EstrategiaEmpresa.objects.get(
                id=pk, 
                mentor_asignado=request.user
            )
        except EstrategiaEmpresa.DoesNotExist:
            return Response({'error': 'Estrategia no encontrada o no asignada a ti.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Campos que el mentor puede editar
        campos_editables = ['descripcion', 'estado']
        
        for campo in campos_editables:
            if campo in request.data:
                setattr(estrategia, campo, request.data[campo])
        
        # Manejar fecha_fin especialmente (mapear a fecha_cumplimiento)
        if 'fecha_fin' in request.data:
            estrategia.fecha_cumplimiento = request.data['fecha_fin']
        
        estrategia.save()
        
        return Response({'mensaje': 'Estrategia actualizada correctamente.'})

# API para editar etapas
class EtapaMentorAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, pk):
        """Permitir al mentor editar una etapa"""
        try:
            etapa = EtapaEmpresa.objects.get(
                id=pk,
                estrategia__mentor_asignado=request.user
            )
        except EtapaEmpresa.DoesNotExist:
            return Response({'error': 'Etapa no encontrada o no tienes permisos.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Campos editables
        campos_editables = ['titulo', 'nombre', 'descripcion']
        
        for campo in campos_editables:
            if campo in request.data:
                setattr(etapa, campo, request.data[campo])
        
        etapa.save()
        
        return Response({'mensaje': 'Etapa actualizada correctamente.'})

# API actualizada para editar actividades con más campos
class ActividadMentorUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, actividad_id):
        try:
            # Verificar que la actividad pertenece a una estrategia del mentor
            actividad = ActividadEmpresa.objects.get(
                id=actividad_id,
                etapa__estrategia__mentor_asignado=request.user
            )
        except ActividadEmpresa.DoesNotExist:
            return Response({'error': 'Actividad no encontrada o no tienes permisos para editarla.'}, status=status.HTTP_404_NOT_FOUND)

        # Campos que se pueden actualizar
        campos_editables = ['descripcion', 'completada', 'fecha_limite', 'notas_mentor']
        
        from django.utils import timezone
        
        for campo in campos_editables:
            if campo in request.data:
                if campo == 'completada' and request.data[campo] and not actividad.completada:
                    # Si se marca como completada, actualizar fecha de completada
                    actividad.fecha_completada = timezone.now()
                elif campo == 'completada' and not request.data[campo]:
                    # Si se desmarca, limpiar fecha de completada
                    actividad.fecha_completada = None
                
                setattr(actividad, campo, request.data[campo])

        actividad.save()

        return Response({
            'mensaje': 'Actividad actualizada correctamente.',
            'actividad': {
                'id': actividad.id,
                'descripcion': actividad.descripcion,
                'completada': actividad.completada,
                'fecha_limite': actividad.fecha_limite,
                'fecha_completada': actividad.fecha_completada,
                'notas_mentor': getattr(actividad, 'notas_mentor', ''),
            }
        })