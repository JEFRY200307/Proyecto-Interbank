console.log('firmas.js cargado');
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM completamente cargado');
    const token = localStorage.getItem('access_token');
    console.log('Token usado en fetch:', token);
    const rol = localStorage.getItem('rol');
    const titulo = document.getElementById('titulo-firmas');
    const acciones = document.getElementById('acciones-firmas');
    const canvas = document.getElementById('firmaCanvas');
    const signaturePad = new SignaturePad(canvas);


    if (!token || !rol) {
        alert('No hay token o rol en localStorage. Por favor, inicia sesión.');
        return;
    }

    // Ahora editores y lectores pueden firmar
    if (rol === 'lector' || rol === 'editor') {
        titulo.textContent = 'Firmar documentos asignados';
        acciones.innerHTML = `<li><button id="verFirmasBtn">Actualizar lista</button></li>`;
        cargarFirmasPendientes();
        cargarHistorialFirmas();
    } else {
        titulo.textContent = 'Gestión de Firmas';
        acciones.innerHTML = '';
        document.getElementById('pendientesFirma').innerHTML = '<p>No tienes permisos para firmar documentos.</p>';
    }

    let firmaSeleccionada = null;

    function cargarPendientesFirma() {
        console.log('Token usado en fetch:', token);
        fetch('/documentos/firmas/pendientes/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                console.log('Status:', response.status);
                if (response.status === 401) {
                    alert('No autorizado. Tu sesión ha expirado o no tienes permisos.');
                    return [];
                }
                return response.json();
            })
            .then(firmas => {
                console.log('Firmas recibidas:', firmas);
                let html = '';
                if (!firmas || firmas.length === 0) {
                    html = '<p>No tienes documentos pendientes de firma.</p>';
                } else {
                    firmas.forEach(firma => {
                        html += `
                        <div style="margin-bottom: 1em; border-bottom: 1px solid #eee; padding-bottom: 1em;">
                            <b>${firma.documento.nombre}</b> (${firma.documento.tipo_documento})<br>
                            <a href="${firma.documento.archivo}" target="_blank">Ver PDF</a>
                            <button class="abrirFirmarModalBtn" data-id="${firma.id}" data-nombre="${firma.documento.nombre}">Firmar</button>
                        </div>
                    `;
                    });
                }
                document.getElementById('pendientesFirma').innerHTML = html;
            })
            .catch(error => {
                console.error('Error al cargar firmas pendientes:', error);
            });
    }
    // ===================== MODAL DE FIRMA =====================
    function abrirFirmarModal(firmaId, docNombre) {
        document.getElementById('firma_doc_id').value = firmaId;
        document.getElementById('firmaDocInfo').innerText = `Documento: ${docNombre}`;
        document.getElementById('firmaMensaje').innerText = '';
        document.getElementById('claveFirma').value = '';
        document.getElementById('firmarModal').style.display = 'block';

        // Inicializa SignaturePad cada vez que se abre el modal
        const canvas = document.getElementById('firmaCanvas');
        signaturePad = new SignaturePad(canvas);
        document.getElementById('limpiarFirmaBtn').onclick = () => signaturePad.clear();
    }

    function cerrarFirmarModal() {
        document.getElementById('firmarModal').style.display = 'none';
        document.getElementById('firmaMensaje').innerText = '';
        document.getElementById('claveFirma').value = '';
        if (signaturePad) signaturePad.clear();
    }

    // ===================== EVENTOS =====================
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('abrirFirmarModalBtn')) {
            const firmaId = e.target.getAttribute('data-id');
            const docNombre = e.target.getAttribute('data-nombre');
            abrirFirmarModal(firmaId, docNombre);
        }
        if (e.target.id === 'cancelarFirmaBtn') {
            cerrarFirmarModal();
        }
        if (e.target.id === 'verFirmasBtn') {
            cargarFirmasPendientes();
            cargarHistorialFirmas();
        }
    });

    document.getElementById('firmarForm').onsubmit = function (e) {
        e.preventDefault();
        const firmaId = document.getElementById('firma_doc_id').value;
        const clave = document.getElementById('claveFirma').value;
        const firmaImagen = signaturePad && !signaturePad.isEmpty() ? signaturePad.toDataURL() : null;

        fetch(`/documentos/firmas/${firmaId}/firmar/`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clave: clave, firma_imagen: firmaImagen })
        })
            .then(r => r.json())
            .then(data => {
                document.getElementById('firmaMensaje').innerText = data.mensaje || data.error || 'Documento firmado.';
                cargarFirmasPendientes();
                cargarHistorialFirmas();
                setTimeout(cerrarFirmarModal, 1500);
            });
    };
    function cargarFirmasPendientes(pagina = 1) {
        fetch(`/documentos/firmas/pendientes/?page=${pagina}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        })
            .then(r => r.json())
            .then(data => renderTablaFirmas(data, 'pendientesFirma', cargarFirmasPendientes));
    }

    function cargarHistorialFirmas(pagina = 1) {
        fetch(`/documentos/firmas/historial/?page=${pagina}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        })
            .then(r => r.json())
            .then(data => renderTablaFirmas(data, 'historialFirma', cargarHistorialFirmas));
    }

    function renderTablaFirmas(data, contenedorId, cargarPagina) {
        let html = '<table><thead><tr><th>Documento</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>';
        data.results.forEach(firma => {
            html += `<tr>
            <td>${firma.documento.nombre}</td>
            <td>${firma.estado}</td>
            <td>${firma.fecha_firma || '-'}</td>
            <td>
                <a href="${firma.documento.archivo}" target="_blank">Ver PDF</a>
                ${firma.estado === 'pendiente' ? `<button class="abrirFirmarModalBtn" data-id="${firma.id}" data-nombre="${firma.documento.nombre}">Firmar</button>` : ''}
            </td>
        </tr>`;
        });
        html += '</tbody></table>';

        // Paginación
        html += '<div class="paginacion">';
        if (data.previous) html += `<button onclick="(${cargarPagina.name})(${data.current_page - 1})">Anterior</button>`;
        html += ` Página ${data.current_page} de ${data.total_pages} `;
        if (data.next) html += `<button onclick="(${cargarPagina.name})(${data.current_page + 1})">Siguiente</button>`;
        html += '</div>';

        document.getElementById(contenedorId).innerHTML = html;
    }


});