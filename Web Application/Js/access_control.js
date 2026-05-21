 // 1. OBTENER DATOS DEL LOCALSTORAGE
    const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));

    // 2. VERIFICACIÓN DE IDENTIDAD: Si no hay datos, devolver al login inmediatamente
    if (!sesion) {
        window.location.href = "../index.html"; // Ajusta la ruta si index.html está en otra carpeta
    } else {
        // 3. ACTUALIZAR HEADER CON LOS DATOS REALES TRASPASADOS DESDE EL LOGIN
        document.getElementById('header-user').textContent = sesion.nombre;
        document.getElementById('header-role').textContent = sesion.rol.toUpperCase();
    }

    // 4. CONTROL DE ACCESO POR ROL (Opcional pero recomendado)
    // Si un operario intenta entrar escribiendo la URL a mano, lo rebotamos a la landing
    if (sesion && sesion.rol !== 'Administrador' && sesion.rol !== 'Supervisor' && sesion.rol !== 'RRHH' && sesion.rol !== 'RRII') {
        alert('No tiene permisos para acceder a la gestión de empleados.');
        window.location.href = "landing.html";
    }

