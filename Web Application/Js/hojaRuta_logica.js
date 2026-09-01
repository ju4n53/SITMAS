/* ==========================================================================
   SITMAS - Módulo: Hoja de Ruta (Cabecera) - Lógica de Interfaz
   Tecnologías: JavaScript (ES6+), jQuery, AJAX, Bootstrap 5
   ========================================================================== */

const URL_API_HDR = "https://localhost:44325/api/hojaruta";
const URL_API_VEHICULOS = "https://localhost:44325/api/Vehiculo/ListarTodo"; // Ajustar según tu controller de Vehículos
const URL_API_CHOFERES = "https://localhost:44325/api/Empleado/ListarChoferes"; // Ajustar según tu controller de Empleados/Choferes

$(document).ready(function () {
    // 1. Inicialización en paralelo de combos y tabla principal
    InicializarModuloHDR();

    // 2. Controladores de eventos para el formulario (Alta / Modificación)
    $("#formHojaRuta").on("submit", function (e) {
        e.preventDefault();
        GuardarHojaRuta();
    });

    $("#btnLimpiarForm").on("click", function () {
        ResetearFormulario();
    });

    // 3. Validaciones dinámicas de entrada
    ConfigurarValidacionesFormulario();

    // 4. Buscador reactivo en vivo sobre la tabla
    $("#inputBusquedaHDR").on("keyup", function () {
        const busqueda = $(this).val().toLowerCase();
        $("#tbodyHojaRuta tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(busqueda) > -1);
        });
    });
});

/* ==========================================================================
   1. CARGA INICIAL Y COMBOS (PARALELISMO)
   ========================================================================== */

function InicializarModuloHDR() {
    // Usamos Promise.all para cargar los selectores simultáneamente
    Promise.all([
        CargarComboVehiculos(),
        CargarComboChoferes()
    ]).then(() => {
        // Una vez que los combos están cargados, obtenemos las Hojas de Ruta
        GetAllHojasRuta();
    }).catch(err => {
        console.error("Error al inicializar los datos auxiliares:", err);
        mostrarAlerta("❌ Error al cargar los listados auxiliares de vehículos o choferes.", "danger");
    });
}

function CargarComboVehiculos() {
    return $.ajax({
        type: "GET",
        url: URL_API_VEHICULOS,
        dataType: "json",
        success: function (data) {
            const $select = $("#id_vehiculo");
            $select.empty().append('<option value="">Seleccione Vehículo (Patente)</option>');
            data.forEach(v => {
                // Adaptar propiedades al DTO real de Vehículo (ej: v.Id, v.Patente)
                $select.append(`<option value="${v.Id}">${v.Patente}</option>`);
            });
        }
    });
}

function CargarComboChoferes() {
    return $.ajax({
        type: "GET",
        url: URL_API_CHOFERES,
        dataType: "json",
        success: function (data) {
            const $select = $("#id_chofer");
            $select.empty().append('<option value="">Seleccione Chofer</option>');
            data.forEach(c => {
                // Adaptar propiedades al DTO real de Empleado/Chofer
                $select.append(`<option value="${c.Id}">${c.Apellido}, ${c.Nombre}</option>`);
            });
        }
    });
}

/* ==========================================================================
   2. OPERACIONES CRUD (LISTAR, BUSCAR, INSERTAR, MODIFICAR, ELIMINAR)
   ========================================================================== */

