$(document).ready(function () {
    // Escuchamos cada vez que el usuario suelta una tecla en el buscador
    $("#inputBusqueda").on("keyup", function () {

        // Guardamos lo que escribió el usuario y lo pasamos a minúsculas
        var value = $(this).val().toLowerCase();

        // Accedemos a todas las filas (tr) del cuerpo de la tabla (tbody1)
        $("#tbody1 tr").filter(function () {

            // toggle() muestra u oculta la fila según el resultado
            // text().toLowerCase() toma todo el texto de la fila (todas las celdas juntas)
            // indexOf(value) > -1 verifica si lo que escribió el usuario existe en ese texto
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);

        });
    });
});