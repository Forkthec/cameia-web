/**
 * Modelo de UI del Reporte de Evaluación (HU-6.4). Los códigos son los del contrato (catálogos
 * cerrados, CLAUDE.md §7: la etiqueta visible sale de i18n); lo que el backend pueda cambiar se
 * detiene en `api/evaluationReport.mapper.ts`.
 */

/** Las 7 métricas, en el orden en que se muestran (aviso de Backend del 16-11-2026, §4). */
export const METRIC_CODES = [
  'PRECISION_CLARITY',
  'VERBAL_CHARISMA',
  'INCLUSIVE_LANGUAGE',
  'SPEECH_RATE',
  'PAUSE_TIME',
  'HESITATION_RATE',
  'ENTHUSIASM',
] as const;
export type MetricCode = (typeof METRIC_CODES)[number];

export const METRIC_UNITS = ['SCORE_1_5', 'WORDS_PER_MINUTE', 'PERCENT', 'PER_100_WORDS'] as const;
export type MetricUnit = (typeof METRIC_UNITS)[number];

export const QUESTION_TYPES = ['APERTURA', 'TECNICA', 'CONDUCTUAL', 'SITUACIONAL'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const STAR_PARTS = ['situation', 'task', 'action', 'result'] as const;
export type StarPart = (typeof STAR_PARTS)[number];

export type AnswerOrigin = 'TEXT' | 'VOICE';

/** Una métrica; `value: null` es «Sin resultado» y un 0 es un valor calculado (CA-6.4.2). */
export interface Metric {
  code: MetricCode;
  group: 'CONTENT' | 'VOICE';
  value: number | null;
  unit: MetricUnit | null;
}

/** Método STAR de una pregunta conductual; `level: null` es «Sin resultado». */
export interface StarResult {
  questionNumber: number;
  questionText: string;
  parts: Record<StarPart, boolean | null>;
  level: number | null;
}

/** Datos de voz de una respuesta; un `null` es «Sin resultado». */
export interface VoiceData {
  words: number;
  fillers: number;
  speechRate: number | null;
  pauseTime: number | null;
  hesitationRate: number | null;
}

export interface QuestionResult {
  number: number;
  type: QuestionType | null;
  text: string;
  answer: string | null;
  origin: AnswerOrigin | null;
  voice: VoiceData | null;
}

export interface EvaluationReport {
  sessionId: string;
  interviewDate: string;
  sessionLanguage: string;
  tone: string;
  contentMetrics: Metric[];
  voiceMetrics: Metric[];
  star: StarResult[];
  questions: QuestionResult[];
}
