/**
 * Ruta del Reporte de Evaluación (HU-6.4): propia por sesión y privada. Se monta dentro del
 * `AppShell` (menú general disponible, HU-6.4 navegación). Path duplicado de
 * `app/router/routes.ts` — ver nota en `features/landing/routes.tsx`.
 */
import type { RouteObject } from 'react-router';
import { EvaluationReportPage } from './pages/EvaluationReportPage';

export const evaluationReportShellRoutes: RouteObject[] = [
  { path: '/entrenar/sesion/:sessionId/reporte', element: <EvaluationReportPage /> },
];
