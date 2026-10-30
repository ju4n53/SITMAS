using API_SITMAS.Models;
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/Permisos")]
    public class PermisosController : ApiController
    {
        private readonly PermisoDatos _datos = new PermisoDatos();

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
        public IHttpActionResult Insertar([FromBody] PermisoDTO value)
        {
            if (value == null || string.IsNullOrWhiteSpace(value.PermisoUsuario))
                return BadRequest("El nombre del permiso es requerido.");

            try
            {
                int idGenerado = _datos.Insertar(value);
                return Ok(new { mensaje = "Permiso registrado exitosamente.", id = idGenerado });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // 🌟 CORREGIDO: Ahora usa correctamente [HttpPut]
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] PermisoDTO value)
        {
            if (value == null) return BadRequest("Datos requeridos.");

            try
            {
                value.Id = id;
                _datos.Modificar(value);
                return Ok(new { mensaje = "Permiso modificado exitosamente." });
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
                return Ok(new { mensaje = "Permiso eliminado." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}