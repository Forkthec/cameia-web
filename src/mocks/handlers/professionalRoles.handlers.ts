/**
 * Simula el catálogo cerrado de roles profesionales TI (HU-2.11, CM-69),
 * `GET /api/v1/professional-roles` — backend real: `ProfessionalRoleController.java`
 * (CM-23), solo lectura. El contenido del catálogo vive en
 * `src/mocks/data/catalogs.ts` (`PROFESSIONAL_ROLES`), compartido con
 * `profiles.handlers.ts` para validar `professionalRoleId` al agregar o
 * sustituir un rol objetivo.
 */
import { http, HttpResponse, type HttpHandler } from 'msw';
import { PROFESSIONAL_ROLES } from '../data/catalogs';

export const professionalRolesHandlers: HttpHandler[] = [
  http.get('*/api/v1/professional-roles', () => {
    return HttpResponse.json(PROFESSIONAL_ROLES, { status: 200 });
  }),
];
