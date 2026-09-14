# Respuesta a la Solicitud de decisiones — Frontend, Sprint 1

- **Para:** Juan Diego Gómez Garcés — Frontend
- **De:** Product Owner / Scrum Master — CAMEIA
- **Asunto:** Respuesta a la "Solicitud de decisiones — Frontend, Sprint 1" (10-sep-2026)
- **Fecha:** 11 de septiembre de 2026
- **Referencia:** `10092026_v1_solicitud-decisiones-frontend-sprint-1.md`

---

> **Estado de estas decisiones:** las decisiones de abajo ya están tomadas a nivel de Producto, pero los cambios formales **todavía no se han reflejado en el backlog/Jira**. Durante hoy, en cuanto me sea posible, actualizaré el backlog y las referencias correspondientes para que la documentación quede sincronizada con estas decisiones. Por ahora, esta respuesta sirve como orientación escrita para que Frontend pueda avanzar sin esperar a que terminen esas correcciones administrativas.

---

## Mensaje

Juan Diego, gracias por la revisión. Fue útil y detectó **inconsistencias reales**: la mayoría provienen de que el backlog del 6 de septiembre conserva especificaciones de una versión anterior (preventiva), y de que el Backend evolucionó respecto al DDL histórico. No es un error de tu lectura; es una desincronización que ya identificamos y vamos a corregir en backlog y Jira para que historias, criterios y tickets reflejen las decisiones vigentes. Puedes empezar a construir con las respuestas de abajo aunque los ajustes formales de backlog lleguen después.

Marco general que ya podemos dar por cerrado y que afecta a varias preguntas: el perfil se crea **vacío** en `IN_PROGRESS` (sin `PENDING`), la finalización lleva **directo a `COMPLETED`**, los Roles Objetivo salen de **catálogo** (sin prioridad, sin reordenamiento, sin seniority), las Habilidades son **texto libre**, el `seniority` **sale** del contrato, y las **Expectativas/salario quedan fuera del MVP**. Enums en inglés; `name ≤ 255`, `summary ≤ 2000`.

---

## Tabla de respuestas

| ID   | Respuesta                                                                                                            | Quién           | Fecha       |
| ---- | -------------------------------------------------------------------------------------------------------------------- | --------------- | ----------- |
| D-01 | Gestión completa de Roles Objetivo dentro del formulario; catálogo, sin prioridad/reorden; `PRT-02.07` fuera del MVP | PO/SM           | 11-sep-2026 |
| D-02 | Expectativas fuera del MVP; no construir la sección                                                                  | PO/SM           | 11-sep-2026 |
| D-03 | Se incorporan HU de Landing y Tablero; no comprometer alcance hasta registrarlas                                     | PO/SM           | 11-sep-2026 |
| D-04 | Voz visible + deshabilitada + "Próximamente"; Texto preseleccionado                                                  | PO/SM           | 11-sep-2026 |
| D-05 | Video fuera del MVP; mostrar "Próximamente" deshabilitado (aprobado)                                                 | PO/SM           | 11-sep-2026 |
| J-01 | Aceptado; renombrar CM-61 (experiencia + educación)                                                                  | PO/SM           | 11-sep-2026 |
| J-02 | Renombrar CM-65 y CM-19 (quitar "Expectativas")                                                                      | PO/SM           | 11-sep-2026 |
| J-03 | Renombrar CM-69 (quitar "priorizar"; consultar/agregar/sustituir/eliminar)                                           | PO/SM           | 11-sep-2026 |
| J-04 | Renombrar CM-93 (pantalla de espera/error)                                                                           | PO/SM           | 11-sep-2026 |
| J-05 | Asignar títulos descriptivos a las subtareas sin nombre (trazabilidad)                                               | PO/SM           | 11-sep-2026 |
| J-06 | Sacar tickets de prueba del sprint (limpieza)                                                                        | PO/SM           | 11-sep-2026 |
| S-01 | Spike HU-4.1/CM-21 ya asignado a Vela; verificar fecha y dependencias CM-84/85/89                                    | PO/SM           | 11-sep-2026 |
| S-02 | Referencias de prototipos posiblemente desactualizadas; se revisan contra Figma                                      | PO/Diseño       | 11-sep-2026 |
| T-01 | Roles=catálogo (Backend confirma); habilidades=texto libre; niveles=enum                                             | PO/SM → Backend | 11-sep-2026 |
| T-02 | Crear `IN_PROGRESS`; finalizar `COMPLETED`; sin `PENDING`; `IN_REVIEW` fuera del flujo manual                        | PO/SM           | 11-sep-2026 |
| T-03 | Contrato lo confirma Backend; Frontend usa mock entre tanto                                                          | PO/SM → Backend | 11-sep-2026 |

