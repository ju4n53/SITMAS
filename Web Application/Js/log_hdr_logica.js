// ==========================================================================================
// CONSTANTES GLOBALES Y DIRECCIONES API (MÓDULO: HOJA DE RUTA)
// ==========================================================================================
// Apunta explícitamente al puerto de tu backend de Visual Studio para evitar los 404 del Live Server
const URL_BASE = "https://localhost:44325/api"; 
const URL_EST_HDR = URL_BASE + "/EST_HDR";
const URL_HDR = URL_BASE + "/HojaRuta";

// Colecciones globales para búsquedas instantáneas en edición y mapeo de foráneas
let globalEstadosHdr = [];
let globalHojasRuta = [];

// Arrays auxiliares para resolver los nombres de IDs foráneos en las tablas
let globalAuxVehiculos = [];
let globalAuxChoferes = [];

// ==========================================================================================
// INICIALIZACIÓN DEL MÓDULO HOJA DE RUTA
// ==========================================================================================
$(document).ready(function () {
    InicializarModuloHdr();
    AplicarValidacionesHdr();
});

function InicializarModuloHdr() {
    // Cargar selects cruzados primero, luego renderizar las tablas
    CargarSelectsFiltrosHdr(function() {
        CargarEstadosHdr();
        CargarHojasRuta();
    });
}

function limpiarFormulariosHdr() {
    // Reseteo Estado Hoja de Ruta
    $("#txtIdEstadoHdr").val("0");
    $("#estado_hdr").val("");

    // Reseteo Hoja de Ruta
    $("#txtIdHojaRuta").val("0");
    $("#hoja_ruta_fecha").val("");
    $("#id_vehiculo").val("");
    $("#id_chofer").val("");
    $("#id_estado").val("");
}

// ==========================================================================================
// AUXILIAR: LLENADO DE SELECTS DESDE OTRAS APIS DEL SISTEMA
// ==========================================================================================
function CargarSelectsFiltrosHdr(callbackComplete) {
    let llamadasTerminadas = 0;
    function revisarTermino() {
        llamadasTerminadas++;
        if (llamadasTerminadas === 3 && callbackComplete) callbackComplete();
    }

    // A. Cargar Estados Hoja de Ruta
    $.get(URL_EST_HDR + "/ListarTodo", function (data) {
        globalEstadosHdr = data || [];
        $("#id_estado").empty().append('<option value="">Seleccione estado</option>');
        globalEstadosHdr.forEach(e => {
            let keys = Object.keys(e);
            let id = e.Id || e.id || e[keys[0]];
            let nombre = e.EstadoHojaRuta || e.estadoHojaRuta || e[keys[1]];
            $("#id_estado").append(`<option value="${id}">${nombre}</option>`);
        });
        revisarTermino();
    }).fail(revisarTermino);

    // B. Cargar Vehículos
    $.get(URL_BASE + "/Vehiculo/ListarTodo", function (data) {
        globalAuxVehiculos = data || [];
        $("#id_vehiculo").empty().append('<option value="">Seleccione vehículo</option>');
        globalAuxVehiculos.forEach(v => {
            let keys = Object.keys(v);
            let id = v.Id || v.id || v[keys[0]];
            let patente = v.Patente || v.patente || v[keys[1]];
            $("#id_vehiculo").append(`<option value="${id}">${patente}</option>`);
        });
        revisarTermino();
    }).fail(revisarTermino);

    // C. Cargar Choferes / Empleados
    $.get(URL_BASE + "/Empleado/ListarTodo", function (data) {
        globalAuxChoferes = data || [];
        $("#id_chofer").empty().append('<option value="">Seleccione chofer</option>');
        globalAuxChoferes.forEach(emp => {
            let keys = Object.keys(emp);
            let id = emp.Id || emp.id || emp[keys[0]];
            let nombre = emp.Nombre || emp.nombre || emp[keys[1]];
            $("#id_chofer").append(`<option value="${id}">${nombre}</option>`);
        });
        revisarTermino();
    }).fail(revisarTermino);
}

