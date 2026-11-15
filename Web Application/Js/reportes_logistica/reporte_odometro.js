/* ========================================================================
   SITMAS - Módulo de Reportes: Control de Odómetro (Completo)
   Incluye: KPIs Segmentados + Timeline (Diario/Mensual) + Choferes (Dona/Parlamento)
   Archivo: reporte_odometro.js
   ======================================================================== */

const ReporteOdometroModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        datosCrudos: [],
        registrosValidos: [],
        granularidadTimeline: 'mensual', // 'diaria' (Supervisor) | 'mensual' (Gerencia)
        modoGraficoChofer: 'dona',       // 'dona' | 'parlamento'
        chartTimelineOdometro: null,
        chartChoferesParliament: null
    };

    const URL_REPORTE_ODOMETRO = "https://localhost:44325/api/ReportesLogistica/Odometro";

    const MESES_LARGOS = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const MESES_CORTOS = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];

    const PALETA_CHOFERES = [
        '#0d6efd', '#198754', '#fd7e14', '#6f42c1', '#20c997',
        '#d63384', '#0dcaf0', '#ffc107', '#6610f2', '#adb5bd'
    ];

    // Helpers de formateo seguro (evitan desfases de zona horaria UTC)
    const formatearKm = function (valor) {
        const num = parseFloat(valor || 0);
        return num.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatearFechaIso = function (fechaIso, corta = false) {
        if (!fechaIso || !fechaIso.includes('-')) return fechaIso;
        const [anio, mes, dia] = fechaIso.split('-');
        return corta ? `${dia}/${mes}` : `${dia}/${mes}/${anio}`;
    };

    const formatearMesLegible = function (mesIso, corto = false) {
        if (!mesIso || !mesIso.includes('-')) return mesIso;
        const [anio, mesStr] = mesIso.split('-');
        const idx = parseInt(mesStr, 10) - 1;
        const nombre = corto ? MESES_CORTOS[idx] : MESES_LARGOS[idx];
        return nombre ? `${nombre} ${anio}` : mesIso;
    };

    // 1. INICIALIZACIÓN DE LA ESTRUCTURA VISUAL
    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <!-- ENCABEZADO Y FILTROS GLOBALES DE FECHA -->
            <div class="row fade-in">
                <div class="col-12 d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h4 class="text-primary fw-bold mb-0">
                            <i class="fas fa-tachometer-alt me-2"></i>Control de Odómetro, Flota y Personal
                        </h4>
                        <small class="text-muted">Auditoría operativa y gerencial de kilometraje real, desvíos y cobertura por chofer</small>
                    </div>

                    <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded border">
                        <label class="small fw-bold mb-0">Desde:</label>
                        <input type="date" id="filtro-odom-desde" class="form-control form-control-sm" style="width: auto;">

                        <label class="small fw-bold mb-0 ms-2">Hasta:</label>
                        <input type="date" id="filtro-odom-hasta" class="form-control form-control-sm" style="width: auto;">

                        <button id="btn-generar-reporte-odometro" class="btn btn-primary btn-sm ms-2">
                            <i class="fas fa-search"></i> Filtrar
                        </button>
                    </div>
                </div>
            </div>

            <!-- SEGMENTADOR (SLICER) PARA TARJETAS KPI -->
            <div class="row mb-3 fade-in">
                <div class="col-12 d-flex flex-wrap justify-content-between align-items-center bg-white p-3 rounded shadow-sm border">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-primary"><i class="fas fa-filter"></i></span>
                        <span class="fw-bold text-dark small text-uppercase">Alcance de los Indicadores (KPIs):</span>
                    </div>
                    <div class="d-flex align-items-center gap-2 mt-2 mt-sm-0">
                        <label for="select-odom-kpi-vehiculo" class="small text-muted fw-bold mb-0">Visualizar unidad:</label>
                        <select id="select-odom-kpi-vehiculo" class="form-select form-select-sm fw-bold border-primary" style="min-width: 230px;">
                            <option value="TODOS">Toda la Flota (Consolidado)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- FILA SUPERIOR: 4 TARJETAS KPI -->
            <div class="row g-3 mb-4 fade-in" id="fila-kpis-odometro">
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-primary border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Km Reales Recorridos</span>
                                <span class="badge bg-primary bg-opacity-10 text-primary p-2"><i class="fas fa-road fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-dark mb-1" id="kpi-odom-total-reales">0,00 km</h3>
                            <small class="text-muted" id="kpi-odom-sub-validos">Sobre 0 lecturas cerradas</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" id="card-kpi-desvio">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Desvío vs. Planificado</span>
                                <span class="badge bg-warning bg-opacity-10 text-warning p-2"><i class="fas fa-balance-scale fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold mb-1" id="kpi-odom-desvio">0,00 km</h3>
                            <small class="text-muted" id="kpi-odom-sub-desvio">Diferencia acumulada en HDR</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-info border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Km Internos (Sin HDR)</span>
                                <span class="badge bg-info bg-opacity-10 text-info p-2"><i class="fas fa-exchange-alt fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-dark mb-1" id="kpi-odom-internos">0,00 km</h3>
                            <small class="text-muted" id="kpi-odom-sub-internos">0% del recorrido total</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-4 h-100" id="card-kpi-abiertos">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Odómetros Sin Cerrar</span>
                                <span class="badge bg-warning bg-opacity-10 text-warning p-2"><i class="fas fa-exclamation-circle fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold mb-1" id="kpi-odom-abiertos">0</h3>
                            <small class="text-muted" id="kpi-odom-sub-abiertos">Lecturas pendientes de cierre</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- GRÁFICO 1 (MIX-TIMELINE-FINANCE): CON SELECTOR DIARIO (SUPERVISOR) VS MENSUAL (GERENCIA) -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-film text-primary me-2"></i>Evolución de Kilómetros por Unidad y Composición
                                </h6>
                                <small class="text-muted">Alterná entre lectura diaria (supervisión operativa) y mensual (síntesis gerencial)</small>
                            </div>

                            <!-- Selector de Granularidad -->
                            <div class="btn-group btn-group-sm" role="group" aria-label="Granularidad temporal">
                                <button type="button" class="btn btn-outline-primary btn-granularidad-odom" data-modo="diaria">
                                    <i class="fas fa-calendar-day me-1"></i> Vista Diaria (Supervisor)
                                </button>
                                <button type="button" class="btn btn-primary btn-granularidad-odom active" data-modo="mensual">
                                    <i class="fas fa-calendar-alt me-1"></i> Vista Mensual (Gerencia)
                                </button>
                            </div>
                        </div>

                        <div class="card-body">
                            <div id="mensaje-sin-datos-odom-barras" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-tachometer-alt fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No hay lecturas de odómetro cerradas en el período seleccionado.</p>
                            </div>

                            <div id="echarts-odometro-vehiculos" style="width: 100%; height: 480px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- GRÁFICO 2 (PIE-PARLIAMENT-TRANSITION): COBERTURA DE KILÓMETROS POR CHOFER -->
            <div class="row g-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-users text-success me-2"></i>Cobertura de Kilómetros por Chofer
                                </h6>
                                <small class="text-muted">Distribución proporcional de distancia recorrida por el personal según unidad</small>
                            </div>

                            <!-- Controles del Gráfico de Choferes: Filtro de Vehículo + Transición Dona / Parlamento -->
                            <div class="d-flex flex-wrap align-items-center gap-2">
                                <div class="d-flex align-items-center gap-1">
                                    <label for="select-odom-chofer-vehiculo" class="small fw-bold text-muted mb-0">Unidad:</label>
                                    <select id="select-odom-chofer-vehiculo" class="form-select form-select-sm fw-bold border-success" style="min-width: 190px;">
                                        <option value="TODOS">Todos los Vehículos</option>
                                    </select>
                                </div>

                                <div class="btn-group btn-group-sm" role="group" aria-label="Tipo de gráfico choferes">
                                    <button type="button" class="btn btn-success btn-modo-chofer active" data-vista="dona">
                                        <i class="fas fa-chart-pie me-1"></i> Dona
                                    </button>
                                    <button type="button" class="btn btn-outline-success btn-modo-chofer" data-vista="parlamento">
                                        <i class="fas fa-braille me-1"></i> Parlamento
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="card-body">
                            <div id="mensaje-sin-datos-odom-choferes" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-user-slash fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No hay kilómetros registrados para esta unidad en el período seleccionado.</p>
                            </div>

                            <div id="echarts-odometro-choferes" style="width: 100%; height: 420px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        contenedor.html(htmlEstructura);
        enlazarEventos();
        configurarFechasPorDefecto();
    };

    // 2. ENLACE DE EVENTOS
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-reportes-logistica');

        // Botón Filtrar por fechas (Consulta a API)
        principal.off('click', '#btn-generar-reporte-odometro').on('click', '#btn-generar-reporte-odometro', function () {
            const desde = $('#filtro-odom-desde').val();
            const hasta = $('#filtro-odom-hasta').val();

            if (!desde || !hasta) {
                Swal.fire('Fechas requeridas', 'Por favor seleccioná ambas fechas.', 'warning');
                return;
            }
            if (desde > hasta) {
                Swal.fire('Rango inválido', 'La fecha "Desde" no puede ser mayor a "Hasta".', 'warning');
                return;
            }

            consultarDatosApi(desde, hasta);
        });

        // Slicer de KPIs por unidad
        principal.off('change', '#select-odom-kpi-vehiculo').on('change', '#select-odom-kpi-vehiculo', function () {
            procesarYRenderizarKPIs(estado.datosCrudos, $(this).val());
        });

        // Switch Granularidad Timeline (Diaria vs Mensual)
        principal.off('click', '.btn-granularidad-odom').on('click', '.btn-granularidad-odom', function () {
            const nuevoModo = $(this).data('modo');
            if (nuevoModo === estado.granularidadTimeline) return;

            estado.granularidadTimeline = nuevoModo;

            $('.btn-granularidad-odom').removeClass('btn-primary active').addClass('btn-outline-primary');
            $(this).removeClass('btn-outline-primary').addClass('btn-primary active');

            const datosTimeline = construirEstructuraTimeline(estado.registrosValidos, estado.granularidadTimeline);
            renderizarGraficoTimelineFinance(datosTimeline);
        });

        // Filtro de Vehículo para el Gráfico de Choferes
        principal.off('change', '#select-odom-chofer-vehiculo').on('change', '#select-odom-chofer-vehiculo', function () {
            renderizarGraficoChoferes();
        });

        // Switch Transición Dona <-> Parlamento (Universal Transition)
        principal.off('click', '.btn-modo-chofer').on('click', '.btn-modo-chofer', function () {
            const nuevaVista = $(this).data('vista');
            if (nuevaVista === estado.modoGraficoChofer) return;

            estado.modoGraficoChofer = nuevaVista;

            $('.btn-modo-chofer').removeClass('btn-success active').addClass('btn-outline-success');
            $(this).removeClass('btn-outline-success').addClass('btn-success active');

            renderizarGraficoChoferes();
        });

        // Responsividad limpia para ambos gráficos de ECharts
        $(window).off('resize.odometro').on('resize.odometro', function () {
            if (estado.chartTimelineOdometro) {
                estado.chartTimelineOdometro.resize();
            }
            if (estado.chartChoferesParliament) {
                estado.chartChoferesParliament.resize();
                // Si está en vista parlamento, recalculamos coordenadas de asientos al nuevo ancho
                if (estado.modoGraficoChofer === 'parlamento') {
                    renderizarGraficoChoferes();
                }
            }
        });
    };

    const configurarFechasPorDefecto = function () {
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), 0, 1);

        $('#filtro-odom-hasta').val(hoy.toISOString().split('T')[0]);
        $('#filtro-odom-desde').val(primerDiaMes.toISOString().split('T')[0]);

        $('#btn-generar-reporte-odometro').trigger('click');
    };

    // 3. CONSULTA A LA API C#
    const consultarDatosApi = function (fechaDesde, fechaHasta) {
        const btn = $('#btn-generar-reporte-odometro');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

        $.ajax({
            type: "GET",
            url: URL_REPORTE_ODOMETRO,
            data: { fechaDesde: fechaDesde, fechaHasta: fechaHasta },
            success: function (respuesta) {
                estado.datosCrudos = respuesta || [];

                // Higiene de datos: solo FinalOdom > 0
                estado.registrosValidos = estado.datosCrudos.filter(r =>
                    r.FinalOdom !== null &&
                    r.FinalOdom !== undefined &&
                    parseFloat(r.FinalOdom) > 0
                );

                // 1. Poblar selectores de vehículos (para KPIs y para Gráfico Choferes)
                poblarSelectoresVehiculos(estado.datosCrudos);

                // 2. Renderizar KPIs
                procesarYRenderizarKPIs(estado.datosCrudos, $('#select-odom-kpi-vehiculo').val() || 'TODOS');

                // 3. Renderizar Timeline (Diario o Mensual según botón activo)
                const datosTimeline = construirEstructuraTimeline(estado.registrosValidos, estado.granularidadTimeline);
                renderizarGraficoTimelineFinance(datosTimeline);

                // 4. Renderizar Gráfico de Choferes (Dona / Parlamento)
                renderizarGraficoChoferes();
            },
            error: function (err) {
                console.error("Error al obtener reporte de odómetro:", err);
                Swal.fire('Error de conexión', 'No se pudieron obtener los datos de odómetro.', 'error');
            },
            complete: function () {
                btn.prop('disabled', false).html('<i class="fas fa-search"></i> Buscar');
            }
        });
    };

    const poblarSelectoresVehiculos = function (listaCompleta) {
        const patentesUnicas = [...new Set(listaCompleta.map(r => r.Vehiculo || 'Sin Patente'))].sort();

        // Selector 1: KPIs
        const selectKpi = $('#select-odom-kpi-vehiculo');
        const prevKpi = selectKpi.val();
        selectKpi.empty().append('<option value="TODOS">Toda la Flota (Consolidado)</option>');
        patentesUnicas.forEach(p => selectKpi.append(`<option value="${p}">Unidad: ${p}</option>`));
        selectKpi.val(prevKpi && patentesUnicas.includes(prevKpi) ? prevKpi : 'TODOS');

        // Selector 2: Gráfico de Choferes
        const selectChofer = $('#select-odom-chofer-vehiculo');
        const prevChofer = selectChofer.val();
        selectChofer.empty().append('<option value="TODOS">Todos los Vehículos</option>');
        patentesUnicas.forEach(p => selectChofer.append(`<option value="${p}">Unidad: ${p}</option>`));
        selectChofer.val(prevChofer && patentesUnicas.includes(prevChofer) ? prevChofer : 'TODOS');
    };

    // 4. CÁLCULO Y RENDERIZADO DE TARJETAS KPI
    const procesarYRenderizarKPIs = function (listaCompleta, patenteFiltro = 'TODOS') {
        const universo = patenteFiltro === 'TODOS'
            ? listaCompleta
            : listaCompleta.filter(r => (r.Vehiculo || 'Sin Patente') === patenteFiltro);

        const validos = universo.filter(r =>
            r.FinalOdom !== null && r.FinalOdom !== undefined && parseFloat(r.FinalOdom) > 0
        );

        const abiertos = universo.filter(r =>
            r.FinalOdom === null || r.FinalOdom === undefined || parseFloat(r.FinalOdom) === 0
        );

        const totalKmReales = validos.reduce((acc, r) => acc + parseFloat(r.KmReales || 0), 0);

        const desvioGlobal = validos
            .filter(r => r.Id_HojaRuta !== null)
            .reduce((acc, r) => acc + parseFloat(r.DesvioKm || 0), 0);

        const kmInternos = validos
            .filter(r => r.Id_HojaRuta === null)
            .reduce((acc, r) => acc + parseFloat(r.KmReales || 0), 0);

        const porcentajeInternos = totalKmReales > 0
            ? ((kmInternos / totalKmReales) * 100).toFixed(1)
            : 0;

        $('#kpi-odom-total-reales').text(`${formatearKm(totalKmReales)} km`);
        $('#kpi-odom-sub-validos').text(`Sobre ${validos.length} ${validos.length === 1 ? 'lectura cerrada' : 'lecturas cerradas'}`);

        const hayDesvio = Math.abs(desvioGlobal) > 0.009;
        const signoDesvio = desvioGlobal > 0 ? '+' : '';

        $('#kpi-odom-desvio')
            .text(`${signoDesvio}${formatearKm(desvioGlobal)} km`)
            .removeClass('text-warning text-success text-danger')
            .addClass(hayDesvio ? 'text-warning' : 'text-success');

        $('#card-kpi-desvio')
            .removeClass('border-warning border-success border-danger')
            .addClass(hayDesvio ? 'border-warning' : 'border-success');

        $('#kpi-odom-sub-desvio').text(
            hayDesvio ? 'Alerta: diferencia detectada respecto a HDR' : 'Sin desvíos respecto a lo planificado'
        );

        $('#kpi-odom-internos').text(`${formatearKm(kmInternos)} km`);
        $('#kpi-odom-sub-internos').text(`${porcentajeInternos}% del recorrido total`);

        const cantAbiertos = abiertos.length;
        $('#kpi-odom-abiertos')
            .text(cantAbiertos)
            .removeClass('text-warning text-success')
            .addClass(cantAbiertos > 0 ? 'text-warning' : 'text-success');

        $('#card-kpi-abiertos')
            .removeClass('border-warning border-success')
            .addClass(cantAbiertos > 0 ? 'border-warning' : 'border-success');

        $('#kpi-odom-sub-abiertos').text(
            cantAbiertos > 0 ? 'Excluidos del cálculo de distancias' : 'Todas las lecturas fueron cerradas'
        );
    };

    // 5. GRÁFICO 1: MIX-TIMELINE-FINANCE (SOPORTA GRANULARIDAD DIARIA Y MENSUAL)
    const construirEstructuraTimeline = function (registrosValidos, granularidad) {
        if (!registrosValidos || registrosValidos.length === 0) {
            return { periodos: [], patentes: [], frames: [], maximoEjeY: 100 };
        }

        const patentesUnicas = [...new Set(registrosValidos.map(r => r.Vehiculo || 'Sin Patente'))].sort();

        // Extraemos claves de tiempo según la vista elegida: "YYYY-MM-DD" (diaria) o "YYYY-MM" (mensual)
        const extraerClavePeriodo = (fechaIso) => granularidad === 'diaria' ? fechaIso : fechaIso.substring(0, 7);

        const periodosOrdenados = [...new Set(registrosValidos.map(r => extraerClavePeriodo(r.FechaISO)))].sort();

        let maximoGlobalKm = 0;

        const frames = periodosOrdenados.map(periodo => {
            const registrosPeriodo = registrosValidos.filter(r => extraerClavePeriodo(r.FechaISO) === periodo);

            const serieEstimados = [];
            const serieReales = [];

            patentesUnicas.forEach(patente => {
                const regsUnidad = registrosPeriodo.filter(r => (r.Vehiculo || 'Sin Patente') === patente);
                const sumEst = regsUnidad.reduce((acc, r) => acc + parseFloat(r.KmEstimadosHDR || 0), 0);
                const sumReal = regsUnidad.reduce((acc, r) => acc + parseFloat(r.KmReales || 0), 0);

                if (sumEst > maximoGlobalKm) maximoGlobalKm = sumEst;
                if (sumReal > maximoGlobalKm) maximoGlobalKm = sumReal;

                serieEstimados.push(Number(sumEst.toFixed(2)));
                serieReales.push(Number(sumReal.toFixed(2)));
            });

            const kmConHdr = registrosPeriodo
                .filter(r => r.Id_HojaRuta !== null)
                .reduce((acc, r) => acc + parseFloat(r.KmReales || 0), 0);

            const kmInternos = registrosPeriodo
                .filter(r => r.Id_HojaRuta === null)
                .reduce((acc, r) => acc + parseFloat(r.KmReales || 0), 0);

            const tituloPeriodo = granularidad === 'diaria'
                ? `Actividad del ${formatearFechaIso(periodo, false)}`
                : `Resumen de ${formatearMesLegible(periodo, false)}`;

            return {
                title: {
                    text: tituloPeriodo,
                    left: 'left',
                    textStyle: { fontSize: 16, fontWeight: 'bold', color: '#212529' }
                },
                series: [
                    { data: serieEstimados },
                    { data: serieReales },
                    {
                        data: [
                            { name: 'Con Hoja de Ruta', value: Number(kmConHdr.toFixed(2)) },
                            { name: 'Interno (Sin HDR)', value: Number(kmInternos.toFixed(2)) }
                        ]
                    }
                ]
            };
        });

        const maximoEjeY = maximoGlobalKm > 0 ? Math.ceil(maximoGlobalKm * 1.15) : 100;

        return {
            periodos: periodosOrdenados,
            patentes: patentesUnicas,
            frames: frames,
            maximoEjeY: maximoEjeY
        };
    };

    const renderizarGraficoTimelineFinance = function (datosTimeline) {
        if (typeof echarts === 'undefined') return;

        const contenedorGrafico = document.getElementById('echarts-odometro-vehiculos');
        const msgSinDatos = $('#mensaje-sin-datos-odom-barras');

        if (!datosTimeline.periodos || datosTimeline.periodos.length === 0) {
            $(contenedorGrafico).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(contenedorGrafico).removeClass('d-none');

        if (!estado.chartTimelineOdometro) {
            estado.chartTimelineOdometro = echarts.init(contenedorGrafico);
        }

        const esDiaria = estado.granularidadTimeline === 'diaria';

        const option = {
            baseOption: {
                timeline: {
                    axisType: 'category',
                    autoPlay: false,
                    playInterval: 1800,
                    currentIndex: datosTimeline.periodos.length - 1,
                    bottom: 5,
                    data: datosTimeline.periodos,
                    label: {
                        formatter: function (valor) {
                            return esDiaria ? formatearFechaIso(valor, true) : formatearMesLegible(valor, true);
                        }
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' }
                },
                legend: {
                    left: 'center',
                    top: 5,
                    data: ['Km Estimados (HDR)', 'Km Reales (Odómetro)']
                },
                toolbox: {
                    show: true,
                    right: 15,
                    top: 0,
                    feature: {
                        dataView: { show: true, title: 'Ver Datos', readOnly: true, lang: ['Datos del Período', 'Cerrar', 'Actualizar'] },
                        saveAsImage: { show: true, title: 'Descargar PNG' }
                    }
                },
                calculable: true,
                grid: {
                    top: 135,
                    bottom: 85,
                    left: '4%',
                    right: '4%',
                    containLabel: true
                },
                xAxis: [
                    {
                        type: 'category',
                        axisLabel: { interval: 0, fontWeight: 'bold' },
                        data: datosTimeline.patentes,
                        splitLine: { show: false }
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: 'Kilómetros (km)',
                        max: datosTimeline.maximoEjeY,
                        axisLabel: { formatter: '{value} km' }
                    }
                ],
                series: [
                    {
                        name: 'Km Estimados (HDR)',
                        type: 'bar',
                        barGap: '15%',
                        itemStyle: { color: '#6c757d', borderRadius: [5, 5, 0, 0] },
                        emphasis: { focus: 'series' }
                    },
                    {
                        name: 'Km Reales (Odómetro)',
                        type: 'bar',
                        itemStyle: { color: '#0d6efd', borderRadius: [5, 5, 0, 0] },
                        emphasis: { focus: 'series' }
                    },
                    {
                        name: 'Composición de Uso',
                        type: 'pie',
                        center: ['84%', '20%'],
                        radius: ['10%', '20%'],
                        z: 100,
                        color: ['#198754', '#0dcaf0'],
                        tooltip: {
                            trigger: 'item',
                            formatter: '<strong>{b}</strong><br/>{c} km ({d}%)'
                        },
                        label: {
                            formatter: '{b}: {d}%',
                            fontSize: 11,
                            fontWeight: 'bold'
                        }
                    }
                ]
            },
            options: datosTimeline.frames
        };

        estado.chartTimelineOdometro.setOption(option, true);
    };

    // 6. GRÁFICO 2: COBERTURA POR CHOFER (TRANSICIÓN DONA <-> PARLAMENTO)
    const agruparKmPorChofer = function (registrosValidos, patenteFiltro) {
        const filtrados = patenteFiltro === 'TODOS'
            ? registrosValidos
            : registrosValidos.filter(r => (r.Vehiculo || 'Sin Patente') === patenteFiltro);

        const mapa = filtrados.reduce((acc, r) => {
            const km = parseFloat(r.KmReales || 0);
            if (km <= 0) return acc;

            // Etiquetamos claramente los viajes internos sin HDR para reconciliar el 100% de los kms
            let nombreChofer = (r.ChoferNombreCompleto || "").trim();
            if (!nombreChofer || nombreChofer === "null" || nombreChofer.includes('No aplica')) {
                nombreChofer = 'Sin Asignar (Mov. Interno)';
            }

            acc[nombreChofer] = (acc[nombreChofer] || 0) + km;
            return acc;
        }, {});

        const totalKm = Object.values(mapa).reduce((a, b) => a + b, 0);

        const listaOrdenada = Object.keys(mapa)
            .map((nombre, index) => {
                const valor = Number(mapa[nombre].toFixed(2));
                const porcentaje = totalKm > 0 ? ((valor / totalKm) * 100).toFixed(1) : 0;
                return {
                    name: nombre,
                    value: valor,
                    porcentaje: porcentaje,
                    groupId: nombre,
                    itemStyle: {
                        color: PALETA_CHOFERES[index % PALETA_CHOFERES.length]
                    }
                };
            })
            .sort((a, b) => b.value - a.value);

        return { datos: listaOrdenada, totalKm: totalKm };
    };

    // Calcula la geometría semicircular de asientos para la vista Parlamento
    const construirAsientosParlamento = function (datosChoferes, totalKm, ancho, alto) {
        const cx = ancho * 0.5;
        const cy = alto * 0.78; // Bajamos el centro para que el arco superior quede centrado
        const radioMax = Math.min(ancho * 0.44, alto * 0.62);
        const radioMin = radioMax * 0.42;
        const numFilas = 4;
        const totalAsientosObjetivo = 64;

        const radiosFilas = [];
        for (let f = 0; f < numFilas; f++) {
            radiosFilas.push(radioMin + (f / (numFilas - 1)) * (radioMax - radioMin));
        }
        const sumaRadios = radiosFilas.reduce((a, b) => a + b, 0);

        // Generamos todos los puntos del arco semicircular (-PI a 0)
        let asientos = [];
        radiosFilas.forEach(r => {
            const cantEnFila = Math.max(4, Math.round((r / sumaRadios) * totalAsientosObjetivo));
            for (let j = 0; j < cantEnFila; j++) {
                const angulo = cantEnFila === 1 ? -Math.PI / 2 : -Math.PI + (j / (cantEnFila - 1)) * Math.PI;
                asientos.push({
                    x: cx + r * Math.cos(angulo),
                    y: cy + r * Math.sin(angulo),
                    angulo: angulo
                });
            }
        });

        // Ordenamos de izquierda (-PI) a derecha (0) para agrupar por sector
        asientos.sort((a, b) => a.angulo - b.angulo);

        // Asignamos cada asiento al chofer correspondiente de forma proporcional exacta
        const radioPunto = Math.max(5, Math.min(10, (radioMax - radioMin) / (numFilas * 2.6)));
        const datosPuntos = [];
        let acumuladoKm = 0;
        let indiceInicio = 0;

        datosChoferes.forEach((chofer, idx) => {
            acumuladoKm += chofer.value;
            const indiceFin = (idx === datosChoferes.length - 1)
                ? asientos.length
                : Math.round((acumuladoKm / totalKm) * asientos.length);

            for (let k = indiceInicio; k < indiceFin; k++) {
                datosPuntos.push({
                    name: chofer.name,
                    groupId: chofer.groupId,
                    value: chofer.value,
                    porcentaje: chofer.porcentaje,
                    x: asientos[k].x,
                    y: asientos[k].y,
                    rDot: radioPunto,
                    color: chofer.itemStyle.color
                });
            }
            indiceInicio = indiceFin;
        });

        return datosPuntos;
    };

    const renderizarGraficoChoferes = function () {
        if (typeof echarts === 'undefined') return;

        const contenedor = document.getElementById('echarts-odometro-choferes');
        const msgSinDatos = $('#mensaje-sin-datos-odom-choferes');
        const patenteFiltro = $('#select-odom-chofer-vehiculo').val() || 'TODOS';

        const { datos, totalKm } = agruparKmPorChofer(estado.registrosValidos, patenteFiltro);

        if (!datos || datos.length === 0 || totalKm <= 0) {
            $(contenedor).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(contenedor).removeClass('d-none');

        if (!estado.chartChoferesParliament) {
            estado.chartChoferesParliament = echarts.init(contenedor);
        }

        const subtituloUnidad = patenteFiltro === 'TODOS' ? 'Toda la Flota' : `Unidad ${patenteFiltro}`;

        // OPCIÓN A: VISTA DONA (PIE)
        const opcionDona = {
            title: {
                text: `Distribución por Chofer — ${subtituloUnidad}`,
                subtext: `Total recorrido: ${formatearKm(totalKm)} km`,
                left: 'center',
                top: 5
            },
            tooltip: {
                trigger: 'item',
                formatter: function (p) {
                    return `<strong>${p.name}</strong><br/>Recorrido: <strong>${formatearKm(p.value)} km</strong> (${p.percent}%)`;
                }
            },
            legend: {
                orient: 'vertical',
                left: '3%',
                top: 'middle'
            },
            toolbox: {
                show: true,
                right: 15,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar PNG' }
                }
            },
            series: [
                {
                    id: 'serie-choferes-km',
                    name: 'Choferes',
                    type: 'pie',
                    radius: ['42%', '70%'],
                    center: ['56%', '55%'],
                    avoidLabelOverlap: true,
                    itemStyle: {
                        borderRadius: 6,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        formatter: '{b}: {d}%',
                        fontWeight: 'bold'
                    },
                    universalTransition: {
                        enabled: true,
                        divideShape: 'clone'
                    },
                    data: datos
                }
            ]
        };

        // OPCIÓN B: VISTA PARLAMENTO (SEMICIRCULAR CON ASIENTOS PROPORCIONALES)
        const ancho = estado.chartChoferesParliament.getWidth() || 800;
        const alto = estado.chartChoferesParliament.getHeight() || 420;
        const puntosParlamento = construirAsientosParlamento(datos, totalKm, ancho, alto);

        const opcionParlamento = {
            title: {
                text: `Cobertura por Chofer (Vista Parlamento) — ${subtituloUnidad}`,
                subtext: `Cada punto representa ~${formatearKm(totalKm / puntosParlamento.length)} km (${puntosParlamento.length} bloques)`,
                left: 'center',
                top: 5
            },
            tooltip: {
                trigger: 'item',
                formatter: function (p) {
                    return `<strong>${p.data.name}</strong><br/>Total Chofer: <strong>${formatearKm(p.data.value)} km</strong> (${p.data.porcentaje}%)`;
                }
            },
            toolbox: {
                show: true,
                right: 15,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar PNG' }
                }
            },
            series: [
                {
                    id: 'serie-choferes-km',
                    type: 'custom',
                    coordinateSystem: 'none',
                    renderItem: function (params, api) {
                        const item = puntosParlamento[params.dataIndex];
                        return {
                            type: 'circle',
                            shape: {
                                cx: item.x,
                                cy: item.y,
                                r: item.rDot
                            },
                            style: {
                                fill: item.color
                            },
                            emphasis: {
                                scale: 1.4
                            }
                        };
                    },
                    universalTransition: {
                        enabled: true,
                        divideShape: 'clone'
                    },
                    data: puntosParlamento
                }
            ]
        };

        const opcionFinal = estado.modoGraficoChofer === 'dona' ? opcionDona : opcionParlamento;
        estado.chartChoferesParliament.setOption(opcionFinal, true);
    };

    // Public API
    return {
        cargarEn: inicializar
    };
})();