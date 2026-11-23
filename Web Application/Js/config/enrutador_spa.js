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


// ==========================================
// ENRUTADOR: REPORTES DE LOGÍSTICA
// ==========================================
if ($('#ReportesLogisticaTabs').length > 0) {
    $('#ReportesLogisticaTabs .nav-link').off('click').on('click', function (e) {
        e.preventDefault();

        $('#ReportesLogisticaTabs .nav-link').removeClass('active').addClass('text-secondary');
        $(this).removeClass('text-secondary').addClass('active');

        const tabId = $(this).attr('id');

        if (tabId === 'tab-uso-vehiculos') {
            ReporteVehiculosModulo.cargarEn("contenedor-dinamico-reportes-logistica");
        } else if (tabId === 'tab-odometro') {
            ReporteOdometroModulo.cargarEn("contenedor-dinamico-reportes-logistica");
        } else if (tabId === 'tab-mantenimiento') {
            ReporteMantenimientoModulo.cargarEn("contenedor-dinamico-reportes-logistica");
        } else if (tabId === 'tab-consumo-combustible') {
            ReporteCombustibleModulo.cargarEn("contenedor-dinamico-reportes-logistica");
        } else if (tabId === 'tab-rendimiento-viajes') {
            ReporteRendimientoViajesModulo.cargarEn("contenedor-dinamico-reportes-logistica");
        } else if (tabId === 'tab-rendimiento-choferes') {
            ReporteChoferesModulo.cargarEn("contenedor-dinamico-reportes-logistica");
        } else if (tabId === 'tab-pert-logistica') {
            ReportePertLogisticaModulo.cargarEn("contenedor-dinamico-reportes-logistica");
        }
    });

    $('#tab-uso-vehiculos').trigger('click');
}

// ==========================================
// ENRUTADOR: REPORTES DE TRAZABILIDAD
// ==========================================
if ($('#ReportesTrazabilidadTabs').length > 0) {
    $('#ReportesTrazabilidadTabs .nav-link').off('click').on('click', function (e) {
        e.preventDefault();

        $('#ReportesTrazabilidadTabs .nav-link').removeClass('active').addClass('text-secondary');
        $(this).removeClass('text-secondary').addClass('active');

        const tabId = $(this).attr('id');
        const contenedor = "contenedor-dinamico-reportes-trazabilidad";

        if (tabId === 'tab-traz-resumen') {
            ReporteTrazResumenModulo.cargarEn(contenedor);
        } else if (tabId === 'tab-traz-materiales') {
            if (typeof ReporteTrazMaterialesModulo !== 'undefined') {
                ReporteTrazMaterialesModulo.cargarEn(contenedor);
            } else {
                $(`#${contenedor}`).html('<div class="alert alert-info">Módulo <strong>Tipos y Subtipos</strong> en construcción...</div>');
            }
        } else if (tabId === 'tab-traz-origenes') {
            if (typeof ReporteTrazOrigenesModulo !== 'undefined') {
                ReporteTrazOrigenesModulo.cargarEn(contenedor);
            } else {
                $(`#${contenedor}`).html('<div class="alert alert-info">Módulo <strong>Orígenes y Donantes</strong> en construcción...</div>');
            }
        } else if (tabId === 'tab-traz-auditoria') {
            if (typeof ReporteTrazAuditoriaModulo !== 'undefined') {
                ReporteTrazAuditoriaModulo.cargarEn(contenedor);
            } else {
                $(`#${contenedor}`).html('<div class="alert alert-info">Módulo <strong>Auditoría de Lotes</strong> en construcción...</div>');
            }
        } else if (tabId === 'tab-traz-planta') {
            if (typeof ReporteTrazPlantaModulo !== 'undefined') {
                ReporteTrazPlantaModulo.cargarEn(contenedor);
            } else {
                $(`#${contenedor}`).html('<div class="alert alert-info">Módulo <strong>Planta y Salidas</strong> en construcción...</div>');
            }
        }
    });

    $('#tab-traz-resumen').trigger('click');
}



// // ==========================================
// // ENRUTADOR: REPORTES DE LOGÍSTICA
// // ==========================================
// $('#ReportesLogisticaTabs .nav-link').on('click', function (e) {
//     e.preventDefault();

//     // Limpiamos estilos de todas las pestañas
//     $('#ReportesLogisticaTabs .nav-link').removeClass('active').addClass('text-secondary');
//     // Activamos la pestaña seleccionada
//     $(this).removeClass('text-secondary').addClass('active');

