/**
 * Protege la lectura de la entrada del chat desde el estado de navegación:
 * sin una entrada válida el chat no se pinta (HU-5.7 aún no existe).
 */
import { describe, expect, it } from 'vitest';
import { readSessionEntry } from './sessionEntry';

const VALID = {
  sessionId: 's1',
  answerFormat: 'TEXTO',
  question: { turnId: 't1', number: 1, text: 'Pregunta' },
  progress: { current: 1, total: 5 },
};

describe('readSessionEntry', () => {
  it('devuelve la entrada cuando tiene la forma esperada', () => {
    expect(readSessionEntry(VALID)).toEqual(VALID);
  });

  it('devuelve null sin estado (recarga)', () => {
    expect(readSessionEntry(null)).toBeNull();
  });

  it('devuelve null con una forma de respuesta desconocida', () => {
    expect(readSessionEntry({ ...VALID, answerFormat: 'VIDEO' })).toBeNull();
  });
});
