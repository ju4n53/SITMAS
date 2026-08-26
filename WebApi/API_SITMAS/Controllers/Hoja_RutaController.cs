using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/hojaruta")]
    public class HojaRutaController : ApiController
    {
        // GET: api/hojaruta (Listar todas las cabeceras)
        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                HojaRuta oHojaRuta = new HojaRuta();
                List<HojaRuta> lista = oHojaRuta.SelectAll();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/hojaruta (Crear una cabecera)
        [HttpPost]
        [Route("")]
        public IHttpActionResult Insertar([FromBody] HojaRuta value)
        {
            if (value == null) return BadRequest("Los datos enviados no son válidos.");

            try
            {
                int nuevoId = value.Insertar();
                return Ok(new { IdGenerado = nuevoId, Mensaje = "Hoja de Ruta creada con éxito." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/hojaruta/5 (Modificar cabecera)
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Modificar(int id, [FromBody] HojaRuta value)
        {
            if (value == null) return BadRequest("Los datos enviados no son válidos.");

            try
            {
                value.Id = id;
                bool actualizado = value.Modificar();
                if (!actualizado) return NotFound();

                return Ok(new { Mensaje = "Hoja de Ruta actualizada correctamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/hojaruta/5 (Eliminar cabecera y sus detalles en cascada)
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                HojaRuta oHojaRuta = new HojaRuta { Id = id };
                bool eliminado = oHojaRuta.Borrar();
                if (!eliminado) return NotFound();

                return Ok(new { Mensaje = "Hoja de Ruta eliminada correctamente." });
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
//    public class HojaRutaController : ApiController
//    {
//        // GET: api/HojaRuta
//        [HttpGet]
//        public List<HojaRuta> ListarTodo()
//        {
//            HojaRuta oHojaRuta = new HojaRuta();

//            DataTable dt = oHojaRuta.SelectAll();
//            var listaJson = JsonConvert.SerializeObject(dt);

//            var Lista = JsonConvert.DeserializeObject<List<HojaRuta>>(listaJson);

//            return Lista;

//        }

//        // POST: api/HojaRuta
//        [HttpPost]
//        public void Insertar([FromBody] HojaRuta value)
//        {
//            HojaRuta oHojaRuta = new HojaRuta();
//            oHojaRuta.HojaRutaFecha = value.HojaRutaFecha;
//            oHojaRuta.Id_Vehiculo = value.Id_Vehiculo;
//            oHojaRuta.Id_Chofer = value.Id_Chofer;
//            oHojaRuta.Id_Estado = value.Id_Estado;

//            oHojaRuta.Insertar();
//        }

//        // PUT: api/HojaRuta/5
//        [HttpPost]
//        public void Modificar(int id, [FromBody] HojaRuta value)
//        {

//            HojaRuta oHojaRuta = new HojaRuta();
//            oHojaRuta.Id = id;
//            oHojaRuta.HojaRutaFecha = value.HojaRutaFecha;
//            oHojaRuta.Id_Vehiculo = value.Id_Vehiculo;
//            oHojaRuta.Id_Chofer = value.Id_Chofer;
//            oHojaRuta.Id_Estado = value.Id_Estado;

//            oHojaRuta.Modificar();
//        }

//        // DELETE: api/HojaRuta/5
//        [HttpPost]

//        public void Borrar(int id)
//        {

//            HojaRuta oHojaRuta = new HojaRuta();
//            oHojaRuta.Id = id;

//            oHojaRuta.Borrar();

//        }



//    }
//}
