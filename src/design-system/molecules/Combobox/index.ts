/**
 * Barril de `Combobox`. Expone `Combobox` y el tipo `ComboboxOption` para quien lo
 * consuma desde fuera de esta carpeta. No exporta `ComboboxProps` (CLAUDE.md
 * §14.5: las interfaces *Props no se exportan) ni actúa como barril de
 * categoría — cada componente del design system tiene el suyo, nunca uno
 * compartido (§14.6).
 */
export { Combobox, type ComboboxOption } from './Combobox';
