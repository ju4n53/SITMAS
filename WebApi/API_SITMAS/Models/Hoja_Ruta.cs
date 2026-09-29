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
    }
}



//using System;
//using System.Collections.Generic;
//using System.Configuration;
//using System.Data;
//using System.Data.SqlClient;

//namespace API_SITMAS.Models
//{
//    public class HojaRuta
//    {
//        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

//        // Entidades y claves foráneas
//        public int Id { get; set; }
//        public DateTime HojaRutaFecha { get; set; }
//        public int Id_Vehiculo { get; set; }
//        public int? Id_Chofer { get; set; }

//        // 🛠️ NUEVA PROPIEDAD: Estado
//        public int? Id_Estado { get; set; }

//        // Propiedades de lectura / descriptivas (desde la Vista)
//        public string FechaFormateada { get; set; }
//        public string Vehiculo { get; set; }
//        public string ChoferNombreCompleto { get; set; }
//        public string Estado { get; set; } // 👈 Texto del estado (Pendiente, Asignado, En Curso, Finalizado)

//        // 📏 Distancia Total
//        public decimal Distancia_Total_Estimada_Km { get; set; }

//        /// <summary>
//        /// Obtiene todas las Hojas de Ruta registradas desde la Vista vw_HojaRuta_Cabecera.
//        /// </summary>
//        public List<HojaRuta> SelectAll()
//        {
//            var lista = new List<HojaRuta>();

//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand("sp_ListarHDR", sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCnn.Open();

//                using (SqlDataReader reader = sqlCom.ExecuteReader())
//                {
//                    while (reader.Read())
//                    {
//                        lista.Add(new HojaRuta
//                        {
//                            Id = Convert.ToInt32(reader["Id_HojaRuta"]),
//                            FechaFormateada = reader["FechaFormateada"] != DBNull.Value ? reader["FechaFormateada"].ToString() : string.Empty,
//                            Vehiculo = reader["Vehiculo"] != DBNull.Value ? reader["Vehiculo"].ToString() : "Sin Vehículo",
//                            ChoferNombreCompleto = reader["ChoferNombreCompleto"] != DBNull.Value ? reader["ChoferNombreCompleto"].ToString() : "Sin Chofer",

//                            // 🛠️ Leemos el estado desde la Vista
//                            Id_Estado = reader["Id_Estado"] != DBNull.Value ? Convert.ToInt32(reader["Id_Estado"]) : (int?)null,
//                            Estado = reader["Estado"] != DBNull.Value ? reader["Estado"].ToString() : "Pendiente",

//                            // 📏 Distancia total
//                            Distancia_Total_Estimada_Km = reader["Distancia_Total_Estimada_Km"] != DBNull.Value ? Convert.ToDecimal(reader["Distancia_Total_Estimada_Km"]) : 0m
//                        });
//                    }
//                }
//            }
//            return lista;
//        }

//        /// <summary>
//        /// Obtiene una Hoja de Ruta específica por su ID.
//        /// </summary>
//        public HojaRuta ObtenerPorId(int id)
//        {
//            HojaRuta oHojaRuta = null;

//            string query = "SELECT Id, HojaRutaFecha, Id_Vehiculo, Id_Chofer, Id_Estado FROM dbo.Hoja_Ruta WHERE Id = @Id";

//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand(query, sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.Text;
//                sqlCom.Parameters.AddWithValue("@Id", id);

//                sqlCnn.Open();
//                using (SqlDataReader reader = sqlCom.ExecuteReader())
//                {
//                    if (reader.Read())
//                    {
//                        oHojaRuta = new HojaRuta
//                        {
//                            Id = Convert.ToInt32(reader["Id"]),
//                            HojaRutaFecha = Convert.ToDateTime(reader["HojaRutaFecha"]),
//                            Id_Vehiculo = reader["Id_Vehiculo"] != DBNull.Value ? Convert.ToInt32(reader["Id_Vehiculo"]) : 0,
//                            Id_Chofer = reader["Id_Chofer"] != DBNull.Value ? Convert.ToInt32(reader["Id_Chofer"]) : (int?)null,
//                            Id_Estado = reader["Id_Estado"] != DBNull.Value ? Convert.ToInt32(reader["Id_Estado"]) : (int?)null
//                        };
//                    }
//                }
//            }
//            return oHojaRuta;
//        }

