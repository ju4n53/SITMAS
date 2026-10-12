/* ==========================================================================
   SITMAS - Módulo: Dashboard de Rutas y Mapa Integrado (Dinámico SPA)
   ========================================================================== */

const URL_API_HOJAS_RUTA = "https://localhost:44325/api/hojaruta";
const URL_API_DETALLE_HDR = "https://localhost:44325/api/detallehojaruta";
const URL_API_UBICACION_GEO = "https://localhost:44325/api/ubicaciongeografica";
const URL_API_TIPO_MOV = "https://localhost:44325/api/tipomovimientos";
const URL_API_REGISTRO_ODOMETRO = "https://localhost:44325/api/registroodometro";

// 📍 Coordenada base predeterminada (Sede EMEC)
const EMEC_BASE = { lat: -31.465829, lng: -64.127313 };

// Variables de Sesión
let sesionActual = null;
let idUsuarioReal = 0;
let nombreUsuario = "";
let rolUsuario = "";

// Variables del Mapa
let map = null;
let marcadorActual = null;
let marcadoresRuta = []; 
let marcadorBaseEMEC = null; 
let directionsService = null; 
let directionsRenderer = null; 
let listaParadasActualesMapa = [];
let coordenadaTemporalClick = null;
let idRutaActivaMapa = 0; // Guardamos el ID de la ruta en curso
let distanciaFinalCalculada = 0; // Guardará el total del circuito (Base -> Paradas -> Base)

$(document).ready(function () {
    // 1. Validar Sesión
    const sesionString = localStorage.getItem("usuarioSesion");
    if (!sesionString) {
        Swal.fire('Acceso Denegado', 'Debe iniciar sesión.', 'error');
        // window.location.href = '../login.html'; // Descomentar cuando esté en producción
        return;
    }
    sesionActual = JSON.parse(sesionString);
    idUsuarioReal = parseInt(sesionActual.id);
    nombreUsuario = sesionActual.nombre;
    rolUsuario = sesionActual.rol;

    // 2. Cargar Tablero Principal
    CargarHojasDeRutaDelDia();
});

/* ==========================================================================
   A. LÓGICA DEL DASHBOARD (Decisor de Vistas)
   ========================================================================== */

function CargarHojasDeRutaDelDia() {
    $.ajax({
        type: "GET",
        url: URL_API_HOJAS_RUTA + "/hoy", 
        dataType: "json",
        success: function (listaRutas) {
            const $contenedor =$("#contenedor-rutas"); 
            $contenedor.empty();

            if (!listaRutas || listaRutas.length === 0) {
                $contenedor.append('<div class="col-12 text-center text-muted py-4"><h4>No hay viajes programados para hoy.</h4></div>');
                return;
            }

            // Buscamos si el chofer ya tiene una ruta EN CURSO
            const rutaEnCurso = listaRutas.find(r => r.Id_Estado === 3 && r.ChoferNombreCompleto === nombreUsuario);

            if (rutaEnCurso) {
                // VISTA 1: MODO MAPA (Viaje activo)
                RenderizarVistaMapaActivo(rutaEnCurso, $contenedor);
            } else {
                // VISTA 2: MODO TARJETAS (Selección de viaje)
                RenderizarVistaTarjetas(listaRutas, $contenedor);
            }
        },
        error: function (err) {
            console.error("SITMAS - Error:", err);
        }
    });
}

