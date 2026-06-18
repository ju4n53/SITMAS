using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Configuration;

namespace API_SITMAS.Models
{
    public class MovimientoSalida
    {
        #region Atributos
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;
        #endregion

        #region Propiedades
        public int IdSalida { get; set; }
        public string TipoMovimiento { get; set; } // 'Producción', 'Retiro', 'Egreso'
        public DateTime FechaMovimiento { get; set; }
        public int Id_SubTipo_Material { get; set; }
        public decimal PesoRetirado { get; set; }
        public string Observaciones { get; set; }
        public string EstadoSalida { get; set; }
        #endregion

        #region Métodos

        public DataTable ListarMovimientoSalida()
        {
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand("sp_ListarMovimientoSalida", sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                DataSet ds = new DataSet();
                SqlDataAdapter da = new SqlDataAdapter(sqlCom);
                sqlCnn.Open();
                da.Fill(ds);
                return ds.Tables[0];
            }
        }


        public void InsertarSalida()
        {
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand("sp_RegistrarMovimientoSalida", sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                // Mapeo riguroso de parámetros hacia el Stored Procedure
                sqlCom.Parameters.Add("@TipoMovimiento", SqlDbType.VarChar, 30).Value = TipoMovimiento;
                sqlCom.Parameters.Add("@IdSubtipoMaterial", SqlDbType.Int).Value = Id_SubTipo_Material;
                sqlCom.Parameters.Add("@PesoRetirado", SqlDbType.Decimal).Value = PesoRetirado;
                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 250).Value = (object)Observaciones ?? DBNull.Value;

                sqlCnn.Open();
                // Usamos ExecuteNonQuery porque el SP valida e inserta físicamente
                sqlCom.ExecuteNonQuery();
                sqlCnn.Close();
            }
        }
        #endregion
    }

    public class StockActualNeto
    {
        public int IdSubtipo { get; set; }
        public string Categoria { get; set; }
        public string SubtipoMaterial { get; set; }
        public decimal TotalClasificadoKg { get; set; }
        public decimal TotalSalidoKg { get; set; }
        public decimal StockDisponibleKg { get; set; }
    }

    public class StockManager
    {
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public DataTable ObtenerStockNeto()
        {
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand("sp_ListarVistaStockActualNeto", sqlCnn);
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