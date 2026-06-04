// Definimos las URLs Base correspondientes a los controladores
const URL_INGRESO = "https://localhost:44325/api/IngresoMaterial";
const URL_DETALLE = "https://localhost:44325/api/DetalleIngreso";
const URL_CLASIFICADO = "https://localhost:44325/api/MaterialClasificado"; // 👈 Nueva URL Base limpia
const URL_REPORTE = "https://localhost:44325/api/ReporteTrazabilidad/Completo";

// Variables globales para el contexto transaccional
let idIngresoActual = null;
let idDetalleActual = null; // 👈 Registra el desglose activo a clasificar

$(document).ready(function () {
    console.log("Iniciando carga de selectores...");
    ComboOrigen();
    ComboChoferes();
    ComboVehiculos();
    ComboSubTipoMaterial();
    ComboEstadoMaterial();
    ComboDestino();
    
    // Ejecutamos la carga del usuario logueado en todas las solapas correspondientes
    EstablecerUsuarioLogueado();

    // Escuchamos el submit del formulario exclusivo de la Pestaña 1
    $("#form-ingreso-cabecera").on("submit", function (e) {
        e.preventDefault(); 
        RegistrarIngreso(); 
    });

    // Escuchamos el submit del formulario exclusivo de la Pestaña 2
    $("#form-ingreso-detalle").on("submit", function (e) {
        e.preventDefault(); 
        RegistrarDetalleMaterial();
    });

    // Escuchamos el submit del formulario exclusivo de la Pestaña 3
    $("#form-clasificacion").on("submit", function (e) {
        e.preventDefault();
        RegistrarClasificacionMaterial();
    });
});

/// --- FUNCIÓN AUXILIAR: CARGAR AUDITORÍA DE USUARIO EN PANTALLA ---
function EstablecerUsuarioLogueado() {
    const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));
    console.log("Datos de la sesión activa en SITMAS:", sesion); // Control para auditoría en consola

    // Evaluamos dinámicamente cómo está guardado el nombre en tu objeto de sesión
    let nombreUsuario = "Operador_SITMAS";
    
    if (sesion) {
        // Probamos las tres variantes comunes de nombres de propiedades
        nombreUsuario = sesion.usuario || sesion.nombre || sesion.Nombre || "Operador_SITMAS";
    }
    
    // Inyectamos de forma directa usando los identificadores únicos
    $("#form-ingreso-cabecera #input-usuario").val(nombreUsuario); // Input de Pestaña 1
    $("#input-usuario-clasif").val(nombreUsuario);                // Input Nuevo de Pestaña 3
}

function ComboOrigen() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/Origen/ListarTodo",
        success: function (data) {
            let select = $("#id-origen");
            select.empty().append('<option value="">Seleccione Origen</option>');
            data.forEach(i => select.append(`<option value="${i.IdOrigen}">${i.EmpresaInstitucion}</option>`));
        }
    });
}

function ComboChoferes() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/Empleado/ListarChoferes",
        success: function (data) {
            let select = $("#select-Chofer");
            select.empty().append('<option value="">Seleccione Chofer</option>');
            data.forEach(i => select.append(`<option value="${i.Id}">${i.Nombre},${i.Apellido}</option>`));
        }
    });
}

function ComboVehiculos() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/Vehiculo/ListarTodo",
        success: function (data) {
            let select = $("#select-Vehiculo");
            select.empty().append('<option value="">Seleccione Vehículo</option>');
            data.forEach(i => select.append(`<option value="${i.Id}">${i.Id} - ${i.Patente}</option>`));
        }
    });
}

function ComboSubTipoMaterial() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/SbTp_Material/ListarTodo",
        success: function (data) {
            let select = $("#select-SbTpMaterial");
            select.empty().append('<option value="">Seleccione Subtipo de Material</option>');
            data.forEach(i => select.append(`<option value="${i.IdSubtipoM}">${i.Subtipo}</option>`));
        }
    });
}

function ComboEstadoMaterial() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/EST_Material/ListarTodo",
        success: function (data) {
            let select = $("#select-EST_Material");
            select.empty().append('<option value="">Seleccione Estado del Material</option>');
            data.forEach(i => select.append(`<option value="${i.IdEstadoMaterial}">${i.EstadoMaterial}</option>`));
        }
    });
}

function ComboDestino() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/Destino/ListarTodo",
        success: function (data) {
            let select = $("#select-destino");
            select.empty().append('<option value="">Seleccione Destino</option>');
            data.forEach(i => select.append(`<option value="${i.IdDestino}">${i.Destino}</option>`));
        }
    });
}

