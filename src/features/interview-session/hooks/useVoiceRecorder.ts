/**
 * Grabación de la respuesta por voz en el navegador (HU-5.8).
 *
 * - Pide el micrófono con `getUserMedia`; `NotAllowedError` → `denied`
 *   (CA-5.8.3), `NotFoundError` → `noMicrophone` (CA-5.8.23).
 * - Graba con `MediaRecorder` en WebM/Opus o MP4/AAC, el que soporte el
 *   navegador, y se detiene sola a los 3 minutos (CA-5.8.7).
 * - Mide la voz detectada mientras graba. Al detener, con menos de 2 s de
 *   voz descarta la grabación y queda `noVoice` (CA-5.8.10, CA-5.8.11).
 *
 * **Detección de voz provisional.** El backlog pide Silero VAD (HU-5.14,
 * spike CM-316), que es una librería nueva y CLAUDE.md §2 no deja
 * instalarla sin permiso. Mientras se aprueba, se mide la energía de la
 * señal con la Web Audio API del navegador (sin dependencias): cuenta como
 * voz cada tramo por encima de un umbral. El backend revalida con 1,5 s de
 * tolerancia (CA-5.8.10), así que una diferencia de medición no rechaza un
 * audio que el navegador dejó enviar.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_RECORDING_SECONDS, MIN_VOICE_SECONDS } from '../model/interviewSession.constants';

/** Umbral de energía (RMS de 0 a 1) a partir del cual un tramo cuenta como voz. */
const VOICE_RMS_THRESHOLD = 0.02;
const SAMPLE_INTERVAL_MS = 100;

const SUPPORTED_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=aac',
  'audio/mp4',
];

export type RecorderStatus =
  'idle' | 'requesting' | 'recording' | 'stopped' | 'noVoice' | 'denied' | 'noMicrophone';

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return SUPPORTED_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * @returns el estado de la grabación, los segundos grabados, el audio listo
 *   para enviar (o `null`) y las acciones `start`, `stop` y `discard`.
 */
export function useVoiceRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audio, setAudio] = useState<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const voiceMsRef = useRef(0);
  const chunksRef = useRef<Blob[]>([]);

  const releaseDevices = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  useEffect(() => releaseDevices, [releaseDevices]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    setAudio(null);
    setElapsedSeconds(0);
    voiceMsRef.current = 0;
    chunksRef.current = [];
    setStatus('requesting');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      setStatus(name === 'NotFoundError' ? 'noMicrophone' : 'denied');
      return;
    }
    streamRef.current = stream;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      releaseDevices();
      if (voiceMsRef.current < MIN_VOICE_SECONDS * 1000) {
        chunksRef.current = [];
        setStatus('noVoice');
        return;
      }
      setAudio(new Blob(chunksRef.current, { type: recorder.mimeType || mimeType }));
      setStatus('stopped');
    };

    const startedAt = Date.now();
    timerRef.current = window.setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(
        samples.reduce((sum, value) => sum + value * value, 0) / samples.length,
      );
      if (rms >= VOICE_RMS_THRESHOLD) voiceMsRef.current += SAMPLE_INTERVAL_MS;
      const seconds = Math.min(MAX_RECORDING_SECONDS, Math.floor((Date.now() - startedAt) / 1000));
      setElapsedSeconds(seconds);
      if (seconds >= MAX_RECORDING_SECONDS) stop();
    }, SAMPLE_INTERVAL_MS);

    recorder.start();
    setStatus('recording');
  }, [releaseDevices, stop]);

  const discard = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    releaseDevices();
    chunksRef.current = [];
    setAudio(null);
    setStatus('idle');
  }, [releaseDevices]);

  return { status, elapsedSeconds, audio, start, stop, discard };
}
