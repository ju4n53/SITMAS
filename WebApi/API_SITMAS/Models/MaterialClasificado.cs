using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace API_SITMAS.Models
{
    public class Material_Clasificado
    {
        #region Propiedades de Entidad (Tabla Material_Clasificado)
        public int Id { get; set; }
        public int Id_Detalle_Ingreso { get; set; }
        public int? Id_SubTipo_Material { get; set; } // Nullable para evitar errores de FK con 0
        public decimal PesoUtil { get; set; }
        public DateTime? FechaClasificacion { get; set; }
        public int Id_Estado_Material { get; set; }
        public int Id_Destino { get; set; }
        public int Id_Usuario_Clasificador { get; set; }
        public string EstadoMtCl { get; set; }
        #endregion

        #region Propiedades Descriptivas (Lectura desde Vistas)
        public string Categoria { get; set; }
        public string SubtipoMaterial { get; set; }
        public string EstadoMaterial { get; set; }
        public string Destino { get; set; }
        public string UsuarioClasificador { get; set; }
        #endregion

        #region Métodos Auxiliares
        private static string ObtenerCadenaConexion()
        {
            return ConfigurationManager.ConnectionStrings["CadenaSITMAS"]?.ConnectionString
                ?? throw new InvalidOperationException("La cadena de conexión 'CadenaSITMAS' no está configurada.");
        }
        #endregion

        #region Métodos CRUD y Consultas

        public List<Material_Clasificado> SelectAll()
        {
            var lista = new List<Material_Clasificado>();

            using (var sqlCnn = new SqlConnection(ObtenerCadenaConexion()))
            using (var sqlCom = new SqlCommand("sp_ListarMaterial_Clasificado", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new Material_Clasificado
                        {
                            Id = Convert.ToInt32(reader["Id"]),
                            Id_Detalle_Ingreso = Convert.ToInt32(reader["Id_Detalle_Ingreso"]),
                            Id_SubTipo_Material = reader["Id_SubTipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_SubTipo_Material"]) : (int?)null,
                            PesoUtil = Convert.ToDecimal(reader["PesoUtil"]),
                            FechaClasificacion = reader["FechaClasificacion"] != DBNull.Value ? Convert.ToDateTime(reader["FechaClasificacion"]) : (DateTime?)null,
                            Id_Estado_Material = Convert.ToInt32(reader["Id_Estado_Material"]),
                            Id_Destino = Convert.ToInt32(reader["Id_Destino"]),
                            Id_Usuario_Clasificador = Convert.ToInt32(reader["Id_Usuario_Clasificador"]),
                            EstadoMtCl = reader["EstadoMtCl"].ToString()
                        });
                    }
                }
            }
            return lista;
        }

        public List<Material_Clasificado> SelectVista()
        {
            var lista = new List<Material_Clasificado>();

            using (var sqlCnn = new SqlConnection(ObtenerCadenaConexion()))
            using (var sqlCom = new SqlCommand("sp_ListarVistaMaterial_Clasificado", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new Material_Clasificado
                        {
                            Id = Convert.ToInt32(reader["Id"]),
                            Id_Detalle_Ingreso = Convert.ToInt32(reader["IdDetalleIngreso"]),
                            Id_SubTipo_Material = reader["Id_SubTipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_SubTipo_Material"]) : (int?)null,
                            PesoUtil = Convert.ToDecimal(reader["PesoUtil"]),
                            FechaClasificacion = reader["FechaClasificacion"] != DBNull.Value ? Convert.ToDateTime(reader["FechaClasificacion"]) : (DateTime?)null,
                            EstadoMtCl = reader["EstadoMtCl"].ToString(),
                            EstadoMaterial = reader["EstadoMaterial"]?.ToString(),
                            Destino = reader["Destino"]?.ToString(),
                            UsuarioClasificador = reader["UsuarioClasificador"]?.ToString(),
                            SubtipoMaterial = reader["MaterialClasificado"] != DBNull.Value ? reader["MaterialClasificado"].ToString() : "Sin Especificar"
                        });
                    }
                }
            }
            return lista;
        }


        public List<PendienteClasificacionDTO> SelectPendientes(
                    int? idIngresoMaterial = null,
                   DateTime? fechaEspecifica = null,
                      DateTime? desde = null,
                        DateTime? hasta = null)

        {
            var lista = new List<PendienteClasificacionDTO>();

            using (var sqlCnn = new SqlConnection(ObtenerCadenaConexion()))
            using (var sqlCom = new SqlCommand("sp_ListarDetalleIngreso_PendientesClasificacion", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value = (object)idIngresoMaterial ?? DBNull.Value;
                sqlCom.Parameters.Add("@FechaEspecifica", SqlDbType.Date).Value = (object)fechaEspecifica?.Date ?? DBNull.Value;
                sqlCom.Parameters.Add("@Desde", SqlDbType.Date).Value = (object)desde?.Date ?? DBNull.Value;
                sqlCom.Parameters.Add("@Hasta", SqlDbType.Date).Value = (object)hasta?.Date ?? DBNull.Value;

                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new PendienteClasificacionDTO
                        {
                            IdDetalleIngreso = reader["IdDetalleIngreso"] != DBNull.Value ? Convert.ToInt32(reader["IdDetalleIngreso"]) : 0,
                            Id_Ingreso_Material = reader["Id_Ingreso_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_Ingreso_Material"]) : 0,
                            PesoBruto = reader["PesoBruto"] != DBNull.Value ? Convert.ToDecimal(reader["PesoBruto"]) : 0m,
                            PesoYaClasificado = reader["PesoYaClasificado"] != DBNull.Value ? Convert.ToDecimal(reader["PesoYaClasificado"]) : 0m,
                            PesoRestantePendiente = reader["PesoRestantePendiente"] != DBNull.Value ? Convert.ToDecimal(reader["PesoRestantePendiente"]) : 0m,
                            Observaciones = reader["Observaciones"] != DBNull.Value ? reader["Observaciones"].ToString() : string.Empty,
                            EstadoDtIng = reader["EstadoDtIng"] != DBNull.Value ? reader["EstadoDtIng"].ToString() : string.Empty,
                            Id_Origen = reader["Id_Origen"] != DBNull.Value ? Convert.ToInt32(reader["Id_Origen"]) : 0,
                            Id_Detalle_HDR = reader["Id_Detalle_HDR"] != DBNull.Value ? Convert.ToInt32(reader["Id_Detalle_HDR"]) : (int?)null,
                            Id_Tipo_Material = reader["Id_Tipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_Tipo_Material"]) : 0,
                            TipoMaterialEsperado = reader["TipoMaterialEsperado"] != DBNull.Value ? reader["TipoMaterialEsperado"].ToString() : "Varios",
                            Origen = reader["Origen"] != DBNull.Value ? reader["Origen"].ToString() : "Sin Especificar"
                        });
                    }
                }
            }
            return lista;
        }

        //public List<PendienteClasificacionDTO> SelectPendientes(int? idIngresoMaterial = null)
        //{
        //    var lista = new List<PendienteClasificacionDTO>();

        //    using (var sqlCnn = new SqlConnection(ObtenerCadenaConexion()))
        //    using (var sqlCom = new SqlCommand("sp_ListarDetalleIngreso_PendientesClasificacion", sqlCnn))
        //    {
        //        sqlCom.CommandType = CommandType.StoredProcedure;
        //        sqlCom.Parameters.Add("@IdIngresoMaterial", SqlDbType.Int).Value = (object)idIngresoMaterial ?? DBNull.Value;

        //        sqlCnn.Open();

        //        using (SqlDataReader reader = sqlCom.ExecuteReader())
        //        {
        //            while (reader.Read())
        //            {
        //                lista.Add(new PendienteClasificacionDTO
        //                {
        //                    IdDetalleIngreso = reader["IdDetalleIngreso"] != DBNull.Value ? Convert.ToInt32(reader["IdDetalleIngreso"]) : 0,
        //                    Id_Ingreso_Material = reader["Id_Ingreso_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_Ingreso_Material"]) : 0,
        //                    PesoBruto = reader["PesoBruto"] != DBNull.Value ? Convert.ToDecimal(reader["PesoBruto"]) : 0m,
        //                    PesoYaClasificado = reader["PesoYaClasificado"] != DBNull.Value ? Convert.ToDecimal(reader["PesoYaClasificado"]) : 0m,
        //                    PesoRestantePendiente = reader["PesoRestantePendiente"] != DBNull.Value ? Convert.ToDecimal(reader["PesoRestantePendiente"]) : 0m,
        //                    Observaciones = reader["Observaciones"] != DBNull.Value ? reader["Observaciones"].ToString() : string.Empty,
        //                    EstadoDtIng = reader["EstadoDtIng"] != DBNull.Value ? reader["EstadoDtIng"].ToString() : string.Empty,

        //                    // 🛡️ Mapeos protegidos contra DBNull.Value
        //                    Id_Origen = reader["Id_Origen"] != DBNull.Value ? Convert.ToInt32(reader["Id_Origen"]) : 0,
        //                    Id_Detalle_HDR = reader["Id_Detalle_HDR"] != DBNull.Value ? Convert.ToInt32(reader["Id_Detalle_HDR"]) : (int?)null,
        //                    Id_Tipo_Material = reader["Id_Tipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_Tipo_Material"]) : 0,

        //                    TipoMaterialEsperado = reader["TipoMaterialEsperado"] != DBNull.Value ? reader["TipoMaterialEsperado"].ToString() : "Varios",
        //                    Origen = reader["Origen"] != DBNull.Value ? reader["Origen"].ToString() : "Sin Especificar"
        //                });
        //            }
        //        }
        //    }
        //    return lista;
        //}

        public int Insertar()
        {
            using (var sqlCnn = new SqlConnection(ObtenerCadenaConexion()))
            using (var sqlCom = new SqlCommand("sp_InsertarMaterial_Clasificado", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = Id_Detalle_Ingreso;
                sqlCom.Parameters.Add("@IdSubTipoMaterial", SqlDbType.Int).Value = (Id_SubTipo_Material.HasValue && Id_SubTipo_Material > 0) ? (object)Id_SubTipo_Material.Value : DBNull.Value;
                sqlCom.Parameters.Add("@PesoUtil", SqlDbType.Decimal).Value = PesoUtil;
                sqlCom.Parameters.Add("@FechaClasificacion", SqlDbType.DateTime).Value = (object)FechaClasificacion ?? DBNull.Value;
                sqlCom.Parameters.Add("@IdEstadoMaterial", SqlDbType.Int).Value = Id_Estado_Material;
                sqlCom.Parameters.Add("@IdDestino", SqlDbType.Int).Value = Id_Destino > 0 ? (object)Id_Destino : DBNull.Value;
                sqlCom.Parameters.Add("@IdUsuarioClasificador", SqlDbType.Int).Value = Id_Usuario_Clasificador;

                sqlCnn.Open();
                object result = sqlCom.ExecuteScalar();
                return result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
            }
        }

        public void Modificar()
        {
            using (var sqlCnn = new SqlConnection(ObtenerCadenaConexion()))
            using (var sqlCom = new SqlCommand("sp_ActualizarMaterial_Clasificado", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;
                sqlCom.Parameters.Add("@IdSubTipoMaterial", SqlDbType.Int).Value = (Id_SubTipo_Material.HasValue && Id_SubTipo_Material > 0) ? (object)Id_SubTipo_Material.Value : DBNull.Value;
                sqlCom.Parameters.Add("@PesoUtil", SqlDbType.Decimal).Value = PesoUtil;
                sqlCom.Parameters.Add("@FechaClasificacion", SqlDbType.DateTime).Value = (object)FechaClasificacion ?? DBNull.Value;
                sqlCom.Parameters.Add("@IdEstadoMaterial", SqlDbType.Int).Value = Id_Estado_Material;
                sqlCom.Parameters.Add("@IdDestino", SqlDbType.Int).Value = Id_Destino > 0 ? (object)Id_Destino : DBNull.Value;
                sqlCom.Parameters.Add("@IdUsuarioClasificador", SqlDbType.Int).Value = Id_Usuario_Clasificador;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }
        }

        public void Borrar()
        {
            using (var sqlCnn = new SqlConnection(ObtenerCadenaConexion()))
            using (var sqlCom = new SqlCommand("sp_EliminarMaterial_Clasificado", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }
        }
        #endregion
    }

    public class PendienteClasificacionDTO
    {
        public int IdDetalleIngreso { get; set; }
        public int Id_Ingreso_Material { get; set; }
        public decimal PesoBruto { get; set; }
        public decimal PesoYaClasificado { get; set; }
        public decimal PesoRestantePendiente { get; set; }
        public string Observaciones { get; set; }
        public string EstadoDtIng { get; set; }
        public int Id_Origen { get; set; }
        public int? Id_Detalle_HDR { get; set; }
        public int Id_Tipo_Material { get; set; }
        public string TipoMaterialEsperado { get; set; }
        public string Origen { get; set; }
    }
}



//using System;
//using System.Collections.Generic;
//using System.Data;
//using System.Data.SqlClient;
//using System.Configuration;

//namespace API_SITMAS.Models
//{
//    public class Material_Clasificado
//    {
//        #region Atributos
//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;
//        #endregion

//        #region Propiedades
//        public int Id { get; set; }
//        public int Id_Detalle_Ingreso { get; set; }
//        public int Id_SubTipo_Material { get; set; }
//        public decimal PesoUtil { get; set; }
//        public DateTime? FechaClasificacion { get; set; }
//        public int Id_Estado_Material { get; set; }
//        public int Id_Destino { get; set; }
//        public int Id_Usuario_Clasificador { get; set; }
//        public string EstadoMtCl { get; set; }

//        // Propiedades descriptivas mapeadas de la vista
//        public string EstadoMaterial { get; set; }
//        public string Destino { get; set; }
//        public string UsuarioClasificador { get; set; }
//        public string MaterialOriginal { get; set; }
//        #endregion

//        #region Metodos

//        public List<Material_Clasificado> SelectAll()
//        {
//            List<Material_Clasificado> lista = new List<Material_Clasificado>();
//            string sqlSentencia = "sp_ListarMaterial_Clasificado";

//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCnn.Open();

//                using (SqlDataReader reader = sqlCom.ExecuteReader())
//                {
//                    while (reader.Read())
//                    {
//                        Material_Clasificado obj = new Material_Clasificado();
//                        obj.Id = Convert.ToInt32(reader["Id"]);
//                        obj.Id_Detalle_Ingreso = Convert.ToInt32(reader["Id_Detalle_Ingreso"]);
//                        obj.Id_SubTipo_Material = reader["Id_SubTipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_SubTipo_Material"]) : 0;
//                        obj.PesoUtil = Convert.ToDecimal(reader["PesoUtil"]);
//                        obj.FechaClasificacion = reader["FechaClasificacion"] != DBNull.Value ? Convert.ToDateTime(reader["FechaClasificacion"]) : (DateTime?)null;
//                        obj.Id_Estado_Material = Convert.ToInt32(reader["Id_Estado_Material"]);
//                        obj.Id_Destino = Convert.ToInt32(reader["Id_Destino"]);
//                        obj.Id_Usuario_Clasificador = Convert.ToInt32(reader["Id_Usuario_Clasificador"]);
//                        obj.EstadoMtCl = reader["EstadoMtCl"].ToString();

//                        lista.Add(obj);
//                    }
//                }
//            }
//            return lista;
//        }

//        public List<Material_Clasificado> SelectVista()
//        {
//            List<Material_Clasificado> lista = new List<Material_Clasificado>();
//            string sqlSentencia = "sp_ListarVistaMaterial_Clasificado";

//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCnn.Open();

//                using (SqlDataReader reader = sqlCom.ExecuteReader())
//                {
//                    while (reader.Read())
//                    {
//                        Material_Clasificado obj = new Material_Clasificado();

//                        obj.Id = Convert.ToInt32(reader["Id"]);
//                        obj.Id_Detalle_Ingreso = Convert.ToInt32(reader["IdDetalleIngreso"]);
//                        obj.Id_SubTipo_Material = reader["Id_SubTipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_SubTipo_Material"]) : 0;
//                        obj.PesoUtil = Convert.ToDecimal(reader["PesoUtil"]);
//                        obj.FechaClasificacion = reader["FechaClasificacion"] != DBNull.Value ? Convert.ToDateTime(reader["FechaClasificacion"]) : (DateTime?)null;
//                        obj.EstadoMtCl = reader["EstadoMtCl"].ToString();

//                        obj.EstadoMaterial = reader["EstadoMaterial"].ToString();
//                        obj.Destino = reader["Destino"].ToString();
//                        obj.UsuarioClasificador = reader["UsuarioClasificador"].ToString();

//                        // Corrección de nombre de columna mapeada de la vista
//                        obj.MaterialOriginal = reader["MaterialClasificado"] != DBNull.Value ? reader["MaterialClasificado"].ToString() : string.Empty;

//                        lista.Add(obj);
//                    }
//                }
//            }
//            return lista;
//        }

//        public int Insertar()
//        {
//            string sqlSentencia = "sp_InsertarMaterial_Clasificado";
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = Id_Detalle_Ingreso;
//                sqlCom.Parameters.Add("@IdSubTipoMaterial", SqlDbType.Int).Value = Id_SubTipo_Material;
//                sqlCom.Parameters.Add("@PesoUtil", SqlDbType.Decimal).Value = PesoUtil;

//                // Si la fecha es nula, permitimos que pase nula o enviamos la fecha provista
//                if (FechaClasificacion.HasValue)
//                    sqlCom.Parameters.Add("@FechaClasificacion", SqlDbType.DateTime).Value = FechaClasificacion.Value;
//                else
//                    sqlCom.Parameters.Add("@FechaClasificacion", SqlDbType.DateTime).Value = DateTime.Now;

//                sqlCom.Parameters.Add("@IdEstadoMaterial", SqlDbType.Int).Value = Id_Estado_Material;

//                // Destino: Si es <= 0 pasamos DBNull para activar el fallback del SP a 10 ("Gestión")
//                sqlCom.Parameters.Add("@IdDestino", SqlDbType.Int).Value = Id_Destino > 0 ? (object)Id_Destino : DBNull.Value;
//                sqlCom.Parameters.Add("@IdUsuarioClasificador", SqlDbType.Int).Value = Id_Usuario_Clasificador;

//                sqlCnn.Open();

//                // ExecuteScalar para capturar el SCOPE_IDENTITY() retornado por el SP
//                object result = sqlCom.ExecuteScalar();
//                return result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
//            }
//        }

//        public void Modificar()
//        {
//            string sqlSentencia = "sp_ActualizarMaterial_Clasificado";
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;
//                // REMOVIDO: @IdDetalleIngreso para coincidir con la firma del SP corregido
//                sqlCom.Parameters.Add("@IdSubTipoMaterial", SqlDbType.Int).Value = Id_SubTipo_Material;
//                sqlCom.Parameters.Add("@PesoUtil", SqlDbType.Decimal).Value = PesoUtil;
//                sqlCom.Parameters.Add("@FechaClasificacion", SqlDbType.DateTime).Value = FechaClasificacion ?? DateTime.Now;
//                sqlCom.Parameters.Add("@IdEstadoMaterial", SqlDbType.Int).Value = Id_Estado_Material;
//                sqlCom.Parameters.Add("@IdDestino", SqlDbType.Int).Value = Id_Destino > 0 ? (object)Id_Destino : DBNull.Value;
//                sqlCom.Parameters.Add("@IdUsuarioClasificador", SqlDbType.Int).Value = Id_Usuario_Clasificador;

//                sqlCnn.Open();
//                sqlCom.ExecuteNonQuery();
//            }
//        }

//        public void Borrar()
//        {
//            string sqlSentencia = "sp_EliminarMaterial_Clasificado";
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;
//                sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;

//                sqlCnn.Open();
//                sqlCom.ExecuteNonQuery();
//            }
//        }
//        #endregion
//    }
//}

