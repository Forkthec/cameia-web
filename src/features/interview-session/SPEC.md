---
feature: interview-session
estado: EN_CURSO
hu: [HU-5.2, HU-5.8, HU-5.5]
prt: [PRT-05.10, PRT-05.12]
jira: [CM-217, CM-317, CM-221, CM-226]
rutas: [/entrenar/sesion/:sessionId]
documentacion: tsdoc-es
backlog: 11112026_03_v11.3
decisiones: [23102026_v1_decisiones-spike-cm316-hu-5-8.md]
figma: Cameia · Mockups MVP
revisado: 2026-11-13
---

# Feature · Chat de la entrevista (Simulación)

## 1. Propósito

Pantalla donde el Usuario responde, una por una, las 5 preguntas principales de una
Simulación en curso, sin ver retroalimentación hasta el final: HU-5.2 (responder por escrito
cada pregunta principal y avanzar sin ver retroalimentación) y HU-5.8 (grabar y enviar la
respuesta por voz). La verdad para QA no es este SPEC, sino el archivo de criterios de cada HU:
HU-5.2, `11112026_03_HU-5_2_criterios_backlog_v11_3.md` (backlog v11.3,
`11112026_03_Backlog_v11_3.xlsx`, hoja HE-05, filas 7 a 26; ver abajo); HU-5.8,
`23102026_02_HU-5_8_criterios_backlog_v8_4.md`
(25 CA, backlog v8.4, `23102026_01_Backlog_v8_4.xlsx`, hoja HE-05), verdad de QA de CM-317. Los
dos viven fuera del repositorio (`cameia-backup/criterios/`).
El backlog vigente es el v8.5 (`23102026_02_Backlog_v8_5.xlsx`), que solo cambió CA-5.14.1; HU-5.8
es igual a la v8.4, así que su archivo de criterios v8.4 sigue vigente.

**HU-5.2 contra el backlog v11.3 (CM-217, 11-11-2026).** El backlog vigente para HU-5.2 es el
v11.3 (`11112026_03_Backlog_v11_3.xlsx`) y su archivo de criterios es
`11112026_03_HU-5_2_criterios_backlog_v11_3.md`. La v11.3 no toca HU-5.2: los 20 CA son
idénticos a los de la v11.2 (las diferencias de HE-05 son de HU-5.6).

Las decisiones del spike CM-316 (`docs/decisiones/23102026_v1_decisiones-spike-cm316-hu-5-8.md`)
se citan «CM-316 D1» a «CM-316 D8», para no confundirlas con las D1 a D10 de CM-217 de este SPEC.
Las decisiones de CM-217 para el backlog v11.3 se citan «v11.3 D1» a «v11.3 D11» (§9), por la
misma razón; D7 a D11 alinean el chat con el contrato real de `cameia-entrevista` (13-11-2026).

## 2. Alcance

**Ya en `develop` (CM-217, CM-317):** respuesta escrita; «Enviar» bloqueado vacío o doble;
progreso «Pregunta k de 5»; errores de red, de la IA y de entrevista ajena; «Reintentar» (2
usos en el panel de CA-5.2.19) e «Ir al inicio», con «Reintentar» todavía sin tope en el panel
de CA-5.2.20 (lo corrige v11.3 D2); tras la pregunta 5, el cierre de HU-5.5 (CM-221, #126);
respuesta por voz con datos simulados. Desde el PR #101 (`836d8e3`): contrato previsto de Backend en las tres rutas
de respuesta (D1), `LLM_LIMIT_REACHED` en `…/answers` y los rechazos del audio al transcribir.

**En la rama `CM-217-reintentos-y-errores-v11-3` (CM-217, backlog v11.3):** solo HU-5.2.
`LLM_INVALID_OUTPUT` como fallo de la IA en `…/answers` y `…/reprocess` (CA-5.2.19, v11.3 D1);
segundo tramo de «Reintentar» en el panel de CA-5.2.20, con 2 usos más y después solo «Ir al
inicio» (v11.3 D2); la prueba de CA-5.2.6 (v11.3 D3); la lectura escrita de CA-5.2.5 (v11.3 D4).
Sin textos nuevos (v11.3 D5). Lo que queda fuera está en v11.3 D6. Plan de pruebas en §6.
Frente al contrato real de `cameia-entrevista` (`origin/develop` `48773cb`, 13-11-2026): los
`409` de `…/reprocess` (`TURN_RETRY_LIMIT_REACHED`, `SESSION_*` y `TURN_NOT_RETRYABLE`, v11.3
D7 a D9), los mocks de `…/answers` y `…/reprocess` (v11.3 D10) y los comentarios del contrato
(v11.3 D11). Sin leer `…/state` (HU-5.7).

**Hecho antes, en la rama `CM-217-contrato-y-errores-chat-simulacion` (CM-217):** archivo de códigos
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
llaves de i18n en el hook (D6, §9). Tampoco entra en CM-217 lo de v11.3 D6: quién cuenta los
usos de «Reintentar» al recargar y si `…/state` expone `RETRYING` (Backend, CM-216; respondido
el 13-11, ver v11.3 D7); `SESSION_ABANDONED` y `SESSION_ALREADY_CLOSED` en `…/answers` (HU-5.5;
en `…/reprocess`, v11.3 D8); el historial vacío (CA-4.5.16). Lo anotado para después está en
§9.

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
  ajena o inexistente); `409 SESSION_TRANSITION_NOT_ALLOWED` → «Esta entrevista ya no admite
  esa acción.» (CA-5.2.6, envío a una entrevista que no está en curso); fallo de la IA
  (`LLM_UNAVAILABLE`, `LLM_LIMIT_REACHED` o `LLM_INVALID_OUTPUT`) → «Ocurrió un error.
  Inténtalo de nuevo.» + «Reintentar» (CA-5.2.19, fallo de la IA al evaluar la respuesta); tras
  2 «Reintentar» fallidos → mensaje de CA-5.2.20 (reintentos de evaluación agotados) +
  «Reintentar» + «Ir al inicio»; tras 2 fallidos más (4 en total) → el mismo mensaje sin
  «Reintentar», solo con «Ir al inicio» (v11.3 D2). Al reintentar, `409
  TURN_RETRY_LIMIT_REACHED` → ese mismo estado final (v11.3 D7); `409 SESSION_*` → el mismo
  cierre que al enviar (v11.3 D8); `409 TURN_NOT_RETRYABLE` → genérico sin «Reintentar», con
  «Ir al inicio» (v11.3 D9). Cualquier otro error → genérico.
