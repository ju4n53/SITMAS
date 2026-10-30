using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/ubicaciongeografica")]
    public class UbicacionGeograficaController : ApiController
    {
        [HttpGet]
        [Route("")]
        public IHttpActionResult ObtenerTodas()
        {
            try
            {
                UbicacionGeografica oUbicacion = new UbicacionGeografica();
                List<UbicacionGeografica> lista = oUbicacion.ObtenerTodas();

                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult ObtenerPorId(int id)
        {
            if (id <= 0)
                return BadRequest("El ID de la ubicación debe ser válido.");

            try
            {
                UbicacionGeografica oUbicacion = new UbicacionGeografica();
                UbicacionGeografica entidad = oUbicacion.ObtenerPorId(id);

                if (entidad == null)
                    return NotFound();

                return Ok(entidad);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] UbicacionGeografica value)
        {
            if (value == null)
                return BadRequest("Los datos de la ubicación geográfica no son válidos.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                int nuevoId = value.Insertar();
                return Created(new Uri(Request.RequestUri + "/" + nuevoId), new { IdUbicacionGenerado = nuevoId, Mensaje = "Ubicación registrada con éxito." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] UbicacionGeografica value)
        {
            if (value == null)
                return BadRequest("Los datos enviados no son válidos.");

            if (id <= 0)
                return BadRequest("El ID de la ubicación debe ser un entero positivo.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                value.IdUbicacion = id;
                bool actualizado = value.Modificar();

                if (!actualizado)
                    return NotFound();

                return Ok(new { Mensaje = "Ubicación geográfica actualizada correctamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        /*
        // ============================================================================
        // MÉTODOS DE ELIMINACIÓN - COMENTADOS POR REGLA DE NEGOCIO Y TRAZABILIDAD
        // Se deja la estructura creada por si el cliente requiere la función en el futuro.
        // ============================================================================
        
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Borrar(int id)
        {
            if (id <= 0)
                return BadRequest("El ID a eliminar no es válido.");

            try
            {
                UbicacionGeografica oUbicacion = new UbicacionGeografica { IdUbicacion = id };
                bool eliminado = oUbicacion.Borrar();

                if (!eliminado)
                    return NotFound();

                return Ok(new { Mensaje = "Ubicación geográfica eliminada correctamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        */
    }
}