/* ========================================================================
   SITMAS - Herramienta Transversal de Impresión de Reportes
   Archivo: Js/config/impresora_reportes.js
   ======================================================================== */

const ImpresoraReportesModulo = (function () {
    'use strict';

    // Guarda temporalmente los gráficos convertidos a imagen para restaurarlos luego
    let snapshotsActivos = [];

    /**
     * Recopila metadatos visibles de la pantalla (pestaña activa, usuario y filtros)
     * para armar un membrete profesional en la hoja impresa.
     */
    const actualizarMembreteImpresion = function () {
        const usuario = $('#header-user').text().trim() || 'Usuario SITMAS';
        const rol = $('#header-role').text().trim() || 'Operador';
        const pestanaActiva = $('.nav-tabs .nav-link.active').text().trim() || 'Reporte del Sistema';

        const ahora = new Date();
        const fechaEmision = ahora.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Capturamos automáticamente los valores de los filtros visibles (fechas y selects)
        const resumenFiltros = [];
        $('.tab-content-wrapper:visible input[type="date"]:visible').each(function () {
            const label = $(this).prev('label').text().replace(':', '').trim();
            const valor = $(this).val();
            if (valor) {
                const [y, m, d] = valor.split('-');
                resumenFiltros.push(`${label || 'Fecha'}: ${d}/${m}/${y}`);
            }
        });

        $('.tab-content-wrapper:visible select:visible').each(function () {
            const textoSeleccionado = $(this).find('option:selected').text().trim();
            if (textoSeleccionado) {
                resumenFiltros.push(textoSeleccionado);
            }
        });

        $('#print-titulo-reporte').text(pestanaActiva);
        $('#print-meta-usuario').text(`Emitido por: ${usuario} (${rol}) — ${fechaEmision} hs`);
        $('#print-meta-filtros').text(
            resumenFiltros.length > 0
                ? `Parámetros aplicados: ${resumenFiltros.join(' | ')}`
                : 'Vista consolidada actual'
        );
    };

    /**
     * Busca todos los contenedores de Apache ECharts visibles, obtiene su imagen HD
     * mediante getDataURL() y reemplaza temporalmente el canvas para que no se corte en A4.
     */
    const convertirGraficosAImagenes = function () {
        snapshotsActivos = [];

        if (typeof echarts === 'undefined') return;

        // Buscamos todos los divs dentro del área dinámica de reportes
        $('.tab-content-wrapper div').each(function () {
            const domElement = this;

            // Ignoramos contenedores ocultos con d-none
            if ($(domElement).hasClass('d-none') || !$(domElement).is(':visible')) {
                return;
            }

            const instanciaChart = echarts.getInstanceByDom(domElement);
            if (instanciaChart && !instanciaChart.isDisposed()) {
                try {
                    const dataUrl = instanciaChart.getDataURL({
                        type: 'png',
                        pixelRatio: 2, // Doble densidad para impresión nítida
                        backgroundColor: '#ffffff'
                    });

                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.className = 'snapshot-grafico-impresion';
                    img.alt = 'Gráfico del reporte';

                    // Ocultamos el div interactivo e insertamos la imagen HD justo después
                    $(domElement).hide();
                    domElement.parentNode.insertBefore(img, domElement.nextSibling);

                    snapshotsActivos.push({
                        contenedorOriginal: domElement,
                        imagenTemporal: img
                    });
                } catch (err) {
                    console.warn('No se pudo serializar un gráfico ECharts para impresión:', err);
                }
            }
        });
    };

    /**
     * Limpia las imágenes temporales y devuelve los gráficos interactivos a la pantalla.
     */
    const restaurarGraficosInteractivos = function () {
        snapshotsActivos.forEach(item => {
            if (item.imagenTemporal && item.imagenTemporal.parentNode) {
                item.imagenTemporal.parentNode.removeChild(item.imagenTemporal);
            }
            $(item.contenedorOriginal).show();

            const instanciaChart = echarts.getInstanceByDom(item.contenedorOriginal);
            if (instanciaChart && !instanciaChart.isDisposed()) {
                instanciaChart.resize();
            }
        });
        snapshotsActivos = [];
    };

    /**
     * Método principal disparado por el botón "Imprimir / PDF".
     */
    const imprimirReporteActual = function () {
        actualizarMembreteImpresion();
        convertirGraficosAImagenes();

        // Damos 150ms para asegurar que el navegador pinte las imágenes PNG en el DOM
        setTimeout(function () {
            window.print();
        }, 150);
    };

    // Escuchamos el evento nativo cuando el usuario cierra el diálogo de impresión
    window.addEventListener('afterprint', restaurarGraficosInteractivos);

    return {
        imprimir: imprimirReporteActual
    };
})();