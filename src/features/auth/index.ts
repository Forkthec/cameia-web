/**
 * Barril de esta feature. Expone `authRoutes` (login/registro, dentro de
 * `RedirectIfAuthenticated`) y `verifyEmailRoutes` (verificación de correo,
 * pública sin guard) para que `app/router` las monte.
 */
export { authRoutes, verifyEmailRoutes } from './routes';
