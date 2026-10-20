/* ==========================================================================
   SITMAS - Módulo: Empresa / Origen 
   Patrón: Revealing Module Pattern + Event Delegation + Google Maps API
   ========================================================================== */

const EmpresasModulo = (function () {

    // 🔒 VARIABLES PRIVADAS
    const URL_API_ORIGEN = "https://localhost:44325/api/origen";
    const URL_API_BARRIOS = "https://localhost:44325/api/Barrio/ListarTodo";
    const URL_API_UBICACION = "https://localhost:44325/api/ubicaciongeografica";

    let listaBarriosGlobal = [];

    // ==========================================================================
    // 1. RENDERIZADO DE LA VISTA (HTML)
    // ==========================================================================
    function renderizarVista(contenedorId) {
        const htmlVista = `
            <main class="container-fluid p-4">
                <!-- Contenedor dinámico de alertas -->
                <div id="alertContainer"></div>

                <!-- SECCIÓN: REGISTRO (ACORDEÓN PROTEGIDO POR PERMISOS) -->
                <div class="sitmas-card mb-4">
                    <div class="accordion-header d-flex justify-content-between align-items-center" role="button"
                        data-bs-toggle="collapse" href="#collapseForm"
                        data-permiso-requerido="Logistica_Escritura, Logistica_Modificacion, Administrador">
                        <h2 class="mb-0" id="tituloFormOrigen">Registrar Nuevo Origen</h2>
                        <span class="icon-arrow">▼</span>
                    </div>

                    <div id="collapseForm" class="collapse show"
                        data-permiso-requerido="Logistica_Escritura, Logistica_Modificacion, Administrador">
                        <div class="pt-4">
                            <form id="formOrigen">
                                <!-- Inputs Ocultos -->
                                <input type="hidden" id="txtIdOrigen" value="0">
                                <input type="hidden" id="txtIdUbicacion" value="0">

                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label class="form-label fw-bold">Empresa / Institución</label>
                                        <input type="text" class="form-control" id="empresa_institucion" required
                                            placeholder="Ej: Municipalidad de Córdoba">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label fw-bold">Calle</label>
                                        <input type="text" class="form-control" id="calle" required
                                            placeholder="Ej: Av. Colón">
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label fw-bold">Número</label>
                                        <input type="text" class="form-control" id="numero" required placeholder="1234">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label fw-bold">Teléfono</label>
                                        <input type="tel" class="form-control" id="telefono"
                                            placeholder="Ej: 3511234567">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label fw-bold">Barrio</label>
                                        <select class="form-select" id="id_barrio" required>
                                            <option value="">Cargando barrios...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label fw-bold">Email</label>
                                        <input type="email" class="form-control" id="email"
                                            placeholder="contacto@empresa.com">
                                    </div>
                                </div>

                                <div class="pt-3 d-flex justify-content-end gap-2">
                                    <button type="button" class="btn btn-secondary px-4" id="btnLimpiarForm">Cancelar / Limpiar</button>
                                    <button type="submit" class="btn btn-sitmas-success px-5" id="btnGuardarOrigen">➕ Guardar Origen</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN: LISTADO (ACORDEÓN) -->
                <div class="sitmas-card">
                    <div class="accordion-header d-flex justify-content-between align-items-center" role="button"
                        data-bs-toggle="collapse" href="#collapseTable">
                        <h2 class="mb-0">Listado de Orígenes</h2>
                        <span class="icon-arrow">▼</span>
                    </div>

                    <div id="collapseTable" class="collapse show">
                        <!-- BARRA DE BÚSQUEDA RÁPIDA -->
                        <div class="row pt-4">
                            <div class="col-md-4 offset-md-8">
                                <input type="text" id="inputBusquedaOrigen" class="form-control"
                                    placeholder="🔍 Buscar Empresa, Calle, Barrio...">
                            </div>
                        </div>

                        <div class="table-responsive pt-3">
                            <table class="table table-hover align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Empresa / Institución</th>
                                        <th>Dirección</th>
                                        <th>Teléfono</th>
                                        <th>Barrio</th>
                                        <th>Email</th>
                                        <th>Coordenadas GPS</th>
                                        <th class="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyOrigenes">
                                    <!-- Carga dinámica -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        `;

        // 1. Armamos el escenario
        $(`#${contenedorId}`).html(htmlVista);

        // 2. ¡Llamamos al guardia de seguridad!
        if (typeof window.aplicarSeguridadDOM === 'function') {
            window.aplicarSeguridadDOM();
        }

        // 3. Cargamos los datos
        InicializarModuloOrigen();
    }

    // ==========================================================================
    // 2. EL GUARDIA DE DELEGACIÓN DE EVENTOS
    // ==========================================================================
    function configurarEventos(contenedorId) {
        const $contenedor =$(`#${contenedorId}`);

        // Desatamos eventos previos para evitar ejecuciones múltiples
        $contenedor.off("submit", "#formOrigen");
        $contenedor.off("click", "#btnLimpiarForm");
        $contenedor.off("keyup", "#inputBusquedaOrigen");
        $contenedor.off("click", ".btn-editar-origen");
        $contenedor.off("click", ".btn-borrar-origen");

        // Atamos eventos usando delegación
        $contenedor.on("submit", "#formOrigen", function (e) {
            e.preventDefault();
            ProcesarGuardadoOrigen();
        });

        $contenedor.on("click", "#btnLimpiarForm", function () {
            ResetearFormulario();
        });

        $contenedor.on("keyup", "#inputBusquedaOrigen", function () {
            const busqueda = $(this).val().toLowerCase();$("#tbodyOrigenes tr").filter(function () {
                $(this).toggle($(this).text().toLowerCase().indexOf(busqueda) > -1);
            });
        });

        // Botones dinámicos de la tabla
        $contenedor.on("click", ".btn-editar-origen", function () {
            const id = $(this).data("id");
            CargarParaEditar(id);
        });

        $contenedor.on("click", ".btn-borrar-origen", function () {
            const id = $(this).data("id");
            EliminarOrigen(id);
        });
    }

    // ==========================================================================
    // 3. LÓGICA DE NEGOCIO Y API GOOGLE MAPS
    // ==========================================================================
    function InicializarModuloOrigen() {
        CargarComboBarrios()
            .then(() => {
                ListarOrigenes();
            })
            .catch(err => {
                console.error("SITMAS - Error al cargar barrios auxiliares:", err);
                ListarOrigenes();
            });
    }

    function CargarComboBarrios() {
        return $.ajax({
            type: "GET",
            url: URL_API_BARRIOS,
            dataType: "json",
            success: function (data) {
                listaBarriosGlobal = data || [];
                const $select =$("#id_barrio");
                $select.empty().append('<option value="">Seleccione Barrio</option>');

                if (Array.isArray(data)) {
                    data.forEach(b => {
                        const idBarrio = b.Id || b.IdBarrio || b.id_Barrio;
                        const nombreBarrio = b.Barrio || b.Nombre || b.Descripcion;
                        $select.append(`<option value="${idBarrio}">${nombreBarrio}</option>`);
                    });
                }
            }
        });
    }

    function GeocodificarDireccion(calle, numero, barrio = "", ciudad = "Córdoba, Argentina") {
        return new Promise((resolve, reject) => {
            // Validamos que Google Maps esté cargado en el sistema
            if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
                return reject("La API de Google Maps no está cargada en el navegador.");
            }

            const geocoder = new google.maps.Geocoder();
            const direccionConsulta = `${calle} ${numero}, ${barrio ? barrio + ', ' : ''}${ciudad}`;

            geocoder.geocode({ address: direccionConsulta }, (results, status) => {
                if (status === "OK" && results && results.length > 0) {
                    const primerResultado = results[0];
                    const location = primerResultado.geometry.location;

                    resolve({
                        latitud: location.lat(),
                        longitud: location.lng(),
                        descripcion: primerResultado.formatted_address
                    });
                } else if (status === "ZERO_RESULTS") {
                    reject("Google Maps no encontró coordenadas exactas para la dirección ingresada.");
                } else {
                    reject(`Error en el servicio de mapas de Google: ${status}`);
                }
            });
        });
    }

    function ListarOrigenes() {
        // Obtenemos permisos del localStorage para proteger los botones de la tabla
        const sesionString = localStorage.getItem("usuarioSesion");
        let permisosUsuario = [];
        if (sesionString) {
            const sesionLocal = JSON.parse(sesionString);
            permisosUsuario = sesionLocal.permisos || [];
        }

        const puedeModificar = permisosUsuario.includes("Logistica_Escritura") ||
            permisosUsuario.includes("Logistica_Modificacion") ||
            permisosUsuario.includes("Administrador");

        $.ajax({
            type: "GET",
            url: URL_API_ORIGEN,
            dataType: "json",
            success: function (lista) {
                const $tbody =$("#tbodyOrigenes");
                $tbody.empty();

                if (!lista || lista.length === 0) {
                    $tbody.append('<tr><td colspan="8" class="text-center text-muted">No hay orígenes/empresas registradas.</td></tr>');
                    return;
                }

                lista.forEach(o => {
                    const nombreBarrio = ObtenerNombreBarrio(o.Id_Barrio);
                    const tieneGPS = o.Latitud && o.Longitud;

                    const badgeGPS = tieneGPS
                        ? `<span class="badge bg-success" title="Lat: ${o.Latitud}, Lon: ${o.Longitud}">📍 Geolocalizado</span>`
                        : `<span class="badge bg-secondary">Sin GPS</span>`;

                    let botonesAccionHTML = '';

                    // Inyectamos botones solo si tiene permiso
                    if (puedeModificar) {
                        botonesAccionHTML = `
                            <button class="btn btn-sm btn-outline-primary me-1 btn-editar-origen" data-id="${o.IdOrigen}" title="Editar Origen">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-borrar-origen" data-id="${o.IdOrigen}" title="Eliminar Origen">
                                🗑️ Borrar
                            </button>
                        `;
                    } else {
                        botonesAccionHTML = `<span class="text-muted small">Solo Lectura</span>`;
                    }

                    const tr = `
                        <tr>
                            <td><strong>#${o.IdOrigen}</strong></td>
                            <td>${o.EmpresaInstitucion}</td>
                            <td>${o.CalleEI} ${o.NumeroEI}</td>
                            <td>${o.TelefonoEI || 'N/A'}</td>
                            <td>${nombreBarrio}</td>
                            <td>${o.EmailEI || 'N/A'}</td>
                            <td>${badgeGPS}</td>
                            <td class="text-center">
                                ${botonesAccionHTML}
                            </td>
                        </tr>`;
                    $tbody.append(tr);
                });

                // Llamamos al guardián después de pintar la tabla
                if (typeof window.aplicarSeguridadDOM === 'function') {
                    window.aplicarSeguridadDOM();
                }
            },
            error: function (err) {
                console.error("SITMAS - Error en ListarOrigenes:", err);
                mostrarAlerta("Error al consultar la lista de Orígenes.", "danger");
            }
        });
    }

    async function ProcesarGuardadoOrigen() {
        const idOrigen = parseInt($("#txtIdOrigen").val()) || 0;
        const idUbicacionExistente = parseInt($("#txtIdUbicacion").val()) || 0;
        const empresa = $("#empresa_institucion").val().trim();
        const calle = $("#calle").val().trim();
        const numero = $("#numero").val().trim();
        const telefono = $("#telefono").val().trim();
        const email = $("#email").val().trim();
        const idBarrio = parseInt($("#id_barrio").val()) || 0;
        const nombreBarrio = ObtenerNombreBarrio(idBarrio);

        if (!empresa || !calle || !numero || idBarrio <= 0) {
            mostrarAlerta("Por favor complete los campos obligatorios (Empresa, Calle, Número y Barrio).", "warning");
            return;
        }

        let idUbicacionFinal = idUbicacionExistente > 0 ? idUbicacionExistente : null;

        try {
            // Geocodificación con Google Maps
            const geoResult = await GeocodificarDireccion(calle, numero, nombreBarrio);

            const dtoUbicacion = {
                IdUbicacion: idUbicacionFinal || 0,
                Descripcion: `${empresa} - ${calle} ${numero}`,
                Latitud: geoResult.latitud,
                Longitud: geoResult.longitud
            };

            if (idUbicacionFinal > 0) {
                await $.ajax({
                    type: "PUT",
                    url: `${URL_API_UBICACION}/${idUbicacionFinal}`,
                    data: JSON.stringify(dtoUbicacion),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json"
                });
            } else {
                const resUbi = await $.ajax({
                    type: "POST",
                    url: URL_API_UBICACION,
                    data: JSON.stringify(dtoUbicacion),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json"
                });
                idUbicacionFinal = resUbi.IdUbicacionGenerado || resUbi.idUbicacionGenerado;
            }

            await GuardarOrigenEnBackend(idOrigen, empresa, calle, numero, telefono, email, idBarrio, idUbicacionFinal);

        } catch (geoError) {
            console.warn("SITMAS - Advertencia de Geocodificación Google:", geoError);

            // Si falla el GPS, le preguntamos al usuario si quiere guardar igual
            if (typeof confirmarAccion === "function") {
                confirmarAccion(
                    "⚠️ Dirección no localizada en el mapa",
                    `${geoError}. ¿Desea registrar la empresa de todas formas sin coordenadas GPS?`,
                    function () {
                        GuardarOrigenEnBackend(idOrigen, empresa, calle, numero, telefono, email, idBarrio, idUbicacionFinal);
                    }
                );
            } else {
                // Fallback por si la función confirmarAccion no está definida globalmente
                if (confirm(`⚠️ Dirección no localizada. ${geoError}. ¿Desea registrar la empresa sin coordenadas GPS?`)) {
                    GuardarOrigenEnBackend(idOrigen, empresa, calle, numero, telefono, email, idBarrio, idUbicacionFinal);
                }
            }
        }
    }

    function GuardarOrigenEnBackend(idOrigen, empresa, calle, numero, telefono, email, idBarrio, idUbicacion) {
        const esModificacion = idOrigen > 0;

        const dtoOrigen = {
            IdOrigen: idOrigen,
            EmpresaInstitucion: empresa,
            CalleEI: calle,
            NumeroEI: numero,
            TelefonoEI: telefono,
            EmailEI: email,
            Id_Barrio: idBarrio,
            Id_Ubicacion: idUbicacion > 0 ? idUbicacion : null
        };

        const tipoMetodo = esModificacion ? "PUT" : "POST";
        const urlEndpoint = esModificacion ? `${URL_API_ORIGEN}/${idOrigen}` : URL_API_ORIGEN;

        $.ajax({
            type: tipoMetodo,
            url: urlEndpoint,
            data: JSON.stringify(dtoOrigen),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function () {
                const msg = esModificacion ? "Origen actualizado con éxito." : "Origen creado con éxito.";
                mostrarAlerta(msg, "success");
                ResetearFormulario();
                ListarOrigenes();
            },
            error: function (err) {
                console.error("SITMAS - Error al guardar Origen:", err);
                mostrarAlerta("No se pudo guardar la información del Origen. Verifique los datos.", "danger");
            }
        });
    }

    function CargarParaEditar(id) {
        $.ajax({
            type: "GET",
            url: URL_API_ORIGEN,
            dataType: "json",
            success: function (lista) {
                const origen = lista.find(o => o.IdOrigen === id);
                if (!origen) {
                    mostrarAlerta("Origen no encontrado.", "danger");
                    return;
                }

                $("#txtIdOrigen").val(origen.IdOrigen);
                $("#txtIdUbicacion").val(origen.Id_Ubicacion || 0);
                $("#empresa_institucion").val(origen.EmpresaInstitucion);
                $("#calle").val(origen.CalleEI);
                $("#numero").val(origen.NumeroEI);
                $("#telefono").val(origen.TelefonoEI);
                $("#email").val(origen.EmailEI);
                $("#id_barrio").val(origen.Id_Barrio);

                $("#btnGuardarOrigen").text("💾 Actualizar Origen").removeClass("btn-sitmas-success").addClass("btn-warning");
                $("#tituloFormOrigen").text(`Modificar Origen #${origen.IdOrigen}`);

                $("html, body").animate({ scrollTop: $("#collapseForm").offset().top - 70 }, 300);
            },
            error: function (err) {
                console.error("SITMAS - Error al cargar datos para edición:", err);
                mostrarAlerta("Error al obtener los detalles del Origen.", "danger");
            }
        });
    }

    function EliminarOrigen(id) {
        if (typeof confirmarAccion === "function") {
            confirmarAccion(
                "¿Eliminar Origen?",
                `Se eliminará el registro del Origen #${id}. Esta acción no se puede deshacer.`,
                function () { EjecutarEliminar(id); }
            );
        } else {
            if (confirm(`¿Está seguro de eliminar el registro del Origen #${id}?`)) {
                EjecutarEliminar(id);
            }
        }
    }

    function EjecutarEliminar(id) {
        $.ajax({
            type: "DELETE",
            url: `${URL_API_ORIGEN}/${id}`,
            dataType: "json",
            success: function () {
                mostrarAlerta(`Origen #${id} eliminado correctamente.`, "info");
                ListarOrigenes();
                if ($("#txtIdOrigen").val() == id) {
                    ResetearFormulario();
                }
            },
            error: function (err) {
                console.error("SITMAS - Error al eliminar Origen:", err);
                mostrarAlerta("No se pudo eliminar el Origen. Es posible que esté asociado a Hojas de Ruta activas.", "danger");
            }
        });
    }

    // ==========================================================================
    // 4. FUNCIONES AUXILIARES
    // ==========================================================================
    function ResetearFormulario() {
        $("#formOrigen")[0].reset();
        $("#txtIdOrigen").val("0");
        $("#txtIdUbicacion").val("0");
        $("#btnGuardarOrigen").text("➕ Guardar Origen").removeClass("btn-warning").addClass("btn-sitmas-success");
        $("#tituloFormOrigen").text("Registrar Nuevo Origen");
    }

    function ObtenerNombreBarrio(id) {
        if (!listaBarriosGlobal || listaBarriosGlobal.length === 0) return "";
        const barrio = listaBarriosGlobal.find(b => Number(b.Id || b.IdBarrio || b.id_Barrio) === Number(id));
        return barrio ? (barrio.Barrio || barrio.Nombre || barrio.Descripcion) : "";
    }

    function mostrarAlerta(mensaje, tipo) {
        const $container =$("#alertContainer");
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
    // 5. API PÚBLICA DEL MÓDULO 
    // ==========================================================================
    return {
        cargarEn: function (contenedorId) {
            configurarEventos(contenedorId);
            renderizarVista(contenedorId);
        }
    };

})();