// --- 1. FUNCIÓN: REGISTRAR INGRESO (Pestaña 1) ---
// --- 1. MODIFICACIÓN EN REGISTRAR INGRESO (Pestaña 1) ---
function RegistrarIngreso() {
    const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));
    const idUsuarioReal = (sesion && sesion.id) ? parseInt(sesion.id) : 1;

    if (!$("#id-origen").val() || !$("#select-Chofer").val() || !$("#select-Vehiculo").val()) {
        alert("⚠️ Por favor, complete todos los campos de origen, chofer y vehículo.");
        return;
    }

    const ingresoObj = {
        "Id_Origen": parseInt($("#id-origen").val()),
        "Id_Usuario_Registro": idUsuarioReal,
        "Id_Camionero_Ingreso": parseInt($("#select-Chofer").val()),
        "Id_Vehiculo_Ingreso": parseInt($("#select-Vehiculo").val())
    };

    $.ajax({
        type: "POST",
        url: URL_INGRESO,
        data: JSON.stringify(ingresoObj),
        contentType: "application/json; charset=utf-8",
        success: function (response) {
            idIngresoActual = response.id;
            alert(`✅ ${response.mensaje} Registrado con el ID Número: ${idIngresoActual}`);
            
            // Reemplazo Analítico: Al crear el camión, ya dejamos preparado el disparador automático de desgloses
            CargarMaterialesPendientesClasificar(idIngresoActual);
            
            showPag(2);
            ListarIngresosHistoricos();
        },
        error: function (err) {
            console.error("Error en RegistrarIngreso:", err);
            alert("❌ Hubo un error al guardar la cabecera del ingreso.");
        }
    });
}
// function RegistrarIngreso() {
//     const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));
//     const idUsuarioReal = (sesion && sesion.id) ? parseInt(sesion.id) : 1;

//     if (!$("#id-origen").val() || !$("#select-Chofer").val() || !$("#select-Vehiculo").val()) {
//         alert("⚠️ Por favor, complete todos los campos de origen, chofer y vehículo.");
//         return;
//     }

//     const ingresoObj = {
//         "Id_Origen": parseInt($("#id-origen").val()),
//         "Id_Usuario_Registro": idUsuarioReal,
//         "Id_Camionero_Ingreso": parseInt($("#select-Chofer").val()),
//         "Id_Vehiculo_Ingreso": parseInt($("#select-Vehiculo").val())
//     };

//     $.ajax({
//         type: "POST",
//         url: URL_INGRESO,
//         data: JSON.stringify(ingresoObj),
//         contentType: "application/json; charset=utf-8",
//         success: function (response) {
//             idIngresoActual = response.id;
//             alert(`✅ ${response.mensaje} Registrado con el ID Número: ${idIngresoActual}`);
            
//             // Alimentamos el select de referencia de la Pestaña 3 con el ID actual de viaje
//             CargarSelectReferenciaIngreso(idIngresoActual);
            
//             showPag(2);
//             ListarIngresosHistoricos();
//         },
//         error: function (err) {
//             console.error("Error en RegistrarIngreso:", err);
//             alert("❌ Hubo un error al guardar la cabecera del ingreso.");
//         }
//     });
// }

// --- FUNCIÓN AUXILIAR: LLENAR DINÁMICAMENTE EL SELECTOR DE LA PESTAÑA 3 ---
function CargarSelectReferenciaIngreso(idIngreso) {
    let selectClasif = $("#select-id-ingreso");
    selectClasif.empty();
    selectClasif.append(`<option value="${idIngreso}" selected>Ingreso Actual Múltiple (#${idIngreso})</option>`);
}

