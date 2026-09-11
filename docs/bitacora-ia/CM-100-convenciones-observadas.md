# Bitácora IA · CM-100 · Convenciones observadas en `src/`

- **Fecha:** 11 de septiembre de 2026
- **Herramienta:** Claude Code (Opus 5), sesión de planificación y ejecución del paso «formalizar
  estándares de código en `CLAUDE.md`»
- **Rama:** `feat/CM-100-estructura-inicial`, sobre el commit `f87337f`
- **Responsable de la comprobación:** Juan Diego Gómez Garcés — Frontend
- **Para qué existe:** es la evidencia de las reglas de `CLAUDE.md` §14, §15 y §17 y de los pasos
  siguientes de documentación y tokens. CONTRIBUTING.md exige evidencia enlazada sobre un SHA
  identificado; este archivo es esa evidencia. Se conserva en `docs/bitacora-ia/` porque es salida
  de una sesión de IA sin original externo.

Todo lo que sigue se midió con los comandos que se citan, sobre el árbol de trabajo en el momento
indicado. Nada se dedujo de memoria. Cada desviación lleva archivo y línea para que se pueda
verificar con `sed -n '<línea>p' <archivo>`.

---

## 0. Universo medido

`src/` contiene **189 archivos**:

| Grupo                                       | Cantidad | Sobre qué se mide                                         |
| ------------------------------------------- | -------: | --------------------------------------------------------- |
| `.ts` / `.tsx` fuente                       |  **121** | convenciones de código (§1) y de documentación (§2.2–2.5) |
| `.ts` / `.tsx` de prueba                    |   **51** | convenciones de pruebas (§1.8) y documentación (§2.3)     |
| `vite-env.d.ts`                             |        1 | fuera de toda medición                                    |
| `.json` de `i18n/locales/`                  |       10 | convenciones de i18n (§1.10)                              |
| `.css` de `styles/`                         |        3 | unidades de tokens (§1.9)                                 |
| `.md` (`README` de i18n, stores, icons/svg) |        3 | fuera de toda medición                                    |

Comandos:

```sh
find src -type f | wc -l                                                          # 189
find src -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.test.*' ! -name '*.d.ts' | wc -l   # 121
find src -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) | wc -l           # 51
```

**Cuando este documento dice «todos los archivos» se refiere a los 172 `.ts/.tsx` (121 + 51).**
Cualquier otra cifra declara su propio universo.

---

## 1. Convenciones cumplidas sin excepción

Una subsección por regla de `CLAUDE.md` §14. Cada una con el comando, el resultado y las
excepciones (si las hay).

### 1.1 Identificadores en inglés; prosa en español

- **Medición:** lectura de los 52 `describe` (§1.8), de los nombres de archivo del árbol completo y
  de una muestra de módulos (`Button.tsx`, `errorMap.ts`, `i18n/config.ts`, `useDebounce.ts`,
  `auth.store.ts`, `routes.ts`).
- **Resultado:** identificadores, archivos y carpetas en inglés sin excepción. TSDoc, comentarios,
  nombres de `it` y valores de traducción en español sin excepción.

### 1.2 Componentes con `export function`, sin `export default`

```sh
grep -rnE "^export const [A-Z][A-Za-z]+ = \(" src        # 0 resultados
grep -rn "export default" src                             # 1 resultado
```

- **Resultado:** 0 componentes exportados como arrow function. 1 `export default`:
  `src/i18n/index.ts:53` (`export default i18next;`), impuesto por la integración con
  `react-i18next`. Es la única excepción y queda justificada por la librería.

### 1.3 Imports en tres grupos (externo → alias `@/` → relativo) sin línea en blanco

```sh
grep -rlPz "^import[^\n]*\n\n(import|export \{)" src --include=*.ts --include=*.tsx   # 0 archivos
```

- **Resultado:** 0 archivos con una línea en blanco entre imports. El orden externo → `@/` →
  relativo se verificó por lectura en la muestra de §1.1 (`Button.tsx:15-17`,
  `Button.test.tsx:7-11`, `RequireAuth.tsx`, `routes.tsx` de las seis features).
