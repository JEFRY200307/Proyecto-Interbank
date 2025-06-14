from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, permissions
from .serializers import CustomTokenObtainPairSerializer,UsuarioSerializer
from .models import Usuario
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.shortcuts import render

def dashboard_panel(request):
    rol = getattr(request.user, 'rol', None)
    return render(request, 'dashboard_base.html', {'rol': rol})

def dashboard_perfil(request):
    rol = getattr(request.user, 'rol', None)
    return render(request, 'perfil_y_usuarios/perfil.html', {'rol': rol})

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class DashboardPerfilView(LoginRequiredMixin, TemplateView):
    template_name = "perfil/perfil.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'perfil'
        context['active_tab'] = 'perfil'
        return context

class DashboardUsuariosView(LoginRequiredMixin, TemplateView):
    template_name = "perfil/usuarios.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'perfil'
        context['active_tab'] = 'usuarios'
        return context
    
class UsuarioListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        empresa = self.request.user.empresa
        return Usuario.objects.filter(empresa=empresa).exclude(rol='superadmin')

    def perform_create(self, serializer):
        # Asocia el usuario a la empresa del usuario autenticado
        serializer.save(empresa=self.request.user.empresa)

class UsuarioRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- CUENTA ---
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def cuenta_usuario(request):
    user = request.user
    if request.method == 'GET':
        return Response({
            'nombre': user.nombre,
            'correo': user.correo,
            'rol': user.rol,
        })
    elif request.method == 'PUT':
        data = request.data
        user.nombre = data.get('nombre', user.nombre)
        user.correo = data.get('correo', user.correo)
        if data.get('password'):
            user.set_password(data['password'])
        user.save()
        return Response({'detail': 'Cuenta actualizada correctamente.'})
