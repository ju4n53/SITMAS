/* ==========================================================================
   SITMAS - Módulo: Detalle Hoja de Ruta (Paradas / Tablero) - Lógica de Interfaz
   Tecnologías: JavaScript (ES6+), jQuery, AJAX, SortableJS, Google Maps
   ========================================================================== */

const URL_API_DETALLE = "https://localhost:44325/api/detallehojaruta";
const URL_API_TIPO_MOV = "https://localhost:44325/api/tipomovimientos";
const URL_API_RECURSOS = "https://localhost:44325/api/recursosmovilizados";
const URL_API_ORIGEN = "https://localhost:44325/api/Origen";
const URL_API_MATERIAL = "https://localhost:44325/api/TP_Material/ListarTodo";

// 📍 Punto Base dinámico cargado en memoria desde la tabla Origen (Base EMEC)
let coordenadasBaseEMEC = { lat: -31.466122, lng: -64.127283 }; 
let listaOrigenesMemoria = [];
let instanciasSortable = [];

$(document).ready(function () {
    CargarCombosAuxiliaresDetalle();
    CargarTareasPendientes();

    $("#formDetalle").on("submit", function (e) {
        e.preventDefault();
        GuardarTareaPendiente();
    });
});

/* ==========================================================================
   1. CARGA DE COMBOS Y PUNTOS DE REFERENCIA
   ========================================================================== */

function CargarCombosAuxiliaresDetalle() {
    Promise.all([
        CargarComboTipoMovimientos(),
        CargarComboOrigen(),
        CargarComboTipoMaterial(),
        CargarComboRecursosMov()
    ]);
}

function CargarComboTipoMovimientos() {
    return $.ajax({
        type: "GET",
        url: URL_API_TIPO_MOV,
        dataType: "json",
        success: function (data) {
            const $select =$("#dt_id_tipo_mov");
            $select.empty().append('<option value="">Seleccione Movimiento</option>');
            if (data) data.forEach(v => $select.append(`<option value="${v.IdTipoMovimientos}">${v.TipoMovimientos}</option>`));
        }
    });
}

function CargarComboOrigen() {
    return $.ajax({
        type: "GET",
        url: URL_API_ORIGEN,
        dataType: "json",
        success: function (data) {
            listaOrigenesMemoria = data || [];
            const $select =$("#dt_id_origen");
            $select.empty().append('<option value="">Seleccione Origen / Empresa</option>');
            if (data) {
                data.forEach(v => {
                    $select.append(`<option value="${v.IdOrigen}">${v.EmpresaInstitucion}</option>`);
                    // Detectar dinámicamente las coordenadas de la base si está etiquetada como Sede EMEC
                    if (v.EmpresaInstitucion && v.EmpresaInstitucion.toLowerCase().includes("emec") && v.Latitud && v.Longitud) {
                        coordenadasBaseEMEC = { lat: parseFloat(v.Latitud), lng: parseFloat(v.Longitud) };
                    }
                });
            }
        }
    });
}

function CargarComboTipoMaterial() {
    return $.ajax({
        type: "GET",
        url: URL_API_MATERIAL,
        dataType: "json",
        success: function (data) {
            const $select =$("#dt_id_tipo_material");
            $select.empty().append('<option value="">Seleccione Material</option>');
            if (data) data.forEach(v => $select.append(`<option value="${v.IdTipoMaterial}">${v.TipoMaterial}</option>`));
        }
    });
}

function CargarComboRecursosMov() {
    return $.ajax({
        type: "GET",
        url: URL_API_RECURSOS,
        dataType: "json",
        success: function (data) {
            const $select =$("#dt_id_recurso_mov");
            $select.empty().append('<option value="">Seleccione Recurso</option>');
            if (data) data.forEach(v => $select.append(`<option value="${v.IdRecursoMov}">${v.Recurso_Movilizado}</option>`));
        }
    });
}

/* ==========================================================================
   2. RENDERIZADO DE TAREAS Y SORTABLE (DRAG AND DROP)
   ========================================================================== */

