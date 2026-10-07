# CLAUDE.md — `cameia-web`

Contexto permanente para Claude Code. Léelo completo antes de cualquier cambio.
Si una instrucción de un prompt contradice este archivo, **gana este archivo** y avisa antes de continuar.

---

## 1. Qué es este repositorio

`cameia-web` es el **Cliente Web** de CAMEIA: una aplicación de práctica de entrevistas
laborales con IA para el mercado colombiano. Es una SPA que consume un **API Gateway**
(Spring Boot) y usa **Firebase Authentication** para identidad.

Consume, nunca implementa: la lógica de negocio, la generación de preguntas, la evaluación
y toda llamada a un LLM viven en el backend.

**Es una SPA pura, sin SSR ni Next.js.** Incluye una landing pública (`/`, PRT-00.01) para
usuarios sin sesión, pero eso no cambia la arquitectura: se resuelve con `react-helmet-async`
para `<title>`/Open Graph, no con renderizado en servidor. El resto de la app vive detrás de
login y no necesita ser indexable.

**Idioma del producto:** español de Colombia (`es-CO`). El inglés está previsto pero sin
copia aprobada todavía.

---

## 2. Stack — versiones exactas, sin `^`

Runtime: **Node 24 LTS** (`.nvmrc` = `24`) · Gestor: **pnpm 11.25.0** (`packageManager`).

**Node y pnpm son responsabilidad de quien desarrolla, no tuya.** Nunca intentes instalar,
actualizar o cambiar la versión de Node ni de pnpm del sistema — usa siempre la que ya esté
activa en la terminal. Si `node -v` no reporta 24.x al empezar una sesión, detente y dilo;
no continúes instalando dependencias sobre una versión distinta a la declarada aquí.
Todo lo demás de esta sección (React, Vite, TypeScript, etc.) sí lo instala `pnpm install`
automáticamente y en la versión exacta fijada en `package.json` y `pnpm-lock.yaml`, sin importar qué
hubiera antes en `node_modules`.

### dependencies

| Paquete                          | Versión |
| -------------------------------- | ------- |
| react                            | 19.2.8  |
| react-dom                        | 19.2.8  |
| react-router                     | 8.3.1   |
| @tanstack/react-query            | 5.102.8 |
| zustand                          | 5.0.15  |
| react-hook-form                  | 7.87.0  |
| @hookform/resolvers              | 5.9.1   |
| zod                              | 4.5.4   |
| i18next                          | 26.4.2  |
| react-i18next                    | 17.0.13 |
| i18next-browser-languagedetector | 8.2.1   |
| firebase                         | 12.18.0 |
| clsx                             | 2.1.1   |
| tailwind-merge                   | 3.6.0   |
| class-variance-authority         | 0.7.1   |
| lucide-react                     | 1.43.0  |
| react-helmet-async               | 3.0.0   |
| libphonenumber-js                | 1.13.13 |

### devDependencies

| Paquete                           | Versión |
| --------------------------------- | ------- |
| typescript                        | 6.0.3   |
| vite                              | 8.2.2   |
| @vitejs/plugin-react              | 6.1.1   |
| vite-plugin-svgr                  | 5.2.0   |
| tailwindcss                       | 4.3.3   |
| @tailwindcss/vite                 | 4.3.3   |
| @types/react                      | 19.2.18 |
| @types/react-dom                  | 19.2.7  |
| @types/node                       | 26.5.0  |
| vitest                            | 4.1.11  |
| @vitest/coverage-v8               | 4.1.11  |
| @vitest/ui                        | 4.1.11  |
| jsdom                             | 30.0.1  |
| @testing-library/react            | 16.3.3  |
| @testing-library/dom              | 10.4.1  |
| @testing-library/user-event       | 14.6.7  |
| @testing-library/jest-dom         | 7.0.1   |
| msw                               | 2.15.0  |
| eslint                            | 10.10.0 |
| @eslint/js                        | 10.0.1  |
| typescript-eslint                 | 8.70.0  |
| eslint-plugin-react-hooks         | 7.1.1   |
| eslint-plugin-react-refresh       | 0.5.6   |
| eslint-plugin-jsx-a11y            | 6.10.2  |
| eslint-plugin-boundaries          | 7.2.0   |
| eslint-import-resolver-typescript | 4.4.5   |
| @tanstack/eslint-plugin-query     | 5.102.8 |
| globals                           | 17.12.0 |
| prettier                          | 3.9.6   |
| prettier-plugin-tailwindcss       | 0.8.1   |
| husky                             | 9.1.7   |
| lint-staged                       | 17.5.0  |

**Fuente de verdad de las versiones.** `package.json` y `pnpm-lock.yaml` mandan; esta tabla es una
referencia y se resincroniza de vez en cuando (última vez: 6-oct-2026). El repositorio tiene
**Dependabot activo** (`.github/dependabot.yml`, configurado por DevOps): por eso subieron versiones
—`react-router` a 8.x y `@types/node` a 26.x, entre otras— sin que esta documentación se
actualizara, y pueden seguir subiendo. Esas versiones **se aceptan**. Una subida que rompa
`pnpm typecheck`, `pnpm lint` o `pnpm test` sí se revisa antes de fusionarla. La regla anterior
«`@types/node` 24.x, no 26.x» (y la línea equivalente de ADR-0002) quedó superada.

**Restricciones que sí siguen vigentes. No las cambies sin verificar los peers:**

- **TypeScript 6.0.3, nunca 7.x** mientras `typescript-eslint` lo exija: `typescript-eslint@8.70.0`
  declara `typescript: ">=4.8.4 <6.1.0"` (verificado en `node_modules` el 6-oct-2026).
