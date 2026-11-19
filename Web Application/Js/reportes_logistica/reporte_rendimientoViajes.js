/* ========================================================================
   SITMAS - Módulo de Reportes: Rendimiento de Viajes y Costo por Tramo
   Arquitectura Maestro-Detalle (Drill-Through estilo Power BI):
   1. Maestro: Auditoría de Viajes Cerrados + Buscador directo de HDR #N
   2. Detalle: 5 KPIs Ejecutivas + Tabla Secuencial Inmediata +
               Gráfico Cascada (Waterfall) + Gráfico Share Dataset (dataset-link)
   Archivo: reporte_rendimientoViajes.js
   ======================================================================== */

const ReporteRendimientoViajesModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        listaViajes: [],
        hdrSeleccionadaId: null,
        detalleActual: null,
        chartCascada: null,
        chartDatasetLink: null
    };

    const URL_LISTADO_VIAJES = "https://localhost:44325/api/ReportesLogistica/ConsumoCombustible";
    const URL_DETALLE_HDR_CONSUMO = "https://localhost:44325/api/ReportesLogistica/DetalleHojaRutaConsumo";

    // Helpers de formateo local (es-AR)
    const formatearMoneda = function (valor) {
        const num = parseFloat(valor || 0);
        return "$ " + num.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatearDecimal = function (valor) {
        const num = parseFloat(valor || 0);
        return num.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Limpieza segura de instancias ECharts al reingresar a la pestaña en la SPA
    const destruirGraficosActivos = function () {
        ['chartCascada', 'chartDatasetLink'].forEach(key => {
            if (estado[key] && !estado[key].isDisposed()) {
                estado[key].dispose();
            }
            estado[key] = null;
        });
    };

    // 1. INICIALIZACIÓN DE LA ESTRUCTURA VISUAL
    const inicializar = function (contenedorId) {
        destruirGraficosActivos();
        const contenedor = $(`#${contenedorId}`);

        const htmlEstructura = `
            <!-- ENCABEZADO DEL MÓDULO Y FILTROS GLOBALES -->
            <div class="row fade-in">
                <div class="col-12 d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
                    <div>
                        <h4 class="text-primary fw-bold mb-0">
                            <i class="fas fa-route me-2"></i>Rendimiento de Viajes y Costo por Tramo
                        </h4>
                        <small class="text-muted">Analítica granular de combustible, desvíos de ruta e incidencia por parada</small>
                    </div>

                    <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded border">
                        <label class="small fw-bold mb-0">Desde:</label>
                        <input type="date" id="filtro-rend-desde" class="form-control form-control-sm" style="width: auto;">

                        <label class="small fw-bold mb-0 ms-2">Hasta:</label>
                        <input type="date" id="filtro-rend-hasta" class="form-control form-control-sm" style="width: auto;">

                        <button id="btn-filtrar-rend-viajes" class="btn btn-primary btn-sm ms-2">
                            <i class="fas fa-search"></i> Filtrar
                        </button>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN MAESTRA: AUDITORÍA DE VIAJES CONGELADOS + BUSCADOR DIRECTO HDR -->
            <div class="row mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-receipt text-secondary me-2"></i>Auditoría de Consumos Congelados por Viaje
                                </h6>
                                <small class="text-muted">Seleccioná una Hoja de Ruta (HDR) del listado o buscá por número para desplegar su radiografía por tramos</small>
                            </div>

                            <div class="d-flex flex-wrap align-items-center gap-2">
                                <!-- Filtro rápido por unidad -->
                                <select id="select-rend-vehiculo" class="form-select form-select-sm fw-bold border-secondary" style="width: auto; min-width: 185px;">
                                    <option value="TODOS">Todas las Unidades</option>
                                </select>

                                <!-- Buscador directo de cualquier HDR (incluso abiertas/en curso) -->
                                <div class="input-group input-group-sm" style="width: 225px;">
                                    <span class="input-group-text bg-primary text-white fw-bold">HDR #</span>
                                    <input type="number" id="input-buscar-hdr-directo" class="form-control" placeholder="N° Hoja Ruta..." min="1">
                                    <button class="btn btn-primary" type="button" id="btn-buscar-hdr-directo" title="Auditar Hoja de Ruta">
                                        <i class="fas fa-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="card-body p-0">
                            <div class="table-responsive" style="max-height: 290px; overflow-y: auto;">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light sticky-top">
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Unidad</th>
                                            <th>Movimiento</th>
                                            <th>Chofer</th>
                                            <th class="text-end">Km Reales</th>
                                            <th class="text-end">Tarifa/L</th>
                                            <th class="text-end">Costo / Km</th>
                                            <th class="text-end">Litros</th>
                                            <th class="text-end">Total Viaje</th>
                                            <th class="text-center">Análisis</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-rend-maestro-viajes">
                                        <tr>
                                            <td colspan="10" class="text-center text-muted py-4">Cargando recorridos auditados...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PANEL DETALLE (DRILL-THROUGH DE LA HOJA DE RUTA SELECCIONADA) -->
            <div id="panel-drilldown-hdr" class="d-none fade-in">
                <!-- BANNER DE CONTEXTO DE LA HOJA DE RUTA -->
                <div class="row mb-3">
                    <div class="col-12">
                        <div class="card shadow-sm border-0 border-start border-primary border-4 bg-white">
                            <div class="card-body py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                                <div>
                                    <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                                        <span class="badge bg-primary fs-6" id="hdr-det-titulo">Hoja de Ruta #0</span>
                                        <span class="badge bg-secondary" id="hdr-det-estado">Estado</span>
                                        <span class="badge" id="hdr-det-badge-financiero">Origen Cálculo</span>
                                    </div>
                                    <div class="small text-muted">
                                        <i class="fas fa-calendar-alt me-1"></i>Fecha: <strong class="text-dark" id="hdr-det-fecha">--/--/----</strong>
                                        <span class="mx-2">|</span>
                                        <i class="fas fa-truck me-1"></i>Unidad: <strong class="text-dark" id="hdr-det-patente">---</strong>
                                        <span class="mx-2">|</span>
                                        <i class="fas fa-user-tie me-1"></i>Chofer: <strong class="text-dark" id="hdr-det-chofer">---</strong>
                                        <span class="mx-2">|</span>
                                        <i class="fas fa-gas-pump me-1"></i>Combustible: <strong class="text-dark" id="hdr-det-combustible">---</strong>
                                    </div>
                                </div>

                                <div class="text-end bg-light px-3 py-2 rounded border">
                                    <small class="text-muted d-block" style="font-size: 0.72rem;">TARIFA Y FACTOR APLICADOS</small>
                                    <span class="fw-bold text-dark" id="hdr-det-parametros">$ 0,00 /L × 0,2600 L/km</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 5 TARJETAS KPI DEL VIAJE SELECCIONADO -->
                <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-5 g-3 mb-4">
                    <!-- KPI 1: COSTO TOTAL DEL VIAJE -->
                    <div class="col">
                        <div class="card shadow-sm border-0 border-start border-success border-4 h-100">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="text-muted small fw-bold text-uppercase">Costo Total del Viaje</span>
                                    <span class="badge bg-success bg-opacity-10 text-success p-2"><i class="fas fa-dollar-sign fa-lg"></i></span>
                                </div>
                                <h3 class="fw-bold text-dark mb-1" id="kpi-hdr-costo-total">$ 0,00</h3>
                                <small class="text-muted" id="kpi-hdr-sub-tarifa">Tarifa: $ 0,00 /L</small>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 2: COMBUSTIBLE CONSUMIDO Y COSTO POR KM -->
                    <div class="col">
                        <div class="card shadow-sm border-0 border-start border-secondary border-4 h-100">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="text-muted small fw-bold text-uppercase">Consumo y Costo/Km</span>
                                    <span class="badge bg-secondary bg-opacity-10 text-secondary p-2"><i class="fas fa-gas-pump fa-lg"></i></span>
                                </div>
                                <h3 class="fw-bold text-dark mb-1" id="kpi-hdr-litros">0,00 L</h3>
                                <small class="fw-semibold text-primary" id="kpi-hdr-sub-costokm">$ 0,00 /km</small>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 3: DISTANCIA REAL VS TRAMOS -->
                    <div class="col">
                        <div class="card shadow-sm border-0 border-start border-primary border-4 h-100">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="text-muted small fw-bold text-uppercase">Distancia Real vs. Tramos</span>
                                    <span class="badge bg-primary bg-opacity-10 text-primary p-2"><i class="fas fa-road fa-lg"></i></span>
                                </div>
                                <h3 class="fw-bold text-dark mb-1" id="kpi-hdr-km-reales">0,00 km</h3>
                                <small class="text-muted" id="kpi-hdr-sub-tramos">Planificado en tramos: 0,00 km</small>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 4: IMPACTO POR DESVÍO -->
                    <div class="col">
                        <div class="card shadow-sm border-0 border-start border-4 h-100" id="card-kpi-hdr-desvio">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="text-muted small fw-bold text-uppercase">Impacto por Desvío</span>
                                    <span class="badge bg-warning bg-opacity-10 text-warning p-2"><i class="fas fa-exclamation-triangle fa-lg"></i></span>
                                </div>
                                <h3 class="fw-bold mb-1" id="kpi-hdr-costo-desvio">$ 0,00</h3>
                                <small class="text-muted" id="kpi-hdr-sub-desvio-km">0,00 km de diferencia</small>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 5: TRAMO DE MAYOR GASTO -->
                    <div class="col">
                        <div class="card shadow-sm border-0 border-start border-info border-4 h-100">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="text-muted small fw-bold text-uppercase">Tramo de Mayor Gasto</span>
                                    <span class="badge bg-info bg-opacity-10 text-info p-2"><i class="fas fa-map-pin fa-lg"></i></span>
                                </div>
                                <h5 class="fw-bold text-dark mb-1 text-truncate" id="kpi-hdr-top-tramo" title="">---</h5>
                                <small class="text-muted" id="kpi-hdr-sub-top-tramo">$ 0,00 (0% del viaje)</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TABLA SECUENCIAL DE TRAMOS (UBICADA INMEDIATAMENTE DEBAJO DE LAS KPI) -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card shadow-sm border-0">
                            <div class="card-header bg-white border-bottom py-3">
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-list-ol text-primary me-2"></i>Desglose Secuencial de Tramos y Consumo
                                </h6>
                                <small class="text-muted">Detalle operativo de cada parada, distancia parcial, litros proporcionales e incidencia económica</small>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-hover align-middle mb-0">
                                        <thead class="table-light">
                                            <tr>
                                                <th class="text-center">#</th>
                                                <th>Hora</th>
                                                <th>Movimiento</th>
                                                <th>Punto de Parada / Dirección</th>
                                                <th>Material / Recurso</th>
                                                <th class="text-end">Km Tramo</th>
                                                <th class="text-end">Litros Real</th>
                                                <th class="text-end">Costo Teórico</th>
                                                <th class="text-end">Costo Real</th>
                                                <th style="min-width: 140px;">Incidencia (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tbody-hdr-detalle-tramos">
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- GRÁFICO 1: CASCADA (WATERFALL) DE CONSTRUCCIÓN DEL COSTO -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card shadow-sm border-0">
                            <div class="card-header bg-white border-bottom py-3">
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-stairs text-primary me-2"></i>Cascada de Construcción del Costo por Parada (Waterfall)
                                </h6>
                                <small class="text-muted">Muestra cuánto dinero suma cada tramo secuencial desde la salida hasta conformar el gasto total del viaje</small>
                            </div>
                            <div class="card-body">
                                <div id="msg-sin-tramos-cascada" class="alert alert-light text-center border my-4 d-none">
                                    Esta Hoja de Ruta aún no tiene tramos cargados en su detalle.
                                </div>
                                <div id="echarts-hdr-cascada" style="width: 100%; height: 390px;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- GRÁFICO 2: SHARE DATASET (LÍNEAS EVOLUTIVAS + CIRCULAR VINCULADO AL PUNTERO) -->
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow-sm border-0">
                            <div class="card-header bg-white border-bottom py-3">
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-project-diagram text-warning me-2"></i>Auditoría Interactiva por Tramo: Curva de Costos y Desglose Vinculado
                                </h6>
                                <small class="text-muted">Deslizá el cursor sobre cada tramo en las líneas superiores para actualizar dinámicamente la radiografía circular inferior</small>
                            </div>
                            <div class="card-body">
                                <div id="msg-sin-tramos-datasetlink" class="alert alert-light text-center border my-4 d-none">
                                    No hay tramos suficientes para graficar la comparativa vinculada.
                                </div>
                                <div id="echarts-hdr-datasetlink" style="width: 100%; height: 480px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ESTADO VACÍO INICIAL SI NO HAY HOJAS DE RUTA EN EL RANGO -->
            <div id="panel-vacio-hdr" class="alert alert-light border text-center py-5 fade-in d-none">
                <i class="fas fa-route fa-3x text-muted mb-3"></i>
                <h5 class="text-dark fw-bold">Seleccioná una Hoja de Ruta para analizar</h5>
                <p class="text-muted mb-0">Hacé clic en el botón <strong>"Auditar"</strong> de cualquier viaje de la tabla superior o ingresá un número de Hoja de Ruta en el buscador.</p>
            </div>
        `;

        contenedor.html(htmlEstructura);
        enlazarEventos();
        configurarFechasPorDefecto();
    };

    // 2. ENLACE DE EVENTOS DELEGADOS
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-reportes-logistica');

        // Filtrar listado maestro por fechas
        principal.off('click', '#btn-filtrar-rend-viajes').on('click', '#btn-filtrar-rend-viajes', function () {
            const desde = $('#filtro-rend-desde').val();
            const hasta = $('#filtro-rend-hasta').val();

            if (!desde || !hasta) {
                Swal.fire('Fechas requeridas', 'Por favor seleccioná ambas fechas.', 'warning');
                return;
            }
            if (desde > hasta) {
                Swal.fire('Rango inválido', 'La fecha "Desde" no puede ser mayor a "Hasta".', 'warning');
                return;
            }

            cargarListadoMaestroViajes(desde, hasta);
        });

        // Filtrar tabla maestra por unidad
        principal.off('change', '#select-rend-vehiculo').on('change', '#select-rend-vehiculo', function () {
            renderizarTablaMaestraViajes();
        });

        // Seleccionar una Hoja de Ruta desde la tabla maestra
        principal.off('click', '.btn-auditar-hdr').on('click', '.btn-auditar-hdr', function (e) {
            e.stopPropagation();
            const idHdr = parseInt($(this).data('id-hdr'), 10);
            if (idHdr > 0) {
                consultarDetalleHojaRuta(idHdr, true);
            }
        });

        // Permitir clic en toda la fila si tiene HDR asociada
        principal.off('click', '.fila-viaje-con-hdr').on('click', '.fila-viaje-con-hdr', function () {
            const idHdr = parseInt($(this).data('id-hdr'), 10);
            if (idHdr > 0) {
                consultarDetalleHojaRuta(idHdr, true);
            }
        });

        // Buscador directo por N° de Hoja de Ruta (permite ver HDR abiertas o históricas)
        principal.off('click', '#btn-buscar-hdr-directo').on('click', '#btn-buscar-hdr-directo', function () {
            const idHdr = parseInt($('#input-buscar-hdr-directo').val(), 10);
            if (!idHdr || idHdr <= 0) {
                Swal.fire('Número inválido', 'Ingresá un número de Hoja de Ruta válido (mayor a 0).', 'warning');
                return;
            }
            consultarDetalleHojaRuta(idHdr, true);
        });

        principal.off('keypress', '#input-buscar-hdr-directo').on('keypress', '#input-buscar-hdr-directo', function (e) {
            if (e.which === 13) {
                e.preventDefault();
                $('#btn-buscar-hdr-directo').trigger('click');
            }
        });

        // Responsividad de ECharts
        $(window).off('resize.rendimientoViajes').on('resize.rendimientoViajes', function () {
            if (estado.chartCascada && !estado.chartCascada.isDisposed()) {
                estado.chartCascada.resize();
            }
            if (estado.chartDatasetLink && !estado.chartDatasetLink.isDisposed()) {
                estado.chartDatasetLink.resize();
            }
        });
    };

    const configurarFechasPorDefecto = function () {
        const hoy = new Date();
        const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);

        $('#filtro-rend-hasta').val(hoy.toISOString().split('T')[0]);
        $('#filtro-rend-desde').val(primerDiaAnio.toISOString().split('T')[0]);

        $('#btn-filtrar-rend-viajes').trigger('click');
    };

    // 3. CONSULTA MAESTRA: AUDITORÍA DE VIAJES CONGELADOS
    const cargarListadoMaestroViajes = function (fechaDesde, fechaHasta) {
        const btn = $('#btn-filtrar-rend-viajes');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

        $.ajax({
            type: "GET",
            url: URL_LISTADO_VIAJES,
            data: { fechaDesde: fechaDesde, fechaHasta: fechaHasta },
            success: function (respuesta) {
                estado.listaViajes = respuesta || [];
                poblarFiltroVehiculos(estado.listaViajes);
                renderizarTablaMaestraViajes();

                const primerViajeConHdr = estado.listaViajes.find(v => v.Id_HojaRuta !== null && v.Id_HojaRuta > 0);
                if (primerViajeConHdr) {
                    consultarDetalleHojaRuta(primerViajeConHdr.Id_HojaRuta, false);
                } else {
                    $('#panel-drilldown-hdr').addClass('d-none');
                    $('#panel-vacio-hdr').removeClass('d-none');
                }
            },
            error: function (err) {
                console.error("Error al obtener listado de viajes:", err);
                Swal.fire('Error de conexión', 'No se pudo cargar la auditoría de viajes.', 'error');
            },
            complete: function () {
                btn.prop('disabled', false).html('<i class="fas fa-search"></i> Filtrar');
            }
        });
    };

    const poblarFiltroVehiculos = function (lista) {
        const select = $('#select-rend-vehiculo');
        const previo = select.val();
        const patentes = [...new Set(lista.map(r => r.Vehiculo || 'Sin Patente'))].sort();

        select.empty().append('<option value="TODOS">Todas las Unidades</option>');
        patentes.forEach(p => select.append(`<option value="${p}">Unidad: ${p}</option>`));

        select.val(previo && patentes.includes(previo) ? previo : 'TODOS');
    };

    const renderizarTablaMaestraViajes = function () {
        const tbody = $('#tbody-rend-maestro-viajes').empty();
        const filtroUnidad = $('#select-rend-vehiculo').val() || 'TODOS';

        const filtrados = filtroUnidad === 'TODOS'
            ? estado.listaViajes
            : estado.listaViajes.filter(r => (r.Vehiculo || 'Sin Patente') === filtroUnidad);

        if (!filtrados || filtrados.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="10" class="text-center text-muted py-4">
                        <i class="fas fa-folder-open me-2"></i>No se encontraron recorridos cerrados para los filtros seleccionados.
                    </td>
                </tr>
            `);
            return;
        }

        filtrados.forEach(reg => {
            const esConHdr = reg.Id_HojaRuta !== null && reg.Id_HojaRuta > 0;
            const estaSeleccionada = esConHdr && reg.Id_HojaRuta === estado.hdrSeleccionadaId;

            const badgeMov = esConHdr
                ? `<span class="badge bg-success bg-opacity-10 text-success border border-success">HDR #${reg.Id_HojaRuta}</span>`
                : `<span class="badge bg-info bg-opacity-10 text-info border border-info">Mov. Interno</span>`;

            const botonAccion = esConHdr
                ? `<button type="button" class="btn btn-sm ${estaSeleccionada ? 'btn-primary' : 'btn-outline-primary'} btn-auditar-hdr" data-id-hdr="${reg.Id_HojaRuta}">
                       <i class="fas fa-chart-pie me-1"></i> ${estaSeleccionada ? 'Viendo' : 'Auditar'}
                   </button>`
                : `<span class="badge bg-light text-muted border" title="Los movimientos internos no poseen tramos de hoja de ruta">Sin tramos</span>`;

            tbody.append(`
                <tr class="${esConHdr ? 'fila-viaje-con-hdr' : ''} ${estaSeleccionada ? 'table-primary' : ''}" 
                    data-id-hdr="${esConHdr ? reg.Id_HojaRuta : ''}" 
                    style="${esConHdr ? 'cursor: pointer;' : ''}">
                    <td class="fw-bold">${reg.FechaFormateada}</td>
                    <td><span class="badge bg-light text-dark border">${reg.Vehiculo}</span></td>
                    <td>${badgeMov}</td>
                    <td>${reg.ChoferNombreCompleto}</td>
                    <td class="text-end">${formatearDecimal(reg.KmReales)} km</td>
                    <td class="text-end text-muted">${formatearMoneda(reg.PrecioLitroAplicado)}</td>
                    <td class="text-end fw-semibold text-primary">${formatearMoneda(reg.CostoPorKm)}</td>
                    <td class="text-end">${formatearDecimal(reg.LitrosConsumidos)} L</td>
                    <td class="text-end fw-bold text-success">${formatearMoneda(reg.CostoTotalViaje)}</td>
                    <td class="text-center">${botonAccion}</td>
                </tr>
            `);
        });
    };

    // 4. CONSULTA DETALLE (DRILL-THROUGH) DE UNA HOJA DE RUTA N
    const consultarDetalleHojaRuta = function (idHojaRuta, hacerScroll) {
        $.ajax({
            type: "GET",
            url: URL_DETALLE_HDR_CONSUMO,
            data: { idHojaRuta: idHojaRuta },
            success: function (data) {
                if (!data || !data.Cabecera) {
                    Swal.fire('Sin resultados', `No se encontró la Hoja de Ruta #${idHojaRuta}.`, 'info');
                    return;
                }

                estado.hdrSeleccionadaId = idHojaRuta;
                estado.detalleActual = data;
                $('#input-buscar-hdr-directo').val(idHojaRuta);

                renderizarTablaMaestraViajes();

                $('#panel-vacio-hdr').addClass('d-none');
                $('#panel-drilldown-hdr').removeClass('d-none');

                const tramos = data.Tramos || [];
                renderizarCabeceraYKPIs(data.Cabecera, tramos);
                renderizarTablaTramos(tramos);
                renderizarGraficoCascada(data.Cabecera, tramos);
                renderizarGraficoDatasetLink(tramos);

                if (hacerScroll) {
                    document.getElementById('panel-drilldown-hdr').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            },
            error: function (xhr) {
                if (xhr.status === 404) {
                    Swal.fire('No encontrada', `La Hoja de Ruta #${idHojaRuta} no existe en el sistema.`, 'warning');
                } else {
                    console.error("Error al consultar detalle de HDR:", xhr);
                    Swal.fire('Error de servidor', 'No se pudo obtener el análisis por tramos de la Hoja de Ruta.', 'error');
                }
            }
        });
    };

    // 5. RENDERIZADO DE CABECERA Y 5 KPIS DE LA HOJA DE RUTA
    const renderizarCabeceraYKPIs = function (cab, tramos) {
        $('#hdr-det-titulo').text(`Hoja de Ruta #${cab.Id_HojaRuta}`);
        $('#hdr-det-estado').text(cab.EstadoHDR);

        const badgeFin = $('#hdr-det-badge-financiero');
        if (cab.EsCostoEstimado) {
            badgeFin
                .removeClass('bg-success')
                .addClass('bg-warning text-dark')
                .html('<i class="fas fa-clock me-1"></i>' + cab.OrigenCalculo);
        } else {
            badgeFin
                .removeClass('bg-warning text-dark')
                .addClass('bg-success')
                .html('<i class="fas fa-lock me-1"></i>' + cab.OrigenCalculo);
        }

        $('#hdr-det-fecha').text(cab.FechaFormateada || 'Sin fecha');
        $('#hdr-det-patente').text(cab.Patente);
        $('#hdr-det-chofer').text(cab.ChoferNombreCompleto);
        $('#hdr-det-combustible').text(cab.TipoCombustible);
        $('#hdr-det-parametros').text(
            `${formatearMoneda(cab.PrecioLitroAplicado)} /L × ${parseFloat(cab.ConsumoTeoricoLtsKm).toFixed(4)} L/km`
        );

        // KPI 1: Costo Total del Viaje
        $('#kpi-hdr-costo-total').text(formatearMoneda(cab.CostoTotalViaje));
        $('#kpi-hdr-sub-tarifa').text(`Tarifa aplicada: ${formatearMoneda(cab.PrecioLitroAplicado)} /L`);

        // KPI 2: Litros Consumidos y Costo por Km
        $('#kpi-hdr-litros').text(`${formatearDecimal(cab.LitrosTotalesViaje)} L`);
        $('#kpi-hdr-sub-costokm').text(`${formatearMoneda(cab.CostoPorKm)} /km`);

        // KPI 3: Distancia Real vs Tramos
        const kmMostrar = cab.KmRealesOdometro !== null ? cab.KmRealesOdometro : cab.KmSumaTramos;
        $('#kpi-hdr-km-reales').text(`${formatearDecimal(kmMostrar)} km`);
        $('#kpi-hdr-sub-tramos').text(
            cab.KmRealesOdometro !== null
                ? `Declarado en tramos: ${formatearDecimal(cab.KmSumaTramos)} km`
                : 'Distancia calculada por suma de tramos'
        );

        // KPI 4: Impacto por Desvío
        const desvioDinero = parseFloat(cab.CostoDesvio || 0);
        const desvioKm = parseFloat(cab.DesvioKm || 0);
        const hayDesvio = Math.abs(desvioKm) > 0.05;
        const signo = desvioDinero > 0 ? '+' : '';

        $('#kpi-hdr-costo-desvio')
            .text(`${signo}${formatearMoneda(desvioDinero)}`)
            .removeClass('text-warning text-success text-danger text-dark')
            .addClass(desvioDinero > 0.05 ? 'text-danger' : (desvioDinero < -0.05 ? 'text-success' : 'text-dark'));

        $('#card-kpi-hdr-desvio')
            .removeClass('border-warning border-success border-danger')
            .addClass(hayDesvio ? 'border-warning' : 'border-success');

        $('#kpi-hdr-sub-desvio-km').text(
            cab.EsCostoEstimado
                ? 'Disponible al cerrar el odómetro'
                : `${desvioKm > 0 ? '+' : ''}${formatearDecimal(desvioKm)} km vs. tramos planificados`
        );

        // KPI 5: Tramo de Mayor Gasto
        if (tramos && tramos.length > 0) {
            const tramoMax = [...tramos].sort((a, b) => b.CostoTramo_Prorrateado - a.CostoTramo_Prorrateado)[0];
            $('#kpi-hdr-top-tramo')
                .text(`#${tramoMax.NumeroTramo} ${tramoMax.PuntoParada}`)
                .attr('title', `#${tramoMax.NumeroTramo} ${tramoMax.PuntoParada}`);
            $('#kpi-hdr-sub-top-tramo').text(
                `${formatearMoneda(tramoMax.CostoTramo_Prorrateado)} (${formatearDecimal(tramoMax.PorcentajeIncidencia)}% del viaje)`
            );
        } else {
            $('#kpi-hdr-top-tramo').text('Sin tramos');
            $('#kpi-hdr-sub-top-tramo').text('$ 0,00 (0% del viaje)');
        }
    };

    // 6. TABLA SECUENCIAL DE TRAMOS CON BARRA DE INCIDENCIA VISUAL
    const renderizarTablaTramos = function (tramos) {
        const tbody = $('#tbody-hdr-detalle-tramos').empty();

        if (!tramos || tramos.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="10" class="text-center text-muted py-4">
                        Esta Hoja de Ruta no posee tramos registrados en Detalle_Hoja_Ruta.
                    </td>
                </tr>
            `);
            return;
        }

        tramos.forEach(t => {
            let badgeTipo = 'bg-secondary';
            if (t.Id_TipoMovimiento === 1) badgeTipo = 'bg-primary';
            else if (t.Id_TipoMovimiento === 2) badgeTipo = 'bg-success';
            else if (t.Id_TipoMovimiento === 3) badgeTipo = 'bg-dark';

            const sobrecosto = parseFloat(t.SobrecostoDesvioTramo || 0);
            const indicadorDesvio = Math.abs(sobrecosto) > 0.05
                ? `<small class="d-block ${sobrecosto > 0 ? 'text-danger' : 'text-success'}">${sobrecosto > 0 ? '+' : ''}${formatearMoneda(sobrecosto)} desvío</small>`
                : '';

            const porc = Math.min(100, Math.max(0, parseFloat(t.PorcentajeIncidencia || 0)));

            tbody.append(`
                <tr>
                    <td class="text-center fw-bold text-primary">${t.NumeroTramo}</td>
                    <td><span class="badge bg-light text-dark border">${t.HoraEstimada}</span></td>
                    <td><span class="badge ${badgeTipo}">${t.TipoMovimiento}</span></td>
                    <td>
                        <div class="fw-bold text-dark">${t.PuntoParada}</div>
                        <small class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${t.DireccionCompleta} (${t.UbicacionDescripcion})</small>
                    </td>
                    <td>
                        <div class="fw-semibold text-dark">${t.TipoMaterial}</div>
                        <small class="text-muted">${t.RecursoMovilizado}</small>
                    </td>
                    <td class="text-end fw-semibold">${formatearDecimal(t.KmTramo)} km</td>
                    <td class="text-end">${formatearDecimal(t.LitrosTramo_Prorrateado)} L</td>
                    <td class="text-end text-muted">${formatearMoneda(t.CostoTramo_Teorico)}</td>
                    <td class="text-end">
                        <span class="fw-bold text-success">${formatearMoneda(t.CostoTramo_Prorrateado)}</span>
                        ${indicadorDesvio}
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="progress flex-grow-1" style="height: 8px;">
                                <div class="progress-bar bg-primary" role="progressbar" style="width: ${porc}%;"></div>
                            </div>
                            <span class="small fw-bold text-dark" style="min-width: 45px;">${formatearDecimal(porc)}%</span>
                        </div>
                    </td>
                </tr>
            `);
        });
    };

    // 7. GRÁFICO 1: CASCADA (WATERFALL) DE CONSTRUCCIÓN DEL COSTO
    const renderizarGraficoCascada = function (cab, tramos) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-hdr-cascada');
        const msg = $('#msg-sin-tramos-cascada');

        if (!tramos || tramos.length === 0) {
            $(dom).addClass('d-none');
            msg.removeClass('d-none');
            return;
        }

        msg.addClass('d-none');
        $(dom).removeClass('d-none');

        if (!estado.chartCascada) {
            estado.chartCascada = echarts.init(dom);
        }

        const categorias = [];
        const baseTransparente = [];
        const valoresEscalones = [];

        let acumulado = 0;

        tramos.forEach(t => {
            const costo = Number(parseFloat(t.CostoTramo_Prorrateado || 0).toFixed(2));
            const tieneSobrecosto = parseFloat(t.SobrecostoDesvioTramo || 0) > 0.05;

            categorias.push(`#${t.NumeroTramo} ${t.PuntoParada}`);
            baseTransparente.push(Number(acumulado.toFixed(2)));
            valoresEscalones.push({
                value: costo,
                km: t.KmTramo,
                movimiento: t.TipoMovimiento,
                itemStyle: {
                    color: tieneSobrecosto ? '#fd7e14' : '#0d6efd',
                    borderRadius: [4, 4, 0, 0]
                }
            });

            acumulado += costo;
        });

        const totalFinal = Number(parseFloat(cab.CostoTotalViaje || acumulado).toFixed(2));
        categorias.push('TOTAL VIAJE');
        baseTransparente.push(0);
        valoresEscalones.push({
            value: totalFinal,
            km: cab.KmRealesOdometro !== null ? cab.KmRealesOdometro : cab.KmSumaTramos,
            movimiento: 'Cierre Total',
            itemStyle: {
                color: '#198754',
                borderRadius: [5, 5, 0, 0]
            }
        });

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function (params) {
                    const tar = params[1];
                    if (!tar) return '';
                    const dataObj = tar.data;
                    return `
                        <strong>${tar.name}</strong><br/>
                        Tipo: ${dataObj.movimiento}<br/>
                        Distancia: <strong>${formatearDecimal(dataObj.km)} km</strong><br/>
                        Importe: <strong>${formatearMoneda(dataObj.value)}</strong>
                    `;
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
                top: 35,
                bottom: 55,
                left: '3%',
                right: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: categorias,
                axisLabel: {
                    interval: 0,
                    rotate: categorias.length > 6 ? 18 : 0,
                    fontSize: 11,
                    fontWeight: 'bold',
                    formatter: function (val) {
                        return val.length > 24 ? val.substring(0, 24) + '...' : val;
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: 'Costo ($)',
                axisLabel: {
                    formatter: function (val) {
                        return '$' + val.toLocaleString('es-AR');
                    }
                }
            },
            series: [
                {
                    name: 'Base',
                    type: 'bar',
                    stack: 'Total',
                    silent: true,
                    itemStyle: { borderColor: 'transparent', color: 'transparent' },
                    emphasis: { itemStyle: { borderColor: 'transparent', color: 'transparent' } },
                    data: baseTransparente
                },
                {
                    name: 'Costo Tramo ($)',
                    type: 'bar',
                    stack: 'Total',
                    barMaxWidth: 52,
                    label: {
                        show: true,
                        position: 'top',
                        fontWeight: 'bold',
                        fontSize: 11,
                        formatter: function (p) {
                            return p.value > 0 ? '$' + Math.round(p.value).toLocaleString('es-AR') : '';
                        }
                    },
                    data: valoresEscalones
                }
            ]
        };

        estado.chartCascada.setOption(option, true);
    };

    // 8. GRÁFICO 2: SHARE DATASET (LÍNEAS EVOLUTIVAS + CIRCULAR VINCULADO AL PUNTERO)
    const renderizarGraficoDatasetLink = function (tramos) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-hdr-datasetlink');
        const msg = $('#msg-sin-tramos-datasetlink');

        if (!tramos || tramos.length === 0) {
            $(dom).addClass('d-none');
            msg.removeClass('d-none');
            return;
        }

        msg.addClass('d-none');
        $(dom).removeClass('d-none');

        if (!estado.chartDatasetLink) {
            estado.chartDatasetLink = echarts.init(dom);
        }

        // Construimos la matriz compartida (dataset.source) estilo ECharts dataset-link
        const filaEncabezado = ['Tramo', ...tramos.map(t => `#${t.NumeroTramo} ${t.PuntoParada}`)];
        const filaTeorico = ['Costo Teórico ($)', ...tramos.map(t => Number(parseFloat(t.CostoTramo_Teorico || 0).toFixed(2)))];
        const filaReal = ['Costo Real ($)', ...tramos.map(t => Number(parseFloat(t.CostoTramo_Prorrateado || 0).toFixed(2)))];
        const filaAcumulado = ['Costo Acumulado ($)', ...tramos.map(t => Number(parseFloat(t.CostoAcumulado_Prorrateado || 0).toFixed(2)))];

        const option = {
            color: ['#6c757d', '#0d6efd', '#198754'],
            title: {
                text: `Inspeccionando: ${filaEncabezado[1]}`,
                left: 'center',
                top: '52%',
                textStyle: {
                    fontSize: 13,
                    fontWeight: 'bold',
                    color: '#495057'
                }
            },
            legend: {
                top: 5
            },
            tooltip: {
                trigger: 'axis',
                showContent: true
            },
            toolbox: {
                show: true,
                right: 15,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar PNG' }
                }
            },
            dataset: {
                source: [
                    filaEncabezado,
                    filaTeorico,
                    filaReal,
                    filaAcumulado
                ]
            },
            xAxis: {
                type: 'category',
                boundaryGap: true,
                axisLabel: {
                    interval: 0,
                    rotate: filaEncabezado.length > 7 ? 15 : 0,
                    fontWeight: 'bold',
                    formatter: function (val) {
                        return val.length > 22 ? val.substring(0, 22) + '...' : val;
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: 'Importe ($)',
                gridIndex: 0,
                axisLabel: {
                    formatter: function (val) {
                        return '$' + val.toLocaleString('es-AR');
                    }
                }
            },
            grid: {
                top: '12%',
                bottom: '54%',
                left: '4%',
                right: '4%',
                containLabel: true
            },
            series: [
                {
                    type: 'line',
                    smooth: true,
                    symbolSize: 8,
                    seriesLayoutBy: 'row',
                    emphasis: { focus: 'series' },
                    lineStyle: { width: 2.5, type: 'dashed' }
                },
                {
                    type: 'line',
                    smooth: true,
                    symbolSize: 9,
                    seriesLayoutBy: 'row',
                    emphasis: { focus: 'series' },
                    lineStyle: { width: 3 }
                },
                {
                    type: 'line',
                    smooth: true,
                    symbolSize: 8,
                    seriesLayoutBy: 'row',
                    emphasis: { focus: 'series' },
                    areaStyle: { opacity: 0.08 },
                    lineStyle: { width: 2.5 }
                },
                {
                    type: 'pie',
                    id: 'pie-tramo-detalle',
                    radius: ['22%', '36%'],
                    center: ['50%', '78%'],
                    emphasis: {
                        focus: 'self'
                    },
                    itemStyle: {
                        borderRadius: 5,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        fontWeight: 'bold',
                        formatter: '{b}: $ {@[1]} ({d}%)'
                    },
                    encode: {
                        itemName: 'Tramo',
                        value: 1,
                        tooltip: 1
                    }
                }
            ]
        };

        // Limpiamos cualquier listener previo para evitar acumulación en la SPA
        estado.chartDatasetLink.off('updateAxisPointer');
        estado.chartDatasetLink.on('updateAxisPointer', function (event) {
            const xAxisInfo = event.axesInfo && event.axesInfo[0];
            if (xAxisInfo && xAxisInfo.value !== undefined) {
                const dimension = xAxisInfo.value + 1;
                const nombreTramoActivo = filaEncabezado[dimension] || '';

                estado.chartDatasetLink.setOption({
                    title: {
                        text: `Inspeccionando: ${nombreTramoActivo}`
                    },
                    series: {
                        id: 'pie-tramo-detalle',
                        label: {
                            formatter: `{b}: $ {@[${dimension}]} ({d}%)`
                        },
                        encode: {
                            value: dimension,
                            tooltip: dimension
                        }
                    }
                });
            }
        });

        estado.chartDatasetLink.setOption(option, true);
    };

    // Public API
    return {
        cargarEn: inicializar
    };
})();

