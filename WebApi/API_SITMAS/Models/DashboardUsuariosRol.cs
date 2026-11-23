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
    // 2. CLASE DE ACCESO A DATOS (ADO.NET)
    // =========================================================================

    public class DashboardUsuariosRol
    {
        // IMPORTANTE: Verifica que el nombre coincida con tu Web.config (ej. "Conexion" o "Gestion_SITMAS")
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