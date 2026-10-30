using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class Combustible
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public int Id_Combustible { get; set; }
        public string Tipo_combustible { get; set; }
        public decimal Precio_valor { get; set; }

        /// <summary>
        /// Obtiene el catálogo de tipos de combustible con su precio actual.
        /// </summary>
        public List<Combustible> ObtenerTodos()
        {
            var lista = new List<Combustible>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarCombustibles", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new Combustible
                        {
                            Id_Combustible = Convert.ToInt32(reader["Id_Combustible"]),
                            Tipo_combustible = reader["Tipo_combustible"].ToString(),
                            Precio_valor = Convert.ToDecimal(reader["Precio_valor"])
                        });
                    }
                }
            }
            return lista;
        }

        /// <summary>
        /// Actualiza el precio por litro/unidad de un combustible específico.
        /// </summary>
        public bool ActualizarPrecio()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarPrecioCombustible", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@Id_Combustible", Id_Combustible);
                sqlCom.Parameters.AddWithValue("@Precio_valor", Precio_valor);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }
    }
}