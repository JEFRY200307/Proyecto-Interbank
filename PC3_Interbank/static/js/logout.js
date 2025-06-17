function logout() {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');

    fetch('/empresas/logout/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access
        },
        body: JSON.stringify({ refresh })
    })
    .then(response => {
        // Borra los tokens del almacenamiento local
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('rol');
        localStorage.removeItem('nombre');
        // Redirige al login
        window.location.href = '/login/';
    })
    .catch(() => {
        // En caso de error, igual borra los tokens y redirige
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('rol');
        localStorage.removeItem('nombre');
        window.location.href = '/login/';
    });
}
