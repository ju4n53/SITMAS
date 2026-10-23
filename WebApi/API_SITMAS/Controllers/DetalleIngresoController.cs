using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Net;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/DetalleIngreso")]
    public class DetalleIngresoController : ApiController
    {
        // GET: api/DetalleIngreso
        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                Detalle_Ingreso oDetalleIngreso = new Detalle_Ingreso();
                List<Detalle_Ingreso> Lista = oDetalleIngreso.SelectAll();
                return Ok(Lista);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // GET: api/DetalleIngreso/PorCabecera/5
        [HttpGet]
        [Route("PorCabecera/{idCabecera}")]
        public IHttpActionResult PorCabecera(int idCabecera)
        {
            try
            {
                Detalle_Ingreso oDetalle = new Detalle_Ingreso();
                List<Detalle_Ingreso> Lista = oDetalle.SelectPorCabecera(idCabecera);
                return Ok(Lista);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // POST: api/DetalleIngreso
        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] Detalle_Ingreso value)
        {
            if (value == null) return BadRequest("Datos inválidos.");
            try
            {
                value.Insertar();
                return Ok("Pesada de material registrada en el camión.");
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // PUT: api/DetalleIngreso/5
        [HttpPut]
        [Route("{id}")]
        public IHttpActionResult Modificar(int id, [FromBody] Detalle_Ingreso value)
        {
            if (value == null) return BadRequest("Datos inválidos.");
            try
            {
                value.IdDetalleIngreso = id;
                value.Modificar();
                return Ok("Pesada de material modificada.");
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // DELETE: api/DetalleIngreso/5
        [HttpDelete]
        [Route("{id}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                Detalle_Ingreso oDetalle = new Detalle_Ingreso();
                oDetalle.IdDetalleIngreso = id;
                oDetalle.Borrar();
                return Ok("Pesada anulada correctamente.");
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // GET: api/DetalleIngreso/PendientesClasificacion/5
        [HttpGet]
        [Route("PendientesClasificacion/{idIngreso}")]
        public IHttpActionResult ListarPendientesClasificacion(int idIngreso)
        {
            try
            {
                Detalle_Ingreso oDetalle = new Detalle_Ingreso();
                List<Detalle_Ingreso> lista = oDetalle.SelectPendientesClasificacion(idIngreso);
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
//using System.Linq;
//using System.Net;
//using System.Net.Http;
//using System.Web.Http;

//namespace API_SITMAS.Controllers

//{
//     [RoutePrefix("api/DetalleIngreso")]
//    public class DetalleIngresoController : ApiController
//    {
//        // GET: api/DetalleIngreso
//        [HttpGet]
//        [Route("")]
//    public List<Detalle_Ingreso> ListarTodo()
//        {
//            Detalle_Ingreso oDetalleIngreso = new Detalle_Ingreso();

//            DataTable dt = oDetalleIngreso.SelectAll();
//            var listaJson = JsonConvert.SerializeObject(dt);

//            var Lista = JsonConvert.DeserializeObject<List<Detalle_Ingreso>>(listaJson);

//            return Lista;

//        }


//        // GET: api/Detalle_Ingreso/PorCabecera/5
//        // Trae los pesajes legibles asociados a un camión específico
//        [HttpGet]
//        [Route("PorCabecera/{idCabecera}")]
//        public List<Detalle_Ingreso> PorCabecera(int idCabecera)
//        {
//            Detalle_Ingreso oDetalle = new Detalle_Ingreso();
//            DataTable dt = oDetalle.SelectPorCabecera(idCabecera);

//            var listaJson = JsonConvert.SerializeObject(dt);
//            return JsonConvert.DeserializeObject<List<Detalle_Ingreso>>(listaJson);
//        }



//        // POST: api/DetalleIngreso
//        [HttpPost]
//        [Route("")]

//        public IHttpActionResult Insertar([FromBody] Detalle_Ingreso value)
//        {
//            if (value == null) return BadRequest("Datos inválidos.");
//            try
//            {
//                value.Insertar();
//                return Ok("Pesada de material registrada en el camión.");
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        // PUT: api/DetalleIngreso/5
//        [HttpPut]
//        [Route("{id}")]
//        public IHttpActionResult Modificar(int id, [FromBody] Detalle_Ingreso value)
//        {
//            if (value == null) return BadRequest("Datos inválidos.");
//            try
//            {
//                value.IdDetalleIngreso = id;
//                value.Modificar();
//                return Ok("Pesada de material modificada.");
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }

//        // DELETE: api/DetalleIngreso/5
//        [HttpDelete]
//        [Route("{id}")]
//        public IHttpActionResult Borrar(int id)
//        {
//            try
//            {
//                Detalle_Ingreso oDetalle = new Detalle_Ingreso();
//                oDetalle.IdDetalleIngreso = id;
//                oDetalle.Borrar();
//                return Ok("Pesada anulada correctamente.");
//            }
//            catch (Exception ex)
//            {
//                return InternalServerError(ex);
//            }
//        }





//    }
//}
