/**
 * Comportamiento observable de `EducationSection` (HU-2.4, CM-61): estado
 * vacío con `EmptyState`, alta válida que llega a `onAdd` con los valores
 * reales, bloqueo cuando falta un campo obligatorio, el checkbox "En curso"
 * oculta la fecha de fin, una fecha de fin anterior a la de inicio muestra
 * su error, eliminar un ítem llama a `onRemove` con su id, un error de alta
 * se anuncia como alerta, y `showSectionTitle={false}` no duplica el título
 * pero conserva el nombre accesible de la sección (advertencia de
 * `GeneralInfoForm.tsx`: el acordeón `sm` ya pinta su propio encabezado).
 *
 * CM-273 (PR 1, `SPEC.md` §3.3): las dos entradas de fecha son `MonthField` (máscara «mm/aaaa»); el
 * formulario entrega «AAAA-MM» a `onAdd` (D-K); los mensajes de formato, mes futuro y fin anterior al
 * inicio salen bajo el campo que corresponde; el mes actual llega por la propiedad `currentMonth` que
 * calcula la página (D-M), así que estas pruebas se lo pasan y NO congelan el reloj. Las propiedades
 * `currentMonth`, `locale`, `monthFieldTexts`, `dateErrorFormat` y `dateErrorFuture` son propuesta de estas
 * pruebas en rojo: el SPEC no fija sus nombres.
 */
import { render, screen, waitFor } from '@testing-library/react';
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
  institutionLabel: 'Institución',
  institutionPlaceholder: 'Escribe aquí',
  institutionErrorRequired: 'Ingresa la institución.',
  startDateLabel: 'Fecha de inicio',
  startDateErrorRequired: 'Ingresa la fecha de inicio.',
  endDateLabel: 'Fecha de fin',
  endDateErrorBeforeStart: 'La fecha de fin no puede ser anterior a la de inicio.',
  inProgressLabel: 'En curso',
  addButtonLabel: 'Agregar formación',
  addingButtonLabel: 'Agregando…',
  removeItemLabel: (item: EducationItem) => `Eliminar ${item.degree}`,
  removingItemLabel: 'Eliminando…',
  formatItemPeriod: (item: EducationItem) => `${item.startDate} - ${item.endDate ?? 'en curso'}`,
  emptyStateTitle: 'Todavía no agregas formación académica',
  emptyStateDescription: 'Agrega al menos una para poder finalizar tu perfil.',
  currentMonth: '2026-10',
  locale: 'es-CO',
  monthFieldTexts: {
    placeholder: 'mm/aaaa',
    openPanelLabel: 'Abrir selector de mes',
    panelLabel: 'Elegir mes y año',
    previousYearLabel: 'Año anterior',
    nextYearLabel: 'Año siguiente',
  },
  dateErrorFormat: 'Ingresa una fecha válida con el formato mm/aaaa.',
  dateErrorFuture: 'La fecha no puede ser posterior al mes actual.',
};

type User = ReturnType<typeof userEvent.setup>;

function submitForm() {
  (document.getElementById('education-form') as HTMLFormElement).requestSubmit();
}

/** Nivel, título e institución válidos, con el texto que usan los criterios de HU-2.4. */
async function fillRequired(user: User) {
  await user.selectOptions(screen.getByLabelText('Nivel educativo'), 'UNDERGRADUATE');
  await user.type(screen.getByLabelText('Título obtenido'), 'Ingeniería de Sistemas');
  await user.type(screen.getByLabelText('Institución'), 'Universidad del Cauca');
}

