# 0006 · El registro lo orquesta el backend; el cliente no crea la cuenta en Firebase

- **Estado:** Aceptada
- **Fecha:** 18-sep-2026
- **Decide:** Frontend (Juan Diego Gómez Garcés), con el diagrama de flujo de autenticación como
  fuente de arquitectura vigente por venir directamente de Backend
- **Ticket:** CM-34

## Contexto

El backlog (`13092026_01_Backlog.xlsx`, `HU-1.1`) describe el registro así: *"Endpoint: SDK
Firebase Auth `createUserWithEmailAndPassword`. `POST /api/v1/users` (Sincronización DB)"* — el
cliente crea la cuenta en Firebase y después sincroniza. Sobre esa lectura ya se había construido
`services/firebase/auth.service.ts:signUp()`, con su propio mapa de errores de Firebase para
`auth/email-already-in-use`, `auth/weak-password`, etc.

El diagrama de flujo de autenticación (adjunto al proceso de especificación de `auth`, con origen
directo en Backend) describe algo distinto: `cameia-web` hace `POST /api/v1/users` **sin sesión**
("Caso B": el Gateway descarta `X-User-*`/`Authorization` del cliente y firma internamente con
OIDC); es **`cameia-cuentas`** quien valida edad/unicidad y llama a `createUser` del **Admin SDK**,
fija el Custom Claim `plan=FREE` e inserta la fila en PostgreSQL. Solo después de que esa llamada
responde `201`, el cliente llama `signInWithEmailAndPassword` y `sendEmailVerification`, ambos
directo contra Firebase, sin pasar por el Gateway.

Las dos fuentes no pueden ser ciertas a la vez para el mismo paso.

## Decisión

Prevalece el diagrama. El cliente **no** llama a `createUserWithEmailAndPassword`. El flujo de
registro es:

1. `POST /api/v1/users`, sin token, con los datos del formulario (incluida la contraseña, que el
   backend usa una sola vez para provisionar la cuenta vía Admin SDK).
2. Si `201`: el cliente llama `signInWithEmailAndPassword(auth, correo, contraseña)` — reutiliza
   `services/firebase/auth.service.ts:signIn()`, no se duplica lógica.
3. El cliente llama `sendEmailVerification()` (nueva, se agrega a `auth.service.ts`, mismo patrón
   que las funciones existentes).
4. Si `4xx`: el error viene del backend, no del SDK de Firebase.

## Alternativas descartadas

**Mantener `signUp()` y la arquitectura ya construida (lectura literal del backlog).** Se
descarta porque el diagrama es la fuente que refleja el diseño vigente del lado del backend, y
`CM-35` (el endpoint) sigue en construcción sobre esa base — seguir con `signUp()` produciría un
frontend que valida contra un flujo que el backend no va a exponer.

**Sostener ambos caminos con una bandera de feature flag.** Se descarta por complejidad
innecesaria: no hay ningún escenario en el Sprint 1 donde convivan las dos arquitecturas a la vez.

## Consecuencias

- `signUp()` y las entradas de `FIREBASE_ERROR_CODE_MAP` exclusivas de creación de cuenta
  (`auth/email-already-in-use`, `auth/weak-password`, `auth/invalid-email` si solo se usaba ahí)
  quedan sin consumidor y se retiran — código muerto no se conserva "por si acaso" (`CLAUDE.md`
  §13).
- Nace `features/auth/api/` (primer consumo de ese patrón en la feature, `register.dto.ts` /
  `register.mapper.ts` / `register.api.ts`), marcado `// PROVISIONAL` porque `CM-35` no ha
  publicado el contrato exacto — nombres de campo y códigos de error pueden cambiar; el mapeador es
  el cortafuegos, igual que en el resto del proyecto (`ADR-0003`).
- El error de "correo duplicado" deja de ser un código de Firebase y pasa a ser un código de
  CAMEIA (`errorMap.ts`, formato provisional `{code, message, details}`, `CLAUDE.md` §8) —
  todavía sin publicar por Backend.
- La contraseña viaja una vez, por HTTPS, al backend propio — superficie nueva que Login nunca
  tuvo. Se documenta en `SPEC.md` §3 (Seguridad) y queda como pregunta abierta a Backend/Arquitectura
  si se persiste en algún punto intermedio (no debería).
- Si `CM-35` termina publicando un contrato distinto al asumido aquí, este ADR se sustituye por
  otro, no se edita (regla general de `docs/adr/`).