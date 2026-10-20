/* ==========================================================================
   SITMAS - Módulo: Registro de Odómetro 
   Patrón: Revealing Module Pattern (Módulo Revelador) + Event Delegation
   ========================================================================== */

const OdometroModulo = (function () {

    // 🔒 VARIABLES PRIVADAS
    const URL_API_ODOMETRO = "https://localhost:44325/api/registroodometro";
    const URL_API_VEHICULOS = "https://localhost:44325/api/Vehiculo/ListarTodo";

    // ==========================================================================
    // 1. RENDERIZADO DE LA VISTA (HTML)
    // ==========================================================================
    function renderizarVista(contenedorId) {
        const htmlVista = `
            <div class="accordion-header d-flex justify-content-between align-items-center"
                role="button" data-bs-toggle="collapse" href="#collapseOdometro"
                data-permiso-requerido="Logistica_Escritura, Logistica_Modificacion">
                <h2 class="mb-0" id="tituloFormOdometro">Cargar Registro de Odómetro</h2>
                <span class="icon-arrow">▼</span>
            </div>

            <div id="collapseOdometro" class="collapse show"
                data-permiso-requerido="Logistica_Escritura, Logistica_Modificacion">
                <div class="pt-4">
                    <form id="formOdometro">
                        <input type="hidden" id="hdnIdRegistroOdometro" value="0">

                        <div class="row g-3">
                            <div class="col-md-4">
                                <label class="form-label fw-bold" for="id_vehiculo">Vehículo</label>
                                <select class="form-select" id="id_vehiculo" required>
                                    <option value="">Cargando vehículos...</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-bold" for="inicio_odom">Odómetro Inicial (Km)</label>
                                <input type="number" step="0.01" min="0" class="form-control" id="inicio_odom" required>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-bold" for="final_odom">Odómetro Final (Km)</label>
                                <input type="number" step="0.01" min="0" class="form-control" id="final_odom" required>
                            </div>
                        </div>

                        <div class="pt-3 d-flex justify-content-end gap-2">
                            <button type="button" class="btn btn-secondary px-4" id="btnLimpiarForm">Cancelar</button>
                            <button type="submit" class="btn btn-sitmas-success px-5" id="btnGuardarOdometro">➕ Registrar Odómetro</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="row pt-4">
                <div class="col-md-4 offset-md-8">
                    <input type="text" id="inputBusquedaOdometro" class="form-control" placeholder="🔍 Buscar Registro...">
                </div>
            </div>

            <div class="table-responsive pt-3">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Fecha / Hora</th>
                            <th>Vehículo / Patente</th>
                            <th class="text-end">Km Inicial</th>
                            <th class="text-end">Km Final</th>
                            <th class="text-end">Recorrido Día</th>
                            <th class="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tbodyOdometro">
                        <!-- Se renderiza dinámicamente -->
                    </tbody>
                </table>
            </div>
        `;

        // 1. Inyectamos el mueble en la habitación
        $(`#${contenedorId}`).html(htmlVista);

        // 2. ¡Llamamos al guardia por el walkie-talkie para que revise el mueble nuevo!
        if (typeof window.aplicarSeguridadDOM === 'function') {
            window.aplicarSeguridadDOM();
        }

        // 3. Buscamos los datos en la base de datos
        InicializarModuloOdometro();
    }

    // ==========================================================================
    // 2. EL GUARDIA DE SEGURIDAD (DELEGACIÓN DE EVENTOS)
    // ==========================================================================
    function configurarEventos(contenedorId) {
        const $contenedor = $(`#${contenedorId}`);

        // Limpiamos eventos previos para evitar fugas de memoria al cambiar de pestañas
        $contenedor.off('submit', '#formOdometro');
        $contenedor.off('click', '#btnLimpiarForm');
        $contenedor.off('keyup', '#inputBusquedaOdometro');
        $contenedor.off('click', '.btn-editar-odometro'); $contenedor.off('click', '.btn-borrar-odometro');

        // Atamos los eventos nuevamente
        $contenedor.on("submit", "#formOdometro", function (e) {
            e.preventDefault();
            GuardarRegistroOdometro();
        });

        $contenedor.on("click", "#btnLimpiarForm", function () {
            ResetearFormulario();
        });

        $contenedor.on("keyup", "#inputBusquedaOdometro", function () {
            const busqueda = $(this).val().toLowerCase(); $("#tbodyOdometro tr").filter(function () {
                $(this).toggle($(this).text().toLowerCase().indexOf(busqueda) > -1);
            });
        });

        // Capturamos los clics de los botones dinámicos usando sus clases
        $contenedor.on("click", ".btn-editar-odometro", function () {
            const id = $(this).data("id");
            CargarParaEditar(id);
        });

        $contenedor.on("click", ".btn-borrar-odometro", function () {
            const id = $(this).data("id");
            EliminarRegistro(id);
        });
    }

    // ==========================================================================
    // 3. LÓGICA DE NEGOCIO Y AJAX
    // ==========================================================================
    function InicializarModuloOdometro() {
        Promise.all([
            CargarComboVehiculos()
        ]).then(() => {
            GetAllRegistros();
        }).catch(err => {
            console.error("SITMAS - Error al inicializar vehículos:", err);
            mostrarAlerta("❌ Error al cargar el listado auxiliar de vehículos.", "danger");
        });
    }

    function CargarComboVehiculos() {
        return $.ajax({
            type: "GET",
            url: URL_API_VEHICULOS,
            dataType: "json",
            success: function (data) {
                const $select = $("#id_vehiculo");
                $select.empty().append('<option value="">Seleccione Vehículo (Patente)</option>');
                data.forEach(v => {
                    $select.append(`<option value="${v.Id || v.Id}">${v.Patente}</option>`);
                });
            }
        });
    }

    function GetAllRegistros() {
        const sesionString = localStorage.getItem("usuarioSesion");
        let permisosUsuario = [];
        if (sesionString) {
            const sesionLocal = JSON.parse(sesionString);
            permisosUsuario = sesionLocal.permisos || [];
        }

        const puedeModificar = permisosUsuario.includes("Logistica_Escritura") ||
            permisosUsuario.includes("Mantenimiento_Escritura") ||
            permisosUsuario.includes("Administrador");

        $.ajax({
            type: "GET",
            url: URL_API_ODOMETRO,
            dataType: "json",
            success: function (lista) {
                const $tbody = $("#tbodyOdometro");
                $tbody.empty();

                if (!lista || lista.length === 0) {
                    $tbody.append('<tr><td colspan="6" class="text-center text-muted">No hay registros de odómetro guardados.</td></tr>');
                    return;
                }

                lista.forEach(item => {
                    let botonesAccionHTML = '';

                    if (puedeModificar) {
                        // AQUÍ INYECTAMOS LOS BOTONES CON CLASES Y DATA-ID EN LUGAR DE ONCLICK
                        botonesAccionHTML = `
                            <button class="btn btn-sm btn-outline-primary me-1 btn-editar-odometro" data-id="${item.IdRegistroOdomet}" title="Editar Registro">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger me-1 btn-borrar-odometro" data-id="${item.IdRegistroOdomet}" title="Eliminar Registro">
                                🗑️ Borrar
                            </button>
                        `;
                    } else {
                        botonesAccionHTML = `<span class="text-muted small">Solo Lectura</span>`;
                    }

                    const tr = `
                        <tr>
                            <td><small class="fw-bold text-secondary">${item.FechaRegOdomFormateada || 'N/A'}</small></td>
                            <td><span class="badge bg-secondary">${item.Patente || 'Sin Asignar'}</span></td>
                            <td class="text-end">${item.InicioOdom.toFixed(2)} Km</td>
                            <td class="text-end">${item.FinalOdom.toFixed(2)} Km</td>
                            <td class="text-end fw-bold text-success">+${item.KmRecorridosDia.toFixed(2)} Km</td>
                            <td class="text-center">
                                ${botonesAccionHTML} 
                            </td>
                        </tr>`;
                    $tbody.append(tr);
                });

                // ¡Llamamos al guardia otra vez por si se generó algo nuevo en las filas!
                if (typeof window.aplicarSeguridadDOM === 'function') {
                    window.aplicarSeguridadDOM();
                }
            },
            error: function (err) {
                console.error("SITMAS - Error en GetAllRegistros:", err);
                mostrarAlerta("❌ Error al consultar el historial de odómetros.", "danger");
            }
        });
    }

    function GuardarRegistroOdometro() {
        const id = $("#hdnIdRegistroOdometro").val();
        const esModificacion = id && parseInt(id) > 0;

        const dto = {
            IdRegistroOdomet: esModificacion ? parseInt(id) : 0,
            IdVehiculo: parseInt($("#id_vehiculo").val()) || 0,
            InicioOdom: parseFloat($("#inicio_odom").val()) || 0,
            FinalOdom: parseFloat($("#final_odom").val()) || 0
        };

        if (dto.IdVehiculo <= 0) {
            alert("⚠️ Debe seleccionar un vehículo.");
            return;
        }

        if (dto.FinalOdom < dto.InicioOdom) {
            alert("⚠️ El odómetro final no puede ser menor al inicial del mismo día.");
            return;
        }

        const tipoMetodo = esModificacion ? "PUT" : "POST";
        const urlEndpoint = esModificacion ? `${URL_API_ODOMETRO}/${id}` : URL_API_ODOMETRO;

        $.ajax({
            type: tipoMetodo,
            url: urlEndpoint,
            data: JSON.stringify(dto),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (respuesta) {
                const mensajeAccion = esModificacion
                    ? "✅ Registro actualizado con éxito."
                    : "✅ Registro creado con éxito.";

                mostrarAlerta(mensajeAccion, "success");
                ResetearFormulario();
                GetAllRegistros();
            },
            error: function (err) {
                console.error("SITMAS - Error:", err);
                mostrarAlerta("❌ No se pudo guardar el registro.", "danger");
            }
        });
    }

    function CargarParaEditar(id) {
        $.ajax({
            type: "GET",
            url: `${URL_API_ODOMETRO}?idVehiculo=0`,
            dataType: "json",
            success: function (lista) {
                const item = lista.find(r => r.IdRegistroOdomet === id);
                if (!item) {
                    alert("Registro no encontrado.");
                    return;
                }

                $("#hdnIdRegistroOdometro").val(item.IdRegistroOdomet);
                $("#id_vehiculo").val(item.IdVehiculo);
                $("#inicio_odom").val(item.InicioOdom);
                $("#final_odom").val(item.FinalOdom);

                $("#btnGuardarOdometro").text("💾 Actualizar Odómetro").removeClass("btn-sitmas-success").addClass("btn-warning");
                $("#tituloFormOdometro").text(`Modificar Registro #${item.IdRegistroOdomet}`);

                $("html, body").animate({ scrollTop: $("#formOdometro").offset().top - 70 }, 300);
            },
            error: function () {
                alert("Error al cargar el registro.");
            }
        });
    }

    function EliminarRegistro(id) {
        if (!confirm(`⚠️ ¿Está seguro de eliminar el registro #${id}?`)) return;

        $.ajax({
            type: "DELETE",
            url: `${URL_API_ODOMETRO}/${id}`,
            success: function () {
                mostrarAlerta(`✅ Registro #${id} eliminado correctamente.`, "info");
                GetAllRegistros();
                if ($("#hdnIdRegistroOdometro").val() == id) ResetearFormulario();
            },
            error: function () {
                mostrarAlerta("❌ No se pudo eliminar el registro.", "danger");
            }
        });
    }

    function ResetearFormulario() {
        $("#formOdometro")[0].reset();
        $("#hdnIdRegistroOdometro").val("0");
        $("#btnGuardarOdometro").text("➕ Registrar Odómetro").removeClass("btn-warning").addClass("btn-sitmas-success");
        $("#tituloFormOdometro").text("Cargar Registro de Odómetro");
    }

    function mostrarAlerta(mensaje, tipo) {
        const $container = $("#alertContainer");
        if ($container.length > 0) {
            const html = `
                <div class="alert alert-${tipo} alert-dismissible fade show mb-3" role="alert">
                    ${mensaje}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>`;
            $container.html(html);
            setTimeout(() => { $(".alert").alert('close'); }, 4000);
        } else {
            alert(mensaje);
        }
    }

    // ==========================================================================
    // 4. API PÚBLICA DEL MÓDULO (El control remoto)
    // ==========================================================================
    return {
        cargarEn: function (contenedorId) {
            configurarEventos(contenedorId);
            renderizarVista(contenedorId);
        }
    };

})();

