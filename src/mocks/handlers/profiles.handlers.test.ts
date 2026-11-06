/**
 * Prueba de humo del ciclo completo de Perfil Profesional contra los mocks
 * de `profiles.handlers.ts`: protege que las reglas de negocio que ese
 * archivo simula —creación en `IN_PROGRESS`, validación de nombre,
 * transición única a `COMPLETED`, alta/baja por ítem de experiencia
 * laboral, educación (CM-61), habilidades (CM-65) y roles objetivo (CM-69)
 * con las reglas reales de `WorkExperience.java`/`Education.java`/
 * `ProfileController.java` (catálogo cerrado, máximo 5, sin duplicados,
 * sustituir conserva el id), y finalización (`POST .../completion`, CM-65)
 * validando los 5 requisitos reales a la vez— sigan funcionando juntas,
 * tal como las consume `professional-profile`.
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

  // CM-65: el endpoint real es `.../completion`, no `.../finalize` —
  // confirmado por `ProfileController.java#completeProfile`.
  it('finalizar un perfil vacío falla listando los 5 requisitos incumplidos', async () => {
    // Sin body: el mock crea el perfil con name='' (un `name: ''` explícito
    // sí se rechaza en la creación — CA-2.2.1 — la ausencia de body no).
    const profile = await httpClient.post<ProfileResponse>('/api/v1/profiles');

    const error = await httpClient
      .post(`/api/v1/profiles/${profile.id}/completion`)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isValidation()).toBe(true);
    const fields = (error as ApiError).errors.map((item) => item.field);
    expect(fields).toEqual(['name', 'summary', 'education', 'skills', 'targetRoles']);
  });

  it('finalizar con solo educación sigue listando los 4 requisitos restantes, no solo uno', async () => {
    const profile = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    await httpClient.post(`/api/v1/profiles/${profile.id}/educations`, {
      institution: 'Universidad del Cauca',
      degree: 'Ingeniería de Sistemas',
      level: 'UNDERGRADUATE',
      startDate: '2018-01',
      inProgress: false,
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${profile.id}/completion`)
      .catch((e: unknown) => e);

    const fields = (error as ApiError).errors.map((item) => item.field);
    expect(fields).toEqual(['summary', 'skills', 'targetRoles']);
  });

  it('cumplir los 5 requisitos y finalizar entra en COMPLETED', async () => {
    // `targetRoles` es de solo lectura en esta rama (CM-69, en paralelo,
    // construye su alta real) — se siembra directo para poder probar la
    // finalización completa sin esa gestión.
    const seeded = seedProfileForTests({
      name: 'Ana María Pérez',
      summary: 'Desarrolladora backend con experiencia en Node.js.',
      targetRoles: [
        {
          id: 'target-role-1',
          professionalRoleId: 'backend-developer',
          roleTitle: 'Desarrollador de Software',
          provenance: 'MANUAL',
        },
      ],
    });
    await httpClient.post(`/api/v1/profiles/${seeded.id}/educations`, {
      institution: 'Universidad del Cauca',
      degree: 'Ingeniería de Sistemas',
      level: 'UNDERGRADUATE',
      startDate: '2018-01',
      inProgress: false,
    });
    await httpClient.post(`/api/v1/profiles/${seeded.id}/skills`, {
      skillName: 'Node.js',
      level: 'ADVANCED',
    });

    // GLOSSARY.md §3: transición única IN_PROGRESS → COMPLETED, sin pasar
    // por IN_REVIEW (nadie lo alcanza en el flujo manual). El backend real
    // responde 201 (`ProfileController.java#completeProfile`).
    const finalized = await httpClient.post<ProfileResponse>(
      `/api/v1/profiles/${seeded.id}/completion`,
    );

    expect(finalized.status).toBe('COMPLETED');
  });

  it('finalizar un perfil ya COMPLETED falla con 409', async () => {
    const seeded = seedProfileForTests({ status: 'COMPLETED' });

    const error = await httpClient
      .post(`/api/v1/profiles/${seeded.id}/completion`)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(409);
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
    expect((error as ApiError).httpStatus).toBe(404);
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

  // CM-61: alta de educación válida — WorkExperienceTest/EducationTest de
  // `cameia-perfil` prueban las mismas reglas del lado del dominio real.
  it('agregar una educación válida la devuelve dentro del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const updated = await httpClient.post<ProfileResponse & { educations: unknown[] }>(
      `/api/v1/profiles/${created.id}/educations`,
      {
        institution: 'Universidad del Cauca',
        degree: 'Ingeniería de Sistemas',
        level: 'UNDERGRADUATE',
        startDate: '2018-01',
        endDate: '2023-12',
        inProgress: false,
      },
    );

    expect(updated.educations).toHaveLength(1);
  });

  // `Education.java`: inProgress=true prohíbe endDate.
  it('una educación en curso con fecha de finalización falla con 422', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/educations`, {
        institution: 'Universidad del Cauca',
        degree: 'Ingeniería de Sistemas',
        level: 'UNDERGRADUATE',
        startDate: '2018-01',
        endDate: '2023-12',
        inProgress: true,
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isValidation()).toBe(true);
    expect((error as ApiError).httpStatus).toBe(422);
  });

  it('una educación sin un nivel del enum falla con VALIDATION_ERROR', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/educations`, {
        institution: 'Universidad del Cauca',
        degree: 'Ingeniería de Sistemas',
        level: 'DOCTORADO',
        startDate: '2018-01',
        inProgress: false,
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(400);
  });

  it('eliminar una educación la retira del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    const withEducation = await httpClient.post<ProfileResponse & { educations: { id: string }[] }>(
      `/api/v1/profiles/${created.id}/educations`,
      {
        institution: 'Universidad del Cauca',
        degree: 'Ingeniería de Sistemas',
        level: 'UNDERGRADUATE',
        startDate: '2018-01',
        inProgress: false,
      },
    );
    const educationId = withEducation.educations.at(0)?.id;
    if (!educationId) throw new Error('El perfil sembrado no tiene educación.');

    await httpClient.del(`/api/v1/profiles/${created.id}/educations/${educationId}`);

    const updated = await httpClient.get<ProfileResponse & { educations: unknown[] }>(
      `/api/v1/profiles/${created.id}`,
    );
    expect(updated.educations).toHaveLength(0);
  });

  it('eliminar una educación inexistente falla con NOT_FOUND', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .del(`/api/v1/profiles/${created.id}/educations/no-existe`)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(404);
  });

  // `WorkExperience.java`: employmentStatus=ENDED exige endDate >= startDate.
  it('una experiencia ENDED sin fecha de fin falla con 422', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/work-experiences`, {
        company: 'CAMEIA',
        position: 'Desarrolladora backend',
        startDate: '2022-01',
        employmentStatus: 'ENDED',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isValidation()).toBe(true);
    expect((error as ApiError).httpStatus).toBe(422);
  });

  it('una experiencia ENDED con fin anterior al inicio falla con 422', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/work-experiences`, {
        company: 'CAMEIA',
        position: 'Desarrolladora backend',
        startDate: '2022-01',
        endDate: '2021-01',
        employmentStatus: 'ENDED',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(422);
  });

  it('una experiencia CURRENT con fecha de fin falla con 422', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/work-experiences`, {
        company: 'CAMEIA',
        position: 'Desarrolladora backend',
        startDate: '2022-01',
        endDate: '2023-01',
        employmentStatus: 'CURRENT',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(422);
  });

  it('una experiencia válida se devuelve dentro del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const updated = await httpClient.post<ProfileResponse & { workExperiences: unknown[] }>(
      `/api/v1/profiles/${created.id}/work-experiences`,
      {
        company: 'CAMEIA',
        position: 'Desarrolladora backend',
        startDate: '2022-01',
        employmentStatus: 'CURRENT',
      },
    );

    expect(updated.workExperiences).toHaveLength(1);
  });

  it('eliminar una experiencia la retira del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    const withExperience = await httpClient.post<
      ProfileResponse & { workExperiences: { id: string }[] }
    >(`/api/v1/profiles/${created.id}/work-experiences`, {
      company: 'CAMEIA',
      position: 'Desarrolladora backend',
      startDate: '2022-01',
      employmentStatus: 'CURRENT',
    });
    const workExperienceId = withExperience.workExperiences.at(0)?.id;
    if (!workExperienceId) throw new Error('El perfil sembrado no tiene experiencia laboral.');

    await httpClient.del(`/api/v1/profiles/${created.id}/work-experiences/${workExperienceId}`);

    const updated = await httpClient.get<ProfileResponse & { workExperiences: unknown[] }>(
      `/api/v1/profiles/${created.id}`,
    );
    expect(updated.workExperiences).toHaveLength(0);
  });

  // `WorkExperience.java`: `description` limitada a 500 caracteres (MAX_TEXT_LENGTH).
  it('una descripción de más de 500 caracteres falla', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/work-experiences`, {
        company: 'CAMEIA',
        position: 'Desarrolladora backend',
        description: 'a'.repeat(501),
        startDate: '2022-01',
        employmentStatus: 'CURRENT',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(400);
  });

  // CM-65: alta de habilidad válida — texto libre, sin catálogo.
  it('agregar una habilidad válida la devuelve dentro del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const updated = await httpClient.post<ProfileResponse & { profileSkills: unknown[] }>(
      `/api/v1/profiles/${created.id}/skills`,
      { skillName: 'React', level: 'ADVANCED' },
    );

    expect(updated.profileSkills).toHaveLength(1);
  });

  it('un nivel de habilidad fuera del enum falla con VALIDATION_ERROR', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/skills`, {
        skillName: 'React',
        level: 'EXPERTO',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(400);
  });

  // `ProfileController.java#addSkill`: 409 si el texto ya existe, sin
  // distinguir mayúsculas ni espacios (memo del PO del 13-sep, C-06).
  it('una habilidad duplicada, ignorando mayúsculas y espacios, falla con 409', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    await httpClient.post(`/api/v1/profiles/${created.id}/skills`, {
      skillName: 'React',
      level: 'ADVANCED',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/skills`, {
        skillName: '  react  ',
        level: 'BASIC',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(409);
  });

  it('eliminar una habilidad la retira del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    const withSkill = await httpClient.post<ProfileResponse & { profileSkills: { id: string }[] }>(
      `/api/v1/profiles/${created.id}/skills`,
      { skillName: 'React', level: 'ADVANCED' },
    );
    const skillId = withSkill.profileSkills[0]?.id;
    if (!skillId) throw new Error('El perfil sembrado no tiene habilidad.');

    await httpClient.del(`/api/v1/profiles/${created.id}/skills/${skillId}`);

    const updated = await httpClient.get<ProfileResponse & { profileSkills: unknown[] }>(
      `/api/v1/profiles/${created.id}`,
    );
    expect(updated.profileSkills).toHaveLength(0);
  });

  it('eliminar una habilidad inexistente falla con NOT_FOUND', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .del(`/api/v1/profiles/${created.id}/skills/no-existe`)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(404);
  });

  // CM-69: alta de rol objetivo válido — catálogo cerrado (`PROFESSIONAL_ROLES`).
  it('agregar un rol objetivo válido lo devuelve dentro del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const updated = await httpClient.post<ProfileResponse & { targetRoles: unknown[] }>(
      `/api/v1/profiles/${created.id}/target-roles`,
      { professionalRoleId: 'backend-developer' },
    );

    expect(updated.targetRoles).toHaveLength(1);
  });

  it('un rol profesional fuera del catálogo falla con VALIDATION_ERROR', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/target-roles`, {
        professionalRoleId: 'no-existe-en-el-catalogo',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(400);
  });

  // `ProfileController.java#addTargetRole`: 409 si el rol ya está asociado.
  it('agregar un rol objetivo repetido falla con 409', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    await httpClient.post(`/api/v1/profiles/${created.id}/target-roles`, {
      professionalRoleId: 'backend-developer',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/target-roles`, {
        professionalRoleId: 'backend-developer',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(409);
  });

  // Memo del PO del 13-sep, C-05: máximo 5 roles objetivo por perfil.
  it('el sexto rol objetivo falla con 422', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    const roleIds = [
      'backend-developer',
      'frontend-developer',
      'fullstack-developer',
      'data-engineer',
      'data-scientist',
    ];
    for (const professionalRoleId of roleIds) {
      await httpClient.post(`/api/v1/profiles/${created.id}/target-roles`, {
        professionalRoleId,
      });
    }

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/target-roles`, {
        professionalRoleId: 'qa-analyst',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(409);
    expect((error as ApiError).hasCode('TARGET_ROLE_LIMIT_REACHED')).toBe(true);
  });

  // C-05: sustituir es un PATCH real que conserva el id del Rol Objetivo.
  it('sustituir un rol objetivo conserva su id y cambia el rol profesional', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    const withRole = await httpClient.post<
      ProfileResponse & { targetRoles: { id: string; professionalRoleId: string }[] }
    >(`/api/v1/profiles/${created.id}/target-roles`, {
      professionalRoleId: 'backend-developer',
    });
    const roleId = withRole.targetRoles[0]?.id;
    if (!roleId) throw new Error('El perfil sembrado no tiene rol objetivo.');

    const updated = await httpClient.patch<
      ProfileResponse & { targetRoles: { id: string; professionalRoleId: string }[] }
    >(`/api/v1/profiles/${created.id}/target-roles/${roleId}`, {
      professionalRoleId: 'frontend-developer',
    });

    expect(updated.targetRoles).toHaveLength(1);
    expect(updated.targetRoles[0]).toMatchObject({
      id: roleId,
      professionalRoleId: 'frontend-developer',
    });
  });

  it('sustituir por un rol ya presente en el perfil falla con 409', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    await httpClient.post(`/api/v1/profiles/${created.id}/target-roles`, {
      professionalRoleId: 'frontend-developer',
    });
    const withRole = await httpClient.post<ProfileResponse & { targetRoles: { id: string }[] }>(
      `/api/v1/profiles/${created.id}/target-roles`,
      {
        professionalRoleId: 'backend-developer',
      },
    );
    const roleId = withRole.targetRoles.at(-1)?.id;
    if (!roleId) throw new Error('El perfil sembrado no tiene rol objetivo.');

    const error = await httpClient
      .patch(`/api/v1/profiles/${created.id}/target-roles/${roleId}`, {
        professionalRoleId: 'frontend-developer',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(409);
  });

  it('eliminar un rol objetivo lo retira del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    const withRole = await httpClient.post<ProfileResponse & { targetRoles: { id: string }[] }>(
      `/api/v1/profiles/${created.id}/target-roles`,
      {
        professionalRoleId: 'backend-developer',
      },
    );
    const roleId = withRole.targetRoles[0]?.id;
    if (!roleId) throw new Error('El perfil sembrado no tiene rol objetivo.');

    await httpClient.del(`/api/v1/profiles/${created.id}/target-roles/${roleId}`);

    const updated = await httpClient.get<ProfileResponse & { targetRoles: unknown[] }>(
      `/api/v1/profiles/${created.id}`,
    );
    expect(updated.targetRoles).toHaveLength(0);
  });

  // `ProfileController.java#removeTargetRole`: el último rol solo se
  // bloquea con el perfil ya COMPLETED — IN_PROGRESS sí puede quedar sin roles.
  it('eliminar el único rol objetivo de un perfil COMPLETED falla con 422', async () => {
    const seeded = seedProfileForTests({
      status: 'COMPLETED',
      targetRoles: [
        {
          id: 'target-role-1',
          professionalRoleId: 'backend-developer',
          roleTitle: 'Desarrollador de Software',
          provenance: 'MANUAL',
        },
      ],
    });

    const error = await httpClient
      .del(`/api/v1/profiles/${seeded.id}/target-roles/target-role-1`)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(409);
    expect((error as ApiError).hasCode('TARGET_ROLE_NOT_ALLOWED')).toBe(true);
  });

  it('eliminar el único rol objetivo de un perfil IN_PROGRESS sí se permite', async () => {
    const seeded = seedProfileForTests({
      status: 'IN_PROGRESS',
      targetRoles: [
        {
          id: 'target-role-1',
          professionalRoleId: 'backend-developer',
          roleTitle: 'Desarrollador de Software',
          provenance: 'MANUAL',
        },
      ],
    });

    await httpClient.del(`/api/v1/profiles/${seeded.id}/target-roles/target-role-1`);

    const updated = await httpClient.get<ProfileResponse & { targetRoles: unknown[] }>(
      `/api/v1/profiles/${seeded.id}`,
    );
    expect(updated.targetRoles).toHaveLength(0);
  });
});

/*
 * CM-273 (PR 2, `SPEC.md` §3.3, «Mock»): SOLO adiciones al mock. Estas pruebas protegen lo que el mock agrega
 * (inicio opcional de la experiencia, topes de 4 y 5 con 409 y su `code`, última formación de un perfil
 * `COMPLETED` con 409 `EDUCATION_NOT_ALLOWED`, `code` en los 404 de bajas) y que lo que ya hacía sigue igual.
 * Los dos casos con 400 (`:276-292` y `:433-452` de este archivo, bloqueo C-20) no se tocan.
 */
