// Variables globales para el estado de la UI
let empresaSeleccionadaId = null;
let estrategiasEditadas = {};
let actividadesEditadas = {};
const token = localStorage.getItem('access_token');

// --- INICIALIZACIÓN Y EVENTOS PRINCIPALES ---
document.addEventListener('DOMContentLoaded', function() {
    if (!token) {
        console.error('No se encontró token de acceso. Redirigiendo al login.');
        window.location.href = '/login/';
        return;
    }
    cargarEmpresasAsignadas();
    configurarModalSolicitudes();
    configurarNavegacion();
});

// --- CONFIGURACIÓN DE NAVEGACIÓN ---
function configurarNavegacion() {
    // Botón para ver estrategias
    const btnEstrategias = document.getElementById('verEstrategiasBtn');
    if (btnEstrategias) {
        btnEstrategias.onclick = () => {
            window.location.href = '/mentor/dashboard/estrategias/';
        };
    }
}

// --- LÓGICA DEL MODAL DE SOLICITUDES ---
function configurarModalSolicitudes() {
    const modal = document.getElementById('solicitudesModal');
    const btn = document.getElementById('verSolicitudesBtn');
    const span = document.querySelector('#solicitudesModal .close-button');

    btn.onclick = () => {
        modal.style.display = "block";
        cargarSolicitudes();
    };
    span.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

async function cargarSolicitudes() {
    const container = document.getElementById('solicitudes-container');
    container.innerHTML = '<p>Cargando...</p>';
    const response = await fetch('/mentor/api/solicitudes-mentoria/', { headers: { 'Authorization': `Bearer ${token}` } });
    if (response.ok) {
        const estrategias = await response.json();
        container.innerHTML = estrategias.length === 0 ? '<p>No hay nuevas solicitudes de mentoría.</p>' :
            estrategias.map(e => `
                <div class="tarjeta-solicitud-interbank">
                  <div class="empresa-header">
                    <h3 class="empresa-nombre">${e.empresa_nombre}</h3>
                    <span class="empresa-ruc">RUC: ${e.empresa_ruc}</span>
                  </div>
                  <div class="empresa-contacto">
                    <div class="contacto-item">
                      <i class="icon-mail">✉</i>
                      <span>${e.empresa_correo || 'No especificado'}</span>
                    </div>
                    <div class="contacto-item">
                      <i class="icon-phone">📞</i>
                      <span>${e.empresa_telefono || 'No especificado'}</span>
                    </div>
                  </div>
                  <div class="estrategia-info">
                    <h4 class="estrategia-titulo">${e.titulo}</h4>
                    <p class="estrategia-descripcion">${e.descripcion}</p>
                    <div class="estrategia-meta">
                      <span class="categoria-badge">${e.categoria}</span>
                      <span class="fecha-solicitud">Solicitado: ${new Date(e.fecha_solicitud_mentoria).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  <button class="btn btn-aceptar-interbank" onclick="aceptarMentoriaEstrategia(${e.id})">
                    <i class="icon-check">✓</i>
                    Aceptar Mentoría
                  </button>
                </div>
            `).join('');
    } else {
        container.innerHTML = `<p>Error al cargar las solicitudes.</p>`;
    }
}

async function aceptarMentoriaEstrategia(estrategiaId) {
    if (!confirm('¿Estás seguro de que deseas aceptar la mentoría de esta estrategia?')) return;
    
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="icon-loading">⏳</i> Aceptando...';
    
    try {
        const response = await fetch(`/mentor/api/aceptar-mentoria/${estrategiaId}/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            // Mostrar mensaje de éxito
            mostrarNotificacion('✅ ' + (data.mensaje || '¡Mentoría aceptada exitosamente!'), 'success');
            
            // Cerrar modal si existe
            const modal = document.getElementById('solicitudesModal');
            if (modal) {
                modal.style.display = "none";
            }
            
            // Recargar empresas asignadas
            await cargarEmpresasAsignadas();
            
        } else {
            throw new Error(data.error || 'Error al aceptar la mentoría');
        }
    } catch (error) {
        mostrarNotificacion('❌ Error: ' + error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Función para mostrar notificaciones elegantes
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${tipo}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${mensaje}</span>
            <button onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Agregar estilos si no existen
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease;
            }
            .notification-success {
                background: linear-gradient(135deg, #00953b, #02bb59);
                color: white;
            }
            .notification-error {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                color: white;
            }
            .notification-content {
                padding: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .notification button {
                background: none;
                border: none;
                color: inherit;
                font-size: 1.5rem;
                cursor: pointer;
                opacity: 0.7;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

async function aceptarMentoria(empresaId) {
    // Esta función está obsoleta - mantenerla para compatibilidad
    alert('Esta funcionalidad ha sido reemplazada por el nuevo sistema de mentoría por estrategias.');
}

// --- LÓGICA DE GESTIÓN DE EMPRESAS (TU CÓDIGO ORIGINAL) ---

async function cargarEmpresasAsignadas() {
    const container = document.getElementById('empresas-tarjetas-container');
    container.innerHTML = '<div class="loading-spinner-simple">⏳ Cargando empresas...</div>';
    
    try {
        const res = await fetch('/mentor/api/empresas/', { headers: { 'Authorization': 'Bearer ' + token } });
        if (res.ok) {
            const empresas = await res.json();
            container.innerHTML = empresas.length > 0 ?
                empresas.map(e => `
                    <div class="tarjeta-empresa-interbank" onclick="mostrarDetalleEmpresa(${e.id})">
                        <div class="empresa-header-card">
                            <h4 class="empresa-nombre-card">${e.razon_social}</h4>
                            <span class="empresa-estado ${e.estado?.toLowerCase() || 'activo'}">${e.estado || 'Activo'}</span>
                        </div>
                        <div class="empresa-info-card">
                            <div class="info-item">
                                <i class="icon">🏷️</i>
                                <span>RUC: ${e.ruc}</span>
                            </div>
                            <div class="info-item">
                                <i class="icon">✉</i>
                                <span>${e.correo || 'Sin correo'}</span>
                            </div>
                            <div class="info-item">
                                <i class="icon">📞</i>
                                <span>${e.telefono || 'Sin teléfono'}</span>
                            </div>
                        </div>
                        <div class="empresa-actions">
                            <button class="btn-gestionar" onclick="event.stopPropagation(); mostrarEstrategiasEmpresa(${e.id})">
                                <i class="icon">📊</i>
                                Gestionar Estrategias
                            </button>
                        </div>
                    </div>
                `).join('') : `
                    <div class="empty-state-empresas">
                        <div class="empty-icon">🏢</div>
                        <h3>No tienes empresas asignadas</h3>
                        <p>Acepta solicitudes de mentoría para comenzar a gestionar empresas.</p>
                        <button class="btn-solicitudes" onclick="document.getElementById('verSolicitudesBtn').click()">
                            Ver Solicitudes
                        </button>
                    </div>
                `;
        } else {
            throw new Error('Error al cargar empresas');
        }
    } catch (error) {
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>Error al cargar empresas</h3>
                <p>${error.message}</p>
                <button onclick="cargarEmpresasAsignadas()">Reintentar</button>
            </div>
        `;
    }
}

// Función para mostrar estrategias de una empresa específica
async function mostrarEstrategiasEmpresa(empresaId) {
    try {
        // Ocultar la lista de empresas
        document.getElementById('empresas-tarjetas-container').style.display = 'none';
        
        // Mostrar loading
        let estrategiasPanel = document.getElementById('panel-estrategias-empresa');
        if (!estrategiasPanel) {
            // Crear el panel si no existe
            estrategiasPanel = document.createElement('div');
            estrategiasPanel.id = 'panel-estrategias-empresa';
            estrategiasPanel.style.display = 'none';
            document.querySelector('.main-content').appendChild(estrategiasPanel);
        }
        
        estrategiasPanel.style.display = 'block';
        estrategiasPanel.innerHTML = '<div class="loading-spinner-simple">⏳ Cargando estrategias...</div>';
        
        // Llamar a la API
        const response = await fetch(`/mentor/api/empresas/${empresaId}/estrategias/`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar estrategias');
        }
        
        const data = await response.json();
        
        // Renderizar las estrategias
        estrategiasPanel.innerHTML = `
            <div class="estrategias-mentor-container">
                <div class="estrategias-header">
                    <button onclick="volverAEmpresas()" class="btn-volver-interbank">
                        <i class="icon">←</i>
                        Volver a Empresas
                    </button>
                    <h2 class="empresa-titulo">${data.empresa.razon_social}</h2>
                    <div class="empresa-info-header">
                        <span class="info-badge">RUC: ${data.empresa.ruc}</span>
                        <span class="info-badge">✉ ${data.empresa.correo || 'Sin correo'}</span>
                        <span class="info-badge">📞 ${data.empresa.telefono || 'Sin teléfono'}</span>
                    </div>
                </div>
                
                <div class="estrategias-grid">
                    ${data.estrategias.map(estrategia => `
                        <div class="estrategia-card-mentor">
                            <div class="estrategia-header-mentor">
                                <h3>${estrategia.titulo}</h3>
                                <span class="categoria-badge-mentor">${estrategia.categoria || 'General'}</span>
                            </div>
                            <p class="estrategia-desc">${estrategia.descripcion}</p>
                            <div class="estrategia-meta">
                                <span class="fecha-asignacion">Asignado: ${new Date(estrategia.fecha_asignacion_mentor).toLocaleDateString('es-ES')}</span>
                                <button class="btn-gestionar-actividades" onclick="mostrarActividadesEstrategia(${estrategia.id}, '${estrategia.titulo}')">
                                    <i class="icon">📝</i>
                                    Gestionar Actividades
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Guardar datos para uso posterior
        window.currentEmpresaData = data;
        
    } catch (error) {
        mostrarNotificacion('❌ Error al cargar estrategias: ' + error.message, 'error');
        volverAEmpresas();
    }
}

// Función para volver a la vista de empresas
function volverAEmpresas() {
    document.getElementById('empresas-tarjetas-container').style.display = 'grid';
    const estrategiasPanel = document.getElementById('panel-estrategias-empresa');
    if (estrategiasPanel) {
        estrategiasPanel.style.display = 'none';
    }
    const actividadesPanel = document.getElementById('panel-actividades-estrategia');
    if (actividadesPanel) {
        actividadesPanel.style.display = 'none';
    }
}

// Función para mostrar actividades de una estrategia específica
function mostrarActividadesEstrategia(estrategiaId, estrategiaTitulo) {
    const estrategia = window.currentEmpresaData.estrategias.find(e => e.id === estrategiaId);
    if (!estrategia) {
        mostrarNotificacion('❌ Estrategia no encontrada', 'error');
        return;
    }
    
    // Ocultar panel de estrategias
    document.getElementById('panel-estrategias-empresa').style.display = 'none';
    
    // Crear o mostrar panel de actividades
    let actividadesPanel = document.getElementById('panel-actividades-estrategia');
    if (!actividadesPanel) {
        actividadesPanel = document.createElement('div');
        actividadesPanel.id = 'panel-actividades-estrategia';
        document.querySelector('.main-content').appendChild(actividadesPanel);
    }
    
    actividadesPanel.style.display = 'block';
    actividadesPanel.innerHTML = `
        <div class="actividades-mentor-container">
            <div class="actividades-header">
                <button onclick="volverAEstrategias()" class="btn-volver-interbank">
                    <i class="icon">←</i>
                    Volver a Estrategias
                </button>
                <h2 class="estrategia-titulo-actividades">${estrategiaTitulo}</h2>
                <p class="empresa-nombre-small">${window.currentEmpresaData.empresa.razon_social}</p>
            </div>
            
            <div class="etapas-actividades-container">
                ${estrategia.etapas.map(etapa => `
                    <div class="etapa-actividades-card">
                        <div class="etapa-header-actividades">
                            <h3>${etapa.titulo}</h3>
                            <span class="etapa-progreso">${etapa.actividades.filter(a => a.completada).length}/${etapa.actividades.length} completadas</span>
                        </div>
                        <p class="etapa-descripcion">${etapa.descripcion}</p>
                        
                        <div class="actividades-lista">
                            ${etapa.actividades.map(actividad => `
                                <div class="actividad-item-mentor ${actividad.completada ? 'completada' : ''}">
                                    <div class="actividad-checkbox-container">
                                        <input type="checkbox" 
                                               class="actividad-checkbox" 
                                               ${actividad.completada ? 'checked' : ''}
                                               onchange="toggleActividad(${actividad.id}, this.checked)">
                                    </div>
                                    <div class="actividad-content">
                                        <div class="actividad-descripcion" contenteditable="true" 
                                             onblur="updateActividadDescripcion(${actividad.id}, this.textContent)">${actividad.descripcion}</div>
                                        <div class="actividad-fecha">
                                            <label>Fecha límite:</label>
                                            <input type="date" value="${actividad.fecha_limite || ''}" 
                                                   onchange="updateActividadFecha(${actividad.id}, this.value)">
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Función para volver a la vista de estrategias
function volverAEstrategias() {
    document.getElementById('panel-estrategias-empresa').style.display = 'block';
    const actividadesPanel = document.getElementById('panel-actividades-estrategia');
    if (actividadesPanel) {
        actividadesPanel.style.display = 'none';
    }
}

// Función para toggle de actividad completada
async function toggleActividad(actividadId, completada) {
    try {
        const response = await fetch(`/mentor/api/actividad/${actividadId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completada: completada })
        });
        
        if (response.ok) {
            mostrarNotificacion(`✅ Actividad ${completada ? 'completada' : 'marcada como pendiente'}`, 'success');
        } else {
            throw new Error('Error al actualizar actividad');
        }
    } catch (error) {
        mostrarNotificacion('❌ Error al actualizar actividad: ' + error.message, 'error');
        // Revertir el checkbox
        event.target.checked = !completada;
    }
}

