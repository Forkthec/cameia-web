/**
 * Prueba de humo del catálogo simulado de roles profesionales (CM-69):
 * protege que el endpoint devuelva la misma lista que
 * `src/mocks/data/catalogs.ts` (`PROFESSIONAL_ROLES`), la fuente única de
 * este catálogo cerrado (HU-2.11).
 */
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/services/http/httpClient';
import { PROFESSIONAL_ROLES } from '../data/catalogs';

interface ProfessionalRoleResponse {
  id: string;
  name: string;
}

describe('professionalRolesHandlers', () => {
  it('devuelve el catálogo completo de roles profesionales', async () => {
    const roles = await httpClient.get<ProfessionalRoleResponse[]>('/api/v1/professional-roles');

    expect(roles).toEqual(PROFESSIONAL_ROLES);
  });
});
