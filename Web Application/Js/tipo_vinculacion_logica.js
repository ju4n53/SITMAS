// =========================================================================
// SITMAS - Lógica para ABM Tipo de Vinculación
// =========================================================================
const URL_VINCULACION = "https://localhost:44325/api/TpVinculacion";

$(document).ready(function () {
    ListarVinculaciones();
});

function ListarVinculaciones() {
    $.get(URL_VINCULACION + "/ListarTodo", function (data) {
        $("#tbodyTipoVinculacion").empty();
        data.forEach(o => {
            // Nota: El ID en el controlador parece ser IdVinculacion
            $("#tbodyTipoVinculacion").append(`<tr>
                <td>${o.IdVinculacion}</td>
                <td class="fw-bold">${o.TipoVinculacion}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarEdicionVinculacion(${o.IdVinculacion}, '${o.TipoVinculacion}')">Editar</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="EliminarVinculacion(${o.IdVinculacion})">Eliminar</button>
                </td>
            </tr>`);
        });
    });
}

function GuardarVinculacion() {
    let id = $("#txtIdVinculacion").val();
    let data = { TipoVinculacion: $("#input_tipo_vinculacion").val() };
    
    let esEdicion = (id && id !== "" && id !== "0");
    let url = esEdicion ? URL_VINCULACION + "/Modificar/" + id : URL_VINCULACION + "/Insertar";
    
    $.ajax({
        type: "PUT", // Usamos POST para insertar y modificar según tu estructura
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function () {
            Swal.fire('Éxito', 'Operación realizada correctamente', 'success');
            
            // Limpiar formulario e ID
            $("#formTipoVinculacion")[0].reset();
            $("#txtIdVinculacion").val("0");
            
            // Cerrar el acordeón de registro
            var collapseElement = document.getElementById('collapseTipoVinculacion');
            var bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
            bsCollapse.hide();
            
            ListarVinculaciones();
        },
        error: function(xhr) {
            Swal.fire('Error', 'No se pudo guardar: ' + xhr.responseText, 'error');
        }
    });
}

function EliminarVinculacion(id) {
    Swal.fire({ title: '¿Estás seguro?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "DELETE",
                url: URL_VINCULACION + "/Borrar/" + id,
                success: function () {
                    Swal.fire('Eliminado', 'La vinculación ha sido eliminada.', 'success');
                    ListarVinculaciones();
                }
            });
        }
    });
}

function CargarEdicionVinculacion(id, nombre) {
    var collapseElement = document.getElementById('collapseTipoVinculacion');
    var bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
    
    // 1. Cargamos los datos primero (son independientes del despliegue)
    $("#txtIdVinculacion").val(id);
    $("#input_tipo_vinculacion").val(nombre);

    // 2. Primero el Scroll hacia la posición donde aparecerá el formulario
    // Esto prepara la vista antes de que la página cambie de altura
    $('html, body').animate({ 
        scrollTop: $("#formTipoVinculacion").offset().top - 120 
    }, 400);

    // 3. Luego, una vez que el scroll inicia (o termina), abrimos el desplegable
    // El pequeño delay (200ms) asegura que el usuario vea el scroll primero
    setTimeout(function() {
        bsCollapse.show();
    }, 200);
}