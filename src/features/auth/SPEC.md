---
feature: auth
estado: IMPLEMENTADA
hu: [HU-1.3]
prt: [PRT-01.03]
jira: [CM-40]
rutas: [/ingresar]
documentacion: tsdoc-es
backlog: 13092026_01
decisiones: []
figma: Cameia · Mockups MVP
revisado: 2026-09-16
---

# Feature · Autenticación (auth)

## 1. Propósito

Resolver la identidad del Invitado y del Usuario dentro de CAMEIA: permitir que un Invitado
demuestre ante Firebase Authentication que es titular de una Cuenta ya existente, y sostener esa
sesión mientras dura. La feature no administra credenciales — eso es de Firebase — ni decide
entitlement o cuota: solo consigue el ID Token y lo entrega al resto de la aplicación.

Esta SPEC gobierna hoy únicamente el Inicio de Sesión (`HU-1.3` / `CM-40`). El resto de la feature
(Registro, Verificación, Recuperación, Google) se describe conceptualmente en el Anexo A y se
incorporará al cuerpo con el mismo nivel de detalle cuando entre su propia iteración — no antes,
para no declarar en el encabezado un gobierno que la SPEC todavía no cumple.

## 2. Alcance

**Entra en esta iteración:**

- Vista de Login (`PRT-01.03`, ruta `/ingresar`): formulario de correo y contraseña, autenticación
  vía Firebase SDK (`signInWithEmailAndPassword`), los cuatro estados de la pantalla, validaciones
  de cliente, mapeo de errores de Firebase a mensajes traducidos, y redirección tras éxito.
- Reflejar en el estado de sesión (store) si el correo de la cuenta está verificado
  (`user.emailVerified` del `UserCredential`), para que el resto de la aplicación pueda usarlo
  (ver Bloqueo B-03).
- Tratamiento visual de "Continuar con Google" y "¿Olvidaste tu contraseña?" como **visible pero
  deshabilitado**, con el mismo patrón ya aprobado por Producto para funciones diferidas (D-04
  voz, D-05 video: `11092026_v2_respuesta-decisiones-frontend-sprint-1.md`). No es una historia de
  usuario propia: es la forma de no mentirle a la interfaz sobre qué funciona hoy.
- Enlace "¿No tienes cuenta? Crear cuenta": funcional hacia `/registro` **si esa ruta ya existe**
  en `app/router/routes.ts`; si no existe todavía, mismo tratamiento deshabilitado que el punto
  anterior (ver Bloqueo B-01). No se construye la pantalla de registro aquí.
- Placeholder del logo: la mascota (camello) todavía no existe como asset final. Se usa/adapta el
  átomo `Logo` tal como aparece hoy en Figma (marca provisional), de modo que sustituir el asset
  definitivo sea cambiar un solo archivo, no reescribir el header de `AuthLayout`.

**No entra, y es deliberado:**

- **Registro** (`HU-1.1` / `CM-34`) — tiene su propio ticket y su propia iteración.
- **Inicio de sesión con Google** (`HU-1.10`) — el backlog la marca con prototipo `[TBD]` y no
  tiene ticket en el Sprint 1 (`CLAUDE.md` §11). Se muestra el botón (está en Figma) pero
  deshabilitado.
- **Recuperación de contraseña** (`HU-1.4`) — `PRT-01.04` existe en Figma pero no se construye
  aquí; el enlace queda deshabilitado.
- **Verificación de correo electrónico** (`HU-1.2`) — fuera del Sprint 1 según `CLAUDE.md` §12,
  contradicción abierta #6 ("el registro debería redirigir allí. Sin decisión escrita"). Login
  **no** implementa el flujo de verificación; solo deja constancia de si el correo está
  verificado, para consumo futuro.
- El banner persistente de "correo sin verificar" que exige `CA-1.3.1` **no se renderiza en esta
  iteración** (ver Bloqueo B-03): su lugar natural es el shell autenticado (`AppShell`), no la
  pantalla de Login, y ese shell no tiene hoy esa responsabilidad documentada.
- Cualquier llamada a un endpoint propio de CAMEIA para autenticar: no existe (ver §5). Lo que
  ocurra con el ID Token en llamadas protegidas posteriores (`services/http/authTokenInterceptor.ts`)
  es infraestructura transversal ya prevista, no parte de esta pantalla.
