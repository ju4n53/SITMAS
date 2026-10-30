using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class Barrios
    {
        public int Id { get; set; }
        public string Barrio { get; set; }
        public int? Id_Localidad { get; set; }
    }

    public class BarrioDatos
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public List<Barrios> SelectAll()
        {
            var lista = new List<Barrios>();
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ListarBarrio", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new Barrios
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                Barrio = reader["Barrio"].ToString(),
                                Id_Localidad = reader["Id_Localidad"] != DBNull.Value ? (int?)Convert.ToInt32(reader["Id_Localidad"]) : null
                            });
                        }
                    }
                }
            }
            return lista;
        }

        public List<Barrios> SelectPorLocalidad(int idLocalidad)
        {
            var lista = new List<Barrios>();
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ListarBarriosPorLocalidad", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id_Localidad", idLocalidad);
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new Barrios
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                Barrio = reader["Barrio"].ToString(),
                                Id_Localidad = reader["Id_Localidad"] != DBNull.Value ? (int?)Convert.ToInt32(reader["Id_Localidad"]) : null
                            });
                        }
                    }
                }
            }
            return lista;
        }

        public int Insertar(Barrios modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_InsertarBarrio", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Barrio", modelo.Barrio);
                    sqlCom.Parameters.AddWithValue("@Id_Localidad", (object)modelo.Id_Localidad ?? DBNull.Value);
                    sqlCnn.Open();
                    return Convert.ToInt32(sqlCom.ExecuteScalar());
                }
            }
        }

        public void Modificar(Barrios modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarBarrio", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id", modelo.Id);
                    sqlCom.Parameters.AddWithValue("@Barrio", modelo.Barrio);
                    sqlCom.Parameters.AddWithValue("@Id_Localidad", (object)modelo.Id_Localidad ?? DBNull.Value);
                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        public void Borrar(int id)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_EliminarBarrio", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id", id);
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

//namespace API_SITMAS.Models
//{
//    public class Barrios
//    {

//        #region Atributos

//        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;


//        //string conectionString = @"Data Source=DESKTOP-N824T94;Initial Catalog=Gestion_SITMAS; Integrated Security= True ";

//        #endregion

//        #region Propìedades

//        public int Id { get; set; }
//        public string Barrio { get; set; }

//        #endregion

//        #region Metodos

//        public DataTable SelectAll()
//        {


//            string sqlSentencia = "sp_ListarBarrio";

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

//        #endregion

//    }

//}