// /* ==========================================================================
//    SITMAS - Módulo: Empresa / Origen - Lógica de Interfaz y Geocodificación
//    Tecnologías: JavaScript (ES6+), jQuery, AJAX, Google Maps Geocoding API
//    ========================================================================== */

// const URL_API_ORIGEN = "https://localhost:44325/api/origen";
// const URL_API_BARRIOS = "https://localhost:44325/api/Barrio/ListarTodo";
// const URL_API_UBICACION = "https://localhost:44325/api/ubicaciongeografica";

// let listaBarriosGlobal = [];

// $(document).ready(function () {
//     // 1. Inicialización de barrios y tabla principal
//     InicializarModuloOrigen();

//     // 2. Controladores de eventos del Formulario
//     $("#formOrigen").on("submit", function (e) {
//         e.preventDefault();
//         ProcesarGuardadoOrigen();
//     });

//     $("#btnLimpiarForm").on("click", function () {
//         ResetearFormulario();
//     });

//     // 3. Buscador reactivo en vivo sobre la tabla
//     $("#inputBusquedaOrigen").on("keyup", function () {
//         const busqueda = $(this).val().toLowerCase();$("#tbodyOrigenes tr").filter(function () {
//             $(this).toggle($(this).text().toLowerCase().indexOf(busqueda) > -1);
//         });
//     });
// });

