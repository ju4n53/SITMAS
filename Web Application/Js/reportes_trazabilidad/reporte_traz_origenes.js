/* ========================================================================
   SITMAS - Módulo de Reportes de Trazabilidad: Orígenes y Donantes
   Consume: GET /api/ReportesTrazabilidad/PorOrigen
   DTO C#: { RankingOrigenes: [...], PorCategoria: [...] }
   Incluye: 4 KPIs + Heatmap Large (20K Style) + Barras Superpuestas + Tabla
   Archivo: Js/reportes_trazabilidad/reporte_traz_origenes.js
   ======================================================================== */

const ReporteTrazOrigenesModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        origenes: [],
        categorias: [],
        chartHeatmapOrigenes: null,
        chartBarrasSuperpuestas: null
    };

    const URL_POR_ORIGEN = "https://localhost:44325/api/ReportesTrazabilidad/PorOrigen";
    const URL_POR_MATERIAL = "https://localhost:44325/api/ReportesTrazabilidad/PorMaterial";

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
        ['chartHeatmapOrigenes', 'chartBarrasSuperpuestas'].forEach(key => {
            if (estado[key] && !estado[key].isDisposed()) {
                estado[key].dispose();
            }
            estado[key] = null;
        });
    };

    // Normalizador alineado 1 a 1 con TrazabilidadOrigenRankingDTO de C#
    const normalizarOrigenes = function (respuesta) {
        const listaRaw = Array.isArray(respuesta)
            ? respuesta
            : (respuesta?.RankingOrigenes || respuesta?.rankingOrigenes || []);

        const totalGlobalBruto = listaRaw.reduce((acc, item) => {
            return acc + parseFloat(item.PesoBrutoTotalKg ?? 0);
        }, 0);

        return listaRaw.map(item => {
            const bruto = parseFloat(item.PesoBrutoTotalKg ?? 0);
            const verde = parseFloat(item.PesoUtilVerdeKg ?? 0);
            const rojo = parseFloat(item.PesoDescarteRojoKg ?? 0);
            const promedio = parseFloat(item.PromedioKgPorEntrega ?? 0);
            const indiceCalidad = parseFloat(item.IndiceCalidadOrigenPct ?? 0);
            const frecuencia = parseInt(item.FrecuenciaEntregas ?? 0, 10);
            const pctAporte = totalGlobalBruto > 0 ? (bruto * 100 / totalGlobalBruto) : 0;

            return {
                claveOrigen: item.ClaveOrigen || '',
                nombreOrigen: item.NombreOrigen || 'Origen No Especificado',
                categoriaOrigen: item.CategoriaOrigen || 'Sin Categoría',
                frecuenciaEntregas: frecuencia,
                pesoBrutoTotalKg: bruto,
                promedioKgPorEntrega: promedio,
                pesoUtilVerdeKg: verde,
                pesoDescarteRojoKg: rojo,
                indiceCalidadOrigenPct: indiceCalidad,
                ultimaEntrega: item.UltimaEntrega || null,
                ubicacionDescripcion: item.UbicacionDescripcion || '',
                pctAporte: pctAporte
            };
        });
    };

    // 1. INICIALIZACIÓN DE LA ESTRUCTURA VISUAL (PIRÁMIDE INVERTIDA)
    const inicializar = function (contenedorId) {
        destruirGraficosActivos();
        const contenedor = $(`#${contenedorId}`);

        const htmlEstructura = `
            <!-- NIVEL 1: ENCABEZADO Y FILTROS -->
            <div class="row fade-in">
                <div class="col-12 d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h4 class="text-primary fw-bold mb-0">
                            <i class="fas fa-building me-2"></i>Análisis de Orígenes, Generadores y Calidad de Aporte
                        </h4>
                        <small class="text-muted">Mapa térmico de alta densidad (Heatmap Large), eficiencia por entrega y auditoría de separación en origen</small>
                    </div>

                    <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded border">
                        <label class="small fw-bold mb-0">Desde:</label>
                        <input type="date" id="filtro-traz-ori-desde" class="form-control form-control-sm" style="width: auto;">

                        <label class="small fw-bold mb-0 ms-1">Hasta:</label>
                        <input type="date" id="filtro-traz-ori-hasta" class="form-control form-control-sm" style="width: auto;">

                        <label class="small fw-bold mb-0 ms-1">Material:</label>
                        <select id="filtro-traz-ori-material" class="form-select form-select-sm fw-semibold" style="width: auto; min-width: 170px;">
                            <option value="">Todos los Materiales</option>
                        </select>

                        <button id="btn-filtrar-traz-origenes" class="btn btn-primary btn-sm ms-1">
                            <i class="fas fa-search"></i> Filtrar
                        </button>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2: 4 TARJETAS KPI -->
            <div class="row g-3 mb-4 fade-in">
                <!-- KPI 1: Mayor Peso Bruto Total -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-primary border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Mayor Peso Bruto Total</span>
                                <span class="badge bg-primary bg-opacity-10 text-primary p-2"><i class="fas fa-weight-hanging fa-lg"></i></span>
                            </div>
                            <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-ori-mayor-bruto">—</h4>
                            <small class="text-muted" id="kpi-ori-mayor-bruto-sub">0,00 kg brutos ingresados</small>
                        </div>
                    </div>
                </div>

                <!-- KPI 2: Mejor Calidad Verde (Más kg de PesoUtilVerdeKg) -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-success border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Mejor Calidad Verde</span>
                                <span class="badge bg-success bg-opacity-10 text-success p-2"><i class="fas fa-leaf fa-lg"></i></span>
                            </div>
                            <h4 class="fw-bold text-success mb-1 text-truncate" id="kpi-ori-mejor-verde">—</h4>
                            <small class="text-muted" id="kpi-ori-mejor-verde-sub">0,00 kg útiles verdes</small>
                        </div>
                    </div>
                </div>

                <!-- KPI 3: Menor Calidad / Mayor Descarte Rojo (PesoDescarteRojoKg) -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-danger border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Menor Calidad (Descarte Rojo)</span>
                                <span class="badge bg-danger bg-opacity-10 text-danger p-2"><i class="fas fa-exclamation-triangle fa-lg"></i></span>
                            </div>
                            <h4 class="fw-bold text-danger mb-1 text-truncate" id="kpi-ori-menor-rojo">—</h4>
                            <small class="text-muted" id="kpi-ori-menor-rojo-sub">0,00 kg de descarte rojo</small>
                        </div>
                    </div>
                </div>

                <!-- KPI 4: Mayor Frecuencia de Entregas (FrecuenciaEntregas) -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-info border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Mayor Frecuencia Entregas</span>
                                <span class="badge bg-info bg-opacity-10 text-info p-2"><i class="fas fa-truck-loading fa-lg"></i></span>
                            </div>
                            <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-ori-mayor-frecuencia">—</h4>
                            <small class="text-muted" id="kpi-ori-mayor-frecuencia-sub">0 entregas registradas</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 3: GRÁFICO PRINCIPAL - HEATMAP LARGE (20K DATA ENGINE) -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-fire text-danger me-2"></i>Mapa de Calor de Alta Densidad por Origen (Heatmap Large)
                                </h6>
                                <small class="text-muted">Espectro térmico de masa (kg) combinando todos los orígenes frente a Peso Bruto Total, Útil Verde, Descarte Rojo y Promedio por Entrega</small>
                            </div>
                            <span class="badge bg-light text-dark border">
                                <i class="fas fa-mouse-pointer me-1 text-primary"></i> Rueda del mouse para Zoom / Arrastrar para desplazar
                            </span>
                        </div>
                        <div class="card-body">
                            <div id="msg-sin-datos-ori-heatmap" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-building fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No se registraron entregas por origen en el período seleccionado.</p>
                            </div>
                            <div id="echarts-ori-heatmap" style="width: 100%; height: 470px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 4: GRÁFICO SECUNDARIO - BARRAS SUPERPUESTAS (PROMEDIO KG/ENTREGA VS ÍNDICE CALIDAD %) -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3">
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-chart-bar text-success me-2"></i>Eficiencia por Entrega vs. Índice de Calidad en Origen
                            </h6>
                            <small class="text-muted">Barras superpuestas: Promedio de kg por entrega (barra exterior azul) frente al Índice de Calidad Verde % (barra interior verde)</small>
                        </div>
                        <div class="card-body">
                            <div id="msg-sin-datos-ori-superpuestas" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-chart-bar fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">Sin datos suficientes para comparar promedios e índice de calidad.</p>
                            </div>
                            <div id="echarts-ori-superpuestas" style="width: 100%; height: 430px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 5: TABLA DETALLADA DE AUDITORÍA POR ORIGEN -->
            <div class="row fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-list-ol text-secondary me-2"></i>Detalle Completo de Orígenes y Generadores
                                </h6>
                                <small class="text-muted">Frecuencia de entregas, peso bruto acumulado, promedio por viaje e índice de separación en origen</small>
                            </div>

                            <div class="input-group input-group-sm" style="max-width: 280px;">
                                <span class="input-group-text bg-light"><i class="fas fa-search text-muted"></i></span>
                                <input type="text" id="buscador-tabla-origenes" class="form-control" placeholder="Buscar origen o categoría...">
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="text-center" style="width: 55px;">#</th>
                                            <th>Origen / Generador</th>
                                            <th>Categoría</th>
                                            <th class="text-center">Entregas</th>
                                            <th class="text-end">Peso Bruto Total</th>
                                            <th class="text-end text-primary">Prom. / Entrega</th>
                                            <th class="text-end text-success">Útil Verde</th>
                                            <th class="text-end text-danger">Descarte Rojo</th>
                                            <th style="min-width: 160px;">Índice Calidad (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-traz-origenes">
                                        <tr>
                                            <td colspan="9" class="text-center text-muted py-4">Cargando orígenes...</td>
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

        principal.off('click', '#btn-filtrar-traz-origenes').on('click', '#btn-filtrar-traz-origenes', function () {
            const desde = $('#filtro-traz-ori-desde').val();
            const hasta = $('#filtro-traz-ori-hasta').val();
            const idTipoMaterial = $('#filtro-traz-ori-material').val() || null;

            if (!desde || !hasta) {
                Swal.fire('Fechas requeridas', 'Por favor seleccioná ambas fechas.', 'warning');
                return;
            }
            if (desde > hasta) {
                Swal.fire('Rango inválido', 'La fecha "Desde" no puede ser mayor a "Hasta".', 'warning');
                return;
            }

            consultarPorOrigenApi(desde, hasta, idTipoMaterial);
        });

        // Buscador instantáneo en tabla
        principal.off('input', '#buscador-tabla-origenes').on('input', '#buscador-tabla-origenes', function () {
            const termino = $(this).val().toLowerCase().trim();
            const filtrados = termino
                ? estado.origenes.filter(o =>
                    o.nombreOrigen.toLowerCase().includes(termino) ||
                    o.categoriaOrigen.toLowerCase().includes(termino)
                )
                : estado.origenes;

            renderizarTablaOrigenes(filtrados);
        });

        // Responsividad limpia
        $(window).off('resize.trazOrigenes').on('resize.trazOrigenes', function () {
            if (estado.chartHeatmapOrigenes && !estado.chartHeatmapOrigenes.isDisposed()) {
                estado.chartHeatmapOrigenes.resize();
            }
            if (estado.chartBarrasSuperpuestas && !estado.chartBarrasSuperpuestas.isDisposed()) {
                estado.chartBarrasSuperpuestas.resize();
            }
        });
    };

    const cargarCatalogoTiposMaterial = function () {
        $.ajax({
            type: "GET",
            url: URL_POR_MATERIAL,
            data: { fechaDesde: '2020-01-01', fechaHasta: new Date().toISOString().split('T')[0] },
            success: function (res) {
                const select = $('#filtro-traz-ori-material');
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

        $('#filtro-traz-ori-hasta').val(hoy.toISOString().split('T')[0]);
        $('#filtro-traz-ori-desde').val(primerDiaAnio.toISOString().split('T')[0]);

        $('#btn-filtrar-traz-origenes').trigger('click');
    };

    // 3. CONSULTA A LA API C#
    const consultarPorOrigenApi = function (fechaDesde, fechaHasta, idTipoMaterial) {
        const btn = $('#btn-filtrar-traz-origenes');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

        const params = { fechaDesde: fechaDesde, fechaHasta: fechaHasta };
        if (idTipoMaterial) params.idTipoMaterial = idTipoMaterial;

        $.ajax({
            type: "GET",
            url: URL_POR_ORIGEN,
            data: params,
            success: function (respuesta) {
                const lista = normalizarOrigenes(respuesta);
                estado.origenes = lista.sort((a, b) => b.pesoBrutoTotalKg - a.pesoBrutoTotalKg);
                estado.categorias = respuesta?.PorCategoria || [];
                $('#buscador-tabla-origenes').val('');

                renderizarKPIs(estado.origenes);
                renderizarHeatmapLargeOrigenes(estado.origenes);
                renderizarBarrasSuperpuestas(estado.origenes);
                renderizarTablaOrigenes(estado.origenes);
            },
            error: function (err) {
                console.error("Error al obtener PorOrigen de Trazabilidad:", err);
                Swal.fire('Error de conexión', 'No se pudo obtener el reporte por orígenes desde el servidor.', 'error');
            },
            complete: function () {
                btn.prop('disabled', false).html('<i class="fas fa-search"></i> Filtrar');
            }
        });
    };

    // 4. RENDERIZADO DE LAS 4 TARJETAS KPI
    const renderizarKPIs = function (lista) {
        if (!lista || lista.length === 0) {
            $('#kpi-ori-mayor-bruto').text('Sin datos');
            $('#kpi-ori-mayor-bruto-sub').text('0,00 kg brutos ingresados');
            $('#kpi-ori-mejor-verde').text('Sin datos');
            $('#kpi-ori-mejor-verde-sub').text('0,00 kg útiles verdes');
            $('#kpi-ori-menor-rojo').text('Sin datos');
            $('#kpi-ori-menor-rojo-sub').text('0,00 kg de descarte rojo');
            $('#kpi-ori-mayor-frecuencia').text('Sin datos');
            $('#kpi-ori-mayor-frecuencia-sub').text('0 entregas registradas');
            return;
        }

        // 1. Mayor Peso Bruto Total
        const topBruto = [...lista].sort((a, b) => b.pesoBrutoTotalKg - a.pesoBrutoTotalKg)[0];
        $('#kpi-ori-mayor-bruto').text(topBruto.nombreOrigen).attr('title', topBruto.nombreOrigen);
        $('#kpi-ori-mayor-bruto-sub').text(
            `${formatearKg(topBruto.pesoBrutoTotalKg)} kg (${formatearPorcentaje(topBruto.pctAporte)}% del total)`
        );

        // 2. Mejor Calidad Verde (mayor PesoUtilVerdeKg)
        const topVerde = [...lista].sort((a, b) => b.pesoUtilVerdeKg - a.pesoUtilVerdeKg)[0];
        $('#kpi-ori-mejor-verde').text(topVerde.nombreOrigen).attr('title', topVerde.nombreOrigen);
        $('#kpi-ori-mejor-verde-sub').text(
            `${formatearKg(topVerde.pesoUtilVerdeKg)} kg verdes (${formatearPorcentaje(topVerde.indiceCalidadOrigenPct)}% calidad)`
        );

        // 3. Menor Calidad / Mayor Descarte Rojo (mayor PesoDescarteRojoKg)
        const topRojo = [...lista].sort((a, b) => b.pesoDescarteRojoKg - a.pesoDescarteRojoKg)[0];
        $('#kpi-ori-menor-rojo').text(topRojo.nombreOrigen).attr('title', topRojo.nombreOrigen);
        $('#kpi-ori-menor-rojo-sub').text(
            `${formatearKg(topRojo.pesoDescarteRojoKg)} kg de descarte rojo`
        );

        // 4. Mayor Frecuencia de Entregas (mayor FrecuenciaEntregas)
        const topFrecuencia = [...lista].sort((a, b) => b.frecuenciaEntregas - a.frecuenciaEntregas)[0];
        $('#kpi-ori-mayor-frecuencia').text(topFrecuencia.nombreOrigen).attr('title', topFrecuencia.nombreOrigen);
        $('#kpi-ori-mayor-frecuencia-sub').text(
            `${topFrecuencia.frecuenciaEntregas} ${topFrecuencia.frecuenciaEntregas === 1 ? 'entrega' : 'entregas'} (prom. ${formatearKg(topFrecuencia.promedioKgPorEntrega)} kg)`
        );
    };

    // 5. GRÁFICO PRINCIPAL: HEATMAP LARGE (ESTILO ECHARTS 20K DATA)
    const renderizarHeatmapLargeOrigenes = function (lista) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-ori-heatmap');
        const msgSinDatos = $('#msg-sin-datos-ori-heatmap');

        const validos = (lista || []).filter(o => o.pesoBrutoTotalKg > 0);

        if (validos.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        if (!estado.chartHeatmapOrigenes || estado.chartHeatmapOrigenes.isDisposed()) {
            estado.chartHeatmapOrigenes = echarts.init(dom);
        }

        // Eje X: Todos los orígenes ordenados de mayor a menor peso bruto
        const nombresX = validos.map(o => o.nombreOrigen);

        // Eje Y: Dimensiones de masa en kg (de abajo hacia arriba para que Peso Bruto Total corone la fila superior)
        const dimensionesY = [
            'Descarte Rojo (kg)',
            'Promedio / Entrega (kg)',
            'Útil Verde (kg)',
            'Peso Bruto Total (kg)'
        ];

        let maxValor = 0;
        const datosMatriz = [];

        validos.forEach((o, idxX) => {
            const valoresFila = [
                Number(o.pesoDescarteRojoKg.toFixed(2)),
                Number(o.promedioKgPorEntrega.toFixed(2)),
                Number(o.pesoUtilVerdeKg.toFixed(2)),
                Number(o.pesoBrutoTotalKg.toFixed(2))
            ];

            valoresFila.forEach((val, idxY) => {
                if (val > maxValor) maxValor = val;
                datosMatriz.push([idxX, idxY, val]);
            });
        });

        const option = {
            animation: false, // Optimización clave de heatmap-large para renderizado instantáneo
            tooltip: {
                position: 'top',
                formatter: function (params) {
                    const [idxX, idxY, valor] = params.value;
                    const o = validos[idxX];
                    const metrica = dimensionesY[idxY];
                    return `
                        <strong>${o.nombreOrigen}</strong><br/>
                        <span class="badge bg-secondary mb-1">${o.categoriaOrigen}</span><br/>
                        Indicador: <strong>${metrica}</strong><br/>
                        Valor: <strong class="text-primary">${formatearKg(valor)} kg</strong><br/>
                        <hr class="my-1"/>
                        <small class="text-muted">
                            Bruto Total: ${formatearKg(o.pesoBrutoTotalKg)} kg |
                            Entregas: ${o.frecuenciaEntregas} |
                            Calidad: ${formatearPorcentaje(o.indiceCalidadOrigenPct)}%
                        </small>
                    `;
                }
            },
            toolbox: {
                show: true,
                right: 15,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar Heatmap HD', pixelRatio: 2 }
                }
            },
            grid: {
                top: 30,
                bottom: 115,
                left: '3%',
                right: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: nombresX,
                axisLine: { lineStyle: { color: '#ced4da' } },
                axisLabel: {
                    fontWeight: 'bold',
                    fontSize: 11,
                    rotate: 28,
                    formatter: val => val.length > 20 ? val.substring(0, 18) + '...' : val
                }
            },
            yAxis: {
                type: 'category',
                data: dimensionesY,
                axisLine: { lineStyle: { color: '#ced4da' } },
                axisLabel: {
                    fontWeight: 'bold',
                    fontSize: 12
                }
            },
            visualMap: {
                min: 0,
                max: maxValor > 0 ? maxValor : 100,
                calculable: true,
                realtime: false, // Optimización heatmap-large: aplica el filtro de color al soltar el slider
                orient: 'horizontal',
                left: 'center',
                bottom: 42,
                text: ['Mayor Masa (kg)', 'Menor Masa (kg)'],
                inRange: {
                    // Paleta espectral térmica oficial de ECharts heatmap-large
                    color: [
                        '#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8',
                        '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'
                    ]
                }
            },
            dataZoom: [
                {
                    type: 'slider',
                    xAxisIndex: 0,
                    bottom: 6,
                    height: 18,
                    start: 0,
                    end: validos.length > 25 ? Math.round((25 / validos.length) * 100) : 100
                },
                {
                    type: 'inside',
                    xAxisIndex: 0
                }
            ],
            series: [
                {
                    name: 'Densidad de Aporte (kg)',
                    type: 'heatmap',
                    data: datosMatriz,
                    progressive: 1000,          // Renderiza por lotes de 1000 celdas (motor 20K data)
                    progressiveThreshold: 500,
                    label: {
                        show: false             // Celdas limpias sin superposición de texto
                    },
                    itemStyle: {
                        borderWidth: 0.5,
                        borderColor: 'rgba(255, 255, 255, 0.25)'
                    },
                    emphasis: {
                        itemStyle: {
                            borderColor: '#212529',
                            borderWidth: 1.5
                        }
                    }
                }
            ]
        };

        estado.chartHeatmapOrigenes.setOption(option, true);
    };

    // 6. GRÁFICO SECUNDARIO: BARRAS SUPERPUESTAS (PROMEDIO KG/ENTREGA + ÍNDICE CALIDAD %)
    const renderizarBarrasSuperpuestas = function (lista) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-ori-superpuestas');
        const msgSinDatos = $('#msg-sin-datos-ori-superpuestas');

        const validos = (lista || []).filter(o => o.pesoBrutoTotalKg > 0);

        if (validos.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        if (!estado.chartBarrasSuperpuestas || estado.chartBarrasSuperpuestas.isDisposed()) {
            estado.chartBarrasSuperpuestas = echarts.init(dom);
        }

        const nombresX = validos.map(o => o.nombreOrigen);
        const necesitaZoom = validos.length > 14;

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function (params) {
                    const idx = params[0].dataIndex;
                    const o = validos[idx];
                    return `
                        <strong>${o.nombreOrigen}</strong> <span class="badge bg-light text-dark border">${o.categoriaOrigen}</span><br/>
                        <span style="color:#0d6efd;">●</span> Promedio por Entrega: <strong>${formatearKg(o.promedioKgPorEntrega)} kg</strong> (${o.frecuenciaEntregas} entregas)<br/>
                        <span style="color:#198754;">●</span> Índice de Calidad Verde: <strong>${formatearPorcentaje(o.indiceCalidadOrigenPct)}%</strong><br/>
                        <small class="text-muted">Bruto Total: ${formatearKg(o.pesoBrutoTotalKg)} kg | Útil Verde: ${formatearKg(o.pesoUtilVerdeKg)} kg</small>
                    `;
                }
            },
            legend: {
                top: 0,
                data: ['Promedio por Entrega (kg)', 'Índice Calidad Origen (%)']
            },
            toolbox: {
                show: true,
                right: 15,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar Barras Superpuestas HD', pixelRatio: 2 }
                }
            },
            grid: {
                top: 50,
                bottom: necesitaZoom ? 95 : 65,
                left: '3%',
                right: '4%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: nombresX,
                axisLabel: {
                    fontWeight: 'bold',
                    fontSize: 11,
                    interval: 0,
                    rotate: 28,
                    formatter: val => val.length > 20 ? val.substring(0, 18) + '...' : val
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Promedio / Entrega (kg)',
                    position: 'left',
                    axisLine: { show: true, lineStyle: { color: '#0d6efd' } },
                    axisLabel: {
                        formatter: val => val.toLocaleString('es-AR') + ' kg'
                    }
                },
                {
                    type: 'value',
                    name: 'Índice Calidad (%)',
                    position: 'right',
                    min: 0,
                    max: 100,
                    splitLine: { show: false },
                    axisLine: { show: true, lineStyle: { color: '#198754' } },
                    axisLabel: {
                        formatter: '{value}%'
                    }
                }
            ],
            dataZoom: necesitaZoom ? [
                {
                    type: 'slider',
                    xAxisIndex: 0,
                    startValue: 0,
                    endValue: 13,
                    bottom: 6,
                    height: 18
                },
                {
                    type: 'inside',
                    xAxisIndex: 0
                }
            ] : [],
            series: [
                {
                    name: 'Promedio por Entrega (kg)',
                    type: 'bar',
                    yAxisIndex: 0,
                    barWidth: 36,
                    z: 2,
                    itemStyle: {
                        color: 'rgba(13, 110, 253, 0.25)',
                        borderColor: '#0d6efd',
                        borderWidth: 1.5,
                        borderRadius: [5, 5, 0, 0]
                    },
                    data: validos.map(o => Number(o.promedioKgPorEntrega.toFixed(2)))
                },
                {
                    name: 'Índice Calidad Origen (%)',
                    type: 'bar',
                    yAxisIndex: 1,
                    barWidth: 18,
                    barGap: '-75%',
                    z: 3,
                    itemStyle: {
                        color: '#198754',
                        borderRadius: [4, 4, 0, 0]
                    },
                    data: validos.map(o => Number(o.indiceCalidadOrigenPct.toFixed(2)))
                }
            ]
        };

        estado.chartBarrasSuperpuestas.setOption(option, true);
    };

    // 7. TABLA DE AUDITORÍA COMPLETA POR ORIGEN
    const renderizarTablaOrigenes = function (lista) {
        const tbody = $('#tbody-traz-origenes').empty();

        if (!lista || lista.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">
                        <i class="fas fa-folder-open me-2"></i>No se encontraron orígenes que coincidan con el filtro aplicado.
                    </td>
                </tr>
            `);
            return;
        }

        lista.forEach((o, index) => {
            const pct = Math.min(100, Math.max(0, o.indiceCalidadOrigenPct));
            const colorBarra = pct >= 70 ? 'bg-success' : (pct >= 40 ? 'bg-warning' : 'bg-danger');

            const medalla = index === 0
                ? '<span class="badge bg-warning text-dark"><i class="fas fa-crown"></i> 1</span>'
                : `<span class="text-muted fw-bold">${index + 1}</span>`;

            tbody.append(`
                <tr>
                    <td class="text-center">${medalla}</td>
                    <td class="fw-bold text-dark">${o.nombreOrigen}</td>
                    <td><span class="badge bg-light text-dark border">${o.categoriaOrigen}</span></td>
                    <td class="text-center"><span class="badge bg-info bg-opacity-10 text-info border border-info">${o.frecuenciaEntregas}</span></td>
                    <td class="text-end fw-semibold">${formatearKg(o.pesoBrutoTotalKg)} kg</td>
                    <td class="text-end text-primary fw-semibold">${formatearKg(o.promedioKgPorEntrega)} kg</td>
                    <td class="text-end text-success fw-semibold">${formatearKg(o.pesoUtilVerdeKg)} kg</td>
                    <td class="text-end text-danger fw-semibold">${formatearKg(o.pesoDescarteRojoKg)} kg</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="progress flex-grow-1" style="height: 8px;">
                                <div class="progress-bar ${colorBarra}" role="progressbar" style="width: ${pct}%;"></div>
                            </div>
                            <span class="small fw-bold" style="min-width: 48px;">${formatearPorcentaje(o.indiceCalidadOrigenPct)}%</span>
                        </div>
                    </td>
                </tr>
            `);
        });
    };

    // API Pública del Módulo
    return {
        cargarEn: inicializar
    };
})();








