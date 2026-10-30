/* ==========================================================================
   SITMAS - Cargador Dinámico de Google Maps API
   ========================================================================== */

// 1. Clave de API centralizada
const GOOGLE_MAPS_API_KEY = "AIzaSyBe7Wm5puoI09mbnI6gBOrheoV0yeJVHds"; 

/**
 * Carga el script de Google Maps en el DOM de forma asíncrona
 * @param {Function} callback -
 */
function CargarGoogleMapsSDK(callback) {
    // API cargada, ejecución de callback
    if (typeof google !== 'undefined' && google.maps) {
        if (callback) callback();
        return;
    }

    //<script> dinámico
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
        if (callback) callback();
    };

    script.onerror = () => {
        console.error("SITMAS - Error al cargar la API de Google Maps.");
    };

    document.head.appendChild(script);
}