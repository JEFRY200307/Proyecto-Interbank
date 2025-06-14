from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BaseRenderer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import HttpResponse
from io import BytesIO
from reportlab.pdfgen import canvas

from apps.users.models import Usuario
from .models import Documento
from .serializers import DocumentoSerializer
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Firma, Documento
import hashlib
from rest_framework import viewsets, permissions
from django.shortcuts import render
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import get_user_model
from .permissions import IsEditorOrReadOnly
from .serializers import DocumentoSerializer, FirmaSerializer

# apps/users/views.py
def dashboard_documentos(request):
    rol = getattr(request.user, 'rol', None)
    return render(request, 'dashboard_documentos.html', {'rol': rol})

def dashboard_firmas(request):
    rol = getattr(request.user, 'rol', None)
    return render(request, 'dashboard_firmas.html', {'rol': rol})
# Listar y crear documentos
class DocumentoEmpresaAPIView(generics.ListCreateAPIView):
    serializer_class = DocumentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Documento.objects.filter(empresa=self.request.user.empresa)

    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa)

# Recuperar, actualizar y eliminar un documento específico
class DocumentoDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Documento.objects.filter(empresa=self.request.user.empresa)

class PDFRenderer(BaseRenderer):
    media_type = 'application/pdf'
    format = 'pdf'

    def render(self, data, media_type=None, renderer_context=None):
        return data
# Generar PDF de un documento específico
class GenerarPDFAPIView(APIView):
    permission_classes = [IsAuthenticated]
    renderer_classes = [PDFRenderer]

    def get(self, request, pk):
        doc = Documento.objects.filter(pk=pk, empresa=request.user.empresa).first()
        if not doc:
            return HttpResponse("Documento no encontrado", status=404)
        buffer = BytesIO()
        p = canvas.Canvas(buffer)
        p.drawString(100, 800, doc.nombre)
        p.drawString(100, 780, doc.contenido or '')
        p.showPage()
        p.save()
        buffer.seek(0)
        pdf_bytes = buffer.getvalue()
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{doc.nombre}.pdf"'
        return response

def asignar_firmantes(request, documento_id):
    documento = get_object_or_404(Documento, pk=documento_id)
    User = get_user_model()
    # Excluye usuarios que ya son firmantes de este documento
    usuarios = User.objects.exclude(id__in=documento.firmas.values_list('firmante_id', flat=True))
    if request.method == "POST":
        firmantes_ids = request.POST.getlist('firmantes')
        for uid in firmantes_ids:
            Firma.objects.create(documento=documento, firmante_id=uid)
        return redirect('dashboard_documentos')
    return render(request, 'documentos/asignar_firmantes.html', {
        'documento': documento,
        'usuarios': usuarios
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gestionar_firmas(request, documento_id):
    documento = get_object_or_404(Documento, pk=documento_id)
    firmas = documento.firmas.select_related('firmante').all()
    return render(request, 'documentos/gestionar_firmas.html', {'documento': documento, 'firmas': firmas})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def auditoria_firmas(request, documento_id):
    documento = get_object_or_404(Documento, pk=documento_id)
    firma_id = request.GET.get('firma_id')
    if firma_id:
        firmas = documento.firmas.filter(pk=firma_id)
    else:
        firmas = documento.firmas.all()
    return render(request, 'documentos/auditoria_firmas.html', {
        'documento': documento,
        'firmas': firmas,
    })
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_firmas(request):
    firmas = Firma.objects.select_related('documento', 'firmante').all()
    data = []
    for f in firmas:
        data.append({
            'id': f.id,
            'documento_nombre': f.documento.nombre,
            'firmante_username': f.firmante.username,
            'estado': f.estado,
            'fecha_firma': f.fecha_firma.strftime('%d/%m/%Y %H:%M') if f.fecha_firma else None,
        })
    return Response(data)


# --- DOCUMENTOS ---
class DocumentoViewSet(viewsets.ModelViewSet):
    """
    CRUD de documentos. Solo el editor puede crear/editar/eliminar sus documentos.
    El lector solo puede ver documentos asignados para firmar.
    """
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer
    permission_classes = [IsAuthenticated, IsEditorOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name='Editor').exists():
            return Documento.objects.filter(creador=user)
        else:
            return Documento.objects.filter(firmas__firmante=user).distinct()

    def perform_create(self, serializer):
        serializer.save(creador=self.request.user)

# --- FIRMAS ---
class AsignarFirmantesAPIView(generics.CreateAPIView):
    serializer_class = FirmaSerializer
    permission_classes = [permissions.IsAuthenticated]

class PendientesFirmaAPIView(generics.ListAPIView):
    serializer_class = FirmaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Firma.objects.filter(
    documento__empresa=self.request.user.empresa,
    firmante=self.request.user,
    estado='pendiente'
)

class FirmarDocumentoAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            firma = Firma.objects.get(pk=pk, firmante=request.user)
            firma.firmado = True
            firma.fecha_firma = timezone.now()
            firma.save()
            return Response({'detail': 'Documento firmado correctamente.'})
        except Firma.DoesNotExist:
            return Response({'detail': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)
        
class FirmaViewSet(viewsets.ModelViewSet):
    """
    Ver firmas asignadas al usuario o a documentos que creó.
    """
    queryset = Firma.objects.all()
    serializer_class = FirmaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Firma.objects.filter(firmante=user) | Firma.objects.filter(documento__creador=user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def firmar_documento(request, firma_id):
    """
    Permite firmar un documento si la firma está pendiente y el usuario es el firmante.
    """
    firma = get_object_or_404(Firma, pk=firma_id, firmante=request.user)
    if firma.estado != 'pendiente':
        return Response({'error': 'Esta firma ya fue procesada.'}, status=400)
    firma.estado = 'firmado'
    firma.fecha_firma = timezone.now()
    firma.save()
    return Response({'mensaje': 'Documento firmado correctamente.'})