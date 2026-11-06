# Arquitectura de `cameia-web`

- **Versión:** 1.0 · 4 de septiembre de 2026
- **Responsable:** Juan Diego Gómez Garcés — Frontend
- **Estado:** PROPUESTO
- **Responde:** `DEV-IN-03` de la solicitud de insumos de inicio de Sprint 1
- **Jira:** CM-100
- **Árbol de §2 contrastado con el código:** 6 de octubre de 2026

Este documento describe el árbol del repositorio: lo que existe hoy y lo que sigue siendo objetivo.
§2 los distingue con una leyenda. **Lo que todavía no existe es intencional**: ver §5, «Qué se crea
y qué no».

---

## 1. Patrón: Atomic Design híbrido por contexto

Átomos y moléculas viven en un **design system global sin dominio**. Organismos y páginas viven
dentro de la **feature** que los usa. Las plantillas quedan aparte porque son pocas y transversales.

El corte por feature refleja los contextos del diagrama C4 (Cuentas, Perfil Profesional,
Entrevistas, Auditoría): un cambio de contrato en un microservicio toca una carpeta, no cinco.

Se descartó Atomic Design puro (`components/atoms|molecules|organisms|templates|pages`) porque con
9 épicas y ~40 historias la carpeta `organisms/` termina con más de 40 componentes sin relación
entre sí, y tocar una sola historia obliga a saltar entre cuatro directorios.

---

## 2. Árbol del repositorio (existe / objetivo)

Leyenda: una línea **sin marca** existe hoy en el repositorio; `· objetivo` marca lo que todavía no
existe y se crea cuando entre la historia que lo necesite; `· NO CREAR` y `· FUERA DEL MVP` se
explican en §5. Contrastado con `git ls-files` el 6-oct-2026.

