using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/hojaruta")]
    public class HojaRutaController : ApiController
    {
        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                HojaRuta oHojaRuta = new HojaRuta();
                List<HojaRuta> lista = oHojaRuta.SelectAll();
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
                return BadRequest("El ID proporcionado no es válido.");

            try
            {
                HojaRuta oHojaRuta = new HojaRuta();
                HojaRuta resultado = oHojaRuta.ObtenerPorId(id);

                if (resultado == null)
                    return NotFound();

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] HojaRuta value)
        {
            if (value == null)
                return BadRequest("El cuerpo de la solicitud no puede estar vacío.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                int nuevoId = value.Insertar();

                return Created(
                    new Uri(Request.RequestUri + "/" + nuevoId),
                    new { IdGenerado = nuevoId, Mensaje = "Hoja de Ruta creada con éxito." }
                );
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] HojaRuta value)
        {
            if (value == null)
                return BadRequest("Los datos enviados no son válidos.");

            if (id <= 0)
                return BadRequest("El ID especificado debe ser mayor a cero.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                value.Id = id;
                bool actualizado = value.Modificar();

                if (!actualizado)
                    return NotFound();

                return Ok(new { Mensaje = "Hoja de Ruta actualizada correctamente." });
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
                return BadRequest("El ID proporcionado no es válido.");

            try
            {
                HojaRuta oHojaRuta = new HojaRuta { Id = id };
                bool eliminado = oHojaRuta.Borrar();

                if (!eliminado)
                    return NotFound();

                return Ok(new { Mensaje = "Hoja de Ruta y sus detalles asociados fueron eliminados correctamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        public class DistanciaTotalDto
        {
            public decimal DistanciaTotal { get; set; }
        }

        /// <summary>
        /// 🛠️ NUEVO ENDPOINT: Actualización parcial de la distancia total del circuito cerrado.
        /// </summary>
        [HttpPatch]
        [Route("{id:int}/distanciatotal")]
        public IHttpActionResult ActualizarDistanciaTotal(int id, [FromBody] DistanciaTotalDto dto)
        {
            if (dto == null || id <= 0)
                return BadRequest("Datos de distancia o ID inválidos.");

            try
            {
                HojaRuta oHojaRuta = new HojaRuta { Id = id };
                bool exito = oHojaRuta.ActualizarDistanciaTotal(dto.DistanciaTotal);

                if (!exito)
                    return NotFound();

                return Ok(new { Mensaje = "Distancia total de la Hoja de Ruta actualizada correctamente." });
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
//    [RoutePrefix("api/hojaruta")]
//    public class HojaRutaController : ApiController
//    {
//        [HttpGet]
//        [Route("")]
//        public IHttpActionResult ListarTodo()
//        {
//            try
//            {
//                HojaRuta oHojaRuta = new HojaRuta();
//                List<HojaRuta> lista = oHojaRuta.SelectAll();
//                return Ok(lista);
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        [HttpGet]
//        [Route("{id:int}")]
//        public IHttpActionResult ObtenerPorId(int id)
//        {
//            if (id <= 0)
//                return BadRequest("El ID proporcionado no es válido.");

//            try
//            {
//                HojaRuta oHojaRuta = new HojaRuta();
//                HojaRuta resultado = oHojaRuta.ObtenerPorId(id);

//                if (resultado == null)
//                    return NotFound();

//                return Ok(resultado);
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        [HttpPost]
//        [Route("")]
//        public IHttpActionResult Insertar([FromBody] HojaRuta value)
//        {
//            if (value == null)
//                return BadRequest("El cuerpo de la solicitud no puede estar vacío.");

//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            try
//            {
//                int nuevoId = value.Insertar();

//                return Created(
//                    new Uri(Request.RequestUri + "/" + nuevoId),
//                    new { IdGenerado = nuevoId, Mensaje = "Hoja de Ruta creada con éxito." }
//                );
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        [HttpPut]
//        [Route("{id:int}")]
//        public IHttpActionResult Modificar(int id, [FromBody] HojaRuta value)
//        {
//            if (value == null)
//                return BadRequest("Los datos enviados no son válidos.");

//            if (id <= 0)
//                return BadRequest("El ID especificado debe ser mayor a cero.");

//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            try
//            {
//                value.Id = id;
//                bool actualizado = value.Modificar();

//                if (!actualizado)
//                    return NotFound();

//                return Ok(new { Mensaje = "Hoja de Ruta actualizada correctamente." });
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        [HttpDelete]
//        [Route("{id:int}")]
//        public IHttpActionResult Borrar(int id)
//        {
//            if (id <= 0)
//                return BadRequest("El ID proporcionado no es válido.");

//            try
//            {
//                HojaRuta oHojaRuta = new HojaRuta { Id = id };
//                bool eliminado = oHojaRuta.Borrar();

//                if (!eliminado)
//                    return NotFound();

//                return Ok(new { Mensaje = "Hoja de Ruta y sus detalles asociados fueron eliminados correctamente." });
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }
//    }
//}

