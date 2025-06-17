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
    "Marketing Digital": "Eres un asistente experto en Marketing Digital enfocado en pequeñas empresas. Tu objetivo es ayudar al usuario a diseñar campañas en redes sociales, optimizar anuncios de pago por clic (PPC), mejorar la estrategia de contenidos (SEO y SEM), y medir resultados con herramientas de analítica web. Responde de forma clara, práctica y brinda ejemplos concretos adaptados al presupuesto y recursos limitados de una pyme.",
    "Acceso a Financiamiento": "Eres un asesor financiero especializado en pymes. Guiarás al usuario paso a paso para identificar fuentes de financiamiento (bancos, microfinanzas, inversionistas ángeles, crowdfunding), preparar la documentación necesaria (plan de negocios, proyecciones financieras) y calcular costos y tasas de interés. Ofrece comparaciones de opciones, consejos para mejorar el perfil crediticio y plantillas de solicitud de crédito.",
    "Legal y Tributario": "Eres un experto en aspectos legales y tributarios para pequeñas empresas en Perú. Ayuda al usuario a entender requisitos de constitución de empresa, obligaciones fiscales (IGV, impuesto a la renta), plazos de declaración y pagos, y trámites ante SUNAT y otras entidades. Proporciona resúmenes de normativas vigentes, esquemas de cálculo de impuestos y ejemplos prácticos de asientos contables básicos",
    "Innovación y Desarrollo de Productos": "Eres un consultor de innovación y desarrollo de productos para pymes. Acompaña al usuario en la ideación de nuevos productos o servicios, validación de mercado (encuestas, pruebas de concepto), metodologías ágiles (Design Thinking, Lean Startup) y gestión de proyectos. Ofrece plantillas de roadmap, ejemplos de prototipos mínimos viables (MVP) y métricas para medir el éxito de la innovación",
}

# Configuración de la API de OpenAI
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY


class ChatBotAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, category_id):
        try:
            # Obtener el mensaje del usuario
            user_message = request.data.get("message", "")
            if not user_message:
                return Response({"error": "El mensaje no puede estar vacío."}, status=400)

            # Obtener la categoría del chatbot
            category = ChatCategory.objects.get(id=category_id)
            system_prompt = CATEGORY_PROMPTS.get(category.name)
            if not system_prompt:
                return Response({"error": "Categoría no soportada."}, status=400)

            # Verificar la API key de OpenAI
            if not OPENAI_API_KEY:
                return Response({"error": "API key de OpenAI no configurada."}, status=500)

            # Llamar a la API de OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            )
            respuesta_chatbot = response['choices'][0]['message']['content']

            # Guardar la conversación en la base de datos
            guardar_conversacion(
                user=request.user,
                category=category,
                mensaje=user_message,
                respuesta=respuesta_chatbot
            )

            return Response({"response": respuesta_chatbot})

        except ChatCategory.DoesNotExist:
            return Response({"error": "Categoría no encontrada."}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


def guardar_conversacion(user, category, mensaje, respuesta):
    """
    Guarda el mensaje del usuario y la respuesta del chatbot en la base de datos.
    """
    ChatMessage.objects.create(
        user=user,
        category=category,
        message=mensaje,
        timestamp=timezone.now()
    )
    ChatMessage.objects.create(
        user=user,
        category=category,
        message=respuesta,
        timestamp=timezone.now()
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
        try:
            conversaciones = ChatMessage.objects.filter(
                user=request.user,
                category_id=chatbot_id
            ).order_by('-timestamp')

            data = [
                {
                    "mensaje_usuario": conv.message,
                    "respuesta_chatbot": conv.message,  # Ajusta según tu modelo
                    "fecha_creacion": conv.timestamp
                }
                for conv in conversaciones
            ]
            return Response(data)

        except ChatCategory.DoesNotExist:
            return Response({"error": "Categoría no encontrada."}, status=404)

