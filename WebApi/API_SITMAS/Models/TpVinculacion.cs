using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class TpVinculacion
    {
        public int IdVinculacion { get; set; }
        public string TipoVinculacion { get; set; }
    }

    public class TpVinculacionDatos
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public List<TpVinculacion> SelectAll()
        {
            var lista = new List<TpVinculacion>();
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ListarTpVinculacion", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new TpVinculacion
                            {
                                IdVinculacion = Convert.ToInt32(reader["IdVinculacion"]),
                                TipoVinculacion = reader["TipoVinculacion"].ToString()
                            });
                        }
                    }
                }
            }
            return lista;
        }

        public int Insertar(TpVinculacion modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_InsertarTpVinculacion", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@TipoVinculacion", modelo.TipoVinculacion);
                    sqlCnn.Open();
                    return Convert.ToInt32(sqlCom.ExecuteScalar());
                }
            }
        }

        public void Modificar(TpVinculacion modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarTpVinculacion", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@IdVinculacion", modelo.IdVinculacion);
                    sqlCom.Parameters.AddWithValue("@TipoVinculacion", modelo.TipoVinculacion);
                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        public void Borrar(int id)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_EliminarTpVinculacion", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@IdVinculacion", id);
                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }
    }
}







//using System;
//using System.Collections.Generic;
//using System.Configuration;
//using System.Data;
//using System.Data.SqlClient;
//using System.Linq;
//using System.Web;
//using System.Web.Helpers;

//namespace API_SITMAS.Models
//{
//    public class TpVinculacion
//    {
//        #region Atributos

//        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

//        #endregion

//        #region Propìedades

//        public int IdVinculacion { get; set; }
//        public string TipoVinculacion { get; set; }

//        #endregion

//        #region Metodos

//        public DataTable SelectAll()
//        {


//            string sqlSentencia = "sp_ListarTpVinculacion";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;

//            sqlCnn.Open();

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            DataSet ds = new DataSet();

//            SqlDataAdapter da = new SqlDataAdapter();
//            da.SelectCommand = sqlCom;
//            da.Fill(ds);

//            sqlCnn.Close();

//            return ds.Tables[0];

//        }

//        //public DataTable SelectId()
//        //{


//        //    string sqlSentencia = "sp_VerEmpleadoId";

//        //    SqlConnection sqlCnn = new SqlConnection();
//        //    sqlCnn.ConnectionString = conectionString;


//        //    sqlCnn.Open();

//        //    SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//        //    sqlCom.CommandType = CommandType.StoredProcedure;
//        //    sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;

//        //    DataSet ds = new DataSet();

//        //    SqlDataAdapter da = new SqlDataAdapter();
//        //    da.SelectCommand = sqlCom;
//        //    da.Fill(ds);

//        //    sqlCnn.Close();

//        //    return ds.Tables[0];

//        //}

//        public void Insertar()
//        {

//            string sqlSentencia = "sp_InsertarTpVinculacion";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@TipoVinculacion", SqlDbType.NVarChar).Value = TipoVinculacion;

//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();

//        }


//        public void Modificar()
//        {


//            string sqlSentencia = "sp_ActualizarTpVinculacion";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@IdVinculacion", SqlDbType.Int).Value = IdVinculacion;
//            sqlCom.Parameters.Add("@TipoVinculacion", SqlDbType.NVarChar).Value = TipoVinculacion;

//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();

//        }


//        //EL MÉTODO BORRAR EMPLEADO SE ENCUENTRA FUNCIONANDO, PERO ESTÁ DESACTIVADO (COMENTADO)

//        public void Borrar()
//        {

//            string sqlSentencia = "sp_EliminarTpVinculacion";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;


//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@IdVinculacion", SqlDbType.Int).Value = IdVinculacion;

//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();


//        }




//        #endregion
//    }
//}