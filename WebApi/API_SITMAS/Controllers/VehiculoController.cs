using API_SITMAS.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Net;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/Vehiculo")]
    public class VehiculoController : ApiController
    {
        // GET: api/Vehiculo/ListarTodo
        [HttpGet]
        [Route("ListarTodo")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                Vehiculo oVehiculo = new Vehiculo();
                DataTable dt = oVehiculo.SelectAll();
                var listaJson = JsonConvert.SerializeObject(dt);
                var lista = JsonConvert.DeserializeObject<List<Vehiculo>>(listaJson);
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // POST: api/Vehiculo
        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] Vehiculo value)
        {
            if (value == null) return BadRequest("Datos del vehículo inválidos.");
            try
            {
                Vehiculo oVehiculo = new Vehiculo
                {
                    Patente = value.Patente,
                    Id_Modelo = value.Id_Modelo,
                    Id_Tipo = value.Id_Tipo
                };
                oVehiculo.Insertar();
                return Ok("Vehículo registrado correctamente.");
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // PUT: api/Vehiculo/5
        [HttpPut]
        [Route("{id}")]
        public IHttpActionResult Modificar(int id, [FromBody] Vehiculo value)
        {
            if (value == null) return BadRequest("Datos inválidos.");
            try
            {
                Vehiculo oVehiculo = new Vehiculo
                {
                    Id = id,
                    Patente = value.Patente,
                    Id_Modelo = value.Id_Modelo,
                    Id_Tipo = value.Id_Tipo
                };
                oVehiculo.Modificar();
                return Ok("Vehículo modificado correctamente.");
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // DELETE: api/Vehiculo/5
        [HttpDelete]
        [Route("{id}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                Vehiculo oVehiculo = new Vehiculo { Id = id };
                oVehiculo.Borrar();
                return Ok("Vehículo eliminado correctamente.");
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.Message);
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
//    public class VehiculoController : ApiController
//    {
//        // GET: api/Vehiculo
//        [HttpGet]
//        public List<Vehiculo> ListarTodo()
//        {
//            Vehiculo oVehiculo = new Vehiculo();

//            DataTable dt = oVehiculo.SelectAll();
//            var listaJson = JsonConvert.SerializeObject(dt);

//            var Lista = JsonConvert.DeserializeObject<List<Vehiculo>>(listaJson);

//            return Lista;

//        }

//        // GET: api/Area/5
//        //[HttpGet]

//        //public Empleado ListarPorId(int id)
//        //{
//        //    Empleado oEmpleado = new Empleado();
//        //    oEmpleado.Id = id;

//        //    DataTable dt = oEmpleado.SelectId();

//        //    var ListaJsom = JsonConvert.SerializeObject(dt);

//        //    var obj = JsonConvert.DeserializeObject<List<Empleado>>(ListaJsom).ToList().FirstOrDefault();

//        //    return obj;

//        //}

//        // POST: api/Vehiculo
//        [HttpPost]
//        public void Insertar([FromBody] Vehiculo value)
//        {
//            Vehiculo oVehiculo = new Vehiculo();
//            oVehiculo.Patente = value.Patente;
//            oVehiculo.Id_Modelo = value.Id_Modelo;
//            oVehiculo.Id_Tipo = value.Id_Tipo;

//            oVehiculo.Insertar();
//        }

//        // PUT: api/Vehiculo/5
//        [HttpPost]
//        public void Modificar(int id, [FromBody] Vehiculo value)
//        {

//            Vehiculo oVehiculo = new Vehiculo();
//            oVehiculo.Id = id;
//            oVehiculo.Patente = value.Patente;
//            oVehiculo.Id_Modelo = value.Id_Modelo;
//            oVehiculo.Id_Tipo = value.Id_Tipo;

//            oVehiculo.Modificar();

//        }

//        // DELETE: api/Vehiculo/5
//        [HttpPost]

//        public void Borrar(int id)
//        {

//            Vehiculo oVehiculo = new Vehiculo();
//            oVehiculo.Id = id;

//            oVehiculo.Borrar();

//        }

//        //[HttpGet]
//        //public List<Empleado> ListarVista()
//        //{
//        //    Empleado oEmpleado = new Empleado();

//        //    var dt = oEmpleado.VistalistadoEmpleados();

//        //    var ListaJsom = JsonConvert.SerializeObject(dt);

//        //    var Lista = JsonConvert.DeserializeObject<List<Empleado>>(ListaJsom);
//        //    return Lista;

//        //}

//    }
//}
