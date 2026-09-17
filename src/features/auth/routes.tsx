import type { RouteObject } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

/**
 * `LoginPage` ya compone su propio `AuthLayout` (necesita pasarle
 * `headline`, distinto por pantalla) — aquí solo se envuelve `RegisterPage`,
 * que sigue siendo un placeholder sin copy propio (CM-34, fuera de alcance).
 */
export const authRoutes: RouteObject[] = [
  {
    path: ROUTES.registro,
    element: (
      <AuthLayout>
        <RegisterPage />
      </AuthLayout>
    ),
  },
  {
    path: ROUTES.ingresar,
    element: <LoginPage />,
  },
];
