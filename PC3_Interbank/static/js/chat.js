let categoriaSeleccionada = null;
let categoriaNombre = "";

function seleccionarCategoria(id, nombre) {
  categoriaSeleccionada = id;
  categoriaNombre = nombre;

  // Marcar la tarjeta seleccionada
  document.querySelectorAll('.chatbot-card').forEach(card => {
    card.classList.remove('selected');
  });
  const selectedCard = document.querySelector(`.chatbot-card[onclick*="${id}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

  // Oculta las tarjetas y muestra el chat
  document.getElementById('chatbots-container').style.display = 'none';
  document.getElementById('chat-section').style.display = 'block';

  // Habilita roadmap y mostrar volver
  document.getElementById('roadmap-btn').style.display = "inline-block";
  document.getElementById('volver-btn').style.display = 'inline-block';

  document.getElementById('chat-category-title').textContent = "Chatbot: " + nombre;
  // Cargar historial si existe
  const log = document.getElementById('chat-log');
  const historial = localStorage.getItem('chat_historial_' + id);
  log.innerHTML = historial ? historial : "";
}

function enviarMensaje() {
  const mensaje = document.getElementById('user-message').value;
  if (!mensaje || !categoriaSeleccionada) return;
  const token = localStorage.getItem('access_token');
  const log = document.getElementById('chat-log');
  
  // Mostrar mensaje del usuario
  log.innerHTML += `<div><strong>Tú:</strong> ${mensaje}</div>`;
  document.getElementById('user-message').value = '';

  // Guardar historial después de cada mensaje
  localStorage.setItem('chat_historial_' + categoriaSeleccionada, log.innerHTML);

  fetch(`/users/dashboard/chat/api/chatbot/${categoriaSeleccionada}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ message: mensaje })
  })
  .then(response => response.json())
  .then(data => {
    // Renderiza la respuesta del bot como Markdown
    const log = document.getElementById('chat-log');
    if (data.response) {
      log.innerHTML += `<div><strong>${categoriaNombre} Bot:</strong> <div class="bot-markdown">${marked.parse(data.response)}</div></div>`;
    } else if (data.error) {
      log.innerHTML += `<div style="color:red;"><strong>Error:</strong> ${data.error}</div>`;
    } else {
      log.innerHTML += `<div style="color:red;"><strong>Error:</strong> No se recibió respuesta del chatbot.</div>`;
    }
    localStorage.setItem('chat_historial_' + categoriaSeleccionada, log.innerHTML);
  })
  .catch(error => console.error("Error en el chatbot:", error));
}

function enviarMensajeRoadmap() {
  if (!categoriaSeleccionada) return;

  let mensaje = "";

  // Generar el prompt según el chatbot seleccionado
  switch (categoriaNombre) {
    case "Acceso a Financiamiento":
      mensaje = `
        Por favor, genera un roadmap estructurado en formato JSON para el acceso a financiamiento. Incluye las siguientes etapas:
        1. Identificar las fuentes de financiamiento.
        2. Preparar la documentación necesaria.
        3. Calcular costos y tasas de interés.
        4. Mejorar el perfil crediticio.
        Cada etapa debe incluir:
        - Una descripción breve.
        - Actividades específicas con fechas límite (puedes usar fechas ficticias).
        - Estado inicial de "pendiente".
        El formato debe ser JSON para facilitar su procesamiento.
      `;
      break;

    case "Marketing Digital":
      mensaje = `
        Por favor, genera un roadmap estructurado en formato JSON para una campaña de marketing digital. Incluye las siguientes etapas:
        1. Definir objetivos de la campaña.
        2. Identificar el público objetivo.
        3. Crear contenido para redes sociales.
        4. Configurar anuncios PPC y SEO.
        Cada etapa debe incluir:
        - Una descripción breve.
        - Actividades específicas con fechas límite (puedes usar fechas ficticias).
        - Estado inicial de "pendiente".
        El formato debe ser JSON para facilitar su procesamiento.
      `;
      break;

    case "Legal y Tributario":
      mensaje = `
        Por favor, genera un roadmap estructurado en formato JSON para cumplir con las obligaciones legales y tributarias de una empresa en Perú. Incluye las siguientes etapas:
        1. Constitución de la empresa.
        2. Registro en SUNAT.
        3. Declaración de impuestos.
        4. Cumplimiento de obligaciones laborales.
        Cada etapa debe incluir:
        - Una descripción breve.
        - Actividades específicas con fechas límite (puedes usar fechas ficticias).
        - Estado inicial de "pendiente".
        El formato debe ser JSON para facilitar su procesamiento.
      `;
      break;

    case "Innovación y Desarrollo de Productos":
      mensaje = `
        Por favor, genera un roadmap estructurado en formato JSON para el desarrollo de un nuevo producto. Incluye las siguientes etapas:
        1. Ideación y validación de concepto.
        2. Desarrollo del prototipo.
        3. Pruebas de mercado.
        4. Lanzamiento del producto.
        Cada etapa debe incluir:
        - Una descripción breve.
        - Actividades específicas con fechas límite (puedes usar fechas ficticias).
        - Estado inicial de "pendiente".
        El formato debe ser JSON para facilitar su procesamiento.
      `;
      break;

    default:
      mensaje = "Por favor, genera un roadmap estructurado para esta categoría.";
      break;
  }

  // Enviar el mensaje al chatbot
  document.getElementById('user-message').value = mensaje;
  enviarMensaje();
}

