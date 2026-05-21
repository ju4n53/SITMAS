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
    public class TP_MaterialController : ApiController
    {
        // GET: api/TP_Material
        [HttpGet]
        public List<Tipo_Material> ListarTodo()
        {
            Tipo_Material oTipoMaterial = new Tipo_Material();

            DataTable dt = oTipoMaterial.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Tipo_Material>>(listaJson);

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

        // POST: api/TP_Material
        [HttpPost]
        public void Insertar([FromBody] Tipo_Material value)
        {
            Tipo_Material oTipoMaterial = new Tipo_Material();
            oTipoMaterial.TipoMaterial = value.TipoMaterial;

            oTipoMaterial.Insertar();
        }

        // PUT: api/TP_Material/5
        [HttpPut]
        public void Modificar(int id, [FromBody] Tipo_Material value)
        {

            Tipo_Material oTipoMaterial = new Tipo_Material();
            oTipoMaterial.IdTipoMaterial = id;
            oTipoMaterial.TipoMaterial = value.TipoMaterial;

            oTipoMaterial.Modificar();

        }

        // DELETE: api/TP_Material/5
        [HttpDelete]

        public void Borrar(int id)
        {

            Tipo_Material oTipoMaterial = new Tipo_Material();
            oTipoMaterial.IdTipoMaterial = id;

            oTipoMaterial.Borrar();

        }

       

    }
}
