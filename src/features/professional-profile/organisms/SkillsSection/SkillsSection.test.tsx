/**
 * Comportamiento observable de `SkillsSection` (HU-2.5, CM-65): estado
 * vacío con `EmptyState`, un alta válida llega a `onAdd`, campos
 * obligatorios bloquean el envío, un texto duplicado (ignorando mayúsculas
 * y espacios) bloquea el envío sin llamar a `onAdd`, quitar un chip llama a
 * `onRemove` con su id, un error de alta se anuncia como alerta, y
 * `showSectionTitle={false}` no duplica el título pero conserva el nombre
 * accesible de la sección (mismo criterio que `EducationSection.test.tsx`).
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SkillItem } from '../../model/profile.types';
import { SkillsSection } from './SkillsSection';

const levelOptions = [
  { value: 'BASIC', label: 'Básico' },
  { value: 'INTERMEDIATE', label: 'Intermedio' },
  { value: 'ADVANCED', label: 'Avanzado' },
];

const existingItem: SkillItem = {
  id: 'skill-1',
  skillName: 'React',
  level: 'ADVANCED',
  provenance: 'MANUAL',
};

const baseProps = {
  formId: 'skills-form',
  items: [] as SkillItem[],
  onAdd: () => {},
  onRemove: () => {},
  sectionTitle: 'Habilidades',
  skillNameLabel: 'Habilidad',
  skillNamePlaceholder: 'Escribe aquí',
  skillNameErrorRequired: 'Ingresa una habilidad.',
  skillNameErrorTooLong: 'La habilidad no puede superar los 255 caracteres.',
  skillNameErrorDuplicate: 'Esa habilidad ya está en tu perfil.',
  levelLabel: 'Nivel',
  levelPlaceholder: 'Selecciona una opción',
  levelOptions,
  levelErrorRequired: 'Elige un nivel.',
  formatItemLabel: (item: SkillItem) => `${item.skillName} · ${item.level}`,
  addButtonLabel: 'Agregar habilidad',
  addingButtonLabel: 'Agregando…',
  removeItemLabel: (item: SkillItem) => `Quitar ${item.skillName}`,
  emptyStateTitle: 'Todavía no agregas habilidades',
  emptyStateDescription: 'Agrega al menos una para poder finalizar tu perfil.',
};

describe('SkillsSection', () => {
  it('sin ítems muestra el estado vacío', () => {
    render(<SkillsSection {...baseProps} />);

    expect(screen.getByText('Todavía no agregas habilidades')).toBeInTheDocument();
  });

  it('un alta válida llega a onAdd con los valores del formulario', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<SkillsSection {...baseProps} onAdd={onAdd} />);

    await user.type(screen.getByLabelText('Habilidad'), 'React');
    await user.selectOptions(screen.getByLabelText('Nivel'), 'ADVANCED');
    const form = document.getElementById('skills-form') as HTMLFormElement;
    form.requestSubmit();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd).toHaveBeenCalledWith({ skillName: 'React', level: 'ADVANCED' });
  });

  it('sin habilidad ni nivel bloquea el envío y no llama a onAdd', async () => {
    const onAdd = vi.fn();
    render(<SkillsSection {...baseProps} onAdd={onAdd} />);

    const form = document.getElementById('skills-form') as HTMLFormElement;
    form.requestSubmit();

    expect(await screen.findByText('Ingresa una habilidad.')).toBeInTheDocument();
    expect(screen.getByText('Elige un nivel.')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('un texto duplicado, ignorando mayúsculas y espacios, bloquea el envío sin llamar a onAdd', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<SkillsSection {...baseProps} items={[existingItem]} onAdd={onAdd} />);

    await user.type(screen.getByLabelText('Habilidad'), '  react  ');
    await user.selectOptions(screen.getByLabelText('Nivel'), 'BASIC');
    const form = document.getElementById('skills-form') as HTMLFormElement;
    form.requestSubmit();

    expect(await screen.findByText('Esa habilidad ya está en tu perfil.')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('quitar un chip existente llama a onRemove con su id', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<SkillsSection {...baseProps} items={[existingItem]} onRemove={onRemove} />);

    await user.click(screen.getByRole('button', { name: 'Quitar React' }));

    expect(onRemove).toHaveBeenCalledWith('skill-1');
  });

  it('un error de alta se anuncia como alerta', () => {
    render(<SkillsSection {...baseProps} addErrorMessage="No se pudo agregar la habilidad." />);

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo agregar la habilidad.');
  });

  it('showSectionTitle=false no renderiza el encabezado pero conserva el nombre accesible de la sección', () => {
    render(<SkillsSection {...baseProps} showSectionTitle={false} />);

    expect(screen.queryByRole('heading', { name: 'Habilidades' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Habilidades' })).toBeInTheDocument();
  });
});
