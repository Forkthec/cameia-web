---
feature: professional-profile
estado: BLOQUEADA
hu: [HU-2.2, HU-2.3, HU-2.4, HU-2.5, HU-2.11]
prt: [PRT-02.02, PRT-02.03, PRT-02.07]
jira: [CM-46, CM-61, CM-65, CM-69]
rutas: [/perfiles/nuevo, /perfiles/:id/editar, /perfiles/:id/roles]
documentacion: tsdoc-es
backlog: 06092026_01
decisiones: [10092026_v1, 11092026_v2, 11092026_v1]
figma: Cameia · Mockups MVP
revisado: 2026-09-11
---

# Feature · Perfil Profesional

## 1. Propósito

El Perfil Profesional es la información que un usuario registra sobre sí mismo —información
general, experiencia laboral, formación académica, habilidades y roles objetivo— para que el
sistema pueda configurar y evaluar sus entrevistas de práctica. Se crea vacío y se completa por
secciones hasta finalizarlo.

## 2. Alcance

**Entra en este sprint:**

- Selección del método de configuración del perfil (PRT-02.02, CM-46).
- Información general (PRT-02.03, HU-2.3).
- Experiencia laboral y educación; la educación es obligatoria para activar el perfil (PRT-02.03,
  HU-2.4, J-01).
- Habilidades (texto libre + nivel) y finalizar (PRT-02.03, HU-2.5).
- Roles Objetivo: consultar, agregar, sustituir y eliminar, de catálogo cerrado, sin prioridad ni
  reordenamiento (HU-2.11, D-01, J-03) — ver §3.5, **BLOQUEADA**.

**No entra, y es deliberado:**

- **Expectativas.** Retiradas del alcance funcional del MVP (D-02). CM-65 y CM-19 pierden la
  palabra «Expectativas» en su título; no se construye ninguna sección para esto.
- **Autocompletar con IA.** El selector de método (CM-46) ofrece esa ruta, pero HU-2.6 a HU-2.10
  son Sprint 2; se renderiza deshabilitada (`CLAUDE.md` §12, abierta 7).
- **Sugerencia de roles por IA / HU-2.10.** Usaba la pantalla PRT-02.07, que D-01 retiró del MVP;
  su destino depende de la consulta **C-04**, sin responder.
- **`seniority`.** Sale del contrato tanto de Rol Objetivo como de experiencia laboral; queda como
  deuda técnica sin uso (`GLOSSARY.md` §2, «Retirados del alcance»).
- **Video y voz con captura real.** Fuera de esta feature; son decisiones de Entrevistas (D-04,
  D-05).

## 3. Comportamiento esperado

`app/router/routes.ts` declara tres rutas para esta feature. Las subsecciones 2 a 4 son **tres
pasos del mismo asistente** sobre `/perfiles/:id/editar` — comparten ruta, tal como ya lo documenta
el TSDoc de `EditProfilePage.tsx`: «los 3 pasos del formulario de perfil comparten esta misma
ruta» — y no tres pantallas independientes.

**Nota transversal de "Sin permiso" para las cinco subsecciones:** las cinco viven detrás de
`RequireAuth` (`CLAUDE.md` §11), que redirige a `/ingresar` antes de montar la página; ese caso no
se repite en cada tabla. El caso «perfil de otro usuario» **no está descrito en el contrato
observable todavía**: los mocks no modelan un 403 — `GET /api/v1/profiles` filtra por `ownerId` y
`PATCH`/`finalize` devuelven 404 `NOT_FOUND` para un id ajeno o inexistente, sin distinguir los dos
casos (`profiles.handlers.ts` líneas 163-166, 200-203). Se anota como parte de **C-01**: sin
contrato real, no se puede afirmar que el backend distinga "no existe" de "no es tuyo".

### 3.1 · `/perfiles/nuevo` — Selección del método · `PRT-02.02` · CM-46

**Qué hace**

- Punto de entrada para crear un perfil nuevo. Ofrece el método manual y, deshabilitado, el
  autocompletado con IA (fuera del alcance, §2).

**Estados**

