// ==========================================
// VARIABLES GLOBALES DEL CHAT
// ==========================================
let categoriaSeleccionada = null; // ID de la categoría de chatbot seleccionada
let categoriaNombre = ""; // Nombre de la categoría seleccionada

/**
 * FUNCIÓN PRINCIPAL: Selecciona una categoría de chatbot y prepara la interfaz
 * Se ejecuta cuando el usuario hace clic en una tarjeta de chatbot
 * @param {number} id - ID de la categoría del chatbot
 * @param {string} nombre - Nombre de la categoría del chatbot
 */
function seleccionarCategoria(id, nombre) {
  // Guardar la selección del usuario
  categoriaSeleccionada = id;
  categoriaNombre = nombre;

  // === ACTUALIZAR INTERFAZ VISUAL ===
  // Quitar selección visual de todas las tarjetas
  document.querySelectorAll('.chatbot-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Marcar visualmente la tarjeta seleccionada
  const selectedCard = document.querySelector(`.chatbot-card[onclick*="${id}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

  // === CAMBIAR VISTA: DE TARJETAS A CHAT ===
  document.getElementById('chatbots-container').style.display = 'none'; // Ocultar tarjetas
  document.getElementById('chat-section').style.display = 'block'; // Mostrar chat

  // === HABILITAR BOTONES DE ACCIÓN ===
  document.getElementById('roadmap-btn').style.display = "inline-block"; // Botón generar roadmap
  document.getElementById('volver-btn').style.display = 'inline-block'; // Botón volver

  // === CONFIGURAR TÍTULO Y CARGAR HISTORIAL ===
  document.getElementById('chat-category-title').textContent = "Chatbot: " + nombre;
  
  // Recuperar historial previo del localStorage (si existe)
  const log = document.getElementById('chat-log');
  const historial = localStorage.getItem('chat_historial_' + id);
  log.innerHTML = historial ? historial : ""; // Cargar historial o dejar vacío
}

/**
 * FUNCIÓN BÁSICA: Envía un mensaje del usuario al chatbot
 * Se ejecuta cuando el usuario escribe y envía un mensaje normal
 * NO SE USA PARA ROADMAPS - solo para conversación regular
 */
function enviarMensaje() {
  // === VALIDACIONES INICIALES ===
  const mensaje = document.getElementById('user-message').value;
  if (!mensaje || !categoriaSeleccionada) return; // No enviar si está vacío o no hay categoría
  
  const token = localStorage.getItem('access_token'); // Token JWT para autenticación
  const log = document.getElementById('chat-log');

  // === MOSTRAR MENSAJE DEL USUARIO EN LA INTERFAZ ===
  log.innerHTML += `<div><strong>Tú:</strong> ${mensaje}</div>`;
  document.getElementById('user-message').value = ''; // Limpiar input

  // === GUARDAR EN HISTORIAL LOCAL ===
  localStorage.setItem('chat_historial_' + categoriaSeleccionada, log.innerHTML);

  // === ENVIAR AL BACKEND Y PROCESAR RESPUESTA ===
  fetch(`/users/dashboard/chat/api/chatbot/${categoriaSeleccionada}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token // Autenticación JWT
    },
    body: JSON.stringify({ message: mensaje })
  })
    .then(response => response.json())
    .then(data => {
      // === MOSTRAR RESPUESTA DEL BOT ===
      const log = document.getElementById('chat-log');
      if (data.response) {
        // Renderizar respuesta como Markdown usando la librería 'marked'
        log.innerHTML += `<div><strong>${categoriaNombre} Bot:</strong> <div class="bot-markdown">${marked.parse(data.response)}</div></div>`;
      } else if (data.error) {
        // Mostrar error si hay problema
        log.innerHTML += `<div style="color:red;"><strong>Error:</strong> ${data.error}</div>`;
      } else {
        // Error genérico si no hay respuesta
        log.innerHTML += `<div style="color:red;"><strong>Error:</strong> No se recibió respuesta del chatbot.</div>`;
      }
      // Actualizar historial local
      localStorage.setItem('chat_historial_' + categoriaSeleccionada, log.innerHTML);
    })
    .catch(error => console.error("Error en el chatbot:", error));
}

/**
 * FUNCIÓN NAVEGACIÓN: Volver a la vista de tarjetas de chatbots
 * Se ejecuta cuando el usuario hace clic en "Volver"
 */