function GetAllHojasRuta() {
    $.ajax({
        type: "GET",
        url: URL_API_HDR,
        dataType: "json",
        success: function (lista) {
            const $tbody = $("#tbodyHojaRuta");
            $tbody.empty();

            if (!lista || lista.length === 0) {
                $tbody.append('<tr><td colspan="5" class="text-center text-muted">No hay Hojas de Ruta registradas.</td></tr>');
                return;
            }

            lista.forEach(item => {
                const tr = `
                    <tr>
                        <td><strong>#${item.Id}</strong></td>
                        <td>${item.FechaFormateada || 'N/A'}</td>
                        <td><span class="badge bg-secondary">${item.Vehiculo || 'Sin Asignar'}</span></td>
                        <td>${item.ChoferNombreCompleto || 'Sin Asignar'}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarParaEditar(${item.Id})" title="Editar Cabecera">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger me-1" onclick="EliminarHojaRuta(${item.Id})" title="Eliminar Hoja de Ruta">
                                🗑️ Borrar
                            </button>
                            <button class="btn btn-sm btn-success" onclick="GestionarParadas(${item.Id})" title="Ver/Agregar Paradas">
                                📍 Paradas
                            </button>
                        </td>
                    </tr>`;
                $tbody.append(tr);
            });
        },
        error: function (err) {
            console.error("SITMAS - Error en GetAllHojasRuta:", err);
            mostrarAlerta("❌ Error al consultar la lista de Hojas de Ruta.", "danger");
        }
    });
}

function GuardarHojaRuta() {
    const id = $("#hdnIdHojaRuta").val();
    const esModificacion = id && parseInt(id) > 0;

    const dto = {
        Id: esModificacion ? parseInt(id) : 0,
        HojaRutaFecha: $("#fecha_hdr").val(),
        Id_Vehiculo: parseInt($("#id_vehiculo").val()) || 0,
        Id_Chofer: parseInt($("#id_chofer").val()) || 0
    };

    if (!dto.HojaRutaFecha) {
        alert("⚠️ Debe seleccionar la fecha de la Hoja de Ruta.");
        return;
    }
    if (dto.Id_Vehiculo <= 0) {
        alert("⚠️ Debe seleccionar un vehículo.");
        return;
    }
    if (dto.Id_Chofer <= 0) {
        alert("⚠️ Debe seleccionar un chofer.");
        return;
    }

    const tipoMetodo = esModificacion ? "PUT" : "POST";
    const urlEndpoint = esModificacion ? `${URL_API_HDR}/${id}` : URL_API_HDR;

    $.ajax({
        type: tipoMetodo,
        url: urlEndpoint,
        data: JSON.stringify(dto),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (respuesta) {
            const mensajeAccion = esModificacion 
                ? "✅ Hoja de Ruta actualizada con éxito." 
                : `✅ Hoja de Ruta creada con éxito.`;

            mostrarAlerta(mensajeAccion, "success");
            
            // 🔄 Pasos clave para refresco instantáneo sin F5:
            ResetearFormulario();   // 1. Limpia inputs y restablece el botón a "Crear"
            GetAllHojasRuta();      // 2. Consulta de nuevo a la API y redibuja la tabla
        },
        error: function (err) {
            console.error("SITMAS - Error al guardar Hoja de Ruta:", err);
            mostrarAlerta("❌ No se pudo guardar la Hoja de Ruta. Verifique los datos.", "danger");
        }
    });
}

function CargarParaEditar(id) {
    $.ajax({
        type: "GET",
        url: `${URL_API_HDR}/${id}`,
        dataType: "json",
        success: function (data) {
            if (!data) {
                alert("Hoja de Ruta no encontrada.");
                return;
            }

            // Asignamos el ID al campo oculto para saber que estamos en modo edición
            $("#hdnIdHojaRuta").val(data.Id);

            // Formatear fecha ISO a YYYY-MM-DD para el input type="date"
            if (data.HojaRutaFecha) {
                const fechaISO = new Date(data.HojaRutaFecha).toISOString().split("T")[0];
                $("#fecha_hdr").val(fechaISO);
            }

            $("#id_vehiculo").val(data.Id_Vehiculo);
            $("#id_chofer").val(data.Id_Chofer);

            // Cambiar UI para indicar modo edición
            $("#btnGuardarHDR").text("💾 Actualizar Cabecera").removeClass("btn-primary").addClass("btn-warning");
            $("#tituloFormHDR").text(`Modificar Hoja de Ruta #${data.Id}`);

            // Desplazar suavemente hacia el formulario si está abajo
            $("html, body").animate({ scrollTop: $("#formHojaRuta").offset().top - 70 }, 300);
        },
        error: function (err) {
            console.error("SITMAS - Error al obtener Hoja de Ruta por ID:", err);
            alert("Error al cargar la Hoja de Ruta seleccionada.");
        }
    });
}

