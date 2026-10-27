const ClasificacionModulo = (function () {
    // 🔒 ESTADO PRIVADO (Memoria de trabajo del operador)
    let estado = {
        idIngresoMaterial: null,
        idDetalleIngresoSeleccionado: null,
        pesoRestanteMaximo: 0,
        categoriaSeleccionada: '',
        idTipoMaterialSeleccionado: null,
        
        // 🗓️ Filtros de fecha activa
        fechaEspecifica: '',
        desde: '',
        hasta: ''
    };

    // Endpoints de la API C# (.NET Core)
    const URL_MATERIAL_CLASIFICADO = "https://localhost:44325/api/MaterialClasificado";
    const URL_SUBTIPO = "https://localhost:44325/api/SbTp_Material";
    const URL_DESTINO = "https://localhost:44325/api/Destino";
    const URL_ESTADO_MATERIAL = "https://localhost:44325/api/EST_Material";

    // 🕒 Helper: Preserva la hora y fecha local de Argentina (UTC-3)
    const obtenerFechaLocalISO = function () {
        const ahora = new Date();
        const offsetMs = ahora.getTimezoneOffset() * 60000;
        const fechaLocal = new Date(ahora.getTime() - offsetMs);
        return fechaLocal.toISOString().slice(0, 10); // formato YYYY-MM-DD
    };

    // 💾 GESTIÓN DE MEMORIA EN SESIÓN
    const guardarEstadoEnMemoria = function () {
        sessionStorage.setItem('sitmas_estado_clasificacion', JSON.stringify(estado));
    };

    const recuperarEstadoDeMemoria = function () {
        const memoria = sessionStorage.getItem('sitmas_estado_clasificacion');
        if (memoria) {
            estado = JSON.parse(memoria);
            return true;
        }
        return false;
    };

    const limpiarMemoria = function () {
        sessionStorage.removeItem('sitmas_estado_clasificacion');
    };

    // 1. INICIALIZACIÓN
    const inicializar = function (contenedorId, idIngresoNuevo) {
        if (idIngresoNuevo) {
            estado.idIngresoMaterial = idIngresoNuevo;
            guardarEstadoEnMemoria();
        } else {
            recuperarEstadoDeMemoria();
        }

        const contenedor = $(`#${contenedorId}`);

        const textoBadge = estado.idIngresoMaterial 
            ? `Ingreso Planta #${estado.idIngresoMaterial}` 
            : `Todos los Pendientes (Vista General)`;

        let htmlEstructura = `
            <div class="row fade-in">
                <div class="col-12 d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <div>
                        <h4 class="text-success d-inline me-3"><i class="fas fa-recycle"></i> Clasificación de Materiales</h4>
                        <span class="badge bg-success fs-6">${textoBadge}</span>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Columna Izquierda: Pesadas pendientes -->
                <div class="col-md-5">
                    <div class="card border-warning shadow-sm mb-4">
                        <div class="card-header bg-warning text-dark fw-bold d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-boxes"></i> Pendientes (TOP 7 FIFO)</span>
                            
                            <!-- 🔘 BOTONERA DE FILTROS ESTILO DETALLE -->
                            <div class="btn-group" role="group">
                                <button id="btn-buscar-fecha-clasif" class="btn btn-outline-dark btn-sm" title="Fecha Específica">
                                    <i class="fas fa-calendar-day"></i> Fecha
                                </button>
                                <button id="btn-buscar-rango-clasif" class="btn btn-outline-dark btn-sm" title="Buscar Rango">
                                    <i class="fas fa-calendar-alt"></i> Rango
                                </button>
                                ${(estado.fechaEspecifica || estado.desde || estado.hasta) ? `
                                    <button id="btn-limpiar-filtro-fechas" class="btn btn-outline-danger btn-sm" title="Limpiar Filtro de Fechas">
                                        <i class="fas fa-times-circle"></i>
                                    </button>
                                ` : ''}
                                ${estado.idIngresoMaterial ? `
                                    <button id="btn-ver-todos-pendientes" class="btn btn-outline-secondary btn-sm" title="Ver Todos los Pendientes">
                                        <i class="fas fa-list"></i> Ver Todos
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <div class="card-body p-0" id="contenedor-pendientes-clasificacion">
                            <div class="text-center p-4"><div class="spinner-border text-warning"></div><p class="mt-2">Buscando materiales...</p></div>
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha: Formulario de Clasificación -->
                <div class="col-md-7">
                    <div class="card border-success shadow-sm mb-4">
                        <div class="card-header bg-success text-white fw-bold">
                            <i class="fas fa-tags"></i> Formulario de Clasificación
                        </div>
                        <div class="card-body" id="contenedor-formulario-clasificacion">
                            <div class="alert alert-info text-center m-2">
                                <i class="fas fa-hand-point-left"></i> Seleccione un ítem pendiente de la lista izquierda para comenzar a clasificar.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-3 fade-in">
                <div class="col-12">
                    <h5 class="text-secondary border-bottom pb-2"><i class="fas fa-check-circle"></i> Historial Reciente de Clasificación</h5>
                    <div id="contenedor-tabla-clasificados">
                        <div class="text-center my-3"><div class="spinner-border text-secondary"></div><p class="mt-2">Cargando historial...</p></div>
                    </div>
                </div>
            </div>
        `;

        contenedor.html(htmlEstructura);
        enlazarEventos();

        obtenerPendientesClasificacion();
        obtenerHistorialClasificados();
    };

    // 2. MODALES SWEETALERT2 PARA BÚSQUEDA DE FECHAS
    const abrirBuscadorFechaUnica = function () {
        const hoy = obtenerFechaLocalISO();
        Swal.fire({
            title: 'Buscar Pendientes por Fecha',
            html: `<input id="swal-fecha" type="date" class="form-control" value="${estado.fechaEspecifica || hoy}">`,
            showCancelButton: true,
            confirmButtonText: 'Buscar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => document.getElementById('swal-fecha').value
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                estado.fechaEspecifica = result.value;
                estado.desde = '';
                estado.hasta = '';
                guardarEstadoEnMemoria();
                obtenerPendientesClasificacion();
            }
        });
    };

    const abrirBuscadorRangoFechas = function () {
        const hoy = obtenerFechaLocalISO();
        Swal.fire({
            title: 'Buscar Pendientes por Rango',
            html: `
                <div class="text-start">
                    <label class="form-label fw-bold">Desde:</label>
                    <input id="swal-desde" type="date" class="form-control mb-2" value="${estado.desde || hoy}">
                    <label class="form-label fw-bold">Hasta:</label>
                    <input id="swal-hasta" type="date" class="form-control" value="${estado.hasta || hoy}">
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'Buscar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                return {
                    desde: document.getElementById('swal-desde').value,
                    hasta: document.getElementById('swal-hasta').value
                };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value.desde && result.value.hasta) {
                estado.fechaEspecifica = '';
                estado.desde = result.value.desde;
                estado.hasta = result.value.hasta;
                guardarEstadoEnMemoria();
                obtenerPendientesClasificacion();
            }
        });
    };

    // 3. DELEGACIÓN DE EVENTOS
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-trazabilidad');

        // Seleccionar ítem pendiente
        principal.off('click', '.btn-seleccionar-pendiente').on('click', '.btn-seleccionar-pendiente', function () {
            let boton = $(this);
            estado.idDetalleIngresoSeleccionado = boton.data('iddetalle');
            estado.pesoRestanteMaximo = parseFloat(boton.data('pesorestante'));
            estado.categoriaSeleccionada = boton.data('categoria');
            estado.idTipoMaterialSeleccionado = parseInt(boton.data('idtipomaterial'));

            renderizarFormularioClasificacion();
        });

        // Eventos Modales de Fecha
        principal.off('click', '#btn-buscar-fecha-clasif').on('click', '#btn-buscar-fecha-clasif', abrirBuscadorFechaUnica);
        principal.off('click', '#btn-buscar-rango-clasif').on('click', '#btn-buscar-rango-clasif', abrirBuscadorRangoFechas);

        // Limpiar filtros de fecha
        principal.off('click', '#btn-limpiar-filtro-fechas').on('click', '#btn-limpiar-filtro-fechas', function () {
            estado.fechaEspecifica = '';
            estado.desde = '';
            estado.hasta = '';
            guardarEstadoEnMemoria();
            inicializar("contenedor-dinamico-trazabilidad", estado.idIngresoMaterial);
        });

        // Quitar filtro de ingreso particular
        principal.off('click', '#btn-ver-todos-pendientes').on('click', '#btn-ver-todos-pendientes', function () {
            estado.idIngresoMaterial = null;
            limpiarMemoria();
            inicializar("contenedor-dinamico-trazabilidad", null);
        });

        // Submit guardar clasificación
        principal.off('submit', '#form-clasificar-material').on('submit', '#form-clasificar-material', guardarClasificacion);

        // Anular registro
        principal.off('click', '.btn-anular-clasificacion').on('click', '.btn-anular-clasificacion', function () {
            let idClasificacion = $(this).data('id');
            confirmarAnulacion(idClasificacion);
        });
    };

    // 4. CONSULTAR PENDIENTES CON QUERY STRING
    const obtenerPendientesClasificacion = function () {
        let parametros = [];

        if (estado.idIngresoMaterial) parametros.push(`idIngreso=${estado.idIngresoMaterial}`);
        if (estado.fechaEspecifica) parametros.push(`fechaEspecifica=${estado.fechaEspecifica}`);
        if (estado.desde) parametros.push(`desde=${estado.desde}`);
        if (estado.hasta) parametros.push(`hasta=${estado.hasta}`);

        const queryString = parametros.length > 0 ? `?${parametros.join('&')}` : '';
        const urlEndpoint = `${URL_MATERIAL_CLASIFICADO}/Pendientes${queryString}`;

        $.ajax({
            type: "GET",
            url: urlEndpoint,
            success: function (data) {
                renderizarTablaPendientes(data);
            },
            error: function (err) {
                console.error("Error al obtener pendientes:", err);
                $('#contenedor-pendientes-clasificacion').html('<div class="alert alert-danger m-2">Error al consultar ítems pendientes.</div>');
            }
        });
    };

    const renderizarTablaPendientes = function (listaPendientes) {
        const contenedor = $('#contenedor-pendientes-clasificacion');

        if (!listaPendientes || listaPendientes.length === 0) {
            contenedor.html('<div class="alert alert-success text-center m-3"><i class="fas fa-check-double"></i> No se encontraron pendientes de clasificación.</div>');
            return;
        }

        let htmlTabla = `
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>N° Ing / Pesada</th>
                            <th>Categoría</th>
                            <th>Disponible</th>
                            <th class="text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        listaPendientes.forEach(item => {
            htmlTabla += `
                <tr>
                    <td>
                        <span class="badge bg-dark">Ing. #${item.Id_Ingreso_Material}</span><br>
                        <small class="text-secondary fw-bold">Pesada #${item.IdDetalleIngreso}</small>
                    </td>
                    <td><span class="badge bg-info text-dark">${item.TipoMaterialEsperado || 'Varios'}</span></td>
                    <td class="fw-bold text-primary">${item.PesoRestantePendiente} kg <br><small class="text-muted fw-normal">Original: ${item.PesoBruto} kg</small></td>
                    <td class="text-center">
                        <button type="button" class="btn btn-sm btn-outline-success btn-seleccionar-pendiente"
                                data-iddetalle="${item.IdDetalleIngreso}"
                                data-pesorestante="${item.PesoRestantePendiente}"
                                data-categoria="${item.TipoMaterialEsperado || 'Material'}"
                                data-idtipomaterial="${item.Id_Tipo_Material}">
                            <i class="fas fa-filter"></i> Clasificar
                        </button>
                    </td>
                </tr>
            `;
        });

        htmlTabla += `</tbody></table></div>`;
        contenedor.html(htmlTabla);
    };

    // 5. RENDERING DEL FORMULARIO DE CLASIFICACIÓN
    const renderizarFormularioClasificacion = function () {
        const contenedor = $('#contenedor-formulario-clasificacion');

        let htmlForm = `
            <form id="form-clasificar-material" class="fade-in">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label text-muted">Categoría Origen (Balanza)</label>
                        <input type="text" class="form-control fw-bold" value="${estado.categoriaSeleccionada}" disabled>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label text-muted">Peso Disponible a Clasificar</label>
                        <div class="input-group">
                            <input type="text" class="form-control fw-bold text-primary" value="${estado.pesoRestanteMaximo}" disabled>
                            <span class="input-group-text">Kg</span>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Subtipo de Material *</label>
                        <select id="select-subtipo-material" class="form-select" required>
                            <option value="">Cargando subtipos...</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold text-success">Peso Útil Clasificado *</label>
                        <div class="input-group">
                            <input type="number" step="0.01" min="0.01" max="${estado.pesoRestanteMaximo}" id="input-peso-util" class="form-control border-success fw-bold" placeholder="0.00" required>
                            <span class="input-group-text bg-success text-white">Kg</span>
                        </div>
                        <small class="text-muted">Máximo disponible: ${estado.pesoRestanteMaximo} kg.</small>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Condición / Estado del Material *</label>
                        <select id="select-estado-material" class="form-select" required>
                            <option value="">Cargando estados...</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Destino del Material *</label>
                        <select id="select-destino-material" class="form-select" required>
                            <option value="">Cargando destinos...</option>
                        </select>
                    </div>
                </div>

                <div class="text-end mt-3">
                    <button type="submit" class="btn btn-success btn-lg">
                        <i class="fas fa-save"></i> Guardar Clasificación
                    </button>
                </div>
            </form>
        `;

        contenedor.html(htmlForm);

        cargarComboSubtipos();
        cargarComboEstadosMaterial();
        cargarComboDestinos();

        setTimeout(() => $('#input-peso-util').focus(), 100);
    };

    // COMBOS DESPLEGABLES
    const cargarComboSubtipos = function () {
        $.ajax({
            type: "GET",
            url: `${URL_SUBTIPO}/ListarTodo`,
            success: function (data) {
                let select = $("#select-subtipo-material");
                select.empty().append('<option value="">Seleccione Subtipo</option>');

                let subtiposFiltrados = data.filter(item => item.Id_Tipo_Material === estado.idTipoMaterialSeleccionado);

                subtiposFiltrados.forEach(item => {
                    select.append(`<option value="${item.IdSubtipoM}">${item.Subtipo}</option>`);
                });
            }
        });
    };

    const cargarComboEstadosMaterial = function () {
        $.ajax({
            type: "GET",
            url: `${URL_ESTADO_MATERIAL}/ListarTodo`,
            success: function (data) {
                let select = $("#select-estado-material");
                select.empty().append('<option value="">Seleccione Condición</option>');
                data.forEach(item => select.append(`<option value="${item.IdEstadoMaterial}">${item.EstadoMaterial}</option>`));
            }
        });
    };

    const cargarComboDestinos = function () {
        $.ajax({
            type: "GET",
            url: `${URL_DESTINO}/ListarTodo`,
            success: function (data) {
                let select = $("#select-destino-material");
                select.empty();
                data.forEach(item => select.append(`<option value="${item.IdDestino}">${item.Destino}</option>`));

                select.val(10);
            }
        });
    };

    // 5. POST A LA API
    const guardarClasificacion = function (e) {
        e.preventDefault();

        let pesoUtilIngresado = parseFloat($("#input-peso-util").val());

        if (isNaN(pesoUtilIngresado) || pesoUtilIngresado <= 0) {
            Swal.fire('Atención', 'El Peso Útil debe ser mayor a 0.', 'warning');
            return;
        }

        if (pesoUtilIngresado > estado.pesoRestanteMaximo) {
            Swal.fire('Validación de Peso', `El peso útil (${pesoUtilIngresado} kg) supera el peso disponible (${estado.pesoRestanteMaximo} kg).`, 'error');
            return;
        }

        const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));
        const idUsuarioReal = (sesion && sesion.id) ? parseInt(sesion.id) : 1;

        const clasificacionObj = {
            "Id_Detalle_Ingreso": parseInt(estado.idDetalleIngresoSeleccionado),
            "Id_SubTipo_Material": parseInt($("#select-subtipo-material").val()),
            "PesoUtil": pesoUtilIngresado,
            "FechaClasificacion": obtenerFechaLocalISO(),
            "Id_Estado_Material": parseInt($("#select-estado-material").val()),
            "Id_Destino": parseInt($("#select-destino-material").val()) || 10,
            "Id_Usuario_Clasificador": idUsuarioReal
        };

        $.ajax({
            type: "POST",
            url: URL_MATERIAL_CLASIFICADO,
            data: JSON.stringify(clasificacionObj),
            contentType: "application/json; charset=utf-8",
            success: function () {
                Swal.fire({
                    title: '¡Clasificación Guardada!',
                    text: 'El material clasificado fue registrado exitosamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                $('#contenedor-formulario-clasificacion').html(`
                    <div class="alert alert-info text-center m-2">
                        <i class="fas fa-check-circle text-success"></i> Ítem clasificado con éxito. Seleccione otro ítem de la izquierda para continuar.
                    </div>
                `);

                obtenerPendientesClasificacion();
                obtenerHistorialClasificados();
            },
            error: function (err) {
                console.error("Error guardando clasificación:", err);
                let mensajeError = err.responseText ? err.responseText.replace(/"/g, '') : 'Hubo un error al procesar la clasificación.';
                Swal.fire('Error del Sistema', mensajeError, 'error');
            }
        });
    };

    // 6. HISTORIAL DE CLASIFICACIONES
    const obtenerHistorialClasificados = function () {
        $.ajax({
            type: "GET",
            url: `${URL_MATERIAL_CLASIFICADO}/ListarVista`,
            success: function (data) {
                renderizarTablaHistorial(data);
            },
            error: function (err) {
                console.error("Error al obtener historial:", err);
            }
        });
    };

    const renderizarTablaHistorial = function (listaClasificados) {
        const contenedor = $('#contenedor-tabla-clasificados');

        if (!listaClasificados || listaClasificados.length === 0) {
            contenedor.html('<div class="alert alert-light text-center border mt-2">No hay materiales clasificados registrados aún.</div>');
            return;
        }

        const ultimosCinco = listaClasificados.slice(0, 5);

        let htmlTabla = `
        <div class="table-responsive shadow-sm mt-2 fade-in">
            <table class="table table-sm table-striped table-bordered mb-0 align-middle">
                <thead class="table-dark">
                    <tr>
                        <th class="text-center">N° Clasif.</th>
                        <th>Material Clasificado</th>
                        <th>Peso Útil</th>
                        <th>Condición</th>
                        <th>Destino</th>
                        <th>Usuario</th>
                    </tr>
                </thead>
                <tbody>
        `;

        ultimosCinco.forEach(item => {
            htmlTabla += `
            <tr>
                <td class="text-center fw-bold text-secondary">#${item.Id}</td>
                <td class="fw-bold">${item.SubtipoMaterial || 'Material'}</td>
                <td class="text-success fw-bold">${item.PesoUtil} kg</td>
                <td><span class="badge bg-secondary">${item.EstadoMaterial || 'Procesado'}</span></td>
                <td><span class="badge bg-primary">${item.Destino || 'Gestión'}</span></td>
                <td class="small">${item.UsuarioClasificador || 'Sistema'}</td>
            </tr>
        `;
        });

        htmlTabla += `</tbody></table></div>`;
        contenedor.html(htmlTabla);
    };

    // 7. ANULACIÓN LÓGICA
    const confirmarAnulacion = function (idClasificacion) {
        Swal.fire({
            title: '¿Anular Clasificación?',
            text: 'El registro pasará a estado Anulado y el material volverá a estar disponible para clasificar.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, anular',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: "DELETE",
                    url: `${URL_MATERIAL_CLASIFICADO}/${idClasificacion}`,
                    success: function () {
                        Swal.fire('Anulado', 'La clasificación fue anulada con éxito.', 'success');
                        obtenerPendientesClasificacion();
                        obtenerHistorialClasificados();
                    },
                    error: function () {
                        Swal.fire('Error', 'No se pudo anular la clasificación.', 'error');
                    }
                });
            }
        });
    };

    return {
        cargarEn: inicializar
    };
})();















// const ClasificacionModulo = (function () {
//     // 🔒 ESTADO PRIVADO (Memoria de la mesa de trabajo)
//     let estado = {
//         idIngresoMaterial: null,
//         idDetalleIngresoSeleccionado: null,
//         pesoRestanteMaximo: 0,
//         categoriaSeleccionada: '',
//         idTipoMaterialSeleccionado: null
//     };

//     // Endpoints de la API C# (.NET Core)
//     const URL_MATERIAL_CLASIFICADO = "https://localhost:44325/api/MaterialClasificado";
//     const URL_SUBTIPO = "https://localhost:44325/api/SbTp_Material";
//     const URL_DESTINO = "https://localhost:44325/api/Destino";
//     const URL_ESTADO_MATERIAL = "https://localhost:44325/api/EST_Material";

//     // 🕒 Helper: Preserva la hora y fecha local de Argentina (UTC-3)
//     const obtenerFechaLocalISO = function () {
//         const ahora = new Date();
//         const offsetMs = ahora.getTimezoneOffset() * 60000;
//         const fechaLocal = new Date(ahora.getTime() - offsetMs);
//         return fechaLocal.toISOString().slice(0, 19);
//     };

//     // 💾 GESTIÓN DE MEMORIA EN SESIÓN
//     const guardarEstadoEnMemoria = function () {
//         sessionStorage.setItem('sitmas_estado_clasificacion', JSON.stringify(estado));
//     };

//     const recuperarEstadoDeMemoria = function () {
//         const memoria = sessionStorage.getItem('sitmas_estado_clasificacion');
//         if (memoria) {
//             estado = JSON.parse(memoria);
//             return true;
//         }
//         return false;
//     };

//     const limpiarMemoria = function () {
//         sessionStorage.removeItem('sitmas_estado_clasificacion');
//     };

//     // 1. INICIALIZACIÓN SIN BLOQUEOS ("MODO ABIERTO")
//     const inicializar = function (contenedorId, idIngresoNuevo) {
//         if (idIngresoNuevo) {
//             estado.idIngresoMaterial = idIngresoNuevo;
//             guardarEstadoEnMemoria();
//         } else {
//             // Intentamos recuperar si venía trabajando en un ingreso, pero NO bloqueamos si es null
//             recuperarEstadoDeMemoria();
//         }

//         const contenedor = $(`#${contenedorId}`);

//         // Badge dinámico según si hay filtro de ingreso o es libre
//         const textoBadge = estado.idIngresoMaterial 
//             ? `Ingreso Planta #${estado.idIngresoMaterial}` 
//             : `Todos los Pendientes (Vista General)`;

//         let htmlEstructura = `
//             <div class="row fade-in">
//                 <div class="col-12 d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
//                     <div>
//                         <h4 class="text-success d-inline me-3"><i class="fas fa-recycle"></i> Clasificación de Materiales</h4>
//                         <span class="badge bg-success fs-6">${textoBadge}</span>
//                     </div>
//                     ${estado.idIngresoMaterial ? `
//                         <button id="btn-ver-todos-pendientes" class="btn btn-outline-secondary btn-sm">
//                             <i class="fas fa-list"></i> Ver Pendientes Generales
//                         </button>
//                     ` : ''}
//                 </div>
//             </div>

//             <div class="row">
//                 <!-- Columna Izquierda: Pesadas pendientes -->
//                 <div class="col-md-5">
//                     <div class="card border-warning shadow-sm mb-4">
//                         <div class="card-header bg-warning text-dark fw-bold d-flex justify-content-between align-items-center">
//                             <span><i class="fas fa-boxes"></i> Materiales Pendientes</span>
//                         </div>
//                         <div class="card-body p-0" id="contenedor-pendientes-clasificacion">
//                             <div class="text-center p-4"><div class="spinner-border text-warning"></div><p class="mt-2">Buscando materiales...</p></div>
//                         </div>
//                     </div>
//                 </div>

//                 <!-- Columna Derecha: Formulario de Clasificación -->
//                 <div class="col-md-7">
//                     <div class="card border-success shadow-sm mb-4">
//                         <div class="card-header bg-success text-white fw-bold">
//                             <i class="fas fa-tags"></i> Formulario de Clasificación
//                         </div>
//                         <div class="card-body" id="contenedor-formulario-clasificacion">
//                             <div class="alert alert-info text-center m-2">
//                                 <i class="fas fa-hand-point-left"></i> Seleccione un ítem pendiente de la lista izquierda para comenzar a clasificar.
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <div class="row mt-3 fade-in">
//                 <div class="col-12">
//                     <h5 class="text-secondary border-bottom pb-2"><i class="fas fa-check-circle"></i> Historial Reciente de Clasificación</h5>
//                     <div id="contenedor-tabla-clasificados">
//                         <div class="text-center my-3"><div class="spinner-border text-secondary"></div><p class="mt-2">Cargando historial...</p></div>
//                     </div>
//                 </div>
//             </div>
//         `;

//         contenedor.html(htmlEstructura);
//         enlazarEventos();

//         obtenerPendientesClasificacion();
//         obtenerHistorialClasificados();
//     };

//     // 2. DELEGACIÓN DE EVENTOS
//     const enlazarEventos = function () {
//         const principal = $('#contenedor-dinamico-trazabilidad');

//         // Seleccionar ítem a clasificar de la grilla izquierda
//         principal.off('click', '.btn-seleccionar-pendiente').on('click', '.btn-seleccionar-pendiente', function () {
//             let boton = $(this);
//             estado.idDetalleIngresoSeleccionado = boton.data('iddetalle');
//             estado.pesoRestanteMaximo = parseFloat(boton.data('pesorestante'));
//             estado.categoriaSeleccionada = boton.data('categoria');
//             estado.idTipoMaterialSeleccionado = parseInt(boton.data('idtipomaterial'));

//             renderizarFormularioClasificacion();
//         });

//         // Ver todos los pendientes (Quita el filtro de un ingreso particular)
//         principal.off('click', '#btn-ver-todos-pendientes').on('click', '#btn-ver-todos-pendientes', function () {
//             estado.idIngresoMaterial = null;
//             limpiarMemoria();
//             inicializar("contenedor-dinamico-trazabilidad", null);
//         });

//         // Submit del formulario de Clasificación
//         principal.off('submit', '#form-clasificar-material').on('submit', '#form-clasificar-material', guardarClasificacion);

//         // Anular/Eliminar un material clasificado
//         principal.off('click', '.btn-anular-clasificacion').on('click', '.btn-anular-clasificacion', function () {
//             let idClasificacion = $(this).data('id');
//             confirmarAnulacion(idClasificacion);
//         });
//     };

//     // 3. CONSULTAR PENDIENTES (General o por Ingreso)
//     const obtenerPendientesClasificacion = function () {
//         // Si idIngresoMaterial existe, filtra por ingreso. Si es null, trae TODOS los pendientes de la planta.
//         const urlEndpoint = estado.idIngresoMaterial 
//             ? `${URL_MATERIAL_CLASIFICADO}/Pendientes?idIngreso=${estado.idIngresoMaterial}`
//             : `${URL_MATERIAL_CLASIFICADO}/Pendientes`;

//         $.ajax({
//             type: "GET",
//             url: urlEndpoint,
//             success: function (data) {
//                 renderizarTablaPendientes(data);
//             },
//             error: function (err) {
//                 console.error("Error al obtener pendientes:", err);
//                 $('#contenedor-pendientes-clasificacion').html('<div class="alert alert-danger m-2">Error al consultar ítems pendientes.</div>');
//             }
//         });
//     };

//     const renderizarTablaPendientes = function (listaPendientes) {
//         const contenedor = $('#contenedor-pendientes-clasificacion');

//         if (!listaPendientes || listaPendientes.length === 0) {
//             contenedor.html('<div class="alert alert-success text-center m-3"><i class="fas fa-check-double"></i> No hay pesadas pendientes de clasificar.</div>');
//             return;
//         }

//         let htmlTabla = `
//             <div class="table-responsive">
//                 <table class="table table-hover align-middle mb-0">
//                     <thead class="table-light">
//                         <tr>
//                             <th>N° Ing / Pesada</th>
//                             <th>Categoría</th>
//                             <th>Disponible</th>
//                             <th class="text-center">Acción</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//         `;

//         listaPendientes.forEach(item => {
//             htmlTabla += `
//                 <tr>
//                     <td>
//                         <span class="badge bg-dark">Ing. #${item.Id_Ingreso_Material}</span><br>
//                         <small class="text-secondary fw-bold">Pesada #${item.IdDetalleIngreso}</small>
//                     </td>
//                     <td><span class="badge bg-info text-dark">${item.TipoMaterialEsperado || 'Varios'}</span></td>
//                     <td class="fw-bold text-primary">${item.PesoRestantePendiente} kg <br><small class="text-muted fw-normal">Original: ${item.PesoBruto} kg</small></td>
//                     <td class="text-center">
//                         <button type="button" class="btn btn-sm btn-outline-success btn-seleccionar-pendiente"
//                                 data-iddetalle="${item.IdDetalleIngreso}"
//                                 data-pesorestante="${item.PesoRestantePendiente}"
//                                 data-categoria="${item.TipoMaterialEsperado || 'Material'}"
//                                 data-idtipomaterial="${item.Id_Tipo_Material}">
//                             <i class="fas fa-filter"></i> Clasificar
//                         </button>
//                     </td>
//                 </tr>
//             `;
//         });

//         htmlTabla += `</tbody></table></div>`;
//         contenedor.html(htmlTabla);
//     };

//     // 4. RENDERING DEL FORMULARIO DE CLASIFICACIÓN
//     const renderizarFormularioClasificacion = function () {
//         const contenedor = $('#contenedor-formulario-clasificacion');

//         let htmlForm = `
//             <form id="form-clasificar-material" class="fade-in">
//                 <div class="row">
//                     <div class="col-md-6 mb-3">
//                         <label class="form-label text-muted">Categoría Origen (Balanza)</label>
//                         <input type="text" class="form-control fw-bold" value="${estado.categoriaSeleccionada}" disabled>
//                     </div>
//                     <div class="col-md-6 mb-3">
//                         <label class="form-label text-muted">Peso Disponible a Clasificar</label>
//                         <div class="input-group">
//                             <input type="text" class="form-control fw-bold text-primary" value="${estado.pesoRestanteMaximo}" disabled>
//                             <span class="input-group-text">Kg</span>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="row">
//                     <div class="col-md-6 mb-3">
//                         <label class="form-label fw-bold">Subtipo de Material *</label>
//                         <select id="select-subtipo-material" class="form-select" required>
//                             <option value="">Cargando subtipos...</option>
//                         </select>
//                     </div>
//                     <div class="col-md-6 mb-3">
//                         <label class="form-label fw-bold text-success">Peso Útil Clasificado *</label>
//                         <div class="input-group">
//                             <input type="number" step="0.01" min="0.01" max="${estado.pesoRestanteMaximo}" id="input-peso-util" class="form-control border-success fw-bold" placeholder="0.00" required>
//                             <span class="input-group-text bg-success text-white">Kg</span>
//                         </div>
//                         <small class="text-muted">Máximo disponible: ${estado.pesoRestanteMaximo} kg.</small>
//                     </div>
//                 </div>

//                 <div class="row">
//                     <div class="col-md-6 mb-3">
//                         <label class="form-label fw-bold">Condición / Estado del Material *</label>
//                         <select id="select-estado-material" class="form-select" required>
//                             <option value="">Cargando estados...</option>
//                         </select>
//                     </div>
//                     <div class="col-md-6 mb-3">
//                         <label class="form-label fw-bold">Destino del Material *</label>
//                         <select id="select-destino-material" class="form-select" required>
//                             <option value="">Cargando destinos...</option>
//                         </select>
//                     </div>
//                 </div>

//                 <div class="text-end mt-3">
//                     <button type="submit" class="btn btn-success btn-lg">
//                         <i class="fas fa-save"></i> Guardar Clasificación
//                     </button>
//                 </div>
//             </form>
//         `;

//         contenedor.html(htmlForm);

//         cargarComboSubtipos();
//         cargarComboEstadosMaterial();
//         cargarComboDestinos();

//         setTimeout(() => $('#input-peso-util').focus(), 100);
//     };

//     // COMBOS DESPLEGABLES
//     const cargarComboSubtipos = function () {
//         $.ajax({
//             type: "GET",
//             url: `${URL_SUBTIPO}/ListarTodo`,
//             success: function (data) {
//                 let select = $("#select-subtipo-material");
//                 select.empty().append('<option value="">Seleccione Subtipo</option>');

//                 let subtiposFiltrados = data.filter(item => item.Id_Tipo_Material === estado.idTipoMaterialSeleccionado);

//                 subtiposFiltrados.forEach(item => {
//                     select.append(`<option value="${item.IdSubtipoM}">${item.Subtipo}</option>`);
//                 });
//             }
//         });
//     };

//     const cargarComboEstadosMaterial = function () {
//         $.ajax({
//             type: "GET",
//             url: `${URL_ESTADO_MATERIAL}/ListarTodo`,
//             success: function (data) {
//                 let select = $("#select-estado-material");
//                 select.empty().append('<option value="">Seleccione Condición</option>');
//                 data.forEach(item => select.append(`<option value="${item.IdEstadoMaterial}">${item.EstadoMaterial}</option>`));
//             }
//         });
//     };

//     const cargarComboDestinos = function () {
//         $.ajax({
//             type: "GET",
//             url: `${URL_DESTINO}/ListarTodo`,
//             success: function (data) {
//                 let select = $("#select-destino-material");
//                 select.empty();
//                 data.forEach(item => select.append(`<option value="${item.IdDestino}">${item.Destino}</option>`));

//                 select.val(10); // Default "Gestión"
//             }
//         });
//     };

//     // 5. POST A LA API
//     const guardarClasificacion = function (e) {
//         e.preventDefault();

//         let pesoUtilIngresado = parseFloat($("#input-peso-util").val());

//         if (isNaN(pesoUtilIngresado) || pesoUtilIngresado <= 0) {
//             Swal.fire('Atención', 'El Peso Útil debe ser mayor a 0.', 'warning');
//             return;
//         }

//         if (pesoUtilIngresado > estado.pesoRestanteMaximo) {
//             Swal.fire('Validación de Peso', `El peso útil (${pesoUtilIngresado} kg) supera el peso disponible (${estado.pesoRestanteMaximo} kg).`, 'error');
//             return;
//         }

//         const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));
//         const idUsuarioReal = (sesion && sesion.id) ? parseInt(sesion.id) : 1;

//         const clasificacionObj = {
//             "Id_Detalle_Ingreso": parseInt(estado.idDetalleIngresoSeleccionado),
//             "Id_SubTipo_Material": parseInt($("#select-subtipo-material").val()),
//             "PesoUtil": pesoUtilIngresado,
//             "FechaClasificacion": obtenerFechaLocalISO(),
//             "Id_Estado_Material": parseInt($("#select-estado-material").val()),
//             "Id_Destino": parseInt($("#select-destino-material").val()) || 10,
//             "Id_Usuario_Clasificador": idUsuarioReal
//         };

//         $.ajax({
//             type: "POST",
//             url: URL_MATERIAL_CLASIFICADO,
//             data: JSON.stringify(clasificacionObj),
//             contentType: "application/json; charset=utf-8",
//             success: function () {
//                 Swal.fire({
//                     title: '¡Clasificación Guardada!',
//                     text: 'El material clasificado fue registrado exitosamente.',
//                     icon: 'success',
//                     timer: 1500,
//                     showConfirmButton: false
//                 });

//                 $('#contenedor-formulario-clasificacion').html(`
//                     <div class="alert alert-info text-center m-2">
//                         <i class="fas fa-check-circle text-success"></i> Ítem clasificado con éxito. Seleccione otro ítem de la izquierda para continuar.
//                     </div>
//                 `);

//                 obtenerPendientesClasificacion();
//                 obtenerHistorialClasificados();
//             },
//             error: function (err) {
//                 console.error("Error guardando clasificación:", err);
//                 let mensajeError = err.responseText ? err.responseText.replace(/"/g, '') : 'Hubo un error al procesar la clasificación.';
//                 Swal.fire('Error del Sistema', mensajeError, 'error');
//             }
//         });
//     };

//     // 6. HISTORIAL DE CLASIFICACIONES
//     const obtenerHistorialClasificados = function () {
//         $.ajax({
//             type: "GET",
//             url: `${URL_MATERIAL_CLASIFICADO}/ListarVista`,
//             success: function (data) {
//                 renderizarTablaHistorial(data);
//             },
//             error: function (err) {
//                 console.error("Error al obtener historial:", err);
//             }
//         });
//     };

//     const renderizarTablaHistorial = function (listaClasificados) {
//         const contenedor = $('#contenedor-tabla-clasificados');

//         if (!listaClasificados || listaClasificados.length === 0) {
//             contenedor.html('<div class="alert alert-light text-center border mt-2">No hay materiales clasificados registrados aún.</div>');
//             return;
//         }

//         const ultimosCinco = listaClasificados.slice(0, 5);

//         let htmlTabla = `
//         <div class="table-responsive shadow-sm mt-2 fade-in">
//             <table class="table table-sm table-striped table-bordered mb-0 align-middle">
//                 <thead class="table-dark">
//                     <tr>
//                         <th class="text-center">N° Clasif.</th>
//                         <th>Material Clasificado</th>
//                         <th>Peso Útil</th>
//                         <th>Condición</th>
//                         <th>Destino</th>
//                         <th>Usuario</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//         `;

//         ultimosCinco.forEach(item => {
//             htmlTabla += `
//             <tr>
//                 <td class="text-center fw-bold text-secondary">#${item.Id}</td>
//                 <td class="fw-bold">${item.SubtipoMaterial || 'Material'}</td>
//                 <td class="text-success fw-bold">${item.PesoUtil} kg</td>
//                 <td><span class="badge bg-secondary">${item.EstadoMaterial || 'Procesado'}</span></td>
//                 <td><span class="badge bg-primary">${item.Destino || 'Gestión'}</span></td>
//                 <td class="small">${item.UsuarioClasificador || 'Sistema'}</td>
//             </tr>
//         `;
//         });

//         htmlTabla += `</tbody></table></div>`;
//         contenedor.html(htmlTabla);
//     };

//     // 7. ANULACIÓN LÓGICA
//     const confirmarAnulacion = function (idClasificacion) {
//         Swal.fire({
//             title: '¿Anular Clasificación?',
//             text: 'El registro pasará a estado Anulado y el material volverá a estar disponible para clasificar.',
//             icon: 'warning',
//             showCancelButton: true,
//             confirmButtonColor: '#dc3545',
//             confirmButtonText: 'Sí, anular',
//             cancelButtonText: 'Cancelar'
//         }).then((result) => {
//             if (result.isConfirmed) {
//                 $.ajax({
//                     type: "DELETE",
//                     url: `${URL_MATERIAL_CLASIFICADO}/${idClasificacion}`,
//                     success: function () {
//                         Swal.fire('Anulado', 'La clasificación fue anulada con éxito.', 'success');
//                         obtenerPendientesClasificacion();
//                         obtenerHistorialClasificados();
//                     },
//                     error: function () {
//                         Swal.fire('Error', 'No se pudo anular la clasificación.', 'error');
//                     }
//                 });
//             }
//         });
//     };

//     return {
//         cargarEn: inicializar
//     };
// })();











// // const ClasificacionModulo = (function () {
// //     // 🔒 ESTADO PRIVADO (Nuestra memoria de la mesa de trabajo)
// //     let estado = {
// //         idIngresoMaterial: null,
// //         idDetalleIngresoSeleccionado: null,
// //         pesoBrutoMaximo: 0,
// //         categoriaSeleccionada: ''
// //     };

// //     // Endpoints de la API
// //     const URL_MATERIAL_CLASIFICADO = "https://localhost:44325/api/MaterialClasificado";
// //     const URL_DETALLE_INGRESO = "https://localhost:44325/api/DetalleIngreso";
// //     const URL_SUBTIPO = "https://localhost:44325/api/SbTp_Material";
// //     const URL_DESTINO = "https://localhost:44325/api/Destino";
// //     const URL_ESTADO_MATERIAL = "https://localhost:44325/api/EST_Material";

// //     // 💾 GESTIÓN DE MEMORIA EN SESIÓN
// //     const guardarEstadoEnMemoria = function () {
// //         sessionStorage.setItem('sitmas_estado_clasificacion', JSON.stringify(estado));
// //     };

// //     const recuperarEstadoDeMemoria = function () {
// //         const memoria = sessionStorage.getItem('sitmas_estado_clasificacion');
// //         if (memoria) {
// //             estado = JSON.parse(memoria);
// //             return true;
// //         }
// //         return false;
// //     };

// //     const limpiarMemoria = function () {
// //         sessionStorage.removeItem('sitmas_estado_clasificacion');
// //     };

// //     // 1. INICIALIZACIÓN
// //     const inicializar = function (contenedorId, idIngresoNuevo) {
// //         if (idIngresoNuevo) {
// //             estado.idIngresoMaterial = idIngresoNuevo;
// //             guardarEstadoEnMemoria();
// //         } else {
// //             let recuperado = recuperarEstadoDeMemoria();
// //             if (!recuperado) {
// //                 Swal.fire({
// //                     title: 'Sin Ingreso Activo',
// //                     text: 'No se encontró un proceso de clasificación activo. Por favor, seleccione un ingreso en la pestaña principal.',
// //                     icon: 'warning',
// //                     confirmButtonText: 'Ir a Ingresos'
// //                 }).then(() => {
// //                     redirigirAIngreso();
// //                 });
// //                 return;
// //             }
// //         }

// //         const contenedor = $(`#${contenedorId}`);

// //         let htmlEstructura = `
// //             <div class="row fade-in">
// //                 <div class="col-12 d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
// //                     <div>
// //                         <h4 class="text-success d-inline me-3"><i class="fas fa-recycle"></i> Clasificación de Materiales</h4>
// //                         <span class="badge bg-success fs-6">Ingreso Planta #${estado.idIngresoMaterial}</span>
// //                     </div>

// //                     <!-- <button id="btn-salir-clasificacion" class="btn btn-outline-danger btn-sm">
// //                         <i class="fas fa-sign-out-alt"></i> Salir de Clasificación
// //                     </button> -->

// //                 </div>
// //             </div>

// //             <div class="row">
// //                 <!-- Columna Izquierda: Pesadas pendientes de clasificar -->
// //                 <div class="col-md-5">
// //                     <div class="card border-warning shadow-sm mb-4">
// //                         <div class="card-header bg-warning text-dark fw-bold">
// //                             <i class="fas fa-boxes"></i> Materiales Pendientes de Clasificar
// //                         </div>
// //                         <div class="card-body p-0" id="contenedor-pendientes-clasificacion">
// //                             <div class="text-center p-4"><div class="spinner-border text-warning"></div><p>Buscando materiales...</p></div>
// //                         </div>
// //                     </div>
// //                 </div>

// //                 <!-- Columna Derecha: Formulario de Clasificación -->
// //                 <div class="col-md-7">
// //                     <div class="card border-success shadow-sm mb-4">
// //                         <div class="card-header bg-success text-white fw-bold">
// //                             <i class="fas fa-tags"></i> Formulario de Clasificación
// //                         </div>
// //                         <div class="card-body" id="contenedor-formulario-clasificacion">
// //                             <div class="alert alert-info text-center m-2">
// //                                 <i class="fas fa-hand-point-left"></i> Seleccione un ítem pendiente de la lista izquierda para comenzar a clasificar.
// //                             </div>
// //                         </div>
// //                     </div>
// //                 </div>
// //             </div>

// //             <div class="row mt-3 fade-in">
// //                 <div class="col-12">
// //                     <h5 class="text-secondary border-bottom pb-2"><i class="fas fa-check-circle"></i> Materiales Clasificados en este Ingreso</h5>
// //                     <div id="contenedor-tabla-clasificados">
// //                         <div class="text-center my-3"><div class="spinner-border text-secondary"></div><p>Cargando historial...</p></div>
// //                     </div>
// //                 </div>
// //             </div>
// //         `;

// //         contenedor.html(htmlEstructura);
// //         enlazarEventos();

// //         obtenerPendientesClasificacion();
// //         obtenerHistorialClasificados();
// //     };

// //     // 2. DELEGACIÓN DE EVENTOS CON SEGURO .off().on()
// //     const enlazarEventos = function () {
// //         const principal = $('#contenedor-dinamico-trazabilidad');

// //         // Seleccionar ítem a clasificar de la grilla izquierda
// //         principal.off('click', '.btn-seleccionar-pendiente').on('click', '.btn-seleccionar-pendiente', function () {
// //             let boton = $(this);
// //             estado.idDetalleIngresoSeleccionado = boton.data('iddetalle');
// //             estado.pesoBrutoMaximo = parseFloat(boton.data('pesobruto'));
// //             estado.categoriaSeleccionada = boton.data('categoria');

// //             estado.idTipoMaterialSeleccionado = parseInt(boton.data('idtipomaterial'));

// //             renderizarFormularioClasificacion();
// //         });

// //         // Submit del formulario de Clasificación
// //         principal.off('submit', '#form-clasificar-material').on('submit', '#form-clasificar-material', guardarClasificacion);

// //         // Anular/Eliminar un material clasificado
// //         principal.off('click', '.btn-anular-clasificacion').on('click', '.btn-anular-clasificacion', function () {
// //             let idClasificacion = $(this).data('id');
// //             confirmarAnulacion(idClasificacion);
// //         });

// //         // Salir manualmente
// //         principal.off('click', '#btn-salir-clasificacion').on('click', '#btn-salir-clasificacion', function () {
// //             Swal.fire({
// //                 title: '¿Desea salir de Clasificación?',
// //                 text: 'Se limpiará el estado en sesión y volverá a la pestaña de Ingreso.',
// //                 icon: 'question',
// //                 showCancelButton: true,
// //                 confirmButtonText: 'Sí, salir',
// //                 cancelButtonText: 'Cancelar',
// //                 confirmButtonColor: '#dc3545'
// //             }).then((result) => {
// //                 if (result.isConfirmed) {
// //                     limpiarMemoria();
// //                     redirigirAIngreso();
// //                 }
// //             });
// //         });
// //     };

// //     // 3. REDIRECCIONES DE NAVEGACIÓN
// //     const redirigirAIngreso = function () {
// //         $('#trazabilidadTabs .nav-link').removeClass('active').addClass('text-secondary');
// //         $('#tab-ingreso').removeClass('text-secondary').addClass('active');

// //         if (typeof IngresoModulo !== 'undefined') {
// //             IngresoModulo.cargarEn("contenedor-dinamico-trazabilidad");
// //         }
// //     };

// //     // 4. CONSULTAR Y MOSTRAR MATERIALES PENDIENTES
// //     const obtenerPendientesClasificacion = function () {
// //         $.ajax({
// //             type: "GET",
// //             url: `${URL_DETALLE_INGRESO}/PendientesClasificacion/${estado.idIngresoMaterial}`,
// //             success: function (data) {
// //                 renderizarTablaPendientes(data);
// //             },
// //             error: function (err) {
// //                 console.error("Error al obtener pendientes:", err);
// //                 $('#contenedor-pendientes-clasificacion').html('<div class="alert alert-danger m-2">Error al consultar ítems pendientes.</div>');
// //             }
// //         });
// //     };

// //     const renderizarTablaPendientes = function (listaPendientes) {
// //         const contenedor = $('#contenedor-pendientes-clasificacion');

// //         if (!listaPendientes || listaPendientes.length === 0) {
// //             contenedor.html('<div class="alert alert-success text-center m-3"><i class="fas fa-check-double"></i> No hay pesadas pendientes de clasificar en este ingreso.</div>');
// //             return;
// //         }

// //         let htmlTabla = `
// //             <div class="table-responsive">
// //                 <table class="table table-hover align-middle mb-0">
// //                     <thead class="table-light">
// //                         <tr>
// //                             <th>N° Pesada</th>
// //                             <th>Categoría</th>
// //                             <th>Peso Bruto</th>
// //                             <th class="text-center">Acción</th>
// //                         </tr>
// //                     </thead>
// //                     <tbody>
// //         `;

// //         listaPendientes.forEach(item => {
// //             htmlTabla += `
// //                 <tr>
// //                     <td class="fw-bold text-secondary">#${item.IdDetalleIngreso}</td>
// //                     <td><span class="badge bg-info text-dark">${item.TipoMaterial || 'Varios'}</span></td>
// //                     <td class="fw-bold text-primary">${item.PesoBruto} kg</td>
// //                     <td class="text-center">
// //                         <button type="button" class="btn btn-sm btn-outline-success btn-seleccionar-pendiente"
// //                                 data-iddetalle="${item.IdDetalleIngreso}"
// //                                 data-pesobruto="${item.PesoBruto}"
// //                                 data-categoria="${item.TipoMaterial || 'Material'}"
// //                                 data-idtipomaterial="${item.Id_Tipo_Material}">
// //                             <i class="fas fa-filter"></i> Clasificar
// //                         </button>
// //                     </td>
// //                 </tr>
// //             `;
// //         });

// //         htmlTabla += `</tbody></table></div>`;
// //         contenedor.html(htmlTabla);
// //     };

// //     // 5. RENDERING DEL FORMULARIO DE CLASIFICACIÓN
// //     const renderizarFormularioClasificacion = function () {
// //         const contenedor = $('#contenedor-formulario-clasificacion');

// //         let htmlForm = `
// //             <form id="form-clasificar-material" class="fade-in">
// //                 <div class="row">
// //                     <div class="col-md-6 mb-3">
// //                         <label class="form-label text-muted">Categoría Origen (Balanza)</label>
// //                         <input type="text" class="form-control fw-bold" value="${estado.categoriaSeleccionada}" disabled>
// //                     </div>
// //                     <div class="col-md-6 mb-3">
// //                         <label class="form-label text-muted">Peso Bruto Original</label>
// //                         <div class="input-group">
// //                             <input type="text" class="form-control fw-bold text-primary" value="${estado.pesoBrutoMaximo}" disabled>
// //                             <span class="input-group-text">Kg</span>
// //                         </div>
// //                     </div>
// //                 </div>

// //                 <div class="row">
// //                     <div class="col-md-6 mb-3">
// //                         <label class="form-label fw-bold">Subtipo de Material *</label>
// //                         <select id="select-subtipo-material" class="form-select" required>
// //                             <option value="">Cargando subtipos...</option>
// //                         </select>
// //                     </div>
// //                     <div class="col-md-6 mb-3">
// //                         <label class="form-label fw-bold text-success">Peso Útil Clasificado *</label>
// //                         <div class="input-group">
// //                             <input type="number" step="0.01" min="0.01" max="${estado.pesoBrutoMaximo}" id="input-peso-util" class="form-control border-success fw-bold" placeholder="0.00" required>
// //                             <span class="input-group-text bg-success text-white">Kg</span>
// //                         </div>
// //                         <small class="text-muted">No puede superar los ${estado.pesoBrutoMaximo} kg.</small>
// //                     </div>
// //                 </div>

// //                 <div class="row">
// //                     <div class="col-md-6 mb-3">
// //                         <label class="form-label fw-bold">Condición / Estado del Material *</label>
// //                         <select id="select-estado-material" class="form-select" required>
// //                             <option value="">Cargando estados...</option>
// //                         </select>
// //                     </div>
// //                     <div class="col-md-6 mb-3">
// //                         <label class="form-label fw-bold">Destino del Material *</label>
// //                         <select id="select-destino-material" class="form-select" required>
// //                             <option value="">Cargando destinos...</option>
// //                         </select>
// //                     </div>
// //                 </div>

// //                 <div class="text-end mt-3">
// //                     <button type="submit" class="btn btn-success btn-lg">
// //                         <i class="fas fa-save"></i> Guardar Clasificación
// //                     </button>
// //                 </div>
// //             </form>
// //         `;

// //         contenedor.html(htmlForm);

// //         // Cargar combos selectores
// //         cargarComboSubtipos();
// //         cargarComboEstadosMaterial();
// //         cargarComboDestinos();

// //         setTimeout(() => $('#input-peso-util').focus(), 100);
// //     };

// //     // COMBOS Y SELECTS DENTRO DEL FORMULARIO
// //     const cargarComboSubtipos = function () {
// //         $.ajax({
// //             type: "GET",
// //             url: `${URL_SUBTIPO}/ListarTodo`,
// //             success: function (data) {
// //                 let select = $("#select-subtipo-material");
// //                 select.empty().append('<option value="">Seleccione Subtipo</option>');

// //                 // 🌟 LA MAGIA DE JS AQUÍ:
// //                 // Filtramos la lista completa para dejar solo los "hijos" de esta categoría
// //                 let subtiposFiltrados = data.filter(item => item.Id_Tipo_Material === estado.idTipoMaterialSeleccionado);

// //                 // Ahora iteramos sobre la lista filtrada, no sobre la original
// //                 subtiposFiltrados.forEach(item => {
// //                     select.append(`<option value="${item.IdSubtipoM}">${item.Subtipo}</option>`);
// //                 });
// //             }
// //         });
// //     };
// //     // const cargarComboSubtipos = function () {
// //     //     $.ajax({
// //     //         type: "GET",
// //     //         url: `${URL_SUBTIPO}/ListarTodo`,
// //     //         success: function (data) {
// //     //             let select = $("#select-subtipo-material");
// //     //             select.empty().append('<option value="">Seleccione Subtipo</option>');
// //     //             data.forEach(item => select.append(`<option value="${item.IdSubtipoM}">${item.Subtipo}</option>`));
// //     //         }
// //     //     });
// //     // };

// //     const cargarComboEstadosMaterial = function () {
// //         $.ajax({
// //             type: "GET",
// //             url: `${URL_ESTADO_MATERIAL}/ListarTodo`,
// //             success: function (data) {
// //                 let select = $("#select-estado-material");
// //                 select.empty().append('<option value="">Seleccione Condición</option>');
// //                 data.forEach(item => select.append(`<option value="${item.IdEstadoMaterial}">${item.EstadoMaterial}</option>`));
// //             }
// //         });
// //     };

// //     const cargarComboDestinos = function () {
// //         $.ajax({
// //             type: "GET",
// //             url: `${URL_DESTINO}/ListarTodo`,
// //             success: function (data) {
// //                 let select = $("#select-destino-material");
// //                 select.empty();
// //                 data.forEach(item => select.append(`<option value="${item.IdDestino}">${item.Destino}</option>`));

// //                 // Fallback automático por defecto = 10 ("Gestión")
// //                 select.val(10);
// //             }
// //         });
// //     };

// //     // 6. POST A LA API (GUARDAR REGISTRO CLASIFICADO)
// //     const guardarClasificacion = function (e) {
// //         e.preventDefault();

// //         let pesoUtilIngresado = parseFloat($("#input-peso-util").val());

// //         if (isNaN(pesoUtilIngresado) || pesoUtilIngresado <= 0) {
// //             Swal.fire('Atención', 'El Peso Útil debe ser mayor a 0.', 'warning');
// //             return;
// //         }

// //         if (pesoUtilIngresado > estado.pesoBrutoMaximo) {
// //             Swal.fire('Validación de Peso', `El peso útil (${pesoUtilIngresado} kg) no puede superar al peso bruto original (${estado.pesoBrutoMaximo} kg).`, 'error');
// //             return;
// //         }

// //         const sesion = JSON.parse(localStorage.getItem('usuarioSesion'));
// //         const idUsuarioReal = (sesion && sesion.id) ? parseInt(sesion.id) : 1;

// //         const clasificacionObj = {
// //             "Id_Detalle_Ingreso": parseInt(estado.idDetalleIngresoSeleccionado),
// //             "Id_SubTipo_Material": parseInt($("#select-subtipo-material").val()),
// //             "PesoUtil": pesoUtilIngresado,
// //             "FechaClasificacion": new Date().toISOString(),
// //             "Id_Estado_Material": parseInt($("#select-estado-material").val()),
// //             "Id_Destino": parseInt($("#select-destino-material").val()) || 10,
// //             "Id_Usuario_Clasificador": idUsuarioReal
// //         };

// //         console.log("Objeto que enviaremos a la API:", clasificacionObj);

// //         $.ajax({
// //             type: "POST",
// //             url: URL_MATERIAL_CLASIFICADO,
// //             data: JSON.stringify(clasificacionObj),
// //             contentType: "application/json; charset=utf-8",
// //             success: function (response) {
// //                 Swal.fire({
// //                     title: '¡Clasificación Guardada!',
// //                     text: 'El material clasificado fue registrado exitosamente.',
// //                     icon: 'success',
// //                     timer: 1500,
// //                     showConfirmButton: false
// //                 });

// //                 // Limpiamos el formulario
// //                 $('#contenedor-formulario-clasificacion').html(`
// //                     <div class="alert alert-info text-center m-2">
// //                         <i class="fas fa-check-circle text-success"></i> Ítem clasificado con éxito. Seleccione otro ítem de la izquierda para continuar.
// //                     </div>
// //                 `);

// //                 // Recargamos grillas
// //                 obtenerPendientesClasificacion();
// //                 obtenerHistorialClasificados();
// //             },
// //             error: function (err) {
// //                 console.error("Error guardando clasificación:", err);
// //                 let mensajeError = err.responseText ? err.responseText.replace(/"/g, '') : 'Hubo un error al procesar la clasificación.';
// //                 Swal.fire('Error del Sistema', mensajeError, 'error');
// //             }
// //         });
// //     };


// //     // 7. TABLA DE HISTORIAL DE CLASIFICACIONES
// //     const obtenerHistorialClasificados = function () {
// //         $.ajax({
// //             type: "GET",
// //             url: `${URL_MATERIAL_CLASIFICADO}/ListarVista`,
// //             success: function (data) {
// //                 console.log("SITMAS - Historial recibido de la API:", data);

// //                 // Renderizamos directamente los datos recibidos
// //                 renderizarTablaHistorial(data);
// //             },
// //             error: function (err) {
// //                 console.error("Error al obtener historial:", err);
// //             }
// //         });
// //     };
    

// //     const renderizarTablaHistorial = function (listaClasificados) {
// //         const contenedor = $('#contenedor-tabla-clasificados');

// //         if (!listaClasificados || listaClasificados.length === 0) {
// //             contenedor.html('<div class="alert alert-light text-center border mt-2">No hay materiales clasificados registrados aún.</div>');
// //             return;
// //         }

// //         const ultimosCinco = listaClasificados.slice(0, 5);

// //         let htmlTabla = `
// //         <div class="table-responsive shadow-sm mt-2 fade-in">
// //             <table class="table table-sm table-striped table-bordered mb-0 align-middle">
// //                 <thead class="table-dark">
// //                     <tr>
// //                         <th class="text-center">N° Clasif.</th>
// //                         <th>Material Clasificado</th>
// //                         <th>Peso Útil</th>
// //                         <th>Condición</th>
// //                         <th>Destino</th>
// //                         <th>Usuario</th>
// //                         <!-- <th class="text-center">Acción</th> -->
// //                     </tr>
// //                 </thead>
// //                 <tbody>
// //                  `;

// //         ultimosCinco.forEach(item => {
// //             htmlTabla += `
// //             <tr>
// //                 <td class="text-center fw-bold text-secondary">#${item.Id}</td>
// //                 <td class="fw-bold">${item.MaterialOriginal || 'Material'}</td>
// //                 <td class="text-success fw-bold">${item.PesoUtil} kg</td>
// //                 <td><span class="badge bg-secondary">${item.EstadoMaterial || 'Procesado'}</span></td>
// //                 <td><span class="badge bg-primary">${item.Destino || 'Gestión'}</span></td>
// //                 <td class="small">${item.UsuarioClasificador || 'Sistema'}</td>
// //                <!-- <td class="text-center">
// //                     <button type="button" class="btn btn-sm btn-outline-danger btn-anular-clasificacion" data-id="${item.Id}">
// //                         <i class="fas fa-trash"></i> Anular
// //                     </button>
// //                 </td> -->
// //             </tr>
// //         `;
// //         });

// //         htmlTabla += `</tbody></table></div>`;
// //         contenedor.html(htmlTabla);
// //     };

// //     // 8. ANULACIÓN LÓGICA
// //     const confirmarAnulacion = function (idClasificacion) {
// //         Swal.fire({
// //             title: '¿Anular Clasificación?',
// //             text: 'El registro pasará a estado Anulado y el material volverá a estar disponible para clasificar.',
// //             icon: 'warning',
// //             showCancelButton: true,
// //             confirmButtonColor: '#dc3545',
// //             confirmButtonText: 'Sí, anular',
// //             cancelButtonText: 'Cancelar'
// //         }).then((result) => {
// //             if (result.isConfirmed) {
// //                 $.ajax({
// //                     type: "DELETE",
// //                     url: `${URL_MATERIAL_CLASIFICADO}/${idClasificacion}`,
// //                     success: function () {
// //                         Swal.fire('Anulado', 'La clasificación fue anulada con éxito.', 'success');
// //                         obtenerPendientesClasificacion();
// //                         obtenerHistorialClasificados();
// //                     },
// //                     error: function (err) {
// //                         Swal.fire('Error', 'No se pudo anular la clasificación.', 'error');
// //                     }
// //                 });
// //             }
// //         });
// //     };

// //     // Public API
// //     return {
// //         cargarEn: inicializar
// //     };
// // })();