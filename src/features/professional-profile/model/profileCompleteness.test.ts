/**
 * Protege el cálculo del índice de secciones y de la barra de completitud
 * (SPEC.md §9, decisión D-D): los 5 requisitos reales cuentan (nombre,
 * resumen, ≥1 educación, ≥1 habilidad — CM-65, ≥1 rol objetivo — CM-69),
 * "Experiencia Laboral" nunca aparece como completa, y el valor nunca supera
 * lo que el perfil realmente cumple.
 */
import { describe, expect, it } from 'vitest';
import type { Profile } from './profile.types';
import { getCompletenessValue, getSectionStatuses } from './profileCompleteness';

function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'profile-1',
    status: 'IN_PROGRESS',
    name: '',
    summary: '',
    summaryProvenance: null,
    education: [],
    workExperience: [],
    skills: [],
    targetRoles: [],
    ...overrides,
  };
}

describe('getCompletenessValue', () => {
  it('un perfil vacío vale 0', () => {
    expect(getCompletenessValue(buildProfile())).toBe(0);
  });

  it('nombre y resumen completos valen 2', () => {
    expect(getCompletenessValue(buildProfile({ name: 'Ana', summary: 'Backend.' }))).toBe(2);
  });

  it('agregar una educación suma el tercer punto', () => {
    const profile = buildProfile({
      name: 'Ana',
      summary: 'Backend.',
      education: [
        {
          id: 'edu-1',
          institution: 'Universidad del Cauca',
          degree: 'Ingeniería',
          fieldOfStudy: 'Sistemas',
          level: 'UNDERGRADUATE',
          startDate: '2018-01',
          endDate: '2023-12',
          inProgress: false,
          provenance: 'MANUAL',
        },
      ],
    });

    expect(getCompletenessValue(profile)).toBe(3);
  });

  it('varias educaciones no superan el punto único que representan', () => {
    const education = Array.from({ length: 3 }, (_, index) => ({
      id: `edu-${index}`,
      institution: 'Universidad del Cauca',
      degree: 'Ingeniería',
      fieldOfStudy: 'Sistemas',
      level: 'UNDERGRADUATE' as const,
      startDate: '2018-01',
      endDate: '2023-12',
      inProgress: false,
      provenance: 'MANUAL' as const,
    }));

    expect(getCompletenessValue(buildProfile({ education }))).toBe(1);
  });

  it('agregar una habilidad suma el cuarto punto', () => {
    const profile = buildProfile({
      name: 'Ana',
      summary: 'Backend.',
      education: [
        {
          id: 'edu-1',
          institution: 'Universidad del Cauca',
          degree: 'Ingeniería',
          fieldOfStudy: 'Sistemas',
          level: 'UNDERGRADUATE',
          startDate: '2018-01',
          endDate: '2023-12',
          inProgress: false,
          provenance: 'MANUAL',
        },
      ],
      skills: [{ id: 'skill-1', skillName: 'React', level: 'ADVANCED', provenance: 'MANUAL' }],
    });

    expect(getCompletenessValue(profile)).toBe(4);
  });

  it('varias habilidades no superan el punto único que representan', () => {
    const skills = Array.from({ length: 3 }, (_, index) => ({
      id: `skill-${index}`,
      skillName: `Habilidad ${index}`,
      level: 'BASIC' as const,
      provenance: 'MANUAL' as const,
    }));

    expect(getCompletenessValue(buildProfile({ skills }))).toBe(1);
  });

  it('agregar un rol objetivo suma el quinto punto', () => {
    const profile = buildProfile({
      name: 'Ana',
      summary: 'Backend.',
      education: [
        {
          id: 'edu-1',
          institution: 'Universidad del Cauca',
          degree: 'Ingeniería',
          fieldOfStudy: 'Sistemas',
          level: 'UNDERGRADUATE',
          startDate: '2018-01',
          endDate: '2023-12',
          inProgress: false,
          provenance: 'MANUAL',
        },
      ],
      skills: [{ id: 'skill-1', skillName: 'React', level: 'ADVANCED', provenance: 'MANUAL' }],
      targetRoles: [
        { id: 'target-role-1', professionalRoleId: 'backend-developer', provenance: 'MANUAL' },
      ],
    });

    expect(getCompletenessValue(profile)).toBe(5);
  });

  it('varios roles objetivo no superan el punto único que representan', () => {
    const targetRoles = Array.from({ length: 3 }, (_, index) => ({
      id: `target-role-${index}`,
      professionalRoleId: `role-${index}`,
      provenance: 'MANUAL' as const,
    }));

    expect(getCompletenessValue(buildProfile({ targetRoles }))).toBe(1);
  });
});

describe('getSectionStatuses', () => {
  it('un perfil vacío marca Información General como current y el resto upcoming', () => {
    expect(getSectionStatuses(buildProfile())).toEqual({
      'general-info': 'current',
      education: 'upcoming',
      'work-experience': 'upcoming',
      skills: 'upcoming',
      'target-roles': 'upcoming',
    });
  });

  it('nombre y resumen completos avanzan Educación a current', () => {
    const statuses = getSectionStatuses(buildProfile({ name: 'Ana', summary: 'Backend.' }));

    expect(statuses['general-info']).toBe('complete');
    expect(statuses.education).toBe('current');
  });

  it('agregar una educación avanza Habilidades a current', () => {
    const statuses = getSectionStatuses(
      buildProfile({
        name: 'Ana',
        summary: 'Backend.',
        education: [
          {
            id: 'edu-1',
            institution: 'Universidad del Cauca',
            degree: 'Ingeniería',
            fieldOfStudy: 'Sistemas',
            level: 'UNDERGRADUATE',
            startDate: '2018-01',
            endDate: '2023-12',
            inProgress: false,
            provenance: 'MANUAL',
          },
        ],
      }),
    );

    expect(statuses.education).toBe('complete');
    expect(statuses.skills).toBe('current');
  });

  it('agregar una habilidad avanza Roles Objetivo a current', () => {
    const statuses = getSectionStatuses(
      buildProfile({
        name: 'Ana',
        summary: 'Backend.',
        education: [
          {
            id: 'edu-1',
            institution: 'Universidad del Cauca',
            degree: 'Ingeniería',
            fieldOfStudy: 'Sistemas',
            level: 'UNDERGRADUATE',
            startDate: '2018-01',
            endDate: '2023-12',
            inProgress: false,
            provenance: 'MANUAL',
          },
        ],
        skills: [{ id: 'skill-1', skillName: 'React', level: 'ADVANCED', provenance: 'MANUAL' }],
      }),
    );

    expect(statuses.skills).toBe('complete');
    expect(statuses['target-roles']).toBe('current');
  });

  it('Experiencia Laboral nunca pasa de upcoming, ni con el perfil completo', () => {
    const profile = buildProfile({
      name: 'Ana',
      summary: 'Backend.',
      education: [
        {
          id: 'edu-1',
          institution: 'Universidad del Cauca',
          degree: 'Ingeniería',
          fieldOfStudy: 'Sistemas',
          level: 'UNDERGRADUATE',
          startDate: '2018-01',
          endDate: '2023-12',
          inProgress: false,
          provenance: 'MANUAL',
        },
      ],
      workExperience: [
        {
          id: 'exp-1',
          company: 'CAMEIA',
          position: 'Backend',
          description: null,
          startDate: '2024-01',
          endDate: null,
          employmentStatus: 'CURRENT',
          provenance: 'MANUAL',
        },
      ],
    });

    expect(getSectionStatuses(profile)['work-experience']).toBe('upcoming');
  });
});
