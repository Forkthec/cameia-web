---
feature: interview-session
estado: EN_CURSO
hu: [HU-5.2, HU-5.8]
prt: [PRT-05.10, PRT-05.12]
jira: [CM-217, CM-317]
rutas: [/entrenar/sesion/:sessionId]
documentacion: tsdoc-es
backlog: 23102026_01_v8.4
decisiones: [23102026_v1_decisiones-spike-cm316-hu-5-8.md]
figma: Cameia · Mockups MVP
revisado: 2026-10-23
---

# Feature · Chat de la entrevista (Simulación)

## 1. Propósito

Pantalla donde el Usuario responde, una por una, las 5 preguntas principales de una
Simulación en curso, sin ver retroalimentación hasta el final: HU-5.2 (responder por escrito
cada pregunta principal y avanzar sin ver retroalimentación) y HU-5.8 (grabar y enviar la
respuesta por voz). La verdad para QA no es este SPEC, sino el archivo de criterios de cada HU:
HU-5.2, `21102026_01_HU-5_2_criterios_backlog_v8_3.md` (backlog v8.3,
`20102026_01_Backlog_v8_3.xlsx`, hoja HE-05); HU-5.8, `23102026_02_HU-5_8_criterios_backlog_v8_4.md`
(25 CA, backlog v8.4, `23102026_01_Backlog_v8_4.xlsx`, hoja HE-05), verdad de QA de CM-317. Los
dos viven fuera del repositorio (`cameia-backup/criterios/`).

Las decisiones del spike CM-316 (`docs/decisiones/23102026_v1_decisiones-spike-cm316-hu-5-8.md`)
se citan «CM-316 D1» a «CM-316 D8», para no confundirlas con las D1 a D10 de CM-217 de este SPEC.

## 2. Alcance

**Ya en `develop` (CM-217, CM-317):** respuesta escrita; «Enviar» bloqueado vacío o doble;
progreso «Pregunta k de 5»; errores de red, de la IA y de entrevista ajena; «Reintentar» (máx.
2 usos) e «Ir al inicio»; «Tu entrevista terminó.» tras la pregunta 5; respuesta por voz con
datos simulados. Desde el PR #101 (`836d8e3`): contrato previsto de Backend en las tres rutas
de respuesta (D1), `LLM_LIMIT_REACHED` en `…/answers` y los rechazos del audio al transcribir.

**Hecho en la rama `CM-217-contrato-y-errores-chat-simulacion` (CM-217):** archivo de códigos
de la feature (§4, D2); `LLM_LIMIT_REACHED` en `…/reprocess` decidido por `code` (D3); solo los
fallos de la IA de `…/reprocess` suman al tope (D4); la prueba exacta del tope (D5); una
respuesta `200` con forma inesperada muestra el genérico (D10); «Pregunta k de 5» sin
mayúsculas (§9, D7); conteo de caracteres por puntos de código NFC, también en el mock (§4, D9);
envío sin recortar, también en el mock (§4); «Enviar» conserva su nombre mientras se procesa
(CA-5.2.4); y las pruebas del plan (§6).

**En la rama `CM-317-deteccion-voz-silero` (CM-317):** detección de la voz mínima con MicVAD v5
en lugar de la energía de la señal, según las notas técnicas de HU-5.8 (O75, backlog v8.4), con
el orden de arranque de CM-316 D4; fallo de carga de MicVAD (CA-5.8.25, CM-316 D3); formatos y
`mimeType` real, según las mismas notas técnicas; tope de 3 min con reloj real (CM-316 D6);
«Enviar» conserva su nombre accesible al procesar (CM-316 D7); aviso de CA-5.8.24 hasta que la
grabación empieza de verdad (CM-316 D8); assets de Silero con nombre fijo (ADR 0009); los
defectos de `useVoiceRecorder` y de la página (§9) y las pruebas del plan de §6. Tareas en el
Anexo A. Safari no se prueba (CA-5.14.6).

**No entra:** transcripción real (HU-5.12, transcripción de la respuesta por voz), retomar tras
recarga (HU-5.7, retomar una entrevista), cierre y reporte (HU-5.5, cierre de la entrevista),
preguntas de seguimiento (HU-5.9), reintentos automáticos (HU-5.6), y los tipos de fallo sin
llaves de i18n en el hook (D6, §9). Lo anotado para después está en §9.

## 3. Comportamiento esperado

### `/entrenar/sesion/:sessionId` — Chat de Simulación · `PRT-05.10` (fallo de la IA: `PRT-05.12`)

Diseño «Escenario + orbe» (aprobado por Frontend, CM-217): cielo de madrugada
(`bg-brand-dawn`), el progreso como arco del sol (`ProgressArc`), el orbe del camello
(`BrandOrb`) y la pregunta al centro; el área de respuesta en vidrio abajo.

- **Cargando:** mientras se registra o se reevalúa, el orbe gira y aparece el indicador
  visible «Procesando tu respuesta…», anunciado por la región `aria-live` de `SessionStage`;
  «Enviar» conserva su nombre y queda deshabilitado, y un segundo clic no envía otra respuesta
  — CA-5.2.4 (doble selección de «Enviar»). El botón no usa el modo de carga de `Button`,
  porque ese modo cambia la etiqueta.
- **Vacío:** sin entrada en el estado de la navegación (recarga) → `/entrenar/nueva`
  (HU-5.7, retomar, aún no existe: el backlog pide iniciar otra entrevista).
- **Error:** según §4: sin red → «No hay conexión…» y se conserva el texto (CA-5.2.18, envío
  sin conexión); `404` → «No encontramos lo que buscabas.» (CA-5.2.7, envío a una entrevista
  ajena o inexistente); fallo de la IA → «Ocurrió un error. Inténtalo de nuevo.» +
  «Reintentar» (CA-5.2.19, fallo de la IA al evaluar la respuesta); tras 2 «Reintentar»
  fallidos → mensaje de CA-5.2.20 (reintentos de evaluación agotados) + «Reintentar» + «Ir al
  inicio»; cualquier otro error → genérico.
- **Éxito:** pregunta siguiente con su texto original y «Pregunta k+1 de 5», sin
  retroalimentación (CA-5.2.1, respuesta registrada y avance; CA-5.2.14, siguiente pregunta con
  su texto original); tras la 5, «Tu entrevista terminó.» sin campo ni botón (CA-5.2.5,
  respuesta a la última pregunta).

En una entrevista con Texto el chat muestra solo el campo «Respuesta» y «Enviar», sin pausar,
repreguntar ni reintentar una respuesta ya enviada — CA-5.2.15 (chat de Simulación sin pausa,
repregunta ni reintento).

## 4. Contrato observable

**Entrada.** `location.state` con `{sessionId, sessionLanguage, answerFormat, question,
progress}`, que deja la pantalla de inicio (HU-4.5, preguntas planificadas y Turno de Entrevista
1). Se valida con `readSessionEntry` (`src/features/interview-session/model/sessionEntry.ts`).
`sessionLanguage` (BCP-47, `es-CO` o `en`) viene del asistente, porque `…/start` no lo devuelve;
solo lo usa el aviso de idioma del audio (CA-5.12.10). Hecho en #101.

**Campo «Respuesta».** 1 a 4000 caracteres con contador «{n} / 4000 caracteres»; solo espacios
= vacía. «Caracteres» son **puntos de código Unicode tras normalizar a NFC** (RT-01, campos
obligatorios y validación de formularios; regla C-07): un emoji cuenta 1, no 2. El conteo
se hace en la feature (`TextAnswerComposer`) con la utilidad existente `unicodeLength`
(`src/utils/unicodeLength.ts`); la molécula `CharacterCounter` no cuenta, recibe `count` ya
calculado, así que no cambia (D9).

**Recorte.** RT-01, regla C-07, recorta al inicio y al final antes de validar solo los textos
de una línea. La respuesta es texto largo: **se envía tal como se escribió** (`answerText`
idéntico a lo escrito, con sus espacios al inicio y al final) y **se cuenta lo escrito**.
`trim()` solo decide si está vacía — CA-5.2.3 (respuesta vacía o de solo espacios); ver §9,
caracteres de ancho cero.

