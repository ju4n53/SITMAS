$(document).ready(function () {
    GetAllCargos();

    // Filtro universal para todas las tablas de la página
    $("#inputBusqueda").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        // Esto filtrará las filas de CUALQUIER tbody que existan (tbody_cargos, etc.)
        $("tbody tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });
});

const URL_API_CARGO = "https://localhost:44325/api/Cargo";

function GetAllCargos() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: URL_API_CARGO + "/ListarTodo",
        success: function (data) {
            const tbody = document.getElementById("tbody_cargos");
            tbody.innerHTML = ""; 
            data.forEach(o => {
                let _tr = `<tr>               
                            <td>${o.Id}</td>
                            <td>${o.Cargo}</td> 
                           </tr>`;
                tbody.innerHTML += _tr;
            });
        },
        error: function (error) {
            console.log("Error al listar cargos:", error);
        }
    });
}

function RegistrarCargo() {
    const cargoInput = $("#desc_cargo");
    const valor = cargoInput.val().trim();

    if (valor === "") {
        alert("Por favor, ingrese una descripción.");
        return;
    }

    // El objeto debe tener la propiedad "Cargo" (con C mayúscula) 
    // porque tu modelo en C# se llama "Cargos" y tiene esa propiedad.
    const objetoData = {
        "Cargo": valor
    };

    $.ajax({
        type: "POST",
        // CAMBIO CLAVE: La URL debe terminar en /Insertar (el nombre de tu función en C#)
        url: "https://localhost:44325/api/Cargo/Insertar", 
        data: JSON.stringify(objetoData),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            alert("¡Cargo registrado con éxito!");
            cargoInput.val("");
            GetAllCargos(); // Refresca la tabla
        },
        error: function (err) {
            // Si el éxito es total pero la función en C# es 'void', 
            // a veces cae en el error con status 204 o 200.
            if (err.status === 200 || err.status === 204) {
                alert("¡Cargo registrado con éxito!");
                cargoInput.val("");
                GetAllCargos();
            } else {
                console.error("Error detallado:", err);
                alert("Error al registrar: " + err.statusText);
            }
        }
    });
}