---
feature: professional-profile
estado: EN_CURSO
hu: [HU-2.2, HU-2.3, HU-2.4, HU-2.5, HU-2.11]
prt: [PRT-02.02, PRT-02.03, PRT-02.07]
jira: [CM-46, CM-53, CM-61, CM-65, CM-69]
rutas: [/perfiles/nuevo, /perfiles/:id/editar, /perfiles/:id/roles]
documentacion: tsdoc-es
backlog: 12092026_01
decisiones: [10092026_v1, 11092026_v2, 11092026_v1, 13092026_v1]
figma: Cameia · Mockups MVP
revisado: 2026-09-15
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
- Habilidades (texto libre + nivel) y finalizar (PRT-02.03, HU-2.5) — ver §3.4, todavía sin construir.
- Roles Objetivo: consultar, agregar, sustituir y eliminar, de catálogo cerrado, sin prioridad ni
  reordenamiento (HU-2.11, D-01, J-03) — ver §3.5. **Ya no bloqueada**: el PO autorizó construir la
  gestión manual sin esperar la respuesta completa de C-04 (HU-2.10 sigue viva para Sprint 2, pero
  ya no condiciona esta subtarea — decisión H, §9).

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
de un asistente**: son las cuatro secciones que dibuja el frame (Información General, Formación
académica, Experiencia Laboral, Expectativas Profesionales) de **una sola página** en
`/perfiles/:id/editar`, verificado contra el prototipo real de Figma en CM-53 (nodos `140:960` lg /
`142:638` sm) y otra vez en CM-61 (nodos `132:173` lg / `142:638` sm de
`PRT-02.03 · Formulario de Perfil Profesional`). **El índice de secciones y la barra de acciones
compartida ya tienen dueño: CM-61 los construye** (`ProfileSectionsLayout`, `ProfileActionsBar`) —
antes de esta subtarea, ninguna otra los poseía. El índice listaba 3 secciones en CM-61
(Información General, Formación académica, Experiencia Laboral); CM-69 agrega la cuarta, **Roles
Objetivo** (§3.5) — sigue sin el quinto requisito, Habilidades (CM-65). «Expectativas Profesionales»
**no se construye ni se lista**: está fuera del MVP (D-02) y el backlog manda sobre el diseño en
comportamiento (`CLAUDE.md` §16) — ver decisión D-D en §9. `StepList` (desktop, ≥600px) / acordeón
con `useDisclosure` (móvil, <600px) alternan por `useMediaQuery(DESKTOP_MEDIA_QUERY)`, resuelto una
sola vez en `EditProfilePage`. La barra de acciones tiene una `progress-bar` de completitud del
perfil (`max=5`, los 5 requisitos reales de finalización; CM-61 solo podía calcular 3, CM-69 suma el
cuarto — ver decisión D-D) y dos botones: «Guardar borrador» (`variant=secondary`, envía únicamente
`GeneralInfoForm` por el atributo HTML `form` — decisión D-C) y «Finalizar y Continuar»
(`variant=primary`, **sigue siempre deshabilitado**: su validación real de 5 requisitos y su
endpoint de finalización son de CM-65, que esta subtarea tampoco construye — CM-69 solo hace que
`getCompletenessValue` cuente el cuarto requisito). Antes de la verificación de CM-53,
`docs/ARCHITECTURE.md` §2, el TSDoc de `WizardLayout.tsx` y una versión anterior de esta misma
sección citaban un asistente paginado que el frame real no tiene — ya corregido en los tres lugares
(`docs/bitacora-ia/hallazgo-figma-no-revisado-cm53.md`). **§3.4 abajo (CM-65, todavía sin construir)
conserva el lenguaje de «paso 3» heredado de ese mismo error, sin verificar** — no se reescribe aquí
por no ser el alcance de CM-69; quien abra CM-65 debe releerla contra Figma antes de darla por
buena.

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
- **CM-53 entregó el organismo `GeneralInfoForm`; CM-61 lo inserta en la página real**, dentro de
  `ProfileSectionsLayout` junto a Formación académica y Experiencia Laboral, con la barra de
  acciones compartida debajo (§3). `EditProfilePage.tsx` ya no es el placeholder de `EmptyState` —
  ver §7. Los estados de la tabla de abajo son ahora comportamiento implementado, no previsto.
- **No incluye el campo «Ubicación»** que el frame sí dibuja en esta sección: ningún CA de HU-2.3 lo
  menciona, no existe en `GLOSSARY.md` ni en el contrato — bloqueo **C-10** (§8), sin resolver.

**Estados**

| Estado      | Qué muestra                                                                           |
| ----------- | ------------------------------------------------------------------------------------- |
| Carga       | `Spinner` mientras se obtiene el perfil por `id` antes de mostrar el formulario       |
| Vacío       | No aplica: el perfil siempre existe en este punto (se creó en el método de configuración) |
| Error       | Perfil inexistente → `errors:codigos.NOT_FOUND`; cualquier otro `ApiError` → `errors:generico`; fallo de red real (no `ApiError`) → `errors:red`, con botón «Reintentar» |
| Sin permiso | Ver nota transversal arriba                                                           |

**Validaciones del lado del cliente**

- `name`: vacío o mayor a 255 caracteres bloquea sin llamar al servidor (CA-2.2.1 a CA-2.2.3,
  límite confirmado por la respuesta oficial del PO del 13-sep — ver §8, C-01). Llave
  de error: `errors:codigos.PROFILE_NAME_INVALID` (ver §4).
- `summary`: más de 2000 caracteres bloquea sin llamar al servidor (`maxLength` del campo) y muestra
  el contador de caracteres restantes (CA-2.3.3, `GLOSSARY.md` §2). El frame de Figma muestra el
  contador en 600, no 2000 — se mantiene 2000 por decisión explícita (bloqueo **C-11**, §8).

### 3.3 · `/perfiles/:id/editar` — Formación académica y Experiencia Laboral · `PRT-02.03` · CM-61

Verificado en vivo contra Figma (CLAUDE.md §13): nodo `132:2467` (Formación académica) y `132:2503`
(Experiencia Laboral) en `lg`; `142:670`/`142:675` en el acordeón `sm`. Fuente de comportamiento:
memo del PO del 11-sep (J-01, «gestión por ítem POST/DELETE, puedes trabajar ambas secciones desde
ya») y el backend real de `cameia-perfil` (`ProfileController.java`, `WorkExperience.java`,
`Education.java`), compartido en la sesión que construyó este ticket — Jira (CM-18/CM-61) no tiene
CA escritos.

**Qué hace**

- Gestiona Experiencia laboral (opcional) y Formación académica (obligatoria para poder finalizar,
  HU-2.4) **por ítem**: cada alta es un `POST` inmediato, cada baja un `DELETE` inmediato — nunca un
  `PATCH` de colección (J-01; SPEC.md §9, decisión D-A). Ningún ítem tiene "borrador": se persiste
  al agregarlo.
- **Formación académica** (`EducationSection`): Nivel educativo (`<Select>`, enum real
  `TECHNICAL`/`UNDERGRADUATE`/`POSTGRADUATE`), Título obtenido, Institución, Fecha de inicio, Año de
  finalización (oculto si «En curso»), checkbox «En curso». «Campo de estudio» y «Fecha de inicio»
  **no están dibujados en el frame** pero el backend real los exige (`fieldOfStudy` no obligatorio,
  `startDate` sí) — se agregan, bloqueo **C-12** (§8).
