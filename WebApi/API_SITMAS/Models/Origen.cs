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
    public class EmpresaOrigen
    {
        #region Atributos

        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        #endregion

        #region Propìedades

        public int IdOrigen { get; set; }
        public string EmpresaInstitucion { get; set; }
        public string CalleEI { get; set; }
        public string NumeroEI { get; set; }
        public string TelefonoEI { get; set; }
        public string EmailEI { get; set; }
        public int Id_Barrio { get; set; }


        #endregion

        #region Metodos

        public DataTable SelectAll()
        {


            string sqlSentencia = "sp_ListarOrigen";

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

            string sqlSentencia = "sp_InsertarOrigen";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;

            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@EmpresaInstitucion", SqlDbType.NVarChar).Value = EmpresaInstitucion;
            sqlCom.Parameters.Add("@CalleEI", SqlDbType.NVarChar).Value = CalleEI;
            sqlCom.Parameters.Add("@NumeroEI", SqlDbType.NVarChar).Value = NumeroEI;
            sqlCom.Parameters.Add("@TelefonoEI", SqlDbType.NVarChar).Value = TelefonoEI;
            sqlCom.Parameters.Add("@EmailEI", SqlDbType.NVarChar).Value = EmailEI;
            sqlCom.Parameters.Add("@Id_Barrio", SqlDbType.Int).Value = Id_Barrio;


            sqlCnn.Open();

            var res = sqlCom.ExecuteNonQuery();

            sqlCnn.Close();

        }


        public void Modificar()
        {


            string sqlSentencia = "sp_ActualizarOrigen";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;

            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = IdOrigen;
            sqlCom.Parameters.Add("@EmpresaInstitucion", SqlDbType.NVarChar).Value = EmpresaInstitucion;
            sqlCom.Parameters.Add("@CalleEI", SqlDbType.NVarChar).Value = CalleEI;
            sqlCom.Parameters.Add("@NumeroEI", SqlDbType.NVarChar).Value = NumeroEI;
            sqlCom.Parameters.Add("@TelefonoEI", SqlDbType.NVarChar).Value = TelefonoEI;
            sqlCom.Parameters.Add("@EmailEI", SqlDbType.NVarChar).Value = EmailEI;
                        sqlCom.Parameters.Add("@Id_Barrio", SqlDbType.Int).Value = Id_Barrio;

            sqlCnn.Open();

            var res = sqlCom.ExecuteNonQuery();

            sqlCnn.Close();

        }


        //EL MÉTODO BORRAR EMPLEADO SE ENCUENTRA FUNCIONANDO, PERO ESTÁ DESACTIVADO (COMENTADO)

        public void Borrar()
        {

            string sqlSentencia = "sp_EliminarOrigen";

            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;


            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = IdOrigen;

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