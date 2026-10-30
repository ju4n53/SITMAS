using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class RolPermisoDTO
    {
        public int Id_Rol { get; set; }
        public string NombreRol { get; set; }
        public int Id_Permiso { get; set; }
        public string PermisoUsuario { get; set; }
    }

    public class RolPermisoDatos
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        // Lee directamente la vista respaldada por el SP sp_ListarRol_Permiso
        public List<RolPermisoDTO> ListarRelaciones()
        {
            var lista = new List<RolPermisoDTO>();
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ListarRol_Permiso", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new RolPermisoDTO
                            {
                                Id_Rol = Convert.ToInt32(reader["Id_Rol"]),
                                NombreRol = reader["NombreRol"].ToString(),
                                Id_Permiso = Convert.ToInt32(reader["Id_Permiso"]),
                                PermisoUsuario = reader["PermisoUsuario"].ToString()
                            });
                        }
                    }
                }
            }
            return lista;
        }

        public void AsignarPermisoARol(int idRol, int idPermiso)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_AsignarPermiso_Rol", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id_Rol", idRol);
                    sqlCom.Parameters.AddWithValue("@Id_Permiso", idPermiso);
                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        public void EliminarPermisoDeRol(int idRol, int idPermiso)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_EliminarRol_Permiso", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id_Rol", idRol);
                    sqlCom.Parameters.AddWithValue("@Id_Permiso", idPermiso);
                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }
    }
}