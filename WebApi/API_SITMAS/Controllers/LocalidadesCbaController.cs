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
    public class LocalidadesCbaController : ApiController
    {
        // GET: api/LocalidadesCba
        [HttpGet]
        public List<LocalidadesCba> ListarTodo()
        {
            LocalidadesCba oLocalidad = new LocalidadesCba();

            DataTable dt = oLocalidad.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<LocalidadesCba>>(listaJson);

            return Lista;

        }

       
    }
}
