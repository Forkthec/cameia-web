/**
 * Ayudante para instalar handlers puntuales de MSW desde una prueba de
 * feature (p. ej. forzar una respuesta de error de `POST /api/v1/profiles`
 * en `NewProfilePage.test.tsx`). Existe porque `features` no puede importar
 * `mocks` (docs/ARCHITECTURE.md §4); `src/test/**` no es un elemento de esa
 * matriz, así que importar este archivo desde una feature no cruza ninguna
 * frontera (SPEC professional-profile §9). El reset entre pruebas ya corre
 * en el `afterEach` global de `src/test/setup.ts`; esta función solo
 * instala el handler adicional que una prueba concreta necesita.
 */
import type { HttpHandler } from 'msw';
import { server } from '@/mocks/server';

export function useHandlers(...handlers: HttpHandler[]): void {
  server.use(...handlers);
}