**Mock (D9 y recorte).** El handler de `…/answers` da `422` si `trim()` queda vacío o si lo
recibido, sin recortar, pasa de 4000 puntos de código NFC. La política de ESLint de `mocks` solo
permite importar `mocks` y `services`, así que el mock no importa `unicodeLength`: repite la
expresión con un comentario que apunta a `src/utils/unicodeLength.ts`.

**Códigos de la feature (D2, ADR-0008, el `code` estable como discriminador).**
`src/features/interview-session/model/interviewSession.errorCodes.ts`, con `LLM_UNAVAILABLE`,
`LLM_LIMIT_REACHED` y `VALIDATION_FAILED`, copiados tal cual del contrato y acotados a
`…/answers` y `…/reprocess`. El hook y las pruebas los **importan** de ese archivo. Los mocks
los **copian como literal**, con un comentario que apunta a ese archivo, igual que hacen los
mocks de Perfil. Los códigos de transcripción de CM-317 se quedan donde los dejó #101
(`AUDIO_REJECTIONS` en el hook).

**Mensajes.** Siguiendo el patrón actual, el hook devuelve la llave de `errors` que muestra la
página (`SubmitErrorKey`): `submitError` para `…/answers` y `retryError` para el último fallo de
`…/reprocess` que no es de la IA (antes era `retryNetworkError`, un booleano solo para la red).
D6 queda para después (§9).

**Fallo de red frente a otro error (D10).** Por qué hace falta:

- `fetch` rechazado (sin red) o abortado por el tope de 30 s (`src/services/http/httpClient.ts:87`)
  sale del cliente sin envolver: `try/finally` sin `catch` (`httpClient.ts:89-128`).
- Toda respuesta no OK pasa a `ApiError` por `errorMap`, aunque el cuerpo no sea JSON
  (`httpClient.ts:110-119`; `src/services/http/errorMap.ts:81-111`).
- Un `200` sale de `response.json()` sin validar (`httpClient.ts:125`): si le faltaba
  `progress`, el mapper lanzaba un `TypeError` al leerlo, la misma clase de error que un
  `fetch` sin red.
- El hook trata todo lo que no es `ApiError` como red, igual que el resto del proyecto
  (`src/features/professional-profile/pages/EditProfilePage.tsx:379,389`).
- `ApiError` solo lo construye `errorMap` (`src/services/http/ApiError.ts:2-3`): el mapper no
  debe crear uno.

**Cómo quedó, dentro del patrón actual:** el mapper (el cortafuegos, CLAUDE.md §8) valida
`progress`, `interviewFinished` y `nextQuestion` del `200` y, si no calzan, lanza
`AnswerResponseShapeError` (`api/`). El hook lo trata como «otro» (`errors:generico`) y deja
intacta la regla «no es `ApiError` = red» para el transporte. No se tocó `services/`. Siguen
como red, para después (§9): un `200` cuyo cuerpo no es JSON (`httpClient.ts:125`) y
`BackendNotConfiguredError` (`httpClient.ts:57`). Se descartó detectar la red en positivo
(`TypeError` o `AbortError`), porque el `TypeError` del mapper es de la misma clase.

**Errores.** Tope de «Reintentar» (D5): 2 usos después del primer fallo, 3 llamadas a la IA en
total («Cambios v4», fila 8); `MAX_EVALUATION_RETRIES` (`model/interviewSession.constants.ts`).
Solo suma un fallo de evaluación (D4).

| Code o situación | Petición | Clase | ¿Suma al tope? | Llave i18n | CA |
| --- | --- | --- | --- | --- | --- |
| `503 LLM_UNAVAILABLE` | `…/answers` | evaluación → panel | No (es el primer fallo) | `errors:generico` + «Reintentar» | CA-5.2.19 (fallo de la IA al evaluar) |
| `503 LLM_LIMIT_REACHED` | `…/answers` | evaluación → panel (D3, hecho en #101) | No (primer fallo) | `errors:generico` + «Reintentar» | CA-5.2.19 |
| `404` (con o sin `code`, p. ej. `SESSION_NOT_FOUND`) | `…/answers` | no encontrada | — | `errors:codigos.NOT_FOUND` | CA-5.2.7 (entrevista ajena o inexistente) |
| `422 VALIDATION_FAILED` (`errors[].field = answerText`) | `…/answers` | otro | — | `errors:generico` | CA-5.2.9 / 5.2.10 (la interfaz no deja llegar aquí) |
| `409 TURN_ALREADY_ANSWERED`, `409 TURN_PROCESSING`, `409 IDEMPOTENCY_KEY_CONFLICT`, `409 SESSION_TRANSITION_NOT_ALLOWED`, `409 SESSION_CONFLICT` | `…/answers` | otro | — | `errors:generico` (el backlog no define textos para ellos; ADR-0008 permite el genérico) | CA-5.2.6 (entrevista que no está en curso), CA-5.2.11 (reenvío de la misma respuesta) |
| `500 INTERNAL_ERROR`, `503 DATABASE_UNAVAILABLE`, sin `code` | `…/answers` | otro | — | `errors:generico` | — |
| `200` con forma inesperada (D10) | `…/answers` | otro | — | `errors:generico`; se conservan texto, pregunta y progreso | — |
| Sin respuesta HTTP (`fetch` rechazado o tiempo agotado) | `…/answers` | red | — | `errors:red`; se conservan texto, pregunta y progreso | CA-5.2.18 (envío sin conexión) |
| `LLM_UNAVAILABLE` o `LLM_LIMIT_REACHED` | `…/reprocess` | evaluación | **Sí** (D3, por `code`) | 1.º: `errors:generico`; 2.º en adelante: `interview:sesion.reintentosAgotados` | CA-5.2.19, CA-5.2.20 (reintentos agotados) |
| Sin respuesta HTTP | `…/reprocess` | red | No | `errors:red`; «Reintentar» sigue | D4 |
| `404` | `…/reprocess` | no encontrada | No | `errors:codigos.NOT_FOUND`; «Reintentar» sigue | D4 |
| `409 TURN_TRANSITION_NOT_ALLOWED`, `409 TURN_PROCESSING`, `409 SESSION_CONFLICT` | `…/reprocess` | otro | No | `errors:generico` (sin textos en el backlog; ADR-0008); «Reintentar» sigue | D4 |
| Cualquier otro error, incluido un `200` con forma inesperada | `…/reprocess` | otro | No | `errors:generico`; «Reintentar» sigue | D4 |
| `401` | cualquiera | (lo atiende `httpClient`) | — | cierre de sesión | — |

**Decisión D4 (panel de fallo de evaluación):**

- `…/reprocess` solo suma un fallo de evaluación con `code` `LLM_UNAVAILABLE` o
  `LLM_LIMIT_REACHED`. Sin respuesta HTTP → «No hay conexión…»; `404` → «No encontramos lo que
  buscabas.»; cualquier otro error → genérico. Ninguno de esos tres suma. La página muestra en
  el panel el mensaje del último fallo (`retryError`) y, si fue de la IA, el genérico o el de
  tope agotado.
- Tras cualquier fallo de `…/reprocess`, incluido un `404`, el panel **sigue mostrando
  «Reintentar»**, que siempre llama a `…/reprocess`, también después de agotar el tope
  (CA-5.2.20).
- «Ir al inicio» (`/inicio`, destino de HU-10.4) aparece al agotar el tope y **no desaparece**
  aunque después llegue un fallo de otro tipo. El contador solo vuelve a cero con una respuesta
  exitosa.

**Rechazos del audio (CM-317).** Ver §5, «Qué muestra la pantalla al enviar audio».

Nunca se muestran `title`, `detail`, `code` ni `requestId` (CLAUDE.md §8).

## 5. Enlace HTTP · PROVISIONAL

**Estado del contrato:** previsto, pendiente de OpenAPI · fuente: documento de Backend
`20102026_v1_respuesta-nueva-entrevista-para-frontend.md` (Paula, 20-10-2026), §6.3 (Iniciar),
§6.5 (Responder) y §6.6 (Errores). **Implementado en `develop`** por el PR #101 (`836d8e3`,
CM-217) y anunciado a Backend en `22102026_v1_respuesta-frontend-a-backend-contrato-entrevista.md`
(Ana Sofía, 22-10-2026), §3. `cameia-entrevista` aún no publica estos endpoints (solo
`/health`): se prueban con MSW (`src/mocks/handlers/interviewSessions.handlers.ts`). Los
nombres de campo van en inglés y camelCase; los **valores** quedan como los manda el backend
(`EN_CURSO`, `TEXTO`, `COMPLETED`…). Las llaves de i18n no cambian.

