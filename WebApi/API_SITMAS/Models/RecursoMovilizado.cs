using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class RecursoMovilizado
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public int IdRecursoMov { get; set; }
        public string Recurso_Movilizado { get; set; }

        /// <summary>
        /// Obtiene todos los recursos movilizados registrados para cargar en los desplegables.
        /// </summary>
        public List<RecursoMovilizado> SelectAll()
        {
            var lista = new List<RecursoMovilizado>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarRecursosMovilizados", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new RecursoMovilizado
                        {
                            IdRecursoMov = Convert.ToInt32(reader["IdRecursoMov"]),
                            Recurso_Movilizado = reader["Recurso_Movilizado"] != DBNull.Value ? reader["Recurso_Movilizado"].ToString() : string.Empty
                        });
                    }
                }
            }
            return lista;
        }
    }
}