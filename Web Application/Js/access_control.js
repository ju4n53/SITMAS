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
    if (sesion && sesion.rol !== 'Administrador') {
        alert('No tiene permisos para acceder a la gestión de empleados.');
        window.location.href = "landing.html";
    }


     // 5. LÓGICA DE PERMISOS
    // const configPermisos = {
    //     'Administrador': {
    //         botonesVisibles: ['accion1', 'accion2', 'accion3'],
    //         sidebarVisibles: ['sidebar-empleados', 'sidebar-logistica', 'sidebar-configuracion']
    //     },
    //     'operario': {
    //         botonesVisibles: ['accion1'],
    //         sidebarVisibles: ['sidebar-logistica']
    //     }
    // };

    // function aplicarPermisos(rol) {
    //     const permisos = configPermisos[rol];
    //     if (!permisos) return;

    //     // Ocultar todo por defecto
    //     document.querySelectorAll('.btn-nav').forEach(btn => btn.style.display = 'none');
    //     document.querySelectorAll('.nav-list > li').forEach(item => item.style.display = 'none');

    //     // Mostrar lo que corresponde según el rol
    //     permisos.botonesVisibles.forEach(id => {
    //         const el = document.getElementById(id);
    //         if (el) el.style.display = 'inline-block';
    //     });
    //     permisos.sidebarVisibles.forEach(id => {
    //         const el = document.getElementById(id);
    //         if (el) el.style.display = 'block';
    //     });
    // }

    // // Aplicamos permisos basados en el rol guardado
    // aplicarPermisos(sesion.rol);

    // Lógica de dropdowns del menú lateral
    // document.querySelectorAll('.dropdown').forEach(item => {
    //     item.addEventListener('click', (e) => {
    //         // Evitamos que el click se propague si es necesario
    //         item.classList.toggle('active');
    //     });
    // });