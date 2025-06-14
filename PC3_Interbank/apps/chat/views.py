from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .utils import obtener_recomendacion_empresa

class ChatEmpresaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        prompt = request.data.get("mensaje")
        contexto_empresa = request.user.empresa.obtener_contexto()  # Debes definir este método según tus modelos
        respuesta = obtener_recomendacion_empresa(prompt, contexto_empresa)
        return Response({"respuesta": respuesta})