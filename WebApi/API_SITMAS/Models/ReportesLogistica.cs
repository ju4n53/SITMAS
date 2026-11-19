using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;

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



    // =========================================================================
    // DTOs PARA DETALLE DE HOJA DE RUTA Y CONSUMO POR TRAMO
    // =========================================================================
    public class DTO_HojaRutaConsumoCabecera
    {
        public int Id_HojaRuta { get; set; }
        public DateTime? HojaRutaFecha { get; set; }
        public string FechaISO { get; set; }
        public string FechaFormateada { get; set; }
        public int? Id_EstadoHDR { get; set; }
        public string EstadoHDR { get; set; }
        public int? Id_Vehiculo { get; set; }
        public string Patente { get; set; }
        public string ChoferNombreCompleto { get; set; }
        public int Id_Combustible { get; set; }
        public string TipoCombustible { get; set; }

        // Datos de odómetro (nullables porque la HDR puede no haber cerrado viaje aún)
        public int? IdRegistroOdomet { get; set; }
        public decimal? InicioOdom { get; set; }
        public decimal? FinalOdom { get; set; }

        // Auditoría de distancias
        public decimal KmEstimadosHDR { get; set; }
        public decimal KmSumaTramos { get; set; }
        public decimal? KmRealesOdometro { get; set; }
        public decimal DesvioKm { get; set; }

        // Estado financiero (Real vs. Estimado)
        public bool EsCostoEstimado { get; set; }
        public string OrigenCalculo { get; set; }
        public decimal PrecioLitroAplicado { get; set; }
        public decimal ConsumoTeoricoLtsKm { get; set; }
        public decimal CostoPorKm { get; set; }
        public decimal LitrosTotalesViaje { get; set; }
        public decimal CostoTotalViaje { get; set; }
        public decimal CostoDesvio { get; set; }
    }

    public class DTO_TramoConsumo
    {
        public int NumeroTramo { get; set; }
        public int Id_Detalle_HDR { get; set; }
        public string HoraEstimada { get; set; }
        public int Id_TipoMovimiento { get; set; }
        public string TipoMovimiento { get; set; }
        public string RecursoMovilizado { get; set; }
        public string TipoMaterial { get; set; }
        public string EstadoTramo { get; set; }
        public string PuntoParada { get; set; }
        public string DireccionCompleta { get; set; }
        public string UbicacionDescripcion { get; set; }

        // Coordenadas nullables por si alguna parada no tiene geolocalización cargada
        public decimal? Latitud { get; set; }
        public decimal? Longitud { get; set; }

        // Métricas analíticas por tramo
        public decimal KmTramo { get; set; }
        public decimal KmAcumulados { get; set; }
        public decimal PorcentajeIncidencia { get; set; }
        public decimal LitrosTramo_Teorico { get; set; }
        public decimal LitrosTramo_Prorrateado { get; set; }
        public decimal CostoTramo_Teorico { get; set; }
        public decimal CostoTramo_Prorrateado { get; set; }
        public decimal SobrecostoDesvioTramo { get; set; }
        public decimal CostoAcumulado_Prorrateado { get; set; }
    }

    public class DTO_DetalleHojaRutaConsumo
    {
        public DTO_HojaRutaConsumoCabecera Cabecera { get; set; }
        public List<DTO_TramoConsumo> Tramos { get; set; }

        public DTO_DetalleHojaRutaConsumo()
        {
            Tramos = new List<DTO_TramoConsumo>();
        }
    }

    public class ChoferResumenDTO
    {
        public int Id_Chofer { get; set; }
        public string ChoferNombreCompleto { get; set; }
        public int ViajesCerrados { get; set; }
        public int ViajesEnCurso { get; set; }
        public int TotalViajesAsignados { get; set; }
        public decimal KmEstimadosTotal { get; set; }
        public decimal KmRealesTotal { get; set; }
        public decimal DesvioKmTotal { get; set; }
        public decimal PromedioKmPorViaje { get; set; }
        public decimal DesvioPorcentaje { get; set; }
        public string VehiculoMasUsado { get; set; }
        public int PorcentajeVehiculoHabitual { get; set; }
        public decimal LitrosTotalesConsumidos { get; set; }
        public decimal CostoTotalCombustible { get; set; }
    }

    public class ChoferViajeDetalleDTO
    {
        public int Id_Chofer { get; set; }
        public string ChoferNombreCompleto { get; set; }
        public int Id_HojaRuta { get; set; }
        public DateTime HojaRutaFecha { get; set; }
        public string FechaISO { get; set; }
        public string FechaFormateada { get; set; }
        public int? Id_EstadoHDR { get; set; }
        public string EstadoHDR { get; set; }
        public int? Id_Vehiculo { get; set; }
        public string Vehiculo { get; set; }
        public int? IdRegistroOdomet { get; set; }
        public decimal? InicioOdom { get; set; }
        public decimal? FinalOdom { get; set; }
        public int EstaCerrado { get; set; }
        public decimal KmEstimadosHDR { get; set; }
        public decimal KmReales { get; set; }
        public decimal DesvioKm { get; set; }
        public decimal LitrosConsumidos { get; set; }
        public decimal CostoTotalViaje { get; set; }
    }

    public class ReporteRendimientoChoferesResponse
    {
        public List<ChoferResumenDTO> ResumenChoferes { get; set; } = new List<ChoferResumenDTO>();
        public List<ChoferViajeDetalleDTO> DetalleViajes { get; set; } = new List<ChoferViajeDetalleDTO>();
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


        public DTO_DetalleHojaRutaConsumo ObtenerDetalleHojaRutaConsumo(int idHojaRuta)
        {
            DTO_DetalleHojaRutaConsumo resultado = null;

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ReporteDetalle_HojaRuta_Consumo", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id_HojaRuta", idHojaRuta);

                    sqlCnn.Open();

                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        // 1. Leemos el Result Set 1: Cabecera ejecutiva de la Hoja de Ruta
                        if (reader.Read())
                        {
                            resultado = new DTO_DetalleHojaRutaConsumo
                            {
                                Cabecera = new DTO_HojaRutaConsumoCabecera
                                {
                                    Id_HojaRuta = Convert.ToInt32(reader["Id_HojaRuta"]),
                                    HojaRutaFecha = reader["HojaRutaFecha"] != DBNull.Value ? Convert.ToDateTime(reader["HojaRutaFecha"]) : (DateTime?)null,
                                    FechaISO = reader["FechaISO"] != DBNull.Value ? reader["FechaISO"].ToString() : null,
                                    FechaFormateada = reader["FechaFormateada"] != DBNull.Value ? reader["FechaFormateada"].ToString() : "Sin fecha",
                                    Id_EstadoHDR = reader["Id_EstadoHDR"] != DBNull.Value ? Convert.ToInt32(reader["Id_EstadoHDR"]) : (int?)null,
                                    EstadoHDR = reader["EstadoHDR"].ToString(),
                                    Id_Vehiculo = reader["Id_Vehiculo"] != DBNull.Value ? Convert.ToInt32(reader["Id_Vehiculo"]) : (int?)null,
                                    Patente = reader["Patente"].ToString(),
                                    ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString(),
                                    Id_Combustible = Convert.ToInt32(reader["Id_Combustible"]),
                                    TipoCombustible = reader["TipoCombustible"].ToString(),

                                    IdRegistroOdomet = reader["IdRegistroOdomet"] != DBNull.Value ? Convert.ToInt32(reader["IdRegistroOdomet"]) : (int?)null,
                                    InicioOdom = reader["InicioOdom"] != DBNull.Value ? Convert.ToDecimal(reader["InicioOdom"]) : (decimal?)null,
                                    FinalOdom = reader["FinalOdom"] != DBNull.Value ? Convert.ToDecimal(reader["FinalOdom"]) : (decimal?)null,

                                    KmEstimadosHDR = Convert.ToDecimal(reader["KmEstimadosHDR"]),
                                    KmSumaTramos = Convert.ToDecimal(reader["KmSumaTramos"]),
                                    KmRealesOdometro = reader["KmRealesOdometro"] != DBNull.Value ? Convert.ToDecimal(reader["KmRealesOdometro"]) : (decimal?)null,
                                    DesvioKm = Convert.ToDecimal(reader["DesvioKm"]),

                                    EsCostoEstimado = Convert.ToBoolean(reader["EsCostoEstimado"]),
                                    OrigenCalculo = reader["OrigenCalculo"].ToString(),
                                    PrecioLitroAplicado = Convert.ToDecimal(reader["PrecioLitroAplicado"]),
                                    ConsumoTeoricoLtsKm = Convert.ToDecimal(reader["ConsumoTeoricoLtsKm"]),
                                    CostoPorKm = Convert.ToDecimal(reader["CostoPorKm"]),
                                    LitrosTotalesViaje = Convert.ToDecimal(reader["LitrosTotalesViaje"]),
                                    CostoTotalViaje = Convert.ToDecimal(reader["CostoTotalViaje"]),
                                    CostoDesvio = Convert.ToDecimal(reader["CostoDesvio"])
                                }
                            };
                        }

                        // 2. Avanzamos al Result Set 2: Desglose analítico por tramo
                        if (resultado != null && reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                resultado.Tramos.Add(new DTO_TramoConsumo
                                {
                                    NumeroTramo = Convert.ToInt32(reader["NumeroTramo"]),
                                    Id_Detalle_HDR = Convert.ToInt32(reader["Id_Detalle_HDR"]),
                                    HoraEstimada = reader["HoraEstimada"].ToString(),
                                    Id_TipoMovimiento = Convert.ToInt32(reader["Id_TipoMovimiento"]),
                                    TipoMovimiento = reader["TipoMovimiento"].ToString(),
                                    RecursoMovilizado = reader["RecursoMovilizado"].ToString(),
                                    TipoMaterial = reader["TipoMaterial"].ToString(),
                                    EstadoTramo = reader["EstadoTramo"].ToString(),
                                    PuntoParada = reader["PuntoParada"].ToString(),
                                    DireccionCompleta = reader["DireccionCompleta"].ToString(),
                                    UbicacionDescripcion = reader["UbicacionDescripcion"].ToString(),

                                    Latitud = reader["Latitud"] != DBNull.Value ? Convert.ToDecimal(reader["Latitud"]) : (decimal?)null,
                                    Longitud = reader["Longitud"] != DBNull.Value ? Convert.ToDecimal(reader["Longitud"]) : (decimal?)null,

                                    KmTramo = Convert.ToDecimal(reader["KmTramo"]),
                                    KmAcumulados = Convert.ToDecimal(reader["KmAcumulados"]),
                                    PorcentajeIncidencia = reader["PorcentajeIncidencia"] != DBNull.Value ? Convert.ToDecimal(reader["PorcentajeIncidencia"]) : 0m,
                                    LitrosTramo_Teorico = Convert.ToDecimal(reader["LitrosTramo_Teorico"]),
                                    LitrosTramo_Prorrateado = reader["LitrosTramo_Prorrateado"] != DBNull.Value ? Convert.ToDecimal(reader["LitrosTramo_Prorrateado"]) : 0m,
                                    CostoTramo_Teorico = Convert.ToDecimal(reader["CostoTramo_Teorico"]),
                                    CostoTramo_Prorrateado = reader["CostoTramo_Prorrateado"] != DBNull.Value ? Convert.ToDecimal(reader["CostoTramo_Prorrateado"]) : 0m,
                                    SobrecostoDesvioTramo = reader["SobrecostoDesvioTramo"] != DBNull.Value ? Convert.ToDecimal(reader["SobrecostoDesvioTramo"]) : 0m,
                                    CostoAcumulado_Prorrateado = reader["CostoAcumulado_Prorrateado"] != DBNull.Value ? Convert.ToDecimal(reader["CostoAcumulado_Prorrateado"]) : 0m
                                });
                            }
                        }
                    }
                }
            }

            return resultado;
        }


        public async Task<ReporteRendimientoChoferesResponse> ObtenerRendimientoChoferesAsync(
            DateTime fechaDesde, DateTime fechaHasta, int? idChofer = null, int? idUsuario = null)
        {
            var respuesta = new ReporteRendimientoChoferesResponse();

            using (var conn = new SqlConnection(connectionString))
            using (var cmd = new SqlCommand("sp_ReporteRendimiento_Choferes", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@FechaDesde", fechaDesde.Date);
                cmd.Parameters.AddWithValue("@FechaHasta", fechaHasta.Date);
                cmd.Parameters.AddWithValue("@Id_Chofer", (object)idChofer ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IdUsuario", (object)idUsuario ?? DBNull.Value);

                await conn.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    // 1. Leer Result Set 1: Métricas consolidadas por chofer
                    while (await reader.ReadAsync())
                    {
                        respuesta.ResumenChoferes.Add(new ChoferResumenDTO
                        {
                            Id_Chofer = reader["Id_Chofer"] != DBNull.Value ? Convert.ToInt32(reader["Id_Chofer"]) : 0,
                            ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString(),
                            ViajesCerrados = reader["ViajesCerrados"] != DBNull.Value ? Convert.ToInt32(reader["ViajesCerrados"]) : 0,
                            ViajesEnCurso = reader["ViajesEnCurso"] != DBNull.Value ? Convert.ToInt32(reader["ViajesEnCurso"]) : 0,
                            TotalViajesAsignados = reader["TotalViajesAsignados"] != DBNull.Value ? Convert.ToInt32(reader["TotalViajesAsignados"]) : 0,
                            KmEstimadosTotal = reader["KmEstimadosTotal"] != DBNull.Value ? Convert.ToDecimal(reader["KmEstimadosTotal"]) : 0m,
                            KmRealesTotal = reader["KmRealesTotal"] != DBNull.Value ? Convert.ToDecimal(reader["KmRealesTotal"]) : 0m,
                            DesvioKmTotal = reader["DesvioKmTotal"] != DBNull.Value ? Convert.ToDecimal(reader["DesvioKmTotal"]) : 0m,
                            PromedioKmPorViaje = reader["PromedioKmPorViaje"] != DBNull.Value ? Convert.ToDecimal(reader["PromedioKmPorViaje"]) : 0m,
                            DesvioPorcentaje = reader["DesvioPorcentaje"] != DBNull.Value ? Convert.ToDecimal(reader["DesvioPorcentaje"]) : 0m,
                            VehiculoMasUsado = reader["VehiculoMasUsado"].ToString(),
                            PorcentajeVehiculoHabitual = reader["PorcentajeVehiculoHabitual"] != DBNull.Value ? Convert.ToInt32(reader["PorcentajeVehiculoHabitual"]) : 0,
                            LitrosTotalesConsumidos = reader["LitrosTotalesConsumidos"] != DBNull.Value ? Convert.ToDecimal(reader["LitrosTotalesConsumidos"]) : 0m,
                            CostoTotalCombustible = reader["CostoTotalCombustible"] != DBNull.Value ? Convert.ToDecimal(reader["CostoTotalCombustible"]) : 0m
                        });
                    }

                    // 2. Avanzar al Result Set 2: Listado individual de viajes por chofer
                    if (await reader.NextResultAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            respuesta.DetalleViajes.Add(new ChoferViajeDetalleDTO
                            {
                                Id_Chofer = reader["Id_Chofer"] != DBNull.Value ? Convert.ToInt32(reader["Id_Chofer"]) : 0,
                                ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString(),
                                Id_HojaRuta = Convert.ToInt32(reader["Id_HojaRuta"]),
                                HojaRutaFecha = reader["HojaRutaFecha"] != DBNull.Value ? Convert.ToDateTime(reader["HojaRutaFecha"]) : DateTime.MinValue,
                                FechaISO = reader["FechaISO"].ToString(),
                                FechaFormateada = reader["FechaFormateada"].ToString(),
                                Id_EstadoHDR = reader["Id_EstadoHDR"] != DBNull.Value ? Convert.ToInt32(reader["Id_EstadoHDR"]) : (int?)null,
                                EstadoHDR = reader["EstadoHDR"].ToString(),
                                Id_Vehiculo = reader["Id_Vehiculo"] != DBNull.Value ? Convert.ToInt32(reader["Id_Vehiculo"]) : (int?)null,
                                Vehiculo = reader["Vehiculo"].ToString(),
                                IdRegistroOdomet = reader["IdRegistroOdomet"] != DBNull.Value ? Convert.ToInt32(reader["IdRegistroOdomet"]) : (int?)null,
                                InicioOdom = reader["InicioOdom"] != DBNull.Value ? Convert.ToDecimal(reader["InicioOdom"]) : (decimal?)null,
                                FinalOdom = reader["FinalOdom"] != DBNull.Value ? Convert.ToDecimal(reader["FinalOdom"]) : (decimal?)null,
                                EstaCerrado = reader["EstaCerrado"] != DBNull.Value ? Convert.ToInt32(reader["EstaCerrado"]) : 0,
                                KmEstimadosHDR = reader["KmEstimadosHDR"] != DBNull.Value ? Convert.ToDecimal(reader["KmEstimadosHDR"]) : 0m,
                                KmReales = reader["KmReales"] != DBNull.Value ? Convert.ToDecimal(reader["KmReales"]) : 0m,
                                DesvioKm = reader["DesvioKm"] != DBNull.Value ? Convert.ToDecimal(reader["DesvioKm"]) : 0m,
                                LitrosConsumidos = reader["LitrosConsumidos"] != DBNull.Value ? Convert.ToDecimal(reader["LitrosConsumidos"]) : 0m,
                                CostoTotalViaje = reader["CostoTotalViaje"] != DBNull.Value ? Convert.ToDecimal(reader["CostoTotalViaje"]) : 0m
                            });
                        }
                    }
                }
            }

            return respuesta;
        }
    }
}