// --- 2. FUNCIÓN: REGISTRAR DETALLE DE MATERIAL (Pestaña 2) ---
// --- 2. MODIFICACIÓN EN REGISTRAR DETALLE (Pestaña 2) ---
function RegistrarDetalleMaterial() {
    if (!idIngresoActual) {
        alert("⚠️ Operación inválida: Primero debe registrar la cabecera en la pestaña 'Ingreso'.");
        showPag(1);
        return;
    }

    const idSubtipoMaterial = $("#select-SbTpMaterial").val();
    const pesoInput = $("#input-peso").val();
    const observaciones = $("#textarea-obs").val();

    if (!idSubtipoMaterial || !pesoInput || parseFloat(pesoInput) <= 0) {
        alert("⚠️ Por favor, seleccione un subtipo y cargue un peso válido (mayor a 0).");
        return;
    }

    const detalleObj = {
        "Id_Ingreso_Material": parseInt(idIngresoActual),
        "Id_SubTipo_Material": parseInt(idSubtipoMaterial),
        "PesoBruto": parseFloat(pesoInput),
        "Observaciones": observaciones || ""
    };

    $.ajax({
        type: "POST",
        url: URL_DETALLE,
        data: JSON.stringify(detalleObj),
        contentType: "application/json; charset=utf-8",
        success: function (response) {
            alert("✅ " + response);

            // Cada vez que se registra un desglose bruto con éxito en la solapa 2, 
            // volvemos a consultar la API para que actualice la lista de la pestaña 3.
            CargarMaterialesPendientesClasificar(idIngresoActual);

            $("#select-SbTpMaterial").val("");
            $("#input-peso").val("");
            $("#textarea-obs").val("");

            if(confirm("¿Desea pasar ahora mismo a Clasificar el material registrado?")) {
                showPag(3);
            }

            ListarIngresosHistoricos();
        },
        error: function (err) {
            console.error("Error en RegistrarDetalleMaterial:", err);
            alert("❌ Hubo un error al guardar el detalle del material.");
        }
    });
}
// function RegistrarDetalleMaterial() {
//     if (!idIngresoActual) {
//         alert("⚠️ Operación inválida: Primero debe registrar la cabecera en la pestaña 'Ingreso'.");
//         showPag(1);
//         return;
//     }

//     const idSubtipoMaterial = $("#select-SbTpMaterial").val();
//     const pesoInput = $("#input-peso").val();
//     const observaciones = $("#textarea-obs").val();

//     if (!idSubtipoMaterial || !pesoInput || parseFloat(pesoInput) <= 0) {
//         alert("⚠️ Por favor, seleccione un subtipo y cargue un peso válido (mayor a 0).");
//         return;
//     }

//     const detalleObj = {
//         "Id_Ingreso_Material": parseInt(idIngresoActual),
//         "Id_SubTipo_Material": parseInt(idSubtipoMaterial),
//         "PesoBruto": parseFloat(pesoInput),
//         "Observaciones": observaciones || ""
//     };

//     $.ajax({
//         type: "POST",
//         url: URL_DETALLE,
//         data: JSON.stringify(detalleObj),
//         contentType: "application/json; charset=utf-8",
//         success: function (response) {
//             alert("✅ " + response);

//             // Resguardo de contexto: Dado que el SP de inserción no retorna el ID autogenerado del detalle, 
//             // vinculamos la clasificación transicionalmente mediante el ID de la cabecera activa,
//             // o mapeamos temporalmente el ID de cabecera a la propiedad del objeto transaccional.
//             idDetalleActual = idIngresoActual; 

//             // Limpiamos los campos para permitir nuevos pesajes brutos si aplica
//             $("#select-SbTpMaterial").val("");
//             $("#input-peso").val("");
//             $("#textarea-obs").val("");

//             // Brindamos la opción de saltar a clasificar el lote actual de inmediato
//             if(confirm("¿Desea pasar ahora mismo a Clasificar el material registrado?")) {
//                 showPag(3);
//             }

//             ListarIngresosHistoricos();
//         },
//         error: function (err) {
//             console.error("Error en RegistrarDetalleMaterial:", err);
//             alert("❌ Hubo un error al guardar el detalle del material.");
//         }
//     });
// }

// --- 3.1 NUEVA FUNCIÓN CONECTORA: ALIMENTAR PESTAÑA 3 DESDE TU ENDPOINT POR CABECERA ---
function CargarMaterialesPendientesClasificar(idCabecera) {
    if (!idCabecera) return;
    
    let selectClasif = $("#select-id-ingreso");
    
    // Le pegamos exactamente al endpoint de tu DetalleIngresoController con su prefix
    $.ajax({
        type: "GET",
        url: `${URL_DETALLE}/PorCabecera/${idCabecera}`,
        success: function (materiales) {
            selectClasif.empty();
            
            if (!materiales || materiales.length === 0) {
                selectClasif.append('<option value="" selected disabled>⚠️ El camión actual no posee materiales en la Pestaña 2</option>');
                return;
            }
            
            selectClasif.append('<option value="" selected disabled>Seleccione el ítem a procesar...</option>');
            
            // Recorremos la lista que devuelve tu Stored Procedure sp_ListarVistaDetalle_Ingreso
            materiales.forEach(mat => {
                // Mapeamos el ID REAL de la tabla Detalle_Ingreso (IdDetalleIngreso) en el value del option.
                // Mostramos texto descriptivo para que el usuario sepa qué está seleccionando.
                let optionText = `Detalle #${mat.IdDetalleIngreso} - Subtipo ID: ${mat.Id_SubTipo_Material} (${mat.PesoBruto} kg Brutos)`;
                
                // Control analítico extra por si tu SP usa las propiedades de la vista extendida
                if (mat.Subtipo) {
                    optionText = `${mat.Subtipo} - Bruto: ${mat.PesoBruto} kg (Detalle #${mat.IdDetalleIngreso})`;
                }
                
                selectClasif.append(`<option value="${mat.IdDetalleIngreso}">${optionText}</option>`);
            });
            
            console.log("SITMAS - Mapeo de FKs cargado con éxito en Pestaña 3 para el camión:", idCabecera);
        },
        error: function (err) {
            console.error("Error en CargarMaterialesPendientesClasificar:", err);
            selectClasif.empty().append('<option value="" selected disabled>❌ Error al enlazar desgloses del servidor</option>');
        }
    });
}


