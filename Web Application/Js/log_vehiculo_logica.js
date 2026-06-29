// ==========================================================================================
// CONFIGURACIÓN DE ENDPOINTS DE LA API (SITMAS LOGÍSTICA)
// Sincronizados con los Stored Procedures mapeados en base a la estructura del backend C#
// ==========================================================================================
const URL_TIPO = "https://localhost:44325/api/Tp_Vehiculo";
const URL_MARCA = "https://localhost:44325/api/MarcaVeh";
const URL_MODELO = "https://localhost:44325/api/ModeloVeh";
const URL_VEHICULO = "https://localhost:44325/api/Vehiculo";

// Variables globales para almacenamiento de colecciones en memoria. 
// Permiten realizar cruces relacionales eficientes sin peticiones anidadas en bucle.
let globalTipos = [];
let globalMarcas = [];
let globalModelos = [];

// ==========================================================================================
// INICIALIZADOR PROTEGIDO CONTRA ERRORES (Aísla fallas relacionales cruzadas)
// ==========================================================================================
function InicializarModuloVehiculos() {
    // Secuencia asíncrona controlada: Cada función intenta ejecutar el callback de forma aislada
    try {
        CargarTiposVehiculo(() => {
            try {
                CargarMarcasVehiculo(() => {
                    try {
                        CargarModelosVehiculo(() => {
                            try {
                                CargarVehiculos();
                            } catch (e) { console.error("Error en render de Vehículos maestro:", e); }
                        });
                    } catch (e) { console.error("Error en render de Modelos:", e); }
                });
            } catch (e) { console.error("Error en render de Marcas:", e); }
        });
    } catch (e) { console.error("Error en render de Tipos:", e); }
}

// ==========================================================================================
// 1. LÓGICA / CONTROLADOR: TIPO DE VEHÍCULO (Controlador: Tp_Vehiculo) - FUNCIONANDO OK
// ==========================================================================================
function CargarTiposVehiculo(callback) {
    $.get(URL_TIPO + "/ListarTodo", function (data) {
        globalTipos = data;
        $("#tbodyTiposVehiculo").empty();
        $("#id_tipo").empty().append('<option value="">Seleccione tipo</option>');

        if (data && data.length > 0) {
            data.forEach(t => {
                let keys = Object.keys(t);
                let idDetectado = t.id_Tp_Vehiculo || t.idTpVehiculo || t.Id || t[keys[0]];
                let nombreDetectado = t.tp_Vehiculo || t.tpVehiculo || t.TipoVehiculo || t[keys[1]];

                $("#tbodyTiposVehiculo").append(`<tr>
                    <td>${idDetectado}</td>
                    <td class="fw-bold">${nombreDetectado}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarEdicionTipo(${idDetectado})">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="EliminarTipoVehiculo(${idDetectado})">Eliminar</button>
                    </td>
                </tr>`);

                $("#id_tipo").append(`<option value="${idDetectado}">${nombreDetectado}</option>`);
            });
        }
        if (callback) callback();
    }).fail(function() { if(callback) callback(); });
}

function GuardarTipoVehiculo() {
    let id = $("#txtIdTipoVehiculo").val() || "0";
    let data = { TipoVehiculo: $("#tipo_vehiculo").val().trim() };
    let url = (id != "0" && id != "") ? URL_TIPO + "/Modificar/" + id : URL_TIPO + "/Insertar";

    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function () {
            Swal.fire("Éxito", "Tipo de vehículo procesado correctamente", "success");
            limpiarFormularios();
            InicializarModuloVehiculos();
        }
    });
}

