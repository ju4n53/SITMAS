/* ========================================================================
   SITMAS - Módulo de Reportes: Consumo de Combustible y Costos Operativos
   Incluye: Tarjeta Surtidor Oficial (Shell Av. Sabattini 5231) + Sync API
            + 4 KPIs Financieros + 2 Gráficos ECharts (Doble Eje) + Bitácora
   Archivo: reporte_combustible.js
   ======================================================================== */

const ReporteCombustibleModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        datosCrudos: [],
        surtidorActual: null,
        chartPorVehiculo: null,
        chartEvolucionCostos: null
    };

    const URL_REPORTE_COMBUSTIBLE = "https://localhost:44325/api/ReportesLogistica/ConsumoCombustible";
    const URL_COMBUSTIBLE_CATALOGO = "https://localhost:44325/api/combustible";
    const URL_SINCRONIZAR_SURTIDOR = "https://localhost:44325/api/combustible/sincronizar-surtidor";
    const ID_GASOIL_SHELL = 3; // Shell Evolux Diésel (Gasoil Grado 2)

    // Helpers de formateo numérico y fechas (consistentes con reporte_odometro.js)
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

    const formatearFechaIso = function (fechaIso, corta = false) {
        if (!fechaIso || !fechaIso.includes('-')) return fechaIso;
        const [anio, mes, dia] = fechaIso.split('-');
        return corta ? `${dia}/${mes}` : `${dia}/${mes}/${anio}`;
    };

    // 1. INICIALIZACIÓN DE LA ESTRUCTURA VISUAL
    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <!-- ENCABEZADO Y FILTROS GLOBALES DE FECHA -->
            <div class="row fade-in">
                <div class="col-12 d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
                    <div>
                        <h4 class="text-primary fw-bold mb-0">
                            <i class="fas fa-gas-pump me-2"></i>Consumo de Combustible y Costos Operativos
                        </h4>
                        <small class="text-muted">Control financiero de litros estimados, gasto por unidad y trazabilidad de tarifas de surtidor</small>
                    </div>

                    <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded border">
                        <label class="small fw-bold mb-0">Desde:</label>
                        <input type="date" id="filtro-comb-desde" class="form-control form-control-sm" style="width: auto;">

                        <label class="small fw-bold mb-0 ms-2">Hasta:</label>
                        <input type="date" id="filtro-comb-hasta" class="form-control form-control-sm" style="width: auto;">

                        <button id="btn-generar-reporte-combustible" class="btn btn-primary btn-sm ms-2">
                            <i class="fas fa-search"></i> Filtrar
                        </button>
                    </div>
                </div>
            </div>

            <!-- TARJETA DE REFERENCIA DE SURTIDOR Y SINCRONIZACIÓN EXTERNA -->
            <div class="row mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0 border-start border-warning border-4 bg-white">
                        <div class="card-body py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <div class="d-flex align-items-center gap-3">
                                <div class="rounded-circle bg-warning bg-opacity-25 text-warning d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                    <i class="fas fa-fill-drip fa-lg text-dark"></i>
                                </div>
                                <div>
                                    <div class="d-flex flex-wrap align-items-center gap-2">
                                        <span class="fw-bold text-dark" id="surtidor-nombre">Shell Evolux Diésel (Gasoil Grado 2)</span>
                                        <span class="badge bg-light text-dark border"><i class="fas fa-map-marker-alt text-danger me-1"></i>Av. Amadeo Sabattini 5231, Córdoba</span>
                                    </div>
                                    <small class="text-muted d-block mt-1" id="surtidor-auditoria">
                                        Consultando última actualización de tarifa...
                                    </small>
                                </div>
                            </div>

                            <div class="d-flex flex-wrap align-items-center gap-3">
                                <div class="text-end">
                                    <small class="text-muted d-block text-uppercase" style="font-size: 0.7rem;">Tarifa Vigente / Litro</small>
                                    <span class="fs-4 fw-bold text-success" id="surtidor-precio-vigente">$ 0,00</span>
                                </div>

                                <button id="btn-sincronizar-surtidor" class="btn btn-outline-dark btn-sm">
                                    <i class="fas fa-cloud-download-alt me-1"></i> Sincronizar Surtidor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SEGMENTADOR (SLICER) POR UNIDAD -->
            <div class="row mb-3 fade-in">
                <div class="col-12 d-flex flex-wrap justify-content-between align-items-center bg-white p-3 rounded shadow-sm border">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-primary"><i class="fas fa-filter"></i></span>
                        <span class="fw-bold text-dark small text-uppercase">Alcance del Análisis:</span>
                    </div>
                    <div class="d-flex align-items-center gap-2 mt-2 mt-sm-0">
                        <label for="select-comb-vehiculo" class="small text-muted fw-bold mb-0">Visualizar unidad:</label>
                        <select id="select-comb-vehiculo" class="form-select form-select-sm fw-bold border-primary" style="min-width: 230px;">
                            <option value="TODOS">Toda la Flota (Consolidado)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- FILA SUPERIOR: 4 TARJETAS KPI -->
            <div class="row g-3 mb-4 fade-in">
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-success border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Gasto Total Acumulado</span>
                                <span class="badge bg-success bg-opacity-10 text-success p-2"><i class="fas fa-dollar-sign fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-dark mb-1" id="kpi-comb-gasto-total">$ 0,00</h3>
                            <small class="text-muted" id="kpi-comb-sub-viajes">Sobre 0 viajes cerrados</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-primary border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Litros Consumidos</span>
                                <span class="badge bg-primary bg-opacity-10 text-primary p-2"><i class="fas fa-tint fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-dark mb-1" id="kpi-comb-litros">0,00 L</h3>
                            <small class="text-muted" id="kpi-comb-sub-kms">En 0,00 km recorridos</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-info border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Costo Promedio / Km</span>
                                <span class="badge bg-info bg-opacity-10 text-info p-2"><i class="fas fa-route fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-dark mb-1" id="kpi-comb-costo-km">$ 0,00 /km</h3>
                            <small class="text-muted">Incidencia operativa por kilómetro</small>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card shadow-sm border-0 border-start border-warning border-4 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold text-uppercase">Precio Litro Promedio</span>
                                <span class="badge bg-warning bg-opacity-10 text-warning p-2"><i class="fas fa-tags fa-lg"></i></span>
                            </div>
                            <h3 class="fw-bold text-dark mb-1" id="kpi-comb-precio-promedio">$ 0,00</h3>
                            <small class="text-muted">Tarifa histórica ponderada del período</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- GRÁFICO 1: INVERSIÓN ($) Y LITROS CONSUMIDOS POR UNIDAD (DOBLE EJE) -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3">
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-chart-bar text-success me-2"></i>Inversión en Combustible ($) y Volumen (Litros) por Unidad
                            </h6>
                            <small class="text-muted">Comparativa de consumo acumulado entre vehículos de la flota</small>
                        </div>
                        <div class="card-body">
                            <div id="mensaje-sin-datos-comb-unidades" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-gas-pump fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No hay consumos de combustible registrados en el período seleccionado.</p>
                            </div>
                            <div id="echarts-combustible-unidades" style="width: 100%; height: 400px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- GRÁFICO 2: EVOLUCIÓN DIARIA DEL GASTO ($) Y COSTO POR KM ($/KM) -->
            <div class="row g-4 mb-4 fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3">
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-chart-line text-primary me-2"></i>Evolución Temporal del Gasto ($) y Costo por Kilómetro ($/km)
                            </h6>
                            <small class="text-muted">Permite observar el impacto real de las variaciones de precio del surtidor a lo largo del tiempo</small>
                        </div>
                        <div class="card-body">
                            <div id="mensaje-sin-datos-comb-evolucion" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No hay datos suficientes para graficar la evolución temporal.</p>
                            </div>
                            <div id="echarts-combustible-evolucion" style="width: 100%; height: 380px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 3: AUDITORÍA DETALLADA DE CONSUMOS CONGELADOS POR VIAJE -->
            <div class="row fade-in">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3">
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-receipt text-secondary me-2"></i>Detalle de Consumos Congelados por Viaje
                            </h6>
                            <small class="text-muted">Auditoría de tarifa por litro aplicada en el momento exacto de cierre de cada recorrido</small>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Unidad</th>
                                            <th>Movimiento</th>
                                            <th>Chofer</th>
                                            <th class="text-end">Km Reales</th>
                                            <th class="text-end">Tarifa/L Aplicada</th>
                                            <th class="text-end">Costo / Km</th>
                                            <th class="text-end">Litros</th>
                                            <th class="text-end">Total Viaje</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-detalle-combustible">
                                        <tr>
                                            <td colspan="9" class="text-center text-muted py-4">Cargando registros...</td>
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
        verificarYSincronizarSurtidor(false); // Sincronización inteligente al abrir
        configurarFechasPorDefecto();
    };

    // 2. ENLACE DE EVENTOS
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-reportes-logistica');

        // Botón Filtrar por fechas
        principal.off('click', '#btn-generar-reporte-combustible').on('click', '#btn-generar-reporte-combustible', function () {
            const desde = $('#filtro-comb-desde').val();
            const hasta = $('#filtro-comb-hasta').val();

            if (!desde || !hasta) {
                Swal.fire('Fechas requeridas', 'Por favor seleccioná ambas fechas.', 'warning');
                return;
            }
            if (desde > hasta) {
                Swal.fire('Rango inválido', 'La fecha "Desde" no puede ser mayor a "Hasta".', 'warning');
                return;
            }

            consultarDatosReporte(desde, hasta);
        });

        // Botón Manual Sincronizar Surtidor
        principal.off('click', '#btn-sincronizar-surtidor').on('click', '#btn-sincronizar-surtidor', function () {
            ejecutarSincronizacionApi(true);
        });

        // Cambio en el selector de vehículo
        principal.off('change', '#select-comb-vehiculo').on('change', '#select-comb-vehiculo', function () {
            actualizarVistaFiltrada();
        });

        // Responsividad de los gráficos ECharts
        $(window).off('resize.combustible').on('resize.combustible', function () {
            if (estado.chartPorVehiculo && !estado.chartPorVehiculo.isDisposed()) {
                estado.chartPorVehiculo.resize();
            }
            if (estado.chartEvolucionCostos && !estado.chartEvolucionCostos.isDisposed()) {
                estado.chartEvolucionCostos.resize();
            }
        });
    };

    const configurarFechasPorDefecto = function () {
        const hoy = new Date();
        const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);

        $('#filtro-comb-hasta').val(hoy.toISOString().split('T')[0]);
        $('#filtro-comb-desde').val(primerDiaAnio.toISOString().split('T')[0]);

        $('#btn-generar-reporte-combustible').trigger('click');
    };

    // 3. GESTIÓN DE TARIFA DEL SURTIDOR (CACHÉ INTELIGENTE + SINCRONIZACIÓN)
    const verificarYSincronizarSurtidor = function () {
        $.ajax({
            type: "GET",
            url: URL_COMBUSTIBLE_CATALOGO,
            success: function (lista) {
                const gasoil = (lista || []).find(c => c.Id_Combustible === ID_GASOIL_SHELL);
                if (gasoil) {
                    pintarTarjetaSurtidor(gasoil);

                    // Verificamos si ya fue actualizado hoy para evitar llamadas innecesarias
                    const hoyIso = new Date().toISOString().split('T')[0];
                    const fechaActIso = gasoil.Fecha_Actualizacion ? gasoil.Fecha_Actualizacion.split('T')[0] : '';

                    if (fechaActIso !== hoyIso) {
                        ejecutarSincronizacionApi(false);
                    }
                }
            },
            error: function (err) {
                console.error("Error al consultar catálogo de combustible:", err);
                $('#surtidor-auditoria').text('No se pudo leer la tarifa vigente desde el servidor.');
            }
        });
    };

    const ejecutarSincronizacionApi = function (mostrarAlertaUsuario) {
        const btn = $('#btn-sincronizar-surtidor');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Sincronizando...');

        $.ajax({
            type: "POST",
            url: URL_SINCRONIZAR_SURTIDOR,
            success: function (res) {
                if (res && res.Combustible) {
                    pintarTarjetaSurtidor(res.Combustible);
                }

                if (mostrarAlertaUsuario) {
                    if (res.SincronizadoDesdeApi) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Tarifa Actualizada',
                            text: res.Mensaje,
                            timer: 2800,
                            showConfirmButton: false
                        });
                    } else {
                        Swal.fire({
                            icon: 'info',
                            title: 'Sin cambios externos',
                            text: res.Mensaje
                        });
                    }
                }
            },
            error: function (err) {
                console.error("Error al sincronizar surtidor:", err);
                if (mostrarAlertaUsuario) {
                    Swal.fire('Error de conexión', 'No se pudo contactar con el servicio de sincronización.', 'error');
                }
            },
            complete: function () {
                btn.prop('disabled', false).html('<i class="fas fa-cloud-download-alt me-1"></i> Sincronizar Surtidor');
            }
        });
    };

    const pintarTarjetaSurtidor = function (comb) {
        estado.surtidorActual = comb;
        $('#surtidor-nombre').text(`${comb.Tipo_combustible} (Gasoil Grado 2)`);
        $('#surtidor-precio-vigente').text(formatearMoneda(comb.Precio_valor));

        const fechaTexto = comb.FechaActualizacionFormateada || 'Sin fecha registrada';
        const fuenteTexto = comb.Fuente_Actualizacion || 'Carga Manual';
        $('#surtidor-auditoria').html(
            `<i class="fas fa-check-circle text-success me-1"></i>Última actualización: <strong>${fechaTexto}</strong> — Origen: <em>${fuenteTexto}</em>`
        );
    };

    // 4. CONSULTA DE DATOS DEL REPORTE
    const consultarDatosReporte = function (fechaDesde, fechaHasta) {
        const btn = $('#btn-generar-reporte-combustible');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

        $.ajax({
            type: "GET",
            url: URL_REPORTE_COMBUSTIBLE,
            data: { fechaDesde: fechaDesde, fechaHasta: fechaHasta },
            success: function (respuesta) {
                estado.datosCrudos = respuesta || [];
                poblarSelectorVehiculos(estado.datosCrudos);

                // Gráfico 1 siempre muestra la comparativa de toda la flota en el período
                renderizarGraficoPorVehiculo(estado.datosCrudos);

                // KPIs, Gráfico 2 y Tabla responden al filtro de unidad
                actualizarVistaFiltrada();
            },
            error: function (err) {
                console.error("Error al obtener reporte de consumo:", err);
                Swal.fire('Error de conexión', 'No se pudieron obtener los datos de consumo de combustible.', 'error');
            },
            complete: function () {
                btn.prop('disabled', false).html('<i class="fas fa-search"></i> Filtrar');
            }
        });
    };

    const poblarSelectorVehiculos = function (lista) {
        const select = $('#select-comb-vehiculo');
        const previo = select.val();
        const patentes = [...new Set(lista.map(r => r.Vehiculo || 'Sin Patente'))].sort();

        select.empty().append('<option value="TODOS">Toda la Flota (Consolidado)</option>');
        patentes.forEach(p => select.append(`<option value="${p}">Unidad: ${p}</option>`));

        select.val(previo && patentes.includes(previo) ? previo : 'TODOS');
    };

    const actualizarVistaFiltrada = function () {
        const patenteFiltro = $('#select-comb-vehiculo').val() || 'TODOS';
        const universo = patenteFiltro === 'TODOS'
            ? estado.datosCrudos
            : estado.datosCrudos.filter(r => (r.Vehiculo || 'Sin Patente') === patenteFiltro);

        renderizarKPIs(universo);
        renderizarGraficoEvolucion(universo, patenteFiltro);
        renderizarTablaDetalle(universo);
    };

    // 5. CÁLCULO DE KPIS FINANCIEROS Y OPERATIVOS
    const renderizarKPIs = function (lista) {
        const totalGasto = lista.reduce((acc, r) => acc + parseFloat(r.CostoTotalViaje || 0), 0);
        const totalLitros = lista.reduce((acc, r) => acc + parseFloat(r.LitrosConsumidos || 0), 0);
        const totalKms = lista.reduce((acc, r) => acc + parseFloat(r.KmReales || 0), 0);

        const costoPromedioKm = totalKms > 0 ? (totalGasto / totalKms) : 0;
        const precioLitroPonderado = totalLitros > 0 ? (totalGasto / totalLitros) : 0;

        $('#kpi-comb-gasto-total').text(formatearMoneda(totalGasto));
        $('#kpi-comb-sub-viajes').text(`Sobre ${lista.length} ${lista.length === 1 ? 'recorrido auditado' : 'recorridos auditados'}`);

        $('#kpi-comb-litros').text(`${formatearDecimal(totalLitros)} L`);
        $('#kpi-comb-sub-kms').text(`En ${formatearDecimal(totalKms)} km recorridos`);

        $('#kpi-comb-costo-km').text(`${formatearMoneda(costoPromedioKm)} /km`);
        $('#kpi-comb-precio-promedio').text(`${formatearMoneda(precioLitroPonderado)} /L`);
    };

    // 6. GRÁFICO 1: COMPARATIVA POR UNIDAD (ECHARTS BARRAS + LÍNEA DOBLE EJE)
    const renderizarGraficoPorVehiculo = function (listaCompleta) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-combustible-unidades');
        const msgSinDatos = $('#mensaje-sin-datos-comb-unidades');

        if (!listaCompleta || listaCompleta.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        const agrupado = listaCompleta.reduce((acc, r) => {
            const pat = r.Vehiculo || 'Sin Patente';
            if (!acc[pat]) acc[pat] = { gasto: 0, litros: 0 };
            acc[pat].gasto += parseFloat(r.CostoTotalViaje || 0);
            acc[pat].litros += parseFloat(r.LitrosConsumidos || 0);
            return acc;
        }, {});

        const patentesOrdenadas = Object.keys(agrupado).sort((a, b) => agrupado[b].gasto - agrupado[a].gasto);
        const serieGastos = patentesOrdenadas.map(p => Number(agrupado[p].gasto.toFixed(2)));
        const serieLitros = patentesOrdenadas.map(p => Number(agrupado[p].litros.toFixed(2)));

        if (!estado.chartPorVehiculo) {
            estado.chartPorVehiculo = echarts.init(dom);
        }

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                top: 5,
                data: ['Inversión Total ($)', 'Litros Consumidos (L)']
            },
            toolbox: {
                show: true,
                right: 15,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar PNG' }
                }
            },
            grid: {
                top: 60,
                bottom: 35,
                left: '4%',
                right: '4%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: patentesOrdenadas,
                axisLabel: { fontWeight: 'bold' }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Inversión ($)',
                    axisLabel: {
                        formatter: function (val) {
                            return '$' + val.toLocaleString('es-AR');
                        }
                    }
                },
                {
                    type: 'value',
                    name: 'Litros (L)',
                    splitLine: { show: false },
                    axisLabel: { formatter: '{value} L' }
                }
            ],
            series: [
                {
                    name: 'Inversión Total ($)',
                    type: 'bar',
                    yAxisIndex: 0,
                    barMaxWidth: 55,
                    itemStyle: { color: '#198754', borderRadius: [6, 6, 0, 0] },
                    data: serieGastos
                },
                {
                    name: 'Litros Consumidos (L)',
                    type: 'line',
                    yAxisIndex: 1,
                    smooth: true,
                    symbolSize: 8,
                    itemStyle: { color: '#0d6efd' },
                    lineStyle: { width: 3 },
                    data: serieLitros
                }
            ]
        };

        estado.chartPorVehiculo.setOption(option, true);
    };

    // 7. GRÁFICO 2: EVOLUCIÓN TEMPORAL DE GASTO ($) Y COSTO POR KM ($/KM)
    const renderizarGraficoEvolucion = function (listaFiltrada, patenteFiltro) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-combustible-evolucion');
        const msgSinDatos = $('#mensaje-sin-datos-comb-evolucion');

        if (!listaFiltrada || listaFiltrada.length === 0) {
            $(dom).addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        $(dom).removeClass('d-none');

        const porFecha = listaFiltrada.reduce((acc, r) => {
            const f = r.FechaISO;
            if (!acc[f]) acc[f] = { gasto: 0, kms: 0 };
            acc[f].gasto += parseFloat(r.CostoTotalViaje || 0);
            acc[f].kms += parseFloat(r.KmReales || 0);
            return acc;
        }, {});

        const fechasOrdenadas = Object.keys(porFecha).sort();
        const etiquetasFechas = fechasOrdenadas.map(f => formatearFechaIso(f, true));
        const serieGastoDiario = fechasOrdenadas.map(f => Number(porFecha[f].gasto.toFixed(2)));
        const serieCostoKmDiario = fechasOrdenadas.map(f => {
            const kms = porFecha[f].kms;
            return kms > 0 ? Number((porFecha[f].gasto / kms).toFixed(2)) : 0;
        });

        if (!estado.chartEvolucionCostos) {
            estado.chartEvolucionCostos = echarts.init(dom);
        }

        const subtitulo = patenteFiltro === 'TODOS' ? 'Toda la Flota' : `Unidad ${patenteFiltro}`;

        const option = {
            title: {
                text: `Tendencia Diaria — ${subtitulo}`,
                left: 'left',
                textStyle: { fontSize: 14, fontWeight: 'bold', color: '#212529' }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' }
            },
            legend: {
                top: 5,
                data: ['Gasto Diario ($)', 'Costo por Km ($/km)']
            },
            toolbox: {
                show: true,
                right: 15,
                feature: {
                    saveAsImage: { show: true, title: 'Descargar PNG' }
                }
            },
            grid: {
                top: 60,
                bottom: 35,
                left: '4%',
                right: '4%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: etiquetasFechas
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Gasto ($)',
                    axisLabel: {
                        formatter: function (val) {
                            return '$' + val.toLocaleString('es-AR');
                        }
                    }
                },
                {
                    type: 'value',
                    name: 'Costo/Km ($)',
                    splitLine: { show: false },
                    axisLabel: {
                        formatter: function (val) {
                            return '$' + val.toLocaleString('es-AR');
                        }
                    }
                }
            ],
            series: [
                {
                    name: 'Gasto Diario ($)',
                    type: 'bar',
                    yAxisIndex: 0,
                    barMaxWidth: 40,
                    itemStyle: { color: 'rgba(13, 110, 253, 0.75)', borderRadius: [5, 5, 0, 0] },
                    data: serieGastoDiario
                },
                {
                    name: 'Costo por Km ($/km)',
                    type: 'line',
                    yAxisIndex: 1,
                    smooth: true,
                    symbolSize: 7,
                    itemStyle: { color: '#fd7e14' },
                    lineStyle: { width: 3 },
                    data: serieCostoKmDiario
                }
            ]
        };

        estado.chartEvolucionCostos.setOption(option, true);
    };

    // 8. TABLA DE AUDITORÍA DE CONSUMOS CONGELADOS
    const renderizarTablaDetalle = function (lista) {
        const tbody = $('#tbody-detalle-combustible').empty();

        if (!lista || lista.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">
                        <i class="fas fa-folder-open me-2"></i>No se encontraron registros de consumo para los filtros aplicados.
                    </td>
                </tr>
            `);
            return;
        }

        lista.forEach(reg => {
            const esConHdr = reg.Id_HojaRuta !== null;
            const badgeMov = esConHdr
                ? `<span class="badge bg-success bg-opacity-10 text-success border border-success">HDR #${reg.Id_HojaRuta}</span>`
                : `<span class="badge bg-info bg-opacity-10 text-info border border-info">Interno</span>`;

            tbody.append(`
                <tr>
                    <td class="fw-bold">${reg.FechaFormateada}</td>
                    <td><span class="badge bg-light text-dark border">${reg.Vehiculo}</span></td>
                    <td>${badgeMov}</td>
                    <td>${reg.ChoferNombreCompleto}</td>
                    <td class="text-end">${formatearDecimal(reg.KmReales)} km</td>
                    <td class="text-end text-muted">${formatearMoneda(reg.PrecioLitroAplicado)}</td>
                    <td class="text-end fw-semibold text-primary">${formatearMoneda(reg.CostoPorKm)}</td>
                    <td class="text-end">${formatearDecimal(reg.LitrosConsumidos)} L</td>
                    <td class="text-end fw-bold text-success">${formatearMoneda(reg.CostoTotalViaje)}</td>
                </tr>
            `);
        });
    };

    // Public API
    return {
        cargarEn: inicializar
    };
})();