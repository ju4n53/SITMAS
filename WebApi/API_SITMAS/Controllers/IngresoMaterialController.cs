using API_SITMAS.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/IngresoMaterial")] // Esto limpia las rutas de todo el controlador
    public class IngresoMaterialController : ApiController
    {
        // GET: api/IngresoMaterial
        [HttpGet]
        [Route("")]
        public List<Ingreso_Material> ListarTodo()
        {
            Ingreso_Material oIngresoMaterial = new Ingreso_Material();
            DataTable dt = oIngresoMaterial.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);
            return JsonConvert.DeserializeObject<List<Ingreso_Material>>(listaJson);
        }

        // GET: api/IngresoMaterial/ListarVista
        [HttpGet]
        [Route("ListarVista")] 
        public List<Ingreso_Material> ListarVista()
        {
            Ingreso_Material oIngreso = new Ingreso_Material();
            DataTable dt = oIngreso.VistaIngreso_Material();

            var listaJson = JsonConvert.SerializeObject(dt);
            return JsonConvert.DeserializeObject<List<Ingreso_Material>>(listaJson);
        }

        // POST: api/IngresoMaterial
        [HttpPost]
        [Route("")] 
        public IHttpActionResult Insertar([FromBody] Ingreso_Material value)
        {
            if (value == null) return BadRequest("Datos del ingreso inválidos.");

            try
            {
                // Al usar 'value' directamente, aprovechamos el objeto que ya armó Newtonsoft.Json
                int idAsignado = value.Insertar();
                return Ok(new { id = idAsignado, mensaje = "Cabecera de ingreso registrada." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/IngresoMaterial/5
        [HttpPut]
        [Route("{id}")] 
        public IHttpActionResult Modificar(int id, [FromBody] Ingreso_Material value)
        {
            if (value == null) return BadRequest("Datos vacíos.");
            try
            {
                Ingreso_Material oIngreso = new Ingreso_Material();
                oIngreso.IdIngresoM = id;
                oIngreso.Id_Usuario_Registro = value.Id_Usuario_Registro;
                oIngreso.Id_Camionero_Ingreso = value.Id_Camionero_Ingreso;
                oIngreso.Id_Vehiculo_Ingreso = value.Id_Vehiculo_Ingreso;

                oIngreso.Modificar();
                return Ok("Registro de ingreso actualizado correctamente.");
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/IngresoMaterial/5
        [HttpDelete]
        [Route("{id}")] 
        public IHttpActionResult Borrar(int id)
        {
            try
            {
                Ingreso_Material oIngreso = new Ingreso_Material();
                oIngreso.IdIngresoM = id;
                oIngreso.Borrar();
                return Ok("Registro de ingreso anulado correctamente.");
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}