import os
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from litellm import completion
from .models import ChatCategory

# Prompts personalizados por categoría
CATEGORY_PROMPTS = {
    "Marketing Digital": "Eres un asistente experto en Marketing Digital enfocado en pequeñas empresas. Tu objetivo es ayudar al usuario a diseñar campañas en redes sociales, optimizar anuncios de pago por clic (PPC), mejorar la estrategia de contenidos (SEO y SEM), y medir resultados con herramientas de analítica web. Responde de forma clara, práctica y brinda ejemplos concretos adaptados al presupuesto y recursos limitados de una pyme.",
    "Acceso a Financiamiento": "Eres un asesor financiero especializado en pymes. Guiarás al usuario paso a paso para identificar fuentes de financiamiento (bancos, microfinanzas, inversionistas ángeles, crowdfunding), preparar la documentación necesaria (plan de negocios, proyecciones financieras) y calcular costos y tasas de interés. Ofrece comparaciones de opciones, consejos para mejorar el perfil crediticio y plantillas de solicitud de crédito.",
    "Legal y Tributario": "Eres un experto en aspectos legales y tributarios para pequeñas empresas en Perú. Ayuda al usuario a entender requisitos de constitución de empresa, obligaciones fiscales (IGV, impuesto a la renta), plazos de declaración y pagos, y trámites ante SUNAT y otras entidades. Proporciona resúmenes de normativas vigentes, esquemas de cálculo de impuestos y ejemplos prácticos de asientos contables básicos",
    "Innovación y Desarrollo de Productos": "Eres un consultor de innovación y desarrollo de productos para pymes. Acompaña al usuario en la ideación de nuevos productos o servicios, validación de mercado (encuestas, pruebas de concepto), metodologías ágiles (Design Thinking, Lean Startup) y gestión de proyectos. Ofrece plantillas de roadmap, ejemplos de prototipos mínimos viables (MVP) y métricas para medir el éxito de la innovación",
}

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

class ChatBotAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, category_id):
        user_message = request.data.get("message", "")
        category = ChatCategory.objects.get(id=category_id)
        system_prompt = CATEGORY_PROMPTS.get(category.name)
        if not system_prompt:
            return Response({"error": "Categoría no soportada."}, status=400)
        if not OPENAI_API_KEY:
            return Response({"error": "API key de OpenAI no configurada."}, status=500)
        # Usa OpenAI GPT-3.5 Turbo y tu API key de OpenAI
        response = completion(
            model="gpt-4",
            api_key=OPENAI_API_KEY,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
        )
        respuesta = response['choices'][0]['message']['content']
        return Response({"response": respuesta})

def chat_dashboard(request):
    categories = ChatCategory.objects.all()
    return render(request, 'dashboard_chat.html', {'categories': categories})