//     const tabId = $(this).attr('id');

//     // Enrutador
//     if (tabId === 'tab-uso-vehiculos') {
//         console.log("Preparando módulo Reporte: Uso de Vehículos...");
//         ReporteVehiculosModulo.cargarEn("contenedor-dinamico-reportes-logistica");
//     } else if (tabId === 'tab-odometro') {
//         console.log("Preparando módulo Reporte: Odómetro...");
//         ReporteOdometroModulo.cargarEn("contenedor-dinamico-reportes-logistica");
//     } else if (tabId === 'tab-mantenimiento') {
//         console.log("Preparando módulo Reporte: Mantenimiento Preventivo...");
//         ReporteMantenimientoModulo.cargarEn("contenedor-dinamico-reportes-logistica");
//     } else if (tabId === 'tab-consumo-combustible') {
//         console.log("Preparando módulo Reporte: Consumo de Combustible...");
//         ReporteCombustibleModulo.cargarEn("contenedor-dinamico-reportes-logistica");
//     } else if (tabId === 'tab-rendimiento-viajes') {
//         console.log("Preparando módulo Reporte: Rendimiento de Viajes...");
//         ReporteRendimientoViajesModulo.cargarEn("contenedor-dinamico-reportes-logistica");
//     } else if (tabId === 'tab-rendimiento-choferes') {
//         console.log("Preparando módulo Reporte: Métricas de los choferes...");
//         ReporteChoferesModulo.cargarEn("contenedor-dinamico-reportes-logistica");
//     } else if (tabId === 'tab-pert-logistica') {
//         console.log("Preparando módulo Reporte: Pert Logistica...");
//         ReportePertLogisticaModulo.cargarEn("contenedor-dinamico-reportes-logistica");
//     }
// });

// // Disparamos el click inicial para que cargue el primer gráfico por defecto
// $('#tab-uso-vehiculos').trigger('click');


// // ==========================================
// // ENRUTADOR: REPORTES DE TRAZABILIDAD
// // ==========================================
// if ($('#ReportesTrazabilidadTabs').length > 0) {
//     $('#ReportesTrazabilidadTabs .nav-link').off('click').on('click', function (e) {
//         e.preventDefault();

//         // Limpiamos estilos de todas las pestañas
//         $('#ReportesTrazabilidadTabs .nav-link').removeClass('active').addClass('text-secondary');
//         // Activamos la pestaña seleccionada
//         $(this).removeClass('text-secondary').addClass('active');

//         const tabId = $(this).attr('id');
//         const contenedor = "contenedor-dinamico-reportes-trazabilidad";

//         if (tabId === 'tab-traz-resumen') {
//             console.log("Preparando módulo Reporte Trazabilidad: Resumen y Balance...");
//             ReporteTrazResumenModulo.cargarEn(contenedor);
//         } else if (tabId === 'tab-traz-materiales') {
//             if (typeof ReporteTrazMaterialesModulo !== 'undefined') {
//                 ReporteTrazMaterialesModulo.cargarEn(contenedor);
//             } else {
//                 $(`#${contenedor}`).html('<div class="alert alert-info">Módulo <strong>Tipos y Subtipos</strong> en construcción...</div>');
//             }
//         } else if (tabId === 'tab-traz-origenes') {
//             if (typeof ReporteTrazOrigenesModulo !== 'undefined') {
//                 ReporteTrazOrigenesModulo.cargarEn(contenedor);
//             } else {
//                 $(`#${contenedor}`).html('<div class="alert alert-info">Módulo <strong>Orígenes y Donantes</strong> en construcción...</div>');
//             }
//         } else if (tabId === 'tab-traz-auditoria') {
//             if (typeof ReporteTrazAuditoriaModulo !== 'undefined') {
//                 ReporteTrazAuditoriaModulo.cargarEn(contenedor);
//             } else {
//                 $(`#${contenedor}`).html('<div class="alert alert-info">Módulo <strong>Auditoría de Lotes</strong> en construcción...</div>');
//             }
//         } else if (tabId === 'tab-traz-planta') {
//             if (typeof ReporteTrazPlantaModulo !== 'undefined') {
//                 ReporteTrazPlantaModulo.cargarEn(contenedor);
//             } else {
//                 $(`#${contenedor}`).html('<div class="alert alert-info">Módulo <strong>Planta y Salidas</strong> en construcción...</div>');
//             }
//         }
//     });

//     // Disparamos el click inicial para cargar el primer reporte por defecto
//     $('#tab-traz-resumen').trigger('click');
// }