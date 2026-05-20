using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace API_SITMAS.Models
{
    public class Barrios
    {

        #region Atributos

        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;


        //string conectionString = @"Data Source=DESKTOP-N824T94;Initial Catalog=Gestion_SITMAS; Integrated Security= True ";

        #endregion

        #region Propìedades

        public int Id { get; set; }
        public string Barrio { get; set; }

        #endregion

        #region Metodos

        public DataTable SelectAll()
        {


            string sqlSentencia = "sp_ListarBarrio";

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

        #endregion

    }

}