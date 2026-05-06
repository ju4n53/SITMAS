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
    public class CargoController : ApiController
    {
        // GET: api/Cargo
        [HttpGet]
        public List<Cargos> ListarTodo()
        {
            Cargos oCargo = new Cargos();

            DataTable dt = oCargo.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Cargos>>(listaJson);

            return Lista;

        }

        // GET: api/Cargo/5
        public string Get(int id)
        {
            return "value";
        }

        // POST: api/Cargo
        public void Post([FromBody]string value)
        {
        }

        // PUT: api/Cargo/5
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE: api/Cargo/5
        public void Delete(int id)
        {
        }
    }
}
