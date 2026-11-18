/**
 * Protege el redondeo del reporte (aviso de Backend del 16-11-2026, §6): de la mitad hacia
 * arriba, un decimal, coma en es-CO y punto en en; 4,05 → 4,1, que `toFixed(1)` no da.
 */
import { describe, expect, it } from 'vitest';
import { formatInteger, formatOneDecimal } from './formatReportNumber';

describe('formatOneDecimal', () => {
  it.each([
    [3.46, '3,5'],
    [3.45, '3,5'],
    [4.05, '4,1'],
    [12, '12,0'],
    [0, '0,0'],
    [28.3, '28,3'],
  ])('%s se muestra como %s en es-CO', (value, expected) => {
    expect(formatOneDecimal(value, 'es-CO')).toBe(expected);
  });

  it('usa punto en inglés', () => {
    expect(formatOneDecimal(12, 'en')).toBe('12.0');
  });
});

describe('formatInteger', () => {
  it('muestra el ritmo sin decimales', () => {
    expect(formatInteger(120, 'es-CO')).toBe('120');
    expect(formatInteger(110.5, 'es-CO')).toBe('111');
  });
});
