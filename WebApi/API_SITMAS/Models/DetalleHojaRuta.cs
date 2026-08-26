using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class DetalleHojaRuta
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public int Id { get; set; }
        public int Id_HojaRuta { get; set; }
        public int Id_TipoMovimiento { get; set; }
        public int Id_RecursoMov { get; set; }
        public int Id_Origen { get; set; }
        public int Id_TipoMaterial { get; set; }
        public TimeSpan HoraEstimada { get; set; }
        public int Id_Estado { get; set; }

        // Propiedades de lectura mapeadas desde la Vista (vw_Detalle_HojaRuta)
        public string TipoMovimiento { get; set; }
        public string RecursoMovilizado { get; set; }
        public string Origen { get; set; }
        public string TipoMaterial { get; set; }
        public string HoraEstimadaFormateada { get; set; }
        public string EstadoRecorrido { get; set; }

        public List<DetalleHojaRuta> ObtenerPorHojaRuta(int idHojaRuta)
        {
            var lista = new List<DetalleHojaRuta>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarDetalleHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", idHojaRuta);

                sqlCnn.Open();
                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new DetalleHojaRuta
                        {
                            Id = Convert.ToInt32(reader["Id_Detalle"]),
                            Id_HojaRuta = Convert.ToInt32(reader["Numero_HojaRuta"]),
                            TipoMovimiento = reader["TipoMovimiento"].ToString(),
                            RecursoMovilizado = reader["RecursoMovilizado"].ToString(),
                            Origen = reader["Origen"].ToString(),
                            TipoMaterial = reader["TipoMaterial"].ToString(),
                            HoraEstimadaFormateada = reader["HoraEstimadaFormateada"].ToString(),
                            EstadoRecorrido = reader["EstadoRecorrido"].ToString()
                        });
                    }
                }
            }
            return lista;
        }

        public int Insertar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_InsertarDetalleHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", Id_HojaRuta);
                sqlCom.Parameters.AddWithValue("@Id_TipoMovimiento", Id_TipoMovimiento);
                sqlCom.Parameters.AddWithValue("@Id_RecursoMov", Id_RecursoMov);
                sqlCom.Parameters.AddWithValue("@Id_Origen", Id_Origen);
                sqlCom.Parameters.AddWithValue("@Id_TipoMaterial", Id_TipoMaterial);
                sqlCom.Parameters.AddWithValue("@HoraEstimada", HoraEstimada);
                sqlCom.Parameters.AddWithValue("@Id_Estado", Id_Estado);

                sqlCnn.Open();
                return Convert.ToInt32(sqlCom.ExecuteScalar());


            }
        }

        public bool Modificar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarDetalleHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@Id", Id);
                sqlCom.Parameters.AddWithValue("@Id_TipoMovimiento", Id_TipoMovimiento);
                sqlCom.Parameters.AddWithValue("@Id_RecursoMov", Id_RecursoMov);
                sqlCom.Parameters.AddWithValue("@Id_Origen", Id_Origen);
                sqlCom.Parameters.AddWithValue("@Id_TipoMaterial", Id_TipoMaterial);
                sqlCom.Parameters.AddWithValue("@HoraEstimada", HoraEstimada);
                sqlCom.Parameters.AddWithValue("@Id_Estado", Id_Estado);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        public bool Borrar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_EliminarDetalleHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@Id", Id);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

    }
}





//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Web;

//namespace API_SITMAS.Models
//{
//    public class DetalleHojaRuta
//    {
//    }
//}