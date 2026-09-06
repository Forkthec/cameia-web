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
automáticamente y en la versión exacta indicada, sin importar qué hubiera antes en `node_modules`.

### dependencies

| Paquete | Versión |
|---|---|
| react | 19.2.8 |
| react-dom | 19.2.8 |
| react-router | 7.18.3 |
| @tanstack/react-query | 5.102.8 |
| zustand | 5.0.15 |
| react-hook-form | 7.87.0 |
| @hookform/resolvers | 5.9.1 |
| zod | 4.5.4 |
| i18next | 26.4.2 |
| react-i18next | 17.0.13 |
| i18next-browser-languagedetector | 8.2.1 |
| firebase | 12.18.0 |
| clsx | 2.1.1 |
| tailwind-merge | 3.6.0 |
| class-variance-authority | 0.7.1 |
| lucide-react | 1.38.0 |
| react-helmet-async | 3.0.0 |

### devDependencies

| Paquete | Versión |
|---|---|
| typescript | 6.0.3 |
| vite | 8.2.2 |
| @vitejs/plugin-react | 6.1.1 |
| vite-plugin-svgr | 5.2.0 |
| tailwindcss | 4.3.3 |
| @tailwindcss/vite | 4.3.3 |
| @types/react | 19.2.18 |
| @types/react-dom | 19.2.7 |
| @types/node | 24.13.3 |
| vitest | 4.1.11 |
| @vitest/coverage-v8 | 4.1.11 |
| @vitest/ui | 4.1.11 |
| jsdom | 30.0.1 |
| @testing-library/react | 16.3.3 |
| @testing-library/dom | 10.4.1 |
| @testing-library/user-event | 14.6.7 |
| @testing-library/jest-dom | 7.0.1 |
| msw | 2.15.0 |
| eslint | 10.9.1 |
| @eslint/js | 10.0.1 |
| typescript-eslint | 8.69.0 |
| eslint-plugin-react-hooks | 7.1.1 |
| eslint-plugin-react-refresh | 0.5.6 |
| eslint-plugin-jsx-a11y | 6.10.2 |
| eslint-plugin-boundaries | 7.2.0 |
| eslint-import-resolver-typescript | 4.4.5 |
| @tanstack/eslint-plugin-query | 5.102.8 |
| globals | 17.12.0 |
| prettier | 3.9.6 |
| prettier-plugin-tailwindcss | 0.8.1 |

**Restricciones que explican estas versiones. No las cambies sin verificar los peers:**

- **TypeScript 6.0.3, nunca 7.x.** `typescript-eslint@8.69.0` declara `typescript: ">=4.8.4 <6.1.0"`.
- **`@types/node` 24.x, no 26.x.** Los tipos deben corresponder al runtime.
- **`@testing-library/dom@10.4.1` va declarado explícitamente.** Es peer de `@testing-library/react` y de `jest-dom`.
- `eslint-plugin-jsx-a11y@6.10.2` emite un aviso de peer con ESLint 10. Es cosmético, se ignora.
- **`eslint-import-resolver-typescript@4.4.5` es la única excepción a esta lista, ya autorizada.**
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
- Tokens y llaves de i18n: `kebab-case` / `camelCase` según la convención ya establecida en cada archivo.
- Ramas: `CA-<numero>-<descripcion-kebab-case>`. Commits: Conventional Commits, sin la clave Jira.

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

Regla de anidado de radios: un hijo siempre lleva un radio menor que su contenedor.

---

## 7. Internacionalización

- `es-CO` es el idioma completo. `en` existe como estructura y **hereda de `es-CO`** mientras no
  haya copia aprobada; eso es intencional, no un bug.
- Un namespace por feature: `common`, `auth`, `profile`, `interview`, `report`, `errors`.
- **Los catálogos guardan códigos, no etiquetas.** Ejemplo obligatorio:

  ```ts
  export const TONOS = ['PROFESIONAL_NEUTRO', 'CALIDO', 'ESTRICTO', 'MOTIVADOR'] as const;
  // etiqueta visible = t(`interview:tono.${codigo}`)
  ```

  Cambiar un nombre visible debe ser editar un JSON, en un solo sitio.
- **Dos idiomas distintos, no los acoples:** el idioma de la interfaz (preferencia de UI) y
  `sesion_entrevista.idioma` (dato de negocio del entrevistador IA, formato BCP-47). Puede sugerirse
  uno como valor por defecto del otro, nada más.
- Fechas, números y duraciones con `Intl`, sobre el locale resuelto. Nunca formateo manual.

---

## 8. Datos, red y errores