function CargarEdicionTipo(id) {
    let tipoSeleccionado = globalTipos.find(t => {
        let keys = Object.keys(t);
        let idActual = t.id_Tp_Vehiculo || t.idTpVehiculo || t.Id || t[keys[0]];
        return idActual == id;
    });

    if (tipoSeleccionado) {
        let keys = Object.keys(tipoSeleccionado);
        let idReal = tipoSeleccionado.id_Tp_Vehiculo || tipoSeleccionado.idTpVehiculo || tipoSeleccionado.Id || tipoSeleccionado[keys[0]];
        let nombreReal = tipoSeleccionado.tp_Vehiculo || tipoSeleccionado.tpVehiculo || tipoSeleccionado.TipoVehiculo || tipoSeleccionado[keys[1]];

        $("#txtIdTipoVehiculo").val(idReal);
        $("#tipo_vehiculo").val(nombreReal);

        document.getElementById('collapseTipoVehiculo').classList.add('show');
        document.getElementById('collapseTipoVehiculo').scrollIntoView({ behavior: 'smooth' });
    }
}

function EliminarTipoVehiculo(id) {
    if (confirm("¿Está seguro de eliminar este tipo de vehículo?")) {
        $.post(URL_TIPO + "/Borrar/" + id, function () {
            InicializarModuloVehiculos();
        });
    }
}

// ==========================================================================================
// 2. LÓGICA / CONTROLADOR: MARCAS (Controlador: MarcaVeh) - CORREGIDO Y LISTANDO
// ==========================================================================================
// ==========================================================================================
// 2. LÓGICA / CONTROLADOR: MARCAS (Controlador: MarcaVeh) - ¡SCONIZADO CON TU HTML REAL!
// ==========================================================================================
// ==========================================================================================
// 2. LÓGICA / CONTROLADOR: MARCAS (Controlador: MarcaVeh) - COMPLETO Y CORREGIDO
// ==========================================================================================
// ==========================================================================================
// 2. LÓGICA / CONTROLADOR: MARCAS (Controlador: MarcaVeh) - COMPLETO Y CORREGIDO FINAL
// ==========================================================================================
// ==========================================================================================
// 2. LÓGICA / CONTROLADOR: MARCAS (Controlador: MarcaVeh) - INTEGRACIÓN EXACTA CON C#
// ==========================================================================================
function CargarMarcasVehiculo(callback) {
    $.get(URL_MARCA + "/ListarTodo", function (data) {
        globalMarcas = data; 
        
        $("#tbodyMarcas").empty();
        $("#id_marca").empty().append('<option value="">Seleccione marca</option>');

        if (data && data.length > 0) {
            data.forEach(m => {
                let keys = Object.keys(m);
                let idDetectado = m.Id || m.id_Marca || m.idMarca || m[keys[0]];
                let nombreDetectado = m.MarcaVehiculo || m.marcaVehiculo || m.marca || m[keys[1]];

                $("#tbodyMarcas").append(`<tr>
                    <td>${idDetectado}</td>
                    <td class="fw-bold">${nombreDetectado}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarEdicionMarca(${idDetectado})">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="EliminarMarcaVehiculo(${idDetectado})">Eliminar</button>
                    </td>
                </tr>`);

                $("#id_marca").append(`<option value="${idDetectado}">${nombreDetectado}</option>`);
            });
        }
        if (callback) callback();
    }).fail(function() { if(callback) callback(); });
}

function GuardarMarca() {
    let id = $("#txtIdMarca").val() || "0";
    let textoMarca = $("#marca_vehiculo").val();

    if (!textoMarca || textoMarca.trim() === "") {
        Swal.fire("Advertencia", "Por favor ingrese el nombre de la marca", "warning");
        return;
    }

    // Mapeo exacto con la clase MarcaVehi de C#
    let data = { 
        MarcaVehiculo: textoMarca.trim() 
    };

    let esModificacion = (id != "0" && id != "");
    
    // Si es modificación: /api/MarcaVeh/Modificar/5 usando PUT
    // Si es inserción: /api/MarcaVeh/Insertar usando POST
    let url = esModificacion ? URL_MARCA + "/Modificar/" + id : URL_MARCA + "/Insertar";
    let metodoHttp = esModificacion ? "PUT" : "POST";

    $.ajax({
        type: metodoHttp, 
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function () {
            Swal.fire("Éxito", "Marca de vehículo procesada correctamente", "success");
            limpiarFormularios();
            InicializarModuloVehiculos(); // Recarga la tabla y combos automáticamente
        },
        error: function (err) {
            console.error("Error en servidor:", err);
            Swal.fire("Error", "No se pudo procesar la operación en el servidor.", "error");
        }
    });
}

