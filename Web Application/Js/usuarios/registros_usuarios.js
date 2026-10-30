/* ========================================================================
   SITMAS - Módulo de Seguridad: Registros Masivos, Buscador y Edición
   Arquitectura: Module Pattern (IIFE) + jQuery + Bootstrap 5 + SweetAlert2
   ======================================================================== */

const RegistrosUsuariosModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        listaUsuarios: [],
        catRolesLegitimos: [],
        usuarioEditandoId: 0,
        modalInstanciaEdicion: null
    };

    // Endpoints API
    const URL_USUARIO = "https://localhost:44325/api/Usuario";
    const URL_USUARIO_ROL = "https://localhost:44325/api/Usuario_Rol";
    const URL_ROLES = "https://localhost:44325/api/Roles";

    // 1. INICIALIZACIÓN
    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <div class="d-flex justify-content-between align-items-center mb-4 fade-in">
                <div>
                    <h4 class="text-primary m-0 fw-bold"><i class="fas fa-users-cog"></i>Usuarios registrados</h4>
                    <small class="text-muted">Listado total de usuarios registrados</small>
                </div>
            </div>

            <!-- BARRA DE BÚSQUEDA INTERACTIVA (KEYUP) -->
            <div class="card shadow-sm border-0 mb-4 fade-in">
                <div class="card-body bg-light rounded">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-primary"></i></span>
                                <input type="text" class="form-control border-start-0 ps-0" id="input-buscar-usuario" placeholder="Buscar por usuario, nombre, rol o estado...">
                            </div>
                        </div>
                        <div class="col-md-4 text-end text-muted mt-2 mt-md-0">
                            <small>Total registrados: <strong id="cant-usuarios-badge" class="text-dark">0</strong></small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CONTENEDOR DE TABLA COMPLETA -->
            <div class="card shadow-sm border-0 fade-in">
                <div class="card-body p-0">
                    <div id="tabla-registros-usuarios-container" class="table-responsive">
                        <div class="text-center p-4"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Cargando padrón de usuarios...</p></div>
                    </div>
                </div>
            </div>
        `;

        htmlEstructura += generarHTMLModalEdicion();
        contenedor.html(htmlEstructura);

        estado.modalInstanciaEdicion = new bootstrap.Modal(document.getElementById('modalUsuarioEdicion'), { backdrop: 'static' });

        enlazarEventos();

        // Carga de datos
        cargarRolesYUsuarios();
    };

    // 2. MODAL DE EDICIÓN DE CUENTAS
    const generarHTMLModalEdicion = function () {
        return `
            <div class="modal fade" id="modalUsuarioEdicion" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-dark text-white">
                            <h5 class="modal-title" id="titulo-modal-edit">
                                <i class="fas fa-user-edit me-2"></i> Modificar Usuario
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="form-usuario-edit">
                                <div class="row g-3">
                                    <div class="col-12">
                                        <label class="form-label fw-bold">Empleado Titular</label>
                                        <input type="text" class="form-control bg-light" id="edit-usr-empleado-nombre" readonly>
                                    </div>
                                    <div class="col-md-12">
                                        <label class="form-label fw-bold">Nombre de Usuario (Login) *</label>
                                        <input type="text" class="form-control" id="edit-usr-nombre" required>
                                    </div>
                                    <div class="col-md-12">
                                        <label class="form-label fw-bold">Nueva Contraseña</label>
                                        <input type="password" class="form-control" id="edit-usr-password" placeholder="Dejar en blanco para mantener la clave actual">
                                        <small class="text-info"><i class="fas fa-info-circle me-1"></i> Complete solo si desea cambiar la clave.</small>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label fw-bold">Rol *</label>
                                        <select class="form-select" id="edit-usr-rol" required>
                                            <option value="">Cargando roles...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label fw-bold">Estado de Cuenta *</label>
                                        <select class="form-select" id="edit-usr-estado" required>
                                            <option value="1">Activo</option>
                                            <option value="2">Inactivo / Bloqueado</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btn-guardar-edicion">
                                <i class="fas fa-save me-1"></i> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    // 3. CARGA DE DATOS
    const cargarRolesYUsuarios = function () {
        $.when(
            $.ajax({ url: URL_ROLES, type: 'GET' }),
            $.ajax({ url: URL_USUARIO, type: 'GET' })
        ).done(function (resRoles, resUsuarios) {
            estado.catRolesLegitimos = resRoles[0] || [];
            estado.listaUsuarios = resUsuarios[0] || [];

            poblarComboGenerico('#edit-usr-rol', estado.catRolesLegitimos, 'Id', 'NombreRol', 'Seleccione un Rol');
            
            $('#cant-usuarios-badge').text(estado.listaUsuarios.length);
            renderizarTablaPadron(estado.listaUsuarios);
        });
    };

    const poblarComboGenerico = function (selector, lista, propVal, propTexto, placeholder) {
        let select = $(selector);
        select.empty().append(`<option value="">-- ${placeholder} --</option>`);
        lista.forEach(item => {
            select.append(`<option value="${item[propVal]}">${item[propTexto]}</option>`);
        });
    };

    // 4. RENDERIZADO Y BUSCADOR KEYUP
    const renderizarTablaPadron = function (lista) {
        if (!lista || lista.length === 0) {
            $('#tabla-registros-usuarios-container').html('<div class="alert alert-warning text-center m-4"><i class="fas fa-search me-2"></i> No se encontraron usuarios que coincidan con la búsqueda.</div>');
            return;
        }

        let html = `
            <table class="table table-hover align-middle mb-0">
                <thead class="table-dark">
                    <tr>
                       <!-- <th class="ps-3">ID</th>-->
                        <th>Usuario (Login)</th>
                        <th>Empleado Vinculado</th>
                        <th>Rol Asignado</th>
                        <th class="text-center">Estado</th>
                        <th class="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        lista.forEach(usr => {
            let badgeColor = usr.EstadoUsuario === 'Activo' ? 'bg-success' : 'bg-danger';

            html += `
                <tr>
                    <!--<td class="ps-3 fw-bold text-muted">#${usr.Id}</td>-->
                    <td class="fw-bold text-dark"><i class="fas fa-user-circle text-secondary me-2"></i>${usr.Usuario}</td>
                    <td>${usr.NombreEmpleado}</td>
                    <td><span class="badge bg-primary">${usr.NombreRol}</span></td>
                    <td class="text-center"><span class="badge ${badgeColor}">${usr.EstadoUsuario}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1 btn-editar-padron" data-id="${usr.Id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-borrar-padron" data-id="${usr.Id}" data-nombre="${usr.Usuario}" title="Inhabilitar">
                            <i class="fas fa-ban"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        $('#tabla-registros-usuarios-container').html(html);
    };

    // 5. ENLACE DE EVENTOS Y BUSCADOR EN TIEMPO REAL
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-crud-usuarios');

        // BUSCADOR EN TIEMPO REAL (KEYUP)
        principal.off('keyup', '#input-buscar-usuario').on('keyup', '#input-buscar-usuario', function () {
            const termino = $(this).val().toLowerCase().trim();

            if (termino === '') {
                renderizarTablaPadron(estado.listaUsuarios);
            } else {
                const listaFiltrada = estado.listaUsuarios.filter(u => 
                    u.Usuario.toLowerCase().includes(termino) ||
                    u.NombreEmpleado.toLowerCase().includes(termino) ||
                    u.NombreRol.toLowerCase().includes(termino) ||
                    u.EstadoUsuario.toLowerCase().includes(termino)
                );
                renderizarTablaPadron(listaFiltrada);
            }
        });

        // Abrir Edición
        principal.off('click', '.btn-editar-padron').on('click', '.btn-editar-padron', function () {
            const id = parseInt($(this).data('id'));
            prepararEdicion(id);
        });

        // Confirmar Guardado de Edición
        principal.off('click', '#btn-guardar-edicion').on('click', '#btn-guardar-edicion', function () {
            if ($('#form-usuario-edit')[0].checkValidity()) {
                guardarModificacion();
            } else {
                $('#form-usuario-edit')[0].reportValidity();
            }
        });

        // Inhabilitar
        principal.off('click', '.btn-borrar-padron').on('click', '.btn-borrar-padron', function () {
            const id = parseInt($(this).data('id'));
            const nombreUsr = $(this).data('nombre');
            confirmarInhabilitacion(id, nombreUsr);
        });
    };

    // 6. LÓGICA DE EDICIÓN Y BAJA
    const prepararEdicion = function (id) {
        estado.usuarioEditandoId = id;
        const usr = estado.listaUsuarios.find(x => x.Id === id);

        if (!usr) return;

        $('#edit-usr-empleado-nombre').val(usr.NombreEmpleado);
        $('#edit-usr-nombre').val(usr.Usuario);
        $('#edit-usr-password').val('');
        $('#edit-usr-estado').val(usr.Id_Estado_Usuario);
        $('#edit-usr-rol').val(usr.Id_Rol || '');

        $('#titulo-modal-edit').html(`<i class="fas fa-user-edit me-2"></i> Modificar Cuenta: ${usr.Usuario}`);
        estado.modalInstanciaEdicion.show();
    };

    const guardarModificacion = function () {
        const usrData = {
            Id: estado.usuarioEditandoId,
            Usuario: $('#edit-usr-nombre').val().trim(),
            Password: $('#edit-usr-password').val().trim(),
            Id_Estado_Usuario: parseInt($('#edit-usr-estado').val())
        };

        const idRol = parseInt($('#edit-usr-rol').val());

        $.ajax({
            type: "PUT",
            url: `${URL_USUARIO}/${estado.usuarioEditandoId}`,
            data: JSON.stringify(usrData),
            contentType: "application/json; charset=utf-8",
            success: function () {
                // Actualizamos el Rol
                $.ajax({
                    type: "POST",
                    url: `${URL_USUARIO_ROL}/Asignar`,
                    data: JSON.stringify({ Id_Usuario: estado.usuarioEditandoId, Id_Rol: idRol }),
                    contentType: "application/json; charset=utf-8",
                    success: function () {
                        estado.modalInstanciaEdicion.hide();
                        Swal.fire('¡Actualizado!', 'Datos y rol de la cuenta actualizados correctamente.', 'success');
                        cargarRolesYUsuarios();
                    }
                });
            },
            error: function (err) {
                let msg = err.responseJSON && err.responseJSON.Message ? err.responseJSON.Message : 'Ocurrió un error al actualizar.';
                Swal.fire('Error', msg, 'error');
            }
        });
    };

    const confirmarInhabilitacion = function (id, nombreUsr) {
        Swal.fire({
            title: '¿Inhabilitar Cuenta?',
            text: `El usuario "${nombreUsr}" perderá el acceso a la plataforma SITMAS.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, inhabilitar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: 'DELETE',
                    url: `${URL_USUARIO}/${id}`,
                    success: function () {
                        Swal.fire('Bloqueado', 'La cuenta fue inhabilitada correctamente.', 'success');
                        cargarRolesYUsuarios();
                    }
                });
            }
        });
    };

    return {
        cargarEn: inicializar
    };
})();