/**
 * Barril de esta feature. Expone únicamente sus grupos de rutas
 * (`authRoutes` y `verificarCorreoRoutes`, separados porque cada uno cuelga
 * de un guard distinto — ver `routes.tsx`) para que `app/router` los monte. Organismos, páginas, hooks y store internos de
 * la feature no se exportan aquí — nadie fuera de la feature los necesita
 * todavía (CLAUDE.md §4; §14.6: barril solo en la raíz de la feature, no
 * de categoría).
 */
export { authRoutes, verificarCorreoRoutes } from './routes';