- **`@testing-library/dom@10.4.1` va declarado explícitamente.** Es peer de `@testing-library/react` y de `jest-dom`.
- `eslint-plugin-jsx-a11y@6.10.2` emite un aviso de peer con ESLint 10. Es cosmético, se ignora.
- **`libphonenumber-js@1.13.13`, autorizada explícitamente el 19-sep-2026 (CM-34, seguimiento).**
  Necesaria para validar/formatear el celular internacional del Registro (`PhoneNumber.java` exige
  E.164 estricto, sin adivinar país) sin mantener a mano un catálogo de ~245 indicativos. No trae
  UI propia — el selector de país (`features/auth/organisms/PhoneField/`) se construye con los
  átomos existentes (`Select`/`Input`), solo se usa la librería para datos
  (`getCountries()`/`getCountryCallingCode()`) y validación (`isValidPhoneNumber`).
- **`husky@9.1.7` y `lint-staged@17.5.0`, autorizadas.** Son el hook de pre-commit
  (`.husky/pre-commit`): corre `prettier --write` y `eslint --fix` solo sobre los archivos del
  commit (configuración `lint-staged` en `package.json`). Estaban en el repositorio sin
  autorización escrita; esta línea la registra.
- **`eslint-import-resolver-typescript@4.4.5` es una excepción más a esta lista, ya autorizada.**
  `eslint-plugin-boundaries` solo resuelve imports relativos con su resolver interno
  (`eslint-import-resolver-node`, que ya trae empaquetado); un import con el alias `@/` lo ve
  como paquete externo no resuelto y la regla de fronteras nunca lo evalúa. Sin este resolver,
  `boundaries/dependencies` queda ciego a la convención de import principal del proyecto.
  Verificado con `boundaries/debug` y sondas reales antes de pedir permiso para instalarlo.

**No instales nada nuevo sin pedirlo primero.** En particular no instales: axios, styled-components,
Redux, Formik, moment, una librería de componentes (MUI, Chakra, shadcn), ni Playwright.

---

## 3. Reglas duras

Estas no se negocian. Si un cambio las rompe, no lo hagas y explica por qué.

1. **Ningún color literal en un componente.** Nada de `#24356B`, `bg-[#E8A33D]`, `rgb(...)`.
   Solo tokens: `bg-action-primary`, `text-text-muted`, `border-border-subtle`.
   Es la condición para que el modo oscuro futuro sea reapuntar tokens y no rehacer la UI.
2. **Ningún texto visible escrito en el código.** Todo string que ve un humano pasa por
   `t('namespace:llave')`. Sin excepciones, ni en placeholders, ni en `aria-label`, ni en mensajes de error.
3. **Nadie importa de `lucide-react` salvo `design-system/icons/registry.tsx`.** Está bloqueado
   por `no-restricted-imports`. Los iconos se consumen con `<Icon name="..." />`.
4. **Una feature nunca importa de otra feature.** Está bloqueado por `eslint-plugin-boundaries`.
   Si dos features necesitan lo mismo, sube a `design-system/`, `hooks/`, `stores/` o `utils/`.
5. **`design-system/` no conoce el dominio.** No importa de `features/`, `services/` ni `stores/`.
   Un componente del design system no sabe qué es una entrevista.
6. **Datos del servidor van en TanStack Query, no en Zustand.** Zustand es solo para estado
   de cliente (sesión de auth, preferencias, borradores de wizard). Nunca dupliques ahí una respuesta HTTP.
7. **Ninguna constante de negocio se hardcodea.** Número de turnos, límites de plan, duración de
   sesión: todo viene del backend. Si el backend no lo manda, se pide, no se inventa.
8. **Ninguna llamada a un LLM desde el frontend.** Nunca.
9. **Nada de `localStorage`/`sessionStorage` para datos sensibles.** Solo preferencias de UI
   y el último `profileId` usado, como conveniencia.

---

## 4. Estructura y responsabilidad de cada carpeta

Detalle completo y árbol objetivo en `docs/ARCHITECTURE.md`. Resumen:

```
src/
├── app/            arranque, providers, router, guards
├── design-system/  átomos, moléculas, organismos SIN dominio, tokens, iconos
├── layouts/        plantillas de página (AuthLayout, AppShell, WizardLayout, SessionLayout)
├── features/       organismos de dominio + páginas, una carpeta por contexto
├── services/       infraestructura: cliente HTTP, Firebase, queryClient
├── stores/         estado global de cliente (Zustand)
├── hooks/          hooks agnósticos de dominio
├── lib/            envoltorios de terceros
├── utils/          funciones puras con test al lado
├── i18n/           configuración y locales
├── mocks/          handlers de MSW
├── config/         env validado, feature flags
├── types/          tipos compartidos y DTO generados
└── styles/         CSS global y tokens
```

**Anatomía canónica de una feature.** Todas iguales, sin variaciones creativas:

```
features/<nombre>/
├── api/        <x>.api.ts · <x>.dto.ts (contrato crudo) · <x>.mapper.ts (DTO → modelo de UI)
├── model/      tipos de dominio, enums, máquinas de estado
├── schemas/    esquemas zod de los formularios
├── hooks/      hooks de la feature (queries, mutaciones, lógica)
├── organisms/  componentes con dominio
├── pages/      una página por PRT
├── store/      estado efímero de la feature (solo si hace falta)
└── routes.tsx
```

**Reglas de crecimiento:**

- Una carpeta vacía es deuda. **No crees carpetas sin al menos un archivo real.**
- Una feature se crea cuando entra su primera HU al sprint, no antes.
- Un componente sube a `design-system/` cuando lo usa una **segunda** feature. Antes vive donde nació.
- Un hook sube a `hooks/` cuando lo usa un **segundo** consumidor fuera de su feature.

---

## 5. Nombres

