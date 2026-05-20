$(document).ready(function () {
    CargarTablaAreas();
});

const URL_BASE = "https://localhost:44325/api/Area";

function CargarTablaAreas() {
    $.ajax({
        // 1. Cambiamos /Get por /ListarTodo porque así se llama tu método en C#
        url: URL_BASE + "/ListarTodo",
        type: "GET",
        success: function (lista) {
            let html = "";
            lista.forEach(item => {
                html += `<tr>
                    <td>${item.Id}</td>
                    <td>${item.Area}</td>
                    <td>
                        <button onclick="PrepararEdicion(${item.Id}, '${item.Area}')" class="btn-editar">Editar</button>
                    </td>
                </tr>`;
            });
            $("#tbodyAreas").html(html);
        },
        error: function (err) {
            console.error("Error en ListarTodo:", err);
            alert("No se pudo cargar la tabla. Revisa la consola (F12).");
        }
    });
}

function GuardarArea() {
    const id = $("#id_area_trabajo").val();
    const nombre = $("#nombre_area_input").val();
    if (!nombre) return;

    const objetoArea = { Area: nombre };

    if (id === "") {
        // 2. Cambiamos /Post por /Insertar
        $.ajax({
            url: URL_BASE + "/Insertar",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(objetoArea),
            success: function () {
                alert("¡Área insertada con éxito!");
                LimpiarFormulario();
                CargarTablaAreas();
            }
        });
    } else {
        // 3. Cambiamos /Put por /Modificar
        objetoArea.Id = parseInt(id);
        $.ajax({
            url: URL_BASE + "/Modificar/" + id,
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify(objetoArea),
            success: function () {
                alert("¡Área modificada!");
                LimpiarFormulario();
                CargarTablaAreas();
            }
        });
    }
}

function PrepararEdicion(id, nombre) {
    $("#id_area_trabajo").val(id);
    $("#nombre_area_input").val(nombre);
}

function LimpiarFormulario() {
    $("#id_area_trabajo").val("");
    $("#nombre_area_input").val("");
}