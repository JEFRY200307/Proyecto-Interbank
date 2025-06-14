from django.urls import path
from .views import chat_dashboard, ChatBotAPIView

urlpatterns = [
    path('', chat_dashboard, name='chat_dashboard'),
    path('api/chatbot/<int:category_id>/', ChatBotAPIView.as_view(), name='chatbot_api'),
]