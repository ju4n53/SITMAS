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


        #endregion

        #region Propìedades

        public int IdIngresoM { get; set; }
        public DateTime FechaIngreso { get; set; }
        public int Id_Origen { get; set; }
        public int Id_Usuario_Registro { get; set; }
        public int Id_Camionero_Ingreso { get; set; }
        public int Id_Vehiculo_Ingreso { get; set; }
        public string EstadoIng { get; set; }
        public string Origen { get; set; }
        public string UsuarioRegistro { get; set; }
        public string Camionero { get; set; }
        public string Vehiculo { get; set; }


        #endregion

        #region Metodos

        public DataTable SelectAll()
        {


            string sqlSentencia = "sp_ListarIngreso_Material";


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

        public int Insertar()
        {

            string sqlSentencia = "sp_InsertarIngreso_Material";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                // Mapeamos los parámetros tal como los definimos en el SP
                sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = Id_Origen;
                sqlCom.Parameters.Add("@IdUsuarioRegistro", SqlDbType.Int).Value = Id_Usuario_Registro;
                sqlCom.Parameters.Add("@IdCamioneroIngreso", SqlDbType.Int).Value = Id_Camionero_Ingreso;
                sqlCom.Parameters.Add("@IdVehiculoIngreso", SqlDbType.Int).Value = Id_Vehiculo_Ingreso;

                sqlCnn.Open();
                // ExecuteScalar ejecuta el SP y captura el SELECT SCOPE_IDENTITY()
                var resultado = sqlCom.ExecuteScalar();
                sqlCnn.Close();

                return Convert.ToInt32(resultado);
            }

        }


        public void Modificar()
        {


            string sqlSentencia = "sp_ActualizarIngreso_Material";


            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdIngresoM", SqlDbType.Int).Value = IdIngresoM;
                sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = Id_Origen;
                sqlCom.Parameters.Add("@IdUsuarioRegistro", SqlDbType.Int).Value = Id_Usuario_Registro;
                sqlCom.Parameters.Add("@IdCamioneroIngreso", SqlDbType.Int).Value = Id_Camionero_Ingreso;
                sqlCom.Parameters.Add("@IdVehiculoIngreso", SqlDbType.Int).Value = Id_Vehiculo_Ingreso;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
                sqlCnn.Close();
            }


        }


        //EL MÉTODO BORRAR EMPLEADO SE ENCUENTRA FUNCIONANDO, PERO ESTÁ DESACTIVADO (COMENTADO)

        public void Borrar()
        {

            string sqlSentencia = "sp_EliminarIngreso_Material";


            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdIngresoM", SqlDbType.Int).Value = IdIngresoM;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
                sqlCnn.Close();
            }


        }


        public DataTable VistaIngreso_Material()
        {


            string sqlSentencia = "sp_ListarVistaIngreso_Material";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;
                DataSet ds = new DataSet();
                SqlDataAdapter da = new SqlDataAdapter(sqlCom);

                sqlCnn.Open();
                da.Fill(ds);
                return ds.Tables[0];
            }

        }

        #endregion

    }
}