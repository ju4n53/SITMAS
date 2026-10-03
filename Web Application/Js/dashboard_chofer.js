/* ==========================================================================
   SITMAS - Módulo: Dashboard de Rutas (Adaptado a Sesiones y Roles)
   ========================================================================== */

const URL_API_HOJAS_RUTA = "https://localhost:44325/api/hojaruta";

// Variables globales para la sesión
let sesionActual = null;
let idUsuarioReal = 0;
let nombreUsuario = "";
let rolUsuario = "";

$(document).ready(function () {
    // 1. Obtenemos y parseamos la "Credencial Completa" del localStorage
    const sesionString = localStorage.getItem("usuarioSesion");
    
    if (!sesionString) {
        console.error("SITMAS - Seguridad: No hay sesión activa.");
        Swal.fire('Acceso Denegado', 'Debe iniciar sesión para ver este panel.', 'error');
        // window.location.href = '../login.html';
        return;
    }

    // Convertimos el texto a un objeto JavaScript
    sesionActual = JSON.parse(sesionString);
    idUsuarioReal = parseInt(sesionActual.id);
    nombreUsuario = sesionActual.nombre;
    rolUsuario = sesionActual.rol; // Ej: "Administrador", "Chofer"

    // Cargamos el tablero
    CargarHojasDeRutaDelDia();
});

function CargarHojasDeRutaDelDia() {
    $.ajax({
        type: "GET",
        url: URL_API_HOJAS_RUTA, 
        dataType: "json",
        success: function (listaRutas) {
            const $contenedor =$("#contenedor-rutas");
            $contenedor.empty();

            if (!listaRutas || listaRutas.length === 0) {
                $contenedor.append('<div class="col-12 text-center text-muted py-4"><h4>No hay viajes programados para hoy.</h4></div>');
                return;
            }

            listaRutas.forEach(ruta => {
                let botonHTML = '';
                let estadoBadgeClass = ObtenerClaseColorEstado(ruta.Estado); 
                
                // 2. LÓGICA DE NEGOCIO BASADA EN LA SESIÓN Y EL NOMBRE
                // Verificamos si la ruta es de este usuario comparando los nombres 
                // (o podrías comparar IDs si devuelves el Id_Chofer correcto en el login)
                const esMiRuta = (ruta.ChoferNombreCompleto === nombreUsuario);

                if (ruta.Id_Estado === 2) { 
                    // Estado Asignado
                    if (rolUsuario === "Administrador") {
                        // Un admin quizás no maneja el camión, solo ve que está lista para salir
                        botonHTML = `<button class="btn btn-outline-primary w-100 mt-3 fw-bold" disabled>Lista para ser iniciada por un chofer</button>`;
                    } else {
                        // Un Chofer sí ve el botón verde para tomarla
                        botonHTML = `<button class="btn btn-success w-100 mt-3 fw-bold" onclick="IniciarViaje(${ruta.Id})">
                                        <span class="material-symbols-outlined align-middle me-1">play_arrow</span> INICIAR VIAJE
                                     </button>`;
                    }
                } 
                else if (ruta.Id_Estado === 3) {
                    // Estado En Curso
                    if (esMiRuta) {
                        // Si soy el chofer que la inició, veo el botón de Finalizar
                        botonHTML = `<button class="btn btn-danger w-100 mt-3 fw-bold" onclick="FinalizarViaje(${ruta.Id})">
                                        <span class="material-symbols-outlined align-middle me-1">stop</span> FINALIZAR VIAJE
                                     </button>`;
                    } else {
                        // Si no soy el chofer (soy Admin, u otro compañero), veo quién la tiene
                        botonHTML = `<button class="btn btn-secondary w-100 mt-3 fw-bold" disabled>
                                        En curso por ${ruta.ChoferNombreCompleto || 'otro chofer'}
                                     </button>`;
                    }
                }
                else if (ruta.Id_Estado === 4) {
                    botonHTML = `<button class="btn btn-outline-success w-100 mt-3 fw-bold" disabled>Viaje Completado</button>`;
                } else {
                     botonHTML = `<button class="btn btn-outline-secondary w-100 mt-3 fw-bold" disabled>Aún no asignado</button>`;
                }

                // 3. Construimos la tarjeta
                const tarjetaHTML = `
                    <div class="col-12 col-md-6 col-xl-4 mb-3">
                        <div class="card h-100 border-top border-4 border-success shadow-sm">
                            <div class="card-header bg-white d-flex justify-content-between align-items-center border-bottom-0 pt-3 pb-0">
                                <h5 class="mb-0 text-success fw-bold">HR #${ruta.Id}</h5>
                                <span class="badge ${estadoBadgeClass}">${ruta.Estado || 'Pendiente'}</span>
                            </div>
                            
                            <div class="card-body">
                                <div class="mb-2 text-muted small">
                                    <span class="material-symbols-outlined align-middle" style="font-size: 16px;">local_shipping</span>
                                    <span class="ms-1 fw-medium">Vehículo:</span> <span class="text-dark">${ruta.Vehiculo || 'Sin Asignar'}</span>
                                </div>
                                <div class="mb-3 text-muted small">
                                    <span class="material-symbols-outlined align-middle" style="font-size: 16px;">route</span>
                                    <span class="ms-1 fw-medium">Distancia Total:</span> <span class="text-dark">${ruta.Distancia_Total_Estimada_Km || 0} Km</span>
                                </div>
                                
                                ${botonHTML}
                            </div>
                        </div>
                    </div>
                `;

                $contenedor.append(tarjetaHTML);
            });
        },
        error: function (err) {
            console.error("SITMAS - Error:", err);
        }
    });
}

