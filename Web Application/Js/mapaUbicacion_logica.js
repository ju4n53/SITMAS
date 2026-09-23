/* ==========================================================================
   SITMAS - Módulo: Mapa de Ubicación y Paradas Express
   Tecnologías: JavaScript (ES6+), jQuery, AJAX, Leaflet.js, SweetAlert2
   ========================================================================== */

const URL_API_DETALLE_HDR = "https://localhost:44325/api/detallehojaruta";
const URL_API_UBICACION_GEO = "https://localhost:44325/api/ubicaciongeografica";
const URL_API_HDR_LISTA = "https://localhost:44325/api/hojaruta";
const URL_API_TIPO_MOV = "https://localhost:44325/api/tipomovimientos";

let map = null;
let marcadorActual = null;
let capaParadasYRuta = null; // 👈 Grupo para limpiar y redibujar cuando cambie la Hoja de Ruta
// Variable global para el control de enrutamiento
let controlRutaReal = null;

$(document).ready(function () {
    // 1. Inicializar Mapa e Interfaz
    InicializarMapa();
    InicializarModuloMapa();

    // 2. Al cambiar de Hoja de Ruta en el combo, actualizar la tabla resumen
    $("#map_id_hoja_ruta").on("change", function () {
        const idHDR = $(this).val();
        if (idHDR > 0) {
            ObtenerParadasRuta(idHDR);
        } else {
            $("#tbodyParadasMapa").html('<tr><td colspan="4" class="text-center text-muted">Seleccione una Hoja de Ruta para ver sus paradas.</td></tr>');
        }
    });

    // 3. Submit del Formulario
    $("#formParadaMapa").on("submit", function (e) {
        e.preventDefault();
        GuardarParadaDesdeMapa();
    });
});

/* ==========================================================================
   1. INICIALIZACIÓN DEL MAPA LEAFLET
   ========================================================================== */

function InicializarMapa() {
    // Centrar en Córdoba capital
    map = L.map('mapaInteractiveContainer').setView([-31.4167, -64.1833], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap - SITMAS EMEC'
    }).addTo(map);

    // Inicializamos el grupo de elementos dinámicos
    capaParadasYRuta = L.layerGroup().addTo(map);

    // Evento de clic en el mapa
    map.on('click', function (e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // SweetAlert2 para la descripción rápida de WhatsApp / mensaje
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

            $("#map_id_ubicacion_geo").val(idGenerado);
            $("#map_txt_descripcion").val(`${descripcion} (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`);

            // Mover Pin en el mapa
            if (marcadorActual) {
                map.removeLayer(marcadorActual);
            }
            marcadorActual = L.marker([lat, lng]).addTo(map)
                .bindPopup(`<b>${descripcion}</b>`).openPopup();

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
        // Verificar si nos pasaron un idHojaRuta por querystring (ej: mapa_ubicacion.html?idHDR=5)
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
            const $select = $("#map_id_hoja_ruta");
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
        url: URL_API_TIPO_MOV,
        dataType: "json",
        success: function (data) {
            const $select = $("#map_id_tipo_mov");
            $select.empty().append('<option value="">Seleccione Tipo Movimiento</option>');
            if (Array.isArray(data)) {
                data.forEach(v => {
                    $select.append(`<option value="${v.IdTipoMovimientos}">${v.TipoMovimientos}</option>`);
                });
            }
        }
    });
}

