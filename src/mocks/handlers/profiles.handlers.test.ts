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
    const fields = (error as ApiError).details.map((detail) => detail.field);
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
      provenance: 'MANUAL',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${profile.id}/completion`)
      .catch((e: unknown) => e);

    const fields = (error as ApiError).details.map((detail) => detail.field);
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
        { id: 'target-role-1', professionalRoleId: 'backend-developer', provenance: 'MANUAL' },
      ],
    });
    await httpClient.post(`/api/v1/profiles/${seeded.id}/educations`, {
      institution: 'Universidad del Cauca',
      degree: 'Ingeniería de Sistemas',
      level: 'UNDERGRADUATE',
      startDate: '2018-01',
      inProgress: false,
      provenance: 'MANUAL',
    });
    await httpClient.post(`/api/v1/profiles/${seeded.id}/skills`, {
      skillName: 'Node.js',
      level: 'ADVANCED',
      provenance: 'MANUAL',
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

  // CM-61: alta de educación válida — WorkExperienceTest/EducationTest de
  // `cameia-perfil` prueban las mismas reglas del lado del dominio real.
  it('agregar una educación válida la devuelve dentro del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const updated = await httpClient.post<ProfileResponse & { education: unknown[] }>(
      `/api/v1/profiles/${created.id}/educations`,
      {
        institution: 'Universidad del Cauca',
        degree: 'Ingeniería de Sistemas',
        fieldOfStudy: 'Sistemas',
        level: 'UNDERGRADUATE',
        startDate: '2018-01',
        endDate: '2023-12',
        inProgress: false,
        provenance: 'MANUAL',
      },
    );

    expect(updated.education).toHaveLength(1);
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
        provenance: 'MANUAL',
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
        provenance: 'MANUAL',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('VALIDATION_ERROR');
  });

  it('eliminar una educación la retira del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    const withEducation = await httpClient.post<ProfileResponse & { education: { id: string }[] }>(
      `/api/v1/profiles/${created.id}/educations`,
      {
        institution: 'Universidad del Cauca',
        degree: 'Ingeniería de Sistemas',
        level: 'UNDERGRADUATE',
        startDate: '2018-01',
        inProgress: false,
        provenance: 'MANUAL',
      },
    );
    const educationId = withEducation.education.at(0)?.id;
    if (!educationId) throw new Error('El perfil sembrado no tiene educación.');

    const updated = await httpClient.del<ProfileResponse & { education: unknown[] }>(
      `/api/v1/profiles/${created.id}/educations/${educationId}`,
    );

    expect(updated.education).toHaveLength(0);
  });

  it('eliminar una educación inexistente falla con NOT_FOUND', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .del(`/api/v1/profiles/${created.id}/educations/no-existe`)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('NOT_FOUND');
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
        provenance: 'MANUAL',
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
        provenance: 'MANUAL',
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
        provenance: 'MANUAL',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(422);
  });

  it('una experiencia válida se devuelve dentro del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const updated = await httpClient.post<ProfileResponse & { workExperience: unknown[] }>(
      `/api/v1/profiles/${created.id}/work-experiences`,
      {
        company: 'CAMEIA',
        position: 'Desarrolladora backend',
        startDate: '2022-01',
        employmentStatus: 'CURRENT',
        provenance: 'MANUAL',
      },
    );

    expect(updated.workExperience).toHaveLength(1);
  });

  it('eliminar una experiencia la retira del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    const withExperience = await httpClient.post<
      ProfileResponse & { workExperience: { id: string }[] }
    >(`/api/v1/profiles/${created.id}/work-experiences`, {
      company: 'CAMEIA',
      position: 'Desarrolladora backend',
      startDate: '2022-01',
      employmentStatus: 'CURRENT',
      provenance: 'MANUAL',
    });
    const workExperienceId = withExperience.workExperience.at(0)?.id;
    if (!workExperienceId) throw new Error('El perfil sembrado no tiene experiencia laboral.');

    const updated = await httpClient.del<ProfileResponse & { workExperience: unknown[] }>(
      `/api/v1/profiles/${created.id}/work-experiences/${workExperienceId}`,
    );

    expect(updated.workExperience).toHaveLength(0);
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
        provenance: 'MANUAL',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('VALIDATION_ERROR');
  });

  // CM-65: alta de habilidad válida — texto libre, sin catálogo.
  it('agregar una habilidad válida la devuelve dentro del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const updated = await httpClient.post<ProfileResponse & { skills: unknown[] }>(
      `/api/v1/profiles/${created.id}/skills`,
      { skillName: 'React', level: 'ADVANCED', provenance: 'MANUAL' },
    );

    expect(updated.skills).toHaveLength(1);
  });

  it('un nivel de habilidad fuera del enum falla con VALIDATION_ERROR', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/skills`, {
        skillName: 'React',
        level: 'EXPERTO',
        provenance: 'MANUAL',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('VALIDATION_ERROR');
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
      provenance: 'MANUAL',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/skills`, {
        skillName: '  react  ',
        level: 'BASIC',
        provenance: 'MANUAL',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(409);
  });

  it('eliminar una habilidad la retira del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    const withSkill = await httpClient.post<ProfileResponse & { skills: { id: string }[] }>(
      `/api/v1/profiles/${created.id}/skills`,
      { skillName: 'React', level: 'ADVANCED', provenance: 'MANUAL' },
    );
    const skillId = withSkill.skills[0]?.id;
    if (!skillId) throw new Error('El perfil sembrado no tiene habilidad.');

    const updated = await httpClient.del<ProfileResponse & { skills: unknown[] }>(
      `/api/v1/profiles/${created.id}/skills/${skillId}`,
    );

    expect(updated.skills).toHaveLength(0);
  });

  it('eliminar una habilidad inexistente falla con NOT_FOUND', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const error = await httpClient
      .del(`/api/v1/profiles/${created.id}/skills/no-existe`)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('NOT_FOUND');
  });

  // CM-69: alta de rol objetivo válido — catálogo cerrado (`PROFESSIONAL_ROLES`).
  it('agregar un rol objetivo válido lo devuelve dentro del perfil', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });

    const updated = await httpClient.post<ProfileResponse & { targetRoles: unknown[] }>(
      `/api/v1/profiles/${created.id}/target-roles`,
      { professionalRoleId: 'backend-developer', provenance: 'MANUAL' },
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
        provenance: 'MANUAL',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('VALIDATION_ERROR');
  });

  // `ProfileController.java#addTargetRole`: 409 si el rol ya está asociado.
  it('agregar un rol objetivo repetido falla con 409', async () => {
    const created = await httpClient.post<ProfileResponse>('/api/v1/profiles', {
      name: 'Perfil de prueba',
    });
    await httpClient.post(`/api/v1/profiles/${created.id}/target-roles`, {
      professionalRoleId: 'backend-developer',
      provenance: 'MANUAL',
    });

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/target-roles`, {
        professionalRoleId: 'backend-developer',
        provenance: 'MANUAL',
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
        provenance: 'MANUAL',
      });
    }

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/target-roles`, {
        professionalRoleId: 'qa-analyst',
        provenance: 'MANUAL',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(422);
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
      provenance: 'MANUAL',
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
      provenance: 'MANUAL',
    });
    const withRole = await httpClient.post<ProfileResponse & { targetRoles: { id: string }[] }>(
      `/api/v1/profiles/${created.id}/target-roles`,
      {
        professionalRoleId: 'backend-developer',
        provenance: 'MANUAL',
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
        provenance: 'MANUAL',
      },
    );
    const roleId = withRole.targetRoles[0]?.id;
    if (!roleId) throw new Error('El perfil sembrado no tiene rol objetivo.');

    const updated = await httpClient.del<ProfileResponse & { targetRoles: unknown[] }>(
      `/api/v1/profiles/${created.id}/target-roles/${roleId}`,
    );

    expect(updated.targetRoles).toHaveLength(0);
  });

  // `ProfileController.java#removeTargetRole`: el último rol solo se
  // bloquea con el perfil ya COMPLETED — IN_PROGRESS sí puede quedar sin roles.
  it('eliminar el único rol objetivo de un perfil COMPLETED falla con 422', async () => {
    const seeded = seedProfileForTests({
      status: 'COMPLETED',
      targetRoles: [
        { id: 'target-role-1', professionalRoleId: 'backend-developer', provenance: 'MANUAL' },
      ],
    });

    const error = await httpClient
      .del(`/api/v1/profiles/${seeded.id}/target-roles/target-role-1`)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(422);
  });

  it('eliminar el único rol objetivo de un perfil IN_PROGRESS sí se permite', async () => {
    const seeded = seedProfileForTests({
      status: 'IN_PROGRESS',
      targetRoles: [
        { id: 'target-role-1', professionalRoleId: 'backend-developer', provenance: 'MANUAL' },
      ],
    });

    const updated = await httpClient.del<ProfileResponse & { targetRoles: unknown[] }>(
      `/api/v1/profiles/${seeded.id}/target-roles/target-role-1`,
    );

    expect(updated.targetRoles).toHaveLength(0);
  });
});