- **Experiencia Laboral** (`WorkExperienceSection`): Cargo, Empresa, Fecha de inicio, Fecha de fin
  (oculta si cualquiera de los dos checkboxes está marcado), checkbox «Trabajo aquí actualmente»,
  checkbox «No recuerdo la fecha exacta de finalización» (mutuamente excluyentes entre sí),
  Descripción de funciones. `employmentStatus` (`CURRENT`/`UNKNOWN_END`/`ENDED`, el enum real del
  backend) **nunca es un campo del formulario**: se deriva de los dos checkboxes en
  `profile.mapper.ts` (SPEC.md §9, decisión D-F) — el organismo no conoce el contrato.
- Fechas: el backend real almacena `java.time.YearMonth` (`"YYYY-MM"`, sin día) para ambas
  entidades. Se usa `<Input type="date">` (selector nativo completo, fiel al frame) y se trunca el
  día al enviar (`model/yearMonth.ts`) — bloqueo **C-14** (§8).

**Estados**

| Estado      | Qué muestra                                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Carga       | Comparte el `Spinner` de §3.2: ambas secciones llegan en la misma respuesta de `GET /api/v1/profiles/:id` |
| Vacío       | `EmptyState` propio por sección: ambas listas pueden estar vacías — experiencia sin ítems es válido; educación sin ítems bloquea la finalización (CM-65), no esta pantalla |
| Error       | Alta/baja fallida → código específico si `errors:codigos` lo reconoce (`WORK_EXPERIENCE_DATE_INVALID`/`EDUCATION_DATE_INVALID`), si no el genérico de la sección; el formulario conserva lo escrito para reintentar |
| Sin permiso | Ver nota transversal arriba                                                                                                               |

**Validaciones del lado del cliente**

- Educación: nivel/título/institución/fecha de inicio obligatorios; «En curso» oculta y limpia la
  fecha de finalización; fecha de fin anterior a la de inicio bloquea (salvaguarda de UX — el
  backend real, `Education.java`, no exige esta regla, a diferencia de Experiencia Laboral).
- Experiencia Laboral: cargo/empresa/fecha de inicio obligatorios; descripción ≤ 500 caracteres
  (`WorkExperience.MAX_TEXT_LENGTH` real — el frame dibuja un contador en 1000, bloqueo **C-13**,
  §8); sin ningún checkbox marcado, la fecha de fin es obligatoria y no puede ser anterior a la de
  inicio (`WorkExperience.java`, regla real); con cualquiera marcado, la fecha de fin no se pide.

### 3.4 · `/perfiles/:id/editar` — Habilidades y finalizar · `PRT-02.03` · CM-65

**Corrección heredada de §3 (CM-61, 14-sep-2026):** esta subsección decía «(paso 3)», lenguaje de
asistente por pasos que Figma nunca tuvo — se retira el rótulo. Sigue **sin construir**: quien abra
CM-65 debe releer esta subsección completa contra Figma antes de darla por buena, igual que hizo
CM-61 con §3.3. El resto del contenido no se reescribe: no es alcance de CM-61.

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

### 3.5 · `/perfiles/:id/editar` — Sección «Roles Objetivo» · `PRT-02.03` · CM-69

**Ya no bloqueada (decisión H, §9).** El PO autorizó construir la gestión manual completa dentro del
formulario sin esperar la respuesta final de C-04: HU-2.10 (sugerencia de roles por IA) sigue viva
para Sprint 2, pero ahora se integrará *dentro de este mismo formulario* cuando llegue, no en
`PRT-02.07`. Esa pantalla y su ruta (`ProfileRolesPage.tsx`, `/perfiles/:id/roles`) **no se tocan ni
se borran en este commit** — siguen existiendo como placeholder de `EmptyState`, tal como ya
describían `CLAUDE.md` §12 (abierta 10) y §17: se retiran solo si el PO confirma explícitamente que
esa integración futura no las necesita.

El Figma vinculado a esta tarea es guía visual desactualizada, no fuente de comportamiento ni de
diseño vinculante para esta subsección (instrucción explícita del PO): el patrón real que manda es
el ya construido por `EducationSection`/`WorkExperienceSection` (CM-61, §3.3), verificado en vivo
contra Figma en su momento.

**Qué hace**

- Gestiona Roles Objetivo **por ítem**, igual que Educación/Experiencia: cada alta es un `POST`
  inmediato, cada sustitución un `PATCH` inmediato, cada baja un `DELETE` inmediato — nunca un
  `PATCH` de colección (decisión D-A, extendida aquí a Roles Objetivo). Máximo 5 roles por perfil
  (`MAX_TARGET_ROLES`), solo del catálogo cerrado (`GET /api/v1/professional-roles`,
  `useProfessionalRolesQuery`): el usuario nunca escribe el nombre a mano (CA-2.11.7).
- **Agregar** (`TargetRolesSection`): reutiliza `design-system/molecules/Combobox` (construido en
  CM-61 anticipando exactamente este uso — su propio TSDoc ya decía «para roles objetivo, CM-69»).
  El catálogo ofrecido excluye los roles ya asociados al perfil; elegir una opción dispara el `POST`
  de inmediato. Al llegar al tope de 5, el selector se oculta y se muestra un aviso en su lugar.
- **Sustituir** (decisión H1, memo del PO del 13-sep C-05, confirmado por el código real de
  `ProfileController.java#updateTargetRole`): es una acción propia, un `PATCH` que conserva el `id`
  del Rol Objetivo — nunca "eliminar y agregar". Cada ítem de la lista tiene su propio control que
  revela un `Select` de un solo valor, acotado a los roles todavía no usados; elegir una opción
  dispara el `PATCH` de inmediato. El selector nunca ofrece un rol ya presente en otro ítem del
  mismo perfil (regla de cliente hoy; el backend real también la refuerza con `409`).
- **Eliminar**: bloqueado únicamente cuando es el último rol objetivo y el perfil ya está
  `COMPLETED` (CA-2.11.3, confirmado por `ProfileController.java#removeTargetRole`) — con el perfil
  todavía `IN_PROGRESS`, sí se puede quedar sin roles.
- Sin prioridad ni reordenamiento (J-03; CA-2.11.6 retirado).

**Estados**

| Estado      | Qué muestra                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| Carga       | Comparte el `Spinner` inicial de la página: bloquea el render hasta que `useProfileQuery` **y** `useProfessionalRolesQuery` resuelvan |
| Vacío       | `EmptyState` propio: sin roles asociados, invita a agregar el primero — no bloquea mostrar la pantalla, solo finalizar (CM-65) |
| Error       | Alta/sustitución/baja fallida → código específico si `errors:codigos` lo reconoce (`TARGET_ROLE_DUPLICATE`/`TARGET_ROLE_MAX_REACHED`/`TARGET_ROLE_LAST_CANNOT_REMOVE`), si no el genérico de la sección; fallo al cargar el catálogo comparte la pantalla de error inicial de la página |
| Sin permiso | Ver nota transversal arriba                                                                                |

**Validaciones del lado del cliente**

- No ofrecer en el selector (agregar o sustituir) un rol ya presente en el perfil — salvaguarda de
  UX; el backend real también lo rechaza con `409` (`TARGET_ROLE_DUPLICATE`).
- Ocultar el selector de alta al llegar a 5 roles — salvaguarda de UX; el backend real también lo
  rechaza con `422` (`TARGET_ROLE_MAX_REACHED`).
- Deshabilitar "Eliminar" en el único rol restante cuando el perfil es `COMPLETED` — salvaguarda de
  UX; el backend real también lo rechaza con `422` (`TARGET_ROLE_LAST_CANNOT_REMOVE`).

## 4. Contrato observable

**Campos y reglas**

