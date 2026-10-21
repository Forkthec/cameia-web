/**
 * Modelo de UI del chat de Simulación (PRT-05.10, HU-5.2). Los nombres
 * siguen el glosario; la traducción desde el contrato vive en
 * `api/interviewSession.mapper.ts` (ADR-0003).
 */

/** Forma de respuesta de la sesión (`GLOSSARY` §5). */
export type AnswerFormat = 'TEXTO' | 'AUDIO';

/** Pregunta principal pendiente, con su Turno de Entrevista. */
export interface InterviewQuestion {
  turnId: string;
  /** Número de la pregunta, desde 1. */
  number: number;
  /** Texto original, sin reformular (CA-5.2.14). */
  text: string;
}

/** Avance de la entrevista; el total lo manda el backend (CLAUDE.md §3.7). */
export interface InterviewProgress {
  current: number;
  total: number;
}

/** Resultado de registrar (o reprocesar) una respuesta. */
export interface AnswerResult {
  /** `true` al responder la última pregunta (CA-5.2.5). */
  finished: boolean;
  nextQuestion: InterviewQuestion | null;
  progress: InterviewProgress;
}

/**
 * Lo que la pantalla de inicio (HU-4.5) entrega al chat al navegar: la
 * pregunta 1 y la configuración que el chat necesita para pintarse.
 */
export interface SessionEntry {
  sessionId: string;
  answerFormat: AnswerFormat;
  question: InterviewQuestion;
  progress: InterviewProgress;
}
