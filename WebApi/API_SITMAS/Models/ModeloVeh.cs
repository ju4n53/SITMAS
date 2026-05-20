using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Helpers;

namespace API_SITMAS.Models
{
    public class ModeloVehi
    {
        #region Atributos

        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        #endregion

        #region Propìedades

        public int Id { get; set; }
        public string ModeloVehiculo { get; set; }
        public int Id_Marca { get; set; }

        #endregion

        #region Metodos

        public DataTable SelectAll()
        {


            string sqlSentencia = "sp_ListarModeloVeh";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;

            sqlCnn.Open();

            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            DataSet ds = new DataSet();

            SqlDataAdapter da = new SqlDataAdapter();
            da.SelectCommand = sqlCom;
            da.Fill(ds);

            sqlCnn.Close();

            return ds.Tables[0];

        }

        //public DataTable SelectId()
        //{


        //    string sqlSentencia = "sp_VerEmpleadoId";

        //    SqlConnection sqlCnn = new SqlConnection();
        //    sqlCnn.ConnectionString = conectionString;


        //    sqlCnn.Open();

        //    SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
        //    sqlCom.CommandType = CommandType.StoredProcedure;
        //    sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;

        //    DataSet ds = new DataSet();

        //    SqlDataAdapter da = new SqlDataAdapter();
        //    da.SelectCommand = sqlCom;
        //    da.Fill(ds);

        //    sqlCnn.Close();

        //    return ds.Tables[0];

        //}

        public void Insertar()
        {

            string sqlSentencia = "sp_InsertarModeloVeh";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;

            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@ModeloVehiculo", SqlDbType.NVarChar).Value = ModeloVehiculo;
            sqlCom.Parameters.Add("@Id_Marca", SqlDbType.Int).Value = Id_Marca;

            sqlCnn.Open();

            var res = sqlCom.ExecuteNonQuery();

            sqlCnn.Close();

        }


        public void Modificar()
        {


            string sqlSentencia = "sp_ActualizarModeloVeh";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;

            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;
            sqlCom.Parameters.Add("@ModeloVehiculo", SqlDbType.NVarChar).Value = ModeloVehiculo;
            sqlCom.Parameters.Add("@Id_Marca", SqlDbType.Int).Value = Id_Marca;

            sqlCnn.Open();

            var res = sqlCom.ExecuteNonQuery();

            sqlCnn.Close();

        }


        //EL MÉTODO BORRAR EMPLEADO SE ENCUENTRA FUNCIONANDO, PERO ESTÁ DESACTIVADO (COMENTADO)

        public void Borrar()
        {

            string sqlSentencia = "sp_EliminarModeloVeh";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;


            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;

            sqlCnn.Open();

            var res = sqlCom.ExecuteNonQuery();

            sqlCnn.Close();


        }



        #endregion
    }
}