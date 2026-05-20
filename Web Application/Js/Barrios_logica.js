$(document).ready(function () {
    GetAllBarrios();

    // Filtro universal para las tablas de barrios
    $("#inputBusqueda").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("tbody tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });
});

const URL_API_BARRIO = "https://localhost:44325/api/Barrio";

function GetAllBarrios() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: URL_API_BARRIO + "/ListarTodo",
        success: function (data) {
            const tbody = document.getElementById("tbody_barrios");
            tbody.innerHTML = ""; 
            data.forEach(o => {
                let _tr = `<tr>               
                            <td>${o.Id}</td>
                            <td>${o.Barrio}</td> 
                           </tr>`;
                tbody.innerHTML += _tr;
            });
        },
        error: function (error) {
            console.log("Error al listar barrios:", error);
        }
    });
}

function RegistrarBarrio() {
    const barrioInput = $("#desc_barrio");
    const valor = barrioInput.val().trim();

    if (valor === "") {
        alert("Por favor, ingrese el nombre del barrio.");
        return;
    }

    const objetoData = {
        "Barrio": valor
    };

    $.ajax({
        type: "POST",
        url: URL_API_BARRIO + "/Post", // Aquí usa /Post porque tu método en C# se llama Post
        data: JSON.stringify(objetoData),
        contentType: "application/json; charset=utf-8",
        success: function () {
            alert("¡Barrio registrado con éxito!");
            barrioInput.val("");
            GetAllBarrios();
        },
        error: function (err) {
            // Manejo de respuesta vacía (void) de .NET
            if (err.status === 200 || err.status === 204) {
                alert("¡Barrio registrado con éxito!");
                barrioInput.val("");
                GetAllBarrios();
            } else {
                alert("Error al registrar barrio. Asegúrate de que el método Post en C# esté implementado.");
            }
        }
    });
}