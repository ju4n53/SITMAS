/* ========================================================================
   SITMAS - Sala de Control: Módulo CRUD Clasificación de Materiales
   Archivo: crud_clasificacion_trazabilidad.js
   Arquitectura: Module Pattern (IIFE) + jQuery + SweetAlert2
   ======================================================================== */

const CrudClasificacionModulo = (function () {
    // 🔒 ESTADO PRIVADO DEL MÓDULO
    let estado = {
        clasificaciones: [],
        subtipos: [],
        clasificacionEnEdicion: null,
        filtroTexto: ''
    };

    // Endpoints exactos de la Web API (.NET)
    const URL_CLASIFICACION_BASE = "https://localhost:44325/api/MaterialClasificado";
    const URL_CLASIFICACION_VISTA = "https://localhost:44325/api/MaterialClasificado/ListarVista";
    const URL_SUBTIPO_MATERIAL = "https://localhost:44325/api/SbTp_Material";

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

    // ⚖️ Helper: Formatea números a kilogramos (ej: 450,00 kg)
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
                            <i class="fas fa-recycle"></i> Auditoría de Clasificación y Fraccionamiento
                        </h5>
                        <small class="text-muted">Consulta, corrección de subtipos/pesos útiles y anulación de registros</small>
                    </div>
                    <div class="d-flex gap-2">
                        <input type="text" id="input-buscar-clasificacion" class="form-control form-control-sm" placeholder="Buscar por ID, Detalle, Subtipo..." style="width: 280px;">
                        <button id="btn-refrescar-clasificacion" class="btn btn-outline-primary btn-sm" title="Actualizar grilla">
                            <i class="fas fa-sync-alt"></i> Refrescar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabla Principal de Auditoría -->
            <div class="row fade-in">
                <div class="col-12">
                    <div id="contenedor-tabla-crud-clasificacion">
                        <div class="text-center p-5">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-2 text-muted">Cargando vistas de clasificación de stock...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Bootstrap de Edición de Clasificación -->
            <div class="modal fade" id="modalEditarClasificacion" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="fas fa-edit"></i> Corregir Clasificación #<span id="modal-id-clasificacion-titulo"></span></h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="body-modal-editar-clasificacion">
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
        principal.off('keyup', '#input-buscar-clasificacion').on('keyup', '#input-buscar-clasificacion', function () {
            estado.filtroTexto = $(this).val().toLowerCase().trim();
            renderizarTablaClasificaciones();
        });

        // Botón Refrescar
        principal.off('click', '#btn-refrescar-clasificacion').on('click', '#btn-refrescar-clasificacion', function () {
            cargarCatalogosYDatos();
        });

        // Evento Botón Editar
        principal.off('click', '.btn-editar-clasificacion').on('click', '.btn-editar-clasificacion', function () {
            const idClasificacion = parseInt($(this).data('id'));
            prepararEdicion(idClasificacion);
        });

        // Evento Botón Anular
        principal.off('click', '.btn-anular-clasificacion').on('click', '.btn-anular-clasificacion', function () {
            const idClasificacion = parseInt($(this).data('id'));
            confirmarAnulacion(idClasificacion);
        });

        // Submit del Formulario dentro del Modal
        $(document).off('submit', '#form-editar-clasificacion').on('submit', '#form-editar-clasificacion', guardarEdicion);
    };

    // 3. CARGA DE CATÁLOGOS Y VISTA
    const cargarCatalogosYDatos = function () {
        const reqSubtipos = $.ajax({ type: "GET", url: URL_SUBTIPO_MATERIAL });
        const reqClasificacionVista = $.ajax({ type: "GET", url: URL_CLASIFICACION_VISTA });

        $.when(reqSubtipos, reqClasificacionVista)
            .done(function (resSubtipos, resVista) {
                estado.subtipos = resSubtipos[0] || [];
                estado.clasificaciones = resVista[0] || [];

                renderizarTablaClasificaciones();
            })
            .fail(function (err) {
                console.error("Error al cargar datos de clasificación:", err);
                obtenerVistaSolo();
            });
    };

    const obtenerVistaSolo = function () {
        $.ajax({
            type: "GET",
            url: URL_CLASIFICACION_VISTA,
            success: function (data) {
                estado.clasificaciones = data || [];
                renderizarTablaClasificaciones();
            },
            error: function () {
                $('#contenedor-tabla-crud-clasificacion').html(`
                    <div class="alert alert-danger text-center m-3">
                        <i class="fas fa-exclamation-triangle"></i> Error al consultar el historial de clasificaciones desde el servidor.
                    </div>
                `);
            }
        });
    };

    // 4. RENDERIZADO DE LA TABLA
    const renderizarTablaClasificaciones = function () {
        const contenedor = $('#contenedor-tabla-crud-clasificacion');

        // Filtro de búsqueda
        let listaFiltrada = estado.clasificaciones;
        if (estado.filtroTexto !== '') {
            listaFiltrada = estado.clasificaciones.filter(c => {
                const idClasStr = (c.Id || '').toString();
                const idDetStr = (c.Id_Detalle_Ingreso || '').toString();
                const subtipoStr = (c.SubtipoMaterial || '').toLowerCase();
                const destinoStr = (c.Destino || '').toLowerCase();
                const estadoMatStr = (c.EstadoMaterial || '').toLowerCase();

                return idClasStr.includes(estado.filtroTexto) ||
                       idDetStr.includes(estado.filtroTexto) ||
                       subtipoStr.includes(estado.filtroTexto) ||
                       destinoStr.includes(estado.filtroTexto) ||
                       estadoMatStr.includes(estado.filtroTexto);
            });
        }

        if (!listaFiltrada || listaFiltrada.length === 0) {
            contenedor.html(`
                <div class="alert alert-light text-center border my-3 p-4">
                    <i class="fas fa-search fa-2x text-muted mb-2"></i>
                    <p class="mb-0 text-muted">No se encontraron registros de clasificación que coincidan con la búsqueda.</p>
                </div>
            `);
            return;
        }

        let htmlTabla = `
            <div class="table-responsive shadow-sm rounded border">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-dark">
                        <tr>
                            <th class="text-center"># Reg.</th>
                            <th class="text-center"># Detalle Báscula</th>
                            <th>Fecha/Hora Clasificación</th>
                            <th>Subtipo Material</th>
                            <th>Destino / Estado Mat.</th>
                            <th class="text-end text-primary">Peso Útil</th>
                            <th>Usuario / Estado</th>
                            <th class="text-center" style="width: 120px;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        listaFiltrada.forEach(item => {
            const idClas = item.Id;
            const idDet = item.Id_Detalle_Ingreso || '---';
            const estadoRegistro = item.EstadoMtCl || 'Procesado';
            const esActivo = estadoRegistro !== 'Anulado' && estadoRegistro !== 'Inactivo';

            const subtipoNombre = item.SubtipoMaterial || 'Sin Especificar';
            const destinoTexto = item.Destino || 'Sin Destino';
            const estadoMaterialTexto = item.EstadoMaterial || 'N/A';
            const peso = item.PesoUtil || 0;

            const badgeEstado = esActivo 
                ? `<span class="badge bg-success"><i class="fas fa-check-circle"></i> ${estadoRegistro}</span>`
                : `<span class="badge bg-danger"><i class="fas fa-times-circle"></i> ${estadoRegistro}</span>`;

            htmlTabla += `
                <tr class="${!esActivo ? 'table-danger text-muted' : ''}">
                    <td class="text-center fw-bold text-primary">#${idClas}</td>
                    <td class="text-center"><span class="badge bg-outline-dark border text-dark">Detalle #${idDet}</span></td>
                    <td class="small">${formatearFechaHora(item.FechaClasificacion)}</td>
                    <td>
                        <span class="badge bg-success me-1"><i class="fas fa-tags"></i></span>
                        <strong class="text-dark">${subtipoNombre}</strong>
                    </td>
                    <td class="small">
                        <div><i class="fas fa-map-marker-alt text-secondary me-1"></i>${destinoTexto}</div>
                        <small class="text-muted"><i class="fas fa-info-circle me-1"></i>${estadoMaterialTexto}</small>
                    </td>
                    <td class="text-end fw-bold text-primary">${formatearKg(peso)}</td>
                    <td class="small">
                        <div><i class="fas fa-user-check me-1 text-muted"></i>${item.UsuarioClasificador || 'Op. Anónimo'}</div>
                        <div>${badgeEstado}</div>
                    </td>
                    <td class="text-center">
                        ${esActivo ? `
                            <button class="btn btn-sm btn-outline-primary btn-editar-clasificacion" data-id="${idClas}" title="Editar clasificación">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-anular-clasificacion" data-id="${idClas}" title="Anular clasificación">
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

    // 5. PREPARAR MODAL DE EDICIÓN
    const prepararEdicion = function (idClasificacion) {
        const item = estado.clasificaciones.find(x => x.Id === idClasificacion);
        if (!item) return;

        estado.clasificacionEnEdicion = item;
        $('#modal-id-clasificacion-titulo').text(item.Id);

        let fechaParaInput = '';
        if (item.FechaClasificacion) {
            const d = new Date(item.FechaClasificacion);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            fechaParaInput = d.toISOString().slice(0, 16);
        }

        let htmlFormModal = `
            <form id="form-editar-clasificacion">
                <input type="hidden" id="edit-id-clasificacion" value="${item.Id}">
                <input type="hidden" id="edit-id-detalle-ingreso" value="${item.Id_Detalle_Ingreso}">
                <input type="hidden" id="edit-id-estado-material" value="${item.Id_Estado_Material || 1}">
                <input type="hidden" id="edit-id-destino" value="${item.Id_Destino || 1}">
                <input type="hidden" id="edit-id-usuario" value="${item.Id_Usuario_Clasificador || 1}">

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Fecha y Hora de Clasificación *</label>
                        <input type="datetime-local" id="edit-fecha-clasificacion" class="form-control" value="${fechaParaInput}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold text-primary">Peso Útil Clasificado (Kg) *</label>
                        <input type="number" step="0.01" min="0" id="edit-peso-util" class="form-control fw-bold border-primary" value="${item.PesoUtil}" required>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-12 mb-3">
                        <label class="form-label fw-bold">Subtipo de Material *</label>
                        <select id="edit-id-subtipo-material" class="form-select" required>
                            <option value="">Seleccione Subtipo de Material</option>
                        </select>
                    </div>
                </div>

                <div class="text-end border-top pt-3">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar Cambios</button>
                </div>
            </form>
        `;

        $('#body-modal-editar-clasificacion').html(htmlFormModal);
        poblarComboSubtiposModal(item.Id_SubTipo_Material);

        const modalEl = document.getElementById('modalEditarClasificacion');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    };

    const poblarComboSubtiposModal = function (idSeleccionado) {
        let select = $("#edit-id-subtipo-material");
        select.empty().append('<option value="">Seleccione Subtipo de Material</option>');

        if (estado.subtipos && estado.subtipos.length > 0) {
            estado.subtipos.forEach(s => {
                const idS = s.IdSubtipoM;
                const nombreS = s.Subtipo;
                const selected = idS === idSeleccionado ? 'selected' : '';
                select.append(`<option value="${idS}" ${selected}>${nombreS}</option>`);
            });
        }
    };

    // 6. GUARDAR EDICIÓN (PUT)
    const guardarEdicion = function (e) {
        e.preventDefault();

        const idClasificacion = parseInt($('#edit-id-clasificacion').val());
        const pesoVal = parseFloat($('#edit-peso-util').val());
        const idSubtipoVal = parseInt($('#edit-id-subtipo-material').val());
        const fechaVal = $('#edit-fecha-clasificacion').val();

        // 🟢 DTO perfectamente alineado con Material_Clasificado.cs
        const dtoModificacion = {
            "Id": idClasificacion,
            "Id_Detalle_Ingreso": parseInt($('#edit-id-detalle-ingreso').val()),
            "Id_SubTipo_Material": idSubtipoVal > 0 ? idSubtipoVal : null,
            "PesoUtil": pesoVal,
            "FechaClasificacion": fechaVal ? fechaVal : null,
            "Id_Estado_Material": parseInt($('#edit-id-estado-material').val()) || 1,
            "Id_Destino": parseInt($('#edit-id-destino').val()) || 1,
            "Id_Usuario_Clasificador": parseInt($('#edit-id-usuario').val()) || 1
        };

        $.ajax({
            type: "PUT",
            url: `${URL_CLASIFICACION_BASE}/${idClasificacion}`,
            data: JSON.stringify(dtoModificacion),
            contentType: "application/json; charset=utf-8",
            success: function () {
                const modalEl = document.getElementById('modalEditarClasificacion');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                Swal.fire({
                    title: '¡Clasificación Actualizada!',
                    text: `El registro de fraccionamiento #${idClasificacion} se modificó con éxito.`,
                    icon: 'success',
                    timer: 1800,
                    showConfirmButton: false
                });

                cargarCatalogosYDatos();
            },
            error: function (err) {
                console.error("Error al actualizar clasificación:", err);
                let msg = err.responseText ? err.responseText.replace(/"/g, '') : 'Error al guardar la modificación.';
                Swal.fire('Error de Corrección', msg, 'error');
            }
        });
    };

    // 7. ANULACIÓN LÓGICA (DELETE)
    const confirmarAnulacion = function (idClasificacion) {
        Swal.fire({
            title: `¿Anular Clasificación #${idClasificacion}?`,
            text: 'El registro de fraccionamiento de stock pasará a estado Anulado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, anular registro',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: "DELETE",
                    url: `${URL_CLASIFICACION_BASE}/${idClasificacion}`,
                    success: function (res) {
                        const msg = (res && res.mensaje) ? res.mensaje : 'La clasificación fue anulada exitosamente.';
                        Swal.fire('Anulado', msg, 'success');
                        cargarCatalogosYDatos();
                    },
                    error: function (err) {
                        let msg = err.responseText ? err.responseText.replace(/"/g, '') : 'No se pudo anular el registro.';
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