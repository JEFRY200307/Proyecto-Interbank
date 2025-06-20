function cargarEstrategias(token) {
  // Usamos la API que lista las estrategias de la empresa/mentor actual
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
      tbody.innerHTML = ''; // Limpiar tabla antes de llenarla

      if (estrategias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No tienes estrategias registradas. Puedes crear una desde el chatbot.</td></tr>';
        return;
      }

      estrategias.forEach(estrategia => {
        const fila = document.createElement('tr');

        // --- ESTA ES LA LÓGICA QUE TE FALTABA ---
        fila.innerHTML = `
                <td>${estrategia.titulo || 'Sin título'}</td>
                <td>${estrategia.descripcion || 'Sin descripción'}</td>
                <td>${estrategia.categoria || 'N/A'}</td>
                <td>
                    <button class="btn-accion" onclick="abrirModalActividades(${estrategia.id})">Ver Actividades</button>
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

function verDetalle(id) {
  const token = localStorage.getItem('access_token');
  fetch(`/empresas/api/estrategias/${id}/`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(response => response.json())
    .then(data => {
      // Asumiendo que tienes elementos con estos IDs para mostrar los detalles
      document.getElementById('detalle-titulo').textContent = data.titulo;
      document.getElementById('detalle-descripcion').textContent = data.descripcion;
      const actividadesList = document.getElementById('detalle-actividades');
      actividadesList.innerHTML = '';
      data.actividades.forEach(actividad => {
        const li = document.createElement('li');
        li.textContent = `${actividad.descripcion} - ${actividad.completada ? 'Completada' : 'Pendiente'}`;
        actividadesList.appendChild(li);
      });
      document.getElementById('estrategia-detalle').style.display = 'block';
      document.querySelector('.estrategias-list').style.display = 'none';
    });
}

function volverALaLista() {
  document.getElementById('estrategia-detalle').style.display = 'none';
  document.querySelector('.estrategias-list').style.display = 'block';
}


// --- NUEVAS FUNCIONES PARA LA MENTORÍA (Añade esto) ---
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
function abrirModalActividades(estrategiaId) {
  const modal = document.getElementById('modal-actividades');
  if (modal) {
    modal.style.display = 'block';
    cargarActividadesEstrategia(estrategiaId);
  } else {
    alert('El modal de actividades no se encuentra en la página.');
  }
}

function cerrarModalActividades() {
  const modal = document.getElementById('modal-actividades');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function cargarActividadesEstrategia(estrategiaId) {
  const token = localStorage.getItem('access_token');
  const container = document.getElementById('actividades-lista'); // Asegúrate de que tu modal tenga un div con este ID
  container.innerHTML = '<p>Cargando actividades...</p>';

  // --- LA LÍNEA CRÍTICA CORREGIDA ---
  // Llamamos a la URL que devuelve la LISTA de actividades, no los detalles de la estrategia.
  const url = `/empresas/api/estrategias/${estrategiaId}/actividades/`;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      // Esto se activará si la vista del backend devuelve un error (ej. 404 por permisos)
      throw new Error('Error al cargar actividades o no tienes permiso.');
    }

    // La respuesta de esta URL es un array simple de actividades: [act1, act2, ...]
    const actividades = await res.json();

    if (!actividades || actividades.length === 0) {
      container.innerHTML = '<p>No hay actividades registradas para esta estrategia.</p>';
      return;
    }

    // Construimos la lista HTML a partir del array de actividades
    let html = '<ul>';
    actividades.forEach(act => {
      // Asumiendo que tu ActividadSerializer devuelve 'descripcion'
      html += `<li>${act.descripcion}</li>`;
    });
    html += '</ul>';

    container.innerHTML = html;

  } catch (error) {
    console.error('Error en cargarActividadesEstrategia:', error);
    container.innerHTML = `<p style="color: red;">${error.message}</p>`;
  }
}

// --- LISTENER PRINCIPAL (Modificado para llamar a ambas lógicas) ---
document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('access_token');

  if (!token) {
    alert('Debes iniciar sesión para ver tus estrategias.');
    window.location.href = '/login/';
    return;
  }

  // Llamamos a ambas funciones al cargar la página
  cargarEstrategias(token); // Tu función original para la tabla
  verificarEstadoMentoria(token); // La nueva función para el botón de mentoría
});