| Campo            | Tipo                   | Regla                                                       | Origen                                |
| ---------------- | ---------------------- | ----------------------------------------------------------- | ------------------------------------- |
| `name`           | string                 | 1-255 caracteres                                            | CA-2.2.1 a CA-2.2.3, confirmado por la respuesta oficial del PO del 13-sep (C-01) |
| `summary`        | string                 | ≤ 2000 caracteres                                           | `GLOSSARY.md` §2                      |
| `workExperience` | `WorkExperienceItem[]` (`id`, `company`, `position`, `description \| null`, `startDate`, `endDate \| null`, `employmentStatus`, `provenance`) | Opcional; gestión por ítem (POST/DELETE); `endDate` obligatoria y ≥ `startDate` si `employmentStatus=ENDED`, prohibida en cualquier otro estado (`WorkExperience.java`, backend real) | HU-2.4, J-01, CM-61 |
| `education`      | `EducationItem[]` (`id`, `institution`, `degree`, `fieldOfStudy`, `level`, `startDate`, `endDate \| null`, `inProgress`, `provenance`) | Obligatorio ≥1 para finalizar; gestión por ítem (POST/DELETE); `level` del enum real; `endDate` prohibida si `inProgress=true` (`Education.java`, backend real); `fieldOfStudy` es el único campo NO obligatorio | HU-2.4, T-01, CM-61 |
| `skills`         | `SkillItem[]`          | Texto libre (`skillName`) + `level`; sin catálogo           | HU-2.5, T-01, D-01                    |
| `targetRoles`    | `TargetRoleItem[]` (`id`, `professionalRoleId`, `provenance`) | Catálogo cerrado; máximo 5 (`MAX_TARGET_ROLES`); sin duplicados; sin prioridad ni reordenamiento; gestión por ítem (POST/PATCH/DELETE); sustituir conserva el `id` del Rol Objetivo | HU-2.11, D-01, J-03, C-05, CM-69 |
| `summaryProvenance` | `'MANUAL' \| 'AI_SUGGESTED' \| 'AI_EDITED' \| null` | Lo calcula el backend/mock a partir del valor anterior; el cliente nunca lo envía en el `PATCH` | CA-2.3.1, CA-2.3.2, CA-2.3.4 |
| `summaryProvenanceOrigin` | `string \| null` | Se conserva solo en la transición `AI_SUGGESTED → AI_EDITED`; nulo en cualquier otro caso, incluida la creación manual | CA-2.3.2 |

**Estados y enumerados**

Estados del perfil: `IN_PROGRESS → COMPLETED`, transición única, sin `PENDING`. `IN_REVIEW` queda
fuera del flujo manual y en Sprint 1 ningún perfil lo alcanza. Ver `docs/GLOSSARY.md` §3, sin
repetir la tabla.

`EducationLevel` (`TECHNICAL`/`UNDERGRADUATE`/`POSTGRADUATE`) y `EmploymentStatus`
(`CURRENT`/`UNKNOWN_END`/`ENDED`) **ya están confirmados por el código real del backend** de
`cameia-perfil` (`EducationLevel.java`, `EmploymentStatus.java`), compartido en la sesión que
construyó CM-61 — no son un memo sin verificar. Los textos en español de `EducationLevel` siguen sin
aprobación formal del PO (**C-07**, valores propuestos: Técnico/Pregrado/Posgrado). Catálogo de
roles: ver `docs/GLOSSARY.md` §2 y `src/mocks/data/catalogs.ts` (`PROFESSIONAL_ROLES`, ahora también
expuesto por `GET /api/v1/professional-roles`, §5). `SkillLevel` sigue con valores sin confirmar en
el código de esta feature (**C-06**, no afectado por CM-69; lo cierra CM-65) — el memo del PO del
13-sep y el código real de `ProfileController.java` ya adelantan `BASIC`/`INTERMEDIATE`/`ADVANCED`,
pero esta feature todavía no modela `Skill`/`SkillLevel`.

**Errores que el usuario puede ver**

| Código                 | Cuándo ocurre                                      | Llave de i18n                                       |
| ---------------------- | -------------------------------------------------- | --------------------------------------------------- |
| `PROFILE_NAME_INVALID` | `name` vacío o mayor a 255 caracteres              | `errors:codigos.PROFILE_NAME_INVALID` — ya existe |
| `EDUCATION_REQUIRED`   | Finalizar sin al menos una formación académica     | `errors:codigos.EDUCATION_REQUIRED` — **a crear**   |
| `NOT_FOUND`            | Perfil inexistente o de otro usuario (ver nota §3) | `errors:codigos.NOT_FOUND` — ya existe              |
| `WORK_EXPERIENCE_DATE_INVALID` | Alta de experiencia con fechas inconsistentes (`ENDED` sin `endDate`, `endDate < startDate`, o `endDate` en un estado que no la admite) | `errors:codigos.WORK_EXPERIENCE_DATE_INVALID` — ya existe (CM-61) |
| `EDUCATION_DATE_INVALID` | Alta de educación con `inProgress=true` y `endDate` presente | `errors:codigos.EDUCATION_DATE_INVALID` — ya existe (CM-61) |
| `TARGET_ROLE_DUPLICATE` | Agregar o sustituir con un rol profesional ya presente en el perfil (case exacto: comparación por `id` de catálogo) | `errors:codigos.TARGET_ROLE_DUPLICATE` — ya existe (CM-69) |
| `TARGET_ROLE_MAX_REACHED` | Agregar un sexto rol objetivo | `errors:codigos.TARGET_ROLE_MAX_REACHED` — ya existe (CM-69) |
| `TARGET_ROLE_LAST_CANNOT_REMOVE` | Eliminar el único rol objetivo de un perfil ya `COMPLETED` | `errors:codigos.TARGET_ROLE_LAST_CANNOT_REMOVE` — ya existe (CM-69) |

`PROFILE_NAME_INVALID`, `EDUCATION_REQUIRED`, `WORK_EXPERIENCE_DATE_INVALID`,
`EDUCATION_DATE_INVALID` y los tres códigos de Roles Objetivo son códigos de mock, no confirmados
con backend — el backend real (`ApiExceptionHandler.java`) responde vía `ProblemDetail` (RFC 9457)
sin un `code` propio todavía en los que se conocen (`ProfileController.java` sí confirma los
**status HTTP** 404/409/422 de Roles Objetivo, solo no el `code` del cuerpo); pueden no coincidir
cuando exista el contrato real (C-01). `EDUCATION_REQUIRED` sigue sin llave de i18n — la agrega
CM-65, la subtarea dueña de la pantalla de finalizar.

## 5. Enlace HTTP · PROVISIONAL

**Estado del contrato:** provisional · fuente: `src/mocks/handlers/profiles.handlers.ts` (mocks,
sin OpenAPI; C-01 sin responder) · revisado el 11-sep-2026.

