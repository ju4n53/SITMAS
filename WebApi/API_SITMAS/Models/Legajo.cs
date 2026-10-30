using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class Legajo
    {
        public int Id_Legajo { get; set; }
        public string Numero_Legajo { get; set; }
        public bool Estado_Legajo { get; set; }
        public int Id_Empleado { get; set; }
        public string NombreEmpleado { get; set; }
        public int Id_Tipo_Vinculacion { get; set; }
        public string TipoVinculacion { get; set; }
    }

    public class LegajoDatos
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public List<Legajo> SelectAll()
        {
            var lista = new List<Legajo>();
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ListarLegajos", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new Legajo
                            {
                                Id_Legajo = Convert.ToInt32(reader["Id_Legajo"]),
                                Numero_Legajo = reader["Numero_Legajo"].ToString(),
                                Estado_Legajo = Convert.ToBoolean(reader["Estado_Legajo"]),
                                Id_Empleado = Convert.ToInt32(reader["Id_Empleado"]),
                                NombreEmpleado = reader["NombreEmpleado"].ToString(),
                                Id_Tipo_Vinculacion = Convert.ToInt32(reader["Id_Tipo_Vinculacion"]),
                                TipoVinculacion = reader["TipoVinculacion"].ToString()
                            });
                        }
                    }
                }
            }
            return lista;
        }

        public Legajo ObtenerPorEmpleado(int idEmpleado)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ObtenerLegajoPorEmpleado", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id_Empleado", idEmpleado);
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return new Legajo
                            {
                                Id_Legajo = Convert.ToInt32(reader["Id_Legajo"]),
                                Numero_Legajo = reader["Numero_Legajo"].ToString(),
                                Estado_Legajo = Convert.ToBoolean(reader["Estado_Legajo"]),
                                Id_Empleado = Convert.ToInt32(reader["Id_Empleado"]),
                                Id_Tipo_Vinculacion = Convert.ToInt32(reader["Id_Tipo_Vinculacion"]),
                                TipoVinculacion = reader["TipoVinculacion"].ToString()
                            };
                        }
                    }
                }
            }
            return null;
        }

        public int Insertar(Legajo modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_InsertarLegajo", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Numero_Legajo", modelo.Numero_Legajo);
                    sqlCom.Parameters.AddWithValue("@Id_Empleado", modelo.Id_Empleado);
                    sqlCom.Parameters.AddWithValue("@Id_Tipo_Vinculacion", modelo.Id_Tipo_Vinculacion);
                    sqlCnn.Open();
                    return Convert.ToInt32(sqlCom.ExecuteScalar());
                }
            }
        }

        public void Modificar(Legajo modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarLegajo", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id_Legajo", modelo.Id_Legajo);
                    sqlCom.Parameters.AddWithValue("@Numero_Legajo", modelo.Numero_Legajo);
                    sqlCom.Parameters.AddWithValue("@Estado_Legajo", modelo.Estado_Legajo);
                    sqlCom.Parameters.AddWithValue("@Id_Tipo_Vinculacion", modelo.Id_Tipo_Vinculacion);
                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        public void Anular(int idLegajo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_AnularLegajo", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id_Legajo", idLegajo);
                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }
    }
}