---
feature: auth
estado: IMPLEMENTADA
hu: [HU-1.3, HU-1.1]
prt: [PRT-01.03, PRT-01.01]
jira: [CM-40, CM-34]
rutas: [/ingresar, /registro]
documentacion: tsdoc-es
backlog: 13092026_01
decisiones: []
figma: Cameia · Mockups MVP
revisado: 2026-09-19
---

# Feature · Autenticación (auth)

## 1. Propósito

Resolver la identidad del Invitado y del Usuario dentro de CAMEIA: permitir que un Invitado se
dé de alta y demuestre ante Firebase Authentication que es titular de una Cuenta, y sostener esa
sesión mientras dura. La feature no administra credenciales de forma permanente — eso es de
Firebase — ni decide entitlement o cuota: solo consigue el ID Token y lo entrega al resto de la
aplicación.

Esta SPEC gobierna hoy el Inicio de Sesión (`HU-1.3` / `CM-40`, **implementado**) y el Registro
(`HU-1.1` / `CM-34`, **implementado**). El resto de la feature (Verificación, Recuperación, Google)
sigue descrito solo conceptualmente en el Anexo A y sube al cuerpo cuando entre su propia
iteración.

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

- La **pantalla** de verificación de correo (`HU-1.2`, `PRT-01.02`) — sigue fuera de Sprint 1. El
  *envío* del correo sí entra (lo exige `CA-1.1.1` como parte del registro), pero no hay pantalla
  a la que redirigir para confirmarlo: se redirige a `/inicio`, con la misma lógica de "acceso
  permitido, correo pendiente de verificar" que ya usa Login.
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
  `auth:login.errores.correoRequerido` / `correoInvalido`.
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
  Registro** — ver más abajo y `ADR-0006`.
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
  (opcional), Contraseña, Confirmar contraseña, Pronombres, botón "Registrarse".
