/**
 * Cortafuegos del contrato del reporte (ADR-0003): convierte el DTO en el modelo de UI. Separa
 * las métricas por grupo en el orden del catálogo, descarta un código o unidad que la pantalla
 * no conoce (no tiene texto en i18n) y ordena el STAR y las preguntas por número.
 */
import type { EvaluationReportDto, MetricDto } from './evaluationReport.dto';
import {
  METRIC_CODES,
  METRIC_UNITS,
  QUESTION_TYPES,
  type EvaluationReport,
  type Metric,
  type MetricCode,
  type MetricUnit,
  type QuestionType,
} from '../model/evaluationReport.types';

function toMetric(dto: MetricDto): Metric | null {
  if (!(METRIC_CODES as readonly string[]).includes(dto.code)) return null;
  const unit =
    dto.unit && (METRIC_UNITS as readonly string[]).includes(dto.unit)
      ? (dto.unit as MetricUnit)
      : null;
  return {
    code: dto.code as MetricCode,
    group: dto.group === 'VOICE' ? 'VOICE' : 'CONTENT',
    value: typeof dto.value === 'number' ? dto.value : null,
    unit,
  };
}

/**
 * @param dto respuesta 200 del reporte.
 * @returns el reporte para la pantalla.
 */
export function toEvaluationReport(dto: EvaluationReportDto): EvaluationReport {
  const metrics = dto.metrics
    .map(toMetric)
    .filter((metric): metric is Metric => metric !== null)
    .sort((a, b) => METRIC_CODES.indexOf(a.code) - METRIC_CODES.indexOf(b.code));
  return {
    sessionId: dto.sessionId,
    interviewDate: dto.interviewDate,
    sessionLanguage: dto.sessionLanguage,
    tone: dto.tone,
    contentMetrics: metrics.filter((metric) => metric.group === 'CONTENT'),
    voiceMetrics: metrics.filter((metric) => metric.group === 'VOICE'),
    star: [...dto.star]
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .map((item) => ({
        questionNumber: item.questionNumber,
        questionText: item.questionText,
        parts: {
          situation: item.situation,
          task: item.task,
          action: item.action,
          result: item.result,
        },
        level: item.level,
      })),
    questions: [...dto.questions]
      .sort((a, b) => a.number - b.number)
      .map((question) => ({
        number: question.number,
        type: (QUESTION_TYPES as readonly string[]).includes(question.type)
          ? (question.type as QuestionType)
          : null,
        text: question.questionText,
        answer: question.answerText,
        origin:
          question.answerOrigin === 'VOICE' || question.answerOrigin === 'TEXT'
            ? question.answerOrigin
            : null,
        voice: question.voice,
      })),
  };
}
