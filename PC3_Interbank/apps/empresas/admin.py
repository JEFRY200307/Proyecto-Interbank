from django.contrib import admin
from .models import Empresa, Estrategia

@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('id', 'razon_social', 'ruc', 'correo', 'estado', 'fecha_registro')
    search_fields = ('razon_social', 'ruc', 'correo')
    list_filter = ('estado',)
    actions = ['marcar_como_activo', 'marcar_como_rechazado']

    def marcar_como_activo(self, request, queryset):
        updated = queryset.update(estado='activo')
        self.message_user(request, f"{updated} empresa(s) marcadas como ACTIVO.")
    marcar_como_activo.short_description = "Marcar como ACTIVO"

    def marcar_como_rechazado(self, request, queryset):
        updated = queryset.update(estado='rechazado')
        self.message_user(request, f"{updated} empresa(s) marcadas como RECHAZADO.")
    marcar_como_rechazado.short_description = "Marcar como RECHAZADO"

@admin.register(Estrategia)
class EstrategiaAdmin(admin.ModelAdmin):
    list_display = ('id', 'empresa', 'descripcion', 'estado', 'fecha_registro')
    search_fields = ('empresa__razon_social', 'descripcion')
    list_filter = ('estado',)
