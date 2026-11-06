/**
 * CM-217 · CM-317 · HU-5.2 · HU-5.8 · PRT-05.10 — Chat de Simulación.
 *
 * Entra con la pregunta 1 que deja la pantalla de inicio (HU-4.5) en el
 * estado de la navegación (`readSessionEntry`). Sin esa entrada —una
 * recarga, mientras HU-5.7 no exista— vuelve a «Nueva entrevista», como
 * pide el backlog. Por cada pregunta: nada de pausa, repregunta ni
 * reintento de una respuesta ya enviada (CA-5.2.15) y ninguna
 * retroalimentación hasta el final (CA-5.2.2). Tras la pregunta 5, «Tu
 * entrevista terminó.» sin controles (CA-5.2.5).
 *
 * **Respuesta.** Una entrevista con Texto muestra el campo desde el inicio
 * (HU-5.2). Una con Audio muestra «Grabar» / «Detener» / «Enviar» y
 * «Responder por texto» (HU-5.8); pasar a texto, un micrófono denegado o
 * ausente (CA-5.8.3, CA-5.8.23) o un formato no admitido (notas técnicas de
 * HU-5.8, texto de CA-4.3.7, sin «Grabar») dejan el campo de texto en esa
 * misma pregunta. Si MicVAD no carga, se muestran el aviso, el campo de texto
 * y «Grabar» (CA-5.8.25). Tras elegir texto, la pregunta siguiente vuelve a
 * ofrecer la voz; con el micrófono denegado o ausente se sigue por texto.
 * El aviso del audio se ve hasta que la grabación empieza de verdad
 * (CA-5.8.24, CM-316 D8), y el de 20 s se programa por cada envío (CA-5.8.5).
 *
 * El texto escrito se guarda por turno: sobrevive a un error de red
 * (CA-5.2.18) y la pregunta siguiente arranca vacía. La grabación detenida
 * se conserva en el navegador si el envío falla por la red (CA-5.8.22); qué
 * errores la descartan lo decide `useInterviewTurn` (SPEC §5).
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import type { BrandOrbState } from '@/design-system/molecules/BrandOrb';
import { useInterviewTurn } from '../hooks/useInterviewTurn';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import {
  ANSWER_MAX_LENGTH,
  LONG_WAIT_NOTICE_MS,
  MAX_RECORDING_SECONDS,
} from '../model/interviewSession.constants';
import { readSessionEntry } from '../model/sessionEntry';
import { EvaluationRetryPanel } from '../organisms/EvaluationRetryPanel';
import { SessionStage } from '../organisms/SessionStage';
import { TextAnswerComposer } from '../organisms/TextAnswerComposer';
import { VoiceAnswerComposer, type VoiceComposerStep } from '../organisms/VoiceAnswerComposer';
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
  const { t, i18n } = useTranslation(['interview', 'common', 'errors']);
  const turn = useInterviewTurn(entry);
  const recorder = useVoiceRecorder();
  const turnId = turn.question.turnId;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textTurns, setTextTurns] = useState<Record<string, boolean>>({});
  const [hasRecorded, setHasRecorded] = useState(false);
  /** Envíos de audio hechos; el aviso de 20 s se liga a uno solo (CA-5.8.5). */
  const [audioSends, setAudioSends] = useState(0);
  const [longWaitSend, setLongWaitSend] = useState<number | null>(null);
  const answer = answers[turnId] ?? '';

  // El aviso de CA-5.8.24 se oculta cuando la grabación empieza de verdad, no al pulsar
  // «Grabar»: si se prepara, se niega el permiso o MicVAD falla, sigue visible (CM-316 D8).
  if (recorder.status === 'recording' && !hasRecorded) setHasRecorded(true);

  // Sin micrófono o sin formato admitido la pregunta sigue por texto; con MicVAD caído
  // se muestran los dos, porque «Grabar» puede funcionar al reintentar (CA-5.8.25).
  const voiceUnavailable =
    recorder.status === 'denied' ||
    recorder.status === 'noMicrophone' ||
    recorder.status === 'unsupported';
  const answersByVoice = entry.answerFormat === 'AUDIO' && !textTurns[turnId] && !voiceUnavailable;
  const vadFailed = recorder.status === 'vadFailed';

  const isBusy = turn.isSubmitting || turn.isRetrying;
  const orbState: BrandOrbState =
    turn.phase === 'finished'
      ? 'complete'
      : isBusy
        ? 'processing'
        : turn.phase === 'evaluationFailed'
          ? 'error'
          : recorder.status === 'recording'
            ? 'recording'
            : 'idle';

  const seconds = new Intl.NumberFormat(i18n.language, { minimumIntegerDigits: 2 });
  const clock = (total: number) => `${Math.floor(total / 60)}:${seconds.format(total % 60)}`;

  // El panel muestra el último fallo de «Reintentar»: red, 404 u otro error
  // con su mensaje; un fallo de la IA, el genérico o el de tope agotado (D4).
  const retryMessage = turn.retryError
    ? t(`errors:${turn.retryError}`)
    : turn.retriesExhausted
      ? t('interview:sesion.reintentosAgotados')
      : t('errors:generico');

  const voiceStep: VoiceComposerStep =
    recorder.status === 'recording'
      ? 'recording'
      : recorder.status === 'stopped'
        ? 'stopped'
        : recorder.status === 'requesting'
          ? 'requesting'
          : 'ready';

  // Un temporizador por envío de audio, que vive mientras ese envío está en curso: al
  // terminar, fallar o desmontar se limpia, y un reenvío no hereda el anterior (CA-5.8.5).
  useEffect(() => {
    if (!turn.isSubmitting || !answersByVoice || audioSends === 0) return;
    const timer = window.setTimeout(() => setLongWaitSend(audioSends), LONG_WAIT_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [turn.isSubmitting, answersByVoice, audioSends]);

  function sendAudio() {
    if (!recorder.audio) return;
    setAudioSends((count) => count + 1);
    turn.submitAnswer({ kind: 'audio', audio: recorder.audio }, recorder.discard);
  }

  // Aviso sobre los controles de voz: el del navegador (menos de 2 s de voz o
  // MicVAD que no cargó) o el rechazo de Backend al transcribir (CA-5.12.7 a CA-5.12.10).
  const voiceNotice =
    turn.audioRejection === 'idiomaDistinto'
      ? t(
          entry.sessionLanguage === 'en'
            ? 'interview:sesion.voz.idiomaDistinto.en'
            : 'interview:sesion.voz.idiomaDistinto.es-CO',
        )
      : turn.audioRejection
        ? t(`interview:sesion.voz.${turn.audioRejection}`)
        : recorder.status === 'noVoice'
          ? t('interview:sesion.voz.sinVoz')
          : vadFailed
            ? t('interview:sesion.voz.noPreparada')
            : undefined;

  const unavailableMessage =
    recorder.status === 'denied'
      ? t('interview:sesion.voz.micDenegado')
      : recorder.status === 'noMicrophone'
        ? t('interview:sesion.voz.sinMicrofono')
        : t('interview:formaRespuesta.navegadorNoGraba');

  const textComposer = (
    <TextAnswerComposer
      value={answer}
      onChange={(value) => setAnswers((current) => ({ ...current, [turnId]: value }))}
      // Se envía tal como se escribió: `trim()` solo decide si está vacía (CA-5.2.3, CA-5.2.8).
      onSubmit={() => turn.submitAnswer({ kind: 'text', text: answer })}
      maxLength={ANSWER_MAX_LENGTH}
      isSubmitting={turn.isSubmitting}
      label={t('interview:sesion.respuesta.etiqueta')}
      submitLabel={t('interview:sesion.enviar')}
      tooLongMessage={t('interview:sesion.respuesta.demasiadoLarga', { max: ANSWER_MAX_LENGTH })}
      formatCounter={(count, max) => t('interview:sesion.respuesta.contador', { count, max })}
    />
  );

  function switchToText() {
    turn.clearAudioRejection();
    recorder.discard();
    setTextTurns((current) => ({ ...current, [turnId]: true }));
  }

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

          {answersByVoice ? (
            <>
              <VoiceAnswerComposer
                step={voiceStep}
                elapsedLabel={`${clock(recorder.elapsedSeconds)} / ${clock(MAX_RECORDING_SECONDS)}`}
                isSubmitting={turn.isSubmitting}
                showLongWait={longWaitSend === audioSends}
                showPrivacyNotice={!hasRecorded}
                showSwitchToText={!vadFailed}
                notice={voiceNotice}
                labels={{
                  record:
                    turn.audioRejection === 'noTranscrita'
                      ? t('interview:sesion.voz.grabarDeNuevo')
                      : t('interview:sesion.voz.grabar'),
                  stop: t('interview:sesion.voz.detener'),
                  send: t('interview:sesion.enviar'),
                  switchToText: t('interview:sesion.voz.responderPorTexto'),
                  privacy: t('interview:sesion.voz.privacidad'),
                  longWait: t('interview:sesion.voz.esperaLarga'),
                }}
                onRecord={() => {
                  turn.clearAudioRejection();
                  void recorder.start();
                }}
                onStop={recorder.stop}
                onSend={sendAudio}
                onSwitchToText={switchToText}
              />
              {vadFailed ? textComposer : null}
            </>
          ) : (
            <>
              {voiceUnavailable && entry.answerFormat === 'AUDIO' && !textTurns[turnId] ? (
                <AlertInline variant="warning">{unavailableMessage}</AlertInline>
              ) : null}
              {textComposer}
            </>
          )}
        </div>
      ) : null}
    </SessionStage>
  );
}
