using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class RolDTO
    {
        public int Id { get; set; }
        public string NombreRol { get; set; }
    }

    public class RolDatos
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public List<RolDTO> SelectAll()
        {
            var lista = new List<RolDTO>();
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ListarRol", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new RolDTO
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                NombreRol = reader["NombreRol"].ToString()
                            });
                        }
                    }
                }
            }
            return lista;
        }

        public int Insertar(RolDTO modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_InsertarRol", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@NombreRol", modelo.NombreRol);
                    sqlCnn.Open();
                    return Convert.ToInt32(sqlCom.ExecuteScalar());
                }
            }
        }

        public void Modificar(RolDTO modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarRol", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id", modelo.Id);
                    sqlCom.Parameters.AddWithValue("@NombreRol", modelo.NombreRol);
                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        public void Borrar(int id)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_EliminarRol", sqlCnn))
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