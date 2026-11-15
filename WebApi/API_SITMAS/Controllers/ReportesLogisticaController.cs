using API_SITMAS.Models;
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/ReportesLogistica")]
    public class ReportesLogisticaController : ApiController
    {
        private readonly ReportesLogisticaDatos _datos = new ReportesLogisticaDatos();

        // GET: api/ReportesLogistica/UsoVehiculos?fechaDesde=2026-10-01&fechaHasta=2026-11-01
        [HttpGet]
        [Route("UsoVehiculos")]
        public IHttpActionResult ObtenerUsoVehiculos(string fechaDesde, string fechaHasta)
        {
            // Validación de entrada
            if (string.IsNullOrWhiteSpace(fechaDesde) || string.IsNullOrWhiteSpace(fechaHasta))
                return BadRequest("Las fechas 'fechaDesde' y 'fechaHasta' son obligatorias.");

            try
            {
                DateTime desde = Convert.ToDateTime(fechaDesde);
                DateTime hasta = Convert.ToDateTime(fechaHasta);

                return Ok(_datos.ObtenerUsoVehiculos(desde, hasta));
            }
            catch (FormatException)
            {
                return BadRequest("El formato de fecha enviado no es válido.");
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        // GET: api/ReportesLogistica/Odometro?fechaDesde=2026-11-01&fechaHasta=2026-11-14
        [HttpGet]
        [Route("Odometro")]
        public IHttpActionResult ObtenerReporteOdometro(string fechaDesde, string fechaHasta)
        {
            if (string.IsNullOrWhiteSpace(fechaDesde) || string.IsNullOrWhiteSpace(fechaHasta))
                return BadRequest("Las fechas 'fechaDesde' y 'fechaHasta' son obligatorias.");

            try
            {
                DateTime desde = Convert.ToDateTime(fechaDesde);
                DateTime hasta = Convert.ToDateTime(fechaHasta);

                return Ok(_datos.ObtenerReporteOdometro(desde, hasta));
            }
            catch (FormatException)
            {
                return BadRequest("El formato de fecha enviado no es válido.");
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


    }
}