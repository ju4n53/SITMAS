using API_SITMAS.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Data.SqlClient; // Necesario para SqlConnection y SqlCommand
using System.Configuration;   // Necesario para ConfigurationManager


namespace API_SITMAS.Controllers
{
    public class UsuarioController : ApiController
    {
        // GET: api/Usuario
        [HttpGet]
        public List<Usuarios> ListarTodo()
        {
            Usuarios oUsuario = new Usuarios();

            DataTable dt = oUsuario.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Usuarios>>(listaJson);

            return Lista;

        }

        // GET: api/Empleado/5
        [HttpGet]

        public Usuarios ListarPorId(int id)
        {
            Usuarios oUsuario = new Usuarios();
            oUsuario.Id = id;

            DataTable dt = oUsuario.SelectId();

            var ListaJsom = JsonConvert.SerializeObject(dt);

            var obj = JsonConvert.DeserializeObject<List<Usuarios>>(ListaJsom).ToList().FirstOrDefault();
            return obj;

        }

        // POST: api/Usuario
        [HttpPost]

        public void Insertar([FromBody] Usuarios value)
        {
            Usuarios oUsuario = new Usuarios();
            oUsuario.Usuario = value.Usuario;
            oUsuario.Password = value.Password;
            oUsuario.Id_Empleado = value.Id_Empleado;
            oUsuario.Id_Estado_Usuario = value.Id_Estado_Usuario;

            oUsuario.Insertar();
        }


        // PUT: api/Usuario/5
        [HttpPut]

        public void Modificar(int id, [FromBody] Usuarios value)
        {
            Usuarios oUsuario = new Usuarios();
            oUsuario.Id = id; // <--- ¡Perfecto! Usás el ID de la URL
            oUsuario.Usuario = value.Usuario;
            oUsuario.Id_Estado_Usuario = value.Id_Estado_Usuario;
            oUsuario.Password = value.Password;

            oUsuario.Modificar();
        }

        [HttpPost]
        [Route("api/Usuario/Login")]
        public IHttpActionResult Login([FromBody] Usuarios login)
        {
            DataTable dt = login.Validar(); 

            if (dt != null && dt.Rows.Count > 0)
            {
                // 1. Obtenemos el Id_Empleado que devolvió el login
                string idEmpleado = dt.Rows[0]["Id_Empleado"].ToString();
                string nombreMostrar = dt.Rows[0]["Usuario"].ToString(); // Por defecto el correo

                // 2. Buscamos el nombre real en la tabla Empleado
                using (SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString))
                {
                    string query = "SELECT Nombre, Apellido FROM Empleado WHERE Id = @Id";
                    SqlCommand cmd = new SqlCommand(query, conn);
                    cmd.Parameters.AddWithValue("@Id", idEmpleado);
                    conn.Open();
                    SqlDataReader reader = cmd.ExecuteReader();
                    if (reader.Read())
                    {
                        // Formateamos: "Juan Videla"
                        nombreMostrar = reader["Nombre"].ToString() + " " + reader["Apellido"].ToString();
                    }
                }

                return Ok(new
                {
                    nombre = nombreMostrar,
                    rol = "Administrador" 
                });
            }
            return Unauthorized(); 
        }
        // DELETE: api/Usuario/5
        //[HttpDelete]

        //public void Borrar(int id)
        //{

        //    Usuarios oUsuario = new Usuarios();
        //    oUsuario.Id = id;

        //    oUsuario.Borrar();

        //}
    }
}
