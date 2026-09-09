/* ==========================================================================
   SITMAS - Módulo: Registro de Odómetro - Lógica de Interfaz
   Tecnologías: JavaScript (ES6+), jQuery, AJAX, Bootstrap 5
   ========================================================================== */

const URL_API_ODOMETRO = "https://localhost:44325/api/registroodometro";
const URL_API_VEHICULOS = "https://localhost:44325/api/Vehiculo/ListarTodo"; // Endpoint estandarizado de vehículos

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







// // Constantes de Endpoints de la API
// const URL_API_ODOMETRO = "https://localhost:44325/api/registroodometro";
// const URL_API_VEHICULOS = "https://localhost:44325/api/Vehiculo/ListarTodo";

// // Colección local para almacenar los registros en memoria y acelerar la selección al editar
// let listaRegistrosMemoria = [];

// $(document).ready(function () {
//     // Cargar combos y listar registros iniciales
//     cargarVehiculos();
//     listarRegistros();

//     // Evento Submit del Formulario
//     $("#formOdometro").on("submit", function (e) {
//         e.preventDefault();
//         guardarRegistro();
//     });
// });

// /**
//  * Carga el combo desplegable de vehículos para el formulario y para el filtro.
//  */
// function cargarVehiculos() {
//     $.ajax({
//         url: URL_API_VEHICULOS,
//         type: "GET",
//         dataType: "json"
//     }).done(function (vehiculos) {
//         let optionsHtml = '<option value="">-- Seleccione un vehículo --</option>';
//         let optionsFiltroHtml = '<option value="">-- Todos los vehículos --</option>';

//         vehiculos.forEach(v => {
//             optionsHtml += `<option value="${v.Id}">${v.Patente} - ${v.Modelo || ''}</option>`;
//             optionsFiltroHtml += `<option value="${v.Id}">${v.Patente}</option>`;
//         });

//         $("#cmbVehiculo").html(optionsHtml);
//         $("#cmbFiltroVehiculo").html(optionsFiltroHtml);
//     }).fail(function (error) {
//         console.error("Error al cargar lista de vehículos:", error);
//     });
// }

// /**
//  * Consulta la API y renderiza las filas de la tabla de odómetros.
//  */
// function listarRegistros() {
//     const idVehiculoFiltro = $("#cmbFiltroVehiculo").val();
//     let urlFinal = URL_API_ODOMETRO;

//     if (idVehiculoFiltro) {
//         urlFinal += `?idVehiculo=${idVehiculoFiltro}`;
//     }

//     $("#tbodyOdometro").html('<tr><td colspan="6" class="text-center py-4 text-muted">Cargando registros...</td></tr>');

//     $.ajax({
//         url: urlFinal,
//         type: "GET",
//         dataType: "json"
//     }).done(function (data) {
//         listaRegistrosMemoria = data;
//         renderizarTabla(data);
//     }).fail(function (error) {
//         console.error("Error al consultar registros de odómetro:", error);
//         $("#tbodyOdometro").html('<tr><td colspan="6" class="text-center py-4 text-danger">Error al cargar la información.</td></tr>');
//     });
// }

// /**
//  * Dibuja dinámicamente el HTML del tbody a partir del array de DTOs.
//  */
// function renderizarTabla(lista) {
//     if (!lista || lista.length === 0) {
//         $("#tbodyOdometro").html('<tr><td colspan="6" class="text-center py-4 text-muted">No se encontraron registros de odómetro.</td></tr>');
//         return;
//     }

//     let html = "";
//     lista.forEach(reg => {
//         html += `
//             <tr>
//                 <td><small class="fw-semibold text-secondary">${reg.FechaRegOdomFormateada}</small></td>
//                 <td><span class="badge bg-light text-dark border">${reg.Patente}</span></td>
//                 <td class="text-end fw-monospace">${reg.InicioOdom.toFixed(2)} Km</td>
//                 <td class="text-end fw-monospace">${reg.FinalOdom.toFixed(2)} Km</td>
//                 <td class="text-end fw-bold text-success fw-monospace">+${reg.KmRecorridosDia.toFixed(2)} Km</td>
//                 <td class="text-center">
//                     <button class="btn btn-outline-primary btn-sm me-1" title="Editar" onclick="cargarParaEditar(${reg.IdRegistroOdomet})">
//                         <span class="material-symbols-outlined fs-6 align-middle">edit</span>
//                     </button>
//                     <button class="btn btn-outline-danger btn-sm" title="Eliminar" onclick="confirmarEliminar(${reg.IdRegistroOdomet})">
//                         <span class="material-symbols-outlined fs-6 align-middle">delete</span>
//                     </button>
//                 </td>
//             </tr>
//         `;
//     });

//     $("#tbodyOdometro").html(html);
// }

// /**
//  * Guarda (Insert/Update) los datos del formulario mediante AJAX.
//  */
// function guardarRegistro() {
//     const idRegistro = parseInt($("#txtIdRegistroOdometro").val()) || 0;
//     const idVehiculo = parseInt($("#cmbVehiculo").val());
//     const inicioOdom = parseFloat($("#txtInicioOdom").val());
//     const finalOdom = parseFloat($("#txtFinalOdom").val());

