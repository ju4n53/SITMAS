using API_SITMAS.Models;
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/OrigenParticular")]
    public class OrigenParticularController : ApiController
    {
        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try { return Ok(new Origen_Particular().SelectAll()); }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] Origen_Particular value)
        {
            if (value == null) return BadRequest("Datos inválidos.");
            try
            {
                int idGenerado = value.Insertar();
                return Ok(new { mensaje = "Origen registrado.", id = idGenerado });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpPut]
        [Route("{id}")]
        public IHttpActionResult Modificar(int id, [FromBody] Origen_Particular value)
        {
            if (value == null) return BadRequest("Datos inválidos.");
            try
            {
                value.Id_origenParticular = id;
                value.Modificar();
                return Ok(new { mensaje = "Origen actualizado." });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpDelete]
        [Route("{id}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                new Origen_Particular { Id_origenParticular = id }.Borrar();
                return Ok(new { mensaje = "Origen eliminado." });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }
    }
}