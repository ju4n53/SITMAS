/* ==========================================================================
   SITMAS - Módulo: Registro de Odómetro - Lógica de Interfaz
   Tecnologías: JavaScript (ES6+), jQuery, AJAX, Bootstrap 5
   ========================================================================== */

const URL_API_ODOMETRO = "https://localhost:44325/api/registroodometro";
const URL_API_VEHICULOS = "https://localhost:44325/api/Vehiculo/ListarTodo";

$(document).ready(function () {
    // 1. Inicialización en paralelo de combos y tabla principal
    InicializarModuloOdometro();

    // 2. Controladores de eventos para el formulario (Alta / Modificación)
    $("#formOdometro").on("submit", function (e) {
        e.preventDefault();
        GuardarRegistroOdometro();
    });

    $("#btnLimpiarForm").on("click", function () {
        ResetearFormulario();
    });

    // 3. Buscador reactivo en vivo sobre la tabla
    $("#inputBusquedaOdometro").on("keyup", function () {
        const busqueda = $(this).val().toLowerCase();
        $("#tbodyOdometro tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(busqueda) > -1);
        });
    });
});

/* ==========================================================================
   1. CARGA INICIAL Y COMBOS (PARALELISMO)
   ========================================================================== */

function InicializarModuloOdometro() {
    Promise.all([
        CargarComboVehiculos()
    ]).then(() => {
        GetAllRegistros();
    }).catch(err => {
        console.error("SITMAS - Error al inicializar vehículos:", err);
        mostrarAlerta("❌ Error al cargar el listado auxiliar de vehículos.", "danger");
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
            data.forEach(v => {
                // Adaptar propiedades según el DTO real de Vehículo
                $select.append(`<option value="${v.Id || v.Id}">${v.Patente}</option>`);
            });
        }
    });
}

/* ==========================================================================
   2. OPERACIONES CRUD (LISTAR, BUSCAR, INSERTAR, MODIFICAR, ELIMINAR)
   ========================================================================== */

function GetAllRegistros() {
    $.ajax({
        type: "GET",
        url: URL_API_ODOMETRO,
        dataType: "json",
        success: function (lista) {
            const $tbody = $("#tbodyOdometro");
            $tbody.empty();

            if (!lista || lista.length === 0) {
                $tbody.append('<tr><td colspan="6" class="text-center text-muted">No hay registros de odómetro guardados.</td></tr>');
                return;
            }

            lista.forEach(item => {
                const tr = `
                    <tr>
                        <td><small class="fw-bold text-secondary">${item.FechaRegOdomFormateada || 'N/A'}</small></td>
                        <td><span class="badge bg-secondary">${item.Patente || 'Sin Asignar'}</span></td>
                        <td class="text-end">${item.InicioOdom.toFixed(2)} Km</td>
                        <td class="text-end">${item.FinalOdom.toFixed(2)} Km</td>
                        <td class="text-end fw-bold text-success">+${item.KmRecorridosDia.toFixed(2)} Km</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarParaEditar(${item.IdRegistroOdomet})" title="Editar Registro">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger me-1" onclick="EliminarRegistro(${item.IdRegistroOdomet})" title="Eliminar Registro">
                                🗑️ Borrar
                            </button>
                        </td>
                    </tr>`;
                $tbody.append(tr);
            });
        },
        error: function (err) {
            console.error("SITMAS - Error en GetAllRegistros:", err);
            mostrarAlerta("❌ Error al consultar el historial de odómetros.", "danger");
        }
    });
}

