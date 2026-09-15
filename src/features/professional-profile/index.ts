/**
 * Barril de esta feature. Expone únicamente `professionalProfileShellRoutes`
 * para que `app/router` la monte. Organismos, páginas, hooks y store
 * internos de la feature no se exportan aquí — nadie fuera de la feature
 * los necesita todavía (CLAUDE.md §4; §14.6: barril solo en la raíz de la
 * feature, no de categoría).
 *
 * `professionalProfileWizardRoutes` se retiró en CM-61 (SPEC.md §9,
 * decisión D-E): todas las pantallas de esta feature viven ahora dentro de
 * `AppShell`, ninguna usa `WizardLayout`.
 */
export { professionalProfileShellRoutes } from './routes';
