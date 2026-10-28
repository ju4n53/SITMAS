/* ========================================================================
   SITMAS - Módulo de Personal: Alta de Empleados y Registros Recientes
   Arquitectura: Module Pattern (IIFE) + jQuery + Bootstrap 5 + SweetAlert2
   ======================================================================== */

const EmpleadoModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        listaLaboralesRecientes: [],
        catAreas: [],
        catCargos: [],
        catBarrios: [],
        catTiposVinculacion: [],
        modalInstanciaPersonal: null,
        modalInstanciaLaboral: null
    };

    // Endpoints API
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
                    <h4 class="text-primary m-0 fw-bold"><i class="fas fa-user-plus"></i> Registrar Nuevo Ingreso</h4>
                    <small class="text-muted">Alta de personal y vinculación de legajos</small>
                </div>
                <button class="btn btn-success btn-lg shadow-sm" id="btn-nuevo-empleado">
                    <i class="fas fa-plus-circle me-1"></i> Registrar Ingreso
                </button>
            </div>

            <!-- CARD DE REGISTROS RECIENTES -->
            <div class="card shadow-sm border-0 fade-in">
                <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center py-3">
                    <h6 class="m-0 fw-bold"><i class="fas fa-history me-2"></i> ÚLTIMOS 5 INGRESOS (RECIENTES)</h6>
                    <span class="badge bg-primary">Vista Rápida</span>
                </div>
                <div class="card-body p-0">
                    <div id="tabla-recientes-container" class="table-responsive">
                        <div class="text-center p-4"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Cargando ingresos recientes...</p></div>
                    </div>
                </div>
            </div>
        `;

        htmlEstructura += generarHTMLModalesAlta();
        contenedor.html(htmlEstructura);

        estado.modalInstanciaPersonal = new bootstrap.Modal(document.getElementById('modalEmpleadoPersonalAlta'), { backdrop: 'static' });
        estado.modalInstanciaLaboral = new bootstrap.Modal(document.getElementById('modalEmpleadoLaboralAlta'), { backdrop: 'static' });

        enlazarEventos();
        cargarCatalogosYRecientes();
    };

    const generarHTMLModalesAlta = function () {
        return `
            <!-- MODAL 1: DATOS PERSONALES -->
            <div class="modal fade" id="modalEmpleadoPersonalAlta" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="fas fa-id-card me-2"></i> Alta Empleado - Paso 1: Personales</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="form-empleado-personal-alta">
                                <div class="row g-3">
                                    <div class="col-md-6"><label class="form-label fw-bold">Nombre *</label><input type="text" class="form-control" id="alta-emp-nombre" required></div>
                                    <div class="col-md-6"><label class="form-label fw-bold">Apellido *</label><input type="text" class="form-control" id="alta-emp-apellido" required></div>
                                    <div class="col-md-6"><label class="form-label fw-bold">CUIL *</label><input type="text" class="form-control" id="alta-emp-cuil" required></div>
                                    <div class="col-md-6"><label class="form-label">Teléfono</label><input type="text" class="form-control" id="alta-emp-telefono"></div>
                                    <div class="col-md-12"><label class="form-label">Correo Electrónico</label><input type="email" class="form-control" id="alta-emp-email"></div>
                                    <div class="col-12"><hr class="text-muted"><h6 class="text-secondary fw-bold"><i class="fas fa-home me-1"></i> Domicilio Residencia</h6></div>
                                    <div class="col-md-6"><label class="form-label">Calle</label><input type="text" class="form-control" id="alta-emp-calle"></div>
                                    <div class="col-md-2"><label class="form-label">Número</label><input type="text" class="form-control" id="alta-emp-numero"></div>
                                    <div class="col-md-2"><label class="form-label">Piso</label><input type="text" class="form-control" id="alta-emp-piso"></div>
                                    <div class="col-md-2"><label class="form-label">Dpto</label><input type="text" class="form-control" id="alta-emp-dpto"></div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btn-siguiente-alta">Siguiente <i class="fas fa-arrow-right ms-1"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODAL 2: DATOS LABORALES -->
            <div class="modal fade" id="modalEmpleadoLaboralAlta" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-dark">
                            <h5 class="modal-title"><i class="fas fa-briefcase me-2"></i> Alta Empleado - Paso 2: Laborales</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="form-empleado-laboral-alta">
                                <div class="row g-3">
                                    <div class="col-md-6"><label class="form-label fw-bold">Fecha de Ingreso *</label><input type="date" class="form-control" id="alta-emp-fecha" required></div>
                                    <div class="col-md-6"><label class="form-label fw-bold">Estado *</label>
                                        <select class="form-select" id="alta-emp-estado" required><option value="1">Activo</option><option value="3">Licencia</option></select>
                                    </div>
                                    <div class="col-md-4"><label class="form-label fw-bold">Área *</label><select class="form-select" id="alta-emp-area" required></select></div>
                                    <div class="col-md-4"><label class="form-label fw-bold">Cargo *</label><select class="form-select" id="alta-emp-cargo" required></select></div>
                                    <div class="col-md-4"><label class="form-label fw-bold">Barrio *</label><select class="form-select" id="alta-emp-barrio" required></select></div>
                                    <div class="col-12"><hr class="text-muted"><h6 class="text-secondary fw-bold"><i class="fas fa-file-contract me-1"></i> Vinculación y Legajo</h6></div>
                                    <div class="col-md-6"><label class="form-label fw-bold">Tipo Vinculación *</label><select class="form-select" id="alta-emp-vinculacion" required></select></div>
                                    <div class="col-md-6 d-none" id="alta-col-legajo">
                                        <label class="form-label fw-bold text-primary">Número Legajo *</label>
                                        <input type="text" class="form-control border-primary fw-bold" id="alta-emp-legajo">
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="btn-volver-alta"><i class="fas fa-arrow-left me-1"></i> Volver</button>
                            <button type="button" class="btn btn-success" id="btn-guardar-alta"><i class="fas fa-save me-1"></i> Confirmar Ingreso</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const cargarCatalogosYRecientes = function () {
        $.when(
            $.ajax({ url: URL_AREA, type: 'GET' }),
            $.ajax({ url: URL_CARGO, type: 'GET' }),
            $.ajax({ url: URL_BARRIO, type: 'GET' }),
            $.ajax({ url: URL_TP_VINCULACION, type: 'GET' }),
            $.ajax({ url: `${URL_EMPLEADO}/laborales`, type: 'GET' })
        ).done(function (resArea, resCargo, resBarrio, resTpVinc, resLaborales) {
            estado.catAreas = resArea[0] || [];
            estado.catCargos = resCargo[0] || [];
            estado.catBarrios = resBarrio[0] || [];
            estado.catTiposVinculacion = resTpVinc[0] || [];
            
            poblarCombo('#alta-emp-area', estado.catAreas, 'Id', 'Area', 'Área');
            poblarCombo('#alta-emp-cargo', estado.catCargos, 'Id', 'Cargo', 'Cargo');
            poblarCombo('#alta-emp-barrio', estado.catBarrios, 'Id', 'Barrio', 'Barrio');
            poblarCombo('#alta-emp-vinculacion', estado.catTiposVinculacion, 'IdVinculacion', 'TipoVinculacion', 'Vinculación');

            // Tomamos solo los últimos 5 para la vista rápida
            const todos = resLaborales[0] || [];
            estado.listaLaboralesRecientes = todos.slice(-5).reverse();
            renderizarRecientes(estado.listaLaboralesRecientes);
        });
    };

    const poblarCombo = function (selector, lista, val, txt, placeholder) {
        let select = $(selector);
        select.empty().append(`<option value="">-- Seleccione ${placeholder} --</option>`);
        lista.forEach(i => select.append(`<option value="${i[val]}">${i[txt]}</option>`));
    };

    const renderizarRecientes = function (lista) {
        if (!lista || lista.length === 0) {
            $('#tabla-recientes-container').html('<div class="alert alert-info text-center m-3">No hay ingresos recientes.</div>');
            return;
        }
        let html = `<table class="table table-hover align-middle mb-0"><thead class="table-secondary"><tr><th class="ps-3">ID</th><th>Empleado</th><th>Área</th><th>Cargo</th><th class="text-center">Estado</th></tr></thead><tbody>`;
        lista.forEach(emp => {
            let bColor = emp.EstadoEmpleado === 'Activo' ? 'bg-success' : 'bg-danger';
            html += `<tr>
                <td class="ps-3 text-muted fw-bold">#${emp.Id}</td>
                <td class="fw-bold">${emp.Apellido}, ${emp.Nombre}</td>
                <td><span class="badge bg-light text-dark border">${emp.Area || '-'}</span></td>
                <td>${emp.Cargo || '-'}</td>
                <td class="text-center"><span class="badge ${bColor}">${emp.EstadoEmpleado}</span></td>
            </tr>`;
        });
        html += `</tbody></table>`;
        $('#tabla-recientes-container').html(html);
    };

    const enlazarEventos = function () {
        const p = $('#contenedor-dinamico-crud-personal');

        p.off('click', '#btn-nuevo-empleado').on('click', '#btn-nuevo-empleado', () => {
            $('#form-empleado-personal-alta')[0].reset();
            $('#form-empleado-laboral-alta')[0].reset();
            $('#alta-emp-fecha').val(new Date().toISOString().split('T')[0]);
            $('#alta-col-legajo').addClass('d-none');
            $('#alta-emp-legajo').removeAttr('required');
            estado.modalInstanciaPersonal.show();
        });

        p.off('change', '#alta-emp-vinculacion').on('change', '#alta-emp-vinculacion', function () {
            const v = estado.catTiposVinculacion.find(x => x.IdVinculacion == $(this).val());
            if (v && v.TipoVinculacion.toLowerCase().includes('contrat')) {
                $('#alta-col-legajo').removeClass('d-none');
                $('#alta-emp-legajo').attr('required', true);
            } else {
                $('#alta-col-legajo').addClass('d-none');
                $('#alta-emp-legajo').removeAttr('required').val('');
            }
        });

        p.off('click', '#btn-siguiente-alta').on('click', '#btn-siguiente-alta', () => {
            if ($('#form-empleado-personal-alta')[0].checkValidity()) {
                estado.modalInstanciaPersonal.hide();
                setTimeout(() => estado.modalInstanciaLaboral.show(), 350);
            } else $('#form-empleado-personal-alta')[0].reportValidity();
        });

        p.off('click', '#btn-volver-alta').on('click', '#btn-volver-alta', () => {
            estado.modalInstanciaLaboral.hide();
            setTimeout(() => estado.modalInstanciaPersonal.show(), 350);
        });

        p.off('click', '#btn-guardar-alta').on('click', '#btn-guardar-alta', () => {
            if ($('#form-empleado-laboral-alta')[0].checkValidity()) procesarAlta();
            else $('#form-empleado-laboral-alta')[0].reportValidity();
        });
    };

    const procesarAlta = function () {
        const data = {
            Apellido: $('#alta-emp-apellido').val().trim(),
            Nombre: $('#alta-emp-nombre').val().trim(),
            Cuil: $('#alta-emp-cuil').val().trim(),
            Telefono: $('#alta-emp-telefono').val().trim(),
            Email: $('#alta-emp-email').val().trim(),
            Calle: $('#alta-emp-calle').val().trim(),
            Numero: $('#alta-emp-numero').val().trim(),
            Piso: $('#alta-emp-piso').val().trim(),
            Dpto: $('#alta-emp-dpto').val().trim(),
            Fecha_Ingreso: $('#alta-emp-fecha').val(),
            Id_Estado_Empleado: parseInt($('#alta-emp-estado').val()),
            Id_Area: parseInt($('#alta-emp-area').val()),
            Id_Cargo: parseInt($('#alta-emp-cargo').val()),
            Id_Barrio: parseInt($('#alta-emp-barrio').val())
        };

        const idVinc = parseInt($('#alta-emp-vinculacion').val());
        const legajo = $('#alta-emp-legajo').val().trim();

        $.ajax({
            type: "POST", url: URL_EMPLEADO, data: JSON.stringify(data), contentType: "application/json",
            success: function (res) {
                if (idVinc && legajo) guardarLegajo(res.id, idVinc, legajo);
                else exitoFinal();
            },
            error: function (err) { Swal.fire('Error', 'No se pudo registrar el empleado.', 'error'); }
        });
    };

    const guardarLegajo = function (idEmp, idVinc, numLegajo) {
        $.ajax({
            type: "POST", url: URL_LEGAJO, 
            data: JSON.stringify({ Numero_Legajo: numLegajo, Id_Empleado: idEmp, Id_Tipo_Vinculacion: idVinc }),
            contentType: "application/json",
            success: () => exitoFinal(),
            error: () => { Swal.fire('Aviso', 'Empleado guardado sin legajo (hubo un error).', 'warning'); exitoFinal(); }
        });
    };

    const exitoFinal = function () {
        estado.modalInstanciaLaboral.hide();
        Swal.fire({ title: '¡Ingreso Registrado!', icon: 'success', timer: 1500, showConfirmButton: false });
        cargarCatalogosYRecientes(); // Refresca los últimos 5
    };

    return { cargarEn: inicializar };
})();