// /* ==========================================================================
//    1. CARGA INICIAL Y COMBOS
//    ========================================================================== */

// function InicializarModuloOrigen() {
//     CargarComboBarrios()
//         .then(() => {
//             ListarOrigenes();
//         })
//         .catch(err => {
//             console.error("SITMAS - Error al cargar barrios auxiliares:", err);
//             ListarOrigenes();
//         });
// }

// function CargarComboBarrios() {
//     return $.ajax({
//         type: "GET",
//         url: URL_API_BARRIOS,
//         dataType: "json",
//         success: function (data) {
//             listaBarriosGlobal = data || [];
//             const $select =$("#id_barrio");
//             $select.empty().append('<option value="">Seleccione Barrio</option>');

//             if (Array.isArray(data)) {
//                 data.forEach(b => {
//                     const idBarrio = b.Id || b.IdBarrio || b.id_Barrio;
//                     const nombreBarrio = b.Barrio || b.Nombre || b.Descripcion;
//                     $select.append(`<option value="${idBarrio}">${nombreBarrio}</option>`);
//                 });
//             }
//         }
//     });
// }

// /* ==========================================================================
//    2. SERVICIO DE GEOCODIFICACIÓN (Google Maps Geocoding API)
//    ========================================================================== */

// /**
//  * Traduce una dirección postal a coordenadas GPS (Latitud y Longitud) usando Google Maps
//  * @param {string} calle 
//  * @param {string} numero 
//  * @param {string} barrio 
//  * @param {string} ciudad 
//  * @returns {Promise<Object>} Promesa que resuelve { latitud, longitud, descripcion }
//  */
// function GeocodificarDireccion(calle, numero, barrio = "", ciudad = "Córdoba, Argentina") {
//     return new Promise((resolve, reject) => {
//         // Instanciamos el Geocoder de Google Maps
//         const geocoder = new google.maps.Geocoder();

