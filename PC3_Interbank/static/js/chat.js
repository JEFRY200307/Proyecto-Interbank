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
    "fecha_cumplimiento": "DD-MM-YYYY",  
    "estado": "pendiente",
    "etapas": [
      {
        "nombre": "Nombre de la etapa",
        "descripcion": "Descripción de la etapa",
        "actividades": [
          {
            "descripcion": "Descripción de la actividad",
            "fecha_limite": "DD-MM-YYYY", 
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

// Se ejecuta cuando todo el contenido del DOM (la página) ha sido cargado.
document.addEventListener('DOMContentLoaded', () => {
  // --- Obtención de Elementos del DOM ---
  const chatLog = document.getElementById('chat-log'); // El contenedor donde se muestran los mensajes.
  const enviarBtn = document.getElementById('enviar-btn'); // El botón para enviar mensajes.
  const userMessageInput = document.getElementById('user-message'); // El campo de texto para escribir mensajes.
  const roadmapBtn = document.getElementById('roadmap-btn'); // El botón para generar un roadmap.
  
  // --- Variables de Estado y Autenticación ---
  const token = localStorage.getItem('access_token'); // Obtiene el token de autenticación del almacenamiento local.
  let esRoadmap = false; // Un flag para saber si el próximo mensaje del bot debe ser tratado como un roadmap.
  let conversationHistory = []; // Un array para almacenar el historial de la conversación actual.

  // --- Verificación de Seguridad ---
  // Si no hay token, el usuario no está autenticado. Se le redirige al login.
  if (!token) {
    alert('Debes iniciar sesión para usar el chat.');
    window.location.href = '/login/';
    return; // Detiene la ejecución del script.
  }

  // --- Funciones para Manipular la Interfaz del Chat ---

  /**
   * Agrega un mensaje del usuario al chat-log.
   * @param {string} mensaje - El texto del mensaje del usuario.
   */
  function agregarMensajeUsuario(mensaje) {
    if (!chatLog) return; // Si no existe el contenedor del chat, no hace nada.
    const messageContainer = document.createElement('div');
    messageContainer.style.textAlign = 'right'; // Alinea los mensajes del usuario a la derecha.
    messageContainer.innerHTML = `<strong>Tú:</strong> ${mensaje}`;
    chatLog.appendChild(messageContainer);
    chatLog.scrollTop = chatLog.scrollHeight; // Hace scroll hacia abajo para ver el último mensaje.
  }

  /**
   * Agrega un mensaje del bot al chat-log, renderizando el formato Markdown.
   * @param {string} texto - El texto del mensaje del bot.
   */
  function agregarMensajeBot(texto) {
    if (!chatLog) return; // Si no existe el contenedor del chat, no hace nada.
    const botName = window.categoriaNombre || 'Banky'; // Usa el nombre de la categoría o "Banky" por defecto.
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('bot-message'); // Añade una clase para estilos CSS.
    // Usa la librería 'marked' para convertir el texto Markdown a HTML.
    messageContainer.innerHTML = `<strong>${botName}:</strong> ${marked.parse(texto)}`;
    chatLog.appendChild(messageContainer);
    chatLog.scrollTop = chatLog.scrollHeight; // Hace scroll hacia abajo.
  }

  // --- Funciones de Comunicación con la API (Backend) ---

  /**
   * Envía un mensaje al backend para obtener una respuesta del chatbot.
   * @param {string} mensaje - El mensaje a enviar.
   * @param {function} callback - La función que se ejecutará con la respuesta del bot.
   */
  function enviarMensajeAlBackend(mensaje, callback) {
    fetch(`/users/dashboard/chat/api/chatbot/${window.chatbotId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token // Incluye el token para la autenticación.
      },
      body: JSON.stringify({ message: mensaje })
    })
      .then(response => response.json())
      .then(data => {
        // Llama al callback con la respuesta del bot.
        callback(data.response || data.respuesta || "");
      })
      .catch(error => {
        agregarMensajeBot("Hubo un error al comunicarse con el chatbot.");
        console.error(error);
      });
  }

  /**
   * Procesa la respuesta JSON del roadmap y la guarda como una nueva estrategia en el backend.
   * @param {string} respuesta - La respuesta completa del bot que contiene el JSON.
   * @param {string} categoriaNombre - El nombre de la categoría para la estrategia.
   */
  function guardarRoadmapComoEstrategia(respuesta, categoriaNombre) {
    try {
      // Intenta encontrar un bloque de código JSON en la respuesta del bot.
      const jsonMatch = respuesta.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No se encontró JSON en la respuesta.");
      
      // Parsea el JSON encontrado.
      const roadmapData = JSON.parse(jsonMatch[0]);
      const estrategiaData = roadmapData.estrategia || roadmapData.roadmap || roadmapData;

      // Valida que el JSON tenga la estructura esperada.
      if (!estrategiaData || !Array.isArray(estrategiaData.etapas)) {
        throw new Error("El JSON recibido no tiene la estructura esperada (debe contener 'etapas').");
      }

      // Extrae los datos principales de la estrategia.
      const titulo = estrategiaData.titulo || `Roadmap para ${categoriaNombre}`;
      const descripcion = estrategiaData.descripcion || "Roadmap generado automáticamente por el chatbot.";
      const fechaCumplimiento = estrategiaData.fecha_cumplimiento || null;

      // Mapea las etapas y actividades al formato que espera la API del backend.
      const etapasPayload = estrategiaData.etapas.map(etapa => ({
        nombre: etapa.nombre || "Etapa sin nombre",
        descripcion: etapa.descripcion || "",
        actividades: (etapa.actividades || []).map(act => ({
          descripcion: typeof act === "string" ? act : (act.descripcion || act.tarea || ""),
          fecha_limite: act.fecha_limite || null,
          completada: act.completada || false
        }))
      }));

      // Envía la nueva estrategia al backend para ser guardada.
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
          fecha_cumplimiento: fechaCumplimiento,
          etapas: etapasPayload
        })
      })
        .then(response => {
          // Si la respuesta no es exitosa, lanza un error con los detalles.
          if (!response.ok) {
            return response.json().then(err => { throw new Error(JSON.stringify(err)) });
          }
          return response.json();
        })
        .then(data => {
          alert('¡Roadmap guardado en Estrategias!');
        })
        .catch(error => {
          alert('Error al guardar el roadmap: ' + error.message);
          console.error('Error al guardar el roadmap:', error);
        });

    } catch (e) {
      // Captura cualquier error durante el procesamiento del JSON.
      alert("No se pudo procesar el roadmap como JSON. Por favor, revisa el formato. Error: " + e.message);
      console.error(e);
    }
  }

  // --- Carga Inicial del Chat ---
  // Si se ha seleccionado un chatbot, carga su historial de conversaciones.
  if (window.chatbotId && chatLog) {
    fetch(`/users/dashboard/chat/api/conversaciones/${window.chatbotId}/`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(response => response.json())
      .then(data => {
        chatLog.innerHTML = ''; // Limpia la vista del chat.
        conversationHistory = []; // Limpia el array de historial en memoria.
        // Itera sobre las conversaciones guardadas.
        data.forEach(conversacion => {
          // Agrega los mensajes a la vista y al historial en memoria.
          if (conversacion.mensaje_usuario) {
            agregarMensajeUsuario(conversacion.mensaje_usuario);
            conversationHistory.push({ role: 'user', content: conversacion.mensaje_usuario });
          }
          if (conversacion.respuesta_chatbot) {
            agregarMensajeBot(conversacion.respuesta_chatbot);
            conversationHistory.push({ role: 'assistant', content: conversacion.respuesta_chatbot });
          }
        });
      });
  }

  // --- Event Listeners (Manejadores de Eventos) ---

  // Manejador para el clic en el botón de enviar.
  if (enviarBtn) {
    enviarBtn.addEventListener('click', () => {
      const mensaje = userMessageInput.value.trim(); // Obtiene y limpia el mensaje del input.
      if (!mensaje) return; // Si no hay mensaje, no hace nada.

      agregarMensajeUsuario(mensaje); // Muestra el mensaje del usuario en el chat.
      conversationHistory.push({ role: 'user', content: mensaje }); // Añade el mensaje al historial.
      userMessageInput.value = ''; // Limpia el campo de texto.

      // Envía el mensaje al backend.
      enviarMensajeAlBackend(mensaje, function (respuesta) {
        agregarMensajeBot(respuesta); // Muestra la respuesta del bot.
        conversationHistory.push({ role: 'assistant', content: respuesta }); // Añade la respuesta al historial.
        
        // Si se estaba esperando un roadmap, lo guarda.
        if (esRoadmap) {
          guardarRoadmapComoEstrategia(respuesta, window.categoriaNombre);
          esRoadmap = false; // Resetea el flag.
        }
      });
    });
  }

  // Manejador para enviar mensaje con la tecla "Enter".
  if (userMessageInput) {
      userMessageInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
              enviarBtn.click(); // Simula un clic en el botón de enviar.
          }
      });
  }

  // Manejador para el clic en el botón de generar roadmap.
  if (roadmapBtn) {
    roadmapBtn.addEventListener('click', function () {
      esRoadmap = true; // Activa el flag para procesar la respuesta como un roadmap.
      const mensajeCorto = `Hazme el roadmap para la categoría "${window.categoriaNombre}"`;

      // Formatea el historial de la conversación para incluirlo en el prompt.
      const historialFormateado = conversationHistory.map(msg => {
        return `${msg.role === 'user' ? 'Usuario' : 'Banky'}: ${msg.content}`;
      }).join('\n\n');

      // Crea el prompt largo y detallado para el chatbot.
      const mensajeLargo = `Basándote en la siguiente conversación, genera un roadmap para una pyme peruana en la categoría "${window.categoriaNombre}".

### Historial de la Conversación:
${historialFormateado}

### Instrucción Final:
Por favor, genera el roadmap siguiendo la estructura JSON de Estrategia, Etapa y Actividad. El JSON debe tener este formato:

{
  "estrategia": {
    "titulo": "Título de la estrategia",
    "descripcion": "Descripción general",
    "fecha_cumplimiento": "YYYY-MM-DD",
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
}

No limites la cantidad de etapas ni de actividades; incluye todas las que consideres necesarias para un roadmap completo.`;

      // Muestra el mensaje corto en la interfaz para que el usuario vea su acción.
      agregarMensajeUsuario(mensajeCorto);

      // Envía el prompt largo al backend.
      enviarMensajeAlBackend(mensajeLargo, function (respuesta) {
        // Muestra un mensaje de confirmación y guarda el roadmap.
        agregarMensajeBot("Revisa el apartado estrategias para ver el roadmap generado.");
        guardarRoadmapComoEstrategia(respuesta, window.categoriaNombre);
      });
    });
  }
});

