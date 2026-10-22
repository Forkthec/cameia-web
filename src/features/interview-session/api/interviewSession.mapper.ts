/**
 * Cortafuegos del contrato (ADR-0003, CLAUDE.md §8): convierte la respuesta
 * de `…/answers`, `…/reprocess` y `…/answers/audio` al modelo del chat. Si
 * Backend renombra un campo, solo cambia este archivo.
 *
 * Valida la forma del `200` antes de leerlo (D10): si no calza, lanza
 * {@link AnswerResponseShapeError} y el chat muestra el genérico, no «No hay
 * conexión…». Solo se valida lo que se usa: `turn.status` no llega a la
 * interfaz.
 */
import { AnswerResponseShapeError } from './AnswerResponseShapeError';
import type { AnswerResponseDto, QuestionDto } from './interviewSession.dto';
import type { AnswerResult, InterviewQuestion } from '../model/interviewSession.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isQuestionDto(value: unknown): value is QuestionDto {
  return (
    isRecord(value) &&
    typeof value.turnId === 'string' &&
    typeof value.number === 'number' &&
    typeof value.text === 'string'
  );
}

function isAnswerResponseDto(value: unknown): value is AnswerResponseDto {
  return (
    isRecord(value) &&
    isRecord(value.progress) &&
    typeof value.progress.currentQuestion === 'number' &&
    typeof value.progress.totalQuestions === 'number' &&
    typeof value.interviewFinished === 'boolean' &&
    (value.nextQuestion === null || isQuestionDto(value.nextQuestion))
  );
}

/**
 * @param dto pregunta tal como la manda el backend.
 * @returns la pregunta del modelo de UI.
 */
export function toInterviewQuestion(dto: QuestionDto): InterviewQuestion {
  return { turnId: dto.turnId, number: dto.number, text: dto.text };
}

/**
 * @param dto respuesta de `…/answers`, `…/reprocess` o `…/answers/audio`.
 * @returns el resultado del turno para el chat.
 * @throws AnswerResponseShapeError si la respuesta no tiene la forma del contrato.
 */
export function toAnswerResult(dto: AnswerResponseDto): AnswerResult {
  if (!isAnswerResponseDto(dto)) throw new AnswerResponseShapeError();
  return {
    finished: dto.interviewFinished,
    nextQuestion: dto.nextQuestion ? toInterviewQuestion(dto.nextQuestion) : null,
    progress: { current: dto.progress.currentQuestion, total: dto.progress.totalQuestions },
  };
}
