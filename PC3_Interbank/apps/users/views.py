from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, permissions
from .serializers import CustomTokenObtainPairSerializer,UsuarioSerializer
from .models import Usuario
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from .serializers import UsuarioSerializer
from django.shortcuts import render, redirect, get_object_or_404
from django.core.mail import send_mail
import random
from django.utils.crypto import get_random_string
from rest_framework.permissions import BasePermission
from apps.empresas.models import Estrategia
from django.contrib.auth.decorators import login_required

User = get_user_model()

def dashboard_panel(request):
    rol = getattr(request.user, 'rol', None)
    return render(request, 'dashboard_base.html', {'rol': rol})

def dashboard_perfil(request):
    rol = getattr(request.user, 'rol', None)
    return render(request, 'perfil_y_usuarios/perfil.html', {'rol': rol})

def dashboard_usuarios(request):
    rol = getattr(request.user, 'rol', None)
    return render(request, 'perfil_y_usuarios/usuarios.html', {'rol': rol})



def dashboard_estrategias(request):
    return render(request, 'dashboard_estrategias.html')

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
    
class IsRepresentante(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'rol_interno', None) == 'representante'

class UsuarioListCreateAPIView(generics.ListCreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsRepresentante]

    def get_queryset(self):
        empresa = self.request.user.empresa
        return Usuario.objects.filter(empresa=empresa).exclude(rol='superadmin')

    def perform_create(self, serializer):
        password = self.request.data.get('password')
        # Generar PIN aleatorio de 6 dígitos
        pin = str(random.randint(100000, 999999))
        usuario = serializer.save(empresa=self.request.user.empresa)
        usuario.set_password(password)
        usuario.set_clave_firma(pin)
        usuario.save()
        # Enviar correo con ambos datos
        send_mail(
            'Tus credenciales de acceso',
            f'Hola {usuario.nombre},\n\nTu contraseña inicial es: {password}\nTu PIN de firma electrónica es: {pin}\n\nPor favor, cambia tu contraseña después de iniciar sesión.',
            'no-reply@tuapp.com',
            [usuario.correo],
            fail_silently=False,
        )

class UsuarioRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsRepresentante]

class UsuariosEmpresaAPIView(generics.ListAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(empresa=self.request.user.empresa)
# --- CUENTA ---
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def cuenta_usuario(request):
    user = request.user
    if request.method == 'GET':
        data = {
            "id": user.id,
            "correo": user.correo,
            "rol": user.rol,
            "rol_interno": user.rol_interno,
            "nombre": user.nombre,
            "dni": user.dni,
        }
        # Cambia aquí: incluye datos de empresa si el usuario es representante o administrador
        if user.rol_interno in ["representante", "administrador"] and user.empresa:
            data["empresa"] = {
                "razon_social": user.empresa.razon_social,
                "ruc": user.empresa.ruc,
                "representante": user.empresa.representante,
                "direccion": user.empresa.direccion,
                "departamento": user.empresa.departamento,
                "provincia": user.empresa.provincia,
                "distrito": user.empresa.distrito,
                "telefono": user.empresa.telefono,
                "objetivo": user.empresa.objetivo,
                "mision": user.empresa.mision,
                "vision": user.empresa.vision,
                "valores": user.empresa.valores,
                "historia": user.empresa.historia,
                "web": user.empresa.web,
                "facebook": user.empresa.facebook,
                "instagram": user.empresa.instagram,
            }
        return Response(data)
    elif request.method == 'PUT':
        serializer = UsuarioSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"mensaje": "Perfil actualizado correctamente."})
        return Response(serializer.errors, status=400)

@login_required
def dashboard_actividades(request, pk):
    # Buscamos la estrategia por su ID (pk) y nos aseguramos que pertenezca al usuario logueado
    estrategia = get_object_or_404(Estrategia, pk=pk, usuario=request.user)
    
    # Renderizamos el template de actividades, pasándole la estrategia encontrada
    return render(request, 'dashboard_actividades.html', {'estrategia': estrategia})