// /* ========================================================================
//    SITMAS - Módulo de Reportes de Trazabilidad: Orígenes y Donantes
//    Consume: GET /api/ReportesTrazabilidad/PorOrigen
//    DTO C#: { RankingOrigenes: [...], PorCategoria: [...] }
//    Incluye: 4 KPIs Específicos + Mapa de Calor + Barras Superpuestas + Tabla
//    Archivo: Js/reportes_trazabilidad/reporte_traz_origenes.js
//    ======================================================================== */

// const ReporteTrazOrigenesModulo = (function () {
//     // 🔒 ESTADO PRIVADO
//     let estado = {
//         origenes: [],
//         categorias: [],
//         chartHeatmapOrigenes: null,
//         chartBarrasSuperpuestas: null
//     };

//     const URL_POR_ORIGEN = "https://localhost:44325/api/ReportesTrazabilidad/PorOrigen";
//     const URL_POR_MATERIAL = "https://localhost:44325/api/ReportesTrazabilidad/PorMaterial";

//     // Helpers de formateo regional (es-AR)
//     const formatearKg = function (valor) {
//         const num = parseFloat(valor || 0);
//         return num.toLocaleString('es-AR', {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2
//         });
//     };

//     const formatearPorcentaje = function (valor) {
//         const num = parseFloat(valor || 0);
//         return num.toLocaleString('es-AR', {
//             minimumFractionDigits: 1,
//             maximumFractionDigits: 2
//         });
//     };