// /* ========================================================================
//    SITMAS - Módulo de Personal: Gestión de Empleados (CRUD + Combos Dinámicos)
//    Arquitectura: Module Pattern (IIFE) + jQuery + Bootstrap 5 + SweetAlert2
//    ======================================================================== */

// const EmpleadoModulo = (function () {
//     // 🔒 ESTADO PRIVADO DEL MÓDULO
//     let estado = {
//         listaPersonales: [],
//         listaLaborales: [],
//         catAreas: [],
//         catCargos: [],
//         catBarrios: [],
//         catTiposVinculacion: [],
//         empleadoEditandoId: 0,
//         idLegajoExistente: 0, // Para saber si editamos un legajo existente
//         modalInstanciaPersonal: null,
//         modalInstanciaLaboral: null
//     };

//     // Endpoints de la Web API SITMAS
//     const URL_EMPLEADO = "https://localhost:44325/api/Empleado";
//     const URL_AREA = "https://localhost:44325/api/Area";
//     const URL_CARGO = "https://localhost:44325/api/Cargo";
//     const URL_BARRIO = "https://localhost:44325/api/Barrio";
//     const URL_TP_VINCULACION = "https://localhost:44325/api/TpVinculacion";
//     const URL_LEGAJO = "https://localhost:44325/api/Legajo";

//     // 1. INICIALIZACIÓN DEL MÓDULO
//     const inicializar = function (contenedorId) {
//         const contenedor = $(`#${contenedorId}`);

//         let htmlEstructura = `
//             <div class="d-flex justify-content-between align-items-center mb-4 fade-in">
//                 <div>
//                     <h4 class="text-primary m-0 fw-bold"><i class="fas fa-users-cog"></i> Gestión de Empleados</h4>
//                     <small class="text-muted">Administración centralizada del personal de planta SITMAS</small>
//                 </div>
//                 <button class="btn btn-success btn-lg" id="btn-nuevo-empleado">
//                     <i class="fas fa-plus-circle"></i> Registrar Ingreso
//                 </button>
//             </div>

//             <ul class="nav nav-pills mb-3 fade-in" id="pills-tab-empleados" role="tablist">
//                 <li class="nav-item" role="presentation">
//                     <button class="nav-link active fw-bold" id="pills-laboral-tab" data-bs-toggle="pill" data-bs-target="#pills-laboral" type="button" role="tab">
//                         <i class="fas fa-briefcase me-1"></i> Datos Laborales
//                     </button>
//                 </li>
//                 <li class="nav-item" role="presentation">
//                     <button class="nav-link fw-bold" id="pills-personal-tab" data-bs-toggle="pill" data-bs-target="#pills-personal" type="button" role="tab">
//                         <i class="fas fa-address-card me-1"></i> Datos Personales
//                     </button>
//                 </li>
//             </ul>

//             <div class="tab-content border-top pt-3 fade-in" id="pills-tabContentEmpleados">
//                 <div class="tab-pane fade show active" id="pills-laboral" role="tabpanel">
//                     <div id="tabla-laboral-container" class="table-responsive shadow-sm rounded">
//                         <div class="text-center p-4"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Cargando datos laborales...</p></div>
//                     </div>
//                 </div>
//                 <div class="tab-pane fade" id="pills-personal" role="tabpanel">
//                     <div id="tabla-personal-container" class="table-responsive shadow-sm rounded">
//                         <div class="text-center p-4"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Cargando datos personales...</p></div>
//                     </div>
//                 </div>
//             </div>
//         `;

