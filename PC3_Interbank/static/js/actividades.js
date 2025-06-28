document.addEventListener('DOMContentLoaded', function () {
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
                'X-CSRFToken': getCookie('csrftoken') // Mejorado para obtener el token CSRF
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
        
        // Animación de entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-eliminar después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
});

// Funciones para gestión de mentoría por estrategia
function solicitarMentoriaEstrategia(estrategiaId) {
    const token = localStorage.getItem('access_token');
    
    if (!confirm('¿Estás seguro de que quieres solicitar mentoría para esta estrategia?')) {
        return;
    }

    // Mostrar indicador de carga
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Solicitando...';
    btn.disabled = true;

    fetch(`/empresas/api/estrategias/${estrategiaId}/solicitar-mentoria/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            especialidad_requerida: 'general'
        })
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
        showNotification('Error al solicitar mentoría. Inténtalo de nuevo.', 'error');
    })
    .finally(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

function cancelarMentoriaEstrategia(estrategiaId) {
    const token = localStorage.getItem('access_token');
    
    if (!confirm('¿Estás seguro de que quieres cancelar la solicitud de mentoría?')) {
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

// Función auxiliar para obtener el token CSRF (ya definida arriba, pero la incluimos aquí también)
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

// Función de notificaciones (ya definida arriba, pero la incluimos aquí también)
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
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}