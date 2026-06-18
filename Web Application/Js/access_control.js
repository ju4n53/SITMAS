// 1. OBTENER DATOS DEL LOCALSTORAGE (Ejecución inmediata)
const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));

// 2. VERIFICACIÓN DE IDENTIDAD: Si no hay datos, afuera sin anestesia
if (!sesion) {
    window.location.href = "../index.html";
}

// Esperamos a que el HTML termine de cargar para tocar las etiquetas de la pantalla
document.addEventListener("DOMContentLoaded", () => {
    
    // 3. ACTUALIZAR HEADER CON DATOS REALES
    if (sesion) {
        document.getElementById('header-user').textContent = sesion.nombre;
        document.getElementById('header-role').textContent = sesion.rol.toUpperCase();
        
        // 🛡️ 4. ENCEndido DINÁMICO POR PERMISOS (¡Adiós acoplamiento por Rol rígido!)
        // Leemos la lista de permisos que inyectamos desde los Stored Procedures
        const permisos = sesion.permisos || [];

        // Si tiene permiso para ver personal, encendemos el sidebar de empleados
        if (permisos.includes("PERSONAL_GESTION")) {
            document.getElementById('sidebar-empleados').classList.remove('d-none');
        }

        // Si tiene permisos de trazabilidad básica o total
        if (permisos.includes("TRAZABILIDAD_LECTURA") || permisos.includes("TRAZABILIDAD_ESCRITURA")) {
            document.getElementById('sidebar-trazabilidad').classList.remove('d-none');
        }

        // Si tiene permisos de logística
        if (permisos.includes("LOGISTICA_LECTURA")) { // Asumiendo este permiso futuro
            document.getElementById('sidebar-logistica').classList.remove('d-none');
        }

        // Si es el Administrador técnico con acceso a las configuraciones
        if (permisos.includes("SISTEMA_CONFIGURACION")) {
            document.getElementById('sidebar-configuracion').classList.remove('d-none');
        }
    }
});



//  // 1. OBTENER DATOS DEL LOCALSTORAGE
//     const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));

//     // 2. VERIFICACIÓN DE IDENTIDAD: Si no hay datos, devolver al login inmediatamente
//     if (!sesion) {
//         window.location.href = "../index.html"; // Ajusta la ruta si index.html está en otra carpeta
//     } else {
//         // 3. ACTUALIZAR HEADER CON LOS DATOS REALES TRASPASADOS DESDE EL LOGIN
//         document.getElementById('header-user').textContent = sesion.nombre;
//         document.getElementById('header-role').textContent = sesion.rol.toUpperCase();
//     }

//     // 4. CONTROL DE ACCESO POR ROL (Opcional pero recomendado)
//     // Si un operario intenta entrar escribiendo la URL a mano, lo rebotamos a la landing
//     if (sesion && sesion.rol !== 'Administrador' && sesion.rol !== 'Supervisor' && sesion.rol !== 'RRHH' && sesion.rol !== 'RRII') {
//         alert('No tiene permisos para acceder a la gestión de empleados.');
//         window.location.href = "landing.html";
//     }

