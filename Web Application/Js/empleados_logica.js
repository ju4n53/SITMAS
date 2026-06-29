$(document).ready(function () {
    // Inicialización de datos
    GetAllEmpleados();
    GetVistaMateria();
    CargarComboCargos();
    CargarComboAreas();
    CargarComboBarrios();
    CargarComboEstadoEmpleado(); // Corregido el nombre de la función

    // 1. 🛡️ FORMATEADOR Y LIMITADOR DINÁMICO DE CUIL (Corregido y optimizado)
    $("#cuil").on("input", function () {
        let valor = $(this).val().replace(/\D/g, "").substr(0, 11);
        let formateado = "";

        if (valor.length > 0) formateado += valor.substr(0, 2);
        if (valor.length > 2) formateado += "-" + valor.substr(2, 8);
        if (valor.length > 10) formateado += "-" + valor.substr(10, 1);

        $(this).val(formateado);
    });

    $("#cuil").on("blur", function () {
        const $this = $(this);
        let cuilLimpio = $this.val().replace(/-/g, ""); // Quitamos los guiones para validar

        // Si el usuario no escribió nada, salimos sin hacer nada (evita bucles molestos)
        if (cuilLimpio.length === 0) return;

        // Variable de control para saber si pasó los filtros
        let esValido = true;

        // 1. Validación de estructura básica (11 dígitos numéricos)
        if (cuilLimpio.length !== 11 || !/^\d+$/.test(cuilLimpio)) {
            esValido = false;
        } else {
            // 2. Validación de prefijos oficiales de Argentina
            const prefijosValidos = ["20", "23", "24", "27", "30", "33", "34"];
            let prefijo = cuilLimpio.substring(0, 2);

            if (!prefijosValidos.includes(prefijo)) {
                esValido = false;
            } else {
                // 3. Algoritmo de Verificación Módulo 11 (Oficial AFIP / ARCA)
                const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
                let suma = 0;

                for (let i = 0; i < 10; i++) {
                    suma += parseInt(cuilLimpio[i]) * factores[i];
                }

                let resto = suma % 11;
                let digitoVerificadorCalculado = 11 - resto;

                if (digitoVerificadorCalculado === 11) {
                    digitoVerificadorCalculado = 0;
                } else if (digitoVerificadorCalculado === 10) {
                    digitoVerificadorCalculado = 9; // Ajuste especial de AFIP
                }

                let digitoVerificadorReal = parseInt(cuilLimpio[10]);

                // Verificar si el dígito final coincide
                if (digitoVerificadorCalculado !== digitoVerificadorReal) {
                    esValido = false;
                }
            }
        }

        // 4. Si falló cualquiera de las reglas, ejecutamos el bloqueo y limpieza
        if (!esValido) {
            alert("⚠ El número de CUIL ingresado es inválido según los registros de ARCA/AFIP. Verifique los dígitos.");
            $this.val(""); // Limpieza absoluta del campo

            setTimeout(() => {
                $this.focus(); // Retorna el cursor al campo para obligar a corregir
            }, 0);
        }
    });

    // 2. 🔤 SOLO LETRAS (Nombre y Apellido)
    // Permite letras, espacios, acentos y la Ñ. Borra números y símbolos al instante.
    $("#nombre, #apellido").on("input", function () {
        let valor = $(this).val().replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
        $(this).val(valor);
    });

    // 3. 📞 TELÉFONO (Formato Celular Argentina: Cód. Área + Número)
    // Borra todo lo que no sea número y formatea dinámicamente (Ej: 351-1234567)
    $("#telefono").on("input", function () {
        let valor = $(this).val().replace(/\D/g, "").substr(0, 11);
        let formateado = "";

        if (valor.length > 0) {
            // Si empieza con 0, se lo quitamos para estandarizar
            if (valor.startsWith("0")) {
                valor = valor.substring(1);
            }

            // Si el código de área es de 3 dígitos (ej: 351, 261, 381)
            if (valor.length <= 3) {
                formateado = valor;
            } else {
                formateado = valor.substr(0, 3) + "-" + valor.substr(3);
            }
        }
        $(this).val(formateado);
    });

    // 4. 📅 FECHA DE INGRESO (Deshabilitar y controlar fechas futuras)
    // Setea el atributo 'max' nativo al día de hoy para que el calendario no permita elegir el futuro
    const hoy = new Date().toISOString().split("T")[0];
    $("#fecha_ingreso").attr("max", hoy);

    // Por si lo escriben manualmente, lo limpiamos en el input
    $("#fecha_ingreso").on("input", function () {
        if ($(this).val() > hoy) {
            $(this).val(hoy); // Resetea al día de hoy si se pasan
        }
    });

    // 5. 🏠 VALIDACIONES DE DIRECCIÓN (Calle, Número, Piso, Dpto)
    // Calle: Permite letras, números, espacios, puntos y comas (Ej: Av. Colón 200 o 9 de Julio)
    $("#calle").on("input", function () {
        let valor = $(this).val().replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.,]/g, "");
        $(this).val(valor);
    });

    // Número y Piso: Solo números estrictos y limita a los máximos requeridos
    $("#numero").on("input", function () {
        let valor = $(this).val().replace(/\D/g, "").substr(0, 5);
        $(this).val(valor);
    });

    $("#piso").on("input", function () {
        let valor = $(this).val().replace(/\D/g, "");
        if (parseInt(valor) > 99) {
            valor = valor.substr(0, 2); // Evita que pongan más de 99
        }
        $(this).val(valor.substr(0, 3));
    });

    // Dpto: Letras y números (Ej: 3B o piso 12 "A"), sin caracteres raros, máx 3 caracteres
    $("#dpto").on("input", function () {
        let valor = $(this).val().replace(/[^a-zA-Z0-9\s]/g, "").substr(0, 3);
        $(this).val(valor);
    });

    // 📧 6. VALIDACIÓN DE EMAIL (Se ejecuta al salir del campo o al intentar enviar)
    $("#email").on("blur", function () {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const valor = $(this).val();

        if (valor.length > 0 && !emailRegex.test(valor)) {
            alert("⚠ El formato del correo electrónico no es válido (Ej: juan.perez@email.com).");

            // CORREGIDO: Así se limpia un input en jQuery
            $(this).val("");

            // Optimización para asegurar que el cursor vuelva al campo
            setTimeout(() => {
                $(this).focus();
            }, 0);
        }
    });

    // BUSCADOR UNIVERSAL
    $("#inputBusqueda").on("keyup", function () {
        var value = $(this).val().toLowerCase();
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

function RegistrarEmpleado(e) {
    if (e) e.preventDefault(); // Freno de emergencia al submit nativo

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

    console.log("SITMAS - Enviando datos de nuevo empleado:", obj);

    $.ajax({
        type: "POST",
        url: URL_BASE + "/Insertar",
        data: JSON.stringify(obj),
        contentType: "application/json; charset=utf-8",
        success: function (response) {
            // Ahora que la memoria no se destruye, el cartel va a saltar impecable
            alert("✅ Empleado guardado con éxito");

            // Refrescamos las planillas en tiempo real sin parpadear la pantalla
            GetAllEmpleados();
            GetVistaMateria();

            // Limpiamos el formulario para una nueva carga limpia
            $("#collapseForm form")[0].reset();
        },
        error: function (err) {
            console.error("Error en RegistrarEmpleado:", err);
            alert("❌ Error al registrar empleado en el servidor");
        }
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
        url: URL_BASE + "/Modificar/" + id,
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

function CargarComboEstadoEmpleado() {
    $.ajax({
        type: "GET",
        url: "https://localhost:44325/api/EstadoEmpleado/ListarTodo",
        success: function (data) {
            let select = $("#id_estado");
            select.empty().append('<option value="">Seleccione Estado</option>');
            data.forEach(i => select.append(`<option value="${i.Id}">${i.EstadoEmpleado}</option>`));
        }
    });
}

































// $(document).ready(function () {
//     // Inicialización de datos
//     GetAllEmpleados();
//     GetVistaMateria();
//     CargarComboCargos();
//     CargarComboAreas();
//     CargarComboBarrios();
//     CargarComboEstadoEmpleado();

//     // 🛡️ FORMATEADOR Y LIMITADOR DINÁMICO DE CUIL 
//     $("#cuil").on("input", function () {
//         // 1. Eliminamos cualquier caracter que NO sea un número
//         let valor = $(this).val().replace(/\D/g, "");

//         // 2. Limitamos a un máximo de 11 dígitos puros (el CUIL real tiene 11 números)
//         if (valor.length > 11) {
//             valor = valor.substr(0, 11);
//         }

//         // 3. Vamos armando la máscara con guiones dinámicos de forma automática
//         let cuilFormateado = "";

//         if (valor.length > 0) {
//             // Primer bloque: XX
//             cuilFormateado += valor.substr(0, 2);
//         }
//         if (valor.length > 2) {
//             // Primer guión y segundo bloque: XX-XXXXXXXX
//             cuilFormateado += "-" + valor.substr(2, 8);
//         }
//         if (valor.length > 10) {
//             // Segundo guión y dígito verificador: XX-XXXXXXXX-X
//             cuilFormateado += "-" + valor.substr(10, 1);
//         }

//         // 4. Devolvemos el valor formateado al input en tiempo real
//         $(this).val(cuilFormateado);
//     });

//     // BUSCADOR UNIVERSAL (Corregido para ambas tablas)
//     $("#inputBusqueda").on("keyup", function () {
//         var value = $(this).val().toLowerCase();

//         // Seleccionamos todos los tbody de la página para que filtre ambas tablas
//         $("tbody tr").filter(function () {
//             $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
//         });
//     });
// });

// const URL_BASE = "https://localhost:44325/api/Empleado";

// // --- FUNCIONES DE LISTADO ---

// function GetAllEmpleados() {
//     $.ajax({
//         type: "GET",
//         dataType: "json",
//         url: URL_BASE + "/ListarTodo",
//         success: function (data) {
//             const tbody = document.getElementById("tbody1");
//             tbody.innerHTML = "";
//             data.forEach(o => {
//                 let _tr = `<tr>               
//                             <td>${o.Id}</td>
//                             <td>${o.Apellido}</td>
//                             <td>${o.Nombre}</td>
//                             <td>${o.Cuil}</td>
//                             <td>${o.Telefono}</td>
//                             <td>${o.Email}</td>
//                             <td>${o.Fecha_Ingreso}</td>
//                             <td>${o.Id_Cargo}</td>
//                             <td>${o.Id_Area}</td>
//                             <td>${o.Id_Barrio}</td>
//                             <td>${o.Id_Estado_Empleado}</td>
//                            </tr>`;
//                 tbody.innerHTML += _tr;
//             });
//         },
//         error: function (error) { console.log("Error en ListarTodo:", error); }
//     });
// }

// function GetVistaMateria() {
//     $.ajax({
//         type: "GET",
//         dataType: "json",
//         url: URL_BASE + "/ListarVista",
//         success: function (data) {
//             const tbody = document.getElementById("tbody3");
//             tbody.innerHTML = "";
//             data.forEach(o => {
//                 let _tr = `<tr>
//                             <td>${o.Id}</td>
//                             <td>${o.Apellido}</td>
//                             <td>${o.Nombre}</td>
//                             <td>${o.Cuil}</td>
//                             <td>${o.Telefono}</td>
//                             <td>${o.Email}</td>
//                             <td>${o.Fecha_Ingreso}</td>
//                             <td>${o.Cargo}</td>
//                             <td>${o.Area}</td>
//                             <td>${o.Barrio}</td>
//                             <td>${o.EstadoEmpleado}</td>
//                            </tr>`;
//                 tbody.innerHTML += _tr;
//             });
//         },
//         error: function (error) { console.log("Error en ListarVista:", error); }
//     });
// }

// // --- FUNCIONES DE ACCIÓN (REGISTRAR / BUSCAR / MODIFICAR) ---

// function RegistrarEmpleado(e) {
//     if (e) e.preventDefault(); // Freno de emergencia al submit nativo

//     const obj = {
//         "Apellido": $("#apellido").val(),
//         "Nombre": $("#nombre").val(),
//         "Cuil": $("#cuil").val(),
//         "Telefono": $("#telefono").val(),
//         "Email": $("#email").val(),
//         "Fecha_Ingreso": $("#fecha_ingreso").val(),
//         "Id_Cargo": $("#id_cargo").val(),
//         "Id_Area": $("#id_area").val(),
//         "Id_Barrio": $("#id_barrio").val(),
//         "Id_Estado_Empleado": $("#id_estado").val(),
//         "Calle": $("#calle").val(),
//         "Numero": $("#numero").val(),
//         "Piso": $("#piso").val(),
//         "Dpto": $("#dpto").val()
//     };

//     console.log("SITMAS - Enviando datos de nuevo empleado:", obj);

//     $.ajax({
//         type: "POST",
//         url: URL_BASE + "/Insertar",
//         data: JSON.stringify(obj),
//         contentType: "application/json; charset=utf-8",
//         success: function (response) {
//             // Ahora que la memoria no se destruye, el cartel va a saltar impecable
//             alert("✅ Empleado guardado con éxito");

//             // Refrescamos las planillas en tiempo real sin parpadear la pantalla
//             GetAllEmpleados();
//             GetVistaMateria();

//             // Limpiamos el formulario para una nueva carga limpia
//             $("#collapseForm form")[0].reset();
//         },
//         error: function (err) {
//             console.error("Error en RegistrarEmpleado:", err);
//             alert("❌ Error al registrar empleado en el servidor");
//         }
//     });
// }

// function BuscarEmpleado() {
//     const id = $("#BuscarIdEmpleado").val();
//     if (!id) return alert("Ingrese un ID");

//     $.ajax({
//         type: "GET",
//         url: URL_BASE + "/ListarPorId/" + id,
//         success: function (data) {
//             $("#apellido").val(data.Apellido);
//             $("#nombre").val(data.Nombre);
//             $("#cuil").val(data.Cuil);
//             $("#telefono").val(data.Telefono);
//             $("#email").val(data.Email);
//             $("#fecha_ingreso").val(data.Fecha_Ingreso);
//             $("#id_cargo").val(data.Id_Cargo);
//             $("#id_area").val(data.Id_Area);
//             $("#id_barrio").val(data.Id_Barrio);
//             $("#id_estado").val(data.Id_Estado_Empleado);
//             $("#calle").val(data.Calle);
//             $("#numero").val(data.Numero);
//             $("#piso").val(data.Piso);
//             $("#dpto").val(data.Dpto);
//         },
//         error: function () { alert("Empleado no encontrado"); }
//     });
// }

// function ModificarEmpleado() {
//     const id = $("#BuscarIdEmpleado").val();
//     if (!id) return alert("Primero busque un empleado por ID");

//     const obj = {
//         "Apellido": $("#apellido").val(),
//         "Nombre": $("#nombre").val(),
//         "Cuil": $("#cuil").val(),
//         "Telefono": $("#telefono").val(),
//         "Email": $("#email").val(),
//         "Fecha_Ingreso": $("#fecha_ingreso").val(),
//         "Id_Cargo": $("#id_cargo").val(),
//         "Id_Area": $("#id_area").val(),
//         "Id_Barrio": $("#id_barrio").val(),
//         "Id_Estado_Empleado": $("#id_estado").val(),
//         "Calle": $("#calle").val(),
//         "Numero": $("#numero").val(),
//         "Piso": $("#piso").val(),
//         "Dpto": $("#dpto").val()
//     };

//     $.ajax({
//         type: "PUT",
//         url: URL_BASE + "/Modificar/" + id,
//         data: JSON.stringify(obj),
//         contentType: "application/json; charset=utf-8",
//         success: function () {
//             alert("Datos actualizados correctamente");
//             location.reload();
//         },
//         error: function () { alert("Error al actualizar"); }
//     });
// }

// // --- CARGA DE SELECTORES (COMBOS) ---

// function CargarComboCargos() {
//     $.ajax({
//         type: "GET",
//         url: "https://localhost:44325/api/Cargo/ListarTodo",
//         success: function (data) {
//             let select = $("#id_cargo");
//             select.empty().append('<option value="">Seleccione Cargo</option>');
//             data.forEach(i => select.append(`<option value="${i.Id}">${i.Cargo}</option>`));
//         }
//     });
// }

// function CargarComboAreas() {
//     $.ajax({
//         type: "GET",
//         url: "https://localhost:44325/api/Area/ListarTodo",
//         success: function (data) {
//             let select = $("#id_area");
//             select.empty().append('<option value="">Seleccione Área</option>');
//             data.forEach(i => select.append(`<option value="${i.Id}">${i.Area}</option>`));
//         }
//     });
// }

// function CargarComboBarrios() {
//     $.ajax({
//         type: "GET",
//         url: "https://localhost:44325/api/Barrio/ListarTodo",
//         success: function (data) {
//             let select = $("#id_barrio");
//             select.empty().append('<option value="">Seleccione Barrio</option>');
//             data.forEach(i => select.append(`<option value="${i.Id}">${i.Barrio}</option>`));
//         }
//     });

//     function CargarComboEstadoEmpleado() {
//         $.ajax({
//             type: "GET",
//             url: "https://localhost:44325/api/EstadoEmpleado/ListarTodo",
//             success: function (data) {
//                 let select = $("#id_estado");
//                 select.empty().append('<option value="">Seleccione Estado</option>');
//                 data.forEach(i => select.append(`<option value="${i.Id}">${i.EstadoEmpleado}</option>`));
//             }
//         });
//     }

//     }