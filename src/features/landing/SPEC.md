---
feature: landing
estado: EN_CURSO
hu: [HU-10.1]
prt: [PRT-00.01]
jira: [CM-186]
rutas: ['/']
documentacion: tsdoc-es
backlog: 16092026_01
decisiones: [19092026_v1_decisiones-landing-cm-186]
figma: Cameia · Mockups MVP
revisado: 2026-09-19
---

# Feature · Landing Pública

## 1. Propósito

La Landing pública es la puerta de entrada de CAMEIA para quien todavía no tiene cuenta: comunica
qué hace el producto y ofrece dos caminos claros, registrarse o iniciar sesión, sin exigir
autenticación. Es también el primer punto donde el Visitante puede cambiar el idioma de toda la
interfaz. Si quien abre `/` ya tiene sesión activa, nunca llega a verla: se le redirige de
inmediato al Tablero de inicio.

## 2. Alcance

**Entra en este sprint:**

- Página `/` (PRT-00.01), pública, sin `RequireAuth`, con las seis secciones definidas en Figma:
  header, hero, tres tarjetas de características, dos tarjetas de modo, banner de cierre y pie de
  página.
- `HeaderPublico`: logo, `LanguageSwitcher` (ES/EN, funcional) y los botones "Iniciar
  sesión"/"Crear cuenta", con el reflow de dos filas confirmado en el prototipo `sm`.
- Componente nuevo y no interactivo para las cinco tarjetas informativas (tres de características,
  dos de modo).
- `LanguageSwitcher` nuevo en `design-system/organisms/`, reutilizable fuera de esta feature desde
  el día uno.
- Redirección a `/inicio` para quien ya tiene sesión activa: **ya implementada** por
  `RedirectIfAuthenticated` (`app/router/guards/RequireAuth.tsx`); esta HU solo verifica que sigue
  cubriendo `/` sin tocar el guard.
- Responsive en dos estados reales verificados contra Figma (`sm` <1024px, `lg` ≥1024px —
  corregido durante la implementación, ver §3.1) más una zona intermedia sin diseño propio (ver
  §9).
- Internacionalización **funcional** ES/EN: namespace nuevo `landing`, más traducción al inglés de
  los cinco namespaces ya existentes (`common`, `auth`, `profile`, `interview`, `errors`),
  generada por IA y sujeta a aprobación humana antes de fusionarse (decisión de Frontend,
  19-sep-2026).
- `<title>` y Open Graph vía `react-helmet-async`, incluyendo integrar `HelmetProvider` en
  `AppProviders.tsx` (hoy la dependencia está instalada pero no cableada).
- Bitácora de IA (`docs/bitacora-ia/CM-186.md`) y actualización de la documentación afectada (ver
  §9).

**No entra, y es deliberado:**

- Modo oscuro o cualquier variante de tema: el MVP tiene un solo tema claro (ADR-0005).
- Cualquier endpoint nuevo de backend: HU-10.1 no depende de backend; los CTAs navegan a flujos ya
  existentes de HE-01.
- Corregir que `RedirectIfAuthenticated` no muestre `Spinner` mientras `isLoading` (a diferencia de
  `RequireAuth`): es un comportamiento compartido con `/registro` e `/ingresar`, y esta HU "cubre
  únicamente PRT-00.01". Se documenta como riesgo conocido en §9; corregirlo requiere un ticket
  propio porque toca un guard compartido.
- Un diseño de tablet dedicado: no existe en Figma (confirmado directamente, no solo por límite de
  herramienta — ver §9).
- Tocar `CardSelectable` del design system: se construye un componente nuevo para no imponerle a
  un componente ya usado en `interview-setup` una semántica que no le corresponde aquí.
- HU-10.2 / Tablero de inicio (PRT-00.02): historia separada, no se toca `home/` ni `AppShell`.
- Traducciones a idiomas distintos de inglés.

## 3. Comportamiento esperado

### `/` — Landing pública · `PRT-00.01`

**Qué hace**