| Operación                | Método y ruta                        | Envía                                                                     | Recibe                                                                                |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Crear                    | `POST /api/v1/profiles`              | Body opcional; sin `name` crea vacío (memo 11-sep); con `name`, se valida | 201 `ProfileRecord` · 400 `PROFILE_NAME_INVALID`                                      |
| Obtener                  | `GET /api/v1/profiles/:id`           | Sin body                                                                  | 200 `ProfileRecord` · 404 `NOT_FOUND`                                                 |
| Actualizar información general | `PATCH /api/v1/profiles/:id`   | `name`/`summary` (CM-61: **ya no acepta** `workExperience`/`education` — gestión por ítem, ver abajo) | 200 `ProfileRecord` · 400 `PROFILE_NAME_INVALID` · 404 `NOT_FOUND`                    |
| Agregar experiencia laboral | `POST /api/v1/profiles/:id/work-experiences` | `AddWorkExperienceRequestDto` (real: `company`, `position`, `description`, `startDate`, `endDate`, `employmentStatus`, `provenance`) | 201 `ProfileRecord` · 400 `VALIDATION_ERROR` · 404 `NOT_FOUND` · 422 `WORK_EXPERIENCE_DATE_INVALID` |
| Eliminar experiencia laboral | `DELETE /api/v1/profiles/:id/work-experiences/:workExperienceId` | Sin body | 200 `ProfileRecord` · 404 `NOT_FOUND` |
| Agregar educación | `POST /api/v1/profiles/:id/educations` | `AddEducationRequestDto` (real: `institution`, `degree`, `fieldOfStudy`, `level`, `startDate`, `endDate`, `inProgress`, `provenance`) | 201 `ProfileRecord` · 400 `VALIDATION_ERROR` · 404 `NOT_FOUND` · 422 `EDUCATION_DATE_INVALID` |
| Eliminar educación | `DELETE /api/v1/profiles/:id/educations/:educationId` | Sin body | 200 `ProfileRecord` · 404 `NOT_FOUND` |
| Agregar rol objetivo | `POST /api/v1/profiles/:id/target-roles` | `AddTargetRoleRequestDto` (real: `professionalRoleId`, `provenance`) | 201 `ProfileRecord` · 400 `VALIDATION_ERROR` · 404 `NOT_FOUND` · 409 `TARGET_ROLE_DUPLICATE` · 422 `TARGET_ROLE_MAX_REACHED` |
| Sustituir rol objetivo | `PATCH /api/v1/profiles/:id/target-roles/:roleId` | `UpdateTargetRoleRequestDto` (real: `professionalRoleId`) | 200 `ProfileRecord` · 400 `VALIDATION_ERROR` · 404 `NOT_FOUND` · 409 `TARGET_ROLE_DUPLICATE` |
| Eliminar rol objetivo | `DELETE /api/v1/profiles/:id/target-roles/:roleId` | Sin body | 200 `ProfileRecord` · 404 `NOT_FOUND` · 422 `TARGET_ROLE_LAST_CANNOT_REMOVE` |
| Catálogo de roles profesionales | `GET /api/v1/professional-roles` | Sin body | 200 `ProfessionalRoleDto[]` |
| Finalizar                | `POST /api/v1/profiles/:id/finalize` | Sin body                                                                  | 200 `ProfileRecord` (status `COMPLETED`) · 422 `EDUCATION_REQUIRED` · 404 `NOT_FOUND` |
| Listar                   | `GET /api/v1/profiles`               | Sin body                                                                  | 200 `ProfileRecord[]`, filtrado por `ownerId`                                         |

Los 4 endpoints de experiencia/educación replican los DTO reales de `cameia-perfil`
(`AddWorkExperienceRequest.java`, `AddEducationRequest.java`, compartidos en la sesión que construyó
CM-61) — no son una referencia inventada como el resto de este enlace mientras C-01 sigue abierto.
`provenance` siempre viaja `'MANUAL'` en un alta manual (`MANUAL_PROVENANCE`,
`model/profile.constants.ts`).

Los 3 endpoints de Roles Objetivo y el catálogo de roles profesionales (CM-69) replican igual el
código real de `cameia-perfil` (`ProfileController.java#addTargetRole/updateTargetRole/removeTargetRole`,
`ProfessionalRoleController.java`), compartido en la sesión que construyó este ticket — mismo nivel
de confianza que los 4 anteriores, superior al resto de este enlace mientras C-01 sigue abierto.
**Hallazgo de esta sesión, relevante para CM-65 (bloqueo C-16, §8):** el endpoint real de
finalización no es `POST /api/v1/profiles/:id/finalize` (como lo simula la fila de arriba, heredada
de CM-61) sino `POST /api/v1/profiles/:id/completion` — confirmado por
`ProfileController.java#completeProfile`, que valida los 5 requisitos y devuelve 422 con
`missingRequirements` listando **todos** los incumplidos, nunca solo el primero. Existe además
`POST /api/v1/profiles/:id/review-requests` (transición a `IN_REVIEW`), que no aplica: `GLOSSARY.md`
§3 y `CLAUDE.md` §12 ya establecen que `IN_REVIEW` está fuera del flujo manual en Sprint 1. Este
ticket (CM-69) no renombra la fila de `finalize` de la tabla porque no es su alcance — lo hace CM-65.

El `PATCH` nunca recibe `provenance`: `profiles.handlers.ts` deriva
`summaryProvenance`/`summaryProvenanceOrigin` del valor almacenado y del nuevo `summary` (vaciar el
campo limpia los tres en conjunto — CA-2.3.4; editar un resumen `AI_SUGGESTED` lo pasa a
`AI_EDITED` conservando el origen — CA-2.3.2; cualquier otro caso queda en `MANUAL` con origen nulo
— CA-2.3.1). Es responsabilidad del backend real cuando exista (C-01); aquí la sostiene el mock
porque es la única capa contra la que corre el frontend mientras tanto (CM-53).

**Resuelto por CM-69:** ya existe endpoint de catálogo de roles (`GET /api/v1/professional-roles`,
tabla de arriba) — `src/mocks/data/catalogs.ts` sigue siendo el módulo de datos en memoria
(`PROFESSIONAL_ROLES`), pero ahora un handler HTTP dedicado
(`src/mocks/handlers/professionalRoles.handlers.ts`) lo expone, replicando el endpoint real ya
construido en Backend (`ProfessionalRoleController.java`, CM-23, T-01 cerrado para este catálogo
específico).

## 6. Criterios de aceptación

| Criterio                                                           | Qué hace el frontend que el criterio no dice                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| CA-2.2.1 a CA-2.2.3 (nombre 1-255)                                 | Bloquea sin llamar al servidor y repite la misma validación al guardar por `PATCH` (§4)                |
| CA-2.4.1 (experiencia `CURRENT`/`UNKNOWN_END` sin fecha de fin)   | Oculta y limpia el campo «Fecha de fin» cuando cualquiera de los dos checkboxes está marcado, en vez de solo omitir el envío |
| J-01 (gestión por ítem, no PATCH de colección)                    | `POST`/`DELETE` inmediato por ítem; sin `useFieldArray` — la lista visible es siempre la caché del servidor (SPEC.md §9, decisión D-A) |
| HU-2.4 (educación obligatoria)                                     | Hoy solo se cumple visualmente en la barra de completitud (§3): el bloqueo real del botón «Finalizar» es de CM-65, que valida los 5 requisitos |
| HU-2.5 (verificar ≥1 rol objetivo)                                 | Todavía no aplica: CM-65 (dueña del botón «Finalizar») es quien redirige o bloquea cuando no hay ningún rol — CM-69 solo construye la sección en sí |
| HU-2.11, D-01, J-03 (roles: catálogo, sin prioridad ni reorden)    | El formulario nunca ofrece una acción de reordenar ni un campo de prioridad; `TargetRolesSection` no tiene drag-and-drop ni input numérico de orden |
| C-05 (sustituir es un `PATCH` real, conserva el `id`)              | `useSubstituteTargetRole` llama al `PATCH` por ítem; nunca compone un `DELETE` + `POST`                |
| CA-2.11.3 (bloqueo del último rol solo en `COMPLETED`)             | `TargetRolesSection` deshabilita "Eliminar" solo cuando `items.length === 1` y `isProfileCompleted`; con `IN_PROGRESS` sí se permite quedar sin roles |
| CA-2.11.7 (solo roles del catálogo)                                | El selector (`Combobox`/`Select`) no admite texto libre, solo selección de `PROFESSIONAL_ROLES` vía `useProfessionalRolesQuery` |
| CA-2.11.6 (reordenamiento/prioridad)                               | Retirado (D-01); no se implementa                                                                      |

