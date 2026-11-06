/**
 * Contrato de `createSileroVad` con MicVAD simulado (jsdom no carga WebAssembly ni worklets):
 * las opciones de `MicVAD.new` de SPEC §7, «Detección de voz» (`model: 'v5'`,
 * `startOnLoad: false`, el stream propio en `getStream` y un `pauseStream` que no detiene las
 * pistas), el umbral de `isSpeech` ≥ 0,3 que cuenta un tramo con voz (notas técnicas de HU-5.8,
 * base de CA-5.8.9 a 5.8.11) y que un fallo de `MicVAD.new` llegue al hook para el estado
 * `vadFailed` (CA-5.8.25).
 */
import type { MicVAD, RealTimeVADOptions } from '@ricky0123/vad-web';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSileroVad } from './sileroVad';

const { micVadNew } = vi.hoisted(() => ({ micVadNew: vi.fn<typeof MicVAD.new>() }));

vi.mock('@ricky0123/vad-web', () => ({
  MicVAD: { new: micVadNew },
}));

function createStream() {
  const track = { stop: vi.fn() };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  return { stream, track };
}

async function createAndGetOptions(stream: MediaStream, onSpeechFrame = vi.fn()) {
  await createSileroVad(stream, onSpeechFrame);
  return micVadNew.mock.calls[0]?.[0] as Partial<RealTimeVADOptions>;
}

describe('createSileroVad', () => {
  beforeEach(() => {
    micVadNew.mockReset();
    micVadNew.mockResolvedValue({} as MicVAD);
  });

  it('crea MicVAD con el modelo v5 y sin arrancar al cargar', async () => {
    const { stream } = createStream();
    const options = await createAndGetOptions(stream);

    expect(options.model).toBe('v5');
    expect(options.startOnLoad).toBe(false);
  });

  it('entrega a MicVAD el mismo stream del micrófono', async () => {
    const { stream } = createStream();
    const options = await createAndGetOptions(stream);

    await expect(options.getStream?.()).resolves.toBe(stream);
  });

  it('no detiene las pistas del stream cuando MicVAD pausa', async () => {
    const { stream, track } = createStream();
    const options = await createAndGetOptions(stream);

    await options.pauseStream?.(stream);

    expect(track.stop).not.toHaveBeenCalled();
  });

  it('cuenta un tramo con voz cuando isSpeech llega a 0,3', async () => {
    const { stream } = createStream();
    const onSpeechFrame = vi.fn();
    const options = await createAndGetOptions(stream, onSpeechFrame);

    await options.onFrameProcessed?.({ isSpeech: 0.3, notSpeech: 0.7 }, new Float32Array());

    expect(onSpeechFrame).toHaveBeenCalledTimes(1);
  });

  it('no cuenta el tramo cuando isSpeech es 0,29', async () => {
    const { stream } = createStream();
    const onSpeechFrame = vi.fn();
    const options = await createAndGetOptions(stream, onSpeechFrame);

    await options.onFrameProcessed?.({ isSpeech: 0.29, notSpeech: 0.71 }, new Float32Array());

    expect(onSpeechFrame).not.toHaveBeenCalled();
  });

  it('propaga el error cuando MicVAD.new lanza', async () => {
    const { stream } = createStream();
    const error = new Error('fallo al cargar el modelo');
    micVadNew.mockRejectedValue(error);

    await expect(createSileroVad(stream, vi.fn())).rejects.toBe(error);
  });
});
