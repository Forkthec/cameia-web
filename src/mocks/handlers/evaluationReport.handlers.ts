/**
 * Mock de `GET /api/v1/interviews/sessions/{sessionId}/evaluation-report` (HU-6.4, CM-379) con
 * los ejemplos del contrato del aviso de Backend del 16-11-2026 (§4 y §5). PROVISIONAL hasta que
 * Backend publique CM-380. Para probar estados, el `sessionId` elige la respuesta:
 * `abandonada` → 409 SESSION_ABANDONED, `en-curso` → 409 SESSION_NOT_FINISHED,
 * `ajena` → 404 SESSION_NOT_FOUND, `falla` → 503 DATABASE_UNAVAILABLE; cualquier otro → 200.
 */
import { http, HttpResponse } from 'msw';

function problem(status: number, code: string, title: string, detail: string) {
  return HttpResponse.json(
    { title, status, detail, code, requestId: 'mock-request' },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

export function evaluationReportBody(sessionId: string) {
  return {
    sessionId,
    issuedAt: '2026-11-17T15:04:05Z',
    interviewDate: '2026-11-17T14:58:40Z',
    sessionLanguage: 'es-CO',
    tone: 'PROFESIONAL_NEUTRO',
    metrics: [
      { code: 'PRECISION_CLARITY', group: 'CONTENT', value: 3.46, unit: 'SCORE_1_5' },
      { code: 'VERBAL_CHARISMA', group: 'CONTENT', value: 4.0, unit: 'SCORE_1_5' },
      { code: 'INCLUSIVE_LANGUAGE', group: 'CONTENT', value: 5.0, unit: 'SCORE_1_5' },
      { code: 'SPEECH_RATE', group: 'VOICE', value: 120, unit: 'WORDS_PER_MINUTE' },
      { code: 'PAUSE_TIME', group: 'VOICE', value: 12.0, unit: 'PERCENT' },
      { code: 'HESITATION_RATE', group: 'VOICE', value: 2.0, unit: 'PER_100_WORDS' },
      { code: 'ENTHUSIASM', group: 'VOICE', value: null, unit: null },
    ],
    star: [
      {
        questionNumber: 3,
        questionText: 'Cuéntame de una vez que resolviste un conflicto en equipo.',
        situation: true,
        task: true,
        action: true,
        result: false,
        level: 3,
      },
    ],
    questions: [
      {
        number: 1,
        type: 'APERTURA',
        questionText: 'Cuéntame un poco sobre ti y tu experiencia.',
        answerText:
          'Soy desarrolladora backend con dos años de experiencia, eh, sobre todo en Java.',
        answerOrigin: 'VOICE',
        voice: { words: 48, fillers: 1, speechRate: 132, pauseTime: 9.4, hesitationRate: 2.1 },
      },
      {
        number: 2,
        type: 'TECNICA',
        questionText:
          '¿Qué diferencia hay entre una transacción optimista y una pesimista en una base de datos?',
        answerText: 'Eh, pues las dos sirven para lo mismo, como para que no se dañen los datos.',
        answerOrigin: 'VOICE',
        voice: { words: 56, fillers: 4, speechRate: 110, pauseTime: 28.3, hesitationRate: 7.1 },
      },
      {
        number: 3,
        type: 'CONDUCTUAL',
        questionText: 'Cuéntame de una vez que resolviste un conflicto en equipo.',
        answerText:
          'En mi último proyecto dos compañeros no se ponían de acuerdo con el diseño de la API. Organicé una reunión y armamos una versión intermedia.',
        answerOrigin: 'TEXT',
        voice: null,
      },
      {
        number: 4,
        type: 'SITUACIONAL',
        questionText: '¿Qué harías si a mitad de un sprint cambian los requisitos de una historia?',
        answerText: 'Hablaría primero con el Product Owner y revisaría con el equipo el impacto.',
        answerOrigin: 'VOICE',
        voice: null,
      },
      {
        number: 5,
        type: 'TECNICA',
        questionText: '¿Cómo te aseguras de que una API sea fácil de mantener?',
        answerText: null,
        answerOrigin: null,
        voice: null,
      },
    ],
  };
}

export const evaluationReportHandlers = [
  http.get('*/api/v1/interviews/sessions/:sessionId/evaluation-report', ({ params }) => {
    const sessionId = String(params.sessionId);
    if (sessionId === 'abandonada') {
      return problem(
        409,
        'SESSION_ABANDONED',
        'Sesión abandonada',
        'Sesión abandonada: no genera evaluación.',
      );
    }
    if (sessionId === 'en-curso') {
      return problem(
        409,
        'SESSION_NOT_FINISHED',
        'Entrevista sin terminar',
        'Tu entrevista aún no ha terminado.',
      );
    }
    if (sessionId === 'ajena') {
      return problem(404, 'SESSION_NOT_FOUND', 'No encontrada', 'No encontramos lo que buscabas.');
    }
    if (sessionId === 'falla') {
      return problem(
        503,
        'DATABASE_UNAVAILABLE',
        'No disponible',
        'Ocurrió un error. Inténtalo de nuevo.',
      );
    }
    return HttpResponse.json(evaluationReportBody(sessionId));
  }),
];