// Función para actualizar descripción de actividad
async function updateActividadDescripcion(actividadId, nuevaDescripcion) {
    try {
        const response = await fetch(`/mentor/api/actividad/${actividadId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ descripcion: nuevaDescripcion.trim() })
        });
        
        if (response.ok) {
            mostrarNotificacion('✅ Descripción actualizada', 'success');
        } else {
            throw new Error('Error al actualizar descripción');
        }
    } catch (error) {
        mostrarNotificacion('❌ Error al actualizar descripción: ' + error.message, 'error');
    }
}

// Función para actualizar fecha límite de actividad
async function updateActividadFecha(actividadId, nuevaFecha) {
    try {
        const response = await fetch(`/mentor/api/actividad/${actividadId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fecha_limite: nuevaFecha || null })
        });
        
        if (response.ok) {
            mostrarNotificacion('✅ Fecha límite actualizada', 'success');
        } else {
            throw new Error('Error al actualizar fecha');
        }
    } catch (error) {
        mostrarNotificacion('❌ Error al actualizar fecha: ' + error.message, 'error');
    }
}

async function mostrarDetalleEmpresa(empresaId) {
    empresaSeleccionadaId = empresaId;
    document.getElementById('empresas-tarjetas-container').style.display = 'none';
    document.getElementById('detalle-empresa-panel').style.display = 'block';
    const res = await fetch(`/mentor/api/empresas/${empresaId}/`, { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.ok) {
        const data = await res.json();
        document.getElementById('detalle-empresa-nombre').textContent = data.razon_social;
        document.getElementById('detalle-empresa-ruc').textContent = `RUC: ${data.ruc}`;
    }
}

function cerrarDetalleEmpresa() {
    document.getElementById('detalle-empresa-panel').style.display = 'none';
    document.getElementById('empresas-tarjetas-container').style.display = 'block';
    empresaSeleccionadaId = null;
}

function mostrarEstrategiasEmpresa() {
    document.getElementById('detalle-empresa-panel').style.display = 'none';
    document.getElementById('panel-estrategias-empresa').style.display = 'block';
    cargarEstrategiasEmpresa(empresaSeleccionadaId);
}

function cerrarPanelEstrategiasEmpresa() {
    document.getElementById('panel-estrategias-empresa').style.display = 'none';
    document.getElementById('detalle-empresa-panel').style.display = 'block';
}

async function cargarEstrategiasEmpresa(empresaId) {
    const container = document.getElementById('tabla-estrategias-container');
    const res = await fetch(`/mentor/api/empresas/${empresaId}/`, { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.ok) {
        const data = await res.json();
        document.getElementById('nombre-empresa-estrategias').textContent = data.razon_social;
        container.innerHTML = `
            <table class="tabla-mentor">
                <thead><tr><th>Título</th><th>Categoría</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${data.estrategias.map(est => `
                        <tr>
                            <td><input type="text" value="${est.titulo}" onchange="editarCampoEstrategia(${est.id}, 'titulo', this.value)"></td>
                            <td><input type="text" value="${est.categoria}" onchange="editarCampoEstrategia(${est.id}, 'categoria', this.value)"></td>
                            <td><input type="text" value="${est.estado}" onchange="editarCampoEstrategia(${est.id}, 'estado', this.value)"></td>
                            <td>
                                <button class="btn btn-secondary" onclick="guardarEstrategia(${est.id})">Guardar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    }
}

function editarCampoEstrategia(id, campo, valor) {
    if (!estrategiasEditadas[id]) estrategiasEditadas[id] = {};
    estrategiasEditadas[id][campo] = valor;
}

async function guardarEstrategia(id) {
    if (!estrategiasEditadas[id]) {
        alert("No hay cambios para guardar.");
        return;
    }
    const res = await fetch(`/mentor/api/empresas/${empresaSeleccionadaId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ estrategias: [{ id, ...estrategiasEditadas[id] }] })
    });
    if (res.ok) {
        alert('Estrategia guardada con éxito.');
        delete estrategiasEditadas[id];
    } else {
        alert('Error al guardar la estrategia.');
    }
}