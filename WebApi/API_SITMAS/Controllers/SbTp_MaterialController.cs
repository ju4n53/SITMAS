using API_SITMAS.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Net;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/SbTp_Material")]
    public class SbTp_MaterialController : ApiController
    {
        // GET: api/SbTp_Material
        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                SubtipoMaterial oSubtipoMaterial = new SubtipoMaterial();
                DataTable dt = oSubtipoMaterial.SelectAll();
                var listaJson = JsonConvert.SerializeObject(dt);
                var lista = JsonConvert.DeserializeObject<List<SubtipoMaterial>>(listaJson);

                return Ok(lista);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // POST: api/SbTp_Material
        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] SubtipoMaterial value)
        {
            if (value == null) return BadRequest("Los datos no pueden ser nulos.");
            try
            {
                value.Insertar();
                return Ok(new { mensaje = "Subtipo registrado con éxito." });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // PUT: api/SbTp_Material/5
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] SubtipoMaterial value)
        {
            if (value == null) return BadRequest("Los datos no pueden ser nulos.");
            try
            {
                value.IdSubtipoM = id;
                value.Modificar();
                return Ok(new { mensaje = "Subtipo modificado correctamente." });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // DELETE: api/SbTp_Material/5
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                SubtipoMaterial oSubtipoMaterial = new SubtipoMaterial { IdSubtipoM = id };
                oSubtipoMaterial.Borrar();
                return Ok(new { mensaje = "Subtipo eliminado con éxito." });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }
    }
}