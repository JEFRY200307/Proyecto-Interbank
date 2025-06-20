from django.urls import path
from .views import (
    home, registro_empresa, login_empresa,
    EmpresaRegistroView, EmpresaLoginView, PanelEmpresaView,PerfilEmpresaAPIView,EmpresaLogoutView,
    perfil_empresa, eliminar_empresa, lista_empresas, EstrategiaListCreateView, EstrategiaDetailView, EtapaDetailView, ActividadDetailView
)

urlpatterns = [
    path('', home, name='home'),
    path('registro-empresa/', registro_empresa, name='registro_empresa_form'),
    path('login/', login_empresa, name='login_empresa'),  # Solo para mostrar el HTML
    path('logout/', EmpresaLogoutView.as_view(), name='empresa_logout'),
    # API endpoints
    path('api/registro/', EmpresaRegistroView.as_view(), name='empresa_registro_api'),
    path('api/login/', EmpresaLoginView.as_view(), name='empresa_login_api'),
    path('api/panel-empresa/', PanelEmpresaView.as_view(), name='panel_empresa_api'),
    path('api/perfil/', PerfilEmpresaAPIView.as_view(), name='perfil_empresa_api'),
    path('api/estrategias/', EstrategiaListCreateView.as_view(), name='estrategias_api'),
    path('api/estrategias/<int:pk>/', EstrategiaDetailView.as_view(), name='estrategia_detail_api'),  # <-- agrega esto
    path('api/etapas/<int:pk>/', EtapaDetailView.as_view(), name='etapa_detail_api'),
    path('api/actividades/<int:pk>/', ActividadDetailView.as_view(), name='actividad_detail_api'),
    # Admin/gestion
    path('admin/empresas/', lista_empresas, name='lista_empresas'),
    path('admin/empresas/eliminar/<int:empresa_id>/', eliminar_empresa, name='eliminar_empresa'),
]