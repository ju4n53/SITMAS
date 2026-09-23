using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class EmpresaOrigen
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        #region Propiedades de la Entidad

        public int IdOrigen { get; set; }
        public string EmpresaInstitucion { get; set; }
        public string CalleEI { get; set; }
        public string NumeroEI { get; set; }
        public string TelefonoEI { get; set; }
        public string EmailEI { get; set; }
        public int Id_Barrio { get; set; }

        // 🗺️ Nuevas Propiedades para Geolocalización
        public int? Id_Ubicacion { get; set; }
        public decimal? Latitud { get; set; }
        public decimal? Longitud { get; set; }
        public string DescripcionUbicacion { get; set; }

        #endregion

        #region Métodos de Acceso a Datos

        /// <summary>
        /// Obtiene todas las empresas/instituciones registradas con sus respectivas coordenadas si las poseen.
        /// </summary>
        public List<EmpresaOrigen> ObtenerTodos()
        {
            var lista = new List<EmpresaOrigen>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarOrigen", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCnn.Open();
                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new EmpresaOrigen
                        {
                            IdOrigen = Convert.ToInt32(reader["IdOrigen"]),
                            EmpresaInstitucion = reader["EmpresaInstitucion"] != DBNull.Value ? reader["EmpresaInstitucion"].ToString() : string.Empty,
                            CalleEI = reader["CalleEI"] != DBNull.Value ? reader["CalleEI"].ToString() : string.Empty,
                            NumeroEI = reader["NumeroEI"] != DBNull.Value ? reader["NumeroEI"].ToString() : string.Empty,
                            TelefonoEI = reader["TelefonoEI"] != DBNull.Value ? reader["TelefonoEI"].ToString() : string.Empty,
                            EmailEI = reader["EmailEI"] != DBNull.Value ? reader["EmailEI"].ToString() : string.Empty,
                            Id_Barrio = reader["Id_Barrio"] != DBNull.Value ? Convert.ToInt32(reader["Id_Barrio"]) : 0,

                            // Mapeo opcional de la ubicación geográfica
                            Id_Ubicacion = reader["Id_Ubicacion"] != DBNull.Value ? Convert.ToInt32(reader["Id_Ubicacion"]) : (int?)null,
                            Latitud = reader["Latitud"] != DBNull.Value ? Convert.ToDecimal(reader["Latitud"]) : (decimal?)null,
                            Longitud = reader["Longitud"] != DBNull.Value ? Convert.ToDecimal(reader["Longitud"]) : (decimal?)null,
                            DescripcionUbicacion = reader["DescripcionUbicacion"] != DBNull.Value ? reader["DescripcionUbicacion"].ToString() : string.Empty
                        });
                    }
                }
            }

            return lista;
        }

        /// <summary>
        /// Inserta un nuevo registro de Origen y devuelve el IdOrigen autogenerado.
        /// </summary>
        public int Insertar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_InsertarOrigen", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@EmpresaInstitucion", EmpresaInstitucion);
                sqlCom.Parameters.AddWithValue("@CalleEI", CalleEI);
                sqlCom.Parameters.AddWithValue("@NumeroEI", NumeroEI ?? string.Empty);
                sqlCom.Parameters.AddWithValue("@TelefonoEI", TelefonoEI ?? string.Empty);
                sqlCom.Parameters.AddWithValue("@EmailEI", EmailEI ?? string.Empty);
                sqlCom.Parameters.AddWithValue("@Id_Barrio", Id_Barrio);
                sqlCom.Parameters.AddWithValue("@Id_Ubicacion", Id_Ubicacion > 0 ? (object)Id_Ubicacion : DBNull.Value);

                sqlCnn.Open();
                return Convert.ToInt32(sqlCom.ExecuteScalar());
            }
        }

        /// <summary>
        /// Actualiza la información de una empresa/institución existente.
        /// </summary>
        public bool Modificar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarOrigen", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@IdOrigen", IdOrigen);
                sqlCom.Parameters.AddWithValue("@EmpresaInstitucion", EmpresaInstitucion);
                sqlCom.Parameters.AddWithValue("@CalleEI", CalleEI);
                sqlCom.Parameters.AddWithValue("@NumeroEI", NumeroEI ?? string.Empty);
                sqlCom.Parameters.AddWithValue("@TelefonoEI", TelefonoEI ?? string.Empty);
                sqlCom.Parameters.AddWithValue("@EmailEI", EmailEI ?? string.Empty);
                sqlCom.Parameters.AddWithValue("@Id_Barrio", Id_Barrio);
                sqlCom.Parameters.AddWithValue("@Id_Ubicacion", Id_Ubicacion > 0 ? (object)Id_Ubicacion : DBNull.Value);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        /// <summary>
        /// Elimina físicamente un registro de Origen de la base de datos.
        /// </summary>
        public bool Borrar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_EliminarOrigen", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@IdOrigen", IdOrigen);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        #endregion
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
//    public class EmpresaOrigen
//    {
//        #region Atributos

