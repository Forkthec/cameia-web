/**
 * Protege el cálculo del índice de secciones y de la barra de completitud
 * (SPEC.md §9, decisión D-D): solo los 3 requisitos que CM-61 puede evaluar
 * hoy cuentan, "Experiencia Laboral" nunca aparece como completa, y el valor
 * nunca supera lo que el perfil realmente cumple.
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
});

describe('getSectionStatuses', () => {
  it('un perfil vacío marca Información General como current y el resto upcoming', () => {
    expect(getSectionStatuses(buildProfile())).toEqual({
      'general-info': 'current',
      education: 'upcoming',
      'work-experience': 'upcoming',
    });
  });

  it('nombre y resumen completos avanzan Educación a current', () => {
    const statuses = getSectionStatuses(buildProfile({ name: 'Ana', summary: 'Backend.' }));

    expect(statuses['general-info']).toBe('complete');
    expect(statuses.education).toBe('current');
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
