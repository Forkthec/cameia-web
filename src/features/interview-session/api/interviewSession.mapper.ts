/**
 * Cortafuegos del contrato (ADR-0003, CLAUDE.md §8): convierte la respuesta
 * de `…/answers` y `…/reprocess` al modelo del chat. Si Backend renombra un
 * campo, solo cambia este archivo.
 */
import type { AnswerResponseDto, QuestionDto } from './interviewSession.dto';
import type { AnswerResult, InterviewQuestion } from '../model/interviewSession.types';

/**
 * @param dto pregunta tal como la manda el backend.
 * @returns la pregunta del modelo de UI.
 */
export function toInterviewQuestion(dto: QuestionDto): InterviewQuestion {
  return { turnId: dto.turno_id, number: dto.numero, text: dto.texto };
}

/**
 * @param dto respuesta de `…/answers` o `…/turns/{turno_id}/reprocess`.
 * @returns el resultado del turno para el chat.
 */
export function toAnswerResult(dto: AnswerResponseDto): AnswerResult {
  return {
    finished: dto.entrevista_terminada,
    nextQuestion: dto.siguiente_pregunta ? toInterviewQuestion(dto.siguiente_pregunta) : null,
    progress: { current: dto.progreso.pregunta_actual, total: dto.progreso.total_preguntas },
  };
}
