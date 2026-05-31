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
    public class VehiculoController : ApiController
    {
        // GET: api/Vehiculo
        [HttpGet]
        public List<Vehiculo> ListarTodo()
        {
            Vehiculo oVehiculo = new Vehiculo();

            DataTable dt = oVehiculo.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Vehiculo>>(listaJson);

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

        // POST: api/Vehiculo
        [HttpPost]
        public void Insertar([FromBody] Vehiculo value)
        {
            Vehiculo oVehiculo = new Vehiculo();
            oVehiculo.Patente = value.Patente;
            oVehiculo.Id_Modelo = value.Id_Modelo;
            oVehiculo.Id_Tipo = value.Id_Tipo;

            oVehiculo.Insertar();
        }

        // PUT: api/Vehiculo/5
        [HttpPost]
        public void Modificar(int id, [FromBody] Vehiculo value)
        {

            Vehiculo oVehiculo = new Vehiculo();
            oVehiculo.Id = id;
            oVehiculo.Patente = value.Patente;
            oVehiculo.Id_Modelo = value.Id_Modelo;
            oVehiculo.Id_Tipo = value.Id_Tipo;

            oVehiculo.Modificar();

        }

        // DELETE: api/Vehiculo/5
        [HttpPost]

        public void Borrar(int id)
        {

            Vehiculo oVehiculo = new Vehiculo();
            oVehiculo.Id = id;

            oVehiculo.Borrar();

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