//         htmlEstructura += generarHTMLModales();
//         contenedor.html(htmlEstructura);

//         estado.modalInstanciaPersonal = new bootstrap.Modal(document.getElementById('modalEmpleadoPersonal'), { backdrop: 'static' });
//         estado.modalInstanciaLaboral = new bootstrap.Modal(document.getElementById('modalEmpleadoLaboral'), { backdrop: 'static' });

//         enlazarEventos();

//         // Carga simultánea de catálogos y tablas
//         cargarCatalogosAuxiliares().then(() => {
//             cargarGrillaLaborales();
//             cargarGrillaPersonales();
//         });
//     };

//     // 2. MODALES CON COMBO DINÁMICO Y SECCIÓN DE LEGAJO CONDICIONAL
//     const generarHTMLModales = function () {
//         return `
//             <!-- MODAL 1: DATOS PERSONALES -->
//             <div class="modal fade" id="modalEmpleadoPersonal" tabindex="-1" aria-hidden="true">
//                 <div class="modal-dialog modal-lg">
//                     <div class="modal-content">
//                         <div class="modal-header bg-primary text-white">
//                             <h5 class="modal-title" id="titulo-modal-personal">
//                                 <i class="fas fa-id-card me-2"></i> Ficha Empleado - Paso 1: Datos Personales
//                             </h5>
//                             <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
//                         </div>
//                         <div class="modal-body">
//                             <form id="form-empleado-personal">
//                                 <div class="row g-3">
//                                     <div class="col-md-6">
//                                         <label class="form-label fw-bold">Nombre *</label>
//                                         <input type="text" class="form-control" id="emp-nombre" required placeholder="Ej: Juan Antonio">
//                                     </div>
//                                     <div class="col-md-6">
//                                         <label class="form-label fw-bold">Apellido *</label>
//                                         <input type="text" class="form-control" id="emp-apellido" required placeholder="Ej: Pérez">
//                                     </div>
//                                     <div class="col-md-6">
//                                         <label class="form-label fw-bold">CUIL *</label>
//                                         <input type="text" class="form-control" id="emp-cuil" required placeholder="Ej: 20384920194">
//                                     </div>
//                                     <div class="col-md-6">
//                                         <label class="form-label">Teléfono</label>
//                                         <input type="text" class="form-control" id="emp-telefono" placeholder="Ej: 3513456789">
//                                     </div>
//                                     <div class="col-md-12">
//                                         <label class="form-label">Correo Electrónico</label>
//                                         <input type="email" class="form-control" id="emp-email" placeholder="ejemplo@sitmas.gob.ar">
//                                     </div>
//                                     <div class="col-12"><hr class="text-muted"><h6 class="text-secondary fw-bold"><i class="fas fa-home me-1"></i> Domicilio Residencia</h6></div>
//                                     <div class="col-md-6">
//                                         <label class="form-label">Calle</label>
//                                         <input type="text" class="form-control" id="emp-calle" placeholder="Nombre de la calle">
//                                     </div>
//                                     <div class="col-md-2">
//                                         <label class="form-label">Número</label>
//                                         <input type="text" class="form-control" id="emp-numero" placeholder="1234">
//                                     </div>
//                                     <div class="col-md-2">
//                                         <label class="form-label">Piso</label>
//                                         <input type="text" class="form-control" id="emp-piso" placeholder="2">
//                                     </div>
//                                     <div class="col-md-2">
//                                         <label class="form-label">Dpto</label>
//                                         <input type="text" class="form-control" id="emp-dpto" placeholder="B">
//                                     </div>
//                                 </div>
//                             </form>
//                         </div>
//                         <div class="modal-footer">
//                             <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
//                             <button type="button" class="btn btn-primary" id="btn-siguiente-modal">
//                                 Siguiente <i class="fas fa-arrow-right ms-1"></i>
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- MODAL 2: DATOS LABORALES -->
//             <div class="modal fade" id="modalEmpleadoLaboral" tabindex="-1" aria-hidden="true">
//                 <div class="modal-dialog modal-lg">
//                     <div class="modal-content">
//                         <div class="modal-header bg-info text-dark">
//                             <h5 class="modal-title" id="titulo-modal-laboral">
//                                 <i class="fas fa-briefcase me-2"></i> Ficha Empleado - Paso 2: Datos Laborales
//                             </h5>
//                             <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
//                         </div>
//                         <div class="modal-body">
//                             <form id="form-empleado-laboral">
//                                 <div class="row g-3">
//                                     <div class="col-md-6">
//                                         <label class="form-label fw-bold">Fecha de Ingreso *</label>
//                                         <input type="date" class="form-control" id="emp-fecha-ingreso" required>
//                                     </div>
//                                     <div class="col-md-6">
//                                         <label class="form-label fw-bold">Estado Empleado *</label>
//                                         <select class="form-select" id="emp-estado" disabled>
//                                             <option value="1">Activo</option>
//                                             <option value="2">Inactivo</option>
//                                             <option value="3">Licencia</option>
//                                         </select>
//                                     </div>
//                                     <div class="col-md-4">
//                                         <label class="form-label fw-bold">Área de Trabajo *</label>
//                                         <select class="form-select" id="emp-area" required>
//                                             <option value="">Cargando áreas...</option>
//                                         </select>
//                                     </div>
//                                     <div class="col-md-4">
//                                         <label class="form-label fw-bold">Cargo Desempeñado *</label>
//                                         <select class="form-select" id="emp-cargo" required>
//                                             <option value="">Cargando cargos...</option>
//                                         </select>
//                                     </div>
//                                     <div class="col-md-4">
//                                         <label class="form-label fw-bold">Barrio *</label>
//                                         <select class="form-select" id="emp-barrio" required>
//                                             <option value="">Cargando barrios...</option>
//                                         </select>
//                                     </div>

//                                     <div class="col-12"><hr class="text-muted"><h6 class="text-secondary fw-bold"><i class="fas fa-file-contract me-1"></i> Vinculación Laboral y Legajo</h6></div>

//                                     <div class="col-md-6">
//                                         <label class="form-label fw-bold">Tipo de Vinculación *</label>
//                                         <select class="form-select" id="emp-tp-vinculacion" required>
//                                             <option value="">Cargando vínculos...</option>
//                                         </select>
//                                     </div>

//                                     <!-- Campo Dinámico: Solo se activa para "Contrato" -->
//                                     <div class="col-md-6 d-none" id="col-numero-legajo">
//                                         <label class="form-label fw-bold text-primary">Número de Legajo *</label>
//                                         <div class="input-group">
//                                             <span class="input-group-text bg-primary text-white"><i class="fas fa-folder"></i></span>
//                                             <input type="text" class="form-control border-primary fw-bold" id="emp-numero-legajo" placeholder="Ej: LEG-2026-042">
//                                         </div>
//                                         <small class="text-muted">Requerido únicamente para personal Contratado.</small>
//                                     </div>
//                                 </div>
//                             </form>
//                         </div>
//                         <div class="modal-footer">
//                             <button type="button" class="btn btn-secondary" id="btn-volver-modal">
//                                 <i class="fas fa-arrow-left me-1"></i> Volver
//                             </button>
//                             <button type="button" class="btn btn-success" id="btn-guardar-empleado">
//                                 <i class="fas fa-save me-1"></i> Registrar Ingreso
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;
//     };

//     // 3. CARGA DE CATÁLOGOS AUXILIARES VIA AJAX
//     const cargarCatalogosAuxiliares = function () {
//         return $.when(
//             $.ajax({ url: URL_AREA, type: 'GET' }),
//             $.ajax({ url: URL_CARGO, type: 'GET' }),
//             $.ajax({ url: URL_BARRIO, type: 'GET' }),
//             $.ajax({ url: URL_TP_VINCULACION, type: 'GET' })
//         ).done(function (resArea, resCargo, resBarrio, resTpVinc) {
//             estado.catAreas = resArea[0] || [];
//             estado.catCargos = resCargo[0] || [];
//             estado.catBarrios = resBarrio[0] || [];
//             estado.catTiposVinculacion = resTpVinc[0] || [];

