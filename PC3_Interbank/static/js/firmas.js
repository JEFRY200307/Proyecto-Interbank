document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('access_token');
    const rol = localStorage.getItem('rol');
    const titulo = document.getElementById('titulo-firmas');
    const acciones = document.getElementById('acciones-firmas');
    const listaFirmas = document.getElementById('listaFirmas');
    const firmarModal = document.getElementById('firmarModal');
    const firmarForm = document.getElementById('firmarForm');
    const firmaDocInfo = document.getElementById('firmaDocInfo');
    const firmaDocId = document.getElementById('firma_doc_id');
    const claveFirma = document.getElementById('claveFirma');
    const firmaMensaje = document.getElementById('firmaMensaje');
    const cerrarFirmarModalBtn = document.getElementById('cerrarFirmarModalBtn');

    if (!token || !rol) return;

    // Título y acciones
    if (rol === 'editor' || rol === 'lector') {
        titulo.textContent = 'Firmar documentos asignados';
        acciones.innerHTML = `<li><button id="verFirmasBtn">Actualizar lista</button></li>`;
    } else {
        titulo.textContent = 'Gestión de Firmas';
        acciones.innerHTML = '';
    }

    // Función para cargar documentos pendientes de firma
    function cargarFirmas() {
        listaFirmas.innerHTML = 'Cargando...';
        fetch('/firmas/pendientes/', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json'
            }
        })
            .then(r => r.json())
            .then(data => {
                if (!Array.isArray(data) || data.length === 0) {
                    listaFirmas.innerHTML = '<p>No tienes documentos pendientes de firma.</p>';
                    return;
                }
                listaFirmas.innerHTML = '';
                data.forEach(doc => {
                    listaFirmas.innerHTML += `
                    <div class="firma-item">
                        <strong>${doc.titulo}</strong> (${doc.tipo_documento})<br>
                        <span>Asignado por: ${doc.asignador}</span><br>
                        <button class="firmarBtn" data-id="${doc.id}" data-titulo="${doc.titulo}">Firmar</button>
                        <button class="verPdfBtn" data-id="${doc.id}">Ver PDF</button>
                    </div>
                `;
                });
            });
    }

    // Cargar lista al iniciar
    cargarFirmas();

    // Botón para actualizar lista
    acciones.addEventListener('click', function (e) {
        if (e.target.id === 'verFirmasBtn') {
            cargarFirmas();
        }
    });

    // Abrir modal de firma
    listaFirmas.addEventListener('click', function (e) {
        if (e.target.classList.contains('firmarBtn')) {
            const docId = e.target.getAttribute('data-id');
            const titulo = e.target.getAttribute('data-titulo');
            firmaDocId.value = docId;
            firmaDocInfo.textContent = `Documento: ${titulo}`;
            claveFirma.value = '';
            firmaMensaje.textContent = '';
            firmaMensaje.className = '';
            firmarModal.style.display = 'block';
        }
        // Ver PDF (opcional)
        if (e.target.classList.contains('verPdfBtn')) {
            const docId = e.target.getAttribute('data-id');
            window.open(`/firmas/ver-pdf/${docId}/`, '_blank');
        }
    });

    // Cerrar modal
    cerrarFirmarModalBtn.addEventListener('click', function () {
        firmarModal.style.display = 'none';
    });

    // Enviar firma electrónica
    firmarForm.addEventListener('submit', function (e) {
        e.preventDefault();
        firmaMensaje.textContent = '';
        firmaMensaje.className = '';
        fetch(`/firmas/firmar/${firmaDocId.value}/`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ clave: claveFirma.value })
        })
            .then(r => r.json().then(data => ({ status: r.status, data })))
            .then(res => {
                if (res.status >= 200 && res.status < 300) {
                    firmaMensaje.textContent = res.data.mensaje || 'Documento firmado correctamente.';
                    firmaMensaje.className = 'success';
                    setTimeout(() => {
                        firmarModal.style.display = 'none';
                        cargarFirmas();
                    }, 1000);
                } else {
                    firmaMensaje.textContent = res.data.error || 'Error al firmar.';
                    firmaMensaje.className = 'error';
                }
            })
            .catch(() => {
                firmaMensaje.textContent = 'Error de conexión.';
                firmaMensaje.className = 'error';
            });
    });
});