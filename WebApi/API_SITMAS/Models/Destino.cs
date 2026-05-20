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
    public class AreaDestino
    {
        #region Atributos

        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        #endregion

        #region Propìedades

        public int IdDestino { get; set; }
        public string Destino { get; set; }

        #endregion

        #region Metodos

        public DataTable SelectAll()
        {


            string sqlSentencia = "sp_ListarDestino";

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

            string sqlSentencia = "sp_InsertarDestino";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;

            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@Destino", SqlDbType.NVarChar).Value = Destino;

            sqlCnn.Open();

            var res = sqlCom.ExecuteNonQuery();

            sqlCnn.Close();

        }


        public void Modificar()
        {


            string sqlSentencia = "sp_ActualizarDestino";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;

            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@IdDestino", SqlDbType.Int).Value = IdDestino;
            sqlCom.Parameters.Add("@Destino", SqlDbType.NVarChar).Value = Destino;

            sqlCnn.Open();

            var res = sqlCom.ExecuteNonQuery();

            sqlCnn.Close();

        }


        //EL MÉTODO BORRAR EMPLEADO SE ENCUENTRA FUNCIONANDO, PERO ESTÁ DESACTIVADO (COMENTADO)

        public void Borrar()
        {

            string sqlSentencia = "sp_EliminarDestino";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;


            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@IdDestino", SqlDbType.Int).Value = IdDestino;

            sqlCnn.Open();

            var res = sqlCom.ExecuteNonQuery();

            sqlCnn.Close();


        }


        //public DataTable VistalistadoEmpleados()
        //{

        //    string sqlSentencia = "sp_ListarEmpleadosDetallados";

        //    SqlConnection sqlCnn = new SqlConnection();
        //    sqlCnn.ConnectionString = conectionString;

        //    sqlCnn.Open();

        //    SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
        //    sqlCom.CommandType = CommandType.StoredProcedure;

        //    DataSet ds = new DataSet();

        //    SqlDataAdapter da = new SqlDataAdapter();
        //    da.SelectCommand = sqlCom;
        //    da.Fill(ds);

        //    sqlCnn.Close();

        //    return ds.Tables[0];

        //}

        #endregion
    }
}