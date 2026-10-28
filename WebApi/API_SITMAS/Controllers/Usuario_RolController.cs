using API_SITMAS.Models;
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/Usuario_Rol")]
    public class Usuario_RolController : ApiController
    {
        private readonly UsuarioRolDatos _datos = new UsuarioRolDatos();

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
        public IHttpActionResult Insertar([FromBody] UsuarioRolDTO value)
        {
            if (value == null || value.Id_Usuario <= 0 || value.Id_Rol <= 0)
                return BadRequest("Se requiere el ID del Usuario y el ID del Rol.");

            try
            {
                int nuevoId = _datos.Insertar(value);
                return Ok(new { mensaje = "Relación Usuario-Rol creada exitosamente.", id = nuevoId });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] UsuarioRolDTO value)
        {
            if (value == null) return BadRequest("Datos requeridos.");

            try
            {
                value.Id = id;
                _datos.Modificar(value);
                return Ok(new { mensaje = "Relación Usuario-Rol actualizada." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // 🌟 NUEVO ENDPOINT ESTRELLA PARA EL FRONTEND
        [HttpPost]
        [Route("Asignar")]
        public IHttpActionResult AsignarRol([FromBody] AsignarRolDTO asignacion)
        {
            if (asignacion == null || asignacion.Id_Usuario <= 0 || asignacion.Id_Rol <= 0)
                return BadRequest("Datos de asignación inválidos.");

            try
            {
                _datos.AsignarRolDirecto(asignacion.Id_Usuario, asignacion.Id_Rol);
                return Ok(new { mensaje = "Rol asignado correctamente al usuario." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                _datos.Borrar(id);
                return Ok(new { mensaje = "Relación eliminada." });
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

//namespace API_SITMAS.Controllers
//{
//    public class Usuario_RolController : ApiController
//    {
//        // GET: api/Usuario_Rol
//        [HttpGet]
//        public List<Usuario_Rol> ListarTodo()
//        {
//            Usuario_Rol oUsuario_Rol = new Usuario_Rol();

//            DataTable dt = oUsuario_Rol.SelectAll();
//            var listaJson = JsonConvert.SerializeObject(dt);

//            var Lista = JsonConvert.DeserializeObject<List<Usuario_Rol>>(listaJson);

//            return Lista;

//        }

//        // GET: api/Area/5
//        //[HttpGet]

//        //public Empleado ListarPorId(int id)
//        //{
//        //    Empleado oEmpleado = new Empleado();
//        //    oEmpleado.Id = id;

//        //    DataTable dt = oEmpleado.SelectId();

//        //    var ListaJsom = JsonConvert.SerializeObject(dt);

//        //    var obj = JsonConvert.DeserializeObject<List<Empleado>>(ListaJsom).ToList().FirstOrDefault();

//        //    return obj;

//        //}

//        // POST: api/Usuario_Rol
//        [HttpPost]
//        public void Insertar([FromBody] Usuario_Rol value)
//        {
//            Usuario_Rol oUsuario_Rol = new Usuario_Rol();
//            oUsuario_Rol.Id_Usuario = value.Id_Usuario;
//            oUsuario_Rol.Id_Rol = value.Id_Rol;

//            oUsuario_Rol.Insertar();
//        }

//        // PUT: api/Usuario_Rol/5
//        [HttpPut]
//        public void Modificar(int id, [FromBody] Usuario_Rol value)
//        {

//            Usuario_Rol oUsuario_Rol = new Usuario_Rol();
//            oUsuario_Rol.Id = id;
//            oUsuario_Rol.Id_Usuario = value.Id_Usuario;
//            oUsuario_Rol.Id_Rol = value.Id_Rol;

//            oUsuario_Rol.Modificar();

//        }

//        // DELETE: api/Usuario_Rol/5
//        [HttpDelete]

//        public void Borrar(int id)
//        {

//            Usuario_Rol oUsuario_Rol = new Usuario_Rol();
//            oUsuario_Rol.Id = id;

//            oUsuario_Rol.Borrar();

//        }

//    }
//}
