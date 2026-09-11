# Familias y endpoints actuales por Historia de Usuario — Sprint 1

- **Versión:** 1.0
- **Fecha:** 3 de septiembre de 2026
- **Estado:** inventario validado contra el backlog; propuesta contractual pendiente de aprobación humana y OpenAPI
- **Alcance:** Historias de Usuario marcadas como Sprint 1 en [`30082026_01_Backlog.xlsx`](../../../30082026_01_Backlog.xlsx)
- **Fuente de lenguaje:** `03092026_v3_glosario.md`
- **Responsables de validación:** Product Owner, arquitectura, Backend, Frontend, Tester y responsables de cada microservicio

## 1. Objetivo

Identificar las familias HTTP presentes en el backlog, asignar cada operación al microservicio propietario y registrar, HU por HU, qué endpoint o integración se espera durante Sprint 1.

Este documento no es todavía un contrato OpenAPI. Conserva literalmente las rutas encontradas en el backlog, elimina únicamente los puntos finales usados como puntuación al citarlas y separa:

- **Endpoint CAMEIA:** operación HTTP que debe exponer un componente del sistema;
- **SDK externo:** operación ejecutada contra Firebase u otro proveedor;
- **Operación interna:** comportamiento sin endpoint público definido;
- **Spike:** investigación que produce evidencia, no una API funcional.

No se incluyen HU de otros sprints aunque una HU de Sprint 1 las declare como dependencia.

## 2. Familias actuales encontradas

| Familia actual             | Propietario esperado                                | Uso en Sprint 1                                                                             | Estado                                                                                      |
| -------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `/api/v1/users`            | Microservicio de Cuentas                            | Sincronizar la Cuenta después del registro Firebase.                                        | Presente en `HU-1.1`; nombre pendiente de conciliar con el agregado **Cuenta**.             |
| `/api/v1/auth`             | API Gateway / Firebase / Cuentas, según operación   | En Sprint 1 no aparece un endpoint propio; el login usa Firebase SDK.                       | Familia mencionada en otras HU, pero sin operación Sprint 1.                                |
| `/api/v1/profiles`         | Microservicio de Perfil Profesional                 | Crear y editar Perfil Profesional, secciones, roles y consultas para configurar entrevista. | Familia principal de `HU-2.*` y soporte de `HU-4.2`.                                        |
| `/api/v1/roles`            | Microservicio de Perfil Profesional                 | Buscar sugerencias de Rol Objetivo.                                                         | Aparece en `HU-4.2`; su ubicación fuera de `/profiles` requiere decisión.                   |
| `/api/v1/interviews`       | Microservicio de Entrevistas                        | Consultar catálogos, inicializar sesiones y procesar turnos.                                | Presente en `HU-4.3`, `HU-4.4` y `HU-5.2`; mezcla `session` singular con recursos plurales. |
| `/api/v1/voice-service`    | Servicio de Voz                                     | Sin endpoints asignados a HU de Sprint 1.                                                   | Aparece desde Sprint 2; no implementar como alcance funcional de Sprint 1.                  |
| `/api/v1/audit`            | Microservicio de Auditoría                          | Sin endpoints asignados a HU de Sprint 1.                                                   | Aparece desde Sprint 2/3; no implementar como alcance funcional de Sprint 1.                |
| `/api/v1/progress-service` | Sin componente o repositorio independiente aprobado | Sin endpoints de Sprint 1.                                                                  | Nombre inconsistente con el dominio: Progreso pertenece actualmente a Entrevistas.          |

El API Gateway es el punto de entrada público y enruta estas familias. No debe duplicar las reglas del contexto propietario.

## 3. Microservicio de Cuentas

### Familia actual: `/api/v1/users`

| HU       | Funcionalidad                            | Endpoint o integración actual                                                     | Entrada esperada según backlog                                                                                                | Resultado esperado                                                                                          | Estado contractual                                                                                                                  |
| -------- | ---------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `HU-1.1` | Registro de Nuevo Usuario                | Firebase SDK `createUserWithEmailAndPassword`; después `POST /api/v1/users`.      | Firebase recibe correo/contraseña. CAMEIA recibe ID Token y datos personales permitidos; la contraseña no llega a PostgreSQL. | Cuenta local sincronizada y Plan Gratis asignado.                                                           | **Parcial:** faltan esquema, códigos HTTP, idempotencia y comportamiento cuando Firebase existe pero la sincronización local falla. |
| `HU-1.3` | Inicio de Sesión con Correo y Contraseña | Firebase SDK `signInWithEmailAndPassword`. No se define endpoint CAMEIA de login. | Credenciales enviadas exclusivamente a Firebase.                                                                              | ID Token que el backend verifica en solicitudes protegidas; posterior consulta de Cuenta por `firebaseUid`. | **Parcial:** falta definir cómo Cliente Web obtiene la Cuenta y derechos después del login.                                         |

