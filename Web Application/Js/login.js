// Configuración del servicio de autenticación conectado a tu API C#
    const authService = {
        login: async (usuario, password) => {
            // Se realiza la petición POST a tu controlador local
            const response = await fetch('https://localhost:44325/api/Usuario/Login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Usuario: usuario,   // Coincide con la propiedad en Usuarios.cs
                    Password: password
                })
            });

            if (!response.ok) {
                throw new Error("Usuario o contraseña incorrectos");
            }

            return await response.json();
        }
    };

    const loginForm = document.getElementById('form-login');
    const inputUser = document.getElementById('usuario');
    const inputPass = document.getElementById('contraseña');
    const errorPass = document.getElementById('error-pass');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Limpiamos mensajes de error previos
        errorPass.style.display = 'none';

        const userVal = inputUser.value.trim();
        const passVal = inputPass.value;

        // Validación simple de campos vacíos antes de enviar
        if (!userVal || !passVal) {
            errorPass.textContent = "* Complete todos los campos";
            errorPass.style.display = 'block';
            return;
        }

        try {
            // Llamada al servicio real
            const data = await authService.login(userVal, passVal);

            // Almacenamos los datos de sesión devueltos por el servidor (nombre y rol)
            localStorage.setItem('usuarioSesion', JSON.stringify({
                nombre: data.nombre,
                rol: data.rol
            }));

            // Redirección a la landing de estructura tras éxito
            window.location.href="../Pages/landing.html";

        } catch (err) {
            // Si la API devuelve un error (ej: 401 Unauthorized), lo mostramos en pantalla
            errorPass.textContent = "* " + err.message;
            errorPass.style.display = 'block';
        }
    });