function CargarEdicionMarca(id) {
    let marcaSeleccionada = globalMarcas.find(m => {
        let keys = Object.keys(m);
        let idActual = m.Id || m.id_Marca || m.idMarca || m[keys[0]];
        return idActual == id;
    });

    if (marcaSeleccionada) {
        let keys = Object.keys(marcaSeleccionada);
        let idReal = marcaSeleccionada.Id || marcaSeleccionada.id_Marca || marcaSeleccionada.idMarca || marcaSeleccionada[keys[0]];
        let nombreReal = marcaSeleccionada.MarcaVehiculo || marcaSeleccionada.marcaVehiculo || marcaSeleccionada.marca || marcaSeleccionada[keys[1]];

        $("#txtIdMarca").val(idReal);
        $("#marca_vehiculo").val(nombreReal);

        document.getElementById('collapseMarca').classList.add('show');
        document.getElementById('collapseMarca').scrollIntoView({ behavior: 'smooth' });
    }
}

function EliminarMarcaVehiculo(id) {
    if (confirm("¿Está seguro de eliminar esta marca de vehículo?")) {
        // Petición DELETE pura hacia /api/MarcaVeh/Borrar/{id} tal cual lo espera tu backend
        $.ajax({
            type: "DELETE",
            url: URL_MARCA + "/Borrar/" + id,
            success: function () {
                Swal.fire("Eliminado", "La marca fue removida correctamente", "success");
                InicializarModuloVehiculos();
            },
            error: function (err) {
                console.error("Error al borrar:", err);
                Swal.fire("Error", "No se pudo eliminar el registro. Puede estar asociada a un modelo existente.", "error");
            }
        });
    }
}
// ==========================================================================================
// 3. LÓGICA / CONTROLADOR: MODELOS (Controlador: ModeloVeh) - PATRÓN RESTful VERIFICADO
// ==========================================================================================
// ==========================================================================================
// 3. LÓGICA / CONTROLADOR: MODELOS (Controlador: ModeloVeh) - CONFIGURACIÓN CORREGIDA
// ==========================================================================================
function CargarModelosVehiculo(callback) {
    $.get(URL_MODELO + "/ListarTodo", function (data) {
        globalModelos = data;
        $("#tbodyModelos").empty();
        $("#id_modelo").empty().append('<option value="">Seleccione modelo</option>');

        if (data && data.length > 0) {
            data.forEach(m => {
                let keys = Object.keys(m);
                // Mapeos dinámicos basados en la estructura real que retorna la base de datos
                let idDetectado = m.Id || m.IdModeloVeh || m.idModeloVeh || m[keys[0]];
                let nombreDetectado = m.ModeloVehiculo || m.ModeloVeh || m.modeloVeh || m[keys[1]];
                let idMarcaForanea = m.Id_Marca || m.Id_MarcaVeh || m.id_MarcaVeh || m[keys[2]];

                let marcaAsociada = globalMarcas.find(g => {
                    let gKeys = Object.keys(g);
                    let gId = g.Id || g.id_Marca || g.idMarca || g[gKeys[0]];
                    return gId == idMarcaForanea;
                });
                
                let nombreMarca = marcaAsociada ? (marcaAsociada.MarcaVehiculo || marcaAsociada.marcaVehiculo || "Desconocida") : "N/A";

                $("#tbodyModelos").append(`<tr>
                    <td>${idDetectado}</td>
                    <td class="fw-bold">${nombreDetectado}</td>
                    <td><span class="badge bg-light text-dark border">${nombreMarca}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarEdicionModelo(${idDetectado})">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="EliminarModeloVehiculo(${idDetectado})">Eliminar</button>
                    </td>
                </tr>`);

                $("#id_modelo").append(`<option value="${idDetectado}">${nombreDetectado}</option>`);
            });
        }
        if (callback) callback();
    }).fail(function() { if(callback) callback(); });
}

