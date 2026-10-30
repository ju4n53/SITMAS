using API_SITMAS.Models;
using API_SITMAS.Security; // Espacio de nombres de tu JwtTokenProvider
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/Usuario")]
    public class UsuarioController : ApiController
    {
        private readonly UsuarioDatos _datos = new UsuarioDatos();

        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                return Ok(_datos.SelectAll());
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] UsuarioRequestDTO value)
        {
            if (value == null || string.IsNullOrWhiteSpace(value.Usuario))
                return BadRequest("Datos del usuario requeridos.");

            try
            {
                int nuevoId = _datos.Insertar(value);
                return Ok(new { mensaje = "Usuario creado exitosamente.", id = nuevoId });
            }
            catch (Exception ex)
            {
                // Captura específica por si salta el THROW de la DB (usuario duplicado)
                return BadRequest(ex.Message);
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] UsuarioRequestDTO value)
        {
            if (value == null) return BadRequest("Datos requeridos.");

            try
            {
                value.Id = id;
                _datos.Modificar(value);
                return Ok(new { mensaje = "Usuario modificado correctamente." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                _datos.Borrar(id);
                return Ok(new { mensaje = "Usuario inhabilitado exitosamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // ==========================================
        // ENDPOINT DE AUTENTICACIÓN (LOGIN)
        // ==========================================
        [HttpPost]
        [Route("Login")]
        public IHttpActionResult Login([FromBody] LoginRequestDTO loginRequest)
        {
            if (loginRequest == null || string.IsNullOrWhiteSpace(loginRequest.Usuario) || string.IsNullOrWhiteSpace(loginRequest.Password))
                return BadRequest("Usuario y contraseña son obligatorios.");

            try
            {
                // 1. Delegamos TODA la validación y consultas a la capa de datos
                var loginResponse = _datos.ProcesarLogin(loginRequest.Usuario, loginRequest.Password);

                // 2. Si la capa de datos devuelve null, las credenciales eran incorrectas
                if (loginResponse == null)
                    return Unauthorized();

                // 3. Generamos el token JWT con los datos limpios y seguros
                string tokenGenerado = JwtTokenProvider.GenerarToken(
                    loginResponse.IdUsuario,
                    loginResponse.NombreMostrar,
                    loginResponse.RolAsignado,
                    loginResponse.Permisos
                );

                // 4. Retornamos la respuesta al cliente
                return Ok(new
                {
                    idUsuario = loginResponse.IdUsuario,
                    nombre = loginResponse.NombreMostrar,
                    rol = loginResponse.RolAsignado,
                    permisos = loginResponse.Permisos,
                    token = tokenGenerado
                });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}












//using API_SITMAS.Models;
//using Newtonsoft.Json;
//using System;
//using System.Collections.Generic;
//using System.Data;
//using System.Linq;
//using System.Net;
//using System.Net.Http;
//using System.Web.Http;
//using System.Data.SqlClient; 
//using System.Configuration;
//using API_SITMAS.Security;


//namespace API_SITMAS.Controllers
//{
//    public class UsuarioController : ApiController
//    {
//        // GET: api/Usuario
//        [HttpGet]
//        public List<Usuarios> ListarTodo()
//        {
//            Usuarios oUsuario = new Usuarios();

//            DataTable dt = oUsuario.SelectAll();
//            var listaJson = JsonConvert.SerializeObject(dt);

//            var Lista = JsonConvert.DeserializeObject<List<Usuarios>>(listaJson);

//            return Lista;

//        }

//        // GET: api/Empleado/5
//        [HttpGet]

//        public Usuarios ListarPorId(int id)
//        {
//            Usuarios oUsuario = new Usuarios();
//            oUsuario.Id = id;

//            DataTable dt = oUsuario.SelectId();

//            var ListaJsom = JsonConvert.SerializeObject(dt);

//            var obj = JsonConvert.DeserializeObject<List<Usuarios>>(ListaJsom).ToList().FirstOrDefault();
//            return obj;

//        }

//        // POST: api/Usuario
//        [HttpPost]

//        public void Insertar([FromBody] Usuarios value)
//        {
//            Usuarios oUsuario = new Usuarios();
//            oUsuario.Usuario = value.Usuario;
//            oUsuario.Password = value.Password;
//            oUsuario.Id_Empleado = value.Id_Empleado;
//            oUsuario.Id_Estado_Usuario = value.Id_Estado_Usuario;

//            oUsuario.Insertar();
//        }


//        // PUT: api/Usuario/5
//        [HttpPut]

//        public void Modificar(int id, [FromBody] Usuarios value)
//        {
//            Usuarios oUsuario = new Usuarios();
//            oUsuario.Id = id; // <--- ¡Perfecto! Usás el ID de la URL
//            oUsuario.Usuario = value.Usuario;
//            oUsuario.Id_Estado_Usuario = value.Id_Estado_Usuario;
//            oUsuario.Password = value.Password;

//            oUsuario.Modificar();
//        }
//        [HttpPost]
//        [Route("api/Usuario/Login")]
//        public IHttpActionResult Login([FromBody] Usuarios login)
//        {
//            // 1. Validamos las credenciales con tu SP sp_Login (con hash y salt)
//            DataTable dt = login.Validar();

//            if (dt != null && dt.Rows.Count > 0)
//            {
//                // 2. Extraemos los datos básicos del usuario logueado
//                int idUsuario = Convert.ToInt32(dt.Rows[0]["Id_Usuario"]);
//                string idEmpleado = dt.Rows[0]["Id_Empleado"].ToString();
//                string nombreMostrar = dt.Rows[0]["Usuario"].ToString();
//                //string rolAsignado = dt.Rows[0]["NombreRol"].ToString();

//                // 3. Obtenemos los permisos y roles
//                List<string> misPermisos = login.ObtenerPermisos(idUsuario);
//                List<string> misRoles = login.ObtenerRoles(idUsuario);

//                string rolAsignado = misRoles.Count > 0 ? string.Join(", ", misRoles) : "Sin Rol";

//                // 4. Buscamos el nombre real
//                using (SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString))
//                {
//                    string query = "SELECT Nombre, Apellido FROM Empleado WHERE Id = @Id";
//                    SqlCommand cmd = new SqlCommand(query, conn);
//                    cmd.Parameters.AddWithValue("@Id", idEmpleado);
//                    conn.Open();
//                    SqlDataReader reader = cmd.ExecuteReader();
//                    if (reader.Read())
//                    {
//                        nombreMostrar = reader["Nombre"].ToString() + " " + reader["Apellido"].ToString();
//                    }
//                }

//                // 5. ¡LA MAGIA DEL TOKEN! Generamos la pulsera VIP usando nuestra nueva clase
//                string tokenGenerado = JwtTokenProvider.GenerarToken(idUsuario, nombreMostrar, rolAsignado, misPermisos);

//                // 6. Devolvemos el objeto al Frontend, ahora incluyendo el Token
//                return Ok(new
//                {
//                    idUsuario = idUsuario,
//                    nombre = nombreMostrar,
//                    rol = rolAsignado,
//                    permisos = misPermisos,
//                    token = tokenGenerado // 👈 ¡Aquí está nuestra pulsera de seguridad!
//                });
//            }

//            // Si metió mal los dedos, credenciales inválidas
//            return Unauthorized();


//            //    // 3. ¡LA NUEVA MAGIA! Instanciamos tu método corregido para traer los permisos reales
//            //    List<string> misPermisos = login.ObtenerPermisos(idUsuario);

//            //    // 4. Buscamos el nombre real en la tabla Empleado (como ya lo tenías)
//            //    using (SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString))
//            //    {
//            //        string query = "SELECT Nombre, Apellido FROM Empleado WHERE Id = @Id";
//            //        SqlCommand cmd = new SqlCommand(query, conn);
//            //        cmd.Parameters.AddWithValue("@Id", idEmpleado);
//            //        conn.Open();
//            //        SqlDataReader reader = cmd.ExecuteReader();
//            //        if (reader.Read())
//            //        {
//            //            nombreMostrar = reader["Nombre"].ToString() + " " + reader["Apellido"].ToString();
//            //        }
//            //    }

//            //    // 5. Devolvemos el objeto completo al Frontend. ¡Mirá qué joya!
//            //    return Ok(new
//            //    {
//            //        idUsuario = idUsuario,
//            //        nombre = nombreMostrar,
//            //        rol = rolAsignado,
//            //        permisos = misPermisos // 👈 Facu y Ramiro van a recibir la lista de strings acá
//            //    });
//            //}

//            //// Si metió mal los dedos, credenciales inválidas
//            //return Unauthorized();
//        }


//        // DELETE: api/Usuario/5
//        //[HttpDelete]

//        //public void Borrar(int id)
//        //{

//        //    Usuarios oUsuario = new Usuarios();
//        //    oUsuario.Id = id;

//        //    oUsuario.Borrar();

//        //}
//    }
//}
