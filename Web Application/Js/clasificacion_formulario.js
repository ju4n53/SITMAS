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

    // --- ETAPA 1: OCULTAR/MOSTRAR SECCIONES ---
    // Ocultamos todos los contenedores de planilla primero
    $("#pag-1, #pag-2, #pag-clasificacion, #pag-informes").hide();

    // Activamos mediante una estructura condicional el div seleccionado
    if (paso === 1) {
        $("#pag-1").show();
    } else if (paso === 2) {
        $("#pag-2").show();
    } else if (paso === 3) {
        $("#pag-clasificacion").show();
    } else if (paso === 4) {
        $("#pag-informes").show();
        // Aprovechamos el gancho para consultar a la API WebAPI los datos actualizados
        if (typeof cargarInformes === 'function') cargarInformes();
    }

    // --- ETAPA 2: ACTUALIZAR EL VISUAL DE LAS PESTAÑAS (NAV-TABS) ---
    // Reseteamos todas las solapas a su estado inactivo por defecto
    $(".nav-tabs .nav-link").removeClass("active").addClass("text-secondary");

    // Mapeamos el número de paso con el ID físico del botón de la solapa superior
    let idBotonActivo = "";
    switch(paso) {
        case 1: idBotonActivo = "#btn-ingreso"; break;
        case 2: idBotonActivo = "#btn-detalle"; break; // Modificaremos este id en el HTML
        case 3: idBotonActivo = "#btn-clasificacion-tab"; break; // Modificaremos este id en el HTML
        case 4: idBotonActivo = "#btn-informes"; break;
    }

    // Le damos el estilo activo resaltado de Bootstrap a la solapa actual
    $(idBotonActivo).addClass("active").removeClass("text-secondary");
}