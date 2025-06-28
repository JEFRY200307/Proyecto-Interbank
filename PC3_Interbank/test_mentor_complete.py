#!/usr/bin/env python
"""
Test completo para verificar que las vistas del mentor funcionan correctamente
"""
import os
import sys
import django

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PC3_Interbank.settings')
django.setup()

from django.test import RequestFactory, TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from apps.empresas.models import Empresa, Estrategia
from apps.mentor.views import EstrategiasSolicitanMentoriaAPIView

User = get_user_model()

def test_mentor_views():
    """Test para verificar que las vistas del mentor funcionan"""
    try:
        factory = RequestFactory()
        
        # Crear un usuario mentor
        mentor = User.objects.create_user(
            correo='mentor@test.com',
            password='test123',
            nombre='Mentor Test',
            rol='mentor',
            especialidades='marketing'
        )
        
        # Test de la vista de solicitudes
        request = factory.get('/mentor/api/estrategias-solicitan/')
        request.user = mentor
        
        view = EstrategiasSolicitanMentoriaAPIView()
        view.request = request
        
        response = view.get(request)
        
        if response.status_code == 200:
            print("✅ Vista de solicitudes de mentoría funciona correctamente")
        else:
            print(f"❌ Error en vista de solicitudes: {response.status_code}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error en test de vistas: {e}")
        return False

def test_urls_accessible():
    """Test para verificar que las URLs son accesibles"""
    try:
        urls_to_test = [
            'dashboard_mentor',
            'mentor_empresas_api',
            'mentor_estrategias_solicitan_api',
        ]
        
        for url_name in urls_to_test:
            try:
                url = reverse(url_name)
                print(f"✅ URL {url_name}: {url}")
            except Exception as e:
                print(f"❌ Error con URL {url_name}: {e}")
                
        return True
        
    except Exception as e:
        print(f"❌ Error general en test de URLs: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Ejecutando tests completos del sistema mentor...")
    print("-" * 60)
    
    test_urls_accessible()
    print("-" * 60)
    test_mentor_views()
    
    print("-" * 60)
    print("✅ Tests completados")