//using System;
//using System.Collections.Generic;
//using System.Configuration;
//using System.Data;
//using System.Data.SqlClient;
//using System.Threading.Tasks;

//namespace API_SITMAS.Models
//{
//    // DTO para reporte de uso de vehiculos
//    public class DTO_HojaRutaCabecera
//    {
//        public int Id { get; set; }
//        public DateTime HojaRutaFecha { get; set; }
//        public int Id_Vehiculo { get; set; }
//        public int? Id_Chofer { get; set; }
//        public int? Id_Estado { get; set; }
//        public string FechaFormateada { get; set; }
//        public string Vehiculo { get; set; }
//        public string ChoferNombreCompleto { get; set; }
//        public string Estado { get; set; }
//        public decimal Distancia_Total_Estimada_Km { get; set; }
//    }


//    //DTO para el Reporte de Odómetro
//    public class DTO_ReporteOdometro
//    {
//        public int IdRegistroOdomet { get; set; }
//        public DateTime FechaRegOdom { get; set; }
//        public string FechaISO { get; set; }
//        public string FechaFormateada { get; set; }
//        public int IdVehiculo { get; set; }
//        public string Vehiculo { get; set; }
//        public decimal InicioOdom { get; set; }
//        public decimal? FinalOdom { get; set; } // Nullable porque puede estar en curso
//        public decimal KmReales { get; set; }
//        public string EstadoOdometro { get; set; }
//        public int? Id_HojaRuta { get; set; }   // Nullable porque puede ser movimiento interno
//        public string TipoMovimiento { get; set; }
//        public decimal KmEstimadosHDR { get; set; }
//        public decimal DesvioKm { get; set; }
//        public string ChoferNombreCompleto { get; set; }
//    }