- **Nota:** es convención observada, no regla de ESLint. `eslint.config.js` no configura
  `import/order` ni `sort-imports`.

### 1.4 `import type` completo vs `type` inline

- **Medición:** lectura. Ejemplos: `src/services/http/errorMap.ts:8`
  (`import { ApiError, type ApiErrorDetail }` — mezcla valor y tipo → inline),
  `src/i18n/config.ts:5` (`import type { InitOptions }` — solo tipo → completo),
  `src/design-system/atoms/Button/Button.tsx:15-16` (ambas formas en dos líneas consecutivas).
- **Resultado:** consistente en toda la muestra.

### 1.5 Las interfaces y tipos `*Props` no se exportan

```sh
grep -rnE "export (interface|type) [A-Za-z]+Props" src    # 0 resultados
```

### 1.6 Barriles `index.ts`

```sh
find src -name index.ts | sort      # 39 archivos
```

Los 39, clasificados:

| Ubicación                                       | Cantidad | Cumple la regla                                         |
| ----------------------------------------------- | -------: | ------------------------------------------------------- |
| `design-system/atoms/<Componente>/index.ts`     |       16 | sí                                                      |
| `design-system/molecules/<Componente>/index.ts` |       13 | sí                                                      |
| `design-system/organisms/<Componente>/index.ts` |        2 | sí                                                      |
| `features/<nombre>/index.ts`                    |        6 | sí                                                      |
| `i18n/index.ts`                                 |        1 | no es barril: inicializa i18next y exporta la instancia |
| `stores/index.ts`                               |        1 | **no** — barril de carpeta técnica                      |

No existe `design-system/index.ts` (aunque `docs/ARCHITECTURE.md` §2 lo dibuja) ni barril de
categoría (`atoms/index.ts`, `molecules/index.ts`, `organisms/index.ts`), ni de `hooks/`,
`utils/`, `services/`, `layouts/`, `config/`.

**Única excepción:** `src/stores/index.ts`, consumido vía `@/stores` por:

| Archivo                                      | Línea |
| -------------------------------------------- | ----: |
| `src/app/providers/AuthProvider.tsx`         |    10 |
| `src/app/providers/AuthProvider.test.tsx`    |     3 |
| `src/app/router/guards/RequireAuth.tsx`      |    13 |
| `src/app/router/guards/RequireAuth.test.tsx` |     6 |
| `src/app/router/index.test.tsx`              |    12 |

Decisión de esta sesión: la regla se escribe sin excepción y `stores/index.ts` queda como
pendiente de retiro (ver §3).

### 1.7 El design system no llama a `useTranslation`

```sh
grep -rl "useTranslation\|react-i18next" src/design-system    # 0 resultados
grep -rl "useTranslation\|react-i18next" src/layouts          # AppShell.tsx, AppShell.test.tsx
```

- **Resultado:** 0 archivos de `design-system/` importan i18next. `layouts/AppShell.tsx` sí lo
  usa, y está fuera del design system (capa `layouts`, que según `ARCHITECTURE.md` §4 sí puede
  importar `i18n`).
- **Evidencia de «texto como prop obligatoria»:** `Button.tsx:69` (`children: ReactNode`
  obligatorio) y `Button.tsx:77` (`loadingLabel: string` obligatorio cuando `loading: true`),
  sin valor por defecto en ninguno de los dos.

### 1.8 Pruebas: `describe` en inglés, `it` en español, archivo hermano

```sh
grep -rhoE "describe\('[^']+'" src | wc -l                 # 52 (en 51 archivos; RequireAuth.test.tsx tiene 2)
grep -rnE "it\('.*(should|debería|deberia)" src            # 0 resultados
grep -rhoE "\bit\('[^']+'" src | wc -l                     # 140
find src -type d -name "__tests__"                          # 0 carpetas
```

- **Resultado:** los 52 `describe` usan el identificador bajo prueba en inglés (`'Button'`,
  `'mapErrorResponse'`, `'routeConfig'`, `'useDebounce'`, `'RedirectIfAuthenticated'`…). Los 140
  `it` están en español, tercera persona (`'redirige a /ingresar cuando no hay sesión'`,
  `'disabled no dispara onClick'`). 0 con «should» o «debería». 0 carpetas `__tests__`; las 51
  pruebas son hermanas del archivo que prueban.

