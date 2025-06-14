document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar-menu');
    console.log('sidebar.js cargado');
    if (!sidebar) return;

    function renderMenu(rol, nombre) {
        let menu = '';
        if (rol === 'empresa') {
            menu += `<li style="list-style:none;"><h3>Mi empresa</h3></li>
                <li><a href="/users/dashboard/perfil/">Perfil y Cuenta</a></li>
                <li><a href="/users/dashboard/usuarios/">Usuarios</a></li>
                <li><a href="/documentos/dashboard/documentos/">Documentos</a></li>
                <li><a href="/documentos/firmas/pendientes/">Firma Electrónica</a></li>
                <li><a href="/users/dashboard/chat/">Chat y Soporte</a></li>
                <li><a href="/users/dashboard/estrategias/">Estrategias</a></li>
                <li><a href="/users/dashboard/reportes/">Reportes y Analíticas</a></li>
                <li><a href="/users/dashboard/notificaciones/">Notificaciones</a></li>
                <li><a href="/users/dashboard/integraciones/">Integraciones</a></li>
                <li><a href="/users/dashboard/configuracion/">Configuración</a></li>
                <li><a href="/users/dashboard/recursos/">Recursos y Capacitación</a></li>`;
        } else if (rol === 'editor') {
            menu += `<li style="list-style:none;"><h3>Bienvenido ${nombre}</h3></li>
                <li><a href="/users/dashboard/perfil/">Perfil</a></li>
                <li><a href="/documentos/dashboard/documentos/">Documentos</a></li>
                <li><a href="/documentos/firmas/pendientes/">Firma Electrónica</a></li>
                <li><a href="/users/dashboard/estrategias/">Estrategias</a></li>
                <li><a href="/users/dashboard/chat/">Chat y Soporte</a></li>
                <li><a href="/users/dashboard/notificaciones/">Notificaciones</a></li>
                <li><a href="/users/dashboard/configuracion/">Configuración</a></li>
                <li><a href="/users/dashboard/recursos/">Recursos y Capacitación</a></li>`;
        } else if (rol === 'lector') {
            menu += `<li style="list-style:none;"><h3>Bienvenido ${nombre}</h3></li>
                <li><a href="/users/dashboard/perfil/">Perfil</a></li>
                <li><a href="/documentos/dashboard/documentos/">Documentos</a></li>
                <li><a href="/documentos/firmas/pendientes/">Firma Electrónica</a></li>
                <li><a href="/users/dashboard/chat/">Chat y Soporte</a></li>
                <li><a href="/users/dashboard/notificaciones/">Notificaciones</a></li>
                <li><a href="/users/dashboard/configuracion/">Configuración</a></li>
                <li><a href="/users/dashboard/recursos/">Recursos y Capacitación</a></li>`;
        }
        menu += `<li><a href="/logout/">Cerrar sesión</a></li>`;
        sidebar.innerHTML = menu;
    }

    async function getAndRenderMenu() {
        let rol = localStorage.getItem('rol');
        let nombre = localStorage.getItem('nombre') || '';
        const token = localStorage.getItem('access_token');

        if (!rol && token) {
            try {
                const resp = await fetch('/users/api/cuenta/', {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                });
                const data = await resp.json();
                if (data.rol) {
                    rol = data.rol;
                    localStorage.setItem('rol', rol);
                }
                if (data.nombre) {
                    nombre = data.nombre;
                    localStorage.setItem('nombre', nombre);
                }
            } catch (e) {
                sidebar.innerHTML = '<li><a href="/logout/">Cerrar sesión</a></li>';
                return;
            }
        }
        if (rol) {
            renderMenu(rol, nombre);
        } else {
            sidebar.innerHTML = '<li><a href="/logout/">Cerrar sesión</a></li>';
        }
    }

    getAndRenderMenu();
});