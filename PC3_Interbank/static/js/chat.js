let categoriaSeleccionada = null;
let categoriaNombre = "";

function seleccionarCategoria(id, nombre) {
  categoriaSeleccionada = id;
  categoriaNombre = nombre;
  document.getElementById('chat-section').style.display = 'block';
  document.getElementById('chat-category-title').textContent = "Chatbot: " + nombre;
  document.getElementById('chat-log').innerHTML = "";
}

function enviarMensaje() {
  const mensaje = document.getElementById('user-message').value;
  if (!mensaje || !categoriaSeleccionada) return;
  const token = localStorage.getItem('access_token');
  const log = document.getElementById('chat-log');
  
  // Mostrar mensaje del usuario
  log.innerHTML += `<div><strong>Tú:</strong> ${mensaje}</div>`;
  document.getElementById('user-message').value = '';

  // Actualiza la URL al endpoint correcto:
  fetch(`/users/dashboard/chat/api/chatbot/${categoriaSeleccionada}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ mensaje })
  })
  .then(response => response.json())
  .then(data => {
    console.log("Respuesta del backend:", data);
    log.innerHTML += `<div><strong>${categoriaNombre} Bot:</strong> ${data.response}</div>`;
  });
}