| Estado      | Qué muestra                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------- |
| Carga       | No aplica: la pantalla no depende de datos remotos para renderizar las opciones de método   |
| Vacío       | No aplica: no hay una colección que pueda estar vacía en esta pantalla                      |
| Error       | Si `POST /api/v1/profiles` falla, mensaje genérico (`errors:generico`) y permite reintentar |
| Sin permiso | Ver nota transversal arriba                                                                 |

**Validaciones del lado del cliente**

- Ninguna: esta pantalla no captura datos de formulario, solo dispara la creación.

### 3.2 · `/perfiles/:id/editar` (paso 1) — Información general · `PRT-02.03` · CM pendiente de confirmar

HU-2.3 tiene subtarea propia en el orden de trabajo del usuario, pero su clave de Jira no está
confirmada contra el tablero en esta sesión (ver §9). No se inventa un número.

**Qué hace**

- Captura `name` y `summary` del perfil ya creado.

**Estados**

| Estado      | Qué muestra                                                                           |
| ----------- | ------------------------------------------------------------------------------------- |
| Carga       | Estado de carga mientras se obtiene el perfil por `id` antes de mostrar el formulario |
| Vacío       | No aplica: el perfil siempre existe en este punto (se creó en el paso anterior)       |
| Error       | Perfil inexistente → `errors:codigos.NOT_FOUND`; fallo de red → `errors:red`          |
| Sin permiso | Ver nota transversal arriba                                                           |

**Validaciones del lado del cliente**

- `name`: vacío o mayor a 120 caracteres bloquea sin llamar al servidor (CA-2.2.1 a CA-2.2.3). Llave
  de error a crear: `errors:codigos.PROFILE_NAME_INVALID` — hoy no existe en `es-CO/errors.json`
  (ver §4).

### 3.3 · `/perfiles/:id/editar` (paso 2) — Experiencia laboral y educación · `PRT-02.03` · CM-61

**Qué hace**

- Gestiona experiencia laboral (opcional) y formación académica (obligatoria para poder finalizar)
  por ítem (J-01: el ticket cubre ambas secciones).

**Estados**

| Estado      | Qué muestra                                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Carga       | Estado de carga mientras se obtienen las listas de experiencia y educación del perfil                                                     |
| Vacío       | Ambas listas pueden estar vacías: experiencia sin ítems es válido; educación sin ítems bloquea la finalización (paso 4), no esta pantalla |
| Error       | Fallo al guardar un ítem → `errors:generico`; fallo de red → `errors:red`                                                                 |
| Sin permiso | Ver nota transversal arriba                                                                                                               |

**Validaciones del lado del cliente**

- Una experiencia laboral en estado `ACTUAL` o `FIN_DESCONOCIDO` no lleva `fecha_fin` (CA-2.4.1).

### 3.4 · `/perfiles/:id/editar` (paso 3) — Habilidades y finalizar · `PRT-02.03` · CM-65

**Qué hace**

- Captura habilidades como texto libre con un nivel asociado (HU-2.5). No agrega, sugiere ni
  gestiona Roles Objetivo desde aquí: solo verifica que exista al menos uno antes de permitir
  finalizar; si no hay ninguno, bloquea la finalización y dirige a la gestión de roles (§3.5).

**Estados**

| Estado      | Qué muestra                                                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carga       | Estado de carga mientras se obtiene la lista de habilidades del perfil                                                                                                        |
| Vacío       | Sin habilidades es válido para mostrar la pantalla; bloquea igual que la falta de educación al intentar finalizar (no está en el contrato como requisito confirmado — ver §4) |
| Error       | Finalizar sin educación → `errors:codigos.EDUCATION_REQUIRED` (llave a crear, ver §4); fallo de red → `errors:red`                                                            |
| Sin permiso | Ver nota transversal arriba                                                                                                                                                   |

**Validaciones del lado del cliente**

- Bloquea el botón de finalizar si no hay al menos una formación académica (HU-2.4) o al menos un
  rol objetivo (HU-2.5). Ambos mensajes con llave de error a crear (ver §4).

### 3.5 · `/perfiles/:id/roles` — Roles Objetivo · `PRT-02.07` · CM-69 · **BLOQUEADA**

