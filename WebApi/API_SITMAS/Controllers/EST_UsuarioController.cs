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
    public class EstadoUsuarioController : ApiController
    {
        // GET: api/EstadoUsuario
        [HttpGet]
        public List<Estado_Usuario> ListarTodo()
        {
            Estado_Usuario oEstadoUsuario = new Estado_Usuario();

            DataTable dt = oEstadoUsuario.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Estado_Usuario>>(listaJson);

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

        // POST: api/EstadoUsuario
        [HttpPost]
        public void Insertar([FromBody] Estado_Usuario value)
        {
            Estado_Usuario oEstadoUsuario = new Estado_Usuario();
            oEstadoUsuario.EstadoUsuario = value.EstadoUsuario;

            oEstadoUsuario.Insertar();
        }

        // PUT: api/EstadoUsuario/5
        [HttpPut]
        public void Modificar(int id, [FromBody] Estado_Usuario value)
        {

            Estado_Usuario oEstadoUsuario = new Estado_Usuario();
            oEstadoUsuario.Id = id;
            oEstadoUsuario.EstadoUsuario = value.EstadoUsuario;

            oEstadoUsuario.Modificar();

        }

        // DELETE: api/EstadoUsuario/5
        [HttpDelete]

        public void Borrar(int id)
        {

            Estado_Usuario oEstadoUsuario = new Estado_Usuario();
            oEstadoUsuario.Id = id;

            oEstadoUsuario.Borrar();

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
