using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;

namespace API_SITMAS.Models
{
    #region 1. DTOs PARA RESUMEN DE KPIs Y EVOLUCIÓN (SP 1)

    public class TrazabilidadKpisDTO
    {
        public int TotalLotesIngresados { get; set; }
        public int LotesPorCamion { get; set; }
        public int LotesParticulares { get; set; }
        public decimal TotalPesoBrutoKg { get; set; }
        public decimal TotalPesoVerdeKg { get; set; }
        public decimal TotalPesoAmarilloKg { get; set; }
        public decimal TotalPesoRojoKg { get; set; }
        public decimal DiferenciaSinClasificarKg { get; set; }
        public decimal PorcentajeAprovechamientoVerde { get; set; }
        public decimal PorcentajeRecuperableTotal { get; set; }
        public decimal TotalEgresadoPlantaKg { get; set; }
        public decimal BalanceFlujoRecuperableKg { get; set; } // Nuevo: (Verde + Amarillo) - Egresado
        public decimal PromedioHorasClasificacion { get; set; }
    }

    public class TrazabilidadEvolucionDiariaDTO
    {
        public DateTime? Fecha { get; set; } // Nullable para evitar DateTime.MinValue en ECharts
        public int CantLotes { get; set; }
        public decimal PesoBrutoKg { get; set; }
        public decimal PesoVerdeKg { get; set; }
        public decimal PesoAmarilloKg { get; set; }
        public decimal PesoRojoKg { get; set; }
        public decimal PesoEgresadoKg { get; set; } // Nuevo: Flujo diario de salidas de planta
    }

    public class TrazabilidadResumenResponseDTO
    {
        public TrazabilidadKpisDTO Kpis { get; set; }
        public List<TrazabilidadEvolucionDiariaDTO> EvolucionDiaria { get; set; }

        public TrazabilidadResumenResponseDTO()
        {
            Kpis = new TrazabilidadKpisDTO();
            EvolucionDiaria = new List<TrazabilidadEvolucionDiariaDTO>();
        }
    }

    #endregion

    #region 2. DTOs PARA ESTADÍSTICA DE MATERIALES Y SUBTIPOS (SP 2)

    public class TrazabilidadTipoMaterialDTO
    {
        public int IdTipoMaterial { get; set; }
        public string TipoMaterial { get; set; }
        public int CantLotes { get; set; }
        public decimal PesoBrutoTotalKg { get; set; }
        public decimal PromedioBrutoPorLoteKg { get; set; }
        public decimal PesoVerdeKg { get; set; }
        public decimal PesoAmarilloKg { get; set; }
        public decimal PesoRojoKg { get; set; }
        public decimal PorcentajeAprovechamiento { get; set; }
    }

    public class TrazabilidadSubtipoMaterialDTO
    {
        public int IdSubtipoM { get; set; }
        public int IdTipoMaterial { get; set; }
        public string TipoMaterial { get; set; }
        public string Subtipo { get; set; }
        public int CantClasificaciones { get; set; }
        public decimal PesoVerdeKg { get; set; }
        public decimal PesoAmarilloKg { get; set; }
        public decimal PesoRojoKg { get; set; }
        public decimal PromedioPesoVerdeKg { get; set; }
        public decimal TotalSalidasKg { get; set; }
        public decimal EgresoKg { get; set; }
        public decimal RetiroKg { get; set; }
        public decimal ProduccionKg { get; set; }
        public decimal BalanceNetoPeriodoKg { get; set; }
    }

    public class TrazabilidadMaterialResponseDTO
    {
        public List<TrazabilidadTipoMaterialDTO> PorTipo { get; set; }
        public List<TrazabilidadSubtipoMaterialDTO> PorSubtipo { get; set; }

        public TrazabilidadMaterialResponseDTO()
        {
            PorTipo = new List<TrazabilidadTipoMaterialDTO>();
            PorSubtipo = new List<TrazabilidadSubtipoMaterialDTO>();
        }
    }

    #endregion

    #region 3. DTOs PARA ESTADÍSTICA DE ORÍGENES Y GENERADORES (SP 3)