function EliminarHojaRuta(id) {
    if (!confirm(`⚠️ ¿Está seguro de eliminar la Hoja de Ruta #${id}?\n\nAtención: Se eliminarán también todas las paradas (detalles) asociadas.`)) {
        return;
    }

    $.ajax({
        type: "DELETE",
        url: `${URL_API_HDR}/${id}`,
        dataType: "json",
        success: function () {
            mostrarAlerta(`✅ Hoja de Ruta #${id} eliminada correctamente.`, "info");
            GetAllHojasRuta();
            
            // Si estábamos editando esta misma hoja, limpiamos el formulario
            if ($("#hdnIdHojaRuta").val() == id) {
                ResetearFormulario();
            }
        },
        error: function (err) {
            console.error("SITMAS - Error al borrar Hoja de Ruta:", err);
            mostrarAlerta("❌ No se pudo eliminar la Hoja de Ruta seleccionada.", "danger");
        }
    });
}

/* ==========================================================================
   3. FUNCIONES AUXILIARES Y UX
   ========================================================================== */

function ResetearFormulario() {
    $("#formHojaRuta")[0].reset();
    $("#hdnIdHojaRuta").val("0"); // Volvemos a modo Alta
    $("#btnGuardarHDR").text("➕ Crear Hoja de Ruta").removeClass("btn-warning").addClass("btn-primary");
    $("#tituloFormHDR").text("Nueva Hoja de Ruta");
}

function ConfigurarValidacionesFormulario() {
    // Evitar selección de fechas futuras si la regla del negocio lo requiere
    const hoy = new Date().toISOString().split("T")[0];
    $("#fecha_hdr");
}

function GestionarParadas(idHojaRuta) {
    // Función que conecta con el segundo paso: abre el modal o sección de Detalles/Paradas
    console.log(`Navegando a la gestión de paradas para Hoja de Ruta #${idHojaRuta}`);
    
    // Ejemplo: Si usás un Modal Bootstrap para los detalles:
    if (typeof AbrirModalDetalles === "function") {
        AbrirModalDetalles(idHojaRuta);
    } else {
        alert(`Abrir panel de Paradas para la Hoja de Ruta #${idHojaRuta}`);
    }
}

