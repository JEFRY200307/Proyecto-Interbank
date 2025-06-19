# apps/empresas/serializers.py

from rest_framework import serializers
from .models import Empresa, Estrategia, Actividad
from django.contrib.auth.hashers import make_password

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
        fields = ['id', 'descripcion', 'fecha_limite', 'completada']  # NO incluyas 'estrategia'

class EstrategiaSerializer(serializers.ModelSerializer):
    actividades = ActividadSerializer(many=True, read_only=False)

    class Meta:
        model = Estrategia
        fields = '__all__'

    def create(self, validated_data):
        actividades_data = validated_data.pop('actividades', [])
        estrategia = Estrategia.objects.create(**validated_data)
        for actividad_data in actividades_data:
            Actividad.objects.create(estrategia=estrategia, **actividad_data)
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