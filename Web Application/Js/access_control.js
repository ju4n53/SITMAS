// 1. OBTENER DATOS DEL LOCALSTORAGE (Ejecución inmediata)
const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));

// 2. VERIFICACIÓN DE IDENTIDAD: Si no hay datos, afuera sin anestesia
if (!sesion) {
    window.location.href = "../index.html";
}

// 🛡️ 3. NUEVO: PROTECCIÓN CONTRA NAVEGACIÓN MANUAL POR URL (Se ejecuta antes de pintar la pantalla)
if (sesion) {
    const permisos = sesion.permisos || [];
    // Obtenemos el nombre del archivo actual, por ejemplo: "empleado.html"
    const paginaActual = window.location.pathname.split("/").pop();

    // Creamos un mapa que dice: "Para ver este archivo, necesitás este permiso"
    const reglasAcceso = {
        "empleado.html": ["Personal_Gestion", "Usuario_Gestion"],
        "traz_material.html": ["Trazabilidad_lecturas", "Trazabilidad_Escritura"],
        "traz_empresa.html": ["Trazabilidad_lecturas", "Trazabilidad_Escritura"],
        "IngresoYClasificacion.html": ["Trazabilidad_lecturas", "Trazabilidad_Escritura"],
        "SalidasYStock.html": ["Trazabilidad_lecturas", "Trazabilidad_Escritura"],
        "log_vehiculo.html": ["Logistica_Lectura"],
        "log_hdr.html": ["Logistica_Lectura"],
        "config_estructura.html": ["Sistema_Config"],
        "config_acceso.html": ["Sistema_Config"]
    };

    // Si la página actual está restringida en nuestro mapa de reglas
    if (reglasAcceso[paginaActual]) {
        // Comprobamos si el usuario tiene al menos UNO de los permisos requeridos
        const tienePermisoRequerido = reglasAcceso[paginaActual].some(p => permisos.includes(p));

        if (!tienePermisoRequerido) {
            // Si no tiene el permiso, lo eyectamos de vuelta al panel principal con un aviso
            alert("⚠️ Acceso Denegado: No cuentas con los permisos necesarios para ingresar a esta sección de SITMAS.");
            window.location.href = "landing.html";
        }
    }
}

// Esperamos a que el HTML termine de cargar para tocar las etiquetas de la pantalla
document.addEventListener("DOMContentLoaded", () => {
    // 4. ACTUALIZAR HEADER CON DATOS REALES
    if (sesion) {
        document.getElementById('header-user').textContent = sesion.nombre;
        document.getElementById('header-role').textContent = sesion.rol.toUpperCase();

        const permisos = sesion.permisos || [];

        // Si tiene permiso para ver personal, encendemos el sidebar de empleados
        if (permisos.includes("Personal_Gestion") || permisos.includes("Usuario_Gestion")) {
            if (document.getElementById('sidebar-empleados')) document.getElementById('sidebar-empleados').classList.remove('d-none');
            if (document.getElementById('pageEmpleado')) document.getElementById('pageEmpleado').classList.remove('d-none');
        }

        // Si tiene permisos de trazabilidad básica o total
        if (permisos.includes("Trazabilidad_lecturas") || permisos.includes("Trazabilidad_Escritura")) {
            if (document.getElementById('sidebar-trazabilidad')) document.getElementById('sidebar-trazabilidad').classList.remove('d-none');
            if (document.getElementById('pageIngresoMaterial')) document.getElementById('pageIngresoMaterial').classList.remove('d-none');
            if (document.getElementById('pageOrigen')) document.getElementById('pageOrigen').classList.remove('d-none');
            if (document.getElementById('pageClasificacion')) document.getElementById('pageClasificacion').classList.remove('d-none');
            if (document.getElementById('pageSalida')) document.getElementById('pageSalida').classList.remove('d-none');
        }

        // Si tiene permisos de logística
        if (permisos.includes("Logistica_Lectura")) {
            if (document.getElementById('sidebar-logistica')) document.getElementById('sidebar-logistica').classList.remove('d-none');
            if (document.getElementById('pageVehiculo')) document.getElementById('pageVehiculo').classList.remove('d-none');
            if (document.getElementById('pageHojasRuta')) document.getElementById('pageHojasRuta').classList.remove('d-none');
        }

        // Si es el Administrador técnico con acceso a las configuraciones
        if (permisos.includes("Sistema_Config")) {
            if (document.getElementById('sidebar-configuracion')) document.getElementById('sidebar-configuracion').classList.remove('d-none');
            if (document.getElementById('pageConfigEstructura')) document.getElementById('pageConfigEstructura').classList.remove('d-none');
            if (document.getElementById('pageConfigAcceso')) document.getElementById('pageConfigAcceso').classList.remove('d-none');
        }
    }
});