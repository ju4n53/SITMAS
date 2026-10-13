using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using System.Web.Http.Cors;
using API_SITMAS.Security;

namespace API_SITMAS
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Usar "*" en los tres parámetros limpia los conflictos de preflight
            var cors = new EnableCorsAttribute("*", "*", "*");
            config.EnableCors(cors);

            //Escaner de tokens JWT
            config.MessageHandlers.Add(new TokenValidationHandler());
            
            // Rutas de API web
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            config.Formatters.JsonFormatter.SupportedMediaTypes.
                Add(new System.Net.Http.Headers.MediaTypeHeaderValue("text/html"));
        }
    }
}
