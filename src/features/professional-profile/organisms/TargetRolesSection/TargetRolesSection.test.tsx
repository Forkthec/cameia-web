/**
 * Comportamiento observable de `TargetRolesSection` (HU-2.11, CM-69): estado
 * vacío con `EmptyState`, elegir una opción del catálogo llama a `onAdd`, un
 * rol ya usado no vuelve a aparecer como opción, el tope de roles oculta el
 * selector de alta, sustituir llama a `onSubstitute` con el id del Rol
 * Objetivo (nunca "eliminar y agregar" — memo del PO del 13-sep, C-05),
 * eliminar llama a `onRemove` con su id, el único rol de un perfil
 * `COMPLETED` no se puede eliminar, un error se anuncia como alerta, y
 * `showSectionTitle={false}` no duplica el título pero conserva el nombre
 * accesible de la sección (mismo criterio que `EducationSection.test.tsx`).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ProfessionalRole, TargetRoleItem } from '../../model/profile.types';
import { TargetRolesSection } from './TargetRolesSection';

const catalog: ProfessionalRole[] = [
  { id: 'backend-developer', name: 'Desarrollador Backend' },
  { id: 'frontend-developer', name: 'Desarrollador Frontend' },
  { id: 'qa-analyst', name: 'Analista de QA' },
];

const existingItem: TargetRoleItem = {
  id: 'target-role-1',
  professionalRoleId: 'backend-developer',
  provenance: 'MANUAL',
};

const baseProps = {
  items: [] as TargetRoleItem[],
  catalog,
  onAdd: () => {},
  onSubstitute: () => {},
  onRemove: () => {},
  sectionTitle: 'Roles objetivo',
  addLabel: 'Agregar rol objetivo',
  addPlaceholder: 'Busca un rol en el catálogo',
  addingLabel: 'Agregando rol objetivo…',
  noResultsLabel: 'No encontramos ese rol en el catálogo.',
  maxReachedMessage: 'Ya tienes el máximo de 5 roles objetivo.',
  substituteFieldLabel: 'Elige el nuevo rol objetivo',
  substitutePlaceholder: 'Selecciona una opción',
  substituteItemLabel: (roleName: string) => `Sustituir ${roleName}`,
  substitutingItemLabel: 'Sustituyendo…',
  removeItemLabel: (roleName: string) => `Eliminar ${roleName}`,
  removingItemLabel: 'Eliminando…',
  removeLastRoleBlockedHint: 'No puedes quedarte sin roles objetivo con el perfil activo.',
  emptyStateTitle: 'Todavía no agregas roles objetivo',
  emptyStateDescription: 'Agrega al menos uno para poder finalizar tu perfil.',
};

describe('TargetRolesSection', () => {
  it('sin ítems muestra el estado vacío', () => {
    render(<TargetRolesSection {...baseProps} />);

    expect(screen.getByText('Todavía no agregas roles objetivo')).toBeInTheDocument();
  });

  it('elegir una opción del catálogo llama a onAdd con su id', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<TargetRolesSection {...baseProps} onAdd={onAdd} />);

    await user.click(screen.getByRole('combobox', { name: 'Agregar rol objetivo' }));
    await user.click(screen.getByRole('option', { name: 'Desarrollador Backend' }));

    expect(onAdd).toHaveBeenCalledWith('backend-developer');
  });

  it('un rol ya asociado no vuelve a aparecer como opción para agregar', async () => {
    const user = userEvent.setup();
    render(<TargetRolesSection {...baseProps} items={[existingItem]} />);

    await user.click(screen.getByRole('combobox', { name: 'Agregar rol objetivo' }));

    expect(screen.queryByRole('option', { name: 'Desarrollador Backend' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Desarrollador Frontend' })).toBeInTheDocument();
  });

  it('al llegar al tope se oculta el selector de alta y se muestra el mensaje de tope', () => {
    const fullCatalog: ProfessionalRole[] = Array.from({ length: 5 }, (_, index) => ({
      id: `role-${index}`,
      name: `Rol ${index}`,
    }));
    const items: TargetRoleItem[] = fullCatalog.map((role, index) => ({
      id: `target-role-${index}`,
      professionalRoleId: role.id,
      provenance: 'MANUAL',
    }));
    render(<TargetRolesSection {...baseProps} catalog={fullCatalog} items={items} />);

    expect(
      screen.queryByRole('combobox', { name: 'Agregar rol objetivo' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Ya tienes el máximo de 5 roles objetivo.')).toBeInTheDocument();
  });

  it('sustituir un rol llama a onSubstitute con el id del Rol Objetivo y el nuevo rol profesional', async () => {
    const user = userEvent.setup();
    const onSubstitute = vi.fn();
    render(
      <TargetRolesSection {...baseProps} items={[existingItem]} onSubstitute={onSubstitute} />,
    );

    await user.click(screen.getByRole('button', { name: 'Sustituir Desarrollador Backend' }));
    await user.selectOptions(
      screen.getByLabelText('Elige el nuevo rol objetivo'),
      'frontend-developer',
    );

    expect(onSubstitute).toHaveBeenCalledWith('target-role-1', 'frontend-developer');
  });

  it('eliminar un ítem existente llama a onRemove con su id', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<TargetRolesSection {...baseProps} items={[existingItem]} onRemove={onRemove} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar Desarrollador Backend' }));

    expect(onRemove).toHaveBeenCalledWith('target-role-1');
  });

  it('el único rol objetivo de un perfil COMPLETED no se puede eliminar', () => {
    render(<TargetRolesSection {...baseProps} items={[existingItem]} isProfileCompleted />);

    expect(screen.getByRole('button', { name: 'Eliminar Desarrollador Backend' })).toBeDisabled();
  });

  it('el único rol objetivo de un perfil IN_PROGRESS sí se puede eliminar', () => {
    render(<TargetRolesSection {...baseProps} items={[existingItem]} isProfileCompleted={false} />);

    expect(
      screen.getByRole('button', { name: 'Eliminar Desarrollador Backend' }),
    ).not.toBeDisabled();
  });

  it('un error de alta se anuncia como alerta', () => {
    render(
      <TargetRolesSection {...baseProps} addErrorMessage="No se pudo agregar el rol objetivo." />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo agregar el rol objetivo.');
  });

  it('showSectionTitle=false no renderiza el encabezado pero conserva el nombre accesible de la sección', () => {
    render(<TargetRolesSection {...baseProps} showSectionTitle={false} />);

    expect(screen.queryByRole('heading', { name: 'Roles objetivo' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Roles objetivo' })).toBeInTheDocument();
  });
});
