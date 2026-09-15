/**
 * Protege la conversión entre la fecha completa del selector nativo
 * (`<input type="date">`) y el `YearMonth` que exige el backend real de
 * Educación y Experiencia Laboral — bloqueo C-14, `SPEC.md` §8.
 */
import { describe, expect, it } from 'vitest';
import { formatYearMonth, toYearMonth } from './yearMonth';

describe('toYearMonth', () => {
  it('trunca una fecha completa a año y mes', () => {
    expect(toYearMonth('2024-03-17')).toBe('2024-03');
  });

  it('acepta un valor que ya viene en formato YYYY-MM', () => {
    expect(toYearMonth('2024-03')).toBe('2024-03');
  });

  it('lanza un error con una fecha sin formato reconocible', () => {
    expect(() => toYearMonth('no-es-una-fecha')).toThrow();
  });
});

describe('formatYearMonth', () => {
  it('formatea el mes y año en español de Colombia', () => {
    expect(formatYearMonth('2024-03', 'es-CO')).toBe('marzo de 2024');
  });
});
