using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class UbicacionGeografica
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        #region Propiedades de la Entidad

        public int IdUbicacion { get; set; }
        public string Descripcion { get; set; }
        public decimal Latitud { get; set; }
        public decimal Longitud { get; set; }

        #endregion

        #region Métodos de Acceso a Datos

        /// <summary>
        /// Obtiene el listado completo de ubicaciones geográficas registradas.
        /// </summary>
        public List<UbicacionGeografica> ObtenerTodas()
        {
            var lista = new List<UbicacionGeografica>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarUbicacionesGeograficas", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCnn.Open();
                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new UbicacionGeografica
                        {
                            IdUbicacion = Convert.ToInt32(reader["IdUbicacion"]),
                            Descripcion = reader["Descripcion"] != DBNull.Value ? reader["Descripcion"].ToString() : string.Empty,
                            Latitud = Convert.ToDecimal(reader["Latitud"]),
                            Longitud = Convert.ToDecimal(reader["Longitud"])
                        });
                    }
                }
            }
            return lista;
        }

        /// <summary>
        /// Obtiene los detalles de una ubicación específica según su ID.
        /// </summary>
        public UbicacionGeografica ObtenerPorId(int idUbicacion)
        {
            UbicacionGeografica ubicacion = null;

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ObtenerUbicacionGeograficaPorId", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@IdUbicacion", idUbicacion);

                sqlCnn.Open();
                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        ubicacion = new UbicacionGeografica
                        {
                            IdUbicacion = Convert.ToInt32(reader["IdUbicacion"]),
                            Descripcion = reader["Descripcion"] != DBNull.Value ? reader["Descripcion"].ToString() : string.Empty,
                            Latitud = Convert.ToDecimal(reader["Latitud"]),
                            Longitud = Convert.ToDecimal(reader["Longitud"])
                        };
                    }
                }
            }
            return ubicacion;
        }

        /// <summary>
        /// Inserta una nueva ubicación geográfica y devuelve el IdUbicacion autogenerado.
        /// </summary>
        public int Insertar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_InsertarUbicacionGeografica", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@Descripcion", !string.IsNullOrEmpty(Descripcion) ? (object)Descripcion : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Latitud", Latitud);
                sqlCom.Parameters.AddWithValue("@Longitud", Longitud);

                sqlCnn.Open();
                return Convert.ToInt32(sqlCom.ExecuteScalar());
            }
        }

        /// <summary>
        /// Actualiza los datos de una ubicación geográfica existente.
        /// </summary>
        public bool Modificar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarUbicacionGeografica", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@IdUbicacion", IdUbicacion);
                sqlCom.Parameters.AddWithValue("@Descripcion", !string.IsNullOrEmpty(Descripcion) ? (object)Descripcion : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Latitud", Latitud);
                sqlCom.Parameters.AddWithValue("@Longitud", Longitud);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        /// <summary>
        /// Elimina físicamente una ubicación geográfica por ID.
        /// </summary>
        public bool Borrar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_EliminarUbicacionGeografica", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@IdUbicacion", IdUbicacion);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        #endregion
    }
}