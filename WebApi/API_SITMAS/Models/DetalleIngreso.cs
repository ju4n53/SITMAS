using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;

namespace API_SITMAS.Models
{
    public class Detalle_Ingreso
    {
        #region Atributos
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;
        #endregion

        #region Propiedades
        public int IdDetalleIngreso { get; set; }
        public int Id_Ingreso_Material { get; set; }

        // 👈 Cajas flexibles para soportar NULLs de la base de datos
        public int? Id_Tipo_Material { get; set; }

        public int? Id_Detalle_HDR { get; set; }

        public decimal PesoBruto { get; set; }
        public string Observaciones { get; set; }
        public string EstadoDtIng { get; set; }
        public int Id_Origen { get; set; }

        // Propiedad auxiliar de la vista
        public string Tipo { get; set; }
        public string TipoMaterial { get; set; }
        public string Origen { get; set; }
        #endregion

        #region Metodos

        public List<Detalle_Ingreso> SelectAll()
        {
            List<Detalle_Ingreso> lista = new List<Detalle_Ingreso>();
            string sqlSentencia = "sp_ListarDetalleIngreso";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Detalle_Ingreso obj = new Detalle_Ingreso();

                        obj.IdDetalleIngreso = Convert.ToInt32(reader["IdDetalleIngreso"]);
                        obj.Id_Ingreso_Material = Convert.ToInt32(reader["Id_Ingreso_Material"]);

                        // Control de Nulos
                        obj.Id_Tipo_Material = reader["Id_Tipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_Tipo_Material"]) : (int?)null;
                        obj.Id_Detalle_HDR = reader["Id_Detalle_HDR"] != DBNull.Value ? Convert.ToInt32(reader["Id_Detalle_HDR"]) : (int?)null;

                        obj.PesoBruto = Convert.ToDecimal(reader["PesoBruto"]);
                        obj.Observaciones = reader["Observaciones"] != DBNull.Value ? reader["Observaciones"].ToString() : null;
                        obj.EstadoDtIng = reader["EstadoDtIng"].ToString();
                        obj.Id_Origen = Convert.ToInt32(reader["Id_Origen"]);

                        lista.Add(obj);
                    }
                }
            }
            return lista;
        }

        public List<Detalle_Ingreso> SelectPorCabecera(int idCabecera)
        {
            List<Detalle_Ingreso> lista = new List<Detalle_Ingreso>();
            string sqlSentencia = "sp_ListarVistaDetalle_Ingreso";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.Add("@IdIngresoM", SqlDbType.Int).Value = idCabecera;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Detalle_Ingreso obj = new Detalle_Ingreso();

                        // Mapeo ajustado a los alias de tu vista vw_Detalle_Ingreso
                        obj.IdDetalleIngreso = Convert.ToInt32(reader["IdDetalleIngreso"]);
                        obj.Id_Ingreso_Material = Convert.ToInt32(reader["IdIngresoM"]);

                        obj.Id_Tipo_Material = reader["IdTipoMaterial"] != DBNull.Value ? Convert.ToInt32(reader["IdTipoMaterial"]) : (int?)null;
                        obj.Id_Detalle_HDR = reader["Id_Detalle_HDR"] != DBNull.Value ? Convert.ToInt32(reader["Id_Detalle_HDR"]) : (int?)null;

                        obj.PesoBruto = Convert.ToDecimal(reader["PesoBruto"]);
                        obj.Observaciones = reader["Observaciones"] != DBNull.Value ? reader["Observaciones"].ToString() : null;
                        obj.EstadoDtIng = reader["EstadoDtIng"].ToString();

                        // Propiedad auxiliar
                        obj.Tipo = reader["Tipo"] != DBNull.Value ? reader["Tipo"].ToString() : "No Especificado";

                        lista.Add(obj);
                    }
                }
            }
            return lista;
        }


        public List<Detalle_Ingreso> SelectPendientesClasificacion(int idIngresoMaterial)
        {
            List<Detalle_Ingreso> lista = new List<Detalle_Ingreso>();
            string sqlSentencia = "sp_ListarDetalleIngreso_PendientesClasificacion";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value = idIngresoMaterial;

                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Detalle_Ingreso obj = new Detalle_Ingreso();
                        obj.IdDetalleIngreso = Convert.ToInt32(reader["IdDetalleIngreso"]);
                        obj.Id_Ingreso_Material = Convert.ToInt32(reader["Id_Ingreso_Material"]);
                        obj.PesoBruto = Convert.ToDecimal(reader["PesoBruto"]);
                        obj.Observaciones = reader["Observaciones"] != DBNull.Value ? reader["Observaciones"].ToString() : string.Empty;
                        obj.EstadoDtIng = reader["EstadoDtIng"].ToString();
                        obj.Id_Origen = Convert.ToInt32(reader["Id_Origen"]);

                        obj.Id_Tipo_Material = reader["Id_Tipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_Tipo_Material"]) : 0;
                        obj.TipoMaterial = reader["TipoMaterial"] != DBNull.Value ? reader["TipoMaterial"].ToString() : "Varios";
                        obj.Origen = reader["Origen"] != DBNull.Value ? reader["Origen"].ToString() : "Sin Origen";

                        lista.Add(obj);
                    }
                }
            }
            return lista;
        }

        public void Insertar()
        {
            string sqlSentencia = "sp_InsertarDetalle_Ingreso";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value = Id_Ingreso_Material;

                // Si el Tipo o HDR son nulos, mandamos DBNull al servidor SQL
                sqlCom.Parameters.Add("@IdTipoMaterial", SqlDbType.Int).Value = Id_Tipo_Material.HasValue ? (object)Id_Tipo_Material.Value : DBNull.Value;
                sqlCom.Parameters.Add("@Id_Detalle_HDR", SqlDbType.Int).Value = Id_Detalle_HDR.HasValue ? (object)Id_Detalle_HDR.Value : DBNull.Value;

                sqlCom.Parameters.Add("@PesoBruto", SqlDbType.Decimal).Value = PesoBruto;
                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 100).Value = string.IsNullOrEmpty(Observaciones) ? DBNull.Value : (object)Observaciones;
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
                sqlCom.Parameters.Add("@IdTipoMaterial", SqlDbType.Int).Value = Id_Tipo_Material.HasValue ? (object)Id_Tipo_Material.Value : DBNull.Value;
                sqlCom.Parameters.Add("@Id_Detalle_HDR", SqlDbType.Int).Value = Id_Detalle_HDR.HasValue ? (object)Id_Detalle_HDR.Value : DBNull.Value;
                sqlCom.Parameters.Add("@PesoBruto", SqlDbType.Decimal).Value = PesoBruto;
                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 100).Value = string.IsNullOrEmpty(Observaciones) ? DBNull.Value : (object)Observaciones;
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
        #endregion
    }
}