### Reglas confirmadas para Cuentas

- CAMEIA no almacena ni recibe contraseñas para persistencia.
- La identidad autenticable pertenece a Firebase; la Cuenta local pertenece a Cuentas.
- Una cuenta nueva recibe Plan Gratis.
- El backend debe derivar la identidad del ID Token y no aceptar un `userId` arbitrario del cliente.

## 4. Microservicio de Perfil Profesional

### Familia principal: `/api/v1/profiles`

| HU        | Funcionalidad                             | Endpoint actual                                                                                                    | Entrada esperada                                                                                  | Resultado esperado                                                                              | Estado contractual                                                                                             |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `HU-2.2`  | Selección del Método de Configuración     | `POST /api/v1/profiles`                                                                                            | Método `MANUAL` o `AI_SUGGESTED`; `nombre_perfil` aparece pendiente de definir como dato inicial. | Perfil Profesional creado en `IN_PROGRESS` si el entitlement permite otro perfil.               | **Parcial:** falta cerrar obligatoriedad de `nombre_perfil` y respuesta de límite excedido.                    |
| `HU-2.3`  | Información General y Resumen Profesional | `PATCH /api/v1/profiles/{profile_id}`                                                                              | Campos editables de información general y resumen; procedencia aplicable.                         | Perfil actualizado, ownership validado y procedencia cambiada a `AI_EDITED` cuando corresponda. | **Parcial:** falta whitelist exacta, control de versión y esquema de respuesta.                                |
| `HU-2.4`  | Experiencia Laboral y Educación           | `PATCH /api/v1/profiles/{profile_id}/experience`; `PATCH /api/v1/profiles/{profile_id}/education`                  | Colecciones o elementos de experiencia/educación con fechas y procedencia.                        | Datos guardados respetando estados y fechas.                                                    | **Inconsistente:** no se define si `PATCH` reemplaza una colección, actualiza un elemento o realiza upsert.    |
| `HU-2.5`  | Habilidades, Expectativas y Finalización  | `PATCH /api/v1/profiles/{profile_id}/skills`; `POST /api/v1/profiles/{profile_id}/finalize`                        | Habilidades y comando de finalización.                                                            | Habilidades guardadas y perfil llevado a `IN_REVIEW` o `COMPLETED` cuando cumple mínimos.       | **Incompleto:** no existe endpoint para expectativas y la transición final no está cerrada.                    |
| `HU-2.11` | Gestión de Roles Objetivo                 | `GET`, `POST /api/v1/profiles/{profile_id}/roles`; `PATCH`, `DELETE /api/v1/profiles/{profile_id}/roles/{role_id}` | Rol profesional, prioridad y procedencia según operación.                                         | Entre 1 y 5 roles sin duplicados; no se elimina el último.                                      | **Parcial:** falta decidir si el recurso se llama `roles` o `target-roles` y definir reordenamiento/prioridad. |

### Lecturas de Perfil utilizadas por Entrevistas

| HU consumidora | Endpoint actual                           | Propósito                                                        | Estado contractual                                                                             |
| -------------- | ----------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `HU-4.2`       | `GET /api/v1/profiles?status=COMPLETED`   | Listar perfiles completos pertenecientes al usuario autenticado. | **Casi definido:** falta paginación y confirmar si la respuesta incluye el snapshot necesario. |
| `HU-4.2`       | `GET /api/v1/roles/suggestions?q={texto}` | Autocompletar Rol Objetivo y permitir texto libre.               | **Parcial:** falta límite, normalización, respuesta vacía y ownership del catálogo.            |

## 5. Microservicio de Entrevistas

### Familias actuales: `/api/v1/interviews/config` y `/api/v1/interviews/session`

