/**
 * Protege el cruce VITE_APP_ENV/VITE_API_BASE_URL (opción 1 de
 * comunicaciones/11092026_frontend_variable-api-base-url.md): la URL del API
 * es opcional fuera de producción para no dejar el sitio en blanco mientras
 * el Gateway no existe, pero sigue siendo obligatoria en producción.
 *
 * Los casos "sin VITE_API_BASE_URL" usan string vacío (`''`), no
 * `vi.stubEnv(key, undefined)`: es lo que un build real de Vite deja en
 * `import.meta.env` cuando la variable nunca se definió (confirmado contra
 * un despliegue real en CI, PR #30 de cameia-web — la primera versión de
 * este archivo probaba solo `undefined` y no detectó el bug real).
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
  it('arranca en staging con VITE_API_BASE_URL vacía (como la deja un build real sin definirla)', async () => {
    vi.stubEnv('VITE_APP_ENV', 'staging');
    vi.stubEnv('VITE_API_BASE_URL', '');

    const { env } = await loadEnv();

    expect(env.appEnv).toBe('staging');
    expect(env.apiBaseUrl).toBeUndefined();
  });

  it('arranca en local con VITE_API_BASE_URL vacía', async () => {
    vi.stubEnv('VITE_APP_ENV', 'local');
    vi.stubEnv('VITE_API_BASE_URL', '');

    const { env } = await loadEnv();

    expect(env.appEnv).toBe('local');
    expect(env.apiBaseUrl).toBeUndefined();
  });

  it('rechaza producción con VITE_API_BASE_URL vacía', async () => {
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('VITE_API_BASE_URL', '');

    await expect(loadEnv()).rejects.toThrow(/VITE_API_BASE_URL/);
  });

  it('acepta producción con VITE_API_BASE_URL válida', async () => {
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.cameia.app');

    const { env } = await loadEnv();

    expect(env.apiBaseUrl).toBe('https://api.cameia.app');
  });
});
