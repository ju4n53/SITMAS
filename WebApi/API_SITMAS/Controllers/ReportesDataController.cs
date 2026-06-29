using API_SITMAS.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    // Habilitamos CORS para que tu Live Server local pueda consumir los reportes sin bloqueos
    //[EnableCors(origins: "http://127.0.0.1:5501", headers: "*", methods: "*")]
    [RoutePrefix("api/Reportes")]
    public class ReportesDataController : ApiController
    {
        private InformesManager _manager = new InformesManager();

        // 1. GET: api/Reportes/ListadoCabeceras
        [HttpGet]
        [Route("ListadoCabeceras")]
        public IHttpActionResult GetListadoCabeceras()
        {
            try
            {
                DataTable dt = _manager.EjcutarSpReporte("sp_ReporteListadoIngresosCabecera");
                var json = JsonConvert.SerializeObject(dt);
                var resultado = JsonConvert.DeserializeObject<List<ReporteIngresoCabecera>>(json);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // 2. GET: api/Reportes/ListadoDetalles
        [HttpGet]
        [Route("ListadoDetalles")]
        public IHttpActionResult GetListadoDetalles()
        {
            try
            {
                DataTable dt = _manager.EjcutarSpReporte("sp_ReporteListadoDetalleIngresos");
                var json = JsonConvert.SerializeObject(dt);
                var resultado = JsonConvert.DeserializeObject<List<ReporteDetalleIngreso>>(json);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // 3. GET: api/Reportes/ListadoClasificaciones
        [HttpGet]
        [Route("ListadoClasificaciones")]
        public IHttpActionResult GetListadoClasificaciones()
        {
            try
            {
                DataTable dt = _manager.EjcutarSpReporte("sp_ReporteListadoMaterialClasificado");
                var json = JsonConvert.SerializeObject(dt);
                var resultado = JsonConvert.DeserializeObject<List<ReporteMaterialClasificado>>(json);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // 4. GET: api/Reportes/ListadoSalidas
        [HttpGet]
        [Route("ListadoSalidas")]
        public IHttpActionResult GetListadoSalidas()
        {
            try
            {
                DataTable dt = _manager.EjcutarSpReporte("sp_ReporteListadoMovimientosSalida");
                var json = JsonConvert.SerializeObject(dt);
                var resultado = JsonConvert.DeserializeObject<List<ReporteMovimientoSalida>>(json);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // 5. GET: api/Reportes/CalidadTotales
        [HttpGet]
        [Route("CalidadTotales")]
        public IHttpActionResult GetCalidadTotales()
        {
            try
            {
                DataTable dt = _manager.EjcutarSpReporte("sp_ReporteCalidadMaterialTotales");
                var json = JsonConvert.SerializeObject(dt);

                // SP devuelve una única fila con los totales, deserializamos como lista y enviamos el primero

                var lista = JsonConvert.DeserializeObject<List<ReporteCalidadTotales>>(json);
                return Ok(lista[0]);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