/// --- 3.2 FUNCIÓN: REGISTRAR MATERIAL CLASIFICADO (Pestaña 3 - FINAL) ---
function RegistrarClasificacionMaterial() {
    const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));
    const idUsuarioReal = (sesion && sesion.id) ? parseInt(sesion.id) : 1;

    const idEstadoMaterial = $("#select-EST_Material").val();
    const pesoUtilInput = $("#peso-clasif").val();
    const idDestino = $("#select-destino").val();
    const idIngresoReferencia = $("#select-id-ingreso").val();

    if (!idIngresoReferencia) {
        alert("⚠️ No hay ninguna referencia de ingreso seleccionada para asociar esta clasificación.");
        return;
    }
    if (!idEstadoMaterial || !idDestino || !pesoUtilInput || parseFloat(pesoUtilInput) <= 0) {
        alert("⚠️ Por favor, complete el Estado del Material, el Destino y un Peso Útil válido mayor a 0.");
        return;
    }

    // Construcción del objeto compatible con el modelo C#
    const clasificacionObj = {
        // Pasamos el ID de referencia. Nota: Si tu tabla 'Material_Clasificado' hereda directamente 
        // el Id del Detalle, asegurate de que el valor seleccionado en el combo corresponda a un ID de detalle válido.
        "Id_Detalle_Ingreso": parseInt(idIngresoReferencia), 
        "PesoUtil": parseFloat(pesoUtilInput),
        "Id_Estado_Material": parseInt(idEstadoMaterial),
        "Id_Destino": parseInt(idDestino),
        "Id_Usuario_Clasificador": idUsuarioReal
    };

    console.log("SITMAS Envío Clasificación Final ->", clasificacionObj);

    $.ajax({
        type: "POST",
        url: URL_CLASIFICADO,
        data: JSON.stringify(clasificacionObj),
        contentType: "application/json; charset=utf-8",
        success: function (response) {
            alert("🎉 " + response);

            // Limpieza de campos
            $("#select-EST_Material").val("");
            $("#peso-clasif").val("");
            $("#select-destino").val("");
            
            idIngresoActual = null;
            idDetalleActual = null;
            $("#select-id-ingreso").empty().append('<option value="" selected disabled>Seleccione un ingreso pendiente...</option>');

            showPag(4);
            ListarIngresosHistoricos();
        },
        error: function (err) {
            console.error("Error detallado de SITMAS en el Servidor:", err);
            
            // 👈 NUEVA CAPTURA DE EXCEPCIÓN: Mostramos la respuesta exacta del catch de C#
            if (err.responseText) {
                alert("❌ Error interno del Servidor:\n" + err.responseText);
            } else {
                alert("❌ Hubo un error 500 en el servidor al procesar la clasificación.");
            }
        }
    });
}