    public class TrazabilidadOrigenRankingDTO
    {
        public string ClaveOrigen { get; set; }
        public string NombreOrigen { get; set; }
        public string CategoriaOrigen { get; set; }
        public int FrecuenciaEntregas { get; set; }
        public int CantLotes { get; set; }
        public decimal PesoBrutoTotalKg { get; set; }
        public decimal PromedioKgPorEntrega { get; set; }
        public decimal PesoUtilVerdeKg { get; set; }
        public decimal PesoRevisionAmarilloKg { get; set; }
        public decimal PesoDescarteRojoKg { get; set; }
        public decimal PesoClasificadoTotalKg { get; set; }
        public decimal IndiceCalidadOrigenPct { get; set; }
        public DateTime? UltimaEntrega { get; set; }
        public decimal? Latitud { get; set; }
        public decimal? Longitud { get; set; }
        public string UbicacionDescripcion { get; set; }
    }

    public class TrazabilidadOrigenCategoriaDTO
    {
        public string CategoriaOrigen { get; set; }
        public int CantEntregas { get; set; }
        public int CantLotes { get; set; }
        public decimal PesoBrutoTotalKg { get; set; }
        public decimal PromedioKgEntrega { get; set; }
    }

    public class TrazabilidadOrigenResponseDTO
    {
        public List<TrazabilidadOrigenRankingDTO> RankingOrigenes { get; set; }
        public List<TrazabilidadOrigenCategoriaDTO> PorCategoria { get; set; }

        public TrazabilidadOrigenResponseDTO()
        {
            RankingOrigenes = new List<TrazabilidadOrigenRankingDTO>();
            PorCategoria = new List<TrazabilidadOrigenCategoriaDTO>();
        }
    }

    #endregion

    #region 4. DTOs PARA AUDITORÍA GRANULAR DE LOTES (SP 4)

    public class TrazabilidadLoteDetalleClasifDTO
    {
        public int IdClasificacion { get; set; }
        public int IdDetalleIngreso { get; set; }
        public DateTime? FechaClasificacion { get; set; }
        public string Subtipo { get; set; }
        public decimal PesoUtil { get; set; }
        public int IdEstadoMaterial { get; set; }
        public string SemaforoEstado { get; set; }
        public int IdDestino { get; set; }
        public string NombreDestino { get; set; }
        public string OperadorClasificador { get; set; }
    }

    public class TrazabilidadLoteCabeceraDTO
    {
        public int IdDetalleIngreso { get; set; }
        public DateTime? FechaIngreso { get; set; }
        public string CanalIngreso { get; set; }
        public int? IdCabeceraIngreso { get; set; }
        public int? IdHojaRuta { get; set; }
        public int? IdVehiculo { get; set; }
        public string PatenteVehiculo { get; set; }
        public string NombreChofer { get; set; }
        public string NombreOrigen { get; set; }
        public string TipoOrigen { get; set; }
        public int? IdTipoMaterial { get; set; }
        public string TipoMaterial { get; set; }
        public decimal PesoBruto { get; set; }
        public string ObservacionesIngreso { get; set; }
        public decimal PesoVerde { get; set; }
        public decimal PesoAmarillo { get; set; }
        public decimal PesoRojo { get; set; }
        public decimal TotalClasificado { get; set; }
        public decimal MermaODiferencia { get; set; }
        public decimal PorcentajeProcesado { get; set; }
        public string EstadoAuditoria { get; set; }

        // Lista de clasificaciones hijas vinculadas en O(N) para renderizado directo en UI
        public List<TrazabilidadLoteDetalleClasifDTO> Clasificaciones { get; set; }

        public TrazabilidadLoteCabeceraDTO()
        {
            Clasificaciones = new List<TrazabilidadLoteDetalleClasifDTO>();
        }
    }

    public class TrazabilidadAuditoriaResponseDTO
    {
        public List<TrazabilidadLoteCabeceraDTO> Lotes { get; set; }

        public TrazabilidadAuditoriaResponseDTO()
        {
            Lotes = new List<TrazabilidadLoteCabeceraDTO>();
        }
    }

