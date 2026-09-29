/* ==========================================================================
   SITMAS - Módulo: Empresa / Origen - Lógica de Interfaz y Geocodificación
   Tecnologías: JavaScript (ES6+), jQuery, AJAX, Google Maps Geocoding API
   ========================================================================== */

const URL_API_ORIGEN = "https://localhost:44325/api/origen";
const URL_API_BARRIOS = "https://localhost:44325/api/Barrio/ListarTodo";
const URL_API_UBICACION = "https://localhost:44325/api/ubicaciongeografica";

let listaBarriosGlobal = [];

$(document).ready(function () {
    // 1. Inicialización de barrios y tabla principal
    InicializarModuloOrigen();

    // 2. Controladores de eventos del Formulario
    $("#formOrigen").on("submit", function (e) {
        e.preventDefault();
        ProcesarGuardadoOrigen();
    });

    $("#btnLimpiarForm").on("click", function () {
        ResetearFormulario();
    });

    // 3. Buscador reactivo en vivo sobre la tabla
    $("#inputBusquedaOrigen").on("keyup", function () {
        const busqueda = $(this).val().toLowerCase();$("#tbodyOrigenes tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(busqueda) > -1);
        });
    });
});

/* ==========================================================================
   1. CARGA INICIAL Y COMBOS
   ========================================================================== */

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

/* ==========================================================================
   2. SERVICIO DE GEOCODIFICACIÓN (Google Maps Geocoding API)
   ========================================================================== */

/**
 * Traduce una dirección postal a coordenadas GPS (Latitud y Longitud) usando Google Maps
 * @param {string} calle 
 * @param {string} numero 
 * @param {string} barrio 
 * @param {string} ciudad 
 * @returns {Promise<Object>} Promesa que resuelve { latitud, longitud, descripcion }
 */
