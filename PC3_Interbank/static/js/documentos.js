document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('access_token');
    const rolInterno = localStorage.getItem('rol_interno');
    const userId = localStorage.getItem('user_id');

    if (!token || !rolInterno) {
        window.location.href = '/login/';
        return;
    }

    // --- ELEMENTOS DEL DOM ---
    const tituloEl = document.getElementById('titulo-documentos');
    const misDocumentosEl = document.getElementById('misDocumentos');
    const documentosAsignadosEl = document.getElementById('documentosAsignados');
    const popoverEl = document.getElementById('popoverFirmantes');
    const formFirmantesEl = document.getElementById('formFirmantes');
    const listaUsuariosEl = document.getElementById('listaUsuarios');
    const subirDocFormEl = document.getElementById('subirDocForm');
    const subirDocContainerEl = document.getElementById('subirDocContainer');
    let documentoSeleccionado = null;

    // --- FUNCIONES ---

    function handleAuthError(response) {
        if (response.status === 401 || response.status === 403) {
            alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
            localStorage.clear();
            window.location.href = '/login/';
            return true;
        }
        return false;
    }

    async function cargarDocumentos() {
        try {
            const response = await fetch('/documentos/empresa/', { headers: { 'Authorization': 'Bearer ' + token } });
            if (handleAuthError(response)) return;
            const documentos = await response.json();
            renderizarDocumentos(documentos);
        } catch (error) {
            console.error("Error al cargar documentos:", error);
        }
    }

    function renderizarDocumentos(documentos) {
        let htmlSubidos = '', htmlAsignados = '';
        documentos.forEach(doc => {
            const firmantesHtml = (doc.firmantes && doc.firmantes.length > 0) ? `<div class="firmantes-lista"><strong>Firmantes:</strong> ${doc.firmantes.map(f => f.nombre).join(', ')}</div>` : '';
            const firmado = doc.firmantes && doc.firmantes.length > 0 && doc.firmantes.every(f => f.estado === 'firmado');
            const estadoHtml = `<span class="doc-estado ${firmado ? 'firmado' : 'pendiente'}">${firmado ? 'Firmado' : 'Pendiente'}</span>`;
            const pdfUrl = doc.archivo_firmado || doc.archivo_firmado_visual || doc.archivo;
            const docBaseHtml = `
                <div class="doc-header">
                    <span class="doc-nombre">${doc.nombre}</span>
                    <span class="doc-tipo">(${doc.tipo_documento})</span>
                    <a href="${pdfUrl}" target="_blank" class="doc-pdf-link">Ver PDF</a>
                </div>
                ${firmantesHtml}
                <div class="doc-detalles">${estadoHtml}</div>
            `;
            if (String(doc.creador_id) === String(userId)) {
                const botonesAccion = `
                    ${doc.puede_eliminar ? `<button class="btn-doc eliminarDocBtn" data-id="${doc.id}">Eliminar</button>` : ''}
                    ${doc.puede_asignar_firmantes ? `<button class="btn-doc asignarFirmantesBtn" data-id="${doc.id}">Asignar/Editar Firmantes</button>` : ''}
                `;
                htmlSubidos += `<div class="documento-item">${docBaseHtml}<div class="doc-actions">${botonesAccion}</div></div>`;
            }
            const miFirma = doc.firmantes ? doc.firmantes.find(f => String(f.id) === String(userId)) : null;
            if (miFirma) {
                const haFirmado = miFirma.estado === 'firmado';
                const botonesAccion = haFirmado
                    ? `<button class="btn-doc" disabled>Firmado</button>`
                    : `<button class="btn-doc firmarDocBtn" data-id="${doc.id}">Firmar</button>`;
                htmlAsignados += `<div class="documento-item">${docBaseHtml}<div class="doc-actions">${botonesAccion}</div></div>`;
            }
        });
        if (misDocumentosEl) misDocumentosEl.innerHTML = htmlSubidos || '<p>No has subido ningún documento.</p>';
        if (documentosAsignadosEl) documentosAsignadosEl.innerHTML = htmlAsignados || '<p>No tienes documentos asignados para firmar.</p>';
    }

    async function mostrarPopoverFirmantes(docId) {
        documentoSeleccionado = docId;
        if (!popoverEl || !listaUsuariosEl) return;
        try {
            const response = await fetch('/users/empresa/', { headers: { 'Authorization': 'Bearer ' + token } });
            if (handleAuthError(response)) return;
            const usuarios = await response.json();
            listaUsuariosEl.innerHTML = usuarios.map(u => `<label><input type="checkbox" name="firmantes" value="${u.id}"> ${u.nombre}</label>`).join('');
            await marcarFirmantesAsignados(docId);
            popoverEl.classList.add('is-visible');
        } catch (error) {
            console.error('Error en fetch de usuarios:', error);
        }
    }

    async function marcarFirmantesAsignados(docId) {
        try {
            const response = await fetch(`/documentos/empresa/${docId}/`, { headers: { 'Authorization': 'Bearer ' + token } });
            if (handleAuthError(response) || !response.ok) return;
            const doc = await response.json();
            if (doc.firmantes && doc.firmantes.length > 0) {
                const firmanteIds = doc.firmantes.map(f => String(f.id));
                document.querySelectorAll('#listaUsuarios input[name="firmantes"]').forEach(cb => cb.checked = firmanteIds.includes(cb.value));
            }
        } catch (error) {
            console.error('Error al marcar firmantes asignados:', error);
        }
    }
    function cerrarPopover() {
        if (popoverEl) popoverEl.classList.remove('is-visible');
    }

    // --- MANEJADORES DE EVENTOS ---

    if (subirDocFormEl) {
        subirDocFormEl.addEventListener('submit', async function (e) {
            e.preventDefault();
            const formData = new FormData(subirDocFormEl);
            if (!formData.get('archivo') || !formData.get('nombre') || !formData.get('tipo_documento')) {
                alert("Por favor, completa todos los campos para subir el documento.");
                return;
            }
            try {
                const response = await fetch('/documentos/empresa/', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token },
                    body: formData
                });
                if (handleAuthError(response)) return;
                if (response.ok) {
                    alert("Documento subido correctamente.");
                    subirDocFormEl.reset();
                    if (subirDocContainerEl) {
                        subirDocContainerEl.style.display = 'none';
                    }
                    cargarDocumentos();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Error al subir el documento.');
                }
            } catch (error) {
                alert(error.message);
            }
        });
    } else {
        console.error("AVISO: No se encontró el formulario con id='subirDocForm'. La subida de archivos no funcionará.");
    }

    if (formFirmantesEl) {
        formFirmantesEl.addEventListener('submit', async function (e) {
            e.preventDefault();
            const firmantes = Array.from(document.querySelectorAll('#listaUsuarios input:checked')).map(cb => parseInt(cb.value, 10));
            try {
                const response = await fetch(`/documentos/empresa/${documentoSeleccionado}/firmantes/`, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ documento: parseInt(documentoSeleccionado, 10), firmantes: firmantes })
                });
                if (handleAuthError(response)) return;
                if (response.ok) {
                    alert('Firmantes asignados correctamente.');
                    cerrarPopover();
                    cargarDocumentos();
                } else {
                    const data = await response.json();
                    throw new Error(data.detail || data.error || 'Error al asignar firmantes.');
                }
            } catch (error) {
                alert(error.message);
            }
        });
    } else {
        console.error("AVISO: No se encontró el formulario con id='formFirmantes'. La asignación de firmantes no funcionará.");
    }

    document.addEventListener('click', async function (e) {
        const target = e.target;

        if (target.closest('#mostrarSubirDocBtn')) {
            if (subirDocContainerEl) subirDocContainerEl.style.display = 'block';
        }
        if (target.closest('#cancelarSubirDocBtn')) {
            if (subirDocContainerEl) subirDocContainerEl.style.display = 'none';
        }
        if (target.closest('.asignarFirmantesBtn')) {
            mostrarPopoverFirmantes(target.closest('.asignarFirmantesBtn').dataset.id);
        }
        if (target.closest('.firmarDocBtn')) {
            const docId = target.closest('.firmarDocBtn').dataset.id;
            window.location.href = `/documentos/dashboard/firmas/`;
        }
        if (target.closest('.eliminarDocBtn')) {
            const docId = target.closest('.eliminarDocBtn').dataset.id;
            if (confirm('¿Estás seguro de que deseas eliminar este documento?')) {
                const response = await fetch(`/documentos/empresa/${docId}/`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (handleAuthError(response)) return;
                if (response.ok) {
                    alert('Documento eliminado.');
                    cargarDocumentos();
                } else {
                    alert('No se pudo eliminar el documento.');
                }
            }
        }
        if (target.closest('#cerrarPopoverBtn') || target.closest('#cancelarFirmantesBtn')) {
            cerrarPopover();
        }
    });

    // --- INICIALIZACIÓN ---
    if (tituloEl) {
        tituloEl.textContent = `Mis Documentos - ${rolInterno.charAt(0).toUpperCase() + rolInterno.slice(1)}`;
    }
    cargarDocumentos();
});