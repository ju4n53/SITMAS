using API_SITMAS.Models;
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/TpVinculacion")]
    public class TpVinculacionController : ApiController
    {
        private readonly TpVinculacionDatos _datos = new TpVinculacionDatos();

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
        public IHttpActionResult Insertar([FromBody] TpVinculacion value)
        {
            if (value == null || string.IsNullOrWhiteSpace(value.TipoVinculacion))
                return BadRequest("El tipo de vinculación es requerido.");

            try
            {
                int id = _datos.Insertar(value);
                return Ok(new { mensaje = "Tipo de vinculación creado exitosamente.", id = id });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] TpVinculacion value)
        {
            if (value == null) return BadRequest("Datos requeridos.");

            try
            {
                value.IdVinculacion = id;
                _datos.Modificar(value);
                return Ok(new { mensaje = "Tipo de vinculación actualizado." });
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
                return Ok(new { mensaje = "Tipo de vinculación eliminado." });
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
//    public class TpVinculacionController : ApiController
//    {
//        // GET: api/TpVinculacion
//        [HttpGet]
//        public List<TpVinculacion> ListarTodo()
//        {
//            TpVinculacion oTpVinculacion = new TpVinculacion();

//            DataTable dt = oTpVinculacion.SelectAll();
//            var listaJson = JsonConvert.SerializeObject(dt);

//            var Lista = JsonConvert.DeserializeObject<List<TpVinculacion>>(listaJson);

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

//        // POST: api/TpVinculacion
//        [HttpPost]
//        public void Insertar([FromBody] TpVinculacion value)
//        {
//            TpVinculacion oTpVinculacion = new TpVinculacion();
//            oTpVinculacion.TipoVinculacion = value.TipoVinculacion;

//            oTpVinculacion.Insertar();
//        }

//        // PUT: api/TpVinculacion/5
//        [HttpPut]
//        public void Modificar(int id, [FromBody] TpVinculacion value)
//        {

//            TpVinculacion oTpVinculacion = new TpVinculacion();
//            oTpVinculacion.IdVinculacion = id;
//            oTpVinculacion.TipoVinculacion = value.TipoVinculacion;

//            oTpVinculacion.Modificar();

//        }

//        // DELETE: api/TpVinculacion/5
//        [HttpDelete]

//        public void Borrar(int id)
//        {

//            TpVinculacion oTpVinculacion = new TpVinculacion();
//            oTpVinculacion.IdVinculacion = id;

//            oTpVinculacion.Borrar();

//        }


//    }
//}
