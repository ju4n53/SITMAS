/* ==========================================================================
   SITMAS - Módulo: Hoja de Ruta (Cabecera) - Lógica de Interfaz
   Tecnologías: JavaScript (ES6+), jQuery, AJAX, Bootstrap 5
   ========================================================================== */

const URL_API_HDR = "https://localhost:44325/api/hojaruta";
const URL_API_VEHICULOS = "https://localhost:44325/api/Vehiculo/ListarTodo";

$(document).ready(function () {
    InicializarModuloHDR();

    $("#formHojaRuta").on("submit", function (e) {
        e.preventDefault();
        GuardarHojaRuta();
    });

    // 📡 PATRÓN OYENTE (Pub/Sub):
    // Cuando el módulo de detalles notifique una asignación por Drag & Drop,
    // volvemos a pedir las cabeceras a la API. Como el SP ya cambió el estado en BD,
    // la tarjeta se renderizará automáticamente como "Asignado".
    document.addEventListener("CargaVehiculoActualizada", function (evento) {
        console.log("SITMAS - Actualización detectada en vehículo:", evento.detail);
        GetAllHojasRuta();
    });
});

function InicializarModuloHDR() {
    CargarComboVehiculos().then(() => {
        GetAllHojasRuta();
    }).catch(err => {
        console.error("Error al inicializar vehículos:", err);
    });
}

function CargarComboVehiculos() {
    return $.ajax({
        type: "GET",
        url: URL_API_VEHICULOS,
        dataType: "json",
        success: function (data) {
            const $select = $("#id_vehiculo");
            $select.empty().append('<option value="">Seleccione Vehículo (Patente)</option>');
            if (Array.isArray(data)) {
                data.forEach(v => {
                    $select.append(`<option value="${v.Id}">${v.Id} - ${v.Patente}</option>`);
                });
            }
        }
    });
}

function ObtenerClaseColorEstado(estadoNombre) {
    if (!estadoNombre) return "bg-secondary";
    const est = estadoNombre.toLowerCase();
    if (est.includes("pendiente")) return "bg-warning text-dark";
    if (est.includes("asignado")) return "bg-primary";
    if (est.includes("curso")) return "bg-info text-dark";
    if (est.includes("finaliz")) return "bg-success";
    return "bg-secondary";
}

function GetAllHojasRuta() {
    $.ajax({
        type: "GET",
        url: URL_API_HDR,
        dataType: "json",
        success: function (lista) {
            const $contenedor = $("#zonaVehiculos");
            $contenedor.empty();

            if (!lista || lista.length === 0) {
                $contenedor.append('<div class="col-12 text-center text-muted py-4">No hay Hojas de Ruta activas.</div>');
                return;
            }

            lista.forEach(item => {
                const claseEstado = ObtenerClaseColorEstado(item.Estado);
                const estadoTexto = item.Estado || 'Pendiente';


                const cardVehiculo = `
                    <div class="col-md-6 mb-2">
                        <div class="card h-100 border-dark shadow-sm">
                            <div class="card-header bg-secondary text-white p-2 d-flex justify-content-between align-items-center">
                                <div>
                                    <strong class="fs-6">HR #${item.Id}</strong> - 
                                    <span class="badge bg-light text-dark">${item.Vehiculo || 'Sin Vehículo'}</span>
                                </div>
                                <small>${item.FechaFormateada || ''}</small>
                            </div>
                            <div class="card-body p-2 bg-white">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge ${claseEstado}">${estadoTexto}</span>
                                    <small class="fw-bold text-primary">Total: ${item.Distancia_Total_Estimada_Km || 0} Km</small>
                                </div>
                                <div class="dropzone-vehiculo bg-light border rounded p-2 mb-2" 
                                     id="hdr-drop-${item.Id}" 
                                     data-id-hojaruta="${item.Id}" 
                                     style="min-height: 120px; max-height: 300px; overflow-y: auto;">
                                </div>
                                
                                <!-- ✨ ESTE ES EL NUEVO BOTÓN DE CONEXIÓN -->
                                <button class="btn btn-sm btn-outline-primary w-100" onclick="SincronizarConMapa(${item.Id})">
                                    📍 Trazar en Mapa
                                </button>
                            </div>
                        </div>
                    </div>`;

                $contenedor.append(cardVehiculo);

                // Cargar las paradas correspondientes a esta Hoja de Ruta
                if (typeof ObtenerParadasPorHojaRuta === "function") {
                    ObtenerParadasPorHojaRuta(item.Id);
                }
            });

            // Re-inicializar eventos Drag and Drop
            if (typeof ActivarSortableEnTablero === "function") {
                ActivarSortableEnTablero();
            }
        },
        error: function (err) {
            console.error("SITMAS - Error en GetAllHojasRuta:", err);
        }
    });
}

function GuardarHojaRuta() {
    const id = $("#hdnIdHojaRuta").val();
    const esModificacion = id && parseInt(id) > 0;

    const dto = {
        Id: esModificacion ? parseInt(id) : 0,
        HojaRutaFecha: $("#fecha_hdr").val(),
        Id_Vehiculo: parseInt($("#id_vehiculo").val()) || 0,
        Id_Chofer: null, // Desacoplado
        Id_Estado: 1     // 1 = Pendiente
    };

    const tipoMetodo = esModificacion ? "PUT" : "POST";
    const urlEndpoint = esModificacion ? `${URL_API_HDR}/${id}` : URL_API_HDR;

    $.ajax({
        type: tipoMetodo,
        url: urlEndpoint,
        data: JSON.stringify(dto),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function () {
            mostrarAlerta("Cabecera guardada correctamente.", "success");
            $("#modalHojaRuta").modal("hide");
            $("#formHojaRuta")[0].reset();
            GetAllHojasRuta();
        },
        error: function (err) {
            console.error("SITMAS - Error al guardar Hoja de Ruta:", err);
            mostrarAlerta("No se pudo guardar la Hoja de Ruta.", "danger");
        }
    });
}

function SincronizarConMapa(idHojaRuta) {
    // 1. Buscamos el combo del mapa y le asignamos el ID del camión seleccionado
    $("#map_id_hoja_ruta").val(idHojaRuta);

    // 2. Disparamos artificialmente el evento "change" para que el mapa crea que el usuario lo seleccionó a mano
    $("#map_id_hoja_ruta").trigger("change");

    // 3. Hacemos un scroll suave e interactivo hacia abajo para que el usuario vea el mapa dibujándose
    $("html, body").animate({
        scrollTop: $("#mapaInteractiveContainer").offset().top - 100
    }, 800);
}
