from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BaseRenderer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import HttpResponse
from reportlab.pdfgen import canvas
import base64, hashlib, qrcode
from io import BytesIO
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
class AsignarFirmantesAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        documento_id = request.data.get('documento')
        firmantes_ids = request.data.get('firmantes', [])
        if not documento_id or not firmantes_ids:
            return Response({'error': 'Documento y firmantes son requeridos.'}, status=400)
        documento = get_object_or_404(Documento, pk=documento_id)
        for uid in firmantes_ids:
            Firma.objects.create(documento=documento, firmante_id=uid, estado='pendiente')
        return Response({'mensaje': 'Firmantes asignados correctamente.'}, status=201)

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
        firma = get_object_or_404(Firma, pk=pk, firmante=request.user)
        if firma.estado != 'pendiente':
            return Response({'error': 'Esta firma ya fue procesada.'}, status=status.HTTP_400_BAD_REQUEST)

        pin = request.data.get('clave')
        firma_imagen = request.data.get('firma_imagen')  # base64

        if not pin:
            return Response({'error': 'Debes ingresar tu PIN de firma.'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_clave_firma(pin):
            return Response({'error': 'PIN de firma incorrecto.'}, status=status.HTTP_400_BAD_REQUEST)

        # Guarda la imagen base64 si existe
        if firma_imagen:
            format, imgstr = firma_imagen.split(';base64,')
            ext = format.split('/')[-1]
            firma.firma_imagen.save(f'firma_{firma.id}.{ext}', ContentFile(base64.b64decode(imgstr)), save=False)

        # 1. Calcular hash SHA-256 del PDF original
        with open(firma.documento.archivo.path, 'rb') as f:
            pdf_bytes = f.read()
        hash_sha256 = hashlib.sha256(pdf_bytes).hexdigest()

        # 2. Generar QR con URL de verificación
        qr_data = f"https://tusitio.com/verificacion_firma/{firma.id}/"
        qr_img = qrcode.make(qr_data)
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)
        # 3. (Opcional) Insertar hash y QR en el PDF usando reportlab/PyPDF2
        # ...aquí puedes agregar el código para modificar el PDF...

        # 4. Guardar trazabilidad
        firma.hash_documento = hash_sha256
        firma.trazabilidad = {
            "nombre": firma.firmante.nombre,
            "dni": getattr(firma.firmante, 'dni', ''),
            "fecha_hora": str(timezone.now()),
            "hash": hash_sha256,
            "certificado": getattr(firma, 'certificado', ''),
            "firma_base64": firma.firma_imagen.url if firma.firma_imagen else None,
            "id_firma": firma.id,
        }
        firma.estado = 'firmado'
        firma.fecha_firma = timezone.now()
        firma.save()
        return Response({'mensaje': 'Documento firmado correctamente.'})

        
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

class HistorialFirmasAPIView(generics.ListAPIView):
    serializer_class = FirmaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Firma.objects.filter(
            documento__empresa=self.request.user.empresa,
            firmante=self.request.user,
            estado='firmado'
        ).order_by('-fecha_firma')

import base64
from django.core.files.base import ContentFile

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def firmar_documento(request, firma_id):
    firma = get_object_or_404(Firma, pk=firma_id, firmante=request.user)
    pin = request.data.get('clave')
    firma_imagen = request.data.get('firma_imagen')  # base64

    if not request.user.check_clave_firma(pin):
        return Response({'error': 'PIN de firma incorrecto.'}, status=400)

    # Guarda la imagen base64 si existe
    if firma_imagen:
        format, imgstr = firma_imagen.split(';base64,')
        ext = format.split('/')[-1]
        firma.firma_imagen.save(f'firma_{firma.id}.{ext}', ContentFile(base64.b64decode(imgstr)), save=False)

    # ...lógica de hash, QR, trazabilidad...
    firma.estado = 'firmado'
    firma.fecha_firma = timezone.now()
    firma.save()
    return Response({'mensaje': 'Documento firmado correctamente.'})