# Directrices de Desarrollo - SITMAS

Este archivo contiene las directrices obligatorias para cualquier asistente de IA que trabaje en este proyecto.

## 1. Regla de Aprobación Obligatoria
* El asistente **NO** debe modificar ningún script o archivo de forma directa en el disco sin antes haber mostrado la propuesta de cambios exacta en el chat y contar con la aprobación explícita y total del usuario.
* Si el usuario no aprueba el cambio automático, el usuario realizará las modificaciones de forma manual copiando el código sugerido.

## 2. Límite del Espacio de Trabajo
* El espacio de trabajo del asistente se limita **únicamente** a la carpeta `Web Application` (HTML, CSS, JS, Assets).
* No se debe acceder ni modificar la carpeta de la API (`WebApi`) ni la Base de Datos, excepto en casos extremos y solo si el usuario lo permite explícitamente.

## 3. Integridad de Estructura HTML
* Toda interfaz debe conservar la estructura HTML original de cada archivo, incluyendo botones, clases CSS y estructuras de tablas existentes.
* Los cambios deben ser aditivos o correctivos, nunca destructivos sobre el markup ya implementado.

## 4. Interoperabilidad y Compatibilidad HTTP
* Se ha superado el bloqueo de verbos HTTP (`PUT`/`DELETE`) en IIS mediante la adaptación de llamadas AJAX (`POST` con enmascaramiento) y la configuración del `web.config` (remoción de WebDAV).
* Todo nuevo desarrollo debe seguir esta convención: usar **POST** para operaciones de guardado, modificación y borrado, manteniendo compatibilidad con la configuración actual del servidor.
* **Verbos HTTP:** Antes de implementar cualquier función AJAX, es obligatorio revisar los atributos del controlador C# (`[HttpPost]`, `[HttpPut]`, `[HttpDelete]`). Si un controlador tiene un verbo específico (como `[HttpPut]`), el JS debe utilizar `type: "PUT"` estrictamente para evitar errores `405`.

## 5. Patrón de Integración para Nuevos Módulos ABM
Para cada nuevo módulo ABM, se debe seguir este patrón establecido:
1. **Input Oculto:** `txtId[Modulo]` en el formulario para controlar el estado de edición.
2. **Botón Editar:** El `onclick` del botón en la tabla inyecta el `ID` y los datos en el formulario y despliega el acordeón (`.collapse('show')`).
3. **Guardar:** La función detecta si `txtId` tiene valor para disparar la URL de modificación o creación.
4. **Regla de Formateo de Datos:** Para campos con formato especial (ej. Patentes con espacios), el front-end debe enviar el valor tal cual se visualiza en el `input` (evitando `.replace`    innecesarios en la preparación del objeto `data`). Si el backend elimina los espacios, la verificación debe realizarse en el modelo o controlador C# correspondiente, ya que el front-end debe garantizar la integridad del formato enviado.

## 6. Cierre de Sesión y Registro Histórico
* Al finalizar o dar por terminada una sesión de trabajo, el asistente debe generar un resumen estructurado con todos los cambios realizados, decisiones técnicas tomadas y cualquier corrección o preferencia que el usuario haya indicado.
* Este resumen se registrará en el archivo `history-ai.md` para que el contexto y las lecciones aprendidas se transfieran correctamente a futuras conversaciones.
