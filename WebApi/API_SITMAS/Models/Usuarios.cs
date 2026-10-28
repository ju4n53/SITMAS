using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    // ==========================================
    // 1. DTOs (Contenedores de transferencia)
    // ==========================================

    public class UsuarioRespuestaDTO
    {
        public int Id { get; set; }
        public string Usuario { get; set; }
        public int Id_Empleado { get; set; }
        public string NombreEmpleado { get; set; }
        public int Id_Estado_Usuario { get; set; }
        public string EstadoUsuario { get; set; }
        public int? Id_Rol { get; set; }
        public string NombreRol { get; set; }
    }

    public class UsuarioRequestDTO
    {
        public int Id { get; set; }
        public string Usuario { get; set; }
        public string Password { get; set; }
        public int Id_Empleado { get; set; }
        public int Id_Estado_Usuario { get; set; }
    }

    public class LoginRequestDTO
    {
        public string Usuario { get; set; }
        public string Password { get; set; }
    }

    public class LoginResponseDTO
    {
        public int IdUsuario { get; set; }
        public string IdEmpleado { get; set; }
        public string NombreMostrar { get; set; }
        public string RolAsignado { get; set; }
        public List<string> Permisos { get; set; }
    }

    // ==========================================
    // 2. CAPA DE ACCESO A DATOS (DAL)
    // ==========================================
    public class UsuarioDatos
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public List<UsuarioRespuestaDTO> SelectAll()
        {
            var lista = new List<UsuarioRespuestaDTO>();
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ListarUsuarios", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new UsuarioRespuestaDTO
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                Usuario = reader["Usuario"].ToString(),
                                Id_Empleado = Convert.ToInt32(reader["Id_Empleado"]),
                                NombreEmpleado = reader["NombreEmpleado"].ToString(),
                                Id_Estado_Usuario = Convert.ToInt32(reader["Id_Estado_Usuario"]),
                                EstadoUsuario = reader["EstadoUsuario"].ToString(),
                                Id_Rol = reader["Id_Rol"] != DBNull.Value ? (int?)Convert.ToInt32(reader["Id_Rol"]) : null,
                                NombreRol = reader["NombreRol"].ToString()
                            });
                        }
                    }
                }
            }
            return lista;
        }

        public int Insertar(UsuarioRequestDTO modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                // Usamos sp_InsertarUsuario que definimos en la DB
                using (SqlCommand sqlCom = new SqlCommand("sp_InsertarUsuario", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@User", modelo.Usuario);
                    sqlCom.Parameters.AddWithValue("@Pass", modelo.Password);
                    sqlCom.Parameters.AddWithValue("@IdEmpleado", modelo.Id_Empleado);
                    sqlCom.Parameters.AddWithValue("@Estado", modelo.Id_Estado_Usuario);

                    sqlCnn.Open();
                    return Convert.ToInt32(sqlCom.ExecuteScalar());
                }
            }
        }

        public void Modificar(UsuarioRequestDTO modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarUsuario", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id", modelo.Id);
                    sqlCom.Parameters.AddWithValue("@NuevoUser", modelo.Usuario);
                    sqlCom.Parameters.AddWithValue("@IdEstado", modelo.Id_Estado_Usuario);

                    // Si Password está vacío, enviamos DBNull para no alterar el Hash actual
                    if (string.IsNullOrWhiteSpace(modelo.Password))
                        sqlCom.Parameters.AddWithValue("@NuevaPass", DBNull.Value);
                    else
                        sqlCom.Parameters.AddWithValue("@NuevaPass", modelo.Password);

                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        public void Borrar(int id)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_EliminarUsuario", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id", id);
                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        // ==========================================
        // MÉTODOS DE AUTENTICACIÓN
        // ==========================================

        public LoginResponseDTO ProcesarLogin(string usuario, string password)
        {
            LoginResponseDTO response = null;

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                // 1. Validamos credenciales usando tu SP original
                using (SqlCommand sqlCom = new SqlCommand("sp_Login", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@User", usuario);
                    sqlCom.Parameters.AddWithValue("@Pass", password);

                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            response = new LoginResponseDTO
                            {
                                IdUsuario = Convert.ToInt32(reader["Id_Usuario"]),
                                IdEmpleado = reader["Id_Empleado"].ToString(),
                                NombreMostrar = reader["Usuario"].ToString()
                            };
                        }
                    }
                }

                // Si las credenciales fueron correctas, enriquecemos el objeto
                if (response != null)
                {
                    response.Permisos = ObtenerPermisos(response.IdUsuario, sqlCnn);
                    var roles = ObtenerRoles(response.IdUsuario, sqlCnn);
                    response.RolAsignado = roles.Count > 0 ? string.Join(", ", roles) : "Sin Rol";
                    response.NombreMostrar = ObtenerNombreEmpleado(response.IdEmpleado, sqlCnn) ?? response.NombreMostrar;
                }
            }

            return response;
        }

        private List<string> ObtenerPermisos(int idUsuario, SqlConnection conn)
        {
            List<string> listaPermisos = new List<string>();
            using (SqlCommand cmd = new SqlCommand("sp_ObtenerPermisosUsuario", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@IdUsuario", idUsuario);
                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                        listaPermisos.Add(dr["PermisoUsuario"].ToString());
                }
            }
            return listaPermisos;
        }

        private List<string> ObtenerRoles(int idUsuario, SqlConnection conn)
        {
            List<string> listaRoles = new List<string>();
            string query = @"SELECT R.NombreRol FROM Usuario_Rol UR INNER JOIN Rol R ON UR.Id_Rol = R.Id WHERE UR.Id_Usuario = @IdUsuario";
            using (SqlCommand cmd = new SqlCommand(query, conn))
            {
                cmd.Parameters.AddWithValue("@IdUsuario", idUsuario);
                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                        listaRoles.Add(dr["NombreRol"].ToString());
                }
            }
            return listaRoles;
        }

        private string ObtenerNombreEmpleado(string idEmpleado, SqlConnection conn)
        {
            string query = "SELECT Nombre, Apellido FROM Empleado WHERE Id = @Id";
            using (SqlCommand cmd = new SqlCommand(query, conn))
            {
                cmd.Parameters.AddWithValue("@Id", idEmpleado);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                        return $"{reader["Nombre"]} {reader["Apellido"]}";
                }
            }
            return null;
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
//    public class Usuarios
//    {

