---
feature: evaluation-report
estado: EN_CURSO
hu: [HU-6.4]
prt: [PRT-06.03]
jira: [CM-379]
rutas: [/entrenar/sesion/:sessionId/reporte]
documentacion: tsdoc-es
backlog: 16112026_02
decisiones: []
figma: Cameia · Mockups MVP
revisado: 2026-11-17
---

# Feature · Reporte de Evaluación (evaluation-report)

## 1. Propósito

Mostrar el Reporte de Evaluación de una Simulación finalizada (HU-6.4): métricas de contenido y de
voz, Método STAR, las 5 preguntas con su respuesta, y los estados de carga, sin resultado, sesión
abandonada o sin terminar, sesión ajena y error. Fuentes: backlog v11.8 (hoja HE-06, filas 35 a 41)
y aviso de Backend del 16-11-2026 (`16112026_v1_reporte-de-evaluacion-formato-de-errores-para-frontend.md`
y su anexo de textos).

## 2. Alcance

- Pantalla con dirección propia por sesión, dentro del `AppShell` (menú general disponible).
- Se llega con «Ver Reporte de Evaluación» del cierre de la entrevista (CA-5.5.3, en
  `interview-session`) o pegando el enlace.
- Fuera: «Mis entrevistas» (HU-5.10), resumen esencial y detalle por plan (HU-6.5, HU-6.6): en el
  MVP todos los planes ven el mismo reporte y el detalle aparece como «Reporte completo ·
  Próximamente».

## 3. Comportamiento esperado

| Estado | Qué se ve |
| ------ | --------- |
| Carga | «Tu reporte se está generando.» con indicador, sin métricas (CA-6.4.3). Con 202 se vuelve a consultar cada 3 s; a los 2 minutos, el error del servidor. |
| Vacío | No aplica: el reporte trae siempre las 7 métricas y las 5 preguntas. Cada dato que falta tiene su texto: «Sin resultado» con su explicación (CA-6.4.2), «Respondida por texto: sin datos de voz.», «Respondida por voz: sin datos de voz.» y «Sin respuesta registrada.» (CA-6.4.7). |
| Error | 404: «No encontramos lo que buscabas.» (CA-6.4.5); 409: «Sesión abandonada: no genera evaluación.» o «Tu entrevista aún no ha terminado.» (CA-6.4.4), con «Volver a inicio»; 5xx o sin conexión: su mensaje y «Reintentar» (CA-6.4.6). |
| Éxito | Encabezado (fecha local larga, idioma, tono), aviso sobre la IA, métricas con valor, unidad y barra donde hay escala, Método STAR, preguntas, «Reporte completo · Próximamente» y «Volver a inicio» (CA-6.4.1, CA-6.4.7). |

Cada métrica, el título «Método STAR», cada respuesta y los datos de voz llevan un «?» (`HelpTip`
del design system): abre con clic, toque, Tab + Enter o el cursor; cierra con Esc, al tocar fuera
o con otro clic; un solo texto abierto a la vez.

## 4. Contrato observable

- Números: un decimal redondeado de la mitad hacia arriba (3,46 → 3,5; 4,05 → 4,1), coma en
  español y punto en inglés; Ritmo de Habla sin decimales (`model/formatReportNumber.ts`).
- Un valor `null` es «Sin resultado»; un 0 se muestra como 0. En el STAR, `level: null` es «Sin
  resultado» y `level: 0` es «0 de 4».
- Las barras se leen con su valor y unidad (`aria-valuetext`), no solo la barra.

## 5. Enlace HTTP · PROVISIONAL

`GET /api/v1/interviews/sessions/{sessionId}/evaluation-report` (Backend, CM-380). Espera hasta 120 s
(la primera consulta genera el reporte). Contrato en `api/evaluationReport.dto.ts`; el mapper
descarta códigos o unidades que la pantalla no conoce. Mock en
`src/mocks/handlers/evaluationReport.handlers.ts`, con los ejemplos del aviso de Backend.

## 6. Criterios de aceptación

| CA | Dónde se prueba |
| -- | --------------- |
| CA-6.4.1 a CA-6.4.7 | `src/features/evaluation-report/pages/EvaluationReportPage.test.tsx` |
| Redondeo y formato | `src/features/evaluation-report/model/formatReportNumber.test.ts` |
| «?» (teclado, cursor, Esc, fuera) | `src/design-system/molecules/HelpTip/HelpTip.test.tsx` |
| CA-5.5.3 (botón en el cierre) | `src/features/interview-session/pages/InterviewSessionPage.test.tsx` |

## 7. Estado de implementación

| Archivo | Qué hace | Prueba |
| ------- | -------- | ------ |
| `src/features/evaluation-report/pages/EvaluationReportPage.tsx` | Pantalla y estados | `src/features/evaluation-report/pages/EvaluationReportPage.test.tsx` |
| `src/features/evaluation-report/hooks/useEvaluationReport.ts` | Consulta, 202 cada 3 s hasta 2 min, errores por `code` | `src/features/evaluation-report/pages/EvaluationReportPage.test.tsx` |
| `src/features/evaluation-report/organisms/MetricCard/MetricCard.tsx` | Una métrica | `src/features/evaluation-report/pages/EvaluationReportPage.test.tsx` |
| `src/features/evaluation-report/organisms/StarCard/StarCard.tsx` | STAR de una pregunta | `src/features/evaluation-report/pages/EvaluationReportPage.test.tsx` |
| `src/features/evaluation-report/organisms/QuestionResultCard/QuestionResultCard.tsx` | Una pregunta con su respuesta | `src/features/evaluation-report/pages/EvaluationReportPage.test.tsx` |
| `src/design-system/molecules/HelpTip/HelpTip.tsx` | Botón «?» sin dominio | `src/design-system/molecules/HelpTip/HelpTip.test.tsx` |
| `src/design-system/atoms/ProgressBar/ProgressBar.tsx` | Gana `min` (escala 1 a 5) y `valueText` | `src/design-system/atoms/ProgressBar/ProgressBar.test.tsx` |

## 8. Bloqueos

- Backend publica el servicio en CM-380 (17 y 18 de noviembre). Mientras tanto, la pantalla corre
  contra el mock. Falta probarla en preproducción con una entrevista por texto y otra por voz.

## 9. Notas

- Sin prototipo nuevo obligatorio: se siguió el estilo actual del Cliente Web (PRT-06.03 como
  referencia) y el prototipo de Frontend del 17-11-2026.
- Los títulos visibles «Respuesta» y «Datos de voz» no vienen en el anexo de textos de Backend; los
  agregó Frontend para que cada «?» tenga a qué acompañar (`report:pantalla.respuestaTitulo` y
  `report:pantalla.datosDeVozTitulo`).
