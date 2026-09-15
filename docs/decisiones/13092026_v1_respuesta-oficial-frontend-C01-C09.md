# Respuesta oficial a la consulta de seguimiento C-01…C-09 — Perfil Profesional

- **Versión:** 1.0
- **Fecha:** 13 de septiembre de 2026
- **De:** Product Owner / Scrum Master
- **Para:** Juan Diego Gómez Garcés — Frontend
- **Responde a:** `11092026_v1_consulta-contrato-y-alcance-perfil-profesional.md`
- **Fuente técnica de referencia:** código de MicroPerfilPro + `13092026_01_MicroPerfilPro_OpenAPI_actual.json`
- **Fuente funcional de referencia:** `13092026_01_Backlog.xlsx` (backlog corregido y vigente)

---

Gracias por el detalle de la consulta. Varias observaciones nos sirvieron para detectar puntos que había que precisar en el contrato o corregir en la implementación. Respondo las nueve y marco con claridad qué queda cerrado, qué corrige Producto en el backlog y qué queda en manos de Backend o Arquitectura.

## C-01 · Fuente del contrato

La referencia técnica oficial es doble y a la vez única: **el código de MicroPerfilPro y su OpenAPI generado** (`13092026_01_MicroPerfilPro_OpenAPI_actual.json`). El OpenAPI se genera desde el propio código, así que no pueden contradecirse. Todos los nombres que citábamos (`skillName`, `target-roles`, `inProgress`, `TECHNICAL/UNDERGRADUATE/POSTGRADUATE`, `255/2000`, `COMPLETED`) provienen de ahí y **ya están reflejados en el backlog corregido** (`13092026_01_Backlog.xlsx`), que puedes citar con seguridad.

Orden de prelación para la especificación: (1) OpenAPI + código, (2) backlog corregido, (3) glosario. Las familias de endpoints son secundarias. El documento de reglas de código del Backend **no** es fuente oficial de contrato; úsalo solo como contexto.

Dos avisos honestos: el propio OpenAPI declara decisiones contractuales aún abiertas (`API-TBD-05, 06, 07, 09, 18`) y el código tiene TODOs sin cerrar (nombre del header, uso de `PENDING`). Los señalo donde aplican.

## C-02 · Identidad por cabecera `X-User-Id`

Esta consulta queda **remitida a Backend/Arquitectura**, pero con contexto verificado en el código:

- El diseño previsto **no** es que el navegador envíe `X-User-Id`. Es que el **API Gateway verifique el token de Firebase y propague el UID** en esa cabecera (así lo documenta la clase `FirebaseUid`). Es un contrato **servicio-a-servicio detrás del Gateway**, no algo que fije el cliente.
- El código deja constancia de que **el Gateway todavía no está configurado** (`TODO CM-DEV-IN`). Tu preocupación de seguridad es correcta **para el estado actual**: hoy nada verifica el token antes de confiar en la cabecera.

Queda formalmente remitido a Arquitectura confirmar (a) que el esquema definitivo es Gateway → `X-User-Id` y (b) la fecha de configuración del Gateway.

## C-03 · Pantalla de método y cupo

Ambos puntos ya están corregidos en el backlog vigente:

- **Nombre:** ya **no** se pide en la pantalla de Selección de Método. Al elegir "Llenado Manual", el sistema crea el perfil vacío (sin body) en `IN_PROGRESS` y navega al Formulario, donde se indica el nombre por `PATCH` (CA-2.2.1). La pantalla de método queda solo con las dos tarjetas.
- **Cupo:** el límite de plan se valida **antes de crear el perfil** (CA-2.2.1) y, si se excede, se dirige al Paywall sin persistir nada (CA-2.2.3). Además, **ambas rutas convergen en el mismo perfil** (CA-2.2.4): si alguien elige Manual y luego quiere IA, continúa sobre el **mismo** perfil hacia la carga de CV, sin consumir un cupo adicional ni perder nada. A nivel Backend existe un solo perfil por usuario (`409` si ya existe).
- **Decisión de Producto (registrada):** en el MVP no hay forma de descartar/reiniciar un borrador antes del archivado (HU-2.12, Sprint 3). Lo aceptamos para el MVP: el usuario del plan gratuito continúa su único borrador; no necesita crear otro, falta implementar h.u para editar y eliminar perfiles profesionales, las cuales se haran necesarias para el mvp pero no afectan el sprint 1.

## C-04 · Sugerencia de roles con IA (HU-2.10)

**HU-2.10 no se elimina**: sigue planificada para el **Sprint 2**. Lo que se retira es la **pantalla separada `PRT-02.07`**, no la historia. La sugerencia con IA se integrará más adelante **dentro del formulario** (CA-2.5.1 y CA-2.11.1). Corregiremos en el backlog la frase ambigua de CA-2.5.1 ("fuera del alcance del MVP" → "fuera del alcance de Sprint 1") para que no se interprete como que HU-2.10 desaparece.

## C-05 · Gestión de roles: CM-69 y "sustituir"

