using API_SITMAS.Models;
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/Roles")]
    public class RolesController : ApiController
    {
        private readonly RolDatos _datos = new RolDatos();

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
        public IHttpActionResult Insertar([FromBody] RolDTO value)
        {
            if (value == null || string.IsNullOrWhiteSpace(value.NombreRol))
                return BadRequest("El nombre del rol es requerido.");

            try
            {
                int idGenerado = _datos.Insertar(value);
                return Ok(new { mensaje = "Rol creado exitosamente.", id = idGenerado });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] RolDTO value)
        {
            if (value == null) return BadRequest("Datos inválidos.");

            try
            {
                value.Id = id;
                _datos.Modificar(value);
                return Ok(new { mensaje = "Rol actualizado correctamente." });
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
                return Ok(new { mensaje = "Rol eliminado correctamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}