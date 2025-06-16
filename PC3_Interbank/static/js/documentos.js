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
    function renderizarDocumentos(documentos) {
        let html = '';
        documentos.forEach(doc => {
            html += `
            <div>
                ${doc.nombre} (${doc.tipo_documento})
                <button class="eliminarDocBtn" data-id="${doc.id}">Eliminar</button>
                <a href="${doc.archivo}" target="_blank">PDF</a>
                <button class="asignarFirmantesBtn" data-id="${doc.id}">Asignar firmantes</button>
            </div>
        `;
        });
        document.getElementById('listaDocumentos').innerHTML = html;
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
                    renderizarDocumentos(data);
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
            const archivoInput = document.getElementById('archivo');
            const tituloInput = document.getElementById('tituloArchivo');
            const tipoInput = document.getElementById('tipoArchivo');
            const etiquetasInput = document.getElementById('etiquetasArchivo');
            const docMensaje = document.getElementById('docMensaje');

            // Validación básica
            if (!archivoInput.files.length || !tituloInput.value || !tipoInput.value) {
                docMensaje.textContent = "Completa todos los campos obligatorios.";
                return;
            }

            const formData = new FormData();
            formData.append('archivo', archivoInput.files[0]);
            formData.append('nombre', tituloInput.value);
            formData.append('tipo_documento', tipoInput.value);
            formData.append('etiquetas', etiquetasInput.value);

            const token = localStorage.getItem('access_token');
            try {
                const response = await fetch('/documentos/empresa/', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    body: formData
                });

                if (response.ok) {
                    docMensaje.textContent = "Documento subido correctamente.";
                    subirDocForm.reset();
                    subirDocForm.style.display = 'none';
                    cargarDocumentos(); // Refresca la lista
                } else {
                    const data = await response.json();
                    docMensaje.textContent = "Error: " + (data.detail || JSON.stringify(data));
                }
            } catch (err) {
                docMensaje.textContent = "Error de red o servidor.";
            }
        });
    }
    let documentoSeleccionado = null;

    // Mostrar modal al hacer clic en "Asignar firmantes"
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('asignarFirmantesBtn')) {
            documentoSeleccionado = e.target.getAttribute('data-id');
            // Cambia aquí la URL por '/users/' o la que corresponda en tu API
            fetch('/users/empresa/', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('access_token')
                }
            })
                .then(r => r.json())
                .then(usuarios => {
                    let html = '';
                    usuarios.forEach(u => {
                        html += `<label><input type="checkbox" name="firmantes" value="${u.id}"> ${u.nombre}</label><br>`;
                    });
                    document.getElementById('listaUsuarios').innerHTML = html;
                    document.getElementById('modalFirmantes').style.display = 'block';
                });
        }
        if (e.target.id === 'cancelarFirmantesBtn') {
            document.getElementById('modalFirmantes').style.display = 'none';
        }
    });

    // Enviar firmantes seleccionados
    document.getElementById('formFirmantes').onsubmit = function (e) {
        e.preventDefault();
        const checkboxes = document.querySelectorAll('input[name="firmantes"]:checked');
        const firmantes = Array.from(checkboxes).map(cb => cb.value);
        console.log({
            documento: documentoSeleccionado,
            firmantes: firmantes
        });
        // Enviar un solo POST con todos los firmantes
        fetch(`/documentos/empresa/${documentoSeleccionado}/firmantes/`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                documento: documentoSeleccionado, // debe ser un número (ID)
                firmantes: firmantes              // debe ser un array de IDs, ej: [2,3,4]
            })
        })
            .then(response => response.json())
            .then(data => {
                alert('Firmantes asignados correctamente.');
                document.getElementById('modalFirmantes').style.display = 'none';
            });
    };

    // ===================== GENERAR Y PREVISUALIZAR PDF =====================
    const listaDocumentos = document.getElementById('listaDocumentos');
    if (listaDocumentos) {
        listaDocumentos.addEventListener('click', function (e) {
            if (e.target.classList.contains('verPdfBtn')) {
                const docId = e.target.getAttribute('data-id');
                // Obtener los datos del documento para acceder a la URL del archivo subido
                fetch(`/documentos/empresa/${docId}/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                })
                    .then(r => r.json())
                    .then(doc => {
                        // Usa la URL del archivo subido
                        document.getElementById('pdfPreview').src = doc.archivo; // o doc.archivo.url si tu API lo retorna así
                        document.getElementById('descargarPdfBtn').href = doc.archivo;
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
    // ===================== EVENTOS DE ELIMINACIÓN DE DOCUMENTOS =====================
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('eliminarDocBtn')) {
            const docId = e.target.getAttribute('data-id');
            if (confirm('¿Seguro que deseas eliminar este documento?')) {
                fetch(`/documentos/empresa/${docId}/`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('access_token')
                    }
                })
                    .then(response => {
                        if (response.ok) {
                            alert('Documento eliminado correctamente.');
                            cargarDocumentos(); // Recarga la lista
                        } else {
                            alert('Error al eliminar el documento.');
                        }
                    });
            }
        }
    });

});