- Un guard de tipo "solo invitados" no existe hoy en `app/router/guards/` (`ARCHITECTURE.md` §2
  solo documenta `RequireAuth`, `RequireCompletedProfile`, `RequirePlan`). El comportamiento de
  "si ya hay sesión activa y el usuario visita `/ingresar`, redirigir a `/inicio`" se resuelve
  dentro de la propia página (ver §3), no creando un guard nuevo — evita ampliar la superficie de
  `app/router/` sin ticket que lo pida.

## 3. Comportamiento esperado

### `/ingresar` — Login · `PRT-01.03`

**Qué hace**

- Presenta dos campos (`correo`, `contraseña`) y un botón primario "Ingresar".
- Al enviar, valida en cliente y, si pasa, llama a Firebase SDK
  `signInWithEmailAndPassword(auth, correo, contraseña)`.
- Si Firebase autentica: lee `userCredential.user.emailVerified`, actualiza el estado de sesión y
  redirige. Destino de redirección: la ruta protegida que el usuario intentaba visitar antes de
  que `RequireAuth` lo trajera aquí, si existe; si no, `/inicio` (`PRT-00.02`, per
  `ARCHITECTURE.md` §5). **Confirmar en Fase 0 si `RequireAuth` ya propaga ese "origen"**; si no
  lo hace todavía, Login redirige siempre a `/inicio` y se anota como deuda, no se inventa la
  propagación desde aquí.
- Si Firebase rechaza: muestra el mensaje mapeado (ver §4) sin revelar cuál de los dos campos
  falló (`CA-1.3.1`, mitigación de enumeración).
- Muestra "Continuar con Google" y "¿Olvidaste tu contraseña?" deshabilitados; muestra "Crear
  cuenta" funcional o deshabilitado según exista `/registro` (§2).
- Muestra el placeholder de `Logo` y el texto de marca del panel lateral tal como los define Figma.

**Estados**

| Estado      | Qué muestra |
| ----------- | ----------- |
| Carga       | Botón "Ingresar" en estado `loading` (spinner + deshabilitado vía prop del átomo `Button`), ambos campos deshabilitados. Dura desde el submit hasta que Firebase resuelve. |
| Vacío       | No aplica: la pantalla no depende de una colección que pueda estar vacía. Un campo sin diligenciar se cubre en "Validaciones", no aquí. |
| Error       | Dos variantes, no confundir: (a) error de validación de cliente → mensaje inline bajo el campo, asociado con `aria-describedby` (`CLAUDE.md` §10); (b) error de Firebase (credenciales, rate limit, red) → mensaje genérico a nivel de formulario, en un componente tipo `AlertInline`/`Banner` del design system, nunca el texto crudo del SDK (ver §4). |
| Sin permiso | No aplica: `/ingresar` es una ruta pública (`CLAUDE.md` §11). Si llega un usuario ya autenticado, ver comportamiento de redirección arriba — no es un estado "sin permiso", es una redirección hacia adelante. |

**Validaciones del lado del cliente**

- `correo`: obligatorio y con formato de correo válido antes de llamar a Firebase.
  Llave sugerida: `auth:login.errores.correoRequerido` / `auth:login.errores.correoInvalido`.
- `contraseña`: obligatorio. **No** se valida longitud ni complejidad en Login — esa política es
  de Registro/Firebase, no de esta pantalla. Llave: `auth:login.errores.contrasenaRequerida`.
- Mostrar/ocultar contraseña: es una afordancia del átomo `PasswordField` (icono de ojo), no una
  validación; se documenta aquí porque Figma la muestra en `PRT-01.03`.
- Todo lo demás (credenciales incorrectas, límite de intentos, red) es responsabilidad del
  servidor de Firebase, nunca del cliente (`CA-1.3.1`, último punto).

**Arquitectura y componentes**

- Ruta pública, registrada en `features/auth/routes.tsx`, fuera de `RequireAuth`
  (`ARCHITECTURE.md` §2, §11 de `CLAUDE.md`).
- Layout: `layouts/AuthLayout.tsx`. **Confirmado (16-sep-2026): existía, pero como plantilla
  centrada de una sola columna — no el diseño real de dos columnas de Figma.** Se reconstruyó en
  esta iteración: panel de marca (`bg-brand-base`, logo + marca de agua + titular) visible solo a
  partir de `lg:` (1024px), oculto por debajo; el logo se muestra centrado en tono oscuro arriba de
  `children` en el layout de una columna. `AuthLayoutProps` ganó un `headline?: string` (opcional,
  para no romper `RegisterPage`, que sigue siendo un placeholder). `LoginPage` compone su propio
  `AuthLayout` directamente (no `features/auth/routes.tsx`, que solo envuelve `RegisterPage`)
  porque necesita pasarle un `headline` distinto al de cualquier otra pantalla que reutilice el
  layout más adelante.
