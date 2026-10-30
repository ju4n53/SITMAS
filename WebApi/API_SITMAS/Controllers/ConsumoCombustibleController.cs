using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/consumocombustible")]
    public class ConsumoCombustibleController : ApiController
    {
        [HttpGet]
        [Route("")]
        public IHttpActionResult ObtenerTodos()
        {
            try
            {
                ConsumoCombustible oConsumo = new ConsumoCombustible();
                List<ConsumoCombustible> lista = oConsumo.ObtenerTodos();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] ConsumoCombustible value)
        {
            if (value == null)
                return BadRequest("Los datos enviados no son válidos.");

            if (id <= 0)
                return BadRequest("El ID del registro de consumo debe ser un entero positivo.");

            if (value.Valor_KM < 0)
                return BadRequest("El costo del consumo no puede ser un valor negativo.");

            try
            {
                value.Id_Consumo = id;
                bool actualizado = value.Modificar();

                if (!actualizado)
                    return NotFound();

                return Ok(new { Mensaje = "Registro de consumo ajustado correctamente." });
            }
            catch (SqlException sqlEx)
            {
                return BadRequest(sqlEx.Message);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}