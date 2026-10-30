function tienePermiso(permisoRequerido) {
    // 1. Sacamos el paquete del localStorage
    const datosUsuario = JSON.parse(localStorage.getItem("usuarioSesion"));
    
    // Si por alguna razón no hay datos, el usuario no está logueado
    if (!datosUsuario || !datosUsuario.permisos) {
        return false; 
    }
    
    // 2. Comprobamos si el permiso requerido está en su lista
    return datosUsuario.permisos.includes(permisoRequerido);
}