//    // DTO Estado actual de desgaste preventivo
//    public class DTO_ReporteMantenimientoPreventivo
//    {
//        public int IdVehiculo { get; set; }
//        public string Vehiculo { get; set; }
//        public decimal OdometroActual { get; set; }
//        public int OrdenService { get; set; }
//        public string TipoService { get; set; }
//        public int IntervaloKm { get; set; }

//        // Nullable por vehículo sin services
//        public int? IdUltimoMantenimiento { get; set; }
//        public string FechaUltimoServiceISO { get; set; }

//        public string FechaUltimoServiceFormateada { get; set; }
//        public string MecanicoUltimoService { get; set; }
//        public decimal OdometroUltimoService { get; set; }
//        public decimal KmRecorridos { get; set; }
//        public decimal KmRestantes { get; set; }
//        public decimal PorcentajeDesgaste { get; set; }
//        public string EstadoAlerta { get; set; }
//    }

//    // DTO Bitácora intervenciones en taller
//    public class DTO_ReporteHistorialMantenimiento
//    {
//        public int IdMantenimiento_Vehi { get; set; }
//        public DateTime fechaMantenimiento { get; set; }
//        public string FechaISO { get; set; }
//        public string FechaFormateada { get; set; }
//        public int Id_Vehiculo { get; set; }
//        public string Vehiculo { get; set; }
//        public string TipoMantenimiento { get; set; }
//        public string TipoService { get; set; }
//        public int Id_odometro { get; set; }
//        public decimal KmAlMomentoService { get; set; }
//        public int Id_Mecanico { get; set; }
//        public string MecanicoNombreCompleto { get; set; }
//    }