- **Componentes del design system: exactamente como en Figma**, en `PascalCase`.
  `button` → `Button`, `card-selectable` → `CardSelectable`, `badge-source` → `BadgeSource`,
  `chat-bubble` → `ChatBubble`, `otp-input` → `OtpInput`, `state-locked` → `StateLocked`.
  Y **las props se llaman como las variantes de Figma**: `variant`, `size`, `state`, `type`,
  `context`, `author`, `mode`.
- Archivos de componente: `PascalCase.tsx`. Hooks: `useAlgo.ts`. Utilidades: `camelCase.ts`.
- Tipos e interfaces sin prefijo `I` ni sufijo `Type`.
- Tokens CSS: `kebab-case` (`--action-primary-hover`).
- Llaves de i18n: `camelCase` (`asistente.pasos.ofertaYRol`), y `UPPER_SNAKE_CASE` cuando la llave
  es un código de dominio (`interview:modo.ENTRENO`). **Nunca kebab-case.** Los códigos BCP-47
  (`interview:idioma.es-CO`) llevan guion porque son código de dominio copiado tal cual, igual que
  `ENTRENO`; no son kebab-case. Detalle en §7.
- Ramas: `CM-<numero>-<descripcion-kebab-case>`, sin prefijo de tipo (resuelto 5-sep-2026, ver
  `cameia-perfil/AGENTS.md` §10.2). Commits: Conventional Commits, sin la clave Jira.

---

## 6. Tokens y estilos

La fuente de verdad de los tokens es el archivo de Figma
(`Cameia · Mockups MVP`, colecciones `primitives`, `semantic`, `spacing`, `radius`).

- `styles/primitives.css` → rampas crudas (`--indigo-500`, `--mustard-400`, `--neutral-50`...).
- `styles/semantic.css` → tokens que sí usa la UI (`--bg-canvas`, `--action-primary`, `--text-muted`...).
  Cada uno apunta a un primitivo, nunca a un hex.
- Tailwind 4 los expone con `@theme` en `styles/index.css`. **No hay `tailwind.config.js`.**
- Los estilos de texto de Figma (`text/display`, `text/h1`… `text/nav-active`) se replican como
  utilidades o como variantes de un componente `Text`, no repitiendo `text-[34px] leading-[36px]` por ahí.
- Elevación: `elevation/0` a `elevation/3` y `state/focus-ring` son tokens de sombra, no valores sueltos.
- **Unidades, tal como ya están en `semantic.css` e `index.css`:** espaciado en `rem`
  (`--space-4: 1rem`), radios en `px` (`--token-radius-md: 10px`), tamaño de fuente en `rem`
  (`--text-body: 1rem`), altura de línea **sin unidad** (`--text-body--line-height: 1.625`),
  espaciado entre letras en `em` (`--text-h1--letter-spacing: -0.02em`). No se mezclan.
- **Área táctil.** El mínimo 44×44 de §10 se resuelve con el token `--touch-target: 44px` en
  `semantic.css`, expuesto en `index.css` como `--spacing-touch-target` dentro de `@theme`. Genera
  `min-h-touch-target` y `min-w-touch-target` (junto con el resto de utilidades de la escala de
  espaciado bajo ese nombre, que simplemente no se usan). Ya reemplaza los ocho literales de 44 px
  de `Button` (md), `Input`, `Checkbox`, `Radio`, `Toggle`, `Combobox` y `PasswordField`. En
  `PasswordField` el uso no es área táctil sino reserva de ancho para el botón superpuesto (mismo
  token porque debe seguir su tamaño); documentado en el TSDoc del archivo.
  Los cuatro literales de tamaño de botón (`h/w-[52px]`, `h/w-[34px]`) siguen sin resolver: es una
  decisión aparte, no cubierta por este token. Evidencia:
  `docs/bitacora-ia/CM-100-convenciones-observadas.md` §2.1.

Regla de anidado de radios: un hijo siempre lleva un radio menor que su contenedor.

---

## 7. Internacionalización

- `es-CO` sigue siendo la fuente principal de copy, pero `en` ya no es solo un fallback: **desde
  CM-186 tiene recursos propios en `locales/en/`** (los 6 namespaces: `common`, `auth`, `errors`,
  `interview`, `landing`, `profile`), y cuando el idioma activo es inglés i18next los usa
  directamente. El copy en inglés es una traducción de trabajo, no una copia con revisión editorial
  cerrada — se ajusta llave por llave a medida que se revisa. `fallbackLng: 'es-CO'` sigue activo,
  pero para lo que de verdad resuelve: una llave puntual que todavía no se tradujo (una feature
  nueva construida solo en español), no el idioma completo como antes. El selector de idioma
  (`LanguageSwitcher`) ya es alcanzable desde dos sitios: la landing pública (`context="public-header"`,
  CM-186) y el menú de usuario autenticado (`context="menu-row"`, CM-194).
- Un namespace por feature: `common`, `auth`, `profile`, `interview`, `errors`, `landing`. (No existe
  `report`; se crea cuando entre su feature.)
- Llaves en `camelCase`; `UPPER_SNAKE_CASE` cuando la llave es un código de dominio; nunca
  kebab-case. Los códigos BCP-47 (`idioma.es-CO`) se copian tal cual porque son código de dominio,
  no llave inventada (`docs/GLOSSARY.md` §1, regla 3).
- **Los catálogos guardan códigos, no etiquetas.** Ejemplo obligatorio:

  ```ts
  export const ANSWER_FORMATS = ['TEXTO', 'AUDIO'] as const;
  // etiqueta visible = t(`interview:formaRespuesta.${codigo}`)
  ```

  Los códigos son los del glosario (`docs/GLOSSARY.md` §5). `VIDEO` **no** es un valor del
  enumerado: queda fuera del MVP y se muestra deshabilitado con «Próximamente» (decisión D-05), por
  eso su llave existe en `interview.json` sin estar en el catálogo. Cambiar un nombre visible debe
  ser editar un JSON, en un solo sitio.

