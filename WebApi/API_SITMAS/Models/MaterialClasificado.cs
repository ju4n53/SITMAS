using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;

namespace API_SITMAS.Models
{
    public class Material_Clasificado
    {
        #region Atributos
        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;
        #endregion

        #region Propiedades
        public int Id { get; set; }
        public int Id_Detalle_Ingreso { get; set; }
        public int Id_SubTipo_Material { get; set; }
        public decimal PesoUtil { get; set; }
        public DateTime? FechaClasificacion { get; set; }
        public int Id_Estado_Material { get; set; }
        public int Id_Destino { get; set; }
        public int Id_Usuario_Clasificador { get; set; }
        public string EstadoMtCl { get; set; }

        // Propiedades descriptivas mapeadas de la vista
        public string EstadoMaterial { get; set; }
        public string Destino { get; set; }
        public string UsuarioClasificador { get; set; }
        public string MaterialOriginal { get; set; }
        #endregion

        #region Metodos

        public List<Material_Clasificado> SelectAll()
        {
            List<Material_Clasificado> lista = new List<Material_Clasificado>();
            string sqlSentencia = "sp_ListarMaterial_Clasificado";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Material_Clasificado obj = new Material_Clasificado();
                        obj.Id = Convert.ToInt32(reader["Id"]);
                        obj.Id_Detalle_Ingreso = Convert.ToInt32(reader["Id_Detalle_Ingreso"]);
                        obj.Id_SubTipo_Material = reader["Id_SubTipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_SubTipo_Material"]) : 0;
                        obj.PesoUtil = Convert.ToDecimal(reader["PesoUtil"]);
                        obj.FechaClasificacion = reader["FechaClasificacion"] != DBNull.Value ? Convert.ToDateTime(reader["FechaClasificacion"]) : (DateTime?)null;
                        obj.Id_Estado_Material = Convert.ToInt32(reader["Id_Estado_Material"]);
                        obj.Id_Destino = Convert.ToInt32(reader["Id_Destino"]);
                        obj.Id_Usuario_Clasificador = Convert.ToInt32(reader["Id_Usuario_Clasificador"]);
                        obj.EstadoMtCl = reader["EstadoMtCl"].ToString();

