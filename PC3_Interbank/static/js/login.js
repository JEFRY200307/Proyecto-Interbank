document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const mensaje = document.getElementById('mensaje');
    mensaje.className = 'mensaje';
    mensaje.style.display = 'none';

    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ correo, password })
        });
        const result = await response.json();

        if (response.ok) {
            console.log('Respuesta de /api/login/:', result); // <-- Agrega esto
            // Guarda el token JWT
            if (result.access) {
                localStorage.setItem('access_token', result.access);
                localStorage.setItem('refresh_token', result.refresh);
            }
            mensaje.textContent = result.mensaje || 'Login exitoso.';
            mensaje.classList.add('success');
            mensaje.style.display = 'block';

            // Consulta el rol del usuario y guárdalo en localStorage
            fetch('/users/api/cuenta/', {
                headers: {
                    'Authorization': 'Bearer ' + result.access,
                    'Accept': 'application/json'
                }
            })
                .then(r => r.json())
                .then(data => {
                    console.log('Respuesta de /users/api/cuenta/:', data); // <-- Agrega esto
                    console.log('DATA DE CUENTA:', data);
                    alert('Rol interno recibido: ' + data.rol_interno);
                    if (data.rol) {
                        localStorage.setItem('rol', data.rol);
                    }
                    if (data.rol_interno) {
                        localStorage.setItem('rol_interno', data.rol_interno);
                    }
                    if (data.nombre) {
                        localStorage.setItem('nombre', data.nombre);
                    }
                    if (data.id) {
                        localStorage.setItem('user_id', data.id);
                    }
                    setTimeout(() => {
                        window.location.href = '/users/dashboard/';
                    }, 200);
                })
                .catch((err) => {
                    console.log('Error al consultar cuenta:', err);
                    alert('Error al consultar cuenta');
                    window.location.href = '/login/';
                });

        } else {
            mensaje.textContent = result.error || 'Credenciales incorrectas.';
            mensaje.classList.add('error');
            mensaje.style.display = 'block';
        }
    } catch (error) {
        mensaje.textContent = 'Error de conexión. Intenta nuevamente.';
        mensaje.classList.add('error');
        mensaje.style.display = 'block';
    }
});