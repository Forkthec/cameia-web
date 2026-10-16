---
feature: professional-profile
estado: EN_CURSO
hu: [HU-2.2, HU-2.3, HU-2.4, HU-2.5, HU-2.11]
prt: [PRT-02.02, PRT-02.03, PRT-02.07]
jira: [CM-46, CM-53, CM-61, CM-65, CM-69, CM-195, CM-243, CM-270, CM-272, CM-273, CM-298]
rutas: [/perfiles/nuevo, /perfiles/:id/editar, /perfiles/:id/roles]
documentacion: tsdoc-es
backlog: 09102026_01
decisiones: [10092026_v1, 11092026_v2, 11092026_v1, 13092026_v1]
figma: Cameia · Mockups MVP
revisado: 2026-10-16
---

# Feature · Perfil Profesional

> **Nota sobre el backlog (actualizada el 9-oct-2026, CM-270).** Hasta la entrega del frontend
> (2026-10-06) esta feature se construyó contra versiones anteriores del backlog (6, 12 y 13-sep).
> El campo `backlog` del encabezado indica ahora `09102026_01`, el archivo «v6» (el libro se titula
> «versión 5» y no trae hoja «Cambios v6»: pregunta abierta a Diego y al PO). **Solo HU-2.2 se
> contrastó con esa versión**: §3.1 y las filas de HU-2.2 de §4, §5, §6, §7 y §9. Las secciones de
> HU-2.3, HU-2.4, HU-2.5 y HU-2.11 siguen escritas contra versiones anteriores y no se cruzaron con
> «Cambios v4» ni con v6: el equipo debe contrastarlas antes de tocarlas.
>
> **CM-272 (11-oct-2026) contrastó los 12 CA vigentes de HU-2.3** con el backlog v6 (filas 26 a 39
> de la hoja HE-02 y fila 46 de «Cambios v4», ítem n.º 34), a través del documento de criterios
> verificado contra el libro. Esa comprobación alimenta únicamente la tabla «Criterios de HU-2.3:
> estado y cierre con CM-272» de §3.2, las filas de CM-272 de §6, los bloqueos C-19 a C-21 de §8 y la
> decisión D-J de §9. El resto del texto de HU-2.3 (§4, §5 y lo anterior de §3.2) **no** se
> recontrastó.

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
- Habilidades (texto libre + nivel) y finalizar (PRT-02.03, HU-2.5) — ver §3.4.
- Roles Objetivo: consultar, agregar, sustituir y eliminar, de catálogo cerrado, sin prioridad ni
  reordenamiento (HU-2.11, D-01, J-03) — ver §3.5. **Ya no bloqueada**: el PO autorizó construir la
  gestión manual sin esperar la respuesta completa de C-04 (HU-2.10 sigue viva para Sprint 2, pero
  ya no condiciona esta subtarea — decisión H, §9). Ambas subtareas (CM-65, CM-69) se construyeron
  en ramas independientes desde `develop` y ya están fusionadas en esta.

**No entra, y es deliberado:**

- **Expectativas.** Retiradas del alcance funcional del MVP (D-02). CM-65 y CM-19 pierden la
  palabra «Expectativas» en su título; no se construye ninguna sección para esto.
- **Autocompletar con IA.** El selector de método (CM-46) ofrece esa ruta, pero HU-2.6 a HU-2.10
  son Sprint 2; se renderiza deshabilitada (`CLAUDE.md` §12, abierta 7).
- **Sugerencia de roles por IA / HU-2.10.** Usaba la pantalla PRT-02.07, que D-01 retiró del MVP.
  **C-04, respondida el 13-sep:** HU-2.10 sigue en Sprint 2 y la IA irá *dentro* del formulario de
  PRT-02.03, no en una pantalla aparte. `ProfileRolesPage.tsx` y la ruta `/perfiles/:id/roles` (que
  siguen declaradas en `rutas` y `prt` de este encabezado) **se conservan hasta que se construya
  HU-2.10**; nada enlaza a ellas.
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
(Información General, Formación académica, Experiencia Laboral); CM-65 agrega la cuarta,
**Habilidades** (§3.4), y CM-69 agrega la quinta, **Roles Objetivo** (§3.5) — ambas en ramas
independientes desde `develop`, ya fusionadas en esta. «Expectativas Profesionales» **no se
construye ni se lista**: está fuera del MVP (D-02) y el backlog manda sobre el diseño en
comportamiento (`CLAUDE.md` §16) — ver decisión D-D en §9. `StepList` (desktop, ≥600px) / acordeón
con `useDisclosure` (móvil, <600px) alternan por `useMediaQuery(DESKTOP_MEDIA_QUERY)`, resuelto una
sola vez en `EditProfilePage`. La barra de acciones tiene una `progress-bar` de completitud del
perfil (`max=5`, los 5 requisitos reales de finalización; CM-61 solo podía calcular 3, CM-65 suma el
cuarto y CM-69 el quinto — ver decisión D-D) y dos botones: «Guardar borrador»
(`variant=secondary`, envía únicamente `GeneralInfoForm` por el atributo HTML `form` — decisión
D-C) y «Finalizar y Continuar» (`variant=primary`, conectado a
`POST /api/v1/profiles/:id/completion` — ahora se habilita de verdad cuando
`getCompletenessValue` llega a 5, con Habilidades y Roles Objetivo ya fusionados en el mismo
formulario). Antes de la verificación de CM-53, `docs/ARCHITECTURE.md` §2, el TSDoc de
`WizardLayout.tsx` y una versión anterior de esta misma sección citaban un asistente paginado que
el frame real no tiene — ya corregido en los tres lugares
(`docs/bitacora-ia/hallazgo-figma-no-revisado-cm53.md`).

**Nota transversal de "Sin permiso" para las cinco subsecciones:** las cinco viven detrás de
`RequireAuth` (`CLAUDE.md` §11), que redirige a `/ingresar` antes de montar la página; ese caso no
se repite en cada tabla. El caso «perfil de otro usuario» **no está descrito en el contrato
observable todavía**: los mocks no modelan un 403 — `GET /api/v1/profiles/:id`,
`PATCH`/`completion` devuelven 404 para un id ajeno o inexistente, sin distinguir los dos casos
(los handlers de `src/mocks/handlers/profiles.handlers.ts` que responden 404). Se anota como parte de **C-01**: sin
contrato real, no se puede afirmar que el backend distinga "no existe" de "no es tuyo".
**Actualización de CM-272 (11-oct-2026):** el código de `cameia-perfil` (`develop`, `9355f1a`) sí
los distingue: un `PATCH /api/v1/profiles/{id}` sobre un perfil ajeno responde `403` con
`code: PROFILE_NOT_ALLOWED` (`ErrorCatalog.java:81`; prueba `GeneralInfoEndToEndIT.java:172-173`). El
mock sigue sin modelarlo (ver C-20, §8).

### 3.1 · `/perfiles/nuevo` — Selección del método · `PRT-02.02` · CM-46 · CM-270

Fuente: backlog `09102026_01` (v6), hoja HE-02, HU-2.2, CA-2.2.1 a CA-2.2.7.

**Qué hace**

- Punto de entrada para crear un perfil nuevo: dos tarjetas excluyentes, «Llenado Manual» y
  «Autocompletar con IA». Tocar una tarjeta ES la acción — no hay campo para el nombre del perfil
  ni botón «Continuar». El perfil nace vacío, sin nombre y en Borrador; `POST /api/v1/profiles` va
  sin cuerpo; el método elegido no se guarda como dato del perfil; el nombre se fija después por
  `PATCH /api/v1/profiles/{id}` (HU-2.3, §3.2).
- **CA-2.2.1 (ruta manual) — implementado.** Con cupo disponible, tocar «Llenado Manual» crea el
  perfil (`POST /api/v1/profiles` sin cuerpo → 201, `IN_PROGRESS`, `name` nulo) y navega al
  Formulario de Perfil Profesional (`/perfiles/:id/editar`) con el `id` devuelto. No hay forma de
  descartar un perfil vacío creado de más (consulta C-03, §8).
- **Perfil ya existente (CM-195).** Con `lastUsedProfileId` guardado (`stores/uiPreferences.store.ts`,
  conveniencia de solo cliente, ADR-0004), `NewProfilePage` redirige de inmediato a
  `/perfiles/:id/editar` al montarse (`replace`); al crear con éxito guarda el id en
  `lastUsedProfileId`. Efecto a tener presente: con ese id guardado el selector no se muestra, así que
  el mensaje de cupo de CA-2.2.3 solo es alcanzable sin él (otro navegador o dispositivo). Si eso es
  lo que se quiere frente a CA-2.2.3 y CA-2.2.5, está por confirmar.
- **CA-2.2.2 (ruta de IA) — implementado.** La tarjeta «Autocompletar con IA» se muestra
  deshabilitada con la etiqueta «Próximamente» (`StateLocked`); no crea ningún perfil, no navega a la
  carga de la Hoja de Vida (HU-2.6, Sprint 2) y no llama al backend. Diverge del frame de Figma, que
  la dibuja habilitada con «Recomendado» — ver §9.
- **CA-2.2.3 (cupo del Plan Free agotado) — implementado en CM-270.**
  - *Qué se muestra:* la creación se rechaza, no se crea ningún perfil, no se navega, y se muestra
    «Tu Plan Free permite 1 Perfil Profesional.». Es la versión **provisional del Sprint 2**, sin los
    botones «Ver planes» y «Ahora no»: el Paywall completo (CA-2.12.1, HU-2.12) es Sprint 3 y
    reemplazará este mensaje; desde él se irá a «Planes y precios» (HU-8.2).
  - *Cómo se reconoce (CM-298, `ADR-0008`):* por `code`, no por estado HTTP, con una función
    aislada de la feature, `isProfileLimitReached` (`model/profileLimit.ts`), acotada a la creación
    de perfil (en otros endpoints el mismo estado significa otra cosa). Reconoce
    `PROFILE_LIMIT_REACHED` (`409`, hoy) y `PLAN_LIMIT` (`403`, backlog v6) a la vez, porque Backend
    cambia estado y código juntos al desplegar el segundo y el front no debe tocarse de nuevo.
    **Es estricto:** un `409` o un `403` sin `code`, o con otro `code`, **no** es cupo agotado y cae
    en el mensaje genérico (`errors:generico`). CM-270 lo resolvió por estado
    (`error.isConflict() || error.isForbidden()`) porque `ApiError` no exponía el `code`; ese criterio
    mostraba como cupo agotado el `409 PROFILE_CREATION_IN_PROGRESS` y el `403 EMAIL_NOT_VERIFIED`.
  - *Qué ya no es cupo agotado:* `PROFILE_CREATION_IN_PROGRESS` (`409`, ver más abajo),
    `PROFILE_NOT_ALLOWED` (`403`, perfil ajeno; documento de Backend del 10-oct), que comparte
    estado con el cupo y se distingue solo por el `code`,
    `EMAIL_NOT_VERIFIED` (`403` del Gateway, cuerpo `{code, message}`; su manejo es de la
    verificación de correo, HU-1.2, no de esta pantalla) y cualquier otro código del catálogo.
  - *Presentación:* `AlertInline variant="error"` en la ranura de error que `ProfileMethodSelector`
    ya tiene; solo cambia el texto que le pasa `NewProfilePage`. No se añade ninguna prop al
    selector. El texto vive en `profile.json` (`profile:metodo.errorCupoPlan`), no se toma del
    `detail` del backend (`CLAUDE.md` §8). `profile:metodo.errorYaExiste` («Ya tienes un perfil
    creado.») se eliminó. El «1» está escrito en el texto provisional, lo que roza `CLAUDE.md` §3.7 (los límites de
    plan vienen del backend): tensión conocida que resuelve el Paywall.
- **CA-2.2.4 (perfil vacío y sin método registrado) — vive en el formulario**, no en esta pantalla:
  `GET /api/v1/profiles/{id}` → 200, `IN_PROGRESS`, `name` nulo, sin campo de método (PRT-02.03,
  §3.2 a §3.5). El mapper convierte `name` y `summary` nulos en `''` (`profile.mapper.ts`), con prueba
  en `profile.mapper.test.ts`. Cobertura pendiente: la prueba de «perfil recién creado» de la página
  usa el mock, que devuelve `name: ''`, y no hay un indicador visible de «Borrador» verificado.
- **CA-2.2.5 y CA-2.2.6 (Plan Premium: quinto y sexto perfil) — Sprint 3, fuera del Sprint 2.** El
  PO los movió el 05-oct-2026 («Cambios v4», fila 33) porque requieren el Plan Premium de HU-8.2. No
  se implementan. Para CA-2.2.6 el rechazo es 403 `PLAN_LIMIT` con «Alcanzaste el máximo de 5
  Perfiles Profesionales de tu plan.»; el cliente hoy no conoce el plan (`GET /api/v1/users/me` lo
  devolverá, pero aún no existe) y la redirección por `lastUsedProfileId` impide llegar al selector
  con un perfil ya creado.
- **CA-2.2.7 (selección repetida) — cumplido, también el literal (DF-004).** Mientras la creación
  está en curso, la tarjeta «Llenado Manual» queda con el atributo `disabled`, marcada como
  seleccionada, con `aria-busy` y un `Spinner` con etiqueta, y un segundo toque no produce otra
  petición: una sola, sin Paywall. La defensa es una guarda síncrona (`useRef`) en `NewProfilePage`,
  que se baja en `onSettled`; el `disabled` muestra el estado pero no es la defensa, porque llega con
  el re-render (ver §9, nota sobre la carrera). Backend además nunca crea un segundo perfil.
- **Creación en curso (CM-298) — `409 PROFILE_CREATION_IN_PROGRESS`.** Si otra creación del mismo
  usuario no termina en 2 s, Backend responde `409` y no crea nada; se puede reintentar. Sustituye
  al `503 PROFILE_CREATION_TIMEOUT`, que ya no existe en `cameia-perfil` (commit `147d1e8`, PR #80,
  en `develop`). Se muestra «Estamos creando tu perfil. Inténtalo de nuevo en unos segundos.», el
  texto literal publicado por Backend (documento del 9-oct, §2.2; el del 8-oct, §3 y §7.1, ya lo
  traía para el `503`), en `AlertInline variant="error"` y por la misma ranura de error que el
  cupo agotado, pero **no** con el texto de CA-2.2.3. El texto vive en `profile.json`
  (`profile:metodo.errorCreacionEnCurso`, llave nueva), no se toma del `detail` (`CLAUDE.md` §8). La
  tarjeta sigue activa y el usuario reintenta tocándola; no se navega ni se guarda
  `lastUsedProfileId`. El texto en inglés es una traducción de trabajo, como el resto de `en`
  (`CLAUDE.md` §7). La nota anterior de este SPEC decía que el texto «no existía en el backlog ni en
  los documentos de Backend»: era un error, ya estaba en el documento del 8-oct.

**Estados**

| Estado      | Qué muestra                                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carga       | No aplica al render inicial: la pantalla no depende de datos remotos para mostrar las dos tarjetas. Mientras la creación está en curso, la tarjeta manual queda marcada como seleccionada y deshabilitada (`disabled`), con `aria-busy`, y se anuncia un indicador de carga; un segundo toque no produce otra petición (CA-2.2.7) |
| Vacío       | No aplica: no hay una colección que pueda estar vacía en esta pantalla                                                                                                            |
| Error       | Cupo agotado (`code` `PROFILE_LIMIT_REACHED` hoy, `PLAN_LIMIT` después) → mensaje de CA-2.2.3 en `AlertInline variant="error"`; `PROFILE_CREATION_IN_PROGRESS` → «Estamos creando tu perfil. Inténtalo de nuevo en unos segundos.»; cualquier otro fallo, incluido un `409` o `403` sin `code`, mensaje genérico (`errors:generico`); en todos permite reintentar tocando la tarjeta de nuevo |
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
  En el mock, al guardar, `summaryProvenance` se recalcula según CA-2.3.1/CA-2.3.2/CA-2.3.4 (ver
  §4; el backend real no expone ese campo); el cliente nunca lo envía.
- **CM-53 entregó el organismo `GeneralInfoForm`; CM-61 lo inserta en la página real**, dentro de
  `ProfileSectionsLayout` junto a Formación académica y Experiencia Laboral, con la barra de
  acciones compartida debajo (§3). `EditProfilePage.tsx` ya no es el placeholder de `EmptyState` —
  ver §7. Los estados de la tabla de abajo son ahora comportamiento implementado, no previsto.
- **Autoguardado en `onBlur` (CM-195, decisión D-H; CM-272, decisión D-J, §9).** `GeneralInfoForm`
  guarda por `PATCH` cuando el foco sale de **cada campo** y solo si el formulario tiene cambios
  (`formState.isDirty`); «Guardar borrador» se conserva como respaldo explícito y siempre envía. El
  resto de secciones persiste por ítem, sin borrador. CM-195 lo había puesto en el `<form>`
  (disparaba solo al salir del formulario completo, sin mirar si había algo que guardar); CM-272 lo
  cambió, ver «Alcance de CM-272» más abajo.
- **Cambios sin guardar (CM-194).** `GeneralInfoForm` sincroniza `formState.isDirty` con
  `stores/unsavedChanges.store.ts` (y lo limpia al desmontarse): es lo que hace que la confirmación
  de cierre de sesión advierta de cambios sin guardar (ver `src/features/auth/SPEC.md` §3).
- **No incluye el campo «Ubicación»** que el frame sí dibuja en esta sección: ningún CA de HU-2.3 lo
  menciona, no existe en `GLOSSARY.md` ni en el contrato — bloqueo **C-10** (§8), sin resolver.

**Estados**

| Estado      | Qué muestra                                                                           |
| ----------- | ------------------------------------------------------------------------------------- |
| Carga       | `Spinner` mientras se obtiene el perfil por `id` antes de mostrar el formulario       |
| Vacío       | No aplica: el perfil siempre existe en este punto (se creó en el método de configuración) |
| Error       | **Al cargar:** perfil inexistente (`404`) o ajeno (`403 PROFILE_NOT_ALLOWED`, CM-272) → `errors:codigos.NOT_FOUND`; cualquier otro `ApiError` → `errors:generico`; fallo de red real (no `ApiError`) → `errors:red`, con botón «Reintentar». **Al guardar (`PATCH`):** hoy el error se descarta sin mostrar nada (ver «Alcance de CM-272», punto 1); CM-272 lo muestra resuelto por `code` |
| Sin permiso | Ver nota transversal arriba. **Al cargar y al guardar:** `403 PROFILE_NOT_ALLOWED` → «No encontramos lo que buscabas.» (CA-2.3.11, las dos rutas), implementado en CM-272 |

**Validaciones del lado del cliente**

- `name`: vacío o mayor a 255 caracteres bloquea sin llamar al servidor (zod; CA-2.3.8 y CA-2.3.10,
  límite confirmado por la respuesta oficial del PO del 13-sep — ver §8, C-01). **El campo no lleva
  `maxLength` y no corta lo escrito** (CM-272, 13-oct-2026): con 256 caracteres aparece «El nombre no puede
  superar los 255 caracteres.» bajo el campo y no se guarda, ni con «Guardar borrador» ni con el
  autoguardado al salir del campo. El backend real (hoy `422` `VALIDATION_FAILED` según el catálogo del
  8-oct, `ADR-0008`) es solo defensa en profundidad — ver §4.
- `summary`: más de 2000 caracteres bloquea sin llamar al servidor (zod) y **no se corta lo escrito**
  (RT-01-CA07): el contador pasa a rojo y muestra «2001 / 2000 caracteres» (`CharacterCounter`, que no
  limita el valor), con «El resumen no puede superar los 2000 caracteres.» bajo el campo (CA-2.3.3,
  `GLOSSARY.md` §2). El frame de Figma muestra el contador en 600, no 2000 — se mantiene 2000 por decisión
  explícita (bloqueo **C-11**, §8).
  *Historia:* CM-53 había puesto `maxLength` en los dos campos y documentado que «bloquea sin llamar al
  servidor (`maxLength` del campo)»; eso impedía que el criterio se pudiera ver (C-19). El Product Owner
  decidió mantener las reglas del backlog y el código se adaptó al criterio: CM-272 quita los dos
  `maxLength`.

**Alcance de CM-272 (HU-2.3, 11-oct-2026) — IMPLEMENTADO (12-oct-2026).** Lo que sigue describe el
comportamiento que el código tiene desde CM-272, con las pruebas de `GeneralInfoForm.test.tsx` y
`EditProfilePage.test.tsx` en verde (67 de 67). Los apartados «**Hoy**» y las citas
`archivo:línea` que los acompañan describen el código de `develop` en `4b3f915`, **antes** de
CM-272: son la historia del defecto, no el estado actual (los números de línea ya se movieron). El
alcance es exactamente los cuatro puntos de abajo, más una regla que salió de una prueba (punto 3).

1. **Mostrar los errores del `PATCH` de Información General, resueltos por `code`.**
   - **Hoy el error se descarta.** `GeneralInfoForm.tsx:173-181` envuelve `await onSubmit(values)` en
     un `try/catch` cuyo `catch` está vacío (`:176-178`). Su comentario afirma «El error ya lo
     muestra la página (`updateGeneralInfo.isError`)», y **esa afirmación es falsa**:
     `EditProfilePage.tsx` solo usa `isPending` (`:244`, `:593`), `mutateAsync` (`:245`) e
     `isSuccess` (`:530`) de `updateGeneralInfo` (`:108`); en todo el archivo no se lee
     `updateGeneralInfo.isError` ni `.error`. Ese comentario es la causa del agujero: quien escribió
     el formulario delegó el error a una página que nunca lo mostró. Un `403` o un `422` del
     `PATCH` no produce ningún mensaje; lo único que cambia es que el formulario queda «sucio»
     (`reset` no se llama), y eso solo se nota en el aviso del diálogo de cerrar sesión (más abajo).
   - **Qué se muestra, por `code`** (`ADR-0008`, `CLAUDE.md` §8: el `code` elige una llave de i18n; el
     texto crudo `title`/`detail`, el `code` y el `requestId` nunca se renderizan):

     | Respuesta del servidor (`cameia-perfil` `9355f1a`) | `code` que se lee | Mensaje (es-CO) | Criterio |
     | -------------------------------------------------- | ----------------- | --------------- | -------- |
     | `403` | `PROFILE_NOT_ALLOWED`, de nivel superior (`ErrorCatalog.java:81`) | «No encontramos lo que buscabas.» | CA-2.3.11 |
     | `403` en el `GET` de **carga** (perfil ajeno; `ProfileAppService.java:304-307`) | `PROFILE_NOT_ALLOWED`, de nivel superior | «No encontramos lo que buscabas.» (`errors:codigos.NOT_FOUND`; defecto C, 12-oct-2026) | CA-2.3.11, RT-03 |
     | `422 VALIDATION_FAILED` | `SUMMARY_NOT_ALLOWED`, en `errors[].code` con `field: summary` (`ProfessionalProfile.java:112-118`; prueba `GeneralInfoEndToEndIT.java:146-160`) | «No puedes quedarte sin resumen profesional con el perfil activo.» | CA-2.3.12 |
     | cualquier otro error con `ApiError` (otro `code`, sin `code`, `5xx`, `409 PROFILE_UPDATE_IN_PROGRESS`, `422` con otros `errors[].code`…) | — | «Ocurrió un error. Inténtalo de nuevo.» (`errors:generico`) | RT-05 |
     | fallo de red real (no `ApiError`) | — | «No hay conexión. Revisa tu internet e inténtalo de nuevo.» (`errors:red`) | RT-05 |

     **Sin respaldo por estado HTTP** (`ADR-0008`): un `403` o un `422` sin el `code` esperado
     muestra el genérico, nunca el mensaje específico. Un genérico es honesto; uno específico
     equivocado, no.

     **La carga también se resuelve por `code` (defecto C).** `EditProfilePage` mostraba `errors:codigos.NOT_FOUND`
     solo si el `GET` respondía `404`; un perfil ajeno responde `403 PROFILE_NOT_ALLOWED` y caía en el genérico
     aunque RT-03 y CA-2.3.11 piden «No encontramos lo que buscabas.». Ahora el mensaje sale con `404` **o** con
     `hasCode('PROFILE_NOT_ALLOWED')`; un `403` sin ese `code` sigue siendo el genérico (sin respaldo por estado).

     **Excepción: `403 EMAIL_NOT_VERIFIED` del Gateway.** Ya no llega a esta pantalla como
     genérico en el sentido de «error sin resolver»: `httpClient.ts:107-109` lo intercepta, cierra la
     sesión y navega a `/ingresar?correoNoVerificado=1` (`handleEmailNotVerified`, `:70-74`, CM-180).
     El `throw apiError` de `:110` sigue después, así que `updateGeneralInfo.isError` se activa igual
     y **el mensaje genérico podría verse un instante antes de la navegación**. **NO comprobado en
     ejecución.** CM-272 no mapea ese `code`: no lo necesita.
   - **Se reutiliza `getItemErrorMessage` (`EditProfilePage.tsx:205-218`) sin modificarla.** Es de
     CM-65 (PR #72), local a `EditProfilePage` (declarada dentro del componente, después de los
     `return` tempranos de `:154-191`), de firma `(error: unknown, fallback: string, byCode:
     Record<string, string>) => string`: busca el `code` de nivel superior y luego los de
     `errors[]`, y devuelve `fallback` si no hay coincidencia o si el error no es un `ApiError`
     (`:210`). Ya cubre las dos formas que emite Perfil para este `PATCH`. CM-272 solo la **llama**,
     desde `EditProfilePage`, con su propio `byCode` y su propio `fallback`:
     `byCode = { PROFILE_NOT_ALLOWED: t('errors:codigos.NOT_FOUND'), SUMMARY_NOT_ALLOWED:
     t('profile:general.resumen.errorPerfilActivo') }` y `fallback = error instanceof ApiError ?
     t('errors:generico') : t('errors:red')` (mismo reparto que la carga, `:169-174`). Como la
     función siempre devuelve un `string`, el mensaje se muestra solo cuando
     `updateGeneralInfo.isError`, igual que hacen las otras secciones.
   - **Dónde se muestra:** un `AlertInline variant="error"` en `EditProfilePage`, en el mismo lugar
     que hoy ocupa la confirmación (`:530-532`), y **nunca a la vez que ella**. No va bajo un campo:
     el `403` no pertenece a ninguno y el criterio CA-2.3.12 pide «mostrar el mensaje», no ubicarlo
     bajo `summary`. `GeneralInfoForm` no cambia de props por esto; su único cambio en este punto es
     corregir el comentario falso de `:177-178`.
   - **Llaves de i18n — decisión.** Para CA-2.3.11 se **reutiliza** `errors:codigos.NOT_FOUND`
     (`errors.json:5`, es-CO «No encontramos lo que buscabas.» / en «We couldn't find what you were
     looking for.»), y **no** se crea una llave nueva en `profile:`. Razones: (a) RT-03 exige que la
     interfaz muestre ese mismo texto ante un recurso ajeno y ante uno inexistente, así que el
     texto debe vivir en un solo sitio y no en dos que puedan divergir; (b) la carga de esta misma
     página ya lo usa para el `404` (`:172`); (c) `EditProfilePage` ya carga el namespace `errors`
     (`:127`); (d) no toca `errors.json`, un archivo transversal. Para CA-2.3.12 se **crea una**
     llave, porque la frase no existe en ningún idioma (la única parecida habla de roles objetivo,
     `profile.json es-CO:200`):

     | Llave | es-CO | en |
     | ----- | ----- | -- |
     | `profile:general.resumen.errorPerfilActivo` | «No puedes quedarte sin resumen profesional con el perfil activo.» | «You can't leave the professional summary empty while the profile is active.» |

     Convención: va bajo `general.resumen`, junto a `errorLongitud` (`profile.json:45`), con el
     prefijo `error` + causa que usan `educacion.errorLimite`, `experiencia.errorFechaEdadMinima`,
     `habilidades.errorYaExiste`, etc. El código del backend (`SUMMARY_NOT_ALLOWED`) solo aparece
     como clave del `byCode`, nunca como nombre de llave. Hay que añadirla en **es-CO y en** a la
     vez (los dos archivos hoy tienen exactamente las mismas llaves).
   - **No se mapean en CM-272** (caen en el genérico): `SUMMARY_INVALID_CHARACTERS`,
     `PROFILE_NAME_INVALID_CHARACTERS`, `SUMMARY_TOO_LONG`, `PROFILE_NAME_REQUIRED`,
     `PROFILE_NAME_TOO_LONG` (el cliente ya bloquea los dos últimos antes de enviar) y
     `PROFILE_UPDATE_IN_PROGRESS` (`409`; hoy solo se trata al finalizar, `EditProfilePage.tsx:607`).
     Ver pregunta abierta 6 del documento de criterios y la deuda que ya anota el `ADR-0008`.
   - **Interpretación de CA-2.3.12: «conservar el resumen» incluye lo que la persona ve (cerrada el
     13-oct-2026).** El criterio dice «impedir el cambio, mostrar el mensaje y conservar el resumen y el
     estado del perfil». «Conservar» admite dos lecturas: (1) el servidor no borra el resumen, que ya se
     cumplía (`ProfessionalProfile.java:112-118`); (2) la pantalla vuelve a mostrar el resumen guardado, que no
     se cumplía: tras el 422 el campo quedaba **vacío** aunque el servidor lo conservaba. **Se resuelve por la
     segunda lectura.** Tras el rechazo, `EditProfilePage` resuelve el `onSubmit` con
     `{ restoreSummary: profile.summary }` (el resumen de la caché, el último que el servidor confirmó) y
     `GeneralInfoForm` ejecuta `resetField('summary', { defaultValue })`: vuelve el resumen y solo el resumen.
   - **La restauración es SOLO para ese `code` (ADR-0008) y RT-05 es la razón.** Se identifica por `code`
     (`SUMMARY_NOT_ALLOWED`, de nivel superior o en `errors[]`; `isSummaryNotAllowed` en `EditProfilePage`). Un
     `500`, un `503`, una caída de red o cualquier otro error se **relanzan** y no restauran nada: RT-05 y
     RT-05-CA01 exigen conservar lo que la persona escribió ante un fallo técnico, y perderlo sería peor que
     el defecto que se corrige. Tres pruebas guardan ese límite (`500`, `503` y caída de red).
   - **Efectos acotados.** El nombre no se toca: si estaba sin guardar (por ejemplo, porque un guardado anterior
     falló) conserva lo escrito y el formulario queda sucio por él; si no, el formulario queda limpio. No hay
     «Cambios guardados.» (la mutación está en error) y no se dispara el reintento del guardado descartado (D2,
     punto 3), porque el rechazo no cuenta como guardado.
   - **Bucle que esto resuelve.** Antes, con el campo vacío y sucio, **cada** salida de campo reenviaba el
     `PATCH` y volvía a fallar con el mismo 422, indefinidamente. Al restaurar el valor el formulario deja de
     estar sucio y la compuerta `isDirty` (punto 4) frena el envío.

