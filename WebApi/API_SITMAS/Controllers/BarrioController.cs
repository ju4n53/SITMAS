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
    public class BarrioController : ApiController
    {
        // GET: api/Barrio
        [HttpGet]
        public List<Barrios> ListarTodo()
        {
            Barrios oBarrio = new Barrios();

            DataTable dt = oBarrio.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Barrios>>(listaJson);

            return Lista;

        }

        // GET: api/Barrio/5
        public string Get(int id)
        {
            return "value";
        }

        // POST: api/Barrio
        public void Post([FromBody]string value)
        {
        }

        // PUT: api/Barrio/5
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE: api/Barrio/5
        public void Delete(int id)
        {
        }
    }
}
