using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
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

        /// <summary>
        /// URL de consumo: api/hojaruta/hoy
        /// </summary>
        [HttpGet]
        [Route("hoy")]
        public IHttpActionResult ListarHoy()
        {
            try
            {
                HojaRuta oHojaRuta = new HojaRuta();
                List<HojaRuta> lista = oHojaRuta.SelectHoy();

                return Ok(lista); // Si no hay rutas, devuelve una lista vacía [], lo cual es correcto.
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
        /// Actualización parcial de la distancia total del circuito cerrado.
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

        // DTO exclusivamente para recibir el usuario desde el Frontend
        public class InicioViajeDto
        {
            public int IdUsuario { get; set; }
        }

        [HttpPatch]
        [Route("{id:int}/iniciar")]
        public IHttpActionResult Iniciar(int id, [FromBody] InicioViajeDto datos)
        {
            if (datos == null || datos.IdUsuario <= 0)
                return BadRequest("Debe proporcionar un ID de usuario válido.");

            try
            {
                HojaRuta oHoja = new HojaRuta();
                oHoja.IniciarViaje(id, datos.IdUsuario);

                return Ok(new { Mensaje = "¡Viaje iniciado con éxito! Conduce con cuidado." });
            }
            catch (SqlException sqlEx)
            {
                // Aquí capturamos los RAISERROR que programamos en SQL Server
                // Ej: "Esta hoja de ruta ya fue iniciada..."
                return BadRequest(sqlEx.Message);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        // DTO para recibir la distancia al finalizar
        public class FinalizarViajeDto
        {
            public decimal DistanciaTotal { get; set; }
        }

        [HttpPatch]
        [Route("{id:int}/finalizar")]
        public IHttpActionResult Finalizar(int id, [FromBody] FinalizarViajeDto datos)
        {
            if (id <= 0)
                return BadRequest("El ID de la Hoja de Ruta no es válido.");

            try
            {
                decimal distancia = datos != null ? datos.DistanciaTotal : 0m;

                HojaRuta oHoja = new HojaRuta();
                oHoja.FinalizarViaje(id, distancia);

                return Ok(new { Mensaje = "Viaje finalizado correctamente. ¡Buen trabajo!" });
            }
            catch (SqlException sqlEx)
            {
                // Capturamos las excepciones lanzadas por RAISERROR en SQL Server
                return BadRequest(sqlEx.Message);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        /// <summary>
        /// URL de consumo: api/hojaruta/rango?desde=2024-01-01&hasta=2024-01-31
        /// </summary>
        [HttpGet]
        [Route("rango")]
        public IHttpActionResult ListarPorRango([FromUri] DateTime desde, [FromUri] DateTime hasta)
        {
            try
            {
                // Validamos que el rango tenga sentido lógico
                if (desde > hasta)
                {
                    return BadRequest("La fecha 'desde' no puede ser mayor que la fecha 'hasta'.");
                }

                HojaRuta oHojaRuta = new HojaRuta();
                List<HojaRuta> lista = oHojaRuta.SelectPorRangoFechas(desde, hasta);

                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

    }

}
