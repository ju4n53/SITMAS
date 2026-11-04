

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener datos del usuario 
    // Aquí tomamos los datos que, según me cuentas, se obtuvieron en la validación previa.
    // Asumimos que el span con id "header-user" tiene el formato "Apellido, Nombre"
    let nombreApellido = document.getElementById('header-user').textContent;
    if (nombreApellido === '---') {
        nombreApellido = 'Usuario'; // Valor por defecto si aún no carga
    }

    // NOTA PARA EL ALUMNO: El CUIL deberías tenerlo guardado en sessionStorage, localStorage
    // o en una variable global luego de la primera validación. Aquí lo simulo.
    const cuilUsuario = sessionStorage.getItem('usuarioCUIL') || '11-11111111-1';

    // 2. Localizar el contenedor principal (<main>)
    const mainContainer = document.querySelector('main.container-fluid');

    // 3. Crear el contenedor para las tarjetas y el mensaje de bienvenida
    const dashboardContainer = document.createElement('div');
    dashboardContainer.classList.add('container-fluid', 'mt-2', 'fade-in');
    dashboardContainer.id = 'panel-reparticiones';

    // 4. Estructurar el HTML interno (Bienvenida + Cards) usando Bootstrap 5
    dashboardContainer.innerHTML = `
        <!-- Sección de Bienvenida -->
        <div class="row mb-4 text-center">
            <div class="col-12">
                <h2 class="display-6 fw-bold" style="color: var(--emec-primary-color, #0056b3);">¡Bienvenido, ${nombreApellido}!</h2>
                <h5 class="mt-3 text-secondary">Por favor, elije la repartición a la que perteneces para ingresar al sistema:</h5>
                <!--<p class="text-muted mb-1">CUIL Registrado: <strong>${cuilUsuario}</strong></p>
            </div>
        </div>

        <!-- Contenedor de Tarjetas -->
        <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3  g-4 justify-content-center mt-2">
            
            <!-- Card EMEC -->
            <div class="col">
                <div class="card h-100 shadow-sm border-0 cursor-pointer hover-shadow transition-all" data-bs-toggle="modal" data-bs-target="#loginReparticionModal" data-reparticion="EMEC">
                    <div class="card-body text-center d-flex flex-column justify-content-center align-items-center p-4">
                        <img src="../assets/logo-card-EMEC.jpg" class="img-fluid mb-3" alt="Logo EMEC" style="max-height: 30vh; object-fit: contain;">
                        <h5 class="card-title text-uppercase fw-bold m-0 text-secondary">EMEC</h5>
                    </div>
                </div>
            </div>

            <!-- Card ITEC -->
            <div class="col">
                <div class="card h-100 shadow-sm border-0 cursor-pointer hover-shadow transition-all" data-bs-toggle="modal" data-bs-target="#loginReparticionModal" data-reparticion="ITEC">
                    <div class="card-body text-center d-flex flex-column justify-content-center align-items-center p-4">
                        <img src="../assets/logo-card-ITEC.jpg" class="img-fluid mb-3" alt="Logo ITEC" style="max-height: 30vh; object-fit: contain;">
                        <h5 class="card-title text-uppercase fw-bold m-0 text-secondary">ITEC</h5>
                    </div>
                </div>
            </div>

            <!-- Card Castraciones -->
            <div class="col">
                <div class="card h-100 shadow-sm border-0 cursor-pointer hover-shadow transition-all" data-bs-toggle="modal" data-bs-target="#loginReparticionModal" data-reparticion="Centro de Castraciones">
                    <div class="card-body text-center d-flex flex-column justify-content-center align-items-center p-4">
                        <img src="../assets/logo-card-castraciones.jpg" class="img-fluid mb-3" alt="Logo Castraciones" style="max-height: 30vh; object-fit: contain;">
                        <h5 class="card-title text-uppercase fw-bold m-0 text-secondary text-wrap" style="font-size: 0.95rem;">Castraciones</h5>
                    </div>
                </div>
            </div>

            <!-- Card Parque Sarmiento -->
            <div class="col">
                <div class="card h-100 shadow-sm border-0 cursor-pointer hover-shadow transition-all" data-bs-toggle="modal" data-bs-target="#loginReparticionModal" data-reparticion="Parque Sarmiento">
                    <div class="card-body text-center d-flex flex-column justify-content-center align-items-center p-4">
                        <img src="../assets/logo-card-pSarmiento.jpg" class="img-fluid mb-3" alt="Logo Parque Sarmiento" style="max-height: 30vh; object-fit: contain;">
                        <h5 class="card-title text-uppercase fw-bold m-0 text-secondary text-wrap" style="font-size: 0.95rem;">Parque Sarmiento</h5>
                    </div>
                </div>
            </div>

            <!-- Card Reserva San Martín -->
            <div class="col">
                <div class="card h-100 shadow-sm border-0 cursor-pointer hover-shadow transition-all" data-bs-toggle="modal" data-bs-target="#loginReparticionModal" data-reparticion="Reserva San Martín">
                    <div class="card-body text-center d-flex flex-column justify-content-center align-items-center p-4">
                        <img src="../assets/logo-card-reservaSM.jpg" class="img-fluid mb-3" alt="Logo Reserva San Martín" style="max-height: 30vh; object-fit: contain;">
                        <h5 class="card-title text-uppercase fw-bold m-0 text-secondary text-wrap" style="font-size: 0.95rem;">Reserva San Martín</h5>
                    </div>
                </div>
            </div>
            
        </div>
    `;

    // 5. Inyectar en el DOM (antes de los paneles ocultos)
    mainContainer.insertBefore(dashboardContainer, mainContainer.firstChild);

    // 6. Construir e inyectar el Modal para el segundo paso de validación
    inyectarModalValidacion();

    // 7. Configurar eventos
    configurarEventosClicks();
});

