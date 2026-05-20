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
    public class TpVinculacion
    {
        #region Atributos

        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        #endregion

        #region Propìedades

        public int IdVinculacion { get; set; }
        public string TipoVinculacion { get; set; }

        #endregion

        #region Metodos

        public DataTable SelectAll()
        {


            string sqlSentencia = "sp_ListarTpVinculacion";

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

            string sqlSentencia = "sp_InsertarTpVinculacion";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;

            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@TipoVinculacion", SqlDbType.NVarChar).Value = TipoVinculacion;

            sqlCnn.Open();

            var res = sqlCom.ExecuteNonQuery();

            sqlCnn.Close();

        }


        public void Modificar()
        {


            string sqlSentencia = "sp_ActualizarTpVinculacion";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;

            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@IdVinculacion", SqlDbType.Int).Value = IdVinculacion;
            sqlCom.Parameters.Add("@TipoVinculacion", SqlDbType.NVarChar).Value = TipoVinculacion;

            sqlCnn.Open();

            var res = sqlCom.ExecuteNonQuery();

            sqlCnn.Close();

        }


        //EL MÉTODO BORRAR EMPLEADO SE ENCUENTRA FUNCIONANDO, PERO ESTÁ DESACTIVADO (COMENTADO)

        public void Borrar()
        {

            string sqlSentencia = "sp_EliminarTpVinculacion";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;


            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@IdVinculacion", SqlDbType.Int).Value = IdVinculacion;

            sqlCnn.Open();

            var res = sqlCom.ExecuteNonQuery();

            sqlCnn.Close();


        }




        #endregion
    }
}