//    // DTO para el análisis PERT / Ruta Crítica de Logística
//    public class DTO_NodoPertLogistica
//    {
//        public string Id { get; set; }
//        public string Nombre { get; set; }
//        public List<string> Precedencia { get; set; }
//        public decimal To { get; set; }
//        public decimal Tm { get; set; }
//        public decimal Tp { get; set; }
//        public int MuestrasReales { get; set; }
//        public string OrigenDato { get; set; }
//    }


//    // DTO para Reporte de Consumo Combustible
//    public class DTO_ReporteConsumoCombustible
//    {
//        public int Id_Consumo { get; set; }
//        public int IdRegistroOdomet { get; set; }
//        public DateTime FechaRegOdom { get; set; }
//        public string FechaISO { get; set; }
//        public string FechaFormateada { get; set; }
//        public int IdVehiculo { get; set; }
//        public string Vehiculo { get; set; }
//        public int? Id_HojaRuta { get; set; }
//        public string TipoMovimiento { get; set; }
//        public string ChoferNombreCompleto { get; set; }
//        public int Id_Combustible { get; set; }
//        public string TipoCombustible { get; set; }
//        public decimal KmReales { get; set; }
//        public decimal ConsumoTeoricoLtsKm { get; set; }
//        public decimal PrecioLitroAplicado { get; set; }
//        public decimal CostoPorKm { get; set; }
//        public decimal LitrosConsumidos { get; set; }
//        public decimal CostoTotalViaje { get; set; }
//    }



//    // =========================================================================
//    // DTOs PARA DETALLE DE HOJA DE RUTA Y CONSUMO POR TRAMO
//    // =========================================================================
//    public class DTO_HojaRutaConsumoCabecera
//    {
//        public int Id_HojaRuta { get; set; }
//        public DateTime? HojaRutaFecha { get; set; }
//        public string FechaISO { get; set; }
//        public string FechaFormateada { get; set; }
//        public int? Id_EstadoHDR { get; set; }
//        public string EstadoHDR { get; set; }
//        public int? Id_Vehiculo { get; set; }
//        public string Patente { get; set; }
//        public string ChoferNombreCompleto { get; set; }
//        public int Id_Combustible { get; set; }
//        public string TipoCombustible { get; set; }

//        // Datos de odómetro (nullables porque la HDR puede no haber cerrado viaje aún)
//        public int? IdRegistroOdomet { get; set; }
//        public decimal? InicioOdom { get; set; }
//        public decimal? FinalOdom { get; set; }

//        // Auditoría de distancias
//        public decimal KmEstimadosHDR { get; set; }
//        public decimal KmSumaTramos { get; set; }
//        public decimal? KmRealesOdometro { get; set; }
//        public decimal DesvioKm { get; set; }

//        // Estado financiero (Real vs. Estimado)
//        public bool EsCostoEstimado { get; set; }
//        public string OrigenCalculo { get; set; }
//        public decimal PrecioLitroAplicado { get; set; }
//        public decimal ConsumoTeoricoLtsKm { get; set; }
//        public decimal CostoPorKm { get; set; }
//        public decimal LitrosTotalesViaje { get; set; }
//        public decimal CostoTotalViaje { get; set; }
//        public decimal CostoDesvio { get; set; }
//    }

//    public class DTO_TramoConsumo
//    {
//        public int NumeroTramo { get; set; }
//        public int Id_Detalle_HDR { get; set; }
//        public string HoraEstimada { get; set; }
//        public int Id_TipoMovimiento { get; set; }
//        public string TipoMovimiento { get; set; }
//        public string RecursoMovilizado { get; set; }
//        public string TipoMaterial { get; set; }
//        public string EstadoTramo { get; set; }
//        public string PuntoParada { get; set; }
//        public string DireccionCompleta { get; set; }
//        public string UbicacionDescripcion { get; set; }

//        // Coordenadas nullables por si alguna parada no tiene geolocalización cargada
//        public decimal? Latitud { get; set; }
//        public decimal? Longitud { get; set; }

//        // Métricas analíticas por tramo
//        public decimal KmTramo { get; set; }
//        public decimal KmAcumulados { get; set; }
//        public decimal PorcentajeIncidencia { get; set; }
//        public decimal LitrosTramo_Teorico { get; set; }
//        public decimal LitrosTramo_Prorrateado { get; set; }
//        public decimal CostoTramo_Teorico { get; set; }
//        public decimal CostoTramo_Prorrateado { get; set; }
//        public decimal SobrecostoDesvioTramo { get; set; }
//        public decimal CostoAcumulado_Prorrateado { get; set; }
//    }

//    public class DTO_DetalleHojaRutaConsumo
//    {
//        public DTO_HojaRutaConsumoCabecera Cabecera { get; set; }
//        public List<DTO_TramoConsumo> Tramos { get; set; }

//        public DTO_DetalleHojaRutaConsumo()
//        {
//            Tramos = new List<DTO_TramoConsumo>();
//        }
//    }

