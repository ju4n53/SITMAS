/* =========================
   BASE DE DATOS
   ========================= */

IF DB_ID('Gestion_SITMAS') IS NULL
CREATE DATABASE Gestion_SITMAS;
GO

USE Gestion_SITMAS;
GO


/* =========================
   TABLAS MAESTRAS
   ========================= */

CREATE TABLE Area(
    Id INT IDENTITY PRIMARY KEY,
    Nombre VARCHAR(100)
);

CREATE TABLE Cargo(
    Id INT IDENTITY PRIMARY KEY,
    Nombre VARCHAR(100)
);

CREATE TABLE Estado_Empleado(
    Id INT IDENTITY PRIMARY KEY,
    Nombre VARCHAR(50)
);

CREATE TABLE Estado_Usuario(
    Id INT IDENTITY PRIMARY KEY,
    Nombre VARCHAR(50)
);

CREATE TABLE Rol(
    Id INT IDENTITY PRIMARY KEY,
    Nombre VARCHAR(50)
);

CREATE TABLE Permiso(
    Id INT IDENTITY PRIMARY KEY,
    Nombre VARCHAR(100)
);

CREATE TABLE Rol_Permiso(
    Id_Rol INT,
    Id_Permiso INT,
    PRIMARY KEY(Id_Rol, Id_Permiso),
    FOREIGN KEY (Id_Rol) REFERENCES Rol(Id),
    FOREIGN KEY (Id_Permiso) REFERENCES Permiso(Id)
);


/* =========================
   UBICACIÓN
   ========================= */

CREATE TABLE Localidad(
    Id INT IDENTITY PRIMARY KEY,
    Nombre VARCHAR(100)
);

CREATE TABLE Barrio(
    Id INT IDENTITY PRIMARY KEY,
    Nombre VARCHAR(100),
    Id_Localidad INT,
    FOREIGN KEY (Id_Localidad) REFERENCES Localidad(Id)
);


/* =========================
   EMPLEADO
   ========================= */

CREATE TABLE Empleado(
    Id INT IDENTITY PRIMARY KEY,
    Apellido VARCHAR(100),
    Nombre VARCHAR(100),
    Cuil VARCHAR(20) UNIQUE,
    Telefono VARCHAR(20),
    Email VARCHAR(100),
    Fecha_Ingreso DATE,
    Id_Cargo INT,
    Id_Area INT,
    Id_Barrio INT,
    Id_Estado_Empleado INT,
    FOREIGN KEY (Id_Cargo) REFERENCES Cargo(Id),
    FOREIGN KEY (Id_Area) REFERENCES Area(Id),
    FOREIGN KEY (Id_Barrio) REFERENCES Barrio(Id),
    FOREIGN KEY (Id_Estado_Empleado) REFERENCES Estado_Empleado(Id)
);


/* =========================
   USUARIOS
   ========================= */

CREATE TABLE Usuario(
    Id INT IDENTITY PRIMARY KEY,
    Nombre_Usuario VARCHAR(100) UNIQUE,
    Password VARCHAR(100),
    Id_Empleado INT UNIQUE,
    Id_Estado_Usuario INT,
    FOREIGN KEY (Id_Empleado) REFERENCES Empleado(Id),
    FOREIGN KEY (Id_Estado_Usuario) REFERENCES Estado_Usuario(Id)
);

CREATE TABLE Usuario_Rol(
    Id_Usuario INT,
    Id_Rol INT,
    PRIMARY KEY(Id_Usuario, Id_Rol),
    FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id),
    FOREIGN KEY (Id_Rol) REFERENCES Rol(Id)
);


/* =========================
   LOGÍSTICA
   ========================= */

CREATE TABLE Marca(
    Id INT IDENTITY PRIMARY KEY,
    Nombre VARCHAR(100)
);

CREATE TABLE Modelo(
    Id INT IDENTITY PRIMARY KEY,
    Nombre VARCHAR(100),
    Id_Marca INT,
    FOREIGN KEY (Id_Marca) REFERENCES Marca(Id)
);