//             poblarCombo('#emp-area', estado.catAreas, 'Id', 'Area', 'Seleccione Área');
//             poblarCombo('#emp-cargo', estado.catCargos, 'Id', 'Cargo', 'Seleccione Cargo');
//             poblarCombo('#emp-barrio', estado.catBarrios, 'Id', 'Barrio', 'Seleccione Barrio');
//             poblarCombo('#emp-tp-vinculacion', estado.catTiposVinculacion, 'IdVinculacion', 'TipoVinculacion', 'Seleccione Vinculación');
//         }).fail(function (err) {
//             console.error("Error al cargar catálogos auxiliares:", err);
//             Swal.fire('Error de Conexión', 'No se pudieron cargar las listas desplegables auxiliares.', 'error');
//         });
//     };

//     const poblarCombo = function (selector, lista, propVal, propTexto, placeholder) {
//         let select = $(selector);
//         select.empty().append(`<option value="">-- ${placeholder} --</option>`);
//         lista.forEach(item => {
//             select.append(`<option value="${item[propVal]}">${item[propTexto]}</option>`);
//         });
//     };

//     // 4. ENLACE DE EVENTOS
//     const enlazarEventos = function () {
//         const principal = $('#contenedor-dinamico-crud-personal');

//         // Botón Nuevo Empleado
//         principal.off('click', '#btn-nuevo-empleado').on('click', '#btn-nuevo-empleado', function () {
//             estado.empleadoEditandoId = 0;
//             estado.idLegajoExistente = 0;
//             $('#form-empleado-personal')[0].reset();
//             $('#form-empleado-laboral')[0].reset();
            
//             // Ocultar campo legajo
//             evaluarVisibilidadLegajo('');

//             $('#titulo-modal-personal').html('<i class="fas fa-user-plus me-2"></i> Nuevo Empleado - Paso 1: Personales');
//             $('#titulo-modal-laboral').html('<i class="fas fa-briefcase me-2"></i> Nuevo Empleado - Paso 2: Laborales');
            
//             // Fecha hoy por defecto
//             $('#emp-fecha-ingreso').val(new Date().toISOString().split('T')[0]);
            
//             estado.modalInstanciaPersonal.show();
//         });

//         // REGLA DE NEGOCIO: Cambio en Tipo de Vinculación
//         principal.off('change', '#emp-tp-vinculacion').on('change', '#emp-tp-vinculacion', function () {
//             const idVinculacion = $(this).val();
//             evaluarVisibilidadLegajo(idVinculacion);
//         });

//         // Transición de Modales
//         principal.off('click', '#btn-siguiente-modal').on('click', '#btn-siguiente-modal', function () {
//             if ($('#form-empleado-personal')[0].checkValidity()) {
//                 estado.modalInstanciaPersonal.hide();
//                 setTimeout(() => { estado.modalInstanciaLaboral.show(); }, 350);
//             } else {
//                 $('#form-empleado-personal')[0].reportValidity();
//             }
//         });

//         principal.off('click', '#btn-volver-modal').on('click', '#btn-volver-modal', function () {
//             estado.modalInstanciaLaboral.hide();
//             setTimeout(() => { estado.modalInstanciaPersonal.show(); }, 350);
//         });

//         // Guardar
//         principal.off('click', '#btn-guardar-empleado').on('click', '#btn-guardar-empleado', function () {
//             if ($('#form-empleado-laboral')[0].checkValidity()) {
//                 guardarEmpleado();
//             } else {
//                 $('#form-empleado-laboral')[0].reportValidity();
//             }
//         });

//         // Editar
//         principal.off('click', '.btn-editar-empleado').on('click', '.btn-editar-empleado', function () {
//             const id = parseInt($(this).data('id'));
//             prepararEdicionEmpleado(id);
//         });

//         // Borrar
//         principal.off('click', '.btn-borrar-empleado').on('click', '.btn-borrar-empleado', function () {
//             const id = parseInt($(this).data('id'));
//             const nombre = $(this).data('nombre');
//             confirmarBajaLogica(id, nombre);
//         });
//     };

//     // Helper: Muestra/Oculta el campo de Legajo según si es "Contrato"
//     const evaluarVisibilidadLegajo = function (idVinculacion) {
//         const itemEncontrado = estado.catTiposVinculacion.find(x => x.IdVinculacion == idVinculacion);
//         const colLegajo = $('#col-numero-legajo');
//         const inputLegajo = $('#emp-numero-legajo');

//         if (itemEncontrado && itemEncontrado.TipoVinculacion.toLowerCase().includes('contrat')) {
//             colLegajo.removeClass('d-none');
//             inputLegajo.attr('required', 'required');
//         } else {
//             colLegajo.addClass('d-none');
//             inputLegajo.removeAttr('required').val('');
//         }
//     };

//     // 5. CÓDIGO DE GRILLAS Y TABLAS
//     const cargarGrillaLaborales = function () {
//         $.ajax({
//             url: `${URL_EMPLEADO}/laborales`,
//             type: 'GET',
//             success: function (data) {
//                 estado.listaLaborales = data || [];
//                 renderizarTablaLaboral(estado.listaLaborales);
//             },
//             error: function () {
//                 $('#tabla-laboral-container').html('<div class="alert alert-danger m-3">Error al conectar con la API de datos laborales.</div>');
//             }
//         });
//     };

//     const cargarGrillaPersonales = function () {
//         $.ajax({
//             url: `${URL_EMPLEADO}/personales`,
//             type: 'GET',
//             success: function (data) {
//                 estado.listaPersonales = data || [];
//                 renderizarTablaPersonal(estado.listaPersonales);
//             }
//         });
//     };

//     const renderizarTablaLaboral = function (lista) {
//         if (!lista || lista.length === 0) {
//             $('#tabla-laboral-container').html('<div class="alert alert-info text-center m-3"><i class="fas fa-info-circle me-1"></i> No hay registros de empleados cargados.</div>');
//             return;
//         }

//         let html = `
//             <table class="table table-hover table-bordered align-middle mb-0">
//                 <thead class="table-dark">
//                     <tr>
//                         <!--<th class="text-center">ID</th>-->
//                         <th>Apellido y Nombre</th>
//                         <th>Área</th>
//                         <th>Cargo</th>
//                         <th class="text-center">Estado</th>
//                         <th class="text-center">Acciones</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//         `;

//         lista.forEach(emp => {
//             let badgeColor = emp.EstadoEmpleado === 'Activo' ? 'bg-success' : (emp.EstadoEmpleado === 'Inactivo' ? 'bg-danger' : 'bg-warning text-dark');
//             html += `
//                 <tr>
//                     <!--<td class="text-center fw-bold text-secondary">#${emp.Id}</td>-->
//                     <td class="fw-bold">${emp.Apellido}, ${emp.Nombre}</td>
//                     <td><span class="badge bg-light text-dark border">${emp.Area || 'Sin Área'}</span></td>
//                     <td>${emp.Cargo || 'Sin Cargo'}</td>
//                     <td class="text-center"><span class="badge ${badgeColor}">${emp.EstadoEmpleado || 'Desconocido'}</span></td>
//                     <td class="text-center">
//                         <button class="btn btn-sm btn-outline-primary me-1 btn-editar-empleado" data-id="${emp.Id}" title="Editar Empleado">
//                             <i class="fas fa-edit"></i>
//                         </button>
//                         <button class="btn btn-sm btn-outline-danger btn-borrar-empleado" data-id="${emp.Id}" data-nombre="${emp.Nombre} ${emp.Apellido}" title="Dar de Baja">
//                             <i class="fas fa-user-slash"></i>
//                         </button>
//                     </td>
//                 </tr>
//             `;
//         });
//         html += `</tbody></table>`;
//         $('#tabla-laboral-container').html(html);
//     };

//     const renderizarTablaPersonal = function (lista) {
//         if (!lista || lista.length === 0) {
//             $('#tabla-personal-container').html('<div class="alert alert-info text-center m-3">Sin datos personales.</div>');
//             return;
//         }

//         let html = `
//             <table class="table table-hover table-bordered align-middle mb-0">
//                 <thead class="table-secondary">
//                     <tr>
//                         <!--<th class="text-center">ID</th>-->
//                         <th>Apellido y Nombre</th>
//                         <th>CUIL</th>
//                         <th>Teléfono</th>
//                         <th>Email</th>
//                         <th>Domicilio</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//         `;
//         lista.forEach(emp => {
//             let domicilio = emp.Calle ? `${emp.Calle} ${emp.Numero || ''} ${emp.Piso ? 'Piso ' + emp.Piso : ''} ${emp.Dpto ? 'Dpto ' + emp.Dpto : ''}` : 'No registrado';
//             html += `
//                 <tr>
//                     <!--<td class="text-center fw-bold text-muted">#${emp.Id}</td>-->
//                     <td class="fw-bold">${emp.Apellido}, ${emp.Nombre}</td>
//                     <td><code class="text-dark">${emp.Cuil || '-'}</code></td>
//                     <td>${emp.Telefono || '-'}</td>
//                     <td>${emp.Email ? `<a href="mailto:${emp.Email}">${emp.Email}</a>` : '-'}</td>
//                     <td><small class="text-muted">${domicilio}</small></td>
//                 </tr>
//             `;
//         });
//         html += `</tbody></table>`;
//         $('#tabla-personal-container').html(html);
//     };

