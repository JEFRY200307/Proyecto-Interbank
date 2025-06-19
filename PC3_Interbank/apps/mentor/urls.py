from django.urls import path
from django.views.generic import TemplateView
from .views import (
    DashboardMentorView,
    EmpresasMentorAPIView,
    EmpresaDetalleMentorAPIView,
    EmpresasSolicitanMentoriaAPIView,
    AceptarMentoriaAPIView,
    # ...otros
)

urlpatterns = [
    path('dashboard/', DashboardMentorView.as_view(), name='dashboard_mentor'),
    path('api/empresas/', EmpresasMentorAPIView.as_view(), name='mentor_empresas_api'),
    path('api/empresas/<int:pk>/', EmpresaDetalleMentorAPIView.as_view(), name='mentor_empresa_detalle_api'),
    path('solicitudes/', TemplateView.as_view(template_name="mentor_solicitudes.html"), name='mentor_solicitudes'),
    path('api/empresas-solicitan/', EmpresasSolicitanMentoriaAPIView.as_view(), name='mentor_empresas_solicitan_api'),
    path('api/empresas/<int:pk>/aceptar_mentoria/', AceptarMentoriaAPIView.as_view(), name='mentor_aceptar_mentoria_api'),
]