2. **Quitar el «Cambios guardados.» residual (CA-2.3.14).**
   - **Hoy:** `EditProfilePage.tsx:530-532` pinta la confirmación con `updateGeneralInfo.isSuccess`,
     que no se limpia salvo que otra mutación de ese mismo hook arranque. Si tras un guardado
     exitoso el usuario sale de un campo con un valor inválido (nombre vacío), la validación de zod
     detiene el envío **antes** de la mutación (`GeneralInfoForm.tsx:192`/`:195`, `handleSubmit`),
     así que `isSuccess` sigue en `true` y la confirmación anterior queda visible junto al mensaje
     de error del campo. Contradice «no debe guardar» de CA-2.3.14.
   - **Regla (simplificada el 12-oct-2026):** «Cambios guardados.» se muestra solo si el último
     guardado terminó con éxito **y** el formulario no tiene cambios sin guardar; **se oculta mientras
     el formulario esté sucio** (`formState.isDirty`). Se oculta, por tanto, al editar cualquiera de
     los dos campos y al arrancar un nuevo guardado; si el guardado falla se muestra el error del
     punto 1, nunca las dos cosas a la vez. Una salida de campo **sin cambios** (punto 4) no envía
     nada y no oculta la confirmación, que sigue siendo verdadera.
   - **La regla «una salida bloqueada por validación quita la confirmación» era redundante** y se
     retiró: un valor inválido es siempre un cambio respecto de lo guardado (lo guardado fue válido),
     así que el formulario ya está sucio y la confirmación ya está oculta. La prueba que la cubre
     (`EditProfilePage.test.tsx`, «salir de un campo con el nombre vacío…») no aísla esa regla por la
     misma razón: para llegar a un valor inválido hay que editar, y editar ya oculta la confirmación.
   - **Mecanismo elegido:** `GeneralInfoForm` recibe el prop opcional `onDirtyChange(isDirty)` y lo
     llama cada vez que cambia `formState.isDirty`; `EditProfilePage` lo guarda en
     `isGeneralInfoDirty` (`useState`) y pinta la confirmación con
     `updateGeneralInfo.isSuccess && !isGeneralInfoDirty`. **No se usó `stores/unsavedChanges.store.ts`**
     aunque ya refleja `isDirty`: es un único booleano global para el diálogo de cerrar sesión (su TSDoc
     asume como máximo un formulario sucio montado), y atar la confirmación a él la volvería falsa en
     cuanto otro formulario esté sucio. El prop es local y exacto.

3. **Autoguardado al salir de cada campo, no del formulario entero (CA-2.3.13).**
   - **Hoy:** el `onBlur` está en el `<form>` (`GeneralInfoForm.tsx:193-197`) y solo dispara si
     `!event.currentTarget.contains(event.relatedTarget)`, es decir, cuando el foco sale del
     formulario completo. Pasar de «Nombre del perfil» a «Resumen profesional» con Tab no guarda. Las
     Observaciones de HU-2.3 dicen «al quitar el foco de "Nombre del perfil" o de "Resumen
     profesional"» (cada campo), y CA-2.3.13 pide guardar al «quitar el foco del campo».
   - **Después de CM-272:** salir de **cualquiera de los dos campos** ejecuta el mismo guardado
     (`trySave` sigue siendo el único punto de entrada, con la misma validación de zod y el mismo
     candado `isSubmittingRef` contra el doble envío). Si el valor es inválido, se muestra el
     mensaje del campo y no se guarda (CA-2.3.14, CA-2.3.8).
   - **Un guardado descartado durante el vuelo se reintenta una vez (defecto D2, 12-oct-2026).** Si un `blur`
     llega mientras un `PATCH` sigue en curso, el candado `isSubmittingRef` lo descarta; antes nadie lo
     reintentaba y lo escrito quedaba sin enviar hasta que el usuario volviera a entrar y salir de un campo
     (pérdida de datos si cerraba la pestaña). Ahora `trySave` deja una marca (`hasDiscardedSaveRef`) y, cuando
     el `PATCH` en curso **termina con éxito** y lo escrito desde entonces difiere de lo enviado, vuelve a
     entrar por `handleSubmit(trySave)`. Dos límites: **nunca dos `PATCH` a la vez** (el reintento corre cuando el
     candado ya está libre) y **nunca un bucle** (la marca la pone un evento del usuario, se consume en el
     reintento y, si el reintento falla, no se reintenta solo). Si lo escrito es inválido, el reintento valida
     y muestra el mensaje, pero no envía. El `blur` que acompaña al clic de «Guardar borrador» (mismos valores)
     no genera segundo `PATCH`.
   - **Observación, sin perseguirla en esta tarjeta:** tras el `reset`, `react-hook-form` emite `isDirty` en
     `false` y lo corrige en el render siguiente (`useForm` recalcula `control._getDirty()` en un efecto;
     react-hook-form 7.87.0, `dist/index.esm.mjs:3391-3398` y `:3673-3682`). Si se escribió algo en vuelo, el
     formulario vuelve a quedar sucio y el siguiente `blur` lo envía; pero «Cambios guardados.» **puede
     parpadear unos milisegundos** entre las dos emisiones. Es inofensivo y es la causa de que la prueba `k2`
     fuera frágil bajo carga (por eso ahora solo protege que no se pierda lo escrito).
   - **Test existente `GeneralInfoForm.test.tsx:163-173`** («tabular entre Nombre y Resumen (dentro del
     formulario) no guarda»): su cuerpo **sigue siendo cierto** con el comportamiento nuevo, porque ese
     Tab no cambia nada y la compuerta `isDirty` (punto 4) lo frena; lo que dejó de describir la regla
     real es su nombre. Se dejó intacto.
   - **Los campos ya no se deshabilitan mientras se guarda — restricción no negociable cumplida.** Antes
     recibían `state="disabled"` durante la mutación (`Input` lo traduce al atributo `disabled`,
     `Input.tsx:111`, `:125`, `:136`); con guardado por campo, tabular de Nombre a Resumen dispara el
     `PATCH` y habría deshabilitado el campo que acaba de recibir el foco. **Se retira el prop
     `isSaving` de `GeneralInfoForm`** (cambio de interfaz del organismo): su único uso era ese
     deshabilitado y `EditProfilePage` dejó de pasarlo. «Guardar borrador» sí sigue bloqueando la
     barra mientras guarda (`isSavingDraft`, `ProfileActionsBar`).
   - **Lo escrito mientras el `PATCH` está en vuelo no se pierde (`keepDirtyValues`).** Tras un guardado
     exitoso, `trySave` llama `reset(values, { keepDirtyValues: true })` en vez de `reset(values)`:
     lo **enviado** pasa a ser la nueva referencia de «sucio», pero lo que el usuario ya tiene
     escrito y es distinto de eso se conserva. Sin `keepDirtyValues`, `reset` sobrescribe los campos
     con lo enviado y borra lo tecleado durante el vuelo (lo demostró la prueba `k2`).
     - **Efecto colateral, explícito y correcto:** si se escribió algo durante el vuelo, el formulario
       **sigue sucio** tras el guardado y el siguiente `blur` **reenvía**. Es lo honesto: lo escrito en
       vuelo aún no está guardado.
     - **Alternativa descartada:** bloquear los campos durante el vuelo. Se descartó porque **impide
       escribir** (y, para el campo con foco, le quita el foco), que es justo el daño que se evita.
     - **Origen de la regla:** salió de la prueba `k2`, no del backlog. Es una consecuencia del
       autoguardado por campo que el backlog no previó; por eso se escribe aquí y en D-J.
   - «Guardar borrador» se conserva como respaldo explícito y **siempre envía** (no consulta el punto
     4): el criterio de «distinto del guardado» es de la regla de guardado automático, no del botón.
     El `blur` que el clic en el botón provoca y el `submit` siguen protegidos por `isSubmittingRef`:
     un solo `PATCH` si el formulario tiene cambios.

4. **No enviar `PATCH` si no hay cambios (CA-2.3.13).**
   - **Hoy:** el `onBlur` llama a `handleSubmit(trySave)()` incondicionalmente
     (`GeneralInfoForm.tsx:195`); `isDirty` aparece en `GeneralInfoForm.tsx` solo en comentarios y en
     el efecto de `:160-161`. Salir del formulario sin haber cambiado nada también envía un `PATCH`
     y vuelve a mostrar «Cambios guardados.», contra la Observación «con un valor válido **y
     distinto del guardado**».
   - **Decisión (D-J, §9):** el guardado automático solo se envía si `formState.isDirty` es
     `true`, **a nivel de formulario**, no `dirtyFields` por campo. Razón: el `PATCH` envía
     `name` y `summary` juntos (`profile.api.ts:57`), así que distinguir qué campo cambió no cambia
     lo que viaja; `isDirty` del formulario responde exactamente a «¿hay algo distinto de lo último
     guardado?», porque `reset(values)` tras un éxito (`GeneralInfoForm.tsx:225`) mueve el punto de
     referencia al valor confirmado. En un fallo no hay `reset`: el formulario sigue sucio y la
     siguiente salida de campo reintenta (comportamiento ya vigente y probado, `:197-212`).
   - **La compuerta `isDirty` es sobre el ENVÍO, no sobre la validación (defecto B, 12-oct-2026).** La primera
     versión de CM-272 salía de `autosaveOnFieldBlur` si el formulario estaba limpio, antes de validar: en un
     perfil recién creado (nombre vacío) entrar al campo y salir sin escribir ya no mostraba «Ingresa un nombre
     para el perfil.», que antes de CM-272 sí aparecía. El backlog pide «distinto del guardado» solo para el
     guardado automático con valor **válido**; con valor inválido pide solo «mostrar el mensaje del campo y no
     guardar» (Observaciones de HU-2.3, CA-2.3.14). Ahora salir de un campo **siempre valida**
     (`trigger()` si el formulario está limpio, `handleSubmit` si está sucio) y solo el `PATCH` exige cambios.
   - **Acoplamiento con el aviso de cambios sin guardar — verificado, no se altera.**
     `stores/unsavedChanges.store.ts` ya depende de `formState.isDirty`
     (`GeneralInfoForm.tsx:185-186`; se limpia al desmontar, `:192-194`) y su **único consumidor de
     producción** es `layouts/AppShell.tsx:118` y `:149-151`, que elige el texto del diálogo de
     cerrar sesión (`auth:menu.confirmacion.mensajeConCambiosSinGuardar` o el normal). No existe
     ningún aviso al navegar ni `beforeunload`/`useBlocker`/`usePrompt` en `src`. Este cambio no toca
     el store ni a `AppShell`: sigue cierto que tras un guardado exitoso la bandera baja y que tras
     uno fallido se mantiene en `true`. Tests que lo cubren hoy:
     `stores/unsavedChanges.store.test.ts:14-30`, `GeneralInfoForm.test.tsx:197-212` y
     `:214-249`, `layouts/AppShell.test.tsx:161-173`.

**Criterios de HU-2.3: estado y cierre con CM-272.** Los 12 CA vigentes del Sprint 2 (CA-2.3.2 y
CA-2.3.6 son «N/A en el MVP» por el propio backlog: dependen de HU-2.8 y HU-2.14, y no se tocan).
«Estado actual» es lo que decía el código de `develop` (`4b3f915`) **antes de CM-272**, por
lectura. «Al terminar CM-272» ya refleja la implementación, con las pruebas del bloque en verde (67 de
67); no sustituye la prueba de QA. **ABIERTO** significa que, al terminar CM-272, el criterio **no** puede darse por
cumplido; QA prueba el backlog literal, no este SPEC (lección de DF-004).

| CA | Estado actual (por lectura) | Qué hace CM-272 | Al terminar CM-272 |
| -- | --------------------------- | ---------------- | ------------------ |
| CA-2.3.1 | El `PATCH` sale (`GeneralInfoForm.tsx:192` → `profile.api.ts:57`); la confirmación sale de `EditProfilePage.tsx:530-532` con el literal `profile.json:50`. | Solo cambia cuándo desaparece la confirmación (punto 2). | **ABIERTO**: DF-007 lo toca y no se verificó en staging (ver «Fuera de alcance»). |
| CA-2.3.3 | PARCIAL: `maxLength` impide escribir el carácter 2001; «2001 / 2000 caracteres» no se produce. | Quita el `maxLength` del resumen: se puede escribir de más, el contador pasa a rojo con «2001 / 2000 caracteres», sale el mensaje bajo el campo y no se guarda (ni con el autoguardado). | CERRADO (C-19 resuelto). |
| CA-2.3.4 | El cliente envía `"summary": ""` (`generalInfo.schema.ts:14`, `profile.api.ts:57`); el servidor lo borra en Borrador (`ProfileAppService.java:94-99`). No verificable sin ejecutar. | Nada. | **ABIERTO**: es DF-007 (C-21). |
| CA-2.3.5 | Cumple por lectura: mismo camino que CA-2.3.1, sin lógica que dependa del estado Activo. | Nada. | CERRADO (por lectura). |
| CA-2.3.7 | Cumple por lectura: `maxLength` 2000 admite exactamente 2000. | Sin `maxLength`, 2000 exactos siguen guardándose (prueba de guarda por abajo). | CERRADO. |
| CA-2.3.8 | Cumple por lectura: `trim().min(1)` (`generalInfo.schema.ts:13`) → `nameErrorRequired` (`GeneralInfoForm.tsx:208-209`), literal `profile.json:39`. | Nada. | CERRADO (por lectura). |
| CA-2.3.9 | Cumple por lectura: `maxLength` 255 admite exactamente 255. | Sin `maxLength`, 255 exactos siguen guardándose (prueba de guarda por abajo). | CERRADO. |
| CA-2.3.10 | PARCIAL: `maxLength` impide escribir el carácter 256; el mensaje de `profile.json:40` solo se alcanza con un cambio programático. | Quita el `maxLength` del nombre: con 256 caracteres sale «El nombre no puede superar los 255 caracteres.» y no se guarda. | CERRADO (C-19 resuelto). |
| CA-2.3.11 | NO CUMPLE: el `403` del `PATCH` no produce ningún mensaje (punto 1) y el `403` de la **carga** de un perfil ajeno cae en el genérico (`EditProfilePage.tsx:157`). | Mensaje por `PROFILE_NOT_ALLOWED` con `errors:codigos.NOT_FOUND` en **las dos rutas**, guardado y carga. | CERRADO en código; la verificación real depende de C-18 (que el `code` llegue en staging). |
| CA-2.3.12 | NO CUMPLE: el `422` no produce mensaje y la frase no existe en i18n; además, tras el rechazo el campo quedaba vacío y cada salida reintentaba el guardado. | Llave nueva `profile:general.resumen.errorPerfilActivo` y mensaje por `SUMMARY_NOT_ALLOWED`; **interpretación (13-oct-2026):** «conservar el resumen» incluye la pantalla, así que el campo vuelve a mostrar el resumen guardado, solo para ese `code` (punto 1). | CERRADO en código; igual dependencia de C-18. |
| CA-2.3.13 | PARCIAL: guarda solo al salir del formulario completo (`GeneralInfoForm.tsx:193-197`) y sin mirar `isDirty`. | Puntos 3 y 4. | CERRADO. |
| CA-2.3.14 | PARCIAL: no hay `PATCH` con nombre vacío, pero la confirmación anterior queda visible (`EditProfilePage.tsx:530`) y solo se valida al salir del formulario completo. | Puntos 2 y 3; defecto B: validar siempre al salir del campo (la primera versión no validaba una salida sin cambios). | CERRADO. |

**Fuera de alcance de CM-272 — todos ABIERTOS (nunca «cumple»).**

- **Campos de HU-2.4 y del registro: siguen con el tope, pendiente y fuera de esta tarjeta.** C-19 se resolvió
  para los dos campos de HU-2.3, pero el mismo patrón sigue en `WorkExperienceSection` (descripción, `maxLength`
  500), `RegisterForm` (nombre y apellido 120, correo 254) y, **sin** `maxLength` pero **sin mensaje de
  longitud**, en cargo, empresa, institución y título obtenido. Son otras tarjetas (HU-2.4: del mismo autor;
  registro: de Sofía) y el tester dirá si cumplen cuando los pruebe. Ver el censo de `maxLength` del
  13-oct-2026.
- **Observación de usabilidad abierta (probada en local el 13-oct-2026): el mensaje de error del
  guardado puede quedar fuera de la pantalla.** `EditProfilePage` pinta el aviso de error (y la
  confirmación) debajo de todas las secciones y encima de la barra de acciones
  (`EditProfilePage.tsx:580-584`); con el formulario completo hay que bajar para verlo. No se arregla en
  CM-272: no es un criterio del backlog y dónde mostrarlo es una decisión de diseño de una página que
  comparten HU-2.4, 2.5 y 2.11. Queda abierta.
- **Desalineación del mock `profiles.handlers.ts` (C-20).** El `PATCH` del mock valida el nombre con
  `400` sin `code` (`:235`, `:376`), mientras el servidor real responde `422 VALIDATION_FAILED`
  (`ErrorCatalog.java:56`); no tiene rama de perfil Activo que vacíe el resumen
  (`SUMMARY_NOT_ALLOWED`), ni de perfil ajeno (`PROFILE_NOT_ALLOWED`), ni valida el largo del
  resumen. Alinearlo puede romper pruebas de HU-2.4, 2.5 y 2.11, que comparten ese mock. CM-272 **no
  modifica lo que el mock ya hace**; tarea propia.
- **DF-007 (C-21).** «Vaciar el resumen y guardar muestra confirmación, pero al recargar reaparece
  el resumen anterior» (CP-050/EJ-036 y CP-056/EJ-038 **del libro de pruebas del Sprint 1**, probado el 26-09-2026 contra staging con
  `cameia-web@a3e46cb`). Hallazgos por código: el servidor ya borra `"summary": ""` en Borrador
  desde el commit `66eccda` de `cameia-perfil` (8-oct; antes de él, `new
  ProfessionalSummary(cmd.summary())` rechazaba el blanco), reforzado por `5b79f13` (10-oct); el
  cliente envía `""` (ni `null` ni lo omite) y solo confirma tras un 2xx (`EditProfilePage.tsx:530`).
  **Por código no se ve causa hoy y, aun así, NO se declara cerrado:** requiere comprobarlo contra
  staging (si `9355f1a` está desplegado, qué responde el `GET` tras el `PATCH`).
- **`preferredModality`.** No aparece en ningún CA de HU-2.3 (sí en el contrato de `PATCH`; ya está
  en `ProfileDto`, `profile.dto.ts:117`, sin consumidor). Pregunta abierta al PO; ver **C-09**.
- **Observación menor sobre `getItemErrorMessage`.** Indexa `byCode` con `error.code`
  (`EditProfilePage.tsx:211`, `:214`) sobre un objeto literal, así que un `code` llamado
  `constructor` o `toString` devolvería una propiedad del prototipo. Hoy no ocurre (los códigos
  reales son `UPPER_SNAKE_CASE`). No es de esta tarjeta; solo se anota.
- **Actualización (16-oct-2026, CM-273 PR 2).** La viñeta «Campos de HU-2.4 y del registro: siguen con el tope» de esta lista
  deja de ser cierta con el PR 2 de CM-273: la descripción de `WorkExperienceSection` pierde su `maxLength` y cargo, empresa,
  institución y título obtenido ganan su mensaje de longitud (CA-2.4.12, 18 y 28). Ver §3.3 («Alcance de CM-273 · PR 2») y
  D-X en §9. El texto de arriba se conserva como historia.

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
  `TECHNICAL`/`UNDERGRADUATE`/`POSTGRADUATE`), Título obtenido, Institución, Fecha de inicio, Fecha de
  fin (oculta si «En curso»; el frame dibujaba «Año de finalización», D-S), checkbox «En curso». «Campo de estudio» y «Fecha de inicio»
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
  día al enviar (`model/yearMonth.ts`) — bloqueo **C-14** (§8). **Estado anterior a CM-273:** el PR 1
  de CM-273 reemplaza ese control por `MonthField` y cierra C-14; ver «Alcance de CM-273 · PR 1» al
  final de esta sección.

**Estados**

| Estado      | Qué muestra                                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Carga       | Comparte el `Spinner` de §3.2: ambas secciones llegan en la misma respuesta de `GET /api/v1/profiles/:id` |
| Vacío       | `EmptyState` propio por sección: ambas listas pueden estar vacías — experiencia sin ítems es válido; educación sin ítems bloquea la finalización (CM-65), no esta pantalla |
| Error       | Alta/baja fallida → mensaje específico si el `httpStatus` de *esa* mutación lo tiene (422 = fecha inválida), si no el genérico de la sección (ver §4, `ADR-0007`); el formulario conserva lo escrito para reintentar |
| Sin permiso | Ver nota transversal arriba                                                                                                               |

**Validaciones del lado del cliente**

- Educación: nivel/título/institución/fecha de inicio obligatorios; «En curso» oculta y limpia la
  fecha de finalización; fecha de fin anterior a la de inicio bloquea (salvaguarda de UX — el
  backend real, `Education.java`, no exige esta regla, a diferencia de Experiencia Laboral).
- Experiencia Laboral: cargo/empresa/fecha de inicio obligatorios; descripción ≤ 500 caracteres
  (`WorkExperience.MAX_TEXT_LENGTH` real — el frame dibuja un contador en 1000, bloqueo **C-13**,
  §8); sin ningún checkbox marcado, la fecha de fin es obligatoria y no puede ser anterior a la de
  inicio (`WorkExperience.java`, regla real); con cualquiera marcado, la fecha de fin no se pide.

**Alcance de CM-273 · PR 1 (HU-2.4, 14-oct-2026) — IMPLEMENTADO (15-oct-2026), con pruebas en verde.**
Esta sección se escribió **antes** que el código y que las pruebas (SDD, paso 3) y se actualizó al
implementar: el PR 1 existe y la suite completa pasa (119 archivos, 710 pruebas; `typecheck` y `lint` sin
errores; cobertura global 91,4 % de sentencias). Lo que sigue en futuro («previsto», «Previsto:») describe el
diseño que se implementó; el estado real de cada criterio está en la tabla de abajo (16 CUMPLIDO en el
cliente y 2 —CA-2.4.20 y CA-2.4.31— verificados en local contra el backend real). El responsable
verificó a mano los 18 criterios en local, con el backend real y MSW apagado, y los 18 pasan; **staging
queda pendiente** tras el merge. «Hoy» y las citas
`archivo:línea` describen `develop` en `f8399a5`, antes de CM-273. La tarjeta se entrega en **dos PR**;
el PR 2 se abre después de que el PR 1 esté en `develop`. **CM-273 contrastó los 57 criterios vigentes de
HU-2.4 con el backlog v7** (hoja HE-02, filas 41 a 99), a través del documento de criterios
`13102026_01_HU-2_4_criterios_backlog_v7.md`, actualizado el 14-oct-2026 con la aprobación del PO de
«ocultar» el campo «Fecha de fin» (seis celdas de HE-02). El resto de §3.3 **no** se recontrastó.

Alcance del PR 1: **CA-2.4.2, 3, 6, 14, 20, 24, 25, 26, 30, 31, 33, 34, 35, 43, 44, 54, 55 y 60** (18 de los
51 criterios con trabajo de front).

