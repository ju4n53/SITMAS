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
    public class RolesController : ApiController
    {
        // GET: api/Roles
        [HttpGet]
        public List<RolSistema> ListarTodo()
        {
            RolSistema oRol = new RolSistema();

            DataTable dt = oRol.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<RolSistema>>(listaJson);

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

        // POST: api/Roles
        [HttpPost]
        public void Insertar([FromBody] RolSistema value)
        {
            RolSistema oRol = new RolSistema();
            oRol.NombreRol = value.NombreRol;

            oRol.Insertar();
        }

        // PUT: api/Roles/5
        [HttpPut]
        public void Modificar(int id, [FromBody] RolSistema value)
        {

            RolSistema oRol = new RolSistema();
            oRol.Id = id;
            oRol.NombreRol = value.NombreRol;

            oRol.Modificar();

        }

        // DELETE: api/Roles/5
        [HttpDelete]

        public void Borrar(int id)
        {

            RolSistema oRol = new RolSistema();
            oRol.Id = id;

            oRol.Borrar();

        }

    }
}
