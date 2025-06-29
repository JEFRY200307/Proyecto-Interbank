document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Actividades.js UNIFICADO Y LIMPIO cargado correctamente');
    
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('No se encontró el token de acceso.');
        return;
    }

    // Inicializar checkboxes de actividades
    document.querySelectorAll('.completada-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const actividadCard = this.closest('.actividad-card');
            const actividadId = actividadCard.dataset.actividadId;
            const isCompleted = this.checked;

            actualizarEstadoActividad(actividadId, isCompleted, token, actividadCard);
        });
    });

    function actualizarEstadoActividad(id, completada, token, actividadCard) {
        fetch(`/api/actividades/${id}/actualizar/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                completada: completada
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al actualizar la actividad');
            }
            return response.json();
        })
        .then(data => {
            // Actualizar la clase completed para el estilo
            actividadCard.classList.toggle('completed', data.completada);
            
            // Animación de éxito
            if (data.completada) {
                actividadCard.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    actividadCard.style.transform = '';
                }, 200);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Si falla, revierte el checkbox a su estado anterior
            const checkbox = actividadCard.querySelector('.completada-checkbox');
            checkbox.checked = !completada;
            
            // Mostrar mensaje de error más elegante
            showNotification('No se pudo actualizar el estado de la actividad.', 'error');
        });
    }

    // Función para obtener el token CSRF
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Sistema de notificaciones mejorado
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: #fff;
            font-weight: 500;
            z-index: 9999;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        // Colores según el tipo
        switch(type) {
            case 'success':
                notification.style.background = 'linear-gradient(135deg, #38d9a9 0%, #20a688 100%)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)';
                break;
            default:
                notification.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Ocultar después de 4 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }
});

// Funciones globales para cancelar mentoría
function cancelarSolicitudMentoria(estrategiaId) {
    const token = localStorage.getItem('access_token');
    
    if (!confirm('¿Estás seguro de que quieres cancelar esta solicitud de mentoría?')) {
        return;
    }

    // Mostrar indicador de carga
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Cancelando...';
    btn.disabled = true;

    fetch(`/empresas/api/estrategias/${estrategiaId}/cancelar-mentoria/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.mensaje) {
            showNotification(data.mensaje, 'success');
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else if (data.error) {
            showNotification('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error al cancelar la solicitud de mentoría. Inténtalo de nuevo.', 'error');
    })
    .finally(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

// === MODAL SIMPLIFICADO PARA MENTORÍA ===

function mostrarModalSolicitarMentoria(estrategiaId) {
    console.log('=== MODAL SIMPLIFICADO PARA MENTORIA ===');
    
    // Eliminar modal existente
    const modalExistente = document.getElementById('modalSolicitarMentoria');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    // MODAL SIMPLE: Solo confirmación, sin formularios complejos
    const modalHTML = `
        <div id="modalSolicitarMentoria" class="modal-simple">
            <div class="modal-overlay"></div>
            <div class="modal-dialog">
                <div class="modal-content-simple">
                    <div class="modal-header-simple">
                        <h3>🎯 Solicitar Mentoría</h3>
                        <button class="close-btn" onclick="cerrarModalSimple()">&times;</button>
                    </div>
                    <div class="modal-body-simple">
                        <div class="icon-container">
                            <div class="mentor-icon">🎓</div>
                        </div>
                        <p class="mensaje-principal">¿Deseas solicitar mentoría para esta estrategia?</p>
                        <p class="mensaje-secundario">Un mentor revisará tu estrategia y te asignará la ayuda que necesitas según su experiencia.</p>
                        
                        <div class="modal-actions">
                            <button class="btn-confirmar" onclick="confirmarSolicitudMentoria(${estrategiaId})">
                                ✅ Sí, solicitar mentoría
                            </button>
                            <button class="btn-cancelar" onclick="cerrarModalSimple()">
                                ❌ Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insertar modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal con animación
    setTimeout(() => {
        const modal = document.getElementById('modalSolicitarMentoria');
        modal.classList.add('show');
    }, 100);
}

function cerrarModalSimple() {
    const modal = document.getElementById('modalSolicitarMentoria');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function confirmarSolicitudMentoria(estrategiaId) {
    const token = localStorage.getItem('access_token');
    
    // Mostrar estado de carga
    const btnConfirmar = document.querySelector('.btn-confirmar');
    if (btnConfirmar) {
        btnConfirmar.textContent = '⏳ Enviando...';
        btnConfirmar.disabled = true;
    }
    
    // Enviar solicitud SIMPLE - sin especialidad, el mentor decide
    fetch(`/empresas/api/estrategias/${estrategiaId}/solicitar-mentoria/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            // Solo enviamos que se solicita mentoría, sin especialidad específica
            solicitar: true
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.mensaje || data.success) {
            showNotification('¡Solicitud de mentoría enviada! Un mentor te será asignado pronto.', 'success');
            cerrarModalSimple();
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else if (data.error) {
            showNotification('Error: ' + data.error, 'error');
            if (btnConfirmar) {
                btnConfirmar.textContent = '✅ Sí, solicitar mentoría';
                btnConfirmar.disabled = false;
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error al enviar solicitud. Inténtalo de nuevo.', 'error');
        if (btnConfirmar) {
            btnConfirmar.textContent = '✅ Sí, solicitar mentoría';
            btnConfirmar.disabled = false;
        }
    });
}

// Manejo universal de modales - Cerrar con clic en fondo
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        cerrarModalSimple();
    }
});

