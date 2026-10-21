// PROVISIONAL — pendiente de OpenAPI
/**
 * Contrato crudo del registro de respuestas (HU-5.2), tomado de las notas
 * técnicas del backlog v8.2: cuerpo `{turno_id, respuesta_texto}` con
 * cabecera `Idempotency-Key`, y respuesta 200 con «el estado del turno, el
 * progreso y la siguiente pregunta». Los nombres exactos de la respuesta no
 * están cerrados por Backend (cameia-entrevista aún no publica el endpoint):
 * se ajustan solo en `interviewSession.mapper.ts`.
 */

export interface SubmitAnswerRequestDto {
  turno_id: string;
  respuesta_texto: string;
}

export interface QuestionDto {
  turno_id: string;
  numero: number;
  texto: string;
}

export interface ProgressDto {
  pregunta_actual: number;
  total_preguntas: number;
}

export interface AnswerResponseDto {
  turno: { turno_id: string; estado: string };
  progreso: ProgressDto;
  siguiente_pregunta: QuestionDto | null;
  entrevista_terminada: boolean;
}
