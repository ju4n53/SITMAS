// Definimos las URLs Base correspondientes al nuevo controlador de stock y salidas
const URL_SALIDA_BASE = "https://localhost:44325/api/MovimientoSalida";

$(document).ready(function () {
    console.log("SITMAS - Inicializando Módulo de Salida de Materiales...");

    // Cargamos los datos iniciales al arrancar la pantalla
    ObtenerStockYCombos();
    ObtenerMovimientoSalida();

    // Escuchamos el evento de envío del formulario de egresos
    $("#form-movimiento-salida").on("submit", function (e) {
        e.preventDefault(); // Frenamos la recarga nativa del navegador
        RegistrarEgresoMaterial();
    });
});

// --- 1. FUNCIÓN: OBTENER LISTADO GENERAL, STOCK Y CARGAR COMBOS (CONEXIÓN GET) ---

// --- FUNCIONES DE LISTADO ---

function ObtenerMovimientoSalida() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: `${URL_SALIDA_BASE}/ListarTodo`,
        success: function (data) {
            const _tbody = document.getElementById("tbody-listado-salidas");
            _tbody.innerHTML = "";
            data.forEach(o => {
                let _tr = `<tr>               
                            <td>${o.IdSalida}</td>
                            <td>${o.TipoMovimiento}</td>
                            <td>${o.FechaMovimiento}</td>
                            <td>${o.Id_SubTipo_Material}</td>
                            <td>${o.PesoRetirado}</td>
                            <td>${o.Observaciones}</td>
                            <td>${o.EstadoSalida}</td>
                           </tr>`;
                _tbody.innerHTML += _tr;
            });
        },
        error: function (error) { console.log("Error en ListarTodo:", error); }
    });
}

function ObtenerStockYCombos() {
    $.ajax({
        type: "GET",
        url: `${URL_SALIDA_BASE}/StockNeto`,
        dataType: "json",
        success: function (data) {
            // --- A. Renderizado de la Tabla de Inventario Real ---
            const tbody = document.getElementById("tbody-stock-neto");
            tbody.innerHTML = "";

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">⚠️ No hay stock registrado en la planta actualmente.</td></tr>`;
                return;
            }

            // --- B. Limpieza y preparación del selector de materiales ---
            const selectMaterial = $("#select-subtipo-material");
            selectMaterial.empty().append('<option value="">Seleccione el material a retirar...</option>');

            data.forEach(item => {
                // 1. Formateo de estilo para el Stock Neto Disponible
                let claseStock = "fw-bold text-success";
                if (parseFloat(item.StockDisponibleKg) <= 0) {
                    claseStock = "text-danger small italic";
                }

                // 2. Inyección de filas en la tabla de control
                let fila = `<tr>
                                <td><span class="badge bg-light text-dark border">#${item.IdSubtipo}</span></td>
                                <td><span class="badge bg-secondary-subtle text-secondary border-0">${item.Categoria}</span></td>
                                <td class="fw-semibold">${item.SubtipoMaterial}</td>
                                <td>${item.TotalClasificadoKg} kg</td>
                                <td class="text-muted">${item.TotalSalidoKg} kg</td>
                                <td class="text-end ${claseStock}">${item.StockDisponibleKg} kg</td>
                            </tr>`;
                tbody.innerHTML += fila;

                // 3. Alimentación del combo select de forma inteligente
                // Solo permitimos seleccionar materiales que tengan stock real mayor a 0
                if (parseFloat(item.StockDisponibleKg) > 0) {
                    selectMaterial.append(`<option value="${item.IdSubtipo}">${item.SubtipoMaterial} (Disp: ${item.StockDisponibleKg} Kg)</option>`);
                } else {
                    selectMaterial.append(`<option value="${item.IdSubtipo}" disabled>❌ ${item.SubtipoMaterial} (Sin Stock)</option>`);
                }
            });

            console.log("SITMAS - Planilla de stock e inputs actualizados.");
        },
        error: function (err) {
            console.error("Error al recuperar el stock real neto:", err);
            alert("❌ No se pudo recuperar el estado actual del inventario desde el servidor.");
        }
    });
}

// --- 2. FUNCIÓN: REGISTRAR EL EGRESO / CONSUMO (CONEXIÓN POST) ---
function RegistrarEgresoMaterial() {
    const tipoMov = $("#select-tipo-movimiento").val();
    const idSubtipo = $("#select-subtipo-material").val();
    const peso = $("#input-peso-retirar").val();
    const obs = $("#input-observaciones").val();

    // Validaciones preventivas en el cliente antes de disparar el AJAX
    if (!tipoMov || !idSubtipo || !peso || parseFloat(peso) <= 0) {
        alert("⚠️ Por favor, complete todos los campos con valores válidos mayores a 0.");
        return;
    }

    // Construcción del objeto JSON compatible con el modelo C# de la API
    const salidaObj = {
        "TipoMovimiento": tipoMov,
        "Id_SubTipo_Material": parseInt(idSubtipo),
        "PesoRetirado": parseFloat(peso),
        "Observaciones": obs || ""
    };

    console.log("SITMAS - Enviando solicitud de egreso de stock:", salidaObj);

    $.ajax({
        type: "POST",
        url: URL_SALIDA_BASE,
        data: JSON.stringify(salidaObj),
        contentType: "application/json; charset=utf-8",
        success: function (mensajeExito) {
            // El servidor respondió con Ok()
            alert("✅ " + mensajeExito);

            // Limpiamos los inputs del formulario para el próximo retiro
            $("#select-tipo-movimiento").val("");
            $("#select-subtipo-material").val("");
            $("#input-peso-retirar").val("");
            $("#input-observaciones").val("");

            // 🔄 LA MAGIA REUTILIZABLE: Volvemos a llamar a la función para que 
            // la tabla de stock se recalcule sola en pantalla al instante sin F5.
            ObtenerStockYCombos();
        },
        error: function (err) {
            console.error("Error capturado en la transacción de salida:", err);

            // 🛡️ CAPTURA REAFIRMADA: Si la API nos mandó el BadRequest con el texto del RAISERROR
            // se lo mostramos de forma clara y directa al pesador en pantalla.
            if (err.responseText) {
                // Removemos comillas extras que suele meter el formato JSON si hiciera falta
                let msgError = err.responseText.replace(/"/g, '');
                alert("⚠️ ATENCIÓN RECHAZADA POR EL SISTEMA:\n\n" + msgError);
            } else {
                alert("❌ Ocurrió un error interno en el servidor al intentar procesar el egreso.");
            }
        }
    });
}