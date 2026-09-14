/**
 * Servidor de MSW para Node (Vitest). Se arranca desde `src/test/setup.ts`
 * antes de toda la suite, y se resetea entre pruebas para que un handler
 * agregado con `server.use(...)` en una prueba no se filtre a la siguiente.
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
