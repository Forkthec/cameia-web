# 0007 · El contrato de error real es `ProblemDetail` (RFC 7807), sin código propio

- **Estado:** Aceptada
- **Fecha:** 19-sep-2026
- **Decide:** Frontend (Juan Diego Gómez Garcés), con el código real de dos microservicios como
  evidencia
- **Ticket:** CM-34 (seguimiento — diagnóstico de un `422` real en Registro)

## Contexto

Un usuario probó `/registro` en un ambiente real y recibió `422 Unprocessable Entity`. Un agente
con acceso al gateway y a `cameia-cuentas` investigó y encontró dos causas concretas
(`register.schema.ts` no replicaba `PasswordPolicy.java` ni `PhoneNumber.java`), pero también
adjuntó `BusinessExceptionHandler.java` — el `@RestControllerAdvice` real de `cameia-cuentas` — y
de ahí salió un hallazgo más grande.

`services/http/errorMap.ts` y `ApiError.ts` esperaban un formato provisional propio:
`{ code, message, details, correlationId, path, timestamp }`, declarado como tal desde su primera
línea (`// PROVISIONAL — … API-TBD-14`). El cuerpo real que `BusinessExceptionHandler.java` envía
es un `ProblemDetail` de Spring (RFC 7807): `type`/`title`/`status`/`detail` estándar del RFC, más
una extensión propia `errors: [{field, message}]` — **sin ningún `code` estable**. Ninguna de las
excepciones de negocio reales (`EmailAlreadyRegisteredException`, `InvalidBirthDateException`,
`WeakPasswordException`, `EmailNotVerifiedException`, `AccountNotFoundException`) pasa un código
propio al cuerpo; solo dos de ellas (`InvalidBirthDateException`, `WeakPasswordException`) llenan
`errors[]` con `{field, message}} — las demás (correo duplicado, celular inválido vía
`IllegalArgumentException`) no traen `errors[]` en absoluto.

Esto no era un caso aislado de `cameia-cuentas`: `professional-profile/SPEC.md` §4 ya documentaba,
desde antes de esta sesión, que el backend real de Perfil (`ApiExceptionHandler.java`) responde
igual — `ProblemDetail` sin `code` propio, con los `httpStatus` confirmados por
`ProfileController.java` pero no un código de cuerpo. Y el propio `docs/decisiones/
11092026_v2_respuesta-decisiones-frontend-sprint-1.md` ya había cerrado esto el 11-sep-2026:
_"Cierre de TBD obsoletos... API-TBD-14 (formato de error → `ProblemDetail`)"_. El código de
`errorMap.ts`/`ApiError.ts` simplemente nunca se actualizó para reflejar ese cierre.

## Decisión

`ApiError`/`errorMap.ts` se reescriben contra el `ProblemDetail` real:

```ts
interface ApiErrorField { field: string; message: string; }
class ApiError {
  httpStatus: number;
  title: string;
  detail: string;
  errors: ApiErrorField[];
  type?: string;
  instance?: string;
  fieldMessage(field: string): string | undefined;
  hasField(field: string): boolean;
}
```

`title`/`detail` se conservan en la instancia (útiles para logs/observabilidad a futuro), pero
**ningún componente los renderiza** — sigue vigente la regla de `CLAUDE.md` §8 de no mostrar texto
crudo del backend, solo que ahora el discriminador es `httpStatus` + `errors[].field` (cuando el
backend lo etiqueta), no un `code` que el backend real nunca envía.

Cada consumidor de `ApiError.code`/`.details` migra a `httpStatus`/`.errors`, conocedor del
contexto de su propia llamada (p. ej. `useFinalizeProfile` sabe que llama a
`POST .../completion`, así que cualquier `422` de esa mutación específica es "perfil incompleto" —
no necesita un código para saberlo). El catálogo compartido `errors:codigos.*` de `errors.json` se
recorta a lo genuinamente compartido por `httpStatus` (`generico`, `red`, `NOT_FOUND`, los `AUTH_*`
de Firebase); los mensajes específicos de cada caso de negocio pasan al namespace de su propia
feature.

## Alternativas descartadas

**Pedirle al backend el `codigoCameia` que la propuesta original (`03092026_v1_reglas-codigo-
backend-cameia.md` §7.1) sí contemplaba, y pausar el frontend hasta tenerlo.** Se descarta: el
`422` real que reportó el usuario ya está en producción, bloquea el registro hoy, y el contrato
`ProblemDetail` sin `code` ya es un hecho confirmado en dos microservicios reales, no una
hipótesis — no hay nada que "esperar" para poder discriminar por `httpStatus`/`field`, que es
información que el backend sí envía siempre.

**Parche local solo en `useRegister`/`register.mapper.ts`, sin tocar `errorMap.ts`/`ApiError.ts`.**
Se descarta: habría dejado `professional-profile` con el mismo problema (su `ApiError.code` nunca
tuvo un valor real que leer, solo códigos de mock) y no habría corregido la causa raíz — la
próxima feature que llamara a un endpoint real habría tropezado con lo mismo.

## Consecuencias

- Blast radius real: `ApiError.ts`, `errorMap.ts` (+ test), `mocks/handlers/profiles.handlers.ts`
  (~15 sitios de error reescritos a la forma real), `mocks/handlers/auth.handlers.ts`,
  `EditProfilePage.tsx`, `missingRequirements.ts`, `useFinalizeProfile.ts`/`profile.api.ts` (TSDoc),
  `useRegister.ts`, `RegisterPage.tsx`, `errors.json` (recortado).
- `CLAUDE.md` §8 se reescribe para dejar de describir el formato como "PENDIENTE" y documentar el
  contrato real y su regla de discriminación.
- Si `CM-35`/el equipo de Cuentas o Perfil terminan agregando un `codigoCameia` real más adelante,
  este ADR se sustituye por otro que lo incorpore — no se edita (regla general de `docs/adr/`).
