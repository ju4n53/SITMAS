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
    public class Rol_PermisoController : ApiController
    {
        // GET: api/Rol_Permiso
        [HttpGet]
        public List<Rol_Permiso> ListarTodo()
        {
            Rol_Permiso oRolPermiso = new Rol_Permiso();

            DataTable dt = oRolPermiso.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Rol_Permiso>>(listaJson);

            return Lista;

        }

        [HttpGet]
        public List<Rol_Permiso> ListarVista()
        {
            Rol_Permiso oRolPermiso = new Rol_Permiso();

            var dt = oRolPermiso.VistaRolesYPermisos();
            var ListaJsom = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Rol_Permiso>>(ListaJsom);
            return Lista;

        }

       


        // PUT: api/Rol_Permiso/5
        [HttpPut]
        public IHttpActionResult Modificar([FromBody] Rol_Permiso value)
        {
            if (value == null) return BadRequest("Datos inválidos.");

            Rol_Permiso oRolPermiso = new Rol_Permiso();
            oRolPermiso.Id_Rol = value.Id_Rol;
            oRolPermiso.Id_Permiso = value.Id_Permiso;

            oRolPermiso.Modificar();
            return Ok("Relación Rol-Permiso actualizada correctamente.");
        }

        // DELETE: api/Rol_Permiso/5
        [HttpPost]
        [Route("api/Rol_Permiso/BorrarAsociacion")]
        public IHttpActionResult BorrarAsociacion([FromBody] Rol_Permiso value)
        {
            if (value == null) return BadRequest("Datos inválidos.");

            Rol_Permiso oRolPermiso = new Rol_Permiso();
            oRolPermiso.Id_Rol = value.Id_Rol;
            oRolPermiso.Id_Permiso = value.Id_Permiso;

            oRolPermiso.Borrar();
            return Ok("Permiso removido del rol correctamente.");
        }


    }
}
