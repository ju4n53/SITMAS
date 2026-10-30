/* ==========================================================================
   SITMAS - Módulo Centralizado de Alertas Visuales (SweetAlert2)
   ========================================================================== */

function mostrarAlerta(mensaje, tipo = "info", titulo = "") {
    let iconType = "info";
    let defaultTitle = "Aviso";

    switch (tipo) {
        case "success":
            iconType = "success";
            defaultTitle = "¡Operación Exitosa!";
            break;
        case "danger":
        case "error":
            iconType = "error";
            defaultTitle = "¡Atención!";
            break;
        case "warning":
            iconType = "warning";
            defaultTitle = "Dato Requerido";
            break;
        case "info":
            iconType = "info";
            defaultTitle = "Información";
            break;
    }

    // Limpiamos emojis del mensaje si venían en la cadena
    const mensajeLimpio = mensaje.replace(/[✅❌⚠️📍]/g, '').trim();

    Swal.fire({
        title: titulo || defaultTitle,
        text: mensajeLimpio,
        icon: iconType,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#78BE20", // Verde BioCórdoba
        customClass: {
            popup: 'sitmas-modal-popup',
            confirmButton: 'btn btn-sitmas-success px-4'
        },
        buttonsStyling: false
    });
}

/**
 * Confirmación modal previa a acciones destructivas (DELETE)
 */
function confirmarAccion(titulo, texto, funcionConfirmar) {
    Swal.fire({
        title: titulo,
        text: texto,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        customClass: {
            confirmButton: 'btn btn-danger me-2',
            cancelButton: 'btn btn-secondary'
        },
        buttonsStyling: false
    }).then((result) => {
        if (result.isConfirmed) {
            funcionConfirmar();
        }
    });
}