function GuardarRegistroOdometro() {
    const id = $("#hdnIdRegistroOdometro").val();
    const esModificacion = id && parseInt(id) > 0;

    const dto = {
        IdRegistroOdomet: esModificacion ? parseInt(id) : 0,
        IdVehiculo: parseInt($("#id_vehiculo").val()) || 0,
        InicioOdom: parseFloat($("#inicio_odom").val()) || 0,
        FinalOdom: parseFloat($("#final_odom").val()) || 0
    };

    if (dto.IdVehiculo <= 0) {
        alert("⚠️ Debe seleccionar un vehículo.");
        return;
    }

    if (dto.FinalOdom < dto.InicioOdom) {
        alert("⚠️ El odómetro final no puede ser menor al inicial del mismo día.");
        return;
    }

    const tipoMetodo = esModificacion ? "PUT" : "POST";
    const urlEndpoint = esModificacion ? `${URL_API_ODOMETRO}/${id}` : URL_API_ODOMETRO;

    $.ajax({
        type: tipoMetodo,
        url: urlEndpoint,
        data: JSON.stringify(dto),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (respuesta) {
            const mensajeAccion = esModificacion 
                ? "✅ Registro de odómetro actualizado con éxito." 
                : "✅ Registro de odómetro creado con éxito.";

            mostrarAlerta(mensajeAccion, "success");
            ResetearFormulario();
            GetAllRegistros();
        },
        error: function (err) {
            console.error("SITMAS - Error al guardar Odómetro:", err);
            let msjError = "❌ No se pudo guardar el registro de odómetro.";
            if (err.responseJSON && err.responseJSON.Message) {
                msjError = `❌ ${err.responseJSON.Message}`;
            } else if (err.responseText) {
                msjError = `❌ ${err.responseText}`;
            }
            mostrarAlerta(msjError, "danger");
        }
    });
}

function CargarParaEditar(id) {
    $.ajax({
        type: "GET",
        url: `${URL_API_ODOMETRO}?idVehiculo=0`,
        dataType: "json",
        success: function (lista) {
            const item = lista.find(r => r.IdRegistroOdomet === id);
            if (!item) {
                alert("Registro no encontrado.");
                return;
            }

            $("#hdnIdRegistroOdometro").val(item.IdRegistroOdomet);
            $("#id_vehiculo").val(item.IdVehiculo);
            $("#inicio_odom").val(item.InicioOdom);
            $("#final_odom").val(item.FinalOdom);

            // Cambiar UI a modo edición
            $("#btnGuardarOdometro").text("💾 Actualizar Odómetro").removeClass("btn-sitmas-success").addClass("btn-warning");
            $("#tituloFormOdometro").text(`Modificar Registro de Odómetro #${item.IdRegistroOdomet}`);

            $("html, body").animate({ scrollTop: $("#formOdometro").offset().top - 70 }, 300);
        },
        error: function (err) {
            console.error("SITMAS - Error al obtener registro por ID:", err);
            alert("Error al cargar el registro seleccionado.");
        }
    });
}

function EliminarRegistro(id) {
    if (!confirm(`⚠️ ¿Está seguro de eliminar el registro de odómetro #${id}?`)) {
        return;
    }

    $.ajax({
        type: "DELETE",
        url: `${URL_API_ODOMETRO}/${id}`,
        dataType: "json",
        success: function () {
            mostrarAlerta(`✅ Registro #${id} eliminado correctamente.`, "info");
            GetAllRegistros();

            if ($("#hdnIdRegistroOdometro").val() == id) {
                ResetearFormulario();
            }
        },
        error: function (err) {
            console.error("SITMAS - Error al borrar odómetro:", err);
            mostrarAlerta("❌ No se pudo eliminar el registro seleccionado.", "danger");
        }
    });
}

/* ==========================================================================
   3. FUNCIONES AUXILIARES Y UX
   ========================================================================== */

function ResetearFormulario() {
    $("#formOdometro")[0].reset();
    $("#hdnIdRegistroOdometro").val("0");
    $("#btnGuardarOdometro").text("➕ Registrar Odómetro").removeClass("btn-warning").addClass("btn-sitmas-success");
    $("#tituloFormOdometro").text("Cargar Registro de Odómetro");
}

function mostrarAlerta(mensaje, tipo) {
    const $container = $("#alertContainer");
    if ($container.length > 0) {
        const html = `
            <div class="alert alert-${tipo} alert-dismissible fade show mb-3" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
        $container.html(html);
        setTimeout(() => { $(".alert").alert('close'); }, 4000);
    } else {
        alert(mensaje);
    }
}
