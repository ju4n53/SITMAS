using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    
    public class DTO_HojaRutaCabecera
    {
        public int Id { get; set; }
        public DateTime HojaRutaFecha { get; set; }
        public int Id_Vehiculo { get; set; }
        public int? Id_Chofer { get; set; }
        public int? Id_Estado { get; set; }
        public string FechaFormateada { get; set; }
        public string Vehiculo { get; set; }
        public string ChoferNombreCompleto { get; set; }
        public string Estado { get; set; }
        public decimal Distancia_Total_Estimada_Km { get; set; }
    }

    
    public class ReportesLogisticaDatos
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        public List<DTO_HojaRutaCabecera> ObtenerUsoVehiculos(DateTime fechaDesde, DateTime fechaHasta)
        {
            var lista = new List<DTO_HojaRutaCabecera>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            {
                using (SqlCommand sqlCom = new SqlCommand("sp_Reporte_UsoVehiculos", sqlCnn))
                {
                    sqlCom.CommandType = CommandType.StoredProcedure;
                    sqlCom.Parameters.AddWithValue("@FechaDesde", fechaDesde);
                    sqlCom.Parameters.AddWithValue("@FechaHasta", fechaHasta);

                    sqlCnn.Open();

                    using (SqlDataReader reader = sqlCom.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new DTO_HojaRutaCabecera
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                HojaRutaFecha = Convert.ToDateTime(reader["HojaRutaFecha"]),
                                Id_Vehiculo = Convert.ToInt32(reader["Id_Vehiculo"]),
                                Id_Chofer = reader["Id_Chofer"] != DBNull.Value ? Convert.ToInt32(reader["Id_Chofer"]) : (int?)null,
                                Id_Estado = reader["Id_Estado"] != DBNull.Value ? Convert.ToInt32(reader["Id_Estado"]) : (int?)null,
                                FechaFormateada = reader["FechaFormateada"].ToString(),
                                Vehiculo = reader["Vehiculo"].ToString(),
                                ChoferNombreCompleto = reader["ChoferNombreCompleto"].ToString(),
                                Estado = reader["Estado"].ToString(),
                                Distancia_Total_Estimada_Km = Convert.ToDecimal(reader["Distancia_Total_Estimada_Km"])
                            });
                        }
                    }
                }
            }
            return lista;
        }
    }
}