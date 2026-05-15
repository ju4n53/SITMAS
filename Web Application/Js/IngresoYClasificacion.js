//MOCK Informes

async function cargarInformes() {
    const tbody = document.getElementById('body-informes');
    const urlApi = 'aun_no_hay_url'; // Tu futura URL

    // 1. Mostrar estado de carga
    tbody.innerHTML = '<tr><td colspan="12" class="text-center">Conectando con el servidor...</td></tr>';

    try {
        // 2. Intento de Fetch Real
        // Cambia esto cuando la API esté lista. Por ahora, el "await" fallará si la URL no existe.
        const response = await fetch(urlApi);

        if (!response.ok) throw new Error("Error en la respuesta de red");

        const informes = await response.json();
        console.log("Datos recibidos de la API:", informes);
        renderizarTabla(informes);

    } catch (error) {
        // 3. Plan B: Si el Fetch falla, usamos los datos simulados
        console.warn("API no disponible, usando datos de respaldo. Motivo:", error.message);

        const datosRespaldo = [
            {
                idIngreso: 1025,
                fecha: "2026-05-07",
                origen: "Zona Norte - Municipal",
                chofer: "Carlos Rodriguez",
                vehiculo: "Scania - Placa AF-550",
                categoria: "Papel/Cartón",
                subtipo: "Corrugado",
                pesoBruto: 2100.80,
                pesoTotal: 1950.00,
                condicion: "Seco",
                destino: "Planta de Reciclado B",
                clasificador: "Facundo"
            },
            {
                idIngreso: 1026,
                fecha: "2026-05-07",
                origen: "Centro Comercial Olmos",
                chofer: "Marcos Gomez",
                vehiculo: "Mercedes Benz - AD-220",
                categoria: "Plásticos",
                subtipo: "PEAD",
                pesoBruto: 850.00,
                pesoTotal: 820.50,
                condicion: "Limpio",
                destino: "Depósito Central",
                clasificador: "Laura Martínez"
            }
        ];

        // Pequeño delay para que se note el efecto de "carga"
        setTimeout(() => {
            renderizarTabla(datosRespaldo);
        }, 500);
    }
}

//Funciones de GET a tablas maestras


async function obtenerOrigen() {
    const url = 'https://localhost:44325/api/Origen/ListarTodo';

    try {
        const data = await $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            crossDomain: true // Le indicamos a jQuery que es una petición cruzada
        });

        let cadena = data.map(r => r.NombreRol).join(', ');
        console.log("Origenes obtenidos:", cadena);
        return data;
    } catch (error) {
        console.error("Sigue el error de CORS o conexión:", error);
    }
}

//Funciones que llenan SELECTS

async function cargarComboOrigen() {
    const origenes = await obtenerOrigenes(); // Tu función que ya funciona

    const $select = $('#id-origen');
    $select.empty();
    $select.append('<option value="">Seleccione un Origen...</option>');

    origenes.forEach(origen => {
        $select.append(`<option value="${origen.Id}">${origen.EmpresaInstitucion}</option>`);
    });
}

//RENDERIZAR TABLA DE INFORMES

// Función auxiliar para no repetir código de renderizado
function renderizarTabla(lista) {
    const tbody = document.getElementById('body-informes');
    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="text-center">No hay registros disponibles</td></tr>';
        return;
    }

    lista.forEach(inf => {
        // Validación de tipos básica: si el peso llega como String, lo convertimos para formatearlo
        const pBruto = typeof inf.pesoBruto === 'number' ? inf.pesoBruto.toFixed(2) : inf.pesoBruto;
        const pTotal = typeof inf.pesoTotal === 'number' ? inf.pesoTotal.toFixed(2) : inf.pesoTotal;

        const fila = `
            <tr>
                <td><span class="badge bg-secondary">${inf.idIngreso}</span></td>
                <td>${inf.fecha}</td>
                <td>${inf.origen}</td>
                <td>${inf.chofer}</td>
                <td><small>${inf.vehiculo}</small></td>
                <td>${inf.categoria}</td>
                <td>${inf.subtipo}</td>
                <td>${pBruto} kg</td>
                <td class="fw-bold text-primary">${pTotal} kg</td>
                <td>
                    <span class="badge ${inf.condicion === 'Limpio' || inf.condicion === 'Seco' ? 'bg-success' : 'bg-warning'}">
                        ${inf.condicion}
                    </span>
                </td>
                <td>${inf.destino}</td>
                <td>${inf.clasificador}</td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}


//Funciones POST

async function enviarIngresoMaterial(event) { //Aun es MOCK
    event.preventDefault();

    const datosEnvio = {
        idUsuarioRegistro: parseInt(document.getElementById('select-usuario').value),
        idOrigen: parseInt(document.getElementById('select-origen').value),
        idVehiculoIngreso: parseInt(document.getElementById('select-vehiculo').value),
        idIngresoMaterial: parseInt(document.getElementById('select-material').value),
        idSubtipoMaterial: parseInt(document.getElementById('select-subtipo').value),

        // Datos de texto y números de los inputs
        idCamioneroIngreso: document.getElementById('input-chofer').value.trim(),
        PesoBruto: parseFloat(document.getElementById('input-peso').value),
        Observaciones: document.getElementById('textarea-obs').value.trim(),

    };

    // Validación básica antes de enviar
    if (isNaN(datosEnvio.idIngresoMaterial) || isNaN(datosEnvio.PesoBruto)) {
        alert("Por favor, complete los campos obligatorios y asegúrese de que el peso sea un número.");
        return;
    }

    console.log("Enviando objeto al servidor:", datosEnvio);

    try {
        // 2. Ejecución del Fetch POST
        const response = await fetch('https://api.ecogestion.cba/v1/ingresos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosEnvio)
        });

        if (response.ok) {
            const resultado = await response.json();
            alert("¡Ingreso registrado con éxito!");
            document.getElementById('form-materiales').reset(); // Limpia el formulario
            showPag(1); // Opcional: vuelve a la primera solapa
        } else {
            throw new Error("Error en la respuesta del servidor");
        }

    } catch (error) {
        // 3. Plan B: Simulación de éxito si la API no existe aún
        console.error("Error real:", error);
        alert("Simulación: Datos enviados correctamente (La API real aún no está activa).\n\nObjeto enviado: " + JSON.stringify(datosEnvio, null, 2));
    }
}