### 1.9 Unidades de los tokens

- **Medición:** lectura de `src/styles/semantic.css` y `src/styles/index.css`.

| Categoría              | Unidad     | Evidencia                                                                |
| ---------------------- | ---------- | ------------------------------------------------------------------------ |
| Espaciado              | `rem`      | `semantic.css:63-71` (`--space-1: 0.25rem` … `--space-9: 6rem`)          |
| Radios                 | `px`       | `semantic.css:78-82` (`--token-radius-sm: 6px` … `-full: 999px`)         |
| Tamaño de fuente       | `rem`      | `index.css:113-140` (`--text-display: 3.5rem` … `--text-label: 0.75rem`) |
| Altura de línea        | sin unidad | `index.css:114-141` (`--text-body--line-height: 1.625`)                  |
| Espaciado entre letras | `em`       | `index.css:115,120,125,142` (`--text-h1--letter-spacing: -0.02em`)       |

- **Resultado:** sin excepción dentro de los tres `.css`.

### 1.10 Llaves de i18n

- **Medición:** lectura de los 5 `.json` de `locales/es-CO/` (los 5 de `en/` son copias).

```sh
grep -nE '^\s*"[a-z]+-[a-z-]+"' src/i18n/locales/es-CO/*.json     # 0 resultados (ninguna llave kebab)
```

- **Resultado:** llaves en `camelCase` (`ofertaYRol`, `formaRespuesta`); `UPPER_SNAKE_CASE` cuando
  son códigos de dominio (`ENTRENO`, `PROFESIONAL_NEUTRO`, `TEXTO`). Las llaves `idioma.es-CO` y
  `idioma.en` (`es-CO/interview.json:25-27`) llevan guion porque son códigos BCP-47 copiados tal
  cual: código de dominio, igual que `ENTRENO`, no kebab-case.
- Namespaces reales: `common`, `auth`, `profile`, `interview`, `errors` (`i18n/config.ts:12`).
  **No existe `report`.**

### 1.11 Convención de citas a `CLAUDE.md`

- **Medición:** `grep -rn "CLAUDE.md §" src`.
- **Resultado:** el patrón `§N` para secciones y `§3.N` para reglas duras ya está en uso:
  `Button.tsx:2` («CLAUDE.md §5»), `i18n/config.ts:7,11` («CLAUDE.md §7»),
  `stores/auth.store.ts:39` («CLAUDE.md §3.7»), `styles/index.css:4`, `primitives.css:2`,
  `semantic.css:2` («CLAUDE.md §6»). Ver §2.4 para las dos citas incorrectas.

---

## 2. Desviaciones encontradas

Son la evidencia de los pasos siguientes (tokens y documentación). **Ninguna se corrigió en esta
sesión**; este paso solo toca `CLAUDE.md`.

### 2.1 Literales de dimensión en clases Tailwind — 13

```sh
grep -rnoE "[a-z-]+-\[[0-9.]+(px|rem|em)\]" src --include=*.tsx | grep -v "\.test\."
```

**Criterio:** clase Tailwind con valor arbitrario de longitud (`[Npx]`, `[Nrem]`, `[Nem]`) en un
`.tsx` que no sea prueba. No cuenta los tamaños numéricos de íconos (`size={20}`,
`cloneElement(icon, { size: 20 })`: 20 ocurrencias en `design-system/`), porque son tamaño de SVG y
no dimensión de área. Con este criterio hay **13**, no 15 como contó un informe anterior de esta
misma sesión de trabajo; la diferencia no se pudo reconstruir y queda registrada como pregunta.

**a) Ocho de área táctil — los que resuelve el token `--touch-target` (44 px):**

