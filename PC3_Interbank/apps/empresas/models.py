# apps/empresas/models.py

from django.db import models

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

    def __str__(self):
        return f"{self.razon_social} (RUC: {self.ruc})"


class Estrategia(models.Model):
    empresa= models.ForeignKey(Empresa,on_delete=models.CASCADE,related_name='estrategias')
    descripcion= models.TextField()
    fecha_registro= models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, default='pendiente')

    def __str__(self):
        return f"Estrategia {self.id} para {self.empresa.razon_social}"

