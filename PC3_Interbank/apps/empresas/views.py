from django.shortcuts import render, redirect, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from django.contrib.auth.hashers import check_password
from rest_framework.decorators import api_view, permission_classes
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail

from .serializers import EmpresaRegistroSerializer, EmpresaPerfilSerializer
from .models import Empresa, TicketSoporte
from apps.documentos.models import Documento, Firma
from django.db.models import Avg, F, ExpressionWrapper, DurationField
from apps.users.models import Usuario
from .services import validar_ruc
from rest_framework import generics, permissions
from .models import Estrategia
from .serializers import EstrategiaSerializer

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
        ruc = request.data.get('ruc')
        correo = request.data.get('correo')
        representante = request.data.get('representante')
        password = request.data.get('password')

        # Validar campos mínimos
        if not ruc or not correo or not representante or not password:
            return Response({'error': 'Todos los campos son obligatorios.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validar si el RUC ya está registrado en la base de datos
        if Empresa.objects.filter(ruc=ruc).exists():
            return Response({'error': 'Ya existe una empresa registrada con este RUC.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validar si el correo ya está registrado
        if Empresa.objects.filter(correo=correo).exists():
            return Response({'error': 'Ya existe una empresa registrada con este correo.'}, status=status.HTTP_400_BAD_REQUEST)

        # Consultar y validar RUC
        resultado = validar_ruc(ruc)
        if not resultado.get("valido"):
            return Response({'error': 'RUC inválido o no activo.', 'detalle': resultado.get("error")}, status=status.HTTP_400_BAD_REQUEST)

        # Combina los datos del formulario con los datos de la API
        empresa_data = {
            "ruc": ruc,
            "correo": correo,
            "representante": representante,
            "password": password,
            "razon_social": resultado.get("razon_social"),
            "direccion": resultado.get("direccion"),
            "departamento": resultado.get("departamento"),
            "provincia": resultado.get("provincia"),
            "distrito": resultado.get("distrito"),
            "telefono": resultado.get("telefono"),
            # Agrega aquí otros campos de tu modelo si es necesario
        }

        print("Datos que se enviarán al serializer:", empresa_data)
        serializer = EmpresaRegistroSerializer(data=empresa_data)
        if serializer.is_valid():
            empresa = serializer.save()
            # Crea el usuario asociado si corresponde
            usuario = Usuario.objects.create_user(
                correo=empresa.correo,
                password=password,
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
            # Solo exige empresa activa si el rol NO es mentor
            if user.rol == 'mentor' or (user.empresa and user.empresa.estado == 'activo'):
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
        
class EmpresaLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()  # Agrega el token a la blacklist
            return Response({"mensaje": "Sesión cerrada correctamente."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": "Token inválido o ya fue cerrado."}, status=status.HTTP_400_BAD_REQUEST)
        
class PerfilEmpresaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        empresa = request.user.empresa
        serializer = EmpresaPerfilSerializer(empresa)
        return Response(serializer.data)

    def put(self, request):
        empresa = request.user.empresa
        serializer = EmpresaPerfilSerializer(empresa, data=request.data, partial=True)
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



#analiticas y reportes

class KPIsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        empresa = request.user.empresa

        # Número de documentos generados
        total_docs = Documento.objects.filter(empresa=empresa).count()

        # Número de documentos firmados (al menos una firma en estado 'firmado')
        firmados = Documento.objects.filter(
            empresa=empresa,
            firmas__estado='firmado'
        ).distinct().count()

        # Tiempo medio de firma (en minutos)
        firmas_firmadas = Firma.objects.filter(
            documento__empresa=empresa,
            estado='firmado',
            fecha_firma__isnull=False
        ).annotate(
            tiempo_firma=ExpressionWrapper(
                F('fecha_firma') - F('documento__fecha_subida'),
                output_field=DurationField()
            )
        )
        if firmas_firmadas.exists():
            tiempo_medio = firmas_firmadas.aggregate(
                promedio=Avg('tiempo_firma')
            )['promedio']
            tiempo_medio_min = round(tiempo_medio.total_seconds() / 60, 2) if tiempo_medio else 0
        else:
            tiempo_medio_min = 0

        # Tickets soporte abiertos vs cerrados (si tienes el modelo)
        abiertos = TicketSoporte.objects.filter(empresa=empresa, estado='abierto').count() if 'TicketSoporte' in globals() else 0
        cerrados = TicketSoporte.objects.filter(empresa=empresa, estado='cerrado').count() if 'TicketSoporte' in globals() else 0

        return Response({
            "total_documentos": total_docs,
            "documentos_firmados": firmados,
            "tiempo_medio_firma": tiempo_medio_min,
            "tickets_abiertos": abiertos,
            "tickets_cerrados": cerrados
        })

class EstrategiaListCreateView(generics.ListCreateAPIView):
    serializer_class = EstrategiaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Estrategia.objects.filter(usuario=self.request.user).order_by('-fecha_registro')

    def perform_create(self, serializer):
        print("JSON recibido en el POST de estrategia:", self.request.data)
        serializer.save(
            usuario=self.request.user,
            empresa=self.request.user.empresa
        )

class EstrategiaDetailView(generics.RetrieveAPIView):
    queryset = Estrategia.objects.all()
    serializer_class = EstrategiaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Solo permite ver estrategias del usuario autenticado
        return super().get_queryset().filter(usuario=self.request.user)

