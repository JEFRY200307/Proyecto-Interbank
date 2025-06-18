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
document.addEventListener('DOMContentLoaded', cargarEstrategias);