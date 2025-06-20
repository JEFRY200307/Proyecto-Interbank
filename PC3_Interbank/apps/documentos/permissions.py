from rest_framework import permissions
from rest_framework import viewsets
from .models import Documento
from .serializers import DocumentoSerializer

class IsAdministradorOrReadOnly(permissions.BasePermission):
    """
    Solo el Administrador de empresa puede crear, actualizar o eliminar.
    Otros roles solo pueden leer.
    """
    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated and (
                getattr(request.user, 'rol_interno', None) == 'administrador' or
                request.method in permissions.SAFE_METHODS
            )
        )

    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'rol_interno', None) == 'administrador':
            return True
        return request.method in permissions.SAFE_METHODS

class IsRepresentanteOrReadOnly(permissions.BasePermission):
    """
    Permite ver y firmar documentos oficiales al representante.
    """
    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated and (
                getattr(request.user, 'rol_interno', None) == 'representante' or
                request.method in permissions.SAFE_METHODS
            )
        )

    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'rol_interno', None) == 'representante':
            return True
        return request.method in permissions.SAFE_METHODS

class IsFirmanteOrReadOnly(permissions.BasePermission):
    """
    Permite firmar solo a firmantes asignados, otros solo pueden leer.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if request.method in permissions.SAFE_METHODS:
            return True
        # Suponiendo que obj tiene un campo firmantes (ManyToMany)
        return user in obj.firmantes.all()

class IsContadorOrAdministrador(permissions.BasePermission):
    """
    Permite firmar informes financieros/legales solo a contador o administrador.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        rol = getattr(user, 'rol_interno', None)
        if request.method in permissions.SAFE_METHODS:
            return True
        if rol in ['contador', 'administrador']:
            return True
        return False

class IsSocioOrAdministrador(permissions.BasePermission):
    """
    Permite firmar acuerdos internos solo a socio o administrador.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        rol = getattr(user, 'rol_interno', None)
        if request.method in permissions.SAFE_METHODS:
            return True
        if rol in ['socio', 'administrador']:
            return True
        return False

class IsEmpleadoOrReadOnly(permissions.BasePermission):
    """
    Permite a empleados cargar/ver documentos básicos.
    """
    def has_permission(self, request, view):
        rol = getattr(request.user, 'rol_interno', None)
        return (
            request.user and request.user.is_authenticated and (
                rol == 'empleado' or
                request.method in permissions.SAFE_METHODS
            )
        )

    def has_object_permission(self, request, view, obj):
        rol = getattr(request.user, 'rol_interno', None)
        if rol == 'empleado':
            return True
        return request.method in permissions.SAFE_METHODS

class IsCreadorOrAdminOrReadOnly(permissions.BasePermission):
    """
    Permite modificar/eliminar/asignar firmantes solo al creador del documento o al administrador.
    Todos los usuarios autenticados pueden crear documentos.
    Todos pueden ver documentos a los que tienen acceso por queryset.
    """
    def has_permission(self, request, view):
        # Permite crear documentos a cualquier usuario autenticado
        if request.method == 'POST':
            return request.user and request.user.is_authenticated
        # Permite leer a cualquiera autenticado (el queryset ya filtra)
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return True

    def has_object_permission(self, request, view, obj):
        # Permite leer a cualquiera autenticado (el queryset ya filtra)
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        # Permite modificar/eliminar solo al creador o al administrador
        return (
            obj.creador == request.user or
            getattr(request.user, 'rol_interno', None) == 'administrador'
        )

# Puedes usar estos permisos en tus vistas o viewsets según el tipo de documento y acción.