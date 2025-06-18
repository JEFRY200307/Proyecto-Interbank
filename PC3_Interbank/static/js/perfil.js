document.addEventListener('DOMContentLoaded', function () {
    const rol = localStorage.getItem('rol');
    const access = localStorage.getItem('access_token');

    // Mostrar campos según el rol
    if (rol === 'empresa') {
        document.getElementById('empresaFields').style.display = '';
        document.getElementById('usuarioFields').style.display = 'none';
    } else if (rol === 'editor' || rol === 'lector') {
        document.getElementById('empresaFields').style.display = 'none';
        document.getElementById('usuarioFields').style.display = '';
    }

    // Cargar datos del perfil
    fetch('/users/api/cuenta/', {
        headers: {
            'Authorization': 'Bearer ' + access,
            'Accept': 'application/json'
        }
    })
        .then(r => r.json())
        .then(data => {
            document.getElementById('correo').value = data.correo || '';
            if (rol === 'empresa' && data.empresa) {
                document.getElementById('razon_social').value = data.empresa.razon_social || '';
                document.getElementById('ruc').value = data.empresa.ruc || '';
                document.getElementById('representante').value = data.empresa.representante || '';
                document.getElementById('direccion').value = data.empresa.direccion || '';
                document.getElementById('departamento').value = data.empresa.departamento || '';
                document.getElementById('provincia').value = data.empresa.provincia || '';
                document.getElementById('distrito').value = data.empresa.distrito || '';
                document.getElementById('telefono').value = data.empresa.telefono || '';
                document.getElementById('objetivo').value = data.empresa.objetivo || '';
                document.getElementById('mision').value = data.empresa.mision || '';
                document.getElementById('vision').value = data.empresa.vision || '';
                document.getElementById('valores').value = data.empresa.telefono || '';
                document.getElementById('historia').value = data.empresa.objetivo || '';
                document.getElementById('web').value = data.empresa.mision || '';
                document.getElementById('facebook').value = data.empresa.vision || '';
                document.getElementById('instagram').value = data.empresa.vision || '';
            } else if ((rol === 'editor' || rol === 'lector')) {
                document.getElementById('nombre').value = data.nombre || '';
                document.getElementById('dni').value = data.dni || '';
            }
        });

    // Guardar cambios en el perfil
    document.getElementById('perfilForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const mensaje = document.getElementById('perfilMensaje');
        mensaje.textContent = '';
        mensaje.className = 'mensaje';

        let payload = { correo: document.getElementById('correo').value };

        if (rol === 'empresa') {
            payload.empresa = {
                razon_social: document.getElementById('razon_social').value,
                ruc: document.getElementById('ruc').value,
                representante: document.getElementById('representante').value,
                direccion: document.getElementById('direccion').value,
                departamento: document.getElementById('departamento').value,
                provincia: document.getElementById('provincia').value,
                distrito: document.getElementById('distrito').value,
                telefono: document.getElementById('telefono').value,
                objetivo: document.getElementById('objetivo').value,
                mision: document.getElementById('mision').value,
                vision: document.getElementById('vision').value,
                valores: document.getElementById('valores').value,
                historia: document.getElementById('historia').value,
                web: document.getElementById('web').value,
                facebook: document.getElementById('facebook').value,
                instagram: document.getElementById('instagram').value
            };
        } else if (rol === 'editor' || rol === 'lector') {
            payload.nombre = document.getElementById('nombre').value;
            payload.dni = document.getElementById('dni').value;
        }

        fetch('/users/api/cuenta/', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + access,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(r => r.json())
            .then(data => {
                mensaje.textContent = data.mensaje || 'Cambios guardados correctamente.';
                mensaje.classList.add('success');
            })
            .catch(() => {
                mensaje.textContent = 'Error al guardar cambios.';
                mensaje.classList.add('error');
            });
    });

    // Tabs dinámicas según el rol
    const tabs = document.getElementById('perfil-tabs');
    if (tabs) {
        let html = '';
        if (rol === 'empresa') {
            html += `<a href="/users/dashboard/perfil/">Perfil</a>
                     <a href="/users/dashboard/usuarios/">Usuarios</a>`;
        } else if (rol === 'editor' || rol === 'lector') {
            html += `<a href="/users/dashboard/perfil/">Perfil</a>`;
        }
        tabs.innerHTML = html;
    }
});