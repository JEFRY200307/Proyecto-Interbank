document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('access_token');

  if (!token) {
    alert('Debes iniciar sesión para ver esta sección.');
    window.location.href = '/login/'; // Asegúrate que esta es tu URL de login
    return;
  }

  // Llamamos a las funciones para cargar el contenido de la página
  cargarEstrategias(token);
  verificarEstadoMentoria(token);
});

function cargarEstrategias(token) {
  fetch('/empresas/api/estrategias/', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error al cargar las estrategias.');
    }
    return response.json();
  })
  .then(estrategias => {
    const tbody = document.getElementById('estrategias-tbody');
    tbody.innerHTML = ''; // Limpiar tabla

    if (estrategias.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No tienes estrategias registradas. Puedes crear una desde el chatbot.</td></tr>';
      return;
    }

    estrategias.forEach(estrategia => {
      const fila = document.createElement('tr');

      // Formatear la fecha si existe, de lo contrario mostrar un texto por defecto.
      const fechaCumplimiento = estrategia.fecha_cumplimiento 
        ? new Date(estrategia.fecha_cumplimiento).toLocaleDateString('es-ES') 
        : 'No definida';

      // --- AQUÍ ESTÁ LA CORRECCIÓN ---
      // Cambiamos el botón que abre un modal por un enlace (<a>) que redirige a otra página.
      fila.innerHTML = `
        <td>${estrategia.titulo || 'Sin título'}</td>
        <td>${estrategia.descripcion || 'Sin descripción'}</td>
        <td>${estrategia.categoria || 'N/A'}</td>
        <td>${fechaCumplimiento}</td>
        <td>
          <a href="/users/dashboard/estrategias/${estrategia.id}/actividades/" class="btn-ver-actividades">
            Ver etapas y actividades
          </a>
        </td>
      `;
      tbody.appendChild(fila);
    });
  })
  .catch(error => {
    console.error('Error:', error);
    const tbody = document.getElementById('estrategias-tbody');
    tbody.innerHTML = `<tr><td colspan="4" style="color: red;">${error.message}</td></tr>`;
  });
}

// --- LÓGICA DE MENTORÍA (se mantiene igual) ---
async function verificarEstadoMentoria(token) {
  const mentoriaContainer = document.getElementById('mentoria-seccion');
  if (!mentoriaContainer) return;

  try {
    const response = await fetch('/empresas/api/perfil/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('No se pudo obtener el perfil de la empresa.');

    const perfil = await response.json();

    if (perfil.tiene_mentor) {
      mentoriaContainer.innerHTML = `<p class="text-success">Ya tienes un mentor asignado.</p>`;
    } else if (perfil.solicita_mentoria) {
      mentoriaContainer.innerHTML = `<p class="text-info">Solicitud de mentoría pendiente.</p>`;
    } else {
      mentoriaContainer.innerHTML = `<button id="solicitar-mentoria-btn" class="btn btn-primary">Solicitar Mentoría</button>`;
      document.getElementById('solicitar-mentoria-btn').addEventListener('click', () => solicitarMentoria(token));
    }
  } catch (error) {
    console.error('Error verificando estado de mentoría:', error);
    mentoriaContainer.innerHTML = `<p class="text-danger">No se pudo cargar el estado de la mentoría.</p>`;
  }
}

async function solicitarMentoria(token) {
  const btn = document.getElementById('solicitar-mentoria-btn');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    const response = await fetch('/empresas/api/solicitar-mentoria/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje || 'Error al enviar la solicitud.');

    document.getElementById('mentoria-seccion').innerHTML = `<p class="text-info">${result.mensaje}</p>`;

  } catch (error) {
    console.error('Error al solicitar mentoría:', error);
    alert(error.message);
    btn.disabled = false;
    btn.textContent = 'Solicitar Mentoría';
  }
}