//         // Armamos la cadena completa de dirección para mayor precisión en Córdoba
//         const direccionConsulta = `${calle} ${numero}, ${barrio ? barrio + ', ' : ''}${ciudad}`;

//         geocoder.geocode({ address: direccionConsulta }, (results, status) => {
//             if (status === "OK" && results && results.length > 0) {
//                 const primerResultado = results[0];
//                 const location = primerResultado.geometry.location;

//                 // Google devuelve funciones .lat() y .lng() en el objeto location
//                 resolve({
//                     latitud: location.lat(),
//                     longitud: location.lng(),
//                     descripcion: primerResultado.formatted_address
//                 });
//             } else if (status === "ZERO_RESULTS") {
//                 reject("Google Maps no encontró coordenadas exactas para la dirección ingresada.");
//             } else {
//                 reject(`Error en el servicio de mapas de Google: ${status}`);
//             }
//         });
//     });
// }

// /* ==========================================================================
//    3. OPERACIONES CRUD Y LÓGICA DE GUARDADO
//    ========================================================================== */

// function ListarOrigenes() {
//     $.ajax({
//         type: "GET",
//         url: URL_API_ORIGEN,
//         dataType: "json",
//         success: function (lista) {
//             const $tbody =$("#tbodyOrigenes");
//             $tbody.empty();