function GuardarModelo() {
    let id = $("#txtIdModelo").val() || "0";
    let textoModelo = $("#modelo_vehiculo").val();
    let marcaSeleccionada = $("#id_marca").val();

    if (!textoModelo || textoModelo.trim() === "") {
        Swal.fire("Advertencia", "Por favor ingrese el nombre del modelo", "warning");
        return;
    }
    if (!marcaSeleccionada || marcaSeleccionada === "") {
        Swal.fire("Advertencia", "Por favor seleccione una marca para el modelo", "warning");
        return;
    }

    // MAPEO EXACTO: Debe coincidir con las propiedades 'ModeloVehiculo' e 'Id_Marca' del C#
    let data = {
        ModeloVehiculo: textoModelo.trim(),
        Id_Marca: parseInt(marcaSeleccionada)
    };
    
    let esModificacion = (id != "0" && id != "");
    let url = esModificacion ? URL_MODELO + "/Modificar/" + id : URL_MODELO + "/Insertar";
    let metodoHttp = esModificacion ? "PUT" : "POST";

    $.ajax({
        type: metodoHttp,
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function () {
            Swal.fire("Éxito", "Modelo procesado correctamente", "success");
            limpiarFormularios();
            InicializarModuloVehiculos();
        },
        error: function (err) {
            console.error("Error al guardar el modelo:", err);
            Swal.fire("Error", "No se pudo procesar el modelo. Verifique los campos.", "error");
        }
    });
}

function CargarEdicionModelo(id) {
    let modeloSeleccionado = globalModelos.find(m => {
        let keys = Object.keys(m);
        let idActual = m.Id || m.IdModeloVeh || m.idModeloVeh || m[keys[0]];
        return idActual == id;
    });

    if (modeloSeleccionado) {
        let keys = Object.keys(modeloSeleccionado);
        let idReal = modeloSeleccionado.Id || modeloSeleccionado.IdModeloVeh || modeloSeleccionado[keys[0]];
        let nombreReal = modeloSeleccionado.ModeloVehiculo || modeloSeleccionado.ModeloVeh || modeloSeleccionado[keys[1]];
        let idMarcaReal = modeloSeleccionado.Id_Marca || modeloSeleccionado.Id_MarcaVeh || modeloSeleccionado[keys[2]];

        $("#txtIdModelo").val(idReal);
        $("#modelo_vehiculo").val(nombreReal);
        $("#id_marca").val(idMarcaReal);
        
        document.getElementById('collapseModelo').classList.add('show');
        document.getElementById('collapseModelo').scrollIntoView({ behavior: 'smooth' });
    }
}

function EliminarModeloVehiculo(id) {
    if (confirm("¿Está seguro de eliminar este modelo?")) {
        $.ajax({
            type: "DELETE",
            url: URL_MODELO + "/Borrar/" + id,
            success: function () {
                Swal.fire("Eliminado", "El modelo fue removido correctamente", "success");
                InicializarModuloVehiculos();
            },
            error: function (err) {
                console.error("Error al borrar modelo:", err);
                Swal.fire("Error", "No se pudo eliminar el modelo.", "error");
            }
        });
    }
}
// ==========================================================================================
// 4. LÓGICA / CONTROLADOR: VEHÍCULOS (Controlador: Vehiculo) - CONFIGURADO POST
// ==========================================================================================
// ==========================================================================================
// 4. LÓGICA / CONTROLADOR: VEHÍCULOS (Controlador: Vehiculo) - SINCRONIZACIÓN C# ESPECÍFICA
// ==========================================================================================
// Variable global para almacenar el listado completo y poder buscar al editar
let globalVehiculos = [];

