// PROVISIONAL — pendiente de OpenAPI
/**
 * Contrato crudo de `GET /api/v1/interviews/sessions/{sessionId}/evaluation-report` (HU-6.4;
 * observaciones de HE-06 del backlog v11.8 y aviso de Backend del 16-11-2026, secciones 4 y 5).
 * Lo publica Backend en CM-380; ningún componente lo toca: pasa por `evaluationReport.mapper.ts`.
 */
export interface MetricDto {
  code: string;
  group: string;
  value: number | null;
  unit: string | null;
}

export interface StarDto {
  questionNumber: number;
  questionText: string;
  situation: boolean | null;
  task: boolean | null;
  action: boolean | null;
  result: boolean | null;
  level: number | null;
}

/** Ritmo, pausas y vacilación pueden faltar (`AnswerVoiceResponse` de cameia-entrevista, CM-380). */
export interface VoiceDataDto {
  words: number;
  fillers: number;
  speechRate: number | null;
  pauseTime: number | null;
  hesitationRate: number | null;
}

export interface QuestionResultDto {
  number: number;
  type: string;
  questionText: string;
  answerText: string | null;
  answerOrigin: string | null;
  voice: VoiceDataDto | null;
}

export interface EvaluationReportDto {
  sessionId: string;
  issuedAt: string;
  interviewDate: string;
  sessionLanguage: string;
  tone: string;
  metrics: MetricDto[];
  star: StarDto[];
  questions: QuestionResultDto[];
}
