$(document).ready(function () {
    // Inicialización de datos
    GetAllEmpleados();
    GetVistaMateria();
    CargarComboCargos();
    CargarComboAreas();
    CargarComboBarrios();
    ComboEstadoEmpleado();

    // 🛡️ FORMATEADOR Y LIMITADOR DINÁMICO DE CUIL 
    $("#cuil").on("input", function () {
        // 1. Eliminamos cualquier caracter que NO sea un número
        let valor = $(this).val().replace(/\D/g, "");

        // 2. Limitamos a un máximo de 11 dígitos puros (el CUIL real tiene 11 números)
        if (valor.length > 11) {
            valor = valor.substr(0, 11);
        }

        // 3. Vamos armando la máscara con guiones dinámicos de forma automática
        let cuilFormateado = "";

        if (valor.length > 0) {
            // Primer bloque: XX
            cuilFormateado += valor.substr(0, 2);
        }
        if (valor.length > 2) {
            // Primer guión y segundo bloque: XX-XXXXXXXX
            cuilFormateado += "-" + valor.substr(2, 8);
        }
        if (valor.length > 10) {
            // Segundo guión y dígito verificador: XX-XXXXXXXX-X
            cuilFormateado += "-" + valor.substr(10, 1);
        }

        // 4. Devolvemos el valor formateado al input en tiempo real
        $(this).val(cuilFormateado);
    });

    // BUSCADOR UNIVERSAL (Corregido para ambas tablas)
    $("#inputBusqueda").on("keyup", function () {
        var value = $(this).val().toLowerCase();

        // Seleccionamos todos los tbody de la página para que filtre ambas tablas
        $("tbody tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });
});

const URL_BASE = "https://localhost:44325/api/Empleado";

// --- FUNCIONES DE LISTADO ---

function GetAllEmpleados() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: URL_BASE + "/ListarTodo",
        success: function (data) {
            const tbody = document.getElementById("tbody1");
            tbody.innerHTML = "";
            data.forEach(o => {
                let _tr = `<tr>               
                            <td>${o.Id}</td>
                            <td>${o.Apellido}</td>
                            <td>${o.Nombre}</td>
                            <td>${o.Cuil}</td>
                            <td>${o.Telefono}</td>
                            <td>${o.Email}</td>
                            <td>${o.Fecha_Ingreso}</td>
                            <td>${o.Id_Cargo}</td>
                            <td>${o.Id_Area}</td>
                            <td>${o.Id_Barrio}</td>
                            <td>${o.Id_Estado_Empleado}</td>
                           </tr>`;
                tbody.innerHTML += _tr;
            });
        },
        error: function (error) { console.log("Error en ListarTodo:", error); }
    });
}

function GetVistaMateria() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: URL_BASE + "/ListarVista",
        success: function (data) {
            const tbody = document.getElementById("tbody3");
            tbody.innerHTML = "";
            data.forEach(o => {
                let _tr = `<tr>
                            <td>${o.Id}</td>
                            <td>${o.Apellido}</td>
                            <td>${o.Nombre}</td>
                            <td>${o.Cuil}</td>
                            <td>${o.Telefono}</td>
                            <td>${o.Email}</td>
                            <td>${o.Fecha_Ingreso}</td>
                            <td>${o.Cargo}</td>
                            <td>${o.Area}</td>
                            <td>${o.Barrio}</td>
                            <td>${o.EstadoEmpleado}</td>
                           </tr>`;
                tbody.innerHTML += _tr;
            });
        },
        error: function (error) { console.log("Error en ListarVista:", error); }
    });
}

// --- FUNCIONES DE ACCIÓN (REGISTRAR / BUSCAR / MODIFICAR) ---

