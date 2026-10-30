using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace API_SITMAS.Models
{
    //CLASE REPORTE DE INGRESOS (CABECERA)
    public class ReporteIngresoCabecera
    {
        public int NroIngreso { get; set; }
        public DateTime FechaIngreso { get; set; }
        public string Chofer { get; set; }
        public string VehiculoPatente { get; set; }
        public string RegistradoPor { get; set; }
        public string Estado { get; set; }
    }

    // CLASE REPORTE DE DETALLE
    public class ReporteDetalleIngreso
    {
        public int NroDetalle { get; set; }
        public int NroIngresoAsociado { get; set; }
        public string OrigenEmpresa { get; set; }
        public string Categoria { get; set; }
        public string SubtipoMaterial { get; set; }
        public decimal KilosBrutos { get; set; }
        public string Observaciones { get; set; }
        public string Estado { get; set; }
    }

    // CLASE REPORTE DE MATERIAL CLASIFICADO
    public class ReporteMaterialClasificado
    {
        public int NroClasificacion { get; set; }
        public int NroDetalleOrigen { get; set; }
        public string Categoria { get; set; }
        public string SubtipoMaterial { get; set; }
        public decimal KilosUtiles { get; set; }
        public string CondicionMaterial { get; set; } // Verde, Amarillo, Rojo
        public string DestinoFinal { get; set; }
        public string ClasificadoPor { get; set; }
        public DateTime FechaClasificacion { get; set; }
        public string EstadoRegistro { get; set; }
    }

    // CLASE REPORTE DE MOVIMIENTOS DE SALIDA
    public class ReporteMovimientoSalida
    {
        public int NroSalida { get; set; }
        public string TipoEgreso { get; set; } // Producción, Retiro, Egreso
        public DateTime FechaMovimiento { get; set; }
        public string Categoria { get; set; }
        public string SubtipoMaterial { get; set; }
        public decimal KilosRetirados { get; set; }
        public string DestinoDetalle { get; set; }
        public string Estado { get; set; }
    }

    public class ReporteCalidadTotales
    {
        public decimal KilosTotalBase { get; set; }
        public decimal KilosVerde { get; set; }
        public decimal KilosAmarillo { get; set; }
        public decimal KilosRojo { get; set; }

        // Totales por Categoría,barra inferior
        public decimal KgsCartonPapel { get; set; }
        public decimal KgsMadera { get; set; }
        public decimal KgPlasticos { get; set; }
        public decimal KgsMetal { get; set; }
        public decimal KgsVidrio { get; set; }
        public decimal KgsRSU { get; set; }
        public decimal KgsOtro { get; set; }
    }


    //  MOTOR CONECTOR DB
    public class InformesManager
    {
        private string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        // Método genérico reutilizable para ejecutar Stored Procedures de listados
        public DataTable EjcutarSpReporte(string nombreSp)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                SqlCommand sqlCom = new SqlCommand(nombreSp, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                DataSet ds = new DataSet();
                SqlDataAdapter da = new SqlDataAdapter(sqlCom);
                sqlCnn.Open();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }
    }


    public class ReporteEstadisticasVehiculo
    {
        private static string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        // Propiedades idénticas a las columnas devueltas por el SP
        public int IdVehiculo { get; set; }
        public string Patente { get; set; }
        public decimal Total_Distancia { get; set; }
        public decimal Total_Costo_Combustible { get; set; }
        public int Total_HojasRuta { get; set; }

        public static List<ReporteEstadisticasVehiculo> ObtenerEstadisticas(DateTime? fechaDesde, DateTime? fechaHasta, string patente)
        {
            string sqlSentencia = "sp_ReporteEstadisticas_Log";
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;

                    // Asignamos parámetros manejando nulos correctamente
                    sqlCom.Parameters.AddWithValue("@FechaDesde", (object)fechaDesde ?? DBNull.Value);
                    sqlCom.Parameters.AddWithValue("@FechaHasta", (object)fechaHasta ?? DBNull.Value);
                    sqlCom.Parameters.AddWithValue("@Patente", (object)patente ?? DBNull.Value);

                    using (SqlDataAdapter da = new SqlDataAdapter(sqlCom))
                    {
                        DataTable dt = new DataTable();
                        sqlCnn.Open();
                        da.Fill(dt);

                        string json = JsonConvert.SerializeObject(dt);
                        return JsonConvert.DeserializeObject<List<ReporteEstadisticasVehiculo>>(json);
                    }
                }
            }
        }
    }



}