**Comportamiento decidido (destino, D-01):** los Roles Objetivo se gestionan completamente **dentro
del formulario del Perfil Profesional** — agregar, sustituir y eliminar, de un catálogo controlado,
sin prioridad ni reordenamiento (J-03 retiró «priorizar» del alcance de CM-69; CA-2.11.6 se retira).
`PRT-02.07` como pantalla separada **sale del MVP** (D-01, `CLAUDE.md` §11).

**Diseño provisional, mientras C-04 y la consulta de seguimiento del 11-sep no se respondan:**
etiquetas de solo lectura dentro del formulario de PRT-02.03 (paso 4), con un enlace a esta pantalla
(`PRT-02.07`, `ProfileRolesPage.tsx`), donde ocurre hoy la gestión real. `ProfileRolesPage.tsx` y la
ruta `/perfiles/:id/roles` **no se borran** hasta tener respuesta a C-04 (`CLAUDE.md` §17). Esta
subsección queda marcada **BLOQUEADA** hasta entonces: no se implementa la gestión completa dentro
del formulario sin saber qué pasa con HU-2.10 (sugerencia de roles por IA, Sprint 2), que usaba esta
misma pantalla.

**Estados**

| Estado      | Qué muestra                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| Carga       | Estado de carga mientras se obtiene `PROFESSIONAL_ROLES` (catálogo) y los roles ya asociados al perfil |
| Vacío       | Sin roles asociados: mensaje invitando a agregar el primero                                            |
| Error       | Fallo de red al leer el catálogo → `errors:red`                                                        |
| Sin permiso | Ver nota transversal arriba                                                                            |

**Validaciones del lado del cliente**

- Máximo 5 roles por perfil (HU-2.11). Solo roles del catálogo cerrado: el usuario no escribe el
  nombre a mano (CA-2.11.7).

## 4. Contrato observable

**Campos y reglas**

| Campo            | Tipo                   | Regla                                                       | Origen                                |
| ---------------- | ---------------------- | ----------------------------------------------------------- | ------------------------------------- |
| `name`           | string                 | 1-120 caracteres                                            | CA-2.2.1 a CA-2.2.3 (no 255 — ver §9) |
| `summary`        | string                 | ≤ 2000 caracteres                                           | `GLOSSARY.md` §2                      |
| `workExperience` | `WorkExperienceItem[]` | Opcional; sin `fecha_fin` si `ACTUAL`/`FIN_DESCONOCIDO`     | CA-2.4.1                              |
| `education`      | `EducationItem[]`      | Obligatorio ≥1 para finalizar; `level` del enum fijo        | HU-2.4, T-01                          |
| `skills`         | `SkillItem[]`          | Texto libre (`skillName`) + `level`; sin catálogo           | HU-2.5, T-01, D-01                    |
| `targetRoleIds`  | `string[]`             | Catálogo cerrado; máximo 5; sin prioridad ni reordenamiento | HU-2.11, D-01, J-03                   |

**Estados y enumerados**

Estados del perfil: `IN_PROGRESS → COMPLETED`, transición única, sin `PENDING`. `IN_REVIEW` queda
fuera del flujo manual y en Sprint 1 ningún perfil lo alcanza. Ver `docs/GLOSSARY.md` §3, sin
repetir la tabla.

`EducationLevel`, `SkillLevel`, catálogo de roles: ver `docs/GLOSSARY.md` §2 y
`src/mocks/data/catalogs.ts`. `SkillLevel` tiene valores sin confirmar (**C-06**); los textos en
español de `EducationLevel` están sin aprobar (**C-07**).

**Errores que el usuario puede ver**

| Código                 | Cuándo ocurre                                      | Llave de i18n                                       |
| ---------------------- | -------------------------------------------------- | --------------------------------------------------- |
| `PROFILE_NAME_INVALID` | `name` vacío o mayor a 120 caracteres              | `errors:codigos.PROFILE_NAME_INVALID` — **a crear** |
| `EDUCATION_REQUIRED`   | Finalizar sin al menos una formación académica     | `errors:codigos.EDUCATION_REQUIRED` — **a crear**   |
| `NOT_FOUND`            | Perfil inexistente o de otro usuario (ver nota §3) | `errors:codigos.NOT_FOUND` — ya existe              |

