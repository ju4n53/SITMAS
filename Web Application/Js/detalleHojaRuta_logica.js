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
        CargarComboTipoMovimiento(),
        CargarComboOrigen(),
        CargarComboTipoMaterial(),
        CargarComboRecursosMov()
    ]);
}

function CargarComboTipoMovimiento() {
    return $.ajax({
        type: "GET",
        url: URL_API_TIPO_MOV,
        dataType: "json",
        success: function (data) {
            const $select = $("#dt_id_tipo_mov");
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
            const $select = $("#dt_id_origen");
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
            const $select = $("#dt_id_tipo_material");
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
            const $select = $("#dt_id_recurso_mov");
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
            const $contenedor = $("#zonaPendientes");
            $contenedor.empty(); $("#cntPendientes").text(lista ? lista.length : 0);

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
            const $dropzone = $(`#hdr-drop-${idHojaRuta}`);
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

        // 1. Buscamos el token (localStorage)
        let sesionActual = JSON.parse(localStorage.getItem('usuarioSesion'));
        let token = sesionActual ? sesionActual.token : "";

        // 2. Ejecutamos el fetch, pero ahora le pasamos la autorización
        const respuesta = await fetch(`${URL_API_DETALLE}/${idDetalle}/asignar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token //mostramos la autorización
            },
            body: JSON.stringify(datosAsignacion)
        });

        // const respuesta = await fetch(`${URL_API_DETALLE}/${idDetalle}/asignar`, {
        //     method: 'PATCH',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(datosAsignacion)
        // });

        if (respuesta.ok) {
            // 📡 Transmitimos la actualización por el canal personalizado
            const eventoActualizacion = new CustomEvent("CargaVehiculoActualizada", {
                detail: { idHojaRuta: idHojaRutaDestino }
            });
            document.dispatchEvent(eventoActualizacion);

            CargarTareasPendientes();

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


