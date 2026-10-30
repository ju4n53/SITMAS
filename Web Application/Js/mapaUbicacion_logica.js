/* ==========================================================================
   SITMAS - Módulo: Mapa de Ubicación y Paradas Express
   Tecnologías: JavaScript (ES6+), jQuery, AJAX, Google Maps API, SweetAlert2
   ========================================================================== */

const URL_API_DETALLE_HDR = "https://localhost:44325/api/detallehojaruta";
const URL_API_UBICACION_GEO = "https://localhost:44325/api/ubicaciongeografica";
const URL_API_HDR_LISTA = "https://localhost:44325/api/hojaruta";
const URL_API_TIPO_MOVI = "https://localhost:44325/api/tipomovimientos";

// 📍 Coordenada base predeterminada (Sede EMEC)
const EMEC_BASE = { lat: -31.465829, lng: -64.127313 };

// Variables de estado del Mapa Google
let map = null;
let marcadorActual = null;
let marcadoresRuta = []; // Arreglo para acumular y limpiar los pines de paradas
let marcadorBaseEMEC = null; // Pin especial para la Planta EMEC
let directionsService = null; // Motor de ruteo Google
let directionsRenderer = null; // Dibujante de polígonos/ruta Google

// Memory global
let listaParadasActualesMapa = [];
let coordenadaTemporalClick = null;

$(document).ready(function () {
    // 1. Inicializar Mapa e Interfaz
    // InicializarMapa();
    CargarGoogleMapsSDK(() => {
        InicializarMapa();
    });
    InicializarModuloMapa();

    // 2. Al cambiar de Hoja de Ruta en el combo, actualizar la tabla resumen y el mapa
    $("#map_id_hoja_ruta").on("change", function () {
        const idHDR = $(this).val();
        if (idHDR > 0) {
            ObtenerParadasRuta(idHDR);
        } else {
            $("#tbodyParadasMapa").html('<tr><td colspan="4" class="text-center text-muted">Seleccione una Hoja de Ruta para ver sus paradas.</td></tr>');
            LimpiarMapaYRuta();
        }
    });

    // 3. Submit del Formulario
    $("#formParadaMapa").on("submit", function (e) {
        e.preventDefault();
        GuardarParadaDesdeMapa();
    });
});

/* ==========================================================================
   1. INICIALIZACIÓN DEL MAPA GOOGLE
   ========================================================================== */

function InicializarMapa() {
    map = new google.maps.Map(document.getElementById('mapaInteractiveContainer'), {
        center: EMEC_BASE,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true, // Manejamos nuestros propios marcadores personalizados
        polylineOptions: { strokeColor: '#78BE20', strokeWeight: 6, strokeOpacity: 0.8 } // Verde EMEC
    });

    // Capturar clics para obtener coordenadas GPS
    map.addListener('click', function (e) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        Swal.fire({
            title: '📍 Nueva Parada Espontánea',
            text: 'Ingrese una breve referencia de este retiro:',
            input: 'text',
            inputPlaceholder: 'Ej: Retiro en la esquina Av. Colón y Cañada',
            showCancelButton: true,
            confirmButtonColor: '#78BE20',
            confirmButtonText: 'Confirmar Punto',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) {
                    return '¡Debe ingresar una referencia para la parada!';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const descripcion = result.value;
                RegistrarCoordenadaGPS(descripcion, lat, lng);
            }
        });
    });
}

