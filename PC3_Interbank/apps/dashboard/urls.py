from django.urls import path
from .views import DashboardHomeView
from apps.users.views import DashboardPerfilView
from apps.users.views import DashboardUsuariosView
from .views import (
    DashboardDocumentosView,
    DashboardFirmasView,
    DashboardChatView,
    DashboardEstrategiasView,
    DashboardReportesView,
    DashboardNotificacionesView,
    DashboardIntegracionesView,
    DashboardRecursosView,
    DashboardConfiguracionView,
    # ...otros
)


urlpatterns = [
    path('', DashboardHomeView.as_view(), name='dashboard_home'),
    path('perfil/', DashboardPerfilView.as_view(), name='dashboard_perfil'),
    path('perfil/usuarios/', DashboardUsuariosView.as_view(), name='dashboard_usuarios'),
    path('documentos/', DashboardDocumentosView.as_view(), name='dashboard_documentos'),
    path('firmas/', DashboardFirmasView.as_view(), name='dashboard_firmas'),
    path('chat/', DashboardChatView.as_view(), name='dashboard_chat'),
    path('estrategias/', DashboardEstrategiasView.as_view(), name='dashboard_estrategias'),
    path('reportes/', DashboardReportesView.as_view(), name='dashboard_reportes'),
    path('integraciones/', DashboardIntegracionesView.as_view(), name='dashboard_integraciones'),
    path('recursos/', DashboardRecursosView.as_view(), name='dashboard_recursos'),
    path('notificaciones/', DashboardNotificacionesView.as_view(), name='dashboard_notificaciones'),
    path('configuracion/', DashboardConfiguracionView.as_view(), name='dashboard_configuracion'),
    ]