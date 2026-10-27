using API_SITMAS.Models;
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    // Con esto ya no necesitas pelear con las rutas por defecto, queda limpio: api/Empleado
    [RoutePrefix("api/Empleado")]
    public class EmpleadoController : ApiController
    {
        // Instanciamos nuestra capa de datos limpia
        private EmpleadoDatos _empleadoDatos = new EmpleadoDatos();

        // GET: api/Empleado/personales
        [HttpGet]
        [Route("personales")]
        public IHttpActionResult GetDatosPersonales()
        {
            try
            {
                var lista = _empleadoDatos.ListarDatosPersonales();
                return Ok(lista); // Web API serializa esto a JSON automáticamente y rapidísimo
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Devuelve HTTP 500 y el mensaje de error al frontend
            }
        }

        // GET: api/Empleado/laborales
        [HttpGet]
        [Route("laborales")]
        public IHttpActionResult GetDatosLaborales()
        {
            try
            {
                var lista = _empleadoDatos.ListarDatosLaborales();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/Empleado
        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] EmpleadoRequestDTO empleadoRequest)
        {
            if (empleadoRequest == null) return BadRequest("Los datos enviados están vacíos.");

            try
            {
                int nuevoId = _empleadoDatos.Insertar(empleadoRequest);
                return Ok(new { mensaje = "Empleado registrado con éxito", id = nuevoId });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Empleado/5
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] EmpleadoRequestDTO empleadoRequest)
        {
            if (empleadoRequest == null) return BadRequest("Faltan los datos del empleado.");

            try
            {
                _empleadoDatos.Modificar(id, empleadoRequest);
                return Ok(new { mensaje = "Empleado actualizado correctamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/Empleado/5
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult BorrarLógico(int id)
        {
            try
            {
                _empleadoDatos.Borrar(id); // Ahora esto hace el update de Estado = Inactivo
                return Ok(new { mensaje = "Empleado dado de baja exitosamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}







//using API_SITMAS.Models;
//using Newtonsoft.Json;
//using System;
//using System.Collections.Generic;
//using System.Data;
//using System.Linq;
//using System.Net;
//using System.Net.Http;
//using System.Web.Http;

//namespace API_SITMAS.Controllers
//{
//    public class EmpleadoController : ApiController
//    {
//        // GET: api/Empleado
//        [HttpGet]
//        public List<Empleado> ListarTodo()
//        {
//            Empleado oEmpleado = new Empleado();

//            DataTable dt = oEmpleado.SelectAll();

//            var listaJson = JsonConvert.SerializeObject(dt);

//            var Lista = JsonConvert.DeserializeObject<List<Empleado>>(listaJson);

//            return Lista;

//        }

//        // GET: api/Empleado/5
//        [HttpGet]

//        public Empleado ListarPorId(int id)
//        {
//            Empleado oEmpleado = new Empleado();
//            oEmpleado.Id = id;

//            DataTable dt = oEmpleado.SelectId();

//            var ListaJsom = JsonConvert.SerializeObject(dt);

//            var obj = JsonConvert.DeserializeObject<List<Empleado>>(ListaJsom).ToList().FirstOrDefault();

//            return obj;

//        }

//        // POST: api/Empleado
//        [HttpPost]

//        public void Insertar([FromBody] Empleado value)
//        {
//            Empleado oEmpleado = new Empleado();
//            oEmpleado.Apellido = value.Apellido;
//            oEmpleado.Nombre = value.Nombre;
//            oEmpleado.Cuil = value.Cuil;
//            oEmpleado.Telefono = value.Telefono;
//            oEmpleado.Email = value.Email;
//            oEmpleado.Fecha_Ingreso = value.Fecha_Ingreso;           
//            oEmpleado.Id_Cargo = value.Id_Cargo;
//            oEmpleado.Id_Area = value.Id_Area;
//            oEmpleado.Id_Barrio = value.Id_Barrio;
//            oEmpleado.Id_Estado_Empleado = value.Id_Estado_Empleado;
//            oEmpleado.Calle = value.Calle;
//            oEmpleado.Numero = value.Numero;
//            oEmpleado.Piso = value.Piso;
//            oEmpleado.Dpto = value.Dpto;

//            oEmpleado.Insertar();
//        }

//        // PUT: api/Empleado/5
//        [HttpPut]

//        public void Modificar(int id, [FromBody] Empleado value)
//        {

//            Empleado oEmpleado = new Empleado();
//            oEmpleado.Id = id;
//            oEmpleado.Apellido = value.Apellido;
//            oEmpleado.Nombre = value.Nombre;
//            oEmpleado.Cuil = value.Cuil;
//            oEmpleado.Telefono = value.Telefono;
//            oEmpleado.Email = value.Email;
//            oEmpleado.Fecha_Ingreso = value.Fecha_Ingreso;            
//            oEmpleado.Id_Cargo = value.Id_Cargo;
//            oEmpleado.Id_Area = value.Id_Area;
//            oEmpleado.Id_Barrio = value.Id_Barrio;
//            oEmpleado.Id_Estado_Empleado = value.Id_Estado_Empleado;
//            oEmpleado.Calle = value.Calle;
//            oEmpleado.Numero = value.Numero;
//            oEmpleado.Piso = value.Piso;
//            oEmpleado.Dpto = value.Dpto;

//            oEmpleado.Modificar();


//        }

//        // DELETE: api/Empleado/5
//        //[HttpDelete]

//        //public void Borrar(int id)
//        //{

//        //    Empleado oEmpleado = new Empleado();
//        //    oEmpleado.Id = id;

//        //    oEmpleado.Borrar();

//        //}


//        [HttpGet]
//        public List<Empleado> ListarVista()
//        {
//            Empleado oEmpleado = new Empleado();

//            var dt = oEmpleado.VistalistadoEmpleados();

//            var ListaJsom = JsonConvert.SerializeObject(dt);

//            var Lista = JsonConvert.DeserializeObject<List<Empleado>>(ListaJsom);
//            return Lista;


//        }

//        [HttpGet]
//        public List<Empleado> ListarChoferes()
//        {
//            Empleado oEmpleado = new Empleado();

//            var dt = oEmpleado.ListadoChoferes();
//            var ListaJsom = JsonConvert.SerializeObject(dt);

//            var Lista = JsonConvert.DeserializeObject<List<Empleado>>(ListaJsom);
//            return Lista;


//        }

//    }
//}
