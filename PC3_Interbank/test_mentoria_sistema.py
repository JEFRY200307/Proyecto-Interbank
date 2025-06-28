"""
Script de prueba para el nuevo sistema de mentoría por estrategias
Ejecutar después de aplicar las migraciones
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PC3_Interbank.settings')
django.setup()

from apps.users.models import Usuario
from apps.empresas.models import Empresa, Estrategia
from django.contrib.auth import get_user_model

def test_mentoria_sistema():
    print("🧪 Iniciando pruebas del sistema de mentoría por estrategias...\n")
    
    # 1. Verificar que los campos nuevos existen
    print("1. Verificando modelo Estrategia...")
    
    try:
        # Crear una estrategia de prueba
        empresa = Empresa.objects.first()
        if not empresa:
            print("❌ Error: No hay empresas en la base de datos")
            return
            
        estrategia = Estrategia(
            empresa=empresa,
            titulo="Estrategia de prueba",
            descripcion="Prueba del nuevo sistema",
            categoria="marketing",
            solicita_mentoria=False,
            especialidad_requerida=None
        )
        
        print("✅ Modelo Estrategia tiene los nuevos campos")
        
    except Exception as e:
        print(f"❌ Error en modelo Estrategia: {e}")
        return
    
    # 2. Verificar modelo Usuario
    print("\n2. Verificando modelo Usuario...")
    
    try:
        usuario = Usuario.objects.first()
        if usuario:
            # Verificar que el campo especialidades existe
            especialidades = usuario.especialidades
            print("✅ Modelo Usuario tiene campo especialidades")
        else:
            print("⚠️  No hay usuarios en la base de datos")
            
    except Exception as e:
        print(f"❌ Error en modelo Usuario: {e}")
        return
    
    # 3. Verificar que el campo solicita_mentoria ya no existe en Empresa
    print("\n3. Verificando modelo Empresa...")
    
    try:
        empresa = Empresa.objects.first()
        if empresa:
            # Esto debería fallar si se removió correctamente
            try:
                solicita = empresa.solicita_mentoria
                print("❌ ERROR: El campo solicita_mentoria aún existe en Empresa")
            except AttributeError:
                print("✅ Campo solicita_mentoria removido correctamente de Empresa")
        
    except Exception as e:
        print(f"❌ Error verificando Empresa: {e}")
    
    # 4. Contar estrategias existentes
    print("\n4. Verificando datos existentes...")
    
    total_estrategias = Estrategia.objects.count()
    estrategias_con_mentoria = Estrategia.objects.filter(solicita_mentoria=True).count()
    estrategias_con_mentor = Estrategia.objects.filter(mentor_asignado__isnull=False).count()
    
    print(f"📊 Total de estrategias: {total_estrategias}")
    print(f"📊 Estrategias solicitando mentoría: {estrategias_con_mentoria}")
    print(f"📊 Estrategias con mentor asignado: {estrategias_con_mentor}")
    
    # 5. Verificar mentores con especialidades
    print("\n5. Verificando mentores...")
    
    mentores = Usuario.objects.filter(rol='mentor')
    mentores_con_especialidad = mentores.exclude(especialidades__isnull=True).exclude(especialidades='')
    
    print(f"👨‍💼 Total de mentores: {mentores.count()}")
    print(f"👨‍💼 Mentores con especialidad: {mentores_con_especialidad.count()}")
    
    if mentores_con_especialidad.exists():
        print("👨‍💼 Especialidades de mentores:")
        for mentor in mentores_con_especialidad:
            print(f"   - {mentor.nombre}: {mentor.especialidades}")
    
    print("\n✅ Pruebas completadas. El sistema está listo para usar!")
    
    # 6. Sugerencias
    print("\n📝 Siguientes pasos sugeridos:")
    print("1. Asignar especialidades a los mentores existentes via Django Admin")
    print("2. Probar la creación de estrategias desde el frontend")
    print("3. Probar el flujo completo de solicitud y aceptación de mentoría")
    print("4. Verificar que las APIs nuevas funcionan correctamente")

if __name__ == "__main__":
    test_mentoria_sistema()