function CargarTareasPendientes() {
    $.ajax({
        type: "GET",
        url: `${URL_API_DETALLE}/pendientes`, // 👈 ¡Llamada limpia y semántica a la API!
        dataType: "json",
        success: function (lista) {
            const $contenedor =$("#zonaPendientes");
            $contenedor.empty();$("#cntPendientes").text(lista ? lista.length : 0);

            if (!lista || lista.length === 0) {
                $contenedor.append('<div class="text-center text-muted p-3">No hay tareas pendientes.</div>');
                return;
            }

            lista.forEach(item => {
                $contenedor.append(CrearTarjetaTareaHTML(item));
            });

            ActivarSortableEnTablero();
        },
        error: function (err) {
            console.error("SITMAS - Error al cargar pendientes:", err);
        }
    });
}

function ObtenerParadasPorHojaRuta(idHojaRuta) {
    $.ajax({
        type: "GET",
        url: `${URL_API_DETALLE}/hojaruta/${idHojaRuta}`,
        dataType: "json",
        success: function (lista) {
            const $dropzone =$(`#hdr-drop-${idHojaRuta}`);
            $dropzone.empty();

            if (lista && lista.length > 0) {
                lista.forEach(item => {
                    $dropzone.append(CrearTarjetaTareaHTML(item));
                });
            }
        }
    });
}

function CrearTarjetaTareaHTML(item) {
    return `
        <div class="card mb-2 shadow-sm tarea-card border-start border-4 border-primary" 
             style="cursor: grab;"
             data-id-detalle="${item.Id_Detalle_HDR}"
             data-lat="${item.Latitud || ''}"
             data-lng="${item.Longitud || ''}">
            <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-start">
                    <strong class="small text-dark">${item.Origen || 'Punto Desconocido'}</strong>
                    <span class="badge bg-light text-dark border">${item.TipoMovimiento || 'Mov'}</span>
                </div>
                <div class="small text-muted mt-1">
                    <span>Mat: ${item.TipoMaterial || 'General'}</span>
                </div>
                ${item.DistanciaDesdeAnterior_Km ? `<div class="text-end small text-primary fw-bold">📏 ${item.DistanciaDesdeAnterior_Km} Km</div>` : ''}
            </div>
        </div>`;
}

function ActivarSortableEnTablero() {
    // Limpiamos instancias previas para evitar memory leaks
    instanciasSortable.forEach(inst => inst.destroy());
    instanciasSortable = [];

    const zonaPendientes = document.getElementById('zonaPendientes');
    if (zonaPendientes) {
        instanciasSortable.push(new Sortable(zonaPendientes, {
            group: 'tableroHDR',
            animation: 150
        }));
    }

    const dropzones = document.querySelectorAll('.dropzone-vehiculo');
    dropzones.forEach(dropzone => {
        instanciasSortable.push(new Sortable(dropzone, {
            group: 'tableroHDR',
            animation: 150,
            onAdd: async function (evt) {
                await ProcesarAsignacionDragDrop(evt);
            }
        }));
    });
}

/* ==========================================================================
   3. PROCESAMIENTO ASÍNCRONO DEL EVENTO DROP Y CÁLCULO GOOGLE MAPS
   ========================================================================== */