| HU       | Funcionalidad                             | Endpoint actual                                                                           | Entrada esperada                                                                                                 | Resultado esperado                                                                                           | Estado contractual                                                                                                                |
| -------- | ----------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `HU-4.1` | Spike de personalización conversacional   | `N/A`                                                                                     | Pruebas internas sobre tono, personalidad, prompt y proveedor.                                                   | Catálogo cerrado, plantilla de prompt, latencia medida y plan alternativo.                                   | **Spike:** no crear controlador. Bloquea HU-4.3/HU-4.4.                                                                           |
| `HU-4.2` | Configurar Contexto Profesional           | No persiste en Entrevistas; consume las dos lecturas de Perfil indicadas en la sección 4. | Perfil Profesional, Oferta Laboral opcional y Rol Objetivo capturados en Cliente Web.                            | Datos preparados para `HU-4.4`.                                                                              | **Definido como composición de UI:** no necesita endpoint de escritura propio.                                                    |
| `HU-4.3` | Configurar personalización                | `GET /api/v1/interviews/config/catalog`                                                   | Solicitud autenticada sin cuerpo.                                                                                | Catálogos de tono y personalidad; también debe aclararse si incluye modalidad, forma de respuesta e idiomas. | **Parcial:** contenido exacto depende de HU-4.1.                                                                                  |
| `HU-4.4` | Inicializar Sesión                        | `POST /api/v1/interviews/session/init`                                                    | Referencia/snapshot de perfil, modalidad, tono, personalidad, forma de respuesta, idioma, rol y oferta opcional. | Sesión creada en `CONFIGURADA`.                                                                              | **Parcial:** falta esquema; `session/init` mezcla recurso singular y verbo.                                                       |
| `HU-4.5` | Planificar preguntas y pasar a `EN_CURSO` | Operación interna disparada después de HU-4.4.                                            | Sesión `CONFIGURADA`, perfil completo, derechos vigentes y cuota permitida.                                      | Entre 4 y 6 preguntas, ejecución IA registrada y sesión en `EN_CURSO`; ante fallo queda `CONFIGURADA`.       | **Incompleto:** no se define si HU-4.4 responde después de planificar, usa procesamiento asíncrono o expone comando de reintento. |
| `HU-5.1` | Spike de Contexto Conversacional          | `N/A`                                                                                     | Pruebas de prompt, presupuesto, resumen, latencia y SLA.                                                         | Estrategia y evidencia que habilitan HU-4.5/HU-5.2.                                                          | **Spike:** no crear controlador.                                                                                                  |
| `HU-5.2` | Enviar respuesta y avanzar turno          | `POST /api/v1/interviews/session/{session_id}/turn`                                       | Respuesta textual o transcripción, con sesión activa derivada del path y usuario autenticado.                    | Intento definitivo, feedback persistido y siguiente pregunta; feedback visible solo en Entreno.              | **Parcial:** falta esquema, concurrencia, idempotencia, respuesta de procesamiento y normalización plural.                        |

### Reglas confirmadas para Entrevistas

- La configuración se persiste al inicializar la sesión, no durante los pasos anteriores del wizard.
- Oferta Laboral es texto opcional de máximo 3000 caracteres.
- Modalidad, tono, personalidad, forma de respuesta, idioma y Rol Objetivo son obligatorios.
- `ENTRENO` muestra feedback inmediato; `SIMULACION` lo conserva sin exponerlo hasta finalizar.
- Una sesión no inicia con cuota `BLOQUEADO`.
- Los Spikes `HU-4.1` y `HU-5.1` producen decisiones y evidencia, no endpoints.

## 6. Servicio de Voz

No tiene una HU funcional propia asignada a Sprint 1.

| Relación con Sprint 1                                  | Tratamiento                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `HU-4.3` permite seleccionar `AUDIO`.                  | Solo configura la preferencia; la captura y transcripción pertenecen a `HU-5.8`, Sprint 2.       |
| `HU-5.2` admite origen `TEXTO` o `AUDIO` en el modelo. | Sprint 1 puede definir el puerto/interfaz, pero no declarar operativo el procesamiento de audio. |

No implementar todavía las familias `/api/v1/voice-service/...` de HU-6.* como alcance funcional de Sprint 1.

## 7. Microservicio de Auditoría

No tiene HU asignada a Sprint 1. Sus historias `HU-9.1` a `HU-9.3` pertenecen a Sprint 2 y Sprint 3.

Durante Sprint 1 otros contextos pueden definir un puerto o evento futuro de consumo, pero no deben asumir implementados:

- `POST /api/v1/audit/usage/consume`;
- `GET /api/v1/audit/usage/{userId}`;
- el multiplicador Premium;
- el bloqueo operativo completo por cuota.

## 8. API Gateway y Cliente Web

### API Gateway