- Al enviar, valida en cliente (zod) y, si pasa, hace `POST /api/v1/users` **sin sesión** ("Caso
  B" del diagrama, ver §5 y `ADR-0006`).
- Si el backend responde `201`: encadena, en este orden, `signIn()` (reutilizado de Login, con las
  mismas credenciales) → `sendEmailVerification()` (nueva) → actualiza el estado de sesión → abre
  el `Modal` de confirmación (Plan Gratis) → al cerrarlo, redirige a `/inicio`.
- Si el backend responde `4xx`: mapea el código (provisional, ver §4/§5) a un mensaje. Para
  correo duplicado, además del mensaje en el campo, muestra el bloque de dos acciones que dibuja
  Figma: "Iniciar sesión" (funcional, hacia `/ingresar`) y "Recuperar contraseña" (deshabilitado,
  mismo tratamiento que en Login — `HU-1.4` sigue fuera de alcance).
- **Caso de borde, no dibujado en Figma, decisión de Frontend:** si el `POST` tiene éxito pero
  `signIn()`/`sendEmailVerification()` fallan después (p. ej. la red cae entre los dos pasos), no
  se trata como fallo de registro — la cuenta ya existe. Se redirige a `/ingresar` con un mensaje
  informativo, reutilizando el mecanismo `location.state` que ya usa `RequireAuth`/`useLogin`.

**Estados**

| Estado      | Qué muestra |
| ----------- | ----------- |
| Carga       | Botón "Registrarse" en `loading`; Figma no dibuja este frame para Registro — se sigue el patrón ya confirmado en el botón de Login. |
| Vacío       | No aplica, mismo razonamiento que Login. |
| Error       | Tres variantes: (a) validación de cliente, mensaje bajo cada campo; (b) correo duplicado, mensaje + bloque de dos acciones; (c) fecha de nacimiento, ver Validaciones — tratamiento distinto según la causa. |
| Sin permiso | No aplica, ruta pública. |

**Validaciones del lado del cliente**

- `nombre`, `apellido`: obligatorios.
- `correo`: obligatorio, formato válido (la unicidad la valida el backend, `CA-1.1.1`).
- `contraseña`: obligatoria. Sin regla de fuerza mínima impuesta por el cliente (ver Alcance).
- `confirmarContraseña`: obligatoria, debe coincidir con `contraseña` — validación puramente de
  cliente, no se envía al backend.
- `pronombres`: obligatorio, uno de `HE`/`SHE`/`THEY` (ver Arquitectura).
- `celular`: opcional, sin validación de formato (ver Alcance).
- `fechaNacimiento`: obligatoria, con cuatro causas de rechazo distintas (`CA-1.1.1`/`CA-1.1.3`):
  - **Menor de 18 años (UTC):** usa `isAdult()` de `utils/calculateAge.ts` (ya la cubre). Mensaje
    "Debes ser mayor de edad" — **mismo texto que el helper permanente del campo**; Figma (nodo
    `73:535`) confirma que aquí el error solo cambia el color del borde, no el texto. Llave:
    `auth:registro.campos.fechaNacimiento.helper` (reutilizada también como mensaje de error).
  - **Fecha futura:** `calculateAge.ts` **no la cubre hoy** — se agrega la guarda
    `birthDate > referenceDate`. Mensaje "Fecha de nacimiento inválida", en `ErrorText` normal
    (Figma no dibuja este caso; se sigue el patrón estándar del design system). Llave:
    `auth:registro.errores.fechaNacimientoFutura`.
  - **>110 años:** tampoco cubierto hoy — se agrega un tope superior a `calculateAge.ts`. El
    backlog no da el texto literal, solo la intención ("mensaje específico... implausible...
    verificada"). **Texto propuesto, no confirmado, sujeto a aprobación:** "Verifica tu fecha de
    nacimiento". Llave: `auth:registro.errores.fechaNacimientoImplausible`.
  - **Formato inválido / vacío:** mensaje "Formato de fecha inválido" (no dibujado en Figma,
    patrón estándar). Llave: `auth:registro.errores.fechaNacimientoInvalida`.
  - **Rechazada por el backend (`InvalidBirthDateException`, confirmado en
    `RegisterUserService.register()`):** no es una quinta causa nueva — es la misma causa de
    "menor de edad" (o una política de edad del backend más estricta que la del cliente), solo que
    el rechazo llega en la respuesta `4xx` del `POST` en vez de la validación de cliente. Mismo
    tratamiento visual, mismo texto ("Debes ser mayor de edad"), mismo nodo Figma (`73:449`/
    `75:1021`). Código provisional: `REGISTRO_FECHA_NACIMIENTO_INVALIDA` (sin confirmar por
    `CM-35`, mismo estado que `REGISTRO_CORREO_DUPLICADO`, ver B-06).

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
  (Bloqueo B-08).

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

## 4. Contrato observable

**Campos y reglas**

| Campo                | Tipo      | Regla                                                                              | Origen               |
| --------------------- | --------- | ------------------------------------------------------------------------------------ | ---------------------- |
| `correo`              | `string`  | Formato de correo válido, obligatorio                                               | `CA-1.3.1`, `CA-1.1.1` |
| `contraseña`          | `string`  | Obligatorio; en Login sin regla de formato; en Registro sin mínimo de fuerza impuesto por el cliente | `CA-1.3.1`, `CA-1.1.1` |
| `nombre`, `apellido`  | `string`  | Obligatorios                                                                         | `CA-1.1.1`             |
| `fechaNacimiento`     | `string` (fecha) | Obligatoria; ≥18 años UTC, no futura, no >110 años, formato válido; viaja al backend como `dd/MM/yyyy` (`register.mapper.ts`) | `CA-1.1.1`, `CA-1.1.3` |
| `celular`             | `string`  | Opcional, sin validación de formato en esta iteración; campo del backend es `phoneNumber`     | `CA-1.1.1`             |
| `pronombres`          | `string` (código) | Obligatorio en cliente; uno de `HE`/`SHE`/`THEY` — **catálogo confirmado**, es el enum real `Pronoun` del backend; campo del backend es `pronoun` (singular), opcional del lado del backend | `tech.cameia.cuentas.domain.model.Pronoun`, revisado 19-sep-2026 |
| `confirmarContraseña` | `string`  | Obligatorio, debe coincidir con `contraseña`; **no se envía al backend**             | Frontend               |
| `emailVerified`       | `boolean` | Se lee de `userCredential.user.emailVerified` tras autenticar                       | `CA-1.3.1`, `GLOSSARY.md` |
| ID Token (Firebase)   | `string` (JWT) | Se adjunta como `Authorization: Bearer` en llamadas protegidas posteriores      | `ADR-0003`             |

**Estados y enumerados**

Estado de sesión (frontend-only, ver nota de la primera versión de esta SPEC sobre la laguna en
`docs/GLOSSARY.md`): `no-autenticado` / `autenticando` / `autenticado` (con `emailVerified` como
atributo, no como estado aparte).

Catálogo de pronombres (**confirmado 19-sep-2026** contra `tech.cameia.cuentas.domain.model.Pronoun`):

```ts
export const PRONOUNS = ['HE', 'SHE', 'THEY'] as const;
// etiqueta visible = t(`auth:registro.pronombres.${codigo}`)
```

**Errores que el usuario puede ver**

| Código                       | Cuándo ocurre                                                              | Llave de i18n                          |
| ------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------- |
| Campo vacío (Login)           | Validación de cliente                                                     | `auth:login.errores.<campo>Requerido`    |
| Formato de correo inválido    | Validación de cliente                                                     | `auth:login.errores.correoInvalido` / `auth:registro.errores.correoInvalido` |
| `AUTH_INVALID_CREDENTIALS`    | `auth/invalid-credential`, `auth/user-not-found`, `auth/wrong-password` (Login) | `errors:codigos.AUTH_INVALID_CREDENTIALS` |
| `AUTH_TOO_MANY_REQUESTS`      | `auth/too-many-requests`                                                  | `errors:codigos.AUTH_TOO_MANY_REQUESTS`  |
| `AUTH_NETWORK_ERROR`          | `auth/network-request-failed`                                             | `errors:red`                             |
| `AUTH_USER_DISABLED`          | `auth/user-disabled`                                                      | `errors:codigos.AUTH_USER_DISABLED`      |
| Campo vacío / no coincide (Registro) | Validación de cliente (incluye `confirmarContraseña`)               | `auth:registro.errores.<campo>*`         |
| Fecha de nacimiento (4 causas) | Ver §3, Registro · Validaciones                                          | `auth:registro.errores.fechaNacimiento*` |
| Correo duplicado              | Respuesta `4xx` de `POST /api/v1/users` (`EmailAlreadyRegisteredException`) — **código exacto sin confirmar, `CM-35` en curso** | `errors:codigos.REGISTRO_CORREO_DUPLICADO` (provisional) |
| Fecha de nacimiento rechazada por el backend | Respuesta `4xx` de `POST /api/v1/users` (`InvalidBirthDateException`) — mismo tratamiento visual que "menor de edad" de cliente, **código exacto sin confirmar, `CM-35` en curso** | `errors:codigos.REGISTRO_FECHA_NACIMIENTO_INVALIDA` (provisional) |
| Contraseña rechazada por el backend (`WeakPasswordException`) | Respuesta `4xx` de `POST /api/v1/users` — sin copy específico todavía (B-12) | `errors:generico` |
| Cualquier otro `4xx` de `POST /api/v1/users` | Fallback genérico                                          | `errors:generico`                        |
| Cualquier otro código `auth/*` no mapeado (Login) | Fallback                                              | `errors:generico`                        |

## 5. Enlace HTTP · PROVISIONAL

**Estado del contrato:** parcialmente provisional · fuente: `13092026_01_Backlog.xlsx` (`HU-1.1`,
`HU-1.3`), diagrama de flujo de autenticación, `ADR-0006`, `CM-35` (en curso, sin publicar) ·
revisado el 18-sep-2026.

| Operación         | Método y ruta                                                                 | Envía                                                                | Recibe |
| ------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------- |
| Inicio de sesión    | SDK Firebase Auth `signInWithEmailAndPassword` — no es HTTP a CAMEIA             | Correo y contraseña, directo a Firebase                                 | `UserCredential` |
| **Registro**        | **`POST /api/v1/users`** — sin sesión ("Caso B"), Gateway descarta `Authorization`/`X-User-*` del cliente y firma internamente con OIDC (`ADR-0006`) | `firstName`, `lastName`, `birthDate` (`dd/MM/yyyy`), `email`, `password`, `pronoun?`, `phoneNumber?` — **nombres confirmados** contra `RegisterUserRequest.java` (19-sep-2026); el contrato completo sigue `// PROVISIONAL` porque `CM-35` no ha publicado el formato de error ni puede garantizar que estos nombres no cambien antes de cerrar el ticket | `201` con `{ id, firebaseUid, status, plan }` (`RegisteredUserResponse.java`, confirmado), o `4xx` con un código de error (formato exacto pendiente — se sigue el formato provisional `{code, message, details}` de `errorMap.ts` hasta que `CM-35` publique RFC 9457) |
| Verificación de correo (envío) | SDK Firebase Auth `sendEmailVerification()` — no es HTTP a CAMEIA, y no pasa por el Gateway | — | — |

Notas:

- El diagrama confirma explícitamente que ni el login ni el envío de correos de Firebase pasan por
  el Gateway.
- La cabecera `X-User-Plan` que aparece en el diagrama para llamadas posteriores ("Caso A") **no**
  es responsabilidad del frontend implementarla — la deriva el Gateway del Custom Claim.
- `register.api.ts` es la primera llamada de esta feature a un endpoint propio de CAMEIA — necesita
  su handler en `mocks/handlers/auth.handlers.ts` (ya existía vacío, gana su primer handler real).
- Este contrato es más volátil que el de Login: `CM-35` sigue "En curso". Cuando publique su forma
  real, solo cambian `register.dto.ts` y `register.mapper.ts` (`ADR-0003`).
- **Confirmado 19-sep-2026** contra el código real de `cameia-cuentas` (adjuntado por el usuario:
  `UserRegistrationController`, `RegisterUserRequest`, `RegisteredUserResponse`,
  `RegisterUserService`, `Pronoun`): los nombres de campo de esta tabla, la forma de la respuesta
  `201`, y que `RegisterUserService.register()` puede lanzar tres excepciones de dominio distintas
  (`EmailAlreadyRegisteredException`, `InvalidBirthDateException`, `WeakPasswordException` — ver
  §3 y §4). El código exacto de error que acompaña a cada una en la respuesta `4xx` sigue sin
  publicarse (B-06).
- **Hallazgo fuera de alcance de esta iteración:** existe también
  `AccountActivationController` (`POST /api/v1/users/me/verification`, exige `X-User-Id`) que
  activa la cuenta (`PENDING_VERIFICATION` → `ACTIVE`) tras la verificación del correo. Verificar
  el correo del lado de Firebase no activa la cuenta por sí solo — hace falta esa llamada
  autenticada después. Es territorio de `HU-1.2` (fuera de esta SPEC); se deja anotado para cuando
  se aborde esa historia, no se implementa en `CM-34`.

## 6. Criterios de aceptación

| Criterio    | Qué hace el frontend que el criterio no dice |
| ----------- | ----------------------------------------------- |
| `CA-1.3.1`  | Estados concretos (spinner, `AlertInline`); valida formato de correo en cliente; persiste `emailVerified` en el store. |
| `CA-1.3.2`  | Mapea `auth/invalid-credential` (y otros `auth/*`) a una llave de `errors:*`, nunca el mensaje crudo del SDK. |
| `CA-1.1.1`  | Separa Nombre(s)/Apellido(s) en dos campos (Figma, no "nombre completo"); implementa el `Modal` de confirmación con copy provisional; distingue visualmente las cuatro causas de rechazo de fecha de nacimiento; encadena `signIn()` + `sendEmailVerification()` tras el `POST` exitoso, sin repetir lógica de Login. |
| `CA-1.1.2`  | Muestra, junto al mensaje de correo duplicado, el bloque de dos acciones ("Iniciar sesión" funcional, "Recuperar contraseña" deshabilitado) que dibuja Figma — el criterio solo pide el mensaje. |
| `CA-1.1.3`  | Extiende `utils/calculateAge.ts` con las guardas de fecha futura y >110 años, que hoy no existen; escribe el mensaje de ">110 años" (no viene literal en el backlog, queda marcado como propuesto). |

## 7. Estado de implementación

| Archivo | Qué implementa | Prueba |
| ------- | --------------- | ------- |
| `src/design-system/atoms/Logo/Logo.tsx` | Marca de Cameia, variantes `lockup`/`mark-only`, tono `default`/`inverse` | `Logo.test.tsx` |
| `src/design-system/icons/GoogleIcon.tsx`, `src/design-system/icons/svg/google.svg` | Ícono real de Google | — |
| `src/layouts/AuthLayout.tsx` | Panel de marca de dos columnas + colapso a una columna | `AuthLayout.test.tsx` |
| `src/stores/auth.store.ts`, `src/app/providers/AuthProvider.tsx` | `emailVerified` en `AuthUser` | `AuthProvider.test.tsx` |
| `src/features/auth/model/authErrorMessage.ts` | Código de `AuthError` → llave de i18n | `authErrorMessage.test.ts` |
| `src/features/auth/schemas/login.schema.ts` | Validación zod de `correo`/`contraseña` | — |
| `src/features/auth/organisms/LoginForm/LoginForm.tsx` | Formulario de Login | `LoginForm.test.tsx` |
| `src/features/auth/hooks/useLogin.ts` | Orquesta `signIn()`, error y redirección | `useLogin.test.tsx` |
| `src/features/auth/pages/LoginPage.tsx` | Compone `AuthLayout` + `LoginForm` | `LoginPage.test.tsx` |
| `src/features/auth/routes.tsx` | Ruta /ingresar → `LoginPage`; ruta /registro → `RegisterPage` | `src/app/router/index.test.tsx` |
| `src/features/auth/model/pronouns.ts` | Catálogo `PRONOUNS` (`HE`/`SHE`/`THEY`, enum real del backend) | — |
| `src/features/auth/schemas/register.schema.ts` | Validación zod de Registro, cuatro causas de `fechaNacimiento` + coincidencia de contraseñas | — |
| `src/features/auth/api/register.dto.ts`, `register.mapper.ts`, `register.api.ts` | POST a /api/v1/users sin sesión, provisional | — |
| `src/mocks/handlers/auth.handlers.ts` | Handler de POST a /api/v1/users (correo duplicado, fecha de nacimiento inválida) | `src/mocks/handlers/auth.handlers.test.ts` |
| `src/utils/calculateAge.ts` | Guardas `isFutureDate`/`isImplausiblyOld` | `calculateAge.test.ts` |
| `src/design-system/organisms/Modal/Modal.tsx` | Primer `Modal` del design system, `type=confirm` | `Modal.test.tsx` |
| `src/features/auth/organisms/RegisterForm/RegisterForm.tsx` | Formulario de Registro | `RegisterForm.test.tsx` |
| `src/features/auth/hooks/useRegister.ts` | Orquesta `registerUser` → `signIn()` → `sendEmailVerification()`, caso de borde de sesión | `useRegister.test.tsx` |
| `src/features/auth/pages/RegisterPage.tsx` | Compone `AuthLayout` + `RegisterForm` + `Modal` | `RegisterPage.test.tsx` |
| `src/services/firebase/auth.service.ts` | `sendEmailVerification()` nueva; `signUp()` retirado (`ADR-0006`) | — |

## 8. Bloqueos

| Id   | Qué falta                                                                                                  | De quién depende                       | Estado |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ----------- |
| B-01 | ~~Confirmar `/registro`~~ | — | **Resuelto:** existe en `ROUTES.registro`. |
| B-02 | Ticket Jira y `PRT` para `HU-1.10` (Google) | Product Owner / Scrum Master | Abierto — no bloquea. |
| B-03 | Dónde se renderiza el banner de correo no verificado (`CA-1.3.1`) | Decisión de Frontend | Abierto — `auth.store.ts` ya persiste `emailVerified`. |
| B-04 | ~~Estado real de `services/firebase/*`, `auth.store.ts`, `AuthLayout.tsx`~~ | — | **Resuelto.** |
| B-05 | ~~Breakpoints reales de `PRT-01.03`~~ | — | **Resuelto.** |
| B-06 | Código exacto de error de `POST /api/v1/users` para cada excepción de dominio (`EmailAlreadyRegisteredException`, `InvalidBirthDateException`, `WeakPasswordException`) y formato de error definitivo (RFC 9457) — los **nombres de campo del request/response ya se confirmaron** contra el código real, 19-sep-2026 | Backend (`CM-35`, en curso) | Abierto — `register.dto.ts`/`register.mapper.ts` absorben el cambio cuando se publique. |
| B-07 | Confirmar que la contraseña recibida transitoriamente en `POST /api/v1/users` no se persiste en ningún punto intermedio | Backend / Arquitectura | Abierto — pregunta de seguridad, no bloquea construir el formulario. |
| B-08 | Copy definitivo del `Modal` de confirmación de Plan Gratis — no hay instancia en Figma conectada a Registro | Producto / Diseño | Abierto — se usa el texto mínimo del backlog mientras tanto. |
| B-09 | ~~El catálogo de códigos de `pronombres`~~ | — | **Resuelto 19-sep-2026:** coincide con el enum real `tech.cameia.cuentas.domain.model.Pronoun` (`HE`/`SHE`/`THEY`). El campo del backend es `pronoun` (singular) y opcional; la obligatoriedad es solo regla de cliente. |
| B-10 | Discrepancia de nombre "pronombres" (backlog/UI) vs. "género" (documentación interna del componente Select en Figma) | Diseño | Abierto — no afecta el código, solo la documentación del componente en Figma. |
| B-11 | Mensaje literal para la causa ">110 años" de `fechaNacimiento` — el backlog no da el texto exacto | Producto | Abierto — se usa un texto propuesto, marcado como tal. |
| B-12 | Copy específico para contraseña rechazada por el backend (`WeakPasswordException`) — sin política de fuerza publicada ni texto de Producto | Backend / Producto | Abierto — cae al mensaje genérico (`errors:generico`) mientras tanto. |

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
  existen todavía, y de hecho ya no aplican bajo `ADR-0006` — los reemplaza el código provisional
  de CAMEIA para correo duplicado).
- El tratamiento "visible pero deshabilitado" para Google y recuperación de contraseña se extiende
  sin cambios al bloque de dos acciones del error de correo duplicado en Registro — mismo patrón,
  no un precedente nuevo.

---

## Anexo A · Mapa completo de la feature `auth` (conceptual, HE-01)

| HU       | Qué es                          | Jira    | PRT        | Sprint (backlog) | Estado en esta SPEC |
| -------- | ---------------------------------- | ------- | ---------- | ----------------- | ---------------------- |
| `HU-1.1` | Registro con correo/contraseña + datos personales | `CM-14` (historia) / `CM-34` (subtarea Frontend) | `PRT-01.01`| 1 | **Gobernada por esta SPEC — implementada** |
| `HU-1.2` | Verificación de correo electrónico | pendiente | `PRT-01.02`| 2 | Fuera de esta SPEC |
| `HU-1.3` | **Inicio de sesión**             | `CM-40` | `PRT-01.03`| 1                  | **Gobernada por esta SPEC — implementada** |
| `HU-1.4` | Recuperación de contraseña        | pendiente | `PRT-01.04`| 2                  | Fuera de esta SPEC |
| `HU-1.10`| Registro/login con Google         | pendiente | `[TBD]` (backlog) | 3          | Fuera de esta SPEC |

Subtareas hermanas de `CM-34` bajo `CM-14`: `CM-35` (Backend, `POST /api/v1/users`, en curso),
`CM-36` (asignación de Plan Gratis, en curso — título con error de copiado en Jira, análogo a
J-05/J-06), `CM-37` (pruebas de integración, por hacer — fuera del alcance del frontend).

## Anexo B · Diagrama de flujo de autenticación

Ver `ADR-0006`: el diagrama ya no es solo contexto de fondo para Login — es la fuente vigente de
arquitectura para el paso de creación de cuenta de Registro.

## Anexo C · Preguntas que esta SPEC no puede cerrar por sí sola

- B-06 a B-11 (arriba) son las vigentes. Ninguna bloquea construir la pantalla.
- ~~¿`RequireAuth` propaga la ruta de origen?~~ **Resuelto:** sí.