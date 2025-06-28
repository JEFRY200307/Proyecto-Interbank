// mentor_dashboard_main.js - Dashboard principal del mentor (simplificado)

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando dashboard del mentor...');
    verificarAutenticacion();
    configurarNavegacion();
    cargarContadores();
});

async function verificarAutenticacion() {
    const token = localStorage.getItem('access_token');
    const rol = localStorage.getItem('rol');
    
    console.log('🔐 Verificando autenticación...');
    console.log('Token presente:', !!token);
    console.log('Rol:', rol);
    
    if (!token) {
        console.warn('⚠️ No se encontró token JWT. Redirigiendo a login...');
        window.location.href = '/login/';
        return false;
    }
    
    if (rol !== 'mentor') {
        console.warn('⚠️ Usuario no es mentor. Rol:', rol);
        window.location.href = '/login/';
        return false;
    }
    
    // Verificar que el token no haya expirado
    try {
        const response = await fetch('/users/api/cuenta/', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.warn('⚠️ Token inválido o expirado. Redirigiendo a login...');
            localStorage.clear();
            window.location.href = '/login/';
            return false;
        }
        
        console.log('✅ Autenticación válida');
        return true;
    } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        localStorage.clear();
        window.location.href = '/login/';
        return false;
    }
}

function configurarNavegacion() {
    // Botón para ver estrategias
    const btnEstrategias = document.getElementById('verEstrategiasBtn');
    if (btnEstrategias) {
        btnEstrategias.onclick = () => {
            console.log('📊 Navegando a estrategias...');
            window.location.href = '/mentor/dashboard/estrategias/';
        };
    }

    // Botón para ver solicitudes
    const btnSolicitudes = document.getElementById('verSolicitudesBtn');
    if (btnSolicitudes) {
        btnSolicitudes.onclick = () => {
            console.log('📬 Navegando a solicitudes...');
            window.location.href = '/mentor/dashboard/solicitudes/';
        };
    }
}

async function cargarContadores() {
    console.log('📊 Cargando contadores...');
    
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('❌ No hay token JWT disponible');
        return;
    }
    
    const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    console.log('🔧 Headers preparados con JWT');

    // Cargar contador de estrategias asignadas
    console.log('📊 Obteniendo estrategias del mentor...');
    try {
        const responseEstrategias = await fetch('/mentor/api/mis-estrategias/', {
            method: 'GET',
            headers: headers
        });
        
        console.log('📊 Respuesta estrategias:', responseEstrategias.status);
        
        if (responseEstrategias.ok) {
            const estrategias = await responseEstrategias.json();
            const contadorEstrategias = document.getElementById('estrategias-count');
            if (contadorEstrategias) {
                const count = Array.isArray(estrategias) ? estrategias.length : 0;
                contadorEstrategias.textContent = count;
                console.log(`✅ Estrategias cargadas: ${count}`);
            }
        } else if (responseEstrategias.status === 401) {
            console.warn('⚠️ Token expirado, redirigiendo a login...');
            localStorage.clear();
            window.location.href = '/login/';
            return;
        } else {
            console.error('❌ Error al cargar estrategias:', responseEstrategias.status);
            const errorText = await responseEstrategias.text();
            console.error('Detalles del error:', errorText.substring(0, 200));
            
            const contadorEstrategias = document.getElementById('estrategias-count');
            if (contadorEstrategias) {
                contadorEstrategias.textContent = '0';
                contadorEstrategias.title = 'Error al cargar estrategias';
            }
        }
    } catch (error) {
        console.error('❌ Error de red al cargar estrategias:', error);
        const contadorEstrategias = document.getElementById('estrategias-count');
        if (contadorEstrategias) {
            contadorEstrategias.textContent = '0';
            contadorEstrategias.title = 'Error de conexión';
        }
    }

    // Cargar contador de solicitudes pendientes
    console.log('📬 Obteniendo solicitudes pendientes...');
    try {
        const responseSolicitudes = await fetch('/mentor/api/solicitudes-mentoria/', {
            method: 'GET',
            headers: headers
        });
        
        console.log('📬 Respuesta solicitudes:', responseSolicitudes.status);
        
        if (responseSolicitudes.ok) {
            const solicitudes = await responseSolicitudes.json();
            const contadorSolicitudes = document.getElementById('solicitudes-count');
            if (contadorSolicitudes) {
                const count = Array.isArray(solicitudes) ? solicitudes.length : 0;
                contadorSolicitudes.textContent = count;
                console.log(`✅ Solicitudes cargadas: ${count}`);
            }
        } else if (responseSolicitudes.status === 401) {
            console.warn('⚠️ Token expirado, redirigiendo a login...');
            localStorage.clear();
            window.location.href = '/login/';
            return;
        } else {
            console.error('❌ Error al cargar solicitudes:', responseSolicitudes.status);
            const errorText = await responseSolicitudes.text();
            console.error('Detalles del error:', errorText.substring(0, 200));
            
            const contadorSolicitudes = document.getElementById('solicitudes-count');
            if (contadorSolicitudes) {
                contadorSolicitudes.textContent = '0';
                contadorSolicitudes.title = 'Error al cargar solicitudes';
            }
        }
    } catch (error) {
        console.error('❌ Error de red al cargar solicitudes:', error);
        const contadorSolicitudes = document.getElementById('solicitudes-count');
        if (contadorSolicitudes) {
            contadorSolicitudes.textContent = '0';
            contadorSolicitudes.title = 'Error de conexión';
        }
    }
}

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.clear();
    window.location.href = '/login/';
}

// Función para recargar contadores manualmente (útil para debugging)
function recargarContadores() {
    cargarContadores();
}

// Exponer funciones globalmente para debugging
window.recargarContadores = recargarContadores;
window.cerrarSesion = cerrarSesion;

// Debug info
console.log('🔧 Dashboard del mentor cargado. Funciones disponibles:');
console.log('- window.recargarContadores() - Recarga los contadores');
console.log('- window.cerrarSesion() - Cierra sesión y limpia tokens');
