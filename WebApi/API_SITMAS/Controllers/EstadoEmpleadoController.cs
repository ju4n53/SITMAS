using API_SITMAS.Models;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    public class EstadoEmpleadoController : ApiController
    {
        // GET: api/EstadoEmpleado
        [HttpGet]
        public List<Estado_Empleado> ListarTodo()
        {
            Estado_Empleado oEstadoEmpleado = new Estado_Empleado();

            DataTable dt = oEstadoEmpleado.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Estado_Empleado>>(listaJson);

            return Lista;

        }

        // GET: api/EstadoEmpleado/5
        public string Get(int id)
        {
            return "value";
        }

        // POST: api/EstadoEmpleado
        public void Post([FromBody]string value)
        {
        }

        // PUT: api/EstadoEmpleado/5
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE: api/EstadoEmpleado/5
        public void Delete(int id)
        {
        }
    }
}
