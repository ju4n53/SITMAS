/* ==========================================================================
   SITMAS - Módulo: Detalle Hoja de Ruta (Paradas) - Lógica de Interfaz
   Tecnologías: JavaScript (ES6+), jQuery, AJAX, Bootstrap 5
   ========================================================================== */

const URL_API_DETALLE = "https://localhost:44325/api/detallehojaruta";
const URL_API_HDR_LISTA = "https://localhost:44325/api/hojaruta";

// Endpoints auxiliares para los Combos
const URL_API_TIPO_MOV = "https://localhost:44325/api/tipomovimientos";
const URL_API_RECURSOS = "https://localhost:44325/api/recursosmovilizados";
const URL_API_ORIGEN = "https://localhost:44325/api/Origen";
const URL_API_MATERIAL = "https://localhost:44325/api/TP_Material/ListarTodo";
const URL_API_ESTADO_PARADA = "https://localhost:44325/api/EST_HDR/ListarTodo";

// 📍 Coordenadas de Referencia Base (Ej: Sede EMEC / Punto de Partida predeterminado)
const EMEC_LAT = -31.465829;
const EMEC_LON = -64.127313;

// Variables globales en memoria para almacenamiento temporal de alto rendimiento
let listaParadasMemoria = [];
let listaOrigenesMemoria = []; // Almacena la lista de orígenes con sus coordenadas (Latitud/Longitud)

$(document).ready(function () {
    // 1. Cargamos todos los combos de la sección de detalles en paralelo
    CargarCombosAuxiliaresDetalle();

    // 2. Único punto de captura del submit del formulario
    $("#formDetalle").on("submit", function (e) {
        e.preventDefault();
        GuardarDetalle(); // Al ser asíncrona, esperará la resolución del ruteo OSRM
    });
});

/* ==========================================================================
   1. CARGA DE COMBOS AUXILIARES (DESPLEGABLES)
   ========================================================================== */

function CargarCombosAuxiliaresDetalle() {
    return Promise.all([
        CargarComboHojasRuta(),
        CargarComboTipoMovimientos(),
        CargarComboRecursosMov(),
        CargarComboOrigen(),
        CargarComboTipoMaterial(),
        CargarComboEstadoParada()
    ]).catch(err => {
        console.error("SITMAS - Error al cargar combos auxiliares de detalles:", err);
    });
}

function CargarComboHojasRuta() {
    return $.ajax({
        type: "GET",
        url: URL_API_HDR_LISTA,
        dataType: "json",
        success: function (data) {
            const $select =$("#dt_id_hoja_ruta");
            if ($select.length === 0) return;

            $select.empty().append('<option value="">Seleccione Hoja de Ruta</option>');
            if (Array.isArray(data)) {
                data.forEach(item => {
                    $select.append(`<option value="${item.Id}">N° ${item.Id} - ${item.FechaFormateada || ''} (${item.Vehiculo || ''})</option>`);
                });
            }
        }
    });
}

function CargarComboTipoMovimientos() {
    return $.ajax({
        type: "GET",
        url: URL_API_TIPO_MOV,
        dataType: "json",
        success: function (data) {
            const $select =$("#dt_id_tipo_mov");
            $select.empty().append('<option value="">Seleccione Tipo de Movimiento</option>');
            data.forEach(v => {
                $select.append(`<option value="${v.IdTipoMovimientos}">${v.IdTipoMovimientos} - ${v.TipoMovimientos}</option>`);
            });
        }
    });
}

function CargarComboRecursosMov() {
    return $.ajax({
        type: "GET",
        url: URL_API_RECURSOS,
        dataType: "json",
        success: function (data) {
            const $select =$("#dt_id_recurso_mov");
            $select.empty().append('<option value="">Seleccione recurso</option>');
            data.forEach(v => {
                $select.append(`<option value="${v.IdRecursoMov}">${v.IdRecursoMov} - ${v.Recurso_Movilizado}</option>`);
            });
        }
    });
}