## 7. Estado de implementación

| Archivo                                                                                        | Qué implementa                                                                                                              | Prueba                                                                                              |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/mocks/handlers/profiles.handlers.ts`                                                       | Infraestructura de apoyo: ciclo completo de mocks del perfil; deriva `summaryProvenance`/`summaryProvenanceOrigin` en el `PATCH` (CA-2.3.1/2/4); CM-61 agrega 4 handlers por ítem (POST/DELETE de experiencia y educación) con las reglas reales de `WorkExperience.java`/`Education.java`; CM-69 agrega 3 handlers por ítem de Roles Objetivo (POST/PATCH/DELETE) con las reglas reales de `ProfileController.java`, reemplazando el `PATCH` masivo de `targetRoleIds` que solo existía por no conocer el contrato | `src/mocks/handlers/profiles.handlers.test.ts`                                                     |
| `src/mocks/handlers/professionalRoles.handlers.ts`                                              | CM-69: simula el catálogo real de roles TI vía GET (ver §5), a partir de `src/mocks/data/catalogs.ts` | `src/mocks/handlers/professionalRoles.handlers.test.ts`                                             |
| `src/features/professional-profile/organisms/ProfileMethodSelector/ProfileMethodSelector.tsx`  | §3.1 (CM-46): las dos tarjetas excluyentes y la guarda contra doble creación mientras la mutación está en curso            | `src/features/professional-profile/organisms/ProfileMethodSelector/ProfileMethodSelector.test.tsx` |
| `src/features/professional-profile/pages/NewProfilePage.tsx`                                    | §3.1: la ruta «/perfiles/nuevo» — crea el perfil sin cuerpo al elegir «Llenado Manual» y navega al formulario con el id devuelto | `src/features/professional-profile/pages/NewProfilePage.test.tsx`                            |
| `src/features/professional-profile/model/profile.constants.ts`                                  | §3.2/§3.3/§3.5: límites y constantes de negocio; CM-61 agrega `DESCRIPTION_MAX_LENGTH`, `EDUCATION_LEVELS`, `MANUAL_PROVENANCE`, `PROFILE_COMPLETENESS_MAX`, ids de formulario, `DESKTOP_MEDIA_QUERY`; CM-69 agrega `MAX_TARGET_ROLES` | cubierto por las pruebas de los organismos y `EditProfilePage`                                    |
| `src/features/professional-profile/model/profile.types.ts`                                      | §3.2/§3.3/§3.5: tipos de dominio; CM-61 agrega `EducationItem`, `WorkExperienceItem`, `EducationLevel`, `EmploymentStatus`, `DataProvenance`, `YearMonth` (valores confirmados contra el backend real); CM-69 agrega `ProfessionalRole`, `TargetRoleItem` (mismo nivel de confianza) | cubierto por las pruebas de los organismos y `EditProfilePage`                                    |
| `src/features/professional-profile/model/yearMonth.ts`                                          | §3.3 (CM-61): `toYearMonth`/`formatYearMonth` — trunca la fecha del selector nativo a `YearMonth` (bloqueo C-14)            | `src/features/professional-profile/model/yearMonth.test.ts`                                          |
| `src/features/professional-profile/model/profileCompleteness.ts`                                | §3 (CM-61): `getSectionStatuses`/`getCompletenessValue` para el índice de secciones y la barra de completitud (decisión D-D); CM-69 suma el cuarto requisito (≥1 rol objetivo) y la sección `target-roles` al índice | `src/features/professional-profile/model/profileCompleteness.test.ts`                                |
| `src/features/professional-profile/schemas/generalInfo.schema.ts`                                | §3.2 (CM-53): validación zod de `name`/`summary`, sin mensajes de texto (CLAUDE.md §3.2)                                   | `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.test.tsx`             |
| `src/features/professional-profile/schemas/education.schema.ts`                                 | §3.3 (CM-61): validación zod de un ítem de Formación académica, con `.superRefine` para "en curso" y fecha de fin           | `src/features/professional-profile/organisms/EducationSection/EducationSection.test.tsx`             |
| `src/features/professional-profile/schemas/workExperience.schema.ts`                             | §3.3 (CM-61): validación zod de un ítem de Experiencia Laboral, con `.superRefine` para los checkboxes excluyentes          | `src/features/professional-profile/organisms/WorkExperienceSection/WorkExperienceSection.test.tsx`   |
| `src/design-system/atoms/Select/Select.tsx`                                                     | Átomo nuevo (SPEC.md §9, decisión D-B): `<select>` nativo con la misma API que `Input`, para "Nivel educativo" — primer átomo nuevo del design system desde CM-100 | `src/design-system/atoms/Select/Select.test.tsx`                                                     |
| `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.tsx`                | §3.2 (CM-53): el formulario de Información General; CM-61 agrega `showSectionTitle` (decisión D-G)                         | `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.test.tsx`             |
| `src/features/professional-profile/organisms/EducationSection/EducationSection.tsx`              | §3.3 (CM-61): lista + alta/baja de Formación académica por ítem                                                             | `src/features/professional-profile/organisms/EducationSection/EducationSection.test.tsx`             |
| `src/features/professional-profile/organisms/WorkExperienceSection/WorkExperienceSection.tsx`    | §3.3 (CM-61): lista + alta/baja de Experiencia Laboral por ítem; deriva `employmentStatus` en la UI (checkboxes excluyentes) | `src/features/professional-profile/organisms/WorkExperienceSection/WorkExperienceSection.test.tsx`   |
| `src/features/professional-profile/organisms/ProfileSectionsLayout/ProfileSectionsLayout.tsx`    | §3 (CM-61): índice de secciones — `StepList` en desktop, acordeón (`useDisclosure` por ítem) en móvil                       | `src/features/professional-profile/organisms/ProfileSectionsLayout/ProfileSectionsLayout.test.tsx`   |
| `src/features/professional-profile/organisms/ProfileActionsBar/ProfileActionsBar.tsx`            | §3 (CM-61): barra de acciones compartida — completitud, «Guardar borrador», «Finalizar y Continuar» (siempre deshabilitado hoy) | `src/features/professional-profile/organisms/ProfileActionsBar/ProfileActionsBar.test.tsx`           |
| `src/features/professional-profile/organisms/TargetRolesSection/TargetRolesSection.tsx`          | §3.5 (CM-69): lista + alta/sustitución/baja de Roles Objetivo por ítem; reutiliza `Combobox` (alta) y `Select` (sustitución), sin átomo nuevo | `src/features/professional-profile/organisms/TargetRolesSection/TargetRolesSection.test.tsx`         |
| `src/features/professional-profile/api/profile.dto.ts`                                          | §3.2/§3.3/§3.5: forma cruda del `ProfileRecord`; CM-61 agrega `EducationDto`, `WorkExperienceDto` y los dos `Add*RequestDto` (campos reales del backend); CM-69 agrega `TargetRoleDto`, `AddTargetRoleRequestDto`, `UpdateTargetRoleRequestDto` (campos reales) y `ProfessionalRoleDto` (forma exacta sin confirmar) | cubierto por los hooks de datos (integración vía MSW)                                                |
| `src/features/professional-profile/api/profile.mapper.ts`                                       | §3.2/§3.3/§3.5: `ProfileDto → Profile`; CM-61 agrega `toAddEducationRequest`/`toAddWorkExperienceRequest` (deriva `employmentStatus`, trunca fecha — decisión D-F); CM-69 agrega `toProfessionalRole`, `toAddTargetRoleRequest`, `toUpdateTargetRoleRequest` (sin derivación real, solo fijan `MANUAL_PROVENANCE`) | `src/features/professional-profile/api/profile.mapper.test.ts`                                       |
| `src/features/professional-profile/api/profile.api.ts`                                          | §3.2/§3.3/§3.5: `fetchProfile`/`updateGeneralInfo`; CM-61 agrega `addEducation`/`removeEducation`/`addWorkExperience`/`removeWorkExperience`; CM-69 agrega `addTargetRole`/`substituteTargetRole`/`removeTargetRole`/`fetchProfessionalRoles` | cubierto por los hooks de datos (integración vía MSW)                                                |
| `src/features/professional-profile/hooks/useProfileQuery.ts`                                    | §3.2 (CM-53): `useQuery` del perfil por id, consumido por `EditProfilePage` desde CM-61                                    | `src/features/professional-profile/hooks/useProfileQuery.test.tsx`                                   |
| `src/features/professional-profile/hooks/useUpdateProfileGeneralInfo.ts`                        | §3.2 (CM-53): `useMutation` del guardado, escribe la respuesta directo en la caché de `useProfileQuery`                     | `src/features/professional-profile/hooks/useUpdateProfileGeneralInfo.test.tsx`                       |
| `src/features/professional-profile/hooks/useAddEducation.ts`                                    | §3.3 (CM-61): `useMutation` de alta de educación, mismo patrón de caché que `useUpdateProfileGeneralInfo`                   | `src/features/professional-profile/hooks/useAddEducation.test.tsx`                                   |
| `src/features/professional-profile/hooks/useRemoveEducation.ts`                                 | §3.3 (CM-61): `useMutation` de baja de educación                                                                            | `src/features/professional-profile/hooks/useRemoveEducation.test.tsx`                                |
| `src/features/professional-profile/hooks/useAddWorkExperience.ts`                                | §3.3 (CM-61): `useMutation` de alta de experiencia laboral                                                                  | `src/features/professional-profile/hooks/useAddWorkExperience.test.tsx`                              |
| `src/features/professional-profile/hooks/useRemoveWorkExperience.ts`                             | §3.3 (CM-61): `useMutation` de baja de experiencia laboral                                                                  | `src/features/professional-profile/hooks/useRemoveWorkExperience.test.tsx`                           |
| `src/features/professional-profile/hooks/useAddTargetRole.ts`                                    | §3.5 (CM-69): `useMutation` de alta de rol objetivo                                                                         | `src/features/professional-profile/hooks/useAddTargetRole.test.tsx`                                  |
| `src/features/professional-profile/hooks/useSubstituteTargetRole.ts`                             | §3.5 (CM-69): `useMutation` de sustitución de rol objetivo (`PATCH`, conserva el `id`)                                      | `src/features/professional-profile/hooks/useSubstituteTargetRole.test.tsx`                           |
| `src/features/professional-profile/hooks/useRemoveTargetRole.ts`                                 | §3.5 (CM-69): `useMutation` de baja de rol objetivo                                                                         | `src/features/professional-profile/hooks/useRemoveTargetRole.test.tsx`                               |
| `src/features/professional-profile/hooks/useProfessionalRolesQuery.ts`                           | §3.5 (CM-69): `useQuery` del catálogo cerrado de roles TI, llave `['professional-roles']`                                   | `src/features/professional-profile/hooks/useProfessionalRolesQuery.test.tsx`                         |
| `src/features/professional-profile/pages/EditProfilePage.tsx`                                   | §3, §3.2, §3.3, §3.5 (CM-61/CM-69): el armazón real de la ruta de edición del perfil — ya no `WizardLayout`/`EmptyState`; CM-69 agrega la cuarta sección y el estado de carga/error del catálogo | `src/features/professional-profile/pages/EditProfilePage.test.tsx`                                   |
| `src/features/professional-profile/routes.tsx`                                                  | Mapea las 3 rutas de esta feature bajo `professionalProfileShellRoutes`, incluida la de edición del perfil (CM-61 la muda desde `professionalProfileWizardRoutes`, retirada — decisión D-E) | `src/app/router/index.test.tsx` (features no puede importar RequireAuth, ver §9)                    |
| `src/utils/buttonLoadingProps.ts`                                                                | Infraestructura de apoyo (CM-61): arma el par `{loading, loadingLabel}` que `Button` exige, evitando repetir el condicional en 5 sitios | `src/utils/buttonLoadingProps.test.ts`                                                                |
| `src/test/setup.ts`                                                                              | Infraestructura de apoyo: reinicia los mocks antes de cada prueba; CM-61 agrega el stub de `window.matchMedia` (ver §9)      | —                                                                        |
| `src/test/matchMedia.ts`                                                                         | Infraestructura de apoyo (CM-61): stub controlable de `window.matchMedia` — jsdom 30 no lo implementa (ver §9)              | cubierto indirectamente por `EditProfilePage.test.tsx` y `ProfileSectionsLayout.test.tsx`             |
| `src/test/msw.ts`                                                                                | Infraestructura de apoyo: instala handlers puntuales de MSW desde una prueba de feature, ver §9                             | —                                                                                                  |

`ProfileRolesPage.tsx` sigue siendo placeholder con `EmptyState` — deliberadamente sin tocar en
CM-69 (ver §3.5): la gestión real de Roles Objetivo ya vive dentro de `EditProfilePage`, pero esa
pantalla y su ruta se conservan hasta que el PO confirme que no las necesita para la futura
integración de HU-2.10 (Sprint 2). `WizardLayout.tsx` no cambia: conserva a `interview-setup` como
único consumidor.

## 8. Bloqueos

Enunciados citados de
`docs/decisiones/11092026_v1_consulta-contrato-y-alcance-perfil-profesional.md` (consulta de
seguimiento de Frontend a la respuesta del PO del 11-sep).

| Id   | Qué falta                                                                                                                                                                                                                                                                | De quién depende             | Desde                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------- |
| C-01 | ~~Fuente documentable de los campos y límites que cita la respuesta del 11-sep (`skillName`, `target-roles`, `inProgress`, `ProblemDetail`, `name ≤ 255`), ninguno presente en el backlog del 6-sep~~ — **parcialmente cerrado.** Respuesta oficial del PO del 13-sep (`docs/decisiones/13092026_v1_respuesta-oficial-frontend-C01-C09.md`, C-01) fija la fuente (código/OpenAPI de MicroPerfilPro, ya en `13092026_01_Backlog.xlsx`) y confirma `name ≤ 255` (aplicado en CM-61 este commit). El archivo `13092026_01_MicroPerfilPro_OpenAPI_actual.json` en sí no ha llegado a Frontend, así que los DTO siguen `PROVISIONAL` (§8 más abajo, §5) hasta tenerlo; `skillName`/`target-roles`/`inProgress` quedan documentados para CM-65/CM-69 | Backend                      | fuente confirmada 13-sep-2026; OpenAPI sin compartir |
| C-02 | Si la identidad por cabecera `X-User-Id` es temporal (con ticket y fecha de retiro) o el diseño definitivo; Frontend seguirá enviando el token de Firebase mientras no se aclare                                                                                         | Backend / Arquitectura       | sin respuesta del PO al 11-sep-2026 |
| C-03 | Si la pantalla de Selección de Método conserva el campo `name` (CA-2.2.1 a CA-2.2.3) y si crear el perfil en ese punto consume el cupo del plan gratuito antes de que el usuario guarde algo — no hay forma de descartar un perfil vacío, archivar es HU-2.12 (Sprint 3) | Product Owner                | sin respuesta del PO al 11-sep-2026 |
| C-04 | ~~Destino de HU-2.10 (sugerencia de roles con IA, Sprint 2) tras retirar `PRT-02.07`, la pantalla que usaba~~ — **parcialmente cerrado, 13-sep-2026.** El memo oficial del PO confirma que HU-2.10 no se elimina (sigue en Sprint 2) y que se integrará *dentro* del formulario de PRT-02.03 cuando llegue, no en una pantalla aparte; con eso ya no bloquea CM-69 (decisión H, §9). Sigue sin decisión explícita sobre si `ProfileRolesPage.tsx`/`/perfiles/:id/roles` se retiran cuando llegue esa integración — se conservan hasta entonces (`CLAUDE.md` §12 abierta 10) | Product Owner                | parcialmente resuelto 13-sep-2026    |
| C-05 | ~~Si CM-69 se mantiene como ticket propio para la sección de roles dentro del formulario o su alcance se absorbe en CM-65; si «sustituir» sigue siendo una acción distinta sin sugerencias de IA~~ — **cerrado, 13-sep-2026.** El memo oficial del PO confirma que CM-69 sigue siendo ticket propio, y que «sustituir» es un `PATCH` real que conserva el `id` del Rol Objetivo (nunca «eliminar y agregar») — confirmado además por el código real de `ProfileController.java#updateTargetRole`, compartido en la sesión que construyó CM-69 | Product Owner / Scrum Master | resuelto 13-sep-2026, CM-69          |
| C-06 | Valores de `SkillLevel`; criterio de duplicado con texto libre («Java» vs «java»); límite de caracteres por habilidad y máximo por perfil                                                                                                                                | Product Owner / Backend      | sin respuesta del PO al 11-sep-2026 (no afecta a CM-69; lo cierra CM-65) |
| C-07 | Si la lista `TECHNICAL`/`UNDERGRADUATE`/`POSTGRADUATE` (sin tecnólogo, agrupando especialización/maestría/doctorado) es intencional; textos en español a mostrar; confirmar que se pierde el estado «interrumpida» de una formación                                      | Product Owner                | sin respuesta del PO al 11-sep-2026 |
| C-09 | Origen documentable de `preferredModality` — cero ocurrencias en el backlog, `GLOSSARY.md` o los tres memos de decisiones; no se implementa hasta que exista                                                                                                             | Backend / Product Owner      | detectado 13-sep-2026, CM-53        |
| C-10 | El frame real de PRT-02.03 (nodo `140:960`/`142:638`) dibuja un campo «Ubicación» en la sección Información General que ningún CA de HU-2.3 menciona, que no está en `GLOSSARY.md` ni en el contrato de mocks — ¿entra a HU-2.3, es de otra HU, o el frame quedó desactualizado? No se construye hasta confirmar | Product Owner                | detectado 14-sep-2026, CM-53        |
| C-11 | El mismo frame muestra el contador de `summary` en «0 / 600 caracteres»; `GLOSSARY.md` §2, HU-2.5 (backlog 12-sep) y el memo del PO del 11-sep dicen 2000. CM-53 mantuvo 2000 por decisión explícita del usuario, pero uno de los dos artefactos (el frame o el glosario) está desactualizado y nadie lo ha corregido | Product Owner / Diseño       | detectado 14-sep-2026, CM-53        |
| C-12 | El frame de «Formación académica» (nodo `132:2467`) no dibuja «Campo de estudio» ni «Fecha de inicio», pero el backend real (`AddEducationRequest`/`Education.java`) exige `startDate` (obligatoria) y acepta `fieldOfStudy` (opcional, sin validar). Se agregan ambos campos al formulario porque el contrato real manda en comportamiento (CLAUDE.md §16) — ¿el frame quedó desactualizado, o el equipo de diseño decidió omitirlos a propósito? | Product Owner / Diseño       | detectado 14-sep-2026, CM-61        |
| C-13 | El contador de «Descripción de funciones» del frame muestra «0 / 1000 caracteres»; el backend real (`WorkExperience.MAX_TEXT_LENGTH`) limita a 500. Se usa 500 (el backend rechazaría cualquier valor mayor con un 422), mismo criterio que C-11 | Product Owner / Diseño       | detectado 14-sep-2026, CM-61        |
| C-14 | El backend real almacena `java.time.YearMonth` (`"YYYY-MM"`, sin día) para las fechas de experiencia y educación; el frame dibuja un selector `dd/mm/aaaa` completo. Se usa `<Input type="date">` (fiel al frame) y se trunca el día al enviar (`model/yearMonth.ts`) — el día que el usuario elige se descarta silenciosamente. ¿Debería el control pedir explícitamente solo mes/año? | Product Owner / Diseño       | detectado 14-sep-2026, CM-61        |
| C-15 | El frame usa un componente `select` (nodo `32:150`, confirmado real) para «Nivel educativo» y un ícono `calendar` en los campos de fecha; ninguno de los dos existía en `design-system` antes de CM-61. Se construyó el átomo `Select`; el ícono de calendario no hizo falta (`<input type="date">` nativo ya trae el suyo del navegador) — ¿debería `design-system/icons/registry.tsx` tener un `calendar` propio para otros usos futuros? | Diseño                        | detectado 14-sep-2026, CM-61        |
| C-16 | El endpoint real de finalización no es `POST /api/v1/profiles/:id/finalize` (como lo simulaba el mock desde CM-61) sino `POST /api/v1/profiles/:id/completion` — confirmado por `ProfileController.java#completeProfile` (compartido en la sesión que construyó CM-69, no en la que construyó CM-61). Existe además `POST /api/v1/profiles/:id/review-requests` (transición a `IN_REVIEW`), que no aplica en Sprint 1 (`GLOSSARY.md` §3). No se corrige en CM-69 por no ser su alcance — lo hace CM-65, dueña de la pantalla de finalizar (§5 ya lo anota) | Frontend (a resolver en CM-65) | detectado 15-sep-2026, CM-69        |

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

