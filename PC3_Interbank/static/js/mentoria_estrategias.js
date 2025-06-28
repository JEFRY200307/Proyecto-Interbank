// mentoria_estrategias.js - Frontend para gestión de mentoría por estrategias

document.addEventListener('DOMContentLoaded', function() {
    initMentoriaEstrategias();
});

function initMentoriaEstrategias() {
    // Cargar especialidades disponibles
    cargarEspecialidades();
    
    // Event listeners para botones de mentoría
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-solicitar-mentoria')) {
            const estrategiaId = e.target.dataset.estrategiaId;
            mostrarModalSolicitarMentoria(estrategiaId);
        }
        
        if (e.target.classList.contains('btn-cancelar-mentoria')) {
            const estrategiaId = e.target.dataset.estrategiaId;
            cancelarSolicitudMentoria(estrategiaId);
        }
        
        if (e.target.classList.contains('btn-aceptar-mentoria-estrategia')) {
            const estrategiaId = e.target.dataset.estrategiaId;
            aceptarMentoriaEstrategia(estrategiaId);
        }
    });
}

// Especialidades disponibles
const ESPECIALIDADES = {
    'marketing': 'Marketing Digital',
    'finanzas': 'Finanzas y Contabilidad',
    'recursos_humanos': 'Recursos Humanos',
    'operaciones': 'Operaciones y Logística',
    'tecnologia': 'Tecnología e Innovación',
    'ventas': 'Ventas y Comercialización',
    'legal': 'Legal y Compliance',
    'estrategia': 'Estrategia Empresarial',
    'liderazgo': 'Liderazgo y Gestión',
    'internacional': 'Comercio Internacional'
};

