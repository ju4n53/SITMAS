using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;

namespace API_SITMAS.Models
{
    // =========================================================================
    // DTOs Y CLASES AUXILIARES DE TRANSFERENCIA DE DATOS
    // =========================================================================

    /// <summary>
    /// Representa las paradas pendientes de pesaje en báscula.
    /// </summary>
    public class PendientePesaje
    {
        public int Id_Detalle_HDR { get; set; }
        public int Id_HojaRuta { get; set; }
        public DateTime? HojaRutaFecha { get; set; }
        public string Origen { get; set; }
        public int? Id_Origen { get; set; }
        public string TipoMaterial { get; set; }
        public int? Id_TipoMaterial { get; set; }
        public string TipoMovimiento { get; set; }
        public int? Id_Ingreso_Material { get; set; }
    }

    /// <summary>
    /// DTO para la certificación y emisión del Remito de Origen (ROTEC - EMEC).
    /// </summary>
    public class RemitoOrigenDTO
    {
        public DateTime? fecha { get; set; }
        public DateTime? fechaDetalleIng { get; set; }
        public int? NroViaje { get; set; }
        public int? NroDetalle { get; set; }
        public string Transporte { get; set; }
        public string chofer { get; set; }
        public string Origen { get; set; }
        public string Material { get; set; }
        public decimal? pesoTotal { get; set; }
    }

    // =========================================================================
    // ENTIDAD PRINCIPAL DE DOMINIO Y ACCESO A DATOS
    // =========================================================================

    public class Detalle_Ingreso
    {
        #region Atributos
        private readonly string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;
        #endregion

        #region Propiedades
        public int IdDetalleIngreso { get; set; }
        public int Id_Ingreso_Material { get; set; }

        // Tipos anulables para soportar NULLs de la base de datos
        public int? Id_Tipo_Material { get; set; }
        public int? Id_Detalle_HDR { get; set; }

        public decimal PesoBruto { get; set; }
        public string Observaciones { get; set; }
        public string EstadoDtIng { get; set; }
        public int Id_Origen { get; set; }

        // Fecha de pesaje individual para auditoría
        public DateTime? fechaDetalleIng { get; set; }

        // Propiedades auxiliares de vistas / JOINs
        public string Tipo { get; set; }
        public string TipoMaterial { get; set; }
        public string Origen { get; set; }
        #endregion

        #region Métodos de Lectura (GET)

        public List<Detalle_Ingreso> SelectAll()
        {
            List<Detalle_Ingreso> lista = new List<Detalle_Ingreso>();
            string sqlSentencia = "sp_ListarDetalleIngreso";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Detalle_Ingreso obj = new Detalle_Ingreso
                        {
                            IdDetalleIngreso = Convert.ToInt32(reader["IdDetalleIngreso"]),
                            Id_Ingreso_Material = Convert.ToInt32(reader["Id_Ingreso_Material"]),
                            Id_Tipo_Material = reader["Id_Tipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_Tipo_Material"]) : (int?)null,
                            Id_Detalle_HDR = reader["Id_Detalle_HDR"] != DBNull.Value ? Convert.ToInt32(reader["Id_Detalle_HDR"]) : (int?)null,
                            PesoBruto = Convert.ToDecimal(reader["PesoBruto"]),
                            Observaciones = reader["Observaciones"] != DBNull.Value ? reader["Observaciones"].ToString() : null,
                            EstadoDtIng = reader["EstadoDtIng"].ToString(),
                            Id_Origen = Convert.ToInt32(reader["Id_Origen"]),
                            fechaDetalleIng = reader["fechaDetalleIng"] != DBNull.Value ? Convert.ToDateTime(reader["fechaDetalleIng"]) : (DateTime?)null
                        };

