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
                type: 'doughnut', // Tipo de gráfico: Torta
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
    // 👈 CAMBIO 1: Apuntamos al nuevo controlador de movimientos de salida y su endpoint de StockNeto
    fetch(`https://localhost:44325/api/MovimientoSalida/StockNeto`)
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener el stock neto real");
            return response.json();
        })
        .then(data => {
            // Extraemos los nombres de los materiales de la nueva vista
            const etiquetas = data.map(item => item.SubtipoMaterial);
            
            // 👈 CAMBIO 2: ¡La clave de la automatización! 
            // Mapeamos a 'StockDisponibleKg' (que ya tiene restadas las salidas de producción, egresos y retiros)
            const stockNetoReal = data.map(item => item.StockDisponibleKg); 

            const ctx = document.getElementById('chartStockActual').getContext('2d');
            
            // 💡 TIP ANALÍTICO: Si el gráfico ya existía en pantalla, Chart.js puede quejarse al redibujar.
            // Para evitar que se duplique o parpadee si se actualiza seguido, limpiamos el canvas anterior.
            let chartStatus = Chart.getChart("chartStockActual");
            if (chartStatus != undefined) {
                chartStatus.destroy();
            }

            new Chart(ctx, {
                type: 'bar', 
                data: {
                    labels: etiquetas,
                    datasets: [{
                        label: 'Stock Neto Disponible (Kg Físicos en Galpón)',
                        data: stockNetoReal, // 👈 Pasamos los kilos netos actualizados
                        backgroundColor: '#10b981', // Verde Esmeralda institucional
                        borderRadius: 6,
                        borderWidth: 0
                    }]
                },
                options: {
                    indexAxis: 'y', // Mantiene las barras horizontales para modo ranking
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false 
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Inventario Disponible (Kg Netos)'
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error("Error al actualizar la gráfica de Stock Neto:", error));
}