function CargarComboOrigen() {
    return $.ajax({
        type: "GET",
        url: URL_API_ORIGEN,
        dataType: "json",
        success: function (data) {
            listaOrigenesMemoria = data || []; // 💡 Guardamos los objetos de origen completos (con Lat/Lon) en memoria
            const $select =$("#dt_id_origen");
            $select.empty().append('<option value="">Seleccione lugar </option>');
            data.forEach(v => {
                $select.append(`<option value="${v.IdOrigen}">${v.IdOrigen} - ${v.EmpresaInstitucion}</option>`);
            });
        }
    });
}

function CargarComboTipoMaterial() {
    return $.ajax({
        type: "GET",
        url: URL_API_MATERIAL,
        dataType: "json",
        success: function (data) {
            const $select =$("#dt_id_tipo_material");
            $select.empty().append('<option value="">Seleccione material</option>');
            data.forEach(v => {
                $select.append(`<option value="${v.IdTipoMaterial}">${v.IdTipoMaterial} - ${v.TipoMaterial}</option>`);
            });
        }
    });
}

function CargarComboEstadoParada() {
    return $.ajax({
        type: "GET",
        url: URL_API_ESTADO_PARADA,
        dataType: "json",
        success: function (data) {
            const $select =$("#dt_id_estado");
            $select.empty().append('<option value="">Seleccione Estado</option>');
            data.forEach(v => {
                $select.append(`<option value="${v.Id}">${v.Id} - ${v.EstadoHojaRuta}</option>`);
            });
        }
    });
}

/* ==========================================================================
   2. SELECCIÓN DE HOJA DE RUTA PADRE (DESDE LA TABLA CABECERA)
   ========================================================================== */

function GestionarParadas(idHojaRuta) {
    if (!idHojaRuta || idHojaRuta <= 0) return;

    $("#hdr_id_seleccionado").val(idHojaRuta);
    LimpiarFormularioDetalle();

    // Seteamos la Hoja de Ruta activa en el selector
    $("#dt_id_hoja_ruta").val(idHojaRuta);

    $("#seccionDetalle h2").text(`📍 Paradas / Detalles de Hoja de Ruta #${idHojaRuta}`);
    ObtenerPorHojaRuta(idHojaRuta);

    $("html, body").animate({ scrollTop: $("#seccionDetalle").offset().top - 50 }, 400);
}

/* ==========================================================================
   3. SERVICIO AUXILIAR DE RUTEO (OSRM API)
   ========================================================================== */

/**
 * Consulta el motor de ruteo OSRM para obtener la distancia vial real entre dos puntos.
 * Nota: OSRM espera las coordenadas en formato (Longitud, Latitud).
 */
async function CalcularDistanciaRuta(latOrigen, lonOrigen, latDestino, lonDestino) {
    if (!latOrigen || !lonOrigen || !latDestino || !lonDestino) return 0;

    const urlOSRM = `https://router.project-osrm.org/route/v1/driving/${lonOrigen},${latOrigen};${lonDestino},${latDestino}?overview=false`;

    try {
        const respuesta = await fetch(urlOSRM);
        const datos = await respuesta.json();

        if (datos.code === "Ok" && datos.routes && datos.routes.length > 0) {
            // OSRM devuelve la distancia en metros; convertimos a kilómetros con 2 decimales
            return parseFloat((datos.routes[0].distance / 1000).toFixed(2));
        }
    } catch (error) {
        console.warn("SITMAS - No se pudo conectar con OSRM para calcular la distancia:", error);
    }
    return 0;
}

/* ==========================================================================
   4. OPERACIONES CRUD DE DETALLES
   ========================================================================== */

