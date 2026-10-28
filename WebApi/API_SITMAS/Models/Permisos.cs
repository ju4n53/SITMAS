using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class PermisoDTO
    {
        public int Id { get; set; }
        public string PermisoUsuario { get; set; }
    }

    public class PermisoDatos
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public List<PermisoDTO> SelectAll()
        {
            var lista = new List<PermisoDTO>();
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ListarPermiso", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new PermisoDTO
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                PermisoUsuario = reader["PermisoUsuario"].ToString()
                            });
                        }
                    }
                }
            }
            return lista;
        }

        public int Insertar(PermisoDTO modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_InsertarPermiso", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@PermisoUsuario", modelo.PermisoUsuario);
                    sqlCnn.Open();
                    return Convert.ToInt32(sqlCom.ExecuteScalar());
                }
            }
        }

        public void Modificar(PermisoDTO modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarPermiso", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id", modelo.Id);
                    sqlCom.Parameters.AddWithValue("@PermisoUsuario", modelo.PermisoUsuario);
                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        public void Borrar(int id)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_EliminarPermiso", sqlCnn))
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