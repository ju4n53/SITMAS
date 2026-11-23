using API_SITMAS.Models;
using System;
using System.Threading.Tasks;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/ReportesTrazabilidad")]
    public class ReportesTrazabilidadController : ApiController
    {
        private readonly ReportesTrazabilidad _repo = new ReportesTrazabilidad();

        // GET: api/ReportesTrazabilidad/ResumenKPIs?fechaDesde=2026-10-01&fechaHasta=2026-11-19&idTipoMaterial=1
        [HttpGet]
        [Route("ResumenKPIs")]
        public async Task<IHttpActionResult> GetResumenKPIs(DateTime? fechaDesde = null, DateTime? fechaHasta = null, int? idTipoMaterial = null)
        {
            if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde.Value.Date > fechaHasta.Value.Date)
                return BadRequest("La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.");

            if (idTipoMaterial.HasValue && idTipoMaterial.Value <= 0)
                return BadRequest("El identificador del tipo de material debe ser mayor a cero.");

            try
            {
                var data = await _repo.ObtenerResumenKPIsAsync(fechaDesde, fechaHasta, idTipoMaterial);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/ReportesTrazabilidad/PorMaterial?fechaDesde=2026-10-01&fechaHasta=2026-11-19&idTipoMaterial=1
        [HttpGet]
        [Route("PorMaterial")]
        public async Task<IHttpActionResult> GetPorMaterial(DateTime? fechaDesde = null, DateTime? fechaHasta = null, int? idTipoMaterial = null)
        {
            if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde.Value.Date > fechaHasta.Value.Date)
                return BadRequest("La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.");

            if (idTipoMaterial.HasValue && idTipoMaterial.Value < 0)
                return BadRequest("El identificador del tipo de material no puede ser negativo.");

            try
            {
                var data = await _repo.ObtenerPorMaterialAsync(fechaDesde, fechaHasta, idTipoMaterial);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/ReportesTrazabilidad/PorOrigen?fechaDesde=2026-10-01&fechaHasta=2026-11-19&idTipoMaterial=1
        [HttpGet]
        [Route("PorOrigen")]
        public async Task<IHttpActionResult> GetPorOrigen(DateTime? fechaDesde = null, DateTime? fechaHasta = null, int? idTipoMaterial = null)
        {
            if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde.Value.Date > fechaHasta.Value.Date)
                return BadRequest("La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.");

            if (idTipoMaterial.HasValue && idTipoMaterial.Value <= 0)
                return BadRequest("El identificador del tipo de material debe ser mayor a cero.");

            try
            {
                var data = await _repo.ObtenerPorOrigenAsync(fechaDesde, fechaHasta, idTipoMaterial);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/ReportesTrazabilidad/AuditoriaLotes?fechaDesde=2026-10-01&fechaHasta=2026-11-19&idTipoMaterial=1&estadoAuditoria=PARCIAL
        [HttpGet]
        [Route("AuditoriaLotes")]
        public async Task<IHttpActionResult> GetAuditoriaLotes(DateTime? fechaDesde = null, DateTime? fechaHasta = null, int? idTipoMaterial = null, string estadoAuditoria = null)
        {
            if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde.Value.Date > fechaHasta.Value.Date)
                return BadRequest("La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.");

            try
            {
                var data = await _repo.ObtenerAuditoriaLotesAsync(fechaDesde, fechaHasta, idTipoMaterial, estadoAuditoria);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/ReportesTrazabilidad/PlantaYSalidas?fechaDesde=2026-10-01&fechaHasta=2026-11-19
        [HttpGet]
        [Route("PlantaYSalidas")]
        public async Task<IHttpActionResult> GetPlantaYSalidas(DateTime? fechaDesde = null, DateTime? fechaHasta = null)
        {
            if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde.Value.Date > fechaHasta.Value.Date)
                return BadRequest("La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.");

            try
            {
                var data = await _repo.ObtenerPlantaYSalidasAsync(fechaDesde, fechaHasta);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}