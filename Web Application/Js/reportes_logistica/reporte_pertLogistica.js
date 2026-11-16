/**
 * Módulo: Reporte PERT / Ruta Crítica de Logística (SITMAS)
 * Endpoint: GET /api/ReportesLogistica/PertLogistica?fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD
 * Descripción: Procesa los nodos L1..L8, ejecuta el cálculo PERT/CPM (ES, EF, LS, LF, Holgura, Ruta Crítica)
 * y renderiza la red de precedencias junto con la campana de probabilidad del circuito logístico.
 */
const ReportePertLogisticaModulo = (function () {
    'use strict';

    // 1. Configuración y estado privado del módulo
    const URL_REPORTE_PERT = "https://localhost:44325/api/ReportesLogistica/PertLogistica";

    const estado = {
        nodosProcesados: [],
        resumenProyecto: {
            duracionTotalTe: 0,
            desviacionCritica: 0,
            varianzaCritica: 0,
            rutaCriticaIds: [],
            nodosHistoricos: 0,
            totalMuestrasReales: 0
        },
        chartRedPert: null,
        chartCampanaGlobal: null
    };

    // 2. Helper para leer propiedades sin importar si el serializador C# usa PascalCase o camelCase
    const obtenerProp = function (obj, propPascal, valorDefecto) {
        if (!obj) return valorDefecto;
        if (obj[propPascal] !== undefined && obj[propPascal] !== null) return obj[propPascal];
        const propCamel = propPascal.charAt(0).toLowerCase() + propPascal.slice(1);
        if (obj[propCamel] !== undefined && obj[propCamel] !== null) return obj[propCamel];
        return valorDefecto;
    };

    // 3. Ordenamiento Topológico (Algoritmo de Kahn) para garantizar el orden de precedencias
    const ordenarTopologicamente = function (nodos) {
        const mapaNodos = new Map(nodos.map(n => [n.id, n]));
        const gradoEntrada = new Map();
        const adyacencia = new Map();

        nodos.forEach(n => {
            gradoEntrada.set(n.id, 0);
            adyacencia.set(n.id, []);
        });

        nodos.forEach(n => {
            n.precedencia.forEach(predId => {
                if (mapaNodos.has(predId)) {
                    adyacencia.get(predId).push(n.id);
                    gradoEntrada.set(n.id, gradoEntrada.get(n.id) + 1);
                }
            });
        });

        const cola = [];
        gradoEntrada.forEach((grado, id) => {
            if (grado === 0) cola.push(id);
        });

        const ordenados = [];
        while (cola.length > 0) {
            const actualId = cola.shift();
            ordenados.push(mapaNodos.get(actualId));

            adyacencia.get(actualId).forEach(siguienteId => {
                gradoEntrada.set(siguienteId, gradoEntrada.get(siguienteId) - 1);
                if (gradoEntrada.get(siguienteId) === 0) {
                    cola.push(siguienteId);
                }
            });
        }

        // Si hubiera algún ciclo inesperado, devolvemos el orden original como respaldo
        return ordenados.length === nodos.length ? ordenados : nodos;
    };

    // 4. Motor Matemático PERT + CPM (Ruta Crítica, Holguras y Nivel Topológico)
    const procesarRedPertCPM = function (listaCruda) {
        if (!listaCruda || listaCruda.length === 0) {
            estado.nodosProcesados = [];
            estado.resumenProyecto = {
                duracionTotalTe: 0,
                desviacionCritica: 0,
                varianzaCritica: 0,
                rutaCriticaIds: [],
                nodosHistoricos: 0,
                totalMuestrasReales: 0
            };
            return;
        }

        // Paso A: Mapeo y métricas estadísticas individuales (Te, σ, V)
        const nodosBase = listaCruda.map(raw => {
            const id = String(obtenerProp(raw, 'Id', '')).trim();
            const nombre = String(obtenerProp(raw, 'Nombre', 'Actividad'));
            const precedenciaRaw = obtenerProp(raw, 'Precedencia', []);
            const precedencia = Array.isArray(precedenciaRaw)
                ? precedenciaRaw.map(p => String(p).trim()).filter(Boolean)
                : [];

            const To = parseFloat(obtenerProp(raw, 'To', 0)) || 0;
            const Tm = parseFloat(obtenerProp(raw, 'Tm', 0)) || 0;
            const Tp = parseFloat(obtenerProp(raw, 'Tp', 0)) || 0;
            const muestrasReales = parseInt(obtenerProp(raw, 'MuestrasReales', 0), 10) || 0;
            const origenDato = String(obtenerProp(raw, 'OrigenDato', 'Estandar'));

            const Te = (To + (4 * Tm) + Tp) / 6;
            const desviacion = (Tp - To) / 6;
            const varianza = Math.pow(desviacion, 2);

            return {
                id,
                nombre,
                precedencia,
                sucesores: [],
                To: Number(To.toFixed(2)),
                Tm: Number(Tm.toFixed(2)),
                Tp: Number(Tp.toFixed(2)),
                Te: Number(Te.toFixed(2)),
                desviacion: Number(desviacion.toFixed(2)),
                varianza: Number(varianza.toFixed(3)),
                muestrasReales,
                origenDato,
                nivel: 0,
                ES: 0,
                EF: 0,
                LS: 0,
                LF: 0,
                holgura: 0,
                esCritica: false
            };
        });

        const ordenados = ordenarTopologicamente(nodosBase);
        const mapa = new Map(ordenados.map(n => [n.id, n]));

        // Construir lista de sucesores para la pasada hacia atrás
        ordenados.forEach(nodo => {
            nodo.precedencia.forEach(predId => {
                if (mapa.has(predId)) {
                    mapa.get(predId).sucesores.push(nodo.id);
                }
            });
        });

        // Paso B: Pasada hacia adelante (Forward Pass: ES, EF y nivel visual en el grafo)
        ordenados.forEach(nodo => {
            if (nodo.precedencia.length === 0) {
                nodo.ES = 0;
                nodo.nivel = 0;
            } else {
                let maxEF = 0;
                let maxNivel = 0;
                nodo.precedencia.forEach(predId => {
                    const pred = mapa.get(predId);
                    if (pred) {
                        if (pred.EF > maxEF) maxEF = pred.EF;
                        if (pred.nivel + 1 > maxNivel) maxNivel = pred.nivel + 1;
                    }
                });
                nodo.ES = Number(maxEF.toFixed(2));
                nodo.nivel = maxNivel;
            }
            nodo.EF = Number((nodo.ES + nodo.Te).toFixed(2));
        });

        const duracionTotalTe = ordenados.reduce((max, n) => (n.EF > max ? n.EF : max), 0);

        // Paso C: Pasada hacia atrás (Backward Pass: LF, LS y Holgura)
        for (let i = ordenados.length - 1; i >= 0; i--) {
            const nodo = ordenados[i];
            if (nodo.sucesores.length === 0) {
                nodo.LF = duracionTotalTe;
            } else {
                let minLS = Infinity;
                nodo.sucesores.forEach(sucId => {
                    const suc = mapa.get(sucId);
                    if (suc && suc.LS < minLS) {
                        minLS = suc.LS;
                    }
                });
                nodo.LF = Number(minLS.toFixed(2));
            }
            nodo.LS = Number((nodo.LF - nodo.Te).toFixed(2));
            nodo.holgura = Number((nodo.LS - nodo.ES).toFixed(2));

            // Tolerancia de 0.05 min por redondeos decimales
            nodo.esCritica = Math.abs(nodo.holgura) <= 0.05;
        }

        // Paso D: Resumen global de Ruta Crítica
        const nodosCriticos = ordenados.filter(n => n.esCritica);
        const varianzaCritica = nodosCriticos.reduce((acc, n) => acc + n.varianza, 0);
        const desviacionCritica = Math.sqrt(varianzaCritica);
        const nodosHistoricos = ordenados.filter(n => n.origenDato.toLowerCase() === 'historico').length;
        const totalMuestrasReales = ordenados.reduce((acc, n) => acc + n.muestrasReales, 0);

        // Conservamos el orden natural L1..L8 para la tabla
        estado.nodosProcesados = nodosBase;
        estado.resumenProyecto = {
            duracionTotalTe: Number(duracionTotalTe.toFixed(2)),
            desviacionCritica: Number(desviacionCritica.toFixed(2)),
            varianzaCritica: Number(varianzaCritica.toFixed(3)),
            rutaCriticaIds: nodosCriticos.map(n => n.id),
            nodosHistoricos: nodosHistoricos,
            totalMuestrasReales: totalMuestrasReales
        };
    };

    // 5. Aproximación de la Función de Distribución Acumulada Normal Estándar Φ(z)
    const calcularProbabilidadNormal = function (z) {
        const signo = z < 0 ? -1 : 1;
        const x = Math.abs(z) / Math.sqrt(2);
        // Aproximación de Abramowitz y Stegun (error < 1.5e-7)
        const t = 1 / (1 + 0.3275911 * x);
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
        const erf = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return 0.5 * (1 + signo * erf);
    };

    // 6. Plantilla HTML del reporte dentro del contenedor SPA
    const construirPlantillaHTML = function () {
        const hoy = new Date();
        const haceNoventaDias = new Date();
        // Coincide exactamente con la ventana por defecto de 90 días del SP
        haceNoventaDias.setDate(hoy.getDate() - 90);

        const formatoISO = (fecha) => {
            const anio = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            return `${anio}-${mes}-${dia}`;
        };

        return `
            <div class="card shadow-sm border-0 mb-4">
                <div class="card-header bg-white py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div>
                        <h5 class="mb-0 text-primary fw-bold">
                            <i class="bi bi-diagram-3-fill me-2"></i>Análisis PERT y Ruta Crítica Logística (L1 – L8)
                        </h5>
                        <small class="text-muted">Modelado probabilístico del circuito operativo en minutos (Optimista · Más Probable · Pesimista)</small>
                    </div>
                    <div class="d-flex flex-wrap align-items-end gap-2">
                        <div>
                            <label for="pert-fecha-desde" class="form-label small mb-0 text-muted">Desde</label>
                            <input type="date" id="pert-fecha-desde" class="form-control form-control-sm" value="${formatoISO(haceNoventaDias)}">
                        </div>
                        <div>
                            <label for="pert-fecha-hasta" class="form-label small mb-0 text-muted">Hasta</label>
                            <input type="date" id="pert-fecha-hasta" class="form-control form-control-sm" value="${formatoISO(hoy)}">
                        </div>
                        <div>
                            <button id="btn-filtrar-pert" class="btn btn-primary btn-sm">
                                <i class="bi bi-arrow-clockwise me-1"></i>Recalcular PERT
                            </button>
                        </div>
                    </div>
                </div>

                <div class="card-body">
                    <!-- KPIs Principales PERT/CPM -->
                    <div class="row g-3 mb-4">
                        <div class="col-md-3">
                            <div class="p-3 border rounded bg-light h-100">
                                <small class="text-muted d-block">Duración Esperada Circuito (Te)</small>
                                <h4 id="kpi-pert-duracion" class="fw-bold text-primary mb-0">--</h4>
                                <small class="text-muted">Suma sobre Ruta Crítica</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="p-3 border rounded bg-light h-100">
                                <small class="text-muted d-block">Desviación Estándar Crítica (σ)</small>
                                <h4 id="kpi-pert-desviacion" class="fw-bold text-warning mb-0">--</h4>
                                <small id="kpi-pert-varianza" class="text-muted">Varianza: --</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="p-3 border rounded bg-light h-100">
                                <small class="text-muted d-block">Secuencia Ruta Crítica (Holgura = 0)</small>
                                <div id="kpi-pert-ruta-critica" class="fw-bold text-danger small mt-1">--</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="p-3 border rounded bg-light h-100">
                                <small class="text-muted d-block">Calibración con Datos Reales</small>
                                <h5 id="kpi-pert-calibracion" class="fw-bold text-success mb-0">--</h5>
                                <small id="kpi-pert-muestras" class="text-muted">Muestras analizadas: --</small>
                            </div>
                        </div>
                    </div>

                    <!-- Gráficos ECharts -->
                    <div class="row g-4 mb-4">
                        <div class="col-lg-7">
                            <div class="border rounded p-3 h-100">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 class="fw-bold text-secondary mb-0">Red PERT de Precedencias (L1 → L8)</h6>
                                    <div class="small">
                                        <span class="badge bg-danger me-1">Ruta Crítica</span>
                                        <span class="badge bg-primary">Con Holgura</span>
                                    </div>
                                </div>
                                <div id="grafico-pert-red" style="width: 100%; height: 350px;"></div>
                            </div>
                        </div>
                        <div class="col-lg-5">
                            <div class="border rounded p-3 h-100 d-flex flex-column">
                                <div class="d-flex justify-content-between align-items-center mb-2 gap-2">
                                    <h6 class="fw-bold text-secondary mb-0">Distribución Normal del Circuito</h6>
                                    <div class="input-group input-group-sm w-auto">
                                        <span class="input-group-text">Meta (min)</span>
                                        <input type="number" id="input-pert-tiempo-objetivo" class="form-control" style="width: 80px;" step="1" min="1">
                                    </div>
                                </div>
                                <div id="resultado-probabilidad-pert" class="alert alert-info py-1 px-2 small mb-2 text-center">
                                    Calculando probabilidad de cumplimiento...
                                </div>
                                <div id="grafico-pert-campana" style="width: 100%; height: 295px;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Tabla Detallada de Nodos PERT/CPM -->
                    <div class="table-responsive">
                        <table class="table table-hover table-bordered align-middle mb-0 small">
                            <thead class="table-light">
                                <tr>
                                    <th>Nodo</th>
                                    <th>Actividad Logística</th>
                                    <th>Precedencia</th>
                                    <th class="text-center">Origen</th>
                                    <th class="text-center">Muestras</th>
                                    <th class="text-end text-success">To (min)</th>
                                    <th class="text-end">Tm (min)</th>
                                    <th class="text-end text-danger">Tp (min)</th>
                                    <th class="text-end table-primary fw-bold">Te (min)</th>
                                    <th class="text-end">Desv (σ)</th>
                                    <th class="text-center">ES / EF</th>
                                    <th class="text-center">LS / LF</th>
                                    <th class="text-end">Holgura</th>
                                    <th class="text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody id="tabla-cuerpo-pert">
                                <tr>
                                    <td colspan="14" class="text-center text-muted py-4">Cargando análisis PERT...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    };

    // 7. Actualización de tarjetas KPI
    const actualizarKPIs = function () {
        const res = estado.resumenProyecto;
        if (!estado.nodosProcesados.length) {
            $('#kpi-pert-duracion, #kpi-pert-desviacion, #kpi-pert-ruta-critica, #kpi-pert-calibracion').text('--');
            return;
        }

        $('#kpi-pert-duracion').text(`${res.duracionTotalTe.toFixed(2)} min`);
        $('#kpi-pert-desviacion').text(`± ${res.desviacionCritica.toFixed(2)} min`);
        $('#kpi-pert-varianza').text(`Varianza acumulada (V): ${res.varianzaCritica.toFixed(2)} min²`);
        $('#kpi-pert-ruta-critica').text(res.rutaCriticaIds.join(' → '));
        $('#kpi-pert-calibracion').text(`${res.nodosHistoricos} de ${estado.nodosProcesados.length} etapas`);
        $('#kpi-pert-muestras').text(`Viajes finalizados analizados: ${res.totalMuestrasReales}`);

        // Inicializamos el simulador con un tiempo objetivo razonable (Te + 1 desviación estándar)
        const metaSugerida = Math.ceil(res.duracionTotalTe + res.desviacionCritica);
        $('#input-pert-tiempo-objetivo').val(metaSugerida);
    };

    // 8. Renderizado de Tabla PERT/CPM
    const renderizarTabla = function () {
        const tbody = $('#tabla-cuerpo-pert');
        tbody.empty();

        if (!estado.nodosProcesados.length) {
            tbody.html('<tr><td colspan="14" class="text-center text-muted py-4">No se encontraron nodos PERT para el rango seleccionado.</td></tr>');
            return;
        }

        estado.nodosProcesados.forEach(n => {
            const filaClase = n.esCritica ? 'table-danger bg-opacity-10' : '';
            const badgeOrigen = n.origenDato.toLowerCase() === 'historico'
                ? '<span class="badge bg-success-subtle text-success border border-success-subtle">Histórico</span>'
                : '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Estándar</span>';

            const badgeCritico = n.esCritica
                ? '<span class="badge bg-danger">Crítica</span>'
                : `<span class="badge bg-light text-dark border">+${n.holgura.toFixed(1)} min</span>`;

            tbody.append(`
                <tr class="${filaClase}">
                    <td class="fw-bold">${n.id}</td>
                    <td>${n.nombre}</td>
                    <td>${n.precedencia.length ? n.precedencia.join(', ') : '<span class="text-muted">Inicio</span>'}</td>
                    <td class="text-center">${badgeOrigen}</td>
                    <td class="text-center">${n.muestrasReales}</td>
                    <td class="text-end text-success">${n.To.toFixed(2)}</td>
                    <td class="text-end">${n.Tm.toFixed(2)}</td>
                    <td class="text-end text-danger">${n.Tp.toFixed(2)}</td>
                    <td class="text-end table-primary fw-bold">${n.Te.toFixed(2)}</td>
                    <td class="text-end">± ${n.desviacion.toFixed(2)}</td>
                    <td class="text-center text-muted">${n.ES.toFixed(1)} / ${n.EF.toFixed(1)}</td>
                    <td class="text-center text-muted">${n.LS.toFixed(1)} / ${n.LF.toFixed(1)}</td>
                    <td class="text-end fw-semibold">${n.holgura.toFixed(2)}</td>
                    <td class="text-center">${badgeCritico}</td>
                </tr>
            `);
        });
    };

    // 9. Gráfico 1: Red PERT / Grafo de Precedencias con ECharts
    const renderizarGraficoRed = function () {
        const dom = document.getElementById('grafico-pert-red');
        if (!dom) return;

        if (!estado.chartRedPert) {
            estado.chartRedPert = echarts.init(dom);
        }

        if (!estado.nodosProcesados.length) {
            estado.chartRedPert.clear();
            return;
        }

        // Agrupamos nodos por nivel topológico (columna X) para distribuirlos verticalmente (Y) sin solaparse
        const nodosPorNivel = {};
        estado.nodosProcesados.forEach(n => {
            if (!nodosPorNivel[n.nivel]) nodosPorNivel[n.nivel] = [];
            nodosPorNivel[n.nivel].push(n);
        });

        const nodosEcharts = estado.nodosProcesados.map(n => {
            const grupoNivel = nodosPorNivel[n.nivel];
            const indiceEnNivel = grupoNivel.indexOf(n);
            const totalEnNivel = grupoNivel.length;

            const posX = n.nivel * 180;
            const posY = (indiceEnNivel - (totalEnNivel - 1) / 2) * 110;

            return {
                name: n.id,
                x: posX,
                y: posY,
                datosNodo: n,
                symbolSize: n.esCritica ? 46 : 40,
                itemStyle: {
                    color: n.esCritica ? '#dc3545' : '#0d6efd',
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    shadowBlur: 6,
                    shadowColor: 'rgba(0,0,0,0.15)'
                },
                label: {
                    show: true,
                    position: 'inside',
                    formatter: `${n.id}\n${n.Te.toFixed(0)}m`,
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: 11
                }
            };
        });

        const mapaNodos = new Map(estado.nodosProcesados.map(n => [n.id, n]));
        const enlacesEcharts = [];

        estado.nodosProcesados.forEach(destino => {
            destino.precedencia.forEach(origenId => {
                const origen = mapaNodos.get(origenId);
                if (origen) {
                    const enlaceCritico = origen.esCritica && destino.esCritica;
                    enlacesEcharts.push({
                        source: origenId,
                        target: destino.id,
                        lineStyle: {
                            color: enlaceCritico ? '#dc3545' : '#adb5bd',
                            width: enlaceCritico ? 3.5 : 2,
                            curveness: 0.08
                        }
                    });
                }
            });
        });

        const opcion = {
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    if (params.dataType !== 'node') return '';
                    const n = params.data.datosNodo;
                    return `
                        <strong>${n.id} - ${n.nombre}</strong> (${n.origenDato})<br/>
                        Tiempo Esperado (Te): <strong>${n.Te.toFixed(2)} min</strong> (σ = ±${n.desviacion.toFixed(2)})<br/>
                        Tiempos [To / Tm / Tp]: ${n.To} / ${n.Tm} / ${n.Tp} min<br/>
                        Inicio/Fin Temprano: ${n.ES.toFixed(1)} → ${n.EF.toFixed(1)} min<br/>
                        Holgura: <strong>${n.holgura.toFixed(2)} min</strong> ${n.esCritica ? '<span style="color:#dc3545;">(RUTA CRÍTICA)</span>' : ''}
                    `;
                }
            },
            series: [{
                type: 'graph',
                layout: 'none',
                roam: true,
                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize: [4, 10],
                data: nodosEcharts,
                links: enlacesEcharts
            }]
        };

        estado.chartRedPert.setOption(opcion, true);
    };

    // 10. Gráfico 2: Campana de Gauss del Circuito Completo + Cálculo de Probabilidad Z
    const renderizarGraficoCampanaGlobal = function () {
        const dom = document.getElementById('grafico-pert-campana');
        if (!dom) return;

        if (!estado.chartCampanaGlobal) {
            estado.chartCampanaGlobal = echarts.init(dom);
        }

        const media = estado.resumenProyecto.duracionTotalTe;
        const sigma = estado.resumenProyecto.desviacionCritica;

        if (media <= 0 || sigma <= 0) {
            estado.chartCampanaGlobal.clear();
            return;
        }

        const tiempoObjetivo = parseFloat($('#input-pert-tiempo-objetivo').val()) || media;
        const z = (tiempoObjetivo - media) / sigma;
        const probabilidad = calcularProbabilidadNormal(z) * 100;

        const claseAlerta = probabilidad >= 80 ? 'alert-success' : (probabilidad >= 50 ? 'alert-warning' : 'alert-danger');
        $('#resultado-probabilidad-pert')
            .removeClass('alert-info alert-success alert-warning alert-danger')
            .addClass(claseAlerta)
            .html(`Probabilidad de completar en <strong>≤ ${tiempoObjetivo.toFixed(1)} min</strong>: <strong>${probabilidad.toFixed(1)}%</strong> (Z = ${z.toFixed(2)})`);

        const minX = Math.max(0, media - 3.5 * sigma);
        const maxX = media + 3.5 * sigma;
        const pasos = 70;
        const incremento = (maxX - minX) / pasos;

        const puntosX = [];
        const puntosY = [];

        for (let i = 0; i <= pasos; i++) {
            const x = minX + i * incremento;
            const exponente = -0.5 * Math.pow((x - media) / sigma, 2);
            const y = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponente);
            puntosX.push(x.toFixed(1));
            puntosY.push(Number(y.toFixed(5)));
        }

        const opcion = {
            tooltip: {
                trigger: 'axis',
                formatter: (params) => `Duración circuito: <strong>${params[0].axisValue} min</strong>`
            },
            grid: { left: '8%', right: '8%', top: '16%', bottom: '16%' },
            xAxis: {
                type: 'category',
                data: puntosX,
                name: 'min'
            },
            yAxis: {
                type: 'value',
                show: false
            },
            series: [{
                type: 'line',
                smooth: true,
                showSymbol: false,
                lineStyle: { color: '#0d6efd', width: 2.5 },
                areaStyle: { color: 'rgba(13, 110, 253, 0.16)' },
                data: puntosY,
                markLine: {
                    symbol: 'none',
                    data: [
                        {
                            xAxis: media.toFixed(1),
                            lineStyle: { color: '#dc3545', type: 'dashed' },
                            label: { formatter: `Te: ${media.toFixed(1)}m` }
                        },
                        {
                            xAxis: tiempoObjetivo.toFixed(1),
                            lineStyle: { color: '#198754', type: 'solid', width: 2 },
                            label: { formatter: `Meta: ${tiempoObjetivo.toFixed(1)}m` }
                        }
                    ]
                }
            }]
        };

        estado.chartCampanaGlobal.setOption(opcion, true);
    };

    // 11. Consulta AJAX al controlador C#
    const cargarDatosDesdeAPI = function () {
        const fechaDesde = $('#pert-fecha-desde').val();
        const fechaHasta = $('#pert-fecha-hasta').val();

        const parametros = {};
        if (fechaDesde) parametros.fechaDesde = fechaDesde;
        if (fechaHasta) parametros.fechaHasta = fechaHasta;

        $.ajax({
            url: URL_REPORTE_PERT,
            method: 'GET',
            data: parametros,
            dataType: 'json',
            success: function (respuesta) {
                const listaCruda = Array.isArray(respuesta) ? respuesta : (respuesta.datos || []);
                procesarRedPertCPM(listaCruda);
                actualizarKPIs();
                renderizarTabla();
                renderizarGraficoRed();
                renderizarGraficoCampanaGlobal();
            },
            error: function (xhr, status, error) {
                console.error("Error al consultar PertLogistica:", error);
                const detalleError = xhr.responseJSON && xhr.responseJSON.Message
                    ? xhr.responseJSON.Message
                    : (xhr.statusText || 'Error de conexión con la API');

                $('#tabla-cuerpo-pert').html(`
                    <tr>
                        <td colspan="14" class="text-center text-danger py-4">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            No se pudo cargar el análisis PERT (${xhr.status}): ${detalleError}
                        </td>
                    </tr>
                `);
            }
        });
    };

    // 12. Punto de entrada público para el enrutador SPA
    const inicializar = function (contenedorId) {
        // Limpieza preventiva de instancias previas de ECharts
        if (estado.chartRedPert) {
            estado.chartRedPert.dispose();
            estado.chartRedPert = null;
        }
        if (estado.chartCampanaGlobal) {
            estado.chartCampanaGlobal.dispose();
            estado.chartCampanaGlobal = null;
        }

        const contenedor = $(`#${contenedorId}`);
        if (!contenedor.length) {
            console.error(`No se encontró el contenedor #${contenedorId} para ReportePertLogisticaModulo.`);
            return;
        }

        contenedor.html(construirPlantillaHTML());

        // Eventos con namespace propio para evitar duplicación en navegación SPA
        $('#btn-filtrar-pert').off('click.pertlogistica').on('click.pertlogistica', function () {
            cargarDatosDesdeAPI();
        });

        $('#input-pert-tiempo-objetivo').off('input.pertlogistica change.pertlogistica').on('input.pertlogistica change.pertlogistica', function () {
            renderizarGraficoCampanaGlobal();
        });

        $(window).off('resize.pertlogistica').on('resize.pertlogistica', function () {
            if (estado.chartRedPert) estado.chartRedPert.resize();
            if (estado.chartCampanaGlobal) estado.chartCampanaGlobal.resize();
        });

        cargarDatosDesdeAPI();
    };

    return {
        cargarEn: inicializar
    };
})();