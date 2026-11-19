/* ========================================================================
   SITMAS - Módulo de Reportes: Rendimiento y Kilometraje por Chofer
   Flujo UX:
   1. Selector de Fechas
   2. Listado / Ranking de Choferes
   3. Tarjetas KPI del Chofer Seleccionado
   4. Gráfico de Evolución Cronológica (Real vs. Estimado)
   5. Gráfico Calendar-Pie (Distribución diaria de viajes y KMs por mes)
   6. Bitácora Detallada de Viajes
   Archivo: reporte_choferes.js
   ======================================================================== */

const ReporteChoferesModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        resumenChoferes: [],
        detalleViajes: [],
        idChoferSeleccionado: null,
        mesCalendarioSeleccionado: null,
        chartEvolucionChofer: null,
        chartCalendarioChofer: null
    };

    const URL_RENDIMIENTO_CHOFERES = "https://localhost:44325/api/ReportesLogistica/RendimientoChoferes";

    const NOMBRES_MESES = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Helpers de formateo local (es-AR)
    const formatearDecimal = function (valor) {
        const num = parseFloat(valor || 0);
        return num.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Genera todos los días de un mes 'YYYY-MM' para pintar los números de día en el calendario
    const obtenerDiasDelMes = function (anioMes) {
        const partes = anioMes.split('-');
        const anio = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10); // 1 a 12
        const ultimoDia = new Date(anio, mes, 0).getDate();
        const dias = [];

        for (let d = 1; d <= ultimoDia; d++) {
            const diaStr = String(d).padStart(2, '0');
            dias.push([`${anioMes}-${diaStr}`, 0]);
        }
        return dias;
    };

    // Limpieza segura de instancias ECharts al cambiar de pestaña en la SPA
    const destruirGraficosActivos = function () {
        ['chartEvolucionChofer', 'chartCalendarioChofer'].forEach(key => {
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
            <!-- 1. ENCABEZADO Y SELECTOR DE FECHA -->
            <div class="row fade-in">
                <div class="col-12 d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h4 class="text-primary fw-bold mb-0">
                            <i class="fas fa-id-card-alt me-2"></i>Desempeño y Kilometraje por Chofer
                        </h4>
                        <small class="text-muted">Auditoría de viajes cerrados, cumplimiento de distancias estimadas y distribución diaria</small>
                    </div>

                    <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded border">
                        <label class="small fw-bold mb-0">Desde:</label>
                        <input type="date" id="filtro-chofer-desde" class="form-control form-control-sm" style="width: auto;">

                        <label class="small fw-bold mb-0 ms-2">Hasta:</label>
                        <input type="date" id="filtro-chofer-hasta" class="form-control form-control-sm" style="width: auto;">

                        <button id="btn-filtrar-reporte-choferes" class="btn btn-primary btn-sm ms-2">
                            <i class="fas fa-search"></i> Buscar
                        </button>
                    </div>
                </div>
            </div>

            <!-- 2. LISTADO DE CHOFERES (SELECCIÓN RÁPIDA EN LA PARTE SUPERIOR) -->
            <div class="row fade-in mb-4">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-users text-primary me-2"></i>Listado y Ranking de Choferes
                                </h6>
                                <small class="text-muted">Seleccioná un conductor para inspeccionar sus métricas, evolución y calendario de viajes</small>
                            </div>
                            <span class="badge bg-light text-secondary border">
                                <i class="fas fa-hand-pointer me-1 text-primary"></i>Clic en una fila para ver su ficha
                            </span>
                        </div>

                        <div id="msg-sin-datos-choferes" class="alert alert-light text-center border m-4 p-4 d-none">
                            <i class="fas fa-user-slash fa-2x text-muted mb-2"></i>
                            <p class="mb-0 text-muted">No se encontraron Hojas de Ruta con chofer asignado en el rango de fechas seleccionado.</p>
                        </div>

                        <div class="card-body p-0" id="wrapper-tabla-choferes">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Chofer</th>
                                            <th class="text-center">Viajes Cerrados</th>
                                            <th>Vehículo Más Usado</th>
                                            <th class="text-end">Km Estimados</th>
                                            <th class="text-end">Km Reales</th>
                                            <th class="text-end">Desvío Neto</th>
                                            <th class="text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-ranking-choferes"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN FICHA DEL CHOFER SELECCIONADO -->
            <div id="seccion-ficha-chofer" class="d-none">

                <!-- 3. KPIs DEL CHOFER SELECCIONADO -->
                <div class="row fade-in mb-4">
                    <div class="col-12">
                        <div class="card shadow-sm border-0 border-top border-primary border-4">
                            <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                                <div>
                                    <h6 class="fw-bold text-dark mb-0">
                                        <i class="fas fa-user-check text-success me-2"></i>Indicadores Clave del Conductor
                                    </h6>
                                    <small class="text-muted">Resumen ejecutivo del desempeño en el período filtrado</small>
                                </div>

                                <div class="d-flex align-items-center gap-2">
                                    <label for="select-chofer-individual" class="small fw-bold text-secondary mb-0">Chofer activo:</label>
                                    <select id="select-chofer-individual" class="form-select form-select-sm fw-bold border-primary" style="min-width: 240px;">
                                    </select>
                                </div>
                            </div>

                            <div class="card-body">
                                <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
                                    <div class="col">
                                        <div class="card bg-light border-0 border-start border-primary border-4 h-100">
                                            <div class="card-body py-3">
                                                <div class="d-flex justify-content-between align-items-center mb-1">
                                                    <span class="text-muted small fw-bold text-uppercase">Viajes Realizados</span>
                                                    <i class="fas fa-route text-primary"></i>
                                                </div>
                                                <h3 class="fw-bold text-dark mb-1" id="kpi-chofer-viajes">0</h3>
                                                <small class="text-muted" id="kpi-chofer-sub-viajes">0 en curso</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col">
                                        <div class="card bg-light border-0 border-start border-success border-4 h-100">
                                            <div class="card-body py-3">
                                                <div class="d-flex justify-content-between align-items-center mb-1">
                                                    <span class="text-muted small fw-bold text-uppercase">Kms Reales Recorridos</span>
                                                    <i class="fas fa-tachometer-alt text-success"></i>
                                                </div>
                                                <h3 class="fw-bold text-dark mb-1" id="kpi-chofer-km-reales">0,00 km</h3>
                                                <small class="text-muted" id="kpi-chofer-sub-promedio">Promedio: 0,00 km/viaje</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col">
                                        <div class="card bg-light border-0 border-start border-warning border-4 h-100">
                                            <div class="card-body py-3">
                                                <div class="d-flex justify-content-between align-items-center mb-1">
                                                    <span class="text-muted small fw-bold text-uppercase">Real vs. Estimado</span>
                                                    <i class="fas fa-balance-scale text-warning"></i>
                                                </div>
                                                <h3 class="fw-bold mb-1" id="kpi-chofer-desvio">0,00 km</h3>
                                                <small class="text-muted" id="kpi-chofer-sub-estimado">Estimado: 0,00 km (0%)</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col">
                                        <div class="card bg-light border-0 border-start border-info border-4 h-100">
                                            <div class="card-body py-3">
                                                <div class="d-flex justify-content-between align-items-center mb-1">
                                                    <span class="text-muted small fw-bold text-uppercase">Vehículo Más Usado</span>
                                                    <i class="fas fa-truck text-info"></i>
                                                </div>
                                                <h3 class="fw-bold text-dark mb-1" id="kpi-chofer-vehiculo">---</h3>
                                                <small class="text-muted" id="kpi-chofer-sub-vehiculo">En el 0% de sus viajes</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. EVOLUCIÓN CRONOLÓGICA DEL CHOFER -->
                <div class="row fade-in mb-4">
                    <div class="col-12">
                        <div class="card shadow-sm border-0">
                            <div class="card-header bg-white border-bottom py-3">
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-chart-line text-primary me-2"></i>Evolución Cronológica de Kilometraje
                                </h6>
                                <small class="text-muted">Comparativa viaje a viaje entre distancia planificada (HDR) y distancia real (Odómetro)</small>
                            </div>
                            <div class="card-body">
                                <div id="echarts-evolucion-chofer" style="width: 100%; height: 320px;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 5. GRÁFICO CALENDAR-PIE (DISTRIBUCIÓN DE VIAJES Y KMS POR DÍA) -->
                <div class="row fade-in mb-4">
                    <div class="col-12">
                        <div class="card shadow-sm border-0">
                            <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                                <div>
                                    <h6 class="fw-bold text-dark mb-0">
                                        <i class="fas fa-calendar-alt text-success me-2"></i>Calendario de Actividad: Distribución de Viajes y Kilómetros
                                    </h6>
                                    <small class="text-muted">Cada gráfico circular representa un día trabajado: las porciones indican la cantidad de viajes (HDR) y su proporción en KMs</small>
                                </div>

                                <div class="d-flex align-items-center gap-2">
                                    <label for="select-mes-calendario" class="small fw-bold text-secondary mb-0">Mes visualizado:</label>
                                    <select id="select-mes-calendario" class="form-select form-select-sm fw-bold border-success" style="min-width: 190px;">
                                    </select>
                                </div>
                            </div>
                            <div class="card-body">
                                <div id="echarts-calendario-chofer" style="width: 100%; height: 470px;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 6. LISTADO DETALLADO DE VIAJES DEL CHOFER -->
                <div class="row fade-in">
                    <div class="col-12">
                        <div class="card shadow-sm border-0">
                            <div class="card-header bg-white border-bottom py-3">
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-list-alt text-primary me-2"></i>Listado de Viajes del Chofer (<span id="titulo-lista-viajes-chofer">---</span>)
                                </h6>
                                <small class="text-muted">Detalle completo de Hojas de Ruta asignadas en el período seleccionado</small>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-sm table-hover align-middle mb-0">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Fecha</th>
                                                <th>HDR #</th>
                                                <th>Unidad</th>
                                                <th>Estado</th>
                                                <th class="text-end">Odóm. Inicio</th>
                                                <th class="text-end">Odóm. Final</th>
                                                <th class="text-end">Km Estimados</th>
                                                <th class="text-end">Km Reales</th>
                                                <th class="text-end">Desvío</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tbody-viajes-chofer-individual"></tbody>
                                    </table>
                                </div>
                            </div>
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
        const principal = $('#contenedor-dinamico-reportes-logistica');

        principal.off('click', '#btn-filtrar-reporte-choferes').on('click', '#btn-filtrar-reporte-choferes', function () {
            const desde = $('#filtro-chofer-desde').val();
            const hasta = $('#filtro-chofer-hasta').val();

            if (!desde || !hasta) {
                Swal.fire('Fechas requeridas', 'Por favor seleccioná ambas fechas.', 'warning');
                return;
            }
            if (desde > hasta) {
                Swal.fire('Rango inválido', 'La fecha "Desde" no puede ser mayor a "Hasta".', 'warning');
                return;
            }

            consultarRendimientoChoferes(desde, hasta);
        });

        principal.off('change', '#select-chofer-individual').on('change', '#select-chofer-individual', function () {
            const idChofer = parseInt($(this).val(), 10);
            if (idChofer > 0) {
                seleccionarChofer(idChofer, false);
            }
        });

        principal.off('click', '.fila-chofer-ranking').on('click', '.fila-chofer-ranking', function () {
            const idChofer = parseInt($(this).data('id-chofer'), 10);
            if (idChofer > 0) {
                seleccionarChofer(idChofer, true);
            }
        });

        principal.off('change', '#select-mes-calendario').on('change', '#select-mes-calendario', function () {
            const mesElegido = $(this).val();
            if (mesElegido && estado.idChoferSeleccionado) {
                estado.mesCalendarioSeleccionado = mesElegido;
                const datosChofer = estado.resumenChoferes.find(c => c.Id_Chofer === estado.idChoferSeleccionado);
                const viajesDelChofer = estado.detalleViajes.filter(v => v.Id_Chofer === estado.idChoferSeleccionado);
                if (datosChofer) {
                    renderizarGraficoCalendarioPie(datosChofer, viajesDelChofer, mesElegido);
                }
            }
        });

        $(window).off('resize.reporteChoferes').on('resize.reporteChoferes', function () {
            if (estado.chartEvolucionChofer && !estado.chartEvolucionChofer.isDisposed()) {
                estado.chartEvolucionChofer.resize();
            }
            if (estado.chartCalendarioChofer && !estado.chartCalendarioChofer.isDisposed()) {
                estado.chartCalendarioChofer.resize();
            }
        });
    };

    const configurarFechasPorDefecto = function () {
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), 0, 1);

        $('#filtro-chofer-hasta').val(hoy.toISOString().split('T')[0]);
        $('#filtro-chofer-desde').val(primerDia.toISOString().split('T')[0]);

        $('#btn-filtrar-reporte-choferes').trigger('click');
    };

    // 3. CONSULTA AL ENDPOINT ENRIQUECIDO (sp_ReporteRendimiento_Choferes)
    const consultarRendimientoChoferes = function (fechaDesde, fechaHasta) {
        const btn = $('#btn-filtrar-reporte-choferes');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

        $.ajax({
            type: "GET",
            url: URL_RENDIMIENTO_CHOFERES,
            data: { fechaDesde: fechaDesde, fechaHasta: fechaHasta },
            success: function (respuesta) {
                estado.resumenChoferes = (respuesta && respuesta.ResumenChoferes) || [];
                estado.detalleViajes = (respuesta && respuesta.DetalleViajes) || [];

                renderizarTablaRanking(estado.resumenChoferes);
                poblarSelectChoferes(estado.resumenChoferes);
            },
            error: function (err) {
                console.error("Error al obtener rendimiento de choferes:", err);
                Swal.fire('Error de conexión', 'No se pudo cargar el reporte de choferes.', 'error');
            },
            complete: function () {
                btn.prop('disabled', false).html('<i class="fas fa-search"></i> Buscar');
            }
        });
    };

    // 4. TABLA CONSOLIDADA / LISTADO SUPERIOR DE CHOFERES
    const renderizarTablaRanking = function (listaChoferes) {
        const msgSinDatos = $('#msg-sin-datos-choferes');
        const wrapperTabla = $('#wrapper-tabla-choferes');
        const tbody = $('#tbody-ranking-choferes').empty();

        if (!listaChoferes || listaChoferes.length === 0) {
            wrapperTabla.addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        wrapperTabla.removeClass('d-none');

        listaChoferes.forEach(c => {
            const esActivo = c.Id_Chofer === estado.idChoferSeleccionado;
            const signo = c.DesvioKmTotal > 0 ? '+' : '';
            const claseDesvio = c.DesvioKmTotal > 5 ? 'text-danger fw-bold' : (c.DesvioKmTotal < -5 ? 'text-primary fw-bold' : 'text-success fw-semibold');

            tbody.append(`
                <tr class="fila-chofer-ranking ${esActivo ? 'table-primary' : ''}" data-id-chofer="${c.Id_Chofer}" style="cursor: pointer;">
                    <td class="fw-bold text-dark">
                        <i class="fas fa-user-circle text-secondary me-2"></i>${c.ChoferNombreCompleto}
                    </td>
                    <td class="text-center">
                        <span class="badge bg-primary rounded-pill">${c.ViajesCerrados}</span>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark border">${c.VehiculoMasUsado}</span>
                        <small class="text-muted ms-1">(${c.PorcentajeVehiculoHabitual}%)</small>
                    </td>
                    <td class="text-end text-muted">${formatearDecimal(c.KmEstimadosTotal)} km</td>
                    <td class="text-end fw-bold text-success">${formatearDecimal(c.KmRealesTotal)} km</td>
                    <td class="text-end ${claseDesvio}">
                        ${signo}${formatearDecimal(c.DesvioKmTotal)} km <small>(${signo}${c.DesvioPorcentaje}%)</small>
                    </td>
                    <td class="text-center">
                        <button type="button" class="btn btn-sm ${esActivo ? 'btn-primary' : 'btn-outline-primary'}">
                            <i class="fas fa-chart-line me-1"></i>${esActivo ? 'Viendo' : 'Ver Ficha'}
                        </button>
                    </td>
                </tr>
            `);
        });
    };

    // 5. POBLAR SELECTOR Y ACTUALIZAR FICHA COMPLETA DEL CHOFER
    const poblarSelectChoferes = function (listaChoferes) {
        const select = $('#select-chofer-individual').empty();
        const seccionFicha = $('#seccion-ficha-chofer');

        if (!listaChoferes || listaChoferes.length === 0) {
            seccionFicha.addClass('d-none');
            return;
        }

        seccionFicha.removeClass('d-none');
        listaChoferes.forEach(c => {
            select.append(`<option value="${c.Id_Chofer}">${c.ChoferNombreCompleto} (${c.ViajesCerrados} viajes)</option>`);
        });

        seleccionarChofer(listaChoferes[0].Id_Chofer, false);
    };

    const seleccionarChofer = function (idChofer, hacerScroll) {
        const datosChofer = estado.resumenChoferes.find(c => c.Id_Chofer === idChofer);
        if (!datosChofer) return;

        estado.idChoferSeleccionado = idChofer;
        $('#select-chofer-individual').val(idChofer);
        renderizarTablaRanking(estado.resumenChoferes);

        // Actualizar 4 KPIs Individuales
        $('#kpi-chofer-viajes').text(datosChofer.ViajesCerrados);
        $('#kpi-chofer-sub-viajes').text(
            datosChofer.ViajesEnCurso > 0
                ? `+ ${datosChofer.ViajesEnCurso} recorrido(s) en curso`
                : 'Todos los viajes cerrados'
        );

        $('#kpi-chofer-km-reales').text(`${formatearDecimal(datosChofer.KmRealesTotal)} km`);
        $('#kpi-chofer-sub-promedio').text(`Promedio: ${formatearDecimal(datosChofer.PromedioKmPorViaje)} km / viaje`);

        const signo = datosChofer.DesvioKmTotal > 0 ? '+' : '';
        $('#kpi-chofer-desvio')
            .text(`${signo}${formatearDecimal(datosChofer.DesvioKmTotal)} km`)
            .removeClass('text-danger text-success text-dark')
            .addClass(datosChofer.DesvioKmTotal > 5 ? 'text-danger' : 'text-success');

        $('#kpi-chofer-sub-estimado').text(
            `Estimado: ${formatearDecimal(datosChofer.KmEstimadosTotal)} km (${signo}${datosChofer.DesvioPorcentaje}%)`
        );

        $('#kpi-chofer-vehiculo').text(datosChofer.VehiculoMasUsado);
        $('#kpi-chofer-sub-vehiculo').text(`Utilizado en el ${datosChofer.PorcentajeVehiculoHabitual}% de sus viajes`);

        // Filtrar viajes individuales de este chofer desde Result Set 2
        const viajesDelChofer = estado.detalleViajes.filter(v => v.Id_Chofer === idChofer);

        // Renderizar gráficos y tabla en el orden UX definido
        renderizarGraficoEvolucionChofer(datosChofer, viajesDelChofer);
        const mesActivo = configurarSelectorMesCalendario(viajesDelChofer);
        renderizarGraficoCalendarioPie(datosChofer, viajesDelChofer, mesActivo);
        renderizarTablaViajesChofer(datosChofer.ChoferNombreCompleto, viajesDelChofer);

        if (hacerScroll) {
            document.getElementById('seccion-ficha-chofer').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // 6. GRÁFICO EVOLUCIÓN CRONOLÓGICA DEL CHOFER
    const renderizarGraficoEvolucionChofer = function (datosChofer, viajesDelChofer) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-evolucion-chofer');
        if (!estado.chartEvolucionChofer || estado.chartEvolucionChofer.isDisposed()) {
            estado.chartEvolucionChofer = echarts.init(dom);
        }

        const cerradosOrdenados = viajesDelChofer
            .filter(v => v.EstaCerrado === 1)
            .sort((a, b) => new Date(a.HojaRutaFecha) - new Date(b.HojaRutaFecha) || a.Id_HojaRuta - b.Id_HojaRuta);

        if (cerradosOrdenados.length === 0) {
            estado.chartEvolucionChofer.clear();
            estado.chartEvolucionChofer.setOption({
                title: {
                    text: `${datosChofer.ChoferNombreCompleto} aún no posee viajes cerrados en este período`,
                    subtext: 'La curva comparativa se habilitará cuando cierre su primer registro de odómetro.',
                    left: 'center',
                    top: 'middle',
                    textStyle: { fontSize: 14, color: '#6c757d' },
                    subtextStyle: { fontSize: 12, color: '#adb5bd' }
                }
            }, true);
            estado.chartEvolucionChofer.resize();
            return;
        }

        const etiquetas = cerradosOrdenados.map(h => `${h.FechaFormateada}\n(HDR #${h.Id_HojaRuta})`);
        const serieEst = cerradosOrdenados.map(h => h.KmEstimadosHDR);
        const serieReal = cerradosOrdenados.map(h => ({
            value: h.KmReales,
            vehiculo: h.Vehiculo,
            desvio: h.DesvioKm
        }));

        const option = {
            title: {
                text: `Evolución Cronológica: ${datosChofer.ChoferNombreCompleto}`,
                left: 'left',
                textStyle: { fontSize: 13, fontWeight: 'bold', color: '#343a40' }
            },
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    if (!params || params.length === 0) return '';
                    const item = cerradosOrdenados[params[0].dataIndex];
                    const signo = item.DesvioKm > 0 ? '+' : '';
                    return `
                        <strong>${item.FechaFormateada} (HDR #${item.Id_HojaRuta})</strong><br/>
                        Unidad: <strong>${item.Vehiculo}</strong><br/>
                        Km Estimados: <strong>${formatearDecimal(item.KmEstimadosHDR)} km</strong><br/>
                        Km Reales: <strong>${formatearDecimal(item.KmReales)} km</strong><br/>
                        Desvío: <strong>${signo}${formatearDecimal(item.DesvioKm)} km</strong>
                    `;
                }
            },
            legend: { top: 0, right: 10, data: ['Km Estimados (HDR)', 'Km Reales (Odómetro)'] },
            grid: { top: 48, bottom: 40, left: '3%', right: '3%', containLabel: true },
            xAxis: { type: 'category', data: etiquetas, axisLabel: { fontSize: 11 } },
            yAxis: {
                type: 'value',
                name: 'Kilómetros (Km)',
                axisLabel: { formatter: val => val.toLocaleString('es-AR') + ' km' },
                splitLine: { lineStyle: { type: 'dashed', color: '#e9ecef' } }
            },
            series: [
                {
                    name: 'Km Estimados (HDR)',
                    type: 'line',
                    smooth: 0.2,
                    symbolSize: 7,
                    lineStyle: { width: 2, type: 'dashed', color: '#6c757d' },
                    itemStyle: { color: '#6c757d' },
                    data: serieEst
                },
                {
                    name: 'Km Reales (Odómetro)',
                    type: 'line',
                    smooth: 0.2,
                    symbolSize: 9,
                    lineStyle: { width: 3, color: '#0d6efd' },
                    itemStyle: { color: '#0d6efd' },
                    areaStyle: { color: 'rgba(13, 110, 253, 0.08)' },
                    data: serieReal
                }
            ]
        };

        estado.chartEvolucionChofer.setOption(option, true);
        estado.chartEvolucionChofer.resize();
    };

    // 7. GRÁFICO CALENDAR-PIE (DISTRIBUCIÓN DE VIAJES Y KMS POR DÍA)
    const configurarSelectorMesCalendario = function (viajesDelChofer) {
        const selectMes = $('#select-mes-calendario').empty();
        const desdeStr = $('#filtro-chofer-desde').val();
        const hastaStr = $('#filtro-chofer-hasta').val();

        // Construir lista de meses comprendidos en el rango filtrado (del más reciente al más antiguo)
        const mesesRango = [];
        if (desdeStr && hastaStr) {
            const [anioIni, mesIni] = desdeStr.split('-').map(Number);
            const [anioFin, mesFin] = hastaStr.split('-').map(Number);
            let y = anioFin;
            let m = mesFin;

            while (y > anioIni || (y === anioIni && m >= mesIni)) {
                const clave = `${y}-${String(m).padStart(2, '0')}`;
                const cantidadViajesMes = viajesDelChofer.filter(v => v.FechaISO && v.FechaISO.startsWith(clave)).length;
                mesesRango.push({
                    clave: clave,
                    etiqueta: `${NOMBRES_MESES[m - 1]} ${y}${cantidadViajesMes > 0 ? ` (${cantidadViajesMes} viajes)` : ''}`,
                    tieneViajes: cantidadViajesMes > 0
                });

                m--;
                if (m === 0) {
                    m = 12;
                    y--;
                }
            }
        }

        if (mesesRango.length === 0) {
            const fallback = new Date().toISOString().slice(0, 7);
            mesesRango.push({ clave: fallback, etiqueta: fallback, tieneViajes: false });
        }

        mesesRango.forEach(item => {
            selectMes.append(`<option value="${item.clave}">${item.etiqueta}</option>`);
        });

        // Seleccionar automáticamente el mes más reciente que tenga viajes del chofer
        const mesConActividad = mesesRango.find(m => m.tieneViajes);
        const mesPorDefecto = mesConActividad ? mesConActividad.clave : mesesRango[0].clave;

        estado.mesCalendarioSeleccionado = mesPorDefecto;
        selectMes.val(mesPorDefecto);
        return mesPorDefecto;
    };

    const renderizarGraficoCalendarioPie = function (datosChofer, viajesDelChofer, anioMes) {
        if (typeof echarts === 'undefined') return;

        const dom = document.getElementById('echarts-calendario-chofer');
        if (!estado.chartCalendarioChofer || estado.chartCalendarioChofer.isDisposed()) {
            estado.chartCalendarioChofer = echarts.init(dom);
        }

        // Filtrar viajes del chofer correspondientes al mes seleccionado
        const viajesMes = viajesDelChofer.filter(v => v.FechaISO && v.FechaISO.startsWith(anioMes));

        // Agrupar viajes por fecha exacta (YYYY-MM-DD)
        const mapaPorDia = {};
        viajesMes.forEach(v => {
            if (!mapaPorDia[v.FechaISO]) {
                mapaPorDia[v.FechaISO] = [];
            }
            mapaPorDia[v.FechaISO].push(v);
        });

        const anchoContenedor = dom.clientWidth || 700;
        const anchoCelda = Math.max(54, Math.min(92, Math.floor((anchoContenedor - 40) / 7)));
        const altoCelda = 68;
        const radioTorta = 18;

        const diasDelMes = obtenerDiasDelMes(anioMes);
        const paletaViajes = ['#0d6efd', '#198754', '#fd7e14', '#6f42c1', '#20c997', '#dc3545'];

        // Serie base invisble que dibuja el número de cada día (01..31) en la esquina superior izquierda
        const seriesCalendario = [
            {
                id: 'etiquetas-dias',
                type: 'scatter',
                coordinateSystem: 'calendar',
                symbolSize: 0,
                silent: true,
                label: {
                    show: true,
                    formatter: function (params) {
                        return params.value[0].split('-')[2];
                    },
                    offset: [-anchoCelda / 2 + 12, -altoCelda / 2 + 12],
                    fontSize: 11,
                    fontWeight: 'bold',
                    color: '#6c757d'
                },
                data: diasDelMes
            }
        ];

        // Agregar una mini-torta (Pie) por cada día que tuvo actividad
        Object.keys(mapaPorDia).forEach(fechaISO => {
            const viajesDelDia = mapaPorDia[fechaISO];
            const totalKmDia = viajesDelDia.reduce((acc, item) => {
                const km = item.EstaCerrado === 1
                    ? (item.KmReales > 0 ? item.KmReales : item.KmEstimadosHDR)
                    : item.KmEstimadosHDR;
                return acc + km;
            }, 0);

            const porciones = viajesDelDia.map((v, idx) => {
                const kmViaje = v.EstaCerrado === 1
                    ? (v.KmReales > 0 ? v.KmReales : v.KmEstimadosHDR)
                    : v.KmEstimadosHDR;

                return {
                    name: `HDR #${v.Id_HojaRuta} (${v.Vehiculo})`,
                    value: parseFloat(kmViaje.toFixed(2)),
                    fechaFormateada: v.FechaFormateada,
                    estadoHDR: v.EstadoHDR,
                    estaCerrado: v.EstaCerrado,
                    kmReales: v.KmReales,
                    kmEstimados: v.KmEstimadosHDR,
                    cantidadViajesDia: viajesDelDia.length,
                    totalKmDia: totalKmDia,
                    itemStyle: {
                        color: paletaViajes[idx % paletaViajes.length],
                        borderColor: '#ffffff',
                        borderWidth: 1.5
                    }
                };
            });

            seriesCalendario.push({
                id: `pie-${fechaISO}`,
                type: 'pie',
                coordinateSystem: 'calendar',
                center: fechaISO,
                radius: radioTorta,
                label: {
                    show: true,
                    position: 'center',
                    formatter: () => `${viajesDelDia.length}`,
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: '#ffffff',
                    textBorderColor: 'rgba(0,0,0,0.45)',
                    textBorderWidth: 2
                },
                data: porciones
            });
        });

        const [anioTxt, mesTxt] = anioMes.split('-');
        const tituloMes = `${NOMBRES_MESES[parseInt(mesTxt, 10) - 1]} ${anioTxt}`;

        const option = {
            title: {
                text: `${datosChofer.ChoferNombreCompleto} — ${tituloMes}`,
                subtext: viajesMes.length > 0
                    ? `El número en el centro de cada círculo indica la cantidad de viajes del día; cada porción representa los KMs de cada HDR.`
                    : `Sin hojas de ruta registradas para este conductor en ${tituloMes}.`,
                left: 'center',
                top: 0,
                textStyle: { fontSize: 14, fontWeight: 'bold', color: '#212529' },
                subtextStyle: { fontSize: 11, color: '#6c757d' }
            },
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    const d = params.data;
                    if (!d || !d.fechaFormateada) return '';
                    const tipoKm = d.estaCerrado === 1 ? 'Km Reales' : 'Km Estimados (En curso)';
                    return `
                        <div style="min-width: 210px;">
                            <strong><i class="fas fa-calendar-day me-1"></i>${d.fechaFormateada}</strong><br/>
                            <span class="text-muted">Actividad del día:</span> <strong>${d.cantidadViajesDia} viaje(s)</strong> | <strong>${formatearDecimal(d.totalKmDia)} km</strong>
                            <hr style="margin: 5px 0;"/>
                            <span style="color:${params.color}; font-weight:bold;">● ${d.name}</span><br/>
                            Estado: <strong>${d.estadoHDR}</strong><br/>
                            ${tipoKm}: <strong>${formatearDecimal(d.value)} km</strong> (${params.percent}%)
                        </div>
                    `;
                }
            },
            calendar: {
                top: 72,
                left: 'center',
                orient: 'vertical',
                cellSize: [anchoCelda, altoCelda],
                range: anioMes,
                yearLabel: { show: false },
                monthLabel: { show: false },
                dayLabel: {
                    firstDay: 1,
                    nameMap: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                    margin: 12,
                    fontWeight: 'bold',
                    color: '#495057'
                },
                itemStyle: {
                    borderWidth: 1,
                    borderColor: '#dee2e6',
                    color: '#ffffff'
                },
                splitLine: {
                    show: true,
                    lineStyle: { color: '#adb5bd', width: 1.5 }
                }
            },
            series: seriesCalendario
        };

        estado.chartCalendarioChofer.setOption(option, true);
        estado.chartCalendarioChofer.resize();
    };

    // 8. TABLA DETALLADA DE VIAJES DEL CHOFER SELECCIONADO
    const renderizarTablaViajesChofer = function (nombreChofer, viajesDelChofer) {
        $('#titulo-lista-viajes-chofer').text(nombreChofer);
        const tbody = $('#tbody-viajes-chofer-individual').empty();

        if (!viajesDelChofer || viajesDelChofer.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="9" class="text-center text-muted py-3">
                        No hay viajes registrados para este chofer en el período seleccionado.
                    </td>
                </tr>
            `);
            return;
        }

        viajesDelChofer.forEach(v => {
            const cerrado = v.EstaCerrado === 1;
            const badgeEstado = cerrado
                ? `<span class="badge bg-success bg-opacity-10 text-success border border-success">Cerrado</span>`
                : `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning">${v.EstadoHDR}</span>`;

            const signo = v.DesvioKm > 0 ? '+' : '';
            const claseDesvio = !cerrado
                ? 'text-muted'
                : (v.DesvioKm > 5 ? 'text-danger fw-bold' : 'text-success fw-semibold');

            tbody.append(`
                <tr>
                    <td class="fw-semibold">${v.FechaFormateada}</td>
                    <td><span class="badge bg-primary">HDR #${v.Id_HojaRuta}</span></td>
                    <td><span class="badge bg-light text-dark border">${v.Vehiculo}</span></td>
                    <td>${badgeEstado}</td>
                    <td class="text-end text-muted">${v.InicioOdom !== null ? formatearDecimal(v.InicioOdom) : '---'}</td>
                    <td class="text-end text-muted">${v.FinalOdom !== null ? formatearDecimal(v.FinalOdom) : 'En curso'}</td>
                    <td class="text-end">${formatearDecimal(v.KmEstimadosHDR)} km</td>
                    <td class="text-end fw-bold ${cerrado ? 'text-success' : 'text-muted'}">
                        ${cerrado ? formatearDecimal(v.KmReales) + ' km' : 'Pendiente'}
                    </td>
                    <td class="text-end ${claseDesvio}">
                        ${cerrado ? `${signo}${formatearDecimal(v.DesvioKm)} km` : '---'}
                    </td>
                </tr>
            `);
        });
    };

    // Public API
    return {
        cargarEn: inicializar
    };
})();