//             if (!lista || lista.length === 0) {
//                 $tbody.append('<tr><td colspan="8" class="text-center text-muted">No hay orígenes/empresas registradas.</td></tr>');
//                 return;
//             }

//             lista.forEach(o => {
//                 const nombreBarrio = ObtenerNombreBarrio(o.Id_Barrio);
//                 const tieneGPS = o.Latitud && o.Longitud;

//                 const badgeGPS = tieneGPS
//                     ? `<span class="badge bg-success" title="Lat: ${o.Latitud}, Lon: ${o.Longitud}">📍 Geolocalizado</span>`
//                     : `<span class="badge bg-secondary">Sin GPS</span>`;

//                 const tr = `
//                     <tr>
//                         <td><strong>#${o.IdOrigen}</strong></td>
//                         <td>${o.EmpresaInstitucion}</td>
//                         <td>${o.CalleEI} ${o.NumeroEI}</td>
//                         <td>${o.TelefonoEI || 'N/A'}</td>
//                         <td>${nombreBarrio}</td>
//                         <td>${o.EmailEI || 'N/A'}</td>
//                         <td>${badgeGPS}</td>
//                         <td class="text-center">
//                             <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarParaEditar(${o.IdOrigen})" title="Editar Origen">
//                                 ✏️ Editar
//                             </button>
//                             <button class="btn btn-sm btn-outline-danger" onclick="EliminarOrigen(${o.IdOrigen})" title="Eliminar Origen">
//                                 🗑️ Borrar
//                             </button>
//                         </td>
//                     </tr>`;
//                 $tbody.append(tr);
//             });
//         },
//         error: function (err) {
//             console.error("SITMAS - Error en ListarOrigenes:", err);
//             mostrarAlerta("Error al consultar la lista de Orígenes.", "danger");
//         }
//     });
// }