// ==========================================================================================
// 1. LÓGICA / CONTROLADOR: ESTADOS HOJA DE RUTA (Controlador: EST_HDR)
// ==========================================================================================
function CargarEstadosHdr() {
    $.get(URL_EST_HDR + "/ListarTodo", function (data) {
        globalEstadosHdr = data || [];
        $("#tbodyEstadoHdr").empty();
        if (globalEstadosHdr.length > 0) {
            globalEstadosHdr.forEach(e => {
                let keys = Object.keys(e);
                let id = e.Id || e.id || e[keys[0]];
                let nombre = e.EstadoHojaRuta || e.estadoHojaRuta || e[keys[1]];

                $("#tbodyEstadoHdr").append(`<tr>
                    <td>${id}</td>
                    <td class="fw-bold">${nombre}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarEdicionEstadoHdr(${id})">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="EliminarEstadoHdr(${id})">Eliminar</button>
                    </td>
                </tr>`);
            });
        }
    });
}

function GuardarEstadoHdr() {
    let id = $("#txtIdEstadoHdr").val() || "0";
    let textoEstado = $("#estado_hdr").val();

    if (!textoEstado || textoEstado.trim() === "") return;

    let data = { EstadoHojaRuta: textoEstado.trim() };
    let esModificacion = (id != "0" && id != "");
    
    // Si es modificación, usamos PUT (porque así lo exige tu controlador)
    // Si es nuevo, usamos POST
    let tipoMetodo = esModificacion ? "PUT" : "POST";
    let url = esModificacion ? URL_EST_HDR + "/Modificar/" + id : URL_EST_HDR + "/Insertar";

    $.ajax({
        type: tipoMetodo, // <--- Aquí está la clave: ahora el JS enviará PUT cuando sea edición
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function () {
            Swal.fire("Éxito", "Procesado correctamente", "success");
            limpiarFormulariosHdr();
            InicializarModuloHdr();
        },
        error: function(xhr) {
            console.error("Error en servidor:", xhr.status, xhr.responseText);
            Swal.fire("Error", "El servidor rechazó la solicitud.", "error");
        }
    });
}

function CargarEdicionEstadoHdr(id) {
    let encontrado = globalEstadosHdr.find(e => (e.Id || e.id || e[Object.keys(e)[0]]) == id);
    if (encontrado) {
        let keys = Object.keys(encontrado);
        $("#txtIdEstadoHdr").val(encontrado.Id || encontrado[keys[0]]);
        $("#estado_hdr").val(encontrado.EstadoHojaRuta || encontrado[keys[1]]);
    }
}

function EliminarEstadoHdr(id) {
   Swal.fire({ title: '¿Eliminar estado?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "DELETE",
                url: URL_EST_HDR + "/Borrar/" + id,
                success: function () {
                    Swal.fire('Eliminado', '', 'success');
                    InicializarModuloHdr();
                }
            });
        }
    });
}

