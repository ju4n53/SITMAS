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
    public class TpVinculacionController : ApiController
    {
        // GET: api/TpVinculacion
        [HttpGet]
        public List<TpVinculacion> ListarTodo()
        {
            TpVinculacion oTpVinculacion = new TpVinculacion();

            DataTable dt = oTpVinculacion.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<TpVinculacion>>(listaJson);

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

        // POST: api/TpVinculacion
        [HttpPost]
        public void Insertar([FromBody] TpVinculacion value)
        {
            TpVinculacion oTpVinculacion = new TpVinculacion();
            oTpVinculacion.TipoVinculacion = value.TipoVinculacion;

            oTpVinculacion.Insertar();
        }

        // PUT: api/TpVinculacion/5
        [HttpPut]
        public void Modificar(int id, [FromBody] TpVinculacion value)
        {

            TpVinculacion oTpVinculacion = new TpVinculacion();
            oTpVinculacion.IdVinculacion = id;
            oTpVinculacion.TipoVinculacion = value.TipoVinculacion;

            oTpVinculacion.Modificar();

        }

        // DELETE: api/TpVinculacion/5
        [HttpDelete]

        public void Borrar(int id)
        {

            TpVinculacion oTpVinculacion = new TpVinculacion();
            oTpVinculacion.IdVinculacion = id;

            oTpVinculacion.Borrar();

        }


    }
}