- expone o enruta las familias públicas;
- valida el ID Token de Firebase;
- propaga únicamente la identidad y claims necesarios;
- no modifica agregados ni replica reglas de Cuentas, Perfil o Entrevistas;
- requiere una matriz ruta → servicio antes de implementar el enrutamiento definitivo.

### Cliente Web

- utiliza Firebase SDK para registro e inicio de sesión;
- consume las familias HTTP mediante el API Gateway;
- conserva temporalmente los pasos del wizard de HU-4.2/HU-4.3 hasta enviar HU-4.4;
- no decide ownership, entitlement, cuota o transiciones de estado;
- necesita prototipos `PRT-*` y esquemas de respuesta para implementar integración real.

## 9. Resumen de cobertura de Sprint 1

| Microservicio/componente | HU de Sprint 1                                                        | Endpoints CAMEIA actuales | Sin endpoint por diseño                                |
| ------------------------ | --------------------------------------------------------------------- | ------------------------: | ------------------------------------------------------ |
| Cuentas                  | `HU-1.1`, `HU-1.3`                                                    |                         1 | Login mediante Firebase SDK.                           |
| Perfil Profesional       | `HU-2.2`, `HU-2.3`, `HU-2.4`, `HU-2.5`, `HU-2.11`; soporte a `HU-4.2` |       12 operaciones HTTP | —                                                      |
| Entrevistas              | `HU-4.1` a `HU-4.5`, `HU-5.1`, `HU-5.2`                               |                         3 | Dos Spikes, composición HU-4.2 y planificación HU-4.5. |
| Voz                      | Sin HU funcional propia                                               |                         0 | Procesamiento de audio aplazado a Sprint 2.            |
| Auditoría                | Sin HU                                                                |                         0 | Historias desde Sprint 2.                              |
| API Gateway              | Transversal                                                           |                 0 propias | Enrutamiento y autenticación.                          |
| Cliente Web              | Interfaz de las HU anteriores                                         |               0 expuestos | Consume SDK y API.                                     |

Conteo del backlog: **14 elementos de Sprint 1** revisados; incluye 12 HU funcionales —dos sin escritura pública propia (`HU-4.2` y `HU-4.5`)— y 2 Spikes.

## 10. Inconsistencias y decisiones requeridas

