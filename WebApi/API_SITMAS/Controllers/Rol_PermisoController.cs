using API_SITMAS.Models;
using System;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    [RoutePrefix("api/Rol_Permiso")]
    public class Rol_PermisoController : ApiController
    {
        private readonly RolPermisoDatos _datos = new RolPermisoDatos();

        [HttpGet]
        [Route("")]
        public IHttpActionResult ListarRelaciones()
        {
            try
            {
                return Ok(_datos.ListarRelaciones());
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("Asignar")]
        public IHttpActionResult AsignarPermiso([FromBody] RolPermisoDTO dto)
        {
            if (dto == null || dto.Id_Rol <= 0 || dto.Id_Permiso <= 0)
                return BadRequest("Se requieren IDs válidos de Rol y Permiso.");

            try
            {
                _datos.AsignarPermisoARol(dto.Id_Rol, dto.Id_Permiso);
                return Ok(new { mensaje = "Permiso asignado al rol exitosamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("Remover")]
        public IHttpActionResult RemoverPermiso([FromBody] RolPermisoDTO dto)
        {
            if (dto == null || dto.Id_Rol <= 0 || dto.Id_Permiso <= 0)
                return BadRequest("Se requieren IDs válidos de Rol y Permiso.");

            try
            {
                _datos.EliminarPermisoDeRol(dto.Id_Rol, dto.Id_Permiso);
                return Ok(new { mensaje = "Permiso removido del rol correctamente." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}