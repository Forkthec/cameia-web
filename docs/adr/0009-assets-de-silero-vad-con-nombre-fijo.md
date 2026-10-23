# 0009 · Los archivos de Silero VAD se sirven desde el mismo dominio, con nombre fijo

- **Estado:** Aceptada
- **Fecha:** 23-oct-2026
- **Decide:** Frontend (Juan José Arias Chacua), autor del spike CM-316 (D2 en
  `docs/decisiones/23102026_v1_decisiones-spike-cm316-hu-5-8.md`). Las dependencias las aprobó el
  PO el 23-oct-2026 (mismo archivo).
- **Ticket:** CM-317

## Contexto

La detección de voz de HU-5.8 usa `@ricky0123/vad-web` 0.0.31 con `onnxruntime-web` 1.22.0
(`CLAUDE.md` §2). Para funcionar necesita cuatro archivos que el paquete no incluye en el bundle:

| Archivo | Tamaño | Origen en `node_modules` |
| ------- | ------ | ------------------------ |
| `silero_vad_v5.onnx` | 2 327 524 B | `@ricky0123/vad-web/dist/` |
| `vad.worklet.bundle.min.js` | 2 480 B | `@ricky0123/vad-web/dist/` |
| `ort-wasm-simd-threaded.wasm` | 11 210 254 B (2,9 MB comprimidos según Vite) | `onnxruntime-web/dist/` |
| `ort-wasm-simd-threaded.mjs` | 20 856 B | `onnxruntime-web/dist/` |

Ni MicVAD ni ORT reciben URLs completas: **arman la ruta concatenando un nombre fijo a una
carpeta base**. `real-time-vad.js:36-41` fija los nombres, `:355` arma el modelo como
`baseAssetPath + "silero_vad_v5.onnx"`, `:240` el worklet como
`baseAssetPath + "vad.worklet.bundle.min.js"` y `:351` asigna `ort.env.wasm.wasmPaths =
onnxWASMBasePath` (ORT añade el nombre del `.wasm` y del `.mjs`). Por defecto ambas carpetas son
`"./"` (`:58-59`). Vite, en cambio, emite los assets con hash (`silero_vad_v5-Dt9-bTDn.onnx`),
y con ese nombre MicVAD no los encuentra. Comprobado con un `vite build` de prueba fuera del
repositorio.

Hoy no hay `public/` ni reglas de assets en `vite.config.ts`, y no hay CSP (ni en `index.html` ni
en `firebase.json`).

## Decisión

Los cuatro archivos se sirven desde el mismo dominio, como assets de Vite, importados con `?url`
desde **un solo módulo de `interview-session`**. `build.rolldownOptions.output.assetFileNames`,
en `vite.config.ts`, conserva el nombre exacto **solo de esos cuatro archivos** en una carpeta
fija (`vad/`); todos los demás assets siguen con hash. `baseAssetPath` y `onnxWASMBasePath` se
derivan de las URLs importadas. Sin plugin ni dependencia nueva.

## Alternativas descartadas

- **CDN con versión fija.** Si Dependabot sube `onnxruntime-web` (`CLAUDE.md` §2), el `.wasm` y
  el `.mjs` del CDN quedarían en una versión distinta de la que enlaza el código, sin ningún
  error visible. Además, mete a un tercero en la ruta de la respuesta por voz, y una CSP futura
  tendría que permitir ese dominio.
- **Copiar los archivos a `public/` con un script.** Hay que tocar los scripts de `package.json`
  y mantener a mano la sincronía entre `node_modules` y `public/`: una versión nueva de la
  librería dejaría copias desactualizadas hasta que alguien lo note.
- **`vite-plugin-static-copy`.** Resuelve lo anterior, pero es una dependencia nueva y
  `CLAUDE.md` §2 exige permiso previo.

## Consecuencias

- Cambia `vite.config.ts` (hoy sin reglas de assets): una función `assetFileNames` con los
  cuatro nombres. Es la primera vez que el proyecto sale del hash en un asset.
- Se sirven unos 2,9 MB comprimidos solo del `.wasm` (cifra de Vite) más el modelo de 2,3 MB.
  **No comprobado** si Firebase Hosting los comprime al servir ni cuánto se descarga en total.
- Sin hash en el nombre, tras subir de versión una de las dos librerías puede quedar una copia
  vieja en la caché del navegador o de la CDN de Firebase. **No comprobado** qué cabeceras de
  caché pone Hosting para esos archivos.
- Si falta alguno de los cuatro archivos, Firebase responde `index.html` por el rewrite `**`
  (`firebase.json`), con estado 200: el error de carga sería un fallo de análisis del modelo o
  del worklet, no un 404. Eso alimenta D3 (MicVAD no carga). **No comprobado.**
- Comprobado: un `vite build` de prueba (Vite 8.2.2, fuera del repositorio) emitió los cuatro
  archivos con nombre exacto en `vad/` y el resto con hash. **No comprobado:** `pnpm dev` (rutas
  `/@fs/…`, worklet, `import()` del `.mjs`), la carga en un navegador real, ni que `?url` pueda
  apuntar a `onnxruntime-web/dist/…` desde `src/` (el `exports` del paquete no expone esas rutas;
  la prueba usó rutas de archivo).
- En las pruebas el módulo de los assets se simula (jsdom no carga WebAssembly ni worklets).
- Si un navegador pasa a servir el `.wasm` con hilos (`crossOriginIsolated`) hará falta COOP/COEP,
  que hoy no existen. **No comprobado** si ORT lo necesita; sin ellos corre en un solo hilo.
- Revisor sugerido del PR: Juan Diego Gómez Garcés (DevOps), por el cambio en la salida del build.
