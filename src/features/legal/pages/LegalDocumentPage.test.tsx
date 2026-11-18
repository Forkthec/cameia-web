/**
 * Página pública de una política (CM-365, criterio 1): título, versión
 * vigente y secciones del namespace `legal`.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POLICY_VERSION } from '@/config/policy';
import i18n from '@/i18n';
import { LegalDocumentPage } from './LegalDocumentPage';

const SECTIONS = [{ titulo: 'Finalidad', parrafos: ['Usamos tus datos para la práctica.'] }];

describe('LegalDocumentPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es-CO');
  });
  afterEach(() => {
    i18n.addResourceBundle(
      'es-CO',
      'legal',
      { documentos: { terminos: { secciones: [] } } },
      true,
      true,
    );
  });

  it('muestra el título y la versión vigente', () => {
    render(
      <MemoryRouter>
        <LegalDocumentPage document="politicaDatos" />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Política de tratamiento de datos personales',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Versión ${POLICY_VERSION}`))).toBeInTheDocument();
  });

  it('pinta las secciones del texto aprobado', () => {
    i18n.addResourceBundle(
      'es-CO',
      'legal',
      { documentos: { terminos: { secciones: SECTIONS } } },
      true,
      true,
    );
    render(
      <MemoryRouter>
        <LegalDocumentPage document="terminos" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Finalidad' })).toBeInTheDocument();
    expect(screen.getByText('Usamos tus datos para la práctica.')).toBeInTheDocument();
  });
});