//     // Validación básica del frontend (UX rápida)
//     if (finalOdom < inicioOdom) {
//         Swal.fire({
//             icon: 'warning',
//             title: 'Atención',
//             text: 'El odómetro final del día no puede ser menor al inicial.'
//         });
//         return;
//     }

//     const payload = {
//         IdRegistroOdomet: idRegistro,
//         IdVehiculo: idVehiculo,
//         InicioOdom: inicioOdom,
//         FinalOdom: finalOdom
//     };

//     const esEdicion = idRegistro > 0;
//     const metodoHttp = esEdicion ? "PUT" : "POST";
//     const urlEndpoint = esEdicion ? `${URL_API_ODOMETRO}/${idRegistro}` : URL_API_ODOMETRO;

//     $.ajax({
//         url: urlEndpoint,
//         type: metodoHttp,
//         contentType: "application/json",
//         data: JSON.stringify(payload)
//     }).done(function (respuesta) {
//         Swal.fire({
//             icon: 'success',
//             title: '¡Operación Exitosa!',
//             text: respuesta.Mensaje || 'Registro guardado correctamente.',
//             timer: 2000,
//             showConfirmButton: false
//         });

//         limpiarFormulario();
//         listarRegistros();
//     }).fail(function (jqXHR) {
//         // Captura del mensaje de error emitido por el RAISERROR del Stored Procedure o BadRequest de la API
//         let mensajeError = "Ocurrió un error al procesar la solicitud.";
//         if (jqXHR.responseJSON && jqXHR.responseJSON.Message) {
//             mensajeError = jqXHR.responseJSON.Message;
//         } else if (jqXHR.responseText) {
//             // Intenta extraer el texto si vino plano
//             try {
//                 const parsed = JSON.parse(jqXHR.responseText);
//                 mensajeError = parsed.Message || parsed.message || jqXHR.responseText;
//             } catch (e) {
//                 mensajeError = jqXHR.responseText;
//             }
//         }

//         Swal.fire({
//             icon: 'error',
//             title: 'No se pudo guardar',
//             text: mensajeError
//         });
//     });
// }

// /**
//  * Preselecciona en el formulario los datos de la fila a editar.
//  */
// function cargarParaEditar(idRegistro) {
//     const registro = listaRegistrosMemoria.find(r => r.IdRegistroOdomet === idRegistro);
//     if (!registro) return;

//     $("#txtIdRegistroOdometro").val(registro.IdRegistroOdomet);
//     $("#cmbVehiculo").val(registro.IdVehiculo);
//     $("#txtInicioOdom").val(registro.InicioOdom);
//     $("#txtFinalOdom").val(registro.FinalOdom);

//     $("#form-title").html('<span class="material-symbols-outlined align-middle me-1">edit_note</span> Modificar Registro de Odómetro');
//     $("#btnGuardar").html('<span class="material-symbols-outlined fs-5">sync</span> Actualizar Registro');

//     // Scroll suave hasta el formulario
//     $('html, body').animate({ scrollTop: 0 }, 'fast');
// }

// /**
//  * Limpia el formulario y lo restablece para un nuevo registro.
//  */
// function limpiarFormulario() {
//     $("#txtIdRegistroOdometro").val("0");
//     $("#formOdometro")[0].reset();
//     $("#form-title").html('<span class="material-symbols-outlined align-middle me-1">speed</span> Registrar Lectura de Odómetro');
//     $("#btnGuardar").html('<span class="material-symbols-outlined fs-5">save</span> Guardar Registro');
// }

// /**
//  * Solicita confirmación al usuario antes de llamar al endpoint DELETE.
//  */
// function confirmarEliminar(idRegistro) {
//     Swal.fire({
//         title: '¿Estás seguro?',
//         text: 'Esta acción eliminará el registro de odómetro seleccionado.',
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonColor: '#d33',
//         cancelButtonColor: '#6c757d',
//         confirmButtonText: 'Sí, eliminar',
//         cancelButtonText: 'Cancelar'
//     }).then((result) => {
//         if (result.isConfirmed) {
//             ejecutarEliminacion(idRegistro);
//         }
//     });
// }

// /**
//  * Llama al endpoint de borrado de la API.
//  */
// function ejecutarEliminacion(idRegistro) {
//     $.ajax({
//         url: `${URL_API_ODOMETRO}/${idRegistro}`,
//         type: "DELETE"
//     }).done(function (respuesta) {
//         Swal.fire({
//             icon: 'success',
//             title: 'Eliminado',
//             text: respuesta.Mensaje || 'El registro fue eliminado.',
//             timer: 1500,
//             showConfirmButton: false
//         });

//         listarRegistros();
//     }).fail(function (jqXHR) {
//         Swal.fire({
//             icon: 'error',
//             title: 'Error',
//             text: 'No se pudo eliminar el registro seleccionado.'
//         });
//     });
// }