    #endregion

    #region 5. DTOs PARA AUDITORÍA OPERATIVA EN PLANTA Y SALIDAS (SP 5)

    public class TrazabilidadOperadorDTO
    {
        public int IdUsuario { get; set; }
        public string NombreOperador { get; set; }
        public int CantPesajesClasificados { get; set; }
        public int CantLotesIntervenidos { get; set; }
        public decimal PesoVerdeKg { get; set; }
        public decimal PesoAmarilloKg { get; set; }
        public decimal PesoRojoKg { get; set; }
        public decimal PesoTotalProcesadoKg { get; set; }
    }

    public class TrazabilidadSemaforoDestinoDTO
    {
        public int IdEstadoMaterial { get; set; }
        public string SemaforoEstado { get; set; }
        public int IdDestino { get; set; }
        public string NombreDestino { get; set; }
        public int CantRegistros { get; set; }
        public decimal PesoTotalKg { get; set; }
    }

    public class TrazabilidadMovimientoSalidaDTO
    {
        public string TipoMovimiento { get; set; }
        public int CantMovimientos { get; set; }
        public decimal PesoTotalRetiradoKg { get; set; }
        public decimal PromedioPorMovimientoKg { get; set; }
    }

    public class TrazabilidadPlantaResponseDTO
    {
        public List<TrazabilidadOperadorDTO> Operadores { get; set; }
        public List<TrazabilidadSemaforoDestinoDTO> SemaforoDestinos { get; set; }
        public List<TrazabilidadMovimientoSalidaDTO> SalidasPlanta { get; set; }

        public TrazabilidadPlantaResponseDTO()
        {
            Operadores = new List<TrazabilidadOperadorDTO>();
            SemaforoDestinos = new List<TrazabilidadSemaforoDestinoDTO>();
            SalidasPlanta = new List<TrazabilidadMovimientoSalidaDTO>();
        }
    }

    #endregion

    #region CLASE DE ACCESO A DATOS (ADO.NET ASÍNCRONO CON MULTI-RESULT SETS)

    public class ReportesTrazabilidad
    {
        private readonly string _connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        // 1. Resumen KPIs y Evolución Diaria
        // 1. Resumen KPIs y Evolución Diaria (Flujo Entradas/Recuperación vs. Salidas)
        public async Task<TrazabilidadResumenResponseDTO> ObtenerResumenKPIsAsync(DateTime? fechaDesde, DateTime? fechaHasta, int? idTipoMaterial)
        {
            var resultado = new TrazabilidadResumenResponseDTO();

            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("dbo.sp_ReporteTrazabilidad_ResumenKPIs", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                AddParamNullable(cmd, "@FechaDesde", SqlDbType.Date, fechaDesde?.Date);
                AddParamNullable(cmd, "@FechaHasta", SqlDbType.Date, fechaHasta?.Date);
                AddParamNullable(cmd, "@IdTipoMaterial", SqlDbType.Int, idTipoMaterial);

                await conn.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    // Result Set 1: Tarjetas KPI
                    if (await reader.ReadAsync())
                    {
                        resultado.Kpis = new TrazabilidadKpisDTO
                        {
                            TotalLotesIngresados = GetInt(reader, "TotalLotesIngresados"),
                            LotesPorCamion = GetInt(reader, "LotesPorCamion"),
                            LotesParticulares = GetInt(reader, "LotesParticulares"),
                            TotalPesoBrutoKg = GetDecimal(reader, "TotalPesoBrutoKg"),
                            TotalPesoVerdeKg = GetDecimal(reader, "TotalPesoVerdeKg"),
                            TotalPesoAmarilloKg = GetDecimal(reader, "TotalPesoAmarilloKg"),
                            TotalPesoRojoKg = GetDecimal(reader, "TotalPesoRojoKg"),
                            DiferenciaSinClasificarKg = GetDecimal(reader, "DiferenciaSinClasificarKg"),
                            PorcentajeAprovechamientoVerde = GetDecimal(reader, "PorcentajeAprovechamientoVerde"),
                            PorcentajeRecuperableTotal = GetDecimal(reader, "PorcentajeRecuperableTotal"),
                            TotalEgresadoPlantaKg = GetDecimal(reader, "TotalEgresadoPlantaKg"),
                            BalanceFlujoRecuperableKg = GetDecimal(reader, "BalanceFlujoRecuperableKg"),
                            PromedioHorasClasificacion = GetDecimal(reader, "PromedioHorasClasificacion")
                        };
                    }

                    // Result Set 2: Serie Diaria Unificada (Ingresos/Clasificación vs. Salidas)
                    if (await reader.NextResultAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            resultado.EvolucionDiaria.Add(new TrazabilidadEvolucionDiariaDTO
                            {
                                Fecha = GetDateTimeNullable(reader, "Fecha"),
                                CantLotes = GetInt(reader, "CantLotes"),
                                PesoBrutoKg = GetDecimal(reader, "PesoBrutoKg"),
                                PesoVerdeKg = GetDecimal(reader, "PesoVerdeKg"),
                                PesoAmarilloKg = GetDecimal(reader, "PesoAmarilloKg"),
                                PesoRojoKg = GetDecimal(reader, "PesoRojoKg"),
                                PesoEgresadoKg = GetDecimal(reader, "PesoEgresadoKg")
                            });
                        }
                    }
                }
            }

