const IngresoModulo = (function () {
    // 🔒 ESTADO PRIVADO (Nuestro "bloc de notas" en memoria)
    let estado = {
        hojaRutaSeleccionada: null,
        idVehiculo: null,
        idChofer: null,
        fechaHojaRuta: null // 👈 NUEVO: Memoria para la fecha planificada
    };

    // URLs de la API
    const URL_HOJA_RUTA = "https://localhost:44325/api/hojaruta";
    const URL_INGRESO = "https://localhost:44325/api/IngresoMaterial";

    // 1. INICIALIZACIÓN
    const inicializar = function (contenedorId) {
        const contenedor = $(`#${contenedorId}`);

        let htmlBienvenida = `
            <div class="text-center mt-5 fade-in">
                <h3 class="text-secondary">Gestión de Ingreso a Planta</h3>
                <p class="text-muted">Busque la Hoja de Ruta correspondiente al camión en puerta.</p>
                <button id="btn-buscar-hdr" class="btn btn-primary btn-lg mt-3">
                    <i class="fas fa-search"></i> Buscar Hoja de Ruta
                </button>
            </div>
            <div id="contenedor-tabla-hdr" class="mt-4"></div>
            <div id="contenedor-formulario-ingreso" class="mt-4"></div>
        `;

        contenedor.html(htmlBienvenida);
        enlazarEventos();
    };

    // 2. ESCUCHADORES DE EVENTOS
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-trazabilidad');

        principal.off('click', '#btn-buscar-hdr').on('click', '#btn-buscar-hdr', abrirBuscadorFechas);

        // Capturamos todos los datos del botón, incluyendo la nueva fecha
        principal.off('click', '.btn-seleccionar-hdr').on('click', '.btn-seleccionar-hdr', function () {
            let boton = $(this);
            estado.hojaRutaSeleccionada = boton.data('id');
            estado.idVehiculo = boton.data('vehiculo');
            estado.idChofer = boton.data('chofer');
            estado.fechaHojaRuta = boton.data('fecha'); // 👈 Capturamos la fecha

            Swal.fire({
                icon: 'success',
                title: 'Viaje Seleccionado',
                text: `Se preparará el ingreso para la Hoja de Ruta #${estado.hojaRutaSeleccionada}`,
                timer: 1500,
                showConfirmButton: false
            });

            renderizarFormularioIngreso();
        });

        principal.off('submit', '#form-ingreso-definitivo').on('submit', '#form-ingreso-definitivo', registrarIngresoDefinitivo);
    };

    // 3. LOGICA DE BÚSQUEDA Y RENDERIZADO DE TABLA
    const abrirBuscadorFechas = function () {
        Swal.fire({
            title: 'Buscar Hojas de Ruta',
            html:
                '<label for="swal-input-desde" class="form-label">Desde:</label>' +
                '<input id="swal-input-desde" type="date" class="swal2-input" placeholder="Desde">' +
                '<br>' +
                '<label for="swal-input-hasta" class="form-label">Hasta:</label>' +
                '<input id="swal-input-hasta" type="date" class="swal2-input" placeholder="Hasta">',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Buscar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const desde = document.getElementById('swal-input-desde').value;
                const hasta = document.getElementById('swal-input-hasta').value;
                if (!desde || !hasta) {
                    Swal.showValidationMessage('Por favor ingrese ambas fechas');
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
        $('#contenedor-tabla-hdr').html('<div class="text-center"><div class="spinner-border text-primary"></div><p>Buscando viajes...</p></div>');
        $('#contenedor-formulario-ingreso').empty();

        $.ajax({
            type: "GET",
            url: `${URL_HOJA_RUTA}/rango?desde=${desde}&hasta=${hasta}`,
            success: function (data) {
                renderizarTablaHojasRuta(data);
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
            contenedor.html('<div class="alert alert-warning text-center mt-3"><i class="fas fa-info-circle"></i> No se encontraron Hojas de Ruta Finalizadas en ese rango.</div>');
            return;
        }

        let htmlTabla = `
            <div class="table-responsive mt-3 fade-in">
                <table class="table table-striped table-hover border align-middle">
                    <thead class="table-dark">
                        <tr>
                            <th class="text-center">N° Viaje</th>
                            <th>Fecha</th>
                            <th>Vehículo</th>
                            <th>Chofer</th>
                            <th class="text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        listaHojasRuta.forEach(item => {
            let fechaLimpia = new Date(item.HojaRutaFecha).toLocaleDateString('es-AR');

            let botonAccion = '';
            // Aplicamos nuestra bandera visual protectora
            if (item.YaIngresado === 1) {
                botonAccion = `
                    <button type="button" class="btn btn-sm btn-secondary" disabled>
                        <i class="fas fa-lock"></i> Ya en Planta
                    </button>
                `;
            } else {
                // 👈 NUEVO: Inyectamos data-fecha para que el formulario la recupere
                botonAccion = `
                    <button type="button" class="btn btn-sm btn-success btn-seleccionar-hdr" 
                            data-id="${item.Id}" 
                            data-vehiculo="${item.Id_Vehiculo}" 
                            data-chofer="${item.Id_Chofer}"
                            data-fecha="${item.HojaRutaFecha}">
                        <i class="fas fa-check"></i> Seleccionar
                    </button>
                `;
            }

            htmlTabla += `
                <tr>
                    <td class="text-center fw-bold text-secondary">#${item.Id}</td>
                    <td>${fechaLimpia}</td>
                    <td><span class="badge bg-light text-dark border">${item.Vehiculo}</span></td>
                    <td>${item.ChoferNombreCompleto}</td>
                    <td class="text-center">
                        ${botonAccion}
                    </td>
                </tr>
            `;
        });

        htmlTabla += `</tbody></table></div>`;
        contenedor.html(htmlTabla);
    };

    // 4. LÓGICA DEL FORMULARIO Y COMBOS (Actualizado para incluir Fecha)
    const renderizarFormularioIngreso = function () {
        const contenedor = $('#contenedor-formulario-ingreso');

        // Formateamos la fecha para el input datetime-local (corta la 'Z' y milisegundos si los hay)
        let fechaParaInput = "";
        if (estado.fechaHojaRuta) {
            fechaParaInput = estado.fechaHojaRuta.substring(0, 16); 
        }

        let htmlForm = `
            <div class="card mt-4 shadow-sm fade-in">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Confirmar Ingreso a Planta</h5>
                </div>
                <div class="card-body">
                    <form id="form-ingreso-definitivo">
                        <div class="row">
                            <!-- 👈 Redujimos a col-md-4 para que entren 3 columnas perfectas -->
                            <div class="col-md-4 mb-3">
                                <label class="form-label fw-bold">Fecha de Ingreso</label>
                                <input type="datetime-local" id="input-Fecha-Ingreso" class="form-control" value="${fechaParaInput}" required>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label fw-bold">Vehículo en Puerta</label>
                                <select id="select-Vehiculo-Ingreso" class="form-select" required></select>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label fw-bold">Chofer a Cargo</label>
                                <select id="select-Chofer-Ingreso" class="form-select" required></select>
                            </div>
                        </div>
                        <div class="text-end">
                            <button type="submit" class="btn btn-success btn-lg">
                                <i class="fas fa-save"></i> Registrar Ingreso
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

    // 5. POST A LA API PARA GUARDAR EL INGRESO
    const registrarIngresoDefinitivo = function (e) {
        e.preventDefault(); 

        const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));
        const idUsuarioReal = (sesion && sesion.id) ? parseInt(sesion.id) : 1;

        // 👈 Capturamos la fecha que el operario visualizó/editó
        const fechaVisualizada = $("#input-Fecha-Ingreso").val();

        if(!fechaVisualizada) {
             Swal.fire('Atención', 'Debe especificar una fecha y hora de ingreso válida.', 'warning');
             return;
        }

        const ingresoObj = {
            "Id_Usuario_Registro": idUsuarioReal,
            "Id_Camionero_Ingreso": parseInt($("#select-Chofer-Ingreso").val()),
            "Id_Vehiculo_Ingreso": parseInt($("#select-Vehiculo-Ingreso").val()),
            "Id_HojaRuta": parseInt(estado.hojaRutaSeleccionada),
            "FechaIngreso": fechaVisualizada // 👈 ¡Nuestro nuevo casillero!
        };

        console.log("SITMAS - Enviando solicitud de ingreso:", ingresoObj);

        $.ajax({
            type: "POST",
            url: URL_INGRESO,
            data: JSON.stringify(ingresoObj),
            contentType: "application/json; charset=utf-8",
            success: function (response) {
                Swal.fire('¡Éxito!', `Ingreso Registrado con el ID #${response.id}`, 'success');

                $('#trazabilidadTabs .nav-link').removeClass('active').addClass('text-secondary');
                $('#tab-detalle').removeClass('text-secondary').addClass('active');

                // 👈 CORRECCIÓN: Estaba escrito console.error2. Ya quedó solucionado.
                if (typeof DetalleModulo !== 'undefined') {
                    DetalleModulo.cargarEn("contenedor-dinamico-trazabilidad", response.id, estado.hojaRutaSeleccionada);
                } else {
                    console.error("DetalleModulo no está cargado en el HTML");
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