// async function ProcesarGuardadoOrigen() {
//     const idOrigen = parseInt($("#txtIdOrigen").val()) || 0;
//     const idUbicacionExistente = parseInt($("#txtIdUbicacion").val()) || 0;
//     const empresa = $("#empresa_institucion").val().trim();
//     const calle = $("#calle").val().trim();
//     const numero = $("#numero").val().trim();
//     const telefono = $("#telefono").val().trim();
//     const email = $("#email").val().trim();
//     const idBarrio = parseInt($("#id_barrio").val()) || 0;
//     const nombreBarrio = ObtenerNombreBarrio(idBarrio);

//     if (!empresa || !calle || !numero || idBarrio <= 0) {
//         mostrarAlerta("Por favor complete los campos obligatorios (Empresa, Calle, Número y Barrio).", "warning");
//         return;
//     }

//     let idUbicacionFinal = idUbicacionExistente > 0 ? idUbicacionExistente : null;

//     try {
//         // Geocodificación con Google Maps inyectando también el Barrio
//         const geoResult = await GeocodificarDireccion(calle, numero, nombreBarrio);

//         const dtoUbicacion = {
//             IdUbicacion: idUbicacionFinal || 0,
//             Descripcion: `${empresa} - ${calle} ${numero}`,
//             Latitud: geoResult.latitud,
//             Longitud: geoResult.longitud
//         };

