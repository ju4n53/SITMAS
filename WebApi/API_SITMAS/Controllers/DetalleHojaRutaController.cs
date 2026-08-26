using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/detallehojaruta")]
    public class DetalleHojaRutaController : ApiController
    {
        // GET: api/detallehojaruta/hojaruta/1 (Obtener todas las paradas de una Hoja de Ruta especifica)
        [HttpGet]
        [Route("hojaruta/{idHojaRuta:int}")]
        public IHttpActionResult ObtenerPorHojaRuta(int idHojaRuta)
        {
            try
            {
                DetalleHojaRuta oDetalle = new DetalleHojaRuta();
                List<DetalleHojaRuta> lista = oDetalle.ObtenerPorHojaRuta(idHojaRuta);
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/detallehojaruta (Crear una nueva parada/recorrido)
        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] DetalleHojaRuta value)
        {
            if (value == null) return BadRequest("Los datos del detalle no son válidos.");

            try
            {
                int nuevoId = value.Insertar();
                return Ok(new { IdDetalleGenerado = nuevoId, Mensaje = "Parada agregada con éxito." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/detallehojaruta/5 (Modificar una parada/recorrido especifica)
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] DetalleHojaRuta value)
        {
            if (value == null) return BadRequest("Los datos del detalle no son válidos.");

            try
            {
                value.Id = id;
                bool actualizado = value.Modificar();
                if (!actualizado) return NotFound();

                return Ok(new { Mensaje = "Parada actualizada correctamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/detallehojaruta/5 (Eliminar una parada especifica)
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                DetalleHojaRuta oDetalle = new DetalleHojaRuta { Id = id };
                bool eliminado = oDetalle.Borrar();
                if (!eliminado) return NotFound();

                return Ok(new { Mensaje = "Parada eliminada correctamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}