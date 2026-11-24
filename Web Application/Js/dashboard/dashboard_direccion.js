/* ==========================================================================
   SITMAS - Módulo: Dashboard Ejecutivo de Dirección / Gerencia (SPA)
   Roles habilitados: Direccion, Administrador
   Contrato API: GET /api/DashboardUsuariosRol/Direccion (4 Result Sets)
     1. Kpis (Embudo físico, costos operativos, $/kg útil y salud de flota)
     2. EvolucionMensual (Kg aprovechables, descarte rojo, km y combustible)
     3. CalidadPorOrigen (Ranking de generadores y % calidad útil)
     4. PlanillaFlota (Rendimiento físico, financiero y taller por vehículo)
   ========================================================================== */

const DashboardDireccionModulo = (function () {
    "use strict";

    const URL_API_DIRECCION = "https://localhost:44325/api/DashboardUsuariosRol/Direccion";

    // Estado interno aislado del módulo
    let contenedorActualId = "panel-graficos";
    let chartEvolucionEmbudo = null;
    let chartCalidadOrigenes = null;
    let chartRendimientoFlota = null;
    let ultimaPlanillaFlota = [];

    /* ======================================================================
       HELPERS DE FORMATEO (es-AR) Y GESTIÓN DE MEMORIA ECHARTS
       ====================================================================== */

    function FormatearDecimal(valor) {
        const num = parseFloat(valor || 0);
        return num.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function FormatearMoneda(valor) {
        const num = parseFloat(valor || 0);
        return "$ " + num.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function FormatearEntero(valor) {
        const num = parseInt(valor || 0, 10);
        return num.toLocaleString("es-AR");
    }

    function ObtenerFechasPorDefecto() {
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");

        return {
            fechaDesde: `${anio}-01-01`,
            fechaHasta: `${anio}-${mes}-${dia}`
        };
    }

    function DestruirGraficos() {
        [chartEvolucionEmbudo, chartCalidadOrigenes, chartRendimientoFlota].forEach(instancia => {
            if (instancia && !instancia.isDisposed()) {
                instancia.dispose();
            }
        });
        chartEvolucionEmbudo = null;
        chartCalidadOrigenes = null;
        chartRendimientoFlota = null;
    }

    /* ======================================================================
       1. RENDERIZADO DEL ESQUELETO HTML EN EL CONTENEDOR SPA
       ====================================================================== */

    function cargarEn(contenedorId = "panel-graficos") {
        contenedorActualId = contenedorId;
        const $contenedor = $(`#${contenedorActualId}`);
        if ($contenedor.length === 0) return;

        DestruirGraficos();

        const sesionString = localStorage.getItem("usuarioSesion");
        const sesion = sesionString ? JSON.parse(sesionString) : {};
        const nombreUsuario = sesion.nombre || "Dirección General";

        const opcionesFecha = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        const fechaCruda = new Date().toLocaleDateString("es-AR", opcionesFecha);
        const fechaHoyTexto = fechaCruda.charAt(0).toUpperCase() + fechaCruda.slice(1);

        const rangoDefault = ObtenerFechasPorDefecto();

        $contenedor.html(`
            <!-- NIVEL 1: SALUDO UNIFICADO + BARRA DE FILTROS -->
            <div class="col-12">
                <div class="bg-white p-3 p-md-4 rounded shadow-sm border-start border-4 border-success">
                    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
                        <div>
                            <h4 class="fw-bold text-dark mb-1">
                                👋 ¡Hola, ${nombreUsuario}!
                            </h4>
                            <small class="text-muted">
                                Tablero Ejecutivo de Dirección • Embudo Operativo y Financiero EMEC • ${fechaHoyTexto}
                            </small>
                        </div>
                        <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2" id="dir-badge-estado">
                            <i class="fas fa-circle-notch fa-spin me-1"></i>Cargando indicadores...
                        </span>
                    </div>

                    <div class="row g-3 align-items-end">
                        <div class="col-12 col-sm-6 col-xl-2">
                            <label for="dir-fecha-desde" class="form-label small fw-bold text-secondary mb-1">
                                <i class="fas fa-calendar-alt me-1 text-primary"></i>Fecha Desde
                            </label>
                            <input type="date" class="form-control form-control-sm" id="dir-fecha-desde" value="${rangoDefault.fechaDesde}">
                        </div>

                        <div class="col-12 col-sm-6 col-xl-2">
                            <label for="dir-fecha-hasta" class="form-label small fw-bold text-secondary mb-1">
                                <i class="fas fa-calendar-check me-1 text-primary"></i>Fecha Hasta
                            </label>
                            <input type="date" class="form-control form-control-sm" id="dir-fecha-hasta" value="${rangoDefault.fechaHasta}">
                        </div>

                        <!--<div class="col-12 col-sm-6 col-xl-3">
                            <label for="dir-valor-hora" class="form-label small fw-bold text-secondary mb-1">
                                <i class="fas fa-user-clock me-1 text-success"></i>Simular Valor Hora ($ ARS)
                            </label>
                            <input type="number" min="0" step="100" class="form-control form-control-sm" id="dir-valor-hora" placeholder="Ej: 4500 (0 = solo combustible)">
                        </div>

                        <div class="col-12 col-sm-6 col-xl-2">
                            <label for="dir-costo-cubiertas" class="form-label small fw-bold text-secondary mb-1">
                                <i class="fas fa-circle-notch me-1 text-warning"></i>Juego Cubiertas ($)
                            </label>
                            <input type="number" min="0" step="10000" class="form-control form-control-sm" id="dir-costo-cubiertas" placeholder="Ej: 2400000">
                        </div>-->

                        <div class="col-12 col-xl-3 d-flex gap-2">
                            <button type="button" class="btn btn-success btn-sm fw-bold flex-grow-1" id="btn-dir-filtrar">
                                <i class="fas fa-sync-alt me-1"></i>Actualizar
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm fw-semibold" id="btn-dir-limpiar" title="Restablecer año actual y simulación">
                                <i class="fas fa-undo me-1"></i>Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2A: FILA SUPERIOR DE KPIs (+15% ALTURA Y DESCRIPCIÓN DE VALOR) -->
            <div class="col-12">
                <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
                    <!-- KPI 1: Ingreso Bruto a Planta -->
                    <div class="col">
                        <div class="card border-0 border-start border-primary border-4 shadow-sm h-100"
                             style="min-height: 156px; background: linear-gradient(135deg, #eef4ff 0%, #ffffff 100%);">
                            <div class="card-body py-3 px-3 d-flex flex-column justify-content-between">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="small fw-bold text-uppercase" style="color: #1e40af;">Ingreso Bruto Total</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 38px; height: 38px; background-color: rgba(13, 110, 253, 0.12);">
                                        <i class="fas fa-truck-loading text-primary"></i>
                                    </div>
                                </div>
                                <h3 class="fw-bold text-dark my-1" id="dir-kpi-bruto">0,00 kg</h3>
                                <div>
                                    <small class="text-dark fw-semibold d-block text-truncate" id="dir-kpi-sub-bruto">
                                        Camiones: 0 kg • Particulares: 0 kg
                                    </small>
                                    <small class="text-muted d-block lh-sm mt-1" style="font-size: 0.74rem;">
                                        Peso total recibido en planta antes de clasificación.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 2: Material Útil Aprovechable -->
                    <div class="col">
                        <div class="card border-0 border-start border-success border-4 shadow-sm h-100"
                             style="min-height: 156px; background: linear-gradient(135deg, #eaf7ef 0%, #ffffff 100%);">
                            <div class="card-body py-3 px-3 d-flex flex-column justify-content-between">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="small fw-bold text-uppercase" style="color: #166534;">Material Útil Recuperado</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 38px; height: 38px; background-color: rgba(25, 135, 84, 0.14);">
                                        <i class="fas fa-recycle text-success"></i>
                                    </div>
                                </div>
                                <h3 class="fw-bold text-success my-1" id="dir-kpi-util">0,00 kg</h3>
                                <div>
                                    <small class="text-dark fw-semibold d-block text-truncate" id="dir-kpi-sub-util">
                                        Aprovechamiento: 0,00 % • Rojo: 0,00 %
                                    </small>
                                    <small class="text-muted d-block lh-sm mt-1" style="font-size: 0.74rem;">
                                        Fracción clasificada apta para revalorización (Verde + Amarillo).
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 3: Costo Operativo Integral -->
                    <div class="col">
                        <div class="card border-0 border-start border-4 shadow-sm h-100"
                             style="min-height: 156px; border-color: #d97706 !important; background: linear-gradient(135deg, #fff8e6 0%, #ffffff 100%);">
                            <div class="card-body py-3 px-3 d-flex flex-column justify-content-between">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="small fw-bold text-uppercase" style="color: #92400e;">Costo Operativo Integral</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 38px; height: 38px; background-color: rgba(217, 119, 6, 0.14);">
                                        <i class="fas fa-file-invoice-dollar" style="color: #d97706;"></i>
                                    </div>
                                </div>
                                <h3 class="fw-bold text-dark my-1" id="dir-kpi-costo-integral">$ 0,00</h3>
                                <div>
                                    <small class="text-dark fw-semibold d-block text-truncate" id="dir-kpi-sub-costo-integral">
                                        Combustible: $ 0,00 • M.O.: $ 0,00
                                    </small>
                                    <small class="text-muted d-block lh-sm mt-1" style="font-size: 0.74rem;">
                                        Erogación acumulada de logística, combustible y operación.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 4: Costo Unitario por Kg Útil -->
                    <div class="col">
                        <div class="card border-0 border-start border-4 shadow-sm h-100"
                             style="min-height: 156px; border-color: #0891b2 !important; background: linear-gradient(135deg, #e8f7fa 0%, #ffffff 100%);">
                            <div class="card-body py-3 px-3 d-flex flex-column justify-content-between">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="small fw-bold text-uppercase" style="color: #155e75;">Costo Unitario / Kg Útil</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 38px; height: 38px; background-color: rgba(8, 145, 178, 0.14);">
                                        <i class="fas fa-balance-scale-right" style="color: #0891b2;"></i>
                                    </div>
                                </div>
                                <h3 class="fw-bold text-dark my-1" id="dir-kpi-costo-kg">$ 0,00 / kg</h3>
                                <div>
                                    <small class="text-dark fw-semibold d-block text-truncate" id="dir-kpi-sub-costo-kg">
                                        Solo combustible: $ 0,00 / kg
                                    </small>
                                    <small class="text-muted d-block lh-sm mt-1" style="font-size: 0.74rem;">
                                        Inversión operativa necesaria por cada kilogramo recuperado.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2B: FILA INFERIOR DE KPIs (ESTÉTICA DE COLORES, +15% ALTURA Y DESCRIPCIÓN) -->
            <div class="col-12">
                <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
                    <!-- KPI 5: Logística y Recorridos -->
                    <div class="col">
                        <div class="card border-0 border-start border-4 shadow-sm h-100"
                             style="min-height: 128px; border-color: #4f46e5 !important; background: linear-gradient(135deg, #eef2ff 0%, #ffffff 100%);">
                            <div class="card-body py-3 px-3 d-flex flex-column justify-content-between">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="small fw-bold text-uppercase" style="color: #3730a3;">Logística Ejecutada</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 32px; height: 32px; background-color: rgba(79, 70, 229, 0.12);">
                                        <i class="fas fa-route" style="color: #4f46e5;"></i>
                                    </div>
                                </div>
                                <h5 class="fw-bold text-dark my-1" id="dir-kpi-km">0,00 km</h5>
                                <div>
                                    <small class="text-dark fw-semibold d-block text-truncate" id="dir-kpi-sub-km">
                                        0 HDR • 0 mov. sin HDR • 0,00 L
                                    </small>
                                    <small class="text-muted d-block lh-sm mt-1" style="font-size: 0.73rem;">
                                        Distancia total recorrida en retiros y traslados internos.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 6: Horas Operativas -->
                    <div class="col">
                        <div class="card border-0 border-start border-4 shadow-sm h-100"
                             style="min-height: 128px; border-color: #0d9488 !important; background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%);">
                            <div class="card-body py-3 px-3 d-flex flex-column justify-content-between">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="small fw-bold text-uppercase" style="color: #115e59;">Horas Operativas</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 32px; height: 32px; background-color: rgba(13, 148, 136, 0.12);">
                                        <i class="fas fa-clock" style="color: #0d9488;"></i>
                                    </div>
                                </div>
                                <h5 class="fw-bold text-dark my-1" id="dir-kpi-horas">0,00 hs</h5>
                                <div>
                                    <small class="text-dark fw-semibold d-block text-truncate" id="dir-kpi-sub-horas">
                                        Chofer: 0h • Clasif: 0h • Stock: 0h
                                    </small>
                                    <small class="text-muted d-block lh-sm mt-1" style="font-size: 0.73rem;">
                                        Tiempo acumulado de personal en ruta, planta y depósito.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 7: Utilización y Rotación de Stock -->
                    <div class="col">
                        <div class="card border-0 border-start border-4 shadow-sm h-100"
                             style="min-height: 128px; border-color: #ea580c !important; background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);">
                            <div class="card-body py-3 px-3 d-flex flex-column justify-content-between">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="small fw-bold text-uppercase" style="color: #9a3412;">Salida / Uso en Stock</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 32px; height: 32px; background-color: rgba(234, 88, 12, 0.12);">
                                        <i class="fas fa-boxes" style="color: #ea580c;"></i>
                                    </div>
                                </div>
                                <h5 class="fw-bold text-dark my-1" id="dir-kpi-stock">0,00 kg</h5>
                                <div>
                                    <small class="text-dark fw-semibold d-block text-truncate" id="dir-kpi-sub-stock">
                                        Rotación: 0,00 % • $ 0,00 / kg usado
                                    </small>
                                    <small class="text-muted d-block lh-sm mt-1" style="font-size: 0.73rem;">
                                        Material valorizado egresado o consumido desde depósito.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 8: Salud Preventiva de Flota -->
                    <div class="col">
                        <div class="card border-0 border-start border-4 shadow-sm h-100"
                             style="min-height: 128px; border-color: #e11d48 !important; background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%);">
                            <div class="card-body py-3 px-3 d-flex flex-column justify-content-between">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="small fw-bold text-uppercase" style="color: #9f1239;">Salud Preventiva Flota</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 32px; height: 32px; background-color: rgba(225, 29, 72, 0.12);">
                                        <i class="fas fa-heartbeat" style="color: #e11d48;"></i>
                                    </div>
                                </div>
                                <h5 class="fw-bold text-dark my-1" id="dir-kpi-salud">0,00 %</h5>
                                <div>
                                    <small class="text-dark fw-semibold d-block text-truncate" id="dir-kpi-sub-salud">
                                        0 services vencidos • Desgaste cubiertas: 0 %
                                    </small>
                                    <small class="text-muted d-block lh-sm mt-1" style="font-size: 0.73rem;">
                                        Porcentaje de controles preventivos vigentes en la flota.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 3: GRÁFICOS ANALÍTICOS EJECUTIVOS (ECHARTS) -->
            <!-- Gráfico 1: Stacked Horizontal Bar (Período + Km -> Kg Aprovechables vs Descarte + Gasto Combustible) -->
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div>
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-align-left text-success me-2"></i>Balance Mensual de Recuperación, Recorrido y Combustible
                            </h6>
                            <small class="text-muted">
                                Comparativa horizontal por período: <strong>Km recorridos</strong> en el eje izquierdo, proporción apilada de <strong>Kg aprovechables vs. Descarte rojo</strong> y <strong>Gasto de combustible</strong> al cierre de cada barra
                            </small>
                        </div>
                        <div class="d-flex flex-wrap gap-2 small">
                            <span class="badge bg-success-subtle text-success border border-success-subtle">■ Kg Aprovechables</span>
                            <span class="badge bg-danger-subtle text-danger border border-danger-subtle">■ Kg Descarte Rojo</span>
                            <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">⛽ Gasto Combustible</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="echarts-dir-evolucion" style="width: 100%; height: 410px;"></div>
                    </div>
                </div>
            </div>

            <!-- Gráfico 2: Calidad y Volumen por Origen Generador -->
            <div class="col-12 col-xl-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white border-bottom py-3">
                        <h6 class="fw-bold text-dark mb-0">
                            <i class="fas fa-award text-primary me-2"></i>Calidad de Clasificación por Origen (Top 10)
                        </h6>
                        <small class="text-muted">Desglose de Verde, Amarillo y Descarte Rojo por institución o empresa generadora</small>
                    </div>
                    <div class="card-body">
                        <div id="echarts-dir-origenes" style="width: 100%; height: 390px;"></div>
                    </div>
                </div>
            </div>

            <!-- Gráfico 3: Eficiencia Logística por Vehículo ($ Combustible / Kg Útil vs Kg Generados) -->
            <div class="col-12 col-xl-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white border-bottom py-3">
                        <h6 class="fw-bold text-dark mb-0">
                            <i class="fas fa-truck text-warning me-2"></i>Eficiencia por Unidad: Kg Útiles Generados vs. Costo / Kg
                        </h6>
                        <small class="text-muted">Relación entre volumen útil recuperado y costo unitario de combustible por vehículo</small>
                    </div>
                    <div class="card-body">
                        <div id="echarts-dir-flota" style="width: 100%; height: 390px;"></div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 4: PLANILLA EJECUTIVA DE RENDIMIENTO POR VEHÍCULO -->
            <div class="col-12 mb-4">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div>
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-table text-secondary me-2"></i>Planilla Ejecutiva de Rendimiento por Unidad de Flota
                            </h6>
                            <small class="text-muted">Auditoría integral de viajes HDR, kilómetros, combustible, cubiertas, carga útil e intervenciones de taller</small>
                        </div>
                        <button type="button" class="btn btn-outline-success btn-sm fw-bold" id="btn-dir-exportar-csv">
                            <i class="fas fa-file-csv me-1"></i>Exportar Planilla Flota (CSV)
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover table-striped align-middle mb-0 small">
                                <thead class="table-light text-uppercase">
                                    <tr>
                                        <th class="ps-3">Unidad / Patente</th>
                                        <th class="text-center">Viajes HDR</th>
                                        <th class="text-end">Km Reales</th>
                                        <th class="text-end">Litros</th>
                                        <th class="text-end">Gasto Comb.</th>
                                        <th class="text-end">Cubiertas Est.</th>
                                        <th class="text-end">Bruto (kg)</th>
                                        <th class="text-end text-success">Útil (kg)</th>
                                        <th class="text-end text-danger">Rojo (kg)</th>
                                        <th class="text-end text-primary">$ Comb / Kg Útil</th>
                                        <th class="text-center pe-3">Taller (Urg.)</th>
                                    </tr>
                                </thead>
                                <tbody id="tbody-dir-flota">
                                    <tr>
                                        <td colspan="11" class="text-center py-4 text-muted">Cargando planilla de flota...</td>
                                    </tr>
                                </tbody>
                                <tfoot class="table-light fw-bold" id="tfoot-dir-flota"></tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `);

        RegistrarEventos($contenedor);
        ConsultarDatosDashboard();
    }

    /* ======================================================================
       2. REGISTRO DE EVENTOS SPA (Con .off().on() para evitar memory leaks)
       ====================================================================== */

    function RegistrarEventos($contenedor) {
        $contenedor
            .off("click", "#btn-dir-filtrar")
            .on("click", "#btn-dir-filtrar", function () {
                ConsultarDatosDashboard();
            });

        $contenedor
            .off("click", "#btn-dir-limpiar")
            .on("click", "#btn-dir-limpiar", function () {
                const rangoDefault = ObtenerFechasPorDefecto();
                $("#dir-fecha-desde").val(rangoDefault.fechaDesde);
                $("#dir-fecha-hasta").val(rangoDefault.fechaHasta);
                $("#dir-valor-hora").val("9800");
                $("#dir-costo-cubiertas").val("1550000");
                ConsultarDatosDashboard();
            });

        $contenedor
            .off("click", "#btn-dir-exportar-csv")
            .on("click", "#btn-dir-exportar-csv", function () {
                ExportarPlanillaCSV();
            });

        $(window)
            .off("resize.dashboardDireccion")
            .on("resize.dashboardDireccion", function () {
                if (chartEvolucionEmbudo && !chartEvolucionEmbudo.isDisposed()) chartEvolucionEmbudo.resize();
                if (chartCalidadOrigenes && !chartCalidadOrigenes.isDisposed()) chartCalidadOrigenes.resize();
                if (chartRendimientoFlota && !chartRendimientoFlota.isDisposed()) chartRendimientoFlota.resize();
            });
    }

    /* ======================================================================
       3. CONSULTA A LA API Y ORQUESTACIÓN DE VISTAS
       ====================================================================== */

    function ConsultarDatosDashboard() {
        const fechaDesde = $("#dir-fecha-desde").val();
        const fechaHasta = $("#dir-fecha-hasta").val();
        const valorHoraRaw = parseFloat($("#dir-valor-hora").val());
        const costoCubiertasRaw = parseFloat($("#dir-costo-cubiertas").val());

        if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
            Swal.fire("Rango inválido", "La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.", "warning");
            return;
        }

        if ((!isNaN(valorHoraRaw) && valorHoraRaw < 0) || (!isNaN(costoCubiertasRaw) && costoCubiertasRaw < 0)) {
            Swal.fire("Valores inválidos", "Los costos de simulación no pueden ser negativos.", "warning");
            return;
        }

        $("#dir-badge-estado")
            .removeClass("bg-danger-subtle text-danger bg-success-subtle text-success")
            .addClass("bg-light text-secondary")
            .html('<i class="fas fa-circle-notch fa-spin me-1"></i>Actualizando...');

        $.ajax({
            type: "GET",
            url: URL_API_DIRECCION,
            dataType: "json",
            data: {
                fechaDesde: fechaDesde || null,
                fechaHasta: fechaHasta || null,
                valorHoraEmpleado: !isNaN(valorHoraRaw) && valorHoraRaw > 0 ? valorHoraRaw : null,
                costoJuegoCubiertas: !isNaN(costoCubiertasRaw) && costoCubiertasRaw > 0 ? costoCubiertasRaw : null
            },
            success: function (data) {
                $("#dir-badge-estado")
                    .removeClass("bg-light text-secondary")
                    .addClass("bg-success-subtle text-success")
                    .html('<i class="fas fa-check-circle me-1"></i>Datos actualizados');

                const kpis = (data && data.Kpis) || {};
                const evolucion = (data && data.EvolucionMensual) || [];
                const origenes = (data && data.CalidadPorOrigen) || [];
                const flota = (data && data.PlanillaFlota) || [];

                ultimaPlanillaFlota = flota;

                RenderizarKpis(kpis);
                RenderizarGraficoEvolucion(evolucion);
                RenderizarGraficoOrigenes(origenes);
                RenderizarGraficoFlota(flota);
                RenderizarPlanillaFlota(flota);
            },
            error: function (err) {
                console.error("SITMAS - Error al cargar Dashboard de Dirección:", err);
                $("#dir-badge-estado")
                    .removeClass("bg-light text-secondary")
                    .addClass("bg-danger-subtle text-danger")
                    .html('<i class="fas fa-exclamation-circle me-1"></i>Error de conexión');

                Swal.fire("Error", "No se pudieron obtener los indicadores ejecutivos desde el servidor.", "error");
            }
        });
    }

    /* ======================================================================
       4. RENDERIZADO DE KPIs (Mapeo exacto a KpisDireccionDto)
       ====================================================================== */

    function RenderizarKpis(k) {
        // Fila 1 - KPI 1: Ingreso Bruto
        $("#dir-kpi-bruto").text(`${FormatearDecimal(k.PesoBrutoTotal)} kg`);
        $("#dir-kpi-sub-bruto").text(
            `Camiones: ${FormatearDecimal(k.PesoBrutoCamiones)} kg • Part.: ${FormatearDecimal(k.PesoBrutoParticulares)} kg`
        );

        // Fila 1 - KPI 2: Material Útil Aprovechable
        $("#dir-kpi-util").text(`${FormatearDecimal(k.PesoUtilAprovechable)} kg`);
        $("#dir-kpi-sub-util").text(
            `Aprovech.: ${FormatearDecimal(k.PorcentajeAprovechamiento)} % • Descarte: ${FormatearDecimal(k.PorcentajeDescarteRojo)} %`
        );

        // Fila 1 - KPI 3: Costo Operativo Integral
        $("#dir-kpi-costo-integral").text(FormatearMoneda(k.CostoOperativoIntegral));
        $("#dir-kpi-sub-costo-integral").text(
            `Comb.: ${FormatearMoneda(k.GastoCombustible)} • M.O.: ${FormatearMoneda(k.CostoManoObraTotal)}`
        );

        // Fila 1 - KPI 4: Costo Unitario por Kg Útil
        $("#dir-kpi-costo-kg").text(`${FormatearMoneda(k.CostoIntegralPorKgUtil)} / kg`);
        $("#dir-kpi-sub-costo-kg").text(
            `Solo comb.: ${FormatearMoneda(k.CostoCombustiblePorKgUtil)} / kg • ${FormatearMoneda(k.CostoCombustiblePorKm)} / km`
        );

        // Fila 2 - KPI 5: Logística
        $("#dir-kpi-km").text(`${FormatearDecimal(k.TotalKmReales)} km`);
        $("#dir-kpi-sub-km").text(
            `${FormatearEntero(k.TotalHojasRutaEjecutadas)} HDR • ${FormatearEntero(k.MovimientosInternosSinHDR)} sin HDR • ${FormatearDecimal(k.TotalLitros)} L`
        );

        // Fila 2 - KPI 6: Horas Operativas
        $("#dir-kpi-horas").text(`${FormatearDecimal(k.TotalHorasOperativas)} hs`);
        $("#dir-kpi-sub-horas").text(
            `Chofer: ${FormatearDecimal(k.HorasChofer)}h • Clasif: ${FormatearDecimal(k.HorasClasificacion)}h • Stock: ${FormatearDecimal(k.HorasStock)}h`
        );

        // Fila 2 - KPI 7: Stock Utilizado
        $("#dir-kpi-stock").text(`${FormatearDecimal(k.PesoUtilizadoStock)} kg`);
        $("#dir-kpi-sub-stock").text(
            `Rotación: ${FormatearDecimal(k.TasaRotacionStockPct)} % • ${FormatearMoneda(k.CostoIntegralPorKgUtilizadoEnStock)} / kg`
        );

        // Fila 2 - KPI 8: Salud Preventiva Flota
        const saludPct = parseFloat(k.SaludPreventivaFlotaPct || 0);
        const $kpiSalud = $("#dir-kpi-salud");
        $kpiSalud
            .text(`${FormatearDecimal(saludPct)} %`)
            .removeClass("text-dark text-success text-warning text-danger")
            .addClass(saludPct >= 80 ? "text-success" : (saludPct >= 50 ? "text-warning" : "text-danger"));

        $("#dir-kpi-sub-salud").text(
            `${FormatearEntero(k.ServicesVencidos)}/${FormatearEntero(k.TotalControlesPreventivos)} vencidos • Cubiertas: ${FormatearDecimal(k.DesgastePromedioCubiertasPct)} %`
        );
    }

    /* ======================================================================
       5. VISUALIZACIONES ECHARTS
          5A. Stacked Horizontal Bar:
              Eje Y: Período + Km Reales
              Barras Apiladas (X): Kg Aprovechables vs. Kg Descarte
              Remate de Barra: Total Kg + Gasto Combustible ($)
       ====================================================================== */

    function RenderizarGraficoEvolucion(evolucion) {
        if (typeof echarts === "undefined") return;
        const dom = document.getElementById("echarts-dir-evolucion");
        if (!dom) return;

        if (!chartEvolucionEmbudo || chartEvolucionEmbudo.isDisposed()) {
            chartEvolucionEmbudo = echarts.init(dom);
        }

        if (!evolucion || evolucion.length === 0) {
            chartEvolucionEmbudo.clear();
            chartEvolucionEmbudo.setOption({
                title: {
                    text: "Sin movimientos registrados en el período seleccionado",
                    left: "center",
                    top: "middle",
                    textStyle: { color: "#6c757d", fontSize: 14, fontWeight: "normal" }
                }
            });
            return;
        }

        const periodos = evolucion.map((x, idx) => x.PeriodoLabel || x.PeriodoISO || `P-${idx + 1}`);
        const serieUtiles = evolucion.map(x => parseFloat(x.KgAprovechables || 0));
        const serieRojo = evolucion.map(x => parseFloat(x.KgDescarteRojo || 0));
        const serieGasto = evolucion.map(x => parseFloat(x.GastoCombustible || 0));
        const serieKm = evolucion.map(x => parseFloat(x.KmReales || 0));

        const option = {
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
                formatter: function (params) {
                    if (!params || params.length === 0) return "";
                    const idx = params[0].dataIndex;
                    const periodo = periodos[idx];
                    const kgUtil = serieUtiles[idx] || 0;
                    const kgRojo = serieRojo[idx] || 0;
                    const totalKg = kgUtil + kgRojo;
                    const km = serieKm[idx] || 0;
                    const gasto = serieGasto[idx] || 0;

                    const pctUtil = totalKg > 0 ? (kgUtil / totalKg) * 100 : 0;
                    const pctRojo = totalKg > 0 ? (kgRojo / totalKg) * 100 : 0;
                    const costoPorKgUtil = kgUtil > 0 ? (gasto / kgUtil) : 0;
                    const kgPorKm = km > 0 ? (kgUtil / km) : 0;

                    return `
                        <div style="min-width: 245px;">
                            <strong>📅 Período: ${periodo}</strong>
                            <hr style="margin: 5px 0;"/>
                            <span style="color:#198754;">● Kg Aprovechables:</span> <strong>${FormatearDecimal(kgUtil)} kg</strong> <small class="text-muted">(${FormatearDecimal(pctUtil)}%)</small><br/>
                            <span style="color:#dc3545;">● Kg Descarte Rojo:</span> <strong>${FormatearDecimal(kgRojo)} kg</strong> <small class="text-muted">(${FormatearDecimal(pctRojo)}%)</small><br/>
                            <span class="text-dark">📦 Total Procesado:</span> <strong>${FormatearDecimal(totalKg)} kg</strong>
                            <hr style="margin: 5px 0;"/>
                            🛣️ Km reales: <strong>${FormatearDecimal(km)} km</strong><br/>
                            ⛽ Gasto combustible: <strong>${FormatearMoneda(gasto)}</strong><br/>
                            <small class="text-primary fw-semibold">⚡ Eficiencia: ${FormatearMoneda(costoPorKgUtil)} / kg útil • ${FormatearDecimal(kgPorKm)} kg/km</small>
                        </div>
                    `;
                }
            },
            legend: {
                top: 0,
                data: ["Kg Aprovechables (Verde+Amarillo)", "Kg Descarte (Rojo)"]
            },
            grid: {
                left: "2%",
                right: 210,
                top: 42,
                bottom: 24,
                containLabel: true
            },
            xAxis: {
                type: "value",
                name: "Kilogramos (kg)",
                nameTextStyle: { color: "#64748b", fontWeight: "bold" },
                splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
                axisLabel: {
                    color: "#475569",
                    formatter: val => `${val.toLocaleString("es-AR")} kg`
                }
            },
            yAxis: {
                type: "category",
                inverse: true,
                data: periodos,
                axisLine: { lineStyle: { color: "#cbd5e1" } },
                axisTick: { show: false },
                axisLabel: {
                    margin: 12,
                    formatter: function (value, index) {
                        const km = serieKm[index] || 0;
                        return `{periodo|${value}}\n{km|🛣️ ${FormatearEntero(km)} km}`;
                    },
                    rich: {
                        periodo: {
                            fontWeight: "bold",
                            fontSize: 12,
                            color: "#1e293b",
                            lineHeight: 16
                        },
                        km: {
                            fontSize: 10.5,
                            color: "#64748b",
                            lineHeight: 14
                        }
                    }
                }
            },
            series: [
                {
                    name: "Kg Aprovechables (Verde+Amarillo)",
                    type: "bar",
                    stack: "material",
                    barMaxWidth: 34,
                    itemStyle: {
                        color: "#198754",
                        borderRadius: [4, 0, 0, 4]
                    },
                    label: {
                        show: true,
                        position: "inside",
                        color: "#ffffff",
                        fontWeight: "bold",
                        fontSize: 11,
                        formatter: params => params.value > 0 ? `${FormatearEntero(params.value)} kg` : ""
                    },
                    data: serieUtiles
                },
                {
                    name: "Kg Descarte (Rojo)",
                    type: "bar",
                    stack: "material",
                    barMaxWidth: 34,
                    itemStyle: {
                        color: "#dc3545",
                        borderRadius: [0, 4, 4, 0]
                    },
                    label: {
                        show: true,
                        position: "inside",
                        color: "#ffffff",
                        fontWeight: "bold",
                        fontSize: 10.5,
                        formatter: params => params.value > 0 ? `${FormatearEntero(params.value)} kg` : ""
                    },
                    data: serieRojo
                },
                {
                    name: "Resumen Financiero",
                    type: "bar",
                    stack: "material",
                    silent: true,
                    tooltip: { show: false },
                    itemStyle: { color: "transparent" },
                    label: {
                        show: true,
                        position: "right",
                        distance: 8,
                        formatter: function (params) {
                            const idx = params.dataIndex;
                            const totalKg = (serieUtiles[idx] || 0) + (serieRojo[idx] || 0);
                            const gasto = serieGasto[idx] || 0;
                            return `{total|${FormatearEntero(totalKg)} kg}  {gasto|⛽ ${FormatearMoneda(gasto)}}`;
                        },
                        rich: {
                            total: {
                                fontWeight: "bold",
                                fontSize: 11,
                                color: "#1e293b"
                            },
                            gasto: {
                                fontWeight: "bold",
                                fontSize: 10.5,
                                color: "#92400e",
                                backgroundColor: "#fef3c7",
                                borderColor: "#f59e0b",
                                borderWidth: 1,
                                borderRadius: 4,
                                padding: [2, 6]
                            }
                        }
                    },
                    data: evolucion.map(() => 0)
                }
            ]
        };

        chartEvolucionEmbudo.setOption(option, true);
    }

    function RenderizarGraficoOrigenes(origenes) {
        if (typeof echarts === "undefined") return;
        const dom = document.getElementById("echarts-dir-origenes");
        if (!dom) return;

        if (!chartCalidadOrigenes || chartCalidadOrigenes.isDisposed()) {
            chartCalidadOrigenes = echarts.init(dom);
        }

        if (!origenes || origenes.length === 0) {
            chartCalidadOrigenes.clear();
            chartCalidadOrigenes.setOption({
                title: {
                    text: "Sin entregas por origen en el período",
                    left: "center",
                    top: "middle",
                    textStyle: { color: "#6c757d", fontSize: 14, fontWeight: "normal" }
                }
            });
            return;
        }

        // Top 10 invertido para que el mayor quede arriba en barras horizontales
        const top10 = origenes.slice(0, 10).reverse();
        const nombres = top10.map(o => o.NombreOrigen);
        const serieVerde = top10.map(o => parseFloat(o.PesoVerde || 0));
        const serieAmarillo = top10.map(o => parseFloat(o.PesoAmarillo || 0));
        const serieRojo = top10.map(o => parseFloat(o.PesoRojoDescarte || 0));

        const option = {
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
                formatter: function (params) {
                    if (!params || params.length === 0) return "";
                    const item = top10[params[0].dataIndex];
                    return `
                        <strong>${item.NombreOrigen}</strong> <small class="text-muted">(${item.Canal})</small><br/>
                        Entregas: <strong>${FormatearEntero(item.CantidadEntregas)}</strong> • Bruto: <strong>${FormatearDecimal(item.PesoBrutoTotal)} kg</strong><hr style="margin:4px 0;"/>
                        <span style="color:#198754;">● Verde:</span> <strong>${FormatearDecimal(item.PesoVerde)} kg</strong><br/>
                        <span style="color:#ffc107;">● Amarillo:</span> <strong>${FormatearDecimal(item.PesoAmarillo)} kg</strong><br/>
                        <span style="color:#dc3545;">● Rojo Descarte:</span> <strong>${FormatearDecimal(item.PesoRojoDescarte)} kg</strong><br/>
                        Calidad Útil: <strong>${FormatearDecimal(item.PorcentajeCalidadUtil)} %</strong>
                    `;
                }
            },
            legend: {
                top: 0,
                data: ["Verde (kg)", "Amarillo (kg)", "Rojo Descarte (kg)"]
            },
            grid: { left: "3%", right: "6%", bottom: "4%", top: 38, containLabel: true },
            xAxis: {
                type: "value",
                axisLabel: { formatter: val => `${val.toLocaleString("es-AR")} kg` }
            },
            yAxis: {
                type: "category",
                data: nombres,
                axisLabel: {
                    width: 130,
                    overflow: "truncate",
                    fontSize: 11,
                    color: "#343a40"
                }
            },
            series: [
                {
                    name: "Verde (kg)",
                    type: "bar",
                    stack: "calidad",
                    itemStyle: { color: "#198754" },
                    data: serieVerde
                },
                {
                    name: "Amarillo (kg)",
                    type: "bar",
                    stack: "calidad",
                    itemStyle: { color: "#ffc107" },
                    data: serieAmarillo
                },
                {
                    name: "Rojo Descarte (kg)",
                    type: "bar",
                    stack: "calidad",
                    itemStyle: { color: "#dc3545" },
                    data: serieRojo
                }
            ]
        };

        chartCalidadOrigenes.setOption(option, true);
    }

    function RenderizarGraficoFlota(flota) {
        if (typeof echarts === "undefined") return;
        const dom = document.getElementById("echarts-dir-flota");
        if (!dom) return;

        if (!chartRendimientoFlota || chartRendimientoFlota.isDisposed()) {
            chartRendimientoFlota = echarts.init(dom);
        }

        // Excluimos vehículos sin actividad (ej. "Particular" con 0 viajes y 0 km) para no distorsionar la escala
        const unidadesActivas = (flota || []).filter(v =>
            (v.ViajesHDR > 0 || v.KmReales > 0 || v.KgUtilesGenerados > 0)
        );

        if (unidadesActivas.length === 0) {
            chartRendimientoFlota.clear();
            chartRendimientoFlota.setOption({
                title: {
                    text: "Sin actividad de flota registrada en el período",
                    left: "center",
                    top: "middle",
                    textStyle: { color: "#6c757d", fontSize: 14, fontWeight: "normal" }
                }
            });
            return;
        }

        const patentes = unidadesActivas.map(v => v.Patente);
        const kgUtiles = unidadesActivas.map(v => parseFloat(v.KgUtilesGenerados || 0));
        const costoPorKg = unidadesActivas.map(v => parseFloat(v.CostoCombustiblePorKgUtil || 0));

        const option = {
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
                formatter: function (params) {
                    if (!params || params.length === 0) return "";
                    const v = unidadesActivas[params[0].dataIndex];
                    return `
                        <strong>${v.Patente}</strong> (${v.MarcaModelo})<br/>
                        Viajes HDR: <strong>${FormatearEntero(v.ViajesHDR)}</strong> • Recorrido: <strong>${FormatearDecimal(v.KmReales)} km</strong><hr style="margin:4px 0;"/>
                        Kg Útiles Generados: <strong class="text-success">${FormatearDecimal(v.KgUtilesGenerados)} kg</strong><br/>
                        Gasto Combustible: <strong>${FormatearMoneda(v.GastoCombustible)}</strong><br/>
                        Costo Comb. / Kg Útil: <strong class="text-primary">${FormatearMoneda(v.CostoCombustiblePorKgUtil)} / kg</strong>
                    `;
                }
            },
            legend: {
                top: 0,
                data: ["Kg Útiles Generados", "Costo Combustible / Kg Útil ($)"]
            },
            grid: { left: "3%", right: "4%", bottom: "6%", top: 44, containLabel: true },
            xAxis: {
                type: "category",
                data: patentes,
                axisLabel: { fontWeight: "bold", color: "#343a40" }
            },
            yAxis: [
                {
                    type: "value",
                    name: "Kg Útiles",
                    axisLabel: { formatter: val => `${val.toLocaleString("es-AR")} kg` }
                },
                {
                    type: "value",
                    name: "$ / Kg Útil",
                    axisLabel: { formatter: val => `$ ${val.toLocaleString("es-AR")}` }
                }
            ],
            series: [
                {
                    name: "Kg Útiles Generados",
                    type: "bar",
                    barMaxWidth: 38,
                    itemStyle: { color: "#0d6efd", borderRadius: [4, 4, 0, 0] },
                    data: kgUtiles
                },
                {
                    name: "Costo Combustible / Kg Útil ($)",
                    type: "line",
                    yAxisIndex: 1,
                    smooth: true,
                    symbolSize: 9,
                    itemStyle: { color: "#d97706" },
                    lineStyle: { width: 3 },
                    data: costoPorKg
                }
            ]
        };

        chartRendimientoFlota.setOption(option, true);
    }

    /* ======================================================================
       6. PLANILLA EJECUTIVA DE RENDIMIENTO POR VEHÍCULO (PlanillaFlota)
       ====================================================================== */

    function RenderizarPlanillaFlota(flota) {
        const $tbody = $("#tbody-dir-flota");
        const $tfoot = $("#tfoot-dir-flota");
        $tbody.empty();
        $tfoot.empty();

        if (!flota || flota.length === 0) {
            $tbody.html('<tr><td colspan="11" class="text-center py-4 text-muted">No hay registros de flota para el período seleccionado.</td></tr>');
            return;
        }

        let totViajes = 0;
        let totKm = 0;
        let totLitros = 0;
        let totCombustible = 0;
        let totCubiertas = 0;
        let totBruto = 0;
        let totUtil = 0;
        let totRojo = 0;
        let totTaller = 0;
        let totUrgencias = 0;

        flota.forEach(v => {
            const viajes = parseInt(v.ViajesHDR || 0, 10);
            const km = parseFloat(v.KmReales || 0);
            const litros = parseFloat(v.LitrosConsumidos || 0);
            const comb = parseFloat(v.GastoCombustible || 0);
            const cubiertas = parseFloat(v.CostoCubiertasEstimado || 0);
            const bruto = parseFloat(v.KgTransportadosBruto || 0);
            const util = parseFloat(v.KgUtilesGenerados || 0);
            const rojo = parseFloat(v.KgDescarteGenerado || 0);
            const costoKg = parseFloat(v.CostoCombustiblePorKgUtil || 0);
            const taller = parseInt(v.IntervencionesTallerPeriodo || 0, 10);
            const urgencias = parseInt(v.CorrectivosUrgenciasPeriodo || 0, 10);

            totViajes += viajes;
            totKm += km;
            totLitros += litros;
            totCombustible += comb;
            totCubiertas += cubiertas;
            totBruto += bruto;
            totUtil += util;
            totRojo += rojo;
            totTaller += taller;
            totUrgencias += urgencias;

            const badgeTaller = urgencias > 0
                ? `<span class="badge bg-danger">${taller} (${urgencias} urg.)</span>`
                : (taller > 0 ? `<span class="badge bg-warning text-dark">${taller} (0 urg.)</span>` : `<span class="badge bg-light text-secondary">0</span>`);

            $tbody.append(`
                <tr>
                    <td class="ps-3">
                        <span class="fw-bold text-dark d-block">${v.Patente}</span>
                        <small class="text-muted">${v.MarcaModelo}</small>
                    </td>
                    <td class="text-center fw-semibold">${FormatearEntero(viajes)}</td>
                    <td class="text-end">${FormatearDecimal(km)}</td>
                    <td class="text-end">${FormatearDecimal(litros)}</td>
                    <td class="text-end fw-semibold">${FormatearMoneda(comb)}</td>
                    <td class="text-end text-muted">${FormatearMoneda(cubiertas)}</td>
                    <td class="text-end">${FormatearDecimal(bruto)}</td>
                    <td class="text-end text-success fw-bold">${FormatearDecimal(util)}</td>
                    <td class="text-end text-danger">${FormatearDecimal(rojo)}</td>
                    <td class="text-end text-primary fw-semibold">${FormatearMoneda(costoKg)}</td>
                    <td class="text-center pe-3">${badgeTaller}</td>
                </tr>
            `);
        });

        const costoPromedioGlobalKg = totUtil > 0 ? (totCombustible / totUtil) : 0;

        $tfoot.html(`
            <tr>
                <td class="ps-3">TOTAL FLOTA</td>
                <td class="text-center">${FormatearEntero(totViajes)}</td>
                <td class="text-end">${FormatearDecimal(totKm)}</td>
                <td class="text-end">${FormatearDecimal(totLitros)}</td>
                <td class="text-end">${FormatearMoneda(totCombustible)}</td>
                <td class="text-end">${FormatearMoneda(totCubiertas)}</td>
                <td class="text-end">${FormatearDecimal(totBruto)}</td>
                <td class="text-end text-success">${FormatearDecimal(totUtil)}</td>
                <td class="text-end text-danger">${FormatearDecimal(totRojo)}</td>
                <td class="text-end text-primary">${FormatearMoneda(costoPromedioGlobalKg)}</td>
                <td class="text-center pe-3">${totTaller} (${totUrgencias} urg.)</td>
            </tr>
        `);
    }

    /* ======================================================================
       7. EXPORTACIÓN CSV COMPATIBLE CON EXCEL (es-AR)
       ====================================================================== */

    function ExportarPlanillaCSV() {
        if (!ultimaPlanillaFlota || ultimaPlanillaFlota.length === 0) {
            Swal.fire("Sin datos", "No hay filas en la planilla de flota para exportar.", "info");
            return;
        }

        const encabezados = [
            "Patente", "Marca y Modelo", "Viajes HDR", "Km Reales",
            "Litros Consumidos", "Gasto Combustible ($)", "Costo Cubiertas Est. ($)",
            "Kg Transportados Bruto", "Kg Utiles Generados", "Kg Descarte Generado",
            "Costo Combustible por Kg Util ($)", "Intervenciones Taller", "Correctivos Urgencias"
        ];

        const filas = ultimaPlanillaFlota.map(v => [
            v.Patente,
            v.MarcaModelo,
            v.ViajesHDR || 0,
            FormatearDecimal(v.KmReales),
            FormatearDecimal(v.LitrosConsumidos),
            FormatearDecimal(v.GastoCombustible),
            FormatearDecimal(v.CostoCubiertasEstimado),
            FormatearDecimal(v.KgTransportadosBruto),
            FormatearDecimal(v.KgUtilesGenerados),
            FormatearDecimal(v.KgDescarteGenerado),
            FormatearDecimal(v.CostoCombustiblePorKgUtil),
            v.IntervencionesTallerPeriodo || 0,
            v.CorrectivosUrgenciasPeriodo || 0
        ].join(";"));

        const contenidoCSV = "\uFEFF" + [encabezados.join(";"), ...filas].join("\n");
        const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `SITMAS_Direccion_Flota_${$("#dir-fecha-desde").val()}_${$("#dir-fecha-hasta").val()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Interfaz pública del módulo SPA
    return {
        cargarEn: cargarEn
    };
})();











// /* ==========================================================================
//    SITMAS - Módulo: Dashboard Ejecutivo de Dirección / Gerencia (SPA)
//    Roles habilitados: Direccion, Administrador
//    Contrato API: GET /api/DashboardUsuariosRol/Direccion (4 Result Sets)
//      1. Kpis (Embudo físico, costos operativos, $/kg útil y salud de flota)
//      2. EvolucionMensual (Kg aprovechables, descarte rojo, km y combustible)
//      3. CalidadPorOrigen (Ranking de generadores y % calidad útil)
//      4. PlanillaFlota (Rendimiento físico, financiero y taller por vehículo)
//    ========================================================================== */

// const DashboardDireccionModulo = (function () {
//     "use strict";

//     const URL_API_DIRECCION = "https://localhost:44325/api/DashboardUsuariosRol/Direccion";

//     // Estado interno aislado del módulo
//     let contenedorActualId = "panel-graficos";
//     let chartEvolucionEmbudo = null;
//     let chartCalidadOrigenes = null;
//     let chartRendimientoFlota = null;
//     let ultimaPlanillaFlota = [];

//     /* ======================================================================
//        HELPERS DE FORMATEO (es-AR) Y GESTIÓN DE MEMORIA ECHARTS
//        ====================================================================== */

//     function FormatearDecimal(valor) {
//         const num = parseFloat(valor || 0);
//         return num.toLocaleString("es-AR", {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2
//         });
//     }

//     function FormatearMoneda(valor) {
//         const num = parseFloat(valor || 0);
//         return "$ " + num.toLocaleString("es-AR", {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2
//         });
//     }

//     function FormatearEntero(valor) {
//         const num = parseInt(valor || 0, 10);
//         return num.toLocaleString("es-AR");
//     }

//     function ObtenerFechasPorDefecto() {
//         const hoy = new Date();
//         const anio = hoy.getFullYear();
//         const mes = String(hoy.getMonth() + 1).padStart(2, "0");
//         const dia = String(hoy.getDate()).padStart(2, "0");

//         return {
//             fechaDesde: `${anio}-01-01`,
//             fechaHasta: `${anio}-${mes}-${dia}`
//         };
//     }

//     function DestruirGraficos() {
//         [chartEvolucionEmbudo, chartCalidadOrigenes, chartRendimientoFlota].forEach(instancia => {
//             if (instancia && !instancia.isDisposed()) {
//                 instancia.dispose();
//             }
//         });
//         chartEvolucionEmbudo = null;
//         chartCalidadOrigenes = null;
//         chartRendimientoFlota = null;
//     }

//     /* ======================================================================
//        1. RENDERIZADO DEL ESQUELETO HTML EN EL CONTENEDOR SPA
//        ====================================================================== */

//     function cargarEn(contenedorId = "panel-graficos") {
//         contenedorActualId = contenedorId;
//         const $contenedor = $(`#${contenedorActualId}`);
//         if ($contenedor.length === 0) return;

//         DestruirGraficos();

//         const sesionString = localStorage.getItem("usuarioSesion");
//         const sesion = sesionString ? JSON.parse(sesionString) : {};
//         const nombreUsuario = sesion.nombre || "Dirección General";

//         const opcionesFecha = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
//         const fechaCruda = new Date().toLocaleDateString("es-AR", opcionesFecha);
//         const fechaHoyTexto = fechaCruda.charAt(0).toUpperCase() + fechaCruda.slice(1);

//         const rangoDefault = ObtenerFechasPorDefecto();

//         $contenedor.html(`
//             <!-- NIVEL 1: SALUDO UNIFICADO + BARRA DE FILTROS Y SIMULACIÓN DE COSTOS -->
//             <div class="col-12">
//                 <div class="bg-white p-3 p-md-4 rounded shadow-sm border-start border-4 border-success">
//                     <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
//                         <div>
//                             <h4 class="fw-bold text-dark mb-1">
//                                 👋 ¡Hola, ${nombreUsuario}!
//                             </h4>
//                             <small class="text-muted">
//                                 Tablero Ejecutivo de Dirección • Embudo Operativo y Financiero EMEC • ${fechaHoyTexto}
//                             </small>
//                         </div>
//                         <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2" id="dir-badge-estado">
//                             <i class="fas fa-circle-notch fa-spin me-1"></i>Cargando indicadores...
//                         </span>
//                     </div>

//                     <div class="row g-3 align-items-end">
//                         <div class="col-12 col-sm-6 col-xl-2">
//                             <label for="dir-fecha-desde" class="form-label small fw-bold text-secondary mb-1">
//                                 <i class="fas fa-calendar-alt me-1 text-primary"></i>Fecha Desde
//                             </label>
//                             <input type="date" class="form-control form-control-sm" id="dir-fecha-desde" value="${rangoDefault.fechaDesde}">
//                         </div>

//                         <div class="col-12 col-sm-6 col-xl-2">
//                             <label for="dir-fecha-hasta" class="form-label small fw-bold text-secondary mb-1">
//                                 <i class="fas fa-calendar-check me-1 text-primary"></i>Fecha Hasta
//                             </label>
//                             <input type="date" class="form-control form-control-sm" id="dir-fecha-hasta" value="${rangoDefault.fechaHasta}">
//                         </div>

//                         <!--<div class="col-12 col-sm-6 col-xl-3">
//                             <label for="dir-valor-hora" class="form-label small fw-bold text-secondary mb-1">
//                                 <i class="fas fa-user-clock me-1 text-success"></i>Simular Valor Hora ($ ARS)
//                             </label>
//                             <input type="number" min="0" step="100" class="form-control form-control-sm" id="dir-valor-hora" placeholder="Ej: 4500 (0 = solo combustible)">
//                         </div>

//                         <div class="col-12 col-sm-6 col-xl-2">
//                             <label for="dir-costo-cubiertas" class="form-label small fw-bold text-secondary mb-1">
//                                 <i class="fas fa-circle-notch me-1 text-warning"></i>Juego Cubiertas ($)
//                             </label>
//                             <input type="number" min="0" step="10000" class="form-control form-control-sm" id="dir-costo-cubiertas" placeholder="Ej: 2400000">
//                         </div>-->

//                         <div class="col-12 col-xl-3 d-flex gap-2">
//                             <button type="button" class="btn btn-success btn-sm fw-bold flex-grow-1" id="btn-dir-filtrar">
//                                 <i class="fas fa-sync-alt me-1"></i>Actualizar
//                             </button>
//                             <button type="button" class="btn btn-outline-secondary btn-sm fw-semibold" id="btn-dir-limpiar" title="Restablecer año actual y simulación">
//                                 <i class="fas fa-undo me-1"></i>Reset
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 2A: FILA SUPERIOR DE KPIs (EMBUDO FÍSICO Y COSTO INTEGRAL) -->
//             <div class="col-12">
//                 <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
//                     <!-- KPI 1: Ingreso Bruto a Planta -->
//                     <div class="col">
//                         <div class="card border-0 border-start border-primary border-4 shadow-sm h-100"
//                              style="background: linear-gradient(135deg, #eef4ff 0%, #ffffff 100%);">
//                             <div class="card-body py-3">
//                                 <div class="d-flex justify-content-between align-items-center mb-2">
//                                     <span class="small fw-bold text-uppercase" style="color: #1e40af;">Ingreso Bruto Total</span>
//                                     <div class="rounded-3 d-flex align-items-center justify-content-center"
//                                          style="width: 36px; height: 36px; background-color: rgba(13, 110, 253, 0.12);">
//                                         <i class="fas fa-truck-loading text-primary"></i>
//                                     </div>
//                                 </div>
//                                 <h3 class="fw-bold text-dark mb-1" id="dir-kpi-bruto">0,00 kg</h3>
//                                 <small class="text-secondary fw-medium d-block text-truncate" id="dir-kpi-sub-bruto">
//                                     Camiones: 0 kg • Particulares: 0 kg
//                                 </small>
//                             </div>
//                         </div>
//                     </div>

//                     <!-- KPI 2: Material Útil Aprovechable -->
//                     <div class="col">
//                         <div class="card border-0 border-start border-success border-4 shadow-sm h-100"
//                              style="background: linear-gradient(135deg, #eaf7ef 0%, #ffffff 100%);">
//                             <div class="card-body py-3">
//                                 <div class="d-flex justify-content-between align-items-center mb-2">
//                                     <span class="small fw-bold text-uppercase" style="color: #166534;">Material Útil Recuperado</span>
//                                     <div class="rounded-3 d-flex align-items-center justify-content-center"
//                                          style="width: 36px; height: 36px; background-color: rgba(25, 135, 84, 0.14);">
//                                         <i class="fas fa-recycle text-success"></i>
//                                     </div>
//                                 </div>
//                                 <h3 class="fw-bold text-success mb-1" id="dir-kpi-util">0,00 kg</h3>
//                                 <small class="text-secondary fw-medium d-block text-truncate" id="dir-kpi-sub-util">
//                                     Aprovechamiento: 0,00 % • Rojo: 0,00 %
//                                 </small>
//                             </div>
//                         </div>
//                     </div>

//                     <!-- KPI 3: Costo Operativo Integral -->
//                     <div class="col">
//                         <div class="card border-0 border-start border-4 shadow-sm h-100"
//                              style="border-color: #d97706 !important; background: linear-gradient(135deg, #fff8e6 0%, #ffffff 100%);">
//                             <div class="card-body py-3">
//                                 <div class="d-flex justify-content-between align-items-center mb-2">
//                                     <span class="small fw-bold text-uppercase" style="color: #92400e;">Costo Operativo Integral</span>
//                                     <div class="rounded-3 d-flex align-items-center justify-content-center"
//                                          style="width: 36px; height: 36px; background-color: rgba(217, 119, 6, 0.14);">
//                                         <i class="fas fa-file-invoice-dollar" style="color: #d97706;"></i>
//                                     </div>
//                                 </div>
//                                 <h3 class="fw-bold text-dark mb-1" id="dir-kpi-costo-integral">$ 0,00</h3>
//                                 <small class="text-secondary fw-medium d-block text-truncate" id="dir-kpi-sub-costo-integral">
//                                     Combustible: $ 0,00 • M.O.: $ 0,00
//                                 </small>
//                             </div>
//                         </div>
//                     </div>

//                     <!-- KPI 4: Costo Unitario por Kg Útil -->
//                     <div class="col">
//                         <div class="card border-0 border-start border-4 shadow-sm h-100"
//                              style="border-color: #0891b2 !important; background: linear-gradient(135deg, #e8f7fa 0%, #ffffff 100%);">
//                             <div class="card-body py-3">
//                                 <div class="d-flex justify-content-between align-items-center mb-2">
//                                     <span class="small fw-bold text-uppercase" style="color: #155e75;">Costo Unitario / Kg Útil</span>
//                                     <div class="rounded-3 d-flex align-items-center justify-content-center"
//                                          style="width: 36px; height: 36px; background-color: rgba(8, 145, 178, 0.14);">
//                                         <i class="fas fa-balance-scale-right" style="color: #0891b2;"></i>
//                                     </div>
//                                 </div>
//                                 <h3 class="fw-bold text-dark mb-1" id="dir-kpi-costo-kg">$ 0,00 / kg</h3>
//                                 <small class="text-secondary fw-medium d-block text-truncate" id="dir-kpi-sub-costo-kg">
//                                     Solo combustible: $ 0,00 / kg
//                                 </small>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 2B: FILA INFERIOR DE KPIs (LOGÍSTICA, HORAS, STOCK Y SALUD DE FLOTA) -->
//             <div class="col-12">
//                 <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
//                     <!-- KPI 5: Logística y Recorridos -->
//                     <div class="col">
//                         <div class="card border-0 shadow-sm h-100 bg-white">
//                             <div class="card-body py-2 px-3">
//                                 <div class="d-flex justify-content-between align-items-center">
//                                     <span class="small fw-bold text-muted text-uppercase">Logística Ejecutada</span>
//                                     <i class="fas fa-route text-primary"></i>
//                                 </div>
//                                 <h5 class="fw-bold text-dark my-1" id="dir-kpi-km">0,00 km</h5>
//                                 <small class="text-muted d-block text-truncate" id="dir-kpi-sub-km">
//                                     0 HDR • 0 mov. sin HDR • 0,00 L
//                                 </small>
//                             </div>
//                         </div>
//                     </div>

//                     <!-- KPI 6: Horas Operativas -->
//                     <div class="col">
//                         <div class="card border-0 shadow-sm h-100 bg-white">
//                             <div class="card-body py-2 px-3">
//                                 <div class="d-flex justify-content-between align-items-center">
//                                     <span class="small fw-bold text-muted text-uppercase">Horas Operativas</span>
//                                     <i class="fas fa-clock text-success"></i>
//                                 </div>
//                                 <h5 class="fw-bold text-dark my-1" id="dir-kpi-horas">0,00 hs</h5>
//                                 <small class="text-muted d-block text-truncate" id="dir-kpi-sub-horas">
//                                     Chofer: 0h • Clasif: 0h • Stock: 0h
//                                 </small>
//                             </div>
//                         </div>
//                     </div>

//                     <!-- KPI 7: Utilización y Rotación de Stock -->
//                     <div class="col">
//                         <div class="card border-0 shadow-sm h-100 bg-white">
//                             <div class="card-body py-2 px-3">
//                                 <div class="d-flex justify-content-between align-items-center">
//                                     <span class="small fw-bold text-muted text-uppercase">Salida / Uso en Stock</span>
//                                     <i class="fas fa-boxes text-warning"></i>
//                                 </div>
//                                 <h5 class="fw-bold text-dark my-1" id="dir-kpi-stock">0,00 kg</h5>
//                                 <small class="text-muted d-block text-truncate" id="dir-kpi-sub-stock">
//                                     Rotación: 0,00 % • $ 0,00 / kg usado
//                                 </small>
//                             </div>
//                         </div>
//                     </div>

//                     <!-- KPI 8: Salud Preventiva de Flota -->
//                     <div class="col">
//                         <div class="card border-0 shadow-sm h-100 bg-white">
//                             <div class="card-body py-2 px-3">
//                                 <div class="d-flex justify-content-between align-items-center">
//                                     <span class="small fw-bold text-muted text-uppercase">Salud Preventiva Flota</span>
//                                     <i class="fas fa-heartbeat text-danger"></i>
//                                 </div>
//                                 <h5 class="fw-bold text-dark my-1" id="dir-kpi-salud">0,00 %</h5>
//                                 <small class="text-muted d-block text-truncate" id="dir-kpi-sub-salud">
//                                     0 services vencidos • Desgaste cubiertas: 0 %
//                                 </small>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 3: GRÁFICOS ANALÍTICOS EJECUTIVOS (ECHARTS) -->
//             <!-- Gráfico 1: Evolución Mensual del Embudo (Kg Útiles, Descarte y Gasto Combustible) -->
//             <div class="col-12">
//                 <div class="card border-0 shadow-sm">
//                     <div class="card-header bg-white border-bottom py-3">
//                         <h6 class="fw-bold text-dark mb-0">
//                             <i class="fas fa-chart-line text-success me-2"></i>Evolución Mensual: Material Recuperado vs. Descarte y Gasto de Combustible
//                         </h6>
//                         <small class="text-muted">
//                             Comparativa mensual de kilogramos aprovechables (Verde + Amarillo), descarte rojo y evolución del gasto logístico en combustible
//                         </small>
//                     </div>
//                     <div class="card-body">
//                         <div id="echarts-dir-evolucion" style="width: 100%; height: 380px;"></div>
//                     </div>
//                 </div>
//             </div>

//             <!-- Gráfico 2: Calidad y Volumen por Origen Generador -->
//             <div class="col-12 col-xl-6">
//                 <div class="card border-0 shadow-sm h-100">
//                     <div class="card-header bg-white border-bottom py-3">
//                         <h6 class="fw-bold text-dark mb-0">
//                             <i class="fas fa-award text-primary me-2"></i>Calidad de Clasificación por Origen (Top 10)
//                         </h6>
//                         <small class="text-muted">Desglose de Verde, Amarillo y Descarte Rojo por institución o empresa generadora</small>
//                     </div>
//                     <div class="card-body">
//                         <div id="echarts-dir-origenes" style="width: 100%; height: 390px;"></div>
//                     </div>
//                 </div>
//             </div>

//             <!-- Gráfico 3: Eficiencia Logística por Vehículo ($ Combustible / Kg Útil vs Kg Generados) -->
//             <div class="col-12 col-xl-6">
//                 <div class="card border-0 shadow-sm h-100">
//                     <div class="card-header bg-white border-bottom py-3">
//                         <h6 class="fw-bold text-dark mb-0">
//                             <i class="fas fa-truck text-warning me-2"></i>Eficiencia por Unidad: Kg Útiles Generados vs. Costo / Kg
//                         </h6>
//                         <small class="text-muted">Relación entre volumen útil recuperado y costo unitario de combustible por vehículo</small>
//                     </div>
//                     <div class="card-body">
//                         <div id="echarts-dir-flota" style="width: 100%; height: 390px;"></div>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 4: PLANILLA EJECUTIVA DE RENDIMIENTO POR VEHÍCULO -->
//             <div class="col-12 mb-4">
//                 <div class="card border-0 shadow-sm">
//                     <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
//                         <div>
//                             <h6 class="fw-bold text-dark mb-0">
//                                 <i class="fas fa-table text-secondary me-2"></i>Planilla Ejecutiva de Rendimiento por Unidad de Flota
//                             </h6>
//                             <small class="text-muted">Auditoría integral de viajes HDR, kilómetros, combustible, cubiertas, carga útil e intervenciones de taller</small>
//                         </div>
//                         <button type="button" class="btn btn-outline-success btn-sm fw-bold" id="btn-dir-exportar-csv">
//                             <i class="fas fa-file-csv me-1"></i>Exportar Planilla Flota (CSV)
//                         </button>
//                     </div>
//                     <div class="card-body p-0">
//                         <div class="table-responsive">
//                             <table class="table table-hover table-striped align-middle mb-0 small">
//                                 <thead class="table-light text-uppercase">
//                                     <tr>
//                                         <th class="ps-3">Unidad / Patente</th>
//                                         <th class="text-center">Viajes HDR</th>
//                                         <th class="text-end">Km Reales</th>
//                                         <th class="text-end">Litros</th>
//                                         <th class="text-end">Gasto Comb.</th>
//                                         <th class="text-end">Cubiertas Est.</th>
//                                         <th class="text-end">Bruto (kg)</th>
//                                         <th class="text-end text-success">Útil (kg)</th>
//                                         <th class="text-end text-danger">Rojo (kg)</th>
//                                         <th class="text-end text-primary">$ Comb / Kg Útil</th>
//                                         <th class="text-center pe-3">Taller (Urg.)</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody id="tbody-dir-flota">
//                                     <tr>
//                                         <td colspan="11" class="text-center py-4 text-muted">Cargando planilla de flota...</td>
//                                     </tr>
//                                 </tbody>
//                                 <tfoot class="table-light fw-bold" id="tfoot-dir-flota"></tfoot>
//                             </table>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `);

//         RegistrarEventos($contenedor);
//         ConsultarDatosDashboard();
//     }

//     /* ======================================================================
//        2. REGISTRO DE EVENTOS SPA (Con .off().on() para evitar memory leaks)
//        ====================================================================== */

//     function RegistrarEventos($contenedor) {
//         $contenedor
//             .off("click", "#btn-dir-filtrar")
//             .on("click", "#btn-dir-filtrar", function () {
//                 ConsultarDatosDashboard();
//             });

//         $contenedor
//             .off("click", "#btn-dir-limpiar")
//             .on("click", "#btn-dir-limpiar", function () {
//                 const rangoDefault = ObtenerFechasPorDefecto();
//                 $("#dir-fecha-desde").val(rangoDefault.fechaDesde);
//                 $("#dir-fecha-hasta").val(rangoDefault.fechaHasta);
//                 $("#dir-valor-hora").val("9800");
//                 $("#dir-costo-cubiertas").val("1550000");
//                 ConsultarDatosDashboard();
//             });

//         $contenedor
//             .off("click", "#btn-dir-exportar-csv")
//             .on("click", "#btn-dir-exportar-csv", function () {
//                 ExportarPlanillaCSV();
//             });

//         $(window)
//             .off("resize.dashboardDireccion")
//             .on("resize.dashboardDireccion", function () {
//                 if (chartEvolucionEmbudo && !chartEvolucionEmbudo.isDisposed()) chartEvolucionEmbudo.resize();
//                 if (chartCalidadOrigenes && !chartCalidadOrigenes.isDisposed()) chartCalidadOrigenes.resize();
//                 if (chartRendimientoFlota && !chartRendimientoFlota.isDisposed()) chartRendimientoFlota.resize();
//             });
//     }

//     /* ======================================================================
//        3. CONSULTA A LA API Y ORQUESTACIÓN DE VISTAS
//        ====================================================================== */

//     function ConsultarDatosDashboard() {
//         const fechaDesde = $("#dir-fecha-desde").val();
//         const fechaHasta = $("#dir-fecha-hasta").val();
//         const valorHoraRaw = parseFloat($("#dir-valor-hora").val());
//         const costoCubiertasRaw = parseFloat($("#dir-costo-cubiertas").val());

//         if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
//             Swal.fire("Rango inválido", "La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.", "warning");
//             return;
//         }

//         if ((!isNaN(valorHoraRaw) && valorHoraRaw < 0) || (!isNaN(costoCubiertasRaw) && costoCubiertasRaw < 0)) {
//             Swal.fire("Valores inválidos", "Los costos de simulación no pueden ser negativos.", "warning");
//             return;
//         }

//         $("#dir-badge-estado")
//             .removeClass("bg-danger-subtle text-danger bg-success-subtle text-success")
//             .addClass("bg-light text-secondary")
//             .html('<i class="fas fa-circle-notch fa-spin me-1"></i>Actualizando...');

//         $.ajax({
//             type: "GET",
//             url: URL_API_DIRECCION,
//             dataType: "json",
//             data: {
//                 fechaDesde: fechaDesde || null,
//                 fechaHasta: fechaHasta || null,
//                 valorHoraEmpleado: !isNaN(valorHoraRaw) && valorHoraRaw > 0 ? valorHoraRaw : null,
//                 costoJuegoCubiertas: !isNaN(costoCubiertasRaw) && costoCubiertasRaw > 0 ? costoCubiertasRaw : null
//             },
//             success: function (data) {
//                 $("#dir-badge-estado")
//                     .removeClass("bg-light text-secondary")
//                     .addClass("bg-success-subtle text-success")
//                     .html('<i class="fas fa-check-circle me-1"></i>Datos actualizados');

//                 const kpis = (data && data.Kpis) || {};
//                 const evolucion = (data && data.EvolucionMensual) || [];
//                 const origenes = (data && data.CalidadPorOrigen) || [];
//                 const flota = (data && data.PlanillaFlota) || [];

//                 ultimaPlanillaFlota = flota;

//                 RenderizarKpis(kpis);
//                 RenderizarGraficoEvolucion(evolucion);
//                 RenderizarGraficoOrigenes(origenes);
//                 RenderizarGraficoFlota(flota);
//                 RenderizarPlanillaFlota(flota);
//             },
//             error: function (err) {
//                 console.error("SITMAS - Error al cargar Dashboard de Dirección:", err);
//                 $("#dir-badge-estado")
//                     .removeClass("bg-light text-secondary")
//                     .addClass("bg-danger-subtle text-danger")
//                     .html('<i class="fas fa-exclamation-circle me-1"></i>Error de conexión');

//                 Swal.fire("Error", "No se pudieron obtener los indicadores ejecutivos desde el servidor.", "error");
//             }
//         });
//     }

//     /* ======================================================================
//        4. RENDERIZADO DE KPIs (Mapeo exacto a KpisDireccionDto)
//        ====================================================================== */

//     function RenderizarKpis(k) {
//         // Fila 1 - KPI 1: Ingreso Bruto
//         $("#dir-kpi-bruto").text(`${FormatearDecimal(k.PesoBrutoTotal)} kg`);
//         $("#dir-kpi-sub-bruto").text(
//             `Camiones: ${FormatearDecimal(k.PesoBrutoCamiones)} kg • Part.: ${FormatearDecimal(k.PesoBrutoParticulares)} kg`
//         );

//         // Fila 1 - KPI 2: Material Útil Aprovechable
//         $("#dir-kpi-util").text(`${FormatearDecimal(k.PesoUtilAprovechable)} kg`);
//         $("#dir-kpi-sub-util").text(
//             `Aprovech.: ${FormatearDecimal(k.PorcentajeAprovechamiento)} % • Descarte: ${FormatearDecimal(k.PorcentajeDescarteRojo)} %`
//         );

//         // Fila 1 - KPI 3: Costo Operativo Integral
//         $("#dir-kpi-costo-integral").text(FormatearMoneda(k.CostoOperativoIntegral));
//         $("#dir-kpi-sub-costo-integral").text(
//             `Comb.: ${FormatearMoneda(k.GastoCombustible)} • M.O.: ${FormatearMoneda(k.CostoManoObraTotal)}`
//         );

//         // Fila 1 - KPI 4: Costo Unitario por Kg Útil
//         $("#dir-kpi-costo-kg").text(`${FormatearMoneda(k.CostoIntegralPorKgUtil)} / kg`);
//         $("#dir-kpi-sub-costo-kg").text(
//             `Solo comb.: ${FormatearMoneda(k.CostoCombustiblePorKgUtil)} / kg • ${FormatearMoneda(k.CostoCombustiblePorKm)} / km`
//         );

//         // Fila 2 - KPI 5: Logística
//         $("#dir-kpi-km").text(`${FormatearDecimal(k.TotalKmReales)} km`);
//         $("#dir-kpi-sub-km").text(
//             `${FormatearEntero(k.TotalHojasRutaEjecutadas)} HDR • ${FormatearEntero(k.MovimientosInternosSinHDR)} sin HDR • ${FormatearDecimal(k.TotalLitros)} L`
//         );

//         // Fila 2 - KPI 6: Horas Operativas
//         $("#dir-kpi-horas").text(`${FormatearDecimal(k.TotalHorasOperativas)} hs`);
//         $("#dir-kpi-sub-horas").text(
//             `Chofer: ${FormatearDecimal(k.HorasChofer)}h • Clasif: ${FormatearDecimal(k.HorasClasificacion)}h • Stock: ${FormatearDecimal(k.HorasStock)}h`
//         );

//         // Fila 2 - KPI 7: Stock Utilizado
//         $("#dir-kpi-stock").text(`${FormatearDecimal(k.PesoUtilizadoStock)} kg`);
//         $("#dir-kpi-sub-stock").text(
//             `Rotación: ${FormatearDecimal(k.TasaRotacionStockPct)} % • ${FormatearMoneda(k.CostoIntegralPorKgUtilizadoEnStock)} / kg`
//         );

//         // Fila 2 - KPI 8: Salud Preventiva Flota
//         const saludPct = parseFloat(k.SaludPreventivaFlotaPct || 0);
//         const $kpiSalud = $("#dir-kpi-salud");
//         $kpiSalud
//             .text(`${FormatearDecimal(saludPct)} %`)
//             .removeClass("text-dark text-success text-warning text-danger")
//             .addClass(saludPct >= 80 ? "text-success" : (saludPct >= 50 ? "text-warning" : "text-danger"));

//         $("#dir-kpi-sub-salud").text(
//             `${FormatearEntero(k.ServicesVencidos)}/${FormatearEntero(k.TotalControlesPreventivos)} vencidos • Cubiertas: ${FormatearDecimal(k.DesgastePromedioCubiertasPct)} %`
//         );
//     }

//     /* ======================================================================
//        5. VISUALIZACIONES ECHARTS (EvolucionMensual, CalidadPorOrigen, PlanillaFlota)
//        ====================================================================== */

//     function RenderizarGraficoEvolucion(evolucion) {
//         if (typeof echarts === "undefined") return;
//         const dom = document.getElementById("echarts-dir-evolucion");
//         if (!dom) return;

//         if (!chartEvolucionEmbudo || chartEvolucionEmbudo.isDisposed()) {
//             chartEvolucionEmbudo = echarts.init(dom);
//         }

//         if (!evolucion || evolucion.length === 0) {
//             chartEvolucionEmbudo.clear();
//             chartEvolucionEmbudo.setOption({
//                 title: {
//                     text: "Sin movimientos registrados en el período seleccionado",
//                     left: "center",
//                     top: "middle",
//                     textStyle: { color: "#6c757d", fontSize: 14, fontWeight: "normal" }
//                 }
//             });
//             return;
//         }

//         const etiquetas = evolucion.map(x => x.PeriodoLabel || x.PeriodoISO);
//         const serieUtiles = evolucion.map(x => parseFloat(x.KgAprovechables || 0));
//         const serieRojo = evolucion.map(x => parseFloat(x.KgDescarteRojo || 0));
//         const serieGasto = evolucion.map(x => parseFloat(x.GastoCombustible || 0));
//         const serieKm = evolucion.map(x => parseFloat(x.KmReales || 0));

//         const option = {
//             tooltip: {
//                 trigger: "axis",
//                 axisPointer: { type: "shadow" },
//                 formatter: function (params) {
//                     if (!params || params.length === 0) return "";
//                     const idx = params[0].dataIndex;
//                     let html = `<strong>Período ${params[0].axisValue}</strong><hr style="margin:4px 0;"/>`;
//                     params.forEach(p => {
//                         const valFmt = p.seriesName.includes("Gasto")
//                             ? FormatearMoneda(p.value)
//                             : `${FormatearDecimal(p.value)} kg`;
//                         html += `${p.marker} ${p.seriesName}: <strong>${valFmt}</strong><br/>`;
//                     });
//                     html += `<span class="text-muted small">🛣️ Recorrido del mes: <strong>${FormatearDecimal(serieKm[idx])} km</strong></span>`;
//                     return html;
//                 }
//             },
//             legend: {
//                 top: 0,
//                 data: ["Kg Aprovechables (Verde+Amarillo)", "Kg Descarte (Rojo)", "Gasto Combustible ($)"]
//             },
//             grid: { left: "3%", right: "4%", bottom: "6%", top: 48, containLabel: true },
//             xAxis: {
//                 type: "category",
//                 data: etiquetas,
//                 axisLabel: { fontWeight: "bold", color: "#495057" }
//             },
//             yAxis: [
//                 {
//                     type: "value",
//                     name: "Kilogramos (kg)",
//                     axisLabel: { formatter: val => `${val.toLocaleString("es-AR")} kg` }
//                 },
//                 {
//                     type: "value",
//                     name: "Combustible ($)",
//                     axisLabel: { formatter: val => `$ ${val.toLocaleString("es-AR")}` }
//                 }
//             ],
//             series: [
//                 {
//                     name: "Kg Aprovechables (Verde+Amarillo)",
//                     type: "bar",
//                     stack: "material",
//                     barMaxWidth: 42,
//                     itemStyle: { color: "#198754" },
//                     data: serieUtiles
//                 },
//                 {
//                     name: "Kg Descarte (Rojo)",
//                     type: "bar",
//                     stack: "material",
//                     barMaxWidth: 42,
//                     itemStyle: { color: "#dc3545" },
//                     data: serieRojo
//                 },
//                 {
//                     name: "Gasto Combustible ($)",
//                     type: "line",
//                     yAxisIndex: 1,
//                     smooth: true,
//                     symbolSize: 8,
//                     itemStyle: { color: "#d97706" },
//                     lineStyle: { width: 3 },
//                     data: serieGasto
//                 }
//             ]
//         };

//         chartEvolucionEmbudo.setOption(option, true);
//     }

//     function RenderizarGraficoOrigenes(origenes) {
//         if (typeof echarts === "undefined") return;
//         const dom = document.getElementById("echarts-dir-origenes");
//         if (!dom) return;

//         if (!chartCalidadOrigenes || chartCalidadOrigenes.isDisposed()) {
//             chartCalidadOrigenes = echarts.init(dom);
//         }

//         if (!origenes || origenes.length === 0) {
//             chartCalidadOrigenes.clear();
//             chartCalidadOrigenes.setOption({
//                 title: {
//                     text: "Sin entregas por origen en el período",
//                     left: "center",
//                     top: "middle",
//                     textStyle: { color: "#6c757d", fontSize: 14, fontWeight: "normal" }
//                 }
//             });
//             return;
//         }

//         // Top 10 invertido para que el mayor quede arriba en barras horizontales
//         const top10 = origenes.slice(0, 10).reverse();
//         const nombres = top10.map(o => o.NombreOrigen);
//         const serieVerde = top10.map(o => parseFloat(o.PesoVerde || 0));
//         const serieAmarillo = top10.map(o => parseFloat(o.PesoAmarillo || 0));
//         const serieRojo = top10.map(o => parseFloat(o.PesoRojoDescarte || 0));

//         const option = {
//             tooltip: {
//                 trigger: "axis",
//                 axisPointer: { type: "shadow" },
//                 formatter: function (params) {
//                     if (!params || params.length === 0) return "";
//                     const item = top10[params[0].dataIndex];
//                     return `
//                         <strong>${item.NombreOrigen}</strong> <small class="text-muted">(${item.Canal})</small><br/>
//                         Entregas: <strong>${FormatearEntero(item.CantidadEntregas)}</strong> • Bruto: <strong>${FormatearDecimal(item.PesoBrutoTotal)} kg</strong><hr style="margin:4px 0;"/>
//                         <span style="color:#198754;">● Verde:</span> <strong>${FormatearDecimal(item.PesoVerde)} kg</strong><br/>
//                         <span style="color:#ffc107;">● Amarillo:</span> <strong>${FormatearDecimal(item.PesoAmarillo)} kg</strong><br/>
//                         <span style="color:#dc3545;">● Rojo Descarte:</span> <strong>${FormatearDecimal(item.PesoRojoDescarte)} kg</strong><br/>
//                         Calidad Útil: <strong>${FormatearDecimal(item.PorcentajeCalidadUtil)} %</strong>
//                     `;
//                 }
//             },
//             legend: {
//                 top: 0,
//                 data: ["Verde (kg)", "Amarillo (kg)", "Rojo Descarte (kg)"]
//             },
//             grid: { left: "3%", right: "6%", bottom: "4%", top: 38, containLabel: true },
//             xAxis: {
//                 type: "value",
//                 axisLabel: { formatter: val => `${val.toLocaleString("es-AR")} kg` }
//             },
//             yAxis: {
//                 type: "category",
//                 data: nombres,
//                 axisLabel: {
//                     width: 130,
//                     overflow: "truncate",
//                     fontSize: 11,
//                     color: "#343a40"
//                 }
//             },
//             series: [
//                 {
//                     name: "Verde (kg)",
//                     type: "bar",
//                     stack: "calidad",
//                     itemStyle: { color: "#198754" },
//                     data: serieVerde
//                 },
//                 {
//                     name: "Amarillo (kg)",
//                     type: "bar",
//                     stack: "calidad",
//                     itemStyle: { color: "#ffc107" },
//                     data: serieAmarillo
//                 },
//                 {
//                     name: "Rojo Descarte (kg)",
//                     type: "bar",
//                     stack: "calidad",
//                     itemStyle: { color: "#dc3545" },
//                     data: serieRojo
//                 }
//             ]
//         };

//         chartCalidadOrigenes.setOption(option, true);
//     }

//     function RenderizarGraficoFlota(flota) {
//         if (typeof echarts === "undefined") return;
//         const dom = document.getElementById("echarts-dir-flota");
//         if (!dom) return;

//         if (!chartRendimientoFlota || chartRendimientoFlota.isDisposed()) {
//             chartRendimientoFlota = echarts.init(dom);
//         }

//         // Excluimos vehículos sin actividad (ej. "Particular" con 0 viajes y 0 km) para no distorsionar la escala
//         const unidadesActivas = (flota || []).filter(v =>
//             (v.ViajesHDR > 0 || v.KmReales > 0 || v.KgUtilesGenerados > 0)
//         );

//         if (unidadesActivas.length === 0) {
//             chartRendimientoFlota.clear();
//             chartRendimientoFlota.setOption({
//                 title: {
//                     text: "Sin actividad de flota registrada en el período",
//                     left: "center",
//                     top: "middle",
//                     textStyle: { color: "#6c757d", fontSize: 14, fontWeight: "normal" }
//                 }
//             });
//             return;
//         }

//         const patentes = unidadesActivas.map(v => v.Patente);
//         const kgUtiles = unidadesActivas.map(v => parseFloat(v.KgUtilesGenerados || 0));
//         const costoPorKg = unidadesActivas.map(v => parseFloat(v.CostoCombustiblePorKgUtil || 0));

//         const option = {
//             tooltip: {
//                 trigger: "axis",
//                 axisPointer: { type: "shadow" },
//                 formatter: function (params) {
//                     if (!params || params.length === 0) return "";
//                     const v = unidadesActivas[params[0].dataIndex];
//                     return `
//                         <strong>${v.Patente}</strong> (${v.MarcaModelo})<br/>
//                         Viajes HDR: <strong>${FormatearEntero(v.ViajesHDR)}</strong> • Recorrido: <strong>${FormatearDecimal(v.KmReales)} km</strong><hr style="margin:4px 0;"/>
//                         Kg Útiles Generados: <strong class="text-success">${FormatearDecimal(v.KgUtilesGenerados)} kg</strong><br/>
//                         Gasto Combustible: <strong>${FormatearMoneda(v.GastoCombustible)}</strong><br/>
//                         Costo Comb. / Kg Útil: <strong class="text-primary">${FormatearMoneda(v.CostoCombustiblePorKgUtil)} / kg</strong>
//                     `;
//                 }
//             },
//             legend: {
//                 top: 0,
//                 data: ["Kg Útiles Generados", "Costo Combustible / Kg Útil ($)"]
//             },
//             grid: { left: "3%", right: "4%", bottom: "6%", top: 44, containLabel: true },
//             xAxis: {
//                 type: "category",
//                 data: patentes,
//                 axisLabel: { fontWeight: "bold", color: "#343a40" }
//             },
//             yAxis: [
//                 {
//                     type: "value",
//                     name: "Kg Útiles",
//                     axisLabel: { formatter: val => `${val.toLocaleString("es-AR")} kg` }
//                 },
//                 {
//                     type: "value",
//                     name: "$ / Kg Útil",
//                     axisLabel: { formatter: val => `$ ${val.toLocaleString("es-AR")}` }
//                 }
//             ],
//             series: [
//                 {
//                     name: "Kg Útiles Generados",
//                     type: "bar",
//                     barMaxWidth: 38,
//                     itemStyle: { color: "#0d6efd", borderRadius: [4, 4, 0, 0] },
//                     data: kgUtiles
//                 },
//                 {
//                     name: "Costo Combustible / Kg Útil ($)",
//                     type: "line",
//                     yAxisIndex: 1,
//                     smooth: true,
//                     symbolSize: 9,
//                     itemStyle: { color: "#d97706" },
//                     lineStyle: { width: 3 },
//                     data: costoPorKg
//                 }
//             ]
//         };

//         chartRendimientoFlota.setOption(option, true);
//     }

//     /* ======================================================================
//        6. PLANILLA EJECUTIVA DE RENDIMIENTO POR VEHÍCULO (PlanillaFlota)
//        ====================================================================== */

//     function RenderizarPlanillaFlota(flota) {
//         const $tbody = $("#tbody-dir-flota");
//         const $tfoot = $("#tfoot-dir-flota");
//         $tbody.empty();
//         $tfoot.empty();

//         if (!flota || flota.length === 0) {
//             $tbody.html('<tr><td colspan="11" class="text-center py-4 text-muted">No hay registros de flota para el período seleccionado.</td></tr>');
//             return;
//         }

//         let totViajes = 0;
//         let totKm = 0;
//         let totLitros = 0;
//         let totCombustible = 0;
//         let totCubiertas = 0;
//         let totBruto = 0;
//         let totUtil = 0;
//         let totRojo = 0;
//         let totTaller = 0;
//         let totUrgencias = 0;

//         flota.forEach(v => {
//             const viajes = parseInt(v.ViajesHDR || 0, 10);
//             const km = parseFloat(v.KmReales || 0);
//             const litros = parseFloat(v.LitrosConsumidos || 0);
//             const comb = parseFloat(v.GastoCombustible || 0);
//             const cubiertas = parseFloat(v.CostoCubiertasEstimado || 0);
//             const bruto = parseFloat(v.KgTransportadosBruto || 0);
//             const util = parseFloat(v.KgUtilesGenerados || 0);
//             const rojo = parseFloat(v.KgDescarteGenerado || 0);
//             const costoKg = parseFloat(v.CostoCombustiblePorKgUtil || 0);
//             const taller = parseInt(v.IntervencionesTallerPeriodo || 0, 10);
//             const urgencias = parseInt(v.CorrectivosUrgenciasPeriodo || 0, 10);

//             totViajes += viajes;
//             totKm += km;
//             totLitros += litros;
//             totCombustible += comb;
//             totCubiertas += cubiertas;
//             totBruto += bruto;
//             totUtil += util;
//             totRojo += rojo;
//             totTaller += taller;
//             totUrgencias += urgencias;

//             const badgeTaller = urgencias > 0
//                 ? `<span class="badge bg-danger">${taller} (${urgencias} urg.)</span>`
//                 : (taller > 0 ? `<span class="badge bg-warning text-dark">${taller} (0 urg.)</span>` : `<span class="badge bg-light text-secondary">0</span>`);

//             $tbody.append(`
//                 <tr>
//                     <td class="ps-3">
//                         <span class="fw-bold text-dark d-block">${v.Patente}</span>
//                         <small class="text-muted">${v.MarcaModelo}</small>
//                     </td>
//                     <td class="text-center fw-semibold">${FormatearEntero(viajes)}</td>
//                     <td class="text-end">${FormatearDecimal(km)}</td>
//                     <td class="text-end">${FormatearDecimal(litros)}</td>
//                     <td class="text-end fw-semibold">${FormatearMoneda(comb)}</td>
//                     <td class="text-end text-muted">${FormatearMoneda(cubiertas)}</td>
//                     <td class="text-end">${FormatearDecimal(bruto)}</td>
//                     <td class="text-end text-success fw-bold">${FormatearDecimal(util)}</td>
//                     <td class="text-end text-danger">${FormatearDecimal(rojo)}</td>
//                     <td class="text-end text-primary fw-semibold">${FormatearMoneda(costoKg)}</td>
//                     <td class="text-center pe-3">${badgeTaller}</td>
//                 </tr>
//             `);
//         });

//         const costoPromedioGlobalKg = totUtil > 0 ? (totCombustible / totUtil) : 0;

//         $tfoot.html(`
//             <tr>
//                 <td class="ps-3">TOTAL FLOTA</td>
//                 <td class="text-center">${FormatearEntero(totViajes)}</td>
//                 <td class="text-end">${FormatearDecimal(totKm)}</td>
//                 <td class="text-end">${FormatearDecimal(totLitros)}</td>
//                 <td class="text-end">${FormatearMoneda(totCombustible)}</td>
//                 <td class="text-end">${FormatearMoneda(totCubiertas)}</td>
//                 <td class="text-end">${FormatearDecimal(totBruto)}</td>
//                 <td class="text-end text-success">${FormatearDecimal(totUtil)}</td>
//                 <td class="text-end text-danger">${FormatearDecimal(totRojo)}</td>
//                 <td class="text-end text-primary">${FormatearMoneda(costoPromedioGlobalKg)}</td>
//                 <td class="text-center pe-3">${totTaller} (${totUrgencias} urg.)</td>
//             </tr>
//         `);
//     }

//     /* ======================================================================
//        7. EXPORTACIÓN CSV COMPATIBLE CON EXCEL (es-AR)
//        ====================================================================== */

//     function ExportarPlanillaCSV() {
//         if (!ultimaPlanillaFlota || ultimaPlanillaFlota.length === 0) {
//             Swal.fire("Sin datos", "No hay filas en la planilla de flota para exportar.", "info");
//             return;
//         }

//         const encabezados = [
//             "Patente", "Marca y Modelo", "Viajes HDR", "Km Reales",
//             "Litros Consumidos", "Gasto Combustible ($)", "Costo Cubiertas Est. ($)",
//             "Kg Transportados Bruto", "Kg Utiles Generados", "Kg Descarte Generado",
//             "Costo Combustible por Kg Util ($)", "Intervenciones Taller", "Correctivos Urgencias"
//         ];

//         const filas = ultimaPlanillaFlota.map(v => [
//             v.Patente,
//             v.MarcaModelo,
//             v.ViajesHDR || 0,
//             FormatearDecimal(v.KmReales),
//             FormatearDecimal(v.LitrosConsumidos),
//             FormatearDecimal(v.GastoCombustible),
//             FormatearDecimal(v.CostoCubiertasEstimado),
//             FormatearDecimal(v.KgTransportadosBruto),
//             FormatearDecimal(v.KgUtilesGenerados),
//             FormatearDecimal(v.KgDescarteGenerado),
//             FormatearDecimal(v.CostoCombustiblePorKgUtil),
//             v.IntervencionesTallerPeriodo || 0,
//             v.CorrectivosUrgenciasPeriodo || 0
//         ].join(";"));

//         const contenidoCSV = "\uFEFF" + [encabezados.join(";"), ...filas].join("\n");
//         const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
//         const url = URL.createObjectURL(blob);

//         const link = document.createElement("a");
//         link.href = url;
//         link.download = `SITMAS_Direccion_Flota_${$("#dir-fecha-desde").val()}_${$("#dir-fecha-hasta").val()}.csv`;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         URL.revokeObjectURL(url);
//     }

//     // Interfaz pública del módulo SPA
//     return {
//         cargarEn: cargarEn
//     };
// })();