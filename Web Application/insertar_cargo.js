function RegistrarCargo() {
    const cargoInput = document.getElementById("desc_cargo");

    if (cargoInput.value.trim() === "") {
        alert("Por favor, ingrese una descripción.");
        return;
    }

    // Cambiamos el envío a un formato de "Formulario" que la API suele preferir
    $.ajax({
        type: "POST",
        url: "https://localhost:44325/api/Cargo/Post",
        data: { "Cargo": cargoInput.value }, // Enviamos el objeto directo
        success: function (data) {
            // Si la API responde pero no guarda, a veces devuelve null
            console.log("Respuesta de la API:", data);
            alert("¡Proceso finalizado! Chequeá Swagger.");
            cargoInput.value = "";
            GetAllCargos();
        },
        error: function (err) {
            console.log("Error detallado:", err);
            alert("Error de conexión. ¿Tenés prendida la extensión de CORS?");
        }
    });
}