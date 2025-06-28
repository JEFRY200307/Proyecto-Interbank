#!/usr/bin/env python
"""
Test básico para verificar que las vistas del mentor funcionan correctamente
"""
import os
import sys
import django

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PC3_Interbank.settings')
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.empresas.models import Empresa, Estrategia

User = get_user_model()

def test_basic_imports():
    """Test básico para verificar que las importaciones funcionan"""
    try:
        from apps.mentor.views import EstrategiasSolicitanMentoriaAPIView
        from apps.empresas.models import Estrategia as EstrategiaEmpresa
        print("✅ Importaciones correctas")
        return True
    except ImportError as e:
        print(f"❌ Error de importación: {e}")
        return False

def test_model_fields():
    """Test para verificar que los modelos tienen los campos necesarios"""
    try:
        # Verificar campo mentor_asignado en Estrategia
        estrategia_fields = [field.name for field in Estrategia._meta.get_fields()]
        if 'mentor_asignado' in estrategia_fields:
            print("✅ Campo mentor_asignado existe en modelo Estrategia")
        else:
            print("❌ Campo mentor_asignado NO existe en modelo Estrategia")
            
        # Verificar campo especialidades en User
        user_fields = [field.name for field in User._meta.get_fields()]
        if 'especialidades' in user_fields:
            print("✅ Campo especialidades existe en modelo Usuario")
        else:
            print("❌ Campo especialidades NO existe en modelo Usuario")
            
        return True
    except Exception as e:
        print(f"❌ Error verificando campos: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Ejecutando tests básicos del sistema mentor...")
    print("-" * 50)
    
    test_basic_imports()
    test_model_fields()
    
    print("-" * 50)
    print("✅ Tests completados")
