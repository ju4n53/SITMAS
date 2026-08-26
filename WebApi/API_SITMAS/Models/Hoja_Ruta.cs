using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class HojaRuta
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public int Id { get; set; }
        public DateTime HojaRutaFecha { get; set; }
        public int Id_Vehiculo { get; set; }
        public int Id_Chofer { get; set; }

        // Propiedades de lectura desde la Vista (vw_HojaRuta_Cabecera)
        public string FechaFormateada { get; set; }
        public string Vehiculo { get; set; }
        public string ChoferNombreCompleto { get; set; }

        public List<HojaRuta> SelectAll()
        {
            var lista = new List<HojaRuta>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new HojaRuta
                        {
                            Id = Convert.ToInt32(reader["Id_HojaRuta"]),
                            FechaFormateada = reader["FechaFormateada"].ToString(),
                            Vehiculo = reader["Vehiculo"].ToString(),
                            ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString()
                        });
                    }
                }
            }
            return lista;
        }

        public int Insertar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_InsertarHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@HojaRutaFecha", HojaRutaFecha);
                sqlCom.Parameters.AddWithValue("@Id_Vehiculo", Id_Vehiculo);
                sqlCom.Parameters.AddWithValue("@Id_Chofer", Id_Chofer);

                sqlCnn.Open();
                // ExecuteScalar obtiene el IdGenerado que retornó SCOPE_IDENTITY()
                return Convert.ToInt32(sqlCom.ExecuteScalar());
            }
        }

        public bool Modificar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@Id", Id);
                sqlCom.Parameters.AddWithValue("@HojaRutaFecha", HojaRutaFecha);
                sqlCom.Parameters.AddWithValue("@Id_Vehiculo", Id_Vehiculo);
                sqlCom.Parameters.AddWithValue("@Id_Chofer", Id_Chofer);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        public bool Borrar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_EliminarHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@Id", Id);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
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
//    public class HojaRuta
//    {
//        #region Atributos

//        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

//        #endregion

//        #region Propìedades

//        public int Id { get; set; }
//        public DateTime HojaRutaFecha { get; set; }
//        public int Id_Vehiculo { get; set; }
//        public int Id_Chofer { get; set; }
//        public int Id_Estado { get; set; }


//        #endregion

//        #region Metodos

//        public DataTable SelectAll()
//        {


//            string sqlSentencia = "sp_ListarHDR";

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


//        public void Insertar()
//        {

//            string sqlSentencia = "sp_InsertarHDR";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@HojaRutaFecha", SqlDbType.DateTime).Value = HojaRutaFecha;
//            sqlCom.Parameters.Add("@Id_Vehiculo", SqlDbType.Int).Value = Id_Vehiculo;
//            sqlCom.Parameters.Add("@Id_Chofer", SqlDbType.Int).Value = Id_Chofer;
//            sqlCom.Parameters.Add("@Id_EST_HDR", SqlDbType.Int).Value = Id_Estado;

//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();

//        }


//        public void Modificar()
//        {


//            string sqlSentencia = "sp_ActualizarHDR";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;
//            sqlCom.Parameters.Add("@HojaRutaFecha", SqlDbType.DateTime).Value = HojaRutaFecha;
//            sqlCom.Parameters.Add("@Id_Vehiculo", SqlDbType.Int).Value = Id_Vehiculo;
//            sqlCom.Parameters.Add("@Id_Chofer", SqlDbType.Int).Value = Id_Chofer;
//            sqlCom.Parameters.Add("@Id_EST_HDR", SqlDbType.Int).Value = Id_Estado;

//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();

//        }



//        public void Borrar()
//        {

//            string sqlSentencia = "sp_EliminarHDR";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;


//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;

//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();


//        }


//        #endregion
//    }
//}