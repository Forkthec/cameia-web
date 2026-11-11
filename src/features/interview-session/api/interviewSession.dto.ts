// PROVISIONAL — pendiente de OpenAPI
/**
 * Contrato crudo del registro de respuestas (HU-5.2, HU-5.8) según el
 * contrato previsto de Backend (respuesta de Paula del 20-10-2026, §6.5):
 * nombres en inglés y camelCase; los valores (`COMPLETED`…) siguen el
 * backlog. `…/answers`, `…/reprocess` y `…/answers/audio` responden lo mismo.
 * Queda definitivo cuando Backend publique la OpenAPI; se ajusta solo en
 * `interviewSession.mapper.ts`.
 */

export interface SubmitAnswerRequestDto {
  turnId: string;
  answerText: string;
}

export interface QuestionDto {
  turnId: string;
  number: number;
  text: string;
}

export interface ProgressDto {
  currentQuestion: number;
  totalQuestions: number;
}

export interface AnswerResponseDto {
  turn: { turnId: string; status: string };
  progress: ProgressDto;
  nextQuestion: QuestionDto | null;
  interviewFinished: boolean;
}

/**
 * Lo que el cierre usa del objeto de estado que responde
 * `POST …/{id}/consolidation` (aviso de Backend del 7-11-2026, §6.1; propuesto
 * hasta aprobar la especificación de CM-220). Nunca trae retroalimentación.
 */
export interface ConsolidationResponseDto {
  status: string;
  interviewFinished: boolean;
}
