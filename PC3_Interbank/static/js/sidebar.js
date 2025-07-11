document.addEventListener('DOMContentLoaded', function () {
    const rol = localStorage.getItem('rol');
    const nombre = localStorage.getItem('nombre');
    const razonSocial = localStorage.getItem('razon_social'); // Obtener razón social
    const sidebar = document.getElementById('sidebar-menu');
    console.log('sidebar.js cargado');
    if (!sidebar) return;

    // --- Modal de logout ---
    const modal = document.getElementById('logoutModal');
    const confirmBtn = document.getElementById('confirmLogoutBtn');
    const cancelBtn = document.getElementById('cancelLogoutBtn');
    let logoutPending = false;

    function showLogoutModal() {
        if (modal) modal.classList.add('visible');
        logoutPending = true;
    }

    if (confirmBtn) {
        confirmBtn.onclick = function () {
            if (modal) modal.classList.remove('visible');
            if (logoutPending && typeof logout === 'function') {
                logout();
            }
            logoutPending = false;
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = function () {
            if (modal) modal.classList.remove('visible');
            logoutPending = false;
        };
    }
    // --- Fin modal de logout ---

    function renderMenu(rol, nombre, razonSocial) {
        let menu = '';
        if (rol === 'empresa') {
            menu += `<li style="list-style:none;"><h3>${razonSocial || 'Mi empresa'}</h3></li>
                <li><a href="/users/dashboard/perfil/">Perfil</a></li>
                <li><a href="/users/dashboard/usuarios/">Usuarios</a></li>
                <li><a href="/documentos/dashboard/documentos/">Documentos</a></li>
                <li><a href="/documentos/dashboard/firmas/">Firma Electrónica</a></li>
                <li><a href="/users/dashboard/chat/">Banki</a></li>
                <li><a href="/users/dashboard/estrategias/">Estrategias</a></li>`;
        } else if (rol === 'editor') {
            menu += `<li style="list-style:none;"><h3>Bienvenido ${nombre}</h3></li>
                <li><a href="/users/dashboard/perfil/">Perfil</a></li>
                <li><a href="/documentos/dashboard/documentos/">Documentos</a></li>
                <li><a href="/documentos/dashboard/firmas/">Firma Electrónica</a></li>
                <li><a href="/users/dashboard/estrategias/">Estrategias</a></li>
                <li><a href="/users/dashboard/chat/">Banki</a></li>`;
        } else if (rol === 'lector') {
            menu += `<li style="list-style:none;"><h3>Bienvenido ${nombre}</h3></li>
                <li><a href="/users/dashboard/perfil/">Perfil</a></li>
                <li><a href="/documentos/dashboard/documentos/">Documentos</a></li>
                <li><a href="/documentos/dashboard/firmas/">Firma Electrónica</a></li>
                <li><a href="/users/dashboard/chat/">Banki</a></li>`;
        } else if (rol === 'mentor') {
        menu += `<li style="list-style:none;"><h3>Mentor</h3></li>
            <li><a href="/mentor/dashboard/">Gestión de empresas</a></li>
            <li><a href="/mentor/dashboard/estrategias/">Mis Estrategias</a></li>
            <li><a href="/mentor/dashboard/solicitudes/">Solicitudes de Mentoría</a></li>
            <li><a href="/mentor/dashboard/bots/">Alimentar al bot</a></li>`;
        }
        menu += `<li><a href="#" id="logout-link">Cerrar sesión</a></li>`;
        sidebar.innerHTML = menu;

        // Conectar el evento logout para mostrar el modal
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', function(e) {
                e.preventDefault();
                showLogoutModal();
            });
        }

        // Resaltar el enlace activo
        const currentPath = window.location.pathname;
        const menuLinks = sidebar.querySelectorAll('a');
        menuLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    async function getAndRenderMenu() {
        let rol = localStorage.getItem('rol');
        let nombre = localStorage.getItem('nombre') || '';
        const token = localStorage.getItem('access_token');

        if (!rol && token) {
            try {
                const response = await fetch('/users/api/cuenta/', {
                    headers: {
                        'Authorization': ' ' + token,
                        'Accept': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    rol = data.rol;
                    nombre = data.nombre;
                    localStorage.setItem('rol', rol);
                    localStorage.setItem('nombre', nombre);
                    renderMenu(rol, nombre);
                } else {
                    throw new Error('No autorizado');
                }
            } catch (e) {
                sidebar.innerHTML = '<li><a href="#" id="logout-link">Cerrar sesión</a></li>';
                const logoutLink = document.getElementById('logout-link');
                if (logoutLink) {
                    logoutLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showLogoutModal();
                    });
                }
                return;
            }
        } else if (rol) {
            renderMenu(rol, nombre);
        } else {
            sidebar.innerHTML = '<li><a href="#" id="logout-link">Cerrar sesión</a></li>';
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    showLogoutModal();
                });
            }
        }
    }

    getAndRenderMenu();
});