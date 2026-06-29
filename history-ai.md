# Historial de Cambios y Correcciones - SITMAS

Este archivo registra de forma resumida el estado del proyecto, las decisiones técnicas tomadas y el historial de correcciones realizadas en cada sesión de trabajo con el asistente de IA.

---

## Estado Inicial del Proyecto (26 de Mayo, 2026)

### 1. Contexto General
* **Nombre del Proyecto:** SITMAS (Sistema de Ingreso y Trazabilidad de Materiales, Áreas y Servicios).
* **Organización:** Escuela Municipal de Economía Circular (EMEC) / Ente Municipal BioCórdoba (Córdoba Capital).
* **Módulos Principales:**
  * **Personal:** ABM de Empleados, Usuarios, Roles y Permisos.
  * **Logística:** Gestión de Vehículos y Hojas de Ruta (HDR).
  * **Trazabilidad:** Ingreso de Materiales, Orígenes (Empresas) y Clasificación.
  * **Configuración:** Tablas generales (Barrios, Áreas) y Accesos.

### 2. Stack Tecnológico
* **Frontend:** HTML5, CSS (Bootstrap 5.3.3 + `newstyles.css`), JavaScript nativo y jQuery.
* **Backend:** ASP.NET Web API 2 (C# bajo .NET Framework 4.8).
* **Base de Datos:** SQL Server local (`DESKTOP-1KQOVUE\SQLEXPRESS`), base de datos `Gestion_SITMAS`, consumo mediante Procedimientos Almacenados con ADO.NET (`System.Data.SqlClient`).
* **Conexión local API-Front:** El frontend consume la API en `https://localhost:44325/api/`.

### 3. Herramientas de Desarrollo y Entorno de Trabajo
* **Ejecución del Backend (API):** Visual Studio 2019 (usado para iniciar y levantar la API C#).
* **Desarrollo del Frontend (Scripts/Vistas):** Visual Studio Code (arrastrando únicamente la carpeta `Web Application` al editor).
* **Gestión de la Base de Datos:** SQL Server Management Studio (SSMS).
* **Navegador de Pruebas:** Opera GX (usado como navegador predeterminado para abrir y probar los archivos `.html`).

---

## Registro Histórico de Sesiones y Ajustes

### Sesión 0 — Trabajo Previo (Pre-Antigravity)
> Resumen del trabajo realizado en sesiones anteriores con otro asistente de IA, documentado en el `.md` original del proyecto.

* **Acciones Realizadas:**

#### ABM de Roles y Permisos (`config_acceso.html`)
  * Se implementó el ABM completo de **Roles** mediante `roles_logica.js`.
  * Se implementó el ABM completo de **Permisos** mediante `permisos_logica.js`.
  * **Configuración `web.config`:** Se eliminó `WebDAVModule` y `WebDAV` en `<system.webServer>` para permitir el flujo de métodos HTTP (`PUT`/`DELETE` → adaptados a `POST`).
  * **`PermisosController.cs`:** Se utilizan los métodos `ListarTodo` (GET), `Insertar` (POST), `Modificar` (POST) y `Borrar` (POST).
  * **JavaScript (Ajax):** Todas las operaciones se realizan mediante `$.ajax` con `contentType: "application/json"`.

#### ABM de Origen (`traz_origen_logica.js`)
  * **Nivel Base de Datos (SQL Server):**
    * Se implementaron **aliases** en el procedimiento almacenado `sp_ListarOrigen` (ej. `Calle AS CalleEI`) para que los nombres de columnas coincidan con las propiedades del modelo C#, eliminando valores `null`.
  * **Nivel API (Backend - C#):**
    * Se habilitó **CORS** instalando `Microsoft.AspNet.WebApi.Cors` y configurando `WebApiConfig.cs`.
    * Se agregaron atributos `[Route]` sobre los métodos `Modificar` y `Borrar` para evitar errores `404 Not Found`.
    * Se aseguró que los métodos recibieran los parámetros `id` correctamente.
  * **Nivel Frontend (JavaScript):**
    * Se sincronizaron los nombres de propiedades del JSON con el modelo `EmpresaOrigen`.
    * Se estandarizaron las peticiones AJAX usando `POST` con parámetros de consulta (`?id=`).
    * Se corrigió la construcción dinámica de URLs para evitar rutas inválidas.

---

### Sesión 1 (26 de Mayo, 2026)
* **Acciones Realizadas:**
  * Se analizó la estructura general del proyecto.
  * Se definieron e implementaron las directrices de trabajo del asistente de IA.
  * Se configuró el archivo `.gitignore` para ignorar los archivos locales del asistente (`instructions-ai.md` y `history-ai.md`), manteniéndolos estrictamente locales en la PC del usuario para evitar que se suban a GitHub.
  * Se crearon los archivos `instructions-ai.md` (directrices de aprobación y límites) y `history-ai.md` (este log histórico).
  * Se cambio de rama a modulo-entregable-etapa1

---
### Sesión 2 (26 de Junio, 2026)
* **Acciones Realizadas:**
  * **Módulo Logística (Hoja de Ruta):**
    * Se estabilizaron los ABMs de "Estado Hoja de Ruta" y "Hoja de Ruta".
    * Corrección de errores `405 Method Not Allowed`: Se adaptaron las llamadas AJAX para coincidir estrictamente con los verbos esperados por los controladores (`PUT` para `Modificar` en `EST_HDRController` y `POST` para `HojaRutaController`).
    * Implementación de la función `EliminarEstadoHdr` utilizando el verbo `DELETE` para alinearse con el atributo `[HttpDelete]` del backend.
  * **Módulo Vehículos:**
    * Ajuste en la persistencia del formato de patente (`AA 123 BB`): Se garantizó que el front-end capture y envíe el valor del `input` incluyendo los espacios, asegurando que no se eliminen antes del envío en el `data` del AJAX.
  * **Estandarización:** Se aplicó `event.preventDefault()` en todos los formularios para prevenir recargas accidentales y asegurar el flujo de control hacia JavaScript.
  * **Pendiente:** El ABM de "Detalle Hoja de Ruta" requiere la creación o identificación de un controlador específico (`DetalleHojaRutaController`) en el backend, ya que los controladores actuales no cubren la lógica de orígenes y observaciones.

  ---
### Sesión 3 (28 de junio, 2026)
* **Acciones Realizadas:**
  **Módulo Configuracion:** 
  * se completo los abm faltantes en "general" y "accsesos"

## Pendientes Conocidos
- Continuar con la creación de la lógica para los ABM faltantes.
- Mantener la coherencia con los modelos C# existentes.
- Implementar el ABM de "Detalle Hoja de Ruta". Se requiere confirmar junto con el equipo si el compañero realizo la creacion del controlador  DetalleHojaRutaController en el backend para gestionar las relaciones de origen y observaciones, ya que los controladores actuales no cubren esta funcionalidad.
- verificar la correcta modificacion al utilizar el boton editar en el abm de "USUARIO-ROL" ya que en la sesion 3 al editar otorgaba el rol nuevo mas no eliminaba el anterior.