---
feature: interview-setup
estado: EN_CURSO
hu: [HU-4.2, HU-4.5]
prt: [PRT-04.02, PRT-04.03, PRT-04.11]
jira: [CM-202, CM-213]
rutas: [/entrenar/nueva]
documentacion: tsdoc-es
backlog: 16102026_01_v8.2
decisiones: []
figma: Cameia · Mockups MVP
revisado: 2026-10-20
---

# Feature · Configuracion de sesion de entrevista

## 1. Proposito

Permite al usuario configurar una nueva sesion de entrevista eligiendo su
Perfil Profesional activo, pegando opcionalmente una Oferta Laboral y
seleccionando un Rol Objetivo del catalogo. Es el primer paso del asistente
de tres pasos que precede a la creacion de la sesion (HU-4.4).

## 2. Alcance

**Entra en este sprint:**

- Paso 0: seleccion de Perfil Profesional (PRT-04.02, CA-4.2.1 a CA-4.2.3, CA-4.2.6 a CA-4.2.8, CA-4.2.18 a CA-4.2.19)
- Paso 1: Oferta Laboral y Rol Objetivo (PRT-04.03, CA-4.2.4 a CA-4.2.5, CA-4.2.9 a CA-4.2.17, CA-4.2.20)
- Estado vacio sin perfiles y estado vacio solo con borradores
- WizardLayout ya existente con 3 pasos

**No entra, y es deliberado:**

- Paso 2: Modo y Tono (HU-4.3, CM-205) — siguiente HU
- Paso 3: Idioma y forma de respuesta (HU-4.3, CM-205) — misma HU
- Confirmacion e inicio de sesion (HU-4.4, CM-208)
- Backend `GET /api/v1/profiles` (lista) — se construye en cameia-perfil, se mockea aqui
- Persistencia de datos — los valores viajan al crear la sesion en HU-4.4

## 3. Comportamiento esperado

### `/entrenar/nueva` — Paso 0: Seleccion de Perfil · `PRT-04.02`

**Que hace**

- Muestra solo los perfiles con estado `COMPLETED`, cada uno con su nombre seguido de sus Roles Objetivo
- Con un unico perfil activo, queda preseleccionado
- Con 2+ perfiles activos, ninguno preseleccionado; "Siguiente" deshabilitado hasta elegir uno
- Sin perfiles: estado vacio "Necesitas un Perfil Profesional activo para iniciar una entrevista." con accion "Crear mi Perfil Profesional" que redirige a HU-2.2
- Solo borradores: estado vacio "Finaliza un Perfil Profesional para iniciar una entrevista." con accion "Terminar mi perfil" que abre el borrador mas reciente

**Estados**

| Estado      | Que muestra |
| ----------- | ----------- |
| Carga       | Skeleton de tarjetas de perfil mientras se resuelve `GET /api/v1/profiles` |
| Vacio       | EmptyState con mensaje y accion segun CA-4.2.3 (sin perfiles) o CA-4.2.6 (solo borradores) |
| Error       | EmptyState generico con accion de reintentar |
| Sin permiso | No aplica — RequireAuth ya protege la ruta |

**Validaciones del lado del cliente**

- Perfil obligatorio: "Siguiente" deshabilitado si no hay perfil seleccionado (CA-4.2.8)

### `/entrenar/nueva` — Paso 1: Oferta y Rol · `PRT-04.03`

**Que hace**

- Campo "Oferta Laboral": textarea opcional, max 3000 caracteres, contador en tiempo real
- Campo "Rol Objetivo": autocomplete sobre el catalogo de roles activos; los roles del perfil elegido aparecen primero bajo "De tu perfil", luego los demas
- Solo espacios en Oferta Laboral = vacio (CA-4.2.10)
- Rol Objetivo obligatorio: debe elegirse de la lista, no se acepta texto libre (CA-4.2.15)
- Boton "Siguiente" avanza al paso 2 (HU-4.3)
- Boton "Atras" vuelve al paso 0 conservando Oferta y Rol (CA-4.2, nota de navegacion)

**Estados**

| Estado      | Que muestra |
| ----------- | ----------- |
| Carga       | Skeleton del formulario mientras se carga el catalogo de roles |
| Vacio       | No aplica — siempre hay roles en el catalogo |
| Error       | EmptyState generico si falla la carga del catalogo |
| Sin permiso | No aplica — RequireAuth ya protege la ruta |

**Validaciones del lado del cliente**

- Oferta Laboral > 3000 caracteres: `interview:validacion.ofertaMaxCaracteres` — "La oferta laboral no puede superar los 3000 caracteres." (CA-4.2.12)
- Rol Objetivo vacio o texto libre sin seleccionar sugerencia: `interview:validacion.rolObligatorio` — "Elige un rol objetivo de la lista." (CA-4.2.15, CA-4.2.16)

