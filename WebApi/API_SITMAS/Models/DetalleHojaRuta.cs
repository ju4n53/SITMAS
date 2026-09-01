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

        // Identificadores y Claves Foráneas (Para INSERT, UPDATE y pre-selección de combos)
        public int Id_Detalle_HDR { get; set; }
        public int Id_HojaRuta { get; set; }
        public int Id_TipoMovimiento { get; set; }
        public int Id_RecursoMov { get; set; }
        public int Id_Origen { get; set; }
        public int Id_TipoMaterial { get; set; }
        public TimeSpan HoraEstimada { get; set; }
        public int Id_Estado { get; set; }

        // Propiedades de lectura/descriptivas (mapeadas desde la Vista vw_Detalle_HojaRuta)
        public string TipoMovimiento { get; set; }
        public string RecursoMovilizado { get; set; }
        public string Origen { get; set; }
        public string TipoMaterial { get; set; }
        public string HoraEstimadaFormateada { get; set; }
        public string EstadoRecorrido { get; set; }

        /// <summary>
        /// Obtiene todos los detalles/paradas asociados a una Hoja de Ruta específica.
        /// </summary>
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
                            Id_Detalle_HDR = Convert.ToInt32(reader["Id_Detalle"]),
                            Id_HojaRuta = Convert.ToInt32(reader["Numero_HojaRuta"]),

                            // Mapeo de descripciones desde la vista
                            TipoMovimiento = reader["TipoMovimiento"] != DBNull.Value ? reader["TipoMovimiento"].ToString() : string.Empty,
                            RecursoMovilizado = reader["RecursoMovilizado"] != DBNull.Value ? reader["RecursoMovilizado"].ToString() : string.Empty,
                            Origen = reader["Origen"] != DBNull.Value ? reader["Origen"].ToString() : string.Empty,
                            TipoMaterial = reader["TipoMaterial"] != DBNull.Value ? reader["TipoMaterial"].ToString() : string.Empty,
                            HoraEstimadaFormateada = reader["HoraEstimadaFormateada"] != DBNull.Value ? reader["HoraEstimadaFormateada"].ToString() : string.Empty,
                            EstadoRecorrido = reader["EstadoRecorrido"] != DBNull.Value ? reader["EstadoRecorrido"].ToString() : string.Empty
                        });
                    }
                }
            }
            return lista;
        }

        /// <summary>
        /// Inserta una nueva parada/detalle en la Hoja de Ruta y devuelve el IdDetalle autogenerado.
        /// </summary>
        public int Insertar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_InsertarDetalleHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", Id_HojaRuta);
                sqlCom.Parameters.AddWithValue("@Id_TipoMovimiento", Id_TipoMovimiento);

                // Conversión con DBNull para claves foráneas opcionales
                sqlCom.Parameters.AddWithValue("@Id_RecursoMov", Id_RecursoMov > 0 ? (object)Id_RecursoMov : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Origen", Id_Origen > 0 ? (object)Id_Origen : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_TipoMaterial", Id_TipoMaterial > 0 ? (object)Id_TipoMaterial : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@HoraEstimada", HoraEstimada != TimeSpan.Zero ? (object)HoraEstimada : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Estado", Id_Estado > 0 ? (object)Id_Estado : DBNull.Value);

                sqlCnn.Open();
                return Convert.ToInt32(sqlCom.ExecuteScalar());
            }
        }

        /// <summary>
        /// Actualiza una parada individual de la Hoja de Ruta, permitiendo reasignar 
        /// la parada a otra Hoja de Ruta (ej. por avería del vehículo o imprevistos).
        /// </summary>
        public bool Modificar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarDetalleHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@Id_Detalle_HDR", Id_Detalle_HDR);
                // Enviamos el Id_HojaRuta para permitir el re-traspaso de la parada si hubo contingencias
                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", Id_HojaRuta);
                sqlCom.Parameters.AddWithValue("@Id_TipoMovimiento", Id_TipoMovimiento);
                sqlCom.Parameters.AddWithValue("@Id_RecursoMov", Id_RecursoMov > 0 ? (object)Id_RecursoMov : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Origen", Id_Origen > 0 ? (object)Id_Origen : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_TipoMaterial", Id_TipoMaterial > 0 ? (object)Id_TipoMaterial : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@HoraEstimada", HoraEstimada != TimeSpan.Zero ? (object)HoraEstimada : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Estado", Id_Estado > 0 ? (object)Id_Estado : DBNull.Value);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        /// <summary>
        /// Elimina físicamente una parada de la Hoja de Ruta.
        /// </summary>
        public bool Borrar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_EliminarDetalleHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@Id_Detalle_HDR", Id_Detalle_HDR);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }
    }
}


