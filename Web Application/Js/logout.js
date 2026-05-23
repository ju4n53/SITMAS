function cerrarSesion(event) {
    // Evitamos que la página haga cosas raras con el enlace '#'
    event.preventDefault(); 
    
    // 1. Borramos los datos del usuario que guardamos al iniciar sesión
    localStorage.removeItem("usuarioSesion"); 
    
    // 2. Redirigimos inmediatamente al formulario de login
    window.location.href = "../index.html";
}