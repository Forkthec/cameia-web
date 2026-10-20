/**
 * Protege el paso 0 del wizard: seleccion de perfil (CA-4.2.1 a CA-4.2.3,
 * CA-4.2.6 a CA-4.2.8). Fuente: backlog v8.2.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ProfileSelector } from './ProfileSelector';
import type { ProfileSummaryItem } from '../../model/interviewSetup.types';

const ACTIVE_PROFILE: ProfileSummaryItem = {
  id: 'p1',
  name: 'Analista de datos',
  status: 'COMPLETED',
  targetRoles: [
    { professionalRoleId: 'r1', roleTitle: 'Frontend Developer' },
    { professionalRoleId: 'r2', roleTitle: 'QA Analyst' },
  ],
};

const DRAFT_PROFILE: ProfileSummaryItem = {
  id: 'p2',
  name: 'Borrador',
  status: 'IN_PROGRESS',
  targetRoles: [],
};

const SECOND_ACTIVE: ProfileSummaryItem = {
  id: 'p3',
  name: 'Ingeniero de software',
  status: 'COMPLETED',
  targetRoles: [{ professionalRoleId: 'r3', roleTitle: 'Backend Developer' }],
};

function renderSelector(props: Partial<React.ComponentProps<typeof ProfileSelector>> = {}) {
  const defaults: React.ComponentProps<typeof ProfileSelector> = {
    profiles: [ACTIVE_PROFILE],
    selectedProfileId: null,
    onSelectProfile: vi.fn(),
    isLoading: false,
    isError: false,
    onRetry: vi.fn(),
    ...props,
  };
  return render(
    <MemoryRouter>
      <ProfileSelector {...defaults} />
    </MemoryRouter>,
  );
}

describe('ProfileSelector', () => {
  it('muestra solo perfiles activos, no borradores (CA-4.2.1)', () => {
    renderSelector({ profiles: [ACTIVE_PROFILE, DRAFT_PROFILE] });
    expect(screen.getByText('Analista de datos')).toBeInTheDocument();
    expect(screen.queryByText('Borrador')).not.toBeInTheDocument();
  });

  it('muestra roles objetivo junto al nombre del perfil (CA-4.2.1)', () => {
    renderSelector();
    expect(screen.getByText('Frontend Developer, QA Analyst')).toBeInTheDocument();
  });

  it('preselecciona automaticamente con un unico perfil activo (CA-4.2.2)', () => {
    const onSelect = vi.fn();
    renderSelector({ onSelectProfile: onSelect });
    expect(onSelect).toHaveBeenCalledWith('p1');
  });

  it('no preselecciona con 2+ perfiles activos (CA-4.2.1)', () => {
    const onSelect = vi.fn();
    renderSelector({
      profiles: [ACTIVE_PROFILE, SECOND_ACTIVE],
      onSelectProfile: onSelect,
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('muestra estado vacio sin perfiles (CA-4.2.3)', () => {
    renderSelector({ profiles: [] });
    expect(
      screen.getByText('Necesitas un Perfil Profesional activo para iniciar una entrevista.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Crear mi Perfil Profesional')).toBeInTheDocument();
  });

  it('muestra estado vacio solo con borradores (CA-4.2.6)', () => {
    renderSelector({ profiles: [DRAFT_PROFILE] });
    expect(
      screen.getByText('Finaliza un Perfil Profesional para iniciar una entrevista.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Terminar mi perfil')).toBeInTheDocument();
  });

  it('llama onSelectProfile al hacer clic en un perfil (CA-4.2.1)', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderSelector({
      profiles: [ACTIVE_PROFILE, SECOND_ACTIVE],
      onSelectProfile: onSelect,
    });
    await user.click(screen.getByText('Ingeniero de software'));
    expect(onSelect).toHaveBeenCalledWith('p3');
  });

  it('muestra skeleton durante carga', () => {
    renderSelector({ isLoading: true });
    expect(screen.getAllByRole('presentation')).toHaveLength(2);
  });

  it('muestra estado de error con boton reintentar', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderSelector({ isError: true, profiles: [], onRetry });
    await user.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalled();
  });
});
