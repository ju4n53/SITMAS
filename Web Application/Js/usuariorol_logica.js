// =========================================================================
// SITMAS - Lógica corregida para el ABM de Usuario - Rol
// =========================================================================
const URL_UR = "https://localhost:44325/api/Usuario_Rol";
let listaUsuarios = []; // Variable global para guardar todos los usuarios
let listaRoles = [];    // Variable global para guardar todos los roles

$(document).ready(function () {
    // 1. Cargamos los catálogos primero para tener los nombres disponibles
    CargarCatalogos();
});

function CargarCatalogos() {
    $.when(
        $.get("https://localhost:44325/api/Usuario/ListarTodo"),
        $.get("https://localhost:44325/api/Roles/ListarTodo")
    ).done(function(respUsuarios, respRoles) {
        listaUsuarios = respUsuarios[0];
        listaRoles = respRoles[0];

        // 1. Llenamos los selects y forzamos el renderizado
        LlenarSelects();
        
        // 2. Imprimimos para verificar
        console.log("Usuarios cargados:", listaUsuarios.length);
        console.log("Selects opciones:", $("#selectUsuarios option").length);

        // 3. Solo listamos la tabla una vez que los selects están confirmados
        ListarUsuarioRol();
    }).fail(function() {
        console.error("Error al cargar los catálogos");
    });
}

function LlenarSelects() {
    console.log("Datos recibidos para Selects - Usuarios:", listaUsuarios, "Roles:", listaRoles);

    let sUser = $("#selectUsuarios");
    sUser.empty().append('<option value="">Seleccione un usuario</option>');
    
    // Validamos que listaUsuarios tenga datos
    if (Array.isArray(listaUsuarios)) {
        listaUsuarios.forEach(u => {
            sUser.append(`<option value="${u.Id}">${u.Usuario}</option>`);
        });
    } else {
        console.error("listaUsuarios no es un arreglo válido");
    }

    let sRol = $("#selectRoles");
    sRol.empty().append('<option value="">Seleccione un rol</option>');
    
    // Validamos que listaRoles tenga datos
    if (Array.isArray(listaRoles)) {
        listaRoles.forEach(r => {
            sRol.append(`<option value="${r.Id}">${r.NombreRol}</option>`);
        });
    } else {
        console.error("listaRoles no es un arreglo válido");
    }
}

function ListarUsuarioRol() {
    $.get(URL_UR + "/ListarTodo", function(data) {
        $("#tbodyUsuarioRol").empty();
        
        data.forEach(o => {
            // Buscamos el objeto completo en nuestras listas globales usando el ID
            let usuarioEncontrado = listaUsuarios.find(u => u.Id == o.Id_Usuario);
            let rolEncontrado = listaRoles.find(r => r.Id == o.Id_Rol);
            
            // Si lo encontramos, usamos el nombre/email, si no, mostramos el ID
            let nombreUsuario = usuarioEncontrado ? usuarioEncontrado.Usuario : "ID: " + o.Id_Usuario;
            let nombreRol = rolEncontrado ? rolEncontrado.NombreRol : "ID: " + o.Id_Rol;
            
            // ... dentro del loop de ListarUsuarioRol
            // Quita el onclick, solo deja la clase para identificar el botón
            $("#tbodyUsuarioRol").append(`<tr>
                <td>${nombreUsuario}</td>
                <td>${nombreRol}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary btn-editar-ur" 
                            data-id="${o.Id}" data-usu="${o.Id_Usuario}" data-rol="${o.Id_Rol}">
                        Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="EliminarUsuarioRol(${o.Id})">
                        Eliminar
                    </button>
                </td>
            </tr>`);
        });
    });
}

