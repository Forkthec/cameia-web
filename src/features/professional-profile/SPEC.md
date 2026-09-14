---
feature: professional-profile
estado: BLOQUEADA
hu: [HU-2.2, HU-2.3, HU-2.4, HU-2.5, HU-2.11]
prt: [PRT-02.02, PRT-02.03, PRT-02.07]
jira: [CM-46, CM-53, CM-61, CM-65, CM-69]
rutas: [/perfiles/nuevo, /perfiles/:id/editar, /perfiles/:id/roles]
documentacion: tsdoc-es
backlog: 12092026_01
decisiones: [10092026_v1, 11092026_v2, 11092026_v1]
figma: Cameia · Mockups MVP
revisado: 2026-09-14
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

`app/router/routes.ts` declara tres rutas para esta feature. Las subsecciones 2 a 4 **no son pasos
de un asistente**: son las cuatro secciones (Información General, Formación académica, Experiencia
Laboral, Expectativas Profesionales — esta última fuera del MVP, D-02) de **una sola página** en
`/perfiles/:id/editar`, verificado contra el prototipo real de Figma en CM-53 (nodos `140:960` lg /
`142:638` sm de `PRT-02.03 · Formulario de Perfil Profesional`). La página tiene un índice de
secciones (`step-list` vertical en `lg`, acordeón en `sm`) y una barra de acciones **compartida
entre las cuatro secciones**, con una `progress-bar` de completitud del perfil y dos botones:
«Guardar borrador» (`variant=secondary`) y «Finalizar y Continuar» (`variant=primary`, deshabilitado
hasta que las cuatro secciones cumplan sus requisitos). Ninguna sección tiene su propio botón de
guardado ni su propio estado de carga de página — todo eso lo posee el armazón compartido, que
sigue sin dueño (ver nota técnica en §9). Antes de esta verificación, `docs/ARCHITECTURE.md` §2, el
TSDoc de `WizardLayout.tsx` y una versión anterior de esta misma sección citaban un asistente
paginado que el frame real no tiene — ya corregido en los tres lugares
(`docs/bitacora-ia/hallazgo-figma-no-revisado-cm53.md`). **§3.3 y §3.4 abajo (CM-61, CM-65, todavía
sin construir) conservan el lenguaje de «paso 2»/«paso 3» heredado de ese mismo error, sin
verificar** — no se reescriben aquí por no ser el alcance de CM-53; quien abra esos tickets debe
releerlas contra Figma antes de darlas por buenas.

**Nota transversal de "Sin permiso" para las cinco subsecciones:** las cinco viven detrás de
`RequireAuth` (`CLAUDE.md` §11), que redirige a `/ingresar` antes de montar la página; ese caso no
se repite en cada tabla. El caso «perfil de otro usuario» **no está descrito en el contrato
observable todavía**: los mocks no modelan un 403 — `GET /api/v1/profiles` filtra por `ownerId` y
`PATCH`/`finalize` devuelven 404 `NOT_FOUND` para un id ajeno o inexistente, sin distinguir los dos
casos (`profiles.handlers.ts` líneas 163-166, 200-203). Se anota como parte de **C-01**: sin
contrato real, no se puede afirmar que el backend distinga "no existe" de "no es tuyo".

### 3.1 · `/perfiles/nuevo` — Selección del método · `PRT-02.02` · CM-46

Fuente: backlog 12092026_01, hoja «Criterios de aceptación», HU-2.2, CA-2.2.1 a CA-2.2.4.

**Qué hace**

- Punto de entrada para crear un perfil nuevo: dos tarjetas excluyentes, «Llenado Manual» y
  «Autocompletar con IA». Tocar una tarjeta ES la acción — no hay campo para el nombre del perfil
  ni botón «Continuar» (CA-2.2.1: «El Perfil Profesional se crea vacío, sin nombre_perfil ni ningún
  otro dato; el POST de creación no recibe cuerpo (body)»; `nombre_perfil` se fija después por
  `PATCH /api/v1/profiles/{id}`, ver HU-2.3 / §3.2).