function ObtenerPorHojaRuta(idHojaRuta) {
    $.ajax({
        type: "GET",
        url: `${URL_API_DETALLE}/hojaruta/${idHojaRuta}`,
        dataType: "json",
        success: function (lista) {
            listaParadasMemoria = lista || [];
            const $tbody =$("#tbodyDetallesHDR");
            $tbody.empty();

            if (!listaParadasMemoria || listaParadasMemoria.length === 0) {
                $tbody.append('<tr><td colspan="9" class="text-center text-muted">No hay paradas registradas para esta Hoja de Ruta.</td></tr>');
                return;
            }

            listaParadasMemoria.forEach(item => {
                const tr = `
                    <tr>
                        <td><strong>#${item.Id_Detalle_HDR}</strong></td>
                        <td><span class="badge bg-secondary">HR #${item.Id_HojaRuta}</span></td>
                        <td>${item.TipoMovimiento || 'N/A'}</td>
                        <td>${item.RecursoMovilizado || 'N/A'}</td>
                        <td>
                            ${item.Origen || 'N/A'} 
                            <br>
                            <small class="text-primary fw-bold">📏 ${item.DistanciaDesdeAnterior_Km || '0'} Km</small>
                        </td>
                        <td>${item.TipoMaterial || 'N/A'}</td>
                        <td><span class="badge bg-info text-dark">${item.HoraEstimadaFormateada || 'N/A'}</span></td>
                        <td><span class="badge bg-success">${item.EstadoRecorrido || 'Pendiente'}</span></td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarDetalleParaEditar(${item.Id_Detalle_HDR})" title="Editar Parada">
                                ✏️
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="EliminarDetalle(${item.Id_Detalle_HDR})" title="Borrar Parada">
                                🗑️
                            </button>
                        </td>
                    </tr>`;
                $tbody.append(tr);
            });
        },
        error: function (err) {
            console.error("SITMAS - Error al obtener detalles:", err);
            mostrarAlerta("❌ Error al listar las paradas de la Hoja de Ruta.", "danger");
        }
    });
}

async function GuardarDetalle() {
    const idDetalle = $("#dt_id").val();
    const idHojaRutaPadre = $("#hdr_id_seleccionado").val();
    const esModificacion = idDetalle && parseInt(idDetalle) > 0;

    // Permitimos reasignar la parada a otra Hoja de Ruta si el usuario la cambió en el combo
    const idHojaRutaDestino = parseInt($("#dt_id_hoja_ruta").val()) || parseInt(idHojaRutaPadre);
    const idOrigenSeleccionado = parseInt($("#dt_id_origen").val()) || 0;

    if (!idHojaRutaDestino || idHojaRutaDestino <= 0) {
        mostrarAlerta("Debe seleccionar una Hoja de Ruta válida.", "warning");
        return;
    }

    // ----------------------------------------------------------------------
    // 🔍 CÁLCULO DE PUNTOS A Y B PARA RUTEO VIAL
    // ----------------------------------------------------------------------
    let latAnterior = EMEC_LAT;
    let lonAnterior = EMEC_LON;

    // Punto A: Si ya existen paradas cargadas, tomamos las coordenadas de la última registrada
    if (listaParadasMemoria.length > 0) {
        const ultimaParada = listaParadasMemoria[listaParadasMemoria.length - 1];
        if (ultimaParada.Latitud && ultimaParada.Longitud) {
            latAnterior = parseFloat(ultimaParada.Latitud);
            lonAnterior = parseFloat(ultimaParada.Longitud);
        }
    }

    // Punto B: Buscamos las coordenadas del origen seleccionado dentro de nuestra memoria caché
    let latNueva = 0;
    let lonNueva = 0;
    if (idOrigenSeleccionado > 0) {
        const origenElegido = listaOrigenesMemoria.find(o => o.IdOrigen === idOrigenSeleccionado);
        if (origenElegido && origenElegido.Latitud && origenElegido.Longitud) {
            latNueva = parseFloat(origenElegido.Latitud);
            lonNueva = parseFloat(origenElegido.Longitud);
        }
    }

    // Calculamos los kilómetros en tiempo real llamando al motor de mapas
    let kmCalculados = await CalcularDistanciaRuta(latAnterior, lonAnterior, latNueva, lonNueva);

    // ----------------------------------------------------------------------
    // 📦 CONSTRUCCIÓN DEL DTO DE ENVÍO
    // ----------------------------------------------------------------------
    const dto = {
        Id_Detalle_HDR: esModificacion ? parseInt(idDetalle) : 0,
        Id_HojaRuta: idHojaRutaDestino,
        Id_TipoMovimiento: parseInt($("#dt_id_tipo_mov").val()) || 0,
        Id_RecursoMov: parseInt($("#dt_id_recurso_mov").val()) || 0,
        Id_Origen: idOrigenSeleccionado,
        Id_TipoMaterial: parseInt($("#dt_id_tipo_material").val()) || 0,
        HoraEstimada: $("#dt_hora_estimada").val() ? $("#dt_hora_estimada").val() + ":00" : "00:00:00",
        Id_Estado: parseInt($("#dt_id_estado").val()) || 0,
        DistanciaDesdeAnterior_Km: kmCalculados
    };

    if (dto.Id_TipoMovimiento <= 0) {
        mostrarAlerta("Debe seleccionar el Tipo de Movimiento.", "warning");
        return;
    }

    const tipoMetodo = esModificacion ? "PUT" : "POST";
    const urlEndpoint = esModificacion ? `${URL_API_DETALLE}/${idDetalle}` : URL_API_DETALLE;

    $.ajax({
        type: tipoMetodo,
        url: urlEndpoint,
        data: JSON.stringify(dto),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function () {
            const msj = esModificacion 
                ? `✅ Parada actualizada correctamente (${kmCalculados} Km calculados).` 
                : `✅ Parada agregada con éxito (${kmCalculados} Km calculados).`;
            
            mostrarAlerta(msj, "success");

            LimpiarFormularioDetalle();
            ObtenerPorHojaRuta(idHojaRutaPadre); // Refresco en tiempo real de la hoja actual
        },
        error: function (err) {
            console.error("SITMAS - Error al guardar detalle:", err);
            mostrarAlerta("❌ No se pudo guardar la parada.", "danger");
        }
    });
}