async function fillValidForm(user: User) {
  await fillRequired(user);
  await user.type(screen.getByLabelText('Fecha de inicio'), '012018');
  await user.type(screen.getByLabelText('Fecha de fin'), '122023');
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
        startDate: '2018-01',
        endDate: '2023-12',
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

    expect(screen.getByLabelText('Fecha de fin')).toBeInTheDocument();
    await user.click(screen.getByText('En curso'));

    expect(screen.queryByLabelText('Fecha de fin')).not.toBeInTheDocument();
  });

  it('una fecha de finalización anterior a la de inicio muestra su error bajo ese campo (CA-2.4.30)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<EducationSection {...baseProps} onAdd={onAdd} />);

    await fillRequired(user);
    await user.type(screen.getByLabelText('Fecha de inicio'), '022025');
    await user.type(screen.getByLabelText('Fecha de fin'), '012025');

    submitForm();

    expect(
      await screen.findByText('La fecha de fin no puede ser anterior a la de inicio.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de fin')).toHaveAccessibleDescription(
      'La fecha de fin no puede ser anterior a la de inicio.',
    );
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

describe('EducationSection · fechas con MonthField (CM-273, PR 1)', () => {
  const FORMAT = baseProps.dateErrorFormat;
  const FUTURE = baseProps.dateErrorFuture;

  it('la fecha de inicio y la de fin son campos de mes: cada una trae su disparador del panel', async () => {
    const user = userEvent.setup();
    render(<EducationSection {...baseProps} />);

    expect(screen.getAllByRole('button', { name: 'Abrir selector de mes' })).toHaveLength(2);

    await user.click(screen.getByText('En curso'));

    expect(screen.getAllByRole('button', { name: 'Abrir selector de mes' })).toHaveLength(1);
  });

  describe('campos obligatorios (CA-2.4.6)', () => {
    it('con todo vacío muestra cada mensaje y no guarda', async () => {
      const onAdd = vi.fn();
      render(<EducationSection {...baseProps} onAdd={onAdd} />);

      submitForm();

      expect(await screen.findByText('Ingresa la institución.')).toBeInTheDocument();
      expect(screen.getByText('Ingresa el título obtenido.')).toBeInTheDocument();
      expect(screen.getByText('Elige un nivel educativo.')).toBeInTheDocument();
      expect(screen.getByText('Ingresa la fecha de inicio.')).toBeInTheDocument();
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('cada mensaje queda bajo su campo', async () => {
      render(<EducationSection {...baseProps} />);

      submitForm();

      await screen.findByText('Ingresa la institución.');
      expect(screen.getByLabelText('Institución')).toHaveAccessibleDescription(
        'Ingresa la institución.',
      );
      expect(screen.getByLabelText('Título obtenido')).toHaveAccessibleDescription(
        'Ingresa el título obtenido.',
      );
      expect(screen.getByLabelText('Fecha de inicio')).toHaveAccessibleDescription(
        'Ingresa la fecha de inicio.',
      );
    });

    it('solo espacios en institución y título cuenta como vacío (RT-01-CA02)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<EducationSection {...baseProps} onAdd={onAdd} />);

      await user.selectOptions(screen.getByLabelText('Nivel educativo'), 'UNDERGRADUATE');
      await user.type(screen.getByLabelText('Institución'), '   ');
      await user.type(screen.getByLabelText('Título obtenido'), '   ');
      await user.type(screen.getByLabelText('Fecha de inicio'), '012018');
      submitForm();

      expect(await screen.findByText('Ingresa la institución.')).toBeInTheDocument();
      expect(screen.getByText('Ingresa el título obtenido.')).toBeInTheDocument();
      expect(onAdd).not.toHaveBeenCalled();
    });
  });

  describe('formato «mm/aaaa» (CA-2.4.44 y CA-2.4.60)', () => {
    it('«13/2024» en la fecha de inicio muestra el mensaje bajo «Fecha de inicio» y no guarda (CA-2.4.44)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<EducationSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '13/2024');
      submitForm();

      expect(await screen.findByText(FORMAT)).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha de inicio')).toHaveAccessibleDescription(FORMAT);
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('«13/2024» en la fecha de fin muestra el mensaje bajo ese campo y no guarda (CA-2.4.60)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<EducationSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '012018');
      await user.type(screen.getByLabelText('Fecha de fin'), '13/2024');
      submitForm();

      expect(await screen.findByText(FORMAT)).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha de fin')).toHaveAccessibleDescription(FORMAT);
      expect(screen.getByLabelText('Fecha de inicio')).not.toHaveAccessibleDescription(FORMAT);
      expect(onAdd).not.toHaveBeenCalled();
    });
  });

  describe('mes futuro: el mes actual llega por propiedad, sin congelar el reloj (CA-2.4.33 a 35 y CA-2.4.55)', () => {
    it('un inicio en el mes siguiente al actual muestra el mensaje bajo «Fecha de inicio» y no guarda (CA-2.4.34)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<EducationSection {...baseProps} currentMonth="2026-10" onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '112026');
      submitForm();

      expect(await screen.findByText(FUTURE)).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha de inicio')).toHaveAccessibleDescription(FUTURE);
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('un fin en el mes siguiente al actual muestra el mensaje bajo ese campo y no guarda (CA-2.4.35)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<EducationSection {...baseProps} currentMonth="2026-10" onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '022022');
      await user.type(screen.getByLabelText('Fecha de fin'), '112026');
      submitForm();

      expect(await screen.findByText(FUTURE)).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha de fin')).toHaveAccessibleDescription(FUTURE);
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('«En curso» con inicio en el mes actual se guarda (CA-2.4.33)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<EducationSection {...baseProps} currentMonth="2026-10" onAdd={onAdd} />);

      await fillRequired(user);
      await user.click(screen.getByText('En curso'));
      await user.type(screen.getByLabelText('Fecha de inicio'), '102026');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2026-10', inProgress: true }),
        expect.anything(),
      );
    });

    it('un fin en el mes actual se guarda (CA-2.4.55)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<EducationSection {...baseProps} currentMonth="2026-10" onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '022022');
      await user.type(screen.getByLabelText('Fecha de fin'), '102026');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2022-02', endDate: '2026-10' }),
        expect.anything(),
      );
    });

    it('usa el mes que recibe por propiedad, no el reloj del sistema', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      // Con el reloj real (2026) «01/2030» sería futuro; con el mes recibido (2030-01) no lo es.
      render(<EducationSection {...baseProps} currentMonth="2030-01" onAdd={onAdd} />);

      await fillRequired(user);
      await user.click(screen.getByText('En curso'));
      await user.type(screen.getByLabelText('Fecha de inicio'), '012030');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2030-01' }),
        expect.anything(),
      );
    });
  });

  describe('fin anterior al inicio, por mes y año (CA-2.4.30; la parte de periodo de CA-2.4.29 es del PR 2)', () => {
    it('un fin en el mismo mes que el inicio se acepta (la comparación es por mes y año)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<EducationSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '022025');
      await user.type(screen.getByLabelText('Fecha de fin'), '022025');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2025-02', endDate: '2025-02' }),
        expect.anything(),
      );
    });
  });

  describe('nacimiento: la regla es del servidor (CA-2.4.31)', () => {
    it('un inicio en el mes de nacimiento se acepta y se envía; el cliente no consulta la fecha de nacimiento', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<EducationSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '032008');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2008-03' }),
        expect.anything(),
      );
    });
  });
});