function volverATarjetas() {
  document.getElementById('chat-section').style.display = 'none';
  document.getElementById('chatbots-container').style.display = 'flex';
  document.getElementById('roadmap-btn').style.display = 'none';
  document.getElementById('volver-btn').style.display = 'none';
}

function guardarRoadmap(titulo, descripcion, actividades) {
  const token = localStorage.getItem('access_token');
  fetch('/empresas/api/estrategias/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      titulo: titulo,
      descripcion: descripcion,
      actividades: actividades
    })
  })
  .then(response => response.json())
  .then(data => {
    alert('¡Roadmap guardado en Estrategias!');
  })
  .catch(error => {
    console.error('Error al guardar el roadmap:', error);
  });
}

// Procesar la respuesta del chatbot
function procesarRespuestaChatbot(data) {
  try {
    // Parsear la respuesta como JSON
    const respuesta = JSON.parse(data.response);

    // Extraer el título y descripción del roadmap
    const titulo = "Roadmap para Acceso a Financiamiento";
    const descripcion = "Pasos esenciales para obtener financiamiento para tu empresa.";

    // Extraer las actividades de todas las etapas
    const actividades = [];
    respuesta.RoadmapFinanciamiento.Etapas.forEach(etapa => {
      etapa.Actividades.forEach(actividad => {
        actividades.push({
          descripcion: actividad.Actividad,
          fecha_limite: actividad.FechaLimite,
          estado: actividad.Estado.toLowerCase() // Convertir a minúsculas para coincidir con el modelo
        });
      });
    });

    // Guardar el roadmap en el backend
    guardarRoadmap(titulo, descripcion, actividades);
  } catch (error) {
    console.error("Error al procesar la respuesta del chatbot:", error);
    alert("La respuesta del chatbot no está en el formato esperado.");
  }
}

function extraerActividades(texto) {
  // Aquí puedes implementar lógica para extraer actividades del texto generado
  // Por ejemplo, buscar pasos enumerados o palabras clave como "Paso 1", "Paso 2", etc.
  const actividades = [];
  const regex = /Paso (\d+): (.+)/g;
  let match;
  while ((match = regex.exec(texto)) !== null) {
    actividades.push({
      descripcion: match[2],
      fecha_limite: null, // Puedes agregar lógica para calcular fechas
      estado: "pendiente",
    });
  }
  return actividades;
}

function cargarConversaciones(chatbotId) {
  if (!chatbotId) {
    console.error("Error: chatbotId es null o undefined.");
    return;
  }

  const token = localStorage.getItem('access_token');
  fetch(`/users/dashboard/chat/api/conversaciones/${chatbotId}/`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const chatLog = document.getElementById('chat-log');
      chatLog.innerHTML = ''; // Limpia el historial del chat
      data.forEach(conversacion => {
        chatLog.innerHTML += `
          <div><strong>Tú:</strong> ${conversacion.mensaje_usuario}</div>
          <div><strong>Chatbot:</strong> ${conversacion.respuesta_chatbot}</div>
        `;
      });
    })
    .catch(error => {
      console.error('Error al cargar conversaciones:', error);
    });
}

// Llamar a cargar conversaciones al iniciar el chat
document.addEventListener('DOMContentLoaded', () => {
  if (!chatbotId) return; // Solo ejecuta si hay un chatbot seleccionado

  const enviarBtn = document.getElementById('enviar-btn');
  const userMessageInput = document.getElementById('user-message');
  const chatLog = document.getElementById('chat-log');

  enviarBtn.addEventListener('click', () => {
    const mensaje = userMessageInput.value.trim();
    if (!mensaje) return;

    chatLog.innerHTML += `<div><strong>Tú:</strong> ${mensaje}</div>`;
    userMessageInput.value = '';

    fetch(`/users/dashboard/chat/api/chatbot/${chatbotId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Si usas autenticación, agrega aquí el header Authorization
      },
      body: JSON.stringify({ message: mensaje })
    })
    .then(response => response.json())
    .then(data => {
      if (data.response) {
        chatLog.innerHTML += `<div><strong>${categoriaNombre} Bot:</strong> ${data.response}</div>`;
      } else if (data.error) {
        chatLog.innerHTML += `<div style="color:red;"><strong>Error:</strong> ${data.error}</div>`;
      }
      chatLog.scrollTop = chatLog.scrollHeight;
    });
  });
});

