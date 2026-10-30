/* ==========================================================================
   SITMAS - Módulo de Consumo de Combustible (Lógica de Cliente)
   Patrón: Revealing Module Pattern (Módulo Revelador) + Event Delegation
   ========================================================================== */

const CombustibleModulo = (function () {

    // 🔒 VARIABLES PRIVADAS
    const API_URL_COMBUSTIBLE = 'https://localhost:44325/api/combustible';
    const API_URL_CONSUMO = 'https://localhost:44325/api/consumocombustible';

    let listaCombustiblesMemoria = [];
    let listaConsumosMemoria = [];

    // ==========================================================================
    // 1. RENDERIZADO DE LA VISTA (HTML)
    // ==========================================================================
    function renderizarVista(contenedorId) {
        const htmlVista = `
            <!-- FORMULARIO DE ACTUALIZACIÓN DE PRECIOS (Protegido por permisos) -->
            <div class="accordion-header d-flex justify-content-between align-items-center"
                role="button" data-bs-toggle="collapse" href="#collapseCombustibles"
                data-permiso-requerido="Logistica_Escritura, Logistica_Modificacion">
                <h2 class="mb-0" id="tituloFormCombustible">Actualizar Precio de Combustible</h2>
                <span class="icon-arrow">▼</span>
            </div>

            <div id="collapseCombustibles" class="collapse show"
                data-permiso-requerido="Logistica_Escritura, Logistica_Modificacion">
                <div class="pt-4 pb-4 border-bottom">
                    <form id="formActualizarPrecio">
                        <input type="hidden" id="hdnIdCombustible" value="0">

                        <div class="row g-3">
                            <div class="col-md-5">
                                <label class="form-label fw-bold" for="cmbTipoCombustible">Tipo de Combustible</label>
                                <select class="form-select" id="cmbTipoCombustible" required>
                                    <option value="">Cargando catálogo...</option>
                                </select>
                            </div>

                            <div class="col-md-5">
                                <label class="form-label fw-bold" for="txtPrecioValor">Precio Actual ($ / L)</label>
                                <input type="number" step="0.01" min="0.01" class="form-control" id="txtPrecioValor" placeholder="Ej: 1150.00" required>
                            </div>
                        </div>

                        <div class="pt-3 d-flex justify-content-end gap-2">
                            <button type="button" class="btn btn-secondary px-4" id="btnCancelarPrecio">Cancelar / Limpiar</button>
                            <button type="submit" class="btn btn-sitmas-success px-5" id="btnGuardarPrecio">💾 Guardar Precio</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- GRILLA DE CONSUMOS -->
            <div class="d-flex justify-content-between align-items-center mt-4 mb-3">
                <h2 class="mb-0">Histórico de Consumos Calculados</h2>
                <button id="btnRefrescarCombustible" class="btn btn-sm btn-outline-secondary">
                    🔄 Refrescar Grilla
                </button>
            </div>

            <!-- BUSCADOR RÁPIDO -->
            <div class="row pt-2 pb-3">
                <div class="col-md-4 offset-md-8">
                    <input type="text" id="inputBusquedaConsumo" class="form-control"
                        placeholder="🔍 Buscar por patente o combustible...">
                </div>
            </div>

            <!-- TABLA DE CONSUMOS -->
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Odómetro</th>
                            <th>Patente</th>
                            <th>Tipo Combustible</th>
                            <th>Precio Unitario Aplicado</th>
                            <th>Km Recorridos</th>
                            <th class="text-end">Costo Total ($)</th>
                        </tr>
                    </thead>
                    <tbody id="tbodyConsumos">
                        <!-- Se renderiza dinámicamente -->
                    </tbody>
                </table>
            </div>
        `;

        // Inyectamos el HTML
        $(`#${contenedorId}`).html(htmlVista);

        // ¡Llamamos al guardián para que oculte el formulario si el usuario no tiene permisos!
        if (typeof window.aplicarSeguridadDOM === 'function') {
            window.aplicarSeguridadDOM();
        }

        InicializarModulo();
    }

    // ==========================================================================
    // 2. DELEGACIÓN DE EVENTOS (El guardia de seguridad del contenedor)
    // ==========================================================================
    function configurarEventos(contenedorId) {
        const $contenedor = $(`#${contenedorId}`);

        // Limpiamos eventos previos
        $contenedor.off('change', '#cmbTipoCombustible');
        $contenedor.off('submit', '#formActualizarPrecio');
        $contenedor.off('click', '#btnCancelarPrecio');
        $contenedor.off('keyup', '#inputBusquedaConsumo');
        $contenedor.off('click', '#btnRefrescarCombustible');

        // Atamos los nuevos eventos
        $contenedor.on('change', '#cmbTipoCombustible', function () {
            const idSeleccionado = $(this).val();
            if (idSeleccionado) {
                const comb = listaCombustiblesMemoria.find(c => c.Id_Combustible == idSeleccionado);
                if (comb) {
                    $('#hdnIdCombustible').val(comb.Id_Combustible);
                    $('#txtPrecioValor').val(comb.Precio_valor);
                }
            } else {
                ResetearFormularioPrecio();
            }
        });

        $contenedor.on('submit', '#formActualizarPrecio', function (e) {
            e.preventDefault();
            ActualizarPrecioCombustible();
        });

        $contenedor.on('click', '#btnCancelarPrecio', function () {
            ResetearFormularioPrecio();
        });

        $contenedor.on('keyup', '#inputBusquedaConsumo', function () {
            const valor = $(this).val().toLowerCase().trim();
            const filtrados = listaConsumosMemoria.filter(c =>
                c.Patente.toLowerCase().includes(valor) ||
                c.Tipo_combustible.toLowerCase().includes(valor)
            );
            RenderizarTablaConsumos(filtrados);
        });

        $contenedor.on('click', '#btnRefrescarCombustible', function () {
            InicializarModulo();
        });
    }

    // ==========================================================================
    // 3. LÓGICA DE NEGOCIO Y AJAX
    // ==========================================================================
    function InicializarModulo() {
        Promise.all([
            CargarComboCombustibles(),
            ObtenerHistorialConsumos()
        ]).catch(error => {
            mostrarAlerta('Ocurrió un error al cargar la información inicial del módulo.', 'danger');
            console.error('SITMAS - Error inicialización:', error);
        });
    }

    function CargarComboCombustibles() {
        return $.ajax({
            url: API_URL_COMBUSTIBLE,
            type: 'GET',
            dataType: 'json'
        }).done(function (data) {
            listaCombustiblesMemoria = data;
            const $cmb = $('#cmbTipoCombustible');
            $cmb.empty().append('<option value="">Seleccione un tipo de combustible...</option>');

            data.forEach(c => {
                $cmb.append(`<option value="${c.Id_Combustible}">${c.Tipo_combustible} ($${c.Precio_valor.toFixed(2)})</option>`);
            });
        });
    }

    function ActualizarPrecioCombustible() {
        const idCombustible = parseInt($('#hdnIdCombustible').val());
        const nuevoPrecio = parseFloat($('#txtPrecioValor').val());

        if (!idCombustible || idCombustible <= 0) {
            mostrarAlerta('Debe seleccionar un tipo de combustible de la lista.', 'warning');
            return;
        }

        if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
            mostrarAlerta('El precio del combustible debe ser mayor a cero.', 'warning');
            return;
        }

        const payload = {
            Id_Combustible: idCombustible,
            Precio_valor: nuevoPrecio
        };

        $.ajax({
            url: `${API_URL_COMBUSTIBLE}/${idCombustible}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(payload)
        }).done(function (res) {
            mostrarAlerta(res.Mensaje || 'Precio actualizado correctamente.', 'success');
            ResetearFormularioPrecio();
            InicializarModulo();
        }).fail(function (xhr) {
            const mensajeError = xhr.responseJSON ? xhr.responseJSON : 'No se pudo completar la actualización.';
            mostrarAlerta(mensajeError, 'danger');
        });
    }

    function ResetearFormularioPrecio() {
        $('#hdnIdCombustible').val('0');
        $('#cmbTipoCombustible').val('');
        $('#txtPrecioValor').val('');
    }

    function ObtenerHistorialConsumos() {
        return $.ajax({
            url: API_URL_CONSUMO,
            type: 'GET',
            dataType: 'json'
        }).done(function (data) {
            listaConsumosMemoria = data;
            RenderizarTablaConsumos(data);
        });
    }

    function RenderizarTablaConsumos(lista) {
        const $tbody = $('#tbodyConsumos');
        $tbody.empty();

        if (lista.length === 0) {
            $tbody.append('<tr><td colspan="6" class="text-center text-muted py-4">No hay registros de consumo cargados.</td></tr>');
            return;
        }

        lista.forEach(item => {
            $tbody.append(`
                <tr>
                    <td>#${item.IdRegistroodomet}</td>
                    <td><span class="badge bg-secondary fs-6">${item.Patente}</span></td>
                    <td>${item.Tipo_combustible}</td>
                    <td>$${item.PrecioUnitarioAplicado.toFixed(2)}</td>
                    <td>${item.KilometrosRecorridos.toFixed(2)} km</td>
                    <td class="text-end text-success fw-bold fs-6">$${item.CostoTotalCalculado.toFixed(2)}</td>
                </tr>
            `);
        });

        // Llamamos al guardián nuevamente por si la tabla inyectó elementos protegidos
        if (typeof window.aplicarSeguridadDOM === 'function') {
            window.aplicarSeguridadDOM();
        }
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
    // 4. API PÚBLICA DEL MÓDULO 
    // ==========================================================================
    return {
        cargarEn: function (contenedorId) {
            configurarEventos(contenedorId);
            renderizarVista(contenedorId);
        }
    };

})();




// /* ==========================================================================
//    SITMAS - Módulo de Consumo de Combustible (Lógica de Cliente)
//    ========================================================================== */

// $(document).ready(function () {
//     const API_URL_COMBUSTIBLE = 'https://localhost:44325/api/combustible';
//     const API_URL_CONSUMO = 'https://localhost:44325/api/consumocombustible';

//     let listaCombustiblesMemoria = [];
//     let listaConsumosMemoria = [];

//     // Carga inicial paralela con Promise.all
//     InicializarModulo();

//     function InicializarModulo() {
//         Promise.all([
//             CargarComboCombustibles(),
//             ObtenerHistorialConsumos()
//         ]).catch(error => {
//             mostrarAlerta('Ocurrió un error al cargar la información inicial del módulo.', 'danger');
//             console.error('Error inicialización:', error);
//         });
//     }

//     // ============================================================================
//     // 1. CARGA DE CATÁLOGO / COMBO DE COMBUSTIBLES
//     // ============================================================================
//     function CargarComboCombustibles() {
//         return $.ajax({
//             url: API_URL_COMBUSTIBLE,
//             type: 'GET',
//             dataType: 'json'
//         }).done(function (data) {
//             listaCombustiblesMemoria = data;
//             const $cmb =$('#cmbTipoCombustible');
//             $cmb.empty().append('<option value="">Seleccione un tipo de combustible...</option>');

//             data.forEach(c => {
//                 $cmb.append(`<option value="${c.Id_Combustible}">${c.Tipo_combustible} ($${c.Precio_valor.toFixed(2)})</option>`);
//             });
//         });
//     }

//     // Al seleccionar una opción del combo, cargamos los datos en el formulario
//     $('#cmbTipoCombustible').on('change', function () {
//         const idSeleccionado = $(this).val();
//         if (idSeleccionado) {
//             const comb = listaCombustiblesMemoria.find(c => c.Id_Combustible == idSeleccionado);
//             if (comb) {
//                 $('#hdnIdCombustible').val(comb.Id_Combustible);
//                 $('#txtPrecioValor').val(comb.Precio_valor);
//             }
//         } else {
//             ResetearFormularioPrecio();
//         }
//     });

//     // ============================================================================
//     // 2. ACTUALIZACIÓN DE PRECIO (PUT)
//     // ============================================================================
//     $('#formActualizarPrecio').on('submit', function (e) {
//         e.preventDefault();

//         const idCombustible = parseInt($('#hdnIdCombustible').val());
//         const nuevoPrecio = parseFloat($('#txtPrecioValor').val());

//         if (!idCombustible || idCombustible <= 0) {
//             mostrarAlerta('Debe seleccionar un tipo de combustible de la lista.', 'warning');
//             return;
//         }

//         if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
//             mostrarAlerta('El precio del combustible debe ser mayor a cero.', 'warning');
//             return;
//         }

//         const payload = {
//             Id_Combustible: idCombustible,
//             Precio_valor: nuevoPrecio
//         };

//         $.ajax({
//             url: `${API_URL_COMBUSTIBLE}/${idCombustible}`,
//             type: 'PUT',
//             contentType: 'application/json',
//             data: JSON.stringify(payload)
//         }).done(function (res) {
//             // Usamos la función global centralizada para notificar el éxito
//             mostrarAlerta(res.Mensaje || 'Precio actualizado correctamente.', 'success');
//             ResetearFormularioPrecio();
//             InicializarModulo(); // Refresco reactivo sin recargar F5
//         }).fail(function (xhr) {
//             const mensajeError = xhr.responseJSON ? xhr.responseJSON : 'No se pudo completar la actualización.';
//             mostrarAlerta(mensajeError, 'danger');
//         });
//     });

//     function ResetearFormularioPrecio() {
//         $('#hdnIdCombustible').val('0');
//         $('#cmbTipoCombustible').val('');
//         $('#txtPrecioValor').val('');
//     }

//     $('#btnCancelarPrecio').on('click', function () {
//         ResetearFormularioPrecio();
//     });

//     // ============================================================================
//     // 3. GRILLA DE CONSUMOS (LECTURA Y BÚSQUEDA)
//     // ============================================================================
//     function ObtenerHistorialConsumos() {
//         return $.ajax({
//             url: API_URL_CONSUMO,
//             type: 'GET',
//             dataType: 'json'
//         }).done(function (data) {
//             listaConsumosMemoria = data;
//             RenderizarTablaConsumos(data);
//         });
//     }

//     function RenderizarTablaConsumos(lista) {
//         const $tbody =$('#tbodyConsumos');
//         $tbody.empty();

//         if (lista.length === 0) {
//             $tbody.append('<tr><td colspan="7" class="text-center text-muted py-4">No hay registros de consumo cargados.</td></tr>');
//             return;
//         }

//         lista.forEach(item => {
//             $tbody.append(`
//                 <tr>
//                     <td>#${item.IdRegistroodomet}</td>
//                     <td><span class="badge bg-secondary fs-6">${item.Patente}</span></td>
//                     <td>${item.Tipo_combustible}</td>
//                     <td>$${item.PrecioUnitarioAplicado.toFixed(2)}</td>
//                     <td>${item.KilometrosRecorridos.toFixed(2)} km</td>
//                     <td class="text-end text-success fw-bold fs-6">$${item.CostoTotalCalculado.toFixed(2)}</td>
//                 </tr>
//             `);
//         });
//     }

//     // Buscador en tiempo real por evento keyup
//     $('#inputBusquedaConsumo').on('keyup', function () {
//         const valor = $(this).val().toLowerCase().trim();
//         const filtrados = listaConsumosMemoria.filter(c =>
//             c.Patente.toLowerCase().includes(valor) ||
//             c.Tipo_combustible.toLowerCase().includes(valor)
//         );
//         RenderizarTablaConsumos(filtrados);
//     });

//     $('#btnRefrescar').on('click', function () {
//         InicializarModulo();
//     });
// });