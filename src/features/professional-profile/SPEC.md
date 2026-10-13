---
feature: professional-profile
estado: EN_CURSO
hu: [HU-2.2, HU-2.3, HU-2.4, HU-2.5, HU-2.11]
prt: [PRT-02.02, PRT-02.03, PRT-02.07]
jira: [CM-46, CM-53, CM-61, CM-65, CM-69, CM-195, CM-243, CM-270, CM-272, CM-298]
rutas: [/perfiles/nuevo, /perfiles/:id/editar, /perfiles/:id/roles]
documentacion: tsdoc-es
backlog: 09102026_01
decisiones: [10092026_v1, 11092026_v2, 11092026_v1, 13092026_v1]
figma: Cameia · Mockups MVP
revisado: 2026-10-11
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

- `name`: vacío o mayor a 255 caracteres bloquea sin llamar al servidor (CA-2.2.1 a CA-2.2.3,
  límite confirmado por la respuesta oficial del PO del 13-sep — ver §8, C-01). El backend real
  (hoy `422` `VALIDATION_FAILED` según el catálogo del 8-oct, `ADR-0008`) es solo defensa en profundidad — ver §4.
- `summary`: más de 2000 caracteres bloquea sin llamar al servidor (`maxLength` del campo) y muestra
  el contador de caracteres restantes (CA-2.3.3, `GLOSSARY.md` §2). El frame de Figma muestra el
  contador en 600, no 2000 — se mantiene 2000 por decisión explícita (bloqueo **C-11**, §8).

