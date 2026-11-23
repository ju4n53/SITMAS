/* ========================================================================
   SITMAS - Módulo de Reportes de Trazabilidad: Resumen Ejecutivo y Balance
   Consume exclusivamente: GET /api/ReportesTrazabilidad/ResumenKPIs
   (Catálogo de filtro: GET /api/ReportesTrazabilidad/PorMaterial)
   Estructura:
     - Filtros superiores (Desde, Hasta, Material)
     - 3 Bandas de KPIs con tonalidades suaves semánticas (11 tarjetas)
     - Gráfico 1: Share Dataset (Torta superior + Evolución % revisado inferior)
     - Gráfico 2: Bar Label Rotation (Lotes vs. Bruto y Semáforo en kg)
   Archivo: Js/reportes_trazabilidad/reporte_traz_resumen.js
   ======================================================================== */

const ReporteTrazResumenModulo = (function () {
    // 🔒 ESTADO PRIVADO DEL MÓDULO
    let estado = {
        kpis: null,
        evolucionDiaria: [],
        granularidad: 'diaria', // 'diaria' | 'mensual'
        chartShareDataset: null,
        chartBarRotation: null
    };

    const URL_RESUMEN_KPIS = "https://localhost:44325/api/ReportesTrazabilidad/ResumenKPIs";
    const URL_POR_MATERIAL = "https://localhost:44325/api/ReportesTrazabilidad/PorMaterial";

    const MESES_CORTOS = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];

    // Helpers de formateo regional (es-AR) y fechas sin desfase horario UTC
    const formatearKg = function (valor) {
        const num = parseFloat(valor || 0);
        return num.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatearEntero = function (valor) {
        const num = Math.round(parseFloat(valor || 0));
        return num.toLocaleString('es-AR');
    };

    const formatearPorcentaje = function (valor) {
        const num = parseFloat(valor || 0);
        return num.toLocaleString('es-AR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2
        });
    };

    const extraerFechaIso = function (fechaRaw) {
        if (!fechaRaw) return '';
        return fechaRaw.includes('T') ? fechaRaw.split('T')[0] : fechaRaw;
    };

    const formatearFechaLegible = function (fechaIso, corta = false) {
        const limpia = extraerFechaIso(fechaIso);
        if (!limpia || !limpia.includes('-')) return limpia;
        const [anio, mes, dia] = limpia.split('-');
        return corta ? `${dia}/${mes}` : `${dia}/${mes}/${anio}`;
    };

    const formatearMesLegible = function (mesIso) {
        if (!mesIso || !mesIso.includes('-')) return mesIso;
        const [anio, mesStr] = mesIso.split('-');
        const idx = parseInt(mesStr, 10) - 1;
        return MESES_CORTOS[idx] ? `${MESES_CORTOS[idx]} ${anio}` : mesIso;
    };

    // Limpieza segura de todas las instancias ECharts y listeners al salir de la vista
    const destruirGraficosActivos = function () {
        ['chartShareDataset', 'chartBarRotation'].forEach(key => {
            if (estado[key] && !estado[key].isDisposed()) {
                estado[key].dispose();
            }
            estado[key] = null;
        });
        $(window).off('resize.trazResumen');
    };

    // 1. INICIALIZACIÓN DE LA ESTRUCTURA VISUAL
    const inicializar = function (contenedorId) {
        destruirGraficosActivos();
        const contenedor = $(`#${contenedorId}`);

        const htmlEstructura = `
            <!-- NIVEL 1: ENCABEZADO Y FILTROS GLOBALES -->
            <div class="row fade-in">
                <div class="col-12 d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h4 class="text-primary fw-bold mb-0">
                            <i class="fas fa-balance-scale me-2"></i>Resumen Ejecutivo y Balance de Masa
                        </h4>
                        <small class="text-muted">Indicadores consolidados de recepción bruta, clasificación por semáforo, lotes y flujo de planta</small>
                    </div>

                    <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded border">
                        <label class="small fw-bold mb-0">Desde:</label>
                        <input type="date" id="filtro-traz-res-desde" class="form-control form-control-sm" style="width: auto;">

                        <label class="small fw-bold mb-0 ms-1">Hasta:</label>
                        <input type="date" id="filtro-traz-res-hasta" class="form-control form-control-sm" style="width: auto;">

                        <label class="small fw-bold mb-0 ms-1">Material:</label>
                        <select id="filtro-traz-res-material" class="form-select form-select-sm fw-semibold" style="width: auto; min-width: 170px;">
                            <option value="">Todos los Materiales</option>
                        </select>

                        <button id="btn-filtrar-traz-resumen" class="btn btn-primary btn-sm ms-1">
                            <i class="fas fa-search"></i> Filtrar
                        </button>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2 - PARTE 1: BRUTO INGRESADO Y PORCENTAJES DE CLASIFICACIÓN (4 TARJETAS) -->
            <div class="row g-3 mb-3 fade-in">
                <!-- 1. Celeste: Peso total bruto ingresado -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #e0f2fe; border-color: #0284c7 !important;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold text-uppercase" style="color: #0369a1;">Peso Bruto Ingresado</span>
                                <span class="badge p-2" style="background-color: rgba(2, 132, 199, 0.16); color: #0369a1;">
                                    <i class="fas fa-weight-hanging fa-lg"></i>
                                </span>
                            </div>
                            <h3 class="fw-bold text-dark mb-1" id="kpi-p1-bruto">0,00 kg</h3>
                            <small class="text-secondary fw-medium" id="kpi-p1-sub-bruto">Sin clasif. / merma: 0,00 kg</small>
                        </div>
                    </div>
                </div>

                <!-- 2. Verde: % Peso bruto clasificado en verde -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #dcfce7; border-color: #16a34a !important;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold text-uppercase" style="color: #15803d;">% Clasificado Verde</span>
                                <span class="badge p-2" style="background-color: rgba(22, 163, 74, 0.16); color: #15803d;">
                                    <i class="fas fa-check-circle fa-lg"></i>
                                </span>
                            </div>
                            <h3 class="fw-bold mb-1" style="color: #15803d;" id="kpi-p1-pct-verde">0,0%</h3>
                            <small class="text-secondary fw-medium" id="kpi-p1-sub-verde">Recuperable total (V+A): 0,0%</small>
                        </div>
                    </div>
                </div>

                <!-- 3. Amarilla: % Peso bruto clasificado en amarillo -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #fef9c3; border-color: #ca8a04 !important;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold text-uppercase" style="color: #a16207;">% Clasificado Amarillo</span>
                                <span class="badge p-2" style="background-color: rgba(202, 138, 4, 0.18); color: #a16207;">
                                    <i class="fas fa-exclamation-circle fa-lg"></i>
                                </span>
                            </div>
                            <h3 class="fw-bold mb-1" style="color: #a16207;" id="kpi-p1-pct-amarillo">0,0%</h3>
                            <small class="text-secondary fw-medium">Material en revisión / proceso</small>
                        </div>
                    </div>
                </div>

                <!-- 4. Roja: % Peso bruto clasificado en rojo -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #fee2e2; border-color: #dc2626 !important;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold text-uppercase" style="color: #b91c1c;">% Clasificado Rojo</span>
                                <span class="badge p-2" style="background-color: rgba(220, 38, 38, 0.16); color: #b91c1c;">
                                    <i class="fas fa-times-circle fa-lg"></i>
                                </span>
                            </div>
                            <h3 class="fw-bold mb-1" style="color: #b91c1c;" id="kpi-p1-pct-rojo">0,0%</h3>
                            <small class="text-secondary fw-medium">Porcentaje de descarte sobre bruto</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2 - PARTE 2: FLUJO DE PLANTA Y DESCARTE (3 TARJETAS) -->
            <div class="row g-3 mb-3 fade-in">
                <!-- 1. Azul claro: Peso total egresado de planta -->
                <div class="col-12 col-md-4">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #dbeafe; border-color: #2563eb !important;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold text-uppercase" style="color: #1d4ed8;">Total Egresado de Planta</span>
                                <span class="badge p-2" style="background-color: rgba(37, 99, 235, 0.16); color: #1d4ed8;">
                                    <i class="fas fa-dolly-flatbed fa-lg"></i>
                                </span>
                            </div>
                            <h3 class="fw-bold mb-1" style="color: #1d4ed8;" id="kpi-p2-egresado">0,00 kg</h3>
                            <small class="text-secondary fw-medium">Salidas y despachos registrados en el período</small>
                        </div>
                    </div>
                </div>

                <!-- 2. Verde claro: Peso balance de flujo recuperable -->
                <div class="col-12 col-md-4">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" id="card-p2-balance" style="background-color: #d1fae5; border-color: #059669 !important;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold text-uppercase" id="lbl-p2-balance" style="color: #047857;">Balance Flujo Recuperable</span>
                                <span class="badge p-2" id="icon-p2-balance" style="background-color: rgba(5, 150, 105, 0.16); color: #047857;">
                                    <i class="fas fa-exchange-alt fa-lg"></i>
                                </span>
                            </div>
                            <h3 class="fw-bold mb-1" style="color: #047857;" id="kpi-p2-balance">0,00 kg</h3>
                            <small class="text-secondary fw-medium" id="kpi-p2-sub-balance">(Verde + Amarillo) − Egresado de planta</small>
                        </div>
                    </div>
                </div>

                <!-- 3. Rojo claro: Peso total en rojo (descarte) -->
                <div class="col-12 col-md-4">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #ffe4e6; border-color: #e11d48 !important;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold text-uppercase" style="color: #be123c;">Peso Total en Rojo (Descarte)</span>
                                <span class="badge p-2" style="background-color: rgba(225, 29, 72, 0.16); color: #be123c;">
                                    <i class="fas fa-trash-alt fa-lg"></i>
                                </span>
                            </div>
                            <h3 class="fw-bold mb-1" style="color: #be123c;" id="kpi-p2-rojo-descarte">0,00 kg</h3>
                            <small class="text-secondary fw-medium">Material no recuperable del período</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2 - PARTE 3: LOTES Y VOLÚMENES FÍSICOS EN KG POR SEMÁFORO (4 TARJETAS) -->
            <div class="row g-3 mb-4 fade-in">
                <!-- 1. Celeste suave: Total de lotes ingresados -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #e0f7fa; border-color: #0891b2 !important;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold text-uppercase" style="color: #0e7490;">Total Lotes Ingresados</span>
                                <span class="badge p-2" style="background-color: rgba(8, 145, 178, 0.16); color: #0e7490;">
                                    <i class="fas fa-boxes fa-lg"></i>
                                </span>
                            </div>
                            <h3 class="fw-bold text-dark mb-1" id="kpi-p3-lotes">0</h3>
                            <small class="text-secondary fw-medium" id="kpi-p3-sub-lotes">0 camión / 0 particulares</small>
                        </div>
                    </div>
                </div>

                <!-- 2. Verde: Total peso verde kg -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #ecfdf5; border-color: #16a34a !important;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold text-uppercase" style="color: #15803d;">Total Peso Verde</span>
                                <span class="badge p-2" style="background-color: rgba(22, 163, 74, 0.16); color: #15803d;">
                                    <i class="fas fa-recycle fa-lg"></i>
                                </span>
                            </div>
                            <h3 class="fw-bold mb-1" style="color: #15803d;" id="kpi-p3-kg-verde">0,00 kg</h3>
                            <small class="text-secondary fw-medium" id="kpi-p3-sub-tiempo">Tiempo medio clasif.: 0,0 hs</small>
                        </div>
                    </div>
                </div>

                <!-- 3. Amarillo: Total peso amarillo kg -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #fefce8; border-color: #ca8a04 !important;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold text-uppercase" style="color: #a16207;">Total Peso Amarillo</span>
                                <span class="badge p-2" style="background-color: rgba(202, 138, 4, 0.18); color: #a16207;">
                                    <i class="fas fa-hourglass-half fa-lg"></i>
                                </span>
                            </div>
                            <h3 class="fw-bold mb-1" style="color: #a16207;" id="kpi-p3-kg-amarillo">0,00 kg</h3>
                            <small class="text-secondary fw-medium">Pendiente de reproceso / recuperación</small>
                        </div>
                    </div>
                </div>

                <!-- 4. Rojo: Total peso rojo kg -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #fef2f2; border-color: #dc2626 !important;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold text-uppercase" style="color: #b91c1c;">Total Peso Rojo</span>
                                <span class="badge p-2" style="background-color: rgba(220, 38, 38, 0.16); color: #b91c1c;">
                                    <i class="fas fa-ban fa-lg"></i>
                                </span>
                            </div>
                            <h3 class="fw-bold mb-1" style="color: #b91c1c;" id="kpi-p3-kg-rojo">0,00 kg</h3>
                            <small class="text-secondary fw-medium">Rechazo clasificado en cinta</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 3: GRÁFICO PRINCIPAL SHARE DATASET (TORTA ARRIBA + LÍNEAS ABAJO - SOLO REVISADO) -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-project-diagram text-primary me-2"></i>Distribución Porcentual del Material Revisado (Share Dataset)
                                </h6>
                                <small class="text-muted">
                                    Desliza el cursor sobre cualquier fecha de la curva inferior para actualizar la composición circular superior (Verde, Amarillo y Rojo)
                                </small>
                            </div>

                            <div class="btn-group btn-group-sm" role="group" aria-label="Granularidad temporal">
                                <button type="button" class="btn btn-primary btn-gran-traz-res active" data-modo="diaria">
                                    <i class="fas fa-calendar-day me-1"></i> Diario
                                </button>
                                <button type="button" class="btn btn-outline-primary btn-gran-traz-res" data-modo="mensual">
                                    <i class="fas fa-calendar-alt me-1"></i> Mensual
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="msg-sin-datos-traz-share" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-chart-line fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No se registraron materiales clasificados en el rango de fechas seleccionado.</p>
                            </div>
                            <div id="echarts-traz-share-dataset" style="width: 100%; height: 640px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 4: GRÁFICO SECUNDARIO BAR LABEL ROTATION (CRUCE DE LOTES Y CLASIFICACIÓN RS2) -->
            <div class="row g-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-chart-bar text-info me-2"></i>Comparativa de Lotes Recibidos vs. Recepción y Clasificación en Planta (Bar Label Rotation)
                                </h6>
                                <small class="text-muted">
                                    Cruce cronológico de cantidad de lotes ingresados (eje derecho) frente a kilogramos brutos y clasificados por semáforo (eje izquierdo)
                                </small>
                            </div>
                            <span class="badge bg-light text-secondary border">
                                <i class="fas fa-mouse-pointer text-primary me-1"></i>Clic en la leyenda para aislar series
                            </span>
                        </div>
                        <div class="card-body">
                            <div id="msg-sin-datos-traz-barras" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-boxes fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No se registraron lotes ingresados en el rango seleccionado.</p>
                            </div>
                            <div id="echarts-traz-bar-rotation" style="width: 100%; height: 480px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        contenedor.html(htmlEstructura);
        enlazarEventos();
        cargarCatalogoTiposMaterial();
        configurarFechasPorDefecto();
    };

    // 2. ENLACE DE EVENTOS DELEGADOS
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-reportes-trazabilidad');

        // Botón Filtrar
        principal.off('click', '#btn-filtrar-traz-resumen').on('click', '#btn-filtrar-traz-resumen', function () {
            const desde = $('#filtro-traz-res-desde').val();
            const hasta = $('#filtro-traz-res-hasta').val();
            const idTipoMaterial = $('#filtro-traz-res-material').val() || null;

            if (!desde || !hasta) {
                Swal.fire('Fechas requeridas', 'Por favor seleccioná ambas fechas.', 'warning');
                return;
            }
            if (desde > hasta) {
                Swal.fire('Rango inválido', 'La fecha "Desde" no puede ser mayor a "Hasta".', 'warning');
                return;
            }

            consultarResumenKPIs(desde, hasta, idTipoMaterial);
        });

        // Switch Diario vs Mensual (actualiza ambos gráficos en memoria)
        principal.off('click', '.btn-gran-traz-res').on('click', '.btn-gran-traz-res', function () {
            const nuevoModo = $(this).data('modo');
            if (nuevoModo === estado.granularidad) return;

            estado.granularidad = nuevoModo;
            $('.btn-gran-traz-res').removeClass('btn-primary active').addClass('btn-outline-primary');
            $(this).removeClass('btn-outline-primary').addClass('btn-primary active');

            renderizarGraficoShareDataset(estado.evolucionDiaria, estado.granularidad);
            renderizarGraficoBarRotation(estado.evolucionDiaria, estado.granularidad);
        });

        // Responsividad limpia para ECharts
        $(window).off('resize.trazResumen').on('resize.trazResumen', function () {
            if (estado.chartShareDataset && !estado.chartShareDataset.isDisposed()) {
                estado.chartShareDataset.resize();
            }
            if (estado.chartBarRotation && !estado.chartBarRotation.isDisposed()) {
                estado.chartBarRotation.resize();
            }
        });
    };

    const cargarCatalogoTiposMaterial = function () {
        $.ajax({
            type: "GET",
            url: URL_POR_MATERIAL,
            data: { fechaDesde: '2020-01-01', fechaHasta: new Date().toISOString().split('T')[0] },
            success: function (res) {
                const select = $('#filtro-traz-res-material');
                const tipos = (res && res.PorTipo) ? res.PorTipo : [];
                tipos
                    .filter(t => t.IdTipoMaterial > 0)
                    .sort((a, b) => a.TipoMaterial.localeCompare(b.TipoMaterial))
                    .forEach(t => {
                        select.append(`<option value="${t.IdTipoMaterial}">${t.TipoMaterial}</option>`);
                    });
            }
        });
    };

    const configurarFechasPorDefecto = function () {
        const hoy = new Date();
        const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);

        $('#filtro-traz-res-hasta').val(hoy.toISOString().split('T')[0]);
        $('#filtro-traz-res-desde').val(primerDiaAnio.toISOString().split('T')[0]);

        $('#btn-filtrar-traz-resumen').trigger('click');
    };

    // 3. CONSULTA ÚNICA A LA API (sp_ReporteTrazabilidad_ResumenKPIs)
    const consultarResumenKPIs = function (fechaDesde, fechaHasta, idTipoMaterial) {
        const btn = $('#btn-filtrar-traz-resumen');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

        const params = { fechaDesde: fechaDesde, fechaHasta: fechaHasta };
        if (idTipoMaterial) params.idTipoMaterial = idTipoMaterial;

        $.ajax({
            type: "GET",
            url: URL_RESUMEN_KPIS,
            data: params
        })
            .done(function (dataResumen) {
                const res = dataResumen || {};
                estado.kpis = res.Kpis || {};
                estado.evolucionDiaria = res.EvolucionDiaria || [];

                renderizarKPIs(estado.kpis);
                renderizarGraficoShareDataset(estado.evolucionDiaria, estado.granularidad);
                renderizarGraficoBarRotation(estado.evolucionDiaria, estado.granularidad);
            })
            .fail(function (err) {
                console.error("Error al obtener ResumenKPIs de Trazabilidad:", err);
                Swal.fire('Error de conexión', 'No se pudieron obtener los indicadores de trazabilidad desde el servidor.', 'error');
            })
            .always(function () {
                btn.prop('disabled', false).html('<i class="fas fa-search"></i> Filtrar');
            });
    };

    // 4. RENDERIZADO DE LAS 3 BANDAS DE TARJETAS KPI
    const renderizarKPIs = function (k) {
        const bruto = parseFloat(k.TotalPesoBrutoKg || 0);
        const verde = parseFloat(k.TotalPesoVerdeKg || 0);
        const amarillo = parseFloat(k.TotalPesoAmarilloKg || 0);
        const rojo = parseFloat(k.TotalPesoRojoKg || 0);
        const sinClasif = parseFloat(k.DiferenciaSinClasificarKg || 0);
        const egresado = parseFloat(k.TotalEgresadoPlantaKg || 0);
        const balance = parseFloat(k.BalanceFlujoRecuperableKg || 0);

        const pctVerde = parseFloat(k.PorcentajeAprovechamientoVerde || 0);
        const pctRecuperable = parseFloat(k.PorcentajeRecuperableTotal || 0);
        const pctAmarillo = bruto > 0 ? (amarillo * 100 / bruto) : 0;
        const pctRojo = bruto > 0 ? (rojo * 100 / bruto) : 0;

        // --- PARTE 1: Bruto y Porcentajes ---
        $('#kpi-p1-bruto').text(`${formatearKg(bruto)} kg`);
        $('#kpi-p1-sub-bruto').text(`Sin clasif. / merma: ${formatearKg(sinClasif)} kg`);

        $('#kpi-p1-pct-verde').text(`${formatearPorcentaje(pctVerde)}%`);
        $('#kpi-p1-sub-verde').text(`Recuperable total (V+A): ${formatearPorcentaje(pctRecuperable)}%`);

        $('#kpi-p1-pct-amarillo').text(`${formatearPorcentaje(pctAmarillo)}%`);
        $('#kpi-p1-pct-rojo').text(`${formatearPorcentaje(pctRojo)}%`);

        // --- PARTE 2: Flujo de Planta y Descarte ---
        $('#kpi-p2-egresado').text(`${formatearKg(egresado)} kg`);

        const signoBalance = balance > 0 ? '+' : '';
        $('#kpi-p2-balance').text(`${signoBalance}${formatearKg(balance)} kg`);

        if (balance >= 0) {
            $('#card-p2-balance').css({ 'background-color': '#d1fae5', 'border-color': '#059669' });
            $('#lbl-p2-balance, #kpi-p2-balance').css('color', '#047857');
            $('#icon-p2-balance').css({ 'background-color': 'rgba(5, 150, 105, 0.16)', 'color': '#047857' });
            $('#kpi-p2-sub-balance').text('Acumulación neta de stock recuperable');
        } else {
            $('#card-p2-balance').css({ 'background-color': '#fef3c7', 'border-color': '#d97706' });
            $('#lbl-p2-balance, #kpi-p2-balance').css('color', '#b45309');
            $('#icon-p2-balance').css({ 'background-color': 'rgba(217, 119, 6, 0.16)', 'color': '#b45309' });
            $('#kpi-p2-sub-balance').text('Despacho superior al ingreso del período');
        }

        $('#kpi-p2-rojo-descarte').text(`${formatearKg(rojo)} kg`);

        // --- PARTE 3: Lotes y Pesos Físicos en kg ---
        $('#kpi-p3-lotes').text(formatearEntero(k.TotalLotesIngresados));
        $('#kpi-p3-sub-lotes').text(
            `${k.LotesPorCamion || 0} camión / ${k.LotesParticulares || 0} particulares`
        );

        $('#kpi-p3-kg-verde').text(`${formatearKg(verde)} kg`);
        $('#kpi-p3-sub-tiempo').text(
            `Tiempo medio clasif.: ${formatearPorcentaje(k.PromedioHorasClasificacion)} hs`
        );

        $('#kpi-p3-kg-amarillo').text(`${formatearKg(amarillo)} kg`);
        $('#kpi-p3-kg-rojo').text(`${formatearKg(rojo)} kg`);
    };

    // 5. GRÁFICO 1: SHARE DATASET (TORTA ARRIBA + EVOLUCIÓN DE LÍNEAS ABAJO - SOLO MATERIAL REVISADO)
    const renderizarGraficoShareDataset = function (listaDiaria, granularidad) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-traz-share-dataset');
        const msgSinDatos = $('#msg-sin-datos-traz-share');

        // Solo incluimos períodos que tengan recepción bruta y material ya revisado/clasificado
        const conRevisados = (listaDiaria || []).filter(d => {
            const bruto = parseFloat(d.PesoBrutoKg || 0);
            const clasificado = parseFloat(d.PesoVerdeKg || 0)
                + parseFloat(d.PesoAmarilloKg || 0)
                + parseFloat(d.PesoRojoKg || 0);
            return bruto > 0 && clasificado > 0;
        });

        if (conRevisados.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        const agrupado = conRevisados.reduce((acc, item) => {
            const fechaIso = extraerFechaIso(item.Fecha);
            const clave = granularidad === 'mensual' ? fechaIso.substring(0, 7) : fechaIso;

            if (!acc[clave]) {
                acc[clave] = { bruto: 0, verde: 0, amarillo: 0, rojo: 0 };
            }
            acc[clave].bruto += parseFloat(item.PesoBrutoKg || 0);
            acc[clave].verde += parseFloat(item.PesoVerdeKg || 0);
            acc[clave].amarillo += parseFloat(item.PesoAmarilloKg || 0);
            acc[clave].rojo += parseFloat(item.PesoRojoKg || 0);
            return acc;
        }, {});

        const clavesOrdenadas = Object.keys(agrupado).sort();

        const filaFechas = ['Periodo'];
        const filaPctVerde = ['% Útil (Verde)'];
        const filaPctAmarillo = ['% Revisión (Amarillo)'];
        const filaPctRojo = ['% Descarte (Rojo)'];

        const detalleKgPorColumna = {};

        clavesOrdenadas.forEach((clave, idx) => {
            const etiqueta = granularidad === 'mensual'
                ? formatearMesLegible(clave)
                : formatearFechaLegible(clave, true);

            const d = agrupado[clave];
            const revisadoKg = d.verde + d.amarillo + d.rojo;

            const pctV = d.bruto > 0 ? Number(((d.verde * 100) / d.bruto).toFixed(2)) : 0;
            const pctA = d.bruto > 0 ? Number(((d.amarillo * 100) / d.bruto).toFixed(2)) : 0;
            const pctR = d.bruto > 0 ? Number(((d.rojo * 100) / d.bruto).toFixed(2)) : 0;

            filaFechas.push(etiqueta);
            filaPctVerde.push(pctV);
            filaPctAmarillo.push(pctA);
            filaPctRojo.push(pctR);

            detalleKgPorColumna[idx + 1] = {
                etiqueta: etiqueta,
                brutoKg: d.bruto,
                revisadoKg: revisadoKg
            };
        });

        const datasetSource = [
            filaFechas,
            filaPctVerde,
            filaPctAmarillo,
            filaPctRojo
        ];

        const ultimaDimension = clavesOrdenadas.length;

        if (!estado.chartShareDataset || estado.chartShareDataset.isDisposed()) {
            estado.chartShareDataset = echarts.init(dom);
        } else {
            estado.chartShareDataset.off('updateAxisPointer');
        }

        const option = {
            color: ['#198754', '#ffc107', '#dc3545'],
            legend: {
                top: 4,
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                showContent: true,
                formatter: function (params) {
                    if (!params || params.length === 0) return '';
                    const colIdx = params[0].dataIndex + 1;
                    const info = detalleKgPorColumna[colIdx];
                    let html = `<strong>${params[0].axisValue}</strong>`;
                    if (info) {
                        html += `<br/><span class="text-muted small">Bruto: <strong>${formatearKg(info.brutoKg)} kg</strong> | Revisado: <strong>${formatearKg(info.revisadoKg)} kg</strong></span><hr class="my-1"/>`;
                    }
                    params.forEach(p => {
                        if (p.seriesType === 'line') {
                            const valPct = Array.isArray(p.data) ? p.data[colIdx] : p.value;
                            html += `${p.marker} ${p.seriesName}: <strong>${formatearPorcentaje(valPct)}%</strong><br/>`;
                        }
                    });
                    return html;
                }
            },
            toolbox: {
                show: true,
                right: 12,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar PNG' }
                }
            },
            dataset: {
                source: datasetSource
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                axisLabel: { fontWeight: 'bold' }
            },
            yAxis: {
                type: 'value',
                name: '% sobre Bruto',
                min: 0,
                max: 100,
                axisLabel: {
                    formatter: '{value}%'
                },
                splitLine: {
                    lineStyle: { type: 'dashed', color: '#e9ecef' }
                }
            },
            // Gráfico de líneas en la mitad inferior (ancho completo)
            grid: {
                top: '52%',
                left: '4%',
                right: '4%',
                bottom: '7%',
                containLabel: true
            },
            series: [
                {
                    type: 'line',
                    smooth: true,
                    seriesLayoutBy: 'row',
                    symbolSize: 7,
                    lineStyle: { width: 3 },
                    areaStyle: { opacity: 0.12 },
                    emphasis: { focus: 'series' }
                },
                {
                    type: 'line',
                    smooth: true,
                    seriesLayoutBy: 'row',
                    symbolSize: 7,
                    lineStyle: { width: 2.5 },
                    emphasis: { focus: 'series' }
                },
                {
                    type: 'line',
                    smooth: true,
                    seriesLayoutBy: 'row',
                    symbolSize: 7,
                    lineStyle: { width: 2.5 },
                    emphasis: { focus: 'series' }
                },
                // Gráfico de torta en la mitad superior
                {
                    type: 'pie',
                    id: 'pie-traz-share',
                    radius: ['20%', '35%'],
                    center: ['50%', '26%'],
                    emphasis: {
                        focus: 'self'
                    },
                    itemStyle: {
                        borderRadius: 5,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        formatter: '{b}: {@[' + ultimaDimension + ']}%',
                        fontWeight: 'bold',
                        fontSize: 12
                    },
                    encode: {
                        itemName: 'Periodo',
                        value: ultimaDimension,
                        tooltip: ultimaDimension
                    }
                }
            ]
        };

        estado.chartShareDataset.setOption(option, true);

        estado.chartShareDataset.on('updateAxisPointer', function (event) {
            const xAxisInfo = event.axesInfo && event.axesInfo[0];
            if (xAxisInfo) {
                const dimension = xAxisInfo.value + 1;
                estado.chartShareDataset.setOption({
                    series: {
                        id: 'pie-traz-share',
                        label: {
                            formatter: '{b}: {@[' + dimension + ']}%'
                        },
                        encode: {
                            value: dimension,
                            tooltip: dimension
                        }
                    }
                });
            }
        });
    };

    // 6. GRÁFICO 2: BAR LABEL ROTATION (CRUCE DE LOTES Y CLASIFICACIÓN RS2 - SIN EGRESOS)
    const renderizarGraficoBarRotation = function (listaDiaria, granularidad) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-traz-bar-rotation');
        const msgSinDatos = $('#msg-sin-datos-traz-barras');

        // Excluimos fechas que solo tuvieron salidas de planta (sin lotes ni ingresos)
        const conRecepcion = (listaDiaria || []).filter(item => {
            return parseInt(item.CantLotes || 0, 10) > 0
                || parseFloat(item.PesoBrutoKg || 0) > 0
                || parseFloat(item.PesoVerdeKg || 0) > 0
                || parseFloat(item.PesoAmarilloKg || 0) > 0
                || parseFloat(item.PesoRojoKg || 0) > 0;
        });

        if (conRecepcion.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        const agrupado = conRecepcion.reduce((acc, item) => {
            const fechaIso = extraerFechaIso(item.Fecha);
            const clave = granularidad === 'mensual' ? fechaIso.substring(0, 7) : fechaIso;

            if (!acc[clave]) {
                acc[clave] = {
                    lotes: 0,
                    bruto: 0,
                    verde: 0,
                    amarillo: 0,
                    rojo: 0
                };
            }
            acc[clave].lotes += parseInt(item.CantLotes || 0, 10);
            acc[clave].bruto += parseFloat(item.PesoBrutoKg || 0);
            acc[clave].verde += parseFloat(item.PesoVerdeKg || 0);
            acc[clave].amarillo += parseFloat(item.PesoAmarilloKg || 0);
            acc[clave].rojo += parseFloat(item.PesoRojoKg || 0);
            return acc;
        }, {});

        const clavesOrdenadas = Object.keys(agrupado).sort();
        const etiquetasX = clavesOrdenadas.map(c =>
            granularidad === 'mensual' ? formatearMesLegible(c) : formatearFechaLegible(c, true)
        );

        const serieLotes = clavesOrdenadas.map(c => agrupado[c].lotes);
        const serieBruto = clavesOrdenadas.map(c => Number(agrupado[c].bruto.toFixed(2)));
        const serieVerde = clavesOrdenadas.map(c => Number(agrupado[c].verde.toFixed(2)));
        const serieAmarillo = clavesOrdenadas.map(c => Number(agrupado[c].amarillo.toFixed(2)));
        const serieRojo = clavesOrdenadas.map(c => Number(agrupado[c].rojo.toFixed(2)));

        if (!estado.chartBarRotation || estado.chartBarRotation.isDisposed()) {
            estado.chartBarRotation = echarts.init(dom);
        }

        const labelOptionKg = {
            show: true,
            rotate: 90,
            align: 'left',
            verticalAlign: 'middle',
            position: 'insideBottom',
            distance: 10,
            fontSize: 10,
            fontWeight: 'bold',
            color: '#212529',
            formatter: function (params) {
                if (!params.value || params.value <= 0) return '';
                return `${formatearEntero(params.value)} kg  ${params.seriesName}`;
            }
        };

        const labelOptionLotes = {
            show: true,
            rotate: 90,
            align: 'left',
            verticalAlign: 'middle',
            position: 'insideBottom',
            distance: 10,
            fontSize: 10,
            fontWeight: 'bold',
            color: '#0c4a6e',
            formatter: function (params) {
                if (!params.value || params.value <= 0) return '';
                return `${params.value} lotes  ${params.seriesName}`;
            }
        };

        const mostrarZoom = clavesOrdenadas.length > 8;
        const porcentajeInicioZoom = mostrarZoom
            ? Math.max(0, Math.round(((clavesOrdenadas.length - 8) / clavesOrdenadas.length) * 100))
            : 0;

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function (params) {
                    if (!params || params.length === 0) return '';
                    let html = `<strong>${params[0].axisValue}</strong><hr class="my-1"/>`;
                    params.forEach(p => {
                        const esLote = p.seriesName === 'Cant. Lotes';
                        const valorFmt = esLote
                            ? `${formatearEntero(p.value)} lotes`
                            : `${formatearKg(p.value)} kg`;
                        html += `${p.marker} ${p.seriesName}: <strong>${valorFmt}</strong><br/>`;
                    });
                    return html;
                }
            },
            legend: {
                top: 4,
                data: [
                    'Cant. Lotes',
                    'Bruto Ingresado',
                    'Útil (Verde)',
                    'Revisión (Amarillo)',
                    'Descarte (Rojo)'
                ]
            },
            toolbox: {
                show: true,
                orient: 'vertical',
                left: 'right',
                top: 'center',
                feature: {
                    mark: { show: true },
                    magicType: { show: true, type: ['line', 'bar', 'stack'] },
                    restore: { show: true },
                    saveAsImage: { show: true, title: 'Descargar PNG' }
                }
            },
            dataZoom: mostrarZoom ? [
                {
                    type: 'slider',
                    show: true,
                    start: porcentajeInicioZoom,
                    end: 100,
                    height: 20,
                    bottom: 6
                },
                {
                    type: 'inside',
                    start: porcentajeInicioZoom,
                    end: 100
                }
            ] : [],
            grid: {
                top: 52,
                left: '4%',
                right: '6%',
                bottom: mostrarZoom ? 52 : 30,
                containLabel: true
            },
            xAxis: [
                {
                    type: 'category',
                    axisTick: { show: false },
                    data: etiquetasX,
                    axisLabel: { fontWeight: 'bold' }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    name: 'Masa (kg)',
                    position: 'left',
                    axisLabel: {
                        formatter: val => formatearEntero(val) + ' kg'
                    },
                    splitLine: {
                        lineStyle: { type: 'dashed', color: '#e9ecef' }
                    }
                },
                {
                    type: 'value',
                    name: 'Lotes',
                    position: 'right',
                    minInterval: 1,
                    axisLabel: {
                        formatter: '{value} u.'
                    },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: 'Cant. Lotes',
                    type: 'bar',
                    yAxisIndex: 1,
                    barGap: '15%',
                    itemStyle: { color: '#38bdf8', borderRadius: [4, 4, 0, 0] },
                    label: labelOptionLotes,
                    emphasis: { focus: 'series' },
                    data: serieLotes
                },
                {
                    name: 'Bruto Ingresado',
                    type: 'bar',
                    yAxisIndex: 0,
                    itemStyle: { color: '#0d6efd', borderRadius: [4, 4, 0, 0] },
                    label: labelOptionKg,
                    emphasis: { focus: 'series' },
                    data: serieBruto
                },
                {
                    name: 'Útil (Verde)',
                    type: 'bar',
                    yAxisIndex: 0,
                    itemStyle: { color: '#198754', borderRadius: [4, 4, 0, 0] },
                    label: labelOptionKg,
                    emphasis: { focus: 'series' },
                    data: serieVerde
                },
                {
                    name: 'Revisión (Amarillo)',
                    type: 'bar',
                    yAxisIndex: 0,
                    itemStyle: { color: '#ffc107', borderRadius: [4, 4, 0, 0] },
                    label: labelOptionKg,
                    emphasis: { focus: 'series' },
                    data: serieAmarillo
                },
                {
                    name: 'Descarte (Rojo)',
                    type: 'bar',
                    yAxisIndex: 0,
                    itemStyle: { color: '#dc3545', borderRadius: [4, 4, 0, 0] },
                    label: labelOptionKg,
                    emphasis: { focus: 'series' },
                    data: serieRojo
                }
            ]
        };

        estado.chartBarRotation.setOption(option, true);
    };

    // API Pública del Módulo
    return {
        cargarEn: inicializar
    };
})();

