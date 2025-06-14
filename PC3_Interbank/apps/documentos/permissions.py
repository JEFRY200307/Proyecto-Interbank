from rest_framework import permissions
from rest_framework import viewsets
from .models import Documento
from .serializers import DocumentoSerializer

class IsEditorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated and (
                request.user.groups.filter(name='Editor').exists() or
                request.method in permissions.SAFE_METHODS
            )
        )

    def has_object_permission(self, request, view, obj):
        if request.user.groups.filter(name='Editor').exists():
            return obj.creador == request.user or request.method in permissions.SAFE_METHODS
        return request.method in permissions.SAFE_METHODS

class DocumentoViewSet(viewsets.ModelViewSet):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer
    permission_classes = [IsEditorOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name='Editor').exists():
            return Documento.objects.filter(creador=user)
        else:
            return Documento.objects.filter(firmas__firmante=user).distinct()