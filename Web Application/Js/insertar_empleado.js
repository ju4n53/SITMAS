function RegistrarEmpleado() {

//     oEmpleado.Calle = value.Calle;
// oEmpleado.Numero = value.Numero;
// oEmpleado.Piso = value.Piso;
// oEmpleado.Dpto = value.Dpto;
    const Apellido = document.getElementById("apellido");
    const Nombre = document.getElementById("nombre");
    const Cuil = document.getElementById("cuil");
    const Telefono = document.getElementById("telefono");
    const Email = document.getElementById("email");
    const Fecha_Ingreso = document.getElementById("fecha_ingreso");
    const Id_Cargo = document.getElementById("id_cargo");
    const Id_Area = document.getElementById("id_area");
    const Id_Barrio = document.getElementById("id_barrio");
    const Id_Estado = document.getElementById("id_estado");
    const Calle = document.getElementById("calle");
    const Numero = document.getElementById("numero");
    const Piso = document.getElementById("piso");
    const Dpto = document.getElementById("dpto");


    obj = {
        "Apellido": Apellido.value,
        "Nombre": Nombre.value,
        "Cuil": Cuil.value,
        "Telefono": Telefono.value,
        "Email": Email.value,
        "Fecha_Ingreso": Fecha_Ingreso.value,
        "Id_Cargo": Id_Cargo.value,
        "Id_Area": Id_Area.value,
        "Id_Barrio": Id_Barrio.value,
        "Id_Estado_Empleado": Id_Estado.value,
        "Calle": Calle.value,
        "Numero": Numero.value,
        "Piso": Piso.value,
        "Dpto": Dpto.value
    }

    postEmpleado(obj)

}

function postEmpleado(obj) {

    $.ajax({
        type: "POST",
        dataType: "json",
        data: obj,
        url: "https://localhost:44325/api/Empleado/Insertar",
        success: function (data) {
            alert("Proceso Exitos...!!!")
        }
    })

}