const URL_INFORMES_BASE = "https://localhost:44325/api/Reportes";

$(document).ready(function () {
    console.log("SITMAS - Inicializando Motor de Reportes Centralizado...");
    // carga inicial basada en el elemento seleccionado por defecto (Salidas)
    CambiarReporteActivo();
    CargarKPIsCalidad();
});

// --- FUNCIÓN COORDINADORA DEL SELECTOR ---
function CambiarReporteActivo() {
    const reporteSeleccionado = $("#select-tipo-reporte").val();
    const txtTitulo = document.getElementById("titulo-reporte-dinamico");
    const thead = document.getElementById("thead-reporte-dinamico");
    const tbody = document.getElementById("tbody-reporte-dinamico");

    //estado de carga intermedio
    tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm text-success me-2"></div>Procesando datos del servidor...</td></tr>`;

    switch (reporteSeleccionado) {
        case "Ingresos":
            $("#panel-graficos-salidas").addClass("d-none");
            txtTitulo.innerText = "Historial de Cabeceras de Ingreso (Arribo de Vehículos)";
            thead.innerHTML = `<tr>
                                  <th>Nro Ingreso</th>
                                  <th>Fecha Arribo</th>
                                  <th>Chofer</th>
                                  <th>Vehículo (Patente)</th>
                                  <th>Registrado Por</th>
                                  <th class="text-center">Estado</th>
                               </tr>`;
            CargarTablaCabeceras();
            break;

        case "Detalles":
            $("#panel-graficos-salidas").addClass("d-none");
            txtTitulo.innerText = "Historial de Desglose Bruto Ingresado (Pesadas de Camión)";
            thead.innerHTML = `<tr>
                                  <th>Nro Detalle</th>
                                  <th>Nro Ingreso</th>
                                  <th>Origen / Empresa</th>
                                  <th>Categoría</th>
                                  <th>Subtipo Material</th>
                                  <th>Peso Bruto</th>
                                  <th>Observaciones</th>
                                  <th class="text-center">Estado</th>
                               </tr>`;
            CargarTablaDetalles();
            break;

        case "Clasificaciones":
            $("#panel-graficos-salidas").addClass("d-none");
            txtTitulo.innerText = "Historial de Material Clasificado (Rendimiento Post-Cinta)";
            thead.innerHTML = `<tr>
                                  <th>Nro Clasif.</th>
                                  <th>Nro Detalle Origen</th>
                                  <th>Categoría</th>
                                  <th>Subtipo Material</th>
                                  <th>Peso Útil</th>
                                  <th class="text-center">Condición</th>
                                  <th>Destino Final</th>
                                  <th>Clasificador</th>
                                  <th>Fecha Proceso</th>
                               </tr>`;
            CargarTablaClasificaciones();
            break;

        case "Salidas":
            //panel de gráficos solo para salidas
            $("#panel-graficos-salidas").removeClass("d-none");
            //
            txtTitulo.innerText = "Historial de Movimientos de Salida (Consumos y Egresos)";
            thead.innerHTML = `<tr>
                                  <th>Nro Salida</th>
                                  <th>Tipo Movimiento</th>
                                  <th>Fecha Egreso</th>
                                  <th>Categoría</th>
                                  <th>Subtipo Material</th>
                                  <th>Peso Retirado</th>
                                  <th>Destino / Detalles</th>
                                  <th class="text-center">Estado</th>
                               </tr>`;
            CargarTablaSalidas();
            break;

        default:
            //gráficos ocultados
            $("#panel-graficos-salidas").addClass("d-none");
        //
    }
}


// 1. REPORTE: CABECERAS DE INGRESO
function CargarTablaCabeceras() {
    $.ajax({
        type: "GET",
        url: `${URL_INFORMES_BASE}/ListadoCabeceras`,
        dataType: "json",
        success: function (data) {
            const tbody = document.getElementById("tbody-reporte-dinamico");
            tbody.innerHTML = "";

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">⚠️ No hay registros de ingresos en la base de datos.</td></tr>`;
                return;
            }

            data.forEach(item => {
                let fechaFormateada = FormatearFechaRegional(item.FechaIngreso);
                let badgeEstado = item.Estado === "Activo" ? `<span class="badge bg-success-subtle text-success border border-success-subtle">Activo</span>` : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">${item.Estado}</span>`;

                let tr = `<tr>
                            <td class="fw-bold text-secondary">#${item.NroIngreso}</td>
                            <td class="small">${fechaFormateada}</td>
                            <td>${item.Chofer}</td>
                            <td><span class="badge bg-light text-dark border">${item.VehiculoPatente}</span></td>
                            <td class="text-muted small">${item.RegistradoPor}</td>
                            <td class="text-center">${badgeEstado}</td>
                          </tr>`;
                tbody.innerHTML += tr;
            });
        },
        error: function (err) { ManejarErrorFetch(err); }
    });
}

