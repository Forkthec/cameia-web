---
feature: interview-session
estado: EN_CURSO
hu: [HU-5.2, HU-5.8]
prt: [PRT-05.10]
jira: [CM-217, CM-317]
rutas: [/entrenar/sesion/:sessionId]
documentacion: tsdoc-es
backlog: 16102026_01_v8.2
decisiones: []
figma: Cameia · Mockups MVP
revisado: 2026-10-22
---

# Feature · Chat de la entrevista (Simulación)

## 1. Propósito

Pantalla donde el Usuario responde, una por una, las 5 preguntas principales de una
Simulación en curso, sin ver retroalimentación hasta el final (HU-5.2).

## 2. Alcance

**Entra (CM-217):** respuesta escrita, «Enviar» bloqueado vacío o doble, progreso
«Pregunta k de 5», errores de red, de la IA y de entrevista ajena, «Reintentar» (máx. 2) e
«Ir al inicio», y «Tu entrevista terminó.» tras la pregunta 5.

**Entra (CM-317, datos simulados):** respuesta por voz: «Grabar», «Detener» (3:00 máx.), «Enviar»,
«Responder por texto», voz mínima de 2 s, aviso del audio, aviso de 20 s, micrófono denegado o
ausente.

**No entra:** transcripción real (HU-5.12), retomar tras recarga (HU-5.7), cierre y
reporte (HU-5.5), preguntas de seguimiento (HU-5.9), reintentos automáticos (HU-5.6).

## 3. Comportamiento esperado

### `/entrenar/sesion/:sessionId` — Chat de Simulación · `PRT-05.10`

Diseño «Escenario + orbe» (aprobado por Frontend, CM-217): cielo de madrugada
(`bg-brand-dawn`), el progreso como arco del sol (`ProgressArc`), el orbe del camello
(`BrandOrb`) y la pregunta al centro; el área de respuesta en vidrio abajo.

- **Cargando:** mientras se registra o reevalúa, el orbe gira y se anuncia «Procesando tu
  respuesta…»; «Enviar» queda deshabilitado con ese texto (CA-5.2.4).
- **Vacío:** sin entrada en el estado de la navegación (recarga) → `/entrenar/nueva`
  (HU-5.7 aún no existe: el backlog pide iniciar otra entrevista).
- **Error:** sin red → «No hay conexión…» y se conserva el texto (CA-5.2.18); `404` → «No
  encontramos lo que buscabas.» (CA-5.2.7); `503 LLM_UNAVAILABLE` → «Ocurrió un error.
  Inténtalo de nuevo.» + «Reintentar» (CA-5.2.19); tras 2 reintentos fallidos → mensaje de
  CA-5.2.20 + «Reintentar» + «Ir al inicio»; otro error → genérico.
- **Éxito:** pregunta siguiente con su texto original y «Pregunta k+1 de 5» (CA-5.2.1,
  CA-5.2.14); tras la 5, «Tu entrevista terminó.» sin campo ni botón (CA-5.2.5).

## 4. Contrato observable

- Entrada: `location.state` con `{sessionId, answerFormat, question, progress}`, que deja la
  pantalla de inicio (HU-4.5). Se valida con `readSessionEntry`.
- Campo «Respuesta»: 1 a 4000 caracteres, contador «{actual} / 4000 caracteres», solo espacios
  = vacía (RT-01, C-07).

## 5. Enlace HTTP · PROVISIONAL

Endpoints del backlog; cameia-entrevista aún no los publica (solo `/health`), así que se
prueban con MSW (`mocks/handlers/interviewSessions.handlers.ts`).

| Acción | Endpoint | Notas |
| --- | --- | --- |
| Registrar respuesta | `POST /api/v1/interviews/sessions/{session_id}/answers` | `{turno_id, respuesta_texto}`, `Idempotency-Key` por turno |
| Reintentar evaluación | `POST …/turns/{turno_id}/reprocess` | Provisional según el backlog |
| Respuesta por voz | `POST …/answers/audio` | Multipart `{turno_id, audio}`, misma `Idempotency-Key` del turno, espera 130 s |

La forma exacta de la respuesta 200 (`turno`, `progreso`, `siguiente_pregunta`,
`entrevista_terminada`) es propuesta de Frontend; se ajusta solo en
`api/interviewSession.mapper.ts`.

## 6. Criterios de aceptación

CA-5.2.1, 5.2.3, 5.2.4, 5.2.5, 5.2.7, 5.2.8, 5.2.9, 5.2.14, 5.2.15, 5.2.18, 5.2.19 y 5.2.20
(los de Frontend). Los de solo Backend (5.2.2, 5.2.6, 5.2.10 a 5.2.13, 5.2.16, 5.2.17) se
respetan al no mostrar retroalimentación ni reformular preguntas.