function RenderizarVistaTarjetas(listaRutas, $contenedor) {
    listaRutas.forEach(ruta => {
        let botonHTML = '';
        let estadoBadgeClass = ObtenerClaseColorEstado(ruta.Estado); 
        const esMiRuta = (ruta.ChoferNombreCompleto === nombreUsuario);

        if (ruta.Id_Estado === 2) { 
            if (rolUsuario === "Administrador") {
                botonHTML = `<button class="btn btn-outline-primary w-100 mt-3 fw-bold" disabled>Lista para ser iniciada por un chofer</button>`;
            } else {
                botonHTML = `<button class="btn btn-success w-100 mt-3 fw-bold" onclick="IniciarViaje(${ruta.Id}, ${ruta.Id_Vehiculo})">
                                <span class="material-symbols-outlined align-middle me-1">play_arrow</span> INICIAR VIAJE
                             </button>`;
            }
        } 
        else if (ruta.Id_Estado === 3) {
            botonHTML = `<button class="btn btn-secondary w-100 mt-3 fw-bold" disabled>
                            En curso por ${ruta.ChoferNombreCompleto || 'otro chofer'}
                         </button>`;
        }
        else if (ruta.Id_Estado === 4 || ruta.Id_Estado === 5) {
            botonHTML = `<button class="btn btn-outline-success w-100 mt-3 fw-bold" disabled>Viaje Completado</button>`;
        } else {
             botonHTML = `<button class="btn btn-outline-secondary w-100 mt-3 fw-bold" disabled>Aún no asignado</button>`;
        }

        const tarjetaHTML = `
            <div class="col-12 col-md-6 col-xl-4 mb-3">
                <div class="card h-100 border-top border-4 border-success shadow-sm">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center border-bottom-0 pt-3 pb-0">
                        <h5 class="mb-0 text-success fw-bold">HR #${ruta.Id}</h5>
                        <span class="badge ${estadoBadgeClass}">${ruta.Estado || 'Pendiente'}</span>
                    </div>
                    <div class="card-body">
                        <div class="mb-2 text-muted small">
                            <span class="material-symbols-outlined align-middle" style="font-size: 16px;">local_shipping</span>
                            <span class="ms-1 fw-medium">Vehículo:</span> <span class="text-dark">${ruta.Vehiculo || 'Sin Asignar'}</span>
                        </div>
                        <div class="mb-3 text-muted small">
                            <span class="material-symbols-outlined align-middle" style="font-size: 16px;">route</span>
                            <span class="ms-1 fw-medium">Distancia Total:</span> <span class="text-dark">${ruta.Distancia_Total_Estimada_Km || 0} Km</span>
                        </div>
                        ${botonHTML}
                    </div>
                </div>
            </div>`;
        $contenedor.append(tarjetaHTML);
    });
}

function ObtenerClaseColorEstado(estadoNombre) {
    if (!estadoNombre) return "bg-secondary";
    const est = estadoNombre.toLowerCase();
    if (est.includes("pendiente")) return "bg-warning text-dark";
    if (est.includes("asignado")) return "bg-primary";
    if (est.includes("curso")) return "bg-info text-dark";
    if (est.includes("finaliz")) return "bg-success";
    return "bg-secondary";
}

