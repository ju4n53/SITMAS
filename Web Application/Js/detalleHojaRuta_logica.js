/* ==========================================================================
   SITMAS - Módulo: Detalle Hoja de Ruta (Paradas) - Lógica de Interfaz
   Tecnologías: JavaScript (ES6+), jQuery, AJAX, Bootstrap 5
   ========================================================================== */

const URL_API_DETALLE = "https://localhost:44325/api/detallehojaruta";

// Endpoints auxiliares para los Combos
const URL_API_TIPO_MOV = "https://localhost:44325/api/tipomovimientos";
const URL_API_RECURSOS = "https://localhost:44325/api/recursosmovilizados";
const URL_API_ORIGEN = "https://localhost:44325/api/Origen/ListarTodo";
const URL_API_MATERIAL = "https://localhost:44325/api/TP_Material/ListarTodo";
const URL_API_ESTADO_PARADA = "https://localhost:44325/api/EST_HDR/ListarTodo";

// Variable global en memoria para almacenar las paradas actuales y facilitar la edición rápida
let listaParadasMemoria = [];

$(document).ready(function () {
    // 1. Cargamos todos los combos de la sección de detalles en paralelo
    CargarCombosAuxiliaresDetalle();

    // 2. Unico punto de captura del submit del formulario (evita duplicados)
    $("#formDetalle").on("submit", function (e) {
        e.preventDefault();
        GuardarDetalle();
    });
});

/* ==========================================================================
   1. CARGA DE COMBOS AUXILIARES (DESPLEGABLES)
   ========================================================================== */

function CargarCombosAuxiliaresDetalle() {
    Promise.all([
        CargarComboGeneric(URL_API_TIPO_MOV, "#dt_id_tipo_mov", "Tipo Movimiento", "IdTipoMovimientos", "TipoMovimientos"),
        CargarComboGeneric(URL_API_RECURSOS, "#dt_id_recurso_mov", "Recurso Movilizado", "IdRecursoMov", "Recurso_Movilizado"),
        CargarComboGeneric(URL_API_ORIGEN, "#dt_id_origen", "Lugar", "IdOrigen", "EmpresaInstitucion"),
        CargarComboGeneric(URL_API_MATERIAL, "#dt_id_tipo_material", "Tipo Material", "IdTipoMaterial", "TipoMaterial"),
        CargarComboGeneric(URL_API_ESTADO_PARADA, "#dt_id_estado", "Estado Parada", "Id", "EstadoHojaRuta")
    ]).catch(err => {
        console.error("SITMAS - Error al cargar combos auxiliares de detalles:", err);
    });
}

function CargarComboGeneric(url, selectorCss, labelDefault, propId, propTexto) {
    return $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        success: function (data) {
            const $select = $(selectorCss);
            if ($select.length === 0) return;

            $select.empty().append(`<option value="">Seleccione ${labelDefault}</option>`);
            if (Array.isArray(data)) {
                data.forEach(item => {
                    $select.append(`<option value="${item[propId]}">${item[propTexto]}</option>`);
                });
            }
        }
    });
}

/* ==========================================================================
   2. SELECCIÓN DE HOJA DE RUTA PADRE
   ========================================================================== */

function GestionarParadas(idHojaRuta) {
    if (!idHojaRuta || idHojaRuta <= 0) return;

    $("#hdr_id_seleccionado").val(idHojaRuta);
    LimpiarFormularioDetalle();

    $("#seccionDetalle h2").text(`📍 Paradas / Detalles de Hoja de Ruta #${idHojaRuta}`);
    ObtenerPorHojaRuta(idHojaRuta);

    $("html, body").animate({ scrollTop: $("#seccionDetalle").offset().top - 50 }, 400);
}

/* ==========================================================================
   3. OPERACIONES CRUD DE DETALLES
   ========================================================================== */

