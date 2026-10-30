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
    //[EnableCors(origins: "http://127.0.0.1:5501", headers: "*", methods: "*")]
    [RoutePrefix("api/ReporteTrazabilidad")]
    public class ReporteTrazabilidadController : ApiController
    {
        // GET: api/ReporteTrazabilidad/Completo
        [HttpGet]
        [Route("Completo")]
        public IHttpActionResult GetCompleto()
        {
            try
            {
                ReporteTrazabilidad reporte = new ReporteTrazabilidad();
                DataTable dt = reporte.ObtenerReporteCompleto();

                var listaJson = JsonConvert.SerializeObject(dt);
                var listaFinal = JsonConvert.DeserializeObject<List<ReporteTrazabilidad>>(listaJson);

                return Ok(listaFinal);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}