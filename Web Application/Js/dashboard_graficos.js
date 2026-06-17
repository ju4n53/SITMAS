const API_URL = "https://localhost:44325/api/Dashboard"; // Revisa si tu puerto local coincide

// Esperamos a que la página cargue por completo
document.addEventListener("DOMContentLoaded", function () {
    cargarGraficoPesoBruto();
    cargarGraficoRendimiento();
    cargarGraficoStockActual();
});

// 1. FUNCIÓN PARA EL GRÁFICO DE TORTA
function cargarGraficoPesoBruto() {
    fetch(`${API_URL}/PesoBrutoAcumulado`)
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener datos analíticos");
            return response.json();
        })
        .then(data => {
            // Mapeamos el JSON a arrays independientes que entiende Chart.js
            const etiquetas = data.map(item => item.SubtipoMaterial);
            const kilogramos = data.map(item => item.TotalPesoBrutoKg);

            const ctx = document.getElementById('chartPesoBruto').getContext('2d');
            new Chart(ctx, {
                type: 'pie', // Tipo de gráfico: Torta
                data: {
                    labels: etiquetas,
                    datasets: [{
                        data: kilogramos,
                        // Paleta de colores
                        backgroundColor: [
                            '#2ec4b6', '#e71d36', '#ff9f1c', '#011627', '#4361ee', '#72efdd'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right' // Leyendas a la derecha
                        }
                    }
                }
            });
        })
        .catch(error => console.error("Error en Dashboard (Peso Bruto):", error));
}

// 2. FUNCIÓN PARA EL GRÁFICO DE BARRAS COMPARATIVAS
function cargarGraficoRendimiento() {
    fetch(`${API_URL}/RendimientoClasificacion`)
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener rendimiento");
            return response.json();
        })
        .then(data => {
            const etiquetas = data.map(item => item.SubtipoMaterial);
            const pesoBruto = data.map(item => item.TotalPesoBrutoKg);
            const pesoUtil = data.map(item => item.TotalPesoUtilKg);

            const ctx = document.getElementById('chartRendimiento').getContext('2d');
            new Chart(ctx, {
                type: 'bar', // Tipo de gráfico: Barras
                data: {
                    labels: etiquetas,
                    datasets: [
                        {
                            label: 'Ingreso Bruto (Kg)',
                            data: pesoBruto,
                            backgroundColor: '#4361ee', // Azul institucional
                            borderRadius: 4
                        },
                        {
                            label: 'Recuperado Útil (Kg)',
                            data: pesoUtil,
                            backgroundColor: '#2ec4b6', // Verde Turquesa (Eficiencia)
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Kilogramos (Kg)'
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error("Error en Dashboard (Rendimiento):", error));
}

// 3. FUNCIÓN DE STOCK REAL
function cargarGraficoStockActual() {
    fetch(`${API_URL}/StockActualSubtipos`)
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener el stock");
            return response.json();
        })
        .then(data => {
            // Extraemos los nombres de los materiales y sus KILOS ÚTILES acumulados
            const etiquetas = data.map(item => item.SubtipoMaterial);
            const stockUtil = data.map(item => item.TotalPesoUtilKg); // 👈 ¡Campo clave de PesoUtil!

            const ctx = document.getElementById('chartStockActual').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: etiquetas,
                    datasets: [{
                        label: 'Stock Disponible (Kg Netos)',
                        data: stockUtil,
                        backgroundColor: '#10b981', // Verde Esmeralda (representa stock limpio y listo)
                        borderRadius: 6,
                        borderWidth: 0
                    }]
                },
                options: {
                    indexAxis: 'y', // 👈 ¡TRUCO DE CHART.JS! Voltea el gráfico para que las barras sean horizontales
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // Ocultamos la leyenda superior porque el título de la tarjeta ya lo explica
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Cantidad disponible (Kg)'
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error("Error en Dashboard (Stock):", error));
}


