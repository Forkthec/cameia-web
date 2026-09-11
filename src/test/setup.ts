/**
 * Se carga antes de cada archivo de prueba (ver `test.setupFiles` en
 * vite.config.ts). Registra los matchers de jest-dom (`toBeInTheDocument`,
 * `toHaveAttribute`, etc.) para que estén disponibles sin importarlos en
 * cada test, y arranca el servidor de MSW (Node) para toda la suite —
 * `src/mocks/server.ts`, único punto de arranque de mocks en pruebas.
 */
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '@/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
