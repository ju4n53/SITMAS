/* ==========================================================================
   SITMAS - Módulo: Hoja de Ruta (Cabecera) - Lógica de Interfaz
   Tecnologías: JavaScript (ES6+), jQuery, AJAX, Bootstrap 5
   ========================================================================== */

const URL_API_HDR = "https://localhost:44325/api/hojaruta";
const URL_API_VEHICULOS = "https://localhost:44325/api/Vehiculo/ListarTodo"; 
const URL_API_CHOFERES = "https://localhost:44325/api/Empleado/ListarChoferes"; 

$(document).ready(function () {
    // 1. Inicialización en paralelo de combos y tabla principal
    InicializarModuloHDR();

    // 2. Controladores de eventos para el formulario (Alta / Modificación)
    $("#formHojaRuta").on("submit", function (e) {
        e.preventDefault();
        GuardarHojaRuta();
    });

    $("#btnLimpiarForm").on("click", function () {
        ResetearFormulario();
    });

    // 3. Validaciones dinámicas de entrada
    ConfigurarValidacionesFormulario();

    // 4. Buscador reactivo en vivo sobre la tabla
    $("#inputBusquedaHDR").on("keyup", function () {
        const busqueda = $(this).val().toLowerCase();
        $("#tbodyHojaRuta tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(busqueda) > -1);
        });
    });
});

/* ==========================================================================
   1. CARGA INICIAL Y COMBOS (PARALELISMO)
   ========================================================================== */

function InicializarModuloHDR() {
    Promise.all([
        CargarComboVehiculos(),
        CargarComboChoferes()
    ]).then(() => {
        GetAllHojasRuta();
    }).catch(err => {
        console.error("Error al inicializar los datos auxiliares:", err);
        mostrarAlerta("Error al cargar los listados auxiliares de vehículos o choferes.", "danger");
    });
}

function CargarComboVehiculos() {
    return $.ajax({
        type: "GET",
        url: URL_API_VEHICULOS,
        dataType: "json",
        success: function (data) {
            const $select = $("#id_vehiculo");
            $select.empty().append('<option value="">Seleccione Vehículo (Patente)</option>');
            if (Array.isArray(data)) {
                data.forEach(v => {
                    $select.append(`<option value="${v.Id}">${v.Id} - ${v.Patente}</option>`);
                });
            }
        }
    });
}

function CargarComboChoferes() {
    return $.ajax({
        type: "GET",
        url: URL_API_CHOFERES,
        dataType: "json",
        success: function (data) {
            const $select = $("#id_chofer");
            $select.empty().append('<option value="">Seleccione Chofer</option>');
            if (Array.isArray(data)) {
                data.forEach(c => {
                    $select.append(`<option value="${c.Id}">${c.Apellido}, ${c.Nombre}</option>`);
                });
            }
        }
    });
}

/* ==========================================================================
   2. OPERACIONES CRUD (LISTAR, BUSCAR, INSERTAR, MODIFICAR, ELIMINAR)
   ========================================================================== */

function GetAllHojasRuta() {
    $.ajax({
        type: "GET",
        url: URL_API_HDR,
        dataType: "json",
        success: function (lista) {
            const $tbody = $("#tbodyHojaRuta");
            $tbody.empty();

            if (!lista || lista.length === 0) {
                $tbody.append('<tr><td colspan="5" class="text-center text-muted">No hay Hojas de Ruta registradas.</td></tr>');
                return;
            }

            lista.forEach(item => {
                const tr = `
                    <tr>
                        <td><strong>#${item.Id}</strong></td>
                        <td>${item.FechaFormateada || 'N/A'}</td>
                        <td><span class="badge bg-secondary">${item.Vehiculo || 'Sin Asignar'}</span></td>
                        <td>${item.ChoferNombreCompleto || 'Sin Asignar'}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarParaEditar(${item.Id})" title="Editar Cabecera">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger me-1" onclick="EliminarHojaRuta(${item.Id})" title="Eliminar Hoja de Ruta">
                                🗑️ Borrar
                            </button>
                            <button class="btn btn-sm btn-success" onclick="GestionarParadas(${item.Id})" title="Ver/Agregar Paradas">
                                📍 Paradas
                            </button>
                        </td>
                    </tr>`;
                $tbody.append(tr);
            });
        },
        error: function (err) {
            console.error("SITMAS - Error en GetAllHojasRuta:", err);
            mostrarAlerta("Error al consultar la lista de Hojas de Ruta.", "danger");
        }
    });
}

