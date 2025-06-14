from django.contrib import admin
from .models import Usuario

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'correo', 'empresa', 'rol', 'is_active', 'is_staff')
    search_fields = ('nombre', 'correo')
    list_filter = ('empresa', 'rol', 'is_active', 'is_staff')
