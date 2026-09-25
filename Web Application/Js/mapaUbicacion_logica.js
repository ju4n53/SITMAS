/* ==========================================================================
   SITMAS - Módulo: Mapa de Ubicación y Paradas Express
   Tecnologías: JavaScript (ES6+), jQuery, AJAX, Google Maps API, SweetAlert2
   ========================================================================== */

const URL_API_DETALLE_HDR = "https://localhost:44325/api/detallehojaruta";
const URL_API_UBICACION_GEO = "https://localhost:44325/api/ubicaciongeografica";
const URL_API_HDR_LISTA = "https://localhost:44325/api/hojaruta";
const URL_API_TIPO_MOV = "https://localhost:44325/api/tipomovimientos";

// Variables de estado del Mapa Google
let map = null;
let marcadorActual = null;
let marcadoresRuta = []; // Arreglo para acumular y limpiar los pines de paradas
let directionsService = null; // Motor de ruteo Google
let directionsRenderer = null; // Dibujante de polígonos/ruta Google

$(document).ready(function () {
    // 1. Inicializar Mapa e Interfaz
    InicializarMapa();
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
    const cordobaCenter = { lat: -31.4167, lng: -64.1833 };

    map = new google.maps.Map(document.getElementById('mapaInteractiveContainer'), {
        center: cordobaCenter,
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

            $("#map_id_ubicacion_geo").val(idGenerado);
            $("#map_txt_descripcion").val(`${descripcion} (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`);

            // Mover Pin en el mapa de Google
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
        url: URL_API_TIPO_MOV,
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

function ObtenerParadasRuta(idHojaRuta) {
    $.ajax({
        type: "GET",
        url: `${URL_API_DETALLE_HDR}/hojaruta/${idHojaRuta}`,
        dataType: "json",
        success: function (lista) {
            const $tbody =$("#tbodyParadasMapa");
            $tbody.empty();

            // 1. Limpiamos pines y trazos de rutas anteriores
            LimpiarMapaYRuta();

            if (!lista || lista.length === 0) {
                $tbody.append('<tr><td colspan="4" class="text-center text-muted">No hay paradas asociadas a esta Hoja de Ruta.</td></tr>');
                return;
            }

            const arregloWaypoints = [];

            // 2. Iteramos las paradas recuperadas
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

                // B) Procesar coordenadas
                if (item.Latitud !== null && item.Longitud !== null && item.Latitud !== undefined && item.Longitud !== undefined) {
                    const lat = parseFloat(item.Latitud);
                    const lng = parseFloat(item.Longitud);

                    if (!isNaN(lat) && !isNaN(lng)) {
                        const posicionLatLng = { lat: lat, lng: lng };
                        arregloWaypoints.push(posicionLatLng);

                        // Crear marcador de Google
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
                            </div>
                        `;
                        const infoWindow = new google.maps.InfoWindow({ content: infoHtml });

                        marcador.addListener('click', () => {
                            infoWindow.open(map, marcador);
                        });

                        marcadoresRuta.push(marcador);
                    }
                }
            });

            // 3. Trazado de ruta vial con Google Directions API
            if (arregloWaypoints.length >= 2) {
                const origen = arregloWaypoints[0];
                const destino = arregloWaypoints[arregloWaypoints.length - 1];
                
                const waypointsIntermedios = [];
                for (let i = 1; i < arregloWaypoints.length - 1; i++) {
                    waypointsIntermedios.push({
                        location: arregloWaypoints[i],
                        stopover: true
                    });
                }

                const peticionRuta = {
                    origin: origen,
                    destination: destino,
                    waypoints: waypointsIntermedios,
                    travelMode: google.maps.TravelMode.DRIVING
                };

                directionsService.route(peticionRuta, function(resultado, estado) {
                    if (estado === google.maps.DirectionsStatus.OK) {
                        directionsRenderer.setDirections(resultado);
                    } else {
                        console.error("SITMAS - Error calculando ruta en Google Maps: " + estado);
                    }
                });

            } else if (arregloWaypoints.length === 1) {
                map.panTo(arregloWaypoints[0]);
                map.setZoom(15);
            }
        },
        error: function (err) {
            console.error("Error al obtener paradas de la hoja de ruta:", err);
        }
    });
}

function LimpiarMapaYRuta() {
    if (marcadoresRuta && marcadoresRuta.length > 0) {
        marcadoresRuta.forEach(m => m.setMap(null));
        marcadoresRuta = [];
    }
    if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
    }
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
        marcadorActual.setMap(null);
    }
}


// /* ==========================================================================
//    SITMAS - Módulo: Mapa de Ubicación y Paradas Express
//    Tecnologías: JavaScript (ES6+), jQuery, AJAX, Leaflet.js, SweetAlert2
//    ========================================================================== */

// const URL_API_DETALLE_HDR = "https://localhost:44325/api/detallehojaruta";
// const URL_API_UBICACION_GEO = "https://localhost:44325/api/ubicaciongeografica";
// const URL_API_HDR_LISTA = "https://localhost:44325/api/hojaruta";
// const URL_API_TIPO_MOV = "https://localhost:44325/api/tipomovimientos";

// let map = null;
// let marcadorActual = null;
// let capaParadasYRuta = null; // 👈 Grupo para limpiar y redibujar cuando cambie la Hoja de Ruta
// // Variable global para el control de enrutamiento
// let controlRutaReal = null;

// $(document).ready(function () {
//     // 1. Inicializar Mapa e Interfaz
//     InicializarMapa();
//     InicializarModuloMapa();

//     // 2. Al cambiar de Hoja de Ruta en el combo, actualizar la tabla resumen
//     $("#map_id_hoja_ruta").on("change", function () {
//         const idHDR = $(this).val();
//         if (idHDR > 0) {
//             ObtenerParadasRuta(idHDR);
//         } else {
//             $("#tbodyParadasMapa").html('<tr><td colspan="4" class="text-center text-muted">Seleccione una Hoja de Ruta para ver sus paradas.</td></tr>');
//         }
//     });

//     // 3. Submit del Formulario
//     $("#formParadaMapa").on("submit", function (e) {
//         e.preventDefault();
//         GuardarParadaDesdeMapa();
//     });
// });

// /* ==========================================================================
//    1. INICIALIZACIÓN DEL MAPA LEAFLET
//    ========================================================================== */

// function InicializarMapa() {
//     // Centrar en Córdoba capital
//     map = L.map('mapaInteractiveContainer').setView([-31.4167, -64.1833], 13);

//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         attribution: '© OpenStreetMap - SITMAS EMEC'
//     }).addTo(map);

//     // Inicializamos el grupo de elementos dinámicos
//     capaParadasYRuta = L.layerGroup().addTo(map);

//     // Evento de clic en el mapa
//     map.on('click', function (e) {
//         const lat = e.latlng.lat;
//         const lng = e.latlng.lng;

//         // SweetAlert2 para la descripción rápida de WhatsApp / mensaje
//         Swal.fire({
//             title: '📍 Nueva Parada Espontánea',
//             text: 'Ingrese una breve referencia de este retiro:',
//             input: 'text',
//             inputPlaceholder: 'Ej: Retiro en la esquina Av. Colón y Cañada',
//             showCancelButton: true,
//             confirmButtonColor: '#78BE20',
//             confirmButtonText: 'Confirmar Punto',
//             cancelButtonText: 'Cancelar',
//             inputValidator: (value) => {
//                 if (!value) {
//                     return '¡Debe ingresar una referencia para la parada!';
//                 }
//             }
//         }).then((result) => {
//             if (result.isConfirmed) {
//                 const descripcion = result.value;
//                 RegistrarCoordenadaGPS(descripcion, lat, lng);
//             }
//         });
//     });
// }

// function RegistrarCoordenadaGPS(descripcion, lat, lng) {
//     const dtoGeo = {
//         IdUbicacion: 0,
//         Descripcion: descripcion,
//         Latitud: lat,
//         Longitud: lng,
//         Id_Origen: 0
//     };

//     $.ajax({
//         type: "POST",
//         url: URL_API_UBICACION_GEO,
//         data: JSON.stringify(dtoGeo),
//         contentType: "application/json; charset=utf-8",
//         dataType: "json",
//         success: function (res) {
//             const idGenerado = res.IdUbicacionGenerado || res.idUbicacionGenerado;

//             $("#map_id_ubicacion_geo").val(idGenerado);
//             $("#map_txt_descripcion").val(`${descripcion} (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`);

//             // Mover Pin en el mapa
//             if (marcadorActual) {
//                 map.removeLayer(marcadorActual);
//             }
//             marcadorActual = L.marker([lat, lng]).addTo(map)
//                 .bindPopup(`<b>${descripcion}</b>`).openPopup();

//             mostrarAlerta("📍 Punto GPS registrado en memoria.", "success");
//         },
//         error: function (err) {
//             console.error("SITMAS - Error al registrar GPS:", err);
//             mostrarAlerta("❌ No se pudo guardar la coordenada en la base de datos.", "danger");
//         }
//     });
// }

// /* ==========================================================================
//    2. CARGA DE COMBOS Y PARAMETROS DE URL
//    ========================================================================== */

// function InicializarModuloMapa() {
//     Promise.all([
//         CargarComboHojasRuta(),
//         CargarComboTipoMovimientos()
//     ]).then(() => {
//         // Verificar si nos pasaron un idHojaRuta por querystring (ej: mapa_ubicacion.html?idHDR=5)
//         const urlParams = new URLSearchParams(window.location.search);
//         const idHDRUrl = urlParams.get('idHDR');
//         if (idHDRUrl) {
//             $("#map_id_hoja_ruta").val(idHDRUrl).trigger("change");
//         }
//     }).catch(err => {
//         console.error("SITMAS - Error al cargar datos auxiliares:", err);
//     });
// }

// function CargarComboHojasRuta() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_HDR_LISTA,
//         dataType: "json",
//         success: function (data) {
//             const $select = $("#map_id_hoja_ruta");
//             $select.empty().append('<option value="">Seleccione Hoja de Ruta...</option>');
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
//             const $select = $("#map_id_tipo_mov");
//             $select.empty().append('<option value="">Seleccione Tipo Movimiento</option>');
//             if (Array.isArray(data)) {
//                 data.forEach(v => {
//                     $select.append(`<option value="${v.IdTipoMovimientos}">${v.TipoMovimientos}</option>`);
//                 });
//             }
//         }
//     });
// }

// function ObtenerParadasRuta(idHojaRuta) {
//     $.ajax({
//         type: "GET",
//         url: `${URL_API_DETALLE_HDR}/hojaruta/${idHojaRuta}`,
//         dataType: "json",
//         success: function (lista) {
//             const $tbody =$("#tbodyParadasMapa");
//             $tbody.empty();

//             // 1. Limpiamos pines y líneas previas del mapa
//             if (capaParadasYRuta) {
//                 capaParadasYRuta.clearLayers();
//             }

//             if (!lista || lista.length === 0) {
//                 $tbody.append('<tr><td colspan="4" class="text-center text-muted">No hay paradas asociadas a esta Hoja de Ruta.</td></tr>');
//                 return;
//             }

//             const arregloCoordenadas = [];

//             // 2. Iteramos las paradas recuperadas de la API
//             lista.forEach((item, index) => {
//                 // A) Llenar fila en la tabla
//                 const tr = `
//                     <tr>
//                         <td><small class="fw-bold">${item.HoraEstimadaFormateada || 'N/A'}</small></td>
//                         <td>${item.TipoMovimiento || 'General'}</td>
//                         <td>${item.Origen || 'Punto en Mapa'}</td>
//                         <td class="text-center">
//                             <button class="btn btn-sm btn-outline-danger" onclick="EliminarParadaExpress(${item.Id_Detalle_HDR})">
//                                 🗑️
//                             </button>
//                         </td>
//                     </tr>`;
//                 $tbody.append(tr);

//                 // B) Verificación robusta de coordenadas para Leaflet
//                 if (item.Latitud !== null && item.Longitud !== null && item.Latitud !== undefined && item.Longitud !== undefined) {
//                     const lat = parseFloat(item.Latitud);
//                     const lng = parseFloat(item.Longitud);

//                     // Validamos que sean números válidos (no NaN)
//                     if (!isNaN(lat) && !isNaN(lng)) {
//                         arregloCoordenadas.push([lat, lng]);

//                         // Crear marcador para la parada
//                         const marcador = L.marker([lat, lng]).bindPopup(`
//                             <div class="text-center">
//                                 <b>Parada #${index + 1}</b><br>
//                                 <span>${item.TipoMovimiento || 'Retiro'}</span><br>
//                                 <small class="text-muted">Hora: ${item.HoraEstimadaFormateada || ''}</small>
//                             </div>
//                         `);

//                         // Agregar marcador al grupo de capas
//                         capaParadasYRuta.addLayer(marcador);
//                     }
//                 }
//             });

//             // 3. Trazado de ruta y ajuste de vista
//             if (arregloCoordenadas.length > 0) {
//                 if (arregloCoordenadas.length >= 2) {
//                     const lineaRuta = L.polyline(arregloCoordenadas, {
//                         color: '#78BE20', // Verde EMEC
//                         weight: 4,
//                         opacity: 0.8,
//                         dashArray: '8, 8'
//                     });
//                     capaParadasYRuta.addLayer(lineaRuta);
//                 }

//                 // Ajustar el zoom automáticamente para ver todos los puntos a la vez
//                 const limites = L.latLngBounds(arregloCoordenadas);
//                 map.fitBounds(limites, { padding: [50, 50] });
//             }
//         },
//         error: function (err) {
//             console.error("Error al obtener paradas de la hoja de ruta:", err);
//         }
//     });
// }

// /* ==========================================================================
//    3. GUARDAR Y RESETEAR
//    ========================================================================== */

// function GuardarParadaDesdeMapa() {
//     const idHojaRuta = parseInt($("#map_id_hoja_ruta").val()) || 0;
//     const idUbicacionGeo = parseInt($("#map_id_ubicacion_geo").val()) || 0;
//     const idTipoMov = parseInt($("#map_id_tipo_mov").val()) || 0;
//     const hora = $("#map_hora_estimada").val();

//     if (idHojaRuta <= 0) {
//         mostrarAlerta("⚠️ Seleccione una Hoja de Ruta válida.", "warning");
//         return;
//     }

//     if (idUbicacionGeo <= 0) {
//         mostrarAlerta("⚠️ Haga clic en el mapa para marcar el lugar de la parada.", "warning");
//         return;
//     }

//     const dto = {
//         Id_Detalle_HDR: 0,
//         Id_HojaRuta: idHojaRuta,
//         Id_TipoMovimiento: idTipoMov > 0 ? idTipoMov : 1,
//         Id_RecursoMov: 0,
//         Id_Origen: 0,
//         Id_Ubicacion: idUbicacionGeo,
//         HoraEstimada: hora ? hora + ":00" : "00:00:00",
//         Id_Estado: 1
//     };

//     $.ajax({
//         type: "POST",
//         url: URL_API_DETALLE_HDR,
//         data: JSON.stringify(dto),
//         contentType: "application/json; charset=utf-8",
//         dataType: "json",
//         success: function () {
//             mostrarAlerta("✅ Parada añadida correctamente a la Hoja de Ruta.", "success");
//             ResetearFormularioMapa();
//             ObtenerParadasRuta(idHojaRuta);
//         },
//         error: function (err) {
//             console.error("SITMAS - Error al asociar parada:", err);
//             mostrarAlerta("❌ No se pudo guardar la parada.", "danger");
//         }
//     });
// }

// function EliminarParadaExpress(idDetalle) {
//     const idHojaRuta = $("#map_id_hoja_ruta").val();
//     confirmarAccion(
//         "¿Eliminar Parada?",
//         "Se borrará esta parada de la Hoja de Ruta.",
//         function () {
//             $.ajax({
//                 type: "DELETE",
//                 url: `${URL_API_DETALLE_HDR}/${idDetalle}`,
//                 dataType: "json",
//                 success: function () {
//                     mostrarAlerta("Parada eliminada.", "info");
//                     ObtenerParadasRuta(idHojaRuta);
//                 }
//             });
//         }
//     );
// }

// function ResetearFormularioMapa() {
//     $("#map_id_ubicacion_geo").val("0");
//     $("#map_txt_descripcion").val("");
//     $("#map_hora_estimada").val("");
//     if (marcadorActual) {
//         map.removeLayer(marcadorActual);
//     }
// }