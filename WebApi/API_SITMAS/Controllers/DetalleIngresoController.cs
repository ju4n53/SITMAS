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
                List<Detalle_Ingreso> lista = oDetalleIngreso.SelectAll();
                return Ok(lista);
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
                List<Detalle_Ingreso> lista = oDetalle.SelectPorCabecera(idCabecera);
                return Ok(lista);
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

        // GET: api/DetalleIngreso/PendientesPesaje?desde=2026-10-01&hasta=2026-10-25
        [HttpGet]
        [Route("PendientesPesaje")]
        public IHttpActionResult GetPendientesPesaje(DateTime? desde = null, DateTime? hasta = null)
        {
            try
            {
                Detalle_Ingreso oDetalle = new Detalle_Ingreso();
                List<PendientePesaje> lista = oDetalle.SelectPendientesPesaje(desde, hasta);
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // GET: api/DetalleIngreso/RemitoOrigen
        // GET: api/DetalleIngreso/RemitoOrigen?idIngreso=5
        [HttpGet]
        [Route("RemitoOrigen")]
        public IHttpActionResult GetRemitoOrigen(int? idIngreso = null)
        {
            try
            {
                Detalle_Ingreso oDetalle = new Detalle_Ingreso();
                List<RemitoOrigenDTO> lista = oDetalle.SelectRemitoOrigen(idIngreso);
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
//using System;
//using System.Collections.Generic;
//using System.Net;
//using System.Web.Http;
//using static API_SITMAS.Models.Detalle_Ingreso;

//namespace API_SITMAS.Controllers
//{
//    [RoutePrefix("api/DetalleIngreso")]
//    public class DetalleIngresoController : ApiController
//    {
//        // GET: api/DetalleIngreso
//        [HttpGet]
//        [Route("")]
//        public IHttpActionResult ListarTodo()
//        {
//            try
//            {
//                Detalle_Ingreso oDetalleIngreso = new Detalle_Ingreso();
//                List<Detalle_Ingreso> Lista = oDetalleIngreso.SelectAll();
//                return Ok(Lista);
//            }
//            catch (Exception ex)
//            {
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
//            }
//        }

//        // GET: api/DetalleIngreso/PorCabecera/5
//        [HttpGet]
//        [Route("PorCabecera/{idCabecera}")]
//        public IHttpActionResult PorCabecera(int idCabecera)
//        {
//            try
//            {
//                Detalle_Ingreso oDetalle = new Detalle_Ingreso();
//                List<Detalle_Ingreso> Lista = oDetalle.SelectPorCabecera(idCabecera);
//                return Ok(Lista);
//            }
//            catch (Exception ex)
//            {
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
//            }
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
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
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
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
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
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
//            }
//        }

//        // GET: api/DetalleIngreso/PendientesClasificacion/5
//        [HttpGet]
//        [Route("PendientesClasificacion/{idIngreso}")]
//        public IHttpActionResult ListarPendientesClasificacion(int idIngreso)
//        {
//            try
//            {
//                Detalle_Ingreso oDetalle = new Detalle_Ingreso();
//                List<Detalle_Ingreso> lista = oDetalle.SelectPendientesClasificacion(idIngreso);
//                return Ok(lista);
//            }
//            catch (Exception ex)
//            {
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
//            }
//        }



//        // GET: api/DetalleIngreso/PendientesPesaje?desde=2026-10-01&hasta=2026-10-25
//        [HttpGet]
//        [Route("PendientesPesaje")]
//        public IHttpActionResult GetPendientesPesaje(DateTime? desde = null, DateTime? hasta = null)
//        {
//            try
//            {
//                Detalle_Ingreso oDetalle = new Detalle_Ingreso();
//                List<PendientePesaje> lista = oDetalle.SelectPendientesPesaje(desde, hasta);
//                return Ok(lista);
//            }
//            catch (Exception ex)
//            {
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
//            }
//        }


//        // GET: api/DetalleIngreso/RemitoOrigen
//        // GET: api/DetalleIngreso/RemitoOrigen?idIngreso=5
//        [HttpGet]
//        [Route("RemitoOrigen")]
//        public IHttpActionResult GetRemitoOrigen(int? idIngreso = null)
//        {
//            try
//            {
//                Detalle_Ingreso oDetalle = new Detalle_Ingreso();
//                List<RemitoOrigenDTO> lista = oDetalle.SelectRemitoOrigen(idIngreso);
//                return Ok(lista);
//            }
//            catch (Exception ex)
//            {
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
//            }
//        }

//    }
//}
