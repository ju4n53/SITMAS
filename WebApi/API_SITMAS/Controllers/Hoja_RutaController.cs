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
//        // En una etapa avanzada inyectaremos IHojaRutaService para facilitar Unit Testing

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
//                // Registrar log del error internamente aquí
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
//                return BadRequest(ModelState); // Devuelve los errores exactos de DataAnnotations

//            try
//            {
//                int nuevoId = value.Insertar();

//                // Retorno 201 Created estandarizado con la ruta del nuevo recurso
//                return Created(new Uri(Request.RequestUri + "/" + nuevoId), new { IdGenerado = nuevoId, Mensaje = "Hoja de Ruta creada con éxito." });
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


//using API_SITMAS.Models;
//using System;
//using System.Collections.Generic;
//using System.Web.Http;

//namespace API_SITMAS.Controllers
//{
//    [RoutePrefix("api/hojaruta")]
//    public class HojaRutaController : ApiController
//    {
//        // GET: api/hojaruta (Listar todas las cabeceras)
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

//        // POST: api/hojaruta (Crear una cabecera)
//        [HttpPost]
//        [Route("")]
//        public IHttpActionResult Insertar([FromBody] HojaRuta value)
//        {
//            if (value == null) return BadRequest("Los datos enviados no son válidos.");

//            try
//            {
//                int nuevoId = value.Insertar();
//                return Ok(new { IdGenerado = nuevoId, Mensaje = "Hoja de Ruta creada con éxito." });
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        // PUT: api/hojaruta/5 (Modificar cabecera)
//        [HttpPut]
//        [Route("{id:int}")]
//        public IHttpActionResult Modificar(int id, [FromBody] HojaRuta value)
//        {
//            if (value == null) return BadRequest("Los datos enviados no son válidos.");

//            try
//            {
//                value.Id = id;
//                bool actualizado = value.Modificar();
//                if (!actualizado) return NotFound();

//                return Ok(new { Mensaje = "Hoja de Ruta actualizada correctamente." });
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        // DELETE: api/hojaruta/5 (Eliminar cabecera y sus detalles en cascada)
//        [HttpDelete]
//        [Route("{id:int}")]
//        public IHttpActionResult Borrar(int id)
//        {
//            try
//            {
//                HojaRuta oHojaRuta = new HojaRuta { Id = id };
//                bool eliminado = oHojaRuta.Borrar();
//                if (!eliminado) return NotFound();

//                return Ok(new { Mensaje = "Hoja de Ruta eliminada correctamente." });
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }
//    }
//}