//     // 6. PREPARAR EDICIÓN DE EMPLEADO
//     const prepararEdicionEmpleado = function (id) {
//         estado.empleadoEditandoId = id;

//         const datosPersonales = estado.listaPersonales.find(x => x.Id === id);
//         const datosLaborales = estado.listaLaborales.find(x => x.Id === id);

//         if (!datosPersonales) return;

//         // Cargar Modal 1
//         $('#emp-nombre').val(datosPersonales.Nombre);
//         $('#emp-apellido').val(datosPersonales.Apellido);
//         $('#emp-cuil').val(datosPersonales.Cuil);
//         $('#emp-telefono').val(datosPersonales.Telefono);
//         $('#emp-email').val(datosPersonales.Email);
//         $('#emp-calle').val(datosPersonales.Calle);
//         $('#emp-numero').val(datosPersonales.Numero);
//         $('#emp-piso').val(datosPersonales.Piso);
//         $('#emp-dpto').val(datosPersonales.Dpto);

//         // Cargar Modal 2 (Buscamos coincidencias de ID por texto en los catálogos)
//         if (datosLaborales) {
//             $('#emp-estado').val(datosLaborales.EstadoEmpleado === 'Inactivo' ? '2' : '1');
            
//             const areaObj = estado.catAreas.find(x => x.Area === datosLaborales.Area);
//             if (areaObj) $('#emp-area').val(areaObj.Id);

//             const cargoObj = estado.catCargos.find(x => x.Cargo === datosLaborales.Cargo);
//             if (cargoObj) $('#emp-cargo').val(cargoObj.Id);

//             $('#emp-barrio').val('1'); // Barrio por defecto
//             $('#emp-fecha-ingreso').val(new Date().toISOString().split('T')[0]);
//         }

//         // Consultar a la API si tiene Legajo registrado
//         $.ajax({
//             url: `${URL_LEGAJO}/Empleado/${id}`,
//             type: 'GET',
//             success: function (legajo) {
//                 if (legajo) {
//                     estado.idLegajoExistente = legajo.Id_Legajo;
//                     $('#emp-tp-vinculacion').val(legajo.Id_Tipo_Vinculacion).trigger('change');
//                     $('#emp-numero-legajo').val(legajo.Numero_Legajo);
//                 }
//             },
//             error: function () {
//                 estado.idLegajoExistente = 0;
//                 $('#emp-tp-vinculacion').val('').trigger('change');
//             }
//         });

//         $('#titulo-modal-personal').html(`<i class="fas fa-user-edit me-2"></i> Editar Empleado #${id} - Paso 1: Personales`);
//         $('#titulo-modal-laboral').html(`<i class="fas fa-briefcase me-2"></i> Editar Empleado #${id} - Paso 2: Laborales`);

//         estado.modalInstanciaPersonal.show();
//     };

//     // 7. GUARDAR EMPLEADO + LEGAJO EN CASCADA
//     const guardarEmpleado = function () {
//         const idTpVinculacion = parseInt($('#emp-tp-vinculacion').val());
//         const numLegajo = $('#emp-numero-legajo').val().trim();

//         const empleadoData = {
//             Id: estado.empleadoEditandoId,
//             Apellido: $('#emp-apellido').val().trim(),
//             Nombre: $('#emp-nombre').val().trim(),
//             Cuil: $('#emp-cuil').val().trim(),
//             Telefono: $('#emp-telefono').val().trim(),
//             Email: $('#emp-email').val().trim(),
//             Calle: $('#emp-calle').val().trim(),
//             Numero: $('#emp-numero').val().trim(),
//             Piso: $('#emp-piso').val().trim(),
//             Dpto: $('#emp-dpto').val().trim(),

//             Fecha_Ingreso: $('#emp-fecha-ingreso').val(),
//             Id_Estado_Empleado: parseInt($('#emp-estado').val()),
//             Id_Area: parseInt($('#emp-area').val()),
//             Id_Cargo: parseInt($('#emp-cargo').val()),
//             Id_Barrio: parseInt($('#emp-barrio').val())
//         };

//         const esCreacion = estado.empleadoEditandoId === 0;
//         const tipoMetodo = esCreacion ? "POST" : "PUT";
//         const urlDestino = esCreacion ? URL_EMPLEADO : `${URL_EMPLEADO}/${estado.empleadoEditandoId}`;

//         $.ajax({
//             type: tipoMetodo,
//             url: urlDestino,
//             data: JSON.stringify(empleadoData),
//             contentType: "application/json; charset=utf-8",
//             success: function (response) {
//                 const idEmpleadoGuardado = esCreacion ? response.id : estado.empleadoEditandoId;

//                 // Si se completó el Legajo para "Contrato", procesamos el guardado de Legajo
//                 if (idTpVinculacion && numLegajo) {
//                     guardarLegajoAsociado(idEmpleadoGuardado, idTpVinculacion, numLegajo);
//                 } else {
//                     finalizarGuardadoExitosa(esCreacion);
//                 }
//             },
//             error: function (err) {
//                 console.error("Error al procesar empleado:", err);
//                 let msg = err.responseJSON && err.responseJSON.ExceptionMessage ? err.responseJSON.ExceptionMessage : 'No se pudo guardar el empleado.';
//                 Swal.fire('Error en la Operación', msg, 'error');
//             }
//         });
//     };

//     const guardarLegajoAsociado = function (idEmpleado, idTpVinculacion, numeroLegajo) {
//         const legajoData = {
//             Id_Legajo: estado.idLegajoExistente,
//             Numero_Legajo: numeroLegajo,
//             Estado_Legajo: true,
//             Id_Empleado: idEmpleado,
//             Id_Tipo_Vinculacion: idTpVinculacion
//         };

//         const esNuevoLegajo = estado.idLegajoExistente === 0;
//         const metodoLegajo = esNuevoLegajo ? "POST" : "PUT";
//         const urlLegajo = esNuevoLegajo ? URL_LEGAJO : `${URL_LEGAJO}/${estado.idLegajoExistente}`;

//         $.ajax({
//             type: metodoLegajo,
//             url: urlLegajo,
//             data: JSON.stringify(legajoData),
//             contentType: "application/json; charset=utf-8",
//             success: function () {
//                 finalizarGuardadoExitosa(estado.empleadoEditandoId === 0);
//             },
//             error: function (err) {
//                 console.error("Error al procesar legajo:", err);
//                 Swal.fire('Atención', 'El empleado fue guardado, pero ocurrió un problema al registrar el Legajo.', 'warning');
//                 finalizarGuardadoExitosa(false);
//             }
//         });
//     };

//     const finalizarGuardadoExitosa = function (esCreacion) {
//         estado.modalInstanciaLaboral.hide();
//         Swal.fire({
//             title: esCreacion ? '¡Empleado Registrado!' : '¡Empleado Actualizado!',
//             text: 'Los datos del personal y legajo fueron procesados correctamente.',
//             icon: 'success',
//             timer: 2000,
//             showConfirmButton: false
//         });

//         estado.empleadoEditandoId = 0;
//         estado.idLegajoExistente = 0;
//         cargarGrillaLaborales();
//         cargarGrillaPersonales();
//     };

//     const confirmarBajaLogica = function (id, nombreCompleto) {
//         Swal.fire({
//             title: '¿Confirmar Baja Lógica?',
//             text: `El empleado "${nombreCompleto}" (#${id}) pasará a estado INACTIVO.`,
//             icon: 'warning',
//             showCancelButton: true,
//             confirmButtonColor: '#dc3545',
//             confirmButtonText: 'Sí, dar de baja',
//             cancelButtonText: 'Cancelar'
//         }).then((result) => {
//             if (result.isConfirmed) {
//                 $.ajax({
//                     type: 'DELETE',
//                     url: `${URL_EMPLEADO}/${id}`,
//                     success: function (res) {
//                         Swal.fire('Baja Procesada', res.mensaje || 'El empleado fue inhabilitado.', 'success');
//                         cargarGrillaLaborales();
//                         cargarGrillaPersonales();
//                     }
//                 });
//             }
//         });
//     };

