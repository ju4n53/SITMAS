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
    public class SbTp_MaterialController : ApiController
    {
        // GET: api/SbTp_Material
        [HttpGet]
        public List<SubtipoMaterial> ListarTodo()
        {
            SubtipoMaterial oSubtipoMaterial = new SubtipoMaterial();

            DataTable dt = oSubtipoMaterial.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<SubtipoMaterial>>(listaJson);

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

        // POST: api/SbTp_Material
        [HttpPost]
        public void Insertar([FromBody] SubtipoMaterial value)
        {
            SubtipoMaterial oSubtipoMaterial = new SubtipoMaterial();
            oSubtipoMaterial.Id_Tipo_Material = value.Id_Tipo_Material;
            oSubtipoMaterial.Subtipo = value.Subtipo;

            oSubtipoMaterial.Insertar();
        }

        // PUT: api/SbTp_Material/5
        [HttpPost]
        public void Modificar(int id, [FromBody] SubtipoMaterial value)
        {

            SubtipoMaterial oSubtipoMaterial = new SubtipoMaterial();
            oSubtipoMaterial.IdSubtipoM = id;
            oSubtipoMaterial.Id_Tipo_Material = value.Id_Tipo_Material;
            oSubtipoMaterial.Subtipo = value.Subtipo;

            oSubtipoMaterial.Modificar();

        }

        // DELETE: api/SbTp_Material/5
        [HttpPost]

        public void Borrar(int id)
        {

            SubtipoMaterial oSubtipoMaterial = new SubtipoMaterial();
            oSubtipoMaterial.IdSubtipoM = id;

            oSubtipoMaterial.Borrar();

        }

        

    }
}
