/**
 * Se carga antes de cada archivo de prueba (ver `test.setupFiles` en
 * vite.config.ts). Registra los matchers de jest-dom (`toBeInTheDocument`,
 * `toHaveAttribute`, etc.) para que estén disponibles sin importarlos en
 * cada test, arranca el servidor de MSW (Node) para toda la suite —
 * `src/mocks/server.ts`, único punto de arranque de mocks en pruebas— y
 * reinicia el estado en memoria de `profiles.handlers.ts` antes de cada
 * prueba individual.
 *
 * `resetProfiles()` vivía como responsabilidad de cada archivo de prueba que
 * consumiera esos handlers (ver la nota de cabecera de
 * `profiles.handlers.ts`); se centraliza aquí porque es infraestructura de
 * pruebas, no de una feature: así ninguna prueba nueva puede olvidarlo y
 * heredar datos de la prueba anterior (SPEC professional-profile §9).
 */
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { resetProfiles } from '@/mocks/handlers/profiles.handlers';
import { server } from '@/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
beforeEach(() => resetProfiles());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