                        lista.Add(obj);
                    }
                }
            }
            return lista;
        }

        public List<Detalle_Ingreso> SelectPorCabecera(int idCabecera)
        {
            List<Detalle_Ingreso> lista = new List<Detalle_Ingreso>();
            string sqlSentencia = "sp_ListarVistaDetalle_Ingreso";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn)
                {
                    CommandType = CommandType.StoredProcedure
                };
                sqlCom.Parameters.Add("@IdIngresoM", SqlDbType.Int).Value = idCabecera;

                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Detalle_Ingreso obj = new Detalle_Ingreso
                        {
                            IdDetalleIngreso = Convert.ToInt32(reader["IdDetalleIngreso"]),
                            Id_Ingreso_Material = Convert.ToInt32(reader["IdIngresoM"]),
                            Id_Tipo_Material = reader["IdTipoMaterial"] != DBNull.Value ? Convert.ToInt32(reader["IdTipoMaterial"]) : (int?)null,
                            Id_Detalle_HDR = reader["Id_Detalle_HDR"] != DBNull.Value ? Convert.ToInt32(reader["Id_Detalle_HDR"]) : (int?)null,
                            PesoBruto = Convert.ToDecimal(reader["PesoBruto"]),
                            Observaciones = reader["Observaciones"] != DBNull.Value ? reader["Observaciones"].ToString() : null,
                            EstadoDtIng = reader["EstadoDtIng"].ToString(),
                            Tipo = reader["Tipo"] != DBNull.Value ? reader["Tipo"].ToString() : "No Especificado",
                            fechaDetalleIng = reader["fechaDetalleIng"] != DBNull.Value ? Convert.ToDateTime(reader["fechaDetalleIng"]) : (DateTime?)null
                        };

                        lista.Add(obj);
                    }
                }
            }
            return lista;
        }

        public List<Detalle_Ingreso> SelectPendientesClasificacion(int idIngresoMaterial)
        {
            List<Detalle_Ingreso> lista = new List<Detalle_Ingreso>();
            string sqlSentencia = "sp_ListarDetalleIngreso_PendientesClasificacion";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn)
                {
                    CommandType = CommandType.StoredProcedure
                };
                sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value = idIngresoMaterial;

                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Detalle_Ingreso obj = new Detalle_Ingreso
                        {
                            IdDetalleIngreso = Convert.ToInt32(reader["IdDetalleIngreso"]),
                            Id_Ingreso_Material = Convert.ToInt32(reader["Id_Ingreso_Material"]),
                            PesoBruto = Convert.ToDecimal(reader["PesoBruto"]),
                            Observaciones = reader["Observaciones"] != DBNull.Value ? reader["Observaciones"].ToString() : string.Empty,
                            EstadoDtIng = reader["EstadoDtIng"].ToString(),
                            Id_Origen = Convert.ToInt32(reader["Id_Origen"]),
                            Id_Tipo_Material = reader["Id_Tipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_Tipo_Material"]) : (int?)null,
                            TipoMaterial = reader["TipoMaterial"] != DBNull.Value ? reader["TipoMaterial"].ToString() : "Varios",
                            Origen = reader["Origen"] != DBNull.Value ? reader["Origen"].ToString() : "Sin Origen"
                        };

                        lista.Add(obj);
                    }
                }
            }
            return lista;
        }

        public List<PendientePesaje> SelectPendientesPesaje(DateTime? desde = null, DateTime? hasta = null)
        {
            List<PendientePesaje> lista = new List<PendientePesaje>();
            string sqlSentencia = "sp_ListarDetalleHDR_PendientesPesaje";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                sqlCom.Parameters.Add("@Desde", SqlDbType.DateTime).Value = desde.HasValue ? (object)desde.Value : DBNull.Value;
                sqlCom.Parameters.Add("@Hasta", SqlDbType.DateTime).Value = hasta.HasValue ? (object)hasta.Value : DBNull.Value;

                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        PendientePesaje obj = new PendientePesaje
                        {
                            Id_Detalle_HDR = Convert.ToInt32(reader["Id_Detalle_HDR"]),
                            Id_HojaRuta = Convert.ToInt32(reader["Id_HojaRuta"]),
                            HojaRutaFecha = reader["HojaRutaFecha"] != DBNull.Value ? Convert.ToDateTime(reader["HojaRutaFecha"]) : (DateTime?)null,
                            Origen = reader["Origen"] != DBNull.Value ? reader["Origen"].ToString() : "Sin Origen",
                            Id_Origen = reader["Id_Origen"] != DBNull.Value ? Convert.ToInt32(reader["Id_Origen"]) : (int?)null,
                            TipoMaterial = reader["TipoMaterial"] != DBNull.Value ? reader["TipoMaterial"].ToString() : "Varios",
                            Id_TipoMaterial = reader["Id_TipoMaterial"] != DBNull.Value ? Convert.ToInt32(reader["Id_TipoMaterial"]) : (int?)null,
                            TipoMovimiento = reader["TipoMovimiento"] != DBNull.Value ? reader["TipoMovimiento"].ToString() : "Carga",
                            Id_Ingreso_Material = reader["Id_Ingreso_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_Ingreso_Material"]) : (int?)null
                        };

                        lista.Add(obj);
                    }
                }
            }
            return lista;
        }

        public List<RemitoOrigenDTO> SelectRemitoOrigen(int? idIngresoMaterial = null)
        {
            List<RemitoOrigenDTO> lista = new List<RemitoOrigenDTO>();
            string sqlSentencia = "sp_ListarDetalleIngreso_RemitoOrigen";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value =
                    idIngresoMaterial.HasValue ? (object)idIngresoMaterial.Value : DBNull.Value;

                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        RemitoOrigenDTO dto = new RemitoOrigenDTO
                        {
                            fecha = reader["fecha"] != DBNull.Value ? Convert.ToDateTime(reader["fecha"]) : (DateTime?)null,
                            NroViaje = reader["NroViaje"] != DBNull.Value ? Convert.ToInt32(reader["NroViaje"]) : (int?)null,
                            NroDetalle = reader["NroDetalle"] != DBNull.Value ? Convert.ToInt32(reader["NroDetalle"]) : (int?)null,
                            Transporte = reader["Transporte"] != DBNull.Value ? reader["Transporte"].ToString() : "Sin Vehículo",
                            chofer = reader["chofer"] != DBNull.Value ? reader["chofer"].ToString() : "Sin Chofer",
                            Origen = reader["Origen"] != DBNull.Value ? reader["Origen"].ToString() : "Origen General",
                            Material = reader["Material"] != DBNull.Value ? reader["Material"].ToString() : "Varios",
                            pesoTotal = reader["pesoTotal"] != DBNull.Value ? Convert.ToDecimal(reader["pesoTotal"]) : (decimal?)0m
                        };

                        lista.Add(dto);
                    }
                }
            }
            return lista;
        }

        #endregion

        #region Métodos de Escritura (CUD)

        public void Insertar()
        {
            string sqlSentencia = "sp_InsertarDetalle_Ingreso";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value = Id_Ingreso_Material;
                sqlCom.Parameters.Add("@IdTipoMaterial", SqlDbType.Int).Value = Id_Tipo_Material.HasValue ? (object)Id_Tipo_Material.Value : DBNull.Value;
                sqlCom.Parameters.Add("@Id_Detalle_HDR", SqlDbType.Int).Value = Id_Detalle_HDR.HasValue ? (object)Id_Detalle_HDR.Value : DBNull.Value;
                sqlCom.Parameters.Add("@PesoBruto", SqlDbType.Decimal).Value = PesoBruto;
                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 100).Value = string.IsNullOrEmpty(Observaciones) ? DBNull.Value : (object)Observaciones;
                sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = Id_Origen;
                sqlCom.Parameters.Add("@fechaDetalleIng", SqlDbType.DateTime).Value = fechaDetalleIng.HasValue ? (object)fechaDetalleIng.Value : DBNull.Value;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }
        }

        public void Modificar()
        {
            string sqlSentencia = "sp_ActualizarDetalle_Ingreso";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = IdDetalleIngreso;
                sqlCom.Parameters.Add("@IdTipoMaterial", SqlDbType.Int).Value = Id_Tipo_Material.HasValue ? (object)Id_Tipo_Material.Value : DBNull.Value;
                sqlCom.Parameters.Add("@Id_Detalle_HDR", SqlDbType.Int).Value = Id_Detalle_HDR.HasValue ? (object)Id_Detalle_HDR.Value : DBNull.Value;
                sqlCom.Parameters.Add("@PesoBruto", SqlDbType.Decimal).Value = PesoBruto;
                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 100).Value = string.IsNullOrEmpty(Observaciones) ? DBNull.Value : (object)Observaciones;
                sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = Id_Origen;
                sqlCom.Parameters.Add("@fechaDetalleIng", SqlDbType.DateTime).Value = fechaDetalleIng.HasValue ? (object)fechaDetalleIng.Value : DBNull.Value;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }
        }

        public void Borrar()
        {
            string sqlSentencia = "sp_EliminarDetalle_Ingreso";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn)
                {
                    CommandType = CommandType.StoredProcedure
                };
                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = IdDetalleIngreso;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }
        }

        #endregion
    }
}