async function ProcesarAsignacionDragDrop(evt) {
    const tarjetaActual = evt.item;
    const idDetalle = tarjetaActual.getAttribute('data-id-detalle');
    const idHojaRutaDestino = evt.to.getAttribute('data-id-hojaruta');

    // Identificar el Origen (La tarjeta previa o la Sede EMEC)
    const tarjetaAnterior = tarjetaActual.previousElementSibling;
    let origenLat = coordenadasBaseEMEC.lat;
    let origenLng = coordenadasBaseEMEC.lng;

    if (tarjetaAnterior) {
        origenLat = parseFloat(tarjetaAnterior.getAttribute('data-lat')) || origenLat;
        origenLng = parseFloat(tarjetaAnterior.getAttribute('data-lng')) || origenLng;
    }

    const destinoLat = parseFloat(tarjetaActual.getAttribute('data-lat')) || 0;
    const destinoLng = parseFloat(tarjetaActual.getAttribute('data-lng')) || 0;

    let kmCalculados = 0;

    // Cálculo vial con Google Maps Platform (si las coordenadas existen)
    if (window.google && google.maps && google.maps.DistanceMatrixService && destinoLat !== 0) {
        try {
            const service = new google.maps.DistanceMatrixService();
            const response = await service.getDistanceMatrix({
                origins: [{ lat: origenLat, lng: origenLng }],
                destinations: [{ lat: destinoLat, lng: destinoLng }],
                travelMode: google.maps.TravelMode.DRIVING
            });

            if (response.rows[0].elements[0].status === "OK") {
                const metros = response.rows[0].elements[0].distance.value;
                kmCalculados = parseFloat((metros / 1000).toFixed(2));
            }
        } catch (e) {
            console.warn("Error consultando Google Maps Distance Matrix:", e);
        }
    }

    // DTO para la API
    const datosAsignacion = {
        IdHojaRuta: parseInt(idHojaRutaDestino),
        DistanciaTramo: kmCalculados,
        IdEstadoAsignado: 2 // Estado "Asignado"
    };

    try {
        const respuesta = await fetch(`${URL_API_DETALLE}/${idDetalle}/asignar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosAsignacion)
        });

        if (respuesta.ok) {
            // 📡 Transmitimos la actualización por el canal personalizado
            const eventoActualizacion = new CustomEvent("CargaVehiculoActualizada", {
                detail: { idHojaRuta: idHojaRutaDestino }
            });
            document.dispatchEvent(eventoActualizacion);

            Swal.fire({
                icon: 'success',
                title: '¡Tarea Asignada!',
                text: `Distancia calculada: ${kmCalculados} Km`,
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            throw new Error("Fallo de API");
        }
    } catch (err) {
        console.error("Error en asignación:", err);
        
        // Reversión visual ante fallos de conexión o BD
        Swal.fire({
            icon: 'error',
            title: 'Error al Guardar',
            text: 'No se pudo registrar la asignación. Recargando datos reales...'
        }).then(() => {
            CargarTareasPendientes();
            if (window.GetAllHojasRuta) window.GetAllHojasRuta();
        });
    }
}

function GuardarTareaPendiente() {
    const dto = {
        Id_Detalle_HDR: 0,
        Id_HojaRuta: null, // Nulo para que nazca como pendiente
        Id_TipoMovimiento: parseInt($("#dt_id_tipo_mov").val()) || 0,
        Id_RecursoMov: parseInt($("#dt_id_recurso_mov").val()) || 0,
        Id_Origen: parseInt($("#dt_id_origen").val()) || 0,
        Id_TipoMaterial: parseInt($("#dt_id_tipo_material").val()) || 0,
        HoraEstimada: "00:00:00",
        Id_Estado: 1, // 1 = Pendiente
        DistanciaDesdeAnterior_Km: 0
    };

    $.ajax({
        type: "POST",
        url: URL_API_DETALLE,
        data: JSON.stringify(dto),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function () {
            mostrarAlerta("Tarea pendiente creada con éxito.", "success");
            $("#modalDetalle").modal("hide");
            $("#formDetalle")[0].reset();
            CargarTareasPendientes();
        },
        error: function (err) {
            console.error("SITMAS - Error al crear tarea:", err);
            mostrarAlerta("No se pudo crear la tarea.", "danger");
        }
    });
}

function DibujarRutaCompleta(listaParadas) {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({ map: map }); // Tu mapa instanciado

    // 1. Definimos nuestro punto inamovible (La Base)
    const baseEMEC = { lat: -31.466122, lng: -64.127283 };

    // 2. Transformamos nuestra lista de paradas de la BD al formato 'Waypoints' de Google
    const puntosIntermedios = listaParadas.map(parada => {
        return {
            location: { 
                lat: parseFloat(parada.Latitud), 
                lng: parseFloat(parada.Longitud) 
            },
            stopover: true // Indica que el camión frena aquí (escala oficial)
        };
    });

    // 3. Armamos la solicitud mágica (Circuito cerrado)
    const request = {
        origin: baseEMEC,              // 🏁 SALIDA: Planta EMEC
        destination: baseEMEC,         // 🏁 LLEGADA: Planta EMEC
        waypoints: puntosIntermedios,  // 📍 ESCALAS: Todas las tareas
        optimizeWaypoints: false,      // false: respeta el orden en que las arrastraste
        travelMode: google.maps.TravelMode.DRIVING
    };

    // 4. Ejecutamos el trazado
    directionsService.route(request, function (result, status) {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            // Opcional: Aquí podrías sumar la distancia total que devuelve Google
            // result.routes[0].legs.forEach(leg => { ... })
        } else {
            console.error("No se pudo trazar la ruta: " + status);
        }
    });
}










// /* ==========================================================================
//    SITMAS - Módulo: Detalle Hoja de Ruta (Paradas) - Lógica de Interfaz
//    Tecnologías: JavaScript (ES6+), jQuery, AJAX, Bootstrap 5
//    ========================================================================== */

// const URL_API_DETALLE = "https://localhost:44325/api/detallehojaruta";
// const URL_API_HDR_LISTA = "https://localhost:44325/api/hojaruta";

// // Endpoints auxiliares para los Combos
// const URL_API_TIPO_MOV = "https://localhost:44325/api/tipomovimientos";
// const URL_API_RECURSOS = "https://localhost:44325/api/recursosmovilizados";
// const URL_API_ORIGEN = "https://localhost:44325/api/Origen";
// const URL_API_MATERIAL = "https://localhost:44325/api/TP_Material/ListarTodo";
// const URL_API_ESTADO_PARADA = "https://localhost:44325/api/EST_HDR/ListarTodo";

// // 📍 Coordenadas de Referencia Base (Ej: Sede EMEC / Punto de Partida predeterminado)
// const EMEC_LAT = -31.466122;
// const EMEC_LON = -64.127283;

// // Variables globales en memoria para almacenamiento temporal de alto rendimiento
// let listaParadasMemoria = [];
// let listaOrigenesMemoria = []; // Almacena la lista de orígenes con sus coordenadas (Latitud/Longitud)

// $(document).ready(function () {
//     // 1. Cargamos todos los combos de la sección de detalles en paralelo
//     CargarCombosAuxiliaresDetalle();

//     // 2. Único punto de captura del submit del formulario
//     $("#formDetalle").on("submit", function (e) {
//         e.preventDefault();
//         GuardarDetalle(); // Al ser asíncrona, esperará la resolución del ruteo OSRM
//     });
// });

// /* ==========================================================================
//    1. CARGA DE COMBOS AUXILIARES (DESPLEGABLES)
//    ========================================================================== */

// function CargarCombosAuxiliaresDetalle() {
//     return Promise.all([
//         CargarComboHojasRuta(),
//         CargarComboTipoMovimientos(),
//         CargarComboRecursosMov(),
//         CargarComboOrigen(),
//         CargarComboTipoMaterial(),
//         CargarComboEstadoParada()
//     ]).catch(err => {
//         console.error("SITMAS - Error al cargar combos auxiliares de detalles:", err);
//     });
// }

// function CargarComboHojasRuta() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_HDR_LISTA,
//         dataType: "json",
//         success: function (data) {
//             const $select =$("#dt_id_hoja_ruta");
//             if ($select.length === 0) return;

//             $select.empty().append('<option value="">Seleccione Hoja de Ruta</option>');
//             if (Array.isArray(data)) {
//                 data.forEach(item => {
//                     $select.append(`<option value="${item.Id}">N° ${item.Id} - ${item.FechaFormateada || ''} (${item.Vehiculo || ''})</option>`);
//                 });
//             }
//         }
//     });
// }

// function CargarComboTipoMovimientos() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_TIPO_MOV,
//         dataType: "json",
//         success: function (data) {
//             const $select =$("#dt_id_tipo_mov");
//             $select.empty().append('<option value="">Seleccione Tipo de Movimiento</option>');
//             data.forEach(v => {
//                 $select.append(`<option value="${v.IdTipoMovimientos}">${v.IdTipoMovimientos} - ${v.TipoMovimientos}</option>`);
//             });
//         }
//     });
// }

// function CargarComboRecursosMov() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_RECURSOS,
//         dataType: "json",
//         success: function (data) {
//             const $select =$("#dt_id_recurso_mov");
//             $select.empty().append('<option value="">Seleccione recurso</option>');
//             data.forEach(v => {
//                 $select.append(`<option value="${v.IdRecursoMov}">${v.IdRecursoMov} - ${v.Recurso_Movilizado}</option>`);
//             });
//         }
//     });
// }

// function CargarComboOrigen() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_ORIGEN,
//         dataType: "json",
//         success: function (data) {
//             listaOrigenesMemoria = data || []; // 💡 Guardamos los objetos de origen completos (con Lat/Lon) en memoria
//             const $select =$("#dt_id_origen");
//             $select.empty().append('<option value="">Seleccione lugar </option>');
//             data.forEach(v => {
//                 $select.append(`<option value="${v.IdOrigen}">${v.IdOrigen} - ${v.EmpresaInstitucion}</option>`);
//             });
//         }
//     });
// }

// function CargarComboTipoMaterial() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_MATERIAL,
//         dataType: "json",
//         success: function (data) {
//             const $select =$("#dt_id_tipo_material");
//             $select.empty().append('<option value="">Seleccione material</option>');
//             data.forEach(v => {
//                 $select.append(`<option value="${v.IdTipoMaterial}">${v.IdTipoMaterial} - ${v.TipoMaterial}</option>`);
//             });
//         }
//     });
// }

// function CargarComboEstadoParada() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_ESTADO_PARADA,
//         dataType: "json",
//         success: function (data) {
//             const $select =$("#dt_id_estado");
//             $select.empty().append('<option value="">Seleccione Estado</option>');
//             data.forEach(v => {
//                 $select.append(`<option value="${v.Id}">${v.Id} - ${v.EstadoHojaRuta}</option>`);
//             });
//         }
//     });
// }

// /* ==========================================================================
//    2. SELECCIÓN DE HOJA DE RUTA PADRE (DESDE LA TABLA CABECERA)
//    ========================================================================== */

// function GestionarParadas(idHojaRuta) {
//     if (!idHojaRuta || idHojaRuta <= 0) return;

//     $("#hdr_id_seleccionado").val(idHojaRuta);
//     LimpiarFormularioDetalle();

//     // Seteamos la Hoja de Ruta activa en el selector
//     $("#dt_id_hoja_ruta").val(idHojaRuta);

//     $("#seccionDetalle h2").text(`📍 Paradas / Detalles de Hoja de Ruta #${idHojaRuta}`);
//     ObtenerPorHojaRuta(idHojaRuta);

//     $("html, body").animate({ scrollTop: $("#seccionDetalle").offset().top - 50 }, 400);
// }

// /* ==========================================================================
//    3. SERVICIO AUXILIAR DE RUTEO (OSRM API)
//    ========================================================================== */

// /**
//  * Consulta el motor de ruteo OSRM para obtener la distancia vial real entre dos puntos.
//  * Nota: OSRM espera las coordenadas en formato (Longitud, Latitud).
//  */
// async function CalcularDistanciaRuta(latOrigen, lonOrigen, latDestino, lonDestino) {
//     if (!latOrigen || !lonOrigen || !latDestino || !lonDestino) return 0;

//     const urlOSRM = `https://router.project-osrm.org/route/v1/driving/${lonOrigen},${latOrigen};${lonDestino},${latDestino}?overview=false`;

//     try {
//         const respuesta = await fetch(urlOSRM);
//         const datos = await respuesta.json();

//         if (datos.code === "Ok" && datos.routes && datos.routes.length > 0) {
//             // OSRM devuelve la distancia en metros; convertimos a kilómetros con 2 decimales
//             return parseFloat((datos.routes[0].distance / 1000).toFixed(2));
//         }
//     } catch (error) {
//         console.warn("SITMAS - No se pudo conectar con OSRM para calcular la distancia:", error);
//     }
//     return 0;
// }

// /* ==========================================================================
//    4. OPERACIONES CRUD DE DETALLES
//    ========================================================================== */

// function ObtenerPorHojaRuta(idHojaRuta) {
//     $.ajax({
//         type: "GET",
//         url: `${URL_API_DETALLE}/hojaruta/${idHojaRuta}`,
//         dataType: "json",
//         success: function (lista) {
//             listaParadasMemoria = lista || [];
//             const $tbody =$("#tbodyDetallesHDR");
//             $tbody.empty();

//             if (!listaParadasMemoria || listaParadasMemoria.length === 0) {
//                 $tbody.append('<tr><td colspan="9" class="text-center text-muted">No hay paradas registradas para esta Hoja de Ruta.</td></tr>');
//                 return;
//             }

//             listaParadasMemoria.forEach(item => {
//                 const tr = `
//                     <tr>
//                         <td><strong>#${item.Id_Detalle_HDR}</strong></td>
//                         <td><span class="badge bg-secondary">HR #${item.Id_HojaRuta}</span></td>
//                         <td>${item.TipoMovimiento || 'N/A'}</td>
//                         <td>${item.RecursoMovilizado || 'N/A'}</td>
//                         <td>
//                             ${item.Origen || 'N/A'} 
//                             <br>
//                             <small class="text-primary fw-bold">📏 ${item.DistanciaDesdeAnterior_Km || '0'} Km</small>
//                         </td>
//                         <td>${item.TipoMaterial || 'N/A'}</td>
//                         <td><span class="badge bg-info text-dark">${item.HoraEstimadaFormateada || 'N/A'}</span></td>
//                         <td><span class="badge bg-success">${item.EstadoRecorrido || 'Pendiente'}</span></td>
//                         <td class="text-center">
//                             <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarDetalleParaEditar(${item.Id_Detalle_HDR})" title="Editar Parada">
//                                 ✏️
//                             </button>
//                             <button class="btn btn-sm btn-outline-danger" onclick="EliminarDetalle(${item.Id_Detalle_HDR})" title="Borrar Parada">
//                                 🗑️
//                             </button>
//                         </td>
//                     </tr>`;
//                 $tbody.append(tr);
//             });
//         },
//         error: function (err) {
//             console.error("SITMAS - Error al obtener detalles:", err);
//             mostrarAlerta("❌ Error al listar las paradas de la Hoja de Ruta.", "danger");
//         }
//     });
// }

// async function GuardarDetalle() {
//     const idDetalle = $("#dt_id").val();
//     const idHojaRutaPadre = $("#hdr_id_seleccionado").val();
//     const esModificacion = idDetalle && parseInt(idDetalle) > 0;

//     // Permitimos reasignar la parada a otra Hoja de Ruta si el usuario la cambió en el combo
//     const idHojaRutaDestino = parseInt($("#dt_id_hoja_ruta").val()) || parseInt(idHojaRutaPadre);
//     const idOrigenSeleccionado = parseInt($("#dt_id_origen").val()) || 0;

//     if (!idHojaRutaDestino || idHojaRutaDestino <= 0) {
//         mostrarAlerta("Debe seleccionar una Hoja de Ruta válida.", "warning");
//         return;
//     }

//     // ----------------------------------------------------------------------
//     // 🔍 CÁLCULO DE PUNTOS A Y B PARA RUTEO VIAL
//     // ----------------------------------------------------------------------
//     let latAnterior = EMEC_LAT;
//     let lonAnterior = EMEC_LON;

//     // Punto A: Si ya existen paradas cargadas, tomamos las coordenadas de la última registrada
//     if (listaParadasMemoria.length > 0) {
//         const ultimaParada = listaParadasMemoria[listaParadasMemoria.length - 1];
//         if (ultimaParada.Latitud && ultimaParada.Longitud) {
//             latAnterior = parseFloat(ultimaParada.Latitud);
//             lonAnterior = parseFloat(ultimaParada.Longitud);
//         }
//     }

//     // Punto B: Buscamos las coordenadas del origen seleccionado dentro de nuestra memoria caché
//     let latNueva = 0;
//     let lonNueva = 0;
//     if (idOrigenSeleccionado > 0) {
//         const origenElegido = listaOrigenesMemoria.find(o => o.IdOrigen === idOrigenSeleccionado);
//         if (origenElegido && origenElegido.Latitud && origenElegido.Longitud) {
//             latNueva = parseFloat(origenElegido.Latitud);
//             lonNueva = parseFloat(origenElegido.Longitud);
//         }
//     }

//     // Calculamos los kilómetros en tiempo real llamando al motor de mapas
//     let kmCalculados = await CalcularDistanciaRuta(latAnterior, lonAnterior, latNueva, lonNueva);

//     // ----------------------------------------------------------------------
//     // 📦 CONSTRUCCIÓN DEL DTO DE ENVÍO
//     // ----------------------------------------------------------------------
//     const dto = {
//         Id_Detalle_HDR: esModificacion ? parseInt(idDetalle) : 0,
//         Id_HojaRuta: idHojaRutaDestino,
//         Id_TipoMovimiento: parseInt($("#dt_id_tipo_mov").val()) || 0,
//         Id_RecursoMov: parseInt($("#dt_id_recurso_mov").val()) || 0,
//         Id_Origen: idOrigenSeleccionado,
//         Id_TipoMaterial: parseInt($("#dt_id_tipo_material").val()) || 0,
//         HoraEstimada: $("#dt_hora_estimada").val() ? $("#dt_hora_estimada").val() + ":00" : "00:00:00",
//         Id_Estado: parseInt($("#dt_id_estado").val()) || 0,
//         DistanciaDesdeAnterior_Km: kmCalculados
//     };

//     if (dto.Id_TipoMovimiento <= 0) {
//         mostrarAlerta("Debe seleccionar el Tipo de Movimiento.", "warning");
//         return;
//     }

//     const tipoMetodo = esModificacion ? "PUT" : "POST";
//     const urlEndpoint = esModificacion ? `${URL_API_DETALLE}/${idDetalle}` : URL_API_DETALLE;

//     $.ajax({
//         type: tipoMetodo,
//         url: urlEndpoint,
//         data: JSON.stringify(dto),
//         contentType: "application/json; charset=utf-8",
//         dataType: "json",
//         success: function () {
//             const msj = esModificacion 
//                 ? `✅ Parada actualizada correctamente (${kmCalculados} Km calculados).` 
//                 : `✅ Parada agregada con éxito (${kmCalculados} Km calculados).`;
            
//             mostrarAlerta(msj, "success");

//             LimpiarFormularioDetalle();
//             ObtenerPorHojaRuta(idHojaRutaPadre); // Refresco en tiempo real de la hoja actual
//         },
//         error: function (err) {
//             console.error("SITMAS - Error al guardar detalle:", err);
//             mostrarAlerta("❌ No se pudo guardar la parada.", "danger");
//         }
//     });
// }

// function CargarDetalleParaEditar(idDetalle) {
//     const parada = listaParadasMemoria.find(p => p.Id_Detalle_HDR === idDetalle);

//     if (!parada) {
//         mostrarAlerta("No se encontraron los datos de la parada seleccionada.", "error");
//         return;
//     }

//     // Cargar los identificadores exactos mapeados desde el backend
//     $("#dt_id").val(parada.Id_Detalle_HDR);
//     $("#dt_id_hoja_ruta").val(parada.Id_HojaRuta || "");
//     $("#dt_id_tipo_mov").val(parada.Id_TipoMovimiento || "");
//     $("#dt_id_recurso_mov").val(parada.Id_RecursoMov || "");
//     $("#dt_id_origen").val(parada.Id_Origen || "");
//     $("#dt_id_tipo_material").val(parada.Id_TipoMaterial || "");
//     $("#dt_id_estado").val(parada.Id_Estado || "");

//     // Formatear HoraEstimada (HH:MM:SS) a formato HH:MM para <input type="time">
//     if (parada.HoraEstimadaFormateada) {
//         const partesHora = parada.HoraEstimadaFormateada.split(":");
//         if (partesHora.length >= 2) {
//             $("#dt_hora_estimada").val(`${partesHora[0]}:${partesHora[1]}`);
//         }
//     }

//     // Cambiar la apariencia del botón a modo edición
//     $("#btnGuardarDetalle").text("💾 Actualizar Parada").removeClass("btn-primary").addClass("btn-warning");

//     // Desplazamiento suave al formulario
//     $("html, body").animate({ scrollTop: $("#formDetalle").offset().top - 70 }, 300);
// }

// function EliminarDetalle(idDetalle) {
//     const idHojaRutaPadre = $("#hdr_id_seleccionado").val();

//     confirmarAccion(
//         "¿Eliminar Parada?",
//         `⚠️ ¿Está seguro de eliminar la parada #${idDetalle}?`,
//         function () {
//             $.ajax({
//                 type: "DELETE",
//                 url: `${URL_API_DETALLE}/${idDetalle}`,
//                 dataType: "json",
//                 success: function () {
//                     mostrarAlerta(`Parada #${idDetalle} eliminada con éxito.`, "info");

//                     if ($("#dt_id").val() == idDetalle) {
//                         LimpiarFormularioDetalle();
//                     }

//                     ObtenerPorHojaRuta(idHojaRutaPadre);
//                 },
//                 error: function (err) {
//                     console.error("SITMAS - Error al borrar detalle:", err);
//                     mostrarAlerta("No se pudo eliminar la parada seleccionada.", "danger");
//                 }
//             });
//         }
//     );
// }

// function LimpiarFormularioDetalle() {
//     const idHojaRutaActual = $("#hdr_id_seleccionado").val();

//     $("#dt_id").val("0");
//     $("#dt_id_hoja_ruta").val(idHojaRutaActual || "");
//     $("#dt_id_tipo_mov").val("");
//     $("#dt_id_recurso_mov").val("");
//     $("#dt_id_origen").val("");
//     $("#dt_id_tipo_material").val("");
//     $("#dt_hora_estimada").val("");
//     $("#dt_id_estado").val("");

//     $("#btnGuardarDetalle").text("Guardar Parada").removeClass("btn-warning").addClass("btn-primary");
// }