## Decisiones de producto

### D-01 · Roles Objetivo

Decisión tomada: **los Roles Objetivo se gestionan completamente dentro del formulario del Perfil Profesional.** Las etiquetas representan los roles seleccionados, y desde ese mismo formulario el usuario podrá **agregar, sustituir y eliminar** roles. La **pantalla separada `PRT-02.07` deja de formar parte del flujo del MVP**. Los roles provienen de un catálogo controlado (el usuario no escribe el nombre a mano) y no hay prioridad ni reordenamiento. La especificación del backlog se corregirá para reflejar esta gestión integrada en el formulario.

### D-02 · Expectativas

Decisión tomada: **fuera del alcance funcional del MVP.** No construyas la sección de expectativas. Corregiremos los títulos de CM-65 y de la historia CM-19 para quitar "Expectativas". La disposición técnica de `salary-expectation` (retirar o dejar dormido) la resuelve Backend, pero **esto no bloquea** la construcción del Perfil Profesional del Sprint 1.

### D-03 · Landing y Tablero

Tienes razón: son dos pantallas aprobadas (PRT-00.01 / PRT-00.02) sin historia ni ticket. Como PO, voy a **incorporar esas dos funcionalidades al backlog** para darles trazabilidad, alcance y estimación. Puedes trabajar sobre los prototipos aprobados, pero **no asumas que esas dos historias ya forman parte del alcance comprometido del Sprint 1 hasta que sean incorporadas y revisadas en backlog/Jira**. La prioridad inmediata es registrar correctamente las HU antes de comprometerlas formalmente en el sprint, para reconocer el hallazgo sin ampliar accidentalmente el alcance del Sprint 1.

### D-04 · Voz

Decisión tomada: la opción de voz aparece **visible pero deshabilitada**, con etiqueta **"Próximamente"**, y **Texto queda preseleccionado**. En Sprint 1 **no existe captura ni transcripción de audio** (depende de HU-5.8, Sprint 2). Corregiremos en el backlog la indicación actual de voz preseleccionada por defecto.

### D-05 · Video

Video **fuera del MVP**. Como es una decisión de presentación que no implica backend, se **aprueba directamente como PO**: muéstralo en pantalla **deshabilitado con etiqueta "Próximamente"**. Alinéalo visualmente con diseño para que sea coherente con el tratamiento de la voz.

---

## Correcciones de Jira (las hacemos nosotros; no te bloquean)

