/* ==========================================================================
   SITMAS - Módulo: Dashboard Operativo y Analítico del Chofer (Dinámico SPA)
   Escenarios:
   - A (Chofer en espera): Bienvenida + KPIs mensuales + Rutas de hoy + Calendar-Pie con selector de mes
   - B (Chofer en viaje): Mapa interactivo a pantalla completa + Paradas + Cierre
   - C (Administrador): Vista de supervisión de rutas programadas del día
   ========================================================================== */

const URL_API_HOJAS_RUTA = "https://localhost:44325/api/hojaruta";
const URL_API_DETALLE_HDR = "https://localhost:44325/api/detallehojaruta";
const URL_API_UBICACION_GEO = "https://localhost:44325/api/ubicaciongeografica";
const URL_API_TIPO_MOV = "https://localhost:44325/api/tipomovimientos";
const URL_API_REGISTRO_ODOMETRO = "https://localhost:44325/api/registroodometro";
const URL_API_RENDIMIENTO_CHOFER = "https://localhost:44325/api/ReportesLogistica/RendimientoChoferes";

// 📍 Coordenada base predeterminada (Sede EMEC)
const EMEC_BASE = { lat: -31.465829, lng: -64.127313 };

const NOMBRES_MESES_DASH = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Variables del Mapa
let map = null;
let marcadorActual = null;
let marcadoresRuta = [];
let marcadorBaseEMEC = null;
let directionsService = null;
let directionsRenderer = null;
let listaParadasActualesMapa = [];
let coordenadaTemporalClick = null;
let idRutaActivaMapa = 0;
let distanciaFinalCalculada = 0;

// Variables de Sesión y Gráfico
let choferIdUsuario = 0;
let choferNombreUsuario = "";
let choferRolUsuario = "";
let chartCalendarioChoferDash = null;
let opcionesMesesHistorialDash = [];

$(document).ready(function () {
    const sesionString = localStorage.getItem("usuarioSesion");
    if (!sesionString) return;

    const sesionLocal = JSON.parse(sesionString);
    choferIdUsuario = parseInt(sesionLocal.id, 10) || 0;
    choferNombreUsuario = sesionLocal.nombre || "";
    choferRolUsuario = sesionLocal.rol || "";

    if (choferRolUsuario === "Operador_Logistica") {
        // Garantizamos que Google Maps SDK esté listo antes de renderizar un posible mapa activo
        if (typeof CargarGoogleMapsSDK === "function") {
            CargarGoogleMapsSDK(() => {
                console.log("SITMAS - Google Maps SDK preparado exitosamente en el Dashboard.");
                CargarHojasDeRutaDelDia();
            });
        } else {
            CargarHojasDeRutaDelDia();
        }
    }

    // Evento delegado para el selector de mes del calendario personal
    $("#contenedor-rutas")
        .off("change", "#select-mes-dashboard-chofer")
        .on("change", "#select-mes-dashboard-chofer", function () {
            const anioMesElegido = $(this).val();
            const rangoEncontrado = opcionesMesesHistorialDash.find(m => m.anioMes === anioMesElegido);
            if (rangoEncontrado) {
                CargarMetricasPersonalesChofer(rangoEncontrado);
            }
        });

    $(window).off("resize.dashboardChofer").on("resize.dashboardChofer", function () {
        if (chartCalendarioChoferDash && !chartCalendarioChoferDash.isDisposed()) {
            chartCalendarioChoferDash.resize();
        }
    });
});

/* ==========================================================================
   HELPERS DE FORMATEO, FECHAS Y LIMPIEZA
   ========================================================================== */

