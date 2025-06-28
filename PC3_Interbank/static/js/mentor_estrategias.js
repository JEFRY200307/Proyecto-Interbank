// ==========================================
// 🎯 MENTOR_ESTRATEGIAS.JS - GESTIÓN COMPLETA DE ESTRATEGIAS DEL MENTOR
// ==========================================
// Este archivo maneja toda la funcionalidad del dashboard de estrategias para mentores:
// - Visualización de estrategias aceptadas
// - Edición de roadmaps (etapas y actividades)
// - Gestión de fechas y estados
// - Comunicación con APIs usando JWT

// ==========================================
// === INICIALIZACIÓN ===
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    initMentorEstrategias();
});

// === VARIABLES GLOBALES ===
let estrategiaActual = null; // Estrategia seleccionada actualmente
let etapaActual = null;      // Etapa en edición
let actividadActual = null;  // Actividad en edición

/**
 * 🚀 FUNCIÓN PRINCIPAL: Inicializa el sistema de gestión de estrategias
 */
function initMentorEstrategias() {
    cargarEstrategiasDelMentor(); // Cargar estrategias del mentor desde API
    setupEventListeners();       // Configurar event listeners
}

/**
 * 🎛️ FUNCIÓN: Configura todos los event listeners principales
 */
function setupEventListeners() {
    // === BOTONES DE NAVEGACIÓN ===
    document.getElementById('volver-empresas')?.addEventListener('click', () => {
        window.location.href = '/mentor/dashboard/'; // Volver al dashboard principal
    });

    document.getElementById('refresh-estrategias')?.addEventListener('click', () => {
        cargarEstrategiasDelMentor(); // Recargar estrategias
    });

    document.getElementById('volver-lista')?.addEventListener('click', () => {
        mostrarListaEstrategias(); // Volver a la lista de estrategias
    });

    // === CONFIGURAR MODALES ===
    setupModalEventListeners();
}

/**
 * 🏗️ FUNCIÓN: Configura event listeners específicos de modales
 */
function setupModalEventListeners() {
    // === MODAL DE EDICIÓN DE ESTRATEGIA ===
    const modalEstrategia = document.getElementById('modal-editar-estrategia');
    const closeButtons = modalEstrategia.querySelectorAll('.close-button, #cancelar-edicion');
    
    // Botones para cerrar modal
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => cerrarModal('modal-editar-estrategia'));
    });

    // Botón para abrir modal de edición
    document.getElementById('editar-estrategia')?.addEventListener('click', () => {
        if (estrategiaActual) {
            abrirModalEditarEstrategia(estrategiaActual);
        }
    });

    // Botón para guardar cambios de estrategia
    document.getElementById('guardar-estrategia')?.addEventListener('click', guardarEstrategia);

    // === MODAL DE EDICIÓN DE ETAPA ===
    const modalEtapa = document.getElementById('modal-editar-etapa');
    const closeButtonsEtapa = modalEtapa.querySelectorAll('.close-button, #cancelar-edicion-etapa');
    closeButtonsEtapa.forEach(btn => {
        btn.addEventListener('click', () => cerrarModal('modal-editar-etapa'));
    });

    document.getElementById('guardar-etapa')?.addEventListener('click', guardarEtapa);

    // === MODAL DE EDICIÓN DE ACTIVIDAD ===
    const modalActividad = document.getElementById('modal-editar-actividad');
    const closeButtonsActividad = modalActividad.querySelectorAll('.close-button, #cancelar-edicion-actividad');
    closeButtonsActividad.forEach(btn => {
        btn.addEventListener('click', () => cerrarModal('modal-editar-actividad'));
    });

    document.getElementById('guardar-actividad')?.addEventListener('click', guardarActividad);
}

// ==========================================
// === FUNCIONES DE CARGA DE DATOS ===
// ==========================================

/**
 * 🔄 FUNCIÓN PRINCIPAL: Carga las estrategias asignadas al mentor actual
 * Solo muestra estrategias en estado "aceptada" que el mentor puede editar
 */
