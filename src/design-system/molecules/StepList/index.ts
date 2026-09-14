/**
 * Barril de `StepList`. Expone `StepList` y el tipo `StepListItem` para quien lo
 * consuma desde fuera de esta carpeta. No exporta `StepListProps` (CLAUDE.md
 * §14.5: las interfaces *Props no se exportan) ni actúa como barril de
 * categoría — cada componente del design system tiene el suyo, nunca uno
 * compartido (§14.6).
 */
export { StepList, type StepListItem } from './StepList';
