
//GetVistaMateria()


GetAllEmpleados()


function GetAllEmpleados() {



    $.ajax({
        type: "GET",
        dataType: "json",
        url: "https://localhost:44325/api/Empleado/ListarTodo",
        success: function (data) {

            const tbody = document.getElementById("tbody1");

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
                                    </tr>`

                tbody.innerHTML += _tr;
            });


        },
        error: function (error) {

            console.log(error)
        }

    })

}



// function GetVistaMateria() {

//     $.ajax({
//         type: "GET",
//         dataType: "json",
//         url: "http://localhost:57490/api/Materias/ListarVista",
//         success: function (data) {
    
//             const tbody = document.getElementById("tbody3");

//             data.forEach(o => {
//                 let _tr = `<tr>
//                                 <td>${o.IdMateria}</td>
//                                 <td>${o.NombreMateria}</td>
//                                 <td>${o.Carrera}</td>
                                
//                             </tr>`

//                 tbody.innerHTML += _tr;
//             });


//         },
//         error: function (error) {

//             console.log(error)
//         }

//     })

// }