async function cargarEstrategiasDelMentor() {
    try {
        // === MOSTRAR INDICADOR DE CARGA ===
        mostrarSpinner(true);
        
        // === OBTENER TOKEN JWT ===
        const token = localStorage.getItem('access_token');
        
        // === HACER PETICIÓN A LA API ===
        const response = await fetch('/mentor/api/mis-estrategias/', {
            headers: {
                'Authorization': 'Bearer ' + token, // 🔐 Autenticación JWT
                'Content-Type': 'application/json'
            }
        });
        
        // === VALIDAR RESPUESTA ===
        if (!response.ok) {
            throw new Error(`Error al cargar estrategias: ${response.status}`);
        }

        // === PROCESAR DATOS ===
        const estrategias = await response.json();
        console.log('📊 Estrategias cargadas:', estrategias); // Debug log
        
        // === ACTUALIZAR INTERFAZ ===
        mostrarEstrategias(estrategias);     // Renderizar tarjetas de estrategias
        actualizarEstadisticas(estrategias); // Actualizar contadores
        
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarNotificacion('Error al cargar las estrategias', 'error');
    } finally {
        mostrarSpinner(false); // Ocultar indicador de carga
    }
}

/**
 * 🎨 FUNCIÓN: Renderiza las estrategias en la interfaz
 * @param {Array} estrategias - Lista de estrategias del mentor
 */
