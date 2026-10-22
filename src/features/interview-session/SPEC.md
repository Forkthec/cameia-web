---
feature: interview-session
estado: EN_CURSO
hu: [HU-5.2, HU-5.8]
prt: [PRT-05.10, PRT-05.12]
jira: [CM-217, CM-317]
rutas: [/entrenar/sesion/:sessionId]
documentacion: tsdoc-es
backlog: 20102026_01_v8.3
decisiones: []
figma: Cameia · Mockups MVP
revisado: 2026-10-22
---

# Feature · Chat de la entrevista (Simulación)

## 1. Propósito

Pantalla donde el Usuario responde, una por una, las 5 preguntas principales de una
Simulación en curso, sin ver retroalimentación hasta el final: HU-5.2 (responder por escrito
cada pregunta principal y avanzar sin ver retroalimentación). La verdad para QA es el archivo
de criterios de HU-5.2 del backlog v8.3 (`20102026_01_Backlog_v8_3.xlsx`, hoja HE-05), no este
SPEC.

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
| `409 SESSION_TRANSITION_NOT_ALLOWED`, `409 SESSION_CONFLICT`, `409` otra `Idempotency-Key` | `…/answers` | otro | — | `errors:generico` | CA-5.2.6 (entrevista que no está en curso), CA-5.2.11 (reenvío de la misma respuesta) |
| `500 INTERNAL_ERROR`, `503 DATABASE_UNAVAILABLE`, sin `code` | `…/answers` | otro | — | `errors:generico` | — |
| `200` con forma inesperada (D10) | `…/answers` | otro | — | `errors:generico`; se conservan texto, pregunta y progreso | — |
| Sin respuesta HTTP (`fetch` rechazado o tiempo agotado) | `…/answers` | red | — | `errors:red`; se conservan texto, pregunta y progreso | CA-5.2.18 (envío sin conexión) |
| `LLM_UNAVAILABLE` o `LLM_LIMIT_REACHED` | `…/reprocess` | evaluación | **Sí** (D3, por `code`) | 1.º: `errors:generico`; 2.º en adelante: `interview:sesion.reintentosAgotados` | CA-5.2.19, CA-5.2.20 (reintentos agotados) |
| Sin respuesta HTTP | `…/reprocess` | red | No | `errors:red`; «Reintentar» sigue | D4 |
| `404` | `…/reprocess` | no encontrada | No | `errors:codigos.NOT_FOUND`; «Reintentar» sigue | D4 |
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