| Operación | Método y ruta | Envía | Recibe |
| --- | --- | --- | --- |
| Registrar respuesta | `POST /api/v1/interviews/sessions/{sessionId}/answers` | `{turnId, answerText}` + cabecera `Idempotency-Key` (una por turno y forma de respuesta; se reutiliza al reenviar el mismo turno) | 200 común |
| Reintentar evaluación | `POST /api/v1/interviews/sessions/{sessionId}/turns/{turnId}/reprocess` | sin cuerpo | 200 común |
| Respuesta por voz (CM-317) | `POST …/sessions/{sessionId}/answers/audio` | multipart `{turnId, audio}` + la `Idempotency-Key` del turno; espera 130 s | 200 común |

**Respuesta 200 común** (nunca trae retroalimentación):
`turn {turnId, status}` · `progress {currentQuestion, totalQuestions}` ·
`nextQuestion {turnId, number, text} | null` · `interviewFinished: boolean`.

`interviewSession.mapper.ts` la convierte al modelo: `progress` → `{current, total}`;
`nextQuestion` → `InterviewQuestion` o `null`; `interviewFinished` o `nextQuestion = null` →
fase `finished`. `turn.status` no se usa en la interfaz. Repetir la misma `Idempotency-Key`
devuelve la misma respuesta; otra clave para el mismo turno → `409`. El mapper además valida la
forma y, si no calza, lanza `AnswerResponseShapeError` (D10, §4).

**`…/answers/audio`: contrato provisional (CM-317).** El backlog solo dice «multipart» (notas
técnicas de HU-5.8) y no nombra los campos. Estos son los que eligió Frontend en #97 y #101
(`api/interviewSession.api.ts`); **no comprobado** que Backend los acepte: ninguna rama de
`cameia-entrevista` tiene `…/answers/audio` (23-10-2026; nota del archivo de criterios). Es un
bloqueo (§8).

| Parte | Tipo | Valor |
| --- | --- | --- |
| `turnId` | texto | turno pendiente |
| `audio` | archivo | el `Blob` grabado, con el `mimeType` real del grabador como tipo; nombre fijo `respuesta.webm` o `respuesta.mp4`, que Backend ignora (CA-5.8.16) |
| Cabecera `Idempotency-Key` | — | una por turno para el audio; se reutiliza al reenviar tras perder la conexión (CA-5.8.22) |

Espera de la pantalla: 130 s (`AUDIO_REQUEST_TIMEOUT_MS`); el corte del Gateway está en §8. Respuesta: la 200 común. Orden de validación del backlog: 404 → 409 → 413 → 415
→ 422; luego 503. El mock (`interviewSessions.handlers.ts:107`) lee el multipart, pero en Node 24
`request.formData()` rechaza el `Blob` de jsdom: las pruebas usan handlers propios que no leen
el cuerpo.

**Qué muestra la pantalla al enviar audio.** «Se descarta» deja «Grabar» (o «Grabar de nuevo»)
y «Responder por texto» en la misma pregunta.

| Respuesta | Mensaje | ¿Grabación? | CA |
| --- | --- | --- | --- |
| `200` | pregunta k+1 y «Pregunta k+1 de 5» | se descarta | 5.8.5, 5.8.7, 5.8.9 |
| `404` (con o sin `code`) | `errors:codigos.NOT_FOUND` | se conserva | 5.8.21 |
| `409` (cualquier `code`; no está confirmado que el audio use los de `…/answers`) | `errors:generico` | se conserva (con la misma clave puede llegar el resultado ya calculado) | 5.8.6, 5.8.21 |
| `413` | `errors:generico` | se descarta | 5.8.13 |
| `415` | `errors:generico` | se descarta | 5.8.14, 5.8.15 |
| `422 TRANSCRIPTION_EMPTY` | «No detectamos tu voz, intenta de nuevo.» | se descarta | 5.8.11, 5.12.7 |
| `422 TRANSCRIPTION_TOO_LONG` | `interview:sesion.voz.demasiadoLarga` | se descarta | 5.12.9 |
| `422 TRANSCRIPTION_LANGUAGE_MISMATCH` | aviso según `sessionLanguage` | se descarta | 5.12.10 |
| `422` sin `code` de transcripción (forma Texto, más de 181 s, menos de 1,5 s de voz, `VALIDATION_FAILED`) | `errors:generico` | se descarta | 5.8.8, 5.8.10 (B), 5.8.20 (B) |
| `503 TRANSCRIPTION_UNAVAILABLE` | `interview:sesion.voz.noTranscrita`, con «Grabar de nuevo» | se descarta | 5.12.8 |
| `503 LLM_UNAVAILABLE` / `LLM_LIMIT_REACHED` | panel con «Reintentar» (el audio ya quedó registrado) | se descarta (hoy no: defecto de §9) | 5.2.19 |
| Otro `5xx` o sin `code` | `errors:generico` | se conserva | — |
| Sin respuesta HTTP o tiempo agotado | `errors:red` («No hay conexión…») | se conserva, con la misma clave | 5.8.22 |
| `401` | cierre de sesión (`httpClient`) | — | — |

**Las demás rutas de la entrevista (interview-setup, no las toca esta rama):** `POST
/api/v1/interviews/sessions` (crear la sesión, HU-4.4) se migró en el PR #100 (`5bc70b2`,
CM-208), y `POST …/sessions/{id}/start` (HU-4.5) en el PR #101. `…/start` devuelve `status`,
`answerFormat`, `question {turnId, number, text}` y `progress {currentQuestion,
totalQuestions}`. `DELETE …/sessions/{id}` sigue sin cambios (documento de Frontend del 22-10,
§3, fila 6.4).

## 6. Criterios de aceptación

Criterios de HU-5.2 por referencia (texto literal en el archivo de criterios v8.3). Etiquetas
F / F y B / B según la nota del archivo de criterios.

| Criterio | Etiq. | Qué hace el frontend que el criterio no dice |
| --- | --- | --- |
| CA-5.2.1 (respuesta registrada y avance a la siguiente pregunta) | F y B | El campo de la pregunta siguiente arranca vacío |
| CA-5.2.3 (respuesta vacía o de solo espacios) | F | Vacía = `trim()` vacío |
| CA-5.2.4 (doble selección de «Enviar») | F y B | Guarda síncrona además de `disabled`; «Enviar» conserva su nombre y el indicador «Procesando tu respuesta…» va aparte, en `aria-live`; una `Idempotency-Key` por turno, reutilizada al reenviar |
| CA-5.2.5 (respuesta a la última pregunta) | B (efecto visible) | «Tu entrevista terminó.» como título, sin campo ni «Enviar» |
| CA-5.2.7 (entrevista ajena o inexistente) | B (efecto visible) | Se decide por `404` (clase amplia, ADR-0008) |
| CA-5.2.8 (respuesta de 4000 caracteres) | F y B | Conteo por puntos de código NFC (D9); se envía tal como se escribió, sin recortar |
| CA-5.2.9 (respuesta de 4001 caracteres) | F y B | No corta lo escrito: sin `maxLength` |
| CA-5.2.14 (siguiente pregunta con su texto original) | B (efecto visible) | El texto se pinta sin transformar |
| CA-5.2.15 (sin pausa, repregunta ni reintento) | F | Aplica a entrevistas con Texto |
| CA-5.2.18 (envío sin conexión) | F | Solo sin respuesta HTTP; un `200` inesperado es genérico (D10) |
| CA-5.2.19 (fallo de la IA al evaluar la respuesta) | F y B | `LLM_LIMIT_REACHED` = `LLM_UNAVAILABLE` (D3) |
| CA-5.2.20 (reintentos de evaluación agotados) | F y B | El tope lo cuenta el front (D5); solo suman fallos de evaluación (D4) |

Los de solo Backend (CA-5.2.2, 5.2.6, 5.2.10 a 5.2.13, 5.2.16 y 5.2.17) no tienen lógica en el
front: el DTO no trae retroalimentación y la pregunta se muestra tal como llega.

