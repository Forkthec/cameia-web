/**
 * Protege los formateadores de periodo de la lista (`formatWorkExperiencePeriod` y `formatEducationPeriod`). CM-273
 * (PR 1, `SPEC.md` §3.3) eliminó `toYearMonth` —el formulario ya guarda «AAAA-MM» (D-K) y el control nativo de
 * fecha, bloqueo C-14, dejó de existir— y el PR 2 eliminó `formatYearMonth`, que ya no tenía consumidor; sus
 * pruebas se quitaron con ellas.
 */
import type { TFunction } from 'i18next';
import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import type { EducationItem, WorkExperienceItem } from './profile.types';
import { formatEducationPeriod, formatWorkExperiencePeriod } from './yearMonth';

/*
 * CM-273 (PR 2, `SPEC.md` §3.3, punto 1, y D-U): periodos de la lista en «mm/aaaa» con el separador «–».
 * Los textos esperados son los literales del documento de criterios de HU-2.4 (v7). Se prueban las COMPOSICIONES
 * con la función de traducción real de i18next (no las llaves sueltas): «Sin fecha de inicio – actual» y
 * «Sin fecha de inicio – 06/2024» salen de la misma pieza «Sin fecha de inicio» (CA-2.4.42 y D-U). Los nombres
 * `formatWorkExperiencePeriod` y `formatEducationPeriod` y su firma (item, t) son propuesta de estas pruebas.
 */
// Se crean en `beforeAll` y no al cargar el módulo, para no depender de cuándo se inicializa i18next.
let esT: TFunction;
let enT: TFunction;

beforeAll(() => {
  esT = i18n.getFixedT('es-CO');
  enT = i18n.getFixedT('en');
});

function workItem(overrides: {
  startDate: string | null;
  endDate: string | null;
  employmentStatus: WorkExperienceItem['employmentStatus'];
}): WorkExperienceItem {
  return {
    id: 'exp-1',
    company: 'CAMEIA',
    position: 'Desarrolladora backend',
    description: null,
    provenance: 'MANUAL',
    ...overrides,
  } as unknown as WorkExperienceItem;
}

function educationItem(overrides: {
  startDate: string;
  endDate: string | null;
  inProgress: boolean;
}): EducationItem {
  return {
    id: 'edu-1',
    institution: 'Universidad del Cauca',
    degree: 'Ingeniería de Sistemas',
    level: 'UNDERGRADUATE',
    provenance: 'MANUAL',
    ...overrides,
  };
}

