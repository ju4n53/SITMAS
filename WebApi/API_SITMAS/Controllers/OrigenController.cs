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
    public class OrigenController : ApiController
    {
        // GET: api/Origen
        [HttpGet]
        public List<EmpresaOrigen> ListarTodo()
        {
            EmpresaOrigen oOrigen = new EmpresaOrigen();
            DataTable dt = oOrigen.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<EmpresaOrigen>>(listaJson);
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

        // POST: api/Origen
        [HttpPost]
        public void Insertar([FromBody] EmpresaOrigen value)
        {
            EmpresaOrigen oOrigen = new EmpresaOrigen();
            oOrigen.EmpresaInstitucion = value.EmpresaInstitucion;
            oOrigen.CalleEI = value.CalleEI;
            oOrigen.NumeroEI = value.NumeroEI;
            oOrigen.TelefonoEI = value.TelefonoEI;
            oOrigen.EmailEI = value.EmailEI;
            oOrigen.Id_Barrio = value.Id_Barrio;

            oOrigen.Insertar();
        }

        // PUT: api/Origen/5
        [HttpPut]
        public void Modificar(int id, [FromBody] EmpresaOrigen value)
        {

            EmpresaOrigen oOrigen = new EmpresaOrigen();
            oOrigen.IdOrigen = id;
            oOrigen.EmpresaInstitucion = value.EmpresaInstitucion;
            oOrigen.CalleEI = value.CalleEI;
            oOrigen.NumeroEI = value.NumeroEI;
            oOrigen.TelefonoEI = value.TelefonoEI;
            oOrigen.EmailEI = value.EmailEI;
            oOrigen.Id_Barrio = value.Id_Barrio;

            oOrigen.Modificar();

        }

        // DELETE: api/Origen/5
        [HttpDelete]

        public void Borrar(int id)
        {

            EmpresaOrigen oOrigen = new EmpresaOrigen();
            oOrigen.IdOrigen = id;

            oOrigen.Borrar();

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