function CargarEdicion(id, idUsuario, idRol) {
    console.log("Cargando edición para ID:", id); // Verifica si este ID llega bien
    $("#txtIdUsuarioRol").val(id); 
    
    // Verificación inmediata
    console.log("Valor asignado a #txtIdUsuarioRol:", $("#txtIdUsuarioRol").val());
    
    // ... resto de la función ...
    var collapseElement = document.getElementById('collapseUsuarioRol');
    var bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
    
    // 1. Cargamos el ID oculto para saber qué estamos editando
    $("#txtIdUsuarioRol").val(id);
    
    // 2. Asignamos los valores a los selectores
    // jQuery .val() selecciona automáticamente la opción que coincide con ese valor
    $("#selectUsuarios").val(idUsuario);
    $("#selectRoles").val(idRol);

    // 3. Scroll hacia la tarjeta contenedora para evitar problemas de posicionamiento
    var tarjetaPadre = $("#collapseUsuarioRol").closest(".sitmas-card");
    
    $('html, body').animate({ 
        scrollTop: tarjetaPadre.offset().top - 100 
    }, 500);

    // 4. Abrimos el desplegable
    setTimeout(function() {
        bsCollapse.show();
    }, 300);
}
// (Mantén tus funciones GuardarUsuarioRol y EliminarUsuarioRol aquí)
// Asegúrate de que GuardarUsuarioRol reciba el evento y lo detenga
function GuardarUsuarioRol(event) {
    if (event) event.preventDefault();
    
    // Captura el valor directamente del elemento
    let idRelacion = document.getElementById("txtIdUsuarioRol").value;
    
    console.log("DEBUG: Valor detectado en txtIdUsuarioRol es:", idRelacion);
    
    let idUsuario = parseInt($("#selectUsuarios").val());
    let idRol = parseInt($("#selectRoles").val());

    // Validamos: si el ID es mayor a 0, editamos. Si es vacío o 0, insertamos.
    if (idRelacion && idRelacion !== "" && idRelacion !== "0") {
        console.log("Ejecutando PUT para ID:", idRelacion);
        
        $.ajax({
            type: "PUT",
            url: URL_UR + "/Modificar/" + idRelacion, 
            data: JSON.stringify({ Id_Usuario: idUsuario, Id_Rol: idRol }),
            contentType: "application/json",
            success: function() {
                alert("Actualización exitosa.");
                // Limpiamos el valor explícitamente para que la próxima vez sea una inserción
                $("#txtIdUsuarioRol").val(""); 
                $("#formUsuarioRol")[0].reset();
                ListarUsuarioRol();
            },
            error: function(err) {
                console.error("Error al modificar", err);
                alert("Error al intentar editar.");
            }
        });
    } else {
        console.log("Ejecutando POST (Inserción)");
        ejecutarInsercion({ Id_Usuario: idUsuario, Id_Rol: idRol });
    }
    return false;
}

function limpiarFormulario() {
    $("#txtIdUsuarioRol").val("");
    $("#formUsuarioRol")[0].reset();
}

function ejecutarInsercion(data) {
    $.ajax({
        type: "POST",
        url: URL_UR + "/Insertar",
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function() {
            alert("Operación exitosa.");
            $("#txtIdUsuarioRol").val("");
            $("#formUsuarioRol")[0].reset();
            ListarUsuarioRol(); 
        },
        error: function(err) {
            console.error("Error al insertar", err);
            alert("Error al guardar.");
        }
    });
}

function EliminarUsuarioRol(id) {
    Swal.fire({ title: '¿Estás seguro de Eliminar Usuario-Rol?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "DELETE",
                url: URL_UR + "/Borrar/" + id,
                success: function () {
                    Swal.fire('Eliminado', '', 'success');
                    ListarUsuarioRol();
                }
            });
        }
    });
}

// Pon esto al final de todo tu archivo JS
$(document).on('click', '.btn-editar-ur', function() {
    let id = $(this).data("id");
    let usu = $(this).data("usu");
    let rol = $(this).data("rol");

    console.log("Intentando editar ID:", id, "Usuario ID:", usu, "Rol ID:", rol);

    // Si los selects están vacíos, esto no hará nada.
    // Vamos a forzar la selección:
    $("#selectUsuarios").val(usu);
    $("#selectRoles").val(rol);

    // Si después de esta línea, el select sigue vacío, 
    // entonces el valor 'usu' no existe en tus <option>
    if ($("#selectUsuarios").val() === null) {
        console.warn("El ID", usu, "no fue encontrado en las opciones del select de usuarios.");
    }

    CargarEdicion(id, usu, rol);
});