// 2. REPORTE: DETALLES DESGLOSADOS
function CargarTablaDetalles() {
    $.ajax({
        type: "GET",
        url: `${URL_INFORMES_BASE}/ListadoDetalles`,
        dataType: "json",
        success: function (data) {
            const tbody = document.getElementById("tbody-reporte-dinamico");
            tbody.innerHTML = "";

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">⚠️ No hay detalles cargados.</td></tr>`;
                return;
            }

            data.forEach(item => {
                let badgeEstado = item.Estado === "Activo" ? `<span class="badge bg-success-subtle text-success border border-success-subtle">Activo</span>` : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">${item.Estado}</span>`;

                let tr = `<tr>
                            <td><span class="badge bg-light text-dark border">#${item.NroDetalle}</span></td>
                            <td class="fw-bold text-secondary">#${item.NroIngresoAsociado}</td>
                            <td class="fw-semibold text-dark">${item.OrigenEmpresa}</td>
                            <td><span class="badge bg-dark-subtle text-dark border-0">${item.Categoria}</span></td>
                            <td>${item.SubtipoMaterial}</td>
                            <td class="fw-bold text-secondary">${item.KilosBrutos} kg</td>
                            <td class="text-muted small"><em>${item.Observaciones || "---"}</em></td>
                            <td class="text-center">${badgeEstado}</td>
                          </tr>`;
                tbody.innerHTML += tr;
            });
        },
        error: function (err) { ManejarErrorFetch(err); }
    });
}

//3. REPORTE: MATERIAL CLASIFICADO
function CargarTablaClasificaciones() {
    $.ajax({
        type: "GET",
        url: `${URL_INFORMES_BASE}/ListadoClasificaciones`,
        dataType: "json",
        success: function (data) {
            const tbody = document.getElementById("tbody-reporte-dinamico");
            tbody.innerHTML = "";

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">⚠️ No hay materiales clasificados aún.</td></tr>`;
                return;
            }

            data.forEach(item => {
                let fechaFormateada = FormatearFechaRegional(item.FechaClasificacion);

                // Renderizado condicional dinámico según el estado físico (Verde, Amarillo, Rojo)
                let badgeCondicion = `<span class="badge bg-secondary text-white">${item.CondicionMaterial}</span>`;
                if (item.CondicionMaterial.toLowerCase() === 'verde') badgeCondicion = `<span class="badge bg-success text-white border-0">Verde</span>`;
                if (item.CondicionMaterial.toLowerCase() === 'amarillo') badgeCondicion = `<span class="badge bg-warning text-dark border-0">Amarillo</span>`;
                if (item.CondicionMaterial.toLowerCase() === 'rojo') badgeCondicion = `<span class="badge bg-danger text-white border-0">Rojo</span>`;

                let tr = `<tr>
                            <td><span class="badge bg-light text-dark border">#${item.NroClasificacion}</span></td>
                            <td class="text-secondary fw-semibold">#${item.NroDetalleOrigen}</td>
                            <td><span class="badge bg-dark-subtle text-dark border-0">${item.Categoria}</span></td>
                            <td>${item.SubtipoMaterial}</td>
                            <td class="fw-bold text-success">${item.KilosUtiles} kg</td>
                            <td class="text-center">${badgeCondicion}</td>
                            <td class="fw-semibold text-secondary">${item.DestinoFinal}</td>
                            <td class="text-muted small">${item.ClasificadoPor}</td>
                            <td class="small">${fechaFormateada}</td>
                          </tr>`;
                tbody.innerHTML += tr;
            });
        },
        error: function (err) { ManejarErrorFetch(err); }
    });
}

