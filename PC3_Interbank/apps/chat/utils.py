from google.adk.agents import Agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner

agent = Agent(
    name="agente_empresa",
    model="gemini-1.5-pro",
    instruction="Eres un asesor que da recomendaciones prácticas y accionables para una mype peruana.",
    description="Agente para recomendaciones de empresa mype en Perú"
)

session_service = InMemorySessionService()
runner = Runner(
    agent=agent,
    app_name="proyecto_pc3",
    session_service=session_service
)

def obtener_recomendacion_empresa(prompt, contexto_empresa, user_id="usuario_1"):
    mensaje = f"Contexto de la empresa: {contexto_empresa}\nConsulta: {prompt}"
    eventos = runner.run(user_id=user_id, session_id="sesion_1", message=mensaje)

    for evento in eventos:
        if evento.is_final_response():
            return evento.content.parts[0].text