describe('formatWorkExperiencePeriod (CM-273, PR 2)', () => {
  it('experiencia actual con inicio: «06/2024 – actual» (CA-2.4.1)', () => {
    const item = workItem({ startDate: '2024-06', endDate: null, employmentStatus: 'CURRENT' });

    expect(formatWorkExperiencePeriod(item, esT)).toBe('06/2024 – actual');
  });

  it('terminada con fin igual al inicio: «05/2024 – 05/2024» (CA-2.4.13)', () => {
    const item = workItem({ startDate: '2024-05', endDate: '2024-05', employmentStatus: 'ENDED' });

    expect(formatWorkExperiencePeriod(item, esT)).toBe('05/2024 – 05/2024');
  });

  it('terminada con inicio y fin distintos: «01/2022 – 06/2023»', () => {
    const item = workItem({ startDate: '2022-01', endDate: '2023-06', employmentStatus: 'ENDED' });

    expect(formatWorkExperiencePeriod(item, esT)).toBe('01/2022 – 06/2023');
  });

  it('fin no recordado con inicio: «06/2024 – Fin no registrado» (CA-2.4.56)', () => {
    const item = workItem({
      startDate: '2024-06',
      endDate: null,
      employmentStatus: 'UNKNOWN_END',
    });

    expect(formatWorkExperiencePeriod(item, esT)).toBe('06/2024 – Fin no registrado');
  });

  it('fin no recordado sin ninguna fecha: «Sin fechas» (CA-2.4.15)', () => {
    const item = workItem({ startDate: null, endDate: null, employmentStatus: 'UNKNOWN_END' });

    expect(formatWorkExperiencePeriod(item, esT)).toBe('Sin fechas');
  });

  it('actual sin inicio: «Sin fecha de inicio – actual», con la pieza «Sin fecha de inicio» (CA-2.4.42)', () => {
    const item = workItem({ startDate: null, endDate: null, employmentStatus: 'CURRENT' });

    expect(formatWorkExperiencePeriod(item, esT)).toBe('Sin fecha de inicio – actual');
  });

  it('terminada con fin y sin inicio: «Sin fecha de inicio – 06/2024», compuesta con la misma pieza (D-U)', () => {
    const item = workItem({ startDate: null, endDate: '2024-06', employmentStatus: 'ENDED' });

    expect(formatWorkExperiencePeriod(item, esT)).toBe('Sin fecha de inicio – 06/2024');
  });

  it('el separador es la raya «–» (U+2013) con un espacio a cada lado, no el guion «-»', () => {
    const item = workItem({ startDate: '2022-01', endDate: '2023-06', employmentStatus: 'ENDED' });

    const period = formatWorkExperiencePeriod(item, esT);

    expect(period).toContain(' – ');
    expect(period).not.toContain(' - ');
  });

  it('en inglés cada forma de experiencia existe, sin llaves a la vista, y las que llevan palabras tienen texto propio', () => {
    // `withWords`: la forma lleva una palabra («actual», «Sin fechas»…); «05/2024 – 05/2024» es igual en los dos idiomas.
    const cases = [
      {
        withWords: true,
        item: workItem({ startDate: '2024-06', endDate: null, employmentStatus: 'CURRENT' }),
      },
      {
        withWords: false,
        item: workItem({ startDate: '2024-05', endDate: '2024-05', employmentStatus: 'ENDED' }),
      },
      {
        withWords: true,
        item: workItem({ startDate: '2024-06', endDate: null, employmentStatus: 'UNKNOWN_END' }),
      },
      {
        withWords: true,
        item: workItem({ startDate: null, endDate: null, employmentStatus: 'UNKNOWN_END' }),
      },
      {
        withWords: true,
        item: workItem({ startDate: null, endDate: null, employmentStatus: 'CURRENT' }),
      },
      {
        withWords: true,
        item: workItem({ startDate: null, endDate: '2024-06', employmentStatus: 'ENDED' }),
      },
    ];

    for (const { item, withWords } of cases) {
      const english = formatWorkExperiencePeriod(item, enT);

      expect(english.length).toBeGreaterThan(0);
      expect(english).not.toMatch(/profile:|periodo|experiencia\./);
      if (withWords) expect(english).not.toBe(formatWorkExperiencePeriod(item, esT));
    }
  });
});

describe('formatEducationPeriod (CM-273, PR 2)', () => {
  it('en curso: «02/2025 – en curso» (CA-2.4.7)', () => {
    const item = educationItem({ startDate: '2025-02', endDate: null, inProgress: true });

    expect(formatEducationPeriod(item, esT)).toBe('02/2025 – en curso');
  });

  it('terminada sin fecha de fin: «02/2025 – Sin fecha de fin» (CA-2.4.8)', () => {
    const item = educationItem({ startDate: '2025-02', endDate: null, inProgress: false });

    expect(formatEducationPeriod(item, esT)).toBe('02/2025 – Sin fecha de fin');
  });

  it('fin igual al inicio: «02/2025 – 02/2025» (CA-2.4.29)', () => {
    const item = educationItem({ startDate: '2025-02', endDate: '2025-02', inProgress: false });

    expect(formatEducationPeriod(item, esT)).toBe('02/2025 – 02/2025');
  });

  it('inicio y fin distintos: «01/2018 – 12/2023»', () => {
    const item = educationItem({ startDate: '2018-01', endDate: '2023-12', inProgress: false });

    expect(formatEducationPeriod(item, esT)).toBe('01/2018 – 12/2023');
  });

  it('en inglés cada forma de formación existe, sin llaves a la vista, y las que llevan palabras tienen texto propio', () => {
    const cases = [
      {
        withWords: true,
        item: educationItem({ startDate: '2025-02', endDate: null, inProgress: true }),
      },
      {
        withWords: true,
        item: educationItem({ startDate: '2025-02', endDate: null, inProgress: false }),
      },
      {
        withWords: false,
        item: educationItem({ startDate: '2025-02', endDate: '2025-02', inProgress: false }),
      },
    ];

    for (const { item, withWords } of cases) {
      const english = formatEducationPeriod(item, enT);

      expect(english.length).toBeGreaterThan(0);
      expect(english).not.toMatch(/profile:|periodo|educacion\./);
      if (withWords) expect(english).not.toBe(formatEducationPeriod(item, esT));
    }
  });
});