CREATE TABLE Tipo_Vehiculo(
    Id INT IDENTITY PRIMARY KEY,
    Nombre VARCHAR(100)
);

CREATE TABLE Vehiculo(
    Id INT IDENTITY PRIMARY KEY,
    Patente VARCHAR(20),
    Id_Modelo INT,
    Id_Tipo INT,
    FOREIGN KEY (Id_Modelo) REFERENCES Modelo(Id),
    FOREIGN KEY (Id_Tipo) REFERENCES Tipo_Vehiculo(Id)
);

CREATE TABLE Estado_Hoja_Ruta(
    Id INT IDENTITY PRIMARY KEY,
    Nombre VARCHAR(50)
);

CREATE TABLE Hoja_Ruta(
    Id INT IDENTITY PRIMARY KEY,
    Fecha DATE,
    Id_Vehiculo INT,
    Id_Chofer INT,
    Id_Estado INT,
    FOREIGN KEY (Id_Vehiculo) REFERENCES Vehiculo(Id),
    FOREIGN KEY (Id_Chofer) REFERENCES Empleado(Id),
    FOREIGN KEY (Id_Estado) REFERENCES Estado_Hoja_Ruta(Id)
);


/* =========================
   STORED PROCEDURES
   ========================= */

GO

-- LISTAR EMPLEADOS
CREATE OR ALTER PROCEDURE sp_ListarEmpleados
AS
BEGIN
    SELECT * FROM Empleado;
END
GO

-- INSERTAR EMPLEADO
CREATE OR ALTER PROCEDURE sp_InsertarEmpleado
    @Apellido VARCHAR(100),
    @Nombre VARCHAR(100),
    @Cuil VARCHAR(20),
    @Telefono VARCHAR(20),
    @Email VARCHAR(100),
    @Fecha_Ingreso DATE,
    @Id_Cargo INT,
    @Id_Area INT,
    @Id_Barrio INT,
    @Id_Estado INT
AS
BEGIN
    INSERT INTO Empleado
    VALUES (@Apellido,@Nombre,@Cuil,@Telefono,@Email,
            @Fecha_Ingreso,@Id_Cargo,@Id_Area,@Id_Barrio,@Id_Estado);
END
GO

-- ACTUALIZAR EMPLEADO
CREATE OR ALTER PROCEDURE sp_ActualizarEmpleado
    @Id INT,
    @Telefono VARCHAR(20)
AS
BEGIN
    UPDATE Empleado
    SET Telefono = @Telefono
    WHERE Id = @Id;
END
GO

-- ELIMINAR EMPLEADO (RESPETA RN22)
CREATE OR ALTER PROCEDURE sp_EliminarEmpleado
    @Id INT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM Usuario WHERE Id_Empleado = @Id)
    BEGIN
        PRINT 'No se puede eliminar, tiene usuario asociado';
        RETURN;
    END

    DELETE FROM Empleado WHERE Id = @Id;
END
GO

-- USUARIOS
CREATE OR ALTER PROCEDURE sp_CrearUsuario
    @User VARCHAR(100),
    @Pass VARCHAR(100),
    @IdEmpleado INT,
    @Estado INT
AS
BEGIN
    INSERT INTO Usuario VALUES (@User,@Pass,@IdEmpleado,@Estado);
END
GO

-- ASIGNAR ROL
CREATE OR ALTER PROCEDURE sp_AsignarRol
    @IdUsuario INT,
    @IdRol INT
AS
BEGIN
    INSERT INTO Usuario_Rol VALUES (@IdUsuario,@IdRol);
END
GO

-- LOGIN (RN19)
CREATE OR ALTER PROCEDURE sp_Login
    @User VARCHAR(100),
    @Pass VARCHAR(100)
AS
BEGIN
    SELECT U.*
    FROM Usuario U
    WHERE Nombre_Usuario = @User
    AND Password = @Pass
    AND Id_Estado_Usuario = 1
    AND EXISTS (
        SELECT 1 FROM Usuario_Rol UR WHERE UR.Id_Usuario = U.Id
    );
END
GO