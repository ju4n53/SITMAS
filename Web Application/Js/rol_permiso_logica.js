// =========================================================================
// SITMAS - Lógica Completa para el ABM de Rol - Permiso
// =========================================================================

const URL_BASE_ROL_PERMISO = "https://localhost:44325/api/Rol_Permiso";

$(document).ready(function () {
    ListarRolPermiso();
    CargarSelects();
});

// --- LISTAR ---
function ListarRolPermiso() {
    $.ajax({
        type: "GET",
        url: URL_BASE_ROL_PERMISO + "/ListarVista",
        success: function (data) {
            const tbody = $("#tbodyRolPermiso");
            tbody.empty();
            data.forEach(o => {
                tbody.append(`<tr>
                    <td>${o.NombreRol}</td> 
                    <td>${o.PermisoUsuario}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" 
                                onclick="EditarRolPermiso(${o.Id_Rol}, ${o.Id_Permiso})">
                            Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="EliminarRolPermiso(${o.Id_Rol}, ${o.Id_Permiso})">
                            Eliminar
                        </button>
                    </td>
                </tr>`);
            });
        }
    });
}

// --- CARGAR SELECTS ---
// --- CARGAR SELECTS ---
function CargarSelects() {
    // Cargar lista de Roles
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/Roles/ListarTodo",
        success: function (data) {
            let select = $("#selectRolPermiso_Rol");
            select.empty().append('<option value="">Seleccione rol</option>');
            data.forEach(o => select.append(`<option value="${o.Id}">${o.NombreRol}</option>`));
        }
    });

    // Cargar lista de Permisos - CORRECCIÓN AQUÍ
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/Permisos/ListarTodo",
        success: function (data) {
            let select = $("#selectRolPermiso_Permiso");
            select.empty().append('<option value="">Seleccione permiso</option>');
            data.forEach(o => {
                // Si esto sigue dando undefined, mira en la consola qué nombre tiene la propiedad
                // Probablemente sea 'PermisoUsuario' o 'Nombre'
                let nombre = o.NombrePermiso || o.PermisoUsuario || o.Nombre || "Sin nombre";
                select.append(`<option value="${o.Id}">${nombre}</option>`);
            });
        }
    });
}

// --- PREPARAR EDICION ---
function EditarRolPermiso(idRol, idPermiso) {
    // 1. Cargamos los valores en los selects
    $("#selectRolPermiso_Rol").val(idRol);
    $("#selectRolPermiso_Permiso").val(idPermiso);
    
    // 2. Guardamos los valores para referencia
    $("#txtIdRolOriginal").val(idRol);
    $("#txtIdPermisoOriginal").val(idPermiso);
    
    // 3. Desplegamos el acordeón
    $('#collapseRolPermiso').collapse('show');
    
    // 4. Scroll suave hacia el tope de la página o hacia el contenedor del formulario
    $('html, body').animate({
        scrollTop: $("#formRolPermiso").offset().top - 100 // Ajuste de -100px para no quedar pegado al borde
    }, 500); // 500ms es la velocidad del scroll
}

// --- GUARDAR / MODIFICAR ---
// --- GUARDAR / MODIFICAR (ESTRATEGIA DE REEMPLAZO) ---
// --- GUARDAR / MODIFICAR ---
function GuardarRolPermiso() {
    // Aquí NO buscamos ID en la URL, enviamos el objeto directamente
    let data = { 
        Id_Rol: parseInt($("#selectRolPermiso_Rol").val()), 
        Id_Permiso: parseInt($("#selectRolPermiso_Permiso").val()) 
    };
    
    $.ajax({
        type: "POST", // Coherente con tu controlador BorrarAsociacion
        url: URL_BASE_ROL_PERMISO + "/Modificar", // SIN el ID al final
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        success: function () {
            alert("Operación exitosa");
            ListarRolPermiso();
        },
        error: function(xhr) {
            console.error("Error:", xhr.responseText);
            alert("Error al guardar. Revisa la consola.");
        }
    });
}
// --- ELIMINAR ---
function EliminarRolPermiso(idRol, idPermiso) {
    if (confirm("¿Confirmar eliminación de la relación?")) {
        $.ajax({
            type: "POST",
            url: URL_BASE_ROL_PERMISO + "/BorrarAsociacion",
            contentType: "application/json",
            data: JSON.stringify({ Id_Rol: idRol, Id_Permiso: idPermiso }),
            success: function () {
                ListarRolPermiso();
            }
        });
    }
}