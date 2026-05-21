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
    public class Usuario_RolController : ApiController
    {
        // GET: api/Usuario_Rol
        [HttpGet]
        public List<Usuario_Rol> ListarTodo()
        {
            Usuario_Rol oUsuario_Rol = new Usuario_Rol();

            DataTable dt = oUsuario_Rol.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Usuario_Rol>>(listaJson);

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

        // POST: api/Usuario_Rol
        [HttpPost]
        public void Insertar([FromBody] Usuario_Rol value)
        {
            Usuario_Rol oUsuario_Rol = new Usuario_Rol();
            oUsuario_Rol.Id_Usuario = value.Id_Usuario;
            oUsuario_Rol.Id_Rol = value.Id_Rol;

            oUsuario_Rol.Insertar();
        }

        // PUT: api/Usuario_Rol/5
        [HttpPut]
        public void Modificar(int id, [FromBody] Usuario_Rol value)
        {

            Usuario_Rol oUsuario_Rol = new Usuario_Rol();
            oUsuario_Rol.Id = id;
            oUsuario_Rol.Id_Usuario = value.Id_Usuario;
            oUsuario_Rol.Id_Rol = value.Id_Rol;

            oUsuario_Rol.Modificar();

        }

        // DELETE: api/Usuario_Rol/5
        [HttpDelete]

        public void Borrar(int id)
        {

            Usuario_Rol oUsuario_Rol = new Usuario_Rol();
            oUsuario_Rol.Id = id;

            oUsuario_Rol.Borrar();

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
