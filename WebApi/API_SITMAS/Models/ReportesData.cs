using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Configuration;

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
}