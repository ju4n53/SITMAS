using API_SITMAS.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Web.Http;
using System.Web.UI.WebControls.WebParts;

namespace API_SITMAS.Controllers
{
    // Habilitamos CORS para tu servidor local de Live Server
    //[EnableCors(origins: "http://127.0.0.1:5501", headers: "*", methods: "*")]

    [RoutePrefix("api/Dashboard")]
    public class DashboardController : ApiController
    {
        private DashboardManager _manager = new DashboardManager();

        // GET: api/Dashboard/PesoBrutoAcumulado
        [HttpGet]
        [Route("PesoBrutoAcumulado")]
        public IHttpActionResult GetPesoBruto()
        {
            try
            {
                DataTable dt = _manager.ObtenerPesoBrutoAcumulado();

                // Serializamos y mapeamos automáticamente a nuestra lista tipada
                var json = JsonConvert.SerializeObject(dt);
                var resultado = JsonConvert.DeserializeObject<List<AcumuladoPesoBruto>>(json);

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        // GET: api/Dashboard/RendimientoClasificacion
        [HttpGet]
        [Route("RendimientoClasificacion")]
        public IHttpActionResult GetRendimiento()
        {
            try
            {
                DataTable dt = _manager.ObtenerRendimientoClasificacion();

                var json = JsonConvert.SerializeObject(dt);
                var resultado = JsonConvert.DeserializeObject<List<RendimientoClasificacion>>(json);

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
