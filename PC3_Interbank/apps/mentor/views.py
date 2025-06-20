from django.views.generic import TemplateView, DetailView
from apps.empresas.models import Empresa
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.empresas.serializers import EmpresaSerializer, EmpresaDetalleSerializer
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

class DashboardMentorBotsView(TemplateView):
    template_name = "dashboard_mentor_bots.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = ChatCategory.objects.all()  # Pasamos las categorías al template
        return context

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