**Decisiones de diseño, PRT-02.03 (CM-61, verificadas 14-sep-2026 — nodos `132:173` lg /
`142:638` sm, `32:150` select, `189:1114` nav-header).**

- **D-A — Sin `useFieldArray`.** La colección visible (`items`) es estado de servidor (cada
  `POST`/`DELETE` devuelve el `ProfileResponse` completo), nunca duplicado dentro de `useForm`
  (`CLAUDE.md` §3.6). Cada organismo tiene: una lista que viene de props + un formulario de **un
  solo ítem** que se resetea cuando `items.length` crece.
- **D-B — Átomo nuevo `design-system/atoms/Select/`.** Verificado que `32:150` es un componente
  real de Figma con sus 5 estados (closed/open/selected/error/disabled), no una invención. Primer
  átomo nuevo del design system desde CM-100.
- **D-C — «Guardar borrador» solo envía `GeneralInfoForm`.** Experiencia y educación se persisten
  al vuelo por ítem; no tienen «borrador» que guardar.
- **D-D — `progress-bar` con `max=5` fijo, `value` = solo los 3 requisitos que CM-61 puede
  calcular** (nombre, resumen, ≥1 educación). Los otros 2 (habilidad, rol objetivo) los suma CM-65
  sin tocar la constante `PROFILE_COMPLETENESS_MAX`. Con `max=3` el usuario vería «3 de 3» junto a
  un botón «Finalizar» muerto — engañoso. El índice de secciones lista **solo 3 ítems**:
  «Expectativas Profesionales» no se construye (D-02) y por tanto no se incluye ni deshabilitada.
