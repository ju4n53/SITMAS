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
    public class IngresoMaterialController : ApiController
    {
        // GET: api/IngresoMaterial
        [HttpGet]
        public List<Ingreso_Material> ListarTodo()
        {
            Ingreso_Material oIngresoMaterial = new Ingreso_Material();

            DataTable dt = oIngresoMaterial.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Ingreso_Material>>(listaJson);

            return Lista;

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

        //// POST: api/IngresoMaterial

        [HttpPost]
        public IHttpActionResult Insertar([FromBody] Ingreso_Material value)
        {
            if (value == null) return BadRequest("Datos del ingreso inválidos.");

            try
            {
                Ingreso_Material oIngreso = new Ingreso_Material();
                oIngreso.Id_Origen = value.Id_Origen;
                oIngreso.Id_Usuario_Registro = value.Id_Usuario_Registro;
                oIngreso.Id_Camionero_Ingreso = value.Id_Camionero_Ingreso;
                oIngreso.Id_Vehiculo_Ingreso = value.Id_Vehiculo_Ingreso;

                // Ejecutamos la inserción y capturamos el ID de la base de datos
                int idAsignado = oIngreso.Insertar();

                // Respondemos con éxito enviando el ID asignado al Front
                return Ok(new { id = idAsignado, mensaje = "Cabecera de ingreso registrada." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Empleado/5
        //[HttpPut]

        public IHttpActionResult Modificar(int id, [FromBody] Ingreso_Material value)
        {
            if (value == null) return BadRequest("Datos vacíos.");

            try
            {
                Ingreso_Material oIngreso = new Ingreso_Material();
                oIngreso.IdIngresoM = id; // Tomamos el ID de la URL
                oIngreso.Id_Origen = value.Id_Origen;
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

        // DELETE: api/Empleado/5
        //[HttpDelete]

        public IHttpActionResult Borrar(int id)
        {
            try
            {
                Ingreso_Material oIngreso = new Ingreso_Material();
                oIngreso.IdIngresoM = id;

                oIngreso.Borrar();
                return Ok("Registro de ingreso eliminado correctamente.");
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


            //[HttpGet]
            //[Route("api/Ingreso_Material/ListarVista")]

            public List<Ingreso_Material> ListarVista()
            {
                Ingreso_Material oIngreso = new Ingreso_Material();
                DataTable dt = oIngreso.VistaIngreso_Material();

                var listaJson = JsonConvert.SerializeObject(dt);
                return JsonConvert.DeserializeObject<List<Ingreso_Material>>(listaJson);
            }

        }
}
