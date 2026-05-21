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
                $("#tbodyPermisos").append(`<tr>
                    <td>${o.Id}</td>
                    <td class="fw-bold">${o.PermisoUsuario}</td> 
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" 
                                onclick="$('#txtIdPermiso').val(${o.Id}); $('#txtNombrePermiso').val('${o.PermisoUsuario}'); $('#collapsePermiso').collapse('show');">
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
    if (confirm("¿Seguro que deseas eliminar este permiso?")) {
        $.ajax({
            // Cambiamos 'POST' por 'DELETE' para que coincida con el controlador
            type: "DELETE", 
            // Asegúrate de que la ruta sea correcta: api/Permisos/Borrar/id
            url: URL_PERMISO + "/Borrar/" + id, 
            success: function () { 
                alert("Permiso eliminado correctamente");
                ListarPermisos(); 
            },
            error: function(xhr, status, error) {
                console.error("Error al eliminar:", error);
                alert("No se pudo eliminar el permiso. Verifica que el método sea DELETE.");
            }
        });
    }
}