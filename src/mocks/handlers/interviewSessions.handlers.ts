/**
 * Mock de POST /api/v1/interviews/sessions (HU-4.4, CA-4.4.1).
 * Responde 201 con un session_id generado. No hay backend todavia;
 * este handler permite desarrollar y probar el flujo del wizard.
 */
import { http, HttpResponse } from 'msw';

export const interviewSessionsHandlers = [
  http.post('*/api/v1/interviews/sessions', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    if (!body.profile_id || !body.target_role_id || !body.tone || !body.mode) {
      return HttpResponse.json(
        {
          title: 'Unprocessable Content',
          status: 422,
          code: 'VALIDATION_ERROR',
          errors: [
            ...(!body.profile_id ? [{ field: 'profile_id', code: 'REQUIRED' }] : []),
            ...(!body.target_role_id ? [{ field: 'target_role_id', code: 'REQUIRED' }] : []),
          ],
        },
        { status: 422 },
      );
    }

    return HttpResponse.json(
      {
        session_id: crypto.randomUUID(),
        status: 'CONFIGURADA',
        ongoing_session: null,
      },
      { status: 201 },
    );
  }),
];