//         if (idUbicacionFinal > 0) {
//             await $.ajax({
//                 type: "PUT",
//                 url: `${URL_API_UBICACION}/${idUbicacionFinal}`,
//                 data: JSON.stringify(dtoUbicacion),
//                 contentType: "application/json; charset=utf-8",
//                 dataType: "json"
//             });
//         } else {
//             const resUbi = await $.ajax({
//                 type: "POST",
//                 url: URL_API_UBICACION,
//                 data: JSON.stringify(dtoUbicacion),
//                 contentType: "application/json; charset=utf-8",
//                 dataType: "json"
//             });
//             idUbicacionFinal = resUbi.IdUbicacionGenerado || resUbi.idUbicacionGenerado;
//         }

//         await GuardarOrigenEnBackend(idOrigen, empresa, calle, numero, telefono, email, idBarrio, idUbicacionFinal);

//     } catch (geoError) {
//         console.warn("SITMAS - Advertencia de Geocodificación Google:", geoError);

//         confirmarAccion(
//             "⚠️ Dirección no localizada en el mapa",
//             `${geoError}. ¿Desea registrar la empresa de todas formas sin coordenadas GPS?`,
//             function () {
//                 GuardarOrigenEnBackend(idOrigen, empresa, calle, numero, telefono, email, idBarrio, idUbicacionFinal);
//             }
//         );
//     }
// }

// function GuardarOrigenEnBackend(idOrigen, empresa, calle, numero, telefono, email, idBarrio, idUbicacion) {
//     const esModificacion = idOrigen > 0;

//     const dtoOrigen = {
//         IdOrigen: idOrigen,
//         EmpresaInstitucion: empresa,
//         CalleEI: calle,
//         NumeroEI: numero,
//         TelefonoEI: telefono,
//         EmailEI: email,
//         Id_Barrio: idBarrio,
//         Id_Ubicacion: idUbicacion > 0 ? idUbicacion : null
//     };