1. **Las cuatro entradas de fecha pasan a una molécula nueva, `MonthField`.**
   - **Hoy:** son `<Input type="date">` (selector nativo con día): inicio y fin de experiencia
     (`WorkExperienceSection.tsx:243-249`, `:270-276`) e inicio y fin de formación
     (`EducationSection.tsx:278-284`, `:302-308`). No existe un campo «mm/aaaa»; no se puede escribir
     «13/2024»; el día se descarta al enviar (`toYearMonth`, `yearMonth.ts:17-24`).
   - **Previsto:** `MonthField` (design system, `MonthField.tsx`, ver §7) tiene **dos partes, las dos
     obligatorias**: (a) una entrada de texto con máscara «mm/aaaa», que se puede teclear, y (b) un panel
     flotante para elegir mes y año: rejilla de 12 meses y flechas de año, **sin días**. Envuelve el átomo
     `Input` **sin modificarlo**; acepta `id` y `describedBy` (los inyecta `FormField`) y reenvía la
     referencia para que el foco automático al primer error siga funcionando. Los textos entran como
     propiedades (`CLAUDE.md` §14.7).
   - **Panel (D-N):** del año actual hacia atrás 110 años; los meses futuros se muestran apagados; no usa la
     fecha de nacimiento. Cierra con `Escape` devolviendo el foco al disparador y al salir del contenedor,
     con el patrón de `MenuUsuario` y `Combobox`.
   - **«Fecha de fin» sigue oculta** mientras alguna casilla de estado o «En curso» esté marcada (D-P): el
     backlog dice «oculta» desde el 14-oct-2026.
   - **Textos accesibles del panel y del campo** (abrir, título, año anterior, año siguiente, marcador de
     posición): **no están en el backlog**; son propuesta de Frontend y se fijan al escribir las pruebas en
     rojo, con su llave en `profile.json` (es-CO y en). No se inventan aquí.
2. **Qué valida el esquema y qué mensajes salen bajo el campo.** Los mensajes salen de las llaves de
   `profile.json`, nunca del servidor. Orden por campo (el de Perfil, `WorkExperience.java:149` y
   `Education.java:111`): vacío → obligatorio (cuando aplica); formato; mes futuro; fin anterior al inicio.
   - **Formato (CA-2.4.43, 44, 60):** un texto que no sea «mm/aaaa» válido (por ejemplo «13/2024»)
     muestra «Ingresa una fecha válida con el formato mm/aaaa.» bajo el campo en el que se escribió
     (inicio o fin) y no se guarda.
   - **Mes futuro (CA-2.4.25, 26, 34, 35):** una fecha posterior al mes actual en UTC muestra «La fecha no
     puede ser posterior al mes actual.» bajo ese campo y no se guarda. La máscara **sí** deja teclear un mes
     futuro; por eso estos criterios se comprueban en la interfaz (D-N).
   - **Fin anterior al inicio (CA-2.4.14, 30):** «La fecha de fin no puede ser anterior a la de inicio.»
     bajo «Fecha de fin», comparando por **mes y año** (RT-07-CA02), no por fecha completa. El mismo texto
     sirve a experiencia y a formación (CA-2.4.30 lo pide igual que CA-2.4.14): la llave de formación
     `educacion.fechaFin.errorAnterior` cambia a ese literal exacto (hoy dice «La fecha de finalización no
     puede ser anterior a la de inicio.»).
   - **Obligatorios (CA-2.4.2, 3, 6):** no cambian de comportamiento; reciben pruebas con los textos reales de
     es-CO.
   - **Positivos:** la fecha del mes actual y la del mes de cumplir 15 años o de nacer se aceptan en el
     cliente y se envían (CA-2.4.20, 24, 31, 33, 54, 55). La regla de edad y de nacimiento la aplica el
     servidor (`DateBounds.java:32` y `:42`); el cliente no consulta la fecha de nacimiento (D-N).
3. **Qué viaja y qué deja de existir.**
   - `MonthField` entrega al formulario el **texto** que muestra la máscara (por ejemplo «06/2024» o
     «13/2024»); el esquema de Zod valida «mm/aaaa» y **transforma a «AAAA-MM»** (D-K). El mapper deja de
     convertir fechas (`profile.mapper.ts:130-131` y `:157-158`) y `toYearMonth` se elimina (matiza D-F: la
     derivación de `employmentStatus` no cambia; el truncado de fecha desaparece).
   - Los esquemas pasan a ser una **función que recibe el mes actual en UTC** (D-M).
   - `formatYearMonth` **no cambia** en el PR 1: los periodos de la lista se siguen pintando como hoy
     (PR 2).
