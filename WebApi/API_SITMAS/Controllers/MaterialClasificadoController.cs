using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Net;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/MaterialClasificado")]
    public class MaterialClasificadoController : ApiController
    {
        // GET: api/MaterialClasificado
        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                var oMaterial = new Material_Clasificado();
                List<Material_Clasificado> lista = oMaterial.SelectAll();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // GET: api/MaterialClasificado/ListarVista
        [HttpGet]
        [Route("ListarVista")]
        public IHttpActionResult ListarVista()
        {
            try
            {
                var oMaterial = new Material_Clasificado();
                List<Material_Clasificado> lista = oMaterial.SelectVista();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // GET: api/MaterialClasificado/Pendientes
        [HttpGet]
        [Route("Pendientes")]
        public IHttpActionResult ListarPendientes(
            int? idIngreso = null,
            DateTime? fechaEspecifica = null,
            DateTime? desde = null,
            DateTime? hasta = null)
        {
            try
            {
                var oMaterial = new Material_Clasificado();
                List<PendienteClasificacionDTO> pendientes = oMaterial.SelectPendientes(idIngreso, fechaEspecifica, desde, hasta);
                return Ok(pendientes);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // POST: api/MaterialClasificado
        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] Material_Clasificado value)
        {
            if (value == null) return BadRequest("Los datos de clasificación no pueden ser nulos.");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                int idGenerado = value.Insertar();
                return Ok(new { id = idGenerado, mensaje = "Clasificación de material y stock registrada con éxito." });
            }
            catch (SqlException ex)
            {
                // Captura las validaciones de negocio lanzadas por el RAISERROR en el SP
                return Content(HttpStatusCode.BadRequest, ex.Message);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // PUT: api/MaterialClasificado/5
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] Material_Clasificado value)
        {
            if (value == null) return BadRequest("Los datos a modificar no pueden ser nulos.");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                value.Id = id;
                value.Modificar();
                return Ok(new { mensaje = "Registro de stock clasificado modificado exitosamente." });
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

        // DELETE: api/MaterialClasificado/5
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                var oMaterial = new Material_Clasificado { Id = id };
                oMaterial.Borrar();
                return Ok(new { mensaje = "Clasificación anulada exitosamente." });
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
//using System.Data.SqlClient;
//using System.Net;
//using System.Web.Http;

//namespace API_SITMAS.Controllers
//{
//    [RoutePrefix("api/MaterialClasificado")]
//    public class MaterialClasificadoController : ApiController
//    {
//        // GET: api/MaterialClasificado
//        [HttpGet]
//        [Route("")]
//        public IHttpActionResult ListarTodo()
//        {
//            try
//            {
//                Material_Clasificado oMaterial = new Material_Clasificado();
//                List<Material_Clasificado> Lista = oMaterial.SelectAll();
//                return Ok(Lista);
//            }
//            catch (Exception ex)
//            {
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
//            }
//        }

//        // GET: api/MaterialClasificado/ListarVista
//        [HttpGet]
//        [Route("ListarVista")]
//        public IHttpActionResult ListarVista()
//        {
//            try
//            {
//                Material_Clasificado oMaterial = new Material_Clasificado();
//                List<Material_Clasificado> Lista = oMaterial.SelectVista();
//                return Ok(Lista);
//            }
//            catch (Exception ex)
//            {
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
//            }
//        }

//        // POST: api/MaterialClasificado
//        [HttpPost]
//        [Route("")]
//        public IHttpActionResult Insertar([FromBody] Material_Clasificado value)
//        {
//            if (value == null) return BadRequest("Datos de clasificación inválidos.");
//            try
//            {
//                int idGenerado = value.Insertar();
//                return Ok(new { id = idGenerado, mensaje = "Clasificación de material y stock registrada con éxito." });
//            }
//            catch (SqlException ex)
//            {
//                // Captura el RAISERROR del SP (ej: peso excedido) y lo devuelve como error 400 Bad Request
//                return Content(HttpStatusCode.BadRequest, ex.Message);
//            }
//            catch (Exception ex)
//            {
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
//            }
//        }

//        // PUT: api/MaterialClasificado/5
//        [HttpPut]
//        [Route("{id}")]
//        public IHttpActionResult Modificar(int id, [FromBody] Material_Clasificado value)
//        {
//            if (value == null) return BadRequest("Datos inválidos.");
//            try
//            {
//                value.Id = id;
//                value.Modificar();
//                return Ok("Registro de stock clasificado modificado.");
//            }
//            catch (SqlException ex)
//            {
//                return Content(HttpStatusCode.BadRequest, ex.Message);
//            }
//            catch (Exception ex)
//            {
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
//            }
//        }

//        // DELETE: api/MaterialClasificado/5
//        [HttpDelete]
//        [Route("{id}")]
//        public IHttpActionResult Borrar(int id)
//        {
//            try
//            {
//                Material_Clasificado oMaterial = new Material_Clasificado();
//                oMaterial.Id = id;
//                oMaterial.Borrar();
//                return Ok("Clasificación anulada. El stock fue corregido.");
//            }
//            catch (Exception ex)
//            {
//                return Content(HttpStatusCode.InternalServerError, ex.Message);
//            }
//        }
//    }
//}