function ObtenerClaseColorEstado(estadoNombre) {
    if (!estadoNombre) return "bg-secondary";
    const est = estadoNombre.toLowerCase();
    if (est.includes("pendiente")) return "bg-warning text-dark";
    if (est.includes("asignado")) return "bg-primary";
    if (est.includes("curso")) return "bg-info text-dark";
    if (est.includes("finaliz")) return "bg-success";
    return "bg-secondary";
}

// Nota: En IniciarViaje() usamos la variable global idUsuarioReal
function IniciarViaje(idHojaRuta) {
    Swal.fire({
        title: '¿Iniciar Viaje?',
        text: "Quedarás registrado como el chofer de esta hoja de ruta.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, Iniciar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            
            // Usamos el ID sacado de la sesión
            const dto = { IdUsuario: idUsuarioReal };

            $.ajax({
                type: "PATCH",
                url: `${URL_API_HOJAS_RUTA}/${idHojaRuta}/iniciar`,
                data: JSON.stringify(dto),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (respuesta) {
                    Swal.fire('¡Éxito!', respuesta.Mensaje, 'success');
                    CargarHojasDeRutaDelDia(); 
                },
                error: function (err) {
                    Swal.fire('Atención', 'No se pudo iniciar el viaje.', 'warning');
                }
            });
        }
    });
}

// 5. FUNCIÓN PARA FINALIZAR VIAJE
function FinalizarViaje(idHojaRuta) {
    Swal.fire({
        title: '¿Finalizar Viaje?',
        text: "¿Confirmas que has completado todas las paradas y el recorrido?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, Finalizar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            
            $.ajax({
                type: "PATCH",
                url: `${URL_API_HOJAS_RUTA}/${idHojaRuta}/finalizar`,
                // No enviamos 'data' porque el endpoint solo usa el ID de la URL
                success: function (respuesta) {
                    Swal.fire('¡Excelente trabajo!', respuesta.Mensaje || 'Viaje finalizado.', 'success');
                    CargarHojasDeRutaDelDia(); // Refrescamos el tablero
                },
                error: function (err) {
                    console.error("SITMAS - Error al finalizar viaje:", err);
                    const mensajeError = err.responseJSON && err.responseJSON.Message ? err.responseJSON.Message : 'No se pudo finalizar el viaje.';
                    Swal.fire('Atención', mensajeError, 'warning');
                }
            });
        }
    });
}









// /* ==========================================================================
//    SITMAS - Módulo: Dashboard Chofer (Mis Rutas)
//    Tecnologías: JavaScript (ES6+), jQuery, AJAX, Bootstrap 5
//    ========================================================================== */

// const URL_API_HOJAS_RUTA = "https://localhost:44325/api/hojaruta";

// $(document).ready(function () {
//     // 1. Obtenemos el ID del empleado desde el localStorage
//     const idChoferLogueado = localStorage.getItem("idEmpleado");

