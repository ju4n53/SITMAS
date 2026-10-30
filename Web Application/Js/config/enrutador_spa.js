$(document).ready(function () {

    // Controlador central de navegación
    $('#RegistroTrazabilidadTabs .nav-link').on('click', function (e) {
        e.preventDefault();

        // Limpiamos estilos de todas las pestañas
        $('#RegistroTrazabilidadTabs .nav-link').removeClass('active').addClass('text-secondary');
        // Activamos la pestaña seleccionada
        $(this).removeClass('text-secondary').addClass('active');

        const tabId = $(this).attr('id');

        // Enrutador
        if (tabId === 'tab-ingreso-crud') {
            console.log("Preparando módulo de Ingreso...");
            CrudIngresoModulo.cargarEn("contenedor-dinamico-crud-trazabilidad");
        } else if (tabId === 'tab-detalle-crud') {
            console.log("Preparando módulo de Detalle...");
            CrudDetalleModulo.cargarEn("contenedor-dinamico-crud-trazabilidad");
        } else if (tabId === 'tab-clasificacion-crud') {
            console.log("Preparando módulo de Clasificación...");
            CrudClasificacionModulo.cargarEn("contenedor-dinamico-crud-trazabilidad");
        } else if (tabId === 'tab-salida-crud') {
            console.log("Preparando módulo de Salida...");
            CrudSalidaModulo.cargarEn("contenedor-dinamico-crud-trazabilidad");
        }
    });

    $('#tab-ingreso-crud').trigger('click');






    $('#RegistroPersonalTabs .nav-link').on('click', function (e) {
        e.preventDefault();

        // Limpiamos estilos de todas las pestañas
        $('#RegistroPersonalTabs .nav-link').removeClass('active').addClass('text-secondary');
        // Activamos la pestaña seleccionada
        $(this).removeClass('text-secondary').addClass('active');

        const tabId = $(this).attr('id');

        // Enrutador
        if (tabId === 'tab-empleados-crud') {
            console.log("Preparando módulo de Ingreso...");
            EmpleadoModulo.cargarEn("contenedor-dinamico-crud-personal");
        } else if (tabId === 'tab-registros-crud') {
            console.log("Preparando módulo de Clasificación...");
            RegistrosEmpleadosModulo.cargarEn("contenedor-dinamico-crud-personal");
        } else if (tabId === 'tab-planillas-crud') {
            console.log("Preparando módulo de Salida...");
            // CrudSalidaModulo.cargarEn("contenedor-dinamico-crud-personal");
        }
    });

    $('#tab-empleados-crud').trigger('click');





    $('#RegistroUsuariosTabs .nav-link').on('click', function (e) {
        e.preventDefault();

        // Limpiamos estilos de todas las pestañas
        $('#RegistroUsuariosTabs .nav-link').removeClass('active').addClass('text-secondary');
        // Activamos la pestaña seleccionada
        $(this).removeClass('text-secondary').addClass('active');

        const tabId = $(this).attr('id');

        // Enrutador
        if (tabId === 'tab-usuarios-crud') {
            console.log("Preparando módulo de Ingreso...");
            UsuarioModulo.cargarEn("contenedor-dinamico-crud-usuarios");
        } else if (tabId === 'tab-registros-crud') {
            console.log("Preparando módulo de Clasificación...");
            RegistrosUsuariosModulo.cargarEn("contenedor-dinamico-crud-usuarios");
        } else if (tabId === 'tab-planillas-crud') {
            console.log("Preparando módulo de Salida...");
            // CrudSalidaModulo.cargarEn("contenedor-dinamico-crud-usuarios");
        }
    });

    $('#tab-usuarios-crud').trigger('click');





});


//Renderizado condicional del landing.html

document.addEventListener("DOMContentLoaded", function () {
    const sesionString = localStorage.getItem("usuarioSesion");
    if (sesionString) {
        const sesionActual = JSON.parse(sesionString);

        // Mostramos el contenedor correcto según el rol
        if (sesionActual.rol === "Operador_Logistica") {
            document.getElementById("contenedor-rutas").classList.remove("d-none");
        } else {
            document.getElementById("panel-graficos").classList.remove("d-none");
        }
        if (sesionActual.rol === "R_Institucionales") {
            document.getElementById("panel-graficos").classList.remove("d-none");
        }

        if (sesionActual.rol === "Administrador") {
            document.getElementById("contenedor-rutas").classList.remove("d-none");
            document.getElementById("panel-graficos").classList.remove("d-none");
        }
    }
});