- Orden de construcción, siguiendo `CLAUDE.md` §8 (adaptado: esta pantalla no tiene `api/` de
  CAMEIA, ver §5):
  1. `model/authErrorMessage.ts` — única pieza de dominio propia que hacía falta: mapea el código
     de `AuthError` a la llave de i18n a mostrar.
  2. `schemas/login.schema.ts` — esquema zod de `correo`/`contraseña`, sin mensajes de texto (igual
     que `generalInfo.schema.ts`).
  3. `organisms/LoginForm/LoginForm.tsx` — el formulario completo (todo `form-inner` de Figma:
     título, Google, divisor, campos, enlace de recuperación, botón, pie). Puramente
     presentacional: no llama `useLogin` ni `useTranslation` (ver nota abajo).
  4. `pages/LoginPage.tsx` — compone `AuthLayout` + `LoginForm`; es la única pieza de la feature
     que llama `useTranslation` y `useLogin`.
  5. `hooks/useLogin.ts` — orquesta `signIn()`, el mapeo de error y la redirección.
- **Corrección de arquitectura vs. lo planeado:** `useLogin` vive en `LoginPage`, no en
  `LoginForm`. Ningún organismo de este repo llama `useTranslation` (verificado: ningún archivo
  bajo `features/*/organisms/` importa `react-i18next`, no solo `professional-profile` como
  sugería su propio comentario de "consistencia deliberada") ni puede resolver una llave de
  i18n *dinámica* (el código de error solo se conoce en tiempo de ejecución) sin hacerlo. `LoginForm`
  recibe `genericErrorMessage?: string` ya traducido y un `onSubmit` — sigue exactamente el patrón
  de `GeneralInfoForm` (`onSubmit: (values) => void`, sin saber qué hace la página con eso).
- **Componentes reutilizados (confirmados, con su prop API real):** `Button`, `Input`,
  `PasswordField`, `FormField` (compone `Label`+control+`HelperText`/`ErrorText`, mismo patrón que
  `GeneralInfoForm`), `AlertInline` (`variant="error"`), `Divider`. `Label`/`HelperText`/`ErrorText`
  no se usan sueltos: `FormField` ya los compone. **`Logo` no existía** — se creó en
  `design-system/atoms/Logo/` con solo las variantes que esta pantalla necesita (`lockup`,
  `mark-only`; tono `default`/`inverse`), con los dos SVG reales descargados de Figma (blanco y
  navy — el componente de Figma cambia de asset ya resuelto, no de color en tiempo real). Se amplía
  con `avatar/square` cuando otra pantalla lo necesite (CLAUDE.md §4).
- **Mapeador de errores de Firebase Auth: ya existía.** `services/firebase/auth.service.ts` ya
  tenía `FIREBASE_ERROR_CODE_MAP` + la clase `AuthError`, construido junto con `signUp()` (HU-1.1).
  Cubre exactamente los códigos que `CA-1.3.1`/`CA-1.3.2` piden: `auth/invalid-credential` /
  `auth/user-not-found` / `auth/wrong-password` → `AUTH_INVALID_CREDENTIALS` (unificados a
  propósito, para no revelar cuál campo falló); `auth/too-many-requests` →
  `AUTH_TOO_MANY_REQUESTS`; `auth/network-request-failed` → `AUTH_NETWORK_ERROR`;
  `auth/user-disabled` → `AUTH_USER_DISABLED`. No se duplicó — `getAuthErrorMessageKey` (nuevo,
  en `model/`) traduce esos códigos de CAMEIA a una llave de i18n, no códigos crudos de Firebase.
- `services/firebase/firebaseApp.ts` y `auth.service.ts`: **ya existían, completos**, con
  `signIn()`, `signUp()`, `signOut()`, `getIdToken()`, `onAuthStateChanged()`. No se tocaron.
- `stores/auth.store.ts`: se le agregó `emailVerified: boolean` a `AuthUser` (lo único que le
  faltaba). `app/providers/AuthProvider.tsx` ahora lo propaga desde `user.emailVerified` del
  callback de `onAuthStateChanged`.