- **D-E — La ruta `/perfiles/:id/editar` se mudó a `professionalProfileShellRoutes`** (hereda
  `AppShell`): verificado que `189:1114` (`nav-header`) es el header real de la app en `lg`, no un
  armazón propio de esta pantalla. `professionalProfileWizardRoutes` quedó vacío y se retiró (ver
  nota técnica 12 abajo).
- **D-F — Fechas y `employmentStatus` se derivan en el mapper.** El formulario de Experiencia
  Laboral guarda dos booleanos (`isCurrent`/`unknownEnd`, mutuamente excluyentes en la UI); la
  derivación a `CURRENT`/`UNKNOWN_END`/`ENDED` y el truncado a `YearMonth` ocurren en
  `profile.mapper.ts` — los organismos no conocen el contrato real.
- **D-G — `showSectionTitle?: boolean`** (default `true`) en `GeneralInfoForm` y los dos
  organismos nuevos: en el acordeón móvil el encabezado del disparador ya es el título; en
  desktop lo pinta el organismo. Resuelve la advertencia que ya documentaba el TSDoc de
  `GeneralInfoForm.tsx` desde CM-53.

**Decisiones de diseño, PRT-02.03 (CM-69, 15-sep-2026 — Figma desactualizado para esta subtarea,
guía visual únicamente, ver nota de §3.5).**

