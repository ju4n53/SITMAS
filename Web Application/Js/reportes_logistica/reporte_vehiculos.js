
/* ========================================================================
   SITMAS - Módulo de Reportes: Uso de Vehículos y Carta de Control (SPC)
   Archivo: reporte_vehiculos.js
   ======================================================================== */

const ReporteVehiculosModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        datosCrudos: [],
        instanciaGraficoUso: null,      // Gráfico 1: Comparativa general de flota
        instanciaGraficoControl: null   // Gráfico 2: Carta de Control individual
    };

    const URL_REPORTE_VEHICULOS = "https://localhost:44325/api/ReportesLogistica/UsoVehiculos";

    // 1. INICIALIZACIÓN DE LA INTERFAZ
    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <!-- ENCABEZADO Y FILTROS GLOBALES DE FECHA -->
            <div class="row fade-in">
                <div class="col-12 d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h4 class="text-primary fw-bold mb-0">Uso de Flota y Control Estadístico</h4>
                        <small class="text-muted">Análisis de kilómetros recorridos, viajes finalizados y estabilidad operativa</small>
                    </div>
                    
                    <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded border">
                        <label class="small fw-bold mb-0">Desde:</label>
                        <input type="date" id="filtro-fecha-desde" class="form-control form-control-sm" style="width: auto;">
                        
                        <label class="small fw-bold mb-0 ms-2">Hasta:</label>
                        <input type="date" id="filtro-fecha-hasta" class="form-control form-control-sm" style="width: auto;">
                        
                        <button id="btn-generar-reporte-vehiculos" class="btn btn-primary btn-sm ms-2">
                            <i class="fas fa-search"></i> Buscar
                        </button>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 1: GRÁFICO COMPARATIVO DE FLOTA -->
            <div class="row fade-in mb-4">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3">
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-chart-bar text-success me-2"></i>Comparativa General por Unidad (Kms vs. Viajes)
                            </h6>
                        </div>
                        <div class="card-body">
                            <div id="mensaje-sin-datos-vehiculos" class="alert alert-light text-center border my-4 p-4 d-none">
                                <i class="fas fa-truck fa-2x text-muted mb-2"></i>
                                <p class="mb-0 text-muted">No se encontraron Hojas de Ruta finalizadas en el período seleccionado.</p>
                            </div>

                            <div id="wrapper-canvas-vehiculos" style="position: relative; height: 360px; width: 100%;">
                                <canvas id="chartUsoVehiculos"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 2: CARTA DE CONTROL ESTADÍSTICO POR VEHÍCULO -->
            <div class="row fade-in" id="seccion-carta-control">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">
                                    <i class="fas fa-wave-square text-primary me-2"></i>Carta de Control de Kilometraje por Viaje
                                </h6>
                                <small class="text-muted">Detección de desvíos fuera de los límites normales para la unidad seleccionada</small>
                            </div>

                            <!-- Selector de Unidad (Estratificación) -->
                            <div class="d-flex align-items-center gap-2">
                                <label for="select-vehiculo-control" class="small fw-bold text-secondary mb-0">Unidad:</label>
                                <select id="select-vehiculo-control" class="form-select form-select-sm fw-bold border-primary" style="min-width: 200px;">
                                    <option value="">Sin unidades disponibles</option>
                                </select>
                            </div>
                        </div>

                        <div class="card-body">
                            <!-- Tarjetas resumen de los parámetros estadísticos -->
                            <div class="row g-2 mb-3 text-center" id="kpi-carta-control">
                                <div class="col-6 col-md-3">
                                    <div class="p-2 rounded bg-light border">
                                        <small class="text-muted d-block">Límite Inferior (LCI)</small>
                                        <span class="fw-bold text-secondary" id="stat-lci">0.00 km</span>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="p-2 rounded bg-light border border-success">
                                        <small class="text-success d-block fw-bold">Promedio / Línea Central</small>
                                        <span class="fw-bold text-success" id="stat-media">0.00 km</span>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="p-2 rounded bg-light border">
                                        <small class="text-muted d-block">Límite Superior (LCS)</small>
                                        <span class="fw-bold text-secondary" id="stat-lcs">0.00 km</span>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="p-2 rounded bg-light border" id="box-stat-anomalias">
                                        <small class="text-muted d-block">Viajes Fuera de Control</small>
                                        <span class="fw-bold" id="stat-anomalias">0</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Mensaje si el vehículo no tiene viajes -->
                            <div id="mensaje-sin-datos-control" class="alert alert-light text-center border my-4 p-4 d-none">
                                <p class="mb-0 text-muted">Seleccioná una unidad con viajes finalizados para visualizar su carta de control.</p>
                            </div>

                            <!-- Canvas de la Carta de Control -->
                            <div id="wrapper-canvas-control" style="position: relative; height: 360px; width: 100%;">
                                <canvas id="chartCartaControl"></canvas>
                            </div>
                            <!-- Panel de Diagnóstico-->
                            <div id="alerta-diagnostico-control" class="mt-3"></div>
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

        // Botón Filtrar por fechas (Consulta al Backend)
        principal.off('click', '#btn-generar-reporte-vehiculos').on('click', '#btn-generar-reporte-vehiculos', function () {
            const desde = $('#filtro-fecha-desde').val();
            const hasta = $('#filtro-fecha-hasta').val();

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

        // Cambio de vehículo en el <select> (Procesamiento instantáneo en memoria)
        principal.off('change', '#select-vehiculo-control').on('change', '#select-vehiculo-control', function () {
            const patenteSeleccionada = $(this).val();
            actualizarCartaControlPorVehiculo(patenteSeleccionada);
        });
    };

    const configurarFechasPorDefecto = function () {
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), 0, 1);

        $('#filtro-fecha-hasta').val(hoy.toISOString().split('T')[0]);
        $('#filtro-fecha-desde').val(primerDia.toISOString().split('T')[0]);

        $('#btn-generar-reporte-vehiculos').trigger('click');
    };

    // 3. CONSULTA A LA API C#
    const consultarDatosApi = function (fechaDesde, fechaHasta) {
        const btn = $('#btn-generar-reporte-vehiculos');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Cargando...');

        $.ajax({
            type: "GET",
            url: URL_REPORTE_VEHICULOS,
            data: { fechaDesde: fechaDesde, fechaHasta: fechaHasta },
            success: function (respuesta) {
                estado.datosCrudos = respuesta || [];

                // 1. Renderizamos el gráfico general de flota
                const datosFlota = procesarDatosPorVehiculo(estado.datosCrudos);
                renderizarGraficoFlota(datosFlota);

                // 2. Llenamos el <select> de vehículos y disparamos la Carta de Control
                poblarSelectVehiculos(datosFlota.etiquetas);
            },
            error: function (err) {
                console.error("Error al obtener reporte de vehículos:", err);
                Swal.fire('Error de conexión', 'No se pudieron obtener los datos desde el servidor.', 'error');
            },
            complete: function () {
                btn.prop('disabled', false).html('<i class="fas fa-search"></i> Buscar');
            }
        });
    };

    // 4. LÓGICA DEL GRÁFICO 1 (FLOTA GENERAL)
    const procesarDatosPorVehiculo = function (listaHdr) {
        const agrupado = listaHdr.reduce((acc, item) => {
            if (item.Id_Estado === 5) {
                const patente = item.Vehiculo || 'Sin Patente';
                if (!acc[patente]) {
                    acc[patente] = { totalKms: 0, cantidadViajes: 0 };
                }
                acc[patente].totalKms += parseFloat(item.Distancia_Total_Estimada_Km || 0);
                acc[patente].cantidadViajes += 1;
            }
            return acc;
        }, {});

        const patentesOrdenadas = Object.keys(agrupado).sort(
            (a, b) => agrupado[b].totalKms - agrupado[a].totalKms
        );

        return {
            etiquetas: patentesOrdenadas,
            kms: patentesOrdenadas.map(p => Number(agrupado[p].totalKms.toFixed(2))),
            viajes: patentesOrdenadas.map(p => agrupado[p].cantidadViajes)
        };
    };

    const renderizarGraficoFlota = function (datos) {
        const msgSinDatos = $('#mensaje-sin-datos-vehiculos');
        const wrapperCanvas = $('#wrapper-canvas-vehiculos');

        if (datos.etiquetas.length === 0) {
            wrapperCanvas.addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        wrapperCanvas.removeClass('d-none');

        const ctx = document.getElementById('chartUsoVehiculos').getContext('2d');
        if (estado.instanciaGraficoUso) {
            estado.instanciaGraficoUso.destroy();
        }

        estado.instanciaGraficoUso = new Chart(ctx, {
            data: {
                labels: datos.etiquetas,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Distancia Estimada (Km)',
                        data: datos.kms,
                        backgroundColor: 'rgba(25, 135, 84, 0.75)',
                        borderColor: 'rgba(25, 135, 84, 1)',
                        borderWidth: 1,
                        borderRadius: 6,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Hojas de Ruta Finalizadas',
                        data: datos.viajes,
                        backgroundColor: 'rgba(13, 110, 253, 1)',
                        borderColor: 'rgba(13, 110, 253, 1)',
                        borderWidth: 3,
                        pointRadius: 5,
                        tension: 0.2,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        beginAtZero: true,
                        title: { display: true, text: 'Kilómetros Recorridos (Km)', font: { weight: 'bold' } }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Cantidad de Viajes', font: { weight: 'bold' } }
                    }
                }
            }
        });
    };

    // 5. LÓGICA DEL GRÁFICO 2 (CARTA DE CONTROL ESTADÍSTICO)
    const poblarSelectVehiculos = function (listaPatentes) {
        const select = $('#select-vehiculo-control');
        select.empty();

        if (!listaPatentes || listaPatentes.length === 0) {
            select.append('<option value="">Sin unidades con viajes</option>');
            actualizarCartaControlPorVehiculo(null);
            return;
        }

        listaPatentes.forEach(patente => {
            select.append(`<option value="${patente}">${patente}</option>`);
        });

        // Seleccionamos automáticamente la primera unidad (la de mayor recorrido) y dibujamos
        select.trigger('change');
    };

    // 6. GENERADOR DE ALERTAS DESCRIPTIVAS (Traducción Estadística -> Lenguaje de Negocio)
    const renderizarDiagnosticoControl = function (patente, viajesUnidad, media, lcs, lci) {
        const contenedorAlerta = $('#alerta-diagnostico-control').empty();
        const n = viajesUnidad.length;

        // ESCENARIO 1: Muestra estadística insuficiente
        if (n < 3) {
            contenedorAlerta.html(`
                <div class="alert alert-warning border-start border-warning border-4 shadow-sm mb-0" role="alert">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-info-circle fa-lg me-3 text-warning"></i>
                        <div>
                            <h6 class="alert-heading fw-bold mb-1">Muestra estadística insuficiente (${n} ${n === 1 ? 'viaje registrado' : 'viajes registrados'})</h6>
                            <p class="mb-0 small">
                                La unidad <strong>${patente}</strong> necesita al menos <strong>3 Hojas de Ruta finalizadas</strong> en el período seleccionado para calcular límites de control confiables. Con tan pocos datos, el promedio y los límites pueden verse distorsionados.
                            </p>
                        </div>
                    </div>
                </div>
            `);
            return;
        }

        // Clasificamos los viajes que se salieron de control
        const desviosSuperiores = viajesUnidad.filter(v => parseFloat(v.Distancia_Total_Estimada_Km || 0) > lcs);
        const desviosInferiores = viajesUnidad.filter(v => parseFloat(v.Distancia_Total_Estimada_Km || 0) < lci);

        // ESCENARIO 2: Operación 100% estable
        if (desviosSuperiores.length === 0 && desviosInferiores.length === 0) {
            contenedorAlerta.html(`
                <div class="alert alert-success border-start border-success border-4 shadow-sm mb-0" role="alert">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-check-circle fa-lg me-3 text-success"></i>
                        <div>
                            <h6 class="alert-heading fw-bold mb-1">Operación estable y predecible</h6>
                            <p class="mb-0 small">
                                Todos los recorridos de la unidad <strong>${patente}</strong> (${n} viajes) se mantuvieron dentro de su rango habitual de trabajo (entre <strong>${lci.toFixed(2)} km</strong> y <strong>${lcs.toFixed(2)} km</strong>, con un promedio de <strong>${media.toFixed(2)} km</strong>).
                            </p>
                        </div>
                    </div>
                </div>
            `);
            return;
        }

        // ESCENARIO 3 y 4: Se detectaron desvíos superiores y/o inferiores
        let detalleListaHtml = '<ul class="mb-0 mt-2 small">';

        desviosSuperiores.forEach(v => {
            const km = parseFloat(v.Distancia_Total_Estimada_Km).toFixed(2);
            detalleListaHtml += `
                <li class="mb-1">
                    <span class="badge bg-danger me-1">Desvío Superior</span>
                    <strong>HDR #${v.Id}</strong> (${v.FechaFormateada} — Chofer: <em>${v.ChoferNombreCompleto}</em>): recorrió <strong>${km} km</strong>, superando el límite máximo esperado de <strong>${lcs.toFixed(2)} km</strong>. <em>(Posible desvío de ruta, viaje extraordinario o error de carga)</em>.
                </li>
            `;
        });

        desviosInferiores.forEach(v => {
            const km = parseFloat(v.Distancia_Total_Estimada_Km).toFixed(2);
            detalleListaHtml += `
                <li class="mb-1">
                    <span class="badge bg-warning text-dark me-1">Desvío Inferior</span>
                    <strong>HDR #${v.Id}</strong> (${v.FechaFormateada} — Chofer: <em>${v.ChoferNombreCompleto}</em>): recorrió <strong>${km} km</strong>, quedando por debajo del mínimo esperado de <strong>${lci.toFixed(2)} km</strong>. <em>(Posible recorrido incompleto o retorno temprano)</em>.
                </li>
            `;
        });

        detalleListaHtml += '</ul>';

        const claseAlerta = desviosSuperiores.length > 0 ? 'alert-danger border-danger' : 'alert-warning border-warning';
        const colorIcono = desviosSuperiores.length > 0 ? 'text-danger' : 'text-warning';

        contenedorAlerta.html(`
            <div class="alert ${claseAlerta} border-start border-4 shadow-sm mb-0" role="alert">
                <div class="d-flex align-items-start">
                    <i class="fas fa-exclamation-triangle fa-lg me-3 mt-1 ${colorIcono}"></i>
                    <div>
                        <h6 class="alert-heading fw-bold mb-1">Atención: Se detectaron recorridos fuera de lo habitual en ${patente}</h6>
                        <p class="mb-0 small">
                            Tomando como referencia un promedio de <strong>${media.toFixed(2)} km</strong> por viaje, los siguientes registros escaparon a los límites normales de operación:
                        </p>
                        ${detalleListaHtml}
                    </div>
                </div>
            </div>
        `);
    };

    const actualizarCartaControlPorVehiculo = function (patente) {
        const msgSinDatos = $('#mensaje-sin-datos-control');
        const wrapperCanvas = $('#wrapper-canvas-control');

        if (!patente) {
            wrapperCanvas.addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        // Filtramos solo los viajes finalizados de ESA unidad y ordenamos cronológicamente
        const viajesUnidad = estado.datosCrudos
            .filter(v => v.Id_Estado === 5 && v.Vehiculo === patente)
            .sort((a, b) => {
                const diffFecha = new Date(a.HojaRutaFecha) - new Date(b.HojaRutaFecha);
                return diffFecha !== 0 ? diffFecha : a.Id - b.Id; // Desempate por Id si viajó 2 veces el mismo día
            });

        const n = viajesUnidad.length;
        if (n === 0) {
            wrapperCanvas.addClass('d-none');
            msgSinDatos.removeClass('d-none');
            return;
        }

        msgSinDatos.addClass('d-none');
        wrapperCanvas.removeClass('d-none');

        // Cálculos estadísticos: Media (LC) y Desviación Estándar (Sigma)
        const valores = viajesUnidad.map(v => parseFloat(v.Distancia_Total_Estimada_Km || 0));
        const suma = valores.reduce((acc, val) => acc + val, 0);
        const media = suma / n;

        const varianza = valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / n;
        const sigma = Math.sqrt(varianza);

        const lcs = media + (2 * sigma);
        const lci = Math.max(0, media - (2 * sigma)); // Nunca menor a 0 km

        // Detectamos qué puntos se salen de control para pintarlos de rojo
        let cantidadAnomalias = 0;
        const coloresPuntos = valores.map(val => {
            const fueraDeControl = val > lcs || val < lci;
            if (fueraDeControl) cantidadAnomalias++;
            return fueraDeControl ? '#dc3545' : '#0d6efd'; // Rojo si es anomalía, Azul si es normal
        });

        const radiosPuntos = valores.map(val => (val > lcs || val < lci) ? 7 : 4);

        // Actualizamos las 4 tarjetas KPI superiores
        $('#stat-lci').text(`${lci.toFixed(2)} km`);
        $('#stat-media').text(`${media.toFixed(2)} km`);
        $('#stat-lcs').text(`${lcs.toFixed(2)} km`);
        $('#stat-anomalias')
            .text(cantidadAnomalias)
            .removeClass('text-danger text-success')
            .addClass(cantidadAnomalias > 0 ? 'text-danger' : 'text-success');

        // Renderizamos el gráfico de líneas
        const ctx = document.getElementById('chartCartaControl').getContext('2d');
        if (estado.instanciaGraficoControl) {
            estado.instanciaGraficoControl.destroy();
        }

        const etiquetas = viajesUnidad.map(v => `${v.FechaFormateada} (HDR #${v.Id})`);

        estado.instanciaGraficoControl = new Chart(ctx, {
            type: 'line',
            data: {
                labels: etiquetas,
                datasets: [
                    {
                        label: `Km Recorridos (${patente})`,
                        data: valores,
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: coloresPuntos,
                        pointBorderColor: coloresPuntos,
                        pointRadius: radiosPuntos,
                        pointHoverRadius: 8,
                        tension: 0.1
                    },
                    {
                        label: 'Línea Central (Promedio)',
                        data: Array(n).fill(Number(media.toFixed(2))),
                        borderColor: '#198754', // Verde
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'Límite Superior (LCS +2σ)',
                        data: Array(n).fill(Number(lcs.toFixed(2))),
                        borderColor: '#dc3545', // Rojo punteado
                        borderWidth: 2,
                        borderDash: [6, 6],
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'Límite Inferior (LCI -2σ)',
                        data: Array(n).fill(Number(lci.toFixed(2))),
                        borderColor: '#fd7e14', // Naranja punteado
                        borderWidth: 2,
                        borderDash: [6, 6],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterLabel: function (context) {
                                // Si estamos sobre el punto real del viaje, mostramos quién era el chofer
                                if (context.datasetIndex === 0) {
                                    const viaje = viajesUnidad[context.dataIndex];
                                    return `Chofer: ${viaje.ChoferNombreCompleto}`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Distancia por Viaje (Km)', font: { weight: 'bold' } }
                    }
                }
            }
        });
        renderizarDiagnosticoControl(patente, viajesUnidad, media, lcs, lci);
    };

    // Public API
    return {
        cargarEn: inicializar
    };
})();