- **`useLogin` actualiza el store antes de navegar, sin esperar a `AuthProvider`.** Si se navegara
  al destino protegido apenas resuelve `signIn()`, `AuthProvider` (que reacciona a
  `onAuthStateChanged` de forma asíncrona, con su propio `getIdTokenResult` para el plan) podría no
  haber actualizado todavía `isAuthenticated`, y `RequireAuth` rebotaría de vuelta a `/ingresar`.
  `useLogin` llama `setUser` de inmediato con el `plan` que ya hubiera en el store (`null` la
  primera vez); `AuthProvider` lo corrige segundos después con el plan real — la doble escritura es
  intencional y no colisiona (Zustand, última escritura gana).

**Responsive**

Confirmado contra Figma en vivo (16-sep-2026), 4 frames reales por su node-id exacto:

| Frame | Node ID |
| ----- | ------- |
| `PRT-01.03 · Login · lg` | `94:1124` |
| `PRT-01.03 · Login · sm` | `97:1272` |
| `PRT-01.03 · Login · credenciales inválidas · lg` | `96:1153` |
| `PRT-01.03 · Login · credenciales inválidas · sm` | `98:1306` |

- **`lg` (1440px, dos columnas de 720px):** panel de marca oscuro (`bg-brand-base`) a la izquierda
  — logo lockup blanco arriba, marca de agua del glifo aislado al 8% de opacidad de fondo, titular
  `text-display` (56px) abajo — y la columna del formulario a la derecha.
- **`sm` (390px, una columna):** el panel de marca **no existe**, no se apila ni se oculta con CSS:
  Figma no lo dibuja en absoluto en este ancho. El logo lockup (mismo glifo, tono navy) se centra
  arriba de todo, seguido del título en `text-h1-sm` (26px) — coincide exacto con el colapso
  responsive que ya tenía `styles/index.css` a 599px, sin tocarlo.
- **Sin variante `md`:** la tabla de nomenclatura del propio archivo de Figma dice que solo 6
  pantallas de 196 tienen un frame `md` (768px); Login no es una. **Decisión de Frontend:** por
  debajo de `lg:` (1024px, el breakpoint con nombre más cercano que ya expone
  `styles/index.css`) se usa el layout de una columna sin variante intermedia.
- **Estado de error (`credenciales inválidas`, ambos breakpoints):** confirma el diseño que esta
  SPEC ya proponía — `AlertInline` (`variant="error"`) entre el título y el botón de Google, con el
  texto literal **"Correo o contraseña incorrectos"**. Detalle no obvio que Figma sí revela:
  **ambos campos (correo y contraseña) pasan a borde rojo al mismo tiempo, sin mensaje individual
  bajo ninguno de los dos** — la forma visual de cumplir `CA-1.3.1` (no revelar cuál campo falló).
  Confirmado con el usuario que el mismo tratamiento (un solo `AlertInline` genérico + ambos campos
  en rojo) se reutiliza para los demás errores de Firebase (rate limit, red): no hay un frame
  distinto por tipo de error, es el mismo componente con distinto mensaje.
- Los errores de **validación de cliente** (campo vacío, correo con formato inválido) no tienen un
  frame propio en Figma — usan la variante ya tokenizada de `Input`/`FormField`
  (`state="error"` + texto de error individual), comportamiento estándar del design system.
- **Diferencia consciente con el design system:** el ícono que usa `AlertInline` para
  `variant="error"` es `alert-circle` (ya fijo en `molecules/AlertInline/AlertInline.tsx`, usado en
  toda la app); Figma dibuja `alert-triangle` específicamente para esta pantalla. No se cambió el
  ícono del componente compartido por una sola pantalla sin encargo explícito de diseño — regla de
  autoridad de `CLAUDE.md` §16 ("cuando el SPEC y Figma difieren en diseño, manda el SPEC" aplicado
  aquí al componente ya construido, que hace de SPEC visual para el resto de la app).

**Seguridad**

- La contraseña nunca se persiste ni se registra en `console.log`/telemetría; viaja solo a
  Firebase vía el SDK.
- El ID Token no se guarda manualmente en `localStorage`/`sessionStorage` — eso es responsabilidad
  del SDK de Firebase y de `authTokenInterceptor.ts`; la regla dura 9 de `CLAUDE.md` lo prohíbe
  para datos sensibles.
