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
    public class AreaController : ApiController
    {
        // GET: api/Area
        [HttpGet]
        public List<AreasTrabajo> ListarTodo()
        {
            AreasTrabajo oArea = new AreasTrabajo();

            DataTable dt = oArea.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<AreasTrabajo>>(listaJson);

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
        public void Insertar([FromBody] AreasTrabajo value)
        {
            AreasTrabajo oArea = new AreasTrabajo();
            oArea.Area = value.Area;
           
            oArea.Insertar();
        }

        // PUT: api/Area/5
        [HttpPut]
        public void Modificar(int id, [FromBody] AreasTrabajo value)
        {

            AreasTrabajo oArea = new AreasTrabajo();
            oArea.Id = id;
            oArea.Area = value.Area;

            oArea.Modificar();

        }

        // DELETE: api/Area/5
        [HttpDelete]

        public void Borrar(int id)
        {

            AreasTrabajo oArea = new AreasTrabajo();
            oArea.Id = id;

            oArea.Borrar();

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
