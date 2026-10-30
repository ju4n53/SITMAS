using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class Cargos
    {
        public int Id { get; set; }
        public string Cargo { get; set; }
    }

    public class CargoDatos
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public List<Cargos> SelectAll()
        {
            var lista = new List<Cargos>();
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ListarCargo", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCnn.Open();
                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new Cargos
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                Cargo = reader["Cargo"].ToString()
                            });
                        }
                    }
                }
            }
            return lista;
        }

        public int Insertar(Cargos modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_InsertarCargo", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Cargo", modelo.Cargo);
                    sqlCnn.Open();
                    return Convert.ToInt32(sqlCom.ExecuteScalar());
                }
            }
        }

        public void Modificar(Cargos modelo)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarCargo", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@Id", modelo.Id);
                    sqlCom.Parameters.AddWithValue("@Cargo", modelo.Cargo);
                    sqlCnn.Open();
                    sqlCom.ExecuteNonQuery();
                }
            }
        }

        public void Borrar(int id)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_EliminarCargo", sqlCnn))
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
//    public class Cargos
//    {
//        #region Atributos

//        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;


//        //string conectionString = @"Data Source=DESKTOP-N824T94;Initial Catalog=Gestion_SITMAS; Integrated Security= True ";

//        #endregion

//        #region Propìedades

//        public int Id { get; set; }
//        public string Cargo { get; set; }

//        #endregion

//        #region Metodos

//        public DataTable SelectAll()
//        {


//            string sqlSentencia = "sp_ListarCargo";

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

//            string sqlSentencia = "sp_InsertarCargo";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@Cargo", SqlDbType.NVarChar).Value = Cargo;

//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();

//        }


//        public void Modificar()
//        {


//            string sqlSentencia = "sp_ActualizarCargo";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;
//            sqlCom.Parameters.Add("@Cargo", SqlDbType.NVarChar).Value = Cargo;

//            sqlCnn.Open();

//            var res = sqlCom.ExecuteNonQuery();

//            sqlCnn.Close();

//        }


//        //EL MÉTODO BORRAR EMPLEADO SE ENCUENTRA FUNCIONANDO, PERO ESTÁ DESACTIVADO (COMENTADO)

//        public void Borrar()
//        {

//            string sqlSentencia = "sp_EliminarCargo";

//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;


//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;

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