//    public class ChoferResumenDTO
//    {
//        public int Id_Chofer { get; set; }
//        public string ChoferNombreCompleto { get; set; }
//        public int ViajesCerrados { get; set; }
//        public int ViajesEnCurso { get; set; }
//        public int TotalViajesAsignados { get; set; }
//        public decimal KmEstimadosTotal { get; set; }
//        public decimal KmRealesTotal { get; set; }
//        public decimal DesvioKmTotal { get; set; }
//        public decimal PromedioKmPorViaje { get; set; }
//        public decimal DesvioPorcentaje { get; set; }
//        public string VehiculoMasUsado { get; set; }
//        public int PorcentajeVehiculoHabitual { get; set; }
//        public decimal LitrosTotalesConsumidos { get; set; }
//        public decimal CostoTotalCombustible { get; set; }
//    }

//    public class ChoferViajeDetalleDTO
//    {
//        public int Id_Chofer { get; set; }
//        public string ChoferNombreCompleto { get; set; }
//        public int Id_HojaRuta { get; set; }
//        public DateTime HojaRutaFecha { get; set; }
//        public string FechaISO { get; set; }
//        public string FechaFormateada { get; set; }
//        public int? Id_EstadoHDR { get; set; }
//        public string EstadoHDR { get; set; }
//        public int? Id_Vehiculo { get; set; }
//        public string Vehiculo { get; set; }
//        public int? IdRegistroOdomet { get; set; }
//        public decimal? InicioOdom { get; set; }
//        public decimal? FinalOdom { get; set; }
//        public int EstaCerrado { get; set; }
//        public decimal KmEstimadosHDR { get; set; }
//        public decimal KmReales { get; set; }
//        public decimal DesvioKm { get; set; }
//        public decimal LitrosConsumidos { get; set; }
//        public decimal CostoTotalViaje { get; set; }
//    }

//    public class ReporteRendimientoChoferesResponse
//    {
//        public List<ChoferResumenDTO> ResumenChoferes { get; set; } = new List<ChoferResumenDTO>();
//        public List<ChoferViajeDetalleDTO> DetalleViajes { get; set; } = new List<ChoferViajeDetalleDTO>();
//    }





//    public class ReportesLogisticaDatos
//    {
//        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

//        public List<DTO_HojaRutaCabecera> ObtenerUsoVehiculos(DateTime fechaDesde, DateTime fechaHasta)
//        {
//            var lista = new List<DTO_HojaRutaCabecera>();

//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_Reporte_UsoVehiculos", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;
//                    sqlCom.Parameters.AddWithValue("@FechaDesde", fechaDesde);
//                    sqlCom.Parameters.AddWithValue("@FechaHasta", fechaHasta);

//                    sqlCnn.Open();

//                    using (SqlDataReader reader = sqlCom.ExecuteReader())
//                    {
//                        while (reader.Read())
//                        {
//                            lista.Add(new DTO_HojaRutaCabecera
//                            {
//                                Id = Convert.ToInt32(reader["Id"]),
//                                HojaRutaFecha = Convert.ToDateTime(reader["HojaRutaFecha"]),
//                                Id_Vehiculo = Convert.ToInt32(reader["Id_Vehiculo"]),
//                                Id_Chofer = reader["Id_Chofer"] != DBNull.Value ? Convert.ToInt32(reader["Id_Chofer"]) : (int?)null,
//                                Id_Estado = reader["Id_Estado"] != DBNull.Value ? Convert.ToInt32(reader["Id_Estado"]) : (int?)null,
//                                FechaFormateada = reader["FechaFormateada"].ToString(),
//                                Vehiculo = reader["Vehiculo"].ToString(),
//                                ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString(),
//                                Estado = reader["Estado"].ToString(),
//                                Distancia_Total_Estimada_Km = Convert.ToDecimal(reader["Distancia_Total_Estimada_Km"])
//                            });
//                        }
//                    }
//                }
//            }
//            return lista;
//        }


//        public List<DTO_ReporteOdometro> ObtenerReporteOdometro(DateTime fechaDesde, DateTime fechaHasta)
//        {
//            var lista = new List<DTO_ReporteOdometro>();

//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_ReporteOdometro", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;
//                    sqlCom.Parameters.AddWithValue("@FechaDesde", fechaDesde);
//                    sqlCom.Parameters.AddWithValue("@FechaHasta", fechaHasta);

//                    sqlCnn.Open();

//                    using (SqlDataReader reader = sqlCom.ExecuteReader())
//                    {
//                        while (reader.Read())
//                        {
//                            lista.Add(new DTO_ReporteOdometro
//                            {
//                                IdRegistroOdomet = Convert.ToInt32(reader["IdRegistroOdomet"]),
//                                FechaRegOdom = Convert.ToDateTime(reader["FechaRegOdom"]),
//                                FechaISO = reader["FechaISO"].ToString(),
//                                FechaFormateada = reader["FechaFormateada"].ToString(),
//                                IdVehiculo = Convert.ToInt32(reader["IdVehiculo"]),
//                                Vehiculo = reader["Vehiculo"].ToString(),
//                                InicioOdom = Convert.ToDecimal(reader["InicioOdom"]),

//                                // Protegemos las columnas que admiten NULL en SQL
//                                FinalOdom = reader["FinalOdom"] != DBNull.Value ? Convert.ToDecimal(reader["FinalOdom"]) : (decimal?)null,
//                                Id_HojaRuta = reader["Id_HojaRuta"] != DBNull.Value ? Convert.ToInt32(reader["Id_HojaRuta"]) : (int?)null,

//                                KmReales = Convert.ToDecimal(reader["KmReales"]),
//                                EstadoOdometro = reader["EstadoOdometro"].ToString(),
//                                TipoMovimiento = reader["TipoMovimiento"].ToString(),
//                                KmEstimadosHDR = Convert.ToDecimal(reader["KmEstimadosHDR"]),
//                                DesvioKm = Convert.ToDecimal(reader["DesvioKm"]),
//                                ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString()
//                            });
//                        }
//                    }
//                }
//            }
//            return lista;
//        }


//        public List<DTO_ReporteMantenimientoPreventivo> ObtenerMantenimientoPreventivo()
//        {
//            var lista = new List<DTO_ReporteMantenimientoPreventivo>();

//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_Reporte_MantenimientoPreventivo", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;

//                    sqlCnn.Open();

