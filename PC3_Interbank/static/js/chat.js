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
Por favor, crea un roadmap en formato JSON para una pyme peruana que busque acceder a financiamiento. Debe incluir 4 etapas:
1. Identificar fuentes de financiamiento  
2. Preparar documentación  
3. Calcular costos y tasas  
4. Mejorar perfil crediticio  

Para cada etapa:
- "descripcion": breve explicación del propósito.  
- "actividades": lista de objetos con "tarea" y "fecha_limite" (usa fechas ficticias).  
- "estado": inicial "pendiente".  
Ejemplo de estructura general:
{
  "etapas": [
    {
      "nombre": "Identificar fuentes de financiamiento",
      "descripcion": "...",
      "actividades": [
        { "tarea": "...", "fecha_limite": "YYYY-MM-DD" },
        …
      ],
      "estado": "pendiente"
    },
    …
  ]
}
      `.trim();
      break;

    case "Marketing Digital":
      mensaje = `
Por favor, crea un roadmap en JSON para una campaña de marketing digital de una pyme peruana. Debe tener 4 etapas:
1. Definir objetivos de campaña  
2. Identificar público objetivo  
3. Crear y calendarizar contenido para redes  
4. Configurar PPC y SEO  

Cada etapa debe incluir:
- "descripcion": objetivo de la fase.  
- "actividades": listado con "tarea" y "fecha_limite" (ficticias).  
- "estado": "pendiente".  

Devuélvelo sólo como JSON, sin texto adicional.
      `.trim();
      break;

    case "Legal y Tributario":
      mensaje = `
Por favor, crea un roadmap en JSON para que una pyme peruana cumpla con sus obligaciones legales y tributarias. Incluye 4 etapas:
1. Constitución de la empresa  
2. Registro en SUNAT  
3. Declaración de impuestos  
4. Cumplimiento de obligaciones laborales  

Para cada etapa:
- "descripcion": breve.  
- "actividades": array de objetos con "tarea" y "fecha_limite".  
- "estado": "pendiente".  

La salida debe ser un único objeto JSON.
      `.trim();
      break;

    case "Innovación y Desarrollo de Productos":
      mensaje = `
Por favor, crea un roadmap en JSON para el desarrollo de un nuevo producto en una pyme peruana, con 4 etapas:
1. Ideación y validación de concepto  
2. Desarrollo de prototipo (MVP)  
3. Pruebas de mercado  
4. Lanzamiento  

Cada objeto de etapa debe contener:
- "descripcion"  
- "actividades": lista de { "tarea", "fecha_limite" }  
- "estado": "pendiente"  

Entrega únicamente el JSON.
      `.trim();
      break;

    case "Gestión de Clientes":
      mensaje = `
Por favor, crea un roadmap en JSON para optimizar la gestión de clientes en una pyme peruana. Incluye 4 etapas:
1. Identificación de clientes potenciales  
2. Estrategias de acercamiento  
3. Proceso de ventas y cierre  
4. Seguimiento y fidelización  

Para cada etapa:
- "descripcion"  
- "actividades": array de { "tarea", "fecha_limite" }  
- "estado": "pendiente"  

Responde solo con el JSON.
      `.trim();
      break;

    case "Sostenibilidad y RSE":
      mensaje = `
Por favor, crea un roadmap en JSON para implementar sostenibilidad y RSE en una pyme peruana. Debe incluir 4 etapas:
1. Evaluación del estado actual  
2. Definición de políticas y objetivos  
3. Implementación de prácticas  
4. Monitoreo y reporte  

Cada etapa con:
- "descripcion"  
- "actividades": listado con "tarea" y "fecha_limite"  
- "estado": "pendiente"  

Solo JSON como respuesta.
      `.trim();
      break;

    case "Branding":
      mensaje = `
Por favor, crea un roadmap en JSON para el branding de una pyme peruana. Incluye estas 4 etapas:
1. Definición de identidad (misión, visión, valores)  
2. Diseño de logotipo y paleta de colores  
3. Elaboración de manual de marca  
4. Plan de lanzamiento  

Cada etapa debe tener:
- "descripcion"  
- "actividades": array de { "tarea", "fecha_limite" }  
- "estado": "pendiente"  

Devuelve únicamente el JSON.
      `.trim();
      break;

    case "Diseño y Desarrollo UX/UI":
      mensaje = `
Por favor, crea un roadmap en JSON para el diseño y desarrollo UX/UI de un producto digital para una pyme peruana. Con estas 5 etapas:
1. Investigación de usuario  
2. Arquitectura de información y wireframes  
3. Prototipado interactivo  
4. Testeo con usuarios  
5. Ajustes finales y entrega  

Para cada etapa:
- "descripcion"  
- "actividades": lista de { "tarea", "fecha_limite" }  
- "estado": "pendiente"  

Solo JSON en la respuesta.
      `.trim();
      break;

    case "SEO en la Era de la IA":
      mensaje = `
Por favor, crea un roadmap en JSON para una estrategia de SEO con IA en una pyme peruana. Debe incluir 4 etapas:
1. Auditoría SEO inicial  
2. Análisis de palabras clave con IA  
3. Optimización on‑page  
4. Seguimiento y ajustes  

