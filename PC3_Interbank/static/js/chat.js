let categoriaSeleccionada = null;
let categoriaNombre = "";

function seleccionarCategoria(id, nombre) {
  categoriaSeleccionada = id;
  categoriaNombre = nombre;
  document.getElementById('chat-section').style.display = 'block';
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
    log.innerHTML += `<div><strong>${categoriaNombre} Bot:</strong> ${data.response}</div>`;
    // Guardar historial después de la respuesta del bot
    localStorage.setItem('chat_historial_' + categoriaSeleccionada, log.innerHTML);
  })
  .catch(error => console.error("Error en el chatbot:", error));
}
function enviarMensajeRoadmap(catId) {
  seleccionarCategoria(catId, document.querySelector(`[onclick*="seleccionarCategoria(${catId}"]`).textContent);
  document.getElementById('user-message').value = "Estoy listo para que me des el roadmap";
  enviarMensaje();
}