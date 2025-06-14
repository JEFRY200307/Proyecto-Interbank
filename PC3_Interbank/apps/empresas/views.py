from django.shortcuts import render, redirect, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from django.contrib.auth.hashers import check_password
from rest_framework.decorators import api_view, permission_classes
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail

from .serializers import EmpresaRegistroSerializer
from .models import Empresa
from apps.users.models import Usuario

class PanelEmpresaView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.rol != 'empresa':
            return Response({'error': 'Acceso no autorizado'}, status=403)
        return Response({
            "mensaje": f"Hola {request.user.nombre}, bienvenido al panel de empresa.",
            "rol": request.user.rol
        })
class EmpresaRegistroView(APIView):
    permission_classes = []  # Público

    def post(self, request):
        serializer = EmpresaRegistroSerializer(data=request.data)
        if serializer.is_valid():
            empresa = serializer.save()
            usuario = Usuario.objects.create_user(
                correo=empresa.correo,
                password=request.data.get('password'),
                nombre=empresa.representante,
                empresa=empresa,
                rol='empresa'
            )
            # Enviar correo de bienvenida
            send_mail(
                subject='Bienvenido a PC3',
                message=f'Hola {empresa.representante}, tu empresa "{empresa.razon_social}" ha sido registrada exitosamente en PC3.',
                from_email=None,  # Usará DEFAULT_FROM_EMAIL
                recipient_list=[empresa.correo],
                fail_silently=True,
            )
            return Response({'mensaje': 'Empresa registrada correctamente.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmpresaLoginView(APIView):
    permission_classes = []

    def post(self, request):
        correo = request.data.get('correo')
        password = request.data.get('password')
        user = authenticate(request, correo=correo, password=password)
        if user is not None:
            if user.empresa and user.empresa.estado == 'activo':
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'nombre': user.nombre,
                    'rol': user.rol,
                    'mensaje': 'Login exitoso.'
                })
            else:
                return Response({'error': 'Tu empresa aún no está activa o no tienes empresa asociada.'}, status=403)
        else:
            return Response({'error': 'Credenciales incorrectas.'}, status=400)
class PerfilEmpresaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        empresa = request.user.empresa
        serializer = EmpresaRegistroSerializer(empresa)
        return Response(serializer.data)

    def put(self, request):
        empresa = request.user.empresa
        serializer = EmpresaRegistroSerializer(empresa, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def eliminar_empresa(request, empresa_id):
    empresa = get_object_or_404(Empresa, id=empresa_id)
    empresa.delete()
    return Response({'mensaje': 'Empresa eliminada correctamente.'})

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def perfil_empresa(request):
    empresa = request.user.empresa
    if request.method == "PUT":
        serializer = EmpresaRegistroSerializer(empresa, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'mensaje': 'Perfil actualizado correctamente.'})
        return Response(serializer.errors, status=400)
    serializer = EmpresaRegistroSerializer(empresa)
    return Response(serializer.data)

@staff_member_required
def lista_empresas(request):
    empresas = Empresa.objects.all()
    return render(request, 'lista_empresas.html', {'empresas': empresas})

@staff_member_required
def eliminar_empresa(request, empresa_id):
    empresa = get_object_or_404(Empresa, id=empresa_id)
    empresa.delete()
    return redirect('lista_empresas')

def home(request):
    return render(request, 'index.html')

def registro_empresa(request):
    return render(request, 'registro_empresa.html')

def login_empresa(request):
    return render(request, 'login.html')

