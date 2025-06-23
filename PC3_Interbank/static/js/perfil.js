document.addEventListener('DOMContentLoaded', function () {
    const access = localStorage.getItem('access_token');
    const rolInterno = localStorage.getItem('rol_interno');

    // Mostrar campos según el rol interno
    if (rolInterno === 'representante' || rolInterno === 'administrador') {
        document.getElementById('empresaFields').style.display = '';
        document.getElementById('usuarioFields').style.display = '';
        // Habilitar edición de campos de empresa
        [
            'razon_social', 'ruc', 'representante', 'direccion', 'departamento',
            'provincia', 'distrito', 'telefono', 'objetivo', 'mision', 'vision',
            'valores', 'historia', 'web', 'facebook', 'instagram'
        ].forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.removeAttribute('readonly');
        });
    } else {
        document.getElementById('empresaFields').style.display = 'none';
        document.getElementById('usuarioFields').style.display = '';
        // Solo lectura para usuario (si quieres, puedes deshabilitar aquí los campos de usuario)
    }

    // Cargar datos de perfil
    fetch('/users/api/cuenta/', {
        headers: {
            'Authorization': 'Bearer ' + access,
            'Accept': 'application/json'
        }
    })
        .then(r => r.json())
        .then(data => {
            // Datos de usuario
            document.getElementById('nombre').value = data.nombre || '';
            document.getElementById('dni').value = data.dni || '';
            document.getElementById('rol_interno').value = data.rol_interno || '';
            document.getElementById('correo').value = data.correo || '';
            // Datos de empresa (solo si existen)
            if (data.empresa) {
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
                document.getElementById('valores').value = data.empresa.valores || '';
                document.getElementById('historia').value = data.empresa.historia || '';
                document.getElementById('web').value = data.empresa.web || '';
                document.getElementById('facebook').value = data.empresa.facebook || '';
                document.getElementById('instagram').value = data.empresa.instagram || '';
            }
        });

    // Guardar cambios de perfil y empresa
    document.getElementById('perfilForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const perfilMensaje = document.getElementById('perfilMensaje');
        perfilMensaje.textContent = '';
        perfilMensaje.className = 'mensaje';

        // Prepara los datos a enviar
        const payload = {
            nombre: document.getElementById('nombre').value,
            dni: document.getElementById('dni').value,
            correo: document.getElementById('correo').value
        };
        const password = document.getElementById('password').value;
        if (password) {
            payload.password = password;
        }
        const nuevaClave = document.getElementById('clave_firma_nueva').value;
        const confirmClave = document.getElementById('clave_firma_confirm').value;

        if (nuevaClave || confirmClave) {
            if (nuevaClave !== confirmClave) {
                perfilMensaje.textContent = 'El PIN de firma y su confirmación no coinciden.';
                perfilMensaje.classList.add('error');
                return;
            }
            if (!/^\d{4}$/.test(nuevaClave)) {
                perfilMensaje.textContent = 'El PIN de firma debe ser de 4 dígitos numéricos.';
                perfilMensaje.classList.add('error');
                return;
            }
            payload.clave_firma_nueva = nuevaClave;
        }
        // Si es representante o administrador, agrega los campos de empresa
        if (rolInterno === 'representante' || rolInterno === 'administrador') {
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
                perfilMensaje.textContent = data.mensaje || 'Perfil actualizado correctamente.';
                perfilMensaje.classList.add('success');
                document.getElementById('password').value = '';
                document.getElementById('clave_firma_nueva').value = '';
                document.getElementById('clave_firma_confirm').value = '';
            })
            .catch(() => {
                perfilMensaje.textContent = 'Error al actualizar perfil.';
                perfilMensaje.classList.add('error');
            });
    });
});