//     const tipoMetodo = esModificacion ? "PUT" : "POST";
//     const urlEndpoint = esModificacion ? `${URL_API_ORIGEN}/${idOrigen}` : URL_API_ORIGEN;

//     $.ajax({
//         type: tipoMetodo,
//         url: urlEndpoint,
//         data: JSON.stringify(dtoOrigen),
//         contentType: "application/json; charset=utf-8",
//         dataType: "json",
//         success: function () {
//             const msg = esModificacion ? "Origen actualizado con éxito." : "Origen creado con éxito.";
//             mostrarAlerta(msg, "success");
//             ResetearFormulario();
//             ListarOrigenes();
//         },
//         error: function (err) {
//             console.error("SITMAS - Error al guardar Origen:", err);
//             mostrarAlerta("No se pudo guardar la información del Origen. Verifique los datos.", "danger");
//         }
//     });
// }

// function CargarParaEditar(id) {
//     $.ajax({
//         type: "GET",
//         url: URL_API_ORIGEN,
//         dataType: "json",
//         success: function (lista) {
//             const origen = lista.find(o => o.IdOrigen === id);
//             if (!origen) {
//                 mostrarAlerta("Origen no encontrado.", "error");
//                 return;
//             }

//             $("#txtIdOrigen").val(origen.IdOrigen);
//             $("#txtIdUbicacion").val(origen.Id_Ubicacion || 0);
//             $("#empresa_institucion").val(origen.EmpresaInstitucion);
//             $("#calle").val(origen.CalleEI);
//             $("#numero").val(origen.NumeroEI);
//             $("#telefono").val(origen.TelefonoEI);
//             $("#email").val(origen.EmailEI);
//             $("#id_barrio").val(origen.Id_Barrio);

//             $("#btnGuardarOrigen").text("💾 Actualizar Origen").removeClass("btn-sitmas-success").addClass("btn-warning");
//             $("#tituloFormOrigen").text(`Modificar Origen #${origen.IdOrigen}`);

//             $("html, body").animate({ scrollTop: $("#formOrigen").offset().top - 70 }, 300);
//         },
//         error: function (err) {
//             console.error("SITMAS - Error al cargar datos para edición:", err);
//             mostrarAlerta("Error al obtener los detalles del Origen.", "danger");
//         }
//     });
// }

// function EliminarOrigen(id) {
//     confirmarAccion(
//         "¿Eliminar Origen?",
//         `Se eliminará el registro del Origen #${id}. Esta acción no se puede deshacer.`,
//         function () {
//             $.ajax({
//                 type: "DELETE",
//                 url: `${URL_API_ORIGEN}/${id}`,
//                 dataType: "json",
//                 success: function () {
//                     mostrarAlerta(`Origen #${id} eliminado correctamente.`, "info");
//                     ListarOrigenes();

//                     if ($("#txtIdOrigen").val() == id) {
//                         ResetearFormulario();
//                     }
//                 },
//                 error: function (err) {
//                     console.error("SITMAS - Error al eliminar Origen:", err);
//                     mostrarAlerta("No se pudo eliminar el Origen. Es posible que esté asociado a Hojas de Ruta activas.", "danger");
//                 }
//             });
//         }
//     );
// }

// /* ==========================================================================
//    4. FUNCIONES AUXILIARES Y UTILS
//    ========================================================================== */

// function ResetearFormulario() {
//     $("#formOrigen")[0].reset();
//     $("#txtIdOrigen").val("0");
//     $("#txtIdUbicacion").val("0");
//     $("#btnGuardarOrigen").text("➕ Guardar Origen").removeClass("btn-warning").addClass("btn-sitmas-success");
//     $("#tituloFormOrigen").text("Registrar Nuevo Origen");
// }

// function ObtenerNombreBarrio(id) {
//     if (!listaBarriosGlobal || listaBarriosGlobal.length === 0) return "";
//     const barrio = listaBarriosGlobal.find(b => Number(b.Id || b.IdBarrio || b.id_Barrio) === Number(id));
//     return barrio ? (barrio.Barrio || barrio.Nombre || barrio.Descripcion) : "";
// }

