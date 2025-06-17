from rest_framework import serializers
from .models import Documento,Firma

class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ['id', 'empresa', 'nombre', 'archivo', 'archivo_firmado', 'fecha_subida', 'tipo_documento', 'etiquetas', 'contenido']
        read_only_fields = ['empresa', 'fecha_subida']
        
class FirmaSerializer(serializers.ModelSerializer):
    documento = DocumentoSerializer(read_only=True)

    class Meta:
        model = Firma
        fields = ['id', 'documento', 'estado', 'fecha_firma']