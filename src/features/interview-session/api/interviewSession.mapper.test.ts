/**
 * Protege el cortafuegos del contrato de la respuesta (D1, contrato previsto
 * de Backend del 20-10-2026, §6.5; CLAUDE.md §8): convierte el `200` común de
 * `…/answers`, `…/reprocess` y `…/answers/audio` al modelo del chat, y
 * rechaza una forma inesperada con un error propio de la feature (D10), no
 * con un `TypeError`, para que el chat no la muestre como «No hay conexión…».
 */
import { describe, expect, it } from 'vitest';
import { AnswerResponseShapeError } from './AnswerResponseShapeError';
import type { AnswerResponseDto } from './interviewSession.dto';
import { toAnswerResult } from './interviewSession.mapper';

describe('toAnswerResult', () => {
  it('convierte la respuesta 200 del contrato previsto y rechaza una forma inesperada', () => {
    const next: AnswerResponseDto = {
      turn: { turnId: 't1', status: 'COMPLETED' },
      progress: { currentQuestion: 2, totalQuestions: 5 },
      nextQuestion: { turnId: 't2', number: 2, text: '¿Cómo manejas un conflicto?' },
      interviewFinished: false,
    };
    expect(toAnswerResult(next)).toEqual({
      finished: false,
      nextQuestion: { turnId: 't2', number: 2, text: '¿Cómo manejas un conflicto?' },
      progress: { current: 2, total: 5 },
    });

    const last: AnswerResponseDto = {
      turn: { turnId: 't5', status: 'COMPLETED' },
      progress: { currentQuestion: 5, totalQuestions: 5 },
      nextQuestion: null,
      interviewFinished: true,
    };
    expect(toAnswerResult(last)).toEqual({
      finished: true,
      nextQuestion: null,
      progress: { current: 5, total: 5 },
    });

    const withoutProgress = { turn: { turnId: 't1', status: 'COMPLETED' } } as AnswerResponseDto;
    expect(() => toAnswerResult(withoutProgress)).toThrow(AnswerResponseShapeError);
  });
});