```
cameia-web/
├── .nvmrc                              24
├── .env.example · .env.test
├── .editorconfig · .prettierrc · .prettierignore · .gitattributes
├── .github/                            workflows de CI/CD, plantilla de PR, CODEOWNERS, dependabot
├── .husky/pre-commit                   lint-staged: prettier + eslint --fix en cada commit
├── eslint.config.js
├── vite.config.ts
├── tsconfig.json · tsconfig.app.json · tsconfig.node.json
├── package.json                        versiones exactas, sin ^
├── pnpm-lock.yaml · pnpm-workspace.yaml   el lockfile se versiona siempre
├── firebase.json · .firebaserc         hosting (proyecto y canales)
├── index.html
├── README.md · CONTRIBUTING.md · CLAUDE.md
├── scripts/
│   └── spec-check.mjs                  `pnpm spec:check`, valida los SPEC.md de las features
├── docs/
│   ├── ARCHITECTURE.md                 este archivo
│   ├── GLOSSARY.md · SPEC-INDEX.md     vocabulario · índice de SPEC (lo regenera spec:check --write)
│   ├── RUNBOOK-rollback-hosting.md · ADR-0001-ambientes-firebase-hosting.md
│   ├── adr/                            decisiones estructurales (ver adr/README.md)
│   ├── decisiones/                     lo que el PO resolvió por fuera del backlog
│   ├── bitacora-ia/                    evidencia de sesiones asistidas por IA
│   ├── referencias/                    copias de documentos con original externo
│   └── _plantilla-feature/             esqueleto que se copia al crear una feature
├── public/                             · objetivo (hoy no existe; no hay assets estáticos)
└── src/
    ├── main.tsx
    │
    ├── app/                            arranque y cableado global
    │   ├── App.tsx
    │   ├── providers/
    │   │   ├── AppProviders.tsx        RootErrorBoundary › Helmet › QueryClient › I18n › Auth
    │   │   │                           (sin Toast: no hay ningún host de Toast montado)
    │   │   ├── AuthProvider.tsx        escucha a Firebase y alimenta auth.store
    │   │   └── RootErrorBoundary.tsx
    │   └── router/
    │       ├── index.tsx
    │       ├── routes.ts               catálogo de rutas tipado
    │       ├── AuthenticatedAppShell.tsx   envuelve AppShell para llamar useLogout()
    │       ├── NotFoundPage.tsx · RouteErrorBoundary.tsx
    │       └── guards/
    │           ├── RequireAuth.tsx             HU-1.3 · incluye RedirectIfAuthenticated
    │           ├── RequireCompletedProfile.tsx HU-2.1 · Sprint 2 · objetivo
    │           └── RequirePlan.tsx             HE-06/07/08 · posterior · objetivo
    │
    ├── design-system/                  ÁTOMOS · MOLÉCULAS · organismos sin dominio
    │   ├── atoms/
    │   │   Button · Input · Select · Checkbox · Radio · Toggle · Label · HelperText
    │   │   ErrorText · Pill · Chip · ProgressBar · Stat · Avatar · Spinner · Skeleton
    │   │   Divider · Logo
    │   │   IconButton · TextArea                                          · objetivo
    │   ├── molecules/
    │   │   FormField · PasswordField · PasswordStrength · Combobox · CharacterCounter
    │   │   CardSelectable · AlertInline · Banner · Toast · EmptyState · StateLocked
    │   │   Stepper · StepList
    │   │   OtpInput · Dropzone · MetricCell                               · objetivo
    │   ├── organisms/
    │   │   Modal · BottomSheet · NavHeader · TabBar · LanguageSwitcher · MenuUsuario
    │   │   Accordion                                                      · objetivo
    │   └── icons/
    │       ├── registry.tsx            ÚNICO punto que importa lucide-react
    │       ├── Icon.tsx · GoogleIcon.tsx
    │       └── svg/                    SVG exportados de Figma (hoy solo google.svg)
    │
    ├── layouts/                        PLANTILLAS
    │   ├── AuthLayout.tsx              PRT-01.*
    │   ├── AppShell.tsx                NavHeader + TabBar + MenuUsuario
    │   ├── WizardLayout.tsx            PRT-04.* (PRT-02.03 no es un asistente, ver CM-53)
    │   └── SessionLayout.tsx           bg/inverse, sin navegación · PRT-05.*
    │
    ├── features/                       ORGANISMOS DE DOMINIO + PÁGINAS
    │   ├── landing/                    pública, antes de auth · PRT-00.01 · CM-186/HU-10.1, implementada
    │   ├── auth/                       HE-01 · Sprint 1
    │   ├── professional-profile/       HE-02 · Sprint 1
    │   ├── interview-setup/            HE-04 · Sprint 1 · hoy solo pages/, routes.tsx e index.ts
    │   ├── interview-session/          HE-05 · Sprint 1 · hoy solo pages/, routes.tsx e index.ts
    │   ├── home/                       shell y dashboard autenticado · sin HU, riesgo declarado
    │   ├── account/                    HE-01 · NO CREAR todavía
    │   ├── evaluation-report/          HE-06 · NO CREAR todavía
    │   ├── progress/                   HE-07 · NO CREAR todavía
    │   ├── billing/                    HE-08 · NO CREAR todavía
    │   ├── usage/                      HE-09 · NO CREAR todavía
    │   └── job-offers/                 HE-03 · FUERA DEL MVP
    │
    ├── services/                       infraestructura, sin dominio
    │   ├── http/
    │   │   ├── httpClient.ts           envoltorio de fetch; adjunta el ID Token de Firebase
    │   │   ├── errorMap.ts             ProblemDetail (ADR-0007) → ApiError tipado
    │   │   └── ApiError.ts
    │   ├── firebase/
    │   │   ├── firebaseApp.ts
    │   │   └── auth.service.ts
    │   └── queryClient.ts
    │
    ├── stores/                         Zustand · estado de CLIENTE (sin barril index.ts)
    │   ├── auth.store.ts               usuario y claims
    │   ├── uiPreferences.store.ts      idioma de la app, último profileId usado (localStorage)
    │   └── unsavedChanges.store.ts     bandera de «cambios sin guardar» (CM-194)
    │
    ├── hooks/                          agnósticos de dominio
    │   useDebounce · useMediaQuery · useDisclosure · usePrefersReducedMotion
    │
    ├── lib/                            envoltorios de terceros                  · objetivo
    ├── utils/                          funciones puras, con test al lado
    │   calculateAge.ts (regla ≥18 en UTC) · formatDuration.ts · cn.ts · buttonLoadingProps.ts
    │   focusTrap.ts · passwordStrength.ts · textFilters.ts
    │
    ├── i18n/
    │   ├── index.ts · config.ts
    │   └── locales/
    │       ├── es-CO/  common · auth · profile · interview · errors · landing .json
    │       └── en/     los mismos 6 namespaces (CM-186)
    │
    ├── mocks/
    │   ├── browser.ts                  hoy no está cableado a main.tsx
    │   ├── server.ts                   lo usa la suite de pruebas
    │   ├── data/catalogs.ts
    │   └── handlers/                   un archivo por recurso (auth, profiles, professionalRoles)
    │
    ├── test/                           setup de Vitest, stub de matchMedia, helper de MSW
    │
    ├── config/
    │   ├── env.ts                      valida import.meta.env con zod al arrancar
    │   └── features.ts                 flags de alcance
    │
    ├── types/
    │   └── api/                        generado desde OpenAPI cuando exista    · objetivo
    │
    └── styles/
        ├── primitives.css              rampas crudas
        ├── semantic.css                tokens que usa la UI
        └── index.css                   @theme de Tailwind 4
```