## 4. Contrato observable

**Campos y reglas**

| Campo | Tipo | Regla | Origen |
| ----- | ---- | ----- | ------ |
| perfilProfesionalId | UUID | Obligatorio; solo perfiles propios con estado COMPLETED | CA-4.2.1, RN-055 |
| ofertaLaboral | string o null | Opcional; max 3000 caracteres; solo espacios = null | CA-4.2.4, RN-056 |
| rolObjetivoId | UUID | Obligatorio; debe existir en el catalogo de roles activos | CA-4.2.5, RN-057 |

**Estados y enumerados**

- `ProfileStatus`: `IN_PROGRESS` | `COMPLETED` — ver `docs/GLOSSARY.md` §3
- `ProfessionalRole`: catalogo de roles con `id`, `name`, `category` — existente

**Errores que el usuario puede ver**

| `httpStatus` | `errors[].field` (si aplica) | Cuando ocurre | Llave de i18n |
| ------------ | ---------------------------- | ------------- | ------------- |
| 422 | oferta_laboral | Oferta > 3000 caracteres llega al backend (HU-4.4) | `interview:validacion.ofertaMaxCaracteres` |
| 422 | rol_objetivo_id | Rol no existe en catalogo (HU-4.4) | `interview:validacion.rolObligatorio` |

## 5. Enlace HTTP · PROVISIONAL

**Estado del contrato:** provisional · fuente: backlog v8.2, codigo de cameia-perfil · revisado el 2026-10-18

| Operacion | Metodo y ruta | Envia | Recibe |
| --------- | ------------- | ----- | ------ |
| Listar perfiles del usuario | GET /api/v1/profiles | — | `{ profiles: [{ id, name, status, targetRoles: [{ professionalRoleId, roleTitle }] }] }` |
| Catalogo de roles profesionales | GET /api/v1/profiles/professional-roles?lang=es | — | `[{ id, nombre, categoria }]` |

## 6. Criterios de aceptacion

| Criterio | Que hace el frontend que el criterio no dice |
| -------- | -------------------------------------------- |
| CA-4.2.1 | Cada perfil se renderiza como CardSelectable con nombre y roles concatenados |
| CA-4.2.2 | Con un solo perfil activo se dispara seleccion automatica en el efecto inicial |
| CA-4.2.6 | Distingue "sin perfiles" de "solo borradores" comparando longitud total vs longitud filtrada |
| CA-4.2.13 | El textarea tiene `accept` vacio y no renderiza zona de drop |
| CA-4.2.20 | Ordena roles: primero los del perfil (cruzados con catalogo activo), luego el resto |

## 7. Estado de implementacion

| Archivo | Que implementa | Prueba |
| ------- | -------------- | ------ |
| `src/features/interview-setup/model/interviewSetup.types.ts` | Tipos de dominio del wizard | — |
| `src/features/interview-setup/model/interviewSetup.constants.ts` | Constantes (max caracteres oferta) | — |
| `src/features/interview-setup/schemas/offerAndRole.schema.ts` | Validacion zod del paso 1 | — |
| `src/features/interview-setup/store/interviewSetup.store.ts` | Estado del wizard (Zustand) | — |
| `src/features/interview-setup/hooks/useProfileList.ts` | Hook de query para lista de perfiles | — |
| `src/features/interview-setup/hooks/useRoleCatalog.ts` | Hook de query para catalogo de roles | — |
| `src/features/interview-setup/organisms/ProfileSelector/ProfileSelector.tsx` | Seleccion de perfil paso 0 | `ProfileSelector.test.tsx` |
| `src/features/interview-setup/organisms/OfferAndRoleForm/OfferAndRoleForm.tsx` | Formulario paso 1 | `OfferAndRoleForm.test.tsx` |
| `src/features/interview-setup/pages/NewInterviewWizardPage.tsx` | Orquesta los pasos del wizard | `NewInterviewWizardPage.test.tsx` |
| `src/design-system/atoms/Textarea/Textarea.tsx` | Atomo textarea con contador | `Textarea.test.tsx` |
| `src/design-system/molecules/Autocomplete/Autocomplete.tsx` | Autocomplete single-select | `Autocomplete.test.tsx` |
| `src/features/interview-setup/api/interviewSetup.dto.ts` | DTOs provisionales | — |
| `src/features/interview-setup/api/interviewSetup.mapper.ts` | Mapeo DTO a modelo | — |
| `src/features/interview-setup/api/interviewSetup.api.ts` | Funciones fetch | — |
| `src/mocks/handlers/interviewSetup.handlers.ts` | Handlers MSW | — |

## 8. Bloqueos

| Id | Que falta | De quien depende | Desde |
| --- | --------- | ---------------- | ----- |
| B-1 | `GET /api/v1/profiles` (lista) no existe en cameia-perfil | Backend | 2026-10-18 |

