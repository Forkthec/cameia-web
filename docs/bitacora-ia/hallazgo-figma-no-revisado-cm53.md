## Tarea 1 · 14-sep-2026 · Herramienta: Claude Code (Claude Sonnet 5, plan mode) · CM-53 se construyó sin revisar el prototipo real de Figma

**Petición/prompt relevante (resumen).** Prompt maestro de CM-53 (HU-2.3, Información General y
Resumen Profesional) pedía explícitamente, en su §7.4, revisar el frame de Figma (PRT-02.03) antes
de decidir la UX de guardado. La sesión construyó la pantalla completa —`model/`, `schemas/`,
mocks (`GET /:id`, `summaryProvenance`), organismo `GeneralInfoForm`, página `EditProfilePage`,
extensión de `WizardLayout`, 4 commits— citando en cambio lo que ya describían `SPEC.md` y
`CLAUDE.md` §6/§11 (un asistente de tres pasos compartiendo `/perfiles/:id/editar`, con
`WizardLayout` como su plantilla) sin abrir el archivo de Figma ni una sola vez. El usuario
preguntó directamente «¿revisaste el prototipo en Figma?» y la respuesta honesta fue no.

**Resultado — lo que decía la documentación heredada vs. lo que muestra el prototipo real**
(`PRT-02.03 · Formulario de Perfil Profesional`, nodos `140:960` lg / `142:638` sm, archivo
`Cameia · Mockups MVP`):

| Se asumió (por herencia documental, sin verificar) | Muestra el frame real |
| --- | --- |
| Asistente de 3 pasos secuenciales, uno por pantalla, compartiendo la ruta | **Una sola página**, scroll continuo, con las 4 secciones (Información General, Formación académica, Experiencia Laboral, Expectativas Profesionales) visibles a la vez |
| `WizardLayout`: header con `Stepper` horizontal + footer con un botón primario | Ningún `Stepper` horizontal. Un índice lateral vertical (`step-list`) en `lg`; un **acordeón** en `sm` — patrones de navegación distintos por breakpoint, ninguno es `WizardLayout` |
| «Guardar borrador» como único botón, `variant="primary"` | Dos botones en una barra de acciones compartida (con `progress-bar` de completitud del perfil): «Guardar borrador» es **`variant="secondary"`** (borde, sin relleno); el primario real es «Finalizar y Continuar», deshabilitado hasta completar las 4 secciones — coherente con la regla R3 del propio archivo de Figma («un solo primario mostaza, nunca dos a la vez») |
| Campos de Información General: `name` + `summary` | `name` (etiqueta «Nombre del perfil», fuera de cualquier sección, con ayuda literal `Por ejemplo: "Analista de datos" o "Producto senior".`) + `summary` (contador **`0 / 600 caracteres`**, no 2000) + un campo **`Ubicación`** que no existe en ningún CA de HU-2.3, en el glosario ni en el mock |
— | *(corrección, 14-sep-2026: esta fila afirmaba que los nodos `121:184`/`191:500` citados en `SPEC.md` §9 no correspondían a nada visible. Al revisar el frame real de PRT-02.03 el nodo `191:500`/`191:501` sí es el logo dentro de `nav-header` — la comparación original se hizo contra los IDs internos de la página `02 · Componentes`, no contra la instancia real de la pantalla, y era una comparación inválida. Se retira la fila para no dejar una afirmación falsa en un documento sobre verificar antes de afirmar; `121:184` sigue sin comprobarse específicamente, sin evidencia en ningún sentido.)* |

**Causa raíz.** Ninguna sesión anterior (CM-100, CM-46) verificó estos detalles contra Figma en el
momento de escribirlos: los citó como si fueran hechos comprobados, y cada sesión posterior
(incluida esta) los heredó y les dio más crédito por estar ya en `SPEC.md`/`CLAUDE.md` que a la
fuente primaria. Es exactamente el patrón de un documento que hereda un error y lo repite con
autoridad.

**Corrección de proceso.** Regla dura nueva en `CLAUDE.md` §13: antes de tocar código de cualquier
pantalla con `PRT-XX.XX`, abrir el prototipo real en Figma (`get_metadata` + `get_design_context`,
con la skill `figma-design-to-code` cargada) en esa misma sesión, sin importar cuánto detalle ya
describa la documentación del repo.

**Corrección de código.** Ver el commit(s) posteriores en la rama `CM-53-informacion-general-perfil`
para el detalle de qué se revirtió y qué se conservó (la capa de mocks/API/hooks no dependía del
layout visual y se mantuvo; `WizardLayout.tsx` y el uso de `WizardLayout` en `EditProfilePage` se
revirtieron por no corresponder al diseño real).
