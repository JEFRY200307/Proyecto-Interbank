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
    mentor_asignado_nombre = serializers.CharField(source='mentor_asignado.nombre', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.razon_social', read_only=True)

    class Meta:
        model = Estrategia
        fields = [
            'id', 'titulo', 'descripcion', 'categoria', 
            'fecha_cumplimiento', 'estado', 'etapas',
            'solicita_mentoria', 'especialidad_requerida', 
            'mentor_asignado', 'mentor_asignado_nombre',
            'fecha_solicitud_mentoria', 'fecha_asignacion_mentor',
            'empresa_nombre'
        ]
        read_only_fields = ['id', 'mentor_asignado_nombre', 'empresa_nombre', 'fecha_asignacion_mentor']

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
    Serializer para que el mentor vea y EDITE la empresa y sus estrategias.
    """
    estrategias = EstrategiaSerializer(many=True, required=False)

    class Meta:
        model = Empresa
        fields = [
            'id', 'razon_social', 'ruc', 'correo', 'objetivo', 
            'mision', 'vision', 'historia', 'estrategias', 'estado'
        ]

    @transaction.atomic
    def update(self, instance, validated_data):
        estrategias_data = validated_data.pop('estrategias', [])
        
        # Actualiza los campos de la empresa (si los hubiera)
        instance = super().update(instance, validated_data)

        # Lógica para actualizar las estrategias anidadas
        for estrategia_data in estrategias_data:
            estrategia_id = estrategia_data.get('id')
            if estrategia_id:
                estrategia = Estrategia.objects.get(id=estrategia_id, empresa=instance)
                # Actualiza cada campo de la estrategia que venga en la petición
                for key, value in estrategia_data.items():
                    setattr(estrategia, key, value)
                estrategia.save()
            # Aquí se podría añadir lógica para crear nuevas estrategias si no vienen con ID
        
        return instance

class EmpresaPerfilSerializer(serializers.ModelSerializer):
    """
    Serializer para el perfil de la empresa, adaptado al nuevo sistema de mentoría por estrategias.
    """
    tiene_mentor = serializers.SerializerMethodField()
    estrategias_con_mentoria = serializers.SerializerMethodField()
    total_estrategias = serializers.SerializerMethodField()
    estrategias_solicitando_mentoria = serializers.SerializerMethodField()

    class Meta:
        model = Empresa
        fields = [
            'razon_social', 'ruc', 'representante', 'correo', 'direccion', 
            'telefono', 'objetivo', 'mision', 'vision', 'historia', 'web', 
            'facebook', 'instagram', 'tiene_mentor', 'estrategias_con_mentoria',
            'total_estrategias', 'estrategias_solicitando_mentoria'
        ]
        read_only_fields = ('ruc', 'razon_social', 'tiene_mentor', 'estrategias_con_mentoria', 
                          'total_estrategias', 'estrategias_solicitando_mentoria')

    def get_tiene_mentor(self, obj):
        """Verifica si la empresa tiene al menos una estrategia con mentor asignado"""
        return obj.estrategia_set.filter(mentor_asignado__isnull=False).exists()
    
    def get_estrategias_con_mentoria(self, obj):
        """Cuenta estrategias que ya tienen mentor asignado"""
        return obj.estrategia_set.filter(mentor_asignado__isnull=False).count()
    
    def get_total_estrategias(self, obj):
        """Cuenta total de estrategias de la empresa"""
        return obj.estrategia_set.count()
    
    def get_estrategias_solicitando_mentoria(self, obj):
        """Cuenta estrategias que están solicitando mentoría pero aún no tienen mentor"""
        return obj.estrategia_set.filter(solicita_mentoria=True, mentor_asignado__isnull=True).count()

class EstrategiaConMentoriaSerializer(serializers.ModelSerializer):
    """
    Serializer especializado para mostrar estrategias con información de mentoría
    """
    mentor_asignado_nombre = serializers.CharField(source='mentor_asignado.nombre', read_only=True)
    mentor_especialidad = serializers.CharField(source='mentor_asignado.especialidades', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.razon_social', read_only=True)
    estado_mentoria = serializers.SerializerMethodField()
    puede_solicitar_mentoria = serializers.SerializerMethodField()
    puede_cancelar_solicitud = serializers.SerializerMethodField()

    class Meta:
        model = Estrategia
        fields = [
            'id', 'titulo', 'descripcion', 'categoria', 'estado',
            'fecha_cumplimiento', 'fecha_registro',
            'solicita_mentoria', 'especialidad_requerida', 
            'mentor_asignado', 'mentor_asignado_nombre', 'mentor_especialidad',
            'fecha_solicitud_mentoria', 'fecha_asignacion_mentor',
            'empresa_nombre', 'estado_mentoria', 
            'puede_solicitar_mentoria', 'puede_cancelar_solicitud'
        ]
        read_only_fields = [
            'id', 'fecha_registro', 'mentor_asignado_nombre', 'mentor_especialidad',
            'empresa_nombre', 'fecha_asignacion_mentor', 'estado_mentoria',
            'puede_solicitar_mentoria', 'puede_cancelar_solicitud'
        ]

    def get_estado_mentoria(self, obj):
        """Devuelve el estado actual de mentoría de la estrategia"""
        if obj.mentor_asignado:
            return {
                'codigo': 'CON_MENTOR',
                'descripcion': 'Tiene mentor asignado',
                'mentor': obj.mentor_asignado.nombre,
                'fecha_asignacion': obj.fecha_asignacion_mentor
            }
        elif obj.solicita_mentoria:
            return {
                'codigo': 'SOLICITANDO',
                'descripcion': f'Buscando mentor en {obj.especialidad_requerida}',
                'especialidad': obj.especialidad_requerida,
                'fecha_solicitud': obj.fecha_solicitud_mentoria
            }
        else:
            return {
                'codigo': 'SIN_MENTORIA',
                'descripcion': 'Sin mentoría',
                'disponible': True
            }

    def get_puede_solicitar_mentoria(self, obj):
        """Verifica si se puede solicitar mentoría para esta estrategia"""
        return not obj.solicita_mentoria and not obj.mentor_asignado

    def get_puede_cancelar_solicitud(self, obj):
        """Verifica si se puede cancelar la solicitud de mentoría"""
        return obj.solicita_mentoria and not obj.mentor_asignado