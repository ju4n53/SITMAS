using API_SITMAS.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    //[EnableCors(origins: "http://127.0.0.1:5501", headers: "*", methods: "*")]

    [RoutePrefix("api/MovimientoSalida")]
    public class MovimientoSalidaController : ApiController
    {

        // GET: api/MovimientoSalida
        [HttpGet]
        [Route("ListarTodo")]
        public List<MovimientoSalida> ListarTodo()
        {
            MovimientoSalida oMovimientoSalida = new MovimientoSalida();
            DataTable dt = oMovimientoSalida.ListarMovimientoSalida();
            var listaJson = JsonConvert.SerializeObject(dt);
            return JsonConvert.DeserializeObject<List<MovimientoSalida>>(listaJson);
        }

        // POST: api/MovimientoSalida
        [HttpPost]
        [Route("")]
        public IHttpActionResult RegistrarSalida([FromBody] MovimientoSalida value)
        {
            if (value == null) return BadRequest("Los datos del movimiento de salida son inválidos.");

            // Validaciones básicas de seguridad previo pasar ala BD
            if (string.IsNullOrEmpty(value.TipoMovimiento)) return BadRequest("El tipo de movimiento es obligatorio.");
            if (value.Id_SubTipo_Material <= 0) return BadRequest("Debe especificar un subtipo de material válido.");
            if (value.PesoRetirado <= 0) return BadRequest("El peso a retirar debe ser mayor a 0 kg.");

            try
            {
                // Delegamos la acción al objeto del modelo
                value.InsertarSalida();
                return Ok("Movimiento de salida registrado y stock actualizado con éxito.");
            }
            catch (SqlException ex)
            {
                // Si el SP lanza RAISERROR de falta de stock,
                // se muestra el número de error + mensaje de la BD
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                // Cualquier otro fallo del servidor 
                return InternalServerError(ex);
            }
        }

        private StockManager _stockManager = new StockManager();

        [HttpGet]
        [Route("StockNeto")]
        public IHttpActionResult GetStockActualNeto()
        {
            try
            {
                DataTable dt = _stockManager.ObtenerStockNeto();
                var json = JsonConvert.SerializeObject(dt);
                var resultado = JsonConvert.DeserializeObject<List<StockActualNeto>>(json);

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }

        }
    }
}