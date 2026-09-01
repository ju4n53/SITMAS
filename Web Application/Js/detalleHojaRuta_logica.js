const URL_DETALLE_HDR = "https://localhost:44325/api/detallehojaruta";

// --- L: READ (Obtener detalles de una Hoja de Ruta) ---
function ListarDetallesPorHojaRuta(idHojaRuta) {
    $("#hdr_id_seleccionado").val(idHojaRuta);

    $.ajax({
        type: "GET",
        url: `${URL_DETALLE_HDR}/hojaruta/${idHojaRuta}`,
        dataType: "json",
        success: function (data) {
            const tbody = $("#tbodyDetallesHDR");
            tbody.empty();

            data.forEach(item => {
                let fila = `<tr>
                    <td>${item.Id_Detalle_HDR}</td>
                    <td>${item.Id_HojaRuta}</td>
                    <td>${item.TipoMovimiento}</td>
                    <td>${item.RecursoMovilizado}</td>
                    <td>${item.Origen}</td>
                    <td>${item.TipoMaterial}</td>
                    <td>${item.HoraEstimadaFormateada}</td>
                    <td>${item.EstadoRecorrido}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="CargarParaEditarDetalle(${JSON.stringify(item).replace(/"/g, '&quot;')})">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="EliminarDetalle(${item.Id_Detalle_HDR})">Eliminar</button>
                    </td>
                </tr>`;
                tbody.append(fila);
            });
        },
        error: function (error) {
            console.error("Error al listar los detalles:", error);
        }
    });
}

// --- C: CREATE (Insertar) / U: UPDATE (Modificar) ---
function GuardarDetalle() {
    const idDetalle = $("#dt_id").val();
    const idHojaRuta = $("#hdr_id_seleccionado").val();

    if (!idHojaRuta) {
        alert("Debe seleccionar primero una Hoja de Ruta.");
        return;
    }

    const objDetalle = {
        "Id_HojaRuta": parseInt(idHojaRuta),
        "Id_TipoMovimiento": parseInt($("#dt_id_tipo_mov").val()),
        "Id_RecursoMov": parseInt($("#dt_id_recurso_mov").val()),
        "Id_Origen": parseInt($("#dt_id_origen").val()),
        "Id_TipoMaterial": parseInt($("#dt_id_tipo_material").val()),
        "HoraEstimada": $("#dt_hora_estimada").val(),
        "Id_Estado": parseInt($("#dt_id_estado").val())
    };

    const esEdicion = idDetalle !== "" && idDetalle !== "0";
    const metodo = esEdicion ? "PUT" : "POST";
    const urlFinal = esEdicion ? `${URL_DETALLE_HDR}/${idDetalle}` : URL_DETALLE_HDR;

    $.ajax({
        type: metodo,
        url: urlFinal,
        data: JSON.stringify(objDetalle),
        contentType: "application/json; charset=utf-8",
        success: function (response) {
            alert(response.Mensaje || "Detalle guardado correctamente.");
            LimpiarFormularioDetalle();
            ListarDetallesPorHojaRuta(idHojaRuta);
        },
        error: function (error) {
            console.error("Error al guardar el detalle:", error);
            alert("Ocurrió un error al intentar guardar la parada.");
        }
    });
}

// --- PREPARAR EDICIÓN DETALLE ---
function CargarParaEditarDetalle(item) {
    $("#dt_id").val(item.Id_Detalle_HDR);
    $("#dt_id_tipo_mov").val(item.Id_TipoMovimiento);
    $("#dt_id_recurso_mov").val(item.Id_RecursoMov);
    $("#dt_id_origen").val(item.Id_Origen);
    $("#dt_id_tipo_material").val(item.Id_TipoMaterial);
    $("#dt_hora_estimada").val(item.HoraEstimada);
    $("#dt_id_estado").val(item.Id_Estado);
    $("#btnGuardarDetalle").text("Actualizar Parada");
}

// --- D: DELETE (Eliminar Detalle) ---
function EliminarDetalle(idDetalle) {
    const idHojaRuta = $("#hdr_id_seleccionado").val();

    if (confirm("¿Está seguro de eliminar esta parada?")) {
        $.ajax({
            type: "DELETE",
            url: `${URL_DETALLE_HDR}/${idDetalle}`,
            success: function (response) {
                alert(response.Mensaje || "Parada eliminada.");
                ListarDetallesPorHojaRuta(idHojaRuta);
            },
            error: function (error) {
                console.error("Error al eliminar la parada:", error);
            }
        });
    }
}

function LimpiarFormularioDetalle() {
    $("#dt_id").val("");
    $("#formDetalle")[0].reset();
    $("#btnGuardarDetalle").text("Guardar Parada");
}