// --- 4. FUNCIÓN: LISTAR VISTA HISTÓRICA (Pestaña 4 - Informes) ---
// --- 4. FUNCIÓN: LISTAR VISTA DE TRAZABILIDAD COMPLETA (Pestaña 4 - Informes) ---
function ListarIngresosHistoricos() {
    console.log("SITMAS - Consultando reporte de trazabilidad unificada...");
    
    $.ajax({
        type: "GET",
        url: URL_REPORTE,
        dataType: "json",
        success: function (data) {
            const tbody = document.getElementById("body-informes");
            if (!tbody) return;

            tbody.innerHTML = "";

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted py-4">⚠️ No hay registros de materiales gestionados en la planta.</td></tr>`;
                return;
            }

            data.forEach(item => {
                // 1. Formateo de Fecha Regional
                let fechaFormateada = new Date(item.FechaIngreso).toLocaleString('es-AR', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                });

                // 2. Control Analítico de Celdas Vacías (Tratamiento del LEFT JOIN)
                // Si el material aún no fue clasificado, la vista devuelve NULL. Lo manejamos visualmente.
                let pesoUtilTexto = item.PesoUtil !== null ? `<span class="fw-bold text-success">${item.PesoUtil} kg</span>` : `<span class="text-muted small"><em>Pendiente</em></span>`;
                let destinoTexto = item.DestinoFinal ? item.DestinoFinal : `<span class="badge bg-warning-subtle text-warning border border-warning-subtle">En Clasificación</span>`;
                let clasificadorTexto = item.ClasificadoPor ? item.ClasificadoPor : `<span class="text-muted">---</span>`;

                // 3. Renderizado dinámico de Badges de Condición
                let badgeCondicion = `<span class="text-muted">---</span>`;
                if (item.Condicion) {
                    if (item.Condicion.toLowerCase() === 'verde') {
                        badgeCondicion = `<span class="badge bg-success text-white border">Verde</span>`;
                    } else if (item.Condicion.toLowerCase() === 'amarillo') {
                        badgeCondicion = `<span class="badge bg-warning text-dark border">Amarillo</span>`;
                    } else {
                        badgeCondicion = `<span class="badge bg-danger text-white border">${item.Condicion}</span>`;
                    }
                }

                // 4. Inyección en la Fila con alineación exacta
                let tr = `<tr>
                            <td class="fw-bold text-secondary">#${item.NroIngreso}</td>
                            <td class="small">${fechaFormateada}</td>
                            <td>${item.Origen}</td>
                            <td class="small">${item.Chofer}</td>
                            <td><span class="badge bg-light text-dark border">${item.Vehiculo}</span></td>
                            <td><span class="badge bg-dark-subtle text-dark border-0">${item.Categoria}</span></td>
                            <td>${item.SubTipo}</td>
                            <td class="fw-semibold text-secondary">${item.PesoBruto} kg</td>
                            <td>${pesoUtilTexto}</td>
                            <td class="text-center">${badgeCondicion}</td>
                            <td>${destinoTexto}</td>
                            <td class="text-muted small">${clasificadorTexto}</td>
                          </tr>`;
                tbody.innerHTML += tr;
            });
            console.log("SITMAS - Tabla de reportes renderizada de manera exitosa.");
        },
        error: function (error) {
            console.error("Error al cargar la vista de trazabilidad unificada:", error);
            alert("❌ No se pudieron recuperar los datos históricos de trazabilidad.");
        }
    });
}

function PrepararEditarIngreso(idIngreso, idOrigen, idCamionero, idVehiculo) {
    $("#txtIdIngresoModificar").val(idIngreso);
    $("#selectOrigen").val(idOrigen).trigger('change');
    $("#selectChofer").val(idCamionero).trigger('change');
    $("#selectVehiculo").val(idVehiculo).trigger('change');
    $("#modalEditarIngreso").modal("show");
}

function AnularIngresoCabecera(idIngreso) {
    if (!confirm(`⚠ ¿Está seguro de que desea ANULAR el Ingreso de Material #${idIngreso}?`)) {
        return;
    }

    $.ajax({
        type: "DELETE",
        url: `${URL_INGRESO}/${idIngreso}`,
        success: function (response) {
            alert("🔒 " + response);
            ListarIngresosHistoricos();
        },
        error: function (err) {
            console.error("Error al anular cabecera:", err);
            alert("❌ No se pudo completar la anulación del ingreso.");
        }
    });
}

window.cargarInformes = function () {
    console.log("SITMAS - Puente ejecutado con éxito.");
    ListarIngresosHistoricos();
};













// // Definimos la URL Base correspondiente al controlador de cabeceras de ingreso
// const URL_INGRESO = "https://localhost:44325/api/IngresoMaterial";
// const URL_DETALLE = "https://localhost:44325/api/DetalleIngreso";

// // Variable global para almacenar el ID del ingreso que se acaba de crear o seleccionar
// let idIngresoActual = null;

// $(document).ready(function () {
//     console.log("Iniciando carga de selectores...");
//     ComboOrigen();
//     ComboChoferes();
//     ComboVehiculos();
//     ComboSubTipoMaterial();
//     ComboEstadoMaterial();
//     ComboDestino();

//     // Además de tus combos, cargamos el listado histórico en la solapa de informes
//     //ListarIngresosHistoricos();