// Función para crear el Modal de doble validación
function inyectarModalValidacion() {
    if (document.getElementById('loginReparticionModal')) return; // Evita duplicados

    const modalHTML = `
        <div class="modal fade" id="loginReparticionModal" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header header-color-emec text-white border-0">
                        <h6 class="modal-title w-100 text-center fw-bold" id="modalLabel">
                            Acceso a <span id="nombre-reparticion-modal" class="text-warning"></span>
                        </h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4">
                        <form id="form-segunda-validacion">
                            <div class="mb-3 text-center">
                                <span class="material-symbols-outlined text-primary mb-2" style="font-size: 3rem;">lock_person</span>
                                <p class="small text-muted mb-3">Ingrese su PIN de seguridad o contraseña para confirmar su rol en esta área.</p>
                            </div>
                            <div class="mb-3">
                                <input type="password" class="form-control form-control-lg text-center letter-spacing-2" id="inputCredencial" placeholder="****" required autocomplete="off">
                            </div>
                            <div class="d-grid mt-4">
                                <button type="submit" class="btn btn-primary btn-lg fw-bold">Validar Ingreso</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Lógica para cuando el usuario envía el formulario del modal
    document.getElementById('form-segunda-validacion').addEventListener('submit', (e) => {
        e.preventDefault();
        const credencial = document.getElementById('inputCredencial').value;
        const reparticion = document.getElementById('nombre-reparticion-modal').textContent;

        console.log(`Intentando validación estricta para: ${reparticion}`);

        // AQUÍ VA TU LÓGICA DE C#: Llamada fetch/AJAX a tu API C# para validar el PIN/Rol
        // ...

        // Simulación temporal
        Swal.fire({
            icon: 'success',
            title: 'Acceso Autorizado',
            text: `Bienvenido al panel de ${reparticion}`,
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            // Cerrar modal
            const modalEl = document.getElementById('loginReparticionModal');
            const modalInst = bootstrap.Modal.getInstance(modalEl);
            modalInst.hide();

            // Aquí ocultarías el panel de tarjetas y mostrarías el panel correspondiente (ej: #panel-graficos)
            document.getElementById('panel-reparticiones').classList.add('d-none');
            // document.getElementById('panel-graficos').classList.remove('d-none'); // Descomentar cuando aplique
        });
    });
}

function configurarEventosClicks() {
    const cards = document.querySelectorAll('.card[data-reparticion]');
    const spanTitulo = document.getElementById('nombre-reparticion-modal');
    const inputPass = document.getElementById('inputCredencial');

    cards.forEach(card => {
        card.addEventListener('click', function () {
            // Extraer el nombre del data-attribute
            const nombreRep = this.getAttribute('data-reparticion');

            // Actualizar el título del modal dinámicamente
            spanTitulo.textContent = nombreRep;

            // Limpiar el campo de contraseña por seguridad
            inputPass.value = '';

            // Opcional: Hacer focus en el input cuando el modal termine de abrirse
            const modalEl = document.getElementById('loginReparticionModal');
            modalEl.addEventListener('shown.bs.modal', () => {
                inputPass.focus();
            }, { once: true }); // El {once: true} evita que se acumulen listeners
        });
    });
}











// document.addEventListener('DOMContentLoaded', () => {
//     // 1. Obtener datos del usuario 
//     // Aquí tomamos los datos que, según me cuentas, se obtuvieron en la validación previa.
//     // Asumimos que el span con id "header-user" tiene el formato "Apellido, Nombre"
//     let nombreApellido = document.getElementById('header-user').textContent;
//     if (nombreApellido === '---') {
//         nombreApellido = 'Usuario'; // Valor por defecto si aún no carga
//     }

//     // NOTA PARA EL ALUMNO: El CUIL deberías tenerlo guardado en sessionStorage, localStorage
//     // o en una variable global luego de la primera validación. Aquí lo simulo.
//     const cuilUsuario = sessionStorage.getItem('usuarioCUIL') || '11-11111111-1';

//     // 2. Localizar el contenedor principal (<main>)
//     const mainContainer = document.querySelector('main.container-fluid');

//     // 3. Crear el contenedor para las tarjetas y el mensaje de bienvenida
//     const dashboardContainer = document.createElement('div');
//     dashboardContainer.classList.add('container-fluid', 'mt-2', 'fade-in');
//     dashboardContainer.id = 'panel-reparticiones';

//     // 4. Estructurar el HTML interno (Bienvenida + Cards) usando Bootstrap 5
//     dashboardContainer.innerHTML = `
//         <!-- Sección de Bienvenida -->
//         <div class="row mb-4 text-center">
//             <div class="col-12">
//                 <h2 class="display-6 fw-bold" style="color: var(--emec-primary-color, #0056b3);">¡Bienvenido, ${nombreApellido}!</h2>
//                 <!--<p class="text-muted mb-1">CUIL Registrado: <strong>${cuilUsuario}</strong></p>
//                 <h5 class="mt-3 text-secondary">Por favor, elije la repartición a la que perteneces para ingresar al sistema:</h5>
//             </div>
//         </div>

//         <!-- Contenedor de Tarjetas -->
//         <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-5 g-4 justify-content-center mt-2">
            
//             <!-- Card EMEC -->
//             <div class="col">
//                 <div class="card h-100 shadow-sm border-0 cursor-pointer hover-shadow transition-all" data-bs-toggle="modal" data-bs-target="#loginReparticionModal" data-reparticion="EMEC">
//                     <div class="card-body text-center d-flex flex-column justify-content-center align-items-center p-4">
//                         <img src="../assets/logo-card-EMEC.jpg" class="img-fluid mb-3" alt="Logo EMEC" style="max-height: 120px; object-fit: contain;">
//                         <h5 class="card-title text-uppercase fw-bold m-0 text-secondary">EMEC</h5>
//                     </div>
//                 </div>
//             </div>

//             <!-- Card ITEC -->
//             <div class="col">
//                 <div class="card h-100 shadow-sm border-0 cursor-pointer hover-shadow transition-all" data-bs-toggle="modal" data-bs-target="#loginReparticionModal" data-reparticion="ITEC">
//                     <div class="card-body text-center d-flex flex-column justify-content-center align-items-center p-4">
//                         <img src="../assets/logo-card-ITEC.jpg" class="img-fluid mb-3" alt="Logo ITEC" style="max-height: 120px; object-fit: contain;">
//                         <h5 class="card-title text-uppercase fw-bold m-0 text-secondary">ITEC</h5>
//                     </div>
//                 </div>
//             </div>

//             <!-- Card Castraciones -->
//             <div class="col">
//                 <div class="card h-100 shadow-sm border-0 cursor-pointer hover-shadow transition-all" data-bs-toggle="modal" data-bs-target="#loginReparticionModal" data-reparticion="Centro de Castraciones">
//                     <div class="card-body text-center d-flex flex-column justify-content-center align-items-center p-4">
//                         <img src="../assets/logo-card-castraciones.jpg" class="img-fluid mb-3" alt="Logo Castraciones" style="max-height: 120px; object-fit: contain;">
//                         <h5 class="card-title text-uppercase fw-bold m-0 text-secondary text-wrap" style="font-size: 0.95rem;">Castraciones</h5>
//                     </div>
//                 </div>
//             </div>

//             <!-- Card Parque Sarmiento -->
//             <div class="col">
//                 <div class="card h-100 shadow-sm border-0 cursor-pointer hover-shadow transition-all" data-bs-toggle="modal" data-bs-target="#loginReparticionModal" data-reparticion="Parque Sarmiento">
//                     <div class="card-body text-center d-flex flex-column justify-content-center align-items-center p-4">
//                         <img src="../assets/logo-card-pSarmiento.jpg" class="img-fluid mb-3" alt="Logo Parque Sarmiento" style="max-height: 120px; object-fit: contain;">
//                         <h5 class="card-title text-uppercase fw-bold m-0 text-secondary text-wrap" style="font-size: 0.95rem;">Parque Sarmiento</h5>
//                     </div>
//                 </div>
//             </div>

//             <!-- Card Reserva San Martín -->
//             <div class="col">
//                 <div class="card h-100 shadow-sm border-0 cursor-pointer hover-shadow transition-all" data-bs-toggle="modal" data-bs-target="#loginReparticionModal" data-reparticion="Reserva San Martín">
//                     <div class="card-body text-center d-flex flex-column justify-content-center align-items-center p-4">
//                         <img src="../assets/logo-card-reservaSM.jpg" class="img-fluid mb-3" alt="Logo Reserva San Martín" style="max-height: 120px; object-fit: contain;">
//                         <h5 class="card-title text-uppercase fw-bold m-0 text-secondary text-wrap" style="font-size: 0.95rem;">Reserva San Martín</h5>
//                     </div>
//                 </div>
//             </div>
            
//         </div>
//     `;

//     // 5. Inyectar en el DOM (antes de los paneles ocultos)
//     mainContainer.insertBefore(dashboardContainer, mainContainer.firstChild);

//     // 6. Construir e inyectar el Modal para el segundo paso de validación
//     inyectarModalValidacion();

//     // 7. Configurar eventos
//     configurarEventosClicks();
// });

// // Función para crear el Modal de doble validación
// function inyectarModalValidacion() {
//     if (document.getElementById('loginReparticionModal')) return; // Evita duplicados

//     const modalHTML = `
//         <div class="modal fade" id="loginReparticionModal" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
//             <div class="modal-dialog modal-dialog-centered modal-sm">
//                 <div class="modal-content border-0 shadow-lg">
//                     <div class="modal-header header-color-emec text-white border-0">
//                         <h6 class="modal-title w-100 text-center fw-bold" id="modalLabel">
//                             Acceso a <span id="nombre-reparticion-modal" class="text-warning"></span>
//                         </h6>
//                         <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
//                     </div>
//                     <div class="modal-body p-4">
//                         <form id="form-segunda-validacion">
//                             <div class="mb-3 text-center">
//                                 <span class="material-symbols-outlined text-primary mb-2" style="font-size: 3rem;">lock_person</span>
//                                 <p class="small text-muted mb-3">Ingrese su PIN de seguridad o contraseña para confirmar su rol en esta área.</p>
//                             </div>
//                             <div class="mb-3">
//                                 <input type="password" class="form-control form-control-lg text-center letter-spacing-2" id="inputCredencial" placeholder="****" required autocomplete="off">
//                             </div>
//                             <div class="d-grid mt-4">
//                                 <button type="submit" class="btn btn-primary btn-lg fw-bold">Validar Ingreso</button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     `;

//     document.body.insertAdjacentHTML('beforeend', modalHTML);

//     // Lógica para cuando el usuario envía el formulario del modal
//     document.getElementById('form-segunda-validacion').addEventListener('submit', (e) => {
//         e.preventDefault();
//         const credencial = document.getElementById('inputCredencial').value;
//         const reparticion = document.getElementById('nombre-reparticion-modal').textContent;

//         console.log(`Intentando validación estricta para: ${reparticion}`);

//         // AQUÍ VA TU LÓGICA DE C#: Llamada fetch/AJAX a tu API C# para validar el PIN/Rol
//         // ...

//         // Simulación temporal
//         Swal.fire({
//             icon: 'success',
//             title: 'Acceso Autorizado',
//             text: `Bienvenido al panel de ${reparticion}`,
//             showConfirmButton: false,
//             timer: 1500
//         }).then(() => {
//             // Cerrar modal
//             const modalEl = document.getElementById('loginReparticionModal');
//             const modalInst = bootstrap.Modal.getInstance(modalEl);
//             modalInst.hide();

//             // Aquí ocultarías el panel de tarjetas y mostrarías el panel correspondiente (ej: #panel-graficos)
//             document.getElementById('panel-reparticiones').classList.add('d-none');
//             // document.getElementById('panel-graficos').classList.remove('d-none'); // Descomentar cuando aplique
//         });
//     });
// }

// function configurarEventosClicks() {
//     const cards = document.querySelectorAll('.card[data-reparticion]');
//     const spanTitulo = document.getElementById('nombre-reparticion-modal');
//     const inputPass = document.getElementById('inputCredencial');

//     cards.forEach(card => {
//         card.addEventListener('click', function () {
//             // Extraer el nombre del data-attribute
//             const nombreRep = this.getAttribute('data-reparticion');

//             // Actualizar el título del modal dinámicamente
//             spanTitulo.textContent = nombreRep;

//             // Limpiar el campo de contraseña por seguridad
//             inputPass.value = '';

//             // Opcional: Hacer focus en el input cuando el modal termine de abrirse
//             const modalEl = document.getElementById('loginReparticionModal');
//             modalEl.addEventListener('shown.bs.modal', () => {
//                 inputPass.focus();
//             }, { once: true }); // El {once: true} evita que se acumulen listeners
//         });
//     });
// }