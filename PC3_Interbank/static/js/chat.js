// function enviarMensajeChat() {
//     const mensaje = document.getElementById('input-mensaje').value;
//     fetch('/chat/api/chat/', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': 'Bearer ' + token
//         },
//         body: JSON.stringify({ mensaje })
//     })
//     .then(response => response.json())
//     .then(data => {
//         document.getElementById('chat-respuesta').innerText = data.respuesta;
//     });
// }