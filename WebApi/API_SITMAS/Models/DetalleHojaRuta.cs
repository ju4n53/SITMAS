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
        public int? Id_Origen { get; set; }
        public int Id_TipoMaterial { get; set; }
        public TimeSpan HoraEstimada { get; set; }
        public int Id_Estado { get; set; }
        public int? Id_Ubicacion { get; set; }

        // 🗺️ Propiedades Geográficas (Pueden ser nulls si la parada no tiene coordenadas)
        public decimal? Latitud { get; set; }
        public decimal? Longitud { get; set; }

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

                            // 🔑 Mapeo de IDs numéricos
                            Id_TipoMovimiento = reader["Id_TipoMovimiento"] != DBNull.Value ? Convert.ToInt32(reader["Id_TipoMovimiento"]) : 0,
                            Id_RecursoMov = reader["Id_RecursoMov"] != DBNull.Value ? Convert.ToInt32(reader["Id_RecursoMov"]) : 0,
                            Id_Origen = reader["Id_Origen"] != DBNull.Value ? Convert.ToInt32(reader["Id_Origen"]) : 0,
                            Id_TipoMaterial = reader["Id_TipoMaterial"] != DBNull.Value ? Convert.ToInt32(reader["Id_TipoMaterial"]) : 0,
                            Id_Estado = reader["Id_Estado"] != DBNull.Value ? Convert.ToInt32(reader["Id_Estado"]) : 0,
                            Id_Ubicacion = reader["Id_Ubicacion"] != DBNull.Value ? Convert.ToInt32(reader["Id_Ubicacion"]) : (int?)null,

                            // 🗺️ Mapeo de Coordenadas Geográficas desde el reader
                            Latitud = reader["Latitud"] != DBNull.Value ? Convert.ToDecimal(reader["Latitud"]) : (decimal?)null,
                            Longitud = reader["Longitud"] != DBNull.Value ? Convert.ToDecimal(reader["Longitud"]) : (decimal?)null,

                            // Descripciones textuales para la grilla
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
                sqlCom.Parameters.AddWithValue("@Id_RecursoMov", Id_RecursoMov > 0 ? (object)Id_RecursoMov : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Origen", Id_Origen > 0 ? (object)Id_Origen : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_TipoMaterial", Id_TipoMaterial > 0 ? (object)Id_TipoMaterial : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@HoraEstimada", HoraEstimada != TimeSpan.Zero ? (object)HoraEstimada : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Estado", Id_Estado > 0 ? (object)Id_Estado : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Ubicacion", Id_Ubicacion > 0 ? (object)Id_Ubicacion : DBNull.Value);

                sqlCnn.Open();
                return Convert.ToInt32(sqlCom.ExecuteScalar());
            }
        }

        /// <summary>
        /// Actualiza una parada individual de la Hoja de Ruta.
        /// </summary>
        public bool Modificar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarDetalleHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@Id_Detalle_HDR", Id_Detalle_HDR);
                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", Id_HojaRuta);
                sqlCom.Parameters.AddWithValue("@Id_TipoMovimiento", Id_TipoMovimiento);
                sqlCom.Parameters.AddWithValue("@Id_RecursoMov", Id_RecursoMov > 0 ? (object)Id_RecursoMov : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Origen", Id_Origen > 0 ? (object)Id_Origen : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_TipoMaterial", Id_TipoMaterial > 0 ? (object)Id_TipoMaterial : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@HoraEstimada", HoraEstimada != TimeSpan.Zero ? (object)HoraEstimada : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Estado", Id_Estado > 0 ? (object)Id_Estado : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Ubicacion", Id_Ubicacion > 0 ? (object)Id_Ubicacion : DBNull.Value);

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




