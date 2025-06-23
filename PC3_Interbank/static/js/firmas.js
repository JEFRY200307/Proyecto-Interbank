console.log('firmas.js cargado');
function getCacheBustedUrl(url) {
    if (!url || url === '#') return '#';
    return `${url}?v=${Date.now()}`;
}
document.addEventListener('DOMContentLoaded', function () {
    if (document.body.dataset.firmasInitialized) return;
    document.body.dataset.firmasInitialized = 'true';
    const token = localStorage.getItem('access_token');
    const rolInterno = localStorage.getItem('rol_interno');
    const titulo = document.getElementById('titulo-firmas');
    const acciones = document.getElementById('acciones-firmas');
    let pdfDoc = null;
    let currentPage = 1;
    let totalPages = 1;
    let lastViewport = null;
    let firmaPosicion = { page: 1, x: 0, y: 0 };
    let signaturePad = null;
    let lastClickedFirmarBtn = null;


    function cargarFirmasPendientes(pagina = 1) {
        fetch(`/documentos/firmas/pendientes/?page=${pagina}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        })
            .then(r => r.json())
            .then(data => renderTablaFirmas(data, 'pendientesFirmaBody'));
    }

    function cargarHistorialFirmas(pagina = 1) {
        fetch(`/documentos/firmas/historial/?page=${pagina}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        })
            .then(r => r.json())
            .then(data => renderTablaFirmas(data, 'historialFirmaBody'));
    }

    function renderTablaFirmas(data, tbodyId) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) {
            console.error(`Error: No se encontró el elemento con ID "${tbodyId}".`);
            return;
        }

        const firmas = data.results || data || [];
        let rowsHtml = '';
        const userNombre = localStorage.getItem('nombre');

        if (firmas.length === 0) {
            rowsHtml = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No hay documentos en esta sección.</td></tr>';
        } else {
            firmas.forEach(firma => {
                const puedeFirmar = firma.estado === 'pendiente' && (firma.firmante_nombre || '').trim().toLowerCase() === (userNombre || '').trim().toLowerCase();
                const baseUrl = firma.documento ? (firma.documento.archivo_firmado || firma.documento.archivo_firmado_visual || firma.documento.archivo) : '#';
                const pdfUrl = getCacheBustedUrl(baseUrl);
                rowsHtml += `<tr>
                    <td>${firma.documento ? firma.documento.nombre : 'N/A'}</td>
                    <td>${firma.estado}</td>
                    <td>${firma.fecha_firma ? new Date(firma.fecha_firma).toLocaleString() : '-'}</td>
                    <td>
                        <a href="${pdfUrl}" target="_blank" class="btn-link">Ver PDF</a>
                        ${puedeFirmar ? `<button class="abrirFirmarModalBtn" data-id="${firma.id}" data-nombre="${firma.documento.nombre}">Firmar</button>` : ''}
                    </td>
                </tr>`;
            });
        }
        tbody.innerHTML = rowsHtml;
    }

    // ===================== MODAL DE FIRMA =====================
    function abrirFirmarModal(firmaId, docNombre) {
        try {
            // --- PASO 1: PREPARAR EL MODAL ---
            document.getElementById('firma_doc_id').value = firmaId;
            document.getElementById('firmaDocInfo').innerText = `Documento: ${docNombre}`;

            // --- PASO 2: VERIFICAR Y PREPARAR EL CANVAS DE FIRMA ---
            const canvas = document.getElementById('firmaCanvas');
            if (!canvas) {
                throw new Error("El elemento 'firmaCanvas' no se encuentra en el HTML.");
            }
            if (typeof SignaturePad === 'undefined') {
                throw new Error("La librería de firma (SignaturePad) no se pudo cargar. Revisa la conexión o un posible bloqueador de scripts.");
            }
            signaturePad = new SignaturePad(canvas);
            signaturePad.onEnd = () => renderPage(currentPage);

            // --- PASO 3: MOSTRAR EL MODAL (SÓLO SI TODO LO ANTERIOR FUNCIONÓ) ---
            document.getElementById('firmarModal').classList.add('is-visible');

            // --- PASO 4: CARGAR EL DOCUMENTO ---
            fetch(`/documentos/firmas/${firmaId}/`, { headers: { 'Authorization': 'Bearer ' + token } })
                .then(r => {
                    if (!r.ok) throw new Error(`Error de red al obtener el documento: ${r.statusText}`);
                    return r.json();
                })
                .then(firma => {
                    const baseUrl = firma.documento.archivo_firmado_visual || firma.documento.archivo;
                    const pdfUrl = getCacheBustedUrl(baseUrl);
                    return mostrarPDFenCanvas(pdfUrl);
                })
                .catch(error => {
                    console.error("Error al cargar el PDF en el canvas:", error);
                    const container = document.getElementById('pdfPreviewContainer');
                    container.innerHTML = `<p style="color: red; padding: 20px;">No se pudo cargar el documento. Error: ${error.message}</p>`;
                });

        } catch (error) {
            // --- CAPTURA CUALQUIER ERROR Y MUESTRA UN MENSAJE CLARO ---
            console.error("Error crítico al abrir el modal de firma:", error);
            alert(`No se pudo abrir el modal de firma:\n\n${error.message}`);

            // MUY IMPORTANTE: Restaura el botón a su estado original si algo falla.
            cerrarFirmarModal();
        }
    }

    function cerrarFirmarModal() {
        document.getElementById('firmarModal').classList.remove('is-visible');
        if (signaturePad) signaturePad.clear();
        if (lastClickedFirmarBtn) {
            lastClickedFirmarBtn.disabled = false;
            lastClickedFirmarBtn.textContent = 'Firmar';
            lastClickedFirmarBtn = null;
        }
    }

    // ===================== PDF.js PREVIEW Y POSICIÓN =====================
    function mostrarPDFenCanvas(pdfUrl) {
        // --- CORRECCIÓN: La función ahora devuelve una Promesa ---
        return new Promise((resolve, reject) => {
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            pdfjsLib.getDocument(pdfUrl).promise.then(function (pdf) {
                pdfDoc = pdf;
                totalPages = pdf.numPages;
                currentPage = 1;
                renderPage(currentPage);
                resolve(pdf); // Resuelve la promesa si todo va bien
            }).catch(function (error) {
                reject(error); // Rechaza la promesa si hay un error
            });
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
            lastClickedFirmarBtn = e.target;
            lastClickedFirmarBtn.disabled = true;
            lastClickedFirmarBtn.textContent = 'Cargando...';
            abrirFirmarModal(e.target.dataset.id, e.target.dataset.nombre);
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
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ clave, firma_imagen: firmaImagen, firma_posicion: firmaPosicion })
        }).then(r => r.json()).then(data => {
            alert(data.mensaje || data.error);
            if (!data.error) {
                cargarFirmasPendientes();
                cargarHistorialFirmas();
                cerrarFirmarModal();
            }
        })
            // --- CORRECCIÓN: Se añade un bloque .finally para reactivar el botón de firma
            // incluso si la petición falla.
            .finally(() => {
                btn.disabled = false;
                btn.textContent = 'Firmar Documento';
            });
    };

    // Carga inicial
    cargarFirmasPendientes();
    cargarHistorialFirmas();
});