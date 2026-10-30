// Variable global para rastrear en qué paso se encuentra el operario
let pasoActual = 1;

$(document).ready(function () {
    // 1. Inicializamos mostrando el primer paso del flujo
    showPag(1);
    
    // 2. Cargamos dinámicamente los datos del usuario logueado desde el localStorage
    const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));
    if (sesion) {
        $("#input-usuario").val(sesion.nombre);
        $("#header-user").text(sesion.nombre);
        $("#header-role").text(sesion.rol.toUpperCase());
    }
});

/**
 * Función unificada para controlar el visor de planillas e informes
 * @param {number} paso - Número de la sección a activar (1 a 4)
 */
function showPag(paso) {
    pasoActual = paso;
    console.log("SITMAS Flujo - Cambiando a paso:", paso);

    // 1. Ocultamos de forma segura todos los contenedores
    $("#pag-1, #pag-2, #pag-clasificacion, #pag-informes").hide();

    // 2. Activamos el contenedor correspondiente
    if (paso === 1) {
        $("#pag-1").show();
    } else if (paso === 2) {
        $("#pag-2").show();
    } else if (paso === 3) {
        $("#pag-clasificacion").show();
    } else if (paso === 4) {
        $("#pag-informes").show();
        // Usamos una validación segura: si la función existe en el entorno, la ejecuta
        if (typeof window.cargarInformes === 'function') {
            window.cargarInformes();
        } else if (typeof window.ListarIngresosHistoricos === 'function') {
            window.ListarIngresosHistoricos();
        }
    }

    // 3. Estilo visual de las solapas superiores
    $(".nav-tabs .nav-link").removeClass("active").addClass("text-secondary");

    let idBotonActivo = "";
    switch(paso) {
        case 1: idBotonActivo = "#btn-ingreso"; break;
        case 2: idBotonActivo = "#btn-detalle"; break;
        case 3: idBotonActivo = "#btn-clasificacion-tab"; break;
        case 4: idBotonActivo = "#btn-informes"; break;
    }

    if (idBotonActivo) {
        $(idBotonActivo).addClass("active").removeClass("text-secondary");
    }
}