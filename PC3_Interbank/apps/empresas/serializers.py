# apps/empresas/serializers.py

from rest_framework import serializers
from .models import Empresa
from django.contrib.auth.hashers import make_password

class EmpresaRegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Empresa
        fields = ['razon_social', 'ruc', 'representante', 'correo', 'password', 'direccion', 'telefono']

    def create(self, validated_data):
        password = validated_data.pop('password')
        empresa = Empresa(**validated_data)
        empresa.password = make_password(password)
        empresa.save()
        return empresa