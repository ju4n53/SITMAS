$(document).ready(function () {
    console.log("Iniciando carga de selectores...");
    CargarComboCargos();
    CargarComboAreas();
    CargarComboBarrios();
});

function CargarComboCargos() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/Cargo/ListarTodo",
        success: function (data) {
            let select = $("#id_cargo");
            select.empty();
            select.append('<option value="">Seleccione un Cargo</option>');

            data.forEach(item => {
                // Usamos item.Id para el valor y item.Cargo para el texto
                select.append(`<option value="${item.Id}">${item.Cargo}</option>`);
            });
            console.log("Cargos cargados OK");
        },
        error: function (err) {
            console.error("Error cargando cargos", err);
        }
    });
}

function CargarComboAreas() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/Area/ListarTodo",
        success: function (data) {
            let select = $("#id_area");
            select.empty();
            select.append('<option value="">Seleccione un Área</option>');

            data.forEach(item => {
                select.append(`<option value="${item.Id}">${item.Area}</option>`);
            });
            console.log("Areas cargadas OK");
        },
        error: function (err) {
            console.error("Error cargando Áreas", err);
        }
    });
}

function CargarComboBarrios() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/Barrio/ListarTodo",
        success: function (data) {
            let select = $("#id_barrio");
            select.empty();
            select.append('<option value="">Seleccione un Barrio</option>');

            data.forEach(item => {
                select.append(`<option value="${item.Id}">${item.Barrio}</option>`);
            });
            console.log("Barrios cargados con Éxito");
        },
        error: function (err) {
            console.error("Error cargando barrios", err);
            $("#id_barrio").empty().append('<option value="">Error al cargar barrios</option>');
        }
    });
}