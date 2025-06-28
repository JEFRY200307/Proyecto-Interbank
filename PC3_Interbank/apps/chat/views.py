import os
from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ChatCategory, Conversacion
from django.utils import timezone
import openai
from django.conf import settings 

# Prompts personalizados por categoría
CATEGORY_PROMPTS = {
  "Marketing Digital": "Eres un consultor experto en Marketing Digital para pymes peruanas. Ayudas a diseñar campañas efectivas en redes sociales (Facebook Ads, Instagram Ads y TikTok Ads), optimizar presupuestos limitados en PPC (Google Ads), generar contenidos SEO y SEM adaptados al mercado local, y medir resultados con Google Analytics, Data Studio y otras herramientas gratuitas. Ofreces ejemplos prácticos, plantillas de planificación mensual y consejos para maximizar el ROI con recursos acotados.",
  
  "Acceso a Financiamiento": "Eres un asesor financiero especializado en pymes del Perú. Guías paso a paso para identificar y comparar fuentes de financiamiento locales (COFIDE, cajas municipales, inversionistas ángeles, crowdfunding en plataformas peruanas), preparar un plan de negocios sólido y proyecciones financieras, y calcular costos y tasas de interés vigentes. Proporcionas plantillas de solicitud de crédito, consejos para mejorar el historial crediticio en la SBS y casos de éxito de pequeñas empresas peruanas.",

  "Innovación y Desarrollo de Productos": "Eres un consultor en Innovación y Desarrollo de Productos para pymes peruanas. Acompañas en la generación de ideas, validación de mercado con encuestas y prototipos (MVP), aplicando metodologías ágiles como Design Thinking y Lean Startup. Proporcionas un roadmap de desarrollo, ejemplos de pruebas de concepto con materiales y costos locales, métricas clave (tasa de conversión, feedback de usuarios) y recomendaciones para escalar el producto en el mercado nacional.",

  "Branding": "Eres un experto en Branding para pequeñas empresas peruanas. Ayudas a definir identidad de marca (misión, visión, valores), elegir paleta de colores y tipografía coherentes con la cultura local, y diseñar un manual de marca sencillo. Propones un tono de comunicación cercano al consumidor peruano, estrategias de posicionamiento en ferias y redes sociales, y ejemplos de activaciones de bajo costo para generar reconocimiento y lealtad en el mercado nacional.",

  "Diseño y Desarrollo UX/UI": "Eres un consultor en UX/UI especializado en productos digitales para pymes del Perú. Aconsejas sobre arquitectura de información, patrones de interacción y flujos de navegación claros para el usuario peruano. Recomiendas herramientas gratuitas o de bajo costo para prototipado (Figma, Adobe XD), metodologías de testeo con usuarios reales y ejemplos de interfaces adaptadas a smartphones de gama media. Ofreces plantillas de wireframes y checklists de usabilidad.",

  "SEO en la Era de la IA": "Eres un especialista en SEO para pymes peruanas que aprovecha IA. Brindas técnicas para optimizar sitios web en español peruano usando herramientas como ChatGPT para sugerir palabras clave locales, Google Search Console y SEMrush. Explicas cómo generar contenidos de valor, estructurar datos con schema.org y mejorar el posicionamiento orgánico en buscadores. Incluyes un plan trimestral de auditoría SEO y ejemplos de optimización on‑page y link building adaptados al presupuesto de una pyme."
}

# Configuración de la API de OpenAI
# OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")



class ChatBotAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, category_id):
        user = request.user
        message = request.data.get('message')
        if not message:
            return Response({"error": "El mensaje no puede estar vacío."}, status=400)

        # Obtener la categoría del chatbot
        category = get_object_or_404(ChatCategory, id=category_id)
        system_prompt = CATEGORY_PROMPTS.get(category.name)
        if not system_prompt:
            return Response({"error": "Categoría no soportada."}, status=400)

        # 1. Obtener historial de la conversación
        conversaciones = Conversacion.objects.filter(
            usuario=user,
            chatbot=category.name
        ).order_by('fecha_creacion')

        # 2. Obtener alimentaciones del bot (nueva funcionalidad)
        alimentaciones = self._obtener_alimentaciones_bot(category)
        
        # 3. Construir el prompt del sistema con alimentaciones
        system_prompt_completo = self._construir_prompt_con_alimentaciones(system_prompt, alimentaciones)

        # 4. Construir la lista de mensajes para OpenAI
        messages = [{"role": "system", "content": system_prompt_completo}]
        for conv in conversaciones:
            messages.append({"role": "user", "content": conv.mensaje_usuario})
            messages.append({"role": "assistant", "content": conv.respuesta_chatbot})
        messages.append({"role": "user", "content": message})

        # 5. Llamar a OpenAI con el historial
        try:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages
            )
            respuesta_chatbot = response.choices[0].message.content
        except Exception as e:
            return Response({"error": f"Error al comunicarse con OpenAI: {str(e)}"}, status=500)

        # 6. Guardar la conversación nueva
        Conversacion.objects.create(
            usuario=user,
            chatbot=category.name,
            mensaje_usuario=message,
            respuesta_chatbot=respuesta_chatbot
        )

        return Response({"response": respuesta_chatbot})
    
    def _obtener_alimentaciones_bot(self, category):
        """
        Obtiene todas las alimentaciones activas para esta categoría de bot
        """
        from .models import BotFeeding
        return BotFeeding.objects.filter(
            categoria=category,
            activa=True
        ).order_by('-fecha_creacion')
    
    def _construir_prompt_con_alimentaciones(self, system_prompt, alimentaciones):
        """
        Construye el prompt del sistema incluyendo las alimentaciones del bot
        """
        if not alimentaciones.exists():
            return system_prompt
        
        prompt_completo = system_prompt + "\n\n"
        prompt_completo += "=== INFORMACIÓN ADICIONAL PROPORCIONADA POR MENTORES ===\n"
        prompt_completo += "Usa la siguiente información como referencia para generar respuestas más precisas y ejemplos reales:\n\n"
        
        for alimentacion in alimentaciones:
            prompt_completo += f"--- {alimentacion.get_tipo_display()} (por {alimentacion.mentor.get_full_name() or alimentacion.mentor.username}) ---\n"
            prompt_completo += f"{alimentacion.contenido}\n\n"
        
        prompt_completo += "=== FIN DE INFORMACIÓN ADICIONAL ===\n\n"
        prompt_completo += "INSTRUCCIONES: Usa esta información de referencia cuando sea relevante para la consulta del usuario. "
        prompt_completo += "Si hay estrategias de ejemplo, úsalas como inspiración para generar roadmaps similares. "
        prompt_completo += "Siempre adapta las respuestas al contexto específico del usuario.\n"
        
        return prompt_completo

def guardar_conversacion(user, category, mensaje, respuesta):
    from .models import Conversacion
    try:
        Conversacion.objects.create(
            usuario=user,
            chatbot=category.name,
            mensaje_usuario=mensaje,
            respuesta_chatbot=respuesta
        )
        print("Conversación guardada correctamente.")
    except Exception as e:
        print("Error al guardar conversación:", e)

def chat_list(request):
    """
    Muestra la lista de todos los chatbots disponibles.
    """
    categories = ChatCategory.objects.all()  # Obtiene todas las categorías de chatbots
    return render(request, 'dashboard_chat.html', {'categories': categories})

def chat_dashboard(request, chatbot_id):
    """
    Renderiza el dashboard del chat con las categorías disponibles.
    """
    category = get_object_or_404(ChatCategory, id=chatbot_id)
    prompt = CATEGORY_PROMPTS.get(category.name, "")
    return render(request, 'dashboard_chat.html', {
        'categories': ChatCategory.objects.all(),
        'category': category,
        'chatbot_id': chatbot_id,
        'prompt': prompt,
    })


class ConversacionesUsuarioAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, chatbot_id):
        from .models import Conversacion
        category = get_object_or_404(ChatCategory, id=chatbot_id)
        conversaciones = Conversacion.objects.filter(
            usuario=request.user,
            chatbot=category.name
        ).order_by('fecha_creacion')
        data = [
            {
                "mensaje_usuario": conv.mensaje_usuario,
                "respuesta_chatbot": conv.respuesta_chatbot,
                "fecha_creacion": conv.fecha_creacion
            }
            for conv in conversaciones
        ]
        return Response(data)


class AlimentarBotAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Alimenta un bot con información adicional:
        - texto_libre: Añade texto libre al conocimiento del bot
        - estrategia_referencia: Usa una estrategia existente como referencia
        """
        try:
            data = request.data
            tipo = data.get('tipo')
            bot_id = data.get('bot_id')
            
            if not tipo or not bot_id:
                return Response({"error": "Faltan parámetros requeridos (tipo, bot_id)"}, status=400)
            
            # Verificar que el bot existe
            try:
                category = ChatCategory.objects.get(id=bot_id)
            except ChatCategory.DoesNotExist:
                return Response({"error": "Bot no encontrado"}, status=404)
            
            # Verificar que el usuario es mentor
            if not hasattr(request.user, 'mentor_profile'):
                return Response({"error": "Solo los mentores pueden alimentar bots"}, status=403)
            
            if tipo == 'texto_libre':
                contenido = data.get('contenido')
                if not contenido:
                    return Response({"error": "El contenido no puede estar vacío"}, status=400)
                
                # Crear entrada de alimentación del bot
                from .models import BotFeeding
                alimentacion = BotFeeding.objects.create(
                    categoria=category,
                    mentor=request.user,
                    tipo='texto_libre',
                    contenido=contenido
                )
                
                return Response({
                    "message": "Bot alimentado exitosamente con texto libre",
                    "id": alimentacion.id
                })
            
            elif tipo == 'estrategia_referencia':
                estrategia_id = data.get('estrategia_id')
                contexto = data.get('contexto', '')
                
                if not estrategia_id:
                    return Response({"error": "ID de estrategia requerido"}, status=400)
                
                # Verificar que la estrategia existe y pertenece al mentor
                from apps.empresas.models import Estrategia
                try:
                    estrategia = Estrategia.objects.get(
                        id=estrategia_id,
                        mentor=request.user
                    )
                except Estrategia.DoesNotExist:
                    return Response({"error": "Estrategia no encontrada o no tienes permisos"}, status=404)
                
                # Preparar el contenido de la estrategia para alimentar al bot
                contenido_estrategia = self._preparar_contenido_estrategia(estrategia, contexto)
                
                # Crear entrada de alimentación del bot
                from .models import BotFeeding
                alimentacion = BotFeeding.objects.create(
                    categoria=category,
                    mentor=request.user,
                    tipo='estrategia_referencia',
                    contenido=contenido_estrategia,
                    estrategia_referencia=estrategia
                )
                
                return Response({
                    "message": f"Bot alimentado exitosamente con la estrategia '{estrategia.titulo}'",
                    "id": alimentacion.id
                })
            
            else:
                return Response({"error": "Tipo de alimentación no válido"}, status=400)
                
        except Exception as e:
            return Response({"error": f"Error interno: {str(e)}"}, status=500)
    
    def _preparar_contenido_estrategia(self, estrategia, contexto=""):
        """
        Prepara el contenido de una estrategia para alimentar al bot
        """
        contenido = f"""
ESTRATEGIA DE REFERENCIA: {estrategia.titulo}

DESCRIPCIÓN: {estrategia.descripcion}

EMPRESA: {estrategia.empresa.nombre if estrategia.empresa else 'No especificada'}

CATEGORÍA: {estrategia.categoria or 'No especificada'}

FECHA DE CUMPLIMIENTO: {estrategia.fecha_cumplimiento or 'No especificada'}

ESTADO: {'Aceptada' if estrategia.estado == 'aceptada' else estrategia.estado}

ETAPAS Y ACTIVIDADES:
"""
        
        # Añadir etapas y actividades
        for etapa in estrategia.etapas.all():
            contenido += f"\n🔹 ETAPA: {etapa.nombre}"
            if etapa.descripcion:
                contenido += f"\n   Descripción: {etapa.descripcion}"
            
            actividades = etapa.actividades.all()
            if actividades:
                contenido += "\n   Actividades:"
                for actividad in actividades:
                    estado = "✅ Completada" if actividad.completada else "⏳ Pendiente"
                    contenido += f"\n   - {actividad.descripcion} ({estado})"
                    if actividad.fecha_limite:
                        contenido += f" - Fecha límite: {actividad.fecha_limite}"
                    if actividad.notas:
                        contenido += f" - Notas: {actividad.notas}"
            contenido += "\n"
        
        # Añadir contexto adicional si se proporcionó
        if contexto:
            contenido += f"\nCONTEXTO ADICIONAL DEL MENTOR:\n{contexto}"
        
        contenido += "\n\nEsta estrategia debe ser usada como referencia para generar roadmaps similares y responder preguntas relacionadas con el tema."
        
        return contenido