function CargarVehiculos(callback) {
    $.get(URL_VEHICULO + "/ListarTodo", function (data) {
        globalVehiculos = data;
        $("#tbodyVehiculos").empty();

        if (data && data.length > 0) {
            data.forEach(v => {
                let keys = Object.keys(v);
                let idDetectado = v.Id || v.IdVehiculo || v.idVehiculo || v[keys[0]];
                let patenteDetectada = v.Patente || v.patente || v[keys[1]];
                let idModeloForaneo = v.Id_Modelo || v.Id_ModeloVeh || v.id_ModeloVeh || v[keys[2]];
                let idTipoForaneo = v.Id_Tipo || v.Id_Tp_Vehiculo || v.id_Tp_Vehiculo || v[keys[3]];

                // Buscar en la colección global de modelos
                let modeloAsociado = globalModelos.find(m => {
                    let mKeys = Object.keys(m);
                    let mId = m.Id || m.IdModeloVeh || m.idModeloVeh || m[mKeys[0]];
                    return mId == idModeloForaneo;
                });
                let nombreModelo = modeloAsociado ? (modeloAsociado.ModeloVehiculo || modeloAsociado.ModeloVeh || "Desconocido") : "N/A";

                // Buscar en la colección global de tipos
                let tipoAsociado = globalTipos.find(t => {
                    let tKeys = Object.keys(t);
                    let tId = t.Id || t.id_Tp_Vehiculo || t.idTpVehiculo || t[tKeys[0]];
                    return tId == idTipoForaneo;
                });
                let nombreTipo = tipoAsociado ? (tipoAsociado.TipoVehiculo || tipoAsociado.tp_Vehiculo || "Desconocido") : "N/A";

                $("#tbodyVehiculos").append(`<tr>
                    <td>${idDetectado}</td>
                    <td class="fw-bold">${patenteDetectada}</td>
                    <td>${nombreModelo}</td>
                    <td><span class="badge bg-light text-dark border">${nombreTipo}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarEdicionVehiculo(${idDetectado})">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="EliminarVehiculo(${idDetectado})">Eliminar</button>
                    </td>
                </tr>`);
            });
        }
        if (callback) callback();
    }).fail(function() { if(callback) callback(); });
}

function GuardarVehiculo() {
    let id = $("#txtIdVehiculo").val() || "0";
    // Capturamos el valor tal cual lo ve el usuario en el input (ej: "AB 123 CD")
    let patenteTexto = $("#patente").val(); 
    let modeloSeleccionado = $("#id_modelo").val();
    let tipoSeleccionado = $("#id_tipo").val();

    if (!patenteTexto || patenteTexto.trim() === "") {
        Swal.fire("Advertencia", "Por favor ingrese la patente del vehículo", "warning");
        return;
    }
    
    // ... (tus otras validaciones siguen igual)

    // AQUI EL CAMBIO: Enviamos el valor directamente sin aplicar .replace ni manipulaciones extra
    // Solo aseguramos que sea un string y quitamos espacios laterales por seguridad
    let data = {
        Patente: patenteTexto.trim(), 
        Id_Modelo: parseInt(modeloSeleccionado),
        Id_Tipo: parseInt(tipoSeleccionado)
    };
    
    // Debug: Esto te mostrará en la consola del navegador (F12) qué está enviando realmente
    console.log("Datos enviados al servidor:", JSON.stringify(data));

    let esModificacion = (id != "0" && id != "");
    let url = esModificacion ? URL_VEHICULO + "/Modificar/" + id : URL_VEHICULO + "/Insertar";
    
    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function () {
            Swal.fire("Éxito", "Vehículo procesado correctamente", "success");
            limpiarFormularios();
            InicializarModuloVehiculos();
        },
        error: function (err) {
            console.error("Error al guardar vehículo:", err);
            Swal.fire("Error", "No se pudo procesar el vehículo.", "error");
        }
    });
}

