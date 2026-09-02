using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class TipoMovimiento
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public int IdTipoMovimientos { get; set; }
        public string TipoMovimientos { get; set; }

        /// <summary>
        /// Obtiene todos los tipos de movimiento registrados para cargar en los desplegables.
        /// </summary>
        public List<TipoMovimiento> SelectAll()
        {
            var lista = new List<TipoMovimiento>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarTipoMovimientos", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new TipoMovimiento
                        {
                            IdTipoMovimientos = Convert.ToInt32(reader["IdTipoMovimientos"]),
                            TipoMovimientos = reader["TipoMovimientos"] != DBNull.Value ? reader["TipoMovimientos"].ToString() : string.Empty
                        });
                    }
                }
            }
            return lista;
        }
    }
}