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
        fields = '__all__'

class ActividadUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actividad
        fields = ['completada']

# --- AÑADE ESTA CLASE ANTES DE EstrategiaSerializer ---
class EtapaSerializer(serializers.ModelSerializer):
    # Define que las actividades son anidadas y opcionales
    actividades = ActividadSerializer(many=True, required=False)

    class Meta:
        model = Etapa
        fields = ['id', 'nombre', 'descripcion', 'actividades']
        read_only_fields = ['id']


class EstrategiaSerializer(serializers.ModelSerializer):
    # Ahora EtapaSerializer está definido y puede ser usado aquí
    etapas = EtapaSerializer(many=True, required=False)

    class Meta:
        model = Estrategia
        fields = [
            'id', 'titulo', 'descripcion', 'categoria', 
            'fecha_cumplimiento', 'estado', 'etapas'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        """
        Crea una Estrategia junto con sus Etapas y Actividades anidadas.
        """
        # Extrae los datos de las etapas. Si no vienen, usa una lista vacía.
        etapas_data = validated_data.pop('etapas', [])
        
        # Crea el objeto principal de la Estrategia
        estrategia = Estrategia.objects.create(**validated_data)

        # Itera sobre los datos de cada etapa para crear los objetos Etapa
        for etapa_data in etapas_data:
            
            # --- AQUÍ ESTÁ LA CORRECCIÓN ---
            # Extrae las actividades de la etapa. Si no hay, usa una lista vacía.
            # Esto evita el error 'KeyError: actividades'.
            actividades_data = etapa_data.pop('actividades', [])
            
            # Crea el objeto Etapa, asociándolo a la Estrategia recién creada
            etapa = Etapa.objects.create(estrategia=estrategia, **etapa_data)

            # Itera sobre las actividades para crear los objetos Actividad
            for actividad_data in actividades_data:
                Actividad.objects.create(etapa=etapa, **actividad_data)
        
        return estrategia

# --- FIN DE LA SECCIÓN A REEMPLAZAR ---

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