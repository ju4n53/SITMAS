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
    });





// /* ========================================================================
//    SITMAS - Sala de Control (Router SPA)
//    ======================================================================== */

// $(document).ready(function () {
//     // 1. Configuración del Contenedor Principal
//     const ID_CONTENEDOR = 'contenedor-auditoria';

//     // 2. Lógica de Cambio de Pestañas
//     $('.nav-link').on('click', function (e) {
//         e.preventDefault();
        
//         // Quitar la clase activa de todos y ponérsela al clickeado
//         $('.nav-link').removeClass('active');
//         $(this).addClass('active');

//         // Leer a qué módulo quiere ir
//         const moduloSeleccionado = $(this).data('modulo');
//         cargarModulo(moduloSeleccionado);
//     });

//     // 3. Función para orquestar la carga del módulo JS correcto
//     function cargarModulo(modulo) {
//         // Mostrar un pequeño loader mientras se dibuja
//         $(`#${ID_CONTENEDOR}`).html(`
//             <div class="text-center p-5 fade-in">
//                 <div class="spinner-border text-secondary" role="status"></div>
//                 <h5 class="mt-3 text-muted">Cargando datos de auditoría...</h5>
//             </div>
//         `);

//         // Usamos un pequeño delay simulado para que la transición sea suave
//         setTimeout(() => {
//             switch (modulo) {
//                 case 'ingreso':
//                     if (typeof CrudIngresoModulo !== 'undefined') {
//                         CrudIngresoModulo.cargarEn(ID_CONTENEDOR);
//                     } else {
//                         mostrarErrorModulo('Ingresos Generales');
//                     }
//                     break;
//                 case 'detalle':
//                     if (typeof CrudDetalleModulo !== 'undefined') {
//                         CrudDetalleModulo.cargarEn(ID_CONTENEDOR);
//                     } else {
//                         mostrarErrorModulo('Báscula (Detalle)');
//                     }
//                     break;
//                 case 'clasificacion':
//                     if (typeof CrudClasificacionModulo !== 'undefined') {
//                         CrudClasificacionModulo.cargarEn(ID_CONTENEDOR);
//                     } else {
//                         mostrarErrorModulo('Clasificación');
//                     }
//                     break;
//                 case 'salida':
//                     if (typeof CrudSalidaModulo !== 'undefined') {
//                         CrudSalidaModulo.cargarEn(ID_CONTENEDOR);
//                     } else {
//                         mostrarErrorModulo('Salidas y Stock');
//                     }
//                     break;
//             }
//         }, 300);
//     }

//     function mostrarErrorModulo(nombreModulo) {
//         $(`#${ID_CONTENEDOR}`).html(`
//             <div class="alert alert-warning text-center fade-in m-4 p-4">
//                 <i class="fas fa-tools fa-3x mb-3 text-warning"></i>
//                 <h5>Módulo "${nombreModulo}" en Construcción</h5>
//                 <p>El archivo JavaScript de este módulo aún no ha sido implementado o tiene un error de sintaxis.</p>
//             </div>
//         `);
//     }

//     // 4. Inicializar la primera pestaña por defecto al cargar la página
//     cargarModulo('ingreso');
// });