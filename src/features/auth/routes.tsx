import type { RouteObject } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

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

/**
 * Va aparte de `authRoutes` porque su guard es el contrario (`CM-14`):
 * `/verificar-correo` exige sesión (`RequireAuth`) pero no exige el correo
 * verificado — es justamente de donde se sale de ese estado, así que no puede
 * colgar de `RequireVerifiedEmail` ni de `RedirectIfAuthenticated`.
 */
export const verificarCorreoRoutes: RouteObject[] = [
  {
    path: ROUTES.verificarCorreo,
    element: <VerifyEmailPage />,
  },
];
