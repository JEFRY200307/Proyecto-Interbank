from django.urls import path
from .views import ChatEmpresaAPIView

urlpatterns = [
    path('api/chat/', ChatEmpresaAPIView.as_view(), name='chat_empresa_api'),
]