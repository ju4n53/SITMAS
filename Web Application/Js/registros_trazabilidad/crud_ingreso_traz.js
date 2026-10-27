/* ========================================================================
   SITMAS - Sala de Control: Módulo CRUD Ingreso de Materiales
   Archivo: crud_ingreso_traz.js
   Arquitectura: Module Pattern (IIFE) + jQuery + SweetAlert2
   ======================================================================== */

const CrudIngresoModulo = (function () {
    // 🔒 ESTADO PRIVADO DEL MÓDULO (Diccionarios en memoria)
    let estado = {
        ingresos: [],
        choferes: [],
        vehiculos: [],
        ingresoEnEdicion: null,
        filtroTexto: ''
    };

    // Endpoints de la Web API (.NET Core)
    const URL_INGRESO_MATERIAL = "https://localhost:44325/api/IngresoMaterial";
    const URL_VEHICULO = "https://localhost:44325/api/Vehiculo";
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

    // 🔍 Helpers para traducir Claves Foráneas (IDs) a Nombres / Patentes legibles
    const obtenerNombreChofer = function (idChofer) {
        if (!idChofer) return 'Sin Especificar';
        const chofer = estado.choferes.find(x => (x.Id || x.IdEmpleado) === idChofer);
        return chofer ? `${chofer.Nombre} ${chofer.Apellido}` : `Chofer #${idChofer}`;
    };

    const obtenerPatenteVehiculo = function (idVehiculo) {
        if (!idVehiculo) return 'Sin Vehículo';
        const vehiculo = estado.vehiculos.find(x => (x.Id || x.IdVehiculo) === idVehiculo);
        return vehiculo ? (vehiculo.Patente || vehiculo.PatenteChasis) : `Vehículo #${idVehiculo}`;
    };

    // 1. INICIALIZACIÓN DEL MÓDULO
    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <div class="row fade-in">
                <div class="col-12 d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h5 class="text-primary fw-bold mb-0">
                            <i class="fas fa-truck"></i> Auditoría de Ingresos a Planta
                        </h5>
                        <small class="text-muted">Consulta, corrección de datos y anulación de ingresos generales</small>
                    </div>
                    <div class="d-flex gap-2">
                        <input type="text" id="input-buscar-ingreso" class="form-control form-control-sm" placeholder="Buscar por ID, Patente, Chofer..." style="width: 280px;">
                        <button id="btn-refrescar-ingresos" class="btn btn-outline-primary btn-sm" title="Actualizar grilla">
                            <i class="fas fa-sync-alt"></i> Refrescar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabla Principal de Auditoría -->
            <div class="row fade-in">
                <div class="col-12">
                    <div id="contenedor-tabla-crud-ingreso">
                        <div class="text-center p-5">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-2 text-muted">Cargando datos y catálogos de auditoría...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Bootstrap de Edición de Ingreso -->
            <div class="modal fade" id="modalEditarIngreso" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="fas fa-edit"></i> Corregir Ingreso #<span id="modal-id-ingreso-titulo"></span></h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="body-modal-editar-ingreso">
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

        // Filtro de búsqueda en tiempo real
        principal.off('keyup', '#input-buscar-ingreso').on('keyup', '#input-buscar-ingreso', function () {
            estado.filtroTexto = $(this).val().toLowerCase().trim();
            renderizarTablaIngresos();
        });

        // Botón Refrescar
        principal.off('click', '#btn-refrescar-ingresos').on('click', '#btn-refrescar-ingresos', function () {
            cargarCatalogosYDatos();
        });

        // Evento Botón Editar
        principal.off('click', '.btn-editar-ingreso').on('click', '.btn-editar-ingreso', function () {
            const idIngreso = parseInt($(this).data('id'));
            prepararEdicion(idIngreso);
        });

        // Evento Botón Anular
        principal.off('click', '.btn-anular-ingreso').on('click', '.btn-anular-ingreso', function () {
            const idIngreso = parseInt($(this).data('id'));
            confirmarAnulacion(idIngreso);
        });

        // Submit del formulario de edición dentro del modal
        $(document).off('submit', '#form-editar-ingreso').on('submit', '#form-editar-ingreso', guardarEdicion);
    };

    // 3. CARGA CONCURRENTE DE CATÁLOGOS Y DATOS (Promesas en paralelo)
    const cargarCatalogosYDatos = function () {
        const reqVehiculos = $.ajax({ type: "GET", url: `${URL_VEHICULO}/ListarTodo` });
        const reqChoferes = $.ajax({ type: "GET", url: `${URL_EMPLEADO}/ListarChoferes` });
        const reqIngresos = $.ajax({ type: "GET", url: URL_INGRESO_MATERIAL });

        // $.when ejecuta todas las consultas al mismo tiempo
        $.when(reqVehiculos, reqChoferes, reqIngresos)
            .done(function (resVehiculos, resChoferes, resIngresos) {
                estado.vehiculos = resVehiculos[0] || [];
                estado.choferes = resChoferes[0] || [];
                estado.ingresos = resIngresos[0] || [];

                renderizarTablaIngresos();
            })
            .fail(function (err) {
                console.error("Error al cargar datos o catálogos:", err);
                // Si falla la carga combinada, intentamos cargar solo ingresos como respaldo
                obtenerIngresosSolo();
            });
    };

    const obtenerIngresosSolo = function () {
        $.ajax({
            type: "GET",
            url: URL_INGRESO_MATERIAL,
            success: function (data) {
                estado.ingresos = data || [];
                renderizarTablaIngresos();
            },
            error: function () {
                $('#contenedor-tabla-crud-ingreso').html(`
                    <div class="alert alert-danger text-center m-3">
                        <i class="fas fa-exclamation-triangle"></i> Error al consultar el servidor. Verifique la conexión con la API.
                    </div>
                `);
            }
        });
    };

    // 4. RENDERIZADO DE LA TABLA
    const renderizarTablaIngresos = function () {
        const contenedor = $('#contenedor-tabla-crud-ingreso');

        // Aplicar filtro de búsqueda enriquecido
        let listaFiltrada = estado.ingresos;
        if (estado.filtroTexto !== '') {
            listaFiltrada = estado.ingresos.filter(i => {
                const idStr = (i.IdIngresoM || '').toString();
                const estadoStr = (i.EstadoIng || '').toLowerCase();
                const patente = obtenerPatenteVehiculo(i.Id_Vehiculo_Ingreso).toLowerCase();
                const chofer = obtenerNombreChofer(i.Id_Camionero_Ingreso).toLowerCase();
                const hdr = (i.Id_HojaRuta || '').toString();

                return idStr.includes(estado.filtroTexto) ||
                       estadoStr.includes(estado.filtroTexto) ||
                       patente.includes(estado.filtroTexto) ||
                       chofer.includes(estado.filtroTexto) ||
                       hdr.includes(estado.filtroTexto);
            });
        }

        if (!listaFiltrada || listaFiltrada.length === 0) {
            contenedor.html(`
                <div class="alert alert-light text-center border my-3 p-4">
                    <i class="fas fa-search fa-2x text-muted mb-2"></i>
                    <p class="mb-0 text-muted">No se encontraron registros de ingreso que coincidan con la búsqueda.</p>
                </div>
            `);
            return;
        }

        let htmlTabla = `
            <div class="table-responsive shadow-sm rounded border">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-dark">
                        <tr>
                            <th class="text-center"># Ingreso</th>
                            <th>Fecha/Hora Ingreso</th>
                            <th>Vehículo / Patente</th>
                            <th>Chofer / Transportista</th>
                            <th class="text-center">Hoja Ruta</th>
                            <th>Estado</th>
                            <th class="text-center" style="width: 120px;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        listaFiltrada.forEach(item => {
            const id = item.IdIngresoM;
            const esActivo = item.EstadoIng !== 'Anulado' && item.EstadoIng !== 'Inactivo';
            const badgeEstado = esActivo 
                ? `<span class="badge bg-success"><i class="fas fa-check-circle"></i> ${item.EstadoIng || 'Procesado'}</span>`
                : `<span class="badge bg-danger"><i class="fas fa-times-circle"></i> ${item.EstadoIng || 'Anulado'}</span>`;

            const patenteMostrar = obtenerPatenteVehiculo(item.Id_Vehiculo_Ingreso);
            const choferMostrar = obtenerNombreChofer(item.Id_Camionero_Ingreso);

            htmlTabla += `
                <tr class="${!esActivo ? 'table-danger text-muted' : ''}">
                    <td class="text-center fw-bold text-primary">#${id}</td>
                    <td class="small">${formatearFechaHora(item.FechaIngreso)}</td>
                    <td>
                        <span class="badge bg-secondary me-1"><i class="fas fa-truck"></i></span>
                        <strong class="text-dark">${patenteMostrar}</strong>
                    </td>
                    <td>
                        <i class="fas fa-user-id-badge text-secondary me-1"></i>
                        <span>${choferMostrar}</span>
                    </td>
                    <td class="text-center">
                        ${item.Id_HojaRuta ? `<span class="badge bg-info text-dark">HDR #${item.Id_HojaRuta}</span>` : '<span class="text-muted">Directo</span>'}
                    </td>
                    <td>${badgeEstado}</td>
                    <td class="text-center">
                        ${esActivo ? `
                            <button class="btn btn-sm btn-outline-primary btn-editar-ingreso" data-id="${id}" title="Editar registro">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-anular-ingreso" data-id="${id}" title="Anular ingreso">
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

    // 5. PREPARAR MODAL DE EDICIÓN CON DESPLEGABLES LLENOS
    const prepararEdicion = function (idIngreso) {
        const item = estado.ingresos.find(x => x.IdIngresoM === idIngreso);
        if (!item) return;

        estado.ingresoEnEdicion = item;
        $('#modal-id-ingreso-titulo').text(item.IdIngresoM);

        let fechaParaInput = '';
        if (item.FechaIngreso) {
            const d = new Date(item.FechaIngreso);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            fechaParaInput = d.toISOString().slice(0, 16);
        }

        let htmlFormModal = `
            <form id="form-editar-ingreso">
                <input type="hidden" id="edit-id-ingreso" value="${item.IdIngresoM}">
                <input type="hidden" id="edit-id-usuario" value="${item.Id_Usuario_Registro || 1}">
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Fecha y Hora de Ingreso *</label>
                        <input type="datetime-local" id="edit-fecha-ingreso" class="form-control" value="${fechaParaInput}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">N° Hoja de Ruta</label>
                        <input type="number" id="edit-id-hoja-ruta" class="form-control" value="${item.Id_HojaRuta || ''}" disabled>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Chofer / Transportista *</label>
                        <select id="edit-id-camionero" class="form-select" required>
                            <option value="">Seleccione Chofer</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Vehículo / Patente *</label>
                        <select id="edit-id-vehiculo" class="form-select" required>
                            <option value="">Seleccione Vehículo</option>
                        </select>
                    </div>
                </div>

                <div class="text-end border-top pt-3">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar Cambios</button>
                </div>
            </form>
        `;

        $('#body-modal-editar-ingreso').html(htmlFormModal);

        // Poblar combos del modal
        poblarComboChoferesModal(item.Id_Camionero_Ingreso);
        poblarComboVehiculosModal(item.Id_Vehiculo_Ingreso);

        // Mostrar Modal Bootstrap 5
        const modalEl = document.getElementById('modalEditarIngreso');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    };

    const poblarComboChoferesModal = function (idSeleccionado) {
        let select = $("#edit-id-camionero");
        select.empty().append('<option value="">Seleccione Chofer</option>');

        estado.choferes.forEach(c => {
            const idC = c.Id || c.IdEmpleado;
            const selected = idC === idSeleccionado ? 'selected' : '';
            select.append(`<option value="${idC}" ${selected}>${c.Nombre} ${c.Apellido}</option>`);
        });
    };

    const poblarComboVehiculosModal = function (idSeleccionado) {
        let select = $("#edit-id-vehiculo");
        select.empty().append('<option value="">Seleccione Vehículo</option>');

        estado.vehiculos.forEach(v => {
            const idV = v.Id || v.IdVehiculo;
            const pat = v.Patente || v.PatenteChasis;
            const selected = idV === idSeleccionado ? 'selected' : '';
            select.append(`<option value="${idV}" ${selected}>${pat}</option>`);
        });
    };

    // 6. GUARDAR EDICIÓN (PUT)
    const guardarEdicion = function (e) {
        e.preventDefault();

        const idIngreso = parseInt($('#edit-id-ingreso').val());
        const idHojaRutaVal = $('#edit-id-hoja-ruta').val();

        const dtoModificacion = {
            "IdIngresoM": idIngreso,
            "FechaIngreso": $('#edit-fecha-ingreso').val(),
            "Id_Usuario_Registro": parseInt($('#edit-id-usuario').val()) || 1,
            "Id_Camionero_Ingreso": parseInt($('#edit-id-camionero').val()),
            "Id_Vehiculo_Ingreso": parseInt($('#edit-id-vehiculo').val()),
            "Id_HojaRuta": idHojaRutaVal ? parseInt(idHojaRutaVal) : null
        };

        $.ajax({
            type: "PUT",
            url: `${URL_INGRESO_MATERIAL}/${idIngreso}`,
            data: JSON.stringify(dtoModificacion),
            contentType: "application/json; charset=utf-8",
            success: function () {
                const modalEl = document.getElementById('modalEditarIngreso');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                Swal.fire({
                    title: '¡Ingreso Actualizado!',
                    text: `El Ingreso #${idIngreso} se modificó correctamente.`,
                    icon: 'success',
                    timer: 1800,
                    showConfirmButton: false
                });

                cargarCatalogosYDatos();
            },
            error: function (err) {
                console.error("Error al actualizar ingreso:", err);
                let msg = err.responseText ? err.responseText.replace(/"/g, '') : 'Error al guardar la modificación.';
                Swal.fire('Error de Corrección', msg, 'error');
            }
        });
    };

    // 7. ANULACIÓN LÓGICA (DELETE)
    const confirmarAnulacion = function (idIngreso) {
        Swal.fire({
            title: `¿Anular Ingreso #${idIngreso}?`,
            text: 'El registro pasará a estado Anulado en la base de datos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, anular registro',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: "DELETE",
                    url: `${URL_INGRESO_MATERIAL}/${idIngreso}`,
                    success: function (mensaje) {
                        Swal.fire('Anulado', mensaje || 'El ingreso fue anulado exitosamente.', 'success');
                        cargarCatalogosYDatos();
                    },
                    error: function (err) {
                        let msg = err.responseText ? err.responseText.replace(/"/g, '') : 'No se pudo anular el ingreso.';
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