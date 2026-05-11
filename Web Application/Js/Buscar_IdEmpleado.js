function BuscarEmpleado() {
    
    const id = document.getElementById("BuscarIdEmpleado")

    getIdEmpleado(parseInt(id.value))
}



function getIdEmpleado(id) {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: "https://localhost:44325/api/Empleado/ListarPorId/" + id,
        success: function (data) {
            console.log(data)

            const Apellido = document.getElementById("apellido")
            const Nombre = document.getElementById("nombre")
            const CUIL = document.getElementById("cuil")
            const Telefono = document.getElementById("telefono")
            const Email = document.getElementById("email")
            const Fecha_Ingreso = document.getElementById("fecha_ingreso")
            const Id_Cargo = document.getElementById("id_cargo")
            const Id_Area = document.getElementById("id_area")
            const Id_Barrio = document.getElementById("id_barrio")
            const Id_Estado = document.getElementById("id_estado")
            const Calle = document.getElementById("calle")
            const Numero = document.getElementById("numero")
            const Piso = document.getElementById("piso")
            const Dpto = document.getElementById("dpto")
            

            Apellido.value = data.Apellido
            Nombre.value = data.Nombre
            CUIL.value = data.Cuil
            Telefono.value = data.Telefono
            Email.value = data.Email
            Fecha_Ingreso.value = data.Fecha_Ingreso
            Id_Cargo.value = data.Id_Cargo
            Id_Area.value = data.Id_Area
            Id_Barrio.value = data.Id_Barrio
            Id_Estado.value = data.Id_Estado_Empleado
            Calle.value = data.Calle
            Numero.value = data.Numero
            Piso.value = data.Piso
            Dpto.value = data.Dpto

        },
        error: function () {

        }
    })

}