//     // Limpieza segura de instancias ECharts al cambiar de pestaña en la SPA
//     const destruirGraficosActivos = function () {
//         ['chartHeatmapOrigenes', 'chartBarrasSuperpuestas'].forEach(key => {
//             if (estado[key] && !estado[key].isDisposed()) {
//                 estado[key].dispose();
//             }
//             estado[key] = null;
//         });
//     };

//     // Normalizador alineado 1 a 1 con TrazabilidadOrigenRankingDTO de C#
//     const normalizarOrigenes = function (respuesta) {
//         const listaRaw = Array.isArray(respuesta)
//             ? respuesta
//             : (respuesta?.RankingOrigenes || respuesta?.rankingOrigenes || []);

//         const totalGlobalBruto = listaRaw.reduce((acc, item) => {
//             return acc + parseFloat(item.PesoBrutoTotalKg ?? 0);
//         }, 0);

//         return listaRaw.map(item => {
//             const bruto = parseFloat(item.PesoBrutoTotalKg ?? 0);
//             const verde = parseFloat(item.PesoUtilVerdeKg ?? 0);
//             const rojo = parseFloat(item.PesoDescarteRojoKg ?? 0);
//             const promedio = parseFloat(item.PromedioKgPorEntrega ?? 0);
//             const indiceCalidad = parseFloat(item.IndiceCalidadOrigenPct ?? 0);
//             const frecuencia = parseInt(item.FrecuenciaEntregas ?? 0, 10);
//             const pctAporte = totalGlobalBruto > 0 ? (bruto * 100 / totalGlobalBruto) : 0;