//        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

//        #endregion

//        #region Propìedades

//        public int IdOrigen { get; set; }
//        public string EmpresaInstitucion { get; set; }
//        public string CalleEI { get; set; }
//        public string NumeroEI { get; set; }
//        public string TelefonoEI { get; set; }
//        public string EmailEI { get; set; }
//        public int Id_Barrio { get; set; }


//        #endregion

//        #region Metodos

//        public DataTable SelectAll()
//        {


//            string sqlSentencia = "sp_ListarOrigen";

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

//        //public DataTable SelectId()
//        //{


//        //    string sqlSentencia = "sp_VerEmpleadoId";

//        //    SqlConnection sqlCnn = new SqlConnection();
//        //    sqlCnn.ConnectionString = conectionString;


//        //    sqlCnn.Open();

//        //    SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//        //    sqlCom.CommandType = CommandType.StoredProcedure;
//        //    sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;

//        //    DataSet ds = new DataSet();

//        //    SqlDataAdapter da = new SqlDataAdapter();
//        //    da.SelectCommand = sqlCom;
//        //    da.Fill(ds);

//        //    sqlCnn.Close();

//        //    return ds.Tables[0];

//        //}

//        public void Insertar()
//        {

//            string sqlSentencia = "sp_InsertarOrigen";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@EmpresaInstitucion", SqlDbType.NVarChar).Value = EmpresaInstitucion;
//            sqlCom.Parameters.Add("@CalleEI", SqlDbType.NVarChar).Value = CalleEI;
//            sqlCom.Parameters.Add("@NumeroEI", SqlDbType.NVarChar).Value = NumeroEI;
//            sqlCom.Parameters.Add("@TelefonoEI", SqlDbType.NVarChar).Value = TelefonoEI;
//            sqlCom.Parameters.Add("@EmailEI", SqlDbType.NVarChar).Value = EmailEI;
//            sqlCom.Parameters.Add("@Id_Barrio", SqlDbType.Int).Value = Id_Barrio;


//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();

//        }


//        public void Modificar()
//        {


//            string sqlSentencia = "sp_ActualizarOrigen";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = IdOrigen;
//            sqlCom.Parameters.Add("@EmpresaInstitucion", SqlDbType.NVarChar).Value = EmpresaInstitucion;
//            sqlCom.Parameters.Add("@CalleEI", SqlDbType.NVarChar).Value = CalleEI;
//            sqlCom.Parameters.Add("@NumeroEI", SqlDbType.NVarChar).Value = NumeroEI;
//            sqlCom.Parameters.Add("@TelefonoEI", SqlDbType.NVarChar).Value = TelefonoEI;
//            sqlCom.Parameters.Add("@EmailEI", SqlDbType.NVarChar).Value = EmailEI;
//                        sqlCom.Parameters.Add("@Id_Barrio", SqlDbType.Int).Value = Id_Barrio;

//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();

//        }


//        //EL MÉTODO BORRAR EMPLEADO SE ENCUENTRA FUNCIONANDO, PERO ESTÁ DESACTIVADO (COMENTADO)

//        public void Borrar()
//        {

//            string sqlSentencia = "sp_EliminarOrigen";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;


//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = IdOrigen;

//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();


//        }


//        //public DataTable VistalistadoEmpleados()
//        //{

//        //    string sqlSentencia = "sp_ListarEmpleadosDetallados";

//        //    SqlConnection sqlCnn = new SqlConnection();
//        //    sqlCnn.ConnectionString = conectionString;

//        //    sqlCnn.Open();

//        //    SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//        //    sqlCom.CommandType = CommandType.StoredProcedure;

//        //    DataSet ds = new DataSet();

//        //    SqlDataAdapter da = new SqlDataAdapter();
//        //    da.SelectCommand = sqlCom;
//        //    da.Fill(ds);

//        //    sqlCnn.Close();

//        //    return ds.Tables[0];

//        //}

//        #endregion
//    }
//}