4. **Qué NO cambia en el PR 1.** El inicio de experiencia **sigue obligatorio** (pasa a opcional en el PR 2,
   junto con los periodos); no se tocan el mock `profiles.handlers.ts`, el texto de reserva de las altas, los
   periodos, las bajas, los topes de 4 y 5, las longitudes ni la guarda de doble envío; no se modifican
   `Input` ni `FormField`; no se toca ninguna línea de Ana Sofía (PR #69 y #72).
5. **Hipótesis de D-K: COMPROBADA en lo que toca a los valores (15-oct-2026).** Se esperaba que
   `zodResolver` entregara a `handleSubmit` los valores **ya transformados** por Zod, de modo que el mapper
   reciba «AAAA-MM» y no «mm/aaaa». La prueba
   `src/features/professional-profile/schemas/zodResolverTransform.test.ts`, ejecutada sola, pasó: desde el
   texto «06/2024» `handleSubmit` recibió «2024-06». Esa prueba usa un esquema mínimo propio, no los esquemas
   reales (que aún no existen). **Sigue sin comprobarse el tipado** (que el formulario declare valores de
   entrada y de salida distintos): la prueba lo escribe con los tres genéricos de `useForm`, pero no se
   corrió `tsc`.
6. **Origen del mes actual: RESUELTO (D-M, 14-oct-2026).** El mes actual en UTC lo calcula la **página**
   (`EditProfilePage`) y lo pasa a cada sección de experiencia y de formación como **propiedad**; la
   sección se lo entrega al esquema con `useMemo`. Las dos secciones comparten el mismo valor en un render
   y las pruebas de las secciones le pasan el mes directamente, sin congelar el reloj. **La función que lo
   calcula es `getCurrentUtcYearMonth` y vive en `src/utils/monthMask.ts`** (resuelto el 15-oct-2026). Esa
   función sí necesita una fecha controlada en su prueba (`src/utils/monthMask.test.ts`), y la página
   también (`EditProfilePage.test.tsx`, que fija solo `Date`), porque son las dos que leen el reloj.
7. **Propiedades y funciones nuevas — fijadas por las pruebas en rojo (14 y 15-oct-2026).** El SPEC no
   nombraba estas propiedades; los nombres salen de las pruebas escritas antes del código y se pueden
   renombrar si el equipo lo decide, cambiando también las pruebas.
   - **`MonthField`** (`MonthField.tsx`): `value` (el texto de la máscara), `onChange(texto)`, `onBlur`, `id`,
     `describedBy`, `state` (`default`, `error` o `disabled`), `placeholder`, `currentMonth` («AAAA-MM»; lo
     necesita para saber qué meses son futuros), `locale`, `openPanelLabel`, `panelLabel`,
     `previousYearLabel`, `nextYearLabel` y `ref` al `<input>` de texto. Estructura que las pruebas esperan:
     un disparador `type="button"` con `aria-expanded` y `aria-controls`; un panel `role="dialog"` cuyo nombre
     es `panelLabel`; 12 botones de mes con nombre accesible, con el atributo `disabled` en los meses
     posteriores al mes actual (la interpretación de «apagados»); dos botones de año, el siguiente
     deshabilitado en el año actual y el anterior deshabilitado 110 años atrás (1916 desde 2026).
   - **`WorkExperienceSection` y `EducationSection`:** `currentMonth` («AAAA-MM», lo calcula la página),
     `locale`, `monthFieldTexts` (objeto con `placeholder`, `openPanelLabel`, `panelLabel`,
     `previousYearLabel` y `nextYearLabel`), `dateErrorFormat` y `dateErrorFuture`. Se conservan
     `startDateErrorRequired`, `endDateErrorRequired` y `endDateErrorBeforeStart`.
   - **`src/utils/monthMask.ts`:** `maskMonthInput`, `parseMonthText` (devuelve `null` si no es «mm/aaaa»
     válido), `formatMonthValue` y `getCurrentUtcYearMonth`.
   - **Llaves de `profile.json`:** `profile:fechas.errorFormato` y `profile:fechas.errorPosteriorMesActual`
     (literales del backlog) y el cambio de literal de `profile:educacion.fechaFin.errorAnterior`. Las llaves
     del panel (marcador de posición, abrir, título, año anterior y siguiente) **no están fijadas**: no tienen
     literal en el backlog y ninguna prueba las vigila todavía.

**Criterios del PR 1.** «Estado antes de CM-273» es lo que decía el código de `develop` (`f8399a5`), por
lectura, sin ejecutar nada. «Estado real tras el PR 1» sale del análisis final (15-oct-2026): CUMPLIDO solo
si hay una prueba en verde que ejerce el criterio y el literal del backlog está carácter por carácter en
es-CO. QA prueba el backlog literal, no este SPEC (lección de DF-004). Que una prueba pase contra el mock no
prueba el servidor real: ningún criterio está verificado contra el servidor.

| CA | Estado antes de CM-273 (por lectura, `f8399a5`) | Qué hizo el PR 1 | Estado real tras el PR 1 (15-oct-2026; análisis final, Fase 6) |
| -- | --------------------------- | ---------------- | -------- |
| CA-2.4.2 | CUMPLIDO en la interfaz: `workExperience.schema.ts:52-54` → `WorkExperienceSection.tsx:261-263`, literal de `profile.json:120`; prueba `WorkExperienceSection.test.tsx:110`. | Sin cambio de comportamiento; la prueba se reescribe porque el campo cambia. | CUMPLIDO en el cliente: `WorkExperienceSection.test.tsx:138`; literal exacto en es-CO (`profile.json:131`). |
| CA-2.4.3 | PARCIAL: la cadena está (`workExperience.schema.ts:30-31` → `WorkExperienceSection.tsx:202`, `:221` → `profile.json:107`, `:112`) y no tiene prueba. | Prueba con «Empresa» y «Cargo» vacíos o solo con espacios. | CUMPLIDO en el cliente: `WorkExperienceSection.test.tsx:198` y `:213`; literales exactos en es-CO (`profile.json:123`, `:118`). |
| CA-2.4.6 | PARCIAL: la cadena está (`education.schema.ts:31-34`, `EducationSection.tsx:218`, `:238`, `:257`, `:276`, `profile.json:58`, `:66`, `:71`, `:75`); solo «Nivel educativo» tiene prueba (`EducationSection.test.tsx:104`). | Pruebas de institución, título y fecha de inicio vacíos o solo con espacios. | CUMPLIDO en el cliente: `EducationSection.test.tsx:131`, `:212`, `:225` y `:242`; literales exactos en es-CO (`profile.json:82`, `:77`, `:69`, `:86`). |
| CA-2.4.14 | PARCIAL: el mensaje sale (`workExperience.schema.ts:56-57`, `WorkExperienceSection.tsx:264-266`, `profile.json:121`) pero compara cadenas con día y no tiene prueba. | Compara «AAAA-MM» por mes y año; prueba. | CUMPLIDO en el cliente: `WorkExperienceSection.test.tsx:362`; literal exacto en es-CO (`profile.json:132`). |
| CA-2.4.30 | PARCIAL: el literal de `profile.json:79` dice «finalización»; compara con día; la prueba (`EducationSection.test.tsx:125`) pasa su propio texto. | Cambia `profile.json:79` al literal del backlog; compara por mes y año; prueba con el texto real. | CUMPLIDO en el cliente: `EducationSection.test.tsx:152`; literal exacto en es-CO (`profile.json:90`). La etiqueta del campo pasó de «Año de finalización» a «Fecha de fin» (`profile:educacion.fechaFin.etiqueta`, D-S), como nombra el criterio. |
| CA-2.4.20, CA-2.4.31 | PARCIAL: el cliente no valida edad ni nacimiento y deja pasar (correcto); sin prueba. | Prueba de que «03/2023» y «03/2008» se aceptan y viajan como «2023-03» y «2008-03». | VERIFICADO EN LOCAL contra el backend real (prueba manual, MSW apagado, cuenta nacida el 15/03/2008 con su fila en la réplica de la fecha de nacimiento): «03/2023» y «03/2008» se guardan con 201. Las pruebas automáticas (`WorkExperienceSection.test.tsx:396`, `EducationSection.test.tsx:394`) solo prueban que el cliente acepta y envía, y pasarían con cualquier fecha válida; el mock no modela la edad ni el nacimiento. **Staging PENDIENTE** (tras el merge), y depende de que la cuenta tenga su fila en la réplica (riesgo del backfill). |
| CA-2.4.24, CA-2.4.33, CA-2.4.54, CA-2.4.55 | PARCIAL: nada lo bloquea; sin prueba. | Pruebas con el mes actual M recibido por el esquema (D-M): M se acepta y se envía. | CUMPLIDO en el cliente (el 201 es del mock): `WorkExperienceSection.test.tsx:308` y `:325`, `EducationSection.test.tsx:321` y `:338`, y la de página `EditProfilePage.test.tsx:948` y `:970` con `Date` fijo. |
| CA-2.4.25, CA-2.4.26, CA-2.4.34, CA-2.4.35 | NO CUMPLIDO: no hay validación de mes futuro ni mensaje; el código `START_DATE_IN_THE_FUTURE` del servidor no está mapeado. | Validación en el esquema con el mes actual en UTC y mensaje bajo el campo (inicio o fin según el criterio). | CUMPLIDO en el cliente: `WorkExperienceSection.test.tsx:278` y `:293`, `EducationSection.test.tsx:292` y `:306`; literal exacto en es-CO (`profile.json:55`); la página lo muestra con el texto real solo en «Fecha de inicio» (`EditProfilePage.test.tsx:948`, `:970`). |
| CA-2.4.43, CA-2.4.44, CA-2.4.60 | NO CUMPLIDO: el control nativo no deja escribir «13/2024» y el mensaje no existe en es-CO ni en en. | `MonthField` con máscara + validación de formato en el esquema + llave nueva en `profile.json` (es-CO y en). | CUMPLIDO en el cliente: `WorkExperienceSection.test.tsx:231` y `:246`, `EducationSection.test.tsx:260` y `:274`; literal exacto en es-CO (`profile.json:54`). Ninguna prueba hace pasar esa llave por la página. |

**Pruebas que este SPEC exigió (escritas en rojo el 14 y 15-oct-2026; todas existen y están en verde).**

- **Primera (ya escrita; verde el 15-oct-2026):** la hipótesis del punto 5 (que el valor que llega a
  `handleSubmit` sea «AAAA-MM»), en `zodResolverTransform.test.ts`.
- **Página** (`EditProfilePage.test.tsx`): una prueba de D-M con la fecha fijada (solo `Date`, 1-nov-2026
  04:30 UTC y zona de Bogotá): la página calcula el mes actual en UTC y lo pasa a las dos secciones; noviembre
  se acepta y diciembre se rechaza en cada una.
- **Literales** (`src/i18n/profileDateMessages.test.ts`): los textos del backlog en `profile.json`.
- `MonthField.test.tsx` (nuevo): máscara al teclear, pegar y borrar; texto crudo hacia el formulario; panel
  (12 meses, flechas de año, meses futuros apagados, 110 años); `Escape` con retorno del foco; ARIA; el campo
  deshabilitado mientras se agrega.
- Prueba propia de la lógica pura de la máscara y de la conversión «mm/aaaa» ↔ «AAAA-MM» (D-L).
- Secciones: se reescriben las pruebas que escriben fechas (`WorkExperienceSection.test.tsx:65-90`,
  `:110-124`; `EducationSection.test.tsx:64-71`, `:81-102`, `:125-145`) y se agregan las de los criterios de
  la tabla. **No se tocan** `WorkExperienceSection.test.tsx:92-108` ni `EducationSection.test.tsx:115-123`
  (la fecha de fin sigue oculta) ni `WorkExperienceSection.test.tsx:126-131` (el tope de 500 caracteres es del
  PR 2).
- Página: los cuatro casos que escriben «Fecha de inicio» (`EditProfilePage.test.tsx`, el de formación de
  `:125-155` y los de finalización de `:238`, `:287` y `:343`): cambio mínimo de un valor por caso.
- Mapper y `yearMonth`: se quitan las pruebas del recorte (`profile.mapper.test.ts:52` y la parte de recorte de
  `:82`; `yearMonth.test.ts:9-21`); `formatYearMonth` (`yearMonth.test.ts:23-26`) sigue igual en este PR.
- Hooks de alta: los datos de entrada pasan a «AAAA-MM» (`useAddEducation.test.tsx`,
  `useAddWorkExperience.test.tsx`), lo que además los alinea con lo que ya exige el mock.

**Fuera de este PR — todos ABIERTOS (nunca «cumple»).**

- **Criterios del PR 2 (33):** CA-2.4.1, 7, 8, 10, 11, 12, 13, 15, 17, 18, 19, 21, 22, 23, 27, 28, 29, 32, 36,
  37, 38, 39, 42, 46, 47, 48, 49, 51, 52, 53, 56, 58 y 59. Se describen en el SPEC del PR 2. CA-2.4.1 y 7 no
  se cierran en el PR 1: necesitan el formato de periodo.
- **Solo backend (6):** CA-2.4.5, 9, 16, 40, 41 y 57. El cliente no puede generar el caso.
- **Aplazados al Sprint 4 (2):** CA-2.4.45 y CA-2.4.50 (`Idempotency-Key`). La guarda de doble envío
  (RT-06-CA01) entra en el PR 2, no en este.
- **Desalineación del mock `profiles.handlers.ts` (C-20):** se mantiene fuera de CM-273; el PR 1 no toca el mock.

**Alcance de CM-273 · PR 2 (HU-2.4, 16-oct-2026) — IMPLEMENTADO (16-oct-2026), pendiente de la prueba manual y de QA.**
Este bloque se escribió **antes** que las pruebas y el código (SDD, paso 3) y se actualizó al cerrar la
implementación (paso 5) con el análisis final (Fase 8 de `analisis/13102026_01_CM-273_analisis_lectura.md`,
fuera del repositorio). Las citas `archivo:línea` de los apartados «**Hoy**» describen `develop` en `4579675`
(PR 1 ya mergeado), **antes** de este PR: son la historia del defecto, no el estado actual. CUMPLIDO significa
**en el cliente y contra el mock**, con prueba en verde y literal exacto del backlog en es-CO (y la llave en
`en`); ningún criterio está verificado contra el servidor real. Las decisiones del 16-oct-2026 son D-T a D-AH
de §9 (D-AH, texto largo sin espacios en la tarjeta, salió de la prueba manual); aquí se citan por esa letra.

**Contraste con el backlog (nota fijada el 16-oct-2026).** HU-2.4 contrastada con la v7 y comprobada por el
autor contra la v8.1: los 59 criterios no cambian en Dado, Cuando, Entonces, tipo ni prototipo; la v8.2 solo
cambia «deshabilitar» por «ocultar» en Fecha de fin. La columna O41 trae además literales de caracteres de
control, fuera de CM-273. El campo `backlog` del encabezado no cambia (D-Z).

Alcance del PR 2: **CA-2.4.1, 7, 8, 10, 11, 12, 13, 15, 17, 18, 19, 21, 22, 23, 27, 28, 29, 32, 36, 37, 38,
39, 42, 46, 47, 48, 49, 51, 52, 53, 56, 58 y 59** (33 de los 51 criterios con trabajo de front) **más la guarda
de doble envío** (RT-06-CA01, lección de DF-004; no es un criterio numerado). Estado al abrir el PR: 0
CUMPLIDO, 12 PARCIAL (CA-2.4.1, 7, 8, 13, 17, 19, 21, 27, 29, 32, 48, 49) y 21 NO CUMPLIDO. **Estado al cerrar la
implementación (16-oct-2026): 33 CUMPLIDO, 0 PARCIAL, 0 NO CUMPLIDO**, con 820 pruebas en verde (120 archivos),
`typecheck`, `lint` y `format:check` limpios, `build` correcto y cobertura global de 92,34 % de líneas (91,96 % de
sentencias). La prueba manual contra el backend real (guía `pruebas-manuales/16102026_01_CM-273_PR2_guia.md`,
fuera del repositorio) y QA siguen **PENDIENTES**.

**Qué hace el PR 2, por tema (los criterios van en las tablas de abajo).**

1. **Periodos (CA-2.4.1, 7, 8, 13, 15, 29, 42, 56).**
   - **Hoy:** `PAGE:258-266` y `:268-280` pintan «junio de 2024 - actual» (`formatYearMonth`, `yearMonth.ts:16-27`,
     `Intl` con mes largo; plantillas `profile.json:97-98` y `:145-147`, con guion corto «-»); un fin nulo de
     formación se pinta «—» (`PAGE:265`); con `startDate` nulo `formatYearMonth` lanza en `yearMonth.ts:17`
     (hipótesis leída, no reproducida).
   - **Implementado:** los periodos usan «mm/aaaa» y el separador «–». Formas exigidas por el backlog:
     «06/2024 – actual», «02/2025 – en curso», «02/2025 – Sin fecha de fin», «Sin fechas», «Sin fecha de
     inicio – actual», «06/2024 – Fin no registrado», «05/2024 – 05/2024» y «02/2025 – 02/2025».
     Según el estado y la presencia de fechas:
     - experiencia `CURRENT`: `periodoActual` con el inicio; sin inicio, con la pieza «Sin fecha de inicio»;
     - experiencia `UNKNOWN_END`: con inicio, `periodoFinDesconocido` («{{inicio}} – Fin no registrado»); sin
       inicio, «Sin fechas» (llave `experiencia.periodoSinFechas`);
     - experiencia `ENDED`: `periodo` («{{inicio}} – {{fin}}»); sin inicio, con la pieza «Sin fecha de inicio»
       en lugar del inicio, es decir «Sin fecha de inicio – 06/2024» (D-U);
     - formación: `periodoEnCurso`, `periodo` y, con fin nulo, `educacion.periodoSinFin`
       («{{inicio}} – Sin fecha de fin»).
   - **La pieza «Sin fecha de inicio»** es una llave nueva (`experiencia.sinFechaInicio`) que CA-2.4.42 ya obliga
     a crear; el periodo «Sin fecha de inicio – actual» sale de `periodoActual` con la pieza como `inicio`. Con
     ella, el periodo de una experiencia terminada sin inicio no necesita ningún literal que el backlog no
     tenga (D-U).
   - **Punto de implementación resuelto (no era decisión del PO):** el texto «mm/aaaa» de cada mes sale de
     `formatMonthValue` (`src/utils/monthMask.ts:53`, ya probado, igual en los dos idiomas) y no de `Intl`
     (`CLAUDE.md` §7 pide `Intl` para fechas; el PR 1 ya usa funciones manuales en `monthMask.ts`, D-L). Los dos
     formateadores son `formatWorkExperiencePeriod` y `formatEducationPeriod` en `model/yearMonth.ts`, con la
     firma `(item, t)`. `formatYearMonth` quedó sin consumidores y se borró con su prueba.
   - Los textos en inglés son traducción de trabajo (`CLAUDE.md` §7).
2. **Inicio opcional de experiencia (CA-2.4.15, 22, 23, 53).**
   - **Hoy:** `WorkExperience` exige el inicio en tres sitios: `workExperience.schema.ts:45` (`z.string().min(1)`),
     `profile.mapper.ts:156` (`startDate: values.startDate`) y los tipos (`profile.types.ts:75`,
     `profile.dto.ts:62` y `:141`, `string`); el mock lo exige en `profiles.handlers.ts:427`. El servidor ya lo
     acepta (`WorkExperience.java:138-140`) y, sin ninguna fecha, no lee la réplica (`ProfileAppService.java:159-161`).
   - **Implementado:** el esquema deja de exigirlo (el resto ya servía: `workExperience.schema.ts:52-53` no valida un
     inicio vacío y `:80` solo compara si hay inicio); el mapper envía `null` si está vacío; `WorkExperienceDto.startDate`,
     `AddWorkExperienceRequestDto.startDate` y `WorkExperienceItem.startDate` admiten `null` (solo ensanchan).
     El mock acepta `startDate` ausente o nulo. «Fecha de inicio» deja de ser obligatoria en la experiencia y
     sigue obligatoria en la formación.
3. **Longitudes y contador (CA-2.4.12, 17, 18, 19, 27, 28).**
   - **Hoy:** los campos solo pintan texto con el error `too_small` (`WES:240`, `:259`; `EDS:256`, `:276`, `:295`),
     así que un exceso deja el campo en rojo sin texto; los cuatro mensajes de «no puede superar» no existen
     en es-CO ni en en; la descripción lleva `maxLength` (`WES:383`) y el contador usa `field.value.length`
     (`WES:388`).
   - **Implementado:** llaves nuevas `experiencia.empresa.errorLongitud`, `experiencia.cargo.errorLongitud`,
     `experiencia.descripcion.errorLongitud`, `educacion.institucion.errorLongitud` y
     `educacion.tituloObtenido.errorLongitud` (literales del backlog); las secciones reciben el texto por
     propiedad (`positionErrorTooLong`, `companyErrorTooLong`, `descriptionErrorTooLong`, `degreeErrorTooLong` e
     `institutionErrorTooLong`) y lo pintan cuando el error es de largo (`too_big` en empresa, cargo, institución y
     título; el código interno nuevo `DESCRIPTION_TOO_LONG` en la descripción). **Descripción (D-X):** se quita el `maxLength` de `WES:383`; la
     validación (`workExperience.schema.ts:47`, línea propia de CM-61) y el contador usan `unicodeLength`
     (`src/utils/unicodeLength.ts`, de Sofía: solo se importa; el `import` va como línea nueva, sin editar
     el bloque `:23-27`). Con 501 caracteres se ve «501 / 500 caracteres», el mensaje bajo el campo y no se guarda.
   - **No se tocan** `workExperience.schema.ts:43-44` ni `education.schema.ts:44-45` (los `.max` de Sofía, que
     cuentan UTF-16: más estrictos que el servidor, nunca más laxos). Dentro del mismo formulario quedan
     entonces dos medidas; se anota aquí y queda como diferencia conocida.
   - **La prueba de `WorkExperienceSection.test.tsx:159-163`, que exigía `maxlength="500"`, contradecía el
     backlog y se reescribió** (hoy es la de `WE:173`: el campo no impone `maxlength`).
4. **Topes de 4 experiencias y 5 formaciones (CA-2.4.10, 47, 48, 49).**
   - **Implementado (D-V, D-AB):** dos constantes nuevas en `profile.constants.ts`, como adición pura **fuera de las
     líneas `:62-63` y `:65-69` de Sofía** (después de `SKILLS_MAX_COUNT`, `:69`; el SPEC previo las situaba «junto
     a `:64`», que cae dentro del rango de Sofía): `WORK_EXPERIENCE_MAX_COUNT` = 4 y `EDUCATION_MAX_COUNT` = 5. Cada
     sección recibe `maxItems` y `maxItemsMessage` **opcionales** (sin ellos no hay tope; la página **tiene** que
     pasarlos y lo vigilan pruebas de página: quitar `maxItems` de una sección hace fallar dos pruebas de `PG`). El
     texto es el existente `errorLimite` (`profile.json`, de Sofía, solo se lee) en un `AlertInline variant="info"`.
     Con `items.length >= maxItems` el formulario sigue visible, **«Agregar…» queda deshabilitado** y el mensaje se
     ve; `onSubmit` además no envía (Enter dentro de un campo envía el formulario aunque el botón esté
     deshabilitado; precedente `SkillsSection.tsx:142`), y lo comprueba antes de validar, así que no muestra errores.
   - **El 409 se sigue manejando** (segunda pestaña, CA-2.4.48 y 49): `WORK_EXPERIENCE_LIMIT_REACHED`
     y `EDUCATION_LIMIT_REACHED`, tablas de Sofía que no se editaron, ahora con prueba (`PG:1563`, `PG:1580`).
     Tras ese 409 **no se refresca el perfil** (decisión por defecto, sin objeción; ningún criterio lo pide).
   - **Tensión anotada con `CLAUDE.md` §3.7** («ninguna constante de negocio se hardcodea»): hay dos
     precedentes en el mismo archivo (`SKILLS_MAX_COUNT` `:69`, `MAX_TARGET_ROLES` `:84`) y el backend no
     publica los máximos en ninguna respuesta (los fija `ProfessionalProfile.java:42,44`), así que «que lleguen
     del backend» no es posible sin cambiar el contrato. Las constantes pueden desfasarse del servidor; por eso
     el 409 sigue siendo la verdad final.
5. **Bajas (CA-2.4.11, 37, 38, 39, 46, 51, 58, 59).**
   - **Hoy:** las bajas muestran siempre el texto fijo `errorEliminar` (`PAGE:375-377`, `:449-451`);
     `confirmacionEliminada` (`profile.json:104`, `:153`) no tiene consumidor; el literal de CA-2.4.37 y 51 no
     existe; `PROFILE_NOT_ALLOWED` no se mapea en ninguna de las cuatro rutas.
   - **Implementado:** la página resuelve el mensaje de cada baja por `code` con una **tabla propia**
     (`findMessageByCode`, fuera del componente; no se editaron las tablas ni `getItemErrorMessage`, de Sofía): `EDUCATION_NOT_ALLOWED` (409) → llave nueva
     `educacion.errorUltimaFormacion` («No puedes quedarte sin formación académica con el perfil activo. Agrega
     otra antes de eliminar esta.»); `EDUCATION_NOT_FOUND`, `WORK_EXPERIENCE_NOT_FOUND` (404) y
     `PROFILE_NOT_ALLOWED` (403) → `errors:codigos.NOT_FOUND` («No encontramos lo que buscabas.»). El 403 de
     las altas (CA-2.4.39) se resuelve igual, con la tabla propia consultada **antes** de la de Sofía.
   - **Reserva (D-W):** sin `code` conocido, las bajas muestran `errors:generico`, y `errors:red` si el error no
     es un `ApiError`, el mismo ternario de las altas e Información General.
   - **Confirmación y errores (D-AA, D-AD):** cada sección muestra **un solo mensaje, el de su última acción**
     (alta o baja, éxito o error): «Formación eliminada.» / «Experiencia eliminada.» tras una baja correcta,
     «…agregada.» tras un alta correcta, y el error de la última acción si falló. Mientras la última acción está
     en curso no se muestra ninguno. Se conserva en la página como estado «última acción» por sección
     (`lastEducationAction` y `lastWorkExperienceAction`: `'add' | 'remove' | null`).
6. **Errores del servidor bajo el campo (CA-2.4.21, 23, 32).**
   - **Hoy:** salen en el `AlertInline` de la sección (`WES:225`, `EDS:241`); `errors[].field` no se usa
     (`ApiError.ts` ya lo expone).
   - **Implementado (D-T):** la **página** traduce `errors[]` a un mapa campo → texto (`findFieldErrors`), con una
     tabla propia código→campo (`START_DATE_BEFORE_MINIMUM_AGE` → inicio, `END_DATE_BEFORE_MINIMUM_AGE` → fin,
     `START_DATE_BEFORE_BIRTH` → inicio) y las llaves ya existentes (`errorFechaEdadMinima`, `errorFechaFinEdadMinima`,
     `errorFechaAnteriorNacimiento`), y lo pasa a la sección en la propiedad nueva `serverFieldErrors`, que se
     memoriza en la página por la identidad del error de la mutación; la sección lo aplica con `setError`
     (`type: 'server'`) de react-hook-form y
     **no decide textos**. Si el error produjo mensajes de campo, no se muestra además el mensaje de sección.
     Lo que no es de campo (409 de topes, 503, reserva) sigue en el `AlertInline`. Un `422` cuyo `field` no se
     reconoce cae, por defecto y salvo objeción, en `errors:generico` en el `AlertInline`.
   - **Riesgos que las pruebas cubren:** (a) el efecto que aplica `setError` depende del error de la mutación (su
     identidad) y no del texto: un segundo rechazo con el mismo texto se vuelve a pintar (`PG:1234`); (b) el error
     de campo desaparece cuando la persona edita y revalida (`PG:1209`; la hipótesis de que `react-hook-form` lo
     reemplaza al revalidar quedó comprobada en jsdom); (c) el error de campo solo sigue a una alta (D-AD;
     `PG:1653` a `PG:1708`). Los textos de las tres pruebas de campo (`PG:1132`, `PG:1157`, `PG:1184`) comprueban
     que hay **un solo** `alert` en la sección: el `<p role="alert">` del propio campo (`FormField` → `ErrorText`);
     si el texto saliera también en el `AlertInline` habría dos.
   - Fuera de este PR: los códigos `START_DATE_IN_THE_FUTURE` y `END_DATE_IN_THE_FUTURE` (el cliente ya bloquea
     el mes futuro; solo difieren en las últimas 5 horas del mes UTC−5) y los cinco `*_INVALID_CHARACTERS`
     (celda O41, D-Y) siguen sin mapa por campo; caen en lo que ya hacen hoy.
7. **Texto de reserva y red de las altas (CA-2.4.36, 52).**
   - **Hoy:** el 503 `BIRTH_DATE_UNAVAILABLE` cae en `errorAgregar` (`PAGE:367`, `:435`), no en `errors:generico`,
     y una caída de red tampoco distingue `errors:red` (`getItemErrorMessage` devuelve el `fallback` si no es
     `ApiError`, `PAGE:220`).
   - **Implementado (Decisión B de la Fase 5, D-W):** reserva `errors:generico` y `errors:red` en las altas y en
     las bajas, con un ayudante local en la página (`getFallbackMessage`) para no repetir el ternario cuatro veces.
     Se **borraron** las cuatro llaves `educacion.errorAgregar`, `educacion.errorEliminar`, `experiencia.errorAgregar` y
     `experiencia.errorEliminar` en es-CO y en (D-AF), tras comprobar que solo las usaba `EditProfilePage.tsx`.
     Las del mismo nombre de `habilidades` y `rolesObjetivo` no se tocaron. La conservación de lo escrito (el
     formulario solo se reinicia cuando crece la lista) se prueba (`PG:1423`, `PG:1445`, `PG:1467`, `PG:1480`).
8. **Guarda de doble envío (RT-06-CA01; D-AC y D-AG), en altas y bajas.**
   - **Hoy:** solo el `disabled` del botón (`Button.tsx:103`) alimentado por `isAdding` (`WES:401`, `EDS:384`);
     los formularios llaman `handleSubmit(onAdd)` directo (`WES:231`, `EDS:247`); la baja solo deshabilita el
     botón del elemento (`WES:212`, `EDS:228`).
   - **Implementado:** `onAdd` y `onRemove` pasan a **devolver la promesa de `mutateAsync`**, como
     `GeneralInfoForm`; la sección pone un `useRef` síncrono al empezar y lo suelta en `finally`, además del
     `disabled`. Las altas activan la guarda **solo después de validar**; las bajas llevan una guarda **por
     elemento** (ids en vuelo). La sección atrapa el rechazo de la promesa para soltar la guarda y no lo
     propaga (no queda ninguna promesa sin manejar); el mensaje de error lo sigue decidiendo la página, que
     alimenta el mapa de errores por campo y la «última acción» con el estado de la mutación. Cambian
     las props de `WorkExperienceSection` y `EducationSection`, `EditProfilePage.tsx` y las pruebas de
     sección, cuyos `vi.fn()` ahora devuelven una promesa.
   - **Por qué con promesa y no con `isAdding`:** soltarla cuando `isAdding` pasa a falso depende del re-render,
     que es lo que falló en DF-004 (2,9 ms entre clics, `NewProfilePage.tsx:76` y su prueba `:123`).
   - **Riesgo que cubre la baja:** sin guarda, dos clics seguidos pueden mandar dos `DELETE`; el segundo da 404
     y, con CA-2.4.58 y 59 mapeados, se vería «No encontramos lo que buscabas.» tras una baja correcta (hipótesis).
   - CA-2.4.45 y CA-2.4.50 (`Idempotency-Key`) siguen aplazados al Sprint 4: esta guarda **no** los cubre.

**Criterios del PR 2.** «Al abrir el PR» es el estado de la Fase 7 sobre `develop` `4579675` (lectura más las
pruebas de la feature en verde): es historia. «Estado final» es el de la Fase 8 (16-oct-2026): CUMPLIDO exige
prueba en verde **y** literal exacto del backlog en es-CO (y la llave en `en` con texto propio). Las pruebas
contra el mock no prueban el servidor real: lo que dependa de staging o del backend real queda PENDIENTE.
Abreviaturas de las pruebas (todas bajo `src/features/professional-profile/`, salvo `HD`): `PG` =
`pages/EditProfilePage.test.tsx`, `WE` = `organisms/WorkExperienceSection/WorkExperienceSection.test.tsx`, `ED` =
`organisms/EducationSection/EducationSection.test.tsx`, `YM` = `model/yearMonth.test.ts`, `WS` =
`schemas/workExperience.schema.test.ts`, `MP` = `api/profile.mapper.test.ts`, `HD` =
`src/mocks/handlers/profiles.handlers.test.ts`. Las pruebas de sección reciben los textos por propiedades; las de
`PG` y `YM` usan el `profile.json` real.

*Periodos*

| CA | Al abrir el PR (`4579675`) | Qué hizo el PR 2 | Estado final (16-oct-2026) y prueba |
| -- | -------------------------- | ----------------- | ----------------------------------- |
| CA-2.4.1 | PARCIAL: fin oculto (`WES:299`); «Experiencia agregada.» (`profile.json:152`, prueba `EditProfilePage.test.tsx:988`); periodo «junio de 2024 - actual» (`PAGE:268-272`, `profile.json:146`). | `periodoActual` en «mm/aaaa» con «–». | **CUMPLIDO.** `WE:132` (fin oculto), `YM:60` y `PG:1730` («06/2024 – actual»), `PG:989` («Experiencia agregada.»), `MP:114`. Sin una prueba que recorra todo el flujo. |
| CA-2.4.7 | PARCIAL: fin oculto (`EDS:334`); «Formación agregada.» (prueba `EditProfilePage.test.tsx:145`); periodo «febrero de 2025 - en curso» (`profile.json:98`). | `periodoEnCurso` en «mm/aaaa» con «–». | **CUMPLIDO.** `ED:153`, `YM:155` y `PG:1764` («02/2025 – en curso»), `PG:146`. |
| CA-2.4.8 | PARCIAL: `endDate` opcional (`education.schema.ts:47`, `profile.mapper.ts:130`); fin nulo se pinta «—» (`PAGE:265`). | Llave nueva `educacion.periodoSinFin`. | **CUMPLIDO.** `YM:161` y `PG:1764` («02/2025 – Sin fecha de fin»), `MP:83`. |
| CA-2.4.13 | PARCIAL: la regla ya compara por mes y año (`workExperience.schema.ts:80`; prueba «mismo mes» en `WorkExperienceSection.test.tsx`); periodo «mayo de 2024 - mayo de 2024». | `periodo` en «mm/aaaa» con «–». | **CUMPLIDO.** `YM:66` («05/2024 – 05/2024», `profile.json` real), `WE:386`. La prueba de página usa formación, no experiencia. |
| CA-2.4.29 | PARCIAL: igual (`education.schema.ts:67`; prueba en `EducationSection.test.tsx`). | Ídem. | **CUMPLIDO.** `YM:167` y `PG:1764` («02/2025 – 02/2025»). |
| CA-2.4.42 | NO CUMPLIDO: la pieza y el periodo no existen; inicio nulo revienta `formatYearMonth` (`yearMonth.ts:17`, hipótesis). | Pieza `experiencia.sinFechaInicio`; el formateador admite inicio nulo. | **CUMPLIDO.** `YM:94` y `PG:1730` («Sin fecha de inicio – actual», sin error). |
| CA-2.4.56 | NO CUMPLIDO: «junio de 2024 - fin desconocido» (`profile.json:147`). | `periodoFinDesconocido` = «{{inicio}} – Fin no registrado». | **CUMPLIDO.** `YM:78` y `PG:1730` («06/2024 – Fin no registrado»). |

*Inicio opcional de experiencia*

| CA | Al abrir el PR (`4579675`) | Qué hizo el PR 2 | Estado final (16-oct-2026) y prueba |
| -- | -------------------------- | ----------------- | ----------------------------------- |
| CA-2.4.15 | NO CUMPLIDO: inicio exigido (`workExperience.schema.ts:45`, `profile.mapper.ts:156`, `profile.types.ts:75`, `profile.dto.ts:62`, `profiles.handlers.ts:427`); «Sin fechas» no existe. | Inicio opcional en esquema, mapper, tipos y mock; llave `experiencia.periodoSinFechas`. | **CUMPLIDO.** `WS:20`, `WE:472`, `MP:155`, `HD:772`, `YM:88` y `PG:1730` («Sin fechas»). El «Sin fechas» no se vio tras un alta real en la página. |
| CA-2.4.22 | NO CUMPLIDO: mismo bloqueo. | Ídem. | **CUMPLIDO** en el cliente: `WS:36`, `WE:488`, `MP:169`, `HD:790`. Verificación contra el backend real: PENDIENTE. |
| CA-2.4.23 | NO CUMPLIDO: mismo bloqueo, y el error `END_DATE_BEFORE_MINIMUM_AGE` (`PAGE:441`) sale en el `AlertInline`. | Ídem, más el error bajo «Fecha de fin» (D-T). | **CUMPLIDO** en el cliente: `PG:1184` (422 montado con `useHandlers`), `WE:503`. Backend real: PENDIENTE. |
| CA-2.4.53 | NO CUMPLIDO: mismo bloqueo. | Ídem. | **CUMPLIDO** en el cliente: `WS:20`, `WE:472`, `MP:155`, `HD:772`. El mock no modela la réplica: «sin fecha de nacimiento» solo es el caso sin fechas. Backend real: PENDIENTE. |

*Longitudes y contador*

| CA | Al abrir el PR (`4579675`) | Qué hizo el PR 2 | Estado final (16-oct-2026) y prueba |
| -- | -------------------------- | ----------------- | ----------------------------------- |
| CA-2.4.12 | NO CUMPLIDO: `maxLength` (`WES:383`), contador por `.length` (`WES:388`), sin mensaje; la prueba `WorkExperienceSection.test.tsx:159-163` exige `maxlength="500"`. | Sin `maxLength`; `unicodeLength` en contador y esquema (D-X); mensaje nuevo. | **CUMPLIDO.** `WE:575` («501 / 500 caracteres», sin `maxlength`), `WE:585` (mensaje bajo el campo, no guarda), `WE:616` (emojis). Ninguna prueba de página pasa la llave por `profile.json`. |
| CA-2.4.17 | PARCIAL: `.max(100)` (`workExperience.schema.ts:43-44`, de Sofía); sin prueba. | Solo prueba. | **CUMPLIDO.** `WE:555`. |
| CA-2.4.18 | NO CUMPLIDO: error `too_big` sin texto (`WES:240`, `:259`); literales inexistentes. | Dos llaves nuevas y su cableado. | **CUMPLIDO.** `WE:524` (cargo), `WE:540` (empresa). Igual hueco de cableado que CA-2.4.12; cuenta UTF-16 (líneas de Sofía). |
| CA-2.4.19 | PARCIAL: `workExperience.schema.ts:47` y `WES:383`; sin prueba. | Con `unicodeLength` (D-X). | **CUMPLIDO.** `WE:599`. |
| CA-2.4.27 | PARCIAL: `.max(150)` (`education.schema.ts:44-45`, de Sofía); sin prueba. | Solo prueba. | **CUMPLIDO.** `ED:502`. |
| CA-2.4.28 | NO CUMPLIDO: `too_big` sin texto (`EDS:276`, `:295`); literales inexistentes. | Dos llaves nuevas y su cableado. | **CUMPLIDO.** `ED:467` (título), `ED:485` (institución). Igual hueco de cableado que CA-2.4.12. |

*Topes*

| CA | Al abrir el PR (`4579675`) | Qué hizo el PR 2 | Estado final (16-oct-2026) y prueba |
| -- | -------------------------- | ----------------- | ----------------------------------- |
| CA-2.4.10 | NO CUMPLIDO: sin tope en `EDS` (props `:62-122`); sin constante. | `EDUCATION_MAX_COUNT` = 5, `maxItems`, botón deshabilitado y `errorLimite` visible (D-V, D-AB). | **CUMPLIDO.** `PG:1610` (con 5), `PG:1637` (tras guardar la quinta), `ED:526`, `ED:547`. La constante es del front. |
| CA-2.4.47 | NO CUMPLIDO: ídem en `WES`. | `WORK_EXPERIENCE_MAX_COUNT` = 4, ídem. | **CUMPLIDO.** `PG:1597`, `PG:1623`, `WE:638`, `WE:659`. |
| CA-2.4.48 | PARCIAL: `WORK_EXPERIENCE_LIMIT_REACHED` mapeado (`PAGE:437`, literal exacto); sin prueba. | Solo prueba. | **CUMPLIDO** en el cliente: `PG:1563`, `HD:826`. La segunda pestaña real: PENDIENTE (prueba manual). |
| CA-2.4.49 | PARCIAL: `EDUCATION_LIMIT_REACHED` (`PAGE:368`); sin prueba. | Solo prueba. | **CUMPLIDO** en el cliente: `PG:1580`, `HD:847`. |

*Bajas*

| CA | Al abrir el PR (`4579675`) | Qué hizo el PR 2 | Estado final (16-oct-2026) y prueba |
| -- | -------------------------- | ----------------- | ----------------------------------- |
| CA-2.4.11 | NO CUMPLIDO: `confirmacionEliminada` sin consumidor (`profile.json:104`). | Confirmación de la última acción (D-AA). | **CUMPLIDO.** `PG:1266` («Formación eliminada.», no «agregada»), `HD:913`. |
| CA-2.4.38 | NO CUMPLIDO: ídem (`profile.json:153`). | Ídem. | **CUMPLIDO.** `PG:1293`, `HD:926`. |
| CA-2.4.46 | NO CUMPLIDO: ídem. | Ídem. | **CUMPLIDO.** `PG:1280`, `HD:896`. El cliente no distingue el estado del perfil. |
| CA-2.4.37 | NO CUMPLIDO: texto fijo `errorEliminar` (`PAGE:375-377`); literal inexistente. | Llave `educacion.errorUltimaFormacion`; tabla propia por `code` (D-T). | **CUMPLIDO** en el cliente: `PG:1305` (409 `EDUCATION_NOT_ALLOWED`: literal y la formación sigue), `HD:878`. El 409 real depende de un perfil `COMPLETED`: PENDIENTE. |
| CA-2.4.51 | NO CUMPLIDO: ídem. | Ídem (lo que se comprueba en el cliente es el mensaje del 409 perdedor; la transacción es del servidor). | **CUMPLIDO** en el cliente: `PG:1323` (una pestaña con un 409 montado). Las dos pestañas reales: PENDIENTE. |
| CA-2.4.39 | NO CUMPLIDO: `PROFILE_NOT_ALLOWED` sin mapear en las cuatro rutas. | Tabla propia: `errors:codigos.NOT_FOUND`. | **CUMPLIDO** en el cliente: `PG:1341` (alta y baja de ambas secciones). Con un perfil propio y un 403 montado; el perfil ajeno real: PENDIENTE. |
| CA-2.4.58 | NO CUMPLIDO: `EDUCATION_NOT_FOUND` sin mapear. | Tabla propia. | **CUMPLIDO** en el cliente: `PG:1389`, `HD:951`. Sin `code`, caería en el genérico (ADR-0008). |
| CA-2.4.59 | NO CUMPLIDO: `WORK_EXPERIENCE_NOT_FOUND` sin mapear. | Tabla propia. | **CUMPLIDO** en el cliente: `PG:1405`, `HD:962`. |

*Errores del servidor bajo el campo*

| CA | Al abrir el PR (`4579675`) | Qué hizo el PR 2 | Estado final (16-oct-2026) y prueba |
| -- | -------------------------- | ----------------- | ----------------------------------- |
| CA-2.4.21 | PARCIAL: `START_DATE_BEFORE_MINIMUM_AGE` (`PAGE:439`, `profile.json:158`) en el `AlertInline`; sin prueba. | Mapa campo → texto en la página; `setError` en la sección (D-T). | **CUMPLIDO** en el cliente: `PG:1157` (422 con `errors[]`: literal bajo «Fecha de inicio», un solo `alert`). Verificación contra el backend real: PENDIENTE. |
| CA-2.4.32 | PARCIAL: `START_DATE_BEFORE_BIRTH` (`PAGE:369`, `profile.json:109`) en el `AlertInline`; sin prueba. | Ídem. | **CUMPLIDO** en el cliente: `PG:1132`. Backend real: PENDIENTE. |

(CA-2.4.23 está en la tabla de inicio opcional.)

*Texto de reserva y red*

| CA | Al abrir el PR (`4579675`) | Qué hizo el PR 2 | Estado final (16-oct-2026) y prueba |
| -- | -------------------------- | ----------------- | ----------------------------------- |
| CA-2.4.36 | NO CUMPLIDO: el 503 `BIRTH_DATE_UNAVAILABLE` cae en `errorAgregar` (`PAGE:435`). | Reserva `errors:generico`, `errors:red` si no es `ApiError` (D-W). | **CUMPLIDO** en el cliente: `PG:1445` (503 montado con `useHandlers`: genérico, conserva lo escrito) y `PG:1480` (red). No afirma que la lista siga vacía. La réplica sin fila: PENDIENTE (prueba manual). |
| CA-2.4.52 | NO CUMPLIDO: ídem (`PAGE:367`). | Ídem. | **CUMPLIDO** en el cliente: `PG:1423` y `PG:1467` (red). Ídem. |

**Pruebas que este SPEC exigió (se escribieron en rojo antes del código; todas existen y están en verde, salvo la última).**

- **Página** (`EditProfilePage.test.tsx`, solo casos nuevos, con `profile.json` real y respuestas montadas con
  `useHandlers`, como CM-272; los casos de CM-272 y de finalización no se tocan): cada `code` de altas y
  bajas (403, 404 ×2, 409 ×2 de topes y de última formación, 503 ×2, 422 por campo ×3), red, «última acción»
  (alta, baja, error y confirmación), periodos en pantalla, topes con botón deshabilitado, dos rechazos
  idénticos seguidos del 422 por campo.
- **Guarda** (secciones y página): dos clics síncronos en un mismo turno, con `act` y `fireEvent` (patrón de
  `NewProfilePage.test.tsx:123` y `:145`), en alta y en baja; la guarda se suelta en `finally` también cuando
  la promesa rechaza.
- **Secciones:** longitud (101/151 y descripción de 501 con contador), topes, error de campo aplicado con
  `setError`, y reescritura de `WorkExperienceSection.test.tsx:159-163`; los `vi.fn()` de `onAdd` y `onRemove`
  devuelven una promesa.
- **Esquemas, mapper y formateador:** inicio opcional, `null` en el mapper, los ocho formatos de periodo y la
  composición con la pieza «Sin fecha de inicio».
- **Mock** (`profiles.handlers.test.ts`, solo adiciones): `startDate` opcional, topes 4 y 5 con 409 y `code`,
  última formación en perfil `COMPLETED`, `code` en los 404 de bajas. Los dos casos con 400
  (`profiles.handlers.test.ts:276-292`, `:433-452`) **no se tocan**.
- **Literales** (`src/i18n/profileDateMessages.test.ts` o un archivo hermano): los literales nuevos del backlog
  en `profile.json` (es-CO exacto; en con texto propio). **No se escribió.** Los literales se compararon con el
  `.md` de criterios con un script de un solo uso (Fase 8: 26 literales, todos exactos) y los de periodos y los de
  códigos de la página los ejerce `PG`/`YM` con el `profile.json` real; los cinco de longitud **no** tienen ninguna
  prueba del repositorio que los compare. Queda como deuda.

**Llaves de i18n (es-CO y en), con su posición.** Las llaves de Sofía son `educacion` `:107-110` y
`experiencia` `:156-160`; `:110` y `:160` **no llevan coma final**, así que **ninguna llave nueva va después
de ellas**: las nuevas van entre `errorEliminar` (que se borra) y `errorLimite`.

- **Nuevas:** `educacion.errorUltimaFormacion`, `educacion.periodoSinFin`, `educacion.institucion.errorLongitud`,
  `educacion.tituloObtenido.errorLongitud`, `experiencia.sinFechaInicio`, `experiencia.periodoSinFechas`,
  `experiencia.empresa.errorLongitud`, `experiencia.cargo.errorLongitud`, `experiencia.descripcion.errorLongitud`.
- **Cambian de texto (líneas propias):** `educacion.periodo`, `educacion.periodoEnCurso`, `experiencia.periodo`,
  `experiencia.periodoActual` y `experiencia.periodoFinDesconocido` (separador «–» y los literales del backlog).
- **Se borran:** `educacion.errorAgregar`, `educacion.errorEliminar`, `experiencia.errorAgregar` y
  `experiencia.errorEliminar` (D-AF), más `experiencia.fechaInicio.errorRequerido` (de CM-61), que quedó sin
  consumidor al hacerse opcional el inicio de la experiencia; `educacion.fechaInicio.errorRequerido` se conserva
  (el inicio de la formación sigue siendo obligatorio).
- **Sin consumidor, no se tocan (líneas de Sofía):** `educacion.errorFechaInvalida` y `experiencia.errorFechaInvalida`
  (es-CO y en), detectadas al revisar las llaves huérfanas (Fase 8).
- Se reutilizan tal cual: `errorLimite`, `errorFechaAnteriorNacimiento`, `errorFechaEdadMinima`,
  `errorFechaFinEdadMinima`, `confirmacionEliminada` y, de `errors.json`, `generico`, `red` y `codigos.NOT_FOUND`.

**Mock (`profiles.handlers.ts`) — solo cambios aditivos** (`errorBody` ya acepta `code`, `:215-223`, de Sofía, se
reutiliza sin tocar; las líneas sueltas de Sofía `:422`, `:472`, `:493`, `:498-499`, `:507`, `:514`, `:545` y
`:563` tampoco). Lo que el mock no puede modelar (403, 503, 422 por campo, fecha de nacimiento) se prueba con
`useHandlers` por prueba.

**Líneas de Sofía que este PR no edita** (comprobadas con `git blame` el 16-oct-2026): `EditProfilePage.tsx`
`:209-213`, `:218`, `:220-227` (`getItemErrorMessage`), `:368-371` y `:436-445` (tablas de códigos);
`profile.json` `:107-110` y `:156-160`; `profile.constants.ts` `:62-63` y `:65-69`; `workExperience.schema.ts`
`:23-27` y `:43-44`; `education.schema.ts` `:13-14`, `:29` y `:44-45`; `profile.mapper.ts` `:170`;
`unicodeLength.ts` (solo se importa). La línea `workExperience.schema.ts:47` (descripción) es de CM-61 y sí
se edita.

**Fuera de este PR — todos ABIERTOS (nunca «cumple»).**

- **Aplazados al Sprint 4 (2):** CA-2.4.45 y CA-2.4.50 (`Idempotency-Key`); la guarda de este PR no los cubre.
- **Solo backend (6):** CA-2.4.5, 9, 16, 40, 41 y 57.
- **Desalineación del mock (C-20):** alinear el 400 a 422 sigue fuera de CM-273.
- **Celda O41 de la v8 (caracteres de control):** el backend ya envía los textos por campo
  (`WorkExperience.java:33`, `:36`, `:39`; `Education.java:29`, `:32`) y el front los muestra con un solo texto
  genérico (`profile.json:110` y `:160`, de Sofía). Fuera de CM-273 (D-Y); **aviso pendiente a Ana Sofía**, ver C-22 en §8.
- **Verificación en staging y en un navegador real:** lo que dependa del servidor o del navegador queda
  PENDIENTE hasta que se pruebe; ninguna prueba automática lo reemplaza.

### 3.4 · `/perfiles/:id/editar` — Habilidades y finalizar · `PRT-02.03` · CM-65

**Corrección heredada de §3 (CM-61, 14-sep-2026):** esta subsección decía «(paso 3)», lenguaje de
asistente por pasos que Figma nunca tuvo — se retira el rótulo, igual que ya hizo CM-61 con §3.3. El
Figma vinculado a esta tarea es guía visual desactualizada, no fuente de comportamiento ni de diseño
vinculante para esta subsección (instrucción explícita del PO): el patrón real que manda es el ya
construido por `EducationSection`/`WorkExperienceSection` (CM-61, §3.3).

**Qué hace**

- **Habilidades** (`SkillsSection`): gestión por ítem, igual que Educación/Experiencia — cada alta
  es un `POST` inmediato, cada baja un `DELETE` inmediato, nunca un `PATCH` de colección (decisión
  D-A, extendida aquí). Captura texto libre (`skillName`, 1-255 caracteres) con un nivel asociado
  (`level` ∈ `BASIC`/`INTERMEDIATE`/`ADVANCED`, confirmado por el memo del PO del 13-sep, C-06, y por
  el código real de `ProfileController.java`). Sin catálogo de habilidades ni máximo por perfil. Se
  muestran como `Chip` (átomo de CM-61) en vez de tarjetas — ningún átomo nuevo de `design-system`.
  Un texto duplicado (ignorando mayúsculas y espacios) se bloquea en cliente antes de llamar al
  backend; el memo del PO del 13-sep (C-06) informa que el rechazo con `409` en Backend todavía no
  está activo, así que hoy la protección es la del cliente.
- **Finalizar** (`useFinalizeProfile`, `ProfileActionsBar`): llama a
  `POST /api/v1/profiles/:id/completion` — **no** `.../finalize`, el nombre que el mock simulaba
  desde CM-61 antes de conocer el código real de `ProfileController.java#completeProfile`. Valida
  server-side los 5 requisitos (nombre, resumen, ≥1 educación, ≥1 habilidad, ≥1 rol objetivo) y
  devuelve, si falla más de uno, **todos** los incumplidos a la vez (nunca solo el primero) en
  `error.errors` — nunca el texto crudo del backend (`CLAUDE.md` §8). El botón se habilita cuando
  `getCompletenessValue(profile) === PROFILE_COMPLETENESS_MAX`; **llega a 5**
  cuando se cumplen los cinco requisitos (nombre, resumen, ≥1 educación, ≥1 habilidad, ≥1 rol
  objetivo): CM-65 y CM-69 ya están fusionadas y `Profile.targetRoles` se puebla desde la sección de
  Roles Objetivo. El único cambio visible al finalizar con éxito es el estado del perfil, Borrador → Activo (`GLOSSARY.md`
  §3); no hay redirección a otra pantalla.

**Estados**

| Estado      | Qué muestra                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Carga       | Comparte el `Spinner` inicial de la página: la lista de habilidades llega en la misma respuesta de `GET /api/v1/profiles/:id`        |
| Vacío       | `EmptyState` propio: sin habilidades es válido para mostrar la pantalla; bloquea la finalización, no el render                       |
| Error       | Alta de habilidad → mensaje específico si el `httpStatus` es 409 (duplicada, ver §4, `ADR-0007`), si no el genérico; finalizar con requisitos incumplidos → lista completa vía `error.errors` (`profile:formulario.requisitos.*`), nunca solo el primero |
| Sin permiso | Ver nota transversal arriba                                                                                                          |

**Validaciones del lado del cliente**

- `skillName`: 1-255 caracteres, obligatorio; duplicado (mismo texto ignorando mayúsculas y
  espacios) bloquea el envío con `setError` manual — salvaguarda de cliente; el rechazo con `409` de
  Backend está pendiente de activarse (memo del PO del 13-sep, C-06).
- `level`: obligatorio, no validado contra el enum real (el `<Select>` solo ofrece esas 3 opciones).
- El botón "Finalizar y Continuar" se deshabilita mientras `completenessValue < PROFILE_COMPLETENESS_MAX`
  o el perfil ya esté `COMPLETED` — salvaguarda de cliente; el backend real también lo rechaza (422
  incompleto, 409 ya completado).

### 3.5 · `/perfiles/:id/editar` — Sección «Roles Objetivo» · `PRT-02.03` · CM-69

**Ya no bloqueada (decisión H, §9).** El PO autorizó construir la gestión manual completa dentro del
formulario sin esperar la respuesta final de C-04: HU-2.10 (sugerencia de roles por IA) sigue viva
para Sprint 2, pero ahora se integrará *dentro de este mismo formulario* cuando llegue, no en
`PRT-02.07`. Esa pantalla y su ruta (`ProfileRolesPage.tsx`, `/perfiles/:id/roles`) **no se tocan ni
se borran en este commit** — siguen existiendo como placeholder de `EmptyState`, tal como ya
describían `CLAUDE.md` §12 (abierta 10) y §17. C-04 ya está respondida (13-sep: se retira PRT-02.07
y la IA irá dentro del formulario): la página y la ruta **se conservan hasta HU-2.10** (Sprint 2).

El Figma vinculado a esta tarea es guía visual desactualizada, no fuente de comportamiento ni de
diseño vinculante para esta subsección (instrucción explícita del PO): el patrón real que manda es
el ya construido por `EducationSection`/`WorkExperienceSection` (CM-61, §3.3), verificado en vivo
contra Figma en su momento.

**Qué hace**

- Gestiona Roles Objetivo **por ítem**, igual que Educación/Experiencia: cada alta es un `POST`
  inmediato, cada sustitución un `PATCH` inmediato, cada baja un `DELETE` inmediato — nunca un
  `PATCH` de colección (decisión D-A, extendida aquí a Roles Objetivo). Máximo 5 roles por perfil
  (`MAX_TARGET_ROLES`), solo del catálogo cerrado (`GET /api/v1/profiles/professional-roles`,
  `useProfessionalRolesQuery`): el usuario nunca escribe el nombre a mano (CA-2.11.7). Ruta
  corregida en CM-195: el Gateway solo enruta bajo `Path=/api/v1/profiles/**`, así que el backend
  movió este endpoint el 19-sep-2026 (CM-176); la ruta vieja ya no existe.
- **Agregar** (`TargetRolesSection`): reutiliza `design-system/molecules/Combobox` (construido en
  CM-61 anticipando exactamente este uso — su propio TSDoc ya decía «para roles objetivo, CM-69»).
  El catálogo ofrecido excluye los roles ya asociados al perfil; elegir una opción dispara el `POST`
  de inmediato. Al llegar al tope de 5, el selector se oculta y se muestra un aviso en su lugar.
- **Sustituir** (decisión H1, memo del PO del 13-sep C-05, confirmado por el código real de
  `ProfileController.java#updateTargetRole`): es una acción propia, un `PATCH` que conserva el `id`
  del Rol Objetivo — nunca "eliminar y agregar". Cada ítem de la lista tiene su propio control que
  revela un `Select` de un solo valor, acotado a los roles todavía no usados; elegir una opción
  dispara el `PATCH` de inmediato. El selector nunca ofrece un rol ya presente en otro ítem del
  mismo perfil (regla de cliente hoy; el refuerzo en Backend llega con HU-2.10, según el memo del PO del 13-sep, C-05).
- **Eliminar**: bloqueado únicamente cuando es el último rol objetivo y el perfil ya está
  `COMPLETED` (CA-2.11.3, confirmado por `ProfileController.java#removeTargetRole`) — con el perfil
  todavía `IN_PROGRESS`, sí se puede quedar sin roles.
- Sin prioridad ni reordenamiento (J-03; CA-2.11.6 retirado).

**Estados**

| Estado      | Qué muestra                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| Carga       | Comparte el `Spinner` inicial de la página: bloquea el render hasta que `useProfileQuery` **y** `useProfessionalRolesQuery` resuelvan |
| Vacío       | `EmptyState` propio: sin roles asociados, invita a agregar el primero — no bloquea mostrar la pantalla, solo finalizar (CM-65) |
| Error       | Alta/sustitución/baja fallida → mensaje específico según el `httpStatus` de *esa* mutación (409 duplicado, 422 tope/último rol — ver §4, `ADR-0007`), si no el genérico de la sección; fallo al cargar el catálogo comparte la pantalla de error inicial de la página |
| Sin permiso | Ver nota transversal arriba                                                                                |

**Validaciones del lado del cliente**

- No ofrecer en el selector (agregar o sustituir) un rol ya presente en el perfil — salvaguarda de
  UX; el refuerzo en Backend llega con HU-2.10 (memo del PO del 13-sep, C-05).
- Ocultar el selector de alta al llegar a 5 roles — salvaguarda de UX; el backend real también lo
  rechaza con `422`.
- Deshabilitar "Eliminar" en el único rol restante cuando el perfil es `COMPLETED` — salvaguarda de
  UX; el backend real también lo rechaza con `422`.

## 4. Contrato observable

**Campos y reglas**

| Campo            | Tipo                   | Regla                                                       | Origen                                |
| ---------------- | ---------------------- | ----------------------------------------------------------- | ------------------------------------- |
| `name`           | string                 | 1-255 caracteres                                            | CA-2.2.1 a CA-2.2.3, confirmado por la respuesta oficial del PO del 13-sep (C-01) |
| `summary`        | string                 | ≤ 2000 caracteres                                           | `GLOSSARY.md` §2                      |
| `workExperience` | `WorkExperienceItem[]` (`id`, `company`, `position`, `description \| null`, `startDate`, `endDate \| null`, `employmentStatus`, `provenance`) | Opcional; gestión por ítem (POST/DELETE); `endDate` obligatoria y ≥ `startDate` si `employmentStatus=ENDED`, prohibida en cualquier otro estado (`WorkExperience.java`, backend real) | HU-2.4, J-01, CM-61 |
| `education`      | `EducationItem[]` (`id`, `institution`, `degree`, `fieldOfStudy`, `level`, `startDate`, `endDate \| null`, `inProgress`, `provenance`) | Obligatorio ≥1 para finalizar; gestión por ítem (POST/DELETE); `level` del enum real; `endDate` prohibida si `inProgress=true` (`Education.java`, backend real); `fieldOfStudy` es el único campo NO obligatorio | HU-2.4, T-01, CM-61 |
| `skills`         | `SkillItem[]` (`id`, `skillName`, `level`, `provenance`) | Texto libre (`skillName`, 1-255) + `level`; sin catálogo; gestión por ítem (POST/DELETE); duplicado (mismo texto normalizado) bloqueado en cliente y, cuando Backend lo active, rechazado con `409` | HU-2.5, C-06, CM-65 |
| `targetRoles`    | `TargetRoleItem[]` (`id`, `professionalRoleId`, `provenance`) | Catálogo cerrado; máximo 5 (`MAX_TARGET_ROLES`); sin duplicados; sin prioridad ni reordenamiento; gestión por ítem (POST/PATCH/DELETE); sustituir conserva el `id` del Rol Objetivo | HU-2.11, D-01, J-03, C-05, CM-69 |
| `summaryProvenance` | `'MANUAL' \| 'AI_SUGGESTED' \| 'AI_EDITED' \| null` | **Solo mock; no es parte del contrato real.** El `ProfileResponse` real no tiene este campo (el real es `provenance`, a nivel de perfil): lo calcula `profiles.handlers.ts` a partir del valor anterior para que CA-2.3.1/2/4 sean demostrables. El DTO lo declara opcional y el mapper lo normaliza a `null`. El cliente nunca lo envía en el `PATCH` | CA-2.3.1, CA-2.3.2, CA-2.3.4 |
| `summaryProvenanceOrigin` | `string \| null` | **Solo mock y pruebas; no es parte del contrato real** (ni siquiera está en `ProfileDto`). En el mock se conserva solo en la transición `AI_SUGGESTED → AI_EDITED`; nulo en cualquier otro caso, incluida la creación manual | CA-2.3.2 |

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
expuesto por `GET /api/v1/profiles/professional-roles`, §5). `SkillLevel` = `BASIC`/`INTERMEDIATE`/
`ADVANCED` — **cierra C-06**, confirmado por el memo del PO del 13-sep y por el código real de
`ProfileController.java` (parámetros de `AddSkillCommand`), compartidos en la sesión que construyó
CM-65.