- **Decisión H — Ya no bloqueada por C-04.** El PO autorizó construir la gestión manual completa de
  Roles Objetivo dentro del formulario sin esperar la respuesta final de C-04: HU-2.10 sigue viva
  para Sprint 2 pero ya no condiciona esta subtarea, y `PRT-02.07`/`ProfileRolesPage.tsx` se
  conservan sin tocar (ver §3.5 y `CLAUDE.md` §12 abierta 10).
- **H1 — «Sustituir» es un `PATCH` real, nunca «eliminar y agregar».** Confirmado por el memo del PO
  del 13-sep (C-05) y por el código real de `ProfileController.java#updateTargetRole`: conserva el
  `id` del Rol Objetivo. `TargetRolesSection` le da su propio control por ítem (un `Select` de un
  solo valor), separado del selector de alta.
- **H2 — `targetRoles: TargetRoleItem[]` reemplaza el `targetRoleIds: string[]` que solo existía en
  el mock.** El backend real expone cada Rol Objetivo como su propio recurso con su propio `id`
  (necesario para `PATCH`/`DELETE` por id) — no un arreglo plano de ids de catálogo. `profile.dto.ts`,
  `profile.mapper.ts` y `profiles.handlers.ts` se actualizan juntos en este commit.
- **H3 — Gestión por ítem (POST/PATCH/DELETE), igual que Educación/Experiencia (decisión D-A).**
  Confirmado como el patrón real por `ProfileController.java`: nunca un `PATCH` de colección. Los
  mocks reemplazan el `PATCH` masivo de `targetRoleIds` que solo existía por no conocer el contrato.
- **H4 — Reutiliza `Combobox` para "agregar" sin construir ningún átomo nuevo.** `Combobox`
  (`design-system/molecules/Combobox`) ya fue construido en CM-61 anticipando este uso exacto (su
  propio TSDoc lo decía) y ya renderiza sus seleccionados como `Chip` removible. Se usa con
  `selected` siempre vacío (los roles persistidos se muestran en la lista propia del organismo, no
  como chips del combobox): elegir una opción dispara `onAdd` de inmediato, nunca "quitar" desde ese
  control.
- **H5 — Reutiliza `Select` (átomo de CM-61, decisión D-B) para "sustituir" por ítem**, acotado a los
  roles todavía no usados por el resto del perfil (más el propio, para poder cancelar sin cambiar
  nada). Ningún átomo/molécula nuevo de `design-system` fue necesario para esta subtarea.
- **H6 — `GET /api/v1/professional-roles` (catálogo) vive en un handler de mocks separado**
  (`professionalRoles.handlers.ts`), no dentro de `profiles.handlers.ts`: es un recurso propio, no
  un dato del perfil — mismo criterio que separar `auth.handlers.ts` de `profiles.handlers.ts`.

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
12. `professionalProfileWizardRoutes` (CM-61) se elimina de `routes.tsx` y del barril: al mudar
    `/perfiles/:id/editar` a `professionalProfileShellRoutes` (decisión D-E), quedó vacío — un
    `RouteObject[]` vacío es código muerto (`CLAUDE.md` §13). `app/router/index.tsx` y su test se
    actualizan en el mismo commit.
13. `src/test/setup.ts` instala un stub de `window.matchMedia` (`src/test/matchMedia.ts`), no
    implementado por jsdom 30: verificado ejecutando el entorno de pruebas directo, cualquier
    componente que llamara `useMediaQuery` (`ProfileSectionsLayout`, `EditProfilePage`) revienta
    con «matchMedia is not a function» sin él. Por defecto no coincide con ninguna media query
    (mobile-first); `setViewportMatches`/`resetViewportMatches` fuerzan y reinician el resultado
    por prueba.
14. `Button.loading` exige el literal `true` (obliga `loadingLabel` junto a él); cinco sitios
    nuevos necesitaban pasar un booleano en tiempo de ejecución (`mutation.isPending`). Se
    resolvió con `src/utils/buttonLoadingProps.ts`, que arma el par de props correcto, en vez de
    repetir el condicional cinco veces.
15. `EducationSection`/`WorkExperienceSection` usan `watch()` de react-hook-form (no un
    `<Controller>` aislado) para `inProgress`/`isCurrent`/`unknownEnd`: esos valores deciden si se
    renderiza OTRO campo (`endDate`), no solo el suyo propio. `eslint-plugin-react-hooks` avisa que
    React Compiler no puede memoizar `watch()` — informativo, no bloquea `pnpm lint` (documentado
    también en el propio código, junto a cada llamada).
16. `EditProfilePage.tsx` (CM-69) gatea el render inicial con `profileQuery.isPending ||
    professionalRolesQuery.isPending` (y el error, con el `||` equivalente): es la primera vez que
    esta página depende de una segunda petición además del perfil. El catálogo no tiene un
    `NOT_FOUND` propio, así que el mensaje de error prioriza `profileQuery.error` y solo cae al del
    catálogo si el perfil sí cargó pero el catálogo falló.
17. `TargetRolesSection` no usa `TARGET_ROLES_FORM_ID` ni ningún `<form>`: a diferencia de
    Educación/Experiencia (que sí tienen un formulario de alta con botón «Agregar»), aquí "agregar"
    es elegir una opción de `Combobox`, que dispara la mutación de inmediato — no hay nada que
    enviar por submit. Se evaluó agregar la constante de todos modos por paridad con las otras dos
    secciones, pero se descartó por ser código muerto (`CLAUDE.md` §13).

**Divergencias conscientes, registradas sin corregirlas (fuera del alcance de este archivo):**

1. ~~`GLOSSARY.md` línea 38 dice `name (≤ 255)`; esta spec usa 120...`~~ — **resuelta.** La
   respuesta oficial del PO del 13-sep (C-01) confirma `name ≤ 255` contra el código/OpenAPI real;
   `NAME_MAX_LENGTH` pasó de 120 a 255 en este mismo commit (`profile.constants.ts`,
   `profiles.handlers.ts`, `profile.json`, `GeneralInfoForm.test.tsx`). `GLOSSARY.md` línea 38 ya
   no diverge.
2. `src/i18n/locales/es-CO/profile.json` todavía dice `"habilidades.titulo": "Habilidades y
expectativas"`, pese a que D-02 retiró las expectativas del alcance. Ese mismo archivo conserva,
sin tocar en CM-53, la sección huérfana `informacionGeneral.campos` (`nombreCompleto`,
`fechaNacimiento`, `ciudad`) que no corresponde a ningún campo del contrato de Perfil Profesional
— deuda preexistente de CM-100, fuera del diff autorizado de esta subtarea.

Ninguna de las dos se corrige en este commit: corregirlas es tocar `GLOSSARY.md` o `profile.json`
más allá de lo que esta spec necesita.