function mostrarAlerta(mensaje, tipo) {
    // Generador dinámico de banners de alerta Bootstrap 5 (opcional pero muy útil)
    const $container = $("#alertContainer");
    if ($container.length > 0) {
        const html = `
            <div class="alert alert-${tipo} alert-dismissible fade show mb-3" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
        $container.html(html);
        setTimeout(() => { $(".alert").alert('close'); }, 4000);
    } else {
        alert(mensaje);
    }
}






// const URL_HOJA_RUTA = "https://localhost:44325/api/hojaruta";

// $(document).ready(function () {
//     ListarHojasDeRuta();
// });

// // --- L: READ (Listar todo) ---
// function ListarHojasDeRuta() {
//     $.ajax({
//         type: "GET",
//         url: URL_HOJA_RUTA,
//         dataType: "json",
//         success: function (data) {
//             const tbody = $("#tbodyHojasRuta");
//             tbody.empty();

//             data.forEach(item => {
//                 let fila = `<tr>
//                     <td>${item.Id}</td>
//                     <td>${item.FechaFormateada}</td>
//                     <td>${item.Vehiculo}</td>
//                     <td>${item.ChoferNombreCompleto}</td>
//                     <td>
//                         <button class="btn btn-sm btn-warning" onclick="CargarParaEditarHR(${item.Id}, '${item.Fecha}', ${item.Id_Vehiculo}, ${item.Id_Empleado})">Editar</button>
//                         <button class="btn btn-sm btn-danger" onclick="EliminarHojaRuta(${item.Id})">Eliminar</button>
//                     </td>
//                 </tr>`;
//                 tbody.append(fila);
//             });
//         },
//         error: function (error) {
//             console.error("Error al listar Hojas de Ruta:", error);
//         }
//     });
// }

// // --- C: CREATE (Insertar) / U: UPDATE (Modificar) ---
// function GuardarHojaRuta() {
//     const id = $("#hr_id").val(); // Campo oculto para el ID
    
//     const objHojaRuta = {
//         "Fecha": $("#hr_fecha").val(),
//         "Id_Vehiculo": parseInt($("#hr_id_vehiculo").val()),
//         "Id_Empleado": parseInt($("#hr_id_empleado").val())
//     };

//     // Si hay un ID, es una actualización (PUT); de lo contrario, es una creación (POST)
//     const esEdicion = id !== "" && id !== "0";
//     const metodo = esEdicion ? "PUT" : "POST";
//     const urlFinal = esEdicion ? `${URL_HOJA_RUTA}/${id}` : URL_HOJA_RUTA;

//     $.ajax({
//         type: metodo,
//         url: urlFinal,
//         data: JSON.stringify(objHojaRuta),
//         contentType: "application/json; charset=utf-8",
//         success: function (response) {
//             alert(response.Mensaje || "Operación realizada con éxito.");
//             LimpiarFormularioHR();
//             ListarHojasDeRuta();
//         },
//         error: function (error) {
//             console.error("Error al guardar Hoja de Ruta:", error);
//             alert("Ocurrió un error al procesar la solicitud.");
//         }
//     });
// }

// // --- PREPARAR EDICIÓN (Cargar datos en el formulario) ---
// function CargarParaEditarHR(id, fecha, idVehiculo, idEmpleado) {
//     $("#hr_id").val(id);
//     $("#hr_fecha").val(fecha);
//     $("#hr_id_vehiculo").val(idVehiculo);
//     $("#hr_id_empleado").val(idEmpleado);
//     $("#btnGuardarHR").text("Actualizar");
// }

// // --- D: DELETE (Eliminar) ---
// function EliminarHojaRuta(id) {
//     if (confirm("¿Está seguro de eliminar esta Hoja de Ruta?")) {
//         $.ajax({
//             type: "DELETE",
//             url: `${URL_HOJA_RUTA}/${id}`,
//             success: function (response) {
//                 alert(response.Mensaje || "Registro eliminado.");
//                 ListarHojasDeRuta();
//             },
//             error: function (error) {
//                 console.error("Error al eliminar Hoja de Ruta:", error);
//             }
//         });
//     }
// }

// function LimpiarFormularioHR() {
//     $("#hr_id").val("");
//     $("#formHojaRuta")[0].reset();
//     $("#btnGuardarHR").text("Guardar");
// }

// // ==========================================================================================
// // CONSTANTES GLOBALES Y DIRECCIONES API (MÓDULO: HOJA DE RUTA)
// // ==========================================================================================
// // Apunta explícitamente al puerto de tu backend de Visual Studio para evitar los 404 del Live Server
// const URL_BASE = "https://localhost:44325/api"; 
// const URL_EST_HDR = URL_BASE + "/EST_HDR";
// const URL_HDR = URL_BASE + "/HojaRuta";

// // Colecciones globales para búsquedas instantáneas en edición y mapeo de foráneas
// let globalEstadosHdr = [];
// let globalHojasRuta = [];

// // Arrays auxiliares para resolver los nombres de IDs foráneos en las tablas
// let globalAuxVehiculos = [];
// let globalAuxChoferes = [];

// // ==========================================================================================
// // INICIALIZACIÓN DEL MÓDULO HOJA DE RUTA
// // ==========================================================================================
// $(document).ready(function () {
//     InicializarModuloHdr();
//     AplicarValidacionesHdr();
// });

// function InicializarModuloHdr() {
//     // Cargar selects cruzados primero, luego renderizar las tablas
//     CargarSelectsFiltrosHdr(function() {
//         CargarEstadosHdr();
//         CargarHojasRuta();
//     });
// }

// function limpiarFormulariosHdr() {
//     // Reseteo Estado Hoja de Ruta
//     $("#txtIdEstadoHdr").val("0");
//     $("#estado_hdr").val("");

//     // Reseteo Hoja de Ruta
//     $("#txtIdHojaRuta").val("0");
//     $("#hoja_ruta_fecha").val("");
//     $("#id_vehiculo").val("");
//     $("#id_chofer").val("");
//     $("#id_estado").val("");
// }

// // ==========================================================================================
// // AUXILIAR: LLENADO DE SELECTS DESDE OTRAS APIS DEL SISTEMA
// // ==========================================================================================
// function CargarSelectsFiltrosHdr(callbackComplete) {
//     let llamadasTerminadas = 0;
//     function revisarTermino() {
//         llamadasTerminadas++;
//         if (llamadasTerminadas === 3 && callbackComplete) callbackComplete();
//     }

//     // A. Cargar Estados Hoja de Ruta
//     $.get(URL_EST_HDR + "/ListarTodo", function (data) {
//         globalEstadosHdr = data || [];
//         $("#id_estado").empty().append('<option value="">Seleccione estado</option>');
//         globalEstadosHdr.forEach(e => {
//             let keys = Object.keys(e);
//             let id = e.Id || e.id || e[keys[0]];
//             let nombre = e.EstadoHojaRuta || e.estadoHojaRuta || e[keys[1]];
//             $("#id_estado").append(`<option value="${id}">${nombre}</option>`);
//         });
//         revisarTermino();
//     }).fail(revisarTermino);

//     // B. Cargar Vehículos
//     $.get(URL_BASE + "/Vehiculo/ListarTodo", function (data) {
//         globalAuxVehiculos = data || [];
//         $("#id_vehiculo").empty().append('<option value="">Seleccione vehículo</option>');
//         globalAuxVehiculos.forEach(v => {
//             let keys = Object.keys(v);
//             let id = v.Id || v.id || v[keys[0]];
//             let patente = v.Patente || v.patente || v[keys[1]];
//             $("#id_vehiculo").append(`<option value="${id}">${patente}</option>`);
//         });
//         revisarTermino();
//     }).fail(revisarTermino);

//     // C. Cargar Choferes / Empleados
//     $.get(URL_BASE + "/Empleado/ListarTodo", function (data) {
//         globalAuxChoferes = data || [];
//         $("#id_chofer").empty().append('<option value="">Seleccione chofer</option>');
//         globalAuxChoferes.forEach(emp => {
//             let keys = Object.keys(emp);
//             let id = emp.Id || emp.id || emp[keys[0]];
//             let nombre = emp.Nombre || emp.nombre || emp[keys[1]];
//             $("#id_chofer").append(`<option value="${id}">${nombre}</option>`);
//         });
//         revisarTermino();
//     }).fail(revisarTermino);
// }

// // ==========================================================================================
// // 1. LÓGICA / CONTROLADOR: ESTADOS HOJA DE RUTA (Controlador: EST_HDR)
// // ==========================================================================================
// function CargarEstadosHdr() {
//     $.get(URL_EST_HDR + "/ListarTodo", function (data) {
//         globalEstadosHdr = data || [];
//         $("#tbodyEstadoHdr").empty();
//         if (globalEstadosHdr.length > 0) {
//             globalEstadosHdr.forEach(e => {
//                 let keys = Object.keys(e);
//                 let id = e.Id || e.id || e[keys[0]];
//                 let nombre = e.EstadoHojaRuta || e.estadoHojaRuta || e[keys[1]];

//                 $("#tbodyEstadoHdr").append(`<tr>
//                     <td>${id}</td>
//                     <td class="fw-bold">${nombre}</td>
//                     <td class="text-center">
//                         <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarEdicionEstadoHdr(${id})">Editar</button>
//                         <button class="btn btn-sm btn-outline-danger" onclick="EliminarEstadoHdr(${id})">Eliminar</button>
//                     </td>
//                 </tr>`);
//             });
//         }
//     });
// }

// function GuardarEstadoHdr() {
//     let id = $("#txtIdEstadoHdr").val() || "0";
//     let textoEstado = $("#estado_hdr").val();

//     if (!textoEstado || textoEstado.trim() === "") return;

//     let data = { EstadoHojaRuta: textoEstado.trim() };
//     let esModificacion = (id != "0" && id != "");
    
//     // Si es modificación, usamos PUT (porque así lo exige tu controlador)
//     // Si es nuevo, usamos POST
//     let tipoMetodo = esModificacion ? "PUT" : "POST";
//     let url = esModificacion ? URL_EST_HDR + "/Modificar/" + id : URL_EST_HDR + "/Insertar";

//     $.ajax({
//         type: tipoMetodo, // <--- Aquí está la clave: ahora el JS enviará PUT cuando sea edición
//         url: url,
//         data: JSON.stringify(data),
//         contentType: "application/json",
//         success: function () {
//             Swal.fire("Éxito", "Procesado correctamente", "success");
//             limpiarFormulariosHdr();
//             InicializarModuloHdr();
//         },
//         error: function(xhr) {
//             console.error("Error en servidor:", xhr.status, xhr.responseText);
//             Swal.fire("Error", "El servidor rechazó la solicitud.", "error");
//         }
//     });
// }

// function CargarEdicionEstadoHdr(id) {
//     let encontrado = globalEstadosHdr.find(e => (e.Id || e.id || e[Object.keys(e)[0]]) == id);
//     if (encontrado) {
//         let keys = Object.keys(encontrado);
//         $("#txtIdEstadoHdr").val(encontrado.Id || encontrado[keys[0]]);
//         $("#estado_hdr").val(encontrado.EstadoHojaRuta || encontrado[keys[1]]);
//     }
// }

// function EliminarEstadoHdr(id) {
//    Swal.fire({ title: '¿Eliminar estado?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' }).then((result) => {
//         if (result.isConfirmed) {
//             $.ajax({
//                 type: "DELETE",
//                 url: URL_EST_HDR + "/Borrar/" + id,
//                 success: function () {
//                     Swal.fire('Eliminado', '', 'success');
//                     InicializarModuloHdr();
//                 }
//             });
//         }
//     });
// }

// // ==========================================================================================
// // 2. LÓGICA / CONTROLADOR: HOJA DE RUTA (Controlador: HojaRuta)
// // ==========================================================================================
// function CargarHojasRuta() {
//     $.get(URL_HDR + "/ListarTodo", function (data) {
//         globalHojasRuta = data || [];
//         $("#tbodyHojasRuta").empty();

//         if (globalHojasRuta.length > 0) {
//             globalHojasRuta.forEach(h => {
//                 let keys = Object.keys(h);
//                 let id = h.Id || h.id || h[keys[0]];
//                 let fechaOriginal = h.HojaRutaFecha || h.hojaRutaFecha || h[keys[1]] || "";
//                 let idVehForaneo = h.Id_Vehiculo || h.id_Vehiculo || h[keys[2]];
//                 let idChoForaneo = h.Id_Chofer || h.id_Chofer || h[keys[3]];
//                 let idEstForaneo = h.Id_Estado || h.id_Estado || h[keys[4]];

//                 let fechaFormateada = fechaOriginal.includes("T") ? fechaOriginal.split("T")[0] : fechaOriginal;

//                 let vAsoc = globalAuxVehiculos.find(v => (v.Id || v.id || v[Object.keys(v)[0]]) == idVehForaneo);
//                 let txtVehiculo = vAsoc ? (vAsoc.Patente || vAsoc.patente || "Vehículo") : "N/A";

//                 let cAsoc = globalAuxChoferes.find(c => (c.Id || c.id || c[Object.keys(c)[0]]) == idChoForaneo);
//                 let txtChofer = cAsoc ? (cAsoc.Nombre || cAsoc.nombre || "Chofer") : "N/A";

//                 let eAsoc = globalEstadosHdr.find(e => (e.Id || e.id || e[Object.keys(e)[0]]) == idEstForaneo);
//                 let txtEstado = eAsoc ? (eAsoc.EstadoHojaRuta || eAsoc.estadoHojaRuta || "Estado") : "N/A";

//                 $("#tbodyHojasRuta").append(`<tr>
//                     <td>${id}</td>
//                     <td>${fechaFormateada}</td>
//                     <td class="fw-bold">${txtVehiculo}</td>
//                     <td>${txtChofer}</td>
//                     <td><span class="badge bg-light text-dark border">${txtEstado}</span></td>
//                     <td class="text-center">
//                         <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarEdicionHojaRuta(${id})">Editar</button>
//                         <button class="btn btn-sm btn-outline-danger" onclick="EliminarHojaRuta(${id})">Eliminar</button>
//                     </td>
//                 </tr>`);
//             });
//         }
//     });
// }

// function GuardarHojaRuta() {
//     let id = $("#txtIdHojaRuta").val() || "0";
    
//     let data = {
//         HojaRutaFecha: $("#hoja_ruta_fecha").val(),
//         Id_Vehiculo: parseInt($("#id_vehiculo").val()),
//         Id_Chofer: parseInt($("#id_chofer").val()),
//         Id_Estado: parseInt($("#id_estado").val())
//     };

//     let esModificacion = (id != "0" && id != "");
//     let url = esModificacion ? URL_HDR + "/Modificar/" + id : URL_HDR + "/Insertar";

//     $.ajax({
//         type: "POST",
//         url: url,
//         data: JSON.stringify(data),
//         contentType: "application/json",
//         success: function () {
//             Swal.fire("Éxito", "Hoja de ruta procesada con éxito", "success");
//             limpiarFormulariosHdr();
//             InicializarModuloHdr();
//         },
//         error: function(err) {
//             console.error(err);
//             Swal.fire("Error", "Error al procesar la solicitud en el servidor.", "error");
//         }
//     });
// }

// function CargarEdicionHojaRuta(id) {
//     let encontrado = globalHojasRuta.find(h => (h.Id || h.id || h[Object.keys(h)[0]]) == id);
//     if (encontrado) {
//         let keys = Object.keys(encontrado);
//         $("#txtIdHojaRuta").val(encontrado.Id || encontrado[keys[0]]);
        
//         let fecha = encontrado.HojaRutaFecha || encontrado.hojaRutaFecha || encontrado[keys[1]] || "";
//         if (fecha.includes("T")) fecha = fecha.split("T")[0];
//         $("#hoja_ruta_fecha").val(fecha);

//         $("#id_vehiculo").val(encontrado.Id_Vehiculo || encontrado.id_Vehiculo || "");
//         $("#id_chofer").val(encontrado.Id_Chofer || encontrado.id_Chofer || "");
//         $("#id_estado").val(encontrado.Id_Estado || encontrado.id_Estado || "");
//     }
// }

// function EliminarHojaRuta(id) {
//     Swal.fire({ title: '¿Eliminar hoja de ruta?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' }).then((result) => {
//         if (result.isConfirmed) {
//             $.ajax({
//                 type: "DELETE",
//                 url: URL_HDR + "/Borrar/" + id,
//                 success: function () {
//                     Swal.fire('Eliminado', '', 'success');
//                     InicializarModuloHdr();
//                 }
//             });
//         }
//     });
// }

// // ==========================================================================================
// // VALIDACIONES Y FORMATEO EN TIEMPO REAL
// // ==========================================================================================
// function AplicarValidacionesHdr() {
//     $('#estado_hdr').on('input', function () {
//         let valor = $(this).val();
//         let soloLetras = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, ' ');

//         let palabras = soloLetras.split(' ');
//         for (let i = 0; i < palabras.length; i++) {
//             if (palabras[i].length > 0) {
//                 palabras[i] = palabras[i].charAt(0).toUpperCase() + palabras[i].slice(1).toLowerCase();
//             }
//         }
//         let resultado = palabras.join(' ');
//         if (resultado === ' ') resultado = '';
//         $(this).val(resultado);
//     });
// }