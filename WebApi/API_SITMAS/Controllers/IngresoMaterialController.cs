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
    public class IngresoMaterialController : ApiController
    {
        // GET: api/IngresoMaterial
        [HttpGet]
        public List<Ingreso_Material> ListarTodo()
        {
            Ingreso_Material oIngresoMaterial = new Ingreso_Material();

            DataTable dt = oIngresoMaterial.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Ingreso_Material>>(listaJson);

            return Lista;

        }

        // GET: api/Empleado/5
        //[HttpGet]

        //public Empleado ListarPorId(int id)
        //{
        //    Empleado oEmpleado = new Empleado();
        //    oEmpleado.Id = id;

        //    DataTable dt = oEmpleado.SelectId();

        //    var ListaJsom = JsonConvert.SerializeObject(dt);

        //    var obj = JsonConvert.DeserializeObject<List<Empleado>>(ListaJsom).ToList().FirstOrDefault();

        //    return obj;

        //}

        //// POST: api/Empleado
        [HttpPost]

        public void Insertar([FromBody] Ingreso_Material value)
        {
            Ingreso_Material oIngresoMaterial = new Ingreso_Material();
            oIngresoMaterial.Id_Origen = value.Id_Origen;
            oIngresoMaterial.Id_Usuario_Registro = value.Id_Usuario_Registro;
            oIngresoMaterial.Id_Camionero_Ingreso = value.Id_Camionero_Ingreso;
            oIngresoMaterial.Id_Vehiculo_Ingreso = value.Id_Vehiculo_Ingreso;
           

            oIngresoMaterial.Insertar();
        }

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


        //[HttpGet]
        //public List<Empleado> ListarVista()
        //{
        //    Empleado oEmpleado = new Empleado();

        //    var dt = oEmpleado.VistalistadoEmpleados();

        //    var ListaJsom = JsonConvert.SerializeObject(dt);

        //    var Lista = JsonConvert.DeserializeObject<List<Empleado>>(ListaJsom);
        //    return Lista;


        //}

    }
}
