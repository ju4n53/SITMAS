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
    public class CargoController : ApiController
    {
        // GET: api/Cargo
        [HttpGet]
        public List<Cargos> ListarTodo()
        {
            Cargos oCargo = new Cargos();

            DataTable dt = oCargo.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Cargos>>(listaJson);

            return Lista;

        }

        // GET: api/Cargo/5
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

        // POST: api/Cargo
        [HttpPost]
        public void Insertar([FromBody] Cargos value)
        {
            Cargos oCargo = new Cargos();
            oCargo.Cargo = value.Cargo;

            oCargo.Insertar();
        }

        // PUT: api/Cargo/5
        [HttpPut]
        public void Modificar(int id, [FromBody] Cargos value)
        {

            Cargos oCargo = new Cargos();
            oCargo.Id = id;
            oCargo.Cargo = value.Cargo;

            oCargo.Modificar();

        }

        // DELETE: api/Cargo/5
        [HttpDelete]

        public void Borrar(int id)
        {

            Cargos oCargo = new Cargos();
            oCargo.Id = id;

            oCargo.Borrar();

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