function ObtenerPorHojaRuta(idHojaRuta) {
    $.ajax({
        type: "GET",
        url: `${URL_API_DETALLE}/hojaruta/${idHojaRuta}`,
        dataType: "json",
        success: function (lista) {
            listaParadasMemoria = lista || []; // Guardamos copia en memoria
            const $tbody = $("#tbodyDetallesHDR");
            $tbody.empty();

            if (!listaParadasMemoria || listaParadasMemoria.length === 0) {
                $tbody.append('<tr><td colspan="9" class="text-center text-muted">No hay paradas registradas para esta Hoja de Ruta.</td></tr>');
                return;
            }

            listaParadasMemoria.forEach(item => {
                const tr = `
                    <tr>
                        <td><strong>#${item.Id_Detalle_HDR}</strong></td>
                        <td>${item.Id_HojaRuta}</td>
                        <td>${item.TipoMovimiento || 'N/A'}</td>
                        <td>${item.RecursoMovilizado || 'N/A'}</td>
                        <td>${item.Origen || 'N/A'}</td>
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

function GuardarDetalle() {
    const idDetalle = $("#dt_id").val();
    const idHojaRutaPadre = $("#hdr_id_seleccionado").val();
    const esModificacion = idDetalle && parseInt(idDetalle) > 0;

    if (!idHojaRutaPadre || parseInt(idHojaRutaPadre) <= 0) {
        alert("⚠️ Primero debe seleccionar una Hoja de Ruta de la lista superior presionando el botón '📍 Paradas'.");
        return;
    }

    const dto = {
        Id_Detalle_HDR: esModificacion ? parseInt(idDetalle) : 0,
        Id_HojaRuta: parseInt(idHojaRutaPadre),
        Id_TipoMovimiento: parseInt($("#dt_id_tipo_mov").val()) || 0,
        Id_RecursoMov: parseInt($("#dt_id_recurso_mov").val()) || 0,
        Id_Origen: parseInt($("#dt_id_origen").val()) || 0,
        Id_TipoMaterial: parseInt($("#dt_id_tipo_material").val()) || 0,
        HoraEstimada: $("#dt_hora_estimada").val() ? $("#dt_hora_estimada").val() + ":00" : "00:00:00",
        Id_Estado: parseInt($("#dt_id_estado").val()) || 0
    };

    if (dto.Id_TipoMovimiento <= 0) {
        alert("⚠️ Debe seleccionar el Tipo de Movimiento.");
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
        success: function (respuesta) {
            const msj = esModificacion ? "✅ Parada actualizada correctamente." : "✅ Parada agregada con éxito.";
            mostrarAlerta(msj, "success");

            LimpiarFormularioDetalle();
            ObtenerPorHojaRuta(idHojaRutaPadre); // Refresco en tiempo real
        },
        error: function (err) {
            console.error("SITMAS - Error al guardar detalle:", err);
            mostrarAlerta("❌ No se pudo guardar la parada.", "danger");
        }
    });
}

function CargarDetalleParaEditar(idDetalle) {
    // Buscamos el ítem correspondiente dentro de nuestra lista en memoria
    const parada = listaParadasMemoria.find(p => p.Id_Detalle_HDR === idDetalle);

    if (!parada) {
        alert("⚠️ No se encontraron los datos de la parada seleccionada.");
        return;
    }

    // Rellenamos el formulario con los IDs clave
    $("#dt_id").val(parada.Id_Detalle_HDR);
    $("#dt_id_tipo_mov").val(parada.Id_TipoMovimiento || "");
    $("#dt_id_recurso_mov").val(parada.Id_RecursoMov || "");
    $("#dt_id_origen").val(parada.Id_Origen || "");
    $("#dt_id_tipo_material").val(parada.Id_TipoMaterial || "");
    $("#dt_id_estado").val(parada.Id_Estado || "");

    // Asignar HoraEstimada (recortando a formato HH:MM para el input type="time")
    if (parada.HoraEstimadaFormateada) {
        const partesHora = parada.HoraEstimadaFormateada.split(":");
        if (partesHora.length >= 2) {
            $("#dt_hora_estimada").val(`${partesHora[0]}:${partesHora[1]}`);
        }
    }

    // Cambiar la apariencia visual del botón a modo edición
    $("#btnGuardarDetalle").text("💾 Actualizar Parada").removeClass("btn-primary").addClass("btn-warning");
    
    // Desplazamiento al formulario
    $("html, body").animate({ scrollTop: $("#formDetalle").offset().top - 70 }, 300);
}

function EliminarDetalle(idDetalle) {
    const idHojaRutaPadre = $("#hdr_id_seleccionado").val();

    if (!confirm(`⚠️ ¿Está seguro de eliminar la parada #${idDetalle}?`)) {
        return;
    }

    $.ajax({
        type: "DELETE",
        url: `${URL_API_DETALLE}/${idDetalle}`,
        dataType: "json",
        success: function () {
            mostrarAlerta(`✅ Parada #${idDetalle} eliminada.`, "info");

            if ($("#dt_id").val() == idDetalle) {
                LimpiarFormularioDetalle();
            }

            ObtenerPorHojaRuta(idHojaRutaPadre); // 🔄 Nombre de función corregido
        },
        error: function (err) {
            console.error("SITMAS - Error al borrar detalle:", err);
            mostrarAlerta("❌ No se pudo eliminar la parada.", "danger");
        }
    });
}

/* ==========================================================================
   4. LIMPIEZA Y AUXILIARES
   ========================================================================== */

function LimpiarFormularioDetalle() {
    $("#dt_id").val("0");
    $("#dt_id_tipo_mov").val("");
    $("#dt_id_recurso_mov").val("");
    $("#dt_id_origen").val("");
    $("#dt_id_tipo_material").val("");
    $("#dt_hora_estimada").val("");
    $("#dt_id_estado").val("");

    $("#btnGuardarDetalle").text("Guardar Parada").removeClass("btn-warning").addClass("btn-primary");
}



// const URL_DETALLE_HDR = "https://localhost:44325/api/detallehojaruta";

// // --- L: READ (Obtener detalles de una Hoja de Ruta) ---
// function ListarDetallesPorHojaRuta(idHojaRuta) {
//     $("#hdr_id_seleccionado").val(idHojaRuta);

//     $.ajax({
//         type: "GET",
//         url: `${URL_DETALLE_HDR}/hojaruta/${idHojaRuta}`,
//         dataType: "json",
//         success: function (data) {
//             const tbody = $("#tbodyDetallesHDR");
//             tbody.empty();

//             data.forEach(item => {
//                 let fila = `<tr>
//                     <td>${item.Id_Detalle_HDR}</td>
//                     <td>${item.Id_HojaRuta}</td>
//                     <td>${item.TipoMovimiento}</td>
//                     <td>${item.RecursoMovilizado}</td>
//                     <td>${item.Origen}</td>
//                     <td>${item.TipoMaterial}</td>
//                     <td>${item.HoraEstimadaFormateada}</td>
//                     <td>${item.EstadoRecorrido}</td>
//                     <td>
//                         <button class="btn btn-sm btn-warning" onclick="CargarParaEditarDetalle(${JSON.stringify(item).replace(/"/g, '&quot;')})">Editar</button>
//                         <button class="btn btn-sm btn-danger" onclick="EliminarDetalle(${item.Id_Detalle_HDR})">Eliminar</button>
//                     </td>
//                 </tr>`;
//                 tbody.append(fila);
//             });
//         },
//         error: function (error) {
//             console.error("Error al listar los detalles:", error);
//         }
//     });
// }

// // --- C: CREATE (Insertar) / U: UPDATE (Modificar) ---
// function GuardarDetalle() {
//     const idDetalle = $("#dt_id").val();
//     const idHojaRuta = $("#hdr_id_seleccionado").val();

//     if (!idHojaRuta) {
//         alert("Debe seleccionar primero una Hoja de Ruta.");
//         return;
//     }

//     const objDetalle = {
//         "Id_HojaRuta": parseInt(idHojaRuta),
//         "Id_TipoMovimiento": parseInt($("#dt_id_tipo_mov").val()),
//         "Id_RecursoMov": parseInt($("#dt_id_recurso_mov").val()),
//         "Id_Origen": parseInt($("#dt_id_origen").val()),
//         "Id_TipoMaterial": parseInt($("#dt_id_tipo_material").val()),
//         "HoraEstimada": $("#dt_hora_estimada").val(),
//         "Id_Estado": parseInt($("#dt_id_estado").val())
//     };

//     const esEdicion = idDetalle !== "" && idDetalle !== "0";
//     const metodo = esEdicion ? "PUT" : "POST";
//     const urlFinal = esEdicion ? `${URL_DETALLE_HDR}/${idDetalle}` : URL_DETALLE_HDR;

//     $.ajax({
//         type: metodo,
//         url: urlFinal,
//         data: JSON.stringify(objDetalle),
//         contentType: "application/json; charset=utf-8",
//         success: function (response) {
//             alert(response.Mensaje || "Detalle guardado correctamente.");
//             LimpiarFormularioDetalle();
//             ListarDetallesPorHojaRuta(idHojaRuta);
//         },
//         error: function (error) {
//             console.error("Error al guardar el detalle:", error);
//             alert("Ocurrió un error al intentar guardar la parada.");
//         }
//     });
// }

// // --- PREPARAR EDICIÓN DETALLE ---
// function CargarParaEditarDetalle(item) {
//     $("#dt_id").val(item.Id_Detalle_HDR);
//     $("#dt_id_tipo_mov").val(item.Id_TipoMovimiento);
//     $("#dt_id_recurso_mov").val(item.Id_RecursoMov);
//     $("#dt_id_origen").val(item.Id_Origen);
//     $("#dt_id_tipo_material").val(item.Id_TipoMaterial);
//     $("#dt_hora_estimada").val(item.HoraEstimada);
//     $("#dt_id_estado").val(item.Id_Estado);
//     $("#btnGuardarDetalle").text("Actualizar Parada");
// }

// // --- D: DELETE (Eliminar Detalle) ---
// function EliminarDetalle(idDetalle) {
//     const idHojaRuta = $("#hdr_id_seleccionado").val();

//     if (confirm("¿Está seguro de eliminar esta parada?")) {
//         $.ajax({
//             type: "DELETE",
//             url: `${URL_DETALLE_HDR}/${idDetalle}`,
//             success: function (response) {
//                 alert(response.Mensaje || "Parada eliminada.");
//                 ListarDetallesPorHojaRuta(idHojaRuta);
//             },
//             error: function (error) {
//                 console.error("Error al eliminar la parada:", error);
//             }
//         });
//     }
// }

// function LimpiarFormularioDetalle() {
//     $("#dt_id").val("");
//     $("#formDetalle")[0].reset();
//     $("#btnGuardarDetalle").text("Guardar Parada");
// }