function RegistrarEmpleado(e) {
    if (e) e.preventDefault(); // Freno de emergencia al submit nativo

    const obj = {
        "Apellido": $("#apellido").val(),
        "Nombre": $("#nombre").val(),
        "Cuil": $("#cuil").val(),
        "Telefono": $("#telefono").val(),
        "Email": $("#email").val(),
        "Fecha_Ingreso": $("#fecha_ingreso").val(),
        "Id_Cargo": $("#id_cargo").val(),
        "Id_Area": $("#id_area").val(),
        "Id_Barrio": $("#id_barrio").val(),
        "Id_Estado_Empleado": $("#id_estado").val(),
        "Calle": $("#calle").val(),
        "Numero": $("#numero").val(),
        "Piso": $("#piso").val(),
        "Dpto": $("#dpto").val()
    };

    console.log("SITMAS - Enviando datos de nuevo empleado:", obj);

    $.ajax({
        type: "POST",
        url: URL_BASE + "/Insertar",
        data: JSON.stringify(obj),
        contentType: "application/json; charset=utf-8",
        success: function (response) {
            // Ahora que la memoria no se destruye, el cartel va a saltar impecable
            alert("✅ Empleado guardado con éxito");

            // Refrescamos las planillas en tiempo real sin parpadear la pantalla
            GetAllEmpleados();
            GetVistaMateria();

            // Limpiamos el formulario para una nueva carga limpia
            $("#collapseForm form")[0].reset();
        },
        error: function (err) {
            console.error("Error en RegistrarEmpleado:", err);
            alert("❌ Error al registrar empleado en el servidor");
        }
    });
}

function BuscarEmpleado() {
    const id = $("#BuscarIdEmpleado").val();
    if (!id) return alert("Ingrese un ID");

    $.ajax({
        type: "GET",
        url: URL_BASE + "/ListarPorId/" + id,
        success: function (data) {
            $("#apellido").val(data.Apellido);
            $("#nombre").val(data.Nombre);
            $("#cuil").val(data.Cuil);
            $("#telefono").val(data.Telefono);
            $("#email").val(data.Email);
            $("#fecha_ingreso").val(data.Fecha_Ingreso);
            $("#id_cargo").val(data.Id_Cargo);
            $("#id_area").val(data.Id_Area);
            $("#id_barrio").val(data.Id_Barrio);
            $("#id_estado").val(data.Id_Estado_Empleado);
            $("#calle").val(data.Calle);
            $("#numero").val(data.Numero);
            $("#piso").val(data.Piso);
            $("#dpto").val(data.Dpto);
        },
        error: function () { alert("Empleado no encontrado"); }
    });
}

function ModificarEmpleado() {
    const id = $("#BuscarIdEmpleado").val();
    if (!id) return alert("Primero busque un empleado por ID");

    const obj = {
        "Apellido": $("#apellido").val(),
        "Nombre": $("#nombre").val(),
        "Cuil": $("#cuil").val(),
        "Telefono": $("#telefono").val(),
        "Email": $("#email").val(),
        "Fecha_Ingreso": $("#fecha_ingreso").val(),
        "Id_Cargo": $("#id_cargo").val(),
        "Id_Area": $("#id_area").val(),
        "Id_Barrio": $("#id_barrio").val(),
        "Id_Estado_Empleado": $("#id_estado").val(),
        "Calle": $("#calle").val(),
        "Numero": $("#numero").val(),
        "Piso": $("#piso").val(),
        "Dpto": $("#dpto").val()
    };

    $.ajax({
        type: "PUT",
        url: URL_BASE + "/Modificar/" + id,
        data: JSON.stringify(obj),
        contentType: "application/json; charset=utf-8",
        success: function () {
            alert("Datos actualizados correctamente");
            location.reload();
        },
        error: function () { alert("Error al actualizar"); }
    });
}

// --- CARGA DE SELECTORES (COMBOS) ---

function CargarComboCargos() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/Cargo/ListarTodo",
        success: function (data) {
            let select = $("#id_cargo");
            select.empty().append('<option value="">Seleccione Cargo</option>');
            data.forEach(i => select.append(`<option value="${i.Id}">${i.Cargo}</option>`));
        }
    });
}

function CargarComboAreas() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/Area/ListarTodo",
        success: function (data) {
            let select = $("#id_area");
            select.empty().append('<option value="">Seleccione Área</option>');
            data.forEach(i => select.append(`<option value="${i.Id}">${i.Area}</option>`));
        }
    });
}

function CargarComboBarrios() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/Barrio/ListarTodo",
        success: function (data) {
            let select = $("#id_barrio");
            select.empty().append('<option value="">Seleccione Barrio</option>');
            data.forEach(i => select.append(`<option value="${i.Id}">${i.Barrio}</option>`));
        }
    });

    function CargarComboEstadoEmpleado() {
        $.ajax({
            type: "GET",
            url: "https://localhost:44325/api/EstadoEmpleado/ListarTodo",
            success: function (data) {
                let select = $("#id_estado");
                select.empty().append('<option value="">Seleccione Estado</option>');
                data.forEach(i => select.append(`<option value="${i.Id}">${i.EstadoEmpleado}</option>`));
            }
        });
    }

    }