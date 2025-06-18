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
from django.shortcuts import render
from django.core.mail import send_mail
import random
from django.utils.crypto import get_random_string

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
    
class UsuarioListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = UsuarioSerializer
    queryset = Usuario.objects.all()
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [permissions.IsAuthenticated]

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
    data = {
        "correo": user.correo,
        "rol": user.rol,
        "nombre": user.nombre,
        "dni": user.dni,
    }
    # Si es empresa, agrega datos de empresa
    if user.rol == "empresa" and user.empresa:
        data["empresa"] = {
            "razon_social": user.empresa.razon_social,
            "ruc": user.empresa.ruc,
            "representante": user.empresa.representante,
            "direccion": user.empresa.direccion,
            "telefono": user.empresa.telefono,
        }
    return Response(data)
