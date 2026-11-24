// =========================================================================
// CONTROL DE ACCESO CENTRALIZADO - SITMAS (EMEC)
// =========================================================================
(function () {
    "use strict";

    // Evita parpadeo visual de contenido protegido antes de validar
    document.documentElement.style.visibility = "hidden";

    // 1. OBTENER Y VALIDAR SESIÓN
    let sesion = null;
    try {
        sesion = JSON.parse(localStorage.getItem("usuarioSesion"));
    } catch (e) {
        localStorage.removeItem("usuarioSesion");
    }

    const paginaActual = window.location.pathname.split("/").pop() || "index.html";

    if (!sesion || !sesion.rol) {
        if (paginaActual !== "index.html") {
            window.location.replace("index.html"); // ajustá a "../index.html" solo si tus vistas viven dentro de /pages/
        }
        return; // Corta la ejecución inmediatamente
    }

    const rolUsuario = sesion.rol;
    const ES_ADMIN = rolUsuario === "Administrador";

    // 2. CONFIGURACIÓN DEL MAPA DE RUTAS (Qué ROLES entran a qué PÁGINAS)
    const rutasProtegidas = {
        "personal_gestion.html": ["R_Humanos", "Administrador"],
        "usuarios_gestion.html": ["R_Humanos", "Administrador"],

        "traz_material.html": ["Supervisor_Logistica", "Administrador"],
        "traz_empresa.html": ["Supervisor_Logistica", "R_Institucionales", "Administrador"],
        "registros_trazabilidad.html": ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"],
        "gestion_trazabilidad.html": ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"],
        "reportes_trazabilidad.html": ["Coordinador", "Supervisor_Gestion", "Director", "R_Institucionales", "Administrador"],

        "HojaRuta.html": ["Coordinador", "Supervisor_Logistica", "Administrador"],
        "registros_logistica.html": ["Coordinador", "Director", "Supervisor_Logistica", "Mantenimiento_Vehicular", "R_Institucionales", "Administrador"],
        "reportes_logistica.html": ["Coordinador", "Supervisor_Logistica", "Director", "Mantenimiento_Vehicular", "R_Institucionales", "Administrador"],

        "config_estructura.html": ["Administrador"],
        "config_acceso.html": ["Administrador"]
    };

    // 3. MOTOR DE REDIRECCIÓN (Bloqueo de URL)
    if (rutasProtegidas[paginaActual] && !rutasProtegidas[paginaActual].includes(rolUsuario)) {
        sessionStorage.setItem("errorAcceso", `Tu rol (${rolUsuario.replaceAll("_", " ")}) no tiene acceso a esta sección.`);
        window.location.replace("landing.html");
        return;
    }

    // Si pasó el control de ruta, habilitamos el renderizado de la página
    document.documentElement.style.visibility = "visible";

    // 4. INYECCIÓN DE TOKEN Y MANEJO GLOBAL DE ERRORES DE AUTORIZACIÓN (jQuery)
    if (window.jQuery) {
        $.ajaxSetup({
            beforeSend: function (xhr) {
                if (sesion && sesion.token) {
                    xhr.setRequestHeader("Authorization", "Bearer " + sesion.token);
                }
            }
        });

        $(document).ajaxError(function (_event, jqXHR) {
            if (jqXHR.status === 401) {
                localStorage.removeItem("usuarioSesion");
                window.location.replace("index.html");
            } else if (jqXHR.status === 403 && window.Swal) {
                Swal.fire({
                    icon: "error",
                    title: "Acción no autorizada",
                    text: "El servidor rechazó la operación por falta de permisos."
                });
            }
        });
    }

    // 5. MOTOR DE RENDERIZADO DEL MENÚ LATERAL Y DATOS DE CABECERA
    document.addEventListener("DOMContentLoaded", () => {
        // Si venimos rebotados de una URL prohibida, mostramos aviso elegante
        const msgError = sessionStorage.getItem("errorAcceso");
        if (msgError) {
            sessionStorage.removeItem("errorAcceso");
            if (window.Swal) {
                Swal.fire({ icon: "warning", title: "Acceso denegado", text: msgError });
            } else {
                alert("⚠️ " + msgError);
            }
        }

        const headerUser = document.getElementById("header-user");
        const headerRole = document.getElementById("header-role");
        if (headerUser) headerUser.textContent = sesion.nombre || "Usuario";
        if (headerRole) headerRole.textContent = rolUsuario.replaceAll("_", " ").toUpperCase();

        // Mapa de qué menúes HTML se encienden según el Rol
        const configuracionMenu = [
            { idSidebar: "sidebar-personal", idItems: ["pagePersonal", "pageUsuarios"], roles: ["R_Humanos", "Administrador"] },
            { idSidebar: "sidebar-logistica", idItems: ["pageRegistrosLog", "pageReportesLog"], roles: ["Director","R_Institucionales"] },
            { idSidebar: "sidebar-logistica", idItems: ["pageHojasRuta", "pageRegistrosLog", "pageReportesLog"], roles: ["Coordinador", "Supervisor_Logistica", "Mantenimiento_Vehicular", "Administrador"] },
            { idSidebar: "sidebar-trazabilidad", idItems: ["pageIngresoMaterial", "pageRegistrosCrud", "pageReportes", "pageClasificacion"], roles: ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"] },
            { idSidebar: "sidebar-reportes", idItems: ["pageReportesLogis", "pageReportesTrazab"], roles: ["Supervisor_Gestion", "Coordinador", "Director", "R_Institucionales", "Administrador"] },
            { idSidebar: "sidebar-configuracion", idItems: ["pageConfigEstructura", "pageConfigAcceso"], roles: ["Administrador"] }
        ];

        configuracionMenu.forEach((menu) => {
            if (menu.roles.includes(rolUsuario)) {
                const sidebar = document.getElementById(menu.idSidebar);
                if (sidebar) sidebar.classList.remove("d-none");

                menu.idItems.forEach((idSubItem) => {
                    const itemElement = document.getElementById(idSubItem);
                    if (itemElement) itemElement.classList.remove("d-none");
                });
            }
        });

        window.aplicarSeguridadDOM();
    });

    // =========================================================================
    // FUNCIÓN GLOBAL: "Barrendero" de acciones granulares en el DOM
    // =========================================================================
    window.aplicarSeguridadDOM = function (contenedor = document) {
        const sesionActual = JSON.parse(localStorage.getItem("usuarioSesion"));
        if (!sesionActual) return;

        // El Administrador pasa directo sin que le borren botones
        if (sesionActual.rol === "Administrador") return;

        const permisosUsuario = Array.isArray(sesionActual.permisos) ? sesionActual.permisos : [];
        const elementosProtegidos = contenedor.querySelectorAll("[data-permiso-requerido]");

        elementosProtegidos.forEach((elemento) => {
            const stringPermisos = elemento.getAttribute("data-permiso-requerido");
            const permisosNecesarios = stringPermisos.split(",");

            const tienePermiso = permisosNecesarios.some((permisoRequerido) =>
                permisosUsuario.includes(permisoRequerido.trim())
            );

            if (!tienePermiso) {
                elemento.remove();
            }
        });
    };

    // Exponemos utilidades limpias para landing.html y los dashboards
    window.AccessControl = {
        getSesion: () => sesion,
        getRol: () => rolUsuario,
        tieneRol: (rolesPermitidos) => ES_ADMIN || rolesPermitidos.includes(rolUsuario)
    };
})();






// // 1. OBTENER DATOS DE SESIÓN
// const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));

// if (!sesion) {
//     window.location.href = "../index.html";
// }

// // 2. CONFIGURACIÓN DEL MAPA DE RUTAS (Qué ROLES entran a qué PÁGINAS)
// const rolUsuario = sesion.rol;
// const paginaActual = window.location.pathname.split("/").pop();

// // Agregamos "Administrador" a todas porque dijimos que él tiene pase libre a todo
// const rutasProtegidas = {
//     "personal_gestion.html": ["R_Humanos", "Administrador"],

//     "usuarios_gestion.html": ["R_Humanos", "Administrador"],

//     "traz_material.html": ["Supervisor_Logistica", "Administrador"],

//     "traz_empresa.html": ["Supervisor_Logistica", "R_Institucionales", "Administrador"],

//     //"IngresoYClasificacion.html": ["Supervisor_Gestion", "Operador_Gestion", "Administrador"],

//     //"SalidasYStock.html": ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"],

//     //"traz_reportes.html": ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"],

//     "registros_trazabilidad.html": ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"],

//     "gestion_trazabilidad.html": ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"],

//     //"log_vehiculo.html": ["Mantenimiento_Vehicular", "Administrador"],

//     "HojaRuta.html": ["Coordinador", "Supervisor_Logistica", "Administrador"],

//     "registros_logistica.html": ["Coordinador", "Supervisor_Logistica", "Mantenimiento_Vehicular", "R_Institucionales", "Administrador"],

//     "reportes_logistica.html": ["Coordinador", "Supervisor_Logistica", "Mantenimiento_Vehicular", "R_Institucionales", "Administrador"],

//      "reportes_trazabilidad.html": ["Coordinador", "Supervisor_Gestion", "Director", "R_Institucionales", "Administrador"],

//     //"odometro.html": ["Coordinador", "Supervisor_Logistica", "R_Institucionales", "Administrador"],

//     //"consumoCombustible.html": ["Coordinador", "Supervisor_Logistica", "Mantenimiento_Vehicular", "Administrador"],

//     "config_estructura.html": ["Administrador"],

//     "config_acceso.html": ["Administrador"]
//     // landing.html no está en la lista porque TODOS pueden entrar
// };

// // 3. MOTOR DE REDIRECCIÓN (Bloqueo de URL)
// if (rutasProtegidas[paginaActual]) {
//     // Si el rol del usuario NO está en la lista de la página actual, lo expulsamos
//     if (!rutasProtegidas[paginaActual].includes(rolUsuario)) {
//         alert("⚠️ Acceso Denegado: Tu rol de " + rolUsuario + " no tiene acceso a esta sección.");
//         window.location.href = "landing.html";
//     }
// }

// // 4. MOTOR DE RENDERIZADO DEL MENÚ LATERAL (DRY Principle)
// document.addEventListener("DOMContentLoaded", () => {



//     // Inyección del Token en AJAX (Lo que hicimos en el paso anterior)
//     if (sesion && sesion.token) {
//         $.ajaxSetup({
//             beforeSend: function (xhr) {
//                 xhr.setRequestHeader('Authorization', 'Bearer ' + sesion.token);
//             }
//         });
//     }

//     if (sesion) {
//         document.getElementById('header-user').textContent = sesion.nombre;
//         document.getElementById('header-role').textContent = rolUsuario.replace("_", " ").toUpperCase();

//         // Mapa de qué menúes HTML se encienden según el Rol
//         const configuracionMenu = [
//             { idSidebar: 'sidebar-personal', idItems: ['pagePersonal', 'pageUsuarios'], roles: ["R_Humanos", "Administrador"] },

//             { idSidebar: 'sidebar-logistica', idItems: ['pageRegistrosLog', 'pageReportesLog'], roles: ["R_Institucionales"] },

//             { idSidebar: 'sidebar-logistica', idItems: ['pageHojasRuta', 'pageRegistrosLog', 'pageReportesLog'], roles: ["Coordinador", "Supervisor_Logistica", "Mantenimiento_Vehicular", "Administrador"] },

//             { idSidebar: 'sidebar-trazabilidad', idItems: ['pageIngresoMaterial', 'pageRegistrosCrud', 'pageReportes', 'pageClasificacion'], roles: ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"] },

//             { idSidebar: 'sidebar-reportes', idItems: ['pageReportesLogis', 'pageReportesTrazab'], roles: ["Supervisor_Gestion", "Coordinador", "R_Institucionales", "Administrador"] },

//             { idSidebar: 'sidebar-configuracion', idItems: ['pageConfigEstructura', 'pageConfigAcceso'], roles: ["Administrador"] }
//             // Nota: Agrupé algunos para el ejemplo, debes ajustar los idItems exactos según tu HTML
//         ];

//         // Bucle mágico: recorremos la configuración y encendemos solo lo que corresponde
//         configuracionMenu.forEach(menu => {
//             if (menu.roles.includes(rolUsuario)) {
//                 // Mostramos el contenedor principal (ej: Logística)
//                 let sidebar = document.getElementById(menu.idSidebar);
//                 if (sidebar) sidebar.classList.remove('d-none');

//                 // Mostramos los sub-items específicos (ej: Vehículos, Hoja de Ruta)
//                 menu.idItems.forEach(idSubItem => {
//                     let itemElement = document.getElementById(idSubItem);
//                     if (itemElement) itemElement.classList.remove('d-none');
//                 });
//             }
//         });

//         aplicarSeguridadDOM();

//     }

// });

// // =========================================================================
// // FUNCIÓN GLOBAL:"Comunicador" de guardia
// // =========================================================================
// window.aplicarSeguridadDOM = function () {
//     // Volvemos a leer la sesión por si acaso
//     const sesionActual = JSON.parse(localStorage.getItem('usuarioSesion'));
//     if (!sesionActual) return;

//     const permisosUsuario = sesionActual.permisos || [];

//     // El "barrendero" busca en TODO el DOM actual
//     const elementosProtegidos = document.querySelectorAll('[data-permiso-requerido]');

//     elementosProtegidos.forEach(elemento => {
//         const stringPermisos = elemento.getAttribute('data-permiso-requerido');
//         const permisosNecesarios = stringPermisos.split(',');

//         const tienePermiso = permisosNecesarios.some(permisoRequerido => {
//             return permisosUsuario.includes(permisoRequerido.trim());
//         });

//         if (!tienePermiso) {
//             elemento.remove(); // Desaparece sin dejar rastro
//         }
//     });
// };
