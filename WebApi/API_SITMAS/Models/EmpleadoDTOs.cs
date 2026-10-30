//using System;

//namespace API_SITMAS.Models
//{
//    // Solo para devolver datos personales (Lista principal)
//    public class EmpleadoPersonalDTO
//    {
//        public int Id { get; set; }
//        public string Apellido { get; set; }
//        public string Nombre { get; set; }
//        public string Cuil { get; set; }
//        public string Calle { get; set; }
//        public string Numero { get; set; }
//        public string Piso { get; set; }
//        public string Dpto { get; set; }
//        public string Telefono { get; set; }
//        public string Email { get; set; }
//    }

//    // Solo para devolver datos laborales 
//    public class EmpleadoLaboralDTO
//    {
//        public int Id { get; set; }
//        public string Apellido { get; set; }
//        public string Nombre { get; set; }
//        public string Area { get; set; }
//        public string Cargo { get; set; }
//        public string EstadoEmpleado { get; set; }
//    }

//    // Para recibir datos del Frontend (Insertar o Modificar)
//    public class EmpleadoRequestDTO
//    {
//        public int Id { get; set; }
//        public string Apellido { get; set; }
//        public string Nombre { get; set; }
//        public string Cuil { get; set; }
//        public string Telefono { get; set; }
//        public string Email { get; set; }
//        public DateTime Fecha_Ingreso { get; set; }
//        public int Id_Cargo { get; set; }
//        public int Id_Area { get; set; }
//        public int Id_Barrio { get; set; }
//        public int Id_Estado_Empleado { get; set; }
//        public string Calle { get; set; }
//        public string Numero { get; set; }
//        public string Piso { get; set; }
//        public string Dpto { get; set; }
//    }
//}