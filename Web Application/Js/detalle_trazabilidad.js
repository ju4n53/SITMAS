const DetalleModulo = (function () {
    // 🔒 ESTADO PRIVADO (Nuestro bloc de notas temporal)
    let estado = {
        idIngresoMaterial: null,
        idHojaRuta: null,
        idDetalleHdrSeleccionado: null,
        idTipoMaterialSeleccionado: null,
        idOrigenSeleccionado: null
    };

    // URLs de la API
    const URL_DETALLE_INGRESO = "https://localhost:44325/api/DetalleIngreso";
    const URL_DETALLE_PARAINGRESO = "https://localhost:44325/api/detallehojaruta/ParaIngreso/";

    // 💾 GESTIÓN DE MEMORIA TEMPORAL (sessionStorage)
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
    };

    // 1. INICIALIZACIÓN
    const inicializar = function (contenedorId, idIngresoNuevo, idHojaRutaSeleccionada) {
        // Verificamos si venimos de Ingreso con datos nuevos
        if (idIngresoNuevo && idHojaRutaSeleccionada) {
            estado.idIngresoMaterial = idIngresoNuevo;
            estado.idHojaRuta = idHojaRutaSeleccionada;
            guardarEstadoEnMemoria();
        } else {
            // Si la página se recargó, intentamos recuperar la foto del bolsillo
            let recuperado = recuperarEstadoDeMemoria();
            if (!recuperado) {
                Swal.fire({
                    title: 'Sesión Expirada',
                    text: 'No se encontró un ingreso activo en memoria. Seleccione una Hoja de Ruta nuevamente.',
                    icon: 'warning',
                    confirmButtonText: 'Ir a Ingresos'
                }).then(() => {
                    redirigirAIngreso();
                });
                return;
            }
        }

        const contenedor = $(`#${contenedorId}`);

        let htmlEstructura = `
            <div class="row fade-in">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <div>
                            <h4 class="text-primary d-inline me-3"><i class="fas fa-route"></i> Paradas del Viaje #${estado.idHojaRuta}</h4>
                            <span class="badge bg-success fs-6">Ingreso Planta #${estado.idIngresoMaterial}</span>
                        </div>
                        <button id="btn-salir-detalle" class="btn btn-outline-danger btn-sm">
                            <i class="fas fa-sign-out-alt"></i> Salir de este Ingreso
                        </button>
                    </div>
                    <div id="contenedor-tabla-paradas">
                        <div class="text-center my-4"><div class="spinner-border text-primary"></div><p>Cargando paradas...</p></div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-12" id="contenedor-formulario-pesaje">
                    <!-- Formulario inyectado dinámicamente al seleccionar parada -->
                </div>
            </div>

            <div class="row mt-5 fade-in">
                <div class="col-12">
                    <h5 class="text-secondary border-bottom pb-2"><i class="fas fa-clipboard-check"></i> Pesajes Realizados en este Ingreso</h5>
                    <div id="contenedor-tabla-pesadas-realizadas">
                        <div class="text-center my-3"><div class="spinner-border text-secondary"></div><p>Cargando historial...</p></div>
                    </div>
                </div>
            </div>
        `;

        contenedor.html(htmlEstructura);
        enlazarEventos();

        obtenerParadasDeHojaRuta();
        obtenerPesadasDelDia();
    };

    // 2. ENLACE SEGURO DE EVENTOS (Evita duplicación de listeners)
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-trazabilidad');

        // Evento para seleccionar parada
        principal.off('click', '.btn-seleccionar-parada').on('click', '.btn-seleccionar-parada', function () {
            let boton = $(this);

            estado.idDetalleHdrSeleccionado = boton.data('iddetalle');
            estado.idTipoMaterialSeleccionado = boton.data('idtipomaterial');
            estado.idOrigenSeleccionado = boton.data('idorigen');

            let materialNombre = boton.data('materialnombre');
            let origenNombre = boton.data('origennombre');

            renderizarFormularioPesaje(materialNombre, origenNombre);
        });

        // Evento para submit de pesaje
        principal.off('submit', '#form-pesaje-parada').on('submit', '#form-pesaje-parada', registrarPesada);

        // Evento manual para el botón "Salir"
        principal.off('click', '#btn-salir-detalle').on('click', '#btn-salir-detalle', function () {
            Swal.fire({
                title: '¿Desea salir?',
                text: 'Se cerrará el detalle de este ingreso y volverá a la pestaña de búsquedas.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#dc3545'
            }).then((result) => {
                if (result.isConfirmed) {
                    limpiarMemoria();
                    redirigirAIngreso();
                }
            });
        });
    };

    // 3. NAVEGACIÓN Y REDIRECCIONES HETERO-MÓDULO
    const redirigirAIngreso = function () {
        $('#trazabilidadTabs .nav-link').removeClass('active').addClass('text-secondary');
        $('#tab-ingreso').removeClass('text-secondary').addClass('active');

        if (typeof IngresoModulo !== 'undefined') {
            IngresoModulo.cargarEn("contenedor-dinamico-trazabilidad");
        }
    };

    const redirigirAClasificacion = function () {
        $('#trazabilidadTabs .nav-link').removeClass('active').addClass('text-secondary');
        $('#tab-clasificacion').removeClass('text-secondary').addClass('active');

        if (typeof ClasificacionModulo !== 'undefined') {
            ClasificacionModulo.cargarEn("contenedor-dinamico-trazabilidad", estado.idIngresoMaterial);
        }
    };

    // 4. CONSULTA Y RENDERIZADO DE PARADAS PENDIENTES
    const obtenerParadasDeHojaRuta = function () {
        $.ajax({
            type: "GET",
            url: `${URL_DETALLE_PARAINGRESO}${estado.idHojaRuta}`,
            success: function (data) {
                renderizarTablaParadas(data);
            },
            error: function (err) {
                console.error("Error al obtener paradas:", err);
                $('#contenedor-tabla-paradas').html('<div class="alert alert-danger">Error al cargar las paradas del camión.</div>');
            }
        });
    };

    const renderizarTablaParadas = function (listaParadas) {
        const contenedor = $('#contenedor-tabla-paradas');

        if (!listaParadas || listaParadas.length === 0) {
            contenedor.html('<div class="alert alert-warning text-center"><i class="fas fa-info-circle"></i> No hay paradas planificadas pendientes para este viaje.</div>');
            return;
        }

        let htmlTabla = `
            <div class="table-responsive shadow-sm">
                <table class="table table-striped table-hover border align-middle mb-0" id="tabla-paradas-pendientes">
                    <thead class="table-dark">
                        <tr>
                            <th>Origen / Empresa</th>
                            <th>Material Planificado</th>
                            <th>Tipo Movimiento</th>
                            <th class="text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        listaParadas.forEach(parada => {
            let botonAccion = '';

            if (parada.YaPesado === 1) {
                botonAccion = `
                    <button type="button" class="btn btn-sm btn-secondary" disabled>
                        <i class="fas fa-lock"></i> Ya Pesado
                    </button>
                `;
            } else {
                botonAccion = `
                    <button type="button" class="btn btn-sm btn-outline-primary btn-seleccionar-parada" 
                            data-iddetalle="${parada.Id_Detalle_HDR}"
                            data-idtipomaterial="${parada.Id_TipoMaterial}"
                            data-idorigen="${parada.Id_Origen}"
                            data-materialnombre="${parada.TipoMaterial}"
                            data-origennombre="${parada.Origen}">
                        <i class="fas fa-balance-scale"></i> Pesar
                    </button>
                `;
            }

            htmlTabla += `
                <tr>
                    <td class="fw-bold">${parada.Origen || 'Sin Origen'}</td>
                    <td><span class="badge bg-info text-dark">${parada.TipoMaterial || 'Varios'}</span></td>
                    <td>${parada.TipoMovimiento}</td>
                    <td class="text-center">${botonAccion}</td>
                </tr>
            `;
        });

        htmlTabla += `</tbody></table></div>`;
        contenedor.html(htmlTabla);
    };

    // 5. FORMULARIO DINÁMICO DE PESAJE
    const renderizarFormularioPesaje = function (materialPlanificado, origenPlanificado) {
        const contenedor = $('#contenedor-formulario-pesaje');

        let htmlForm = `
            <div class="card border-primary shadow fade-in">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-weight"></i> Registrar Pesada (Báscula)</h5>
                    <span class="badge bg-light text-primary fs-6">${origenPlanificado || 'Sin Origen Planificado'}</span>
                </div>
                <div class="card-body">
                    <form id="form-pesaje-parada">
                        <div class="row align-items-end">
                            <div class="col-md-3 mb-3">
                                <label class="form-label text-muted">Material Esperado</label>
                                <input type="text" class="form-control fw-bold" value="${materialPlanificado || 'Varios'}" disabled>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label class="form-label fw-bold text-success">Peso Bruto (Kg) *</label>
                                <input type="number" step="0.01" min="0.1" id="input-peso-bruto" class="form-control form-control-lg border-success" required placeholder="0.00">
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Observaciones (Opcional)</label>
                                <input type="text" id="input-observaciones" class="form-control" placeholder="Ej: Material húmedo...">
                            </div>
                            <div class="col-md-2 mb-3 text-end">
                                <button type="submit" class="btn btn-success btn-lg w-100">
                                    <i class="fas fa-save"></i> Guardar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        contenedor.html(htmlForm);
        setTimeout(() => $('#input-peso-bruto').focus(), 100);
    };

    // 6. REGISTRAR PESAJE EN API
    const registrarPesada = function (e) {
        e.preventDefault();

        let pesoIngresado = parseFloat($("#input-peso-bruto").val());

        if (!estado.idIngresoMaterial) {
            Swal.fire('Error crítico', 'Falta la referencia de la cabecera del ingreso.', 'error');
            return;
        }

        if (isNaN(pesoIngresado) || pesoIngresado <= 0) {
            Swal.fire('Atención', 'Por favor, ingrese un Peso Bruto válido mayor a 0.', 'warning');
            return;
        }

        // Reglas de negocio para vacíos/nulos
        let origenFinal = parseInt(estado.idOrigenSeleccionado);
        let observacionesFinal = $("#input-observaciones").val() || "";

        if (!origenFinal || isNaN(origenFinal)) {
            origenFinal = 27; // ID 27 = "Otro"
            observacionesFinal = observacionesFinal ? "Sin origen planificado. " + observacionesFinal : "Sin origen planificado.";
        }

        let materialFinal = parseInt(estado.idTipoMaterialSeleccionado);
        if (!materialFinal || isNaN(materialFinal)) {
            materialFinal = 8; // ID 8 = "Otro"
        }

        const pesadaObj = {
            "Id_Ingreso_Material": parseInt(estado.idIngresoMaterial),
            "Id_Origen": origenFinal,
            "PesoBruto": pesoIngresado,
            "Id_Tipo_Material": materialFinal,
            "Id_Detalle_HDR": estado.idDetalleHdrSeleccionado && estado.idDetalleHdrSeleccionado !== "null" ? parseInt(estado.idDetalleHdrSeleccionado) : null,
            "Observaciones": observacionesFinal || null
        };

        $.ajax({
            type: "POST",
            url: URL_DETALLE_INGRESO,
            data: JSON.stringify(pesadaObj),
            contentType: "application/json; charset=utf-8",
            success: function (response) {
                Swal.fire({
                    title: '¡Pesada Registrada!',
                    text: 'El material fue guardado correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Ocultamos la fila procesada de forma suave
                $(`.btn-seleccionar-parada[data-iddetalle="${estado.idDetalleHdrSeleccionado}"]`)
                    .closest('tr')
                    .fadeOut(400, function () {
                        $(this).remove();

                        // 🌟 VERIFICAMOS SI TODAS LAS PARADAS FUERON PROCESADAS
                        if ($('#tabla-paradas-pendientes tbody tr').length === 0) {
                            $('#contenedor-tabla-paradas').html('<div class="alert alert-success text-center fade-in"><i class="fas fa-check-double"></i> ¡Todas las paradas han sido procesadas!</div>');
                            
                            // Limpiamos la memoria temporal
                            limpiarMemoria();

                            // Disparamos el modal automático de decisión
                            Swal.fire({
                                title: '¡Todas las paradas completadas!',
                                text: '¿Desea avanzar al módulo de Clasificación o volver a Ingreso?',
                                icon: 'success',
                                showCancelButton: true,
                                confirmButtonColor: '#198754', // Botón verde (Derecha)
                                cancelButtonColor: '#dc3545',  // Botón rojo (Izquierda)
                                confirmButtonText: '<i class="fas fa-arrow-right"></i> Ir a Clasificación',
                                cancelButtonText: '<i class="fas fa-sign-out-alt"></i> Salir'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    redirigirAClasificacion();
                                } else {
                                    redirigirAIngreso();
                                }
                            });
                        }
                    });

                $('#contenedor-formulario-pesaje').empty();
                obtenerPesadasDelDia();
            },
            error: function (err) {
                console.error("Error devuelto por el servidor:", err);
                let mensajeError = err.responseText ? err.responseText.replace(/"/g, '') : 'Hubo un problema al registrar el detalle.';
                Swal.fire('Error del Sistema', mensajeError, 'error');
            }
        });
    };

    // 7. TABLA INFERIOR DE HISTORIAL
    const obtenerPesadasDelDia = function () {
        $.ajax({
            type: "GET",
            url: `${URL_DETALLE_INGRESO}/PorCabecera/${estado.idIngresoMaterial}`,
            success: function (data) {
                renderizarTablaPesadas(data);
            },
            error: function (err) {
                console.error("Error al obtener pesadas:", err);
            }
        });
    };

    const renderizarTablaPesadas = function (listaPesadas) {
        const contenedor = $('#contenedor-tabla-pesadas-realizadas');

        if (!listaPesadas || listaPesadas.length === 0) {
            contenedor.html('<p class="text-muted small">Aún no hay pesajes registrados para este camión.</p>');
            return;
        }

        let htmlTabla = `
            <div class="table-responsive shadow-sm mt-3 fade-in">
                <table class="table table-sm table-bordered mb-0">
                    <thead class="table-light">
                        <tr>
                            <th class="text-center">N° Pesada</th>
                            <th>Material</th>
                            <th>Peso Bruto</th>
                            <th>Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        listaPesadas.forEach(pesada => {
            htmlTabla += `
                <tr>
                    <td class="text-center text-secondary">#${pesada.IdDetalleIngreso}</td>
                    <td class="fw-bold">${pesada.Tipo}</td>
                    <td class="text-success fw-bold">${pesada.PesoBruto} kg</td>
                    <td class="text-muted fst-italic">${pesada.Observaciones || '-'}</td>
                </tr>
            `;
        });

        htmlTabla += `</tbody>mtable></div>`;
        contenedor.html(htmlTabla);
    };

    // Public API del módulo
    return {
        cargarEn: inicializar
    };
})();




// const DetalleModulo = (function () {
//     // 🔒 NUESTRO BLOC DE NOTAS PRIVADO (Estado)
//     let estado = {
//         idIngresoMaterial: null,
//         idHojaRuta: null,
//         idDetalleHdrSeleccionado: null,
//         idTipoMaterialSeleccionado: null,
//         idOrigenSeleccionado: null
//     };

//     // URLs de la API
//     const URL_DETALLE_INGRESO = "https://localhost:44325/api/DetalleIngreso";
//     const URL_DETALLE_PARAINGRESO = "https://localhost:44325/api/detallehojaruta/ParaIngreso/";

//     // ✨ NUEVAS FUNCIONES DE MEMORIA (Web Storage API)
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

//     // 1. INICIALIZACIÓN (Recibe la posta del módulo anterior)
//     const inicializar = function (contenedorId, idIngresoNuevo, idHojaRutaSeleccionada) {
        
//         // Verificamos si venimos desde la pestaña Ingreso con datos frescos
//         if (idIngresoNuevo && idHojaRutaSeleccionada) {
//             estado.idIngresoMaterial = idIngresoNuevo;
//             estado.idHojaRuta = idHojaRutaSeleccionada;
//             guardarEstadoEnMemoria(); // Guardamos en el bolsillo
//         } else {
//             // Si la página se recargó, buscamos en el bolsillo
//             let recuperado = recuperarEstadoDeMemoria();
//             if (!recuperado) {
//                 Swal.fire('Sesión Expirada', 'No se encontró un ingreso activo. Por favor, vuelva a la pestaña de Ingreso y seleccione la hoja de ruta nuevamente.', 'warning');
//                 return; // Frenamos la ejecución
//             }
//         }

//         const contenedor = $(`#${contenedorId}`);

//         let htmlEstructura = `
//             <div class="row fade-in">
//                 <div class="col-12">
//                     <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
//                         <h4 class="text-primary"><i class="fas fa-route"></i> Paradas del Viaje #${estado.idHojaRuta}</h4>
//                         <span class="badge bg-success fs-6">Ingreso Planta #${estado.idIngresoMaterial}</span>
//                     </div>
//                     <div id="contenedor-tabla-paradas">
//                         <div class="text-center"><div class="spinner-border text-primary"></div><p>Cargando paradas...</p></div>
//                     </div>
//                 </div>
//             </div>
            
//             <div class="row mt-4">
//                 <div class="col-12" id="contenedor-formulario-pesaje">
//                     <!-- Aquí inyectaremos el formulario al hacer clic en Pesar -->
//                 </div>
//             </div>

//             <div class="row mt-5 fade-in">
//                 <div class="col-12">
//                     <h5 class="text-secondary border-bottom pb-2"><i class="fas fa-clipboard-check"></i> Pesajes Realizados en este Ingreso</h5>
//                     <div id="contenedor-tabla-pesadas-realizadas">
//                         <div class="text-center"><div class="spinner-border text-secondary"></div><p>Cargando historial...</p></div>
//                     </div>
//                 </div>
//             </div>
//         `;

//         contenedor.html(htmlEstructura);
//         enlazarEventos();

//         // Disparamos las búsquedas a la base de datos automáticamente
//         obtenerParadasDeHojaRuta();
//         obtenerPesadasDelDia();
//     };

//     // 2. EVENTOS (Delegación de eventos segura)
//     const enlazarEventos = function () {
//         const principal = $('#contenedor-dinamico-trazabilidad');

//         // Evento para seleccionar una parada y abrir el formulario
//         principal.off('click', '.btn-seleccionar-parada').on('click', '.btn-seleccionar-parada', function () {
//             let boton = $(this);

//             estado.idDetalleHdrSeleccionado = boton.data('iddetalle');
//             estado.idTipoMaterialSeleccionado = boton.data('idtipomaterial');
//             estado.idOrigenSeleccionado = boton.data('idorigen');

//             let materialNombre = boton.data('materialnombre');
//             let origenNombre = boton.data('origennombre');

//             renderizarFormularioPesaje(materialNombre, origenNombre);
//         });

//         // Evento para enviar el formulario de pesaje
//         principal.off('submit', '#form-pesaje-parada').on('submit', '#form-pesaje-parada', registrarPesada);
//     };

//     // 3. TABLA SUPERIOR: PARADAS PENDIENTES
//     const obtenerParadasDeHojaRuta = function () {
//         $.ajax({
//             type: "GET",
//             url: `${URL_DETALLE_PARAINGRESO}${estado.idHojaRuta}`,
//             success: function (data) {
//                 renderizarTablaParadas(data);
//             },
//             error: function (err) {
//                 console.error("Error al obtener paradas", err);
//                 $('#contenedor-tabla-paradas').html('<div class="alert alert-danger">Error al cargar las paradas del camión.</div>');
//             }
//         });
//     };

//     const renderizarTablaParadas = function (listaParadas) {
//         const contenedor = $('#contenedor-tabla-paradas');

//         if (!listaParadas || listaParadas.length === 0) {
//             contenedor.html('<div class="alert alert-warning text-center"><i class="fas fa-info-circle"></i> No hay paradas planificadas pendientes.</div>');
//             return;
//         }

//         let htmlTabla = `
//             <div class="table-responsive shadow-sm">
//                 <table class="table table-striped table-hover border align-middle mb-0" id="tabla-paradas-pendientes">
//                     <thead class="table-dark">
//                         <tr>
//                             <th>Origen / Empresa</th>
//                             <th>Material Planificado</th>
//                             <th>Tipo Movimiento</th>
//                             <th class="text-center">Acción</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//         `;

//         listaParadas.forEach(parada => {
//             let botonAccion = '';

//             if (parada.YaPesado === 1) {
//                 botonAccion = `
//                     <button type="button" class="btn btn-sm btn-secondary" disabled>
//                         <i class="fas fa-lock"></i> Ya Pesado
//                     </button>
//                 `;
//             } else {
//                 botonAccion = `
//                     <button type="button" class="btn btn-sm btn-outline-primary btn-seleccionar-parada" 
//                             data-iddetalle="${parada.Id_Detalle_HDR}"
//                             data-idtipomaterial="${parada.Id_TipoMaterial}"
//                             data-idorigen="${parada.Id_Origen}"
//                             data-materialnombre="${parada.TipoMaterial}"
//                             data-origennombre="${parada.Origen}">
//                         <i class="fas fa-balance-scale"></i> Pesar
//                     </button>
//                 `;
//             }

//             htmlTabla += `
//                 <tr>
//                     <td class="fw-bold">${parada.Origen || 'Sin Origen'}</td>
//                     <td><span class="badge bg-info text-dark">${parada.TipoMaterial || 'Varios'}</span></td>
//                     <td>${parada.TipoMovimiento}</td>
//                     <td class="text-center">
//                         ${botonAccion}
//                     </td>
//                 </tr>
//             `;
//         });

//         htmlTabla += `</tbody></table></div>`;
//         contenedor.html(htmlTabla);
//     };

//     // 4. FORMULARIO DE PESAJE DINÁMICO
//     const renderizarFormularioPesaje = function (materialPlanificado, origenPlanificado) {
//         const contenedor = $('#contenedor-formulario-pesaje');

//         let htmlForm = `
//             <div class="card border-primary shadow fade-in">
//                 <div class="card-header bg-primary text-white d-flex justify-content-between">
//                     <h5 class="mb-0">Registrar Pesada (Báscula)</h5>
//                     <span class="mb-0">${origenPlanificado || 'Sin Origen Planificado'}</span>
//                 </div>
//                 <div class="card-body">
//                     <form id="form-pesaje-parada">
//                         <div class="row align-items-end">
//                             <div class="col-md-3 mb-3">
//                                 <label class="form-label text-muted">Material Esperado</label>
//                                 <input type="text" class="form-control fw-bold" value="${materialPlanificado || 'Varios'}" disabled>
//                             </div>
//                             <div class="col-md-3 mb-3">
//                                 <label class="form-label fw-bold text-success">Peso Bruto (Kg) *</label>
//                                 <input type="number" step="0.01" min="0.1" id="input-peso-bruto" class="form-control form-control-lg border-success" required placeholder="0.00">
//                             </div>
//                             <div class="col-md-4 mb-3">
//                                 <label class="form-label">Observaciones (Opcional)</label>
//                                 <input type="text" id="input-observaciones" class="form-control" placeholder="Ej: Material húmedo...">
//                             </div>
//                             <div class="col-md-2 mb-3 text-end">
//                                 <button type="submit" class="btn btn-success btn-lg w-100">
//                                     <i class="fas fa-save"></i> Guardar
//                                 </button>
//                             </div>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         `;

//         contenedor.html(htmlForm);
//         setTimeout(() => $('#input-peso-bruto').focus(), 100); 
//     };


//     // 5. REGISTRAR PESAJE (AJAX POST y EFECTO MÁGICO)
//     const registrarPesada = function (e) {
//         e.preventDefault();

//         let pesoIngresado = parseFloat($("#input-peso-bruto").val());

//         if (!estado.idIngresoMaterial) {
//             Swal.fire('Error crítico', 'Falta la referencia de la cabecera del ingreso.', 'error');
//             return; 
//         }

//         if (isNaN(pesoIngresado) || pesoIngresado <= 0) {
//             Swal.fire('Atención', 'Por favor, ingrese un Peso Bruto válido mayor a 0.', 'warning');
//             return;
//         }

//         // 🌟 APLICAMOS TU REGLA DE NEGOCIO PARA ORIGEN Y MATERIAL
//         let origenFinal = parseInt(estado.idOrigenSeleccionado);
//         let observacionesFinal = $("#input-observaciones").val() || "";

//         if (!origenFinal || isNaN(origenFinal)) {
//             origenFinal = 27; // Origen "Otro"
//             observacionesFinal = observacionesFinal ? "Sin origen planificado. " + observacionesFinal : "Sin origen planificado.";
//         }

//         let materialFinal = parseInt(estado.idTipoMaterialSeleccionado);
//         if (!materialFinal || isNaN(materialFinal)) {
//             materialFinal = 8; // Material "Otro"
//         }

//         const pesadaObj = {
//             "Id_Ingreso_Material": parseInt(estado.idIngresoMaterial),
//             "Id_Origen": origenFinal,
//             "PesoBruto": pesoIngresado,
//             "Id_Tipo_Material": materialFinal,
//             "Id_Detalle_HDR": estado.idDetalleHdrSeleccionado && estado.idDetalleHdrSeleccionado !== "null" ? parseInt(estado.idDetalleHdrSeleccionado) : null,
//             "Observaciones": observacionesFinal || null
//         };

//         $.ajax({
//             type: "POST",
//             url: URL_DETALLE_INGRESO,
//             data: JSON.stringify(pesadaObj),
//             contentType: "application/json; charset=utf-8",
//             success: function (response) {

//                 Swal.fire({
//                     title: '¡Pesada Registrada!',
//                     text: 'El material fue guardado correctamente.',
//                     icon: 'success',
//                     timer: 1500,
//                     showConfirmButton: false
//                 });

//                 // ✨ Ocultamos solo la fila correcta
//                 $(`.btn-seleccionar-parada[data-iddetalle="${estado.idDetalleHdrSeleccionado}"]`)
//                     .closest('tr')
//                     .fadeOut(400, function () {
//                         $(this).remove();

//                         if ($('#tabla-paradas-pendientes tbody tr').length === 0) {
//                             $('#contenedor-tabla-paradas').html('<div class="alert alert-success text-center fade-in"><i class="fas fa-check-double"></i> ¡Todas las paradas han sido procesadas!</div>');
//                         }
//                     });

//                 $('#contenedor-formulario-pesaje').empty();
//                 obtenerPesadasDelDia();
//             },
//             error: function (err) {
//                 console.error("Error devuelto por el servidor:", err);
//                 let mensajeError = err.responseText ? err.responseText.replace(/"/g, '') : 'Hubo un problema al registrar el detalle.';
//                 Swal.fire('Error del Sistema', mensajeError, 'error');
//             }
//         });
//     };


//     // 6. TABLA INFERIOR: PESAJES REALIZADOS
//     const obtenerPesadasDelDia = function () {
//         $.ajax({
//             type: "GET",
//             url: `${URL_DETALLE_INGRESO}/PorCabecera/${estado.idIngresoMaterial}`,
//             success: function (data) {
//                 renderizarTablaPesadas(data);
//             },
//             error: function (err) {
//                 console.error("Error al obtener pesadas", err);
//             }
//         });
//     };

//     const renderizarTablaPesadas = function (listaPesadas) {
//         const contenedor = $('#contenedor-tabla-pesadas-realizadas');

//         if (!listaPesadas || listaPesadas.length === 0) {
//             contenedor.html('<p class="text-muted small">Aún no hay pesajes registrados para este camión.</p>');
//             return;
//         }

//         let htmlTabla = `
//             <div class="table-responsive shadow-sm mt-3 fade-in">
//                 <table class="table table-sm table-bordered mb-0">
//                     <thead class="table-light">
//                         <tr>
//                             <th class="text-center">N° Pesada</th>
//                             <th>Material</th>
//                             <th>Peso Bruto</th>
//                             <th>Observaciones</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//         `;

//         listaPesadas.forEach(pesada => {
//             htmlTabla += `
//                 <tr>
//                     <td class="text-center text-secondary">#${pesada.IdDetalleIngreso}</td>
//                     <td class="fw-bold">${pesada.Tipo}</td>
//                     <td class="text-success fw-bold">${pesada.PesoBruto} kg</td>
//                     <td class="text-muted fst-italic">${pesada.Observaciones || '-'}</td>
//                 </tr>
//             `;
//         });

//         htmlTabla += `</tbody></table></div>`;
//         contenedor.html(htmlTabla);
//     };

//     // Revelamos públicamente
//     return {
//         cargarEn: inicializar
//     };
// })();
