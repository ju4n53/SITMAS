using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace API_SITMAS.Models
{
    public class Combustible
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["CadenaSITMAS"].ConnectionString;

        private static readonly HttpClient _httpClient = CrearHttpClient();

        private static HttpClient CrearHttpClient()
        {
            var client = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(20)
            };
            // Muchas APIs modernas bloquean peticiones sin User-Agent
            client.DefaultRequestHeaders.Add("User-Agent", "SITMAS-Logistica/1.0");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            return client;
        }

        // Constante de dominio: Shell Evolux Diésel (Gasoil Grado 2)
        public const int ID_GASOIL_SHELL_EVOLUX = 3;

        public int Id_Combustible { get; set; }
        public string Tipo_combustible { get; set; }
        public decimal Precio_valor { get; set; }
        public DateTime? Fecha_Actualizacion { get; set; }
        public string FechaActualizacionFormateada { get; set; }
        public string Fuente_Actualizacion { get; set; }

        public List<Combustible> ObtenerTodos()
        {
            var lista = new List<Combustible>();

            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ListarCombustibles", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCnn.Open();

                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var item = new Combustible
                        {
                            Id_Combustible = Convert.ToInt32(reader["Id_Combustible"]),
                            Tipo_combustible = reader["Tipo_combustible"].ToString(),
                            Precio_valor = Convert.ToDecimal(reader["Precio_valor"])
                        };

                        if (TieneColumna(reader, "Fecha_Actualizacion") && reader["Fecha_Actualizacion"] != DBNull.Value)
                        {
                            DateTime fecha = Convert.ToDateTime(reader["Fecha_Actualizacion"]);
                            item.Fecha_Actualizacion = fecha;
                            item.FechaActualizacionFormateada = fecha.ToString("dd/MM/yyyy HH:mm");
                        }

                        if (TieneColumna(reader, "Fuente_Actualizacion") && reader["Fuente_Actualizacion"] != DBNull.Value)
                        {
                            item.Fuente_Actualizacion = reader["Fuente_Actualizacion"].ToString();
                        }

                        lista.Add(item);
                    }
                }
            }
            return lista;
        }

        /// <summary>
        /// Actualiza manualmente el precio por litro (mantiene compatibilidad con PUT api/combustible/{id}).
        /// </summary>
        public bool ActualizarPrecio()
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarPrecioCombustible", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;

                sqlCom.Parameters.AddWithValue("@Id_Combustible", Id_Combustible);
                sqlCom.Parameters.AddWithValue("@NuevoPrecio", Precio_valor);
                sqlCom.Parameters.AddWithValue("@Fuente", "Carga Manual");

                sqlCnn.Open();
                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    return reader.HasRows;
                }
            }
        }

        public async Task<ResultadoSincronizacionCombustible> SincronizarPrecioShellAsync()
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            var logsDiagnostico = new List<string>();

            // 1. FUENTE PRIMARIA: API Argly v1
            var resultadoArgly = await ConsultarArglyPrimariaAsync();
            logsDiagnostico.Add($"Argly: {resultadoArgly.Detalle}");

            if (resultadoArgly.Precio > 0)
            {
                string fuente = string.IsNullOrWhiteSpace(resultadoArgly.Vigencia)
                    ? "API Argly v1 (Shell Sabattini 5231)"
                    : $"API Argly v1 - Sabattini 5231 (Vig. {resultadoArgly.Vigencia})";

                Combustible actualizado = GuardarPrecioSincronizadoEnBD(ID_GASOIL_SHELL_EVOLUX, resultadoArgly.Precio, fuente);
                return new ResultadoSincronizacionCombustible
                {
                    SincronizadoDesdeApi = true,
                    Mensaje = $"Precio actualizado correctamente desde {fuente}.",
                    Diagnostico = string.Join(" | ", logsDiagnostico),
                    Combustible = actualizado
                };
            }

            // 2. FUENTE DE RESPALDO: Secretaría de Energía
            var resultadoEnergia = await ConsultarSecretariaEnergiaRespaldoAsync();
            logsDiagnostico.Add($"Energía: {resultadoEnergia.Detalle}");

            if (resultadoEnergia.Precio > 0)
            {
                string fuente = "API Secretaría de Energía (Respaldo - Sabattini 5231)";
                Combustible actualizado = GuardarPrecioSincronizadoEnBD(ID_GASOIL_SHELL_EVOLUX, resultadoEnergia.Precio, fuente);
                return new ResultadoSincronizacionCombustible
                {
                    SincronizadoDesdeApi = true,
                    Mensaje = $"Precio actualizado correctamente desde {fuente}.",
                    Diagnostico = string.Join(" | ", logsDiagnostico),
                    Combustible = actualizado
                };
            }

            // 3. RED DE SEGURIDAD: Conserva el precio vigente en BD
            Combustible actualEnBd = ObtenerPorId(ID_GASOIL_SHELL_EVOLUX);
            return new ResultadoSincronizacionCombustible
            {
                SincronizadoDesdeApi = false,
                Mensaje = "No se pudo conectar con las APIs externas. Se mantiene el último precio vigente registrado en SITMAS.",
                Diagnostico = string.Join(" | ", logsDiagnostico),
                Combustible = actualEnBd
            };
        }

        private async Task<(decimal Precio, string Vigencia, string Detalle)> ConsultarArglyPrimariaAsync()
        {
            try
            {
                string url = "https://api.argly.com.ar/v1/combustibles?empresa=shell";
                HttpResponseMessage response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                    return (0, null, $"HTTP {(int)response.StatusCode} ({response.ReasonPhrase})");

                string json = await response.Content.ReadAsStringAsync();
                JToken root = JToken.Parse(json);

                // Buscamos todos los objetos JSON internos que tengan "direccion" y "precios",
                // sin importar cómo se llame el arreglo contenedor en la raíz.
                var estaciones = root.SelectTokens("$..*")
                    .OfType<JObject>()
                    .Where(obj => obj["direccion"] != null && obj["precios"] != null)
                    .ToList();

                if (estaciones.Count == 0)
                    return (0, null, "JSON recibido sin objetos con direccion/precios.");

                int horaActual = DateTime.Now.Hour;
                bool esHorarioNocturno = (horaActual >= 22 || horaActual < 6);

                foreach (JObject item in estaciones)
                {
                    string provincia = NormalizarTexto(item["provincia"]?.ToString());
                    string localidad = NormalizarTexto(item["localidad"]?.ToString());
                    string direccion = NormalizarTexto(item["direccion"]?.ToString());
                    string combustible = NormalizarTexto(item["combustible"]?.ToString());

                    bool esEstacionSabattini = provincia.Contains("cordoba")
                                               && localidad.Contains("cordoba")
                                               && direccion.Contains("sabattini")
                                               && direccion.Contains("5231");

                    bool esGasoilGrado2 = combustible.Contains("gasoil") && combustible.Contains("grado 2");

                    if (esEstacionSabattini && esGasoilGrado2)
                    {
                        JToken preciosObj = item["precios"];
                        JToken tokenDia = preciosObj["día"] ?? preciosObj["dia"];
                        JToken tokenNoche = preciosObj["noche"];

                        decimal precioDia = ParsearDecimalSeguro(tokenDia);
                        decimal precioNoche = ParsearDecimalSeguro(tokenNoche);

                        decimal precioElegido = esHorarioNocturno
                            ? (precioNoche > 0 ? precioNoche : precioDia)
                            : (precioDia > 0 ? precioDia : precioNoche);

                        if (precioElegido > 0)
                        {
                            string vigencia = item["vigencia"]?.ToString();
                            return (Math.Round(precioElegido, 2), vigencia, $"OK (${precioElegido})");
                        }
                    }
                }

                return (0, null, $"Se analizaron {estaciones.Count} registros pero ninguno coincidió con Sabattini 5231 + Gasoil Grado 2.");
            }
            catch (Exception ex)
            {
                string msgError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return (0, null, $"Excepción: {msgError}");
            }
        }

        private async Task<(decimal Precio, string Detalle)> ConsultarSecretariaEnergiaRespaldoAsync()
        {
            try
            {
                string url = "https://datos.energia.gob.ar/api/3/action/datastore_search?resource_id=80ac25de-a44a-4445-9215-090cf55cfda5&q=SABATTINI+5231";
                HttpResponseMessage response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                    return (0, $"HTTP {(int)response.StatusCode}");

                string json = await response.Content.ReadAsStringAsync();
                JObject root = JObject.Parse(json);

                if (!(root["success"]?.Value<bool>() ?? false))
                    return (0, "API Energía respondió success=false");

                JArray records = root["result"]?["records"] as JArray;
                if (records == null || records.Count == 0)
                    return (0, "Sin registros en datastore");

                foreach (JToken reg in records)
                {
                    string producto = NormalizarTexto(reg["producto"]?.ToString());
                    string empresa = NormalizarTexto(reg["empresabandera"]?.ToString());

                    if (empresa.Contains("shell") && producto.Contains("grado 2"))
                    {
                        decimal precio = ParsearDecimalSeguro(reg["precio"]);
                        if (precio > 0) return (Math.Round(precio, 2), $"OK (${precio})");
                    }
                }
                return (0, "Sin coincidencia Shell Grado 2");
            }
            catch (Exception ex)
            {
                string msgError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return (0, $"Excepción: {msgError}");
            }
        }

        // Quita tildes y pasa a minúsculas para comparaciones inmunes a acentos ("CÓRDOBA" -> "cordoba")
        private static string NormalizarTexto(string texto)
        {
            if (string.IsNullOrWhiteSpace(texto)) return string.Empty;

            string descompuesto = texto.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (char c in descompuesto)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                    sb.Append(c);
            }
            return sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant().Trim();
        }

        private static decimal ParsearDecimalSeguro(JToken token)
        {
            if (token == null || token.Type == JTokenType.Null) return 0;

            if (token.Type == JTokenType.Integer || token.Type == JTokenType.Float)
                return token.Value<decimal>();

            string texto = token.ToString().Replace(",", ".");
            return decimal.TryParse(texto, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal valor)
                ? valor
                : 0;
        }

        private Combustible GuardarPrecioSincronizadoEnBD(int idCombustible, decimal nuevoPrecio, string fuente)
        {
            using (SqlConnection sqlCnn = new SqlConnection(connectionString))
            using (SqlCommand sqlCom = new SqlCommand("sp_ActualizarPrecioCombustible", sqlCnn))
            {
                sqlCom.CommandType = CommandType.StoredProcedure;
                sqlCom.Parameters.AddWithValue("@Id_Combustible", idCombustible);
                sqlCom.Parameters.AddWithValue("@NuevoPrecio", nuevoPrecio);
                sqlCom.Parameters.AddWithValue("@Fuente", fuente);

                sqlCnn.Open();
                using (SqlDataReader reader = sqlCom.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return new Combustible
                        {
                            Id_Combustible = Convert.ToInt32(reader["Id_Combustible"]),
                            Tipo_combustible = reader["Tipo_combustible"].ToString(),
                            Precio_valor = Convert.ToDecimal(reader["Precio_valor"]),
                            Fecha_Actualizacion = Convert.ToDateTime(reader["Fecha_Actualizacion"]),
                            FechaActualizacionFormateada = reader["FechaActualizacionFormateada"].ToString(),
                            Fuente_Actualizacion = reader["Fuente_Actualizacion"].ToString()
                        };
                    }
                }
            }
            return ObtenerPorId(idCombustible);
        }

        public Combustible ObtenerPorId(int idCombustible)
        {
            return ObtenerTodos().Find(c => c.Id_Combustible == idCombustible);
        }

        private static bool TieneColumna(IDataRecord reader, string nombreColumna)
        {
            for (int i = 0; i < reader.FieldCount; i++)
            {
                if (reader.GetName(i).Equals(nombreColumna, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            return false;
        }
    }

    public class ResultadoSincronizacionCombustible
    {
        public bool SincronizadoDesdeApi { get; set; }
        public string Mensaje { get; set; }
        public string Diagnostico { get; set; }
        public Combustible Combustible { get; set; }
    }
}