from django.urls import path
from .views import chat_dashboard, chat_list, ChatBotAPIView, ConversacionesUsuarioAPIView

urlpatterns = [
    path('dashboard/chat/', chat_list, name='chat_list'),  # Ruta para mostrar todos los chatbots
    path('dashboard/chat/<int:chatbot_id>/', chat_dashboard, name='chat_dashboard'),  # Ruta para un chatbot específico
    path('dashboard/chat/api/chatbot/<int:category_id>/', ChatBotAPIView.as_view(), name='chatbot_api'),  # Ruta para la API de ChatBot por categoría
    path('dashboard/chat/api/conversaciones/<int:chatbot_id>/', ConversacionesUsuarioAPIView.as_view(), name='conversaciones_usuario_api'),
]