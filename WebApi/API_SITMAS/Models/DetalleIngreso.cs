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

        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;


        #endregion

        #region Propìedades

        public int IdDetalleIngreso { get; set; }
        public int Id_Ingreso_Material { get; set; }
        public int Id_SubTipo_Material { get; set; }
        public decimal PesoBruto { get; set; }
        public string Observaciones { get; set; }
        public string EstadoDtIng { get; set; }
        public int Id_Origen { get; set; }
        public string Origen { get; set; }

        // Propiedades auxiliares de la vista legible
        public string Tipo { get; set; }
        public string Subtipo { get; set; }



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

        

        public void Insertar()
        {

            string sqlSentencia = "sp_InsertarDetalle_Ingreso";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value = Id_Ingreso_Material;
                sqlCom.Parameters.Add("@IdSubTipoMaterial", SqlDbType.Int).Value = Id_SubTipo_Material;
                sqlCom.Parameters.Add("@PesoBruto", SqlDbType.Decimal).Value = PesoBruto;
                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 100).Value = (object)Observaciones ?? DBNull.Value;
                sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = Id_Origen;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }


        }


        public void Modificar()
        {

            string sqlSentencia = "sp_ActualizarDetalle_Ingreso";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = IdDetalleIngreso;
                sqlCom.Parameters.Add("@IdSubTipoMaterial", SqlDbType.Int).Value = Id_SubTipo_Material;
                sqlCom.Parameters.Add("@PesoBruto", SqlDbType.Decimal).Value = PesoBruto;
                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 100).Value = (object)Observaciones ?? DBNull.Value;
                sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = Id_Origen;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }


        }


        public void Borrar()
        {

            string sqlSentencia = "sp_EliminarDetalle_Ingreso";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = IdDetalleIngreso;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }


        }


        public DataTable SelectPorCabecera(int idCabecera)
        {

            string sqlSentencia = "sp_ListarVistaDetalle_Ingreso";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.Add("@IdIngresoM", SqlDbType.Int).Value = idCabecera;

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