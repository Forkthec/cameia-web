import type { RouteObject } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

/**
 * `LoginPage` y `RegisterPage` (CM-34) componen cada una su propio
 * `AuthLayout` con el `headline` que les corresponde — ninguna vive
 * envuelta aquí (mismo criterio para las dos desde que `RegisterPage` dejó
 * de ser un placeholder).
 */
export const authRoutes: RouteObject[] = [
  {
    path: ROUTES.registro,
    element: <RegisterPage />,
  },
  {
    path: ROUTES.ingresar,
    element: <LoginPage />,
  },
];
