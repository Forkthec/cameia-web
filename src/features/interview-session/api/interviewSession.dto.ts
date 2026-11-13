// PROVISIONAL — pendiente de OpenAPI
/**
 * Contrato crudo del registro de respuestas (HU-5.2, HU-5.8). `…/answers` y
 * `…/reprocess` siguen el contrato publicado (`InterviewSessionController` y
 * su OpenAPI, `cameia-entrevista` `origin/develop` `48773cb`): nombres en
 * inglés y camelCase; los valores (`COMPLETED`…) siguen el backlog.
 * `…/answers/audio` responde lo mismo. Se ajusta solo en
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