`PROFILE_NAME_INVALID` y `EDUCATION_REQUIRED` son códigos de mock, no confirmados con backend
(`profiles.handlers.ts` líneas 30-36); pueden no coincidir cuando exista el contrato real (C-01).
`es-CO/errors.json` hoy solo declara `NOT_FOUND`, `VALIDATION_ERROR` y `UNAUTHORIZED` bajo
`codigos` — las otras dos llaves no existen todavía.

## 5. Enlace HTTP · PROVISIONAL

**Estado del contrato:** provisional · fuente: `src/mocks/handlers/profiles.handlers.ts` (mocks,
sin OpenAPI; C-01 sin responder) · revisado el 11-sep-2026.

| Operación                | Método y ruta                        | Envía                                                                     | Recibe                                                                                |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Crear                    | `POST /api/v1/profiles`              | Body opcional; sin `name` crea vacío (memo 11-sep); con `name`, se valida | 201 `ProfileRecord` · 400 `PROFILE_NAME_INVALID`                                      |
| Actualizar por secciones | `PATCH /api/v1/profiles/:id`         | Cualquier subconjunto de `ProfilePatchBody`                               | 200 `ProfileRecord` · 400 `PROFILE_NAME_INVALID` · 404 `NOT_FOUND`                    |
| Finalizar                | `POST /api/v1/profiles/:id/finalize` | Sin body                                                                  | 200 `ProfileRecord` (status `COMPLETED`) · 422 `EDUCATION_REQUIRED` · 404 `NOT_FOUND` |
| Listar                   | `GET /api/v1/profiles`               | Sin body                                                                  | 200 `ProfileRecord[]`, filtrado por `ownerId`                                         |

No existe endpoint de catálogo de roles: `src/mocks/data/catalogs.ts` es un módulo de datos en
memoria, no un handler HTTP. El endpoint real de `PROFESSIONAL_ROLES` es dependencia de Backend
(T-01, `docs/decisiones/11092026_v2_…`).

## 6. Criterios de aceptación

| Criterio                                                           | Qué hace el frontend que el criterio no dice                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| CA-2.2.1 a CA-2.2.3 (nombre 1-120)                                 | Bloquea sin llamar al servidor y repite la misma validación al guardar por `PATCH` (§4)                |
| CA-2.4.1 (experiencia `ACTUAL`/`FIN_DESCONOCIDO` sin fecha de fin) | Omite el campo `fecha_fin` del formulario en vez de enviarlo vacío                                     |
| HU-2.4 (educación obligatoria)                                     | Bloquea el botón «Finalizar» en el cliente antes de llamar a `finalize`, no solo tras la respuesta 422 |
| HU-2.5 (verificar ≥1 rol objetivo)                                 | Redirige a §3.5 cuando no hay ningún rol, en vez de solo deshabilitar el botón                         |
| HU-2.11, D-01, J-03 (roles: catálogo, sin prioridad ni reorden)    | El formulario nunca ofrece una acción de reordenar ni un campo de prioridad                            |
| CA-2.11.3 (bloqueo del último rol solo en `COMPLETED`)             | Conservado tal cual; ver §3.5                                                                          |
| CA-2.11.7 (solo roles del catálogo)                                | El selector no admite texto libre, solo selección de `PROFESSIONAL_ROLES`                              |
| CA-2.11.6 (reordenamiento/prioridad)                               | Retirado (D-01); no se implementa                                                                      |

## 7. Estado de implementación

| Archivo                                   | Qué implementa                                                                                      | Prueba                                         |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `src/mocks/handlers/profiles.handlers.ts` | Infraestructura de apoyo: ciclo completo de mocks del perfil (crear, actualizar, finalizar, listar) | `src/mocks/handlers/profiles.handlers.test.ts` |

Ninguna página está construida todavía: `NewProfilePage.tsx`, `EditProfilePage.tsx` y
`ProfileRolesPage.tsx` son placeholders con `EmptyState`, sin lógica de formulario.

