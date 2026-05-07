using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Configuration;



namespace API_SITMAS.Models
{
    public class Ingreso_Material
    {


        #region Atributos

        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;


        //string conectionString = @"Data Source=DESKTOP-N824T94;Initial Catalog=Gestion_SITMAS; Integrated Security= True ";

        #endregion

        #region Propìedades

        public int IdIngresoM { get; set; }
        public int Id_Origen { get; set; }
        public int Id_Usuario_Registro { get; set; }
        public int Id_Camionero_Ingreso { get; set; }
        public int Id_Vehiculo_Ingreso { get; set; }


        #endregion

        #region Metodos

        public DataTable SelectAll()
        {


            string sqlSentencia = "sp_ListarIngresoMaterial";


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

            string sqlSentencia = "sp_RegistrarIngresoMaterial";


            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;


            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = Id_Origen;
            sqlCom.Parameters.Add("@IdUsuarioRegistro", SqlDbType.Int).Value = Id_Usuario_Registro;
            sqlCom.Parameters.Add("@IdCamioneroIngreso", SqlDbType.Int).Value = Id_Camionero_Ingreso;
            sqlCom.Parameters.Add("@IdVehiculoIngreso", SqlDbType.Int).Value = Id_Vehiculo_Ingreso;
           

            sqlCnn.Open();


            var res = sqlCom.ExecuteNonQuery();


            sqlCnn.Close();


        }


        //public void Modificar()
        //{


        //    string sqlSentencia = "sp_ActualizarEmpleado";


        //    SqlConnection sqlCnn = new SqlConnection();
        //    sqlCnn.ConnectionString = conectionString;




        //    SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
        //    sqlCom.CommandType = CommandType.StoredProcedure;

        //    sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;
        //    sqlCom.Parameters.Add("@Apellido", SqlDbType.NVarChar).Value = Apellido;
        //    sqlCom.Parameters.Add("@Nombre", SqlDbType.NVarChar).Value = Nombre;
        //    sqlCom.Parameters.Add("@Cuil", SqlDbType.NVarChar).Value = Cuil;
        //    sqlCom.Parameters.Add("@Telefono", SqlDbType.NVarChar).Value = Telefono;
        //    sqlCom.Parameters.Add("@Email", SqlDbType.NVarChar).Value = Email;
        //    sqlCom.Parameters.Add("@Fecha_Ingreso", SqlDbType.Date).Value = Fecha_Ingreso;
        //    sqlCom.Parameters.Add("@Id_Cargo", SqlDbType.Int).Value = Id_Cargo;
        //    sqlCom.Parameters.Add("@Id_Area", SqlDbType.Int).Value = Id_Area;
        //    sqlCom.Parameters.Add("@Id_Barrio", SqlDbType.Int).Value = Id_Barrio;
        //    sqlCom.Parameters.Add("@Id_Estado", SqlDbType.Int).Value = Id_Estado_Empleado;
        //    sqlCom.Parameters.Add("@Calle", SqlDbType.NVarChar).Value = Calle;
        //    sqlCom.Parameters.Add("@Numero", SqlDbType.NVarChar).Value = Numero;
        //    sqlCom.Parameters.Add("@Piso", SqlDbType.NVarChar).Value = Piso;
        //    sqlCom.Parameters.Add("@Dpto", SqlDbType.NVarChar).Value = Dpto;


        //    sqlCnn.Open();


        //    var res = sqlCom.ExecuteNonQuery();


        //    sqlCnn.Close();


        //}


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