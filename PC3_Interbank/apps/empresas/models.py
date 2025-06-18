# apps/empresas/models.py

from django.db import models
from django.contrib.auth import get_user_model

class Empresa(models.Model):
    razon_social   = models.CharField(max_length=255)
    ruc            = models.CharField(max_length=11, unique=True)
    representante  = models.CharField(max_length=255)
    correo         = models.EmailField(unique=True)
    password       = models.CharField(max_length=255)
    direccion      = models.CharField(max_length=255, blank=True, null=True)
    telefono       = models.CharField(max_length=20, blank=True, null=True)
    departamento   = models.CharField(max_length=100, blank=True, null=True)  # Nuevo campo
    provincia      = models.CharField(max_length=100, blank=True, null=True)  # Nuevo campo
    distrito       = models.CharField(max_length=100, blank=True, null=True)  # Nuevo campo
    estado         = models.CharField(max_length=20, default='pendiente')
    fecha_registro = models.DateTimeField(auto_now_add=True)
    objetivo = models.TextField(blank=True, null=True)
    mision = models.TextField(blank=True, null=True)
    vision = models.TextField(blank=True, null=True)
    valores = models.TextField(blank=True, null=True)
    historia = models.TextField(blank=True, null=True)
    web = models.URLField(blank=True, null=True)
    facebook = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.razon_social} (RUC: {self.ruc})"


class Estrategia(models.Model):
    usuario = models.ForeignKey('users.Usuario', on_delete=models.CASCADE,null=True, blank=True)
    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.CASCADE, null=True, blank=True)
    titulo = models.CharField(max_length=255,null=True, blank=True)
    descripcion = models.TextField()
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_cumplimiento = models.DateField(null=True, blank=True)
    categoria = models.CharField(max_length=100, null=True, blank=True)
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_progreso', 'En progreso'),
        ('completada', 'Completada'),
    ]
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')

    def __str__(self):
        return self.titulo

class Actividad(models.Model):
    estrategia = models.ForeignKey(Estrategia, related_name='actividades', on_delete=models.CASCADE)
    descripcion = models.CharField(max_length=255)
    fecha_limite = models.DateField(null=True, blank=True)
    completada = models.BooleanField(default=False)

class TicketSoporte(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=[('abierto', 'Abierto'), ('cerrado', 'Cerrado')])
    fecha_creacion = models.DateTimeField(auto_now_add=True)

class MovimientoFinanciero(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=10, choices=[('ingreso', 'Ingreso'), ('gasto', 'Gasto')])
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    estado = models.CharField(max_length=20, default='ok')  # 'ok' o 'mora'
    fecha = models.DateField()


