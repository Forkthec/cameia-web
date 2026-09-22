---
feature: auth
estado: EN_CURSO
hu: [HU-1.3, HU-1.1, HU-1.8, HU-1.2]
prt: [PRT-01.03, PRT-01.01, PRT-01.08, PRT-01.02]
jira: [CM-40, CM-34, CM-194, CM-195, CM-14]
rutas: [/ingresar, /registro, /verificar-correo]
documentacion: tsdoc-es
backlog: 16092026_01
decisiones: []
figma: Cameia · Mockups MVP
revisado: 2026-09-21
---

# Feature · Autenticación (auth)

> **Corrección de `estado`, 20-sep-2026 (Bloqueo B-20, resuelto):** el valor original de esta
> sección, `PARCIAL`, no era uno de los válidos según `pnpm spec:check`
> (`docs/_plantilla-feature/SPEC.md`: `ANDAMIAJE | EN_CURSO | IMPLEMENTADA | BLOQUEADA`) — confirmado
> al correr `pnpm spec:check` tras implementar `CM-194` (único error real de esa corrida; el resto
> son hallazgos `SC-04` no verificables, ya esperados). Se corrige a `EN_CURSO`: Login, Registro y
> ahora Cerrar sesión (`CM-194`, `CA-1.8.1`) están implementados, pero el resto de la feature
> (Verificación de correo, Recuperación de contraseña, Google, cierre de sesión en todos los
> dispositivos) sigue solo conceptual en el Anexo A — no calza con `IMPLEMENTADA`.

> **Alcance nuevo, 21-sep-2026 (`CM-14` / `HU-1.2`):** entra la **Verificación de correo
> electrónico** — la pantalla `/verificar-correo` (`PRT-01.02`), el guard que impide usar la
> aplicación con el correo sin verificar, y la llamada de activación `POST
> /api/v1/users/me/verification` que pasa la Cuenta de `PENDING_VERIFICATION` a `ACTIVE` del lado
> de `cameia-cuentas` (`CU-2`/`REQ-CU-13` de
> `cameia-cuentas/specs/CM-14-RegistroUsuario/spec.md`). Hasta hoy esta SPEC declaraba esa pantalla
> explícitamente fuera de alcance («sigue fuera de Sprint 1»); esas frases se corrigen en §2, §3 y
> §5 en vez de dejarlas describiendo el estado anterior como si fuera el actual. `estado` sigue en
> `EN_CURSO`: Recuperación de contraseña (`HU-1.4`), Google (`HU-1.10`) y el cierre de sesión en
> todos los dispositivos siguen solo conceptuales en el Anexo A.

## 1. Propósito

Resolver la identidad del Invitado y del Usuario dentro de CAMEIA: permitir que un Invitado se
dé de alta y demuestre ante Firebase Authentication que es titular de una Cuenta, sostener esa
sesión mientras dura, y terminarla quando el propio Usuario lo pida. La feature no administra
credenciales de forma permanente — eso es de Firebase — ni decide entitlement o cuota: solo
consigue el ID Token, lo entrega al resto de la aplicación, y lo suelta cuando corresponde.

Esta SPEC gobierna hoy el Inicio de Sesión (`HU-1.3` / `CM-40`, **implementado**), el Registro
(`HU-1.1` / `CM-34`, **implementado**), el Cierre de Sesión (`HU-1.8` / `CM-194`, **implementado**,
alcance acotado a `CA-1.8.1` — ver §2) y la Verificación de Correo (`HU-1.2` / `CM-14`,
**implementada en esta iteración**, con parte de sus pruebas pendientes — ver §2 y §7). El resto de la feature
(Recuperación, Google, y el cierre de sesión en **todos los dispositivos** que la propia `HU-1.8`
anticipa como trabajo de Backend) sigue descrito solo conceptualmente en el Anexo A y sube al
cuerpo cuando entre su propia iteración.

La feature termina donde empieza el negocio: consigue el ID Token y demuestra ante el backend que
el correo quedó verificado, pero **no decide** si una Cuenta está activa — eso lo resuelve
`cameia-cuentas` leyendo el claim `email_verified` del token, nunca la palabra del navegador
(regla explícita de su spec, §5).

## 2. Alcance

### Login (`HU-1.3` / `CM-40`) — implementado

**Entra:**

- Vista de Login (`PRT-01.03`, ruta `/ingresar`): formulario de correo y contraseña, autenticación
  vía Firebase SDK (`signInWithEmailAndPassword`), los cuatro estados de la pantalla, validaciones
  de cliente, mapeo de errores de Firebase a mensajes traducidos, y redirección tras éxito.
- Reflejar en el estado de sesión (store) si el correo de la cuenta está verificado
  (`user.emailVerified` del `UserCredential`), para que el resto de la aplicación pueda usarlo
  (ver Bloqueo B-03).
- Tratamiento visual de "Continuar con Google" y "¿Olvidaste tu contraseña?" como **visible pero
  deshabilitado**, con el mismo patrón ya aprobado por Producto para funciones diferidas (D-04
  voz, D-05 video: `11092026_v2_respuesta-decisiones-frontend-sprint-1.md`).
- Enlace "¿No tienes cuenta? Crear cuenta": funcional hacia `/registro` (ya existe).
- Placeholder del logo: la mascota (camello) todavía no existe como asset final. Se usa/adapta el
  átomo `Logo` tal como aparece hoy en Figma (marca provisional).

**No entra, y es deliberado:**

- **Registro** (`HU-1.1` / `CM-34`) — su propia iteración, ver abajo.
- **Inicio de sesión con Google** (`HU-1.10`) — el backlog la marca con prototipo `[TBD]` y no
  tiene ticket en el Sprint 1. Se muestra el botón (está en Figma) pero deshabilitado.
- **Recuperación de contraseña** (`HU-1.4`) — `PRT-01.04` existe en Figma pero no se construye
  aquí; el enlace queda deshabilitado.
- **Verificación de correo electrónico** (`HU-1.2`) — fuera del Sprint 1. Login **no** implementa
  el flujo; solo deja constancia de si el correo está verificado, para consumo futuro.
- El banner persistente de "correo sin verificar" que exige `CA-1.3.1` **no se renderiza en esta
  iteración** (Bloqueo B-03): su lugar natural es el shell autenticado (`AppShell`).
- Cualquier llamada a un endpoint propio de CAMEIA para autenticar: no existe para este paso.
- Un guard de tipo "solo invitados": no se crea; el comportamiento de redirección si ya hay sesión
  se resuelve dentro de la propia página.

### Registro (`HU-1.1` / `CM-34`) — implementado

**Entra en esta iteración:**

- Vista de Registro (`PRT-01.01`, ruta `/registro`): formulario completo — `nombre`, `apellido`,
  `fechaNacimiento`, `correo`, `celular` (opcional), `contraseña`, `confirmarContraseña`,
  `pronombres` — con sus validaciones de cliente, envío a `POST /api/v1/users` (sin sesión, ver
  §5 y `ADR-0006`), y encadenamiento a `signIn()` + `sendEmailVerification()` tras el éxito.
- El campo `pronombres` gana el alcance de esta iteración de la feature completa (`HU-1.1`
  obligatorio; el editor de `HU-1.6` es Sprint 2 y no se toca aquí).
