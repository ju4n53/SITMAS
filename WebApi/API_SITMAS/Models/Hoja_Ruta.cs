using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class HojaRuta
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

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

        public List<HojaRuta> SelectAll()
        {
            var lista = new List<HojaRuta>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new HojaRuta
                        {
                            Id = Convert.ToInt32(reader["Id_HojaRuta"]),
                            FechaFormateada = reader["FechaFormateada"] != DBNull.Value ? reader["FechaFormateada"].ToString() : string.Empty,
                            Vehiculo = reader["Vehiculo"] != DBNull.Value ? reader["Vehiculo"].ToString() : "Sin Vehículo",
                            ChoferNombreCompleto = reader["ChoferNombreCompleto"] != DBNull.Value ? reader["ChoferNombreCompleto"].ToString() : "Sin Chofer",
                            Id_Estado = reader["Id_Estado"] != DBNull.Value ? Convert.ToInt32(reader["Id_Estado"]) : (int?)null,
                            Estado = reader["Estado"] != DBNull.Value ? reader["Estado"].ToString() : "Pendiente",
                            Distancia_Total_Estimada_Km = reader["Distancia_Total_Estimada_Km"] != DBNull.Value ? Convert.ToDecimal(reader["Distancia_Total_Estimada_Km"]) : 0m
                        });
                    }
                }
            }
            return lista;
        }

        /// <summary>
        /// Trae únicamente las Hojas de Ruta de la fecha actual usando sp_ListarHDR_HOY
        /// </summary>
        public List<HojaRuta> SelectHoy()
        {
            var lista = new List<HojaRuta>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarHDR_HOY", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new HojaRuta
                        {
                            // 👈 Mapeamos: Propiedad de C# = Columna de la Vista SQL
                            Id = Convert.ToInt32(reader["Numero_HojaRuta"]),
                            HojaRutaFecha = Convert.ToDateTime(reader["HojaRutaFecha"]),
                            Id_Vehiculo = reader["Id_Vehiculo"] != DBNull.Value ? Convert.ToInt32(reader["Id_Vehiculo"]) : 0,
                            Vehiculo = reader["Patente"] != DBNull.Value ? reader["Patente"].ToString() : "Sin Vehículo",
                            Id_Chofer = reader["Id_Chofer"] != DBNull.Value ? Convert.ToInt32(reader["Id_Chofer"]) : (int?)null,
                            ChoferNombreCompleto = reader["Nombre_Chofer"] != DBNull.Value ? reader["Nombre_Chofer"].ToString() : "Sin Chofer",
                            Id_Estado = reader["Id_Estado"] != DBNull.Value ? Convert.ToInt32(reader["Id_Estado"]) : (int?)null,
                            Estado = reader["Estado_Descripcion"] != DBNull.Value ? reader["Estado_Descripcion"].ToString() : "Pendiente",
                            Distancia_Total_Estimada_Km = reader["Distancia_Total_Estimada_Km"] != DBNull.Value ? Convert.ToDecimal(reader["Distancia_Total_Estimada_Km"]) : 0m
                        });
                    }
                }
            }
            return lista;
        }

        public HojaRuta ObtenerPorId(int id)
        {
            HojaRuta oHojaRuta = null;

            string query = "SELECT Id, HojaRutaFecha, Id_Vehiculo, Id_Chofer, Id_Estado, Distancia_Total_Estimada_Km FROM dbo.Hoja_Ruta WHERE Id = @Id";

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand(query, sqlCnn))
            {
                sqlCom.CommandType = CommandType.Text;
                sqlCom.Parameters.AddWithValue("@Id", id);

                sqlCnn.Open();
                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        oHojaRuta = new HojaRuta
                        {
                            Id = Convert.ToInt32(reader["Id"]),
                            HojaRutaFecha = Convert.ToDateTime(reader["HojaRutaFecha"]),
                            Id_Vehiculo = reader["Id_Vehiculo"] != DBNull.Value ? Convert.ToInt32(reader["Id_Vehiculo"]) : 0,
                            Id_Chofer = reader["Id_Chofer"] != DBNull.Value ? Convert.ToInt32(reader["Id_Chofer"]) : (int?)null,
                            Id_Estado = reader["Id_Estado"] != DBNull.Value ? Convert.ToInt32(reader["Id_Estado"]) : (int?)null,
                            Distancia_Total_Estimada_Km = reader["Distancia_Total_Estimada_Km"] != DBNull.Value ? Convert.ToDecimal(reader["Distancia_Total_Estimada_Km"]) : 0m
                        };
                    }
                }
            }
            return oHojaRuta;
        }

        public int Insertar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_InsertarHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@HojaRutaFecha", HojaRutaFecha);
                sqlCom.Parameters.AddWithValue("@Id_Vehiculo", Id_Vehiculo > 0 ? (object)Id_Vehiculo : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Chofer", Id_Chofer.HasValue && Id_Chofer.Value > 0 ? (object)Id_Chofer.Value : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Estado", Id_Estado.HasValue && Id_Estado.Value > 0 ? (object)Id_Estado.Value : 1);

                sqlCnn.Open();
                return Convert.ToInt32(sqlCom.ExecuteScalar());
            }
        }

        public bool Modificar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@Id", Id);
                sqlCom.Parameters.AddWithValue("@HojaRutaFecha", HojaRutaFecha);
                sqlCom.Parameters.AddWithValue("@Id_Vehiculo", Id_Vehiculo > 0 ? (object)Id_Vehiculo : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Chofer", Id_Chofer.HasValue && Id_Chofer.Value > 0 ? (object)Id_Chofer.Value : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@Id_Estado", Id_Estado.HasValue && Id_Estado.Value > 0 ? (object)Id_Estado.Value : DBNull.Value);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        public bool Borrar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_EliminarHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@Id", Id);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        /// <summary>
        /// 🛠️ NUEVO MÉTODO: Actualiza únicamente la distancia total calculada del circuito.
        /// Requiere en SQL: sp_ActualizarDistanciaTotalHDR @Id INT, @DistanciaTotal DECIMAL(8,2)
        /// </summary>
        public bool ActualizarDistanciaTotal(decimal distanciaTotal)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarDistanciaTotalHDR", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@Id", Id);
                sqlCom.Parameters.AddWithValue("@DistanciaTotal", distanciaTotal);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        /// <summary>
        /// Llama al SP para iniciar el viaje, validando estado y asignando el chofer.
        /// </summary>
        public void IniciarViaje(int idHojaRuta, int idUsuario)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_IniciarHojaRuta", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", idHojaRuta);
                sqlCom.Parameters.AddWithValue("@Id_Usuario", idUsuario);

                sqlCnn.Open();
                // Usamos ExecuteNonQuery porque es un UPDATE. 
                // Si el SP arroja un RAISERROR, C# lo capturará como una SqlException.
                sqlCom.ExecuteNonQuery();
            }
        }

        /// <summary>
        /// Llama al SP para finalizar el viaje, cerrar tareas y registrar la distancia total.
        /// </summary>
        public void FinalizarViaje(int idHojaRuta, decimal distanciaFinal)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_FinalizarHojaRuta", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", idHojaRuta);
                sqlCom.Parameters.AddWithValue("@Distancia_Final", distanciaFinal);

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }
        }

        public List<HojaRuta> SelectPorRangoFechas(DateTime fechaDesde, DateTime fechaHasta)
        {
            var lista = new List<HojaRuta>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarHDR_PorRangoFechas", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                // Pasamos los parámetros de fecha al SP
                sqlCom.Parameters.AddWithValue("@FechaDesde", fechaDesde.Date);
                sqlCom.Parameters.AddWithValue("@FechaHasta", fechaHasta.Date);

                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new HojaRuta
                        {
                            Id = Convert.ToInt32(reader["Numero_HojaRuta"]),
                            HojaRutaFecha = Convert.ToDateTime(reader["HojaRutaFecha"]),
                            Id_Vehiculo = reader["Id_Vehiculo"] != DBNull.Value ? Convert.ToInt32(reader["Id_Vehiculo"]) : 0,
                            Vehiculo = reader["Patente"] != DBNull.Value ? reader["Patente"].ToString() : "Sin Vehículo",
                            Id_Chofer = reader["Id_Chofer"] != DBNull.Value ? Convert.ToInt32(reader["Id_Chofer"]) : (int?)null,
                            ChoferNombreCompleto = reader["Nombre_Chofer"] != DBNull.Value ? reader["Nombre_Chofer"].ToString() : "Sin Chofer",
                            Id_Estado = reader["Id_Estado"] != DBNull.Value ? Convert.ToInt32(reader["Id_Estado"]) : (int?)null,
                            Estado = reader["Estado_Descripcion"] != DBNull.Value ? reader["Estado_Descripcion"].ToString() : "Pendiente",
                            Distancia_Total_Estimada_Km = reader["Distancia_Total_Estimada_Km"] != DBNull.Value ? Convert.ToDecimal(reader["Distancia_Total_Estimada_Km"]) : 0m
                        });
                    }
                }
            }
            return lista;
        }

    }
}
