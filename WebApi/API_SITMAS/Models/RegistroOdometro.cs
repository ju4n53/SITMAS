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
        public int? Id_HojaRuta { get; set; }

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
        /// Inserta un registro MANUAL desde el panel de administración.
        /// </summary>
        public bool Insertar()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_InsertarRegistroOdometro_Manual", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@IdVehiculo", IdVehiculo);
                sqlCom.Parameters.AddWithValue("@InicioOdom", InicioOdom);
                sqlCom.Parameters.AddWithValue("@FinalOdom", FinalOdom);

                // El gran truco para manejar nulos en ADO.NET:
                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", Id_HojaRuta.HasValue ? (object)Id_HojaRuta.Value : DBNull.Value);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }

        /// <summary>
        /// Actualiza un registro MANUALMENTE.
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

                // También lo agregamos aquí por si el admin necesita vincular o desvincular una hoja de ruta
                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", Id_HojaRuta.HasValue ? (object)Id_HojaRuta.Value : DBNull.Value);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }


        ///// <summary>
        ///// Inserta un nuevo registro de odómetro ejecutando las validaciones del Stored Procedure.
        ///// </summary>
        //public bool Insertar()
        //{
        //    using (SqlConnection sqlCnn = new SqlConnection(connectionString))
        //    using (SqlCommand sqlCom = new SqlCommand("sp_InsertarRegistroOdometro_Manual", sqlCnn))
        //    {
        //        sqlCom.CommandType = CommandType.StoredProcedure;

        //        sqlCom.Parameters.AddWithValue("@IdVehiculo", IdVehiculo);
        //        sqlCom.Parameters.AddWithValue("@InicioOdom", InicioOdom);
        //        sqlCom.Parameters.AddWithValue("@FinalOdom", FinalOdom);
        //        sqlCom.Parameters.AddWithValue("@Id_HojaRuta", Id_HojaRuta);

        //        sqlCnn.Open();
        //        return sqlCom.ExecuteNonQuery() > 0;
        //    }
        //}

        ///// <summary>
        ///// Actualiza un registro de odómetro existente.
        ///// </summary>
        //public bool Modificar()
        //{
        //    using (SqlConnection sqlCnn = new SqlConnection(connectionString))
        //    using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarRegistroOdometro", sqlCnn))
        //    {
        //        sqlCom.CommandType = CommandType.StoredProcedure;

        //        sqlCom.Parameters.AddWithValue("@IdRegistroOdomet", IdRegistroOdomet);
        //        sqlCom.Parameters.AddWithValue("@IdVehiculo", IdVehiculo);
        //        sqlCom.Parameters.AddWithValue("@InicioOdom", InicioOdom);
        //        sqlCom.Parameters.AddWithValue("@FinalOdom", FinalOdom);
        //        sqlCom.Parameters.AddWithValue("@Id_HojaRuta", Id_HojaRuta);

        //        sqlCnn.Open();
        //        return sqlCom.ExecuteNonQuery() > 0;
        //    }
        //}



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

        /// <summary>
        /// Operación exclusiva del Chofer al INICIAR la hoja de ruta.
        /// </summary>
        public int IniciarRutaChofer()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_InsertarRegistroOdometro", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@IdVehiculo", IdVehiculo);
                sqlCom.Parameters.AddWithValue("@Id_HojaRuta", Id_HojaRuta.HasValue ? (object)Id_HojaRuta.Value : DBNull.Value);
                sqlCom.Parameters.AddWithValue("@InicioOdom", InicioOdom);
                // Recuerda que nuestro SP de inicio ya no pide FinalOdom

                sqlCnn.Open();
                // Usamos ExecuteScalar para obtener el ID recién creado, nos servirá para el frontend
                object result = sqlCom.ExecuteScalar();
                return result != null ? Convert.ToInt32(result) : 0;
            }
        }

        /// <summary>
        /// Operación exclusiva del Chofer al FINALIZAR la hoja de ruta.
        /// </summary>
        public bool FinalizarRutaChofer()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_FinalizarViaje_Odometro", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@IdRegistroOdomet", IdRegistroOdomet);
                sqlCom.Parameters.AddWithValue("@FinalOdom", FinalOdom);

                sqlCnn.Open();
                return sqlCom.ExecuteNonQuery() > 0;
            }
        }
    }
}