**Errores que el usuario puede ver**

**Actualizado 19-sep-2026 (`ADR-0007`, seguimiento de CM-34; sustituido por `ADR-0008` el
10-oct-2026, que sí contempla `code`):** el backend real (`ApiExceptionHandler.java`,
`cameia-perfil`) respondía entonces `ProblemDetail` (RFC 7807) **sin `code` propio** — se confirmó al reescribir `ApiError`/`errorMap.ts` contra el mismo contrato que
`cameia-cuentas`. Los códigos de esta tabla (`PROFILE_NAME_INVALID`, `WORK_EXPERIENCE_DATE_INVALID`,
etc.) eran invenciones del mock, nunca confirmadas con backend — se retiran de `errors.json` y de
aquí; cada caso se discrimina por `httpStatus` (confirmado por `ProfileController.java`) dentro del
contexto de su propia mutación, con la llave de i18n movida al namespace de la feature
(`profile.json`).

> **Nota (9-oct-2026, CM-270).** El documento de Backend del 8-oct publica un catálogo de códigos
> estables (`code`, `requestId`, y `errors[].code` en validación) que contradice la frase anterior
> de «sin `code` propio». Con CM-298 (`ADR-0008`) `ApiError` y `errorMap` pasan a exponerlos; hasta
> que se implemente, y para todo lo que no sea la creación del perfil, esta tabla sigue discriminando
> por estado HTTP. Solo las filas de la creación (cupo agotado y creación en curso) se resuelven por
> `code` (§3.1).

| Causa                 | Cuándo ocurre                                      | Llave de i18n                                       |
| ---------------------- | -------------------------------------------------- | --------------------------------------------------- |
| Nombre de perfil inválido | `400` al guardar Información General (`name` vacío o mayor a 255) — inalcanzable en operación normal, el cliente ya bloquea antes de llamar | `profile:general.nombre.errorLongitud` (cliente; residual sin llave propia, cae a `errors:generico`) |
| Cupo del Plan Free agotado | `409` `PROFILE_LIMIT_REACHED` (hoy) o `403` `PLAN_LIMIT` (backlog v6, aún sin desplegar) de `POST /api/v1/profiles`; se reconoce por `code`, sin respaldo por estado, solo en la creación (§3.1, `ADR-0008`) | `profile:metodo.errorCupoPlan` (CM-270) — «Tu Plan Free permite 1 Perfil Profesional.» |
| Creación en curso | `409` `PROFILE_CREATION_IN_PROGRESS` de `POST /api/v1/profiles` (sustituye al `503 PROFILE_CREATION_TIMEOUT`): otra creación del mismo usuario no terminó en 2 s; no se crea nada (CM-298, §3.1) | `profile:metodo.errorCreacionEnCurso` (llave nueva, CM-298) — «Estamos creando tu perfil. Inténtalo de nuevo en unos segundos.» |
| Perfil no encontrado   | `404` de cualquier mutación/consulta sobre `:id` (ver nota §3) | `errors:codigos.NOT_FOUND` — sigue existiendo, es genérico por `httpStatus` |
| Fecha de experiencia inválida | `422` al agregar experiencia (`ENDED` sin `endDate`, `endDate < startDate`, o `endDate` en un estado que no la admite) | `profile:experiencia.errorFechaInvalida` |
| Fecha de educación inválida | `422` al agregar educación (`inProgress=true` y `endDate` presente) | `profile:educacion.errorFechaInvalida` |
| Habilidad duplicada   | `409` al agregar habilidad con texto ya presente (sin distinguir mayúsculas ni espacios) — inalcanzable en operación normal, el cliente ya lo bloquea | `profile:habilidades.nombre.errorDuplicado` |
| Rol objetivo duplicado | `409` al agregar o sustituir con un rol ya presente en el perfil | `profile:rolesObjetivo.errorDuplicado` |
| Máximo de roles alcanzado | `422` al agregar un sexto rol objetivo | `profile:rolesObjetivo.agregar.tope` |
| Último rol objetivo bloqueado | `422` al eliminar el único rol objetivo de un perfil ya `COMPLETED` | `profile:rolesObjetivo.eliminarUltimoBloqueado` |
| Perfil incompleto | `422` al finalizar sin cumplir uno o más de los 5 requisitos, con `errors[]` no vacío | Cada `errors[].field` se traduce contra `profile:formulario.requisitos.*` (ver §3.4) — nunca el `message` crudo del backend |
| Perfil ya completado | `409` al finalizar un perfil que ya está `COMPLETED` | `errors:generico` (caso residual, no alcanzable desde la interfaz mientras el botón se deshabilita al completar) |

`getMissingRequirementFields` (§7) distingue "perfil incompleto" de cualquier otro `422` por tener
`errors.length > 0` en la respuesta de *esa* mutación específica (`POST .../completion`), sin
necesitar un código — es la única mutación de esta feature que puede devolver varios `errors[]` a
la vez.

## 5. Enlace HTTP · PROVISIONAL

**Estado del contrato:** provisional · fuente: `src/mocks/handlers/profiles.handlers.ts` (mocks,
sin OpenAPI; C-01 sin responder) · revisado el 20-sep-2026 (CM-195).

**CM-195 (bug de crash, 20-sep-2026):** el `record ProfileResponse` real de `cameia-perfil` se
confirmó línea por línea contra el código fuente Java más una captura HAR real, y reveló que el
`ProfileDto` del frontend usaba tres nombres de campo inventados —`education`/`workExperience`/
`skills`— que nunca existieron en la respuesta real (`educations`/`workExperiences`/
`profileSkills`). Como esos campos eran `undefined`, `toProfile` llamaba `.map()` sobre ellos y
`EditProfilePage` truena para todo perfil recién creado — reproducible en el flujo real
"Llenado manual" → `POST /api/v1/profiles` → `/perfiles/:id/editar`. Corregido en
`profile.dto.ts`/`profile.mapper.ts`/mocks; los nombres de salida del modelo de dominio
(`Profile.education`/`workExperience`/`skills`) no cambiaron — ver TSDoc de `profile.mapper.ts`.
De paso se confirmaron y agregaron al DTO los campos reales que faltaban: `reviewStatus`,
`provenance` (a nivel de perfil), `salaryExpectation`, `preferredModality`, `createdAt`,
`updatedAt`, y `roleTitle` en cada Rol Objetivo — ninguno tiene consumidor en el dominio todavía
(regla de crecimiento, `CLAUDE.md §4`). `name`/`summary` también se corrigieron a `string | null`:
el backend real los manda `null` en un perfil recién creado, no `''`.

**Los errores se discriminan por `code` (`ADR-0008`, `CLAUDE.md` §8); `httpStatus` y
`errors[].field` valen para las clases amplias y la ubicación por campo.** Esta sección (HU-2.3, 2.4,
2.5 y 2.11) se escribió cuando el backend no enviaba código (`ADR-0007`) y sigue por estado: migrarla
es trabajo aparte (§9). Entonces, los identificadores
`PROFILE_NAME_INVALID`, `VALIDATION_ERROR`, `SKILL_DUPLICATE`, `TARGET_ROLE_*`, `PROFILE_INCOMPLETE`,
etc. que traía esta tabla eran invenciones del mock (el mock tampoco los envía) y se retiraron: la
columna «Recibe» lista solo estados HTTP.

| Operación                | Método y ruta                        | Envía                                                                     | Recibe                                                                                |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Crear                    | `POST /api/v1/profiles`              | Sin cuerpo (backlog v6, CA-2.2.1). El mock todavía acepta un `name` opcional y responde 400 si es inválido: residuo que no forma parte del contrato | 201 `ProfileRecord` (`IN_PROGRESS`, `name` nulo) · 409 `PROFILE_LIMIT_REACHED` (cupo agotado, hoy) · 403 `PLAN_LIMIT` (cupo agotado, backlog v6; aún sin desplegar) · 409 `PROFILE_CREATION_IN_PROGRESS` (otra creación sin terminar; sustituye al 503 `PROFILE_CREATION_TIMEOUT`) |
| Obtener                  | `GET /api/v1/profiles/:id`           | Sin body                                                                  | 200 `ProfileRecord` · 404                                                             |
| Actualizar información general | `PATCH /api/v1/profiles/:id`   | `name`/`summary` (CM-61: **ya no acepta** `workExperience`/`education` — gestión por ítem, ver abajo) | 200 `ProfileRecord` · 400 (nombre inválido) · 404                                     |
| Agregar experiencia laboral | `POST /api/v1/profiles/:id/work-experiences` | `AddWorkExperienceRequestDto` (real: `company`, `position`, `description`, `startDate`, `endDate`, `employmentStatus`, `provenance`) | 201 `ProfileRecord` · 400 (validación) · 404 · 422 (fecha inválida) |
| Eliminar experiencia laboral | `DELETE /api/v1/profiles/:id/work-experiences/:workExperienceId` | Sin body | 204 sin cuerpo · 404 |
| Agregar educación | `POST /api/v1/profiles/:id/educations` | `AddEducationRequestDto` (real: `institution`, `degree`, `fieldOfStudy`, `level`, `startDate`, `endDate`, `inProgress`, `provenance`) | 201 `ProfileRecord` · 400 (validación) · 404 · 422 (fecha inválida) |
| Eliminar educación | `DELETE /api/v1/profiles/:id/educations/:educationId` | Sin body | 204 sin cuerpo · 404 |
| Agregar habilidad | `POST /api/v1/profiles/:id/skills` | `AddSkillRequestDto` (real: `skillName`, `level`, `provenance`) | 201 `ProfileRecord` · 400 (validación) · 404 · 409 (duplicada, cuando Backend lo active — C-06) |
| Eliminar habilidad | `DELETE /api/v1/profiles/:id/skills/:skillId` | Sin body | 204 sin cuerpo · 404 |
| Agregar rol objetivo | `POST /api/v1/profiles/:id/target-roles` | `AddTargetRoleRequestDto` (real: `professionalRoleId`, `provenance`) | 201 `ProfileRecord` · 400 (validación) · 404 · 409 (duplicado) · 422 (tope de roles) |
| Sustituir rol objetivo | `PATCH /api/v1/profiles/:id/target-roles/:roleId` | `UpdateTargetRoleRequestDto` (real: `professionalRoleId`) | 200 `ProfileRecord` · 400 (validación) · 404 · 409 (duplicado) |
| Eliminar rol objetivo | `DELETE /api/v1/profiles/:id/target-roles/:roleId` | Sin body | 204 sin cuerpo · 404 · 422 (último rol de un perfil `COMPLETED`) |
| Catálogo de roles profesionales | `GET /api/v1/profiles/professional-roles` | Sin body | 200 `ProfessionalRoleDto[]` (`{id, nombre, categoria}`) |
| Finalizar                | `POST /api/v1/profiles/:id/completion` | Sin body                                                                  | 201 `ProfileRecord` (status `COMPLETED`) · 404 · 409 (ya completado) · 422 (requisitos incumplidos: todos a la vez en `errors[]`, un `{field, message}` por requisito) |

**CM-195 (auditoría 20-sep-2026):** se retiró de esta tabla y del mock (`profiles.handlers.ts`) un
`GET /api/v1/profiles` (listado) que no corresponde a ningún endpoint real de
`ProfileController.java` (15 mappings confirmados, ninguno es un `GET` sin `{id}`) y que no tenía
ningún consumidor en el frontend — era código de mock muerto.

Los 4 endpoints de experiencia/educación replican los DTO reales de `cameia-perfil`
(`AddWorkExperienceRequest.java`, `AddEducationRequest.java`, compartidos en la sesión que construyó
CM-61) — no son una referencia inventada como el resto de este enlace mientras C-01 sigue abierto.
`provenance` siempre viaja `'MANUAL'` en un alta manual (`MANUAL_PROVENANCE`,
`model/profile.constants.ts`).

Los 2 endpoints de Habilidades y el de Finalizar (CM-65) replican igual el código real de
`cameia-perfil` (`ProfileController.java#addSkill/removeSkill/completeProfile`), compartido en la
sesión que construyó ese ticket. **Corrección de esa sesión respecto a lo que el mock simulaba
desde CM-61:** el endpoint real de finalización **no es** `.../finalize` sino `.../completion` — la
fila de arriba ya lo refleja; `.../finalize` deja de existir en `profiles.handlers.ts`. Existe
además `POST /api/v1/profiles/:id/review-requests` en el backend real (transición a `IN_REVIEW`),
que no se simula ni se usa: `GLOSSARY.md` §3 y `CLAUDE.md` §12 ya establecen que `IN_REVIEW` está
fuera del flujo manual en Sprint 1.

Los 3 endpoints de Roles Objetivo y el catálogo de roles profesionales (CM-69) replican igual el
código real de `cameia-perfil` (`ProfileController.java#addTargetRole/updateTargetRole/removeTargetRole`,
`ProfessionalRoleController.java`), compartido en la sesión que construyó ese ticket — mismo nivel
de confianza que los 4 anteriores. **CM-195 (auditoría 20-sep-2026):** la ruta del catálogo y la
forma de `ProfessionalRoleDto` (antes `PROVISIONAL`, `{id, name}`) se corrigieron contra el código
real del backend — `GET /api/v1/profiles/professional-roles`, `{id, nombre, categoria}` — y
`ProfessionalRole` (dominio) ahora incluye `category`.

El `PATCH` nunca recibe `provenance`: `profiles.handlers.ts` (solo mock) deriva
`summaryProvenance`/`summaryProvenanceOrigin` del valor almacenado y del nuevo `summary` (vaciar el
campo limpia los tres en conjunto — CA-2.3.4; editar un resumen `AI_SUGGESTED` lo pasa a
`AI_EDITED` conservando el origen — CA-2.3.2; cualquier otro caso queda en `MANUAL` con origen nulo
— CA-2.3.1). El backend real no expone estos campos (ver §4): aquí los sostiene solo el mock, para que los
criterios sean demostrables mientras tanto (CM-53); no hay contrato real que replicar.

**Resuelto por CM-69:** ya existe endpoint de catálogo de roles (`GET /api/v1/profiles/professional-roles`,
tabla de arriba) — `src/mocks/data/catalogs.ts` sigue siendo el módulo de datos en memoria
(`PROFESSIONAL_ROLES`), pero ahora un handler HTTP dedicado
(`src/mocks/handlers/professionalRoles.handlers.ts`) lo expone, replicando el endpoint real ya
construido en Backend (`ProfessionalRoleController.java`, CM-23, T-01 cerrado para este catálogo
específico).

## 6. Criterios de aceptación

