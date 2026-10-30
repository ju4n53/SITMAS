document.addEventListener("DOMContentLoaded", function() {
    
    // 🔍 Control 1: ¿Puede crear ingresos de material?
    if (!tienePermiso("Personal_Gestion") && !tienePermiso("Usuario_Gestion")) {
        // Si NO tiene el permiso, escondemos el botón por completo
        document.getElementById("pageEmpleado").style.display = "none";
    }
    
    // 🔍 Control 2: ¿Puede modificar pesajes (Rol Supervisor o Gerente)?
    // if (!tienePermiso("TRAZABILIDAD_MODIFICACION")) {
    //     // En vez de esconderlo, podemos deshabilitarlo para que se vea gris
    //     document.getElementById("btnEditar").disabled = true;
    //     document.getElementById("btnEditar").title = "No tienes permisos para modificar datos.";
    // }
    
    // 🔍 Control 3: ¿Puede ver informes estratégicos?
    // if (!tienePermiso("REPORTES_ESTRATEGICOS")) {
    //     document.getElementById("btnReportes").style.display = "none";
    // }
});