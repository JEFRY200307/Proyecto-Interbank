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
  document.getElementById('user-message').value = "Estoy listo para que me des el roadmap";
  enviarMensaje();
}

function volverATarjetas() {
  document.getElementById('chat-section').style.display = 'none';
  document.getElementById('chatbots-container').style.display = 'flex';
  document.getElementById('roadmap-btn').style.display = 'none';
  document.getElementById('volver-btn').style.display = 'none';
}