| Archivo                                                       | Línea | Literal        |
| ------------------------------------------------------------- | ----: | -------------- |
| `src/design-system/atoms/Button/Button.tsx`                   |    42 | `h-[44px]`     |
| `src/design-system/atoms/Button/Button.tsx`                   |    50 | `w-[44px]`     |
| `src/design-system/atoms/Checkbox/Checkbox.tsx`               |    39 | `min-h-[44px]` |
| `src/design-system/atoms/Input/Input.tsx`                     |    28 | `min-h-[44px]` |
| `src/design-system/atoms/Radio/Radio.tsx`                     |    34 | `min-h-[44px]` |
| `src/design-system/atoms/Toggle/Toggle.tsx`                   |    37 | `min-h-[44px]` |
| `src/design-system/molecules/Combobox/Combobox.tsx`           |   139 | `min-h-[44px]` |
| `src/design-system/molecules/PasswordField/PasswordField.tsx` |    45 | `pr-[44px]`    |

**b) Cuatro de tamaño de botón — decisión aparte, el token no los resuelve:**

| Archivo                                     | Línea | Literal    |
| ------------------------------------------- | ----: | ---------- |
| `src/design-system/atoms/Button/Button.tsx` |    41 | `h-[52px]` |
| `src/design-system/atoms/Button/Button.tsx` |    43 | `h-[34px]` |
| `src/design-system/atoms/Button/Button.tsx` |    49 | `w-[52px]` |
| `src/design-system/atoms/Button/Button.tsx` |    51 | `w-[34px]` |

**c) Uno de geometría interna:**

| Archivo                                     | Línea | Literal              |
| ------------------------------------------- | ----: | -------------------- |
| `src/design-system/atoms/Toggle/Toggle.tsx` |    62 | `translate-x-[22px]` |

### 2.2 Barriles sin TSDoc en la línea 1 — 37 de 39

```sh
for f in $(find src -name index.ts); do head -1 "$f" | grep -q '^/\*\*' || echo "$f"; done
```

Los dos que sí lo tienen: `src/i18n/index.ts` y `src/stores/index.ts`. Los 37 que no:

```
src/design-system/atoms/{Avatar,Button,Checkbox,Chip,Divider,ErrorText,HelperText,Input,Label,
                         Pill,ProgressBar,Radio,Skeleton,Spinner,Stat,Toggle}/index.ts          (16)
src/design-system/molecules/{AlertInline,Banner,CardSelectable,CharacterCounter,Combobox,
                             EmptyState,FormField,PasswordField,PasswordStrength,StateLocked,
                             StepList,Stepper,Toast}/index.ts                                    (13)
src/design-system/organisms/{NavHeader,TabBar}/index.ts                                          (2)
src/features/{auth,home,interview-session,interview-setup,landing,professional-profile}/index.ts (6)
```

Todos son de una sola línea (`export { X } from './X';`) sin cabecera.

### 2.3 Pruebas sin TSDoc en la línea 1 — 45 de 51

```sh
for f in $(find src -name '*.test.ts' -o -name '*.test.tsx'); do head -1 "$f" | grep -q '^/\*\*' || echo "$f"; done
```

Las 6 que sí lo tienen: `app/router/index.test.tsx`, `design-system/atoms/Button/Button.test.tsx`,
`design-system/atoms/Input/Input.test.tsx`, `design-system/icons/Icon.test.tsx`,
`design-system/molecules/Combobox/Combobox.test.tsx`, `i18n/index.test.tsx`.

Las 45 que no:

```
src/app/providers/AuthProvider.test.tsx
src/app/providers/RootErrorBoundary.test.tsx
src/app/router/NotFoundPage.test.tsx
src/app/router/RouteErrorBoundary.test.tsx
src/app/router/guards/RequireAuth.test.tsx
src/design-system/atoms/{Avatar,Checkbox,Chip,Divider,ErrorText,HelperText,Label,Pill,ProgressBar,
                         Radio,Skeleton,Spinner,Stat,Toggle}/<Componente>.test.tsx              (14)
src/design-system/molecules/{AlertInline,Banner,CardSelectable,CharacterCounter,EmptyState,
                             FormField,PasswordField,PasswordStrength,StateLocked,StepList,
                             Stepper,Toast}/<Componente>.test.tsx                                (12)
src/design-system/organisms/{NavHeader,TabBar}/<Componente>.test.tsx                             (2)
src/hooks/{useDebounce,useDisclosure,useMediaQuery,usePrefersReducedMotion}.test.ts              (4)
src/layouts/{AppShell,AuthLayout,SessionLayout,WizardLayout}.test.tsx                            (4)
src/services/http/errorMap.test.ts
src/utils/{calculateAge,cn,formatDuration}.test.ts                                               (3)
```

