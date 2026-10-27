/* ========================================================================
   SITMAS - Sala de Control: Módulo CRUD Salida / Egreso de Materiales
   Archivo: crud_salida_trazabilidad.js
   Arquitectura: Module Pattern (IIFE) + jQuery + SweetAlert2 + Buscador de Empleados
   ======================================================================== */

const CrudSalidaModulo = (function () {
    // 🔒 ESTADO PRIVADO DEL MÓDULO
    let estado = {
        salidas: [],
        subtipos: [],
        empleados: [],
        salidaEnEdicion: null,
        filtroTexto: ''
    };

    // Endpoints exactos de la Web API (.NET)
    const URL_SALIDA_BASE = "https://localhost:44325/api/MovimientoSalida";
    const URL_SALIDA_LISTAR = "https://localhost:44325/api/MovimientoSalida/ListarTodo";
    const URL_SUBTIPO_MATERIAL = "https://localhost:44325/api/SbTp_Material";
    const URL_EMPLEADO = "https://localhost:44325/api/Empleado";

    // 🕒 Helper: Formatea fechas ISO a formato local es-AR (DD/MM/YYYY HH:mm)
    const formatearFechaHora = function (fechaIso) {
        if (!fechaIso) return '---';
        const fecha = new Date(fechaIso);
        return fecha.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ⚖️ Helper: Formatea números a kilogramos (ej: 1.850,00 kg)
    const formatearKg = function (valor) {
        if (valor === null || valor === undefined || isNaN(valor)) return '0.00 kg';
        return `${parseFloat(valor).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
    };

    // 1. INICIALIZACIÓN DEL MÓDULO
    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <div class="row fade-in">
                <div class="col-12 d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h5 class="text-primary fw-bold mb-0">
                            <i class="fas fa-truck-loading"></i> Auditoría de Movimientos de Salida y Egreso
                        </h5>
                        <small class="text-muted">Consulta, corrección de subtipos/pesos retirados y responsables de egreso</small>
                    </div>
                    <div class="d-flex gap-2">
                        <input type="text" id="input-buscar-salida" class="form-control form-control-sm" placeholder="Buscar por ID, Tipo, Subtipo, Responsable..." style="width: 280px;">
                        <button id="btn-refrescar-salida" class="btn btn-outline-primary btn-sm" title="Actualizar grilla">
                            <i class="fas fa-sync-alt"></i> Refrescar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabla Principal de Auditoría -->
            <div class="row fade-in">
                <div class="col-12">
                    <div id="contenedor-tabla-crud-salida">
                        <div class="text-center p-5">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-2 text-muted">Cargando historial de salidas de stock...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Bootstrap de Edición de Salida -->
            <div class="modal fade" id="modalEditarSalida" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="fas fa-edit"></i> Corregir Movimiento de Salida #<span id="modal-id-salida-titulo"></span></h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="body-modal-editar-salida">
                            <!-- Se renderiza dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        contenedor.html(htmlEstructura);
        enlazarEventos();
        cargarCatalogosYDatos();
    };

    // 2. ENLACE SEGURO DE EVENTOS
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-crud-trazabilidad');

        // Búsqueda en tiempo real en la grilla principal
        principal.off('keyup', '#input-buscar-salida').on('keyup', '#input-buscar-salida', function () {
            estado.filtroTexto = $(this).val().toLowerCase().trim();
            renderizarTablaSalidas();
        });

        // Botón Refrescar
        principal.off('click', '#btn-refrescar-salida').on('click', '#btn-refrescar-salida', function () {
            cargarCatalogosYDatos();
        });

        // Evento Botón Editar
        principal.off('click', '.btn-editar-salida').on('click', '.btn-editar-salida', function () {
            const idSalida = parseInt($(this).data('id'));
            prepararEdicion(idSalida);
        });

        // Evento Botón Anular
        principal.off('click', '.btn-anular-salida').on('click', '.btn-anular-salida', function () {
            const idSalida = parseInt($(this).data('id'));
            confirmarAnulacion(idSalida);
        });

        // 🔍 Filtro en tiempo real para el selector de Empleados DENTRO del Modal
        $(document).off('keyup', '#input-buscar-empleado-modal').on('keyup', '#input-buscar-empleado-modal', function () {
            const busqueda = $(this).val().toLowerCase().trim();
            filtrarComboEmpleadosModal(busqueda);
        });

        // Submit del Formulario dentro del Modal
        $(document).off('submit', '#form-editar-salida').on('submit', '#form-editar-salida', guardarEdicion);
    };

    // 3. CARGA DE CATÁLOGOS Y REGISTROS
    const cargarCatalogosYDatos = function () {
        const reqSubtipos = $.ajax({ type: "GET", url: URL_SUBTIPO_MATERIAL }).catch(() => []);
        const reqEmpleados = $.ajax({ type: "GET", url: URL_EMPLEADO }).catch(() => []);
        const reqSalidas = $.ajax({ type: "GET", url: URL_SALIDA_LISTAR });

        $.when(reqSubtipos, reqEmpleados, reqSalidas)
            .done(function (resSubtipos, resEmpleados, resSalidas) {
                estado.subtipos = resSubtipos[0] || [];
                estado.empleados = resEmpleados[0] || [];
                estado.salidas = resSalidas[0] || [];

                renderizarTablaSalidas();
            })
            .fail(function (err) {
                console.error("Error al cargar datos de movimientos de salida:", err);
                obtenerSalidasSolo();
            });
    };

    const obtenerSalidasSolo = function () {
        $.ajax({
            type: "GET",
            url: URL_SALIDA_LISTAR,
            success: function (data) {
                estado.salidas = data || [];
                renderizarTablaSalidas();
            },
            error: function () {
                $('#contenedor-tabla-crud-salida').html(`
                    <div class="alert alert-danger text-center m-3">
                        <i class="fas fa-exclamation-triangle"></i> Error al consultar los movimientos de salida desde el servidor.
                    </div>
                `);
            }
        });
    };

    // 4. RENDERIZADO DE LA TABLA
    const renderizarTablaSalidas = function () {
        const contenedor = $('#contenedor-tabla-crud-salida');

        let listaFiltrada = estado.salidas;
        if (estado.filtroTexto !== '') {
            listaFiltrada = estado.salidas.filter(s => {
                const idSalStr = (s.IdSalida || '').toString();
                const tipoStr = (s.TipoMovimiento || '').toLowerCase();
                const subtipoStr = (s.NombreSubtipo || '').toLowerCase();
                const respStr = (s.EmpleadoResponsable || '').toLowerCase();
                const obsStr = (s.Observaciones || '').toLowerCase();
                const estadoStr = (s.EstadoSalida || '').toLowerCase();

                return idSalStr.includes(estado.filtroTexto) ||
                       tipoStr.includes(estado.filtroTexto) ||
                       subtipoStr.includes(estado.filtroTexto) ||
                       respStr.includes(estado.filtroTexto) ||
                       obsStr.includes(estado.filtroTexto) ||
                       estadoStr.includes(estado.filtroTexto);
            });
        }

        if (!listaFiltrada || listaFiltrada.length === 0) {
            contenedor.html(`
                <div class="alert alert-light text-center border my-3 p-4">
                    <i class="fas fa-search fa-2x text-muted mb-2"></i>
                    <p class="mb-0 text-muted">No se encontraron movimientos de salida que coincidan con la búsqueda.</p>
                </div>
            `);
            return;
        }

        let htmlTabla = `
            <div class="table-responsive shadow-sm rounded border">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-dark">
                        <tr>
                            <th class="text-center"># Movimiento</th>
                            <th>Tipo Movimiento</th>
                            <th>Fecha/Hora Egreso</th>
                            <th>Subtipo de Material</th>
                            <th class="text-end text-primary">Peso Retirado</th>
                            <th>Responsable (Empleado)</th>
                            <th>Observaciones</th>
                            <th>Estado</th>
                            <th class="text-center" style="width: 120px;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        listaFiltrada.forEach(item => {
            const idSal = item.IdSalida;
            const estadoStr = item.EstadoSalida || 'Procesado';
            const esActivo = estadoStr !== 'Anulado' && estadoStr !== 'Inactivo';

            const tipoMov = item.TipoMovimiento || 'Egreso';
            const subtipoNombre = item.NombreSubtipo || 'Sin Especificar';
            const peso = item.PesoRetirado || 0;
            const responsable = item.EmpleadoResponsable || 'Sin Especificar';

            const badgeEstado = esActivo 
                ? `<span class="badge bg-success"><i class="fas fa-check-circle"></i> ${estadoStr}</span>`
                : `<span class="badge bg-danger"><i class="fas fa-times-circle"></i> ${estadoStr}</span>`;

            htmlTabla += `
                <tr class="${!esActivo ? 'table-danger text-muted' : ''}">
                    <td class="text-center fw-bold text-primary">#${idSal}</td>
                    <td>
                        <span class="badge bg-outline-info text-dark border me-1"><i class="fas fa-exchange-alt me-1"></i>${tipoMov}</span>
                    </td>
                    <td class="small">${formatearFechaHora(item.FechaMovimiento)}</td>
                    <td>
                        <span class="badge bg-success me-1"><i class="fas fa-tags"></i></span>
                        <strong class="text-dark">${subtipoNombre}</strong>
                    </td>
                    <td class="text-end fw-bold text-primary">${formatearKg(peso)}</td>
                    <td class="small">
                        <i class="fas fa-id-card me-1 text-primary"></i><strong>${responsable}</strong>
                    </td>
                    <td class="small text-truncate" style="max-width: 180px;">${item.Observaciones || 'Sin observaciones'}</td>
                    <td>${badgeEstado}</td>
                    <td class="text-center">
                        ${esActivo ? `
                            <button class="btn btn-sm btn-outline-primary btn-editar-salida" data-id="${idSal}" title="Editar movimiento">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-anular-salida" data-id="${idSal}" title="Anular movimiento">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        ` : `
                            <small class="text-muted">Inactivo</small>
                        `}
                    </td>
                </tr>
            `;
        });

        htmlTabla += `</tbody></table></div>`;
        contenedor.html(htmlTabla);
    };

    // 5. PREPARAR MODAL DE EDICIÓN CON BUSCADOR INTEGRADODE EMPLEADOS
    const prepararEdicion = function (idSalida) {
        const item = estado.salidas.find(x => x.IdSalida === idSalida);
        if (!item) return;

        estado.salidaEnEdicion = item;
        $('#modal-id-salida-titulo').text(item.IdSalida);

        let fechaParaInput = '';
        if (item.FechaMovimiento) {
            const d = new Date(item.FechaMovimiento);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            fechaParaInput = d.toISOString().slice(0, 16);
        }

        let htmlFormModal = `
            <form id="form-editar-salida">
                <input type="hidden" id="edit-id-salida" value="${item.IdSalida}">

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Tipo de Movimiento *</label>
                        <select id="edit-tipo-movimiento" class="form-select" required>
                            <option value="Retiro" ${item.TipoMovimiento === 'Retiro' ? 'selected' : ''}>Retiro</option>
                            <option value="Producción" ${item.TipoMovimiento === 'Producción' ? 'selected' : ''}>Producción</option>
                            <option value="Egreso" ${item.TipoMovimiento === 'Egreso' ? 'selected' : ''}>Egreso</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Fecha y Hora de Salida *</label>
                        <input type="datetime-local" id="edit-fecha-movimiento" class="form-control" value="${fechaParaInput}">
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Subtipo de Material *</label>
                        <select id="edit-id-subtipo-material" class="form-select" required>
                            <option value="">Seleccione Subtipo</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold text-primary">Peso Retirado (Kg) *</label>
                        <input type="number" step="0.01" min="0.01" id="edit-peso-retirado" class="form-control fw-bold border-primary" value="${item.PesoRetirado}" required>
                    </div>
                </div>

                <!-- 🔍 BUSCADOR Y SELECTOR DINÁMICO DE EMPLEADOS -->
                <div class="row">
                    <div class="col-md-12 mb-3">
                        <label class="form-label fw-bold"><i class="fas fa-user-search text-primary"></i> Empleado Responsable del Retiro *</label>
                        <div class="input-group mb-1">
                            <span class="input-group-text bg-light"><i class="fas fa-search"></i></span>
                            <input type="text" id="input-buscar-empleado-modal" class="form-control" placeholder="Escriba Nombre o Apellido para filtrar el listado...">
                        </div>
                        <select id="edit-id-empleado" class="form-select" size="4" required style="height: 110px;">
                            <option value="">Seleccione Empleado Responsable</option>
                        </select>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-bold">Observaciones / Motivo de Corrección</label>
                    <textarea id="edit-observaciones-salida" class="form-control" rows="2" placeholder="Motivo de la corrección del movimiento...">${item.Observaciones || ''}</textarea>
                </div>

                <div class="text-end border-top pt-3">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar Cambios</button>
                </div>
            </form>
        `;

        $('#body-modal-editar-salida').html(htmlFormModal);

        // Poblar combos
        poblarComboSubtiposModal(item.Id_SubTipo_Material);
        poblarComboEmpleadosModal(item.Id_Empleado);

        const modalEl = document.getElementById('modalEditarSalida');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    };

    const poblarComboSubtiposModal = function (idSeleccionado) {
        let select = $("#edit-id-subtipo-material");
        select.empty().append('<option value="">Seleccione Subtipo de Material</option>');

        if (estado.subtipos && estado.subtipos.length > 0) {
            estado.subtipos.forEach(s => {
                const idS = s.IdSubtipoM || s.Id;
                const nombreS = s.Subtipo || s.NombreSubtipo;
                const selected = idS === idSeleccionado ? 'selected' : '';
                select.append(`<option value="${idS}" ${selected}>${nombreS}</option>`);
            });
        }
    };

    const poblarComboEmpleadosModal = function (idSeleccionado, filtroTexto = '') {
        let select = $("#edit-id-empleado");
        select.empty();

        if (!estado.empleados || estado.empleados.length === 0) {
            select.append('<option value="">No hay empleados registrados</option>');
            return;
        }

        let empleadosFiltrados = estado.empleados;
        if (filtroTexto !== '') {
            empleadosFiltrados = estado.empleados.filter(e => {
                const nomCompleto = `${e.Nombre || ''} ${e.Apellido || ''}`.toLowerCase();
                const legajo = (e.Legajo || e.Id || '').toString();
                return nomCompleto.includes(filtroTexto) || legajo.includes(filtroTexto);
            });
        }

        if (empleadosFiltrados.length === 0) {
            select.append('<option value="">Sin coincidencias en la búsqueda...</option>');
            return;
        }

        empleadosFiltrados.forEach(e => {
            const idE = e.Id || e.IdEmpleado;
            const nomE = `${e.Nombre || ''} ${e.Apellido || ''}`.trim() || `Empleado #${idE}`;
            const selected = idE === idSeleccionado ? 'selected' : '';
            select.append(`<option value="${idE}" ${selected}>👤 ${nomE}</option>`);
        });
    };

    const filtrarComboEmpleadosModal = function (textoBusqueda) {
        const idActual = parseInt($('#edit-id-empleado').val()) || (estado.salidaEnEdicion ? estado.salidaEnEdicion.Id_Empleado : null);
        poblarComboEmpleadosModal(idActual, textoBusqueda);
    };

    // 6. GUARDAR EDICIÓN (PUT)
    const guardarEdicion = function (e) {
        e.preventDefault();

        const idSalida = parseInt($('#edit-id-salida').val());
        const pesoVal = parseFloat($('#edit-peso-retirado').val());
        const idSubtipoVal = parseInt($('#edit-id-subtipo-material').val());
        const idEmpleadoVal = parseInt($('#edit-id-empleado').val());
        const fechaVal = $('#edit-fecha-movimiento').val();

        if (!idEmpleadoVal || isNaN(idEmpleadoVal)) {
            Swal.fire('Atención', 'Debe seleccionar un empleado responsable del retiro.', 'warning');
            return;
        }

        const dtoModificacion = {
            "IdSalida": idSalida,
            "TipoMovimiento": $('#edit-tipo-movimiento').val(),
            "FechaMovimiento": fechaVal ? fechaVal : null,
            "Id_SubTipo_Material": idSubtipoVal,
            "PesoRetirado": pesoVal,
            "Id_Empleado": idEmpleadoVal,
            "Observaciones": $('#edit-observaciones-salida').val().trim() || null
        };

        $.ajax({
            type: "PUT",
            url: `${URL_SALIDA_BASE}/${idSalida}`,
            data: JSON.stringify(dtoModificacion),
            contentType: "application/json; charset=utf-8",
            success: function (res) {
                const modalEl = document.getElementById('modalEditarSalida');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                Swal.fire({
                    title: '¡Movimiento Actualizado!',
                    text: typeof res === 'string' ? res : `El movimiento de salida #${idSalida} fue modificado exitosamente.`,
                    icon: 'success',
                    timer: 1800,
                    showConfirmButton: false
                });

                cargarCatalogosYDatos();
            },
            error: function (err) {
                console.error("Error al actualizar movimiento de salida:", err);
                let msg = err.responseText ? err.responseText.replace(/"/g, '') : 'Error al guardar la modificación.';
                Swal.fire('Error de Corrección', msg, 'error');
            }
        });
    };

    // 7. ANULACIÓN LÓGICA (DELETE)
    const confirmarAnulacion = function (idSalida) {
        Swal.fire({
            title: `¿Anular Movimiento #${idSalida}?`,
            text: 'El movimiento pasará a estado Anulado y el stock será restituido automáticamente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, anular movimiento',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: "DELETE",
                    url: `${URL_SALIDA_BASE}/${idSalida}`,
                    success: function (res) {
                        const msg = typeof res === 'string' ? res : 'El movimiento fue anulado exitosamente.';
                        Swal.fire('Anulado', msg, 'success');
                        cargarCatalogosYDatos();
                    },
                    error: function (err) {
                        let msg = err.responseText ? err.responseText.replace(/"/g, '') : 'No se pudo anular el movimiento.';
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