//using System;
//using System.Collections.Generic;
//using System.Data;
//using System.Data.SqlClient;
//using System.Configuration;

//namespace API_SITMAS.Models
//{
//    public class Detalle_Ingreso
//    {
//        #region Atributos
//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;
//        #endregion

//        #region Propiedades
//        public int IdDetalleIngreso { get; set; }
//        public int Id_Ingreso_Material { get; set; }

//        // Cajas flexibles para soportar NULLs de la base de datos
//        public int? Id_Tipo_Material { get; set; }
//        public int? Id_Detalle_HDR { get; set; }

//        public decimal PesoBruto { get; set; }
//        public string Observaciones { get; set; }
//        public string EstadoDtIng { get; set; }
//        public int Id_Origen { get; set; }

//        // 🟢 Nueva propiedad para auditoría flexible de fecha
//        public DateTime? fechaDetalleIng { get; set; }

//        // Propiedades auxiliares de vistas / JOINs
//        public string Tipo { get; set; }
//        public string TipoMaterial { get; set; }
//        public string Origen { get; set; }
//        #endregion

//        #region Métodos

//        public List<Detalle_Ingreso> SelectAll()
//        {
//            List<Detalle_Ingreso> lista = new List<Detalle_Ingreso>();
//            string sqlSentencia = "sp_ListarDetalleIngreso";

