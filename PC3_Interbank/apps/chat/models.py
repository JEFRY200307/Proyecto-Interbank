# apps/chat/models.py

from django.db import models
from apps.empresas.models import Empresa
from apps.users.models import Usuario

class FAQ(models.Model):
    pregunta = models.TextField()
    respuesta = models.TextField()
    etiqueta  = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"FAQ #{self.id} – {self.etiqueta or 'sin etiqueta'}"


class MensajeChat(models.Model):
    empresa   = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name='mensajes'
    )
    emisor    = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='mensajes_enviados'
    )
    contenido = models.TextField()
    fechaHora = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mensaje #{self.id} de {self.emisor.nombre} a {self.empresa.razon_social}"
