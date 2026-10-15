/**
 * Protege la lógica pura de `MonthField` (CM-273, PR 1; `SPEC.md` §3.3 y D-K, D-L): la máscara «mm/aaaa»
 * al teclear, pegar y borrar hacia atrás, la conversión «mm/aaaa» ↔ «AAAA-MM» (el esquema de Zod valida el
 * texto y transforma a «AAAA-MM») y el mes actual en UTC (RT-07-CA04, D-M: lo calcula la página). Los
 * nombres de las funciones son propuesta de estas pruebas en rojo; los formatos salen del backlog
 * («mm/aaaa», `HU-2.4` CA-2.4.43, 44 y 60) y del servidor («AAAA-MM», `FieldValues.java`).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatMonthValue,
  getCurrentUtcYearMonth,
  maskMonthInput,
  parseMonthText,
} from './monthMask';

describe('maskMonthInput', () => {
  it('al teclear dígito a dígito, inserta la barra solo cuando ya hay más de dos dígitos', () => {
    expect(maskMonthInput('')).toBe('');
    expect(maskMonthInput('0')).toBe('0');
    expect(maskMonthInput('06')).toBe('06');
    expect(maskMonthInput('062')).toBe('06/2');
    expect(maskMonthInput('0620')).toBe('06/20');
    expect(maskMonthInput('06202')).toBe('06/202');
    expect(maskMonthInput('062024')).toBe('06/2024');
  });

  it('al teclear la barra, no la duplica ni la deja colgando', () => {
    expect(maskMonthInput('06/')).toBe('06');
    expect(maskMonthInput('06/2')).toBe('06/2');
    expect(maskMonthInput('06/2024')).toBe('06/2024');
  });

  it('al pegar, acepta el texto con o sin barra y con espacios alrededor', () => {
    expect(maskMonthInput('062024')).toBe('06/2024');
    expect(maskMonthInput('06/2024')).toBe('06/2024');
    expect(maskMonthInput(' 06/2024 ')).toBe('06/2024');
  });

  it('al pegar, descarta todo lo que no es dígito', () => {
    expect(maskMonthInput('a0b6c/2d0e2f4')).toBe('06/2024');
    expect(maskMonthInput('06-2024')).toBe('06/2024');
  });

  it('no pasa de seis dígitos (mm + aaaa)', () => {
    expect(maskMonthInput('06202499')).toBe('06/2024');
    expect(maskMonthInput('0620249999999')).toBe('06/2024');
  });

  it('al borrar hacia atrás, quita la barra junto con el primer dígito del año y no la deja colgando', () => {
    // Valores crudos que deja el navegador tras cada «Retroceso» desde «06/2024».
    expect(maskMonthInput('06/202')).toBe('06/202');
    expect(maskMonthInput('06/20')).toBe('06/20');
    expect(maskMonthInput('06/2')).toBe('06/2');
    expect(maskMonthInput('06/')).toBe('06');
    expect(maskMonthInput('0')).toBe('0');
    expect(maskMonthInput('')).toBe('');
  });

  it('con entradas basura devuelve cadena vacía', () => {
    expect(maskMonthInput('abc')).toBe('');
    expect(maskMonthInput('///')).toBe('');
    expect(maskMonthInput('  ')).toBe('');
    expect(maskMonthInput('👩‍💻')).toBe('');
  });

  it('es idempotente: enmascarar un texto ya enmascarado no lo cambia', () => {
    for (const sample of ['', '0', '06', '06/2', '06/20', '06/202', '06/2024', '13/2024']) {
      expect(maskMonthInput(maskMonthInput(sample))).toBe(maskMonthInput(sample));
    }
  });
});

describe('parseMonthText («mm/aaaa» → «AAAA-MM»)', () => {
  it('convierte un mes y un año válidos', () => {
    expect(parseMonthText('06/2024')).toBe('2024-06');
    expect(parseMonthText('01/2000')).toBe('2000-01');
    expect(parseMonthText('12/1999')).toBe('1999-12');
  });

  it('rechaza un mes que no existe (la fecha «13/2024» de CA-2.4.43, 44 y 60)', () => {
    expect(parseMonthText('13/2024')).toBeNull();
    expect(parseMonthText('00/2024')).toBeNull();
  });

  it('rechaza un texto incompleto', () => {
    expect(parseMonthText('0')).toBeNull();
    expect(parseMonthText('06')).toBeNull();
    expect(parseMonthText('06/')).toBeNull();
    expect(parseMonthText('06/2')).toBeNull();
    expect(parseMonthText('06/20')).toBeNull();
    expect(parseMonthText('06/202')).toBeNull();
  });

  it('rechaza un mes de un solo dígito', () => {
    expect(parseMonthText('6/2024')).toBeNull();
  });

  it('rechaza entradas basura', () => {
    expect(parseMonthText('abc')).toBeNull();
    expect(parseMonthText('06/20ab')).toBeNull();
    expect(parseMonthText('ab/cdef')).toBeNull();
    expect(parseMonthText('06/2024/01')).toBeNull();
  });

  it('con cadena vacía devuelve null: quién decide si vacío es obligatorio u opcional es el esquema', () => {
    expect(parseMonthText('')).toBeNull();
  });
});

describe('formatMonthValue («AAAA-MM» → «mm/aaaa»)', () => {
  it('convierte un valor «AAAA-MM»', () => {
    expect(formatMonthValue('2024-06')).toBe('06/2024');
    expect(formatMonthValue('1999-12')).toBe('12/1999');
  });

  it('con cadena vacía devuelve cadena vacía', () => {
    expect(formatMonthValue('')).toBe('');
  });

  it('ida y vuelta: parse(format(x)) y format(parse(x)) devuelven el original', () => {
    expect(parseMonthText(formatMonthValue('2024-06'))).toBe('2024-06');
    const parsed = parseMonthText('06/2024');
    expect(parsed).not.toBeNull();
    expect(formatMonthValue(parsed as string)).toBe('06/2024');
  });
});

describe('getCurrentUtcYearMonth', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('devuelve el mes del instante actual como «AAAA-MM»', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-14T12:00:00Z'));

    expect(getCurrentUtcYearMonth()).toBe('2026-10');
  });

  it('cambia de mes exactamente a las 00:00 UTC', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-10-31T23:59:59Z'));
    expect(getCurrentUtcYearMonth()).toBe('2026-10');

    vi.setSystemTime(new Date('2026-11-01T00:00:00Z'));
    expect(getCurrentUtcYearMonth()).toBe('2026-11');
  });

  it('usa UTC y no la hora local: en Colombia (UTC-5) las últimas 5 horas del mes ya son el mes siguiente', () => {
    vi.stubEnv('TZ', 'America/Bogota');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T04:30:00Z')); // 23:30 del 31-oct en Bogotá

    const result = getCurrentUtcYearMonth();

    // Guarda: la zona horaria de la prueba tomó efecto (si no, esta prueba no distinguiría UTC de local).
    expect(new Date().getMonth()).toBe(9);
    expect(result).toBe('2026-11');
  });

  it('acepta un instante explícito', () => {
    expect(getCurrentUtcYearMonth(new Date('2030-01-01T00:00:00Z'))).toBe('2030-01');
  });
});