function GuardarHojaRuta() {
    const id = $("#hdnIdHojaRuta").val();
    const esModificacion = id && parseInt(id) > 0;

    const dto = {
        Id: esModificacion ? parseInt(id) : 0,
        HojaRutaFecha: $("#fecha_hdr").val(),
        Id_Vehiculo: parseInt($("#id_vehiculo").val()) || 0,
        Id_Chofer: parseInt($("#id_chofer").val()) || 0
    };

    if (!dto.HojaRutaFecha) {
        mostrarAlerta("Debe seleccionar la fecha de la Hoja de Ruta.", "warning");
        return;
    }
    if (dto.Id_Vehiculo <= 0) {
        mostrarAlerta("Debe seleccionar un vehículo.", "warning");
        return;
    }
    if (dto.Id_Chofer <= 0) {
        mostrarAlerta("Debe seleccionar un chofer.", "warning");
        return;
    }

    const tipoMetodo = esModificacion ? "PUT" : "POST";
    const urlEndpoint = esModificacion ? `${URL_API_HDR}/${id}` : URL_API_HDR;

    $.ajax({
        type: tipoMetodo,
        url: urlEndpoint,
        data: JSON.stringify(dto),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function () {
            const mensajeAccion = esModificacion 
                ? "Hoja de Ruta actualizada con éxito." 
                : "Hoja de Ruta creada con éxito.";

            mostrarAlerta(mensajeAccion, "success");
            ResetearFormulario();
            GetAllHojasRuta(); // Actualización inmediata de la tabla
        },
        error: function (err) {
            console.error("SITMAS - Error al guardar Hoja de Ruta:", err);
            mostrarAlerta("No se pudo guardar la Hoja de Ruta. Verifique los datos.", "danger");
        }
    });
}

function CargarParaEditar(id) {
    $.ajax({
        type: "GET",
        url: `${URL_API_HDR}/${id}`,
        dataType: "json",
        success: function (data) {
            if (!data) {
                mostrarAlerta("Hoja de Ruta no encontrada.", "error");
                return;
            }

            $("#hdnIdHojaRuta").val(data.Id);

            if (data.HojaRutaFecha) {
                const fechaISO = new Date(data.HojaRutaFecha).toISOString().split("T")[0];
                $("#fecha_hdr").val(fechaISO);
            }

            $("#id_vehiculo").val(data.Id_Vehiculo);
            $("#id_chofer").val(data.Id_Chofer);

            $("#btnGuardarHDR").text("💾 Actualizar Cabecera").removeClass("btn-sitmas-success").addClass("btn-warning");
            $("#tituloFormHDR").text(`Modificar Hoja de Ruta #${data.Id}`);

            $("html, body").animate({ scrollTop: $("#formHojaRuta").offset().top - 70 }, 300);
        },
        error: function (err) {
            console.error("SITMAS - Error al obtener Hoja de Ruta por ID:", err);
            mostrarAlerta("Error al cargar la Hoja de Ruta seleccionada.", "danger");
        }
    });
}

function EliminarHojaRuta(id) {
    confirmarAccion(
        "¿Eliminar Hoja de Ruta?",
        `Se borrará la Hoja de Ruta #${id} junto con todas sus paradas asociadas. Esta acción no se puede deshacer.`,
        function () {
            $.ajax({
                type: "DELETE",
                url: `${URL_API_HDR}/${id}`,
                dataType: "json",
                success: function () {
                    mostrarAlerta(`Hoja de Ruta #${id} eliminada correctamente.`, "info");
                    GetAllHojasRuta();

                    if ($("#hdnIdHojaRuta").val() == id) {
                        ResetearFormulario();
                    }
                },
                error: function (err) {
                    console.error("SITMAS - Error al borrar Hoja de Ruta:", err);
                    mostrarAlerta("No se pudo eliminar la Hoja de Ruta seleccionada.", "danger");
                }
            });
        }
    );
}

/* ==========================================================================
   3. FUNCIONES AUXILIARES Y UX
   ========================================================================== */

function ResetearFormulario() {
    $("#formHojaRuta")[0].reset();
    $("#hdnIdHojaRuta").val("0");
    $("#btnGuardarHDR").text("➕ Crear Hoja de Ruta").removeClass("btn-warning").addClass("btn-sitmas-success");
    $("#tituloFormHDR").text("Cargar Hoja de Ruta");
}

function ConfigurarValidacionesFormulario() {
    const hoy = new Date().toISOString().split("T")[0];
    $("#fecha_hdr").attr("max", hoy); // Evita seleccionar fechas futuras
}
