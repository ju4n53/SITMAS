/* ========================================================================
   SITMAS - Módulo de Trazabilidad: Fase Ingreso (Versión Optimizada v2)
   ======================================================================== */

const IngresoModulo = (function () {
    // 🔒 ESTADO PRIVADO
    let estado = {
        hojaRutaSeleccionada: null,
        idVehiculo: null,
        idChofer: null,
        fechaHojaRuta: null,
        listadoHdrCache: [] // Cache local para filtrado rápido en tiempo real
    };

    // Endpoints API
    const URL_HOJA_RUTA = "https://localhost:44325/api/hojaruta";
    const URL_INGRESO = "https://localhost:44325/api/IngresoMaterial";

    // 🛠️ FUNCIÓN AUXILIAR: Formateador de Fecha Local (Evita el salto de día por UTC)
    const obtenerFechaLocalISO = function (fechaObj = new Date()) {
        const yyyy = fechaObj.getFullYear();
        const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const dd = String(fechaObj.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // 1. INICIALIZACIÓN
    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <div class="row fade-in">
                <div class="col-12 d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <div>
                        <h4 class="text-success d-inline me-3">
                            <i class="fas fa-truck-loading"></i> Gestión de Ingreso a Planta
                        </h4>
                        <!--<span class="badge bg-primary fs-6">Puesto Báscula / Entrada</span>-->
                    </div>
                    <div class="btn-group" role="group">
                        <button id="btn-buscar-fecha-especifica" class="btn btn-outline-success btn-sm">
                            <i class="fas fa-calendar-day"></i> Seleccionar Fecha
                        </button>
                        <button id="btn-buscar-rango-hdr" class="btn btn-outline-secondary btn-sm">
                            <i class="fas fa-calendar-alt"></i> Buscar por Rango
                        </button>
                    </div>
                </div>
            </div>

            <!-- Buscador Rápido en Vivo -->
            <div class="row mb-3 fade-in">
                <div class="col-md-6">
                    <div class="input-group">
                        <span class="input-group-text bg-light"><i class="fas fa-search"></i></span>
                        <input type="text" id="input-filtro-rapido-hdr" class="form-control" placeholder="Filtrar por N° Viaje, Patente o Chofer en tiempo real...">
                    </div>
                </div>
            </div>

            <!-- Contenedor de la Grilla de Viajes -->
            <div id="contenedor-tabla-hdr" class="mt-2">
                <div class="text-center my-4">
                    <div class="spinner-border text-primary"></div>
                    <p class="mt-2 text-muted">Cargando Hojas de Ruta del día...</p>
                </div>
            </div>

            <!-- Contenedor del Formulario de Confirmación -->
            <div id="contenedor-formulario-ingreso" class="mt-4"></div>
        `;

        contenedor.html(htmlEstructura);
        enlazarEventos();

        // Carga de los viajes del día actual utilizando la fecha local real
        cargarViajesDelDia();
    };

    // 2. ESCUCHADORES DE EVENTOS
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-trazabilidad');

        // Búsqueda por Fecha Específica (Calendario Rápido)
        principal.off('click', '#btn-buscar-fecha-especifica').on('click', '#btn-buscar-fecha-especifica', abrirBuscadorFechaEspecifica);

        // Búsqueda por rango de fechas
        principal.off('click', '#btn-buscar-rango-hdr').on('click', '#btn-buscar-rango-hdr', abrirBuscadorFechasRango);

        // Filtro rápido en tiempo real (Evento 'input' para máxima sensibilidad)
        principal.off('input', '#input-filtro-rapido-hdr').on('input', '#input-filtro-rapido-hdr', function () {
            const criterio = $(this).val().toLowerCase().trim();
            filtrarTablaEnVivo(criterio);
        });

        // Selección de Hoja de Ruta
        principal.off('click', '.btn-seleccionar-hdr').on('click', '.btn-seleccionar-hdr', function (e) {
            e.preventDefault(); // 🟢 1. Evitamos cualquier comportamiento o salto por defecto

            let boton = $(this);
            estado.hojaRutaSeleccionada = boton.data('id');
            estado.idVehiculo = boton.data('vehiculo');
            estado.idChofer = boton.data('chofer');
            estado.fechaHojaRuta = boton.data('fecha');

            Swal.fire({
                icon: 'success',
                title: 'Viaje Seleccionado',
                text: `Preparando ingreso para la Hoja de Ruta #${estado.hojaRutaSeleccionada}`,
                timer: 1000,
                showConfirmButton: false,
                returnFocus: false // 🟢 2. CLAVE: Evita que SweetAlert2 fuerce el scroll de regreso al botón
            });

            renderizarFormularioIngreso();

            // 🟢 3. Desplazamiento fluido hacia el formulario
            $('html, body').animate({
                scrollTop: $('#contenedor-formulario-ingreso').offset().top - 30
            }, 500);
        });

        // Submit del formulario
        principal.off('submit', '#form-ingreso-definitivo').on('submit', solicitarConfirmacionIngreso);
    };

    // 3. LOGICA DE CONSULTA Y CALENDARIOS
    const cargarViajesDelDia = function () {
        const hoy = obtenerFechaLocalISO();
        buscarHojasRuta(hoy, hoy);
    };

    const abrirBuscadorFechaEspecifica = function () {
        const hoy = obtenerFechaLocalISO();

        Swal.fire({
            title: 'Buscar por Fecha Específica',
            html: `
                <div class="text-start">
                    <label for="swal-input-fecha-unica" class="form-label fw-bold">Seleccione Fecha de Viaje:</label>
                    <input id="swal-input-fecha-unica" type="date" class="form-control" value="${hoy}">
                </div>`,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-calendar-check"></i> Buscar Viajes',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0d6efd',
            preConfirm: () => {
                const fecha = document.getElementById('swal-input-fecha-unica').value;
                if (!fecha) {
                    Swal.showValidationMessage('Debe seleccionar una fecha válida.');
                }
                return fecha;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                buscarHojasRuta(result.value, result.value);
            }
        });
    };

    const abrirBuscadorFechasRango = function () {
        const hoy = obtenerFechaLocalISO();

        Swal.fire({
            title: 'Buscar por Rango de Fechas',
            html: `
                <div class="text-start">
                    <label for="swal-input-desde" class="form-label fw-bold">Desde:</label>
                    <input id="swal-input-desde" type="date" class="form-control mb-3" value="${hoy}">
                    <label for="swal-input-hasta" class="form-label fw-bold">Hasta:</label>
                    <input id="swal-input-hasta" type="date" class="form-control" value="${hoy}">
                </div>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-search"></i> Buscar Rango',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const desde = document.getElementById('swal-input-desde').value;
                const hasta = document.getElementById('swal-input-hasta').value;
                if (!desde || !hasta) {
                    Swal.showValidationMessage('Por favor ingrese ambas fechas.');
                }
                return { desde: desde, hasta: hasta };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                buscarHojasRuta(result.value.desde, result.value.hasta);
            }
        });
    };

    const buscarHojasRuta = function (desde, hasta) {
        $('#contenedor-tabla-hdr').html('<div class="text-center my-4"><div class="spinner-border text-primary"></div><p class="mt-2">Consultando viajes en sistema...</p></div>');
        $('#contenedor-formulario-ingreso').empty();

        $.ajax({
            type: "GET",
            url: `${URL_HOJA_RUTA}/rango?desde=${desde}&hasta=${hasta}`,
            success: function (data) {
                estado.listadoHdrCache = data || [];
                renderizarTablaHojasRuta(estado.listadoHdrCache);
            },
            error: function (err) {
                console.error("Error buscando HDR:", err);
                $('#contenedor-tabla-hdr').html('<div class="alert alert-danger">Error al consultar el servidor.</div>');
            }
        });
    };

    const renderizarTablaHojasRuta = function (listaHojasRuta) {
        const contenedor = $('#contenedor-tabla-hdr');

        if (!listaHojasRuta || listaHojasRuta.length === 0) {
            contenedor.html('<div class="alert alert-warning text-center mt-3"><i class="fas fa-info-circle"></i> No se encontraron Hojas de Ruta finalizadas para la fecha o rango seleccionado.</div>');
            return;
        }

        let htmlTabla = `
            <div class="table-responsive shadow-sm fade-in">
                <table class="table table-striped table-hover border align-middle mb-0" id="tabla-hojas-ruta">
                    <thead class="table-dark">
                        <tr>
                            <th class="text-center">N° Viaje</th>
                            <th>Fecha Planificada</th>
                            <th>Vehículo / Patente</th>
                            <th>Chofer Asignado</th>
                            <th class="text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        listaHojasRuta.forEach(item => {
            let fechaLimpia = new Date(item.HojaRutaFecha).toLocaleDateString('es-AR');
            let esYaIngresado = item.YaIngresado === 1;

            htmlTabla += `
                <tr class="fila-hdr">
                    <td class="text-center fw-bold text-secondary">#${item.Id}</td>
                    <td>${fechaLimpia}</td>
                    <td><span class="badge bg-light text-dark border fw-bold">${item.Vehiculo || 'Sin Asignar'}</span></td>
                    <td>${item.ChoferNombreCompleto || 'Sin Chofer'}</td>
                    <td class="text-center">
                        ${esYaIngresado ? `
                            <button type="button" class="btn btn-sm btn-secondary" disabled>
                                <i class="fas fa-lock"></i> Ya ingresado
                            </button>
                        ` : `
                            <button type="button" class="btn btn-sm btn-success btn-seleccionar-hdr" 
                                    data-id="${item.Id}" 
                                    data-vehiculo="${item.Id_Vehiculo}" 
                                    data-chofer="${item.Id_Chofer}"
                                    data-fecha="${item.HojaRutaFecha}">
                                <i class="fas fa-check"></i> Seleccionar
                            </button>
                        `}
                    </td>
                </tr>
            `;
        });

        htmlTabla += `</tbody></table></div>`;
        contenedor.html(htmlTabla);
    };

    // 4. FILTRADO RÁPIDO EN VIVO (Buscador tipeado)
    const filtrarTablaEnVivo = function (criterio) {
        if (!estado.listadoHdrCache) return;

        const filtrados = estado.listadoHdrCache.filter(item => {
            const num = item.Id ? item.Id.toString() : '';
            const veh = item.Vehiculo ? item.Vehiculo.toLowerCase() : '';
            const chof = item.ChoferNombreCompleto ? item.ChoferNombreCompleto.toLowerCase() : '';
            return num.includes(criterio) || veh.includes(criterio) || chof.includes(criterio);
        });

        renderizarTablaHojasRuta(filtrados);
    };

    // 5. FORMULARIO DE INGRESO (Sin hora, solo Fecha)
    const renderizarFormularioIngreso = function () {
        const contenedor = $('#contenedor-formulario-ingreso');
        const hoyLocal = obtenerFechaLocalISO();

        let htmlForm = `
            <div class="card shadow-sm fade-in border-primary">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-clipboard-check"></i> Confirmar Ingreso a Planta - Viaje #${estado.hojaRutaSeleccionada}</h5>
                </div>
                <div class="card-body">
                    <form id="form-ingreso-definitivo">
                        <div class="row">
                            <!-- 🟢 MODIFICACIÓN: Solamente Fecha (sin hora) -->
                            <div class="col-md-4 mb-3">
                                <label class="form-label fw-bold">Fecha de Ingreso *</label>
                                <input type="date" id="input-Fecha-Ingreso" class="form-control border-primary" value="${hoyLocal}" required>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label fw-bold">Vehículo en Puerta *</label>
                                <select id="select-Vehiculo-Ingreso" class="form-select" required></select>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label fw-bold">Chofer a Cargo *</label>
                                <select id="select-Chofer-Ingreso" class="form-select" required></select>
                            </div>
                        </div>
                        <div class="text-end mt-2">
                            <button type="submit" class="btn btn-success btn-lg">
                                <i class="fas fa-save"></i> Registrar Ingreso Definitivo
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        contenedor.html(htmlForm);

        cargarComboVehiculos(estado.idVehiculo);
        cargarComboChoferes(estado.idChofer);
    };

    const cargarComboChoferes = function (idPreseleccionado) {
        $.ajax({
            type: "GET",
            url: "https://localhost:44325/api/Empleado/ListarChoferes",
            success: function (data) {
                let select = $("#select-Chofer-Ingreso");
                select.empty().append('<option value="">Seleccione Chofer</option>');
                data.forEach(i => select.append(`<option value="${i.Id}">${i.Nombre} ${i.Apellido}</option>`));
                if (idPreseleccionado) select.val(idPreseleccionado);
            }
        });
    };

    const cargarComboVehiculos = function (idPreseleccionado) {
        $.ajax({
            type: "GET",
            url: "https://localhost:44325/api/Vehiculo/ListarTodo",
            success: function (data) {
                let select = $("#select-Vehiculo-Ingreso");
                select.empty().append('<option value="">Seleccione Vehículo</option>');
                data.forEach(i => select.append(`<option value="${i.Id}">${i.Patente}</option>`));
                if (idPreseleccionado) select.val(idPreseleccionado);
            }
        });
    };

    // 6. CONFIRMACIÓN PREVIA Y POST
    const solicitarConfirmacionIngreso = function (e) {
        e.preventDefault();

        const fechaIngreso = $("#input-Fecha-Ingreso").val();
        const vehiculoTexto = $("#select-Vehiculo-Ingreso option:selected").text();
        const choferTexto = $("#select-Chofer-Ingreso option:selected").text();

        if (!fechaIngreso) {
            Swal.fire('Atención', 'Debe especificar una fecha de ingreso válida.', 'warning');
            return;
        }

        Swal.fire({
            title: '¿Confirmar Ingreso a Planta?',
            html: `
                <div class="text-start">
                    <p><strong>N° Viaje:</strong> #${estado.hojaRutaSeleccionada}</p>
                    <p><strong>Vehículo:</strong> ${vehiculoTexto}</p>
                    <p><strong>Chofer:</strong> ${choferTexto}</p>
                    <p><strong>Fecha de Ingreso:</strong> ${fechaIngreso.split('-').reverse().join('/')}</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="fas fa-check"></i> Sí, Confirmar Ingreso',
            cancelButtonText: 'Revisar Datos'
        }).then((result) => {
            if (result.isConfirmed) {
                ejecutarPostIngreso(fechaIngreso);
            }
        });
    };

    const ejecutarPostIngreso = function (fechaIngreso) {
        const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));
        const idUsuarioReal = (sesion && sesion.id) ? parseInt(sesion.id) : 1;

        const ingresoObj = {
            "Id_Usuario_Registro": idUsuarioReal,
            "Id_Camionero_Ingreso": parseInt($("#select-Chofer-Ingreso").val()),
            "Id_Vehiculo_Ingreso": parseInt($("#select-Vehiculo-Ingreso").val()),
            "Id_HojaRuta": parseInt(estado.hojaRutaSeleccionada),
            "FechaIngreso": fechaIngreso
        };

        $.ajax({
            type: "POST",
            url: URL_INGRESO,
            data: JSON.stringify(ingresoObj),
            contentType: "application/json; charset=utf-8",
            success: function (response) {
                Swal.fire('¡Ingreso Exitoso!', `Se ha registrado la recepción del camión con el ID de Planta #${response.id}`, 'success');

                // Transición fluida a la pestaña de Detalle
                $('#trazabilidadTabs .nav-link').removeClass('active').addClass('text-secondary');
                $('#tab-detalle').removeClass('text-secondary').addClass('active');

                if (typeof DetalleModulo !== 'undefined') {
                    DetalleModulo.cargarEn("contenedor-dinamico-trazabilidad", response.id, estado.hojaRutaSeleccionada);
                }
            },
            error: function (err) {
                console.error("Error en Ingreso:", err);
                let msgError = err.responseText ? err.responseText.replace(/"/g, '') : 'Hubo un problema al registrar el ingreso.';
                Swal.fire('Error del Sistema', msgError, 'error');
            }
        });
    };

    return {
        cargarEn: inicializar
    };
})();

