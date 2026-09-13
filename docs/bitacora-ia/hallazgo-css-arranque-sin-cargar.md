## Tarea 1 · 13-sep-2026 · Herramienta: Claude Code (Claude Sonnet 5) · La SPA nunca cargaba su hoja de estilos

**Petición/prompt relevante (resumen).** Durante la revisión visual de CM-46 (selección del
método de configuración del perfil), una captura de pantalla del usuario mostró la pantalla sin
ningún estilo (tipografía serif, sin colores, sin layout). El usuario pidió, en este orden: (1)
solo lectura, evidencia literal de la causa; (2) plan mode para el fix mínimo, con confirmación
antes de escribir; (3) ejecución en dos commits separados en la misma rama de CM-46 (por decisión
explícita del usuario, sin abrir ticket de Jira: este archivo es el único registro trazado); (4)
verificación del fix con evidencia literal, no descripciones.

**Resultado.** Causa: ningún archivo del proyecto importaba `src/styles/index.css` — ni
`src/main.tsx`, ni `index.html`, ni ningún otro módulo alcanzable desde el punto de entrada. El
plugin `@tailwindcss/vite` ya estaba correctamente registrado en `vite.config.ts` y las
dependencias (`tailwindcss`, `@tailwindcss/vite`, ambas `4.3.3`) ya estaban instaladas — no hacía
falta instalar nada, solo cablear el import que faltaba. Confirmado con `git log`/`git status` que
`main.tsx` e `index.html` no forman parte del diff de CM-46 y no han cambiado desde su commit de
creación (`255a199`, `06ffc35`): es un defecto preexistente en `develop`, no introducido por esa
rama.

Evidencia ANTES del fix (`rm -rf dist && pnpm build`):

```
dist/assets/index-AmMhj-He.js  602.65 kB
```

Cero archivos `.css` en `dist/assets/`.

Fix aplicado: una línea en `src/main.tsx`, `import '@/styles/index.css';`, entre los imports
externos (`react`, `react-dom/client`) y el relativo (`./app/App`), respetando el orden de tres
grupos de CLAUDE.md §14.3. Ningún cambio en `vite.config.ts` ni en `index.html`: el plugin de
Tailwind transforma cualquier CSS que llegue a formar parte del grafo de módulos, sin necesitar
una declaración de entrada aparte; Vite inserta el `<link>`/`<style>` compilado automáticamente.

Evidencia DESPUÉS del fix (`rm -rf dist && pnpm build`):

```
dist/assets/index-D1nw6HNg.css   30.08 kB │ gzip:   6.67 kB
dist/assets/index-D3hYKGuk.js   602.63 kB │ gzip: 186.20 kB
```

El HTML servido en dev por `pnpm dev` refleja el import real en el módulo transpilado
(`import "/src/styles/index.css?t=...";`, en la posición exacta del código fuente), y el CSS
generado sí contiene reglas de interacción reales, incluidas las que usa el organismo
`ProfileMethodSelector` de CM-46 (verificadas con `grep` sobre `dist/assets/index-*.css`):

```
.enabled\:hover\:scale-102:enabled:hover{...}
.enabled\:focus-visible\:scale-102:enabled:focus-visible{...}
.shadow-elevation-2{...}
.border-brand-base{...}
.motion-reduce\:transform-none{transform:none}
.motion-reduce\:transition-none{transition-property:none}
.motion-reduce\:hover\:scale-100:hover{...}
.motion-reduce\:focus-visible\:scale-100:focus-visible{...}
```

**¿Llegó esto a producción?** Verificado con `git log origin/main` y
`git merge-base --is-ancestor origin/main origin/develop`: el único commit real de `main` es el de
andamiaje inicial (`d2bdaa6`, 03-sep-2026) y `main` es ancestro de `develop` — nunca ha recibido un
push de promoción. El job `desplegar-main` de
`.github/workflows/despliegue-continuo.yml` (canal `live` de Firebase Hosting, producción real)
solo corre `on: push` a `main`, así que **nunca se ha ejecutado con código real: sin evidencia de
que esto haya llegado a producción**. El job `desplegar-develop-pr` sí corre en cada push a
`develop` (canal `staging`) y en cada Pull Request (canal de vista previa); como `develop` ya
tiene commits de varios PRs fusionados, es razonablemente seguro que el canal `staging` se
redesplegó repetidamente sin CSS, aunque no fue posible confirmar cada corrida puntual porque este
entorno no tiene acceso a la CLI de GitHub Actions (`gh`) para consultar el historial de
ejecuciones.

**Qué se aceptó, corrigió o rechazó, y por qué.** El usuario pidió, antes de escribir código,
verificar con evidencia fresca (no la ya mostrada antes) cinco cosas concretas: contenido literal
de `main.tsx`/`index.html`/`vite.config.ts`/la hoja de estilos raíz; si `tailwindcss` y
`@tailwindcss/vite` ya estaban instalados con versión exacta (si no, parar antes de tocar
`package.json`); confirmación fresca de `pnpm build && ls dist/assets/`; y lectura literal del
workflow de despliegue para saber si esto llegó a producción. Las cinco confirmaron que el fix
real era más pequeño de lo que el propio usuario había anticipado: solo `src/main.tsx`, sin tocar
`vite.config.ts` ni `package.json` — se lo señalé explícitamente en el plan en vez de tocar esos
archivos porque el usuario los había mencionado. El usuario aprobó el plan (una línea de import,
sin cambios en `vite.config.ts`) sin pedir ajustes.

**Responsable de la comprobación.** Juan Diego Gómez Garcés; revisión humana pendiente hasta el
Pull Request. Este hallazgo no tiene ticket de Jira por decisión explícita del usuario: el
registro completo vive en este archivo y en la descripción del Pull Request de CM-46.
