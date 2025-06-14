from django.contrib import admin
from .models import Documento

@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'empresa', 'fecha_subida', 'archivo_link')
    search_fields = ('nombre', 'empresa__razon_social')
    list_filter = ('empresa', 'fecha_subida')

    def archivo_link(self, obj):
        if obj.archivo:
            return f'<a href="{obj.archivo.url}" target="_blank">Ver/Descargar</a>'
        return 'Sin archivo'
    archivo_link.allow_tags = True
    archivo_link.short_description = 'Archivo'
