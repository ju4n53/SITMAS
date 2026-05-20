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
    public class DetalleIngresoController : ApiController
    {
        // GET: api/DetalleIngreso
        [HttpGet]
        public List<Detalle_Ingreso> ListarTodo()
        {
            Detalle_Ingreso oDetalleIngreso = new Detalle_Ingreso();

            DataTable dt = oDetalleIngreso.SelectAll();
            var listaJson = JsonConvert.SerializeObject(dt);

            var Lista = JsonConvert.DeserializeObject<List<Detalle_Ingreso>>(listaJson);

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

        // POST: api/DetalleIngreso
        [HttpPost]

        public void Insertar([FromBody] Detalle_Ingreso value)
        {
            Detalle_Ingreso oDetalleIngreso = new Detalle_Ingreso();
            oDetalleIngreso.Id_Ingreso_Material = value.Id_Ingreso_Material;
            oDetalleIngreso.Id_SubTipo_Material = value.Id_SubTipo_Material;
            oDetalleIngreso.PesoBruto = value.PesoBruto;
            oDetalleIngreso.Observaciones = value.Observaciones;

            oDetalleIngreso.Insertar();
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