- El límite de intentos fallidos lo aplica Firebase (`CA-1.3.1`); el frontend no implementa su
  propio throttling ni CAPTCHA. `Firebase App Check` aparece propuesto en el glosario pero **no es
  un criterio vigente del backlog** (`GLOSSARY.md` §"Firebase App Check" — "no aparece como
  criterio vigente de BL"), así que queda fuera de esta iteración.
- El frontend **no** implementa ni envía cabeceras `X-User-*` de ningún tipo — política ya
  acordada explícitamente para toda la app (`11092026_v1_consulta-contrato-y-alcance-perfil-profesional.md`,
  C-02: "El Frontend seguirá enviando el token de Firebase... y no implementará la cabecera").
  Esto es relevante porque el diagrama de arquitectura adjunto muestra `X-User-Plan: FREE` en las
  llamadas posteriores al login ("Caso A"); esa cabecera, si existe, la deriva el API Gateway del
  Custom Claim del token — nunca la fija el cliente. Ver Anexo B.
- Persistencia de sesión del SDK de Firebase: se asume el comportamiento por defecto
  (`browserLocalPersistence`) porque Figma no muestra una opción de "recordarme" en `PRT-01.03`.
  Es una decisión de frontend por defecto, no un requisito del backlog; si se confirma lo
  contrario en Figma, se corrige aquí.

## 4. Contrato observable

**Campos y reglas**

| Campo             | Tipo               | Regla                                                                                   | Origen                 |
| ----------------- | ------------------- | ---------------------------------------------------------------------------------------- | ----------------------- |
| `correo`          | `string`            | Formato de correo válido, obligatorio                                                    | `CA-1.3.1`              |
| `contraseña`      | `string`            | Obligatorio; sin regla de formato/longitud en Login                                      | `CA-1.3.1`              |
| `emailVerified`   | `boolean`           | Se lee de `userCredential.user.emailVerified` tras autenticar; no se solicita al backend  | `CA-1.3.1`, `GLOSSARY.md` (Cuenta) |
| ID Token (Firebase) | `string` (JWT)    | Lo emite Firebase tras el login; se adjunta como `Authorization: Bearer` en llamadas protegidas posteriores, vía `services/http/authTokenInterceptor.ts` (transversal, fuera de esta pantalla) | Backlog `HU-1.3`; `ADR-0003` |

**Estados y enumerados**

No hay un enumerado de "estado de sesión" en `docs/GLOSSARY.md` todavía — es una laguna real, no
un olvido de esta SPEC. Mientras no se agregue formalmente al glosario, esta feature usa, solo a
nivel de frontend (no es un valor que el backend envíe ni exija):

- `no-autenticado` → sin `currentUser` de Firebase.
- `autenticando` → petición a Firebase en curso (equivale al estado "Carga" de §3).
- `autenticado` → con `currentUser`; lleva adjunto el booleano `emailVerified` (no es un estado
  aparte, es un atributo del estado `autenticado`, porque `CA-1.3.1` permite el acceso igual).

Cuando esta vocabulario se estabilice con Registro y Verificación, debe subir a
`docs/GLOSSARY.md` en el mismo commit que lo formalice (`CLAUDE.md` §16).

**Errores que el usuario puede ver**

Corregido contra el código real de `services/firebase/auth.service.ts` y
`i18n/locales/es-CO/auth.json` (que ya usa el bloque `ingreso`, no `login`): las llaves de abajo son
las que el código realmente resuelve, no las hipotéticas de la primera versión de esta SPEC.

| Código de `AuthError`      | Cuándo ocurre (código de Firebase que lo produce)                          | Llave de i18n                          |
| --------------------------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| Campo vacío (`correo`/`contraseña`) | Validación de cliente antes de enviar                              | `auth:ingreso.errores.correoRequerido` / `contrasenaRequerida` |
| Formato de correo inválido  | Validación de cliente antes de enviar                                     | `auth:ingreso.errores.correoInvalido`    |
| `AUTH_INVALID_CREDENTIALS`  | `auth/invalid-credential`, `auth/user-not-found`, `auth/wrong-password` (unificados a propósito, `CA-1.3.2`) | `errors:codigos.AUTH_INVALID_CREDENTIALS` → "Correo o contraseña incorrectos" (copia literal de Figma) |
| `AUTH_TOO_MANY_REQUESTS`    | `auth/too-many-requests` (`CA-1.3.1`)                                     | `errors:codigos.AUTH_TOO_MANY_REQUESTS`  |
| `AUTH_NETWORK_ERROR`        | `auth/network-request-failed`                                             | `errors:red` — reutiliza el mensaje genérico de conectividad que ya existe, no se duplica |
| `AUTH_USER_DISABLED`        | `auth/user-disabled`                                                      | `errors:codigos.AUTH_USER_DISABLED`      |
| Cualquier otro código no mapeado (incl. `AUTH_UNKNOWN_ERROR`) | Fallback, para no dejar la pantalla muda ante un código nuevo del SDK | `errors:generico`                        |

El mapeo código-Firebase → código-CAMEIA ya existía (`FIREBASE_ERROR_CODE_MAP` en
`auth.service.ts`, de `HU-1.1`); lo nuevo de esta historia es solo el segundo salto,
código-CAMEIA → llave de i18n (`features/auth/model/authErrorMessage.ts`).

## 5. Enlace HTTP · PROVISIONAL

**Estado del contrato:** no aplica un endpoint propio de CAMEIA para este flujo · fuente:
`13092026_01_Backlog.xlsx` (`HU-1.3`), `03092026_v1_familias-endpoints-sprint-1.md` §3 y §9, y el
diagrama de flujo de autenticación adjunto a este chat · revisado el 16-sep-2026.

| Operación       | Método y ruta                                              | Envía                     | Recibe                                  |
| ---------------- | ------------------------------------------------------------ | -------------------------- | ------------------------------------------ |
| Inicio de sesión | SDK Firebase Auth `signInWithEmailAndPassword(auth, correo, contraseña)` — **no es HTTP a CAMEIA** | Correo y contraseña, directo a Firebase | `UserCredential` (incluye `user`, `user.emailVerified`, y el ID Token vía `getIdToken()`) |

Notas de esta sección, para que quede explícito y no se reinterprete después:

- El backlog y el documento de familias de endpoints (`03092026_v1_familias-endpoints-sprint-1.md`
  §2, fila `/api/v1/auth`) coinciden en que **no existe endpoint CAMEIA de login** en Sprint 1.
- El diagrama adjunto lo confirma para el flujo completo de cuenta: *"Ni el inicio de sesión ni
  los correos pasan por el Gateway"*.
- No se mapea aquí ningún `mocks/handlers/auth.ts` de MSW para el login en sí, porque MSW
  intercepta HTTP y este flujo no genera una petición HTTP propia de la aplicación. Las pruebas de
  `LoginForm`/`useLogin` deben mockear el módulo del SDK de Firebase, no la red.
- Sobre la cabecera `X-User-Plan` que aparece en el diagrama para llamadas posteriores ("Caso A"):
  no es responsabilidad de Login ni de esta SPEC implementarla del lado cliente (ver §3, Seguridad,
  y Anexo B).

## 6. Criterios de aceptación

| Criterio    | Qué hace el frontend que el criterio no dice |
| ----------- | ----------------------------------------------- |
| `CA-1.3.1`  | Traduce los estados de carga/error a componentes concretos (spinner en el botón, `AlertInline` para el mensaje genérico); valida formato de correo en cliente antes de llamar a Firebase; persiste `emailVerified` en el estado de sesión para que otras pantallas puedan usarlo (aunque el renderizado del banner queda fuera, ver Bloqueo B-03). |
| `CA-1.3.2`  | Mapea el código `auth/invalid-credential` (y otros `auth/*` relevantes) a una llave de `errors:*` mediante un mapeador dedicado, en vez de mostrar el mensaje crudo del SDK de Firebase. |

## 7. Estado de implementación

| Archivo | Qué implementa | Prueba |
| ------- | --------------- | ------- |
| `src/design-system/atoms/Logo/Logo.tsx` | Marca de Cameia, variantes `lockup`/`mark-only`, tono `default`/`inverse` | `src/design-system/atoms/Logo/Logo.test.tsx` |
| `src/design-system/icons/GoogleIcon.tsx`, `src/design-system/icons/svg/google.svg` | Ícono real de Google (reemplaza el placeholder `AtSign`) | — (cambio visual, cubierto indirectamente por `LoginForm.test.tsx`) |
| `src/layouts/AuthLayout.tsx` | Panel de marca de dos columnas + colapso a una columna | `src/layouts/AuthLayout.test.tsx` |
| `src/stores/auth.store.ts`, `src/app/providers/AuthProvider.tsx` | `emailVerified` en `AuthUser`, propagado desde `onAuthStateChanged` | `src/app/providers/AuthProvider.test.tsx` (actualizado) |
| `src/features/auth/model/authErrorMessage.ts` | Código de `AuthError` → llave de i18n | `src/features/auth/model/authErrorMessage.test.ts` |
| `src/features/auth/schemas/login.schema.ts` | Validación zod de `correo`/`contraseña`, sin mensajes | — (cubierto por `LoginForm.test.tsx`) |
| `src/features/auth/organisms/LoginForm/LoginForm.tsx` | Formulario completo, presentacional | `src/features/auth/organisms/LoginForm/LoginForm.test.tsx` |
| `src/features/auth/hooks/useLogin.ts` | Orquesta `signIn()`, error y redirección | `src/features/auth/hooks/useLogin.test.tsx` |
| `src/features/auth/pages/LoginPage.tsx` | Compone `AuthLayout` + `LoginForm`, único punto con `useTranslation`/`useLogin` | `src/features/auth/pages/LoginPage.test.tsx` |
| `src/features/auth/routes.tsx` | «/ingresar» → `LoginPage` (con su propio `AuthLayout`); «/registro» sigue envuelto aquí | cubierto por `src/app/router/index.test.tsx` |

## 8. Bloqueos

| Id   | Qué falta                                                                                                  | De quién depende                       | Estado |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ----------- |
| B-01 | ~~Confirmar si `/registro` ya existe~~ | — | **Resuelto 16-sep-2026:** ya existe, en `ROUTES.registro` y en `features/auth/routes.tsx`. "Crear cuenta" navega de verdad. |
| B-02 | Ticket Jira propio y `PRT` para `HU-1.10` (Google) — el backlog lo marca `[TBD]`                             | Product Owner / Scrum Master              | Abierto — no bloquea Login, el botón queda deshabilitado. |
| B-03 | Dónde y cuándo se renderiza el banner persistente de correo no verificado que exige `CA-1.3.1` — el `AppShell` no tiene hoy esa responsabilidad documentada | Decisión de Frontend, posible ticket propio | Abierto — `auth.store.ts` ya persiste `emailVerified` para cuando se resuelva. |
| B-04 | ~~Confirmar el estado real de `services/firebase/*`, `stores/auth.store.ts`, `layouts/AuthLayout.tsx`~~ | — | **Resuelto 16-sep-2026:** `services/firebase/*` completo y reutilizado tal cual; `auth.store.ts` extendido con `emailVerified`; `AuthLayout.tsx` existía pero no coincidía con Figma — reconstruido (ver §3). |
| B-05 | ~~Breakpoints y comportamiento responsive reales de `PRT-01.03`~~ | — | **Resuelto 16-sep-2026:** 4 frames reales confirmados por su node-id exacto (lg/sm, con y sin error) — ver tabla en §3, Responsive. |

## 9. Notas

- **Regla de autoridad recordada** (`CLAUDE.md` §16): si esta SPEC y Figma difieren en diseño,
  manda la SPEC y Figma se actualiza después; si difieren en comportamiento, manda siempre el
  backlog. Ninguna diferencia consciente identificada todavía — se confirma en la Fase 0/1 del
  prompt de Claude Code y se anota aquí si aparece.
- El tratamiento "visible pero deshabilitado" para Google y recuperación de contraseña (§2) es una
  decisión mía, tomada por analogía con D-04/D-05, **no** un criterio del backlog para `HU-1.3`.
  Si Producto prefiere ocultarlos en vez de deshabilitarlos, es un ajuste de una línea en esta
  SPEC y en `LoginPage.tsx`.
- Único tema visual claro, sin `dark:` (`ADR-0005`) — no aplica lógica de tema a esta pantalla.
- Placeholder de logo: no se crea ni se busca un asset de camello nuevo — se descargó y commiteó el
  SVG provisional tal como Figma lo exporta hoy (`design-system/atoms/Logo/glyph-*.svg`), en dos
  tonos ya resueltos por el archivo de diseño (blanco/navy), no recoloreado en tiempo real.
- `i18n/locales/es-CO/auth.json` tenía `ingreso.subtitulo` ("Continúa preparando tu próxima
  entrevista") de antes de esta iteración. **Figma no dibuja ningún subtítulo bajo "Inicia
  sesión"** en `PRT-01.03` — la llave no se usa en `LoginPage`. No se borró (podría ser una
  decisión de Producto pendiente de confirmar, no un error evidente), pero queda sin consumidor;
  se anota aquí para que no se asuma implementada.
- `ingreso.cta` e `ingreso.irARegistro` tenían texto que no coincidía con la copia literal de
  Figma ("Iniciar sesión"/"Regístrate" en vez de "Ingresar"/"Crear cuenta") — corregidos (R6, copia
  literal, `CLAUDE.md` §16: SPEC/Figma mandan sobre diseño y copy).
- **Discrepancia observada, no de esta SPEC:** `CLAUDE.md` §14.6 documenta que los barriles
  `index.ts` solo existen en cada componente del design system y en la raíz de cada feature — pero
  cada organismo de `professional-profile` (y ahora `LoginForm`) tiene el suyo propio. Se siguió el
  código real, no el texto de esa sección; se lo señala para que se corrija la documentación o el
  código, no en silencio.

---

## Anexo A · Mapa completo de la feature `auth` (conceptual, HE-01)

Este anexo cumple con el requisito de que la SPEC contemple la feature completa, sin que el
encabezado YAML declare un gobierno de detalle que el cuerpo todavía no tiene para estas historias.
Cada fila sube al cuerpo principal (secciones 1-8) cuando entra su propia iteración.

| HU       | Qué es                          | Jira    | PRT        | Sprint (backlog) | Estado en esta SPEC |
| -------- | ---------------------------------- | ------- | ---------- | ----------------- | ---------------------- |
| `HU-1.1` | Registro con correo/contraseña      | `CM-34` | `PRT-01.01`| 1                  | Fuera de esta SPEC; HE-01 la referencia, sin detalle |
| `HU-1.2` | Verificación de correo electrónico | pendiente | `PRT-01.02`| 2 (fuera de Sprint 1, `CLAUDE.md` §12 abierta #6) | Fuera de esta SPEC |
| `HU-1.3` | **Inicio de sesión**             | `CM-40` | `PRT-01.03`| 1                  | **Gobernada por esta SPEC** |
| `HU-1.4` | Recuperación de contraseña        | pendiente | `PRT-01.04`| 2                  | Fuera de esta SPEC |
| `HU-1.10`| Registro/login con Google         | pendiente | `[TBD]` (backlog) | 3          | Fuera de esta SPEC |

Notas de trazabilidad: `HU-1.2`, `HU-1.4` y `HU-1.10` no tienen clave Jira confirmada en ningún
documento disponible en este chat (`CLAUDE.md` §11 solo lista `CM-34` y `CM-40` para `HE-01` en
Sprint 1) — se escribe `pendiente`, no se inventa un número.

## Anexo B · Diagrama de flujo de autenticación (contexto arquitectónico)

El diagrama adjunto a este chat describe el flujo de **registro** (`HU-1.1`), no el de Login, pero
dos hechos ahí son relevantes para toda la feature `auth`, incluida esta SPEC:

1. El Gateway distingue **"Caso B"** (llamadas sin sesión, como crear la cuenta: borra
   `X-User-*`/`Authorization` del cliente y firma con OIDC internamente) de **"Caso A"** (llamadas
   ya autenticadas). Esta distinción vive en el Gateway, no en `cameia-web`.
2. Las llamadas "Caso A" muestran `X-User-Plan: FREE`. Por la política ya acordada
   (`11092026_v1_consulta-contrato-y-alcance-perfil-profesional.md`, C-02), esa cabecera —si
   existe en el diseño definitivo— la deriva el Gateway del Custom Claim de Firebase
   (`GLOSSARY.md`: "Custom Claim de plan — Dato mínimo del plan publicado en Firebase para
   autorización rápida"), nunca la fija `cameia-web`. **`HU-1.3` no depende de esto**: Login
   termina cuando Firebase entrega el ID Token; todo lo de arriba ocurre en llamadas *posteriores*
   a otras features.
3. El diagrama confirma explícitamente que el login y el envío de correos de Firebase **no pasan
   por el Gateway** — ya incorporado en §5 de esta SPEC.

## Anexo C · Preguntas que esta SPEC no puede cerrar por sí sola

- ¿Quién es dueño de construir el banner persistente de correo no verificado (B-03): esta feature,
  `home`, o un `AppShell` transversal?
- ¿Cuándo se asigna Jira/PRT a `HU-1.10` (B-02)?
- ~~¿`RequireAuth` ya propaga la ruta de origen para redirigir tras login, o hay que añadirlo?~~
  **Resuelto 16-sep-2026:** sí, ya lo hacía (`Navigate to={ROUTES.ingresar} state={{ from: location }}`
  en `RequireAuth.tsx`). `useLogin` ya lee `location.state.from` para decidir el destino.

Ninguna de las dos preguntas abiertas bloquea Login; se registran para que no se pierdan.