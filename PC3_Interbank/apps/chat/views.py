import os
from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ChatCategory, ChatMessage
from django.utils import timezone
import openai

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
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY


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

        # Verificar la API key de OpenAI
        if not OPENAI_API_KEY:
            return Response({"error": "API key de OpenAI no configurada."}, status=500)

        # Llamar a la API de OpenAI
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
        )
        respuesta_chatbot = response.choices[0].message.content

        # Guardar la conversación en la base de datos
        guardar_conversacion(
            user=request.user,
            category=category,
            mensaje=message,
            respuesta=respuesta_chatbot
        )

        return Response({"response": respuesta_chatbot})

def guardar_conversacion(user, category, mensaje, respuesta):
    from .models import Conversacion
    Conversacion.objects.create(
        usuario=user,
        chatbot=category.name,
        mensaje_usuario=mensaje,
        respuesta_chatbot=respuesta
    )


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

