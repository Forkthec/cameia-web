/**
 * Protege la grabación de la respuesta por voz (HU-5.8, backlog v8.4) en el hook, con el
 * navegador simulado: `./sileroVad` (MicVAD falso, jsdom no carga WebAssembly ni worklets; SPEC
 * §7, «Detección de voz»), `getUserMedia`, `MediaRecorder` y el reloj. Cubre las filas «Hook» del
 * plan de SPEC §6: grabar con el micrófono permitido y el orden de arranque MicVAD → grabador
 * (CA-5.8.2, CM-316 D4); permiso negado (CA-5.8.3) y sin micrófono (CA-5.8.23) sin cargar MicVAD;
 * detener con el `mimeType` real (CA-5.8.4); tope de 3:00 medido con `performance.now`
 * (CA-5.8.7, CM-316 D6); voz mínima de 62 tramos de 32 ms con 62, 59 y 0 tramos (CA-5.8.9 a
 * 5.8.11, notas técnicas de HU-5.8, O75); fallo de MicVAD (CA-5.8.25, CM-316 D3); formatos
 * admitidos (notas técnicas de HU-5.8); `destroy` solo tras un `start` exitoso y la cancelación
 * en `requesting` (SPEC §7, «Liberación»; defectos de §9).
 *
 * En Vitest 4.1 `vi.useFakeTimers()` sí controla `performance.now` (comprobado el 24-10-2026),
 * pero avanza a la par con los temporizadores. La prueba del tope simula además `performance.now`
 * para separar el reloj de los ticks: así distingue el reloj real de contar ticks o de `Date.now`.
 */
import type { MicVAD } from '@ricky0123/vad-web';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createSileroVad } from './sileroVad';
import { useVoiceRecorder } from './useVoiceRecorder';

vi.mock('./sileroVad', () => ({ createSileroVad: vi.fn() }));

const createSileroVadMock = vi.mocked(createSileroVad);

const ALL_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4;codecs=aac', 'audio/mp4'];

/** Orden en que ocurren los pasos del arranque (CM-316 D4). */
let events: string[] = [];
/** Tipos que `MediaRecorder.isTypeSupported` acepta en cada prueba. */
let supportedTypes: string[] = [];
/** `mimeType` que el grabador reporta al arrancar; `null` = el pedido. */
let realMimeType: string | null = null;

class FakeMediaRecorder extends EventTarget {
  static isTypeSupported = vi.fn((type: string) => supportedTypes.includes(type));
  static instances: FakeMediaRecorder[] = [];

  state: RecordingState = 'inactive';
  mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstart: ((event: Event) => void) | null = null;
  onstop: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(
    readonly stream: MediaStream,
    readonly options?: MediaRecorderOptions,
  ) {
    super();
    this.mimeType = options?.mimeType ?? '';
    FakeMediaRecorder.instances.push(this);
  }

  // Como en el navegador, el `mimeType` definitivo se conoce al arrancar (SPEC §7, «Formatos»).
  start = vi.fn(() => {
    events.push('recorder.start');
    this.mimeType = realMimeType ?? this.mimeType;
    this.state = 'recording';
    this.emit('start', new Event('start'));
  });

  stop = vi.fn(() => {
    if (this.state === 'inactive') return;
    this.state = 'inactive';
    const data = new Blob(['audio'], { type: this.mimeType });
    this.emit('dataavailable', Object.assign(new Event('dataavailable'), { data }));
    this.emit('stop', new Event('stop'));
  });

  private emit(type: 'start' | 'dataavailable' | 'stop', event: Event) {
    const handler = this[`on${type}`] as ((event: Event) => void) | null;
    handler?.(event);
    this.dispatchEvent(event);
  }
}

/** Si el hook crea su propio `AudioContext` (medición por energía), esta simulación lo registra. */
const AudioContextSpy = vi.fn(function FakeAudioContext() {
  return {
    createAnalyser: () => ({ fftSize: 0, getFloatTimeDomainData: () => undefined }),
    createMediaStreamSource: () => ({ connect: () => undefined }),
    close: () => Promise.resolve(),
  };
});

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

