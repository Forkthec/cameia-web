/**
 * Confirma que una llamada real sin VITE_API_BASE_URL configurada (opcional
 * fuera de producción, ver config/env.ts) falla con un error de dominio
 * legible en vez de un TypeError críptico de `new URL(path, undefined)`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const { envMock } = vi.hoisted(() => ({
  envMock: { apiBaseUrl: undefined as string | undefined },
}));

vi.mock('@/config/env', () => ({ env: envMock }));

vi.mock('@/services/firebase/auth.service', () => ({
  getIdToken: vi.fn().mockResolvedValue(null),
  signOut: vi.fn(),
}));

describe('httpClient', () => {
  afterEach(() => {
    vi.resetModules();
    envMock.apiBaseUrl = undefined;
  });

  it('lanza BackendNotConfiguredError si no hay VITE_API_BASE_URL', async () => {
    envMock.apiBaseUrl = undefined;
    const { httpClient, BackendNotConfiguredError } = await import('./httpClient');

    await expect(httpClient.get('/perfiles')).rejects.toThrow(BackendNotConfiguredError);
  });
});