// 4. REPORTE: MOVIMIENTOS DE SALIDA
function CargarTablaSalidas() {
    $.ajax({
        type: "GET",
        url: `${URL_INFORMES_BASE}/ListadoSalidas`,
        dataType: "json",
        success: function (data) {
            const tbody = document.getElementById("tbody-reporte-dinamico");
            tbody.innerHTML = "";

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">⚠️ No hay registros de egresos cargados.</td></tr>`;
                $("#panel-graficos-salidas").addClass("d-none"); // Ocultamos si no hay datos
                return;
            }

            // 🧠 LÓGICA DE AGRUPACIÓN EN MEMORIA PARA GRÁFICOS
            const acumuladorSubtipos = {};
            const acumuladorTiposMov = {};

            data.forEach(item => {
                // Solo acumulamos si el registro está procesado/activo
                if (item.Estado.toLowerCase() !== 'anulado') {
                    // 1. Agrupación por Subtipo (Ej: "Caños Metálicos")
                    if (!acumuladorSubtipos[item.SubtipoMaterial]) {
                        acumuladorSubtipos[item.SubtipoMaterial] = 0;
                    }
                    acumuladorSubtipos[item.SubtipoMaterial] += parseFloat(item.KilosRetirados);

                    // 2. Agrupación por Tipo de Movimiento
                    if (!acumuladorTiposMov[item.TipoEgreso]) {
                        acumuladorTiposMov[item.TipoEgreso] = 0;
                    }
                    acumuladorTiposMov[item.TipoEgreso] += parseFloat(item.KilosRetirados);
                }

                // Renderizado de filas de la tabla
                let fechaFormateada = FormatearFechaRegional(item.FechaMovimiento);
                let claseMov = "badge bg-info text-dark";
                if (item.TipoEgreso === "Producción") claseMov = "badge bg-primary text-white";
                if (item.TipoEgreso === "Retiro") claseMov = "badge bg-warning text-dark";

                let tr = `<tr>
                            <td><span class="badge bg-light text-dark border">#${item.NroSalida}</span></td>
                            <td><span class="${claseMov}">${item.TipoEgreso}</span></td>
                            <td class="small">${fechaFormateada}</td>
                            <td><span class="badge bg-dark-subtle text-dark border-0">${item.Categoria}</span></td>
                            <td class="fw-semibold">${item.SubtipoMaterial}</td>
                            <td class="fw-bold text-danger">-${item.KilosRetirados} kg</td>
                            <td class="text-muted small">${item.DestinoDetalle || "---"}</td>
                            <td class="text-center"><span class="badge bg-light-subtle text-secondary border">${item.Estado}</span></td>
                          </tr>`;
                tbody.innerHTML += tr;
            });

            // 🎨 RENDERIZADO DE LOS DOS GRÁFICOS DE TORTA
            GenerarTortaDinamica('chartSalidasSubtipo', Object.keys(acumuladorSubtipos), Object.values(acumuladorSubtipos));
            GenerarTortaDinamica('chartSalidasTipoMov', Object.keys(acumuladorTiposMov), Object.values(acumuladorTiposMov));
        },
        error: function (err) { ManejarErrorFetch(err); }
    });
}

// 🪄 FUNCIÓN AUXILIAR REUTILIZABLE PARA CREAR LAS TORTAS SIN REPETIR CÓDIGO
function GenerarTortaDinamica(canvasId, etiquetas, valores) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Si el gráfico existía, lo destruimos para evitar parpadeos
    let chartStatus = Chart.getChart(canvasId);
    if (chartStatus != undefined) {
        chartStatus.destroy();
    }

    new Chart(ctx, {
        type: 'doughnut', // tipo dona
        data: {
            labels: etiquetas,
            datasets: [{
                data: valores,
                backgroundColor: ['#4361ee', '#2ec4b6', '#ff9f1c', '#e71d36', '#011627', '#72efdd'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, font: { family: 'Maven Pro' } } }
            }
        }
    });
}