//     // Verificación de seguridad
//     if (!idChoferLogueado) {
//         console.error("SITMAS - Seguridad: No se encontró el ID del chofer en sesión.");
//         // Opcional: window.location.href = '../login.html';
//         return;
//     }

//     // Cargamos las hojas de ruta al iniciar
//     CargarHojasDeRutaDelDia(idChoferLogueado);
// });

// function CargarHojasDeRutaDelDia(idChoferLogueado) {
//     $.ajax({
//         type: "GET",
//         url: URL_API_HOJAS_RUTA,
//         dataType: "json",
//         success: function (listaRutas) {
//             const $contenedor = $("#contenedor-rutas"); // Asegúrate de tener este id en tu HTML
//             $contenedor.empty(); // Limpiamos el contenedor

//             if (!listaRutas || listaRutas.length === 0) {
//                 $contenedor.append('<div class="col-12 text-center text-muted py-4"><h4>No hay viajes programados para hoy.</h4></div>');
//                 return;
//             }

//             listaRutas.forEach(ruta => {
//                 // 2. Lógica del "Escenario B": Determinar estado del botón
//                 let botonHTML = '';
//                 let estadoBadgeClass = ObtenerClaseColorEstado(ruta.Estado); // Reutilizamos tu función si la tienes en un script global, si no, te la incluyo abajo.

//                 // Analizamos el estado (1-Pendiente, 2-Asignado, 3-En curso, 4-Finalizado)
//                 if (ruta.Id_Estado === 2) {
//                     botonHTML = `<button class="btn btn-success w-100 mt-3 fw-bold" onclick="IniciarViaje(${ruta.Id}, ${idChoferLogueado})">
//                                     <span class="material-symbols-outlined align-middle me-1">play_arrow</span> INICIAR VIAJE
//                                  </button>`;
//                 }
//                 else if (ruta.Id_Estado === 3 && ruta.Id_Chofer == idChoferLogueado) {
//                     botonHTML = `<button class="btn btn-danger w-100 mt-3 fw-bold" onclick="FinalizarViaje(${ruta.Id}, ${idChoferLogueado})">
//                                     <span class="material-symbols-outlined align-middle me-1">stop</span> FINALIZAR VIAJE
//                                  </button>`;
//                 }
//                 else if (ruta.Id_Estado === 3 && ruta.Id_Chofer != idChoferLogueado) {
//                     botonHTML = `<button class="btn btn-secondary w-100 mt-3 fw-bold" disabled>
//                                     En curso por ${ruta.ChoferNombreCompleto || 'otro chofer'}
//                                  </button>`;
//                 }
//                 else if (ruta.Id_Estado === 4) {
//                     botonHTML = `<button class="btn btn-outline-success w-100 mt-3 fw-bold" disabled>Viaje Completado</button>`;
//                 } else {
//                     // Para estado 1 (Pendiente) u otros
//                     botonHTML = `<button class="btn btn-outline-secondary w-100 mt-3 fw-bold" disabled>Aún no asignado</button>`;
//                 }

//                 // 3. Construimos la tarjeta
//                 const tarjetaHTML = `
//                     <div class="col-12 col-md-6 col-xl-4 mb-3">
//                         <div class="card h-100 border-top border-4 border-success shadow-sm">
//                             <div class="card-header bg-white d-flex justify-content-between align-items-center border-bottom-0 pt-3 pb-0">
//                                 <h5 class="mb-0 text-success fw-bold">HR #${ruta.Id}</h5>
//                                 <span class="badge ${estadoBadgeClass}">${ruta.Estado || 'Pendiente'}</span>
//                             </div>
                            
//                             <div class="card-body">
//                                 <div class="mb-2 text-muted small">
//                                     <span class="material-symbols-outlined align-middle" style="font-size: 16px;">local_shipping</span>
//                                     <span class="ms-1 fw-medium">Vehículo:</span> <span class="text-dark">${ruta.Vehiculo || 'Sin Asignar'}</span>
//                                 </div>
//                                 <div class="mb-3 text-muted small">
//                                     <span class="material-symbols-outlined align-middle" style="font-size: 16px;">route</span>
//                                     <span class="ms-1 fw-medium">Distancia Total:</span> <span class="text-dark">${ruta.Distancia_Total_Estimada_Km || 0} Km</span>
//                                 </div>
                                
