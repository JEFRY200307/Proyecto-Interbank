from rest_framework import serializers
from .models import Estrategia, Etapa, Actividad

class ActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actividad
        fields = ['id', 'descripcion', 'etapa']

class EtapaSerializer(serializers.ModelSerializer):
    actividades = ActividadSerializer(many=True, read_only=True)

    class Meta:
        model = Etapa
        fields = ['id', 'nombre', 'descripcion', 'estrategia', 'actividades']

class EstrategiaSerializer(serializers.ModelSerializer):
    etapas = EtapaSerializer(many=True, read_only=True)

    class Meta:
        model = Estrategia
        fields = ['id', 'titulo', 'descripcion', 'chatbot', 'etapas']