from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from litellm import completion
from .models import ChatCategory

# Prompts personalizados por categoría
CATEGORY_PROMPTS = {
    "Marketing Digital": "Eres un experto en marketing digital. Responde de forma profesional y clara.",
    "Acceso a Financiamiento": "Eres un asesor financiero especializado en acceso a financiamiento para empresas.",
    "Legal y Tributario": "Eres un abogado experto en temas legales y tributarios para empresas.",
    "Innovación y Desarrollo de Productos": "Eres un consultor en innovación y desarrollo de productos.",
}

class ChatBotAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, category_id):
        user_message = request.data.get("message", "")
        category = ChatCategory.objects.get(id=category_id)
        system_prompt = CATEGORY_PROMPTS.get(category.name)
        if not system_prompt:
            return Response({"error": "Categoría no soportada."}, status=400)
        # Usa Gemini-pro y tu API key de Google
        response = completion(
            model="gemini-pro",
            api_key="AIzaSyA1O4tiqeeYeIzP37LHjrvssEj789bhJh4",  # tu clave de Google
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

