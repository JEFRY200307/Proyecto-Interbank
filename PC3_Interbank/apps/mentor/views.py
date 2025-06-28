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


class DashboardMentorBotsView(TemplateView):
    template_name = "dashboard_mentor_bots.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = ChatCategory.objects.all()  # Pasamos las categorías al template
        return context

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