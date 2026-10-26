using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Net;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/MovimientoSalida")]
    public class MovimientoSalidaController : ApiController
    {
        private StockManager _stockManager = new StockManager();

        // GET: api/MovimientoSalida/ListarTodo
        [HttpGet]
        [Route("ListarTodo")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                MovimientoSalida oMovimientoSalida = new MovimientoSalida();
                List<MovimientoSalida> lista = oMovimientoSalida.SelectAll();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // POST: api/MovimientoSalida
        [HttpPost]
        [Route("")]
        public IHttpActionResult RegistrarSalida([FromBody] MovimientoSalida value)
        {
            if (value == null) return BadRequest("Los datos del movimiento de salida son inválidos.");

            if (string.IsNullOrEmpty(value.TipoMovimiento)) return BadRequest("El tipo de movimiento es obligatorio.");
            if (value.Id_SubTipo_Material <= 0) return BadRequest("Debe especificar un subtipo de material válido.");
            if (value.PesoRetirado <= 0) return BadRequest("El peso a retirar debe ser mayor a 0 kg.");
            if (value.Id_Empleado <= 0) return BadRequest("Debe especificar qué empleado registra el movimiento.");

            try
            {
                value.InsertarSalida();
                return Ok("Movimiento de salida registrado y stock actualizado con éxito.");
            }
            catch (SqlException ex)
            {
                return Content(HttpStatusCode.BadRequest, ex.Message);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // PUT: api/MovimientoSalida/5
        [HttpPut]
        [Route("{id}")]
        public IHttpActionResult Modificar(int id, [FromBody] MovimientoSalida value)
        {
            if (value == null) return BadRequest("Datos del movimiento inválidos.");

            try
            {
                value.IdSalida = id;
                value.Modificar();
                return Ok("Movimiento de salida modificado con éxito.");
            }
            catch (SqlException ex)
            {
                return Content(HttpStatusCode.BadRequest, ex.Message);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // DELETE: api/MovimientoSalida/5
        [HttpDelete]
        [Route("{id}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                MovimientoSalida oMovimiento = new MovimientoSalida();
                oMovimiento.IdSalida = id;
                oMovimiento.Borrar();
                return Ok("Movimiento de salida anulado correctamente. El stock ha sido restituido.");
            }
            catch (SqlException ex)
            {
                return Content(HttpStatusCode.BadRequest, ex.Message);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // GET: api/MovimientoSalida/StockNeto
        [HttpGet]
        [Route("StockNeto")]
        public IHttpActionResult GetStockActualNeto()
        {
            try
            {
                List<StockActualNeto> lista = _stockManager.ObtenerStockNeto();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }
    }
}




//using API_SITMAS.Models;
//using Newtonsoft.Json;
//using System;
//using System.Collections.Generic;
//using System.Data;
//using System.Data.SqlClient;
//using System.Web.Http;

//namespace API_SITMAS.Controllers
//{
//    //[EnableCors(origins: "http://127.0.0.1:5501", headers: "*", methods: "*")]

//    [RoutePrefix("api/MovimientoSalida")]
//    public class MovimientoSalidaController : ApiController
//    {

//        // GET: api/MovimientoSalida
//        [HttpGet]
//        [Route("ListarTodo")]
//        public List<MovimientoSalida> ListarTodo()
//        {
//            MovimientoSalida oMovimientoSalida = new MovimientoSalida();
//            DataTable dt = oMovimientoSalida.ListarMovimientoSalida();
//            var listaJson = JsonConvert.SerializeObject(dt);
//            return JsonConvert.DeserializeObject<List<MovimientoSalida>>(listaJson);
//        }

//        // POST: api/MovimientoSalida
//        [HttpPost]
//        [Route("")]
//        public IHttpActionResult RegistrarSalida([FromBody] MovimientoSalida value)
//        {
//            if (value == null) return BadRequest("Los datos del movimiento de salida son inválidos.");

//            // Validaciones básicas de seguridad previo pasar ala BD
//            if (string.IsNullOrEmpty(value.TipoMovimiento)) return BadRequest("El tipo de movimiento es obligatorio.");
//            if (value.Id_SubTipo_Material <= 0) return BadRequest("Debe especificar un subtipo de material válido.");
//            if (value.PesoRetirado <= 0) return BadRequest("El peso a retirar debe ser mayor a 0 kg.");

//            try
//            {
//                // Delegamos la acción al objeto del modelo
//                value.InsertarSalida();
//                return Ok("Movimiento de salida registrado y stock actualizado con éxito.");
//            }
//            catch (SqlException ex)
//            {
//                // Si el SP lanza RAISERROR de falta de stock,
//                // se muestra el número de error + mensaje de la BD
//                return BadRequest(ex.Message);
//            }
//            catch (Exception ex)
//            {
//                // Cualquier otro fallo del servidor 
//                return InternalServerError(ex);
//            }
//        }

//        private StockManager _stockManager = new StockManager();

//        [HttpGet]
//        [Route("StockNeto")]
//        public IHttpActionResult GetStockActualNeto()
//        {
//            try
//            {
//                DataTable dt = _stockManager.ObtenerStockNeto();
//                var json = JsonConvert.SerializeObject(dt);
//                var resultado = JsonConvert.DeserializeObject<List<StockActualNeto>>(json);

//                return Ok(resultado);
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }

//        }
//    }
//}