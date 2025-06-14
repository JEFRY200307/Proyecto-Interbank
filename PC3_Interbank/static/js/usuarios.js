// static/js/usuarios.js

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login/';
        return;
    }

    const modal = document.getElementById('usuarioModal');
    const usuarioForm = document.getElementById('usuarioForm');
    const cerrarModalBtn = document.getElementById('cerrarModalBtn');
    const mensaje = document.getElementById('usuarioMensaje');

    function mostrarModal(usuario = null) {
        usuarioForm.reset();
        mensaje.style.display = 'none';
        if (usuario) {
            document.getElementById('usuario_id').value = usuario.id;
            document.getElementById('nombre').value = usuario.nombre;
            document.getElementById('correo').value = usuario.correo;
            document.getElementById('rol').value = usuario.rol;
            // No llenes password por seguridad
        } else {
            document.getElementById('usuario_id').value = '';
        }
        modal.style.display = 'flex';
    }

    function cerrarModal() {
        modal.style.display = 'none';
    }

    cerrarModalBtn.addEventListener('click', cerrarModal);

    // Cargar usuarios (igual que antes)
    function cargarUsuarios() {
        fetch('/users/api/usuarios/', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json'
            }
        })
            .then(r => {
                if (r.status === 401 || r.status === 403) {
                    window.location.href = '/login/';
                    return;
                }
                return r.json();
            })
            .then(data => {
                if (!data) return;
                const contenedor = document.getElementById('usuarios-lista');
                contenedor.innerHTML = '';
                data.forEach(usuario => {
                    contenedor.innerHTML += `
                    <div class="usuario-item">
                        <span>${usuario.nombre} (${usuario.correo}) - ${usuario.rol}</span>
                        <button class="editarUsuarioBtn" data-id="${usuario.id}">Editar</button>
                        <button class="eliminarUsuarioBtn" data-id="${usuario.id}">Eliminar</button>
                    </div>
                `;
                });
            });
    }

    cargarUsuarios();

    // Evento para abrir modal de agregar usuario
    document.getElementById('agregarUsuarioBtn').addEventListener('click', function () {
        mostrarModal();
    });

    // Evento para abrir modal de editar usuario
    document.getElementById('usuarios-lista').addEventListener('click', function (e) {
        if (e.target.classList.contains('editarUsuarioBtn')) {
            const userId = e.target.getAttribute('data-id');
            fetch(`/users/api/usuarios/${userId}/`, {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json'
                }
            })
                .then(r => r.json())
                .then(usuario => {
                    mostrarModal(usuario);
                });
        }
        // Eliminar usuario (igual que antes)
        if (e.target.classList.contains('eliminarUsuarioBtn')) {
            const userId = e.target.getAttribute('data-id');
            if (confirm('¿Seguro que deseas eliminar este usuario?')) {
                fetch(`/users/api/usuarios/${userId}/`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                })
                    .then(r => r.json())
                    .then(data => {
                        alert(data.mensaje || 'Usuario eliminado');
                        cargarUsuarios();
                    });
            }
        }
    });

    // Evento para guardar (agregar o editar) usuario
    usuarioForm.addEventListener('submit', function (e) {
        e.preventDefault();
        mensaje.style.display = 'none';
        const userId = document.getElementById('usuario_id').value;
        const url = userId ? `/users/api/usuarios/${userId}/` : '/users/api/usuarios/';
        const method = userId ? 'PUT' : 'POST';
        const formData = {
            nombre: document.getElementById('nombre').value,
            correo: document.getElementById('correo').value,
            rol: document.getElementById('rol').value,
            password: document.getElementById('password').value
        };
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(r => r.json().then(data => ({ status: r.status, data })))
            .then(res => {
                if (res.status >= 200 && res.status < 300) {
                    mensaje.textContent = res.data.mensaje || 'Usuario guardado correctamente.';
                    mensaje.className = 'mensaje success';
                    mensaje.style.display = 'block';
                    cargarUsuarios();
                    setTimeout(cerrarModal, 1000);
                } else {
                    mensaje.textContent = res.data.error || 'Error al guardar usuario.';
                    mensaje.className = 'mensaje error';
                    mensaje.style.display = 'block';
                }
            })
            .catch(() => {
                mensaje.textContent = 'Error de conexión.';
                mensaje.className = 'mensaje error';
                mensaje.style.display = 'block';
            });
    });
});