//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCnn.Open();

//                using (SqlDataReader reader = sqlCom.ExecuteReader())
//                {
//                    while (reader.Read())
//                    {
//                        Detalle_Ingreso obj = new Detalle_Ingreso();

//                        obj.IdDetalleIngreso = Convert.ToInt32(reader["IdDetalleIngreso"]);
//                        obj.Id_Ingreso_Material = Convert.ToInt32(reader["Id_Ingreso_Material"]);

//                        // Control de Nulos
//                        obj.Id_Tipo_Material = reader["Id_Tipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_Tipo_Material"]) : (int?)null;
//                        obj.Id_Detalle_HDR = reader["Id_Detalle_HDR"] != DBNull.Value ? Convert.ToInt32(reader["Id_Detalle_HDR"]) : (int?)null;

//                        obj.PesoBruto = Convert.ToDecimal(reader["PesoBruto"]);
//                        obj.Observaciones = reader["Observaciones"] != DBNull.Value ? reader["Observaciones"].ToString() : null;
//                        obj.EstadoDtIng = reader["EstadoDtIng"].ToString();
//                        obj.Id_Origen = Convert.ToInt32(reader["Id_Origen"]);

//                        // 🟢 Lectura controlada de la nueva fecha
//                        obj.fechaDetalleIng = reader["fechaDetalleIng"] != DBNull.Value ? Convert.ToDateTime(reader["fechaDetalleIng"]) : (DateTime?)null;

//                        lista.Add(obj);
//                    }
//                }
//            }
//            return lista;
//        }

//        public List<Detalle_Ingreso> SelectPorCabecera(int idCabecera)
//        {
//            List<Detalle_Ingreso> lista = new List<Detalle_Ingreso>();
//            string sqlSentencia = "sp_ListarVistaDetalle_Ingreso";

