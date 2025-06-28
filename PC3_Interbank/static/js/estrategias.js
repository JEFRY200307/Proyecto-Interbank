document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('access_token');

  if (!token) {
    alert('Debes iniciar sesión para ver esta sección.');
    window.location.href = '/login/'; // Asegúrate que esta es tu URL de login
    return;
  }

  // Llamamos a las funciones para cargar el contenido de la página
  cargarEstrategias(token);
});

function cargarEstrategias(token) {
  // Mostrar loading state
  const contenedor = document.querySelector('.estrategias-list');
  if (contenedor) {
    let loadingElement = document.getElementById('loading-estrategias');
    if (!loadingElement) {
      loadingElement = document.createElement('div');
      loadingElement.id = 'loading-estrategias';
      loadingElement.className = 'loading-state';
      loadingElement.innerHTML = '⏳ Cargando estrategias...';
      contenedor.appendChild(loadingElement);
    }
  }

  fetch('/empresas/api/estrategias/', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      // Mejorar el manejo de errores específicos
      if (response.status === 401) {
        throw new Error('Token de autenticación inválido. Por favor, inicia sesión nuevamente.');
      } else if (response.status === 403) {
        throw new Error('No tienes permisos para ver las estrategias.');
      } else if (response.status === 404) {
        throw new Error('Endpoint de estrategias no encontrado.');
      } else {
        throw new Error(`Error del servidor: ${response.status} - ${response.statusText}`);
      }
    }
    return response.json();
  })
  .then(data => {
    console.log('Estrategias recibidas:', data);
    
    // Ocultar loading state
    const loadingElement = document.getElementById('loading-estrategias');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    const tablaEstrategias = document.getElementById('tabla-estrategias');
    const contenedor = document.querySelector('.estrategias-list');
    
    if (!contenedor) {
      console.error('No se encontró el contenedor .estrategias-list');
      return;
    }
    
    // Ocultamos la tabla original si existe
    if (tablaEstrategias) {
      tablaEstrategias.style.display = 'none';
    }

    // Creamos un nuevo contenedor para las tarjetas si no existe
    let cardsContainer = document.getElementById('estrategias-cards-container');
    if (!cardsContainer) {
        cardsContainer = document.createElement('div');
        cardsContainer.id = 'estrategias-cards-container';
        cardsContainer.className = 'estrategias-cards-container';
        contenedor.appendChild(cardsContainer);
    }
    cardsContainer.innerHTML = ''; // Limpiamos el contenido previo

    // Verificar si hay estrategias
    if (!data || data.length === 0) {
      cardsContainer.innerHTML = `
        <div class="empty-state-estrategias">
          <div class="empty-icon">📊</div>
          <h3>No hay estrategias registradas</h3>
          <p>Crea tu primera estrategia para comenzar a gestionar tu roadmap empresarial.</p>
          <button onclick="location.href='/users/dashboard/nueva-estrategia/'" class="btn-crear-estrategia">
            Crear Primera Estrategia
          </button>
        </div>
      `;
      return;
    }

    data.forEach((estrategia, index) => {
        const fechaCumplimiento = estrategia.fecha_cumplimiento 
            ? new Date(estrategia.fecha_cumplimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
            : 'Sin fecha';

        const card = document.createElement('div');
        card.className = 'estrategia-card';
        card.style.animationDelay = `${index * 0.1}s`; // Animación escalonada
        card.innerHTML = `
            <div class="card-header">
                <h4>${estrategia.titulo || 'Sin título'}</h4>
                <span class="categoria">${estrategia.categoria || 'N/A'}</span>
            </div>
            <div class="card-body">
                <p>${estrategia.descripcion || 'Sin descripción'}</p>
                ${estrategia.mentor_asignado ? `
                <div class="mentor-info">
                  <span class="mentor-badge">👨‍💼 Mentor: ${estrategia.mentor_asignado_nombre || 'Asignado'}</span>
                </div>
                ` : ''}
            </div>
            <div class="card-footer">
                <span class="fecha">🗓️ ${fechaCumplimiento}</span>
                <a href="/users/dashboard/estrategias/${estrategia.id}/actividades/" class="btn-ver-actividades">Ver Roadmap →</a>
            </div>
        `;
        cardsContainer.appendChild(card);
    });
    
    console.log(`✅ Se cargaron ${data.length} estrategias correctamente`);
  })
  .catch(error => {
    console.error('Error detallado:', error);
    
    // Ocultar loading state
    const loadingElement = document.getElementById('loading-estrategias');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    // Mostrar error en la interfaz
    const contenedor = document.querySelector('.estrategias-list');
    if (contenedor) {
      let cardsContainer = document.getElementById('estrategias-cards-container');
      if (!cardsContainer) {
        cardsContainer = document.createElement('div');
        cardsContainer.id = 'estrategias-cards-container';
        cardsContainer.className = 'estrategias-cards-container';
        contenedor.appendChild(cardsContainer);
      }
      
      cardsContainer.innerHTML = `
        <div class="error-state-estrategias">
          <div class="error-icon">❌</div>
          <h3>Error al cargar estrategias</h3>
          <p>${error.message}</p>
          <button onclick="cargarEstrategias('${token}')" class="btn-reintentar">
            Reintentar
          </button>
        </div>
      `;
    }
    
    // Fallback para tabla si existe
    const tbody = document.getElementById('estrategias-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" style="color: red; text-align: center; padding: 2rem;">${error.message}</td></tr>`;
    }
  });
}