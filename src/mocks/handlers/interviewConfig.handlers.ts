/**
 * Mock de `GET /api/v1/interviews/config/catalog` (HU-4.3, CA-4.3.10) con el
 * cuerpo exacto que Backend comprobó en staging el 22-10-2026 (§6.2).
 */
import { http, HttpResponse } from 'msw';

const INTERVIEW_CATALOG_FIXTURE = {
  modes: [
    { value: 'SIMULACION', available: true },
    { value: 'ENTRENO', available: false },
  ],
  tones: [
    { value: 'PROFESIONAL_NEUTRO', available: true },
    { value: 'CALIDO', available: true },
    { value: 'ESTRICTO', available: true },
    { value: 'MOTIVADOR', available: true },
  ],
  answerFormats: [
    { value: 'AUDIO', available: true },
    { value: 'TEXTO', available: true },
  ],
  languages: [
    { value: 'es-CO', available: true },
    { value: 'en', available: true },
  ],
};

export const interviewConfigHandlers = [
  http.get('*/api/v1/interviews/config/catalog', () =>
    HttpResponse.json(INTERVIEW_CATALOG_FIXTURE),
  ),
];