//     return {
//         cargarEn: inicializar
//     };
// })();
















// // /* ========================================================================
// //    SITMAS - Módulo de Personal: Gestión de Empleados (CRUD Completo)
// //    Arquitectura: Module Pattern (IIFE) + jQuery + Bootstrap 5 + SweetAlert2
// //    ======================================================================== */

// // const EmpleadoModulo = (function () {
// //     // 🔒 ESTADO PRIVADO DEL MÓDULO (Estado persistente de la SPA)
// //     let estado = {
// //         listaPersonales: [],
// //         listaLaborales: [],
// //         empleadoEditandoId: 0, // 0 = Modo Creación | > 0 = Modo Edición
// //         modalInstanciaPersonal: null,
// //         modalInstanciaLaboral: null
// //     };

// //     // Endpoints de tu API .NET Web API 2 refactorizada
// //     const URL_EMPLEADO = "https://localhost:44325/api/Empleado";

// //     // 1. INICIALIZACIÓN DEL MÓDULO
// //     const inicializar = function (contenedorId) {
// //         const contenedor = $(`#${contenedorId}`);

// //         // ESTRUCTURA DE LA INTERFAZ PRINCIPAL
// //         let htmlEstructura = `
// //             <div class="d-flex justify-content-between align-items-center mb-4 fade-in">
// //                 <div>
// //                     <h4 class="text-primary m-0 fw-bold"><i class="fas fa-users-cog"></i> Gestión de Empleados</h4>
// //                     <small class="text-muted">Administración centralizada del personal de planta SITMAS</small>
// //                 </div>
// //                 <button class="btn btn-success" id="btn-nuevo-empleado">
// //                     <i class="fas fa-plus-circle"></i> Registrar Nuevo Empleado
// //                 </button>
// //             </div>

// //             <!-- Pestañas para alternar vistas de la tabla -->
// //             <ul class="nav nav-pills mb-3 fade-in" id="pills-tab-empleados" role="tablist">
// //                 <li class="nav-item" role="presentation">
// //                     <button class="nav-link active fw-bold" id="pills-laboral-tab" data-bs-toggle="pill" data-bs-target="#pills-laboral" type="button" role="tab">
// //                         <i class="fas fa-briefcase me-1"></i> Datos Laborales
// //                     </button>
// //                 </li>
// //                 <li class="nav-item" role="presentation">
// //                     <button class="nav-link fw-bold" id="pills-personal-tab" data-bs-toggle="pill" data-bs-target="#pills-personal" type="button" role="tab">
// //                         <i class="fas fa-address-card me-1"></i> Datos Personales
// //                     </button>
// //                 </li>
// //             </ul>

// //             <!-- Contenedores Dinámicos de Tablas -->
// //             <div class="tab-content border-top pt-3 fade-in" id="pills-tabContentEmpleados">
// //                 <div class="tab-pane fade show active" id="pills-laboral" role="tabpanel">
// //                     <div id="tabla-laboral-container" class="table-responsive shadow-sm rounded">
// //                         <div class="text-center p-4"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Cargando datos laborales...</p></div>
// //                     </div>
// //                 </div>
// //                 <div class="tab-pane fade" id="pills-personal" role="tabpanel">
// //                     <div id="tabla-personal-container" class="table-responsive shadow-sm rounded">
// //                         <div class="text-center p-4"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Cargando datos personales...</p></div>
// //                     </div>
// //                 </div>
// //             </div>
// //         `;

// //         // Inyección de Modales Ocultos
// //         htmlEstructura += generarHTMLModales();

// //         contenedor.html(htmlEstructura);

// //         // Inicialización de instancias de Modales Bootstrap 5
// //         estado.modalInstanciaPersonal = new bootstrap.Modal(document.getElementById('modalEmpleadoPersonal'), { backdrop: 'static' });
// //         estado.modalInstanciaLaboral = new bootstrap.Modal(document.getElementById('modalEmpleadoLaboral'), { backdrop: 'static' });

// //         enlazarEventos();
        
// //         // Carga inicial de datos desde el backend
// //         cargarGrillaLaborales();
// //         cargarGrillaPersonales();
// //     };

// //     // 2. GENERADOR DE HTML DE MODALES (PASO 1 Y PASO 2)
// //     const generarHTMLModales = function () {
// //         return `
// //             <!-- MODAL 1: DATOS PERSONALES -->
// //             <div class="modal fade" id="modalEmpleadoPersonal" tabindex="-1" aria-hidden="true">
// //                 <div class="modal-dialog modal-lg">
// //                     <div class="modal-content">
// //                         <div class="modal-header bg-primary text-white">
// //                             <h5 class="modal-title" id="titulo-modal-personal">
// //                                 <i class="fas fa-id-card me-2"></i> Ficha Empleado - Paso 1: Datos Personales
// //                             </h5>
// //                             <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
// //                         </div>
// //                         <div class="modal-body">
// //                             <form id="form-empleado-personal">
// //                                 <div class="row g-3">
// //                                     <div class="col-md-6">
// //                                         <label class="form-label fw-bold">Nombre *</label>
// //                                         <input type="text" class="form-control" id="emp-nombre" required placeholder="Ej: Juan Antonio">
// //                                     </div>
// //                                     <div class="col-md-6">
// //                                         <label class="form-label fw-bold">Apellido *</label>
// //                                         <input type="text" class="form-control" id="emp-apellido" required placeholder="Ej: Pérez">
// //                                     </div>
// //                                     <div class="col-md-6">
// //                                         <label class="form-label fw-bold">CUIL *</label>
// //                                         <input type="text" class="form-control" id="emp-cuil" required placeholder="Ej: 20384920194">
// //                                     </div>
// //                                     <div class="col-md-6">
// //                                         <label class="form-label">Teléfono</label>
// //                                         <input type="text" class="form-control" id="emp-telefono" placeholder="Ej: 3513456789">
// //                                     </div>
// //                                     <div class="col-md-12">
// //                                         <label class="form-label">Correo Electrónico</label>
// //                                         <input type="email" class="form-control" id="emp-email" placeholder="ejemplo@sitmas.gob.ar">
// //                                     </div>
// //                                     <div class="col-12"><hr class="text-muted"><h6 class="text-secondary fw-bold"><i class="fas fa-home me-1"></i> Domicilio Residencia</h6></div>
// //                                     <div class="col-md-6">
// //                                         <label class="form-label">Calle</label>
// //                                         <input type="text" class="form-control" id="emp-calle" placeholder="Nombre de la calle">
// //                                     </div>
// //                                     <div class="col-md-2">
// //                                         <label class="form-label">Número</label>
// //                                         <input type="text" class="form-control" id="emp-numero" placeholder="1234">
// //                                     </div>
// //                                     <div class="col-md-2">
// //                                         <label class="form-label">Piso</label>
// //                                         <input type="text" class="form-control" id="emp-piso" placeholder="2">
// //                                     </div>
// //                                     <div class="col-md-2">
// //                                         <label class="form-label">Dpto</label>
// //                                         <input type="text" class="form-control" id="emp-dpto" placeholder="B">
// //                                     </div>
// //                                 </div>
// //                             </form>
// //                         </div>
// //                         <div class="modal-footer">
// //                             <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
// //                             <button type="button" class="btn btn-primary" id="btn-siguiente-modal">
// //                                 Siguiente <i class="fas fa-arrow-right ms-1"></i>
// //                             </button>
// //                         </div>
// //                     </div>
// //                 </div>
// //             </div>

