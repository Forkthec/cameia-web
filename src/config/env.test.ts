/**
 * Protege el cruce VITE_APP_ENV/VITE_API_BASE_URL (opción 1 de
 * comunicaciones/11092026_frontend_variable-api-base-url.md): la URL del API
 * es opcional fuera de producción para no dejar el sitio en blanco mientras
 * el Gateway no existe, pero sigue siendo obligatoria en producción.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadEnv() {
  vi.resetModules();
  return import('./env');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('env', () => {
  it('arranca en staging sin VITE_API_BASE_URL', async () => {
    vi.stubEnv('VITE_APP_ENV', 'staging');
    vi.stubEnv('VITE_API_BASE_URL', undefined);

    const { env } = await loadEnv();

    expect(env.appEnv).toBe('staging');
    expect(env.apiBaseUrl).toBeUndefined();
  });

  it('arranca en local sin VITE_API_BASE_URL', async () => {
    vi.stubEnv('VITE_APP_ENV', 'local');
    vi.stubEnv('VITE_API_BASE_URL', undefined);

    const { env } = await loadEnv();

    expect(env.appEnv).toBe('local');
    expect(env.apiBaseUrl).toBeUndefined();
  });

  it('rechaza producción sin VITE_API_BASE_URL', async () => {
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('VITE_API_BASE_URL', undefined);

    await expect(loadEnv()).rejects.toThrow(/VITE_API_BASE_URL/);
  });

  it('acepta producción con VITE_API_BASE_URL válida', async () => {
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.cameia.app');

    const { env } = await loadEnv();

    expect(env.apiBaseUrl).toBe('https://api.cameia.app');
  });
});