Cada etapa con:
- "descripcion"  
- "actividades": array de { "tarea", "fecha_limite" }  
- "estado": "pendiente"  

Responde únicamente con el objeto JSON.
      `.trim();
      break;

    default:
      mensaje = "Por favor, genera un roadmap estructurado en JSON para esta categoría.";
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
  if (!window.chatbotId) return;

  const chatLog = document.getElementById('chat-log');
  const enviarBtn = document.getElementById('enviar-btn');
  const userMessageInput = document.getElementById('user-message');
  const roadmapBtn = document.getElementById('roadmap-btn');
  const token = localStorage.getItem('access_token');
  let esRoadmap = false;

  // Cargar historial de conversaciones reales desde el backend
  fetch(`/users/dashboard/chat/api/conversaciones/${chatbotId}/`, {
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

  // Enviar mensaje normal
  enviarBtn.addEventListener('click', () => {
    const mensaje = userMessageInput.value.trim();
    if (!mensaje) return;

    // Mostrar el mensaje del usuario inmediatamente
    chatLog.innerHTML += `<div><strong>Tú:</strong> ${mensaje}</div>`;
    chatLog.scrollTop = chatLog.scrollHeight;
    userMessageInput.value = '';

    fetch(`/users/dashboard/chat/api/chatbot/${chatbotId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ message: mensaje })
    })
    .then(response => response.json())
    .then(data => {
      if (data.response) {
        chatLog.innerHTML += `<div><strong>${window.categoriaNombre} Bot:</strong> ${data.response}</div>`;
        chatLog.scrollTop = chatLog.scrollHeight;
        // Si es roadmap, envía a estrategias
        if (esRoadmap) {
          enviarRoadmapAEstrategias(data.response, window.categoriaNombre);
          esRoadmap = false;
        }
      } else if (data.error) {
        chatLog.innerHTML += `<div style="color:red;"><strong>Error:</strong> ${data.error}</div>`;
        chatLog.scrollTop = chatLog.scrollHeight;
      }
    });
  });

  // Botón roadmap
  if (roadmapBtn) {
    roadmapBtn.addEventListener('click', function() {
      let mensaje = "";
      esRoadmap = true;
      switch (window.categoriaNombre) {
        case "Acceso a Financiamiento":
          mensaje = "Por favor, genera un roadmap estructurado en formato JSON para el acceso a financiamiento de una pyme, incluyendo etapas como análisis de necesidades, búsqueda de opciones, preparación de documentos, solicitud y seguimiento.";
          break;
        case "Marketing Digital":
          mensaje = "Por favor, genera un roadmap estructurado en formato JSON para una campaña de marketing digital de una pyme, incluyendo etapas como análisis, planificación, ejecución, monitoreo y optimización.";
          break;
        case "Innovación y Desarrollo de Productos":
          mensaje = "Por favor, genera un roadmap estructurado en formato JSON para la innovación y desarrollo de productos en una pyme, incluyendo etapas como ideación, validación, prototipado, lanzamiento y mejora continua.";
          break;
        case "Branding":
          mensaje = "Por favor, genera un roadmap estructurado en formato JSON para el desarrollo de branding de una pyme. Incluye etapas como definición de identidad, diseño de logotipo, desarrollo de manual de marca y lanzamiento.";
          break;
        case "Diseño y Desarrollo UX/UI":
          mensaje = "Por favor, genera un roadmap estructurado en formato JSON para el diseño y desarrollo UX/UI de un producto digital. Incluye etapas como investigación de usuario, wireframes, prototipado, testeo y entrega final.";
          break;
        case "SEO en la Era de la IA":
          mensaje = "Por favor, genera un roadmap estructurado en formato JSON para una estrategia de SEO moderna que aproveche herramientas de inteligencia artificial. Incluye etapas como auditoría SEO, análisis de palabras clave con IA, optimización on-page y seguimiento de resultados.";
          break;
        default:
          mensaje = "Por favor, genera un roadmap estructurado para esta categoría.";
          break;
      }
      userMessageInput.value = mensaje;
      enviarBtn.click();
    });
  }

  // Función para enviar roadmap a Estrategias
  function enviarRoadmapAEstrategias(respuesta, categoriaNombre) {
    // Si la respuesta es texto plano, parsea etapas y actividades
    const lineas = respuesta.split('\n');
    let titulo = `Roadmap para ${categoriaNombre}`;
    let descripcion = "Roadmap generado automáticamente por el chatbot.";
    let actividades = [];

    let etapaActual = "";
    lineas.forEach(linea => {
      // Detecta el inicio de una etapa (ej: 1. **Análisis y Planificación:**)
      const matchEtapa = linea.match(/^\d+\.\s*\*\*(.+?)\*\*:/);
      if (matchEtapa) {
        etapaActual = matchEtapa[1].trim();
        return;
      }
      // Detecta actividad (guion)
      const matchActividad = linea.match(/^\s*-\s*(.+)/);
      if (matchActividad && etapaActual) {
        actividades.push({
          descripcion: `${etapaActual}: ${matchActividad[1].trim()}`,
          fecha_limite: null,
          estado: "pendiente"
        });
      }
    });

    // Envía a Estrategias
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
      alert('Error al guardar el roadmap: ' + error.message);
      console.error('Error al guardar el roadmap:', error);
    });
  }
});