//using System;
//using System.Collections.Generic;
//using System.Data;
//using System.Data.SqlClient;
//using System.Linq;
//using System.Web;
//using System.Configuration;



//namespace API_SITMAS.Models
//{
//    public class Detalle_Ingreso
//    {

//        #region Propìedades

//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

//        #region Propiedades
//        public int IdDetalleIngreso { get; set; }
//        public int Id_Ingreso_Material { get; set; }
//        public int Id_Tipo_Material { get; set; } // 👈 Ahora apunta a TipoMaterial
//        public decimal PesoBruto { get; set; }
//        public string Observaciones { get; set; }
//        public string EstadoDtIng { get; set; }
//        public int Id_Origen { get; set; }
//        public int? Id_Detalle_HDR { get; set; } // 👈 El puente a la tarea de la Hoja de Ruta

//        // Propiedad auxiliar de la vista
//        public string Tipo { get; set; }
//        #endregion

//        #endregion

//        #region Metodos

//        public DataTable SelectAll()
//        {


//            string sqlSentencia = "sp_ListarDetalleIngreso";


//            SqlConnection sqlCnn = new SqlConnection();
//            sqlCnn.ConnectionString = conectionString;


//            sqlCnn.Open();

//            SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//            sqlCom.CommandType = CommandType.StoredProcedure;

//            DataSet ds = new DataSet();

//            SqlDataAdapter da = new SqlDataAdapter();
//            da.SelectCommand = sqlCom;
//            da.Fill(ds);



//            sqlCnn.Close();


//            return ds.Tables[0];

//        }



//        public void Insertar()
//        {
//            string sqlSentencia = "sp_InsertarDetalle_Ingreso";
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value = Id_Ingreso_Material;
//                sqlCom.Parameters.Add("@IdTipoMaterial", SqlDbType.Int).Value = Id_Tipo_Material;
//                sqlCom.Parameters.Add("@PesoBruto", SqlDbType.Decimal).Value = PesoBruto;
//                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 100).Value = (object)Observaciones ?? DBNull.Value;
//                sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = Id_Origen;
//                sqlCom.Parameters.Add("@Id_Detalle_HDR", SqlDbType.Int).Value = Id_Detalle_HDR.HasValue ? (object)Id_Detalle_HDR.Value : DBNull.Value;

//                sqlCnn.Open();
//                sqlCom.ExecuteNonQuery();
//            }
//        }


//        public void Modificar()
//        {
//            string sqlSentencia = "sp_ActualizarDetalle_Ingreso";
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = IdDetalleIngreso;
//                sqlCom.Parameters.Add("@IdTipoMaterial", SqlDbType.Int).Value = Id_Tipo_Material;
//                sqlCom.Parameters.Add("@PesoBruto", SqlDbType.Decimal).Value = PesoBruto;
//                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 100).Value = (object)Observaciones ?? DBNull.Value;
//                sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = Id_Origen;
//                sqlCom.Parameters.Add("@Id_Detalle_HDR", SqlDbType.Int).Value = Id_Detalle_HDR.HasValue ? (object)Id_Detalle_HDR.Value : DBNull.Value;

//                sqlCnn.Open();
//                sqlCom.ExecuteNonQuery();
//            }
//        }


//        public void Borrar()
//        {

//            string sqlSentencia = "sp_EliminarDetalle_Ingreso";
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = IdDetalleIngreso;

//                sqlCnn.Open();
//                sqlCom.ExecuteNonQuery();
//            }


//        }


//        public DataTable SelectPorCabecera(int idCabecera)
//        {

//            string sqlSentencia = "sp_ListarVistaDetalle_Ingreso";
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.Add("@IdIngresoM", SqlDbType.Int).Value = idCabecera;

//                DataSet ds = new DataSet();
//                SqlDataAdapter da = new SqlDataAdapter(sqlCom);
//                sqlCnn.Open();
//                da.Fill(ds);
//                return ds.Tables[0];
//            }



//        }


//        #endregion

//    }
//}