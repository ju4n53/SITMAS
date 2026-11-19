/* ========================================================================
   SITMAS - Módulo de Reportes de Trazabilidad: Tipos, Subtipos y Flujo Sankey
   Consume: GET /api/ReportesTrazabilidad/PorMaterial
   Incluye: 4 KPIs + Barras Apiladas por Tipo + Diagrama Sankey Full-Width (PDF Ready)
   Archivo: Js/reportes_trazabilidad/reporte_traz_materiales.js
   ======================================================================== */

const ReporteTrazMaterialesModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        tipos: [],
        subtipos: [],
        modoSubtipos: 'sankey', // 'sankey' | 'bar'
        chartApiladoTipos: null,
        chartSubtipos: null
    };

    const URL_POR_MATERIAL = "https://localhost:44325/api/ReportesTrazabilidad/PorMaterial";

    // Paleta institucional limpia para diferenciar familias de materiales en el Sankey
    const PALETA_MATERIALES = [
        '#0d6efd', '#198754', '#20c997', '#fd7e14',
        '#6f42c1', '#0dcaf0', '#d63384', '#6610f2'
    ];

    // Helpers de formateo regional (es-AR)
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

    // Limpieza segura de instancias ECharts al cambiar de pestaña en la SPA
    const destruirGraficosActivos = function () {
        ['chartApiladoTipos', 'chartSubtipos'].forEach(key => {
            if (estado[key] && !estado[key].isDisposed()) {
                estado[key].dispose();
            }
            estado[key] = null;
        });
    };

    // Normalizadores defensivos para garantizar compatibilidad con el DTO de C#
    const normalizarTipos = function (listaRaw) {
        return (listaRaw || []).map(item => {
            const bruto = parseFloat(item.TotalPesoBrutoKg ?? item.PesoBrutoKg ?? 0);
            const verde = parseFloat(item.TotalPesoVerdeKg ?? item.PesoVerdeKg ?? 0);
            const amarillo = parseFloat(item.TotalPesoAmarilloKg ?? item.PesoAmarilloKg ?? 0);
            const rojo = parseFloat(item.TotalPesoRojoKg ?? item.PesoRojoKg ?? 0);
            const merma = Math.max(0, bruto - (verde + amarillo + rojo));
            const pctVerde = item.PorcentajeAprovechamientoVerde !== undefined
                ? parseFloat(item.PorcentajeAprovechamientoVerde || 0)
                : (bruto > 0 ? (verde * 100 / bruto) : 0);

            return {
                idTipoMaterial: item.IdTipoMaterial ?? 0,
                tipoMaterial: item.TipoMaterial || 'Sin Categoría',
                cantLotes: item.CantLotes ?? item.CantidadLotes ?? 0,
                bruto: bruto,
                verde: verde,
                amarillo: amarillo,
                rojo: rojo,
                merma: merma,
                pctVerde: pctVerde
            };
        });
    };

    const normalizarSubtipos = function (listaRaw) {
        return (listaRaw || []).map(item => {
            const verde = parseFloat(item.TotalPesoVerdeKg ?? item.PesoVerdeKg ?? 0);
            const amarillo = parseFloat(item.TotalPesoAmarilloKg ?? item.PesoAmarilloKg ?? 0);
            const rojo = parseFloat(item.TotalPesoRojoKg ?? item.PesoRojoKg ?? 0);
            const clasificado = parseFloat(
                item.TotalClasificadoKg ?? item.PesoClasificadoKg ?? item.TotalPesoUtilKg ?? (verde + amarillo + rojo)
            );
            const egresado = parseFloat(item.TotalEgresadoKg ?? item.PesoEgresadoKg ?? 0);
            const saldoSilo = item.SaldoSiloKg !== undefined
                ? parseFloat(item.SaldoSiloKg)
                : (item.StockDisponibleKg !== undefined ? parseFloat(item.StockDisponibleKg) : (clasificado - egresado));

            return {
                idTipoMaterial: item.IdTipoMaterial ?? 0,
                tipoMaterial: item.TipoMaterial || 'Sin Categoría',
                idSubtipo: item.IdSubtipoMaterial ?? item.IdSubtipo ?? 0,
                subtipo: item.Subtipo || item.NombreSubtipo || 'Sin Subtipo',
                verde: verde,
                amarillo: amarillo,
                rojo: rojo,
                clasificado: clasificado,
                egresado: egresado,
                saldoSilo: saldoSilo
            };
        });
    };

    // 1. INICIALIZACIÓN DE LA ESTRUCTURA VISUAL (OPTIMIZADA PARA REPORTE PDF)
    const inicializar = function (contenedorId) {
        destruirGraficosActivos();
        const contenedor = $(`#${contenedorId}`);

        const htmlEstructura = `
            <!-- NIVEL 1: ENCABEZADO Y FILTROS -->
            <div class="row fade-in">
                <div class="col-12 d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h4 class="text-primary fw-bold mb-0">
                            <i class="fas fa-cubes me-2"></i>Análisis por Tipos, Subtipos y Flujo de Clasificación
                        </h4>
                        <small class="text-muted">Rendimiento de recuperación por categoría de material y trazabilidad proporcional hacia subtipos</small>
                    </div>

                    <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded border">
                        <label class="small fw-bold mb-0">Desde:</label>
                        <input type="date" id="filtro-traz-mat-desde" class="form-control form-control-sm" style="width: auto;">

                        <label class="small fw-bold mb-0 ms-1">Hasta:</label>
                        <input type="date" id="filtro-traz-mat-hasta" class="form-control form-control-sm" style="width: auto;">

                        <label class="small fw-bold mb-0 ms-1">Filtrar Tipo:</label>
                        <select id="filtro-traz-mat-tipo" class="form-select form-select-sm fw-semibold" style="width: auto; min-width: 170px;">
                            <option value="">Todos los Tipos</option>
                        </select>

                        <button id="btn-filtrar-traz-materiales" class="btn btn-primary btn-sm ms-1">
                            <i class="fas fa-search"></i> Filtrar
                        </button>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2: 4 TARJETAS KPI DE MATERIALES Y SILOS -->
            <div class="row g-3 mb-4 fade-in">
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-primary border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Categoría Mayor Ingreso</span>
                                <span class="badge bg-primary bg-opacity-10 text-primary p-2"><i class="fas fa-crown fa-lg"></i></span>
                            </div>
                            <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-mat-top-tipo">—</h4>
                            <small class="text-muted" id="kpi-mat-top-tipo-sub">0,00 kg brutos ingresados</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-success border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Subtipo Más Clasificado</span>
                                <span class="badge bg-success bg-opacity-10 text-success p-2"><i class="fas fa-layer-group fa-lg"></i></span>
                            </div>
                            <h4 class="fw-bold text-success mb-1 text-truncate" id="kpi-mat-top-subtipo">—</h4>
                            <small class="text-muted" id="kpi-mat-top-subtipo-sub">0,00 kg clasificados</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-info border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Mejor Pureza (Verde)</span>
                                <span class="badge bg-info bg-opacity-10 text-info p-2"><i class="fas fa-award fa-lg"></i></span>
                            </div>
                            <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-mat-mejor-pureza">—</h4>
                            <small class="text-muted" id="kpi-mat-mejor-pureza-sub">0,0% aprovechamiento directo</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-warning border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Balance Neto Silos</span>
                                <span class="badge bg-warning bg-opacity-10 text-warning p-2"><i class="fas fa-warehouse fa-lg"></i></span>
                            </div>
                            <h4 class="fw-bold text-dark mb-1" id="kpi-mat-saldo-silos">0,00 kg</h4>
                            <small class="text-muted" id="kpi-mat-saldo-silos-sub">Clasif.: 0,00 kg | Egres.: 0,00 kg</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 3: GRÁFICO 1 - CALIDAD DE RECUPERACIÓN POR TIPO DE MATERIAL -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3">
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-chart-bar text-primary me-2"></i>Calidad de Recuperación por Tipo de Material
                            </h6>
                            <small class="text-muted">Desglose apilado de kilos útiles (Verde), revisión (Amarillo), descarte (Rojo) y sin clasificar / merma</small>
                        </div>
                        <div class="card-body">
                            <div id="msg-sin-datos-mat-tipos" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-cubes fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No hay ingresos por tipo de material en el rango seleccionado.</p>
                            </div>
                            <div id="echarts-mat-apilado-tipos" style="width: 100%; height: 390px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 4: GRÁFICO 2 - DIAGRAMA SANKEY PROTAGONISTA (ALTA VISIBILIDAD PARA PDF) -->
            <div class="row g-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-project-diagram text-success me-2"></i>Clasificación de Stock: Tipos hacia Subtipos
                                </h6>
                                <small class="text-muted">Diagrama Sankey expandido de trazabilidad desde cada categoría principal hacia sus subtipos clasificados</small>
                            </div>

                            <div class="btn-group btn-group-sm" role="group" aria-label="Vista Subtipos">
                                <button type="button" class="btn btn-success btn-vista-subtipos active" data-vista="sankey">
                                    <i class="fas fa-project-diagram me-1"></i> Flujo Sankey
                                </button>
                                <button type="button" class="btn btn-outline-success btn-vista-subtipos" data-vista="bar">
                                    <i class="fas fa-align-left me-1"></i> Ranking Top 10
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="msg-sin-datos-mat-subtipos" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-layer-group fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">Sin subtipos clasificados para graficar en este período.</p>
                            </div>
                            <div id="echarts-mat-subtipos" style="width: 100%; height: 620px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        contenedor.html(htmlEstructura);
        enlazarEventos();
        configurarFechasPorDefecto();
    };

    // 2. ENLACE DE EVENTOS DELEGADOS
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-reportes-trazabilidad');

        // Botón Filtrar
        principal.off('click', '#btn-filtrar-traz-materiales').on('click', '#btn-filtrar-traz-materiales', function () {
            const desde = $('#filtro-traz-mat-desde').val();
            const hasta = $('#filtro-traz-mat-hasta').val();

            if (!desde || !hasta) {
                Swal.fire('Fechas requeridas', 'Por favor seleccioná ambas fechas.', 'warning');
                return;
            }
            if (desde > hasta) {
                Swal.fire('Rango inválido', 'La fecha "Desde" no puede ser mayor a "Hasta".', 'warning');
                return;
            }

            consultarPorMaterialApi(desde, hasta);
        });

        // Filtro local instantáneo por Tipo de Material (sin re-consultar la API)
        principal.off('change', '#filtro-traz-mat-tipo').on('change', '#filtro-traz-mat-tipo', function () {
            aplicarFiltroLocalYRenderizar();
        });

        // Switch Flujo Sankey <-> Ranking Top 10 Subtipos
        principal.off('click', '.btn-vista-subtipos').on('click', '.btn-vista-subtipos', function () {
            const nuevaVista = $(this).data('vista');
            if (nuevaVista === estado.modoSubtipos) return;

            estado.modoSubtipos = nuevaVista;
            $('.btn-vista-subtipos').removeClass('btn-success active').addClass('btn-outline-success');
            $(this).removeClass('btn-outline-success').addClass('btn-success active');

            aplicarFiltroLocalYRenderizar();
        });

        // Responsividad limpia para ECharts
        $(window).off('resize.trazMateriales').on('resize.trazMateriales', function () {
            if (estado.chartApiladoTipos && !estado.chartApiladoTipos.isDisposed()) {
                estado.chartApiladoTipos.resize();
            }
            if (estado.chartSubtipos && !estado.chartSubtipos.isDisposed()) {
                estado.chartSubtipos.resize();
            }
        });
    };

    const configurarFechasPorDefecto = function () {
        const hoy = new Date();
        const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);

        $('#filtro-traz-mat-hasta').val(hoy.toISOString().split('T')[0]);
        $('#filtro-traz-mat-desde').val(primerDiaAnio.toISOString().split('T')[0]);

        $('#btn-filtrar-traz-materiales').trigger('click');
    };

    // 3. CONSULTA A LA API C#
    const consultarPorMaterialApi = function (fechaDesde, fechaHasta) {
        const btn = $('#btn-filtrar-traz-materiales');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

        $.ajax({
            type: "GET",
            url: URL_POR_MATERIAL,
            data: { fechaDesde: fechaDesde, fechaHasta: fechaHasta },
            success: function (respuesta) {
                const rawTipos = (respuesta && respuesta.PorTipo) ? respuesta.PorTipo : [];
                const rawSubtipos = (respuesta && (respuesta.PorSubtipo || respuesta.Subtipos || respuesta.BalanceSilos))
                    ? (respuesta.PorSubtipo || respuesta.Subtipos || respuesta.BalanceSilos)
                    : [];

                estado.tipos = normalizarTipos(rawTipos);
                estado.subtipos = normalizarSubtipos(rawSubtipos);

                actualizarSelectorTipos(estado.tipos);
                aplicarFiltroLocalYRenderizar();
            },
            error: function (err) {
                console.error("Error al obtener PorMaterial de Trazabilidad:", err);
                Swal.fire('Error de conexión', 'No se pudo obtener el reporte por materiales desde el servidor.', 'error');
            },
            complete: function () {
                btn.prop('disabled', false).html('<i class="fas fa-search"></i> Filtrar');
            }
        });
    };

    const actualizarSelectorTipos = function (listaTipos) {
        const select = $('#filtro-traz-mat-tipo');
        const seleccionPrevia = select.val();
        select.html('<option value="">Todos los Tipos</option>');

        [...listaTipos]
            .filter(t => t.idTipoMaterial > 0)
            .sort((a, b) => a.tipoMaterial.localeCompare(b.tipoMaterial))
            .forEach(t => {
                select.append(`<option value="${t.idTipoMaterial}">${t.tipoMaterial}</option>`);
            });

        if (seleccionPrevia) {
            select.val(seleccionPrevia);
        }
    };

    const aplicarFiltroLocalYRenderizar = function () {
        const idTipoFiltro = $('#filtro-traz-mat-tipo').val();

        const tiposFiltrados = idTipoFiltro
            ? estado.tipos.filter(t => String(t.idTipoMaterial) === String(idTipoFiltro))
            : estado.tipos;

        const subtiposFiltrados = idTipoFiltro
            ? estado.subtipos.filter(s => String(s.idTipoMaterial) === String(idTipoFiltro))
            : estado.subtipos;

        renderizarKPIs(tiposFiltrados, subtiposFiltrados);
        renderizarGraficoApiladoTipos(tiposFiltrados);
        renderizarGraficoSubtipos(subtiposFiltrados, estado.modoSubtipos);
    };

    // 4. RENDERIZADO DE TARJETAS KPI
    const renderizarKPIs = function (tipos, subtipos) {
        if (tipos.length > 0) {
            const topTipo = [...tipos].sort((a, b) => b.bruto - a.bruto)[0];
            $('#kpi-mat-top-tipo').text(topTipo.tipoMaterial).attr('title', topTipo.tipoMaterial);
            $('#kpi-mat-top-tipo-sub').text(`${formatearKg(topTipo.bruto)} kg (${topTipo.cantLotes} lotes)`);
        } else {
            $('#kpi-mat-top-tipo').text('Sin datos');
            $('#kpi-mat-top-tipo-sub').text('0,00 kg brutos');
        }

        if (subtipos.length > 0) {
            const topSub = [...subtipos].sort((a, b) => b.clasificado - a.clasificado)[0];
            $('#kpi-mat-top-subtipo').text(topSub.subtipo).attr('title', `${topSub.tipoMaterial} - ${topSub.subtipo}`);
            $('#kpi-mat-top-subtipo-sub').text(`${formatearKg(topSub.clasificado)} kg (${topSub.tipoMaterial})`);
        } else {
            $('#kpi-mat-top-subtipo').text('Sin datos');
            $('#kpi-mat-top-subtipo-sub').text('0,00 kg clasificados');
        }

        const conIngreso = tipos.filter(t => t.bruto > 0);
        if (conIngreso.length > 0) {
            const mejorPureza = [...conIngreso].sort((a, b) => b.pctVerde - a.pctVerde)[0];
            $('#kpi-mat-mejor-pureza').text(mejorPureza.tipoMaterial).attr('title', mejorPureza.tipoMaterial);
            $('#kpi-mat-mejor-pureza-sub').text(`${formatearPorcentaje(mejorPureza.pctVerde)}% aprovechamiento directo`);
        } else {
            $('#kpi-mat-mejor-pureza').text('Sin datos');
            $('#kpi-mat-mejor-pureza-sub').text('0,0% aprovechamiento directo');
        }

        const totalClasif = subtipos.reduce((acc, s) => acc + s.clasificado, 0);
        const totalEgres = subtipos.reduce((acc, s) => acc + s.egresado, 0);
        const saldoTotal = subtipos.reduce((acc, s) => acc + s.saldoSilo, 0);

        $('#kpi-mat-saldo-silos').text(`${formatearKg(saldoTotal)} kg`);
        $('#kpi-mat-saldo-silos-sub').text(`Clasif.: ${formatearKg(totalClasif)} kg | Egres.: ${formatearKg(totalEgres)} kg`);
    };

    // 5. GRÁFICO 1: BARRAS APILADAS POR TIPO DE MATERIAL
    const renderizarGraficoApiladoTipos = function (tipos) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-mat-apilado-tipos');
        const msgSinDatos = $('#msg-sin-datos-mat-tipos');

        const validos = (tipos || []).filter(t => t.bruto > 0 || (t.verde + t.amarillo + t.rojo) > 0);

        if (validos.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        if (!estado.chartApiladoTipos || estado.chartApiladoTipos.isDisposed()) {
            estado.chartApiladoTipos = echarts.init(dom);
        }

        const ordenados = [...validos].sort((a, b) => b.bruto - a.bruto);
        const categorias = ordenados.map(t => t.tipoMaterial);

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                top: 0,
                data: ['Útil (Verde)', 'Revisión (Amarillo)', 'Descarte (Rojo)', 'Sin Clasif. / Merma']
            },
            toolbox: {
                show: true,
                right: 15,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar PNG HD', pixelRatio: 2 }
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
                data: categorias,
                axisLabel: {
                    fontWeight: 'bold',
                    interval: 0,
                    rotate: categorias.length > 6 ? 18 : 0
                }
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
                    name: 'Útil (Verde)',
                    type: 'bar',
                    stack: 'masa',
                    barMaxWidth: 55,
                    itemStyle: { color: '#198754' },
                    data: ordenados.map(t => Number(t.verde.toFixed(2)))
                },
                {
                    name: 'Revisión (Amarillo)',
                    type: 'bar',
                    stack: 'masa',
                    barMaxWidth: 55,
                    itemStyle: { color: '#ffc107' },
                    data: ordenados.map(t => Number(t.amarillo.toFixed(2)))
                },
                {
                    name: 'Descarte (Rojo)',
                    type: 'bar',
                    stack: 'masa',
                    barMaxWidth: 55,
                    itemStyle: { color: '#dc3545' },
                    data: ordenados.map(t => Number(t.rojo.toFixed(2)))
                },
                {
                    name: 'Sin Clasif. / Merma',
                    type: 'bar',
                    stack: 'masa',
                    barMaxWidth: 55,
                    itemStyle: { color: '#adb5bd', borderRadius: [5, 5, 0, 0] },
                    data: ordenados.map(t => Number(t.merma.toFixed(2)))
                }
            ]
        };

        estado.chartApiladoTipos.setOption(option, true);
    };

    // 6. GRÁFICO 2: DIAGRAMA SANKEY EXPANDIDO (TIPO -> SUBTIPO) O RANKING TOP 10
    const renderizarGraficoSubtipos = function (subtipos, modo) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-mat-subtipos');
        const msgSinDatos = $('#msg-sin-datos-mat-subtipos');

        const validos = (subtipos || []).filter(s => s.clasificado > 0);

        if (validos.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        if (!estado.chartSubtipos || estado.chartSubtipos.isDisposed()) {
            estado.chartSubtipos = echarts.init(dom);
        }

        if (modo === 'sankey') {
            const nodosMap = new Map();
            const enlaces = [];
            const colorPorTipo = new Map();
            let idxColor = 0;

            // Ordenamos de mayor a menor flujo para que las cañerías más gruesas queden arriba
            const ordenados = [...validos].sort((a, b) => b.clasificado - a.clasificado);

            ordenados.forEach(s => {
                if (!colorPorTipo.has(s.tipoMaterial)) {
                    colorPorTipo.set(s.tipoMaterial, PALETA_MATERIALES[idxColor % PALETA_MATERIALES.length]);
                    idxColor++;
                }
                const colorFamilia = colorPorTipo.get(s.tipoMaterial);

                // Prefijos internos T_ y S_ evitan ciclos DAG si un Tipo y Subtipo comparten nombre
                const idOrigen = `T_${s.tipoMaterial}`;
                const idDestino = `S_${s.tipoMaterial}_${s.subtipo}`;

                if (!nodosMap.has(idOrigen)) {
                    nodosMap.set(idOrigen, {
                        name: idOrigen,
                        displayName: s.tipoMaterial,
                        esOrigen: true,
                        itemStyle: {
                            color: colorFamilia,
                            borderColor: colorFamilia
                        }
                    });
                }

                if (!nodosMap.has(idDestino)) {
                    nodosMap.set(idDestino, {
                        name: idDestino,
                        displayName: s.subtipo,
                        tipoPadre: s.tipoMaterial,
                        esOrigen: false,
                        verde: s.verde,
                        amarillo: s.amarillo,
                        rojo: s.rojo,
                        saldoSilo: s.saldoSilo,
                        itemStyle: {
                            color: colorFamilia,
                            borderColor: '#ffffff',
                            borderWidth: 1.5
                        }
                    });
                }

                enlaces.push({
                    source: idOrigen,
                    target: idDestino,
                    value: Number(s.clasificado.toFixed(2)),
                    nombreOrigen: s.tipoMaterial,
                    nombreDestino: s.subtipo,
                    verde: s.verde,
                    amarillo: s.amarillo,
                    rojo: s.rojo
                });
            });

            const nodosArray = Array.from(nodosMap.values());

            const optionSankey = {
                tooltip: {
                    trigger: 'item',
                    triggerOn: 'mousemove',
                    formatter: function (p) {
                        if (p.dataType === 'edge') {
                            const e = p.data;
                            return `
                                <strong>${e.nombreOrigen}</strong> <i class="fas fa-arrow-right mx-1 text-muted"></i> <strong>${e.nombreDestino}</strong><br/>
                                Flujo Clasificado: <strong>${formatearKg(e.value)} kg</strong><br/>
                                <small class="text-success">Verde: ${formatearKg(e.verde)} kg</small> |
                                <small class="text-warning">Amarillo: ${formatearKg(e.amarillo)} kg</small>
                            `;
                        } else {
                            const n = p.data;
                            const rol = n.esOrigen ? 'Categoría Principal' : `Subtipo de ${n.tipoPadre}`;
                            return `
                                <span class="badge bg-light text-dark border mb-1">${rol}</span><br/>
                                <strong>${n.displayName}</strong><br/>
                                Masa Total: <strong>${formatearKg(p.value)} kg</strong>
                            `;
                        }
                    }
                },
                toolbox: {
                    show: true,
                    right: 15,
                    feature: {
                        saveAsImage: { show: true, title: 'Descargar Sankey PNG HD', pixelRatio: 2 }
                    }
                },
                series: [
                    {
                        type: 'sankey',
                        left: '3%',
                        right: '26%',
                        top: 25,
                        bottom: 25,
                        nodeWidth: 22,
                        nodeGap: 16,
                        draggable: false,
                        emphasis: {
                            focus: 'adjacency'
                        },
                        label: {
                            color: '#212529',
                            fontWeight: 'bold',
                            fontSize: 13,
                            formatter: function (p) {
                                return `${p.data.displayName} — ${formatearKg(p.value)} kg`;
                            }
                        },
                        lineStyle: {
                            color: 'source',
                            curveness: 0.5,
                            opacity: 0.42
                        },
                        data: nodosArray,
                        links: enlaces
                    }
                ]
            };

            estado.chartSubtipos.setOption(optionSankey, true);
        } else {
            // Vista Ranking Horizontal Top 10 Subtipos
            const top10 = [...validos]
                .sort((a, b) => b.clasificado - a.clasificado)
                .slice(0, 10)
                .reverse();

            const optionBar = {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: function (params) {
                        const p = params[0];
                        const item = top10[p.dataIndex];
                        return `
                            <strong>${item.subtipo}</strong> (${item.tipoMaterial})<br/>
                            Total Clasificado: <strong>${formatearKg(item.clasificado)} kg</strong><br/>
                            Saldo en Silo: <strong>${formatearKg(item.saldoSilo)} kg</strong>
                        `;
                    }
                },
                toolbox: {
                    show: true,
                    right: 15,
                    feature: {
                        saveAsImage: { show: true, title: 'Descargar PNG HD', pixelRatio: 2 }
                    }
                },
                grid: {
                    top: 30,
                    bottom: 25,
                    left: '3%',
                    right: '14%',
                    containLabel: true
                },
                xAxis: {
                    type: 'value',
                    axisLabel: {
                        formatter: val => val.toLocaleString('es-AR') + ' kg'
                    }
                },
                yAxis: {
                    type: 'category',
                    data: top10.map(s => s.subtipo),
                    axisLabel: { fontWeight: 'bold', fontSize: 12 }
                },
                series: [
                    {
                        name: 'Clasificado (kg)',
                        type: 'bar',
                        barMaxWidth: 32,
                        itemStyle: {
                            color: '#198754',
                            borderRadius: [0, 5, 5, 0]
                        },
                        label: {
                            show: true,
                            position: 'right',
                            fontWeight: 'bold',
                            formatter: p => formatearKg(p.value) + ' kg'
                        },
                        data: top10.map(s => Number(s.clasificado.toFixed(2)))
                    }
                ]
            };

            estado.chartSubtipos.setOption(optionBar, true);
        }
    };

    // API Pública del Módulo
    return {
        cargarEn: inicializar
    };
})();