- Muestra la propuesta de valor de CAMEIA a un Visitante sin sesión, con dos llamadas a la acción
  hacia los flujos ya existentes de HE-01.
- Si al montar la ruta ya hay una sesión activa (`isAuthenticated: true` en `auth.store`), no se
  llega a ver: `RedirectIfAuthenticated` ya envía a `ROUTES.inicio` antes de renderizar el
  `<Outlet/>` real (comportamiento confirmado, no nuevo).
- El `LanguageSwitcher` del header cambia el idioma de **toda la aplicación**, no solo de esta
  pantalla (`i18next-browser-languagedetector`, persistido en `localStorage`).

**Estados**

| Estado      | Qué muestra |
| ----------- | ----------- |
| Carga       | Ventana breve mientras `auth.store` resuelve `isLoading` desde Firebase. `RedirectIfAuthenticated` no bloquea el render en este tramo (a diferencia de `RequireAuth`), así que un Visitante con sesión activa puede ver la Landing parpadear antes de la redirección a `/inicio`. Es un comportamiento ya existente en el guard compartido; no se introduce ni se corrige aquí (§2). |
| Vacío       | No aplica. La pantalla no depende de ninguna colección de datos que pueda estar vacía; todo el contenido es estático. |
| Error       | No aplica. No hay llamadas de red propias de esta feature; un fallo de recursos estáticos (fuente, ícono) lo captura el `RootErrorBoundary` global, no algo específico de la Landing. |
| Sin permiso | No aplica. La ruta es pública por definición; no existe un estado "sin permiso" para un Visitante. |

**Validaciones del lado del cliente**

- No aplica. No hay ningún formulario en esta pantalla.

### 3.1 Estructura por sección y por breakpoint

Fuente de todo lo que sigue: evidencia real de Figma, nodo `67:2` ("· lg", 1440×1652) y nodo
`69:63` ("· sm", 390×2109), ambos con `get_metadata`/`get_design_context`/`get_variable_defs`
reales, no inferidos.

**Punto de corte — corregido durante la implementación (Claude Code, 19-sep-2026).** La primera
versión de esta SPEC decía que el corte reutilizaba el criterio de `AppShell` (`NavHeader`/`TabBar`)
descrito como "`md`, Tailwind 768px". Al leer `styles/index.css` directamente se confirmó que el
`md` real de este proyecto **no es 768px**: el `@theme` lo redefine a `--breakpoint-md: 600px`
(`AppShell` sí alterna en 600px, correcto para una barra de navegación simple). Aplicar ese mismo
`md` de 600px a Landing habría activado el layout `lg` — tres tarjetas de 400px fijos en fila,
~1272px de contenido, más el hero a ~1104px — desde un viewport de apenas 600px, produciendo
overflow horizontal real, no la simple estrechez que el riesgo de §9 ya aceptaba. **Decisión:** se
usa en su lugar el breakpoint `lg` que el propio tema ya registra (`--breakpoint-lg: 1024px`): el
layout `sm` de Figma aplica por debajo de 1024px y el `lg` desde 1024px en adelante, de forma
fluida hasta 1440px y más allá. Los tokens de texto nuevos de §3.6 cambian en este mismo punto
(1024px), no en 768px. Ver §9 para el riesgo aceptado que esto implica.

#### Header (`header-publico`)

| | `sm` (<1024px) | `lg` (≥1024px) |
|---|---|---|
| Estructura | Dos filas: fila 1 = logo + `LanguageSwitcher`; fila 2 = "Iniciar sesión" + "Crear cuenta", cada botón al 50% del ancho | Una fila: logo a la izquierda, `LanguageSwitcher` + ambos botones (ancho intrínseco) a la derecha |
| Padding | `space-4` (16px) en las 4 direcciones, `gap: space-3` (12px) entre filas | `px: space-6` (32px), altura fija 72px |
| Elementos ocultos | Ninguno — logo, switcher y los dos botones están **siempre visibles**; no hay menú hamburguesa | — |