//        /// <summary>
//        /// Inserta una nueva cabecera (por defecto nace en Pendiente = 1 si no se indica otro).
//        /// </summary>
//        public int Insertar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand("sp_InsertarHDR", sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                sqlCom.Parameters.AddWithValue("@HojaRutaFecha", HojaRutaFecha);
//                sqlCom.Parameters.AddWithValue("@Id_Vehiculo", Id_Vehiculo > 0 ? (object)Id_Vehiculo : DBNull.Value);
//                sqlCom.Parameters.AddWithValue("@Id_Chofer", Id_Chofer.HasValue && Id_Chofer.Value > 0 ? (object)Id_Chofer.Value : DBNull.Value);

//                // 🛠️ Le enviamos el Estado
//                sqlCom.Parameters.AddWithValue("@Id_Estado", Id_Estado.HasValue && Id_Estado.Value > 0 ? (object)Id_Estado.Value : 1);

//                sqlCnn.Open();
//                return Convert.ToInt32(sqlCom.ExecuteScalar());
//            }
//        }

//        /// <summary>
//        /// Modifica los datos de una cabecera existente.
//        /// </summary>
//        public bool Modificar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarHDR", sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.AddWithValue("@Id", Id);
//                sqlCom.Parameters.AddWithValue("@HojaRutaFecha", HojaRutaFecha);
//                sqlCom.Parameters.AddWithValue("@Id_Vehiculo", Id_Vehiculo > 0 ? (object)Id_Vehiculo : DBNull.Value);
//                sqlCom.Parameters.AddWithValue("@Id_Chofer", Id_Chofer.HasValue && Id_Chofer.Value > 0 ? (object)Id_Chofer.Value : DBNull.Value);

//                // 🛠️ Mantenemos o actualizamos el Estado
//                sqlCom.Parameters.AddWithValue("@Id_Estado", Id_Estado.HasValue && Id_Estado.Value > 0 ? (object)Id_Estado.Value : DBNull.Value);

//                sqlCnn.Open();
//                return sqlCom.ExecuteNonQuery() > 0;
//            }
//        }

//        /// <summary>
//        /// Eliminación de cabecera.
//        /// </summary>
//        public bool Borrar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand("sp_EliminarHDR", sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.AddWithValue("@Id", Id);

//                sqlCnn.Open();
//                return sqlCom.ExecuteNonQuery() > 0;
//            }
//        }
//    }
//}





//using System;
//using System.Collections.Generic;
//using System.Configuration;
//using System.Data;
//using System.Data.SqlClient;

//namespace API_SITMAS.Models
//{
//    public class HojaRuta
//    {
//        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

//        // Entidades y claves foráneas (para INSERT, UPDATE y carga de combos en Front)
//        public int Id { get; set; }
//        public DateTime HojaRutaFecha { get; set; }
//        public int Id_Vehiculo { get; set; }
//        public int? Id_Chofer { get; set; }

//        // Propiedades de lectura e información descriptiva (desde la Vista o JOIN)
//        public string FechaFormateada { get; set; }
//        public string Vehiculo { get; set; }
//        public string ChoferNombreCompleto { get; set; }

//        // 📏 NUEVA PROPIEDAD: Distancia Total de la Hoja de Ruta
//        public decimal Distancia_Total_Estimada_Km { get; set; }

//        /// <summary>
//        /// Obtiene todas las Hojas de Ruta registradas.
//        /// </summary>
//        public List<HojaRuta> SelectAll()
//        {
//            var lista = new List<HojaRuta>();

//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand("sp_ListarHDR", sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCnn.Open();

