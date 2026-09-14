import type { RouteObject } from 'react-router';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

/** Paths duplicados de `app/router/routes.ts` — ver nota en `features/landing/routes.tsx`. */
export const authRoutes: RouteObject[] = [
  {
    path: '/registro',
    element: (
      <AuthLayout>
        <RegisterPage />
      </AuthLayout>
    ),
  },
  {
    path: '/ingresar',
    element: (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },
];
