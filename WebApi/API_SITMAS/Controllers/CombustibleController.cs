using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/combustible")]
    public class CombustibleController : ApiController
    {
        // GET: api/combustible
        [HttpGet]
        [Route("")]
        public IHttpActionResult ObtenerTodos()
        {
            try
            {
                Combustible oCombustible = new Combustible();
                List<Combustible> lista = oCombustible.ObtenerTodos();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/combustible/5
        // Actualiza el precio del combustible indicado por {id}
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult ActualizarPrecio(int id, [FromBody] Combustible value)
        {
            if (value == null)
                return BadRequest("Los datos enviados no son válidos (cuerpo nulo).");

            if (id <= 0)
                return BadRequest("El ID del combustible debe ser un entero positivo.");

            if (value.Precio_valor <= 0)
                return BadRequest("El precio del combustible debe ser mayor a cero.");

            try
            {
                value.Id_Combustible = id;
                bool actualizado = value.ActualizarPrecio();

                if (!actualizado)
                    return NotFound(); // Retorna 404 solo si el ID no existe en la BD

                return Ok(new { Mensaje = "Precio del combustible actualizado correctamente." });
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
