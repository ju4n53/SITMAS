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
    public class EST_HDRController : ApiController
    {
        // GET: api/EST_HDR
        [HttpGet]
        public List<Estado_Hoja_Ruta> ListarTodo()
        {
            Estado_Hoja_Ruta oEstadoHojaRuta = new Estado_Hoja_Ruta();

            DataTable dt = oEstadoHojaRuta.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Estado_Hoja_Ruta>>(listaJson);

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

        // POST: api/EST_HDR
        [HttpPost]
        public void Insertar([FromBody] Estado_Hoja_Ruta value)
        {
            Estado_Hoja_Ruta oEstadoHojaRuta = new Estado_Hoja_Ruta();
            oEstadoHojaRuta.EstadoHojaRuta = value.EstadoHojaRuta;
           
            oEstadoHojaRuta.Insertar();
        }

        // PUT: api/EST_HDR/5
        [HttpPut]
        public void Modificar(int id, [FromBody] Estado_Hoja_Ruta value)
        {

            Estado_Hoja_Ruta oEstadoHojaRuta = new Estado_Hoja_Ruta();
            oEstadoHojaRuta.Id = id;
            oEstadoHojaRuta.EstadoHojaRuta = value.EstadoHojaRuta;

            oEstadoHojaRuta.Modificar();

        }

        // DELETE: api/EST_HDR/5
        [HttpDelete]

        public void Borrar(int id)
        {

            Estado_Hoja_Ruta oEstadoHojaRuta = new Estado_Hoja_Ruta();
            oEstadoHojaRuta.Id = id;

            oEstadoHojaRuta.Borrar();

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
