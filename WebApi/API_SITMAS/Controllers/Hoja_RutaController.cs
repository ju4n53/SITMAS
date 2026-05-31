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
    public class HojaRutaController : ApiController
    {
        // GET: api/HojaRuta
        [HttpGet]
        public List<HojaRuta> ListarTodo()
        {
            HojaRuta oHojaRuta = new HojaRuta();

            DataTable dt = oHojaRuta.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<HojaRuta>>(listaJson);

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

        // POST: api/HojaRuta
        [HttpPost]
        public void Insertar([FromBody] HojaRuta value)
        {
            HojaRuta oHojaRuta = new HojaRuta();
            oHojaRuta.HojaRutaFecha = value.HojaRutaFecha;
            oHojaRuta.Id_Vehiculo = value.Id_Vehiculo;
            oHojaRuta.Id_Chofer = value.Id_Chofer;
            oHojaRuta.Id_Estado = value.Id_Estado;

            oHojaRuta.Insertar();
        }

        // PUT: api/HojaRuta/5
        [HttpPost]
        public void Modificar(int id, [FromBody] HojaRuta value)
        {

            HojaRuta oHojaRuta = new HojaRuta();
            oHojaRuta.Id = id;
            oHojaRuta.HojaRutaFecha = value.HojaRutaFecha;
            oHojaRuta.Id_Vehiculo = value.Id_Vehiculo;
            oHojaRuta.Id_Chofer = value.Id_Chofer;
            oHojaRuta.Id_Estado = value.Id_Estado;

            oHojaRuta.Modificar();
        }

        // DELETE: api/HojaRuta/5
        [HttpPost]

        public void Borrar(int id)
        {

            HojaRuta oHojaRuta = new HojaRuta();
            oHojaRuta.Id = id;

            oHojaRuta.Borrar();

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