function CargarEdicionVehiculo(id) {
    let vehiculoSeleccionado = globalVehiculos.find(v => {
        let keys = Object.keys(v);
        let idActual = v.Id || v.IdVehiculo || v.idVehiculo || v[keys[0]];
        return idActual == id;
    });

    if (vehiculoSeleccionado) {
        let keys = Object.keys(vehiculoSeleccionado);
        let idReal = vehiculoSeleccionado.Id || vehiculoSeleccionado.IdVehiculo || vehiculoSeleccionado[keys[0]];
        let patenteReal = vehiculoSeleccionado.Patente || vehiculoSeleccionado.patente || vehiculoSeleccionado[keys[1]];
        let idModeloReal = vehiculoSeleccionado.Id_Modelo || vehiculoSeleccionado.Id_ModeloVeh || vehiculoSeleccionado[keys[2]];
        let idTipoReal = vehiculoSeleccionado.Id_Tipo || vehiculoSeleccionado.Id_Tp_Vehiculo || vehiculoSeleccionado[keys[3]];

        $("#txtIdVehiculo").val(idReal);
        $("#patente").val(patenteReal);
        $("#id_modelo").val(idModeloReal);
        $("#id_tipo").val(idTipoReal);
        
        document.getElementById('collapseVehiculo').classList.add('show');
        document.getElementById('collapseVehiculo').scrollIntoView({ behavior: 'smooth' });
    }
}

function EliminarVehiculo(id) {
    if (confirm("¿Está seguro de eliminar este vehículo?")) {
        // EXCEPCIÓN DETECTADA: Este método usa un POST hacia /Borrar/{id} en lugar de DELETE
        $.ajax({
            type: "POST",
            url: URL_VEHICULO + "/Borrar/" + id,
            success: function () {
                Swal.fire("Eliminado", "El vehículo fue removido correctamente", "success");
                InicializarModuloVehiculos();
            },
            error: function (err) {
                console.error("Error al borrar vehículo:", err);
                Swal.fire("Error", "No se pudo eliminar el registro en el servidor.", "error");
            }
        });
    }
}

// ==========================================================================================
// 5. AUXILIAR: LIMPIEZA DE FORMULARIOS (Sincronizado con IDs del DOM)
// ==========================================================================================
function limpiarFormularios() {
    // Tipo Vehículo
    $("#txtIdTipoVehiculo").val("0");
    $("#tipo_vehiculo").val("");

    // Marca
    $("#txtIdMarcaVehiculo").val("0");
    $("#txtIdMarca").val("0");
    $("#marca_vehiculo").val("");

    // Modelo
    $("#txtIdModelo").val("0");
    $("#modelo_vehiculo").val("");
    $("#id_marca").val("");

    // Vehículo
    $("#txtIdVehiculo").val("0");
    $("#patente").val("");
    $("#id_modelo").val("");
    $("#id_tipo").val("");
}

// ==========================================================================================
// DISPARADOR DE INICIO AUTOMÁTICO (Document Ready)
// ==========================================================================================
$(document).ready(function () {
    InicializarModuloVehiculos();
});


