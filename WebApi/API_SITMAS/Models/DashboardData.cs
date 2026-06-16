using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Configuration;



namespace API_SITMAS.Models
{
    // CLASE PARA EL GRÁFICO DE PESO BRUTO TOTAL
    public class AcumuladoPesoBruto
    {
        public int IdSubtipo { get; set; }
        public string Categoria { get; set; }
        public string SubtipoMaterial { get; set; }
        public decimal TotalPesoBrutoKg { get; set; }
        public int CantidadPesadas { get; set; }
    }

    // CLASE PARA EL GRÁFICO COMPARATIVO Y MÉTRICAS DE MERMA 
    public class RendimientoClasificacion
    {
        public int IdSubtipo { get; set; }
        public string Categoria { get; set; }
        public string SubtipoMaterial { get; set; }
        public decimal TotalPesoBrutoKg { get; set; }
        public decimal TotalPesoUtilKg { get; set; }
        public decimal TotalDescarteKg { get; set; }
        public decimal PorcentajeRecuperacion { get; set; }
        public int TotalMaterialesIngresados { get; set; }
        public int CantidadClasificados { get; set; }
        public int CantidadPendientesClasificar { get; set; }
    }

    public class DashboardManager
    {
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        // Ejecuta sp_ReporteAcumuladoPesoBruto
        public DataTable ObtenerPesoBrutoAcumulado()
        {
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand("sp_ReporteAcumuladoPesoBruto", sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                DataSet ds = new DataSet();
                SqlDataAdapter da = new SqlDataAdapter(sqlCom);
                sqlCnn.Open();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }

        // Ejecuta sp_ReporteRendimientoClasificacion
        public DataTable ObtenerRendimientoClasificacion()
        {
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand("sp_ReporteRendimientoClasificacion", sqlCnn);
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