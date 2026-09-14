/**
 * Worker de MSW para el navegador. Escrito y listo, pero **nadie lo importa
 * todavía**: arrancarlo requiere `public/mockServiceWorker.js` (se genera
 * con `npx msw init public --save`), que se deja para cuando exista un
 * navegador real que necesite interceptar — es decir, para cuando CM-34 o
 * CM-40 entren al sprint. Hasta entonces, MSW solo corre en Node, vía
 * `server.ts`, para las pruebas.
 */
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
