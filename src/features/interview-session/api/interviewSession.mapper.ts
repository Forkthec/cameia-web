/**
 * Cortafuegos del contrato (ADR-0003, CLAUDE.md §8): convierte la respuesta
 * de `…/answers`, `…/reprocess` y `…/answers/audio` al modelo del chat. Si
 * Backend renombra un campo, solo cambia este archivo.
 */
import type { AnswerResponseDto, QuestionDto } from './interviewSession.dto';
import type { AnswerResult, InterviewQuestion } from '../model/interviewSession.types';

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
 */
export function toAnswerResult(dto: AnswerResponseDto): AnswerResult {
  return {
    finished: dto.interviewFinished,
    nextQuestion: dto.nextQuestion ? toInterviewQuestion(dto.nextQuestion) : null,
    progress: { current: dto.progress.currentQuestion, total: dto.progress.totalQuestions },
  };
}
