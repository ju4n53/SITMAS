using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/tipomovimientos")]
    public class TipoMovimientosController : ApiController
    {
        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                TipoMovimiento oTipoMov = new TipoMovimiento();
                List<TipoMovimiento> lista = oTipoMov.SelectAll();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}