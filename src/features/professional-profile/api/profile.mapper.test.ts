/**
 * Protege las dos derivaciones que CM-61 agrega al mapper: truncado de
 * fecha a `YearMonth` y la traducción de los dos checkboxes de Experiencia
 * Laboral (`isCurrent`/`unknownEnd`) al `employmentStatus` real (SPEC.md
 * §9, decisión D-F). CM-65 (Habilidades) y CM-69 (Roles Objetivo) no
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
  toUpdateTargetRoleRequest,
} from './profile.mapper';

describe('toAddEducationRequest', () => {
  it('trunca las fechas a YYYY-MM y fuerza la procedencia MANUAL', () => {
    const request = toAddEducationRequest({
      ...EMPTY_EDUCATION_VALUES,
      level: 'UNDERGRADUATE',
      degree: 'Ingeniería de Sistemas',
      institution: 'Universidad del Cauca',
      startDate: '2018-01-15',
      endDate: '2023-12-01',
    });

    expect(request.startDate).toBe('2018-01');
    expect(request.endDate).toBe('2023-12');
    expect(request.provenance).toBe('MANUAL');
  });

  it('inProgress=true manda endDate en null aunque el campo tenga un valor', () => {
    const request = toAddEducationRequest({
      ...EMPTY_EDUCATION_VALUES,
      level: 'UNDERGRADUATE',
      degree: 'Ingeniería de Sistemas',
      institution: 'Universidad del Cauca',
      startDate: '2018-01-15',
      endDate: '2023-12-01',
      inProgress: true,
    });

    expect(request.endDate).toBeNull();
  });

  it('un campo de estudio vacío se manda como cadena vacía, no se inventa', () => {
    const request = toAddEducationRequest({
      ...EMPTY_EDUCATION_VALUES,
      level: 'UNDERGRADUATE',
      degree: 'Ingeniería de Sistemas',
      institution: 'Universidad del Cauca',
      startDate: '2018-01-15',
    });

    expect(request.fieldOfStudy).toBe('');
  });
});

describe('toAddWorkExperienceRequest', () => {
  it('ningún checkbox marcado deriva ENDED con la fecha de fin truncada', () => {
    const request = toAddWorkExperienceRequest({
      ...EMPTY_WORK_EXPERIENCE_VALUES,
      position: 'Desarrolladora backend',
      company: 'CAMEIA',
      startDate: '2022-01-15',
      endDate: '2023-06-20',
    });

    expect(request.employmentStatus).toBe('ENDED');
    expect(request.endDate).toBe('2023-06');
  });

  it('"Trabajo aquí actualmente" deriva CURRENT sin fecha de fin', () => {
    const request = toAddWorkExperienceRequest({
      ...EMPTY_WORK_EXPERIENCE_VALUES,
      position: 'Desarrolladora backend',
      company: 'CAMEIA',
      startDate: '2022-01-15',
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
      startDate: '2022-01-15',
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
      startDate: '2022-01-15',
      isCurrent: true,
      description: '   ',
    });

    expect(request.description).toBeNull();
  });
});

describe('toAddSkillRequest', () => {
  it('recorta el texto y fuerza la procedencia MANUAL', () => {
    const request = toAddSkillRequest({
      ...EMPTY_SKILL_VALUES,
      skillName: '  React  ',
      level: 'ADVANCED',
    });

    expect(request).toEqual({ skillName: 'React', level: 'ADVANCED', provenance: 'MANUAL' });
  });
});

describe('toAddTargetRoleRequest', () => {
  it('siempre fija la procedencia MANUAL', () => {
    expect(toAddTargetRoleRequest('backend-developer')).toEqual({
      professionalRoleId: 'backend-developer',
      provenance: 'MANUAL',
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
