$(document).ready(function () {
    GetAllCargos();
});

function GetAllCargos() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: "https://localhost:44325/api/Cargo/ListarTodo",
        success: function (data) {
            const tbody = document.getElementById("tbody_cargos");
            tbody.innerHTML = ""; // Limpia la tabla antes de cargar
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