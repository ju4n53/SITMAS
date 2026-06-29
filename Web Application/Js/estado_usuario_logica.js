
// ==========================================================================================
// LOGICA ESTADO DE USUARIO * Responsable de la comunicación con la API para el ABM de estados.
// ==========================================================================================

const URL_ESTADO = "https://localhost:44325/api/EstadoUsuario";

$(document).ready(function () {
    ListarEstadoUsuario();

    // Evento de escucha para el formulario (Envío de datos)
    $("#formEstadoUsuario").on("submit", function (e) {
        e.preventDefault();
        GuardarEstado();
    });
});

/**
 * Función: ListarEstadoUsuario
 * Objetivo: Obtener registros y renderizar la tabla.
 */
function ListarEstadoUsuario() {
    $.get(URL_ESTADO + "/ListarTodo", function (data) {
        $("#tbodyEstadoUsuario").empty();
        data.forEach(e => {
            $("#tbodyEstadoUsuario").append(`<tr>
                <td>${e.Id}</td>
                <td class="fw-bold">${e.EstadoUsuario}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" 
                            onclick="CargarEdicion(${e.Id}, '${e.EstadoUsuario}')">Editar</button>
                    <button class="btn btn-sm btn-outline-danger" 
                            onclick="EliminarEstado(${e.Id})">Eliminar</button>
                </td>
            </tr>`);
        });
    });
}

/**
 * Función: GuardarEstado
 * Objetivo: Crea o actualiza un estado y muestra la alerta de éxito.
 */
function GuardarEstado() {
    let id = $("#txtIdEstado").val();
    let data = { EstadoUsuario: $("#txtEstado").val() };
    let esEdicion = id !== "";

    $.ajax({
        url: esEdicion ? `${URL_ESTADO}/Modificar/${id}` : `${URL_ESTADO}/Insertar`,
        type: esEdicion ? "PUT" : "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function () {
            // Alerta de éxito unificada
            Swal.fire({
                icon: 'success',
                title: esEdicion ? '¡Estado actualizado!' : '¡Estado registrado!',
                text: 'La operación se realizó con éxito.',
                timer: 2000,
                showConfirmButton: false
            });
            
            LimpiarFormulario();
            ListarEstadoUsuario();
        },
        error: function() {
            Swal.fire('Error', 'No se pudo completar la operación', 'error');
        }
    });
}

/**
 * Función: EliminarEstado
 * Objetivo: Elimina un estado tras confirmación.
 */
function EliminarEstado(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: URL_ESTADO + "/Borrar/" + id,
                type: "DELETE",
                success: function () {
                    Swal.fire('Eliminado', 'El estado ha sido borrado.', 'success');
                    ListarEstadoUsuario();
                }
            });
        }
    });
}

/**
 * Función: CargarEdicion
 * Objetivo: Carga datos en formulario.
 */
function CargarEdicion(id, nombre) {
    $("#txtIdEstado").val(id);
    $("#txtEstado").val(nombre);
    // Opcional: hacer scroll al formulario para mejor UX
    $('html, body').animate({ scrollTop: $("#formEstadoUsuario").offset().top - 100 }, 500);
}

function LimpiarFormulario() {
    $("#txtIdEstado").val("");
    $("#txtEstado").val("");
}