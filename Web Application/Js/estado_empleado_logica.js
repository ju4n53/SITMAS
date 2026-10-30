// =========================================================================
// SITMAS - Lógica para ABM Estado Empleado
// =========================================================================
const URL_ESTADO = "https://localhost:44325/api/EstadoEmpleado";

$(document).ready(function () {
    ListarEstados();
});

function ListarEstados() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: URL_ESTADO + "/ListarTodo",
        // Asegúrate de usar exactamente el nombre que aparece en la consola (EstadoEmpleado)
        success: function (data) {
            $("#tbodyEstadoEmpleado").empty();
            data.forEach(o => {
                $("#tbodyEstadoEmpleado").append(`<tr>
                    <td>${o.Id}</td>
                    <td class="fw-bold">${o.EstadoEmpleado}</td> 
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" 
                                onclick="CargarEdicionEstado(${o.Id}, '${o.EstadoEmpleado}')">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="EliminarEstado(${o.Id})">Eliminar</button>
                    </td>
                </tr>`);
            });
        }
    });
}

function GuardarEstado() {
    let id = $("#txtIdEstado").val();
    
    // El objeto que espera el API
    let data = { 
        EstadoEmpleado: $("#estado_empleado").val() 
    };

    // Lógica para saber si es insertar (POST) o modificar (PUT)
    let esEdicion = (id && id !== "" && id !== "0");
    let url = esEdicion ? URL_ESTADO + "/Modificar/" + id : URL_ESTADO + "/Insertar";
    let metodo = esEdicion ? "PUT" : "POST";

    $.ajax({
        type: metodo, // Usamos PUT para modificar según tu controlador
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function () {
            Swal.fire('Éxito', 'Operación realizada con éxito', 'success');
            // Limpiar formulario e ID
            $("#formEstadoEmpleado")[0].reset();
            $("#txtIdEstado").val("");
            // 2. Cerrar el acordeón de registro
            var collapseElement = document.getElementById('collapseEstadoEmpleado');
            var bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
            bsCollapse.hide();

            ListarEstados();
        },
        error: function(xhr, status, error) {
            Swal.fire('Error', 'No se pudo procesar la solicitud', 'error');
            console.error(xhr.responseText);
        }
    });
}
function EliminarEstado(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "DELETE",
                url: URL_ESTADO + "/Borrar/" + id,
                success: function () {
                    Swal.fire('Eliminado', '', 'success');
                    ListarEstados();
                }
            });
        }
    });
}

function CargarEdicionEstado(id, nombre) {
  var collapseElement = document.getElementById('collapseEstadoEmpleado');
    var bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
    
    // 1. Cargamos los datos primero (son independientes del despliegue)
    $("#txtIdEstado").val(id);
    $("#estado_empleado").val(nombre);

    // 2. Primero el Scroll hacia la posición donde aparecerá el formulario
    // Esto prepara la vista antes de que la página cambie de altura
    $('html, body').animate({ 
        scrollTop: $("#formEstadoEmpleado").offset().top - 120 
    }, 400);

    // 3. Luego, una vez que el scroll inicia (o termina), abrimos el desplegable
    // El pequeño delay (200ms) asegura que el usuario vea el scroll primero
    setTimeout(function() {
        bsCollapse.show();
    }, 200);
}