function FormatearDecimalDash(valor) {
    const num = parseFloat(valor || 0);
    return num.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Genera los últimos 12 meses (desde el actual hacia atrás) con sus fechas exactas de inicio y fin
function GenerarOpcionesUltimosMeses(cantidadMeses = 12) {
    const hoy = new Date();
    const lista = [];

    for (let i = 0; i < cantidadMeses; i++) {
        const fechaRef = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const anio = fechaRef.getFullYear();
        const mesZero = fechaRef.getMonth(); // 0..11
        const mesStr = String(mesZero + 1).padStart(2, "0");

        // Si es el mes actual (i === 0), cortamos en el día de hoy; si es pasado, tomamos el último día real del mes
        const ultimoDiaNum = (i === 0)
            ? hoy.getDate()
            : new Date(anio, mesZero + 1, 0).getDate();

        const ultimoDiaStr = String(ultimoDiaNum).padStart(2, "0");
        const nombreBase = `${NOMBRES_MESES_DASH[mesZero]} ${anio}`;

        lista.push({
            anioMes: `${anio}-${mesStr}`,
            fechaDesde: `${anio}-${mesStr}-01`,
            fechaHasta: `${anio}-${mesStr}-${ultimoDiaStr}`,
            nombreMes: nombreBase,
            etiquetaSelect: i === 0 ? `${nombreBase} (Actual)` : nombreBase,
            esActual: i === 0
        });
    }

    return lista;
}

function DestruirGraficoCalendarioDash() {
    if (chartCalendarioChoferDash && !chartCalendarioChoferDash.isDisposed()) {
        chartCalendarioChoferDash.dispose();
    }
    chartCalendarioChoferDash = null;
}

/* ==========================================================================
   A. LÓGICA DEL DASHBOARD (Decisor de Escenarios A, B y C)
   ========================================================================== */

function CargarHojasDeRutaDelDia() {
    DestruirGraficoCalendarioDash();

    $.ajax({
        type: "GET",
        url: URL_API_HOJAS_RUTA + "/hoy",
        dataType: "json",
        success: function (listaRutas) {
            const $contenedor = $("#contenedor-rutas");
            $contenedor.empty();

            const rutasSeguras = Array.isArray(listaRutas) ? listaRutas : [];

            // Buscamos si el chofer logueado ya tiene una ruta EN CURSO (Id_Estado === 3)
            const rutaEnCurso = rutasSeguras.find(r =>
                r.Id_Estado === 3 &&
                (
                    (r.Id_Usuario && r.Id_Usuario === choferIdUsuario) ||
                    (r.ChoferNombreCompleto && r.ChoferNombreCompleto.trim().toLowerCase() === choferNombreUsuario.trim().toLowerCase())
                )
            );

            if (rutaEnCurso) {
                // ESCENARIO B: MODO VIAJE ACTIVO (Mapa a pantalla completa, sin distracciones)
                RenderizarVistaMapaActivo(rutaEnCurso, $contenedor);
                return;
            }

            // ESCENARIO A (Chofer en espera) vs. ESCENARIO C (Administrador)
            const esChofer = (choferRolUsuario === "Operador_Logistica");
            RenderizarVistaEsperaEnriquecida(rutasSeguras, $contenedor, esChofer);
        },
        error: function (err) {
            console.error("SITMAS - Error al cargar rutas del día:", err);
            $("#contenedor-rutas").html(`
                <div class="col-12">
                    <div class="alert alert-danger border-0 shadow-sm">
                        <i class="fas fa-exclamation-triangle me-2"></i>No se pudieron cargar las hojas de ruta del día. Verificá la conexión con el servidor.
                    </div>
                </div>
            `);
        }
    });
}

function RenderizarVistaEsperaEnriquecida(listaRutas, $contenedor, esChofer) {
    const opcionesFecha = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const fechaCruda = new Date().toLocaleDateString("es-AR", opcionesFecha);
    const fechaFormateada = fechaCruda.charAt(0).toUpperCase() + fechaCruda.slice(1);

    opcionesMesesHistorialDash = GenerarOpcionesUltimosMeses(12);
    const rangoMesActual = opcionesMesesHistorialDash[0];

    // 1. ENCABEZADO DE BIENVENIDA
    const subtituloRol = esChofer
        ? `Panel operativo de <strong>${choferNombreUsuario}</strong> • ${fechaFormateada}`
        : `Supervisión general de flota • ${fechaFormateada}`;

    $contenedor.append(`
        <div class="col-12 mb-3">
            <div class="d-flex flex-wrap justify-content-between align-items-center bg-white p-3 rounded shadow-sm border-start border-4 border-success gap-2">
                <div>
                    <h4 class="fw-bold text-dark mb-1">
                        👋 ¡Hola, ${choferNombreUsuario || "Operador"}!
                    </h4>
                    <small class="text-muted">${subtituloRol}</small>
                </div>
                <button type="button" class="btn btn-outline-secondary btn-sm fw-semibold" onclick="CargarHojasDeRutaDelDia()">
                    <i class="fas fa-sync-alt me-1"></i>Actualizar Tablero
                </button>
            </div>
        </div>
    `);

    // 2. BLOQUE DE KPIs PERSONALES DEL MES (Solo Escenario A: Chofer)
    if (esChofer) {
        $contenedor.append(`
            <div class="col-12 mb-4" id="bloque-kpis-chofer-dash">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="small fw-bold text-uppercase text-muted">
                        <i class="fas fa-chart-pie text-primary me-1"></i>Mi Resumen de <span id="titulo-resumen-mes-chofer">${rangoMesActual.nombreMes}</span>
                    </span>
                    <span class="badge bg-light text-secondary border" id="badge-estado-kpi-chofer">Actualizando...</span>
                </div>
                <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
                    <div class="col">
                        <div class="card bg-white border-0 border-start border-primary border-4 shadow-sm h-100">
                            <div class="card-body py-3">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="text-muted small fw-bold text-uppercase">Viajes del Mes</span>
                                    <i class="fas fa-route text-primary"></i>
                                </div>
                                <h3 class="fw-bold text-dark mb-1" id="dash-kpi-viajes">0</h3>
                                <small class="text-muted" id="dash-kpi-sub-viajes">Sin viajes registrados</small>
                            </div>
                        </div>
                    </div>

                    <div class="col">
                        <div class="card bg-white border-0 border-start border-success border-4 shadow-sm h-100">
                            <div class="card-body py-3">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="text-muted small fw-bold text-uppercase">Kms Recorridos del Mes</span>
                                    <i class="fas fa-tachometer-alt text-success"></i>
                                </div>
                                <h3 class="fw-bold text-dark mb-1" id="dash-kpi-km">0,00 km</h3>
                                <small class="text-muted" id="dash-kpi-sub-km">Promedio: 0,00 km/viaje</small>
                            </div>
                        </div>
                    </div>

                    <div class="col">
                        <div class="card bg-white border-0 border-start border-warning border-4 shadow-sm h-100">
                            <div class="card-body py-3">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="text-muted small fw-bold text-uppercase">Real vs. Estimado</span>
                                    <i class="fas fa-balance-scale text-warning"></i>
                                </div>
                                <h3 class="fw-bold text-dark mb-1" id="dash-kpi-desvio">0,00 km</h3>
                                <small class="text-muted" id="dash-kpi-sub-desvio">Estimado: 0,00 km</small>
                            </div>
                        </div>
                    </div>

                    <div class="col">
                        <div class="card bg-white border-0 border-start border-info border-4 shadow-sm h-100">
                            <div class="card-body py-3">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="text-muted small fw-bold text-uppercase">Unidad Habitual</span>
                                    <i class="fas fa-truck text-info"></i>
                                </div>
                                <h3 class="fw-bold text-dark mb-1" id="dash-kpi-vehiculo">---</h3>
                                <small class="text-muted" id="dash-kpi-sub-vehiculo">Sin asignaciones</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    // 3. SECCIÓN CENTRAL: RUTAS PROGRAMADAS PARA HOY (Prioridad Operativa)
    $contenedor.append(`
        <div class="col-12 mb-2">
            <h5 class="text-secondary fw-bold border-bottom pb-2">
                📅 Rutas programadas para hoy  <!--: <span class="text-primary">${fechaFormateada}</span>-->
            </h5>
        </div>
    `);

    if (!listaRutas || listaRutas.length === 0) {
        $contenedor.append(`
            <div class="col-12 mb-4">
                <div class="card border-0 shadow-sm text-center py-4 bg-white">
                    <div class="card-body">
                        <i class="fas fa-calendar-check fa-2x text-muted mb-2"></i>
                        <h5 class="text-muted mb-1">No hay viajes programados para hoy</h5>
                        <small class="text-muted">Cuando coordinación asigne una Hoja de Ruta aparecerá aquí lista para iniciar.</small>
                    </div>
                </div>
            </div>
        `);
    } else {
        RenderizarTarjetasRutasDelDia(listaRutas, $contenedor);
    }

    // 4. BLOQUE INFERIOR: CALENDAR-PIE MENSUAL CON SELECTOR DE MES (Solo Escenario A)
    if (esChofer) {
        const opcionesSelectHTML = opcionesMesesHistorialDash
            .map(m => `<option value="${m.anioMes}">${m.etiquetaSelect}</option>`)
            .join("");

        $contenedor.append(`
            <div class="col-12 mt-3 mb-4" id="bloque-calendario-chofer-dash">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div>
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-calendar-alt text-success me-2"></i>Mi Calendario de Actividad (<span id="titulo-calendario-mes-chofer">${rangoMesActual.nombreMes}</span>)
                            </h6>
                            <small class="text-muted">Cada círculo muestra la cantidad de viajes realizados en el día y las porciones representan los KMs de cada ruta</small>
                        </div>

                        <div class="d-flex align-items-center gap-2">
                            <label for="select-mes-dashboard-chofer" class="small fw-bold text-secondary mb-0">
                                <i class="fas fa-history me-1 text-primary"></i>Período:
                            </label>
                            <select id="select-mes-dashboard-chofer" class="form-select form-select-sm fw-bold border-success" style="min-width: 195px;">
                                ${opcionesSelectHTML}
                            </select>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="echarts-calendario-chofer-dash" style="width: 100%; height: 450px;"></div>
                    </div>
                </div>
            </div>
        `);

        // Consultamos las métricas del mes actual en segundo plano sin frenar los botones operativos
        CargarMetricasPersonalesChofer(rangoMesActual);
    }
}

function RenderizarTarjetasRutasDelDia(listaRutas, $contenedor) {
    listaRutas.forEach(ruta => {
        let botonHTML = "";
        let estadoBadgeClass = ObtenerClaseColorEstado(ruta.Estado);

        if (ruta.Id_Estado === 2) {
            if (choferRolUsuario === "Administrador") {
                botonHTML = `<button class="btn btn-outline-primary w-100 mt-3 fw-bold" disabled>Lista para ser iniciada por un chofer</button>`;
            } else {
                botonHTML = `<button class="btn btn-success w-100 mt-3 fw-bold" onclick="IniciarViaje(${ruta.Id}, ${ruta.Id_Vehiculo})">
                                <span class="material-symbols-outlined align-middle me-1">play_arrow</span> INICIAR VIAJE
                             </button>`;
            }
        }
        else if (ruta.Id_Estado === 3) {
            botonHTML = `<button class="btn btn-secondary w-100 mt-3 fw-bold" disabled>
                            En curso por ${ruta.ChoferNombreCompleto || "otro chofer"}
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
                        <span class="badge ${estadoBadgeClass}">${ruta.Estado || "Pendiente"}</span>
                    </div>
                    <div class="card-body">
                        <div class="mb-2 text-muted small">
                            <span class="material-symbols-outlined align-middle" style="font-size: 16px;">local_shipping</span>
                            <span class="ms-1 fw-medium">Vehículo:</span> <span class="text-dark">${ruta.Vehiculo || "Sin Asignar"}</span>
                        </div>
                        <div class="mb-2 text-muted small">
                            <span class="material-symbols-outlined align-middle" style="font-size: 16px;">person</span>
                            <span class="ms-1 fw-medium">Chofer:</span> <span class="text-dark">${ruta.ChoferNombreCompleto || "Sin Asignar"}</span>
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

function CargarMetricasPersonalesChofer(rangoMes) {
    if (!choferIdUsuario || choferIdUsuario <= 0 || !rangoMes) return;

    // Actualizamos títulos visuales del período consultado
    $("#titulo-resumen-mes-chofer").text(rangoMes.nombreMes);
    $("#titulo-calendario-mes-chofer").text(rangoMes.nombreMes);
    $("#badge-estado-kpi-chofer").text("Cargando...");

    $.ajax({
        type: "GET",
        url: URL_API_RENDIMIENTO_CHOFER,
        data: {
            fechaDesde: rangoMes.fechaDesde,
            fechaHasta: rangoMes.fechaHasta,
            idUsuario: choferIdUsuario
        },
        success: function (respuesta) {
            const resumenLista = (respuesta && respuesta.ResumenChoferes) || [];
            const viajesDelMes = (respuesta && respuesta.DetalleViajes) || [];
            const miResumen = resumenLista.length > 0 ? resumenLista[0] : null;

            $("#badge-estado-kpi-chofer").text(rangoMes.esActual ? "Al día" : "Histórico");

            if (miResumen) {
                $("#dash-kpi-viajes").text(miResumen.ViajesCerrados);
                $("#dash-kpi-sub-viajes").text(
                    miResumen.ViajesEnCurso > 0
                        ? `+ ${miResumen.ViajesEnCurso} viaje(s) en curso`
                        : "Todos los viajes cerrados"
                );

                $("#dash-kpi-km").text(`${FormatearDecimalDash(miResumen.KmRealesTotal)} km`);
                $("#dash-kpi-sub-km").text(`Promedio: ${FormatearDecimalDash(miResumen.PromedioKmPorViaje)} km / viaje`);

                const signo = miResumen.DesvioKmTotal > 0 ? "+" : "";
                $("#dash-kpi-desvio")
                    .text(`${signo}${FormatearDecimalDash(miResumen.DesvioKmTotal)} km`)
                    .removeClass("text-dark text-danger text-success")
                    .addClass(miResumen.DesvioKmTotal > 5 ? "text-danger" : "text-success");

                $("#dash-kpi-sub-desvio").text(
                    `Estimado: ${FormatearDecimalDash(miResumen.KmEstimadosTotal)} km (${signo}${miResumen.DesvioPorcentaje}%)`
                );

                $("#dash-kpi-vehiculo").text(miResumen.VehiculoMasUsado || "---");
                $("#dash-kpi-sub-vehiculo").text(`En el ${miResumen.PorcentajeVehiculoHabitual}% de tus viajes`);
            } else {
                // Limpieza limpia para meses anteriores sin actividad (evita datos fantasma)
                $("#dash-kpi-viajes").text("0");
                $("#dash-kpi-sub-viajes").text("Sin viajes en este mes");

                $("#dash-kpi-km").text("0,00 km");
                $("#dash-kpi-sub-km").text("Promedio: 0,00 km / viaje");

                $("#dash-kpi-desvio")
                    .text("0,00 km")
                    .removeClass("text-danger text-success")
                    .addClass("text-dark");
                $("#dash-kpi-sub-desvio").text("Estimado: 0,00 km (0%)");

                $("#dash-kpi-vehiculo").text("---");
                $("#dash-kpi-sub-vehiculo").text("Sin asignaciones en el período");
            }

            RenderizarCalendarioPieChoferDash(viajesDelMes, rangoMes);
        },
        error: function (err) {
            console.warn("SITMAS - No se pudieron cargar las métricas personales del chofer:", err);
            $("#badge-estado-kpi-chofer").text("Sin datos");
        }
    });
}

function RenderizarCalendarioPieChoferDash(viajesDelMes, rangoMes) {
    if (typeof echarts === "undefined") return;

    const dom = document.getElementById("echarts-calendario-chofer-dash");
    if (!dom) return;

    if (!chartCalendarioChoferDash || chartCalendarioChoferDash.isDisposed()) {
        chartCalendarioChoferDash = echarts.init(dom);
    }

    // Generar días del mes seleccionado (01..31)
    const [anioStr, mesStr] = rangoMes.anioMes.split("-");
    const ultimoDia = new Date(parseInt(anioStr, 10), parseInt(mesStr, 10), 0).getDate();
    const diasDelMes = [];
    for (let d = 1; d <= ultimoDia; d++) {
        diasDelMes.push([`${rangoMes.anioMes}-${String(d).padStart(2, "0")}`, 0]);
    }

    // Agrupar viajes por fecha exacta (YYYY-MM-DD)
    const mapaPorDia = {};
    viajesDelMes.forEach(v => {
        if (!v.FechaISO) return;
        if (!mapaPorDia[v.FechaISO]) {
            mapaPorDia[v.FechaISO] = [];
        }
        mapaPorDia[v.FechaISO].push(v);
    });

    const anchoContenedor = dom.clientWidth || 700;
    const anchoCelda = Math.max(52, Math.min(92, Math.floor((anchoContenedor - 40) / 7)));
    const altoCelda = 66;
    const radioTorta = 18;
    const paletaViajes = ["#0d6efd", "#198754", "#fd7e14", "#6f42c1", "#20c997", "#dc3545"];

    const seriesCalendario = [
        {
            id: "dias-mes-dash",
            type: "scatter",
            coordinateSystem: "calendar",
            symbolSize: 0,
            silent: true,
            label: {
                show: true,
                formatter: params => params.value[0].split("-")[2],
                offset: [-anchoCelda / 2 + 12, -altoCelda / 2 + 12],
                fontSize: 11,
                fontWeight: "bold",
                color: "#6c757d"
            },
            data: diasDelMes
        }
    ];

    Object.keys(mapaPorDia).forEach(fechaISO => {
        const viajesDelDia = mapaPorDia[fechaISO];
        const totalKmDia = viajesDelDia.reduce((acc, item) => {
            const km = item.EstaCerrado === 1
                ? (item.KmReales > 0 ? item.KmReales : item.KmEstimadosHDR)
                : item.KmEstimadosHDR;
            return acc + km;
        }, 0);

        const porciones = viajesDelDia.map((v, idx) => {
            const kmViaje = v.EstaCerrado === 1
                ? (v.KmReales > 0 ? v.KmReales : v.KmEstimadosHDR)
                : v.KmEstimadosHDR;

            return {
                name: `HR #${v.Id_HojaRuta} (${v.Vehiculo})`,
                value: parseFloat(kmViaje.toFixed(2)),
                fechaFormateada: v.FechaFormateada,
                estadoHDR: v.EstadoHDR,
                estaCerrado: v.EstaCerrado,
                cantidadViajesDia: viajesDelDia.length,
                totalKmDia: totalKmDia,
                itemStyle: {
                    color: paletaViajes[idx % paletaViajes.length],
                    borderColor: "#ffffff",
                    borderWidth: 1.5
                }
            };
        });

        seriesCalendario.push({
            id: `pie-dash-${fechaISO}`,
            type: "pie",
            coordinateSystem: "calendar",
            center: fechaISO,
            radius: radioTorta,
            label: {
                show: true,
                position: "center",
                formatter: () => `${viajesDelDia.length}`,
                fontSize: 10,
                fontWeight: "bold",
                color: "#ffffff",
                textBorderColor: "rgba(0,0,0,0.45)",
                textBorderWidth: 2
            },
            data: porciones
        });
    });

    const mensajeSubtitulo = viajesDelMes.length > 0
        ? "Pasá el cursor o tocá un círculo para ver el detalle de tus viajes de ese día."
        : (rangoMes.esActual
            ? "Todavía no registrás viajes en este mes. ¡Cuando completes tu primer recorrido aparecerá aquí!"
            : `No registraste hojas de ruta durante ${rangoMes.nombreMes}.`);

    const option = {
        title: {
            text: `Actividad Diaria — ${rangoMes.nombreMes}`,
            subtext: mensajeSubtitulo,
            left: "center",
            top: 0,
            textStyle: { fontSize: 14, fontWeight: "bold", color: "#212529" },
            subtextStyle: { fontSize: 11, color: "#6c757d" }
        },
        tooltip: {
            trigger: "item",
            formatter: function (params) {
                const d = params.data;
                if (!d || !d.fechaFormateada) return "";
                const etiquetaKm = d.estaCerrado === 1 ? "Km Reales" : "Km Estimados (En curso)";
                return `
                    <div style="min-width: 205px;">
                        <strong><i class="fas fa-calendar-day me-1"></i>${d.fechaFormateada}</strong><br/>
                        <span class="text-muted">Total del día:</span> <strong>${d.cantidadViajesDia} viaje(s)</strong> | <strong>${FormatearDecimalDash(d.totalKmDia)} km</strong>
                        <hr style="margin: 5px 0;"/>
                        <span style="color:${params.color}; font-weight:bold;">● ${d.name}</span><br/>
                        Estado: <strong>${d.estadoHDR}</strong><br/>
                        ${etiquetaKm}: <strong>${FormatearDecimalDash(d.value)} km</strong> (${params.percent}%)
                    </div>
                `;
            }
        },
        calendar: {
            top: 68,
            left: "center",
            orient: "vertical",
            cellSize: [anchoCelda, altoCelda],
            range: rangoMes.anioMes,
            yearLabel: { show: false },
            monthLabel: { show: false },
            dayLabel: {
                firstDay: 1,
                nameMap: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
                margin: 12,
                fontWeight: "bold",
                color: "#495057"
            },
            itemStyle: {
                borderWidth: 1,
                borderColor: "#dee2e6",
                color: "#ffffff"
            },
            splitLine: {
                show: true,
                lineStyle: { color: "#adb5bd", width: 1.5 }
            }
        },
        series: seriesCalendario
    };

    chartCalendarioChoferDash.setOption(option, true);
    chartCalendarioChoferDash.resize();
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
    // 1. Buscamos el último odómetro con protección contra registros abiertos (FinalOdom null)
    let ultimoValorConocido = 0;
    try {
        const historial = await $.ajax({
            type: "GET",
            url: `${URL_API_REGISTRO_ODOMETRO}?idVehiculo=${idVehiculo}`,
            dataType: "json"
        });

        if (Array.isArray(historial) && historial.length > 0) {
            const ultimo = historial[0];
            ultimoValorConocido = parseFloat(ultimo.FinalOdom ?? ultimo.InicioOdom ?? 0) || 0;
        }
    } catch (err) {
        console.warn("No se pudo obtener el historial previo, se iniciará en 0.");
    }

    // 2. Pedimos el kilometraje precargando el valor
    const { value: kilometrajeInicial, isConfirmed } = await Swal.fire({
        title: "¿Iniciar Viaje?",
        text: "Verifique e ingrese el valor actual del odómetro:",
        icon: "question",
        input: "number",
        inputValue: ultimoValorConocido,
        inputAttributes: { min: ultimoValorConocido, step: 0.1 },
        showCancelButton: true,
        confirmButtonText: "Sí, Iniciar",
        cancelButtonText: "Cancelar",
        inputValidator: (value) => {
            if (!value || parseFloat(value) < ultimoValorConocido) {
                return `El valor debe ser igual o mayor a ${ultimoValorConocido} Km.`;
            }
            if (parseFloat(value) - ultimoValorConocido > 180) {
                return "El salto de kilometraje es inusualmente alto. Revise los números ingresados.";
            }
        }
    });

    if (!isConfirmed) return;

    try {
        Swal.fire({ title: "Iniciando viaje...", allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

        // 3. Abrimos registro de odómetro
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

        // 4. Guardamos respaldo en localStorage
        localStorage.setItem(`odometro_hdr_${idHojaRuta}`, respOdometro.IdRegistroOdomet);
        localStorage.setItem(`odometro_inicio_${idHojaRuta}`, kilometrajeInicial);
        localStorage.setItem(`odometro_vehiculo_${idHojaRuta}`, idVehiculo);

        // 5. Iniciamos la Hoja de Ruta con Usuario.Id (choferIdUsuario)
        const dtoHoja = { IdUsuario: choferIdUsuario };
        await $.ajax({
            type: "PATCH",
            url: `${URL_API_HOJAS_RUTA}/${idHojaRuta}/iniciar`,
            data: JSON.stringify(dtoHoja),
            contentType: "application/json; charset=utf-8"
        });

        Swal.fire("¡Éxito!", "Viaje iniciado y odómetro registrado correctamente.", "success");
        CargarHojasDeRutaDelDia();

    } catch (error) {
        const msg = (error.responseJSON && error.responseJSON.Message) ? error.responseJSON.Message : "Ocurrió un error al iniciar el viaje.";
        Swal.fire("Atención", msg, "error");
    }
}

/* ==========================================================================
   B. LÓGICA DEL MAPA DINÁMICO (Escenario B: Viaje Activo)
   ========================================================================== */

function RenderizarVistaMapaActivo(ruta, $contenedor) {
    if (!ruta || !ruta.Id) {
        console.warn("SITMAS - Se intentó renderizar el mapa pero no hay una 'ruta' válida en memoria.");
        return;
    }

    idRutaActivaMapa = ruta.Id;

    const mapaHTML = `
        <div class="col-12" id="panel-viaje-activo">
            <div class="sitmas-card mb-4 border-top border-4 border-primary shadow-sm">
                <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
                    <div>
                        <h2 class="mb-0 text-primary fw-bold">📍 Viaje en Curso: HR #${ruta.Id}</h2>
                        <small class="text-muted fw-bold">Vehículo: ${ruta.Vehiculo}</small>
                    </div>
                    <button class="btn btn-danger fw-bold mt-2 mt-md-0" onclick="FinalizarViaje(${ruta.Id}, ${ruta.Id_Vehiculo || 0})">
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

    $("#formParadaMapa").off("submit").on("submit", function (e) {
        e.preventDefault();
        GuardarParadaDesdeMapa();
    });
}

function InicializarMapa() {
    if (typeof google === "undefined" || !google.maps) {
        console.error("SITMAS - Google Maps SDK aún no está disponible.");
        return;
    }

    map = new google.maps.Map(document.getElementById("mapaInteractiveContainer"), {
        center: EMEC_BASE,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: { strokeColor: "#78BE20", strokeWeight: 6, strokeOpacity: 0.8 }
    });

    map.addListener("click", function (e) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        Swal.fire({
            title: "📍 Nueva Parada Espontánea",
            text: "Ingrese referencia del retiro:",
            input: "text",
            showCancelButton: true,
            confirmButtonColor: "#78BE20",
            confirmButtonText: "Confirmar",
            cancelButtonText: "Cancelar",
            inputValidator: (value) => {
                if (!value) return "¡Debe ingresar una referencia!";
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
            const $select = $("#map_id_tipo_mov");
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
            Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Punto fijado", showConfirmButton: false, timer: 1500 });
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
            const $tbody = $("#tbodyParadasMapa");
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
                        <td><small class="fw-bold">${item.HoraEstimadaFormateada || "N/A"}</small></td>
                        <td>${item.TipoMovimiento || "General"}</td>
                        <td>${item.Origen || "Punto en Mapa"}</td>
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
    const idUbicacionGeo = parseInt($("#map_id_ubicacion_geo").val(), 10) || 0;
    const idTipoMov = parseInt($("#map_id_tipo_mov").val(), 10) || 0;
    const hora = $("#map_hora_estimada").val();

    if (idUbicacionGeo <= 0 || !coordenadaTemporalClick) {
        Swal.fire("Atención", "Haga clic en el mapa primero para fijar una coordenada.", "warning");
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
            Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Parada añadida", showConfirmButton: false, timer: 1500 });
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
        title: "¿Eliminar Parada?",
        text: "Se borrará del mapa y de la ruta actual.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Sí, borrar"
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
            if (status === "OK" && response.rows[0].elements[0].status === "OK") {
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
   C. CIERRE DEFINITIVO DEL VIAJE (Con respaldo automático contra API)
   ========================================================================== */

async function FinalizarViaje(idHojaRuta, idVehiculo = 0) {
    // 1. Buscamos primero en localStorage ("guantera")
    let idOdomet = localStorage.getItem("odometro_hdr_" + idHojaRuta);
    let odomInicio = parseFloat(localStorage.getItem("odometro_inicio_" + idHojaRuta)) || 0;
    const idVehiculoRef = idVehiculo || parseInt(localStorage.getItem("odometro_vehiculo_" + idHojaRuta), 10) || 0;

    // 2. Respaldo inteligente: si inició en otro dispositivo o borró caché, consultamos a la API
    if (!idOdomet && idVehiculoRef > 0) {
        try {
            const historial = await $.ajax({
                type: "GET",
                url: `${URL_API_REGISTRO_ODOMETRO}?idVehiculo=${idVehiculoRef}`,
                dataType: "json"
            });

            if (Array.isArray(historial)) {
                const registroAbierto = historial.find(r => r.Id_HojaRuta === idHojaRuta && r.FinalOdom === null)
                    || historial.find(r => r.FinalOdom === null);

                if (registroAbierto) {
                    idOdomet = registroAbierto.IdRegistroOdomet;
                    odomInicio = parseFloat(registroAbierto.InicioOdom) || 0;
                }
            }
        } catch (err) {
            console.warn("SITMAS - No se pudo recuperar el odómetro abierto desde la API:", err);
        }
    }

    if (!idOdomet) {
        Swal.fire("Atención", "No se encontró el registro inicial del odómetro. Contacte al administrador.", "error");
        return;
    }

    // Calculamos el valor estimado (Inicio + GPS)
    let valorEstimado = parseFloat((odomInicio + distanciaFinalCalculada).toFixed(2));

    // 3. Pedimos el odómetro final
    const { value: kilometrajeFinal, isConfirmed } = await Swal.fire({
        title: "¿Finalizar Viaje?",
        text: `El GPS calculó ${distanciaFinalCalculada} Km. Revisa el tablero e ingresa el Odómetro Final real:`,
        icon: "warning",
        input: "number",
        inputValue: valorEstimado,
        inputAttributes: { min: odomInicio, step: 0.1 },
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, Finalizar",
        cancelButtonText: "Cancelar",
        inputValidator: (value) => {
            if (!value || parseFloat(value) < odomInicio) {
                return `¡El valor no puede ser menor al inicial (${odomInicio} Km)!`;
            }
            if ((parseFloat(value) - odomInicio) > 180) {
                return "El salto de kilometraje supera los 180 Km permitidos. Revise el número.";
            }
        }
    });

    if (!isConfirmed) return;

    try {
        Swal.fire({ title: "Procesando fin de viaje...", allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

        // 4. Tramo ciego de retorno a EMEC_BASE
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

        // 5. Cerramos el Odómetro
        const dtoOdometroFinal = { FinalOdom: parseFloat(kilometrajeFinal) };
        await $.ajax({
            type: "PUT",
            url: `${URL_API_REGISTRO_ODOMETRO}/finalizar-ruta/${idOdomet}`,
            data: JSON.stringify(dtoOdometroFinal),
            contentType: "application/json"
        });

        // 6. Cerramos la Hoja de Ruta
        const dtoFinalizar = { DistanciaTotal: distanciaFinalCalculada };
        await $.ajax({
            type: "PATCH",
            url: `${URL_API_HOJAS_RUTA}/${idHojaRuta}/finalizar`,
            data: JSON.stringify(dtoFinalizar),
            contentType: "application/json"
        });

        // 7. Limpieza completa de la "guantera"
        localStorage.removeItem("odometro_hdr_" + idHojaRuta);
        localStorage.removeItem("odometro_inicio_" + idHojaRuta);
        localStorage.removeItem("odometro_vehiculo_" + idHojaRuta);
        distanciaFinalCalculada = 0;

        Swal.fire("¡Excelente trabajo!", "Viaje finalizado y retorno registrado con éxito.", "success");
        CargarHojasDeRutaDelDia();

    } catch (error) {
        const mensajeError = (error.responseJSON && error.responseJSON.Message) ? error.responseJSON.Message : "No se pudo finalizar el viaje.";
        Swal.fire("Atención", mensajeError, "warning");
    }
}

