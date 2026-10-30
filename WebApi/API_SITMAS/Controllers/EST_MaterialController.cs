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
    public class EST_MaterialController : ApiController
    {
        // GET: api/EST_Material
        [HttpGet]
        public List<Estado_Materiales> ListarTodo()
        {
            Estado_Materiales oEstadoMaterial = new Estado_Materiales();

            DataTable dt = oEstadoMaterial.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Estado_Materiales>>(listaJson);

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

        // POST: api/EST_Material
        [HttpPost]
        public void Insertar([FromBody] Estado_Materiales value)
        {
            Estado_Materiales oEstadoMaterial = new Estado_Materiales();
            oEstadoMaterial.EstadoMaterial = value.EstadoMaterial;

            oEstadoMaterial.Insertar();
        }

        // PUT: api/EST_Material/5
        [HttpPut]
        public void Modificar(int id, [FromBody] Estado_Materiales value)
        {

            Estado_Materiales oEstadoMaterial = new Estado_Materiales();
            oEstadoMaterial.IdEstadoMaterial = id;
            oEstadoMaterial.EstadoMaterial = value.EstadoMaterial;

            oEstadoMaterial.Modificar();

        }

        // DELETE: api/EST_Material/5
        [HttpDelete]

        public void Borrar(int id)
        {

            Estado_Materiales oEstadoMaterial = new Estado_Materiales();
            oEstadoMaterial.IdEstadoMaterial = id;

            oEstadoMaterial.Borrar();

        }

       
    }
}
