    const url = "https://localhost:44325"

    let roles;

    async function obtenerRoles() {
        const url = 'https://localhost:44325/api/Roles/ListarTodo';

        try {
            const data = await $.ajax({
                url: url,
                type: 'GET',
                dataType: 'json',
                crossDomain: true // Le indicamos a jQuery que es una petición cruzada
            });

            let cadena = data.map(r => r.NombreRol).join(', ');
            console.log("Roles obtenidos:", cadena);
            return data;
        } catch (error) {
            console.error("Sigue el error de CORS o conexión:", error);
        }
    }

    async function cargarComboRoles() {
        const roles = await obtenerRoles(); // Tu función que ya funciona

        const $select = $('#id-rol');
        $select.empty();
        $select.append('<option value="">Seleccione un Rol...</option>');

        roles.forEach(rol => {
            $select.append(`<option value="${rol.Id}">${rol.NombreRol}</option>`);
        });
    }