//     // Escuchamos el submit del formulario exclusivo de la Pestaña 1 y 2
//     $("#form-ingreso-cabecera").on("submit", function (e) {
//         e.preventDefault(); // Evita que la página se recargue
//         RegistrarIngreso(); // Llama a la función de guardado si pasó las validaciones
//     });

//     $("#form-ingreso-detalle").on("submit", function (e) {
//         e.preventDefault(); // Evita la recarga de página
//         RegistrarDetalleMaterial();
//     });

// });




// function ComboOrigen() {
//     $.ajax({
//         type: "GET",
//         url: "https://localhost:44325/api/Origen/ListarTodo",
//         success: function (data) {
//             let select = $("#id-origen");
//             select.empty().append('<option value="">Seleccione Origen</option>');
//             data.forEach(i => select.append(`<option value="${i.IdOrigen}">${i.EmpresaInstitucion}</option>`));
//         }
//     });
// }

// function ComboChoferes() {
//     $.ajax({
//         type: "GET",
//         url: "https://localhost:44325/api/Empleado/ListarChoferes",
//         success: function (data) {
//             let select = $("#select-Chofer");
//             select.empty().append('<option value="">Seleccione Chofer</option>');
//             data.forEach(i => select.append(`<option value="${i.Id}">${i.Nombre},${i.Apellido}</option>`));
//         }
//     });
// }

// function ComboVehiculos() {
//     $.ajax({
//         type: "GET",
//         url: "https://localhost:44325/api/Vehiculo/ListarTodo",
//         success: function (data) {
//             let select = $("#select-Vehiculo");
//             select.empty().append('<option value="">Seleccione Vehículo</option>');
//             data.forEach(i => select.append(`<option value="${i.Id}">${i.Id} - ${i.Patente}</option>`));
//         }
//     });
// }



// // function ComboTipoMaterial() {
// //     $.ajax({
// //         type: "GET",
// //         url: "https://localhost:44325/api/TP_Material/ListarTodo",
// //         success: function (data) {
// //             let select = $("#select-TpMaterial");
// //             select.empty().append('<option value="">Seleccione Tipo de Material</option>');
// //             data.forEach(i => select.append(`<option value="${i.IdTipoMaterial}">${i.TipoMaterial}</option>`));
// //         }
// //     });
// // }

// function ComboSubTipoMaterial() {
//     $.ajax({
//         type: "GET",
//         url: "https://localhost:44325/api/SbTp_Material/ListarTodo",
//         success: function (data) {
//             let select = $("#select-SbTpMaterial");
//             select.empty().append('<option value="">Seleccione Subtipo de Material</option>');
//             data.forEach(i => select.append(`<option value="${i.IdSubtipoM}">${i.Subtipo}</option>`));
//         }
//     });
// }

// function ComboEstadoMaterial() {
//     $.ajax({
//         type: "GET",
//         url: "https://localhost:44325/api/EST_Material/ListarTodo",
//         success: function (data) {
//             let select = $("#select-EST_Material");
//             select.empty().append('<option value="">Seleccione Estado del Material</option>');
//             data.forEach(i => select.append(`<option value="${i.IdEstadoMaterial}">${i.EstadoMaterial}</option>`));
//         }
//     });
// }

// function ComboDestino() {
//     $.ajax({
//         type: "GET",
//         url: "https://localhost:44325/api/Destino/ListarTodo",
//         success: function (data) {
//             let select = $("#select-destino");
//             select.empty().append('<option value="">Seleccione Destino</option>');
//             data.forEach(i => select.append(`<option value="${i.IdDestino}">${i.Destino}</option>`));
//         }
//     });
// }

// // --- 1. FUNCIÓN: REGISTRAR INGRESO (ALTA con captura de ID) ---
// function RegistrarIngreso() {
//     // Obtenemos los datos de sesión para saber qué ID de usuario está operando
//     const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));

//     // 2. CAPTURA DINÁMICA: Si existe la sesión, tomamos el .id real de la base de datos.
//     // Si no existe (caso de prueba aislada), le asignamos 1 por defecto para que no falle.
//     const idUsuarioReal = (sesion && sesion.id) ? parseInt(sesion.id) : 1;

//     // Control de auditoría en la consola para que el equipo verifique quién está firmando el viaje
//     console.log("Auditoría SITMAS - ID de Usuario que registra el camión:", idUsuarioReal);

//     // Validamos visualmente que los selectores tengan valores
//     if (!$("#id-origen").val() || !$("#select-Chofer").val() || !$("#select-Vehiculo").val()) {
//         alert("⚠️ Por favor, complete todos los campos de origen, chofer y vehículo.");
//         return;
//     }

