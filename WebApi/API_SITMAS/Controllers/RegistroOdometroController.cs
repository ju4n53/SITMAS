using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/registroodometro")]
    public class RegistroOdometroController : ApiController
    {
        // =====================================================================
        // 1. ENDPOINTS DE ADMINISTRACIÓN (ABM MANUAL)
        // =====================================================================

        [HttpGet]
        [Route("")]
        public IHttpActionResult ObtenerTodos([FromUri] int? idVehiculo = null)
        {
            try
            {
                RegistroOdometro oRegistro = new RegistroOdometro();
                List<RegistroOdometro> lista = oRegistro.ObtenerTodos(idVehiculo);

                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult InsertarManual([FromBody] RegistroOdometro value)
        {
            if (value == null) return BadRequest("Los datos están vacíos.");
            if (value.IdVehiculo <= 0) return BadRequest("Vehículo inválido.");
            if (value.FinalOdom < value.InicioOdom) return BadRequest("El odómetro final no puede ser menor al inicial.");

            try
            {
                bool creado = value.Insertar(); // Llama al SP Manual
                if (creado) return Ok(new { Mensaje = "Registro manual guardado correctamente." });
                return BadRequest("No se pudo completar el registro.");
            }
            catch (SqlException sqlEx) { return BadRequest(sqlEx.Message); }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult ModificarManual(int id, [FromBody] RegistroOdometro value)
        {
            if (value == null)
                return BadRequest("Los datos enviados no son válidos.");

            if (id <= 0)
                return BadRequest("El ID del registro debe ser un entero positivo.");

            if (value.FinalOdom < value.InicioOdom)
                return BadRequest("El odómetro final no puede ser menor al inicial.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                value.IdRegistroOdomet = id;
                bool actualizado = value.Modificar();

                if (!actualizado)
                    return NotFound();

                return Ok(new { Mensaje = "Registro de odómetro actualizado correctamente." });
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

        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Borrar(int id)
        {
            if (id <= 0)
                return BadRequest("El ID a eliminar no es válido.");

            try
            {
                RegistroOdometro oRegistro = new RegistroOdometro { IdRegistroOdomet = id };
                bool eliminado = oRegistro.Borrar();

                if (!eliminado)
                    return NotFound();

                return Ok(new { Mensaje = "Registro de odómetro eliminado correctamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        // =====================================================================
        // 2. ENDPOINTS OPERATIVOS (USO EXCLUSIVO DEL CHOFER / APP)
        // =====================================================================

        [HttpPost]
        [Route("iniciar-ruta")]
        public IHttpActionResult IniciarRuta([FromBody] RegistroOdometro value)
        {
            if (value == null || value.IdVehiculo <= 0 || value.Id_HojaRuta <= 0)
                return BadRequest("Faltan datos clave (Vehículo o Hoja de Ruta) para iniciar el viaje.");

            try
            {
                int nuevoId = value.IniciarRutaChofer(); // El método que creamos en el paso anterior

                if (nuevoId > 0)
                    return Ok(new { Mensaje = "Odómetro inicial registrado.", IdRegistroOdomet = nuevoId });

                return BadRequest("No se pudo registrar el inicio del odómetro.");
            }
            catch (SqlException sqlEx) { return BadRequest(sqlEx.Message); }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpPut]
        [Route("finalizar-ruta/{idRegistroOdomet:int}")]
        public IHttpActionResult FinalizarRuta(int idRegistroOdomet, [FromBody] RegistroOdometro value)
        {
            if (value == null || value.FinalOdom <= 0)
                return BadRequest("Debe ingresar un valor final válido del odómetro.");

            try
            {
                value.IdRegistroOdomet = idRegistroOdomet;
                bool actualizado = value.FinalizarRutaChofer(); // El método que invoca al súper SP con transacción

                if (actualizado)
                    return Ok(new { Mensaje = "Viaje finalizado y consumo calculado exitosamente." });

                return NotFound();
            }
            catch (SqlException sqlEx) { return BadRequest(sqlEx.Message); }
            catch (Exception ex) { return InternalServerError(ex); }
        }
    }
}






//using API_SITMAS.Models;
//using System;
//using System.Collections.Generic;
//using System.Data.SqlClient;
//using System.Web.Http;

//namespace API_SITMAS.Controllers
//{
//    [RoutePrefix("api/registroodometro")]
//    public class RegistroOdometroController : ApiController
//    {
//        [HttpGet]
//        [Route("")]
//        public IHttpActionResult ObtenerTodos([FromUri] int? idVehiculo = null)
//        {
//            try
//            {
//                RegistroOdometro oRegistro = new RegistroOdometro();
//                List<RegistroOdometro> lista = oRegistro.ObtenerTodos(idVehiculo);

//                return Ok(lista);
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        [HttpPost]
//        [Route("")]
//        public IHttpActionResult Insertar([FromBody] RegistroOdometro value)
//        {
//            if (value == null)
//                return BadRequest("Los datos del registro de odómetro no son válidos.");

//            if (value.IdVehiculo <= 0)
//                return BadRequest("Debe seleccionar un vehículo válido.");

//            if (value.FinalOdom < value.InicioOdom)
//                return BadRequest("El odómetro final no puede ser menor al inicial del mismo día.");

//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            try
//            {
//                bool creado = value.Insertar();

//                if (creado)
//                    return Ok(new { Mensaje = "Registro de odómetro guardado correctamente." });

//                return BadRequest("No se pudo completar el registro.");
//            }
//            catch (SqlException sqlEx)
//            {
//                // Capturamos la validación de regla de negocio emitida por el RAISERROR del SP
//                return BadRequest(sqlEx.Message);
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        [HttpPut]
//        [Route("{id:int}")]
//        public IHttpActionResult Modificar(int id, [FromBody] RegistroOdometro value)
//        {
//            if (value == null)
//                return BadRequest("Los datos enviados no son válidos.");

//            if (id <= 0)
//                return BadRequest("El ID del registro debe ser un entero positivo.");

//            if (value.FinalOdom < value.InicioOdom)
//                return BadRequest("El odómetro final no puede ser menor al inicial.");

//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            try
//            {
//                value.IdRegistroOdomet = id;
//                bool actualizado = value.Modificar();

//                if (!actualizado)
//                    return NotFound();

//                return Ok(new { Mensaje = "Registro de odómetro actualizado correctamente." });
//            }
//            catch (SqlException sqlEx)
//            {
//                return BadRequest(sqlEx.Message);
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
//                return BadRequest("El ID a eliminar no es válido.");

//            try
//            {
//                RegistroOdometro oRegistro = new RegistroOdometro { IdRegistroOdomet = id };
//                bool eliminado = oRegistro.Borrar();

//                if (!eliminado)
//                    return NotFound();

//                return Ok(new { Mensaje = "Registro de odómetro eliminado correctamente." });
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }
//    }
//}