function createFakeVad() {
  return {
    start: vi.fn(() => {
      events.push('vad.start');
      return Promise.resolve();
    }),
    pause: vi.fn(() => Promise.resolve()),
    destroy: vi.fn(() => Promise.resolve()),
  };
}

let track: { stop: Mock<MediaStreamTrack['stop']> };
let stream: MediaStream;
let getUserMedia: Mock<MediaDevices['getUserMedia']>;
let vad: ReturnType<typeof createFakeVad>;

function startedRecorders() {
  return FakeMediaRecorder.instances.filter((recorder) => recorder.start.mock.calls.length > 0);
}

function renderRecorder() {
  return renderHook(() => useVoiceRecorder());
}

type RecorderResult = ReturnType<typeof renderRecorder>['result'];

async function startRecording(result: RecorderResult) {
  await act(async () => {
    await result.current.start();
  });
}

/** Simula `frames` tramos de 32 ms con `isSpeech` ≥ 0,3 (el umbral lo aplica `sileroVad`). */
function speak(frames: number) {
  const onSpeechFrame = createSileroVadMock.mock.calls.at(-1)?.[1];
  if (!onSpeechFrame) throw new Error('El hook no creó MicVAD con createSileroVad');
  act(() => {
    for (let frame = 0; frame < frames; frame += 1) onSpeechFrame();
  });
}

async function stopRecording(result: RecorderResult) {
  await act(() => {
    result.current.stop();
    return Promise.resolve();
  });
}

