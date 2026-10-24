/**
 * Único punto de entrada a Silero VAD (`@ricky0123/vad-web`) en la aplicación.
 *
 * Encierra dos decisiones. CLAUDE.md §2: `vad-web` y `onnxruntime-web` solo se cargan en una
 * entrevista por voz, al pulsar «Grabar»; por eso `vad-web` entra con `import()` dentro de
 * `createSileroVad` y nunca con un import estático. ADR-0009: MicVAD y ORT arman la ruta de sus
 * cuatro archivos concatenando un nombre fijo a una carpeta; aquí se importan con `?url`
 * (`vite.config.ts` los deja sin hash en `vad/`) y las carpetas se derivan de esas URLs. El
 * worklet lleva `no-inline` porque pesa menos que `assetsInlineLimit` (4 KiB) y Vite lo
 * convertiría en una URL `data:`. Los de ORT van por ruta relativa a `node_modules` porque el
 * `exports` de `onnxruntime-web` no expone `dist/`; esa ruta existe solo porque
 * `onnxruntime-web` es dependencia directa en `package.json`, y no se quita de ahí aunque
 * `vad-web` ya la arrastre. En las pruebas este módulo se simula: jsdom no carga WebAssembly ni
 * worklets (SPEC §7, «Detección de voz»).
 */
import type { MicVAD } from '@ricky0123/vad-web';
import sileroModelUrl from '@ricky0123/vad-web/dist/silero_vad_v5.onnx?url';
import vadWorkletUrl from '@ricky0123/vad-web/dist/vad.worklet.bundle.min.js?url&no-inline';
import ortGlueUrl from '../../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url';
import ortWasmUrl from '../../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url';

/** Probabilidad desde la que un tramo de 32 ms cuenta como voz (SPEC §7, «Detección de voz»). */
const SPEECH_PROBABILITY_THRESHOLD = 0.3;

function folderOf(url: string): string {
  return url.slice(0, url.lastIndexOf('/') + 1);
}

/**
 * Crea MicVAD sobre el stream del micrófono, sin arrancarlo (`startOnLoad: false`).
 *
 * @param stream - El mismo stream que graba `MediaRecorder`; MicVAD no detiene sus pistas.
 * @param onSpeechFrame - Se llama una vez por cada tramo con `isSpeech` ≥ 0,3.
 * @returns La instancia de MicVAD. El hook llama a `start()` y, solo tras un `start` exitoso,
 *   a `destroy()` (SPEC §7, «Liberación»).
 * @throws Si falla el `import()`, si un archivo quedó fuera de su carpeta o si `MicVAD.new`
 *   lanza (estado `vadFailed`, CA-5.8.25).
 */
export async function createSileroVad(
  stream: MediaStream,
  onSpeechFrame: () => void,
): Promise<MicVAD> {
  const baseAssetPath = folderOf(sileroModelUrl);
  const onnxWASMBasePath = folderOf(ortWasmUrl);
  // MicVAD y ORT solo reciben carpetas (ADR-0009): un archivo en otra fallaría con un error opaco.
  if (folderOf(vadWorkletUrl) !== baseAssetPath || folderOf(ortGlueUrl) !== onnxWASMBasePath) {
    throw new Error('Los archivos de Silero VAD no comparten carpeta (ADR-0009).');
  }
  const { MicVAD } = await import('@ricky0123/vad-web');
  return MicVAD.new({
    model: 'v5',
    startOnLoad: false,
    baseAssetPath,
    onnxWASMBasePath,
    getStream: () => Promise.resolve(stream),
    // El de la librería detiene las pistas; el hook las libera por su cuenta.
    pauseStream: () => Promise.resolve(),
    resumeStream: () => Promise.resolve(stream),
    onFrameProcessed: (probabilities) => {
      if (probabilities.isSpeech >= SPEECH_PROBABILITY_THRESHOLD) onSpeechFrame();
    },
  });
}
