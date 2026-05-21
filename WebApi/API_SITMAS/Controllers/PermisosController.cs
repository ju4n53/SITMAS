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
    public class PermisosController : ApiController
    {
        // GET: api/Permisos
        [HttpGet]
        public List<PermisoUser> ListarTodo()
        {
            PermisoUser oPermiso = new PermisoUser();

            DataTable dt = oPermiso.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<PermisoUser>>(listaJson);

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

        // POST: api/Permisos
        [HttpPost]
        public void Insertar([FromBody] PermisoUser value)
        {
            PermisoUser oPermiso = new PermisoUser();
            oPermiso.PermisoUsuario = value.PermisoUsuario;

            oPermiso.Insertar();
        }

        // PUT: api/Permisos/5
        [HttpPost]
        public void Modificar(int id, [FromBody] PermisoUser value)
        {

            PermisoUser oPermiso = new PermisoUser();
            oPermiso.Id = id;
            oPermiso.PermisoUsuario = value.PermisoUsuario;

            oPermiso.Modificar();

        }

        // DELETE: api/Permisos/5
        [HttpDelete]

        public void Borrar(int id)
        {

            PermisoUser oPermiso = new PermisoUser();
            oPermiso.Id = id;

            oPermiso.Borrar();

        }

      

    }
}