#### Hero

| | `sm` | `lg` |
|---|---|---|
| Layout | Columna (`flex-col`) | Fila (`flex-row`), `hero-texto` a 560px de ancho fijo |
| Título | `text/display-sm` (34/36, ExtraBold, tracking −2.5) — "Entra a la entrevista listo" | `text/display` (56/56, ExtraBold, tracking −2.5) |
| Subtítulo | `text/body`, sin cambio de estilo — "Practica con un entrevistador de IA, recibe retroalimentación estructurada y llega a tu próxima entrevista con confianza." | igual |
| CTA | Botón "Crear cuenta" + texto "Es gratis" | igual, mismo copy |
| Tarjeta visual | `tarjeta-sesion-visual`, fondo `bg/inverse`, ícono `icon/voice` a 28px (reducido de 32px), título "Sesión de práctica", texto "El entrevistador de IA te escucha y responde en tiempo real, por voz o por texto." | ícono a 32px |
| Padding/gap | `px: space-4` `py: space-6`, `gap: space-4` | `p: space-9` (96px), `gap: space-8` (64px) |

#### Módulos — 3 tarjetas ("Todo lo que necesitas para llegar preparado")

| | `sm` | `lg` |
|---|---|---|
| Título de sección | `text/h2-sm` (21/27, Bold, tracking −1.5) — token que **solo existe en `sm`** | `text/h2` (26/31, Bold, tracking −1.5) |
| Layout de tarjetas | Columna, ancho `full` (358px efectivos), `gap: space-4` (16px) | Fila, 3 tarjetas de 400×160px fijos, `gap: space-5` (24px) |
| Alto de tarjeta | Variable: la primera ("Simulacros por voz y texto") mide 181px porque su descripción ocupa 3 líneas en un contenedor más angosto; las otras dos, 160px | Uniforme, 160px las tres |
| Contenido (idéntico carácter a carácter en ambos breakpoints) | Ícono (`icon/voice`/`icon/resume`/`icon/score`, 28px en ambos) + título (`text/h3`) + descripción (`text/small`) | igual |
| Padding de sección | `px: space-4` `py: space-6`, `gap: space-4` (título↔fila y entre tarjetas, uniforme) | `px: space-9` `py: space-8`, `gap: space-6` título↔fila, `gap: space-5` entre tarjetas |

#### Entreno / Simulación — 2 tarjetas

| | `sm` | `lg` |
|---|---|---|
| Layout | Columna, ancho `full` (358px), `gap: space-4` | Fila, 2 tarjetas de 440×164px fijos, `gap: space-6` |
| Padding interno de cada tarjeta | `space-4` (16px) | `space-5` (24px) — cambia de verdad, no es solo el layout externo |
| Discrepancia real en el propio Figma | Ambas tarjetas son **instancias reales** del componente `card-selectable` (nodo fuente `38:225`, descrito "sin preselección por defecto — CA-4.7.1") | Son **frames sueltos**, no instancias del componente, aunque llevan el mismo nombre visual `card-selectable · <nombre>` |
| Decisión del frontend | En ambos casos se construye un componente **nuevo, no interactivo**, sin `role="radio"` ni `aria-checked` — ver §9 | igual |

#### Cierre (banner oscuro)

| | `sm` | `lg` |
|---|---|---|
| Título | `text/display-sm` (34/36) — sin cambio respecto a `lg`, ya usaba ese mismo estilo en desktop | `text/display-sm` (34/36) |
| Padding | `py: space-7` (40px) — token que no aparece en `lg` | `py: space-9` (96px) |
| Gap | `space-4` (16px) | `space-5` (24px) |

#### Pie de página

| | `sm` | `lg` |
|---|---|---|
| Agrupación | `footer-links` contiene **solo** "Términos" y "Privacidad"; el copyright es un párrafo hermano, aparte | `footer-links` contiene los tres: "Términos", "Privacidad" y "© 2026 Cameia" — agrupación distinta, no solo layout |
| Layout | Columna, `gap: space-3` (12px) | Fila |
| Padding | `px: space-4` `py: space-5` | `px: space-9` `py: space-6` |
| Logo | Glyph reducido (17.81×14.25 vs 19.59×15.67) | tamaño base |