## 8. Bloqueos

Enunciados citados de
`docs/decisiones/11092026_v1_consulta-contrato-y-alcance-perfil-profesional.md` (consulta de
seguimiento de Frontend a la respuesta del PO del 11-sep).

| Id   | Qué falta                                                                                                                                                                                                                                                                | De quién depende             | Desde                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------- |
| C-01 | Fuente documentable de los campos y límites que cita la respuesta del 11-sep (`skillName`, `target-roles`, `inProgress`, `ProblemDetail`, `name ≤ 255`), ninguno presente en el backlog del 6-sep                                                                        | Backend                      | sin respuesta del PO al 11-sep-2026 |
| C-02 | Si la identidad por cabecera `X-User-Id` es temporal (con ticket y fecha de retiro) o el diseño definitivo; Frontend seguirá enviando el token de Firebase mientras no se aclare                                                                                         | Backend / Arquitectura       | sin respuesta del PO al 11-sep-2026 |
| C-03 | Si la pantalla de Selección de Método conserva el campo `name` (CA-2.2.1 a CA-2.2.3) y si crear el perfil en ese punto consume el cupo del plan gratuito antes de que el usuario guarde algo — no hay forma de descartar un perfil vacío, archivar es HU-2.12 (Sprint 3) | Product Owner                | sin respuesta del PO al 11-sep-2026 |
| C-04 | Destino de HU-2.10 (sugerencia de roles con IA, Sprint 2) tras retirar `PRT-02.07`, la pantalla que usaba                                                                                                                                                                | Product Owner                | sin respuesta del PO al 11-sep-2026 |
| C-05 | Si CM-69 se mantiene como ticket propio para la sección de roles dentro del formulario o su alcance se absorbe en CM-65; si «sustituir» sigue siendo una acción distinta sin sugerencias de IA                                                                           | Product Owner / Scrum Master | sin respuesta del PO al 11-sep-2026 |
| C-06 | Valores de `SkillLevel`; criterio de duplicado con texto libre («Java» vs «java»); límite de caracteres por habilidad y máximo por perfil                                                                                                                                | Product Owner / Backend      | sin respuesta del PO al 11-sep-2026 |
| C-07 | Si la lista `TECHNICAL`/`UNDERGRADUATE`/`POSTGRADUATE` (sin tecnólogo, agrupando especialización/maestría/doctorado) es intencional; textos en español a mostrar; confirmar que se pierde el estado «interrumpida» de una formación                                      | Product Owner                | sin respuesta del PO al 11-sep-2026 |

## 9. Notas

**Regla de autoridad.** El comportamiento lo fija el backlog, siempre. El diseño lo fija Frontend:
cuando esta especificación y Figma difieren en diseño, manda la especificación y Figma se actualiza
después. Toda diferencia consciente respecto a Figma o al backlog queda anotada aquí.

**Estado compartido en las pruebas.** `profiles.handlers.ts` mantiene su array en memoria y
`resetProfiles()` como estado compartido entre archivos de prueba: cualquier prueba futura que
consuma estos handlers (incluidas las de esta feature) debe llamar `resetProfiles()` en su propio
`beforeEach`, o va a heredar datos de la prueba anterior (`profiles.handlers.ts`, líneas 8-11).

**Divergencias conscientes, registradas sin corregirlas (fuera del alcance de este archivo):**

1. `GLOSSARY.md` línea 38 dice `name (≤ 255)`; esta spec usa 120 porque es lo que respalda el
   backlog (CA-2.2.1 a CA-2.2.3). El 255 viene del memo del PO del 11-sep sin fuente verificada
   (C-01) — manda el backlog.
2. `src/i18n/locales/es-CO/profile.json` todavía dice `"habilidades.titulo": "Habilidades y
expectativas"`, pese a que D-02 retiró las expectativas del alcance.
3. HU-2.3 (Información General, §3.2) no tiene clave de Jira confirmada contra el tablero en esta
   sesión.

Ninguna de las tres se corrige en este commit: corregirlas es tocar `GLOSSARY.md` o
`profile.json`, fuera del diff autorizado para esta spec.
