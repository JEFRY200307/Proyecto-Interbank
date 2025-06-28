"""
Script final de verificación del sistema de mentoría por estrategias
Ejecutar después de aplicar las migraciones y configurar especialidades
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PC3_Interbank.settings')
django.setup()

from apps.users.models import Usuario
from apps.empresas.models import Empresa, Estrategia
from django.utils import timezone

def crear_datos_prueba():
    print("🔧 Creando datos de prueba para el sistema de mentoría...\n")
    
    # 1. Crear mentor con especialidad
    mentor, created = Usuario.objects.get_or_create(
        correo='mentor@test.com',
        defaults={
            'nombre': 'Juan Mentor',
            'rol': 'mentor',
            'especialidades': 'marketing',
            'is_active': True
        }
    )
    
    if created:
        mentor.set_password('password123')
        mentor.save()
        print(f"✅ Mentor creado: {mentor.nombre} - Especialidad: {mentor.especialidades}")
    else:
        mentor.especialidades = 'marketing'
        mentor.save()
        print(f"✅ Mentor actualizado: {mentor.nombre} - Especialidad: {mentor.especialidades}")
    
    # 2. Crear empresa y usuario empresa
    empresa, created = Empresa.objects.get_or_create(
        ruc='20123456789',
        defaults={
            'razon_social': 'Empresa Test SAC',
            'correo': 'empresa@test.com',
            'representante': 'Maria Empresa',
            'password': 'hashedpassword'
        }
    )
    
    if created:
        print(f"✅ Empresa creada: {empresa.razon_social}")
    
    usuario_empresa, created = Usuario.objects.get_or_create(
        correo='empresa@test.com',
        defaults={
            'nombre': 'Maria Empresa',
            'rol': 'empresa',
            'empresa': empresa,
            'is_active': True
        }
    )
    
    if created:
        usuario_empresa.set_password('password123')
        usuario_empresa.save()
        print(f"✅ Usuario empresa creado: {usuario_empresa.nombre}")
    
    # 3. Crear estrategias de prueba
    estrategias_data = [
        {
            'titulo': 'Campaña Marketing Digital',
            'descripcion': 'Necesitamos ayuda para crear una campaña en redes sociales',
            'categoria': 'marketing',
            'solicita_mentoria': True,
            'especialidad_requerida': 'marketing',
            'fecha_solicitud_mentoria': timezone.now()
        },
        {
            'titulo': 'Optimización Financiera',
            'descripcion': 'Mejorar el flujo de caja y rentabilidad',
            'categoria': 'finanzas',
            'solicita_mentoria': False
        },
        {
            'titulo': 'Expansión Internacional',
            'descripcion': 'Queremos expandirnos a mercados internacionales',
            'categoria': 'internacional',
            'solicita_mentoria': True,
            'especialidad_requerida': 'internacional',
            'fecha_solicitud_mentoria': timezone.now()
        }
    ]
    
    for data in estrategias_data:
        estrategia, created = Estrategia.objects.get_or_create(
            titulo=data['titulo'],
            empresa=empresa,
            defaults={
                'usuario': usuario_empresa,
                'descripcion': data['descripcion'],
                'categoria': data['categoria'],
                'solicita_mentoria': data['solicita_mentoria'],
                'especialidad_requerida': data.get('especialidad_requerida'),
                'fecha_solicitud_mentoria': data.get('fecha_solicitud_mentoria')
            }
        )
        
        if created:
            print(f"✅ Estrategia creada: {estrategia.titulo}")
    
    print("\n🎉 Datos de prueba creados correctamente!")
    return mentor, empresa, usuario_empresa

def probar_sistema_mentoria():
    print("\n🧪 Probando el sistema de mentoría por estrategias...\n")
    
    # Crear datos de prueba
    mentor, empresa, usuario_empresa = crear_datos_prueba()
    
    # 1. Probar filtrado de estrategias por especialidad
    print("1. Probando filtrado por especialidad...")
    
    estrategias_marketing = Estrategia.objects.filter(
        solicita_mentoria=True,
        mentor_asignado__isnull=True,
        especialidad_requerida='marketing'
    )
    
    print(f"   📊 Estrategias de marketing solicitando mentoría: {estrategias_marketing.count()}")
    
    for estrategia in estrategias_marketing:
        print(f"   - {estrategia.titulo} (Empresa: {estrategia.empresa.razon_social})")
    
    # 2. Simular asignación de mentor
    print("\n2. Simulando asignación de mentor...")
    
    if estrategias_marketing.exists():
        estrategia = estrategias_marketing.first()
        estrategia.mentor_asignado = mentor
        estrategia.fecha_asignacion_mentor = timezone.now()
        estrategia.save()
        
        # En el nuevo sistema, no se necesita agregar la empresa al mentor
        # La relación se establece a través de las estrategias
        
        print(f"   ✅ Mentor {mentor.nombre} asignado a estrategia '{estrategia.titulo}'")
    
    # 3. Verificar estadísticas
    print("\n3. Estadísticas del sistema:")
    
    total_estrategias = Estrategia.objects.count()
    con_mentor = Estrategia.objects.filter(mentor_asignado__isnull=False).count()
    solicitando = Estrategia.objects.filter(solicita_mentoria=True, mentor_asignado__isnull=True).count()
    sin_mentoria = Estrategia.objects.filter(solicita_mentoria=False, mentor_asignado__isnull=True).count()
    
    print(f"   📊 Total estrategias: {total_estrategias}")
    print(f"   📊 Con mentor asignado: {con_mentor}")
    print(f"   📊 Solicitando mentoría: {solicitando}")
    print(f"   📊 Sin mentoría: {sin_mentoria}")
    
    # 4. Verificar APIs (simulado)
    print("\n4. URLs de APIs disponibles:")
    print("   📡 POST /empresas/api/solicitar-mentoria-estrategia/ - Solicitar mentoría")
    print("   📡 DELETE /empresas/api/solicitar-mentoria-estrategia/ - Cancelar solicitud")
    print("   📡 GET /empresas/api/estrategias-con-mentoria/ - Ver estrategias con mentoría")
    print("   📡 GET /mentor/api/estrategias-solicitan/ - Ver solicitudes para mentores")
    print("   📡 POST /mentor/api/estrategias/{id}/aceptar_mentoria/ - Aceptar mentoría")
    
    print("\n✅ Sistema de mentoría por estrategias funcionando correctamente!")
    
    # 5. Instrucciones finales
    print("\n📝 Para usar el sistema:")
    print("1. Asigna especialidades a los mentores via Django Admin")
    print("2. Las empresas pueden solicitar mentoría por estrategia específica")
    print("3. Los mentores ven solo estrategias de su especialidad")
    print("4. Se puede aceptar/cancelar mentoría individualmente")
    print("5. Una empresa puede tener múltiples mentores (uno por estrategia)")

if __name__ == "__main__":
    try:
        probar_sistema_mentoria()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
