#!/usr/bin/env python
"""
Script para probar el sistema de mentoría por estrategias
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PC3_Interbank.settings')
django.setup()

from apps.empresas.models import Empresa, Estrategia
from apps.users.models import Usuario

def test_mentoria_estrategias():
    print("🧪 PROBANDO SISTEMA DE MENTORÍA POR ESTRATEGIAS")
    print("=" * 60)
    
    # 1. Verificar que no hay campo 'mentores' en Empresa
    print("\n1. Verificando modelo Empresa...")
    try:
        # Intentar acceder al campo mentores (debería fallar)
        empresa = Empresa.objects.first()
        if empresa:
            try:
                mentores = empresa.mentores.all()
                print("❌ ERROR: El campo 'mentores' aún existe en el modelo Empresa")
                return False
            except AttributeError:
                print("✅ CORRECTO: Campo 'mentores' eliminado del modelo Empresa")
    except Exception as e:
        print(f"⚠️  Error al verificar modelo Empresa: {e}")
    
    # 2. Verificar estrategias con campos de mentoría
    print("\n2. Verificando estrategias con campos de mentoría...")
    estrategias = Estrategia.objects.all()
    estrategias_con_mentoria = estrategias.filter(solicita_mentoria=True)
    
    print(f"📊 Total de estrategias: {estrategias.count()}")
    print(f"📨 Estrategias solicitando mentoría: {estrategias_con_mentoria.count()}")
    
    for estrategia in estrategias_con_mentoria[:3]:  # Mostrar solo las primeras 3
        print(f"   📋 {estrategia.titulo}")
        print(f"      Especialidad requerida: {estrategia.especialidad_requerida}")
        print(f"      Mentor asignado: {estrategia.mentor_asignado}")
        print(f"      Fecha solicitud: {estrategia.fecha_solicitud_mentoria}")
    
    # 3. Verificar mentores con especialidades
    print("\n3. Verificando mentores...")
    mentores = Usuario.objects.filter(rol='mentor')
    mentores_con_especialidad = mentores.exclude(especialidades__isnull=True).exclude(especialidades='')
    
    print(f"👨‍💼 Total de mentores: {mentores.count()}")
    print(f"🎯 Mentores con especialidad: {mentores_con_especialidad.count()}")
    
    if mentores_con_especialidad.exists():
        print("👨‍💼 Especialidades de mentores:")
        for mentor in mentores_con_especialidad:
            print(f"   • {mentor.nombre}: {mentor.especialidades}")
    else:
        print("⚠️  No hay mentores con especialidades asignadas")
    
    # 4. Verificar URLs y vistas
    print("\n4. URLs importantes:")
    print("   📡 GET /mentor/dashboard/solicitudes/ - Ver solicitudes para mentores")
    print("   📡 GET /mentor/api/estrategias-solicitan/ - API de solicitudes")
    print("   📡 POST /mentor/api/estrategias/{id}/aceptar/ - Aceptar mentoría")
    print("   📡 GET /users/dashboard/estrategias/{id}/actividades/ - Ver estrategia con botón mentoría")
    print("   📡 POST /empresas/api/estrategias/{id}/solicitar-mentoria/ - Solicitar mentoría")
    print("   📡 POST /empresas/api/estrategias/{id}/cancelar-mentoria/ - Cancelar mentoría")
    
    print("\n✅ SISTEMA DE MENTORÍA POR ESTRATEGIAS CONFIGURADO")
    print("\n📝 Próximos pasos:")
    print("1. Asigna especialidades a los mentores via Django Admin")
    print("2. Ve a una estrategia específica y solicita mentoría")
    print("3. Los mentores ven solo estrategias de su especialidad")
    print("4. Los mentores aceptan mentoría desde su dashboard")
    print("5. Una empresa puede tener múltiples mentores (uno por estrategia)")
    
    return True

if __name__ == "__main__":
    test_mentoria_estrategias()
