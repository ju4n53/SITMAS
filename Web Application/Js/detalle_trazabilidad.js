const DetalleModulo = (function () {
    // 🔒 NUESTRO BLOC DE NOTAS PRIVADO (Estado)
    let estado = {
        idIngresoMaterial: null,
        idHojaRuta: null,
        idDetalleHdrSeleccionado: null, 
        idTipoMaterialSeleccionado: null,
        idOrigenSeleccionado: null
    };

    // URLs de la API
    const URL_DETALLE_HDR = "https://localhost:44325/api/detallehojaruta";
    const URL_DETALLE_INGRESO = "https://localhost:44325/api/DetalleIngreso";

    // 1. INICIALIZACIÓN (Recibe la posta del módulo anterior)
    const inicializar = function (contenedorId, idIngresoNuevo, idHojaRutaSeleccionada) {
        estado.idIngresoMaterial = idIngresoNuevo;
        estado.idHojaRuta = idHojaRutaSeleccionada;

        const contenedor = $(`#${contenedorId}`);
        
        let htmlEstructura = `
            <div class="row fade-in">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <h4 class="text-primary"><i class="fas fa-route"></i> Paradas del Viaje #${estado.idHojaRuta}</h4>
                        <span class="badge bg-success fs-6">Ingreso Planta #${estado.idIngresoMaterial}</span>
                    </div>
                    <div id="contenedor-tabla-paradas">
                        <div class="text-center"><div class="spinner-border text-primary"></div><p>Cargando paradas...</p></div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-12" id="contenedor-formulario-pesaje">
                    <!-- Aquí inyectaremos el formulario al hacer clic en Pesar -->
                </div>
            </div>

            <div class="row mt-5 fade-in">
                <div class="col-12">
                    <h5 class="text-secondary border-bottom pb-2"><i class="fas fa-clipboard-check"></i> Pesajes Realizados en este Ingreso</h5>
                    <div id="contenedor-tabla-pesadas-realizadas">
                        <div class="text-center"><div class="spinner-border text-secondary"></div><p>Cargando historial...</p></div>
                    </div>
                </div>
            </div>
        `;
        
        contenedor.html(htmlEstructura);
        enlazarEventos();
        
        // Disparamos las búsquedas a la base de datos automáticamente
        obtenerParadasDeHojaRuta();
        obtenerPesadasDelDia();
    };

    // 2. EVENTOS (Delegación de eventos segura)
    const enlazarEventos = function () {
        const principal = $('#contenedor-dinamico-trazabilidad');
        
        // Evento para seleccionar una parada y abrir el formulario
        principal.off('click', '.btn-seleccionar-parada').on('click', '.btn-seleccionar-parada', function() {
            let boton = $(this);
            
            estado.idDetalleHdrSeleccionado = boton.data('iddetalle');
            estado.idTipoMaterialSeleccionado = boton.data('idtipomaterial');
            estado.idOrigenSeleccionado = boton.data('idorigen');
            
            let materialNombre = boton.data('materialnombre');
            let origenNombre = boton.data('origennombre');

            renderizarFormularioPesaje(materialNombre, origenNombre);
        });

        // Evento para enviar el formulario de pesaje
        principal.off('submit', '#form-pesaje-parada').on('submit', '#form-pesaje-parada', registrarPesada);
    };

    // 3. TABLA SUPERIOR: PARADAS PENDIENTES
    const obtenerParadasDeHojaRuta = function () {
        $.ajax({
            type: "GET",
            url: `${URL_DETALLE_HDR}/hojaruta/${estado.idHojaRuta}`,
            success: function (data) {
                renderizarTablaParadas(data);
            },
            error: function (err) {
                console.error("Error al obtener paradas", err);
                $('#contenedor-tabla-paradas').html('<div class="alert alert-danger">Error al cargar las paradas del camión.</div>');
            }
        });
    };

    const renderizarTablaParadas = function (listaParadas) {
        const contenedor = $('#contenedor-tabla-paradas');

        if (!listaParadas || listaParadas.length === 0) {
            contenedor.html('<div class="alert alert-warning text-center"><i class="fas fa-info-circle"></i> No hay paradas planificadas pendientes.</div>');
            return;
        }

        let htmlTabla = `
            <div class="table-responsive shadow-sm">
                <table class="table table-striped table-hover border mb-0" id="tabla-paradas-pendientes">
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
            htmlTabla += `
                <tr>
                    <td class="fw-bold">${parada.Origen}</td>
                    <td><span class="badge bg-info text-dark">${parada.TipoMaterial}</span></td>
                    <td>${parada.TipoMovimiento}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-sm btn-outline-primary btn-seleccionar-parada" 
                                data-iddetalle="${parada.Id_Detalle_HDR}"
                                data-idtipomaterial="${parada.Id_TipoMaterial}"
                                data-idorigen="${parada.Id_Origen}"
                                data-materialnombre="${parada.TipoMaterial}"
                                data-origennombre="${parada.Origen}">
                            <i class="fas fa-balance-scale"></i> Pesar
                        </button>
                    </td>
                </tr>
            `;
        });

        htmlTabla += `</tbody></table></div>`;
        contenedor.html(htmlTabla);
    };

    // 4. FORMULARIO DE PESAJE DINÁMICO
    const renderizarFormularioPesaje = function (materialPlanificado, origenPlanificado) {
        const contenedor = $('#contenedor-formulario-pesaje');
        
        let htmlForm = `
            <div class="card border-primary shadow fade-in">
                <div class="card-header bg-primary text-white d-flex justify-content-between">
                    <h5 class="mb-0">Registrar Pesada (Báscula)</h5>
                    <span class="mb-0">${origenPlanificado}</span>
                </div>
                <div class="card-body">
                    <form id="form-pesaje-parada">
                        <div class="row align-items-end">
                            <div class="col-md-3 mb-3">
                                <label class="form-label text-muted">Material Esperado</label>
                                <input type="text" class="form-control fw-bold" value="${materialPlanificado}" disabled>
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
        setTimeout(() => $('#input-peso-bruto').focus(), 100); // Focus automático para UX
    };

    // 5. REGISTRAR PESAJE (AJAX POST y EFECTO MÁGICO)
    const registrarPesada = function (e) {
        e.preventDefault();

        const pesadaObj = {
            "Id_Ingreso_Material": estado.idIngresoMaterial,
            "Id_Tipo_Material": estado.idTipoMaterialSeleccionado,
            "Id_Origen": estado.idOrigenSeleccionado,
            "Id_Detalle_HDR": estado.idDetalleHdrSeleccionado,
            "PesoBruto": parseFloat($("#input-peso-bruto").val()),
            "Observaciones": $("#input-observaciones").val()
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

                // ✨ EFECTO MÁGICO: Ocultamos la fila procesada
                $(`.btn-seleccionar-parada[data-iddetalle="${estado.idDetalleHdrSeleccionado}"]`)
                    .closest('tr')
                    .fadeOut(400, function() {
                        $(this).remove(); 
                        
                        // Opcional: Verificar si la tabla quedó vacía
                        if ($('#tabla-paradas-pendientes tbody tr').length === 0) {
                            $('#contenedor-tabla-paradas').html('<div class="alert alert-success text-center fade-in"><i class="fas fa-check-double"></i> ¡Todas las paradas han sido procesadas!</div>');
                        }
                    });

                // Destruimos el formulario
                $('#contenedor-formulario-pesaje').empty();

                // Refrescamos la tabla inferior
                obtenerPesadasDelDia();
            },
            error: function (err) {
                console.error("Error en Ingreso:", err);
                Swal.fire('Error', 'Hubo un problema al registrar el detalle.', 'error');
            }
        });
    };

    // 6. TABLA INFERIOR: PESAJES REALIZADOS
    const obtenerPesadasDelDia = function () {
        $.ajax({
            type: "GET",
            url: `${URL_DETALLE_INGRESO}/PorCabecera/${estado.idIngresoMaterial}`,
            success: function (data) {
                renderizarTablaPesadas(data);
            },
            error: function (err) {
                console.error("Error al obtener pesadas", err);
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

        htmlTabla += `</tbody></table></div>`;
        contenedor.html(htmlTabla);
    };

    // Revelamos públicamente
    return {
        cargarEn: inicializar
    };
})();



// const DetalleModulo = (function () {
//     // 🔒 NUESTRO BLOC DE NOTAS PRIVADO
//     let estado = {
//         idIngresoMaterial: null,
//         idHojaRuta: null,
//         // Variables para cuando seleccionen una fila:
//         idDetalleHdrSeleccionado: null,
//         idTipoMaterialSeleccionado: null,
//         idOrigenSeleccionado: null
//     };

//     const URL_DETALLE_HDR = "https://localhost:44325/api/detallehojaruta";
//     const URL_DETALLE_INGRESO = "https://localhost:44325/api/DetalleIngreso";

//     // 1. INICIALIZACIÓN (Atrapa la posta)
//     const inicializar = function (contenedorId, idIngresoNuevo, idHojaRutaSeleccionada) {
//         // Guardamos los datos que nos pasó IngresoModulo
//         estado.idIngresoMaterial = idIngresoNuevo;
//         estado.idHojaRuta = idHojaRutaSeleccionada;

//         const contenedor = $(`#${contenedorId}`);

//         // Armamos el "teatro" con dos escenarios: la tabla arriba y el formulario abajo
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
//                     <!-- Aquí inyectaremos el formulario al hacer clic en Seleccionar -->
//                 </div>
//             </div>
//         `;

//         contenedor.html(htmlEstructura);
//         enlazarEventos();

//         // Disparamos la búsqueda a la base de datos automáticamente
//         obtenerParadasDeHojaRuta();
//     };

//     // 2. EVENTOS
//     const enlazarEventos = function () {
//         const principal = $('#contenedor-dinamico-trazabilidad');

//         // Evento para el botón "Seleccionar" de la tabla superior
//         principal.off('click', '.btn-seleccionar-parada').on('click', '.btn-seleccionar-parada', function () {
//             let boton = $(this);

//             // Llenamos la mochila con los datos de la fila
//             estado.idDetalleHdrSeleccionado = boton.data('iddetalle');
//             estado.idTipoMaterialSeleccionado = boton.data('idtipomaterial');
//             estado.idOrigenSeleccionado = boton.data('idorigen');

//             let materialNombre = boton.data('materialnombre');
//             let origenNombre = boton.data('origennombre');

//             renderizarFormularioPesaje(materialNombre, origenNombre);
//         });

//         // Evento para guardar el peso en la base de datos
//         principal.off('submit', '#form-pesaje-parada').on('submit', '#form-pesaje-parada', registrarPesada);
//     };

//     // 3. OBTENER Y RENDERIZAR TABLA DE PARADAS
//     const obtenerParadasDeHojaRuta = function () {
//         $.ajax({
//             type: "GET",
//             url: `${URL_DETALLE_HDR}/hojaruta/${estado.idHojaRuta}`,
//             success: function (data) {
//                 renderizarTablaParadas(data);
//             },
//             error: function (err) {
//                 $('#contenedor-tabla-paradas').html('<div class="alert alert-danger">Error al cargar las paradas del camión.</div>');
//             }
//         });
//     };

//     const renderizarTablaParadas = function (listaParadas) {
//         const contenedor = $('#contenedor-tabla-paradas');

//         if (!listaParadas || listaParadas.length === 0) {
//             contenedor.html('<div class="alert alert-warning text-center"><i class="fas fa-info-circle"></i> Esta hoja de ruta no tiene paradas registradas.</div>');
//             return;
//         }

//         let htmlTabla = `
//             <div class="table-responsive shadow-sm">
//                 <table class="table table-striped table-hover border mb-0">
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
//             htmlTabla += `
//                 <tr>
//                     <td class="fw-bold">${parada.Origen}</td>
//                     <td><span class="badge bg-info text-dark">${parada.TipoMaterial}</span></td>
//                     <td>${parada.TipoMovimiento}</td>
//                     <td class="text-center">
//                         <button type="button" class="btn btn-sm btn-outline-primary btn-seleccionar-parada" 
//                                 data-iddetalle="${parada.Id_Detalle_HDR}"
//                                 data-idtipomaterial="${parada.Id_TipoMaterial}"
//                                 data-idorigen="${parada.Id_Origen}"
//                                 data-materialnombre="${parada.TipoMaterial}"
//                                 data-origennombre="${parada.Origen}">
//                             <i class="fas fa-balance-scale"></i> Pesar
//                         </button>
//                     </td>
//                 </tr>
//             `;
//         });

//         htmlTabla += `</tbody></table></div>`;
//         contenedor.html(htmlTabla);
//     };

//     // 4. EL FORMULARIO DE PESAJE
//     const renderizarFormularioPesaje = function (materialPlanificado, origenPlanificado) {
//         const contenedor = $('#contenedor-formulario-pesaje');

//         let htmlForm = `
//             <div class="card border-primary shadow fade-in">
//                 <div class="card-header bg-primary text-white d-flex justify-content-between">
//                     <h5 class="mb-0">Registrar Pesada (Báscula)</h5>
//                     <span class="mb-0">${origenPlanificado}</span>
//                 </div>
//                 <div class="card-body">
//                     <form id="form-pesaje-parada">
//                         <div class="row align-items-end">
//                             <div class="col-md-3 mb-3">
//                                 <label class="form-label text-muted">Material Esperado</label>
//                                 <input type="text" class="form-control fw-bold" value="${materialPlanificado}" disabled>
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

//         // UX extra: Hacemos focus automático en el input de peso para que el usuario empiece a tipear de inmediato
//         setTimeout(() => $('#input-peso-bruto').focus(), 100);
//     };

//     // 5. GUARDAR LA PESADA EN LA BASE DE DATOS
//     const registrarPesada = function (e) {
//         e.preventDefault();

//         const pesadaObj = {
//             "Id_Ingreso_Material": estado.idIngresoMaterial,
//             "Id_Tipo_Material": estado.idTipoMaterialSeleccionado,
//             "Id_Origen": estado.idOrigenSeleccionado,
//             "Id_Detalle_HDR": estado.idDetalleHdrSeleccionado,
//             "PesoBruto": parseFloat($("#input-peso-bruto").val()),
//             "Observaciones": $("#input-observaciones").val()
//         };

//         $.ajax({
//             type: "POST",
//             url: URL_DETALLE_INGRESO,
//             data: JSON.stringify(pesadaObj),
//             contentType: "application/json; charset=utf-8",
//             success: function (response) {
//                 // response.id es el que devuelve tu API gracias al SCOPE_IDENTITY()
//                 Swal.fire('¡Éxito!', `Detalle Registrado correctamente`, 'success');

             

//             },
//             error: function (err) {
//                 console.error("Error en Ingreso:", err);
//                 Swal.fire('Error', 'Hubo un problema al registrar el detalle.', 'error');
//             }
//         });

//         console.log("Objeto listo para enviar:", pesadaObj);
//     };

//     // Revelamos públicamente
//     return {
//         cargarEn: inicializar
//     };
// })();