async function IniciarViaje(idHojaRuta, idVehiculo) {
   
   // 1. Buscamos el último odómetro usando tu endpoint existente
    let ultimoValorConocido = 0;
    try {
        const historial = await $.ajax({
            type: "GET",
            url: `${URL_API_REGISTRO_ODOMETRO}?idVehiculo=${idVehiculo}`,
            dataType: "json"
        });
        
        // Si hay historial, tomamos el FinalOdom del primer registro (el más reciente)
        if (historial && historial.length > 0) {
            ultimoValorConocido = historial[0].FinalOdom;
        }
    } catch (err) {
        console.warn("No se pudo obtener el historial previo, se iniciará en 0.");
    }

    // 2. Pedimos el kilometraje precargando el valor
    const { value: kilometrajeInicial, isConfirmed } = await Swal.fire({
        title: '¿Iniciar Viaje?',
        text: "Verifique e ingrese el valor actual del odómetro:",
        icon: 'question',
        input: 'number',
        inputValue: ultimoValorConocido, // ¡MAGIA! Precargamos el dato aquí
        inputAttributes: { min: ultimoValorConocido, step: 0.1 },
        showCancelButton: true,
        confirmButtonText: 'Sí, Iniciar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value || value < ultimoValorConocido) {
                return `El valor debe ser igual o mayor a ${ultimoValorConocido} Km.`;
            }
            // Validación visual frontal (180 km de tolerancia)
            if (value - ultimoValorConocido > 180) {
                return 'El salto de kilometraje es inusualmente alto. Revise los números ingresados.';
            }
        }
    });

    if (!isConfirmed) return;
   
    // // 1. Pedimos el kilometraje con SweetAlert
    // const { value: kilometrajeInicial, isConfirmed } = await Swal.fire({
    //     title: '¿Iniciar Viaje?',
    //     text: "Ingresa el valor actual del odómetro del vehículo:",
    //     icon: 'question',
    //     input: 'number',
    //     inputAttributes: { min: 0, step: 0.1 },
    //     showCancelButton: true,
    //     confirmButtonText: 'Sí, Iniciar',
    //     cancelButtonText: 'Cancelar',
    //     inputValidator: (value) => {
    //         if (!value || value <= 0) return '¡Debes ingresar un kilometraje válido!';
    //     }
    // });

    // if (!isConfirmed) return;



    try {
        Swal.fire({ title: 'Iniciando viaje...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });

        // 2. Enviamos el dato a la nueva API
        const dtoOdometro = {
            IdVehiculo: idVehiculo, 
            Id_HojaRuta: idHojaRuta,
            InicioOdom: parseFloat(kilometrajeInicial)
        };

        const respOdometro = await $.ajax({
            type: "POST",
            url: `${URL_API_REGISTRO_ODOMETRO}/iniciar-ruta`,
            data: JSON.stringify(dtoOdometro),
            contentType: "application/json"
        });

        // 3. Guardamos el ID generado en la "guantera" del navegador
        localStorage.setItem(`odometro_hdr_${idHojaRuta}`, respOdometro.IdRegistroOdomet);
        localStorage.setItem(`odometro_inicio_${idHojaRuta}`, kilometrajeInicial); // NUEVO

        // 4. Tu lógica original para iniciar la Hoja de Ruta
        const dtoHoja = { IdUsuario: idUsuarioReal }; // idUsuarioReal viene de tu variable global
        await $.ajax({
            type: "PATCH",
            url: `${URL_API_HOJAS_RUTA}/${idHojaRuta}/iniciar`,
            data: JSON.stringify(dtoHoja),
            contentType: "application/json; charset=utf-8"
        });

        Swal.fire('¡Éxito!', 'Viaje iniciado y odómetro registrado correctamente.', 'success');
        CargarHojasDeRutaDelDia(); 

    } catch (error) {
        const msg = (error.responseJSON && error.responseJSON.Message) ? error.responseJSON.Message : 'Ocurrió un error al iniciar el viaje.';
        Swal.fire('Atención', msg, 'error');
    }
}

/* ==========================================================================
   B. LÓGICA DEL MAPA DINÁMICO (Renderizado y Funciones)
   ========================================================================== */

function RenderizarVistaMapaActivo(ruta, $contenedor) {
    idRutaActivaMapa = ruta.Id;

    const mapaHTML = `
        <div class="col-12" id="panel-viaje-activo">
            <div class="sitmas-card mb-4 border-top border-4 border-primary shadow-sm">
                <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
                    <div>
                        <h2 class="mb-0 text-primary fw-bold">📍 Viaje en Curso: HR #${ruta.Id}</h2>
                        <small class="text-muted fw-bold">Vehículo: ${ruta.Vehiculo}</small>
                    </div>
                    <button class="btn btn-danger fw-bold mt-2 mt-md-0" onclick="FinalizarViaje(${ruta.Id})">
                        <span class="material-symbols-outlined align-middle">stop</span> FINALIZAR VIAJE
                    </button>
                </div>

                <div class="row g-3">
                    <div class="col-lg-4">
                        <div class="bg-light p-3 rounded h-100 border">
                            <h5 class="fw-bold mb-3 text-success">Agregar Parada Rápida</h5>
                            <form id="formParadaMapa">
                                <input type="hidden" id="map_id_ubicacion_geo" value="0">
                                
                                <div class="mb-3">
                                    <label class="form-label fw-bold small">Tipo Movimiento</label>
                                    <select class="form-select form-select-sm" id="map_id_tipo_mov" required>
                                        <option value="">Cargando...</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label fw-bold small">Hora Estimada</label>
                                    <input type="time" class="form-control form-control-sm" id="map_hora_estimada" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label fw-bold small text-success">Punto Marcado:</label>
                                    <textarea class="form-control form-control-sm" id="map_txt_descripcion" rows="2" readonly placeholder="Haga clic en el mapa..."></textarea>
                                </div>
                                <button type="submit" class="btn btn-success btn-sm w-100 fw-bold">
                                    ➕ Guardar Parada
                                </button>
                            </form>
                        </div>
                    </div>

                    <div class="col-lg-8">
                        <div id="mapaInteractiveContainer" style="height: 380px; width: 100%; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #ccc;"></div>
                        
                        <h6 class="fw-bold text-muted">Lista de Paradas del Recorrido:</h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-hover align-middle mb-0 border bg-white">
                                <thead class="table-light">
                                    <tr>
                                        <th>Hora</th>
                                        <th>Tipo</th>
                                        <th>Lugar</th>
                                        <th class="text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyParadasMapa">
                                    <tr><td colspan="4" class="text-center text-muted">Cargando paradas...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    $contenedor.append(mapaHTML);

    InicializarMapa();
    CargarComboTipoMovimientos();
    ObtenerParadasRuta(ruta.Id);

    $("#formParadaMapa").on("submit", function (e) {
        e.preventDefault();
        GuardarParadaDesdeMapa();
    });
}

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
        suppressMarkers: true, 
        polylineOptions: { strokeColor: '#78BE20', strokeWeight: 6, strokeOpacity: 0.8 } 
    });

    map.addListener('click', function (e) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        Swal.fire({
            title: '📍 Nueva Parada Espontánea',
            text: 'Ingrese referencia del retiro:',
            input: 'text',
            showCancelButton: true,
            confirmButtonColor: '#78BE20',
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) return '¡Debe ingresar una referencia!';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                RegistrarCoordenadaGPS(result.value, lat, lng);
            }
        });
    });
}

function CargarComboTipoMovimientos() {
    $.ajax({
        type: "GET",
        url: URL_API_TIPO_MOV,
        dataType: "json",
        success: function (data) {
            const $select =$("#map_id_tipo_mov");
            $select.empty().append('<option value="">Seleccione Tipo</option>');
            if (Array.isArray(data)) {
                data.forEach(v => {
                    $select.append(`<option value="${v.IdTipoMovimientos}">${v.TipoMovimientos}</option>`);
                });
            }
        }
    });
}

function RegistrarCoordenadaGPS(descripcion, lat, lng) {
    const dtoGeo = { IdUbicacion: 0, Descripcion: descripcion, Latitud: lat, Longitud: lng, Id_Origen: 0 };
    $.ajax({
        type: "POST",
        url: URL_API_UBICACION_GEO,
        data: JSON.stringify(dtoGeo),
        contentType: "application/json; charset=utf-8",
        success: function (res) {
            const idGenerado = res.IdUbicacionGenerado || res.idUbicacionGenerado;
            coordenadaTemporalClick = { lat: lat, lng: lng };
            $("#map_id_ubicacion_geo").val(idGenerado);
            $("#map_txt_descripcion").val(`${descripcion} (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`);

            if (marcadorActual) marcadorActual.setMap(null);

            marcadorActual = new google.maps.Marker({
                position: { lat: lat, lng: lng },
                map: map,
                title: descripcion
            });
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Punto fijado', showConfirmButton: false, timer: 1500 });
        }
    });
}

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

            marcadorBaseEMEC = new google.maps.Marker({
                position: EMEC_BASE,
                map: map,
                title: "Planta Base EMEC",
                icon: { url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png" }
            });

            if (!lista || lista.length === 0) {
                $tbody.append('<tr><td colspan="4" class="text-center text-muted">Aún no hay paradas. Haga clic en el mapa para agregar la primera.</td></tr>');
                GuardarDistanciaTotalEnBD(idHojaRuta, 0);
                return;
            }

            const waypointsIntermedios = [];
            lista.forEach((item, index) => {
                $tbody.append(`
                    <tr>
                        <td><small class="fw-bold">${item.HoraEstimadaFormateada || 'N/A'}</small></td>
                        <td>${item.TipoMovimiento || 'General'}</td>
                        <td>${item.Origen || 'Punto en Mapa'}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-danger" onclick="EliminarParadaExpress(${item.Id_Detalle_HDR})" title="Eliminar Parada">🗑️</button>
                        </td>
                    </tr>`);

                if (item.Latitud && item.Longitud) {
                    const pos = { lat: parseFloat(item.Latitud), lng: parseFloat(item.Longitud) };
                    waypointsIntermedios.push({ location: pos, stopover: true });
                    const marcador = new google.maps.Marker({ position: pos, map: map, title: `Parada #${index + 1}` });
                    marcadoresRuta.push(marcador);
                }
            });

            const peticion = { 
                origin: EMEC_BASE, 
                destination: EMEC_BASE, 
                waypoints: waypointsIntermedios, 
                optimizeWaypoints: false, 
                travelMode: google.maps.TravelMode.DRIVING 
            };
            
            directionsService.route(peticion, function (resultado, estado) {
                 if (estado === google.maps.DirectionsStatus.OK) {
                     directionsRenderer.setDirections(resultado);
                     let totalMetros = 0;
                     resultado.routes[0].legs.forEach(leg => totalMetros += leg.distance.value);
        
                     const totalKm = parseFloat((totalMetros / 1000).toFixed(2));
                     distanciaFinalCalculada = totalKm; 

                     GuardarDistanciaTotalEnBD(idHojaRuta, totalKm); 
                }
            });
        }
    });
}

