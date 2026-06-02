using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Configuration;



namespace API_SITMAS.Models
{
    public class Material_Clasificado
    {


        #region Atributos

        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        #endregion

        #region Propiedades

        public int Id { get; set; }
        public int Id_Detalle_Ingreso { get; set; }
        public decimal PesoUtil { get; set; }
        public DateTime FechaClasificacion { get; set; }
        public int Id_Estado_Material { get; set; }
        public int Id_Destino { get; set; }
        public int Id_Usuario_Clasificador { get; set; }
        public string EstadoMtCl { get; set; }

        // Propiedades descriptivas mapeadas de la vista
        public string EstadoMaterial { get; set; }
        public string Destino { get; set; }
        public string UsuarioClasificador { get; set; }
        public string MaterialOriginal { get; set; }



        #endregion

        #region Metodos

        public DataTable SelectAll()
        {
            string sqlSentencia = "sp_ListarMaterial_Clasificado";

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


        public DataTable SelectVista()
        {
            string sqlSentencia = "sp_ListarVistaMaterial_Clasificado";
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



        public void Insertar()
        {
            string sqlSentencia = "sp_InsertarMaterial_Clasificado";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = Id_Detalle_Ingreso;
                sqlCom.Parameters.Add("@PesoUtil", SqlDbType.Decimal).Value = PesoUtil;
                sqlCom.Parameters.Add("@IdEstadoMaterial", SqlDbType.Int).Value = Id_Estado_Material;
                sqlCom.Parameters.Add("@IdDestino", SqlDbType.Int).Value = Id_Destino;
                sqlCom.Parameters.Add("@IdUsuarioClasificador", SqlDbType.Int).Value = Id_Usuario_Clasificador;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }
        }

        public void Modificar()
        {
            string sqlSentencia = "sp_ActualizarMaterial_Clasificado";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;
                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = Id_Detalle_Ingreso;
                sqlCom.Parameters.Add("@PesoUtil", SqlDbType.Decimal).Value = PesoUtil;
                sqlCom.Parameters.Add("@IdEstadoMaterial", SqlDbType.Int).Value = Id_Estado_Material;
                sqlCom.Parameters.Add("@IdDestino", SqlDbType.Int).Value = Id_Destino;
                sqlCom.Parameters.Add("@IdUsuarioClasificador", SqlDbType.Int).Value = Id_Usuario_Clasificador;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }
        }

        public void Borrar()
        {
            string sqlSentencia = "sp_EliminarMaterial_Clasificado";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }
        }

        #endregion

    }
}