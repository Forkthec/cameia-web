/**
 * Grabación de la respuesta por voz en el navegador (HU-5.8), con la voz mínima medida por
 * Silero VAD (MicVAD v5, notas técnicas de HU-5.8, O75, backlog v8.4).
 *
 * - **Formato.** Antes de pedir el micrófono busca, en orden, `audio/webm;codecs=opus`,
 *   `audio/webm` y `audio/mp4;codecs=aac`; nunca `audio/mp4` sin códec, porque Chrome y Edge
 *   lo aceptan pero graban Opus. Sin tipo admitido, o si el `mimeType` real del grabador no es
 *   WebM/Opus ni MP4/AAC, no se graba ni se envía: `unsupported`.
 * - **Micrófono.** `getUserMedia({ audio: true })`; `NotFoundError` → `noMicrophone`
 *   (CA-5.8.23) y cualquier otro error → `denied` (CA-5.8.3), sin cargar MicVAD.
 * - **Orden de arranque (CM-316 D4).** MicVAD se crea sobre el mismo stream y arranca antes que
 *   `MediaRecorder`: el estado pasa a `recording` solo cuando los dos ya arrancaron (CA-5.8.2).
 *   Si MicVAD no carga o no arranca → `vadFailed` (CA-5.8.25, CM-316 D3), sin otra medición de
 *   voz en su lugar; «Grabar» vuelve a intentarlo.
 * - **Voz mínima.** Cada tramo de 32 ms con voz suma uno; al detener, con menos de 62 tramos
 *   (1,984 s) descarta la grabación y queda `noVoice` (CA-5.8.9 a CA-5.8.11). El backend revalida
 *   con 1,5 s de tolerancia.
 * - **Tope de 3 minutos (CA-5.8.7, CM-316 D6).** Se mide con `performance.now()` desde el
 *   arranque del grabador; el intervalo solo refresca la etiqueta, así que un temporizador
 *   frenado (pestaña en segundo plano) no alarga la grabación.
 * - **Liberación (SPEC §7).** Cada intento lleva un número: tras cada `await`, si se descartó o
 *   se desmontó, libera lo que ese intento abrió y no graba. `destroy()` de MicVAD solo se llama
 *   tras un `start()` exitoso, porque lanza si MicVAD nunca arrancó. MicVAD crea su propio
 *   `AudioContext`; el hook no abre uno.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MicVAD } from '@ricky0123/vad-web';
import { MAX_RECORDING_SECONDS, MIN_VOICE_SECONDS } from '../model/interviewSession.constants';
import { createSileroVad } from './sileroVad';

/** Duración de un tramo del modelo v5: 512 muestras a 16 kHz. */
const SPEECH_FRAME_MS = 32;
/** 62 tramos = 1,984 s: acepta 2,0 s (CA-5.8.9) y rechaza 1,9 s (CA-5.8.10). */
const MIN_SPEECH_FRAMES = Math.floor((MIN_VOICE_SECONDS * 1000) / SPEECH_FRAME_MS);
const LABEL_REFRESH_MS = 250;

const REQUESTED_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4;codecs=aac'];

export type RecorderStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'stopped'
  | 'noVoice'
  | 'denied'
  | 'noMicrophone'
  | 'vadFailed'
  | 'unsupported';

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return REQUESTED_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * WebM sin códec cuenta como Opus, que es lo que graban los navegadores en WebM. La cadena que
 * reporta un MP4/AAC no está comprobada (SPEC §7, «Formatos»): se acepta `aac` o `mp4a.*`.
 */
function isAcceptedMimeType(mimeType: string): boolean {
  const [container = '', ...params] = mimeType
    .toLowerCase()
    .split(';')
    .map((part) => part.trim());
  const codecs =
    params
      .find((param) => param.startsWith('codecs='))
      ?.slice('codecs='.length)
      .replaceAll('"', '') ?? '';
  if (container === 'audio/webm') return codecs === '' || codecs === 'opus';
  if (container === 'audio/mp4') return codecs === 'aac' || codecs.startsWith('mp4a');
  return false;
}

