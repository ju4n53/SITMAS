using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/origen")]
    public class OrigenController : ApiController
    {
        // GET: api/origen
        [HttpGet]
        [Route("")]
        public IHttpActionResult ObtenerTodos()
        {
            try
            {
                EmpresaOrigen oOrigen = new EmpresaOrigen();
                List<EmpresaOrigen> lista = oOrigen.ObtenerTodos();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/origen
        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] EmpresaOrigen value)
        {
            if (value == null)
                return BadRequest("Los datos enviados no son válidos.");

            if (string.IsNullOrWhiteSpace(value.EmpresaInstitucion))
                return BadRequest("El nombre de la Empresa/Institución es obligatorio.");

            try
            {
                int nuevoId = value.Insertar();
                return Created(new Uri(Request.RequestUri + "/" + nuevoId), new { IdOrigenGenerado = nuevoId, Mensaje = "Empresa/Institución agregada con éxito." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/origen/5
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] EmpresaOrigen value)
        {
            if (value == null)
                return BadRequest("Los datos enviados no son válidos.");

            if (id <= 0)
                return BadRequest("El ID de Origen debe ser un número entero positivo.");

            try
            {
                value.IdOrigen = id;
                bool actualizado = value.Modificar();

                if (!actualizado)
                    return NotFound();

                return Ok(new { Mensaje = "Empresa/Institución actualizada correctamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/origen/5
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Borrar(int id)
        {
            if (id <= 0)
                return BadRequest("El ID a eliminar no es válido.");

            try
            {
                EmpresaOrigen oOrigen = new EmpresaOrigen { IdOrigen = id };
                bool eliminado = oOrigen.Borrar();

                if (!eliminado)
                    return NotFound();

                return Ok(new { Mensaje = "Empresa/Institución eliminada correctamente." });
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
//    public class OrigenController : ApiController
//    {
//        // GET: api/Origen
//        [HttpGet]
//        public List<EmpresaOrigen> ListarTodo()
//        {
//            EmpresaOrigen oOrigen = new EmpresaOrigen();
//            DataTable dt = oOrigen.SelectAll();
//            var listaJson = JsonConvert.SerializeObject(dt);

//            var Lista = JsonConvert.DeserializeObject<List<EmpresaOrigen>>(listaJson);
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

//        // POST: api/Origen
//        [HttpPost]
//        public void Insertar([FromBody] EmpresaOrigen value)
//        {
//            EmpresaOrigen oOrigen = new EmpresaOrigen();
//            oOrigen.EmpresaInstitucion = value.EmpresaInstitucion;
//            oOrigen.CalleEI = value.CalleEI;
//            oOrigen.NumeroEI = value.NumeroEI;
//            oOrigen.TelefonoEI = value.TelefonoEI;
//            oOrigen.EmailEI = value.EmailEI;
//            oOrigen.Id_Barrio = value.Id_Barrio;

//            oOrigen.Insertar();
//        }

//        // PUT: api/Origen/5
//        [HttpPost]
//        public void Modificar([FromUri] int id, [FromBody] EmpresaOrigen value)
//        {

//            EmpresaOrigen oOrigen = new EmpresaOrigen();
//            oOrigen.IdOrigen = id;
//            oOrigen.EmpresaInstitucion = value.EmpresaInstitucion;
//            oOrigen.CalleEI = value.CalleEI;
//            oOrigen.NumeroEI = value.NumeroEI;
//            oOrigen.TelefonoEI = value.TelefonoEI;
//            oOrigen.EmailEI = value.EmailEI;
//            oOrigen.Id_Barrio = value.Id_Barrio;

//            oOrigen.Modificar();

//        }

//        // DELETE: api/Origen/5
//        [HttpPost]

//        public void Borrar([FromUri] int id)
//        {

//            EmpresaOrigen oOrigen = new EmpresaOrigen();
//            oOrigen.IdOrigen = id;

//            oOrigen.Borrar();

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
