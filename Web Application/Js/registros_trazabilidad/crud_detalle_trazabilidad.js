/* ========================================================================
   SITMAS - Sala de Control: Módulo CRUD Detalle / Pesajes de Báscula
   Archivo: crud_detalle_trazabilidad.js
   Arquitectura: Module Pattern (IIFE) + jQuery + SweetAlert2
   ======================================================================== */

const CrudDetalleModulo = (function () {
    // 🔒 ESTADO PRIVADO DEL MÓDULO (Diccionarios en memoria)
    let estado = {
        detalles: [],
        origenes: [],
        tiposMaterial: [],
        detalleEnEdicion: null,
        filtroTexto: ''
    };

    // Endpoints de la Web API (.NET)
    const URL_DETALLE_INGRESO = "https://localhost:44325/api/DetalleIngreso";
    const URL_ORIGEN = "https://localhost:44325/api/origen";
    const URL_TIPO_MATERIAL = "https://localhost:44325/api/TP_Material";

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

    // ⚖️ Helper: Formatea números a kilogramos (ej: 1.250,50 kg)
    const formatearKg = function (valor) {
        if (valor === null || valor === undefined || isNaN(valor)) return '0.00 kg';
        return `${parseFloat(valor).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
    };

    // 🔍 Helpers de Traducción (IDs ➔ Nombres legibles)
    const obtenerNombreOrigen = function (idOrigen) {
        if (!idOrigen) return 'Sin Origen';
        const item = estado.origenes.find(x => x.IdOrigen === idOrigen);
        return item ? item.EmpresaInstitucion : `Origen #${idOrigen}`;
    };

    const obtenerNombreTipoMaterial = function (idTipoMaterial) {
        if (!idTipoMaterial) return 'Sin Especificar';
        const item = estado.tiposMaterial.find(x => x.IdTipoMaterial === idTipoMaterial);
        return item ? item.TipoMaterial : `Material #${idTipoMaterial}`;
    };

    // 1. INICIALIZACIÓN DEL MÓDULO
    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <div class="row fade-in">
                <div class="col-12 d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h5 class="text-primary fw-bold mb-0">
                            <i class="fas fa-balance-scale"></i> Auditoría de Pesajes en Báscula (Detalle)
                        </h5>
                        <small class="text-muted">Consulta, corrección de kilajes y anulación de registros de pesada</small>
                    </div>
                    <div class="d-flex gap-2">
                        <input type="text" id="input-buscar-detalle" class="form-control form-control-sm" placeholder="Buscar por ID, Origen, Material..." style="width: 280px;">
                        <button id="btn-refrescar-detalles" class="btn btn-outline-primary btn-sm" title="Actualizar grilla">
                            <i class="fas fa-sync-alt"></i> Refrescar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabla Principal de Auditoría -->
            <div class="row fade-in">
                <div class="col-12">
                    <div id="contenedor-tabla-crud-detalle">
                        <div class="text-center p-5">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-2 text-muted">Cargando catálogos y pesajes de báscula...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Bootstrap de Edición de Pesada -->
            <div class="modal fade" id="modalEditarDetalle" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="fas fa-edit"></i> Corregir Pesaje Báscula #<span id="modal-id-detalle-titulo"></span></h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="body-modal-editar-detalle">
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

        // Búsqueda en tiempo real
        principal.off('keyup', '#input-buscar-detalle').on('keyup', '#input-buscar-detalle', function () {
            estado.filtroTexto = $(this).val().toLowerCase().trim();
            renderizarTablaDetalles();
        });

        // Botón Refrescar
        principal.off('click', '#btn-refrescar-detalles').on('click', '#btn-refrescar-detalles', function () {
            cargarCatalogosYDatos();
        });

        // Evento Botón Editar
        principal.off('click', '.btn-editar-detalle').on('click', '.btn-editar-detalle', function () {
            const idDetalle = parseInt($(this).data('id'));
            prepararEdicion(idDetalle);
        });

        // Evento Botón Anular
        principal.off('click', '.btn-anular-detalle').on('click', '.btn-anular-detalle', function () {
            const idDetalle = parseInt($(this).data('id'));
            confirmarAnulacion(idDetalle);
        });

        // Submit del Formulario dentro del Modal
        $(document).off('submit', '#form-editar-detalle').on('submit', '#form-editar-detalle', guardarEdicion);
    };

    // 3. CARGA CONCURRENTE DE CATÁLOGOS Y DATOS
    const cargarCatalogosYDatos = function () {
        const reqOrigen = $.ajax({ type: "GET", url: URL_ORIGEN });
        const reqTipoMat = $.ajax({ type: "GET", url: URL_TIPO_MATERIAL });
        const reqDetalles = $.ajax({ type: "GET", url: URL_DETALLE_INGRESO });

        $.when(reqOrigen, reqTipoMat, reqDetalles)
            .done(function (resOrigen, resTipoMat, resDetalles) {
                estado.origenes = resOrigen[0] || [];
                estado.tiposMaterial = resTipoMat[0] || [];
                estado.detalles = resDetalles[0] || [];

                renderizarTablaDetalles();
            })
            .fail(function (err) {
                console.error("Error al cargar datos de báscula o catálogos:", err);
                obtenerDetallesSolo();
            });
    };

    const obtenerDetallesSolo = function () {
        $.ajax({
            type: "GET",
            url: URL_DETALLE_INGRESO,
            success: function (data) {
                estado.detalles = data || [];
                renderizarTablaDetalles();
            },
            error: function () {
                $('#contenedor-tabla-crud-detalle').html(`
                    <div class="alert alert-danger text-center m-3">
                        <i class="fas fa-exclamation-triangle"></i> No se pudo cargar el historial de báscula desde el servidor.
                    </div>
                `);
            }
        });
    };

    // 4. RENDERIZADO DE LA TABLA
    const renderizarTablaDetalles = function () {
        const contenedor = $('#contenedor-tabla-crud-detalle');

        // Filtro de búsqueda enriquecido
        let listaFiltrada = estado.detalles;
        if (estado.filtroTexto !== '') {
            listaFiltrada = estado.detalles.filter(d => {
                const idDetStr = (d.IdDetalleIngreso || '').toString();
                const idIngStr = (d.Id_Ingreso_Material || '').toString();
                const nombreOrigen = obtenerNombreOrigen(d.Id_Origen).toLowerCase();
                const nombreMaterial = obtenerNombreTipoMaterial(d.Id_Tipo_Material).toLowerCase();
                const obs = (d.Observaciones || '').toLowerCase();

                return idDetStr.includes(estado.filtroTexto) ||
                       idIngStr.includes(estado.filtroTexto) ||
                       nombreOrigen.includes(estado.filtroTexto) ||
                       nombreMaterial.includes(estado.filtroTexto) ||
                       obs.includes(estado.filtroTexto);
            });
        }

        if (!listaFiltrada || listaFiltrada.length === 0) {
            contenedor.html(`
                <div class="alert alert-light text-center border my-3 p-4">
                    <i class="fas fa-search fa-2x text-muted mb-2"></i>
                    <p class="mb-0 text-muted">No se encontraron registros de pesaje que coincidan con la búsqueda.</p>
                </div>
            `);
            return;
        }

        let htmlTabla = `
            <div class="table-responsive shadow-sm rounded border">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-dark">
                        <tr>
                            <th class="text-center"># Detalle</th>
                            <th class="text-center"># Ingreso</th>
                            <th>Fecha/Hora Pesada</th>
                            <th>Empresa / Origen</th>
                            <th>Tipo Material</th>
                            <th class="text-end text-primary">Peso Bruto</th>
                            <th>Observaciones</th>
                            <th>Estado</th>
                            <th class="text-center" style="width: 120px;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        listaFiltrada.forEach(item => {
            const idDet = item.IdDetalleIngreso;
            const idIng = item.Id_Ingreso_Material || '---';
            const estadoStr = item.EstadoDtIng || 'Procesado';
            const esActivo = estadoStr !== 'Anulado' && estadoStr !== 'Inactivo';

            const origenTexto = obtenerNombreOrigen(item.Id_Origen);
            const materialTexto = obtenerNombreTipoMaterial(item.Id_Tipo_Material);

            const badgeEstado = esActivo 
                ? `<span class="badge bg-success"><i class="fas fa-check-circle"></i> ${estadoStr}</span>`
                : `<span class="badge bg-danger"><i class="fas fa-times-circle"></i> ${estadoStr}</span>`;

            htmlTabla += `
                <tr class="${!esActivo ? 'table-danger text-muted' : ''}">
                    <td class="text-center fw-bold text-primary">#${idDet}</td>
                    <td class="text-center"><span class="badge bg-outline-dark border text-dark">Ingreso #${idIng}</span></td>
                    <td class="small">${formatearFechaHora(item.fechaDetalleIng)}</td>
                    <td>
                        <i class="fas fa-building text-secondary me-1"></i>
                        <strong>${origenTexto}</strong>
                    </td>
                    <td>
                        <span class="badge bg-info text-dark me-1"><i class="fas fa-boxes"></i></span>
                        <span>${materialTexto}</span>
                    </td>
                    <td class="text-end fw-bold text-primary">${formatearKg(item.PesoBruto)}</td>
                    <td class="small text-truncate" style="max-width: 180px;">${item.Observaciones || 'Sin observaciones'}</td>
                    <td>${badgeEstado}</td>
                    <td class="text-center">
                        ${esActivo ? `
                            <button class="btn btn-sm btn-outline-primary btn-editar-detalle" data-id="${idDet}" title="Editar pesaje">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-anular-detalle" data-id="${idDet}" title="Anular pesaje">
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

    // 5. PREPARAR MODAL DE EDICIÓN CON DESPLEGABLES
    const prepararEdicion = function (idDetalle) {
        const item = estado.detalles.find(x => x.IdDetalleIngreso === idDetalle);
        if (!item) return;

        estado.detalleEnEdicion = item;
        $('#modal-id-detalle-titulo').text(item.IdDetalleIngreso);

        let fechaParaInput = '';
        if (item.fechaDetalleIng) {
            const d = new Date(item.fechaDetalleIng);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            fechaParaInput = d.toISOString().slice(0, 16);
        }

        let htmlFormModal = `
            <form id="form-editar-detalle">
                <input type="hidden" id="edit-id-detalle" value="${item.IdDetalleIngreso}">
                <input type="hidden" id="edit-id-ingreso-mat" value="${item.Id_Ingreso_Material}">
                <input type="hidden" id="edit-id-hdr-det" value="${item.Id_Detalle_HDR || ''}">

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Fecha y Hora de Pesada *</label>
                        <input type="datetime-local" id="edit-fecha-detalle" class="form-control" value="${fechaParaInput}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold text-primary">Peso Bruto Registrado (Kg) *</label>
                        <input type="number" step="0.01" min="0" id="edit-peso-bruto" class="form-control fw-bold border-primary" value="${item.PesoBruto}" required>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Empresa / Origen *</label>
                        <select id="edit-id-origen" class="form-select" required>
                            <option value="">Seleccione Origen</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Tipo de Material *</label>
                        <select id="edit-id-tipo-material" class="form-select" required>
                            <option value="">Seleccione Tipo Material</option>
                        </select>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-bold">Observaciones / Motivo de Corrección</label>
                    <textarea id="edit-observaciones-detalle" class="form-control" rows="2" placeholder="Motivo de la corrección del pesaje...">${item.Observaciones || ''}</textarea>
                </div>

                <div class="text-end border-top pt-3">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar Cambios</button>
                </div>
            </form>
        `;

        $('#body-modal-editar-detalle').html(htmlFormModal);

        // Llenar combos
        poblarComboOrigenModal(item.Id_Origen);
        poblarComboTipoMaterialModal(item.Id_Tipo_Material);

        // Mostrar Modal Bootstrap 5
        const modalEl = document.getElementById('modalEditarDetalle');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    };

    const poblarComboOrigenModal = function (idSeleccionado) {
        let select = $("#edit-id-origen");
        select.empty().append('<option value="">Seleccione Origen</option>');

        estado.origenes.forEach(o => {
            const selected = o.IdOrigen === idSeleccionado ? 'selected' : '';
            select.append(`<option value="${o.IdOrigen}" ${selected}>${o.EmpresaInstitucion}</option>`);
        });
    };

    const poblarComboTipoMaterialModal = function (idSeleccionado) {
        let select = $("#edit-id-tipo-material");
        select.empty().append('<option value="">Seleccione Tipo Material</option>');

        estado.tiposMaterial.forEach(tm => {
            const selected = tm.IdTipoMaterial === idSeleccionado ? 'selected' : '';
            select.append(`<option value="${tm.IdTipoMaterial}" ${selected}>${tm.TipoMaterial}</option>`);
        });
    };

    // 6. GUARDAR EDICIÓN (PUT)
    const guardarEdicion = function (e) {
        e.preventDefault();

        const idDetalle = parseInt($('#edit-id-detalle').val());
        const bruto = parseFloat($('#edit-peso-bruto').val());
        const idHdrDetVal = $('#edit-id-hdr-det').val();
        const fechaVal = $('#edit-fecha-detalle').val();

        const dtoModificacion = {
            "IdDetalleIngreso": idDetalle,
            "Id_Ingreso_Material": parseInt($('#edit-id-ingreso-mat').val()),
            "Id_Tipo_Material": parseInt($('#edit-id-tipo-material').val()),
            "Id_Detalle_HDR": idHdrDetVal ? parseInt(idHdrDetVal) : null,
            "PesoBruto": bruto,
            "Observaciones": $('#edit-observaciones-detalle').val().trim() || null,
            "Id_Origen": parseInt($('#edit-id-origen').val()),
            "fechaDetalleIng": fechaVal ? fechaVal : null
        };

        $.ajax({
            type: "PUT",
            url: `${URL_DETALLE_INGRESO}/${idDetalle}`,
            data: JSON.stringify(dtoModificacion),
            contentType: "application/json; charset=utf-8",
            success: function () {
                const modalEl = document.getElementById('modalEditarDetalle');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                Swal.fire({
                    title: '¡Pesaje Actualizado!',
                    text: `El registro de báscula #${idDetalle} se modificó correctamente.`,
                    icon: 'success',
                    timer: 1800,
                    showConfirmButton: false
                });

                cargarCatalogosYDatos();
            },
            error: function (err) {
                console.error("Error al actualizar detalle de báscula:", err);
                let msg = err.responseText ? err.responseText.replace(/"/g, '') : 'Error al guardar la modificación.';
                Swal.fire('Error de Corrección', msg, 'error');
            }
        });
    };

    // 7. ANULACIÓN LÓGICA (DELETE)
    const confirmarAnulacion = function (idDetalle) {
        Swal.fire({
            title: `¿Anular Pesaje #${idDetalle}?`,
            text: 'El registro de báscula pasará a estado Anulado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, anular pesaje',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: "DELETE",
                    url: `${URL_DETALLE_INGRESO}/${idDetalle}`,
                    success: function (mensaje) {
                        Swal.fire('Anulado', mensaje || 'El pesaje fue anulado exitosamente.', 'success');
                        cargarCatalogosYDatos();
                    },
                    error: function (err) {
                        let msg = err.responseText ? err.responseText.replace(/"/g, '') : 'No se pudo anular el pesaje.';
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