### Plan de pruebas

Pruebas de la página en `pages/InterviewSessionPage.test.tsx` salvo que se diga otra cosa.
Las pruebas se escribieron en rojo en `ce6b98f` y pasan con la implementación de esta rama.
«Hecha» = escrita o ampliada en esta rama; «Se mantiene» = ya existía y no se tocó. Todas usan
el contrato de §5 y los códigos de §4. Ya cubiertas por #101 y fuera de este plan:
`LLM_LIMIT_REACHED` en `…/answers` y la respuesta propia del audio
(`InterviewSessionPage.voice.test.tsx`).

| CA o decisión | Prueba (`it`) | Qué afirma literalmente | Estado |
| --- | --- | --- | --- |
| CA-5.2.1 y CA-5.2.14 | al enviar muestra la pregunta 2 con su texto original, «Pregunta 2 de 5», el campo vacío y ninguna retroalimentación | Título nivel 1 con el texto exacto de `nextQuestion.text` del handler (con tildes y signos); barra de progreso «Pregunta 2 de 5»; campo «Respuesta» vacío; un texto de retroalimentación que el handler añade a la respuesta 200 **no** aparece en la pantalla | Hecha |
| CA-5.2.3 | mantiene «Enviar» deshabilitado con el campo vacío o solo espacios | «Enviar» deshabilitado vacío, con espacios, con tabuladores y saltos de línea, y con espacio no separable; el handler de `…/answers` no recibe ninguna llamada | Hecha |
| CA-5.2.4 | con doble clic en «Enviar» registra una sola respuesta y muestra «Procesando tu respuesta…» | Handler con demora: doble clic → 1 sola llamada a `…/answers`; durante la espera (a) el botón con nombre accesible «Enviar» está deshabilitado y (b) el texto «Procesando tu respuesta…» está visible en la región `aria-live` | Hecha |
| CA-5.2.4 y CA-5.2.18 | tras un fallo de red el reenvío del mismo turno usa la misma Idempotency-Key | 1.ª llamada: error de red; 2.ª: 200. Las dos cabeceras `Idempotency-Key` son iguales y no vacías; los dos cuerpos llevan el mismo `turnId` | Hecha |
| CA-5.2.5 | tras la pregunta 5 muestra «Tu entrevista terminó.» sin campo ni «Enviar» | Título «Tu entrevista terminó.»; sin campo «Respuesta» ni botón «Enviar» | Se mantiene |
| CA-5.2.7 | con una entrevista ajena o inexistente muestra «No encontramos lo que buscabas.» | `404` con `code` `SESSION_NOT_FOUND` y `404` sin `code`: el mismo mensaje en ambos casos | Hecha |
| CA-5.2.8 | acepta exactamente 4000 caracteres y los envía tal como se escribieron | Texto de 4000 caracteres con espacios al inicio y al final (p. ej. 2 + 3996 + 2): contador «4000 / 4000 caracteres»; sin mensaje de error; «Enviar» habilitado; el `answerText` recibido por el handler es idéntico a lo escrito, espacios incluidos; avanza a «Pregunta 2 de 5» | Hecha |
| CA-5.2.9 | con 4001 caracteres marca el contador, muestra el mensaje y no envía | «4001 / 4000 caracteres»; «Tu respuesta no puede superar los 4000 caracteres.»; «Enviar» deshabilitado; el campo conserva los 4001; el handler no recibe llamadas | Hecha |
| D9 (C-07) | cuenta caracteres como puntos de código NFC | 4000 emojis → «4000 / 4000 caracteres» y «Enviar» habilitado; 4001 → mensaje de CA-5.2.9; una letra con tilde combinada (e + ◌́) cuenta 1 | Hecha |
| CA-5.2.15 | en una entrevista con Texto solo muestra el campo «Respuesta» y «Enviar» | Un solo campo de texto y un solo botón («Enviar»); ningún botón ni enlace de pausar, repreguntar ni reintentar | Hecha |
| CA-5.2.18 | sin conexión muestra el aviso y conserva el texto | «No hay conexión. Revisa tu internet e inténtalo de nuevo.»; el campo conserva el texto; el título sigue siendo la pregunta 1; «Pregunta 1 de 5» | Hecha |
| D10 | una respuesta 200 con forma inesperada muestra el error genérico, no el de conexión | El handler de `…/answers` responde 200 con un cuerpo sin `progress`: aparece «Ocurrió un error. Inténtalo de nuevo.»; **no** aparece «No hay conexión…»; el campo conserva el texto y sigue «Pregunta 1 de 5» | Hecha |
| CA-5.2.19 | si la IA falla muestra el error genérico con «Reintentar» | «Ocurrió un error. Inténtalo de nuevo.»; botón «Reintentar»; sin campo; **sin** enlace «Ir al inicio»; el `detail` del cuerpo no aparece | Hecha |
| CA-5.2.19 | «Reintentar» con éxito avanza a la pregunta siguiente | «Pregunta 2 de 5» tras un `…/reprocess` 200 | Se mantiene |
| CA-5.2.20 (D5) | agota «Reintentar» exactamente tras 2 usos fallidos y el tercero sigue llamando a la evaluación | Tras el 1.º «Reintentar» fallido: mensaje genérico y sin «Ir al inicio»; tras el 2.º: mensaje literal de CA-5.2.20, «Reintentar» y enlace «Ir al inicio» a `/inicio`; un 3.º «Reintentar» → el handler de `…/reprocess` suma 3 llamadas | Hecha |
| D3 | LLM_LIMIT_REACHED al reintentar suma al tope igual que LLM_UNAVAILABLE | `…/answers` responde `LLM_UNAVAILABLE`; `…/reprocess` responde `503 LLM_LIMIT_REACHED` dos veces: tras el 2.º, mensaje literal de CA-5.2.20 y enlace «Ir al inicio» | Hecha |
| D4 | un fallo de red al reintentar muestra «No hay conexión…» sin sumar al tope | `…/reprocess`: red, luego `LLM_UNAVAILABLE`: tras el de red, «No hay conexión…» y «Reintentar»; tras el siguiente, mensaje genérico y **sin** «Ir al inicio» (solo un fallo contado) | Hecha |
| D4 | otro error al reintentar muestra el genérico sin sumar al tope | `…/reprocess` responde `500 INTERNAL_ERROR` tres veces: siempre genérico y nunca «Ir al inicio» | Hecha |
| D4 | un 404 al reintentar muestra «No encontramos lo que buscabas.» sin sumar | Mensaje de CA-5.2.7 en el panel; «Reintentar» sigue; sin «Ir al inicio» | Hecha |
| D4 | tras agotar «Reintentar», «Ir al inicio» no desaparece si llega un fallo de otro tipo | Agotar el tope con 2 fallos `LLM_UNAVAILABLE` en `…/reprocess`; el 3.º «Reintentar» recibe un error de red: aparece «No hay conexión…», «Reintentar» sigue y el enlace «Ir al inicio» sigue visible | Hecha |
| D1 y D10 | `api/interviewSession.mapper.test.ts`: convierte la respuesta 200 del contrato previsto y rechaza una forma inesperada | `progress`, `nextQuestion` e `interviewFinished` al modelo; `nextQuestion = null` → terminada; un cuerpo sin `progress` lanza el error propio de la feature, no un `TypeError` | Hecha |
| D7 | `ProgressArc.test.tsx`: la etiqueta no fuerza mayúsculas | La etiqueta no lleva la clase `uppercase`. Es una prueba débil (jsdom no aplica Tailwind): se completó con **verificación manual el 22-10** (bitácora, Tarea 8): «Pregunta 1 de 5» se ve sin mayúsculas y el espaciado es correcto | Hecha |

### HU-5.8 (CM-317): criterios y plan de pruebas

Los 25 CA de HU-5.8 por referencia (texto literal en el archivo de criterios v8.4). «Hook» =
`hooks/useVoiceRecorder.test.ts` (nuevo, `describe('useVoiceRecorder')`; simula `./sileroVad`,
`getUserMedia` y `MediaRecorder`). «Página» = `pages/InterviewSessionPage.voice.test.tsx`.
Hoy `useVoiceRecorder` no tiene pruebas propias (la página lo reemplaza con `vi.mock`) y faltan
las de CA-5.8.5 (aviso a los 20 s), 5.8.6, 5.8.11 (`TRANSCRIPTION_EMPTY`) y 5.8.22: las cubren
las filas «Nueva» de abajo.
**No comprobado:** que las fake timers de Vitest 4 controlen `performance.now` sin configurarlas,
y que el `delay` de MSW funcione con fake timers (si no, la prueba de 20 s usa un handler que
espera una promesa resuelta a mano).

