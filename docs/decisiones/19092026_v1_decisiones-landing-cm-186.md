# Decisiones de Frontend — Landing pública (CM-186 / HU-10.1)

- **Quién decide:** Juan Diego Gómez Garcés — Frontend (con Claude Code, `[IA-ASISTIDO]`)
- **Fecha:** 19 de septiembre de 2026
- **Referencia:** `src/features/landing/SPEC.md` (PRT-00.01)
- **Naturaleza:** estas son decisiones de **diseño/implementación de Frontend**, no del backlog —
  `CLAUDE.md` §16: "el comportamiento lo fija el backlog, el diseño lo fija Frontend". Se formalizan
  aquí por el mismo motivo que las respuestas del PO en
  `11092026_v2_respuesta-decisiones-frontend-sprint-1.md`: que queden trazables, no solo dichas en
  una conversación.

---

## Tabla de decisiones

| ID | Decisión | Motivo |
| -- | -------- | ------ |
| FE-01 | i18n ES/EN funcional desde ya, ampliando la traducción a los 5 namespaces existentes (`common`, `auth`, `profile`, `interview`, `errors`), no solo `landing` | El `LanguageSwitcher` de la Landing es el primer punto donde un Visitante cambia el idioma de **toda la app** (`SPEC.md` §3, "Qué hace"). Dejar `locales/en/` a medio poblar habría hecho que el switch mintiera fuera de la Landing. |
| FE-02 | CA-10.1.3 (incompleto en el backlog) se interpreta como confirmación de que `RedirectIfAuthenticated` ya redirige a `ROUTES.inicio` | El criterio llega sin resultado explícito en la hoja de backlog (Dado/Cuando/Entonces desalineados). El comportamiento ya existe en código (`app/router/guards/RequireAuth.tsx`) desde antes de esta HU; esta decisión solo confirma que es lo que el criterio pedía. |
| FE-03 | SEO entra en el alcance de esta HU: `HelmetProvider` se cablea en `AppProviders.tsx` y `LandingPage` declara `<title>`/Open Graph | La dependencia `react-helmet-async` ya estaba instalada pero sin usar. La Landing es la única pantalla pública indexable del MVP (`CLAUDE.md` §1); dejar el `<title>` en el valor de respaldo de `index.html` para la única pantalla que sí importa para SEO no tenía sentido. |
| FE-04 | El punto de corte `sm`/`lg` de la Landing usa el breakpoint `lg` (1024px) del tema, no el `md` (600px) que usa `AppShell` | Hallazgo durante la implementación: la primera versión de `SPEC.md` §3.1 describía el corte como "`md`, Tailwind 768px", pero el `md` real de este proyecto es 600px (`styles/index.css`). Aplicado tal cual a un layout `lg` de anchos fijos (tres tarjetas de 400px), habría desbordado el viewport entre 600–1023px. Se usa `lg` (1024px), ya registrado en el tema. Confirmado con el usuario antes de escribir componentes — ver `SPEC.md` §3.1/§9. |
| FE-05 | Se agregan `--text-display-sm`/`--text-h2-sm` como tokens semánticos nuevos, no se reutiliza el mecanismo existente de `@media (max-width: 599px)` | Figma define ambos como estilos reales y distintos de `text/display`/`text/h2`. El mecanismo de 599px ya usado en el resto de la app cambia en un punto distinto al de esta feature (1024px); reutilizarlo habría dejado un tramo con layout apilado pero texto de escritorio. Confirmado con el usuario — ver `SPEC.md` §3.6. |
| FE-06 | El átomo `Logo` se extiende con un prop `size` (`default`/`sm`) en vez de renderizar el pie de página al tamaño del header | Figma dibuja el glifo del pie ~21% más chico que el del header. `AuthLayout`, único consumidor hasta ahora, nunca necesitó más de un tamaño. Landing es el primer caso real con dos tamaños del mismo logo en una misma pantalla. Confirmado con el usuario — ver `SPEC.md` §3.6. |

---

## Detalle

### FE-01 · i18n funcional

Antes de esta HU, `locales/en/` no existía: `SUPPORTED_LANGUAGES` declaraba `'en'` pero
`fallbackLng: 'es-CO'` resolvía todo. Construir un `LanguageSwitcher` funcional solo para el
namespace `landing` habría dejado el resto de la app en español al cambiar a inglés desde la
Landing — visible e inconsistente apenas se navegara a `/registro` o `/ingresar`. Se tradujeron
los 5 namespaces existentes además de `landing`, como primer borrador generado por Claude Code,
**pendiente de aprobación de Frontend** antes de darse por definitivo (no se aprueba con que
compile o pase pruebas de existencia de llave).

Efecto secundario real, no anticipado: jsdom reporta `navigator.language` como `"en"` por defecto,
y antes de esta HU eso no importaba porque `"en"` no tenía recursos propios. Al poblarlos,
`src/i18n/index.test.tsx` empezó a fallar. Se corrigió fijando el idioma a `es-CO` antes de cada
prueba en `src/test/setup.ts` — ver `SPEC.md` §9 para el detalle.

### FE-02 · CA-10.1.3

Ver `SPEC.md` §6. El criterio no se inventa: se interpreta del texto narrativo de HU-10.1 y se
confirma contra un comportamiento que ya existía en el guard compartido, no contra una
implementación nueva de esta HU.

### FE-03 · SEO

`HelmetProvider` se agrega afuera de `QueryClientProvider`/`I18nextProvider` en el árbol de
`AppProviders.tsx`, porque no depende de ninguno de los dos y cualquier pantalla —autenticada o
no— puede necesitar declarar su propio `<title>` en el futuro.

### FE-04, FE-05, FE-06

Las tres comparten el mismo origen: se descubrieron leyendo el código real
(`styles/index.css`, `design-system/atoms/Logo/Logo.tsx`) contra la evidencia real de Figma
(nodos `67:2`/`69:63`), no asumiendo que la primera versión de `SPEC.md` seguía describiendo el
estado actual del repositorio — el mismo criterio de `CLAUDE.md` §13 que motivó el incidente de
CM-53. Detalle completo, con los valores exactos de Figma, en `SPEC.md` §3.1/§3.6.
