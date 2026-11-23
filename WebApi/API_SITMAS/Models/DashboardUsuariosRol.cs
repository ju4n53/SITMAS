using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    // =========================================================================
    // 1. DTOs DEL DASHBOARD INSTITUCIONAL (Contrato exacto con los 5 Result Sets)
    // =========================================================================

    public class DashboardInstitucionalResponse
    {
        public KpisInstitucionalesDto Kpis { get; set; }
        public List<EvolucionMensualInstitucionalDto> EvolucionMensual { get; set; }
        public List<DistribucionMaterialInstitucionalDto> DistribucionMateriales { get; set; }
        public List<RankingInstitucionDto> RankingInstituciones { get; set; }
        public List<PlanillaMensualInstitucionalDto> PlanillaMensual { get; set; }

        public DashboardInstitucionalResponse()
        {
            Kpis = new KpisInstitucionalesDto();
            EvolucionMensual = new List<EvolucionMensualInstitucionalDto>();
            DistribucionMateriales = new List<DistribucionMaterialInstitucionalDto>();
            RankingInstituciones = new List<RankingInstitucionDto>();
            PlanillaMensual = new List<PlanillaMensualInstitucionalDto>();
        }
    }

    public class KpisInstitucionalesDto
    {
        public int TotalEntregas { get; set; }
        public int InstitucionesActivas { get; set; }
        public decimal PesoBrutoTotalKg { get; set; }
        public decimal PesoVerdeKg { get; set; }
        public decimal PesoAmarilloKg { get; set; }
        public decimal PesoRecuperadoTotalKg { get; set; }
        public decimal PesoRojoKg { get; set; }
        public decimal PesoPendienteClasificarKg { get; set; }
        public decimal TasaRecuperacionPct { get; set; }
    }

    public class EvolucionMensualInstitucionalDto
    {
        public string AnioMes { get; set; }
        public int CantEntregas { get; set; }
        public decimal PesoBrutoKg { get; set; }
        public decimal PesoVerdeKg { get; set; }
        public decimal PesoAmarilloKg { get; set; }
        public decimal PesoRecuperadoKg { get; set; }
        public decimal PesoRojoKg { get; set; }
        public decimal TasaRecuperacionPct { get; set; }
    }

    public class DistribucionMaterialInstitucionalDto
    {
        public string TipoMaterial { get; set; }
        public decimal PesoVerdeKg { get; set; }
        public decimal PesoAmarilloKg { get; set; }
        public decimal PesoRecuperadoKg { get; set; }
    }

    public class RankingInstitucionDto
    {
        public int IdOrigen { get; set; }
        public string Institucion { get; set; }
        public int CantEntregas { get; set; }
        public decimal PesoBrutoKg { get; set; }
        public decimal PesoRecuperadoKg { get; set; }
        public decimal PesoRojoKg { get; set; }
        public decimal TasaRecuperacionPct { get; set; }
        public DateTime? UltimaEntrega { get; set; }
    }

    public class PlanillaMensualInstitucionalDto
    {
        public string AnioMes { get; set; }
        public int InstitucionesActivas { get; set; }
        public int CantEntregas { get; set; }
        public decimal PesoBrutoKg { get; set; }
        public decimal PesoVerdeKg { get; set; }
        public decimal PesoAmarilloKg { get; set; }
        public decimal PesoRojoKg { get; set; }
        public decimal PesoPendienteClasificarKg { get; set; }
        public decimal TasaRecuperacionPct { get; set; }
    }


    // =========================================================================
    // 2. DTOs DEL DASHBOARD DE MANTENIMIENTO VEHICULAR (5 Result Sets)
    // =========================================================================

    public class DashboardMantenimientoResponse
    {
        public KpisMantenimientoDto Kpis { get; set; }
        public List<EvolucionMensualMantenimientoDto> EvolucionMensual { get; set; }
        public List<DistribucionTipoServiceDto> DistribucionServicios { get; set; }
        public List<SaludPreventivaVehiculoDto> SaludPreventivaFlota { get; set; }
        public List<AuditoriaMantenimientoDto> PlanillaAuditoria { get; set; }

        public DashboardMantenimientoResponse()
        {
            Kpis = new KpisMantenimientoDto();
            EvolucionMensual = new List<EvolucionMensualMantenimientoDto>();
            DistribucionServicios = new List<DistribucionTipoServiceDto>();
            SaludPreventivaFlota = new List<SaludPreventivaVehiculoDto>();
            PlanillaAuditoria = new List<AuditoriaMantenimientoDto>();
        }
    }

    public class KpisMantenimientoDto
    {
        public int TotalServicios { get; set; }
        public int TotalPreventivos { get; set; }
        public int TotalReparaciones { get; set; }
        public int TotalUrgentes { get; set; }
        public decimal PorcentajePreventivo { get; set; }
        public int AlertasVencidas { get; set; }
        public int AlertasProximas { get; set; }
        public int VehiculosAtendidos { get; set; }
        public int TotalFlotaActiva { get; set; }
    }

    public class EvolucionMensualMantenimientoDto
    {
        public string PeriodoISO { get; set; }
        public string PeriodoEtiqueta { get; set; }
        public int CantidadPreventivo { get; set; }
        public int CantidadReparacion { get; set; }
        public int CantidadUrgente { get; set; }
        public int TotalServicios { get; set; }
    }

    public class DistribucionTipoServiceDto
    {
        public string TipoMantenimiento { get; set; }
        public string TipoService { get; set; }
        public int CantidadServicios { get; set; }
        public decimal PorcentajeDelTotal { get; set; }
    }

    public class SaludPreventivaVehiculoDto
    {
        public int IdVehiculo { get; set; }
        public string Patente { get; set; }
        public string MarcaModelo { get; set; }
        public string TipoVehiculo { get; set; }
        public decimal OdometroActual { get; set; }
        public int OrdenService { get; set; }
        public string TipoService { get; set; }
        public int IntervaloKm { get; set; }
        public string FechaUltimoServiceFormateada { get; set; }
        public decimal OdometroUltimoService { get; set; }
        public decimal KmRecorridos { get; set; }
        public decimal KmRestantes { get; set; }
        public decimal PorcentajeDesgaste { get; set; }
        public string EstadoAlerta { get; set; }
    }

    public class AuditoriaMantenimientoDto
    {
        public int IdMantenimientoVehi { get; set; }
        public string FechaISO { get; set; }
        public string FechaFormateada { get; set; }
        public int IdVehiculo { get; set; }
        public string Patente { get; set; }
        public string MarcaModelo { get; set; }
        public string TipoVehiculo { get; set; }
        public string TipoMantenimiento { get; set; }
        public string TipoService { get; set; }
        public decimal KmAlMomentoService { get; set; }
        public int IdMecanico { get; set; }
        public string MecanicoNombreCompleto { get; set; }
    }


    public class DashboardUsuariosRol
    {
        
        private readonly string _connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public DashboardInstitucionalResponse ObtenerDashboardInstitucionales(DateTime? fechaDesde, DateTime? fechaHasta, int? idOrigen)
        {
            var resultado = new DashboardInstitucionalResponse();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                using (SqlCommand cmd = new SqlCommand("dbo.sp_Dashboard_Institucionales", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.Add("@FechaDesde", SqlDbType.Date).Value = (object)fechaDesde ?? DBNull.Value;
                    cmd.Parameters.Add("@FechaHasta", SqlDbType.Date).Value = (object)fechaHasta ?? DBNull.Value;
                    cmd.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = (object)idOrigen ?? DBNull.Value;

                    conn.Open();

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        // -----------------------------------------------------
                        // RESULT SET 1: KPIs Consolidados (Fila única)
                        // -----------------------------------------------------
                        if (reader.Read())
                        {
                            resultado.Kpis = new KpisInstitucionalesDto
                            {
                                TotalEntregas = GetIntSafe(reader, "TotalEntregas"),
                                InstitucionesActivas = GetIntSafe(reader, "InstitucionesActivas"),
                                PesoBrutoTotalKg = GetDecimalSafe(reader, "PesoBrutoTotalKg"),
                                PesoVerdeKg = GetDecimalSafe(reader, "PesoVerdeKg"),
                                PesoAmarilloKg = GetDecimalSafe(reader, "PesoAmarilloKg"),
                                PesoRecuperadoTotalKg = GetDecimalSafe(reader, "PesoRecuperadoTotalKg"),
                                PesoRojoKg = GetDecimalSafe(reader, "PesoRojoKg"),
                                PesoPendienteClasificarKg = GetDecimalSafe(reader, "PesoPendienteClasificarKg"),
                                TasaRecuperacionPct = GetDecimalSafe(reader, "TasaRecuperacionPct")
                            };
                        }

                        // -----------------------------------------------------
                        // RESULT SET 2: Evolución Mensual
                        // -----------------------------------------------------
                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                resultado.EvolucionMensual.Add(new EvolucionMensualInstitucionalDto
                                {
                                    AnioMes = GetStringSafe(reader, "AnioMes"),
                                    CantEntregas = GetIntSafe(reader, "CantEntregas"),
                                    PesoBrutoKg = GetDecimalSafe(reader, "PesoBrutoKg"),
                                    PesoVerdeKg = GetDecimalSafe(reader, "PesoVerdeKg"),
                                    PesoAmarilloKg = GetDecimalSafe(reader, "PesoAmarilloKg"),
                                    PesoRecuperadoKg = GetDecimalSafe(reader, "PesoRecuperadoKg"),
                                    PesoRojoKg = GetDecimalSafe(reader, "PesoRojoKg"),
                                    TasaRecuperacionPct = GetDecimalSafe(reader, "TasaRecuperacionPct")
                                });
                            }
                        }

                        // -----------------------------------------------------
                        // RESULT SET 3: Distribución por Tipo de Material
                        // -----------------------------------------------------
                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                resultado.DistribucionMateriales.Add(new DistribucionMaterialInstitucionalDto
                                {
                                    TipoMaterial = GetStringSafe(reader, "TipoMaterial"),
                                    PesoVerdeKg = GetDecimalSafe(reader, "PesoVerdeKg"),
                                    PesoAmarilloKg = GetDecimalSafe(reader, "PesoAmarilloKg"),
                                    PesoRecuperadoKg = GetDecimalSafe(reader, "PesoRecuperadoKg")
                                });
                            }
                        }

                        // -----------------------------------------------------
                        // RESULT SET 4: Ranking de Instituciones Generadoras
                        // -----------------------------------------------------
                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                resultado.RankingInstituciones.Add(new RankingInstitucionDto
                                {
                                    IdOrigen = GetIntSafe(reader, "IdOrigen"),
                                    Institucion = GetStringSafe(reader, "Institucion"),
                                    CantEntregas = GetIntSafe(reader, "CantEntregas"),
                                    PesoBrutoKg = GetDecimalSafe(reader, "PesoBrutoKg"),
                                    PesoRecuperadoKg = GetDecimalSafe(reader, "PesoRecuperadoKg"),
                                    PesoRojoKg = GetDecimalSafe(reader, "PesoRojoKg"),
                                    TasaRecuperacionPct = GetDecimalSafe(reader, "TasaRecuperacionPct"),
                                    UltimaEntrega = GetNullableDateTime(reader, "UltimaEntrega")
                                });
                            }
                        }

                        // -----------------------------------------------------
                        // RESULT SET 5: Planilla Mensual Consolidada
                        // -----------------------------------------------------
                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                resultado.PlanillaMensual.Add(new PlanillaMensualInstitucionalDto
                                {
                                    AnioMes = GetStringSafe(reader, "AnioMes"),
                                    InstitucionesActivas = GetIntSafe(reader, "InstitucionesActivas"),
                                    CantEntregas = GetIntSafe(reader, "CantEntregas"),
                                    PesoBrutoKg = GetDecimalSafe(reader, "PesoBrutoKg"),
                                    PesoVerdeKg = GetDecimalSafe(reader, "PesoVerdeKg"),
                                    PesoAmarilloKg = GetDecimalSafe(reader, "PesoAmarilloKg"),
                                    PesoRojoKg = GetDecimalSafe(reader, "PesoRojoKg"),
                                    PesoPendienteClasificarKg = GetDecimalSafe(reader, "PesoPendienteClasificarKg"),
                                    TasaRecuperacionPct = GetDecimalSafe(reader, "TasaRecuperacionPct")
                                });
                            }
                        }
                    }
                }
            }

            return resultado;
        }


        public DashboardMantenimientoResponse ObtenerDashboardMantenimiento(
            DateTime? fechaDesde,
            DateTime? fechaHasta,
            int? idVehiculo,
            string tipoMantenimiento)
        {
            var resultado = new DashboardMantenimientoResponse();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                using (SqlCommand cmd = new SqlCommand("dbo.sp_Dashboard_Mantenimiento", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.Add("@FechaDesde", SqlDbType.Date).Value = (object)fechaDesde ?? DBNull.Value;
                    cmd.Parameters.Add("@FechaHasta", SqlDbType.Date).Value = (object)fechaHasta ?? DBNull.Value;
                    cmd.Parameters.Add("@IdVehiculo", SqlDbType.Int).Value = (object)idVehiculo ?? DBNull.Value;
                    cmd.Parameters.Add("@TipoMantenimiento", SqlDbType.VarChar, 50).Value =
                        string.IsNullOrWhiteSpace(tipoMantenimiento) ? (object)DBNull.Value : tipoMantenimiento.Trim();

                    conn.Open();

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        // -----------------------------------------------------
                        // RESULT SET 1: KPIs Ejecutivos (Fila única)
                        // -----------------------------------------------------
                        if (reader.Read())
                        {
                            resultado.Kpis = new KpisMantenimientoDto
                            {
                                TotalServicios = GetIntSafe(reader, "TotalServicios"),
                                TotalPreventivos = GetIntSafe(reader, "TotalPreventivos"),
                                TotalReparaciones = GetIntSafe(reader, "TotalReparaciones"),
                                TotalUrgentes = GetIntSafe(reader, "TotalUrgentes"),
                                PorcentajePreventivo = GetDecimalSafe(reader, "PorcentajePreventivo"),
                                AlertasVencidas = GetIntSafe(reader, "AlertasVencidas"),
                                AlertasProximas = GetIntSafe(reader, "AlertasProximas"),
                                VehiculosAtendidos = GetIntSafe(reader, "VehiculosAtendidos"),
                                TotalFlotaActiva = GetIntSafe(reader, "TotalFlotaActiva")
                            };
                        }

                        // -----------------------------------------------------
                        // RESULT SET 2: Evolución Mensual por Tipo
                        // -----------------------------------------------------
                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                resultado.EvolucionMensual.Add(new EvolucionMensualMantenimientoDto
                                {
                                    PeriodoISO = GetStringSafe(reader, "PeriodoISO"),
                                    PeriodoEtiqueta = GetStringSafe(reader, "PeriodoEtiqueta"),
                                    CantidadPreventivo = GetIntSafe(reader, "CantidadPreventivo"),
                                    CantidadReparacion = GetIntSafe(reader, "CantidadReparacion"),
                                    CantidadUrgente = GetIntSafe(reader, "CantidadUrgente"),
                                    TotalServicios = GetIntSafe(reader, "TotalServicios")
                                });
                            }
                        }

                        // -----------------------------------------------------
                        // RESULT SET 3: Distribución por Tipo de Service / Tarea
                        // -----------------------------------------------------
                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                resultado.DistribucionServicios.Add(new DistribucionTipoServiceDto
                                {
                                    TipoMantenimiento = GetStringSafe(reader, "TipoMantenimiento"),
                                    TipoService = GetStringSafe(reader, "TipoService"),
                                    CantidadServicios = GetIntSafe(reader, "CantidadServicios"),
                                    PorcentajeDelTotal = GetDecimalSafe(reader, "PorcentajeDelTotal")
                                });
                            }
                        }

                        // -----------------------------------------------------
                        // RESULT SET 4: Semáforo de Salud Preventiva de Flota
                        // -----------------------------------------------------
                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                resultado.SaludPreventivaFlota.Add(new SaludPreventivaVehiculoDto
                                {
                                    IdVehiculo = GetIntSafe(reader, "IdVehiculo"),
                                    Patente = GetStringSafe(reader, "Patente"),
                                    MarcaModelo = GetStringSafe(reader, "MarcaModelo"),
                                    TipoVehiculo = GetStringSafe(reader, "TipoVehiculo"),
                                    OdometroActual = GetDecimalSafe(reader, "OdometroActual"),
                                    OrdenService = GetIntSafe(reader, "OrdenService"),
                                    TipoService = GetStringSafe(reader, "TipoService"),
                                    IntervaloKm = GetIntSafe(reader, "IntervaloKm"),
                                    FechaUltimoServiceFormateada = GetStringSafe(reader, "FechaUltimoServiceFormateada"),
                                    OdometroUltimoService = GetDecimalSafe(reader, "OdometroUltimoService"),
                                    KmRecorridos = GetDecimalSafe(reader, "KmRecorridos"),
                                    KmRestantes = GetDecimalSafe(reader, "KmRestantes"),
                                    PorcentajeDesgaste = GetDecimalSafe(reader, "PorcentajeDesgaste"),
                                    EstadoAlerta = GetStringSafe(reader, "EstadoAlerta")
                                });
                            }
                        }

                        // -----------------------------------------------------
                        // RESULT SET 5: Planilla de Auditoría Detallada
                        // -----------------------------------------------------
                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                resultado.PlanillaAuditoria.Add(new AuditoriaMantenimientoDto
                                {
                                    IdMantenimientoVehi = GetIntSafe(reader, "IdMantenimientoVehi"),
                                    FechaISO = GetStringSafe(reader, "FechaISO"),
                                    FechaFormateada = GetStringSafe(reader, "FechaFormateada"),
                                    IdVehiculo = GetIntSafe(reader, "IdVehiculo"),
                                    Patente = GetStringSafe(reader, "Patente"),
                                    MarcaModelo = GetStringSafe(reader, "MarcaModelo"),
                                    TipoVehiculo = GetStringSafe(reader, "TipoVehiculo"),
                                    TipoMantenimiento = GetStringSafe(reader, "TipoMantenimiento"),
                                    TipoService = GetStringSafe(reader, "TipoService"),
                                    KmAlMomentoService = GetDecimalSafe(reader, "KmAlMomentoService"),
                                    IdMecanico = GetIntSafe(reader, "IdMecanico"),
                                    MecanicoNombreCompleto = GetStringSafe(reader, "MecanicoNombreCompleto")
                                });
                            }
                        }
                    }
                }
            }

            return resultado;
        }


        // =====================================================================
        // HELPERS DEFENSIVOS DE LECTURA (Evitan excepciones por DBNull)
        // =====================================================================

        private static int GetIntSafe(SqlDataReader reader, string columnName)
        {
            int ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? 0 : Convert.ToInt32(reader.GetValue(ordinal));
        }

        private static decimal GetDecimalSafe(SqlDataReader reader, string columnName)
        {
            int ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? 0m : Convert.ToDecimal(reader.GetValue(ordinal));
        }

        private static string GetStringSafe(SqlDataReader reader, string columnName)
        {
            int ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
        }

        private static DateTime? GetNullableDateTime(SqlDataReader reader, string columnName)
        {
            int ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? (DateTime?)null : reader.GetDateTime(ordinal);
        }
    }
}