//                    using (SqlDataReader reader = sqlCom.ExecuteReader())
//                    {
//                        while (reader.Read())
//                        {
//                            lista.Add(new DTO_ReporteMantenimientoPreventivo
//                            {
//                                IdVehiculo = Convert.ToInt32(reader["IdVehiculo"]),
//                                Vehiculo = reader["Vehiculo"].ToString(),
//                                OdometroActual = Convert.ToDecimal(reader["OdometroActual"]),
//                                OrdenService = Convert.ToInt32(reader["OrdenService"]),
//                                TipoService = reader["TipoService"].ToString(),
//                                IntervaloKm = Convert.ToInt32(reader["IntervaloKm"]),

//                                // Protegemos columnas que vienen NULL cuando nunca se hizo ese service
//                                IdUltimoMantenimiento = reader["IdUltimoMantenimiento"] != DBNull.Value
//                                    ? Convert.ToInt32(reader["IdUltimoMantenimiento"])
//                                    : (int?)null,
//                                FechaUltimoServiceISO = reader["FechaUltimoServiceISO"] != DBNull.Value
//                                    ? reader["FechaUltimoServiceISO"].ToString()
//                                    : null,

//                                FechaUltimoServiceFormateada = reader["FechaUltimoServiceFormateada"].ToString(),
//                                MecanicoUltimoService = reader["MecanicoUltimoService"].ToString(),
//                                OdometroUltimoService = Convert.ToDecimal(reader["OdometroUltimoService"]),
//                                KmRecorridos = Convert.ToDecimal(reader["KmRecorridos"]),
//                                KmRestantes = Convert.ToDecimal(reader["KmRestantes"]),
//                                PorcentajeDesgaste = Convert.ToDecimal(reader["PorcentajeDesgaste"]),
//                                EstadoAlerta = reader["EstadoAlerta"].ToString()
//                            });
//                        }
//                    }
//                }
//            }
//            return lista;
//        }

//        public List<DTO_ReporteHistorialMantenimiento> ObtenerHistorialMantenimiento(DateTime? fechaDesde, DateTime? fechaHasta)
//        {
//            var lista = new List<DTO_ReporteHistorialMantenimiento>();

//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_Reporte_HistorialMantenimiento", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;

//                    // Si la fecha viene null desde C#, debemos enviar explícitamente DBNull.Value a SQL Server
//                    sqlCom.Parameters.AddWithValue("@FechaDesde", (object)fechaDesde ?? DBNull.Value);
//                    sqlCom.Parameters.AddWithValue("@FechaHasta", (object)fechaHasta ?? DBNull.Value);

//                    sqlCnn.Open();

//                    using (SqlDataReader reader = sqlCom.ExecuteReader())
//                    {
//                        while (reader.Read())
//                        {
//                            lista.Add(new DTO_ReporteHistorialMantenimiento
//                            {
//                                IdMantenimiento_Vehi = Convert.ToInt32(reader["IdMantenimiento_Vehi"]),
//                                fechaMantenimiento = Convert.ToDateTime(reader["fechaMantenimiento"]),
//                                FechaISO = reader["FechaISO"].ToString(),
//                                FechaFormateada = reader["FechaFormateada"].ToString(),
//                                Id_Vehiculo = Convert.ToInt32(reader["Id_Vehiculo"]),
//                                Vehiculo = reader["Vehiculo"].ToString(),
//                                TipoMantenimiento = reader["TipoMantenimiento"].ToString(),
//                                TipoService = reader["TipoService"].ToString(),
//                                Id_odometro = Convert.ToInt32(reader["Id_odometro"]),
//                                KmAlMomentoService = Convert.ToDecimal(reader["KmAlMomentoService"]),
//                                Id_Mecanico = Convert.ToInt32(reader["Id_Mecanico"]),
//                                MecanicoNombreCompleto = reader["MecanicoNombreCompleto"].ToString()
//                            });
//                        }
//                    }
//                }
//            }
//            return lista;
//        }


//        public List<DTO_ReporteConsumoCombustible> ObtenerReporteConsumoCombustible(DateTime fechaDesde, DateTime fechaHasta)
//        {
//            var lista = new List<DTO_ReporteConsumoCombustible>();

//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_Reporte_ConsumoCombustible", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;
//                    sqlCom.Parameters.AddWithValue("@FechaDesde", fechaDesde);
//                    sqlCom.Parameters.AddWithValue("@FechaHasta", fechaHasta);

//                    sqlCnn.Open();

//                    using (SqlDataReader reader = sqlCom.ExecuteReader())
//                    {
//                        while (reader.Read())
//                        {
//                            lista.Add(new DTO_ReporteConsumoCombustible
//                            {
//                                Id_Consumo = Convert.ToInt32(reader["Id_Consumo"]),
//                                IdRegistroOdomet = Convert.ToInt32(reader["IdRegistroOdomet"]),
//                                FechaRegOdom = Convert.ToDateTime(reader["FechaRegOdom"]),
//                                FechaISO = reader["FechaISO"].ToString(),
//                                FechaFormateada = reader["FechaFormateada"].ToString(),
//                                IdVehiculo = Convert.ToInt32(reader["IdVehiculo"]),
//                                Vehiculo = reader["Vehiculo"].ToString(),
//                                Id_HojaRuta = reader["Id_HojaRuta"] != DBNull.Value ? Convert.ToInt32(reader["Id_HojaRuta"]) : (int?)null,
//                                TipoMovimiento = reader["TipoMovimiento"].ToString(),
//                                ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString(),
//                                Id_Combustible = Convert.ToInt32(reader["Id_Combustible"]),
//                                TipoCombustible = reader["TipoCombustible"].ToString(),
//                                KmReales = Convert.ToDecimal(reader["KmReales"]),
//                                ConsumoTeoricoLtsKm = Convert.ToDecimal(reader["ConsumoTeoricoLtsKm"]),
//                                PrecioLitroAplicado = Convert.ToDecimal(reader["PrecioLitroAplicado"]),
//                                CostoPorKm = Convert.ToDecimal(reader["CostoPorKm"]),
//                                LitrosConsumidos = Convert.ToDecimal(reader["LitrosConsumidos"]),
//                                CostoTotalViaje = Convert.ToDecimal(reader["CostoTotalViaje"])
//                            });
//                        }
//                    }
//                }
//            }
//            return lista;
//        }


//        public List<DTO_NodoPertLogistica> ObtenerPertLogistica(DateTime? fechaDesde, DateTime? fechaHasta)
//        {
//            var lista = new List<DTO_NodoPertLogistica>();

//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_ObtenerTiemposPertLogistica", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;

//                    // Si las fechas llegan null, el SP aplica por defecto los últimos 90 días
//                    sqlCom.Parameters.AddWithValue("@FechaDesde", (object)fechaDesde ?? DBNull.Value);
//                    sqlCom.Parameters.AddWithValue("@FechaHasta", (object)fechaHasta ?? DBNull.Value);

