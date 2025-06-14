from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import hashlib
import json

User = get_user_model()

class Documento(models.Model):
    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.CASCADE)
    nombre = models.CharField(max_length=255)
    archivo = models.FileField(upload_to='documentos/')
    fecha_subida = models.DateTimeField(auto_now_add=True)
    tipo_documento = models.CharField(max_length=50, choices=[
        ('contrato', 'Contrato'),
        ('poder', 'Poder'),
        ('carta', 'Carta de presentación'),
        ('declaracion', 'Declaración jurada'),
        # ...otros tipos
    ], default='contrato')
    etiquetas = models.CharField(max_length=255, blank=True, null=True)
    contenido = models.TextField(blank=True, null=True)
    # ...otros campos si necesitas

    def __str__(self):
        return self.nombre
class Firma(models.Model):
    documento = models.ForeignKey('Documento', on_delete=models.CASCADE, related_name='firmas')
    firmante = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=[('pendiente', 'Pendiente'), ('firmado', 'Firmado')], default='pendiente')
    fecha_firma = models.DateTimeField(null=True, blank=True)
    ip_firma = models.GenericIPAddressField(null=True, blank=True)
    hash_documento = models.CharField(max_length=128, blank=True, null=True)
    sello_tiempo = models.DateTimeField(null=True, blank=True)
    trazabilidad = models.JSONField(default=dict, blank=True)
    certificado = models.TextField(blank=True, null=True)