using System;
using System.Web.Http;
using API_SITMAS.Models;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/DashboardUsuariosRol")]
    public class DashboardUsuariosRolController : ApiController
    {
        private readonly DashboardUsuariosRol _dashboardService = new DashboardUsuariosRol();

        /// <summary>
        /// Obtiene los KPIs, series gráficas y planilla consolidada del Dashboard Institucional.
        /// Ejemplo: GET api/DashboardUsuariosRol/Institucionales?fechaDesde=2026-01-01&fechaHasta=2026-11-23&idOrigen=5
        /// </summary>
        [HttpGet]
        [Route("Institucionales")]
        public IHttpActionResult GetDashboardInstitucionales(
            [FromUri] DateTime? fechaDesde = null,
            [FromUri] DateTime? fechaHasta = null,
            [FromUri] int? idOrigen = null)
        {
            try
            {
                if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde.Value.Date > fechaHasta.Value.Date)
                {
                    return BadRequest("La fecha 'desde' no puede ser posterior a la fecha 'hasta'.");
                }

                // Si idOrigen llega como 0 o negativo ("Todas las instituciones"), lo normalizamos a null
                int? origenFiltro = (idOrigen.HasValue && idOrigen.Value > 0) ? idOrigen : null;

                var data = _dashboardService.ObtenerDashboardInstitucionales(fechaDesde, fechaHasta, origenFiltro);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Error al obtener el Dashboard Institucional: " + ex.Message, ex));
            }
        }


        /// <summary>
        /// Obtiene los KPIs, series gráficas, semáforo preventivo y planilla de auditoría del Dashboard de Mantenimiento Vehicular.
        /// Ejemplo: GET api/DashboardUsuariosRol/Mantenimiento?fechaDesde=2026-01-01&fechaHasta=2026-11-23&idVehiculo=2&tipoMantenimiento=preventivo
        /// </summary>
        [HttpGet]
        [Route("Mantenimiento")]
        public IHttpActionResult GetDashboardMantenimiento(
            [FromUri] DateTime? fechaDesde = null,
            [FromUri] DateTime? fechaHasta = null,
            [FromUri] int? idVehiculo = null,
            [FromUri] string tipoMantenimiento = null)
        {
            try
            {
                if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde.Value.Date > fechaHasta.Value.Date)
                {
                    return BadRequest("La fecha 'desde' no puede ser posterior a la fecha 'hasta'.");
                }

                // Normalizamos idVehiculo <= 0 ("Todos los vehículos") y tipoMantenimiento vacío o "todos" a null
                int? vehiculoFiltro = (idVehiculo.HasValue && idVehiculo.Value > 0) ? idVehiculo : null;
                string tipoFiltro = (string.IsNullOrWhiteSpace(tipoMantenimiento) ||
                                     tipoMantenimiento.Trim().Equals("todos", StringComparison.OrdinalIgnoreCase))
                    ? null
                    : tipoMantenimiento.Trim();

                var data = _dashboardService.ObtenerDashboardMantenimiento(
                    fechaDesde,
                    fechaHasta,
                    vehiculoFiltro,
                    tipoFiltro);

                return Ok(data);
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Error al obtener el Dashboard de Mantenimiento: " + ex.Message, ex));
            }
        }





    }

}