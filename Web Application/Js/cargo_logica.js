// =========================================================================
// SITMAS - Lógica para ABM Cargos
// =========================================================================
const URL_CARGO = "https://localhost:44325/api/Cargo";

$(document).ready(function () {
    ListarCargos();
});

function ListarCargos() {
    $.get(URL_CARGO + "/ListarTodo", function (data) {
        $("#tbodyCargo").empty();
        data.forEach(o => {
            $("#tbodyCargo").append(`<tr>
                <td>${o.Id}</td>
                <td class="fw-bold">${o.Cargo}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarEdicionCargo(${o.Id}, '${o.Cargo}')">Editar</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="EliminarCargo(${o.Id})">Eliminar</button>
                </td>
            </tr>`);
        });
    });
}

function GuardarCargo() {
    let id = $("#txtIdCargo").val();
    let data = { Cargo: $("#input_nombre_cargo").val() };
    
    let esEdicion = (id && id !== "" && id !== "0");
    let url = esEdicion ? URL_CARGO + "/Modificar/" + id : URL_CARGO + "/Insertar";
    let metodo = esEdicion ? "PUT" : "POST";

    $.ajax({
        type: metodo,
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function () {
            Swal.fire('Éxito', 'Operación realizada correctamente', 'success');
            $("#formCargo")[0].reset();
            $("#txtIdCargo").val("0");
            
            var collapseElement = document.getElementById('collapseCargo');
            var bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
            bsCollapse.hide();
            
            ListarCargos();
        }
    });
}

function EliminarCargo(id) {
    Swal.fire({ title: '¿Eliminar cargo?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "DELETE",
                url: URL_CARGO + "/Borrar/" + id,
                success: function () {
                    Swal.fire('Eliminado', '', 'success');
                    ListarCargos();
                }
            });
        }
    });
}

function CargarEdicionCargo(id, nombre) {
    var collapseElement = document.getElementById('collapseCargo');
    var bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
    
    $("#txtIdCargo").val(id);
    $("#input_nombre_cargo").val(nombre);

    // Scroll primero, apertura después
    $('html, body').animate({ 
        scrollTop: $("#formCargo").offset().top - 120 
    }, 400);

    setTimeout(function() {
        bsCollapse.show();
    }, 200);
}