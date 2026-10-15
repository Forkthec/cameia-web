/**
 * Protege `formatYearMonth`, que pinta un `YearMonth` («YYYY-MM») en los periodos de la lista. CM-273
 * (PR 1, `SPEC.md` §3.3) elimina `toYearMonth` —el formulario ya guarda «AAAA-MM» (D-K) y el control
 * nativo de fecha, bloqueo C-14, deja de existir—, así que sus pruebas se quitaron; `formatYearMonth` no
 * cambia hasta el PR 2.
 */
import { describe, expect, it } from 'vitest';
import { formatYearMonth } from './yearMonth';

describe('formatYearMonth', () => {
  it('formatea el mes y año en español de Colombia', () => {
    expect(formatYearMonth('2024-03', 'es-CO')).toBe('marzo de 2024');
  });
});
