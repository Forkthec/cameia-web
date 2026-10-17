/**
 * Barril de `Logo`. Expone `Logo` y su glifo `BrandMark` (que la landing usa
 * suelto para la intro de marca y el banner de cierre, donde el sol se anima
 * aparte). No exporta `LogoProps` ni `BrandMarkProps` (CLAUDE.md §14.5: las
 * interfaces *Props no se exportan) ni actúa como barril de categoría — cada
 * componente del design system tiene el suyo, nunca uno compartido (§14.6).
 */
export { BrandMark } from './BrandMark';
export { Logo } from './Logo';