//using System;
//using System.Collections.Generic;
//using System.Configuration;
//using System.Data;
//using System.Data.SqlClient;

//namespace API_SITMAS.Models
//{
//    public class DetalleHojaRuta
//    {
//        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

//        public int Id_Detalle_HDR { get; set; }
//        public int Id_HojaRuta { get; set; }
//        public int Id_TipoMovimiento { get; set; }
//        public int Id_RecursoMov { get; set; }
//        public int Id_Origen { get; set; }
//        public int Id_TipoMaterial { get; set; }
//        public TimeSpan HoraEstimada { get; set; }
//        public int Id_Estado { get; set; }

//        // Propiedades de lectura mapeadas desde la Vista (vw_Detalle_HojaRuta)
//        public string TipoMovimiento { get; set; }
//        public string RecursoMovilizado { get; set; }
//        public string Origen { get; set; }
//        public string TipoMaterial { get; set; }
//        public string HoraEstimadaFormateada { get; set; }
//        public string EstadoRecorrido { get; set; }

//        public List<DetalleHojaRuta> ObtenerPorHojaRuta(int idHojaRuta)
//        {
//            var lista = new List<DetalleHojaRuta>();

//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand("sp_ListarDetalleHDR", sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", idHojaRuta);

//                sqlCnn.Open();
//                using (SqlDataReader reader = sqlCom.ExecuteReader())
//                {
//                    while (reader.Read())
//                    {
//                        lista.Add(new DetalleHojaRuta
//                        {
//                            Id_Detalle_HDR = Convert.ToInt32(reader["Id_Detalle"]),
//                            Id_HojaRuta = Convert.ToInt32(reader["Numero_HojaRuta"]),
//                            TipoMovimiento = reader["TipoMovimiento"].ToString(),
//                            RecursoMovilizado = reader["RecursoMovilizado"].ToString(),
//                            Origen = reader["Origen"].ToString(),
//                            TipoMaterial = reader["TipoMaterial"].ToString(),
//                            HoraEstimadaFormateada = reader["HoraEstimadaFormateada"].ToString(),
//                            EstadoRecorrido = reader["EstadoRecorrido"].ToString()
//                        });
//                    }
//                }
//            }
//            return lista;
//        }

//        public int Insertar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand("sp_InsertarDetalleHDR", sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", Id_HojaRuta);
//                sqlCom.Parameters.AddWithValue("@Id_TipoMovimiento", Id_TipoMovimiento);
//                sqlCom.Parameters.AddWithValue("@Id_RecursoMov", Id_RecursoMov);
//                sqlCom.Parameters.AddWithValue("@Id_Origen", Id_Origen);
//                sqlCom.Parameters.AddWithValue("@Id_TipoMaterial", Id_TipoMaterial);
//                sqlCom.Parameters.AddWithValue("@HoraEstimada", HoraEstimada);
//                sqlCom.Parameters.AddWithValue("@Id_Estado", Id_Estado);

//                sqlCnn.Open();
//                return Convert.ToInt32(sqlCom.ExecuteScalar());


//            }
//        }

//        public bool Modificar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarDetalleHDR", sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.AddWithValue("@Id_Detalle_HDR", Id_Detalle_HDR);
//                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", Id_HojaRuta);
//                sqlCom.Parameters.AddWithValue("@Id_TipoMovimiento", Id_TipoMovimiento);
//                sqlCom.Parameters.AddWithValue("@Id_RecursoMov", Id_RecursoMov);
//                sqlCom.Parameters.AddWithValue("@Id_Origen", Id_Origen);
//                sqlCom.Parameters.AddWithValue("@Id_TipoMaterial", Id_TipoMaterial);
//                sqlCom.Parameters.AddWithValue("@HoraEstimada", HoraEstimada);
//                sqlCom.Parameters.AddWithValue("@Id_Estado", Id_Estado);

//                sqlCnn.Open();
//                return sqlCom.ExecuteNonQuery() > 0;
//            }
//        }

//        public bool Borrar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand("sp_EliminarDetalleHDR", sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.AddWithValue("@Id_Detalle_HDR", Id_Detalle_HDR);

//                sqlCnn.Open();
//                return sqlCom.ExecuteNonQuery() > 0;
//            }
//        }

//    }
//}





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