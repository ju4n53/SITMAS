/* ========================================================================
   SITMAS - Módulo de Reportes de Trazabilidad: Auditoría Granular de Lotes
   Consume: GET /api/ReportesTrazabilidad/AuditoriaLotes
   DTO C#: { Lotes: [ { ..., Clasificaciones: [...] } ] }
   Incluye: 4 KPIs Específicos + Sankey 3 Niveles + Calendar Pie + Maestro-Detalle
   Archivo: Js/reportes_trazabilidad/reporte_traz_auditoria.js
   ======================================================================== */

const ReporteTrazAuditoriaModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        lotes: [],
        diasCalendarioMap: {},
        mesSeleccionadoCal: '',
        chartSankeyFlujo: null,
        chartCalendarioPie: null
    };

    const URL_AUDITORIA_LOTES = "https://localhost:44325/api/ReportesTrazabilidad/AuditoriaLotes";
    const URL_POR_MATERIAL = "https://localhost:44325/api/ReportesTrazabilidad/PorMaterial";

    const PALETA_ORIGENES = [
        '#0d6efd', '#6f42c1', '#20c997', '#fd7e14',
        '#0dcaf0', '#d63384', '#6610f2', '#198754'
    ];

    // Helpers de formateo regional (es-AR)
    const formatearKg = function (valor) {
        const num = parseFloat(valor || 0);
        return num.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatearKgCorto = function (valor) {
        const num = parseFloat(valor || 0);
        if (num >= 1000) {
            return (num / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + 't';
        }
        return num.toLocaleString('es-AR', { maximumFractionDigits: 0 }) + 'kg';
    };

    const formatearFechaHora = function (fechaIso) {
        if (!fechaIso) return '—';
        const d = new Date(fechaIso);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Normaliza la clave de fecha YYYY-MM-DD sin desfase por zona horaria
    const extraerFechaIsoDia = function (fechaRaw) {
        if (!fechaRaw) return null;
        if (typeof fechaRaw === 'string' && fechaRaw.length >= 10) {
            return fechaRaw.substring(0, 10);
        }
        const d = new Date(fechaRaw);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().substring(0, 10);
    };

    // Limpieza segura de instancias ECharts al cambiar de pestaña en la SPA
    const destruirGraficosActivos = function () {
        ['chartSankeyFlujo', 'chartCalendarioPie'].forEach(key => {
            if (estado[key] && !estado[key].isDisposed()) {
                estado[key].dispose();
            }
            estado[key] = null;
        });
    };

    // Normalizador alineado 1 a 1 con TrazabilidadAuditoriaResponseDTO de C#
    const normalizarLotes = function (respuesta) {
        const listaRaw = Array.isArray(respuesta)
            ? respuesta
            : (respuesta?.Lotes || respuesta?.lotes || []);

        return listaRaw.map(l => {
            const clasifsRaw = l.Clasificaciones || l.clasificaciones || [];
            const clasificaciones = clasifsRaw.map(c => ({
                idClasificacion: c.IdClasificacion ?? 0,
                idDetalleIngreso: c.IdDetalleIngreso ?? l.IdDetalleIngreso ?? 0,
                fechaClasificacion: c.FechaClasificacion || null,
                fechaDia: extraerFechaIsoDia(c.FechaClasificacion),
                subtipo: c.Subtipo || 'Sin Subtipo',
                pesoUtil: parseFloat(c.PesoUtil ?? 0),
                idEstadoMaterial: parseInt(c.IdEstadoMaterial ?? 0, 10),
                semaforoEstado: c.SemaforoEstado || 'Sin Estado',
                nombreDestino: c.NombreDestino || 'Sin Destino',
                operadorClasificador: c.OperadorClasificador || 'Sin Operador'
            }));

            return {
                idDetalleIngreso: l.IdDetalleIngreso ?? 0,
                fechaIngreso: l.FechaIngreso || null,
                canalIngreso: l.CanalIngreso || 'Sin Canal',
                idCabeceraIngreso: l.IdCabeceraIngreso ?? null,
                idHojaRuta: l.IdHojaRuta ?? null,
                patenteVehiculo: l.PatenteVehiculo || 'Sin Patente',
                nombreChofer: l.NombreChofer || 'N/A (Particular)',
                nombreOrigen: l.NombreOrigen || 'Sin Origen',
                tipoOrigen: l.TipoOrigen || 'Sin Tipo',
                idTipoMaterial: l.IdTipoMaterial ?? 0,
                tipoMaterial: l.TipoMaterial || 'Sin Tipo',
                pesoBruto: parseFloat(l.PesoBruto ?? 0),
                observacionesIngreso: l.ObservacionesIngreso || '',
                pesoVerde: parseFloat(l.PesoVerde ?? 0),
                pesoAmarillo: parseFloat(l.PesoAmarillo ?? 0),
                pesoRojo: parseFloat(l.PesoRojo ?? 0),
                totalClasificado: parseFloat(l.TotalClasificado ?? 0),
                mermaODiferencia: parseFloat(l.MermaODiferencia ?? 0),
                porcentajeProcesado: parseFloat(l.PorcentajeProcesado ?? 0),
                estadoAuditoria: (l.EstadoAuditoria || 'PENDIENTE').toUpperCase(),
                clasificaciones: clasificaciones
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
                            <i class="fas fa-clipboard-check me-2"></i>Auditoría Granular de Lotes y Trazabilidad en Cinta
                        </h4>
                        <small class="text-muted">Flujo integral desde origen hasta semáforo de calidad, calendario de tortas diarias y detalle por lote</small>
                    </div>

                    <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded border">
                        <label class="small fw-bold mb-0">Desde:</label>
                        <input type="date" id="filtro-traz-aud-desde" class="form-control form-control-sm" style="width: auto;">

                        <label class="small fw-bold mb-0 ms-1">Hasta:</label>
                        <input type="date" id="filtro-traz-aud-hasta" class="form-control form-control-sm" style="width: auto;">

                        <label class="small fw-bold mb-0 ms-1">Material:</label>
                        <select id="filtro-traz-aud-material" class="form-select form-select-sm fw-semibold" style="width: auto; min-width: 150px;">
                            <option value="">Todos los Materiales</option>
                        </select>

                        <label class="small fw-bold mb-0 ms-1">Estado:</label>
                        <select id="filtro-traz-aud-estado" class="form-select form-select-sm fw-semibold" style="width: auto;">
                            <option value="">Todos</option>
                            <option value="COMPLETO">Completo</option>
                            <option value="PARCIAL">Parcial</option>
                            <option value="PENDIENTE">Pendiente</option>
                        </select>

                        <button id="btn-filtrar-traz-auditoria" class="btn btn-primary btn-sm ms-1">
                            <i class="fas fa-search"></i> Filtrar
                        </button>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2: 4 TARJETAS KPI EN ORDEN EXACTO SOLICITADO -->
            <div class="row g-3 mb-4 fade-in">
                <!-- KPI 1: Tarjeta Verde y Corona -> NombreOrigen con mayor PesoUtil x SemaforoEstado = Verde x Subtipo -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-success border-4 bg-success bg-opacity-10 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-success small fw-bold text-uppercase">
                                    <i class="fas fa-crown text-warning me-1"></i>Líder Calidad Verde
                                </span>
                                <span class="badge bg-success text-white p-2"><i class="fas fa-crown fa-lg"></i></span>
                            </div>
                            <h5 class="fw-bold text-dark mb-1 text-truncate" id="kpi-aud-1-origen">—</h5>
                            <div class="small fw-semibold text-success text-truncate" id="kpi-aud-1-subtipo">Subtipo: —</div>
                            <small class="text-muted" id="kpi-aud-1-kg">0,00 kg útiles verdes</small>
                        </div>
                    </div>
                </div>

                <!-- KPI 2: Mención Especial -> NombreOrigen con mayor PesoBruto y TipoMaterial -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-warning border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">
                                    <i class="fas fa-award text-warning me-1"></i>Mención Especial (Bruto)
                                </span>
                                <span class="badge bg-warning bg-opacity-10 text-warning p-2"><i class="fas fa-medal fa-lg"></i></span>
                            </div>
                            <h5 class="fw-bold text-dark mb-1 text-truncate" id="kpi-aud-2-origen">—</h5>
                            <div class="small fw-semibold text-primary text-truncate" id="kpi-aud-2-material">Material: —</div>
                            <small class="text-muted" id="kpi-aud-2-kg">0,00 kg brutos ingresados</small>
                        </div>
                    </div>
                </div>

                <!-- KPI 3: Tarjeta Roja -> NombreOrigen con mayor PesoUtil y SemaforoEstado = Rojo x Subtipo -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-danger border-4 bg-danger bg-opacity-10 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-danger small fw-bold text-uppercase">Alerta Descarte Rojo</span>
                                <span class="badge bg-danger text-white p-2"><i class="fas fa-exclamation-circle fa-lg"></i></span>
                            </div>
                            <h5 class="fw-bold text-dark mb-1 text-truncate" id="kpi-aud-3-origen">—</h5>
                            <div class="small fw-semibold text-danger text-truncate" id="kpi-aud-3-subtipo">Subtipo: —</div>
                            <small class="text-muted" id="kpi-aud-3-kg">0,00 kg descarte rojo</small>
                        </div>
                    </div>
                </div>

                <!-- KPI 4: Tarjeta Celeste -> NombreChofer con mayor PesoVerde x TipoMaterial -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-info border-4 bg-info bg-opacity-10 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-info text-emphasis small fw-bold text-uppercase">Chofer Destacado (Verde)</span>
                                <span class="badge bg-info text-white p-2"><i class="fas fa-truck fa-lg"></i></span>
                            </div>
                            <h5 class="fw-bold text-dark mb-1 text-truncate" id="kpi-aud-4-chofer">—</h5>
                            <div class="small fw-semibold text-info text-emphasis text-truncate" id="kpi-aud-4-material">Material: —</div>
                            <small class="text-muted" id="kpi-aud-4-kg">0,00 kg verdes transportados</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 3: GRÁFICO PRINCIPAL - SANKEY 3 NIVELES (ORIGEN -> MATERIAL [BRUTO] -> SEMÁFORO) -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-project-diagram text-primary me-2"></i>Trazabilidad de Flujo: Origen &rarr; Tipo Material (Peso Bruto) &rarr; Semáforo de Calidad
                                </h6>
                                <small class="text-muted">Conversión de masa desde los generadores hacia las familias de material y su resultado en cinta (Verde, Amarillo, Rojo)</small>
                            </div>
                            <span class="badge bg-light text-dark border">Pasá el cursor sobre un nodo o flujo para auditar kilos</span>
                        </div>
                        <div class="card-body">
                            <div id="msg-sin-datos-aud-sankey" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-project-diagram fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No hay lotes registrados para trazar el flujo Sankey en este período.</p>
                            </div>
                            <div id="echarts-aud-sankey" style="width: 100%; height: 540px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 4: GRÁFICO SECUNDARIO - CALENDAR PIE (ESTADOS DE COLORES POR CADA DÍA CON REGISTRO) -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-chart-pie text-success me-2"></i>Calendario de Clasificación por Semáforo (Calendar Pie)
                                </h6>
                                <small class="text-muted">Proporción diaria de estados Verde, Amarillo y Rojo en cada jornada con registro; pasá el mouse sobre una torta para auditar Subtipos</small>
                            </div>

                            <div class="d-flex align-items-center gap-2">
                                <label class="small fw-bold mb-0 text-muted">Mes visible:</label>
                                <select id="selector-mes-calendario-aud" class="form-select form-select-sm fw-semibold" style="width: auto; min-width: 165px;">
                                    <option value="">Sin fechas</option>
                                </select>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="msg-sin-datos-aud-calendario" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No se registraron clasificaciones con fecha en el rango seleccionado.</p>
                            </div>
                            <div id="echarts-aud-calendario" style="width: 100%; height: 550px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 5: TABLA MAESTRO-DETALLE DE LOTES AUDITADOS -->
            <div class="row fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-search-plus text-secondary me-2"></i>Registro Maestro-Detalle de Lotes Ingresados
                                </h6>
                                <small class="text-muted">Hacé clic en <span class="badge bg-light text-dark border">+</span> para desplegar las clasificaciones hijas, destinos y operadores de cada lote</small>
                            </div>

                            <div class="input-group input-group-sm" style="max-width: 280px;">
                                <span class="input-group-text bg-light"><i class="fas fa-search text-muted"></i></span>
                                <input type="text" id="buscador-tabla-auditoria" class="form-control" placeholder="Buscar lote, origen o patente...">
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th style="width: 44px;"></th>
                                            <th>Lote #</th>
                                            <th>Fecha Ingreso</th>
                                            <th>Origen / Canal</th>
                                            <th>Material</th>
                                            <th class="text-end">Bruto (kg)</th>
                                            <th class="text-end text-success">Verde</th>
                                            <th class="text-end text-warning">Amarillo</th>
                                            <th class="text-end text-danger">Rojo</th>
                                            <th class="text-center">Auditoría</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-traz-auditoria">
                                        <tr>
                                            <td colspan="10" class="text-center text-muted py-4">Cargando lotes auditados...</td>
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

        principal.off('click', '#btn-filtrar-traz-auditoria').on('click', '#btn-filtrar-traz-auditoria', function () {
            const desde = $('#filtro-traz-aud-desde').val();
            const hasta = $('#filtro-traz-aud-hasta').val();
            const idTipoMaterial = $('#filtro-traz-aud-material').val() || null;
            const estadoAuditoria = $('#filtro-traz-aud-estado').val() || null;

            if (!desde || !hasta) {
                Swal.fire('Fechas requeridas', 'Por favor seleccioná ambas fechas.', 'warning');
                return;
            }
            if (desde > hasta) {
                Swal.fire('Rango inválido', 'La fecha "Desde" no puede ser mayor a "Hasta".', 'warning');
                return;
            }

            consultarAuditoriaLotesApi(desde, hasta, idTipoMaterial, estadoAuditoria);
        });

        // Cambio de mes en el Calendar Pie
        principal.off('change', '#selector-mes-calendario-aud').on('change', '#selector-mes-calendario-aud', function () {
            const mes = $(this).val();
            if (mes) {
                estado.mesSeleccionadoCal = mes;
                renderizarCalendarPie(estado.diasCalendarioMap, mes);
            }
        });

        // Expandir / Colapsar detalle hijo en la tabla Maestro-Detalle
        principal.off('click', '.btn-expandir-lote').on('click', '.btn-expandir-lote', function () {
            const idLote = $(this).data('idlote');
            const filaDetalle = $(`#detalle-lote-${idLote}`);
            const icono = $(this).find('i');

            if (filaDetalle.hasClass('d-none')) {
                filaDetalle.removeClass('d-none');
                icono.removeClass('fa-plus').addClass('fa-minus');
            } else {
                filaDetalle.addClass('d-none');
                icono.removeClass('fa-minus').addClass('fa-plus');
            }
        });

        // Buscador instantáneo en tabla
        principal.off('input', '#buscador-tabla-auditoria').on('input', '#buscador-tabla-auditoria', function () {
            const termino = $(this).val().toLowerCase().trim();
            const filtrados = termino
                ? estado.lotes.filter(l =>
                    String(l.idDetalleIngreso).includes(termino) ||
                    l.nombreOrigen.toLowerCase().includes(termino) ||
                    l.tipoMaterial.toLowerCase().includes(termino) ||
                    l.patenteVehiculo.toLowerCase().includes(termino) ||
                    l.nombreChofer.toLowerCase().includes(termino)
                )
                : estado.lotes;

            renderizarTablaMaestroDetalle(filtrados);
        });

        // Responsividad limpia (recalcula también los centros [X, Y] del Calendar Pie)
        $(window).off('resize.trazAuditoria').on('resize.trazAuditoria', function () {
            if (estado.chartSankeyFlujo && !estado.chartSankeyFlujo.isDisposed()) {
                estado.chartSankeyFlujo.resize();
            }
            if (estado.chartCalendarioPie && !estado.chartCalendarioPie.isDisposed() && estado.mesSeleccionadoCal) {
                estado.chartCalendarioPie.resize();
                renderizarCalendarPie(estado.diasCalendarioMap, estado.mesSeleccionadoCal);
            }
        });
    };

    const cargarCatalogoTiposMaterial = function () {
        $.ajax({
            type: "GET",
            url: URL_POR_MATERIAL,
            data: { fechaDesde: '2020-01-01', fechaHasta: new Date().toISOString().split('T')[0] },
            success: function (res) {
                const select = $('#filtro-traz-aud-material');
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

        $('#filtro-traz-aud-hasta').val(hoy.toISOString().split('T')[0]);
        $('#filtro-traz-aud-desde').val(primerDiaAnio.toISOString().split('T')[0]);

        $('#btn-filtrar-traz-auditoria').trigger('click');
    };

    // 3. CONSULTA A LA API C#
    const consultarAuditoriaLotesApi = function (fechaDesde, fechaHasta, idTipoMaterial, estadoAuditoria) {
        const btn = $('#btn-filtrar-traz-auditoria');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

        const params = { fechaDesde: fechaDesde, fechaHasta: fechaHasta };
        if (idTipoMaterial) params.idTipoMaterial = idTipoMaterial;
        if (estadoAuditoria) params.estadoAuditoria = estadoAuditoria;

        $.ajax({
            type: "GET",
            url: URL_AUDITORIA_LOTES,
            data: params,
            success: function (respuesta) {
                estado.lotes = normalizarLotes(respuesta);
                $('#buscador-tabla-auditoria').val('');

                renderizarKPIs(estado.lotes);
                renderizarSankeyAuditoria(estado.lotes);
                prepararYRenderizarCalendario(estado.lotes);
                renderizarTablaMaestroDetalle(estado.lotes);
            },
            error: function (err) {
                console.error("Error al obtener AuditoriaLotes de Trazabilidad:", err);
                Swal.fire('Error de conexión', 'No se pudo obtener la auditoría de lotes desde el servidor.', 'error');
            },
            complete: function () {
                btn.prop('disabled', false).html('<i class="fas fa-search"></i> Filtrar');
            }
        });
    };

    // 4. RENDERIZADO DE LAS 4 TARJETAS KPI EN EL ORDEN REQUERIDO
    const renderizarKPIs = function (lotes) {
        const limpiarKpis = () => {
            $('#kpi-aud-1-origen').text('Sin datos');
            $('#kpi-aud-1-subtipo').text('Subtipo: —');
            $('#kpi-aud-1-kg').text('0,00 kg útiles verdes');

            $('#kpi-aud-2-origen').text('Sin datos');
            $('#kpi-aud-2-material').text('Material: —');
            $('#kpi-aud-2-kg').text('0,00 kg brutos ingresados');

            $('#kpi-aud-3-origen').text('Sin datos');
            $('#kpi-aud-3-subtipo').text('Subtipo: —');
            $('#kpi-aud-3-kg').text('0,00 kg descarte rojo');

            $('#kpi-aud-4-chofer').text('Sin datos');
            $('#kpi-aud-4-material').text('Material: —');
            $('#kpi-aud-4-kg').text('0,00 kg verdes transportados');
        };

        if (!lotes || lotes.length === 0) {
            limpiarKpis();
            return;
        }

        const mapVerdeOrigenSubtipo = new Map();
        const mapBrutoOrigenMaterial = new Map();
        const mapRojoOrigenSubtipo = new Map();
        const mapVerdeChoferMaterial = new Map();

        lotes.forEach(l => {
            // KPI 2: NombreOrigen x TipoMaterial -> PesoBruto
            const keyOrigMat = `${l.nombreOrigen}|||${l.tipoMaterial}`;
            const accOM = mapBrutoOrigenMaterial.get(keyOrigMat) || {
                nombreOrigen: l.nombreOrigen,
                tipoMaterial: l.tipoMaterial,
                pesoBruto: 0
            };
            accOM.pesoBruto += l.pesoBruto;
            mapBrutoOrigenMaterial.set(keyOrigMat, accOM);

            // KPI 4: NombreChofer x TipoMaterial -> PesoVerde
            const keyChofMat = `${l.nombreChofer}|||${l.tipoMaterial}`;
            const accCM = mapVerdeChoferMaterial.get(keyChofMat) || {
                nombreChofer: l.nombreChofer,
                tipoMaterial: l.tipoMaterial,
                pesoVerde: 0
            };
            accCM.pesoVerde += l.pesoVerde;
            mapVerdeChoferMaterial.set(keyChofMat, accCM);

            // KPI 1 y KPI 3: Clasificaciones hijas (PesoUtil x SemaforoEstado x Subtipo)
            (l.clasificaciones || []).forEach(c => {
                const esVerde = c.idEstadoMaterial === 1 || c.semaforoEstado.toLowerCase().includes('verde');
                const esRojo = c.idEstadoMaterial === 3 || c.semaforoEstado.toLowerCase().includes('rojo');

                if (esVerde) {
                    const keyVS = `${l.nombreOrigen}|||${c.subtipo}`;
                    const accVS = mapVerdeOrigenSubtipo.get(keyVS) || {
                        nombreOrigen: l.nombreOrigen,
                        subtipo: c.subtipo,
                        pesoUtil: 0
                    };
                    accVS.pesoUtil += c.pesoUtil;
                    mapVerdeOrigenSubtipo.set(keyVS, accVS);
                }

                if (esRojo) {
                    const keyRS = `${l.nombreOrigen}|||${c.subtipo}`;
                    const accRS = mapRojoOrigenSubtipo.get(keyRS) || {
                        nombreOrigen: l.nombreOrigen,
                        subtipo: c.subtipo,
                        pesoUtil: 0
                    };
                    accRS.pesoUtil += c.pesoUtil;
                    mapRojoOrigenSubtipo.set(keyRS, accRS);
                }
            });
        });

        // 1. Tarjeta Verde y Corona: NombreOrigen con mayor PesoUtil x SemaforoEstado = Verde x Subtipo
        const top1 = Array.from(mapVerdeOrigenSubtipo.values()).sort((a, b) => b.pesoUtil - a.pesoUtil)[0];
        if (top1 && top1.pesoUtil > 0) {
            $('#kpi-aud-1-origen').text(top1.nombreOrigen).attr('title', top1.nombreOrigen);
            $('#kpi-aud-1-subtipo').text(`Subtipo: ${top1.subtipo}`).attr('title', top1.subtipo);
            $('#kpi-aud-1-kg').text(`${formatearKg(top1.pesoUtil)} kg útiles verdes`);
        } else {
            $('#kpi-aud-1-origen').text('Sin registros verdes');
            $('#kpi-aud-1-subtipo').text('Subtipo: —');
            $('#kpi-aud-1-kg').text('0,00 kg útiles verdes');
        }

        // 2. Mención Especial: NombreOrigen con mayor PesoBruto y TipoMaterial
        const top2 = Array.from(mapBrutoOrigenMaterial.values()).sort((a, b) => b.pesoBruto - a.pesoBruto)[0];
        if (top2 && top2.pesoBruto > 0) {
            $('#kpi-aud-2-origen').text(top2.nombreOrigen).attr('title', top2.nombreOrigen);
            $('#kpi-aud-2-material').text(`Material: ${top2.tipoMaterial}`).attr('title', top2.tipoMaterial);
            $('#kpi-aud-2-kg').text(`${formatearKg(top2.pesoBruto)} kg brutos ingresados`);
        }

        // 3. Tarjeta Roja: NombreOrigen con mayor PesoUtil y SemaforoEstado = Rojo x Subtipo
        const top3 = Array.from(mapRojoOrigenSubtipo.values()).sort((a, b) => b.pesoUtil - a.pesoUtil)[0];
        if (top3 && top3.pesoUtil > 0) {
            $('#kpi-aud-3-origen').text(top3.nombreOrigen).attr('title', top3.nombreOrigen);
            $('#kpi-aud-3-subtipo').text(`Subtipo: ${top3.subtipo}`).attr('title', top3.subtipo);
            $('#kpi-aud-3-kg').text(`${formatearKg(top3.pesoUtil)} kg de descarte rojo`);
        } else {
            $('#kpi-aud-3-origen').text('Sin descarte rojo');
            $('#kpi-aud-3-subtipo').text('Subtipo: —');
            $('#kpi-aud-3-kg').text('0,00 kg descarte rojo');
        }

        // 4. Tarjeta Celeste: NombreChofer con mayor PesoVerde x TipoMaterial
        const todosChoferes = Array.from(mapVerdeChoferMaterial.values()).filter(x => x.pesoVerde > 0);
        const choferesReales = todosChoferes.filter(x => !x.nombreChofer.toLowerCase().includes('n/a'));
        const candidatosChofer = choferesReales.length > 0 ? choferesReales : todosChoferes;
        const top4 = candidatosChofer.sort((a, b) => b.pesoVerde - a.pesoVerde)[0];

        if (top4) {
            $('#kpi-aud-4-chofer').text(top4.nombreChofer).attr('title', top4.nombreChofer);
            $('#kpi-aud-4-material').text(`Material: ${top4.tipoMaterial}`).attr('title', top4.tipoMaterial);
            $('#kpi-aud-4-kg').text(`${formatearKg(top4.pesoVerde)} kg útiles verdes`);
        } else {
            $('#kpi-aud-4-chofer').text('Sin datos verdes');
            $('#kpi-aud-4-material').text('Material: —');
            $('#kpi-aud-4-kg').text('0,00 kg verdes transportados');
        }
    };

    // 5. GRÁFICO PRINCIPAL: SANKEY 3 NIVELES (ORIGEN -> MATERIAL [PESO BRUTO] -> SEMÁFORO)
    const renderizarSankeyAuditoria = function (lotes) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-aud-sankey');
        const msgSinDatos = $('#msg-sin-datos-aud-sankey');

        const validos = (lotes || []).filter(l => l.pesoBruto > 0);

        if (validos.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        if (!estado.chartSankeyFlujo || estado.chartSankeyFlujo.isDisposed()) {
            estado.chartSankeyFlujo = echarts.init(dom);
        }

        const brutoPorOrigen = new Map();
        validos.forEach(l => {
            brutoPorOrigen.set(l.nombreOrigen, (brutoPorOrigen.get(l.nombreOrigen) || 0) + l.pesoBruto);
        });
        const topOrigenesSet = new Set(
            Array.from(brutoPorOrigen.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 12)
                .map(entry => entry[0])
        );

        const enlacesOrigenMaterial = new Map();
        const enlacesMaterialSemaforo = new Map();
        const materialesSet = new Set();
        const origenesFinalesSet = new Set();

        validos.forEach(l => {
            const origenNodo = topOrigenesSet.has(l.nombreOrigen) ? l.nombreOrigen : 'Otros Orígenes';
            origenesFinalesSet.add(origenNodo);
            materialesSet.add(l.tipoMaterial);

            // Tramo 1: NombreOrigen -> TipoMaterial (PesoBruto)
            const keyOM = `${origenNodo}|||${l.tipoMaterial}`;
            enlacesOrigenMaterial.set(keyOM, (enlacesOrigenMaterial.get(keyOM) || 0) + l.pesoBruto);

            // Tramo 2: TipoMaterial -> PesoVerde, PesoAmarillo, PesoRojo
            if (l.pesoVerde > 0) {
                const kV = `${l.tipoMaterial}|||E_VERDE`;
                enlacesMaterialSemaforo.set(kV, (enlacesMaterialSemaforo.get(kV) || 0) + l.pesoVerde);
            }
            if (l.pesoAmarillo > 0) {
                const kA = `${l.tipoMaterial}|||E_AMARILLO`;
                enlacesMaterialSemaforo.set(kA, (enlacesMaterialSemaforo.get(kA) || 0) + l.pesoAmarillo);
            }
            if (l.pesoRojo > 0) {
                const kR = `${l.tipoMaterial}|||E_ROJO`;
                enlacesMaterialSemaforo.set(kR, (enlacesMaterialSemaforo.get(kR) || 0) + l.pesoRojo);
            }
        });

        const nodos = [];
        const links = [];

        let idxColor = 0;
        Array.from(origenesFinalesSet).forEach(orig => {
            const color = orig === 'Otros Orígenes'
                ? '#adb5bd'
                : PALETA_ORIGENES[idxColor++ % PALETA_ORIGENES.length];
            nodos.push({
                name: `O_${orig}`,
                displayName: orig,
                nivel: 'Origen',
                itemStyle: { color: color, borderColor: color }
            });
        });

        Array.from(materialesSet).forEach(mat => {
            nodos.push({
                name: `M_${mat}`,
                displayName: mat,
                nivel: 'Material (Bruto)',
                itemStyle: { color: '#495057', borderColor: '#343a40' }
            });
        });

        const defSemaforo = [
            { id: 'E_VERDE', label: 'Útil (Verde)', color: '#198754' },
            { id: 'E_AMARILLO', label: 'Revisión (Amarillo)', color: '#ffc107' },
            { id: 'E_ROJO', label: 'Descarte (Rojo)', color: '#dc3545' }
        ];

        const estadosConFlujo = new Set();
        enlacesMaterialSemaforo.forEach((val, key) => {
            if (val > 0) estadosConFlujo.add(key.split('|||')[1]);
        });

        defSemaforo.forEach(sem => {
            if (estadosConFlujo.has(sem.id)) {
                nodos.push({
                    name: sem.id,
                    displayName: sem.label,
                    nivel: 'Clasificación Final',
                    itemStyle: { color: sem.color, borderColor: sem.color }
                });
            }
        });

        enlacesOrigenMaterial.forEach((peso, key) => {
            if (peso > 0) {
                const [orig, mat] = key.split('|||');
                links.push({
                    source: `O_${orig}`,
                    target: `M_${mat}`,
                    value: Number(peso.toFixed(2)),
                    origenTxt: orig,
                    destinoTxt: mat,
                    etapa: 'Peso Bruto Ingresado'
                });
            }
        });

        enlacesMaterialSemaforo.forEach((peso, key) => {
            if (peso > 0) {
                const [mat, idEst] = key.split('|||');
                const semInfo = defSemaforo.find(s => s.id === idEst);
                links.push({
                    source: `M_${mat}`,
                    target: idEst,
                    value: Number(peso.toFixed(2)),
                    origenTxt: mat,
                    destinoTxt: semInfo ? semInfo.label : idEst,
                    etapa: 'Peso Clasificado',
                    lineStyle: {
                        color: semInfo ? semInfo.color : 'source',
                        opacity: 0.45
                    }
                });
            }
        });

        const option = {
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove',
                formatter: function (p) {
                    if (p.dataType === 'edge') {
                        const e = p.data;
                        return `
                            <span class="badge bg-light text-dark border mb-1">${e.etapa}</span><br/>
                            <strong>${e.origenTxt}</strong> <i class="fas fa-arrow-right mx-1 text-muted"></i> <strong>${e.destinoTxt}</strong><br/>
                            Masa: <strong>${formatearKg(e.value)} kg</strong>
                        `;
                    } else {
                        const n = p.data;
                        return `
                            <span class="badge bg-secondary mb-1">${n.nivel}</span><br/>
                            <strong>${n.displayName}</strong><br/>
                            Volumen Total: <strong>${formatearKg(p.value)} kg</strong>
                        `;
                    }
                }
            },
            toolbox: {
                show: true,
                right: 15,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar Sankey HD', pixelRatio: 2 }
                }
            },
            series: [
                {
                    type: 'sankey',
                    left: '2%',
                    right: '18%',
                    top: 25,
                    bottom: 20,
                    nodeWidth: 18,
                    nodeGap: 14,
                    draggable: false,
                    emphasis: {
                        focus: 'adjacency'
                    },
                    label: {
                        color: '#212529',
                        fontWeight: 'bold',
                        fontSize: 12,
                        formatter: function (p) {
                            return `${p.data.displayName} (${formatearKgCorto(p.value)})`;
                        }
                    },
                    lineStyle: {
                        color: 'source',
                        curveness: 0.5,
                        opacity: 0.38
                    },
                    data: nodos,
                    links: links
                }
            ]
        };

        estado.chartSankeyFlujo.setOption(option, true);
    };

    // 6. GRÁFICO SECUNDARIO: CALENDAR PIE (ESTADOS DE COLORES POR CADA DÍA CON REGISTRO)
    const prepararYRenderizarCalendario = function (lotes) {
        const diasMap = {};
        const mesesSet = new Set();

        (lotes || []).forEach(l => {
            (l.clasificaciones || []).forEach(c => {
                if (!c.fechaDia || c.pesoUtil <= 0) return;

                if (!diasMap[c.fechaDia]) {
                    diasMap[c.fechaDia] = {
                        fecha: c.fechaDia,
                        verde: 0,
                        amarillo: 0,
                        rojo: 0,
                        total: 0,
                        items: []
                    };
                }

                const registroDia = diasMap[c.fechaDia];
                const esVerde = c.idEstadoMaterial === 1 || c.semaforoEstado.toLowerCase().includes('verde');
                const esAmarillo = c.idEstadoMaterial === 2 || c.semaforoEstado.toLowerCase().includes('amarillo');
                const esRojo = c.idEstadoMaterial === 3 || c.semaforoEstado.toLowerCase().includes('rojo');

                if (esVerde) registroDia.verde += c.pesoUtil;
                else if (esAmarillo) registroDia.amarillo += c.pesoUtil;
                else if (esRojo) registroDia.rojo += c.pesoUtil;

                registroDia.total += c.pesoUtil;
                registroDia.items.push({
                    subtipo: c.subtipo,
                    pesoUtil: c.pesoUtil,
                    semaforo: esVerde ? 'Verde' : (esAmarillo ? 'Amarillo' : (esRojo ? 'Rojo' : c.semaforoEstado))
                });

                mesesSet.add(c.fechaDia.substring(0, 7)); // YYYY-MM
            });
        });

        estado.diasCalendarioMap = diasMap;

        const selectorMes = $('#selector-mes-calendario-aud').empty();
        const mesesOrdenados = Array.from(mesesSet).sort().reverse();

        if (mesesOrdenados.length === 0) {
            selectorMes.append('<option value="">Sin clasificaciones</option>');
            $('#echarts-aud-calendario').addClass('d-none');
            $('#msg-sin-datos-aud-calendario').removeClass('d-none');
            return;
        }

        const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        mesesOrdenados.forEach(ym => {
            const [anio, mesStr] = ym.split('-');
            const nombreMes = nombresMeses[parseInt(mesStr, 10) - 1] || mesStr;
            selectorMes.append(`<option value="${ym}">${nombreMes} ${anio}</option>`);
        });

        const mesInicial = mesesOrdenados[0];
        estado.mesSeleccionadoCal = mesInicial;
        selectorMes.val(mesInicial);

        renderizarCalendarPie(diasMap, mesInicial);
    };

    const construirTooltipDia = function (info) {
        const [y, m, d] = info.fecha.split('-');
        const pctV = info.total > 0 ? (info.verde * 100 / info.total).toFixed(1) : '0.0';
        const pctA = info.total > 0 ? (info.amarillo * 100 / info.total).toFixed(1) : '0.0';
        const pctR = info.total > 0 ? (info.rojo * 100 / info.total).toFixed(1) : '0.0';

        let html = `
            <strong>Fecha Clasificación: ${d}/${m}/${y}</strong><br/>
            <div class="my-1">
                <span class="badge bg-success">Verde: ${formatearKg(info.verde)} kg (${pctV}%)</span>
                <span class="badge bg-warning text-dark">Amarillo: ${formatearKg(info.amarillo)} kg (${pctA}%)</span>
                <span class="badge bg-danger">Rojo: ${formatearKg(info.rojo)} kg (${pctR}%)</span>
            </div>
            <hr class="my-1"/>
            <small class="fw-bold text-muted">Subtipos clasificados en el día:</small><br/>
        `;

        const agrupadoDia = new Map();
        info.items.forEach(it => {
            const k = `${it.subtipo}|||${it.semaforo}`;
            agrupadoDia.set(k, (agrupadoDia.get(k) || 0) + it.pesoUtil);
        });

        Array.from(agrupadoDia.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .forEach(([k, kg]) => {
                const [sub, sem] = k.split('|||');
                const colorPunto = sem === 'Verde' ? '#198754' : (sem === 'Amarillo' ? '#ffc107' : '#dc3545');
                html += `<span style="color:${colorPunto};">●</span> <strong>${sub}</strong> (${sem}): ${formatearKg(kg)} kg<br/>`;
            });

        if (agrupadoDia.size > 8) {
            html += `<small class="text-muted">...y ${agrupadoDia.size - 8} registros más</small>`;
        }

        return html;
    };

    const renderizarCalendarPie = function (diasMap, yearMonth) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-aud-calendario');
        const msgSinDatos = $('#msg-sin-datos-aud-calendario');

        const fechasMesConRegistro = Object.keys(diasMap).filter(f => f.startsWith(yearMonth) && diasMap[f].total > 0);

        if (fechasMesConRegistro.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        if (!estado.chartCalendarioPie || estado.chartCalendarioPie.isDisposed()) {
            estado.chartCalendarioPie = echarts.init(dom);
        }

        // Todos los días del mes para dibujar los números de día en cada celda
        const [anioStr, mesStr] = yearMonth.split('-');
        const anio = parseInt(anioStr, 10);
        const mes = parseInt(mesStr, 10);
        const ultimoDiaMes = new Date(anio, mes, 0).getDate();

        const celdasNumeros = [];
        for (let d = 1; d <= ultimoDiaMes; d++) {
            const fechaStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
            const tieneDatos = Boolean(diasMap[fechaStr] && diasMap[fechaStr].total > 0);
            celdasNumeros.push({
                value: [fechaStr, d],
                tieneDatos: tieneDatos
            });
        }

        const serieNumerosDias = {
            id: 'numeros-dias-calendario',
            type: 'scatter',
            coordinateSystem: 'calendar',
            symbolSize: 0,
            silent: true,
            label: {
                show: true,
                offset: [0, -28],
                formatter: function (p) {
                    return String(p.value[1]);
                },
                color: '#495057',
                fontWeight: 'bold',
                fontSize: 12
            },
            data: celdasNumeros
        };

        // Paso 1: Renderizamos la grilla del calendario + números de día para obtener sus coordenadas en píxeles
        const opcionBase = {
            tooltip: {
                trigger: 'item',
                confine: true
            },
            legend: {
                top: 5,
                left: 'center',
                data: ['Útil (Verde)', 'Revisión (Amarillo)', 'Descarte (Rojo)']
            },
            toolbox: {
                show: true,
                right: 15,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar Calendar Pie HD', pixelRatio: 2 }
                }
            },
            calendar: {
                top: 65,
                left: 35,
                right: 25,
                bottom: 20,
                orient: 'vertical',
                cellSize: ['auto', 78],
                range: yearMonth,
                splitLine: {
                    show: true,
                    lineStyle: { color: '#dee2e6', width: 1.5 }
                },
                itemStyle: {
                    color: '#ffffff',
                    borderColor: '#e9ecef',
                    borderWidth: 1
                },
                dayLabel: {
                    firstDay: 1,
                    nameMap: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                    fontWeight: 'bold',
                    color: '#495057'
                },
                monthLabel: { show: false },
                yearLabel: { show: false }
            },
            series: [serieNumerosDias]
        };

        estado.chartCalendarioPie.setOption(opcionBase, true);

        // Paso 2: Estampamos una torta (Pie) únicamente en los días con registro usando convertToPixel
        const seriesTortas = fechasMesConRegistro.map(fechaStr => {
            const info = diasMap[fechaStr];
            const puntoPx = estado.chartCalendarioPie.convertToPixel({ calendarIndex: 0 }, fechaStr);

            if (!puntoPx || isNaN(puntoPx[0]) || isNaN(puntoPx[1])) return null;

            const porciones = [];
            if (info.verde > 0) {
                porciones.push({
                    name: 'Útil (Verde)',
                    value: Number(info.verde.toFixed(2)),
                    itemStyle: { color: '#198754' }
                });
            }
            if (info.amarillo > 0) {
                porciones.push({
                    name: 'Revisión (Amarillo)',
                    value: Number(info.amarillo.toFixed(2)),
                    itemStyle: { color: '#ffc107' }
                });
            }
            if (info.rojo > 0) {
                porciones.push({
                    name: 'Descarte (Rojo)',
                    value: Number(info.rojo.toFixed(2)),
                    itemStyle: { color: '#dc3545' }
                });
            }

            return {
                id: `pie-dia-${fechaStr}`,
                type: 'pie',
                center: [puntoPx[0], puntoPx[1] + 7],
                radius: 21,
                label: { show: false },
                labelLine: { show: false },
                itemStyle: {
                    borderColor: '#ffffff',
                    borderWidth: 1
                },
                emphasis: {
                    scale: true,
                    scaleSize: 4
                },
                tooltip: {
                    trigger: 'item',
                    confine: true,
                    formatter: function () {
                        return construirTooltipDia(info);
                    }
                },
                data: porciones
            };
        }).filter(Boolean);

        estado.chartCalendarioPie.setOption({
            series: [serieNumerosDias, ...seriesTortas]
        });
    };

    // 7. TABLA MAESTRO-DETALLE DE LOTES AUDITADOS
    const renderizarTablaMaestroDetalle = function (lotes) {
        const tbody = $('#tbody-traz-auditoria').empty();

        if (!lotes || lotes.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="10" class="text-center text-muted py-4">
                        <i class="fas fa-folder-open me-2"></i>No se encontraron lotes que coincidan con los filtros seleccionados.
                    </td>
                </tr>
            `);
            return;
        }

        lotes.forEach(l => {
            const tieneHijos = l.clasificaciones && l.clasificaciones.length > 0;
            const badgeEstado = l.estadoAuditoria === 'COMPLETO'
                ? '<span class="badge bg-success">COMPLETO</span>'
                : (l.estadoAuditoria === 'PARCIAL'
                    ? '<span class="badge bg-warning text-dark">PARCIAL</span>'
                    : '<span class="badge bg-secondary">PENDIENTE</span>');

            const btnExpandir = tieneHijos
                ? `<button class="btn btn-sm btn-outline-primary btn-expandir-lote py-0 px-2" data-idlote="${l.idDetalleIngreso}" title="Ver clasificaciones hijas (${l.clasificaciones.length})">
                       <i class="fas fa-plus"></i>
                   </button>`
                : `<span class="text-muted small" title="Sin clasificaciones">—</span>`;

            tbody.append(`
                <tr>
                    <td class="text-center">${btnExpandir}</td>
                    <td class="fw-bold text-primary">#${l.idDetalleIngreso}</td>
                    <td class="small">${formatearFechaHora(l.fechaIngreso)}</td>
                    <td>
                        <div class="fw-bold text-dark">${l.nombreOrigen}</div>
                        <small class="text-muted">${l.canalIngreso} ${l.patenteVehiculo !== 'Sin Patente' ? '· ' + l.patenteVehiculo : ''}</small>
                    </td>
                    <td><span class="badge bg-light text-dark border">${l.tipoMaterial}</span></td>
                    <td class="text-end fw-bold">${formatearKg(l.pesoBruto)} kg</td>
                    <td class="text-end text-success fw-semibold">${formatearKg(l.pesoVerde)} kg</td>
                    <td class="text-end text-warning fw-semibold">${formatearKg(l.pesoAmarillo)} kg</td>
                    <td class="text-end text-danger fw-semibold">${formatearKg(l.pesoRojo)} kg</td>
                    <td class="text-center">${badgeEstado}</td>
                </tr>
            `);

            if (tieneHijos) {
                let filasHijas = l.clasificaciones.map(c => {
                    const colorSem = c.idEstadoMaterial === 1
                        ? 'bg-success'
                        : (c.idEstadoMaterial === 2 ? 'bg-warning text-dark' : 'bg-danger');

                    return `
                        <tr>
                            <td class="small text-muted">#${c.idClasificacion}</td>
                            <td class="small">${formatearFechaHora(c.fechaClasificacion)}</td>
                            <td class="fw-semibold">${c.subtipo}</td>
                            <td><span class="badge ${colorSem}">${c.semaforoEstado}</span></td>
                            <td class="text-end fw-bold">${formatearKg(c.pesoUtil)} kg</td>
                            <td class="small">${c.nombreDestino}</td>
                            <td class="small text-muted">${c.operadorClasificador}</td>
                        </tr>
                    `;
                }).join('');

                tbody.append(`
                    <tr id="detalle-lote-${l.idDetalleIngreso}" class="d-none bg-light">
                        <td colspan="10" class="p-3">
                            <div class="card border shadow-none mb-0">
                                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                    <span class="small fw-bold text-primary">
                                        <i class="fas fa-sitemap me-1"></i>Desglose de Clasificación del Lote #${l.idDetalleIngreso} (${l.clasificaciones.length} registros)
                                    </span>
                                    <span class="small text-muted">Chofer: <strong>${l.nombreChofer}</strong> | Procesado: <strong>${l.porcentajeProcesado}%</strong></span>
                                </div>
                                <div class="table-responsive">
                                    <table class="table table-sm mb-0">
                                        <thead class="table-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Fecha Clasif.</th>
                                                <th>Subtipo</th>
                                                <th>Semáforo</th>
                                                <th class="text-end">Peso Útil</th>
                                                <th>Destino</th>
                                                <th>Operador</th>
                                            </tr>
                                        </thead>
                                        <tbody>${filasHijas}</tbody>
                                    </table>
                                </div>
                            </div>
                        </td>
                    </tr>
                `);
            }
        });
    };

    // API Pública del Módulo
    return {
        cargarEn: inicializar
    };
})();











// /* ========================================================================
//    SITMAS - Módulo de Reportes de Trazabilidad: Auditoría Granular de Lotes
//    Consume: GET /api/ReportesTrazabilidad/AuditoriaLotes
//    DTO C#: { Lotes: [ { ..., Clasificaciones: [...] } ] }
//    Incluye: 4 KPIs Específicos + Sankey 3 Niveles + Custom Calendar Icon + Maestro-Detalle
//    Archivo: Js/reportes_trazabilidad/reporte_traz_auditoria.js
//    ======================================================================== */

// const ReporteTrazAuditoriaModulo = (function () {
//     // 🔒 ESTADO PRIVADO
//     let estado = {
//         lotes: [],
//         diasCalendarioMap: {},
//         mesSeleccionadoCal: '',
//         chartSankeyFlujo: null,
//         chartCalendarioCustom: null
//     };

//     const URL_AUDITORIA_LOTES = "https://localhost:44325/api/ReportesTrazabilidad/AuditoriaLotes";
//     const URL_POR_MATERIAL = "https://localhost:44325/api/ReportesTrazabilidad/PorMaterial";

//     const PALETA_ORIGENES = [
//         '#0d6efd', '#6f42c1', '#20c997', '#fd7e14',
//         '#0dcaf0', '#d63384', '#6610f2', '#198754'
//     ];

//     // Helpers de formateo regional (es-AR)
//     const formatearKg = function (valor) {
//         const num = parseFloat(valor || 0);
//         return num.toLocaleString('es-AR', {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2
//         });
//     };

//     const formatearKgCorto = function (valor) {
//         const num = parseFloat(valor || 0);
//         if (num >= 1000) {
//             return (num / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + 't';
//         }
//         return num.toLocaleString('es-AR', { maximumFractionDigits: 0 }) + 'kg';
//     };

//     const formatearFechaHora = function (fechaIso) {
//         if (!fechaIso) return '—';
//         const d = new Date(fechaIso);
//         if (isNaN(d.getTime())) return '—';
//         return d.toLocaleDateString('es-AR', {
//             day: '2-digit',
//             month: '2-digit',
//             year: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit'
//         });
//     };

//     // Normaliza la clave de fecha YYYY-MM-DD sin desfase por zona horaria
//     const extraerFechaIsoDia = function (fechaRaw) {
//         if (!fechaRaw) return null;
//         if (typeof fechaRaw === 'string' && fechaRaw.length >= 10) {
//             return fechaRaw.substring(0, 10);
//         }
//         const d = new Date(fechaRaw);
//         if (isNaN(d.getTime())) return null;
//         return d.toISOString().substring(0, 10);
//     };

//     // Limpieza segura de instancias ECharts al cambiar de pestaña en la SPA
//     const destruirGraficosActivos = function () {
//         ['chartSankeyFlujo', 'chartCalendarioCustom'].forEach(key => {
//             if (estado[key] && !estado[key].isDisposed()) {
//                 estado[key].dispose();
//             }
//             estado[key] = null;
//         });
//     };

//     // Normalizador alineado 1 a 1 con TrazabilidadAuditoriaResponseDTO de C#
//     const normalizarLotes = function (respuesta) {
//         const listaRaw = Array.isArray(respuesta)
//             ? respuesta
//             : (respuesta?.Lotes || respuesta?.lotes || []);

//         return listaRaw.map(l => {
//             const clasifsRaw = l.Clasificaciones || l.clasificaciones || [];
//             const clasificaciones = clasifsRaw.map(c => ({
//                 idClasificacion: c.IdClasificacion ?? 0,
//                 idDetalleIngreso: c.IdDetalleIngreso ?? l.IdDetalleIngreso ?? 0,
//                 fechaClasificacion: c.FechaClasificacion || null,
//                 fechaDia: extraerFechaIsoDia(c.FechaClasificacion),
//                 subtipo: c.Subtipo || 'Sin Subtipo',
//                 pesoUtil: parseFloat(c.PesoUtil ?? 0),
//                 idEstadoMaterial: parseInt(c.IdEstadoMaterial ?? 0, 10),
//                 semaforoEstado: c.SemaforoEstado || 'Sin Estado',
//                 nombreDestino: c.NombreDestino || 'Sin Destino',
//                 operadorClasificador: c.OperadorClasificador || 'Sin Operador'
//             }));

//             return {
//                 idDetalleIngreso: l.IdDetalleIngreso ?? 0,
//                 fechaIngreso: l.FechaIngreso || null,
//                 canalIngreso: l.CanalIngreso || 'Sin Canal',
//                 idCabeceraIngreso: l.IdCabeceraIngreso ?? null,
//                 idHojaRuta: l.IdHojaRuta ?? null,
//                 patenteVehiculo: l.PatenteVehiculo || 'Sin Patente',
//                 nombreChofer: l.NombreChofer || 'N/A (Particular)',
//                 nombreOrigen: l.NombreOrigen || 'Sin Origen',
//                 tipoOrigen: l.TipoOrigen || 'Sin Tipo',
//                 idTipoMaterial: l.IdTipoMaterial ?? 0,
//                 tipoMaterial: l.TipoMaterial || 'Sin Tipo',
//                 pesoBruto: parseFloat(l.PesoBruto ?? 0),
//                 observacionesIngreso: l.ObservacionesIngreso || '',
//                 pesoVerde: parseFloat(l.PesoVerde ?? 0),
//                 pesoAmarillo: parseFloat(l.PesoAmarillo ?? 0),
//                 pesoRojo: parseFloat(l.PesoRojo ?? 0),
//                 totalClasificado: parseFloat(l.TotalClasificado ?? 0),
//                 mermaODiferencia: parseFloat(l.MermaODiferencia ?? 0),
//                 porcentajeProcesado: parseFloat(l.PorcentajeProcesado ?? 0),
//                 estadoAuditoria: (l.EstadoAuditoria || 'PENDIENTE').toUpperCase(),
//                 clasificaciones: clasificaciones
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
//                             <i class="fas fa-clipboard-check me-2"></i>Auditoría Granular de Lotes y Trazabilidad en Cinta
//                         </h4>
//                         <small class="text-muted">Flujo integral desde origen hasta semáforo de calidad, calendario diario de clasificación y detalle por lote</small>
//                     </div>

//                     <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded border">
//                         <label class="small fw-bold mb-0">Desde:</label>
//                         <input type="date" id="filtro-traz-aud-desde" class="form-control form-control-sm" style="width: auto;">

//                         <label class="small fw-bold mb-0 ms-1">Hasta:</label>
//                         <input type="date" id="filtro-traz-aud-hasta" class="form-control form-control-sm" style="width: auto;">

//                         <label class="small fw-bold mb-0 ms-1">Material:</label>
//                         <select id="filtro-traz-aud-material" class="form-select form-select-sm fw-semibold" style="width: auto; min-width: 150px;">
//                             <option value="">Todos los Materiales</option>
//                         </select>

//                         <label class="small fw-bold mb-0 ms-1">Estado:</label>
//                         <select id="filtro-traz-aud-estado" class="form-select form-select-sm fw-semibold" style="width: auto;">
//                             <option value="">Todos</option>
//                             <option value="COMPLETO">Completo</option>
//                             <option value="PARCIAL">Parcial</option>
//                             <option value="PENDIENTE">Pendiente</option>
//                         </select>

//                         <button id="btn-filtrar-traz-auditoria" class="btn btn-primary btn-sm ms-1">
//                             <i class="fas fa-search"></i> Filtrar
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 2: 4 TARJETAS KPI EN ORDEN EXACTO SOLICITADO -->
//             <div class="row g-3 mb-4 fade-in">
//                 <!-- KPI 1: Tarjeta Verde y Corona -> NombreOrigen con mayor PesoUtil x SemaforoEstado = Verde x Subtipo -->
//                 <div class="col-12 col-sm-6 col-xl-3">
//                     <div class="card shadow-sm border-0 border-start border-success border-4 bg-success bg-opacity-10 h-100">
//                         <div class="card-body">
//                             <div class="d-flex justify-content-between align-items-center mb-2">
//                                 <span class="text-success small fw-bold text-uppercase">
//                                     <i class="fas fa-crown text-warning me-1"></i>Líder Calidad Verde
//                                 </span>
//                                 <span class="badge bg-success text-white p-2"><i class="fas fa-crown fa-lg"></i></span>
//                             </div>
//                             <h5 class="fw-bold text-dark mb-1 text-truncate" id="kpi-aud-1-origen">—</h5>
//                             <div class="small fw-semibold text-success text-truncate" id="kpi-aud-1-subtipo">Subtipo: —</div>
//                             <small class="text-muted" id="kpi-aud-1-kg">0,00 kg útiles verdes</small>
//                         </div>
//                     </div>
//                 </div>

//                 <!-- KPI 2: Mención Especial -> NombreOrigen con mayor PesoBruto y TipoMaterial -->
//                 <div class="col-12 col-sm-6 col-xl-3">
//                     <div class="card shadow-sm border-0 border-start border-warning border-4 h-100">
//                         <div class="card-body">
//                             <div class="d-flex justify-content-between align-items-center mb-2">
//                                 <span class="text-muted small fw-bold text-uppercase">
//                                     <i class="fas fa-award text-warning me-1"></i>Mención Especial (Bruto)
//                                 </span>
//                                 <span class="badge bg-warning bg-opacity-10 text-warning p-2"><i class="fas fa-medal fa-lg"></i></span>
//                             </div>
//                             <h5 class="fw-bold text-dark mb-1 text-truncate" id="kpi-aud-2-origen">—</h5>
//                             <div class="small fw-semibold text-primary text-truncate" id="kpi-aud-2-material">Material: —</div>
//                             <small class="text-muted" id="kpi-aud-2-kg">0,00 kg brutos ingresados</small>
//                         </div>
//                     </div>
//                 </div>

//                 <!-- KPI 3: Tarjeta Roja -> NombreOrigen con mayor PesoUtil y SemaforoEstado = Rojo x Subtipo -->
//                 <div class="col-12 col-sm-6 col-xl-3">
//                     <div class="card shadow-sm border-0 border-start border-danger border-4 bg-danger bg-opacity-10 h-100">
//                         <div class="card-body">
//                             <div class="d-flex justify-content-between align-items-center mb-2">
//                                 <span class="text-danger small fw-bold text-uppercase">Alerta Descarte Rojo</span>
//                                 <span class="badge bg-danger text-white p-2"><i class="fas fa-exclamation-circle fa-lg"></i></span>
//                             </div>
//                             <h5 class="fw-bold text-dark mb-1 text-truncate" id="kpi-aud-3-origen">—</h5>
//                             <div class="small fw-semibold text-danger text-truncate" id="kpi-aud-3-subtipo">Subtipo: —</div>
//                             <small class="text-muted" id="kpi-aud-3-kg">0,00 kg descarte rojo</small>
//                         </div>
//                     </div>
//                 </div>

//                 <!-- KPI 4: Tarjeta Celeste -> NombreChofer con mayor PesoVerde x TipoMaterial -->
//                 <div class="col-12 col-sm-6 col-xl-3">
//                     <div class="card shadow-sm border-0 border-start border-info border-4 bg-info bg-opacity-10 h-100">
//                         <div class="card-body">
//                             <div class="d-flex justify-content-between align-items-center mb-2">
//                                 <span class="text-info text-emphasis small fw-bold text-uppercase">Chofer Destacado (Verde)</span>
//                                 <span class="badge bg-info text-white p-2"><i class="fas fa-truck fa-lg"></i></span>
//                             </div>
//                             <h5 class="fw-bold text-dark mb-1 text-truncate" id="kpi-aud-4-chofer">—</h5>
//                             <div class="small fw-semibold text-info text-emphasis text-truncate" id="kpi-aud-4-material">Material: —</div>
//                             <small class="text-muted" id="kpi-aud-4-kg">0,00 kg verdes transportados</small>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 3: GRÁFICO PRINCIPAL - SANKEY 3 NIVELES (ORIGEN -> MATERIAL [BRUTO] -> SEMÁFORO) -->
//             <div class="row g-4 mb-4 fade-in">
//                 <div class="col-12">
//                     <div class="card shadow-sm border-0">
//                         <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
//                             <div>
//                                 <h6 class="fw-bold text-dark mb-0">
//                                     <i class="fas fa-project-diagram text-primary me-2"></i>Trazabilidad de Flujo: Origen &rarr; Tipo Material (Peso Bruto) &rarr; Semáforo de Calidad
//                                 </h6>
//                                 <small class="text-muted">Conversión de masa desde los generadores hacia las familias de material y su resultado en cinta (Verde, Amarillo, Rojo)</small>
//                             </div>
//                             <span class="badge bg-light text-dark border">Pasá el cursor sobre un nodo o flujo para auditar kilos</span>
//                         </div>
//                         <div class="card-body">
//                             <div id="msg-sin-datos-aud-sankey" class="alert alert-light text-center border my-4 p-4 d-none">
//                                 <i class="fas fa-project-diagram fa-2x text-muted mb-2"></i>
//                                 <p class="mb-0 text-muted">No hay lotes registrados para trazar el flujo Sankey en este período.</p>
//                             </div>
//                             <div id="echarts-aud-sankey" style="width: 100%; height: 540px;"></div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 4: GRÁFICO SECUNDARIO - CUSTOM CALENDAR ICON (FECHA CLASIF. x SUBTIPO x PESO ÚTIL x SEMÁFORO) -->
//             <div class="row g-4 mb-4 fade-in">
//                 <div class="col-12">
//                     <div class="card shadow-sm border-0">
//                         <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
//                             <div>
//                                 <h6 class="fw-bold text-dark mb-0">
//                                     <i class="fas fa-calendar-alt text-success me-2"></i>Calendario Operativo de Clasificación (Subtipos y Semáforo Diario)
//                                 </h6>
//                                 <small class="text-muted">Etiquetas diarias con kilos clasificados en Verde, Amarillo y Rojo; pasá el mouse sobre cada día para ver el detalle por Subtipo</small>
//                             </div>

//                             <div class="d-flex align-items-center gap-2">
//                                 <label class="small fw-bold mb-0 text-muted">Mes visible:</label>
//                                 <select id="selector-mes-calendario-aud" class="form-select form-select-sm fw-semibold" style="width: auto; min-width: 165px;">
//                                     <option value="">Sin fechas</option>
//                                 </select>
//                             </div>
//                         </div>
//                         <div class="card-body">
//                             <div id="msg-sin-datos-aud-calendario" class="alert alert-light text-center border my-4 p-4 d-none">
//                                 <i class="fas fa-calendar-times fa-2x text-muted mb-2"></i>
//                                 <p class="mb-0 text-muted">No se registraron clasificaciones con fecha en el rango seleccionado.</p>
//                             </div>
//                             <div id="echarts-aud-calendario" style="width: 100%; height: 520px;"></div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- NIVEL 5: TABLA MAESTRO-DETALLE DE LOTES AUDITADOS -->
//             <div class="row fade-in">
//                 <div class="col-12">
//                     <div class="card shadow-sm border-0">
//                         <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
//                             <div>
//                                 <h6 class="fw-bold text-dark mb-0">
//                                     <i class="fas fa-search-plus text-secondary me-2"></i>Registro Maestro-Detalle de Lotes Ingresados
//                                 </h6>
//                                 <small class="text-muted">Hacé clic en <span class="badge bg-light text-dark border">+</span> para desplegar las clasificaciones hijas, destinos y operadores de cada lote</small>
//                             </div>

//                             <div class="input-group input-group-sm" style="max-width: 280px;">
//                                 <span class="input-group-text bg-light"><i class="fas fa-search text-muted"></i></span>
//                                 <input type="text" id="buscador-tabla-auditoria" class="form-control" placeholder="Buscar lote, origen o patente...">
//                             </div>
//                         </div>
//                         <div class="card-body">
//                             <div class="table-responsive">
//                                 <table class="table table-hover align-middle mb-0">
//                                     <thead class="table-light">
//                                         <tr>
//                                             <th style="width: 44px;"></th>
//                                             <th>Lote #</th>
//                                             <th>Fecha Ingreso</th>
//                                             <th>Origen / Canal</th>
//                                             <th>Material</th>
//                                             <th class="text-end">Bruto (kg)</th>
//                                             <th class="text-end text-success">Verde</th>
//                                             <th class="text-end text-warning">Amarillo</th>
//                                             <th class="text-end text-danger">Rojo</th>
//                                             <th class="text-center">Auditoría</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody id="tbody-traz-auditoria">
//                                         <tr>
//                                             <td colspan="10" class="text-center text-muted py-4">Cargando lotes auditados...</td>
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

//         principal.off('click', '#btn-filtrar-traz-auditoria').on('click', '#btn-filtrar-traz-auditoria', function () {
//             const desde = $('#filtro-traz-aud-desde').val();
//             const hasta = $('#filtro-traz-aud-hasta').val();
//             const idTipoMaterial = $('#filtro-traz-aud-material').val() || null;
//             const estadoAuditoria = $('#filtro-traz-aud-estado').val() || null;

//             if (!desde || !hasta) {
//                 Swal.fire('Fechas requeridas', 'Por favor seleccioná ambas fechas.', 'warning');
//                 return;
//             }
//             if (desde > hasta) {
//                 Swal.fire('Rango inválido', 'La fecha "Desde" no puede ser mayor a "Hasta".', 'warning');
//                 return;
//             }

//             consultarAuditoriaLotesApi(desde, hasta, idTipoMaterial, estadoAuditoria);
//         });

//         // Cambio de mes en el Custom Calendar Icon
//         principal.off('change', '#selector-mes-calendario-aud').on('change', '#selector-mes-calendario-aud', function () {
//             const mes = $(this).val();
//             if (mes) {
//                 estado.mesSeleccionadoCal = mes;
//                 renderizarCalendarioCustom(estado.diasCalendarioMap, mes);
//             }
//         });

//         // Expandir / Colapsar detalle hijo en la tabla Maestro-Detalle
//         principal.off('click', '.btn-expandir-lote').on('click', '.btn-expandir-lote', function () {
//             const idLote = $(this).data('idlote');
//             const filaDetalle = $(`#detalle-lote-${idLote}`);
//             const icono = $(this).find('i');

//             if (filaDetalle.hasClass('d-none')) {
//                 filaDetalle.removeClass('d-none');
//                 icono.removeClass('fa-plus').addClass('fa-minus');
//             } else {
//                 filaDetalle.addClass('d-none');
//                 icono.removeClass('fa-minus').addClass('fa-plus');
//             }
//         });

//         // Buscador instantáneo en tabla
//         principal.off('input', '#buscador-tabla-auditoria').on('input', '#buscador-tabla-auditoria', function () {
//             const termino = $(this).val().toLowerCase().trim();
//             const filtrados = termino
//                 ? estado.lotes.filter(l =>
//                     String(l.idDetalleIngreso).includes(termino) ||
//                     l.nombreOrigen.toLowerCase().includes(termino) ||
//                     l.tipoMaterial.toLowerCase().includes(termino) ||
//                     l.patenteVehiculo.toLowerCase().includes(termino) ||
//                     l.nombreChofer.toLowerCase().includes(termino)
//                 )
//                 : estado.lotes;

//             renderizarTablaMaestroDetalle(filtrados);
//         });

//         // Responsividad limpia
//         $(window).off('resize.trazAuditoria').on('resize.trazAuditoria', function () {
//             if (estado.chartSankeyFlujo && !estado.chartSankeyFlujo.isDisposed()) {
//                 estado.chartSankeyFlujo.resize();
//             }
//             if (estado.chartCalendarioCustom && !estado.chartCalendarioCustom.isDisposed()) {
//                 estado.chartCalendarioCustom.resize();
//             }
//         });
//     };

//     const cargarCatalogoTiposMaterial = function () {
//         $.ajax({
//             type: "GET",
//             url: URL_POR_MATERIAL,
//             data: { fechaDesde: '2020-01-01', fechaHasta: new Date().toISOString().split('T')[0] },
//             success: function (res) {
//                 const select = $('#filtro-traz-aud-material');
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

//         $('#filtro-traz-aud-hasta').val(hoy.toISOString().split('T')[0]);
//         $('#filtro-traz-aud-desde').val(primerDiaAnio.toISOString().split('T')[0]);

//         $('#btn-filtrar-traz-auditoria').trigger('click');
//     };

//     // 3. CONSULTA A LA API C#
//     const consultarAuditoriaLotesApi = function (fechaDesde, fechaHasta, idTipoMaterial, estadoAuditoria) {
//         const btn = $('#btn-filtrar-traz-auditoria');
//         btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

//         const params = { fechaDesde: fechaDesde, fechaHasta: fechaHasta };
//         if (idTipoMaterial) params.idTipoMaterial = idTipoMaterial;
//         if (estadoAuditoria) params.estadoAuditoria = estadoAuditoria;

//         $.ajax({
//             type: "GET",
//             url: URL_AUDITORIA_LOTES,
//             data: params,
//             success: function (respuesta) {
//                 estado.lotes = normalizarLotes(respuesta);
//                 $('#buscador-tabla-auditoria').val('');

//                 renderizarKPIs(estado.lotes);
//                 renderizarSankeyAuditoria(estado.lotes);
//                 prepararYRenderizarCalendario(estado.lotes, fechaHasta);
//                 renderizarTablaMaestroDetalle(estado.lotes);
//             },
//             error: function (err) {
//                 console.error("Error al obtener AuditoriaLotes de Trazabilidad:", err);
//                 Swal.fire('Error de conexión', 'No se pudo obtener la auditoría de lotes desde el servidor.', 'error');
//             },
//             complete: function () {
//                 btn.prop('disabled', false).html('<i class="fas fa-search"></i> Filtrar');
//             }
//         });
//     };

//     // 4. RENDERIZADO DE LAS 4 TARJETAS KPI EN EL ORDEN REQUERIDO
//     const renderizarKPIs = function (lotes) {
//         // Reset por defecto
//         const limpiarKpis = () => {
//             $('#kpi-aud-1-origen').text('Sin datos');
//             $('#kpi-aud-1-subtipo').text('Subtipo: —');
//             $('#kpi-aud-1-kg').text('0,00 kg útiles verdes');

//             $('#kpi-aud-2-origen').text('Sin datos');
//             $('#kpi-aud-2-material').text('Material: —');
//             $('#kpi-aud-2-kg').text('0,00 kg brutos ingresados');

//             $('#kpi-aud-3-origen').text('Sin datos');
//             $('#kpi-aud-3-subtipo').text('Subtipo: —');
//             $('#kpi-aud-3-kg').text('0,00 kg descarte rojo');

//             $('#kpi-aud-4-chofer').text('Sin datos');
//             $('#kpi-aud-4-material').text('Material: —');
//             $('#kpi-aud-4-kg').text('0,00 kg verdes transportados');
//         };

//         if (!lotes || lotes.length === 0) {
//             limpiarKpis();
//             return;
//         }

//         // Acumuladores multidimensionales
//         const mapVerdeOrigenSubtipo = new Map();
//         const mapBrutoOrigenMaterial = new Map();
//         const mapRojoOrigenSubtipo = new Map();
//         const mapVerdeChoferMaterial = new Map();

//         lotes.forEach(l => {
//             // KPI 2: NombreOrigen x TipoMaterial -> PesoBruto
//             const keyOrigMat = `${l.nombreOrigen}|||${l.tipoMaterial}`;
//             const accOM = mapBrutoOrigenMaterial.get(keyOrigMat) || {
//                 nombreOrigen: l.nombreOrigen,
//                 tipoMaterial: l.tipoMaterial,
//                 pesoBruto: 0
//             };
//             accOM.pesoBruto += l.pesoBruto;
//             mapBrutoOrigenMaterial.set(keyOrigMat, accOM);

//             // KPI 4: NombreChofer x TipoMaterial -> PesoVerde
//             const keyChofMat = `${l.nombreChofer}|||${l.tipoMaterial}`;
//             const accCM = mapVerdeChoferMaterial.get(keyChofMat) || {
//                 nombreChofer: l.nombreChofer,
//                 tipoMaterial: l.tipoMaterial,
//                 pesoVerde: 0
//             };
//             accCM.pesoVerde += l.pesoVerde;
//             mapVerdeChoferMaterial.set(keyChofMat, accCM);

//             // KPI 1 y KPI 3: Recorremos clasificaciones hijas (PesoUtil x SemaforoEstado x Subtipo)
//             (l.clasificaciones || []).forEach(c => {
//                 const esVerde = c.idEstadoMaterial === 1 || c.semaforoEstado.toLowerCase().includes('verde');
//                 const esRojo = c.idEstadoMaterial === 3 || c.semaforoEstado.toLowerCase().includes('rojo');

//                 if (esVerde) {
//                     const keyVS = `${l.nombreOrigen}|||${c.subtipo}`;
//                     const accVS = mapVerdeOrigenSubtipo.get(keyVS) || {
//                         nombreOrigen: l.nombreOrigen,
//                         subtipo: c.subtipo,
//                         pesoUtil: 0
//                     };
//                     accVS.pesoUtil += c.pesoUtil;
//                     mapVerdeOrigenSubtipo.set(keyVS, accVS);
//                 }

//                 if (esRojo) {
//                     const keyRS = `${l.nombreOrigen}|||${c.subtipo}`;
//                     const accRS = mapRojoOrigenSubtipo.get(keyRS) || {
//                         nombreOrigen: l.nombreOrigen,
//                         subtipo: c.subtipo,
//                         pesoUtil: 0
//                     };
//                     accRS.pesoUtil += c.pesoUtil;
//                     mapRojoOrigenSubtipo.set(keyRS, accRS);
//                 }
//             });
//         });

//         // 1. Tarjeta Verde y Corona: NombreOrigen con mayor PesoUtil x SemaforoEstado = Verde x Subtipo
//         const top1 = Array.from(mapVerdeOrigenSubtipo.values()).sort((a, b) => b.pesoUtil - a.pesoUtil)[0];
//         if (top1 && top1.pesoUtil > 0) {
//             $('#kpi-aud-1-origen').text(top1.nombreOrigen).attr('title', top1.nombreOrigen);
//             $('#kpi-aud-1-subtipo').text(`Subtipo: ${top1.subtipo}`).attr('title', top1.subtipo);
//             $('#kpi-aud-1-kg').text(`${formatearKg(top1.pesoUtil)} kg útiles verdes`);
//         } else {
//             $('#kpi-aud-1-origen').text('Sin registros verdes');
//             $('#kpi-aud-1-subtipo').text('Subtipo: —');
//             $('#kpi-aud-1-kg').text('0,00 kg útiles verdes');
//         }

//         // 2. Mención Especial: NombreOrigen con mayor PesoBruto y TipoMaterial
//         const top2 = Array.from(mapBrutoOrigenMaterial.values()).sort((a, b) => b.pesoBruto - a.pesoBruto)[0];
//         if (top2 && top2.pesoBruto > 0) {
//             $('#kpi-aud-2-origen').text(top2.nombreOrigen).attr('title', top2.nombreOrigen);
//             $('#kpi-aud-2-material').text(`Material: ${top2.tipoMaterial}`).attr('title', top2.tipoMaterial);
//             $('#kpi-aud-2-kg').text(`${formatearKg(top2.pesoBruto)} kg brutos ingresados`);
//         }

//         // 3. Tarjeta Roja: NombreOrigen con mayor PesoUtil y SemaforoEstado = Rojo x Subtipo
//         const top3 = Array.from(mapRojoOrigenSubtipo.values()).sort((a, b) => b.pesoUtil - a.pesoUtil)[0];
//         if (top3 && top3.pesoUtil > 0) {
//             $('#kpi-aud-3-origen').text(top3.nombreOrigen).attr('title', top3.nombreOrigen);
//             $('#kpi-aud-3-subtipo').text(`Subtipo: ${top3.subtipo}`).attr('title', top3.subtipo);
//             $('#kpi-aud-3-kg').text(`${formatearKg(top3.pesoUtil)} kg de descarte rojo`);
//         } else {
//             $('#kpi-aud-3-origen').text('Sin descarte rojo');
//             $('#kpi-aud-3-subtipo').text('Subtipo: —');
//             $('#kpi-aud-3-kg').text('0,00 kg descarte rojo');
//         }

//         // 4. Tarjeta Celeste: NombreChofer con mayor PesoVerde x TipoMaterial
//         const todosChoferes = Array.from(mapVerdeChoferMaterial.values()).filter(x => x.pesoVerde > 0);
//         const choferesReales = todosChoferes.filter(x => !x.nombreChofer.toLowerCase().includes('n/a'));
//         const candidatosChofer = choferesReales.length > 0 ? choferesReales : todosChoferes;
//         const top4 = candidatosChofer.sort((a, b) => b.pesoVerde - a.pesoVerde)[0];

//         if (top4) {
//             $('#kpi-aud-4-chofer').text(top4.nombreChofer).attr('title', top4.nombreChofer);
//             $('#kpi-aud-4-material').text(`Material: ${top4.tipoMaterial}`).attr('title', top4.tipoMaterial);
//             $('#kpi-aud-4-kg').text(`${formatearKg(top4.pesoVerde)} kg útiles verdes`);
//         } else {
//             $('#kpi-aud-4-chofer').text('Sin datos verdes');
//             $('#kpi-aud-4-material').text('Material: —');
//             $('#kpi-aud-4-kg').text('0,00 kg verdes transportados');
//         }
//     };

//     // 5. GRÁFICO PRINCIPAL: SANKEY 3 NIVELES (ORIGEN -> MATERIAL [PESO BRUTO] -> SEMÁFORO)
//     const renderizarSankeyAuditoria = function (lotes) {
//         if (typeof echarts === 'undefined') return;

//         const dom = document.getElementById('echarts-aud-sankey');
//         const msgSinDatos = $('#msg-sin-datos-aud-sankey');

//         const validos = (lotes || []).filter(l => l.pesoBruto > 0);

//         if (validos.length === 0) {
//             $(dom).addClass('d-none');
//             msgSinDatos.removeClass('d-none');
//             return;
//         }

//         msgSinDatos.addClass('d-none');
//         $(dom).removeClass('d-none');

//         if (!estado.chartSankeyFlujo || estado.chartSankeyFlujo.isDisposed()) {
//             estado.chartSankeyFlujo = echarts.init(dom);
//         }

//         // Si hay más de 12 orígenes, agrupamos los menores en "Otros Orígenes" para mantener el diagrama legible
//         const brutoPorOrigen = new Map();
//         validos.forEach(l => {
//             brutoPorOrigen.set(l.nombreOrigen, (brutoPorOrigen.get(l.nombreOrigen) || 0) + l.pesoBruto);
//         });
//         const topOrigenesSet = new Set(
//             Array.from(brutoPorOrigen.entries())
//                 .sort((a, b) => b[1] - a[1])
//                 .slice(0, 12)
//                 .map(entry => entry[0])
//         );

//         const enlacesOrigenMaterial = new Map();
//         const enlacesMaterialSemaforo = new Map();
//         const materialesSet = new Set();
//         const origenesFinalesSet = new Set();

//         validos.forEach(l => {
//             const origenNodo = topOrigenesSet.has(l.nombreOrigen) ? l.nombreOrigen : 'Otros Orígenes';
//             origenesFinalesSet.add(origenNodo);
//             materialesSet.add(l.tipoMaterial);

//             // Tramo 1: NombreOrigen -> TipoMaterial (PesoBruto)
//             const keyOM = `${origenNodo}|||${l.tipoMaterial}`;
//             enlacesOrigenMaterial.set(keyOM, (enlacesOrigenMaterial.get(keyOM) || 0) + l.pesoBruto);

//             // Tramo 2: TipoMaterial -> PesoVerde, PesoAmarillo, PesoRojo
//             if (l.pesoVerde > 0) {
//                 const kV = `${l.tipoMaterial}|||E_VERDE`;
//                 enlacesMaterialSemaforo.set(kV, (enlacesMaterialSemaforo.get(kV) || 0) + l.pesoVerde);
//             }
//             if (l.pesoAmarillo > 0) {
//                 const kA = `${l.tipoMaterial}|||E_AMARILLO`;
//                 enlacesMaterialSemaforo.set(kA, (enlacesMaterialSemaforo.get(kA) || 0) + l.pesoAmarillo);
//             }
//             if (l.pesoRojo > 0) {
//                 const kR = `${l.tipoMaterial}|||E_ROJO`;
//                 enlacesMaterialSemaforo.set(kR, (enlacesMaterialSemaforo.get(kR) || 0) + l.pesoRojo);
//             }
//         });

//         const nodos = [];
//         const links = [];

//         // Nodos Nivel 1: Orígenes (prefijo O_ evita ciclos DAG)
//         let idxColor = 0;
//         Array.from(origenesFinalesSet).forEach(orig => {
//             const color = orig === 'Otros Orígenes'
//                 ? '#adb5bd'
//                 : PALETA_ORIGENES[idxColor++ % PALETA_ORIGENES.length];
//             nodos.push({
//                 name: `O_${orig}`,
//                 displayName: orig,
//                 nivel: 'Origen',
//                 itemStyle: { color: color, borderColor: color }
//             });
//         });

//         // Nodos Nivel 2: TipoMaterial (prefijo M_)
//         Array.from(materialesSet).forEach(mat => {
//             nodos.push({
//                 name: `M_${mat}`,
//                 displayName: mat,
//                 nivel: 'Material (Bruto)',
//                 itemStyle: { color: '#495057', borderColor: '#343a40' }
//             });
//         });

//         // Nodos Nivel 3: Semáforo de Calidad (prefijo E_)
//         const defSemaforo = [
//             { id: 'E_VERDE', label: 'Útil (Verde)', color: '#198754' },
//             { id: 'E_AMARILLO', label: 'Revisión (Amarillo)', color: '#ffc107' },
//             { id: 'E_ROJO', label: 'Descarte (Rojo)', color: '#dc3545' }
//         ];

//         const estadosConFlujo = new Set();
//         enlacesMaterialSemaforo.forEach((val, key) => {
//             if (val > 0) estadosConFlujo.add(key.split('|||')[1]);
//         });

//         defSemaforo.forEach(sem => {
//             if (estadosConFlujo.has(sem.id)) {
//                 nodos.push({
//                     name: sem.id,
//                     displayName: sem.label,
//                     nivel: 'Clasificación Final',
//                     itemStyle: { color: sem.color, borderColor: sem.color }
//                 });
//             }
//         });

//         // Links Tramo 1: Origen -> Material
//         enlacesOrigenMaterial.forEach((peso, key) => {
//             if (peso > 0) {
//                 const [orig, mat] = key.split('|||');
//                 links.push({
//                     source: `O_${orig}`,
//                     target: `M_${mat}`,
//                     value: Number(peso.toFixed(2)),
//                     origenTxt: orig,
//                     destinoTxt: mat,
//                     etapa: 'Peso Bruto Ingresado'
//                 });
//             }
//         });

//         // Links Tramo 2: Material -> Semáforo
//         enlacesMaterialSemaforo.forEach((peso, key) => {
//             if (peso > 0) {
//                 const [mat, idEst] = key.split('|||');
//                 const semInfo = defSemaforo.find(s => s.id === idEst);
//                 links.push({
//                     source: `M_${mat}`,
//                     target: idEst,
//                     value: Number(peso.toFixed(2)),
//                     origenTxt: mat,
//                     destinoTxt: semInfo ? semInfo.label : idEst,
//                     etapa: 'Peso Clasificado',
//                     lineStyle: {
//                         color: semInfo ? semInfo.color : 'source',
//                         opacity: 0.45
//                     }
//                 });
//             }
//         });

//         const option = {
//             tooltip: {
//                 trigger: 'item',
//                 triggerOn: 'mousemove',
//                 formatter: function (p) {
//                     if (p.dataType === 'edge') {
//                         const e = p.data;
//                         return `
//                             <span class="badge bg-light text-dark border mb-1">${e.etapa}</span><br/>
//                             <strong>${e.origenTxt}</strong> <i class="fas fa-arrow-right mx-1 text-muted"></i> <strong>${e.destinoTxt}</strong><br/>
//                             Masa: <strong>${formatearKg(e.value)} kg</strong>
//                         `;
//                     } else {
//                         const n = p.data;
//                         return `
//                             <span class="badge bg-secondary mb-1">${n.nivel}</span><br/>
//                             <strong>${n.displayName}</strong><br/>
//                             Volumen Total: <strong>${formatearKg(p.value)} kg</strong>
//                         `;
//                     }
//                 }
//             },
//             toolbox: {
//                 show: true,
//                 right: 15,
//                 feature: {
//                     saveAsImage: { show: true, title: 'Descargar Sankey HD', pixelRatio: 2 }
//                 }
//             },
//             series: [
//                 {
//                     type: 'sankey',
//                     left: '2%',
//                     right: '18%',
//                     top: 25,
//                     bottom: 20,
//                     nodeWidth: 18,
//                     nodeGap: 14,
//                     draggable: false,
//                     emphasis: {
//                         focus: 'adjacency'
//                     },
//                     label: {
//                         color: '#212529',
//                         fontWeight: 'bold',
//                         fontSize: 12,
//                         formatter: function (p) {
//                             return `${p.data.displayName} (${formatearKgCorto(p.value)})`;
//                         }
//                     },
//                     lineStyle: {
//                         color: 'source',
//                         curveness: 0.5,
//                         opacity: 0.38
//                     },
//                     data: nodos,
//                     links: links
//                 }
//             ]
//         };

//         estado.chartSankeyFlujo.setOption(option, true);
//     };

//     // 6. GRÁFICO SECUNDARIO: CUSTOM CALENDAR ICON (FECHA CLASIF. x SUBTIPO x PESO ÚTIL x SEMÁFORO)
//     const prepararYRenderizarCalendario = function (lotes, fechaHastaDefault) {
//         const diasMap = {};
//         const mesesSet = new Set();

//         (lotes || []).forEach(l => {
//             (l.clasificaciones || []).forEach(c => {
//                 if (!c.fechaDia || c.pesoUtil <= 0) return;

//                 if (!diasMap[c.fechaDia]) {
//                     diasMap[c.fechaDia] = {
//                         fecha: c.fechaDia,
//                         verde: 0,
//                         amarillo: 0,
//                         rojo: 0,
//                         total: 0,
//                         items: []
//                     };
//                 }

//                 const registroDia = diasMap[c.fechaDia];
//                 const esVerde = c.idEstadoMaterial === 1 || c.semaforoEstado.toLowerCase().includes('verde');
//                 const esAmarillo = c.idEstadoMaterial === 2 || c.semaforoEstado.toLowerCase().includes('amarillo');
//                 const esRojo = c.idEstadoMaterial === 3 || c.semaforoEstado.toLowerCase().includes('rojo');

//                 if (esVerde) registroDia.verde += c.pesoUtil;
//                 else if (esAmarillo) registroDia.amarillo += c.pesoUtil;
//                 else if (esRojo) registroDia.rojo += c.pesoUtil;

//                 registroDia.total += c.pesoUtil;
//                 registroDia.items.push({
//                     subtipo: c.subtipo,
//                     pesoUtil: c.pesoUtil,
//                     semaforo: esVerde ? 'Verde' : (esAmarillo ? 'Amarillo' : (esRojo ? 'Rojo' : c.semaforoEstado)),
//                     origen: l.nombreOrigen,
//                     idLote: l.idDetalleIngreso
//                 });

//                 mesesSet.add(c.fechaDia.substring(0, 7)); // YYYY-MM
//             });
//         });

//         estado.diasCalendarioMap = diasMap;

//         const selectorMes = $('#selector-mes-calendario-aud').empty();
//         const mesesOrdenados = Array.from(mesesSet).sort().reverse();

//         if (mesesOrdenados.length === 0) {
//             selectorMes.append('<option value="">Sin clasificaciones</option>');
//             $('#echarts-aud-calendario').addClass('d-none');
//             $('#msg-sin-datos-aud-calendario').removeClass('d-none');
//             return;
//         }

//         const nombresMeses = [
//             'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
//             'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
//         ];

//         mesesOrdenados.forEach(ym => {
//             const [anio, mesStr] = ym.split('-');
//             const nombreMes = nombresMeses[parseInt(mesStr, 10) - 1] || mesStr;
//             selectorMes.append(`<option value="${ym}">${nombreMes} ${anio}</option>`);
//         });

//         const mesInicial = mesesOrdenados[0];
//         estado.mesSeleccionadoCal = mesInicial;
//         selectorMes.val(mesInicial);

//         renderizarCalendarioCustom(diasMap, mesInicial);
//     };

//     const renderizarCalendarioCustom = function (diasMap, yearMonth) {
//         if (typeof echarts === 'undefined') return;

//         const dom = document.getElementById('echarts-aud-calendario');
//         const msgSinDatos = $('#msg-sin-datos-aud-calendario');

//         const fechasMes = Object.keys(diasMap).filter(f => f.startsWith(yearMonth));

//         if (fechasMes.length === 0) {
//             $(dom).addClass('d-none');
//             msgSinDatos.removeClass('d-none');
//             return;
//         }

//         msgSinDatos.addClass('d-none');
//         $(dom).removeClass('d-none');

//         if (!estado.chartCalendarioCustom || estado.chartCalendarioCustom.isDisposed()) {
//             estado.chartCalendarioCustom = echarts.init(dom);
//         }

//         // Construimos todos los días del mes seleccionado para dibujar el calendario completo
//         const [anioStr, mesStr] = yearMonth.split('-');
//         const anio = parseInt(anioStr, 10);
//         const mes = parseInt(mesStr, 10);
//         const ultimoDiaMes = new Date(anio, mes, 0).getDate();

//         const datosDias = [];
//         for (let d = 1; d <= ultimoDiaMes; d++) {
//             const diaPad = String(d).padStart(2, '0');
//             const fechaStr = `${yearMonth}-${diaPad}`;
//             const info = diasMap[fechaStr] || {
//                 fecha: fechaStr,
//                 verde: 0,
//                 amarillo: 0,
//                 rojo: 0,
//                 total: 0,
//                 items: []
//             };

//             // Dimensiones numéricas puras para api.value() + objeto detalle en `info` para el tooltip
//             datosDias.push({
//                 value: [fechaStr, info.total, info.verde, info.amarillo, info.rojo],
//                 info: info
//             });
//         }

//         const option = {
//             tooltip: {
//                 trigger: 'item',
//                 confine: true,
//                 formatter: function (params) {
//                     const info = params.data.info;
//                     const [y, m, d] = info.fecha.split('-');
//                     let html = `<strong>Fecha Clasificación: ${d}/${m}/${y}</strong><br/>`;

//                     if (info.total <= 0) {
//                         return html + `<span class="text-muted">Sin actividad de clasificación registrada</span>`;
//                     }

//                     html += `
//                         <div class="my-1">
//                             <span class="badge bg-success">Verde: ${formatearKg(info.verde)} kg</span>
//                             <span class="badge bg-warning text-dark">Amarillo: ${formatearKg(info.amarillo)} kg</span>
//                             <span class="badge bg-danger">Rojo: ${formatearKg(info.rojo)} kg</span>
//                         </div>
//                         <hr class="my-1"/>
//                         <small class="fw-bold text-muted">Desglose Subtipo &times; Peso Útil &times; Semáforo:</small><br/>
//                     `;

//                     // Agrupamos por Subtipo + Semáforo en el tooltip del día
//                     const agrupadoDia = new Map();
//                     info.items.forEach(it => {
//                         const k = `${it.subtipo}|||${it.semaforo}`;
//                         agrupadoDia.set(k, (agrupadoDia.get(k) || 0) + it.pesoUtil);
//                     });

//                     Array.from(agrupadoDia.entries())
//                         .sort((a, b) => b[1] - a[1])
//                         .slice(0, 10)
//                         .forEach(([k, kg]) => {
//                             const [sub, sem] = k.split('|||');
//                             const colorPunto = sem === 'Verde' ? '#198754' : (sem === 'Amarillo' ? '#ffc107' : '#dc3545');
//                             html += `<span style="color:${colorPunto};">●</span> <strong>${sub}</strong> (${sem}): ${formatearKg(kg)} kg<br/>`;
//                         });

//                     if (agrupadoDia.size > 10) {
//                         html += `<small class="text-muted">...y ${agrupadoDia.size - 10} registros más</small>`;
//                     }

//                     return html;
//                 }
//             },
//             toolbox: {
//                 show: true,
//                 right: 15,
//                 feature: {
//                     saveAsImage: { show: true, title: 'Descargar Calendario HD', pixelRatio: 2 }
//                 }
//             },
//             calendar: {
//                 top: 55,
//                 left: 35,
//                 right: 25,
//                 bottom: 20,
//                 orient: 'vertical',
//                 cellSize: ['auto', 78],
//                 range: yearMonth,
//                 splitLine: {
//                     show: true,
//                     lineStyle: { color: '#dee2e6', width: 1.5 }
//                 },
//                 itemStyle: {
//                     color: '#ffffff',
//                     borderColor: '#e9ecef',
//                     borderWidth: 1
//                 },
//                 dayLabel: {
//                     firstDay: 1,
//                     nameMap: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
//                     fontWeight: 'bold',
//                     color: '#495057'
//                 },
//                 monthLabel: {
//                     show: false
//                 },
//                 yearLabel: {
//                     show: false
//                 }
//             },
//             series: [
//                 {
//                     type: 'custom',
//                     coordinateSystem: 'calendar',
//                     renderItem: function (params, api) {
//                         const rawFecha = api.value(0); // ECharts entrega timestamp numérico aquí
//                         const totalKg = api.value(1) || 0;
//                         const verdeKg = api.value(2) || 0;
//                         const amarilloKg = api.value(3) || 0;
//                         const rojoKg = api.value(4) || 0;

//                         const cellPoint = api.coord([rawFecha, 0]);
//                         const cellWidth = params.coordSys.cellWidth;
//                         const cellHeight = params.coordSys.cellHeight;

//                         if (isNaN(cellPoint[0]) || isNaN(cellPoint[1])) return;

//                         // Extracción segura del número de día sin importar si llega string o timestamp
//                         const diaNum = typeof rawFecha === 'string'
//                             ? parseInt(rawFecha.split('-')[2], 10)
//                             : new Date(rawFecha).getDate();

//                         const leftX = cellPoint[0] - cellWidth / 2;
//                         const topY = cellPoint[1] - cellHeight / 2;

//                         const children = [
//                             // Número del día en la esquina superior izquierda
//                             {
//                                 type: 'text',
//                                 style: {
//                                     text: String(diaNum),
//                                     x: leftX + 7,
//                                     y: topY + 6,
//                                     fill: totalKg > 0 ? '#212529' : '#adb5bd',
//                                     font: totalKg > 0 ? 'bold 12px sans-serif' : '11px sans-serif'
//                                 }
//                             }
//                         ];

//                         // Etiquetas Custom Icon para Verde, Amarillo y Rojo dentro de la celda
//                         const etiquetas = [];
//                         if (verdeKg > 0) {
//                             etiquetas.push({
//                                 texto: `Verde: ${formatearKgCorto(verdeKg)}`,
//                                 bg: '#198754',
//                                 fg: '#ffffff'
//                             });
//                         }
//                         if (amarilloKg > 0) {
//                             etiquetas.push({
//                                 texto: `Amarillo: ${formatearKgCorto(amarilloKg)}`,
//                                 bg: '#ffc107',
//                                 fg: '#212529'
//                             });
//                         }
//                         if (rojoKg > 0) {
//                             etiquetas.push({
//                                 texto: `Rojo: ${formatearKgCorto(rojoKg)}`,
//                                 bg: '#dc3545',
//                                 fg: '#ffffff'
//                             });
//                         }

//                         const pillWidth = Math.max(40, cellWidth - 12);
//                         const pillHeight = 16;
//                         const startY = topY + 22;

//                         etiquetas.forEach((et, idx) => {
//                             const py = startY + idx * (pillHeight + 2);
//                             if (py + pillHeight <= topY + cellHeight - 2) {
//                                 children.push({
//                                     type: 'rect',
//                                     shape: {
//                                         x: leftX + 6,
//                                         y: py,
//                                         width: pillWidth,
//                                         height: pillHeight,
//                                         r: 4
//                                     },
//                                     style: {
//                                         fill: et.bg
//                                     }
//                                 });
//                                 children.push({
//                                     type: 'text',
//                                     style: {
//                                         text: et.texto,
//                                         x: cellPoint[0],
//                                         y: py + pillHeight / 2,
//                                         fill: et.fg,
//                                         font: 'bold 10px sans-serif',
//                                         textAlign: 'center',
//                                         textVerticalAlign: 'middle'
//                                     }
//                                 });
//                             }
//                         });

//                         return {
//                             type: 'group',
//                             children: children
//                         };
//                     },
//                     data: datosDias
//                 }
//             ]
//         };

//         estado.chartCalendarioCustom.setOption(option, true);
//     };

//     // 7. TABLA MAESTRO-DETALLE DE LOTES AUDITADOS
//     const renderizarTablaMaestroDetalle = function (lotes) {
//         const tbody = $('#tbody-traz-auditoria').empty();

//         if (!lotes || lotes.length === 0) {
//             tbody.html(`
//                 <tr>
//                     <td colspan="10" class="text-center text-muted py-4">
//                         <i class="fas fa-folder-open me-2"></i>No se encontraron lotes que coincidan con los filtros seleccionados.
//                     </td>
//                 </tr>
//             `);
//             return;
//         }

//         lotes.forEach(l => {
//             const tieneHijos = l.clasificaciones && l.clasificaciones.length > 0;
//             const badgeEstado = l.estadoAuditoria === 'COMPLETO'
//                 ? '<span class="badge bg-success">COMPLETO</span>'
//                 : (l.estadoAuditoria === 'PARCIAL'
//                     ? '<span class="badge bg-warning text-dark">PARCIAL</span>'
//                     : '<span class="badge bg-secondary">PENDIENTE</span>');

//             const btnExpandir = tieneHijos
//                 ? `<button class="btn btn-sm btn-outline-primary btn-expandir-lote py-0 px-2" data-idlote="${l.idDetalleIngreso}" title="Ver clasificaciones hijas (${l.clasificaciones.length})">
//                        <i class="fas fa-plus"></i>
//                    </button>`
//                 : `<span class="text-muted small" title="Sin clasificaciones">—</span>`;

//             tbody.append(`
//                 <tr>
//                     <td class="text-center">${btnExpandir}</td>
//                     <td class="fw-bold text-primary">#${l.idDetalleIngreso}</td>
//                     <td class="small">${formatearFechaHora(l.fechaIngreso)}</td>
//                     <td>
//                         <div class="fw-bold text-dark">${l.nombreOrigen}</div>
//                         <small class="text-muted">${l.canalIngreso} ${l.patenteVehiculo !== 'Sin Patente' ? '· ' + l.patenteVehiculo : ''}</small>
//                     </td>
//                     <td><span class="badge bg-light text-dark border">${l.tipoMaterial}</span></td>
//                     <td class="text-end fw-bold">${formatearKg(l.pesoBruto)} kg</td>
//                     <td class="text-end text-success fw-semibold">${formatearKg(l.pesoVerde)} kg</td>
//                     <td class="text-end text-warning fw-semibold">${formatearKg(l.pesoAmarillo)} kg</td>
//                     <td class="text-end text-danger fw-semibold">${formatearKg(l.pesoRojo)} kg</td>
//                     <td class="text-center">${badgeEstado}</td>
//                 </tr>
//             `);

//             if (tieneHijos) {
//                 let filasHijas = l.clasificaciones.map(c => {
//                     const colorSem = c.idEstadoMaterial === 1
//                         ? 'bg-success'
//                         : (c.idEstadoMaterial === 2 ? 'bg-warning text-dark' : 'bg-danger');

//                     return `
//                         <tr>
//                             <td class="small text-muted">#${c.idClasificacion}</td>
//                             <td class="small">${formatearFechaHora(c.fechaClasificacion)}</td>
//                             <td class="fw-semibold">${c.subtipo}</td>
//                             <td><span class="badge ${colorSem}">${c.semaforoEstado}</span></td>
//                             <td class="text-end fw-bold">${formatearKg(c.pesoUtil)} kg</td>
//                             <td class="small">${c.nombreDestino}</td>
//                             <td class="small text-muted">${c.operadorClasificador}</td>
//                         </tr>
//                     `;
//                 }).join('');

//                 tbody.append(`
//                     <tr id="detalle-lote-${l.idDetalleIngreso}" class="d-none bg-light">
//                         <td colspan="10" class="p-3">
//                             <div class="card border shadow-none mb-0">
//                                 <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
//                                     <span class="small fw-bold text-primary">
//                                         <i class="fas fa-sitemap me-1"></i>Desglose de Clasificación del Lote #${l.idDetalleIngreso} (${l.clasificaciones.length} registros)
//                                     </span>
//                                     <span class="small text-muted">Chofer: <strong>${l.nombreChofer}</strong> | Procesado: <strong>${l.porcentajeProcesado}%</strong></span>
//                                 </div>
//                                 <div class="table-responsive">
//                                     <table class="table table-sm mb-0">
//                                         <thead class="table-light">
//                                             <tr>
//                                                 <th>ID</th>
//                                                 <th>Fecha Clasif.</th>
//                                                 <th>Subtipo</th>
//                                                 <th>Semáforo</th>
//                                                 <th class="text-end">Peso Útil</th>
//                                                 <th>Destino</th>
//                                                 <th>Operador</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>${filasHijas}</tbody>
//                                     </table>
//                                 </div>
//                             </div>
//                         </td>
//                     </tr>
//                 `);
//             }
//         });
//     };

//     // API Pública del Módulo
//     return {
//         cargarEn: inicializar
//     };
// })();