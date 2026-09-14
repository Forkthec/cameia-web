/**
 * Sesión simulada: da una identidad fija que `profiles.handlers.ts` trata
 * como dueña de los datos, sin exigir ningún header (ni `Authorization`, ni
 * `X-User-Id`, que sigue sin confirmar — CLAUDE.md §12 abierta 2). Cualquier
 * petición, la tenga o no, se atiende como si viniera de este usuario.
 *
 * Esto NO simula un login interactivo: `RequireAuth` sigue bloqueado hasta
 * CM-34/CM-40, porque lee `useAuthStore`, que solo llena `AuthProvider.tsx`
 * suscrito al `onAuthStateChanged` real de Firebase — no una llamada de red
 * que MSW pueda interceptar. Para pruebas de páginas detrás de
 * `RequireAuth`, usa el patrón ya establecido en `AuthProvider.test.tsx` y
 * `RequireAuth.test.tsx`: `useAuthStore.setState({ isAuthenticated: true,
 * ... })` directo, sin pasar por aquí.
 */
import type { HttpHandler } from 'msw';

export const MOCK_USER_ID = 'mock-user-01';

export const MOCK_AUTHENTICATED_USER = {
  uid: MOCK_USER_ID,
  email: 'demo@cameia.dev',
  displayName: 'Usuario de prueba',
};

/**
 * Sin handlers de red: ningún endpoint de sesión o identidad está
 * confirmado para Sprint 1. `profiles.handlers.ts` importa `MOCK_USER_ID`
 * directamente en vez de resolverlo por HTTP.
 */
export const authHandlers: HttpHandler[] = [];