## 7. Estado de implementación

| Archivo | Estado |
| --- | --- |
| `src/features/interview-session/pages/InterviewSessionPage.tsx` | Hecho |
| `src/features/interview-session/hooks/useInterviewTurn.ts` | Hecho |
| `src/features/interview-session/organisms/SessionStage/SessionStage.tsx` | Hecho |
| `src/features/interview-session/organisms/TextAnswerComposer/TextAnswerComposer.tsx` | Hecho |
| `src/features/interview-session/organisms/EvaluationRetryPanel/EvaluationRetryPanel.tsx` | Hecho |
| `src/features/interview-session/api/interviewSession.api.ts` | Hecho (contrato provisional) |
| `src/features/interview-session/hooks/useVoiceRecorder.ts` | Hecho (detección provisional) |
| `src/features/interview-session/organisms/VoiceAnswerComposer/VoiceAnswerComposer.tsx` | Hecho |
| `src/design-system/molecules/BrandOrb/BrandOrb.tsx` | Hecho |
| `src/design-system/molecules/ProgressArc/ProgressArc.tsx` | Hecho |

### Respuesta por voz (CM-317 · HU-5.8)

- **Antes de grabar:** «Grabar», «Responder por texto» y «Tu audio se usa solo para transcribir tu
  respuesta y no se guarda.» (CA-5.8.24).
- **Grabando:** orbe en rojo con barras, tiempo «m:ss / 3:00» y «Detener»; a los 3:00 se detiene
  sola (CA-5.8.2, CA-5.8.7).
- **Detenido:** «Enviar»; al enviar, «Procesando tu respuesta…» y a los 20 s «Esto puede tardar
  hasta 2 minutos. No cierres esta página.» (CA-5.8.5).
- **Menos de 2 s de voz:** «No detectamos tu voz, intenta de nuevo.» y se graba otra vez sin enviar
  (CA-5.8.10, CA-5.8.11).
- **Micrófono denegado / ausente:** mensaje del backlog y el campo de texto en la misma pregunta
  (CA-5.8.3, CA-5.8.23).
- **Responder por texto:** descarta la grabación y muestra el campo (CA-5.8.19).

## 8. Bloqueos

- Backend: `…/answers` y `…/reprocess` no existen en cameia-entrevista (CM-204/CM-207 y
  relacionados). Sin ellos no se puede probar contra el backend real.
- La pregunta 1 llega desde la pantalla de inicio (HU-4.5, CM-213).
- `…/answers/audio` no existe (HU-5.8/5.12 Backend). La voz se probó con datos simulados, como pide CM-317.
- **Detección de voz provisional:** el backlog pide Silero VAD (spike CM-316); instalarla necesita
  permiso (CLAUDE.md §2). Mientras tanto `useVoiceRecorder` mide la energía de la señal con la Web
  Audio API; el backend revalida con 1,5 s de tolerancia.

## 9. Notas

- Sin textos fuera del backlog: el orbe solo anuncia «Procesando tu respuesta…». No hay botón
  de salida en el chat (CA-5.2.15 y el backlog no lo define).
- El número total de preguntas viene del backend en el progreso (CLAUDE.md §3.7).

## Contrato acordado con Backend (22-10-2026)

Respuesta de Backend del 20-10-2026 (§6.3 a §6.6). Sigue siendo **previsto** hasta que publiquen la
OpenAPI:

- Nombres en inglés y camelCase: `…/answers` recibe `{turnId, answerText}`; el audio va en multipart
  con `turnId` y `audio`. Respuesta común: `turn {turnId, status}`, `progress {currentQuestion,
  totalQuestions}`, `nextQuestion` y `interviewFinished`. `…/start` devuelve `status`,
  `answerFormat`, `question` y `progress`.
- La entrada del chat lleva también `sessionLanguage` (del asistente; `…/start` no lo devuelve).
- `LLM_LIMIT_REACHED` se trata igual que `LLM_UNAVAILABLE` («Reintentar»).
- Rechazos del audio: `TRANSCRIPTION_EMPTY` → «No detectamos tu voz, intenta de nuevo.»
  (CA-5.12.7); `TRANSCRIPTION_TOO_LONG` → «Tu respuesta es demasiado larga…» (CA-5.12.9);
  `TRANSCRIPTION_LANGUAGE_MISMATCH` → «Tu entrevista es en inglés/español…» (CA-5.12.10);
  `TRANSCRIPTION_UNAVAILABLE` → «No pudimos transcribir tu respuesta…» con «Grabar de nuevo»
  (CA-5.12.8). En todos se descarta la grabación y se puede grabar otra vez o responder por texto.
- Inicio: `PLANNING_RETRIES_EXHAUSTED` deja solo «Cancelar» (CA-4.5.19); el contador lo lleva
  Backend.

