using API_SITMAS.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    public class TrazabilidadController : ApiController
    {
        // GET: api/MaterialClasificado
        //[HttpGet]
        //public List<Material_Clasificado> ListarTodo()
        //{
        //    Material_Clasificado oMaterial = new Material_Clasificado();

        //    DataTable dt = oMaterial.SelectAll();
        //    var listaJson = JsonConvert.SerializeObject(dt);

        //    var Lista = JsonConvert.DeserializeObject<List<Material_Clasificado>>(listaJson);

        //    return Lista;

        //}

        // GET: api/MaterialClasificado/5
        //[HttpGet]

        //public Material_Clasificado ListarPorId(int id)
        //{
        //    Material_Clasificado oMaterial = new Material_Clasificado();
        //    oMaterial.Id = id;

        //    DataTable dt = oMaterial.SelectId();

        //    var ListaJsom = JsonConvert.SerializeObject(dt);

        //    var obj = JsonConvert.DeserializeObject<List<Material_Clasificado>>(ListaJsom).ToList().FirstOrDefault();
        //    return obj;

        //}

        // POST: api/MaterialClasificado
        //[HttpPost]

        //public void Insertar([FromBody] Material_Clasificado value)
        //{
        //    Material_Clasificado oMaterial = new Material_Clasificado();
        //    oMaterial.Id_Detalle_Ingreso = value.Id_Detalle_Ingreso;
        //    oMaterial.PesoTotal = value.PesoTotal;
        //    oMaterial.Id_Estado_Material = value.Id_Estado_Material;
        //    oMaterial.Id_Destino = value.Id_Destino;
        //    oMaterial.Id_Usuario_Clasificador = value.Id_Usuario_Clasificador;

        //    oMaterial.Insertar();
        //}

        // PUT: api/Empleado/5
        //[HttpPut]

        //public void Modificar(int id, [FromBody] Empleado value)
        //{

        //    Empleado oEmpleado = new Empleado();
        //    oEmpleado.Id = id;
        //    oEmpleado.Apellido = value.Apellido;
        //    oEmpleado.Nombre = value.Nombre;
        //    oEmpleado.Cuil = value.Cuil;
        //    oEmpleado.Telefono = value.Telefono;
        //    oEmpleado.Email = value.Email;
        //    oEmpleado.Fecha_Ingreso = value.Fecha_Ingreso;
        //    oEmpleado.Id_Cargo = value.Id_Cargo;
        //    oEmpleado.Id_Area = value.Id_Area;
        //    oEmpleado.Id_Barrio = value.Id_Barrio;
        //    oEmpleado.Id_Estado_Empleado = value.Id_Estado_Empleado;
        //    oEmpleado.Calle = value.Calle;
        //    oEmpleado.Numero = value.Numero;
        //    oEmpleado.Piso = value.Piso;
        //    oEmpleado.Dpto = value.Dpto;

        //    oEmpleado.Modificar();


        //}

        // DELETE: api/Empleado/5
        //[HttpDelete]

        //public void Borrar(int id)
        //{

        //    Empleado oEmpleado = new Empleado();
        //    oEmpleado.Id = id;

        //    oEmpleado.Borrar();

        //}


        [HttpGet]
        public List<Trazabilidad_Material> ListarVista()
        {
            Trazabilidad_Material oTrazabilidad = new Trazabilidad_Material();

            var dt = oTrazabilidad.VistaReportesTrazabilidad(); 
            var ListaJsom = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Trazabilidad_Material>>(ListaJsom);
            return Lista;


        }


    }
}