function volverATarjetas() {
  // === CAMBIAR VISTA: DE CHAT A TARJETAS ===
  document.getElementById('chat-section').style.display = 'none'; // Ocultar chat
  document.getElementById('chatbots-container').style.display = 'flex'; // Mostrar tarjetas
  
  // === OCULTAR BOTONES DE ACCIÓN ===
  document.getElementById('roadmap-btn').style.display = 'none'; // Ocultar botón roadmap
  document.getElementById('volver-btn').style.display = 'none'; // Ocultar botón volver
}

// ==========================================
// 🚀 SISTEMA PRINCIPAL - FUNCIONAL
// ==========================================
// Se ejecuta cuando el DOM está completamente cargado

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // === OBTENCIÓN DE ELEMENTOS DEL DOM ===
  // ==========================================
  const chatLog = document.getElementById('chat-log'); // Contenedor donde se muestran los mensajes
  const enviarBtn = document.getElementById('enviar-btn'); // Botón para enviar mensajes normales
  const userMessageInput = document.getElementById('user-message'); // Campo de texto para escribir
  const roadmapBtn = document.getElementById('roadmap-btn'); // Botón para generar roadmap (SISTEMA ACTUAL)
  
  // ==========================================
  // === VARIABLES DE ESTADO Y AUTENTICACIÓN ===
  // ==========================================
  const token = localStorage.getItem('access_token'); // Token JWT del almacenamiento local
  let esRoadmap = false; // Flag para saber si la próxima respuesta es un roadmap
  let conversationHistory = []; // Array para almacenar historial de la conversación actual

  // ==========================================
  // === VERIFICACIÓN DE SEGURIDAD ===
  // ==========================================
  // Si no hay token, el usuario no está autenticado
  if (!token) {
    alert('Debes iniciar sesión para usar el chat.');
    window.location.href = '/login/';
    return; // Detiene la ejecución del script
  }

  // ==========================================
  // === FUNCIONES PARA MANIPULAR LA INTERFAZ DEL CHAT ===
  // ==========================================

  /**
   * 📝 FUNCIÓN: Agrega un mensaje del usuario al chat-log
   * Se usa para mostrar visualmente lo que escribió el usuario
   * @param {string} mensaje - El texto del mensaje del usuario
   */
  function agregarMensajeUsuario(mensaje) {
    if (!chatLog) return; // Si no existe el contenedor del chat, no hace nada
    
    const messageContainer = document.createElement('div');
    messageContainer.style.textAlign = 'right'; // Alinea mensajes del usuario a la derecha
    messageContainer.innerHTML = `<strong>Tú:</strong> ${mensaje}`;
    chatLog.appendChild(messageContainer);
    chatLog.scrollTop = chatLog.scrollHeight; // Scroll hacia abajo para ver el último mensaje
  }

  /**
   * 🤖 FUNCIÓN: Agrega un mensaje del bot al chat-log
   * Renderiza el texto como Markdown usando la librería 'marked'
   * @param {string} texto - El texto del mensaje del bot
   */
  function agregarMensajeBot(texto) {
    if (!chatLog) return; // Si no existe el contenedor del chat, no hace nada
    
    const botName = window.categoriaNombre || 'Banky'; // Usa nombre de categoría o "Banky" por defecto
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('bot-message'); // Añade clase CSS para estilos
    
    // 🎨 Usa librería 'marked' para convertir Markdown a HTML
    messageContainer.innerHTML = `<strong>${botName}:</strong> ${marked.parse(texto)}`;
    chatLog.appendChild(messageContainer);
    chatLog.scrollTop = chatLog.scrollHeight; // Scroll hacia abajo
  }

  // ==========================================
  // === FUNCIONES DE COMUNICACIÓN CON LA API (BACKEND) ===
  // ==========================================

  /**
   * 🌐 FUNCIÓN: Envía un mensaje al backend para obtener respuesta del chatbot
   * Esta es la función principal de comunicación con el servidor
   * @param {string} mensaje - El mensaje a enviar al chatbot
   * @param {function} callback - La función que se ejecutará con la respuesta del bot
   */
  function enviarMensajeAlBackend(mensaje, callback) {
    fetch(`/users/dashboard/chat/api/chatbot/${window.chatbotId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token // 🔐 Incluye token JWT para autenticación
      },
      body: JSON.stringify({ message: mensaje })
    })
      .then(response => response.json())
      .then(data => {
        // 📞 Llama al callback con la respuesta del bot
        callback(data.response || data.respuesta || "");
      })
      .catch(error => {
        // ❌ Manejo de errores de comunicación
        agregarMensajeBot("Hubo un error al comunicarse con el chatbot.");
        console.error(error);
      });
  }

  /**
   * 💾 FUNCIÓN PRINCIPAL: Procesa la respuesta JSON del roadmap y la guarda como estrategia
   * Esta es la función MÁS IMPORTANTE del sistema actual de roadmaps
   * @param {string} respuesta - La respuesta completa del bot que contiene el JSON
   * @param {string} categoriaNombre - El nombre de la categoría para la estrategia
   */
  function guardarRoadmapComoEstrategia(respuesta, categoriaNombre) {
    try {
      // === EXTRAER JSON DE LA RESPUESTA ===
      // Busca un bloque JSON en la respuesta del bot (puede tener texto adicional)
      const jsonMatch = respuesta.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No se encontró JSON en la respuesta.");
      
      // === PARSEAR Y VALIDAR JSON ===
      const roadmapData = JSON.parse(jsonMatch[0]);
      // Busca el objeto estrategia en diferentes posibles ubicaciones
      const estrategiaData = roadmapData.estrategia || roadmapData.roadmap || roadmapData;

      // Validar que tenga la estructura esperada (debe contener etapas)
      if (!estrategiaData || !Array.isArray(estrategiaData.etapas)) {
        throw new Error("El JSON recibido no tiene la estructura esperada (debe contener 'etapas').");
      }

      // === EXTRAER DATOS PRINCIPALES DE LA ESTRATEGIA ===
      const titulo = estrategiaData.titulo || `Roadmap para ${categoriaNombre}`;
      const descripcion = estrategiaData.descripcion || "Roadmap generado automáticamente por el chatbot.";
      const fechaCumplimiento = estrategiaData.fecha_cumplimiento || null;

      // === MAPEAR ETAPAS Y ACTIVIDADES AL FORMATO DEL BACKEND ===
      const etapasPayload = estrategiaData.etapas.map(etapa => ({
        nombre: etapa.nombre || "Etapa sin nombre", // Nombre de la etapa
        descripcion: etapa.descripcion || "", // Descripción de la etapa
        actividades: (etapa.actividades || []).map(act => ({
          // Maneja diferentes formatos de actividad (string o objeto)
          descripcion: typeof act === "string" ? act : (act.descripcion || act.tarea || ""),
          fecha_limite: act.fecha_limite || null, // Fecha límite de la actividad
          completada: act.completada || false // Estado inicial: no completada
        }))
      }));

      // === ENVIAR AL BACKEND PARA GUARDAR ===
      fetch('/empresas/api/estrategias/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token // 🔐 Autenticación JWT
        },
        body: JSON.stringify({
          titulo: titulo,
          descripcion: descripcion,
          categoria: categoriaNombre,
          fecha_cumplimiento: fechaCumplimiento,
          etapas: etapasPayload // Etapas con sus actividades
        })
      })
        .then(response => {
          // === MANEJAR RESPUESTA DEL SERVIDOR ===
          if (!response.ok) {
            // Si hay error, obtener detalles y lanzar excepción
            return response.json().then(err => { throw new Error(JSON.stringify(err)) });
          }
          return response.json();
        })
        .then(data => {
          // ✅ ÉXITO: Roadmap guardado correctamente
          alert('¡Roadmap guardado en Estrategias!');
        })
        .catch(error => {
          // ❌ ERROR: Mostrar mensaje de error al usuario
          alert('Error al guardar el roadmap: ' + error.message);
          console.error('Error al guardar el roadmap:', error);
        });

    } catch (e) {
      // ❌ ERROR EN PROCESAMIENTO: JSON mal formado o estructura incorrecta
      alert("No se pudo procesar el roadmap como JSON. Por favor, revisa el formato. Error: " + e.message);
      console.error(e);
    }
  }

  // ==========================================
  // === CARGA INICIAL DEL CHAT ===
  // ==========================================
  // Si se ha seleccionado un chatbot, carga su historial de conversaciones previas
  if (window.chatbotId && chatLog) {
    fetch(`/users/dashboard/chat/api/conversaciones/${window.chatbotId}/`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(response => response.json())
      .then(data => {
        // === LIMPIAR VISTA Y MEMORIA ===
        chatLog.innerHTML = ''; // Limpia la vista del chat
        conversationHistory = []; // Limpia el array de historial en memoria
        
        // === RENDERIZAR CONVERSACIONES GUARDADAS ===
        data.forEach(conversacion => {
          // Agregar mensajes a la vista y al historial en memoria
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

  // ==========================================
  // === EVENT LISTENERS (MANEJADORES DE EVENTOS) ===
  // ==========================================

  // 📤 MANEJADOR: Botón de enviar mensaje normal
  if (enviarBtn) {
    enviarBtn.addEventListener('click', () => {
      // === OBTENER Y VALIDAR MENSAJE ===
      const mensaje = userMessageInput.value.trim(); // Obtiene y limpia el mensaje del input
      if (!mensaje) return; // Si no hay mensaje, no hace nada

      // === ACTUALIZAR INTERFAZ ===
      agregarMensajeUsuario(mensaje); // Muestra el mensaje del usuario en el chat
      conversationHistory.push({ role: 'user', content: mensaje }); // Añade al historial
      userMessageInput.value = ''; // Limpia el campo de texto

      // === ENVIAR AL BACKEND Y PROCESAR RESPUESTA ===
      enviarMensajeAlBackend(mensaje, function (respuesta) {
        agregarMensajeBot(respuesta); // Muestra la respuesta del bot
        conversationHistory.push({ role: 'assistant', content: respuesta }); // Añade al historial
        
        // 🗺️ Si se estaba esperando un roadmap, procesarlo y guardarlo
        if (esRoadmap) {
          guardarRoadmapComoEstrategia(respuesta, window.categoriaNombre);
          esRoadmap = false; // Resetea el flag
        }
      });
    });
  }

  // ⌨️ MANEJADOR: Enviar mensaje con tecla "Enter"
  if (userMessageInput) {
      userMessageInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
              enviarBtn.click(); // Simula un clic en el botón de enviar
          }
      });
  }

  // 🗺️ MANEJADOR PRINCIPAL: Botón de generar roadmap (SISTEMA ACTUAL)
  // ⭐ Esta es la función MÁS IMPORTANTE del sistema de roadmaps
  if (roadmapBtn) {
    roadmapBtn.addEventListener('click', function () {
      // === ACTIVAR MODO ROADMAP ===
      esRoadmap = true; // Activa el flag para procesar la próxima respuesta como roadmap
      
      // === MENSAJES PARA EL USUARIO ===
      const mensajeCorto = `Hazme el roadmap para la categoría "${window.categoriaNombre}"`;

      // === GENERAR FECHA ACTUAL PARA CÁLCULOS ===
      const fechaHoy = new Date().toISOString().split('T')[0]; // Formato: YYYY-MM-DD

      // === FORMATEAR HISTORIAL DE CONVERSACIÓN ===
      // Incluye todo el contexto previo de la conversación para un roadmap más personalizado
      const historialFormateado = conversationHistory.map(msg => {
        return `${msg.role === 'user' ? 'Usuario' : 'Banky'}: ${msg.content}`;
      }).join('\n\n');

      // === CREAR PROMPT LARGO Y DETALLADO ===
      // Este es el prompt REAL que se envía al chatbot para generar el roadmap
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

IMPORTANTE: Hoy es ${fechaHoy}. Usa esta fecha como base para calcular todas las fechas del roadmap.
- La fecha_cumplimiento debe ser realista (entre 3-12 meses desde hoy)
- Las fechas_limite de las actividades deben estar distribuidas progresivamente desde hoy hasta la fecha de cumplimiento
- Todas las fechas deben estar en formato YYYY-MM-DD
- No uses fechas del pasado (anteriores a ${fechaHoy})

No limites la cantidad de etapas ni de actividades; incluye todas las que consideres necesarias para un roadmap completo.`;

      // === MOSTRAR ACCIÓN AL USUARIO ===
      // Muestra el mensaje corto en la interfaz para que el usuario vea su acción
      agregarMensajeUsuario(mensajeCorto);

      // === ENVIAR PROMPT LARGO AL BACKEND ===
      // Envía el prompt detallado (el usuario no ve este prompt largo)
      enviarMensajeAlBackend(mensajeLargo, function (respuesta) {
        // === PROCESAR Y GUARDAR ROADMAP ===
        // Muestra mensaje de confirmación
        agregarMensajeBot("Revisa el apartado estrategias para ver el roadmap generado.");
        // Procesa el JSON y guarda en el backend
        guardarRoadmapComoEstrategia(respuesta, window.categoriaNombre);
      });
    });
  }
});

