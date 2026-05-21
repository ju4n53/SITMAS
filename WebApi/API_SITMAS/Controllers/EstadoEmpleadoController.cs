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

        // POST: api/EstadoEmpleado
        [HttpPost]
        public void Insertar([FromBody] Estado_Empleado value)
        {
            Estado_Empleado oEstado_Empleado = new Estado_Empleado();
            oEstado_Empleado.EstadoEmpleado = value.EstadoEmpleado;

            oEstado_Empleado.Insertar();
        }

        // PUT: api/Area/5
        [HttpPut]
        public void Modificar(int id, [FromBody] Estado_Empleado value)
        {

            Estado_Empleado oEstado_Empleado = new Estado_Empleado();
            oEstado_Empleado.Id = id;
            oEstado_Empleado.EstadoEmpleado = value.EstadoEmpleado;

            oEstado_Empleado.Modificar();

        }

        // DELETE: api/Area/5
        [HttpDelete]

        public void Borrar(int id)
        {

            Estado_Empleado oEstado_Empleado = new Estado_Empleado();
            oEstado_Empleado.Id = id;

            oEstado_Empleado.Borrar();

        }
    }
}
