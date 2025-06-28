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
from .models import Estrategia, Etapa, Actividad
from .serializers import EstrategiaSerializer, EtapaSerializer, ActividadSerializer, ActividadUpdateSerializer

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

        # Autenticamos al usuario con las credenciales
        user = authenticate(request, username=correo, password=password)

        if user is not None:
            # ¡LÍNEA CLAVE! Inicia la sesión en Django para este usuario.
            # Esto crea la cookie de sesión que las vistas con @login_required necesitan.
            login(request, user)

            # Ahora, generamos los tokens JWT como ya lo hacías
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'rol': user.rol,
                'nombre': user.nombre,
            }, status=status.HTTP_200_OK)
        else:
            # Si la autenticación falla, devolvemos un error
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)
        
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

class SolicitarMentoriaEstrategiaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        estrategia_id = request.data.get('estrategia_id')
        especialidad_requerida = request.data.get('especialidad_requerida')
        
        if not estrategia_id:
            return Response({'error': 'El ID de la estrategia es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not especialidad_requerida:
            return Response({'error': 'La especialidad requerida es obligatoria.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            estrategia = Estrategia.objects.get(id=estrategia_id, empresa=request.user.empresa)
        except Estrategia.DoesNotExist:
            return Response({'error': 'Estrategia no encontrada o no pertenece a tu empresa.'}, status=status.HTTP_404_NOT_FOUND)
        
        if estrategia.solicita_mentoria:
            return Response({'error': 'Esta estrategia ya tiene una solicitud de mentoría activa.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if estrategia.mentor_asignado:
            return Response({'error': 'Esta estrategia ya tiene un mentor asignado.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar la estrategia
        from django.utils import timezone
        estrategia.solicita_mentoria = True
        estrategia.especialidad_requerida = especialidad_requerida
        estrategia.fecha_solicitud_mentoria = timezone.now()
        estrategia.save()
        
        return Response({
            'mensaje': 'Solicitud de mentoría enviada correctamente para la estrategia.',
            'estrategia': estrategia.titulo,
            'especialidad': especialidad_requerida
        }, status=status.HTTP_200_OK)
    
    def delete(self, request):
        estrategia_id = request.data.get('estrategia_id')
        
        if not estrategia_id:
            return Response({'error': 'El ID de la estrategia es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            estrategia = Estrategia.objects.get(id=estrategia_id, empresa=request.user.empresa)
        except Estrategia.DoesNotExist:
            return Response({'error': 'Estrategia no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        
        if estrategia.mentor_asignado:
            return Response({'error': 'No se puede cancelar la solicitud, ya hay un mentor asignado.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cancelar solicitud
        estrategia.solicita_mentoria = False
        estrategia.especialidad_requerida = None
        estrategia.fecha_solicitud_mentoria = None
        estrategia.save()
        
        return Response({'mensaje': 'Solicitud de mentoría cancelada para la estrategia.'}, status=status.HTTP_200_OK)

# Nuevas vistas para manejar mentoría por estrategia específica
class EstrategiaSolicitarMentoriaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, estrategia_id):
        especialidad_requerida = request.data.get('especialidad_requerida', 'general')
        
        try:
            estrategia = Estrategia.objects.get(id=estrategia_id, empresa=request.user.empresa)
        except Estrategia.DoesNotExist:
            return Response({'error': 'Estrategia no encontrada o no pertenece a tu empresa.'}, status=status.HTTP_404_NOT_FOUND)
        
        if estrategia.solicita_mentoria:
            return Response({'error': 'Esta estrategia ya tiene una solicitud de mentoría activa.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if estrategia.mentor_asignado:
            return Response({'error': 'Esta estrategia ya tiene un mentor asignado.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar la estrategia
        from django.utils import timezone
        estrategia.solicita_mentoria = True
        estrategia.especialidad_requerida = especialidad_requerida
        estrategia.fecha_solicitud_mentoria = timezone.now()
        estrategia.save()
        
        return Response({
            'mensaje': 'Solicitud de mentoría enviada correctamente.',
            'estrategia': estrategia.titulo,
            'especialidad': especialidad_requerida
        }, status=status.HTTP_200_OK)

class EstrategiaCancelarMentoriaAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, estrategia_id):
        try:
            estrategia = Estrategia.objects.get(id=estrategia_id, empresa=request.user.empresa)
        except Estrategia.DoesNotExist:
            return Response({'error': 'Estrategia no encontrada o no pertenece a tu empresa.'}, status=status.HTTP_404_NOT_FOUND)
        
        if not estrategia.solicita_mentoria:
            return Response({'error': 'Esta estrategia no tiene una solicitud de mentoría activa.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if estrategia.mentor_asignado:
            return Response({'error': 'No puedes cancelar la solicitud cuando ya hay un mentor asignado.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cancelar la solicitud
        estrategia.solicita_mentoria = False
        estrategia.especialidad_requerida = None
        estrategia.fecha_solicitud_mentoria = None
        estrategia.save()
        
        return Response({
            'mensaje': 'Solicitud de mentoría cancelada correctamente.',
            'estrategia': estrategia.titulo
        }, status=status.HTTP_200_OK)
  
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
class ActividadListByEstrategiaView(generics.ListAPIView):
    """
    Devuelve una lista de actividades filtradas por una estrategia específica.
    Incluye una comprobación de permisos para asegurar que el usuario
    (mentor o empresa) tiene acceso a la estrategia padre.
    """
    serializer_class = ActividadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        estrategia_id = self.kwargs['estrategia_pk'] # Obtiene el ID de la estrategia desde la URL

        # 1. Comprobación de seguridad: ¿El usuario tiene permiso para ver esta estrategia?
        estrategia_accesible = Estrategia.objects.filter(pk=estrategia_id)
        if hasattr(user, 'empresa'):
            estrategia_accesible = estrategia_accesible.filter(empresa=user.empresa)
        elif user.rol == 'mentor':
            estrategia_accesible = estrategia_accesible.filter(mentor_asignado=user)
        else:
            return Actividad.objects.none() # No es empresa ni mentor

        # Si la comprobación falla (la estrategia no es accesible), no devolver nada.
        if not estrategia_accesible.exists():
            return Actividad.objects.none()

        # 2. Si la seguridad pasa, devuelve las actividades de esa estrategia.
        return Actividad.objects.filter(etapa__estrategia_id=estrategia_id).order_by('id')
    
class EstrategiaListCreateView(generics.ListCreateAPIView):
    serializer_class = EstrategiaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Manejar tanto Request (DRF) como HttpRequest (Django)
        if hasattr(self.request, 'query_params'):
            # Request de Django REST Framework
            empresa_id = self.request.query_params.get('empresa_id')
        else:
            # HttpRequest de Django normal
            empresa_id = self.request.GET.get('empresa_id')

        # Si un mentor pide las estrategias de una empresa específica...
        if empresa_id and user.rol == 'mentor':
            # ...devuélvelas SÓLO SI el mentor está asignado a esa empresa.
            return Estrategia.objects.filter(empresa_id=empresa_id, mentor_asignado=user).order_by('-fecha_registro')
        
        # Si un usuario de empresa pide sus propias estrategias...
        elif hasattr(user, 'empresa') and user.empresa:
            # ...devuelve solo las de su empresa (comportamiento original).
            return Estrategia.objects.filter(empresa=user.empresa).order_by('-fecha_registro')

        # Si no es ninguno de los casos, no devolver nada por seguridad.
        return Estrategia.objects.none()

    def perform_create(self, serializer):
        print("JSON recibido en el POST de estrategia:", self.request.data)
        serializer.save(
            usuario=self.request.user,
            empresa=self.request.user.empresa
        )

class EstrategiaDetailView(generics.RetrieveUpdateAPIView):
    queryset = Estrategia.objects.all()
    serializer_class = EstrategiaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Si el usuario es una empresa, solo puede ver/editar sus propias estrategias.
        if hasattr(user, 'empresa'):
            return Estrategia.objects.filter(empresa=user.empresa)
        # Si el usuario es un mentor, puede ver/editar las estrategias de las empresas que asesora.
        elif user.rol == 'mentor':
            return Estrategia.objects.filter(mentor_asignado=user)
        # Si es otro tipo de usuario (ej. admin), podría ver todas.
        # Por seguridad, si no es empresa ni mentor, no devolvemos nada.
        return Estrategia.objects.none()
    
class EtapaDetailView(generics.RetrieveUpdateAPIView):
    queryset = Etapa.objects.all()
    serializer_class = EtapaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'empresa'):
            return Etapa.objects.filter(estrategia__empresa=user.empresa)
        elif user.rol == 'mentor':
            return Etapa.objects.filter(estrategia__mentor_asignado=user)
        return Etapa.objects.none()

class ActividadDetailView(generics.RetrieveUpdateAPIView):
    queryset = Actividad.objects.all()
    serializer_class = ActividadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'empresa'):
            return Actividad.objects.filter(etapa__estrategia__empresa=user.empresa)
        elif user.rol == 'mentor':
            return Actividad.objects.filter(etapa__estrategia__mentor_asignado=user)
        return Actividad.objects.none()
    
class ActividadUpdateView(generics.UpdateAPIView):
    """
    Endpoint para actualizar el estado 'completada' de una actividad.
    """
    serializer_class = ActividadUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Asegura que el usuario solo pueda modificar actividades de sus propias estrategias."""
        return Actividad.objects.filter(etapa__estrategia__usuario=self.request.user)
    
class EtapaListByEstrategiaView(generics.ListAPIView):
    serializer_class = EtapaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        estrategia_id = self.kwargs['estrategia_id']
        qs = Etapa.objects.filter(estrategia_id=estrategia_id)
        if hasattr(user, 'empresa'):
            qs = qs.filter(estrategia__empresa=user.empresa)
        elif user.rol == 'mentor':
            qs = qs.filter(estrategia__mentor_asignado=user)
        else:
            return Etapa.objects.none()
        return qs.order_by('id')
    
class ActividadListByEtapaView(generics.ListAPIView):
    serializer_class = ActividadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        etapa_id = self.kwargs['etapa_id']
        qs = Actividad.objects.filter(etapa_id=etapa_id)
        if hasattr(user, 'empresa'):
            qs = qs.filter(etapa__estrategia__empresa=user.empresa)
        elif user.rol == 'mentor':
            qs = qs.filter(etapa__estrategia__mentor_asignado=user)
        else:
            return Actividad.objects.none()
        return qs.order_by('id')

class EstrategiasSolicitanMentoriaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.rol != 'mentor':
            return Response({'error': 'Solo los mentores pueden acceder a esta información.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Filtrar por especialidad del mentor si tiene una
        especialidad_mentor = request.user.especialidades
        
        if especialidad_mentor:
            estrategias = Estrategia.objects.filter(
                solicita_mentoria=True,
                mentor_asignado__isnull=True,
                especialidad_requerida=especialidad_mentor
            ).select_related('empresa', 'usuario')
        else:
            # Si el mentor no tiene especialidad definida, mostrar todas
            estrategias = Estrategia.objects.filter(
                solicita_mentoria=True,
                mentor_asignado__isnull=True
            ).select_related('empresa', 'usuario')
        
        data = []
        for estrategia in estrategias:
            data.append({
                'id': estrategia.id,
                'titulo': estrategia.titulo,
                'descripcion': estrategia.descripcion,
                'categoria': estrategia.categoria,
                'especialidad_requerida': estrategia.especialidad_requerida,
                'fecha_solicitud': estrategia.fecha_solicitud_mentoria,
                'empresa': {
                    'id': estrategia.empresa.id,
                    'razon_social': estrategia.empresa.razon_social,
                    'ruc': estrategia.empresa.ruc
                },
                'usuario_solicitante': {
                    'id': estrategia.usuario.id,
                    'nombre': estrategia.usuario.nombre,
                    'correo': estrategia.usuario.correo
                } if estrategia.usuario else None
            })
        
        return Response({
            'estrategias': data,
            'total': len(data),
            'especialidad_mentor': especialidad_mentor
        }, status=status.HTTP_200_OK)

class AceptarMentoriaEstrategiaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.rol != 'mentor':
            return Response({'error': 'Solo los mentores pueden aceptar mentoría.'}, status=status.HTTP_403_FORBIDDEN)
        
        estrategia_id = request.data.get('estrategia_id')
        
        if not estrategia_id:
            return Response({'error': 'El ID de la estrategia es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            estrategia = Estrategia.objects.get(id=estrategia_id, solicita_mentoria=True, mentor_asignado__isnull=True)
        except Estrategia.DoesNotExist:
            return Response({'error': 'Estrategia no encontrada o ya tiene mentor asignado.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verificar si el mentor tiene la especialidad requerida
        if estrategia.especialidad_requerida and request.user.especialidades != estrategia.especialidad_requerida:
            return Response({
                'error': f'Tu especialidad ({request.user.especialidades}) no coincide con la requerida ({estrategia.especialidad_requerida}).'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Asignar mentor
        from django.utils import timezone
        estrategia.mentor_asignado = request.user
        estrategia.fecha_asignacion_mentor = timezone.now()
        estrategia.save()
        
        # En el nuevo sistema, la relación mentor-empresa se establece a través de las estrategias
        
        return Response({
            'mensaje': 'Mentoría aceptada correctamente.',
            'estrategia': estrategia.titulo,
            'empresa': estrategia.empresa.razon_social
        }, status=status.HTTP_200_OK)

class EstrategiasEmpresaConMentoriaAPIView(APIView):
    """
    API para que las empresas vean todas sus estrategias con información de mentoría
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.rol != 'empresa' or not request.user.empresa:
            return Response({'error': 'Solo empresas pueden acceder a esta información.'}, status=status.HTTP_403_FORBIDDEN)
        
        from .serializers import EstrategiaConMentoriaSerializer
        
        estrategias = Estrategia.objects.filter(empresa=request.user.empresa).select_related(
            'mentor_asignado', 'empresa'
        ).order_by('-fecha_registro')
        
        serializer = EstrategiaConMentoriaSerializer(estrategias, many=True)
        
        # Estadísticas adicionales
        total_estrategias = estrategias.count()
        con_mentor = estrategias.filter(mentor_asignado__isnull=False).count()
        solicitando = estrategias.filter(solicita_mentoria=True, mentor_asignado__isnull=True).count()
        sin_mentoria = estrategias.filter(solicita_mentoria=False, mentor_asignado__isnull=True).count()
        
        return Response({
            'estrategias': serializer.data,
            'estadisticas': {
                'total': total_estrategias,
                'con_mentor': con_mentor,
                'solicitando_mentoria': solicitando,
                'sin_mentoria': sin_mentoria
            }
        }, status=status.HTTP_200_OK)