function CargarDetalleParaEditar(idDetalle) {
    const parada = listaParadasMemoria.find(p => p.Id_Detalle_HDR === idDetalle);

    if (!parada) {
        mostrarAlerta("No se encontraron los datos de la parada seleccionada.", "error");
        return;
    }

    // Cargar los identificadores exactos mapeados desde el backend
    $("#dt_id").val(parada.Id_Detalle_HDR);
    $("#dt_id_hoja_ruta").val(parada.Id_HojaRuta || "");
    $("#dt_id_tipo_mov").val(parada.Id_TipoMovimiento || "");
    $("#dt_id_recurso_mov").val(parada.Id_RecursoMov || "");
    $("#dt_id_origen").val(parada.Id_Origen || "");
    $("#dt_id_tipo_material").val(parada.Id_TipoMaterial || "");
    $("#dt_id_estado").val(parada.Id_Estado || "");

    // Formatear HoraEstimada (HH:MM:SS) a formato HH:MM para <input type="time">
    if (parada.HoraEstimadaFormateada) {
        const partesHora = parada.HoraEstimadaFormateada.split(":");
        if (partesHora.length >= 2) {
            $("#dt_hora_estimada").val(`${partesHora[0]}:${partesHora[1]}`);
        }
    }

    // Cambiar la apariencia del botón a modo edición
    $("#btnGuardarDetalle").text("💾 Actualizar Parada").removeClass("btn-primary").addClass("btn-warning");

    // Desplazamiento suave al formulario
    $("html, body").animate({ scrollTop: $("#formDetalle").offset().top - 70 }, 300);
}

function EliminarDetalle(idDetalle) {
    const idHojaRutaPadre = $("#hdr_id_seleccionado").val();

    confirmarAccion(
        "¿Eliminar Parada?",
        `⚠️ ¿Está seguro de eliminar la parada #${idDetalle}?`,
        function () {
            $.ajax({
                type: "DELETE",
                url: `${URL_API_DETALLE}/${idDetalle}`,
                dataType: "json",
                success: function () {
                    mostrarAlerta(`Parada #${idDetalle} eliminada con éxito.`, "info");

                    if ($("#dt_id").val() == idDetalle) {
                        LimpiarFormularioDetalle();
                    }

                    ObtenerPorHojaRuta(idHojaRutaPadre);
                },
                error: function (err) {
                    console.error("SITMAS - Error al borrar detalle:", err);
                    mostrarAlerta("No se pudo eliminar la parada seleccionada.", "danger");
                }
            });
        }
    );
}