**Rechazos del audio (CM-317, hecho en #101).** Solo en `…/answers/audio`, sin registrar
respuesta ni gastar intento: `422 TRANSCRIPTION_EMPTY` → «No detectamos tu voz, intenta de
nuevo.» (CA-5.12.7); `422 TRANSCRIPTION_TOO_LONG` → «Tu respuesta es demasiado larga…»
(CA-5.12.9); `422 TRANSCRIPTION_LANGUAGE_MISMATCH` → «Tu entrevista es en inglés/español…»,
según `sessionLanguage` (CA-5.12.10); `503 TRANSCRIPTION_UNAVAILABLE` → «No pudimos transcribir
tu respuesta…» con «Grabar de nuevo» (CA-5.12.8). En todos se descarta la grabación y se puede
grabar otra vez o responder por texto (`AUDIO_REJECTIONS` en el hook; `voiceNotice` en la
página).

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
| D7 | `ProgressArc.test.tsx`: la etiqueta no fuerza mayúsculas | La etiqueta no lleva la clase `uppercase`. Es una prueba débil (jsdom no aplica Tailwind): se completa con **verificación manual en el paso 6** («Pregunta k de 5» visible tal cual en el navegador) | Hecha |

## 7. Estado de implementación

| Archivo | Estado |
| --- | --- |
| `src/features/interview-session/pages/InterviewSessionPage.tsx` | Hecho; contrato previsto y avisos de voz (#101); envía la respuesta sin recortar y el panel muestra el mensaje del último fallo de reprocess (D4) |
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
| `src/features/interview-session/model/interviewSession.constants.ts` | Hecho; tope de 2 |
| `src/features/interview-session/hooks/useVoiceRecorder.ts` | Hecho (detección provisional) |
| `src/features/interview-session/organisms/VoiceAnswerComposer/VoiceAnswerComposer.tsx` | Hecho |
| `src/design-system/molecules/BrandOrb/BrandOrb.tsx` | Hecho |
| `src/design-system/molecules/ProgressArc/ProgressArc.tsx` | Hecho; la etiqueta se muestra sin mayúsculas forzadas (D7) |
| `src/mocks/handlers/interviewSessions.handlers.ts` | Hecho con el contrato previsto (#101); cuenta puntos de código NFC sin recortar y copia VALIDATION_FAILED con un comentario (D2, D9) |
| `src/features/interview-session/pages/InterviewSessionPage.test.tsx` | Hecha; cubre el plan de §6 |
| `src/features/interview-session/pages/InterviewSessionPage.voice.test.tsx` | Hecho; contrato previsto y rechazos del audio en #101 |
| `src/design-system/molecules/ProgressArc/ProgressArc.test.tsx` | Hecha (D7, prueba débil; falta la revisión manual del paso 6) |

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
- **Rechazo de Backend al transcribir:** aviso de §4 («Rechazos del audio»), se descarta la
  grabación y quedan «Grabar» (o «Grabar de nuevo» tras `TRANSCRIPTION_UNAVAILABLE`) y «Responder
  por texto» (CA-5.12.7 a CA-5.12.10; #101).

## 8. Bloqueos

- Backend: `…/answers`, `…/reprocess` y `…/answers/audio` no existen en cameia-entrevista
  (solo `/health`). Sin ellos no se puede probar contra el backend real; el Sprint 3 cierra la
  subtarea de Frontend con datos simulados (planeación del 15/10).
- **Pendientes con Backend (no se implementan aquí):** solicitudes 4.1 (tiempo máximo) y 4.2
  (`…/reprocess` sobre un turno `COMPLETED`) de
  `21102026_v1_solicitud-frontend-a-backend-tiempo-y-reproceso-hu-5-2.md` (Juan José, 21-10).
  No son la solicitud 4.1 del documento de Backend del 20-10 (la `Idempotency-Key` al crear la
  sesión, ya confirmada).
  - **4.1 (tiempo máximo).** La evaluación de la IA es síncrona dentro de `…/answers`. El corte
    de 30 s del Gateway está verificado en `cameia-gateway` (`develop`),
    `src/main/resources/application.yml:97` (`response-timeout: ${GATEWAY_TIMEOUT_MS:30000}ms`),
    y es global; en GCP el valor llega por variable de entorno (`application-prod.yml:2`). La
    pantalla también corta a los 30 s (`src/services/http/httpClient.ts:10`). Hoy un tiempo
    agotado cuenta como red (§4) y mostraría «No hay conexión…» en vez del mensaje de CA-5.2.19
    (fallo de la IA al evaluar la respuesta). **Este caso se revisa con la respuesta de Backend
    a la 4.1.**
  - **Efecto sobre la voz (fuera de CM-217, pendiente de Backend).** Si ese corte global aplica
    a `…/answers/audio`, la respuesta por voz se cortaría a los 30 s, antes de sus 130 s
    (HU-5.8, grabar y enviar la respuesta por voz, prevé Gateway 120 s y pantalla 130 s).
  - **4.2.** Qué responde `…/reprocess` sobre un turno ya `COMPLETED`.
- **Puntos del documento de Frontend del 22-10 (Ana Sofía), §4, que tocan esta feature:**
  4.1 (que los errores de `cameia-entrevista` siempre traigan `detail`, ver §9), 4.2 (el `code`
  del `409` por otra clave en el mismo turno: hoy cae en el genérico, §4) y 4.3 (si con `503
  TRANSCRIPTION_UNAVAILABLE` la respuesta no queda registrada; CM-317).
- La pregunta 1 llega desde la pantalla de inicio (HU-4.5, CM-213).
- **Detección de voz provisional:** el backlog pide Silero VAD (spike CM-316); instalarla necesita
  permiso (CLAUDE.md §2). Mientras tanto `useVoiceRecorder` mide la energía de la señal con la Web
  Audio API; el backend revalida con 1,5 s de tolerancia.

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
  etiquetas existentes de modalidad y forma de respuesta.

**Contrato acordado con Backend (22-10-2026), sección de #101.** Se repartió así, sin perder
nada: los nombres en camelCase y la respuesta común están en §5; `…/start` está en §5 («Las
demás rutas»); `sessionLanguage` está en §4 («Entrada»); `LLM_LIMIT_REACHED` está en la tabla de
errores de §4; los rechazos del audio están en §4 («Rechazos del audio») y en «Respuesta por
voz» de §7. Del inicio (interview-setup): `PLANNING_RETRIES_EXHAUSTED` deja solo «Cancelar»
(CA-4.5.19), y el contador lo lleva Backend; el local de 2 queda solo como respaldo visual
(documento de Backend del 20-10, §5, pregunta 2).

**Otras notas**

- El orbe solo anuncia «Procesando tu respuesta…». No hay botón de salida en el chat
  (CA-5.2.15, y el backlog no lo define).
- El número total de preguntas viene del backend en el progreso (CLAUDE.md §3.7).
- Hay una `Idempotency-Key` por turno y forma de respuesta (`idempotencyKeyFor` en el hook):
  pasar de voz a texto en la misma pregunta usa otra clave (CA-5.8.22).

**Anotado para después (fuera de alcance de CM-217)**

- **D6 · Tipos de fallo sin llaves de i18n en el hook.** CLAUDE.md pide que el mensaje lo
  decida la página; hoy el hook devuelve llaves de `errors` (`SubmitErrorKey`, en
  `submitError` y `retryError`) y también nombra las de `interview:sesion.voz`
  (`AudioRejection`, de CM-317). Cambiarlo tocaría código de CM-317 (voz, #101), así que sale de
  esta rama y se acuerda antes con Frontend.
- El mapper exige `nextQuestion = null` tras la pregunta 5 (contrato del 20-10, §6.5): si
  Backend omitiera el campo en vez de mandar `null`, el chat mostraría el genérico (D10). Se
  revisa cuando exista la OpenAPI.
- `tracking-[0.24em]` de la etiqueta de `ProgressArc` estaba pensado para mayúsculas; sin ellas
  (D7) puede verse demasiado separado. Se revisa en el paso 6, en el navegador.
- Un `200` cuyo cuerpo no es JSON (`src/services/http/httpClient.ts:125`) y
  `BackendNotConfiguredError` (`httpClient.ts:57`) siguen mostrando «No hay conexión…»: lo
  resuelve `services/`, compartido, no esta feature (§4, D10).
- `EvaluationRetryPanel` usa el modo de carga de `Button` (`EvaluationRetryPanel.tsx:39-41`):
  CA-5.2.19 (fallo de la IA al evaluar la respuesta) no exige que «Reintentar» conserve su
  nombre; se deja así.
- El TSDoc de `reprocessTurn` (`api/interviewSession.api.ts:48`) solo menciona `LLM_UNAVAILABLE`;
  falta `LLM_LIMIT_REACHED`.
- `errorMap.ts` exige `title` y `detail` para leer el `code` (`src/services/http/errorMap.ts:51`):
  un `ProblemDetail` sin `detail` pierde el `code` y cae en el genérico (CM-298, ADR-0008). Es el
  punto 4.1 del documento de Frontend del 22-10.
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
