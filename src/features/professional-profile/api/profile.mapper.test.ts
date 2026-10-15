/**
 * Protege la derivación que CM-61 agrega al mapper: la traducción de los
 * dos checkboxes de Experiencia Laboral (`isCurrent`/`unknownEnd`) al
 * `employmentStatus` real (SPEC.md §9, decisión D-F). CM-273 (PR 1) quita
 * de aquí el truncado de fecha a `YearMonth`: el esquema de Zod ya entrega
 * «AAAA-MM» (D-K) y el mapper deja de convertir. CM-65 (Habilidades) y CM-69 (Roles Objetivo) no
 * derivan nada real: solo protegen que la procedencia manual se fije
 * siempre (`MANUAL_PROVENANCE`). No repite la cobertura de `toProfile`, ya
 * protegida indirectamente por `useProfileQuery.test.tsx` contra MSW.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_EDUCATION_VALUES } from '../schemas/education.schema';
import { EMPTY_SKILL_VALUES } from '../schemas/skill.schema';
import { EMPTY_WORK_EXPERIENCE_VALUES } from '../schemas/workExperience.schema';
import {
  toAddEducationRequest,
  toAddSkillRequest,
  toAddTargetRoleRequest,
  toAddWorkExperienceRequest,
  toProfile,
  toUpdateTargetRoleRequest,
} from './profile.mapper';
import type { ProfileDto } from './profile.dto';

describe('toProfile', () => {
  it('un perfil recién creado (name y summary nulos) llega al dominio con cadenas vacías (CA-2.2.4)', () => {
    const dto: ProfileDto = {
      id: 'profile-nuevo',
      status: 'IN_PROGRESS',
      reviewStatus: 'PENDING_REVIEW',
      provenance: 'MANUAL',
      name: null,
      summary: null,
      salaryExpectation: null,
      preferredModality: null,
      createdAt: '2026-10-09T12:00:00Z',
      updatedAt: '2026-10-09T12:00:00Z',
      educations: [],
      workExperiences: [],
      profileSkills: [],
      targetRoles: [],
    };

    const profile = toProfile(dto);

    expect(profile.name).toBe('');
    expect(profile.summary).toBe('');
    expect(profile.status).toBe('IN_PROGRESS');
  });
});

describe('toAddEducationRequest', () => {
  // CM-273 (PR 1, SPEC.md §3.3 y D-K): el esquema de Zod ya entrega «AAAA-MM»; el mapper deja de convertir
  // fechas (se quitó la prueba «trunca las fechas a YYYY-MM»).
  it('manda las fechas tal como las entrega el formulario, en «AAAA-MM»', () => {
    const request = toAddEducationRequest({
      ...EMPTY_EDUCATION_VALUES,
      level: 'UNDERGRADUATE',
      degree: 'Ingeniería de Sistemas',
      institution: 'Universidad del Cauca',
      startDate: '2018-01',
      endDate: '2023-12',
    });

    expect(request.startDate).toBe('2018-01');
    expect(request.endDate).toBe('2023-12');
  });

  it('inProgress=true manda endDate en null aunque el campo tenga un valor', () => {
    const request = toAddEducationRequest({
      ...EMPTY_EDUCATION_VALUES,
      level: 'UNDERGRADUATE',
      degree: 'Ingeniería de Sistemas',
      institution: 'Universidad del Cauca',
      startDate: '2018-01',
      endDate: '2023-12',
      inProgress: true,
    });

    expect(request.endDate).toBeNull();
  });

  it('una fecha de fin vacía se manda como null', () => {
    const request = toAddEducationRequest({
      ...EMPTY_EDUCATION_VALUES,
      level: 'UNDERGRADUATE',
      degree: 'Ingeniería de Sistemas',
      institution: 'Universidad del Cauca',
      startDate: '2018-01',
      endDate: '',
    });

    expect(request.endDate).toBeNull();
  });
});

describe('toAddWorkExperienceRequest', () => {
  // CM-273 (PR 1, SPEC.md §3.3 y D-K): se quitó la parte de recorte de la prueba «ningún checkbox marcado
  // deriva ENDED con la fecha de fin truncada»; la derivación de `employmentStatus` (D-F) no cambia.
  it('ningún checkbox marcado deriva ENDED y manda las fechas tal como las entrega el formulario, en «AAAA-MM»', () => {
    const request = toAddWorkExperienceRequest({
      ...EMPTY_WORK_EXPERIENCE_VALUES,
      position: 'Desarrolladora backend',
      company: 'CAMEIA',
      startDate: '2022-01',
      endDate: '2023-06',
    });

    expect(request.employmentStatus).toBe('ENDED');
    expect(request.startDate).toBe('2022-01');
    expect(request.endDate).toBe('2023-06');
  });

  it('"Trabajo aquí actualmente" deriva CURRENT sin fecha de fin', () => {
    const request = toAddWorkExperienceRequest({
      ...EMPTY_WORK_EXPERIENCE_VALUES,
      position: 'Desarrolladora backend',
      company: 'CAMEIA',
      startDate: '2022-01',
      isCurrent: true,
    });

    expect(request.employmentStatus).toBe('CURRENT');
    expect(request.endDate).toBeNull();
  });

  it('"No recuerdo la fecha exacta de finalización" deriva UNKNOWN_END sin fecha de fin', () => {
    const request = toAddWorkExperienceRequest({
      ...EMPTY_WORK_EXPERIENCE_VALUES,
      position: 'Desarrolladora backend',
      company: 'CAMEIA',
      startDate: '2022-01',
      unknownEnd: true,
    });

    expect(request.employmentStatus).toBe('UNKNOWN_END');
    expect(request.endDate).toBeNull();
  });

  it('una descripción en blanco se manda como null, no como cadena vacía', () => {
    const request = toAddWorkExperienceRequest({
      ...EMPTY_WORK_EXPERIENCE_VALUES,
      position: 'Desarrolladora backend',
      company: 'CAMEIA',
      startDate: '2022-01',
      isCurrent: true,
      description: '   ',
    });

    expect(request.description).toBeNull();
  });
});

describe('toAddSkillRequest', () => {
  it('recorta el texto del nombre de la habilidad', () => {
    const request = toAddSkillRequest({
      ...EMPTY_SKILL_VALUES,
      skillName: '  React  ',
      level: 'ADVANCED',
    });

    expect(request).toEqual({ skillName: 'React', level: 'ADVANCED' });
  });
});

describe('toAddTargetRoleRequest', () => {
  it('envía solo el id del rol profesional', () => {
    expect(toAddTargetRoleRequest('backend-developer')).toEqual({
      professionalRoleId: 'backend-developer',
    });
  });
});

describe('toUpdateTargetRoleRequest', () => {
  it('solo lleva el nuevo rol profesional, sin procedencia', () => {
    expect(toUpdateTargetRoleRequest('frontend-developer')).toEqual({
      professionalRoleId: 'frontend-developer',
    });
  });
});
