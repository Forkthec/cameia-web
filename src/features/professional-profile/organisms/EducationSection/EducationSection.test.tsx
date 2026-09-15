/**
 * Comportamiento observable de `EducationSection` (HU-2.4, CM-61): estado
 * vacío con `EmptyState`, alta válida que llega a `onAdd` con los valores
 * reales, bloqueo cuando falta un campo obligatorio, el checkbox "En curso"
 * oculta la fecha de fin, una fecha de fin anterior a la de inicio muestra
 * su error, eliminar un ítem llama a `onRemove` con su id, un error de alta
 * se anuncia como alerta, y `showSectionTitle={false}` no duplica el título
 * pero conserva el nombre accesible de la sección (advertencia de
 * `GeneralInfoForm.tsx`: el acordeón `sm` ya pinta su propio encabezado).
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { EducationItem } from '../../model/profile.types';
import { EducationSection } from './EducationSection';

const levelOptions = [
  { value: 'TECHNICAL', label: 'Técnico' },
  { value: 'UNDERGRADUATE', label: 'Pregrado' },
  { value: 'POSTGRADUATE', label: 'Posgrado' },
];

const existingItem: EducationItem = {
  id: 'edu-1',
  institution: 'Universidad del Cauca',
  degree: 'Ingeniería de Sistemas',
  fieldOfStudy: 'Sistemas',
  level: 'UNDERGRADUATE',
  startDate: '2018-01',
  endDate: '2023-12',
  inProgress: false,
  provenance: 'MANUAL',
};

const baseProps = {
  formId: 'education-form',
  items: [] as EducationItem[],
  onAdd: () => {},
  onRemove: () => {},
  sectionTitle: 'Formación académica',
  levelLabel: 'Nivel educativo',
  levelPlaceholder: 'Selecciona una opción',
  levelOptions,
  levelErrorRequired: 'Elige un nivel educativo.',
  degreeLabel: 'Título obtenido',
  degreePlaceholder: 'Escribe aquí',
  degreeErrorRequired: 'Ingresa el título obtenido.',
  fieldOfStudyLabel: 'Campo de estudio',
  fieldOfStudyPlaceholder: 'Escribe aquí',
  institutionLabel: 'Institución',
  institutionPlaceholder: 'Escribe aquí',
  institutionErrorRequired: 'Ingresa la institución.',
  startDateLabel: 'Fecha de inicio',
  startDateErrorRequired: 'Ingresa la fecha de inicio.',
  endDateLabel: 'Año de finalización',
  endDateErrorBeforeStart: 'La fecha de finalización no puede ser anterior a la de inicio.',
  inProgressLabel: 'En curso',
  addButtonLabel: 'Agregar formación',
  addingButtonLabel: 'Agregando…',
  removeItemLabel: (item: EducationItem) => `Eliminar ${item.degree}`,
  removingItemLabel: 'Eliminando…',
  formatItemPeriod: (item: EducationItem) => `${item.startDate} - ${item.endDate ?? 'en curso'}`,
  emptyStateTitle: 'Todavía no agregas formación académica',
  emptyStateDescription: 'Agrega al menos una para poder finalizar tu perfil.',
};

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText('Nivel educativo'), 'UNDERGRADUATE');
  await user.type(screen.getByLabelText('Título obtenido'), 'Ingeniería de Sistemas');
  await user.type(screen.getByLabelText('Institución'), 'Universidad del Cauca');
  fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2018-01-01' } });
  fireEvent.change(screen.getByLabelText('Año de finalización'), {
    target: { value: '2023-12-01' },
  });
}

describe('EducationSection', () => {
  it('sin ítems muestra el estado vacío', () => {
    render(<EducationSection {...baseProps} />);

    expect(screen.getByText('Todavía no agregas formación académica')).toBeInTheDocument();
  });

  it('un alta válida llega a onAdd con los valores del formulario', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<EducationSection {...baseProps} onAdd={onAdd} />);

    await fillValidForm(user);
    const form = document.getElementById('education-form') as HTMLFormElement;
    form.requestSubmit();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'UNDERGRADUATE',
        degree: 'Ingeniería de Sistemas',
        institution: 'Universidad del Cauca',
        startDate: '2018-01-01',
        endDate: '2023-12-01',
        inProgress: false,
      }),
      expect.anything(),
    );
  });

  it('nivel sin elegir bloquea el envío y no llama a onAdd', async () => {
    const onAdd = vi.fn();
    render(<EducationSection {...baseProps} onAdd={onAdd} />);

    const form = document.getElementById('education-form') as HTMLFormElement;
    form.requestSubmit();

    expect(await screen.findByText('Elige un nivel educativo.')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('marcar "En curso" oculta el campo de fecha de finalización', async () => {
    const user = userEvent.setup();
    render(<EducationSection {...baseProps} />);

    expect(screen.getByLabelText('Año de finalización')).toBeInTheDocument();
    await user.click(screen.getByText('En curso'));

    expect(screen.queryByLabelText('Año de finalización')).not.toBeInTheDocument();
  });

  it('una fecha de finalización anterior a la de inicio muestra su error', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<EducationSection {...baseProps} onAdd={onAdd} />);

    await user.selectOptions(screen.getByLabelText('Nivel educativo'), 'UNDERGRADUATE');
    await user.type(screen.getByLabelText('Título obtenido'), 'Ingeniería de Sistemas');
    await user.type(screen.getByLabelText('Institución'), 'Universidad del Cauca');
    fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2020-01-01' } });
    fireEvent.change(screen.getByLabelText('Año de finalización'), {
      target: { value: '2019-01-01' },
    });

    const form = document.getElementById('education-form') as HTMLFormElement;
    form.requestSubmit();

    expect(
      await screen.findByText('La fecha de finalización no puede ser anterior a la de inicio.'),
    ).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('eliminar un ítem existente llama a onRemove con su id', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<EducationSection {...baseProps} items={[existingItem]} onRemove={onRemove} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar Ingeniería de Sistemas' }));

    expect(onRemove).toHaveBeenCalledWith('edu-1');
  });

  it('un error de alta se anuncia como alerta', () => {
    render(<EducationSection {...baseProps} addErrorMessage="No se pudo agregar la formación." />);

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo agregar la formación.');
  });

  it('showSectionTitle=false no renderiza el encabezado pero conserva el nombre accesible de la sección', () => {
    render(<EducationSection {...baseProps} showSectionTitle={false} />);

    expect(screen.queryByRole('heading', { name: 'Formación académica' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Formación académica' })).toBeInTheDocument();
  });
});
