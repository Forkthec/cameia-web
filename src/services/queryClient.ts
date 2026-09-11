/**
 * QueryClient de TanStack (CLAUDE.md §3.6: los datos del servidor viven aquí,
 * nunca en Zustand). Reintentar un 4xx no lo arregla —credenciales
 * inválidas, un recurso que no existe— así que se corta antes de intentarlo
 * de nuevo; el resto de errores sí se reintenta una vez.
 */
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './http/ApiError';

function isClientError(error: unknown): boolean {
  return error instanceof ApiError && error.httpStatus >= 400 && error.httpStatus < 500;
}

/**
 * Replica el comportamiento de `retry: 1`: TanStack llama a esta función
 * ANTES de incrementar el contador, así que en el primer fallo
 * `failureCount` todavía vale 0 — `failureCount < 1` permite exactamente un
 * reintento (dos intentos en total), igual que pasar el número 1 directo.
 */
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isClientError(error)) return false;
  return failureCount < 1;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