### 2.4 Archivos fuente con la cabecera fuera de la línea 1 — 8 de 121

```sh
for f in $(find src -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.test.*' ! -name 'index.ts' ! -name '*.d.ts'); do
  head -1 "$f" | grep -qE '^(/\*\*|// PROVISIONAL)' || echo "$f"; done
```

| Archivo                                        | Qué pasa                                     |
| ---------------------------------------------- | -------------------------------------------- |
| `src/app/App.tsx`                              | empieza en `import`; sin cabecera de archivo |
| `src/utils/cn.ts`                              | empieza en `import`; sin cabecera de archivo |
| `src/features/auth/routes.tsx`                 | TSDoc después de los imports                 |
| `src/features/home/routes.tsx`                 | TSDoc después de los imports                 |
| `src/features/interview-session/routes.tsx`    | TSDoc después de los imports                 |
| `src/features/interview-setup/routes.tsx`      | TSDoc después de los imports                 |
| `src/features/landing/routes.tsx`              | TSDoc después de los imports                 |
| `src/features/professional-profile/routes.tsx` | TSDoc después de los imports (líneas 6-10)   |

La marca `// PROVISIONAL — …` en la línea 1 (`services/http/errorMap.ts:1`) se considera correcta:
`CLAUDE.md` §8 la exige ahí, y el TSDoc va inmediatamente después (`errorMap.ts:2-7`).

### 2.5 Cita incorrecta «§6» — 2 archivos

```sh
grep -rn "§6" src
```

| Archivo                       | Línea | Texto                                                          | Sección correcta |
| ----------------------------- | ----: | -------------------------------------------------------------- | ---------------- |
| `src/services/queryClient.ts` |     2 | «CLAUDE.md §6: los datos del servidor viven aquí…»             | **§3.6**         |
| `src/stores/auth.store.ts`    |     2 | «CLAUDE.md §6: los datos de servidor viven en TanStack Query…» | **§3.6**         |

§6 de `CLAUDE.md` es «Tokens y estilos». La regla citada («datos del servidor van en TanStack
Query, no en Zustand») es la regla dura 6, que se cita `§3.6`. Los otros cuatro usos de «§6»
(`routes.ts:2`, que cita otro documento; `index.css:4`, `primitives.css:2`, `semantic.css:2`) son
correctos.

### 2.6 Comentario obsoleto — `src/stores/auth.store.ts:4-6`

Texto actual:

> Este store no importa Firebase ni sabe de `onAuthStateChanged`: quien cablee ese listener
> **(todavía no existe, `app/providers/` es de un prompt posterior)** llama a `setUser`/`clear`
> con lo que ya resolvió.

`src/app/providers/AuthProvider.tsx` existe y es quien llama a `setUser`/`clear` (importa
`useAuthStore` en su línea 10). El paréntesis describe un estado anterior del repositorio.

### 2.7 `Button size="sm"` mide 34 px — por debajo del mínimo táctil de §10

`src/design-system/atoms/Button/Button.tsx:43` (`h-[34px]`) y `:51` (`w-[34px]`, variante `icon`).

```sh
grep -n "before:\|after:\|min-h\|min-w" src/design-system/atoms/Button/Button.tsx   # 0 resultados
```

No hay pseudoelemento ni `min-h`/`min-w` que amplíe el área de toque más allá de la caja visible,
así que el área táctil real del botón pequeño es 34 px de alto (y 34 × 34 en la variante `icon`),
frente a los 44 × 44 que exige `CLAUDE.md` §10. **Se registra, no se resuelve:** es una decisión de
diseño (ampliar el área, subir el tamaño, o declarar que `sm` no es un control táctil). Ver
pregunta 1 de §4.

---

## 3. Lo que `CLAUDE.md` describe y todavía no existe en el código

Misma tabla que `CLAUDE.md` §17, para que este informe sea la evidencia de las dos listas.