- **CA-2.2.1 (ruta manual) — implementado, salvo la validación de cupo del plan.** Tocar «Llenado
  Manual» crea el perfil vacío en `IN_PROGRESS` (`POST /api/v1/profiles` sin body) y navega al
  Formulario de Perfil Profesional (`/perfiles/:id/editar`) con el `id` devuelto. La precondición
  de cupo que describe el criterio («El sistema valida el cupo del plan... si se excede, dirigir al
  Paywall») **no se implementa**: el mock no modela ningún límite de plan ni el Paywall de HU-2.12
  (Sprint 3), y no hay forma de descartar un perfil vacío creado de más (consulta C-03, §8).
  Mientras la creación está en curso, la tarjeta manual da realimentación inmediata (queda marcada
  como seleccionada) y se anuncia un indicador de carga; un segundo toque durante ese lapso se
  ignora, para no crear dos perfiles con el mismo cupo antes de que responda el primero.
- **CA-2.2.2 (ruta de IA) — NO implementado en Sprint 1.** La tarjeta «Autocompletar con IA» se
  muestra deshabilitada con la insignia «Próximamente» en vez de navegar a la Carga de CV (HU-2.6),
  que es Sprint 2 (`CLAUDE.md` §12, abierta 7). Diverge del frame de Figma, que la dibuja habilitada
  con una insignia «Recomendado» — ver §9.
- **CA-2.2.3 (rechazo por límite de cupo) — NO implementado.** Ninguna ruta dirige al Paywall
  (HU-2.12, Sprint 3); el mock no modela ningún rechazo por cupo de plan.
- **CA-2.2.4 (convergencia de ambas rutas en el mismo perfil) — no aplica a esta pantalla.**
  Describe el comportamiento posterior, ya dentro del Formulario de Perfil Profesional (§3.2 a
  §3.4), no la selección del método.

**Estados**

| Estado      | Qué muestra                                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carga       | No aplica al render inicial: la pantalla no depende de datos remotos para mostrar las dos tarjetas. Mientras la creación está en curso, la tarjeta manual queda marcada como seleccionada y se anuncia un indicador de carga; un segundo toque se ignora (ver CA-2.2.1 arriba) |
| Vacío       | No aplica: no hay una colección que pueda estar vacía en esta pantalla                                                                                                            |
| Error       | Si `POST /api/v1/profiles` falla, mensaje genérico (`errors:generico`) y permite reintentar tocando la tarjeta de nuevo                                                          |
| Sin permiso | Ver nota transversal arriba                                                                                                                                                       |

**Validaciones del lado del cliente**

- Ninguna: esta pantalla no captura datos de formulario, solo dispara la creación. No hay campo de
  nombre que validar — a diferencia de una versión anterior de esta subsección, escrita contra el
  backlog del 6-sep, que sí lo tenía (ver §9).

### 3.2 · `/perfiles/:id/editar` — Sección «Información General» · `PRT-02.03` · CM-53

**Qué hace**

- Dentro de la página única (ver nota de §3), el campo «Nombre del perfil» (fuera de cualquier
  encabezado de sección en el frame, pero es el primer dato que captura la página) y la sección
  «Información General» con «Resumen profesional». Captura `name` y `summary` del perfil ya creado.
  Al guardar, `summaryProvenance` se recalcula según CA-2.3.1/CA-2.3.2/CA-2.3.4 (ver §4); el cliente
  nunca lo envía.
- **Alcance real entregado por CM-53: el organismo `GeneralInfoForm`, no la página.** El frame
  incluye un índice de secciones, una `progress-bar` de completitud (que cuenta campos de las
  cuatro secciones) y dos botones compartidos con «Finalizar y Continuar» — nada de eso depende
  solo de esta sección, y construirlo ahora sería inventar el comportamiento de secciones que
  CM-61/CM-65/CM-69 todavía no tienen. Por decisión explícita (13-sep-2026): CM-53 entrega
  `GeneralInfoForm` listo para insertarse; `EditProfilePage.tsx` sigue siendo el placeholder de
  `EmptyState` hasta que alguien arme el armazón completo. Los estados de Carga/Error/Sin permiso
  de la tabla de abajo describen el comportamiento **previsto de la página**, no algo que CM-53
  implemente todavía — `fetchProfile`/`useProfileQuery` y `updateGeneralInfo`/
  `useUpdateProfileGeneralInfo` ya existen y los prueba su propia suite, listos para que la página
  los consuma.
