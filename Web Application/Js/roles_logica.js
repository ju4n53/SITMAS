// =========================================================================
// SITMAS - Lógica para el ABM de Roles
// =========================================================================

// roles_logica.js
const URL_BASE_ROL = "https://localhost:44325/api/Roles";

$(document).ready(function () {
    ListarRoles();
});

// --- FUNCIONES DE ABM ---

function ListarRoles() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: URL_BASE_ROL + "/ListarTodo",
        success: function (data) {
            const tbody = $("#tbodyRoles"); // Asegúrate que tu tabla en config_acceso.html tenga este ID
            tbody.empty();
            data.forEach(o => {
                // Dentro de tu función ListarRoles, en el .append:
                tbody.append(`<tr>
                    <td>${o.Id}</td>
                    <td>${o.NombreRol}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" 
                                onclick="$('#txtIdRol').val('${o.Id}'); $('#rol').val('${o.NombreRol}');">
                            Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="EliminarRol(${o.Id})">
                            Eliminar
                        </button>
                    </td>
                </tr>`);
            });
        },
        error: function () { alert("Error al cargar los roles."); }
    });
}

function GuardarRol() {
    let id = $("#txtIdRol").val(); // Obtenemos el ID del campo oculto
    let rol = { NombreRol: $("#rol").val() };

    // Si id tiene valor, es un PUT (Modificar), si no, un POST (Insertar)
    let esEdicion = (id !== "" && id !== null);
    let url = esEdicion ? "https://localhost:44325/api/Roles/Modificar/" + id : "https://localhost:44325/api/Roles/Insertar";
    let tipo = esEdicion ? "PUT" : "POST";

    $.ajax({
        type: tipo,
        url: url,
        data: JSON.stringify(rol),
        contentType: "application/json; charset=utf-8",
        success: function () {
            alert("Operación realizada con éxito");
            $("#formRol")[0].reset(); 
            $("#txtIdRol").val(""); // Limpiamos el ID oculto
            ListarRoles(); // Recargamos la tabla
        }
    });
}

function EliminarRol(id) {
    if (confirm("¿Está seguro de eliminar este rol?")) {
        $.ajax({
            type: "DELETE", // Asumiendo que el endpoint de borrado sea DELETE
            url: URL_BASE_ROL + "/Borrar/" + id,
            success: function () {
                alert("Rol eliminado.");
                ListarRoles();
            },
            error: function () { alert("Error al eliminar."); }
        });
    }
}

function PrepararModificar(id, nombre) {
    $("#txtIdRol").val(id);
    $("#txtNombreRol").val(nombre);
    $("#modalRol").modal('show');
}