| ID           | Inconsistencia                                                                                            | Impacto                                                                                        | Decisión requerida                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `API-TBD-01` | El lenguaje DDD utiliza **Cuenta**, pero el endpoint usa `/users`.                                        | Nombres diferentes entre dominio, base y API.                                                  | Mantener `/users` como lenguaje externo o adoptar `/accounts`.                       |
| `API-TBD-02` | Entrevistas usa `/session` y `/turn` en singular.                                                         | Dificulta consistencia REST y evolución de subrecursos.                                        | Aprobar rutas plurales o justificar comandos singulares.                             |
| `API-TBD-03` | Parámetros mezclan `{profile_id}`, `{session_id}`, `{sessionId}` y `{userId}`.                            | Contratos y clientes generados inconsistentes.                                                 | Adoptar una convención única para OpenAPI.                                           |
| `API-TBD-04` | Varias rutas del Excel terminan en `.` por puntuación.                                                    | Riesgo de copiar rutas inválidas al código.                                                    | Confirmar que el punto no forma parte del endpoint.                                  |
| `API-TBD-05` | `HU-2.5` menciona expectativas, pero solo define `/skills` y `/finalize`.                                 | Parte de la HU no tiene contrato de persistencia.                                              | Definir dónde se guardan y cómo se actualizan las expectativas.                      |
| `API-TBD-06` | Los `PATCH` de experiencia, educación y habilidades no indican semántica de colección/elemento.           | Riesgo de sobrescritura o duplicados.                                                          | Definir CRUD, upsert, reemplazo y claves de cada elemento.                           |
| `API-TBD-07` | `roles` puede significar catálogo profesional, Rol Objetivo o rol de autorización.                        | Ambigüedad semántica.                                                                          | Usar nombres explícitos como `professional-roles` y `target-roles`.                  |
| `API-TBD-08` | `HU-4.4` crea sesión y `HU-4.5` planifica internamente, sin modelo síncrono/asíncrono definido.           | Timeout, reintentos y estado de UI indeterminados.                                             | Definir respuesta de inicialización, polling/evento y comando de reintento.          |
| `API-TBD-09` | Backlog usa `COMPLETE`; glosario, anexo y DDL usan `COMPLETED`.                                           | Validación de estado incompatible.                                                             | Adoptar un único código; la evidencia actual favorece `COMPLETED`.                   |
| `API-TBD-10` | `HU-4.3/HU-4.4` describen columna `idioma`, mientras `DDL-ENT` usa `idioma_id`.                           | Request, persistencia y mapeo no coinciden.                                                    | Definir si la API recibe BCP-47 y la aplicación resuelve `idioma_id`.                |
| `API-TBD-11` | Backlog menciona `feedback_turno`; `DDL-ENT` crea `feedback_respuesta`.                                   | Nombres distintos para el mismo concepto o entidades diferentes.                               | Alinear lenguaje, clase, tabla y payload.                                            |
| `API-TBD-12` | `HU-4.5` indica 4–6 preguntas; la Entrega 1/anexo histórico indica exactamente 6.                         | Pruebas e invariantes contradictorias.                                                         | Resolver junto con `GLO-TBD-01`.                                                     |
| `API-TBD-13` | `HU-5.2` depende de `HU-5.6`, asignada a Sprint 2.                                                        | Sprint 1 depende de manejo de fallos no planificado en el mismo sprint.                        | Incorporar manejo mínimo al alcance o retirar la dependencia bloqueante.             |
| `API-TBD-14` | No existen esquemas de request, response ni error común.                                                  | Backend, Gateway y Web no pueden integrarse de manera independiente.                           | Crear OpenAPI y formato de errores antes de integración.                             |
| `API-TBD-15` | No se diferencia formalmente API pública del Gateway y endpoints internos entre servicios.                | Riesgo de exposición y acoplamiento.                                                           | Clasificar cada ruta como pública, interna o llamada a proveedor.                    |
| `API-TBD-16` | Las HU llaman “DDL v3” a archivos cuya entrega formal disponible está identificada como versión 1.0.      | Trazabilidad de modelo incierta.                                                               | Identificar el DDL exacto usado por el backlog o corregir la referencia.             |
| `API-TBD-17` | `HU-1.3` describe una consulta a tabla `Usuario`, pero el DDL entregado define la tabla `cuenta`.         | Repositorio, consulta y vocabulario de Cuentas pueden implementarse con nombres incompatibles. | Sustituir `Usuario` por `cuenta` o identificar una versión posterior del modelo.     |
| `API-TBD-18` | `HU-2.5` indica redirigir a `HU-2.7` cuando faltan roles, aunque roles se gestionan en `HU-2.10/HU-2.11`. | Dependencia funcional y navegación equivocadas.                                                | Corregir la referencia y definir el flujo hacia creación/sugerencia de Rol Objetivo. |

## 11. Decisiones mínimas antes de generar OpenAPI

1. Aprobar nombres de familias y recursos.
2. Aprobar convención de parámetros de ruta.
3. Definir autenticación y claims requeridos por operación.
4. Definir request, response, errores y códigos HTTP.
5. Definir control de concurrencia e idempotencia.
6. Resolver `COMPLETE`/`COMPLETED`, `idioma`/`idioma_id` y `feedback_turno`/`feedback_respuesta`.
7. Definir semántica de colecciones de Perfil Profesional.
8. Definir inicialización y planificación síncrona o asíncrona.
9. Clasificar endpoints públicos e internos.
10. Corregir referencias cruzadas de HU y nombres físicos del modelo.
11. Registrar la aprobación y generar un OpenAPI versionado por servicio.

## 12. Criterio de terminado

- [x] Las HU asignadas a Sprint 1 fueron identificadas desde el backlog.
- [x] Los endpoints actuales fueron separados por microservicio.
- [x] SDK externos, Spikes y operaciones internas fueron diferenciados.
- [x] Se registraron entradas, resultados y validaciones disponibles sin inventar esquemas.
- [x] Se identificaron 18 inconsistencias contractuales.
- [ ] Product Owner confirma alcance de cada HU.
- [ ] Arquitectura y responsables de servicio resuelven `API-TBD-01` a `API-TBD-18`.
- [ ] Frontend y Gateway validan que las operaciones cubren sus necesidades.
- [ ] Tester deriva casos contractuales positivos y negativos.
- [ ] Se generan y revisan los archivos OpenAPI.

## 13. Historial

| Versión | Fecha      | Cambio                                                                                                                             | Estado                                   |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1.0     | 3-sep-2026 | Inventario inicial de familias y endpoints para las HU de Sprint 1, separado por microservicio y con inconsistencias contractuales | Propuesta pendiente de aprobación humana |
