const URL_UR = "https://localhost:44325/api/UsuarioRol"; // Ajusta según tu controlador

$(document).ready(function () {
    CargarSelects();
    ListarUsuarioRol();
});

function CargarSelects() {
    // Llenar Usuarios
    $.get("https://localhost:44325/api/Usuario/ListarTodo", function(data) {
        $("#selectUsuarios").empty();
        data.forEach(u => $("#selectUsuarios").append(`<option value="${u.Id}">${u.Nombre}</option>`));
    });
    
    // Llenar Roles
    $.get("https://localhost:44325/api/Roles/ListarTodo", function(data) {
        $("#selectRoles").empty();
        data.forEach(r => $("#selectRoles").append(`<option value="${r.Id}">${r.Nombre}</option>`));
    });
}

function ListarUsuarioRol() {
    $.get(URL_UR + "/ListarTodo", function(data) {
        $("#tbodyUsuarioRol").empty();
        data.forEach(o => {
            $("#tbodyUsuarioRol").append(`<tr>
                <td>${o.UsuarioNombre}</td>
                <td><span class="badge bg-light text-dark">${o.RolNombre}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="CargarEdicion(${o.Id}, ${o.UsuarioId}, ${o.RolId})">Editar</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="EliminarUsuarioRol(${o.Id})">Eliminar</button>
                </td>
            </tr>`);
        });
    });
}

function GuardarUsuarioRol() {
    let id = $("#txtIdUsuarioRol").val();
    let data = { 
        UsuarioId: $("#selectUsuarios").val(), 
        RolId: $("#selectRoles").val() 
    };
    
    // Usamos POST para insertar y modificar (siguiendo nuestra estrategia exitosa)
    let url = (id && id !== "0") ? URL_UR + "/Modificar/" + id : URL_UR + "/Insertar";
    
    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function() {
            alert("Relación guardada");
            $("#txtIdUsuarioRol").val("");
            ListarUsuarioRol();
        }
    });
}

function CargarEdicionTipo(id, nombre) {
    // 1. Llenamos los datos
    $("#txtIdTipo").val(id);
    $("#txtNombreTipo").val(nombre);

    // 2. Abrimos el acordeón de forma programática
    var collapseElement = document.getElementById('collapseTipoMaterial');
    var bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
    bsCollapse.show();

    // 3. Scroll suave al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function CargarEdicionSub(id, idTipo, nombre) {
    // 1. Llenamos los datos
    $("#txtIdSubtipo").val(id);
    $("#selectTipoMaterial").val(idTipo);
    $("#txtNombreSubtipo").val(nombre);

    // 2. Abrimos el acordeón de forma programática
    var collapseElement = document.getElementById('collapseSubtipoMaterial');
    var bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
    bsCollapse.show();
    
    // 3. Scroll suave al formulario
    collapseElement.scrollIntoView({ behavior: 'smooth' });
}