/**
 * Barril de `PasswordStrength`. Expone `PasswordStrength` y el tipo `PasswordStrengthLevel` para quien lo
 * consuma desde fuera de esta carpeta. No exporta `PasswordStrengthProps` (CLAUDE.md
 * §14.5: las interfaces *Props no se exportan) ni actúa como barril de
 * categoría — cada componente del design system tiene el suyo, nunca uno
 * compartido (§14.6).
 */
export { PasswordStrength, type PasswordStrengthLevel } from './PasswordStrength';
