// 1. OBTENER DATOS DE SESIÓN
const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));

if (!sesion) {
    window.location.href = "../index.html";
}

// 2. CONFIGURACIÓN DEL MAPA DE RUTAS (Qué ROLES entran a qué PÁGINAS)
const rolUsuario = sesion.rol;
const paginaActual = window.location.pathname.split("/").pop();

// Agregamos "Administrador" a todas porque dijimos que él tiene pase libre a todo
const rutasProtegidas = {
    "empleado.html": ["R_Humanos", "Administrador"],

    "traz_material.html": ["Supervisor_Logistica", "Administrador"],

    "traz_empresa.html": ["Supervisor_Logistica", "R_Institucionales", "Administrador"],

    "IngresoYClasificacion.html": ["Supervisor_Gestion", "Operador_Gestion", "Administrador"],

    "SalidasYStock.html": ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"],

    "traz_reportes.html": ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"],

    "registros_trazabilidad.html": ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"],

    "gestion_trazabilidad.html": ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"],

    "log_vehiculo.html": ["Mantenimiento_Vehicular", "Administrador"],

    "HojaRuta.html": ["Coordinador", "Supervisor_Logistica", "Administrador"],

    "registros_logistica.html": ["Coordinador", "Supervisor_Logistica", "Mantenimiento_Vehicular", "R_Institucionales", "Administrador"],

    "reportes_logistica.html": ["Coordinador", "Supervisor_Logistica", "Mantenimiento_Vehicular", "R_Institucionales", "Administrador"],

    "odometro.html": ["Coordinador", "Supervisor_Logistica", "R_Institucionales", "Administrador"],

    "consumoCombustible.html": ["Coordinador", "Supervisor_Logistica", "Mantenimiento_Vehicular", "Administrador"],

    "config_estructura.html": ["Administrador"],

    "config_acceso.html": ["Administrador"]
    // landing.html no está en la lista porque TODOS pueden entrar
};

// 3. MOTOR DE REDIRECCIÓN (Bloqueo de URL)
if (rutasProtegidas[paginaActual]) {
    // Si el rol del usuario NO está en la lista de la página actual, lo expulsamos
    if (!rutasProtegidas[paginaActual].includes(rolUsuario)) {
        alert("⚠️ Acceso Denegado: Tu rol de " + rolUsuario + " no tiene acceso a esta sección.");
        window.location.href = "landing.html";
    }
}

// 4. MOTOR DE RENDERIZADO DEL MENÚ LATERAL (DRY Principle)
document.addEventListener("DOMContentLoaded", () => {



    // Inyección del Token en AJAX (Lo que hicimos en el paso anterior)
    if (sesion && sesion.token) {
        $.ajaxSetup({
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + sesion.token);
            }
        });
    }

    if (sesion) {
        document.getElementById('header-user').textContent = sesion.nombre;
        document.getElementById('header-role').textContent = rolUsuario.replace("_", " ").toUpperCase();

        // Mapa de qué menúes HTML se encienden según el Rol
        const configuracionMenu = [
            { idSidebar: 'sidebar-empleados', idItems: ['pageEmpleado'], roles: ["R_Humanos", "Administrador"] },

            { idSidebar: 'sidebar-logistica', idItems: ['pageRegistrosLog', 'pageReportesLog'], roles: ["R_Institucionales"] },

            { idSidebar: 'sidebar-logistica', idItems: ['pageHojasRuta', 'pageRegistrosLog', 'pageReportesLog'], roles: ["Coordinador", "Supervisor_Logistica", "Mantenimiento_Vehicular", "Administrador"] },

            { idSidebar: 'sidebar-trazabilidad', idItems: ['pageIngresoMaterial', 'pageRegistrosCrud', 'pageReportes', 'pageClasificacion'], roles: ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"] },

            { idSidebar: 'sidebar-configuracion', idItems: ['pageConfigEstructura', 'pageConfigAcceso'], roles: ["Administrador"] }
            // Nota: Agrupé algunos para el ejemplo, debes ajustar los idItems exactos según tu HTML
        ];

        // Bucle mágico: recorremos la configuración y encendemos solo lo que corresponde
        configuracionMenu.forEach(menu => {
            if (menu.roles.includes(rolUsuario)) {
                // Mostramos el contenedor principal (ej: Logística)
                let sidebar = document.getElementById(menu.idSidebar);
                if (sidebar) sidebar.classList.remove('d-none');

                // Mostramos los sub-items específicos (ej: Vehículos, Hoja de Ruta)
                menu.idItems.forEach(idSubItem => {
                    let itemElement = document.getElementById(idSubItem);
                    if (itemElement) itemElement.classList.remove('d-none');
                });
            }
        });

        // =========================================================================
        // 5. MOTOR DE OCULTAMIENTO POR PERMISOS FRONTEND (Feature Toggling)
        // =========================================================================

        aplicarSeguridadDOM();

        // // Asumimos que al hacer el login, guardaste la lista de permisos en tu sesión. 
        // // Si lo llamaste de otra forma, ajusta esta variable (ej. sesion.listaPermisos)
        // const permisosUsuario = sesion.permisos || [];

        // // El "barrendero" busca en TODA la página cualquier elemento que tenga nuestro atributo mágico
        // const elementosProtegidos = document.querySelectorAll('[data-permiso-requerido]');

        // elementosProtegidos.forEach(elemento => {
        //     // Leemos qué permiso pide esta vitrina y lo separamos por comas (por si pide más de uno)
        //     const stringPermisos = elemento.getAttribute('data-permiso-requerido');
        //     const permisosNecesarios = stringPermisos.split(',');

        //     // Verificamos si el usuario tiene AL MENOS UNO (.some) de los permisos requeridos
        //     const tienePermiso = permisosNecesarios.some(permisoRequerido => {
        //         return permisosUsuario.includes(permisoRequerido.trim()); // .trim() limpia espacios extra
        //     });

        //     // Si no tiene el permiso... ¡Magia! Arrancamos el elemento de raíz.
        //     if (!tienePermiso) {
        //         elemento.remove(); // Usamos .remove() en vez de .hide() para que sea imposible inspeccionar el código
        //     }
        // });

    }

});

// =========================================================================
// NUEVA FUNCIÓN GLOBAL: El "Walkie-Talkie" del Guardián
// =========================================================================
window.aplicarSeguridadDOM = function () {
    // Volvemos a leer la sesión por si acaso
    const sesionActual = JSON.parse(localStorage.getItem('usuarioSesion'));
    if (!sesionActual) return;

    const permisosUsuario = sesionActual.permisos || [];

    // El "barrendero" busca en TODO el DOM actual
    const elementosProtegidos = document.querySelectorAll('[data-permiso-requerido]');

    elementosProtegidos.forEach(elemento => {
        const stringPermisos = elemento.getAttribute('data-permiso-requerido');
        const permisosNecesarios = stringPermisos.split(',');

        const tienePermiso = permisosNecesarios.some(permisoRequerido => {
            return permisosUsuario.includes(permisoRequerido.trim());
        });

        if (!tienePermiso) {
            elemento.remove(); // Desaparece sin dejar rastro
        }
    });
};