//             return {
//                 claveOrigen: item.ClaveOrigen || '',
//                 nombreOrigen: item.NombreOrigen || 'Origen No Especificado',
//                 categoriaOrigen: item.CategoriaOrigen || 'Sin Categoría',
//                 frecuenciaEntregas: frecuencia,
//                 pesoBrutoTotalKg: bruto,
//                 promedioKgPorEntrega: promedio,
//                 pesoUtilVerdeKg: verde,
//                 pesoDescarteRojoKg: rojo,
//                 indiceCalidadOrigenPct: indiceCalidad,
//                 ultimaEntrega: item.UltimaEntrega || null,
//                 ubicacionDescripcion: item.UbicacionDescripcion || '',
//                 pctAporte: pctAporte
//             };
//         });
//     };

//     // 1. INICIALIZACIÓN DE LA ESTRUCTURA VISUAL (PIRÁMIDE INVERTIDA)
//     const inicializar = function (contenedorId) {
//         destruirGraficosActivos();
//         const contenedor = $(`#${contenedorId}`);

//         const htmlEstructura = `
//             <!-- NIVEL 1: ENCABEZADO Y FILTROS -->
//             <div class="row fade-in">
//                 <div class="col-12 d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
//                     <div>
//                         <h4 class="text-primary fw-bold mb-0">
//                             <i class="fas fa-building me-2"></i>Análisis de Orígenes, Generadores y Calidad de Aporte
//                         </h4>
//                         <small class="text-muted">Mapa de calor de masa ingresada, eficiencia por entrega y auditoría de separación en origen</small>
//                     </div>