async function GuardarParadaDesdeMapa() {
    const idUbicacionGeo = parseInt($("#map_id_ubicacion_geo").val()) || 0;
    const idTipoMov = parseInt($("#map_id_tipo_mov").val()) || 0;
    const hora = $("#map_hora_estimada").val();

    if (idUbicacionGeo <= 0 || !coordenadaTemporalClick) {
        Swal.fire('Atención', 'Haga clic en el mapa primero para fijar una coordenada.', 'warning');
        return;
    }

    let puntoOrigenTramo = EMEC_BASE;
    if (listaParadasActualesMapa && listaParadasActualesMapa.length > 0) {
        const ultimaParada = listaParadasActualesMapa[listaParadasActualesMapa.length - 1];
        if (ultimaParada.Latitud && ultimaParada.Longitud) {
            puntoOrigenTramo = { lat: parseFloat(ultimaParada.Latitud), lng: parseFloat(ultimaParada.Longitud) };
        }
    }

    const kmCalculados = await CalcularDistanciaTramoGoogle(puntoOrigenTramo, coordenadaTemporalClick);

    const dto = {
        Id_Detalle_HDR: 0,
        Id_HojaRuta: idRutaActivaMapa, 
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
        success: function () {
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Parada añadida', showConfirmButton: false, timer: 1500 });
            $("#map_id_ubicacion_geo").val("0");
            $("#map_txt_descripcion").val("");
            $("#map_hora_estimada").val("");
            if (marcadorActual) marcadorActual.setMap(null);
            
            ObtenerParadasRuta(idRutaActivaMapa);
        }
    });
}