function LimpiarFormularioDetalle() {
    const idHojaRutaActual = $("#hdr_id_seleccionado").val();

    $("#dt_id").val("0");
    $("#dt_id_hoja_ruta").val(idHojaRutaActual || "");
    $("#dt_id_tipo_mov").val("");
    $("#dt_id_recurso_mov").val("");
    $("#dt_id_origen").val("");
    $("#dt_id_tipo_material").val("");
    $("#dt_hora_estimada").val("");
    $("#dt_id_estado").val("");

    $("#btnGuardarDetalle").text("Guardar Parada").removeClass("btn-warning").addClass("btn-primary");
}



// /* ==========================================================================
//    SITMAS - Módulo: Detalle Hoja de Ruta (Paradas) - Lógica de Interfaz
//    Tecnologías: JavaScript (ES6+), jQuery, AJAX, Bootstrap 5
//    ========================================================================== */

// const URL_API_DETALLE = "https://localhost:44325/api/detallehojaruta";
// const URL_API_HDR_LISTA = "https://localhost:44325/api/hojaruta";

// // Endpoints auxiliares para los Combos
// const URL_API_TIPO_MOV = "https://localhost:44325/api/tipomovimientos";
// const URL_API_RECURSOS = "https://localhost:44325/api/recursosmovilizados";
// const URL_API_ORIGEN = "https://localhost:44325/api/Origen/ListarTodo";
// const URL_API_MATERIAL = "https://localhost:44325/api/TP_Material/ListarTodo";
// const URL_API_ESTADO_PARADA = "https://localhost:44325/api/EST_HDR/ListarTodo";

// // Variable global en memoria para almacenar las paradas cargadas
// let listaParadasMemoria = [];

// $(document).ready(function () {
//     // 1. Cargamos todos los combos de la sección de detalles en paralelo
//     CargarCombosAuxiliaresDetalle();

//     // 2. Unico punto de captura del submit del formulario (evita duplicados)
//     $("#formDetalle").on("submit", function (e) {
//         e.preventDefault();
//         GuardarDetalle();
//     });
// });

// /* ==========================================================================
//    1. CARGA DE COMBOS AUXILIARES (DESPLEGABLES)
//    ========================================================================== */

// function CargarCombosAuxiliaresDetalle() {
//     return Promise.all([
//         CargarComboHojasRuta(),
//         CargarComboTipoMovimientos(),
//         CargarComboRecursosMov(),
//         CargarComboOrigen(),
//         CargarComboTipoMaterial(),
//         CargarComboEstadoParada()
//     ]).catch(err => {
//         console.error("SITMAS - Error al cargar combos auxiliares de detalles:", err);
//     });
// }

// function CargarComboHojasRuta() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_HDR_LISTA,
//         dataType: "json",
//         success: function (data) {
//             const $select = $("#dt_id_hoja_ruta");
//             if ($select.length === 0) return;

//             $select.empty().append('<option value="">Seleccione Hoja de Ruta</option>');
//             if (Array.isArray(data)) {
//                 data.forEach(item => {
//                     $select.append(`<option value="${item.Id}">N° ${item.Id} - ${item.FechaFormateada || ''} (${item.Vehiculo || ''})</option>`);
//                 });
//             }
//         }
//     });
// }

// function CargarComboTipoMovimientos() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_TIPO_MOV,
//         dataType: "json",
//         success: function (data) {
//             const $select = $("#dt_id_tipo_mov");
//             $select.empty().append('<option value="">Seleccione Tipo de Movimiento</option>');
//             data.forEach(v => {
//                 // Adaptar propiedades al DTO real de Vehículo (ej: v.Id, v.Patente)
//                 $select.append(`<option value="${v.IdTipoMovimientos}">${v.IdTipoMovimientos} - ${v.TipoMovimientos}</option>`);
//             });
//         }
//     });
// }

