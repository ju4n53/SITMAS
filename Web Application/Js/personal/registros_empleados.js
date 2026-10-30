/* ========================================================================
   SITMAS - Módulo de Personal: Padrón, Buscador Interactivo y Edición
   Arquitectura: Module Pattern (IIFE) + jQuery + Bootstrap 5 + SweetAlert2
   ======================================================================== */

const RegistrosEmpleadosModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        listaLaborales: [],
        listaPersonales: [],
        catAreas: [],
        catCargos: [],
        catBarrios: [],
        catTiposVinculacion: [],
        editandoId: 0,
        idLegajoExistente: 0,
        modalPersonal: null,
        modalLaboral: null
    };

    const URL_EMPLEADO = "https://localhost:44325/api/Empleado";
    const URL_AREA = "https://localhost:44325/api/Area";
    const URL_CARGO = "https://localhost:44325/api/Cargo";
    const URL_BARRIO = "https://localhost:44325/api/Barrio";
    const URL_TP_VINCULACION = "https://localhost:44325/api/TpVinculacion";
    const URL_LEGAJO = "https://localhost:44325/api/Legajo";

    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <div class="d-flex justify-content-between align-items-center mb-4 fade-in">
                <div>
                    <h4 class="text-primary m-0 fw-bold"><i class="fas fa-users"></i> Listado General de Empleados</h4>
                    <small class="text-muted">Búsqueda rápida, actualización de legajos y bajas del personal</small>
                </div>
            </div>

            <!-- BÚSQUEDA INTERACTIVA -->
            <div class="card shadow-sm border-0 mb-4 fade-in">
                <div class="card-body bg-light rounded">
                    <div class="input-group">
                        <span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-primary"></i></span>
                        <input type="text" class="form-control border-start-0 ps-0" id="input-buscar-emp" placeholder="Buscar por Apellido, Nombre, CUIL o Cargo...">
                    </div>
                </div>
            </div>

            <!-- TABS PARA LISTADOS -->
            <ul class="nav nav-pills mb-3 fade-in" role="tablist">
                <li class="nav-item"><button class="nav-link active fw-bold" data-bs-toggle="pill" data-bs-target="#tab-lab" type="button"><i class="fas fa-briefcase me-1"></i> Datos Laborales</button></li>
                <li class="nav-item"><button class="nav-link fw-bold" data-bs-toggle="pill" data-bs-target="#tab-per" type="button"><i class="fas fa-address-card me-1"></i> Datos Personales</button></li>
            </ul>

            <div class="tab-content border-top pt-3 fade-in">
                <div class="tab-pane fade show active" id="tab-lab">
                    <div id="grid-laborales" class="table-responsive shadow-sm rounded"></div>
                </div>
                <div class="tab-pane fade" id="tab-per">
                    <div id="grid-personales" class="table-responsive shadow-sm rounded"></div>
                </div>
            </div>
        `;

        htmlEstructura += generarHTMLModalesEdicion();
        contenedor.html(htmlEstructura);

        estado.modalPersonal = new bootstrap.Modal(document.getElementById('modalEditPer'), { backdrop: 'static' });
        estado.modalLaboral = new bootstrap.Modal(document.getElementById('modalEditLab'), { backdrop: 'static' });

        enlazarEventos();
        cargarDatosMasivos();
    };

    const generarHTMLModalesEdicion = function () {
        return `
            <!-- MODAL 1: EDITAR PERSONALES -->
            <div class="modal fade" id="modalEditPer" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="titulo-edit-per"></h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="form-edit-per">
                                <div class="row g-3">
                                    <div class="col-md-6"><label class="form-label fw-bold">Nombre *</label><input type="text" class="form-control" id="edit-nombre" required></div>
                                    <div class="col-md-6"><label class="form-label fw-bold">Apellido *</label><input type="text" class="form-control" id="edit-apellido" required></div>
                                    <div class="col-md-6"><label class="form-label fw-bold">CUIL *</label><input type="text" class="form-control" id="edit-cuil" required></div>
                                    <div class="col-md-6"><label class="form-label">Teléfono</label><input type="text" class="form-control" id="edit-telefono"></div>
                                    <div class="col-md-12"><label class="form-label">Correo Electrónico</label><input type="email" class="form-control" id="edit-email"></div>
                                    <div class="col-12"><hr class="text-muted"><h6 class="text-secondary fw-bold">Domicilio</h6></div>
                                    <div class="col-md-6"><label class="form-label">Calle</label><input type="text" class="form-control" id="edit-calle"></div>
                                    <div class="col-md-2"><label class="form-label">Nro</label><input type="text" class="form-control" id="edit-numero"></div>
                                    <div class="col-md-2"><label class="form-label">Piso</label><input type="text" class="form-control" id="edit-piso"></div>
                                    <div class="col-md-2"><label class="form-label">Dpto</label><input type="text" class="form-control" id="edit-dpto"></div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btn-next-edit">Siguiente <i class="fas fa-arrow-right ms-1"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODAL 2: EDITAR LABORALES -->
            <div class="modal fade" id="modalEditLab" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-dark">
                            <h5 class="modal-title" id="titulo-edit-lab"></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="form-edit-lab">
                                <div class="row g-3">
                                    <div class="col-md-6"><label class="form-label fw-bold">Fecha Ingreso *</label><input type="date" class="form-control" id="edit-fecha" required></div>
                                    <div class="col-md-6"><label class="form-label fw-bold">Estado *</label><select class="form-select" id="edit-estado" required><option value="1">Activo</option><option value="2">Inactivo</option><option value="3">Licencia</option></select></div>
                                    <div class="col-md-4"><label class="form-label fw-bold">Área *</label><select class="form-select" id="edit-area" required></select></div>
                                    <div class="col-md-4"><label class="form-label fw-bold">Cargo *</label><select class="form-select" id="edit-cargo" required></select></div>
                                    <div class="col-md-4"><label class="form-label fw-bold">Barrio *</label><select class="form-select" id="edit-barrio" required></select></div>
                                    <div class="col-12"><hr class="text-muted"><h6 class="text-secondary fw-bold">Vinculación y Legajo</h6></div>
                                    <div class="col-md-6"><label class="form-label fw-bold">Tipo Vinculación *</label><select class="form-select" id="edit-vinculacion" required></select></div>
                                    <div class="col-md-6 d-none" id="edit-col-legajo">
                                        <label class="form-label fw-bold text-primary">Número Legajo *</label>
                                        <input type="text" class="form-control border-primary fw-bold" id="edit-legajo">
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="btn-back-edit"><i class="fas fa-arrow-left me-1"></i> Volver</button>
                            <button type="button" class="btn btn-success" id="btn-save-edit"><i class="fas fa-save me-1"></i> Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const cargarDatosMasivos = function () {
        $.when(
            $.ajax({ url: URL_AREA, type: 'GET' }),
            $.ajax({ url: URL_CARGO, type: 'GET' }),
            $.ajax({ url: URL_BARRIO, type: 'GET' }),
            $.ajax({ url: URL_TP_VINCULACION, type: 'GET' }),
            $.ajax({ url: `${URL_EMPLEADO}/laborales`, type: 'GET' }),
            $.ajax({ url: `${URL_EMPLEADO}/personales`, type: 'GET' })
        ).done(function (rArea, rCargo, rBarrio, rTpVinc, rLab, rPer) {
            estado.catAreas = rArea[0] || [];
            estado.catCargos = rCargo[0] || [];
            estado.catBarrios = rBarrio[0] || [];
            estado.catTiposVinculacion = rTpVinc[0] || [];
            
            poblarCombo('#edit-area', estado.catAreas, 'Id', 'Area');
            poblarCombo('#edit-cargo', estado.catCargos, 'Id', 'Cargo');
            poblarCombo('#edit-barrio', estado.catBarrios, 'Id', 'Barrio');
            poblarCombo('#edit-vinculacion', estado.catTiposVinculacion, 'IdVinculacion', 'TipoVinculacion');

            estado.listaLaborales = rLab[0] || [];
            estado.listaPersonales = rPer[0] || [];
            
            renderizarLaborales(estado.listaLaborales);
            renderizarPersonales(estado.listaPersonales);
        });
    };

    const poblarCombo = function (selector, lista, val, txt) {
        let select = $(selector);
        select.empty().append(`<option value="">-- Seleccione --</option>`);
        lista.forEach(i => select.append(`<option value="${i[val]}">${i[txt]}</option>`));
    };

    const renderizarLaborales = function (lista) {
        if (!lista.length) {
            $('#grid-laborales').html('<div class="alert alert-info text-center m-3">Sin resultados.</div>');
            return;
        }
        let html = `<table class="table table-hover table-bordered align-middle mb-0"><thead class="table-dark"><tr><th class="text-center">Apellido y Nombre</th><th>Área</th><th>Cargo</th><th class="text-center">Estado</th><th class="text-center">Acciones</th></tr></thead><tbody>`;
        lista.forEach(emp => {
            let bColor = emp.EstadoEmpleado === 'Activo' ? 'bg-success' : (emp.EstadoEmpleado === 'Inactivo' ? 'bg-danger' : 'bg-warning text-dark');
            html += `<tr>
                <!--<td class="text-center fw-bold text-secondary">#${emp.Id}</td>-->
                <td class="fw-bold">${emp.Apellido}, ${emp.Nombre}</td>
                <td><span class="badge bg-light text-dark border">${emp.Area || '-'}</span></td>
                <td>${emp.Cargo || '-'}</td>
                <td class="text-center"><span class="badge ${bColor}">${emp.EstadoEmpleado}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${emp.Id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-del" data-id="${emp.Id}" data-nombre="${emp.Nombre} ${emp.Apellido}"><i class="fas fa-user-slash"></i></button>
                </td>
            </tr>`;
        });
        html += `</tbody></table>`;
        $('#grid-laborales').html(html);
    };

    const renderizarPersonales = function (lista) {
        if (!lista.length) {
            $('#grid-personales').html('<div class="alert alert-info text-center m-3">Sin resultados.</div>');
            return;
        }
        let html = `<table class="table table-hover table-bordered align-middle mb-0"><thead class="table-secondary"><tr><th class="text-center">Empleado</th><th>CUIL</th><th>Teléfono</th><th>Email</th><th>Domicilio</th></tr></thead><tbody>`;
        lista.forEach(emp => {
            let dom = emp.Calle ? `${emp.Calle} ${emp.Numero || ''}` : '-';
            html += `<tr>
                <!--<td class="text-center fw-bold text-muted">#${emp.Id}</td>-->
                <td class="fw-bold">${emp.Apellido}, ${emp.Nombre}</td>
                <td><code>${emp.Cuil || '-'}</code></td>
                <td>${emp.Telefono || '-'}</td>
                <td>${emp.Email || '-'}</td>
                <td><small>${dom}</small></td>
            </tr>`;
        });
        html += `</tbody></table>`;
        $('#grid-personales').html(html);
    };

    const enlazarEventos = function () {
        const p = $('#contenedor-dinamico-crud-personal');

        // MAGIA DEL KEYUP
        p.off('keyup', '#input-buscar-emp').on('keyup', '#input-buscar-emp', function () {
            const trm = $(this).val().toLowerCase();
            
            const filterLab = estado.listaLaborales.filter(u => 
                u.Nombre.toLowerCase().includes(trm) || u.Apellido.toLowerCase().includes(trm) ||
                (u.Cargo && u.Cargo.toLowerCase().includes(trm))
            );
            
            const filterPer = estado.listaPersonales.filter(u => 
                u.Nombre.toLowerCase().includes(trm) || u.Apellido.toLowerCase().includes(trm) ||
                (u.Cuil && u.Cuil.includes(trm))
            );

            renderizarLaborales(filterLab);
            renderizarPersonales(filterPer);
        });

        p.off('change', '#edit-vinculacion').on('change', '#edit-vinculacion', function () {
            const v = estado.catTiposVinculacion.find(x => x.IdVinculacion == $(this).val());
            if (v && v.TipoVinculacion.toLowerCase().includes('contrat')) {
                $('#edit-col-legajo').removeClass('d-none');
                $('#edit-legajo').attr('required', true);
            } else {
                $('#edit-col-legajo').addClass('d-none');
                $('#edit-legajo').removeAttr('required').val('');
            }
        });

        p.off('click', '.btn-edit').on('click', '.btn-edit', function () {
            prepararEdicion(parseInt($(this).data('id')));
        });

        p.off('click', '.btn-del').on('click', '.btn-del', function () {
            confirmarBaja(parseInt($(this).data('id')), $(this).data('nombre'));
        });

        p.off('click', '#btn-next-edit').on('click', '#btn-next-edit', () => {
            if ($('#form-edit-per')[0].checkValidity()) {
                estado.modalPersonal.hide();
                setTimeout(() => estado.modalLaboral.show(), 350);
            } else $('#form-edit-per')[0].reportValidity();
        });

        p.off('click', '#btn-back-edit').on('click', '#btn-back-edit', () => {
            estado.modalLaboral.hide();
            setTimeout(() => estado.modalPersonal.show(), 350);
        });

        p.off('click', '#btn-save-edit').on('click', '#btn-save-edit', () => {
            if ($('#form-edit-lab')[0].checkValidity()) procesarEdicion();
            else $('#form-edit-lab')[0].reportValidity();
        });
    };

    const prepararEdicion = function (id) {
        estado.editandoId = id;
        const dPer = estado.listaPersonales.find(x => x.Id === id);
        const dLab = estado.listaLaborales.find(x => x.Id === id);
        if (!dPer) return;

        $('#edit-nombre').val(dPer.Nombre); $('#edit-apellido').val(dPer.Apellido);
        $('#edit-cuil').val(dPer.Cuil); $('#edit-telefono').val(dPer.Telefono);
        $('#edit-email').val(dPer.Email); $('#edit-calle').val(dPer.Calle);
        $('#edit-numero').val(dPer.Numero); $('#edit-piso').val(dPer.Piso);
        $('#edit-dpto').val(dPer.Dpto);

        if (dLab) {
            $('#edit-estado').val(dLab.EstadoEmpleado === 'Inactivo' ? '2' : '1');
            const a = estado.catAreas.find(x => x.Area === dLab.Area); if(a) $('#edit-area').val(a.Id);
            const c = estado.catCargos.find(x => x.Cargo === dLab.Cargo); if(c) $('#edit-cargo').val(c.Id);
            $('#edit-barrio').val('1'); // Placeholder si no está en la vista
            $('#edit-fecha').val(new Date().toISOString().split('T')[0]);
        }

        // Consultar Legajo
        $.ajax({
            url: `${URL_LEGAJO}/Empleado/${id}`, type: 'GET',
            success: function (leg) {
                if (leg) {
                    estado.idLegajoExistente = leg.Id_Legajo;
                    $('#edit-vinculacion').val(leg.Id_Tipo_Vinculacion).trigger('change');
                    $('#edit-legajo').val(leg.Numero_Legajo);
                }
            },
            error: function () {
                estado.idLegajoExistente = 0;
                $('#edit-vinculacion').val('').trigger('change');
            }
        });

        $('#titulo-edit-per').html(`<i class="fas fa-user-edit me-2"></i> Editar #${id} - Paso 1`);
        $('#titulo-edit-lab').html(`<i class="fas fa-briefcase me-2"></i> Editar #${id} - Paso 2`);
        estado.modalPersonal.show();
    };

    const procesarEdicion = function () {
        const data = {
            Id: estado.editandoId,
            Apellido: $('#edit-apellido').val().trim(),
            Nombre: $('#edit-nombre').val().trim(),
            Cuil: $('#edit-cuil').val().trim(),
            Telefono: $('#edit-telefono').val().trim(),
            Email: $('#edit-email').val().trim(),
            Calle: $('#edit-calle').val().trim(),
            Numero: $('#edit-numero').val().trim(),
            Piso: $('#edit-piso').val().trim(),
            Dpto: $('#edit-dpto').val().trim(),
            Fecha_Ingreso: $('#edit-fecha').val(),
            Id_Estado_Empleado: parseInt($('#edit-estado').val()),
            Id_Area: parseInt($('#edit-area').val()),
            Id_Cargo: parseInt($('#edit-cargo').val()),
            Id_Barrio: parseInt($('#edit-barrio').val())
        };

        const idVinc = parseInt($('#edit-vinculacion').val());
        const legajo = $('#edit-legajo').val().trim();

        $.ajax({
            type: "PUT", url: `${URL_EMPLEADO}/${estado.editandoId}`, data: JSON.stringify(data), contentType: "application/json",
            success: function () {
                if (idVinc && legajo) procesarLegajo(idVinc, legajo);
                else finalizarOperacion();
            }
        });
    };

    const procesarLegajo = function (idVinc, legajo) {
        const esNuevo = estado.idLegajoExistente === 0;
        const url = esNuevo ? URL_LEGAJO : `${URL_LEGAJO}/${estado.idLegajoExistente}`;
        const data = { Id_Legajo: estado.idLegajoExistente, Numero_Legajo: legajo, Estado_Legajo: true, Id_Empleado: estado.editandoId, Id_Tipo_Vinculacion: idVinc };

        $.ajax({
            type: esNuevo ? "POST" : "PUT", url: url, data: JSON.stringify(data), contentType: "application/json",
            success: () => finalizarOperacion(),
            error: () => finalizarOperacion() // Termina igual si falla el legajo
        });
    };

    const finalizarOperacion = function () {
        estado.modalLaboral.hide();
        Swal.fire({ title: 'Actualizado', text: 'Datos del empleado modificados.', icon: 'success', timer: 1500, showConfirmButton: false });
        cargarDatosMasivos();
    };

    const confirmarBaja = function (id, nombre) {
        Swal.fire({
            title: '¿Confirmar Baja Lógica?', text: `El empleado "${nombre}" pasará a estado INACTIVO.`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, dar de baja'
        }).then((res) => {
            if (res.isConfirmed) {
                $.ajax({ type: 'DELETE', url: `${URL_EMPLEADO}/${id}`, success: () => { Swal.fire('Baja Procesada', '', 'success'); cargarDatosMasivos(); } });
            }
        });
    };

    return { cargarEn: inicializar };
})();