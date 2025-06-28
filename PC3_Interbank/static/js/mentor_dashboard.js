// Variables globales para el estado de la UI
let empresaSeleccionadaId = null;
let estrategiasEditadas = {};
let actividadesEditadas = {};
const token = localStorage.getItem('access_token');

// --- INICIALIZACIÓN Y EVENTOS PRINCIPALES ---
document.addEventListener('DOMContentLoaded', function() {
    if (!token) {
        console.error('No se encontró token de acceso. Redirigiendo al login.');
        window.location.href = '/login/';
        return;
    }
    cargarEmpresasAsignadas();
    configurarModalSolicitudes();
});

// --- LÓGICA DEL MODAL DE SOLICITUDES ---
function configurarModalSolicitudes() {
    const modal = document.getElementById('solicitudesModal');
    const btn = document.getElementById('verSolicitudesBtn');
    const span = document.querySelector('#solicitudesModal .close-button');

    btn.onclick = () => {
        modal.style.display = "block";
        cargarSolicitudes();
    };
    span.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

async function cargarSolicitudes() {
    const container = document.getElementById('solicitudes-container');
    container.innerHTML = '<p>Cargando...</p>';
    const response = await fetch('/mentor/api/empresas-solicitan/', { headers: { 'Authorization': `Bearer ${token}` } });
    if (response.ok) {
        const empresas = await response.json();
        container.innerHTML = empresas.length === 0 ? '<p>No hay nuevas solicitudes de mentoría.</p>' :
            empresas.map(e => `
                <div class="tarjeta-solicitud">
                  <h3>${e.razon_social}</h3>
                  <p><strong>RUC:</strong> ${e.ruc}</p>
                  <button class="btn btn-success" onclick="aceptarMentoria(${e.id})">Aceptar mentoría</button>
                </div>
            `).join('');
    } else {
        container.innerHTML = `<p>Error al cargar las solicitudes.</p>`;
    }
}

async function aceptarMentoria(empresaId) {
    if (!confirm('¿Estás seguro de que deseas aceptar la mentoría?')) return;
    try {
        const response = await fetch(`/mentor/api/empresas/${empresaId}/aceptar_mentoria/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        alert(data.mensaje || '¡Mentoría aceptada!');
        location.reload();
    } catch (error) {
        alert('Hubo un error al aceptar la mentoría.');
    }
}

// --- LÓGICA DE GESTIÓN DE EMPRESAS (TU CÓDIGO ORIGINAL) ---

async function cargarEmpresasAsignadas() {
    const container = document.getElementById('empresas-tarjetas-container');
    const res = await fetch('/mentor/api/empresas/', { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.ok) {
        const empresas = await res.json();
        container.innerHTML = empresas.length > 0 ?
            empresas.map(e => `
                <div class="tarjeta-empresa" onclick="mostrarDetalleEmpresa(${e.id})">
                    <h4>${e.razon_social}</h4>
                    <p>${e.ruc}</p>
                </div>
            `).join('') : '<p>No tienes empresas asignadas.</p>';
    } else {
        container.innerHTML = '<p>Error al cargar empresas.</p>';
    }
}

async function mostrarDetalleEmpresa(empresaId) {
    empresaSeleccionadaId = empresaId;
    document.getElementById('empresas-tarjetas-container').style.display = 'none';
    document.getElementById('detalle-empresa-panel').style.display = 'block';
    const res = await fetch(`/mentor/api/empresas/${empresaId}/`, { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.ok) {
        const data = await res.json();
        document.getElementById('detalle-empresa-nombre').textContent = data.razon_social;
        document.getElementById('detalle-empresa-ruc').textContent = `RUC: ${data.ruc}`;
    }
}

function cerrarDetalleEmpresa() {
    document.getElementById('detalle-empresa-panel').style.display = 'none';
    document.getElementById('empresas-tarjetas-container').style.display = 'block';
    empresaSeleccionadaId = null;
}

function mostrarEstrategiasEmpresa() {
    document.getElementById('detalle-empresa-panel').style.display = 'none';
    document.getElementById('panel-estrategias-empresa').style.display = 'block';
    cargarEstrategiasEmpresa(empresaSeleccionadaId);
}

function cerrarPanelEstrategiasEmpresa() {
    document.getElementById('panel-estrategias-empresa').style.display = 'none';
    document.getElementById('detalle-empresa-panel').style.display = 'block';
}

async function cargarEstrategiasEmpresa(empresaId) {
    const container = document.getElementById('tabla-estrategias-container');
    const res = await fetch(`/mentor/api/empresas/${empresaId}/`, { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.ok) {
        const data = await res.json();
        document.getElementById('nombre-empresa-estrategias').textContent = data.razon_social;
        container.innerHTML = `
            <table class="tabla-mentor">
                <thead><tr><th>Título</th><th>Categoría</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${data.estrategias.map(est => `
                        <tr>
                            <td><input type="text" value="${est.titulo}" onchange="editarCampoEstrategia(${est.id}, 'titulo', this.value)"></td>
                            <td><input type="text" value="${est.categoria}" onchange="editarCampoEstrategia(${est.id}, 'categoria', this.value)"></td>
                            <td><input type="text" value="${est.estado}" onchange="editarCampoEstrategia(${est.id}, 'estado', this.value)"></td>
                            <td>
                                <button class="btn btn-secondary" onclick="guardarEstrategia(${est.id})">Guardar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    }
}

function editarCampoEstrategia(id, campo, valor) {
    if (!estrategiasEditadas[id]) estrategiasEditadas[id] = {};
    estrategiasEditadas[id][campo] = valor;
}

async function guardarEstrategia(id) {
    if (!estrategiasEditadas[id]) {
        alert("No hay cambios para guardar.");
        return;
    }
    const res = await fetch(`/mentor/api/empresas/${empresaSeleccionadaId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ estrategias: [{ id, ...estrategiasEditadas[id] }] })
    });
    if (res.ok) {
        alert('Estrategia guardada con éxito.');
        delete estrategiasEditadas[id];
    } else {
        alert('Error al guardar la estrategia.');
    }
}