//     // Armamos el objeto exactamente igual a las propiedades del modelo C#
//     const ingresoObj = {
//         "Id_Origen": parseInt($("#id-origen").val()),
//         "Id_Usuario_Registro": idUsuarioReal,
//         "Id_Camionero_Ingreso": parseInt($("#select-Chofer").val()),
//         "Id_Vehiculo_Ingreso": parseInt($("#select-Vehiculo").val())
//     };

//     $.ajax({
//         type: "POST",
//         url: URL_INGRESO,
//         data: JSON.stringify(ingresoObj),
//         contentType: "application/json; charset=utf-8",
//         success: function (response) {
//             // Guardamos el ID autogenerado que nos devolvió el IHttpActionResult de la API
//             idIngresoActual = response.id;

//             alert(`✅ ${response.mensaje} Registrado con el ID Número: ${idIngresoActual}`);

//             // ACTUALIZACIÓN DE FLUJO: Desbloqueamos y saltamos automáticamente a la pestaña de detalles
//             // Pasamos el ID al contexto para que sepa dónde añadir los materiales
//             showPag(2);

//             // Refrescamos los informes por detrás
//             ListarIngresosHistoricos();
//         },
//         error: function (err) {
//             console.error("Error en RegistrarIngreso:", err);
//             alert("❌ Hubo un error al guardar la cabecera del ingreso.");
//         }
//     });
// }



// // --- 4. FUNCIÓN: REGISTRAR DETALLE DE MATERIAL (Pestaña 2) ---
// function RegistrarDetalleMaterial() {
//     // Control analítico: validamos que exista un camión activo en el contexto
//     if (!idIngresoActual) {
//         alert("⚠️ Operación inválida: Primero debe registrar la cabecera en la pestaña 'Ingreso'.");
//         showPag(1);
//         return;
//     }

//     // Captura de datos desde la interfaz
//     const idSubtipoMaterial = $("#select-SbTpMaterial").val();
//     const pesoInput = $("#input-peso").val();
//     const observaciones = $("#textarea-obs").val();

//     // Validación básica del lado del cliente
//     if (!idSubtipoMaterial || !pesoInput || parseFloat(pesoInput) <= 0) {
//         alert("⚠️ Por favor, seleccione un subtipo y cargue un peso válido (mayor a 0).");
//         return;
//     }

//     // El objeto se construye con las PROPIEDADES EXACTAS del modelo Detalle_Ingreso en C#
//     const detalleObj = {
//         "Id_Ingreso_Material": parseInt(idIngresoActual),
//         "Id_SubTipo_Material": parseInt(idSubtipoMaterial),
//         "PesoBruto": parseFloat(pesoInput),
//         "Observaciones": observaciones || ""
//     };

//     console.log("SITMAS Envío Detalle ->", detalleObj);

//     $.ajax({
//         type: "POST",
//         url: URL_DETALLE,
//         data: JSON.stringify(detalleObj),
//         contentType: "application/json; charset=utf-8",
//         success: function (response) {
//             // Tu API responde con un Ok("Pesada de material registrada en el camión.")
//             alert("✅ " + response);

//             // Limpiamos los campos del detalle para permitir otra carga si el camión trae más cosas
//             //$("#select-TpMaterial").val("");
//             $("#select-SbTpMaterial").val("");
//             $("#input-peso").val("");
//             $("#textarea-obs").val("");

//             // Refrescamos de manera asincrónica el listado histórico de informes
//             ListarIngresosHistoricos();
//         },
//         error: function (err) {
//             console.error("Error en RegistrarDetalleMaterial:", err);
//             alert("❌ Hubo un error al guardar el detalle del material.");
//         }
//     });
// }

// // --- 2. FUNCIÓN: LISTAR VISTA (para el Tab de Informes) ---
// function ListarIngresosHistoricos() {
//     $.ajax({
//         type: "GET",
//         url: URL_INGRESO + "/ListarVista",
//         dataType: "json",
//         success: function (data) {
//             const tbody = document.getElementById("body-informes");
//             if (!tbody) return;

//             tbody.innerHTML = "";

//             if (data.length === 0) {
//                 tbody.innerHTML = `<tr><td colspan="13" class="text-center text-muted py-4">⚠️ No hay registros de materiales gestionados.</td></tr>`;
//                 return;
//             }

//             data.forEach(ing => {
//                 // 1. Formateamos la fecha
//                 let fechaFormateada = new Date(ing.FechaIngreso).toLocaleString('es-AR', {
//                     year: 'numeric', month: '2-digit', day: '2-digit',
//                     hour: '2-digit', minute: '2-digit'
//                 });

