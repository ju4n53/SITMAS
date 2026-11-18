using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    // DTO para reporte de uso de vehiculos
    public class DTO_HojaRutaCabecera
    {
        public int Id { get; set; }
        public DateTime HojaRutaFecha { get; set; }
        public int Id_Vehiculo { get; set; }
        public int? Id_Chofer { get; set; }
        public int? Id_Estado { get; set; }
        public string FechaFormateada { get; set; }
        public string Vehiculo { get; set; }
        public string ChoferNombreCompleto { get; set; }
        public string Estado { get; set; }
        public decimal Distancia_Total_Estimada_Km { get; set; }
    }


    //DTO para el Reporte de Odómetro
    public class DTO_ReporteOdometro
    {
        public int IdRegistroOdomet { get; set; }
        public DateTime FechaRegOdom { get; set; }
        public string FechaISO { get; set; }
        public string FechaFormateada { get; set; }
        public int IdVehiculo { get; set; }
        public string Vehiculo { get; set; }
        public decimal InicioOdom { get; set; }
        public decimal? FinalOdom { get; set; } // Nullable porque puede estar en curso
        public decimal KmReales { get; set; }
        public string EstadoOdometro { get; set; }
        public int? Id_HojaRuta { get; set; }   // Nullable porque puede ser movimiento interno
        public string TipoMovimiento { get; set; }
        public decimal KmEstimadosHDR { get; set; }
        public decimal DesvioKm { get; set; }
        public string ChoferNombreCompleto { get; set; }
    }


    // DTO Estado actual de desgaste preventivo
    public class DTO_ReporteMantenimientoPreventivo
    {
        public int IdVehiculo { get; set; }
        public string Vehiculo { get; set; }
        public decimal OdometroActual { get; set; }
        public int OrdenService { get; set; }
        public string TipoService { get; set; }
        public int IntervaloKm { get; set; }

        // Nullable por vehículo sin services
        public int? IdUltimoMantenimiento { get; set; }
        public string FechaUltimoServiceISO { get; set; }

        public string FechaUltimoServiceFormateada { get; set; }
        public string MecanicoUltimoService { get; set; }
        public decimal OdometroUltimoService { get; set; }
        public decimal KmRecorridos { get; set; }
        public decimal KmRestantes { get; set; }
        public decimal PorcentajeDesgaste { get; set; }
        public string EstadoAlerta { get; set; }
    }

    // DTO Bitácora intervenciones en taller
    public class DTO_ReporteHistorialMantenimiento
    {
        public int IdMantenimiento_Vehi { get; set; }
        public DateTime fechaMantenimiento { get; set; }
        public string FechaISO { get; set; }
        public string FechaFormateada { get; set; }
        public int Id_Vehiculo { get; set; }
        public string Vehiculo { get; set; }
        public string TipoMantenimiento { get; set; }
        public string TipoService { get; set; }
        public int Id_odometro { get; set; }
        public decimal KmAlMomentoService { get; set; }
        public int Id_Mecanico { get; set; }
        public string MecanicoNombreCompleto { get; set; }
    }

    // DTO para el análisis PERT / Ruta Crítica de Logística
    public class DTO_NodoPertLogistica
    {
        public string Id { get; set; }
        public string Nombre { get; set; }
        public List<string> Precedencia { get; set; }
        public decimal To { get; set; }
        public decimal Tm { get; set; }
        public decimal Tp { get; set; }
        public int MuestrasReales { get; set; }
        public string OrigenDato { get; set; }
    }


    // DTO para Reporte de Consumo Combustible
    public class DTO_ReporteConsumoCombustible
    {
        public int Id_Consumo { get; set; }
        public int IdRegistroOdomet { get; set; }
        public DateTime FechaRegOdom { get; set; }
        public string FechaISO { get; set; }
        public string FechaFormateada { get; set; }
        public int IdVehiculo { get; set; }
        public string Vehiculo { get; set; }
        public int? Id_HojaRuta { get; set; }
        public string TipoMovimiento { get; set; }
        public string ChoferNombreCompleto { get; set; }
        public int Id_Combustible { get; set; }
        public string TipoCombustible { get; set; }
        public decimal KmReales { get; set; }
        public decimal ConsumoTeoricoLtsKm { get; set; }
        public decimal PrecioLitroAplicado { get; set; }
        public decimal CostoPorKm { get; set; }
        public decimal LitrosConsumidos { get; set; }
        public decimal CostoTotalViaje { get; set; }
    }


    public class ReportesLogisticaDatos
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public List<DTO_HojaRutaCabecera> ObtenerUsoVehiculos(DateTime fechaDesde, DateTime fechaHasta)
        {
            var lista = new List<DTO_HojaRutaCabecera>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_Reporte_UsoVehiculos", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@FechaDesde", fechaDesde);
                    sqlCom.Parameters.AddWithValue("@FechaHasta", fechaHasta);

                    sqlCnn.Open();

                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new DTO_HojaRutaCabecera
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                HojaRutaFecha = Convert.ToDateTime(reader["HojaRutaFecha"]),
                                Id_Vehiculo = Convert.ToInt32(reader["Id_Vehiculo"]),
                                Id_Chofer = reader["Id_Chofer"] != DBNull.Value ? Convert.ToInt32(reader["Id_Chofer"]) : (int?)null,
                                Id_Estado = reader["Id_Estado"] != DBNull.Value ? Convert.ToInt32(reader["Id_Estado"]) : (int?)null,
                                FechaFormateada = reader["FechaFormateada"].ToString(),
                                Vehiculo = reader["Vehiculo"].ToString(),
                                ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString(),
                                Estado = reader["Estado"].ToString(),
                                Distancia_Total_Estimada_Km = Convert.ToDecimal(reader["Distancia_Total_Estimada_Km"])
                            });
                        }
                    }
                }
            }
            return lista;
        }


        public List<DTO_ReporteOdometro> ObtenerReporteOdometro(DateTime fechaDesde, DateTime fechaHasta)
        {
            var lista = new List<DTO_ReporteOdometro>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ReporteOdometro", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@FechaDesde", fechaDesde);
                    sqlCom.Parameters.AddWithValue("@FechaHasta", fechaHasta);

                    sqlCnn.Open();

                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new DTO_ReporteOdometro
                            {
                                IdRegistroOdomet = Convert.ToInt32(reader["IdRegistroOdomet"]),
                                FechaRegOdom = Convert.ToDateTime(reader["FechaRegOdom"]),
                                FechaISO = reader["FechaISO"].ToString(),
                                FechaFormateada = reader["FechaFormateada"].ToString(),
                                IdVehiculo = Convert.ToInt32(reader["IdVehiculo"]),
                                Vehiculo = reader["Vehiculo"].ToString(),
                                InicioOdom = Convert.ToDecimal(reader["InicioOdom"]),

                                // Protegemos las columnas que admiten NULL en SQL
                                FinalOdom = reader["FinalOdom"] != DBNull.Value ? Convert.ToDecimal(reader["FinalOdom"]) : (decimal?)null,
                                Id_HojaRuta = reader["Id_HojaRuta"] != DBNull.Value ? Convert.ToInt32(reader["Id_HojaRuta"]) : (int?)null,

                                KmReales = Convert.ToDecimal(reader["KmReales"]),
                                EstadoOdometro = reader["EstadoOdometro"].ToString(),
                                TipoMovimiento = reader["TipoMovimiento"].ToString(),
                                KmEstimadosHDR = Convert.ToDecimal(reader["KmEstimadosHDR"]),
                                DesvioKm = Convert.ToDecimal(reader["DesvioKm"]),
                                ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString()
                            });
                        }
                    }
                }
            }
            return lista;
        }


        public List<DTO_ReporteMantenimientoPreventivo> ObtenerMantenimientoPreventivo()
        {
            var lista = new List<DTO_ReporteMantenimientoPreventivo>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_Reporte_MantenimientoPreventivo", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;

                    sqlCnn.Open();

                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new DTO_ReporteMantenimientoPreventivo
                            {
                                IdVehiculo = Convert.ToInt32(reader["IdVehiculo"]),
                                Vehiculo = reader["Vehiculo"].ToString(),
                                OdometroActual = Convert.ToDecimal(reader["OdometroActual"]),
                                OrdenService = Convert.ToInt32(reader["OrdenService"]),
                                TipoService = reader["TipoService"].ToString(),
                                IntervaloKm = Convert.ToInt32(reader["IntervaloKm"]),

                                // Protegemos columnas que vienen NULL cuando nunca se hizo ese service
                                IdUltimoMantenimiento = reader["IdUltimoMantenimiento"] != DBNull.Value
                                    ? Convert.ToInt32(reader["IdUltimoMantenimiento"])
                                    : (int?)null,
                                FechaUltimoServiceISO = reader["FechaUltimoServiceISO"] != DBNull.Value
                                    ? reader["FechaUltimoServiceISO"].ToString()
                                    : null,

                                FechaUltimoServiceFormateada = reader["FechaUltimoServiceFormateada"].ToString(),
                                MecanicoUltimoService = reader["MecanicoUltimoService"].ToString(),
                                OdometroUltimoService = Convert.ToDecimal(reader["OdometroUltimoService"]),
                                KmRecorridos = Convert.ToDecimal(reader["KmRecorridos"]),
                                KmRestantes = Convert.ToDecimal(reader["KmRestantes"]),
                                PorcentajeDesgaste = Convert.ToDecimal(reader["PorcentajeDesgaste"]),
                                EstadoAlerta = reader["EstadoAlerta"].ToString()
                            });
                        }
                    }
                }
            }
            return lista;
        }

        public List<DTO_ReporteHistorialMantenimiento> ObtenerHistorialMantenimiento(DateTime? fechaDesde, DateTime? fechaHasta)
        {
            var lista = new List<DTO_ReporteHistorialMantenimiento>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_Reporte_HistorialMantenimiento", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;

                    // Si la fecha viene null desde C#, debemos enviar explícitamente DBNull.Value a SQL Server
                    sqlCom.Parameters.AddWithValue("@FechaDesde", (object)fechaDesde ?? DBNull.Value);
                    sqlCom.Parameters.AddWithValue("@FechaHasta", (object)fechaHasta ?? DBNull.Value);

                    sqlCnn.Open();

                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new DTO_ReporteHistorialMantenimiento
                            {
                                IdMantenimiento_Vehi = Convert.ToInt32(reader["IdMantenimiento_Vehi"]),
                                fechaMantenimiento = Convert.ToDateTime(reader["fechaMantenimiento"]),
                                FechaISO = reader["FechaISO"].ToString(),
                                FechaFormateada = reader["FechaFormateada"].ToString(),
                                Id_Vehiculo = Convert.ToInt32(reader["Id_Vehiculo"]),
                                Vehiculo = reader["Vehiculo"].ToString(),
                                TipoMantenimiento = reader["TipoMantenimiento"].ToString(),
                                TipoService = reader["TipoService"].ToString(),
                                Id_odometro = Convert.ToInt32(reader["Id_odometro"]),
                                KmAlMomentoService = Convert.ToDecimal(reader["KmAlMomentoService"]),
                                Id_Mecanico = Convert.ToInt32(reader["Id_Mecanico"]),
                                MecanicoNombreCompleto = reader["MecanicoNombreCompleto"].ToString()
                            });
                        }
                    }
                }
            }
            return lista;
        }


        public List<DTO_ReporteConsumoCombustible> ObtenerReporteConsumoCombustible(DateTime fechaDesde, DateTime fechaHasta)
        {
            var lista = new List<DTO_ReporteConsumoCombustible>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_Reporte_ConsumoCombustible", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@FechaDesde", fechaDesde);
                    sqlCom.Parameters.AddWithValue("@FechaHasta", fechaHasta);

                    sqlCnn.Open();

                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new DTO_ReporteConsumoCombustible
                            {
                                Id_Consumo = Convert.ToInt32(reader["Id_Consumo"]),
                                IdRegistroOdomet = Convert.ToInt32(reader["IdRegistroOdomet"]),
                                FechaRegOdom = Convert.ToDateTime(reader["FechaRegOdom"]),
                                FechaISO = reader["FechaISO"].ToString(),
                                FechaFormateada = reader["FechaFormateada"].ToString(),
                                IdVehiculo = Convert.ToInt32(reader["IdVehiculo"]),
                                Vehiculo = reader["Vehiculo"].ToString(),
                                Id_HojaRuta = reader["Id_HojaRuta"] != DBNull.Value ? Convert.ToInt32(reader["Id_HojaRuta"]) : (int?)null,
                                TipoMovimiento = reader["TipoMovimiento"].ToString(),
                                ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString(),
                                Id_Combustible = Convert.ToInt32(reader["Id_Combustible"]),
                                TipoCombustible = reader["TipoCombustible"].ToString(),
                                KmReales = Convert.ToDecimal(reader["KmReales"]),
                                ConsumoTeoricoLtsKm = Convert.ToDecimal(reader["ConsumoTeoricoLtsKm"]),
                                PrecioLitroAplicado = Convert.ToDecimal(reader["PrecioLitroAplicado"]),
                                CostoPorKm = Convert.ToDecimal(reader["CostoPorKm"]),
                                LitrosConsumidos = Convert.ToDecimal(reader["LitrosConsumidos"]),
                                CostoTotalViaje = Convert.ToDecimal(reader["CostoTotalViaje"])
                            });
                        }
                    }
                }
            }
            return lista;
        }


        public List<DTO_NodoPertLogistica> ObtenerPertLogistica(DateTime? fechaDesde, DateTime? fechaHasta)
        {
            var lista = new List<DTO_NodoPertLogistica>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ObtenerTiemposPertLogistica", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;

                    // Si las fechas llegan null, el SP aplica por defecto los últimos 90 días
                    sqlCom.Parameters.AddWithValue("@FechaDesde", (object)fechaDesde ?? DBNull.Value);
                    sqlCom.Parameters.AddWithValue("@FechaHasta", (object)fechaHasta ?? DBNull.Value);

                    sqlCnn.Open();

                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            string precRaw = reader["Precedencia"] != DBNull.Value
                                ? reader["Precedencia"].ToString()
                                : string.Empty;

                            var listaPrecedencias = new List<string>();
                            if (!string.IsNullOrWhiteSpace(precRaw))
                            {
                                foreach (string item in precRaw.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
                                {
                                    listaPrecedencias.Add(item.Trim());
                                }
                            }

                            lista.Add(new DTO_NodoPertLogistica
                            {
                                Id = reader["Id"].ToString(),
                                Nombre = reader["Nombre"].ToString(),
                                Precedencia = listaPrecedencias,
                                To = Convert.ToDecimal(reader["To"]),
                                Tm = Convert.ToDecimal(reader["Tm"]),
                                Tp = Convert.ToDecimal(reader["Tp"]),
                                MuestrasReales = Convert.ToInt32(reader["MuestrasReales"]),
                                OrigenDato = reader["OrigenDato"].ToString()
                            });
                        }
                    }
                }
            }

            return lista;
        }



    }
}