                        lista.Add(obj);
                    }
                }
            }
            return lista;
        }

        public List<Material_Clasificado> SelectVista()
        {
            List<Material_Clasificado> lista = new List<Material_Clasificado>();
            string sqlSentencia = "sp_ListarVistaMaterial_Clasificado";

            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Material_Clasificado obj = new Material_Clasificado();

                        obj.Id = Convert.ToInt32(reader["Id"]);
                        obj.Id_Detalle_Ingreso = Convert.ToInt32(reader["IdDetalleIngreso"]);
                        obj.Id_SubTipo_Material = reader["Id_SubTipo_Material"] != DBNull.Value ? Convert.ToInt32(reader["Id_SubTipo_Material"]) : 0;
                        obj.PesoUtil = Convert.ToDecimal(reader["PesoUtil"]);
                        obj.FechaClasificacion = reader["FechaClasificacion"] != DBNull.Value ? Convert.ToDateTime(reader["FechaClasificacion"]) : (DateTime?)null;
                        obj.EstadoMtCl = reader["EstadoMtCl"].ToString();

                        obj.EstadoMaterial = reader["EstadoMaterial"].ToString();
                        obj.Destino = reader["Destino"].ToString();
                        obj.UsuarioClasificador = reader["UsuarioClasificador"].ToString();

                        // Corrección de nombre de columna mapeada de la vista
                        obj.MaterialOriginal = reader["MaterialClasificado"] != DBNull.Value ? reader["MaterialClasificado"].ToString() : string.Empty;

                        lista.Add(obj);
                    }
                }
            }
            return lista;
        }

        public int Insertar()
        {
            string sqlSentencia = "sp_InsertarMaterial_Clasificado";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = Id_Detalle_Ingreso;
                sqlCom.Parameters.Add("@IdSubTipoMaterial", SqlDbType.Int).Value = Id_SubTipo_Material;
                sqlCom.Parameters.Add("@PesoUtil", SqlDbType.Decimal).Value = PesoUtil;

                // Si la fecha es nula, permitimos que pase nula o enviamos la fecha provista
                if (FechaClasificacion.HasValue)
                    sqlCom.Parameters.Add("@FechaClasificacion", SqlDbType.DateTime).Value = FechaClasificacion.Value;
                else
                    sqlCom.Parameters.Add("@FechaClasificacion", SqlDbType.DateTime).Value = DateTime.Now;

                sqlCom.Parameters.Add("@IdEstadoMaterial", SqlDbType.Int).Value = Id_Estado_Material;

                // Destino: Si es <= 0 pasamos DBNull para activar el fallback del SP a 10 ("Gestión")
                sqlCom.Parameters.Add("@IdDestino", SqlDbType.Int).Value = Id_Destino > 0 ? (object)Id_Destino : DBNull.Value;
                sqlCom.Parameters.Add("@IdUsuarioClasificador", SqlDbType.Int).Value = Id_Usuario_Clasificador;

                sqlCnn.Open();

                // ExecuteScalar para capturar el SCOPE_IDENTITY() retornado por el SP
                object result = sqlCom.ExecuteScalar();
                return result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
            }
        }

        public void Modificar()
        {
            string sqlSentencia = "sp_ActualizarMaterial_Clasificado";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;
                // REMOVIDO: @IdDetalleIngreso para coincidir con la firma del SP corregido
                sqlCom.Parameters.Add("@IdSubTipoMaterial", SqlDbType.Int).Value = Id_SubTipo_Material;
                sqlCom.Parameters.Add("@PesoUtil", SqlDbType.Decimal).Value = PesoUtil;
                sqlCom.Parameters.Add("@FechaClasificacion", SqlDbType.DateTime).Value = FechaClasificacion ?? DateTime.Now;
                sqlCom.Parameters.Add("@IdEstadoMaterial", SqlDbType.Int).Value = Id_Estado_Material;
                sqlCom.Parameters.Add("@IdDestino", SqlDbType.Int).Value = Id_Destino > 0 ? (object)Id_Destino : DBNull.Value;
                sqlCom.Parameters.Add("@IdUsuarioClasificador", SqlDbType.Int).Value = Id_Usuario_Clasificador;

                sqlCnn.Open();
                sqlCom.ExecuteNonQuery();
            }
        }

        public void Borrar()
        {
            string sqlSentencia = "sp_EliminarMaterial_Clasificado";
            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
            {
                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.Add("@Id", SqlDbType.Int).Value = Id;

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
//    public class Material_Clasificado
//    {
//        #region Atributos
//        private string conectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;
//        #endregion

//        #region Propiedades
//        public int Id { get; set; }
//        public int Id_Detalle_Ingreso { get; set; }

//        // 👈 Nueva propiedad para el Subtipo
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

//                        // Capturamos el subtipo, protegiendo por si hay NULLs antiguos
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
//                        obj.MaterialOriginal = reader["MaterialOriginal"].ToString();

//                        lista.Add(obj);
//                    }
//                }
//            }
//            return lista;
//        }

//        public void Insertar()
//        {
//            string sqlSentencia = "sp_InsertarMaterial_Clasificado";
//            using (SqlConnection sqlCnn = new SqlConnection(conectionString))
//            {
//                SqlCommand sqlCom = new SqlCommand(sqlSentencia, sqlCnn);
//                sqlCom.CommandType = CommandType.StoredProcedure;

//                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = Id_Detalle_Ingreso;
//                sqlCom.Parameters.Add("@IdSubTipoMaterial", SqlDbType.Int).Value = Id_SubTipo_Material; // 👈 Nuevo
//                sqlCom.Parameters.Add("@PesoUtil", SqlDbType.Decimal).Value = PesoUtil;
//                sqlCom.Parameters.Add("@FechaClasificacion", SqlDbType.DateTime).Value = FechaClasificacion ?? DateTime.Now;
//                sqlCom.Parameters.Add("@IdEstadoMaterial", SqlDbType.Int).Value = Id_Estado_Material;
//                sqlCom.Parameters.Add("@IdDestino", SqlDbType.Int).Value = Id_Destino;
//                sqlCom.Parameters.Add("@IdUsuarioClasificador", SqlDbType.Int).Value = Id_Usuario_Clasificador;

//                sqlCnn.Open();
//                sqlCom.ExecuteNonQuery();
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
//                sqlCom.Parameters.Add("@IdDetalleIngreso", SqlDbType.Int).Value = Id_Detalle_Ingreso;
//                sqlCom.Parameters.Add("@IdSubTipoMaterial", SqlDbType.Int).Value = Id_SubTipo_Material; // 👈 Nuevo
//                sqlCom.Parameters.Add("@PesoUtil", SqlDbType.Decimal).Value = PesoUtil;
//                sqlCom.Parameters.Add("@FechaClasificacion", SqlDbType.DateTime).Value = FechaClasificacion ?? DateTime.Now;
//                sqlCom.Parameters.Add("@IdEstadoMaterial", SqlDbType.Int).Value = Id_Estado_Material;
//                sqlCom.Parameters.Add("@IdDestino", SqlDbType.Int).Value = Id_Destino;
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
