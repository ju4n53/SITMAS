// =========================================================================
// SITMAS - Lógica para el ABM de Permisos
// =========================================================================
const URL_PERMISO = "https://localhost:44325/api/Permisos"; // Ajusta la URL si es necesario

$(document).ready(function () {
    ListarPermisos();
});

function ListarPermisos() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: URL_PERMISO + "/ListarTodo",
        success: function (data) {
            $("#tbodyPermisos").empty();
            data.forEach(o => {
                // CAMBIA 'o.Nombre' por 'o.PermisoUsuario'
                // ... dentro de data.forEach(o => { ...
                $("#tbodyPermisos").append(`<tr>
                    <td>${o.Id}</td>
                    <td class="fw-bold">${o.PermisoUsuario}</td> 
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" 
                                onclick="CargarEdicionPermiso(${o.Id}, '${o.PermisoUsuario}')">
                            Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="EliminarPermiso(${o.Id})">
                            Eliminar
                        </button>
                    </td>
                </tr>`);
            });
        }
    });
}

function GuardarPermiso() {
    let id = $("#txtIdPermiso").val();
    let permiso = { 
        PermisoUsuario: $("#txtNombrePermiso").val() 
    };
    
    let esEdicion = (id !== "" && id !== undefined && id !== "0");
    
    // Si es edición, llamamos a Modificar/id, si no a Insertar
    let url = esEdicion ? URL_PERMISO + "/Modificar/" + id : URL_PERMISO + "/Insertar";
    
    // USAMOS SIEMPRE "POST"
    $.ajax({
        type: "POST", 
        url: url,
        data: JSON.stringify(permiso),
        contentType: "application/json; charset=utf-8",
        success: function () {
            alert("Operación realizada con éxito");
            $("#formPermiso")[0].reset();
            $("#txtIdPermiso").val("");
            ListarPermisos();
        },
        error: function(xhr, status, error) {
            console.error("Error:", xhr.responseText);
            alert("Error al guardar. Verifica la consola.");
        }
    });
}

function EliminarPermiso(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¡No podrás revertir esta acción!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "DELETE", 
                url: URL_PERMISO + "/Borrar/" + id, 
                success: function () { 
                    Swal.fire('¡Eliminado!', 'El permiso ha sido borrado.', 'success');
                    ListarPermisos(); 
                },
                error: function() {
                    Swal.fire('Error', 'No se pudo eliminar el permiso.', 'error');
                }
            });
        }
    });
}
function CargarEdicionPermiso(id, nombre) {
    var collapseElement = document.getElementById('collapsePermiso');
    var bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
    
    $("#txtIdPermiso").val(id);
    $("#txtNombrePermiso").val(nombre);

    // Scroll primero, apertura después
    $('html, body').animate({ 
        scrollTop: $("#formPermiso").offset().top - 120 
    }, 400);

    setTimeout(function() {
        bsCollapse.show();
    }, 200);
}