| Criterio                                                           | Qué hace el frontend que el criterio no dice                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| CA-2.2.1 a CA-2.2.3 del backlog del 6-sep (nombre 1-255) — en v6 esos ids ya no son de nombre | Bloquea sin llamar al servidor y repite la misma validación al guardar por `PATCH` (§4) |
| CA-2.2.1 (v6) | Guarda `lastUsedProfileId` al crear y, si ya existe, redirige al montar; el método elegido no se guarda en ningún sitio |
| CA-2.2.2 | La tarjeta de IA queda visible y deshabilitada; sin llamada al backend |
| CA-2.2.3 | Reconoce el cupo agotado por 409 o 403 a la vez, solo en la creación; texto provisional, sin botones (el Paywall es Sprint 3) |
| CA-2.2.4 | El mapper convierte `name` y `summary` nulos en `''` |
| CA-2.2.5, CA-2.2.6 | Sprint 3: no se implementan |
| CA-2.2.7 | Una sola petición ante dos clics síncronos (`NewProfilePage`, `act` y `fireEvent`, DF-004); la tarjeta queda `disabled` mientras se crea (`ProfileMethodSelector`) y conserva el aspecto de seleccionada (`CardSelectable`, `state="selected"` + `disabled`), con `aria-busy` y `Spinner` |
| CA-2.3.11 (CM-272) | El mensaje sale de `errors:codigos.NOT_FOUND` por `code` `PROFILE_NOT_ALLOWED`, tanto al guardar (vía `getItemErrorMessage`) como al cargar el perfil; sin `code` muestra el genérico (`ADR-0008`) |
| CA-2.3.12 (CM-272) | El mensaje sale de `profile:general.resumen.errorPerfilActivo` por `errors[].code` `SUMMARY_NOT_ALLOWED` dentro de un `422 VALIDATION_FAILED`, y el campo vuelve a mostrar el resumen guardado (solo para ese `code`; ante cualquier otro fallo se conserva lo escrito, RT-05) |
| CA-2.3.13, CA-2.3.14 (CM-272) | Al salir de cada campo siempre valida y solo envía si `formState.isDirty` (D-J); reintenta una vez el guardado descartado durante el vuelo; «Cambios guardados.» desaparece al editar, al fallar y al ser bloqueada una salida de campo; el campo con foco nunca queda deshabilitado por el autoguardado |
| CA-2.3.3, CA-2.3.10 (CM-272) | Los campos no llevan `maxLength` y no cortan lo escrito: «2001 / 2000 caracteres» y los mensajes de longitud salen bajo el campo y no se guarda (C-19 resuelto) |
| CA-2.4.1 (experiencia `CURRENT`/`UNKNOWN_END` sin fecha de fin)   | Oculta y limpia el campo «Fecha de fin» cuando cualquiera de los dos checkboxes está marcado, en vez de solo omitir el envío. Desde el 14-oct-2026 el backlog dice «ocultar» (antes «deshabilitar»); el criterio se cerró en el PR 2 con el periodo «06/2024 – actual» (CUMPLIDO en el cliente; ver §3.3) |
| CA-2.4.43, CA-2.4.44, CA-2.4.60 (CM-273, PR 1) | `MonthField` deja teclear el texto; si no es «mm/aaaa» válido, el esquema muestra «Ingresa una fecha válida con el formato mm/aaaa.» bajo el campo en el que se escribió (inicio o fin) y no se guarda. Sin respaldo por estado HTTP: el servidor no se consulta |
| CA-2.4.25, CA-2.4.26, CA-2.4.34, CA-2.4.35 (CM-273, PR 1) | El esquema recibe el mes actual en UTC (D-M) y rechaza una fecha posterior con «La fecha no puede ser posterior al mes actual.» bajo el campo; la máscara sí deja teclear un mes futuro y el panel lo muestra apagado (D-N) |
| CA-2.4.14, CA-2.4.30 (CM-273, PR 1) | La comparación «fin anterior al inicio» es por mes y año sobre «AAAA-MM» (RT-07-CA02); experiencia y formación usan el mismo texto del backlog |
| CA-2.4.20, CA-2.4.24, CA-2.4.31, CA-2.4.33, CA-2.4.54, CA-2.4.55 (CM-273, PR 1) | El cliente acepta y envía la fecha como «AAAA-MM»; no valida edad ni nacimiento (la regla es del servidor, `DateBounds.java:32` y `:42`) y no consulta la fecha de nacimiento (D-N) |
| CA-2.4.2, CA-2.4.3, CA-2.4.6 (CM-273, PR 1) | Sin cambio de comportamiento: solo reciben pruebas con los textos reales de es-CO |
| 33 criterios de HU-2.4 (CM-273, PR 2) | Fuera del PR 1, cerrados en el PR 2 (CUMPLIDOS en el cliente, contra el mock; backend real y QA pendientes): CA-2.4.1, 7, 8, 10, 11, 12, 13, 15, 17, 18, 19, 21, 22, 23, 27, 28, 29, 32, 36, 37, 38, 39, 42, 46, 47, 48, 49, 51, 52, 53, 56, 58 y 59 (ver §3.3) |
| J-01 (gestión por ítem, no PATCH de colección)                    | `POST`/`DELETE` inmediato por ítem; sin `useFieldArray` — la lista visible es siempre la caché del servidor (SPEC.md §9, decisión D-A) |
| HU-2.4 (educación obligatoria)                                     | El botón «Finalizar» ya valida los 5 requisitos server-side (`POST .../completion`, CM-65) |
| HU-2.5 (habilidades: texto libre + nivel)                          | `SkillsSection` gestiona por ítem, sin catálogo; duplicado (texto normalizado) bloqueado en cliente; el servidor lo hará cuando Backend lo active (C-06) |
| HU-2.5 (finalizar muestra todos los requisitos incumplidos)        | `error.errors` se traduce campo por campo (`profile:formulario.requisitos.*`) y se listan todos a la vez, nunca solo el primero |
| HU-2.11, D-01, J-03 (roles: catálogo, sin prioridad ni reorden)    | El formulario nunca ofrece una acción de reordenar ni un campo de prioridad; `TargetRolesSection` no tiene drag-and-drop ni input numérico de orden |
| C-05 (sustituir es un `PATCH` real, conserva el `id`)              | `useSubstituteTargetRole` llama al `PATCH` por ítem; nunca compone un `DELETE` + `POST`                |
| CA-2.11.3 (bloqueo del último rol solo en `COMPLETED`)             | `TargetRolesSection` deshabilita "Eliminar" solo cuando `items.length === 1` y `isProfileCompleted`; con `IN_PROGRESS` sí se permite quedar sin roles |
| CA-2.11.7 (solo roles del catálogo)                                | El selector (`Combobox`/`Select`) no admite texto libre, solo selección de `PROFESSIONAL_ROLES` vía `useProfessionalRolesQuery` |
| CA-2.11.6 (reordenamiento/prioridad)                               | Retirado (D-01); no se implementa                                                                      |

## 7. Estado de implementación