function RegistrarCoordenadaGPS(descripcion, lat, lng) {
    const dtoGeo = {
        IdUbicacion: 0,
        Descripcion: descripcion,
        Latitud: lat,
        Longitud: lng,
        Id_Origen: 0
    };

    $.ajax({
        type: "POST",
        url: URL_API_UBICACION_GEO,
        data: JSON.stringify(dtoGeo),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (res) {
            const idGenerado = res.IdUbicacionGenerado || res.idUbicacionGenerado;

            coordenadaTemporalClick = { lat: lat, lng: lng };

            $("#map_id_ubicacion_geo").val(idGenerado);
            $("#map_txt_descripcion").val(`${descripcion} (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`);

            if (marcadorActual) {
                marcadorActual.setMap(null);
            }

            marcadorActual = new google.maps.Marker({
                position: { lat: lat, lng: lng },
                map: map,
                title: descripcion
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `<b>${descripcion}</b>`
            });
            infoWindow.open(map, marcadorActual);

            marcadorActual.addListener('click', () => {
                infoWindow.open(map, marcadorActual);
            });

            mostrarAlerta("📍 Punto GPS registrado en memoria.", "success");
        },
        error: function (err) {
            console.error("SITMAS - Error al registrar GPS:", err);
            mostrarAlerta("❌ No se pudo guardar la coordenada en la base de datos.", "danger");
        }
    });
}

/* ==========================================================================
   2. CARGA DE COMBOS Y PARAMETROS DE URL
   ========================================================================== */

function InicializarModuloMapa() {
    Promise.all([
        CargarComboHojasRuta(),
        CargarComboTipoMovimientos()
    ]).then(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const idHDRUrl = urlParams.get('idHDR');
        if (idHDRUrl) {
            $("#map_id_hoja_ruta").val(idHDRUrl).trigger("change");
        }
    }).catch(err => {
        console.error("SITMAS - Error al cargar datos auxiliares:", err);
    });
}

function CargarComboHojasRuta() {
    return $.ajax({
        type: "GET",
        url: URL_API_HDR_LISTA,
        dataType: "json",
        success: function (data) {
            const $select =$("#map_id_hoja_ruta");
            $select.empty().append('<option value="">Seleccione Hoja de Ruta...</option>');
            if (Array.isArray(data)) {
                data.forEach(item => {
                    $select.append(`<option value="${item.Id}">N° ${item.Id} - ${item.FechaFormateada || ''} (${item.Vehiculo || ''})</option>`);
                });
            }
        }
    });
}

function CargarComboTipoMovimientos() {
    return $.ajax({
        type: "GET",
        url: URL_API_TIPO_MOVI,
        dataType: "json",
        success: function (data) {
            const $select =$("#map_id_tipo_mov");
            $select.empty().append('<option value="">Seleccione Tipo Movimiento</option>');
            if (Array.isArray(data)) {
                data.forEach(v => {
                    $select.append(`<option value="${v.IdTipoMovimientos}">${v.TipoMovimientos}</option>`);
                });
            }
        }
    });
}

/* ==========================================================================
   3. DIBUJO DE RUTA CIRCUITO CERRADO (BASE ➔ PARADAS ➔ BASE) Y CÁLCULO TOTAL
   ========================================================================== */

