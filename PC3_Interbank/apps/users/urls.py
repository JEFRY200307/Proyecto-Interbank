from django.urls import path
from .views import UsuarioListCreateAPIView,cuenta_usuario,dashboard_panel,dashboard_perfil, UsuarioRetrieveUpdateDestroyAPIView


urlpatterns = [
    # Cuenta de usuario (ver y editar)
   path('dashboard/', dashboard_panel, name='dashboard_panel'), 
   path('dashboard/perfil/', dashboard_perfil, name='dashboard_perfil'),
   path('api/cuenta/', cuenta_usuario, name='cuenta_usuario'),
   path('api/usuarios/', UsuarioListCreateAPIView.as_view(), name='usuarios_api'),
   path('api/usuarios/<int:pk>/', UsuarioRetrieveUpdateDestroyAPIView.as_view(), name='usuario_api'),
]