## 9. Notas

- Los prototipos de Figma estan desactualizados y no son fuente de verdad; mandan los criterios del backlog (decision del PO del 15/10/2026).
- Los datos de este paso no se persisten: viajan al crear la sesion en HU-4.4. El store de Zustand los mantiene en memoria durante la navegacion del wizard.
- Al cambiar de perfil se conservan Oferta Laboral y Rol Objetivo (puede ser un rol fuera del perfil, CA-4.2.14); solo cambia la seccion "De tu perfil".

**Presentación «Amanecer» y Atomic Design (CM-208, 19-oct-2026).** Solo diseño: mismos cinco pasos,
campos, opciones y reglas (Entreno «Próximamente», Audio deshabilitado si el navegador no graba,
oferta opcional con tope de 3000).
- El asistente se monta dentro de `AppShell` (`interviewSetupShellRoutes`): misma navegación que el
  resto del área autenticada (NavHeader, TabBar, menú de usuario), más una salida explícita «Volver a
  inicio» arriba del progreso, distinta de «Atrás».
- `Stepper` (molécula) pasa a «camino del amanecer»: nodos numerados, completados con check, el actual
  como el sol de la marca; `CardSelectable` (molécula) gana recuadro de ícono, indicador de selección y
  `badge` (átomo `Pill`). Ambos cambios aplican a todos sus consumidores (también
  `ProfileMethodSelector`).
- Cada paso tiene encabezado (`WizardStepHeader`: `Eyebrow` + pregunta + contexto, llaves
  `interview:asistente.encabezados.*`) y la barra muestra «Paso x de 5» (`asistente.pasoDeTotal`).
- Correcciones de Atomic Design: `ConfirmAndStartForm` usaba `<button>` escritos a mano (ahora
  `Button`) y cajas de aviso con clases inexistentes en el tema (`bg-status-*`, `rounded-radius-*`;
  ahora `AlertInline`); contador de la oferta con `CharacterCounter`, etiquetas con `Label`,
  esqueletos con `Skeleton`. Los roles del perfil también se ofrecen como atajos `Chip` que eligen el
  mismo rol del autocomplete. El resumen de confirmación tiene «Cambiar» por fila (`goToStep`).
- Los avisos de advertencia ahora se anuncian como `role="status"` (convención de `AlertInline`); los
  errores siguen como `alert`.

### Ajustes tras el testeo del 19-10-2026 (CM-339)

- La lista de perfiles del asistente conserva la clave `['profiles', 'list']`; `professional-profile` usa otra clave propia para no pisarla (CM-339).
- Paso 1: «Siguiente» solo avanza si el perfil elegido sigue en la lista de activos.
- Paso 1: los roles de cada perfil se nombran con el catálogo del idioma activo (respaldo: `roleTitle`).
- Paso 2: al volver, «Rol objetivo» muestra el rol ya elegido (`Autocomplete` arranca con la opción seleccionada).
- Confirmar: una oferta con solo espacios cuenta como «Sin oferta laboral»; el botón en carga usa `common:estados.cargando`.

### Inicio de la entrevista (CM-213 · HU-4.5 · PRT-04.11)

`/entrenar/nueva/iniciando` recibe `{sessionId}` del asistente y llama a
`POST /api/v1/interviews/sessions/{session_id}/start` una sola vez (CA-4.5.12).

- **Cargando:** firma animada `BrandReveal` (la misma de la landing, subida al design system),
  «Iniciando sesión de entrevista» y un `Spinner`, sin controles (CA-4.5.13). Mínimo 1,6 s para
  que termine la animación.
- **Éxito:** abre `/entrenar/sesion/{id}` con `{sessionId, answerFormat, question, progress}` en el
  estado de la navegación (`toChatEntry`) y limpia el asistente.
- **Error:** `503 LLM_UNAVAILABLE` → «Ocurrió un error. Inténtalo de nuevo.» + «Reintentar» +
  «Cancelar» (CA-4.5.14); tras 2 reintentos → «No pudimos preparar tu entrevista en este
  momento. Inténtalo más tarde.» solo con «Cancelar» (CA-4.5.19); `404` → «No encontramos lo que
  buscabas.» (CA-4.5.10); sin red → mensaje de conexión + «Reintentar».
- **Cancelar:** `DELETE /api/v1/interviews/sessions/{id}` (provisional) y vuelve a «Nueva
  entrevista» sin datos (CA-4.5.17).
- **Vacío:** sin `sessionId` (recarga) → `/entrenar/nueva`.

Diferencia consciente: CA-4.5.16 (volver a la entrevista anterior al cancelar) necesita
`GET …/state` (HU-5.7), que no existe; mientras tanto «Cancelar» siempre va a «Nueva entrevista».
`…/start` y `DELETE` no existen aún en cameia-entrevista: se prueban con MSW.

