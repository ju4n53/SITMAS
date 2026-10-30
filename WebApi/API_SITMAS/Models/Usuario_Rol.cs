using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    // ==========================================
    // 1. DTOs (Contenedores)
    // ==========================================
    public class UsuarioRolDTO
    {
        public int Id { get; set; }
        public int Id_Usuario { get; set; }
        public int Id_Rol { get; set; }
    }

    public class AsignarRolDTO
    {
        public int Id_Usuario { get; set; }
        public int Id_Rol { get; set; }
    }

    // ==========================================
    // 2. CAPA DE ACCESO A DATOS (DAL)
    // ==========================================
    public class UsuarioRolDatos
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public List<UsuarioRolDTO> SelectAll()
        {
            var lista = new List<UsuarioRolDTO>();
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ListarUsuario_Rol", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new UsuarioRolDTO
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                Id_Usuario = Convert.ToInt32(reader["Id_Usuario"]),
                                Id_Rol = Convert.ToInt32(reader["Id_Rol"])
                            });
                        }
                    }
                }
            }
            return lista;
        }

        public int Insertar(UsuarioRolDTO modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_InsertarUsuario_Rol", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id_Usuario", modelo.Id_Usuario);
                    sqlCom.Parameters.AddWithValue("@Id_Rol", modelo.Id_Rol);

                    sqlCnn.Open();
                    return Convert.ToInt32(sqlCom.ExecuteScalar()); // Retorna el ID generado
                }
            }
        }

        public void Modificar(UsuarioRolDTO modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarUsuario_Rol", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id", modelo.Id);
                    sqlCom.Parameters.AddWithValue("@Id_Usuario", modelo.Id_Usuario);
                    sqlCom.Parameters.AddWithValue("@Id_Rol", modelo.Id_Rol);

                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        // 🌟 NUEVO MÉTODO ESTRELLA: Asignación directa y limpia
        public void AsignarRolDirecto(int idUsuario, int idRol)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_AsignarRolAUsuario", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id_Usuario", idUsuario);
                    sqlCom.Parameters.AddWithValue("@Id_Rol", idRol);

                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        public void Borrar(int id)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_EliminarUsuario_Rol", sqlCnn))
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
//using System.Web.Helpers;

//namespace API_SITMAS.Models
//{
//    public class Usuario_Rol
//    {
//        #region Atributos

//        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

//        #endregion

//        #region Propìedades

//        public int Id { get; set; }
//        public int Id_Usuario { get; set; }
//        public int Id_Rol { get; set; }

//        #endregion

//        #region Metodos

//        public DataTable SelectAll()
//        {


//            string sqlSentencia = "sp_ListarUsuario_Rol";

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

//            string sqlSentencia = "sp_InsertarUsuario_Rol";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@Id_Usuario", SqlDbType.Int).Value = Id_Usuario;
//            sqlCom.Parameters.Add("@Id_Rol", SqlDbType.Int).Value = Id_Rol;

//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();

//        }


//        public void Modificar()
//        {


//            string sqlSentencia = "sp_ActualizarUsuario_Rol";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;
//            sqlCom.Parameters.Add("@Id_Usuario", SqlDbType.Int).Value = Id_Usuario;
//            sqlCom.Parameters.Add("@Id_Rol", SqlDbType.Int).Value = Id_Rol;

//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();

//        }


//        //EL MÉTODO BORRAR EMPLEADO SE ENCUENTRA FUNCIONANDO, PERO ESTÁ DESACTIVADO (COMENTADO)

//        public void Borrar()
//        {

//            string sqlSentencia = "sp_EliminarUsuario_Rol";

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