- `services/http/httpClient.ts` es un envoltorio delgado de `fetch`. **No usamos axios.**
- El cliente adjunta el ID Token de Firebase (`await getIdToken()`) en cada petición y maneja el refresh.
- `services/http/errorMap.ts` traduce el formato común de error del backend a errores tipados de dominio.
  **El frontend nunca renderiza el `message` crudo del backend**: usa el `code` estable como llave de i18n.
- Los DTO viven en `features/*/api/*.dto.ts` y se convierten a modelo de UI en `*.mapper.ts`.
  Ningún componente toca un DTO directamente.
- Mientras no exista el OpenAPI del backend, los DTO se escriben a mano y se marcan con
  `// PROVISIONAL — pendiente de OpenAPI` en la primera línea del archivo.
- Todo endpoint tiene su handler equivalente en `mocks/handlers/`.

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

## 11. Alcance real de Sprint 1 (31-ago → 28-sep)

Solo estas features existen todavía: `landing` (pública), `auth`, `professional-profile`,
`interview-setup`, `interview-session`, y un `home` mínimo para el shell autenticado.

Rutas públicas, sin `RequireAuth`: `/` (landing, PRT-00.01), `/registro`, `/ingresar`.
Todo lo demás vive detrás de `RequireAuth`, incluida `/inicio` (dashboard, PRT-00.02).

**No crees** `account`, `progress`, `evaluation-report`, `billing`, `usage` ni `job-offers`.
`job-offers` (HE-03) está fuera del alcance del MVP completo.

Subtareas de frontend en el sprint:

| Jira | HU | Entregable |
|---|---|---|
| CM-34 | 1.1 | Formulario de registro con Firebase Auth · PRT-01.01 |
| CM-40 | 1.3 | Inicio de sesión con Firebase Auth · PRT-01.03 |
| CM-46 | 2.2 | Selección del método de configuración · PRT-02.02 |
| CM-53 | 2.3 | Sección «Información General» · PRT-02.03 |
| CM-61 | 2.4 | Experiencia laboral **y educación** · PRT-02.03 |
| CM-65 | 2.5 | Habilidades, expectativas y finalizar · PRT-02.03 |
| CM-69 | 2.11 | Gestión de roles objetivo · PRT-02.07 |
| CM-80 | 4.2 | Pasos Perfil / Oferta / Rol · PRT-04.02, 04.03, 04.06 |
| CM-84 | 4.3 | Pasos Modo y Tono/Personalidad · PRT-04.07 |
| CM-85 | 4.3 | Forma de respuesta e Idioma · PRT-04.09 |
| CM-89 | 4.4 | Botón «Iniciar entrevista» con estado de carga · PRT-04.11 |
| CM-93 | 4.5 | Pantalla de espera y error de la transición · PRT-04.11 |
| CM-31 | 5.2 | Chat de turno, Entreno y Simulación · PRT-05.08, 05.10 |

El asistente de configuración de sesión tiene **tres pasos**, no siete:
«Oferta y rol» → «Modo y tono» → «Idioma y forma de respuesta».

---

## 12. Contradicciones conocidas — no las resuelvas por tu cuenta

Si el trabajo toca alguna de estas, **para y pregunta**:

1. **Audio.** PRT-04.09 preselecciona AUDIO, pero HU-5.8 es Sprint 2 y el backend no procesa audio
   todavía. Hasta que haya decisión, AUDIO se renderiza deshabilitado con etiqueta «Próximamente».
2. **Verificación de correo.** HU-1.2 no está en Sprint 1 pero el registro debería redirigir allí.
3. **Autocompletar con IA.** El selector de método (CM-46) ofrece esa ruta, pero HU-2.6 a HU-2.10
   son Sprint 2. Se renderiza deshabilitada.
4. **Estados de sesión.** El backlog, el DDL y el diagrama de clases dan tres catálogos distintos.
   Usa el que devuelva el backend, no inventes el enum.
5. **Landing y Dashboard.** PRT-00.01 (`/`) y PRT-00.02 (`/inicio`) están dibujados y el login
   redirige al segundo, pero ninguno de los dos tiene HU en el backlog.
6. **Matriz de trazabilidad del Figma.** Está desactualizada respecto a los frames. Los frames mandan.

---

## 13. Cómo trabajar en este repositorio

- Antes de escribir código, mira si el componente ya existe en `design-system/`.
- Antes de crear un archivo, mira si su carpeta ya tiene la convención definida arriba.
- Cambios grandes: propón el plan y espera confirmación antes de generar archivos.
- Al terminar, corre `pnpm typecheck && pnpm lint && pnpm test` y reporta el resultado real.
- No dejes `TODO` sin un identificador Jira asociado.
- No dejes código muerto, comentado o «por si acaso».