//                    sqlCnn.Open();

//                    using (SqlDataReader reader = sqlCom.ExecuteReader())
//                    {
//                        while (reader.Read())
//                        {
//                            string precRaw = reader["Precedencia"] != DBNull.Value
//                                ? reader["Precedencia"].ToString()
//                                : string.Empty;

//                            var listaPrecedencias = new List<string>();
//                            if (!string.IsNullOrWhiteSpace(precRaw))
//                            {
//                                foreach (string item in precRaw.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
//                                {
//                                    listaPrecedencias.Add(item.Trim());
//                                }
//                            }

//                            lista.Add(new DTO_NodoPertLogistica
//                            {
//                                Id = reader["Id"].ToString(),
//                                Nombre = reader["Nombre"].ToString(),
//                                Precedencia = listaPrecedencias,
//                                To = Convert.ToDecimal(reader["To"]),
//                                Tm = Convert.ToDecimal(reader["Tm"]),
//                                Tp = Convert.ToDecimal(reader["Tp"]),
//                                MuestrasReales = Convert.ToInt32(reader["MuestrasReales"]),
//                                OrigenDato = reader["OrigenDato"].ToString()
//                            });
//                        }
//                    }
//                }
//            }

//            return lista;
//        }


//        public DTO_DetalleHojaRutaConsumo ObtenerDetalleHojaRutaConsumo(int idHojaRuta)
//        {
//            DTO_DetalleHojaRutaConsumo resultado = null;

//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_ReporteDetalle_HojaRuta_Consumo", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;
//                    sqlCom.Parameters.AddWithValue("@Id_HojaRuta", idHojaRuta);

//                    sqlCnn.Open();

//                    using (SqlDataReader reader = sqlCom.ExecuteReader())
//                    {
//                        // 1. Leemos el Result Set 1: Cabecera ejecutiva de la Hoja de Ruta
//                        if (reader.Read())
//                        {
//                            resultado = new DTO_DetalleHojaRutaConsumo
//                            {
//                                Cabecera = new DTO_HojaRutaConsumoCabecera
//                                {
//                                    Id_HojaRuta = Convert.ToInt32(reader["Id_HojaRuta"]),
//                                    HojaRutaFecha = reader["HojaRutaFecha"] != DBNull.Value ? Convert.ToDateTime(reader["HojaRutaFecha"]) : (DateTime?)null,
//                                    FechaISO = reader["FechaISO"] != DBNull.Value ? reader["FechaISO"].ToString() : null,
//                                    FechaFormateada = reader["FechaFormateada"] != DBNull.Value ? reader["FechaFormateada"].ToString() : "Sin fecha",
//                                    Id_EstadoHDR = reader["Id_EstadoHDR"] != DBNull.Value ? Convert.ToInt32(reader["Id_EstadoHDR"]) : (int?)null,
//                                    EstadoHDR = reader["EstadoHDR"].ToString(),
//                                    Id_Vehiculo = reader["Id_Vehiculo"] != DBNull.Value ? Convert.ToInt32(reader["Id_Vehiculo"]) : (int?)null,
//                                    Patente = reader["Patente"].ToString(),
//                                    ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString(),
//                                    Id_Combustible = Convert.ToInt32(reader["Id_Combustible"]),
//                                    TipoCombustible = reader["TipoCombustible"].ToString(),

//                                    IdRegistroOdomet = reader["IdRegistroOdomet"] != DBNull.Value ? Convert.ToInt32(reader["IdRegistroOdomet"]) : (int?)null,
//                                    InicioOdom = reader["InicioOdom"] != DBNull.Value ? Convert.ToDecimal(reader["InicioOdom"]) : (decimal?)null,
//                                    FinalOdom = reader["FinalOdom"] != DBNull.Value ? Convert.ToDecimal(reader["FinalOdom"]) : (decimal?)null,

//                                    KmEstimadosHDR = Convert.ToDecimal(reader["KmEstimadosHDR"]),
//                                    KmSumaTramos = Convert.ToDecimal(reader["KmSumaTramos"]),
//                                    KmRealesOdometro = reader["KmRealesOdometro"] != DBNull.Value ? Convert.ToDecimal(reader["KmRealesOdometro"]) : (decimal?)null,
//                                    DesvioKm = Convert.ToDecimal(reader["DesvioKm"]),

//                                    EsCostoEstimado = Convert.ToBoolean(reader["EsCostoEstimado"]),
//                                    OrigenCalculo = reader["OrigenCalculo"].ToString(),
//                                    PrecioLitroAplicado = Convert.ToDecimal(reader["PrecioLitroAplicado"]),
//                                    ConsumoTeoricoLtsKm = Convert.ToDecimal(reader["ConsumoTeoricoLtsKm"]),
//                                    CostoPorKm = Convert.ToDecimal(reader["CostoPorKm"]),
//                                    LitrosTotalesViaje = Convert.ToDecimal(reader["LitrosTotalesViaje"]),
//                                    CostoTotalViaje = Convert.ToDecimal(reader["CostoTotalViaje"]),
//                                    CostoDesvio = Convert.ToDecimal(reader["CostoDesvio"])
//                                }
//                            };
//                        }

//                        // 2. Avanzamos al Result Set 2: Desglose analítico por tramo
//                        if (resultado != null && reader.NextResult())
//                        {
//                            while (reader.Read())
//                            {
//                                resultado.Tramos.Add(new DTO_TramoConsumo
//                                {
//                                    NumeroTramo = Convert.ToInt32(reader["NumeroTramo"]),
//                                    Id_Detalle_HDR = Convert.ToInt32(reader["Id_Detalle_HDR"]),
//                                    HoraEstimada = reader["HoraEstimada"].ToString(),
//                                    Id_TipoMovimiento = Convert.ToInt32(reader["Id_TipoMovimiento"]),
//                                    TipoMovimiento = reader["TipoMovimiento"].ToString(),
//                                    RecursoMovilizado = reader["RecursoMovilizado"].ToString(),
//                                    TipoMaterial = reader["TipoMaterial"].ToString(),
//                                    EstadoTramo = reader["EstadoTramo"].ToString(),
//                                    PuntoParada = reader["PuntoParada"].ToString(),
//                                    DireccionCompleta = reader["DireccionCompleta"].ToString(),
//                                    UbicacionDescripcion = reader["UbicacionDescripcion"].ToString(),

