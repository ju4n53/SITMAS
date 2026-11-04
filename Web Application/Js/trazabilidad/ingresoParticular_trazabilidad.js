
const IngresoParticularModule = (function () {

    const API_INGRESO_PARTICULAR = "https://localhost:44325/api/IngresoParticular";
    const API_ORIGEN_PARTICULAR = "https://localhost:44325/api/OrigenParticular";


    // Función principal para renderizar la vista en el contenedor dinámico
    function renderizarVista(contenedorSelector) {
        const contenedor = $(`#${contenedorSelector}`);

        let htmlTemplate = `
            <div class="container-fluid fade-in py-4">
                <!-- Cabecera de la Sección -->
                <div class="row mb-4 align-items-center">
                    <div class="col-md-6">
                        <h2><i class="fas fa-box-open text-success"></i> Trazabilidad de Ingresos Particulares</h2>
                        <p class="text-muted">Gestión y registro de material proveniente de fuentes particulares y externas.</p>
                    </div>
                    <div class="col-md-6 text-end">
                        <button class="btn btn-outline-success me-2" id="btn-abrir-modal-origen">
                            <i class="fas fa-map-marker-alt"></i> Gestionar Orígenes
                        </button>
                        <br>
                        <button class="btn btn-success" id="btn-abrir-modal-ingreso">
                            <i class="fas fa-plus-circle"></i> Ingreso Particular
                        </button>
                    </div>
                </div>

                <!-- Tabla de Listado en la Parte Inferior -->
                <div class="card shadow-sm border-0">
                    <div class="card-header bg-white py-3">
                        <h5 class="mb-0 text-secondary"><i class="fas fa-list"></i> Historial de Ingresos Particulares</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover align-middle" id="tabla-ingresos-particulares">
                                <thead class="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Fecha</th>
                                        <th>Origen</th>
                                        <th>Tipo</th>
                                        <th>Vehículo (Patente)</th>
                                        <th>Usuario Registro</th>
                                        <th>Observaciones</th>
                                        <th>Estado</th>
                                        <th class="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="tbody-ingresos-particulares">
                                    <!-- Los datos se cargan dinámicamente vía AJAX -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODAL: Nuevo Ingreso Particular -->
            <div class="modal fade" id="modal-ingreso-particular" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title"><i class="fas fa-clipboard-check"></i> Registrar Nuevo Ingreso Particular</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="form-ingreso-particular">
                                <div class="mb-3">
                                    <label for="input-fecha-ingreso" class="form-label">Fecha de Ingreso</label>
                                    <input type="date" class="form-control" id="input-fecha-ingreso" required>
                                </div>
                                <div class="mb-3">
                                    <label for="select-origen-particular" class="form-label">Origen Particular</label>
                                    <select class="form-select" id="select-origen-particular" required>
                                        <option value="" selected disabled>Seleccione un origen...</option>
                                    </select>
                                </div>
                                <!--<div class="mb-3">
                                    <label for="select-vehiculo-particular" class="form-label">Vehículo / Patente</label>
                                    <select class="form-select" id="select-vehiculo-particular">
                                        <option value="5">Predeterminado (Sin Vehículo específico / Particular)</option>
                                    </select>
                                </div>-->
                                <div class="mb-3">
                                    <label for="textarea-observaciones-ingreso" class="form-label">Observaciones</label>
                                    <textarea class="form-control" id="textarea-observaciones-ingreso" rows="3" placeholder="Detalles adicionales..."></textarea>
                                </div>
                                <div class="text-end">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                    <button type="submit" class="btn btn-success">Guardar Ingreso</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODAL: Gestión de Origen Particular -->
            <div class="modal fade" id="modal-origen-particular" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-secondary text-white">
                            <h5 class="modal-title"><i class="fas fa-map-marker-alt"></i> Registrar Nuevo Origen</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="form-origen-particular">
                                <div class="mb-3">
                                    <label for="input-nombre-origen" class="form-label">Nombre del Origen</label>
                                    <input type="text" class="form-control" id="input-nombre-origen" placeholder="Ej: Cooperativa Los Amigos" required>
                                </div>
                                <div class="mb-3">
                                    <label for="select-tipo-origen" class="form-label">Tipo de Origen</label>
                                    <select class="form-select" id="select-tipo-origen" required>
                                        <option value="" selected disabled>Seleccione el tipo...</option>
                                        <option value="Vecino">Vecino</option>
                                        <option value="Cooperativa">Cooperativa</option>
                                        <option value="Institucion Publica">Institución Pública</option>
                                        <option value="Empresa Privada">Empresa Privada</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="textarea-obs-origen" class="form-label">Observaciones</label>
                                    <textarea class="form-control" id="textarea-obs-origen" rows="2"></textarea>
                                </div>
                                <div class="text-end">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                                    <button type="submit" class="btn btn-secondary">Guardar Origen</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        contenedor.html(htmlTemplate);
        inicializarEventos();
        cargarIngresosParticulares();
        cargarSelectOrigenes();
    }

    function inicializarEventos() {
        $('#btn-abrir-modal-ingreso').on('click', function () {
            $('#form-ingreso-particular')[0].reset();
            const hoy = new Date().toISOString().split('T')[0];
            $('#input-fecha-ingreso').val(hoy);
            new bootstrap.Modal($('#modal-ingreso-particular')[0]).show();
        });

        $('#btn-abrir-modal-origen').on('click', function () {
            $('#form-origen-particular')[0].reset();
            new bootstrap.Modal($('#modal-origen-particular')[0]).show();
        });

        $('#form-ingreso-particular').on('submit', function (e) {
            e.preventDefault();
            ejecutarInsertarIngreso();
        });

        $('#form-origen-particular').on('submit', function (e) {
            e.preventDefault();
            ejecutarInsertarOrigen();
        });
    }

    function cargarIngresosParticulares() {
        $.ajax({
            url: `${API_INGRESO_PARTICULAR}`,
            type: 'GET',
            success: function (data) {
                let tbody = $('#tbody-ingresos-particulares');
                tbody.empty();
                if (!data || data.length === 0) {
                    tbody.append(`<tr><td colspan="9" class="text-center text-muted">No hay registros particulares cargados.</td></tr>`);
                    return;
                }
                data.forEach(item => {
                    tbody.append(`
                        <tr>
                            <td>#${item.Id_ingresoParticular}</td>
                            <td>${new Date(item.fecha_ingresoParticular).toLocaleDateString()}</td>
                            <td><strong>${item.nombre_origenParticular}</strong></td>
                            <td><span class="badge bg-info text-dark">${item.tipo_origenParticular}</span></td>
                            <td>${item.Patente}</td>
                            <td>${item.UsuarioRegistro}</td>
                            <td>${item.observaciones || '-'}</td>
                            <td><span class="badge ${item.estadoIngresoParticular === 'Procesado' ? 'bg-success' : 'bg-danger'}">${item.estadoIngresoParticular}</span></td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-outline-danger" onclick="ingresoParticularModule.anular(${item.Id_ingresoParticular})" title="Anular registro">
                                    <i class="fas fa-ban"></i>
                                </button>
                            </td>
                        </tr>
                    `);
                });
            },
            error: function (err) {
                console.error("Error al listar ingresos particulares:", err);
            }
        });
    }

    function cargarSelectOrigenes() {
        $.ajax({
            url: `${API_ORIGEN_PARTICULAR}`,
            type: 'GET',
            success: function (data) {
                let select = $('#select-origen-particular');
                select.html('<option value="" selected disabled>Seleccione un origen...</option>');
                if (data) {
                    data.forEach(origen => {
                        select.append(`<option value="${origen.Id_origenParticular}">${origen.nombre_origenParticular} (${origen.tipo_origenParticular})</option>`);
                    });
                }
            },
            error: function (err) {
                console.error("Error al cargar orígenes:", err);
            }
        });
    }

    function ejecutarInsertarIngreso() {
        const idUsuarioActual = window.usuarioLogueadoId || 1;

        const dataEnvio = {
            fecha_ingresoParticular: $('#input-fecha-ingreso').val(),
            Id_origenParticular: parseInt($('#select-origen-particular').val()),
            Id_Vehiculo: 5,
            Id_Usuario_Registro: idUsuarioActual,
            observaciones: $('#textarea-observaciones-ingreso').val()
        };

        $.ajax({
            url: `${API_INGRESO_PARTICULAR}`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dataEnvio),
            success: function (res) {
                const modalEl = $('#modal-ingreso-particular')[0];
                const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modalInstance.hide();

                Swal.fire('¡Éxito!', res.mensaje || 'Ingreso particular registrado correctamente.', 'success');
                cargarIngresosParticulares();
            },
            error: function (err) {
                console.error("Error en POST Ingreso:", err);
                Swal.fire('Error', 'No se pudo registrar el ingreso particular. Revise la consola.', 'error');
            }
        });
    }

    function ejecutarInsertarOrigen() {
        const dataOrigen = {
            nombre_origenParticular: $('#input-nombre-origen').val(),
            tipo_origenParticular: $('#select-tipo-origen').val(),
            observaciones: $('#textarea-obs-origen').val()
        };

        $.ajax({
            url: `${API_ORIGEN_PARTICULAR}`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dataOrigen),
            success: function (res) {
                const modalEl = $('#modal-origen-particular')[0];
                const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modalInstance.hide();

                Swal.fire('¡Éxito!', 'Origen registrado con éxito. Ya puede seleccionarlo.', 'success');
                cargarSelectOrigenes();
            },
            error: function (err) {
                console.error("Error en POST Origen:", err);
                Swal.fire('Error', 'No se pudo registrar el origen.', 'error');
            }
        });
    }

    function anular(id) {
        Swal.fire({
            title: '¿Desea anular este ingreso?',
            text: "Esta acción cambiará el estado del registro a Anulado.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, anular',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${API_INGRESO_PARTICULAR}/${id}`,
                    type: 'DELETE',
                    success: function () {
                        Swal.fire('Anulado', 'El registro ha sido anulado.', 'success');
                        cargarIngresosParticulares();
                    },
                    error: function () {
                        Swal.fire('Error', 'No se pudo anular el registro.', 'error');
                    }
                });
            }
        });
    }

    return {
        cargarEn: renderizarVista
    };

})();