// Estilos CSS SIMPLIFICADOS para los modales - Insertados dinámicamente
if (!document.getElementById('modal-styles-simple')) {
    const styles = `
        <style id="modal-styles-simple">
            .modal-simple {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 10000 !important;
                opacity: 0 !important;
                visibility: hidden !important;
                transition: all 0.3s ease !important;
            }
            
            .modal-simple.show {
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            .modal-overlay {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0, 0, 0, 0.5) !important;
                backdrop-filter: blur(3px) !important;
            }
            
            .modal-dialog {
                position: relative !important;
                width: 100% !important;
                height: 100% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 20px !important;
                box-sizing: border-box !important;
            }
            
            .modal-content-simple {
                background: white !important;
                border-radius: 12px !important;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
                max-width: 400px !important;
                width: 100% !important;
                position: relative !important;
                overflow: hidden !important;
                transform: scale(0.8) !important;
                transition: transform 0.3s ease !important;
            }
            
            .modal-simple.show .modal-content-simple {
                transform: scale(1) !important;
            }
            
            .modal-header-simple {
                background: linear-gradient(135deg, #02bb59 0%, #00953b 100%) !important;
                color: white !important;
                padding: 20px 25px !important;
                position: relative !important;
            }
            
            .modal-header-simple h3 {
                margin: 0 !important;
                font-size: 18px !important;
                font-weight: 600 !important;
            }
            
            .close-btn {
                position: absolute !important;
                top: 15px !important;
                right: 20px !important;
                background: none !important;
                border: none !important;
                font-size: 24px !important;
                color: white !important;
                cursor: pointer !important;
                width: 30px !important;
                height: 30px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 50% !important;
                transition: background 0.2s ease !important;
            }
            
            .close-btn:hover {
                background: rgba(255, 255, 255, 0.2) !important;
            }
            
            .modal-body-simple {
                padding: 30px 25px !important;
                text-align: center !important;
            }
            
            .icon-container {
                margin-bottom: 20px !important;
            }
            
            .mentor-icon {
                font-size: 48px !important;
                margin-bottom: 15px !important;
            }
            
            .mensaje-principal {
                font-size: 18px !important;
                font-weight: 600 !important;
                color: #333 !important;
                margin: 0 0 10px 0 !important;
            }
            
            .mensaje-secundario {
                font-size: 14px !important;
                color: #666 !important;
                margin: 0 0 25px 0 !important;
                line-height: 1.4 !important;
            }
            
            .modal-actions {
                display: flex !important;
                gap: 10px !important;
                flex-direction: column !important;
            }
            
            .btn-confirmar, .btn-cancelar {
                padding: 12px 20px !important;
                border: none !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
            }
            
            .btn-confirmar {
                background: linear-gradient(135deg, #4caf50 0%, #45a049 100%) !important;
                color: white !important;
            }
            
            .btn-confirmar:hover:not(:disabled) {
                background: linear-gradient(135deg, #45a049 0%, #3e8e41 100%) !important;
                transform: translateY(-1px) !important;
            }
            
            .btn-confirmar:disabled {
                background: #ccc !important;
                cursor: not-allowed !important;
                transform: none !important;
            }
            
            .btn-cancelar {
                background: transparent !important;
                color: #666 !important;
                border: 2px solid #e0e0e0 !important;
            }
            
            .btn-cancelar:hover {
                background: #f5f5f5 !important;
                border-color: #d0d0d0 !important;
            }
            
            /* Responsive */
            @media (max-width: 480px) {
                .modal-content-simple {
                    max-width: 95% !important;
                    margin: 10px !important;
                }
                
                .modal-header-simple {
                    padding: 15px 20px !important;
                }
                
                .modal-body-simple {
                    padding: 20px !important;
                }
            }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', styles);
}
