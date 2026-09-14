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
import { resetProfiles, seedProfileForTests } from './profiles.handlers';

interface ProfileResponse {
  id: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  name: string;
  summary: string;
  summaryProvenance: 'MANUAL' | 'AI_SUGGESTED' | 'AI_EDITED' | null;
  summaryProvenanceOrigin: string | null;
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

  // CM-53 (HU-2.3): obtener perfil por id — SPEC.md §3.2 ya asumía este
  // endpoint como estado de carga antes de que existiera.
  it('obtener perfil existente por id', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const fetched = await httpClient.get<ProfileResponse>(`/api/v1/profiles/${created.id}`);

    expect(fetched.id).toBe(created.id);
  });

  it('obtener perfil inexistente falla con NOT_FOUND', async () => {
    const error = await httpClient.get('/api/v1/profiles/no-existe').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('NOT_FOUND');
  });

  // CM-53, CA-2.3.1: guardar un resumen nuevo lo deja en MANUAL, sin origen.
  it('guardar resumen nuevo persiste provenance MANUAL', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const updated = await httpClient.patch<ProfileResponse>(`/api/v1/profiles/${created.id}`, {
      summary: 'Desarrollador con experiencia en backend.',
    });

    expect(updated.summaryProvenance).toBe('MANUAL');
    expect(updated.summaryProvenanceOrigin).toBeNull();
  });

  // CM-53, CA-2.3.2: editar un resumen que la IA sugirió lo pasa a
  // AI_EDITED y conserva el origen de ejecución por trazabilidad. Este
  // estado no lo puede producir la API pública en Sprint 1 (HU-2.6–2.10 son
  // Sprint 2), así que se siembra directamente con `seedProfileForTests`.
  it('editar un resumen AI_SUGGESTED lo pasa a AI_EDITED conservando el origen', async () => {
    const seeded = seedProfileForTests({
      summary: 'Resumen generado por IA a partir del CV.',
      summaryProvenance: 'AI_SUGGESTED',
      summaryProvenanceOrigin: 'job-123',
    });

    const updated = await httpClient.patch<ProfileResponse>(`/api/v1/profiles/${seeded.id}`, {
      summary: 'Resumen generado por IA a partir del CV, editado a mano.',
    });

    expect(updated.summaryProvenance).toBe('AI_EDITED');
    expect(updated.summaryProvenanceOrigin).toBe('job-123');
  });

  // Guardar sin tocar un resumen AI_SUGGESTED no es "editarlo": no hay
  // transición porque el texto no cambió.
  it('guardar un resumen AI_SUGGESTED sin cambios no altera su provenance', async () => {
    const seeded = seedProfileForTests({
      summary: 'Resumen generado por IA a partir del CV.',
      summaryProvenance: 'AI_SUGGESTED',
      summaryProvenanceOrigin: 'job-123',
    });

    const updated = await httpClient.patch<ProfileResponse>(`/api/v1/profiles/${seeded.id}`, {
      summary: seeded.summary,
    });

    expect(updated.summaryProvenance).toBe('AI_SUGGESTED');
    expect(updated.summaryProvenanceOrigin).toBe('job-123');
  });

  // CM-53, CA-2.3.4: borrar el resumen deja los tres campos en null en
  // conjunto, sin importar la procedencia anterior.
  it('vaciar el resumen limpia summary, provenance y origen en conjunto', async () => {
    const seeded = seedProfileForTests({
      summary: 'Resumen generado por IA a partir del CV.',
      summaryProvenance: 'AI_SUGGESTED',
      summaryProvenanceOrigin: 'job-123',
    });

    const updated = await httpClient.patch<ProfileResponse>(`/api/v1/profiles/${seeded.id}`, {
      summary: '   ',
    });

    expect(updated.summary).toBe('');
    expect(updated.summaryProvenance).toBeNull();
    expect(updated.summaryProvenanceOrigin).toBeNull();
  });
});
