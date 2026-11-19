/* ========================================================================
   SITMAS - Módulo de Reportes de Trazabilidad: Resumen Ejecutivo y Balance
   Consume: GET /api/ReportesTrazabilidad/ResumenKPIs
            GET /api/ReportesTrazabilidad/AuditoriaLotes (para Boxplot estadístico)
   Incluye: 4 KPIs + Evolución Temporal + Dona Balance + Boxplot Semáforo + Tabla
   Archivo: Js/reportes_trazabilidad/reporte_traz_resumen.js
   ======================================================================== */

const ReporteTrazResumenModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        kpis: null,
        evolucionDiaria: [],
        clasificacionesIndividuales: [],
        granularidad: 'diaria', // 'diaria' | 'mensual'
        chartEvolucion: null,
        chartBalanceDona: null,
        chartBoxplotSemaforo: null
    };

    const URL_RESUMEN_KPIS = "https://localhost:44325/api/ReportesTrazabilidad/ResumenKPIs";
    const URL_POR_MATERIAL = "https://localhost:44325/api/ReportesTrazabilidad/PorMaterial";
    const URL_AUDITORIA_LOTES = "https://localhost:44325/api/ReportesTrazabilidad/AuditoriaLotes";

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

    // Limpieza segura de instancias ECharts al cambiar de pestaña en la SPA
    const destruirGraficosActivos = function () {
        ['chartEvolucion', 'chartBalanceDona', 'chartBoxplotSemaforo'].forEach(key => {
            if (estado[key] && !estado[key].isDisposed()) {
                estado[key].dispose();
            }
            estado[key] = null;
        });
    };

    // 1. INICIALIZACIÓN DE LA ESTRUCTURA VISUAL (PIRÁMIDE INVERTIDA)
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
                        <small class="text-muted">Auditoría consolidada de pesaje bruto, clasificación por semáforo de calidad, tiempos y egresos de planta</small>
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

            <!-- NIVEL 2: 4 TARJETAS KPI EJECUTIVAS -->
            <div class="row g-3 mb-4 fade-in">
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-primary border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Total Bruto Ingresado</span>
                                <span class="badge bg-primary bg-opacity-10 text-primary p-2"><i class="fas fa-weight-hanging fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-dark mb-1" id="kpi-traz-bruto">0,00 kg</h3>
                            <small class="text-muted" id="kpi-traz-sub-lotes">0 lotes (0 camión / 0 part.)</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-success border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Útil Directo (Verde)</span>
                                <span class="badge bg-success bg-opacity-10 text-success p-2"><i class="fas fa-recycle fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-success mb-1" id="kpi-traz-verde">0,00 kg</h3>
                            <small class="text-muted" id="kpi-traz-sub-aprov">0,0% directo (0,0% incl. Amarillo)</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-info border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Egresado / Producido</span>
                                <span class="badge bg-info bg-opacity-10 text-info p-2"><i class="fas fa-dolly-flatbed fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-dark mb-1" id="kpi-traz-egresado">0,00 kg</h3>
                            <small class="text-muted" id="kpi-traz-sub-tiempo">Tiempo medio clasif.: 0,0 hs</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-warning border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Sin Clasificar / Merma</span>
                                <span class="badge bg-warning bg-opacity-10 text-warning p-2"><i class="fas fa-exclamation-triangle fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-dark mb-1" id="kpi-traz-sin-clasif">0,00 kg</h3>
                            <small class="text-muted" id="kpi-traz-sub-semaforo">Rojo: 0,00 kg | Amarillo: 0,00 kg</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 3: GRÁFICOS ANALÍTICOS INTERACTIVOS (EVOLUCIÓN + DONA) -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12 col-xl-8">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-chart-area text-primary me-2"></i>Evolución de Ingresos Brutos vs. Semáforo de Clasificación
                                </h6>
                                <small class="text-muted">Comparativa cronológica del flujo de material recibido y recuperado</small>
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
                            <div id="msg-sin-datos-traz-evolucion" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-chart-line fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No se registraron ingresos de material en el rango de fechas seleccionado.</p>
                            </div>
                            <div id="echarts-traz-evolucion" style="width: 100%; height: 390px;"></div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-xl-4">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white border-bottom py-3">
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-chart-pie text-success me-2"></i>Balance de Masa del Período
                            </h6>
                            <small class="text-muted">Distribución porcentual sobre el peso bruto ingresado</small>
                        </div>
                        <div class="card-body">
                            <div id="msg-sin-datos-traz-dona" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-pie-chart fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">Sin masa ingresada para distribuir.</p>
                            </div>
                            <div id="echarts-traz-balance-dona" style="width: 100%; height: 390px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 3.5: DIAGRAMA DE CAJA Y BIGOTES (BOXPLOT) POR ESTADO DEL SEMÁFORO -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-sliders-h text-success me-2"></i>Distribución Estadística de Pesajes por Estado (Diagrama de Caja / Boxplot)
                                </h6>
                                <small class="text-muted" id="subtitulo-boxplot-semaforo">
                                    Analiza la mediana, rango intercuartílico (50% central de pesajes) y detección automática de valores atípicos
                                </small>
                            </div>
                            <span class="badge bg-light text-secondary border">
                                <i class="fas fa-info-circle text-primary me-1"></i>Caja: Q1–Q3 | Línea: Mediana | Puntos: Atípicos
                            </span>
                        </div>

                        <div class="card-body">
                            <div id="msg-sin-datos-traz-boxplot" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-box-open fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No hay pesajes clasificados en Verde, Amarillo o Rojo para calcular cuartiles en este período.</p>
                            </div>
                            <div id="echarts-traz-boxplot" style="width: 100%; height: 390px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 4: TABLA DETALLADA DE AUDITORÍA DIARIA -->
            <div class="row fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3">
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-table text-secondary me-2"></i>Detalle Cronológico de Recepción y Clasificación
                            </h6>
                            <small class="text-muted">Consolidado diario de lotes recibidos, pesos clasificados por bandera y tasa de aprovechamiento</small>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Fecha</th>
                                            <th class="text-center">Lotes</th>
                                            <th class="text-end">Peso Bruto (kg)</th>
                                            <th class="text-end text-success">Útil Verde (kg)</th>
                                            <th class="text-end text-warning">Revisión Amarillo (kg)</th>
                                            <th class="text-end text-danger">Descarte Rojo (kg)</th>
                                            <th class="text-end">Sin Clasif. / Merma</th>
                                            <th class="text-center">% Aprov. Directo</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-traz-resumen-diario">
                                        <tr>
                                            <td colspan="8" class="text-center text-muted py-4">Cargando datos...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
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

            consultarDatosCompletos(desde, hasta, idTipoMaterial);
        });

        // Switch Diario vs Mensual (en memoria)
        principal.off('click', '.btn-gran-traz-res').on('click', '.btn-gran-traz-res', function () {
            const nuevoModo = $(this).data('modo');
            if (nuevoModo === estado.granularidad) return;

            estado.granularidad = nuevoModo;
            $('.btn-gran-traz-res').removeClass('btn-primary active').addClass('btn-outline-primary');
            $(this).removeClass('btn-outline-primary').addClass('btn-primary active');

            renderizarGraficoEvolucion(estado.evolucionDiaria, estado.granularidad);
        });

        // Responsividad limpia para ECharts
        $(window).off('resize.trazResumen').on('resize.trazResumen', function () {
            if (estado.chartEvolucion && !estado.chartEvolucion.isDisposed()) {
                estado.chartEvolucion.resize();
            }
            if (estado.chartBalanceDona && !estado.chartBalanceDona.isDisposed()) {
                estado.chartBalanceDona.resize();
            }
            if (estado.chartBoxplotSemaforo && !estado.chartBoxplotSemaforo.isDisposed()) {
                estado.chartBoxplotSemaforo.resize();
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

    // 3. CONSULTA EN PARALELO A LA API
    const consultarDatosCompletos = function (fechaDesde, fechaHasta, idTipoMaterial) {
        const btn = $('#btn-filtrar-traz-resumen');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

        const params = { fechaDesde: fechaDesde, fechaHasta: fechaHasta };
        if (idTipoMaterial) params.idTipoMaterial = idTipoMaterial;

        const reqResumen = $.ajax({ type: "GET", url: URL_RESUMEN_KPIS, data: params });
        const reqAuditoria = $.ajax({ type: "GET", url: URL_AUDITORIA_LOTES, data: params });

        $.when(reqResumen, reqAuditoria)
            .done(function (resSummary, resAudit) {
                const dataResumen = resSummary[0] || {};
                const dataAudit = resAudit[0] || {};

                estado.kpis = dataResumen.Kpis || {};
                estado.evolucionDiaria = dataResumen.EvolucionDiaria || [];

                const lotes = dataAudit.Lotes || [];
                const registrosUnitarios = [];

                lotes.forEach(lote => {
                    const hijos = lote.Clasificaciones || [];
                    hijos.forEach(c => {
                        registrosUnitarios.push({
                            idClasificacion: c.IdClasificacion,
                            idLote: lote.IdDetalleIngreso,
                            origen: lote.NombreOrigen || 'Sin Origen',
                            tipoMaterial: lote.TipoMaterial || 'Sin Tipo',
                            subtipo: c.Subtipo || 'Sin Subtipo',
                            pesoUtil: parseFloat(c.PesoUtil || 0),
                            idEstadoMaterial: c.IdEstadoMaterial,
                            semaforoEstado: c.SemaforoEstado,
                            fecha: formatearFechaLegible(c.FechaClasificacion || lote.FechaIngreso, false),
                            operador: c.OperadorClasificador || 'Sin Operador'
                        });
                    });
                });

                estado.clasificacionesIndividuales = registrosUnitarios;

                renderizarKPIs(estado.kpis);
                renderizarGraficoEvolucion(estado.evolucionDiaria, estado.granularidad);
                renderizarGraficoBalanceDona(estado.kpis);
                renderizarGraficoBoxplot(estado.clasificacionesIndividuales);
                renderizarTablaDiaria(estado.evolucionDiaria);
            })
            .fail(function (err) {
                console.error("Error al obtener datos de Trazabilidad:", err);
                Swal.fire('Error de conexión', 'No se pudieron obtener los indicadores de trazabilidad desde el servidor.', 'error');
            })
            .always(function () {
                btn.prop('disabled', false).html('<i class="fas fa-search"></i> Filtrar');
            });
    };

    // 4. RENDERIZADO DE TARJETAS KPI
    const renderizarKPIs = function (k) {
        $('#kpi-traz-bruto').text(`${formatearKg(k.TotalPesoBrutoKg)} kg`);
        $('#kpi-traz-sub-lotes').text(
            `${k.TotalLotesIngresados || 0} lotes (${k.LotesPorCamion || 0} camión / ${k.LotesParticulares || 0} part.)`
        );

        $('#kpi-traz-verde').text(`${formatearKg(k.TotalPesoVerdeKg)} kg`);
        $('#kpi-traz-sub-aprov').text(
            `${formatearPorcentaje(k.PorcentajeAprovechamientoVerde)}% directo (${formatearPorcentaje(k.PorcentajeRecuperableTotal)}% incl. Amarillo)`
        );

        $('#kpi-traz-egresado').text(`${formatearKg(k.TotalEgresadoPlantaKg)} kg`);
        $('#kpi-traz-sub-tiempo').text(
            `Tiempo medio clasif.: ${formatearPorcentaje(k.PromedioHorasClasificacion)} hs`
        );

        $('#kpi-traz-sin-clasif').text(`${formatearKg(k.DiferenciaSinClasificarKg)} kg`);
        $('#kpi-traz-sub-semaforo').text(
            `Rojo: ${formatearKg(k.TotalPesoRojoKg)} kg | Amarillo: ${formatearKg(k.TotalPesoAmarilloKg)} kg`
        );
    };

    // 5. GRÁFICO 1: EVOLUCIÓN CRONOLÓGICA
    const renderizarGraficoEvolucion = function (listaDiaria, granularidad) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-traz-evolucion');
        const msgSinDatos = $('#msg-sin-datos-traz-evolucion');

        if (!listaDiaria || listaDiaria.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        const agrupado = listaDiaria.reduce((acc, item) => {
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
        const etiquetasEjeX = clavesOrdenadas.map(c =>
            granularidad === 'mensual' ? formatearMesLegible(c) : formatearFechaLegible(c, true)
        );

        const serieBruto = clavesOrdenadas.map(c => Number(agrupado[c].bruto.toFixed(2)));
        const serieVerde = clavesOrdenadas.map(c => Number(agrupado[c].verde.toFixed(2)));
        const serieAmarillo = clavesOrdenadas.map(c => Number(agrupado[c].amarillo.toFixed(2)));
        const serieRojo = clavesOrdenadas.map(c => Number(agrupado[c].rojo.toFixed(2)));

        if (!estado.chartEvolucion || estado.chartEvolucion.isDisposed()) {
            estado.chartEvolucion = echarts.init(dom);
        }

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                top: 0,
                data: ['Bruto Ingresado', 'Útil (Verde)', 'Revisión (Amarillo)', 'Descarte (Rojo)']
            },
            toolbox: {
                show: true,
                right: 10,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar PNG' }
                }
            },
            grid: {
                top: 48,
                bottom: 30,
                left: '3%',
                right: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: etiquetasEjeX,
                axisLabel: { fontWeight: 'bold' }
            },
            yAxis: {
                type: 'value',
                name: 'Kilogramos (kg)',
                axisLabel: {
                    formatter: val => val.toLocaleString('es-AR') + ' kg'
                }
            },
            series: [
                {
                    name: 'Bruto Ingresado',
                    type: 'bar',
                    barMaxWidth: 42,
                    itemStyle: { color: 'rgba(13, 110, 253, 0.75)', borderRadius: [5, 5, 0, 0] },
                    data: serieBruto
                },
                {
                    name: 'Útil (Verde)',
                    type: 'line',
                    smooth: true,
                    symbolSize: 8,
                    itemStyle: { color: '#198754' },
                    lineStyle: { width: 3 },
                    areaStyle: { color: 'rgba(25, 135, 84, 0.12)' },
                    data: serieVerde
                },
                {
                    name: 'Revisión (Amarillo)',
                    type: 'line',
                    smooth: true,
                    symbolSize: 7,
                    itemStyle: { color: '#ffc107' },
                    lineStyle: { width: 2, type: 'dashed' },
                    data: serieAmarillo
                },
                {
                    name: 'Descarte (Rojo)',
                    type: 'line',
                    smooth: true,
                    symbolSize: 7,
                    itemStyle: { color: '#dc3545' },
                    lineStyle: { width: 2 },
                    data: serieRojo
                }
            ]
        };

        estado.chartEvolucion.setOption(option, true);
    };

    // 6. GRÁFICO 2: DONA DE BALANCE DE MASA
    const renderizarGraficoBalanceDona = function (k) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-traz-balance-dona');
        const msgSinDatos = $('#msg-sin-datos-traz-dona');
        const totalBruto = parseFloat(k.TotalPesoBrutoKg || 0);

        if (totalBruto <= 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        if (!estado.chartBalanceDona || estado.chartBalanceDona.isDisposed()) {
            estado.chartBalanceDona = echarts.init(dom);
        }

        const verde = Number(parseFloat(k.TotalPesoVerdeKg || 0).toFixed(2));
        const amarillo = Number(parseFloat(k.TotalPesoAmarilloKg || 0).toFixed(2));
        const rojo = Number(parseFloat(k.TotalPesoRojoKg || 0).toFixed(2));
        const sinClasif = Number(Math.max(0, parseFloat(k.DiferenciaSinClasificarKg || 0)).toFixed(2));

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: function (p) {
                    return `<strong>${p.name}</strong><br/>Masa: <strong>${formatearKg(p.value)} kg</strong> (${p.percent}%)`;
                }
            },
            legend: {
                bottom: 0,
                left: 'center'
            },
            toolbox: {
                show: true,
                right: 10,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar PNG' }
                }
            },
            series: [
                {
                    name: 'Balance de Masa',
                    type: 'pie',
                    radius: ['44%', '70%'],
                    center: ['50%', '45%'],
                    avoidLabelOverlap: true,
                    itemStyle: {
                        borderRadius: 6,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        formatter: '{d}%',
                        fontWeight: 'bold'
                    },
                    data: [
                        { value: verde, name: 'Útil Directo (Verde)', itemStyle: { color: '#198754' } },
                        { value: amarillo, name: 'Revisión (Amarillo)', itemStyle: { color: '#ffc107' } },
                        { value: rojo, name: 'Descarte (Rojo)', itemStyle: { color: '#dc3545' } },
                        { value: sinClasif, name: 'Sin Clasif. / Merma', itemStyle: { color: '#6c757d' } }
                    ]
                }
            ]
        };

        estado.chartBalanceDona.setOption(option, true);
    };

    // 7. GRÁFICO 3: DIAGRAMA DE CAJA Y BIGOTES (BOXPLOT + OUTLIERS) EN JS PURO
    const calcularCuartil = function (ordenados, q) {
        const pos = (ordenados.length - 1) * q;
        const base = Math.floor(pos);
        const resto = pos - base;
        if (ordenados[base + 1] !== undefined) {
            return ordenados[base] + resto * (ordenados[base + 1] - ordenados[base]);
        }
        return ordenados[base];
    };

    const procesarGrupoBoxplot = function (registrosGrupo, indiceCategoria, nombreCategoria, colorHex, colorFill) {
        if (!registrosGrupo || registrosGrupo.length === 0) {
            return { boxData: null, outliers: [] };
        }

        const ordenados = [...registrosGrupo].sort((a, b) => a.pesoUtil - b.pesoUtil);
        const valores = ordenados.map(r => r.pesoUtil);
        const n = valores.length;

        const q1 = calcularCuartil(valores, 0.25);
        const mediana = calcularCuartil(valores, 0.50);
        const q3 = calcularCuartil(valores, 0.75);
        const iqr = q3 - q1;

        const limiteInf = q1 - 1.5 * iqr;
        const limiteSup = q3 + 1.5 * iqr;

        const normales = valores.filter(v => v >= limiteInf && v <= limiteSup);
        const minBigote = normales.length > 0 ? Math.min(...normales) : valores[0];
        const maxBigote = normales.length > 0 ? Math.max(...normales) : valores[n - 1];

        const suma = valores.reduce((acc, v) => acc + v, 0);
        const promedio = suma / n;

        // Detectamos pesajes atípicos (outliers) fuera de los bigotes
        const outliers = ordenados
            .filter(r => r.pesoUtil < limiteInf || r.pesoUtil > limiteSup)
            .map(r => ({
                value: [indiceCategoria, Number(r.pesoUtil.toFixed(2))],
                categoria: nombreCategoria,
                idClasificacion: r.idClasificacion,
                idLote: r.idLote,
                subtipo: r.subtipo,
                origen: r.origen,
                fecha: r.fecha,
                itemStyle: {
                    color: colorHex,
                    borderColor: '#212529',
                    borderWidth: 1.5
                }
            }));

        return {
            boxData: {
                value: [
                    Number(minBigote.toFixed(2)),
                    Number(q1.toFixed(2)),
                    Number(mediana.toFixed(2)),
                    Number(q3.toFixed(2)),
                    Number(maxBigote.toFixed(2))
                ],
                nombreCategoria: nombreCategoria,
                n: n,
                promedio: Number(promedio.toFixed(2)),
                totalKg: Number(suma.toFixed(2)),
                minAbs: Number(valores[0].toFixed(2)),
                maxAbs: Number(valores[n - 1].toFixed(2)),
                itemStyle: {
                    color: colorFill,
                    borderColor: colorHex,
                    borderWidth: 2.5
                }
            },
            outliers: outliers
        };
    };

    const renderizarGraficoBoxplot = function (listaUnitaria) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-traz-boxplot');
        const msgSinDatos = $('#msg-sin-datos-traz-boxplot');

        const validos = (listaUnitaria || []).filter(r => parseFloat(r.pesoUtil || 0) > 0);

        if (validos.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            $('#subtitulo-boxplot-semaforo').text('Sin registros individuales de clasificación en este rango.');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        const gruposConfig = [
            { id: 1, nombre: 'Útil (Verde)', borde: '#198754', relleno: 'rgba(25, 135, 84, 0.25)' },
            { id: 2, nombre: 'Revisión (Amarillo)', borde: '#e0a800', relleno: 'rgba(255, 193, 7, 0.30)' },
            { id: 3, nombre: 'Descarte (Rojo)', borde: '#dc3545', relleno: 'rgba(220, 53, 69, 0.25)' }
        ];

        const categorias = gruposConfig.map(g => g.nombre);
        const seriesBoxplot = [];
        let todosOutliers = [];

        gruposConfig.forEach((g, idx) => {
            const regsGrupo = validos.filter(r => r.idEstadoMaterial === g.id);
            const resultado = procesarGrupoBoxplot(regsGrupo, idx, g.nombre, g.borde, g.relleno);

            if (resultado.boxData) {
                seriesBoxplot.push(resultado.boxData);
            } else {
                // Si una categoría no tiene pesajes en el período, ponemos caja vacía en 0
                seriesBoxplot.push({
                    value: [0, 0, 0, 0, 0],
                    nombreCategoria: g.nombre,
                    n: 0,
                    promedio: 0,
                    totalKg: 0,
                    minAbs: 0,
                    maxAbs: 0,
                    itemStyle: { color: g.relleno, borderColor: g.borde, borderWidth: 1.5 }
                });
            }

            todosOutliers = todosOutliers.concat(resultado.outliers);
        });

        $('#subtitulo-boxplot-semaforo').text(
            `Distribución estadística calculada sobre ${validos.length} pesajes individuales (${todosOutliers.length} atípicos detectados)`
        );

        if (!estado.chartBoxplotSemaforo || estado.chartBoxplotSemaforo.isDisposed()) {
            estado.chartBoxplotSemaforo = echarts.init(dom);
        }

        const option = {
            tooltip: {
                trigger: 'item',
                axisPointer: { type: 'shadow' },
                formatter: function (p) {
                    if (p.seriesType === 'boxplot') {
                        const d = p.data;
                        const [minB, q1, med, q3, maxB] = d.value;
                        if (d.n === 0) {
                            return `<strong>${d.nombreCategoria}</strong><br/>Sin pesajes registrados en este período.`;
                        }
                        return `
                            <strong>${d.nombreCategoria}</strong> (${d.n} pesajes)<br/>
                            <hr class="my-1"/>
                            Bigote Máximo: <strong>${formatearKg(maxB)} kg</strong><br/>
                            Cuartil 3 (Q3 - 75%): <strong>${formatearKg(q3)} kg</strong><br/>
                            <span style="color:#0d6efd;">Mediana (Q2 - 50%): <strong>${formatearKg(med)} kg</strong></span><br/>
                            Cuartil 1 (Q1 - 25%): <strong>${formatearKg(q1)} kg</strong><br/>
                            Bigote Mínimo: <strong>${formatearKg(minB)} kg</strong><br/>
                            <hr class="my-1"/>
                            <small class="text-muted">Promedio: <strong>${formatearKg(d.promedio)} kg</strong> | Total: <strong>${formatearKg(d.totalKg)} kg</strong></small>
                        `;
                    } else {
                        const o = p.data;
                        return `
                            <span class="badge bg-dark mb-1">Valor Atípico (Outlier)</span><br/>
                            <strong>${o.categoria} — Pesaje #${o.idClasificacion}</strong><br/>
                            Subtipo: <strong>${o.subtipo}</strong><br/>
                            Peso Registrado: <strong>${formatearKg(o.value[1])} kg</strong><br/>
                            <small class="text-muted">Lote #${o.idLote} (${o.fecha}) — ${o.origen}</small>
                        `;
                    }
                }
            },
            toolbox: {
                show: true,
                right: 15,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar PNG' }
                }
            },
            grid: {
                top: 40,
                bottom: 35,
                left: '4%',
                right: '4%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: categorias,
                boundaryGap: true,
                axisLabel: {
                    fontWeight: 'bold',
                    fontSize: 13,
                    color: '#212529'
                },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                name: 'Peso por Pesaje (kg)',
                nameTextStyle: { fontWeight: 'bold' },
                axisLabel: {
                    formatter: val => val.toLocaleString('es-AR') + ' kg'
                },
                splitLine: {
                    lineStyle: { type: 'dashed', color: '#e9ecef' }
                }
            },
            series: [
                {
                    name: 'Distribución Cuartiles',
                    type: 'boxplot',
                    boxWidth: ['22%', '38%'],
                    data: seriesBoxplot
                },
                {
                    name: 'Pesajes Atípicos',
                    type: 'scatter',
                    symbolSize: 11,
                    data: todosOutliers
                }
            ]
        };

        estado.chartBoxplotSemaforo.setOption(option, true);
    };

    // 8. TABLA DE AUDITORÍA DIARIA
    const renderizarTablaDiaria = function (listaDiaria) {
        const tbody = $('#tbody-traz-resumen-diario').empty();

        if (!listaDiaria || listaDiaria.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="fas fa-folder-open me-2"></i>No se encontraron movimientos en el período seleccionado.
                    </td>
                </tr>
            `);
            return;
        }

        const ordenadaDesc = [...listaDiaria].reverse();

        ordenadaDesc.forEach(reg => {
            const bruto = parseFloat(reg.PesoBrutoKg || 0);
            const verde = parseFloat(reg.PesoVerdeKg || 0);
            const amarillo = parseFloat(reg.PesoAmarilloKg || 0);
            const rojo = parseFloat(reg.PesoRojoKg || 0);
            const diff = bruto - (verde + amarillo + rojo);
            const pctAprov = bruto > 0 ? (verde * 100 / bruto) : 0;

            const badgeClase = pctAprov >= 70
                ? 'bg-success bg-opacity-10 text-success border border-success'
                : (pctAprov >= 40
                    ? 'bg-warning bg-opacity-10 text-dark border border-warning'
                    : 'bg-secondary bg-opacity-10 text-secondary border');

            tbody.append(`
                <tr>
                    <td class="fw-bold">${formatearFechaLegible(reg.Fecha, false)}</td>
                    <td class="text-center"><span class="badge bg-light text-dark border">${reg.CantLotes}</span></td>
                    <td class="text-end fw-semibold">${formatearKg(bruto)} kg</td>
                    <td class="text-end text-success fw-semibold">${formatearKg(verde)} kg</td>
                    <td class="text-end text-warning fw-semibold">${formatearKg(amarillo)} kg</td>
                    <td class="text-end text-danger fw-semibold">${formatearKg(rojo)} kg</td>
                    <td class="text-end text-muted">${formatearKg(diff)} kg</td>
                    <td class="text-center"><span class="badge ${badgeClase}">${formatearPorcentaje(pctAprov)}%</span></td>
                </tr>
            `);
        });
    };

    // API Pública del Módulo
    return {
        cargarEn: inicializar
    };
})();