describe('profilesHandlers · HU-2.4 (CM-273, PR 2)', () => {
  beforeEach(() => {
    resetProfiles();
  });

  const education = (degree: string) => ({
    institution: 'Universidad del Cauca',
    degree,
    level: 'UNDERGRADUATE',
    startDate: '2018-01',
    endDate: '2023-12',
    inProgress: false,
  });

  const experience = (position: string) => ({
    company: 'CAMEIA',
    position,
    description: null,
    startDate: '2024-01',
    endDate: null,
    employmentStatus: 'CURRENT',
  });

  async function newProfile() {
    return httpClient.post<ProfileResponse>('/api/v1/profiles', { name: 'Perfil de prueba' });
  }

  async function failureOf(request: Promise<unknown>): Promise<ApiError> {
    const error = await request.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }

  describe('inicio opcional de la experiencia (CA-2.4.15, 22, 23, 53)', () => {
    it('una experiencia sin ninguna fecha ni descripción se guarda con startDate null (CA-2.4.15 y CA-2.4.53)', async () => {
      const created = await newProfile();

      const updated = await httpClient.post<
        ProfileResponse & { workExperiences: { startDate: string | null }[] }
      >(`/api/v1/profiles/${created.id}/work-experiences`, {
        company: 'CAMEIA',
        position: 'Desarrolladora backend',
        description: null,
        startDate: null,
        endDate: null,
        employmentStatus: 'UNKNOWN_END',
      });

      expect(updated.workExperiences).toHaveLength(1);
      expect(updated.workExperiences[0]?.startDate).toBeNull();
    });

    it('una experiencia terminada con solo la fecha de fin se guarda con startDate null (CA-2.4.22)', async () => {
      const created = await newProfile();

      const updated = await httpClient.post<
        ProfileResponse & {
          workExperiences: { startDate: string | null; endDate: string | null }[];
        }
      >(`/api/v1/profiles/${created.id}/work-experiences`, {
        company: 'CAMEIA',
        position: 'Desarrolladora backend',
        description: null,
        endDate: '2023-03',
        employmentStatus: 'ENDED',
      });

      expect(updated.workExperiences[0]?.startDate).toBeNull();
      expect(updated.workExperiences[0]?.endDate).toBe('2023-03');
    });

    it('una experiencia terminada sin fecha de fin sigue fallando con 422 (la regla de `WorkExperience.java` no cambia)', async () => {
      const created = await newProfile();

      const error = await failureOf(
        httpClient.post(`/api/v1/profiles/${created.id}/work-experiences`, {
          company: 'CAMEIA',
          position: 'Desarrolladora backend',
          startDate: '2024-01',
          employmentStatus: 'ENDED',
        }),
      );

      expect(error.httpStatus).toBe(422);
    });
  });

  describe('topes de 4 experiencias y 5 formaciones (CA-2.4.47 a CA-2.4.49)', () => {
    it('la cuarta experiencia se guarda y la quinta responde 409 WORK_EXPERIENCE_LIMIT_REACHED', async () => {
      const created = await newProfile();
      for (const position of ['Uno', 'Dos', 'Tres', 'Cuatro']) {
        await httpClient.post(
          `/api/v1/profiles/${created.id}/work-experiences`,
          experience(position),
        );
      }

      const error = await failureOf(
        httpClient.post(`/api/v1/profiles/${created.id}/work-experiences`, experience('Cinco')),
      );

      expect(error.httpStatus).toBe(409);
      expect(error.hasCode('WORK_EXPERIENCE_LIMIT_REACHED')).toBe(true);
      const profile = await httpClient.get<ProfileResponse & { workExperiences: unknown[] }>(
        `/api/v1/profiles/${created.id}`,
      );
      expect(profile.workExperiences).toHaveLength(4);
    });

    it('la quinta formación se guarda y la sexta responde 409 EDUCATION_LIMIT_REACHED', async () => {
      const created = await newProfile();
      for (const degree of ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco']) {
        await httpClient.post(`/api/v1/profiles/${created.id}/educations`, education(degree));
      }

      const error = await failureOf(
        httpClient.post(`/api/v1/profiles/${created.id}/educations`, education('Seis')),
      );

      expect(error.httpStatus).toBe(409);
      expect(error.hasCode('EDUCATION_LIMIT_REACHED')).toBe(true);
      const profile = await httpClient.get<ProfileResponse & { educations: unknown[] }>(
        `/api/v1/profiles/${created.id}`,
      );
      expect(profile.educations).toHaveLength(5);
    });
  });

  describe('bajas: última formación de un perfil activo y registros que no existen (CA-2.4.11, 37, 38, 46, 51, 58 y 59)', () => {
    const seedEducation = (id: string, degree: string) => ({
      id,
      institution: 'Universidad del Cauca',
      degree,
      level: 'UNDERGRADUATE' as const,
      startDate: '2018-01',
      endDate: '2023-12',
      inProgress: false,
      provenance: 'MANUAL' as const,
    });

    it('eliminar la única formación de un perfil COMPLETED responde 409 EDUCATION_NOT_ALLOWED y no elimina nada (CA-2.4.37)', async () => {
      const seeded = seedProfileForTests({
        status: 'COMPLETED',
        educations: [seedEducation('education-seed-1', 'Ingeniería de Sistemas')],
      });

      const error = await failureOf(
        httpClient.del(`/api/v1/profiles/${seeded.id}/educations/education-seed-1`),
      );

      expect(error.httpStatus).toBe(409);
      expect(error.hasCode('EDUCATION_NOT_ALLOWED')).toBe(true);
      const profile = await httpClient.get<ProfileResponse & { educations: unknown[] }>(
        `/api/v1/profiles/${seeded.id}`,
      );
      expect(profile.educations).toHaveLength(1);
    });

    it('eliminar una de dos formaciones de un perfil COMPLETED responde 204 (CA-2.4.46)', async () => {
      const seeded = seedProfileForTests({
        status: 'COMPLETED',
        educations: [
          seedEducation('education-seed-1', 'Uno'),
          seedEducation('education-seed-2', 'Dos'),
        ],
      });

      await httpClient.del(`/api/v1/profiles/${seeded.id}/educations/education-seed-1`);

      const profile = await httpClient.get<ProfileResponse & { educations: unknown[] }>(
        `/api/v1/profiles/${seeded.id}`,
      );
      expect(profile.educations).toHaveLength(1);
    });

    it('eliminar la única formación de un perfil en Borrador responde 204, sin protección de mínimos (CA-2.4.11)', async () => {
      const seeded = seedProfileForTests({
        educations: [seedEducation('education-seed-1', 'Ingeniería de Sistemas')],
      });

      await httpClient.del(`/api/v1/profiles/${seeded.id}/educations/education-seed-1`);

      const profile = await httpClient.get<ProfileResponse & { educations: unknown[] }>(
        `/api/v1/profiles/${seeded.id}`,
      );
      expect(profile.educations).toHaveLength(0);
    });

    it('eliminar la única experiencia de un perfil COMPLETED responde 204 (CA-2.4.38)', async () => {
      const seeded = seedProfileForTests({
        status: 'COMPLETED',
        workExperiences: [
          {
            id: 'work-experience-seed-1',
            company: 'CAMEIA',
            position: 'Desarrolladora backend',
            description: null,
            startDate: '2024-01',
            endDate: null,
            employmentStatus: 'CURRENT',
            provenance: 'MANUAL',
          },
        ],
      });

      await httpClient.del(`/api/v1/profiles/${seeded.id}/work-experiences/work-experience-seed-1`);

      const profile = await httpClient.get<ProfileResponse & { workExperiences: unknown[] }>(
        `/api/v1/profiles/${seeded.id}`,
      );
      expect(profile.workExperiences).toHaveLength(0);
    });

    it('eliminar una formación que no existe responde 404 EDUCATION_NOT_FOUND (CA-2.4.58)', async () => {
      const created = await newProfile();

      const error = await failureOf(
        httpClient.del(`/api/v1/profiles/${created.id}/educations/no-existe`),
      );

      expect(error.httpStatus).toBe(404);
      expect(error.hasCode('EDUCATION_NOT_FOUND')).toBe(true);
    });

    it('eliminar una experiencia que no existe responde 404 WORK_EXPERIENCE_NOT_FOUND (CA-2.4.59)', async () => {
      const created = await newProfile();

      const error = await failureOf(
        httpClient.del(`/api/v1/profiles/${created.id}/work-experiences/no-existe`),
      );

      expect(error.httpStatus).toBe(404);
      expect(error.hasCode('WORK_EXPERIENCE_NOT_FOUND')).toBe(true);
    });
  });
});
