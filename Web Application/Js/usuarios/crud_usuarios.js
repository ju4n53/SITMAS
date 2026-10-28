/* ========================================================================
   SITMAS - Módulo de Seguridad: Alta de Usuarios y Registros Recientes
   Arquitectura: Module Pattern (IIFE) + jQuery + Bootstrap 5 + SweetAlert2
   ======================================================================== */

const UsuarioModulo = (function () {
    // 🔒 ESTADO PRIVADO DEL MÓDULO
    let estado = {
        listaUsuariosRecientes: [],
        catEmpleadosDisponibles: [],
        catRolesLegitimos: [],
        modalInstancia: null
    };

    // Endpoints de la Web API SITMAS
    const URL_USUARIO = "https://localhost:44325/api/Usuario";
    const URL_USUARIO_ROL = "https://localhost:44325/api/Usuario_Rol";
    const URL_EMPLEADO = "https://localhost:44325/api/Empleado/personales";
    const URL_ROLES = "https://localhost:44325/api/Roles";

    // 1. INICIALIZACIÓN DEL MÓDULO
    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <div class="d-flex justify-content-between align-items-center mb-4 fade-in">
                <div>
                    <h4 class="text-primary m-0 fw-bold"><i class="fas fa-user-plus"></i> Registrar Nueva Cuenta de Usuario</h4>
                    <small class="text-muted">Asignación de credenciales y roles validados por el sistema SITMAS</small>
                </div>
                <button class="btn btn-success btn-lg shadow-sm" id="btn-nuevo-usuario">
                    <i class="fas fa-plus-circle me-1"></i> Crear Usuario
                </button>
            </div>

            <!-- CARD DE REGISTROS RECIENTES (ÚLTIMOS 5) -->
            <div class="card shadow-sm border-0 fade-in">
                <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center py-3">
                    <h6 class="m-0 fw-bold"><i class="fas fa-history me-2"></i> ÚLTIMAS 5 CUENTAS CREADAS (RECIENTES)</h6>
                    <span class="badge bg-primary">Vista Rápida</span>
                </div>
                <div class="card-body p-0">
                    <div id="tabla-recientes-container" class="table-responsive">
                        <div class="text-center p-4"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Cargando registros recientes...</p></div>
                    </div>
                </div>
            </div>
        `;

        htmlEstructura += generarHTMLModal();
        contenedor.html(htmlEstructura);

        estado.modalInstancia = new bootstrap.Modal(document.getElementById('modalUsuarioAlta'), { backdrop: 'static' });

        enlazarEventos();

        // Carga síncrona de catálogos y tabla rápida
        cargarCatalogosYRecientes();
    };

    // 2. MODAL EXCLUSIVO PARA CREACIÓN
    const generarHTMLModal = function () {
        return `
            <div class="modal fade" id="modalUsuarioAlta" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="titulo-modal-usuario">
                                <i class="fas fa-user-lock me-2"></i> Nueva Cuenta de Usuario
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="form-usuario-alta">
                                <div class="row g-3">
                                    <div class="col-12">
                                        <label class="form-label fw-bold text-primary">Empleado Asignado (Sin usuario activo) *</label>
                                        <select class="form-select" id="usr-empleado" required>
                                            <option value="">Cargando empleados disponibles...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-12">
                                        <label class="form-label fw-bold">Nombre de Usuario (Login) *</label>
                                        <input type="text" class="form-control" id="usr-nombre" required placeholder="Ej: jperez">
                                    </div>
                                    <div class="col-md-12">
                                        <label class="form-label fw-bold">Contraseña *</label>
                                        <div class="input-group">
                                            <input type="password" class="form-control" id="usr-password" required placeholder="Escriba la clave inicial">
                                            <button class="btn btn-outline-secondary" type="button" id="btn-toggle-pass">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12"><hr class="text-muted"></div>

                                    <div class="col-md-6">
                                        <label class="form-label fw-bold">Rol Legitimado *</label>
                                        <select class="form-select" id="usr-rol" required>
                                            <option value="">Cargando roles del sistema...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label fw-bold">Estado Inicial *</label>
                                        <select class="form-select" id="usr-estado" required>
                                            <option value="1">Activo</option>
                                            <option value="2">Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer bg-light">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-success" id="btn-guardar-usuario">
                                <i class="fas fa-save me-1"></i> Guardar Usuario
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    // 3. CARGA DE CATÁLOGOS CON FILTRADO DE EMPLEADOS SIN USUARIO
    const cargarCatalogosYRecientes = function () {
        return $.when(
            $.ajax({ url: URL_USUARIO, type: 'GET' }),
            $.ajax({ url: URL_EMPLEADO, type: 'GET' }),
            $.ajax({ url: URL_ROLES, type: 'GET' })
        ).done(function (resUsuarios, resEmpleados, resRoles) {
            const todosLosUsuarios = resUsuarios[0] || [];
            const todosLosEmpleados = resEmpleados[0] || [];
            estado.catRolesLegitimos = resRoles[0] || [];

            // REGLA DE NEGOCIO: Filtrar empleados que NO tienen usuario asignado
            const idsEmpleadosConUsuario = todosLosUsuarios.map(u => u.Id_Empleado);
            estado.catEmpleadosDisponibles = todosLosEmpleados.filter(emp => !idsEmpleadosConUsuario.includes(emp.Id));

            // Cargar combos
            poblarComboEmpleados('#usr-empleado', estado.catEmpleadosDisponibles);
            poblarComboGenerico('#usr-rol', estado.catRolesLegitimos, 'Id', 'NombreRol', 'Seleccione un Rol');

            // Renderizar solo los últimos 5 usuarios creados
            estado.listaUsuariosRecientes = todosLosUsuarios.slice(-5).reverse();
            renderizarTablaRecientes(estado.listaUsuariosRecientes);

        }).fail(function (err) {
            console.error("Error al obtener datos:", err);
            Swal.fire('Error', 'No se pudieron consultar los catálogos de usuarios y roles.', 'error');
        });
    };

    const poblarComboEmpleados = function (selector, lista) {
        let select = $(selector);
        select.empty().append(`<option value="">-- Seleccione un Empleado disponible (${lista.length}) --</option>`);
        lista.forEach(emp => {
            select.append(`<option value="${emp.Id}">${emp.Apellido}, ${emp.Nombre} (CUIL: ${emp.Cuil || 'S/D'})</option>`);
        });
    };

    const poblarComboGenerico = function (selector, lista, propVal, propTexto, placeholder) {
        let select = $(selector);
        select.empty().append(`<option value="">-- ${placeholder} --</option>`);
        lista.forEach(item => {
            select.append(`<option value="${item[propVal]}">${item[propTexto]}</option>`);
        });
    };

    // 4. TABLA DE 5 REGISTROS RECIENTES
    const renderizarTablaRecientes = function (lista) {
        if (!lista || lista.length === 0) {
            $('#tabla-recientes-container').html('<div class="alert alert-info text-center m-3">No hay cuentas de usuario registradas recientemente.</div>');
            return;
        }

        let html = `
            <table class="table table-hover align-middle mb-0">
                <thead class="table-secondary">
                    <tr>
                        <th class="ps-3">ID</th>
                        <th>Usuario (Login)</th>
                        <th>Empleado Vinculado</th>
                        <th>Rol Asignado</th>
                        <th class="text-center">Estado</th>
                    </tr>
                </thead>
                <tbody>
        `;

        lista.forEach(usr => {
            let badgeColor = usr.EstadoUsuario === 'Activo' ? 'bg-success' : 'bg-danger';
            html += `
                <tr>
                    <td class="ps-3 fw-bold text-muted">#${usr.Id}</td>
                    <td class="fw-bold text-primary"><i class="fas fa-user-circle me-1"></i> ${usr.Usuario}</td>
                    <td>${usr.NombreEmpleado}</td>
                    <td><span class="badge bg-info text-dark">${usr.NombreRol}</span></td>
                    <td class="text-center"><span class="badge ${badgeColor}">${usr.EstadoUsuario}</span></td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        $('#tabla-recientes-container').html(html);
    };

    // 5. EVENTOS
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-crud-usuarios');

        principal.off('click', '#btn-toggle-pass').on('click', '#btn-toggle-pass', function () {
            let input = $('#usr-password');
            let icon = $(this).find('i');
            if (input.attr('type') === 'password') {
                input.attr('type', 'text');
                icon.removeClass('fa-eye').addClass('fa-eye-slash');
            } else {
                input.attr('type', 'password');
                icon.removeClass('fa-eye-slash').addClass('fa-eye');
            }
        });

        principal.off('click', '#btn-nuevo-usuario').on('click', '#btn-nuevo-usuario', function () {
            $('#form-usuario-alta')[0].reset();
            estado.modalInstancia.show();
        });

        principal.off('click', '#btn-guardar-usuario').on('click', '#btn-guardar-usuario', function () {
            if ($('#form-usuario-alta')[0].checkValidity()) {
                guardarUsuario();
            } else {
                $('#form-usuario-alta')[0].reportValidity();
            }
        });
    };

    // 6. GUARDADO DE USUARIO + ASIGNACIÓN DE ROL LEGÍTIMO
    const guardarUsuario = function () {
        const usrData = {
            Usuario: $('#usr-nombre').val().trim(),
            Password: $('#usr-password').val().trim(),
            Id_Empleado: parseInt($('#usr-empleado').val()),
            Id_Estado_Usuario: parseInt($('#usr-estado').val())
        };

        const idRolSeleccionado = parseInt($('#usr-rol').val());

        $.ajax({
            type: "POST",
            url: URL_USUARIO,
            data: JSON.stringify(usrData),
            contentType: "application/json; charset=utf-8",
            success: function (response) {
                // Guardado en cascada del Rol
                asignarRolEnCascada(response.id, idRolSeleccionado);
            },
            error: function (err) {
                let msg = err.responseJSON && err.responseJSON.Message ? err.responseJSON.Message : 'No se pudo crear el usuario.';
                Swal.fire('Atención', msg, 'warning');
            }
        });
    };

    const asignarRolEnCascada = function (idUsuario, idRol) {
        $.ajax({
            type: "POST",
            url: `${URL_USUARIO_ROL}/Asignar`,
            data: JSON.stringify({ Id_Usuario: idUsuario, Id_Rol: idRol }),
            contentType: "application/json; charset=utf-8",
            success: function () {
                estado.modalInstancia.hide();
                Swal.fire('¡Usuario Creado!', 'La cuenta fue registrada con su rol asignado exitosamente.', 'success');
                cargarCatalogosYRecientes(); // Recarga combos y los 5 recientes
            },
            error: function () {
                estado.modalInstancia.hide();
                Swal.fire('Atención', 'Usuario registrado, pero ocurrió un problema al asignar el rol.', 'warning');
                cargarCatalogosYRecientes();
            }
        });
    };

    return {
        cargarEn: inicializar
    };
})();









// /* ========================================================================
//    SITMAS - Módulo de Seguridad: Gestión de Usuarios y Roles
//    Arquitectura: Module Pattern (IIFE) + jQuery + Bootstrap 5 + SweetAlert2
//    ======================================================================== */

// const UsuarioModulo = (function () {
//     // 🔒 ESTADO PRIVADO DEL MÓDULO
//     let estado = {
//         listaUsuarios: [],
//         catEmpleados: [],
//         catRoles: [], // Asumimos que tienes una tabla/endpoint de Roles
//         usuarioEditandoId: 0,
//         modalInstancia: null
//     };

//     // Endpoints de la Web API SITMAS
//     const URL_USUARIO = "https://localhost:44325/api/Usuario";
//     const URL_USUARIO_ROL = "https://localhost:44325/api/Usuario_Rol";
//     const URL_EMPLEADO = "https://localhost:44325/api/Empleado/personales";
    
//     // NOTA PARA EL ESTUDIANTE: Si no tienes el endpoint de Roles creado aún, 
//     // te mostraré cómo inyectarlos temporalmente más abajo.
//     const URL_ROL = "https://localhost:44325/api/Rol"; 

//     // 1. INICIALIZACIÓN DEL MÓDULO
//     const inicializar = function (contenedorId) {
//         const contenedor = $(`#${contenedorId}`);

//         let htmlEstructura = `
//             <div class="d-flex justify-content-between align-items-center mb-4 fade-in">
//                 <div>
//                     <h4 class="text-primary m-0 fw-bold"><i class="fas fa-user-shield"></i> Gestión de Accesos y Usuarios</h4>
//                     <small class="text-muted">Administración de credenciales y roles del sistema SITMAS</small>
//                 </div>
//                 <button class="btn btn-success" id="btn-nuevo-usuario">
//                     <i class="fas fa-plus-circle"></i> Nuevo Usuario
//                 </button>
//             </div>

//             <div class="card shadow-sm border-0 fade-in">
//                 <div class="card-body p-0">
//                     <div id="tabla-usuarios-container" class="table-responsive">
//                         <div class="text-center p-4"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Cargando cuentas de usuario...</p></div>
//                     </div>
//                 </div>
//             </div>
//         `;

//         htmlEstructura += generarHTMLModal();
//         contenedor.html(htmlEstructura);

//         estado.modalInstancia = new bootstrap.Modal(document.getElementById('modalUsuario'), { backdrop: 'static' });

//         enlazarEventos();

//         // Carga simultánea de catálogos y tabla principal
//         cargarCatalogosAuxiliares().then(() => {
//             cargarGrillaUsuarios();
//         });
//     };

//     // 2. MODAL ÚNICO DE GESTIÓN DE USUARIO
//     const generarHTMLModal = function () {
//         return `
//             <div class="modal fade" id="modalUsuario" tabindex="-1" aria-hidden="true">
//                 <div class="modal-dialog">
//                     <div class="modal-content">
//                         <div class="modal-header bg-dark text-white">
//                             <h5 class="modal-title" id="titulo-modal-usuario">
//                                 <i class="fas fa-user-lock me-2"></i> Cuenta de Usuario
//                             </h5>
//                             <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
//                         </div>
//                         <div class="modal-body">
//                             <form id="form-usuario">
//                                 <div class="row g-3">
//                                     <div class="col-12">
//                                         <label class="form-label fw-bold text-primary">Empleado Asociado *</label>
//                                         <select class="form-select" id="usr-empleado" required>
//                                             <option value="">Cargando empleados...</option>
//                                         </select>
//                                     </div>
//                                     <div class="col-md-12">
//                                         <label class="form-label fw-bold">Nombre de Usuario (Login) *</label>
//                                         <input type="text" class="form-control bg-light" id="usr-nombre" required placeholder="Ej: jperez">
//                                     </div>
//                                     <div class="col-md-12">
//                                         <label class="form-label fw-bold">Contraseña <span id="req-pass" class="text-danger">*</span></label>
//                                         <div class="input-group">
//                                             <input type="password" class="form-control" id="usr-password" required placeholder="Escriba una contraseña segura">
//                                             <button class="btn btn-outline-secondary" type="button" id="btn-toggle-pass">
//                                                 <i class="fas fa-eye"></i>
//                                             </button>
//                                         </div>
//                                         <small class="text-muted" id="help-pass">Debe ingresar una contraseña inicial.</small>
//                                     </div>
                                    
//                                     <div class="col-12"><hr class="text-muted"></div>

//                                     <div class="col-md-6">
//                                         <label class="form-label fw-bold">Rol en el Sistema *</label>
//                                         <select class="form-select" id="usr-rol" required>
//                                             <option value="">Cargando roles...</option>
//                                         </select>
//                                     </div>
//                                     <div class="col-md-6">
//                                         <label class="form-label fw-bold">Estado de Cuenta *</label>
//                                         <select class="form-select" id="usr-estado" required>
//                                             <option value="1">Activo</option>
//                                             <option value="2">Inactivo / Bloqueado</option>
//                                         </select>
//                                     </div>
//                                 </div>
//                             </form>
//                         </div>
//                         <div class="modal-footer bg-light">
//                             <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
//                             <button type="button" class="btn btn-success" id="btn-guardar-usuario">
//                                 <i class="fas fa-save me-1"></i> Guardar Credenciales
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;
//     };

//     // 3. CARGA DE CATÁLOGOS (Empleados y Roles)
//     const cargarCatalogosAuxiliares = function () {
//         // En un escenario real llamarías también a $.ajax({ url: URL_ROL, type: 'GET' })
//         // Aquí simulamos que los roles ya están cargados si el endpoint no existe aún.
        
//         return $.when(
//             $.ajax({ url: URL_EMPLEADO, type: 'GET' })
//         ).done(function (resEmpleados) {
//             estado.catEmpleados = resEmpleados || [];
            
//             // Mockeamos los roles en caso de no tener endpoint aún (Cámbialo si ya lo tienes)
//             estado.catRoles = [
//                 { Id: 1, Rol: 'Administrador' },
//                 { Id: 2, Rol: 'Operador Logística' },
//                 { Id: 3, Rol: 'Clasificador' }
//             ];

//             poblarComboEmpleados('#usr-empleado', estado.catEmpleados);
//             poblarComboGenerico('#usr-rol', estado.catRoles, 'Id', 'Rol', 'Seleccione un Rol');
//         }).fail(function (err) {
//             console.error("Error al cargar auxiliares:", err);
//             Swal.fire('Error', 'No se pudieron cargar las listas de empleados.', 'error');
//         });
//     };

//     const poblarComboEmpleados = function (selector, lista) {
//         let select = $(selector);
//         select.empty().append(`<option value="">-- Seleccione el Empleado --</option>`);
//         lista.forEach(emp => {
//             select.append(`<option value="${emp.Id}">${emp.Apellido}, ${emp.Nombre} (DNI/CUIL: ${emp.Cuil})</option>`);
//         });
//     };

//     const poblarComboGenerico = function (selector, lista, propVal, propTexto, placeholder) {
//         let select = $(selector);
//         select.empty().append(`<option value="">-- ${placeholder} --</option>`);
//         lista.forEach(item => {
//             select.append(`<option value="${item[propVal]}">${item[propTexto]}</option>`);
//         });
//     };

//     // 4. GRILLA PRINCIPAL DE USUARIOS
//     const cargarGrillaUsuarios = function () {
//         $.ajax({
//             url: URL_USUARIO,
//             type: 'GET',
//             success: function (data) {
//                 estado.listaUsuarios = data || [];
//                 renderizarTablaUsuarios(estado.listaUsuarios);
//             },
//             error: function () {
//                 $('#tabla-usuarios-container').html('<div class="alert alert-danger m-3">Error al conectar con el servidor de seguridad.</div>');
//             }
//         });
//     };

//     const renderizarTablaUsuarios = function (lista) {
//         if (!lista || lista.length === 0) {
//             $('#tabla-usuarios-container').html('<div class="alert alert-info text-center m-4"><i class="fas fa-shield-alt me-2"></i> No hay credenciales registradas.</div>');
//             return;
//         }

//         let html = `
//             <table class="table table-hover align-middle mb-0">
//                 <thead class="table-dark">
//                     <tr>
//                         <th class="ps-3">Usuario (Login)</th>
//                         <th>Empleado Vinculado</th>
//                         <th>Rol Asignado</th>
//                         <th class="text-center">Estado</th>
//                         <th class="text-center">Acciones</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//         `;

//         lista.forEach(usr => {
//             let badgeColor = usr.EstadoUsuario === 'Activo' ? 'bg-success' : 'bg-danger';
//             let rolBadgeColor = usr.NombreRol.includes('Administrador') ? 'bg-primary' : 'bg-secondary';

//             html += `
//                 <tr>
//                     <td class="ps-3 fw-bold text-dark"><i class="fas fa-user-circle text-muted me-2"></i>${usr.Usuario}</td>
//                     <td>${usr.NombreEmpleado}</td>
//                     <td><span class="badge ${rolBadgeColor}">${usr.NombreRol}</span></td>
//                     <td class="text-center"><span class="badge ${badgeColor}">${usr.EstadoUsuario}</span></td>
//                     <td class="text-center">
//                         <button class="btn btn-sm btn-outline-primary me-1 btn-editar-usr" data-id="${usr.Id}" title="Editar Credenciales">
//                             <i class="fas fa-edit"></i>
//                         </button>
//                         <button class="btn btn-sm btn-outline-danger btn-borrar-usr" data-id="${usr.Id}" data-nombre="${usr.Usuario}" title="Bloquear Usuario">
//                             <i class="fas fa-ban"></i>
//                         </button>
//                     </td>
//                 </tr>
//             `;
//         });
//         html += `</tbody></table>`;
//         $('#tabla-usuarios-container').html(html);
//     };

//     // 5. EVENTOS DE INTERFAZ
//     const enlazarEventos = function () {
//         const principal = $('#contenedor-dinamico-crud-usuarios');

//         // Toggle Mostrar/Ocultar Contraseña
//         principal.off('click', '#btn-toggle-pass').on('click', '#btn-toggle-pass', function () {
//             let input = $('#usr-password');
//             let icon = $(this).find('i');
//             if (input.attr('type') === 'password') {
//                 input.attr('type', 'text');
//                 icon.removeClass('fa-eye').addClass('fa-eye-slash');
//             } else {
//                 input.attr('type', 'password');
//                 icon.removeClass('fa-eye-slash').addClass('fa-eye');
//             }
//         });

//         // Nuevo Usuario
//         principal.off('click', '#btn-nuevo-usuario').on('click', '#btn-nuevo-usuario', function () {
//             configurarModalParaCreacion();
//             estado.modalInstancia.show();
//         });

//         // Editar Usuario
//         principal.off('click', '.btn-editar-usr').on('click', '.btn-editar-usr', function () {
//             const id = parseInt($(this).data('id'));
//             configurarModalParaEdicion(id);
//         });

//         // Bloquear Usuario
//         principal.off('click', '.btn-borrar-usr').on('click', '.btn-borrar-usr', function () {
//             const id = parseInt($(this).data('id'));
//             const usrName = $(this).data('nombre');
//             confirmarBloqueo(id, usrName);
//         });

//         // Guardar
//         principal.off('click', '#btn-guardar-usuario').on('click', '#btn-guardar-usuario', function () {
//             if ($('#form-usuario')[0].checkValidity()) {
//                 guardarUsuario();
//             } else {
//                 $('#form-usuario')[0].reportValidity();
//             }
//         });
//     };

//     // 6. GESTIÓN DEL COMPORTAMIENTO DEL FORMULARIO
//     const configurarModalParaCreacion = function () {
//         estado.usuarioEditandoId = 0;
//         $('#form-usuario')[0].reset();
        
//         // El empleado se puede elegir
//         $('#usr-empleado').prop('disabled', false); 
        
//         // Contraseña OBLIGATORIA
//         $('#usr-password').prop('required', true);
//         $('#req-pass').removeClass('d-none');
//         $('#help-pass').text('Debe ingresar una contraseña inicial.').removeClass('text-info').addClass('text-muted');

//         $('#titulo-modal-usuario').html('<i class="fas fa-user-plus me-2"></i> Crear Nueva Cuenta');
//     };

//     const configurarModalParaEdicion = function (id) {
//         estado.usuarioEditandoId = id;
//         const datos = estado.listaUsuarios.find(x => x.Id === id);

//         if (!datos) return;

//         // Poblamos campos
//         $('#usr-empleado').val(datos.Id_Empleado).prop('disabled', true); // No se puede cambiar el dueño de la cuenta
//         $('#usr-nombre').val(datos.Usuario);
//         $('#usr-estado').val(datos.Id_Estado_Usuario);
//         $('#usr-rol').val(datos.Id_Rol || '');
        
//         // Contraseña OPCIONAL
//         $('#usr-password').val('').prop('required', false);
//         $('#req-pass').addClass('d-none');
//         $('#help-pass').text('Deje este campo en blanco para mantener la contraseña actual.').removeClass('text-muted').addClass('text-info');

//         $('#titulo-modal-usuario').html(`<i class="fas fa-user-edit me-2"></i> Editar Cuenta: ${datos.Usuario}`);
//         estado.modalInstancia.show();
//     };

//     // 7. FLUJO DE GUARDADO EN CASCADA
//     const guardarUsuario = function () {
//         const usrData = {
//             Id: estado.usuarioEditandoId,
//             Usuario: $('#usr-nombre').val().trim(),
//             Password: $('#usr-password').val().trim(),
//             Id_Empleado: parseInt($('#usr-empleado').val()),
//             Id_Estado_Usuario: parseInt($('#usr-estado').val())
//         };

//         const idRolSeleccionado = parseInt($('#usr-rol').val());
//         const esCreacion = estado.usuarioEditandoId === 0;
//         const tipoMetodo = esCreacion ? "POST" : "PUT";
//         const urlDestino = esCreacion ? URL_USUARIO : `${URL_USUARIO}/${estado.usuarioEditandoId}`;

//         // 1er PASO: Guardar Credenciales (Usuario)
//         $.ajax({
//             type: tipoMetodo,
//             url: urlDestino,
//             data: JSON.stringify(usrData),
//             contentType: "application/json; charset=utf-8",
//             success: function (response) {
//                 const idUsuarioOperado = esCreacion ? response.id : estado.usuarioEditandoId;

//                 // 2do PASO: Asignar el Rol usando nuestro "Endpoint Estrella"
//                 guardarRolEnCascada(idUsuarioOperado, idRolSeleccionado, esCreacion);
//             },
//             error: function (err) {
//                 let msg = err.responseJSON && err.responseJSON.Message ? err.responseJSON.Message : 'Ocurrió un error al guardar la cuenta.';
//                 Swal.fire('Atención', msg, 'warning');
//             }
//         });
//     };

//     const guardarRolEnCascada = function (idUsuario, idRol, esCreacion) {
//         const asignacionData = {
//             Id_Usuario: idUsuario,
//             Id_Rol: idRol
//         };

//         $.ajax({
//             type: "POST", // Siempre POST porque nuestro SP de SQL hace el Delete y el Insert solito
//             url: `${URL_USUARIO_ROL}/Asignar`,
//             data: JSON.stringify(asignacionData),
//             contentType: "application/json; charset=utf-8",
//             success: function () {
//                 estado.modalInstancia.hide();
//                 Swal.fire('¡Éxito!', esCreacion ? 'Usuario creado y rol asignado correctamente.' : 'Credenciales y rol actualizados.', 'success');
//                 cargarGrillaUsuarios();
//             },
//             error: function () {
//                 estado.modalInstancia.hide();
//                 Swal.fire('Aviso', 'El usuario se guardó, pero hubo un problema al asignarle el rol. Por favor verifique.', 'warning');
//                 cargarGrillaUsuarios();
//             }
//         });
//     };

//     // 8. BLOQUEO (Borrado Lógico)
//     const confirmarBloqueo = function (id, nombreUsr) {
//         Swal.fire({
//             title: '¿Bloquear Acceso?',
//             text: `La cuenta "${nombreUsr}" pasará a estado inactivo y no podrá ingresar al sistema.`,
//             icon: 'warning',
//             showCancelButton: true,
//             confirmButtonColor: '#dc3545',
//             confirmButtonText: 'Sí, bloquear cuenta',
//             cancelButtonText: 'Cancelar'
//         }).then((result) => {
//             if (result.isConfirmed) {
//                 $.ajax({
//                     type: 'DELETE',
//                     url: `${URL_USUARIO}/${id}`,
//                     success: function () {
//                         Swal.fire('Bloqueada', 'La cuenta ha sido inhabilitada con éxito.', 'success');
//                         cargarGrillaUsuarios();
//                     }
//                 });
//             }
//         });
//     };

//     return {
//         cargarEn: inicializar
//     };
// })();