//                                 ${botonHTML}
//                             </div>
//                         </div>
//                     </div>
//                 `;

//                 $contenedor.append(tarjetaHTML);
//             });
//         },
//         error: function (err) {
//             console.error("SITMAS - Error en CargarHojasDeRutaDelDia:", err);
//             Swal.fire('Error', 'No se pudieron cargar las hojas de ruta del día.', 'error');
//         }
//     });
// }

// // 4. FUNCIÓN PARA INICIAR VIAJE (Usando jQuery AJAX PATCH)
// function IniciarViaje(idHojaRuta, idChofer) {
//     Swal.fire({
//         title: '¿Iniciar Viaje?',
//         text: "Estás a punto de tomar esta hoja de ruta.",
//         icon: 'question',
//         showCancelButton: true,
//         confirmButtonColor: '#10b981',
//         cancelButtonColor: '#d33',
//         confirmButtonText: 'Sí, Iniciar',
//         cancelButtonText: 'Cancelar'
//     }).then((result) => {
//         if (result.isConfirmed) {

//             const dto = { IdChofer: parseInt(idChofer) };

//             $.ajax({
//                 type: "PATCH",
//                 url: `${URL_API_HOJAS_RUTA}/${idHojaRuta}/iniciar`,
//                 data: JSON.stringify(dto),
//                 contentType: "application/json; charset=utf-8",
//                 dataType: "json",
//                 success: function (respuesta) {
//                     Swal.fire('¡Éxito!', respuesta.Mensaje || 'Viaje iniciado.', 'success');
//                     // Refrescamos el tablero pasándole nuevamente el ID
//                     CargarHojasDeRutaDelDia(idChofer);
//                 },
//                 error: function (err) {
//                     console.error("SITMAS - Error al iniciar viaje:", err);
//                     // Aquí mostramos el mensaje de error que viene desde SQL/API
//                     const mensajeError = err.responseJSON && err.responseJSON.Message ? err.responseJSON.Message : 'No se pudo iniciar el viaje.';
//                     Swal.fire('Atención', mensajeError, 'warning');
//                 }
//             });
//         }
//     });
// }

// // 5. FUNCIÓN PARA FINALIZAR VIAJE (Usando jQuery AJAX PATCH)
// function FinalizarViaje(idHojaRuta, idChofer) {
//     Swal.fire({
//         title: '¿Finalizar Viaje?',
//         text: "¿Confirmas que has completado todas las paradas y el recorrido?",
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonColor: '#10b981',
//         cancelButtonColor: '#d33',
//         confirmButtonText: 'Sí, Finalizar',
//         cancelButtonText: 'Cancelar'
//     }).then((result) => {
//         if (result.isConfirmed) {

//             $.ajax({
//                 type: "PATCH",
//                 url: `${URL_API_HOJAS_RUTA}/${idHojaRuta}/finalizar`,
//                 // No necesitamos enviar 'data' (Body) porque el endpoint solo pide el ID en la URL
//                 success: function (respuesta) {
//                     Swal.fire('¡Excelente trabajo!', respuesta.Mensaje || 'Viaje finalizado.', 'success');
//                     CargarHojasDeRutaDelDia(idChofer);
//                 },
//                 error: function (err) {
//                     console.error("SITMAS - Error al finalizar viaje:", err);
//                     const mensajeError = err.responseJSON && err.responseJSON.Message ? err.responseJSON.Message : 'No se pudo finalizar el viaje.';
//                     Swal.fire('Atención', mensajeError, 'warning');
//                 }
//             });
//         }
//     });
// }

// // Función auxiliar (puedes omitirla si ya la tienes global)
// function ObtenerClaseColorEstado(estadoNombre) {
//     if (!estadoNombre) return "bg-secondary";
//     const est = estadoNombre.toLowerCase();
//     if (est.includes("pendiente")) return "bg-warning text-dark";
//     if (est.includes("asignado")) return "bg-primary";
//     if (est.includes("curso")) return "bg-info text-dark";
//     if (est.includes("finaliz")) return "bg-success";
//     return "bg-secondary";
// }