            return resultado;
        }

        // 2. Estadísticas por Tipo y Subtipo de Material
        public async Task<TrazabilidadMaterialResponseDTO> ObtenerPorMaterialAsync(DateTime? fechaDesde, DateTime? fechaHasta, int? idTipoMaterial = null)
        {
            var resultado = new TrazabilidadMaterialResponseDTO();

            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("dbo.sp_ReporteTrazabilidad_PorMaterial", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                AddParamNullable(cmd, "@FechaDesde", SqlDbType.Date, fechaDesde?.Date);
                AddParamNullable(cmd, "@FechaHasta", SqlDbType.Date, fechaHasta?.Date);
                AddParamNullable(cmd, "@IdTipoMaterial", SqlDbType.Int, idTipoMaterial);

                await conn.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    // Result Set 1: Macro-Tipos
                    while (await reader.ReadAsync())
                    {
                        resultado.PorTipo.Add(new TrazabilidadTipoMaterialDTO
                        {
                            IdTipoMaterial = GetInt(reader, "IdTipoMaterial"),
                            TipoMaterial = GetString(reader, "TipoMaterial"),
                            CantLotes = GetInt(reader, "CantLotes"),
                            PesoBrutoTotalKg = GetDecimal(reader, "PesoBrutoTotalKg"),
                            PromedioBrutoPorLoteKg = GetDecimal(reader, "PromedioBrutoPorLoteKg"),
                            PesoVerdeKg = GetDecimal(reader, "PesoVerdeKg"),
                            PesoAmarilloKg = GetDecimal(reader, "PesoAmarilloKg"),
                            PesoRojoKg = GetDecimal(reader, "PesoRojoKg"),
                            PorcentajeAprovechamiento = GetDecimal(reader, "PorcentajeAprovechamiento")
                        });
                    }

                    // Result Set 2: Subtipos y Balance de Silo
                    if (await reader.NextResultAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            resultado.PorSubtipo.Add(new TrazabilidadSubtipoMaterialDTO
                            {
                                IdSubtipoM = GetInt(reader, "IdSubtipoM"),
                                IdTipoMaterial = GetInt(reader, "IdTipoMaterial"),
                                TipoMaterial = GetString(reader, "TipoMaterial"),
                                Subtipo = GetString(reader, "Subtipo"),
                                CantClasificaciones = GetInt(reader, "CantClasificaciones"),
                                PesoVerdeKg = GetDecimal(reader, "PesoVerdeKg"),
                                PesoAmarilloKg = GetDecimal(reader, "PesoAmarilloKg"),
                                PesoRojoKg = GetDecimal(reader, "PesoRojoKg"),
                                PromedioPesoVerdeKg = GetDecimal(reader, "PromedioPesoVerdeKg"),
                                TotalSalidasKg = GetDecimal(reader, "TotalSalidasKg"),
                                EgresoKg = GetDecimal(reader, "EgresoKg"),
                                RetiroKg = GetDecimal(reader, "RetiroKg"),
                                ProduccionKg = GetDecimal(reader, "ProduccionKg"),
                                BalanceNetoPeriodoKg = GetDecimal(reader, "BalanceNetoPeriodoKg")
                            });
                        }
                    }
                }
            }

            return resultado;
        }

        // 3. Estadísticas de Orígenes y Generadores
        public async Task<TrazabilidadOrigenResponseDTO> ObtenerPorOrigenAsync(DateTime? fechaDesde, DateTime? fechaHasta, int? idTipoMaterial)
        {
            var resultado = new TrazabilidadOrigenResponseDTO();

            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("dbo.sp_ReporteTrazabilidad_PorOrigen", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                AddParamNullable(cmd, "@FechaDesde", SqlDbType.Date, fechaDesde?.Date);
                AddParamNullable(cmd, "@FechaHasta", SqlDbType.Date, fechaHasta?.Date);
                AddParamNullable(cmd, "@IdTipoMaterial", SqlDbType.Int, idTipoMaterial);

                await conn.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    // Result Set 1: Ranking de Generadores
                    while (await reader.ReadAsync())
                    {
                        resultado.RankingOrigenes.Add(new TrazabilidadOrigenRankingDTO
                        {
                            ClaveOrigen = GetString(reader, "ClaveOrigen"),
                            NombreOrigen = GetString(reader, "NombreOrigen"),
                            CategoriaOrigen = GetString(reader, "CategoriaOrigen"),
                            FrecuenciaEntregas = GetInt(reader, "FrecuenciaEntregas"),
                            CantLotes = GetInt(reader, "CantLotes"),
                            PesoBrutoTotalKg = GetDecimal(reader, "PesoBrutoTotalKg"),
                            PromedioKgPorEntrega = GetDecimal(reader, "PromedioKgPorEntrega"),
                            PesoUtilVerdeKg = GetDecimal(reader, "PesoUtilVerdeKg"),
                            PesoRevisionAmarilloKg = GetDecimal(reader, "PesoRevisionAmarilloKg"),
                            PesoDescarteRojoKg = GetDecimal(reader, "PesoDescarteRojoKg"),
                            PesoClasificadoTotalKg = GetDecimal(reader, "PesoClasificadoTotalKg"),
                            IndiceCalidadOrigenPct = GetDecimal(reader, "IndiceCalidadOrigenPct"),
                            UltimaEntrega = GetDateTimeNullable(reader, "UltimaEntrega"),
                            Latitud = GetDecimalNullable(reader, "Latitud"),
                            Longitud = GetDecimalNullable(reader, "Longitud"),
                            UbicacionDescripcion = GetString(reader, "UbicacionDescripcion")
                        });
                    }

                    // Result Set 2: Comparativa por Categoría
                    if (await reader.NextResultAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            resultado.PorCategoria.Add(new TrazabilidadOrigenCategoriaDTO
                            {
                                CategoriaOrigen = GetString(reader, "CategoriaOrigen"),
                                CantEntregas = GetInt(reader, "CantEntregas"),
                                CantLotes = GetInt(reader, "CantLotes"),
                                PesoBrutoTotalKg = GetDecimal(reader, "PesoBrutoTotalKg"),
                                PromedioKgEntrega = GetDecimal(reader, "PromedioKgEntrega")
                            });
                        }
                    }
                }
            }

            return resultado;
        }

        // 4. Auditoría Granular de Lotes (Cabecera + Hijos Anidados)
        public async Task<TrazabilidadAuditoriaResponseDTO> ObtenerAuditoriaLotesAsync(DateTime? fechaDesde, DateTime? fechaHasta, int? idTipoMaterial, string estadoAuditoria)
        {
            var resultado = new TrazabilidadAuditoriaResponseDTO();
            var diccionarioLotes = new Dictionary<int, TrazabilidadLoteCabeceraDTO>();

            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("sp_ReporteTrazabilidad_AuditoriaLotes", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                AddParamNullable(cmd, "@FechaDesde", SqlDbType.Date, fechaDesde?.Date);
                AddParamNullable(cmd, "@FechaHasta", SqlDbType.Date, fechaHasta?.Date);
                AddParamNullable(cmd, "@IdTipoMaterial", SqlDbType.Int, idTipoMaterial);
                AddParamNullable(cmd, "@EstadoAuditoria", SqlDbType.VarChar, string.IsNullOrWhiteSpace(estadoAuditoria) ? null : estadoAuditoria.Trim().ToUpper());

                await conn.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    // Result Set 1: Cabeceras de Lote
                    while (await reader.ReadAsync())
                    {
                        var lote = new TrazabilidadLoteCabeceraDTO
                        {
                            IdDetalleIngreso = GetInt(reader, "IdDetalleIngreso"),
                            FechaIngreso = GetDateTimeNullable(reader, "FechaIngreso"),
                            CanalIngreso = GetString(reader, "CanalIngreso"),
                            IdCabeceraIngreso = GetIntNullable(reader, "IdCabeceraIngreso"),
                            IdHojaRuta = GetIntNullable(reader, "IdHojaRuta"),
                            IdVehiculo = GetIntNullable(reader, "IdVehiculo"),
                            PatenteVehiculo = GetString(reader, "PatenteVehiculo"),
                            NombreChofer = GetString(reader, "NombreChofer"),
                            NombreOrigen = GetString(reader, "NombreOrigen"),
                            TipoOrigen = GetString(reader, "TipoOrigen"),
                            IdTipoMaterial = GetIntNullable(reader, "IdTipoMaterial"),
                            TipoMaterial = GetString(reader, "TipoMaterial"),
                            PesoBruto = GetDecimal(reader, "PesoBruto"),
                            ObservacionesIngreso = GetString(reader, "ObservacionesIngreso"),
                            PesoVerde = GetDecimal(reader, "PesoVerde"),
                            PesoAmarillo = GetDecimal(reader, "PesoAmarillo"),
                            PesoRojo = GetDecimal(reader, "PesoRojo"),
                            TotalClasificado = GetDecimal(reader, "TotalClasificado"),
                            MermaODiferencia = GetDecimal(reader, "MermaODiferencia"),
                            PorcentajeProcesado = GetDecimal(reader, "PorcentajeProcesado"),
                            EstadoAuditoria = GetString(reader, "EstadoAuditoria")
                        };

                        resultado.Lotes.Add(lote);
                        diccionarioLotes[lote.IdDetalleIngreso] = lote;
                    }

                    // Result Set 2: Clasificaciones Hijas (se acoplan directo a su lote padre)
                    if (await reader.NextResultAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            int idDetalle = GetInt(reader, "Id_Detalle_Ingreso");
                            var detalle = new TrazabilidadLoteDetalleClasifDTO
                            {
                                IdClasificacion = GetInt(reader, "IdClasificacion"),
                                IdDetalleIngreso = idDetalle,
                                FechaClasificacion = GetDateTimeNullable(reader, "FechaClasificacion"),
                                Subtipo = GetString(reader, "Subtipo"),
                                PesoUtil = GetDecimal(reader, "PesoUtil"),
                                IdEstadoMaterial = GetInt(reader, "Id_Estado_Material"),
                                SemaforoEstado = GetString(reader, "SemaforoEstado"),
                                IdDestino = GetInt(reader, "Id_Destino"),
                                NombreDestino = GetString(reader, "NombreDestino"),
                                OperadorClasificador = GetString(reader, "OperadorClasificador")
                            };

                            if (diccionarioLotes.TryGetValue(idDetalle, out var lotePadre))
                            {
                                lotePadre.Clasificaciones.Add(detalle);
                            }
                        }
                    }
                }
            }

            return resultado;
        }

        // 5. Auditoría Operativa en Planta y Salidas
        public async Task<TrazabilidadPlantaResponseDTO> ObtenerPlantaYSalidasAsync(DateTime? fechaDesde, DateTime? fechaHasta)
        {
            var resultado = new TrazabilidadPlantaResponseDTO();

            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("sp_ReporteTrazabilidad_PlantaYSalidas", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                AddParamNullable(cmd, "@FechaDesde", SqlDbType.Date, fechaDesde?.Date);
                AddParamNullable(cmd, "@FechaHasta", SqlDbType.Date, fechaHasta?.Date);

                await conn.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    // Result Set 1: Operadores Clasificadores
                    while (await reader.ReadAsync())
                    {
                        resultado.Operadores.Add(new TrazabilidadOperadorDTO
                        {
                            IdUsuario = GetInt(reader, "IdUsuario"),
                            NombreOperador = GetString(reader, "NombreOperador"),
                            CantPesajesClasificados = GetInt(reader, "CantPesajesClasificados"),
                            CantLotesIntervenidos = GetInt(reader, "CantLotesIntervenidos"),
                            PesoVerdeKg = GetDecimal(reader, "PesoVerdeKg"),
                            PesoAmarilloKg = GetDecimal(reader, "PesoAmarilloKg"),
                            PesoRojoKg = GetDecimal(reader, "PesoRojoKg"),
                            PesoTotalProcesadoKg = GetDecimal(reader, "PesoTotalProcesadoKg")
                        });
                    }

                    // Result Set 2: Distribución por Semáforo y Destino
                    if (await reader.NextResultAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            resultado.SemaforoDestinos.Add(new TrazabilidadSemaforoDestinoDTO
                            {
                                IdEstadoMaterial = GetInt(reader, "IdEstadoMaterial"),
                                SemaforoEstado = GetString(reader, "SemaforoEstado"),
                                IdDestino = GetInt(reader, "Id_Destino"),
                                NombreDestino = GetString(reader, "NombreDestino"),
                                CantRegistros = GetInt(reader, "CantRegistros"),
                                PesoTotalKg = GetDecimal(reader, "PesoTotalKg")
                            });
                        }
                    }

                    // Result Set 3: Movimientos de Salida
                    if (await reader.NextResultAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            resultado.SalidasPlanta.Add(new TrazabilidadMovimientoSalidaDTO
                            {
                                TipoMovimiento = GetString(reader, "TipoMovimiento"),
                                CantMovimientos = GetInt(reader, "CantMovimientos"),
                                PesoTotalRetiradoKg = GetDecimal(reader, "PesoTotalRetiradoKg"),
                                PromedioPorMovimientoKg = GetDecimal(reader, "PromedioPorMovimientoKg")
                            });
                        }
                    }
                }
            }

            return resultado;
        }

        #region HELPERS DE LECTURA SEGURA (BLINDAJE CONTRA DBNull)

        private static void AddParamNullable(SqlCommand cmd, string name, SqlDbType type, object value)
        {
            var param = cmd.Parameters.Add(name, type);
            param.Value = value ?? DBNull.Value;
        }

        private static int GetInt(SqlDataReader r, string col) =>
            r[col] != DBNull.Value ? Convert.ToInt32(r[col]) : 0;

        private static int? GetIntNullable(SqlDataReader r, string col) =>
            r[col] != DBNull.Value ? (int?)Convert.ToInt32(r[col]) : null;

        private static decimal GetDecimal(SqlDataReader r, string col) =>
            r[col] != DBNull.Value ? Convert.ToDecimal(r[col]) : 0m;

        private static decimal? GetDecimalNullable(SqlDataReader r, string col) =>
            r[col] != DBNull.Value ? (decimal?)Convert.ToDecimal(r[col]) : null;

        private static DateTime GetDateTime(SqlDataReader r, string col) =>
            r[col] != DBNull.Value ? Convert.ToDateTime(r[col]) : DateTime.MinValue;

        private static DateTime? GetDateTimeNullable(SqlDataReader r, string col) =>
            r[col] != DBNull.Value ? (DateTime?)Convert.ToDateTime(r[col]) : null;

        private static string GetString(SqlDataReader r, string col) =>
            r[col] != DBNull.Value ? r[col].ToString() : null;

        #endregion
    }

    #endregion
}