# apps/chat/models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class ChatMessage(models.Model):
    category = models.ForeignKey(ChatCategory, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.category}: {self.message[:20]}"

class Conversacion(models.Model):
    usuario = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='conversaciones')
    chatbot = models.CharField(max_length=255)  # Nombre o ID del chatbot
    mensaje_usuario = models.TextField()
    respuesta_chatbot = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conversación con {self.chatbot} - {self.usuario}"

# Estrategia para los bots (simplificada)
class Estrategia(models.Model):
    chatbot = models.ForeignKey(ChatCategory, related_name='estrategias', on_delete=models.CASCADE, null=True, blank=True)  # Permite que no tenga estrategia
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField()

    def __str__(self):
        return f"Estrategia: {self.titulo} - Bot: {self.chatbot.name}"

# Etapa asociada a la estrategia (simplificada)
class Etapa(models.Model):
    estrategia = models.ForeignKey(Estrategia, related_name='etapas', on_delete=models.CASCADE, null=True, blank=True)  # Permite que no tenga etapa
    nombre = models.CharField(max_length=255, default='Etapa sin nombre')
    descripcion = models.TextField(blank=True, null=True, default='Descripción de la etapa')

    def __str__(self):
        return f"Etapa: {self.nombre} - Estrategia: {self.estrategia.titulo}"

# Actividad asociada a la etapa (simplificada)
class Actividad(models.Model):
    etapa = models.ForeignKey(Etapa, related_name='actividades', on_delete=models.CASCADE, null=True, blank=True)  # Permite que no tenga actividad
    descripcion = models.CharField(max_length=255)

    def __str__(self):
        return f"Actividad: {self.descripcion} - Etapa: {self.etapa.nombre if self.etapa else 'Sin etapa'}"


class BotFeeding(models.Model):
    """
    Modelo para almacenar información adicional que se usa para alimentar/entrenar los bots
    """
    TIPO_CHOICES = [
        ('texto_libre', 'Texto Libre'),
        ('estrategia_referencia', 'Estrategia de Referencia'),
    ]
    
    categoria = models.ForeignKey(ChatCategory, on_delete=models.CASCADE, related_name='alimentaciones')
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alimentaciones_bot')
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)  # Aumenté el max_length para que sea suficiente
    contenido = models.TextField(help_text="Contenido usado para alimentar al bot")
    estrategia_referencia = models.ForeignKey(
        'empresas.Estrategia', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        help_text="Estrategia usada como referencia (solo si tipo es 'estrategia_referencia')"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    activa = models.BooleanField(default=True, help_text="Si esta alimentación está activa para el bot")
    
    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = "Alimentación de Bot"
        verbose_name_plural = "Alimentaciones de Bot"
    
    def __str__(self):
        return f"Alimentación {self.get_tipo_display()} para {self.categoria.name} por {self.mentor.username}"
    
    def get_tipo_display_custom(self):
        """
        Método personalizado para obtener el tipo en español
        """
        tipo_map = {
            'texto_libre': 'Texto Libre',
            'estrategia_referencia': 'Estrategia de Referencia'
        }
        return tipo_map.get(self.tipo, self.tipo)