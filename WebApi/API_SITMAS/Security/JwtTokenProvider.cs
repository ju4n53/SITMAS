using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace API_SITMAS.Security
{
    public static class JwtTokenProvider
    {
        public static string GenerarToken(int idUsuario, string nombre, string rol, List<string> permisos)
        {
            // 1. Traemos la llave secreta del Web.config
            string secretKey = ConfigurationManager.AppSettings["JwtSecretKey"];
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // 2. Armamos la "carga útil" (Claims) de la pulsera
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, idUsuario.ToString()),
                new Claim("nombre", nombre),
                new Claim(ClaimTypes.Role, rol) //la constante oficial de .NET
                //new Claim("rol", rol)
            };

            // Agregamos cada permiso como un Claim individual
            foreach (var permiso in permisos)
            {
                claims.Add(new Claim("permiso", permiso));
            }

            // 3. Ensamblamos el token con una fecha de expiración (ej: 8 horas para la jornada laboral)
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(8),
                SigningCredentials = credentials
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenConfigurado = tokenHandler.CreateToken(tokenDescriptor);

            // 4. Entregamos el string encriptado final
            return tokenHandler.WriteToken(tokenConfigurado);
        }
    }
}