- **No incluye el campo «Ubicación»** que el frame sí dibuja en esta sección: ningún CA de HU-2.3 lo
  menciona, no existe en `GLOSSARY.md` ni en el contrato — bloqueo **C-10** (§8).

**Estados**

| Estado      | Qué muestra                                                                           |
| ----------- | ------------------------------------------------------------------------------------- |
| Carga       | Estado de carga mientras se obtiene el perfil por `id` antes de mostrar el formulario |
| Vacío       | No aplica: el perfil siempre existe en este punto (se creó en el método de configuración) |
| Error       | Perfil inexistente → `errors:codigos.NOT_FOUND`; fallo de red → `errors:red`          |
| Sin permiso | Ver nota transversal arriba                                                           |

**Validaciones del lado del cliente**

- `name`: vacío o mayor a 120 caracteres bloquea sin llamar al servidor (CA-2.2.1 a CA-2.2.3). Llave
  de error: `errors:codigos.PROFILE_NAME_INVALID` (ver §4).
- `summary`: más de 2000 caracteres bloquea sin llamar al servidor (`maxLength` del campo) y muestra
  el contador de caracteres restantes (CA-2.3.3, `GLOSSARY.md` §2). El frame de Figma muestra el
  contador en 600, no 2000 — se mantiene 2000 por decisión explícita (bloqueo **C-11**, §8).

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
| `summaryProvenance` | `'MANUAL' \| 'AI_SUGGESTED' \| 'AI_EDITED' \| null` | Lo calcula el backend/mock a partir del valor anterior; el cliente nunca lo envía en el `PATCH` | CA-2.3.1, CA-2.3.2, CA-2.3.4 |
| `summaryProvenanceOrigin` | `string \| null` | Se conserva solo en la transición `AI_SUGGESTED → AI_EDITED`; nulo en cualquier otro caso, incluida la creación manual | CA-2.3.2 |

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
`PROFILE_NAME_INVALID` ya tiene llave en `es-CO/errors.json` (CM-53); `EDUCATION_REQUIRED` sigue
sin ella — la agrega CM-65, la subtarea dueña de la pantalla de finalizar.

## 5. Enlace HTTP · PROVISIONAL

**Estado del contrato:** provisional · fuente: `src/mocks/handlers/profiles.handlers.ts` (mocks,
sin OpenAPI; C-01 sin responder) · revisado el 11-sep-2026.

| Operación                | Método y ruta                        | Envía                                                                     | Recibe                                                                                |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Crear                    | `POST /api/v1/profiles`              | Body opcional; sin `name` crea vacío (memo 11-sep); con `name`, se valida | 201 `ProfileRecord` · 400 `PROFILE_NAME_INVALID`                                      |
| Obtener                  | `GET /api/v1/profiles/:id`           | Sin body                                                                  | 200 `ProfileRecord` · 404 `NOT_FOUND`                                                 |
| Actualizar por secciones | `PATCH /api/v1/profiles/:id`         | Cualquier subconjunto de `ProfilePatchBody`                               | 200 `ProfileRecord` · 400 `PROFILE_NAME_INVALID` · 404 `NOT_FOUND`                    |
| Finalizar                | `POST /api/v1/profiles/:id/finalize` | Sin body                                                                  | 200 `ProfileRecord` (status `COMPLETED`) · 422 `EDUCATION_REQUIRED` · 404 `NOT_FOUND` |
| Listar                   | `GET /api/v1/profiles`               | Sin body                                                                  | 200 `ProfileRecord[]`, filtrado por `ownerId`                                         |

El `PATCH` nunca recibe `provenance`: `profiles.handlers.ts` deriva
`summaryProvenance`/`summaryProvenanceOrigin` del valor almacenado y del nuevo `summary` (vaciar el
campo limpia los tres en conjunto — CA-2.3.4; editar un resumen `AI_SUGGESTED` lo pasa a
`AI_EDITED` conservando el origen — CA-2.3.2; cualquier otro caso queda en `MANUAL` con origen nulo
— CA-2.3.1). Es responsabilidad del backend real cuando exista (C-01); aquí la sostiene el mock
porque es la única capa contra la que corre el frontend mientras tanto (CM-53).

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

