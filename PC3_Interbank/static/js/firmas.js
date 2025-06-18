console.log('firmas.js cargado');
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('access_token');
    const rol = localStorage.getItem('rol');
    const titulo = document.getElementById('titulo-firmas');
    const acciones = document.getElementById('acciones-firmas');
    let pdfDoc = null;
    let currentPage = 1;
    let totalPages = 1;
    let lastViewport = null;
    let firmaPosicion = { page: 1, x: 0, y: 0 };
    let signaturePad = null;


    if (!token || !rol) {
        alert('No hay token o rol en localStorage. Por favor, inicia sesión.');
        return;
    }

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
        const firmas = data.results || data || [];
        let html = '<table><thead><tr><th>Documento</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>';
        firmas.forEach(firma => {
            // Si está firmado, muestra el PDF firmado; si no, el original
            const pdfUrl = firma.estado === 'firmado'
                ? (firma.documento.archivo_firmado || firma.documento.archivo)
                : firma.documento.archivo;
            html += `<tr>
            <td>${firma.documento.nombre}</td>
            <td>${firma.estado}</td>
            <td>${firma.fecha_firma || '-'}</td>
            <td>
                <a href="${pdfUrl}" target="_blank">Ver PDF</a>
                ${firma.estado === 'pendiente' ? `<button class="abrirFirmarModalBtn" data-id="${firma.id}" data-nombre="${firma.documento.nombre}">Firmar</button>` : ''}
            </td>
        </tr>`;
        });
        html += '</tbody></table>';
        document.getElementById(contenedorId).innerHTML = html;
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

        // ASIGNA onEnd AQUÍ:
        signaturePad.onEnd = function () {
            renderPage(currentPage); // Redibuja cuando se termina de dibujar la firma
        };

        document.getElementById('limpiarFirmaBtn').onclick = () => {
            signaturePad.clear();
            renderPage(currentPage);
        };
        // Reinicia la posición de la firma
        firmaPosicion = { page: 1, x: 0, y: 0 };

        // Carga el PDF para previsualización
        fetch(`/documentos/firmas/${firmaId}/`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
            .then(r => r.json())
            .then(firma => {
                const pdfUrl = firma.documento.archivo_firmado || firma.documento.archivo;
                mostrarPDFenCanvas(pdfUrl);
            });
    }

    function cerrarFirmarModal() {
        document.getElementById('firmarModal').style.display = 'none';
        document.getElementById('firmaMensaje').innerText = '';
        document.getElementById('claveFirma').value = '';
        if (signaturePad) signaturePad.clear();
    }

    // ===================== PDF.js PREVIEW Y POSICIÓN =====================
    function mostrarPDFenCanvas(pdfUrl) {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        pdfjsLib.getDocument(pdfUrl).promise.then(function (pdf) {
            pdfDoc = pdf;
            totalPages = pdf.numPages;
            currentPage = 1;
            renderPage(currentPage);
        });
    }

    function renderPage(pageNum) {
        pdfDoc.getPage(pageNum).then(function (page) {
            const canvas = document.getElementById('pdfPreview');
            const ctx = canvas.getContext('2d');
            const viewport = page.getViewport({ scale: 1.0 });
            lastViewport = viewport; // Guarda el viewport para usarlo en el click
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            page.render(renderContext).promise.then(() => {
                // Si hay firma visual y posición seleccionada en esta página, dibújala
                if (
                    firmaPosicion &&
                    firmaPosicion.page === currentPage &&
                    signaturePad &&
                    !signaturePad.isEmpty()
                ) {
                    const img = new window.Image();
                    img.onload = function () {
                        // Invertir Y para previsualización
                        const y_canvas = canvas.height - (firmaPosicion.y * (canvas.height / lastViewport.height));
                        ctx.drawImage(img, firmaPosicion.x, y_canvas - 60, 120, 60); // 60 es la altura de la firma
                    };
                    img.src = signaturePad.toDataURL();
                }
            });

            document.getElementById('pageInfo').innerText = `Página ${pageNum} de ${totalPages}`;
        });
    }

    document.getElementById('prevPageBtn').onclick = function () {
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPage);
        }
    };
    document.getElementById('nextPageBtn').onclick = function () {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage(currentPage);
        }
    };

    document.getElementById('pdfPreview').onclick = function (e) {
        const canvas = this;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Usa el tamaño real del canvas y del PDF (viewport)
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const pdfWidth = lastViewport.width;
        const pdfHeight = lastViewport.height;

        // Escala correctamente X e invierte Y
        const x_pdf = x * (pdfWidth / canvasWidth);
        const y_pdf = pdfHeight - (y * (pdfHeight / canvasHeight));

        firmaPosicion = { page: currentPage, x: x_pdf, y: y_pdf };
        renderPage(currentPage); // Redibuja la previsualización con la firma en la posición correcta
    };

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
            body: JSON.stringify({
                clave: clave,
                firma_imagen: firmaImagen,
                firma_posicion: firmaPosicion
            })
        })
            .then(r => r.json())
            .then(data => {
                document.getElementById('firmaMensaje').innerText = data.mensaje || data.error || 'Documento firmado.';
                cargarFirmasPendientes();
                cargarHistorialFirmas();
                setTimeout(cerrarFirmarModal, 1500);
            });
    };

    // Carga inicial
    cargarFirmasPendientes();
    cargarHistorialFirmas();
});