**Alcance de CM-272 (HU-2.3, 11-oct-2026) — IMPLEMENTADO (12-oct-2026).** Lo que sigue describe el
comportamiento que el código tiene desde CM-272, con las pruebas de `GeneralInfoForm.test.tsx` y
`EditProfilePage.test.tsx` en verde (57 de 57). Los apartados «**Hoy**» y las citas
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
   - **Se reutiliza `getItemErrorMessage` (`EditProfilePage.tsx:179-192`) sin modificarla.** Es de
     CM-65 (PR #72), local a `EditProfilePage` (declarada dentro del componente, después de los
     `return` tempranos de `:128-165`), de firma `(error: unknown, fallback: string, byCode:
     Record<string, string>) => string`: busca el `code` de nivel superior y luego los de
     `errors[]`, y devuelve `fallback` si no hay coincidencia o si el error no es un `ApiError`
     (`:184`). Ya cubre las dos formas que emite Perfil para este `PATCH`. CM-272 solo la **llama**,
     desde `EditProfilePage`, con su propio `byCode` y su propio `fallback`:
     `byCode = { PROFILE_NOT_ALLOWED: t('errors:codigos.NOT_FOUND'), SUMMARY_NOT_ALLOWED:
     t('profile:general.resumen.errorPerfilActivo') }` y `fallback = error instanceof ApiError ?
     t('errors:generico') : t('errors:red')` (mismo reparto que la carga, `:143-148`). Como la
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
     página ya lo usa para el `404` (`:146`); (c) `EditProfilePage` ya carga el namespace `errors`
     (`:103`); (d) no toca `errors.json`, un archivo transversal. Para CA-2.3.12 se **crea una**
     llave, porque la frase no existe en ningún idioma (la única parecida habla de roles objetivo,
     `profile.json es-CO:199`):

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
     `PROFILE_UPDATE_IN_PROGRESS` (`409`; hoy solo se trata al finalizar, `EditProfilePage.tsx:555`).
     Ver pregunta abierta 6 del documento de criterios y la deuda que ya anota el `ADR-0008`.

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
     react-hook-form 7.87.0, `dist/index.esm.mjs:3396-3399` y `:3672-3681`). Si se escribió algo en vuelo, el
     formulario vuelve a quedar sucio y el siguiente `blur` lo envía; pero «Cambios guardados.» **puede
     parpadear unos milisegundos** entre las dos emisiones. Es inofensivo y es la causa de que la prueba `k2`
     fuera frágil bajo carga (por eso ahora solo protege que no se pierda lo escrito).
   - **Test existente `GeneralInfoForm.test.tsx:154-164`** («tabular entre Nombre y Resumen (dentro del
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
     guardado?», porque `reset(values)` tras un éxito (`GeneralInfoForm.tsx:175`) mueve el punto de
     referencia al valor confirmado. En un fallo no hay `reset`: el formulario sigue sucio y la
     siguiente salida de campo reintenta (comportamiento ya vigente y probado, `:188-203`).
   - **La compuerta `isDirty` es sobre el ENVÍO, no sobre la validación (defecto B, 12-oct-2026).** La primera
     versión de CM-272 salía de `autosaveOnFieldBlur` si el formulario estaba limpio, antes de validar: en un
     perfil recién creado (nombre vacío) entrar al campo y salir sin escribir ya no mostraba «Ingresa un nombre
     para el perfil.», que antes de CM-272 sí aparecía. El backlog pide «distinto del guardado» solo para el
     guardado automático con valor **válido**; con valor inválido pide solo «mostrar el mensaje del campo y no
     guardar» (Observaciones de HU-2.3, CA-2.3.14). Ahora salir de un campo **siempre valida**
     (`trigger()` si el formulario está limpio, `handleSubmit` si está sucio) y solo el `PATCH` exige cambios.
   - **Acoplamiento con el aviso de cambios sin guardar — verificado, no se altera.**
     `stores/unsavedChanges.store.ts` ya depende de `formState.isDirty`
     (`GeneralInfoForm.tsx:160-161`; se limpia al desmontar, `:163-165`) y su **único consumidor de
     producción** es `layouts/AppShell.tsx:118` y `:149-151`, que elige el texto del diálogo de
     cerrar sesión (`auth:menu.confirmacion.mensajeConCambiosSinGuardar` o el normal). No existe
     ningún aviso al navegar ni `beforeunload`/`useBlocker`/`usePrompt` en `src`. Este cambio no toca
     el store ni a `AppShell`: sigue cierto que tras un guardado exitoso la bandera baja y que tras
     uno fallido se mantiene en `true`. Tests que lo cubren hoy:
     `stores/unsavedChanges.store.test.ts:14-29`, `GeneralInfoForm.test.tsx:188-203` y
     `:205-240`, `layouts/AppShell.test.tsx:161-173`.

**Criterios de HU-2.3: estado y cierre con CM-272.** Los 12 CA vigentes del Sprint 2 (CA-2.3.2 y
CA-2.3.6 son «N/A en el MVP» por el propio backlog: dependen de HU-2.8 y HU-2.14, y no se tocan).
«Estado actual» es lo que decía el código de `develop` (`4b3f915`) **antes de CM-272**, por
lectura. «Al terminar CM-272» ya refleja la implementación, con las pruebas del bloque en verde (57 de
57); no sustituye la prueba de QA. **ABIERTO** significa que, al terminar CM-272, el criterio **no** puede darse por
cumplido; QA prueba el backlog literal, no este SPEC (lección de DF-004).

| CA | Estado actual (por lectura) | Qué hace CM-272 | Al terminar CM-272 |
| -- | --------------------------- | ---------------- | ------------------ |
| CA-2.3.1 | El `PATCH` sale (`GeneralInfoForm.tsx:192` → `profile.api.ts:57`); la confirmación sale de `EditProfilePage.tsx:530-532` con el literal `profile.json:50`. | Solo cambia cuándo desaparece la confirmación (punto 2). | **ABIERTO**: DF-007 lo toca y no se verificó en staging (ver «Fuera de alcance»). |
| CA-2.3.3 | PARCIAL: `maxLength` impide escribir el carácter 2001 (`GeneralInfoForm.tsx:248`); «2001 / 2000 caracteres» no se produce. | Nada. | **ABIERTO** (C-19). |
| CA-2.3.4 | El cliente envía `"summary": ""` (`generalInfo.schema.ts:14`, `profile.api.ts:57`); el servidor lo borra en Borrador (`ProfileAppService.java:94-99`). No verificable sin ejecutar. | Nada. | **ABIERTO**: es DF-007 (C-21). |
| CA-2.3.5 | Cumple por lectura: mismo camino que CA-2.3.1, sin lógica que dependa del estado Activo. | Nada. | CERRADO (por lectura). |
| CA-2.3.7 | Cumple por lectura: `maxLength` 2000 admite exactamente 2000 (`GeneralInfoForm.tsx:248`). | Nada. | CERRADO (por lectura). |
| CA-2.3.8 | Cumple por lectura: `trim().min(1)` (`generalInfo.schema.ts:13`) → `nameErrorRequired` (`GeneralInfoForm.tsx:208-209`), literal `profile.json:39`. | Nada. | CERRADO (por lectura). |
| CA-2.3.9 | Cumple por lectura: `maxLength` 255 (`GeneralInfoForm.tsx:220`). | Nada. | CERRADO (por lectura). |
| CA-2.3.10 | PARCIAL: `maxLength` impide escribir el carácter 256 (`GeneralInfoForm.tsx:220`); el mensaje de `profile.json:40` solo se alcanza con un cambio programático. | Nada. | **ABIERTO** (C-19). |
| CA-2.3.11 | NO CUMPLE: el `403` del `PATCH` no produce ningún mensaje (punto 1) y el `403` de la **carga** de un perfil ajeno cae en el genérico (`EditProfilePage.tsx:157`). | Mensaje por `PROFILE_NOT_ALLOWED` con `errors:codigos.NOT_FOUND` en **las dos rutas**, guardado y carga. | CERRADO en código; la verificación real depende de C-18 (que el `code` llegue en staging). |
| CA-2.3.12 | NO CUMPLE: el `422` no produce mensaje y la frase no existe en i18n. | Llave nueva `profile:general.resumen.errorPerfilActivo` y mensaje por `SUMMARY_NOT_ALLOWED`. | CERRADO en código; igual dependencia de C-18. |
| CA-2.3.13 | PARCIAL: guarda solo al salir del formulario completo (`GeneralInfoForm.tsx:193-197`) y sin mirar `isDirty`. | Puntos 3 y 4. | CERRADO. |
| CA-2.3.14 | PARCIAL: no hay `PATCH` con nombre vacío, pero la confirmación anterior queda visible (`EditProfilePage.tsx:530`) y solo se valida al salir del formulario completo. | Puntos 2 y 3; defecto B: validar siempre al salir del campo (la primera versión no validaba una salida sin cambios). | CERRADO. |

**Fuera de alcance de CM-272 — todos ABIERTOS (nunca «cumple»).**

- **CA-2.3.3 y CA-2.3.10 (C-19).** El `maxLength` de los campos (`GeneralInfoForm.tsx:220` para el
  nombre, `:248` para el resumen) impide escribir el carácter 256 del nombre y el 2001 del resumen,
  así que la pantalla «2001 / 2000 caracteres» con el mensaje «El resumen no puede superar los 2000
  caracteres.» que exige el criterio **nunca se produce al escribir**. Contradice RT-01-CA07 («sin
  cortar lo escrito»). El texto de §3.2 «Validaciones del lado del cliente» (`maxLength` del campo)
  describe la decisión de CM-53 y **no** el criterio. Pendiente de decisión del PO.
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
  (`EditProfilePage.tsx:185`, `:188`) sobre un objeto literal, así que un `code` llamado
  `constructor` o `toString` devolvería una propiedad del prototipo. Hoy no ocurre (los códigos
  reales son `UPPER_SNAKE_CASE`). No es de esta tarjeta; solo se anota.

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
| CA-2.3.12 (CM-272) | El mensaje sale de `profile:general.resumen.errorPerfilActivo` por `errors[].code` `SUMMARY_NOT_ALLOWED` dentro de un `422 VALIDATION_FAILED` |
| CA-2.3.13, CA-2.3.14 (CM-272) | Al salir de cada campo siempre valida y solo envía si `formState.isDirty` (D-J); reintenta una vez el guardado descartado durante el vuelo; «Cambios guardados.» desaparece al editar, al fallar y al ser bloqueada una salida de campo; el campo con foco nunca queda deshabilitado por el autoguardado |
| CA-2.3.3, CA-2.3.10 | **No se cumplen al escribir:** el `maxLength` impide el carácter 2001 / 256 (C-19, abierto) |
| CA-2.4.1 (experiencia `CURRENT`/`UNKNOWN_END` sin fecha de fin)   | Oculta y limpia el campo «Fecha de fin» cuando cualquiera de los dos checkboxes está marcado, en vez de solo omitir el envío |
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
| `src/mocks/handlers/profiles.handlers.ts`                                                       | Infraestructura de apoyo: ciclo completo de mocks del perfil; deriva `summaryProvenance`/`summaryProvenanceOrigin` en el `PATCH` (CA-2.3.1/2/4; solo mock, el backend real no los tiene); CM-61 agrega 4 handlers por ítem (POST/DELETE de experiencia y educación) con las reglas reales de `WorkExperience.java`/`Education.java`; CM-65 agrega 2 handlers por ítem de habilidades y reemplaza el endpoint de finalización por el real (ver §5); CM-69 agrega 3 handlers por ítem de Roles Objetivo (POST/PATCH/DELETE) con las reglas reales de `ProfileController.java`, reemplazando el `PATCH` masivo de `targetRoleIds` que solo existía por no conocer el contrato | `src/mocks/handlers/profiles.handlers.test.ts`                                                     |
| `src/mocks/handlers/professionalRoles.handlers.ts`                                              | CM-69: simula el catálogo real de roles TI vía GET (ver §5), a partir de `src/mocks/data/catalogs.ts` | `src/mocks/handlers/professionalRoles.handlers.test.ts`                                             |
| `src/features/professional-profile/organisms/ProfileMethodSelector/ProfileMethodSelector.tsx`  | §3.1 (CM-46): las dos tarjetas excluyentes; DF-004: la tarjeta manual queda `disabled` (`disabled={loading}`) mientras se crea, y la guarda contra la doble creación pasa a `NewProfilePage` (CA-2.2.7); CM-270: sin cambios, el mensaje de cupo entra por `errorMessage` y no se añaden props; la prueba suma la afirmación de «Próximamente» (CA-2.2.2) | `src/features/professional-profile/organisms/ProfileMethodSelector/ProfileMethodSelector.test.tsx` |
| `src/design-system/molecules/CardSelectable/CardSelectable.tsx`                                 | Design system (DF-004): prop `disabled`, independiente de `state` — pone el atributo nativo sin cambiar la apariencia; `state="disabled"` la implica. Único consumidor: `ProfileMethodSelector` | `src/design-system/molecules/CardSelectable/CardSelectable.test.tsx`                                |
| `src/features/professional-profile/pages/NewProfilePage.tsx`                                    | §3.1: la ruta «/perfiles/nuevo» — crea el perfil sin cuerpo al elegir «Llenado Manual» y navega al formulario con el id devuelto; CM-195: redirige si hay lastUsedProfileId; CM-270: sustituye el 409 «ya existe» por el reconocimiento del cupo agotado con `profile:metodo.errorCupoPlan`, el texto provisional de CA-2.2.3 (CM-298: por `code`, y suma `profile:metodo.errorCreacionEnCurso` para `PROFILE_CREATION_IN_PROGRESS`); DF-004: guarda síncrona `isCreatingRef` contra la doble creación (CA-2.2.7); la creación sigue en la página (deuda, nota técnica 4) | `src/features/professional-profile/pages/NewProfilePage.test.tsx`                            |
| `src/features/professional-profile/model/profileLimit.ts`                                       | §3.1 (CM-270): `isProfileLimitReached` — reconoce el cupo agotado de la creación de perfil por `code` (`PROFILE_LIMIT_REACHED` o `PLAN_LIMIT`), sin respaldo por estado (CA-2.2.3, CM-298, `ADR-0008`); acotada a esa llamada; CM-298 suma `isProfileCreationInProgress` para `PROFILE_CREATION_IN_PROGRESS` | `src/features/professional-profile/model/profileLimit.test.ts`                                      |
| `src/features/professional-profile/model/profile.constants.ts`                                  | §3.2/§3.3/§3.4/§3.5: límites y constantes de negocio; CM-61 agrega `DESCRIPTION_MAX_LENGTH`, `EDUCATION_LEVELS`, `MANUAL_PROVENANCE`, `PROFILE_COMPLETENESS_MAX`, ids de formulario, `DESKTOP_MEDIA_QUERY`; CM-65 agrega `SKILL_LEVELS`, `SKILL_NAME_MAX_LENGTH`, `SKILLS_FORM_ID`; CM-69 agrega `MAX_TARGET_ROLES` | cubierto por las pruebas de los organismos y `EditProfilePage`                                    |
| `src/features/professional-profile/model/profile.types.ts`                                      | §3.2/§3.3/§3.4/§3.5: tipos de dominio; CM-61 agrega `EducationItem`, `WorkExperienceItem`, `EducationLevel`, `EmploymentStatus`, `DataProvenance`, `YearMonth` (valores confirmados contra el backend real); CM-65 agrega `SkillItem`, `SkillLevel`; CM-69 agrega `ProfessionalRole`, `TargetRoleItem` (mismo nivel de confianza) | cubierto por las pruebas de los organismos y `EditProfilePage`                                    |
| `src/features/professional-profile/model/yearMonth.ts`                                          | §3.3 (CM-61): `toYearMonth`/`formatYearMonth` — trunca la fecha del selector nativo a `YearMonth` (bloqueo C-14)            | `src/features/professional-profile/model/yearMonth.test.ts`                                          |
| `src/features/professional-profile/model/profileCompleteness.ts`                                | §3 (CM-61): `getSectionStatuses`/`getCompletenessValue` para el índice de secciones y la barra de completitud (decisión D-D); CM-65 suma el cuarto requisito (≥1 habilidad) y la sección `skills`; CM-69 suma el quinto (≥1 rol objetivo) y la sección `target-roles` al índice | `src/features/professional-profile/model/profileCompleteness.test.ts`                                |
| `src/features/professional-profile/model/missingRequirements.ts`                                | §3.4 (CM-65): `getMissingRequirementFields` — lee `error.errors` de un `422` con `errors[]` no vacío, función pura separada de `EditProfilePage.tsx` para poder probarla sin renderizar | `src/features/professional-profile/model/missingRequirements.test.ts`                                |
| `src/features/professional-profile/schemas/generalInfo.schema.ts`                                | §3.2 (CM-53): validación zod de `name`/`summary`, sin mensajes de texto (CLAUDE.md §3.2)                                   | `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.test.tsx`             |
| `src/features/professional-profile/schemas/education.schema.ts`                                 | §3.3 (CM-61): validación zod de un ítem de Formación académica, con `.superRefine` para "en curso" y fecha de fin           | `src/features/professional-profile/organisms/EducationSection/EducationSection.test.tsx`             |
| `src/features/professional-profile/schemas/workExperience.schema.ts`                             | §3.3 (CM-61): validación zod de un ítem de Experiencia Laboral, con `.superRefine` para los checkboxes excluyentes          | `src/features/professional-profile/organisms/WorkExperienceSection/WorkExperienceSection.test.tsx`   |
| `src/features/professional-profile/schemas/skill.schema.ts`                                     | §3.4 (CM-65): validación zod de un ítem de Habilidad; el duplicado NO se valida aquí (depende de `items`, ajeno al schema) — vive en `SkillsSection` vía `setError` manual | `src/features/professional-profile/organisms/SkillsSection/SkillsSection.test.tsx`                   |
| `src/design-system/atoms/Select/Select.tsx`                                                     | Átomo nuevo (SPEC.md §9, decisión D-B): `<select>` nativo con la misma API que `Input`, para "Nivel educativo" — primer átomo nuevo del design system desde CM-100 | `src/design-system/atoms/Select/Select.test.tsx`                                                     |
| `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.tsx`                | §3.2 (CM-53): el formulario de Información General; CM-61 agrega showSectionTitle (decisión D-G); CM-194 sincroniza isDirty con unsavedChanges.store; CM-195 agrega el autoguardado en onBlur (decisión D-H); CM-272 lo pasa a cada campo con compuerta isDirty, retira el prop isSaving, agrega onDirtyChange y conserva lo escrito en vuelo con keepDirtyValues, reintenta una vez el guardado descartado en vuelo y valida siempre al salir del campo (decisión D-J) | `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.test.tsx`             |
| `src/features/professional-profile/organisms/EducationSection/EducationSection.tsx`              | §3.3 (CM-61): lista + alta/baja de Formación académica por ítem                                                             | `src/features/professional-profile/organisms/EducationSection/EducationSection.test.tsx`             |
| `src/features/professional-profile/organisms/WorkExperienceSection/WorkExperienceSection.tsx`    | §3.3 (CM-61): lista + alta/baja de Experiencia Laboral por ítem; deriva `employmentStatus` en la UI (checkboxes excluyentes) | `src/features/professional-profile/organisms/WorkExperienceSection/WorkExperienceSection.test.tsx`   |
| `src/features/professional-profile/organisms/SkillsSection/SkillsSection.tsx`                    | §3.4 (CM-65): lista + alta/baja de Habilidades por ítem, mostradas como `Chip`; duplicado bloqueado con `setError` manual   | `src/features/professional-profile/organisms/SkillsSection/SkillsSection.test.tsx`                   |
| `src/features/professional-profile/organisms/ProfileSectionsLayout/ProfileSectionsLayout.tsx`    | §3 (CM-61): índice de secciones — `StepList` en desktop, acordeón (`useDisclosure` por ítem) en móvil                       | `src/features/professional-profile/organisms/ProfileSectionsLayout/ProfileSectionsLayout.test.tsx`   |
| `src/features/professional-profile/organisms/ProfileActionsBar/ProfileActionsBar.tsx`            | §3 (CM-61): barra de acciones compartida — completitud, «Guardar borrador», «Finalizar y Continuar»; CM-65 conecta `onFinish`/`isFinalizing` al endpoint real | `src/features/professional-profile/organisms/ProfileActionsBar/ProfileActionsBar.test.tsx`           |
| `src/features/professional-profile/organisms/TargetRolesSection/TargetRolesSection.tsx`          | §3.5 (CM-69): lista + alta/sustitución/baja de Roles Objetivo por ítem; reutiliza `Combobox` (alta) y `Select` (sustitución), sin átomo nuevo | `src/features/professional-profile/organisms/TargetRolesSection/TargetRolesSection.test.tsx`         |
| `src/features/professional-profile/api/profile.dto.ts`                                          | §3.2/§3.3/§3.4/§3.5: forma cruda del ProfileRecord; CM-61 agrega EducationDto, WorkExperienceDto y los dos Add*RequestDto (campos reales del backend); CM-65 agrega SkillDto, AddSkillRequestDto (campos reales); CM-69 agrega TargetRoleDto, AddTargetRoleRequestDto, UpdateTargetRoleRequestDto (campos reales) y ProfessionalRoleDto ({id, nombre, categoria}, confirmada contra ProfessionalRoleController.java en CM-195) | cubierto por los hooks de datos (integración vía MSW)                                                |
| `src/features/professional-profile/api/profile.mapper.ts`                                       | §3.2/§3.3/§3.4/§3.5: `ProfileDto → Profile`; CM-61 agrega `toAddEducationRequest`/`toAddWorkExperienceRequest` (deriva `employmentStatus`, trunca fecha — decisión D-F); CM-65 agrega `toAddSkillRequest` (sin derivación, solo fija `MANUAL_PROVENANCE`); CM-69 agrega `toProfessionalRole`, `toAddTargetRoleRequest`, `toUpdateTargetRoleRequest` (sin derivación real, solo fijan `MANUAL_PROVENANCE`) | `src/features/professional-profile/api/profile.mapper.test.ts`                                       |
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
| `src/features/professional-profile/pages/EditProfilePage.tsx`                                   | §3, §3.2, §3.3, §3.4, §3.5 (CM-61/CM-65/CM-69): el armazón real de la ruta de edición del perfil — ya no `WizardLayout`/`EmptyState`; CM-65 agrega la cuarta sección y conecta «Finalizar y Continuar» al endpoint real; CM-69 agrega la quinta sección y el estado de carga/error del catálogo; CM-272 muestra el error del PATCH de Información General por code con getItemErrorMessage y oculta «Cambios guardados.» mientras el formulario esté sucio y resuelve el 403 PROFILE_NOT_ALLOWED de la carga como NOT_FOUND (decisión D-J) | `src/features/professional-profile/pages/EditProfilePage.test.tsx`                                   |
| `src/features/professional-profile/routes.tsx`                                                  | Mapea las 3 rutas de esta feature bajo `professionalProfileShellRoutes`, incluida la de edición del perfil (CM-61 la muda desde `professionalProfileWizardRoutes`, retirada — decisión D-E) | `src/app/router/index.test.tsx` (features no puede importar RequireAuth, ver §9)                    |
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
| C-14 | El backend real almacena `java.time.YearMonth` (`"YYYY-MM"`, sin día) para las fechas de experiencia y educación; el frame dibuja un selector `dd/mm/aaaa` completo. Se usa `<Input type="date">` (fiel al frame) y se trunca el día al enviar (`model/yearMonth.ts`) — el día que el usuario elige se descarta silenciosamente. ¿Debería el control pedir explícitamente solo mes/año? | Product Owner / Diseño       | detectado 14-sep-2026, CM-61        |
| C-15 | El frame usa un componente `select` (nodo `32:150`, confirmado real) para «Nivel educativo» y un ícono `calendar` en los campos de fecha; ninguno de los dos existía en `design-system` antes de CM-61. Se construyó el átomo `Select`; el ícono de calendario no hizo falta (`<input type="date">` nativo ya trae el suyo del navegador) — ¿debería `design-system/icons/registry.tsx` tener un `calendar` propio para otros usos futuros? | Diseño                        | detectado 14-sep-2026, CM-61        |
| C-16 | ~~El endpoint real de finalización no es `POST /api/v1/profiles/:id/finalize` (como lo simulaba el mock desde CM-61) sino `POST /api/v1/profiles/:id/completion`~~ — **cerrado, 15-sep-2026 (CM-65).** Confirmado por `ProfileController.java#completeProfile` (detectado en la sesión que construyó CM-69, corregido en la que construyó CM-65, dueña de la pantalla de finalizar — §5 ya lo refleja). Existe además `POST /api/v1/profiles/:id/review-requests` (transición a `IN_REVIEW`), que no aplica en Sprint 1 (`GLOSSARY.md` §3) | Frontend                     | resuelto 15-sep-2026, CM-65         |
| C-17 | ~~**Defecto abierto:** `lastUsedProfileId` no se limpiaba al cerrar sesión, y otra cuenta en el mismo navegador cargaba el perfil de la anterior (`403`)~~ — **cerrado por CM-243 (DF-003, `CA-1.8.3`).** `useLogout` y `AuthProvider` (al reportar Firebase que no hay usuario: logout, `401` o sesión vencida) ponen `lastUsedProfileId` en `null`; ver `features/auth/SPEC.md` §9. Prueba manual en navegador pendiente | Frontend | detectado 6-oct-2026; cerrado 7-oct-2026 |
| C-18 | Backend debe confirmar que `code`, `requestId` y `errors[].code` ya viajan en las respuestas de error de Perfil en staging (documento del 6-oct, cambio 1: «Perfil desde el 9 oct»; el del 9-oct sobre HU-2.3 a 2.5 dice que parte de ese contrato aún no está en `develop`), y avisar cuando `PROFILE_CREATION_IN_PROGRESS` (en `develop` de `cameia-perfil` desde el commit `147d1e8`, PR #80) llegue a staging. Sin el `code`, la pantalla muestra el mensaje genérico (`ADR-0008`, estricto). **Ya no hay contradicción sobre `EMAIL_NOT_VERIFIED`:** `cameia-gateway` (`develop`, `1f7b8ee`, CM-179) sí emite el `403 EMAIL_NOT_VERIFIED` (`FirebaseAuthGlobalFilter.java:105`, `:253-254`, `:266-267`, `:509-513`), salvo en `POST /api/v1/users/me/verification`; el documento de Backend lo da por desplegado y comprobado en staging (eso no se verifica desde git). `cameia-web` lo trata en `httpClient.ts:107-109`. **Sigue sin confirmación escrita** que `code`, `requestId` y `errors[].code` de **Perfil** viajen en staging. `docs/estandar-backend.md` del Gateway aún da `PLAN_LIMIT` como reservado y no emitido: el `403` del cupo (CA-2.2.3) sigue sin desplegarse | Backend (Paula Andrea Muñoz Delgado) | solicitado 9-oct-2026 (CM-270); abierto, CM-298 |
| C-19 | `maxLength` del nombre (255) y del resumen (2000) impide escribir el carácter 256 / 2001 (`GeneralInfoForm.tsx:220`, `:248`; prueba `GeneralInfoForm.test.tsx:107-111`). CA-2.3.3 y CA-2.3.10 exigen ver «2001 / 2000 caracteres» y los mensajes de longitud bajo el campo sin guardar, y RT-01-CA07 dice «sin cortar lo escrito»; con el `maxLength` esa pantalla nunca se produce al escribir. Decidir si se quita el `maxLength` (y el contador pasa a mostrar el exceso) o si el PO acepta el recorte. Hasta entonces los dos CA quedan **abiertos** | Product Owner | detectado 11-oct-2026, CM-272 |
| C-20 | El `PATCH` de `profiles.handlers.ts` no coincide con el servidor real: responde `400` sin `code` al validar el nombre (`:235`, `:376`) donde el servidor responde `422 VALIDATION_FAILED`; no tiene rama de perfil `COMPLETED` que vacíe el resumen (`SUMMARY_NOT_ALLOWED`), ni de perfil ajeno (`403 PROFILE_NOT_ALLOWED`), ni valida el largo del resumen. Por eso las pruebas con el mock pueden pasar mientras staging falla. Alinearlo puede romper pruebas de HU-2.4, 2.5 y 2.11. Tarea propia, fuera de CM-272 | Frontend (con revisión de quien lleve HU-2.4, 2.5 y 2.11) | detectado 11-oct-2026, CM-272 |
| C-21 | DF-007 (CA-2.3.1 y CA-2.3.4) sin causa confirmada: por código el servidor ya borra el resumen vacío en Borrador (`cameia-perfil` commit `66eccda`, 8-oct; prueba `GeneralInfoEndToEndIT.java:94-107`) y el cliente envía `""` y confirma solo tras un 2xx. **Evidencia nueva (12-oct-2026):** `cameia-perfil/specs/CM-54-informacion-general-resumen/spec.md:18` dice que el servidor ya está corregido y deja «la parte de CM-247 de la interfaz» a Frontend (`:224`); el aviso de testing del 11-oct probó staging con `cameia-perfil@9355f1a` y `cameia-web@4b3f915`; **no existe re-prueba de DF-007 posterior al 26-sep** (el aviso no lo menciona). Numeración: `CP-050/EJ-036` y `CP-056/EJ-038` son del **libro del Sprint 1**; el libro del Sprint 2 usa EJ-036 y EJ-038 para DF-003 y DF-005. Falta comprobar contra staging qué devuelve el `GET` tras el `PATCH` con la versión de CM-272. **SIGUE ABIERTO** | QA / Backend (Paula Andrea Muñoz Delgado) | probado 26-sep-2026 (`cameia-web@a3e46cb`); revisado 11-oct-2026, CM-272 |

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
  igual que el guardado (defecto C); CA-2.3.11 cubre las dos rutas.
  `unsavedChanges.store` no cambia: ya depende de `isDirty` y su único consumidor de producción es
  `AppShell.tsx:149-151`. D-H se conserva como historia; en lo que choquen, manda D-J.

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