function ObtenerParadasRuta(idHojaRuta) {
    $.ajax({
        type: "GET",
        url: `${URL_API_DETALLE_HDR}/hojaruta/${idHojaRuta}`,
        dataType: "json",
        success: function (lista) {
            listaParadasActualesMapa = lista || [];

            const $tbody =$("#tbodyParadasMapa");
            $tbody.empty();

            LimpiarMapaYRuta();

            // 📍 1. Colocar Pin especial de Salida / Llegada (Planta EMEC)
            marcadorBaseEMEC = new google.maps.Marker({
                position: EMEC_BASE,
                map: map,
                title: "Planta Base EMEC (Inicio / Fin)",
                icon: {
                    url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                }
            });

            if (!lista || lista.length === 0) {
                $tbody.append('<tr><td colspan="4" class="text-center text-muted">No hay paradas asociadas a esta Hoja de Ruta.</td></tr>');
                GuardarDistanciaTotalEnBD(idHojaRuta, 0);
                return;
            }

            const waypointsIntermedios = [];

            // 2. Llenar la tabla y armar marcadores de paradas
            lista.forEach((item, index) => {
                const tr = `
                    <tr>
                        <td><small class="fw-bold">${item.HoraEstimadaFormateada || 'N/A'}</small></td>
                        <td>${item.TipoMovimiento || 'General'}</td>
                        <td>${item.Origen || 'Punto en Mapa'}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-danger" onclick="EliminarParadaExpress(${item.Id_Detalle_HDR})">
                                🗑️
                            </button>
                        </td>
                    </tr>`;
                $tbody.append(tr);

                if (item.Latitud !== null && item.Longitud !== null && item.Latitud !== undefined && item.Longitud !== undefined) {
                    const lat = parseFloat(item.Latitud);
                    const lng = parseFloat(item.Longitud);

                    if (!isNaN(lat) && !isNaN(lng)) {
                        const posicionLatLng = { lat: lat, lng: lng };

                        waypointsIntermedios.push({
                            location: posicionLatLng,
                            stopover: true
                        });

                        const marcador = new google.maps.Marker({
                            position: posicionLatLng,
                            map: map,
                            title: `Parada #${index + 1}`
                        });

                        const infoHtml = `
                            <div class="text-center" style="color: #333; font-family: sans-serif;">
                                <b style="color:#78BE20;">Parada #${index + 1}</b><br>
                                <span>${item.TipoMovimiento || 'Retiro'}</span><br>
                                <small class="text-muted">Hora: ${item.HoraEstimadaFormateada || ''}</small>
                            </div>`;
                        const infoWindow = new google.maps.InfoWindow({ content: infoHtml });

                        marcador.addListener('click', () => {
                            infoWindow.open(map, marcador);
                        });

                        marcadoresRuta.push(marcador);
                    }
                }
            });

            // 🔄 3. Trazar Circuito Cerrado: Origen (Base) ➔ Waypoints ➔ Destino (Base)
            const peticionCircuito = {
                origin: EMEC_BASE,
                destination: EMEC_BASE,
                waypoints: waypointsIntermedios,
                optimizeWaypoints: false, // Respeta el orden de las paradas de la Hoja de Ruta
                travelMode: google.maps.TravelMode.DRIVING
            };

            directionsService.route(peticionCircuito, function (resultado, estado) {
                if (estado === google.maps.DirectionsStatus.OK) {
                    directionsRenderer.setDirections(resultado);

                    // 📏 4. Calcular el Gran Total sumando todos los tramos
                    let totalMetros = 0;
                    const legs = resultado.routes[0].legs;
                    legs.forEach(leg => {
                        totalMetros += leg.distance.value;
                    });

                    const totalKm = parseFloat((totalMetros / 1000).toFixed(2));
                    console.log(`🛣️ Circuito cerrado calculado: ${totalKm} Km total.`);

                    // 💾 5. Guardar el Gran Total en la Base de Datos
                    GuardarDistanciaTotalEnBD(idHojaRuta, totalKm);

                } else {
                    console.error("SITMAS - Error al calcular circuito en Google Maps: " + estado);
                }
            });
        },
        error: function (err) {
            console.error("Error al obtener paradas de la hoja de ruta:", err);
        }
    });
}

/**
 * Enviamos la distancia total calculada hacia la API para impactar la cabecera
 */