### 3.2 Componentes y arquitectura

```
features/landing/
├── organisms/
│   ├── HeaderPublico/       nuevo · logo + LanguageSwitcher + CTAs, con el reflow sm/lg de §3.1
│   ├── FeatureCard/         nuevo · tarjeta no interactiva (ícono + título + descripción),
│   │                        reemplaza el uso de card-selectable en las 5 tarjetas
│   └── Footer/              nuevo · enlaces + copyright, con la agrupación distinta en sm (§3.1)
├── pages/
│   └── LandingPage.tsx      reemplaza por completo el placeholder actual
├── routes.tsx               sin cambios de forma (ya registra `/`)
└── index.ts

design-system/organisms/
└── LanguageSwitcher/        nuevo · reutilizable, primer consumidor es HeaderPublico
```

Justificación de cada ubicación (regla de crecimiento de `ARCHITECTURE.md` §5): `HeaderPublico`,
`FeatureCard` y `Footer` nacen dentro de `features/landing/` porque hoy tienen un único
consumidor. `LanguageSwitcher` es la única excepción deliberada — nace directo en
`design-system/` porque ya está documentado como transversal en el árbol objetivo del proyecto y
Figma lo modela como un componente de librería con variantes pensadas para más de un contexto
(`public-header`, `settings`), no como algo específico de esta pantalla.

`NavHeader` (ya existente) **no se reutiliza ni se modifica**: hoy no tiene ningún prop de
contexto y su único consumidor es `AppShell` (área autenticada); forzarlo sería una modificación
fuera del alcance de esta HU sobre un componente que otra feature ya usa en producción.

`CardSelectable` (ya existente) **no se reutiliza ni se modifica**: su semántica (`role="radio"`,
`aria-checked`, pensada para selección excluyente dentro de un grupo) no corresponde a contenido
puramente informativo. Se construye `FeatureCard` como componente nuevo, visualmente equivalente
(`bg-surface`, `border-subtle`, radio `lg`) pero sin esa semántica.

### 3.3 Internacionalización

- Namespace nuevo `landing` en `i18n/locales/es-CO/landing.json`, con todo el copy de §3.1 como
  llaves (`camelCase`, sin texto visible hardcodeado — regla dura 2).
- El switch ES/EN debe ser **funcional de verdad** (decisión de Frontend, 19-sep-2026): esto
  exige poblar `i18n/locales/en/` con traducción de **los cinco namespaces ya existentes**
  (`common`, `auth`, `profile`, `interview`, `errors`) además de `landing`. Hoy `locales/en/` no
  existe (`fallbackLng: 'es-CO'` es el único mecanismo).
- El contenido en inglés lo genera Claude Code como primer borrador; **la aprobación final del
  contenido es responsabilidad de Frontend** antes de fusionarse — no se da por definitivo solo
  porque compile o pase pruebas de existencia de llave.
- No se traduce nada del dominio de Entrevistas (`interview:modo.*`, códigos de sesión, etc.) más
  allá de su etiqueta visible: esos códigos siguen en español por decisión ya tomada y pendiente
  de C-08 (`GLOSSARY.md` §5); traducir la etiqueta visible no cambia el código.
- El propio Figma no dibuja ningún frame en inglés: la evidencia visual de esta pantalla en ambos
  idiomas será, en la práctica, la traducción que aquí se apruebe — no hay un mockup de
  referencia para el inglés.
- Persistencia ya resuelta por `i18next-browser-languagedetector`
  (`detection.caches: ['localStorage']`); no se construye nada nuevo para esto.

### 3.4 Accesibilidad