//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.Add("@IdIngresoM", SqlDbType.Int).Value = idCabecera;
//                sqlCnn.Open();

//                using (SqlDataReader reader = sqlCom.ExecuteReader())
//                {
//                    while (reader.Read())
//                    {
//                        Detalle_Ingreso obj = new Detalle_Ingreso();

//                        obj.IdDetalleIngreso = Convert.ToInt32(reader["IdDetalleIngreso"]);
//                        obj.Id_Ingreso_Material = Convert.ToInt32(reader["IdIngresoM"]);

//                        obj.Id_Tipo_Material = reader["IdTipoMaterial"] != DBNull.Value ? Convert.ToInt32(reader["IdTipoMaterial"]) : (int?)null;
//                        obj.Id_Detalle_HDR = reader["Id_Detalle_HDR"] != DBNull.Value ? Convert.ToInt32(reader["Id_Detalle_HDR"]) : (int?)null;

//                        obj.PesoBruto = Convert.ToDecimal(reader["PesoBruto"]);
//                        obj.Observaciones = reader["Observaciones"] != DBNull.Value ? reader["Observaciones"].ToString() : null;
//                        obj.EstadoDtIng = reader["EstadoDtIng"].ToString();

//                        obj.Tipo = reader["Tipo"] != DBNull.Value ? reader["Tipo"].ToString() : "No Especificado";

//                        // 🟢 Lectura de la nueva fecha mapeada desde la vista
//                        obj.fechaDetalleIng = reader["fechaDetalleIng"] != DBNull.Value ? Convert.ToDateTime(reader["fechaDetalleIng"]) : (DateTime?)null;

//                        lista.Add(obj);
//                    }
//                }
//            }
//            return lista;
//        }

//        public List<Detalle_Ingreso> SelectPendientesClasificacion(int idIngresoMaterial)
//        {
//            List<Detalle_Ingreso> lista = new List<Detalle_Ingreso>();
//            string sqlSentencia = "sp_ListarDetalleIngreso_PendientesClasificacion";

//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value = idIngresoMaterial;

//                sqlCnn.Open();

//                using (SqlDataReader reader = sqlCom.ExecuteReader())
//                {
//                    while (reader.Read())
//                    {
//                        Detalle_Ingreso obj = new Detalle_Ingreso();
//                        obj.IdDetalleIngreso = Convert.ToInt32(reader["IdDetalleIngreso"]);
//                        obj.Id_Ingreso_Material = Convert.ToInt32(reader["Id_Ingreso_Material"]);
//                        obj.PesoBruto = Convert.ToDecimal(reader["PesoBruto"]);
//                        obj.Observaciones = reader["Observaciones"] != DBNull.Value ? reader["Observaciones"].ToString() : string.Empty;
//                        obj.EstadoDtIng = reader["EstadoDtIng"].ToString();
//                        obj.Id_Origen = Convert.ToInt32(reader["Id_Origen"]);

//                        obj.Id_Tipo_Material = reader["Id_Tipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_Tipo_Material"]) : 0;
//                        obj.TipoMaterial = reader["TipoMaterial"] != DBNull.Value ? reader["TipoMaterial"].ToString() : "Varios";
//                        obj.Origen = reader["Origen"] != DBNull.Value ? reader["Origen"].ToString() : "Sin Origen";

//                        lista.Add(obj);
//                    }
//                }
//            }
//            return lista;
//        }



//        // 1. CLASE MODELO CON PROPIEDADES ANULABLES (Nullable)
//        public class PendientePesaje
//        {
//            public int Id_Detalle_HDR { get; set; }
//            public int Id_HojaRuta { get; set; }

//            // 🟢 Tipos con '?' para soportar NULLs de la base de datos
//            public DateTime? HojaRutaFecha { get; set; }
//            public string Origen { get; set; }
//            public int? Id_Origen { get; set; }
//            public string TipoMaterial { get; set; }
//            public int? Id_TipoMaterial { get; set; }
//            public string TipoMovimiento { get; set; }
//            public int? Id_Ingreso_Material { get; set; }
//        }

