/* ==========================================================================
   SITMAS - Módulo de Consumo de Combustible (Lógica de Cliente)
   ========================================================================== */

$(document).ready(function () {
    const API_URL_COMBUSTIBLE = 'https://localhost:44325/api/combustible';
    const API_URL_CONSUMO = 'https://localhost:44325/api/consumocombustible';

    let listaCombustiblesMemoria = [];
    let listaConsumosMemoria = [];

    // Carga inicial paralela con Promise.all
    InicializarModulo();

    function InicializarModulo() {
        Promise.all([
            CargarComboCombustibles(),
            ObtenerHistorialConsumos()
        ]).catch(error => {
            mostrarAlerta('Ocurrió un error al cargar la información inicial del módulo.', 'danger');
            console.error('Error inicialización:', error);
        });
    }

    // ============================================================================
    // 1. CARGA DE CATÁLOGO / COMBO DE COMBUSTIBLES
    // ============================================================================
    function CargarComboCombustibles() {
        return $.ajax({
            url: API_URL_COMBUSTIBLE,
            type: 'GET',
            dataType: 'json'
        }).done(function (data) {
            listaCombustiblesMemoria = data;
            const $cmb =$('#cmbTipoCombustible');
            $cmb.empty().append('<option value="">Seleccione un tipo de combustible...</option>');

            data.forEach(c => {
                $cmb.append(`<option value="${c.Id_Combustible}">${c.Tipo_combustible} ($${c.Precio_valor.toFixed(2)})</option>`);
            });
        });
    }

    // Al seleccionar una opción del combo, cargamos los datos en el formulario
    $('#cmbTipoCombustible').on('change', function () {
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

    // ============================================================================
    // 2. ACTUALIZACIÓN DE PRECIO (PUT)
    // ============================================================================
    $('#formActualizarPrecio').on('submit', function (e) {
        e.preventDefault();

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
            // Usamos la función global centralizada para notificar el éxito
            mostrarAlerta(res.Mensaje || 'Precio actualizado correctamente.', 'success');
            ResetearFormularioPrecio();
            InicializarModulo(); // Refresco reactivo sin recargar F5
        }).fail(function (xhr) {
            const mensajeError = xhr.responseJSON ? xhr.responseJSON : 'No se pudo completar la actualización.';
            mostrarAlerta(mensajeError, 'danger');
        });
    });

    function ResetearFormularioPrecio() {
        $('#hdnIdCombustible').val('0');
        $('#cmbTipoCombustible').val('');
        $('#txtPrecioValor').val('');
    }

    $('#btnCancelarPrecio').on('click', function () {
        ResetearFormularioPrecio();
    });

    // ============================================================================
    // 3. GRILLA DE CONSUMOS (LECTURA Y BÚSQUEDA)
    // ============================================================================
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
        const $tbody =$('#tbodyConsumos');
        $tbody.empty();

        if (lista.length === 0) {
            $tbody.append('<tr><td colspan="7" class="text-center text-muted py-4">No hay registros de consumo cargados.</td></tr>');
            return;
        }

        lista.forEach(item => {
            $tbody.append(`
                <tr>
                    <td><strong>#${item.Id_Consumo}</strong></td>
                    <td>#${item.IdRegistroodomet}</td>
                    <td><span class="badge bg-secondary fs-6">${item.Patente}</span></td>
                    <td>${item.Tipo_combustible}</td>
                    <td>$${item.PrecioUnitarioAplicado.toFixed(2)}</td>
                    <td>${item.KilometrosRecorridos.toFixed(2)} km</td>
                    <td class="text-end text-success fw-bold fs-6">$${item.CostoTotalCalculado.toFixed(2)}</td>
                </tr>
            `);
        });
    }

    // Buscador en tiempo real por evento keyup
    $('#inputBusquedaConsumo').on('keyup', function () {
        const valor = $(this).val().toLowerCase().trim();
        const filtrados = listaConsumosMemoria.filter(c =>
            c.Patente.toLowerCase().includes(valor) ||
            c.Tipo_combustible.toLowerCase().includes(valor)
        );
        RenderizarTablaConsumos(filtrados);
    });

    $('#btnRefrescar').on('click', function () {
        InicializarModulo();
    });
});