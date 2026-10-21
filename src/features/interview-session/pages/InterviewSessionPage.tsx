/**
 * CM-217 · HU-5.2 · PRT-05.10 — Chat de Simulación con respuesta escrita.
 *
 * Entra con la pregunta 1 que deja la pantalla de inicio (HU-4.5) en el
 * estado de la navegación (`readSessionEntry`). Sin esa entrada —una
 * recarga, mientras HU-5.7 no exista— vuelve a «Nueva entrevista», como
 * pide el backlog. Por cada pregunta: el campo «Respuesta» y «Enviar»;
 * nada de pausa, repregunta ni reintento de una respuesta ya enviada
 * (CA-5.2.15) y ninguna retroalimentación hasta el final (CA-5.2.2). Tras
 * la pregunta 5, «Tu entrevista terminó.» sin campo ni botón (CA-5.2.5).
 *
 * El texto escrito se guarda por turno: sobrevive a un error de red
 * (CA-5.2.18) y la pregunta siguiente arranca vacía.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import type { BrandOrbState } from '@/design-system/molecules/BrandOrb';
import { useInterviewTurn } from '../hooks/useInterviewTurn';
import { ANSWER_MAX_LENGTH } from '../model/interviewSession.constants';
import { readSessionEntry } from '../model/sessionEntry';
import { EvaluationRetryPanel } from '../organisms/EvaluationRetryPanel';
import { SessionStage } from '../organisms/SessionStage';
import { TextAnswerComposer } from '../organisms/TextAnswerComposer';
import type { SessionEntry } from '../model/interviewSession.types';

export function InterviewSessionPage() {
  const location = useLocation();
  const entry = readSessionEntry(location.state);
  if (!entry) return <Navigate to={ROUTES.entrenarNueva} replace />;
  return <InterviewSessionView entry={entry} />;
}

interface InterviewSessionViewProps {
  entry: SessionEntry;
}

function InterviewSessionView({ entry }: InterviewSessionViewProps) {
  const { t } = useTranslation(['interview', 'common', 'errors']);
  const turn = useInterviewTurn(entry);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answer = answers[turn.question.turnId] ?? '';

  const isBusy = turn.isSubmitting || turn.isRetrying;
  const orbState: BrandOrbState =
    turn.phase === 'finished'
      ? 'complete'
      : isBusy
        ? 'processing'
        : turn.phase === 'evaluationFailed'
          ? 'error'
          : 'idle';

  const retryMessage = turn.retryNetworkError
    ? t('errors:red')
    : turn.retriesExhausted
      ? t('interview:sesion.reintentosAgotados')
      : t('errors:generico');

  return (
    <SessionStage
      wordmarkLabel={t('common:marca.nombre')}
      modeLabel={t('interview:sesion.modoYForma', {
        modo: t('interview:modo.SIMULACION'),
        forma: t(`interview:formaRespuesta.${entry.answerFormat}`),
      })}
      progress={turn.progress}
      progressLabel={t('interview:sesion.progreso', {
        actual: turn.progress.current,
        total: turn.progress.total,
      })}
      orbState={orbState}
      statusText={isBusy ? t('interview:sesion.procesando') : undefined}
      heading={turn.phase === 'finished' ? t('interview:sesion.terminada') : turn.question.text}
    >
      {turn.phase === 'evaluationFailed' ? (
        <EvaluationRetryPanel
          message={retryMessage}
          retryLabel={t('common:acciones.reintentar')}
          retryingLabel={t('interview:sesion.procesando')}
          isRetrying={turn.isRetrying}
          onRetry={turn.retryEvaluation}
          homeLink={
            turn.retriesExhausted
              ? { label: t('interview:sesion.irAlInicio'), to: ROUTES.inicio }
              : undefined
          }
        />
      ) : null}

      {turn.phase === 'answering' ? (
        <div className="gap-space-3 flex flex-col">
          {turn.submitError ? (
            <AlertInline variant={turn.submitError === 'red' ? 'warning' : 'error'}>
              {t(`errors:${turn.submitError}`)}
            </AlertInline>
          ) : null}
          <TextAnswerComposer
            value={answer}
            onChange={(value) =>
              setAnswers((current) => ({ ...current, [turn.question.turnId]: value }))
            }
            onSubmit={() => turn.submitAnswer(answer.trim())}
            maxLength={ANSWER_MAX_LENGTH}
            isSubmitting={turn.isSubmitting}
            label={t('interview:sesion.respuesta.etiqueta')}
            submitLabel={t('interview:sesion.enviar')}
            submittingLabel={t('interview:sesion.procesando')}
            tooLongMessage={t('interview:sesion.respuesta.demasiadoLarga', {
              max: ANSWER_MAX_LENGTH,
            })}
            formatCounter={(count, max) => t('interview:sesion.respuesta.contador', { count, max })}
          />
        </div>
      ) : null}
    </SessionStage>
  );
}