function GeocodificarDireccion(calle, numero, barrio = "", ciudad = "Córdoba, Argentina") {
    return new Promise((resolve, reject) => {
        // Instanciamos el Geocoder de Google Maps
        const geocoder = new google.maps.Geocoder();

        // Armamos la cadena completa de dirección para mayor precisión en Córdoba
        const direccionConsulta = `${calle} ${numero}, ${barrio ? barrio + ', ' : ''}${ciudad}`;

        geocoder.geocode({ address: direccionConsulta }, (results, status) => {
            if (status === "OK" && results && results.length > 0) {
                const primerResultado = results[0];
                const location = primerResultado.geometry.location;

                // Google devuelve funciones .lat() y .lng() en el objeto location
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

/* ==========================================================================
   3. OPERACIONES CRUD Y LÓGICA DE GUARDADO
   ========================================================================== */

function ListarOrigenes() {
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
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="CargarParaEditar(${o.IdOrigen})" title="Editar Origen">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="EliminarOrigen(${o.IdOrigen})" title="Eliminar Origen">
                                🗑️ Borrar
                            </button>
                        </td>
                    </tr>`;
                $tbody.append(tr);
            });
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
        // Geocodificación con Google Maps inyectando también el Barrio
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

        confirmarAccion(
            "⚠️ Dirección no localizada en el mapa",
            `${geoError}. ¿Desea registrar la empresa de todas formas sin coordenadas GPS?`,
            function () {
                GuardarOrigenEnBackend(idOrigen, empresa, calle, numero, telefono, email, idBarrio, idUbicacionFinal);
            }
        );
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
                mostrarAlerta("Origen no encontrado.", "error");
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

            $("html, body").animate({ scrollTop: $("#formOrigen").offset().top - 70 }, 300);
        },
        error: function (err) {
            console.error("SITMAS - Error al cargar datos para edición:", err);
            mostrarAlerta("Error al obtener los detalles del Origen.", "danger");
        }
    });
}

function EliminarOrigen(id) {
    confirmarAccion(
        "¿Eliminar Origen?",
        `Se eliminará el registro del Origen #${id}. Esta acción no se puede deshacer.`,
        function () {
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
    );
}

/* ==========================================================================
   4. FUNCIONES AUXILIARES Y UTILS
   ========================================================================== */

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



// /* ==========================================================================
//    SITMAS - Módulo: Empresa / Origen - Lógica de Interfaz y Geocodificación
//    Tecnologías: JavaScript (ES6+), jQuery, AJAX, OpenStreetMap (Nominatim)
//    ========================================================================== */

// const URL_API_ORIGEN = "https://localhost:44325/api/origen";
// const URL_API_BARRIOS = "https://localhost:44325/api/Barrio/ListarTodo"; // Ajusta según tu endpoint de Barrios
// const URL_API_UBICACION = "https://localhost:44325/api/ubicaciongeografica";

// let listaBarriosGlobal = [];

// $(document).ready(function () {
//     // 1. Inicialización en paralelo de barrios y tabla principal
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
//             console.error("Error al cargar los barrios auxiliares:", err);
//             // Si la API de Barrio no responde, listamos los orígenes de todos modos
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
//    2. SERVICIO DE GEOCODIFICACIÓN (OpenStreetMap / Nominatim)
//    ========================================================================== */

// /**
//  * Traduce una dirección en coordenadas GPS (Latitud y Longitud)
//  */
// function GeocodificarDireccion(calle, numero, ciudad = "Córdoba, Argentina") {
//     return new Promise((resolve, reject) => {
//         const direccionConsulta = `${calle} ${numero}, ${ciudad}`;
//         const urlNominatim = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccionConsulta)}`;

//         $.ajax({
//             type: "GET",
//             url: urlNominatim,
//             dataType: "json",
//             headers: {
//                 'Accept-Language': 'es'
//             },
//             success: function (resultados) {
//                 if (resultados && resultados.length > 0) {
//                     const mejorResultado = resultados[0];
//                     resolve({
//                         latitud: parseFloat(mejorResultado.lat),
//                         longitud: parseFloat(mejorResultado.lon),
//                         descripcion: mejorResultado.display_name
//                     });
//                 } else {
//                     reject("No se encontraron coordenadas GPS exactas para la dirección.");
//                 }
//             },
//             error: function (err) {
//                 console.error("Error en servicio Nominatim:", err);
//                 reject("Fallo de comunicación con el servicio de mapas.");
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

//     if (!empresa || !calle || !numero || idBarrio <= 0) {
//         mostrarAlerta("Por favor complete los campos obligatorios (Empresa, Calle, Número y Barrio).", "warning");
//         return;
//     }

//     let idUbicacionFinal = idUbicacionExistente > 0 ? idUbicacionExistente : null;

//     try {
//         // Intentamos la geocodificación
//         const geoResult = await GeocodificarDireccion(calle, numero);

//         // Guardamos o actualizamos las coordenadas en api/ubicaciongeografica
//         const dtoUbicacion = {
//             IdUbicacion: idUbicacionFinal || 0,
//             Descripcion: `${empresa} - ${calle} ${numero}`,
//             Latitud: geoResult.latitud,
//             Longitud: geoResult.longitud
//         };

//         if (idUbicacionFinal > 0) {
//             // Modificación de Ubicación Geográfica
//             await $.ajax({
//                 type: "PUT",
//                 url: `${URL_API_UBICACION}/${idUbicacionFinal}`,
//                 data: JSON.stringify(dtoUbicacion),
//                 contentType: "application/json; charset=utf-8",
//                 dataType: "json"
//             });
//         } else {
//             // Alta de Ubicación Geográfica
//             const resUbi = await $.ajax({
//                 type: "POST",
//                 url: URL_API_UBICACION,
//                 data: JSON.stringify(dtoUbicacion),
//                 contentType: "application/json; charset=utf-8",
//                 dataType: "json"
//             });
//             idUbicacionFinal = resUbi.IdUbicacionGenerado || resUbi.idUbicacionGenerado;
//         }

//         // Procedemos a guardar la Empresa/Origen
//         await GuardarOrigenEnBackend(idOrigen, empresa, calle, numero, telefono, email, idBarrio, idUbicacionFinal);

//     } catch (geoError) {
//         console.warn("SITMAS - Advertencia de Geocodificación:", geoError);

//         // Si la geocodificación falla, consultamos al usuario si desea guardar sin coordenadas
//         confirmarAccion(
//             "⚠️ Dirección no localizada en mapa",
//             `${geoError}. ¿Desea registrar la empresa de todas formas sin geolocalización?`,
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
//     if (!listaBarriosGlobal || listaBarriosGlobal.length === 0) return "Sin asignar";
//     const barrio = listaBarriosGlobal.find(b => Number(b.Id || b.IdBarrio || b.id_Barrio) === Number(id));
//     return barrio ? (barrio.Barrio || barrio.Nombre || barrio.Descripcion) : "Sin asignar";
// }