- Área táctil mínima 44×44 en ambos botones del header (token `--touch-target`, ya existente).
  **Corrección durante la implementación:** el propio componente `language-switcher` de Figma
  (nodo `49:355`) mide 34px de alto, no 44px — la misma clase de excepción ya trackeada en
  `CLAUDE.md` §17 para `Button` `size="sm"` (también 34px, también por debajo del mínimo). No se
  infla el componente a 44px inventando una altura que Figma no dibuja; se implementa pixel-exacto
  y se deja como excepción pendiente igual que la de `Button`, no como algo nuevo resuelto aquí.
- El anillo de foco (`border/focus` + halo) no se elimina en ningún elemento interactivo nuevo.
- `FeatureCard` no lleva ningún `role` interactivo: es contenido, no control. Si en el futuro
  alguna tarjeta se vuelve clicable, ese es un cambio de alcance que debe pasar por una decisión
  explícita, no una extensión silenciosa de este componente.
- `LanguageSwitcher`: nombre accesible obligatorio (`aria-label` traducido, nunca hardcodeado —
  regla dura 2) indicando el idioma seleccionado.

### 3.5 SEO

- Se integra `HelmetProvider` en `app/providers/AppProviders.tsx` (hoy ausente; la dependencia
  `react-helmet-async@3.0.0` ya está instalada).
- `LandingPage.tsx` declara `<title>` y metadatos Open Graph básicos (título, descripción) usando
  las mismas llaves de `landing.json`, para no duplicar copy.
- `index.html` ya anticipa este mecanismo con un `<title>` de respaldo — no se toca ese archivo
  salvo que Claude Code encuentre una razón concreta durante la implementación.

### 3.6 Ajustes de design system encontrados durante Analizar/Planificar (Claude Code, 19-sep-2026)

Estas dos decisiones no estaban anticipadas cuando se escribió la primera versión de esta SPEC
porque dependían de detalle de implementación que solo apareció al revisar el código real
(`styles/semantic.css`/`index.css`) contra Figma. Se documentan aquí en el mismo espíritu de
SDD-Anchored: el código reveló una restricción, se tomó una decisión, la SPEC se actualiza.

**Tokens de texto para `sm`.** Figma define `text/display-sm` (34/36, ExtraBold) y `text/h2-sm`
(21/27, Bold) como estilos reales y distintos para el título del hero y los títulos de sección en
el frame `sm` (§3.1). El código no tenía tokens propios para esto — solo sobrescribía
`--text-display`/`--text-h2` dentro de un bloque `@media (max-width: 599px)` global, un corte que
no coincide con el punto de quiebre `sm`/`lg` de esta feature (768px, alineado con `AppShell`,
§3.1). **Decisión:** se agregan `--text-display-sm` y `--text-h2-sm` como tokens semánticos
nuevos, con los valores exactos de Figma, aplicados con utilidades responsivas que cambian
exactamente en el punto de corte real de esta feature — `lg`, 1024px, corregido más abajo en esta
misma sección respecto a la primera versión de esta SPEC (ej. `text-display-sm lg:text-display`).
No se toca el mecanismo de 599px ya usado en el resto de la app — es un token nuevo, no una
redefinición del existente. Justificación: usar el mecanismo de 599px produciría un desajuste
visible en toda la franja donde el layout de Landing ya está apilado (hasta 1023px, según el corte
corregido de §3.1) pero los títulos seguirían con el tamaño de escritorio — exactamente el tipo de
inconsistencia que `CLAUDE.md` §6 busca evitar al exigir tokens reales en vez de valores repetidos
por ahí.

**Tamaño del logo en el pie.** Figma dibuja el glyph del logo del pie visiblemente más chico que
el del header — 19.95px vs 15.67px de alto en `lg`, 17.10px vs 14.25px en `sm` (evidencia ya
confirmada en la investigación de Figma, ~21% más chico en ambos breakpoints). El átomo `Logo`
no tenía prop de tamaño: estaba fijo al tamaño del header porque su único consumidor hasta ahora
(`AuthLayout`) nunca necesitó otro. **Decisión:** se extiende `Logo` con un prop `size`
(`default` = tamaño actual de header, sin cambios para `AuthLayout`; `sm` = tamaño del pie, con
los valores exactos de Figma). Es una extensión legítima del átomo, no una regla nueva: Landing es
el primer caso real que necesita dos tamaños del mismo logo en la misma pantalla, y la alternativa
(renderizar el pie al tamaño del header) sería una divergencia visible de Figma sin ninguna razón
técnica que la justifique — a diferencia de la divergencia sí justificada de `FeatureCard` en §9,
que responde a un problema real de accesibilidad, no a evitar trabajo.

