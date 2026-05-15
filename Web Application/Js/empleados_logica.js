$(document).ready(function () {
    // Inicialización de datos
    GetAllEmpleados();
    GetVistaMateria();
    CargarComboCargos();
    CargarComboAreas();
    CargarComboBarrios();

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

function RegistrarEmpleado() {
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
        type: "POST",
        url: URL_BASE + "/Post",
        data: JSON.stringify(obj),
        contentType: "application/json; charset=utf-8",
        success: function () {
            alert("Empleado guardado con éxito");
            location.reload(); // Recarga para ver cambios
        },
        error: function (err) { alert("Error al registrar empleado"); }
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
        url: URL_BASE + "/Put/" + id,
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
}