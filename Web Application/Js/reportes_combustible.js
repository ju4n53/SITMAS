const API_URL_REPORTES = "https://localhost:44325/api/Reportes/EstadisticasVehiculos";
// const API_URL_VEHICULO = "https://localhost:44325/api/Vehiculo/ListarTodo";

document.addEventListener("DOMContentLoaded", function () {
    // Establecemos valores iniciales en los inputs de fecha (Ej: Del 1 de enero al día de hoy)
    const hoy = new Date();
    const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);

    const inputDesde = document.getElementById('filtroFechaDesde');
    const inputHasta = document.getElementById('filtroFechaHasta');

    if (inputDesde && !inputDesde.value) {
        inputDesde.value = primerDiaAnio.toISOString().split('T')[0];
    }
    if (inputHasta && !inputHasta.value) {
        inputHasta.value = hoy.toISOString().split('T')[0];
    }

    // Carga inicial al abrir la página
    cargarEstadisticasVehiculos();

    // Evento click del botón filtrar
    const btnFiltrar = document.getElementById('btnFiltrarEstadisticas');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', function () {
            cargarEstadisticasVehiculos();
        });
    }
});

// Función central para consultar la API con filtros de fecha
function cargarEstadisticasVehiculos() {
    const fechaDesde = document.getElementById('filtroFechaDesde')?.value;
    const fechaHasta = document.getElementById('filtroFechaHasta')?.value;

    let url = `${API_URL_REPORTES}`;
    let params = [];

    if (fechaDesde) params.push(`fechaDesde=${fechaDesde}`);
    if (fechaHasta) params.push(`fechaHasta=${fechaHasta}`);

    if (params.length > 0) {
        url += `?${params.join('&')}`;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener las estadísticas de vehículos");
            return response.json();
        })
        .then(data => {
            renderizarGraficoUso(data);
            renderizarGraficoCombustible(data);
        })
        .catch(error => console.error("Error al cargar los gráficos de vehículos:", error));
}

// 1. GRÁFICO DE BARRAS: Kms Recorridos y Hojas de Ruta por Patente
function renderizarGraficoUso(data) {
    const etiquetas = data.map(item => item.Patente);
    const kilometros = data.map(item => item.Total_Distancia);
    const hojasRuta = data.map(item => item.Total_HojasRuta);

    const ctx = document.getElementById('chartUsoVehiculos');
    if (!ctx) return;

    // Destruimos el gráfico anterior si ya existía para evitar solapamientos de Chart.js
    let chartStatus = Chart.getChart("chartUsoVehiculos");
    if (chartStatus !== undefined) {
        chartStatus.destroy();
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: etiquetas,
            datasets: [
                {
                    label: 'Kilómetros (Km)',
                    data: kilometros,
                    backgroundColor: '#4361ee', // Azul institucional
                    borderRadius: 4,
                    yAxisID: 'y'
                },
                {
                    label: 'Hojas de Ruta Finalizadas',
                    data: hojasRuta,
                    backgroundColor: '#2ec4b6', // Verde Turquesa
                    borderRadius: 4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: 'Kilómetros (Km)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: { drawOnChartArea: false }, // Evita cruce de líneas de grilla
                    title: { display: true, text: 'Cantidad de Hojas de Ruta' }
                }
            }
        }
    });
}

// 2. GRÁFICO DE BARRAS: Costo de Combustible por Patente
function renderizarGraficoCombustible(data) {
    const etiquetas = data.map(item => item.Patente);
    const costos = data.map(item => item.Total_Costo_Combustible);

    const ctx = document.getElementById('chartConsumoCombustible');
    if (!ctx) return;

    let chartStatus = Chart.getChart("chartConsumoCombustible");
    if (chartStatus !== undefined) {
        chartStatus.destroy();
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Costo Total Combustible (\$)',
                data: costos,
                backgroundColor: '#ff9f1c', // Naranja institucional
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Costo Total (\$)' }
                }
            }
        }
    });
}

