using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Configuration;

namespace API_SITMAS.Models
{
    public class ReporteTrazabilidad
    {
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        // Propiedades idénticas a las columnas de la vista SQL
        public int NroIngreso { get; set; }
        public DateTime FechaIngreso { get; set; }
        public string Origen { get; set; }
        public string Chofer { get; set; }
        public string Vehiculo { get; set; }
        public string Categoria { get; set; }
        public string SubTipo { get; set; }
        public decimal PesoBruto { get; set; }
        public decimal? PesoUtil { get; set; } // Permitimos nulos porque usa LEFT JOIN
        public string Condicion { get; set; }
        public string DestinoFinal { get; set; }
        public string ClasificadoPor { get; set; }

        public DataTable ObtenerReporteCompleto()
        {
            string sqlSentencia = "sp_VistaReporteTrazabilidad";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
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