async function GuardarDistanciaTotalEnBD(idHojaRuta, totalKm) {
    try {
        await $.ajax({
            type: "PATCH",
            url: `${URL_API_HDR_LISTA}/${idHojaRuta}/distanciatotal`,
            data: JSON.stringify({ DistanciaTotal: totalKm }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
        console.log(`✅ Distancia total de HDR #${idHojaRuta} actualizada a ${totalKm} Km.`);
    } catch (err) {
        console.error("SITMAS - Error al guardar la distancia total:", err);
    }
}

function LimpiarMapaYRuta() {
    if (marcadoresRuta && marcadoresRuta.length > 0) {
        marcadoresRuta.forEach(m => m.setMap(null));
        marcadoresRuta = [];
    }
    if (marcadorBaseEMEC) {
        marcadorBaseEMEC.setMap(null);
        marcadorBaseEMEC = null;
    }
    if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
    }
}

/* ==========================================================================
   4. GUARDAR Y RESETEAR
   ========================================================================== */

async function GuardarParadaDesdeMapa() {
    const idHojaRuta = parseInt($("#map_id_hoja_ruta").val()) || 0;
    const idUbicacionGeo = parseInt($("#map_id_ubicacion_geo").val()) || 0;
    const idTipoMov = parseInt($("#map_id_tipo_mov").val()) || 0;
    const hora = $("#map_hora_estimada").val();

    if (idHojaRuta <= 0) {
        mostrarAlerta("⚠️ Seleccione una Hoja de Ruta válida.", "warning");
        return;
    }

    if (idUbicacionGeo <= 0 || !coordenadaTemporalClick) {
        mostrarAlerta("⚠️ Haga clic en el mapa para marcar el lugar de la parada.", "warning");
        return;
    }

    let puntoOrigenTramo = EMEC_BASE;

    if (listaParadasActualesMapa && listaParadasActualesMapa.length > 0) {
        const ultimaParada = listaParadasActualesMapa[listaParadasActualesMapa.length - 1];
        if (ultimaParada.Latitud && ultimaParada.Longitud) {
            puntoOrigenTramo = {
                lat: parseFloat(ultimaParada.Latitud),
                lng: parseFloat(ultimaParada.Longitud)
            };
        }
    }

    const puntoDestinoTramo = coordenadaTemporalClick;
    const kmCalculados = await CalcularDistanciaTramoGoogle(puntoOrigenTramo, puntoDestinoTramo);

    const dto = {
        Id_Detalle_HDR: 0,
        Id_HojaRuta: idHojaRuta,
        Id_TipoMovimiento: idTipoMov > 0 ? idTipoMov : 1,
        Id_RecursoMov: 0,
        Id_Origen: 0,
        Id_Ubicacion: idUbicacionGeo,
        HoraEstimada: hora ? hora + ":00" : "00:00:00",
        Id_Estado: 1,
        DistanciaDesdeAnterior_Km: kmCalculados
    };

    $.ajax({
        type: "POST",
        url: URL_API_DETALLE_HDR,
        data: JSON.stringify(dto),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function () {
            mostrarAlerta(`✅ Parada añadida correctamente (${kmCalculados} Km en este tramo).`, "success");
            ResetearFormularioMapa();
            ObtenerParadasRuta(idHojaRuta);
        },
        error: function (err) {
            console.error("SITMAS - Error al asociar parada:", err);
            mostrarAlerta("❌ No se pudo guardar la parada.", "danger");
        }
    });
}

function EliminarParadaExpress(idDetalle) {
    const idHojaRuta = $("#map_id_hoja_ruta").val();
    confirmarAccion(
        "¿Eliminar Parada?",
        "Se borrará esta parada de la Hoja de Ruta.",
        function () {
            $.ajax({
                type: "DELETE",
                url: `${URL_API_DETALLE_HDR}/${idDetalle}`,
                dataType: "json",
                success: function () {
                    mostrarAlerta("Parada eliminada.", "info");
                    ObtenerParadasRuta(idHojaRuta);
                }
            });
        }
    );
}

function ResetearFormularioMapa() {
    $("#map_id_ubicacion_geo").val("0");
    $("#map_txt_descripcion").val("");
    $("#map_hora_estimada").val("");
    if (marcadorActual) {
        marcadorActual.setMap(null);
    }
}

async function CalcularDistanciaTramoGoogle(origen, destino) {
    if (!origen || !destino || !origen.lat || !destino.lat) return 0;

    const service = new google.maps.DistanceMatrixService();

    return new Promise((resolve) => {
        service.getDistanceMatrix({
            origins: [origen],
            destinations: [destino],
            travelMode: google.maps.TravelMode.DRIVING
        }, (response, status) => {
            if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
                const metros = response.rows[0].elements[0].distance.value;
                const kilometros = parseFloat((metros / 1000).toFixed(2));
                resolve(kilometros);
            } else {
                console.warn("SITMAS - No se pudo calcular la distancia del tramo con Google:", status);
                resolve(0);
            }
        });
    });
}