function stopTracks(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

function destroyVad(vad: MicVAD) {
  // Liberar no debe romper la pantalla si el worklet ya se había cerrado.
  void vad.destroy().catch(() => undefined);
}

/**
 * @returns el estado de la grabación, los segundos grabados, el audio listo para enviar (o
 *   `null`) y las acciones `start`, `stop` y `discard`.
 */
export function useVoiceRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audio, setAudio] = useState<Blob | null>(null);
  /** Intento vigente; descartar o desmontar lo invalida. */
  const attemptRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  /** Solo un MicVAD que ya arrancó: es el único al que se le puede llamar `destroy()`. */
  const vadRef = useRef<MicVAD | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const speechFramesRef = useRef(0);
  const chunksRef = useRef<Blob[]>([]);

  const releaseDevices = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (streamRef.current) stopTracks(streamRef.current);
    streamRef.current = null;
    if (vadRef.current) destroyVad(vadRef.current);
    vadRef.current = null;
  }, []);

  /** Detiene el grabador sin producir audio ni estado. */
  const cancelRecorder = useCallback(() => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) return;
    recorder.onstop = null;
    if (recorder.state !== 'inactive') recorder.stop();
  }, []);

  useEffect(
    () => () => {
      attemptRef.current += 1;
      cancelRecorder();
      releaseDevices();
    },
    [cancelRecorder, releaseDevices],
  );

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    attemptRef.current += 1;
    const attempt = attemptRef.current;
    const isCurrent = () => attempt === attemptRef.current;
    setAudio(null);
    setElapsedSeconds(0);
    speechFramesRef.current = 0;
    chunksRef.current = [];

    const mimeType = pickMimeType();
    if (!mimeType) {
      setStatus('unsupported');
      return;
    }
    setStatus('requesting');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      if (!isCurrent()) return;
      const name = error instanceof DOMException ? error.name : '';
      setStatus(name === 'NotFoundError' ? 'noMicrophone' : 'denied');
      return;
    }
    // Un intento descartado solo libera lo suyo: los refs pueden ser ya de otro intento.
    if (!isCurrent()) {
      stopTracks(stream);
      return;
    }
    streamRef.current = stream;

    let vad: MicVAD;
    try {
      vad = await createSileroVad(stream, () => {
        if (isCurrent()) speechFramesRef.current += 1;
      });
      if (!isCurrent()) {
        stopTracks(stream);
        return;
      }
      await vad.start();
    } catch {
      if (!isCurrent()) {
        stopTracks(stream);
        return;
      }
      releaseDevices();
      setStatus('vadFailed');
      return;
    }
    if (!isCurrent()) {
      stopTracks(stream);
      destroyVad(vad);
      return;
    }
    vadRef.current = vad;

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch {
      releaseDevices();
      setStatus('unsupported');
      return;
    }
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      recorderRef.current = null;
      releaseDevices();
      if (speechFramesRef.current < MIN_SPEECH_FRAMES) {
        chunksRef.current = [];
        setStatus('noVoice');
        return;
      }
      setAudio(new Blob(chunksRef.current, { type: recorder.mimeType }));
      setStatus('stopped');
    };

    // La voz se cuenta sobre el mismo audio que se graba, no desde que arrancó MicVAD.
    speechFramesRef.current = 0;
    recorder.start();
    // El `mimeType` real se conoce al arrancar: puede no ser el pedido (Opus dentro de MP4).
    if (!isAcceptedMimeType(recorder.mimeType)) {
      cancelRecorder();
      releaseDevices();
      chunksRef.current = [];
      setStatus('unsupported');
      return;
    }

    const startedAt = performance.now();
    timerRef.current = window.setInterval(() => {
      const seconds = Math.min(
        MAX_RECORDING_SECONDS,
        Math.floor((performance.now() - startedAt) / 1000),
      );
      setElapsedSeconds(seconds);
      if (seconds >= MAX_RECORDING_SECONDS) stop();
    }, LABEL_REFRESH_MS);
    setStatus('recording');
  }, [cancelRecorder, releaseDevices, stop]);

  const discard = useCallback(() => {
    attemptRef.current += 1;
    cancelRecorder();
    releaseDevices();
    chunksRef.current = [];
    setAudio(null);
    setStatus('idle');
  }, [cancelRecorder, releaseDevices]);

  return { status, elapsedSeconds, audio, start, stop, discard };
}
