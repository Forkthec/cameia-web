import type { RouteObject } from 'react-router';
import { SessionLayout } from '@/layouts/SessionLayout';
import { InterviewSessionPage } from './pages/InterviewSessionPage';

/** Path duplicado de `app/router/routes.ts` — ver nota en `features/landing/routes.tsx`. */
export const interviewSessionRoutes: RouteObject[] = [
  {
    path: '/entrenar/sesion/:sessionId',
    element: (
      <SessionLayout>
        <InterviewSessionPage />
      </SessionLayout>
    ),
  },
];
