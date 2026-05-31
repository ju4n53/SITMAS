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
    public class Tp_VehiculoController : ApiController
    {
        // GET: api/Tp_Vehiculo
        [HttpGet]
        public List<Tipo_Vehiculo> ListarTodo()
        {
            Tipo_Vehiculo oTipoVehiculo = new Tipo_Vehiculo();

            DataTable dt = oTipoVehiculo.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Tipo_Vehiculo>>(listaJson);

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

        // POST: api/Tp_Vehiculo
        [HttpPost]
        public void Insertar([FromBody] Tipo_Vehiculo value)
        {
            Tipo_Vehiculo oTipoVehiculo = new Tipo_Vehiculo();
            oTipoVehiculo.TipoVehiculo = value.TipoVehiculo;

            oTipoVehiculo.Insertar();
        }

        // PUT: api/Tp_Vehiculo/5
        [HttpPost]
        public void Modificar(int id, [FromBody] Tipo_Vehiculo value)
        {

            Tipo_Vehiculo oTipoVehiculo = new Tipo_Vehiculo();
            oTipoVehiculo.Id = id;
            oTipoVehiculo.TipoVehiculo = value.TipoVehiculo;

            oTipoVehiculo.Modificar();

        }

        // DELETE: api/Tp_Vehiculo/5
        [HttpPost]

        public void Borrar(int id)
        {

            Tipo_Vehiculo oTipoVehiculo = new Tipo_Vehiculo();
            oTipoVehiculo.Id = id;

            oTipoVehiculo.Borrar();

        }

        
    }
}
