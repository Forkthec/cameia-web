/**
 * Protege el paso 1 del wizard: Oferta Laboral y Rol Objetivo
 * (CA-4.2.4, CA-4.2.5, CA-4.2.9 a CA-4.2.16). Fuente: backlog v8.2.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OfferAndRoleForm } from './OfferAndRoleForm';
import type { ProfileSummaryItem } from '../../model/interviewSetup.types';
import type { ProfessionalRoleMapped } from '../../api/interviewSetup.mapper';

const PROFILE: ProfileSummaryItem = {
  id: 'p1',
  name: 'Analista de datos',
  status: 'COMPLETED',
  targetRoles: [{ professionalRoleId: 'r1', roleTitle: 'Frontend Developer' }],
};

const ROLES: ProfessionalRoleMapped[] = [
  { id: 'r1', name: 'Frontend Developer', category: 'Desarrollo' },
  { id: 'r2', name: 'Backend Developer', category: 'Desarrollo' },
  { id: 'r3', name: 'QA Analyst', category: 'Calidad' },
];

function renderForm(props: Partial<React.ComponentProps<typeof OfferAndRoleForm>> = {}) {
  const defaults: React.ComponentProps<typeof OfferAndRoleForm> = {
    selectedProfile: PROFILE,
    roles: ROLES,
    isLoadingRoles: false,
    isErrorRoles: false,
    onRetryRoles: vi.fn(),
    jobOffer: '',
    onJobOfferChange: vi.fn(),
    selectedRoleId: null,
    onRoleSelect: vi.fn(),
    jobOfferError: null,
    roleError: null,
    ...props,
  };
  return render(<OfferAndRoleForm {...defaults} />);
}

describe('OfferAndRoleForm', () => {
  it('muestra el campo de oferta laboral con contador (CA-4.2.4)', () => {
    renderForm({ jobOffer: 'Texto de prueba' });
    expect(screen.getByText('15 / 3000 caracteres')).toBeInTheDocument();
  });

  it('llama onJobOfferChange al escribir en el textarea', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderForm({ onJobOfferChange: onChange });
    const textarea = screen.getByPlaceholderText('Pega aquí la oferta laboral (opcional)');
    await user.type(textarea, 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('muestra error cuando la oferta excede el limite (CA-4.2.12)', () => {
    renderForm({ jobOfferError: 'La oferta laboral no puede superar los 3000 caracteres.' });
    expect(
      screen.getByText('La oferta laboral no puede superar los 3000 caracteres.'),
    ).toBeInTheDocument();
  });

  it('muestra el campo de rol objetivo con placeholder', () => {
    renderForm();
    expect(screen.getByPlaceholderText('Busca un rol objetivo')).toBeInTheDocument();
  });

  it('muestra skeleton durante carga de roles', () => {
    renderForm({ isLoadingRoles: true });
    // Esqueletos del átomo `Skeleton` (decorativos) dentro de un contenedor aria-busy (CM-208).
    expect(document.querySelector('[aria-busy="true"]')?.children).toHaveLength(2);
  });

  it('muestra estado de error cuando falla carga de roles', () => {
    renderForm({ isErrorRoles: true, roles: [] });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('muestra «Elige un rol objetivo de la lista.» bajo el rol cuando se pide (CA-4.2.15/16)', () => {
    renderForm({ roleError: 'Elige un rol objetivo de la lista.' });
    expect(screen.getByText('Elige un rol objetivo de la lista.')).toBeInTheDocument();
  });

  it('cancela soltar un archivo sobre la oferta y conserva el texto (CA-4.2.13)', () => {
    renderForm({ jobOffer: 'Texto previo' });
    const textarea = screen.getByPlaceholderText('Pega aquí la oferta laboral (opcional)');
    const event = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: { types: ['Files'], dropEffect: 'copy' },
    });
    textarea.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(textarea).toHaveValue('Texto previo');
  });
});