//                     <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded border">
//                         <label class="small fw-bold mb-0">Desde:</label>
//                         <input type="date" id="filtro-traz-ori-desde" class="form-control form-control-sm" style="width: auto;">

//                         <label class="small fw-bold mb-0 ms-1">Hasta:</label>
//                         <input type="date" id="filtro-traz-ori-hasta" class="form-control form-control-sm" style="width: auto;">

//                         <label class="small fw-bold mb-0 ms-1">Material:</label>
//                         <select id="filtro-traz-ori-material" class="form-select form-select-sm fw-semibold" style="width: auto; min-width: 170px;">
//                             <option value="">Todos los Materiales</option>
//                         </select>

//                         <button id="btn-filtrar-traz-origenes" class="btn btn-primary btn-sm ms-1">
//                             <i class="fas fa-search"></i> Filtrar
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 2: 4 TARJETAS KPI SEGÚN REQUERIMIENTO -->
//             <div class="row g-3 mb-4 fade-in">
//                 <!-- KPI 1: Mayor Peso Bruto Total -->
//                 <div class="col-12 col-sm-6 col-xl-3">
//                     <div class="card shadow-sm border-0 border-start border-primary border-4 h-100">
//                         <div class="card-body">
//                             <div class="d-flex justify-content-between align-items-center mb-2">
//                                 <span class="text-muted small fw-bold text-uppercase">Mayor Peso Bruto Total</span>
//                                 <span class="badge bg-primary bg-opacity-10 text-primary p-2"><i class="fas fa-weight-hanging fa-lg"></i></span>
//                             </div>
//                             <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-ori-mayor-bruto">—</h4>
//                             <small class="text-muted" id="kpi-ori-mayor-bruto-sub">0,00 kg brutos ingresados</small>
//                         </div>
//                     </div>
//                 </div>

//                 <!-- KPI 2: Mejor Calidad Verde (Más kg de PesoUtilVerdeKg) -->
//                 <div class="col-12 col-sm-6 col-xl-3">
//                     <div class="card shadow-sm border-0 border-start border-success border-4 h-100">
//                         <div class="card-body">
//                             <div class="d-flex justify-content-between align-items-center mb-2">
//                                 <span class="text-muted small fw-bold text-uppercase">Mejor Calidad Verde</span>
//                                 <span class="badge bg-success bg-opacity-10 text-success p-2"><i class="fas fa-leaf fa-lg"></i></span>
//                             </div>
//                             <h4 class="fw-bold text-success mb-1 text-truncate" id="kpi-ori-mejor-verde">—</h4>
//                             <small class="text-muted" id="kpi-ori-mejor-verde-sub">0,00 kg útiles verdes</small>
//                         </div>
//                     </div>
//                 </div>

//                 <!-- KPI 3: Menor Calidad / Mayor Descarte Rojo (PesoDescarteRojoKg) -->
//                 <div class="col-12 col-sm-6 col-xl-3">
//                     <div class="card shadow-sm border-0 border-start border-danger border-4 h-100">
//                         <div class="card-body">
//                             <div class="d-flex justify-content-between align-items-center mb-2">
//                                 <span class="text-muted small fw-bold text-uppercase">Menor Calidad (Descarte Rojo)</span>
//                                 <span class="badge bg-danger bg-opacity-10 text-danger p-2"><i class="fas fa-exclamation-triangle fa-lg"></i></span>
//                             </div>
//                             <h4 class="fw-bold text-danger mb-1 text-truncate" id="kpi-ori-menor-rojo">—</h4>
//                             <small class="text-muted" id="kpi-ori-menor-rojo-sub">0,00 kg de descarte rojo</small>
//                         </div>
//                     </div>
//                 </div>

//                 <!-- KPI 4: Mayor Frecuencia de Entregas (FrecuenciaEntregas) -->
//                 <div class="col-12 col-sm-6 col-xl-3">
//                     <div class="card shadow-sm border-0 border-start border-info border-4 h-100">
//                         <div class="card-body">
//                             <div class="d-flex justify-content-between align-items-center mb-2">
//                                 <span class="text-muted small fw-bold text-uppercase">Mayor Frecuencia Entregas</span>
//                                 <span class="badge bg-info bg-opacity-10 text-info p-2"><i class="fas fa-truck-loading fa-lg"></i></span>
//                             </div>
//                             <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-ori-mayor-frecuencia">—</h4>
//                             <small class="text-muted" id="kpi-ori-mayor-frecuencia-sub">0 entregas registradas</small>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 3: GRÁFICO PRINCIPAL - MAPA DE CALOR (TODOS LOS ORÍGENES Y PESO BRUTO TOTAL) -->
//             <div class="row g-4 mb-4 fade-in">
//                 <div class="col-12">
//                     <div class="card shadow-sm border-0">
//                         <div class="card-header bg-white border-bottom py-3">
//                             <h6 class="fw-bold text-dark mb-0">
//                                 <i class="fas fa-th text-primary me-2"></i>Mapa de Calor de Aportes por Origen y Categoría
//                             </h6>
//                             <small class="text-muted">Intensidad térmica proporcional al Peso Bruto Total (kg) aportado por cada origen dentro de su canal</small>
//                         </div>
//                         <div class="card-body">
//                             <div id="msg-sin-datos-ori-heatmap" class="alert alert-light text-center border my-4 p-4 d-none">
//                                 <i class="fas fa-building fa-2x text-muted mb-2"></i>
//                                 <p class="mb-0 text-muted">No se registraron entregas por origen en el período seleccionado.</p>
//                             </div>
//                             <div id="echarts-ori-heatmap" style="width: 100%; height: 430px;"></div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 4: GRÁFICO SECUNDARIO - BARRAS SUPERPUESTAS (PROMEDIO KG/ENTREGA VS ÍNDICE CALIDAD %) -->
//             <div class="row g-4 mb-4 fade-in">
//                 <div class="col-12">
//                     <div class="card shadow-sm border-0">
//                         <div class="card-header bg-white border-bottom py-3">
//                             <h6 class="fw-bold text-dark mb-0">
//                                 <i class="fas fa-chart-bar text-success me-2"></i>Eficiencia por Entrega vs. Índice de Calidad en Origen
//                             </h6>
//                             <small class="text-muted">Barras superpuestas: Promedio de kg por entrega (barra exterior azul) frente al Índice de Calidad Verde % (barra interior verde)</small>
//                         </div>
//                         <div class="card-body">
//                             <div id="msg-sin-datos-ori-superpuestas" class="alert alert-light text-center border my-4 p-4 d-none">
//                                 <i class="fas fa-chart-bar fa-2x text-muted mb-2"></i>
//                                 <p class="mb-0 text-muted">Sin datos suficientes para comparar promedios e índice de calidad.</p>
//                             </div>
//                             <div id="echarts-ori-superpuestas" style="width: 100%; height: 430px;"></div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 5: TABLA DETALLADA DE AUDITORÍA POR ORIGEN -->
//             <div class="row fade-in">
//                 <div class="col-12">
//                     <div class="card shadow-sm border-0">
//                         <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
//                             <div>
//                                 <h6 class="fw-bold text-dark mb-0">
//                                     <i class="fas fa-list-ol text-secondary me-2"></i>Detalle Completo de Orígenes y Generadores
//                                 </h6>
//                                 <small class="text-muted">Frecuencia de entregas, peso bruto acumulado, promedio por viaje e índice de separación en origen</small>
//                             </div>

