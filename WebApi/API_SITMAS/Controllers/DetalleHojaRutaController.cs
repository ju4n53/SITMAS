using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/detallehojaruta")]
    public class DetalleHojaRutaController : ApiController
    {
        [HttpGet]
        [Route("hojaruta/{idHojaRuta:int}")]
        public IHttpActionResult ObtenerPorHojaRuta(int idHojaRuta)
        {
            if (idHojaRuta <= 0)
                return BadRequest("El ID de Hoja de Ruta debe ser válido.");

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

        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] DetalleHojaRuta value)
        {
            if (value == null)
                return BadRequest("Los datos de la parada no son válidos.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                int nuevoId = value.Insertar();
                return Created(new Uri(Request.RequestUri + "/" + nuevoId), new { IdDetalleGenerado = nuevoId, Mensaje = "Parada agregada con éxito." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] DetalleHojaRuta value)
        {
            if (value == null)
                return BadRequest("Los datos enviados no son válidos.");

            if (id <= 0)
                return BadRequest("El ID del detalle debe ser un entero positivo.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                value.Id_Detalle_HDR = id;
                bool actualizado = value.Modificar();

                if (!actualizado)
                    return NotFound();

                return Ok(new { Mensaje = "Parada actualizada correctamente." });
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
            if (id <= 0)
                return BadRequest("El ID a eliminar no es válido.");

            try
            {
                DetalleHojaRuta oDetalle = new DetalleHojaRuta { Id_Detalle_HDR = id };
                bool eliminado = oDetalle.Borrar();

                if (!eliminado)
                    return NotFound();

                return Ok(new { Mensaje = "Parada eliminada correctamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}


//using API_SITMAS.Models;
//using System;
//using System.Collections.Generic;
//using System.Web.Http;

//namespace API_SITMAS.Controllers
//{
//    [RoutePrefix("api/detallehojaruta")]
//    public class DetalleHojaRutaController : ApiController
//    {
//        // GET: api/detallehojaruta/hojaruta/1 (Obtener todas las paradas de una Hoja de Ruta especifica)
//        [HttpGet]
//        [Route("hojaruta/{idHojaRuta:int}")]
//        public IHttpActionResult ObtenerPorHojaRuta(int idHojaRuta)
//        {
//            try
//            {
//                DetalleHojaRuta oDetalle = new DetalleHojaRuta();
//                List<DetalleHojaRuta> lista = oDetalle.ObtenerPorHojaRuta(idHojaRuta);
//                return Ok(lista);
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        // POST: api/detallehojaruta (Crear una nueva parada/recorrido)
//        [HttpPost]
//        [Route("")]
//        public IHttpActionResult Insertar([FromBody] DetalleHojaRuta value)
//        {
//            if (value == null) return BadRequest("Los datos del detalle no son válidos.");

//            try
//            {
//                int nuevoId = value.Insertar();
//                return Ok(new { IdDetalleGenerado = nuevoId, Mensaje = "Parada agregada con éxito." });
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        // PUT: api/detallehojaruta/5 (Modificar una parada/recorrido especifica)
//        [HttpPut]
//        [Route("{id:int}")]
//        public IHttpActionResult Modificar(int id, [FromBody] DetalleHojaRuta value)
//        {
//            if (value == null) return BadRequest("Los datos del detalle no son válidos.");

//            try
//            {
//                value.Id_Detalle_HDR = id;
//                bool actualizado = value.Modificar();
//                if (!actualizado) return NotFound();

//                return Ok(new { Mensaje = "Parada actualizada correctamente." });
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        // DELETE: api/detallehojaruta/5 (Eliminar una parada especifica)
//        [HttpDelete]
//        [Route("{id:int}")]
//        public IHttpActionResult Borrar(int id)
//        {
//            try
//            {
//                DetalleHojaRuta oDetalle = new DetalleHojaRuta { Id_Detalle_HDR = id };
//                bool eliminado = oDetalle.Borrar();
//                if (!eliminado) return NotFound();

//                return Ok(new { Mensaje = "Parada eliminada correctamente." });
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }
//    }
//}