// function CargarComboRecursosMov() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_RECURSOS,
//         dataType: "json",
//         success: function (data) {
//             const $select = $("#dt_id_recurso_mov");
//             $select.empty().append('<option value="">Seleccione recurso</option>');
//             data.forEach(v => {
//                 // Adaptar propiedades al DTO real de Vehículo (ej: v.Id, v.Patente)
//                 $select.append(`<option value="${v.IdRecursoMov}">${v.IdRecursoMov} - ${v.Recurso_Movilizado}</option>`);
//             });
//         }
//     });
// }

// function CargarComboOrigen() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_ORIGEN,
//         dataType: "json",
//         success: function (data) {
//             const $select = $("#dt_id_origen");
//             $select.empty().append('<option value="">Seleccione lugar </option>');
//             data.forEach(v => {
//                 // Adaptar propiedades al DTO real de Vehículo (ej: v.Id, v.Patente)
//                 $select.append(`<option value="${v.IdOrigen}">${v.IdOrigen} - ${v.EmpresaInstitucion}</option>`);
//             });
//         }
//     });
// }

// function CargarComboTipoMaterial() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_MATERIAL,
//         dataType: "json",
//         success: function (data) {
//             const $select = $("#dt_id_tipo_material");
//             $select.empty().append('<option value="">Seleccione material</option>');
//             data.forEach(v => {
//                 // Adaptar propiedades al DTO real de Vehículo (ej: v.Id, v.Patente)
//                 $select.append(`<option value="${v.IdTipoMaterial}">${v.IdTipoMaterial} - ${v.TipoMaterial}</option>`);
//             });
//         }
//     });
// }

// function CargarComboEstadoParada() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_ESTADO_PARADA,
//         dataType: "json",
//         success: function (data) {
//             const $select = $("#dt_id_estado");
//             $select.empty().append('<option value="">Seleccione Estado</option>');
//             data.forEach(v => {
//                 // Adaptar propiedades al DTO real de Vehículo (ej: v.Id, v.Patente)
//                 $select.append(`<option value="${v.Id}">${v.Id} - ${v.EstadoHojaRuta}</option>`);
//             });
//         }
//     });
// }


// /* ==========================================================================
//    2. SELECCIÓN DE HOJA DE RUTA PADRE (DESDE LA TABLA CABECERA)
//    ========================================================================== */

// function GestionarParadas(idHojaRuta) {
//     if (!idHojaRuta || idHojaRuta <= 0) return;

//     $("#hdr_id_seleccionado").val(idHojaRuta);
//     LimpiarFormularioDetalle();

//     // Seteamos la Hoja de Ruta activa en el selector
//     $("#dt_id_hoja_ruta").val(idHojaRuta);

//     $("#seccionDetalle h2").text(`📍 Paradas / Detalles de Hoja de Ruta #${idHojaRuta}`);
//     ObtenerPorHojaRuta(idHojaRuta);

//     $("html, body").animate({ scrollTop: $("#seccionDetalle").offset().top - 50 }, 400);
// }

// /* ==========================================================================
//    3. OPERACIONES CRUD DE DETALLES
//    ========================================================================== */

// function ObtenerPorHojaRuta(idHojaRuta) {
//     $.ajax({
//         type: "GET",
//         url: `${URL_API_DETALLE}/hojaruta/${idHojaRuta}`,
//         dataType: "json",
//         success: function (lista) {
//             listaParadasMemoria = lista || [];
//             const $tbody = $("#tbodyDetallesHDR");
//             $tbody.empty();

//             if (!listaParadasMemoria || listaParadasMemoria.length === 0) {
//                 $tbody.append('<tr><td colspan="9" class="text-center text-muted">No hay paradas registradas para esta Hoja de Ruta.</td></tr>');
//                 return;
//             }

