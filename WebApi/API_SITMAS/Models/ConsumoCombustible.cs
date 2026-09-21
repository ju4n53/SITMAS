using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class ConsumoCombustible
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        // Entidad transaccional
        public int Id_Consumo { get; set; }
        public int IdRegistroodomet { get; set; }
        public int Id_Combustible { get; set; }
        public decimal Valor_KM { get; set; }

        // Propiedades DTO / Lectura descriptivas (provistas por JOINs en el SP)
        public string Patente { get; set; }
        public string Tipo_combustible { get; set; }
        public decimal PrecioUnitarioAplicado { get; set; }
        public decimal KilometrosRecorridos { get; set; }
        public decimal CostoTotalCalculado { get; set; }

        /// <summary>
        /// Obtiene el listado transaccional de consumos con detalles de vehículo y combustible.
        /// </summary>
        public List<ConsumoCombustible> ObtenerTodos()
        {
            var lista = new List<ConsumoCombustible>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarConsumosCombustible", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new ConsumoCombustible
                        {
                            Id_Consumo = Convert.ToInt32(reader["Id_Consumo"]),
                            IdRegistroodomet = Convert.ToInt32(reader["IdRegistroodomet"]),
                            Patente = reader["Patente"] != DBNull.Value ? reader["Patente"].ToString() : string.Empty,
                            Tipo_combustible = reader["Tipo_combustible"] != DBNull.Value ? reader["Tipo_combustible"].ToString() : string.Empty,
                            PrecioUnitarioAplicado = reader["PrecioUnitarioAplicado"] != DBNull.Value ? Convert.ToDecimal(reader["PrecioUnitarioAplicado"]) : 0,
                            KilometrosRecorridos = reader["KilometrosRecorridos"] != DBNull.Value ? Convert.ToDecimal(reader["KilometrosRecorridos"]) : 0,
                            CostoTotalCalculado = reader["CostoTotalCalculado"] != DBNull.Value ? Convert.ToDecimal(reader["CostoTotalCalculado"]) : 0
                        });
                    }
                }
            }
            return lista;
        }

        /// <summary>
        /// Permite ajustar manualmente un registro de consumo.
        /// </summary>
        public bool Modificar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarConsumoCombustible", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@Id_Consumo", Id_Consumo);
                sqlCom.Parameters.AddWithValue("@Id_Combustible", Id_Combustible);
                sqlCom.Parameters.AddWithValue("@Valor_KM", Valor_KM);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }
    }
}