//                             <div class="input-group input-group-sm" style="max-width: 280px;">
//                                 <span class="input-group-text bg-light"><i class="fas fa-search text-muted"></i></span>
//                                 <input type="text" id="buscador-tabla-origenes" class="form-control" placeholder="Buscar origen o categoría...">
//                             </div>
//                         </div>
//                         <div class="card-body">
//                             <div class="table-responsive">
//                                 <table class="table table-hover align-middle mb-0">
//                                     <thead class="table-light">
//                                         <tr>
//                                             <th class="text-center" style="width: 55px;">#</th>
//                                             <th>Origen / Generador</th>
//                                             <th>Categoría</th>
//                                             <th class="text-center">Entregas</th>
//                                             <th class="text-end">Peso Bruto Total</th>
//                                             <th class="text-end text-primary">Prom. / Entrega</th>
//                                             <th class="text-end text-success">Útil Verde</th>
//                                             <th class="text-end text-danger">Descarte Rojo</th>
//                                             <th style="min-width: 160px;">Índice Calidad (%)</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody id="tbody-traz-origenes">
//                                         <tr>
//                                             <td colspan="9" class="text-center text-muted py-4">Cargando orígenes...</td>
//                                         </tr>
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;

//         contenedor.html(htmlEstructura);
//         enlazarEventos();
//         cargarCatalogoTiposMaterial();
//         configurarFechasPorDefecto();
//     };

//     // 2. ENLACE DE EVENTOS DELEGADOS
//     const enlazarEventos = function () {
//         const principal = $('#contenedor-dinamico-reportes-trazabilidad');

//         principal.off('click', '#btn-filtrar-traz-origenes').on('click', '#btn-filtrar-traz-origenes', function () {
//             const desde = $('#filtro-traz-ori-desde').val();
//             const hasta = $('#filtro-traz-ori-hasta').val();
//             const idTipoMaterial = $('#filtro-traz-ori-material').val() || null;

//             if (!desde || !hasta) {
//                 Swal.fire('Fechas requeridas', 'Por favor seleccioná ambas fechas.', 'warning');
//                 return;
//             }
//             if (desde > hasta) {
//                 Swal.fire('Rango inválido', 'La fecha "Desde" no puede ser mayor a "Hasta".', 'warning');
//                 return;
//             }

//             consultarPorOrigenApi(desde, hasta, idTipoMaterial);
//         });

//         // Buscador instantáneo en tabla
//         principal.off('input', '#buscador-tabla-origenes').on('input', '#buscador-tabla-origenes', function () {
//             const termino = $(this).val().toLowerCase().trim();
//             const filtrados = termino
//                 ? estado.origenes.filter(o =>
//                     o.nombreOrigen.toLowerCase().includes(termino) ||
//                     o.categoriaOrigen.toLowerCase().includes(termino)
//                 )
//                 : estado.origenes;

//             renderizarTablaOrigenes(filtrados);
//         });

//         // Responsividad limpia
//         $(window).off('resize.trazOrigenes').on('resize.trazOrigenes', function () {
//             if (estado.chartHeatmapOrigenes && !estado.chartHeatmapOrigenes.isDisposed()) {
//                 estado.chartHeatmapOrigenes.resize();
//             }
//             if (estado.chartBarrasSuperpuestas && !estado.chartBarrasSuperpuestas.isDisposed()) {
//                 estado.chartBarrasSuperpuestas.resize();
//             }
//         });
//     };

//     const cargarCatalogoTiposMaterial = function () {
//         $.ajax({
//             type: "GET",
//             url: URL_POR_MATERIAL,
//             data: { fechaDesde: '2020-01-01', fechaHasta: new Date().toISOString().split('T')[0] },
//             success: function (res) {
//                 const select = $('#filtro-traz-ori-material');
//                 const tipos = (res && res.PorTipo) ? res.PorTipo : [];
//                 tipos
//                     .filter(t => t.IdTipoMaterial > 0)
//                     .sort((a, b) => a.TipoMaterial.localeCompare(b.TipoMaterial))
//                     .forEach(t => {
//                         select.append(`<option value="${t.IdTipoMaterial}">${t.TipoMaterial}</option>`);
//                     });
//             }
//         });
//     };

//     const configurarFechasPorDefecto = function () {
//         const hoy = new Date();
//         const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);

//         $('#filtro-traz-ori-hasta').val(hoy.toISOString().split('T')[0]);
//         $('#filtro-traz-ori-desde').val(primerDiaAnio.toISOString().split('T')[0]);

//         $('#btn-filtrar-traz-origenes').trigger('click');
//     };

//     // 3. CONSULTA A LA API C#
//     const consultarPorOrigenApi = function (fechaDesde, fechaHasta, idTipoMaterial) {
//         const btn = $('#btn-filtrar-traz-origenes');
//         btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

//         const params = { fechaDesde: fechaDesde, fechaHasta: fechaHasta };
//         if (idTipoMaterial) params.idTipoMaterial = idTipoMaterial;

//         $.ajax({
//             type: "GET",
//             url: URL_POR_ORIGEN,
//             data: params,
//             success: function (respuesta) {
//                 const lista = normalizarOrigenes(respuesta);
//                 estado.origenes = lista.sort((a, b) => b.pesoBrutoTotalKg - a.pesoBrutoTotalKg);
//                 estado.categorias = respuesta?.PorCategoria || [];
//                 $('#buscador-tabla-origenes').val('');

//                 renderizarKPIs(estado.origenes);
//                 renderizarHeatmapOrigenes(estado.origenes);
//                 renderizarBarrasSuperpuestas(estado.origenes);
//                 renderizarTablaOrigenes(estado.origenes);
//             },
//             error: function (err) {
//                 console.error("Error al obtener PorOrigen de Trazabilidad:", err);
//                 Swal.fire('Error de conexión', 'No se pudo obtener el reporte por orígenes desde el servidor.', 'error');
//             },
//             complete: function () {
//                 btn.prop('disabled', false).html('<i class="fas fa-search"></i> Filtrar');
//             }
//         });
//     };