## 4. Contrato observable

Esta pantalla no consume ningún dato de dominio del backend. Los dos únicos "campos" observables
son de estado de cliente, no de contrato HTTP:

**Campos y reglas**

| Campo | Tipo | Regla | Origen |
| ----- | ---- | ----- | ------ |
| Idioma de interfaz | `'es-CO' \| 'en'` | Persistido en `localStorage`; por defecto el que detecte el navegador, con `fallbackLng: 'es-CO'` | `i18n/config.ts`, `SUPPORTED_LANGUAGES` |
| Estado de sesión | `{ isLoading: boolean; isAuthenticated: boolean }` | Mientras `isLoading`, `RedirectIfAuthenticated` no decide todavía; al resolverse, si `isAuthenticated` redirige a `/inicio` | `stores/auth.store.ts` |

**Estados y enumerados:** no aplica ningún enumerado de dominio del `GLOSSARY.md` en esta
pantalla.

**Errores que el usuario puede ver:** ninguno propio de esta feature (no aplica tabla).

## 5. Enlace HTTP · PROVISIONAL

**Estado del contrato:** no aplica — esta feature no depende de backend. Los CTAs navegan a rutas
ya existentes (`ROUTES.registro`, `ROUTES.ingresar`); las llamadas HTTP de esos flujos pertenecen
a HE-01, no a esta SPEC.

| Operación | Método y ruta | Envía | Recibe |
| --------- | ------------- | ----- | ------ |
| — | — | — | — |

## 6. Criterios de aceptación

| Criterio | Qué hace el frontend que el criterio no dice |
| -------- | --------------------------------------------- |
| CA-10.1.1 | Implementa las seis secciones de §3.1 en los dos breakpoints verificados contra Figma, con `LanguageSwitcher` funcional. |
| CA-10.1.2 | Ambos CTAs son instancias del átomo `Button` existente y navegan con `ROUTES.registro`/`ROUTES.ingresar`, ya definidas; no se crean rutas nuevas. |
| CA-10.1.3 | El criterio llega incompleto desde el backlog (columnas Dado/Cuando/Entonces desalineadas, sin resultado explícito — ver hoja `Criterios de aceptación`, fila `CA-10.1.3`). El frontend interpreta el resultado esperado a partir del texto narrativo de HU-10.1 y lo confirma contra el comportamiento ya implementado en `RedirectIfAuthenticated`: redirección a `ROUTES.inicio`. Confirmado directamente por Frontend/PO el 19-sep-2026. |

## 7. Estado de implementación

