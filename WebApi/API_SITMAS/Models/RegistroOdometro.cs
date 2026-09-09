using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class RegistroOdometro
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        // Identificadores y datos principales
        public int IdRegistroOdomet { get; set; }
        public int IdVehiculo { get; set; }
        public DateTime FechaRegOdom { get; set; }
        public decimal InicioOdom { get; set; }
        public decimal FinalOdom { get; set; }

        // Propiedades de lectura / descriptivas (obtenidas desde JOIN en Stored Procedure)
        public string Patente { get; set; }
        public string FechaRegOdomFormateada { get; set; }
        public decimal KmRecorridosDia { get; set; }

        /// <summary>
        /// Obtiene el historial de registros de odómetro. 
        /// Si idVehiculo es opcional/0, devuelve todos los registros.
        /// </summary>
        public List<RegistroOdometro> ObtenerTodos(int? idVehiculo = null)
        {
            var lista = new List<RegistroOdometro>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarRegistroOdometro", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                if (idVehiculo.HasValue && idVehiculo.Value > 0)
                {
                    sqlCom.Parameters.AddWithValue("@IdVehiculo", idVehiculo.Value);
                }
                else
                {
                    sqlCom.Parameters.AddWithValue("@IdVehiculo", DBNull.Value);
                }

                sqlCnn.Open();
                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new RegistroOdometro
                        {
                            IdRegistroOdomet = Convert.ToInt32(reader["IdRegistroOdomet"]),
                            IdVehiculo = Convert.ToInt32(reader["IdVehiculo"]),
                            Patente = reader["Patente"] != DBNull.Value ? reader["Patente"].ToString() : string.Empty,
                            FechaRegOdom = Convert.ToDateTime(reader["FechaRegOdom"]),
                            FechaRegOdomFormateada = Convert.ToDateTime(reader["FechaRegOdom"]).ToString("dd/MM/yyyy HH:mm"),
                            InicioOdom = Convert.ToDecimal(reader["InicioOdom"]),
                            FinalOdom = Convert.ToDecimal(reader["FinalOdom"]),
                            KmRecorridosDia = reader["KmRecorridosDia"] != DBNull.Value ? Convert.ToDecimal(reader["KmRecorridosDia"]) : 0
                        });
                    }
                }
            }
            return lista;
        }

        /// <summary>
        /// Inserta un nuevo registro de odómetro ejecutando las validaciones del Stored Procedure.
        /// </summary>
        public bool Insertar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_InsertarRegistroOdometro", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@IdVehiculo", IdVehiculo);
                sqlCom.Parameters.AddWithValue("@InicioOdom", InicioOdom);
                sqlCom.Parameters.AddWithValue("@FinalOdom", FinalOdom);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        /// <summary>
        /// Actualiza un registro de odómetro existente.
        /// </summary>
        public bool Modificar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarRegistroOdometro", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@IdRegistroOdomet", IdRegistroOdomet);
                sqlCom.Parameters.AddWithValue("@IdVehiculo", IdVehiculo);
                sqlCom.Parameters.AddWithValue("@InicioOdom", InicioOdom);
                sqlCom.Parameters.AddWithValue("@FinalOdom", FinalOdom);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        /// <summary>
        /// Elimina físicamente un registro de odómetro por su ID.
        /// </summary>
        public bool Borrar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_EliminarRegistroOdometro", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@IdRegistroOdomet", IdRegistroOdomet);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }
    }
}