//             listaParadasMemoria.forEach(item => {
//                 const tr = `
//                     <tr>
//                         <td><strong>#${item.Id_Detalle_HDR}</strong></td>
//                         <td><span class="badge bg-secondary">HR #${item.Id_HojaRuta}</span></td>
//                         <td>${item.TipoMovimiento || 'N/A'}</td>
//                         <td>${item.RecursoMovilizado || 'N/A'}</td>
//                         <td>${item.Origen || 'N/A'}</td>
//                         <td>${item.TipoMaterial || 'N/A'}</td>
//                         <td><span class="badge bg-info text-dark">${item.HoraEstimadaFormateada || 'N/A'}</span></td>
//                         <td><span class="badge bg-success">${item.EstadoRecorrido || 'Pendiente'}</span></td>
//                         <td class="text-center">
//                             <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarDetalleParaEditar(${item.Id_Detalle_HDR})" title="Editar Parada">
//                                 ✏️
//                             </button>
//                             <button class="btn btn-sm btn-outline-danger" onclick="EliminarDetalle(${item.Id_Detalle_HDR})" title="Borrar Parada">
//                                 🗑️
//                             </button>
//                         </td>
//                     </tr>`;
//                 $tbody.append(tr);
//             });
//         },
//         error: function (err) {
//             console.error("SITMAS - Error al obtener detalles:", err);
//             mostrarAlerta("❌ Error al listar las paradas de la Hoja de Ruta.", "danger");
//         }
//     });
// }

// function GuardarDetalle() {
//     const idDetalle = $("#dt_id").val();
//     const idHojaRutaPadre = $("#hdr_id_seleccionado").val();
//     const esModificacion = idDetalle && parseInt(idDetalle) > 0;

//     // Permitimos reasignar la parada a otra Hoja de Ruta si el usuario la cambió en el combo
//     const idHojaRutaDestino = parseInt($("#dt_id_hoja_ruta").val()) || parseInt(idHojaRutaPadre);

//     if (!idHojaRutaDestino || idHojaRutaDestino <= 0) {
//         mostrarAlerta("Debe seleccionar una Hoja de Ruta válida.", "warning");
//         return;
//     }

//     // if (!idHojaRutaDestino || idHojaRutaDestino <= 0) {
//     //     alert("⚠️ Debe seleccionar una Hoja de Ruta válida.");
//     //     return;
//     // }

//     const dto = {
//         Id_Detalle_HDR: esModificacion ? parseInt(idDetalle) : 0,
//         Id_HojaRuta: idHojaRutaDestino,
//         Id_TipoMovimiento: parseInt($("#dt_id_tipo_mov").val()) || 0,
//         Id_RecursoMov: parseInt($("#dt_id_recurso_mov").val()) || 0,
//         Id_Origen: parseInt($("#dt_id_origen").val()) || 0,
//         Id_TipoMaterial: parseInt($("#dt_id_tipo_material").val()) || 0,
//         HoraEstimada: $("#dt_hora_estimada").val() ? $("#dt_hora_estimada").val() + ":00" : "00:00:00",
//         Id_Estado: parseInt($("#dt_id_estado").val()) || 0
//     };

//     if (dto.Id_TipoMovimiento <= 0) {
//         mostrarAlerta("Debe seleccionar el Tipo de Movimiento.", "warning");
//         return;
//     }

//     const tipoMetodo = esModificacion ? "PUT" : "POST";
//     const urlEndpoint = esModificacion ? `${URL_API_DETALLE}/${idDetalle}` : URL_API_DETALLE;

//     $.ajax({
//         type: tipoMetodo,
//         url: urlEndpoint,
//         data: JSON.stringify(dto),
//         contentType: "application/json; charset=utf-8",
//         dataType: "json",
//         success: function () {
//             const msj = esModificacion ? "✅ Parada actualizada correctamente." : "✅ Parada agregada con éxito.";
//             mostrarAlerta(msj, "success");

//             LimpiarFormularioDetalle();
//             ObtenerPorHojaRuta(idHojaRutaPadre); // Refresco en tiempo real de la hoja actual
//         },
//         error: function (err) {
//             console.error("SITMAS - Error al guardar detalle:", err);
//             mostrarAlerta("❌ No se pudo guardar la parada.", "danger");
//         }
//     });
// }

// function CargarDetalleParaEditar(idDetalle) {
//     const parada = listaParadasMemoria.find(p => p.Id_Detalle_HDR === idDetalle);

//     if (!parada) {
//         mostrarAlerta("No se encontraron los datos de la parada seleccionada.", "error");
//         return;
//     }