Dos reglas de §14.6 de `CLAUDE.md` explican lo que **no** aparece: no hay barril de categoría
(`design-system/index.ts`, `atoms/index.ts`) ni de carpeta técnica (`stores/index.ts`,
`hooks/index.ts`); se importa el archivo concreto.

---

## 3. Anatomía canónica de una feature

Idéntica en todas. `docs/_plantilla-feature/` contiene este esqueleto para copiarlo.

```
features/<nombre>/
├── api/
│   ├── <x>.api.ts          funciones de red, una por endpoint
│   ├── <x>.dto.ts          contrato crudo del backend, tal cual llega
│   └── <x>.mapper.ts       DTO → modelo de UI
├── model/                  tipos de dominio, enums, máquinas de estado
├── schemas/                esquemas zod de formularios
├── hooks/                  queries, mutaciones y lógica de la feature
├── organisms/              componentes con dominio, uno por carpeta (con su index.ts opcional)
├── pages/                  una página por PRT
├── store/                  estado efímero (solo si hace falta; hoy ninguna feature lo usa)
├── SPEC.md                 especificación viva de la feature (CLAUDE.md §16)
├── routes.tsx
└── index.ts                superficie pública de la feature
```

**Ejemplos reales:** `features/auth/` y `features/professional-profile/` ya tienen `api/`, `model/`,
`schemas/`, `hooks/`, `organisms/`, `pages/`, `routes.tsx`, `index.ts` y `SPEC.md` (`landing/` tiene
`organisms/`, `pages/` y `SPEC.md`). Ninguna tiene todavía `store/`.

**Ejemplo objetivo, `interview-setup` (HE-04, Sprint 1).** Es el plan, **no existe**: hoy la
feature solo tiene `pages/`, `routes.tsx` e `index.ts`.

```
features/interview-setup/
├── api/            setup.api.ts · setup.dto.ts · setup.mapper.ts
├── model/          catalogs.ts (códigos, NO etiquetas) · setup.types.ts
├── schemas/        setup.schema.ts (idioma BCP-47, modalidad, forma de respuesta)
├── hooks/          useConfigCatalog · useAvailableProfiles · useInitSession
│                   useMicrophonePermission · useSessionPlanning
├── organisms/      OfferAndRoleStep · ModeAndToneStep · LanguageAndFormatStep
│                   SetupSummary · NoProfileGate
├── pages/          NewInterviewWizardPage.tsx · StartingSessionPage.tsx
├── store/          interviewSetup.store.ts   (no persiste hasta el POST de HU-4.4)
└── routes.tsx
```

---

## 4. Fronteras, verificadas por el linter

`eslint-plugin-boundaries` define seis capas y las hace cumplir en CI:

| Capa            | Puede importar de                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `design-system` | `utils`, `lib`, `i18n`                                                                                             |
| `layouts`       | `design-system`, `hooks`, `stores`, `i18n`, `utils`                                                                |
| `features`      | `design-system`, `layouts`, `services`, `stores`, `hooks`, `lib`, `utils`, `i18n`, `config`, **su propia carpeta** |
| `services`      | `config`, `lib`, `utils`                                                                                           |
| `mocks`         | `services` (lo necesitan las pruebas de humo que ejercitan `httpClient`/`ApiError` reales contra los handlers)     |
| `app`           | todo                                                                                                               |

Prohibiciones explícitas: una feature no importa de otra feature; `design-system` no importa de
`features`, `services` ni `stores`; nadie importa `lucide-react` salvo `design-system/icons/registry.tsx`.

Sin esta regla automatizada, la estructura se degrada en dos semanas.

---

## 5. Qué se crea y qué no

**Se crea completo desde el primer commit** — lo transversal, porque retrofitearlo obliga a tocar
todos los archivos existentes: `app/`, `styles/` con los tokens, `design-system/` con los átomos que
usa Sprint 1, `services/`, `stores/`, `hooks/`, `i18n/`, `config/`, `mocks/`, `layouts/`, `utils/`.
Ninguna nace vacía: cada una tiene al menos un archivo real.

**Se crea solo lo del sprint** — cuatro features de dominio más dos sin HU propia pero
necesarias para el flujo: `landing` (pública, ruta `/`), `auth`, `professional-profile`,
`interview-setup`, `interview-session`, `home` (dashboard autenticado, ruta `/inicio`).
Dentro de cada una, solo las subcarpetas que la historia en curso necesita.