| Regla en `CLAUDE.md`                            | Qué falta en el código (evidencia)                                                                                          | Paso que lo resuelve                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| §6 token `--touch-target`                       | no existe en `semantic.css` ni en `index.css`; 8 literales de 44 px (§2.1a)                                                 | paso siguiente (tokens)                                            |
| §6 tamaños de botón 52/34 px                    | 4 literales (§2.1b); `sm` = 34 px < 44 (§2.7)                                                                               | decisión aparte (pregunta 1)                                       |
| §7 `en/` borrado, `fallbackLng` operando        | `src/i18n/locales/en/` existe con 5 archivos copiados de `es-CO`                                                            | paso siguiente (i18n)                                              |
| §8 errores en formato RFC 9457                  | `errorMap.ts:10-17` espera `{ code, message, details }`; línea 1 lo marca provisional (API-TBD-14)                          | cuando exista el contrato real                                     |
| §8 `mocks/handlers/`, `*.dto.ts`, `*.mapper.ts` | no existe `src/mocks/`; ninguna feature tiene `api/`                                                                        | primera feature que necesite `api/`                                |
| §14.6 sin barril en carpetas técnicas           | `src/stores/index.ts` con 5 consumidores (§1.6)                                                                             | paso siguiente (retiro del barril)                                 |
| §15 TSDoc en línea 1 de todos los archivos      | 37 barriles (§2.2), 45 pruebas (§2.3), 8 fuentes (§2.4); 2 citas «§6» incorrectas (§2.5); 1 comentario obsoleto (§2.6)      | paso 3 (documentación)                                             |
| §16 `SPEC.md` por feature y `pnpm spec:check`   | no hay `src/features/*/SPEC.md`; `package.json` no tiene `spec:check`                                                       | instanciación de la plantilla                                      |
| §11 PRT-02.07 fuera del MVP                     | `src/features/professional-profile/pages/ProfileRolesPage.tsx` y la ruta `/perfiles/:id/roles` (`routes.tsx:17-19`) existen | pendiente de **C-04**; se retiran solo si la respuesta lo confirma |
| §4 anatomía completa de feature                 | las 6 features solo tienen `pages/`, `routes.tsx`, `index.ts`                                                               | conforme entren HU (regla de crecimiento)                          |
| `docs/ARCHITECTURE.md` §2                       | dice «`en/` hereda de `es-CO`», lista `ReportLayout` y `report`                                                             | paso siguiente; solo esas dos cosas                                |

---

## 4. Preguntas abiertas que dejó esta sesión

1. **`Button size="sm"` = 34 px** (§2.7): ¿área de toque ampliada con pseudoelemento, subir a 44
   px, o `sm` no se considera control táctil? No se resolvió.
2. **Conteo de literales** (§2.1): 13 con el criterio declarado frente a 15 de un informe anterior.
   ¿Hay dos que el criterio no captura, o se fija en 13?
3. **Forma del token táctil**: una utilidad `touch-target` (min-h + min-w juntos) o dos
   (`min-h-touch-target`, `min-w-touch-target`). Se confirma en el paso de tokens.

---

## 5. Qué se aceptó, corrigió o rechazó en esta sesión

- **Aceptado:** las 11 convenciones de §1 como reglas de `CLAUDE.md` §14; el informe completo en
  `docs/bitacora-ia/` en vez de una tabla resumida en `docs/referencias/`; las secciones nuevas al
  final (§14-§17) para no romper las citas `§N` existentes en `src/` y en los ADR.
- **Corregido por el humano durante la revisión del plan:** ubicación del informe; declaración del
  universo medido; acotar `--touch-target` a alto/ancho mínimo (no exponerlo por `--spacing-*`);
  no prometer que el token resuelve los 4 literales de tamaño de botón; separar hooks de interfaz
  y de datos en el orden de construcción; conservar los puntos abiertos de §12 que el PO no cerró;
  no borrar `ProfileRolesPage.tsx` hasta C-04; TSDoc obligatorio en línea 1.
- **Rechazado:** proponer el informe en `docs/referencias/` (esa carpeta guarda copias de
  documentos del equipo con original externo).