//     // Cargar los identificadores exactos mapeados desde el backend
//     $("#dt_id").val(parada.Id_Detalle_HDR);
//     $("#dt_id_hoja_ruta").val(parada.Id_HojaRuta || "");
//     $("#dt_id_tipo_mov").val(parada.Id_TipoMovimiento || "");
//     $("#dt_id_recurso_mov").val(parada.Id_RecursoMov || "");
//     $("#dt_id_origen").val(parada.Id_Origen || "");
//     $("#dt_id_tipo_material").val(parada.Id_TipoMaterial || "");
//     $("#dt_id_estado").val(parada.Id_Estado || "");

//     // Formatear HoraEstimada (HH:MM:SS) a formato HH:MM para <input type="time">
//     if (parada.HoraEstimadaFormateada) {
//         const partesHora = parada.HoraEstimadaFormateada.split(":");
//         if (partesHora.length >= 2) {
//             $("#dt_hora_estimada").val(`${partesHora[0]}:${partesHora[1]}`);
//         }
//     }

//     // Cambiar la apariencia del botón a modo edición
//     $("#btnGuardarDetalle").text("💾 Actualizar Parada").removeClass("btn-primary").addClass("btn-warning");

//     // Desplazamiento suave al formulario
//     $("html, body").animate({ scrollTop: $("#formDetalle").offset().top - 70 }, 300);
// }


// function EliminarDetalle(idDetalle) {
//     const idHojaRutaPadre = $("#hdr_id_seleccionado").val();

//     confirmarAccion(
//         "¿Eliminar Parada?",
//         `⚠️ ¿Está seguro de eliminar la parada #${idDetalle}?`,
//         function () {
//             $.ajax({
//                 type: "DELETE",
//                 url: `${URL_API_DETALLE}/${idDetalle}`,
//                 dataType: "json",
//                 success: function () {
//                     mostrarAlerta(`Parada #${idDetalle} eliminada con éxito.`, "info");

//                     if ($("#dt_id").val() == idDetalle) {
//                         LimpiarFormularioDetalle();
//                     }

//                     ObtenerPorHojaRuta(idHojaRutaPadre);
//                 },
//                 error: function (err) {
//                     console.error("SITMAS - Error al borrar detalle:", err);
//                     mostrarAlerta("No se pudo eliminar la parada seleccionada.", "danger");
//                 }
//             });
//         }
//     );
// }
// // function EliminarDetalle(idDetalle) {
// //     const idHojaRutaPadre = $("#hdr_id_seleccionado").val();

// //     if (!confirm(`⚠️ ¿Está seguro de eliminar la parada #${idDetalle}?`)) {
// //         return;
// //     }

// //     $.ajax({
// //         type: "DELETE",
// //         url: `${URL_API_DETALLE}/${idDetalle}`,
// //         dataType: "json",
// //         success: function () {
// //             mostrarAlerta(`✅ Parada #${idDetalle} eliminada.`, "info");

// //             if ($("#dt_id").val() == idDetalle) {
// //                 LimpiarFormularioDetalle();
// //             }

// //             ObtenerPorHojaRuta(idHojaRutaPadre);
// //         },
// //         error: function (err) {
// //             console.error("SITMAS - Error al borrar detalle:", err);
// //             mostrarAlerta("❌ No se pudo eliminar la parada.", "danger");
// //         }
// //     });
// // }

// function LimpiarFormularioDetalle() {
//     const idHojaRutaActual = $("#hdr_id_seleccionado").val();

//     $("#dt_id").val("0");
//     $("#dt_id_hoja_ruta").val(idHojaRutaActual || "");
//     $("#dt_id_tipo_mov").val("");
//     $("#dt_id_recurso_mov").val("");
//     $("#dt_id_origen").val("");
//     $("#dt_id_tipo_material").val("");
//     $("#dt_hora_estimada").val("");
//     $("#dt_id_estado").val("");

//     $("#btnGuardarDetalle").text("Guardar Parada").removeClass("btn-warning").addClass("btn-primary");
// }

