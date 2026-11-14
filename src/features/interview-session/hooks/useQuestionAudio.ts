/**
 * Escuchar la pregunta mostrada (HU-5.15, CM-373).
 *
 * - Pide el audio con `fetchQuestionAudio` (Bearer del cliente), lo guarda como `Blob` en la
 *   memoria de la página y lo reproduce; repetir no vuelve a pedirlo ni gasta usos (CA-5.15.4).
 * - Lleva los usos que quedan: los del estado de la sesión o, en una pregunta nueva, todos
 *   (CA-5.15.1); cada audio recibido resta uno y `QUESTION_AUDIO_LIMIT_REACHED` los deja en 0
 *   (CA-5.15.6). Un fallo no resta (CA-5.15.8).
 * - Suena una sola pregunta a la vez y se puede detener (CA-5.15.2, WCAG 1.4.2).
 * - Con «Escuchar las preguntas automáticamente», pide y reproduce cada pregunta que aparece y
 *   aún no se escuchó; si el navegador bloquea el sonido o la voz falla, deja el mensaje y la
 *   casilla sigue marcada (CA-5.15.30).
 * - El botón queda deshabilitado mientras el audio se prepara (CA-5.15.27).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/services/http/ApiError';
import { fetchQuestionAudio } from '../api/interviewSession.api';
import { AUDIO_PLAYS_PER_QUESTION } from '../model/interviewSession.constants';
import {
  QUESTION_AUDIO_LIMIT_REACHED,
  QUESTION_NOT_AVAILABLE,
  SESSION_ABANDONED,
  SESSION_ALREADY_CLOSED,
  SESSION_TRANSITION_NOT_ALLOWED,
  SPEECH_BUSY,
  SPEECH_DISABLED,
  SPEECH_MONTHLY_LIMIT_REACHED,
  SPEECH_TEXT_EMPTY,
  SPEECH_TEXT_TOO_LONG,
  SPEECH_TIMEOUT,
} from '../model/interviewSession.errorCodes';
import type { InterviewQuestion } from '../model/interviewSession.types';

export type QuestionAudioStatus = 'idle' | 'loading' | 'playing';

/** Llave de i18n del mensaje bajo «Escuchar» (`interview:sesion.escuchar.errores.*`). */
export type QuestionAudioError =
  | 'limite'
  | 'demora'
  | 'fallo'
  | 'noDisponible'
  | 'ocupado'
  | 'noMostrada'
  | 'textoVacio'
  | 'noEncontrada'
  | 'abandonada'
  | 'noAdmite';

function toAudioError(error: unknown): QuestionAudioError {
  if (!(error instanceof ApiError)) return 'fallo';
  if (error.hasCode(QUESTION_AUDIO_LIMIT_REACHED)) return 'limite';
  if (error.hasCode(SPEECH_TIMEOUT)) return 'demora';
  if (error.hasCode(SPEECH_DISABLED, SPEECH_MONTHLY_LIMIT_REACHED)) return 'noDisponible';
  if (error.hasCode(SPEECH_BUSY)) return 'ocupado';
  if (error.hasCode(QUESTION_NOT_AVAILABLE)) return 'noMostrada';
  if (error.hasCode(SPEECH_TEXT_EMPTY, SPEECH_TEXT_TOO_LONG)) return 'textoVacio';
  if (error.hasCode(SESSION_ABANDONED)) return 'abandonada';
  if (error.hasCode(SESSION_ALREADY_CLOSED, SESSION_TRANSITION_NOT_ALLOWED)) return 'noAdmite';
  if (error.httpStatus === 404) return 'noEncontrada';
  return 'fallo';
}

/**
 * @param sessionId sesión en curso.
 * @param question pregunta mostrada.
 * @param autoListen si la casilla de escucha automática está marcada.
 * @returns estado, usos restantes, error y las acciones `play` / `stop`.
 */
export function useQuestionAudio(
  sessionId: string,
  question: InterviewQuestion,
  autoListen: boolean,
) {
  const [status, setStatus] = useState<QuestionAudioStatus>('idle');
  const [error, setError] = useState<QuestionAudioError | null>(null);
  const [remainingByQuestion, setRemainingByQuestion] = useState<Record<number, number>>({});
  const urls = useRef(new Map<number, string>());
  const player = useRef<HTMLAudioElement | null>(null);
  const autoPlayed = useRef(new Set<number>());
  const [cached, setCached] = useState<Record<number, true>>({});
  const [shownNumber, setShownNumber] = useState(question.number);

  const number = question.number;
  const remaining =
    remainingByQuestion[number] ?? question.audioPlaysRemaining ?? AUDIO_PLAYS_PER_QUESTION;

  const stop = useCallback(() => {
    player.current?.pause();
    player.current = null;
    setStatus('idle');
  }, []);

  const startPlayback = useCallback(async (url: string) => {
    player.current?.pause();
    const audio = new Audio(url);
    player.current = audio;
    audio.onended = () => {
      if (player.current === audio) {
        player.current = null;
        setStatus('idle');
      }
    };
    setStatus('playing');
    try {
      await audio.play();
    } catch {
      // El navegador bloqueó el sonido (escucha automática sin gesto): queda el botón.
      if (player.current === audio) player.current = null;
      setStatus('idle');
      setError('fallo');
    }
  }, []);

  const play = useCallback(async () => {
    setError(null);
    const cached = urls.current.get(number);
    if (cached) {
      await startPlayback(cached);
      return;
    }
    if (remaining <= 0) {
      setError('limite');
      return;
    }
    setStatus('loading');
    try {
      const blob = await fetchQuestionAudio(sessionId, number);
      const url = URL.createObjectURL(blob);
      urls.current.set(number, url);
      setCached((prev) => ({ ...prev, [number]: true }));
      setRemainingByQuestion((prev) => ({ ...prev, [number]: Math.max(0, remaining - 1) }));
      await startPlayback(url);
    } catch (failure) {
      const key = toAudioError(failure);
      if (key === 'limite') setRemainingByQuestion((prev) => ({ ...prev, [number]: 0 }));
      setStatus('idle');
      setError(key);
    }
  }, [number, remaining, sessionId, startPlayback]);

  // Una pregunta nueva empieza sin mensaje (patrón de React para ajustar estado al cambiar una prop).
  if (shownNumber !== number) {
    setShownNumber(number);
    setStatus('idle');
    setError(null);
  }

  // Y sin el audio de la anterior sonando.
  useEffect(
    () => () => {
      player.current?.pause();
      player.current = null;
    },
    [number],
  );

  useEffect(() => {
    if (!autoListen || autoPlayed.current.has(number)) return;
    // Solo una pregunta aún no escuchada: no repite sola las ya oídas (CA-5.15.30).
    if (remaining < AUDIO_PLAYS_PER_QUESTION) return;
    autoPlayed.current.add(number);
    const id = window.setTimeout(() => void play(), 0);
    return () => window.clearTimeout(id);
  }, [autoListen, number, remaining, play]);

  useEffect(() => {
    const cache = urls.current;
    return () => {
      player.current?.pause();
      cache.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  /** Se puede reproducir si quedan usos o el audio ya está en memoria (CA-5.15.4). */
  const canPlay = remaining > 0 || cached[number] === true;

  return { status, remaining, canPlay, error, play, stop };
}
