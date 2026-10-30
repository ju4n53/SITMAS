using API_SITMAS.Models;
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/Barrio")]
    public class BarrioController : ApiController
    {
        private readonly BarrioDatos _datos = new BarrioDatos();

        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                return Ok(_datos.SelectAll());
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpGet]
        [Route("Localidad/{idLocalidad:int}")]
        public IHttpActionResult ListarPorLocalidad(int idLocalidad)
        {
            try
            {
                return Ok(_datos.SelectPorLocalidad(idLocalidad));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] Barrios value)
        {
            if (value == null || string.IsNullOrWhiteSpace(value.Barrio))
                return BadRequest("El nombre del barrio es requerido.");

            try
            {
                int id = _datos.Insertar(value);
                return Ok(new { mensaje = "Barrio guardado exitosamente.", id = id });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] Barrios value)
        {
            if (value == null) return BadRequest("Datos requeridos.");

            try
            {
                value.Id = id;
                _datos.Modificar(value);
                return Ok(new { mensaje = "Barrio modificado correctamente." });
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
            try
            {
                _datos.Borrar(id);
                return Ok(new { mensaje = "Barrio eliminado." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
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
//    public class BarrioController : ApiController
//    {
//        // GET: api/Barrio
//        [HttpGet]
//        public List<Barrios> ListarTodo()
//        {
//            Barrios oBarrio = new Barrios();

//            DataTable dt = oBarrio.SelectAll();
//            var listaJson = JsonConvert.SerializeObject(dt);

//            var Lista = JsonConvert.DeserializeObject<List<Barrios>>(listaJson);

//            return Lista;

//        }

//        // GET: api/Barrio/5
//        public string Get(int id)
//        {
//            return "value";
//        }

//        // POST: api/Barrio
//        public void Post([FromBody]string value)
//        {
//        }

//        // PUT: api/Barrio/5
//        public void Put(int id, [FromBody]string value)
//        {
//        }

//        // DELETE: api/Barrio/5
//        public void Delete(int id)
//        {
//        }
//    }
//}