// ==========================================================================================
// VALIDACIONES Y FORMATEO EN TIEMPO REAL - SINCRO CON TU HTML
// ==========================================================================================
$(document).ready(function () {

    // --- 1. SECCIÓN MARCAS (#marca_vehiculo) ---
    // Solo acepta letras y espacios. Capitaliza automáticamente la primera letra de cada palabra.
    $('#marca_vehiculo').on('input', function () {
        let valor = $(this).val();

        // 1a. Filtrar para permitir sólo letras (incluyendo acentos, eñes) y espacios solitarios
        // Remueve números y caracteres especiales en tiempo real
        let soloLetras = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        
        // Evitar múltiples espacios seguidos
        soloLetras = soloLetras.replace(/\s+/g, ' ');

        // 1b. Capitalizar la primera letra de cada palabra (Title Case)
        let palabras = soloLetras.split(' ');
        for (let i = 0; i < palabras.length; i++) {
            if (palabras[i].length > 0) {
                palabras[i] = palabras[i].charAt(0).toUpperCase() + palabras[i].slice(1).toLowerCase();
            }
        }
        let resultado = palabras.join(' ');

        // Si el usuario borra todo y empieza con un espacio, lo removemos
        if (resultado === ' ') resultado = '';

        $(this).val(resultado);
    });


    // --- 2. SECCIÓN MODELOS (#modelo_vehiculo) ---
    // Permite letras, números y espacios (ej: "Tector 150E", "Hilux SRX"). Capitaliza la primera letra de cada palabra.
    $('#modelo_vehiculo').on('input', function () {
        let valor = $(this).val();

        // Permitir letras, números y espacios, quitar caracteres especiales extraños
        let filtrado = valor.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]/g, '');
        filtrado = filtrado.replace(/\s+/g, ' ');

        // Capitalizar la primera letra de cada palabra
        let palabras = filtrado.split(' ');
        for (let i = 0; i < palabras.length; i++) {
            if (palabras[i].length > 0) {
                palabras[i] = palabras[i].charAt(0).toUpperCase() + palabras[i].slice(1).toLowerCase();
            }
        }
        let resultado = palabras.join(' ');
        if (resultado === ' ') resultado = '';

        $(this).val(resultado);
    });


    // --- 3. SECCIÓN VEHÍCULOS: PATENTE (#patente) ---
    // Formato estricto Mercosur: AA 123 BB (2 letras, espacio, 3 números, espacio, 2 letras) en Mayúsculas.
    // También soporta el formato tradicional viejo (AAA 123) adaptándose dinámicamente si es necesario, 
    // pero configurado aquí para forzar el patrón solicitado: AB 123 CD
    $('#patente').on('input', function () {
        // Remover todo lo que no sea letra o número y pasar a mayúsculas
        let limpia = $(this).val().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        let formateada = "";

        // Construcción de la máscara en tiempo real (AB 123 CD)
        if (limpia.length > 0) {
            // Primeras 2 posiciones: Deben ser letras obligatoriamente
            let part1 = limpia.substring(0, 2).replace(/[^A-Z]/g, '');
            formateada += part1;

            if (limpia.length > 2) {
                // Siguientes 3 posiciones: Deben ser números obligatoriamente
                let part2 = limpia.substring(2, 5).replace(/[^0-9]/g, '');
                if (part1.length === 2 && part2.length > 0) {
                    formateada += " " + part2;
                } else {
                    formateada += part2; // Si no completó las 2 letras no añade el espacio aún
                }

                if (limpia.length > 5) {
                    // Últimas 2 posiciones: Deben ser letras obligatoriamente
                    let part3 = limpia.substring(5, 7).replace(/[^A-Z]/g, '');
                    if (part2.length === 3 && part3.length > 0) {
                        formateada += " " + part3;
                    } else {
                        formateada += part3;
                    }
                }
            }
        }

        // Limitar el largo total físico de la cadena a 9 caracteres ("AB 123 CD")
        if (formateada.length > 9) {
            formateada = formateada.substring(0, 9);
        }

        $(this).val(formateada);
    });

    // Añadir una validación preventiva extra al salir del campo de la patente (blur) 
    // por si el usuario dejó la patente incompleta (ej: "AB 12")
    $('#patente').on('blur', function () {
        let regexMercosur = /^[A-Z]{2}\s[0-9]{3}\s[A-Z]{2}$/;
        let valor = $(this).val();
        
        if (valor !== "" && !regexMercosur.test(valor)) {
            Swal.fire({
                icon: 'warning',
                title: 'Formato de patente inválido',
                text: 'La patente debe respetar el formato de 2 letras, 3 números y 2 letras (Ej: AB 123 CD)',
                confirmButtonColor: '#3085d6'
            });
            $(this).addClass('is-invalid');
        } else {
            $(this).removeClass('is-invalid');
        }
    });

});