function EliminarParadaExpress(idDetalle) {
    Swal.fire({
        title: '¿Eliminar Parada?', 
        text: 'Se borrará del mapa y de la ruta actual.', 
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, borrar'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "DELETE",
                url: `${URL_API_DETALLE_HDR}/${idDetalle}`,
                success: function () {
                    ObtenerParadasRuta(idRutaActivaMapa);
                }
            });
        }
    });
}

async function CalcularDistanciaTramoGoogle(origen, destino) {
    if (!origen || !destino) return 0;
    const service = new google.maps.DistanceMatrixService();
    return new Promise((resolve) => {
        service.getDistanceMatrix({ origins: [origen], destinations: [destino], travelMode: google.maps.TravelMode.DRIVING }, (response, status) => {
            if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
                resolve(parseFloat((response.rows[0].elements[0].distance.value / 1000).toFixed(2)));
            } else resolve(0);
        });
    });
}

function GuardarDistanciaTotalEnBD(idHojaRuta, totalKm) {
    $.ajax({ 
        type: "PATCH", 
        url: `${URL_API_HOJAS_RUTA}/${idHojaRuta}/distanciatotal`, 
        data: JSON.stringify({ DistanciaTotal: totalKm }), 
        contentType: "application/json; charset=utf-8" 
    });
}

function LimpiarMapaYRuta() {
    if (marcadoresRuta.length > 0) { marcadoresRuta.forEach(m => m.setMap(null)); marcadoresRuta = []; }
    if (marcadorBaseEMEC) { marcadorBaseEMEC.setMap(null); marcadorBaseEMEC = null; }
    if (directionsRenderer) directionsRenderer.setDirections({ routes: [] });
}

/* ==========================================================================
   C. CIERRE DEFINITIVO DEL VIAJE
   ========================================================================== */

