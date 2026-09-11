/**
 * Prueba de humo del ciclo completo de Perfil Profesional contra los mocks
 * de `profiles.handlers.ts`: protege que las reglas de negocio que ese
 * archivo simula —creación en `IN_PROGRESS`, validación de nombre,
 * educación obligatoria para finalizar, transición única a `COMPLETED`—
 * sigan funcionando juntas, tal como las va a consumir `professional-profile`
 * una vez exista.
 *
 * No vive en ninguna feature porque no prueba una feature: prueba la capa
 * de infraestructura de mocks en sí misma, igual que
 * `services/http/errorMap.test.ts` vive junto a `errorMap.ts` y no dentro de
 * ninguna carpeta de `features/`. La anatomía de `docs/_plantilla-feature/`
 * es para features; `mocks/` es infraestructura compartida.
 *
 * Cada aserción cita, en su propio comentario, de dónde sale la regla que
 * protege — las mismas fuentes que documenta `profiles.handlers.ts`.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/services/http/ApiError';
import { httpClient } from '@/services/http/httpClient';
import { resetProfiles } from './profiles.handlers';

interface ProfileResponse {
  id: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  name: string;
}

describe('profilesHandlers', () => {
  beforeEach(() => {
    resetProfiles();
  });

  it('crear con nombre vacío falla', async () => {
    // CA-2.2.1 a CA-2.2.3 (backlog 6-sep): el nombre del perfil no puede
    // quedar vacío.
    const error = await httpClient.post('/api/v1/profiles', { name: '' }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isValidation()).toBe(true);
  });

  it('crear válido entra en IN_PROGRESS', async () => {
    const profile = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    // GLOSSARY.md §3: el perfil se crea en IN_PROGRESS. No existe PENDING.
    expect(profile.status).toBe('IN_PROGRESS');
  });

  it('finalizar sin educación falla', async () => {
    const profile = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    // HU-2.4 (backlog 6-sep): la educación es obligatoria para activar el
    // perfil; sin al menos una, finalizar debe rechazarse.
    const error = await httpClient
      .post(`/api/v1/profiles/${profile.id}/finalize`)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isValidation()).toBe(true);
  });

  it('agregar educación y finalizar entra en COMPLETED', async () => {
    const profile = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    await httpClient.patch(`/api/v1/profiles/${profile.id}`, {
      education: [
        {
          id: 'edu-1',
          institution: 'Universidad del Cauca',
          program: 'Ingeniería de Sistemas',
          level: 'UNDERGRADUATE',
          inProgress: false,
        },
      ],
    });

    // GLOSSARY.md §3: transición única IN_PROGRESS → COMPLETED, sin pasar
    // por IN_REVIEW (nadie lo alcanza en el flujo manual).
    const finalized = await httpClient.post<ProfileResponse>(
      `/api/v1/profiles/${profile.id}/finalize`,
    );

    expect(finalized.status).toBe('COMPLETED');
  });
});