function CargarKPIsCalidad() {
    $.ajax({
        type: "GET",
        url: `${URL_INFORMES_BASE}/CalidadTotales`,
        dataType: "json",
        success: function (res) {
            const total = parseFloat(res.KilosTotalBase);
            
            // 1.Tarjetas Superiores
            document.getElementById("kpi-total-base").innerText = total.toLocaleString('es-AR', { maximumFractionDigits: 2 });

            const pctVerde = total > 0 ? (parseFloat(res.KilosVerde) / total * 100) : 0;
            const pctAmarillo = total > 0 ? (parseFloat(res.KilosAmarillo) / total * 100) : 0;
            const pctRojo = total > 0 ? (parseFloat(res.KilosRojo) / total * 100) : 0;

            document.getElementById("kpi-pct-verde").innerText = pctVerde.toFixed(2) + " %";
            document.getElementById("kpi-pct-amarillo").innerText = pctAmarillo.toFixed(2) + " %";
            document.getElementById("kpi-pct-rojo").innerText = pctRojo.toFixed(2) + " %";

            document.getElementById("kpi-kg-verde").innerText = res.KilosVerde.toLocaleString('es-AR') + " Kg";
            document.getElementById("kpi-kg-amarillo").innerText = res.KilosAmarillo.toLocaleString('es-AR') + " Kg";
            document.getElementById("kpi-kg-rojo").innerText = res.KilosRojo.toLocaleString('es-AR') + " Kg";

            // 2.Barra Inferior de Categorías
            document.getElementById("cat-carton-papel").innerText = res.KgsCartonPapel.toLocaleString('es-AR');
            document.getElementById("cat-madera").innerText = res.KgsMadera.toLocaleString('es-AR');
            document.getElementById("cat-plastico").innerText = res.KgPlasticos.toLocaleString('es-AR');
            document.getElementById("cat-metal").innerText = res.KgsMetal.toLocaleString('es-AR');
            document.getElementById("cat-rsu").innerText = res.KgsRSU.toLocaleString('es-AR');
            document.getElementById("cat-vidrio").innerText = res.KgsVidrio.toLocaleString('es-AR');
            document.getElementById("cat-otro").innerText = res.KgsOtro.toLocaleString('es-AR');
        },
        error: function (err) {
            console.error("Error al cargar KPIs de calidad e inferiores:", err);
        }
    });
}

// function CargarKPIsCalidad() {
//     $.ajax({
//         type: "GET",
//         url: `${URL_INFORMES_BASE}/CalidadTotales`,
//         dataType: "json",
//         success: function (res) {
//             const total = parseFloat(res.KilosTotalBase);
            
//             // Inyectamos el total bruto en la tarjeta celeste
//             document.getElementById("kpi-total-base").innerText = total.toLocaleString('es-AR', { maximumFractionDigits: 2 });

//             // Calculamos porcentajes evitando la división por cero si la planta arranca vacía
//             const pctVerde = total > 0 ? (parseFloat(res.KilosVerde) / total * 100) : 0;
//             const pctAmarillo = total > 0 ? (parseFloat(res.KilosAmarillo) / total * 100) : 0;
//             const pctRojo = total > 0 ? (parseFloat(res.KilosRojo) / total * 100) : 0;

//             // Inyectamos porcentajes
//             document.getElementById("kpi-pct-verde").innerText = pctVerde.toFixed(2) + " %";
//             document.getElementById("kpi-pct-amarillo").innerText = pctAmarillo.toFixed(2) + " %";
//             document.getElementById("kpi-pct-rojo").innerText = pctRojo.toFixed(2) + " %";

//             // Inyectamos los Kg como información de soporte abajo
//             document.getElementById("kpi-kg-verde").innerText = res.KilosVerde.toLocaleString('es-AR') + " Kg";
//             document.getElementById("kpi-kg-amarillo").innerText = res.KilosYellow || res.KilosAmarillo.toLocaleString('es-AR') + " Kg";
//             document.getElementById("kpi-kg-rojo").innerText = res.KilosRojo.toLocaleString('es-AR') + " Kg";
//         },
//         error: function (err) {
//             console.error("Error al cargar KPIs de calidad:", err);
//         }
//     });
// }


// --- FUNCIONES AUXILIARES GLOBALES ---
function FormatearFechaRegional(fechaRaw) {
    if (!fechaRaw) return "---";
    return new Date(fechaRaw).toLocaleString('es-AR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
}

function ManejarErrorFetch(err) {
    console.error("Error en el Motor de Informes SITMAS:", err);
    const tbody = document.getElementById("tbody-reporte-dinamico");
    tbody.innerHTML = `<tr><td colspan="12" class="text-center text-danger py-4">❌ Error al comunicar con la API de Reportes. Revise el estado del servidor.</td></tr>`;
}