- **J-01 · CM-61.** Aceptado. El ticket se renombrará para cubrir **experiencia y educación** (hoy solo dice "Experiencia Labora", con errata) y reflejar que educación es obligatoria. Puedes trabajar ambas secciones desde ya.
- **J-02 · CM-65.** Resuelto vía D-02: se renombra quitando "Expectativas".
- **J-03 · CM-69.** Se corrige. Quitamos "priorizar" (ya no existe) y ajustamos el título a la gestión vigente: **consultar, agregar, sustituir y eliminar** roles de catálogo.
- **J-04 · CM-93.** Aceptado. El título se alinea a la responsabilidad real de Frontend: **pantalla de espera y pantalla de error** de la transición (la transición ocurre en el servidor). También se corrige el espacio inicial.
- **J-05 · Subtareas sin título.** Es un problema real de calidad y organización del tablero: doce subtareas (CM-33, CM-38, CM-39, CM-44, CM-45, CM-55, CM-56, CM-57, CM-59, CM-79, CM-83, CM-88) aparecen con un guion en lugar de nombre, lo que rompe la trazabilidad. Se corregirán asignándoles títulos descriptivos que reflejen su alcance real. No es una decisión funcional y no te bloquea.
- **J-06 · Tickets de prueba en el sprint.** Los sacamos del sprint activo para que no contaminen métricas. Limpieza administrativa, sin impacto en tu trabajo.

---

## Coordinación

- **S-01 · Responsable del spike HU-4.1 (CM-21).** Hubo un desfase de coordinación de mi parte, ya corregido: el spike **ya fue asignado a Vela**, conforme a lo acordado en el Sprint Planning. La asignación **no queda pendiente**. Lo que debe verificarse ahora es la **fecha/avance** del spike y que las dependencias **CM-84, CM-85 y CM-89** queden coordinadas con su resultado.
- **S-02 · Prototipos que no aparecen (PRT-04.04, .05, .08, .10).** Aceptamos la observación: la lista de prototipos del backlog **puede estar desactualizada**. No confirmamos que existan con otro nombre. La acción será **revisar y corregir las referencias de prototipos del backlog, contrastarlas con Figma y dejar únicamente las que realmente correspondan**. Mientras se corrige, trabaja **solo con las pantallas efectivamente disponibles** (el asistente de 3 pasos que sí está dibujado).

---

## Preguntas para Backend / Arquitectura

### T-01 · Catálogos

Corregimos la premisa: **no son tres catálogos equivalentes.**

- **Roles Profesionales:** sí, catálogo controlado + **endpoint de lectura**. Aquí necesitamos que **Backend confirme** endpoint, disponibilidad y si habrá datos semilla.
- **Habilidades:** **texto libre** (`skillName`); **no** hay catálogo en el MVP. No construyas selector basado en catálogo de habilidades; usa entrada libre + `level` (enum).
- **Nivel educativo:** proviene de un **enum fijo** (`TECHNICAL / UNDERGRADUATE / POSTGRADUATE`), no de un catálogo de BD; puedes cargar esos valores directamente.

Mientras el endpoint de roles no esté disponible, trabaja el selector de roles con datos simulados; la integración real queda marcada como dependencia de Backend.

### T-02 · Estados

Definido: el perfil se crea en **`IN_PROGRESS`** (no existe `PENDING` en este flujo) y la finalización va **`IN_PROGRESS → COMPLETED`**. La secuencia `IN_PROGRESS → IN_REVIEW → COMPLETED` y la transición `PENDING → IN_PROGRESS` **se eliminan**. `IN_REVIEW` queda **fuera del flujo manual**: en Sprint 1 un perfil manual nunca lo alcanza, así que **no aparecerá en listados**. Estas contradicciones **todavía no están reflejadas formalmente en el backlog/documentación**, pero se corregirán hoy más tarde.

### T-03 · Lista de perfiles (`ACTIVE` vs `COMPLETED`)

Hay una inconsistencia documental real (HU-2.1 usa `status=ACTIVE`; familias usa `status=COMPLETED`). Conceptualmente "Activo" es la etiqueta funcional de `COMPLETED`, pero **el contrato correcto lo confirma Backend** (el endpoint de listado todavía no existe). Trabaja temporalmente contra la interfaz acordada/mock; actualizaremos la documentación cuando el contrato quede validado.

---

Con esto puedes arrancar con las cinco pantallas del Perfil Profesional. Las únicas dependencias externas señaladas arriba son el **endpoint de catálogo de roles** y el **endpoint/filtro de listado**, ambos del lado de Backend. Cualquier duda, respondemos sobre este mismo documento para dejar constancia.