- **Dos idiomas distintos, no los acoples:** el idioma de la interfaz (preferencia de UI) y
  `sesion_entrevista.idioma` (dato de negocio del entrevistador IA, formato BCP-47). Puede sugerirse
  uno como valor por defecto del otro, nada más.
- Fechas, números y duraciones con `Intl`, sobre el locale resuelto. Nunca formateo manual.

---

## 8. Datos, red y errores

- `services/http/httpClient.ts` es un envoltorio delgado de `fetch`. **No usamos axios.**
- El cliente adjunta el ID Token de Firebase (`await getIdToken()`) en cada petición y maneja el refresh.
- `services/http/errorMap.ts` traduce el cuerpo de error del backend a un `ApiError` tipado.
  **Contrato real, confirmado 19-sep-2026 (`ADR-0007`):** `ProblemDetail`, **RFC 7807** —
  `title`/`detail`/`status` estándar del RFC, más la extensión propia `errors: [{field, message}]`.
  Confirmado contra el código real de dos microservicios (`BusinessExceptionHandler.java` en
  `cameia-cuentas`, `ApiExceptionHandler.java` en `cameia-perfil`) y ya cerrado por el PO desde el
  11-sep-2026 (`docs/decisiones/11092026_v2_…`, «Cierre de TBD obsoletos», API-TBD-14) — el código
  simplemente no se había actualizado hasta esta fecha.
  **El backend no envía ningún código estable propio** (`codigoCameia`/`correlationId` de la
  propuesta original en `docs/referencias/03092026_v1_reglas-codigo-backend-cameia.md` §7.1 no
  llegaron a implementarse). **El frontend nunca renderiza `title`/`detail` crudos**: discrimina
  por `httpStatus` + `errors[].field` (cuando el backend lo etiqueta; no todas las excepciones lo
  hacen — p. ej. `EmailAlreadyRegisteredException`/`IllegalArgumentException` no traen `errors[]`),
  nunca por un código inventado por el mock ni por el propio frontend.
- Los DTO viven en `features/*/api/*.dto.ts` y se convierten a modelo de UI en `*.mapper.ts`.
  Ningún componente toca un DTO directamente.
- Mientras no exista el OpenAPI del backend, los DTO se escriben a mano y se marcan con
  `// PROVISIONAL — pendiente de OpenAPI` en la primera línea del archivo.
- Todo endpoint tiene su handler equivalente en `mocks/handlers/`.
- **Orden de construcción de una feature.** El contrato del backend es lo más volátil del
  proyecto, así que empezar por `api/` es empezar por lo que más cambia. El orden es:

  1. `model/` — tipos de dominio y catálogos de códigos, desde el glosario y el backlog.
  2. `schemas/` — validación zod de formularios.
  3. `organisms/` — con sus **hooks de interfaz** (estado del asistente, apertura de un panel,
     permiso del micrófono), escritos cuando el componente los necesita.
  4. `pages/` — contra datos simulados en `mocks/handlers/`.
  5. `api/` al final: `<x>.dto.ts`, `<x>.mapper.ts`, `<x>.api.ts`, junto con los **hooks de
     datos** (los que envuelven `useQuery`/`useMutation`), porque dependen del contrato.

  **El mapper es el cortafuegos:** todo lo que el backend pueda cambiar —nombre de un campo, forma
  de una colección, código de un enumerado— se detiene en `*.mapper.ts` y no llega a `model/` ni a
  los componentes (ADR-0003; `docs/GLOSSARY.md` §1, regla 2). Es la misma línea de corte que separa
  `SPEC.md` §4 (contrato observable, estable) de §5 (enlace HTTP, provisional), y es lo que permite
  construir la interfaz antes de que el contrato esté cerrado.

---

## 9. Pruebas

- Vitest + Testing Library + MSW. Los archivos van **al lado** del código: `Button.test.tsx`.
- Se prueba comportamiento observable, no implementación. Nada de snapshots de árboles enteros.
- Toda pantalla debe tener probado su **estado de error** y su **estado vacío**, no solo el camino feliz.
- Las pruebas de flujo end-to-end (Playwright) **no están en este repositorio**; son de Tester.

---

## 10. Accesibilidad

No es opcional y ya está especificada en el Figma:

- Área táctil mínima **44×44**, con separación de 8 entre zonas contiguas.
- El anillo de foco es un token único y **nunca se elimina**: `border/focus` 2px + halo 3px con offset 2.
- `prefers-reduced-motion` lleva las duraciones a 0 y convierte el estado «escuchando» en una
  onda estática con texto.
- Todo control tiene nombre accesible. Los errores de formulario se asocian con `aria-describedby`.

---

## 11. Alcance y estado de Sprint 1 (31-ago → 28-sep, cerrado)

Features que existen: `landing` (pública), `auth`, `professional-profile`, `interview-setup`,
`interview-session`, y un `home` mínimo para el shell autenticado. Solo las tres primeras tienen
código funcional; las otras tres son páginas placeholder (ver la tabla).

Rutas públicas, sin `RequireAuth`: `/` (landing, PRT-00.01), `/registro`, `/ingresar`. Con sesión
activa estas tres redirigen a `/inicio` (`RedirectIfAuthenticated`, `src/app/router/guards/RequireAuth.tsx`).
Todo lo demás vive detrás de `RequireAuth`, incluida `/inicio` (dashboard, PRT-00.02).

**No crees** `account`, `progress`, `evaluation-report`, `billing`, `usage` ni `job-offers`.
`job-offers` (HE-03) está fuera del alcance del MVP completo.