| Archivo | Qué implementa | Prueba |
| ------- | -------------- | ------ |
| `src/features/landing/pages/LandingPage.tsx` | Composición completa de la pantalla (reemplaza el placeholder actual) | `src/features/landing/pages/LandingPage.test.tsx` |
| `src/features/landing/organisms/HeaderPublico/HeaderPublico.tsx` | Header público, reflow `sm`/`lg` de §3.1 | `src/features/landing/organisms/HeaderPublico/HeaderPublico.test.tsx` |
| `src/features/landing/organisms/FeatureCard/FeatureCard.tsx` | Tarjeta informativa no interactiva, reutilizada 5 veces | `src/features/landing/organisms/FeatureCard/FeatureCard.test.tsx` |
| `src/features/landing/organisms/Footer/Footer.tsx` | Pie de página, con la agrupación distinta en `sm` (§3.1) | `src/features/landing/organisms/Footer/Footer.test.tsx` |
| `src/design-system/organisms/LanguageSwitcher/LanguageSwitcher.tsx` | Selector ES/EN reutilizable | `src/design-system/organisms/LanguageSwitcher/LanguageSwitcher.test.tsx` |
| `src/i18n/locales/es-CO/landing.json` | Copy de la landing en español | cubierto por `src/features/landing/pages/LandingPage.test.tsx` |
| `src/i18n/locales/en/common.json`, `auth.json`, `profile.json`, `interview.json`, `errors.json`, `landing.json` | Traducción al inglés de toda la app | validado por aprobación humana (Frontend), no por prueba automática de contenido |
| `src/app/providers/AppProviders.tsx` (modificado) | Integra `HelmetProvider` | cubierto por `src/app/router/index.test.tsx` (envuelve `HelmetProvider` para renderizar `LandingPage` real) |
| `src/design-system/atoms/Logo/Logo.tsx` (modificado) | Prop `size` nuevo (`default`/`sm`), ver §3.6 | `src/design-system/atoms/Logo/Logo.test.tsx` (actualizado) |
| `src/styles/index.css` (modificado) | Tokens nuevos `--text-display-sm`, `--text-h2-sm`, ver §3.6 | validación visual manual contra los nodos 67:2/69:63 (no hay snapshot visual automatizado en el proyecto) |
| `src/test/setup.ts` (modificado) | Fija el idioma a `es-CO` antes de cada prueba — hallazgo real durante la implementación, ver §9 | cubierto indirectamente: toda la suite pasa con textos en español |
| `docs/bitacora-ia/CM-186.md` | Evidencia de la sesión asistida por IA (formato ya usado en el proyecto) | — |
| `docs/decisiones/19092026_v1_decisiones-landing-cm-186.md` (nuevo, recomendado) | Formaliza las tres decisiones de esta conversación (i18n funcional, confirmación de redirect, SEO en alcance) | — |

## 8. Bloqueos

| Id | Qué falta | De quién depende | Desde |
| -- | --------- | ------------------ | ----- |
| — | Ninguno. Esta feature no depende de backend ni de otra feature en curso. | — | — |

## 9. Notas

**Diferencia consciente respecto a Figma.** Las cinco tarjetas informativas (3 de características
+ 2 de modo) no reutilizan `card-selectable` pese a que el frame `sm` de Figma sí las modela como
instancias de ese componente (mientras que `lg` las dibuja como frames sueltos con el mismo
nombre visual — discrepancia real entre los dos breakpoints, dentro del propio archivo de
diseño). Se construye `FeatureCard`, un componente nuevo sin semántica de selección, porque
`role="radio"`/`aria-checked` en contenido no interactivo es un defecto de accesibilidad, no un
detalle cosmético. Manda la SPEC sobre el diseño (`CLAUDE.md` §16); se recomienda que diseño
unifique el componente base en ambos breakpoints de Figma en una siguiente iteración.

**Responsive sin diseño de tablet.** No existe ningún frame `md` de PRT-00.01 en Figma —
confirmado directamente por Frontend/PO el 19-sep-2026, no solo por límite de la herramienta de
inspección. Se resuelve con dos estados reales (`sm` <1024px, `lg` ≥1024px, fluido desde 1024px
hasta 1440px y más allá) — punto de corte corregido durante la implementación (§3.1): no es el
`md` de `AppShell` (600px, insuficiente para el layout de ancho fijo de `lg`) sino el `lg` que el
propio tema ya registra (1024px). Riesgo aceptado, más amplio que en la primera versión de esta
SPEC: el layout `lg` fue diseñado a 1440px; entre 1024–1439px puede verse más espacioso/apretado de
lo que diseño aprobaría con un mockup dedicado. A cambio, toda la franja 600–1023px (que con el
corte original habría forzado el layout de escritorio de ancho fijo a desbordar) recibe el layout
`sm` completo — apilado, pensado para 390px, por lo que en una tablet de 768–1023px se verá
correcto pero notablemente más espacioso/vacío de lo que un diseño dedicado de tablet probablemente
propondría. No se inventa un tercer diseño — si el resultado se ve mal en alguna de las dos
franjas, es una señal para pedir un mockup real, no para que el frontend improvise valores.

