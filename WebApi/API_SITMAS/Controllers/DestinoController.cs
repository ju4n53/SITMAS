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
    public class DestinoController : ApiController
    {
        // GET: api/Destino
        [HttpGet]
        public List<AreaDestino> ListarTodo()
        {
            AreaDestino oAreaDestino = new AreaDestino();

            DataTable dt = oAreaDestino.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<AreaDestino>>(listaJson);

            return Lista;

        }

        // GET: api/Area/5
        //[HttpGet]

        //public Empleado ListarPorId(int id)
        //{
        //    Empleado oEmpleado = new Empleado();
        //    oEmpleado.Id = id;

        //    DataTable dt = oEmpleado.SelectId();

        //    var ListaJsom = JsonConvert.SerializeObject(dt);

        //    var obj = JsonConvert.DeserializeObject<List<Empleado>>(ListaJsom).ToList().FirstOrDefault();

        //    return obj;

        //}

        // POST: api/Area
        [HttpPost]
        public void Insertar([FromBody] AreaDestino value)
        {
            AreaDestino oAreaDestino = new AreaDestino();
            oAreaDestino.Destino = value.Destino;

            oAreaDestino.Insertar();
        }

        // PUT: api/Area/5
        [HttpPut]
        public void Modificar(int id, [FromBody] AreaDestino value)
        {

            AreaDestino oAreaDestino = new AreaDestino();
            oAreaDestino.IdDestino = id;
            oAreaDestino.Destino = value.Destino;

            oAreaDestino.Modificar();

        }

        // DELETE: api/Area/5
        [HttpDelete]

        public void Borrar(int id)
        {

            AreaDestino oAreaDestino = new AreaDestino();
            oAreaDestino.IdDestino = id;

            oAreaDestino.Borrar();

        }

        //[HttpGet]
        //public List<Empleado> ListarVista()
        //{
        //    Empleado oEmpleado = new Empleado();

        //    var dt = oEmpleado.VistalistadoEmpleados();

        //    var ListaJsom = JsonConvert.SerializeObject(dt);

        //    var Lista = JsonConvert.DeserializeObject<List<Empleado>>(ListaJsom);
        //    return Lista;

        //}

    }
}