- **Éxito:** pregunta siguiente con su texto original y «Pregunta k+1 de 5», sin
  retroalimentación (CA-5.2.1, respuesta registrada y avance; CA-5.2.14, siguiente pregunta con
  su texto original); tras la 5, sin campo ni «Enviar», sigue el cierre de HU-5.5 (CA-5.2.5,
  respuesta a la última pregunta; v11.3 D4; ver «Cierre de la entrevista»).

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
`…/answers` y `…/reprocess`. CM-217 (v11.3 D1) agrega `LLM_INVALID_OUTPUT`, el tercer `code`
de CA-5.2.19 y CA-5.2.20 («Cambios v10», fila 57, #146). Los `409` de HU-5.5
(`SESSION_ABANDONED`, `SESSION_ALREADY_CLOSED`, `SESSION_TRANSITION_NOT_ALLOWED`) los agregó
#126. CM-217 (v11.3 D7 y D9) agrega solo `TURN_RETRY_LIMIT_REACHED` y `TURN_NOT_RETRYABLE` de
`…/reprocess`, copiados de `ErrorCode.java:183-186` de `cameia-entrevista`: son los únicos
códigos nuevos del contrato real que cambian lo que se ve. Los demás (`ANSWER_ALREADY_EXISTS`,
`TURN_CONFLICT`, `IDEMPOTENCY_KEY_CONFLICT`, los `errors[].code` del `422`…) siguen en el
genérico (ADR-0008) y no entran al archivo. El hook y las pruebas los **importan** de ese archivo. Los mocks
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

**Errores.** Tope de «Reintentar» (D5, cambiado por v11.3 D2), en dos tramos:

- **Tramo 1** (panel de CA-5.2.19): 2 usos fallidos; `MAX_EVALUATION_RETRIES = 2`
  (`model/interviewSession.constants.ts`). Sin cambios.
- **Tramo 2** (panel de CA-5.2.20): 2 usos fallidos más; constante nueva en el mismo archivo.
  Tras el 2.º fallo de este tramo (4.º uso fallido en total), el mismo mensaje sin «Reintentar».

Como máximo, 4 llamadas a `…/reprocess` por respuesta. Fuente: «Cambios v11.2», filas 12 a 14
(#290 a #292), que reemplazan la lectura de «Cambios v4», fila 8 (2 usos, 3 llamadas a la IA) y
el «sin límite» de «Cambios v10», fila 58. Solo suma un fallo de evaluación (D4).

Backend lleva su propio tope y **manda** (v11.3 D7): 4 usos por turno, persistidos, que suman en
la reserva aunque la evaluación termine en otro error o el cliente corte (`InterviewTurn.java:19`;
`ReprocessTurnService.java:127-142`). El contador del front decide los tramos en el flujo
normal, donde los dos avanzan a la par; si Backend llega antes al tope, su `409
TURN_RETRY_LIMIT_REACHED` lleva al estado final de CA-5.2.20.

| Code o situación | Petición | Clase | ¿Suma al tope? | Llave i18n | CA |
| --- | --- | --- | --- | --- | --- |
| `503 LLM_UNAVAILABLE` | `…/answers` | evaluación → panel | No (es el primer fallo) | `errors:generico` + «Reintentar» | CA-5.2.19 (fallo de la IA al evaluar) |
| `503 LLM_LIMIT_REACHED` | `…/answers` | evaluación → panel (D3, hecho en #101) | No (primer fallo) | `errors:generico` + «Reintentar» | CA-5.2.19 |
| `503 LLM_INVALID_OUTPUT` | `…/answers` | evaluación → panel (v11.3 D1, hecho en CM-217) | No (primer fallo) | `errors:generico` + «Reintentar» | CA-5.2.19 |
| `404` (con o sin `code`, p. ej. `SESSION_NOT_FOUND` o `TURN_NOT_FOUND`) | `…/answers` | no encontrada | — | `errors:codigos.NOT_FOUND` | CA-5.2.7 (entrevista ajena o inexistente) |
| `422 VALIDATION_FAILED` (`errors[].code` `ANSWER_TEXT_REQUIRED`, `ANSWER_TEXT_TOO_LONG`, `IDEMPOTENCY_KEY_REQUIRED`…) | `…/answers` | otro | — | `errors:generico` | CA-5.2.9 / 5.2.10 (la interfaz no deja llegar aquí) |
| `409 SESSION_TRANSITION_NOT_ALLOWED` | `…/answers` | cerrada (fase `closed`, hecho en #126) | — | `interview:sesion.noAdmite` («Esta entrevista ya no admite esa acción.»); sin campo, sin «Enviar» y sin acción de salida (hallazgos de v11.3 D3, §9) | CA-5.2.6 (envío a una entrevista que no está en curso) |
| `409 SESSION_ABANDONED`, `409 SESSION_ALREADY_CLOSED` | `…/answers` | cerrada (HU-5.5, #126) | — | ver «Cierre de la entrevista» | CA-5.5.4, CA-5.5.5 (fuera de CM-217, v11.3 D6) |
| `409 IDEMPOTENCY_KEY_CONFLICT` (la misma clave con otro `turnId` o texto: p. ej., la respuesta llegó a Backend, se perdió por un corte y la persona editó el texto antes de reenviar; `RegisterAnswerService.java:248-252`) | `…/answers` | otro | — | `errors:generico`; se conservan texto, pregunta y progreso. La pregunta no avanza: recuperarlo necesita `…/state` (anotado para después) | CA-5.2.11, CA-5.2.18 (borde) |
| `409 ANSWER_ALREADY_EXISTS`, `409 TURN_CONFLICT` | `…/answers` | otro | — | `errors:generico` (el backlog no define textos para ellos; ADR-0008 permite el genérico) | CA-5.2.11 (reenvío de la misma respuesta) |
| `500 INTERNAL_ERROR`, `503 DATABASE_UNAVAILABLE`, sin `code` | `…/answers` | otro | — | `errors:generico` | — |
| `200` con forma inesperada (D10) | `…/answers` | otro | — | `errors:generico`; se conservan texto, pregunta y progreso | — |
| Sin respuesta HTTP (`fetch` rechazado o tiempo agotado) | `…/answers` | red | — | `errors:red`; se conservan texto, pregunta y progreso | CA-5.2.18 (envío sin conexión) |
| `LLM_UNAVAILABLE`, `LLM_LIMIT_REACHED` o `LLM_INVALID_OUTPUT` | `…/reprocess` | evaluación | **Sí** (D3 y v11.3 D1, por `code`) | 1.º: `errors:generico` + «Reintentar»; 2.º y 3.º: `interview:sesion.reintentosAgotados` + «Reintentar» + «Ir al inicio»; 4.º: `interview:sesion.reintentosAgotados` + solo «Ir al inicio» (v11.3 D2) | CA-5.2.19, CA-5.2.20 (reintentos de evaluación agotados) |
| Sin respuesta HTTP | `…/reprocess` | red | No | `errors:red`; «Reintentar» sigue | D4 |
| `404` | `…/reprocess` | no encontrada | No | `errors:codigos.NOT_FOUND`; «Reintentar» sigue | D4 |
| `409 TURN_RETRY_LIMIT_REACHED` (Backend ya contó 4 usos del turno) | `…/reprocess` | tope de Backend (v11.3 D7) | Lleva el contador al tope, vaya donde vaya el del front | `interview:sesion.reintentosAgotados`, **sin** «Reintentar» y con «Ir al inicio»: el estado final de CA-5.2.20 | CA-5.2.20 |
| `409 SESSION_TRANSITION_NOT_ALLOWED`, `409 SESSION_ALREADY_CLOSED` | `…/reprocess` | cerrada (fase `closed`, v11.3 D8, con `toClosedReason` sin cambios) | No | `interview:sesion.noAdmite` («Esta entrevista ya no admite esa acción.»); sin panel, sin «Reintentar» y sin «Ir al inicio», como en `…/answers` | CA-5.2.6, CA-5.5.5 |
| `409 SESSION_ABANDONED` | `…/reprocess` | cerrada (fase `closed`, v11.3 D8) | No | `interview:sesion.abandonada` («Sesión abandonada: no genera evaluación.»); sin panel ni acciones | CA-5.5.4 |
| `409 TURN_NOT_RETRYABLE` (el turno ya no espera reintento, p. ej. una `200` de `…/reprocess` perdida) | `…/reprocess` | sin reintento posible (v11.3 D9) | No | `interview:sesion.noEsperaReintento` («Tu respuesta no está esperando un reintento.», CM-226), **sin** «Reintentar» y con «Ir al inicio», aunque no se haya agotado el tramo 1 | HU-5.6 |
| Cualquier otro error, incluidos `503 DATABASE_UNAVAILABLE` (que Backend sí cuenta, v11.3 D7), `500` y un `200` con forma inesperada | `…/reprocess` | otro | No | `errors:generico`; «Reintentar» sigue | D4 |
| `401` | cualquiera | (lo atiende `httpClient`) | — | cierre de sesión | — |

**Decisión D4 (panel de fallo de evaluación):**

- `…/reprocess` solo suma un fallo de evaluación con `code` `LLM_UNAVAILABLE`,
  `LLM_LIMIT_REACHED` o `LLM_INVALID_OUTPUT` (este último, v11.3 D1). Sin respuesta HTTP → «No
  hay conexión…»; `404` → «No encontramos lo que buscabas.»; cualquier otro error, `409`
  incluido → genérico. Ninguno de esos suma, tampoco en el tramo 2. **Excepciones del contrato
  real (13-11-2026):** `409 TURN_RETRY_LIMIT_REACHED` lleva el contador al tope (v11.3 D7);
  `409 SESSION_*` pasa a la fase `closed` (v11.3 D8); `409 TURN_NOT_RETRYABLE` deja el genérico
  sin «Reintentar» (v11.3 D9). La página muestra en el panel el mensaje del último fallo
  (`retryError`) y, si fue de la IA, el genérico o el de CA-5.2.20.
- Tras cualquier fallo de `…/reprocess`, incluido un `404`, el panel **sigue mostrando
  «Reintentar»** mientras queden usos, salvo tras los `409` de v11.3 D7 a D9. Tras el 4.º fallo
  de la IA desaparece y solo queda «Ir al inicio» (CA-5.2.20, v11.3 D2). Antes de v11.3,
  «Reintentar» seguía siempre.
- «Ir al inicio» (`/inicio`, destino de HU-10.4) aparece al agotar el tramo 1, o antes con `409
  TURN_NOT_RETRYABLE` (v11.3 D9), y **no desaparece** aunque después llegue un fallo de otro tipo. El contador solo vuelve a cero con
  una respuesta exitosa.

**Rechazos del audio (CM-317).** Ver §5, «Qué muestra la pantalla al enviar audio».

Nunca se muestran `title`, `detail`, `code` ni `requestId` (CLAUDE.md §8).

## 5. Enlace HTTP · PROVISIONAL

**Estado del contrato:** previsto, pendiente de OpenAPI · fuente: documento de Backend
`20102026_v1_respuesta-nueva-entrevista-para-frontend.md` (Paula, 20-10-2026), §6.3 (Iniciar),
§6.5 (Responder) y §6.6 (Errores). **Implementado en `develop`** por el PR #101 (`836d8e3`,
CM-217) y anunciado a Backend en `22102026_v1_respuesta-frontend-a-backend-contrato-entrevista.md`
(Ana Sofía, 22-10-2026), §3. **`…/answers` y `…/reprocess` existen** en `cameia-entrevista`
`origin/develop` `48773cb` (13-11-2026): contrato publicado, con su OpenAPI en
`InterviewSessionController` (`InterviewSessionController.java:405-505`), con la ruta, el cuerpo
y la respuesta 200 de esta tabla (v11.3 D7 a D11, §9). Las pruebas del front siguen contra MSW
(`src/mocks/handlers/interviewSessions.handlers.ts`, v11.3 D10). Los
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

Los 20 criterios de HU-5.2 por referencia: el texto literal está en
`11112026_03_HU-5_2_criterios_backlog_v11_3.md` (§1). El nombre
de cada CA es el literal del backlog. La capa (F / F y B / B) es la de la columna
«Especificaciones técnicas», según la nota del archivo de criterios; «efecto visible» marca un
criterio «B» que se ve en la interfaz. «Estado tras CM-217» es lo que queda al cerrar esta rama.

| Criterio | Capa | Qué hace el frontend que el criterio no dice | Estado tras CM-217 |
| --- | --- | --- | --- |
| CA-5.2.1 · Respuesta registrada y avance a la siguiente pregunta | F y B | El campo de la pregunta siguiente arranca vacío | Cubierto, sin cambios; solo MSW |
| CA-5.2.2 · La confirmación de la respuesta no incluye retroalimentación | B | El DTO no trae retroalimentación; la prueba de CA-5.2.1 afirma que no aparece | Solo Backend |
| CA-5.2.3 · Respuesta vacía o de solo espacios | F | Vacía = `trim()` vacío | Cubierto, sin cambios |
| CA-5.2.4 · Doble selección de "Enviar" | F y B | Guarda síncrona además de `disabled`; «Enviar» conserva su nombre y el indicador «Procesando tu respuesta…» va aparte, en `aria-live`; una `Idempotency-Key` por turno, reutilizada al reenviar | Cubierto, sin cambios; solo MSW |
| CA-5.2.5 · Respuesta a la última pregunta | F y B (antes B) | Sin campo ni «Enviar»; sigue el cierre de HU-5.5, que ya está disponible (v11.3 D4) | Sin cambios de código; se cubre en la pantalla de cierre de CM-221 (#126); de punta a punta, pendiente de CM-216 y CM-220 |
| CA-5.2.6 · Envío a una entrevista que no está en curso | B (efecto visible) | `409 SESSION_TRANSITION_NOT_ALLOWED` → «Esta entrevista ya no admite esa acción.»; además oculta el campo y «Enviar» y no ofrece salida (hallazgos, §9). Backend responde también `SESSION_ALREADY_CLOSED` (en evaluación o finalizada) y `SESSION_ABANDONED`: la columna técnica del CA, con un solo `code`, está desalineada a propósito (H-1 de la spec de CM-216; informe del 13-11, §1.6) | Hecho: prueba R7 (`…/answers`) y R10 y R11 (`…/reprocess`, v11.3 D8, 3b62d53); solo MSW |
| CA-5.2.7 · Envío a una entrevista ajena o inexistente | B (efecto visible) | Se decide por `404` (clase amplia, ADR-0008), con o sin `SESSION_NOT_FOUND` | Cubierto, sin cambios; solo MSW |
| CA-5.2.8 · Respuesta de 4000 caracteres | F y B | Conteo por puntos de código NFC (D9); se envía tal como se escribió, sin recortar | Cubierto, sin cambios; solo MSW |
| CA-5.2.9 · Respuesta de 4001 caracteres | F y B | No corta lo escrito: sin `maxLength` | Cubierto, sin cambios |
| CA-5.2.10 · Respuesta vacía enviada sin la interfaz | B | La interfaz no deja llegar; un `422` mostraría el genérico | Solo Backend |
| CA-5.2.11 · Reenvío de la misma respuesta | B | Reutiliza la `Idempotency-Key` del turno; un `409` con otra clave mostraría el genérico | Solo Backend |
| CA-5.2.12 · Respuesta guardada antes de evaluarla | B | «Reintentar» no pide texto nuevo | Solo Backend |
| CA-5.2.13 · Cierre de la respuesta k y paso a la pregunta k+1 | B | — | Solo Backend |
| CA-5.2.14 · Siguiente pregunta con su texto original | B (efecto visible) | El texto se pinta sin transformar | Cubierto, sin cambios; solo MSW |
| CA-5.2.15 · Chat de Simulación sin pausa, repregunta ni reintento | F | Aplica a entrevistas con Texto | Cubierto, sin cambios |
| CA-5.2.16 · Pregunta de seguimiento ignorada sin HU-5.9 | B | La pregunta se muestra tal como llega | Solo Backend |
| CA-5.2.17 · Retroalimentación STAR solo en preguntas conductuales | B | — | Solo Backend |
| CA-5.2.18 · Envío sin conexión | F | Solo sin respuesta HTTP; un `200` inesperado es genérico (D10) | Cubierto, sin cambios |
| CA-5.2.19 · Fallo de la IA al evaluar la respuesta | F y B | `LLM_LIMIT_REACHED` y `LLM_INVALID_OUTPUT` = `LLM_UNAVAILABLE` (D3, v11.3 D1) | Hecho: LLM_INVALID_OUTPUT (36fe335) y 409 TURN_NOT_RETRYABLE con «Ir al inicio» (v11.3 D9, 3b62d53); solo MSW |
| CA-5.2.20 · Reintentos de evaluación agotados | F y B | El front cuenta en memoria (D5, v11.3 D2) y solo suman fallos de la IA (D4), pero el tope que manda es el de Backend: 4 usos por turno, persistidos (v11.3 D7); guarda síncrona y botón deshabilitado | Hecho: dos tramos (36fe335) y 409 TURN_RETRY_LIMIT_REACHED → estado final (v11.3 D7, 3b62d53); mock con el tope de Backend (v11.3 D10); solo MSW |

### Plan de pruebas (backlog v8.3, PR #102)

Pruebas de la página en `pages/InterviewSessionPage.test.tsx` salvo que se diga otra cosa.
Las pruebas se escribieron en rojo en `ce6b98f` y pasan con la implementación de esa rama. Lo
que cambia con el backlog v11.3 está en el plan siguiente.
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
| CA-5.2.5 | tras la pregunta 5 sigue con el cierre de HU-5.5, sin campo ni «Enviar» (CA-5.2.5, backlog v11) | Título que empieza por «Tu entrevista terminó.» (el de CA-5.5.3); sin campo «Respuesta» ni botón «Enviar» | Cambiada en #126 (CM-221); se mantiene (v11.3 D4) |
| CA-5.2.7 | con una entrevista ajena o inexistente muestra «No encontramos lo que buscabas.» | `404` con `code` `SESSION_NOT_FOUND` y `404` sin `code`: el mismo mensaje en ambos casos | Hecha |
| CA-5.2.8 | acepta exactamente 4000 caracteres y los envía tal como se escribieron | Texto de 4000 caracteres con espacios al inicio y al final (p. ej. 2 + 3996 + 2): contador «4000 / 4000 caracteres»; sin mensaje de error; «Enviar» habilitado; el `answerText` recibido por el handler es idéntico a lo escrito, espacios incluidos; avanza a «Pregunta 2 de 5» | Hecha |
| CA-5.2.9 | con 4001 caracteres marca el contador, muestra el mensaje y no envía | «4001 / 4000 caracteres»; «Tu respuesta no puede superar los 4000 caracteres.»; «Enviar» deshabilitado; el campo conserva los 4001; el handler no recibe llamadas | Hecha |
| D9 (C-07) | cuenta caracteres como puntos de código NFC | 4000 emojis → «4000 / 4000 caracteres» y «Enviar» habilitado; 4001 → mensaje de CA-5.2.9; una letra con tilde combinada (e + ◌́) cuenta 1 | Hecha |
| CA-5.2.15 | en una entrevista con Texto solo muestra el campo «Respuesta» y «Enviar» | Un solo campo de texto y un solo botón («Enviar»); ningún botón ni enlace de pausar, repreguntar ni reintentar | Hecha |
| CA-5.2.18 | sin conexión muestra el aviso y conserva el texto | «No hay conexión. Revisa tu internet e inténtalo de nuevo.»; el campo conserva el texto; el título sigue siendo la pregunta 1; «Pregunta 1 de 5» | Hecha |
| D10 | una respuesta 200 con forma inesperada muestra el error genérico, no el de conexión | El handler de `…/answers` responde 200 con un cuerpo sin `progress`: aparece «Ocurrió un error. Inténtalo de nuevo.»; **no** aparece «No hay conexión…»; el campo conserva el texto y sigue «Pregunta 1 de 5» | Hecha |
| CA-5.2.19 | si la IA falla muestra el error genérico con «Reintentar» | «Ocurrió un error. Inténtalo de nuevo.»; botón «Reintentar»; sin campo; **sin** enlace «Ir al inicio»; el `detail` del cuerpo no aparece | Hecha |
| CA-5.2.19 | «Reintentar» con éxito avanza a la pregunta siguiente | «Pregunta 2 de 5» tras un `…/reprocess` 200 | Se mantiene |
| CA-5.2.20 (D5) | agota «Reintentar» exactamente tras 2 usos fallidos y el tercero sigue llamando a la evaluación | Tras el 1.º «Reintentar» fallido: mensaje genérico y sin «Ir al inicio»; tras el 2.º: mensaje literal de CA-5.2.20, «Reintentar» y enlace «Ir al inicio» a `/inicio`; un 3.º «Reintentar» → el handler de `…/reprocess` suma 3 llamadas | **Se reemplaza** (v11.3 D2): la prueba R3 del plan siguiente |
| D3 | LLM_LIMIT_REACHED al reintentar suma al tope igual que LLM_UNAVAILABLE | `…/answers` responde `LLM_UNAVAILABLE`; `…/reprocess` responde `503 LLM_LIMIT_REACHED` dos veces: tras el 2.º, mensaje literal de CA-5.2.20 y enlace «Ir al inicio» | Hecha |
| D4 | un fallo de red al reintentar muestra «No hay conexión…» sin sumar al tope | `…/reprocess`: red, luego `LLM_UNAVAILABLE`: tras el de red, «No hay conexión…» y «Reintentar»; tras el siguiente, mensaje genérico y **sin** «Ir al inicio» (solo un fallo contado) | Hecha |
| D4 | otro error al reintentar muestra el genérico sin sumar al tope | `…/reprocess` responde `500 INTERNAL_ERROR` tres veces: siempre genérico y nunca «Ir al inicio» | Hecha |
| D4 | un 404 al reintentar muestra «No encontramos lo que buscabas.» sin sumar | Mensaje de CA-5.2.7 en el panel; «Reintentar» sigue; sin «Ir al inicio» | Hecha |
| D4 | tras agotar «Reintentar», «Ir al inicio» no desaparece si llega un fallo de otro tipo | Agotar el tope con 2 fallos `LLM_UNAVAILABLE` en `…/reprocess`; el 3.º «Reintentar» recibe un error de red: aparece «No hay conexión…», «Reintentar» sigue y el enlace «Ir al inicio» sigue visible | Hecha |
| D1 y D10 | `api/interviewSession.mapper.test.ts`: convierte la respuesta 200 del contrato previsto y rechaza una forma inesperada | `progress`, `nextQuestion` e `interviewFinished` al modelo; `nextQuestion = null` → terminada; un cuerpo sin `progress` lanza el error propio de la feature, no un `TypeError` | Hecha |
| D7 | `ProgressArc.test.tsx`: la etiqueta no fuerza mayúsculas | La etiqueta no lleva la clase `uppercase`. Es una prueba débil (jsdom no aplica Tailwind): se completó con **verificación manual el 22-10** (bitácora, Tarea 8): «Pregunta 1 de 5» se ve sin mayúsculas y el espaciado es correcto | Hecha |

### Plan de pruebas de CM-217 · backlog v11.3 (paso de ROJO)

Todas en `src/features/interview-session/pages/InterviewSessionPage.test.tsx`, salvo R6b
(`src/features/interview-session/hooks/useInterviewTurn.test.ts`), contra MSW (§9, riesgos). Usan los ayudantes que ya hay en el archivo (`reprocessSequence`, `retryAndSettle`,
`problem`) y los `code` importados de `model/interviewSession.errorCodes` (D2). Los topes se
escriben como números literales del CA (2 y 2), no con las constantes, para que un cambio de
constante rompa la prueba. «Assert que falla hoy» es el que debe estar en rojo en `944cea3`;
«Ninguno» marca una prueba que pasa desde el principio porque protege algo que ya funciona.

| # | CA o decisión | Prueba (`it`) | Dado / Cuando / Entonces | Assert que falla hoy |
| --- | --- | --- | --- | --- |
| R1 | CA-5.2.19, v11.3 D1 | si la IA entrega una evaluación con formato inválido muestra el error genérico con «Reintentar» | **Dado** `…/answers` responde `503 LLM_INVALID_OUTPUT` con un `detail`. **Cuando** escribe y pulsa «Enviar». **Entonces** «Ocurrió un error. Inténtalo de nuevo.», botón «Reintentar», sin campo «Respuesta», sin «Ir al inicio» y sin el `detail` | `findByRole('button', { name: 'Reintentar' })` y campo ausente: hoy el `code` cae en «otro» (`useInterviewTurn.ts:94-99, 204`) y sale el genérico con el campo y «Enviar», sin «Reintentar». El genérico solo no sirve: también aparece hoy |
| R2 | CA-5.2.19, CA-5.2.20, v11.3 D1 | LLM_INVALID_OUTPUT al reintentar suma al tope igual que LLM_UNAVAILABLE | **Dado** `…/answers` responde `LLM_UNAVAILABLE` y `…/reprocess`, siempre `503 LLM_INVALID_OUTPUT`. **Cuando** pulsa «Reintentar» 2 veces. **Entonces** tras el 2.º, mensaje literal de CA-5.2.20, «Reintentar» y enlace «Ir al inicio» | `findByText(EXHAUSTED)`: hoy cuenta como «otro» (`useInterviewTurn.ts:215-219`), muestra el genérico y no suma |
| R3 | CA-5.2.20, v11.3 D2 (reemplaza la prueba de D5) | tras 2 usos fallidos muestra el mensaje de CA-5.2.20, permite 2 usos más y después deja solo «Ir al inicio» | **Dado** `…/answers` y `…/reprocess` responden siempre `LLM_UNAVAILABLE`. **Cuando** pulsa «Reintentar» 4 veces. **Entonces** tras el 1.º, genérico y sin «Ir al inicio»; tras el 2.º y el 3.º, mensaje de CA-5.2.20, «Reintentar» e «Ir al inicio» a `/inicio`; tras el 4.º, el mismo mensaje, **sin** «Reintentar» y con «Ir al inicio»; exactamente 4 llamadas a `…/reprocess` | `queryByRole('button', { name: 'Reintentar' })` es `null` tras el 4.º: hoy «Reintentar» sigue siempre (`EvaluationRetryPanel.tsx:44-52`). `retryAndSettle` espera a que «Reintentar» vuelva: en el 4.º uso se espera a `state.count === 4` y a que el botón no esté |
| R4 | CA-5.2.20, v11.3 D2 | en el tramo 2 un «Reintentar» con éxito avanza a la pregunta siguiente y el contador vuelve a cero | **Dado** `…/answers` responde siempre `LLM_UNAVAILABLE`; `…/reprocess`, 2 veces `LLM_UNAVAILABLE` y luego `200` con la pregunta 2. **Cuando** pulsa «Reintentar» 3 veces y después responde la pregunta 2. **Entonces** tras el 3.º, «Pregunta 2 de 5», campo vacío y sin panel; al fallar la pregunta 2, genérico con «Reintentar» y **sin** «Ir al inicio» | Ninguno: pasa hoy. Protege que el tramo 2 no rompa el éxito ni el reinicio del contador (`applyResult`, `useInterviewTurn.ts:142-153`) |
| R5 | CA-5.2.20, D4, v11.3 D2 | en el tramo 2 sin red o un 404 al reintentar no gastan un uso | **Dado** `…/reprocess` responde, en orden: `LLM_UNAVAILABLE`, `LLM_UNAVAILABLE`, sin red, `404 SESSION_NOT_FOUND`, `LLM_UNAVAILABLE`, `LLM_UNAVAILABLE`. **Cuando** pulsa «Reintentar» 6 veces. **Entonces** tras el 3.º, «No hay conexión…», «Reintentar» e «Ir al inicio»; tras el 4.º, «No encontramos lo que buscabas.», «Reintentar» e «Ir al inicio»; tras el 5.º, mensaje de CA-5.2.20 con «Reintentar»; tras el 6.º, sin «Reintentar» y con «Ir al inicio»; 6 llamadas | `queryByRole('button', { name: 'Reintentar' })` es `null` tras el 6.º: hoy sigue |
| R6 | CA-5.2.20, v11.3 D2 (DF-004) | con doble clic en «Reintentar» del mensaje de CA-5.2.20 pide una sola evaluación y deshabilita el botón mientras espera | **Dado** el tramo 1 agotado (2 `LLM_UNAVAILABLE` en `…/reprocess`) y la 3.ª llamada retenida hasta que la prueba la suelte. **Cuando** hace doble clic en «Reintentar». **Entonces** mientras espera, 3 llamadas en total, no 4, y el botón está deshabilitado; al soltarla con `LLM_UNAVAILABLE`, «Reintentar» vuelve y siguen siendo 3. El botón se toma antes del clic: con `loading` su nombre accesible pasa a «Procesando tu respuesta…» (`Button.tsx:124-133`) | `expect(state.count).toBe(3)`: `retryEvaluation` no tiene guarda síncrona (`useInterviewTurn.ts:257`). **No comprobado** que hoy falle: depende de que el 2.º clic llegue antes del re-render (el caso de DF-004); si pasa en verde, se queda como protección y se anota. `toBeDisabled()` seguramente pasa hoy (`Button.tsx:117` suma `loading` a `disabled`), pero ninguna prueba lo afirmaba: esta lo exige. Pasa en verde: userEvent no hace el 2.º clic sobre un botón deshabilitado, así que la guarda síncrona la cubre R6b |
| R6b | CA-5.2.20, v11.3 D2 (DF-004) | dos «Reintentar» en el mismo instante piden una sola evaluación (guarda síncrona) | En `hooks/useInterviewTurn.test.ts`, con `renderHook`, no en la página. **Dado** `…/answers` responde `503 LLM_UNAVAILABLE` y el hook queda en `evaluationFailed`; `…/reprocess` cuenta sus llamadas y responde `LLM_UNAVAILABLE` con la respuesta retenida, para que la 1.ª siga en vuelo. **Cuando** dentro de un solo `act` síncrono llama dos veces seguidas a `retryEvaluation` (la misma referencia, sin re-render entre ambas). **Entonces** al soltarla y terminar, `…/reprocess` recibió exactamente 1 llamada | `expect(state.count).toBe(1)` (recibe 2): `retryEvaluation` no tiene guarda síncrona (`useInterviewTurn.ts:257`) y `useMutation` no impide un 2.º `mutate` mientras el 1.º sigue en vuelo |
| R7 | CA-5.2.6, v11.3 D3 | si la entrevista no está en curso rechaza la respuesta con «Esta entrevista ya no admite esa acción.» (CA-5.2.6) | **Dado** la pregunta 1 y `…/answers` responde `409 SESSION_TRANSITION_NOT_ALLOWED` con un `detail`. **Cuando** escribe y pulsa «Enviar». **Entonces** «Esta entrevista ya no admite esa acción.», sin «Reintentar», sin llamadas a `…/reprocess` y sin el `detail`. Va en el `describe` principal, no en el de HU-5.5 | Ninguno: el código ya existe (#126) y la prueba pasa hoy; cubre un CA que no tenía prueba. No afirma nada del campo, de «Enviar» ni de una salida: se dejan como están (decisión del 12-11-2026, §9) |

**La prueba de D5 se reemplaza, no se corrige.** `agota «Reintentar» exactamente tras 2 usos
fallidos y el tercero sigue llamando a la evaluación` (`InterviewSessionPage.test.tsx:333-351`)
exige en las líneas 349-351 un 3.er uso sin límite. Cambió el criterio: v10 «sin límite»
(«Cambios v10», fila 58, #147) → v11.2 «2 + 2» («Cambios v11.2», filas 12 a 14, #290 a #292).
R3 la reemplaza y conserva sus comprobaciones del tramo 1. Las demás pruebas de D3 y D4 se
mantienen, también `tras agotar «Reintentar», «Ir al inicio» no desaparece si llega un fallo de
otro tipo`, porque su 3.er uso es de red y no suma. En el paso de código, el TSDoc del archivo
de prueba pasa de «backlog v8.3» a v11.3.

### Plan de pruebas de CM-217 · contrato real (paso de ROJO, 13-11-2026)

Cubre v11.3 D7 a D10 (§9). Las pruebas de la página van en el `describe` principal de
`src/features/interview-session/pages/InterviewSessionPage.test.tsx` (no en el de HU-5.5), con
los ayudantes que ya tiene (`reprocessSequence`, `retryAndSettle`, `lastRetryAndSettle`,
`problem`) y los `code` importados de `model/interviewSession.errorCodes` (D2). Las del mock van
en un archivo nuevo, `src/mocks/handlers/interviewSessions.handlers.test.ts`, con
`describe('interviewSessionsHandlers')`, sin `useHandlers` y con los `code` como literales con
un comentario que apunta a `ErrorCode.java` de `cameia-entrevista` (la política de ESLint de
`mocks` no deja importar de `features`). «Assert que falla hoy» es el que debe estar en rojo en
`45a0719`. Hasta que `errorCodes.ts` tenga `TURN_RETRY_LIMIT_REACHED` y `TURN_NOT_RETRYABLE`, el
import falla en `pnpm typecheck` y en ejecución vale `undefined`, así que la respuesta simulada
sale sin `code`; el assert señalado falla igual, porque hoy todo `409` de `…/reprocess` da el
genérico con «Reintentar».

| # | CA o decisión | Prueba (`it`) | Dado / Cuando / Entonces | Archivo | Assert que falla hoy |
| --- | --- | --- | --- | --- | --- |
| R8 | CA-5.2.20, v11.3 D7 | si Backend agota el tope antes que la pantalla, el 5.º «Reintentar» deja el mensaje de CA-5.2.20 solo con «Ir al inicio» | **Dado** `…/answers` responde `503 LLM_UNAVAILABLE` y `…/reprocess`, en orden: `LLM_UNAVAILABLE`, `LLM_UNAVAILABLE`, `503 DATABASE_UNAVAILABLE` (Backend lo cuenta; el front no), `LLM_UNAVAILABLE`, `409 TURN_RETRY_LIMIT_REACHED` con un `detail`. **Cuando** pulsa «Reintentar» 5 veces. **Entonces** tras el 3.º, genérico con «Reintentar» e «Ir al inicio»; tras el 4.º, mensaje de CA-5.2.20 con «Reintentar» (al front le queda 1 uso); tras el 5.º, el mensaje de CA-5.2.20, **sin** «Reintentar», con «Ir al inicio» a `/inicio` y sin el `detail`; 5 llamadas | Página | `lastRetryAndSettle(user, state, 5)` y `findByText(EXHAUSTED)` tras el 5.º: hoy el `409` cae en «otro» (`useInterviewTurn.ts:219`), sale el genérico y «Reintentar» sigue |
| R9 | CA-5.2.20, v11.3 D7 | con TURN_RETRY_LIMIT_REACHED en el primer «Reintentar» pasa directo al estado final de CA-5.2.20 | **Dado** `…/answers` responde `503 LLM_UNAVAILABLE` y `…/reprocess`, `409 TURN_RETRY_LIMIT_REACHED` (el contador del front está en 0, como tras una recarga). **Cuando** pulsa «Reintentar» una vez. **Entonces** el mensaje de CA-5.2.20, sin «Reintentar», con «Ir al inicio» a `/inicio`; 1 llamada | Página | `findByText(EXHAUSTED)`: hoy sale el genérico |
| R10 | CA-5.2.6, v11.3 D8 | si al reintentar la entrevista no admite la acción muestra «Esta entrevista ya no admite esa acción.» sin «Reintentar» | **Dado** `…/answers` responde `503 LLM_UNAVAILABLE` y `…/reprocess`, `409 SESSION_TRANSITION_NOT_ALLOWED` con un `detail`. **Cuando** pulsa «Reintentar». **Entonces** «Esta entrevista ya no admite esa acción.», sin «Reintentar», sin «Ir al inicio», sin campo «Respuesta» y sin el `detail`; 1 llamada | Página | `findByText(NOT_ALLOWED)`: hoy `reprocess.onError` no llama a `toClosedReason` (`useInterviewTurn.ts:212-220`) y sale el genérico con «Reintentar» |
| R11 | CA-5.2.6, CA-5.5.5, v11.3 D8 | si al reintentar la entrevista ya está cerrada muestra «Esta entrevista ya no admite esa acción.» sin «Reintentar» | Igual que R10 con `409 SESSION_ALREADY_CLOSED` (sesión en evaluación o finalizada) | Página | `findByText(NOT_ALLOWED)`, por la misma razón que R10 |
| R12 | CA-5.5.4, v11.3 D8 | si al reintentar la entrevista se abandonó muestra su mensaje sin «Reintentar» | Igual que R10 con `409 SESSION_ABANDONED`. **Entonces** «Sesión abandonada: no genera evaluación.», sin «Reintentar» ni «Ir al inicio» | Página | `findByText('Sesión abandonada: no genera evaluación.')`, por la misma razón que R10 |
| R13 | CA-5.2.19, v11.3 D9 | si el turno ya no espera reintento muestra el genérico con «Ir al inicio» y sin «Reintentar» | **Dado** `…/answers` responde `503 LLM_UNAVAILABLE` y `…/reprocess`, `409 TURN_NOT_RETRYABLE` con un `detail`. **Cuando** pulsa «Reintentar» una vez (tramo 1 sin agotar). **Entonces** «Ocurrió un error. Inténtalo de nuevo.», **sin** «Reintentar», con «Ir al inicio» a `/inicio` y sin el `detail`; 1 llamada | Página | `lastRetryAndSettle(user, state, 1)`: hoy «Reintentar» sigue; y `getByRole('link', { name: 'Ir al inicio' })`: hoy no aparece, porque solo sale al agotar el tramo 1 (`InterviewSessionPage.tsx:228-232`) |
| R14 | CA-5.2.20, v11.3 D7 y D10 | el 5.º «Reintentar» del mismo turno recibe 409 TURN_RETRY_LIMIT_REACHED | **Dado** una sesión iniciada con `POST …/start` (el `turnId` sale del mock) y la evaluación del mock en modo fallo (`failInterviewEvaluations`, aprobado en v11.3 D10, sin `useHandlers`); `POST …/answers` con clave responde `503 LLM_UNAVAILABLE`. **Cuando** hace 5 `POST …/turns/{turnId}/reprocess` del mismo turno. **Entonces** del 1.º al 4.º, `503 LLM_UNAVAILABLE`; el 5.º, `409` con `code` `TURN_RETRY_LIMIT_REACHED` | Mock | Status y `code` del 5.º: hoy `…/reprocess` responde siempre `200` y avanza (`interviewSessions.handlers.ts:173-175`). Hoy el archivo falla antes, porque el interruptor no existe: el rojo que importa es el del 5.º |
| R15 | CA-5.2.4, v11.3 D10 | sin Idempotency-Key responde 422 IDEMPOTENCY_KEY_REQUIRED | **Dado** una sesión iniciada. **Cuando** `POST …/answers` válido sin la cabecera. **Entonces** `422`, `code` `VALIDATION_FAILED` y un elemento de `errors[]` con `field` `Idempotency-Key` y `code` `IDEMPOTENCY_KEY_REQUIRED` | Mock | Status `422`: hoy guarda bajo `''` y responde `200` (`:92`) |
| R16 | CA-5.2.9, CA-5.2.10, v11.3 D10 | responde 422 con los code y la forma de Backend | **Cuando** `POST …/answers` con clave y `answerText` de solo espacios; y luego con otra clave y 4001 caracteres. **Entonces** `422`, `title` «Datos no válidos», `detail` «Revisa los campos marcados.», `code` `VALIDATION_FAILED`; `errors[0]` con `field` `answerText` y `code` `ANSWER_TEXT_REQUIRED` en el primero y `ANSWER_TEXT_TOO_LONG` en el segundo | Mock | `errors[0].code`: hoy `REQUIRED` y `TOO_LONG` (`:113`) |
| R17 | CA-5.2.10, v11.3 D10 | valida la respuesta antes de mirar la Idempotency-Key ya usada | **Dado** un `POST …/answers` válido con la clave K que respondió `200`. **Cuando** repite K con `answerText` vacío. **Entonces** `422`, no el `200` guardado | Mock | Status `422`: hoy la caché se mira antes de validar (`:93-94`) y devuelve el `200` |
| R18 | CA-5.2.4, CA-5.2.11, v11.3 D10 | la misma Idempotency-Key con otro cuerpo responde 409 IDEMPOTENCY_KEY_CONFLICT | **Dado** un `POST …/answers` válido con la clave K. **Cuando** repite K con el mismo cuerpo y después con otro `answerText`. **Entonces** el primero repetido devuelve el mismo `200`; el de otro texto, `409` con `code` `IDEMPOTENCY_KEY_CONFLICT` | Mock | Status `409` del segundo: hoy devuelve el `200` guardado sin comparar el cuerpo (`:93-94`) |
| R19 | CA-5.2.19, v11.3 D9 y D10 | reprocess de un turno que no espera reintento responde 409 TURN_NOT_RETRYABLE | **Dado** una sesión iniciada. **Cuando** `POST …/reprocess` del turno pendiente (sin respuesta) y, tras responderlo con `200`, otra vez del mismo turno. **Entonces** los dos, `409` con `code` `TURN_NOT_RETRYABLE` | Mock | Status `409`: hoy responde `200` y avanza (`:173-175`) |

**Por qué R14 va en el archivo del mock y no en la página.** (1) Desde la pantalla no se llega
al 5.º «Reintentar» si los 4 anteriores fueron fallos de la IA: tras el 4.º el front ya oculta
«Reintentar» (v11.3 D2). Para llegar hace falta un fallo que Backend cuente y el front no (R8),
y eso solo se simula con `useHandlers`. (2) Lo que se protege es el propio mock (lección 6): que
el mock por defecto no deje en verde lo que el servicio real rechazaría, sin depender del
contador del front. (3) Ya hay pruebas de handlers junto a sus handlers
(`src/mocks/handlers/professionalRoles.handlers.test.ts`, `auth.handlers.test.ts`,
`profiles.handlers.test.ts`). `resetInterviewSessions` corre antes de cada prueba
(`src/test/setup.ts:52`), así que el estado no pasa de una a otra.

**Pruebas existentes que el cambio de mocks puede poner en rojo (lección 6).**

- **Seguro en rojo:** `InterviewSessionPage.test.tsx:580`, «"Reintentar" con éxito avanza a la
  pregunta siguiente». Fuerza `…/answers` con `useHandlers` (`503`) y deja `…/reprocess` por
  defecto: el mock no vio el fallo, el turno no espera reintento y responderá `409
  TURN_NOT_RETRYABLE` (D10), que con D9 no avanza. Se ajusta en el paso de código con su propio
  handler de `…/reprocess` (`200` con `OK_NEXT`), como ya hace
  `InterviewSessionPage.voice.test.tsx:500`; lo que afirma no cambia.
- **Deben seguir en verde, pero usan el mock por defecto de `…/answers`:**
  `InterviewSessionPage.test.tsx:613` (CA-5.2.5; envía al turno `s1-t5` sin `useHandlers`). Pasa
  si el mock no valida el `turnId` como UUID (D10 lo deja fuera) y si el front sigue mandando la
  clave. Las que no envían (`:155`, `:160`, `:238`, `:603`) no llaman al mock.
- **No dependen del cambio:** el resto de `InterviewSessionPage.test.tsx`,
  `hooks/useInterviewTurn.test.ts` (R6b) y `InterviewSessionPage.voice.test.tsx` fuerzan
  `…/answers`, `…/reprocess` y `…/answers/audio` con `useHandlers`. El handler del audio no
  cambia, pero comparte `resultByKey` y `advance` con `…/answers`: si el cambio los toca, se
  corren las de voz.
- **interview-setup (mismo archivo de mocks, handlers que no cambian):**
  `hooks/useCreateSession.test.tsx`, `pages/NewInterviewWizardPage.test.tsx` y
  `pages/NewInterviewWizardPage.confirm.test.tsx` pasan por el handler de creación de sesión
  (por defecto o forzado), que comparte `resultByKey`; `pages/StartingSessionPage.test.tsx:67`
  («al iniciar abre el chat con la pregunta 1») usa `…/start` y `questionDto` por defecto. Siguen
  en verde si `…/answers` usa su propia caché y no se tocan `questionDto`, `sessionState` ni
  `resultByKey`. Si `resultByKey` pasara a guardar `{huella, resultado}`, la creación devolvería
  esa forma y se pondrían en rojo.
- **`src/test/setup.ts`:** `resetInterviewSessions` debe limpiar también la caché nueva, los
  contadores por turno y el interruptor de fallo; si no, una prueba hereda el estado de la
  anterior y falla según el orden.
- En el paso de código se corre `pnpm test` completo, no solo `interview-session`: el módulo de
  mocks se carga en todas las pruebas.

### HU-5.8 (CM-317): criterios y plan de pruebas

Los 25 CA de HU-5.8 por referencia (texto literal en el archivo de criterios v8.4). «Hook» =
`hooks/useVoiceRecorder.test.ts` (nuevo, `describe('useVoiceRecorder')`; simula `./sileroVad`,
`getUserMedia` y `MediaRecorder`). «Página» = `pages/InterviewSessionPage.voice.test.tsx`.
Las filas «Hecha» tienen su prueba en verde (CM-317, tareas 3 a 9); «Se mantiene» son pruebas
que ya existían.
**No comprobado:** que las fake timers de Vitest 4 controlen `performance.now` sin configurarlas,
y que el `delay` de MSW funcione con fake timers (si no, la prueba de 20 s usa un handler que
espera una promesa resuelta a mano).

| CA | Etiq. | Qué hace el front que el CA no dice | Prueba (`it`) | Estado |
| --- | --- | --- | --- | --- |
| CA-5.8.1 | F y B | La parte F está en `interview-setup` (HU-4.3); nada en el chat | `LanguageAndFormatForm.test.tsx` «muestra Audio y Texto con descripciones (CA-4.3.3)» (**no comprobado** que afirme la preselección) | Fuera de CM-317 |
| CA-5.8.2 | F | «Grabando» solo cuando MicVAD y el grabador ya arrancaron (CM-316 D4) | Página «al grabar muestra «Detener» y el tiempo sobre 3:00 (CA-5.8.2)» · Hook «arranca MicVAD con el mismo stream antes que el grabador y queda grabando» | Se mantiene · Hecha |
| CA-5.8.3 | F | Todo error de `getUserMedia` salvo `NotFoundError` → `denied`, sin cargar MicVAD | Página «con el micrófono denegado ofrece el texto en la misma pregunta (CA-5.8.3)» · Hook «con el permiso negado queda en denied sin cargar MicVAD» | Se mantiene · Hecha |
| CA-5.8.4 | F | «Detener» desde que empieza la grabación (lectura de §9); `Blob` con el `mimeType` real | Hook «al detener con voz suficiente conserva el audio con el tipo real del grabador» | Hecha |
| CA-5.8.5 | F y B | Aviso de 20 s programado por envío y limpiado al terminar o desmontar | Página «con una grabación lista, «Enviar» avanza a «Pregunta 2 de 5» y suelta el audio (CA-5.8.5)» · «a los 20 s de espera agrega «Esto puede tardar hasta 2 minutos. No cierres esta página.»» · «tras un reenvío el aviso de 20 s no aparece antes de tiempo» | Se mantiene · Hecha · Hecha |
| CA-5.8.6 | F y B | Guarda síncrona `inFlight`; «Enviar» conserva su nombre accesible, deshabilitado y con spinner visible; el estado se anuncia solo en `aria-live` (CM-316 D7) | Página «con doble clic en «Enviar» envía un solo audio»: 1 sola llamada a `…/answers/audio`; durante la espera el botón con nombre accesible «Enviar» está deshabilitado y muestra el spinner; «Procesando tu respuesta…» aparece una sola vez, en la región `aria-live`, y no como nombre del botón | Hecha |
| CA-5.8.7 | F y B | Tope medido con `performance.now` (CM-316 D6) | Hook «a los 3:00 medidos con el reloj se detiene sola y habilita «Enviar»» | Hecha |
| CA-5.8.8, 5.8.13, 5.8.14, 5.8.15 | B | Efecto visible: genérico y se descarta la grabación (§5) | Página «413, 415 y 422 sin code de transcripción muestran el genérico y descartan la grabación» | Hecha |
| CA-5.8.9 | F y B | ≥ 62 tramos de 32 ms con `isSpeech` ≥ 0,3, según las notas técnicas de HU-5.8 (O75, backlog v8.4) | Hook «con 62 tramos de voz (1,984 s) habilita «Enviar»» | Hecha |
| CA-5.8.10 | F y B | 59 tramos → `noVoice`, sin enviar | Página «con menos de 2 s de voz muestra el aviso y deja grabar otra vez (CA-5.8.10)» · Hook «con 59 tramos de voz (1,9 s) queda en noVoice sin audio» | Se mantiene · Hecha |
| CA-5.8.11 | F y B | 0 tramos → `noVoice`; `TRANSCRIPTION_EMPTY` → mismo mensaje | Hook «sin voz queda en noVoice» · Página «si Backend responde TRANSCRIPTION_EMPTY avisa «No detectamos tu voz, intenta de nuevo.» y descarta la grabación» | Hecha · Hecha |
| CA-5.8.12, 5.8.16, 5.8.17, 5.8.18 | B | Nombre de archivo fijo; el `Blob` solo vive en el estado de React | — | Sin prueba de front |
| CA-5.8.19 | F y B | Otra `Idempotency-Key` para el texto; se registra en `…/answers` | Página ««Responder por texto» descarta la grabación y muestra el campo (CA-5.8.19)», ampliada: el envío llega a `…/answers`, no a `…/answers/audio` | Hecha (ampliada) |
| CA-5.8.20 | F y B | Sin «Grabar» en una entrevista con Texto | Página «una entrevista de texto no muestra «Grabar» (CA-5.8.20)» | Se mantiene |
| CA-5.8.21 | B | Efecto visible: `404` → `NOT_FOUND`; `409` → genérico | Página «al enviar audio a una entrevista ajena muestra «No encontramos lo que buscabas.»» | Hecha |
| CA-5.8.22 | F y B | Conserva el `Blob` y reutiliza la clave `:audio` | Página «sin conexión conserva la grabación y el reenvío usa la misma Idempotency-Key» | Hecha |
| CA-5.8.23 | F | `NotFoundError` → `noMicrophone` | Página «sin micrófono avisa y ofrece el texto (CA-5.8.23)» · Hook «sin micrófono queda en noMicrophone» | Se mantiene · Hecha |
| CA-5.8.24 | F | Se oculta cuando la grabación empieza de verdad (CM-316 D8) | Página «muestra «Grabar», «Responder por texto» y el aviso del audio antes de grabar (CA-5.8.24)» · «el aviso sigue visible mientras se prepara la grabación y si MicVAD falla» (en `denied` no hay controles de grabación, así que el aviso no aplica) | Se mantiene · Hecha |
| CA-5.8.25 | F | Fallo de carga de MicVAD (CM-316 D3) | Hook «si MicVAD no carga queda en vadFailed y libera el micrófono» · Página «si no se puede preparar la grabación muestra el aviso, el campo de texto y «Grabar»» | Hecha · Hecha |
| Notas técnicas HU-5.8 (formatos) | F | Formatos y `mimeType` real, según las notas técnicas de HU-5.8 (O75, backlog v8.4); sin «Grabar» (lectura del front, §9) | Hook «sin un tipo admitido queda en unsupported sin pedir el micrófono» · «con un mimeType real no admitido descarta y queda en unsupported» · Página «con formato no admitido muestra «Tu navegador no permite grabar. Responderás por texto.» y el campo» | Hecha |
| Defecto: audio de la pregunta anterior (§9) | — | Un `503 LLM_*` al enviar audio descarta la grabación | Página «tras un fallo de la IA con audio y un "Reintentar" exitoso, la pregunta siguiente queda en idle sin grabación previa» | Hecha |
| Defecto: cancelación en `requesting` (§9) | — | Descartar o desmontar mientras se prepara libera todo | Hook «descartar mientras se prepara libera el micrófono y no graba» · «desmontar mientras se prepara libera el micrófono» | Hecha |

## 7. Estado de implementación

| Archivo | Estado |
| --- | --- |
| `src/features/interview-session/pages/InterviewSessionPage.tsx` | Hecho; contrato previsto y avisos de voz (#101); envía la respuesta sin recortar y el panel muestra el mensaje del último fallo de reprocess (D4). CM-317: temporizador de 20 s, aviso de CA-5.8.24, descarte tras 503 LLM y tras 413, 415 y 422 genéricos, estados vadFailed y unsupported. **Hecho (CM-217, v11.3 D2):** oculta «Reintentar» en el panel de CA-5.2.20 al agotar el tramo 2 (`showRetry` según `canRetry`). **Hecho (CM-217, v11.3 D9):** «Ir al inicio» también cuando el turno ya no admite reintento (`turnNotRetryable`), aunque no se haya agotado el tramo 1; «Reintentar» oculto según `canRetry` del hook |
| `src/features/interview-session/hooks/useInterviewTurn.ts` | Hecho; rechazos del audio (#101); códigos de D2; solo los fallos de la IA de reprocess suman al tope (D3, D4); retryError reemplaza a retryNetworkError; AnswerResponseShapeError da el genérico (D10); sigue devolviendo llaves de i18n (D6 fuera). CM-317: descarta el audio tras 413, 415, 422 y 503 LLM_* (§5). **Hecho (CM-217, v11.3):** LLM_INVALID_OUTPUT como fallo de la IA en isEvaluationFailure (D1); tope del tramo 2 con canRetry y guarda síncrona en retryEvaluation (D2); TSDoc. **Hecho (CM-217, v11.3 D7 a D9):** en el onError de reprocess, TURN_RETRY_LIMIT_REACHED lleva el contador al tope y sin retryError (D7); SESSION_* pasa a la fase closed con toClosedReason, sin modificarlo (D8); TURN_NOT_RETRYABLE deja el genérico sin «Reintentar» y con «Ir al inicio», sin sumar, y expone `turnNotRetryable` (D9); TSDoc |
| `src/features/interview-session/organisms/SessionStage/SessionStage.tsx` | Hecho; región aria-live con el indicador de procesando |
| `src/features/interview-session/organisms/TextAnswerComposer/TextAnswerComposer.tsx` | Hecho; cuenta puntos de código NFC con unicodeLength (D9); el botón Enviar solo se deshabilita, sin modo de carga, y ya no recibe etiqueta de carga (CA-5.2.4) |
| `src/features/interview-session/organisms/EvaluationRetryPanel/EvaluationRetryPanel.tsx` | Hecho; conserva el modo de carga (§9). **Hecho (CM-217, v11.3 D2):** prop opcional `showRetry` (por defecto `true`) para mostrarse sin «Reintentar», solo con «Ir al inicio»; el uso del cierre de HU-5.5 no cambia |
| `src/features/interview-session/api/interviewSession.api.ts` | Hecho con el contrato previsto (#101). **Hecho (CM-217, v11.3 D1):** el TSDoc de reprocessTurn nombra LLM_UNAVAILABLE, LLM_LIMIT_REACHED y LLM_INVALID_OUTPUT (§9). **Hecho (CM-217, v11.3 D11):** comentarios de answers y reprocess con el contrato publicado (cameia-entrevista 48773cb), sin «provisional» en reprocess y nombrando los 409 TURN_* en el TSDoc de reprocessTurn; los de audio y consolidation no se tocan |
| `src/features/interview-session/api/interviewSession.dto.ts` | Hecho con el contrato previsto (#101). **Hecho (CM-217, v11.3 D11):** TSDoc con el contrato publicado; la marca PROVISIONAL se mantiene (decidido el 13-11, §9, D11) |
| `src/features/interview-session/api/interviewSession.mapper.ts` | Hecho con el contrato previsto (#101); valida la forma de la respuesta 200 (D10). **Hecho (CM-217, v11.3 D11):** comentarios con el contrato publicado |
| `src/features/interview-session/api/AnswerResponseShapeError.ts` | Hecho; error propio del mapper (D10). **Hecho (CM-217, v11.3 D11):** TSDoc con el contrato publicado |
| `src/features/interview-session/api/interviewSession.mapper.test.ts` | Hecha (D1 y D10). **Hecho (CM-217, v11.3 D11):** solo el TSDoc de cabecera, con el contrato publicado |
| `src/features/interview-session/model/interviewSession.errorCodes.ts` | Hecho; LLM_UNAVAILABLE, LLM_LIMIT_REACHED y VALIDATION_FAILED (D2); los 409 de HU-5.5 (#126). **Hecho (CM-217, v11.3 D1):** LLM_INVALID_OUTPUT. **Hecho (CM-217, rojo):** TURN_RETRY_LIMIT_REACHED y TURN_NOT_RETRYABLE, copiados de ErrorCode.java, ahora usados también por el hook (D7, D9). **Hecho (CM-217, v11.3 D11):** cabecera con el contrato publicado |
| `src/features/interview-session/model/interviewSession.types.ts` | Hecho; sessionLanguage en #101 |
| `src/features/interview-session/model/sessionEntry.ts` | Hecho; valida sessionLanguage (#101) |
| `src/features/interview-session/model/interviewSession.constants.ts` | Hecho; tope de 2. CM-317: encabezado (tarea 8 del Anexo A). **Hecho (CM-217, v11.3 D2):** MAX_LATER_EVALUATION_RETRIES = 2 con TSDoc que cita CA-5.2.20 y «Cambios v11.2» #290; TSDoc de MAX_EVALUATION_RETRIES («antes de pasar a CA-5.2.20», #292) |
| `src/features/interview-session/hooks/useInterviewTurn.test.ts` | Hecha (CM-217, v11.3 D2): R6b |
| `src/features/interview-session/hooks/useVoiceRecorder.ts` | Hecho (CM-317): MicVAD y formatos según las notas técnicas de HU-5.8 (O75, backlog v8.4), orden de arranque (CM-316 D4), estados vadFailed y unsupported, cancelación y tope con reloj real (CM-316 D6); sin medición por energía |
| `src/features/interview-session/hooks/useVoiceRecorder.test.ts` | Hecha (CM-317): filas «Hook» del plan de §6 |
| `src/features/interview-session/hooks/sileroVad.ts` | Hecho (CM-317): único punto de entrada a MicVAD, con `import()` y los assets del ADR 0009 |
| `src/features/interview-session/hooks/sileroVad.test.ts` | Hecha (CM-317): opciones de `MicVAD.new`, umbral de 0,3 y error de carga |
| `vite.config.ts` | Hecho (CM-317): los cuatro assets de Silero sin hash en la carpeta `vad` del build (ADR 0009) |
| `src/features/interview-session/organisms/VoiceAnswerComposer/VoiceAnswerComposer.tsx` | Hecho. CM-317: Enviar conserva su nombre accesible con spinner visible (CM-316 D7), aviso de CA-5.8.24 (CM-316 D8) y sin «Responder por texto» cuando el campo ya se muestra (vadFailed) |
| `src/design-system/molecules/BrandOrb/BrandOrb.tsx` | Hecho |
| `src/design-system/molecules/ProgressArc/ProgressArc.tsx` | Hecho; la etiqueta se muestra sin mayúsculas forzadas (D7) |
| `src/mocks/handlers/interviewSessions.handlers.ts` | Hecho con el contrato previsto (#101); cuenta puntos de código NFC sin recortar y copia VALIDATION_FAILED con un comentario (D2, D9). **Hecho (CM-217, v11.3 D10):** solo los handlers de answers y reprocess y la cabecera: validar antes de la caché, caché propia con huella (409 IDEMPOTENCY_KEY_CONFLICT), 422 con los code y la forma reales, contador por turno en reprocess (409 TURN_RETRY_LIMIT_REACHED al 5.º uso, 409 TURN_NOT_RETRYABLE), interruptor failInterviewEvaluations (aprobado el 13-11) y resetInterviewSessions que lo limpia todo. Sin cambiar turnId, start, state, creación, borrado, audio ni consolidation |
| `src/mocks/handlers/interviewSessions.handlers.test.ts` | Hecha (CM-217, v11.3 D10): R14 a R19, en verde |
| `src/features/interview-session/pages/InterviewSessionPage.test.tsx` | Hecha; cubre el plan de §6 (v8.3). **Hecha (CM-217, v11.3):** R1 a R7 del plan de §6; R3 reemplaza la prueba de D5. **Hecho (CM-217, contrato real):** R8 a R13, en verde. **Hecho (CM-217, contrato real):** «"Reintentar" con éxito avanza a la pregunta siguiente» con su propio handler de reprocess (lección 6, §6), en verde; TSDoc |
| `src/features/interview-session/pages/InterviewSessionPage.voice.test.tsx` | Hecha; contrato previsto y rechazos del audio en #101. CM-317: pruebas de HU-5.8 de §6 |
| `src/design-system/molecules/ProgressArc/ProgressArc.test.tsx` | Hecha (D7, prueba débil; completada con la verificación manual del 22-10, bitácora Tarea 8) |


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

- Backend: `…/answers` y `…/reprocess` ya existen en cameia-entrevista `origin/develop`
  `48773cb` (13-11-2026; contrato publicado, con su OpenAPI en el controlador): dejan de ser un
  bloqueo; probarlos contra el servicio real queda para preproducción (hipótesis H1 y H2, §9).
  `…/answers/audio` no existe en cameia-entrevista. Sin él no se puede probar contra el backend
  real; el Sprint 3 cierra la subtarea de Frontend con datos simulados (planeación del 15/10).
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

**Decisiones de CM-217 para el backlog v11.3 (v11.3 D1 a D6, 11-11-2026)**

El alcance de CM-217 está decidido y no se amplía. Solo toca HU-5.2.

- **v11.3 D1 · `LLM_INVALID_OUTPUT` es un fallo de la IA (CA-5.2.19).** Se agrega a
  `model/interviewSession.errorCodes.ts` y se trata igual que `LLM_UNAVAILABLE` y
  `LLM_LIMIT_REACHED`: en `…/answers` abre el panel con «Ocurrió un error. Inténtalo de nuevo.»
  y «Reintentar»; en `…/reprocess` cuenta como fallo de la IA. **Motivo:** CA-5.2.19 y CA-5.2.20
  nombran los tres `code` para la misma situación («Cambios v10», fila 57, #146) y no piden un
  trato distinto para ninguno. Hoy el `code` cae en «otro» y muestra el genérico con el campo,
  sin «Reintentar».
- **v11.3 D2 · Dos tramos de «Reintentar» (CA-5.2.20).**
  - Tramo 1, sin cambios: hasta 2 usos fallidos en el panel de CA-5.2.19
    (`MAX_EVALUATION_RETRIES = 2`). Tras el 2.º fallo: el mensaje de CA-5.2.20 con «Reintentar»
    e «Ir al inicio».
  - Tramo 2: «Reintentar» se puede usar como máximo 2 veces más. Constante nueva en
    `model/interviewSession.constants.ts` (nombre propuesto: `MAX_LATER_EVALUATION_RETRIES`),
    con TSDoc que cite CA-5.2.20 y «Cambios v11.2» #290. Tras el 2.º fallo del tramo 2 (4.º uso
    fallido en total): el mismo mensaje **sin** «Reintentar», solo con «Ir al inicio».
  - Solo cuentan los fallos de la IA, decididos por `code`: `LLM_UNAVAILABLE`,
    `LLM_LIMIT_REACHED` y `LLM_INVALID_OUTPUT`. Sin red, `404`, `409` u otros errores no cuentan
    (D4, PR #102).
  - Si un uso tiene éxito, se avanza como hoy y el contador vuelve a cero.
  - Una sola evaluación por uso y botón deshabilitado mientras espera: guarda síncrona
    (`useRef`) **más** `disabled`, como en «Enviar» (lección DF-004). Que `Button` con `loading`
    deshabilite se lee en el código (`Button.tsx:117`) pero ninguna prueba lo comprueba: R6 lo
    exige.
  - El contador vive en memoria y se pierde al recargar: **PENDIENTE de Backend** (CM-216;
    «Cambios v11.2», fila 5, «Por confirmar»). No es una divergencia aceptada. *(Respondido el
    13-11 por el código de Backend: cuenta Backend, 4 por turno, persistidos y publicados en
    `…/state`; ver v11.3 D7.)*
  - **Interpretación:** «al volver más tarde» no impone una espera. El botón se puede pulsar
    cuando la persona quiera. El mensaje conserva «inténtalo más tarde» a propósito, aunque al
    final ya no haya «Reintentar» (nota de «Cambios v11.2», fila 12).
  - **Motivo:** «Cambios v11.2», filas 12 a 14 (#290 a #292), validadas por Frontend el 11-11,
    reemplazan el «sin límite» de «Cambios v10», fila 58.
- **v11.3 D3 · CA-5.2.6 solo necesita una prueba.** El código ya existe (#126): un `409
  SESSION_TRANSITION_NOT_ALLOWED` en `…/answers` pasa a la fase `closed` con «Esta entrevista ya
  no admite esa acción.». Falta una prueba en interview-session (R7, §6). **Motivo:** el CA no
  tenía prueba; la de CA-5.5.5 usa `SESSION_ALREADY_CLOSED`. Lo que no coincide con el texto
  literal quedó como hallazgo y se deja como está (decisión del 12-11-2026, §9).
- **v11.3 D4 · CA-5.2.5 sin cambios de código.** **Interpretación:** HU-5.5 se considera
  disponible desde la pantalla de cierre de CM-221 (PR #126); CA-5.2.5 se cubre allí y se
  probará de punta a punta cuando CM-216 y CM-220 estén en preproducción. **Motivo:** CA-5.2.5
  manda «continuar con el cierre de HU-5.5» y deja «Tu entrevista terminó.» solo «mientras
  HU-5.5 no esté disponible», sin decir cómo sabe la pantalla que lo está.
- **v11.3 D5 · Sin textos nuevos de i18n.** Se usan `errors:generico`,
  `interview:sesion.reintentosAgotados` e `interview:sesion.irAlInicio`, y para CA-5.2.6 la ya
  existente `interview:sesion.noAdmite`. Comprobado el 11-11 que las cuatro existen en `es-CO` y
  en `en` (`errors.json` línea 2; `interview.json` líneas 139, 140 y 143) y que los textos en
  `es-CO` son los literales de los CA. **Motivo:** el tramo 2 reutiliza el mensaje de CA-5.2.20.
- **v11.3 D6 · Fuera de CM-217.** Quién cuenta los usos al recargar y si `…/state` expone
  `RETRYING` (Backend, CM-216); `SESSION_ABANDONED` y `SESSION_ALREADY_CLOSED` (HU-5.5, de Ana
  Sofía); el historial vacío (CA-4.5.16). **Motivo:** no son de HU-5.2 o dependen de otro equipo.
  *(Precisado el 13-11 por v11.3 D7 y D8.)*

**Decisiones de CM-217 frente al contrato real (v11.3 D7 a D11, 13-11-2026)**

Fuente: `cameia-backup/revision/13112026_CM-217_contrato-real-vs-front.md` («el informe»), leído
contra `cameia-entrevista` `origin/develop` `48773cb` (incluye CM-216, CM-220 y CM-224). Es la
«opción 2 recortada» del informe (§4): alinea el chat con el contrato publicado sin leer
`…/state` (eso es la opción 3, HU-5.7). Sigue siendo solo HU-5.2. Rutas Java abreviadas desde
`src/main/java/tech/cameia/entrevista/`. Comprobado otra vez el 13-11 con `git show` y `git grep`
sobre `origin/develop`: `MAX_MANUAL_RETRIES = 4` (`domain/model/InterviewTurn.java:19`), los
títulos y mensajes de `TURN_NOT_RETRYABLE`, `TURN_RETRY_LIMIT_REACHED` e
`IDEMPOTENCY_KEY_CONFLICT`, y la forma del `422`.

- **v11.3 D7 · `409 TURN_RETRY_LIMIT_REACHED` en `…/reprocess` → estado final de CA-5.2.20.** El
  panel muestra `interview:sesion.reintentosAgotados`, **sin** «Reintentar» y con «Ir al
  inicio»: el mismo estado que tras el 4.º fallo de la IA (v11.3 D2), aunque el contador del
  front vaya atrás. **Motivo:** Backend cuenta 4 usos por turno (`InterviewTurn.java:19`,
  `:114-116`; prueba `ReprocessEndToEndTest.java:78-99`), los guarda en
  `turno.reintentos_manuales` (`V8__responder_y_reintentar_turno.sql:19-21`) y suma en la
  reserva, antes de llamar a la IA (`ReprocessTurnService.java:127-142`). Por eso cuenta un
  `reprocess` que termina en `503 DATABASE_UNAVAILABLE` o que el cliente corta por red o por
  tiempo, y la cuenta no se pierde al recargar. El front solo suma `LLM_*`, en memoria (D4): en
  esos bordes (red, base de datos o recarga) llega a un 5.º clic y hoy ve el genérico con
  «Reintentar» en bucle (informe §3, filas 9 a 11, y §3 b). Manda el servidor. El contador del
  front se queda: decide los dos tramos en el flujo normal, donde los dos avanzan a la par.
  Responde la pregunta de v11.3 D2 y D6 («quién cuenta»): Backend. Leer su cuenta al abrir el
  chat (`pendingQuestion.retriesUsed` de `…/state`) queda para HU-5.7 (anotado para después).
- **v11.3 D8 · `409 SESSION_ABANDONED`, `SESSION_ALREADY_CLOSED` o
  `SESSION_TRANSITION_NOT_ALLOWED` en `…/reprocess` → la misma fase `closed` que en
  `…/answers`.** Se reutiliza `toClosedReason` (`hooks/useInterviewTurn.ts:75-80`) **sin
  modificarlo**: abandonada → «Sesión abandonada: no genera evaluación.» (CA-5.5.4); cerrada o
  sin iniciar → «Esta entrevista ya no admite esa acción.» (CA-5.5.5, CA-5.2.6). Sin panel, sin
  «Reintentar» y sin «Ir al inicio», igual que al enviar (hallazgos de v11.3 D3). No suma al
  tope. **Motivo:** `…/reprocess` comprueba el estado de la sesión antes que el turno, con el
  mismo mapeo que `…/answers` (`ReprocessTurnService.java:98-112`; `InterviewSession.java:191-198`;
  prueba `ReprocessEndToEndTest.java:168`); hoy el front muestra el genérico con «Reintentar»,
  que repite el mismo `409` sin fin (informe §3, fila 8). La fase `closed` y sus textos son de
  #126 (CM-221): se reutilizan tal cual, sin tocar `useInterviewClosing` ni el cierre. Coincide
  con lo que pide la sección «Cierre de la entrevista» de este SPEC para el `409` al responder
  (hipótesis H9 del informe, comprobada contra esa sección). Precisa v11.3 D6: en `…/answers`,
  `SESSION_ABANDONED` y `SESSION_ALREADY_CLOSED` siguen siendo de HU-5.5; en `…/reprocess` los
  atiende CM-217 porque llegan al «Reintentar» de CA-5.2.19.
- **v11.3 D9 · `409 TURN_NOT_RETRYABLE` en `…/reprocess` → genérico sin «Reintentar», con «Ir al
  inicio».** El panel muestra `errors:generico`, oculta «Reintentar» y ofrece «Ir al inicio»
  aunque el tramo 1 no se haya agotado. No suma al tope. **Motivo:** el turno ya no espera un
  reintento (`PENDING`, `COMPLETED` o `PROCESSING` vivo) o perdió la carrera con otro
  `reprocess` (`InterviewTurn.java:109-113`; `ReprocessTurnService.java:115-119`;
  `ReprocessEndToEndTest.java:106`). El caso práctico es una `200` de `reprocess` perdida por un
  corte: el turno ya quedó completo y cada «Reintentar» devuelve el mismo `409` (informe §1.5 y
  §3, fila 13). Volver a pulsar no sirve y ningún CA fija texto: es la salida mínima de UX, con
  textos que ya existen (v11.3 D5). **Nota:** el retomar real (leer `…/state` y mostrar la
  pregunta siguiente) queda fuera (HU-5.7).
- **v11.3 D10 · Mocks de `…/answers` y `…/reprocess` alineados con el contrato real en lo que
  afecta a los CA (lección 6).** Solo esos dos handlers y la cabecera de
  `src/mocks/handlers/interviewSessions.handlers.ts`:
  - `…/answers` valida **antes** de mirar la caché (`RegisterAnswerService.java:142-175`): sin
    `Idempotency-Key`, o vacía → `IDEMPOTENCY_KEY_REQUIRED`; `answerText` vacío →
    `ANSWER_TEXT_REQUIRED`; más de 4000 puntos de código NFC → `ANSWER_TEXT_TOO_LONG`. Forma
    real: `422`, `title` «Datos no válidos», `detail` «Revisa los campos marcados.», `code`
    `VALIDATION_FAILED` y un elemento de `errors[]` por campo rechazado, todos a la vez, en el
    orden `turnId`, `answerText`, `Idempotency-Key`, con su `field` (`answerText` o
    `Idempotency-Key`) y su `message` («Ingresa tu respuesta.», «Tu respuesta no puede superar
    los 4000 caracteres.», «Ocurrió un error. Inténtalo de nuevo.»)
    (`domain/policy/AnswerRequestPolicy.java:26-29`, `:49-102`;
    `presentation/advice/BusinessExceptionHandler.java:101-104`;
    `domain/policy/SessionConfigurationPolicy.java:35`).
  - Caché por clave con huella (`turnId` y `answerText`): la misma clave con el mismo cuerpo
    devuelve el mismo resultado; con otro cuerpo → `409 IDEMPOTENCY_KEY_CONFLICT` («Solicitud
    distinta»; `RegisterAnswerService.java:248-252`). La caché de `…/answers` es **propia**:
    `resultByKey` sigue siendo de la creación de sesión y del audio, que no cambian.
  - `…/reprocess` con un contador por turno y el orden real: turno que no espera reintento →
    `409 TURN_NOT_RETRYABLE` («Acción no permitida», «Tu respuesta no está esperando un
    reintento.»); turno con 4 usos → `409 TURN_RETRY_LIMIT_REACHED` («Reintentos agotados», con
    el mensaje de CA-5.2.20 como `detail`); si no, suma 1 y evalúa
    (`ReprocessTurnService.java:98-142`; `InterviewTurn.java:19`, `:109-117`;
    `TurnNotRetryableException.java:9`; `TurnRetryLimitReachedException.java:9`;
    `BusinessExceptionHandler.java:142-144`).
  - Cabecera: deja de decir que `cameia-entrevista` solo expone `/health` y cita el contrato
    publicado (D11).
  - **No cambia:** el formato de `turnId` (`${sessionId}-tN`, no UUID; por eso el mock no
    responde `TURN_ID_INVALID_FORMAT`), el handler de `…/consolidation` (Ana Sofía, CM-221), ni
    los de `…/start`, `…/state`, creación, borrado y audio. Tampoco simula `404`,
    `409 SESSION_*`, `ANSWER_ALREADY_EXISTS`, `TURN_CONFLICT`, `ANSWER_TEXT_INVALID_CHARACTERS`
    ni `IDEMPOTENCY_KEY_INVALID_FORMAT`: ningún CA de HU-5.2 depende de ellos en el mock y las
    pruebas los fuerzan con `useHandlers`.
  - **Modo de fallo del mock. Aprobado (13-11):** el `…/answers` del mock nunca falla, así que
    ningún turno queda esperando reintento y, con el orden real, todo `…/reprocess` por defecto
    daría `TURN_NOT_RETRYABLE`. Para llegar al tope sin `useHandlers` (R14) hace falta un modo de
    fallo: un interruptor exportado del módulo, como `resetInterviewSessions`,
    `failInterviewEvaluations`, que hace responder `503 LLM_UNAVAILABLE` a
    `…/answers` y a `…/reprocess` y deja el turno esperando reintento; `resetInterviewSessions`
    lo apaga. Con el interruptor apagado, `…/reprocess` sobre un turno que espera reintento
    suma el uso, responde `200` y avanza. Un `503` también queda en la caché de su clave, como en
    Backend (`RegisterAnswerService.java:259-264`).
  - **Motivo:** el mock permisivo (caché sin huella, clave ausente aceptada, `reprocess` siempre
    `200`) deja en verde pruebas que con el servicio real fallarían; ninguna prueba del front
    ejercita hoy un `code` `TURN_*` (informe §3 d, puntos 1 a 5).
- **v11.3 D11 · Comentarios del contrato en los archivos de `…/answers` y `…/reprocess`.** En
  `api/interviewSession.api.ts`, `api/interviewSession.dto.ts`, `api/interviewSession.mapper.ts`,
  `api/AnswerResponseShapeError.ts` (su TSDoc; el mensaje de la línea 11 es código y no se
  toca), `api/interviewSession.mapper.test.ts` (su TSDoc) y
  `model/interviewSession.errorCodes.ts`, «contrato previsto (20-10)» pasa a citar el contrato
  publicado: `InterviewSessionController` y su OpenAPI (springdoc), `cameia-entrevista`
  `origin/develop` `48773cb`. «(provisional)» se quita de `…/reprocess`. Lo de `…/answers/audio`
  y `…/consolidation` no se toca. **Decidido (13-11): la marca se mantiene; solo cambian los
  comentarios de contrato previsto** (Juan José Arias, por CLAUDE.md §12, abierta 1). Por qué
  se preguntó: CLAUDE.md §8 liga `// PROVISIONAL — pendiente de OpenAPI` a que «exista el
  OpenAPI del backend», pero §12, abierta 1, la da por abierta mientras el JSON de OpenAPI no
  esté versionado en el repositorio, y `cameia-entrevista` solo lo genera en ejecución (`/v3/api-docs`, apagado fuera
  del perfil `local`; `src/main/resources/application.properties:65-67`), sin archivo
  versionado. Además, `interviewSession.dto.ts` reúne en un archivo `…/answers`, `…/reprocess`,
  `…/answers/audio` (ruta aún sin publicar, CM-345) y `…/consolidation` (CM-221), y la marca es
  por archivo. **Motivo:** el contrato ya está publicado, con su OpenAPI en el controlador
  (`InterviewSessionController.java:405-505`); los comentarios que dicen «previsto» llevan a
  error (informe §3, fila 23).
- **`errorCodes.ts` (v11.3 D7 y D9).** Solo se agregan `TURN_RETRY_LIMIT_REACHED` y
  `TURN_NOT_RETRYABLE`, copiados de `domain/exception/ErrorCode.java:183-186`: son los únicos
  códigos nuevos que cambian lo que se ve. `ANSWER_ALREADY_EXISTS`, `TURN_CONFLICT`,
  `IDEMPOTENCY_KEY_CONFLICT` y los del `422` siguen en el genérico (ADR-0008; CLAUDE.md §8: un
  genérico es honesto, uno específico equivocado no). Los `SESSION_*` ya estaban (#126).

**Hallazgos de v11.3 D3 (CA-5.2.6 frente al código, decidido el 12-11-2026).** CA-5.2.6, literal: «rechazarla
con el mensaje "Esta entrevista ya no admite esa acción.", no debe guardar la respuesta ni usar
la IA y la entrevista debe conservar su estado». Lo que hace la pantalla
(`useInterviewTurn.ts:75-80, 190-195`; `InterviewSessionPage.tsx:216-218, 236`):

- **Mensaje:** coincide con el literal (`AlertInline` de error con `interview:sesion.noAdmite`).
- **Campo y «Enviar»:** el CA no pide ocultarlos; la pantalla los oculta (fase `closed`). El
  texto escrito deja de verse.
- **Salida:** el CA no define ninguna acción, y la pantalla no ofrece ninguna (ni «Reintentar»
  ni «Ir al inicio»).
- **Pregunta y progreso:** se mantienen la pregunta k y «Pregunta k de 5».
- La fase `closed` es la misma de CA-5.5.5 (`SESSION_ALREADY_CLOSED`, HU-5.5): cambiar el campo
  o la salida tocaría código de #126.
- **Decisión (Juan José Arias, 12-11-2026):** se deja como está. El mensaje cumple el literal de
  CA-5.2.6; ocultar el campo y «Enviar» y no ofrecer salida no lo contradice, y la fase `closed`
  es del cierre de HU-5.5 (#126), que no es de CM-217.

**Riesgos y pendientes de CM-217 (v11.3)**

- **El contador se pierde al recargar.** Vive en `useState` (`useInterviewTurn.ts:131`). Además,
  hoy una recarga vuelve a `/entrenar/nueva` (HU-5.7). *(13-11: Backend sí lo conserva en
  `turno.reintentos_manuales` y lo publica en `…/state` como `pendingQuestion.retriesUsed`; el
  chat no lo lee. Con v11.3 D7 el front acata el `409` de Backend; leerlo es de HU-5.7.)*
- **Contrato publicado (13-11-2026).** `…/answers` y `…/reprocess` existen en `cameia-entrevista`
  `origin/develop` `48773cb`, con la ruta y el cuerpo que usa el front; la `200` pasa el mapper,
  incluida la pregunta 5 con `nextQuestion: null` (informe §3 a). Quedan sin comprobar las
  hipótesis H1 y H2 del Gateway (anotado para después). Las notas técnicas de HU-5.2 (O7) aún
  dicen `{turno_id, respuesta_texto}`.
- **Solo MSW (lección 6).** Las pruebas corren contra MSW: en verde no prueban que Backend mande
  `LLM_INVALID_OUTPUT`, ni el `code` en `…/reprocess`, ni que el tope cuadre con el suyo. v11.3
  D10 acerca los mocks al contrato real, pero siguen sin ser el servicio.
- **Con v11.3 D7 el estado final puede llegar un clic antes de lo que el front esperaba.** Si
  Backend contó un uso que el front no (red, base de datos, recarga), el mensaje final aparece
  cuando la pantalla aún creía tener un uso. Es lo que manda CA-5.2.20 (4 usos por respuesta);
  la diferencia está en quién los cuenta.
- **v11.3 D1 también toca la voz.** `isEvaluationFailure` lo usa `discardsAudio`
  (`useInterviewTurn.ts:109-113`): un `503 LLM_INVALID_OUTPUT` en `…/answers/audio` abrirá el
  panel y descartará la grabación. Es coherente con CA-5.2.19 («Aplica igual a una respuesta por
  voz ya transcrita»), pero la fila de §5 (HU-5.8) solo nombra `LLM_UNAVAILABLE` y
  `LLM_LIMIT_REACHED`, y no se cambió.
- **`EvaluationRetryPanel` es compartido.** También lo usa el cierre de HU-5.5
  (`InterviewSessionPage.tsx:207-213`): ocultar «Reintentar» debe ser opcional y no cambiar ese
  uso.

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
- **MP4/AAC sin prueba en el hook.** `useVoiceRecorder.test.ts` no prueba un `mimeType` real de
  MP4/AAC: no está comprobada la cadena que reporta el navegador al grabar MP4/AAC (§7,
  «Formatos»), y Safari, el que graba MP4/AAC, está fuera de alcance (CA-5.14.6).

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
- `EvaluationRetryPanel` usa el modo de carga de `Button` (`EvaluationRetryPanel.tsx:46-48`):
  CA-5.2.19 (fallo de la IA al evaluar la respuesta) no exige que «Reintentar» conserve su
  nombre; se deja así.
- *(Hecho en CM-217.)* El TSDoc de `reprocessTurn` (`api/interviewSession.api.ts`) ya nombra
  `LLM_UNAVAILABLE`, `LLM_LIMIT_REACHED` y `LLM_INVALID_OUTPUT` (v11.3 D1).
- Botón Atrás del navegador tras «Ir al inicio»: el estado del historial devuelve la pregunta 1
  con claves nuevas (HU-5.7, retomar una entrevista).
- Sombras de `BrandOrb` con valores arbitrarios en vez de tokens de elevación (CLAUDE.md §6).
- Caracteres de ancho cero (U+200B, U+200C, U+200D, U+2060): `trim()` no los quita, así que una
  respuesta formada solo por ellos no cuenta como vacía en CA-5.2.3 (respuesta vacía o de solo
  espacios).
- Las constantes 4000 y 2 (y la del tramo 2, v11.3 D2) viven en el front
  (`model/interviewSession.constants.ts`), en tensión con CLAUDE.md §3.7 (ninguna constante de
  negocio hardcodeada).
- El ejemplo del TSDoc de `src/utils/unicodeLength.ts` es incorrecto (línea 4): 👩‍💻 mide 5 con
  `String.length`, no 1, y son 3 puntos de código. Es una utilidad compartida; se corrige
  fuera de CM-217.
- **Leer `…/state` al abrir el chat (HU-5.7).** Con `pendingQuestion.retriesUsed` (0 a 4) y
  `pendingQuestion.status` (`PENDING`, `PROCESSING`, `RETRYING`) el chat podría retomar tras
  una recarga: abrir el panel si el turno espera reintento, arrancar el tramo con los usos ya
  gastados y avanzar si el turno ya se completó (`PendingQuestionResponse.java:17-25`;
  `GetSessionStateService.java:97`, `:111-113`). Es la opción 3 del informe: se cruza con
  HU-5.7 y con el cierre de CM-221, y necesita acuerdo con Ana Sofía y la PO.
- **Recuperar el caso `409 IDEMPOTENCY_KEY_CONFLICT` en `…/answers`.** Sigue mostrando el
  genérico (§4). Cambiar de clave al editar el texto no basta: si el primer envío ya se
  registró, Backend responde `409 ANSWER_ALREADY_EXISTS`. La salida correcta necesita `…/state`
  (punto anterior).
- **`…/answers/audio`.** No existe en `cameia-entrevista` `origin/develop` `48773cb`; la ruta la
  fija CM-345 (Vela, en curso). El front sigue usando la prevista (§5) y sus comentarios no
  cambian con v11.3 D11.
- **Hipótesis H1 y H2 del informe, por verificar en preproducción:** el Gateway entrega la `200`
  sin reescribirla (sin quitar `nextQuestion: null`) y propaga los `ProblemDetail` con el
  `code` intacto en `409` y `503`. Si no, el chat mostraría el genérico incluso para `LLM_*` y
  los `409` de v11.3 D7 a D9.

**Referencias de otras HU desactualizadas frente al backlog v11.3.** No son de CM-217; se
revisan cuando se vuelva a tocar esa HU.

- HU-5.8 (§1): dice que el backlog vigente es el v8.5 y cita los criterios v8.4; el backlog v11
  cambió HU-5.8 («Cambios v11»).
- HU-5.5 (§2, «No entra»): dice que el cierre y reporte no entra, pero el PR #126 ya lo
  implementó en esta feature.
- HU-5.8 (§5, tabla del audio): el `503` solo nombra `LLM_UNAVAILABLE` y `LLM_LIMIT_REACHED`;
  desde CM-217 también `LLM_INVALID_OUTPUT`.
- HU-5.8 y HU-5.5 (§5, tabla del audio): el `409` lleva a `errors:generico`, pero desde #126 los
  `409 SESSION_*` pasan a la fase `closed`.
- General (§8, punto 4.1): sigue diciendo 30 s; desde #126 la espera es de 130 s (CM-357).
- HU-5.8 (tabla de §6, §7 voz y Anexo A): siguen citando el backlog v8.4.
## Anexo A · Tareas de CM-317

En orden. Las pruebas se escriben en rojo antes de la implementación, como en CM-217.

| # | Tarea | CA o decisión | Estado |
| --- | --- | --- | --- |
| 1 | Verificar lo que el ADR 0009 dejó sin comprobar: `?url` hacia `onnxruntime-web/dist/…` (el `exports` del paquete no expone esas rutas), `pnpm dev` (rutas `/@fs/`, worklet, `.mjs`) | CM-316 D2 | Hecha (23-10-2026; bitácora CM-317, Tarea 1) |
| 2 | `vite.config.ts` (`assetFileNames` para `vad/`) y `hooks/sileroVad.ts`: URLs `?url` y creación de MicVAD con las opciones de §7 | Notas técnicas de HU-5.8 (O75, backlog v8.4); CM-316 D2; base de CA-5.8.9 a 5.8.11 | Hecha (24-10-2026; bitácora CM-317, Tarea 2) |
| 3 | Pruebas en rojo de `hooks/useVoiceRecorder.test.ts` | CA-5.8.2, 5.8.3, 5.8.4, 5.8.7, 5.8.9, 5.8.10, 5.8.11, 5.8.23, 5.8.25; notas técnicas de HU-5.8 (O75, backlog v8.4); CM-316 D4, D6; cancelación | Hecha (24-10-2026; bitácora CM-317, Tarea 3) |
| 4 | Pruebas en rojo de la página (filas «Nueva» y «Se amplía» de §6) | CA-5.8.5, 5.8.6, 5.8.8, 5.8.11, 5.8.13 a 5.8.15, 5.8.19, 5.8.21, 5.8.22, 5.8.24, 5.8.25; notas técnicas de HU-5.8 (O75, backlog v8.4); CM-316 D7, D8; audio de la pregunta anterior | Hecha (24-10-2026; bitácora CM-317, Tarea 4) |
| 5 | `useVoiceRecorder.ts`: MicVAD, conteo de tramos, orden de arranque, cancelación por intento, `vadFailed` y `unsupported`, tope con `performance.now`; sin medición por energía ni `AudioContext` propio | CA-5.8.2, 5.8.3, 5.8.4, 5.8.7, 5.8.9 a 5.8.11, 5.8.23, 5.8.25; notas técnicas de HU-5.8 (O75, backlog v8.4); CM-316 D4, D6 | Hecha (24-10-2026; bitácora CM-317, Tarea 5) |
| 6 | Revisar PRT-05.10 en Figma (CLAUDE.md §13) | CA-5.8.25 | Hecha (Juan José Arias, 23-10-2026; manda «Escenario + orbe», §9) |
| 7 | Página y `VoiceAnswerComposer`: «Enviar» sin modo de carga, con spinner visible y nombre accesible «Enviar» (CM-316 D7); aviso según CM-316 D8; temporizador de 20 s ligado al envío y limpiado; **descarte de la grabación tras un `503 LLM_*` con audio, para que tras un «Reintentar» exitoso la pregunta siguiente quede en `idle` sin el audio anterior**; descarte tras `413`, `415` y `422` genéricos; mensajes de CA-5.8.25 y del formato no admitido (sin «Grabar»); llave nueva en `es-CO` y `en` | CA-5.8.5, 5.8.6, 5.8.13 a 5.8.15, 5.8.24, 5.8.25; notas técnicas de HU-5.8 (O75, backlog v8.4); CM-316 D7, D8 | Hecha (24-10-2026; bitácora CM-317, Tarea 7) |
| 8 | Encabezados v8.2 → v8.4 (`model/interviewSession.constants.ts`, `pages/InterviewSessionPage.voice.test.tsx`) y TSDoc de `useVoiceRecorder` sin «provisional» | — | Hecha (24-10-2026; bitácora CM-317, Tarea 8) |
| 9 | `pnpm typecheck && pnpm lint && pnpm test`; `vite build`: chunk de Silero aparte y los cuatro archivos en `dist/vad/` | CLAUDE.md §2, ADR 0009 | Hecha (24-10-2026; bitácora CM-317, Tarea 9) |
| 10 | Verificación manual en Chrome, Edge y Firefox (Windows): 2 s, 1,9 s, silencio, 3:00, permiso negado, sin micrófono, asset bloqueado en DevTools; bitácora `docs/bitacora-ia/CM-317.md` | CA-5.8.2 a 5.8.4, 5.8.7, 5.8.9 a 5.8.11, 5.8.23, 5.8.25 | Hecha (24-10-2026; bitácora CM-317, Tarea 10) |
| 11 | Cierre del SPEC: archivos nuevos en la tabla de §7 y estados del plan de §6 | CLAUDE.md §16 | Hecha (24-10-2026; bitácora CM-317, Tarea 11) |

## Cierre de la entrevista (CM-221 · HU-5.5, backlog v10.2)

Contratos del aviso de Backend del 7-11-2026 (§6.1), propuestos hasta que Backend apruebe las
especificaciones de CM-216 y CM-220:

- Tras registrar la pregunta 5, el chat pide `POST …/consolidation` (`useInterviewClosing`, una sola
  vez; el endpoint es idempotente). Mientras responde: orbe girando, la última pregunta con
  «Procesando tu respuesta…» en lugar de «Tu entrevista terminó.», sin campo ni «Enviar» (CA-5.5.6,
  backlog v11). Con HU-5.5 ya no se usa «Tu entrevista terminó.» (CA-5.2.5 y CA-5.12.6, v11).
- `200` con `status: FINALIZADA`: el título pasa a «Tu entrevista terminó. Tu Reporte de Evaluación
  estará disponible en breve.», sin resultados ni resumen (CA-5.5.3).
- `503 SESSION_CONSOLIDATION_FAILED`, red u otra respuesta: «Ocurrió un error. Inténtalo de
  nuevo.» con «Reintentar», que pide un ciclo nuevo (CA-5.5.11).
- `409 SESSION_ABANDONED` al responder: «Sesión abandonada: no genera evaluación.», sin campo
  (CA-5.5.4). `409 SESSION_ALREADY_CLOSED` o `SESSION_TRANSITION_NOT_ALLOWED`: «Esta entrevista ya
  no admite esa acción.» (CA-5.5.5, CA-5.2.6).
- `…/answers`, `…/reprocess` y `…/consolidation` esperan hasta 130 s (`INTERVIEW_AI_TIMEOUT_MS`):
  el Gateway espera 120 s (CM-357).

**Diferencias conscientes:**

- CA-5.5.3 pide la acción «Ver mis entrevistas» (HU-5.10), pero esa pantalla no está en el plan de
  los Sprints 4 y 5 ni tiene tarjeta en Jira. No se muestra un botón sin destino; queda pendiente de
  la decisión de la PO (pregunta 4.4 del documento de Frontend del 4-11-2026).
- El chat pide la consolidación en vez de consultar `GET …/state` en bucle: con un solo pedido se
  cubren CA-5.5.6, CA-5.5.3 y CA-5.5.11. Se pidió a Backend confirmarlo.