// //             <!-- MODAL 2: DATOS LABORALES -->
// //             <div class="modal fade" id="modalEmpleadoLaboral" tabindex="-1" aria-hidden="true">
// //                 <div class="modal-dialog modal-lg">
// //                     <div class="modal-content">
// //                         <div class="modal-header bg-info text-dark">
// //                             <h5 class="modal-title" id="titulo-modal-laboral">
// //                                 <i class="fas fa-briefcase me-2"></i> Ficha Empleado - Paso 2: Datos Laborales
// //                             </h5>
// //                             <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
// //                         </div>
// //                         <div class="modal-body">
// //                             <form id="form-empleado-laboral">
// //                                 <div class="row g-3">
// //                                     <div class="col-md-6">
// //                                         <label class="form-label fw-bold">Fecha de Ingreso *</label>
// //                                         <input type="date" class="form-control" id="emp-fecha-ingreso" required>
// //                                     </div>
// //                                     <div class="col-md-6">
// //                                         <label class="form-label fw-bold">Estado Empleado *</label>
// //                                         <select class="form-select" id="emp-estado" required>
// //                                             <option value="1">Activo</option>
// //                                             <option value="2">Inactivo</option>
// //                                             <option value="3">Licencia</option>
// //                                         </select>
// //                                     </div>
// //                                     <div class="col-md-4">
// //                                         <label class="form-label fw-bold">Área de Trabajo *</label>
// //                                         <select class="form-select" id="emp-area" required>
// //                                             <option value="1">Logística</option>
// //                                             <option value="2">Clasificación</option>
// //                                             <option value="3">Administración</option>
// //                                         </select>
// //                                     </div>
// //                                     <div class="col-md-4">
// //                                         <label class="form-label fw-bold">Cargo Desempeñado *</label>
// //                                         <select class="form-select" id="emp-cargo" required>
// //                                             <option value="1">Camionero</option>
// //                                             <option value="2">Operario</option>
// //                                             <option value="3">Supervisor</option>
// //                                         </select>
// //                                     </div>
// //                                     <div class="col-md-4">
// //                                         <label class="form-label fw-bold">Barrio *</label>
// //                                         <select class="form-select" id="emp-barrio" required>
// //                                             <option value="1">Centro</option>
// //                                             <option value="2">Zona Norte</option>
// //                                             <option value="3">Zona Sur</option>
// //                                         </select>
// //                                     </div>
// //                                 </div>
// //                             </form>
// //                         </div>
// //                         <div class="modal-footer">
// //                             <button type="button" class="btn btn-secondary" id="btn-volver-modal">
// //                                 <i class="fas fa-arrow-left me-1"></i> Volver
// //                             </button>
// //                             <button type="button" class="btn btn-success" id="btn-guardar-empleado">
// //                                 <i class="fas fa-save me-1"></i> Guardar Registro
// //                             </button>
// //                         </div>
// //                     </div>
// //                 </div>
// //             </div>
// //         `;
// //     };

// //     // 3. ENLACE SEGURO DE EVENTOS DE INTERFAZ
// //     const enlazarEventos = function () {
// //         const principal = $('#contenedor-dinamico-crud-personal');

// //         // Botón "Registrar Nuevo Empleado"
// //         principal.off('click', '#btn-nuevo-empleado').on('click', '#btn-nuevo-empleado', function () {
// //             estado.empleadoEditandoId = 0; // Se establece en modo Creación
// //             $('#form-empleado-personal')[0].reset();
// //             $('#form-empleado-laboral')[0].reset();
            
// //             $('#titulo-modal-personal').html('<i class="fas fa-user-plus me-2"></i> Nuevo Empleado - Paso 1: Datos Personales');
// //             $('#titulo-modal-laboral').html('<i class="fas fa-briefcase me-2"></i> Nuevo Empleado - Paso 2: Datos Laborales');
            
// //             estado.modalInstanciaPersonal.show();
// //         });

// //         // Evento Siguiente: Validar Modal 1 -> Mostrar Modal 2
// //         principal.off('click', '#btn-siguiente-modal').on('click', '#btn-siguiente-modal', function () {
// //             if ($('#form-empleado-personal')[0].checkValidity()) {
// //                 estado.modalInstanciaPersonal.hide();
// //                 setTimeout(() => { estado.modalInstanciaLaboral.show(); }, 350);
// //             } else {
// //                 $('#form-empleado-personal')[0].reportValidity();
// //             }
// //         });

// //         // Evento Volver: Ocultar Modal 2 -> Mostrar Modal 1
// //         principal.off('click', '#btn-volver-modal').on('click', '#btn-volver-modal', function () {
// //             estado.modalInstanciaLaboral.hide();
// //             setTimeout(() => { estado.modalInstanciaPersonal.show(); }, 350);
// //         });

// //         // Botón Guardar Definitivo
// //         principal.off('click', '#btn-guardar-empleado').on('click', '#btn-guardar-empleado', function () {
// //             if ($('#form-empleado-laboral')[0].checkValidity()) {
// //                 guardarEmpleado();
// //             } else {
// //                 $('#form-empleado-laboral')[0].reportValidity();
// //             }
// //         });

// //         // Delegación de Evento: Botón Editar en la Grilla
// //         principal.off('click', '.btn-editar-empleado').on('click', '.btn-editar-empleado', function () {
// //             const id = parseInt($(this).data('id'));
// //             prepararEdicionEmpleado(id);
// //         });

// //         // Delegación de Evento: Botón Borrar/Baja en la Grilla
// //         principal.off('click', '.btn-borrar-empleado').on('click', '.btn-borrar-empleado', function () {
// //             const id = parseInt($(this).data('id'));
// //             const nombre = $(this).data('nombre');
// //             confirmarBajaLogica(id, nombre);
// //         });
// //     };

// //     // 4. MÉTODOS AJAX DE LECTURA (GET)
// //     const cargarGrillaLaborales = function () {
// //         $.ajax({
// //             url: `${URL_EMPLEADO}/laborales`,
// //             type: 'GET',
// //             success: function (data) {
// //                 estado.listaLaborales = data || [];
// //                 renderizarTablaLaboral(estado.listaLaborales);
// //             },
// //             error: function (err) {
// //                 console.error("Error al obtener datos laborales:", err);
// //                 $('#tabla-laboral-container').html('<div class="alert alert-danger m-3">Error al conectar con la API de datos laborales.</div>');
// //             }
// //         });
// //     };

// //     const cargarGrillaPersonales = function () {
// //         $.ajax({
// //             url: `${URL_EMPLEADO}/personales`,
// //             type: 'GET',
// //             success: function (data) {
// //                 estado.listaPersonales = data || [];
// //                 renderizarTablaPersonal(estado.listaPersonales);
// //             },
// //             error: function (err) {
// //                 console.error("Error al obtener datos personales:", err);
// //             }
// //         });
// //     };

// //     // 5. RENDERIZADO DE TABLAS HTML
// //     const renderizarTablaLaboral = function (lista) {
// //         if (!lista || lista.length === 0) {
// //             $('#tabla-laboral-container').html('<div class="alert alert-info text-center m-3"><i class="fas fa-info-circle me-1"></i> No hay registros de empleados cargados.</div>');
// //             return;
// //         }

// //         let html = `
// //             <table class="table table-hover table-bordered align-middle mb-0">
// //                 <thead class="table-dark">
// //                     <tr>
// //                         <th class="text-center">ID</th>
// //                         <th>Apellido y Nombre</th>
// //                         <th>Área</th>
// //                         <th>Cargo</th>
// //                         <th class="text-center">Estado</th>
// //                         <th class="text-center">Acciones</th>
// //                     </tr>
// //                 </thead>
// //                 <tbody>
// //         `;

// //         lista.forEach(emp => {
// //             let badgeColor = emp.EstadoEmpleado === 'Activo' ? 'bg-success' : (emp.EstadoEmpleado === 'Inactivo' ? 'bg-danger' : 'bg-warning text-dark');
            
// //             html += `
// //                 <tr>
// //                     <td class="text-center fw-bold text-secondary">#${emp.Id}</td>
// //                     <td class="fw-bold">${emp.Apellido}, ${emp.Nombre}</td>
// //                     <td><span class="badge bg-light text-dark border">${emp.Area || 'Sin Área'}</span></td>
// //                     <td>${emp.Cargo || 'Sin Cargo'}</td>
// //                     <td class="text-center"><span class="badge ${badgeColor}">${emp.EstadoEmpleado || 'Desconocido'}</span></td>
// //                     <td class="text-center">
// //                         <button class="btn btn-sm btn-outline-primary me-1 btn-editar-empleado" data-id="${emp.Id}" title="Editar Empleado">
// //                             <i class="fas fa-edit"></i>
// //                         </button>
// //                         <button class="btn btn-sm btn-outline-danger btn-borrar-empleado" data-id="${emp.Id}" data-nombre="${emp.Nombre} ${emp.Apellido}" title="Dar de Baja">
// //                             <i class="fas fa-user-slash"></i>
// //                         </button>
// //                     </td>
// //                 </tr>
// //             `;
// //         });
// //         html += `</tbody></table>`;
// //         $('#tabla-laboral-container').html(html);
// //     };