describe('useVoiceRecorder', () => {
  beforeEach(() => {
    events = [];
    supportedTypes = [...ALL_TYPES];
    realMimeType = null;
    FakeMediaRecorder.instances = [];
    FakeMediaRecorder.isTypeSupported.mockClear();
    AudioContextSpy.mockClear();

    track = { stop: vi.fn<MediaStreamTrack['stop']>() };
    stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream;
    getUserMedia = vi.fn<MediaDevices['getUserMedia']>(() => {
      events.push('getUserMedia');
      return Promise.resolve(stream);
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });

    vad = createFakeVad();
    createSileroVadMock.mockReset();
    createSileroVadMock.mockImplementation(() => {
      events.push('createSileroVad');
      return Promise.resolve(vad as unknown as MicVAD);
    });

    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    vi.stubGlobal('AudioContext', AudioContextSpy);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('arranca MicVAD con el mismo stream antes que el grabador y queda grabando (CA-5.8.2)', async () => {
    const { result } = renderRecorder();

    await startRecording(result);

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(createSileroVadMock).toHaveBeenCalledWith(stream, expect.any(Function));
    expect(events).toEqual(['getUserMedia', 'createSileroVad', 'vad.start', 'recorder.start']);
    expect(FakeMediaRecorder.instances[0]?.stream).toBe(stream);
    expect(result.current.status).toBe('recording');
  });

  it('sigue en requesting y no arranca el grabador mientras MicVAD no termina de arrancar (CM-316 D4)', async () => {
    const vadStart = createDeferred<void>();
    vad.start.mockImplementation(() => {
      events.push('vad.start');
      return vadStart.promise;
    });
    const { result } = renderRecorder();

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.start();
    });
    await waitFor(() => expect(vad.start).toHaveBeenCalled());

    expect(result.current.status).toBe('requesting');
    expect(startedRecorders()).toHaveLength(0);

    await act(async () => {
      vadStart.resolve();
      await pending;
    });
    expect(result.current.status).toBe('recording');
  });

  it('no crea un AudioContext propio: la voz la mide MicVAD (SPEC §7, «Liberación»)', async () => {
    const { result } = renderRecorder();

    await startRecording(result);

    expect(AudioContextSpy).not.toHaveBeenCalled();
  });

  it.each(['NotAllowedError', 'SecurityError'])(
    'con el permiso negado (%s) queda en denied sin cargar MicVAD (CA-5.8.3)',
    async (errorName) => {
      getUserMedia.mockRejectedValue(new DOMException('sin permiso', errorName));
      const { result } = renderRecorder();

      await startRecording(result);

      expect(result.current.status).toBe('denied');
      expect(createSileroVadMock).not.toHaveBeenCalled();
      expect(FakeMediaRecorder.instances).toHaveLength(0);
    },
  );

  it('sin micrófono queda en noMicrophone sin cargar MicVAD (CA-5.8.23)', async () => {
    getUserMedia.mockRejectedValue(new DOMException('sin dispositivo', 'NotFoundError'));
    const { result } = renderRecorder();

    await startRecording(result);

    expect(result.current.status).toBe('noMicrophone');
    expect(createSileroVadMock).not.toHaveBeenCalled();
    expect(FakeMediaRecorder.instances).toHaveLength(0);
  });

  it('al detener con voz suficiente conserva el audio con el tipo real del grabador (CA-5.8.4)', async () => {
    supportedTypes = ['audio/webm'];
    realMimeType = 'audio/webm;codecs=opus';
    const { result } = renderRecorder();

    await startRecording(result);
    speak(62);
    await stopRecording(result);

    expect(FakeMediaRecorder.instances[0]?.options?.mimeType).toBe('audio/webm');
    expect(result.current.status).toBe('stopped');
    expect(result.current.audio).toBeInstanceOf(Blob);
    expect(result.current.audio?.type).toBe('audio/webm;codecs=opus');
  });

  it('con 62 tramos de voz (1,984 s) habilita «Enviar» (CA-5.8.9)', async () => {
    const { result } = renderRecorder();

    await startRecording(result);
    speak(62);
    await stopRecording(result);

    expect(result.current.status).toBe('stopped');
    expect(result.current.audio).not.toBeNull();
  });

  it('con 59 tramos de voz (1,9 s) queda en noVoice sin audio (CA-5.8.10)', async () => {
    const { result } = renderRecorder();

    await startRecording(result);
    speak(59);
    await stopRecording(result);

    expect(result.current.status).toBe('noVoice');
    expect(result.current.audio).toBeNull();
  });

  it('sin voz queda en noVoice (CA-5.8.11)', async () => {
    const { result } = renderRecorder();

    await startRecording(result);
    speak(0);
    await stopRecording(result);

    expect(result.current.status).toBe('noVoice');
    expect(result.current.audio).toBeNull();
  });

  it('a los 3:00 medidos con el reloj se detiene sola y habilita «Enviar» (CA-5.8.7)', async () => {
    vi.useFakeTimers();
    // El reloj salta sin que los temporizadores avancen igual (pestaña en segundo plano):
    // contar ticks o leer `Date.now` daría 2 s, no 3:00 (CM-316 D6).
    let clockMs = 1_000;
    vi.spyOn(performance, 'now').mockImplementation(() => clockMs);
    const { result } = renderRecorder();

    await startRecording(result);
    speak(62);

    clockMs = 1_000 + 179_999;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(result.current.status).toBe('recording');

    clockMs = 1_000 + 180_000;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(result.current.status).toBe('stopped');
    expect(result.current.elapsedSeconds).toBe(180);
    expect(result.current.audio).not.toBeNull();
  });

  it('si MicVAD no carga queda en vadFailed y libera el micrófono (CA-5.8.25)', async () => {
    createSileroVadMock.mockRejectedValue(new Error('no cargó el modelo'));
    const { result } = renderRecorder();

    await startRecording(result);

    expect(createSileroVadMock).toHaveBeenCalled();
    expect(result.current.status).toBe('vadFailed');
    expect(track.stop).toHaveBeenCalled();
    expect(FakeMediaRecorder.instances).toHaveLength(0);
  });

  it('si MicVAD no arranca queda en vadFailed sin llamar a destroy (CA-5.8.25)', async () => {
    vad.start.mockRejectedValue(new Error('no arrancó el worklet'));
    const { result } = renderRecorder();

    await startRecording(result);

    expect(vad.start).toHaveBeenCalled();
    expect(result.current.status).toBe('vadFailed');
    expect(vad.destroy).not.toHaveBeenCalled();
    expect(track.stop).toHaveBeenCalled();
    expect(startedRecorders()).toHaveLength(0);
  });

  it('tras vadFailed, «Grabar» vuelve a preparar la grabación (CA-5.8.25)', async () => {
    createSileroVadMock.mockRejectedValueOnce(new Error('no cargó el modelo'));
    const { result } = renderRecorder();

    await startRecording(result);
    expect(result.current.status).toBe('vadFailed');

    await startRecording(result);
    expect(createSileroVadMock).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('recording');
  });

  it('al detener libera el micrófono y destruye MicVAD una sola vez tras un start exitoso', async () => {
    const { result } = renderRecorder();

    await startRecording(result);
    speak(62);
    await stopRecording(result);

    expect(vad.start).toHaveBeenCalledTimes(1);
    expect(vad.destroy).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalled();
  });

  it('sin un tipo admitido queda en unsupported sin pedir el micrófono', async () => {
    supportedTypes = [];
    const { result } = renderRecorder();

    await startRecording(result);

    expect(result.current.status).toBe('unsupported');
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(createSileroVadMock).not.toHaveBeenCalled();
  });

  it('consulta los formatos en orden y nunca pide audio/mp4 sin códec', async () => {
    supportedTypes = ['audio/mp4'];
    const { result } = renderRecorder();

    await startRecording(result);

    expect(FakeMediaRecorder.isTypeSupported.mock.calls.map(([type]) => type)).toEqual([
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=aac',
    ]);
    expect(result.current.status).toBe('unsupported');
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(FakeMediaRecorder.instances).toHaveLength(0);
  });

  it('con un mimeType real no admitido descarta y queda en unsupported', async () => {
    // Chrome y Edge aceptan MP4 pero graban Opus dentro (notas técnicas de HU-5.8).
    realMimeType = 'audio/mp4;codecs=opus';
    const { result } = renderRecorder();

    await startRecording(result);

    expect(result.current.status).toBe('unsupported');
    expect(result.current.audio).toBeNull();
    expect(FakeMediaRecorder.instances[0]?.state).toBe('inactive');
    expect(track.stop).toHaveBeenCalled();
    expect(vad.destroy).toHaveBeenCalledTimes(1);
  });

  describe.each([
    ['getUserMedia', () => getUserMedia],
    ['createSileroVad', () => createSileroVadMock],
    ['vad.start', () => vad.start],
  ] as const)('cancellation while requesting (%s)', (step, stepMock) => {
    /** Deja pendiente el paso `step` del arranque y devuelve cómo resolverlo. */
    function holdStep() {
      const deferred = createDeferred<void>();
      if (step === 'getUserMedia') {
        getUserMedia.mockImplementation(() => deferred.promise.then(() => stream));
      } else if (step === 'createSileroVad') {
        createSileroVadMock.mockImplementation(() =>
          deferred.promise.then(() => vad as unknown as MicVAD),
        );
      } else {
        vad.start.mockImplementation(() => deferred.promise);
      }
      return deferred;
    }

    function expectEverythingReleased() {
      expect(track.stop).toHaveBeenCalled();
      expect(startedRecorders()).toHaveLength(0);
      if (step === 'getUserMedia') expect(createSileroVadMock).not.toHaveBeenCalled();
      if (step !== 'vad.start') expect(vad.start).not.toHaveBeenCalled();
      // `destroy` solo tras un `start` exitoso (SPEC §7, «Liberación»).
      expect(vad.destroy).toHaveBeenCalledTimes(step === 'vad.start' ? 1 : 0);
    }

    it('descartar mientras se prepara libera el micrófono y no graba', async () => {
      const deferred = holdStep();
      const { result } = renderRecorder();

      let pending: Promise<void> = Promise.resolve();
      act(() => {
        pending = result.current.start();
      });
      await waitFor(() => expect(stepMock()).toHaveBeenCalled());
      act(() => result.current.discard());
      await act(async () => {
        deferred.resolve();
        await pending;
      });

      expect(result.current.status).toBe('idle');
      expectEverythingReleased();
    });

    it('desmontar mientras se prepara libera el micrófono', async () => {
      const deferred = holdStep();
      const { result, unmount } = renderRecorder();

      let pending: Promise<void> = Promise.resolve();
      act(() => {
        pending = result.current.start();
      });
      await waitFor(() => expect(stepMock()).toHaveBeenCalled());
      unmount();
      await act(async () => {
        deferred.resolve();
        await pending;
      });

      expectEverythingReleased();
    });
  });
});
