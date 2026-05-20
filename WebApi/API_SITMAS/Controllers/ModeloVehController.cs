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
    public class ModeloVehController : ApiController
    {
        // GET: api/ModeloVeh
        [HttpGet]
        public List<ModeloVehi> ListarTodo()
        {
            ModeloVehi oModeloVeh = new ModeloVehi();

            DataTable dt = oModeloVeh.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<ModeloVehi>>(listaJson);

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

        // POST: api/ModeloVeh
        [HttpPost]
        public void Insertar([FromBody] ModeloVehi value)
        {
            ModeloVehi oModeloVeh = new ModeloVehi();
            oModeloVeh.ModeloVehiculo = value.ModeloVehiculo;
            oModeloVeh.Id_Marca = value.Id_Marca;

            oModeloVeh.Insertar();
        }

        // PUT: api/ModeloVeh/5
        [HttpPut]
        public void Modificar(int id, [FromBody] ModeloVehi value)
        {

            ModeloVehi oModeloVeh = new ModeloVehi();
            oModeloVeh.Id = id;
            oModeloVeh.ModeloVehiculo = value.ModeloVehiculo;
            oModeloVeh.Id_Marca = value.Id_Marca;

            oModeloVeh.Modificar();

        }

        // DELETE: api/ModeloVeh/5
        [HttpDelete]

        public void Borrar(int id)
        {

            ModeloVehi oModeloVeh = new ModeloVehi();
            oModeloVeh.Id = id;
            oModeloVeh.Borrar();

        }

      

    }
}
