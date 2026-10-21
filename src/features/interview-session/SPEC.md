---
feature: interview-session
estado: EN_CURSO
hu: [HU-5.2]
prt: [PRT-05.10]
jira: [CM-217]
rutas: [/entrenar/sesion/:sessionId]
documentacion: tsdoc-es
backlog: 16102026_01_v8.2
decisiones: []
figma: Cameia · Mockups MVP
revisado: 2026-10-20
---

# Feature · Chat de la entrevista (Simulación)

## 1. Propósito

Pantalla donde el Usuario responde, una por una, las 5 preguntas principales de una
Simulación en curso, sin ver retroalimentación hasta el final (HU-5.2).

## 2. Alcance

**Entra (CM-217):** respuesta escrita, «Enviar» bloqueado vacío o doble, progreso
«Pregunta k de 5», errores de red, de la IA y de entrevista ajena, «Reintentar» (máx. 2) e
«Ir al inicio», y «Tu entrevista terminó.» tras la pregunta 5.

**No entra:** respuesta por voz (HU-5.8, CM-317), retomar tras recarga (HU-5.7), cierre y
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
| `src/design-system/molecules/BrandOrb/BrandOrb.tsx` | Hecho |
| `src/design-system/molecules/ProgressArc/ProgressArc.tsx` | Hecho |

## 8. Bloqueos

- Backend: `…/answers` y `…/reprocess` no existen en cameia-entrevista (CM-204/CM-207 y
  relacionados). Sin ellos no se puede probar contra el backend real.
- La pregunta 1 llega desde la pantalla de inicio (HU-4.5, CM-213).

## 9. Notas

- Sin textos fuera del backlog: el orbe solo anuncia «Procesando tu respuesta…». No hay botón
  de salida en el chat (CA-5.2.15 y el backlog no lo define).
- El número total de preguntas viene del backend en el progreso (CLAUDE.md §3.7).
- Mientras sea Simulación por voz (CM-317), el campo de texto queda disponible (CA-5.8.19).