---

## Tabla resumen

| ID   | Respuesta                                                                                                            | Estado                | Acción                                                                                |
| ---- | -------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| D-01 | Gestión completa de Roles Objetivo dentro del formulario; catálogo, sin prioridad/reorden; `PRT-02.07` fuera del MVP | CORREGIR BACKLOG/JIRA | Reescribir HU-2.5 y ajustar CA-2.11.*; retirar `PRT-02.07`                            |
| D-02 | Expectativas fuera del MVP; no construir la sección                                                                  | RESUELTO              | Renombrar CM-65/CM-19; Backend define disposición de `salary-expectation`             |
| D-03 | Se incorporan HU de Landing y Tablero; alcance no comprometido hasta registrarlas                                    | CORREGIR BACKLOG/JIRA | PO crea las 2 HU antes de comprometer; Frontend trabaja prototipos sin asumir alcance |
| D-04 | Voz visible + deshabilitada + "Próximamente"; Texto preseleccionado                                                  | RESUELTO              | Corregir criterio de voz preseleccionada en backlog                                   |
| D-05 | Video fuera del MVP, mostrar "Próximamente" deshabilitado                                                            | RESUELTO              | PO aprueba; alinear visual con diseño                                                 |
| J-01 | Ticket debe cubrir experiencia + educación                                                                           | CORREGIR BACKLOG/JIRA | Renombrar CM-61 y corregir errata                                                     |
| J-02 | Depende de D-02 (expectativas fuera)                                                                                 | CORREGIR BACKLOG/JIRA | Renombrar CM-65 y CM-19                                                               |
| J-03 | Quitar "priorizar"; reflejar gestión vigente                                                                         | CORREGIR BACKLOG/JIRA | Renombrar CM-69 (consultar/agregar/sustituir/eliminar)                                |
| J-04 | Alinear a responsabilidad real de Frontend                                                                           | CORREGIR BACKLOG/JIRA | Renombrar CM-93 (pantalla de espera/error)                                            |
| J-05 | Subtareas sin título: problema real de trazabilidad                                                                  | CORREGIR BACKLOG/JIRA | Asignar títulos descriptivos; no bloquea                                              |
| J-06 | Tickets de prueba en el sprint                                                                                       | CORREGIR BACKLOG/JIRA | Sacar del sprint; limpieza, no bloquea                                                |
| S-01 | Spike HU-4.1/CM-21 ya asignado a Vela (Sprint Planning)                                                              | RESUELTO              | Verificar fecha/avance y coordinar CM-84/85/89                                        |
| S-02 | Lista de prototipos del backlog posiblemente desactualizada                                                          | CORREGIR BACKLOG/JIRA | Revisar referencias vs Figma; Frontend usa lo disponible                              |
| T-01 | No son 3 catálogos: roles=catálogo, habilidades=texto libre, niveles=enum                                            | DEPENDENCIA BACKEND   | Backend confirma endpoint/datos de roles; habilidades y niveles ya resueltos          |
| T-02 | Crear `IN_PROGRESS`; finalizar `COMPLETED`; sin `PENDING`; `IN_REVIEW` fuera del flujo manual                        | RESUELTO              | Corregir backlog/glosario (aún no reflejado; hoy)                                     |
| T-03 | Inconsistencia `ACTIVE`/`COMPLETED`; contrato lo confirma Backend                                                    | DEPENDENCIA BACKEND   | Frontend usa mock; actualizar doc al validar contrato                                 |

**Estados usados:** RESUELTO · CORREGIR BACKLOG/JIRA · DEPENDENCIA BACKEND · PENDIENTE DISEÑO/COORDINACIÓN.

---

## Cambios que debo hacer después en el backlog

Solo lo derivado de estas respuestas (no es la reescritura completa del backlog).