//        // 2. MÉTODO DE LECTURA CON CONTROL DE DBNull
//        public List<PendientePesaje> SelectPendientesPesaje(DateTime? desde = null, DateTime? hasta = null)
//        {
//            List<PendientePesaje> lista = new List<PendientePesaje>();
//            string sqlSentencia = "sp_ListarDetalleHDR_PendientesPesaje";

//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                sqlCom.Parameters.Add("@Desde", SqlDbType.DateTime).Value = desde.HasValue ? (object)desde.Value : DBNull.Value;
//                sqlCom.Parameters.Add("@Hasta", SqlDbType.DateTime).Value = hasta.HasValue ? (object)hasta.Value : DBNull.Value;

//                sqlCnn.Open();

//                using (SqlDataReader reader = sqlCom.ExecuteReader())
//                {
//                    while (reader.Read())
//                    {
//                        PendientePesaje obj = new PendientePesaje();

//                        // Claves primarias obligatorias
//                        obj.Id_Detalle_HDR = Convert.ToInt32(reader["Id_Detalle_HDR"]);
//                        obj.Id_HojaRuta = Convert.ToInt32(reader["Id_HojaRuta"]);

//                        // 🟢 Controles de DBNull en cada propiedad
//                        obj.HojaRutaFecha = reader["HojaRutaFecha"] != DBNull.Value ? Convert.ToDateTime(reader["HojaRutaFecha"]) : (DateTime?)null;

//                        obj.Origen = reader["Origen"] != DBNull.Value ? reader["Origen"].ToString() : "Sin Origen";
//                        obj.Id_Origen = reader["Id_Origen"] != DBNull.Value ? Convert.ToInt32(reader["Id_Origen"]) : (int?)null;

//                        obj.TipoMaterial = reader["TipoMaterial"] != DBNull.Value ? reader["TipoMaterial"].ToString() : "Varios";
//                        obj.Id_TipoMaterial = reader["Id_TipoMaterial"] != DBNull.Value ? Convert.ToInt32(reader["Id_TipoMaterial"]) : (int?)null;

//                        obj.TipoMovimiento = reader["TipoMovimiento"] != DBNull.Value ? reader["TipoMovimiento"].ToString() : "Carga";
//                        obj.Id_Ingreso_Material = reader["Id_Ingreso_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_Ingreso_Material"]) : (int?)null;

//                        lista.Add(obj);
//                    }
//                }
//            }
//            return lista;
//        }



//        // 🟢 Objeto DTO optimizado para el Remito de Origen
//        public class RemitoOrigenDTO
//        {
//            public DateTime? fecha { get; set; }
//            public int NroViaje { get; set; }
//            public int NroDetalle { get; set; }
//            public string? Transporte { get; set; }
//            public string? chofer { get; set; }
//            public string? Origen { get; set; }
//            public string? Material { get; set; }
//            public decimal pesoTotal { get; set; }
//        }

//        // Agregamos el método de lectura dentro de la clase de acceso a datos / modelo

//            public List<RemitoOrigenDTO> SelectRemitoOrigen(int? idIngresoMaterial = null)
//            {
//                List<RemitoOrigenDTO> lista = new List<RemitoOrigenDTO>();
//                string sqlSentencia = "sp_ListarDetalleIngreso_RemitoOrigen";

//                using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//                {
//                    SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                    sqlCom.CommandType = CommandType.StoredProcedure;

//                    // Parámetro opcional: si viene idIngresoMaterial filtra por ese camión, sino trae el listado general
//                    sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value =
//                        idIngresoMaterial.HasValue ? (object)idIngresoMaterial.Value : DBNull.Value;

//                    sqlCnn.Open();

//                    using (SqlDataReader reader = sqlCom.ExecuteReader())
//                    {
//                        while (reader.Read())
//                        {
//                            RemitoOrigenDTO dto = new RemitoOrigenDTO();

