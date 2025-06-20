from django.urls import path
from django.views.generic import TemplateView
from .views import (
    ActividadDetailView,
    BotEstrategiasListCreateView,
    DashboardMentorView,
    DashboardMentorBotsView,
    EmpresasMentorAPIView,
    EmpresaDetalleMentorAPIView,
    EmpresasSolicitanMentoriaAPIView,
    AceptarMentoriaAPIView,
    DashboardMentorBotsDetailView,
    EstrategiaDetailView,
    EstrategiaEtapasListCreateView,
    EtapaActividadesListCreateView,
    EtapaDetailView,
    # ...otros
)

urlpatterns = [
    path('dashboard/', DashboardMentorView.as_view(), name='dashboard_mentor'),
    path('dashboard/bots/', DashboardMentorBotsView.as_view(), name='dashboard_mentor_bots'),
    path('dashboard/bots/<int:bot_id>/', DashboardMentorBotsDetailView.as_view(), name='dashboard_mentor_bots_detail'),  # Esta debe existir
    path('api/empresas/', EmpresasMentorAPIView.as_view(), name='mentor_empresas_api'),
    path('api/empresas/<int:pk>/', EmpresaDetalleMentorAPIView.as_view(), name='mentor_empresa_detalle_api'),
    path('dashboard/solicitudes/', TemplateView.as_view(template_name="mentor_solicitudes.html"), name='mentor_solicitudes'),
    path('api/empresas-solicitan/', EmpresasSolicitanMentoriaAPIView.as_view(), name='mentor_empresas_solicitan_api'),
    path('api/empresas/<int:pk>/aceptar_mentoria/', AceptarMentoriaAPIView.as_view(), name='mentor_aceptar_mentoria_api'),
    # Estrategias de un bot
    path('api/bots/<int:bot_id>/estrategias/', BotEstrategiasListCreateView.as_view(), name='bot_estrategias_api'),
    path('api/estrategias/<int:pk>/', EstrategiaDetailView.as_view(), name='estrategia_detail_api'),
    # Etapas de una estrategia
    path('api/estrategias/<int:estrategia_id>/etapas/', EstrategiaEtapasListCreateView.as_view(), name='estrategia_etapas_api'),
    path('api/etapas/<int:pk>/', EtapaDetailView.as_view(), name='etapa_detail_api'),
    # Actividades de una etapa
    path('api/etapas/<int:etapa_id>/actividades/', EtapaActividadesListCreateView.as_view(), name='etapa_actividades_api'),
    path('api/actividades/<int:pk>/', ActividadDetailView.as_view(), name='actividad_detail_api'),
]