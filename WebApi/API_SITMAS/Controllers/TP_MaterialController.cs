using API_SITMAS.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Net;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/TP_Material")]
    public class TP_MaterialController : ApiController
    {
        // GET: api/TP_Material
        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                Tipo_Material oTipoMaterial = new Tipo_Material();
                DataTable dt = oTipoMaterial.SelectAll();
                var listaJson = JsonConvert.SerializeObject(dt);
                var lista = JsonConvert.DeserializeObject<List<Tipo_Material>>(listaJson);

                return Ok(lista);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // POST: api/TP_Material
        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] Tipo_Material value)
        {
            if (value == null) return BadRequest("Datos inválidos.");
            try
            {
                Tipo_Material oTipoMaterial = new Tipo_Material
                {
                    TipoMaterial = value.TipoMaterial
                };
                oTipoMaterial.Insertar();
                return Ok("Tipo de material registrado correctamente.");
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // PUT: api/TP_Material/5
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] Tipo_Material value)
        {
            if (value == null) return BadRequest("Datos inválidos.");
            try
            {
                Tipo_Material oTipoMaterial = new Tipo_Material
                {
                    IdTipoMaterial = id,
                    TipoMaterial = value.TipoMaterial
                };
                oTipoMaterial.Modificar();
                return Ok("Tipo de material actualizado.");
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // DELETE: api/TP_Material/5
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                Tipo_Material oTipoMaterial = new Tipo_Material { IdTipoMaterial = id };
                oTipoMaterial.Borrar();
                return Ok("Tipo de material eliminado.");
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }
    }
}