// Funciones específicas para empresas
async function cargarEstrategiasEmpresa() {
    try {
        // Usar la nueva API que incluye información de mentoría
        const response = await fetch('/empresas/api/estrategias-con-mentoria/');
        const data = await response.json();
        
        if (response.ok) {
            renderizarEstrategiasEmpresa(data.estrategias);
            mostrarEstadisticasMentoria(data.estadisticas);
        } else {
            mostrarMensaje('Error al cargar estrategias', 'error');
        }
    } catch (error) {
        mostrarMensaje('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

function mostrarEstadisticasMentoria(estadisticas) {
    const statsContainer = document.getElementById('estadisticasMentoria');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>${estadisticas.total}</h4>
                    <p>Total Estrategias</p>
                </div>
                <div class="stat-card success">
                    <h4>${estadisticas.con_mentor}</h4>
                    <p>Con Mentor</p>
                </div>
                <div class="stat-card warning">
                    <h4>${estadisticas.solicitando_mentoria}</h4>
                    <p>Buscando Mentor</p>
                </div>
                <div class="stat-card neutral">
                    <h4>${estadisticas.sin_mentoria}</h4>
                    <p>Sin Mentoría</p>
                </div>
            </div>
        `;
    }
}

function renderizarEstrategiasEmpresa(estrategias) {
    const container = document.getElementById('estrategiasEmpresaContainer');
    
    if (estrategias.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <h4>📝 ¡Comienza creando tu primera estrategia!</h4>
                <p>Las estrategias te ayudan a organizar tus objetivos empresariales y conseguir mentoría especializada</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = estrategias.map(estrategia => {
        return crearCardEstrategia(estrategia);
    }).join('');
}

function crearCardEstrategia(estrategia) {
    const estadoMentoria = estrategia.estado_mentoria;
    const puedesSolicitar = estrategia.puede_solicitar_mentoria;
    const puedesCancelar = estrategia.puede_cancelar_solicitud;
    
    let botonesAccion = '';
    let infoMentor = '';
    
    // Configurar botones según el estado
    if (estadoMentoria.codigo === 'CON_MENTOR') {
        botonesAccion = `
            <button class="btn btn-info" onclick="chatConMentor(${estrategia.id})">
                💬 Chat con Mentor
            </button>
            <button class="btn btn-secondary" onclick="verPerfilMentor(${estrategia.mentor_asignado})">
                👨‍💼 Ver Mentor
            </button>
        `;
        infoMentor = `
            <div class="mentor-info-section">
                <p><strong>Mentor:</strong> ${estrategia.mentor_asignado_nombre}</p>
                <p><strong>Especialidad:</strong> ${estrategia.mentor_especialidad || 'No especificada'}</p>
                <p><strong>Asignado:</strong> ${new Date(estrategia.fecha_asignacion_mentor).toLocaleDateString()}</p>
            </div>
        `;
    } else if (estadoMentoria.codigo === 'SOLICITANDO') {
        botonesAccion = `
            <button class="btn btn-danger btn-cancelar-mentoria" data-estrategia-id="${estrategia.id}">
                ❌ Cancelar Solicitud
            </button>
        `;
    } else if (puedesSolicitar) {
        botonesAccion = `
            <button class="btn btn-primary btn-solicitar-mentoria" data-estrategia-id="${estrategia.id}">
                👨‍💼 Solicitar Mentoría
            </button>
        `;
    }
    
    return `
        <div class="estrategia-card" data-estrategia-id="${estrategia.id}">
            <div class="estrategia-header">
                <h4>${estrategia.titulo}</h4>
                <div class="estrategia-badges">
                    <span class="categoria-badge">${estrategia.categoria || 'Sin categoría'}</span>
                    <span class="estado-mentoria ${estadoMentoria.codigo.toLowerCase()}">${estadoMentoria.descripcion}</span>
                </div>
            </div>
            <div class="estrategia-info">
                <p><strong>Estado:</strong> ${estrategia.estado}</p>
                <p><strong>Fecha límite:</strong> ${estrategia.fecha_cumplimiento || 'Sin fecha'}</p>
                <p><strong>Descripción:</strong> ${estrategia.descripcion}</p>
                ${infoMentor}
                ${estadoMentoria.codigo === 'SOLICITANDO' ? `
                    <div class="solicitud-info">
                        <p><strong>Especialidad buscada:</strong> ${ESPECIALIDADES[estadoMentoria.especialidad] || estadoMentoria.especialidad}</p>
                        <p><strong>Solicitado:</strong> ${new Date(estadoMentoria.fecha_solicitud).toLocaleDateString()}</p>
                    </div>
                ` : ''}
            </div>
            <div class="estrategia-actions">
                <button class="btn btn-secondary" onclick="verDetalleEstrategia(${estrategia.id})">
                    📊 Ver Detalle
                </button>
                ${botonesAccion}
            </div>
        </div>
    `;
}

function cargarEspecialidades() {
    const selectores = document.querySelectorAll('.especialidad-select');
    selectores.forEach(select => {
        Object.entries(ESPECIALIDADES).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value;
            select.appendChild(option);
        });
    });
}

function mostrarModalSolicitarMentoria(estrategiaId) {
    const modal = document.getElementById('modalSolicitarMentoria') || crearModalSolicitarMentoria();
    
    // Limpiar formulario
    document.getElementById('estrategiaIdInput').value = estrategiaId;
    document.getElementById('especialidadSelect').value = '';
    
    // Mostrar modal
    modal.style.display = 'block';
}

function crearModalSolicitarMentoria() {
    const modalHTML = `
        <div id="modalSolicitarMentoria" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Solicitar Mentoría para Estrategia</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="formSolicitarMentoria">
                        <input type="hidden" id="estrategiaIdInput" />
                        
                        <div class="form-group">
                            <label for="especialidadSelect">Especialidad Requerida:</label>
                            <select id="especialidadSelect" class="especialidad-select" required>
                                <option value="">Selecciona una especialidad</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="comentariosTextarea">Comentarios adicionales (opcional):</label>
                            <textarea id="comentariosTextarea" rows="4" placeholder="Describe qué tipo de ayuda específica necesitas..."></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Solicitar Mentoría</button>
                            <button type="button" class="btn btn-secondary" onclick="cerrarModal('modalSolicitarMentoria')">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('modalSolicitarMentoria');
    
    // Event listeners del modal
    modal.querySelector('.close').onclick = () => cerrarModal('modalSolicitarMentoria');
    modal.querySelector('#formSolicitarMentoria').onsubmit = enviarSolicitudMentoria;
    
    // Cargar especialidades
    cargarEspecialidades();
    
    return modal;
}

async function enviarSolicitudMentoria(e) {
    e.preventDefault();
    
    const estrategiaId = document.getElementById('estrategiaIdInput').value;
    const especialidad = document.getElementById('especialidadSelect').value;
    
    if (!especialidad) {
        mostrarMensaje('Por favor selecciona una especialidad', 'error');
        return;
    }
    
    try {
        const response = await fetch('/empresas/api/solicitar-mentoria-estrategia/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                estrategia_id: estrategiaId,
                especialidad_requerida: especialidad
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensaje('Solicitud de mentoría enviada correctamente', 'success');
            cerrarModal('modalSolicitarMentoria');
            actualizarEstadoEstrategia(estrategiaId, {
                solicita_mentoria: true,
                especialidad_requerida: especialidad
            });
        } else {
            mostrarMensaje(data.error || 'Error al enviar solicitud', 'error');
        }
    } catch (error) {
        mostrarMensaje('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

async function cancelarSolicitudMentoria(estrategiaId) {
    if (!confirm('¿Estás seguro de que deseas cancelar la solicitud de mentoría para esta estrategia?')) {
        return;
    }
    
    try {
        const response = await fetch('/empresas/api/solicitar-mentoria-estrategia/', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                estrategia_id: estrategiaId
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensaje('Solicitud de mentoría cancelada', 'success');
            actualizarEstadoEstrategia(estrategiaId, {
                solicita_mentoria: false,
                especialidad_requerida: null
            });
        } else {
            mostrarMensaje(data.error || 'Error al cancelar solicitud', 'error');
        }
    } catch (error) {
        mostrarMensaje('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

// Para mentores - aceptar mentoría de estrategia
async function aceptarMentoriaEstrategia(estrategiaId) {
    if (!confirm('¿Deseas aceptar la mentoría de esta estrategia?')) {
        return;
    }
    
    try {
        const response = await fetch(`/mentor/api/estrategias/${estrategiaId}/aceptar_mentoria/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensaje(`Mentoría aceptada para: ${data.estrategia}`, 'success');
            // Remover la estrategia de la lista de solicitudes
            const estrategiaCard = document.querySelector(`[data-estrategia-id="${estrategiaId}"]`);
            if (estrategiaCard) {
                estrategiaCard.remove();
            }
        } else {
            mostrarMensaje(data.error || 'Error al aceptar mentoría', 'error');
        }
    } catch (error) {
        mostrarMensaje('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

// Cargar estrategias que solicitan mentoría (para mentores)
async function cargarEstrategiasSolicitanMentoria() {
    try {
        const response = await fetch('/mentor/api/estrategias-solicitan/');
        const data = await response.json();
        
        if (response.ok) {
            renderizarEstrategiasSolicitudes(data.estrategias);
            document.getElementById('especialidadMentor').textContent = 
                data.especialidad_mentor ? ESPECIALIDADES[data.especialidad_mentor] : 'Todas las especialidades';
        } else {
            mostrarMensaje('Error al cargar solicitudes', 'error');
        }
    } catch (error) {
        mostrarMensaje('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

function renderizarEstrategiasSolicitudes(estrategias) {
    const container = document.getElementById('estrategiasSolicitudesContainer');
    
    if (estrategias.length === 0) {
        container.innerHTML = '<div class="no-data">No hay estrategias solicitando mentoría en tu especialidad</div>';
        return;
    }
    
    container.innerHTML = estrategias.map(estrategia => `
        <div class="estrategia-card" data-estrategia-id="${estrategia.id}">
            <div class="estrategia-header">
                <h4>${estrategia.titulo}</h4>
                <span class="especialidad-badge">${ESPECIALIDADES[estrategia.especialidad_requerida]}</span>
            </div>
            <div class="estrategia-info">
                <p><strong>Empresa:</strong> ${estrategia.empresa.razon_social}</p>
                <p><strong>Categoría:</strong> ${estrategia.categoria || 'No especificada'}</p>
                <p><strong>Solicitado:</strong> ${new Date(estrategia.fecha_solicitud).toLocaleDateString()}</p>
                <p><strong>Descripción:</strong> ${estrategia.descripcion}</p>
            </div>
            <div class="estrategia-actions">
                <button class="btn btn-primary btn-aceptar-mentoria-estrategia" data-estrategia-id="${estrategia.id}">
                    Aceptar Mentoría
                </button>
                <button class="btn btn-secondary" onclick="verDetalleEstrategia(${estrategia.id})">
                    Ver Detalle
                </button>
            </div>
        </div>
    `).join('');
}

function actualizarEstadoEstrategia(estrategiaId, nuevoEstado) {
    const estrategiaCard = document.querySelector(`[data-estrategia-id="${estrategiaId}"]`);
    if (!estrategiaCard) return;
    
    // Actualizar botones según el estado
    const btnSolicitar = estrategiaCard.querySelector('.btn-solicitar-mentoria');
    const btnCancelar = estrategiaCard.querySelector('.btn-cancelar-mentoria');
    const estadoSpan = estrategiaCard.querySelector('.estado-mentoria');
    
    if (nuevoEstado.solicita_mentoria) {
        if (btnSolicitar) btnSolicitar.style.display = 'none';
        if (btnCancelar) btnCancelar.style.display = 'inline-block';
        if (estadoSpan) {
            estadoSpan.textContent = `Solicitando mentoría en ${ESPECIALIDADES[nuevoEstado.especialidad_requerida]}`;
            estadoSpan.className = 'estado-mentoria pendiente';
        }
    } else {
        if (btnSolicitar) btnSolicitar.style.display = 'inline-block';
        if (btnCancelar) btnCancelar.style.display = 'none';
        if (estadoSpan) {
            estadoSpan.textContent = 'Sin mentoría';
            estadoSpan.className = 'estado-mentoria sin-mentoria';
        }
    }
}

// Funciones auxiliares
function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function mostrarMensaje(mensaje, tipo) {
    // Implementar según tu sistema de notificaciones
    console.log(`${tipo}: ${mensaje}`);
    
    // Ejemplo simple con alert (puedes mejorar esto)
    if (tipo === 'error') {
        alert('Error: ' + mensaje);
    } else {
        alert(mensaje);
    }
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
           document.querySelector('meta[name=csrf-token]')?.content || '';
}

function verDetalleEstrategia(estrategiaId) {
    // Navegar al detalle de la estrategia
    window.location.href = `/empresas/api/estrategias/${estrategiaId}/`;
}

// Exportar funciones para uso global
window.cargarEstrategiasSolicitanMentoria = cargarEstrategiasSolicitanMentoria;
window.mostrarModalSolicitarMentoria = mostrarModalSolicitarMentoria;
window.cancelarSolicitudMentoria = cancelarSolicitudMentoria;
window.aceptarMentoriaEstrategia = aceptarMentoriaEstrategia;
