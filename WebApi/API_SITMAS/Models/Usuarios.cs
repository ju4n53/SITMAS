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
    public class Usuarios
    {

        #region Atributos

        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;


        //string conectionString = @"Data Source=DESKTOP-N824T94;Initial Catalog=Gestion_SITMAS; Integrated Security= True ";

        #endregion

        #region Propìedades

        public int Id { get; set; }

        public string Usuario { get; set; }

        public string Password { get; set; }

        public int Id_Empleado { get; set; }
        
        public int Id_Estado_Usuario { get; set; }




        #endregion


        #region Metodos

        public DataTable SelectAll()
        {


            string sqlSentencia = "sp_ListarUsuarios";


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

        public DataTable SelectId()
        {


            string sqlSentencia = "sp_ListarUsuarioId";


            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;


            sqlCnn.Open();

            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;
            sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;

            DataSet ds = new DataSet();

            SqlDataAdapter da = new SqlDataAdapter();
            da.SelectCommand = sqlCom;
            da.Fill(ds);

            sqlCnn.Close();

            return ds.Tables[0];


        }


        public void Insertar()
        {

            string sqlSentencia = "sp_CrearUsuario";


            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;


            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@User", SqlDbType.NVarChar).Value = Usuario;
            sqlCom.Parameters.Add("@Pass", SqlDbType.NVarChar).Value = Password;
            sqlCom.Parameters.Add("@IdEmpleado", SqlDbType.Int).Value = Id_Empleado;
            sqlCom.Parameters.Add("@Estado", SqlDbType.Int).Value = Id_Estado_Usuario;
            
            sqlCnn.Open();


            var res = sqlCom.ExecuteNonQuery();


            sqlCnn.Close();


        }

        public void Modificar()
        {
            string sqlSentencia = "sp_ActualizarUsuario";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                // Parámetros básicos
                sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;
                sqlCom.Parameters.Add("@NuevoUser", SqlDbType.NVarChar).Value = Usuario;
                sqlCom.Parameters.Add("@IdEstado", SqlDbType.Int).Value = Id_Estado_Usuario;

                // LÓGICA PARA LA CONTRASEÑA
                // Si el string Password está vacío o es null, enviamos DBNull.Value
                // para que el Stored Procedure use su valor por defecto (NULL) y no cambie la clave.
                if (string.IsNullOrEmpty(Password))
                {
                    sqlCom.Parameters.Add("@NuevaPass", SqlDbType.NVarChar).Value = DBNull.Value;
                }
                else
                {
                    sqlCom.Parameters.Add("@NuevaPass", SqlDbType.NVarChar).Value = Password;
                }

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
                sqlCnn.Close();
            }
        }
       


        //EL MÉTODO BORRAR EMPLEADO SE ENCUENTRA FUNCIONANDO, PERO ESTÁ DESACTIVADO (COMENTADO)

        //public void Borrar()
        //{

        //    string sqlSentencia = "sp_EliminarEmpleado";


        //    SqlConnection sqlCnn = new SqlConnection();
        //    sqlCnn.ConnectionString = conectionString;




        //    SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
        //    sqlCom.CommandType = CommandType.StoredProcedure;

        //    sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;


        //    sqlCnn.Open();


        //    var res = sqlCom.ExecuteNonQuery();


        //    sqlCnn.Close();


        //}


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