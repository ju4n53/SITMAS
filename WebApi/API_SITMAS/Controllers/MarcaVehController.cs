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
    public class MarcaVehController : ApiController
    {
        // GET: api/MarcaVeh
        [HttpGet]
        public List<MarcaVehi> ListarTodo()
        {
            MarcaVehi oMarcaVeh= new MarcaVehi();

            DataTable dt = oMarcaVeh.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<MarcaVehi>>(listaJson);

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

        // POST: api/MarcaVeh
        [HttpPost]
        public void Insertar([FromBody] MarcaVehi value)
        {
            MarcaVehi oMarcaVeh = new MarcaVehi();
            oMarcaVeh.MarcaVehiculo = value.MarcaVehiculo;

            oMarcaVeh.Insertar();
        }

        // PUT: api/MarcaVeh/5
        [HttpPut]
        public void Modificar(int id, [FromBody] MarcaVehi value)
        {

            MarcaVehi oMarcaVeh = new MarcaVehi();
            oMarcaVeh.Id = id;
            oMarcaVeh.MarcaVehiculo = value.MarcaVehiculo;

            oMarcaVeh.Modificar();

        }

        // DELETE: api/MarcaVeh/5
        [HttpDelete]

        public void Borrar(int id)
        {

            MarcaVehi oMarcaVeh = new MarcaVehi();
            oMarcaVeh.Id = id;

            oMarcaVeh.Borrar();

        }

        
    }
}
