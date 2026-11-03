using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class IngresoMaterial_Particular
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public int Id_ingresoParticular { get; set; }
        public DateTime fecha_ingresoParticular { get; set; }
        public int Id_origenParticular { get; set; }
        public int? Id_Vehiculo { get; set; }
        public int Id_Usuario_Registro { get; set; }
        public string observaciones { get; set; }
        public string estadoIngresoParticular { get; set; }

        public string nombre_origenParticular { get; set; }
        public string tipo_origenParticular { get; set; }
        public string Patente { get; set; }
        public string UsuarioRegistro { get; set; }

        public List<IngresoMaterial_Particular> SelectAll()
        {
            List<IngresoMaterial_Particular> lista = new List<IngresoMaterial_Particular>();
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ListarIngresosParticulares", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new IngresoMaterial_Particular
                            {
                                Id_ingresoParticular = Convert.ToInt32(reader["Id_ingresoParticular"]),
                                fecha_ingresoParticular = Convert.ToDateTime(reader["fecha_ingresoParticular"]),
                                Id_origenParticular = Convert.ToInt32(reader["Id_origenParticular"]),
                                nombre_origenParticular = reader["nombre_origenParticular"].ToString(),
                                tipo_origenParticular = reader["tipo_origenParticular"].ToString(),
                                Id_Vehiculo = reader["Id_Vehiculo"] != DBNull.Value ? Convert.ToInt32(reader["Id_Vehiculo"]) : (int?)null,
                                Patente = reader["Patente"] != DBNull.Value ? reader["Patente"].ToString() : "Sin Vehículo",
                                Id_Usuario_Registro = Convert.ToInt32(reader["Id_Usuario_Registro"]),
                                UsuarioRegistro = reader["UsuarioRegistro"].ToString(),
                                observaciones = reader["observaciones"] != DBNull.Value ? reader["observaciones"].ToString() : string.Empty,
                                estadoIngresoParticular = reader["estadoIngresoParticular"].ToString()
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
                using (SqlCommand sqlCom = new SqlCommand("sp_InsertarIngresoParticular", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;

                    // CORRECCIÓN: Definición explícita de tipos de datos para proteger los DBNull
                    sqlCom.Parameters.Add("@fecha", SqlDbType.Date).Value = fecha_ingresoParticular;
                    sqlCom.Parameters.Add("@idOrigen", SqlDbType.Int).Value = Id_origenParticular;
                    sqlCom.Parameters.Add("@idVehiculo", SqlDbType.Int).Value = Id_Vehiculo.HasValue ? (object)Id_Vehiculo.Value : DBNull.Value;
                    sqlCom.Parameters.Add("@idUsuario", SqlDbType.Int).Value = Id_Usuario_Registro;
                    sqlCom.Parameters.Add("@observaciones", SqlDbType.VarChar).Value = string.IsNullOrEmpty(observaciones) ? DBNull.Value : (object)observaciones;

                    sqlCnn.Open();
                    return Convert.ToInt32(sqlCom.ExecuteScalar());
                }
            }
        }

        public void Modificar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarIngresoParticular", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;

                    sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id_ingresoParticular;
                    sqlCom.Parameters.Add("@fecha", SqlDbType.Date).Value = fecha_ingresoParticular;
                    sqlCom.Parameters.Add("@idOrigen", SqlDbType.Int).Value = Id_origenParticular;
                    sqlCom.Parameters.Add("@idVehiculo", SqlDbType.Int).Value = Id_Vehiculo.HasValue ? (object)Id_Vehiculo.Value : DBNull.Value;
                    sqlCom.Parameters.Add("@observaciones", SqlDbType.VarChar).Value = string.IsNullOrEmpty(observaciones) ? DBNull.Value : (object)observaciones;

                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        public void BorrarLogico()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_EliminarIngresoParticular", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id_ingresoParticular;
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
//    public class IngresoMaterial_Particular
//    {
//        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

//        public int Id_ingresoParticular { get; set; }
//        public DateTime fecha_ingresoParticular { get; set; }
//        public int Id_origenParticular { get; set; }
//        public int? Id_Vehiculo { get; set; } 
//        public int Id_Usuario_Registro { get; set; }
//        public string observaciones { get; set; }
//        public string estadoIngresoParticular { get; set; }

//        // Propiedades para Joins
//        public string nombre_origenParticular { get; set; }
//        public string tipo_origenParticular { get; set; }
//        public string Patente { get; set; }
//        public string UsuarioRegistro { get; set; }

//        public List<IngresoMaterial_Particular> SelectAll()
//        {
//            List<IngresoMaterial_Particular> lista = new List<IngresoMaterial_Particular>();
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_ListarIngresosParticulares", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;
//                    sqlCnn.Open();
//                    using (SqlDataReader reader = sqlCom.ExecuteReader())
//                    {
//                        while (reader.Read())
//                        {
//                            lista.Add(new IngresoMaterial_Particular
//                            {
//                                Id_ingresoParticular = Convert.ToInt32(reader["Id_ingresoParticular"]),
//                                fecha_ingresoParticular = Convert.ToDateTime(reader["fecha_ingresoParticular"]),
//                                Id_origenParticular = Convert.ToInt32(reader["Id_origenParticular"]),
//                                nombre_origenParticular = reader["nombre_origenParticular"].ToString(),
//                                tipo_origenParticular = reader["tipo_origenParticular"].ToString(),
//                                Id_Vehiculo = reader["Id_Vehiculo"] != DBNull.Value ? Convert.ToInt32(reader["Id_Vehiculo"]) : (int?)null,
//                                Patente = reader["Patente"] != DBNull.Value ? reader["Patente"].ToString() : "Sin Vehículo",
//                                Id_Usuario_Registro = Convert.ToInt32(reader["Id_Usuario_Registro"]),
//                                UsuarioRegistro = reader["UsuarioRegistro"].ToString(),
//                                observaciones = reader["observaciones"] != DBNull.Value ? reader["observaciones"].ToString() : string.Empty,
//                                estadoIngresoParticular = reader["estadoIngresoParticular"].ToString()
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
//                using (SqlCommand sqlCom = new SqlCommand("sp_InsertarIngresoParticular", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;
//                    sqlCom.Parameters.AddWithValue("@fecha", fecha_ingresoParticular);
//                    sqlCom.Parameters.AddWithValue("@idOrigen", Id_origenParticular);
//                    sqlCom.Parameters.AddWithValue("@idVehiculo", Id_Vehiculo.HasValue ? (object)Id_Vehiculo.Value : DBNull.Value);
//                    sqlCom.Parameters.AddWithValue("@idUsuario", Id_Usuario_Registro);
//                    sqlCom.Parameters.AddWithValue("@observaciones", string.IsNullOrEmpty(observaciones) ? DBNull.Value : (object)observaciones);

//                    sqlCnn.Open();
//                    return Convert.ToInt32(sqlCom.ExecuteScalar()); // Id para insert en detalles
//                }
//            }
//        }

//        public void Modificar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarIngresoParticular", sqlCnn))
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;
//                    sqlCom.Parameters.AddWithValue("@Id", Id_ingresoParticular);
//                    sqlCom.Parameters.AddWithValue("@fecha", fecha_ingresoParticular);
//                    sqlCom.Parameters.AddWithValue("@idOrigen", Id_origenParticular);
//                    sqlCom.Parameters.AddWithValue("@idVehiculo", Id_Vehiculo.HasValue ? (object)Id_Vehiculo.Value : DBNull.Value);
//                    sqlCom.Parameters.AddWithValue("@observaciones", string.IsNullOrEmpty(observaciones) ? DBNull.Value : (object)observaciones);

//                    sqlCnn.Open();
//                    sqlCom.ExecuteNonQuery();
//                }
//            }
//        }

//        public void BorrarLogico()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            {
//                using (SqlCommand sqlCom = new SqlCommand("sp_EliminarIngresoParticular", sqlCnn)) // borrado lógico
//                {
//                    sqlCom.CommandType = CommandType.StoredProcedure;
//                    sqlCom.Parameters.AddWithValue("@Id", Id_ingresoParticular);
//                    sqlCnn.Open();
//                    sqlCom.ExecuteNonQuery();
//                }
//            }
//        }
//    }
//}