document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login/';
        return;
    }
    // --- Control de interfaz según rol ---
    const rol = localStorage.getItem('rol');
    const titulo = document.getElementById('titulo-documentos');
    const acciones = document.getElementById('acciones-documentos');
    const botonesDoc = document.getElementById('botones-doc');
    if (!rol) return;
    if (rol === 'empresa') {
        titulo.textContent = 'Documentos - Empresa';
        acciones.innerHTML = `
            <li><button id="nuevoDocumentoBtn">Nuevo documento</button></li>
            <li><button id="mostrarSubirDocBtn">Subir archivo</button></li>
            <li><button>Reportes globales</button></li>
            <li><button>Ver gestión global de firmas</button></li>
        `;
        botonesDoc.innerHTML = '';
    } else if (rol === 'editor') {
        titulo.textContent = 'Documentos - Editor';
        acciones.innerHTML = `
            <li><button id="nuevoDocumentoBtn">Nuevo documento</button></li>
            <li><button id="mostrarSubirDocBtn">Subir archivo</button></li>
            <li><button>Solicitar firmas</button></li>
            <li><button>Asignar firmantes</button></li>
            <li><button>Ver estado de firmas</button></li>
        `;
        botonesDoc.innerHTML = '';
    } else if (rol === 'lector') {
        titulo.textContent = 'Documentos - Lector';
        acciones.innerHTML = `
            <li><button>Ver documentos asignados</button></li>
            <li><button>Descargar documentos</button></li>
            <li><button>Buscar y filtrar</button></li>
            <li><button>Ver estado de firmas</button></li>
            <li><button>Firmar documentos asignados</button></li>
        `;
        botonesDoc.innerHTML = '';
        document.getElementById('subirDocForm').style.display = 'none';
        document.getElementById('documentoModal').style.display = 'none';
    }

    // ===================== LISTAR DOCUMENTOS =====================
    function cargarDocumentos() {
        fetch('/documentos/empresa/', {
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
                const contenedor = document.getElementById('listaDocumentos');
                contenedor.innerHTML = '';
                data.forEach(doc => {
                    contenedor.innerHTML += `
                    <div class="documento-item">
                        <span>${doc.nombre} (${doc.tipo_documento})</span>
                        <span class="etiquetas">${doc.etiquetas || ''}</span>
                        <button class="verPdfBtn" data-id="${doc.id}">PDF</button>
                        ${doc.puede_editar ? `<button class="editarDocBtn" data-id="${doc.id}">Editar</button>` : ''}
                        ${doc.puede_eliminar ? `<button class="eliminarDocBtn" data-id="${doc.id}">Eliminar</button>` : ''}
                    </div>
                `;
                });
            });
    }

    cargarDocumentos();

    // ===================== SUBIR / CREAR DOCUMENTO =====================
    const nuevoDocumentoBtn = document.getElementById('nuevoDocumentoBtn');
    if (nuevoDocumentoBtn) {
        nuevoDocumentoBtn.addEventListener('click', function () {
            document.getElementById('documentoForm').reset();
            document.getElementById('documento_id').value = '';
            document.getElementById('documentoModal').style.display = 'flex';
        });
    }

    const cerrarDocumentoModalBtn = document.getElementById('cerrarDocumentoModalBtn');
    if (cerrarDocumentoModalBtn) {
        cerrarDocumentoModalBtn.addEventListener('click', function () {
            document.getElementById('documentoModal').style.display = 'none';
        });
    }

    const documentoForm = document.getElementById('documentoForm');
    if (documentoForm) {
        documentoForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const docId = document.getElementById('documento_id').value;
            const url = docId ? `/documentos/empresa/${docId}/` : '/documentos/empresa/';
            const method = docId ? 'PUT' : 'POST';
            const formData = {
                nombre: document.getElementById('titulo').value,
                tipo_documento: document.getElementById('tipo_documento').value,
                contenido: document.getElementById('contenido').value,
                etiquetas: document.getElementById('etiquetas').value
            };
            const mensaje = document.getElementById('documentoMensaje');
            mensaje.className = 'mensaje';
            mensaje.style.display = 'none';

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
                        mensaje.textContent = res.data.mensaje || 'Documento guardado correctamente.';
                        mensaje.classList.add('success');
                        cargarDocumentos();
                        setTimeout(() => {
                            document.getElementById('documentoModal').style.display = 'none';
                        }, 1000);
                    } else {
                        mensaje.textContent = res.data.error || 'Error al guardar documento.';
                        mensaje.classList.add('error');
                    }
                    mensaje.style.display = 'block';
                })
                .catch(() => {
                    mensaje.textContent = 'Error de conexión.';
                    mensaje.classList.add('error');
                    mensaje.style.display = 'block';
                });
        });
    }

    // Mostrar/ocultar formulario de subir documento
    const mostrarSubirDocBtn = document.getElementById('mostrarSubirDocBtn');
    if (mostrarSubirDocBtn) {
        mostrarSubirDocBtn.addEventListener('click', function () {
            document.getElementById('subirDocForm').style.display = 'block';
        });
    }
    const cancelarSubirDocBtn = document.getElementById('cancelarSubirDocBtn');
    if (cancelarSubirDocBtn) {
        cancelarSubirDocBtn.addEventListener('click', function () {
            document.getElementById('subirDocForm').reset();
            document.getElementById('subirDocForm').style.display = 'none';
        });
    }

    const subirDocForm = document.getElementById('subirDocForm');
    if (subirDocForm) {
        subirDocForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const formData = new FormData();
            formData.append('archivo', document.getElementById('archivo').files[0]);
            formData.append('nombre', document.getElementById('tituloArchivo').value);
            formData.append('tipo_documento', document.getElementById('tipoArchivo').value);
            formData.append('etiquetas', document.getElementById('etiquetasArchivo').value);

            const mensaje = document.getElementById('docMensaje');
            mensaje.className = 'mensaje';
            mensaje.style.display = 'none';

            try {
                const response = await fetch('/documentos/empresa/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                });
                const result = await response.json();
                if (response.ok) {
                    mensaje.textContent = result.mensaje || 'Documento subido correctamente.';
                    mensaje.classList.add('success');
                    cargarDocumentos();
                    setTimeout(() => {
                        document.getElementById('subirDocForm').reset();
                        document.getElementById('subirDocForm').style.display = 'none';
                    }, 1000);
                } else {
                    mensaje.textContent = result.error || 'Error al subir.';
                    mensaje.classList.add('error');
                }
                mensaje.style.display = 'block';
            } catch {
                mensaje.textContent = 'Error de conexión.';
                mensaje.classList.add('error');
                mensaje.style.display = 'block';
            }
        });
    }

    // ===================== GENERAR Y PREVISUALIZAR PDF =====================
    const listaDocumentos = document.getElementById('listaDocumentos');
    if (listaDocumentos) {
        listaDocumentos.addEventListener('click', function (e) {
            if (e.target.classList.contains('verPdfBtn')) {
                const docId = e.target.getAttribute('data-id');
                fetch(`/documentos/generar-pdf/${docId}/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/pdf'
                    }
                })
                    .then(response => response.blob())
                    .then(blob => {
                        const url = URL.createObjectURL(blob);
                        document.getElementById('pdfPreview').src = url;
                        document.getElementById('descargarPdfBtn').href = url;
                        document.getElementById('pdfModal').style.display = 'flex';
                    });
            }
            // Puedes agregar aquí editar/eliminar documento
            if (e.target.classList.contains('eliminarDocBtn')) {
                const docId = e.target.getAttribute('data-id');
                if (confirm('¿Seguro que deseas eliminar este documento?')) {
                    fetch(`/documentos/empresa/${docId}/`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Accept': 'application/json'
                        }
                    })
                        .then(r => r.json())
                        .then(data => {
                            alert(data.mensaje || 'Documento eliminado');
                            cargarDocumentos();
                        });
                }
            }
            if (e.target.classList.contains('editarDocBtn')) {
                const docId = e.target.getAttribute('data-id');
                fetch(`/documentos/empresa/${docId}/`, {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                })
                    .then(r => r.json())
                    .then(doc => {
                        document.getElementById('documento_id').value = doc.id;
                        document.getElementById('tipo_documento').value = doc.tipo_documento;
                        document.getElementById('titulo').value = doc.nombre;
                        document.getElementById('contenido').value = doc.contenido;
                        document.getElementById('etiquetas').value = doc.etiquetas || '';
                        document.getElementById('documentoModal').style.display = 'flex';
                    });
            }
        });
    }

    const cerrarPdfModalBtn = document.getElementById('cerrarPdfModalBtn');
    if (cerrarPdfModalBtn) {
        cerrarPdfModalBtn.addEventListener('click', function () {
            document.getElementById('pdfModal').style.display = 'none';
            document.getElementById('pdfPreview').src = '';
        });
    }

    // ===================== FILTROS Y BÚSQUEDA =====================
    const busquedaDocumento = document.getElementById('busquedaDocumento');
    if (busquedaDocumento) {
        busquedaDocumento.addEventListener('input', function () {
            cargarDocumentos();
        });
    }
    const tipoDocumentoFiltro = document.getElementById('tipoDocumentoFiltro');
    if (tipoDocumentoFiltro) {
        tipoDocumentoFiltro.addEventListener('change', function () {
            cargarDocumentos();
        });
    }
});