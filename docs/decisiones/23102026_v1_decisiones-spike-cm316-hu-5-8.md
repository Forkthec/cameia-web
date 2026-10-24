# Decisiones del spike CM-316 para la respuesta por voz (HU-5.8)

- **Fecha:** 23 de octubre de 2026
- **Alcance:** HU-5.8 (CM-309, subtarea de Frontend CM-317) y HU-5.14 (spike CM-316). Toca CA-5.8.4, 5.8.5, 5.8.6, 5.8.7, 5.8.9, 5.8.10, 5.8.11 y 5.8.24; propone el CA-5.8.25.
- **Fuente:** informe del spike CM-316 (23-10-2026, <https://drive.google.com/file/d/1KYUO08vyKXuSXpQeYiMfmuEW3k9dZO4i/view?usp=sharing>) y respuesta del PO por WhatsApp del 23-10-2026, 10:33–10:34 a. m. Criterios: `20102026_01_Backlog_v8_3.xlsx`, hoja HE-05.
- **Para quién:** equipo y Tester. Las pruebas se basan en el backlog; este documento dice qué se decidió fuera de él.
- **Quién decide:** Juan David Vela (PO) aprueba las dependencias y la exclusión de Safari. Juan José Arias, autor del spike, decide D1 a D8.

## 1. Aprobación del PO

| Tema | Decisión |
| ---- | -------- |
| Dependencias | Se aprueba instalar `@ricky0123/vad-web` 0.0.31 y `onnxruntime-web` 1.22.0, en versión exacta (CLAUDE.md §2). Se registran en esa sección al instalarlas. |
| Safari | Safari (macOS e iOS) no se prueba por ahora (CA-5.14.6). La respuesta por voz queda confirmada solo en Chrome, Edge y Firefox (Windows). |

## 2. Decisiones para HU-5.8

| # | Tema | Decisión |
| -- | ---- | -------- |
| D1 | Voz mínima | MicVAD v5 cuenta tramos de 32 ms con probabilidad >= 0,3 sobre el mismo stream de `MediaRecorder`. Se exigen >= 62 tramos (1,984 s): acepta 2,0 s (CA-5.8.9) y rechaza 1,9 s (CA-5.8.10). El backend tolera desde 1,5 s. |
| D2 | Archivos de Silero (modelo, `.wasm`, worklet) | Se decide tras instalar y leer la API real. Preferencia: mismo dominio, como assets de Vite y sin plugin; si no es posible, CDN con versión fija. Queda en el ADR 0009. |
| D3 | MicVAD no carga | Se muestra «No pudimos preparar la grabación. Puedes responder por texto.» con el campo de texto en la misma pregunta; «Grabar» sigue disponible. No se vuelve a la medición por volumen. Se agrega al backlog como CA-5.8.25. |
| D4 | Orden de arranque | MicVAD listo → `MediaRecorder` → «Grabando». La carga ocurre en `requesting`. |
| D5 | Formatos | Se prueban, en este orden, `audio/webm;codecs=opus`, `audio/webm` y `audio/mp4;codecs=aac`; se quita `audio/mp4` sin códec (Chrome y Edge lo aceptan pero graban Opus). Sin tipo válido, o con un `mimeType` real final que no sea WebM/Opus ni MP4/AAC: no se envía, se muestra «Tu navegador no permite grabar. Responderás por texto.» (texto de CA-4.3.7) y el campo de texto. |
| D6 | Tope de 3 minutos | Se mide con reloj real (`performance.now`), no contando ticks del temporizador. |
| D7 | «Enviar» al procesar | Conserva su nombre accesible, con indicador de carga y deshabilitado (igual que CA-5.2.4). Es lo que pide CA-5.8.6. |
| D8 | Aviso de CA-5.8.24 | Se oculta cuando la grabación empieza de verdad, no al pulsar «Grabar». |

## 3. Diferencias con el backlog

| Criterio | Qué agrega esta decisión | Estado |
| -------- | ------------------------ | ------ |
| CA-5.8.25 (nuevo) | Fallo de carga de MicVAD (D3) | Pendiente: lo agrega Juan José Arias al backlog (solo afecta HU-5.8) |
| CA-5.8.4, 5.8.9, 5.8.10, 5.8.11 | Medición con MicVAD en lugar del volumen (D1) | Sin cambio de texto; cambia la técnica |
| Notas técnicas de HU-5.8 | Lista de formatos y regla del `mimeType` real (D5) | Pendiente: lo agrega Juan José Arias al backlog |
| CA-4.3.7 (HU-4.3) | Su texto no cambia; solo se reutiliza para el formato no admitido (D5) | Se alinea en otro PR |

## 4. Pendiente (no resuelto en este cambio)

| Tema | Qué falta | Por qué no se hizo aquí |
| ---- | --------- | ----------------------- |
| `useCanRecordAudio.ts` (HU-4.3, CA-4.3.7) | Alinear su lista de formatos con D5 | Es de `interview-setup` y va en otro PR de Juan José; avisado a Ana Sofía Arango |
| ADR 0009 | Dónde viven los archivos de Silero (D2) | Se decide tras instalar y leer la API real |
| Safari | Sin pruebas (CA-5.14.6) | Decisión del PO |
