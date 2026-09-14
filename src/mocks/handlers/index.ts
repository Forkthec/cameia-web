/**
 * Agrega los handlers de todas las áreas simuladas. `browser.ts` y
 * `server.ts` consumen este único array; añadir un área nueva es añadir un
 * archivo aquí, no tocar los dos puntos de arranque.
 */
import { authHandlers } from './auth.handlers';
import { profilesHandlers } from './profiles.handlers';

export const handlers = [...authHandlers, ...profilesHandlers];