**Alcance de traducción ampliado.** Por decisión de Frontend (19-sep-2026), el switch ES/EN se
implementa funcional desde ya, lo que exige traducir al inglés los cinco namespaces ya existentes
además de crear `landing`. Esto amplía el trabajo más allá de "solo la landing" y se recomienda
formalizarlo en `docs/decisiones/` (ver tabla de §7) para que quede trazable igual que las demás
decisiones del proyecto (patrón `10092026_v1_solicitud.../11092026_v2_respuesta...`).

**CA-10.1.3 incompleto en el backlog.** Ver §6. Se recomienda corregir el Excel del backlog con
el mismo tratamiento que ya tuvo el proyecto para otros defectos de captura (patrón J-05, S-02).

**Asimetría entre guards.** `RequireAuth` muestra `Spinner` mientras `isLoading`;
`RedirectIfAuthenticated` no, y dejaría ver la Landing brevemente a un usuario con sesión activa
mientras Firebase resuelve. No se corrige en esta HU porque el guard es compartido con
`/registro` e `/ingresar` y HU-10.1 "cubre únicamente PRT-00.01". Se deja documentado como riesgo
conocido para que alguien decida si amerita ticket propio.

**Idioma por defecto de la suite de pruebas, descubierto al implementar.** Antes de este commit,
`locales/en/` no existía, así que ninguna prueba notaba que jsdom reporta `navigator.language`
como `"en"` por defecto: cualquier detección caía en `fallbackLng: 'es-CO'` sin que nadie lo viera.
Al poblar `locales/en/` con contenido real (decisión de este mismo §9, "Alcance de traducción
ampliado"), `src/i18n/index.test.tsx` empezó a fallar — la instancia compartida de i18next
resolvía a inglés real en vez de caer al español por fallback. Se corrigió fijando el idioma a
`es-CO` antes de cada prueba en `src/test/setup.ts` (infraestructura de pruebas, mismo criterio ya
usado ahí para `resetProfiles()`), no en cada archivo de prueba nuevo o existente. Sin este cambio,
cualquier prueba futura que renderice texto a través de la instancia compartida de i18next sin
fijar idioma explícitamente habría quedado expuesta al mismo riesgo.

**Punto de corte real corregido durante la implementación.** Ver §3.1/§3.6: la primera versión de
esta SPEC describía el corte como el `md` de `AppShell`, "768px" — el `md` real de este proyecto es
600px, y aplicarlo tal cual habría desbordado el layout `lg` (ancho fijo) entre 600–1023px. Se usa
en su lugar `lg` (1024px, ya registrado en el tema). Confirmado con el usuario antes de escribir
ningún componente (no es una corrección silenciosa).

**Documentación a actualizar en el mismo PR:**
- `docs/ARCHITECTURE.md` §7, riesgo #1: ya no aplica para Landing (sigue aplicando para el
  Tablero/PRT-00.02, HU-10.2, que no es parte de esta SPEC).
- `docs/CLAUDE.md` §12, "Contradicciones abiertas", punto 8: marcar como resuelto para Landing
  (HU-10.1 ya existe), dejar abierto para Tablero.
- `docs/CLAUDE.md` §17, tabla de pendientes: revisar si el patrón de `api/`/`*.dto.ts`/
  `*.mapper.ts` sigue sin estrenarse tras esta feature (Landing no necesita `api/`, así que
  probablemente esa fila no cambia — Claude Code confirma).

**Validación pendiente de ejecución (no de diseño):** aunque toda la estructura de esta SPEC ya
está verificada contra Figma real, el propio código construido debe compararse visualmente contra
los nodos `67:2` (lg) y `69:63` (sm) al terminar — no basta con que compile y pasen las pruebas.
