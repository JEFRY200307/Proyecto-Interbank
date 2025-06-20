# apps/empresas/serializers.py

from rest_framework import serializers
from .models import Empresa, Estrategia, Actividad, Etapa
from django.contrib.auth.hashers import make_password
from django.db import transaction

class EmpresaRegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Empresa
        # Solo los campos que el usuario debe ingresar
        fields = [
            'ruc', 'correo', 'representante', 'password',
            'razon_social', 'direccion', 'departamento', 'provincia', 'distrito', 'telefono'
        ]
        extra_kwargs = {
            'correo': {'required': True},
            'ruc': {'required': True},
            'representante': {'required': True},
            'password': {'write_only': True, 'required': True, 'min_length': 8},
            'razon_social': {'required': False},
            'direccion': {'required': False},
            'departamento': {'required': False},
            'provincia': {'required': False},
            'distrito': {'required': False},
            'telefono': {'required': False},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        empresa = Empresa(**validated_data)
        empresa.password = make_password(password)
        empresa.save()
        return empresa
    

class EmpresaPerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = [
            'razon_social', 'ruc', 'representante', 'correo', 'direccion',
            'telefono', 'departamento', 'provincia', 'distrito', 'estado', 'fecha_registro'
        ]
        read_only_fields = fields


class ActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actividad
        fields = ['id', 'descripcion', 'completada']

# Serializer para Etapa, que anida Actividades
class EtapaSerializer(serializers.ModelSerializer):
    actividades = ActividadSerializer(many=True)

    class Meta:
        model = Etapa
        fields = ['id', 'nombre', 'descripcion', 'actividades']

# --- ESTE ES EL SERIALIZER QUE NECESITAS CORREGIR ---
class EstrategiaSerializer(serializers.ModelSerializer):
    etapas = EtapaSerializer(many=True) # Acepta una lista de etapas para la creación

    class Meta:
        model = Estrategia
        fields = [
            'id', 'titulo', 'descripcion', 'categoria', 
            'fecha_registro', 'fecha_cumplimiento', 'estado', 
            'empresa', 'usuario', 'etapas'
        ]
        read_only_fields = ['empresa', 'usuario', 'fecha_registro']

    @transaction.atomic # Asegura que todo se cree correctamente o no se cree nada
    def create(self, validated_data):
        # Extraemos los datos de las etapas anidadas antes de crear la estrategia
        etapas_data = validated_data.pop('etapas')
        
        # Creamos el objeto principal: la Estrategia
        estrategia = Estrategia.objects.create(**validated_data)
        
        # Iteramos sobre los datos de cada etapa para crearla
        for etapa_data in etapas_data:
            # Extraemos los datos de las actividades de esta etapa
            actividades_data = etapa_data.pop('actividades')
            
            # Creamos la Etapa, vinculándola a la Estrategia recién creada
            etapa = Etapa.objects.create(estrategia=estrategia, **etapa_data)
            
            # Iteramos sobre las actividades para crearlas y vincularlas a la Etapa
            for actividad_data in actividades_data:
                Actividad.objects.create(etapa=etapa, **actividad_data)
                
        return estrategia

    
class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = [
            'id', 'razon_social', 'ruc', 'correo', 'estado'
        ]

class EmpresaDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = [
            'id', 'razon_social', 'ruc', 'representante', 'correo', 'direccion',
            'telefono', 'departamento', 'provincia', 'distrito', 'estado',
            'objetivo', 'mision', 'vision', 'valores', 'historia',
            'web', 'facebook', 'instagram'
        ]

class EmpresaParaMentorSerializer(serializers.ModelSerializer):
    """
    Serializer para que el mentor vea la empresa y sus estrategias.
    """
    estrategias = EstrategiaSerializer(many=True, read_only=True, source='estrategias')

    class Meta:
        model = Empresa
        fields = [
            'id', 'razon_social', 'ruc', 'correo', 'objetivo', 
            'mision', 'vision', 'historia', 'estrategias', 'estado'
        ]

class EmpresaPerfilSerializer(serializers.ModelSerializer):
    """
    Serializer para el perfil de la empresa, usado para saber si ya solicitó mentoría.
    """
    tiene_mentor = serializers.SerializerMethodField()

    class Meta:
        model = Empresa
        fields = [
            'razon_social', 'ruc', 'representante', 'correo', 'direccion', 
            'telefono', 'objetivo', 'mision', 'vision', 'historia', 'web', 
            'facebook', 'instagram', 'solicita_mentoria', 'tiene_mentor'
        ]
        read_only_fields = ('ruc', 'razon_social', 'solicita_mentoria', 'tiene_mentor')

    def get_tiene_mentor(self, obj):
        return obj.mentores.exists()