| Archivo                                                                                        | Qué implementa                                                                                                              | Prueba                                                                                              |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/mocks/handlers/profiles.handlers.ts`                                                       | Infraestructura de apoyo: ciclo completo de mocks del perfil (crear, obtener por id, actualizar, finalizar, listar); deriva `summaryProvenance`/`summaryProvenanceOrigin` en el `PATCH` (CA-2.3.1, CA-2.3.2, CA-2.3.4) | `src/mocks/handlers/profiles.handlers.test.ts`                                                     |
| `src/features/professional-profile/organisms/ProfileMethodSelector/ProfileMethodSelector.tsx`  | §3.1 (CM-46): las dos tarjetas excluyentes y la guarda contra doble creación mientras la mutación está en curso            | `src/features/professional-profile/organisms/ProfileMethodSelector/ProfileMethodSelector.test.tsx` |
| `src/features/professional-profile/pages/NewProfilePage.tsx`                                    | §3.1: la ruta «/perfiles/nuevo» — crea el perfil sin cuerpo al elegir «Llenado Manual» y navega al formulario con el id devuelto | `src/features/professional-profile/pages/NewProfilePage.test.tsx`                            |
| `src/features/professional-profile/model/profile.constants.ts`                                  | §3.2 (CM-53): límites `NAME_MAX_LENGTH`/`SUMMARY_MAX_LENGTH`                                                               | cubierto por las pruebas de `GeneralInfoForm` y `EditProfilePage`                                    |
| `src/features/professional-profile/model/profile.types.ts`                                      | §3.2 (CM-53): tipos de dominio `Profile`, `SummaryProvenance`                                                              | cubierto por las pruebas de `GeneralInfoForm` y `EditProfilePage`                                    |
| `src/features/professional-profile/schemas/generalInfo.schema.ts`                                | §3.2 (CM-53): validación zod de `name`/`summary`, sin mensajes de texto (CLAUDE.md §3.2)                                   | `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.test.tsx`             |
| `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.tsx`                | §3.2 (CM-53): el formulario de Información General — react-hook-form + zod, `<Controller>` (Input no acepta `ref`)         | `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.test.tsx`             |
| `src/features/professional-profile/api/profile.dto.ts`                                          | §3.2 (CM-53): forma cruda del `ProfileRecord` que necesita esta sección                                                    | cubierto por `useProfileQuery.test.tsx`/`useUpdateProfileGeneralInfo.test.tsx` (integración vía MSW) |
| `src/features/professional-profile/api/profile.mapper.ts`                                       | §3.2 (CM-53): `ProfileDto → Profile`                                                                                       | cubierto por `useProfileQuery.test.tsx`/`useUpdateProfileGeneralInfo.test.tsx` (integración vía MSW) |
| `src/features/professional-profile/api/profile.api.ts`                                          | §3.2 (CM-53): `fetchProfile`/`updateGeneralInfo` contra el mock                                                             | cubierto por `useProfileQuery.test.tsx`/`useUpdateProfileGeneralInfo.test.tsx` (integración vía MSW) |
| `src/features/professional-profile/hooks/useProfileQuery.ts`                                    | §3.2 (CM-53): `useQuery` del perfil por id, listo para que la página lo consuma cuando exista                              | `src/features/professional-profile/hooks/useProfileQuery.test.tsx`                                   |
| `src/features/professional-profile/hooks/useUpdateProfileGeneralInfo.ts`                        | §3.2 (CM-53): `useMutation` del guardado, escribe la respuesta directo en la caché de `useProfileQuery`                     | `src/features/professional-profile/hooks/useUpdateProfileGeneralInfo.test.tsx`                       |
| `src/features/professional-profile/routes.tsx`                                                  | Mapea la ruta «/perfiles/nuevo» bajo `professionalProfileShellRoutes` (se anida en AppShell, ver §9)                       | `src/app/router/index.test.tsx` (features no puede importar RequireAuth, ver §9)                    |
| `src/test/setup.ts`                                                                              | Infraestructura de apoyo: reinicia `src/mocks/handlers/profiles.handlers.ts` (función `resetProfiles`) antes de cada prueba de toda la suite, ver §9 | —                                                                        |
| `src/test/msw.ts`                                                                                | Infraestructura de apoyo: instala handlers puntuales de MSW desde una prueba de feature, ver §9                             | —                                                                                                  |

`EditProfilePage.tsx` y `ProfileRolesPage.tsx` siguen siendo placeholders con `EmptyState`, sin
lógica de formulario — `EditProfilePage.tsx` no se toca en CM-53 (ver nota de §3 y §9: se construyó
y se revirtió tras verificar que el armazón real de PRT-02.03 no es un asistente por pasos).
`NewProfilePage.tsx` sigue siendo la única página real de esta feature. `WizardLayout.tsx` tampoco
cambia: la prop `primaryActionFormId` que CM-53 le agregó se revirtió por no tener ningún consumidor
una vez descartado su uso en esta pantalla (`docs/bitacora-ia/hallazgo-figma-no-revisado-cm53.md`).

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
| C-09 | Origen documentable de `preferredModality` — cero ocurrencias en el backlog, `GLOSSARY.md` o los tres memos de decisiones; no se implementa hasta que exista                                                                                                             | Backend / Product Owner      | detectado 13-sep-2026, CM-53        |
| C-10 | El frame real de PRT-02.03 (nodo `140:960`/`142:638`) dibuja un campo «Ubicación» en la sección Información General que ningún CA de HU-2.3 menciona, que no está en `GLOSSARY.md` ni en el contrato de mocks — ¿entra a HU-2.3, es de otra HU, o el frame quedó desactualizado? No se construye hasta confirmar | Product Owner                | detectado 14-sep-2026, CM-53        |
| C-11 | El mismo frame muestra el contador de `summary` en «0 / 600 caracteres»; `GLOSSARY.md` §2, HU-2.5 (backlog 12-sep) y el memo del PO del 11-sep dicen 2000. CM-53 mantuvo 2000 por decisión explícita del usuario, pero uno de los dos artefactos (el frame o el glosario) está desactualizado y nadie lo ha corregido | Product Owner / Diseño       | detectado 14-sep-2026, CM-53        |

## 9. Notas

**Regla de autoridad.** El comportamiento lo fija el backlog, siempre. El diseño lo fija Frontend:
cuando esta especificación y Figma difieren en diseño, manda la especificación y Figma se actualiza
después. Toda diferencia consciente respecto a Figma o al backlog queda anotada aquí.

**Estado compartido en las pruebas.** `profiles.handlers.ts` mantiene su array en memoria; desde
CM-46, `resetProfiles()` ya no es responsabilidad de cada archivo de prueba, sino un `beforeEach`
global en `src/test/setup.ts` (que corre antes de cada prueba de toda la suite, no solo de las de
esta feature). Esto reemplaza la redacción anterior de esta nota, que pedía llamarlo a mano: sigue
siendo cierto que el array es estado compartido, pero ya no hay que acordarse de resetearlo.
`profiles.handlers.test.ts` conserva su propio `resetProfiles()` en un `beforeEach` local; con el
global ya corriendo, es un segundo reset inocuo, no un conflicto.

**Divergencias respecto a Figma, PRT-02.02 (CM-46).**

1. Tarjeta de «Autocompletar con IA»: el frame PRT-02.02 la dibuja habilitada y con una insignia
   «Recomendado». Se implementa deshabilitada, con la insignia «Próximamente», porque HU-2.6 a
   HU-2.10 son Sprint 2 (`CLAUDE.md` §12 abierta 7) y por la regla de autoridad de `CLAUDE.md` §16.
   El tratamiento visual se alinea con el de voz y video (D-04, D-05). Figma se actualiza después.
2. Texto de pie del frame PRT-02.02, omitido en esta implementación. El frame muestra, debajo de
   las dos tarjetas, esta frase literal: «Puedes combinar las dos: empezar manual y subir tu CV
   después, o al revés.» Se omite porque promete la carga de CV, que es HU-2.6 (Sprint 2) y no
   existe en Sprint 1; con la tarjeta de IA deshabilitada, el texto ofrecería al usuario una salida
   inexistente. Queda transcrito aquí para recuperarlo desde el repositorio cuando entre HU-2.6,
   sin volver a consultar Figma. Reescribirlo en vez de omitirlo sería inventar contenido de
   producto.
3. Cabecera de `AppShell` (layout compartido de `/inicio`, `/perfiles/nuevo` y
   `/perfiles/:id/roles`, no exclusivo de esta feature): el frame dibuja un logotipo compuesto de
   glifo vectorial + wordmark «cameia» (nodo `logo`, `121:184` en sm, `191:500` en lg). Se
   implementa solo el wordmark, en texto (`text-h3 font-extrabold`, el token de tipografía más
   cercano a los ~20px medidos en el frame lg — sin tracking negativo, que no tiene token): el
   glifo es un activo de marca vectorial que no existe todavía en `design-system`, y dibujarlo a
   mano sería inventarlo. Se completa cuando exista el SVG oficial, sin rehacer esta cabecera. El
   avatar y el menú de usuario del `nav-header` del frame lg también quedan fuera: son controles, y
   no existe todavía el flujo de cuenta ni de cierre de sesión.

**Divergencias respecto a Figma, PRT-02.03 (CM-53, verificadas 14-sep-2026 — nodos `140:960` lg /
`142:638` sm).**

1. **El armazón no es un asistente por pasos.** Corrige la lectura original de esta SPEC y de
   `docs/ARCHITECTURE.md` §2 (ver nota de §3): la página real tiene un índice de secciones
   (`step-list` vertical en `lg`, acordeón en `sm`) y una barra de acciones compartida entre las
   cuatro secciones, no un `Stepper` horizontal ni un botón por paso.
2. **«Guardar borrador» es `variant=secondary`, no primario.** El botón primario real (mostaza) es
   «Finalizar y Continuar», deshabilitado hasta cumplir los requisitos de las cuatro secciones —
   coherente con la regla R3 del propio archivo de Figma («un solo primario mostaza, nunca dos a la
   vez»). Ninguno de los dos botones lo construye CM-53 (ver nota de §3.2).
3. **Campo «Ubicación»**, dibujado en la sección Información General: no se construye — bloqueo
   C-10 (§8), el backlog no lo pide.
4. **Contador de `summary` en 600, no 2000**: se mantiene 2000 por decisión explícita (bloqueo
   C-11, §8) porque tres fuentes independientes (`GLOSSARY.md` §2, HU-2.5 del backlog 12-sep, el
   memo del PO del 11-sep) lo respaldan y solo el frame (sin actualizar desde entonces, como ya le
   pasó a la tarjeta de IA de PRT-02.02) dice 600.
5. **Confirmación visual de guardado (CA-2.3.1) sin frame que la respalde.** Ningún frame de
   PRT-02.03 revisado muestra un estado de éxito — solo el de «validación de campos». Se usa
   `AlertInline variant="success"` (decisión de Frontend, `CLAUDE.md` §16: el diseño lo fija
   Frontend cuando Figma no lo resuelve), consistente con el patrón de error ya usado en
   `ProfileMethodSelector`. Se revisa si aparece un frame de éxito más adelante.
6. **Verificado también en `sm` (`142:638`, no solo `lg`):** los campos de esta sección son
   idénticos en ambos breakpoints; el encabezado de sección ya escala solo (`text-h2` → 21px bajo
   599px, coincide con `text/h2-sm` de Figma). Hallazgo para quien arme el armazón: en `sm`,
   «Información General» aparece una sola vez, como encabezado del acordeón — no hay un `<h2>`
   duplicado dentro del contenido expandido, a diferencia de `lg`, donde el título vive dentro del
   contenido y el índice lateral usa una etiqueta aparte (14px). Ver el TSDoc de cabecera de
   `GeneralInfoForm.tsx` para el detalle completo.

**Notas técnicas de esta implementación (no son divergencias de diseño).**

4. `NewProfilePage.tsx` tipa `{ id: string }` en el propio archivo de la página en vez de crear ya
   `api/*.dto.ts` — `CLAUDE.md` §8 deja esa capa para el final de una feature, y el contrato real
   todavía tiene bloqueos abiertos (C-01, C-02). Es deuda consciente hasta que exista `api/`.
5. La misma petición (`POST /api/v1/profiles`) no envía la cabecera `X-User-Id` que la respuesta
   del PO menciona para HU-2.2 (§8, C-02): funciona contra el mock (que no la exige), no
   necesariamente contra el backend real cuando exista.
6. `src/features/professional-profile/routes.tsx` mueve `/perfiles/nuevo` de
   `professionalProfileWizardRoutes` a `professionalProfileShellRoutes` para que se anide bajo
   `AppShell` — la pantalla no tiene stepper ni botón primario, así que no encaja en
   `WizardLayout`. `NewProfilePage.test.tsx` no puede probar que `RequireAuth` la sigue protegiendo
   tras la mudanza: `features` no puede importar `app/router/guards/RequireAuth`
   (`docs/ARCHITECTURE.md` §4). Esa cobertura vive en `src/app/router/index.test.tsx`, que monta el
   árbol de rutas real y sí puede importar cualquier cosa (capa `app`).
7. Carve-out de fronteras: `eslint.config.js` añade un elemento `app-routes`
   (`src/app/router/routes.ts`, con `mode: 'file'`) para que `features` y `layouts` puedan importar
   `ROUTES` sin ganar acceso al resto de `app`. No documentado todavía en `docs/ARCHITECTURE.md`
   §4 — se reporta en el PR, se decide aparte si esa matriz documentada se actualiza.
8. Colisión de identificadores: `CA-2.2.1` a `CA-2.2.3` en §3.2, §4 y §6 (sin tocar en este commit)
   citan el backlog del 6-sep, donde esos ids son la validación de `name` (1-120 caracteres). §3.1
   ahora cita `CA-2.2.1` a `CA-2.2.4` del backlog del 12-sep, donde los mismos ids son la elección
   de ruta manual/IA y el rechazo por cupo — un tema distinto. No es un error de trascripción: son
   dos backlogs distintos que reutilizan la misma numeración. Se resuelve cuando §4, §6 y §8 se
   reescriban con el contrato de backend en la mano (fuera del alcance autorizado para este
   commit).
9. `GET /api/v1/profiles/:id` (CM-53) se agrega a los mocks porque §3.2 ya lo daba por hecho como
   estado de carga y el endpoint no existía — deuda cerrada, no una divergencia nueva.
10. `summaryProvenance`/`summaryProvenanceOrigin` (CM-53) se añaden al contrato de mocks para que
    CA-2.3.1, CA-2.3.2 y CA-2.3.4 sean demostrables. Su lógica de transición vive en
    `profiles.handlers.ts`, no en el cliente; se revisa cuando exista el contrato real (C-01).
11. **Revertido (14-sep-2026):** CM-53 había agregado a `WizardLayout` la prop opcional
    `primaryActionFormId` y cableado `EditProfilePage.tsx` sobre esa plantilla con
    `GeneralInfoForm` ya insertado. Al verificar el frame real de PRT-02.03 en Figma resultó que
    esta pantalla no usa `WizardLayout` — se revirtieron ambos cambios
    (`docs/bitacora-ia/hallazgo-figma-no-revisado-cm53.md`). `GeneralInfoForm` (§3.2) se conserva,
    reescrito para la fidelidad real del frame; `WizardLayout.tsx` y `EditProfilePage.tsx` quedan
    exactamente como estaban en `develop` antes de CM-53.

**Divergencias conscientes, registradas sin corregirlas (fuera del alcance de este archivo):**

1. `GLOSSARY.md` línea 38 dice `name (≤ 255)`; esta spec usa 120 porque es lo que respalda el
   backlog (CA-2.2.1 a CA-2.2.3). El 255 viene del memo del PO del 11-sep sin fuente verificada
   (C-01) — manda el backlog.
2. `src/i18n/locales/es-CO/profile.json` todavía dice `"habilidades.titulo": "Habilidades y
expectativas"`, pese a que D-02 retiró las expectativas del alcance. Ese mismo archivo conserva,
sin tocar en CM-53, la sección huérfana `informacionGeneral.campos` (`nombreCompleto`,
`fechaNacimiento`, `ciudad`) que no corresponde a ningún campo del contrato de Perfil Profesional
— deuda preexistente de CM-100, fuera del diff autorizado de esta subtarea.

Ninguna de las dos se corrige en este commit: corregirlas es tocar `GLOSSARY.md` o `profile.json`
más allá de lo que esta spec necesita.
