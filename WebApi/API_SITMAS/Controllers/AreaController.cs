using API_SITMAS.Models;
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/Area")]
    public class AreaController : ApiController
    {
        private readonly AreaDatos _datos = new AreaDatos();

        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                return Ok(_datos.SelectAll());
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] AreasTrabajo value)
        {
            if (value == null || string.IsNullOrWhiteSpace(value.Area))
                return BadRequest("El nombre del área es requerido.");

            try
            {
                int id = _datos.Insertar(value);
                return Ok(new { mensaje = "Área registrada correctamente.", id = id });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] AreasTrabajo value)
        {
            if (value == null) return BadRequest("Datos requeridos.");

            try
            {
                value.Id = id;
                _datos.Modificar(value);
                return Ok(new { mensaje = "Área modificada exitosamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                _datos.Borrar(id);
                return Ok(new { mensaje = "Área eliminada." });
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
//    public class AreaController : ApiController
//    {
//        // GET: api/Area
//        [HttpGet]
//        public List<AreasTrabajo> ListarTodo()
//        {
//            AreasTrabajo oArea = new AreasTrabajo();

//            DataTable dt = oArea.SelectAll();
//            var listaJson = JsonConvert.SerializeObject(dt);

//            var Lista = JsonConvert.DeserializeObject<List<AreasTrabajo>>(listaJson);

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

//        // POST: api/Area
//        [HttpPost]
//        public void Insertar([FromBody] AreasTrabajo value)
//        {
//            AreasTrabajo oArea = new AreasTrabajo();
//            oArea.Area = value.Area;

//            oArea.Insertar();
//        }

//        // PUT: api/Area/5
//        [HttpPut]
//        public void Modificar(int id, [FromBody] AreasTrabajo value)
//        {

//            AreasTrabajo oArea = new AreasTrabajo();
//            oArea.Id = id;
//            oArea.Area = value.Area;

//            oArea.Modificar();

//        }

//        // DELETE: api/Area/5
//        [HttpDelete]

//        public void Borrar(int id)
//        {

//            AreasTrabajo oArea = new AreasTrabajo();
//            oArea.Id = id;

//            oArea.Borrar();

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
