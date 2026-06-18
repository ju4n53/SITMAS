/* ==========================================================
   SITMAS - Interceptor Global de Alerts para Estilizado Heredado
   ========================================================== */

// Guardamos una copia del alert nativo por si alguna vez la necesitamos
const alertNativo = window.alert;

// Sobrescribimos la función global alert
window.alert = function (mensaje) {
    let tipoIcono = 'info'; // Por defecto
    let mensajeLimpio = mensaje;
    let titulo = 'SITMAS - Notificación';

    // Clasificación dinámica según los caracteres que ya usás en tu lógica JS
    if (mensaje.includes('✅') || mensaje.toLowerCase().includes('éxito') || mensaje.toLowerCase().includes('correctamente')) {
        tipoIcono = 'success';
        titulo = 'Operación Exitosa';
        mensajeLimpio = mensaje.replace('✅', '').trim();
    } else if (mensaje.includes('❌') || mensaje.toLowerCase().includes('error') || mensaje.toLowerCase().includes('no encontrado')) {
        tipoIcono = 'error';
        titulo = 'Atención';
        mensajeLimpio = mensaje.replace('❌', '').trim();
    } else if (mensaje.toLowerCase().includes('ingrese') || mensaje.toLowerCase().includes('primero')) {
        tipoIcono = 'warning';
        titulo = 'Dato Requerido';
    }

    // Disparamos el modal estético heredando los colores de la paleta EMEC/BioCórdoba
    Swal.fire({
        title: titulo,
        text: mensajeLimpio,
        icon: tipoIcono,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#78BE20', // Tu variable var(--verde-bio)
        background: '#ffffff',
        borderRadius: '12px',
        customClass: {
            popup: 'sitmas-alert-popup',
            title: 'sitmas-alert-title',
            confirmButton: 'btn-sitmas-success px-4 py-2' // Hereda directamente tus estilos de botones
        },
        showClass: {
            popup: 'animate__animated animate__fadeInUp animate__faster' // Animación sutil de entrada
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutDown animate__faster'
        }
    });
};