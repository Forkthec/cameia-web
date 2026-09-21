/**
 * Agrega los handlers de todas las áreas simuladas. `browser.ts` y
 * `server.ts` consumen este único array; añadir un área nueva es añadir un
 * archivo aquí, no tocar los dos puntos de arranque. MSW resuelve por el
 * primer handler que hace match, en el orden de este array — por eso
 * `professionalRolesHandlers` va ANTES que `profilesHandlers` (CM-195): desde
 * que el catálogo se movió a `GET /api/v1/profiles/professional-roles`
 * (SYNC-01), esa ruta literal choca con el comodín `GET /api/v1/profiles/:id`
 * de `profilesHandlers` (`:id` también matchea el segmento
 * `"professional-roles"`); si `profilesHandlers` fuera primero, esa ruta se
 * tragaría el catálogo y respondería 404 `Perfil no encontrado`.
 */
import { authHandlers } from './auth.handlers';
import { profilesHandlers } from './profiles.handlers';
import { professionalRolesHandlers } from './professionalRoles.handlers';

export const handlers = [...authHandlers, ...professionalRolesHandlers, ...profilesHandlers];