| CA | Etiq. | Qué hace el front que el CA no dice | Prueba (`it`) | Estado |
| --- | --- | --- | --- | --- |
| CA-5.8.1 | F y B | La parte F está en `interview-setup` (HU-4.3); nada en el chat | `LanguageAndFormatForm.test.tsx` «muestra Audio y Texto con descripciones (CA-4.3.3)» (**no comprobado** que afirme la preselección) | Fuera de CM-317 |
| CA-5.8.2 | F | «Grabando» solo cuando MicVAD y el grabador ya arrancaron (CM-316 D4) | Página «al grabar muestra «Detener» y el tiempo sobre 3:00 (CA-5.8.2)» · Hook «arranca MicVAD con el mismo stream antes que el grabador y queda grabando» | Se mantiene · Nueva |
| CA-5.8.3 | F | Todo error de `getUserMedia` salvo `NotFoundError` → `denied`, sin cargar MicVAD | Página «con el micrófono denegado ofrece el texto en la misma pregunta (CA-5.8.3)» · Hook «con el permiso negado queda en denied sin cargar MicVAD» | Se mantiene · Nueva |
| CA-5.8.4 | F | «Detener» desde que empieza la grabación (lectura de §9); `Blob` con el `mimeType` real | Hook «al detener con voz suficiente conserva el audio con el tipo real del grabador» | Nueva |
| CA-5.8.5 | F y B | Aviso de 20 s programado por envío y limpiado al terminar o desmontar | Página «con una grabación lista, «Enviar» avanza a «Pregunta 2 de 5» y suelta el audio (CA-5.8.5)» · «a los 20 s de espera agrega «Esto puede tardar hasta 2 minutos. No cierres esta página.»» · «tras un reenvío el aviso de 20 s no aparece antes de tiempo» | Se mantiene · Nueva · Nueva |
| CA-5.8.6 | F y B | Guarda síncrona `inFlight`; «Enviar» conserva su nombre accesible, deshabilitado y con spinner visible; el estado se anuncia solo en `aria-live` (CM-316 D7) | Página «con doble clic en «Enviar» envía un solo audio»: 1 sola llamada a `…/answers/audio`; durante la espera el botón con nombre accesible «Enviar» está deshabilitado y muestra el spinner; «Procesando tu respuesta…» aparece una sola vez, en la región `aria-live`, y no como nombre del botón | Nueva |
| CA-5.8.7 | F y B | Tope medido con `performance.now` (CM-316 D6) | Hook «a los 3:00 medidos con el reloj se detiene sola y habilita «Enviar»» | Nueva |
| CA-5.8.8, 5.8.13, 5.8.14, 5.8.15 | B | Efecto visible: genérico y se descarta la grabación (§5) | Página «413, 415 y 422 sin code de transcripción muestran el genérico y descartan la grabación» | Nueva |
| CA-5.8.9 | F y B | ≥ 62 tramos de 32 ms con `isSpeech` ≥ 0,3, según las notas técnicas de HU-5.8 (O75, backlog v8.4) | Hook «con 62 tramos de voz (1,984 s) habilita «Enviar»» | Nueva |
| CA-5.8.10 | F y B | 59 tramos → `noVoice`, sin enviar | Página «con menos de 2 s de voz muestra el aviso y deja grabar otra vez (CA-5.8.10)» · Hook «con 59 tramos de voz (1,9 s) queda en noVoice sin audio» | Se mantiene · Nueva |
| CA-5.8.11 | F y B | 0 tramos → `noVoice`; `TRANSCRIPTION_EMPTY` → mismo mensaje | Hook «sin voz queda en noVoice» · Página «si Backend responde TRANSCRIPTION_EMPTY avisa «No detectamos tu voz, intenta de nuevo.» y descarta la grabación» | Nueva · Nueva |
| CA-5.8.12, 5.8.16, 5.8.17, 5.8.18 | B | Nombre de archivo fijo; el `Blob` solo vive en el estado de React | — | Sin prueba de front |
| CA-5.8.19 | F y B | Otra `Idempotency-Key` para el texto; se registra en `…/answers` | Página ««Responder por texto» descarta la grabación y muestra el campo (CA-5.8.19)», ampliada: el envío llega a `…/answers`, no a `…/answers/audio` | Se amplía |
| CA-5.8.20 | F y B | Sin «Grabar» en una entrevista con Texto | Página «una entrevista de texto no muestra «Grabar» (CA-5.8.20)» | Se mantiene |
| CA-5.8.21 | B | Efecto visible: `404` → `NOT_FOUND`; `409` → genérico | Página «al enviar audio a una entrevista ajena muestra «No encontramos lo que buscabas.»» | Nueva |
| CA-5.8.22 | F y B | Conserva el `Blob` y reutiliza la clave `:audio` | Página «sin conexión conserva la grabación y el reenvío usa la misma Idempotency-Key» | Nueva |
| CA-5.8.23 | F | `NotFoundError` → `noMicrophone` | Página «sin micrófono avisa y ofrece el texto (CA-5.8.23)» · Hook «sin micrófono queda en noMicrophone» | Se mantiene · Nueva |
| CA-5.8.24 | F | Se oculta cuando la grabación empieza de verdad (CM-316 D8) | Página «muestra «Grabar», «Responder por texto» y el aviso del audio antes de grabar (CA-5.8.24)» · «el aviso sigue visible mientras se prepara la grabación y si el permiso se niega o MicVAD falla» | Se mantiene · Nueva |
| CA-5.8.25 | F | Fallo de carga de MicVAD (CM-316 D3) | Hook «si MicVAD no carga queda en vadFailed y libera el micrófono» · Página «si no se puede preparar la grabación muestra el aviso, el campo de texto y «Grabar»» | Nueva · Nueva |
| Notas técnicas HU-5.8 (formatos) | F | Formatos y `mimeType` real, según las notas técnicas de HU-5.8 (O75, backlog v8.4); sin «Grabar» (lectura del front, §9) | Hook «sin un tipo admitido queda en unsupported sin pedir el micrófono» · «con un mimeType real no admitido descarta y queda en unsupported» · Página «con formato no admitido muestra «Tu navegador no permite grabar. Responderás por texto.» y el campo» | Nueva |
| Defecto: audio de la pregunta anterior (§9) | — | Un `503 LLM_*` al enviar audio descarta la grabación | Página «tras un fallo de la IA con audio y un "Reintentar" exitoso, la pregunta siguiente queda en idle sin grabación previa» | Nueva |
| Defecto: cancelación en `requesting` (§9) | — | Descartar o desmontar mientras se prepara libera todo | Hook «descartar mientras se prepara libera el micrófono y no graba» · «desmontar mientras se prepara libera el micrófono» | Nueva |

## 7. Estado de implementación

