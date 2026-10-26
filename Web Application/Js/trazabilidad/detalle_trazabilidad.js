/* ========================================================================
   SITMAS - Módulo de Trazabilidad: Fase Detalle / Pesaje (Versión Obra de Arte v4)
   ======================================================================== */

const DetalleModulo = (function () {
    // 1. DECLARACIÓN CENTRALIZADA DE ENDPOINTS
    const URL_DETALLE_INGRESO = "https://localhost:44325/api/DetalleIngreso";
    const URL_TIPO_MATERIAL = "https://localhost:44325/api/TP_Material";

    // 🔒 ESTADO PRIVADO (Memoria de trabajo del operador)
    let estado = {
        idIngresoMaterial: null,
        idHojaRuta: null,
        idDetalleHdrSeleccionado: null,
        idTipoMaterialSeleccionado: null,
        idOrigenSeleccionado: null,

        // 🗓️ Filtros de fecha para la búsqueda de pendientes
        fechaEspecifica: '',
        desde: '',
        hasta: ''
    };

    const obtenerFechaLocalISO = function (fechaObj = new Date()) {
        const yyyy = fechaObj.getFullYear();
        const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const dd = String(fechaObj.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const guardarEstadoEnMemoria = function () {
        sessionStorage.setItem('sitmas_estado_detalle', JSON.stringify(estado));
    };

    const recuperarEstadoDeMemoria = function () {
        const memoria = sessionStorage.getItem('sitmas_estado_detalle');
        if (memoria) {
            estado = JSON.parse(memoria);
            return true;
        }
        return false;
    };

    const limpiarMemoria = function () {
        sessionStorage.removeItem('sitmas_estado_detalle');
        estado.idIngresoMaterial = null;
        estado.idHojaRuta = null;
        estado.fechaEspecifica = '';
        estado.desde = '';
        estado.hasta = '';
    };

    // 2. INICIALIZACIÓN
    const inicializar = function (contenedorId, idIngresoNuevo, idHojaRutaSeleccionada) {
        if (idIngresoNuevo && idHojaRutaSeleccionada) {
            estado.idIngresoMaterial = idIngresoNuevo;
            estado.idHojaRuta = idHojaRutaSeleccionada;
            guardarEstadoEnMemoria();
        } else {
            recuperarEstadoDeMemoria();
        }

        const contenedor = $(`#${contenedorId}`);

        let subTituloHeader = estado.idIngresoMaterial 
            ? `<span class="badge bg-success fs-6 me-2">Ingreso Planta #${estado.idIngresoMaterial}</span>`
            : `<span class="badge bg-warning fs-6 me-2">Báscula Abierta (Modo General)</span>`;

        let htmlEstructura = `
            <div class="row fade-in">
                <div class="col-12 d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <div>
                        <h4 class="text-emec-naranja d-inline me-3"><i class="fas fa-balance-scale"></i> Control de Pesaje en Báscula</h4>
                        ${subTituloHeader}
                    </div>
                </div>
            </div>

            <!-- Columna Izquierda: Paradas Pendientes de Pesaje -->
            <div class="row">
                <div class="col-md-6">
                    <div class="card border-warning shadow-sm mb-4">
                        <div class="card-header bg-warning text-dark fw-bold d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-clock"></i> Pendientes (TOP 10 FIFO)</span>

                            <!-- 🔘 BOTONERA DE FILTROS IDÉNTICA A CLASIFICACIÓN -->
                            <div class="btn-group" role="group">
                                <button id="btn-buscar-fecha-detalle" class="btn btn-outline-dark btn-sm" title="Fecha Específica">
                                    <i class="fas fa-calendar-day"></i> Fecha
                                </button>
                                <button id="btn-buscar-rango-detalle" class="btn btn-outline-dark btn-sm" title="Buscar Rango">
                                    <i class="fas fa-calendar-alt"></i> Rango
                                </button>
                                ${(estado.fechaEspecifica || estado.desde || estado.hasta) ? `
                                    <button id="btn-limpiar-filtro-fechas" class="btn btn-outline-danger btn-sm" title="Limpiar Filtro de Fechas">
                                        <i class="fas fa-times-circle"></i>
                                    </button>
                                ` : ''}
                                ${estado.idIngresoMaterial ? `
                                    <button id="btn-limpiar-filtro-ingreso" class="btn btn-outline-secondary btn-sm" title="Ver Todos los Pendientes">
                                        <i class="fas fa-list"></i> Ver Todos
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="card-body p-0" id="contenedor-tabla-paradas">
                            <div class="text-center p-4"><div class="spinner-border text-warning"></div><p class="mt-2">Cargando pendientes...</p></div>
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha: Formulario Dinámico de Pesaje -->
                <div class="col-md-6">
                    <div id="contenedor-formulario-pesaje">
                        <div class="alert alert-info text-center m-2">
                            <i class="fas fa-hand-point-left"></i> Seleccione una parada pendiente de la lista para registrar el pesaje de báscula.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabla Inferior: Registros Procesados Recientemente -->
            <div class="row mt-3 fade-in">
                <div class="col-12">
                    <h5 class="text-secondary border-bottom pb-2"><i class="fas fa-check-circle"></i> Últimos Pesajes Registrados en Báscula</h5>
                    <div id="contenedor-tabla-pesadas-realizadas">
                        <div class="text-center my-3"><div class="spinner-border text-secondary"></div><p class="mt-2">Cargando historial de pesajes...</p></div>
                    </div>
                </div>
            </div>
        `;

        contenedor.html(htmlEstructura);
        enlazarEventos();

        obtenerParadasPendientes();
        obtenerPesadasProcesadas();
    };

    // 3. ENLACE DE EVENTOS
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-trazabilidad');

        // Disparadores de Modales de Fecha
        principal.off('click', '#btn-buscar-fecha-detalle').on('click', '#btn-buscar-fecha-detalle', abrirBuscadorFechaUnica);
        principal.off('click', '#btn-buscar-rango-detalle').on('click', '#btn-buscar-rango-detalle', abrirBuscadorRangoFechas);

        // Limpiar Filtro de Fechas
        principal.off('click', '#btn-limpiar-filtro-fechas').on('click', '#btn-limpiar-filtro-fechas', function () {
            estado.fechaEspecifica = '';
            estado.desde = '';
            estado.hasta = '';
            guardarEstadoEnMemoria();
            obtenerParadasPendientes();
        });

        // Limpiar Filtro de Ingreso (Ver Todos)
        principal.off('click', '#btn-limpiar-filtro-ingreso').on('click', '#btn-limpiar-filtro-ingreso', function () {
            limpiarMemoria();
            inicializar('contenedor-dinamico-trazabilidad');
        });

        // Selección de parada a pesas
        principal.off('click', '.btn-seleccionar-parada').on('click', '.btn-seleccionar-parada', function (e) {
            e.preventDefault();
            let boton = $(this);

            estado.idDetalleHdrSeleccionado = boton.data('iddetalle');
            estado.idTipoMaterialSeleccionado = boton.data('idtipomaterial');
            estado.idOrigenSeleccionado = boton.data('idorigen');
            
            let idIngresoFila = boton.data('idingreso');
            if (idIngresoFila) estado.idIngresoMaterial = idIngresoFila;

            let origenNombre = boton.data('origennombre');

            renderizarFormularioPesaje(origenNombre);

            $('html, body').animate({
                scrollTop: $('#contenedor-formulario-pesaje').offset().top - 30
            }, 400, function () {
                $('#input-peso-bruto').focus();
            });
        });

        principal.off('submit', '#form-pesaje-parada').on('submit', '#form-pesaje-parada', registrarPesada);
    };

    // 4. CONSULTAS DE BÁSCULA
    const obtenerParadasPendientes = function () {
        let url = `${URL_DETALLE_INGRESO}/PendientesPesaje`;
        let parametros = [];

        if (estado.fechaEspecifica) {
            parametros.push(`desde=${estado.fechaEspecifica}&hasta=${estado.fechaEspecifica}`);
        } else if (estado.desde && estado.hasta) {
            parametros.push(`desde=${estado.desde}&hasta=${estado.hasta}`);
        }

        if (parametros.length > 0) {
            url += `?${parametros.join('&')}`;
        }

        $.ajax({
            type: "GET",
            url: url,
            success: function (data) {
                renderizarTablaPendientes(data);
            },
            error: function (err) {
                console.error("Error al obtener pendientes:", err);
                $('#contenedor-tabla-paradas').html('<div class="alert alert-danger m-2">Error al consultar ítems pendientes.</div>');
            }
        });
    };

    // 5. MODALES SWEETALERT2 DE FECHA
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
                obtenerParadasPendientes();
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
                obtenerParadasPendientes();
            }
        });
    };

    const renderizarTablaPendientes = function (lista) {
        const contenedor = $('#contenedor-tabla-paradas');

        if (!lista || lista.length === 0) {
            contenedor.html('<div class="alert alert-success text-center m-3"><i class="fas fa-check-circle"></i> No hay pesajes pendientes para la selección.</div>');
            return;
        }

        let htmlTabla = `
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Viaje / Fecha</th>
                            <th>Origen</th>
                            <th>Material Esperado</th>
                            <th class="text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        lista.forEach(item => {
            let fechaFmt = item.HojaRutaFecha ? new Date(item.HojaRutaFecha).toLocaleDateString('es-AR') : '-';

            htmlTabla += `
                <tr>
                    <td>
                        <strong class="text-primary">#${item.Id_HojaRuta}</strong><br>
                        <small class="text-muted">${fechaFmt}</small>
                    </td>
                    <td class="fw-bold text-dark">${item.Origen || 'Sin Origen'}</td>
                    <td><span class="badge bg-info text-dark">${item.TipoMaterial || 'Varios'}</span></td>
                    <td class="text-center">
                        <button type="button" class="btn btn-sm btn-outline-primary btn-seleccionar-parada"
                                data-iddetalle="${item.Id_Detalle_HDR}"
                                data-idtipomaterial="${item.Id_TipoMaterial || ''}"
                                data-idorigen="${item.Id_Origen || ''}"
                                data-materialnombre="${item.TipoMaterial || ''}"
                                data-origennombre="${item.Origen || ''}"
                                data-idingreso="${item.Id_Ingreso_Material || ''}">
                            <i class="fas fa-balance-scale"></i> Pesar
                        </button>
                    </td>
                </tr>
            `;
        });

        htmlTabla += `</tbody></table></div>`;
        contenedor.html(htmlTabla);
    };

    // 5. FORMULARIO DE PESAJE CON COMBO DINÁMICO DE MATERIAL
    const renderizarFormularioPesaje = function (origenPlanificado) {
        const contenedor = $('#contenedor-formulario-pesaje');
        const hoyLocal = obtenerFechaLocalISO();

        let htmlForm = `
            <div class="card border-primary shadow fade-in">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-weight"></i> Registrar Pesada en Báscula</h5>
                    <span class="badge bg-light text-primary fs-6">${origenPlanificado || 'Origen General'}</span>
                </div>
                <div class="card-body">
                    <form id="form-pesaje-parada">
                        <div class="row">
                            <!-- 🟢 COMBO DE TIPO DE MATERIAL HABILITADO -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Tipo de Material Pesado *</label>
                                <select id="select-tipo-material" class="form-select border-primary" required>
                                    <option value="">Cargando tipos de material...</option>
                                </select>
                                <small class="text-muted">Se sugiere el planificado, pero puede cambiarlo según lo descargado.</small>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Fecha Pesaje *</label>
                                <input type="date" id="input-fecha-detalle" class="form-control border-primary" value="${hoyLocal}" required>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold text-success">Peso Bruto (Kg) *</label>
                                <input type="number" step="0.01" min="0.1" id="input-peso-bruto" class="form-control form-control-lg border-success fw-bold" required placeholder="0.00">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Observaciones</label>
                                <input type="text" id="input-observaciones" class="form-control" placeholder="Ej: Bolsón cerrado, material húmedo...">
                            </div>
                        </div>

                        <div class="text-end mt-2">
                            <button type="submit" class="btn btn-success btn-lg">
                                <i class="fas fa-save"></i> Confirmar y Guardar Pesada
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        contenedor.html(htmlForm);

        // Poblamos el combo desplegable
        cargarComboTiposMaterial(estado.idTipoMaterialSeleccionado);
    };

    // Función auxiliar para popular el combo desde la API
    const cargarComboTiposMaterial = function (idPreseleccionado) {
        $.ajax({
            type: "GET",
            url: `${URL_TIPO_MATERIAL}/ListarTodo`,
            success: function (data) {
                let select = $("#select-tipo-material");
                select.empty().append('<option value="">Seleccione Material Pesado *</option>');
                
                if (data && data.length > 0) {
                    data.forEach(item => {
                        select.append(`<option value="${item.IdTipoMaterial}">${item.TipoMaterial}</option>`);
                    });

                    // Si la parada traía un tipo de material sugerido, lo preseleccionamos
                    if (idPreseleccionado) {
                        select.val(idPreseleccionado);
                    }
                }
            },
            error: function (err) {
                console.error("Error al cargar los tipos de material:", err);
                $("#select-tipo-material").html('<option value="">Error al cargar materiales</option>');
            }
        });
    };

    // 6. REGISTRAR PESAJE
    const registrarPesada = function (e) {
        e.preventDefault();

        let pesoIngresado = parseFloat($("#input-peso-bruto").val());
        let fechaIngresada = $("#input-fecha-detalle").val();
        let tipoMaterialSeleccionado = parseInt($("#select-tipo-material").val());

        if (isNaN(pesoIngresado) || pesoIngresado <= 0) {
            Swal.fire('Atención', 'Ingrese un peso bruto mayor a 0.', 'warning');
            return;
        }

        if (!tipoMaterialSeleccionado) {
            Swal.fire('Atención', 'Debe seleccionar un Tipo de Material.', 'warning');
            return;
        }

        let idIngresoFinal = estado.idIngresoMaterial ? parseInt(estado.idIngresoMaterial) : 1;

        const pesadaObj = {
            "Id_Ingreso_Material": idIngresoFinal,
            "Id_Origen": parseInt(estado.idOrigenSeleccionado) || 27,
            "PesoBruto": pesoIngresado,
            "Id_Tipo_Material": tipoMaterialSeleccionado,
            "Id_Detalle_HDR": estado.idDetalleHdrSeleccionado ? parseInt(estado.idDetalleHdrSeleccionado) : null,
            "Observaciones": $("#input-observaciones").val().trim() || null,
            "fechaDetalleIng": fechaIngresada
        };

        $.ajax({
            type: "POST",
            url: URL_DETALLE_INGRESO,
            data: JSON.stringify(pesadaObj),
            contentType: "application/json; charset=utf-8",
            success: function () {
                Swal.fire({
                    title: '¡Pesada Registrada!',
                    text: 'El registro ha sido procesado exitosamente.',
                    icon: 'success',
                    timer: 1200,
                    showConfirmButton: false
                });

                $('#contenedor-formulario-pesaje').html(`
                    <div class="alert alert-success text-center m-2 fade-in">
                        <i class="fas fa-check-circle"></i> Pesada registrada con éxito. Seleccione otro ítem de la lista para continuar.
                    </div>
                `);

                obtenerParadasPendientes();
                obtenerPesadasProcesadas();
            },
            error: function (err) {
                let msg = err.responseText ? err.responseText.replace(/"/g, '') : 'Error al registrar pesada.';
                Swal.fire('Error', msg, 'error');
            }
        });
    };

    // 7. HISTORIAL DE PESAJES PROCESADOS
   /* ========================================================================
   SITMAS - Módulo de Trazabilidad: Fase Detalle (Capa 3 - Vista Pre-Remito)
   ======================================================================== */

// 1. CONSULTA AL ENDPOINT DE REMITOS
const obtenerPesadasProcesadas = function () {
    let url = `${URL_DETALLE_INGRESO}/RemitoOrigen`;
    
    // Si hay un ingreso seleccionado en memoria, filtramos por esa cabecera
    if (estado.idIngresoMaterial) {
        url += `?idIngreso=${estado.idIngresoMaterial}`;
    }

    $.ajax({
        type: "GET",
        url: url,
        success: function (data) {
            renderizarTablaRemitoOrigen(data);
        },
        error: function (err) {
            console.error("Error al obtener datos del Remito Origen:", err);
            $('#contenedor-tabla-pesadas-realizadas').html(
                '<div class="alert alert-danger m-2">Error al cargar la grilla de certificación/remitos.</div>'
            );
        }
    });
};

// 2. RENDERIZADO DE LA GRILLA PRE-REMITO (ROTEC - EMEC)
const renderizarTablaRemitoOrigen = function (listaRemitos) {
    const $contenedor = $('#contenedor-tabla-pesadas-realizadas');

    if (!listaRemitos || listaRemitos.length === 0) {
        $contenedor.html(`
            <div class="alert alert-light text-center border mt-2">
                <i class="fas fa-file-invoice text-muted"></i> Aún no se registran pesajes procesados para certificación de remito.
            </div>
        `);
        return;
    }

    let htmlTabla = `
        <div class="table-responsive shadow-sm mt-2 fade-in">
            <table class="table table-sm table-hover table-bordered mb-0 align-middle">
                <thead class="table-dark">
                    <tr>
                        <th class="text-center">N° Detalle / Remito</th>
                        <th class="text-center">Fecha</th>
                        <th class="text-center">N° Viaje</th>
                        <th>Transporte / Vehículo</th>
                        <th>Chofer A Cargo</th>
                        <th>Origen (Empresa Donante)</th>
                        <th>Material Pesado</th>
                        <th class="text-end">Peso Total Certificado</th>
                    </tr>
                </thead>
                <tbody>
    `;

    listaRemitos.forEach(item => {
        // Formateo de fecha de la Hoja de Ruta
        let fechaFormateada = '-';
        if (item.fecha) {
            let f = new Date(item.fecha);
            fechaFormateada = f.toLocaleDateString('es-AR');
        }

        let pesoNum = parseFloat(item.pesoTotal || 0);

        htmlTabla += `
            <tr>
                <td class="text-center fw-bold text-secondary">#${item.NroDetalle}</td>
                <td class="text-center small">${fechaFormateada}</td>
                <td class="text-center fw-bold text-primary">#${item.NroViaje}</td>
                <td class="small"><i class="fas fa-truck text-muted me-1"></i>${item.Transporte}</td>
                <td class="small"><i class="fas fa-id-card text-muted me-1"></i>${item.chofer}</td>
                <td class="fw-bold text-dark"><i class="fas fa-building text-secondary me-1"></i>${item.Origen}</td>
                <td><span class="badge bg-info text-dark">${item.Material}</span></td>
                <td class="text-success fw-bold text-end fs-6">${pesoNum.toFixed(2)} kg</td>
            </tr>
        `;
    });

    htmlTabla += `
                </tbody>
            </table>
        </div>
    `;

    $contenedor.html(htmlTabla);
};

    return {
        cargarEn: inicializar
    };
})();





// /* ========================================================================
//    SITMAS - Módulo de Trazabilidad: Fase Detalle (Versión Obra de Arte v3)
//    ======================================================================== */

// const DetalleModulo = (function () {
//     // 🔒 ESTADO PRIVADO
//     let estado = {
//         idIngresoMaterial: null,
//         idHojaRuta: null,
//         idDetalleHdrSeleccionado: null,
//         idTipoMaterialSeleccionado: null,
//         idOrigenSeleccionado: null
//     };

//     // Endpoints API
//     const URL_DETALLE_INGRESO = "https://localhost:44325/api/DetalleIngreso";

//     const obtenerFechaLocalISO = function (fechaObj = new Date()) {
//         const yyyy = fechaObj.getFullYear();
//         const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
//         const dd = String(fechaObj.getDate()).padStart(2, '0');
//         return `${yyyy}-${mm}-${dd}`;
//     };

//     const guardarEstadoEnMemoria = function () {
//         sessionStorage.setItem('sitmas_estado_detalle', JSON.stringify(estado));
//     };

//     const recuperarEstadoDeMemoria = function () {
//         const memoria = sessionStorage.getItem('sitmas_estado_detalle');
//         if (memoria) {
//             estado = JSON.parse(memoria);
//             return true;
//         }
//         return false;
//     };

//     const limpiarMemoria = function () {
//         sessionStorage.removeItem('sitmas_estado_detalle');
//         estado.idIngresoMaterial = null;
//         estado.idHojaRuta = null;
//     };

//     // 1. INICIALIZACIÓN LIBRE DE RESTRICCIONES
//     const inicializar = function (contenedorId, idIngresoNuevo, idHojaRutaSeleccionada) {
//         if (idIngresoNuevo && idHojaRutaSeleccionada) {
//             estado.idIngresoMaterial = idIngresoNuevo;
//             estado.idHojaRuta = idHojaRutaSeleccionada;
//             guardarEstadoEnMemoria();
//         } else {
//             recuperarEstadoDeMemoria(); // Intenta recuperar si existe, pero NO bloquea si es null
//         }

//         const contenedor = $(`#${contenedorId}`);

//         let subTituloHeader = estado.idIngresoMaterial 
//             ? `<span class="badge bg-success fs-6 me-2">Ingreso Planta #${estado.idIngresoMaterial}</span>`
//             : `<span class="badge bg-secondary fs-6 me-2">Báscula Abierta (Modo General)</span>`;

//         let htmlEstructura = `
//             <div class="row fade-in">
//                 <div class="col-12 d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
//                     <div>
//                         <h4 class="text-primary d-inline me-3"><i class="fas fa-balance-scale"></i> Control de Pesaje en Báscula</h4>
//                         ${subTituloHeader}
//                     </div>
//                     <div class="btn-group" role="group">
//                         <button id="btn-buscar-fecha-detalle" class="btn btn-outline-primary btn-sm">
//                             <i class="fas fa-calendar-day"></i> Fecha Específica
//                         </button>
//                         <button id="btn-buscar-rango-detalle" class="btn btn-outline-secondary btn-sm">
//                             <i class="fas fa-calendar-alt"></i> Buscar Rango
//                         </button>
//                         ${estado.idIngresoMaterial ? `
//                             <button id="btn-limpiar-filtro-ingreso" class="btn btn-outline-danger btn-sm">
//                                 <i class="fas fa-times-circle"></i> Ver Todos los Pendientes
//                             </button>
//                         ` : ''}
//                     </div>
//                 </div>
//             </div>

//             <!-- Columna Izquierda: Paradas Pendientes de Pesaje -->
//             <div class="row">
//                 <div class="col-md-6">
//                     <div class="card border-warning shadow-sm mb-4">
//                         <div class="card-header bg-warning text-dark fw-bold d-flex justify-content-between align-items-center">
//                             <span><i class="fas fa-clock"></i> Paradas Pendientes de Pesaje</span>
//                             <span class="badge bg-dark text-white">Top 10 Más Antiguos</span>
//                         </div>
//                         <div class="card-body p-0" id="contenedor-tabla-paradas">
//                             <div class="text-center p-4"><div class="spinner-border text-warning"></div><p>Cargando pendientes...</p></div>
//                         </div>
//                     </div>
//                 </div>

//                 <!-- Columna Derecha: Formulario Dinámico de Pesaje -->
//                 <div class="col-md-6">
//                     <div id="contenedor-formulario-pesaje">
//                         <div class="alert alert-info text-center m-2">
//                             <i class="fas fa-hand-point-left"></i> Seleccione una parada pendiente de la lista para registrar el pesaje de báscula.
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- Tabla Inferior: Registros Procesados Recientemente -->
//             <div class="row mt-3 fade-in">
//                 <div class="col-12">
//                     <h5 class="text-secondary border-bottom pb-2"><i class="fas fa-check-circle"></i> Últimos Pesajes Registrados en Báscula</h5>
//                     <div id="contenedor-tabla-pesadas-realizadas">
//                         <div class="text-center my-3"><div class="spinner-border text-secondary"></div><p>Cargando historial de pesajes...</p></div>
//                     </div>
//                 </div>
//             </div>
//         `;

//         contenedor.html(htmlEstructura);
//         enlazarEventos();

//         obtenerParadasPendientes();
//         obtenerPesadasProcesadas();
//     };

//     // 2. ENLACE DE EVENTOS
//     const enlazarEventos = function () {
//         const principal = $('#contenedor-dinamico-trazabilidad');

//         principal.off('click', '#btn-buscar-fecha-detalle').on('click', '#btn-buscar-fecha-detalle', abrirBuscadorFechaUnica);
//         principal.off('click', '#btn-buscar-rango-detalle').on('click', '#btn-buscar-rango-detalle', abrirBuscadorRangoFechas);

//         principal.off('click', '#btn-limpiar-filtro-ingreso').on('click', '#btn-limpiar-filtro-ingreso', function () {
//             limpiarMemoria();
//             inicializar('contenedor-dinamico-trazabilidad');
//         });

//         principal.off('click', '.btn-seleccionar-parada').on('click', '.btn-seleccionar-parada', function (e) {
//             e.preventDefault();
//             let boton = $(this);

//             estado.idDetalleHdrSeleccionado = boton.data('iddetalle');
//             estado.idTipoMaterialSeleccionado = boton.data('idtipomaterial');
//             estado.idOrigenSeleccionado = boton.data('idorigen');
            
//             // Si venimos en modo libre, tomamos el idIngreso de la fila si ya existe
//             let idIngresoFila = boton.data('idingreso');
//             if (idIngresoFila) estado.idIngresoMaterial = idIngresoFila;

//             let materialNombre = boton.data('materialnombre');
//             let origenNombre = boton.data('origennombre');

//             renderizarFormularioPesaje(materialNombre, origenNombre);

//             $('html, body').animate({
//                 scrollTop: $('#contenedor-formulario-pesaje').offset().top - 30
//             }, 400, function () {
//                 $('#input-peso-bruto').focus();
//             });
//         });

//         principal.off('submit', '#form-pesaje-parada').on('submit', '#form-pesaje-parada', registrarPesada);
//     };

//     // 3. CONSULTAS Y BÚSQUEDAS
//     const obtenerParadasPendientes = function (desde = null, hasta = null) {
//         let url = `${URL_DETALLE_INGRESO}/PendientesPesaje`;
//         if (desde && hasta) {
//             url += `?desde=${desde}&hasta=${hasta}`;
//         }

//         $.ajax({
//             type: "GET",
//             url: url,
//             success: function (data) {
//                 renderizarTablaPendientes(data);
//             },
//             error: function (err) {
//                 console.error("Error al obtener pendientes:", err);
//                 $('#contenedor-tabla-paradas').html('<div class="alert alert-danger m-2">Error al consultar ítems pendientes.</div>');
//             }
//         });
//     };

//     const abrirBuscadorFechaUnica = function () {
//         const hoy = obtenerFechaLocalISO();
//         Swal.fire({
//             title: 'Buscar Pendientes por Fecha',
//             html: `<input id="swal-fecha" type="date" class="form-control" value="${hoy}">`,
//             showCancelButton: true,
//             confirmButtonText: 'Buscar',
//             preConfirm: () => document.getElementById('swal-fecha').value
//         }).then((result) => {
//             if (result.isConfirmed && result.value) {
//                 obtenerParadasPendientes(result.value, result.value);
//             }
//         });
//     };

//     const abrirBuscadorRangoFechas = function () {
//         const hoy = obtenerFechaLocalISO();
//         Swal.fire({
//             title: 'Buscar Pendientes por Rango',
//             html: `
//                 <div class="text-start">
//                     <label class="form-label fw-bold">Desde:</label>
//                     <input id="swal-desde" type="date" class="form-control mb-2" value="${hoy}">
//                     <label class="form-label fw-bold">Hasta:</label>
//                     <input id="swal-hasta" type="date" class="form-control" value="${hoy}">
//                 </div>`,
//             showCancelButton: true,
//             confirmButtonText: 'Buscar',
//             preConfirm: () => {
//                 return {
//                     desde: document.getElementById('swal-desde').value,
//                     hasta: document.getElementById('swal-hasta').value
//                 };
//             }
//         }).then((result) => {
//             if (result.isConfirmed && result.value.desde && result.value.hasta) {
//                 obtenerParadasPendientes(result.value.desde, result.value.hasta);
//             }
//         });
//     };

//     const renderizarTablaPendientes = function (lista) {
//         const contenedor = $('#contenedor-tabla-paradas');

//         if (!lista || lista.length === 0) {
//             contenedor.html('<div class="alert alert-success text-center m-3"><i class="fas fa-check-circle"></i> No hay pesajes pendientes para la selección.</div>');
//             return;
//         }

//         let htmlTabla = `
//             <div class="table-responsive">
//                 <table class="table table-hover align-middle mb-0">
//                     <thead class="table-light">
//                         <tr>
//                             <th>Viaje / Fecha</th>
//                             <th>Origen</th>
//                             <th>Material Expected</th>
//                             <th class="text-center">Acción</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//         `;

//         lista.forEach(item => {
//             let fechaFmt = new Date(item.HojaRutaFecha).toLocaleDateString('es-AR');

//             htmlTabla += `
//                 <tr>
//                     <td>
//                         <strong class="text-primary">#${item.Id_HojaRuta}</strong><br>
//                         <small class="text-muted">${fechaFmt}</small>
//                     </td>
//                     <td class="fw-bold text-dark">${item.Origen}</td>
//                     <td><span class="badge bg-info text-dark">${item.TipoMaterial}</span></td>
//                     <td class="text-center">
//                         <button type="button" class="btn btn-sm btn-outline-primary btn-seleccionar-parada"
//                                 data-iddetalle="${item.Id_Detalle_HDR}"
//                                 data-idtipomaterial="${item.Id_TipoMaterial}"
//                                 data-idorigen="${item.Id_Origen}"
//                                 data-materialnombre="${item.TipoMaterial}"
//                                 data-origennombre="${item.Origen}"
//                                 data-idingreso="${item.Id_Ingreso_Material || ''}">
//                             <i class="fas fa-balance-scale"></i> Pesar
//                         </button>
//                     </td>
//                 </tr>
//             `;
//         });

//         htmlTabla += `</tbody></table></div>`;
//         contenedor.html(htmlTabla);
//     };

//     // 4. FORMULARIO DE PESAJE
//     const renderizarFormularioPesaje = function (materialPlanificado, origenPlanificado) {
//         const contenedor = $('#contenedor-formulario-pesaje');
//         const hoyLocal = obtenerFechaLocalISO();

//         let htmlForm = `
//             <div class="card border-primary shadow fade-in">
//                 <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
//                     <h5 class="mb-0"><i class="fas fa-weight"></i> Registrar Pesada en Báscula</h5>
//                     <span class="badge bg-light text-primary fs-6">${origenPlanificado || 'Origen General'}</span>
//                 </div>
//                 <div class="card-body">
//                     <form id="form-pesaje-parada">
//                         <div class="row">
//                             <div class="col-md-6 mb-3">
//                                 <label class="form-label text-muted">Material Esperado</label>
//                                 <input type="text" class="form-control fw-bold" value="${materialPlanificado || 'Varios'}" disabled>
//                             </div>
//                             <div class="col-md-6 mb-3">
//                                 <label class="form-label fw-bold">Fecha Pesaje *</label>
//                                 <input type="date" id="input-fecha-detalle" class="form-control border-primary" value="${hoyLocal}" required>
//                             </div>
//                         </div>

//                         <div class="row">
//                             <div class="col-md-6 mb-3">
//                                 <label class="form-label fw-bold text-success">Peso Bruto (Kg) *</label>
//                                 <input type="number" step="0.01" min="0.1" id="input-peso-bruto" class="form-control form-control-lg border-success fw-bold" required placeholder="0.00">
//                             </div>
//                             <div class="col-md-6 mb-3">
//                                 <label class="form-label">Observaciones</label>
//                                 <input type="text" id="input-observaciones" class="form-control" placeholder="Ej: Material húmedo...">
//                             </div>
//                         </div>

//                         <div class="text-end mt-2">
//                             <button type="submit" class="btn btn-success btn-lg">
//                                 <i class="fas fa-save"></i> Confirmar y Guardar Pesada
//                             </button>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         `;

//         contenedor.html(htmlForm);
//     };

//     // 5. REGISTRAR PESAJE
//     const registrarPesada = function (e) {
//         e.preventDefault();

//         let pesoIngresado = parseFloat($("#input-peso-bruto").val());
//         let fechaIngresada = $("#input-fecha-detalle").val();

//         if (isNaN(pesoIngresado) || pesoIngresado <= 0) {
//             Swal.fire('Atención', 'Ingrese un peso bruto mayor a 0.', 'warning');
//             return;
//         }

//         // Si no hay idIngresoMaterial activo en sesión, asignamos por defecto 1 o requerimos vinculación
//         let idIngresoFinal = estado.idIngresoMaterial ? parseInt(estado.idIngresoMaterial) : 1;

//         const pesadaObj = {
//             "Id_Ingreso_Material": idIngresoFinal,
//             "Id_Origen": parseInt(estado.idOrigenSeleccionado) || 27,
//             "PesoBruto": pesoIngresado,
//             "Id_Tipo_Material": parseInt(estado.idTipoMaterialSeleccionado) || 8,
//             "Id_Detalle_HDR": estado.idDetalleHdrSeleccionado ? parseInt(estado.idDetalleHdrSeleccionado) : null,
//             "Observaciones": $("#input-observaciones").val().trim() || null,
//             "fechaDetalleIng": fechaIngresada
//         };

//         $.ajax({
//             type: "POST",
//             url: URL_DETALLE_INGRESO,
//             data: JSON.stringify(pesadaObj),
//             contentType: "application/json; charset=utf-8",
//             success: function () {
//                 Swal.fire({
//                     title: '¡Pesada Registrada!',
//                     text: 'El registro ha sido procesado exitosamente.',
//                     icon: 'success',
//                     timer: 1200,
//                     showConfirmButton: false
//                 });

//                 $('#contenedor-formulario-pesaje').html(`
//                     <div class="alert alert-success text-center m-2 fade-in">
//                         <i class="fas fa-check-circle"></i> Pesada registrada con éxito. Seleccione otro ítem de la lista para continuar.
//                     </div>
//                 `);

//                 // Recargar dinámicamente ambas tablas
//                 obtenerParadasPendientes();
//                 obtenerPesadasProcesadas();
//             },
//             error: function (err) {
//                 let msg = err.responseText ? err.responseText.replace(/"/g, '') : 'Error al registrar pesada.';
//                 Swal.fire('Error', msg, 'error');
//             }
//         });
//     };

//     // 6. HISTORIAL DE PESAJES PROCESADOS
//     const obtenerPesadasProcesadas = function () {
//         let url = estado.idIngresoMaterial 
//             ? `${URL_DETALLE_INGRESO}/PorCabecera/${estado.idIngresoMaterial}`
//             : URL_DETALLE_INGRESO; // Si no hay ingreso específico, lista el general de báscula

//         $.ajax({
//             type: "GET",
//             url: url,
//             success: function (data) {
//                 renderizarTablaProcesados(data);
//             },
//             error: function (err) {
//                 console.error("Error al obtener procesados:", err);
//             }
//         });
//     };

//     const renderizarTablaProcesados = function (lista) {
//         const contenedor = $('#contenedor-tabla-pesadas-realizadas');

//         if (!lista || lista.length === 0) {
//             contenedor.html('<p class="text-muted small p-2">Aún no se registran pesajes procesados.</p>');
//             return;
//         }

//         // Mostramos los últimos 10 procesados
//         const ultimosDiez = lista.slice(0, 10);
//         let totalKilos = 0;

//         let htmlTabla = `
//             <div class="table-responsive shadow-sm mt-2 fade-in">
//                 <table class="table table-sm table-striped table-bordered mb-0 align-middle">
//                     <thead class="table-dark">
//                         <tr>
//                             <th class="text-center">N° Pesada</th>
//                             <th>Fecha Pesaje</th>
//                             <th>Material</th>
//                             <th class="text-end">Peso Bruto</th>
//                             <th>Observaciones</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//         `;

//         ultimosDiez.forEach(item => {
//             totalKilos += parseFloat(item.PesoBruto || 0);
//             let fechaFmt = item.fechaDetalleIng ? new Date(item.fechaDetalleIng).toLocaleDateString('es-AR') : 'Hoy';

//             htmlTabla += `
//                 <tr>
//                     <td class="text-center fw-bold text-secondary">#${item.IdDetalleIngreso}</td>
//                     <td class="small">${fechaFmt}</td>
//                     <td class="fw-bold">${item.Tipo || item.TipoMaterial || 'Material'}</td>
//                     <td class="text-success fw-bold text-end">${item.PesoBruto.toFixed(2)} kg</td>
//                     <td class="text-muted small">${item.Observaciones || '-'}</td>
//                 </tr>
//             `;
//         });

//         htmlTabla += `
//                     </tbody>
//                     <tfoot class="table-light">
//                         <tr>
//                             <th colspan="3" class="text-end text-uppercase text-secondary">Total Acumulado en Vista:</th>
//                             <th class="text-end text-success fw-bold fs-6">${totalKilos.toFixed(2)} kg</th>
//                             <th></th>
//                         </tr>
//                     </tfoot>
//                 </table>
//             </div>
//         `;

//         contenedor.html(htmlTabla);
//     };

//     return {
//         cargarEn: inicializar
//     };
// })();

