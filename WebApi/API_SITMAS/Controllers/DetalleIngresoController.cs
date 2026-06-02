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
    public class DetalleIngresoController : ApiController
    {
        // GET: api/DetalleIngreso
        [HttpGet]
        public List<Detalle_Ingreso> ListarTodo()
        {
            Detalle_Ingreso oDetalleIngreso = new Detalle_Ingreso();

            DataTable dt = oDetalleIngreso.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Detalle_Ingreso>>(listaJson);

            return Lista;

        }


        // GET: api/Detalle_Ingreso/PorCabecera/5
        // Trae los pesajes legibles asociados a un camión específico
        [HttpGet]
        [Route("api/Detalle_Ingreso/PorCabecera/{idCabecera}")]
        public List<Detalle_Ingreso> PorCabecera(int idCabecera)
        {
            Detalle_Ingreso oDetalle = new Detalle_Ingreso();
            DataTable dt = oDetalle.SelectPorCabecera(idCabecera);

            var listaJson = JsonConvert.SerializeObject(dt);
            return JsonConvert.DeserializeObject<List<Detalle_Ingreso>>(listaJson);
        }

        // GET: api/Empleado/5
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

        // POST: api/DetalleIngreso
        [HttpPost]

        public IHttpActionResult Insertar([FromBody] Detalle_Ingreso value)
        {
            if (value == null) return BadRequest("Datos inválidos.");
            try
            {
                value.Insertar();
                return Ok("Pesada de material registrada en el camión.");
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Empleado/5
        //[HttpPut]

        public IHttpActionResult Modificar(int id, [FromBody] Detalle_Ingreso value)
        {
            if (value == null) return BadRequest("Datos inválidos.");
            try
            {
                value.IdDetalleIngreso = id;
                value.Modificar();
                return Ok("Pesada de material modificada.");
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/Empleado/5
        //[HttpDelete]

        public IHttpActionResult Borrar(int id)
        {
            try
            {
                Detalle_Ingreso oDetalle = new Detalle_Ingreso();
                oDetalle.IdDetalleIngreso = id;
                oDetalle.Borrar();
                return Ok("Pesada anulada correctamente.");
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }





    }
}