function ObtenerParadasRuta(idHojaRuta) {
    $.ajax({
        type: "GET",
        url: `${URL_API_DETALLE_HDR}/hojaruta/${idHojaRuta}`,
        dataType: "json",
        success: function (lista) {
            const $tbody =$("#tbodyParadasMapa");
            $tbody.empty();

            // 1. Limpiamos pines y líneas previas del grupo de capas
            if (capaParadasYRuta) {
                capaParadasYRuta.clearLayers();
            }

            // Limpiamos el control de enrutamiento previo si existía
            if (controlRutaReal) {
                map.removeControl(controlRutaReal);
                controlRutaReal = null;
            }

            if (!lista || lista.length === 0) {
                $tbody.append('<tr><td colspan="4" class="text-center text-muted">No hay paradas asociadas a esta Hoja de Ruta.</td></tr>');
                return;
            }

            const arregloWaypoints = [];

            // 2. Iteramos las paradas recuperadas de la API
            lista.forEach((item, index) => {
                // A) Llenar fila en la tabla
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

                // B) Verificación de coordenadas
                if (item.Latitud !== null && item.Longitud !== null && item.Latitud !== undefined && item.Longitud !== undefined) {
                    const lat = parseFloat(item.Latitud);
                    const lng = parseFloat(item.Longitud);

                    if (!isNaN(lat) && !isNaN(lng)) {
                        // Creamos un objeto L.latLng para Leaflet Routing Machine
                        const puntoGeo = L.latLng(lat, lng);
                        arregloWaypoints.push(puntoGeo);

                        // Marcador individual
                        const marcador = L.marker([lat, lng]).bindPopup(`
                            <div class="text-center">
                                <b>Parada #${index + 1}</b><br>
                                <span>${item.TipoMovimiento || 'Retiro'}</span><br>
                                <small class="text-muted">Hora: ${item.HoraEstimadaFormateada || ''}</small>
                            </div>
                        `);

                        capaParadasYRuta.addLayer(marcador);
                    }
                }
            });

            // 3. 🚗 Trazado de RUTA REAL por calles con OSRM / Leaflet Routing Machine
            if (arregloWaypoints.length >= 2) {
                controlRutaReal = L.Routing.control({
                    waypoints: arregloWaypoints,
                    router: L.Routing.osrmv1({
                        serviceUrl: 'https://router.project-osrm.org/route/v1',
                        profile: 'driving' // Rutas aptas para vehículos
                    }),
                    lineOptions: {
                        styles: [{ color: '#78BE20', weight: 6, opacity: 0.8 }] // Verde EMEC
                    },
                    createMarker: function() { return null; }, // Ocultamos los marcadores duplicados del plugin para conservar los nuestros
                    addWaypoints: false,      // Desactiva que el usuario agregue puntos arrastrando la línea
                    draggableWaypoints: false,// Desactiva arrastrar paradas
                    fitSelectedRoutes: true,  // Ajusta el zoom automáticamente para ver toda la ruta
                    show: false               // Oculta la caja flotante de itinerario/instrucciones giro a giro
                }).addTo(map);
            } else if (arregloWaypoints.length === 1) {
                // Si hay solo 1 punto, centramos el mapa en él
                map.setView(arregloWaypoints[0], 14);
            }
        },
        error: function (err) {
            console.error("Error al obtener paradas de la hoja de ruta:", err);
        }
    });
}

/* ==========================================================================
   3. GUARDAR Y RESETEAR
   ========================================================================== */

function GuardarParadaDesdeMapa() {
    const idHojaRuta = parseInt($("#map_id_hoja_ruta").val()) || 0;
    const idUbicacionGeo = parseInt($("#map_id_ubicacion_geo").val()) || 0;
    const idTipoMov = parseInt($("#map_id_tipo_mov").val()) || 0;
    const hora = $("#map_hora_estimada").val();

    if (idHojaRuta <= 0) {
        mostrarAlerta("⚠️ Seleccione una Hoja de Ruta válida.", "warning");
        return;
    }

    if (idUbicacionGeo <= 0) {
        mostrarAlerta("⚠️ Haga clic en el mapa para marcar el lugar de la parada.", "warning");
        return;
    }

    const dto = {
        Id_Detalle_HDR: 0,
        Id_HojaRuta: idHojaRuta,
        Id_TipoMovimiento: idTipoMov > 0 ? idTipoMov : 1,
        Id_RecursoMov: 0,
        Id_Origen: 0,
        Id_Ubicacion: idUbicacionGeo,
        HoraEstimada: hora ? hora + ":00" : "00:00:00",
        Id_Estado: 1
    };

    $.ajax({
        type: "POST",
        url: URL_API_DETALLE_HDR,
        data: JSON.stringify(dto),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function () {
            mostrarAlerta("✅ Parada añadida correctamente a la Hoja de Ruta.", "success");
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
        map.removeLayer(marcadorActual);
    }
}