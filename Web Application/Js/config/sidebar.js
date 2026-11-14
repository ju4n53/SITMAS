// js/components/sidebar.js

const MENU_SITMAS = [
    {
        esDropdown: false,
        titulo: "INICIO",
        icono: "home",
        url: "../Pages/landing.html",
        roles: ["TODOS"]
    },
    {
        esDropdown: true,
        idCollapse: "gl",
        titulo: "LOGÍSTICA",
        icono: "local_shipping",
        subItems: [
            { texto: "Hojas de Ruta", url: "../Pages/HojaRuta.html", roles: ["Coordinador", "Supervisor_Logistica", "Administrador"] },
            { texto: "Registros", url: "../Pages/registros_logistica.html", roles: ["Coordinador", "Supervisor_Logistica", "Mantenimiento_Vehicular", "R_Institucionales", "Administrador"] },
            { texto: "Reportes", url: "../Pages/reportes_logistica.html", roles: ["Coordinador", "Supervisor_Logistica", "Mantenimiento_Vehicular", "R_Institucionales", "Administrador"] }
        ]
    },
    {
        esDropdown: true,
        idCollapse: "gt",
        titulo: "TRAZABILIDAD",
        icono: "sync",
        subItems: [
            { texto: "Gestión", url: "../Pages/gestion_trazabilidad.html", roles: ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"] },
            { texto: "Registros", url: "../Pages/registros_trazabilidad.html", roles: ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"] },
            { texto: "Reportes", url: "../Pages/reportes_trazabilidad.html", roles: ["Supervisor_Gestion", "Operador_Gestion", "Coordinador", "R_Institucionales", "Administrador"] }
        ]
    },
    {
        esDropdown: true,
        idCollapse: "gp",
        titulo: "PERSONAL",
        icono: "group",
        subItems: [
            { texto: "Empleados", url: "../Pages/personal_gestion.html", roles: ["R_Humanos", "Administrador"] },
            { texto: "Usuarios", url: "../Pages/usuarios_gestion.html", roles: ["R_Humanos", "Administrador"] }
        ]
    },
    {
        esDropdown: true,
        idCollapse: "gc",
        titulo: "CONFIGURACIÓN",
        icono: "settings",
        subItems: [
            { texto: "General", url: "../Pages/config_estructura.html", roles: ["Administrador"] },
            { texto: "Accesos", url: "../Pages/config_acceso.html", roles: ["Administrador"] },
            { texto: "Vehículos", url: "../Pages/log_vehiculo.html", roles: ["Mantenimiento_Vehicular", "Administrador"] },
            { texto: "Materiales", url: "../Pages/traz_material.html", roles: ["Supervisor_Logistica", "Administrador"] }
        ]
    }
];

function renderizarSidebar() {
    const contenedorAside = document.getElementById("sidebar-principal");
    if (!contenedorAside) return;

    // Leemos la sesión capturada en localStorage
    const sesion = JSON.parse(localStorage.getItem("usuarioSesion"));
    if (!sesion || !sesion.rol) return;

    const rolActual = sesion.rol;
    const archivoActual = window.location.pathname.split("/").pop();
    let htmlAcumulado = "";

    MENU_SITMAS.forEach(modulo => {
        // CASO 1: Enlace directo (ej. INICIO)
        if (!modulo.esDropdown) {
            const tieneAcceso = modulo.roles.includes("TODOS") || modulo.roles.includes(rolActual);
            if (tieneAcceso) {
                const esActivo = modulo.url.endsWith(archivoActual) ? "active fw-bold" : "";
                htmlAcumulado += `
                    <li class="nav-item">
                        <a class="nav-link d-flex align-items-center ${esActivo}" href="${modulo.url}">
                            <span class="material-symbols-outlined">${modulo.icono}</span>
                            <span class="menu-text">${modulo.titulo}</span>
                        </a>
                    </li>
                `;
            }
            return;
        }

        // CASO 2: Menú desplegable con sub-items
        // Filtramos solo los hijos que el rol actual tiene permitidos
        const subItemsPermitidos = modulo.subItems.filter(sub => sub.roles.includes(rolActual));

        // Si el usuario tiene permiso para ver al menos 1 sub-item, dibujamos el bloque padre
        if (subItemsPermitidos.length > 0) {
            // Verificamos si el usuario está parado en alguna página de este grupo para dejarlo abierto
            const algunHijoActivo = subItemsPermitidos.some(sub => sub.url.endsWith(archivoActual));
            const claseCollapse = algunHijoActivo ? "collapse show" : "collapse";

            let htmlSubItems = "";
            subItemsPermitidos.forEach(sub => {
                const esSubActivo = sub.url.endsWith(archivoActual) ? "active fw-bold text-primary" : "";
                htmlSubItems += `
                    <a class="nav-link small ps-4 ${esSubActivo}" href="${sub.url}">${sub.texto}</a>
                `;
            });

            htmlAcumulado += `
                <li class="nav-item dropdown">
                    <a data-bs-toggle="collapse" class="nav-link d-flex align-items-center" href="#${modulo.idCollapse}" aria-expanded="${algunHijoActivo}">
                        <span class="material-symbols-outlined">${modulo.icono}</span>
                        <span class="menu-text">${modulo.titulo}</span>
                    </a>
                    <div id="${modulo.idCollapse}" class="${claseCollapse}">
                        ${htmlSubItems}
                    </div>
                </li>
            `;
        }
    });

    // Inyectamos el árbol completo en un solo movimiento del DOM (mejor rendimiento)
    contenedorAside.innerHTML = `<ul class="nav flex-column nav-list pt-3">${htmlAcumulado}</ul>`;
}

document.addEventListener("DOMContentLoaded", renderizarSidebar);