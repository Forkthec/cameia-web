/**
 * Rutas públicas de las tres políticas (CM-365). Viven fuera de los guardias
 * de sesión: se abren desde el registro y también con sesión iniciada.
 */
import type { RouteObject } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { LegalDocumentPage } from './pages/LegalDocumentPage';

export const legalRoutes: RouteObject[] = [
  { path: ROUTES.politicaDatos, element: <LegalDocumentPage document="politicaDatos" /> },
  { path: ROUTES.avisoPrivacidad, element: <LegalDocumentPage document="avisoPrivacidad" /> },
  { path: ROUTES.terminos, element: <LegalDocumentPage document="terminos" /> },
];
