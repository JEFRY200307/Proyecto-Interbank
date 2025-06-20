from rest_framework import serializers
from .models import Documento, Firma

class FirmanteInfoSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source='firmante.nombre')
    correo = serializers.CharField(source='firmante.correo')
    rol_interno = serializers.CharField(source='firmante.rol_interno')

    class Meta:
        model = Firma
        fields = ['id', 'nombre', 'correo', 'rol_interno', 'estado', 'fecha_firma']

class DocumentoSerializer(serializers.ModelSerializer):
    creador_id = serializers.IntegerField(source='creador.id', read_only=True)
    firmantes = serializers.SerializerMethodField()
    puede_eliminar = serializers.SerializerMethodField()
    puede_editar = serializers.SerializerMethodField()
    puede_asignar_firmantes = serializers.SerializerMethodField()

    class Meta:
        model = Documento
        fields = [
            'id', 'nombre', 'tipo_documento', 'archivo', 'etiquetas', 'contenido',
            'creador_id', 'firmantes', 'puede_eliminar', 'puede_editar', 'puede_asignar_firmantes'
        ]

    def get_firmantes(self, obj):
        # Devuelve una lista de dicts con id, nombre y estado de cada firmante
        return [
            {
                'id': f.firmante.id,
                'nombre': getattr(f.firmante, 'nombre', str(f.firmante)),
                'estado': f.estado
            }
            for f in obj.firmas.all()
        ]

    def get_puede_eliminar(self, obj):
        user = self.context['request'].user
        return obj.creador_id == user.id or getattr(user, 'rol_interno', None) == 'administrador'

    def get_puede_editar(self, obj):
        user = self.context['request'].user
        return obj.creador_id == user.id or getattr(user, 'rol_interno', None) == 'administrador'

    def get_puede_asignar_firmantes(self, obj):
        user = self.context['request'].user
        return obj.creador_id == user.id or getattr(user, 'rol_interno', None) == 'administrador'

class FirmaSerializer(serializers.ModelSerializer):
    documento = DocumentoSerializer(read_only=True)
    firmante_nombre = serializers.CharField(source='firmante.nombre', read_only=True)
    firmante_correo = serializers.CharField(source='firmante.correo', read_only=True)
    firmante_rol_interno = serializers.CharField(source='firmante.rol_interno', read_only=True)

    class Meta:
        model = Firma
        fields = [
            'id', 'documento', 'estado', 'fecha_firma',
            'firmante_nombre', 'firmante_correo', 'firmante_rol_interno'
        ]