- El `Modal` de confirmación de Plan Gratis (backlog: "esta asignación debe mostrarse al usuario
  inmediatamente tras el registro") — con el copy mínimo que el backlog exige, marcado pendiente
  de aprobación de Producto/Diseño (Bloqueo B-08).
- Los cuatro mensajes de validación de fecha de nacimiento (`CA-1.1.1`/`CA-1.1.3`): menor de edad,
  fecha futura, >110 años, formato inválido.
- El estado de error "correo duplicado" con su bloque de dos acciones ("Iniciar sesión", funcional;
  "Recuperar contraseña", deshabilitado — mismo tratamiento que Login).
- Extender `utils/calculateAge.ts` con las dos guardas que hoy no cubre (fecha futura, >110 años).
- Primera capa `features/auth/api/` de la feature (`register.dto.ts`/`register.mapper.ts`/
  `register.api.ts`), **PROVISIONAL**, y su `mocks/handlers/auth.ts`.
- Retirar `signUp()` y las entradas de `FIREBASE_ERROR_CODE_MAP` que le pertenecían en exclusiva
  (`ADR-0006`) — **cambio grande, requiere confirmación antes de ejecutarse** (ver el prompt).
- Primer componente `design-system/organisms/Modal/` de la app (variante `type=confirm`).

**No entra, y es deliberado:**

- La **pantalla** de verificación de correo (`HU-1.2`, `PRT-01.02`) — **ya no aplica**: entró con
  `CM-14`, ver la subsección siguiente. Lo que la iteración de Registro construyó fue solo el
  *envío* del correo (`CA-1.1.1`), con redirección a `/inicio` porque no existía pantalla de
  destino; esa redirección la reemplaza `CM-14`.
- Login con Google desde este formulario (`HU-1.10`) — mismo tratamiento visible-deshabilitado
  que en Login.
- Un editor de pronombres reutilizable para `HU-1.6` (Sprint 2) — solo se construye el catálogo de
  códigos que esta pantalla necesita.
- Validación de fuerza de contraseña como regla dura de bloqueo — el indicador de 4 segmentos que
  muestra Figma es visual; no hay una regla de mínimo publicada por backlog ni por Backend todavía.
  Si `CM-35` la impone, llegará como código de error mapeado (§4), no como validación inventada
  aquí.
- Formato/validación estricta de `celular` (prefijo internacional) — Figma lo dibuja como
  referencia visual (`+57 300 000 0000`) pero el backlog no exige una regla de formato; el campo
  queda como texto libre opcional.

### Verificación de correo (`HU-1.2` / `CM-14`) — implementada en esta iteración

**Entra:**

- Vista de Verificación (`PRT-01.02`, ruta nueva `/verificar-correo`): la pantalla del prototipo
  entregado por el usuario el 21-sep-2026 — `Toast` de éxito del registro, titular «Verifica tu
  correo», el correo de destino, ilustración, instrucción, botón «Abrir correo» y enlace «Reenviar
  enlace». **Ese prototipo es la fuente de diseño de esta pantalla**, no un frame de Figma
  (decisión explícita del usuario, ver §9 y B-26).
- **Detección de la verificación sin salir de la pantalla:** sondeo de `user.reload()` cada 5 s
  mientras la pestaña esté visible, más una comprobación inmediata al montar y cada vez que la
  pestaña recupera el foco (decisión explícita del usuario, 21-sep-2026).
- **Activación de la Cuenta en el backend:** `POST /api/v1/users/me/verification` con el ID Token
  ya refrescado. Es lo único que pasa la Cuenta de `PENDING_VERIFICATION` a `ACTIVE`
  (`CU-2`/`REQ-CU-13` de `cameia-cuentas`): **verificar el correo del lado de Firebase no activa
  nada por sí solo**, y esta SPEC ya lo tenía anotado como hallazgo pendiente en §5 desde `CM-34`.
- **Reenvío del enlace** con `sendEmailVerification()` (ya existe, `CM-34`) y una espera obligada
  de 60 s entre envíos — decisión de Frontend: Firebase estrangula el envío con
  `auth/too-many-requests`, y un botón sin freno lleva derecho a ese error.
- **Guard nuevo `RequireVerifiedEmail`** (decisión explícita del usuario, 21-sep-2026): ninguna
  ruta autenticada se puede usar con el correo sin verificar; todas redirigen a
  `/verificar-correo`. Es la traducción al frontend de la regla de negocio de Cuentas: «una cuenta
  `PENDING_VERIFICATION` existe, pero el resto de la plataforma no debe tratarla como utilizable»
  (spec de `cameia-cuentas` §5).
- **Cambio de `RedirectIfAuthenticated`:** hoy manda a `/inicio` a cualquiera con sesión; pasa a
  mandar a `/verificar-correo` cuando esa sesión tiene el correo sin verificar.
- **Activación de rezagados al iniciar sesión:** `useLogin` dispara la misma activación, en
  segundo plano y sin bloquear la navegación, cuando la sesión que acaba de abrirse ya trae el
  correo verificado. Es la única forma de recuperar una Cuenta que verificó el correo pero cuya
  activación falló en su momento — el frontend no puede consultar el estado de la Cuenta (B-24) y
  `REQ-CU-13` garantiza que repetir la llamada es inofensivo.
- **Retiro del `Modal` de Plan Gratis del flujo de Registro** y traslado de su mensaje a la
  pantalla de verificación. **Decisión propuesta por Frontend a raíz de un defecto real (D-01, §9):
  ese modal nunca llegó a verse en la aplicación. Pendiente de tu visto bueno en la revisión de
  esta SPEC.**
- **Cierre de `B-03`** (dónde se renderiza el aviso de correo sin verificar, `CA-1.3.1`): con el
  guard duro deja de hacer falta un banner en el shell autenticado — nadie autenticado sin
  verificar llega a una pantalla donde mostrarlo.

**No entra, y es deliberado:**

- **Que el enlace del correo abra la aplicación** (`applyActionCode` sobre un `oobCode`, en una
  ruta propia tipo `/auth/accion`): exige cambiar la plantilla y el *action URL* en la consola de
  Firebase, fuera de este repositorio. Descartado explícitamente el 21-sep-2026 a favor del
  sondeo. El enlace sigue abriendo la página alojada por Firebase.
- **Caducidad de las cuentas que nunca verifican el correo:** `CU-TBD-04` de la spec de
  `cameia-cuentas` está escalada al Product Owner y bloquea el cierre de la HU allá, no aquí. El
  frontend no inventa ningún vencimiento ni cuenta regresiva.
- **Un `GET` de estado de la Cuenta:** no existe en `cameia-cuentas` (B-24). El frontend no puede
  preguntar si una Cuenta ya está `ACTIVE`; se apoya en que la activación es idempotente.
- **Infraestructura global de `Toast`** (store, host, provider): el `Toast` de esta pantalla se
  renderiza dentro de la propia página, como ya hace `AlertInline` en `LoginPage`. Mismo criterio
  decidido en `CM-194`, no una decisión nueva.
- **Cambiar el correo antes de verificarlo** (`updateEmail` de Firebase, o volver al formulario de
  registro): ninguna HU lo pide y el backend no tiene endpoint para ello. Quien se equivocó de
  correo se queda sin salida dentro del producto — **limitación consciente**, anotada en B-27.
- **Recuperación de contraseña** (`HU-1.4`) y **Google** (`HU-1.10`): sin cambios, siguen fuera.

### Cerrar sesión (`HU-1.8` / `CM-194`) — documentado en esta iteración, alcance acotado a `CA-1.8.1`

**Entra:**

- Nuevo control de "menú de usuario" en el navbar autenticado (`AppShell`/`NavHeader`), visible en
  toda pantalla protegida — Figma (`PRT-01.08`, nodo `228:6443`) lo describe como componente
  transversal ("usado en toda página autenticada"), no exclusivo de logout. Disparador: `Avatar` +
  indicador desplegable, en el mismo lugar que ya reserva `PRT-02.02` (nodo `191:499`,
  `user-area`). Al abrir: panel flotante (`menu-usuario`, nodo `439:1243`) con, en este orden:
  "Mi cuenta" (deshabilitado), "Planes" (deshabilitado), selector de idioma (`LanguageSwitcher`,
  nueva variante `context="menu-row"`), divisor, "Cerrar sesión" (texto literal de Figma, color
  `danger`, **con icono** `log-out` — ver desviación consciente más abajo).
- Acción "Cerrar sesión": confirmación previa (`Modal` en `md:` en adelante / `BottomSheet` nuevo
  por debajo, ambos con estilo `destructive`, fiel a Figma — nodos `41:211`/`41:248`), seguida de
  `signOut()` de Firebase, limpieza explícita del estado y redirección a `/ingresar`.
- La confirmación incluye una advertencia adicional cuando existan cambios sin guardar en
  **cualquier** formulario de la app — mecanismo nuevo y genérico (`stores/unsavedChanges.store.ts`),
  aunque hoy en la práctica el único formulario que puede estar en ese estado es "Información
  General" del Perfil Profesional (ver Arquitectura, §3).
- Corrección de una inconsistencia real de `services/firebase/auth.service.ts`: `signOut()` no
  envolvía sus errores en `AuthError` como el resto del archivo. Se corrige en esta iteración
  porque se toca el mismo archivo, no porque lo exija el backlog.
- Extensión de `design-system/organisms/Modal/` con una variante de estilo `destructive`,
  reutilizando el `Button` `variant="destructive"` que ya existe (con tokens de color correctos).
- Nuevo componente `design-system/organisms/BottomSheet/` — primer `BottomSheet` del design
  system, fiel a Figma (nodo `41:248`), construido solo con la variante `destructive` que esta
  iteración consume (mismo criterio que `Modal` con `type=confirm` en `CM-34`: no se inventa uso
  de variantes que nadie consume todavía).
- Nuevo componente `design-system/organisms/MenuUsuario/` (nombre por convención de Figma,
  `CLAUDE.md` §5) — sin dominio, recibe todo por props.
- Nuevo hook `features/auth/hooks/useLogout.ts`, simétrico a `useLogin.ts`.
- Nuevo store transversal `stores/unsavedChanges.store.ts`.
- `src/app/router/index.tsx` instancia `useLogout()` y arma los datos del menú, pasándolos a
  `AppShell` por props — mismo patrón ya usado por `progressEnabled` (necesario porque
  `boundaries/dependencies` no deja a `layouts` importar `features` ni `services`; ver
  Arquitectura y §9).

**No entra, y es deliberado:**

- **Cierre de sesión en todos los dispositivos (revocación server-side).** El propio backlog
  (`HU-1.8`, especificaciones técnicas) anticipa `POST /api/v1/auth/logout-all` vía Firebase Admin
  SDK, marcado `[Requiere Definición - TBD]` por el backlog mismo, en Sprint 3, estado `Pendiente`.
  La única `CA` publicada (`CA-1.8.1`) exige solo el cierre del dispositivo actual — esta SPEC no
  construye el resto. No se modifica `cameia-cuentas` ni `cameia-gateway`.
- "Mi cuenta" y "Planes" — visibles pero deshabilitados; `account/` y `billing/` no existen todavía
  en el repositorio (confirmado) y `ARCHITECTURE.md` las marca "NO CREAR todavía". Mismo
  tratamiento que Google/recuperación en Login.
- Variantes `settings`/`settings-sm` de `LanguageSwitcher` (Figma define 8 variantes totales del
  componente `language-switcher`; solo se construye `menu-row`, la que este menú necesita).
- Estados de interacción más allá de los que ya cubre el design system por defecto (hover/focus
  estándar de `Button`) — Figma no modela ningún estado propio para `menu-usuario` (confirmado:
  el symbol maestro no tiene variantes de estado ni de tamaño).
- Un mecanismo de "formulario sucio" con registro por-formulario o multi-formulario simultáneo —
  se construye una bandera única, documentada como limitación consciente (ver §3), no un registro
  general. Sube a algo más complejo cuando exista un segundo formulario simultáneo real
  (`CLAUDE.md` §4, regla de crecimiento).
- Cualquier cambio a `handleUnauthorized()` (`httpClient.ts`) — sigue igual, es el cierre forzado
  por `401`; el logout voluntario es un flujo nuevo y paralelo.
- Decidir si `CM-194` adelanta formalmente toda `HU-1.8` desde Sprint 3, o solo cubre `CA-1.8.1` —
  ver Bloqueo B-19.

## 3. Comportamiento esperado

### `/ingresar` — Login · `PRT-01.03`

**Qué hace**

- Presenta dos campos (`correo`, `contraseña`) y un botón primario "Ingresar".
- Al enviar, valida en cliente y, si pasa, llama a Firebase SDK
  `signInWithEmailAndPassword(auth, correo, contraseña)`.
- Si Firebase autentica: lee `userCredential.user.emailVerified`, actualiza el estado de sesión y
  redirige. Destino: la ruta protegida original (`location.state.from`, que `RequireAuth` ya
  propaga) o, si no hay, `/inicio`.
- Si Firebase rechaza: muestra el mensaje mapeado (ver §4) sin revelar cuál de los dos campos
  falló (`CA-1.3.1`, mitigación de enumeración).
- Muestra "Continuar con Google" y "¿Olvidaste tu contraseña?" deshabilitados; "Crear cuenta"
  funcional hacia `/registro`.
- Muestra el placeholder de `Logo` y el texto de marca del panel lateral tal como los define Figma.
- **Agregado por Registro (`CM-34`), no dibujado en Figma:** si `location.state.registerInfo`
  llega marcado (`useRegister.ts`, caso de borde de §3 Registro), muestra un `AlertInline`
  informativo (`variant="info"`, no `"error"`) en vez de tratarlo como fallo de este formulario —
  la cuenta ya se creó, solo falló el paso de sesión/verificación posterior.

**Estados**

| Estado      | Qué muestra |
| ----------- | ----------- |
| Carga       | Botón "Ingresar" en estado `loading` (spinner + deshabilitado), ambos campos deshabilitados. |
| Vacío       | No aplica: la pantalla no depende de una colección que pueda estar vacía. |
| Error       | (a) validación de cliente → mensaje inline bajo el campo, `aria-describedby`; (b) error de Firebase → `AlertInline` genérico, nunca el texto crudo del SDK. |
| Sin permiso | No aplica: `/ingresar` es pública. |

**Validaciones del lado del cliente**

- `correo`: obligatorio y con formato de correo válido. Llaves:
  `auth:login.errores.correoRequerido` / `correoInvalido` / `correoMuyLargo`. **CM-195 (auditoría
  20-sep-2026):** usa el mismo `emailSchema` compartido con Registro (`schemas/email.schema.ts`) —
  regex real de `EmailAddress.java` y `maxLength=254` — en vez del `.email()` de Zod que traía
  antes.
- `contraseña`: obligatorio. Sin regla de formato/longitud en Login. Llave:
  `auth:login.errores.contrasenaRequerida`.
- Mostrar/ocultar contraseña: afordancia de `PasswordField`, no una validación.

**Arquitectura y componentes**

- Ruta pública, registrada en `features/auth/routes.tsx`, fuera de `RequireAuth`.
- Layout: `layouts/AuthLayout.tsx` — reconstruido en esta iteración con panel de marca de dos
  columnas (`lg:`) que colapsa a una columna por debajo. `AuthLayoutProps` tiene `headline?: string`.
  `LoginPage` compone su propio `AuthLayout` (necesita un `headline` propio).
- Orden de construcción: `model/authErrorMessage.ts` → `schemas/login.schema.ts` →
  `organisms/LoginForm/LoginForm.tsx` (presentacional, sin `useTranslation`) →
  `pages/LoginPage.tsx` (única pieza que llama `useTranslation`/`useLogin`) →
  `hooks/useLogin.ts`.
- Componentes reutilizados: `Button`, `Input`, `PasswordField`, `FormField`, `AlertInline`
  (`variant="error"`), `Divider`. `Logo` se creó en esta iteración (`lockup`/`mark-only`,
  `default`/`inverse`).
- Mapeador de errores de Firebase: `services/firebase/auth.service.ts` ya tenía
  `FIREBASE_ERROR_CODE_MAP` + la clase `AuthError` (construidos junto con el entonces-existente
  `signUp()`, ver más abajo). `getAuthErrorMessageKey` (en `model/`) traduce esos códigos de
  CAMEIA a una llave de i18n.
- `services/firebase/firebaseApp.ts` y `auth.service.ts`: existen, con `signIn()`, `signOut()`,
  `getIdToken()`, `onAuthStateChanged()`. **`signUp()` existía pero se retira en la iteración de
  Registro** — ver más abajo y `ADR-0006`. `signOut()` se envuelve en `AuthError` en la iteración
  de Cerrar sesión (`CM-194`, ver esa subsección) — hasta entonces era la única función del
  archivo sin ese manejo.
- `stores/auth.store.ts`: tiene `emailVerified: boolean` en `AuthUser`, propagado desde
  `app/providers/AuthProvider.tsx` vía `onAuthStateChanged`.
- `useLogin` actualiza el store antes de navegar, sin esperar a `AuthProvider` (evita que
  `RequireAuth` rebote de vuelta a `/ingresar` por una condición de carrera).

**Responsive**

| Frame | Node ID |
| ----- | ------- |
| `PRT-01.03 · Login · lg` | `94:1124` |
| `PRT-01.03 · Login · sm` | `97:1272` |
| `PRT-01.03 · Login · credenciales inválidas · lg` | `96:1153` |
| `PRT-01.03 · Login · credenciales inválidas · sm` | `98:1306` |

- `lg` (1440px, dos columnas de 720px): panel de marca oscuro a la izquierda, formulario a la
  derecha. `sm` (390px, una columna): el panel de marca no existe, no se oculta con CSS — Figma
  no lo dibuja. Sin variante `md` (decisión de Frontend: por debajo de `lg:` se usa una columna).
- Estado de error: `AlertInline` (`variant="error"`) entre el título y el botón de Google, texto
  literal "Correo o contraseña incorrectos"; ambos campos pasan a borde rojo a la vez, sin mensaje
  individual — así se cumple `CA-1.3.1` sin revelar cuál campo falló. Mismo tratamiento para
  cualquier otro error de Firebase (rate limit, red).
- Diferencia consciente con el design system: `AlertInline` usa el ícono `alert-circle` (ya fijo
  para toda la app); Figma dibuja `alert-triangle` solo en esta pantalla. No se cambió el ícono
  del componente compartido por una sola pantalla (`CLAUDE.md` §16: manda el SPEC sobre diseño).

**Seguridad**

- La contraseña nunca se persiste ni se registra en logs; viaja solo a Firebase vía el SDK.
- El ID Token no se guarda manualmente; lo gestiona el SDK de Firebase y
  `authTokenInterceptor.ts`.
- El límite de intentos lo aplica Firebase; el frontend no implementa throttling propio.
- El frontend no implementa cabeceras `X-User-*` de ningún tipo (política ya acordada,
  `11092026_v1_consulta-contrato-y-alcance-perfil-profesional.md`, C-02).
- Persistencia de sesión: comportamiento por defecto de Firebase (`browserLocalPersistence`),
  decisión de frontend por defecto.

### `/registro` — Registro · `PRT-01.01`

**Qué hace**

- Presenta el formulario completo, en el orden confirmado por Figma: Google (deshabilitado),
  divisor, Nombre(s) + Apellido(s) (dos campos, lado a lado en `lg`, apilados en `sm` —
  **no** un único campo "nombre completo"), Fecha de nacimiento, Correo electrónico, Celular
  (opcional, país + número), Contraseña (con medidor de fuerza), Confirmar contraseña, Pronombres,
  botón "Registrarse".
- Al enviar, valida en cliente (zod) y, si pasa, hace `POST /api/v1/users` **sin sesión** ("Caso
  B" del diagrama, ver §5 y `ADR-0006`).
- Si el backend responde `201`: encadena, en este orden, `signIn()` (reutilizado de Login, con las
  mismas credenciales) → `sendEmailVerification()` → actualiza el estado de sesión → redirige a
  `/verificar-correo` con `location.state.registroExitoso`, que es lo que enciende el `Toast` de
  «¡Registro exitoso!» de esa pantalla (`CM-14`).
  - **Hasta `CM-14` esta viñeta decía otra cosa** («abre el `Modal` de confirmación de Plan Gratis
    → al cerrarlo, redirige a `/inicio`») y **nunca funcionó en la aplicación real**: el guard
    `RedirectIfAuthenticated` desmonta `/registro` en cuanto el store marca la sesión, así que el
    modal se cerraba solo antes de poder leerse. Defecto D-01, §9. El `Modal` sale de este flujo.
- Si el backend responde `4xx`/`409`: discrimina por `httpStatus` + `errors[].field`
  (`ADR-0007` — el `ProblemDetail` real no trae un código propio). Para correo duplicado (`409`,
  sin `errors[]`), además del mensaje en el campo, muestra el bloque de dos acciones que dibuja
  Figma.

**Estados**

| Estado      | Qué muestra |
| ----------- | ----------- |
| Carga       | Botón "Registrarse" en estado `loading`; todos los campos deshabilitados. |
| Vacío       | No aplica, mismo razonamiento que Login. |
| Error       | Tres variantes: (a) validación de cliente, mensaje bajo cada campo; (b) correo duplicado, mensaje + bloque de dos acciones; (c) fecha de nacimiento, ver Validaciones — tratamiento distinto según la causa. |
| Sin permiso | No aplica, ruta pública. |

**Validaciones del lado del cliente**

- `nombre`, `apellido`: obligatorios. **CM-195 (auditoría 20-sep-2026), replican
  `RegisterUserRequest.java`/`AccountEntity.java` reales (`cameia-cuentas`):** solo letras (con
  tildes y `ñ`/`Ñ`) y espacios — `filterToLettersAndSpaces` (`utils/textFilters.ts`) filtra a nivel
  de tecleo, el regex del schema es defensa en profundidad — y `maxLength=120` (`VARCHAR(120)` en
  BD). Ninguno de los dos límites está documentado en el backlog; se anota como divergencia
  consciente, no bloquea.
- `correo`: obligatorio, formato válido (la unicidad la valida el backend, `CA-1.1.1`).
  **CM-195:** el formato se valida contra el regex real de `EmailAddress.java` (`^[^@\s]+@[^@\s.]+
  (\.[^@\s.]+)+$`, más permisivo que el `.email()` de Zod que se usaba antes) y `maxLength=254`
  (límite de Firebase Auth, confirmado en el value object de dominio) — `features/auth/schemas/
  email.schema.ts`, compartido con Login. Tampoco documentado en el backlog; misma nota de
  divergencia consciente que nombre/apellido.
- `contraseña`: obligatoria, **replica `PasswordPolicy.java` real (confirmado 19-sep-2026,
  seguimiento de CM-34)** — entre 12 y 64 caracteres (contados por *code point*, no por unidad
  UTF-16) y fuera de una lista cerrada de 32 contraseñas comunes
  (`features/auth/model/commonPasswords.ts`, copia literal de `PasswordPolicy.COMMON_PASSWORDS`).
  Ya no es "sin regla de fuerza mínima" — eso describía la SPEC antes de tener el archivo real.
  Bajo el campo se muestra un medidor de fuerza (`design-system/molecules/PasswordStrength`,
  Figma nodo `33:251`) con una escala de 4 niveles que es **decisión de Frontend, no del backend**
  (`PasswordPolicy.java` es binario, pasa o no pasa; ver Arquitectura).
- `confirmarContraseña`: obligatoria, debe coincidir con `contraseña` — validación puramente de
  cliente, no se envía al backend.
- `pronombres`: obligatorio, uno de `HE`/`SHE`/`THEY` (ver Arquitectura).
- `celular`: opcional; cuando se escribe un número, **valida formato E.164 real** vía
  `libphonenumber-js` (`PhoneNumber.java`: `^\+[1-9][0-9]{7,14}$`, sin adivinar país — ver
  Arquitectura, diferencia consciente con Figma).
- `fechaNacimiento`: obligatoria, con cuatro causas de rechazo distintas (`CA-1.1.1`/`CA-1.1.3`).
  **Pedido explícito del usuario, 19-sep-2026:** el `<input type="date">` lleva
  `max={todayLocalIsoDate()}`, para que el propio selector nativo del navegador no deje elegir una
  fecha futura — antes solo se atrapaba al enviar el formulario, con el usuario ya habiendo elegido
  una fecha imposible.
  - **Corrección posterior (misma sesión, hallazgo real del usuario en móvil):** el `max` se
    calculaba con `new Date().toISOString().slice(0, 10)` — convierte a UTC, y Colombia es `UTC-5`
    (`CLAUDE.md` §1): de 7 p. m. a medianoche hora local, esa conversión ya devuelve la fecha de
    mañana, y el selector nativo en móvil dejaba elegirla. El mismo desfase afectaba la validación
    de "fecha futura" (`isFutureDate(birthDate)` comparaba contra `new Date()` sin normalizar:
    elegir "mañana" a esa hora no se marcaba como futuro, porque en UTC ya era "hoy"). Se agregó
    `utils/calculateAge.ts#todayLocalIsoDate()` (getters locales, no `toISOString()`) y ambos puntos
    —el `max` del input y la comparación de `.superRefine`— lo usan como referencia de "hoy".
  - **Tercera corrección, mismo pedido aplicado al otro extremo (pedido explícito del usuario):**
    igual que no tiene sentido elegir una fecha futura, tampoco tiene sentido dejar elegir desde el
    calendario una fecha que ya implica más de 110 años. El `<input>` gana
    `min={oldestPlausibleBirthDateIsoDate()}` — el mismo límite que ya valida `isImplausiblyOld`,
    expresado como fecha de calendario: un día después de "hace 111 años" (esa fecha exacta cumple
    110, todavía plausible), no "hace 110 años" tal cual.
  - **Menor de 18 años (UTC):** usa `isAdult()` de `utils/calculateAge.ts` (ya la cubre). Mensaje
    "Debes ser mayor de edad" — **mismo texto que el helper permanente del campo**; Figma (nodo
    `73:535`) confirma que aquí el error solo cambia el color del borde, no el texto. Llave:
    `auth:registro.campos.fechaNacimiento.helper` (reutilizada también como mensaje de error).
  - **Fecha futura:** `calculateAge.ts` **no la cubre hoy** — se agrega la guarda
    `birthDate > referenceDate`, con `referenceDate` anclada a `todayLocalIsoDate()` (ver
    corrección arriba), no al instante real de `new Date()`. Mensaje "Fecha de nacimiento
    inválida", en `ErrorText` normal (Figma no dibuja este caso; se sigue el patrón estándar del
    design system). Llave: `auth:registro.errores.fechaNacimientoFutura`.
  - **>110 años:** tampoco cubierto hoy — se agrega un tope superior a `calculateAge.ts`. El
    backlog no da el texto literal, solo la intención ("mensaje específico... implausible...
    verificada"). **Texto propuesto, no confirmado, sujeto a aprobación:** "Verifica tu fecha de
    nacimiento". Llave: `auth:registro.errores.fechaNacimientoImplausible`.
  - **Formato inválido / vacío:** mensaje "Formato de fecha inválido" (no dibujado en Figma,
    patrón estándar). Llave: `auth:registro.errores.fechaNacimientoInvalida`.
  - **Rechazada por el backend (`InvalidBirthDateException`, confirmado en
    `AgePolicy.java`/`RegisterUserService.register()`):** no es una quinta causa nueva — es la
    misma causa de "menor de edad" (o una política de edad del backend más estricta que la del
    cliente), solo que el rechazo llega en la respuesta `4xx` del `POST` en vez de la validación de
    cliente. Mismo tratamiento visual, mismo texto ("Debes ser mayor de edad"), mismo nodo Figma
    (`73:449`/`75:1021`). Se detecta por `httpStatus === 422 && errors[].field === 'birthDate'`
    (`ADR-0007`) — no hay código propio. `AgePolicy.java` (real, confirmado 19-sep-2026) usa el
    mismo orden y los mismos umbrales que ya implementa `utils/calculateAge.ts` (futura → `>110`
    estricto → `<18` estricto), así que este camino del backend es inalcanzable en operación
    normal: el cliente ya replica la política exacta. Solo queda como defensa en profundidad, y
    como el backend no distingue las 3 causas por separado en el cuerpo (`BusinessExceptionHandler`
    solo copia `error.getMessage()`, no el `Reason` enum), cualquier `422` de `birthDate` que sí
    llegue muestra el mismo texto de "menor de edad" sin importar cuál de las tres fue.

**Arquitectura y componentes**

- Ruta pública, registrada en `features/auth/routes.tsx`, junto a `/ingresar`.
- `RegisterPage.tsx` deja de ser el placeholder de `EmptyState`. Compone su propio `AuthLayout`
  con `headline="Entra a la entrevista listo"` (mismo copy que ya usa Login) + `RegisterForm` —
  igual patrón que `LoginPage`, ya no envuelto directamente en `routes.tsx` sin `headline`.
- **Primera capa `api/` de la feature** (no existía; Login nunca la necesitó):
  - `features/auth/api/register.dto.ts` — **`// PROVISIONAL — pendiente de OpenAPI de
    cameia-cuentas (CM-35)`**. Nombres de campo confirmados contra el código real de
    `cameia-cuentas` (`RegisterUserRequest.java`, revisado 19-sep-2026): `firstName`, `lastName`,
    `birthDate` (formato **`dd/MM/yyyy`**, no ISO — el backend lo declara con
    `@JsonFormat(pattern = "dd/MM/yyyy")`), `email`, `password`, `pronoun` (singular, no
    `pronouns`), `phoneNumber` (no `phone`). **No se envía `confirmarContraseña`** — es validación
    exclusivamente de cliente. `pronoun` y `phoneNumber` son opcionales del lado del backend (sin
    `@NotNull`); `pronoun` se mantiene obligatorio solo como regla de **cliente** (ver Validaciones).
    Sigue marcado `// PROVISIONAL` en su conjunto porque `CM-35` no ha publicado el contrato
    definitivo, aunque estos nombres ya se verificaron contra el DTO real.
  - `features/auth/api/register.mapper.ts` — el cortafuegos (`ADR-0003`): si el backend publica
    nombres distintos, solo este archivo cambia. Incluye la conversión de la fecha del `<input
    type="date">` (ISO) a `dd/MM/yyyy`.
  - `features/auth/api/register.api.ts` — hace el `POST` **sin token**. Confirmado en Fase 0:
    `services/http/httpClient.ts` ya soporta una petición no autenticada (`request()` solo agrega
    `Authorization` si `getIdToken()` devuelve algo) — no hace falta `fetch` directo.
  - `mocks/handlers/auth.handlers.ts` — ya existe (vacío, solo exportaba `MOCK_USER_ID`); gana su
    primer handler real (`POST /api/v1/users`), no un archivo nuevo.
- `services/firebase/auth.service.ts`:
  - **Se retira `signUp()`** y las entradas de `FIREBASE_ERROR_CODE_MAP` exclusivas de creación
    de cuenta (`auth/email-already-in-use`, `auth/weak-password`, etc. — ya no las puede devolver
    un cliente que nunca llama a `createUserWithEmailAndPassword`). `ADR-0006`. **Cambio grande:
    confirmar antes de ejecutarlo** (ver el prompt, Fase 3).
  - Se agrega `sendEmailVerification()`, nueva, mismo patrón que las funciones existentes.
  - `signIn()` se reutiliza tal cual — no se duplica lógica de autenticación.
- `utils/calculateAge.ts`: se extiende con las dos guardas que hoy no tiene. Verificar primero si
  algo más en el repo ya lo consume, para no romper otro llamador al extenderlo.
- `RegisterForm` sigue el patrón de `GeneralInfoForm` (`Controller` de react-hook-form nunca
  `register()`, porque `Input` no expone `ref`; toda copia entra por props; el error se resuelve
  con `fieldState.error?.type`, nunca el mensaje de zod; sin `useTranslation` dentro del
  organismo).
- Control de fecha de nacimiento: `Input` nativo `type="date"` — el mismo componente que ya usa
  `EducationSection` para las fechas de Educación, no un date-picker nuevo ni tres `<select>`.
- Control de pronombres: átomo `Select` (mismo que "Nivel educativo" de Educación), **no**
  `Radio` ni `Combobox` — confirmado por Figma. Catálogo de códigos, **resuelto 19-sep-2026**: el
  enum real del backend (`tech.cameia.cuentas.domain.model.Pronoun`) es exactamente
  `HE`/`SHE`/`THEY`, coincidiendo con la propuesta que ya tenía esta SPEC — etiquetas `es-CO`:
  "Él", "Ella", "Elle"; etiquetas `en` (sin recursos todavía, `CLAUDE.md` §7): "He/him", "She/her",
  "They/their". No se marca `// PROVISIONAL` en el código que consume este catálogo: es el enum
  real, no una propuesta de UI. **Discrepancia de nombre:** la documentación interna del componente
  en Figma lo llama "selector de género"; la etiqueta visible y el backlog dicen "pronombres" — se
  sigue el nombre del backlog para el dominio, se anota para que quien mantenga el design system
  corrija la documentación del componente, no al revés.
- **Componente nuevo:** `design-system/organisms/Modal/` — primer `Modal` de la app. Construido
  con la especificación exacta que documenta Figma (nodo `41:211`/`41:181`, variante
  `type=confirm`): ancho 480 fijo centrado, `radius/lg`, `padding space-5`, `elevation/3`, velo
  `neutral-900` 45%, botones alineados a la derecha (primario al final), cierra con Esc y clic en
  el velo. **El copy de "Plan Gratis" no está dibujado en ningún frame conectado a Registro** — se
  usa el texto mínimo que exige el backlog, marcado pendiente de aprobación de Producto/Diseño
  (Bloqueo B-08). **Gana una variante de estilo `destructive` en la iteración de Cerrar sesión
  (`CM-194`)** — ver esa subsección.
- **Componente nuevo, diferencia consciente con Figma (`CLAUDE.md` §16), aprobada explícitamente
  por el usuario el 19-sep-2026:** `features/auth/organisms/PhoneField/` reemplaza el campo de
  texto libre que dibuja Figma (nodo `73:449`, helper "Formato internacional, por ejemplo +57 300
  000 0000") por un selector de país + el número nacional (`Input`). Por defecto Colombia (`CO`,
  +57), único mercado del producto (`CLAUDE.md` §1); el selector permite cambiarlo a cualquiera de
  los ~245 países que conoce `libphonenumber-js`. Sin bandera: el design system no tiene assets de
  bandera todavía. Vive en la feature, no en `design-system/`: primer y único consumidor
  (`CLAUDE.md` §4).
  - **Corrección posterior (misma sesión, captura de pantalla del usuario):** el selector de país
    era un `Select` nativo con el nombre completo ("Colombia (+57)") en una columna de ancho fijo
    angosto — se truncaba ("Colombia (+5…"), y peor con nombres largos ("Trinidad y Tobago"). El
    placeholder del número nacional repetía además el indicativo (`"+57 300 000 0000"`),
    contradictorio con el selector de al lado, que ya lo mostraba. Se reemplazó por
    `features/auth/organisms/PhoneField/CountryCodeSelect.tsx` (archivo interno, no exportado):
    disparador compacto `{ISO} +{indicativo}` (p. ej. "CO +57", nunca se trunca — el ISO
    desambigua indicativos compartidos por varios países, como `+1`) que abre un panel con
    buscador y el nombre completo, vía `Intl.DisplayNames`. El placeholder del número nacional pasó
    a `"300 000 0000"`, sin el indicativo. **Este patrón de disparador+panel flotante con cierre
    por blur/Escape/retorno de foco es la base que se generaliza a `design-system/organisms/
    MenuUsuario/` en la iteración de Cerrar sesión (`CM-194`)** — primera vez que sube a
    `design-system/`, porque gana un segundo consumidor (`CLAUDE.md` §4).
  - **Segunda corrección de copy (misma sesión):** el helper decía "Formato internacional, por
    ejemplo +57 300 000 0000" — el texto completo se partía en dos líneas en móvil, donde la
    columna del formulario es angosta. El usuario acortó a "Formato internacional, ej. +57 300 000
    0000" — **diferencia consciente adicional con el copy literal de Figma** (`CLAUDE.md` §16), por
    la misma razón de ancho, no un cambio de contenido.
- **Nueva dependencia, aprobada explícitamente:** `libphonenumber-js@1.13.13` (`CLAUDE.md` §2) —
  única forma confiable de validar/formatear indicativos internacionales.
- `design-system/molecules/PasswordStrength/` **reescrito** (existía desde antes, sin ningún
  consumidor, con una escala de 4 niveles inventada que no coincidía con Figma): el contrato real
  del nodo `33:251` es `empty | weak | fair | good | strong` — `empty` sin relleno ni etiqueta;
  `strong` usa el token `--success-text` (`--green-700`), ya existía en `semantic.css` sin
  consumidor, no se agregó un token nuevo. `utils/passwordStrength.ts` calcula el nivel (longitud +
  variedad de clases de caracteres) — decisión de Frontend, no replica `PasswordPolicy.java`
  (binario), así que **no** se marca `// PROVISIONAL`.
- **`design-system/atoms/Input`, `atoms/Select`, `molecules/PasswordField` ganan `forwardRef`**
  (antes documentaban a propósito que no exponían `ref` — comentario retirado): sin esto,
  `react-hook-form` no podía enfocar el primer campo con error al enviar (`shouldFocusError`,
  activado por defecto, silenciosamente no hacía nada). Cambio aditivo, sin consumidor roto;
  `RegisterForm` es el primero en pasar `ref={field.ref}` en cada `Controller`. El resto de
  formularios de la app queda beneficiado para cuando se retoquen, no se retrofita todo en esta
  iteración.
- **`services/http/ApiError.ts`/`errorMap.ts` reescritos contra el contrato real** (`ADR-0007`,
  seguimiento de este mismo CM-34): el `ProblemDetail` (RFC 7807) real de `BusinessExceptionHandler
  .java` no tiene `code` propio — el error de Registro se lee por `httpStatus` + `errors[].field`,
  ver §4.

**Responsive**

| Frame | Node ID |
| ----- | ------- |
| `PRT-01.01 · Registro · lg` | `70:170` |
| `PRT-01.01 · Registro · sm` | `75:410` |
| `PRT-01.01 · Registro · error correo duplicado · lg` | `73:348` |
| `PRT-01.01 · Registro · error correo duplicado · sm` | `75:916` |
| `PRT-01.01 · Registro · error menor de edad · lg` | `73:449` |
| `PRT-01.01 · Registro · error menor de edad · sm` | `75:1021` |

Mismo patrón que Login: `lg` dos columnas (720px), `sm` una columna sin panel de marca, sin
variante `md`. En `lg`, Nombre(s)/Apellido(s) van lado a lado; en `sm` se apilan.

**Seguridad**

- **Diferencia real con Login:** la contraseña **sí viaja una vez** al backend, en el cuerpo de
  `POST /api/v1/users` — es indispensable para que `cameia-cuentas` llame a `createUser` del
  Admin SDK. Viaja solo por HTTPS, nunca se registra en logs/telemetría del cliente. **Pregunta
  abierta a Backend/Arquitectura** (no la resuelve el frontend): confirmar que no se persiste en
  ningún punto intermedio — la regla ya documentada ("CAMEIA no almacena contraseñas") se lee
  hasta ahora como "no la persiste", no como "no la recibe nunca en tránsito".
- El resto de reglas de seguridad de la feature (sin cabeceras `X-User-*` del cliente, nada de
  `localStorage` para datos sensibles, un solo tema) aplica igual que en Login.

### `/verificar-correo` — Verificación de correo · `PRT-01.02`

**Qué hace**

- Es la única pantalla autenticada que vive **fuera** de `RequireVerifiedEmail`: exige sesión
  (`RequireAuth`) pero no exige el correo verificado — es justamente de donde se sale de ese
  estado, igual que el Gateway debe exceptuar esta ruta de su propia regla
  (`CONTRATO-GATEWAY-CM-14` §1, punto 1). Si alguien llega con el correo ya verificado, redirige a
  `/inicio` sin mostrar nada.
- Compone `AuthLayout` con el mismo `headline` de Login y Registro (`ingreso.marca.titular`,
  «Entra a la entrevista listo») — el prototipo dibuja exactamente ese panel de marca.
- Muestra, de arriba abajo: `Toast` `variant="success"` con cierre, titular «Verifica tu correo»,
  la frase «Hemos enviado un enlace de verificación a **{correo}**» con el correo destacado, la
  ilustración del sobre, la instrucción «Revisa tu bandeja de entrada y haz clic en el enlace para
  verificar tu correo.», el botón primario «Abrir correo» y el enlace «Reenviar enlace».
- **El correo sale de `useAuthStore` (`user.email`)**, no de `location.state`: a esta pantalla
  también se llega desde Login, donde no hay estado de navegación que traiga nada.
- **El `Toast` solo aparece cuando `location.state.registroExitoso` es `true`.** Quien llega
  redirigido por el guard tras iniciar sesión con una cuenta sin verificar ve la misma pantalla sin
  el `Toast`: no acaba de registrarse, no hay nada que anunciar.
- Mientras está montada y la pestaña visible, llama `reloadCurrentUser()` cada 5 s, más una vez al
  montar y cada vez que la pestaña vuelve a estar visible (`visibilitychange`). Con la pestaña
  oculta **no** sondea: nadie está mirando y el temporizador solo gastaría batería y cuota.
- Cuando detecta `emailVerified === true`: fuerza el refresco del ID Token
  (`getIdToken(user, true)`), llama `activateAccount()`, actualiza el store con
  `emailVerified: true` y redirige a `/inicio`.
  - **Por qué el refresco forzado, porque no es evidente:** `user.reload()` actualiza el objeto
    `User` del SDK, pero **no** el ID Token que ya está en caché. Ese token sigue diciendo
    `email_verified: false` hasta que expira (una hora) o se pide con `forceRefresh`. Sin el
    refresco, la activación responde `403` de forma sistemática y la persona queda atrapada en
    esta pantalla con el correo ya verificado.
  - Si aun así llega un `403`, se reintenta **una vez** con otro refresco forzado antes de mostrar
    el error: el claim puede tardar en propagarse, y un reintento silencioso es más honesto que
    pedirle a la persona que pulse un botón por un detalle interno de Firebase.

**Estados**

| Estado      | Qué muestra |
| ----------- | ----------- |
| Carga       | Tres momentos distintos: (a) el sondeo es de fondo y **no** muestra nada — ni spinner de página ni pantalla en blanco: la pantalla se ve completa desde el primer render; (b) al reenviar, «Reenviar enlace» pasa a `loading` con su `loadingLabel`; (c) al detectar la verificación, el bloque de acciones se reemplaza por `Spinner` + «Activando tu cuenta…» mientras corre el `POST` — único momento en que no hay nada que tocar. |
| Vacío       | No aplica: la pantalla no lista datos. El único dato que muestra —el correo— siempre existe, porque sin sesión `RequireAuth` no deja llegar hasta aquí. |
| Error       | Cuatro variantes, todas en `AlertInline` sobre el bloque de acciones; ninguna cierra la sesión ni detiene el sondeo: (a) reenvío estrangulado por Firebase (`auth/too-many-requests`) → `variant="warning"`, mensaje propio que pide esperar; (b) cualquier otro fallo de reenvío → `variant="error"` con `errors:generico`; (c) activación rechazada con `403` tras el reintento → `variant="error"` con acción «Reintentar»; (d) red (`httpStatus: 0`) o cualquier otro código en la activación → `errors:red` / `errors:generico`, misma acción «Reintentar». |
| Sin permiso | No aplica en el sentido habitual: no hay rol ni plan de por medio. El caso análogo —llegar sin sesión— lo resuelve `RequireAuth` antes de montar esta pantalla, y el inverso —llegar con el correo ya verificado— se resuelve redirigiendo a `/inicio`, no mostrando un bloqueo. |

**Validaciones del lado del cliente**

No hay formulario: esta pantalla no valida ningún campo. La única regla de cliente es la **espera
de 60 s entre reenvíos**, que no es validación de un dato sino un freno para no chocar contra el
estrangulamiento de Firebase. El botón muestra la cuenta regresiva en su propia etiqueta
(«Reenviar enlace (45 s)») y vuelve solo a su estado normal; el temporizador vive en el estado del
componente y no se persiste — si la persona recarga la página puede reenviar de inmediato, y si
Firebase la frena, cae en el error (a) con su propio mensaje.

**Arquitectura y componentes**

- Ruta nueva `ROUTES.verificarCorreo = '/verificar-correo'` en `app/router/routes.ts`, registrada
  en `features/auth/routes.tsx` como un `RouteObject[]` aparte de `authRoutes`
  (`verificarCorreoRoutes`), porque **no** va detrás de `RedirectIfAuthenticated` como las otras
  dos rutas de la feature, sino detrás de `RequireAuth`. `features/auth/index.ts` exporta ambos.
- Árbol de rutas resultante en `app/router/index.tsx`:

  ```
  RedirectIfAuthenticated → landing, /registro, /ingresar
  RequireAuth
  ├── /verificar-correo                        ← sin RequireVerifiedEmail, a propósito
  └── RequireVerifiedEmail
      ├── AuthenticatedAppShell → /inicio, perfiles
      ├── interviewSetupRoutes
      └── interviewSessionRoutes
  ```

- `app/router/guards/RequireAuth.tsx` gana `RequireVerifiedEmail` (mismo archivo, misma forma de
  layout-route con `<Outlet/>`; su TSDoc ya declara que ahí viven los guards de sesión). Lee
  `emailVerified` de `useAuthStore` y redirige a `ROUTES.verificarCorreo` con `replace`. Respeta
  `isLoading` igual que `RequireAuth`, para no rebotar antes de saber si hay sesión.
- `RedirectIfAuthenticated` cambia de destino: `/verificar-correo` cuando la sesión tiene el correo
  sin verificar, `/inicio` en el resto de casos.
- `features/auth/pages/VerifyEmailPage.tsx` — única pieza que llama `useTranslation`; el organismo
  es presentacional, como `LoginForm`/`RegisterForm`.
- `features/auth/organisms/VerifyEmailPanel/` — el contenido de la pantalla (titular, correo,
  ilustración, instrucción, acciones), sin dominio ni i18n propios: toda la copia entra por props,
  el mismo criterio que esta feature ya aplica a sus otros organismos.
- `features/auth/hooks/useEmailVerification.ts` — el orquestador: sondeo, refresco forzado del
  token, activación, reenvío con su cuenta regresiva y los estados de error. Devuelve datos y
  funciones, nunca JSX.
- `features/auth/api/verification.api.ts` — `activateAccount(): Promise<void>`, un `POST` de cuerpo
  vacío. **Sin `verification.dto.ts` ni `verification.mapper.ts`**: no se consume ningún campo de
  la respuesta y `CLAUDE.md` §4 prohíbe crear archivos vacíos por simetría. Si el backend publica
  un cuerpo que la UI necesite (B-23), entran entonces, y el mapper vuelve a ser el cortafuegos
  (`ADR-0003`).
- `services/firebase/auth.service.ts` gana dos funciones, con la misma envoltura en `AuthError` que
  las existentes:
  - `reloadCurrentUser(): Promise<User | null>` — `user.reload()` y devuelve `auth.currentUser`.
  - `refreshIdToken(): Promise<string | null>` — `getIdToken(user, true)`. No hace falta tocar
    `httpClient`: una vez refrescado, ese token nuevo es el que el SDK entrega en la siguiente
    llamada a `getIdToken()`.
- `features/auth/model/webmailProviders.ts` — mapa dominio → URL del webmail para «Abrir correo»
  (Gmail, Outlook/Hotmail/Live, Yahoo, iCloud, Proton). **Si el dominio no está en el mapa, el
  botón no se renderiza**: no hay destino honesto al que mandar a la persona, y la instrucción de
  arriba ya dice qué hacer. Decisión de Frontend, anotada en B-27.
- `design-system/icons/registry.tsx` gana `mail` (Lucide `Mail`), que hoy no existe en el registro.
  La ilustración del prototipo —sobre con una insignia de enlace— se arma con ese ícono a gran
  tamaño sobre un círculo de fondo con tokens, **provisional hasta que Diseño entregue el SVG
  real** (B-26). Nadie importa de `lucide-react` fuera del registro (`CLAUDE.md` §3.3).
- `design-system/molecules/Toast/` ya existe y **gana aquí su primer consumidor real**: se posiciona
  desde la página, sin store ni host global.
- `useRegister.ts` deja de manejar `isSuccessModalOpen`/`closeSuccessModal` y redirige a
  `/verificar-correo`; `RegisterPage.tsx` deja de montar el `Modal`. Las llaves
  `auth:registro.modal.*` se retiran y su mensaje pasa a `auth:verificacion.planGratis`
  (`CLAUDE.md` §13: no se deja código ni copia muerta). `Modal` conserva consumidor — `AppShell`
  lo usa para confirmar el cierre de sesión (`CM-194`) —, así que no queda huérfano.
- `useLogin.ts` gana la activación de rezagados descrita en §2: tras `signIn()`, si
  `user.emailVerified` es `true`, dispara `activateAccount()` sin bloquear la navegación y **traga
  el error** — un fallo ahí no puede impedir entrar a una cuenta que ya está verificada.
- `mocks/handlers/auth.handlers.ts` gana el handler de `POST /api/v1/users/me/verification`
  (`204`), y la forma de simular el `403` para poder probar el camino de error.
- **Primer uso de `<Trans>` de `react-i18next` en la aplicación**, para «Hemos enviado un enlace de
  verificación a **{{correo}}**» sin partir la frase en dos llaves: el correo va destacado en medio
  de la oración, y concatenar fragmentos traducidos rompe cualquier idioma con otro orden de
  palabras. Se anota por ser un patrón nuevo, no por ser excepcional.

**i18n · llaves nuevas (`auth.json`, `es-CO` y `en`)**

| Llave | `es-CO` |
| ----- | ------- |
| `verificacion.toastRegistro` | ¡Registro exitoso! Hemos enviado un enlace de verificación a tu correo electrónico. |
| `verificacion.toastCerrar` | Cerrar |
| `verificacion.titulo` | Verifica tu correo |
| `verificacion.enviadoA` | Hemos enviado un enlace de verificación a `<destacado>{{correo}}</destacado>` |
| `verificacion.instruccion` | Revisa tu bandeja de entrada y haz clic en el enlace para verificar tu correo. |
| `verificacion.abrirCorreo` | Abrir correo |
| `verificacion.reenviar` | Reenviar enlace |
| `verificacion.reenviarEspera` | Reenviar enlace ({{segundos}} s) |
| `verificacion.reenviando` | Reenviando… |
| `verificacion.reenviado` | Te enviamos un enlace nuevo. |
| `verificacion.activando` | Activando tu cuenta… |
| `verificacion.reintentar` | Reintentar |
| `verificacion.planGratis` | Tu cuenta quedó con el Plan Gratis de CAMEIA. |
| `verificacion.errores.demasiadosIntentos` | Enviamos varios enlaces seguidos. Espera unos minutos antes de pedir otro. |
| `verificacion.errores.noConfirmada` | Todavía no pudimos confirmar tu verificación. Si ya hiciste clic en el enlace, inténtalo de nuevo. |

Ninguna llave nueva en `errors.json`: la activación no trae códigos propios (`ADR-0007`) y los
casos genéricos reutilizan `errors:generico` / `errors:red`.

**Responsive**

No hay frames de Figma para esta pantalla (B-26). Se reutiliza el comportamiento ya construido de
`AuthLayout`: dos columnas a partir de `lg:` (panel de marca + contenido) y una sola columna por
debajo, con el logo centrado arriba. El prototipo entregado corresponde al caso `lg`. El `Toast`
flota arriba a la derecha de la columna de contenido en `lg:` y ocupa el ancho disponible con
margen lateral por debajo — decisión de Frontend, el prototipo solo muestra el caso ancho.

**Accesibilidad**

- El `Toast` ya emite `role="status"` en su variante `success` (componente existente), así que el
  anuncio del registro exitoso llega solo a un lector de pantalla.
- El cambio de estado «detectado → activando → listo» se anuncia con una región
  `aria-live="polite"` que contiene el texto «Activando tu cuenta…»; sin ella, el sondeo cambia la
  pantalla sin que un lector de pantalla se entere.
- «Abrir correo» abre en pestaña nueva (`target="_blank"`, `rel="noopener noreferrer"`) y lo dice
  en su nombre accesible; «Reenviar enlace» queda `disabled` durante la espera, con la cuenta
  regresiva en el propio texto —no solo en un atributo— para que no dependa de ver un color.
- Áreas táctiles de 44×44 y anillo de foco: los heredan `Button` y `Toast`, sin nada especial aquí.
- `prefers-reduced-motion` no aplica: la pantalla no anima nada. El `Spinner` ya lo respeta.

**Seguridad**

- **El navegador nunca decide la verificación.** `emailVerified` del cliente solo elige qué
  pantalla mostrar; el estado real lo decide `cameia-cuentas` leyendo el claim del ID Token (su
  spec, §5). Por eso el guard es una comodidad de UX, no un control de seguridad: si alguien lo
  saltara, cada endpoint protegido sigue exigiendo su token.
- El `oobCode` del enlace de verificación nunca pasa por este cliente: lo consume la página alojada
  de Firebase. Aquí no se guarda, ni se registra, ni se lee de la URL.
- Nada nuevo en `localStorage`/`sessionStorage` (`CLAUDE.md` §3.9): el temporizador de reenvío vive
  en memoria y se pierde al recargar, a propósito.

### Menú de usuario y Cerrar sesión · `PRT-01.08` — toda pantalla autenticada

**Qué hace**

- El `NavHeader` gana una zona de usuario a la derecha (`Avatar` + indicador desplegable, mismo
  lugar que ya reserva Figma en `PRT-02.02`, nodo `191:499`/`user-area`). Al hacer clic, o
  `Enter`/`Space` con foco, abre `MenuUsuario`: panel flotante, ancho 240px, `elevation/2`, con
  los ítems descritos en §2.
- Al hacer clic en "Cerrar sesión" (o activarlo por teclado): primero se consulta
  `stores/unsavedChanges.store.ts`. Se abre la confirmación (`Modal` en `md:` en adelante /
  `BottomSheet` por debajo, `useMediaQuery` ya existente para decidir cuál), variante
  `destructive`, con dos textos posibles según haya o no cambios sin guardar (ver Notas — ninguno
  de los dos textos viene definido por backlog ni Figma, son **propuestos**, Bloqueo B-16).
- Si el usuario confirma: `useLogout()` ejecuta, en este orden: `signOut()` (ahora envuelto en
  `AuthError`) → `useAuthStore.getState().clear()` (explícito, sin esperar al listener asíncrono
  de `AuthProvider` — mismo criterio de determinismo que ya usa `useLogin.ts` en sentido inverso)
  → `navigate(ROUTES.ingresar, { replace: true })`.
- Si `signOut()` lanza: se limpia igual el estado local y se navega igual a `/ingresar` — el
  cierre de sesión es, por alcance, local (ver Seguridad); no tiene sentido dejar a alguien
  atrapado en una pantalla autenticada porque la llamada remota a Firebase falló. Se muestra
  `errors:generico` en un `Toast` (no hay código `AUTH_*` específico para este caso).
- Si el usuario cancela la confirmación: el panel se cierra y no ocurre nada más.
- No hay feedback adicional tras un cierre de sesión exitoso, más allá de llegar a `/ingresar` —
  **decisión de Frontend**: la propia pantalla de Login ya comunica el cambio de estado.

**Estados**

| Estado      | Qué muestra |
| ----------- | ----------- |
| Carga       | El botón primario de la confirmación pasa a `loading` (`Button` `loading`/`loadingLabel`) mientras `signOut()` está en curso. |
| Vacío       | No aplica. |
| Error       | `signOut()` falla: `Toast` con `errors:generico`; el cierre local ocurre de todas formas. |
| Sin permiso | No aplica: el control solo existe dentro de `RequireAuth`. |

**Reglas de negocio** (no hay formulario propio, por eso no hay tabla de validaciones)

- El control de logout solo se renderiza detrás de `RequireAuth` — nunca en `/`, `/ingresar` ni
  `/registro`.
- `stores/unsavedChanges.store.ts` expone un booleano único, no un registro por formulario —
  asume que solo un formulario "sucio" puede estar montado a la vez, cierto hoy porque la app no
  permite dos pantallas de edición simultáneas. Documentado como limitación consciente.

**Arquitectura y componentes**

- `design-system/organisms/MenuUsuario/MenuUsuario.tsx` — nuevo, sin dominio: recibe `items` ya
  resueltos (`label`/`onClick`/`disabled`/`variant`, ya traducidos) y no importa `i18next`
  (`CLAUDE.md` §14.7, mismo patrón que `NavHeader`). Contiene el disparador (`Avatar` +
  `chevron-down`) y el panel, con cierre por clic-fuera/`Escape`/pérdida de foco y retorno del foco
  al disparador — generalización a `design-system/` del patrón ya probado en
  `features/auth/organisms/PhoneField/CountryCodeSelect.tsx` (primer componente subido con este
  patrón, `CLAUDE.md` §4: sube cuando gana un segundo consumidor).
- `design-system/organisms/LanguageSwitcher/LanguageSwitcher.tsx` — gana la variante
  `context="menu-row"` (además de `public-header`/`settings` ya existentes), con su propia rama de
  renderizado: fila `icon/globe` + etiqueta ("Idioma") + valor + un ícono de intercambio (`swap`,
  `icons/registry.tsx`). **Dos desviaciones conscientes de lo que dibuja Figma (nodo `49:421`,
  variante `menu-row`: etiqueta "Idioma de la app" + `icon/chevron-right`), pedidas explícitamente
  por el usuario el 20-sep-2026 al revisar la UI/UX real, no un hallazgo de Figma ni un CA del
  backlog** — ver Bloqueo B-21 y la nota de §9 con el detalle completo. `settings`/`settings-sm`
  siguen declaradas en el tipo pero sin rama (`CLAUDE.md` §4, se agregan con su propio consumidor
  real).
- `design-system/organisms/Modal/Modal.tsx` — gana una prop de estilo (ej. `variant?: 'primary' |
  'destructive'`, default `'primary'` para no romper el consumidor actual, `RegisterPage`) que
  decide si la acción primaria usa `Button` `variant="primary"` o `variant="destructive"` (ya
  existente, con tokens `--danger-base`/`--danger-hover` correctos) — no se crea ningún color ni
  variante de `Button` nueva.
- `design-system/organisms/BottomSheet/BottomSheet.tsx` — nuevo, primer `BottomSheet` del design
  system. Misma prop `variant` que `Modal`, por consistencia entre ambos, aunque solo
  `destructive` tenga consumidor real hoy. Fiel a Figma (nodo `41:248`, 390×700, variante
  `destructive`): título, contenido, acción primaria (`destructive`) y secundaria, cierra con
  gesto/clic en el velo, mismo criterio de accesibilidad que `Modal` (foco atrapado, `Escape`,
  retorno de foco al disparador).
- `services/firebase/auth.service.ts:signOut()` — se envuelve en `try/catch` + `toAuthError()`,
  igual que `signIn()`. Corrige una inconsistencia real del archivo, no introducida por esta
  iteración.
- `stores/unsavedChanges.store.ts` — nuevo, store de cliente transversal (`CLAUDE.md` §3.6 ya
  anticipa "borradores de wizard" como caso válido de Zustand). Forma:
  `{ hasUnsavedChanges: boolean, setUnsavedChanges: (value: boolean) => void }`. Cualquier feature
  puede importarlo (`stores` está permitido desde `features` en `boundaries/dependencies`).
- `features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.tsx` — se conecta a
  `unsavedChanges.store.ts` con un `useEffect` que sincroniza `formState.isDirty` (ya provisto por
  `react-hook-form`, hoy no leído por el componente) con `setUnsavedChanges`. Es el único cambio a
  esta feature; no se toca su lógica de guardado ni la de Educación/Experiencia/Habilidades/Roles
  Objetivo (que persisten al vuelo, sin borrador — decisión `D-C` ya documentada, sin ventana de
  "sin guardar" que señalar).
- `features/auth/hooks/useLogout.ts` — nuevo, simétrico a `useLogin.ts`: expone `logout()` (con
  el flujo completo descrito arriba) y el estado de `loading`/`error`.
- `src/app/router/index.tsx` — capa `app`, sin restricciones de `boundaries`: instancia
  `useLogout()`, arma los `items` de `MenuUsuario` (incluidos los deshabilitados de "Mi
  cuenta"/"Planes" y el callback de idioma) y los pasa a `<AppShell>` por props — mismo patrón
  exacto que ya usa `progressEnabled` hoy.
- `src/layouts/AppShell.tsx` — recibe los nuevos props y los reenvía a `NavHeader`/`MenuUsuario`;
  sigue sin importar nada de `features/` ni `services/` directamente (`boundaries/dependencies` no
  lo permite — confirmado contra `eslint.config.js` real, el único carve-out existente,
  `app-routes`, es de un solo archivo hoja y no aplica aquí). Se retira el comentario actual del
  archivo que documenta la ausencia de este control.
- `src/design-system/icons/registry.tsx` — el icono `log-out` (`LogOut` de Lucide) ya estaba
  registrado sin consumidor; gana su primer uso real en esta iteración. **Desviación consciente de
  Figma** (el nodo `439:1241`, ítem "Cerrar sesión", no dibuja icono) — documentada igual que la
  diferencia de ícono en el `AlertInline` de Login (`CLAUDE.md` §16).

**Responsive**

| Frame | Node ID |
| ----- | ------- |
| `PRT-01.08 · Menú de usuario · lg` (menú superpuesto sobre el frame de Inicio) | `228:6443` |
| `menu-usuario` (componente maestro, sin variantes de estado ni tamaño) | `439:1243` |
| `nav-header` (navbar, 8 variantes `variant×active`, todas 1280px — sin variante `sm`) | `191:537` |
| `bottom-sheet` (`type=confirm\|destructive\|upgrade`, 390×700) | `41:248` |
| `modal` (`type=confirm\|destructive\|upgrade`, 1000×600) | `41:211` |

- No existe una variante `sm`/móvil de `menu-usuario` en Figma (confirmado con dos búsquedas
  independientes sobre la página "02 · Componentes" del archivo). El `NavHeader` de código ya está
  oculto en móvil (`hidden md:flex`, reemplazado por `TabBar`) — **decisión de Frontend**: el menú
  de usuario se reubica en lo que sea visible del navbar móvil, construido con los mismos átomos,
  sin inventar un frame Figma que no existe.
- Confirmación: `Modal` en `md:` en adelante, `BottomSheet` por debajo — mismo criterio de
  breakpoint que el resto de layouts de la app.

**Seguridad**

- **Alcance explícito: cierre de sesión local (este dispositivo), no revocación global.**
  `signOut()` de Firebase invalida la sesión del SDK en este cliente; **no** revoca el ID Token ya
  emitido en el Gateway (`FirebaseAuthGlobalFilter`/`verifyIdToken`, sin `checkRevoked=true`) ni en
  cualquier otro dispositivo donde la sesión siga activa. Coincide con lo que el propio backlog
  documenta como alcance de `CA-1.8.1`, y dista deliberadamente de lo que la misma `HU-1.8`
  anticipa como trabajo futuro (`POST /api/v1/auth/logout-all`, Firebase Admin SDK,
  `revokeRefreshTokens(uid)`, `[TBD]`, Sprint 3) — no se construye aquí.
- No se modifica `cameia-cuentas` ni `cameia-gateway`. No se introduce ningún endpoint nuevo de
  CAMEIA.
- Ningún dato de sesión se guarda manualmente fuera del SDK de Firebase (confirmado contra el
  código real: cero coincidencias de `localStorage`/`sessionStorage` para datos de sesión — la
  única llave presente, `i18nextLng`, es preferencia de idioma, no autenticación).
- El resto de reglas de seguridad de la feature (sin cabeceras `X-User-*`, un solo tema) aplica
  igual que en Login/Registro.

## 4. Contrato observable

**Campos y reglas**

| Campo                | Tipo      | Regla                                                                              | Origen               |
| --------------------- | --------- | ------------------------------------------------------------------------------------ | ---------------------- |
| `correo`              | `string`  | Formato de correo válido, obligatorio                                               | `CA-1.3.1`, `CA-1.1.1` |
| `contraseña`          | `string`  | Obligatorio; en Login sin regla de formato; en Registro 12–64 *code points*, fuera de la lista de comunes (`PasswordPolicy.java`, confirmado) | `CA-1.3.1`, `CA-1.1.1` |
| `nombre`, `apellido`  | `string`  | Obligatorios                                                                         | `CA-1.1.1`             |
| `fechaNacimiento`     | `string` (fecha) | Obligatoria; ≥18 años UTC, no futura (contra `todayLocalIsoDate()`), no >110 años, formato válido, `max`/`min` nativos = `todayLocalIsoDate()`/`oldestPlausibleBirthDateIsoDate()`; viaja al backend como `dd/MM/yyyy` (`register.mapper.ts`) | `CA-1.1.1`, `CA-1.1.3` |
| `celular`             | `{paisIso, numeroNacional}` | Opcional; con número, formato E.164 real vía `libphonenumber-js` (`PhoneNumber.java`, confirmado); campo del backend es `phoneNumber` (E.164 completo) | `CA-1.1.1` |
| `pronombres`          | `string` (código) | Obligatorio en cliente; uno de `HE`/`SHE`/`THEY` — **catálogo confirmado**, es el enum real `Pronoun` del backend; campo del backend es `pronoun` (singular), opcional del lado del backend | `tech.cameia.cuentas.domain.model.Pronoun`, revisado 19-sep-2026 |
| `confirmarContraseña` | `string`  | Obligatorio, debe coincidir con `contraseña`; **no se envía al backend**             | Frontend               |
| `emailVerified`       | `boolean` | Se lee de `userCredential.user.emailVerified` tras autenticar                       | `CA-1.3.1`, `GLOSSARY.md` |
| ID Token (Firebase)   | `string` (JWT) | Se adjunta como `Authorization: Bearer` en llamadas protegidas posteriores      | `ADR-0003`             |
| `hasUnsavedChanges`   | `boolean` | Bandera interna de cliente, no un campo de usuario; `true` mientras `GeneralInfoForm` tenga `formState.isDirty` | `stores/unsavedChanges.store.ts`, nuevo en `CM-194` |
| `email_verified` (claim) | `boolean` | Claim del ID Token. **Lo lee el backend, no el frontend**: es lo único que `cameia-cuentas` acepta como prueba de la verificación (`REQ-CU-13`). El cliente solo se encarga de que el token esté refrescado antes de la activación | `CM-14` / spec de `cameia-cuentas` §5 |
| Estado de la Cuenta   | `string` (código) | `PENDING_VERIFICATION` → `ACTIVE`. El frontend **no lo lee nunca** (no hay endpoint que lo devuelva, B-24): solo dispara la transición y confía en que es idempotente | `CU-1`/`REQ-CU-13` de `cameia-cuentas`; sin entrada en `docs/GLOSSARY.md` todavía (B-25) |

**Estados y enumerados**

Estado de sesión (frontend-only, ver nota de la primera versión de esta SPEC sobre la laguna en
`docs/GLOSSARY.md`): `no-autenticado` / `autenticando` / `autenticado` (con `emailVerified` como
atributo, no como estado aparte). El cierre de sesión (`CM-194`) completa la transición inversa,
`autenticado → no-autenticado`, con el mismo enumerado ya declarado — no se agrega ningún estado
nuevo.

Catálogo de pronombres (**confirmado 19-sep-2026** contra `tech.cameia.cuentas.domain.model.Pronoun`):

```ts
export const PRONOUNS = ['HE', 'SHE', 'THEY'] as const;
// etiqueta visible = t(`auth:registro.pronombres.${codigo}`)
```

**Errores que el usuario puede ver**

Registro discrimina por `httpStatus` + `errors[].field` (`ADR-0007` — el `ProblemDetail` real no
trae un código propio); Login sigue discriminando por el código de `AuthError` (Firebase, sistema
aparte de `ApiError`/`errorMap.ts`, sin cambios por `ADR-0007`). Cerrar sesión reutiliza el mismo
sistema de `AuthError` que Login.

| Causa                       | Cuándo ocurre                                                              | Llave de i18n                          |
| ------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------- |
| Campo vacío (Login)           | Validación de cliente                                                     | `auth:login.errores.<campo>Requerido`    |
| Formato de correo inválido    | Validación de cliente                                                     | `auth:login.errores.correoInvalido` / `auth:registro.errores.correoInvalido` |
| `AUTH_INVALID_CREDENTIALS`    | `auth/invalid-credential`, `auth/user-not-found`, `auth/wrong-password` (Login) | `errors:codigos.AUTH_INVALID_CREDENTIALS` |
| `AUTH_TOO_MANY_REQUESTS`      | `auth/too-many-requests`                                                  | `errors:codigos.AUTH_TOO_MANY_REQUESTS`  |
| `AUTH_NETWORK_ERROR`          | `auth/network-request-failed`                                             | `errors:red`                             |
| `AUTH_USER_DISABLED`          | `auth/user-disabled`                                                      | `errors:codigos.AUTH_USER_DISABLED`      |
| Campo vacío / no coincide (Registro) | Validación de cliente (incluye `confirmarContraseña`)               | `auth:registro.errores.<campo>*`         |
| Fecha de nacimiento (4 causas) | Ver §3, Registro · Validaciones                                          | `auth:registro.errores.fechaNacimiento*` |
| Correo duplicado              | `409` de `POST /api/v1/users` (`EmailAlreadyRegisteredException`, sin `errors[]`) — cualquier `409` de este endpoint solo puede significar esto | `auth:registro.correoDuplicado.mensaje` |
| Fecha de nacimiento rechazada por el backend | `422` de `POST /api/v1/users` con `errors[].field === 'birthDate'` (`InvalidBirthDateException`) — mismo tratamiento visual que "menor de edad" de cliente; inalcanzable en operación normal (el cliente ya replica `AgePolicy.java`) | `auth:registro.campos.fechaNacimiento.helper` (reutilizada) |
| Contraseña rechazada por el backend | `422` de `POST /api/v1/users` con `errors[].field === 'password'` (`WeakPasswordException`) — inalcanzable en operación normal (el cliente ya replica `PasswordPolicy.java` completa, incluida la lista de comunes) | `auth:registro.errores.contrasenaGenerica` |
| Celular rechazado por el backend | `422` de `POST /api/v1/users` **sin** `errors[]` (`IllegalArgumentException` de `PhoneNumber.java` — su manejador, `valorInvalido()`, no lo etiqueta) — inalcanzable en operación normal | `errors:generico` (no hay forma de asociarlo al campo `celular` específicamente) |
| Cualquier otro `4xx`/`0` (red) de `POST /api/v1/users` | Fallback genérico o de red                                          | `errors:generico` / `errors:red`         |
| Cualquier otro código `auth/*` no mapeado (Login) | Fallback                                              | `errors:generico`                        |
| **Falla de `signOut()` de Firebase** (rara, ej. problema interno del SDK) | **Excepción atrapada por `useLogout`, en el flujo de Cerrar sesión (`CM-194`)** | **`errors:generico`, en un `Toast`** |
| **Reenvío estrangulado** | `auth/too-many-requests` al reenviar el enlace de verificación (`CM-14`) | `auth:verificacion.errores.demasiadosIntentos` |
| **Otro fallo del reenvío** | Cualquier otro código `auth/*` de `sendEmailVerification()` | `errors:generico` |
| **Activación rechazada (`403`)** | `POST /api/v1/users/me/verification` con un ID Token cuyo `email_verified` sigue en `false`, ya reintentado con refresco forzado. Incluye el caso de que el Gateway no propague el estado de verificación (B-22) | `auth:verificacion.errores.noConfirmada` |
| **Cuenta local inexistente (`404`)** | `AccountNotFoundException`: el `uid` de Firebase no tiene fila en `cuenta`. Solo puede pasar si el registro se completó a medias | `errors:generico` |
| **Activación fallida (otro código / red)** | Cualquier otra respuesta del mismo endpoint | `errors:generico` / `errors:red` |

## 5. Enlace HTTP · PROVISIONAL

**Estado del contrato:** parcialmente provisional · fuente: `16092026_01_Backlog.xlsx` (`HU-1.1`,
`HU-1.3`, `HU-1.8`), diagrama de flujo de autenticación, `ADR-0006` · revisado el 20-sep-2026.

| Operación         | Método y ruta                                                                 | Envía                                                                | Recibe |
| ------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------- |
| Inicio de sesión    | SDK Firebase Auth `signInWithEmailAndPassword` — no es HTTP a CAMEIA             | Correo y contraseña, directo a Firebase                                 | `UserCredential` |
| **Registro**        | **`POST /api/v1/users`** — sin sesión ("Caso B"), Gateway descarta `Authorization`/`X-User-*` del cliente y firma internamente con OIDC (`ADR-0006`) | `firstName`, `lastName`, `birthDate` (`dd/MM/yyyy`), `email`, `password`, `pronoun?`, `phoneNumber?` — **nombres confirmados** contra `RegisterUserRequest.java` (19-sep-2026); el contrato completo sigue `// PROVISIONAL` porque `CM-35` no ha cerrado el ticket, aunque el formato de error **ya no es provisional** (`ADR-0007`) | `201` con `{ id, firebaseUid, status, plan }` (`RegisteredUserResponse.java`, confirmado), o `4xx`/`409` con `ProblemDetail` real (RFC 7807: `title`/`detail`/`status` + `errors: [{field, message}]` — `ADR-0007`, confirmado contra `BusinessExceptionHandler.java`) |
| Verificación de correo (envío y reenvío) | SDK Firebase Auth `sendEmailVerification()` — no es HTTP a CAMEIA, y no pasa por el Gateway | — | — |
| **Verificación de correo (detección)** | SDK Firebase Auth `user.reload()` + `getIdToken(user, true)` — no es HTTP a CAMEIA | — | `emailVerified` actualizado y un ID Token nuevo, ya con `email_verified: true` |
| **Activación de la Cuenta** | **`POST /api/v1/users/me/verification`** — Caso A, exige ID Token válido (`CU-2`/`REQ-CU-13` de `cameia-cuentas/specs/CM-14-RegistroUsuario/spec.md`, `CONTRATO-GATEWAY-CM-14.md` §1) | Cuerpo **vacío**. La identidad y el estado de verificación salen del token; el Gateway agrega `X-User-Id`/`X-User-Email`/`X-User-Roles`/`X-Request-Id` | `200 OK` con `ActivatedAccountResponse` (`{id, status}`) — el cliente lo ignora; `403` (`EmailNotVerifiedException`) si el correo sigue sin verificar, `404` (`AccountNotFoundException`) si ese `uid` no tiene Cuenta local, y el mismo `200` sin escribir nada si ya estaba `ACTIVE` (idempotente por `REQ-CU-13`). Verificado contra `AccountActivationController.java`, `ActivateAccountService.java` y `BusinessExceptionHandler.java` reales, 21-sep-2026 |
| **Cierre de sesión (dispositivo actual)** | **SDK Firebase Auth `signOut()`** — no es HTTP a CAMEIA, no pasa por el Gateway | — | — |

Notas:

- El diagrama confirma explícitamente que ni el login, ni el envío de correos de Firebase, ni el
  cierre de sesión pasan por el Gateway.
- La cabecera `X-User-Plan` que aparece en el diagrama para llamadas posteriores ("Caso A") **no**
  es responsabilidad del frontend implementarla — la deriva el Gateway del Custom Claim.
- `register.api.ts` es la primera llamada de esta feature a un endpoint propio de CAMEIA — necesita
  su handler en `mocks/handlers/auth.handlers.ts` (ya existía vacío, gana su primer handler real).
- Este contrato es más volátil que el de Login: `CM-35` sigue "En curso". Cuando publique su forma
  real, solo cambian `register.dto.ts` y `register.mapper.ts` (`ADR-0003`).
- **Confirmado 19-sep-2026** contra el código real de `cameia-cuentas` (adjuntado por el usuario:
  `UserRegistrationController`, `RegisterUserRequest`, `RegisteredUserResponse`,
  `RegisterUserService`, `Pronoun`, y en el seguimiento del mismo día:
  `BusinessExceptionHandler.java`, `PasswordPolicy.java`, `PhoneNumber.java`, `AgePolicy.java`):
  los nombres de campo de esta tabla, la forma de la respuesta `201`, la forma real del error
  (`ProblemDetail`, `ADR-0007`), y que `RegisterUserService.register()` puede lanzar tres
  excepciones de dominio distintas (`EmailAlreadyRegisteredException`, `InvalidBirthDateException`,
  `WeakPasswordException` — ver §3 y §4), en ese orden.
- **El hallazgo que `CM-34` dejó anotado ya está en alcance (`CM-14`, 21-sep-2026):**
  `AccountActivationController` (`POST /api/v1/users/me/verification`, Caso A) es lo que activa la
  Cuenta (`PENDING_VERIFICATION` → `ACTIVE`) tras la verificación del correo. Verificar el correo
  del lado de Firebase **no** activa la Cuenta por sí solo. Lo que entonces se dejó como nota para
  «cuando se aborde `HU-1.2`» es exactamente esta iteración; ver §2 y §3.
- **Quién prueba la verificación, corregido el 21-sep-2026 contra el código real:** la primera
  redacción de esta SPEC daba por hecho —siguiendo `CONTRATO-GATEWAY-CM-14.md`, del 17-sep— que
  sin el encabezado `X-User-Email-Verified` la activación respondería `403` siempre, y marcaba eso
  como bloqueo de extremo a extremo. **No es así en el código de hoy:** el Gateway ya propaga el
  encabezado (`FirebaseAuthGlobalFilter.java`, `CM-14 REQ-VER-01` a `REQ-VER-03`) y, aunque no
  llegara, `ActivateAccountService.java` consulta el estado a Firebase con el Admin SDK antes de
  rechazar. El refresco forzado del ID Token del cliente sigue siendo necesario —es lo que hace
  que el claim viaje en `true` por el camino rápido, y lo que mantiene coherente el estado de la
  propia aplicación—, pero ya no es el único hilo del que cuelga el flujo (B-22, resuelto).
- **Cierre de sesión en todos los dispositivos, fuera de alcance de esta iteración:** la
  especificación técnica de `HU-1.8` (backlog, ambas versiones) anticipa `POST
  /api/v1/auth/logout-all`, marcado `[Requiere Definición - TBD]` por el propio backlog, vía
  Firebase Admin SDK (`revokeRefreshTokens(uid)`), en Sprint 3, estado `Pendiente`. No existe hoy
  en `cameia-cuentas` ni en `cameia-gateway` (confirmado, investigación preliminar de CM-194) y no
  se implementa en `CM-194` — la única `CA` publicada de `HU-1.8` (`CA-1.8.1`) exige solo el
  cierre del dispositivo actual.

## 6. Criterios de aceptación

| Criterio    | Qué hace el frontend que el criterio no dice |
| ----------- | ----------------------------------------------- |
| `CA-1.3.1`  | Estados concretos (spinner, `AlertInline`); valida formato de correo en cliente; persiste `emailVerified` en el store. |
| `CA-1.3.2`  | Mapea `auth/invalid-credential` (y otros `auth/*`) a una llave de `errors:*`, nunca el mensaje crudo del SDK. |
| `CA-1.1.1`  | Separa Nombre(s)/Apellido(s) en dos campos (Figma, no "nombre completo"); implementa el `Modal` de confirmación con copy provisional; distingue visualmente las cuatro causas de rechazo de fecha de nacimiento; encadena `signIn()` + `sendEmailVerification()` tras el `POST` exitoso, sin repetir lógica de Login. |
| `CA-1.1.2`  | Muestra, junto al mensaje de correo duplicado, el bloque de dos acciones ("Iniciar sesión" funcional, "Recuperar contraseña" deshabilitado) que dibuja Figma — el criterio solo pide el mensaje. |
| `CA-1.1.3`  | Extiende `utils/calculateAge.ts` con las guardas de fecha futura y >110 años, que hoy no existen; escribe el mensaje de ">110 años" (no viene literal en el backlog, queda marcado como propuesto). |
| `HU-1.2` (sin `CA` publicadas al frontend, B-25) | El comportamiento no sale de un criterio de aceptación sino de la spec de Backend (`CU-2`, `REQ-CU-13`) y del prototipo entregado: pantalla propia, detección por sondeo, refresco forzado del ID Token antes de activar, reenvío con espera de 60 s, guard duro sobre toda ruta autenticada, y activación de rezagados al iniciar sesión. Todo eso lo pone Frontend; el backend solo define el endpoint y su regla. |
| `CA-1.8.1`  | Además de "ejecuta `signOut` y redirige a Login" (lo único que pide el criterio), agrega: confirmación previa (`Modal`/`BottomSheet` `destructive`); advertencia adicional cuando hay cambios sin guardar; ícono en el ítem del menú (desviación consciente de Figma); limpieza explícita del store antes de navegar, sin depender únicamente del listener asíncrono de `AuthProvider`; y construye el menú de usuario completo (`Mi cuenta`/`Planes`/idioma), no solo el ítem de logout, porque así lo define el único componente real de Figma para esta zona (`menu-usuario`). |

## 7. Estado de implementación

| Archivo | Qué implementa | Prueba |
| ------- | --------------- | ------- |
| `src/design-system/atoms/Logo/Logo.tsx` | Marca de Cameia, variantes `lockup`/`mark-only`, tono `default`/`inverse` | `Logo.test.tsx` |
| `src/design-system/icons/GoogleIcon.tsx`, `src/design-system/icons/svg/google.svg` | Ícono real de Google | — |
| `src/layouts/AuthLayout.tsx` | Panel de marca de dos columnas + colapso a una columna; logo y enlace "Volver a inicio" enlazan a `/` (§9) | `AuthLayout.test.tsx` |
| `src/stores/auth.store.ts`, `src/app/providers/AuthProvider.tsx` | `emailVerified` en `AuthUser` | `AuthProvider.test.tsx` |
| `src/features/auth/model/authErrorMessage.ts` | Código de `AuthError` → llave de i18n | `authErrorMessage.test.ts` |
| `src/features/auth/schemas/login.schema.ts` | Validación zod de `correo`/`contraseña` | — |
| `src/features/auth/organisms/LoginForm/LoginForm.tsx` | Formulario de Login | `LoginForm.test.tsx` |
| `src/features/auth/hooks/useLogin.ts` | Orquesta `signIn()`, error y redirección | `useLogin.test.tsx` |
| `src/features/auth/pages/LoginPage.tsx` | Compone `AuthLayout` + `LoginForm` | `LoginPage.test.tsx` |
| `src/features/auth/routes.tsx` | Ruta /ingresar → `LoginPage`; ruta /registro → `RegisterPage` | `src/app/router/index.test.tsx` |
| `src/features/auth/model/pronouns.ts` | Catálogo `PRONOUNS` (`HE`/`SHE`/`THEY`, enum real del backend) | — |
| `src/features/auth/model/commonPasswords.ts` | Copia literal de `PasswordPolicy.COMMON_PASSWORDS` (32 entradas) | `commonPasswords.test.ts` |
| `src/features/auth/schemas/register.schema.ts` | Validación zod de Registro: cuatro causas de `fechaNacimiento`, contraseña real (12-64 *code points* + comunes), celular E.164, coincidencia de contraseñas | — |
| `src/features/auth/api/register.dto.ts`, `register.mapper.ts`, `register.api.ts` | POST a /api/v1/users sin sesión, provisional; celular a E.164 vía `libphonenumber-js` | — |
| `src/mocks/handlers/auth.handlers.ts` | Handler de POST a /api/v1/users (edad, contraseña, correo duplicado, celular — mismo orden que `RegisterUserService.register()`, `ProblemDetail` real) | `src/mocks/handlers/auth.handlers.test.ts` |
| `src/utils/calculateAge.ts` | Guardas `isFutureDate`/`isImplausiblyOld`; `todayLocalIsoDate()`/`oldestPlausibleBirthDateIsoDate()` (límites de calendario en hora local, para `max`/`min` del `<input type="date">`) | `calculateAge.test.ts` |
| `src/utils/passwordStrength.ts` | `calculatePasswordStrength` (escala de 4 niveles, decisión de Frontend) | `passwordStrength.test.ts` |
| `src/design-system/organisms/Modal/Modal.tsx` | Primer `Modal` del design system, `type=confirm`; **gana `variant="destructive"` en `CM-194`** | `Modal.test.tsx` |
| `src/design-system/molecules/PasswordStrength/PasswordStrength.tsx` | Reescrito al contrato real de Figma (5 niveles: empty, weak, fair, good, strong) | `PasswordStrength.test.tsx` |
| `src/design-system/atoms/Input/Input.tsx`, `src/design-system/atoms/Select/Select.tsx`, `src/design-system/molecules/PasswordField/PasswordField.tsx` | `forwardRef` (foco automático de react-hook-form) | pruebas ya existentes + "reenvía el ref" |
| `src/features/auth/organisms/PhoneField/PhoneField.tsx` | Selector de país + número nacional (celular internacional) | `PhoneField.test.tsx` |
| `src/features/auth/organisms/PhoneField/CountryCodeSelect.tsx` | Disparador compacto `{ISO} +{indicativo}` con panel y buscador; archivo interno, no exportado (corrige truncado + placeholder contradictorio); **patrón base de `MenuUsuario` (`CM-194`)** | `CountryCodeSelect.test.tsx` |
| `src/features/auth/organisms/RegisterForm/RegisterForm.tsx` | Formulario de Registro | `RegisterForm.test.tsx` |
| `src/features/auth/hooks/useRegister.ts` | Orquesta `registerUser` → `signIn()` → `sendEmailVerification()`, caso de borde de sesión, `errorInfo` (`httpStatus`/`field`) | `useRegister.test.tsx` |
| `src/features/auth/pages/RegisterPage.tsx` | Compone `AuthLayout` + `RegisterForm` + `Modal` | `RegisterPage.test.tsx` |
| `src/services/firebase/auth.service.ts` | `sendEmailVerification()` nueva; `signUp()` retirado (`ADR-0006`); **`signOut()` envuelto en `AuthError` (`CM-194`)** | `auth.service.test.ts` |
| `src/services/http/ApiError.ts`, `errorMap.ts` | Reescritos contra `ProblemDetail` real (`ADR-0007`) | `errorMap.test.ts` |
| `src/stores/unsavedChanges.store.ts` | **Nuevo (`CM-194`).** Bandera de cliente `hasUnsavedChanges`/`setUnsavedChanges` | `unsavedChanges.store.test.ts` |
| `src/features/auth/hooks/useLogout.ts` | **Nuevo (`CM-194`).** Orquesta confirmación, `signOut()`, `clear()` explícito y navegación | `useLogout.test.tsx` |
| `src/design-system/organisms/MenuUsuario/MenuUsuario.tsx` | **Nuevo (`CM-194`).** Disparador (`Avatar`+chevron) y panel de acciones del usuario, sin dominio | `MenuUsuario.test.tsx` |
| `src/design-system/organisms/BottomSheet/BottomSheet.tsx` | **Nuevo (`CM-194`).** Primer `BottomSheet` del design system, variante `destructive` | `BottomSheet.test.tsx` |
| `src/design-system/organisms/LanguageSwitcher/LanguageSwitcher.tsx` | Gana variante `context="menu-row"`; etiqueta "Idioma" e ícono `swap` — desviación de Figma pedida por el usuario, no por diseño (`CM-194`, ver B-21) | `LanguageSwitcher.test.tsx` |
| `src/utils/focusTrap.ts` | **Nuevo (`CM-194`).** Ciclado de `Tab`/`Shift+Tab` compartido por `Modal`/`BottomSheet` — vive en `src/utils`, no en un hook, porque `design-system` no tiene permiso hacia `hooks` (regla boundaries/dependencies de `eslint.config.js`) | `focusTrap.test.ts` |
| `src/features/professional-profile/organisms/GeneralInfoForm/GeneralInfoForm.tsx` | Sincroniza `formState.isDirty` con `unsavedChanges.store.ts` (`CM-194`) | `GeneralInfoForm.test.tsx` |
| `src/layouts/AppShell.tsx` | Resuelve avatar (`useAuthStore`), idioma y el copy de confirmación por sí mismo, y compone `MenuUsuario` + `Modal`/`BottomSheet` en su propio `<header>` — **corrección frente a la redacción original de esta SPEC**, que describía todo ese armado en `src/app/router/index.tsx`: solo `onLogout`/`isLoggingOut` cruzan esa frontera, el resto ya estaba permitido desde `layouts` (`stores`, y el paquete externo `react-i18next`) (`CM-194`) | `AppShell.test.tsx` |
| `src/app/router/AuthenticatedAppShell.tsx` | **Nuevo (`CM-194`), no anticipado por la redacción original de esta SPEC.** Envuelve `AppShell` para poder llamar `useLogout()` — `routeConfig` de `index.tsx` es un array de nivel de módulo, no se puede invocar un hook ahí; mismo criterio que `RequireAuth`/`RedirectIfAuthenticated` | `AuthenticatedAppShell.test.tsx` |
| `src/app/router/index.tsx` | Cambia una línea: usa `AuthenticatedAppShell` en vez de `AppShell` directo (`CM-194`) | `src/app/router/index.test.tsx` |
| `src/features/auth/pages/LoginPage.tsx` | **Modificado, no anticipado por la redacción original de esta SPEC** (que pedía un `Toast`, sin infraestructura en la app): lee `location.state.logoutError` y muestra `AlertInline variant="error"`, mismo mecanismo que ya usaba para `registerInfo` (`CM-194`) | `LoginPage.test.tsx` |
| `src/i18n/locales/es-CO/auth.json` | Llaves nuevas de `menu.*` (Mi cuenta, Planes, Cerrar sesión, confirmación) (`CM-194`) | — |

**Verificación de correo (`CM-14`).** Todo el código de producción está escrito; las pruebas
marcadas «pendiente» son la siguiente tanda, acotada a pedido del usuario para no entregar un
cambio ilegible de una sola vez:

| Archivo | Qué implementa | Prueba |
| ------- | --------------- | ------- |
| `src/app/router/routes.ts` | `ROUTES.verificarCorreo`, con el valor /verificar-correo | `src/app/router/index.test.tsx` |
| `src/app/router/guards/RequireAuth.tsx` | `RequireVerifiedEmail` nuevo; `RedirectIfAuthenticated` con destino según `emailVerified` | `src/app/router/guards/RequireAuth.test.tsx` (5 casos nuevos) |
| `src/app/router/index.tsx` | La ruta de verificación bajo `RequireAuth`; el resto bajo `RequireVerifiedEmail` | `src/app/router/index.test.tsx` |
| `src/features/auth/routes.tsx`, `src/features/auth/index.ts` | `verificarCorreoRoutes` exportado aparte de `authRoutes` | `src/app/router/index.test.tsx` |
| `src/features/auth/pages/VerifyEmailPage.tsx` | Compone `AuthLayout` + `Toast` + `VerifyEmailPanel`; única pieza con `useTranslation` | **pendiente** — `src/features/auth/pages/VerifyEmailPage.test.tsx` |
| `src/features/auth/organisms/VerifyEmailPanel/VerifyEmailPanel.tsx` | Contenido presentacional de la pantalla, toda la copia por props | **pendiente** — `src/features/auth/organisms/VerifyEmailPanel/VerifyEmailPanel.test.tsx` |
| `src/features/auth/hooks/useEmailVerification.ts` | Sondeo, refresco forzado, activación (con un solo reintento ante `403`), reenvío con espera y errores | `src/features/auth/hooks/useEmailVerification.test.tsx` |
| `src/features/auth/api/verification.api.ts` | `activateAccount()` — POST a /api/v1/users/me/verification, cuerpo vacío | cubierto por las pruebas del hook |
| `src/features/auth/model/webmailProviders.ts` | Mapa dominio → webmail para «Abrir correo» | `src/features/auth/model/webmailProviders.test.ts` |
| `src/features/auth/hooks/useLogin.ts` (ya listado arriba) | Sin prueba propia todavía de la activación de rezagados | **pendiente** |
| `src/services/firebase/auth.service.ts` | `reloadCurrentUser()` y `refreshIdToken()` nuevas | **pendiente** — `src/services/firebase/auth.service.test.ts` |
| `src/features/auth/hooks/useRegister.ts` | Redirige a la pantalla de verificación; sin `Modal` | `src/features/auth/hooks/useRegister.test.tsx` |
| `src/features/auth/pages/RegisterPage.tsx` | Sin el `Modal` de Plan Gratis | `src/features/auth/pages/RegisterPage.test.tsx` |
| `src/features/auth/hooks/useLogin.ts` | Activación de rezagados cuando la sesión ya viene verificada | `src/features/auth/hooks/useLogin.test.tsx` |
| `src/design-system/icons/registry.tsx` | Ícono `mail` | `src/design-system/icons/Icon.test.tsx` (ya existente) |
| `src/mocks/handlers/auth.handlers.ts` | Handler de la activación (`204`, y `403` simulado con la cabecera `X-Mock-Email-Verified`, que solo existe en los mocks) | **pendiente** — `src/mocks/handlers/auth.handlers.test.ts` |
| `src/i18n/locales/es-CO/auth.json`, `src/i18n/locales/en/auth.json` | Bloque `verificacion.*`; se retira `registro.modal.*` | — |

## 8. Bloqueos

| Id   | Qué falta                                                                                                  | De quién depende                       | Estado |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ----------- |
| B-01 | ~~Confirmar `/registro`~~ | — | **Resuelto:** existe en `ROUTES.registro`. |
| B-02 | Ticket Jira y `PRT` para `HU-1.10` (Google) | Product Owner / Scrum Master | Abierto — no bloquea. |
| B-03 | ~~Dónde se renderiza el banner de correo no verificado (`CA-1.3.1`)~~ | — | **Resuelto, 21-sep-2026 (`CM-14`):** no hace falta banner. Con `RequireVerifiedEmail`, una sesión sin verificar no alcanza ninguna pantalla donde mostrarlo — se la lleva a `/verificar-correo`. |
| B-04 | ~~Estado real de `services/firebase/*`, `auth.store.ts`, `AuthLayout.tsx`~~ | — | **Resuelto.** |
| B-05 | ~~Breakpoints reales de `PRT-01.03`~~ | — | **Resuelto.** |
| B-06 | ~~Código/formato exacto de error de `POST /api/v1/users`~~ | — | **Resuelto 19-sep-2026 (`ADR-0007`):** no hay código propio — `ProblemDetail` real (RFC 7807), `httpStatus` + `errors[].field`, confirmado contra `BusinessExceptionHandler.java`. |
| B-07 | Confirmar que la contraseña recibida transitoriamente en `POST /api/v1/users` no se persiste en ningún punto intermedio | Backend / Arquitectura | Abierto — pregunta de seguridad, no bloquea construir el formulario. |
| B-08 | Copy definitivo del `Modal` de confirmación de Plan Gratis — no hay instancia en Figma conectada a Registro | Producto / Diseño | Abierto — se usa el texto mínimo del backlog mientras tanto. |
| B-09 | ~~El catálogo de códigos de `pronombres`~~ | — | **Resuelto 19-sep-2026:** coincide con el enum real `tech.cameia.cuentas.domain.model.Pronoun` (`HE`/`SHE`/`THEY`). El campo del backend es `pronoun` (singular) y opcional; la obligatoriedad es solo regla de cliente. |
| B-10 | Discrepancia de nombre "pronombres" (backlog/UI) vs. "género" (documentación interna del componente Select en Figma) | Diseño | Abierto — no afecta el código, solo la documentación del componente en Figma. |
| B-11 | Mensaje literal para la causa ">110 años" de `fechaNacimiento` — el backlog no da el texto exacto | Producto | Abierto — se usa un texto propuesto, marcado como tal. |
| B-12 | ~~Copy específico para contraseña rechazada por el backend~~ | — | **Resuelto 19-sep-2026:** `PasswordPolicy.java` real confirma la regla (12–64 caracteres, lista de 32 comunes) — el cliente la replica completa (`commonPasswords.ts`), así que este `422` pasa a ser inalcanzable en operación normal; el residual usa `auth:registro.errores.contrasenaGenerica`. |
| B-13 | El selector de país de `PhoneField` no tiene bandera — el design system no tiene assets de bandera por país todavía | Diseño | Abierto — se lee por nombre + indicativo ("Colombia (+57)"); se agrega si Diseño produce el set de banderas más adelante. |
| B-14 | Un `422` de celular rechazado por el backend (`PhoneNumber.java`, vía `IllegalArgumentException`) no trae `errors[].field` — `valorInvalido()` en `BusinessExceptionHandler.java` no lo etiqueta, a diferencia de `birthDate`/`password` | Backend | Abierto, no bloquea — cae al mensaje genérico de la página; inalcanzable en operación normal (el cliente ya valida E.164 antes de enviar). |
| B-15 | No existe variante `sm`/móvil de `menu-usuario` en Figma (confirmado con dos búsquedas independientes) | Diseño | Abierto, no bloquea — Frontend reubica el mismo menú en el navbar móvil con los átomos existentes. |
| B-16 | Copy exacto de los dos textos de confirmación de logout (estándar / con advertencia de cambios sin guardar) — no viene de backlog ni Figma | Producto / Diseño | Abierto, no bloquea — se usa texto propuesto en esta SPEC (ver §9). |
| B-17 | Confirmar si `--danger-base` (`--brick-500`) coincide exactamente con el `#c4442f` que usa Figma en el ítem "Cerrar sesión" | Diseño | Abierto, no bloquea — es el token semántico correcto, ya usado para toda la semántica de "peligro" del sistema. |
| B-18 | Ticket/HU propio para "Mi cuenta" (`account/`) y "Planes" (`billing/`) | Product Owner | Abierto, no bloquea — mismo tratamiento visible-deshabilitado que Google. |
| B-19 | `HU-1.8` figura como Sprint 3 en el backlog vigente (`16092026_01`); `CM-194` no aparece entre las 13 subtareas de Sprint 1 de `CLAUDE.md` §11 | Product Owner / Scrum Master | Abierto, no bloquea la construcción de `CA-1.8.1` — confirmar si formalmente se adelantó. |
| B-20 | Valor `estado: PARCIAL` del encabezado de esta SPEC no confirmado contra el enumerado real de `docs/_plantilla-feature/SPEC.md` | Frontend / `pnpm spec:check` | **Resuelto, 20-sep-2026** — `pnpm spec:check` tras implementar `CM-194` lo confirmó como el único error real; corregido a `EN_CURSO` (ver nota del encabezado). |
| B-21 | La fila `context="menu-row"` de `language-switcher` (Figma, nodo `49:421`) mide 258px de ancho de forma nativa, pero el slot real donde se usa dentro de `menu-usuario` mide 224px — el texto "Idioma de la app" + el valor del idioma no cabían en una sola línea, ni en la app ni en el propio archivo de Figma | Diseño | **Resuelto, 20-sep-2026, a petición explícita del usuario** (no un hallazgo de Figma ni un CA del backlog): etiqueta acortada a "Idioma" y el ícono `chevron-right` (sugería que el clic despliega algo, cuando en realidad alterna el valor al instante) se reemplazó por un ícono de intercambio (`swap`, `icons/registry.tsx`). Queda como desviación consciente de Figma, no como pendiente de Diseño — se documenta por si Diseño quiere alinear el archivo fuente más adelante. |
| B-22 | ~~El Gateway debe propagar el estado de verificación o rechazar él mismo la ruta~~ | — | **Resuelto, 21-sep-2026, verificado contra el código real de los dos repositorios** (no contra `CONTRATO-GATEWAY-CM-14.md`, que es del 17-sep y describe un estado ya superado): `FirebaseAuthGlobalFilter.java` del Gateway propaga `X-User-Email-Verified` desde el claim (`CM-14 REQ-VER-01` a `REQ-VER-03`, con su propia spec en `cameia-gateway/specs/CM-14-verificacion-correo/`), y `ActivateAccountService.java` de Cuentas **consulta a Firebase directamente** cuando el encabezado no llega, en vez de asumir que no está verificado. Dos caminos independientes, ninguno bloqueado. |
| B-23 | ~~Cuerpo de la respuesta de éxito de `POST /api/v1/users/me/verification`~~ | — | **Resuelto, 21-sep-2026:** `200 OK` con `ActivatedAccountResponse` (`{id, status}`, `record` real). El cliente lo sigue ignorando —no hay nada que mostrar— así que no entran `verification.dto.ts`/`.mapper.ts`; entrarían el día que la UI necesite alguno de los dos campos. |
| B-28 | El Gateway todavía **no** bloquea las demás rutas de Caso A cuando `email_verified` es `false` (`GW-TBD-17`, abierto en `cameia-gateway/specs/CM-14-Registro-usuario/spec.md`): hoy el único freno real para una Cuenta `PENDING_VERIFICATION` es `RequireVerifiedEmail`, que es de cliente | Gateway / Juan Vela | Abierto, no bloquea — refuerza lo que ya dice §3: el guard es comodidad de UX, no control de acceso. |
| B-24 | No existe forma de consultar el estado de una Cuenta (`GET /api/v1/users/me` o equivalente) — el frontend no puede saber si una Cuenta ya quedó `ACTIVE` | Backend / Product Owner | Abierto, no bloquea — se compensa repitiendo la activación idempotente al iniciar sesión (§2), a costa de una llamada extra por inicio de sesión. |
| B-25 | `HU-1.2` no tiene criterios de aceptación en manos de Frontend ni ticket propio de subtarea (se trabaja bajo `CM-14`, la historia), y los estados de Cuenta (`PENDING_VERIFICATION`/`ACTIVE`/`DISABLED`/`ANONYMIZED`) no están en `docs/GLOSSARY.md` | Product Owner / Frontend | Abierto, no bloquea — el comportamiento se toma de la spec de Backend y del prototipo; el glosario se completa cuando el PO confirme el enumerado. |
| B-26 | `PRT-01.02` no existe como frame en Figma: el diseño de esta pantalla es la imagen entregada por el usuario el 21-sep-2026 (decisión explícita suya, ver §9). Tampoco existe el SVG de la ilustración del sobre | Diseño | Abierto, no bloquea — se construye con el ícono `mail` del registro y tokens; Diseño puede alinear el archivo fuente después. |
| B-27 | Dos decisiones de producto sin dueño en esta pantalla: qué hacer cuando el dominio del correo no tiene webmail conocido (hoy: no se muestra «Abrir correo») y qué puede hacer quien se registró con un correo equivocado (hoy: nada dentro del producto) | Producto | Abierto, no bloquea. |

## 9. Notas

- **Regla de autoridad recordada** (`CLAUDE.md` §16): SPEC manda sobre diseño; backlog manda
  siempre sobre comportamiento.
- **Resolución de la contradicción Jira ↔ Backlog para `HU-1.1`:** `CM-14`/`CM-34` describen el
  registro solo como "correo y contraseña"; el backlog (`CA-1.1.1`) exige seis campos más como
  obligatorios, y no existe ningún otro ticket bajo `CM-14` que los cubra. Se resolvió a favor del
  backlog el 18-sep-2026 (decisión explícita, este chat) — mismo criterio que ya usó el proyecto
  para J-01…J-06.
- **Resolución de la contradicción arquitectónica backlog ↔ diagrama:** se resolvió a favor del
  diagrama el 18-sep-2026 — ver `ADR-0006`. `signUp()` se retira.
- **Corrección de nombres de campo, 19-sep-2026:** esta SPEC asumía `phone`/`pronouns` (plural)
  como nombres provisionales del contrato de `POST /api/v1/users`. El usuario adjuntó el código
  real de `cameia-cuentas` y son `phoneNumber`/`pronoun` (singular); `birthDate` viaja como
  `dd/MM/yyyy`, no ISO. Se corrige aquí porque el backend es la fuente de verdad sobre su propio
  contrato, aunque siga marcado `// PROVISIONAL` en conjunto (`CM-35` no ha cerrado el ticket).
- `i18n/locales/es-CO/auth.json` ya tenía un bloque `registro` con una llave `nombreCompleto` —
  **no coincide con Figma**, que separa Nombre(s)/Apellido(s). Se reestructura, no se conserva la
  llave vieja sin uso (regla de "no código muerto" aplicada también a i18n).
- `errors.json` no tenía ningún código específico de registro (`AUTH_EMAIL_TAKEN` y similares no
  existen todavía, y de hecho ya no aplican bajo `ADR-0006`). Tras `ADR-0007` (19-sep-2026), el
  mensaje de correo duplicado ya no vive en `errors.json` como código compartido: es una llave
  propia de `auth.json` (`registro.correoDuplicado.mensaje`), porque el backend real no envía
  ningún código que justifique un catálogo compartido.
- El tratamiento "visible pero deshabilitado" para Google y recuperación de contraseña se extiende
  sin cambios al bloque de dos acciones del error de correo duplicado en Registro — mismo patrón,
  no un precedente nuevo. **Se vuelve a extender en `CM-194`** a "Mi cuenta"/"Planes" dentro del
  menú de usuario — tercera vez que se aplica el mismo patrón, no una decisión nueva.
- **Seguimiento de CM-34, 19-sep-2026:** un usuario probó `/registro` en vivo y recibió `422` — el
  formulario dejaba pasar contraseñas y celulares que el backend real rechaza. La investigación
  (con `PasswordPolicy.java`/`PhoneNumber.java`/`AgePolicy.java`/`BusinessExceptionHandler.java`
  reales, adjuntados por el usuario) reveló algo más grande: el contrato de error que
  `errorMap.ts` esperaba nunca coincidió con lo que el backend real envía (`ADR-0007`). Esta
  sección y las anteriores ya reflejan el estado posterior a esa corrección — no quedó ningún dato
  de esta SPEC describiendo el estado previo como si fuera el actual.
- **Segundo seguimiento de CM-34, mismo día:** el usuario reportó, con captura de pantalla, dos
  hallazgos de UX en `/registro`: el selector de país de `PhoneField` truncaba nombres largos y el
  placeholder del número contradecía al selector (ver corrección en §2, arriba); y no había forma
  de volver a la landing (`/`) desde `/registro` ni `/ingresar`. Se verificó en vivo en Figma
  (`get_metadata`, nodo `94:1124`, `PRT-01.03 · Login · lg`) que **ningún frame de Login o Registro
  dibuja un elemento de "volver"** — no es una omisión de implementación, es una decisión de
  comportamiento que le corresponde a Frontend (`CLAUDE.md` §16). Se agregó, en `AuthLayout.tsx`
  (compartido por ambas pantallas): el logo (panel de marca y móvil) ahora enlaza a `ROUTES.landing`
  — mismo carve-out de `boundaries/dependencies` que ya usa `AppShell.tsx` para su wordmark →
  `ROUTES.inicio` — y un enlace de texto explícito "Volver a inicio", más descubrible que el logo
  solo. Reutiliza la llave de i18n `common:acciones.volverInicio` y el destino `ROUTES.landing`, ya
  usados de forma idéntica en `NotFoundPage.tsx` — no se crea ninguna llave nueva para esto.
- **Segunda corrección de copy, mismo día:** el helper de celular ("Formato internacional, por
  ejemplo +57 300 000 0000") se partía en dos líneas en móvil, donde la columna del formulario es
  angosta. Se acortó a "Formato internacional, ej. +57 300 000 0000" — diferencia adicional con el
  copy literal de Figma, por ancho, no por contenido (`CLAUDE.md` §16).
- **Tercer seguimiento de CM-34, mismo día — fecha de nacimiento futura en móvil:** el usuario
  reportó que el selector nativo de fecha en móvil permitía elegir un día posterior a hoy. Causa
  raíz: `max` se calculaba con `new Date().toISOString().slice(0, 10)`, que convierte a UTC —
  Colombia es `UTC-5` (`CLAUDE.md` §1), así que de 7 p. m. a medianoche hora local esa conversión ya
  devuelve la fecha de mañana. El mismo desfase afectaba la propia validación de "fecha futura" en
  `register.schema.ts` (comparaba contra `new Date()` sin normalizar): a esa hora, elegir "mañana"
  no se marcaba como fecha futura, porque en UTC ya era "hoy". Se agregó
  `utils/calculateAge.ts#todayLocalIsoDate()` (getters locales, no `toISOString()`) y se corrigieron
  los dos puntos —`max` del `<input>` y la referencia de `.superRefine`— para usarlo. Regresión
  cubierta con `vi.stubEnv('TZ', 'America/Bogota')` + `vi.setSystemTime()` en
  `calculateAge.test.ts` y `RegisterForm.test.tsx`: sin la corrección, ambas pruebas fallan a las
  8 p. m. hora de Bogotá.
- **Cuarto seguimiento de CM-34, mismo día — mismo límite en el otro extremo:** pedido explícito del
  usuario: si el `<input>` ya no deja elegir una fecha futura, tampoco debería dejar elegir una que
  ya implica más de 110 años. Se agregó `utils/calculateAge.ts#oldestPlausibleBirthDateIsoDate()` y
  el `<input>` ganó `min={oldestPlausibleBirthDateIsoDate()}` — mismo límite que ya valida
  `isImplausiblyOld` al enviar, ahora también bloqueado desde el propio calendario nativo. El límite
  no es "hace 110 años" tal cual (esa fecha exacta todavía cumple 110, plausible): es un día
  después de "hace 111 años", mismo cálculo de cumpleaños que usa `calculateAge`, aplicado al
  revés. Prueba nueva en `calculateAge.test.ts`/`RegisterForm.test.tsx` fija la fecha del sistema y
  verifica el valor exacto del límite.
- **Alcance de `CM-194`, 20-sep-2026 (decisión explícita, este chat):** el backlog (`HU-1.8`,
  ambas versiones `13092026_01`/`16092026_01`, idénticas en este punto) separa "cierre de sesión
  en el dispositivo actual" (`CA-1.8.1`, única `CA` publicada) de "cierre en todos los
  dispositivos" (`[TBD]` del propio backlog, `POST /api/v1/auth/logout-all`, Sprint 3). Esta SPEC
  gobierna solo la primera; la segunda queda en el Anexo A como conceptual.
- **Hallazgo de Figma no anticipado, 20-sep-2026:** el análisis inicial de este mismo proceso
  partió de la premisa de que no existía un prototipo de logout en Figma. Sí existe (`PRT-01.08`,
  nodo `228:6443`), y su componente real (`menu-usuario`, `439:1243`) resultó ser un menú de
  usuario completo, no exclusivo de logout ("Mi cuenta"/"Planes"/idioma/divisor/"Cerrar sesión").
  Se decidió construirlo completo, con los ítems fuera de alcance visibles-deshabilitados — mismo
  patrón ya usado en Login/Registro para funciones diferidas.
- **Ícono en "Cerrar sesión", desviación consciente de Figma, decisión explícita del usuario
  (20-sep-2026):** el nodo real no dibuja icono en ese ítem; se agrega `log-out` (ya registrado en
  `icons/registry.tsx` sin consumidor), documentado igual que otras desviaciones de icono ya
  aceptadas en esta feature (`alert-triangle`→`alert-circle`, Login).
- **`Modal`/`BottomSheet`, extensión y componente nuevo, decisión explícita del usuario
  (20-sep-2026):** `Modal` (CM-34) solo implementaba `type=confirm`; gana una variante de estilo
  `destructive` reutilizando `Button` `variant="destructive"` ya existente (tokens
  `--danger-base`/`--danger-hover` confirmados en `styles/semantic.css`). `BottomSheet` no existía
  en ninguna parte del código (confirmado con grep sobre todo el repositorio, no solo `src/`) pese
  a estar en el árbol objetivo de `docs/ARCHITECTURE.md`; se construye ahora, fiel al diseño de
  Figma (nodo `41:248`), por preferencia explícita del usuario de fidelidad visual sobre reutilizar
  `Modal` en todos los tamaños de pantalla.
- **Fronteras (`boundaries/dependencies`), solución confirmada contra la configuración real de
  `eslint.config.js`:** `layouts` no puede importar `features` ni `services` — el único carve-out
  existente, `app-routes` (para `src/app/router/routes.ts`, `mode: 'file'`), es de un solo archivo
  hoja y no aplica aquí. Tampoco `hooks` tiene ningún permiso explícito hacia `stores`/`services`
  en la matriz (confirmado leyendo `policies` completo; ningún hook existente hoy —`useDebounce`,
  `useDisclosure`, `useMediaQuery`, `usePrefersReducedMotion`— importa de ninguno de los dos). Se
  resuelve con el mismo patrón ya usado por `progressEnabled`: `app/router/index.tsx` (capa `app`,
  sin restricciones) instancia `useLogout()` (que sí puede vivir en `features/auth/hooks/`, porque
  `features` sí puede importar `stores`/`services`) y arma los datos del menú, pasándolos a
  `AppShell` por props. `AppShell`/`MenuUsuario` no importan `services/firebase` ni
  `features/auth` en ningún momento.
- **Cambios sin guardar, mecanismo nuevo mínimo, decisión explícita del usuario (20-sep-2026: debe
  cubrir todos los formularios, no solo Perfil Profesional):** no existía ninguna señal de
  "formulario sucio" expuesta fuera de ningún formulario de la app (confirmado: ni
  `professional-profile` ni `interview-setup`, que hoy ni siquiera tiene estado real — es un
  placeholder de `CM-80`/`CM-84`/`CM-85`, sin store). Se crea `stores/unsavedChanges.store.ts`, una
  bandera única (no un registro por formulario — la app no permite hoy dos pantallas de edición
  simultáneas), conectada por ahora solo a `GeneralInfoForm` (único formulario con una ventana real
  de "borrador no guardado": Educación/Experiencia/Habilidades/Roles Objetivo persisten al vuelo,
  sin borrador, decisión `D-C` ya documentada, sin nada que señalar). Vive en `stores/` (store
  transversal, no de una feature) precisamente porque debe cubrir cualquier formulario futuro, no
  solo el de perfil — cuando `interview-setup` tenga estado real, se conecta de la misma forma.
- **`signOut()` sin manejo de error, corregido en la misma iteración:** `auth.service.ts` envolvía
  `signIn()`/`sendEmailVerification()` en `AuthError` pero no `signOut()` — inconsistencia real del
  archivo, no introducida por `CM-194`, corregida aquí porque se toca el mismo archivo.
- **Limpieza de estado explícita, simetría con `useLogin.ts`:** `AuthProvider` ya reacciona solo al
  evento de Firebase y llama `useAuthStore.clear()` (confirmado en código) — un botón de logout no
  necesitaría llamarlo. Se decide llamarlo explícitamente de todas formas en `useLogout`, antes de
  navegar, por el mismo criterio de determinismo que ya usa `useLogin.ts` en sentido inverso
  (actualiza el store antes de navegar, sin esperar al listener asíncrono) — evita cualquier
  ventana, por pequeña que sea, de UI inconsistente durante la transición.
- **`handleUnauthorized()` no se toca:** sigue usando `window.location.href` (recarga dura) para el
  cierre forzado por `401` — es un camino distinto y ya probado; el logout voluntario es nuevo,
  simétrico a `useLogin.ts`, y usa `useNavigate`.
- **Textos de confirmación de logout, propuestos, sujetos a aprobación (Bloqueo B-16):** sin
  cambios sin guardar, "¿Seguro que quieres cerrar sesión?"; con cambios sin guardar, "Tienes
  cambios sin guardar. Si cierras sesión, se perderán." Ninguno de los dos viene de backlog ni de
  Figma — Figma solo define el contenedor (`Modal`/`BottomSheet` variante `destructive`), no el
  copy de este uso específico.
- **Tres correcciones encontradas durante la implementación real de `CM-194`, 20-sep-2026 —
  reportadas y decididas explícitamente por el usuario antes de escribir código, no resueltas en
  silencio:**
  1. **`app/router/index.tsx` no puede "instanciar `useLogout()`"** tal como decía la redacción
     original de esta sección: `routeConfig` es un array de nivel de módulo, evaluado fuera de
     cualquier render — llamar un hook ahí rompe las reglas de React. Se resolvió con
     `app/router/AuthenticatedAppShell.tsx`, un componente nuevo con el mismo criterio que ya usan
     `RequireAuth`/`RedirectIfAuthenticated`. De paso, se decidió que `AppShell` resuelve avatar
     (`useAuthStore`), idioma y el copy de confirmación por sí mismo —`stores` y el paquete externo
     `react-i18next` ya estaban permitidos desde `layouts`—, así que solo `onLogout`/`isLoggingOut`
     cruzan la frontera real (`features/auth`, prohibida desde `layouts`). Ver §7 para el detalle
     archivo por archivo.
  2. **`Modal.tsx` no tenía foco atrapado ni retorno de foco** pese a que esta misma sección daba
     por hecho que sí ("mismo criterio de accesibilidad que `Modal`" para `BottomSheet`) — solo
     cerraba con Esc y clic en el velo. Se agregó a los dos componentes (`utils/focusTrap.ts`,
     nuevo, función pura porque `design-system` no tiene permiso hacia `hooks`), de forma aditiva:
     `RegisterPage` (único consumidor previo de `Modal`) sigue funcionando igual.
  3. **`Toast` no tiene ninguna infraestructura en la app** (sin store, sin host, sin provider,
     cero consumidores reales) pese a que esta sección pedía mostrar el fallo de `signOut()` "en un
     Toast". Se decidió reutilizar el mecanismo ya existente y aprobado de `LoginPage.tsx` para
     `registerInfo` (`location.state` → `AlertInline`), agregando `logoutError` al mismo patrón, en
     vez de construir infraestructura de `Toast` nueva para un caso de error raro.
- **Ajuste de UI/UX en la fila de idioma del menú, 20-sep-2026, pedido explícitamente por el usuario
  después de ver `CM-194` construido — no un hallazgo de Figma, no un CA del backlog, no una
  corrección técnica encontrada por Frontend (Bloqueo B-21):**
  - El usuario reportó, tras revisar la app real y el propio prototipo de Figma, que la fila
    "Idioma de la app" se partía en dos líneas (en escritorio y en móvil) y que el ícono
    `chevron-right` daba la impresión de que el clic iba a desplegar algo, cuando en realidad
    alterna el idioma al instante.
  - Investigación de la causa: el symbol de Figma para esta fila (`language-switcher`, variante
    `menu-row`, nodo `49:421`) mide **258px de ancho de forma nativa**, pero el slot real donde se
    coloca dentro de `menu-usuario` mide **224px** — la fila nunca cupo en un renglón ni siquiera en
    el archivo de diseño original; no es un defecto introducido por la implementación de `CM-194`.
  - Decisión, tomada por el usuario, no por Frontend ni por Diseño formalmente: acortar la etiqueta
    a **"Idioma"** (`auth:menu.idioma.etiqueta`, en ambos idiomas: `es-CO` → "Idioma", `en` →
    "Language") y reemplazar `icon/chevron-right` por un ícono de intercambio nuevo (`swap`,
    `ArrowLeftRight` de Lucide, `icons/registry.tsx`) que comunica mejor que el clic alterna un
    valor en vez de sugerir navegación. Con la etiqueta corta, el renglón cabe en una sola línea
    dentro de los 224px reales.
  - Es una **desviación consciente de Figma**, igual criterio que ya aplica el ícono `log-out` de
    "Cerrar sesión" (`CLAUDE.md` §16: el diseño lo fija Frontend cuando el SPEC lo anota,
    aunque aquí el origen es explícitamente un pedido del usuario, no una decisión unilateral de
    Frontend) — Diseño puede alinear el archivo de Figma más adelante si lo considera, pero no
    bloquea nada mientras tanto (ver B-21).
  - Archivos tocados: `design-system/organisms/LanguageSwitcher/LanguageSwitcher.tsx` (TSDoc +
    ícono), `design-system/icons/registry.tsx` (nuevo ícono `swap`), `i18n/locales/es-CO/auth.json`
    y `i18n/locales/en/auth.json` (`menu.idioma.etiqueta`), y las pruebas correspondientes. No
    cambió ningún contrato de props de `LanguageSwitcher` ni de `MenuUsuario`.
- **D-01 · Defecto real encontrado al abrir `CM-14`, 21-sep-2026:** el `Modal` de Plan Gratis que
  esta SPEC describía desde `CM-34` **nunca se vio en la aplicación**. `useRegister` llama
  `useAuthStore.setUser(...)` y luego abre el modal, pero `/registro` vive detrás de
  `RedirectIfAuthenticated` (`app/router/index.tsx`): en cuanto el store marca `isAuthenticated`,
  ese guard renderiza `<Navigate to="/inicio" replace />` y desmonta la página con el modal dentro.
  Las pruebas no lo detectaron porque `RegisterPage.test.tsx` monta la página en un `MemoryRouter`
  sin los guards — el defecto solo existe en el árbol de rutas real. Lo reportó el usuario
  («¿de qué modal me hablas? no veo nada al hacer el registro») al revisar el alcance de `CM-14`.
  La corrección no es hacer visible el modal sino **retirarlo**: el destino del registro pasa a ser
  `/verificar-correo`, y el mensaje de Plan Gratis se muestra ahí (`verificacion.planGratis`).
  **Divergencia consciente con el backlog** (`CLAUDE.md` §16), que pide mostrar la asignación del
  plan «inmediatamente tras el registro»: se sigue mostrando inmediatamente, en la pantalla
  siguiente y sin un modal que interrumpa. **Sujeta a tu visto bueno en la revisión de esta SPEC.**
- **Guard duro en vez de banner, decisión explícita del usuario (21-sep-2026):** de las tres
  opciones planteadas —bloquear toda ruta autenticada, mostrar la pantalla solo al terminar el
  registro, o bloquear y además mantener el banner de `CA-1.3.1`— se eligió la primera. Es la que
  concuerda con la regla de negocio de `cameia-cuentas` («una cuenta `PENDING_VERIFICATION` existe,
  pero el resto de la plataforma no debe tratarla como utilizable», su spec §5) y la que cierra
  B-03 sin construir un banner que nadie llegaría a ver.
- **Detección por sondeo, decisión explícita del usuario (21-sep-2026):** se descartó la ruta de
  configurar el *action URL* de Firebase para que el enlace del correo abra una pantalla propia
  (`applyActionCode`), porque exige tocar la consola de Firebase, fuera de este repositorio. Se
  descartó también agregar un botón «Ya verifiqué»: el prototipo no lo dibuja y el sondeo lo hace
  innecesario. Queda `user.reload()` cada 5 s con la pestaña visible, más una comprobación al
  montar y al recuperar el foco.
- **Origen del diseño de `PRT-01.02`, decisión explícita del usuario (21-sep-2026):** la fuente es
  la imagen entregada en la raíz del repositorio, no un frame de Figma — `CLAUDE.md` §13 exige
  revisar el prototipo en vivo *cuando existe*, y aquí no existe (B-26). La imagen **no se versiona**
  (pedido explícito del usuario: no debe entrar en ningún commit); esta sección y §3 son la única
  constancia de lo que dibujaba: `Toast` de registro exitoso, titular «Verifica tu correo», el
  correo de destino en negrita, ilustración de sobre con enlace, instrucción, botón «Abrir correo»
  y enlace «Reenviar enlace», sobre el mismo `AuthLayout` de Login y Registro.
- **Por qué el frontend activa la Cuenta y no lo hace el backend solo:** Firebase no avisa a
  `cameia-cuentas` cuando alguien verifica su correo; el único portador de esa prueba es el claim
  `email_verified` del ID Token, que viaja con la siguiente petición autenticada. De ahí que la
  activación sea una llamada explícita del cliente (`CU-2`) y no un webhook. Esto también explica
  por qué el refresco forzado del token es obligatorio y no una optimización.
- **Activación de rezagados al iniciar sesión, decisión de Frontend:** `REQ-CU-13` declara la
  operación idempotente justamente para que el cliente pueda reintentarla «sin efectos raros». Se
  aprovecha para curar el caso de una Cuenta que verificó el correo pero cuya activación falló
  (red caída, `403` transitorio, pestaña cerrada a mitad): al iniciar sesión con el correo ya
  verificado se dispara la llamada en segundo plano y se traga el error. El costo es una petición
  extra por inicio de sesión; la alternativa —saber si hace falta— exige un endpoint que no existe
  (B-24).
- **Qué pasa si alguien fuerza la URL de una pantalla protegida sin verificar:** el guard lo
  devuelve a `/verificar-correo`, pero eso es comodidad, no seguridad. Si alguien deshabilitara el
  guard en su propio navegador, cada endpoint del backend sigue exigiendo su token y Cuentas sigue
  decidiendo por el claim. La SPEC lo dice explícitamente para que nadie lea el guard como control
  de acceso.

---

## Anexo A · Mapa completo de la feature `auth` (conceptual, HE-01)

| HU       | Qué es                          | Jira    | PRT        | Sprint (backlog) | Estado en esta SPEC |
| -------- | ---------------------------------- | ------- | ---------- | ----------------- | ---------------------- |
| `HU-1.1` | Registro con correo/contraseña + datos personales | `CM-14` (historia) / `CM-34` (subtarea Frontend) | `PRT-01.01`| 1 | **Gobernada por esta SPEC — implementada** |
| `HU-1.2` | **Verificación de correo electrónico** | `CM-14` (historia; sin subtarea de Frontend, B-25) | `PRT-01.02` (sin frame en Figma, B-26) | 2 (backlog) / adelantada en esta iteración | **Gobernada por esta SPEC — documentada, sin implementar todavía** |
| `HU-1.3` | **Inicio de sesión**             | `CM-40` | `PRT-01.03`| 1                  | **Gobernada por esta SPEC — implementada** |
| `HU-1.4` | Recuperación de contraseña        | pendiente | `PRT-01.04`| 2                  | Fuera de esta SPEC |
| `HU-1.8` | **Cierre de sesión (dispositivo actual)** | `CM-194` | `PRT-01.08` | 3 (backlog) / adelantada en esta iteración | **Gobernada por esta SPEC — documentada, alcance `CA-1.8.1`; ver B-19** |
| `HU-1.10`| Registro/login con Google         | pendiente | `[TBD]` (backlog) | 3          | Fuera de esta SPEC |

El cierre de sesión en **todos los dispositivos** (revocación server-side, `POST
/api/v1/auth/logout-all`, Firebase Admin SDK) — la parte de `HU-1.8` que su propia especificación
técnica anticipa pero marca `[TBD]` — sigue fuera de esta SPEC: depende de `cameia-cuentas` y no
tiene ticket de Backend todavía.

Subtareas hermanas de `CM-34` bajo `CM-14`: `CM-35` (Backend, `POST /api/v1/users`, en curso),
`CM-36` (asignación de Plan Gratis, en curso — título con error de copiado en Jira, análogo a
J-05/J-06), `CM-37` (pruebas de integración, por hacer — fuera del alcance del frontend).

## Anexo B · Diagrama de flujo de autenticación

Ver `ADR-0006`: el diagrama ya no es solo contexto de fondo para Login — es la fuente vigente de
arquitectura para el paso de creación de cuenta de Registro. El diagrama no representa
explícitamente el cierre de sesión (`CM-194`); se documenta con base en el propio comportamiento
confirmado del Gateway (`FirebaseAuthGlobalFilter`/`verifyIdToken`, sin `checkRevoked=true`, sin
sesión server-side propia) — ver §3 y §5.

## Anexo C · Preguntas que esta SPEC no puede cerrar por sí sola

- B-02, B-03 (resuelto), B-07 a B-27 (arriba) son las vigentes. Ninguna bloquea construir las
  pantallas; **B-22 sí bloquea que la verificación funcione de extremo a extremo** contra el
  backend real, porque depende de una coordinación con el Gateway que no es de este repositorio.
- ~~¿`RequireAuth` propaga la ruta de origen?~~ **Resuelto:** sí.
- ~~¿Existe un prototipo de logout en Figma?~~ **Resuelto, 20-sep-2026:** sí, `PRT-01.08` (nodo
  `228:6443`) — corrige una premisa inicial equivocada del propio proceso de análisis de `CM-194`.
