using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;

namespace API_SITMAS.Models
{
    public class Ingreso_Material
    {
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        #region Propiedades
        public int IdIngresoM { get; set; }
        public DateTime? FechaIngreso { get; set; } // 👈 Ahora lo controlamos nosotros
        public int Id_Usuario_Registro { get; set; }
        public int Id_Camionero_Ingreso { get; set; }
        public int Id_Vehiculo_Ingreso { get; set; }
        public string EstadoIng { get; set; }
        public int? Id_HojaRuta { get; set; } // 👈 Flexible para soportar ingresos espontáneos
        #endregion

        #region Metodos
        public List<Ingreso_Material> SelectAll()
        {
            List<Ingreso_Material> lista = new List<Ingreso_Material>();
            string sqlSentencia = "sp_ListarIngreso_Material"; // Asegúrate de tener este SP

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Ingreso_Material obj = new Ingreso_Material();
                        obj.IdIngresoM = Convert.ToInt32(reader["IdIngresoM"]);

                        // Protección contra nulos
                        obj.FechaIngreso = reader["FechaIngreso"] != DBNull.Value ? Convert.ToDateTime(reader["FechaIngreso"]) : (DateTime?)null;

                        obj.Id_Usuario_Registro = Convert.ToInt32(reader["Id_Usuario_Registro"]);
                        obj.Id_Camionero_Ingreso = Convert.ToInt32(reader["Id_Camionero_Ingreso"]);
                        obj.Id_Vehiculo_Ingreso = Convert.ToInt32(reader["Id_Vehiculo_Ingreso"]);
                        obj.EstadoIng = reader["EstadoIng"].ToString();

                        obj.Id_HojaRuta = reader["Id_HojaRuta"] != DBNull.Value ? Convert.ToInt32(reader["Id_HojaRuta"]) : (int?)null;

                        lista.Add(obj);
                    }
                }
            }
            return lista;
        }

        public int Insertar()
        {
            int nuevoId = 0;
            string sqlSentencia = "sp_InsertarIngreso_Material";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdUsuarioRegistro", SqlDbType.Int).Value = Id_Usuario_Registro;
                sqlCom.Parameters.Add("@IdCamioneroIngreso", SqlDbType.Int).Value = Id_Camionero_Ingreso;
                sqlCom.Parameters.Add("@IdVehiculoIngreso", SqlDbType.Int).Value = Id_Vehiculo_Ingreso;

                // Si desde el front no mandan fecha, ponemos la actual como respaldo
                sqlCom.Parameters.Add("@FechaIngreso", SqlDbType.DateTime).Value = FechaIngreso ?? DateTime.Now;

                sqlCom.Parameters.Add("@Id_HojaRuta", SqlDbType.Int).Value = Id_HojaRuta.HasValue ? (object)Id_HojaRuta.Value : DBNull.Value;

                sqlCnn.Open();
                // Usamos ExecuteScalar porque el SP hace un SELECT SCOPE_IDENTITY()
                nuevoId = Convert.ToInt32(sqlCom.ExecuteScalar());
            }
            return nuevoId;
        }

        public void Modificar()
        {
            string sqlSentencia = "sp_ActualizarIngreso_Material";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdIngresoM", SqlDbType.Int).Value = IdIngresoM;
                sqlCom.Parameters.Add("@IdUsuarioRegistro", SqlDbType.Int).Value = Id_Usuario_Registro;
                sqlCom.Parameters.Add("@IdCamioneroIngreso", SqlDbType.Int).Value = Id_Camionero_Ingreso;
                sqlCom.Parameters.Add("@IdVehiculoIngreso", SqlDbType.Int).Value = Id_Vehiculo_Ingreso;
                sqlCom.Parameters.Add("@FechaIngreso", SqlDbType.DateTime).Value = FechaIngreso ?? DateTime.Now;
                sqlCom.Parameters.Add("@Id_HojaRuta", SqlDbType.Int).Value = Id_HojaRuta.HasValue ? (object)Id_HojaRuta.Value : DBNull.Value;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
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
        //    public class Ingreso_Material
        //    {

        //        #region Atributos

        //        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        //        #endregion

        //        #region Propìedades

        //        public int IdIngresoM { get; set; }
        //        public DateTime FechaIngreso { get; set; }
        //        public int Id_Usuario_Registro { get; set; }
        //        public int Id_Camionero_Ingreso { get; set; }
        //        public int Id_Vehiculo_Ingreso { get; set; }
        //        public string EstadoIng { get; set; }
        //        public string UsuarioRegistro { get; set; }
        //        public string Camionero { get; set; }
        //        public string Vehiculo { get; set; }
        //        public int? Id_HojaRuta { get; set; }


        //        #endregion

        //        #region Metodos

        //        public DataTable SelectAll()
        //        {


        //            string sqlSentencia = "sp_ListarIngreso_Material";


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



        //        public int Insertar()
        //        {

        //            string sqlSentencia = "sp_InsertarIngreso_Material";

        //            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
        //            {
        //                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
        //                sqlCom.CommandType = CommandType.StoredProcedure;

        //                // Mapeamos los parámetros tal como los definimos en el SP
        //                sqlCom.Parameters.Add("@IdUsuarioRegistro", SqlDbType.Int).Value = Id_Usuario_Registro;
        //                sqlCom.Parameters.Add("@IdCamioneroIngreso", SqlDbType.Int).Value = Id_Camionero_Ingreso;
        //                sqlCom.Parameters.Add("@IdVehiculoIngreso", SqlDbType.Int).Value = Id_Vehiculo_Ingreso;
        //                sqlCom.Parameters.Add("@Id_HojaRuta", SqlDbType.Int).Value = Id_HojaRuta.HasValue ? (object)Id_HojaRuta.Value : DBNull.Value;

        //                sqlCnn.Open();
        //                // ExecuteScalar ejecuta el SP y captura el SELECT SCOPE_IDENTITY()
        //                var resultado = sqlCom.ExecuteScalar();
        //                sqlCnn.Close();

        //                return Convert.ToInt32(resultado);
        //            }

        //        }


        //        public void Modificar()
        //        {


        //            string sqlSentencia = "sp_ActualizarIngreso_Material";


        //            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
        //            {
        //                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
        //                sqlCom.CommandType = CommandType.StoredProcedure;

        //                sqlCom.Parameters.Add("@IdIngresoM", SqlDbType.Int).Value = IdIngresoM;
        //                sqlCom.Parameters.Add("@IdUsuarioRegistro", SqlDbType.Int).Value = Id_Usuario_Registro;
        //                sqlCom.Parameters.Add("@IdCamioneroIngreso", SqlDbType.Int).Value = Id_Camionero_Ingreso;
        //                sqlCom.Parameters.Add("@IdVehiculoIngreso", SqlDbType.Int).Value = Id_Vehiculo_Ingreso;
        //                sqlCom.Parameters.Add("@Id_HojaRuta", SqlDbType.Int).Value = Id_HojaRuta.HasValue ? (object)Id_HojaRuta.Value : DBNull.Value;


        //                sqlCnn.Open();
        //                sqlCom.ExecuteNonQuery();
        //                sqlCnn.Close();
        //            }


        //        }


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