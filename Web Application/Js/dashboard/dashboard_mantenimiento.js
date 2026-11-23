/* ==========================================================================
   SITMAS - Módulo: Dashboard Analítico de Mantenimiento Vehicular (SPA)
   Roles habilitados: Mantenimiento / Encargado de Flota, Administrador
   Arquitectura: Pirámide Invertida enfocada en Taller:
     1. Saludo unificado + Filtros
     2. KPIs Nivel 1 (Alerta Vencidos + Top 2 Excedidos) y Nivel 2 (Azules Operativos)
     3. Relojes Semáforo (ECharts Gauge) por Unidad y Detalle de los 6 Services
     4. Planilla de Auditoría con exportación CSV
   ========================================================================== */

const DashboardMantenimientoModulo = (function () {
    "use strict";

    const URL_API_MANTENIMIENTO = "https://localhost:44325/api/DashboardUsuariosRol/Mantenimiento";

    // Estado interno aislado del módulo
    let contenedorActualId = "panel-graficos";
    let instanciasGauges = [];
    let ultimaPlanillaAuditoria = [];
    let ultimaSaludFlota = [];
    let catalogoVehiculos = [];
    let idVehiculoDetalleSeleccionado = 0;

    /* ======================================================================
       HELPERS DE FORMATEO Y LIMPIEZA
       ====================================================================== */

    function FormatearDecimal(valor) {
        const num = parseFloat(valor || 0);
        return num.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function FormatearEntero(valor) {
        const num = parseInt(valor || 0, 10);
        return num.toLocaleString("es-AR");
    }

    function CapitalizarTexto(texto) {
        if (!texto) return "";
        return texto.charAt(0).toUpperCase() + texto.slice(1);
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
        if (Array.isArray(instanciasGauges)) {
            instanciasGauges.forEach(instancia => {
                if (instancia && !instancia.isDisposed()) {
                    instancia.dispose();
                }
            });
        }
        instanciasGauges = [];
    }

    /* ======================================================================
       1. RENDERIZADO DEL ESQUELETO HTML EN EL CONTENEDOR SPA
       ====================================================================== */

    function cargarEn(contenedorId = "panel-graficos") {
        contenedorActualId = contenedorId;
        const $contenedor = $(`#${contenedorActualId}`);
        if ($contenedor.length === 0) return;

        DestruirGraficos();
        idVehiculoDetalleSeleccionado = 0;

        const sesionString = localStorage.getItem("usuarioSesion");
        const sesion = sesionString ? JSON.parse(sesionString) : {};
        const nombreUsuario = sesion.nombre || "Responsable de Flota";

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
                                Panel de Mantenimiento Vehicular • ${fechaHoyTexto}
                            </small>
                        </div>
                        <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2" id="mant-badge-estado">
                            <i class="fas fa-circle-notch fa-spin me-1"></i>Cargando métricas...
                        </span>
                    </div>

                    <div class="row g-3 align-items-end">
                        <div class="col-12 col-sm-6 col-md-2">
                            <label for="mant-fecha-desde" class="form-label small fw-bold text-secondary mb-1">
                                <i class="fas fa-calendar-alt me-1 text-primary"></i>Fecha Desde
                            </label>
                            <input type="date" class="form-control form-control-sm" id="mant-fecha-desde" value="${rangoDefault.fechaDesde}">
                        </div>

                        <div class="col-12 col-sm-6 col-md-2">
                            <label for="mant-fecha-hasta" class="form-label small fw-bold text-secondary mb-1">
                                <i class="fas fa-calendar-check me-1 text-primary"></i>Fecha Hasta
                            </label>
                            <input type="date" class="form-control form-control-sm" id="mant-fecha-hasta" value="${rangoDefault.fechaHasta}">
                        </div>

                        <div class="col-12 col-sm-6 col-md-3">
                            <label for="mant-select-vehiculo" class="form-label small fw-bold text-secondary mb-1">
                                <i class="fas fa-truck me-1 text-success"></i>Vehículo / Unidad
                            </label>
                            <select class="form-select form-select-sm" id="mant-select-vehiculo">
                                <option value="0">Todos los vehículos</option>
                            </select>
                        </div>

                        <div class="col-12 col-sm-6 col-md-3">
                            <label for="mant-select-tipo" class="form-label small fw-bold text-secondary mb-1">
                                <i class="fas fa-wrench me-1 text-warning"></i>Tipo de Mantenimiento
                            </label>
                            <select class="form-select form-select-sm" id="mant-select-tipo">
                                <option value="">Todos los tipos</option>
                                <option value="preventivo">Preventivo</option>
                                <option value="reparación">Reparación</option>
                                <option value="urgente">Urgente</option>
                            </select>
                        </div>

                        <div class="col-12 col-md-2 d-flex gap-2">
                            <button type="button" class="btn btn-success btn-sm fw-bold flex-grow-1" id="btn-mant-filtrar">
                                <i class="fas fa-filter me-1"></i>Aplicar
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm fw-semibold" id="btn-mant-limpiar" title="Restablecer año actual">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2 - PARTE 1 (SUPERIOR): ALERTA DE VENCIDOS Y TOP 2 EXCEDIDOS -->
            <div class="col-12">
                <div class="row g-3 align-items-stretch">
                    <!-- Tarjeta 1: Alerta de Service Vencido (Roja llamativa y de mayor tamaño) -->
                    <div class="col-12 col-lg-4">
                        <div class="card border-0 shadow h-100 text-white"
                             style="background: linear-gradient(135deg, #dc3545 0%, #991b1b 100%); border-left: 6px solid #7f1d1d !important;">
                            <div class="card-body py-3 px-4 d-flex flex-column justify-content-between">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="fw-bold text-uppercase tracking-wide" style="font-size: 0.85rem; letter-spacing: 0.5px;">
                                        <i class="fas fa-bell me-1"></i>Alerta de Service Vencido
                                    </span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 44px; height: 44px; background-color: rgba(255, 255, 255, 0.2);">
                                        <i class="fas fa-exclamation-triangle fa-lg text-white"></i>
                                    </div>
                                </div>
                                <div class="my-1">
                                    <h2 class="display-6 fw-bold text-white mb-0" id="mant-kpi-vencidas">0 vencidos</h2>
                                </div>
                                <small class="text-white-50 fw-semibold" id="mant-kpi-sub-alertas">
                                    Próximos a vencer (&ge;75%): 0 en flota
                                </small>
                            </div>
                        </div>
                    </div>

                    <!-- Tarjeta 2: Aviso Urgente #1 (Estética rojo simple - Vehículo con más km excedidos) -->
                    <div class="col-12 col-md-6 col-lg-4">
                        <div class="card border-0 border-start border-danger border-4 shadow-sm h-100"
                             style="background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);">
                            <div class="card-body py-2 px-3 d-flex flex-column justify-content-between">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase text-danger">Aviso Urgente #1</span>
                                    <span class="badge bg-danger-subtle text-danger border border-danger-subtle">Mayor exceso</span>
                                </div>
                                <div>
                                    <h4 class="fw-bold text-dark mb-1" id="mant-kpi-exceso1-patente">Sin excesos</h4>
                                    <div class="fw-bold text-danger small" id="mant-kpi-exceso1-km">Flota dentro de rango</div>
                                </div>
                                <small class="text-muted mt-1 text-truncate" id="mant-kpi-exceso1-service">---</small>
                            </div>
                        </div>
                    </div>

                    <!-- Tarjeta 3: Aviso Urgente #2 (Estética rojo simple - Segundo vehículo con más km excedidos) -->
                    <div class="col-12 col-md-6 col-lg-4">
                        <div class="card border-0 border-start border-danger border-4 shadow-sm h-100"
                             style="background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);">
                            <div class="card-body py-2 px-3 d-flex flex-column justify-content-between">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase text-danger">Aviso Urgente #2</span>
                                    <span class="badge bg-danger-subtle text-danger border border-danger-subtle">2° en exceso</span>
                                </div>
                                <div>
                                    <h4 class="fw-bold text-dark mb-1" id="mant-kpi-exceso2-patente">Sin excesos</h4>
                                    <div class="fw-bold text-danger small" id="mant-kpi-exceso2-km">Flota dentro de rango</div>
                                </div>
                                <small class="text-muted mt-1 text-truncate" id="mant-kpi-exceso2-service">---</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2 - PARTE 2 (INFERIOR): RESUMEN OPERATIVO EN GAMA AZUL / CELESTE -->
            <div class="col-12">
                <div class="row row-cols-1 row-cols-md-3 g-3">
                    <!-- Tarjeta 1: Total de Services Realizados y su tipo (Estética Azul) -->
                    <div class="col">
                        <div class="card border-0 border-start border-primary border-4 shadow-sm h-100"
                             style="background: linear-gradient(135deg, #eef4ff 0%, #ffffff 100%);">
                            <div class="card-body py-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase" style="color: #1e40af;">Total Services Realizados</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 36px; height: 36px; background-color: rgba(13, 110, 253, 0.14);">
                                        <i class="fas fa-tools text-primary"></i>
                                    </div>
                                </div>
                                <h3 class="fw-bold text-dark mb-1" id="mant-kpi-total">0</h3>
                                <small class="text-secondary fw-medium" id="mant-kpi-sub-total">
                                    Prev: 0 | Rep: 0 | Urg: 0
                                </small>
                            </div>
                        </div>
                    </div>

                    <!-- Tarjeta 2: Vehículo con el Último Service Realizado (Estética Azul Claro) -->
                    <div class="col">
                        <div class="card border-0 border-start border-4 shadow-sm h-100"
                             style="border-color: #3b82f6 !important; background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);">
                            <div class="card-body py-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase" style="color: #1d4ed8;">Último Service Realizado</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 36px; height: 36px; background-color: rgba(59, 130, 246, 0.14);">
                                        <i class="fas fa-truck-pickup" style="color: #2563eb;"></i>
                                    </div>
                                </div>
                                <h3 class="fw-bold text-dark mb-1" id="mant-kpi-ultimo-vehiculo">Sin registros</h3>
                                <small class="text-secondary fw-medium d-block text-truncate" id="mant-kpi-sub-ultimo">
                                    Fecha: --- • Tarea: ---
                                </small>
                            </div>
                        </div>
                    </div>

                    <!-- Tarjeta 3: Índice Preventivo (Estética Celeste) -->
                    <div class="col">
                        <div class="card border-0 border-start border-4 shadow-sm h-100"
                             style="border-color: #06b6d4 !important; background: linear-gradient(135deg, #ecfeff 0%, #ffffff 100%);">
                            <div class="card-body py-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase" style="color: #0e7490;">Índice Preventivo</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 36px; height: 36px; background-color: rgba(6, 182, 212, 0.16);">
                                        <i class="fas fa-shield-alt" style="color: #0891b2;"></i>
                                    </div>
                                </div>
                                <h3 class="fw-bold mb-1" style="color: #0e7490;" id="mant-kpi-pct-preventivo">0,00 %</h3>
                                <small class="text-secondary fw-medium" id="mant-kpi-sub-preventivo">
                                    0 de 0 servicios planificados
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 3A: RELOJES SEMÁFORO POR UNIDAD DE FLOTA (VISTA GENERAL DE TALLER) -->
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div>
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-tachometer-alt text-danger me-2"></i>Semáforo de Estado Crítico por Vehículo
                            </h6>
                            <small class="text-muted">
                                Cada reloj muestra el mayor desgaste preventivo de la unidad (hacé clic en un reloj para inspeccionar sus 6 servicios)
                            </small>
                        </div>
                        <div class="d-flex flex-wrap gap-2 small fw-semibold">
                            <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">● Óptimo (&lt;75%)</span>
                            <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">● Próximo (75–99%)</span>
                            <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">● Vencido (&ge;100%)</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-3" id="grid-gauges-flota">
                            <div class="col-12 text-center py-4 text-muted">Cargando relojes de flota...</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 3B: DESGLOSE DE LOS 6 SERVICES PREVENTIVOS (RELOJES INDIVIDUALES) -->
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div>
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-cogs text-primary me-2"></i>Detalle de Services Preventivos — <span class="text-primary" id="titulo-detalle-unidad">Unidad</span>
                            </h6>
                            <small class="text-muted" id="subtitulo-detalle-unidad">
                                Control individual por kilometraje de los 6 puntos de mantenimiento preventivo
                            </small>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <label for="mant-select-detalle-unidad" class="small fw-bold text-secondary mb-0">Inspeccionar:</label>
                            <select id="mant-select-detalle-unidad" class="form-select form-select-sm fw-bold border-primary" style="min-width: 210px;">
                            </select>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-3" id="grid-gauges-servicios-unidad">
                            <div class="col-12 text-center py-4 text-muted">Cargando detalle de servicios...</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 4: PLANILLA DE AUDITORÍA DETALLADA -->
            <div class="col-12 mb-4">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div>
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-clipboard-list text-secondary me-2"></i>Planilla de Auditoría — Historial de Mantenimiento Vehicular
                            </h6>
                            <small class="text-muted">Detalle cronológico de intervenciones realizadas en taller con lectura de odómetro y mecánico responsable</small>
                        </div>
                        <button type="button" class="btn btn-outline-success btn-sm fw-bold" id="btn-mant-exportar-csv">
                            <i class="fas fa-file-csv me-1"></i>Exportar Planilla (CSV)
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover table-striped align-middle mb-0 small">
                                <thead class="table-light text-uppercase">
                                    <tr>
                                        <th class="ps-3">Fecha</th>
                                        <th>Vehículo</th>
                                        <th>Tipo Unidad</th>
                                        <th class="text-center">Clasificación</th>
                                        <th>Service / Tarea</th>
                                        <th class="text-end">Odómetro (km)</th>
                                        <th class="pe-3">Mecánico Responsable</th>
                                    </tr>
                                </thead>
                                <tbody id="tbody-mant-auditoria">
                                    <tr>
                                        <td colspan="7" class="text-center py-4 text-muted">Cargando registros de mantenimiento...</td>
                                    </tr>
                                </tbody>
                                <tfoot class="table-light fw-bold" id="tfoot-mant-auditoria"></tfoot>
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
       2. REGISTRO DE EVENTOS SPA (Con .off().on() para evitar duplicados)
       ====================================================================== */

    function RegistrarEventos($contenedor) {
        $contenedor
            .off("click", "#btn-mant-filtrar")
            .on("click", "#btn-mant-filtrar", function () {
                ConsultarDatosDashboard();
            });

        $contenedor
            .off("click", "#btn-mant-limpiar")
            .on("click", "#btn-mant-limpiar", function () {
                const rangoDefault = ObtenerFechasPorDefecto();
                $("#mant-fecha-desde").val(rangoDefault.fechaDesde);
                $("#mant-fecha-hasta").val(rangoDefault.fechaHasta);
                $("#mant-select-vehiculo").val("0");
                $("#mant-select-tipo").val("");
                catalogoVehiculos = [];
                idVehiculoDetalleSeleccionado = 0;
                ConsultarDatosDashboard();
            });

        $contenedor
            .off("change", "#mant-select-vehiculo, #mant-select-tipo")
            .on("change", "#mant-select-vehiculo, #mant-select-tipo", function () {
                const vehFiltro = parseInt($("#mant-select-vehiculo").val(), 10) || 0;
                if (vehFiltro > 0) {
                    idVehiculoDetalleSeleccionado = vehFiltro;
                }
                ConsultarDatosDashboard();
            });

        // Selector rápido para cambiar la unidad inspeccionada en los 6 gauges de detalle
        $contenedor
            .off("change", "#mant-select-detalle-unidad")
            .on("change", "#mant-select-detalle-unidad", function () {
                idVehiculoDetalleSeleccionado = parseInt($(this).val(), 10) || 0;
                ReconstruirTodosLosGauges();
            });

        // Clic sobre cualquier tarjeta de gauge de flota para inspeccionar sus 6 servicios
        $contenedor
            .off("click", ".tarjeta-gauge-unidad")
            .on("click", ".tarjeta-gauge-unidad", function () {
                const idVeh = parseInt($(this).data("id-vehiculo"), 10) || 0;
                if (idVeh > 0) {
                    idVehiculoDetalleSeleccionado = idVeh;
                    $("#mant-select-detalle-unidad").val(String(idVeh));
                    ReconstruirTodosLosGauges();

                    const elDetalle = document.getElementById("grid-gauges-servicios-unidad");
                    if (elDetalle) {
                        elDetalle.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }
                }
            });

        $contenedor
            .off("click", "#btn-mant-exportar-csv")
            .on("click", "#btn-mant-exportar-csv", function () {
                ExportarPlanillaCSV();
            });

        $(window)
            .off("resize.dashboardMantenimiento")
            .on("resize.dashboardMantenimiento", function () {
                instanciasGauges.forEach(g => {
                    if (g && !g.isDisposed()) g.resize();
                });
            });
    }

    /* ======================================================================
       3. CONSULTA A LA API Y ORQUESTACIÓN DE VISTAS
       ====================================================================== */

    function ConsultarDatosDashboard() {
        const fechaDesde = $("#mant-fecha-desde").val();
        const fechaHasta = $("#mant-fecha-hasta").val();
        const idVehiculo = parseInt($("#mant-select-vehiculo").val(), 10) || 0;
        const tipoMantenimiento = $("#mant-select-tipo").val() || "";

        if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
            Swal.fire("Rango inválido", "La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.", "warning");
            return;
        }

        $("#mant-badge-estado")
            .removeClass("bg-danger-subtle text-danger bg-success-subtle text-success")
            .addClass("bg-light text-secondary")
            .html('<i class="fas fa-circle-notch fa-spin me-1"></i>Actualizando...');

        $.ajax({
            type: "GET",
            url: URL_API_MANTENIMIENTO,
            dataType: "json",
            data: {
                fechaDesde: fechaDesde || null,
                fechaHasta: fechaHasta || null,
                idVehiculo: idVehiculo > 0 ? idVehiculo : null,
                tipoMantenimiento: tipoMantenimiento !== "" ? tipoMantenimiento : null
            },
            success: function (data) {
                $("#mant-badge-estado")
                    .removeClass("bg-light text-secondary")
                    .addClass("bg-success-subtle text-success")
                    .html('<i class="fas fa-check-circle me-1"></i>Datos actualizados');

                const kpis = (data && data.Kpis) || {};
                const saludFlota = (data && data.SaludPreventivaFlota) || [];
                const auditoria = (data && data.PlanillaAuditoria) || [];

                ultimaSaludFlota = saludFlota;
                ultimaPlanillaAuditoria = auditoria;

                // Poblamos el catálogo completo de vehículos cuando no hay unidad filtrada
                if (idVehiculo === 0 && saludFlota.length > 0) {
                    const mapaUnicos = new Map();
                    saludFlota.forEach(item => {
                        if (item.IdVehiculo > 0 && !mapaUnicos.has(item.IdVehiculo)) {
                            mapaUnicos.set(item.IdVehiculo, {
                                IdVehiculo: item.IdVehiculo,
                                Patente: item.Patente,
                                MarcaModelo: item.MarcaModelo
                            });
                        }
                    });
                    catalogoVehiculos = Array.from(mapaUnicos.values());
                    PoblarComboVehiculos(catalogoVehiculos, idVehiculo);
                }

                RenderizarKpis(kpis, saludFlota, auditoria);
                PrepararSelectorDetalleUnidad(saludFlota, idVehiculo);
                ReconstruirTodosLosGauges();
                RenderizarPlanillaAuditoria(auditoria);
            },
            error: function (err) {
                console.error("SITMAS - Error al cargar Dashboard de Mantenimiento:", err);
                $("#mant-badge-estado")
                    .removeClass("bg-light text-secondary")
                    .addClass("bg-danger-subtle text-danger")
                    .html('<i class="fas fa-exclamation-circle me-1"></i>Error de conexión');

                Swal.fire("Error", "No se pudieron obtener las métricas de mantenimiento vehicular desde el servidor.", "error");
            }
        });
    }

    function PoblarComboVehiculos(lista, seleccionadoId) {
        const $select = $("#mant-select-vehiculo");
        if ($select.length === 0) return;

        let html = '<option value="0">Todos los vehículos</option>';
        lista.forEach(v => {
            const selected = v.IdVehiculo === seleccionadoId ? "selected" : "";
            html += `<option value="${v.IdVehiculo}" ${selected}>${v.Patente} — ${v.MarcaModelo}</option>`;
        });
        $select.html(html);
    }

    /* ======================================================================
       4. RENDERIZADO DE KPIs (PARTE 1 ROJA CRÍTICA + PARTE 2 AZUL OPERATIVA)
       ====================================================================== */

    function RenderizarKpis(kpis, saludFlota, auditoria) {
        // --- PARTE 1: ALERTA DE VENCIDOS Y TOP 2 VEHÍCULOS CON MÁS KM EXCEDIDOS ---
        const vencidas = parseInt(kpis.AlertasVencidas || 0, 10);
        const proximas = parseInt(kpis.AlertasProximas || 0, 10);

        $("#mant-kpi-vencidas").text(
            `${FormatearEntero(vencidas)} ${vencidas === 1 ? "service vencido" : "services vencidos"}`
        );
        $("#mant-kpi-sub-alertas").text(
            `Próximos a vencer (\u226575%): ${FormatearEntero(proximas)} en flota`
        );

        // Agrupamos por vehículo para detectar los 2 con mayor exceso de kilómetros
        const mapaExcedidosPorVehiculo = new Map();
        (saludFlota || []).forEach(item => {
            const pct = parseFloat(item.PorcentajeDesgaste || 0);
            const kmRest = parseFloat(item.KmRestantes || 0);
            if (item.EstadoAlerta === "Vencido" || pct >= 100) {
                const kmExcedidos = kmRest < 0 ? Math.abs(kmRest) : 0;
                const actual = mapaExcedidosPorVehiculo.get(item.IdVehiculo);
                if (!actual || kmExcedidos > actual.kmExcedidos || (kmExcedidos === actual.kmExcedidos && pct > actual.porcentajeDesgaste)) {
                    mapaExcedidosPorVehiculo.set(item.IdVehiculo, {
                        idVehiculo: item.IdVehiculo,
                        patente: item.Patente,
                        marcaModelo: item.MarcaModelo,
                        tipoService: item.TipoService,
                        kmExcedidos: kmExcedidos,
                        porcentajeDesgaste: pct
                    });
                }
            }
        });

        const topExcedidos = Array.from(mapaExcedidosPorVehiculo.values())
            .sort((a, b) => (b.kmExcedidos - a.kmExcedidos) || (b.porcentajeDesgaste - a.porcentajeDesgaste));

        // Tarjeta 2: Top 1 Excedido
        if (topExcedidos.length >= 1) {
            const top1 = topExcedidos[0];
            $("#mant-kpi-exceso1-patente").text(top1.patente);
            $("#mant-kpi-exceso1-km").text(`+${FormatearDecimal(top1.kmExcedidos)} km excedidos`);
            $("#mant-kpi-exceso1-service").text(`${CapitalizarTexto(top1.tipoService)} (${top1.marcaModelo})`);
        } else {
            $("#mant-kpi-exceso1-patente").text("Sin excesos");
            $("#mant-kpi-exceso1-km").text("0,00 km excedidos");
            $("#mant-kpi-exceso1-service").text("Ninguna unidad vencida");
        }

        // Tarjeta 3: Top 2 Excedido
        if (topExcedidos.length >= 2) {
            const top2 = topExcedidos[1];
            $("#mant-kpi-exceso2-patente").text(top2.patente);
            $("#mant-kpi-exceso2-km").text(`+${FormatearDecimal(top2.kmExcedidos)} km excedidos`);
            $("#mant-kpi-exceso2-service").text(`${CapitalizarTexto(top2.tipoService)} (${top2.marcaModelo})`);
        } else {
            $("#mant-kpi-exceso2-patente").text("Sin 2° exceso");
            $("#mant-kpi-exceso2-km").text("0,00 km excedidos");
            $("#mant-kpi-exceso2-service").text("Sin otras unidades vencidas");
        }

        // --- PARTE 2: TOTAL SERVICES, ÚLTIMO SERVICE REALIZADO E ÍNDICE PREVENTIVO ---
        $("#mant-kpi-total").text(FormatearEntero(kpis.TotalServicios));
        $("#mant-kpi-sub-total").text(
            `Prev: ${FormatearEntero(kpis.TotalPreventivos)} | Rep: ${FormatearEntero(kpis.TotalReparaciones)} | Urg: ${FormatearEntero(kpis.TotalUrgentes)}`
        );

        // Último service realizado (PlanillaAuditoria viene ordenada por FechaMantenimiento DESC)
        if (auditoria && auditoria.length > 0) {
            const ultimo = auditoria[0];
            $("#mant-kpi-ultimo-vehiculo").text(ultimo.Patente);
            $("#mant-kpi-sub-ultimo").text(
                `${ultimo.FechaFormateada} • ${CapitalizarTexto(ultimo.TipoService)} (${CapitalizarTexto(ultimo.TipoMantenimiento)})`
            );
        } else {
            $("#mant-kpi-ultimo-vehiculo").text("Sin registros");
            $("#mant-kpi-sub-ultimo").text("Sin servicios en el período filtrado");
        }

        // Índice Preventivo
        const pctPrev = parseFloat(kpis.PorcentajePreventivo || 0);
        $("#mant-kpi-pct-preventivo").text(`${FormatearDecimal(pctPrev)} %`);
        $("#mant-kpi-sub-preventivo").text(
            `${FormatearEntero(kpis.TotalPreventivos)} de ${FormatearEntero(kpis.TotalServicios)} servicios planificados`
        );
    }

    /* ======================================================================
       5. RELOJES SEMÁFORO (ECHARTS GAUGE) PARA TALLER
       ====================================================================== */

    function PrepararSelectorDetalleUnidad(saludFlota, idVehiculoFiltro) {
        const $select = $("#mant-select-detalle-unidad");
        if ($select.length === 0) return;

        if (!saludFlota || saludFlota.length === 0) {
            $select.html('<option value="0">Sin vehículos disponibles</option>');
            idVehiculoDetalleSeleccionado = 0;
            return;
        }

        // Agrupamos unidades únicas y detectamos cuál tiene mayor desgaste para seleccionarla por defecto
        const mapaUnidades = new Map();
        saludFlota.forEach(item => {
            const pct = parseFloat(item.PorcentajeDesgaste || 0);
            const existente = mapaUnidades.get(item.IdVehiculo);
            if (!existente) {
                mapaUnidades.set(item.IdVehiculo, {
                    idVehiculo: item.IdVehiculo,
                    patente: item.Patente,
                    marcaModelo: item.MarcaModelo,
                    maxDesgaste: pct
                });
            } else if (pct > existente.maxDesgaste) {
                existente.maxDesgaste = pct;
            }
        });

        const unidades = Array.from(mapaUnidades.values());

        if (idVehiculoFiltro > 0 && mapaUnidades.has(idVehiculoFiltro)) {
            idVehiculoDetalleSeleccionado = idVehiculoFiltro;
        } else if (!mapaUnidades.has(idVehiculoDetalleSeleccionado)) {
            // Elegimos por defecto la unidad más crítica de la flota
            const masCritica = unidades.slice().sort((a, b) => b.maxDesgaste - a.maxDesgaste)[0];
            idVehiculoDetalleSeleccionado = masCritica ? masCritica.idVehiculo : unidades[0].idVehiculo;
        }

        let html = "";
        unidades.forEach(u => {
            const selected = u.idVehiculo === idVehiculoDetalleSeleccionado ? "selected" : "";
            html += `<option value="${u.idVehiculo}" ${selected}>${u.patente} (${u.marcaModelo})</option>`;
        });
        $select.html(html);
    }

    function ReconstruirTodosLosGauges() {
        DestruirGraficos();
        RenderizarGaugesResumenFlota(ultimaSaludFlota);
        RenderizarGaugesDetalleUnidad(ultimaSaludFlota, idVehiculoDetalleSeleccionado);
    }

    function CrearOpcionGaugeSemaforo(porcentajeReal, etiquetaInferior) {
        // Escala visual 0 a 120:
        //   0% - 75%   (0.000 - 0.625) -> Verde (#198754)
        //  75% - 100%  (0.625 - 0.833) -> Amarillo (#f59e0b)
        // 100% - 120%+ (0.833 - 1.000) -> Rojo (#dc3545)
        const valorAguja = Math.min(Math.max(porcentajeReal, 0), 120);
        const colorTexto = porcentajeReal >= 100
            ? "#dc3545"
            : (porcentajeReal >= 75 ? "#d97706" : "#198754");

        return {
            series: [
                {
                    type: "gauge",
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 120,
                    splitNumber: 6,
                    radius: "92%",
                    center: ["50%", "58%"],
                    axisLine: {
                        lineStyle: {
                            width: 14,
                            color: [
                                [0.625, "#198754"],
                                [0.8333, "#f59e0b"],
                                [1, "#dc3545"]
                            ]
                        }
                    },
                    pointer: {
                        icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
                        length: "62%",
                        width: 6,
                        offsetCenter: [0, "-10%"],
                        itemStyle: { color: "#212529" }
                    },
                    axisTick: {
                        length: 6,
                        lineStyle: { color: "auto", width: 1.5 }
                    },
                    splitLine: {
                        length: 12,
                        lineStyle: { color: "auto", width: 2 }
                    },
                    axisLabel: {
                        color: "#6c757d",
                        fontSize: 9,
                        distance: -24,
                        formatter: function (val) {
                            if (val === 0 || val === 60 || val === 100) return `${val}%`;
                            return "";
                        }
                    },
                    title: {
                        offsetCenter: [0, "24%"],
                        fontSize: 10,
                        fontWeight: "bold",
                        color: "#6c757d"
                    },
                    detail: {
                        valueAnimation: true,
                        offsetCenter: [0, "-12%"],
                        fontSize: 17,
                        fontWeight: "bold",
                        color: colorTexto,
                        formatter: function () {
                            return `${Math.round(porcentajeReal)}%`;
                        }
                    },
                    data: [
                        {
                            value: valorAguja,
                            name: etiquetaInferior
                        }
                    ]
                }
            ]
        };
    }

    function RenderizarGaugesResumenFlota(saludFlota) {
        const $grid = $("#grid-gauges-flota");
        $grid.empty();

        if (!saludFlota || saludFlota.length === 0) {
            $grid.html('<div class="col-12 text-center py-4 text-muted">No hay vehículos registrados en la flota.</div>');
            return;
        }

        // Agrupamos por vehículo para obtener su servicio más crítico y conteo de alertas
        const mapaVehiculos = new Map();
        saludFlota.forEach(item => {
            const pct = parseFloat(item.PorcentajeDesgaste || 0);
            const esVencido = item.EstadoAlerta === "Vencido" || pct >= 100;
            const esProximo = !esVencido && (item.EstadoAlerta === "Proximo" || pct >= 75);

            if (!mapaVehiculos.has(item.IdVehiculo)) {
                mapaVehiculos.set(item.IdVehiculo, {
                    idVehiculo: item.IdVehiculo,
                    patente: item.Patente,
                    marcaModelo: item.MarcaModelo,
                    odometroActual: item.OdometroActual,
                    servicioCritico: item,
                    cantVencidos: esVencido ? 1 : 0,
                    cantProximos: esProximo ? 1 : 0
                });
            } else {
                const reg = mapaVehiculos.get(item.IdVehiculo);
                if (esVencido) reg.cantVencidos++;
                if (esProximo) reg.cantProximos++;
                if (pct > parseFloat(reg.servicioCritico.PorcentajeDesgaste || 0)) {
                    reg.servicioCritico = item;
                }
            }
        });

        // Ordenamos poniendo primero los vehículos con mayor desgaste crítico
        const listaUnidades = Array.from(mapaVehiculos.values())
            .sort((a, b) => parseFloat(b.servicioCritico.PorcentajeDesgaste || 0) - parseFloat(a.servicioCritico.PorcentajeDesgaste || 0));

        listaUnidades.forEach(u => {
            const crit = u.servicioCritico;
            const pct = parseFloat(crit.PorcentajeDesgaste || 0);
            const kmRest = parseFloat(crit.KmRestantes || 0);

            let bordeClase = "border-success";
            let badgeHtml = '<span class="badge bg-success-subtle text-success">Óptimo</span>';
            let textoKm = `Faltan ${FormatearDecimal(Math.max(0, kmRest))} km`;

            if (pct >= 100) {
                bordeClase = "border-danger";
                badgeHtml = `<span class="badge bg-danger">${u.cantVencidos} vencido(s)</span>`;
                textoKm = kmRest < 0
                    ? `Excedido +${FormatearDecimal(Math.abs(kmRest))} km`
                    : "Límite alcanzado (0 km)";
            } else if (pct >= 75) {
                bordeClase = "border-warning";
                badgeHtml = `<span class="badge bg-warning text-dark">${u.cantProximos} próximo(s)</span>`;
                textoKm = `Faltan ${FormatearDecimal(kmRest)} km`;
            }

            const domId = `gauge-flota-veh-${u.idVehiculo}`;
            const esSeleccionado = u.idVehiculo === idVehiculoDetalleSeleccionado ? "bg-light" : "bg-white";

            $grid.append(`
                <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
                    <div class="card ${esSeleccionado} border border-top border-4 ${bordeClase} shadow-sm h-100 tarjeta-gauge-unidad"
                         data-id-vehiculo="${u.idVehiculo}" style="cursor: pointer;" title="Clic para ver los 6 servicios de ${u.patente}">
                        <div class="card-body p-3 text-center d-flex flex-column justify-content-between">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <span class="fw-bold text-dark fs-6">${u.patente}</span>
                                ${badgeHtml}
                            </div>
                            <small class="text-muted d-block text-truncate mb-1">${u.marcaModelo} • ${FormatearEntero(u.odometroActual)} km</small>

                            <div id="${domId}" style="width: 100%; height: 165px;"></div>

                            <div class="mt-1 pt-2 border-top small">
                                <div class="fw-bold text-dark text-truncate">${CapitalizarTexto(crit.TipoService)}</div>
                                <div class="${pct >= 100 ? "text-danger fw-bold" : (pct >= 75 ? "text-warning-emphasis fw-semibold" : "text-success")}">
                                    ${textoKm}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            if (typeof echarts !== "undefined") {
                const dom = document.getElementById(domId);
                if (dom) {
                    const chart = echarts.init(dom);
                    chart.setOption(CrearOpcionGaugeSemaforo(pct, "DESGASTE MÁX."));
                    instanciasGauges.push(chart);
                }
            }
        });
    }

    function RenderizarGaugesDetalleUnidad(saludFlota, idVehiculo) {
        const $grid = $("#grid-gauges-servicios-unidad");
        $grid.empty();

        const serviciosUnidad = (saludFlota || [])
            .filter(item => item.IdVehiculo === idVehiculo)
            .sort((a, b) => a.OrdenService - b.OrdenService);

        if (serviciosUnidad.length === 0) {
            $("#titulo-detalle-unidad").text("Sin unidad seleccionada");
            $("#subtitulo-detalle-unidad").text("No hay registros preventivos para mostrar");
            $grid.html('<div class="col-12 text-center py-4 text-muted">No hay servicios preventivos para esta unidad.</div>');
            return;
        }

        const infoUnidad = serviciosUnidad[0];
        $("#titulo-detalle-unidad").text(`${infoUnidad.Patente} — ${infoUnidad.MarcaModelo}`);
        $("#subtitulo-detalle-unidad").text(
            `Odómetro actual registrado: ${FormatearDecimal(infoUnidad.OdometroActual)} km • Tipo: ${infoUnidad.TipoVehiculo}`
        );

        serviciosUnidad.forEach(srv => {
            const pct = parseFloat(srv.PorcentajeDesgaste || 0);
            const kmRest = parseFloat(srv.KmRestantes || 0);

            let badgeEstado = '<span class="badge bg-success-subtle text-success">Óptimo</span>';
            let bordeClase = "border-success";
            let textoKm = `Faltan ${FormatearDecimal(Math.max(0, kmRest))} km`;

            if (pct >= 100) {
                badgeEstado = '<span class="badge bg-danger">Vencido</span>';
                bordeClase = "border-danger";
                textoKm = kmRest < 0
                    ? `Excedido +${FormatearDecimal(Math.abs(kmRest))} km`
                    : "Vencido (0 km restantes)";
            } else if (pct >= 75) {
                badgeEstado = '<span class="badge bg-warning text-dark">Próximo</span>';
                bordeClase = "border-warning";
                textoKm = `Faltan ${FormatearDecimal(kmRest)} km`;
            }

            const domId = `gauge-srv-${srv.IdVehiculo}-${srv.OrdenService}`;

            $grid.append(`
                <div class="col-12 col-sm-6 col-lg-4">
                    <div class="card bg-white border border-start border-4 ${bordeClase} shadow-sm h-100">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                                <span class="fw-bold text-dark small">${CapitalizarTexto(srv.TipoService)}</span>
                                ${badgeEstado}
                            </div>
                            <small class="text-muted d-block">
                                Intervalo: cada <strong>${FormatearEntero(srv.IntervaloKm)} km</strong>
                            </small>

                            <div id="${domId}" style="width: 100%; height: 160px;"></div>

                            <div class="bg-light rounded p-2 small">
                                <div class="d-flex justify-content-between">
                                    <span class="text-muted">Último service:</span>
                                    <strong class="text-dark">${srv.FechaUltimoServiceFormateada}</strong>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span class="text-muted">Recorridos:</span>
                                    <strong class="text-dark">${FormatearDecimal(srv.KmRecorridos)} km</strong>
                                </div>
                                <div class="d-flex justify-content-between mt-1 pt-1 border-top">
                                    <span class="text-muted">Estado:</span>
                                    <strong class="${pct >= 100 ? "text-danger" : (pct >= 75 ? "text-warning-emphasis" : "text-success")}">
                                        ${textoKm}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            if (typeof echarts !== "undefined") {
                const dom = document.getElementById(domId);
                if (dom) {
                    const chart = echarts.init(dom);
                    chart.setOption(CrearOpcionGaugeSemaforo(pct, `CADA ${FormatearEntero(srv.IntervaloKm)} KM`));
                    instanciasGauges.push(chart);
                }
            }
        });
    }

    /* ======================================================================
       6. PLANILLA DE AUDITORÍA DETALLADA
       ====================================================================== */

    function RenderizarPlanillaAuditoria(auditoria) {
        const $tbody = $("#tbody-mant-auditoria");
        const $tfoot = $("#tfoot-mant-auditoria");
        $tbody.empty();
        $tfoot.empty();

        if (!auditoria || auditoria.length === 0) {
            $tbody.html('<tr><td colspan="7" class="text-center py-4 text-muted">No hay intervenciones registradas para los filtros seleccionados.</td></tr>');
            return;
        }

        auditoria.forEach(fila => {
            const tipoNorm = (fila.TipoMantenimiento || "").toLowerCase();
            let badgeClase = "bg-secondary";
            if (tipoNorm === "preventivo") badgeClase = "bg-success";
            else if (tipoNorm === "reparación" || tipoNorm === "reparacion") badgeClase = "bg-warning text-dark";
            else if (tipoNorm === "urgente") badgeClase = "bg-danger";

            $tbody.append(`
                <tr>
                    <td class="ps-3 fw-semibold text-dark">${fila.FechaFormateada}</td>
                    <td>
                        <span class="fw-bold text-dark">${fila.Patente}</span>
                        <small class="text-muted d-block">${fila.MarcaModelo}</small>
                    </td>
                    <td class="text-muted">${fila.TipoVehiculo}</td>
                    <td class="text-center">
                        <span class="badge ${badgeClase}">${CapitalizarTexto(fila.TipoMantenimiento)}</span>
                    </td>
                    <td class="fw-medium">${CapitalizarTexto(fila.TipoService)}</td>
                    <td class="text-end fw-semibold">${FormatearDecimal(fila.KmAlMomentoService)} km</td>
                    <td class="pe-3">${fila.MecanicoNombreCompleto}</td>
                </tr>
            `);
        });

        $tfoot.html(`
            <tr>
                <td colspan="7" class="ps-3 text-secondary">
                    Total de intervenciones auditadas en el período: <strong class="text-dark">${FormatearEntero(auditoria.length)}</strong>
                </td>
            </tr>
        `);
    }

    /* ======================================================================
       7. EXPORTACIÓN CSV COMPATIBLE CON EXCEL (es-AR)
       ====================================================================== */

    function ExportarPlanillaCSV() {
        if (!ultimaPlanillaAuditoria || ultimaPlanillaAuditoria.length === 0) {
            Swal.fire("Sin datos", "No hay registros en la planilla para exportar.", "info");
            return;
        }

        const encabezados = [
            "ID", "Fecha", "Patente", "Marca y Modelo", "Tipo Vehiculo",
            "Clasificacion", "Service / Tarea", "Odometro (km)", "Mecanico Responsable"
        ];

        const filas = ultimaPlanillaAuditoria.map(f => [
            f.IdMantenimientoVehi,
            f.FechaFormateada,
            f.Patente,
            f.MarcaModelo,
            f.TipoVehiculo,
            CapitalizarTexto(f.TipoMantenimiento),
            CapitalizarTexto(f.TipoService),
            FormatearDecimal(f.KmAlMomentoService),
            f.MecanicoNombreCompleto
        ].join(";"));

        const contenidoCSV = "\uFEFF" + [encabezados.join(";"), ...filas].join("\n");
        const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `SITMAS_Mantenimiento_Vehicular_${$("#mant-fecha-desde").val()}_${$("#mant-fecha-hasta").val()}.csv`;
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


