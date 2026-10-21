/**
 * Confirma que una llamada real sin VITE_API_BASE_URL configurada (opcional
 * fuera de producción, ver config/env.ts) falla con un error de dominio
 * legible en vez de un TypeError críptico de `new URL(path, undefined)`.
 * También protege las cabeceras extra (`Idempotency-Key`, RT-06) y el envío
 * de `FormData` sin `Content-Type` fijo (audio, HU-5.8).
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

  it('envía cabeceras extra y deja que FormData fije su propio Content-Type', async () => {
    envMock.apiBaseUrl = 'http://api.test';
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const { httpClient } = await import('./httpClient');
    const form = new FormData();
    form.append('turno_id', 't1');

    await httpClient.post('/x', form, { headers: { 'Idempotency-Key': 'k1' } });

    const init = fetchMock.mock.calls[0]![1]!;
    const headers = init.headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toBe('k1');
    expect(headers['Content-Type']).toBeUndefined();
    expect(init.body).toBe(form);
    fetchMock.mockRestore();
  });
});
