/**
 * Protege el inicio opcional de la experiencia laboral (HU-2.4, CM-273 PR 2, `SPEC.md` §3.3 punto 2): el servidor
 * ya acepta una experiencia sin fecha de inicio (`WorkExperience.java:138-140`) y, sin ninguna fecha, no lee la
 * réplica de la fecha de nacimiento (`ProfileAppService.java:159-161`). Las reglas de edad (CA-2.4.22 y 23) son
 * del servidor: el cliente no las conoce y deja pasar el valor. Criterios: CA-2.4.15, 22, 23 y 53, del
 * documento de criterios de HU-2.4 (v7).
 */
import { describe, expect, it } from 'vitest';
import { createWorkExperienceSchema, EMPTY_WORK_EXPERIENCE_VALUES } from './workExperience.schema';

const schema = createWorkExperienceSchema('2026-10');

const base = {
  ...EMPTY_WORK_EXPERIENCE_VALUES,
  position: 'Desarrolladora backend',
  company: 'CAMEIA',
};

describe('createWorkExperienceSchema · inicio opcional (CM-273, PR 2)', () => {
  it('«No recuerdo la fecha exacta de finalización» sin ninguna fecha es válida (CA-2.4.15 y CA-2.4.53)', () => {
    const result = schema.safeParse({ ...base, unknownEnd: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBe('');
      expect(result.data.endDate).toBe('');
    }
  });

  it('«Trabajo aquí actualmente» sin fecha de inicio es válida (CA-2.4.42 crea ese dato)', () => {
    const result = schema.safeParse({ ...base, isCurrent: true });

    expect(result.success).toBe(true);
  });

  it('terminada con solo la fecha de fin 03/2023 es válida y la convierte a «2023-03» (CA-2.4.22)', () => {
    const result = schema.safeParse({ ...base, endDate: '03/2023' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBe('');
      expect(result.data.endDate).toBe('2023-03');
    }
  });

  it('terminada con solo la fecha de fin 02/2023 también pasa en el cliente: la regla de edad es del servidor (CA-2.4.23)', () => {
    const result = schema.safeParse({ ...base, endDate: '02/2023' });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.endDate).toBe('2023-02');
  });

  it('una fecha de inicio escrita sigue validándose: «13/2024» no es un mes', () => {
    const result = schema.safeParse({ ...base, isCurrent: true, startDate: '13/2024' });

    expect(result.success).toBe(false);
  });

  it('terminada sin ninguna fecha sigue exigiendo la fecha de fin (CA-2.4.2)', () => {
    const result = schema.safeParse({ ...base });

    expect(result.success).toBe(false);
  });
});
