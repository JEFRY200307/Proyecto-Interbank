from rest_framework import generics, permissions, viewsets
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
from .models import Documento, Firma
from .serializers import DocumentoSerializer, FirmaSerializer
from rest_framework import status
from django.shortcuts import get_object_or_404, render, redirect
from django.utils import timezone
from .permissions import (
    IsCreadorOrAdminOrReadOnly,
)
from .utils_pdf import insertar_firmas_en_pdf, generar_pagina_trazabilidad_multiple, agregar_pagina_al_final
from rest_framework.generics import RetrieveAPIView
from django.db.models import Q

# --- DASHBOARDS ---
def dashboard_documentos(request):
    rol = getattr(request.user, 'rol', None)
    return render(request, 'dashboard_documentos.html', {'rol': rol})

def dashboard_firmas(request):
    rol = getattr(request.user, 'rol', None)
    return render(request, 'dashboard_firmas.html', {'rol': rol})

def get_pdf_base(documento):
    if documento.archivo_firmado_visual and documento.archivo_firmado_visual.name:
        return documento.archivo_firmado_visual.path
    return documento.archivo.path

# --- DOCUMENTOS ---
class DocumentoEmpresaAPIView(generics.ListCreateAPIView):
    serializer_class = DocumentoSerializer
    permission_classes = [IsAuthenticated, IsCreadorOrAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        rol = getattr(user, 'rol_interno', None)
        if rol == 'administrador':
            # El administrador ve todos los documentos de la empresa
            return Documento.objects.filter(empresa=user.empresa)
        else:
            # Los demás ven los que subieron o donde son firmantes
            return Documento.objects.filter(
                empresa=user.empresa
            ).filter(
                Q(creador=user) | Q(firmas__firmante=user)
            ).distinct()

    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa, creador=self.request.user)

class DocumentoDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentoSerializer
    permission_classes = [IsAuthenticated, IsCreadorOrAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        rol = getattr(user, 'rol_interno', None)
        if rol == 'administrador':
            return Documento.objects.filter(empresa=user.empresa)
        else:
            return Documento.objects.filter(
                empresa=user.empresa
            ).filter(
                Q(creador=user) | Q(firmas__firmante=user)
            ).distinct()

class PDFRenderer(BaseRenderer):
    media_type = 'application/pdf'
    format = 'pdf'

    def render(self, data, media_type=None, renderer_context=None):
        return data

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

class DocumentoViewSet(viewsets.ModelViewSet):
    """
    CRUD de documentos. Creador o admin pueden modificar/eliminar.
    Todos pueden crear y ver sus documentos o donde son firmantes.
    """
    serializer_class = DocumentoSerializer
    permission_classes = [IsAuthenticated, IsCreadorOrAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        rol = getattr(user, 'rol_interno', None)
        if rol == 'administrador':
            return Documento.objects.filter(empresa=user.empresa)
        else:
            return Documento.objects.filter(
                empresa=user.empresa
            ).filter(
                Q(creador=user) | Q(firmas__firmante=user)
            ).distinct()

    def perform_create(self, serializer):
        serializer.save(creador=self.request.user, empresa=self.request.user.empresa)

# --- FIRMAS ---
class AsignarFirmantesAPIView(APIView):
    permission_classes = [IsAuthenticated, IsCreadorOrAdminOrReadOnly]

    def post(self, request, *args, **kwargs):
        documento_id = request.data.get('documento')
        firmantes_ids = request.data.get('firmantes', [])
        if not documento_id or not firmantes_ids:
            return Response({'error': 'Documento y firmantes son requeridos.'}, status=400)
        documento = get_object_or_404(Documento, pk=documento_id)
        # Solo el creador o admin pueden asignar firmantes
        if not (documento.creador == request.user or getattr(request.user, 'rol_interno', None) == 'administrador'):
            return Response({'error': 'No tienes permiso para asignar firmantes.'}, status=403)
        for uid in firmantes_ids:
            Firma.objects.get_or_create(documento=documento, firmante_id=uid, defaults={'estado': 'pendiente'})
        return Response({'mensaje': 'Firmantes asignados correctamente.'}, status=201)

class PendientesFirmaAPIView(generics.ListAPIView):
    serializer_class = FirmaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Firma.objects.filter(firmante=self.request.user, estado='pendiente')

class FirmaDetailAPIView(RetrieveAPIView):
    queryset = Firma.objects.all()
    serializer_class = FirmaSerializer
    permission_classes = [IsAuthenticated]

class FirmarDocumentoAPIView(APIView):
    permission_classes = [IsAuthenticated, IsCreadorOrAdminOrReadOnly]

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
            hash_sha256 = ""
            if f.documento.archivo_firmado:
                with open(f.documento.archivo_firmado.path, 'rb') as pdf_f:
                    hash_sha256 = hashlib.sha256(pdf_f.read()).hexdigest()
            qr_data = f"https://tusitio.com/verificacion_firma/{f.id}/"
            qr_img = BytesIO()
            qrcode.make(qr_data).save(qr_img, format='PNG')
            qr_img.seek(0)
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
        output_path_final = pdf_base_path.replace('.pdf', f'_firmado_{firma.id}.pdf')
        agregar_pagina_al_final(temp_firmado_path, pagina_buffer, output_path_final)

        with open(output_path_final, 'rb') as f:
            documento.archivo_firmado.save(f'documento_{documento.id}_firmado.pdf', ContentFile(f.read()))
        documento.save()

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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Firma.objects.filter(
            documento__empresa=self.request.user.empresa,
            firmante=self.request.user,
            estado='firmado'
        ).order_by('-fecha_firma')

# --- DOCUMENTOS POR ROL ---
# Todas estas vistas ahora usan el mismo permiso y lógica de queryset
class DocumentosAdministradorView(generics.ListCreateAPIView):
    serializer_class = DocumentoSerializer
    permission_classes = [permissions.IsAuthenticated, IsCreadorOrAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        return Documento.objects.filter(empresa=user.empresa)

    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa, creador=self.request.user)

class DocumentosRepresentanteView(generics.ListCreateAPIView):
    serializer_class = DocumentoSerializer
    permission_classes = [permissions.IsAuthenticated, IsCreadorOrAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        return Documento.objects.filter(
            empresa=user.empresa
        ).filter(
            Q(creador=user) | Q(firmas__firmante=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa, creador=self.request.user)

class DocumentosSocioView(generics.ListCreateAPIView):
    serializer_class = DocumentoSerializer
    permission_classes = [permissions.IsAuthenticated, IsCreadorOrAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        return Documento.objects.filter(
            empresa=user.empresa
        ).filter(
            Q(creador=user) | Q(firmas__firmante=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa, creador=self.request.user)

class DocumentosContadorView(generics.ListCreateAPIView):
    serializer_class = DocumentoSerializer
    permission_classes = [permissions.IsAuthenticated, IsCreadorOrAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        return Documento.objects.filter(
            empresa=user.empresa
        ).filter(
            Q(creador=user) | Q(firmas__firmante=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa, creador=self.request.user)

class DocumentosEmpleadoView(generics.ListCreateAPIView):
    serializer_class = DocumentoSerializer
    permission_classes = [permissions.IsAuthenticated, IsCreadorOrAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        return Documento.objects.filter(
            empresa=user.empresa
        ).filter(
            Q(creador=user) | Q(firmas__firmante=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa, creador=self.request.user)


