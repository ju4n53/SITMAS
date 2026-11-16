/* ========================================================================
   SITMAS - Módulo de Reportes: Mantenimiento Preventivo de Flota
   Incluye: KPIs Globales + 6 Velocímetros (Gauges) con Escala Extendida (150%)
            + Bitácora Historial de Taller
   Archivo: reporte_mantenimiento.js
   ======================================================================== */

const ReporteMantenimientoModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        datosPreventivo: [],     // Resultado de sp_Reporte_MantenimientoPreventivo
        datosHistorial: [],      // Resultado de sp_Reporte_HistorialMantenimiento
        instanciasGauges: []     // Referencias a los 6 ECharts Gauges activos para resize/dispose
    };

    const URL_MANTENIMIENTO_PREVENTIVO = "https://localhost:44325/api/ReportesLogistica/MantenimientoPreventivo";
    const URL_HISTORIAL_MANTENIMIENTO = "https://localhost:44325/api/ReportesLogistica/HistorialMantenimiento";

    // Helpers de formateo seguro (consistentes con reporte_odometro.js)
    const formatearKm = function (valor) {
        const num = parseFloat(valor || 0);
        return num.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatearEntero = function (valor) {
        const num = parseInt(valor || 0, 10);
        return num.toLocaleString('es-AR');
    };

    // 1. INICIALIZACIÓN DE LA ESTRUCTURA VISUAL
    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <!-- ENCABEZADO Y BOTÓN DE ACTUALIZACIÓN -->
            <div class="row fade-in">
                <div class="col-12 d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h4 class="text-primary fw-bold mb-0">
                            <i class="fas fa-tools me-2"></i>Mantenimiento Preventivo y Salud de Flota
                        </h4>
                        <small class="text-muted">Control acumulado de desgaste por intervalos de service e historial de intervenciones en taller</small>
                    </div>

                    <div>
                        <button id="btn-refrescar-mantenimiento" class="btn btn-primary btn-sm">
                            <i class="fas fa-sync-alt me-1"></i> Actualizar Tablero
                        </button>
                    </div>
                </div>
            </div>

            <!-- FILA SUPERIOR: 4 TARJETAS KPI GLOBALES DE FLOTA -->
            <div class="row g-3 mb-4 fade-in">
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-danger border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Services Vencidos</span>
                                <span class="badge bg-danger bg-opacity-10 text-danger p-2"><i class="fas fa-exclamation-triangle fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-danger mb-1" id="kpi-mant-vencidos">0</h3>
                            <small class="text-muted" id="kpi-mant-sub-vencidos">Desgaste >= 100% en flota</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-warning border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Próximos a Vencer</span>
                                <span class="badge bg-warning bg-opacity-10 text-warning p-2"><i class="fas fa-clock fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-warning mb-1" id="kpi-mant-proximos">0</h3>
                            <small class="text-muted">Desgaste entre 75% y 99%</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-success border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Services en Óptimo</span>
                                <span class="badge bg-success bg-opacity-10 text-success p-2"><i class="fas fa-check-circle fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-success mb-1" id="kpi-mant-optimos">0</h3>
                            <small class="text-muted">Desgaste menor al 75%</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-primary border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Intervenciones Totales</span>
                                <span class="badge bg-primary bg-opacity-10 text-primary p-2"><i class="fas fa-wrench fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-dark mb-1" id="kpi-mant-historial">0</h3>
                            <small class="text-muted" id="kpi-mant-sub-historial">0 preventivos / 0 correctivos</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 1: SELECTOR DE UNIDAD Y VELOCÍMETROS (GAUGES) -->
            <div class="row mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-tachometer-alt text-primary me-2"></i>Tablero de Desgaste Preventivo por Unidad
                                </h6>
                                <small class="text-muted">Escala extendida hasta 150% para visualizar sobrecarga de kilometraje</small>
                            </div>

                            <!-- Selector de Vehículo + Odómetro Actual -->
                            <div class="d-flex flex-wrap align-items-center gap-3">
                                <div class="bg-light px-3 py-1 rounded border">
                                    <small class="text-muted d-block" style="font-size: 0.72rem;">ODÓMETRO ACTUAL</small>
                                    <span class="fw-bold text-primary" id="badge-odometro-actual-unidad">0,00 km</span>
                                </div>

                                <div class="d-flex align-items-center gap-2">
                                    <label for="select-mant-vehiculo" class="small fw-bold text-dark mb-0">Unidad:</label>
                                    <select id="select-mant-vehiculo" class="form-select form-select-sm fw-bold border-primary" style="min-width: 230px;">
                                        <option value="">Cargando flota...</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="card-body bg-light bg-opacity-50">
                            <div id="mensaje-sin-datos-mant" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-truck fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No hay vehículos configurados para evaluar mantenimiento preventivo.</p>
                            </div>

                            <!-- Grilla dinámica donde se inyectan los 6 Velocímetros -->
                            <div class="row g-3" id="contenedor-gauges-mantenimiento"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 2: BITÁCORA HISTÓRICA DE INTERVENCIONES EN TALLER -->
            <div class="row fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-history text-secondary me-2"></i>Bitácora de Intervenciones en Taller
                                </h6>
                                <small class="text-muted">Registro histórico de mantenimientos preventivos, reparaciones y urgencias</small>
                            </div>

                            <!-- Filtro rápido por Tipo de Mantenimiento -->
                            <div class="d-flex align-items-center gap-2">
                                <label for="select-mant-filtro-tipo" class="small fw-bold text-muted mb-0">Tipo:</label>
                                <select id="select-mant-filtro-tipo" class="form-select form-select-sm" style="min-width: 180px;">
                                    <option value="TODOS">Todos los tipos</option>
                                    <option value="preventivo">Preventivo</option>
                                    <option value="reparacion">Reparación</option>
                                    <option value="urgencia">Urgencia</option>
                                </select>
                            </div>
                        </div>

                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0" id="tabla-historial-mantenimiento">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Unidad</th>
                                            <th>Tipo</th>
                                            <th>Service / Tarea</th>
                                            <th class="text-end">Odómetro en Taller</th>
                                            <th>Mecánico Responsable</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-historial-mantenimiento">
                                        <tr>
                                            <td colspan="6" class="text-center text-muted py-4">Cargando historial...</td>
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
        consultarDatosApi();
    };

    // 2. ENLACE DE EVENTOS (Con limpieza .off() para evitar duplicados en SPA)
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-reportes-logistica');

        // Botón Actualizar Tablero
        principal.off('click', '#btn-refrescar-mantenimiento').on('click', '#btn-refrescar-mantenimiento', function () {
            consultarDatosApi();
        });

        // Cambio de vehículo en el selector -> Redibuja los 6 velocímetros al instante
        principal.off('change', '#select-mant-vehiculo').on('change', '#select-mant-vehiculo', function () {
            const idVehiculo = parseInt($(this).val(), 10);
            renderizarGaugesPorVehiculo(idVehiculo);
            renderizarTablaHistorial();
        });

        // Cambio de filtro de tipo en la bitácora
        principal.off('change', '#select-mant-filtro-tipo').on('change', '#select-mant-filtro-tipo', function () {
            renderizarTablaHistorial();
        });

        // Responsividad de los 6 Gauges al redimensionar pantalla
        $(window).off('resize.mantenimiento').on('resize.mantenimiento', function () {
            estado.instanciasGauges.forEach(chart => {
                if (chart && !chart.isDisposed()) {
                    chart.resize();
                }
            });
        });
    };

    // 3. CONSULTA CONCURRENTE A AMBOS ENDPOINTS DE LA API C#
    const consultarDatosApi = function () {
        const btn = $('#btn-refrescar-mantenimiento');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

        $.when(
            $.ajax({ type: "GET", url: URL_MANTENIMIENTO_PREVENTIVO }),
            $.ajax({ type: "GET", url: URL_HISTORIAL_MANTENIMIENTO })
        )
            .done(function (resPreventivo, resHistorial) {
                // $.when devuelve [data, textStatus, jqXHR] por cada petición
                estado.datosPreventivo = resPreventivo[0] || [];
                estado.datosHistorial = resHistorial[0] || [];

                actualizarKPIsGlobales();
                poblarSelectorVehiculos();
                renderizarTablaHistorial();
            })
            .fail(function (err) {
                console.error("Error al consultar datos de mantenimiento:", err);
                Swal.fire('Error de conexión', 'No se pudieron obtener los indicadores de mantenimiento desde la API.', 'error');
            })
            .always(function () {
                btn.prop('disabled', false).html('<i class="fas fa-sync-alt me-1"></i> Actualizar Tablero');
            });
    };

    // 4. CÁLCULO DE KPIS GLOBALES DE FLOTA
    const actualizarKPIsGlobales = function () {
        const vencidos = estado.datosPreventivo.filter(x => x.EstadoAlerta === 'Vencido').length;
        const proximos = estado.datosPreventivo.filter(x => x.EstadoAlerta === 'Proximo').length;
        const optimos = estado.datosPreventivo.filter(x => x.EstadoAlerta === 'Optimo').length;

        const unidadesAfectadas = new Set(
            estado.datosPreventivo
                .filter(x => x.EstadoAlerta === 'Vencido')
                .map(x => x.Vehiculo)
        ).size;

        $('#kpi-mant-vencidos').text(vencidos);
        $('#kpi-mant-sub-vencidos').text(
            vencidos > 0
                ? `Distribuidos en ${unidadesAfectadas} ${unidadesAfectadas === 1 ? 'unidad' : 'unidades'}`
                : 'Ningún service excedido en flota'
        );

        $('#kpi-mant-proximos').text(proximos);
        $('#kpi-mant-optimos').text(optimos);

        const totalHist = estado.datosHistorial.length;
        const cantPreventivos = estado.datosHistorial.filter(x => x.TipoMantenimiento === 'preventivo').length;
        const cantCorrectivos = totalHist - cantPreventivos;

        $('#kpi-mant-historial').text(totalHist);
        $('#kpi-mant-sub-historial').text(`${cantPreventivos} preventivos / ${cantCorrectivos} correctivos`);
    };

    // 5. POBLAR SELECTOR PRIORIZANDO UNIDADES CON ALERTAS
    const poblarSelectorVehiculos = function () {
        const select = $('#select-mant-vehiculo');
        const prevSeleccion = select.val();
        select.empty();

        if (!estado.datosPreventivo || estado.datosPreventivo.length === 0) {
            select.append('<option value="">Sin vehículos disponibles</option>');
            $('#contenedor-gauges-mantenimiento').empty();
            $('#mensaje-sin-datos-mant').removeClass('d-none');
            return;
        }

        $('#mensaje-sin-datos-mant').addClass('d-none');

        // Agrupamos por vehículo para mostrar cuántas alertas tiene cada patente en el combo
        const mapaVehiculos = new Map();
        estado.datosPreventivo.forEach(item => {
            if (!mapaVehiculos.has(item.IdVehiculo)) {
                mapaVehiculos.set(item.IdVehiculo, {
                    id: item.IdVehiculo,
                    patente: item.Vehiculo,
                    vencidos: 0,
                    proximos: 0,
                    maxDesgaste: 0
                });
            }
            const info = mapaVehiculos.get(item.IdVehiculo);
            if (item.EstadoAlerta === 'Vencido') info.vencidos++;
            if (item.EstadoAlerta === 'Proximo') info.proximos++;
            if (item.PorcentajeDesgaste > info.maxDesgaste) info.maxDesgaste = item.PorcentajeDesgaste;
        });

        // Ordenamos poniendo primero las unidades más críticas
        const vehiculosOrdenados = Array.from(mapaVehiculos.values()).sort((a, b) => b.maxDesgaste - a.maxDesgaste);

        vehiculosOrdenados.forEach(v => {
            let etiquetaEstado = 'OK';
            if (v.vencidos > 0) etiquetaEstado = `${v.vencidos} Vencido(s)`;
            else if (v.proximos > 0) etiquetaEstado = `${v.proximos} Próximo(s)`;

            select.append(`<option value="${v.id}">${v.patente} — [${etiquetaEstado}]</option>`);
        });

        // Mantenemos selección previa si existe, o seleccionamos la unidad más crítica
        const existePrevio = vehiculosOrdenados.some(v => String(v.id) === String(prevSeleccion));
        select.val(existePrevio ? prevSeleccion : vehiculosOrdenados[0].id);
        select.trigger('change');
    };

    // 6. RENDERIZADO DE LOS 6 VELOCÍMETROS (ECHARTS GAUGE CON ESCALA EXTENDIDA 0-150%)
    const limpiarInstanciasGauges = function () {
        estado.instanciasGauges.forEach(chart => {
            if (chart && !chart.isDisposed()) {
                chart.dispose();
            }
        });
        estado.instanciasGauges = [];
    };

    const renderizarGaugesPorVehiculo = function (idVehiculo) {
        limpiarInstanciasGauges();
        const contenedor = $('#contenedor-gauges-mantenimiento').empty();

        const servicesUnidad = estado.datosPreventivo
            .filter(x => x.IdVehiculo === idVehiculo)
            .sort((a, b) => a.OrdenService - b.OrdenService);

        if (servicesUnidad.length === 0) return;

        // Actualizamos badge superior de odómetro actual
        $('#badge-odometro-actual-unidad').text(`${formatearKm(servicesUnidad[0].OdometroActual)} km`);

        servicesUnidad.forEach((srv, index) => {
            const desgasteReal = parseFloat(srv.PorcentajeDesgaste || 0);
            // Limitamos visualmente la aguja al tope de 150%, pero mostramos el % real en el texto central
            const valorAguja = Math.min(Math.max(desgasteReal, 0), 150);

            const esVencido = desgasteReal >= 100;
            const esProximo = desgasteReal >= 75 && desgasteReal < 100;

            const claseBorde = esVencido ? 'border-danger' : (esProximo ? 'border-warning' : 'border-success');
            const claseBadge = esVencido ? 'bg-danger' : (esProximo ? 'bg-warning text-dark' : 'bg-success');
            const textoEstado = esVencido ? 'VENCIDO' : (esProximo ? 'PRÓXIMO' : 'ÓPTIMO');

            const kmRestantes = parseFloat(srv.KmRestantes || 0);
            const textoRemanente = kmRestantes < 0
                ? `<span class="text-danger fw-bold"><i class="fas fa-exclamation-circle me-1"></i>Excedido por ${formatearKm(Math.abs(kmRestantes))} km</span>`
                : `<span class="text-success fw-bold">Restan ${formatearKm(kmRestantes)} km</span>`;

            const chartDomId = `echarts-gauge-srv-${index}`;

            const cardHtml = `
                <div class="col-12 col-md-6 col-xl-4">
                    <div class="card h-100 shadow-sm border-0 border-top border-4 ${claseBorde}">
                        <div class="card-header bg-white border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                            <span class="fw-bold text-dark text-capitalize">${srv.TipoService}</span>
                            <span class="badge ${claseBadge}">${textoEstado}</span>
                        </div>

                        <div class="card-body py-1">
                            <div id="${chartDomId}" style="width: 100%; height: 220px;"></div>
                        </div>

                        <div class="card-footer bg-white border-top small text-muted">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Recorrido / Intervalo:</span>
                                <strong class="text-dark">${formatearEntero(srv.KmRecorridos)} / ${formatearEntero(srv.IntervaloKm)} km</strong>
                            </div>
                            <div class="d-flex justify-content-between mb-1">
                                <span>Estado de vida útil:</span>
                                ${textoRemanente}
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Último service:</span>
                                <span>${srv.FechaUltimoServiceFormateada}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            contenedor.append(cardHtml);

            // Inicializamos el Gauge en ECharts
            if (typeof echarts !== 'undefined') {
                const domElement = document.getElementById(chartDomId);
                const chart = echarts.init(domElement);

                const option = {
                    tooltip: {
                        formatter: function () {
                            return `
                                <strong class="text-capitalize">${srv.TipoService}</strong><br/>
                                Desgaste actual: <strong>${desgasteReal.toFixed(1)}%</strong><br/>
                                Odómetro último service: ${formatearKm(srv.OdometroUltimoService)} km<br/>
                                Mecánico: ${srv.MecanicoUltimoService}
                            `;
                        }
                    },
                    series: [
                        {
                            type: 'gauge',
                            min: 0,
                            max: 150,
                            splitNumber: 6, // Marcas cada 25% (0, 25, 50, 75, 100, 125, 150)
                            radius: '92%',
                            center: ['50%', '58%'],
                            startAngle: 200,
                            endAngle: -20,
                            axisLine: {
                                lineStyle: {
                                    width: 16,
                                    color: [
                                        [0.50, '#198754'],  // 0% a 75% -> Verde (Óptimo)
                                        [0.667, '#ffc107'], // 75% a 100% -> Amarillo (Próximo)
                                        [1.00, '#dc3545']   // 100% a 150% -> Rojo (Sobrecarga / Vencido)
                                    ]
                                }
                            },
                            pointer: {
                                itemStyle: { color: 'auto' },
                                length: '62%',
                                width: 5
                            },
                            axisTick: {
                                distance: -16,
                                length: 6,
                                lineStyle: { color: '#fff', width: 1.5 }
                            },
                            splitLine: {
                                distance: -16,
                                length: 16,
                                lineStyle: { color: '#fff', width: 2.5 }
                            },
                            axisLabel: {
                                color: 'inherit',
                                distance: 20,
                                fontSize: 10,
                                formatter: function (val) {
                                    return val + '%';
                                }
                            },
                            detail: {
                                valueAnimation: true,
                                offsetCenter: [0, '32%'],
                                fontSize: 20,
                                fontWeight: 'bold',
                                color: 'inherit',
                                formatter: function () {
                                    // Mostramos el desgaste real incluso si supera el 150%
                                    return `${desgasteReal.toFixed(1)}%`;
                                }
                            },
                            data: [{ value: valorAguja }]
                        }
                    ]
                };

                chart.setOption(option);
                estado.instanciasGauges.push(chart);
            }
        });
    };

    // 7. RENDERIZADO DE LA BITÁCORA HISTÓRICA DE TALLER
    const renderizarTablaHistorial = function () {
        const tbody = $('#tbody-historial-mantenimiento').empty();
        const idVehiculoSeleccionado = parseInt($('#select-mant-vehiculo').val(), 10);
        const tipoFiltro = $('#select-mant-filtro-tipo').val() || 'TODOS';

        let filtrado = estado.datosHistorial;

        if (!isNaN(idVehiculoSeleccionado)) {
            filtrado = filtrado.filter(x => x.Id_Vehiculo === idVehiculoSeleccionado);
        }
        if (tipoFiltro !== 'TODOS') {
            filtrado = filtrado.filter(x => x.TipoMantenimiento === tipoFiltro);
        }

        if (filtrado.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-folder-open me-2"></i>No hay intervenciones registradas para los filtros seleccionados.
                    </td>
                </tr>
            `);
            return;
        }

        filtrado.forEach(reg => {
            let badgeTipo = 'bg-secondary';
            if (reg.TipoMantenimiento === 'preventivo') badgeTipo = 'bg-success';
            else if (reg.TipoMantenimiento === 'reparacion') badgeTipo = 'bg-warning text-dark';
            else if (reg.TipoMantenimiento === 'urgencia') badgeTipo = 'bg-danger';

            tbody.append(`
                <tr>
                    <td class="fw-bold">${reg.FechaFormateada}</td>
                    <td><span class="badge bg-light text-dark border">${reg.Vehiculo}</span></td>
                    <td><span class="badge ${badgeTipo} text-uppercase">${reg.TipoMantenimiento}</span></td>
                    <td class="text-capitalize">${reg.TipoService}</td>
                    <td class="text-end fw-bold">${formatearKm(reg.KmAlMomentoService)} km</td>
                    <td><i class="fas fa-user-cog text-muted me-1"></i>${reg.MecanicoNombreCompleto}</td>
                </tr>
            `);
        });
    };

    // Public API
    return {
        cargarEn: inicializar
    };
})();