/**
 * Protege la pantalla «Reporte de Evaluación» (HU-6.4, CM-379; backlog v11.8 y aviso de Backend
 * del 16-11-2026): encabezado y métricas con su formato (CA-6.4.1), «Sin resultado» frente a 0
 * (CA-6.4.2), carga y consulta repetida con 202 (CA-6.4.3), abandonada y sin terminar (CA-6.4.4),
 * ajena (CA-6.4.5), error y sin conexión con «Reintentar» (CA-6.4.6), el botón «?» con un solo
 * texto abierto y Esc, los estados visibles de cada pregunta y el bloque «Próximamente» (CA-6.4.7).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useHandlers } from '@/test/msw';
import type { EvaluationReportDto } from '../api/evaluationReport.dto';
import { EvaluationReportPage } from './EvaluationReportPage';

/** Ejemplo del contrato (aviso de Backend del 16-11-2026, §4 y §5), igual al mock de MSW. */
function evaluationReportBody(sessionId: string): EvaluationReportDto {
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

const URL = '*/api/v1/interviews/sessions/:sessionId/evaluation-report';

function renderPage(sessionId = 's1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[`/entrenar/sesion/${sessionId}/reporte`]}>
          <Routes>
            <Route path="/entrenar/sesion/:sessionId/reporte" element={<EvaluationReportPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('EvaluationReportPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es-CO');
  });

  it('muestra encabezado, aviso, métricas con su formato y lectura accesible (CA-6.4.1)', async () => {
    renderPage();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Reporte de Evaluación' }),
    ).toBeInTheDocument();
    expect(screen.getByText('17 de noviembre de 2026')).toBeInTheDocument();
    expect(screen.getByText('Español (Colombia)')).toBeInTheDocument();
    expect(screen.getByText('Profesional y neutro')).toBeInTheDocument();
    expect(
      screen.getByText(/Este reporte resume cómo se respondió la entrevista/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('3,5 de 5')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Precisión y Claridad' })).toHaveAttribute(
      'aria-valuetext',
      '3,5 de 5',
    );
    expect(screen.getByLabelText('120 palabras por minuto')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Tiempo de Pausas' })).toHaveAttribute(
      'aria-valuetext',
      '12,0 %',
    );
    expect(screen.getByLabelText('2,0 por cada 100 palabras')).toBeInTheDocument();
  });

  it('Entusiasmo nulo dice «Sin resultado» con su explicación y sin barra; un 0 se muestra (CA-6.4.2)', async () => {
    const body = evaluationReportBody('s1');
    body.metrics = body.metrics.map((metric) =>
      metric.code === 'HESITATION_RATE' ? { ...metric, value: 0 } : metric,
    );
    useHandlers(http.get(URL, () => HttpResponse.json(body)));
    renderPage();
    const enthusiasm = (await screen.findByRole('heading', { name: 'Entusiasmo' })).closest(
      'article',
    )!;
    expect(within(enthusiasm).getByText('Sin resultado')).toBeInTheDocument();
    expect(
      within(enthusiasm).getByText(/no hubo datos para calcular esta métrica/),
    ).toBeInTheDocument();
    expect(within(enthusiasm).queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByLabelText('0,0 por cada 100 palabras')).toBeInTheDocument();
  });

  it('el Método STAR muestra cada parte y «3 de 4»; sin nivel, «Sin resultado» (CA-6.4.2)', async () => {
    renderPage();
    const star = (await screen.findByRole('heading', { name: 'Método STAR' })).closest('section')!;
    expect(within(star).getByText('3 de 4')).toBeInTheDocument();
    expect(within(star).getAllByText('Presente')).toHaveLength(3);
    expect(within(star).getByText('Ausente')).toBeInTheDocument();
  });

  it('con el STAR sin calificar no muestra partes ni nivel', async () => {
    const body = evaluationReportBody('s1');
    body.star = body.star.map((item) => ({
      ...item,
      situation: null,
      task: null,
      action: null,
      result: null,
      level: null,
    }));
    useHandlers(http.get(URL, () => HttpResponse.json(body)));
    renderPage();
    const star = (await screen.findByRole('heading', { name: 'Método STAR' })).closest('section')!;
    expect(within(star).getByText('Sin resultado')).toBeInTheDocument();
    expect(within(star).queryByText(/de 4/)).not.toBeInTheDocument();
  });

  it('cada pregunta muestra su tipo, respuesta y los estados visibles (CA-6.4.1, CA-6.4.7)', async () => {
    renderPage();
    expect(await screen.findByText('Pregunta 2')).toBeInTheDocument();
    const second = screen.getByText('Pregunta 2').closest('article')!;
    expect(within(second).getByText('Técnica')).toBeInTheDocument();
    expect(within(second).getByText('Respondida por voz')).toBeInTheDocument();
    expect(within(second).getByText('110')).toBeInTheDocument();
    expect(within(second).getByText('palabras por minuto')).toBeInTheDocument();
    expect(within(second).getByText('28,3 %')).toBeInTheDocument();
    expect(within(second).getByText('7,1')).toBeInTheDocument();
    expect(within(second).getByText('por cada 100 palabras')).toBeInTheDocument();
    expect(screen.getByText('Respondida por texto: sin datos de voz.')).toBeInTheDocument();
    expect(screen.getByText('Respondida por voz: sin datos de voz.')).toBeInTheDocument();
    expect(screen.getByText('Sin respuesta registrada.')).toBeInTheDocument();
    expect(screen.getByText('Reporte completo')).toBeInTheDocument();
    expect(screen.getAllByText('Próximamente').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Volver a inicio' })).toHaveAttribute(
      'href',
      '/inicio',
    );
  });

  it('el «?» abre su texto, deja uno solo abierto y se cierra con Esc (CA-6.4.7)', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Qué mide Precisión y Claridad' }));
    expect(screen.getByText(/qué tan bien las respuestas contestan/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Qué es el Método STAR' }));
    expect(screen.queryByText(/qué tan bien las respuestas contestan/)).not.toBeInTheDocument();
    expect(screen.getByText(/forma de contar una experiencia real/)).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByText(/forma de contar una experiencia real/)).not.toBeInTheDocument();
  });

  it('mientras se genera muestra el aviso y vuelve a consultar tras un 202 (CA-6.4.3)', async () => {
    let calls = 0;
    useHandlers(
      http.get(URL, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { code: 'REPORT_GENERATING', message: 'Tu reporte se está generando.', requestId: 'r' },
            { status: 202 },
          );
        }
        return HttpResponse.json(evaluationReportBody('s1'));
      }),
    );
    renderPage();
    expect(await screen.findByText('Tu reporte se está generando.')).toBeInTheDocument();
    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Reporte de Evaluación' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it.each([
    ['abandonada', 'Sesión abandonada: no genera evaluación.'],
    ['en-curso', 'Tu entrevista aún no ha terminado.'],
    ['ajena', 'No encontramos lo que buscabas.'],
  ])(
    'con la sesión %s muestra su mensaje, sin métricas y con «Volver a inicio» (CA-6.4.4, CA-6.4.5)',
    async (sessionId, message) => {
      renderPage(sessionId);
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.queryByText('Métricas de contenido')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Volver a inicio' })).toBeInTheDocument();
    },
  );

  it('con falla del servidor ofrece «Reintentar», que vuelve a pedir el reporte (CA-6.4.6)', async () => {
    let calls = 0;
    useHandlers(
      http.get(URL, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { title: 't', status: 503, detail: 'd', code: 'DATABASE_UNAVAILABLE' },
            { status: 503 },
          );
        }
        return HttpResponse.json(evaluationReportBody('s1'));
      }),
    );
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText('Ocurrió un error. Inténtalo de nuevo.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Reporte de Evaluación' }),
      ).toBeInTheDocument(),
    );
  });

  it('sin conexión lo dice y ofrece «Reintentar» (CA-6.4.6)', async () => {
    useHandlers(http.get(URL, () => HttpResponse.error()));
    renderPage();
    expect(
      await screen.findByText('No hay conexión. Revisa tu internet e inténtalo de nuevo.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('un dato de voz vacío de una respuesta se muestra como «Sin resultado» (CM-380)', async () => {
    const body = evaluationReportBody('s1');
    body.questions = body.questions.map((question) =>
      question.number === 1 && question.voice
        ? { ...question, voice: { ...question.voice, speechRate: null } }
        : question,
    );
    useHandlers(http.get(URL, () => HttpResponse.json(body)));
    renderPage();
    const first = (await screen.findByText('Pregunta 1')).closest('article')!;
    const rhythm = within(first).getByText('Ritmo').closest('div')!;
    expect(within(rhythm).getByText('Sin resultado')).toBeInTheDocument();
  });
});