// ==========================================================================================
// 2. LÓGICA / CONTROLADOR: HOJA DE RUTA (Controlador: HojaRuta)
// ==========================================================================================
function CargarHojasRuta() {
    $.get(URL_HDR + "/ListarTodo", function (data) {
        globalHojasRuta = data || [];
        $("#tbodyHojasRuta").empty();

        if (globalHojasRuta.length > 0) {
            globalHojasRuta.forEach(h => {
                let keys = Object.keys(h);
                let id = h.Id || h.id || h[keys[0]];
                let fechaOriginal = h.HojaRutaFecha || h.hojaRutaFecha || h[keys[1]] || "";
                let idVehForaneo = h.Id_Vehiculo || h.id_Vehiculo || h[keys[2]];
                let idChoForaneo = h.Id_Chofer || h.id_Chofer || h[keys[3]];
                let idEstForaneo = h.Id_Estado || h.id_Estado || h[keys[4]];

                let fechaFormateada = fechaOriginal.includes("T") ? fechaOriginal.split("T")[0] : fechaOriginal;

                let vAsoc = globalAuxVehiculos.find(v => (v.Id || v.id || v[Object.keys(v)[0]]) == idVehForaneo);
                let txtVehiculo = vAsoc ? (vAsoc.Patente || vAsoc.patente || "Vehículo") : "N/A";

                let cAsoc = globalAuxChoferes.find(c => (c.Id || c.id || c[Object.keys(c)[0]]) == idChoForaneo);
                let txtChofer = cAsoc ? (cAsoc.Nombre || cAsoc.nombre || "Chofer") : "N/A";

                let eAsoc = globalEstadosHdr.find(e => (e.Id || e.id || e[Object.keys(e)[0]]) == idEstForaneo);
                let txtEstado = eAsoc ? (eAsoc.EstadoHojaRuta || eAsoc.estadoHojaRuta || "Estado") : "N/A";

                $("#tbodyHojasRuta").append(`<tr>
                    <td>${id}</td>
                    <td>${fechaFormateada}</td>
                    <td class="fw-bold">${txtVehiculo}</td>
                    <td>${txtChofer}</td>
                    <td><span class="badge bg-light text-dark border">${txtEstado}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarEdicionHojaRuta(${id})">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="EliminarHojaRuta(${id})">Eliminar</button>
                    </td>
                </tr>`);
            });
        }
    });
}

function GuardarHojaRuta() {
    let id = $("#txtIdHojaRuta").val() || "0";
    
    let data = {
        HojaRutaFecha: $("#hoja_ruta_fecha").val(),
        Id_Vehiculo: parseInt($("#id_vehiculo").val()),
        Id_Chofer: parseInt($("#id_chofer").val()),
        Id_Estado: parseInt($("#id_estado").val())
    };

    let esModificacion = (id != "0" && id != "");
    let url = esModificacion ? URL_HDR + "/Modificar/" + id : URL_HDR + "/Insertar";

    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function () {
            Swal.fire("Éxito", "Hoja de ruta procesada con éxito", "success");
            limpiarFormulariosHdr();
            InicializarModuloHdr();
        },
        error: function(err) {
            console.error(err);
            Swal.fire("Error", "Error al procesar la solicitud en el servidor.", "error");
        }
    });
}

function CargarEdicionHojaRuta(id) {
    let encontrado = globalHojasRuta.find(h => (h.Id || h.id || h[Object.keys(h)[0]]) == id);
    if (encontrado) {
        let keys = Object.keys(encontrado);
        $("#txtIdHojaRuta").val(encontrado.Id || encontrado[keys[0]]);
        
        let fecha = encontrado.HojaRutaFecha || encontrado.hojaRutaFecha || encontrado[keys[1]] || "";
        if (fecha.includes("T")) fecha = fecha.split("T")[0];
        $("#hoja_ruta_fecha").val(fecha);

        $("#id_vehiculo").val(encontrado.Id_Vehiculo || encontrado.id_Vehiculo || "");
        $("#id_chofer").val(encontrado.Id_Chofer || encontrado.id_Chofer || "");
        $("#id_estado").val(encontrado.Id_Estado || encontrado.id_Estado || "");
    }
}

function EliminarHojaRuta(id) {
    Swal.fire({ title: '¿Eliminar hoja de ruta?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "DELETE",
                url: URL_HDR + "/Borrar/" + id,
                success: function () {
                    Swal.fire('Eliminado', '', 'success');
                    InicializarModuloHdr();
                }
            });
        }
    });
}

// ==========================================================================================
// VALIDACIONES Y FORMATEO EN TIEMPO REAL
// ==========================================================================================
function AplicarValidacionesHdr() {
    $('#estado_hdr').on('input', function () {
        let valor = $(this).val();
        let soloLetras = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, ' ');

        let palabras = soloLetras.split(' ');
        for (let i = 0; i < palabras.length; i++) {
            if (palabras[i].length > 0) {
                palabras[i] = palabras[i].charAt(0).toUpperCase() + palabras[i].slice(1).toLowerCase();
            }
        }
        let resultado = palabras.join(' ');
        if (resultado === ' ') resultado = '';
        $(this).val(resultado);
    });
}