// //     const renderizarTablaPersonal = function (lista) {
// //         if (!lista || lista.length === 0) {
// //             $('#tabla-personal-container').html('<div class="alert alert-info text-center m-3">Sin datos personales.</div>');
// //             return;
// //         }

// //         let html = `
// //             <table class="table table-hover table-bordered align-middle mb-0">
// //                 <thead class="table-secondary">
// //                     <tr>
// //                         <th class="text-center">ID</th>
// //                         <th>Apellido y Nombre</th>
// //                         <th>CUIL</th>
// //                         <th>Teléfono</th>
// //                         <th>Email</th>
// //                         <th>Domicilio</th>
// //                     </tr>
// //                 </thead>
// //                 <tbody>
// //         `;
// //         lista.forEach(emp => {
// //             let domicilio = emp.Calle ? `${emp.Calle} ${emp.Numero || ''} ${emp.Piso ? 'Piso ' + emp.Piso : ''} ${emp.Dpto ? 'Dpto ' + emp.Dpto : ''}` : 'No registrado';
// //             html += `
// //                 <tr>
// //                     <td class="text-center fw-bold text-muted">#${emp.Id}</td>
// //                     <td class="fw-bold">${emp.Apellido}, ${emp.Nombre}</td>
// //                     <td><code class="text-dark">${emp.Cuil || '-'}</code></td>
// //                     <td>${emp.Telefono || '-'}</td>
// //                     <td>${emp.Email ? `<a href="mailto:${emp.Email}">${emp.Email}</a>` : '-'}</td>
// //                     <td><small class="text-muted">${domicilio}</small></td>
// //                 </tr>
// //             `;
// //         });
// //         html += `</tbody></table>`;
// //         $('#tabla-personal-container').html(html);
// //     };

// //     // 6. LÓGICA DE EDICIÓN: PRECARGA DE DATOS EN FORMULARIOS
// //     const prepararEdicionEmpleado = function (id) {
// //         estado.empleadoEditandoId = id; // Fijamos el ID en edición

// //         // Buscamos los datos en las listas en memoria
// //         const datosPersonales = estado.listaPersonales.find(x => x.Id === id);
// //         const datosLaborales = estado.listaLaborales.find(x => x.Id === id);

// //         if (!datosPersonales) {
// //             Swal.fire('Atención', 'No se pudieron recuperar los datos personales del empleado.', 'warning');
// //             return;
// //         }

// //         // 1. Cargar Datos Personales (Modal 1)
// //         $('#emp-nombre').val(datosPersonales.Nombre);
// //         $('#emp-apellido').val(datosPersonales.Apellido);
// //         $('#emp-cuil').val(datosPersonales.Cuil);
// //         $('#emp-telefono').val(datosPersonales.Telefono);
// //         $('#emp-email').val(datosPersonales.Email);
// //         $('#emp-calle').val(datosPersonales.Calle);
// //         $('#emp-numero').val(datosPersonales.Numero);
// //         $('#emp-piso').val(datosPersonales.Piso);
// //         $('#emp-dpto').val(datosPersonales.Dpto);

// //         // 2. Cargar Datos Laborales (Modal 2)
// //         if (datosLaborales) {
// //             // Seteos de combos (Por defecto o mapeo)
// //             $('#emp-estado').val(datosLaborales.EstadoEmpleado === 'Inactivo' ? '2' : '1');
// //             // Nota: Aquí se asignan los valores seleccionados para combos
// //             $('#emp-area').val('1'); 
// //             $('#emp-cargo').val('1');
// //             $('#emp-barrio').val('1');
            
// //             // Fecha actual por defecto si no viene mapeada
// //             const hoy = new Date().toISOString().split('T')[0];
// //             $('#emp-fecha-ingreso').val(hoy);
// //         }

// //         // Títulos dinámicos de los modales
// //         $('#titulo-modal-personal').html(`<i class="fas fa-user-edit me-2"></i> Editar Empleado #${id} - Paso 1: Personales`);
// //         $('#titulo-modal-laboral').html(`<i class="fas fa-briefcase me-2"></i> Editar Empleado #${id} - Paso 2: Laborales`);

// //         // Abrir Modal 1
// //         estado.modalInstanciaPersonal.show();
// //     };

// //     // 7. MÉTODOS AJAX DE ESCRITURA (POST / PUT / DELETE)
// //     const guardarEmpleado = function () {
// //         const empleadoData = {
// //             Id: estado.empleadoEditandoId,
// //             Apellido: $('#emp-apellido').val().trim(),
// //             Nombre: $('#emp-nombre').val().trim(),
// //             Cuil: $('#emp-cuil').val().trim(),
// //             Telefono: $('#emp-telefono').val().trim(),
// //             Email: $('#emp-email').val().trim(),
// //             Calle: $('#emp-calle').val().trim(),
// //             Numero: $('#emp-numero').val().trim(),
// //             Piso: $('#emp-piso').val().trim(),
// //             Dpto: $('#emp-dpto').val().trim(),

// //             Fecha_Ingreso: $('#emp-fecha-ingreso').val(),
// //             Id_Estado_Empleado: parseInt($('#emp-estado').val()),
// //             Id_Area: parseInt($('#emp-area').val()),
// //             Id_Cargo: parseInt($('#emp-cargo').val()),
// //             Id_Barrio: parseInt($('#emp-barrio').val())
// //         };

// //         // Determinación dinámica del verbo HTTP y Endpoint
// //         const esCreacion = estado.empleadoEditandoId === 0;
// //         const tipoMetodo = esCreacion ? "POST" : "PUT";
// //         const urlDestino = esCreacion ? URL_EMPLEADO : `${URL_EMPLEADO}/${estado.empleadoEditandoId}`;

// //         $.ajax({
// //             type: tipoMetodo,
// //             url: urlDestino,
// //             data: JSON.stringify(empleadoData),
// //             contentType: "application/json; charset=utf-8",
// //             success: function (response) {
// //                 estado.modalInstanciaLaboral.hide();
                
// //                 Swal.fire({
// //                     title: esCreacion ? '¡Empleado Registrado!' : '¡Empleado Actualizado!',
// //                     text: response.mensaje || 'La operación se completó exitosamente.',
// //                     icon: 'success',
// //                     timer: 2000,
// //                     showConfirmButton: false
// //                 });

// //                 // Limpieza de estado y actualización sincrónica
// //                 estado.empleadoEditandoId = 0;
// //                 cargarGrillaLaborales();
// //                 cargarGrillaPersonales();
// //             },
// //             error: function (err) {
// //                 console.error("Error al procesar empleado:", err);
// //                 let msg = err.responseJSON && err.responseJSON.ExceptionMessage ? err.responseJSON.ExceptionMessage : 'No se pudo guardar la información.';
// //                 Swal.fire('Error en la Operación', msg, 'error');
// //             }
// //         });
// //     };

// //     const confirmarBajaLogica = function (id, nombreCompleto) {
// //         Swal.fire({
// //             title: '¿Confirmar Baja Lógica?',
// //             text: `El empleado "${nombreCompleto}" (#${id}) pasará a estado INACTIVO. Se preservará todo su historial de pesajes y clasificación.`,
// //             icon: 'warning',
// //             showCancelButton: true,
// //             confirmButtonColor: '#dc3545',
// //             cancelButtonColor: '#6c757d',
// //             confirmButtonText: 'Sí, dar de baja',
// //             cancelButtonText: 'Cancelar'
// //         }).then((result) => {
// //             if (result.isConfirmed) {
// //                 $.ajax({
// //                     type: 'DELETE',
// //                     url: `${URL_EMPLEADO}/${id}`,
// //                     success: function (res) {
// //                         Swal.fire('Baja Procesada', res.mensaje || 'El empleado fue inhabilitado correctamente.', 'success');
// //                         cargarGrillaLaborales();
// //                         cargarGrillaPersonales();
// //                     },
// //                     error: function (err) {
// //                         console.error("Error en la baja:", err);
// //                         Swal.fire('Error', 'No se pudo registrar la baja lógica.', 'error');
// //                     }
// //                 });
// //             }
// //         });
// //     };

// //     // API Pública expuesta por el Módulo
// //     return {
// //         cargarEn: inicializar
// //     };
// // })();