function mostrarEstrategias(estrategias) {
    const container = document.getElementById('estrategias-container');
    
    // === ESTADO VACÍO ===
    if (estrategias.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks fa-3x"></i>
                <h3>No tienes estrategias asignadas</h3>
                <p>Cuando aceptes solicitudes de mentoría, aparecerán aquí.</p>
                <button onclick="window.location.href='/mentor/dashboard/solicitudes/'" class="btn btn-primary">
                    Ver Solicitudes
                </button>
            </div>
        `;
        return;
    }

    // === RENDERIZAR TARJETAS DE ESTRATEGIAS ===
    const estrategiasHTML = estrategias.map(estrategia => `
        <div class="estrategia-card" onclick="verDetalleEstrategia(${estrategia.id})">
            <div class="estrategia-header">
                <div class="estrategia-title">
                    <h3>${estrategia.titulo}</h3>
                    <span class="estado-badge estado-${estrategia.estado}">${getEstadoLabel(estrategia.estado)}</span>
                </div>
                <div class="estrategia-empresa">
                    <div class="empresa-info">
                        <div class="empresa-nombre">
                            <i class="fas fa-building"></i>
                            ${estrategia.empresa.razon_social}
                        </div>
                        <div class="empresa-contacto">
                            <i class="fas fa-envelope"></i>
                            <a href="mailto:${estrategia.empresa.correo}" class="empresa-email">
                                ${estrategia.empresa.correo}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="estrategia-info">
                <div class="info-item">
                    <i class="fas fa-tag"></i>
                    <span>${estrategia.categoria || 'Sin categoría'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>Asignado: ${formatearFecha(estrategia.fecha_asignacion_mentor)}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-list"></i>
                    <span>${estrategia.total_etapas} etapas, ${estrategia.total_actividades} actividades</span>
                </div>
            </div>
            
            <div class="progreso-section">
                <div class="progreso-info">
                    <span>Progreso: ${estrategia.progreso}%</span>
                    <span>${estrategia.actividades_completadas}/${estrategia.total_actividades} completadas</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${estrategia.progreso}%"></div>
                </div>
            </div>
            
            <div class="estrategia-actions">
                <button onclick="event.stopPropagation(); verDetalleEstrategia(${estrategia.id})" class="btn btn-primary btn-sm">
                    <i class="fas fa-eye"></i> Ver Detalle
                </button>
                <button onclick="event.stopPropagation(); editarEstrategiaRapido(${estrategia.id})" class="btn btn-secondary btn-sm">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = estrategiasHTML;
}

function actualizarEstadisticas(estrategias) {
    const totalEstrategias = estrategias.length;
    const progresoPromedio = estrategias.length > 0 
        ? (estrategias.reduce((sum, e) => sum + e.progreso, 0) / estrategias.length).toFixed(1)
        : 0;
    const empresasUnicas = new Set(estrategias.map(e => e.empresa.id)).size;
    const actividadesCompletadas = estrategias.reduce((sum, e) => sum + e.actividades_completadas, 0);

    document.getElementById('total-estrategias').textContent = totalEstrategias;
    document.getElementById('progreso-promedio').textContent = `${progresoPromedio}%`;
    document.getElementById('total-empresas').textContent = empresasUnicas;
    document.getElementById('actividades-completadas').textContent = actividadesCompletadas;
}

async function verDetalleEstrategia(estrategiaId) {
    try {
        mostrarSpinner(true);
        const token = localStorage.getItem('access_token');
        
        const response = await fetch(`/mentor/api/estrategia/${estrategiaId}/`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar detalles de la estrategia');
        }

        const estrategia = await response.json();
        estrategiaActual = estrategia;
        mostrarDetalleEstrategia(estrategia);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los detalles', 'error');
    } finally {
        mostrarSpinner(false);
    }
}

function mostrarDetalleEstrategia(estrategia) {
    // Ocultar lista y mostrar detalle
    document.getElementById('estrategias-container').style.display = 'none';
    document.querySelector('.estadisticas-header').style.display = 'none';
    document.getElementById('estrategia-detalle').style.display = 'block';

    // Llenar información básica
    document.getElementById('detalle-titulo').textContent = estrategia.titulo;
    document.getElementById('detalle-empresa').textContent = estrategia.empresa.razon_social;
    document.getElementById('detalle-categoria').textContent = estrategia.categoria || 'Sin categoría';
    document.getElementById('detalle-estado').textContent = getEstadoLabel(estrategia.estado);
    document.getElementById('detalle-estado').className = `estado-badge estado-${estrategia.estado}`;
    document.getElementById('detalle-progreso-text').textContent = `${estrategia.progreso}%`;
    document.getElementById('detalle-progreso-bar').style.width = `${estrategia.progreso}%`;
    document.getElementById('detalle-fecha-inicio').textContent = formatearFecha(estrategia.fecha_inicio);
    document.getElementById('detalle-fecha-fin').textContent = formatearFecha(estrategia.fecha_fin);
    document.getElementById('detalle-descripcion').textContent = estrategia.descripcion || 'Sin descripción';

    // Debug: verificar datos de etapas que llegan
    console.log('🔍 Estrategia completa recibida:', estrategia);
    console.log('🔍 Etapas que van a mostrarEtapasYActividades:', estrategia.etapas);

    // Mostrar etapas y actividades
    mostrarEtapasYActividades(estrategia.etapas);
}

function mostrarEtapasYActividades(etapas) {
    const container = document.getElementById('etapas-container');
    
    // Verificación adicional de datos
    console.log('🔍 mostrarEtapasYActividades llamada con:', etapas);
    console.log('🔍 Tipo de etapas:', typeof etapas, 'Array:', Array.isArray(etapas));
    
    if (!etapas || !Array.isArray(etapas) || etapas.length === 0) {
        console.log('⚠️ No hay etapas válidas para mostrar');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list-alt fa-2x"></i>
                <h4>Esta estrategia no tiene etapas definidas</h4>
            </div>
        `;
        return;
    }

    // === RENDERIZAR CADA ETAPA ===
    const etapasHTML = etapas.map((etapa, index) => {
        // === DEBUG: MOSTRAR DATOS DE CADA ETAPA ===
        console.log(`🔍 Debug Etapa ${index + 1}:`, {
            id: etapa.id,
            titulo: etapa.titulo,
            nombre: etapa.nombre,
            descripcion: etapa.descripcion,
            titulo_type: typeof etapa.titulo,
            nombre_type: typeof etapa.nombre
        });
        
        // === LÓGICA CRÍTICA: DETERMINAR NOMBRE CORRECTO DE LA ETAPA ===
        // IMPORTANTE: En el sistema, hay una inconsistencia en los campos:
        // - `titulo` a veces contiene "Etapa sin nombre" (valor por defecto)
        // - `nombre` a veces contiene el valor real como "Mejorar Historial Crediticio"
        // Por eso usamos `nombreLimpio` PRIMERO
        
        const titulo = etapa.titulo || '';     // Campo titulo (puede ser genérico)
        const nombre = etapa.nombre || '';     // Campo nombre (puede tener valor real)
        const descripcion = etapa.descripcion || '';
        
        // === LIMPIAR STRINGS ===
        const tituloLimpio = titulo.toString().trim();   // Limpiar espacios
        const nombreLimpio = nombre.toString().trim();   // Limpiar espacios
        
        // 🎯 CORRECCIÓN APLICADA: Usar nombreLimpio PRIMERO
        // Orden de prioridad: nombreLimpio → tituloLimpio → fallback
        const nombreFinal = nombreLimpio || tituloLimpio || 'Etapa sin nombre';
        
        // === DEBUG LOGS PARA VERIFICACIÓN ===
        console.log(`🏷️ Etapa ${etapa.id}:`);
        console.log(`  - titulo original: "${titulo}" (tipo: ${typeof titulo})`);
        console.log(`  - nombre original: "${nombre}" (tipo: ${typeof nombre})`);
        console.log(`  - titulo limpio: "${tituloLimpio}" (len: ${tituloLimpio.length})`);
        console.log(`  - nombre limpio: "${nombreLimpio}" (len: ${nombreLimpio.length})`);
        console.log(`  - nombreFinal: "${nombreFinal}"`);

        // === RENDERIZAR ACTIVIDADES DE LA ETAPA ===
        const actividadesHTML = etapa.actividades.map(actividad => `
            <div class="actividad-item ${actividad.completada ? 'completada' : ''}">
                <div class="actividad-info">
                    <div class="actividad-checkbox">
                        <input type="checkbox" 
                               ${actividad.completada ? 'checked' : ''} 
                               onchange="toggleActividad(${actividad.id}, this.checked)">
                    </div>
                    <div class="actividad-content">
                        <div class="actividad-descripcion">${actividad.descripcion}</div>
                        ${actividad.fecha_limite ? `
                            <div class="actividad-fecha">
                                <i class="fas fa-calendar"></i>
                                Fecha límite: ${formatearFecha(actividad.fecha_limite)}
                            </div>
                        ` : ''}
                        ${actividad.notas_mentor ? `
                            <div class="actividad-notas">
                                <i class="fas fa-sticky-note"></i>
                                <strong>Notas:</strong> ${actividad.notas_mentor}
                            </div>
                        ` : ''}
                        ${actividad.fecha_completada ? `
                            <div class="actividad-completada-fecha">
                                <i class="fas fa-check-circle"></i>
                                Completada: ${formatearFecha(actividad.fecha_completada)}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="actividad-actions">
                    <button onclick="editarActividad(${actividad.id})" class="btn btn-sm btn-secondary">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // === CALCULAR PROGRESO DE LA ETAPA ===
        const actividadesCompletadas = etapa.actividades.filter(a => a.completada).length;
        const progresoEtapa = etapa.actividades.length > 0 
            ? (actividadesCompletadas / etapa.actividades.length * 100)
            : 0;

        // === RETORNAR HTML COMPLETO DE LA ETAPA ===
        return `
            <div class="etapa-card">
                <div class="etapa-header">
                    <div class="etapa-info">
                        <h4>${nombreFinal}</h4>
                        <p>${etapa.descripcion || 'Sin descripción'}</p>
                    </div>
                    <div class="etapa-actions">
                        <span class="etapa-progreso">${Math.round(progresoEtapa)}%</span>
                        <button onclick="editarEtapa(${etapa.id})" class="btn btn-sm btn-secondary">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
                <div class="actividades-container">
                    ${actividadesHTML}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = etapasHTML;
}

function mostrarListaEstrategias() {
    document.getElementById('estrategia-detalle').style.display = 'none';
    document.getElementById('estrategias-container').style.display = 'block';
    document.querySelector('.estadisticas-header').style.display = 'flex';
    estrategiaActual = null;
}

// Funciones de edición
function abrirModalEditarEstrategia(estrategia) {
    document.getElementById('edit-descripcion').value = estrategia.descripcion || '';
    document.getElementById('edit-fecha-fin').value = estrategia.fecha_fin || '';
    document.getElementById('edit-estado').value = estrategia.estado || 'pendiente';
    
    abrirModal('modal-editar-estrategia');
}

function editarEtapa(etapaId) {
    const etapa = estrategiaActual.etapas.find(e => e.id === etapaId);
    if (!etapa) return;

    etapaActual = etapa;
    document.getElementById('edit-etapa-titulo').value = etapa.titulo || '';
    document.getElementById('edit-etapa-descripcion').value = etapa.descripcion || '';
    
    abrirModal('modal-editar-etapa');
}

function editarActividad(actividadId) {
    let actividad = null;
    for (const etapa of estrategiaActual.etapas) {
        actividad = etapa.actividades.find(a => a.id === actividadId);
        if (actividad) break;
    }
    
    if (!actividad) return;

    actividadActual = actividad;
    document.getElementById('edit-actividad-descripcion').value = actividad.descripcion || '';
    document.getElementById('edit-actividad-fecha-limite').value = actividad.fecha_limite || '';
    document.getElementById('edit-actividad-notas').value = actividad.notas_mentor || '';
    document.getElementById('edit-actividad-completada').checked = actividad.completada || false;
    
    abrirModal('modal-editar-actividad');
}

function editarEstrategiaRapido(estrategiaId) {
    // Cargar la estrategia y abrir el modal de edición
    verDetalleEstrategia(estrategiaId).then(() => {
        // Una vez cargada la estrategia, abrir el modal de edición
        abrirModalEditarEstrategia();
    });
}

async function guardarEstrategia() {
    try {
        const formData = new FormData(document.getElementById('form-editar-estrategia'));
        const data = Object.fromEntries(formData);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
            mostrarMensaje('Sesión expirada. Por favor inicia sesión nuevamente.', 'error');
            window.location.href = '/login/';
            return;
        }

        const response = await fetch(`/mentor/api/estrategia/${estrategiaActual.id}/`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            mostrarNotificacion('Estrategia actualizada correctamente', 'success');
            cerrarModal('modal-editar-estrategia');
            verDetalleEstrategia(estrategiaActual.id); // Recargar
        } else {
            throw new Error('Error al guardar');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al guardar la estrategia', 'error');
    }
}

async function guardarEtapa() {
    try {
        const formData = new FormData(document.getElementById('form-editar-etapa'));
        const data = Object.fromEntries(formData);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
            mostrarMensaje('Sesión expirada. Por favor inicia sesión nuevamente.', 'error');
            window.location.href = '/login/';
            return;
        }

        const response = await fetch(`/mentor/api/etapa/${etapaActual.id}/`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            mostrarNotificacion('Etapa actualizada correctamente', 'success');
            cerrarModal('modal-editar-etapa');
            verDetalleEstrategia(estrategiaActual.id); // Recargar
        } else {
            throw new Error('Error al guardar');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al guardar la etapa', 'error');
    }
}

async function guardarActividad() {
    try {
        const formData = new FormData(document.getElementById('form-editar-actividad'));
        const data = Object.fromEntries(formData);
        data.completada = document.getElementById('edit-actividad-completada').checked;
        
        const token = localStorage.getItem('access_token');
        if (!token) {
            mostrarMensaje('Sesión expirada. Por favor inicia sesión nuevamente.', 'error');
            window.location.href = '/login/';
            return;
        }

        const response = await fetch(`/mentor/api/actividad/${actividadActual.id}/`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            mostrarNotificacion('Actividad actualizada correctamente', 'success');
            cerrarModal('modal-editar-actividad');
            verDetalleEstrategia(estrategiaActual.id); // Recargar
        } else {
            throw new Error('Error al guardar');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al guardar la actividad', 'error');
    }
}

async function toggleActividad(actividadId, completada) {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            mostrarMensaje('Sesión expirada. Por favor inicia sesión nuevamente.', 'error');
            window.location.href = '/login/';
            return;
        }
        
        const response = await fetch(`/mentor/api/actividad/${actividadId}/`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ completada })
        });

        if (response.ok) {
            mostrarNotificacion(
                completada ? 'Actividad marcada como completada' : 'Actividad marcada como pendiente', 
                'success'
            );
            verDetalleEstrategia(estrategiaActual.id); // Recargar para actualizar progreso
        } else {
            throw new Error('Error al actualizar');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al actualizar la actividad', 'error');
    }
}

// Funciones utilitarias
function getEstadoLabel(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'en_progreso': 'En Progreso',
        'completada': 'Completada'
    };
    return estados[estado] || estado;
}

function formatearFecha(fecha) {
    if (!fecha) return 'No definida';
    return new Date(fecha).toLocaleDateString('es-ES');
}

function mostrarSpinner(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

function abrirModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear notificación toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Mostrar y ocultar automáticamente
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}
