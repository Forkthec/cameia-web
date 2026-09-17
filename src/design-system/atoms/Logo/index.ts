/**
 * Barril de `Logo`. Expone `Logo` para quien lo consuma desde fuera de esta
 * carpeta. No exporta `LogoProps` (CLAUDE.md §14.5: las interfaces *Props no
 * se exportan) ni actúa como barril de categoría — cada componente del
 * design system tiene el suyo, nunca uno compartido (§14.6).
 */
export { Logo } from './Logo';