async function FinalizarViaje(idHojaRuta) {
    
    // 1. Buscamos los datos en la guantera
    let idOdomet = localStorage.getItem('odometro_hdr_' + idHojaRuta);
    let odomInicio = parseFloat(localStorage.getItem('odometro_inicio_' + idHojaRuta)) || 0;

    if (!idOdomet) {
        Swal.fire('Atención', 'No se encontró el registro inicial del odómetro. Contacte al administrador.', 'error');
        return; 
    }

    // Calculamos el valor estimado (Inicio + GPS)
    let valorEstimado = odomInicio + distanciaFinalCalculada;
    // Redondeamos a 2 decimales para que se vea prolijo
    valorEstimado = parseFloat(valorEstimado.toFixed(2));

    // 2. Pedimos el odómetro final
    const { value: kilometrajeFinal, isConfirmed } = await Swal.fire({
        title: '¿Finalizar Viaje?',
        text: `El GPS calculó ${distanciaFinalCalculada} Km. Revisa el tablero e ingresa el Odómetro Final real:`,
        icon: 'warning',
        input: 'number',
        inputValue: valorEstimado, // ¡La UX en acción! Precargamos la estimación
        inputAttributes: { min: odomInicio, step: 0.1 },
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, Finalizar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value || value < odomInicio) {
                return `¡El valor no puede ser menor al inicial (${odomInicio} Km)!`;
            }
            if ((value - odomInicio) > 180) {
                return 'El salto de kilometraje supera los 180 Km permitidos. Revise el número.';
            }
        }
    });

    if (!isConfirmed) return;
    
    // // 1. Buscamos el ID inicial en la guantera
    // let idOdomet = localStorage.getItem('odometro_hdr_' + idHojaRuta);
    
    // if (!idOdomet) {
    //     Swal.fire('Atención', 'No se encontró el registro inicial del odómetro. Contacte al administrador.', 'error');
    //     return; 
    // }

    // // 2. Pedimos el odómetro final
    // const { value: kilometrajeFinal, isConfirmed } = await Swal.fire({
    //     title: '¿Finalizar Viaje?',
    //     text: `Ingresa el valor FINAL del odómetro. Se registrarán ${distanciaFinalCalculada} Km de GPS.`,
    //     icon: 'warning',
    //     input: 'number',
    //     inputAttributes: { min: 0, step: 0.1 },
    //     showCancelButton: true,
    //     confirmButtonColor: '#10b981',
    //     cancelButtonColor: '#d33',
    //     confirmButtonText: 'Sí, Finalizar',
    //     cancelButtonText: 'Cancelar',
    //     inputValidator: (value) => {
    //         if (!value || value <= 0) return '¡Debes ingresar un kilometraje válido!';
    //     }
    // });

    // if (!isConfirmed) return;

    
    try {
        Swal.fire({ title: 'Procesando fin de viaje...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });

        // 3. Tu lógica original para el tramo ciego a EMEC_BASE
        let puntoOrigenTramo = EMEC_BASE;
        if (listaParadasActualesMapa && listaParadasActualesMapa.length > 0) {
            const ultimaParada = listaParadasActualesMapa[listaParadasActualesMapa.length - 1];
            if (ultimaParada.Latitud && ultimaParada.Longitud) {
                puntoOrigenTramo = { lat: parseFloat(ultimaParada.Latitud), lng: parseFloat(ultimaParada.Longitud) };
            }
        }

        if (puntoOrigenTramo.lat !== EMEC_BASE.lat || puntoOrigenTramo.lng !== EMEC_BASE.lng) {
            const kmRegreso = await CalcularDistanciaTramoGoogle(puntoOrigenTramo, EMEC_BASE);
            const dtoRegreso = {
                Id_Detalle_HDR: 0, Id_HojaRuta: idHojaRuta, Id_TipoMovimiento: 3, 
                Id_RecursoMov: 0, Id_Origen: 50, Id_Ubicacion: 25, 
                HoraEstimada: new Date().toTimeString().slice(0, 8),
                Id_Estado: 5, DistanciaDesdeAnterior_Km: kmRegreso
            };
            await $.ajax({ type: "POST", url: URL_API_DETALLE_HDR, data: JSON.stringify(dtoRegreso), contentType: "application/json" });
        }

        // 4. Cerramos el Odómetro (Nuestra API)
        const dtoOdometroFinal = { FinalOdom: parseFloat(kilometrajeFinal) };
        await $.ajax({
            type: "PUT",
            url: `${URL_API_REGISTRO_ODOMETRO}/finalizar-ruta/${idOdomet}`, 
            data: JSON.stringify(dtoOdometroFinal),
            contentType: "application/json"
        });

        // 5. Cerramos la Hoja de Ruta (Tu API)
        const dtoFinalizar = { DistanciaTotal: distanciaFinalCalculada };
        await $.ajax({
            type: "PATCH",
            url: `${URL_API_HOJAS_RUTA}/${idHojaRuta}/finalizar`,
            data: JSON.stringify(dtoFinalizar),
            contentType: "application/json"
        });

        // 6. Limpieza final
        localStorage.removeItem('odometro_hdr_' + idHojaRuta); 
        distanciaFinalCalculada = 0; 
        Swal.fire('¡Excelente trabajo!', 'Viaje finalizado y retorno registrado con éxito.', 'success');
        CargarHojasDeRutaDelDia();

    } catch (error) {
        const mensajeError = (error.responseJSON && error.responseJSON.Message) ? error.responseJSON.Message : 'No se pudo finalizar el viaje.';
        Swal.fire('Atención', mensajeError, 'warning');
    }
}



// async function FinalizarViaje(idHojaRuta) {
//     Swal.fire({
//         title: '¿Finalizar Viaje?',
//         text: `¿Confirmas que has regresado a la base? Se registrarán ${distanciaFinalCalculada} Km totales.`,
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonColor: '#10b981',
//         cancelButtonColor: '#d33',
//         confirmButtonText: 'Sí, Finalizar',
//         cancelButtonText: 'Cancelar'
//     }).then(async (result) => { 
//         if (result.isConfirmed) {

//             // PASO 1: Identificar la coordenada de la última parada registrada
//             let puntoOrigenTramo = EMEC_BASE;
//             if (listaParadasActualesMapa && listaParadasActualesMapa.length > 0) {
//                 const ultimaParada = listaParadasActualesMapa[listaParadasActualesMapa.length - 1];
//                 if (ultimaParada.Latitud && ultimaParada.Longitud) {
//                     puntoOrigenTramo = { lat: parseFloat(ultimaParada.Latitud), lng: parseFloat(ultimaParada.Longitud) };
//                 }
//             }

//             // PASO 2: "Fichar" el regreso a la base si hubo paradas previas
//             if (puntoOrigenTramo.lat !== EMEC_BASE.lat || puntoOrigenTramo.lng !== EMEC_BASE.lng) {

//                 // Calculamos los Km solo de este último tramo (Última Parada ➔ Base)
//                 const kmRegreso = await CalcularDistanciaTramoGoogle(puntoOrigenTramo, EMEC_BASE);

//                 const dtoRegreso = {
//                     Id_Detalle_HDR: 0,
//                     Id_HojaRuta: idHojaRuta,
//                     Id_TipoMovimiento: 3, // Retorno
//                     Id_RecursoMov: 0,
//                     Id_Origen: 50, // Base EMEC (Id en la tabla Origen)
//                     Id_Ubicacion: 25, // Base EMEC (Id en Ubicacion_Geografica)
//                     HoraEstimada: new Date().toTimeString().slice(0, 8),
//                     Id_Estado: 5, // Estado Finalizado
//                     DistanciaDesdeAnterior_Km: kmRegreso
//                 };

//                 // Usamos 'await' para que el sistema espere a que se guarde este último tramo antes de continuar
//                 await $.ajax({
//                     type: "POST",
//                     url: URL_API_DETALLE_HDR,
//                     data: JSON.stringify(dtoRegreso),
//                     contentType: "application/json; charset=utf-8"
//                 });
//             }

//             // PASO 3: Cerrar la cabecera enviando la distancia total del circuito (variable global)
//             const dtoFinalizar = {
//                 DistanciaTotal: distanciaFinalCalculada
//             };

//             $.ajax({
//                 type: "PATCH",
//                 url: `${URL_API_HOJAS_RUTA}/${idHojaRuta}/finalizar`,
//                 data: JSON.stringify(dtoFinalizar),
//                 contentType: "application/json; charset=utf-8",
//                 dataType: "json",
//                 success: function (respuesta) {
//                     Swal.fire('¡Excelente trabajo!', respuesta.Mensaje || 'Viaje finalizado y retorno registrado.', 'success');
//                     distanciaFinalCalculada = 0; // Limpiamos memoria
//                     CargarHojasDeRutaDelDia(); // Refrescamos la vista
//                 },
//                 error: function (err) {
//                     const mensajeError = err.responseJSON && err.responseJSON.Message ? err.responseJSON.Message : 'No se pudo finalizar el viaje.';
//                     Swal.fire('Atención', mensajeError, 'warning');
//                 }
//             });
//         }
//     });
// }

