from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BaseRenderer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import HttpResponse
from reportlab.pdfgen import canvas
import base64, hashlib, qrcode
from django.core.files.base import ContentFile
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
from rest_framework.response import Response
from .permissions import IsEditorOrReadOnly
from .utils_pdf import insertar_firmas_en_pdf, generar_pagina_trazabilidad_multiple, agregar_pagina_al_final
from rest_framework.generics import RetrieveAPIView
from .serializers import DocumentoSerializer, FirmaSerializer

# apps/users/views.py
def dashboard_documentos(request):
    rol = getattr(request.user, 'rol', None)
    return render(request, 'dashboard_documentos.html', {'rol': rol})

def dashboard_firmas(request):
    rol = getattr(request.user, 'rol', None)
    return render(request, 'dashboard_firmas.html', {'rol': rol})

def get_pdf_base(documento):
    # Usa el PDF base solo con firmas visuales
    if documento.archivo_firmado_visual and documento.archivo_firmado_visual.name:
        return documento.archivo_firmado_visual.path
    return documento.archivo.path

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
        return Firma.objects.filter(firmante=self.request.user, estado='pendiente')
    
class FirmaDetailAPIView(RetrieveAPIView):
    queryset = Firma.objects.all()
    serializer_class = FirmaSerializer
    permission_classes = [IsAuthenticated]

class FirmarDocumentoAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        firma = get_object_or_404(Firma, pk=pk, firmante=request.user)
        if firma.estado != 'pendiente':
            return Response({'error': 'Esta firma ya fue procesada.'}, status=status.HTTP_400_BAD_REQUEST)

        pin = request.data.get('clave')
        firma_imagen = request.data.get('firma_imagen')  # base64 de la firma visual
        firma_posicion = request.data.get('firma_posicion')  # dict con page, x, y

        if not pin:
            return Response({'error': 'Debes ingresar tu PIN de firma.'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_clave_firma(pin):
            return Response({'error': 'PIN de firma incorrecto.'}, status=status.HTTP_400_BAD_REQUEST)

        # Guarda la imagen base64 si existe
        if firma_imagen:
            format, imgstr = firma_imagen.split(';base64,')
            ext = format.split('/')[-1]
            firma.firma_imagen.save(f'firma_{firma.id}.{ext}', ContentFile(base64.b64decode(imgstr)), save=False)
        if firma_posicion:
            firma.posicion = firma_posicion

        firma.fecha_firma = timezone.now()
        firma.estado = 'firmado'
        firma.save()

        # 0. Usa el PDF base (firmado por otros, o el original)
        documento = firma.documento
        pdf_base_path = get_pdf_base(documento)

        # 1. Inserta todas las firmas visuales en el PDF base
        firmas_firmadas = list(documento.firmas.filter(estado='firmado').order_by('fecha_firma'))
        temp_firmado_path = pdf_base_path.replace('.pdf', f'_temp_{firma.id}.pdf')
        insertar_firmas_en_pdf(
            pdf_path=pdf_base_path,
            firmas=firmas_firmadas,
            output_path=temp_firmado_path
        )
        # 2. Guarda el PDF base con firmas visuales
        with open(temp_firmado_path, 'rb') as f:
            documento.archivo_firmado_visual.save(f'documento_{documento.id}_firmado_visual.pdf', ContentFile(f.read()))
        documento.save()

        # 3. Genera la hoja de trazabilidad múltiple con QR, hash y firma visual
        trazabilidad_lista = []
        for f in firmas_firmadas:
            # Hash del PDF firmado hasta ese momento (opcional)
            hash_sha256 = ""
            if f.documento.archivo_firmado:
                with open(f.documento.archivo_firmado.path, 'rb') as pdf_f:
                    hash_sha256 = hashlib.sha256(pdf_f.read()).hexdigest()

            # QR con URL de verificación
            qr_data = f"https://tusitio.com/verificacion_firma/{f.id}/"
            qr_img = BytesIO()
            qrcode.make(qr_data).save(qr_img, format='PNG')
            qr_img.seek(0)

            # Firma visual (si existe)
            firma_img = None
            if f.firma_imagen:
                firma_img = f.firma_imagen.path

            trazabilidad_lista.append({
                "Nombre": getattr(f.firmante, 'nombre', f.firmante.get_username()),
                "DNI": getattr(f.firmante, 'dni', '') or "No registrado",
                "Fecha y hora": str(f.fecha_firma or timezone.now()),
                "Posición": f.posicion,
                "ID de firma": f.id,
                "Hash SHA-256": hash_sha256,
                "Certificado": getattr(f, 'certificado', '') or "No disponible",
                "QR": qr_img,
            })

        pagina_buffer = generar_pagina_trazabilidad_multiple(trazabilidad_lista)

        # 4. Agrega la hoja de trazabilidad al final
        output_path_final = pdf_base_path.replace('.pdf', f'_firmado_{firma.id}.pdf')
        agregar_pagina_al_final(temp_firmado_path, pagina_buffer, output_path_final)

        # 5. Guarda el PDF final
        with open(output_path_final, 'rb') as f:
            documento.archivo_firmado.save(f'documento_{documento.id}_firmado.pdf', ContentFile(f.read()))
        documento.save()

        # Limpieza: elimina archivos temporales si existen
        import os
        try:
            if os.path.exists(temp_firmado_path):
                os.remove(temp_firmado_path)
        except Exception:
            pass

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