//                 // 2. Control dinámico del Badge de Condición/Estado
//                 let badgeEstado = '';
//                 if (ing.EstadoIng === 'A' || ing.EstadoIng === 'Activo' || ing.EstadoIng === 1) {
//                     badgeEstado = `<span class="badge bg-success-subtle text-success border border-success-subtle">Activo</span>`;
//                 } else {
//                     badgeEstado = `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">Anulado</span>`;
//                 }

//                 // 3. Serializamos el objeto 'ing' a formato JSON string seguro para pasarlo por parámetro si fuera necesario
//                 // O simplemente pasamos los IDs clave como parámetros a la función.
//                 let paramsEditar = `${ing.IdIngresoM}, ${ing.Id_Origen}, ${ing.Id_Camionero_Ingreso}, ${ing.Id_Vehiculo_Ingreso}`;

//                 // 4. Armamos las 13 celdas exactas que pide el thead
//                 let tr = `<tr>
//                             <td class="fw-bold text-secondary">#${ing.IdIngresoM}</td>
//                             <td>${fechaFormateada}</td>
//                             <td>${ing.Origen || '---'}</td>
//                             <td>${ing.Camionero || '---'}</td>
//                             <td><span class="badge bg-light text-dark border">${ing.Vehiculo || '---'}</span></td>
                            
//                             <td class="text-muted small"><em>Ver Detalle</em></td>
//                             <td class="text-muted small"><em>Ver Detalle</em></td>
//                             <td>-</td>
//                             <td>-</td>
                            
//                             <td>${badgeEstado}</td>
//                             <td>-</td>
//                             <td>${ing.UsuarioRegistro || '---'}</td> <td class="text-center">
//                                 <div class="d-flex gap-1 justify-content-center">
//                                     <button type="button" class="btn btn-outline-primary btn-sm px-2 py-0" 
//                                             onclick="PrepararEditarIngreso(${paramsEditar})">
//                                         <i class="bi bi-pencil"></i> Editar
//                                     </button>
                                    
//                                     <button type="button" class="btn btn-outline-danger btn-sm px-2 py-0" 
//                                             onclick="AnularIngresoCabecera(${ing.IdIngresoM})">
//                                         Anular
//                                     </button>
//                                 </div>
//                             </td>
//                           </tr>`;
//                 tbody.innerHTML += tr;
//             });
//         },
//         error: function (error) {
//             console.log("Error al cargar la vista de informes de ingresos:", error);
//         }
//     });
// }


// function PrepararEditarIngreso(idIngreso, idOrigen, idCamionero, idVehiculo) {
//     // 1. Guardamos el ID del registro que vamos a actualizar
//     $("#txtIdIngresoModificar").val(idIngreso);

//     // 2. Seteamos los selectores de tu formulario con los IDs reales correspondientes
//     $("#selectOrigen").val(idOrigen).trigger('change');
//     $("#selectChofer").val(idCamionero).trigger('change');
//     $("#selectVehiculo").val(idVehiculo).trigger('change');

//     // 3. Mostramos el modal de edición o cambiamos a la pestaña de carga
//     $("#modalEditarIngreso").modal("show");
// }


// // --- 3. FUNCIÓN: ANULAR INGRESO (BAJA LÓGICA) ---
// function AnularIngresoCabecera(idIngreso) {
//     if (!confirm(`⚠ ¿Está seguro de que desea ANULAR el Ingreso de Material #${idIngreso}?\nEsta acción mantendrá el registro de auditoría pero lo quitará de las planillas activas.`)) {
//         return;
//     }

//     $.ajax({
//         type: "DELETE",
//         url: `${URL_INGRESO}/${idIngreso}`, // Pega a api/Ingreso_Material/5
//         success: function (response) {
//             alert("🔒 " + response);
//             // Recargamos el listado para ver cómo desaparece de la grilla por acción del filtro del SP
//             ListarIngresosHistoricos();
//         },
//         error: function (err) {
//             console.error("Error al anular cabecera:", err);
//             alert("❌ No se pudo completar la anulación del ingreso.");
//         }
//     });
// }

// // --- PUENTE DE CONEXIÓN CON LA PAGINACIÓN GLOBAL ---
// // Exponemos la función globalmente para que 'clasificacion_formulario.js' la vea sí o sí
// window.cargarInformes = function () {
//     console.log("SITMAS - Puente ejecutado con éxito.");
//     ListarIngresosHistoricos();
// };

