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
    public class EmpleadoController : ApiController
    {
        // GET: api/Empleado
        [HttpGet]
        public List<Empleado> ListarTodo()
        {
            Empleado oEmpleado = new Empleado();

            DataTable dt = oEmpleado.SelectAll();

            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Empleado>>(listaJson);

            return Lista;

        }

        // GET: api/Empleado/5
        [HttpGet]

        public Empleado ListarPorId(int id)
        {
            Empleado oEmpleado = new Empleado();
            oEmpleado.Id = id;

            DataTable dt = oEmpleado.SelectId();

            var ListaJsom = JsonConvert.SerializeObject(dt);

            var obj = JsonConvert.DeserializeObject<List<Empleado>>(ListaJsom).ToList().FirstOrDefault();

            return obj;

        }

        // POST: api/Empleado
        [HttpPost]

        public void Insertar([FromBody] Empleado value)
        {
            Empleado oEmpleado = new Empleado();
            oEmpleado.Apellido = value.Apellido;
            oEmpleado.Nombre = value.Nombre;
            oEmpleado.Cuil = value.Cuil;
            oEmpleado.Telefono = value.Telefono;
            oEmpleado.Email = value.Email;
            oEmpleado.Fecha_Ingreso = value.Fecha_Ingreso;           
            oEmpleado.Id_Cargo = value.Id_Cargo;
            oEmpleado.Id_Area = value.Id_Area;
            oEmpleado.Id_Barrio = value.Id_Barrio;
            oEmpleado.Id_Estado_Empleado = value.Id_Estado_Empleado;
            oEmpleado.Calle = value.Calle;
            oEmpleado.Numero = value.Numero;
            oEmpleado.Piso = value.Piso;
            oEmpleado.Dpto = value.Dpto;

            oEmpleado.Insertar();
        }

        // PUT: api/Empleado/5
        [HttpPut]

        public void Modificar(int id, [FromBody] Empleado value)
        {

            Empleado oEmpleado = new Empleado();
            oEmpleado.Id = id;
            oEmpleado.Apellido = value.Apellido;
            oEmpleado.Nombre = value.Nombre;
            oEmpleado.Cuil = value.Cuil;
            oEmpleado.Telefono = value.Telefono;
            oEmpleado.Email = value.Email;
            oEmpleado.Fecha_Ingreso = value.Fecha_Ingreso;            
            oEmpleado.Id_Cargo = value.Id_Cargo;
            oEmpleado.Id_Area = value.Id_Area;
            oEmpleado.Id_Barrio = value.Id_Barrio;
            oEmpleado.Id_Estado_Empleado = value.Id_Estado_Empleado;
            oEmpleado.Calle = value.Calle;
            oEmpleado.Numero = value.Numero;
            oEmpleado.Piso = value.Piso;
            oEmpleado.Dpto = value.Dpto;

            oEmpleado.Modificar();


        }

        // DELETE: api/Empleado/5
        //[HttpDelete]

        //public void Borrar(int id)
        //{

        //    Empleado oEmpleado = new Empleado();
        //    oEmpleado.Id = id;

        //    oEmpleado.Borrar();

        //}


        [HttpGet]
        public List<Empleado> ListarVista()
        {
            Empleado oEmpleado = new Empleado();

            var dt = oEmpleado.VistalistadoEmpleados();

            var ListaJsom = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Empleado>>(ListaJsom);
            return Lista;


        }


    }
}
