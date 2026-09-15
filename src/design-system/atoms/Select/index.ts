/**
 * Barril de `Select`. Expone `Select` y el tipo `SelectOption` para quien lo
 * consuma desde fuera de esta carpeta. No exporta `SelectProps` (CLAUDE.md
 * §14.5: las interfaces *Props no se exportan) ni actúa como barril de
 * categoría — cada componente del design system tiene el suyo, nunca uno
 * compartido (§14.6).
 */
export { Select, type SelectOption } from './Select';
