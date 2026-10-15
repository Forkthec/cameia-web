/**
 * Comportamiento observable de `WorkExperienceSection` (HU-2.4, CM-61):
 * estado vacío, alta válida con fecha de fin, exclusión mutua de los dos
 * checkboxes ("Trabajo aquí actualmente" / "No recuerdo la fecha exacta de
 * finalización") — marcar uno desmarca el otro y oculta la fecha de fin —,
 * sin ninguno marcado la fecha de fin es obligatoria, el contador de la
 * descripción refleja el conteo real y su `maxLength` corta en 500, y
 * eliminar un ítem llama a `onRemove` con su id.
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
  (document.getElementById('work-experience-form') as HTMLFormElement).requestSubmit();
}

/** Cargo y empresa válidos, con el texto que usan los criterios de HU-2.4. */
async function fillRequired(user: User) {
  await user.type(screen.getByLabelText('Cargo'), 'Desarrolladora backend');
  await user.type(screen.getByLabelText('Empresa'), 'CAMEIA');
}

describe('WorkExperienceSection', () => {
  it('sin ítems muestra el estado vacío', () => {
    render(<WorkExperienceSection {...baseProps} />);

    expect(screen.getByText('Todavía no agregas experiencia laboral')).toBeInTheDocument();
  });

  it('un alta válida con fecha de fin llega a onAdd con las fechas en «AAAA-MM»', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await fillRequired(user);
    await user.type(screen.getByLabelText('Fecha de inicio'), '012022');
    await user.type(screen.getByLabelText('Fecha de fin'), '062023');

    submitForm();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        position: 'Desarrolladora backend',
        company: 'CAMEIA',
        startDate: '2022-01',
        endDate: '2023-06',
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

  it('sin ningún checkbox marcado, la fecha de fin es obligatoria y el mensaje queda bajo ese campo (CA-2.4.2)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await fillRequired(user);
    await user.type(screen.getByLabelText('Fecha de inicio'), '012022');

    submitForm();

    expect(await screen.findByText('Ingresa la fecha de fin.')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de fin')).toHaveAccessibleDescription(
      'Ingresa la fecha de fin.',
    );
    // El inicio sí se escribió bien: solo el fin tiene error.
    expect(screen.getByLabelText('Fecha de inicio')).not.toHaveAccessibleDescription(
      'Ingresa la fecha de inicio.',
    );
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

describe('WorkExperienceSection · fechas con MonthField (CM-273, PR 1)', () => {
  const FORMAT = baseProps.dateErrorFormat;
  const FUTURE = baseProps.dateErrorFuture;
  const BEFORE_START = baseProps.endDateErrorBeforeStart;

  async function markCurrent(user: User) {
    await user.click(screen.getByText('Trabajo aquí actualmente'));
  }

  it('la fecha de inicio y la de fin son campos de mes: cada una trae su disparador del panel', async () => {
    const user = userEvent.setup();
    render(<WorkExperienceSection {...baseProps} />);

    expect(screen.getAllByRole('button', { name: 'Abrir selector de mes' })).toHaveLength(2);

    await markCurrent(user);

    expect(screen.getAllByRole('button', { name: 'Abrir selector de mes' })).toHaveLength(1);
  });

  describe('campos obligatorios (CA-2.4.3)', () => {
    it('empresa y cargo vacíos muestran cada mensaje bajo su campo y no guardan', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

      await markCurrent(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '012022');
      submitForm();

      expect(await screen.findByText('Ingresa la empresa.')).toBeInTheDocument();
      expect(screen.getByLabelText('Empresa')).toHaveAccessibleDescription('Ingresa la empresa.');
      expect(screen.getByLabelText('Cargo')).toHaveAccessibleDescription('Ingresa el cargo.');
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('solo espacios cuenta como vacío (RT-01-CA02)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

      await markCurrent(user);
      await user.type(screen.getByLabelText('Empresa'), '   ');
      await user.type(screen.getByLabelText('Cargo'), '   ');
      await user.type(screen.getByLabelText('Fecha de inicio'), '012022');
      submitForm();

      expect(await screen.findByText('Ingresa la empresa.')).toBeInTheDocument();
      expect(screen.getByText('Ingresa el cargo.')).toBeInTheDocument();
      expect(onAdd).not.toHaveBeenCalled();
    });
  });

  describe('formato «mm/aaaa» (CA-2.4.43 y CA-2.4.60)', () => {
    it('«13/2024» en la fecha de inicio muestra el mensaje bajo «Fecha de inicio» y no guarda (CA-2.4.43)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await markCurrent(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '13/2024');
      submitForm();

      expect(await screen.findByText(FORMAT)).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha de inicio')).toHaveAccessibleDescription(FORMAT);
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('«13/2024» en la fecha de fin muestra el mensaje bajo «Fecha de fin» y no guarda (CA-2.4.60)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '012024');
      await user.type(screen.getByLabelText('Fecha de fin'), '13/2024');
      submitForm();

      expect(await screen.findByText(FORMAT)).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha de fin')).toHaveAccessibleDescription(FORMAT);
      expect(screen.getByLabelText('Fecha de inicio')).not.toHaveAccessibleDescription(FORMAT);
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('un texto incompleto como «06/20» también es de formato inválido', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await markCurrent(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '0620');
      submitForm();

      expect(await screen.findByText(FORMAT)).toBeInTheDocument();
      expect(onAdd).not.toHaveBeenCalled();
    });
  });

  describe('mes futuro: el mes actual llega por propiedad, sin congelar el reloj (CA-2.4.25, 26, 24 y 54)', () => {
    it('un inicio en el mes siguiente al actual muestra el mensaje bajo «Fecha de inicio» y no guarda (CA-2.4.25)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<WorkExperienceSection {...baseProps} currentMonth="2026-10" onAdd={onAdd} />);

      await fillRequired(user);
      await markCurrent(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '112026');
      submitForm();

      expect(await screen.findByText(FUTURE)).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha de inicio')).toHaveAccessibleDescription(FUTURE);
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('un fin en el mes siguiente al actual muestra el mensaje bajo «Fecha de fin» y no guarda (CA-2.4.26)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<WorkExperienceSection {...baseProps} currentMonth="2026-10" onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '012025');
      await user.type(screen.getByLabelText('Fecha de fin'), '112026');
      submitForm();

      expect(await screen.findByText(FUTURE)).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha de fin')).toHaveAccessibleDescription(FUTURE);
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('un inicio en el mes actual se guarda (CA-2.4.24)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<WorkExperienceSection {...baseProps} currentMonth="2026-10" onAdd={onAdd} />);

      await fillRequired(user);
      await markCurrent(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '102026');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2026-10', isCurrent: true }),
        expect.anything(),
      );
    });

    it('un fin en el mes actual se guarda (CA-2.4.54)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<WorkExperienceSection {...baseProps} currentMonth="2026-10" onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '012025');
      await user.type(screen.getByLabelText('Fecha de fin'), '102026');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2025-01', endDate: '2026-10' }),
        expect.anything(),
      );
    });

    it('usa el mes que recibe por propiedad, no el reloj del sistema', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      // Con el reloj real (2026) «01/2030» sería futuro; con el mes recibido (2030-01) no lo es.
      render(<WorkExperienceSection {...baseProps} currentMonth="2030-01" onAdd={onAdd} />);

      await fillRequired(user);
      await markCurrent(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '012030');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2030-01' }),
        expect.anything(),
      );
    });
  });

  describe('fin anterior al inicio, por mes y año (CA-2.4.14; la parte de periodo de CA-2.4.13 es del PR 2)', () => {
    it('un fin anterior al inicio muestra el mensaje bajo «Fecha de fin» y no guarda (CA-2.4.14)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '052024');
      await user.type(screen.getByLabelText('Fecha de fin'), '042024');
      submitForm();

      expect(await screen.findByText(BEFORE_START)).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha de fin')).toHaveAccessibleDescription(BEFORE_START);
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('un fin en el mismo mes que el inicio se acepta (la comparación es por mes y año)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '052024');
      await user.type(screen.getByLabelText('Fecha de fin'), '052024');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2024-05', endDate: '2024-05' }),
        expect.anything(),
      );
    });
  });

  describe('edad mínima: la regla es del servidor (CA-2.4.20)', () => {
    it('un inicio en el mes en que se cumplen 15 años se acepta y se envía; el cliente no consulta la fecha de nacimiento', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await markCurrent(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '032023');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2023-03', isCurrent: true }),
        expect.anything(),
      );
    });
  });
});
