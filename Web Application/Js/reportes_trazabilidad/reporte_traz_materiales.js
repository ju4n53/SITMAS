/* ========================================================================
   SITMAS - Módulo de Reportes de Trazabilidad: Tipos, Subtipos y Flujo Sankey
   Consume: GET /api/ReportesTrazabilidad/PorMaterial
   Estructura:
     - Filtros superiores (Desde, Hasta, Filtrar Tipo)
     - KPIs Parte 1: Destacados de Recepción y Aprovechamiento (Gama Verde)
     - KPIs Parte 2: Indicadores de Descarte Semáforo Rojo (Gama Roja)
     - KPIs Parte 3: Colección por Tipo de Material con Peso Bruto (Multicolor)
     - Gráfico 1: Barras Apiladas por Tipo de Material (Solo Clasificado)
     - Gráfico 2: Sunburst con Esquinas Redondeadas (Tipo -> Subtipo -> Semáforo)
     - Gráfico 3: Diagrama Sankey Expandido / Ranking Top 10 Subtipos
   Archivo: Js/reportes_trazabilidad/reporte_traz_materiales.js
   ======================================================================== */

const ReporteTrazMaterialesModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        tipos: [],
        subtipos: [],
        modoSubtipos: 'sankey', // 'sankey' | 'bar'
        chartApiladoTipos: null,
        chartSunburst: null,
        chartSubtipos: null
    };

    const URL_POR_MATERIAL = "https://localhost:44325/api/ReportesTrazabilidad/PorMaterial";

    // Paleta institucional para familias de materiales en Sunburst y Sankey
    const PALETA_MATERIALES = [
        '#0d6efd', '#198754', '#20c997', '#fd7e14',
        '#6f42c1', '#0dcaf0', '#d63384', '#6610f2'
    ];

    // Paleta de tarjetas pastel diferenciadas para la colección de Tipos (Parte 3)
    const ESTILOS_TARJETAS_TIPOS = [
        { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1', badgeBg: 'rgba(2, 132, 199, 0.16)', icon: 'fa-cube' },
        { bg: '#ede9fe', border: '#7c3aed', text: '#5b21b6', badgeBg: 'rgba(124, 58, 237, 0.16)', icon: 'fa-layer-group' },
        { bg: '#ffedd5', border: '#ea580c', text: '#c2410c', badgeBg: 'rgba(234, 88, 12, 0.16)', icon: 'fa-box-open' },
        { bg: '#cffafe', border: '#0891b2', text: '#0e7490', badgeBg: 'rgba(8, 145, 178, 0.16)', icon: 'fa-recycle' },
        { bg: '#fae8ff', border: '#c026d3', text: '#86198f', badgeBg: 'rgba(192, 38, 211, 0.16)', icon: 'fa-shapes' },
        { bg: '#fef3c7', border: '#d97706', text: '#b45309', badgeBg: 'rgba(217, 119, 6, 0.16)', icon: 'fa-cubes' },
        { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8', badgeBg: 'rgba(37, 99, 235, 0.16)', icon: 'fa-archive' },
        { bg: '#ccfbf1', border: '#0d9488', text: '#0f766e', badgeBg: 'rgba(13, 148, 136, 0.16)', icon: 'fa-th-large' }
    ];

    // Helpers de formateo regional (es-AR)
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

    // Limpieza segura de instancias ECharts y listeners al cambiar de pestaña en la SPA
    const destruirGraficosActivos = function () {
        ['chartApiladoTipos', 'chartSunburst', 'chartSubtipos'].forEach(key => {
            if (estado[key] && !estado[key].isDisposed()) {
                estado[key].dispose();
            }
            estado[key] = null;
        });
        $(window).off('resize.trazMateriales');
    };

    // Normalizadores alineados 1:1 con TrazabilidadTipoMaterialDTO y TrazabilidadSubtipoMaterialDTO
    const normalizarTipos = function (listaRaw) {
        return (listaRaw || []).map(item => {
            const bruto = parseFloat(item.PesoBrutoTotalKg ?? 0);
            const verde = parseFloat(item.PesoVerdeKg ?? 0);
            const amarillo = parseFloat(item.PesoAmarilloKg ?? 0);
            const rojo = parseFloat(item.PesoRojoKg ?? 0);
            const clasificado = verde + amarillo + rojo;
            const pctVerde = item.PorcentajeAprovechamiento !== undefined
                ? parseFloat(item.PorcentajeAprovechamiento || 0)
                : (bruto > 0 ? (verde * 100 / bruto) : 0);

            return {
                idTipoMaterial: item.IdTipoMaterial ?? 0,
                tipoMaterial: item.TipoMaterial || 'Sin Tipo Asignado',
                cantLotes: parseInt(item.CantLotes ?? 0, 10),
                bruto: bruto,
                promedioPorLote: parseFloat(item.PromedioBrutoPorLoteKg ?? 0),
                verde: verde,
                amarillo: amarillo,
                rojo: rojo,
                clasificado: clasificado,
                pctVerde: pctVerde
            };
        });
    };

    const normalizarSubtipos = function (listaRaw) {
        return (listaRaw || []).map(item => {
            const verde = parseFloat(item.PesoVerdeKg ?? 0);
            const amarillo = parseFloat(item.PesoAmarilloKg ?? 0);
            const rojo = parseFloat(item.PesoRojoKg ?? 0);
            const clasificado = verde + amarillo + rojo;
            const totalSalidas = parseFloat(item.TotalSalidasKg ?? 0);
            const balanceNeto = item.BalanceNetoPeriodoKg !== undefined
                ? parseFloat(item.BalanceNetoPeriodoKg)
                : ((verde + amarillo) - totalSalidas);

            return {
                idSubtipo: item.IdSubtipoM ?? 0,
                idTipoMaterial: item.IdTipoMaterial ?? 0,
                tipoMaterial: item.TipoMaterial || 'Sin Tipo Asignado',
                subtipo: item.Subtipo || 'Sin Subtipo',
                cantClasificaciones: parseInt(item.CantClasificaciones ?? 0, 10),
                verde: verde,
                amarillo: amarillo,
                rojo: rojo,
                promedioVerde: parseFloat(item.PromedioPesoVerdeKg ?? 0),
                clasificado: clasificado,
                totalSalidas: totalSalidas,
                egresoKg: parseFloat(item.EgresoKg ?? 0),
                retiroKg: parseFloat(item.RetiroKg ?? 0),
                produccionKg: parseFloat(item.ProduccionKg ?? 0),
                balanceNeto: balanceNeto
            };
        });
    };

    // 1. INICIALIZACIÓN DE LA ESTRUCTURA VISUAL
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

            <!-- NIVEL 2 - PARTE 1: DESTACADOS DE RECEPCIÓN Y APROVECHAMIENTO (3 TARJETAS VERDES) -->
            <div class="fade-in mb-4">
                <div class="d-flex align-items-center mb-2">
                    <h6 class="fw-bold text-uppercase mb-0" style="color: #15803d; letter-spacing: 0.4px;">
                        <i class="fas fa-award me-2"></i>Destacados de Recepción y Aprovechamiento
                    </h6>
                </div>
                <div class="row g-3">
                    <!-- 1. Estética verde: Tipo con mayor peso bruto -->
                    <div class="col-12 col-md-4">
                        <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #dcfce7; border-color: #16a34a !important;">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase" style="color: #15803d;">Tipo con Mayor Peso Bruto</span>
                                    <span class="badge p-2" style="background-color: rgba(22, 163, 74, 0.18); color: #15803d;">
                                        <i class="fas fa-crown fa-lg"></i>
                                    </span>
                                </div>
                                <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-mat-p1-top-bruto-nombre">—</h4>
                                <h5 class="fw-bold mb-1" style="color: #15803d;" id="kpi-mat-p1-top-bruto-valor">0,00 kg</h5>
                                <small class="text-secondary fw-medium" id="kpi-mat-p1-top-bruto-sub">0 lotes recibidos</small>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Estética verde claro: Tipo con mayor % aprovechamiento -->
                    <div class="col-12 col-md-4">
                        <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #e6f9ed; border-color: #10b981 !important;">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase" style="color: #047857;">Tipo Mayor % Aprovechamiento</span>
                                    <span class="badge p-2" style="background-color: rgba(16, 185, 129, 0.18); color: #047857;">
                                        <i class="fas fa-percentage fa-lg"></i>
                                    </span>
                                </div>
                                <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-mat-p1-top-aprov-nombre">—</h4>
                                <h5 class="fw-bold mb-1" style="color: #047857;" id="kpi-mat-p1-top-aprov-valor">0,0%</h5>
                                <small class="text-secondary fw-medium" id="kpi-mat-p1-top-aprov-sub">0,00 kg útiles (Verde)</small>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Estética verde claro suave: Subtipo con mayor peso verde -->
                    <div class="col-12 col-md-4">
                        <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #f0fdf4; border-color: #22c55e !important;">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase" style="color: #166534;">Subtipo con Mayor Peso Verde</span>
                                    <span class="badge p-2" style="background-color: rgba(34, 197, 94, 0.16); color: #166534;">
                                        <i class="fas fa-recycle fa-lg"></i>
                                    </span>
                                </div>
                                <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-mat-p1-top-sub-verde-nombre">—</h4>
                                <h5 class="fw-bold mb-1" style="color: #166534;" id="kpi-mat-p1-top-sub-verde-valor">0,00 kg</h5>
                                <small class="text-secondary fw-medium" id="kpi-mat-p1-top-sub-verde-sub">Material: —</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2 - PARTE 2: INDICADORES DE DESCARTE - SEMÁFORO ROJO (2 TARJETAS ROJAS) -->
            <div class="fade-in mb-4">
                <div class="d-flex align-items-center mb-2">
                    <h6 class="fw-bold text-uppercase mb-0" style="color: #b91c1c; letter-spacing: 0.4px;">
                        <i class="fas fa-exclamation-triangle me-2"></i>Indicadores de Descarte (Semáforo Rojo)
                    </h6>
                </div>
                <div class="row g-3">
                    <!-- 1. Estética rojo: Tipo con mayor peso rojo -->
                    <div class="col-12 col-md-6">
                        <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #fee2e2; border-color: #dc2626 !important;">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase" style="color: #b91c1c;">Tipo con Mayor Peso Rojo</span>
                                    <span class="badge p-2" style="background-color: rgba(220, 38, 38, 0.16); color: #b91c1c;">
                                        <i class="fas fa-times-circle fa-lg"></i>
                                    </span>
                                </div>
                                <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-mat-p2-top-tipo-rojo-nombre">—</h4>
                                <h5 class="fw-bold mb-1" style="color: #b91c1c;" id="kpi-mat-p2-top-tipo-rojo-valor">0,00 kg</h5>
                                <small class="text-secondary fw-medium" id="kpi-mat-p2-top-tipo-rojo-sub">0,0% de descarte sobre su bruto</small>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Estética rojo claro: Subtipo con mayor peso rojo -->
                    <div class="col-12 col-md-6">
                        <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: #fff1f2; border-color: #f43f5e !important;">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase" style="color: #be123c;">Subtipo con Mayor Peso Rojo</span>
                                    <span class="badge p-2" style="background-color: rgba(244, 63, 94, 0.16); color: #be123c;">
                                        <i class="fas fa-trash-alt fa-lg"></i>
                                    </span>
                                </div>
                                <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-mat-p2-top-sub-rojo-nombre">—</h4>
                                <h5 class="fw-bold mb-1" style="color: #be123c;" id="kpi-mat-p2-top-sub-rojo-valor">0,00 kg</h5>
                                <small class="text-secondary fw-medium" id="kpi-mat-p2-top-sub-rojo-sub">Material: —</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2 - PARTE 3: RECEPCIÓN BRUTA POR TIPO DE MATERIAL (COLECCIÓN MULTICOLOR) -->
            <div class="fade-in mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold text-uppercase text-primary mb-0" style="letter-spacing: 0.4px;">
                        <i class="fas fa-boxes me-2"></i>Recepción Bruta por Tipo de Material
                    </h6>
                    <small class="text-muted" id="kpi-mat-p3-contador-tipos">0 categorías registradas</small>
                </div>
                <div class="row g-3" id="contenedor-kpis-coleccion-tipos">
                    <!-- Tarjetas generadas dinámicamente por cada Tipo de Material -->
                </div>
            </div>

            <!-- NIVEL 3: GRÁFICO 1 - CALIDAD DE RECUPERACIÓN POR TIPO DE MATERIAL (SOLO CLASIFICADO) -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3">
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-chart-bar text-primary me-2"></i>Calidad de Recuperación por Tipo de Material (Material Clasificado)
                            </h6>
                            <small class="text-muted">Desglose apilado del material ya clasificado en planta: útil (Verde), revisión (Amarillo) y descarte (Rojo)</small>
                        </div>
                        <div class="card-body">
                            <div id="msg-sin-datos-mat-tipos" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-cubes fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No hay material clasificado por tipo en el rango seleccionado.</p>
                            </div>
                            <div id="echarts-mat-apilado-tipos" style="width: 100%; height: 390px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 4: GRÁFICO 2 - SUNBURST CON ESQUINAS REDONDEADAS (TIPO -> SUBTIPO -> COLOR) -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-sun text-warning me-2"></i>Composición Jerárquica: Tipo de Material, Subtipo y Clasificación por Color
                                </h6>
                                <small class="text-muted">
                                    Anillo interior: Tipo de material | Anillo medio: Subtipo | Anillo exterior: Semáforo (Verde, Amarillo y Rojo)
                                </small>
                            </div>
                            <span class="badge bg-light text-secondary border">
                                <i class="fas fa-search-plus text-primary me-1"></i>Clic en un sector para hacer zoom (clic en el centro para volver)
                            </span>
                        </div>
                        <div class="card-body">
                            <div id="msg-sin-datos-mat-sunburst" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-chart-pie fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">Sin datos clasificados para construir la jerarquía Sunburst en este período.</p>
                            </div>
                            <div id="echarts-mat-sunburst" style="width: 100%; height: 580px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 5: GRÁFICO 3 - DIAGRAMA SANKEY PROTAGONISTA -->
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

            renderizarGraficoSubtipos(obtenerSubtiposFiltrados(), estado.modoSubtipos);
        });

        // Responsividad limpia para ECharts
        $(window).off('resize.trazMateriales').on('resize.trazMateriales', function () {
            if (estado.chartApiladoTipos && !estado.chartApiladoTipos.isDisposed()) {
                estado.chartApiladoTipos.resize();
            }
            if (estado.chartSunburst && !estado.chartSunburst.isDisposed()) {
                estado.chartSunburst.resize();
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
                const rawSubtipos = (respuesta && respuesta.PorSubtipo) ? respuesta.PorSubtipo : [];

                estado.tipos = normalizarTipos(rawTipos);
                estado.subtipos = normalizarSubtipos(rawSubtipos);

                actualizarSelectorTipos(estado.tipos);
                aplicarFiltroLocalYRenderizar();
            },
            error: function (err) {
                console.error("Error al obtener PorMaterial de Trazabilidad:", err);
                Swal.fire('Error de conexión', 'No se pudieron obtener los datos por material desde el servidor.', 'error');
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

    const obtenerTiposFiltrados = function () {
        const idTipoFiltro = $('#filtro-traz-mat-tipo').val();
        return idTipoFiltro
            ? estado.tipos.filter(t => String(t.idTipoMaterial) === String(idTipoFiltro))
            : estado.tipos;
    };

    const obtenerSubtiposFiltrados = function () {
        const idTipoFiltro = $('#filtro-traz-mat-tipo').val();
        return idTipoFiltro
            ? estado.subtipos.filter(s => String(s.idTipoMaterial) === String(idTipoFiltro))
            : estado.subtipos;
    };

    const aplicarFiltroLocalYRenderizar = function () {
        const tiposFiltrados = obtenerTiposFiltrados();
        const subtiposFiltrados = obtenerSubtiposFiltrados();

        renderizarKPIs(tiposFiltrados, subtiposFiltrados);
        renderizarGraficoApiladoTipos(tiposFiltrados);
        renderizarGraficoSunburst(subtiposFiltrados);
        renderizarGraficoSubtipos(subtiposFiltrados, estado.modoSubtipos);
    };

    // 4. RENDERIZADO DE LAS 3 PARTES DE TARJETAS KPI
    const renderizarKPIs = function (tipos, subtipos) {
        // --- PARTE 1: Destacados de Recepción y Aprovechamiento (Gama Verde) ---
        const tiposConBruto = [...tipos].filter(t => t.bruto > 0);

        if (tiposConBruto.length > 0) {
            const topBruto = [...tiposConBruto].sort((a, b) => b.bruto - a.bruto)[0];
            $('#kpi-mat-p1-top-bruto-nombre').text(topBruto.tipoMaterial).attr('title', topBruto.tipoMaterial);
            $('#kpi-mat-p1-top-bruto-valor').text(`${formatearKg(topBruto.bruto)} kg`);
            $('#kpi-mat-p1-top-bruto-sub').text(
                `${formatearEntero(topBruto.cantLotes)} lotes | Prom.: ${formatearKg(topBruto.promedioPorLote)} kg/lote`
            );

            const topAprov = [...tiposConBruto].sort((a, b) => b.pctVerde - a.pctVerde)[0];
            $('#kpi-mat-p1-top-aprov-nombre').text(topAprov.tipoMaterial).attr('title', topAprov.tipoMaterial);
            $('#kpi-mat-p1-top-aprov-valor').text(`${formatearPorcentaje(topAprov.pctVerde)}%`);
            $('#kpi-mat-p1-top-aprov-sub').text(
                `${formatearKg(topAprov.verde)} kg útiles sobre ${formatearKg(topAprov.bruto)} kg brutos`
            );
        } else {
            $('#kpi-mat-p1-top-bruto-nombre, #kpi-mat-p1-top-aprov-nombre').text('Sin datos').removeAttr('title');
            $('#kpi-mat-p1-top-bruto-valor').text('0,00 kg');
            $('#kpi-mat-p1-top-bruto-sub').text('0 lotes recibidos');
            $('#kpi-mat-p1-top-aprov-valor').text('0,0%');
            $('#kpi-mat-p1-top-aprov-sub').text('0,00 kg útiles (Verde)');
        }

        const subtiposConVerde = [...subtipos].filter(s => s.verde > 0);
        if (subtiposConVerde.length > 0) {
            const topSubVerde = subtiposConVerde.sort((a, b) => b.verde - a.verde)[0];
            $('#kpi-mat-p1-top-sub-verde-nombre').text(topSubVerde.subtipo).attr('title', topSubVerde.subtipo);
            $('#kpi-mat-p1-top-sub-verde-valor').text(`${formatearKg(topSubVerde.verde)} kg`);
            $('#kpi-mat-p1-top-sub-verde-sub').text(
                `Material: ${topSubVerde.tipoMaterial} (${formatearEntero(topSubVerde.cantClasificaciones)} pesajes)`
            );
        } else {
            $('#kpi-mat-p1-top-sub-verde-nombre').text('Sin datos').removeAttr('title');
            $('#kpi-mat-p1-top-sub-verde-valor').text('0,00 kg');
            $('#kpi-mat-p1-top-sub-verde-sub').text('Material: —');
        }

        // --- PARTE 2: Indicadores de Descarte Semáforo Rojo (Gama Roja) ---
        const tiposConRojo = [...tipos].filter(t => t.rojo > 0);
        if (tiposConRojo.length > 0) {
            const topTipoRojo = tiposConRojo.sort((a, b) => b.rojo - a.rojo)[0];
            const pctRojoTipo = topTipoRojo.bruto > 0 ? (topTipoRojo.rojo * 100 / topTipoRojo.bruto) : 0;
            $('#kpi-mat-p2-top-tipo-rojo-nombre').text(topTipoRojo.tipoMaterial).attr('title', topTipoRojo.tipoMaterial);
            $('#kpi-mat-p2-top-tipo-rojo-valor').text(`${formatearKg(topTipoRojo.rojo)} kg`);
            $('#kpi-mat-p2-top-tipo-rojo-sub').text(
                `${formatearPorcentaje(pctRojoTipo)}% de descarte sobre ${formatearKg(topTipoRojo.bruto)} kg brutos`
            );
        } else {
            $('#kpi-mat-p2-top-tipo-rojo-nombre').text('Sin descarte rojo').removeAttr('title');
            $('#kpi-mat-p2-top-tipo-rojo-valor').text('0,00 kg');
            $('#kpi-mat-p2-top-tipo-rojo-sub').text('0,0% de descarte registrado');
        }

        const subtiposConRojo = [...subtipos].filter(s => s.rojo > 0);
        if (subtiposConRojo.length > 0) {
            const topSubRojo = subtiposConRojo.sort((a, b) => b.rojo - a.rojo)[0];
            $('#kpi-mat-p2-top-sub-rojo-nombre').text(topSubRojo.subtipo).attr('title', topSubRojo.subtipo);
            $('#kpi-mat-p2-top-sub-rojo-valor').text(`${formatearKg(topSubRojo.rojo)} kg`);
            $('#kpi-mat-p2-top-sub-rojo-sub').text(`Material: ${topSubRojo.tipoMaterial}`);
        } else {
            $('#kpi-mat-p2-top-sub-rojo-nombre').text('Sin descarte rojo').removeAttr('title');
            $('#kpi-mat-p2-top-sub-rojo-valor').text('0,00 kg');
            $('#kpi-mat-p2-top-sub-rojo-sub').text('Material: —');
        }

        // --- PARTE 3: Colección de Tarjetas de Todos los Tipos de Material ---
        const contenedorColeccion = $('#contenedor-kpis-coleccion-tipos');
        const ordenadosPorBruto = [...tipos].sort((a, b) => b.bruto - a.bruto);

        $('#kpi-mat-p3-contador-tipos').text(
            `${ordenadosPorBruto.length} ${ordenadosPorBruto.length === 1 ? 'categoría registrada' : 'categorías registradas'}`
        );

        if (ordenadosPorBruto.length === 0) {
            contenedorColeccion.html(`
                <div class="col-12">
                    <div class="alert alert-light border text-center text-muted py-3 mb-0">
                        No se encontraron tipos de material ingresados en el rango de fechas seleccionado.
                    </div>
                </div>
            `);
            return;
        }

        const tarjetasHtml = ordenadosPorBruto.map((t, idx) => {
            const estilo = ESTILOS_TARJETAS_TIPOS[idx % ESTILOS_TARJETAS_TIPOS.length];
            return `
                <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" style="background-color: ${estilo.bg}; border-color: ${estilo.border} !important;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold text-uppercase text-truncate me-2" style="color: ${estilo.text};" title="${t.tipoMaterial}">
                                    ${t.tipoMaterial}
                                </span>
                                <span class="badge p-2" style="background-color: ${estilo.badgeBg}; color: ${estilo.text};">
                                    <i class="fas ${estilo.icon} fa-lg"></i>
                                </span>
                            </div>
                            <h4 class="fw-bold text-dark mb-1">${formatearKg(t.bruto)} kg</h4>
                            <small class="text-secondary fw-medium">
                                ${formatearEntero(t.cantLotes)} lotes | Aprov. Verde: ${formatearPorcentaje(t.pctVerde)}%
                            </small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        contenedorColeccion.html(tarjetasHtml);
    };

    // 5. GRÁFICO 1: BARRAS APILADAS POR TIPO DE MATERIAL (SOLO MATERIAL CLASIFICADO)
    const renderizarGraficoApiladoTipos = function (tipos) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-mat-apilado-tipos');
        const msgSinDatos = $('#msg-sin-datos-mat-tipos');

        const validos = (tipos || []).filter(t => t.clasificado > 0);

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

        const ordenados = [...validos].sort((a, b) => b.clasificado - a.clasificado);
        const categorias = ordenados.map(t => t.tipoMaterial);

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function (params) {
                    if (!params || params.length === 0) return '';
                    const item = ordenados[params[0].dataIndex];
                    let html = `<strong>${item.tipoMaterial}</strong><br/>`;
                    html += `<span class="text-muted small">Total clasificado: <strong>${formatearKg(item.clasificado)} kg</strong></span><hr class="my-1"/>`;
                    params.forEach(p => {
                        const pct = item.clasificado > 0 ? ((p.value * 100) / item.clasificado) : 0;
                        html += `${p.marker} ${p.seriesName}: <strong>${formatearKg(p.value)} kg</strong> (${formatearPorcentaje(pct)}%)<br/>`;
                    });
                    return html;
                }
            },
            legend: {
                top: 0,
                data: ['Útil (Verde)', 'Revisión (Amarillo)', 'Descarte (Rojo)']
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
                },
                splitLine: {
                    lineStyle: { type: 'dashed', color: '#e9ecef' }
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
                }
            ]
        };

        estado.chartApiladoTipos.setOption(option, true);
    };

    // 6. GRÁFICO 2: SUNBURST CON ESQUINAS REDONDEADAS (TIPO -> SUBTIPO -> COLOR)
    const renderizarGraficoSunburst = function (subtipos) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-mat-sunburst');
        const msgSinDatos = $('#msg-sin-datos-mat-sunburst');

        const validos = (subtipos || []).filter(s => s.clasificado > 0);

        if (validos.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        if (!estado.chartSunburst || estado.chartSunburst.isDisposed()) {
            estado.chartSunburst = echarts.init(dom);
        }

        // Construimos la jerarquía de 3 niveles: Tipo -> Subtipo -> Clasificación por Color
        const tiposMap = new Map();
        let idxColor = 0;

        const ordenados = [...validos].sort((a, b) => b.clasificado - a.clasificado);

        ordenados.forEach(s => {
            const claveTipo = `${s.idTipoMaterial}_${s.tipoMaterial}`;
            if (!tiposMap.has(claveTipo)) {
                const colorFamilia = PALETA_MATERIALES[idxColor % PALETA_MATERIALES.length];
                idxColor++;
                tiposMap.set(claveTipo, {
                    name: s.tipoMaterial,
                    nivel: 'Tipo de Material',
                    itemStyle: { color: colorFamilia },
                    children: []
                });
            }

            const nodoTipo = tiposMap.get(claveTipo);
            const hojasColor = [];

            if (s.verde > 0) {
                hojasColor.push({
                    name: 'Útil (Verde)',
                    nivel: 'Clasificación Semáforo',
                    value: Number(s.verde.toFixed(2)),
                    itemStyle: { color: '#198754' }
                });
            }
            if (s.amarillo > 0) {
                hojasColor.push({
                    name: 'Revisión (Amarillo)',
                    nivel: 'Clasificación Semáforo',
                    value: Number(s.amarillo.toFixed(2)),
                    itemStyle: { color: '#ffc107' }
                });
            }
            if (s.rojo > 0) {
                hojasColor.push({
                    name: 'Descarte (Rojo)',
                    nivel: 'Clasificación Semáforo',
                    value: Number(s.rojo.toFixed(2)),
                    itemStyle: { color: '#dc3545' }
                });
            }

            nodoTipo.children.push({
                name: s.subtipo,
                nivel: 'Subtipo de Material',
                itemStyle: {
                    color: nodoTipo.itemStyle.color,
                    opacity: 0.85
                },
                children: hojasColor
            });
        });

        const dataSunburst = Array.from(tiposMap.values());
        const totalGlobalClasificado = ordenados.reduce((acc, s) => acc + s.clasificado, 0);

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    const ruta = (params.treePathInfo || [])
                        .slice(1)
                        .map(n => n.name)
                        .join(' <i class="fas fa-chevron-right mx-1 text-muted small"></i> ');

                    const valor = parseFloat(params.value || 0);
                    const pctGlobal = totalGlobalClasificado > 0
                        ? ((valor * 100) / totalGlobalClasificado)
                        : 0;

                    return `
                        <div class="small text-muted mb-1">${ruta || params.name}</div>
                        <strong>${params.name}</strong><br/>
                        Peso Clasificado: <strong>${formatearKg(valor)} kg</strong> (${formatearPorcentaje(pctGlobal)}% del total)
                    `;
                }
            },
            toolbox: {
                show: true,
                right: 15,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar Sunburst PNG HD', pixelRatio: 2 }
                }
            },
            series: [
                {
                    type: 'sunburst',
                    data: dataSunburst,
                    radius: ['14%', '92%'],
                    sort: 'desc',
                    emphasis: {
                        focus: 'ancestor'
                    },
                    itemStyle: {
                        borderRadius: 7,
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    },
                    label: {
                        rotate: 'radial',
                        color: '#212529',
                        fontWeight: 'bold',
                        minAngle: 7,
                        formatter: function (p) {
                            return `${p.name}\n${formatearKg(p.value)} kg`;
                        }
                    },
                    levels: [
                        {},
                        {
                            // Nivel 1: Tipo de Material
                            r0: '14%',
                            r: '40%',
                            itemStyle: { borderWidth: 2.5, borderRadius: 8 },
                            label: {
                                rotate: 'tangential',
                                fontSize: 12,
                                color: '#ffffff',
                                textShadowBlur: 3,
                                textShadowColor: 'rgba(0,0,0,0.45)'
                            }
                        },
                        {
                            // Nivel 2: Subtipo de Material
                            r0: '40%',
                            r: '68%',
                            itemStyle: { borderWidth: 2, borderRadius: 7 },
                            label: {
                                align: 'right',
                                fontSize: 11,
                                color: '#212529'
                            }
                        },
                        {
                            // Nivel 3: Clasificación por Color (Verde, Amarillo, Rojo)
                            r0: '68%',
                            r: '92%',
                            itemStyle: { borderWidth: 2, borderRadius: 7 },
                            label: {
                                position: 'inside',
                                fontSize: 10,
                                color: '#ffffff',
                                textShadowBlur: 2,
                                textShadowColor: 'rgba(0,0,0,0.55)',
                                formatter: function (p) {
                                    return `${formatearKg(p.value)} kg`;
                                }
                            }
                        }
                    ]
                }
            ]
        };

        estado.chartSunburst.setOption(option, true);
    };

    // 7. GRÁFICO 3: DIAGRAMA SANKEY EXPANDIDO (TIPO -> SUBTIPO) O RANKING TOP 10
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

        const alturaCalculada = modo === 'sankey'
            ? Math.max(540, validos.length * 40)
            : 460;
        $(dom).css('height', `${alturaCalculada}px`);

        if (!estado.chartSubtipos || estado.chartSubtipos.isDisposed()) {
            estado.chartSubtipos = echarts.init(dom);
        } else {
            estado.chartSubtipos.resize();
        }

        if (modo === 'sankey') {
            const nodosMap = new Map();
            const enlaces = [];
            const colorPorTipo = new Map();
            let idxColor = 0;

            const ordenados = [...validos].sort((a, b) => b.clasificado - a.clasificado);

            ordenados.forEach(s => {
                if (!colorPorTipo.has(s.tipoMaterial)) {
                    colorPorTipo.set(s.tipoMaterial, PALETA_MATERIALES[idxColor % PALETA_MATERIALES.length]);
                    idxColor++;
                }
                const colorFamilia = colorPorTipo.get(s.tipoMaterial);

                const idOrigen = `T_${s.idTipoMaterial}_${s.tipoMaterial}`;
                const idDestino = `S_${s.idSubtipo}_${s.subtipo}`;

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
                        totalSalidas: s.totalSalidas,
                        balanceNeto: s.balanceNeto,
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
                                <small class="text-warning">Amarillo: ${formatearKg(e.amarillo)} kg</small> |
                                <small class="text-danger">Rojo: ${formatearKg(e.rojo)} kg</small>
                            `;
                        } else {
                            const n = p.data;
                            const rol = n.esOrigen ? 'Categoría Principal' : `Subtipo de ${n.tipoPadre}`;
                            let extra = '';
                            if (!n.esOrigen) {
                                extra = `<br/><small class="text-muted">Salidas: ${formatearKg(n.totalSalidas)} kg | Balance: ${formatearKg(n.balanceNeto)} kg</small>`;
                            }
                            return `
                                <span class="badge bg-light text-dark border mb-1">${rol}</span><br/>
                                <strong>${n.displayName}</strong><br/>
                                Masa Clasificada: <strong>${formatearKg(p.value)} kg</strong>${extra}
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
                            <small class="text-success">Verde: ${formatearKg(item.verde)} kg</small> |
                            <small class="text-warning">Amarillo: ${formatearKg(item.amarillo)} kg</small> |
                            <small class="text-danger">Rojo: ${formatearKg(item.rojo)} kg</small><br/>
                            Salidas: <strong>${formatearKg(item.totalSalidas)} kg</strong> | Balance: <strong>${formatearKg(item.balanceNeto)} kg</strong>
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







// /* ========================================================================
//    SITMAS - Módulo de Reportes de Trazabilidad: Tipos, Subtipos y Flujo Sankey
//    Consume: GET /api/ReportesTrazabilidad/PorMaterial
//    Incluye: 4 KPIs + Barras Apiladas por Tipo + Diagrama Sankey Full-Width (PDF Ready)
//    Archivo: Js/reportes_trazabilidad/reporte_traz_materiales.js
//    ======================================================================== */

// const ReporteTrazMaterialesModulo = (function () {
//     // 🔒 ESTADO PRIVADO
//     let estado = {
//         tipos: [],
//         subtipos: [],
//         modoSubtipos: 'sankey', // 'sankey' | 'bar'
//         chartApiladoTipos: null,
//         chartSubtipos: null
//     };

//     const URL_POR_MATERIAL = "https://localhost:44325/api/ReportesTrazabilidad/PorMaterial";

//     // Paleta institucional limpia para diferenciar familias de materiales en el Sankey
//     const PALETA_MATERIALES = [
//         '#0d6efd', '#198754', '#20c997', '#fd7e14',
//         '#6f42c1', '#0dcaf0', '#d63384', '#6610f2'
//     ];

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
//         ['chartApiladoTipos', 'chartSubtipos'].forEach(key => {
//             if (estado[key] && !estado[key].isDisposed()) {
//                 estado[key].dispose();
//             }
//             estado[key] = null;
//         });
//     };

//     // Normalizadores defensivos para garantizar compatibilidad con el DTO de C#
//     const normalizarTipos = function (listaRaw) {
//         return (listaRaw || []).map(item => {
//             const bruto = parseFloat(item.TotalPesoBrutoKg ?? item.PesoBrutoKg ?? 0);
//             const verde = parseFloat(item.TotalPesoVerdeKg ?? item.PesoVerdeKg ?? 0);
//             const amarillo = parseFloat(item.TotalPesoAmarilloKg ?? item.PesoAmarilloKg ?? 0);
//             const rojo = parseFloat(item.TotalPesoRojoKg ?? item.PesoRojoKg ?? 0);
//             const merma = Math.max(0, bruto - (verde + amarillo + rojo));
//             const pctVerde = item.PorcentajeAprovechamientoVerde !== undefined
//                 ? parseFloat(item.PorcentajeAprovechamientoVerde || 0)
//                 : (bruto > 0 ? (verde * 100 / bruto) : 0);

//             return {
//                 idTipoMaterial: item.IdTipoMaterial ?? 0,
//                 tipoMaterial: item.TipoMaterial || 'Sin Categoría',
//                 cantLotes: item.CantLotes ?? item.CantidadLotes ?? 0,
//                 bruto: bruto,
//                 verde: verde,
//                 amarillo: amarillo,
//                 rojo: rojo,
//                 merma: merma,
//                 pctVerde: pctVerde
//             };
//         });
//     };

//     const normalizarSubtipos = function (listaRaw) {
//         return (listaRaw || []).map(item => {
//             const verde = parseFloat(item.TotalPesoVerdeKg ?? item.PesoVerdeKg ?? 0);
//             const amarillo = parseFloat(item.TotalPesoAmarilloKg ?? item.PesoAmarilloKg ?? 0);
//             const rojo = parseFloat(item.TotalPesoRojoKg ?? item.PesoRojoKg ?? 0);
//             const clasificado = parseFloat(
//                 item.TotalClasificadoKg ?? item.PesoClasificadoKg ?? item.TotalPesoUtilKg ?? (verde + amarillo + rojo)
//             );
//             const egresado = parseFloat(item.TotalEgresadoKg ?? item.PesoEgresadoKg ?? 0);
//             const saldoSilo = item.SaldoSiloKg !== undefined
//                 ? parseFloat(item.SaldoSiloKg)
//                 : (item.StockDisponibleKg !== undefined ? parseFloat(item.StockDisponibleKg) : (clasificado - egresado));

//             return {
//                 idTipoMaterial: item.IdTipoMaterial ?? 0,
//                 tipoMaterial: item.TipoMaterial || 'Sin Categoría',
//                 idSubtipo: item.IdSubtipoMaterial ?? item.IdSubtipo ?? 0,
//                 subtipo: item.Subtipo || item.NombreSubtipo || 'Sin Subtipo',
//                 verde: verde,
//                 amarillo: amarillo,
//                 rojo: rojo,
//                 clasificado: clasificado,
//                 egresado: egresado,
//                 saldoSilo: saldoSilo
//             };
//         });
//     };

//     // 1. INICIALIZACIÓN DE LA ESTRUCTURA VISUAL (OPTIMIZADA PARA REPORTE PDF)
//     const inicializar = function (contenedorId) {
//         destruirGraficosActivos();
//         const contenedor = $(`#${contenedorId}`);

//         const htmlEstructura = `
//             <!-- NIVEL 1: ENCABEZADO Y FILTROS -->
//             <div class="row fade-in">
//                 <div class="col-12 d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
//                     <div>
//                         <h4 class="text-primary fw-bold mb-0">
//                             <i class="fas fa-cubes me-2"></i>Análisis por Tipos, Subtipos y Flujo de Clasificación
//                         </h4>
//                         <small class="text-muted">Rendimiento de recuperación por categoría de material y trazabilidad proporcional hacia subtipos</small>
//                     </div>

//                     <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded border">
//                         <label class="small fw-bold mb-0">Desde:</label>
//                         <input type="date" id="filtro-traz-mat-desde" class="form-control form-control-sm" style="width: auto;">

//                         <label class="small fw-bold mb-0 ms-1">Hasta:</label>
//                         <input type="date" id="filtro-traz-mat-hasta" class="form-control form-control-sm" style="width: auto;">

//                         <label class="small fw-bold mb-0 ms-1">Filtrar Tipo:</label>
//                         <select id="filtro-traz-mat-tipo" class="form-select form-select-sm fw-semibold" style="width: auto; min-width: 170px;">
//                             <option value="">Todos los Tipos</option>
//                         </select>

//                         <button id="btn-filtrar-traz-materiales" class="btn btn-primary btn-sm ms-1">
//                             <i class="fas fa-search"></i> Filtrar
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 2: 4 TARJETAS KPI DE MATERIALES Y SILOS -->
//             <div class="row g-3 mb-4 fade-in">
//                 <div class="col-12 col-sm-6 col-xl-3">
//                     <div class="card shadow-sm border-0 border-start border-primary border-4 h-100">
//                         <div class="card-body">
//                             <div class="d-flex justify-content-between align-items-center mb-2">
//                                 <span class="text-muted small fw-bold text-uppercase">Categoría Mayor Ingreso</span>
//                                 <span class="badge bg-primary bg-opacity-10 text-primary p-2"><i class="fas fa-crown fa-lg"></i></span>
//                             </div>
//                             <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-mat-top-tipo">—</h4>
//                             <small class="text-muted" id="kpi-mat-top-tipo-sub">0,00 kg brutos ingresados</small>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="col-12 col-sm-6 col-xl-3">
//                     <div class="card shadow-sm border-0 border-start border-success border-4 h-100">
//                         <div class="card-body">
//                             <div class="d-flex justify-content-between align-items-center mb-2">
//                                 <span class="text-muted small fw-bold text-uppercase">Subtipo Más Clasificado</span>
//                                 <span class="badge bg-success bg-opacity-10 text-success p-2"><i class="fas fa-layer-group fa-lg"></i></span>
//                             </div>
//                             <h4 class="fw-bold text-success mb-1 text-truncate" id="kpi-mat-top-subtipo">—</h4>
//                             <small class="text-muted" id="kpi-mat-top-subtipo-sub">0,00 kg clasificados</small>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="col-12 col-sm-6 col-xl-3">
//                     <div class="card shadow-sm border-0 border-start border-info border-4 h-100">
//                         <div class="card-body">
//                             <div class="d-flex justify-content-between align-items-center mb-2">
//                                 <span class="text-muted small fw-bold text-uppercase">Mejor Pureza (Verde)</span>
//                                 <span class="badge bg-info bg-opacity-10 text-info p-2"><i class="fas fa-award fa-lg"></i></span>
//                             </div>
//                             <h4 class="fw-bold text-dark mb-1 text-truncate" id="kpi-mat-mejor-pureza">—</h4>
//                             <small class="text-muted" id="kpi-mat-mejor-pureza-sub">0,0% aprovechamiento directo</small>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="col-12 col-sm-6 col-xl-3">
//                     <div class="card shadow-sm border-0 border-start border-warning border-4 h-100">
//                         <div class="card-body">
//                             <div class="d-flex justify-content-between align-items-center mb-2">
//                                 <span class="text-muted small fw-bold text-uppercase">Balance Neto Silos</span>
//                                 <span class="badge bg-warning bg-opacity-10 text-warning p-2"><i class="fas fa-warehouse fa-lg"></i></span>
//                             </div>
//                             <h4 class="fw-bold text-dark mb-1" id="kpi-mat-saldo-silos">0,00 kg</h4>
//                             <small class="text-muted" id="kpi-mat-saldo-silos-sub">Clasif.: 0,00 kg | Egres.: 0,00 kg</small>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 3: GRÁFICO 1 - CALIDAD DE RECUPERACIÓN POR TIPO DE MATERIAL -->
//             <div class="row g-4 mb-4 fade-in">
//                 <div class="col-12">
//                     <div class="card shadow-sm border-0">
//                         <div class="card-header bg-white border-bottom py-3">
//                             <h6 class="fw-bold text-dark mb-0">
//                                 <i class="fas fa-chart-bar text-primary me-2"></i>Calidad de Recuperación por Tipo de Material
//                             </h6>
//                             <small class="text-muted">Desglose apilado de kilos útiles (Verde), revisión (Amarillo), descarte (Rojo) y sin clasificar / merma</small>
//                         </div>
//                         <div class="card-body">
//                             <div id="msg-sin-datos-mat-tipos" class="alert alert-light text-center border my-4 p-4 d-none">
//                                 <i class="fas fa-cubes fa-2x text-muted mb-2"></i>
//                                 <p class="mb-0 text-muted">No hay ingresos por tipo de material en el rango seleccionado.</p>
//                             </div>
//                             <div id="echarts-mat-apilado-tipos" style="width: 100%; height: 390px;"></div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 4: GRÁFICO 2 - DIAGRAMA SANKEY PROTAGONISTA (ALTA VISIBILIDAD PARA PDF) -->
//             <div class="row g-4 fade-in">
//                 <div class="col-12">
//                     <div class="card shadow-sm border-0">
//                         <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
//                             <div>
//                                 <h6 class="fw-bold text-dark mb-0">
//                                     <i class="fas fa-project-diagram text-success me-2"></i>Clasificación de Stock: Tipos hacia Subtipos
//                                 </h6>
//                                 <small class="text-muted">Diagrama Sankey expandido de trazabilidad desde cada categoría principal hacia sus subtipos clasificados</small>
//                             </div>

//                             <div class="btn-group btn-group-sm" role="group" aria-label="Vista Subtipos">
//                                 <button type="button" class="btn btn-success btn-vista-subtipos active" data-vista="sankey">
//                                     <i class="fas fa-project-diagram me-1"></i> Flujo Sankey
//                                 </button>
//                                 <button type="button" class="btn btn-outline-success btn-vista-subtipos" data-vista="bar">
//                                     <i class="fas fa-align-left me-1"></i> Ranking Top 10
//                                 </button>
//                             </div>
//                         </div>
//                         <div class="card-body">
//                             <div id="msg-sin-datos-mat-subtipos" class="alert alert-light text-center border my-4 p-4 d-none">
//                                 <i class="fas fa-layer-group fa-2x text-muted mb-2"></i>
//                                 <p class="mb-0 text-muted">Sin subtipos clasificados para graficar en este período.</p>
//                             </div>
//                             <div id="echarts-mat-subtipos" style="width: 100%; height: 620px;"></div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;

//         contenedor.html(htmlEstructura);
//         enlazarEventos();
//         configurarFechasPorDefecto();
//     };

//     // 2. ENLACE DE EVENTOS DELEGADOS
//     const enlazarEventos = function () {
//         const principal = $('#contenedor-dinamico-reportes-trazabilidad');

//         // Botón Filtrar
//         principal.off('click', '#btn-filtrar-traz-materiales').on('click', '#btn-filtrar-traz-materiales', function () {
//             const desde = $('#filtro-traz-mat-desde').val();
//             const hasta = $('#filtro-traz-mat-hasta').val();

//             if (!desde || !hasta) {
//                 Swal.fire('Fechas requeridas', 'Por favor seleccioná ambas fechas.', 'warning');
//                 return;
//             }
//             if (desde > hasta) {
//                 Swal.fire('Rango inválido', 'La fecha "Desde" no puede ser mayor a "Hasta".', 'warning');
//                 return;
//             }

//             consultarPorMaterialApi(desde, hasta);
//         });

//         // Filtro local instantáneo por Tipo de Material (sin re-consultar la API)
//         principal.off('change', '#filtro-traz-mat-tipo').on('change', '#filtro-traz-mat-tipo', function () {
//             aplicarFiltroLocalYRenderizar();
//         });

//         // Switch Flujo Sankey <-> Ranking Top 10 Subtipos
//         principal.off('click', '.btn-vista-subtipos').on('click', '.btn-vista-subtipos', function () {
//             const nuevaVista = $(this).data('vista');
//             if (nuevaVista === estado.modoSubtipos) return;

//             estado.modoSubtipos = nuevaVista;
//             $('.btn-vista-subtipos').removeClass('btn-success active').addClass('btn-outline-success');
//             $(this).removeClass('btn-outline-success').addClass('btn-success active');

//             aplicarFiltroLocalYRenderizar();
//         });

//         // Responsividad limpia para ECharts
//         $(window).off('resize.trazMateriales').on('resize.trazMateriales', function () {
//             if (estado.chartApiladoTipos && !estado.chartApiladoTipos.isDisposed()) {
//                 estado.chartApiladoTipos.resize();
//             }
//             if (estado.chartSubtipos && !estado.chartSubtipos.isDisposed()) {
//                 estado.chartSubtipos.resize();
//             }
//         });
//     };

//     const configurarFechasPorDefecto = function () {
//         const hoy = new Date();
//         const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);

//         $('#filtro-traz-mat-hasta').val(hoy.toISOString().split('T')[0]);
//         $('#filtro-traz-mat-desde').val(primerDiaAnio.toISOString().split('T')[0]);

//         $('#btn-filtrar-traz-materiales').trigger('click');
//     };

//     // 3. CONSULTA A LA API C#
//     const consultarPorMaterialApi = function (fechaDesde, fechaHasta) {
//         const btn = $('#btn-filtrar-traz-materiales');
//         btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

//         $.ajax({
//             type: "GET",
//             url: URL_POR_MATERIAL,
//             data: { fechaDesde: fechaDesde, fechaHasta: fechaHasta },
//             success: function (respuesta) {
//                 const rawTipos = (respuesta && respuesta.PorTipo) ? respuesta.PorTipo : [];
//                 const rawSubtipos = (respuesta && (respuesta.PorSubtipo || respuesta.Subtipos || respuesta.BalanceSilos))
//                     ? (respuesta.PorSubtipo || respuesta.Subtipos || respuesta.BalanceSilos)
//                     : [];

//                 estado.tipos = normalizarTipos(rawTipos);
//                 estado.subtipos = normalizarSubtipos(rawSubtipos);

//                 actualizarSelectorTipos(estado.tipos);
//                 aplicarFiltroLocalYRenderizar();
//             },
//             error: function (err) {
//                 console.error("Error al obtener PorMaterial de Trazabilidad:", err);
//                 Swal.fire('Error de conexión', 'No se pudo obtener el reporte por materiales desde el servidor.', 'error');
//             },
//             complete: function () {
//                 btn.prop('disabled', false).html('<i class="fas fa-search"></i> Filtrar');
//             }
//         });
//     };

//     const actualizarSelectorTipos = function (listaTipos) {
//         const select = $('#filtro-traz-mat-tipo');
//         const seleccionPrevia = select.val();
//         select.html('<option value="">Todos los Tipos</option>');

//         [...listaTipos]
//             .filter(t => t.idTipoMaterial > 0)
//             .sort((a, b) => a.tipoMaterial.localeCompare(b.tipoMaterial))
//             .forEach(t => {
//                 select.append(`<option value="${t.idTipoMaterial}">${t.tipoMaterial}</option>`);
//             });

//         if (seleccionPrevia) {
//             select.val(seleccionPrevia);
//         }
//     };

//     const aplicarFiltroLocalYRenderizar = function () {
//         const idTipoFiltro = $('#filtro-traz-mat-tipo').val();

//         const tiposFiltrados = idTipoFiltro
//             ? estado.tipos.filter(t => String(t.idTipoMaterial) === String(idTipoFiltro))
//             : estado.tipos;

//         const subtiposFiltrados = idTipoFiltro
//             ? estado.subtipos.filter(s => String(s.idTipoMaterial) === String(idTipoFiltro))
//             : estado.subtipos;

//         renderizarKPIs(tiposFiltrados, subtiposFiltrados);
//         renderizarGraficoApiladoTipos(tiposFiltrados);
//         renderizarGraficoSubtipos(subtiposFiltrados, estado.modoSubtipos);
//     };

//     // 4. RENDERIZADO DE TARJETAS KPI
//     const renderizarKPIs = function (tipos, subtipos) {
//         if (tipos.length > 0) {
//             const topTipo = [...tipos].sort((a, b) => b.bruto - a.bruto)[0];
//             $('#kpi-mat-top-tipo').text(topTipo.tipoMaterial).attr('title', topTipo.tipoMaterial);
//             $('#kpi-mat-top-tipo-sub').text(`${formatearKg(topTipo.bruto)} kg (${topTipo.cantLotes} lotes)`);
//         } else {
//             $('#kpi-mat-top-tipo').text('Sin datos');
//             $('#kpi-mat-top-tipo-sub').text('0,00 kg brutos');
//         }

//         if (subtipos.length > 0) {
//             const topSub = [...subtipos].sort((a, b) => b.clasificado - a.clasificado)[0];
//             $('#kpi-mat-top-subtipo').text(topSub.subtipo).attr('title', `${topSub.tipoMaterial} - ${topSub.subtipo}`);
//             $('#kpi-mat-top-subtipo-sub').text(`${formatearKg(topSub.clasificado)} kg (${topSub.tipoMaterial})`);
//         } else {
//             $('#kpi-mat-top-subtipo').text('Sin datos');
//             $('#kpi-mat-top-subtipo-sub').text('0,00 kg clasificados');
//         }

//         const conIngreso = tipos.filter(t => t.bruto > 0);
//         if (conIngreso.length > 0) {
//             const mejorPureza = [...conIngreso].sort((a, b) => b.pctVerde - a.pctVerde)[0];
//             $('#kpi-mat-mejor-pureza').text(mejorPureza.tipoMaterial).attr('title', mejorPureza.tipoMaterial);
//             $('#kpi-mat-mejor-pureza-sub').text(`${formatearPorcentaje(mejorPureza.pctVerde)}% aprovechamiento directo`);
//         } else {
//             $('#kpi-mat-mejor-pureza').text('Sin datos');
//             $('#kpi-mat-mejor-pureza-sub').text('0,0% aprovechamiento directo');
//         }

//         const totalClasif = subtipos.reduce((acc, s) => acc + s.clasificado, 0);
//         const totalEgres = subtipos.reduce((acc, s) => acc + s.egresado, 0);
//         const saldoTotal = subtipos.reduce((acc, s) => acc + s.saldoSilo, 0);

//         $('#kpi-mat-saldo-silos').text(`${formatearKg(saldoTotal)} kg`);
//         $('#kpi-mat-saldo-silos-sub').text(`Clasif.: ${formatearKg(totalClasif)} kg | Egres.: ${formatearKg(totalEgres)} kg`);
//     };

//     // 5. GRÁFICO 1: BARRAS APILADAS POR TIPO DE MATERIAL
//     const renderizarGraficoApiladoTipos = function (tipos) {
//         if (typeof echarts === 'undefined') return;

//         const dom = document.getElementById('echarts-mat-apilado-tipos');
//         const msgSinDatos = $('#msg-sin-datos-mat-tipos');

//         const validos = (tipos || []).filter(t => t.bruto > 0 || (t.verde + t.amarillo + t.rojo) > 0);

//         if (validos.length === 0) {
//             $(dom).addClass('d-none');
//             msgSinDatos.removeClass('d-none');
//             return;
//         }

//         msgSinDatos.addClass('d-none');
//         $(dom).removeClass('d-none');

//         if (!estado.chartApiladoTipos || estado.chartApiladoTipos.isDisposed()) {
//             estado.chartApiladoTipos = echarts.init(dom);
//         }

//         const ordenados = [...validos].sort((a, b) => b.bruto - a.bruto);
//         const categorias = ordenados.map(t => t.tipoMaterial);

//         const option = {
//             tooltip: {
//                 trigger: 'axis',
//                 axisPointer: { type: 'shadow' }
//             },
//             legend: {
//                 top: 0,
//                 data: ['Útil (Verde)', 'Revisión (Amarillo)', 'Descarte (Rojo)', 'Sin Clasif. / Merma']
//             },
//             toolbox: {
//                 show: true,
//                 right: 15,
//                 feature: {
//                     saveAsImage: { show: true, title: 'Descargar PNG HD', pixelRatio: 2 }
//                 }
//             },
//             grid: {
//                 top: 48,
//                 bottom: 30,
//                 left: '3%',
//                 right: '3%',
//                 containLabel: true
//             },
//             xAxis: {
//                 type: 'category',
//                 data: categorias,
//                 axisLabel: {
//                     fontWeight: 'bold',
//                     interval: 0,
//                     rotate: categorias.length > 6 ? 18 : 0
//                 }
//             },
//             yAxis: {
//                 type: 'value',
//                 name: 'Kilogramos (kg)',
//                 axisLabel: {
//                     formatter: val => val.toLocaleString('es-AR') + ' kg'
//                 }
//             },
//             series: [
//                 {
//                     name: 'Útil (Verde)',
//                     type: 'bar',
//                     stack: 'masa',
//                     barMaxWidth: 55,
//                     itemStyle: { color: '#198754' },
//                     data: ordenados.map(t => Number(t.verde.toFixed(2)))
//                 },
//                 {
//                     name: 'Revisión (Amarillo)',
//                     type: 'bar',
//                     stack: 'masa',
//                     barMaxWidth: 55,
//                     itemStyle: { color: '#ffc107' },
//                     data: ordenados.map(t => Number(t.amarillo.toFixed(2)))
//                 },
//                 {
//                     name: 'Descarte (Rojo)',
//                     type: 'bar',
//                     stack: 'masa',
//                     barMaxWidth: 55,
//                     itemStyle: { color: '#dc3545' },
//                     data: ordenados.map(t => Number(t.rojo.toFixed(2)))
//                 },
//                 {
//                     name: 'Sin Clasif. / Merma',
//                     type: 'bar',
//                     stack: 'masa',
//                     barMaxWidth: 55,
//                     itemStyle: { color: '#adb5bd', borderRadius: [5, 5, 0, 0] },
//                     data: ordenados.map(t => Number(t.merma.toFixed(2)))
//                 }
//             ]
//         };

//         estado.chartApiladoTipos.setOption(option, true);
//     };

//     // 6. GRÁFICO 2: DIAGRAMA SANKEY EXPANDIDO (TIPO -> SUBTIPO) O RANKING TOP 10
//     const renderizarGraficoSubtipos = function (subtipos, modo) {
//         if (typeof echarts === 'undefined') return;

//         const dom = document.getElementById('echarts-mat-subtipos');
//         const msgSinDatos = $('#msg-sin-datos-mat-subtipos');

//         const validos = (subtipos || []).filter(s => s.clasificado > 0);

//         if (validos.length === 0) {
//             $(dom).addClass('d-none');
//             msgSinDatos.removeClass('d-none');
//             return;
//         }

//         msgSinDatos.addClass('d-none');
//         $(dom).removeClass('d-none');

//         if (!estado.chartSubtipos || estado.chartSubtipos.isDisposed()) {
//             estado.chartSubtipos = echarts.init(dom);
//         }

//         if (modo === 'sankey') {
//             const nodosMap = new Map();
//             const enlaces = [];
//             const colorPorTipo = new Map();
//             let idxColor = 0;

//             // Ordenamos de mayor a menor flujo para que las cañerías más gruesas queden arriba
//             const ordenados = [...validos].sort((a, b) => b.clasificado - a.clasificado);

//             ordenados.forEach(s => {
//                 if (!colorPorTipo.has(s.tipoMaterial)) {
//                     colorPorTipo.set(s.tipoMaterial, PALETA_MATERIALES[idxColor % PALETA_MATERIALES.length]);
//                     idxColor++;
//                 }
//                 const colorFamilia = colorPorTipo.get(s.tipoMaterial);

//                 // Prefijos internos T_ y S_ evitan ciclos DAG si un Tipo y Subtipo comparten nombre
//                 const idOrigen = `T_${s.tipoMaterial}`;
//                 const idDestino = `S_${s.tipoMaterial}_${s.subtipo}`;

//                 if (!nodosMap.has(idOrigen)) {
//                     nodosMap.set(idOrigen, {
//                         name: idOrigen,
//                         displayName: s.tipoMaterial,
//                         esOrigen: true,
//                         itemStyle: {
//                             color: colorFamilia,
//                             borderColor: colorFamilia
//                         }
//                     });
//                 }

//                 if (!nodosMap.has(idDestino)) {
//                     nodosMap.set(idDestino, {
//                         name: idDestino,
//                         displayName: s.subtipo,
//                         tipoPadre: s.tipoMaterial,
//                         esOrigen: false,
//                         verde: s.verde,
//                         amarillo: s.amarillo,
//                         rojo: s.rojo,
//                         saldoSilo: s.saldoSilo,
//                         itemStyle: {
//                             color: colorFamilia,
//                             borderColor: '#ffffff',
//                             borderWidth: 1.5
//                         }
//                     });
//                 }

//                 enlaces.push({
//                     source: idOrigen,
//                     target: idDestino,
//                     value: Number(s.clasificado.toFixed(2)),
//                     nombreOrigen: s.tipoMaterial,
//                     nombreDestino: s.subtipo,
//                     verde: s.verde,
//                     amarillo: s.amarillo,
//                     rojo: s.rojo
//                 });
//             });

//             const nodosArray = Array.from(nodosMap.values());

//             const optionSankey = {
//                 tooltip: {
//                     trigger: 'item',
//                     triggerOn: 'mousemove',
//                     formatter: function (p) {
//                         if (p.dataType === 'edge') {
//                             const e = p.data;
//                             return `
//                                 <strong>${e.nombreOrigen}</strong> <i class="fas fa-arrow-right mx-1 text-muted"></i> <strong>${e.nombreDestino}</strong><br/>
//                                 Flujo Clasificado: <strong>${formatearKg(e.value)} kg</strong><br/>
//                                 <small class="text-success">Verde: ${formatearKg(e.verde)} kg</small> |
//                                 <small class="text-warning">Amarillo: ${formatearKg(e.amarillo)} kg</small>
//                             `;
//                         } else {
//                             const n = p.data;
//                             const rol = n.esOrigen ? 'Categoría Principal' : `Subtipo de ${n.tipoPadre}`;
//                             return `
//                                 <span class="badge bg-light text-dark border mb-1">${rol}</span><br/>
//                                 <strong>${n.displayName}</strong><br/>
//                                 Masa Total: <strong>${formatearKg(p.value)} kg</strong>
//                             `;
//                         }
//                     }
//                 },
//                 toolbox: {
//                     show: true,
//                     right: 15,
//                     feature: {
//                         saveAsImage: { show: true, title: 'Descargar Sankey PNG HD', pixelRatio: 2 }
//                     }
//                 },
//                 series: [
//                     {
//                         type: 'sankey',
//                         left: '3%',
//                         right: '26%',
//                         top: 25,
//                         bottom: 25,
//                         nodeWidth: 22,
//                         nodeGap: 16,
//                         draggable: false,
//                         emphasis: {
//                             focus: 'adjacency'
//                         },
//                         label: {
//                             color: '#212529',
//                             fontWeight: 'bold',
//                             fontSize: 13,
//                             formatter: function (p) {
//                                 return `${p.data.displayName} — ${formatearKg(p.value)} kg`;
//                             }
//                         },
//                         lineStyle: {
//                             color: 'source',
//                             curveness: 0.5,
//                             opacity: 0.42
//                         },
//                         data: nodosArray,
//                         links: enlaces
//                     }
//                 ]
//             };

//             estado.chartSubtipos.setOption(optionSankey, true);
//         } else {
//             // Vista Ranking Horizontal Top 10 Subtipos
//             const top10 = [...validos]
//                 .sort((a, b) => b.clasificado - a.clasificado)
//                 .slice(0, 10)
//                 .reverse();

//             const optionBar = {
//                 tooltip: {
//                     trigger: 'axis',
//                     axisPointer: { type: 'shadow' },
//                     formatter: function (params) {
//                         const p = params[0];
//                         const item = top10[p.dataIndex];
//                         return `
//                             <strong>${item.subtipo}</strong> (${item.tipoMaterial})<br/>
//                             Total Clasificado: <strong>${formatearKg(item.clasificado)} kg</strong><br/>
//                             Saldo en Silo: <strong>${formatearKg(item.saldoSilo)} kg</strong>
//                         `;
//                     }
//                 },
//                 toolbox: {
//                     show: true,
//                     right: 15,
//                     feature: {
//                         saveAsImage: { show: true, title: 'Descargar PNG HD', pixelRatio: 2 }
//                     }
//                 },
//                 grid: {
//                     top: 30,
//                     bottom: 25,
//                     left: '3%',
//                     right: '14%',
//                     containLabel: true
//                 },
//                 xAxis: {
//                     type: 'value',
//                     axisLabel: {
//                         formatter: val => val.toLocaleString('es-AR') + ' kg'
//                     }
//                 },
//                 yAxis: {
//                     type: 'category',
//                     data: top10.map(s => s.subtipo),
//                     axisLabel: { fontWeight: 'bold', fontSize: 12 }
//                 },
//                 series: [
//                     {
//                         name: 'Clasificado (kg)',
//                         type: 'bar',
//                         barMaxWidth: 32,
//                         itemStyle: {
//                             color: '#198754',
//                             borderRadius: [0, 5, 5, 0]
//                         },
//                         label: {
//                             show: true,
//                             position: 'right',
//                             fontWeight: 'bold',
//                             formatter: p => formatearKg(p.value) + ' kg'
//                         },
//                         data: top10.map(s => Number(s.clasificado.toFixed(2)))
//                     }
//                 ]
//             };

//             estado.chartSubtipos.setOption(optionBar, true);
//         }
//     };

//     // API Pública del Módulo
//     return {
//         cargarEn: inicializar
//     };
// })();
