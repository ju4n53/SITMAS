using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;


namespace API_SITMAS.Models
{
    public class Empleado
    {


        #region Atributos

        string conectionString = @"Data Source=DESKTOP-N824T94;Initial Catalog=Gestion_SITMAS; Integrated Security= True ";

        #endregion

        #region Propìedades

        public int Id { get; set; }
        public string Apellido { get; set; }

        public string Nombre { get; set; }
        public string Cuil { get; set; }
        public string Telefono { get; set; }
        public string Email { get; set; }
        public DateTime Fecha_Ingreso { get; set; }
        public string Calle { get; set; }
        public string Numero { get; set; }
        public string Piso { get; set; }
        public string Dpto { get; set; }
        public int Id_Cargo { get; set; }
        public string Cargo { get; set; }
        public int Id_Area { get; set; }
        public string Area { get; set; }
        public int Id_Barrio { get; set; }
        public string Barrio { get; set; }
        public int Id_Estado_Empleado { get; set; }
        public string EstadoEmpleado { get; set; }



        #endregion

        #region Metodos

        public DataTable SelectAll()
        {


            string sqlSentencia = "sp_ListarEmpleados";


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


            string sqlSentencia = "sp_VerEmpleadoId";


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

            string sqlSentencia = "sp_InsertarEmpleado";


            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;


            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@Apellido", SqlDbType.NVarChar).Value = Apellido;
            sqlCom.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre;
            sqlCom.Parameters.Add("@Cuil", SqlDbType.NVarChar).Value = Cuil;
            sqlCom.Parameters.Add("@Telefono", SqlDbType.NVarChar).Value = Telefono;
            sqlCom.Parameters.Add("@Email", SqlDbType.NVarChar).Value = Email;
            sqlCom.Parameters.Add("@Fecha_Ingreso", SqlDbType.Date).Value = Fecha_Ingreso;
            sqlCom.Parameters.Add("@Id_Cargo", SqlDbType.Int).Value = Id_Cargo;
            sqlCom.Parameters.Add("@Id_Area", SqlDbType.Int).Value = Id_Area;
            sqlCom.Parameters.Add("@Id_Barrio", SqlDbType.Int).Value = Id_Barrio;
            sqlCom.Parameters.Add("@Id_Estado", SqlDbType.Int).Value = Id_Estado_Empleado;
            sqlCom.Parameters.Add("@Calle", SqlDbType.NVarChar).Value = Calle;
            sqlCom.Parameters.Add("@Numero", SqlDbType.NVarChar).Value = Numero;
            sqlCom.Parameters.Add("@Piso", SqlDbType.NVarChar).Value = Piso;
            sqlCom.Parameters.Add("@Dpto", SqlDbType.NVarChar).Value = Dpto;

            sqlCnn.Open();


            var res = sqlCom.ExecuteNonQuery();


            sqlCnn.Close();


        }


        public void Modificar()
        {


            string sqlSentencia = "sp_ActualizarEmpleado";


            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;




            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;
            sqlCom.Parameters.Add("@Apellido", SqlDbType.NVarChar).Value = Apellido;
            sqlCom.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre;
            sqlCom.Parameters.Add("@Cuil", SqlDbType.NVarChar).Value = Cuil;
            sqlCom.Parameters.Add("@Telefono", SqlDbType.NVarChar).Value = Telefono;
            sqlCom.Parameters.Add("@Email", SqlDbType.NVarChar).Value = Email;
            sqlCom.Parameters.Add("@Fecha_Ingreso", SqlDbType.Date).Value = Fecha_Ingreso;            
            sqlCom.Parameters.Add("@Id_Cargo", SqlDbType.Int).Value = Id_Cargo;
            sqlCom.Parameters.Add("@Id_Area", SqlDbType.Int).Value = Id_Area;
            sqlCom.Parameters.Add("@Id_Barrio", SqlDbType.Int).Value = Id_Barrio;
            sqlCom.Parameters.Add("@Id_Estado", SqlDbType.Int).Value = Id_Estado_Empleado;
            sqlCom.Parameters.Add("@Calle", SqlDbType.NVarChar).Value = Calle;
            sqlCom.Parameters.Add("@Numero", SqlDbType.NVarChar).Value = Numero;
            sqlCom.Parameters.Add("@Piso", SqlDbType.NVarChar).Value = Piso;
            sqlCom.Parameters.Add("@Dpto", SqlDbType.NVarChar).Value = Dpto;


            sqlCnn.Open();


            var res = sqlCom.ExecuteNonQuery();


            sqlCnn.Close();


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


        public DataTable VistalistadoEmpleados()
        {


            string sqlSentencia = "sp_ListarEmpleadosDetallados";


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