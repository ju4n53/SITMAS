using API_SITMAS.Models;
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/Legajo")]
    public class LegajoController : ApiController
    {
        private readonly LegajoDatos _datos = new LegajoDatos();

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

        [HttpGet]
        [Route("Empleado/{idEmpleado:int}")]
        public IHttpActionResult ObtenerPorEmpleado(int idEmpleado)
        {
            try
            {
                var legajo = _datos.ObtenerPorEmpleado(idEmpleado);
                if (legajo == null)
                    return NotFound();

                return Ok(legajo);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] Legajo value)
        {
            if (value == null || string.IsNullOrWhiteSpace(value.Numero_Legajo))
                return BadRequest("El número de legajo y el empleado son obligatorios.");

            try
            {
                int id = _datos.Insertar(value);
                return Ok(new { mensaje = "Legajo creado exitosamente.", id = id });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] Legajo value)
        {
            if (value == null) return BadRequest("Datos requeridos.");

            try
            {
                value.Id_Legajo = id;
                _datos.Modificar(value);
                return Ok(new { mensaje = "Legajo actualizado." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Anular(int id)
        {
            try
            {
                _datos.Anular(id);
                return Ok(new { mensaje = "Legajo anulado exitosamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}