- **HU-2.2 (creación):** POST sin body, identidad por `X-User-Id`, estado inicial `IN_PROGRESS`; nombre por `PATCH`. Eliminar toda mención a `nombre_perfil` en el cuerpo y a `PENDING`.
- **HU-2.4 (experiencia/educación):** gestión por ítem (`POST`/`DELETE`); educación con `inProgress` boolean y nivel por enum (sin `estado_formacion` de tres valores, sin `INTERRUMPIDA`); **eliminar seniority** de experiencia.
- **HU-2.5 (finalización + roles):** acción explícita a `COMPLETED` en una transacción; requisitos mínimos (nombre, resumen, ≥1 educación, ≥1 habilidad, ≥1 rol); habilidades **texto libre**; expectativas **fuera**; **incorporar la gestión completa de Roles Objetivo dentro del formulario** (agregar/sustituir/eliminar desde el propio formulario).
- **HU-2.11 (roles):** recurso `target-roles`; catálogo controlado; **eliminar prioridad y reordenamiento**; **revisar su relación con HU-2.5** dado que la gestión pasa al formulario.
- **CA de Roles Objetivo:** ajustar **CA-2.11.2** y todo criterio que dependa de una pantalla separada para que la gestión ocurra dentro del formulario; conservar CA-2.11.3 (bloqueo del último rol solo en `COMPLETED`) y CA-2.11.7 (solo roles del catálogo); retirar CA-2.11.6 (reordenamiento/prioridad).
- **PRT-02.07:** eliminar/actualizar las referencias a la pantalla separada para el MVP y cualquier historia o referencia que dependa exclusivamente de ella.
- **Estados (glosario / T-02):** documentar `IN_PROGRESS → COMPLETED`; eliminar la secuencia `→ IN_REVIEW →` y la transición `PENDING → IN_PROGRESS`; sustituir cualquier `COMPLETE` por `COMPLETED`; `IN_REVIEW` reservado a evolución futura.
- **Voz (D-04):** corregir el criterio/comportamiento que presenta la voz como opción preseleccionada; documentar voz **deshabilitada + "Próximamente" + texto preseleccionado**; alinear los criterios afectados de Sprint 1.
- **Video (D-05):** sin cambios funcionales; solo corregir si aparece alguna referencia contradictoria.
- **Prototipos (S-02):** revisar y corregir las referencias de prototipos del backlog contra Figma; dejar únicamente las que correspondan.
- **Landing y Tablero (D-03):** incorporar las dos HU (con alcance y estimación) **antes** de comprometer formalmente ese trabajo en el sprint.
- **Seniority:** eliminar de Rol Objetivo y de experiencia laboral en historias/CA/especificaciones; marcar el enum `Seniority` como deuda técnica sin uso en el contrato.
- **Habilidades (CA-2.5.1/2.5.3):** texto libre (`skillName`) + `level` enum; eliminar el requisito de catálogo (retirar CA-2.5.3); ajustar CA-2.5.2 al comportamiento real.
- **Expectativas:** retirar del alcance funcional del MVP; renombrar CM-65 y CM-19; especificar `salary-expectation` como contrato sin uso (disposición final la decide Backend).
- **Límites:** `name ≤ 255`, `summary ≤ 2000` (antes 120/600).
- **Especificaciones técnicas de endpoints:** experiencia/educación por ítem (`POST`/`DELETE`), finalización real, `target-roles`; contrato de error `ProblemDetail` (RFC 9457).
- **Jira / títulos:** CM-61 (J-01), CM-65 (J-02), CM-69 (J-03), CM-93 (J-04), subtareas sin título (J-05), tickets de prueba (J-06).
- **Cierre de TBD obsoletos (doc. familias):** API-TBD-05 (expectativas → fuera del MVP), API-TBD-06 (colecciones → add/remove por ítem), API-TBD-07 (`target-roles`), API-TBD-09 (`COMPLETED`), API-TBD-14 (formato de error → `ProblemDetail`).

---