//     // 4. RENDERIZADO DE LAS 4 TARJETAS KPI REQUERIDAS
//     const renderizarKPIs = function (lista) {
//         if (!lista || lista.length === 0) {
//             $('#kpi-ori-mayor-bruto').text('Sin datos');
//             $('#kpi-ori-mayor-bruto-sub').text('0,00 kg brutos ingresados');
//             $('#kpi-ori-mejor-verde').text('Sin datos');
//             $('#kpi-ori-mejor-verde-sub').text('0,00 kg útiles verdes');
//             $('#kpi-ori-menor-rojo').text('Sin datos');
//             $('#kpi-ori-menor-rojo-sub').text('0,00 kg de descarte rojo');
//             $('#kpi-ori-mayor-frecuencia').text('Sin datos');
//             $('#kpi-ori-mayor-frecuencia-sub').text('0 entregas registradas');
//             return;
//         }

//         // 1. Mayor Peso Bruto Total
//         const topBruto = [...lista].sort((a, b) => b.pesoBrutoTotalKg - a.pesoBrutoTotalKg)[0];
//         $('#kpi-ori-mayor-bruto').text(topBruto.nombreOrigen).attr('title', topBruto.nombreOrigen);
//         $('#kpi-ori-mayor-bruto-sub').text(
//             `${formatearKg(topBruto.pesoBrutoTotalKg)} kg (${formatearPorcentaje(topBruto.pctAporte)}% del total)`
//         );

//         // 2. Mejor Calidad Verde (mayor PesoUtilVerdeKg)
//         const topVerde = [...lista].sort((a, b) => b.pesoUtilVerdeKg - a.pesoUtilVerdeKg)[0];
//         $('#kpi-ori-mejor-verde').text(topVerde.nombreOrigen).attr('title', topVerde.nombreOrigen);
//         $('#kpi-ori-mejor-verde-sub').text(
//             `${formatearKg(topVerde.pesoUtilVerdeKg)} kg verdes (${formatearPorcentaje(topVerde.indiceCalidadOrigenPct)}% calidad)`
//         );

//         // 3. Menor Calidad / Mayor Descarte Rojo (mayor PesoDescarteRojoKg)
//         const topRojo = [...lista].sort((a, b) => b.pesoDescarteRojoKg - a.pesoDescarteRojoKg)[0];
//         $('#kpi-ori-menor-rojo').text(topRojo.nombreOrigen).attr('title', topRojo.nombreOrigen);
//         $('#kpi-ori-menor-rojo-sub').text(
//             `${formatearKg(topRojo.pesoDescarteRojoKg)} kg de descarte rojo`
//         );

//         // 4. Mayor Frecuencia de Entregas (mayor FrecuenciaEntregas)
//         const topFrecuencia = [...lista].sort((a, b) => b.frecuenciaEntregas - a.frecuenciaEntregas)[0];
//         $('#kpi-ori-mayor-frecuencia').text(topFrecuencia.nombreOrigen).attr('title', topFrecuencia.nombreOrigen);
//         $('#kpi-ori-mayor-frecuencia-sub').text(
//             `${topFrecuencia.frecuenciaEntregas} ${topFrecuencia.frecuenciaEntregas === 1 ? 'entrega' : 'entregas'} (prom. ${formatearKg(topFrecuencia.promedioKgPorEntrega)} kg)`
//         );
//     };

//     // 5. GRÁFICO PRINCIPAL: MAPA DE CALOR (TODOS LOS ORÍGENES Y PESO BRUTO TOTAL KG)
//     const renderizarHeatmapOrigenes = function (lista) {
//         if (typeof echarts === 'undefined') return;

//         const dom = document.getElementById('echarts-ori-heatmap');
//         const msgSinDatos = $('#msg-sin-datos-ori-heatmap');

//         const validos = (lista || []).filter(o => o.pesoBrutoTotalKg > 0);

//         if (validos.length === 0) {
//             $(dom).addClass('d-none');
//             msgSinDatos.removeClass('d-none');
//             return;
//         }

//         msgSinDatos.addClass('d-none');
//         $(dom).removeClass('d-none');

//         if (!estado.chartHeatmapOrigenes || estado.chartHeatmapOrigenes.isDisposed()) {
//             estado.chartHeatmapOrigenes = echarts.init(dom);
//         }

//         // Eje X: Todos los orígenes ordenados por peso bruto
//         const nombresX = validos.map(o => o.nombreOrigen);
//         // Eje Y: Categorías de origen presentes
//         const categoriasY = [...new Set(validos.map(o => o.categoriaOrigen))];

//         let maxPeso = 0;
//         const puntosHeatmap = validos.map((o, idxX) => {
//             const idxY = categoriasY.indexOf(o.categoriaOrigen);
//             const valor = Number(o.pesoBrutoTotalKg.toFixed(2));
//             if (valor > maxPeso) maxPeso = valor;
//             return {
//                 value: [idxX, idxY, valor],
//                 detalle: o
//             };
//         });

//         const necesitaZoom = validos.length > 14;

//         const option = {
//             tooltip: {
//                 position: 'top',
//                 formatter: function (params) {
//                     const o = params.data.detalle;
//                     return `
//                         <strong>${o.nombreOrigen}</strong><br/>
//                         <span class="badge bg-secondary mb-1">${o.categoriaOrigen}</span><br/>
//                         Peso Bruto Total: <strong>${formatearKg(o.pesoBrutoTotalKg)} kg</strong><br/>
//                         Entregas: <strong>${o.frecuenciaEntregas}</strong> | Calidad Verde: <strong>${formatearPorcentaje(o.indiceCalidadOrigenPct)}%</strong>
//                     `;
//                 }
//             },
//             toolbox: {
//                 show: true,
//                 right: 15,
//                 feature: {
//                     saveAsImage: { show: true, title: 'Descargar Mapa de Calor HD', pixelRatio: 2 }
//                 }
//             },
//             grid: {
//                 top: 35,
//                 bottom: necesitaZoom ? 115 : 90,
//                 left: '3%',
//                 right: '3%',
//                 containLabel: true
//             },
//             xAxis: {
//                 type: 'category',
//                 data: nombresX,
//                 splitArea: { show: true },
//                 axisLabel: {
//                     fontWeight: 'bold',
//                     fontSize: 11,
//                     interval: 0,
//                     rotate: 28,
//                     formatter: val => val.length > 20 ? val.substring(0, 18) + '...' : val
//                 }
//             },
//             yAxis: {
//                 type: 'category',
//                 data: categoriasY,
//                 splitArea: { show: true },
//                 axisLabel: {
//                     fontWeight: 'bold',
//                     fontSize: 12
//                 }
//             },
//             visualMap: {
//                 min: 0,
//                 max: maxPeso > 0 ? maxPeso : 100,
//                 calculable: true,
//                 orient: 'horizontal',
//                 left: 'center',
//                 bottom: necesitaZoom ? 38 : 5,
//                 text: ['Mayor Volumen (kg)', 'Menor Volumen (kg)'],
//                 inRange: {
//                     color: ['#e7f1ff', '#9ec5fe', '#3d8bfd', '#0d6efd', '#052c65']
//                 }
//             },
//             dataZoom: necesitaZoom ? [
//                 {
//                     type: 'slider',
//                     xAxisIndex: 0,
//                     startValue: 0,
//                     endValue: 13,
//                     bottom: 4,
//                     height: 18
//                 },
//                 {
//                     type: 'inside',
//                     xAxisIndex: 0
//                 }
//             ] : [],
//             series: [
//                 {
//                     name: 'Peso Bruto Total (kg)',
//                     type: 'heatmap',
//                     data: puntosHeatmap,
//                     label: {
//                         show: validos.length <= 16,
//                         fontWeight: 'bold',
//                         fontSize: 11,
//                         formatter: function (p) {
//                             return `${formatearKg(p.value[2])} kg`;
//                         }
//                     },
//                     emphasis: {
//                         itemStyle: {
//                             shadowBlur: 10,
//                             shadowColor: 'rgba(0, 0, 0, 0.35)'
//                         }
//                     }
//                 }
//             ]
//         };

//         estado.chartHeatmapOrigenes.setOption(option, true);
//     };

