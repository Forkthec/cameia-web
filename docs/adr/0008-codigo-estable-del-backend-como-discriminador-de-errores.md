# 0008 · El `code` estable del backend es el discriminador de errores de negocio

- **Estado:** Aceptada
- **Fecha:** 10-oct-2026
- **Decide:** Frontend (Juan José Arias Chacua), con los documentos de Backend del 6, 8 y 9 de
  octubre como evidencia
- **Ticket:** CM-298
- **Sustituye a:** [0007](0007-contrato-de-error-problemdetail.md)

## Contexto

El ADR-0007 (19-sep-2026) fijó el contrato de error como `ProblemDetail` (RFC 7807) y eligió
`httpStatus` + `errors[].field` como discriminador, por una razón concreta: «un `code` que el
backend real nunca envía». Preveía su propio reemplazo: si Cuentas o Perfil agregaban un código
estable, «este ADR se sustituye por otro que lo incorpore — no se edita».

Esa premisa dejó de ser cierta:

- **Cambio 1 del documento de Backend del 6-oct** (`05102026_v1_cambios-de-contrato-y-acuerdos-para-frontend`):
  el `ProblemDetail` conserva `status`, `title`, `detail` y `errors[{field,message}]`, y agrega
  `code`, `requestId` y `errors[].code`. Desde el 8-oct en Cuentas, desde el 9-oct en Perfil y
  desde el 15-oct en Entrevista.
- **Catálogo de Perfil del 8-oct** (`07102026_v1_aclaraciones-de-backend-para-frontend`, CM-271):
  Perfil pasa de «13 tipos de respuesta de error sin código» a un catálogo de códigos estables
  con forma común (§1 y §7).
- **Documentos del 9-oct** (`09102026_v1_perfil-profesional-contrato-hu-2-3-a-2-5-para-frontend` y
  `09102026_v1_registro-repetido-y-tiempo-de-espera-para-frontend`): Backend pide «resolver cada caso
  por el `code` y no por el estado HTTP».
- **Cuerpo del Gateway** (`cameia-gateway`, rama `develop`, commit `53fbe30`). Sus errores no son
  un `ProblemDetail`: el cuerpo es `{"code":"…","message":"…"}`, escrito a mano como texto en
  `GlobalErrorHandler.java` y `FirebaseAuthGlobalFilter.java`, sin `title`, `detail` ni
  `requestId`. El catálogo real son seis códigos: `AUTH_REQUIRED` (`401`), `NOT_FOUND` (`404`),
  `BAD_GATEWAY` (`502`), `SERVICE_UNAVAILABLE` (`503`), `GATEWAY_TIMEOUT` (`504`) e
  `INTERNAL_ERROR` (cualquier otro estado). Hoy `errorMap.ts` exige `title` y `detail` y convierte
  todos ellos en `UNKNOWN_ERROR`. El `401` funciona de todos modos, pero por el `httpStatus`
  (`httpClient.ts` llama a `isUnauthorized()`), no porque el cuerpo se entienda. El `requestId` del
  Gateway viaja en la cabecera `X-Request-Id`, no en el cuerpo.
- **`EMAIL_NOT_VERIFIED` (`403`) no está implementado en el Gateway.** El `CLAUDE.md` del Gateway lo
  lista como `GW-TBD-17`, abierto, y su `docs/estandar-backend.md` dice que `EMAIL_NOT_VERIFIED`,
  `PLAN_LIMIT` y `LLM_UNAVAILABLE` son códigos reservados que ningún servicio emite todavía. Esto
  **contradice el cambio 10 del documento de Backend del 6-oct**, que lo presenta como hecho «desde
  el 9 oct». La contradicción está **por confirmar con Backend**; este ADR no la resuelve y no
  depende de ella.