| Archivo                                                                                        | Qué implementa                                                                                                              | Prueba                                                                                              |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/mocks/handlers/profiles.handlers.ts`                                                       | Infraestructura de apoyo: ciclo completo de mocks del perfil; deriva `summaryProvenance`/`summaryProvenanceOrigin` en el `PATCH` (CA-2.3.1/2/4; solo mock, el backend real no los tiene); CM-61 agrega 4 handlers por ítem (POST/DELETE de experiencia y educación) con las reglas reales de `WorkExperience.java`/`Education.java`; CM-65 agrega 2 handlers por ítem de habilidades y reemplaza el endpoint de finalización por el real (ver §5); CM-69 agrega 3 handlers por ítem de Roles Objetivo (POST/PATCH/DELETE) con las reglas reales de `ProfileController.java`, reemplazando el `PATCH` masivo de `targetRoleIds` que solo existía por no conocer el contrato; CM-273 PR 2 (solo aditivo): `startDate` opcional en experiencia, topes 4 y 5 con 409 y `code`, última formación de un perfil `COMPLETED` con 409 `EDUCATION_NOT_ALLOWED`, `code` en los 404 de bajas | `src/mocks/handlers/profiles.handlers.test.ts`                                                     |
| `src/mocks/handlers/professionalRoles.handlers.ts`                                              | CM-69: simula el catálogo real de roles TI vía GET (ver §5), a partir de `src/mocks/data/catalogs.ts` | `src/mocks/handlers/professionalRoles.handlers.test.ts`                                             |
| `src/features/professional-profile/organisms/ProfileMethodSelector/ProfileMethodSelector.tsx`  | §3.1 (CM-46): las dos tarjetas excluyentes; DF-004: la tarjeta manual queda `disabled` (`disabled={loading}`) mientras se crea, y la guarda contra la doble creación pasa a `NewProfilePage` (CA-2.2.7); CM-270: sin cambios, el mensaje de cupo entra por `errorMessage` y no se añaden props; la prueba suma la afirmación de «Próximamente» (CA-2.2.2) | `src/features/professional-profile/organisms/ProfileMethodSelector/ProfileMethodSelector.test.tsx` |
| `src/design-system/molecules/CardSelectable/CardSelectable.tsx`                                 | Design system (DF-004): prop `disabled`, independiente de `state` — pone el atributo nativo sin cambiar la apariencia; `state="disabled"` la implica. Único consumidor: `ProfileMethodSelector` | `src/design-system/molecules/CardSelectable/CardSelectable.test.tsx`                                |
| `src/features/professional-profile/pages/NewProfilePage.tsx`                                    | §3.1: la ruta «/perfiles/nuevo» — crea el perfil sin cuerpo al elegir «Llenado Manual» y navega al formulario con el id devuelto; CM-195: redirige si hay lastUsedProfileId; CM-270: sustituye el 409 «ya existe» por el reconocimiento del cupo agotado con `profile:metodo.errorCupoPlan`, el texto provisional de CA-2.2.3 (CM-298: por `code`, y suma `profile:metodo.errorCreacionEnCurso` para `PROFILE_CREATION_IN_PROGRESS`); DF-004: guarda síncrona `isCreatingRef` contra la doble creación (CA-2.2.7); la creación sigue en la página (deuda, nota técnica 4) | `src/features/professional-profile/pages/NewProfilePage.test.tsx`                            |
| `src/features/professional-profile/model/profileLimit.ts`                                       | §3.1 (CM-270): `isProfileLimitReached` — reconoce el cupo agotado de la creación de perfil por `code` (`PROFILE_LIMIT_REACHED` o `PLAN_LIMIT`), sin respaldo por estado (CA-2.2.3, CM-298, `ADR-0008`); acotada a esa llamada; CM-298 suma `isProfileCreationInProgress` para `PROFILE_CREATION_IN_PROGRESS` | `src/features/professional-profile/model/profileLimit.test.ts`                                      |
| `src/features/professional-profile/model/profile.constants.ts`                                  | §3.2/§3.3/§3.4/§3.5: límites y constantes de negocio; CM-61 agrega `DESCRIPTION_MAX_LENGTH`, `EDUCATION_LEVELS`, `MANUAL_PROVENANCE`, `PROFILE_COMPLETENESS_MAX`, ids de formulario, `DESKTOP_MEDIA_QUERY`; CM-65 agrega `SKILL_LEVELS`, `SKILL_NAME_MAX_LENGTH`, `SKILLS_FORM_ID`; CM-69 agrega `MAX_TARGET_ROLES`; CM-273 PR 2: `WORK_EXPERIENCE_MAX_COUNT` = 4 y `EDUCATION_MAX_COUNT` = 5, adición pura después de `SKILLS_MAX_COUNT`, fuera de `:62-63` y `:65-69` (D-V) | cubierto por las pruebas de los organismos y `EditProfilePage`                                    |
| `src/features/professional-profile/model/profile.types.ts`                                      | §3.2/§3.3/§3.4/§3.5: tipos de dominio; CM-61 agrega `EducationItem`, `WorkExperienceItem`, `EducationLevel`, `EmploymentStatus`, `DataProvenance`, `YearMonth` (valores confirmados contra el backend real); CM-65 agrega `SkillItem`, `SkillLevel`; CM-69 agrega `ProfessionalRole`, `TargetRoleItem` (mismo nivel de confianza); CM-273 PR 2: `WorkExperienceItem.startDate` admite `null` (CA-2.4.15, 22, 23, 42, 53) | cubierto por las pruebas de los organismos y `EditProfilePage`                                    |
| `src/features/professional-profile/model/yearMonth.ts`                                          | §3.3 (CM-61): `toYearMonth`/`formatYearMonth` — trunca la fecha del selector nativo a `YearMonth` (bloqueo C-14); CM-273 PR 1: se eliminó `toYearMonth` (el formulario ya guarda «AAAA-MM», D-K); C-14 cerrado; CM-273 PR 2: se borró `formatYearMonth` con su prueba y el archivo expone `formatWorkExperiencePeriod` y `formatEducationPeriod` `(item, t)`, que pintan «mm/aaaa» con `formatMonthValue`, el separador «–» y la pieza «Sin fecha de inicio» para un inicio nulo (§3.3, punto 1, D-U) | `src/features/professional-profile/model/yearMonth.test.ts`                                          |
| `src/features/professional-profile/model/profileCompleteness.ts`                                | §3 (CM-61): `getSectionStatuses`/`getCompletenessValue` para el índice de secciones y la barra de completitud (decisión D-D); CM-65 suma el cuarto requisito (≥1 habilidad) y la sección `skills`; CM-69 suma el quinto (≥1 rol objetivo) y la sección `target-roles` al índice | `src/features/professional-profile/model/profileCompleteness.test.ts`                                |
| `src/features/professional-profile/model/missingRequirements.ts`                                | §3.4 (CM-65): `getMissingRequirementFields` — lee `error.errors` de un `422` con `errors[]` no vacío, función pura separada de `EditProfilePage.tsx` para poder probarla sin renderizar | `src/features/professional-profile/model/missingRequirements.test.ts`                                |
| `src/features/professional-profile/schemas/generalInfo.schema.ts`                                | §3.2 (CM-53): validación zod de `name`/`summary`, sin mensajes de texto (CLAUDE.md §3.2)                                   | `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.test.tsx`             |
| `src/features/professional-profile/schemas/education.schema.ts`                                 | §3.3 (CM-61): validación zod de un ítem de Formación académica, con `.superRefine` para "en curso" y fecha de fin; CM-273 PR 1: es `createEducationSchema(currentMonth)`, una función que recibe el mes actual en UTC, valida «mm/aaaa» (con `monthDate.ts`), rechaza el mes futuro, compara fin e inicio por mes y año y transforma a «AAAA-MM» (D-K, D-M); no toca el `.max` de Ana Sofía; CM-273 PR 2 (previsto): sin cambio de reglas; el exceso de largo (`too_big`, de Sofía) pasa a tener texto en la sección (CA-2.4.28) | `src/features/professional-profile/organisms/EducationSection/EducationSection.test.tsx`             |
| `src/features/professional-profile/schemas/workExperience.schema.ts`                             | §3.3 (CM-61): validación zod de un ítem de Experiencia Laboral, con `.superRefine` para los checkboxes excluyentes; CM-273 PR 1: es `createWorkExperienceSchema(currentMonth)`, una función que recibe el mes actual en UTC, valida «mm/aaaa» (con `monthDate.ts`), rechaza el mes futuro, compara fin e inicio por mes y año y transforma a «AAAA-MM» (D-K, D-M); el inicio sigue obligatorio hasta el PR 2; no toca el `.max` de Ana Sofía; CM-273 PR 2: inicio opcional; la descripción se valida con `unicodeLength` mediante un `.refine` (D-X) con el código interno nuevo `DESCRIPTION_TOO_LONG` (CA-2.4.12, 15, 22, 53) | `src/features/professional-profile/schemas/workExperience.schema.test.ts` y `src/features/professional-profile/organisms/WorkExperienceSection/WorkExperienceSection.test.tsx`   |
| `src/features/professional-profile/schemas/monthDate.ts` | §3.3 (CM-273, PR 1, archivo nuevo que el SPEC no había previsto): reglas de una fecha «mm/aaaa» compartidas por los dos esquemas (formato y mes futuro, en ese orden; devuelve «AAAA-MM» o un código interno); evita duplicarlas en `education.schema.ts` y `workExperience.schema.ts` | Sin prueba propia: lo cubren indirectamente `src/features/professional-profile/organisms/WorkExperienceSection/WorkExperienceSection.test.tsx` y `src/features/professional-profile/organisms/EducationSection/EducationSection.test.tsx` |
| `src/features/professional-profile/schemas/skill.schema.ts`                                     | §3.4 (CM-65): validación zod de un ítem de Habilidad; el duplicado NO se valida aquí (depende de `items`, ajeno al schema) — vive en `SkillsSection` vía `setError` manual | `src/features/professional-profile/organisms/SkillsSection/SkillsSection.test.tsx`                   |
| `src/design-system/atoms/Select/Select.tsx`                                                     | Átomo nuevo (SPEC.md §9, decisión D-B): `<select>` nativo con la misma API que `Input`, para "Nivel educativo" — primer átomo nuevo del design system desde CM-100 | `src/design-system/atoms/Select/Select.test.tsx`                                                     |
| `src/design-system/molecules/MonthField/MonthField.tsx`                                          | §3.3 (CM-273, PR 1 — archivo nuevo): molécula del design system para las fechas de mes y año; entrada de texto con máscara «mm/aaaa» más panel flotante de 12 meses y flechas de año, sin días; envuelve `Input` sin modificarlo; entrega al formulario el texto crudo (D-K); solo maneja eventos, foco y accesibilidad (D-L); el panel abre en el año del valor si es válido y está en rango, y si no en el año actual; va del año actual hacia atrás 110 años con los meses futuros deshabilitados (D-N); los meses y las flechas cancelan el `mousedown` para que el blur no cierre el panel (patrón de `Combobox`); no existe en Figma (D-O). Lleva su propio barril de exportación, como el resto de componentes del design system | `src/design-system/molecules/MonthField/MonthField.test.tsx`                                         |
| `src/design-system/molecules/MonthField/index.ts` | §3.3 (CM-273, PR 1, archivo nuevo que el SPEC no había previsto): barril de `MonthField` (CLAUDE.md §14.6); expone solo `MonthField` | Sin prueba propia: solo reexporta; lo ejercitan al importar el componente las pruebas de `WorkExperienceSection.test.tsx` y `EducationSection.test.tsx` (`MonthField.test.tsx` importa el archivo directo, no el barril) |
| `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.tsx`                | §3.2 (CM-53): el formulario de Información General; CM-61 agrega showSectionTitle (decisión D-G); CM-194 sincroniza isDirty con unsavedChanges.store; CM-195 agrega el autoguardado en onBlur (decisión D-H); CM-272 lo pasa a cada campo con compuerta isDirty, retira el prop isSaving, agrega onDirtyChange y conserva lo escrito en vuelo con keepDirtyValues, reintenta una vez el guardado descartado en vuelo, valida siempre al salir del campo, restaura el resumen guardado tras el rechazo del perfil activo y ya no lleva `maxLength` en nombre ni resumen (decisión D-J, C-19) | `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.test.tsx`             |
| `src/features/professional-profile/organisms/EducationSection/EducationSection.tsx`              | §3.3 (CM-61): lista + alta/baja de Formación académica por ítem; CM-273 PR 1: inicio y fin son `MonthField`, con los mensajes de formato, mes futuro y fin anterior al inicio bajo el campo; el fin sigue oculto con «En curso»; la etiqueta del fin es «Fecha de fin» (D-S); CM-273 PR 2: `maxItems`/`maxItemsMessage` opcionales con botón deshabilitado, mensajes de longitud, `serverFieldErrors` aplicado con `setError`, guarda `useRef` soltada con promesa; `onAdd` y `onRemove` devuelven promesa (D-T, D-V, D-AB, D-AC, D-AG); la tarjeta del ítem parte los textos largos sin espacios (`wrap-anywhere`, `min-w-0`, botón `shrink-0`, D-AH) | `src/features/professional-profile/organisms/EducationSection/EducationSection.test.tsx`             |
| `src/features/professional-profile/organisms/WorkExperienceSection/WorkExperienceSection.tsx`    | §3.3 (CM-61): lista + alta/baja de Experiencia Laboral por ítem; deriva `employmentStatus` en la UI (checkboxes excluyentes); CM-273 PR 1: inicio y fin son `MonthField`, con los mensajes de formato, mes futuro y fin anterior al inicio bajo el campo; el fin sigue oculto con cualquiera de las dos casillas marcadas; CM-273 PR 2: ídem, más inicio opcional (sin `startDateErrorRequired`), descripción sin `maxLength` y contador y validación con `unicodeLength` (D-X); la tarjeta del ítem parte los textos largos sin espacios (D-AH) | `src/features/professional-profile/organisms/WorkExperienceSection/WorkExperienceSection.test.tsx`   |
| `src/features/professional-profile/organisms/SkillsSection/SkillsSection.tsx`                    | §3.4 (CM-65): lista + alta/baja de Habilidades por ítem, mostradas como `Chip`; duplicado bloqueado con `setError` manual   | `src/features/professional-profile/organisms/SkillsSection/SkillsSection.test.tsx`                   |
| `src/features/professional-profile/organisms/ProfileSectionsLayout/ProfileSectionsLayout.tsx`    | §3 (CM-61): índice de secciones — `StepList` en desktop, acordeón (`useDisclosure` por ítem) en móvil                       | `src/features/professional-profile/organisms/ProfileSectionsLayout/ProfileSectionsLayout.test.tsx`   |
| `src/features/professional-profile/organisms/ProfileActionsBar/ProfileActionsBar.tsx`            | §3 (CM-61): barra de acciones compartida — completitud, «Guardar borrador», «Finalizar y Continuar»; CM-65 conecta `onFinish`/`isFinalizing` al endpoint real | `src/features/professional-profile/organisms/ProfileActionsBar/ProfileActionsBar.test.tsx`           |
| `src/features/professional-profile/organisms/TargetRolesSection/TargetRolesSection.tsx`          | §3.5 (CM-69): lista + alta/sustitución/baja de Roles Objetivo por ítem; reutiliza `Combobox` (alta) y `Select` (sustitución), sin átomo nuevo | `src/features/professional-profile/organisms/TargetRolesSection/TargetRolesSection.test.tsx`         |
| `src/features/professional-profile/api/profile.dto.ts`                                          | §3.2/§3.3/§3.4/§3.5: forma cruda del ProfileRecord; CM-61 agrega EducationDto, WorkExperienceDto y los dos Add*RequestDto (campos reales del backend); CM-65 agrega SkillDto, AddSkillRequestDto (campos reales); CM-69 agrega TargetRoleDto, AddTargetRoleRequestDto, UpdateTargetRoleRequestDto (campos reales) y ProfessionalRoleDto ({id, nombre, categoria}, confirmada contra ProfessionalRoleController.java en CM-195); CM-273 PR 2: `WorkExperienceDto.startDate` y `AddWorkExperienceRequestDto.startDate` admiten `null` (solo ensanchan) | cubierto por los hooks de datos (integración vía MSW)                                                |
| `src/features/professional-profile/api/profile.mapper.ts`                                       | §3.2/§3.3/§3.4/§3.5: `ProfileDto → Profile`; CM-61 agrega `toAddEducationRequest`/`toAddWorkExperienceRequest` (deriva `employmentStatus`, trunca fecha — decisión D-F; CM-273 PR 1: dejó de truncar porque el esquema ya entrega «AAAA-MM»; la derivación de `employmentStatus` no cambia); CM-65 agrega `toAddSkillRequest` (sin derivación, solo fija `MANUAL_PROVENANCE`); CM-69 agrega `toProfessionalRole`, `toAddTargetRoleRequest`, `toUpdateTargetRoleRequest` (sin derivación real, solo fijan `MANUAL_PROVENANCE`); CM-273 PR 2: `toAddWorkExperienceRequest` envía `startDate: null` si está vacío | `src/features/professional-profile/api/profile.mapper.test.ts`                                       |
| `src/features/professional-profile/api/profile.api.ts`                                          | §3.2/§3.3/§3.4/§3.5: `fetchProfile`/`updateGeneralInfo`; CM-61 agrega `addEducation`/`removeEducation`/`addWorkExperience`/`removeWorkExperience`; CM-65 agrega `addSkill`/`removeSkill`/`finalizeProfile` (endpoint real de finalización, ver §5); CM-69 agrega `addTargetRole`/`substituteTargetRole`/`removeTargetRole`/`fetchProfessionalRoles` | cubierto por los hooks de datos (integración vía MSW)                                                |
| `src/features/professional-profile/hooks/useProfileQuery.ts`                                    | §3.2 (CM-53): `useQuery` del perfil por id, consumido por `EditProfilePage` desde CM-61                                    | `src/features/professional-profile/hooks/useProfileQuery.test.tsx`                                   |
| `src/features/professional-profile/hooks/useUpdateProfileGeneralInfo.ts`                        | §3.2 (CM-53): `useMutation` del guardado, escribe la respuesta directo en la caché de `useProfileQuery`                     | `src/features/professional-profile/hooks/useUpdateProfileGeneralInfo.test.tsx`                       |
| `src/features/professional-profile/hooks/useAddEducation.ts`                                    | §3.3 (CM-61): `useMutation` de alta de educación, mismo patrón de caché que `useUpdateProfileGeneralInfo`                   | `src/features/professional-profile/hooks/useAddEducation.test.tsx`                                   |
| `src/features/professional-profile/hooks/useRemoveEducation.ts`                                 | §3.3 (CM-61): `useMutation` de baja de educación                                                                            | `src/features/professional-profile/hooks/useRemoveEducation.test.tsx`                                |
| `src/features/professional-profile/hooks/useAddWorkExperience.ts`                                | §3.3 (CM-61): `useMutation` de alta de experiencia laboral                                                                  | `src/features/professional-profile/hooks/useAddWorkExperience.test.tsx`                              |
| `src/features/professional-profile/hooks/useRemoveWorkExperience.ts`                             | §3.3 (CM-61): `useMutation` de baja de experiencia laboral                                                                  | `src/features/professional-profile/hooks/useRemoveWorkExperience.test.tsx`                           |
| `src/features/professional-profile/hooks/useAddSkill.ts`                                         | §3.4 (CM-65): `useMutation` de alta de habilidad                                                                            | `src/features/professional-profile/hooks/useAddSkill.test.tsx`                                       |
| `src/features/professional-profile/hooks/useRemoveSkill.ts`                                      | §3.4 (CM-65): `useMutation` de baja de habilidad                                                                            | `src/features/professional-profile/hooks/useRemoveSkill.test.tsx`                                    |
| `src/features/professional-profile/hooks/useFinalizeProfile.ts`                                  | §3.4 (CM-65): `useMutation` de finalización (endpoint real, ver §5); el caso de éxito se prueba con un handler de MSW puntual, no con `seedProfileForTests` (`features` no puede importar `mocks`) | `src/features/professional-profile/hooks/useFinalizeProfile.test.tsx`                                |
| `src/features/professional-profile/hooks/useAddTargetRole.ts`                                    | §3.5 (CM-69): `useMutation` de alta de rol objetivo                                                                         | `src/features/professional-profile/hooks/useAddTargetRole.test.tsx`                                  |
| `src/features/professional-profile/hooks/useSubstituteTargetRole.ts`                             | §3.5 (CM-69): `useMutation` de sustitución de rol objetivo (`PATCH`, conserva el `id`)                                      | `src/features/professional-profile/hooks/useSubstituteTargetRole.test.tsx`                           |
| `src/features/professional-profile/hooks/useRemoveTargetRole.ts`                                 | §3.5 (CM-69): `useMutation` de baja de rol objetivo                                                                         | `src/features/professional-profile/hooks/useRemoveTargetRole.test.tsx`                               |
| `src/features/professional-profile/hooks/useProfessionalRolesQuery.ts`                           | §3.5 (CM-69): `useQuery` del catálogo cerrado de roles TI, llave `['professional-roles']`                                   | `src/features/professional-profile/hooks/useProfessionalRolesQuery.test.tsx`                         |
| `src/features/professional-profile/pages/EditProfilePage.tsx`                                   | §3, §3.2, §3.3, §3.4, §3.5 (CM-61/CM-65/CM-69): el armazón real de la ruta de edición del perfil — ya no `WizardLayout`/`EmptyState`; CM-65 agrega la cuarta sección y conecta «Finalizar y Continuar» al endpoint real; CM-69 agrega la quinta sección y el estado de carga/error del catálogo; CM-272 muestra el error del PATCH de Información General por code con getItemErrorMessage y oculta «Cambios guardados.» mientras el formulario esté sucio y resuelve el 403 PROFILE_NOT_ALLOWED de la carga como NOT_FOUND y devuelve el resumen guardado al formulario ante SUMMARY_NOT_ALLOWED (decisión D-J); CM-273 PR 1 calcula el mes actual en UTC (D-M) y lo pasa, junto con los textos de fecha, a las secciones de experiencia y formación como propiedad; CM-273 PR 2: usa los formateadores de periodo del modelo, pasa `maxItems`/`maxItemsMessage` y los textos de longitud a las dos secciones, traduce `errors[]` a un mapa campo→texto (`serverFieldErrors`), tabla propia de bajas y de `PROFILE_NOT_ALLOWED` (`findMessageByCode`), reserva `errors:generico`/`errors:red` en altas y bajas, estado de «última acción» por sección, `mutateAsync` (D-T a D-AG; sin editar las líneas de Sofía) | `src/features/professional-profile/pages/EditProfilePage.test.tsx`                                   |
| `src/features/professional-profile/routes.tsx`                                                  | Mapea las 3 rutas de esta feature bajo `professionalProfileShellRoutes`, incluida la de edición del perfil (CM-61 la muda desde `professionalProfileWizardRoutes`, retirada — decisión D-E) | `src/app/router/index.test.tsx` (features no puede importar RequireAuth, ver §9)                    |
| `src/utils/monthMask.ts`                                                                         | §3.3 (CM-273, PR 1 — archivo nuevo): funciones puras de la máscara «mm/aaaa», de la conversión «mm/aaaa» ↔ «AAAA-MM» (D-L) y del mes actual en UTC, `getCurrentUtcYearMonth` (D-M); precedente `src/utils/textFilters.ts`; CM-273 PR 2 (previsto): `formatMonthValue` pasa a dar el texto «mm/aaaa» de los periodos de la lista | `src/utils/monthMask.test.ts`                                                                         |
| `src/i18n/locales/es-CO/profile.json` | §3.3 (CM-273 PR 2): llaves nuevas de periodo, longitud y última formación; cinco llaves de periodo cambian de texto; se borran las cuatro `errorAgregar`/`errorEliminar` de formación y experiencia (D-AF) y `experiencia.fechaInicio.errorRequerido`; no se tocan las líneas de Sofía (`errorLimite` a `errorCaracteresInvalidos` de cada bloque) | `src/features/professional-profile/pages/EditProfilePage.test.tsx` y `src/features/professional-profile/model/yearMonth.test.ts` (los literales de longitud no tienen prueba propia: ver §3.3) |
| `src/i18n/locales/en/profile.json` | §3.3 (CM-273 PR 2): las mismas llaves en inglés (traducción de trabajo, `CLAUDE.md` §7) | `src/features/professional-profile/model/yearMonth.test.ts` |
| `src/utils/buttonLoadingProps.ts`                                                                | Infraestructura de apoyo (CM-61): arma el par `{loading, loadingLabel}` que `Button` exige, evitando repetir el condicional en 5 sitios | `src/utils/buttonLoadingProps.test.ts`                                                                |
| `src/stores/unsavedChanges.store.ts`                                                             | CM-194: bandera de cliente hasUnsavedChanges que GeneralInfoForm mantiene y que la confirmación de cierre de sesión lee (§3.2) | `src/stores/unsavedChanges.store.test.ts`                                                           |
| `src/stores/uiPreferences.store.ts`                                                              | lastUsedProfileId (conveniencia de solo cliente, localStorage; ADR-0004) que NewProfilePage, EditProfilePage y AppShell leen; se borra al perder la sesión (useLogout y AuthProvider, CA-1.8.3, C-17) | —                                                                                                  |
| `src/layouts/AppShell.tsx`                                                                       | Cabecera compartida: enlace «Perfiles» hacia lastUsedProfileId y menú de usuario con cierre de sesión (CM-194, ver `src/features/auth/SPEC.md`) | `src/layouts/AppShell.test.tsx`                                                                    |
| `src/features/professional-profile/pages/ProfileRolesPage.tsx`                                   | Placeholder de PRT-02.07, conservado hasta HU-2.10 (§3.5); sin enlaces, sin prueba                                          | —                                                                                                  |
| `src/test/setup.ts`                                                                              | Infraestructura de apoyo: reinicia los mocks antes de cada prueba; CM-61 agrega el stub de `window.matchMedia` (ver §9)      | —                                                                        |
| `src/test/matchMedia.ts`                                                                         | Infraestructura de apoyo (CM-61): stub controlable de `window.matchMedia` — jsdom 30 no lo implementa (ver §9)              | cubierto indirectamente por `EditProfilePage.test.tsx` y `ProfileSectionsLayout.test.tsx`             |
| `src/test/msw.ts`                                                                                | Infraestructura de apoyo: instala handlers puntuales de MSW desde una prueba de feature, ver §9                             | —                                                                                                  |

`ProfileRolesPage.tsx` sigue siendo placeholder con `EmptyState` — deliberadamente sin tocar en
CM-69 (ver §3.5): la gestión real de Roles Objetivo ya vive dentro de `EditProfilePage`, pero esa
pantalla y su ruta se conservan hasta HU-2.10 (Sprint 2), cuya sugerencia por IA irá dentro del
formulario (C-04, respondida el 13-sep). `WizardLayout.tsx` no cambia: conserva a `interview-setup` como
único consumidor.

## 8. Bloqueos

Enunciados citados de
`docs/decisiones/11092026_v1_consulta-contrato-y-alcance-perfil-profesional.md` (consulta de
seguimiento de Frontend a la respuesta del PO del 11-sep).

| Id   | Qué falta                                                                                                                                                                                                                                                                | De quién depende             | Desde                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------- |
| C-01 | ~~Fuente documentable de los campos y límites que cita la respuesta del 11-sep (`skillName`, `target-roles`, `inProgress`, `ProblemDetail`, `name ≤ 255`), ninguno presente en el backlog del 6-sep~~ — **parcialmente cerrado.** Respuesta oficial del PO del 13-sep (`docs/decisiones/13092026_v1_respuesta-oficial-frontend-C01-C09.md`, C-01) fija la fuente (código/OpenAPI de MicroPerfilPro, ya en `13092026_01_Backlog.xlsx`) y confirma `name ≤ 255` (aplicado en CM-61 este commit). El archivo `13092026_01_MicroPerfilPro_OpenAPI_actual.json` en sí no ha llegado a Frontend, así que los DTO siguen `PROVISIONAL` (§8 más abajo, §5) hasta tenerlo; `skillName`/`target-roles`/`inProgress` quedan documentados para CM-65/CM-69 | Backend                      | fuente confirmada 13-sep-2026; OpenAPI sin compartir |
| C-02 | Si la identidad por cabecera `X-User-Id` es temporal o el diseño definitivo. **Remitida a Backend/Arquitectura (13-sep-2026):** según el código revisado por el PO, el diseño previsto es que el Gateway verifique el token de Firebase y propague el UID en esa cabecera (no la envía el navegador), y el Gateway aún no estaba configurado; falta que Arquitectura confirme el esquema definitivo y la fecha. Frontend sigue enviando solo el token de Firebase | Backend / Arquitectura       | remitida el 13-sep-2026, sin fecha |
| C-03 | ~~Si la pantalla de Selección de Método conserva el campo `name` y si crear el perfil consume el cupo antes de que el usuario guarde algo~~ — **cerrado por Producto, 13-sep-2026.** El nombre ya no se pide en esa pantalla; el cupo se valida antes de crear (CA-2.2.1, CA-2.2.3); ambas rutas convergen en el mismo perfil (CA-2.2.4); el backend real admite **un solo perfil por usuario** (`409` si ya existe, ver §3.1); en el MVP no se puede descartar un borrador (HU-2.12, Sprint 3) y Producto lo acepta | Product Owner                | resuelto 13-sep-2026                |
| C-04 | ~~Destino de HU-2.10 (sugerencia de roles con IA, Sprint 2) tras retirar `PRT-02.07`, la pantalla que usaba~~ — **parcialmente cerrado, 13-sep-2026.** El memo oficial del PO confirma que HU-2.10 no se elimina (sigue en Sprint 2) y que se integrará *dentro* del formulario de PRT-02.03 cuando llegue, no en una pantalla aparte; con eso ya no bloquea CM-69 (decisión H, §9). `ProfileRolesPage.tsx`/`/perfiles/:id/roles` se conservan hasta que se construya HU-2.10 (Sprint 2), cuando se decide su retiro (`CLAUDE.md` §12 abierta 10) | Product Owner                | respondido 13-sep-2026; página y ruta pendientes de HU-2.10 |
| C-05 | ~~Si CM-69 se mantiene como ticket propio para la sección de roles dentro del formulario o su alcance se absorbe en CM-65; si «sustituir» sigue siendo una acción distinta sin sugerencias de IA~~ — **cerrado, 13-sep-2026.** El memo oficial del PO confirma que CM-69 sigue siendo ticket propio, y que «sustituir» es un `PATCH` real que conserva el `id` del Rol Objetivo (nunca «eliminar y agregar») — confirmado además por el código real de `ProfileController.java#updateTargetRole`, compartido en la sesión que construyó CM-69 | Product Owner / Scrum Master | resuelto 13-sep-2026, CM-69          |
| C-06 | ~~Valores de `SkillLevel`; criterio de duplicado con texto libre («Java» vs «java»); límite de caracteres por habilidad y máximo por perfil~~ — **cerrado, 13-sep-2026 (CM-65).** `SkillLevel` = `BASIC`/`INTERMEDIATE`/`ADVANCED` (memo del PO y código real de `ProfileController.java`, confirmados en la sesión que construyó CM-65); duplicado = mismo texto ignorando mayúsculas y espacios, rechazado por el backend real con `409` (implementado también en cliente); `skillName` 1-255 caracteres; sin máximo de habilidades por perfil | Product Owner / Backend      | resuelto 13-sep-2026, CM-65         |
| C-07 | ~~Si la lista `TECHNICAL`/`UNDERGRADUATE`/`POSTGRADUATE` es intencional; estado «interrumpida»~~ — **niveles confirmados por el PO el 13-sep-2026** (simplificación intencional; sin «interrumpida»). **Sigue abierto solo lo de las etiquetas en español:** Técnico/Pregrado/Posgrado (`profile.json`) son una propuesta de Frontend que Producto debe aprobar; no hay aprobación registrada | Product Owner                | niveles resueltos 13-sep-2026; etiquetas sin aprobación |
| C-09 | Origen documentable de `preferredModality` — cero ocurrencias en el backlog, `GLOSSARY.md` o los tres memos de decisiones; no se implementa hasta que exista. **Ojo con la colisión de ids:** el «C-09» del memo del PO del 13-sep es otra consulta (fecha del spike de Entrevistas); este id es solo de este SPEC. `preferredModality` ya está en `ProfileDto` (el backend real lo envía) y sigue sin consumidor | Backend / Product Owner      | detectado 13-sep-2026, CM-53        |
| C-10 | El frame real de PRT-02.03 (nodo `140:960`/`142:638`) dibuja un campo «Ubicación» en la sección Información General que ningún CA de HU-2.3 menciona, que no está en `GLOSSARY.md` ni en el contrato de mocks — ¿entra a HU-2.3, es de otra HU, o el frame quedó desactualizado? No se construye hasta confirmar | Product Owner                | detectado 14-sep-2026, CM-53        |
| C-11 | El mismo frame muestra el contador de `summary` en «0 / 600 caracteres»; `GLOSSARY.md` §2, HU-2.5 (backlog 12-sep) y el memo del PO del 11-sep dicen 2000. CM-53 mantuvo 2000 por decisión explícita del usuario, pero uno de los dos artefactos (el frame o el glosario) está desactualizado y nadie lo ha corregido | Product Owner / Diseño       | detectado 14-sep-2026, CM-53        |
| C-12 | El frame de «Formación académica» (nodo `132:2467`) no dibuja «Campo de estudio» ni «Fecha de inicio», pero el backend real (`AddEducationRequest`/`Education.java`) exige `startDate` (obligatoria) y acepta `fieldOfStudy` (opcional, sin validar). Se agregan ambos campos al formulario porque el contrato real manda en comportamiento (CLAUDE.md §16) — ¿el frame quedó desactualizado, o el equipo de diseño decidió omitirlos a propósito? | Product Owner / Diseño       | detectado 14-sep-2026, CM-61        |
| C-13 | El contador de «Descripción de funciones» del frame muestra «0 / 1000 caracteres»; el backend real (`WorkExperience.MAX_TEXT_LENGTH`) limita a 500. Se usa 500 (el backend rechazaría cualquier valor mayor con un 422), mismo criterio que C-11 | Product Owner / Diseño       | detectado 14-sep-2026, CM-61        |
| C-14 | ~~El backend real almacena `java.time.YearMonth` (`"YYYY-MM"`, sin día) para las fechas de experiencia y educación; el frame dibuja un selector `dd/mm/aaaa` completo. Se usa `<Input type="date">` (fiel al frame) y se trunca el día al enviar (`model/yearMonth.ts`) — el día que el usuario elige se descarta silenciosamente. ¿Debería el control pedir explícitamente solo mes/año?~~ — **deja de aplicar, 14-oct-2026 (CM-273, PR 1).** El control cambia: el backlog v7 pide fechas «mm/aaaa» (mes y año, RT-07-CA03) y CA-2.4.43, 44 y 60 exigen poder escribir «13/2024» y recibir un mensaje, así que el selector nativo con día se reemplaza por `MonthField` (D-K a D-O, §9): sin día en ninguna parte y sin truncar. Cierre confirmado el 15-oct-2026 con el PR 1 implementado y sus pruebas en verde | —                            | detectado 14-sep-2026, CM-61; cerrado por CM-273 (PR 1) |
| C-15 | El frame usa un componente `select` (nodo `32:150`, confirmado real) para «Nivel educativo» y un ícono `calendar` en los campos de fecha; ninguno de los dos existía en `design-system` antes de CM-61. Se construyó el átomo `Select`; el ícono de calendario no hizo falta (`<input type="date">` nativo ya trae el suyo del navegador) — ¿debería `design-system/icons/registry.tsx` tener un `calendar` propio para otros usos futuros? | Diseño                        | detectado 14-sep-2026, CM-61        |
| C-16 | ~~El endpoint real de finalización no es `POST /api/v1/profiles/:id/finalize` (como lo simulaba el mock desde CM-61) sino `POST /api/v1/profiles/:id/completion`~~ — **cerrado, 15-sep-2026 (CM-65).** Confirmado por `ProfileController.java#completeProfile` (detectado en la sesión que construyó CM-69, corregido en la que construyó CM-65, dueña de la pantalla de finalizar — §5 ya lo refleja). Existe además `POST /api/v1/profiles/:id/review-requests` (transición a `IN_REVIEW`), que no aplica en Sprint 1 (`GLOSSARY.md` §3) | Frontend                     | resuelto 15-sep-2026, CM-65         |
| C-17 | ~~**Defecto abierto:** `lastUsedProfileId` no se limpiaba al cerrar sesión, y otra cuenta en el mismo navegador cargaba el perfil de la anterior (`403`)~~ — **cerrado por CM-243 (DF-003, `CA-1.8.3`).** `useLogout` y `AuthProvider` (al reportar Firebase que no hay usuario: logout, `401` o sesión vencida) ponen `lastUsedProfileId` en `null`; ver `features/auth/SPEC.md` §9. Prueba manual en navegador pendiente | Frontend | detectado 6-oct-2026; cerrado 7-oct-2026 |
| C-18 | Backend debe confirmar que `code`, `requestId` y `errors[].code` ya viajan en las respuestas de error de Perfil en staging (documento del 6-oct, cambio 1: «Perfil desde el 9 oct»; el del 9-oct sobre HU-2.3 a 2.5 dice que parte de ese contrato aún no está en `develop`), y avisar cuando `PROFILE_CREATION_IN_PROGRESS` (en `develop` de `cameia-perfil` desde el commit `147d1e8`, PR #80) llegue a staging. Sin el `code`, la pantalla muestra el mensaje genérico (`ADR-0008`, estricto). **Ya no hay contradicción sobre `EMAIL_NOT_VERIFIED`:** `cameia-gateway` (`develop`, `1f7b8ee`, CM-179) sí emite el `403 EMAIL_NOT_VERIFIED` (`FirebaseAuthGlobalFilter.java:105`, `:253-254`, `:266-267`, `:509-513`), salvo en `POST /api/v1/users/me/verification`; el documento de Backend lo da por desplegado y comprobado en staging (eso no se verifica desde git). `cameia-web` lo trata en `httpClient.ts:107-109`. **Sigue sin confirmación escrita** que `code`, `requestId` y `errors[].code` de **Perfil** viajen en staging. `docs/estandar-backend.md` del Gateway aún da `PLAN_LIMIT` como reservado y no emitido: el `403` del cupo (CA-2.2.3) sigue sin desplegarse | Backend (Paula Andrea Muñoz Delgado) | solicitado 9-oct-2026 (CM-270); abierto, CM-298 |
| C-19 | ~~`maxLength` del nombre (255) y del resumen (2000) impide escribir el carácter 256 / 2001; CA-2.3.3 y CA-2.3.10 exigen ver «2001 / 2000 caracteres» y los mensajes de longitud sin guardar (RT-01-CA03 y RT-01-CA07: «sin cortar lo escrito»)~~ — **RESUELTO, 13-oct-2026.** El Product Owner (Juan David) decidió mantener el backlog con las reglas actuales, así que el código se adapta al criterio: CM-272 quita el `maxLength` de los dos campos de HU-2.3 (`GeneralInfoForm.tsx`). Los mensajes ya existían en es-CO y en; el contador ya pintaba «2001 / 2000» sin cortar. **Pendiente, fuera de esta tarjeta:** los campos de HU-2.4 y del registro siguen con el tope (ver «Fuera de alcance de CM-272») | — | detectado 11-oct-2026; resuelto 13-oct-2026, CM-272 |
| C-20 | El `PATCH` de `profiles.handlers.ts` no coincide con el servidor real: responde `400` sin `code` al validar el nombre (`:235`, `:376`) donde el servidor responde `422 VALIDATION_FAILED`; no tiene rama de perfil `COMPLETED` que vacíe el resumen (`SUMMARY_NOT_ALLOWED`), ni de perfil ajeno (`403 PROFILE_NOT_ALLOWED`), ni valida el largo del resumen. Por eso las pruebas con el mock pueden pasar mientras staging falla. Alinearlo puede romper pruebas de HU-2.4, 2.5 y 2.11. Tarea propia, fuera de CM-272 | Frontend (con revisión de quien lleve HU-2.4, 2.5 y 2.11) | detectado 11-oct-2026, CM-272 |
| C-21 | DF-007 (CA-2.3.1 y CA-2.3.4) sin causa confirmada: por código el servidor ya borra el resumen vacío en Borrador (`cameia-perfil` commit `66eccda`, 8-oct; prueba `GeneralInfoEndToEndIT.java:94-107`) y el cliente envía `""` y confirma solo tras un 2xx. **Evidencia nueva (12-oct-2026):** `cameia-perfil/specs/CM-54-informacion-general-resumen/spec.md:18` dice que el servidor ya está corregido y deja «la parte de CM-247 de la interfaz» a Frontend (`:224`); el aviso de testing del 11-oct probó staging con `cameia-perfil@9355f1a` y `cameia-web@4b3f915`; **no existe re-prueba de DF-007 posterior al 26-sep** (el aviso no lo menciona). Numeración: `CP-050/EJ-036` y `CP-056/EJ-038` son del **libro del Sprint 1**; el libro del Sprint 2 usa EJ-036 y EJ-038 para DF-003 y DF-005. Falta comprobar contra staging qué devuelve el `GET` tras el `PATCH` con la versión de CM-272. **SIGUE ABIERTO** | QA / Backend (Paula Andrea Muñoz Delgado) | probado 26-sep-2026 (`cameia-web@a3e46cb`); revisado 11-oct-2026, CM-272 |
| C-22 | **Observación fuera de CM-273, aviso pendiente a Ana Sofía (celda O41 de la v8, caracteres de control).** La O41 trae literales por campo («La empresa tiene caracteres no permitidos.», etc.); el backend ya los envía (`WorkExperience.java:33`, `:36`, `:39`; `Education.java:29`, `:32`) con los cinco `code` `*_INVALID_CHARACTERS`, y el front los muestra con **un solo** texto genérico, «El campo contiene caracteres no permitidos.» (`profile.json:110` y `:160`; entradas en `EditProfilePage.tsx:370-371` y `:440-444`; todo de Ana Sofía, PR #72). Ningún criterio de HU-2.4 de la v7 lo exige y no se pudo comprobar si la O41 es texto nuevo de la v8 (el libro no está en disco). Hay una pregunta gemela abierta para HU-2.3 (nombre y resumen). CM-273 no lo toca (D-Y). **Avisar a Ana Sofía** de qué texto cambiaría si se decide implementarlo. **ABIERTO** | Ana Sofía / PO | observado 16-oct-2026, CM-273 PR 2 |

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
2. Texto de pie del frame PRT-02.02, **descartado**. El frame muestra, debajo de las dos tarjetas,
   esta frase literal: «Puedes combinar las dos: empezar manual y subir tu CV después, o al
   revés.» Contradice el backlog v6 (en el MVP solo «Llenado Manual» está habilitado; la IA se
   muestra deshabilitada con «Próximamente»), así que no se implementa ni se guarda para
   recuperarlo: ya no es «omitido para Sprint 1» ni vuelve con HU-2.6. La frase queda transcrita aquí
   únicamente como registro de lo que dibuja el frame. El prototipo está congelado hasta fin de
   semestre como referencia estética; su corrección en Figma queda pendiente.
3. Cabecera de `AppShell` (layout compartido de `/inicio`, `/perfiles/nuevo` y
   `/perfiles/:id/roles`, no exclusivo de esta feature): el frame dibuja un logotipo compuesto de
   glifo vectorial + wordmark «cameia» (nodo `logo`, `121:184` en sm, `191:500` en lg). Se
   implementa solo el wordmark, en texto (`text-h3 font-extrabold`, el token de tipografía más
   cercano a los ~20px medidos en el frame lg — sin tracking negativo, que no tiene token): el
   glifo es un activo de marca vectorial que no existe todavía en `design-system`, y dibujarlo a
   mano sería inventarlo. Se completa cuando exista el SVG oficial, sin rehacer esta cabecera. El
   avatar y el menú de usuario del `nav-header` del frame lg quedaron fuera en CM-46; **hoy ya
   existen** (`MenuUsuario` en el `<header>` de `AppShell` y cierre de sesión, CM-194 — ver
   `src/features/auth/SPEC.md` §3). Solo sigue vigente la parte del glifo del logo.

**Divergencias respecto al backlog v6, HU-2.2 (CM-270, 9-oct-2026).**

1. ~~CA-2.2.7: el literal «el botón queda deshabilitado» no se cumplía.~~ **Retirada: QA la rechazó
   (DF-004, 11-oct-2026, staging, `cameia-web@fb274a5`).** Además existía una carrera: la guarda
   dependía del re-render (`if (loading) return` sobre una prop derivada de `isPending`), y dos
   clics separados por 2,9 ms se colaban y producían dos `POST /api/v1/profiles`; la nota anterior
   («el comportamiento cumple») era una hipótesis sin prueba. Corregido: guarda síncrona con
   `useRef` en `NewProfilePage` y atributo `disabled` en la tarjeta, que conserva el aspecto de
   seleccionada gracias a la prop `disabled` de `CardSelectable`, independiente de `state`.
   **Pendiente de Figma:** falta el `node-id` de `card-selectable`; no se revisó si el prototipo
   contempla «seleccionada y deshabilitada». Manda el backlog en comportamiento (`CLAUDE.md` §16).
2. CA-2.2.3: se implementa la versión provisional del criterio, con el texto corto y sin «Ver planes»
   ni «Ahora no», porque el Paywall (CA-2.12.1) es Sprint 3.
3. CA-2.2.3: el cupo se reconoce por estado HTTP (409 o 403), no por `code` como pide Backend, porque
   `ApiError` y `errorMap` son compartidos con CM-267 y no se tocan en esta tarea.

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
- **D-D — `progress-bar` con `max=5` fijo.** En CM-61 `value` solo podía calcular 3 requisitos
  (nombre, resumen, ≥1 educación); los otros 2 (habilidad, rol objetivo) los sumaron CM-65 y CM-69
  sin tocar la constante `PROFILE_COMPLETENESS_MAX`. Con `max=3` el usuario habría visto «3 de 3»
  junto a un botón «Finalizar» muerto — engañoso. **Hoy el progreso suma los 5 requisitos y el
  índice de secciones lista 5 ítems** (Información General, Formación académica, Experiencia Laboral,
  Habilidades, Roles Objetivo): «Expectativas Profesionales» no se construye (D-02) y por tanto no se
  incluye ni deshabilitada.
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
- **D-H — Autoguardado de Información General en `onBlur` + "Experiencia Laboral" marcada
  "Opcional" en el índice (CM-195, sin precedente de Figma para ninguna de las dos).** Hallazgo de
  uso real: exigir un clic aparte en "Guardar borrador" para la única sección sin persistencia por
  ítem arriesgaba pérdida silenciosa de datos, y el estado permanente `upcoming` de "Experiencia
  Laboral" en el stepper se leía como un bug, no como "no es obligatoria". Se agrega `onBlur` al
  `<form>` de `GeneralInfoForm` (dispara solo cuando el foco sale del formulario completo, con un
  guard `isSubmittingRef` contra el doble envío cuando el clic en "Guardar borrador" también
  dispara ese blur) y un campo opcional `secondaryLabel` en `StepListItem`/`ProfileSection` para la
  etiqueta "Opcional", con tratamiento visual mínimo (texto mudo, no un badge nuevo) a falta de
  diseño verificado en Figma. "Guardar borrador" se conserva como respaldo explícito (decisión del
  usuario). No cambia la lógica de completitud (`profileCompleteness.ts`) ni el criterio de qué
  cuenta como uno de los 5 requisitos de finalización.
- **D-I — Perfil ya `COMPLETED` visible, y `lastUsedProfileId` conectado (CM-195).** Hallazgo de
  uso real: con 5/5 requisitos completos, "Finalizar y Continuar" seguía deshabilitado sin
  explicación visible — la causa real (`profile.status === 'COMPLETED'`, backend real confirmado
  contra `ProfileController.java`/`ProfileAppService`) solo vivía en un hint `sr-only`.
  `EditProfilePage.tsx` ahora muestra `profile:formulario.yaActivo` de forma visible (guardado
  contra duplicar el aviso de éxito de `finalizeProfile.isSuccess` de esta misma sesión) y cubre
  también el `409` de `ProfileAlreadyCompletedException` si el botón se dispara con caché vieja.
  Investigando el caso relacionado "error genérico al crear un perfil cuando ya existe uno"
  (`ProfileAlreadyExistsException`, `409` real en `POST /api/v1/profiles`, confirmado contra el
  código fuente), se encontró que `stores/uiPreferences.store.ts` ya tenía `lastUsedProfileId`
  pensado exactamente para este caso (`GLO-TBD-06`) pero **nunca conectado**: se conecta ahora en
  `NewProfilePage.tsx` (se guarda al crear, y redirige de inmediato si ya existe — cubre el caso de
  volver con el botón atrás del navegador) y en `EditProfilePage.tsx` (backfill al cargar, para
  perfiles abiertos antes de esta conexión). `AppShell.tsx` deja de enlazar "Perfiles" siempre a
  `/perfiles/nuevo`: con `lastUsedProfileId`, va directo al perfil. Es una conveniencia de solo
  cliente (`localStorage`), no infalible — por eso `NewProfilePage.tsx` también distingue el `409`
  de "ya existe" del error genérico (`ApiError.isConflict()`, nuevo), como red de seguridad.
- **D-J — Autoguardado por campo, solo con cambios, y errores del `PATCH` visibles (CM-272,
  11-oct-2026; implementada el 12-oct-2026). Matiza D-H.** D-H puso el `onBlur` en el `<form>` y
  disparaba solo al salir del formulario completo, sin comprobar si había algo que guardar. Las
  Observaciones de HU-2.3 (backlog v6) piden guardar al quitar el foco de **cada** campo, con un
  valor válido y **distinto del guardado**, y CA-2.3.13/CA-2.3.14 lo exigen. Se decide:
  (1) el `onBlur` pasa a cada campo y sigue entrando por `trySave`;
  (2) el guardado automático solo se envía si `formState.isDirty` del **formulario** es `true` — no
  `dirtyFields` por campo, porque el `PATCH` envía `name` y `summary` juntos y distinguir el campo no
  cambia lo que viaja. **La compuerta es sobre el envío, no sobre la validación:** salir de un campo
  siempre valida (corregido el 12-oct-2026, defecto B);
  (3) «Guardar borrador» sigue enviando siempre;
  (4) un campo con foco no puede quedar deshabilitado por el autoguardado: los campos ya no se
  deshabilitan al guardar y **se retira el prop `isSaving` de `GeneralInfoForm`** (cambio de interfaz
  del organismo; su único uso era ese deshabilitado);
  (5) el error del `PATCH` se muestra en `EditProfilePage` resuelto por `code` con
  `getItemErrorMessage` (sin modificarla), nunca a la vez que la confirmación;
  (6) «Cambios guardados.» **se oculta mientras el formulario esté sucio**; la regla «una salida
  bloqueada quita la confirmación» era redundante (un valor inválido ya es un cambio). El mecanismo es
  el prop `onDirtyChange` de `GeneralInfoForm`, no `unsavedChanges.store`: ese store es un booleano
  global para el diálogo de cerrar sesión y atar la confirmación a él la volvería falsa con otro
  formulario sucio;
  (7) tras un guardado exitoso se usa `reset(values, { keepDirtyValues: true })`: lo escrito mientras el
  `PATCH` estaba en vuelo **no se pierde**. Efecto colateral correcto: el formulario sigue sucio y el
  siguiente `blur` reenvía, porque lo escrito en vuelo aún no está guardado. Alternativa descartada:
  bloquear los campos durante el vuelo, porque impide escribir. **Esta regla salió de la prueba `k2`,
  no del backlog**: es una consecuencia del autoguardado por campo que el backlog no previó;
  (8) un guardado descartado por el candado durante el vuelo se reintenta una vez al terminar el
  `PATCH` en curso con éxito, si lo escrito difiere de lo enviado (nunca dos `PATCH` a la vez, nunca
  bucle; defecto D2);
  (9) la carga de un perfil ajeno (`403 PROFILE_NOT_ALLOWED`) muestra «No encontramos lo que buscabas.»
  igual que el guardado (defecto C); CA-2.3.11 cubre las dos rutas;
  (10) **«conservar el resumen» de CA-2.3.12 incluye la pantalla, no solo el servidor:** tras el rechazo
  del perfil activo (`SUMMARY_NOT_ALLOWED`) el campo vuelve a mostrar el resumen guardado. La restauración
  es **solo** para ese `code` (ADR-0008) y por RT-05 nunca se aplica a otros errores, que conservan lo
  escrito. Resuelve además el bucle de reenvíos del campo vacío y sucio;
  (11) **el nombre y el resumen no llevan `maxLength`** (C-19 resuelto el 13-oct-2026): el Product Owner
  mantuvo las reglas del backlog (RT-01-CA03 y RT-01-CA07, «sin cortar lo escrito»), así que se puede
  escribir de más, el contador marca «2001 / 2000 caracteres» y el mensaje de longitud sale bajo el campo.
  El autoguardado no envía un valor inválido: zod lo rechaza antes de llamar a `onSubmit`.
  `unsavedChanges.store` no cambia: ya depende de `isDirty` y su único consumidor de producción es
  `AppShell.tsx:149-151`. D-H se conserva como historia; en lo que choquen, manda D-J.

**Decisiones de diseño, PRT-02.03 (CM-273, PR 1, 14-oct-2026 — todas aprobadas; SPEC escrito antes del
código).**

- **D-K — `MonthField` entrega al formulario el texto crudo; el esquema de Zod valida «mm/aaaa» y
  transforma a «AAAA-MM».** Motivo: con la otra opción (entregar «AAAA-MM» solo si es válido y vacío en otro
  caso), una fecha inválida y un campo opcional vacío serían indistinguibles, y el inicio de experiencia es
  opcional (CA-2.4.15). Matiza D-F: el truncado de fecha en el mapper desaparece; la derivación de
  `employmentStatus` no cambia. **Hipótesis comprobada el 15-oct-2026 (valores):** `zodResolver` entrega a
  `handleSubmit` los valores ya transformados por Zod, de modo que el mapper recibe «AAAA-MM» (prueba
  `zodResolverTransform.test.ts`, verde, con un esquema mínimo propio). El tipado con entrada y salida
  distintas sigue sin comprobarse (§3.3, punto 5).
- **D-L — La lógica pura de la máscara y de la conversión «mm/aaaa» ↔ «AAAA-MM» vive en `src/utils/` con su
  propia prueba.** Motivo: `CLAUDE.md` §4 manda las funciones puras con prueba a `utils/` (precedente
  `src/utils/textFilters.ts`); el componente solo maneja eventos, foco y accesibilidad. El archivo es
  `src/utils/monthMask.ts` y su prueba `src/utils/monthMask.test.ts`.
- **D-M — El esquema de Zod es una función que recibe el mes actual en UTC; la sección se lo pasa con
  `useMemo`.** Motivo: el mes deja de ser una dependencia escondida y las pruebas no necesitan congelar el
  reloj (RT-07-CA04). Los esquemas de experiencia y de formación hoy son constantes de módulo usadas por
  `zodResolver` (`WorkExperienceSection.tsx:124`, `EducationSection.tsx:141`). **El mes actual en UTC lo
  calcula la página (`EditProfilePage`) y lo pasa a cada sección como propiedad; la sección se lo entrega
  al esquema con `useMemo`.** Motivo: la lógica de decidir vive en la página, no en el organismo (regla del
  equipo; `CLAUDE.md` §4 describe `pages/` como una página por PRT y `organisms/` como componentes con
  dominio), y así las dos secciones comparten el mismo valor en un render. La función que lo calcula es
  `getCurrentUtcYearMonth` y vive en `src/utils/monthMask.ts` (§3.3, punto 6).
- **D-N — Panel de `MonthField`: del año actual hacia atrás 110 años; los meses futuros se muestran
  apagados; no se usa la fecha de nacimiento.** Motivo: 110 años es el tope de plausibilidad que ya usa el
  registro (precedente `src/utils/calculateAge.ts:15`) y esta pantalla no consume la fecha de nacimiento;
  las reglas de edad y de nacimiento son del servidor. La máscara sigue permitiendo teclear un mes futuro, y
  por eso CA-2.4.25, 26, 34 y 35 siguen siendo comprobables en la interfaz.
- **D-O — `MonthField` no existe en Figma en ninguna versión: el nombre y el aspecto del panel son decisión
  de Frontend, no un olvido.** Los frames de PRT-02.03 que hay en Figma son de una versión anterior con campos
  distintos: sirven como referencia de **estilo**, nunca de contenido; el backlog v7 manda en qué campos
  existen y qué textos llevan (`CLAUDE.md` §16: el comportamiento lo fija el backlog, el diseño lo fija
  Frontend). Referencias (no se abrieron al escribir esta decisión):
  - https://www.figma.com/design/AtnBhZlleecszZ0lDnNBzl/Cameia-%C2%B7-Mockups-MVP?node-id=212-1843
  - https://www.figma.com/design/AtnBhZlleecszZ0lDnNBzl/Cameia-%C2%B7-Mockups-MVP?node-id=214-1958
  - https://www.figma.com/design/AtnBhZlleecszZ0lDnNBzl/Cameia-%C2%B7-Mockups-MVP?node-id=430-5247
  - https://www.figma.com/design/AtnBhZlleecszZ0lDnNBzl/Cameia-%C2%B7-Mockups-MVP?node-id=214-4582
  - https://www.figma.com/design/AtnBhZlleecszZ0lDnNBzl/Cameia-%C2%B7-Mockups-MVP?node-id=214-4789
- **D-P — «Fecha de fin» se mantiene oculta, y desde el 14-oct-2026 el backlog dice lo mismo.** Motivo: el
  PO aprobó cambiar «deshabilitar» por «ocultar» en seis celdas de HE-02 (CA-2.4.1, CA-2.4.7, CA-2.4.16,
  CA-2.4.40, CA-2.4.41 y la columna de Observaciones). Ya no hay divergencia ni riesgo asumido por este
  motivo. CA-2.4.1 y CA-2.4.7 se cierran en el PR 2, con el formato de periodo. El archivo `.xlsx` lo
  actualiza el autor a mano.
- **D-Q — Riesgo asumido y registrado: la máscara y el panel no se han probado en ningún navegador.** Motivo:
  las pruebas de componente corren en jsdom, que no cubre teclado móvil, pegado, autocompletado ni lector de
  pantalla reales. Va también al campo «Riesgo» del PR.
- **D-R — Marco ya fijado.** Sin dependencias nuevas (`CLAUDE.md` §2, «No instales nada nuevo sin pedirlo
  primero», y ADR-0002: «Cualquier dependencia nueva requiere permiso previo»); no se modifica el átomo
  `Input`; no se toca ninguna línea de Ana Sofía (PR #69 y #72); alinear el mock de 400 a 422 (bloqueo C-20)
  queda fuera de CM-273.
- **D-S — La etiqueta del fin de formación pasa de «Año de finalización» a «Fecha de fin» (15-oct-2026).**
  Cierra la decisión que había quedado abierta en el PR 1. Motivo: el campo ya no es un año ni un selector
  nativo, sino un `MonthField` «mm/aaaa», y CA-2.4.30, CA-2.4.35 y CA-2.4.60 nombran el campo «Fecha de fin».
  Es la misma palabra que usa la experiencia
  (`profile:experiencia.fechaFin.etiqueta`). Cambia `profile:educacion.fechaFin.etiqueta` en es-CO
  («Fecha de fin») y en («End date»). Diverge del frame de Figma, que dibujaba «Año de finalización»; por
  la regla de `CLAUDE.md` §16 el comportamiento lo fija el backlog.

**Decisiones de diseño, PRT-02.03 (CM-273, PR 2, 16-oct-2026 — todas aprobadas; SPEC escrito antes del
código).** Las diez primeras son las decisiones del 16-oct (análisis, Fase 7, 7.6); las cuatro últimas, las
respuestas del mismo día a los puntos que quedaron abiertos (adenda de 7.6). Continúan la numeración tras D-S.

- **D-T — Errores del servidor bajo el campo: la página traduce `errors[]` a un mapa campo → texto, y la
  sección lo aplica con `setError`.** Motivo: la sección no conoce el contrato (`CLAUDE.md` §8, el mapper y la
  página son quienes lo conocen) y el texto nunca viene del servidor; así CA-2.4.21, 23 y 32 salen bajo el
  campo sin tocar las tablas de código de Sofía (tabla propia código→campo).
- **D-U — Periodo de una experiencia terminada sin inicio: «Sin fecha de inicio – 06/2024».** Motivo: se
  compone con la pieza «Sin fecha de inicio» que CA-2.4.42 ya obliga a crear, así no hace falta ningún literal
  que el backlog no tenga y el formateador no se rompe con un inicio nulo.
- **D-V — Los topes de 4 experiencias y 5 formaciones son constantes del front, y el 409 se sigue manejando.**
  Motivo: CA-2.4.10 y 47 piden deshabilitar «Agregar» al guardar la última permitida (un 201), lo que solo se
  sabe contando en el cliente; el 409 sigue siendo la verdad para la segunda pestaña (CA-2.4.48 y 49). Las
  constantes van fuera de las líneas de Sofía en `profile.constants.ts`. **Tensión con `CLAUDE.md` §3.7**
  («ninguna constante de negocio se hardcodea»): hay dos precedentes en el mismo archivo (`SKILLS_MAX_COUNT`,
  `MAX_TARGET_ROLES`) y el backend no publica los máximos; pueden desfasarse del servidor.
- **D-W — El texto de reserva de las bajas también es `errors:generico`, con el mismo ternario de red.**
  Motivo: una sola regla para altas, bajas e Información General (`ADR-0008`: un genérico es honesto, uno
  específico equivocado no); cierra la Decisión B de la Fase 5 también para las bajas.
- **D-X — El contador y la validación de la descripción usan `unicodeLength`, y se quita el `maxLength`.**
  Motivo: RT-01-CA07 exige «501 / 500 caracteres» sin cortar lo escrito, y el servidor cuenta puntos de
  código. `unicodeLength.ts` (de Sofía) solo se importa. Comprobado antes de tocar: la línea del `.max` de la
  descripción (`workExperience.schema.ts:47`) es de CM-61 (commit `c8cf47e`) y se puede editar; las líneas
  `:43-44` (empresa y cargo) y los imports `:23-27` son de Sofía y no se editan, así que esos campos siguen
  contando UTF-16 (más estrictos que el servidor).
- **D-Y — Los literales de caracteres de control (celda O41 de la v8) quedan fuera de CM-273.** Motivo: ningún
  criterio de HU-2.4 de la v7 los exige y el front ya muestra un texto genérico de Sofía; resolverlo por campo
  depende de D-T. **Hay que avisar a Ana Sofía** (ver C-22 en §8).
- **D-Z — El campo `backlog` del encabezado no cambia; se agrega una nota de contraste en §3.3, con esta
  redacción final:** «HU-2.4 contrastada con la v7 y comprobada por el autor contra la v8.1: los 59
  criterios no cambian en Dado, Cuando, Entonces, tipo ni prototipo; la v8.2 solo cambia "deshabilitar" por
  "ocultar" en Fecha de fin. La columna O41 trae además literales de caracteres de control, fuera de
  CM-273.» Motivo: el campo cubre toda la feature y solo HU-2.2, 2.3 y 2.4 están contrastadas con las
  versiones nuevas; la nota de §3.3 dice exactamente qué se contrastó, y la redacción es la del autor porque
  la propuesta anterior atribuía a la v8.2 un contraste que solo se había hecho contra el `.md` de la v7.
- **D-AA — Cada sección muestra la confirmación de su última acción (alta o baja).** Motivo: hoy la
  confirmación depende solo de `addX.isSuccess` y tras eliminar seguiría diciendo «agregada», lo que
  contradice CA-2.4.11, 38 y 46.
- **D-AB — Al llegar al tope se deshabilita el botón «Agregar» y se muestra el mensaje existente
  (`errorLimite`).** Motivo: es la lectura literal de CA-2.4.10 y 47 («deshabilitar "Agregar…" con el
  mensaje»); el formulario queda visible (a diferencia de `SkillsSection.tsx:189`, que lo reemplaza por un
  aviso) y `onSubmit` también comprueba el tope.
- **D-AC — Guarda de doble envío en altas y bajas, con `useRef` más `disabled`.** Motivo: RT-06-CA01 sigue
  vigente hasta el Sprint 4 y DF-004 (CM-270) demostró que `disabled` solo no basta; en las bajas evita que
  un segundo `DELETE` dé un 404 que parecería un fallo (hipótesis).
- **D-AD — Un solo mensaje por sección, el más reciente: el error de una alta fallida también sigue a la
  «última acción».** Motivo: completa D-AA; así un error viejo de una alta no queda junto a «eliminada» y los
  errores por campo (D-T) solo siguen a una alta.
- **D-AE — Fusionada en D-Z.** Se conserva el identificador para no renumerar; la redacción final de la nota de
  contraste de §3.3 vive ahora en D-Z.
- **D-AF — Se borran las llaves `educacion.errorAgregar`, `educacion.errorEliminar`, `experiencia.errorAgregar`
  y `experiencia.errorEliminar`, en es-CO y en.** Motivo: tras D-W y la Decisión B quedan sin consumidor y
  `CLAUDE.md` §13 prohíbe el código muerto; comprobado que solo las usa `EditProfilePage.tsx` y que las
  pruebas de sección pasan sus propios textos. Las llaves del mismo nombre de habilidades y roles no se tocan.
- **D-AG — La guarda se suelta con una promesa: `onAdd` y `onRemove` devuelven la de `mutateAsync`, como
  `GeneralInfoForm`.** Motivo: soltarla cuando `isAdding` cambia depende del re-render, que es lo que falló en
  DF-004. Se acepta el cambio de las props de las dos secciones, de `EditProfilePage.tsx` y de sus pruebas.
  **La sección atrapa el rechazo de la promesa para soltar la guarda (en `finally`) y no lo propaga** (así
  nunca queda una promesa rechazada sin manejar); **el mensaje de error lo sigue decidiendo la página**, a
  partir del estado de la mutación y no del rechazo.
- **D-AH — Un texto largo sin espacios se PARTE en varias líneas en la tarjeta del ítem; no se recorta con «…».
  El diseño se verifica a mano en móvil, no con prueba automática (16-oct-2026).** Motivo: defecto de la prueba
  manual de CA-2.4.17 y 27 en ~390 px: un cargo o empresa de 100 caracteres, o una institución o título de 150,
  sin espacios, salía por el borde derecho de la tarjeta y empujaba fuera el botón «Eliminar». Se decidió partir
  y no recortar porque los textos con espacios ya se parten, en móvil no hay hover para ver un texto recortado y
  el backlog pide conservar los 100 y 150 caracteres completos. Se aplicó en `WorkExperienceSection` y
  `EducationSection` (marcado de CM-61): `wrap-anywhere` (`overflow-wrap: anywhere`, existe en Tailwind 4.3.3) en
  cargo/título, empresa/institución y periodo; `min-w-0` en el bloque de texto del `flex`; y `shrink-0` en el botón
  de eliminar. La descripción no se pinta en la tarjeta, así que no aplica. `jsdom` no calcula el diseño: no hay
  prueba de clases; la comprobación es manual en móvil.

**Decisiones de diseño, PRT-02.03 (CM-65, 15-sep-2026 — Figma desactualizado para esta subtarea,
guía visual únicamente, ver nota de §3.4).**

- **Decisión I — `SkillsSection` muestra las habilidades como `Chip`, no como tarjetas.** A
  diferencia de Educación/Experiencia (tarjetas con botón de eliminar), las habilidades son cortas
  y sin fecha — `Chip` (átomo de CM-61) ya soporta remoción con `onRemove`/`removeLabel`. Ningún
  átomo nuevo de `design-system`. Limitación aceptada: `Chip` no tiene estado de carga propio, así
  que un `DELETE` en curso no se distingue visualmente de uno resuelto (mismo límite que ya acepta
  `Combobox` para sus seleccionados).
- **I1 — El duplicado de habilidad se valida en el organismo, no en el schema.** `skill.schema.ts`
  no conoce `items` (la lista de habilidades ya persistidas es una prop del organismo, no un valor
  del formulario); `SkillsSection` compara el texto normalizado contra `items` y usa `setError`
  manual sobre el campo en vez de un `.superRefine` — el schema no tiene forma de recibir esa lista
  sin romper el patrón "un schema, sin estado externo" que ya siguen `education.schema.ts`/
  `workExperience.schema.ts`.
- **I2 — El endpoint de finalización real es `.../completion`, no `.../finalize`.** Corrección
  respecto a lo que el mock simulaba desde CM-61, confirmada por el código real de
  `ProfileController.java#completeProfile`, compartido en la sesión que construyó CM-65 — no un
  memo sin verificar. El nombre `.../finalize` no persiste en ningún lugar del contrato (§5).
- **I3 — `Profile.targetRoles` se modeló desde el principio con la misma forma exacta que usa
  CM-69** (`TargetRoleItem { id, professionalRoleId, provenance }`, no un `string[]`
  simplificado), aunque CM-65 y CM-69 se construyeron en ramas independientes desde `develop`: esa
  coincidencia deliberada de forma es lo que permitió fusionar ambas sin conflicto de tipos.
  `getCompletenessValue`/`getSectionStatuses` (que cada rama calculaba por separado, 4 de 5 cada
  una) ya están unificadas en una sola función que suma los 5 requisitos juntos (ver §3, §9 más
  abajo — decisión H2).
- **I4 — El caso de éxito de `useFinalizeProfile` se prueba con un handler de MSW puntual, no con
  `seedProfileForTests`.** `features` no puede importar `mocks` (`docs/ARCHITECTURE.md` §4). El
  caso de éxito del endpoint completo también se prueba con `seedProfileForTests` en
  `mocks/handlers/profiles.handlers.test.ts` (infraestructura, no feature), y desde que CM-69 está
  fusionada, `EditProfilePage.test.tsx` agrega además un caso end-to-end que construye los 5
  requisitos reales a través de la UI (incluida la sección de Roles Objetivo) y confirma que
  «Finalizar y Continuar» se habilita y completa el perfil de verdad.

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
- **H6 — `GET /api/v1/profiles/professional-roles` (catálogo) vive en un handler de mocks separado**
  (`professionalRoles.handlers.ts`), no dentro de `profiles.handlers.ts`: es un recurso propio, no
  un dato del perfil — mismo criterio que separar `auth.handlers.ts` de `profiles.handlers.ts`.

**Notas técnicas de esta implementación (no son divergencias de diseño).**

4. `NewProfilePage.tsx` tipa `{ id: string }` en el propio archivo de la página y llama
   `httpClient.post` directo en vez de pasar por `api/profile.api.ts`. `api/` ya existe (CM-53 en
   adelante) y las demás pantallas la usan: esta página quedó como deuda sin pagar.
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
    `profiles.handlers.ts`, no en el cliente. **No son parte del contrato real** (confirmado en
    CM-195 contra `ProfileResponse`): solo existen en el mock.
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
16. `ProfileActionsBar` (CM-65) agrega `onFinish`/`isFinalizing`/`finalizingLabel` como props
    obligatorias nuevas: el botón "Finalizar y Continuar" pasa de ser un elemento sin acción a
    llamar de verdad a la mutación. `ProfileActionsBar.test.tsx` se actualiza en el mismo commit —
    todos los usos existentes de este organismo (solo `EditProfilePage.tsx`) también.
17. `EditProfilePage.tsx` (CM-65) extrae `getMissingRequirementFields` a
    `model/missingRequirements.ts` en vez de dejarlo como una función interna de la página: es la
    única forma de probar la lectura de `error.errors` sin depender de renderizar la página. La
    traducción de cada campo a texto visible (`profile:formulario.requisitos.*`) sigue en la
    página, la única capa con `useTranslation` (CLAUDE.md §14.7).
18. `EditProfilePage.tsx` (CM-69) gatea el render inicial con `profileQuery.isPending ||
    professionalRolesQuery.isPending` (y el error, con el `||` equivalente): es la primera vez que
    esta página depende de una segunda petición además del perfil. El catálogo no tiene un
    `NOT_FOUND` propio, así que el mensaje de error prioriza `profileQuery.error` y solo cae al del
    catálogo si el perfil sí cargó pero el catálogo falló.
19. `TargetRolesSection` no usa `TARGET_ROLES_FORM_ID` ni ningún `<form>`: a diferencia de
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
2. ~~`src/i18n/locales/es-CO/profile.json` todavía dice `"habilidades.titulo": "Habilidades y
   expectativas"`, pese a que D-02 retiró las expectativas del alcance~~ — **resuelta, CM-65.**
   `"habilidades.titulo"` pasa a `"Habilidades"`: esta subtarea es la dueña real de esa sección
   (§3.4), así que corregirlo ya no es "fuera del alcance de este archivo". Ese mismo archivo
   conserva, sin tocar, la sección huérfana `informacionGeneral.campos` (`nombreCompleto`,
   `fechaNacimiento`, `ciudad`) — deuda preexistente de CM-100, fuera del alcance de CM-65 (no
   corresponde a ninguna sección que esta subtarea construya).

Ninguna de las dos se corrige en este commit: corregirlas es tocar `GLOSSARY.md` o `profile.json`
más allá de lo que esta spec necesita.

**Llaves de i18n sin uso, a 6-oct-2026.** `profile.json` (es-CO y en) conserva 8 llaves sin
referencias literales en el código: `informacionGeneral.titulo`, `informacionGeneral.campos.
nombreCompleto`/`fechaNacimiento`/`ciudad`, `educacion.confirmacionEliminada`,
`experiencia.confirmacionEliminada`, `rolesObjetivo.confirmacionSustituido` y
`rolesObjetivo.confirmacionEliminado`. No se limpian aquí (el SPEC no toca `profile.json`); la
segunda divergencia de arriba queda, por tanto, solo parcialmente cerrada.

**Resuelto: las eliminaciones responden 204 y el cliente ya no lee cuerpo.** Lo corrigió Ana Sofía en
el PR #65 (commit `24abb58`, CM-65, ya en `develop`): `removeEducation`, `removeWorkExperience`,
`removeSkill` y `removeTargetRole` (`profile.api.ts`) devuelven `Promise<void>` y los hooks invalidan
la consulta del perfil para que TanStack Query lo rehaga con `GET`. Origen: documento de Backend del
8-oct-2026, cambio 2 (que lo atribuía a CM-270, pero pertenece a HU-2.4, HU-2.5 y HU-2.11). La
tabla de §5 ya dice 204. La nota anterior lo daba como pendiente y «no verificado contra el
servicio»; el 204 sigue sin comprobarse aquí contra un backend desplegado.

**Pendiente, fuera de CM-298 (tarjeta aparte): errores por estado en HU-2.3 a 2.11.** `EditProfilePage`
trata cualquier `409` de finalizar como «Este perfil ya está activo», de modo que
`PROFILE_UPDATE_IN_PROGRESS` (`409`, toda escritura del perfil) se mostraría con ese mensaje; el
mismo patrón por estado está en las secciones de experiencia, formación, habilidades y roles.
Migrarlas a `code` queda para otra tarea (`ADR-0008`).
