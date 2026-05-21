const URL_ORIGEN = "https://localhost:44325/api/Origen";
const URL_BARRIOS = "https://localhost:44325/api/Barrio"; // Ajusta según tu URL real
let barriosData = []; // Aquí guardaremos los barrios

$(document).ready(function () {
    // Primero cargamos los barrios para tenerlos en memoria
    $.get(URL_BARRIOS + "/ListarTodo", function(data) {
        barriosData = data; 
        ListarOrigenes(); // Recién ahora listamos
    });
});

function ListarOrigenes() {
    $.get(URL_ORIGEN + "/ListarTodo", function(data) {
        $("#tbodyOrigenes").empty();
        
        data.forEach(o => {
            let nombreBarrio = obtenerNombreBarrio(o.Id_Barrio); // Buscamos el nombre
            
            $("#tbodyOrigenes").append(`<tr>
                <td>${o.IdOrigen}</td>
                <td>${o.EmpresaInstitucion}</td>
                <td>${o.CalleEI}</td>
                <td>${o.NumeroEI}</td>
                <td>${o.TelefonoEI}</td>
                <td>${nombreBarrio}</td> <td>${o.EmailEI}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="CargarEdicion(${o.IdOrigen}, '${o.EmpresaInstitucion}', '${o.CalleEI}', '${o.NumeroEI}', '${o.TelefonoEI}', ${o.Id_Barrio}, '${o.EmailEI}')">Editar</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="EliminarOrigen(${o.IdOrigen})">Eliminar</button>
                </td>
            </tr>`);
        });
    });
}

function GuardarOrigen() {
    let id = $("#txtIdOrigen").val();
    let data = {
        IdOrigen: id, // Incluimos el ID dentro del JSON
        EmpresaInstitucion: $("#empresa_institucion").val(),
        CalleEI: $("#calle").val(),
        NumeroEI: $("#numero").val(),
        TelefonoEI: $("#telefono").val(),
        Id_Barrio: $("#id_barrio").val(),
        EmailEI: $("#email").val()
    };
    
    // Si ID es > 0, es modificación, sino inserción
    let esModificacion = (id != "0" && id != "");
    let urlFinal = esModificacion ? URL_ORIGEN + "/Modificar?id=" + id : URL_ORIGEN + "/Insertar";
    
    $.ajax({
        type: "POST", // Tu API está configurada con [HttpPost] para todo
        url: urlFinal,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        success: function() {
            alert("Operación exitosa");
            LimpiarFormulario();
            ListarOrigenes();
        },
        error: function(xhr, status, error) {
            console.log("Error:", error);
        }
    });
}

function CargarEdicion(id, nombre, calle, num, tel, barrio, email) {
    $("#txtIdOrigen").val(id);
    $("#empresa_institucion").val(nombre);
    $("#calle").val(calle);
    $("#numero").val(num);
    $("#telefono").val(tel);
    $("#id_barrio").val(barrio);
    $("#email").val(email);

    // Abrir acordeón y hacer scroll
    document.getElementById('collapseForm').classList.add('show');
    document.getElementById('collapseForm').scrollIntoView({ behavior: 'smooth' });
}

function EliminarOrigen(id) {
    if(confirm("¿Seguro que deseas eliminar este origen?")) {
        // Debes enviar el id como parámetro de query string (?id=...)
        $.post(URL_ORIGEN + "/Borrar?id=" + id, function() { 
            ListarOrigenes(); 
        });
    }
}

function LimpiarFormulario() {
    $("#txtIdOrigen").val("0");
    $("#formOrigen")[0].reset();
}

function obtenerNombreBarrio(id) {
    // Ajustamos b.Id y b.Barrio 
    let barrio = barriosData.find(b => Number(b.Id) === Number(id));
    
    // Si no lo encuentra, retornamos "Sin asignar"
    return barrio ? barrio.Barrio : "Sin asignar"; 
}