**Ruta pública vs. autenticada — importante:** `/` deja de ser el dashboard. Es la landing de
marketing (PRT-00.01), visible sin sesión, con su propio `header-publico`, hero, tarjetas de
«qué ofrece» y CTA a `/registro` — **implementada (CM-186/HU-10.1)**. El dashboard autenticado
(PRT-00.02) vive en `/inicio`, detrás de `RequireAuth`, y coincide con la etiqueta del tab bar;
sigue sin HU en el backlog — ver riesgo #1.

**No se crea** — `account`, `evaluation-report`, `progress`, `billing`, `usage`, `job-offers`.
Aparecen en el árbol de arriba como referencia, no como carpetas a instanciar. Se crean cuando
entre su primera historia al sprint.

**Reglas de crecimiento:**

1. Una carpeta vacía es deuda. Nada de `.gitkeep` en carpetas de features futuras.
2. Un componente sube a `design-system/` cuando lo usa una **segunda** feature.
3. Un hook sube a `hooks/` cuando lo usa un **segundo** consumidor fuera de su feature.
4. Un componente nuevo que no se pueda armar combinando los del design system es señal de que
   falta discutirlo con diseño antes de dibujarlo.

---

## 6. Convenciones de nombres

| Elemento              | Convención                            | Ejemplo                                         |
| --------------------- | ------------------------------------- | ----------------------------------------------- |
| Componente            | `PascalCase`, **igual que en Figma**  | `card-selectable` → `CardSelectable`            |
| Props de variante     | igual que la variante de Figma        | `variant`, `size`, `state`, `context`, `author` |
| Archivo de componente | `PascalCase.tsx`                      | `ChatBubble.tsx`                                |
| Hook                  | `useAlgo.ts`                          | `useSubmitTurn.ts`                              |
| Utilidad              | `camelCase.ts`                        | `formatDuration.ts`                             |
| Prueba                | al lado del archivo                   | `Button.test.tsx`                               |
| Token semántico       | `categoria/rol/variante`              | `action/primary-hover`                          |
| CSS custom property   | el token con `-`                      | `--action-primary-hover`                        |
| Llave de i18n         | `namespace:seccion.llave`             | `interview:tono.ESTRICTO`                       |
| Rama                  | `CM-<n>-<kebab>`, sin prefijo de tipo | `CM-100-estructura-inicial`                     |

Tipos e interfaces sin prefijo `I` ni sufijo `Type`. Enums de dominio en `SCREAMING_SNAKE_CASE`
porque replican valores del backend.

---

## 7. Riesgos declarados

| #   | Riesgo                                                                                                                                 | Impacto                             | Necesita                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------- |
| 1   | **Resuelto para la Landing** (CM-186/HU-10.1, ya implementada). El Dashboard (PRT-00.02) sigue sin HU, aunque está dibujado y el login ya redirige a él. | Trabajo del Tablero sin ticket | HU o subtarea en CM-100 para el Tablero |
| 2   | ~~PRT-04.09 preselecciona AUDIO pero HU-5.8 es Sprint 2~~ **Resuelto** (D-04, `decisiones/11092026_v2`; `CLAUDE.md` §12, resuelta 4): Voz visible pero deshabilitada y Texto preseleccionado | —                                   | —                                  |
| 3   | HU-1.2 (verificación de correo) fuera de Sprint 1                                                                                      | El registro no tiene destino        | Decisión de PO                     |
| 4   | El selector de método ofrece «Autocompletar con IA», HU-2.6–2.10 son Sprint 2                                                          | Ruta muerta                         | Decisión de PO                     |
| 5   | Sin OpenAPI, los DTO se escriben a mano                                                                                                | Retrabajo al publicarse el contrato | OpenAPI de backend                 |
| 6   | ~~Tres catálogos distintos de estados de sesión~~ **Resuelto** (`GLOSSARY.md` §5; `CLAUDE.md` §12, resuelta 1): los estados oficiales son `CONFIGURADA`, `EN_CURSO`, `EVALUANDO`, `FINALIZADA`, `ABANDONADA` | —                                   | —                                  |
| 7   | La matriz de trazabilidad del Figma usa numeración antigua                                                                             | Tester deriva casos equivocados     | Actualizar el anexo                |
| 8   | 13 subtareas de pantalla + andamiaje, una persona — **materializado al cierre de Sprint 1**: el estado por subtarea está en `CLAUDE.md` §11 | Riesgo de alcance                   | Visibilidad en Scrum               |
