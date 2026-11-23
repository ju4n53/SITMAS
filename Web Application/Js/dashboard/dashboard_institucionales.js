/* ==========================================================================
   SITMAS - Módulo: Dashboard Analítico de Trazabilidad Institucional (SPA)
   Roles habilitados: R_Institucionales, Administrador
   Arquitectura: Pirámide Invertida (Filtros -> KPIs -> ECharts -> Planilla CSV)
   ========================================================================== */

const DashboardInstitucionalesModulo = (function () {
    "use strict";

    const URL_API_INSTITUCIONALES = "https://localhost:44325/api/DashboardUsuariosRol/Institucionales";

    const NOMBRES_MESES = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];

    // Estado interno aislado del módulo
    let contenedorActualId = "panel-graficos";
    let chartEvolucionMensual = null;
    let chartTiposMaterial = null;
    let chartTopInstituciones = null;
    let ultimaPlanillaMensual = [];
    let catalogoInstituciones = [];

    /* ======================================================================
       HELPERS DE FORMATEO Y LIMPIEZA
       ====================================================================== */

    function FormatearDecimal(valor) {
        const num = parseFloat(valor || 0);
        return num.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function FormatearEntero(valor) {
        const num = parseInt(valor || 0, 10);
        return num.toLocaleString("es-AR");
    }

    function FormatearAnioMes(anioMes) {
        if (!anioMes || !anioMes.includes("-")) return anioMes || "";
        const [anio, mes] = anioMes.split("-");
        const idx = parseInt(mes, 10) - 1;
        return `${NOMBRES_MESES[idx] || mes} ${anio}`;
    }

    function FormatearFechaCorta(fechaISO) {
        if (!fechaISO) return "Sin registro";
        const fecha = new Date(fechaISO);
        if (isNaN(fecha.getTime())) return "Sin registro";
        return fecha.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    function ObtenerFechasPorDefecto() {
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");

        return {
            fechaDesde: `${anio}-01-01`,
            fechaHasta: `${anio}-${mes}-${dia}`
        };
    }

    function DestruirGraficos() {
        [chartEvolucionMensual, chartTiposMaterial, chartTopInstituciones].forEach(instancia => {
            if (instancia && !instancia.isDisposed()) {
                instancia.dispose();
            }
        });
        chartEvolucionMensual = null;
        chartTiposMaterial = null;
        chartTopInstituciones = null;
    }

    /* ======================================================================
       1. RENDERIZADO DEL ESQUELETO HTML EN EL CONTENEDOR SPA
       ====================================================================== */

    function cargarEn(contenedorId = "panel-graficos") {
        contenedorActualId = contenedorId;
        const $contenedor = $(`#${contenedorActualId}`);
        if ($contenedor.length === 0) return;

        DestruirGraficos();

        const sesionString = localStorage.getItem("usuarioSesion");
        const sesion = sesionString ? JSON.parse(sesionString) : {};
        const nombreUsuario = sesion.nombre || "Responsable Institucional";

        const opcionesFecha = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        const fechaCruda = new Date().toLocaleDateString("es-AR", opcionesFecha);
        const fechaHoyTexto = fechaCruda.charAt(0).toUpperCase() + fechaCruda.slice(1);

        const rangoDefault = ObtenerFechasPorDefecto();

        $contenedor.html(`
            <!-- ENCABEZADO Y BARRA DE FILTROS -->
            <div class="col-12">
                <div class="bg-white p-3 p-md-4 rounded shadow-sm border-start border-4 border-success">
                    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
                        <div>
                            <h4 class="fw text-dark mb-1">
                                <i class="fas fa-building text-success me-2"></i>Panel de Trazabilidad Institucional
                            </h4>
                              <h7 class="fw-bold text-dark mb-1">
                              👋 ¡Hola, <strong>${nombreUsuario}</strong> • ${fechaHoyTexto}
                              </h7>
                              
                            <!--<small class="text-muted">
                            </small>-->
                        </div>
                        <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2" id="inst-badge-estado">
                            <i class="fas fa-circle-notch fa-spin me-1"></i>Cargando métricas...
                        </span>
                    </div>

                    <div class="row g-3 align-items-end">
                        <div class="col-12 col-sm-6 col-md-3">
                            <label for="inst-fecha-desde" class="form-label small fw-bold text-secondary mb-1">
                                <i class="fas fa-calendar-alt me-1 text-primary"></i>Fecha Desde
                            </label>
                            <input type="date" class="form-control form-control-sm" id="inst-fecha-desde" value="${rangoDefault.fechaDesde}">
                        </div>

                        <div class="col-12 col-sm-6 col-md-3">
                            <label for="inst-fecha-hasta" class="form-label small fw-bold text-secondary mb-1">
                                <i class="fas fa-calendar-check me-1 text-primary"></i>Fecha Hasta
                            </label>
                            <input type="date" class="form-control form-control-sm" id="inst-fecha-hasta" value="${rangoDefault.fechaHasta}">
                        </div>

                        <div class="col-12 col-md-3">
                            <label for="inst-select-origen" class="form-label small fw-bold text-secondary mb-1">
                                <i class="fas fa-landmark me-1 text-success"></i>Institución / Origen
                            </label>
                            <select class="form-select form-select-sm" id="inst-select-origen">
                                <option value="0">Todas las instituciones</option>
                            </select>
                        </div>

                        <div class="col-12 col-md-3 d-flex gap-2">
                            <button type="button" class="btn btn-success btn-sm fw-bold flex-grow-1" id="btn-inst-filtrar">
                                <i class="fas fa-filter me-1"></i>Aplicar
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm fw-semibold" id="btn-inst-limpiar" title="Restablecer año actual">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 2: TARJETAS EJECUTIVAS DE KPIs (Tonos suaves de reporte BI) -->
            <div class="col-12">
                <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
                    <!-- KPI 1: Entregas e Instituciones (Azul Institucional) -->
                    <div class="col">
                        <div class="card border-0 border-start border-primary border-4 shadow-sm h-100"
                             style="background: linear-gradient(135deg, #eef4ff 0%, #ffffff 100%);">
                            <div class="card-body py-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase" style="color: #1e40af;">Entregas Institucionales</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 36px; height: 36px; background-color: rgba(13, 110, 253, 0.12);">
                                        <i class="fas fa-truck-loading text-primary"></i>
                                    </div>
                                </div>
                                <h3 class="fw-bold text-dark mb-1" id="inst-kpi-entregas">0</h3>
                                <small class="text-secondary fw-medium" id="inst-kpi-sub-entregas">0 instituciones activas</small>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 2: Peso Bruto y Pendiente (Cian / Petróleo Operativo) -->
                    <div class="col">
                        <div class="card border-0 border-start border-4 shadow-sm h-100"
                             style="border-color: #0891b2 !important; background: linear-gradient(135deg, #e8f7fa 0%, #ffffff 100%);">
                            <div class="card-body py-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase" style="color: #155e75;">Peso Bruto Ingresado</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 36px; height: 36px; background-color: rgba(8, 145, 178, 0.14);">
                                        <i class="fas fa-weight-hanging" style="color: #0891b2;"></i>
                                    </div>
                                </div>
                                <h3 class="fw-bold text-dark mb-1" id="inst-kpi-bruto">0,00 kg</h3>
                                <small class="text-secondary fw-medium" id="inst-kpi-sub-bruto">Pendiente clasificar: 0,00 kg</small>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 3: Material Recuperado (Verde EMEC) -->
                    <div class="col">
                        <div class="card border-0 border-start border-success border-4 shadow-sm h-100"
                             style="background: linear-gradient(135deg, #eaf7ef 0%, #ffffff 100%);">
                            <div class="card-body py-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase" style="color: #166534;">Material Recuperado</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 36px; height: 36px; background-color: rgba(25, 135, 84, 0.14);">
                                        <i class="fas fa-recycle text-success"></i>
                                    </div>
                                </div>
                                <h3 class="fw-bold text-success mb-1" id="inst-kpi-recuperado">0,00 kg</h3>
                                <small class="text-secondary fw-medium" id="inst-kpi-sub-recuperado">Verde: 0,00 kg | Amarillo: 0,00 kg</small>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 4: Tasa de Recuperación (Ámbar Ejecutivo) -->
                    <div class="col">
                        <div class="card border-0 border-start border-4 shadow-sm h-100"
                             style="border-color: #d97706 !important; background: linear-gradient(135deg, #fff8e6 0%, #ffffff 100%);">
                            <div class="card-body py-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small fw-bold text-uppercase" style="color: #92400e;">Tasa de Recuperación</span>
                                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                                         style="width: 36px; height: 36px; background-color: rgba(217, 119, 6, 0.14);">
                                        <i class="fas fa-percentage" style="color: #d97706;"></i>
                                    </div>
                                </div>
                                <h3 class="fw-bold text-dark mb-1" id="inst-kpi-tasa">0,00 %</h3>
                                <small class="text-secondary fw-medium" id="inst-kpi-sub-tasa">Descarte (Rojo): 0,00 kg</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 3: GRÁFICOS ANALÍTICOS (ECHARTS) -->
            <!-- Gráfico 1: Evolución Mensual -->
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-bottom py-3">
                        <h6 class="fw-bold text-dark mb-0">
                            <i class="fas fa-chart-bar text-success me-2"></i>Evolución Mensual de Clasificación y Tasa de Recuperación
                        </h6>
                        <small class="text-muted">Comparativa mensual de kilogramos útiles por calidad (Verde/Amarillo), descarte (Rojo) y porcentaje de aprovechamiento</small>
                    </div>
                    <div class="card-body">
                        <div id="echarts-inst-evolucion" style="width: 100%; height: 370px;"></div>
                    </div>
                </div>
            </div>

            <!-- Gráfico 2: Distribución por Tipo de Material -->
            <div class="col-12 col-xl-5">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white border-bottom py-3">
                        <h6 class="fw-bold text-dark mb-0">
                            <i class="fas fa-chart-pie text-primary me-2"></i>Material Recuperado por Familia
                        </h6>
                        <small class="text-muted">Participación de cada tipo de material útil (Verde + Amarillo)</small>
                    </div>
                    <div class="card-body">
                        <div id="echarts-inst-materiales" style="width: 100%; height: 360px;"></div>
                    </div>
                </div>
            </div>

            <!-- Gráfico 3: Top 10 Instituciones Generadoras -->
            <div class="col-12 col-xl-7">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white border-bottom py-3">
                        <h6 class="fw-bold text-dark mb-0">
                            <i class="fas fa-trophy text-warning me-2"></i>Top 10 Instituciones por Volumen Aportado
                        </h6>
                        <small class="text-muted">Relación entre material recuperado y descarte en las principales instituciones</small>
                    </div>
                    <div class="card-body">
                        <div id="echarts-inst-ranking" style="width: 100%; height: 360px;"></div>
                    </div>
                </div>
            </div>

            <!-- NIVEL 4: PLANILLA MENSUAL CONSOLIDADA (AUDITORÍA) -->
            <div class="col-12 mb-4">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div>
                            <h6 class="fw-bold text-dark mb-0">
                                <i class="fas fa-table text-secondary me-2"></i>Planilla Mensual Consolidada — Trazabilidad Institucional
                            </h6>
                            <small class="text-muted">Detalle auditado por período para informes gerenciales y ambientales</small>
                        </div>
                        <button type="button" class="btn btn-outline-success btn-sm fw-bold" id="btn-inst-exportar-csv">
                            <i class="fas fa-file-csv me-1"></i>Exportar Planilla (CSV)
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover table-striped align-middle mb-0 small">
                                <thead class="table-light text-uppercase">
                                    <tr>
                                        <th class="ps-3">Período</th>
                                        <th class="text-center">Instituciones</th>
                                        <th class="text-center">Entregas</th>
                                        <th class="text-end">Peso Bruto (kg)</th>
                                        <th class="text-end text-success">Verde (kg)</th>
                                        <th class="text-end text-warning">Amarillo (kg)</th>
                                        <th class="text-end text-danger">Rojo (kg)</th>
                                        <th class="text-end text-muted">Pendiente (kg)</th>
                                        <th class="text-center pe-3">% Recuperación</th>
                                    </tr>
                                </thead>
                                <tbody id="tbody-inst-planilla">
                                    <tr>
                                        <td colspan="9" class="text-center py-4 text-muted">Cargando datos...</td>
                                    </tr>
                                </tbody>
                                <tfoot class="table-light fw-bold" id="tfoot-inst-planilla"></tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `);

        RegistrarEventos($contenedor);
        ConsultarDatosDashboard();
    }

    /* ======================================================================
       2. REGISTRO DE EVENTOS SPA (Con .off().on() para evitar duplicados)
       ====================================================================== */

    function RegistrarEventos($contenedor) {
        $contenedor
            .off("click", "#btn-inst-filtrar")
            .on("click", "#btn-inst-filtrar", function () {
                ConsultarDatosDashboard();
            });

        $contenedor
            .off("click", "#btn-inst-limpiar")
            .on("click", "#btn-inst-limpiar", function () {
                const rangoDefault = ObtenerFechasPorDefecto();
                $("#inst-fecha-desde").val(rangoDefault.fechaDesde);
                $("#inst-fecha-hasta").val(rangoDefault.fechaHasta);
                $("#inst-select-origen").val("0");
                catalogoInstituciones = [];
                ConsultarDatosDashboard();
            });

        $contenedor
            .off("change", "#inst-select-origen")
            .on("change", "#inst-select-origen", function () {
                ConsultarDatosDashboard();
            });

        $contenedor
            .off("click", "#btn-inst-exportar-csv")
            .on("click", "#btn-inst-exportar-csv", function () {
                ExportarPlanillaCSV();
            });

        $(window)
            .off("resize.dashboardInstitucional")
            .on("resize.dashboardInstitucional", function () {
                if (chartEvolucionMensual && !chartEvolucionMensual.isDisposed()) chartEvolucionMensual.resize();
                if (chartTiposMaterial && !chartTiposMaterial.isDisposed()) chartTiposMaterial.resize();
                if (chartTopInstituciones && !chartTopInstituciones.isDisposed()) chartTopInstituciones.resize();
            });
    }

    /* ======================================================================
       3. CONSULTA A LA API Y ORQUESTACIÓN DE VISTAS
       ====================================================================== */

    function ConsultarDatosDashboard() {
        const fechaDesde = $("#inst-fecha-desde").val();
        const fechaHasta = $("#inst-fecha-hasta").val();
        const idOrigen = parseInt($("#inst-select-origen").val(), 10) || 0;

        if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
            Swal.fire("Rango inválido", "La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.", "warning");
            return;
        }

        $("#inst-badge-estado")
            .removeClass("bg-danger-subtle text-danger bg-success-subtle text-success")
            .addClass("bg-light text-secondary")
            .html('<i class="fas fa-circle-notch fa-spin me-1"></i>Actualizando...');

        $.ajax({
            type: "GET",
            url: URL_API_INSTITUCIONALES,
            dataType: "json",
            data: {
                fechaDesde: fechaDesde || null,
                fechaHasta: fechaHasta || null,
                idOrigen: idOrigen > 0 ? idOrigen : null
            },
            success: function (data) {
                $("#inst-badge-estado")
                    .removeClass("bg-light text-secondary")
                    .addClass("bg-success-subtle text-success")
                    .html('<i class="fas fa-check-circle me-1"></i>Datos actualizados');

                const kpis = (data && data.Kpis) || {};
                const evolucion = (data && data.EvolucionMensual) || [];
                const materiales = (data && data.DistribucionMateriales) || [];
                const ranking = (data && data.RankingInstituciones) || [];
                const planilla = (data && data.PlanillaMensual) || [];

                ultimaPlanillaMensual = planilla;

                // Actualizamos catálogo completo de instituciones solo cuando no hay filtro activo
                if (idOrigen === 0 && ranking.length > 0) {
                    catalogoInstituciones = ranking.filter(r => r.IdOrigen > 0);
                    PoblarComboInstituciones(catalogoInstituciones, idOrigen);
                }

                RenderizarKpis(kpis);
                RenderizarGraficoEvolucion(evolucion);
                RenderizarGraficoMateriales(materiales);
                RenderizarGraficoRanking(ranking);
                RenderizarPlanillaMensual(planilla);
            },
            error: function (err) {
                console.error("SITMAS - Error al cargar Dashboard Institucional:", err);
                $("#inst-badge-estado")
                    .removeClass("bg-light text-secondary")
                    .addClass("bg-danger-subtle text-danger")
                    .html('<i class="fas fa-exclamation-circle me-1"></i>Error de conexión');

                Swal.fire("Error", "No se pudieron obtener las métricas institucionales desde el servidor.", "error");
            }
        });
    }

    function PoblarComboInstituciones(lista, seleccionadoId) {
        const $select = $("#inst-select-origen");
        if ($select.length === 0) return;

        let html = '<option value="0">Todas las instituciones</option>';
        lista.forEach(item => {
            const selected = item.IdOrigen === seleccionadoId ? "selected" : "";
            html += `<option value="${item.IdOrigen}" ${selected}>${item.Institucion}</option>`;
        });
        $select.html(html);
    }

    /* ======================================================================
       4. RENDERIZADO DE KPIs Y COMPONENTES VISUALES
       ====================================================================== */

    function RenderizarKpis(kpis) {
        $("#inst-kpi-entregas").text(FormatearEntero(kpis.TotalEntregas));
        $("#inst-kpi-sub-entregas").text(`${FormatearEntero(kpis.InstitucionesActivas)} institución(es) activa(s)`);

        $("#inst-kpi-bruto").text(`${FormatearDecimal(kpis.PesoBrutoTotalKg)} kg`);
        $("#inst-kpi-sub-bruto").text(`Pendiente clasificar: ${FormatearDecimal(kpis.PesoPendienteClasificarKg)} kg`);

        $("#inst-kpi-recuperado").text(`${FormatearDecimal(kpis.PesoRecuperadoTotalKg)} kg`);
        $("#inst-kpi-sub-recuperado").text(
            `Verde: ${FormatearDecimal(kpis.PesoVerdeKg)} kg | Amarillo: ${FormatearDecimal(kpis.PesoAmarilloKg)} kg`
        );

        const tasa = parseFloat(kpis.TasaRecuperacionPct || 0);
        const colorTasa = tasa >= 75 ? "#15803d" : (tasa >= 50 ? "#b45309" : "#b91c1c");

        $("#inst-kpi-tasa")
            .text(`${FormatearDecimal(tasa)} %`)
            .css("color", colorTasa);

        $("#inst-kpi-sub-tasa").text(`Descarte (Rojo): ${FormatearDecimal(kpis.PesoRojoKg)} kg`);
    }

    function RenderizarGraficoEvolucion(evolucion) {
        if (typeof echarts === "undefined") return;
        const dom = document.getElementById("echarts-inst-evolucion");
        if (!dom) return;

        if (!chartEvolucionMensual || chartEvolucionMensual.isDisposed()) {
            chartEvolucionMensual = echarts.init(dom);
        }

        if (!evolucion || evolucion.length === 0) {
            chartEvolucionMensual.clear();
            chartEvolucionMensual.setOption({
                title: {
                    text: "Sin movimientos registrados en el período seleccionado",
                    left: "center",
                    top: "middle",
                    textStyle: { color: "#6c757d", fontSize: 14, fontWeight: "normal" }
                }
            });
            return;
        }

        const etiquetasMes = evolucion.map(x => FormatearAnioMes(x.AnioMes));
        const serieVerde = evolucion.map(x => parseFloat(x.PesoVerdeKg || 0));
        const serieAmarillo = evolucion.map(x => parseFloat(x.PesoAmarilloKg || 0));
        const serieRojo = evolucion.map(x => parseFloat(x.PesoRojoKg || 0));
        const serieTasa = evolucion.map(x => parseFloat(x.TasaRecuperacionPct || 0));

        const option = {
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
                formatter: function (params) {
                    if (!params || params.length === 0) return "";
                    let html = `<strong>${params[0].axisValue}</strong><hr style="margin:4px 0;"/>`;
                    params.forEach(p => {
                        const sufijo = p.seriesName.includes("Tasa") ? " %" : " kg";
                        html += `${p.marker} ${p.seriesName}: <strong>${FormatearDecimal(p.value)}${sufijo}</strong><br/>`;
                    });
                    return html;
                }
            },
            legend: {
                top: 0,
                data: ["Calidad Verde (kg)", "Calidad Amarillo (kg)", "Descarte Rojo (kg)", "Tasa Recuperación (%)"]
            },
            grid: { left: "3%", right: "4%", bottom: "6%", top: 48, containLabel: true },
            xAxis: {
                type: "category",
                data: etiquetasMes,
                axisLabel: { fontWeight: "bold", color: "#495057" }
            },
            yAxis: [
                {
                    type: "value",
                    name: "Kilogramos (kg)",
                    axisLabel: { formatter: val => `${val.toLocaleString("es-AR")} kg` }
                },
                {
                    type: "value",
                    name: "Recuperación (%)",
                    min: 0,
                    max: 100,
                    axisLabel: { formatter: "{value} %" }
                }
            ],
            series: [
                {
                    name: "Calidad Verde (kg)",
                    type: "bar",
                    stack: "clasificacion",
                    barMaxWidth: 42,
                    itemStyle: { color: "#198754" },
                    data: serieVerde
                },
                {
                    name: "Calidad Amarillo (kg)",
                    type: "bar",
                    stack: "clasificacion",
                    barMaxWidth: 42,
                    itemStyle: { color: "#ffc107" },
                    data: serieAmarillo
                },
                {
                    name: "Descarte Rojo (kg)",
                    type: "bar",
                    stack: "clasificacion",
                    barMaxWidth: 42,
                    itemStyle: { color: "#dc3545" },
                    data: serieRojo
                },
                {
                    name: "Tasa Recuperación (%)",
                    type: "line",
                    yAxisIndex: 1,
                    smooth: true,
                    symbolSize: 8,
                    itemStyle: { color: "#0d6efd" },
                    lineStyle: { width: 3 },
                    data: serieTasa
                }
            ]
        };

        chartEvolucionMensual.setOption(option, true);
    }

    function RenderizarGraficoMateriales(materiales) {
        if (typeof echarts === "undefined") return;
        const dom = document.getElementById("echarts-inst-materiales");
        if (!dom) return;

        if (!chartTiposMaterial || chartTiposMaterial.isDisposed()) {
            chartTiposMaterial = echarts.init(dom);
        }

        if (!materiales || materiales.length === 0) {
            chartTiposMaterial.clear();
            chartTiposMaterial.setOption({
                title: {
                    text: "Sin material clasificado útil",
                    left: "center",
                    top: "middle",
                    textStyle: { color: "#6c757d", fontSize: 14, fontWeight: "normal" }
                }
            });
            return;
        }

        const datosDona = materiales.map(m => ({
            name: m.TipoMaterial,
            value: parseFloat(m.PesoRecuperadoKg || 0),
            verde: parseFloat(m.PesoVerdeKg || 0),
            amarillo: parseFloat(m.PesoAmarilloKg || 0)
        }));

        const option = {
            tooltip: {
                trigger: "item",
                formatter: function (params) {
                    const d = params.data;
                    return `
                        <strong>${d.name}</strong> (${params.percent}%)<br/>
                        Total Útil: <strong>${FormatearDecimal(d.value)} kg</strong><br/>
                        <span class="text-success">● Verde:</span> ${FormatearDecimal(d.verde)} kg<br/>
                        <span class="text-warning">● Amarillo:</span> ${FormatearDecimal(d.amarillo)} kg
                    `;
                }
            },
            legend: {
                type: "scroll",
                bottom: 0
            },
            series: [
                {
                    name: "Tipo de Material",
                    type: "pie",
                    radius: ["42%", "70%"],
                    center: ["50%", "44%"],
                    avoidLabelOverlap: true,
                    itemStyle: {
                        borderRadius: 6,
                        borderColor: "#ffffff",
                        borderWidth: 2
                    },
                    label: {
                        show: true,
                        formatter: "{b}: {d}%"
                    },
                    data: datosDona
                }
            ]
        };

        chartTiposMaterial.setOption(option, true);
    }

    function RenderizarGraficoRanking(ranking) {
        if (typeof echarts === "undefined") return;
        const dom = document.getElementById("echarts-inst-ranking");
        if (!dom) return;

        if (!chartTopInstituciones || chartTopInstituciones.isDisposed()) {
            chartTopInstituciones = echarts.init(dom);
        }

        if (!ranking || ranking.length === 0) {
            chartTopInstituciones.clear();
            chartTopInstituciones.setOption({
                title: {
                    text: "Sin instituciones con entregas en el período",
                    left: "center",
                    top: "middle",
                    textStyle: { color: "#6c757d", fontSize: 14, fontWeight: "normal" }
                }
            });
            return;
        }

        // Tomamos el Top 10 e invertimos el orden para que el #1 quede arriba en barra horizontal
        const top10 = ranking.slice(0, 10).reverse();
        const nombres = top10.map(i => i.Institucion.length > 26 ? i.Institucion.slice(0, 26) + "..." : i.Institucion);
        const recuperado = top10.map(i => parseFloat(i.PesoRecuperadoKg || 0));
        const descarte = top10.map(i => parseFloat(i.PesoRojoKg || 0));

        const option = {
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
                formatter: function (params) {
                    if (!params || params.length === 0) return "";
                    const idx = params[0].dataIndex;
                    const item = top10[idx];
                    return `
                        <strong>${item.Institucion}</strong><br/>
                        Entregas: <strong>${item.CantEntregas}</strong> | Última: <strong>${FormatearFechaCorta(item.UltimaEntrega)}</strong><br/>
                        Peso Bruto: <strong>${FormatearDecimal(item.PesoBrutoKg)} kg</strong><br/>
                        <hr style="margin:4px 0;"/>
                        <span style="color:#198754;">● Recuperado:</span> <strong>${FormatearDecimal(item.PesoRecuperadoKg)} kg</strong><br/>
                        <span style="color:#dc3545;">● Descarte:</span> <strong>${FormatearDecimal(item.PesoRojoKg)} kg</strong><br/>
                        Tasa Recuperación: <strong>${FormatearDecimal(item.TasaRecuperacionPct)} %</strong>
                    `;
                }
            },
            legend: {
                top: 0,
                data: ["Recuperado (kg)", "Descarte Rojo (kg)"]
            },
            grid: { left: "3%", right: "5%", bottom: "4%", top: 40, containLabel: true },
            xAxis: {
                type: "value",
                axisLabel: { formatter: val => `${val.toLocaleString("es-AR")} kg` }
            },
            yAxis: {
                type: "category",
                data: nombres,
                axisLabel: { fontSize: 11, color: "#343a40" }
            },
            series: [
                {
                    name: "Recuperado (kg)",
                    type: "bar",
                    stack: "aporte",
                    barMaxWidth: 24,
                    itemStyle: { color: "#198754" },
                    data: recuperado
                },
                {
                    name: "Descarte Rojo (kg)",
                    type: "bar",
                    stack: "aporte",
                    barMaxWidth: 24,
                    itemStyle: { color: "#dc3545" },
                    data: descarte
                }
            ]
        };

        chartTopInstituciones.setOption(option, true);
    }

    function RenderizarPlanillaMensual(planilla) {
        const $tbody = $("#tbody-inst-planilla");
        const $tfoot = $("#tfoot-inst-planilla");
        $tbody.empty();
        $tfoot.empty();

        if (!planilla || planilla.length === 0) {
            $tbody.html('<tr><td colspan="9" class="text-center py-4 text-muted">No hay registros institucionales para mostrar en este rango de fechas.</td></tr>');
            return;
        }

        let totEntregas = 0;
        let totBruto = 0;
        let totVerde = 0;
        let totAmarillo = 0;
        let totRojo = 0;
        let totPendiente = 0;

        planilla.forEach(fila => {
            totEntregas += parseInt(fila.CantEntregas || 0, 10);
            totBruto += parseFloat(fila.PesoBrutoKg || 0);
            totVerde += parseFloat(fila.PesoVerdeKg || 0);
            totAmarillo += parseFloat(fila.PesoAmarilloKg || 0);
            totRojo += parseFloat(fila.PesoRojoKg || 0);
            totPendiente += parseFloat(fila.PesoPendienteClasificarKg || 0);

            const tasa = parseFloat(fila.TasaRecuperacionPct || 0);
            const badgeClase = tasa >= 75 ? "bg-success" : (tasa >= 50 ? "bg-warning text-dark" : "bg-danger");

            $tbody.append(`
                <tr>
                    <td class="ps-3 fw-bold text-dark">${FormatearAnioMes(fila.AnioMes)} <small class="text-muted">(${fila.AnioMes})</small></td>
                    <td class="text-center">${FormatearEntero(fila.InstitucionesActivas)}</td>
                    <td class="text-center fw-semibold">${FormatearEntero(fila.CantEntregas)}</td>
                    <td class="text-end fw-semibold">${FormatearDecimal(fila.PesoBrutoKg)}</td>
                    <td class="text-end text-success">${FormatearDecimal(fila.PesoVerdeKg)}</td>
                    <td class="text-end text-warning fw-semibold">${FormatearDecimal(fila.PesoAmarilloKg)}</td>
                    <td class="text-end text-danger">${FormatearDecimal(fila.PesoRojoKg)}</td>
                    <td class="text-end text-muted">${FormatearDecimal(fila.PesoPendienteClasificarKg)}</td>
                    <td class="text-center pe-3">
                        <span class="badge ${badgeClase}">${FormatearDecimal(tasa)} %</span>
                    </td>
                </tr>
            `);
        });

        const totalClasificado = totVerde + totAmarillo + totRojo;
        const tasaGlobal = totalClasificado > 0 ? (((totVerde + totAmarillo) * 100) / totalClasificado) : 0;

        $tfoot.html(`
            <tr>
                <td class="ps-3">TOTAL PERÍODO</td>
                <td class="text-center">---</td>
                <td class="text-center">${FormatearEntero(totEntregas)}</td>
                <td class="text-end">${FormatearDecimal(totBruto)}</td>
                <td class="text-end text-success">${FormatearDecimal(totVerde)}</td>
                <td class="text-end text-warning">${FormatearDecimal(totAmarillo)}</td>
                <td class="text-end text-danger">${FormatearDecimal(totRojo)}</td>
                <td class="text-end text-muted">${FormatearDecimal(totPendiente)}</td>
                <td class="text-center pe-3">${FormatearDecimal(tasaGlobal)} %</td>
            </tr>
        `);
    }

    /* ======================================================================
       5. EXPORTACIÓN CSV COMPATIBLE CON EXCEL (es-AR)
       ====================================================================== */

    function ExportarPlanillaCSV() {
        if (!ultimaPlanillaMensual || ultimaPlanillaMensual.length === 0) {
            Swal.fire("Sin datos", "No hay filas en la planilla para exportar.", "info");
            return;
        }

        const encabezados = [
            "Periodo", "Instituciones Activas", "Entregas",
            "Peso Bruto (kg)", "Verde (kg)", "Amarillo (kg)",
            "Rojo (kg)", "Pendiente Clasificar (kg)", "Tasa Recuperacion (%)"
        ];

        const filas = ultimaPlanillaMensual.map(f => [
            f.AnioMes,
            f.InstitucionesActivas,
            f.CantEntregas,
            FormatearDecimal(f.PesoBrutoKg),
            FormatearDecimal(f.PesoVerdeKg),
            FormatearDecimal(f.PesoAmarilloKg),
            FormatearDecimal(f.PesoRojoKg),
            FormatearDecimal(f.PesoPendienteClasificarKg),
            FormatearDecimal(f.TasaRecuperacionPct)
        ].join(";"));

        const contenidoCSV = "\uFEFF" + [encabezados.join(";"), ...filas].join("\n");
        const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `SITMAS_Trazabilidad_Institucional_${$("#inst-fecha-desde").val()}_${$("#inst-fecha-hasta").val()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Interfaz pública del módulo SPA
    return {
        cargarEn: cargarEn
    };
})();