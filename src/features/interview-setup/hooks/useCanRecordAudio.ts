/**
 * Detecta si el navegador soporta grabacion de audio en un formato admitido
 * (WebM/Opus o MP4/AAC). Si no, el paso de forma de respuesta deshabilita
 * Audio y preselecciona Texto (CA-4.3.7).
 */
import { useMemo } from 'react';

export function useCanRecordAudio(): boolean {
  return useMemo(() => {
    if (typeof MediaRecorder === 'undefined') return false;
    return (
      MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ||
      MediaRecorder.isTypeSupported('audio/mp4;codecs=aac') ||
      MediaRecorder.isTypeSupported('audio/webm') ||
      MediaRecorder.isTypeSupported('audio/mp4')
    );
  }, []);
}
