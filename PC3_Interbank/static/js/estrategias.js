function cargarEstrategias() {
  const token = localStorage.getItem('access_token');
  fetch('/empresas/api/estrategias/', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById('estrategias-tbody');
      tbody.innerHTML = '';
      data.forEach(estrategia => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${estrategia.titulo}</td>
          <td>${estrategia.empresa || 'Sin empresa'}</td>
          <td>${estrategia.categoria}</td>
          <td>${estrategia.estado}</td>
          <td>${estrategia.fecha_registro}</td>
          <td>${estrategia.fecha_cumplimiento || 'Sin fecha'}</td>
          <td><button onclick="verDetalle(${estrategia.id})">Ver</button></td>
        `;
        tbody.appendChild(row);
      });
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
      document.getElementById('detalle-titulo').textContent = data.titulo;
      document.getElementById('detalle-descripcion').textContent = data.descripcion;
      document.getElementById('detalle-estado').textContent = data.estado;
      document.getElementById('detalle-fecha-creacion').textContent = data.fecha_creacion;
      document.getElementById('detalle-fecha-cumplimiento').textContent = data.fecha_cumplimiento || 'Sin fecha';
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

// Cargar estrategias al inicio
document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('access_token');

  // Si no hay token, no continuamos
  if (!token) {
    alert('Debes iniciar sesión para ver tus estrategias.');
    window.location.href = '/login/'; // Asegúrate que esta es tu URL de login
    return;
  }

  // Hacemos la llamada a la API para obtener las estrategias
  fetch('/empresas/api/estrategias/', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error al obtener las estrategias. Código: ' + response.status);
    }
    return response.json();
  })
  .then(estrategias => {
    const tbody = document.getElementById('estrategias-tbody');
    tbody.innerHTML = ''; // Limpiamos la tabla antes de llenarla

    if (estrategias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No tienes estrategias registradas.</td></tr>';
        return;
    }

    estrategias.forEach(estrategia => {
      let row = document.createElement('tr');
      
      // **AQUÍ ESTÁ EL CAMBIO CLAVE**
      // Creamos un enlace (<a>) en lugar de un botón con evento.
      row.innerHTML = `
        <td>${estrategia.titulo}</td>
        <td>${estrategia.descripcion}</td>
        <td>${estrategia.categoria || 'Sin categoría'}</td>
        <td>
          <a href="/users/dashboard/estrategias/${estrategia.id}/actividades/" class="btn-ver-actividades">
            Ver etapas y actividades
          </a>
        </td>
      `;
      tbody.appendChild(row);
    });
  })
  .catch(error => {
    console.error('Error en el fetch de estrategias:', error);
    alert('Hubo un problema al cargar tus estrategias. Por favor, intenta de nuevo.');
  });
});