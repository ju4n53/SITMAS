using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class Origen_Particular
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public int Id_origenParticular { get; set; }
        public string nombre_origenParticular { get; set; }
        public string tipo_origenParticular { get; set; }
        public string observaciones { get; set; }

        public List<Origen_Particular> SelectAll()
        {
            List<Origen_Particular> lista = new List<Origen_Particular>();
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ListarOrigenParticular", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new Origen_Particular
                            {
                                Id_origenParticular = Convert.ToInt32(reader["Id_origenParticular"]),
                                nombre_origenParticular = reader["nombre_origenParticular"].ToString(),
                                tipo_origenParticular = reader["tipo_origenParticular"].ToString(),
                                observaciones = reader["observaciones"] != DBNull.Value ? reader["observaciones"].ToString() : string.Empty
                            });
                        }
                    }
                }
            }
            return lista;
        }

        public int Insertar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_InsertarOrigenParticular", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;

                    // CORRECCIÓN: Definición estricta de tipos de variables
                    sqlCom.Parameters.Add("@nombre", SqlDbType.VarChar, 150).Value = nombre_origenParticular;
                    sqlCom.Parameters.Add("@tipo", SqlDbType.VarChar, 50).Value = tipo_origenParticular;
                    sqlCom.Parameters.Add("@observaciones", SqlDbType.VarChar, 255).Value = string.IsNullOrEmpty(observaciones) ? DBNull.Value : (object)observaciones;

                    sqlCnn.Open();
                    return Convert.ToInt32(sqlCom.ExecuteScalar());
                }
            }
        }

        public void Modificar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarOrigenParticular", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;

                    sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id_origenParticular;
                    sqlCom.Parameters.Add("@nombre", SqlDbType.VarChar, 150).Value = nombre_origenParticular;
                    sqlCom.Parameters.Add("@tipo", SqlDbType.VarChar, 50).Value = tipo_origenParticular;
                    sqlCom.Parameters.Add("@observaciones", SqlDbType.VarChar, 255).Value = string.IsNullOrEmpty(observaciones) ? DBNull.Value : (object)observaciones;

                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        public void Borrar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_EliminarOrigenParticular", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id_origenParticular;
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

//namespace API_SITMAS.Models
//{
//    public class Origen_Particular
//    {
//        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

//        public int Id_origenParticular { get; set; }
//        public string nombre_origenParticular { get; set; }
//        public string tipo_origenParticular { get; set; }
//        public string observaciones { get; set; }

//        public List<Origen_Particular> SelectAll()
//        {
//            List<Origen_Particular> lista = new List<Origen_Particular>();
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_ListarOrigenParticular", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;
//                    sqlCnn.Open();
//                    using (SqlDataReader reader = sqlCom.ExecuteReader())
//                    {
//                        while (reader.Read())
//                        {
//                            lista.Add(new Origen_Particular
//                            {
//                                Id_origenParticular = Convert.ToInt32(reader["Id_origenParticular"]),
//                                nombre_origenParticular = reader["nombre_origenParticular"].ToString(),
//                                tipo_origenParticular = reader["tipo_origenParticular"].ToString(),
//                                observaciones = reader["observaciones"] != DBNull.Value ? reader["observaciones"].ToString() : string.Empty
//                            });
//                        }
//                    }
//                }
//            }
//            return lista;
//        }

//        public int Insertar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_InsertarOrigenParticular", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;
//                    sqlCom.Parameters.AddWithValue("@nombre", nombre_origenParticular);
//                    sqlCom.Parameters.AddWithValue("@tipo", tipo_origenParticular);
//                    sqlCom.Parameters.AddWithValue("@observaciones", string.IsNullOrEmpty(observaciones) ? DBNull.Value : (object)observaciones);

//                    sqlCnn.Open();
//                    return Convert.ToInt32(sqlCom.ExecuteScalar()); 
//                }
//            }
//        }

//        public void Modificar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarOrigenParticular", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;
//                    sqlCom.Parameters.AddWithValue("@Id", Id_origenParticular);
//                    sqlCom.Parameters.AddWithValue("@nombre", nombre_origenParticular);
//                    sqlCom.Parameters.AddWithValue("@tipo", tipo_origenParticular);
//                    sqlCom.Parameters.AddWithValue("@observaciones", string.IsNullOrEmpty(observaciones) ? DBNull.Value : (object)observaciones);

//                    sqlCnn.Open();
//                    sqlCom.ExecuteNonQuery();
//                }
//            }
//        }

//        public void Borrar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_EliminarOrigenParticular", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;
//                    sqlCom.Parameters.AddWithValue("@Id", Id_origenParticular);
//                    sqlCnn.Open();
//                    sqlCom.ExecuteNonQuery();
//                }
//            }
//        }
//    }
//}