//                using (SqlDataReader reader = sqlCom.ExecuteReader())
//                {
//                    while (reader.Read())
//                    {
//                        lista.Add(new HojaRuta
//                        {
//                            Id = Convert.ToInt32(reader["Id_HojaRuta"]),
//                            FechaFormateada = reader["FechaFormateada"] != DBNull.Value ? reader["FechaFormateada"].ToString() : string.Empty,
//                            Vehiculo = reader["Vehiculo"] != DBNull.Value ? reader["Vehiculo"].ToString() : "Sin Vehículo",
//                            ChoferNombreCompleto = reader["ChoferNombreCompleto"] != DBNull.Value ? reader["ChoferNombreCompleto"].ToString() : "Sin Chofer",

//                            // 📏 Mapeo del campo calculado por el Trigger desde la Vista
//                            Distancia_Total_Estimada_Km = reader["Distancia_Total_Estimada_Km"] != DBNull.Value ? Convert.ToDecimal(reader["Distancia_Total_Estimada_Km"]) : 0m
//                        });
//                    }
//                }
//            }
//            return lista;
//        }

//        /// <summary>
//        /// Obtiene una Hoja de Ruta específica por su ID incluyendo las claves foráneas para edición.
//        /// </summary>
//        public HojaRuta ObtenerPorId(int id)
//        {
//            HojaRuta oHojaRuta = null;

//            string query = "SELECT Id, HojaRutaFecha, Id_Vehiculo, Id_Chofer FROM dbo.Hoja_Ruta WHERE Id = @Id";

//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand(query, sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.Text;
//                sqlCom.Parameters.AddWithValue("@Id", id);

//                sqlCnn.Open();
//                using (SqlDataReader reader = sqlCom.ExecuteReader())
//                {
//                    if (reader.Read())
//                    {
//                        oHojaRuta = new HojaRuta
//                        {
//                            Id = Convert.ToInt32(reader["Id"]),
//                            HojaRutaFecha = Convert.ToDateTime(reader["HojaRutaFecha"]),
//                            Id_Vehiculo = reader["Id_Vehiculo"] != DBNull.Value ? Convert.ToInt32(reader["Id_Vehiculo"]) : 0,
//                            Id_Chofer = reader["Id_Chofer"] != DBNull.Value ? Convert.ToInt32(reader["Id_Chofer"]) : 0
//                        };
//                    }
//                }
//            }
//            return oHojaRuta;
//        }

//        /// <summary>
//        /// Inserta una nueva cabecera y retorna el ID autogenerado.
//        /// </summary>
//        public int Insertar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand("sp_InsertarHDR", sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                sqlCom.Parameters.AddWithValue("@HojaRutaFecha", HojaRutaFecha);
//                sqlCom.Parameters.AddWithValue("@Id_Vehiculo", Id_Vehiculo > 0 ? (object)Id_Vehiculo : DBNull.Value);
//                sqlCom.Parameters.AddWithValue("@Id_Chofer", Id_Chofer.HasValue && Id_Chofer.Value > 0 ? (object)Id_Chofer.Value : DBNull.Value);

//                sqlCnn.Open();
//                return Convert.ToInt32(sqlCom.ExecuteScalar());
//            }
//        }

//        /// <summary>
//        /// Modifica los datos de una cabecera de Hoja de Ruta existente.
//        /// </summary>
//        public bool Modificar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarHDR", sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.AddWithValue("@Id", Id);
//                sqlCom.Parameters.AddWithValue("@HojaRutaFecha", HojaRutaFecha);
//                sqlCom.Parameters.AddWithValue("@Id_Vehiculo", Id_Vehiculo > 0 ? (object)Id_Vehiculo : DBNull.Value);
//                sqlCom.Parameters.AddWithValue("@Id_Chofer", Id_Chofer.HasValue && Id_Chofer.Value > 0 ? (object)Id_Chofer.Value : DBNull.Value);

//                sqlCnn.Open();
//                return sqlCom.ExecuteNonQuery() > 0;
//            }
//        }

//        /// <summary>
//        /// Realiza la eliminación física de la cabecera (y por ON DELETE CASCADE sus detalles).
//        /// </summary>
//        public bool Borrar()
//        {
//            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
//            using (SqlCommand sqlCom = new SqlCommand("sp_EliminarHDR", sqlCnn))
//            {
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.AddWithValue("@Id", Id);

//                sqlCnn.Open();
//                return sqlCom.ExecuteNonQuery() > 0;
//            }
//        }
//    }
//}
