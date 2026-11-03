using API_SITMAS.Models;
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/IngresoParticular")]
    public class IngresoParticularController : ApiController
    {
        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try { return Ok(new IngresoMaterial_Particular().SelectAll()); }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] IngresoMaterial_Particular value)
        {
            if (value == null) return BadRequest("Datos inválidos.");
            try
            {
                int idGenerado = value.Insertar();
                return Ok(new { mensaje = "Ingreso particular registrado.", id = idGenerado });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpPut]
        [Route("{id}")]
        public IHttpActionResult Modificar(int id, [FromBody] IngresoMaterial_Particular value)
        {
            if (value == null) return BadRequest("Datos inválidos.");
            try
            {
                value.Id_ingresoParticular = id;
                value.Modificar();
                return Ok(new { mensaje = "Ingreso particular modificado." });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpDelete]
        [Route("{id}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                new IngresoMaterial_Particular { Id_ingresoParticular = id }.BorrarLogico();
                return Ok(new { mensaje = "Ingreso anulado correctamente." });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }
    }
}