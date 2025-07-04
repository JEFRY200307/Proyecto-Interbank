from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.conf import settings

User = get_user_model()


class Documento(models.Model):
    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.CASCADE)
    nombre = models.CharField(max_length=255)
    archivo = models.FileField(upload_to='documentos/')
    archivo_firmado = models.FileField(upload_to='firmados/', null=True, blank=True)  # firmado
    archivo_firmado_visual = models.FileField(upload_to='firmados_visual/', null=True, blank=True) 
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
    creador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documentos_creados'
    )

    def __str__(self):
        return self.nombre

@receiver(post_delete, sender=Documento)
def eliminar_archivo_documento(sender, instance, **kwargs):
    if instance.archivo:
        instance.archivo.delete(False)
class Firma(models.Model):
    documento = models.ForeignKey('Documento', on_delete=models.CASCADE, related_name='firmas')
    firmante = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=[('pendiente', 'Pendiente'), ('firmado', 'Firmado')], default='pendiente')
    fecha_firma = models.DateTimeField(null=True, blank=True)
    firma_imagen = models.ImageField(upload_to='firmas/', null=True, blank=True)
    ip_firma = models.GenericIPAddressField(null=True, blank=True)
    hash_documento = models.CharField(max_length=128, blank=True, null=True)
    sello_tiempo = models.DateTimeField(null=True, blank=True)
    trazabilidad = models.JSONField(default=dict, blank=True)
    certificado = models.TextField(blank=True, null=True)
    posicion = models.JSONField(null=True, blank=True)