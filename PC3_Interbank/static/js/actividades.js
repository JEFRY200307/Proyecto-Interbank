document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('No se encontró el token de acceso.');
        return;
    }

    document.querySelectorAll('.completada-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const li = this.closest('.timeline-item');
            const actividadId = li.dataset.actividadId;
            const isCompleted = this.checked;

            actualizarEstadoActividad(actividadId, isCompleted, token, li);
        });
    });

    function actualizarEstadoActividad(id, completada, token, listItem) {
        fetch(`/api/actividades/${id}/actualizar/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
                'X-CSRFToken': '{{ csrf_token }}' // Necesario si usas CSRF
            },
            body: JSON.stringify({
                completada: completada
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al actualizar la actividad');
            }
            return response.json();
        })
        .then(data => {
            listItem.classList.toggle('completada', data.completada);
        })
        .catch(error => {
            console.error('Error:', error);
            // Si falla, revierte el checkbox a su estado anterior
            const checkbox = listItem.querySelector('.completada-checkbox');
            checkbox.checked = !completada;
            alert('No se pudo actualizar el estado de la actividad.');
        });
    }
});