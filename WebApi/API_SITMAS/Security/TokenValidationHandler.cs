using Microsoft.IdentityModel.Tokens;
using System;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

namespace API_SITMAS.Security
{
    public class TokenValidationHandler : DelegatingHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            // 1. Verificamos si la petición trae la pulsera (Cabecera Authorization)
            if (!request.Headers.Contains("Authorization"))
            {
                return base.SendAsync(request, cancellationToken); // Pasa sin identidad, el [Authorize] lo rebotará luego.
            }

            // 2. Extraemos el JWT limpiando la palabra "Bearer "
            string token = request.Headers.GetValues("Authorization").First().Replace("Bearer ", "");

            try
            {
                // 3. Traemos nuestra llave secreta para verificar que no sea un token falso
                string secretKey = ConfigurationManager.AppSettings["JwtSecretKey"];
                var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

                // 4. Le explicamos al escáner cómo validar
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = securityKey,
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true, // Verifica que no esté vencido
                    ClockSkew = TimeSpan.Zero
                };

                // 5. ¡El escáner valida la pulsera!
                var tokenHandler = new JwtSecurityTokenHandler();
                SecurityToken validToken;
                ClaimsPrincipal principal = tokenHandler.ValidateToken(token, validationParameters, out validToken);

                // 6. ¡Éxito! Sella la identidad en el subproceso actual del servidor
                Thread.CurrentPrincipal = principal;
                if (HttpContext.Current != null)
                {
                    HttpContext.Current.User = principal;
                }

                // Permite que la petición continúe hacia el controlador
                return base.SendAsync(request, cancellationToken);
            }
            catch (Exception)
            {
                // Si la firma es inválida, fue alterada o el token caducó, lo bloqueamos de inmediato
                return Task.FromResult(request.CreateResponse(HttpStatusCode.Unauthorized, "Token inválido o expirado."));
            }
        }
    }
}