| Archivo | Estado |
| --- | --- |
| `src/features/interview-session/pages/InterviewSessionPage.tsx` | Hecho; contrato previsto y avisos de voz (#101); envía la respuesta sin recortar y el panel muestra el mensaje del último fallo de reprocess (D4). CM-317: temporizador de 20 s, aviso de CA-5.8.24, descarte tras 503 LLM y tras 413, 415 y 422 genéricos, estados vadFailed y unsupported |
| `src/features/interview-session/hooks/useInterviewTurn.ts` | Hecho; rechazos del audio (#101); códigos de D2; solo los fallos de la IA de reprocess suman al tope (D3, D4); retryError reemplaza a retryNetworkError; AnswerResponseShapeError da el genérico (D10); sigue devolviendo llaves de i18n (D6 fuera) |
| `src/features/interview-session/organisms/SessionStage/SessionStage.tsx` | Hecho; región aria-live con el indicador de procesando |
| `src/features/interview-session/organisms/TextAnswerComposer/TextAnswerComposer.tsx` | Hecho; cuenta puntos de código NFC con unicodeLength (D9); el botón Enviar solo se deshabilita, sin modo de carga, y ya no recibe etiqueta de carga (CA-5.2.4) |
| `src/features/interview-session/organisms/EvaluationRetryPanel/EvaluationRetryPanel.tsx` | Hecho; conserva el modo de carga (§9) |
| `src/features/interview-session/api/interviewSession.api.ts` | Hecho con el contrato previsto (#101); TSDoc de reprocessTurn para después (§9) |
| `src/features/interview-session/api/interviewSession.dto.ts` | Hecho con el contrato previsto (#101) |
| `src/features/interview-session/api/interviewSession.mapper.ts` | Hecho con el contrato previsto (#101); valida la forma de la respuesta 200 (D10) |
| `src/features/interview-session/api/AnswerResponseShapeError.ts` | Hecho; error propio del mapper (D10) |
| `src/features/interview-session/api/interviewSession.mapper.test.ts` | Hecha (D1 y D10) |
| `src/features/interview-session/model/interviewSession.errorCodes.ts` | Hecho; LLM_UNAVAILABLE, LLM_LIMIT_REACHED y VALIDATION_FAILED (D2) |
| `src/features/interview-session/model/interviewSession.types.ts` | Hecho; sessionLanguage en #101 |
| `src/features/interview-session/model/sessionEntry.ts` | Hecho; valida sessionLanguage (#101) |
| `src/features/interview-session/model/interviewSession.constants.ts` | Hecho; tope de 2. CM-317: encabezado (tarea 8 del Anexo A) |
| `src/features/interview-session/hooks/useVoiceRecorder.ts` | En curso (CM-317): MicVAD y formatos según las notas técnicas de HU-5.8 (O75, backlog v8.4), orden de arranque (CM-316 D4), estados vadFailed y unsupported, cancelación y tope con reloj real (CM-316 D6); sin medición por energía |
| `src/features/interview-session/organisms/VoiceAnswerComposer/VoiceAnswerComposer.tsx` | Hecho. CM-317: Enviar conserva su nombre accesible con spinner visible (CM-316 D7) y aviso de CA-5.8.24 (CM-316 D8) |
| `src/design-system/molecules/BrandOrb/BrandOrb.tsx` | Hecho |
| `src/design-system/molecules/ProgressArc/ProgressArc.tsx` | Hecho; la etiqueta se muestra sin mayúsculas forzadas (D7) |
| `src/mocks/handlers/interviewSessions.handlers.ts` | Hecho con el contrato previsto (#101); cuenta puntos de código NFC sin recortar y copia VALIDATION_FAILED con un comentario (D2, D9) |
| `src/features/interview-session/pages/InterviewSessionPage.test.tsx` | Hecha; cubre el plan de §6 |
| `src/features/interview-session/pages/InterviewSessionPage.voice.test.tsx` | Hecho; contrato previsto y rechazos del audio en #101. CM-317: pruebas de HU-5.8 de §6 |
| `src/design-system/molecules/ProgressArc/ProgressArc.test.tsx` | Hecha (D7, prueba débil; completada con la verificación manual del 22-10, bitácora Tarea 8) |

Por crear en CM-317 (entran a la tabla cuando existan, tarea 11 del Anexo A):
`src/features/interview-session/hooks/sileroVad.ts` (nombre propuesto),
`src/features/interview-session/hooks/useVoiceRecorder.test.ts` y el cambio en `vite.config.ts`
(ADR 0009).

### Respuesta por voz (CM-317 · HU-5.8)

| Estado de la grabación | Cuándo | Qué muestra |
| --- | --- | --- |
| **idle** | al entrar, tras descartar o tras un rechazo | «Grabar», «Responder por texto» y el aviso de CA-5.8.24 mientras no haya grabado de verdad (CM-316 D8) |
| **requesting** | tras «Grabar», en orden: 1) tipo admitido, según las notas técnicas de HU-5.8 (O75, backlog v8.4); 2) getUserMedia; 3) import() del módulo de Silero, MicVAD.new y start; 4) MediaRecorder.start (CM-316 D4) | «Grabar» deshabilitado; el aviso sigue visible; «Responder por texto» cancela. Descartar o desmontar en cualquier paso libera todo y no graba |
| **recording** | MicVAD y el grabador arrancaron | orbe en rojo, «m:ss / 3:00», «Detener» (desde el inicio) y «Responder por texto»; a los 3:00 de reloj se detiene sola (CA-5.8.2, CA-5.8.7) |
| **stopped** | se detuvo con 62 tramos de voz o más y un mimeType real admitido | «Enviar» y el tiempo grabado (CA-5.8.4, CA-5.8.9) |
| **noVoice** | se detuvo con menos de 62 tramos | «No detectamos tu voz, intenta de nuevo.» y «Grabar» (CA-5.8.10, CA-5.8.11) |
| **denied** / **noMicrophone** | error de getUserMedia | mensaje del backlog y el campo de texto; el resto de la entrevista sigue por texto (CA-5.8.3, CA-5.8.23) |
| **vadFailed** | import(), MicVAD.new o start lanzan; un asset ausente llega como 200 con index.html por el rewrite y falla al analizarse (ADR 0009, **no comprobado**) | «No pudimos preparar la grabación. Puedes responder por texto.» (llave nueva) y el campo de texto en la misma pregunta; «Grabar» sigue disponible y vuelve a requesting (CA-5.8.25, CM-316 D3) |
| **unsupported** | no hay tipo admitido, o el mimeType real no es WebM/Opus ni MP4/AAC | «Tu navegador no permite grabar. Responderás por texto.» (llave existente, interview.json línea 89, texto de CA-4.3.7) y el campo de texto, según las notas técnicas de HU-5.8 (O75, backlog v8.4); se oculta «Grabar» (lectura del front, §9) |
| enviando (isSubmitting del turno) | tras «Enviar» | «Enviar» deshabilitado, con spinner visible y su nombre accesible «Enviar»; «Procesando tu respuesta…» se anuncia solo en la región aria-live existente, una vez (CM-316 D7; mismo principio que el composer de texto, CA-5.2.4, RT-06); a los 20 s, «Esto puede tardar hasta 2 minutos. No cierres esta página.» (CA-5.8.5) |

Los rechazos de Backend al transcribir y los demás errores del envío están en §5.

### Detección de voz · notas técnicas de HU-5.8 (O75, backlog v8.4), CM-316 D4 y ADR 0009

- **Carga diferida.** `@ricky0123/vad-web` 0.0.31 y `onnxruntime-web` 1.22.0 se cargan solo en
  `requesting`, con `import()` de un único módulo de la feature (`hooks/sileroVad.ts`, nombre
  propuesto) que importa con `?url` los cuatro assets del ADR 0009. Nunca al arrancar la
  aplicación ni en una entrevista con Texto (CLAUDE.md §2). En las pruebas el módulo se simula.
- **Opciones de `MicVAD.new`.** `model: "v5"` (tramos de 512 muestras a 16 kHz = 32 ms,
  `real-time-vad.js:366-367`); `startOnLoad: false`; `getStream` devuelve el stream propio, el
  mismo de `MediaRecorder`; `pauseStream` vacío, porque el de la librería detiene las pistas
  (`real-time-vad.js:73-77`) y el hook las libera por su cuenta; `resumeStream` devuelve el mismo
  stream; `onFrameProcessed(probs)` cuenta un tramo si `probs.isSpeech` ≥ 0,3; `baseAssetPath` y
  `onnxWASMBasePath` se derivan de las URLs importadas.
- **`getUserMedia({ audio: true })`.** Comprobado contra el spike (`silero.html`, fuera del
  repositorio): usó `getUserMedia({ audio: true })` y pasó ese stream a MicVAD con `getStream`,
  con `pauseStream` vacío, `model: 'v5'` e `isSpeech` ≥ 0,3. Única diferencia: el spike arrancó
  el grabador antes que MicVAD; CM-316 D4 lo invierte a propósito.
- **Voz mínima.** ≥ 62 tramos (1,984 s) = `floor(MIN_VOICE_SECONDS × 1000 / 32)`: acepta 2,0 s
  (CA-5.8.9) y rechaza 1,9 s, 59 tramos (CA-5.8.10). El backend tolera desde 1,5 s.
- **Liberación.** `destroy()` lanza si MicVAD nunca arrancó (`getAudioInstances`,
  `real-time-vad.js:188`): solo se llama tras un `start` exitoso. MicVAD crea su propio
  `AudioContext`; el hook ya no crea uno. Cada intento lleva un identificador: tras cada `await`,
  si el intento ya no es el vigente (se descartó o se desmontó), se liberan el stream y MicVAD.
- **Formatos (notas técnicas de HU-5.8, O75, backlog v8.4).** En orden: `audio/webm;codecs=opus`, `audio/webm`,
  `audio/mp4;codecs=aac`; se quita `audio/mp4` sin códec (Chrome y Edge lo aceptan pero graban
  Opus). El `mimeType` real se revisa al arrancar el grabador. **No comprobado:** que ya sea el
  definitivo en `onstart` en Chrome, Edge y Firefox, ni qué cadena reporta un MP4/AAC.
- **Tope de 3 min (CM-316 D6).** Con `performance.now()` desde el arranque del grabador; el
  intervalo solo refresca la etiqueta.

## 8. Bloqueos

- Backend: `…/answers`, `…/reprocess` y `…/answers/audio` no existen en cameia-entrevista
  (solo `/health`). Sin ellos no se puede probar contra el backend real; el Sprint 3 cierra la
  subtarea de Frontend con datos simulados (planeación del 15/10).
- **Campos del multipart de `…/answers/audio` sin confirmar por Backend:** ver §5.
- **Solicitudes a Backend del 21-10 (Juan José), respondidas el 22-10** en
  `22102026_v1_respuesta-a-frontend-tiempos-y-confirmaciones.md` (Paula, Backend). No son la
  solicitud 4.1 del documento de Backend del 20-10 (la `Idempotency-Key` al crear la sesión,
  ya confirmada).
  - **4.1 (tiempo máximo).** La evaluación de la IA es síncrona dentro de `…/answers`. Hoy el
    Gateway corta a los 30 s (`cameia-gateway`, `application.yml:97`, global) y la pantalla
    también (`src/services/http/httpClient.ts:10`); un tiempo agotado cuenta como red (§4) y
    mostraría «No hay conexión…» en vez del mensaje de CA-5.2.19 (fallo de la IA al evaluar la
    respuesta). Backend lo aceptó: el Gateway pasará a 120 s en `/api/v1/interviews/**`
    (CM-296, alinear el estándar de calidad parte 2, Sprint 4, sin fecha todavía) y la pantalla
    deberá esperar 130 s en `…/answers`, `…/reprocess`, `…/answers/audio` y `…/start`
    (solicitud 5.1 de Backend, «cuando el Gateway cambie»). **Queda pendiente, fuera de esta
    rama.** Hasta entonces, en staging el `503` de la IA puede llegar como corte a los 30 s. La
    misma subida corrige el efecto sobre la voz (HU-5.8, grabar y enviar la respuesta por voz,
    prevé Gateway 120 s y pantalla 130 s): la pantalla ya espera 130 s en `…/answers/audio`
    (`AUDIO_REQUEST_TIMEOUT_MS`), pero hasta CM-296 una grabación cuyo proceso pase de 30 s
    fallará en staging. **No comprobado** qué devuelve el Gateway al cortar: un `504` sin `code`
    mostraría el genérico; un corte de conexión, «No hay conexión…».
  - **4.2 (`…/reprocess` sobre un turno `COMPLETED`).** Responde `200` con el mismo resultado,
    sin llamar a la IA. El front ya lo trata como éxito; no requiere cambio.
- **Puntos del documento de Frontend del 22-10 (Ana Sofía), §4, confirmados por Backend el
  22-10:** los errores de `cameia-entrevista` siempre traen `detail` (4.1); los códigos del
  `409` en `…/answers` (4.2, ver §4); y que en los cuatro fallos de transcripción la respuesta no
  se registra, el turno no avanza y se descarta el audio (4.3; CA-5.12.7 a CA-5.12.10).
- La pregunta 1 llega desde la pantalla de inicio (HU-4.5, CM-213).

## 9. Notas

**Decisiones del equipo**

- **D7 · «Pregunta k de 5» literal, sin mayúsculas.** El backlog fija el texto «Pregunta k de
  5» (CA-5.2.1, CA-5.2.14) y la etiqueta del arco lo mostraba en mayúsculas por CSS. Se quita en
  la molécula `ProgressArc`: su único consumidor es `SessionStage`, la clase está en un
  elemento interno que `className` no alcanza, y una molécula del design system no debe
  cambiar la forma de un texto que recibe ya traducido (CLAUDE.md §14.7).
- **D8 · La píldora «Simulación · Texto» (`interview:sesion.modoYForma`) se queda.** Elemento
  mínimo de UX que no contradice el backlog; acuerdo del equipo para cambios mínimos sin pasar
  por el PO. Es el único texto del chat que no sale de los criterios de HU-5.2: se arma con las
  etiquetas existentes de modalidad y forma de respuesta. Verificada a mano el 22-10: se lee bien
  (bitácora, Tarea 8).
- **Decisiones del spike CM-316 (CM-316 D1 a D8)** en
  `docs/decisiones/23102026_v1_decisiones-spike-cm316-hu-5-8.md`; se aplican en §5, §6 y §7.
- **Revisión de Figma (CLAUDE.md §13), CM-317.** Hecha por Juan José Arias el 23-10-2026.
  PRT-05.10 es solo referencia y cambió mucho; manda el diseño aprobado por Ana Sofía,
  «Escenario + orbe» (§3).

**Contrato acordado con Backend (22-10-2026), sección de #101.** Se repartió así, sin perder
nada: los nombres en camelCase y la respuesta común están en §5; `…/start` está en §5 («Las
demás rutas»); `sessionLanguage` está en §4 («Entrada»); `LLM_LIMIT_REACHED` está en la tabla de
errores de §4; los rechazos del audio están en §5 («Qué muestra la pantalla al enviar audio»).
Del inicio (interview-setup): `PLANNING_RETRIES_EXHAUSTED` deja solo «Cancelar»
(CA-4.5.19), y el contador lo lleva Backend; el local de 2 queda solo como respaldo visual
(documento de Backend del 20-10, §5, pregunta 2).

**Otras notas**

- El orbe solo anuncia «Procesando tu respuesta…». No hay botón de salida en el chat
  (CA-5.2.15, y el backlog no lo define).
- El número total de preguntas viene del backend en el progreso (CLAUDE.md §3.7).
- Hay una `Idempotency-Key` por turno y forma de respuesta (`idempotencyKeyFor` en el hook): el
  reenvío tras perder la conexión reutiliza la del audio (CA-5.8.22); pasar a texto en la misma
  pregunta usa otra, porque la respuesta se registra como escrita en `…/answers` (CA-5.8.19).
- **Lectura de CA-5.8.4 frente a 5.8.10 y 5.8.11.** CA-5.8.4 parte de que «ya se detectó la voz
  mínima», pero 5.8.10 y 5.8.11 hacen seleccionar «Detener» con 1,9 s de voz o en silencio. Se
  lee que «Detener» está disponible desde que empieza la grabación y que la voz mínima decide si
  se habilita «Enviar» o se muestra «No detectamos tu voz, intenta de nuevo.» (nota añadida del
  archivo de criterios).
- **130 s y el Gateway:** ver §8 (4.1).
- **Formato no admitido: se oculta «Grabar» (lectura del front).** Las notas técnicas de HU-5.8
  (O75, backlog v8.4) piden no enviar el audio y mostrar «Tu navegador no permite grabar.
  Responderás por texto.» con el campo de texto, pero no dicen qué pasa con «Grabar». Se oculta:
  en el mismo navegador, grabar otra vez daría el mismo resultado, y es coherente con CA-4.3.7,
  que en el asistente deja Audio deshabilitado y Texto preseleccionado.
- `useCanRecordAudio.ts` (`interview-setup`, CA-4.3.7) aún acepta `audio/mp4` sin códec; se
  alinea con las notas técnicas de HU-5.8 (O75, backlog v8.4) en otro PR de `interview-setup`.
- Safari (macOS e iOS) no se prueba por ahora (CA-5.14.6, decisión del PO del 23-10).

**Defectos que corrige CM-317**

- `start()` no se cancela tras el `await`: descartar o desmontar en `requesting` deja el
  micrófono abierto.
- `new AudioContext()` está fuera del `try` (`useVoiceRecorder.ts:87`): si falla, la grabación
  queda colgada en `requesting`.
- Sin `mimeType` válido el grabador usa el formato por defecto (`useVoiceRecorder.ts:95`).
- El temporizador de 20 s (`InterviewSessionPage.tsx:105`) no se limpia: tras un reenvío el aviso
  puede salir antes de tiempo.
- El aviso de CA-5.8.24 se oculta al pulsar «Grabar» (`InterviewSessionPage.tsx:190`), aunque se
  niegue el permiso.
- «Enviar» usa el modo de carga de `Button` (`VoiceAnswerComposer.tsx:90-92`), que oculta la
  etiqueta (`Button.tsx:124-125`): el nombre accesible pasa a «Procesando tu respuesta…»,
  contra CM-316 D7 y CA-5.8.6.
- Un `503 LLM_*` al enviar audio no descarta la grabación (`useInterviewTurn.ts:190-194`): tras
  un «Reintentar» exitoso, la pregunta siguiente queda en `stopped` con el audio anterior y
  «Enviar» lo mandaría para el turno nuevo. Deducido del código; lo fija la prueba de §6.
- `413`, `415` y `422` sin `code` de transcripción conservan la grabación, que fallaría igual al
  reenviarla (§5).
- Pruebas que faltan: ver §6, «HU-5.8 (CM-317): criterios y plan de pruebas».
- Encabezados con un backlog viejo: ver la tarea 8 del Anexo A.

**Anotado para después (fuera de alcance de CM-217)**

- **D6 · Tipos de fallo sin llaves de i18n en el hook.** CLAUDE.md pide que el mensaje lo
  decida la página; hoy el hook devuelve llaves de `errors` (`SubmitErrorKey`, en
  `submitError` y `retryError`) y también nombra las de `interview:sesion.voz`
  (`AudioRejection`, de CM-317). Cambiarlo tocaría código de CM-317 (voz, #101), así que sale de
  esta rama y se acuerda antes con Frontend.
- El mapper exige `nextQuestion = null` tras la pregunta 5 (contrato del 20-10, §6.5): si
  Backend omitiera el campo en vez de mandar `null`, el chat mostraría el genérico (D10). Se
  revisa cuando exista la OpenAPI.
- Un `200` cuyo cuerpo no es JSON (`src/services/http/httpClient.ts:125`) y
  `BackendNotConfiguredError` (`httpClient.ts:57`) siguen mostrando «No hay conexión…»: lo
  resuelve `services/`, compartido, no esta feature (§4, D10).
- `EvaluationRetryPanel` usa el modo de carga de `Button` (`EvaluationRetryPanel.tsx:39-41`):
  CA-5.2.19 (fallo de la IA al evaluar la respuesta) no exige que «Reintentar» conserve su
  nombre; se deja así.
- El TSDoc de `reprocessTurn` (`api/interviewSession.api.ts:48`) solo menciona `LLM_UNAVAILABLE`;
  falta `LLM_LIMIT_REACHED`.
- Botón Atrás del navegador tras «Ir al inicio»: el estado del historial devuelve la pregunta 1
  con claves nuevas (HU-5.7, retomar una entrevista).
- Sombras de `BrandOrb` con valores arbitrarios en vez de tokens de elevación (CLAUDE.md §6).
- Caracteres de ancho cero (U+200B, U+200C, U+200D, U+2060): `trim()` no los quita, así que una
  respuesta formada solo por ellos no cuenta como vacía en CA-5.2.3 (respuesta vacía o de solo
  espacios).
- Las constantes 4000 y 2 viven en el front (`model/interviewSession.constants.ts`), en
  tensión con CLAUDE.md §3.7 (ninguna constante de negocio hardcodeada).
- El ejemplo del TSDoc de `src/utils/unicodeLength.ts` es incorrecto (línea 4): 👩‍💻 mide 5 con
  `String.length`, no 1, y son 3 puntos de código. Es una utilidad compartida; se corrige
  fuera de CM-217.

## Anexo A · Tareas de CM-317

En orden. Las pruebas se escriben en rojo antes de la implementación, como en CM-217.

| # | Tarea | CA o decisión | Estado |
| --- | --- | --- | --- |
| 1 | Verificar lo que el ADR 0009 dejó sin comprobar: `?url` hacia `onnxruntime-web/dist/…` (el `exports` del paquete no expone esas rutas), `pnpm dev` (rutas `/@fs/`, worklet, `.mjs`) y `vite build` | CM-316 D2 | Hecha (23-10-2026; bitácora CM-317, Tarea 1) |
| 2 | `vite.config.ts` (`assetFileNames` para `vad/`) y `hooks/sileroVad.ts`: URLs `?url` y creación de MicVAD con las opciones de §7 | Notas técnicas de HU-5.8 (O75, backlog v8.4); CM-316 D2; base de CA-5.8.9 a 5.8.11 | Pendiente |
| 3 | Pruebas en rojo de `hooks/useVoiceRecorder.test.ts` | CA-5.8.2, 5.8.3, 5.8.4, 5.8.7, 5.8.9, 5.8.10, 5.8.11, 5.8.23, 5.8.25; notas técnicas de HU-5.8 (O75, backlog v8.4); CM-316 D4, D6; cancelación | Pendiente |
| 4 | Pruebas en rojo de la página (filas «Nueva» y «Se amplía» de §6) | CA-5.8.5, 5.8.6, 5.8.8, 5.8.11, 5.8.13 a 5.8.15, 5.8.19, 5.8.21, 5.8.22, 5.8.24, 5.8.25; notas técnicas de HU-5.8 (O75, backlog v8.4); CM-316 D7, D8; audio de la pregunta anterior | Pendiente |
| 5 | `useVoiceRecorder.ts`: MicVAD, conteo de tramos, orden de arranque, cancelación por intento, `vadFailed` y `unsupported`, tope con `performance.now`; sin medición por energía ni `AudioContext` propio | CA-5.8.2, 5.8.3, 5.8.4, 5.8.7, 5.8.9 a 5.8.11, 5.8.23, 5.8.25; notas técnicas de HU-5.8 (O75, backlog v8.4); CM-316 D4, D6 | Pendiente |
| 6 | Revisar PRT-05.10 en Figma (CLAUDE.md §13) | CA-5.8.25 | Hecha (Juan José Arias, 23-10-2026; manda «Escenario + orbe», §9) |
| 7 | Página y `VoiceAnswerComposer`: «Enviar» sin modo de carga, con spinner visible y nombre accesible «Enviar» (CM-316 D7); aviso según CM-316 D8; temporizador de 20 s ligado al envío y limpiado; **descarte de la grabación tras un `503 LLM_*` con audio, para que tras un «Reintentar» exitoso la pregunta siguiente quede en `idle` sin el audio anterior**; descarte tras `413`, `415` y `422` genéricos; mensajes de CA-5.8.25 y del formato no admitido (sin «Grabar»); llave nueva en `es-CO` y `en` | CA-5.8.5, 5.8.6, 5.8.13 a 5.8.15, 5.8.24, 5.8.25; notas técnicas de HU-5.8 (O75, backlog v8.4); CM-316 D7, D8 | Pendiente |
| 8 | Encabezados v8.2 → v8.4 (`model/interviewSession.constants.ts`, `pages/InterviewSessionPage.voice.test.tsx`) y TSDoc de `useVoiceRecorder` sin «provisional» | — | Pendiente |
| 9 | `pnpm typecheck && pnpm lint && pnpm test`; `vite build`: chunk de Silero aparte y los cuatro archivos en `dist/vad/` | CLAUDE.md §2, ADR 0009 | Pendiente |
| 10 | Verificación manual en Chrome, Edge y Firefox (Windows): 2 s, 1,9 s, silencio, 3:00, permiso negado, sin micrófono, asset bloqueado en DevTools; bitácora `docs/bitacora-ia/CM-317.md` | CA-5.8.2 a 5.8.4, 5.8.7, 5.8.9 a 5.8.11, 5.8.23, 5.8.25 | Pendiente |
| 11 | Cierre del SPEC: archivos nuevos en la tabla de §7 y estados del plan de §6 | CLAUDE.md §16 | Pendiente |