//        #region Atributos

//        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;


//        //string conectionString = @"Data Source=DESKTOP-N824T94;Initial Catalog=Gestion_SITMAS; Integrated Security= True ";

//        #endregion

//        #region Propìedades

//        public int Id { get; set; }

//        public string Usuario { get; set; }

//        public string Password { get; set; }

//        public int Id_Empleado { get; set; }

//        public int Id_Estado_Usuario { get; set; }




//        #endregion


//        #region Metodos

//        public DataTable SelectAll()
//        {


//            string sqlSentencia = "sp_ListarUsuarios";


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

//        public DataTable SelectId()
//        {


//            string sqlSentencia = "sp_ListarUsuarioId";


//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;


//            sqlCnn.Open();

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;
//            sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;

//            DataSet ds = new DataSet();

//            SqlDataAdapter da = new SqlDataAdapter();
//            da.SelectCommand = sqlCom;
//            da.Fill(ds);

//            sqlCnn.Close();

//            return ds.Tables[0];


//        }


//        public void Insertar()
//        {

//            string sqlSentencia = "sp_CrearUsuario";


//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;


//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@User", SqlDbType.NVarChar).Value = Usuario;
//            sqlCom.Parameters.Add("@Pass", SqlDbType.NVarChar).Value = Password;
//            sqlCom.Parameters.Add("@IdEmpleado", SqlDbType.Int).Value = Id_Empleado;
//            sqlCom.Parameters.Add("@Estado", SqlDbType.Int).Value = Id_Estado_Usuario;

//            sqlCnn.Open();


//            var res = sqlCom.ExecuteNonQuery();


//            sqlCnn.Close();


//        }

//        public void Modificar()
//        {
//            string sqlSentencia = "sp_ActualizarUsuario";

//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                // Parámetros básicos
//                sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;
//                sqlCom.Parameters.Add("@NuevoUser", SqlDbType.NVarChar).Value = Usuario;
//                sqlCom.Parameters.Add("@IdEstado", SqlDbType.Int).Value = Id_Estado_Usuario;

