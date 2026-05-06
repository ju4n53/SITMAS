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
    public class UsuarioController : ApiController
    {
        // GET: api/Usuario
        [HttpGet]
        public List<Usuarios> ListarTodo()
        {
            Usuarios oUsuario = new Usuarios();

            DataTable dt = oUsuario.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Usuarios>>(listaJson);

            return Lista;

        }

        // GET: api/Empleado/5
        [HttpGet]

        public Usuarios ListarPorId(int id)
        {
            Usuarios oUsuario = new Usuarios();
            oUsuario.Id = id;

            DataTable dt = oUsuario.SelectId();

            var ListaJsom = JsonConvert.SerializeObject(dt);

            var obj = JsonConvert.DeserializeObject<List<Usuarios>>(ListaJsom).ToList().FirstOrDefault();
            return obj;

        }

        // POST: api/Usuario
        [HttpPost]

        public void Insertar([FromBody] Usuarios value)
        {
            Usuarios oUsuario = new Usuarios();
            oUsuario.Usuario = value.Usuario;
            oUsuario.Password = value.Password;
            oUsuario.Id_Empleado = value.Id_Empleado;
            oUsuario.Id_Estado_Usuario = value.Id_Estado_Usuario;

            oUsuario.Insertar();
        }


        // PUT: api/Usuario/5
        [HttpPut]

        public void Modificar(int id, [FromBody] Usuarios value)
        {
            Usuarios oUsuario = new Usuarios();
            oUsuario.Id = id; // <--- ¡Perfecto! Usás el ID de la URL
            oUsuario.Usuario = value.Usuario;
            oUsuario.Id_Estado_Usuario = value.Id_Estado_Usuario;
            oUsuario.Password = value.Password;

            oUsuario.Modificar();
        }
       

        // DELETE: api/Usuario/5
        public void Delete(int id)
        {
        }
    }
}
