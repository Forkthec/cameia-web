/**
 * Comportamiento observable de `WorkExperienceSection` (HU-2.4, CM-61):
 * estado vacío, alta válida con fecha de fin, exclusión mutua de los dos
 * checkboxes ("Trabajo aquí actualmente" / "No recuerdo la fecha exacta de
 * finalización") — marcar uno desmarca el otro y oculta la fecha de fin —,
 * sin ninguno marcado la fecha de fin es obligatoria, el contador de la
 * descripción refleja el conteo real y su `maxLength` corta en 500, y
 * eliminar un ítem llama a `onRemove` con su id.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { WorkExperienceItem } from '../../model/profile.types';
import { WorkExperienceSection } from './WorkExperienceSection';

const existingItem: WorkExperienceItem = {
  id: 'exp-1',
  company: 'CAMEIA',
  position: 'Desarrolladora backend',
  description: null,
  startDate: '2024-01',
  endDate: null,
  employmentStatus: 'CURRENT',
  provenance: 'MANUAL',
};

const baseProps = {
  formId: 'work-experience-form',
  items: [] as WorkExperienceItem[],
  onAdd: () => {},
  onRemove: () => {},
  sectionTitle: 'Experiencia Laboral',
  positionLabel: 'Cargo',
  positionPlaceholder: 'Escribe aquí',
  positionErrorRequired: 'Ingresa el cargo.',
  companyLabel: 'Empresa',
  companyPlaceholder: 'Escribe aquí',
  companyErrorRequired: 'Ingresa la empresa.',
  startDateLabel: 'Fecha de inicio',
  startDateErrorRequired: 'Ingresa la fecha de inicio.',
  endDateLabel: 'Fecha de fin',
  endDateErrorRequired: 'Ingresa la fecha de fin.',
  endDateErrorBeforeStart: 'La fecha de fin no puede ser anterior a la de inicio.',
  currentJobLabel: 'Trabajo aquí actualmente',
  unknownEndLabel: 'No recuerdo la fecha exacta de finalización',
  descriptionLabel: 'Descripción de funciones',
  descriptionPlaceholder: 'Escribe aquí. Este campo crece con el contenido.',
  descriptionCounterLabel: (count: number, max: number) => `${count} / ${max} caracteres`,
  addButtonLabel: 'Agregar experiencia',
  addingButtonLabel: 'Agregando…',
  removeItemLabel: (item: WorkExperienceItem) => `Eliminar ${item.position}`,
  removingItemLabel: 'Eliminando…',
  formatItemPeriod: (item: WorkExperienceItem) => `${item.startDate} - ${item.endDate ?? 'actual'}`,
  emptyStateTitle: 'Todavía no agregas experiencia laboral',
  emptyStateDescription: 'Es opcional; no es un requisito para finalizar tu perfil.',
};

describe('WorkExperienceSection', () => {
  it('sin ítems muestra el estado vacío', () => {
    render(<WorkExperienceSection {...baseProps} />);

    expect(screen.getByText('Todavía no agregas experiencia laboral')).toBeInTheDocument();
  });

  it('un alta válida con fecha de fin llega a onAdd con los valores del formulario', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await user.type(screen.getByLabelText('Cargo'), 'Desarrolladora backend');
    await user.type(screen.getByLabelText('Empresa'), 'CAMEIA');
    fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2022-01-01' } });
    fireEvent.change(screen.getByLabelText('Fecha de fin'), { target: { value: '2023-06-01' } });

    const form = document.getElementById('work-experience-form') as HTMLFormElement;
    form.requestSubmit();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        position: 'Desarrolladora backend',
        company: 'CAMEIA',
        startDate: '2022-01-01',
        endDate: '2023-06-01',
        isCurrent: false,
        unknownEnd: false,
      }),
      expect.anything(),
    );
  });

  it('marcar "Trabajo aquí actualmente" desmarca "No recuerdo…" y oculta la fecha de fin', async () => {
    const user = userEvent.setup();
    render(<WorkExperienceSection {...baseProps} />);

    await user.click(screen.getByText('No recuerdo la fecha exacta de finalización'));
    expect(
      screen.getByRole('checkbox', { name: 'No recuerdo la fecha exacta de finalización' }),
    ).toBeChecked();

    await user.click(screen.getByText('Trabajo aquí actualmente'));

    expect(screen.getByRole('checkbox', { name: 'Trabajo aquí actualmente' })).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'No recuerdo la fecha exacta de finalización' }),
    ).not.toBeChecked();
    expect(screen.queryByLabelText('Fecha de fin')).not.toBeInTheDocument();
  });

  it('sin ningún checkbox marcado, la fecha de fin es obligatoria', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await user.type(screen.getByLabelText('Cargo'), 'Desarrolladora backend');
    await user.type(screen.getByLabelText('Empresa'), 'CAMEIA');
    fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2022-01-01' } });

    const form = document.getElementById('work-experience-form') as HTMLFormElement;
    form.requestSubmit();

    expect(await screen.findByText('Ingresa la fecha de fin.')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('el contador de la descripción refleja el conteo y corta en 500 caracteres', () => {
    render(<WorkExperienceSection {...baseProps} />);

    expect(screen.getByText('0 / 500 caracteres')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción de funciones')).toHaveAttribute('maxlength', '500');
  });

  it('eliminar un ítem existente llama a onRemove con su id', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<WorkExperienceSection {...baseProps} items={[existingItem]} onRemove={onRemove} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar Desarrolladora backend' }));

    expect(onRemove).toHaveBeenCalledWith('exp-1');
  });
});