**Eran 13 subtareas** de frontend en el sprint. Los entregables incorporan la respuesta del PO del
11-sep-2026 (`docs/decisiones/11092026_v2_respuesta-decisiones-frontend-sprint-1.md`). La columna
«Estado» es el resultado al cierre (verificado contra `git log` y el código el 6-oct-2026):

| Jira  | HU   | Entregable                                                                                                                                                                                 | Estado                                |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| CM-34 | 1.1  | Formulario de registro con Firebase Auth · PRT-01.01                                                                                                                                       | Entregado (#47)                       |
| CM-40 | 1.3  | Inicio de sesión con Firebase Auth · PRT-01.03                                                                                                                                             | Entregado (#43)                       |
| CM-46 | 2.2  | Selección del método de configuración · PRT-02.02                                                                                                                                          | Entregado                             |
| CM-53 | 2.3  | Sección «Información General» · PRT-02.03                                                                                                                                                  | Entregado (#33)                       |
| CM-61 | 2.4  | Experiencia laboral **y educación**; la educación es **obligatoria** para activar el perfil (J-01) · PRT-02.03                                                                             | Entregado (#34)                       |
| CM-65 | 2.5  | Habilidades (texto libre + nivel) y finalizar · **sin expectativas**, fuera del MVP (D-02) · PRT-02.03                                                                                     | Entregado (#36)                       |
| CM-69 | 2.11 | Roles Objetivo **dentro del formulario del perfil**: consultar, agregar, sustituir y eliminar; de catálogo, sin prioridad ni reorden (D-01, J-03) · PRT-02.03. **PRT-02.07 sale del MVP.** | Entregado (#35)                       |
| CM-80 | 4.2  | Pasos Perfil / Oferta / Rol · PRT-04.02, 04.03, 04.06                                                                                                                                      | **Sin construir** (placeholder)       |
| CM-84 | 4.3  | Pasos Modo y Tono/Personalidad · PRT-04.07                                                                                                                                                 | **Sin construir** (placeholder)       |
| CM-85 | 4.3  | Forma de respuesta e Idioma · PRT-04.09                                                                                                                                                    | **Sin construir** (placeholder)       |
| CM-89 | 4.4  | Botón «Iniciar entrevista» con estado de carga · PRT-04.11                                                                                                                                 | **Sin construir** (placeholder)       |
| CM-93 | 4.5  | Pantalla de espera y error de la transición (J-04) · PRT-04.11                                                                                                                             | **Sin construir** (placeholder)       |
| CM-31 | 5.2  | Chat de turno, Entreno y Simulación · PRT-05.08, 05.10                                                                                                                                     | **Sin construir** (placeholder)       |

**7 de las 13 subtareas se entregaron; 6 no se construyeron.** CM-80, 84, 85, 89 y 93 viven en
`interview-setup` (`NewInterviewWizardPage`, `StartingSessionPage`, páginas placeholder con
`common:pendiente.*`) y CM-31 en `interview-session` (`InterviewSessionPage`, placeholder); no hay
contrato, DTO, mocks ni SPEC de entrevistas. `AppShell` ya enlaza «Entrenar» hacia el placeholder.

**Entregado y no listado en la tabla** (HU que se incorporaron o adelantaron después de escribirla):

| Jira   | HU      | Qué es                                                                                                                 | Estado           |
| ------ | ------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------- |
| CM-186 | 10.1    | Landing pública (PRT-00.01): header, hero, tarjetas, i18n ES/EN funcional, `<title>`/Open Graph                         | Entregado (#49)  |
| CM-194 | 1.8     | Cierre de sesión local con menú de usuario y confirmación (`CA-1.8.1`; la HU figura en Sprint 3 del backlog)            | Entregado (#51)  |
| CM-195 | —        | Perfil funcional: autoguardado de Información General, validación real contra el backend, un solo perfil por usuario    | Entregado (#52)  |

Con CM-195 la experiencia laboral pasó a **opcional** en el formulario; la educación sigue siendo
obligatoria para finalizar.

Landing (PRT-00.01) **sí tiene HU**: HU-10.1 / CM-186, ya implementada (D-03 resuelto para ella).
El Tablero (PRT-00.02, `/inicio`) **sigue sin HU**: es un `EmptyState` placeholder, no forma parte
del alcance comprometido hasta que el PO lo cree como historia. Se puede trabajar sobre los
prototipos aprobados, pero **no se asumen dentro del alcance comprometido** hasta que existan como
historias.

El asistente de configuración de sesión tiene **tres pasos**, no siete:
«Oferta y rol» → «Modo y tono» → «Idioma y forma de respuesta».

> **Sobre el backlog.** Hasta la entrega del frontend (2026-10-06) el trabajo se hizo contra versiones
> anteriores del backlog (las que indica el front-matter `backlog` de cada `SPEC.md`). Existe una
> versión más reciente, `05102026_01_Backlog.xlsx` (v4, con la hoja «Cambios v4»), que llegó
> después, **no se tuvo en cuenta en lo ya construido y no se cruzó contra el código**. El backlog
> sigue cambiando: el equipo debe contrastar cada `SPEC.md` con la versión vigente antes de tocar su
> feature (§16).

---

## 12. Contradicciones: resueltas y abiertas

Lo resuelto se aplica sin preguntar y se cita por su fuente. Lo abierto **no se resuelve
escribiendo código**: si el trabajo lo toca, para y pregunta.

**Resueltas** (fuentes: `docs/GLOSSARY.md`; `docs/decisiones/11092026_v2_…`):

1. **Estados de sesión.** Oficiales: `CONFIGURADA`, `EN_CURSO`, `EVALUANDO`, `FINALIZADA`,
   `ABANDONADA` (`GLOSSARY` §5). No se añade ninguno del DDL histórico.
2. **Idioma de sesión.** BCP-47, `es-CO` por defecto (`GLOSSARY` §5). Sigue siendo un dato de
   negocio distinto del idioma de la interfaz (§7).
3. **Estados de perfil.** El perfil se crea en `IN_PROGRESS` y la finalización va directo a
   `COMPLETED`. No existe `PENDING`; `IN_REVIEW` queda fuera del flujo manual y en Sprint 1 ningún
   perfil lo alcanza ni aparece en listados (T-02; `GLOSSARY` §3).
4. **Voz.** Aparece **visible pero deshabilitada**, con etiqueta «Próximamente», y **Texto queda
   preseleccionado**. En Sprint 1 no hay captura ni transcripción (HU-5.8 es Sprint 2) (D-04).
5. **Video.** Fuera del MVP. Se muestra deshabilitado con «Próximamente», alineado visualmente con
   el tratamiento de la voz (D-05).
6. **Valores del nivel de habilidad** (`SkillLevel`): `BASIC`, `INTERMEDIATE`, `ADVANCED`
   (`docs/decisiones/13092026_v1_…`, C-06; ya en `profile.types.ts`).
7. **Idioma de los enumerados de Entrevistas.** No cambia: los códigos de sesión, modalidad y forma
   de respuesta siguen en español (`docs/decisiones/13092026_v1_…`, C-08; `GLOSSARY` §5). No se
   rehacen traducciones ni referencias a la máquina de estados de sesión. (Perfil Profesional sí usa
   enumerados en inglés, tal como los publica el backend.)

**Abiertas — para y pregunta:**

1. **Origen del contrato de la API — parcial.** C-01 (13-sep) fijó la fuente: el código de
   MicroPerfilPro y su OpenAPI generado. Los nombres de campo se alinearon con el backend real
   (20-sep), pero el JSON de OpenAPI **no está versionado en el repo** y los DTO siguen marcados
   `// PROVISIONAL — pendiente de OpenAPI` (§8). Los nombres de `GLOSSARY` §2 aún dicen `pendiente`.
2. **Identidad por cabecera `X-User-Id`.** C-02 (13-sep): el diseño previsto es que el **Gateway**
   verifique el token de Firebase y propague el UID en esa cabecera; no la envía el navegador. Queda
   remitida a Arquitectura la confirmación del esquema definitivo y la fecha de configuración del
   Gateway, sin respuesta.
3. *(Movida a Resueltas 6. El número se conserva porque otros documentos citan «abierta N».)*
4. **Textos en español de los niveles educativos** `TECHNICAL`, `UNDERGRADUATE`, `POSTGRADUATE`.
   Los niveles están confirmados (C-07); las etiquetas Técnico/Pregrado/Posgrado de `profile.json`
   son propuesta de Frontend **sin aprobación registrada** de Producto.
5. *(Movida a Resueltas 7.)*
6. **Verificación de correo.** HU-1.2 no está en Sprint 1 pero el registro debería redirigir allí.
   Sin decisión escrita.
7. **Autocompletar con IA.** El selector de método (CM-46) ofrece esa ruta, pero HU-2.6 a HU-2.10
   son Sprint 2. Se renderiza deshabilitada. Sin decisión escrita.
8. **Tablero.** **Resuelto para la Landing** (PRT-00.01, `/`): el PO la incorporó al backlog como
   CM-186/HU-10.1, ya implementada. PRT-00.02 (`/inicio`) sigue sin HU; hasta que el PO la cree, no
   forma parte del alcance comprometido (D-03).
9. **Referencias a prototipos.** La lista de PRT del backlog puede estar desactualizada frente a
   Figma (S-02). Los frames mandan; solo se construyen las pantallas efectivamente dibujadas.
10. **Destino de PRT-02.07 y su ruta — parcial.** C-04 (13-sep) respondió: HU-2.10 sigue en
    Sprint 2, se retira la pantalla PRT-02.07 y la sugerencia de roles con IA irá *dentro* del
    formulario de PRT-02.03. Lo que no está escrito es cuándo se borra la página:
    `ProfileRolesPage.tsx` (placeholder) y la ruta `/perfiles/:id/roles` **se conservan hasta
    HU-2.10** y no se borran antes.

**Anotación — nombres de tipos vs. glosario.** `docs/GLOSSARY.md` §2 nombra tipos
(`ProfessionalProfile`, `WorkExperience`, `Education`, `Skill`, `TargetRole`) que en el código se
llaman `Profile`, `WorkExperienceItem`, `EducationItem`, `SkillItem` y `TargetRoleItem`
(`features/professional-profile/model/profile.types.ts`). Está **pendiente de decidir** si se
renombra el código o se corrige el glosario; hasta entonces no se renombra nada por cuenta propia.

---

## 13. Cómo trabajar en este repositorio

- Antes de tocar código de una feature, lee su `SPEC.md` (§16).
- **Antes de tocar código de una pantalla con prototipo (cualquier `PRT-XX.XX`), ábrelo y
  revísalo en vivo en Figma** (`get_metadata` para ubicar el frame exacto por su nombre, luego
  `get_design_context` con la skill `figma-design-to-code` cargada primero) — layout, componentes
  usados, copy literal y estados. **Que `SPEC.md`, un ADR o un commit anterior ya describan el
  diseño no es evidencia de que alguien lo comprobó contra Figma esa vez.** CM-53 se construyó
  completo (organismo, página, mocks, pruebas, 4 commits) asumiendo un asistente por pasos
  (`WizardLayout`) porque así lo describía la documentación heredada, sin abrir el archivo real;
  el prototipo real de PRT-02.03 es una sola página con índice de secciones (`step-list` en
  desktop, acordeón en `sm`) y una barra de acciones compartida — nada de wizard paginado. Hubo
  que revertir y rehacer. Incidente completo en
  `docs/bitacora-ia/hallazgo-figma-no-revisado-cm53.md`. Si no hay una URL de Figma con `node-id`
  a la mano, se pide antes de escribir código, no después.
- Antes de escribir código, mira si el componente ya existe en `design-system/`.
- Antes de crear un archivo, mira si su carpeta ya tiene la convención definida arriba.
- Cambios grandes: propón el plan y espera confirmación antes de generar archivos.
- Al terminar, corre `pnpm typecheck && pnpm lint && pnpm test` y reporta el resultado real.
- No dejes `TODO` sin un identificador Jira asociado.
- No dejes código muerto, comentado o «por si acaso».

---

## 14. Estándares de código

Estas reglas no son aspiración: se midieron sobre el código de `src/` cuando se escribieron
(evidencia, con comandos y archivo:línea, en `docs/bitacora-ia/CM-100-convenciones-observadas.md`
§1; foto del 11-sep-2026, cuando `src/` era bastante más chico que hoy). Código nuevo que las rompa
es un defecto, no un estilo distinto.

1. **Idioma.** Identificadores —variables, funciones, tipos, archivos, carpetas, el nombre de
   cada `describe`— en **inglés**. Todo lo que lee una persona —TSDoc, comentarios, el nombre de
   cada `it`, llaves y valores de traducción, documentación— en **español**. La frontera es simple:
   si lo lee el compilador, inglés; si lo lee una persona, español.
2. **Componentes con `export function`.** Ni arrow functions para componentes, ni
   `export default`. Única excepción vigente: `src/i18n/index.ts` exporta la instancia de i18next
   por defecto porque la integración con `react-i18next` lo impone. Una excepción nueva solo si una
   librería la exige, y se anota en el TSDoc del archivo.
3. **Imports en tres grupos, sin línea en blanco entre ellos:** externos → alias `@/` →
   relativos. Es convención observada, no regla de ESLint (no hay `import/order` configurado):
   el revisor la mira.
4. **`import type { X } from '…'`** (completo) cuando el import es solo de tipos.
   **`import { valor, type X } from '…'`** (inline) cuando se mezcla con valores. Ejemplo real:
   `errorMap.ts` línea 8.
5. **Las interfaces y tipos `*Props` no se exportan.** El componente es la superficie pública;
   sus props se leen en el archivo del componente.
6. **Barriles `index.ts` en tres sitios:** la carpeta de cada componente del design system
   (`atoms/Button/index.ts`), la raíz de cada feature (`features/auth/index.ts`) y la carpeta de cada
   organismo de feature (`features/auth/organisms/LoginForm/index.ts`). Dos excepciones puntuales:
   `src/i18n/index.ts` (inicializa i18next y exporta la instancia, ver 14.2) y
   `src/mocks/handlers/index.ts` (reúne los handlers de MSW). No hay barril de
   categoría (`atoms/index.ts`, `design-system/index.ts`) ni de carpeta técnica (`hooks/`, `utils/`,
   `services/`, `stores/`). Se importa el archivo concreto: `@/utils/cn`, `@/hooks/useDebounce`,
   `@/stores/auth.store`.
7. **El design system no llama a `useTranslation`.** Todo texto visible —etiqueta, `aria-label`,
   placeholder, gerundio de carga— entra como **prop obligatoria, sin valor por defecto**. `Button`
   exige `children`, y con `loading` exige `loadingLabel`; no inventa un «Cargando…».
   **Por qué, porque no es evidente:** es lo que permite reutilizar el design system **fuera de
   esta aplicación** —otro producto, un catálogo de componentes aislado, una prueba unitaria— sin
   arrastrar i18next ni sus catálogos. El componente no sabe qué dice ni en qué idioma, solo dónde
   lo pone. Es la misma razón por la que no conoce el dominio (§3.5): un design system que importa
   traducciones de CAMEIA ya no es un design system, es una feature.
8. **Pruebas.** `describe` con el identificador bajo prueba, en inglés: `describe('Button')`,
   `describe('mapErrorResponse')`. `it` en español, conjugado en tercera persona, sin «should» ni
   «debería»: `it('redirige a /ingresar cuando no hay sesión')`. El archivo de prueba es hermano
   del archivo probado (`Button.test.tsx` junto a `Button.tsx`); nunca carpetas `__tests__`.

---

## 15. Documentación del código: TSDoc

**TSDoc es obligatorio en TODOS los archivos de `src/`, en la línea 1, antes de los imports.**
Un archivo sin cabecera está incompleto aunque compile y pase las pruebas. La única marca que puede
ir antes es `// PROVISIONAL — …` (§8), y el TSDoc va inmediatamente después.

Hay **dos dialectos según el tipo de archivo**, y no se mezclan:

| Tipo de archivo                             | Lleva                                                                                                                  | No lleva                                                                                           |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Módulo con lógica (store, config, servicio) | Prosa que explica **por qué existe y qué decisión encierra**                                                           | —                                                                                                  |
| Componente de UI                            | Prosa en la cabecera, **más una línea sobre cada prop dentro de la interfaz**                                          | `@param` y `@returns`: documentar que un componente recibe props y devuelve JSX no informa de nada |
| Hook o función pura                         | Prosa, **más `@param`, `@returns` y `@throws`** cuando aplique (`useDebounce.ts`)                                      | —                                                                                                  |
| Barril `index.ts`                           | Qué expone y **qué deja deliberadamente fuera**                                                                        | —                                                                                                  |
| Prueba `*.test.ts(x)`                       | **Qué regla o contrato protege, y de dónde sale esa regla** (sección de este archivo, CA del backlog, decisión del PO) | —                                                                                                  |

Los comentarios dentro del cuerpo explican **por qué**, nunca **qué**; si hay que explicar qué hace,
el nombre está mal. Sin `TODO` sin clave Jira y sin código comentado (§13).

**Convención de citas.** Cuando un comentario justifica algo con una regla, la cita con la forma
exacta que ya usa el código:

- Las **reglas duras** se citan `§3.N`: `CLAUDE.md §3.2` (ningún texto visible en el código),
  `§3.6` (datos del servidor en TanStack Query, no en Zustand), `§3.7` (ninguna constante de
  negocio hardcodeada).
- Las **secciones** por su número: `§7`, `§14`, `§16`.
- Las fuentes externas por documento: `ADR-0003`, `GLOSSARY §3`, `decisiones/11092026 D-04`,
  `CA-2.11.3`.
- Cuidado con §6: es «Tokens y estilos». La regla de Zustand y Query es `§3.6`, no `§6`.

**PENDIENTE — paso 3 (documentación):** verificado el 6-oct-2026, ningún barril ni prueba carece de
cabecera en la línea 1. Lo que queda: **7 archivos fuente** con la cabecera después de los imports
(`src/utils/cn.ts` y los seis `src/features/*/routes.tsx`) y **un comentario obsoleto** en
`src/stores/auth.store.ts` (líneas 5-6: dice que `app/providers/` no existe, y existe).

---

## 16. Contrato con las especificaciones

Cada feature tiene un **`SPEC.md` en su raíz** (`features/<nombre>/SPEC.md`). Es la descripción
viva de lo que la feature hace, en el vocabulario del glosario, con sus cuatro estados por pantalla
y su estado de implementación archivo por archivo.

- **Antes de tocar código de una feature se lee su SPEC.**
- **Si el cambio altera el comportamiento descrito ahí, el SPEC se actualiza en el mismo
  commit**, y el humano lo aprueba en el Pull Request. Un PR que cambia comportamiento sin tocar
  el SPEC está incompleto.

**Reglas de autoridad, con todas las letras:**

- **El comportamiento lo fija el backlog. El diseño lo fija Frontend.**
- Cuando el SPEC y Figma difieren en **diseño**, **manda el SPEC** y Figma se actualiza después.
- Cuando difieren en **comportamiento**, **manda el backlog, siempre.**
- Toda diferencia consciente respecto a Figma o al backlog se anota en el SPEC (§9 de la
  plantilla), con su razón.

**Dónde vive cada cosa:**

| Documento                         | Qué es                                                                                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/_plantilla-feature/SPEC.md` | **La forma.** Encabezado que lee `pnpm spec:check`, nueve secciones, cuatro estados obligatorios por pantalla.                                                         |
| `docs/GLOSSARY.md`                | **La tabla de vocabulario** glosario ↔ código ↔ contrato ↔ i18n ↔ enumerado. El término del glosario manda; la traducción ocurre en el mapper, nunca en un componente. |
| `docs/adr/`                       | **La memoria de decisiones** estructurales. Un ADR no se edita para cambiar de opinión: se escribe otro que lo sustituye.                                              |
| `docs/decisiones/`                | **Lo que el PO resolvió por fuera del backlog**, por escrito y con fecha. Cada SPEC lista en `decisiones` los que lo modifican.                                        |
| `docs/bitacora-ia/`               | Evidencia de sesiones asistidas por IA (CONTRIBUTING §Uso de IA).                                                                                                      |

`pnpm spec:check` ya existe (`package.json`) y corre en CI (`.github/workflows/validar-specs.yml`).
Solo valida el encabezado, el estado, las rutas, los archivos citados con ruta completa y el campo
`backlog`; no comprueba las nueve secciones ni los cuatro estados por pantalla.

A 6-oct-2026, **3 de las 6 features tienen `SPEC.md`**: `auth`, `landing` y `professional-profile`,
las tres en `EN_CURSO`. `home`, `interview-setup` e `interview-session` no tienen el suyo. El estado
real, por feature, se rastrea en `docs/SPEC-INDEX.md` (regenerado por `pnpm spec:check --write`),
no aquí.

Los SPEC se escribieron contra versiones anteriores del backlog (campo `backlog` del encabezado);
existe una versión más reciente que no se revisó (nota en §11). Contrasta el SPEC con el backlog
vigente antes de tocar la feature.

---

## 17. Pendientes de este archivo

Reglas de arriba que describen algo que **todavía no se cumple en el código**. No se suavizan ni se
borran: cada una tiene el paso que la resuelve. Revisado el 6-oct-2026 (las filas que ya se
cumplían —`api/`, `*.dto.ts`, `*.mapper.ts`, anatomía de las features con historias, TSDoc masivo— se
retiraron). Evidencia histórica en `docs/bitacora-ia/CM-100-convenciones-observadas.md` §3.

| Regla                                      | Qué falta en el código                                                                                                          | Paso que lo resuelve                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| §6 tamaños de botón 52/34 px               | 4 literales en `Button.tsx`; `size="sm"` mide 34 px, por debajo del 44×44 de §10                                                | decisión aparte, sin resolver                                                |
| §15 TSDoc en línea 1 de todos los archivos | 7 archivos con la cabecera tras los imports (`src/utils/cn.ts` y los 6 `src/features/*/routes.tsx`); comentario obsoleto en `src/stores/auth.store.ts` líneas 5-6 | paso 3 (documentación)                                                       |
| §11 PRT-02.07 fuera del MVP                | `ProfileRolesPage.tsx` (placeholder) y la ruta `/perfiles/:id/roles` existen; nada enlaza a ellas                               | se conservan hasta HU-2.10 (§12 abierta 10, C-04 respondido)                 |