//                // LÓGICA PARA LA CONTRASEÑA
//                // Si el string Password está vacío o es null, enviamos DBNull.Value
//                // para que el Stored Procedure use su valor por defecto (NULL) y no cambie la clave.
//                if (string.IsNullOrEmpty(Password))
//                {
//                    sqlCom.Parameters.Add("@NuevaPass", SqlDbType.NVarChar).Value = DBNull.Value;
//                }
//                else
//                {
//                    sqlCom.Parameters.Add("@NuevaPass", SqlDbType.NVarChar).Value = Password;
//                }

//                sqlCnn.Open();
//                sqlCom.ExecuteNonQuery();
//                sqlCnn.Close();
//            }
//        }



//        //EL MÉTODO BORRAR EMPLEADO SE ENCUENTRA FUNCIONANDO, PERO ESTÁ DESACTIVADO (COMENTADO)

//        public void Borrar()
//        {

//            string sqlSentencia = "sp_EliminarUsuario";


//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;




//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;


//            sqlCnn.Open();


//            var res = sqlCom.ExecuteNonQuery();


//            sqlCnn.Close();


//        }

//        public DataTable Validar()
//        {
//            // Nombre exacto de tu SP según la captura
//            string sqlSentencia = "sp_Login"; 

//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                // Parámetros idénticos a los del SP (@User y @Pass)
//                sqlCom.Parameters.Add("@User", SqlDbType.VarChar, 100).Value = Usuario;
//                sqlCom.Parameters.Add("@Pass", SqlDbType.VarChar, 100).Value = Password;

//                DataSet ds = new DataSet();
//                SqlDataAdapter da = new SqlDataAdapter(sqlCom);

//                try {
//                    sqlCnn.Open();
//                    da.Fill(ds);
//                    return ds.Tables[0];
//                } catch (Exception ex) {
//                    throw new Exception("Error en DB: " + ex.Message);
//                } finally {
//                    sqlCnn.Close();
//                }
//            }
//       }


//        public List<string> ObtenerPermisos(int idUsuario)
//        {
//            List<string> listaPermisos = new List<string>();

//            using (SqlConnection conn = new SqlConnection(conectionString))
//            {
//                using (SqlCommand cmd = new SqlCommand("sp_ObtenerPermisosUsuario", conn))
//                {
//                    cmd.CommandType = CommandType.StoredProcedure;
//                    cmd.Parameters.AddWithValue("@IdUsuario", idUsuario);

//                    try
//                    {
//                        conn.Open();
//                        // 1. Ejecutamos el procedimiento y guardamos el resultado en el contenedor 'dr'
//                        using (SqlDataReader dr = cmd.ExecuteReader())
//                        {
//                            // 2. Mientras el lector encuentre filas, avanzamos
//                            while (dr.Read())
//                            {
//                                // 3. Agregamos el texto de la columna (ojo que coincida con tu SELECT del SP)
//                                listaPermisos.Add(dr["PermisoUsuario"].ToString());
//                            }
//                        }
//                    }
//                    catch (Exception ex)
//                    {
//                        throw new Exception("Error al obtener permisos en la DB: " + ex.Message);
//                    }
//                }
//            }
//            return listaPermisos;
//        }

//        public List<string> ObtenerRoles(int idUsuario)
//        {
//            List<string> listaRoles = new List<string>();

//            using (SqlConnection conn = new SqlConnection(conectionString))
//            {
//                // Hacemos el INNER JOIN para traer el texto del rol
//                string query = @"
//            SELECT R.NombreRol 
//            FROM Usuario_Rol UR
//            INNER JOIN Rol R ON UR.Id_Rol = R.Id
//            WHERE UR.Id_Usuario = @IdUsuario";

//                using (SqlCommand cmd = new SqlCommand(query, conn))
//                {
//                    cmd.Parameters.AddWithValue("@IdUsuario", idUsuario);

//                    try
//                    {
//                        conn.Open();
//                        using (SqlDataReader dr = cmd.ExecuteReader())
//                        {
//                            while (dr.Read())
//                            {
//                                listaRoles.Add(dr["NombreRol"].ToString());
//                            }
//                        }
//                    }
//                    catch (Exception ex)
//                    {
//                        throw new Exception("Error al obtener roles en la DB: " + ex.Message);
//                    }
//                }
//            }
//            return listaRoles;
//        }

//        #endregion

//    }
//}