El estado HTTP ya no alcanza. En `POST /api/v1/profiles` coexisten, con el mismo `409` o `403`,
significados distintos: `PROFILE_LIMIT_REACHED` (cupo agotado), `PROFILE_CREATION_IN_PROGRESS`
(otra creación sin terminar) y `EMAIL_NOT_VERIFIED` (Gateway; hoy hipotético, `GW-TBD-17` abierto).
CM-270 reconoció el cupo con
`error.isConflict() || error.isForbidden()` (`model/profileLimit.ts`) porque `ApiError` no exponía
el `code`. Backend sustituyó el `503 PROFILE_CREATION_TIMEOUT` por `409 PROFILE_CREATION_IN_PROGRESS`
(`cameia-perfil`, commit `147d1e8`, PR #80, ya en `develop`): con la función de CM-270, ese `409` se
mostraría como «Tu Plan Free permite 1 Perfil Profesional.», un mensaje específico y equivocado.

## Decisión

**Se conserva del ADR-0007:** el contrato es `ProblemDetail` (RFC 7807); `title` y `detail` se
guardan en `ApiError` para depuración y **ningún componente los renderiza** (`CLAUDE.md` §8);
`ApiError` solo se construye en `errorMap.ts`.

**Cambia el discriminador.** La decisión de negocio sobre un error se toma por su `code`. El
`code` no se muestra: elige una llave de i18n, como el resto del texto visible (`CLAUDE.md` §3.2).
El estado HTTP queda para las clases amplias, que no necesitan un código: `401` (cierre de sesión
en `httpClient.ts`), `404` (recurso inexistente), `5xx` (fallo del servidor) y la política de
reintentos de `queryClient.ts`.

En concreto:

- `ApiError` gana tres campos opcionales: `code?: string`, `requestId?: string` y
  `errors[].code?: string`, más `hasCode(...codes: string[]): boolean`. Son aditivos: el
  constructor, los métodos `is*()` y los demás consumidores no cambian. `requestId` se expone aunque
  todavía no tenga consumidor, para poder citarlo en un reporte.
- `errorMap.ts` lee esos campos y acepta también el cuerpo `{code, message}` del Gateway (el
  catálogo de arriba), en vez de caer en `UNKNOWN_ERROR`. **Regla de relleno:** `code` va a su propio
  campo `code`, `message` va a `detail` (es texto para humanos) y `title` queda vacío (`''`) cuando
  el cuerpo no lo trae. `title` no se rellena con el `code`: es un texto legible, y un código ahí
  confundiría a quien lea el objeto después. Un cuerpo sin `code` ni forma de `ProblemDetail` sigue
  produciendo `UNKNOWN_ERROR`.
- **Estricto, sin respaldo por estado.** Si un error no trae `code`, la decisión de negocio no se
  toma por su estado HTTP: la pantalla muestra el mensaje genérico (`errors:generico`). Un mensaje
  genérico es honesto; uno específico equivocado no lo es.
- Cada feature declara los códigos que reconoce junto a su lógica (p. ej. `model/profileLimit.ts`
  para el cupo de `POST /api/v1/profiles`), acotados al endpoint cuyo contrato los define: el mismo
  código o estado puede significar otra cosa en otra ruta. Los códigos son código de dominio y se
  copian tal cual, igual que los enumerados (`CLAUDE.md` §5 y §7).
- `errors[].field` se mantiene para ubicar un mensaje bajo un campo; `errors[].code` permite elegir
  el texto por campo cuando haga falta.

## Alternativas descartadas

**Mantener el ADR-0007 y seguir por estado HTTP.** Se descarta: ya hay un caso real en el que
el estado no distingue (`409 PROFILE_LIMIT_REACHED` frente a `409 PROFILE_CREATION_IN_PROGRESS`), y
Backend lo previó al publicar el catálogo y pidió resolver por `code`.

**Respaldo por estado cuando falta el `code`.** Se descarta: es el comportamiento que produce el
defecto que esta decisión corrige. Si algún servicio o ruta omite el `code`, lo correcto es el
mensaje genérico, no adivinar por el estado.

**Mostrar el `detail` del backend** (la opción a) que Backend propuso en el cambio 1 del 8-oct, para
tener el literal del backlog en un solo lugar). Se descarta: obligaría a derogar la prohibición de
renderizar texto crudo del servidor (`CLAUDE.md` §3.2 y §8), que mantiene todo el copy en i18n y
editable en un solo JSON. El costo asumido es que el texto vive en dos sitios (catálogo de
i18n y backlog) y puede divergir; se acota con una llave de i18n por código.

