document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login/';
        return;
    }
    // --- Control de interfaz según rol ---
    const rolInterno = localStorage.getItem('rol_interno');
    const titulo = document.getElementById('titulo-documentos');
    const acciones = document.getElementById('acciones-documentos');
    const botonesDoc = document.getElementById('botones-doc');

    if (!rolInterno) return;

    // Oculta todo por defecto
    acciones.innerHTML = '';
    botonesDoc.innerHTML = '';
    document.getElementById('subirDocForm').style.display = 'none';

    // Mostrar el formulario de subir documento a todos los roles autenticados
    document.getElementById('subirDocForm').style.display = 'block';

    if (rolInterno === 'administrador') {
        titulo.textContent = 'Documentos - Administrador';
    } else if (rolInterno === 'representante') {
        titulo.textContent = 'Documentos - Representante Legal';
    } else if (rolInterno === 'socio') {
        titulo.textContent = 'Documentos - Socio/Accionista';
    } else if (rolInterno === 'contador') {
        titulo.textContent = 'Documentos - Contador/Asesor Legal';
    } else if (rolInterno === 'empleado') {
        titulo.textContent = 'Documentos - Empleado Operativo';
    }

    function renderizarDocumentos(documentos) {
        const userId = localStorage.getItem('user_id');
        const rolInterno = localStorage.getItem('rol_interno');
        let htmlSubidos = '';
        let htmlAsignados = '';
        let htmlTodos = '';

        documentos.forEach(doc => {
            // Mostrar firmantes asignados
            let firmantesHtml = '';
            if (doc.firmantes && doc.firmantes.length > 0) {
                firmantesHtml = `<div class="firmantes-lista">
                    <strong>Firmantes:</strong> ${doc.firmantes.map(f => f.nombre).join(', ')}
                </div>`;
            }

            // Determinar si el documento está completamente firmado
            let firmado = false;
            if (doc.firmantes && doc.firmantes.length > 0) {
                firmado = doc.firmantes.every(f => f.estado === 'firmado');
            }

            // Botones según permisos enviados por el backend
            let docHtml = `
            <div class="documento-item">
                <div class="doc-header">
                    <span class="doc-nombre">${doc.nombre}</span>
                    <span class="doc-tipo">(${doc.tipo_documento})</span>
                    <a href="${doc.archivo}" target="_blank" class="doc-pdf-link">Ver PDF</a>
                </div>
                ${firmantesHtml}
                <div class="doc-detalles">
                    ${firmado
                        ? `<span class="doc-estado firmado">Firmado por todos</span>`
                        : `<span class="doc-estado pendiente">Pendiente de firma</span>`
                    }
                </div>
                <div class="doc-actions">
                    ${doc.puede_eliminar ? `<button class="btn-doc eliminarDocBtn" data-id="${doc.id}">Eliminar</button>` : ''}
                    ${doc.puede_asignar_firmantes ? (
                        (!doc.firmantes || doc.firmantes.length === 0)
                            ? `<button class="btn-doc asignarFirmantesBtn" data-id="${doc.id}">Asignar firmantes</button>`
                            : `<button class="btn-doc editarFirmantesBtn" data-id="${doc.id}">Editar firmantes</button>`
                    ) : ''}
                </div>
            </div>
            `;

            // Clasifica el documento
            // Clasificación personal (para todos los roles)
            if (String(doc.creador_id) === String(userId)) {
                htmlSubidos += docHtml;
            }
            if (doc.firmantes && doc.firmantes.some(f => String(f.id) === String(userId))) {
                htmlAsignados += docHtml;
            }

            // Lista global solo para admin
            if (rolInterno === 'administrador') {
                htmlTodos += docHtml;
            }
        });

        // Renderiza según el rol
        if (rolInterno === 'administrador') {
            // Admin ve todo en lista global
            if (document.getElementById('listaDocumentos')) {
                document.getElementById('listaDocumentos').innerHTML = htmlTodos || '<p>No hay documentos en la empresa.</p>';
            }
            // Admin también ve sus documentos subidos y asignados
            if (document.getElementById('misDocumentos')) {
                document.getElementById('misDocumentos').innerHTML = htmlSubidos || '<p>No tienes documentos subidos.</p>';
            }
            if (document.getElementById('documentosAsignados')) {
                document.getElementById('documentosAsignados').innerHTML = htmlAsignados || '<p>No tienes documentos asignados para firmar.</p>';
            }
        } else {
            if (document.getElementById('misDocumentos')) {
                document.getElementById('misDocumentos').innerHTML = htmlSubidos || '<p>No tienes documentos subidos.</p>';
            }
            if (document.getElementById('documentosAsignados')) {
                document.getElementById('documentosAsignados').innerHTML = htmlAsignados || '<p>No tienes documentos asignados para firmar.</p>';
            }
            if (document.getElementById('listaDocumentos')) document.getElementById('listaDocumentos').innerHTML = '';
        }
    }
    // ===================== LISTAR DOCUMENTOS =====================
    function cargarDocumentos() {
        const rolInterno = localStorage.getItem('rol_interno');
        let endpoint = '/documentos/';

        if (rolInterno === 'administrador') {
            endpoint += 'admin/';
        } else if (rolInterno === 'representante') {
            endpoint += 'representante/';
        } else if (rolInterno === 'socio') {
            endpoint += 'socio/';
        } else if (rolInterno === 'contador') {
            endpoint += 'contador/';
        } else if (rolInterno === 'empleado') {
            endpoint += 'empleado/';
        }

        fetch(endpoint, {
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
            // Elimina el renderizado anterior y solo llama a la función de renderizado de secciones
            renderizarDocumentos(data);
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
    // Mostrar modal/popover para asignar/editar firmantes
    let documentoSeleccionado = null;
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('asignarFirmantesBtn') || e.target.classList.contains('editarFirmantesBtn')) {
            const btn = e.target;
            const docId = btn.getAttribute('data-id');
            documentoSeleccionado = docId;
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
                // Muestra el popover cerca del botón
                const popover = document.getElementById('popoverFirmantes');
                popover.style.display = 'block';
                // Posiciona el popover cerca del botón
                const rect = btn.getBoundingClientRect();
                popover.style.top = (window.scrollY + rect.bottom + 8) + 'px';
                popover.style.left = (window.scrollX + rect.left) + 'px';
                // Marca los firmantes ya asignados
                marcarFirmantesAsignados(docId);
            });
        }
        // Ocultar el popover al cancelar
        if (e.target.id === 'cancelarFirmantesBtn') {
            document.getElementById('popoverFirmantes').style.display = 'none';
        }
    });

    // Función para marcar los firmantes ya asignados
    function marcarFirmantesAsignados(docId) {
        fetch(`/documentos/empresa/${docId}/`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(r => r.json())
        .then(doc => {
            if (doc.firmantes) {
                doc.firmantes.forEach(f => {
                    const cb = document.querySelector(`#listaUsuarios input[value="${f.id}"]`);
                    if (cb) cb.checked = true;
                });
            }
        });
    }

    // Enviar firmantes seleccionados
    document.getElementById('formFirmantes').onsubmit = function (e) {
        e.preventDefault();
        const checkboxes = document.querySelectorAll('input[name="firmantes"]:checked');
        const firmantes = Array.from(checkboxes).map(cb => cb.value);
        fetch(`/documentos/empresa/${documentoSeleccionado}/firmantes/`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                documento: documentoSeleccionado,
                firmantes: firmantes
            })
        })
        .then(response => response.json())
        .then(data => {
            alert('Firmantes asignados correctamente.');
            document.getElementById('modalFirmantes').style.display = 'none';
            cargarDocumentos();
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