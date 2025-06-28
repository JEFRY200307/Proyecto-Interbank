from django.urls import path
from django.views.generic import TemplateView
from .views import (
    ActividadDetailView,
    BotEstrategiasListCreateView,
    DashboardMentorView,
    DashboardMentorBotsView,
    DashboardEstrategiasView,
    EmpresasMentorAPIView,
    EmpresaDetalleMentorAPIView,
    EstrategiasSolicitanMentoriaAPIView,
    EstrategiasEmpresaMentorAPIView,
    EstrategiasMentorAPIView,
    EstrategiaDetailMentorAPIView,
    EtapaMentorAPIView,
    ActividadMentorUpdateAPIView,
    SolicitudesMentoriaView,
    AceptarMentoriaEstrategiaAPIView,
    DashboardMentorBotsDetailView,
    EstrategiaDetailView,
    EstrategiaEtapasListCreateView,
    EtapaActividadesListCreateView,
    EtapaDetailView,
    EspecialidadesAPIView,
    # ...otros
)

urlpatterns = [
    path('dashboard/', DashboardMentorView.as_view(), name='dashboard_mentor'),
    path('dashboard/estrategias/', DashboardEstrategiasView.as_view(), name='dashboard_mentor_estrategias'),
    path('dashboard/bots/', DashboardMentorBotsView.as_view(), name='dashboard_mentor_bots'),
    path('dashboard/bots/<int:bot_id>/', DashboardMentorBotsDetailView.as_view(), name='dashboard_mentor_bots_detail'),
    path('dashboard/solicitudes/', SolicitudesMentoriaView.as_view(), name='mentor_solicitudes'),
    
    # APIs para empresas
    path('api/empresas/', EmpresasMentorAPIView.as_view(), name='mentor_empresas_api'),
    path('api/empresas/<int:pk>/', EmpresaDetalleMentorAPIView.as_view(), name='mentor_empresa_detalle_api'),
    path('api/empresas/<int:empresa_id>/estrategias/', EstrategiasEmpresaMentorAPIView.as_view(), name='mentor_empresa_estrategias_api'),
    
    # APIs para estrategias del mentor
    path('api/mis-estrategias/', EstrategiasMentorAPIView.as_view(), name='mentor_estrategias_api'),
    path('api/estrategia/<int:pk>/', EstrategiaDetailMentorAPIView.as_view(), name='mentor_estrategia_detail_api'),
    
    # APIs para etapas y actividades
    path('api/etapa/<int:pk>/', EtapaMentorAPIView.as_view(), name='mentor_etapa_update_api'),
    path('api/actividad/<int:actividad_id>/', ActividadMentorUpdateAPIView.as_view(), name='mentor_actividad_update_api'),
    
    # APIs para solicitudes de mentoría
    path('api/solicitudes-mentoria/', EstrategiasSolicitanMentoriaAPIView.as_view(), name='mentor_estrategias_solicitan_api'),
    path('api/aceptar-mentoria/<int:pk>/', AceptarMentoriaEstrategiaAPIView.as_view(), name='mentor_aceptar_mentoria_estrategia_api'),
    path('api/especialidades/', EspecialidadesAPIView.as_view(), name='mentor_especialidades_api'),
    
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