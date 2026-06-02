using API_SITMAS.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    public class MaterialClasificadoController : ApiController
    {
        // GET: api/MaterialClasificado
        [HttpGet]
        public List<Material_Clasificado> ListarTodo()
        {
            Material_Clasificado oMaterial = new Material_Clasificado();

            DataTable dt = oMaterial.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Material_Clasificado>>(listaJson);

            return Lista;

        }

        // GET: api/Material_Clasificado/ListarVista
        [HttpGet]
        [Route("api/Material_Clasificado/ListarVista")]
        public List<Material_Clasificado> ListarVista()
        {
            Material_Clasificado oMaterial = new Material_Clasificado();
            DataTable dt = oMaterial.SelectVista();

            var listaJson = JsonConvert.SerializeObject(dt);
            return JsonConvert.DeserializeObject<List<Material_Clasificado>>(listaJson);
        }

        // POST: api/Material_Clasificado
        [HttpPost]
        public IHttpActionResult Insertar([FromBody] Material_Clasificado value)
        {
            if (value == null) return BadRequest("Datos de clasificación inválidos.");
            try
            {
                value.Insertar();
                return Ok("Clasificación de material y stock registrada con éxito.");
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Material_Clasificado/5
        [HttpPut]
        public IHttpActionResult Modificar(int id, [FromBody] Material_Clasificado value)
        {
            if (value == null) return BadRequest("Datos inválidos.");
            try
            {
                value.Id = id;
                value.Modificar();
                return Ok("Registro de stock clasificado modificado.");
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/Material_Clasificado/5
        [HttpDelete]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                Material_Clasificado oMaterial = new Material_Clasificado();
                oMaterial.Id = id;
                oMaterial.Borrar();
                return Ok("Clasificación anulada. El stock fue corregido.");
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


    }
}
