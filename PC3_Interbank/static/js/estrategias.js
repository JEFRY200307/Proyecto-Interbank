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
  if (!token) {
    alert('Debes iniciar sesión para ver tus estrategias.');
    window.location.href = '/login/';
    return;
  }

  // 1. Cargar todas las estrategias
  fetch('/empresas/api/estrategias/', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => response.json())
  .then(estrategias => {
    const tbody = document.getElementById('estrategias-tbody');
    tbody.innerHTML = '';
    estrategias.forEach(estrategia => {
      let row = document.createElement('tr');
      row.innerHTML = `
        <td>${estrategia.titulo}</td>
        <td>${estrategia.descripcion}</td>
        <td>${estrategia.categoria || ''}</td>
        <td><button class="ver-etapas-btn" data-id="${estrategia.id}">Ver etapas y actividades</button></td>
      `;
      tbody.appendChild(row);
    });

    // 2. Evento para mostrar etapas y actividades
    document.querySelectorAll('.ver-etapas-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const estrategiaId = this.getAttribute('data-id');
        mostrarEtapasYActividades(estrategiaId, token);
      });
    });
  })
  .catch(error => {
    alert('Error al cargar estrategias: ' + error.message);
    console.error(error);
  });

  // 3. Función para mostrar etapas y actividades
  function mostrarEtapasYActividades(estrategiaId, token) {
    fetch(`/empresas/api/estrategias/${estrategiaId}/`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(response => response.json())
    .then(estrategia => {
      const panel = document.getElementById('panel-actividades');
      const lista = document.getElementById('lista-actividades');
      lista.innerHTML = '';
      if (estrategia.etapas && estrategia.etapas.length > 0) {
        estrategia.etapas.forEach(etapa => {
          // Título de la etapa
          let etapaHTML = `<li><strong>${etapa.nombre}</strong>`;
          if (etapa.descripcion) {
            etapaHTML += `<br><em>${etapa.descripcion}</em>`;
          }
          // Lista de actividades de la etapa
          if (etapa.actividades && etapa.actividades.length > 0) {
            etapaHTML += '<ul>';
            etapa.actividades.forEach(act => {
              etapaHTML += `<li>${act.descripcion} (${act.completada ? 'Completada' : 'Pendiente'})</li>`;
            });
            etapaHTML += '</ul>';
          } else {
            etapaHTML += '<ul><li>No hay actividades</li></ul>';
          }
          etapaHTML += '</li>';
          lista.innerHTML += etapaHTML;
        });
      } else {
        lista.innerHTML = '<li>No hay etapas ni actividades</li>';
      }
      panel.style.display = 'block';
    })
    .catch(error => {
      alert('Error al cargar etapas y actividades: ' + error.message);
      console.error(error);
    });
  }
});