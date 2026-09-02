using API_SITMAS.Models;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/recursosmovilizados")]
    public class RecursosMovilizadosController : ApiController
    {
        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarTodo()
        {
            try
            {
                RecursoMovilizado oRecurso = new RecursoMovilizado();
                List<RecursoMovilizado> lista = oRecurso.SelectAll();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}