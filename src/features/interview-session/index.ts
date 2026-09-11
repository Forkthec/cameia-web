/**
 * Barril de esta feature. Expone únicamente `interviewSessionRoutes` para que
 * `app/router` las monte. Organismos, páginas, hooks y store internos de
 * la feature no se exportan aquí — nadie fuera de la feature los necesita
 * todavía (CLAUDE.md §4; §14.6: barril solo en la raíz de la feature, no
 * de categoría).
 */
export { interviewSessionRoutes } from './routes';
