/* ========================================================================
   SITMAS - Módulo de Trazabilidad: Fase Salida / Despacho de Materiales
   Arquitectura: Module Pattern (IIFE) + jQuery + SweetAlert2
   ======================================================================== */

const SalidaModulo = (function () {
    // 🔒 ESTADO PRIVADO DEL MÓDULO
    let estado = {
        stockDisponible: [],
        idSubtipoSeleccionado: null,
        stockMaximoPermitido: 0
    };

    // Endpoints de la Web API (.NET)
    const URL_MOVIMIENTO_SALIDA = "https://localhost:44325/api/MovimientoSalida";
    const URL_EMPLEADO = "https://localhost:44325/api/Empleado";

    // 1. INICIALIZACIÓN DEL MÓDULO (Inyectado desde gestion_trazabilidad.html)
    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <div class="row fade-in">
                <div class="col-12 d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <div>
                        <h4 class="text-primary d-inline me-3">
                            <i class="fas fa-truck-loading"></i> Despacho y Salidas de Material
                        </h4>
                        <span class="badge bg-primary fs-6">Gestión de Stock Neto</span>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Columna Izquierda: Stock Neto Disponible en Planta -->
                <div class="col-md-5">
                    <div class="card border-info shadow-sm mb-4">
                        <div class="card-header bg-info text-dark fw-bold">
                            <i class="fas fa-cubes"></i> Stock Neto Disponible en Planta
                        </div>
                        <div class="card-body p-0" id="contenedor-tabla-stock-disponible">
                            <div class="text-center p-4">
                                <div class="spinner-border text-info"></div>
                                <p class="mt-2 text-muted">Consultando balanza de stock...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha: Formulario de Registro de Despacho -->
                <div class="col-md-7">
                    <div class="card border-primary shadow-sm mb-4">
                        <div class="card-header bg-primary text-white fw-bold">
                            <i class="fas fa-file-export"></i> Formulario de Registrar Salida
                        </div>
                        <div class="card-body" id="contenedor-formulario-salida">
                            <div class="alert alert-info text-center m-2">
                                <i class="fas fa-hand-point-left"></i> Seleccione un material del stock o elija del combo para iniciar el despacho.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-3 fade-in">
                <div class="col-12">
                    <h5 class="text-secondary border-bottom pb-2">
                        <i class="fas fa-history"></i> Historial de Salidas / Despachos Realizados
                    </h5>
                    <div id="contenedor-tabla-historial-salidas">
                        <div class="text-center my-3">
                            <div class="spinner-border text-secondary"></div>
                            <p class="mt-2 text-muted">Cargando historial de egresos...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        contenedor.html(htmlEstructura);
        enlazarEventos();

        // Cargar vistas iniciales
        obtenerStockNetoDisponible();
        obtenerHistorialSalidas();
    };

    // 2. ENLACE SEGURO DE EVENTOS (Delegación en contenedor común)
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-trazabilidad');

        // Evento al presionar botón "Despachar" desde la tabla de stock
        principal.off('click', '.btn-seleccionar-stock').on('click', '.btn-seleccionar-stock', function () {
            let boton = $(this);
            estado.idSubtipoSeleccionado = parseInt(boton.data('idsubtipo'));
            estado.stockMaximoPermitido = parseFloat(boton.data('stock'));

            renderizarFormularioSalida();
            $('#select-subtipo-salida').val(estado.idSubtipoSeleccionado).trigger('change');
        });

        // Evento al cambiar de material en el combo desplegable
        principal.off('change', '#select-subtipo-salida').on('change', function () {
            const idSel = parseInt($(this).val());
            const itemEncontrado = estado.stockDisponible.find(x => x.IdSubtipo === idSel);

            if (itemEncontrado) {
                estado.idSubtipoSeleccionado = itemEncontrado.IdSubtipo;
                estado.stockMaximoPermitido = itemEncontrado.StockDisponibleKg;
                $('#lbl-stock-maximo-info').text(`Stock disponible: ${estado.stockMaximoPermitido.toFixed(2)} Kg`);
                $('#input-peso-retirado').attr('max', estado.stockMaximoPermitido);
            } else {
                $('#lbl-stock-maximo-info').text('Seleccione un material');
                $('#input-peso-retirado').removeAttr('max');
            }
        });

        // Submit del formulario de Registro de Salida
        principal.off('submit', '#form-registrar-salida').on('submit', registrarSalida);

        // Evento para anular un movimiento de salida
        principal.off('click', '.btn-anular-salida').on('click', function () {
            let idSalida = $(this).data('id');
            confirmarAnulacionSalida(idSalida);
        });
    };

    // 3. CONSULTA Y RENDERIZADO DE STOCK NETO DISPONIBLE
    const obtenerStockNetoDisponible = function () {
        $.ajax({
            type: "GET",
            url: `${URL_MOVIMIENTO_SALIDA}/StockNeto`,
            success: function (data) {
                estado.stockDisponible = data || [];
                renderizarTablaStock(data);
                renderizarFormularioSalida(); // Renderiza o actualiza combos
            },
            error: function (err) {
                console.error("Error al obtener stock neto:", err);
                $('#contenedor-tabla-stock-disponible').html(
                    '<div class="alert alert-danger m-2">Error al consultar el stock disponible en planta.</div>'
                );
            }
        });
    };

    const renderizarTablaStock = function (listaStock) {
        const contenedor = $('#contenedor-tabla-stock-disponible');

        if (!listaStock || listaStock.length === 0) {
            contenedor.html(
                '<div class="alert alert-warning text-center m-3"><i class="fas fa-exclamation-triangle"></i> No hay stock disponible cargado.</div>'
            );
            return;
        }

        let htmlTabla = `
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Categoría</th>
                            <th>Subtipo</th>
                            <th class="text-end">Disponible</th>
                            <th class="text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        listaStock.forEach(item => {
            const tieneStock = item.StockDisponibleKg > 0;
            htmlTabla += `
                <tr>
                    <td><span class="badge bg-secondary">${item.Categoria}</span></td>
                    <td class="fw-bold">${item.SubtipoMaterial}</td>
                    <td class="text-end fw-bold ${tieneStock ? 'text-success' : 'text-danger'}">
                        ${item.StockDisponibleKg.toFixed(2)} kg
                    </td>
                    <td class="text-center">
                        ${tieneStock ? `
                            <button type="button" class="btn btn-sm btn-outline-primary btn-seleccionar-stock"
                                    data-idsubtipo="${item.IdSubtipo}"
                                    data-stock="${item.StockDisponibleKg}">
                                <i class="fas fa-shipping-fast"></i> Despachar
                            </button>
                        ` : `
                            <span class="badge bg-light text-muted border">Sin Stock</span>
                        `}
                    </td>
                </tr>
            `;
        });

        htmlTabla += `</tbody></table></div>`;
        contenedor.html(htmlTabla);
    };

    // 4. RENDERING DEL FORMULARIO DE SALIDA
    const renderizarFormularioSalida = function () {
        const contenedor = $('#contenedor-formulario-salida');

        // Seteo de fecha y hora local para el input
        const ahora = new Date();
        ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
        const fechaParaInput = ahora.toISOString().slice(0, 16);

        let htmlForm = `
            <form id="form-registrar-salida" class="fade-in">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Tipo de Movimiento *</label>
                        <select id="select-tipo-movimiento" class="form-select" required>
                            <option value="Egreso">Egreso (Venta / Disposición)</option>
                            <option value="Retiro">Retiro de Cliente</option>
                            <option value="Producción">Consumo Interno / Producción</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Fecha y Hora de Salida *</label>
                        <input type="datetime-local" id="input-fecha-salida" class="form-control" value="${fechaParaInput}" required>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Material A Despachar *</label>
                        <select id="select-subtipo-salida" class="form-select" required>
                            <option value="">Seleccione Material</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold text-primary">Peso a Retirar (Kg) *</label>
                        <div class="input-group">
                            <input type="number" step="0.01" min="0.01" id="input-peso-retirado" class="form-control border-primary fw-bold" placeholder="0.00" required>
                            <span class="input-group-text bg-primary text-white">Kg</span>
                        </div>
                        <small id="lbl-stock-maximo-info" class="text-muted fw-bold">Seleccione un material</small>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Empleado Responsable / Chofer *</label>
                        <select id="select-empleado-salida" class="form-select" required>
                            <option value="">Cargando empleados...</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Observaciones / Destino Final</label>
                        <input type="text" id="input-observaciones-salida" class="form-control" placeholder="Ej: Remito N° 4521 - Planta Reciclaje X">
                    </div>
                </div>

                <div class="text-end mt-3">
                    <button type="submit" class="btn btn-primary btn-lg">
                        <i class="fas fa-save"></i> Registrar Despacho
                    </button>
                </div>
            </form>
        `;

        contenedor.html(htmlForm);

        // Cargar combos
        poblarComboSubtipos();
        cargarComboEmpleados();
    };

    const poblarComboSubtipos = function () {
        let select = $("#select-subtipo-salida");
        select.empty().append('<option value="">Seleccione Material</option>');

        // Filtrar solo los materiales que tienen stock > 0
        const conStock = estado.stockDisponible.filter(x => x.StockDisponibleKg > 0);

        conStock.forEach(item => {
            select.append(`<option value="${item.IdSubtipo}">${item.SubtipoMaterial} (${item.StockDisponibleKg.toFixed(2)} Kg)</option>`);
        });

        if (estado.idSubtipoSeleccionado) {
            select.val(estado.idSubtipoSeleccionado).trigger('change');
        }
    };

    const cargarComboEmpleados = function () {
        $.ajax({
            type: "GET",
            url: `${URL_EMPLEADO}/ListarChoferes`, // Reutilizamos el endpoint existente de personal
            success: function (data) {
                let select = $("#select-empleado-salida");
                select.empty().append('<option value="">Seleccione Responsable</option>');
                data.forEach(item => {
                    select.append(`<option value="${item.Id}">${item.Nombre} ${item.Apellido}</option>`);
                });
            },
            error: function () {
                // Fallback si la API de empleados difiere en ruta
                let select = $("#select-empleado-salida");
                select.empty().append('<option value="1">Empleado General / Operador</option>');
            }
        });
    };

    // 5. POST A LA API (REGISTRAR MOVIMIENTO DE SALIDA)
    const registrarSalida = function (e) {
        e.preventDefault();

        const idSubtipo = parseInt($("#select-subtipo-salida").val());
        const pesoRetirado = parseFloat($("#input-peso-retirado").val());
        const idEmpleado = parseInt($("#select-empleado-salida").val());
        const fechaSalida = $("#input-fecha-salida").val();

        if (!idSubtipo) {
            Swal.fire('Atención', 'Debe seleccionar un material del stock.', 'warning');
            return;
        }

        if (isNaN(pesoRetirado) || pesoRetirado <= 0) {
            Swal.fire('Atención', 'El Peso a retirar debe ser mayor a 0 kg.', 'warning');
            return;
        }

        if (pesoRetirado > estado.stockMaximoPermitido) {
            Swal.fire('Exceso de Stock', `El peso a retirar (${pesoRetirado} kg) supera el stock disponible actual (${estado.stockMaximoPermitido.toFixed(2)} kg).`, 'error');
            return;
        }

        if (!idEmpleado) {
            Swal.fire('Atención', 'Debe especificar el empleado responsable del despacho.', 'warning');
            return;
        }

        const movimientoObj = {
            "TipoMovimiento": $("#select-tipo-movimiento").val(),
            "FechaMovimiento": fechaSalida,
            "Id_SubTipo_Material": idSubtipo,
            "PesoRetirado": pesoRetirado,
            "Id_Empleado": idEmpleado,
            "Observaciones": $("#input-observaciones-salida").val().trim() || null
        };

        console.log("SITMAS - Enviando solicitud de movimiento de salida:", movimientoObj);

        $.ajax({
            type: "POST",
            url: URL_MOVIMIENTO_SALIDA,
            data: JSON.stringify(movimientoObj),
            contentType: "application/json; charset=utf-8",
            success: function (response) {
                Swal.fire({
                    title: '¡Despacho Registrado!',
                    text: 'El movimiento de salida se procesó y el stock fue actualizado correctamente.',
                    icon: 'success',
                    timer: 1800,
                    showConfirmButton: false
                });

                // Reset de estado y actualización de grillas
                estado.idSubtipoSeleccionado = null;
                estado.stockMaximoPermitido = 0;

                obtenerStockNetoDisponible();
                obtenerHistorialSalidas();
            },
            error: function (err) {
                console.error("Error registrando salida:", err);
                let mensajeError = err.responseText ? err.responseText.replace(/"/g, '') : 'Hubo un error al procesar el despacho.';
                Swal.fire('Error del Sistema', mensajeError, 'error');
            }
        });
    };

    // 6. HISTORIAL DE MOVIMIENTOS DE SALIDA
    const obtenerHistorialSalidas = function () {
        $.ajax({
            type: "GET",
            url: `${URL_MOVIMIENTO_SALIDA}/ListarTodo`,
            success: function (data) {
                renderizarTablaHistorial(data);
            },
            error: function (err) {
                console.error("Error al obtener historial de salidas:", err);
            }
        });
    };

    const renderizarTablaHistorial = function (listaSalidas) {
        const contenedor = $('#contenedor-tabla-historial-salidas');

        if (!listaSalidas || listaSalidas.length === 0) {
            contenedor.html('<div class="alert alert-light text-center border mt-2">No se registran movimientos de salida en el sistema.</div>');
            return;
        }

        // Limitamos a los últimos 10 registros
        const ultimosDiez = listaSalidas.slice(0, 10);

        let htmlTabla = `
            <div class="table-responsive shadow-sm mt-2 fade-in">
                <table class="table table-sm table-striped table-bordered mb-0 align-middle">
                    <thead class="table-dark">
                        <tr>
                            <th class="text-center">N° Salida</th>
                            <th>Tipo</th>
                            <th>Fecha</th>
                            <th>Material</th>
                            <th class="text-end">Peso Retirado</th>
                            <th>Responsable</th>
                            <th>Observaciones</th>
                            <th class="text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        ultimosDiez.forEach(item => {
            const esProcesado = item.EstadoSalida === 'Procesado';
            const fechaFmt = new Date(item.FechaMovimiento).toLocaleString('es-AR');

            htmlTabla += `
                <tr class="${!esProcesado ? 'table-danger text-muted' : ''}">
                    <td class="text-center fw-bold text-secondary">#${item.IdSalida}</td>
                    <td><span class="badge bg-info text-dark">${item.TipoMovimiento}</span></td>
                    <td class="small">${fechaFmt}</td>
                    <td class="fw-bold">${item.NombreSubtipo || 'Material'}</td>
                    <td class="fw-bold text-end text-primary">${item.PesoRetirado.toFixed(2)} kg</td>
                    <td class="small">${item.EmpleadoResponsable || 'Sin Especificar'}</td>
                    <td class="small text-muted">${item.Observaciones || '-'}</td>
                    <td class="text-center">
                        ${esProcesado ? `
                            <button type="button" class="btn btn-sm btn-outline-danger btn-anular-salida" data-id="${item.IdSalida}">
                                <i class="fas fa-trash"></i> Anular
                            </button>
                        ` : `
                            <span class="badge bg-secondary">Anulado</span>
                        `}
                    </td>
                </tr>
            `;
        });

        htmlTabla += `</tbody></table></div>`;
        contenedor.html(htmlTabla);
    };

    // 7. ANULACIÓN LÓGICA DE SALIDA
    const confirmarAnulacionSalida = function (idSalida) {
        Swal.fire({
            title: '¿Anular Movimiento de Salida?',
            text: 'El despacho pasará a estado Anulado y los kilogramos serán devueltos al stock disponible.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, anular y devolver stock',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: "DELETE",
                    url: `${URL_MOVIMIENTO_SALIDA}/${idSalida}`,
                    success: function (mensaje) {
                        Swal.fire('Anulado', mensaje || 'El movimiento fue anulado exitosamente.', 'success');
                        obtenerStockNetoDisponible();
                        obtenerHistorialSalidas();
                    },
                    error: function (err) {
                        let msg = err.responseText ? err.responseText.replace(/"/g, '') : 'No se pudo anular la salida.';
                        Swal.fire('Error', msg, 'error');
                    }
                });
            }
        });
    };

    // Public API del módulo
    return {
        cargarEn: inicializar
    };
})();