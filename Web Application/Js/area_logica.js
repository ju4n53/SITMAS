// =========================================================================
// SITMAS - Lógica para ABM Áreas
// =========================================================================
const URL_AREA = "https://localhost:44325/api/Area";

$(document).ready(function () {
    ListarAreas();
});

function ListarAreas() {
    $.get(URL_AREA + "/ListarTodo", function (data) {
        $("#tbodyArea").empty();
        data.forEach(o => {
            // Ajustado a o.Id y o.Area según tu controlador
            $("#tbodyArea").append(`<tr>
                <td>${o.Id}</td>
                <td class="fw-bold">${o.Area}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarEdicionArea(${o.Id}, '${o.Area}')">Editar</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="EliminarArea(${o.Id})">Eliminar</button>
                </td>
            </tr>`);
        });
    });
}

function GuardarArea() {
    let id = $("#txtIdArea").val();
    // Ajustado a la propiedad 'Area' que espera tu controlador
    let data = { Area: $("#input_nombre_area").val() };
    
    let esEdicion = (id && id !== "" && id !== "0");
    let url = esEdicion ? URL_AREA + "/Modificar/" + id : URL_AREA + "/Insertar";
    let metodo = esEdicion ? "PUT" : "POST";

    $.ajax({
        type: metodo,
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function () {
            Swal.fire('Éxito', 'Operación realizada correctamente', 'success');
            $("#formArea")[0].reset();
            $("#txtIdArea").val("0");
            
            var collapseElement = document.getElementById('collapseArea');
            var bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
            bsCollapse.hide();
            
            ListarAreas();
        }
    });
}

function EliminarArea(id) {
    Swal.fire({ title: '¿Estás seguro?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "DELETE",
                url: URL_AREA + "/Borrar/" + id,
                success: function () {
                    Swal.fire('Eliminado', 'El área ha sido eliminada.', 'success');
                    ListarAreas();
                }
            });
        }
    });
}

function CargarEdicionArea(id, nombre) {
    var collapseElement = document.getElementById('collapseArea');
    var bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
    
    // 1. Cargamos los datos primero (son independientes del despliegue)
    $("#txtIdArea").val(id);
    $("#input_nombre_area").val(nombre);

    // 2. Primero el Scroll hacia la posición donde aparecerá el formulario
    // Esto prepara la vista antes de que la página cambie de altura
    $('html, body').animate({ 
        scrollTop: $("#formArea").offset().top - 120 
    }, 400);

    // 3. Luego, una vez que el scroll inicia (o termina), abrimos el desplegable
    // El pequeño delay (200ms) asegura que el usuario vea el scroll primero
    setTimeout(function() {
        bsCollapse.show();
    }, 100);
}