//                                    Latitud = reader["Latitud"] != DBNull.Value ? Convert.ToDecimal(reader["Latitud"]) : (decimal?)null,
//                                    Longitud = reader["Longitud"] != DBNull.Value ? Convert.ToDecimal(reader["Longitud"]) : (decimal?)null,

//                                    KmTramo = Convert.ToDecimal(reader["KmTramo"]),
//                                    KmAcumulados = Convert.ToDecimal(reader["KmAcumulados"]),
//                                    PorcentajeIncidencia = reader["PorcentajeIncidencia"] != DBNull.Value ? Convert.ToDecimal(reader["PorcentajeIncidencia"]) : 0m,
//                                    LitrosTramo_Teorico = Convert.ToDecimal(reader["LitrosTramo_Teorico"]),
//                                    LitrosTramo_Prorrateado = reader["LitrosTramo_Prorrateado"] != DBNull.Value ? Convert.ToDecimal(reader["LitrosTramo_Prorrateado"]) : 0m,
//                                    CostoTramo_Teorico = Convert.ToDecimal(reader["CostoTramo_Teorico"]),
//                                    CostoTramo_Prorrateado = reader["CostoTramo_Prorrateado"] != DBNull.Value ? Convert.ToDecimal(reader["CostoTramo_Prorrateado"]) : 0m,
//                                    SobrecostoDesvioTramo = reader["SobrecostoDesvioTramo"] != DBNull.Value ? Convert.ToDecimal(reader["SobrecostoDesvioTramo"]) : 0m,
//                                    CostoAcumulado_Prorrateado = reader["CostoAcumulado_Prorrateado"] != DBNull.Value ? Convert.ToDecimal(reader["CostoAcumulado_Prorrateado"]) : 0m
//                                });
//                            }
//                        }
//                    }
//                }
//            }

//            return resultado;
//        }


//        public async Task<ReporteRendimientoChoferesResponse> ObtenerRendimientoChoferesAsync(
//    DateTime fechaDesde, DateTime fechaHasta, int? idChofer = null)
//        {
//            var respuesta = new ReporteRendimientoChoferesResponse();

//            using (var conn = new SqlConnection(connectionString))
//            using (var cmd = new SqlCommand("sp_ReporteRendimiento_Choferes", conn))
//            {
//                cmd.CommandType = CommandType.StoredProcedure;
//                cmd.Parameters.AddWithValue("@FechaDesde", fechaDesde.Date);
//                cmd.Parameters.AddWithValue("@FechaHasta", fechaHasta.Date);
//                cmd.Parameters.AddWithValue("@Id_Chofer", (object)idChofer ?? DBNull.Value);

//                await conn.OpenAsync();
//                using (var reader = await cmd.ExecuteReaderAsync())
//                {
//                    // 1. Leer Result Set 1: Métricas consolidadas por chofer
//                    while (await reader.ReadAsync())
//                    {
//                        respuesta.ResumenChoferes.Add(new ChoferResumenDTO
//                        {
//                            Id_Chofer = Convert.ToInt32(reader["Id_Chofer"]),
//                            ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString(),
//                            ViajesCerrados = Convert.ToInt32(reader["ViajesCerrados"]),
//                            ViajesEnCurso = Convert.ToInt32(reader["ViajesEnCurso"]),
//                            TotalViajesAsignados = Convert.ToInt32(reader["TotalViajesAsignados"]),
//                            KmEstimadosTotal = Convert.ToDecimal(reader["KmEstimadosTotal"]),
//                            KmRealesTotal = Convert.ToDecimal(reader["KmRealesTotal"]),
//                            DesvioKmTotal = Convert.ToDecimal(reader["DesvioKmTotal"]),
//                            PromedioKmPorViaje = Convert.ToDecimal(reader["PromedioKmPorViaje"]),
//                            DesvioPorcentaje = Convert.ToDecimal(reader["DesvioPorcentaje"]),
//                            VehiculoMasUsado = reader["VehiculoMasUsado"].ToString(),
//                            PorcentajeVehiculoHabitual = Convert.ToInt32(reader["PorcentajeVehiculoHabitual"]),
//                            LitrosTotalesConsumidos = Convert.ToDecimal(reader["LitrosTotalesConsumidos"]),
//                            CostoTotalCombustible = Convert.ToDecimal(reader["CostoTotalCombustible"])
//                        });
//                    }

//                    // 2. Avanzar al Result Set 2: Listado individual de viajes por chofer
//                    if (await reader.NextResultAsync())
//                    {
//                        while (await reader.ReadAsync())
//                        {
//                            respuesta.DetalleViajes.Add(new ChoferViajeDetalleDTO
//                            {
//                                Id_Chofer = Convert.ToInt32(reader["Id_Chofer"]),
//                                ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString(),
//                                Id_HojaRuta = Convert.ToInt32(reader["Id_HojaRuta"]),
//                                HojaRutaFecha = Convert.ToDateTime(reader["HojaRutaFecha"]),
//                                FechaISO = reader["FechaISO"].ToString(),
//                                FechaFormateada = reader["FechaFormateada"].ToString(),
//                                Id_EstadoHDR = Convert.ToInt32(reader["Id_EstadoHDR"]),
//                                EstadoHDR = reader["EstadoHDR"].ToString(),
//                                Id_Vehiculo = reader["Id_Vehiculo"] != DBNull.Value ? Convert.ToInt32(reader["Id_Vehiculo"]) : (int?)null,
//                                Vehiculo = reader["Vehiculo"].ToString(),
//                                IdRegistroOdomet = reader["IdRegistroOdomet"] != DBNull.Value ? Convert.ToInt32(reader["IdRegistroOdomet"]) : (int?)null,
//                                InicioOdom = reader["InicioOdom"] != DBNull.Value ? Convert.ToDecimal(reader["InicioOdom"]) : (decimal?)null,
//                                FinalOdom = reader["FinalOdom"] != DBNull.Value ? Convert.ToDecimal(reader["FinalOdom"]) : (decimal?)null,
//                                EstaCerrado = Convert.ToInt32(reader["EstaCerrado"]),
//                                KmEstimadosHDR = Convert.ToDecimal(reader["KmEstimadosHDR"]),
//                                KmReales = Convert.ToDecimal(reader["KmReales"]),
//                                DesvioKm = Convert.ToDecimal(reader["DesvioKm"]),
//                                LitrosConsumidos = Convert.ToDecimal(reader["LitrosConsumidos"]),
//                                CostoTotalViaje = Convert.ToDecimal(reader["CostoTotalViaje"])
//                            });
//                        }
//                    }
//                }
//            }

//            return respuesta;
//        }





//    }
//}