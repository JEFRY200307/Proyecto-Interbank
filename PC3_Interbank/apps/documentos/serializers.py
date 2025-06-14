from rest_framework import serializers
from .models import Documento,Firma

class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ['id', 'empresa', 'nombre', 'archivo', 'fecha_subida', 'tipo_documento', 'etiquetas', 'contenido']
        read_only_fields = ['empresa', 'fecha_subida']

class FirmaSerializer(serializers.ModelSerializer):
    documento_nombre = serializers.CharField(source='documento.nombre', read_only=True)
    firmante_username = serializers.CharField(source='firmante.username', read_only=True)
    class Meta:
        model = Firma
        fields = ['id', 'documento', 'documento_nombre', 'firmante', 'firmante_username', 'estado', 'fecha_firma']