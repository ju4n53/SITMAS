using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
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
        public int Id_Empleado { get; set; }
        public string Observaciones { get; set; }
        public string EstadoSalida { get; set; }

        // Propiedades descriptivas mapeadas de la vista/JOINs
        public string NombreSubtipo { get; set; }
        public string EmpleadoResponsable { get; set; }
        #endregion

        #region Métodos

        public List<MovimientoSalida> SelectAll()
        {
            List<MovimientoSalida> lista = new List<MovimientoSalida>();
            string sqlSentencia = "sp_ListarMovimientoSalida";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        MovimientoSalida obj = new MovimientoSalida();

                        obj.IdSalida = Convert.ToInt32(reader["IdSalida"]);
                        obj.TipoMovimiento = reader["TipoMovimiento"].ToString();
                        obj.FechaMovimiento = Convert.ToDateTime(reader["FechaMovimiento"]);
                        obj.Id_SubTipo_Material = Convert.ToInt32(reader["Id_SubTipo_Material"]);
                        obj.NombreSubtipo = reader["Subtipo"] != DBNull.Value ? reader["Subtipo"].ToString() : string.Empty;
                        obj.PesoRetirado = Convert.ToDecimal(reader["PesoRetirado"]);

                        obj.Id_Empleado = reader["Id_Empleado"] != DBNull.Value ? Convert.ToInt32(reader["Id_Empleado"]) : 0;
                        obj.EmpleadoResponsable = reader["EmpleadoResponsable"] != DBNull.Value ? reader["EmpleadoResponsable"].ToString() : "Sin Especificar";

                        obj.Observaciones = reader["Observaciones"] != DBNull.Value ? reader["Observaciones"].ToString() : null;
                        obj.EstadoSalida = reader["EstadoSalida"].ToString();

                        lista.Add(obj);
                    }
                }
            }
            return lista;
        }

        public void InsertarSalida()
        {
            string sqlSentencia = "sp_InsertarMovimientoSalida";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@TipoMovimiento", SqlDbType.VarChar, 30).Value = TipoMovimiento;
                sqlCom.Parameters.Add("@FechaMovimiento", SqlDbType.DateTime).Value = FechaMovimiento != DateTime.MinValue ? FechaMovimiento : DateTime.Now;
                sqlCom.Parameters.Add("@IdSubtipoMaterial", SqlDbType.Int).Value = Id_SubTipo_Material;
                sqlCom.Parameters.Add("@PesoRetirado", SqlDbType.Decimal).Value = PesoRetirado;
                sqlCom.Parameters.Add("@Id_Empleado", SqlDbType.Int).Value = Id_Empleado;
                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 250).Value = string.IsNullOrEmpty(Observaciones) ? DBNull.Value : (object)Observaciones;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }
        }

        public void Modificar()
        {
            string sqlSentencia = "sp_ActualizarMovimientoSalida";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdSalida", SqlDbType.Int).Value = IdSalida;
                sqlCom.Parameters.Add("@TipoMovimiento", SqlDbType.VarChar, 30).Value = TipoMovimiento;
                sqlCom.Parameters.Add("@FechaMovimiento", SqlDbType.DateTime).Value = FechaMovimiento != DateTime.MinValue ? FechaMovimiento : DateTime.Now;
                sqlCom.Parameters.Add("@Id_Empleado", SqlDbType.Int).Value = Id_Empleado;
                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 250).Value = string.IsNullOrEmpty(Observaciones) ? DBNull.Value : (object)Observaciones;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }
        }

        public void Borrar()
        {
            string sqlSentencia = "sp_AnularMovimientoSalida";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdSalida", SqlDbType.Int).Value = IdSalida;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
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

        public List<StockActualNeto> ObtenerStockNeto()
        {
            List<StockActualNeto> lista = new List<StockActualNeto>();
            string sqlSentencia = "SELECT IdSubtipo, Categoria, SubtipoMaterial, TotalClasificadoKg, TotalSalidoKg, StockDisponibleKg FROM vw_StockActualNeto";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.Text;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        StockActualNeto item = new StockActualNeto();
                        item.IdSubtipo = Convert.ToInt32(reader["IdSubtipo"]);
                        item.Categoria = reader["Categoria"] != DBNull.Value ? reader["Categoria"].ToString() : string.Empty;
                        item.SubtipoMaterial = reader["SubtipoMaterial"] != DBNull.Value ? reader["SubtipoMaterial"].ToString() : string.Empty;
                        item.TotalClasificadoKg = Convert.ToDecimal(reader["TotalClasificadoKg"]);
                        item.TotalSalidoKg = Convert.ToDecimal(reader["TotalSalidoKg"]);
                        item.StockDisponibleKg = Convert.ToDecimal(reader["StockDisponibleKg"]);

                        lista.Add(item);
                    }
                }
            }
            return lista;
        }
    }
}









//using System;
//using System.Collections.Generic;
//using System.Data;
//using System.Data.SqlClient;
//using System.Linq;
//using System.Web;
//using System.Configuration;

//namespace API_SITMAS.Models
//{
//    public class MovimientoSalida
//    {
//        #region Atributos
//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;
//        #endregion

//        #region Propiedades
//        public int IdSalida { get; set; }
//        public string TipoMovimiento { get; set; } // 'Producción', 'Retiro', 'Egreso'
//        public DateTime FechaMovimiento { get; set; }
//        public int Id_SubTipo_Material { get; set; }
//        public decimal PesoRetirado { get; set; }
//        public string Observaciones { get; set; }
//        public string EstadoSalida { get; set; }
//        #endregion

//        #region Métodos

//        public DataTable ListarMovimientoSalida()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand("sp_ListarMovimientoSalida", sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                DataSet ds = new DataSet();
//                SqlDataAdapter da = new SqlDataAdapter(sqlCom);
//                sqlCnn.Open();
//                da.Fill(ds);
//                return ds.Tables[0];
//            }
//        }


//        public void InsertarSalida()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand("sp_RegistrarMovimientoSalida", sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                // Mapeo riguroso de parámetros hacia el Stored Procedure
//                sqlCom.Parameters.Add("@TipoMovimiento", SqlDbType.VarChar, 30).Value = TipoMovimiento;
//                sqlCom.Parameters.Add("@IdSubtipoMaterial", SqlDbType.Int).Value = Id_SubTipo_Material;
//                sqlCom.Parameters.Add("@PesoRetirado", SqlDbType.Decimal).Value = PesoRetirado;
//                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 250).Value = (object)Observaciones ?? DBNull.Value;

//                sqlCnn.Open();
//                // Usamos ExecuteNonQuery porque el SP valida e inserta físicamente
//                sqlCom.ExecuteNonQuery();
//                sqlCnn.Close();
//            }
//        }
//        #endregion
//    }

//    public class StockActualNeto
//    {
//        public int IdSubtipo { get; set; }
//        public string Categoria { get; set; }
//        public string SubtipoMaterial { get; set; }
//        public decimal TotalClasificadoKg { get; set; }
//        public decimal TotalSalidoKg { get; set; }
//        public decimal StockDisponibleKg { get; set; }
//    }

//    public class StockManager
//    {
//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

//        public DataTable ObtenerStockNeto()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand("sp_ListarVistaStockActualNeto", sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                DataSet ds = new DataSet();
//                SqlDataAdapter da = new SqlDataAdapter(sqlCom);
//                sqlCnn.Open();
//                da.Fill(ds);
//                return ds.Tables[0];
//            }
//        }
//    }

//}