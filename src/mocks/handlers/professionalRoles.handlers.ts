/**
 * Simula el catálogo cerrado de roles profesionales TI (HU-2.11, CM-69),
 * `GET /api/v1/profiles/professional-roles` — backend real:
 * `ProfessionalRoleController.java` (CM-23), solo lectura. Ruta corregida en
 * CM-195: el Gateway solo enruta bajo `Path=/api/v1/profiles/**`, así que el
 * backend movió este endpoint el 19-sep-2026 (CM-176); la ruta vieja
 * (`/api/v1/professional-roles`, sin el prefijo `/profiles`) ya no existe. El
 * contenido del catálogo vive en `src/mocks/data/catalogs.ts`
 * (`PROFESSIONAL_ROLES`), compartido con `profiles.handlers.ts` para validar
 * `professionalRoleId` al agregar o sustituir un rol objetivo.
 */
import { http, HttpResponse, type HttpHandler } from 'msw';
import { PROFESSIONAL_ROLES } from '../data/catalogs';

export const professionalRolesHandlers: HttpHandler[] = [
  http.get('*/api/v1/profiles/professional-roles', () => {
    return HttpResponse.json(PROFESSIONAL_ROLES, { status: 200 });
  }),
];
