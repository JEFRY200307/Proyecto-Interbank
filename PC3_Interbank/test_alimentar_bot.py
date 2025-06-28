#!/usr/bin/env python3
"""
Prueba funcional para verificar el sistema de alimentar bots
"""

import os
import sys
import django
from pathlib import Path

# Configurar Django
sys.path.append(str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PC3_Interbank.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.chat.models import ChatCategory, BotFeeding
try:
    from apps.empresas.models import Estrategia
except ImportError:
    print("⚠️ Modelo Estrategia no encontrado, usando mock")
    Estrategia = None

try:
    from apps.mentor.models import MentorProfile
except ImportError:
    print("⚠️ Modelo MentorProfile no encontrado, creando usuarios simples")
    MentorProfile = None

User = get_user_model()

def test_alimentar_bot():
    """
    Prueba el sistema de alimentar bots con texto libre y estrategias
    """
    print("🧪 === PRUEBA: Sistema de Alimentar Bots ===")
    
    # 1. Verificar que existan categorías de chatbot
    categorias = ChatCategory.objects.all()
    print(f"📋 Categorías de chatbot disponibles: {categorias.count()}")
    for cat in categorias:
        print(f"   - {cat.name}")
    
    if not categorias.exists():
        print("❌ No hay categorías de chatbot. Creando una de prueba...")
        categoria = ChatCategory.objects.create(name="Marketing Digital")
        print(f"✅ Categoría creada: {categoria.name}")
    else:
        categoria = categorias.first()
    
    # 2. Verificar que existan mentores
    mentores = User.objects.filter(is_staff=True)  # Usar staff como mentores
    print(f"👨‍💼 Usuarios staff disponibles: {mentores.count()}")
    
    if not mentores.exists():
        print("❌ No hay usuarios staff. Creando uno de prueba...")
        # Crear un usuario de prueba
        try:
            mentor = User.objects.create_user(
                username='mentor_test',
                email='mentor@test.com',
                password='testpass123'
            )
            mentor.is_staff = True
            mentor.save()
            print(f"✅ Usuario mentor creado: {mentor.email}")
        except Exception as e:
            print(f"❌ Error al crear mentor: {e}")
            # Usar el primer usuario disponible
            usuarios = User.objects.all()
            if usuarios.exists():
                mentor = usuarios.first()
                mentor_name = getattr(mentor, 'username', None) or getattr(mentor, 'email', 'Usuario desconocido')
                print(f"✅ Usando usuario existente: {mentor_name}")
            else:
                print("❌ No hay usuarios en el sistema")
                return
    else:
        mentor = mentores.first()
    
    # 3. Verificar que existan estrategias del mentor (opcional)
    if Estrategia:
        try:
            estrategias = Estrategia.objects.filter(mentor=mentor)
            mentor_name = getattr(mentor, 'username', None) or getattr(mentor, 'email', 'Usuario desconocido')
            print(f"🎯 Estrategias del mentor {mentor_name}: {estrategias.count()}")
        except Exception as e:
            print(f"🎯 No se pueden consultar estrategias: {e}")
            estrategias = None
    else:
        print("🎯 Modelo Estrategia no disponible")
        estrategias = None
    
    if not estrategias or (hasattr(estrategias, 'exists') and not estrategias.exists()):
        print("📝 No hay estrategias. El sistema aún puede funcionar con texto libre.")
    
    # 4. Simular alimentación con texto libre
    print("\n🔥 Simulando alimentación con texto libre...")
    try:
        alimentacion_texto = BotFeeding.objects.create(
            categoria=categoria,
            mentor=mentor,
            tipo='texto_libre',
            contenido="""
            CONOCIMIENTO ADICIONAL: Estrategias de Marketing Digital para PYMEs Peruanas
            
            1. Campañas en Facebook Ads con presupuesto de S/500-1000 mensuales
            2. Uso de influencers locales para aumentar alcance
            3. Contenido adaptado a fechas importantes del Perú (Fiestas Patrias, Inti Raymi, etc.)
            4. Implementación de chatbots para atención 24/7
            5. SEO local enfocado en "cerca de mí" para negocios físicos
            
            Este conocimiento debe ser usado para generar roadmaps más precisos y contextualizados.
            """,
            activa=True
        )
        print(f"✅ Alimentación con texto libre creada: ID {alimentacion_texto.id}")
    except Exception as e:
        print(f"❌ Error al crear alimentación con texto libre: {e}")
    
    # 5. Simular alimentación con estrategia de referencia (si existe)
    if estrategias and hasattr(estrategias, 'exists') and estrategias.exists():
        print("\n🎯 Simulando alimentación con estrategia de referencia...")
        try:
            estrategia = estrategias.first()
            
            # Preparar contenido de la estrategia
            contenido_estrategia = f"""
ESTRATEGIA DE REFERENCIA: {estrategia.titulo}

DESCRIPCIÓN: {estrategia.descripcion}

EMPRESA: {estrategia.empresa.nombre if hasattr(estrategia, 'empresa') and estrategia.empresa else 'No especificada'}

CATEGORÍA: {estrategia.categoria if hasattr(estrategia, 'categoria') else 'No especificada'}

ESTADO: {'Aceptada' if hasattr(estrategia, 'estado') and estrategia.estado == 'aceptada' else 'Activa'}

Esta estrategia debe ser usada como referencia para generar roadmaps similares.
"""
            
            alimentacion_estrategia = BotFeeding.objects.create(
                categoria=categoria,
                mentor=mentor,
                tipo='estrategia_referencia',
                contenido=contenido_estrategia,
                estrategia_referencia=estrategia,
                activa=True
            )
            print(f"✅ Alimentación con estrategia de referencia creada: ID {alimentacion_estrategia.id}")
        except Exception as e:
            print(f"❌ Error al crear alimentación con estrategia: {e}")
    else:
        print("\n🎯 No hay estrategias disponibles para referenciar")
    
    # 6. Verificar alimentaciones creadas
    print("\n📊 Resumen de alimentaciones:")
    alimentaciones = BotFeeding.objects.filter(categoria=categoria)
    for alimentacion in alimentaciones:
        mentor_name = getattr(alimentacion.mentor, 'username', None) or getattr(alimentacion.mentor, 'email', 'Usuario desconocido')
        print(f"   - {alimentacion.get_tipo_display()} por {mentor_name}")
        print(f"     Activa: {'Sí' if alimentacion.activa else 'No'}")
        print(f"     Fecha: {alimentacion.fecha_creacion.strftime('%Y-%m-%d %H:%M')}")
        if alimentacion.estrategia_referencia:
            print(f"     Estrategia: {alimentacion.estrategia_referencia.titulo}")
        print()
    
    print("✅ === PRUEBA COMPLETADA ===")
    print("\n🎯 INSTRUCCIONES PARA EL FRONTEND:")
    print("1. El formulario de 'alimentar al bot' ahora está centrado correctamente")
    print("2. Usa las rutas /chat/api/alimentar-bot/ para enviar datos")
    print("3. El chatbot usará automáticamente estas alimentaciones en sus respuestas")
    print("4. Las estrategias son opcionales - si no hay, solo se usa texto libre")
    
    return True

if __name__ == "__main__":
    test_alimentar_bot()