//                            // 🟢 Mapeo seguro contra DBNull.Value
//                            dto.fecha = reader["fecha"] != DBNull.Value ? Convert.ToDateTime(reader["fecha"]) : (DateTime?)null;
//                            dto.NroViaje = Convert.ToInt32(reader["NroViaje"]);
//                            dto.NroDetalle = Convert.ToInt32(reader["NroDetalle"]);

//                            dto.Transporte = reader["Transporte"] != DBNull.Value ? reader["Transporte"].ToString() : "Sin Vehículo";
//                            dto.chofer = reader["chofer"] != DBNull.Value ? reader["chofer"].ToString() : "Sin Chofer";
//                            dto.Origen = reader["Origen"] != DBNull.Value ? reader["Origen"].ToString() : "Origen General";
//                            dto.Material = reader["Material"] != DBNull.Value ? reader["Material"].ToString() : "Varios";

//                            dto.pesoTotal = reader["pesoTotal"] != DBNull.Value ? Convert.ToDecimal(reader["pesoTotal"]) : 0m;

//                            lista.Add(dto);
//                        }
//                    }
//                }
//                return lista;
//            }




//        public void Insertar()
//        {
//            string sqlSentencia = "sp_InsertarDetalle_Ingreso";
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value = Id_Ingreso_Material;

//                sqlCom.Parameters.Add("@IdTipoMaterial", SqlDbType.Int).Value = Id_Tipo_Material.HasValue ? (object)Id_Tipo_Material.Value : DBNull.Value;
//                sqlCom.Parameters.Add("@Id_Detalle_HDR", SqlDbType.Int).Value = Id_Detalle_HDR.HasValue ? (object)Id_Detalle_HDR.Value : DBNull.Value;

//                sqlCom.Parameters.Add("@PesoBruto", SqlDbType.Decimal).Value = PesoBruto;
//                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 100).Value = string.IsNullOrEmpty(Observaciones) ? DBNull.Value : (object)Observaciones;
//                sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = Id_Origen;

//                // 🟢 Nuevo parámetro hacia el SP
//                sqlCom.Parameters.Add("@fechaDetalleIng", SqlDbType.DateTime).Value = fechaDetalleIng.HasValue ? (object)fechaDetalleIng.Value : DBNull.Value;

//                sqlCnn.Open();
//                sqlCom.ExecuteNonQuery();
//            }
//        }

//        public void Modificar()
//        {
//            string sqlSentencia = "sp_ActualizarDetalle_Ingreso";
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = IdDetalleIngreso;
//                sqlCom.Parameters.Add("@IdTipoMaterial", SqlDbType.Int).Value = Id_Tipo_Material.HasValue ? (object)Id_Tipo_Material.Value : DBNull.Value;
//                sqlCom.Parameters.Add("@Id_Detalle_HDR", SqlDbType.Int).Value = Id_Detalle_HDR.HasValue ? (object)Id_Detalle_HDR.Value : DBNull.Value;
//                sqlCom.Parameters.Add("@PesoBruto", SqlDbType.Decimal).Value = PesoBruto;
//                sqlCom.Parameters.Add("@Observaciones", SqlDbType.VarChar, 100).Value = string.IsNullOrEmpty(Observaciones) ? DBNull.Value : (object)Observaciones;
//                sqlCom.Parameters.Add("@IdOrigen", SqlDbType.Int).Value = Id_Origen;

//                // 🟢 Nuevo parámetro hacia el SP
//                sqlCom.Parameters.Add("@fechaDetalleIng", SqlDbType.DateTime).Value = fechaDetalleIng.HasValue ? (object)fechaDetalleIng.Value : DBNull.Value;

//                sqlCnn.Open();
//                sqlCom.ExecuteNonQuery();
//            }
//        }

//        public void Borrar()
//        {
//            string sqlSentencia = "sp_EliminarDetalle_Ingreso";
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = IdDetalleIngreso;

//                sqlCnn.Open();
//                sqlCom.ExecuteNonQuery();
//            }
//        }
//        #endregion
//    }
//}