//     // 6. GRÁFICO SECUNDARIO: BARRAS SUPERPUESTAS (PROMEDIO KG/ENTREGA + ÍNDICE CALIDAD %)
//     const renderizarBarrasSuperpuestas = function (lista) {
//         if (typeof echarts === 'undefined') return;

//         const dom = document.getElementById('echarts-ori-superpuestas');
//         const msgSinDatos = $('#msg-sin-datos-ori-superpuestas');

//         const validos = (lista || []).filter(o => o.pesoBrutoTotalKg > 0);

//         if (validos.length === 0) {
//             $(dom).addClass('d-none');
//             msgSinDatos.removeClass('d-none');
//             return;
//         }

//         msgSinDatos.addClass('d-none');
//         $(dom).removeClass('d-none');

//         if (!estado.chartBarrasSuperpuestas || estado.chartBarrasSuperpuestas.isDisposed()) {
//             estado.chartBarrasSuperpuestas = echarts.init(dom);
//         }

//         const nombresX = validos.map(o => o.nombreOrigen);
//         const necesitaZoom = validos.length > 14;

//         const option = {
//             tooltip: {
//                 trigger: 'axis',
//                 axisPointer: { type: 'shadow' },
//                 formatter: function (params) {
//                     const idx = params[0].dataIndex;
//                     const o = validos[idx];
//                     return `
//                         <strong>${o.nombreOrigen}</strong> <span class="badge bg-light text-dark border">${o.categoriaOrigen}</span><br/>
//                         <span style="color:#0d6efd;">●</span> Promedio por Entrega: <strong>${formatearKg(o.promedioKgPorEntrega)} kg</strong> (${o.frecuenciaEntregas} entregas)<br/>
//                         <span style="color:#198754;">●</span> Índice de Calidad Verde: <strong>${formatearPorcentaje(o.indiceCalidadOrigenPct)}%</strong><br/>
//                         <small class="text-muted">Bruto Total: ${formatearKg(o.pesoBrutoTotalKg)} kg | Útil Verde: ${formatearKg(o.pesoUtilVerdeKg)} kg</small>
//                     `;
//                 }
//             },
//             legend: {
//                 top: 0,
//                 data: ['Promedio por Entrega (kg)', 'Índice Calidad Origen (%)']
//             },
//             toolbox: {
//                 show: true,
//                 right: 15,
//                 feature: {
//                     saveAsImage: { show: true, title: 'Descargar Barras Superpuestas HD', pixelRatio: 2 }
//                 }
//             },
//             grid: {
//                 top: 50,
//                 bottom: necesitaZoom ? 95 : 65,
//                 left: '3%',
//                 right: '4%',
//                 containLabel: true
//             },
//             xAxis: {
//                 type: 'category',
//                 data: nombresX,
//                 axisLabel: {
//                     fontWeight: 'bold',
//                     fontSize: 11,
//                     interval: 0,
//                     rotate: 28,
//                     formatter: val => val.length > 20 ? val.substring(0, 18) + '...' : val
//                 }
//             },
//             yAxis: [
//                 {
//                     type: 'value',
//                     name: 'Promedio / Entrega (kg)',
//                     position: 'left',
//                     axisLine: { show: true, lineStyle: { color: '#0d6efd' } },
//                     axisLabel: {
//                         formatter: val => val.toLocaleString('es-AR') + ' kg'
//                     }
//                 },
//                 {
//                     type: 'value',
//                     name: 'Índice Calidad (%)',
//                     position: 'right',
//                     min: 0,
//                     max: 100,
//                     splitLine: { show: false },
//                     axisLine: { show: true, lineStyle: { color: '#198754' } },
//                     axisLabel: {
//                         formatter: '{value}%'
//                     }
//                 }
//             ],
//             dataZoom: necesitaZoom ? [
//                 {
//                     type: 'slider',
//                     xAxisIndex: 0,
//                     startValue: 0,
//                     endValue: 13,
//                     bottom: 6,
//                     height: 18
//                 },
//                 {
//                     type: 'inside',
//                     xAxisIndex: 0
//                 }
//             ] : [],
//             series: [
//                 {
//                     name: 'Promedio por Entrega (kg)',
//                     type: 'bar',
//                     yAxisIndex: 0,
//                     barWidth: 36,
//                     z: 2,
//                     itemStyle: {
//                         color: 'rgba(13, 110, 253, 0.25)',
//                         borderColor: '#0d6efd',
//                         borderWidth: 1.5,
//                         borderRadius: [5, 5, 0, 0]
//                     },
//                     data: validos.map(o => Number(o.promedioKgPorEntrega.toFixed(2)))
//                 },
//                 {
//                     name: 'Índice Calidad Origen (%)',
//                     type: 'bar',
//                     yAxisIndex: 1,
//                     barWidth: 18,
//                     barGap: '-75%', // Superpone la barra interior centrada dentro de la barra exterior
//                     z: 3,
//                     itemStyle: {
//                         color: '#198754',
//                         borderRadius: [4, 4, 0, 0]
//                     },
//                     data: validos.map(o => Number(o.indiceCalidadOrigenPct.toFixed(2)))
//                 }
//             ]
//         };

//         estado.chartBarrasSuperpuestas.setOption(option, true);
//     };

//     // 7. TABLA DE AUDITORÍA COMPLETA POR ORIGEN
//     const renderizarTablaOrigenes = function (lista) {
//         const tbody = $('#tbody-traz-origenes').empty();

//         if (!lista || lista.length === 0) {
//             tbody.html(`
//                 <tr>
//                     <td colspan="9" class="text-center text-muted py-4">
//                         <i class="fas fa-folder-open me-2"></i>No se encontraron orígenes que coincidan con el filtro aplicado.
//                     </td>
//                 </tr>
//             `);
//             return;
//         }

//         lista.forEach((o, index) => {
//             const pct = Math.min(100, Math.max(0, o.indiceCalidadOrigenPct));
//             const colorBarra = pct >= 70 ? 'bg-success' : (pct >= 40 ? 'bg-warning' : 'bg-danger');

//             const medalla = index === 0
//                 ? '<span class="badge bg-warning text-dark"><i class="fas fa-crown"></i> 1</span>'
//                 : `<span class="text-muted fw-bold">${index + 1}</span>`;

//             tbody.append(`
//                 <tr>
//                     <td class="text-center">${medalla}</td>
//                     <td class="fw-bold text-dark">${o.nombreOrigen}</td>
//                     <td><span class="badge bg-light text-dark border">${o.categoriaOrigen}</span></td>
//                     <td class="text-center"><span class="badge bg-info bg-opacity-10 text-info border border-info">${o.frecuenciaEntregas}</span></td>
//                     <td class="text-end fw-semibold">${formatearKg(o.pesoBrutoTotalKg)} kg</td>
//                     <td class="text-end text-primary fw-semibold">${formatearKg(o.promedioKgPorEntrega)} kg</td>
//                     <td class="text-end text-success fw-semibold">${formatearKg(o.pesoUtilVerdeKg)} kg</td>
//                     <td class="text-end text-danger fw-semibold">${formatearKg(o.pesoDescarteRojoKg)} kg</td>
//                     <td>
//                         <div class="d-flex align-items-center gap-2">
//                             <div class="progress flex-grow-1" style="height: 8px;">
//                                 <div class="progress-bar ${colorBarra}" role="progressbar" style="width: ${pct}%;"></div>
//                             </div>
//                             <span class="small fw-bold" style="min-width: 48px;">${formatearPorcentaje(o.indiceCalidadOrigenPct)}%</span>
//                         </div>
//                     </td>
//                 </tr>
//             `);
//         });
//     };

//     // API Pública del Módulo
//     return {
//         cargarEn: inicializar
//     };
// })();