**Parche local en `profileLimit.ts` sin tocar `ApiError`.** Se descarta por la misma razón que el
0007 descartó el parche local en `useRegister`: `ApiError` no conserva el cuerpo, así que cada
feature tendría que reconstruirlo, y la causa raíz seguiría ahí.

## Consecuencias

- **No rompe a los consumidores actuales.** Los campos nuevos son opcionales; `auth` y las demás
  lecturas de `httpStatus`/`errors[].field` siguen funcionando.
- **`profileLimit.ts` cambia de criterio:** reconoce el cupo agotado solo con `PROFILE_LIMIT_REACHED`
  (`409`, hoy) o `PLAN_LIMIT` (`403`, backlog v6, aún sin desplegar). `PROFILE_CREATION_IN_PROGRESS`
  y `EMAIL_NOT_VERIFIED` dejan de confundirse con él (el segundo es hoy hipotético: `GW-TBD-17`
  sigue abierto); `PROFILE_CREATION_IN_PROGRESS` tiene su propio mensaje (SPEC de
  `professional-profile` §3.1). Sus pruebas dejan de poder construir `ApiError` solo con un estado.
- **Los mocks deben enviar `code`** (y `requestId`, `errors[].code` donde aplique); hoy ninguno lo
  envía, y el comentario «sin `code` propio» de `mocks/handlers/` queda obsoleto.
- **Queda deuda por estado, fuera de CM-298 (tarjeta aparte):** `EditProfilePage.tsx` trata
  cualquier `409` al finalizar como «ya está activo», y `PROFILE_UPDATE_IN_PROGRESS` (`409`, toda
  escritura del perfil) cae en el mismo mensaje; los consumidores de `auth` (`useRegister`,
  `RegisterPage`) siguen discriminando por `httpStatus` + `field`.
- **El `code` pasa a ser parte del contrato con Backend.** Un código renombrado rompe en silencio al
  mensaje específico (cae en el genérico). Por eso cada lista de códigos vive en un solo archivo por
  feature y los mocks los usan, de modo que una prueba falle antes que producción.
- **`requestId` de los errores del Gateway: fuera de CM-298.** Viaja en la cabecera `X-Request-Id`,
  no en el cuerpo, y `errorMap.ts` **no la lee**. `ApiError.requestId` se llena solo cuando el
  cuerpo lo trae (los microservicios), y queda `undefined` en los errores del Gateway. **Pendiente
  explícito, sin tarjeta asignada:** leer `X-Request-Id` de la `Response` para esos errores.
- **Dependencia de despliegue:** Backend confirma el `code` de Perfil «desde el 9 oct», pero el
  documento del 9-oct sobre HU-2.3 a 2.5 dice que parte de ese contrato aún no está en `develop`.
  Es una confirmación pendiente (SPEC §8, C-18), no un supuesto de esta decisión. Lo mismo para el
  `403 EMAIL_NOT_VERIFIED` del Gateway, hoy hipotético (`GW-TBD-17` abierto; contradicción descrita
  en el Contexto), y para
  `PLAN_LIMIT`, que el estándar del Gateway también da por no emitido todavía.
- **Se reescribe `CLAUDE.md` §8**, que afirmaba que el backend no envía código estable, y se
  actualizan los TSDoc y notas que citan «sin `code` propio» (`ApiError.ts`, `errorMap.ts`,
  `profileLimit.ts`, `mocks/handlers/`).
- Este ADR no se edita para cambiar de opinión: si el backend retira o rehace el catálogo de
  códigos, se sustituye con otro.