- **CM-69 se mantiene** como ticket propio (ya decidido en J-03: se renombra quitando "priorizar", con alcance consultar/agregar/sustituir/eliminar). Aunque viva dentro del formulario de CM-65, tiene su propio conjunto de criterios (CA-2.11.\*) y sus propias operaciones de Backend, así que separarlo es coherente con la trazabilidad del Sprint 1.
- **"Sustituir" es una operación propia del Backend**, no "eliminar y volver a agregar". Existe `PATCH /api/v1/profiles/{id}/target-roles/{roleId}`, que reemplaza el `professionalRoleId` **conservando el mismo identificador del Rol Objetivo**. En UI puede ser un botón "sustituir"; su ventaja frente a eliminar+agregar es que **la referencia del rol se mantiene estable**.
- **Sobre la procedencia y el duplicado al sustituir:** el criterio original mezclaba una regla que corresponde al Sprint 2. En el **Sprint 1 no hay roles sugeridos por IA** (eso llega con HU-2.10), así que la sustitución simplemente reemplaza la referencia del catálogo y la procedencia se mantiene (`MANUAL`); la transición `AI_SUGGESTED → AI_EDITED` se activará con HU-2.10. Lo único que aplica hoy es **no sustituir por un rol ya presente**: por ahora lo garantizas desde el Formulario (no ofrecer en el selector los roles ya asociados); el refuerzo en Backend se abordará junto con HU-2.10. Estamos ajustando CA-2.11.1 en el backlog para reflejar esta separación. **No te bloquea para maquetar.**

## C-06 · Habilidades

Contrato técnico verificado en OpenAPI/código:

- **Valores de `level`:** `BASIC`, `INTERMEDIATE`, `ADVANCED`.
- **`level` es obligatorio.** Corregimos el backlog para declararlo así (CA-2.5.1); el Backend ya lo exige. **Envía siempre `level`.**
- **`skillName`:** entre 1 y **255** caracteres (rechazo si excede o va vacío).
- **`provenance`:** obligatorio; en alta manual, `MANUAL`.
- **Máximo de habilidades por perfil:** **no hay** (CA-2.5.3). Confirmado.
- **Duplicados:** la regla es la que planteas —no repetir el mismo texto, **sin distinguir mayúsculas/minúsculas ni espacios** (CA-2.5.2)—. **Ya enviamos a Backend la indicación de implementarla**, porque hoy no está activa del lado servidor. Mientras se despliega, puedes prevenir en cliente como ayuda de UX; la validación autoritativa quedará en Backend (responderá `409` cuando esté lista).

## C-07 · Educación

Verificado en enum, código y backlog:

- **Niveles disponibles:** `TECHNICAL`, `UNDERGRADUATE`, `POSTGRADUATE` (CA-2.4.9). El Backend rechaza cualquier valor fuera de ese conjunto; no hay catálogo en BD.
- **`inProgress` boolean:** confirmado. Si es `true`, la fecha de fin va nula (CA-2.4.7). **No existe** el estado "interrumpida" (CA-2.4.8): se elimina a propósito, como preguntabas.
- **`fecha_inicio` es obligatoria.** Corregimos el backlog (CA-2.4.6) para alinearlo con el Backend, que ya la exige. La `fecha_fin` es opcional. **Envía siempre fecha de inicio.**
- **Decisiones de Producto (registradas):**
  - La simplificación a tres niveles es intencional para el MVP. Sabemos que deja fuera al *tecnólogo* y agrupa especialización/maestría/doctorado en "posgrado". Ampliar el enum no está previsto para este sprint (implicaría cambio de Backend).
  - Los **textos en español** de los tres niveles: propón las etiquetas y Producto las aprueba.

## C-08 · Idioma de los códigos

Se mantiene la convención del inicio del Sprint: **código y elementos técnicos en inglés; documentación funcional en español.**

- **En MicroPerfilPro está verificado:** todos los enums y nombres del contrato están en inglés (`ProfileStatus`, `SkillLevel`, `EducationLevel`, `DataProvenance`, `EmploymentStatus`, `WorkModality`, `ReviewStatus`).
- **Sobre Entrevistas no cambia nada por ahora.** El backlog corregido y el glosario **siguen declarando en español** los estados de sesión (`CONFIGURADA`, `EN_CURSO`, `EVALUANDO`, `FINALIZADA`, `ABANDONADA`) y las modalidades (`ENTRENO`, `SIMULACION`). No modificaremos Entrevistas por inferencia ni por consistencia. **No rehagas tus archivos de traducción ni tus referencias a la máquina de estados de la sesión.** Si en algún momento se decidiera unificar el idioma, será una decisión a confirmar con el responsable de ese microservicio, en cuanto lo implemente.

## C-09 · Spike y responsables en el tablero

- **Fecha del spike:** la voy a consultando directamente con Vela mañana en clase y te comparto la fecha comprometida en cuanto la tenga, para que decidas si CM-84, CM-85 y CM-89 caben en el sprint.
- **CM-21 sin responsable único:** es intencional. Nuestro profesor no exige un único asignado en la HU cuando sus subtareas ya tienen responsables; las subtareas del spike están asignadas a Vela, y esa es la asignación operativa que importa. No es un descuido del tablero.
- **CM-19 "En curso":** también es deliberado. Las tareas de Backend de esa historia ya están en ejecución, aunque la HU no tenga un responsable único por la misma razón. No la devuelvas a "Por hacer".

---

## Qué queda abierto y quién lo resuelve

- **Backend:** implementar rechazo de habilidad duplicada (C-06) y validación limpia de campos de habilidad; el resto de Perfil Profesional está conforme al contrato.
- **Arquitectura/Backend:** esquema definitivo y fecha del Gateway para `X-User-Id` (C-02).
- **Producto (ya corregido/registrado):** `level` y `fecha_inicio` obligatorios en el backlog (C-06, C-07); reencuadre de la sustitución de rol (C-05); redacción de HU-2.10 (C-04); aceptabilidad de no descartar borradores hasta Sprint 3 (C-03); niveles educativos y sus etiquetas (C-07).
- **Transversal (con responsable de Entrevistas):** eventual unificación de idioma (C-08).
- **Scrum Master:** fecha del spike vía Vela (C-09).

Te aviso con el nombre y la fecha del backlog actualizado en cuanto queden aplicadas estas correcciones.
