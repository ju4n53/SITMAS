const URL_TP = "https://localhost:44325/api/TP_Material";
const URL_SBTP = "https://localhost:44325/api/SbTp_Material";

// Variable global para almacenar los tipos y hacer el "cruce" de nombres
let tiposMaterial = [];

$(document).ready(function () {
    // Iniciamos cargando los tipos y luego los subtipos
    ObtenerTiposYListar();
    CargarSelectTipoMaterial();
});

// --- LISTADO GENERAL ---
function ObtenerTiposYListar() {
    $.get(URL_TP + "/ListarTodo", function(data) {
        tiposMaterial = data; 
        ListarSubtipos(); // Listamos subtipos solo después de tener los tipos
        
        // Pintar tabla de tipos
        $("#tbodyTipos").empty();
        data.forEach(t => {
            $("#tbodyTipos").append(`<tr>
                <td>${t.IdTipoMaterial}</td>
                <td>${t.TipoMaterial}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="CargarEdicionTipo(${t.IdTipoMaterial}, '${t.TipoMaterial}')">Editar</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="EliminarTipo(${t.IdTipoMaterial})">Eliminar</button>
                </td>
            </tr>`);
        });
    });
}

function ListarSubtipos() {
    $.get(URL_SBTP + "/ListarTodo", function(data) {
        $("#tbodySubtipos").empty();
        data.forEach(s => {
            // Buscamos el nombre del tipo asociado al ID
            let tipoEncontrado = tiposMaterial.find(t => t.IdTipoMaterial == s.Id_Tipo_Material);
            let nombreTipo = tipoEncontrado ? tipoEncontrado.TipoMaterial : "N/A";

            $("#tbodySubtipos").append(`<tr>
                <td>${s.IdSubtipoM}</td>
                <td>${nombreTipo}</td> <td>${s.Subtipo}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="CargarEdicionSub(${s.IdSubtipoM}, ${s.Id_Tipo_Material}, '${s.Subtipo}')">Editar</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="EliminarSubtipo(${s.IdSubtipoM})">Eliminar</button>
                </td>
            </tr>`);
        });
    });
}

// --- LÓGICA TIPO MATERIAL ---
function GuardarTipo() {
    let id = $("#txtIdTipo").val();
    let data = { TipoMaterial: $("#txtNombreTipo").val() };
    let url = (id != "0") ? URL_TP + "/Modificar/" + id : URL_TP + "/Insertar";
    
    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function() { 
            alert("Tipo procesado correctamente"); 
            limpiarFormularios();
            ObtenerTiposYListar(); 
        }
    });
}

function CargarEdicionTipo(id, nombre) {
    $("#txtIdTipo").val(id);
    $("#txtNombreTipo").val(nombre);
    document.getElementById('collapseTipoMaterial').classList.add('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function EliminarTipo(id) {
    if(confirm("¿Eliminar este tipo?")) {
        $.post(URL_TP + "/Borrar/" + id, function() { ObtenerTiposYListar(); });
    }
}

// --- LÓGICA SUBTIPO MATERIAL ---
function CargarSelectTipoMaterial() {
    $.get(URL_TP + "/ListarTodo", function(data) {
        $("#selectTipoMaterial").empty();
        data.forEach(t => {
            $("#selectTipoMaterial").append(`<option value="${t.IdTipoMaterial}">${t.TipoMaterial}</option>`);
        });
    });
}

function GuardarSubtipo() {
    let id = $("#txtIdSubtipo").val();
    let data = { 
        Id_Tipo_Material: $("#selectTipoMaterial").val(), 
        Subtipo: $("#txtNombreSubtipo").val() 
    };
    let url = (id != "0") ? URL_SBTP + "/Modificar/" + id : URL_SBTP + "/Insertar";
    
    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function() { 
            alert("Subtipo procesado correctamente"); 
            limpiarFormularios();
            ObtenerTiposYListar(); 
        }
    });
}

function CargarEdicionSub(id, idTipo, nombre) {
    $("#txtIdSubtipo").val(id);
    $("#selectTipoMaterial").val(idTipo);
    $("#txtNombreSubtipo").val(nombre);
    document.getElementById('collapseSubtipoMaterial').classList.add('show');
    document.getElementById('collapseSubtipoMaterial').scrollIntoView({ behavior: 'smooth' });
}

function EliminarSubtipo(id) {
    if(confirm("¿Eliminar este subtipo?")) {
        $.post(URL_SBTP + "/Borrar/" + id, function() { ObtenerTiposYListar(); });
    }
}

function limpiarFormularios() {
    $("#txtIdTipo").val("0"); 
    $("#txtNombreTipo").val("");
    $("#txtIdSubtipo").val("0"); 
    $("#txtNombreSubtipo").val("");
}