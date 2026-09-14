/**
 * Barril de `NavHeader`. Expone `NavHeader` y el tipo `NavItem` para quien lo
 * consuma desde fuera de esta carpeta. No exporta `NavHeaderProps` (CLAUDE.md
 * §14.5: las interfaces *Props no se exportan) ni actúa como barril de
 * categoría — cada componente del design system tiene el suyo, nunca uno
 * compartido (§14.6).
 */
export { NavHeader } from './NavHeader';
export type { NavItem } from './NavHeader';
