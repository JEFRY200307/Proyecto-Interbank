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

  // Prompt para generar JSON acorde a los modelos Django Estrategia, Etapa y Actividad
  const estructuraBase = `Debe devolverse un objeto JSON con la siguiente estructura:

{
  "estrategia": {
    "titulo": "Título de la estrategia",
    "descripcion": "Descripción breve",
    "categoria": "${categoriaNombre}",
    "fecha_cumplimiento": "YYYY-MM-DD",  
    "estado": "pendiente",
    "etapas": [
      {
        "nombre": "Nombre de la etapa",
        "descripcion": "Descripción de la etapa",
        "actividades": [
          {
            "descripcion": "Descripción de la actividad",
            "fecha_limite": "YYYY-MM-DD", 
            "completada": false
          }
        ]
      }
    ]
  }
}`;

  // Generar prompt según categoría sin nombres de etapas fijos
  mensaje = `Por favor, genera un roadmap para una pyme peruana en la categoría "${categoriaNombre}" siguiendo la estructura JSON de Estrategia, Etapa y Actividad:

${estructuraBase}

Usa nombres de etapas relevantes según el contexto y mensajes previos. No agregues texto adicional, solo devuelve el JSON.`;

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
  const chatLog = document.getElementById('chat-log');
  const enviarBtn = document.getElementById('enviar-btn');
  const userMessageInput = document.getElementById('user-message');
  const roadmapBtn = document.getElementById('roadmap-btn');
  const token = localStorage.getItem('access_token');
  let esRoadmap = false;

  if (!token) {
    alert('Debes iniciar sesión para usar el chat.');
    window.location.href = '/login/';
    return;
  }

  // Cargar historial de conversaciones reales desde el backend
  if (window.chatbotId) {
    fetch(`/users/dashboard/chat/api/conversaciones/${window.chatbotId}/`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
      .then(response => response.json())
      .then(data => {
        chatLog.innerHTML = '';
        data.forEach(conversacion => {
          chatLog.innerHTML += `
          <div><strong>Tú:</strong> ${conversacion.mensaje_usuario}</div>
          <div><strong>Bot:</strong> ${conversacion.respuesta_chatbot}</div>
        `;
        });
        chatLog.scrollTop = chatLog.scrollHeight;
      });
  }

  function agregarMensajeUsuario(mensaje) {
    chatLog.innerHTML += `<div style="text-align:right;"><strong>Tú:</strong> ${mensaje}</div>`;
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function agregarMensajeBot(mensaje) {
    chatLog.innerHTML += `<div style="text-align:left;"><strong>Bot:</strong> ${mensaje}</div>`;
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function enviarMensajeAlBackend(mensaje, callback) {
    fetch(`/users/dashboard/chat/api/chatbot/${window.chatbotId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ message: mensaje })
    })
      .then(response => response.json())
      .then(data => {
        callback(data.response || data.respuesta || "");
      })
      .catch(error => {
        agregarMensajeBot("Hubo un error al comunicarse con el chatbot.");
        console.error(error);
      });
  }

  function guardarRoadmapComoEstrategia(respuesta, categoriaNombre) {
    let titulo = `Roadmap para ${categoriaNombre}`;
    let descripcion = "Roadmap generado automáticamente por el chatbot.";

    try {
      // Extrae el bloque JSON del texto
      const jsonMatch = respuesta.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No se encontró JSON en la respuesta.");
      const roadmapObj = JSON.parse(jsonMatch[0]);
      // Encuentra la clave que contiene las etapas
      let etapas = [];
      for (const key in roadmapObj) {
        if (roadmapObj[key] && Array.isArray(roadmapObj[key].etapas)) {
          etapas = roadmapObj[key].etapas;
          break;
        }
      }
      if (etapas.length === 0) {
        etapas = roadmapObj.roadmap?.etapas || roadmapObj.etapas || [];
      }
      // Armar el array de etapas con actividades anidadas
      const etapasPayload = etapas.map(etapa => ({
        nombre: etapa.nombre || "Etapa sin nombre",
        descripcion: etapa.descripcion || "",
        actividades: (etapa.actividades || []).map(act => ({
          descripcion: typeof act === "string" ? act : (act.descripcion || act.tarea || ""),
          fecha_limite: null,
          completada: false
        }))
      }));

      fetch('/empresas/api/estrategias/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          titulo: titulo,
          descripcion: descripcion,
          categoria: categoriaNombre,
          etapas: etapasPayload
        })
      })
        .then(response => response.json())
        .then(data => {
          alert('¡Roadmap guardado en Estrategias!');
        })
        .catch(error => {
          alert('Error al guardar el roadmap: ' + error.message);
          console.error('Error al guardar el roadmap:', error);
        });

    } catch (e) {
      alert("No se pudo procesar el roadmap como JSON. Por favor, revisa el formato.");
      console.error(e);
    }
  }

  // Enviar mensaje normal
  if (enviarBtn) {
    enviarBtn.addEventListener('click', () => {
      const mensaje = userMessageInput.value.trim();
      if (!mensaje) return;

      agregarMensajeUsuario(mensaje);
      userMessageInput.value = '';

      enviarMensajeAlBackend(mensaje, function (respuesta) {
        agregarMensajeBot(respuesta);
        if (esRoadmap) {
          guardarRoadmapComoEstrategia(respuesta, window.categoriaNombre);
          esRoadmap = false;
        }
      });
    });
  }

  // Botón roadmap
  if (roadmapBtn) {
    roadmapBtn.addEventListener('click', function () {
      esRoadmap = true;
      const mensajeCorto = `Hazme el roadmap para la categoría "${window.categoriaNombre}"`;
      const mensajeLargo = `Por favor, genera un roadmap para una pyme peruana en la categoría "${window.categoriaNombre}" siguiendo la estructura JSON de Estrategia, Etapa y Actividad.
El JSON debe tener este formato:

{
  "estrategia": {
    "titulo": "Título de la estrategia",
    "descripcion": "Descripción general",
    "etapas": [
      {
        "nombre": "Nombre de la etapa",
        "descripcion": "Descripción de la etapa",
        "actividades": [
          {
            "descripcion": "Descripción de la actividad",
            "fecha_limite": null,
            "completada": false
          }
        ]
      }
    ]
  }
}

No limites la cantidad de etapas ni de actividades; incluye todas las que consideres necesarias para un roadmap completo.`;

      agregarMensajeUsuario(mensajeCorto);

      enviarMensajeAlBackend(mensajeLargo, function (respuesta) {
        agregarMensajeBot("Revisa el apartado estrategias para ver el roadmap generado.");
        guardarRoadmapComoEstrategia(respuesta, window.categoriaNombre);
      });
    });
  }
});

