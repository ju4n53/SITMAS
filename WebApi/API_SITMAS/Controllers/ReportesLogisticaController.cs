using API_SITMAS.Models;
using System;
using System.Globalization;
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

        // GET: api/ReportesLogistica/MantenimientoPreventivo
        [HttpGet]
        [Route("MantenimientoPreventivo")]
        public IHttpActionResult ObtenerMantenimientoPreventivo()
        {
            try
            {
                return Ok(_datos.ObtenerMantenimientoPreventivo());
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/ReportesLogistica/HistorialMantenimiento
        // GET: api/ReportesLogistica/HistorialMantenimiento?fechaDesde=2026-01-01&fechaHasta=2026-11-15
        [HttpGet]
        [Route("HistorialMantenimiento")]
        public IHttpActionResult ObtenerHistorialMantenimiento(string fechaDesde = null, string fechaHasta = null)
        {
            try
            {
                DateTime? desde = !string.IsNullOrWhiteSpace(fechaDesde)
                    ? Convert.ToDateTime(fechaDesde)
                    : (DateTime?)null;

                DateTime? hasta = !string.IsNullOrWhiteSpace(fechaHasta)
                    ? Convert.ToDateTime(fechaHasta)
                    : (DateTime?)null;

                if (desde.HasValue && hasta.HasValue && desde.Value > hasta.Value)
                    return BadRequest("La fecha 'fechaDesde' no puede ser mayor a 'fechaHasta'.");

                return Ok(_datos.ObtenerHistorialMantenimiento(desde, hasta));
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


        // GET: api/ReportesLogistica/PertLogistica
        // GET: api/ReportesLogistica/PertLogistica?fechaDesde=2025-01-01&fechaHasta=2026-12-31
        [HttpGet]
        [Route("PertLogistica")]
        public IHttpActionResult ObtenerPertLogistica(string fechaDesde = null, string fechaHasta = null)
        {
            try
            {
                DateTime? desde = null;
                DateTime? hasta = null;

                if (!string.IsNullOrWhiteSpace(fechaDesde))
                {
                    DateTime fechaTempDesde;
                    if (!DateTime.TryParseExact(fechaDesde.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fechaTempDesde))
                        return BadRequest("El formato de 'fechaDesde' debe ser YYYY-MM-DD.");

                    desde = fechaTempDesde;
                }

                if (!string.IsNullOrWhiteSpace(fechaHasta))
                {
                    DateTime fechaTempHasta;
                    if (!DateTime.TryParseExact(fechaHasta.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fechaTempHasta))
                        return BadRequest("El formato de 'fechaHasta' debe ser YYYY-MM-DD.");

                    hasta = fechaTempHasta;
                }

                if (desde.HasValue && hasta.HasValue && desde.Value > hasta.Value)
                    return BadRequest("La fecha 'fechaDesde' no puede ser mayor a 'fechaHasta'.");

                return Ok(_datos.ObtenerPertLogistica(desde, hasta));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


    }
}