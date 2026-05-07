using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Configuration;



namespace API_SITMAS.Models
{
    public class Detalle_Ingreso
    {


        #region Atributos

        // Ahora le pedimos al ConfigurationManager que busque la cadena por su nombre
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;


        //string conectionString = @"Data Source=DESKTOP-N824T94;Initial Catalog=Gestion_SITMAS; Integrated Security= True ";

        #endregion

        #region Propìedades

        public int IdDetalleIngreso { get; set; }
        public int Id_Ingreso_Material { get; set; } // El que capturamos con Scope_Identity
        public int Id_SubTipo_Material { get; set; }
        public decimal PesoBruto { get; set; }
        public string Observaciones { get; set; }



        #endregion

        #region Metodos

        public DataTable SelectAll()
        {


            string sqlSentencia = "sp_ListarDetalleIngreso";


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

            string sqlSentencia = "sp_InsertarDetalleIngreso";


            SqlConnection sqlCnn = new SqlConnection();
            sqlCnn.ConnectionString = conectionString;


            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
            sqlCom.CommandType = CommandType.StoredProcedure;

            sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value = Id_Ingreso_Material;
            sqlCom.Parameters.Add("@IdSubTipoMaterial", SqlDbType.Int).Value = Id_SubTipo_Material;
            sqlCom.Parameters.Add("@PesoBruto", SqlDbType.Decimal).Value = PesoBruto;
            sqlCom.Parameters.Add("@Observaciones", SqlDbType.NVarChar).Value = Observaciones;
            
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