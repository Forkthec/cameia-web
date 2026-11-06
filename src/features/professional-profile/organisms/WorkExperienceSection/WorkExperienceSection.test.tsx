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
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { WorkExperienceItem } from '../../model/profile.types';
import type { WorkExperienceFormValues } from '../../schemas/workExperience.schema';
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
  // CM-273 (PR 2, D-AG): `onAdd` y `onRemove` devuelven una promesa (la de `mutateAsync` en la página).
  onAdd: () => Promise.resolve(),
  onRemove: () => Promise.resolve(),
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
  // CM-273 (PR 2, `SPEC.md` §3.3 punto 3): mensajes de longitud, literales del backlog; los nombres de las
  // propiedades son propuesta de estas pruebas en rojo.
  positionErrorTooLong: 'El cargo no puede superar los 100 caracteres.',
  companyErrorTooLong: 'La empresa no puede superar los 100 caracteres.',
  descriptionErrorTooLong: 'La descripción no puede superar los 500 caracteres.',
};

/** Tope de la sección (CM-273, PR 2, D-V y D-AB); `maxItems` y `maxItemsMessage` son propuesta de estas pruebas. */
const capProps = {
  maxItems: 4,
  maxItemsMessage: 'Ya tienes el máximo de 4 experiencias laborales.',
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
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await fillRequired(user);
    await user.type(screen.getByLabelText('Fecha de inicio'), '012022');
    await user.type(screen.getByLabelText('Fecha de fin'), '062023');

    submitForm();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        position: 'Desarrolladora backend',
        company: 'CAMEIA',
        startDate: '2022-01',
        endDate: '2023-06',
        isCurrent: false,
        unknownEnd: false,
      }),
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
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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

  // CM-273 (PR 2, D-X): reescrita. Antes afirmaba `maxlength="500"`, lo contrario de RT-01-CA07 y CA-2.4.12
  // («conservar todo lo escrito sin cortarlo»); el campo ya no impone tope y el contador cuenta lo escrito.
  it('el contador de la descripción arranca en 0 / 500 y el campo no impone `maxlength` (CA-2.4.12)', () => {
    render(<WorkExperienceSection {...baseProps} />);

    expect(screen.getByText('0 / 500 caracteres')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción de funciones')).not.toHaveAttribute('maxlength');
  });

  it('eliminar un ítem existente llama a onRemove con su id', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
      render(<WorkExperienceSection {...baseProps} currentMonth="2026-10" onAdd={onAdd} />);

      await fillRequired(user);
      await markCurrent(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '102026');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ startDate: '2026-10', isCurrent: true }),
      );
    });

    it('un fin en el mes actual se guarda (CA-2.4.54)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
      render(<WorkExperienceSection {...baseProps} currentMonth="2026-10" onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '012025');
      await user.type(screen.getByLabelText('Fecha de fin'), '102026');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ startDate: '2025-01', endDate: '2026-10' }),
      );
    });

    it('usa el mes que recibe por propiedad, no el reloj del sistema', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
      // Con el reloj real (2026) «01/2030» sería futuro; con el mes recibido (2030-01) no lo es.
      render(<WorkExperienceSection {...baseProps} currentMonth="2030-01" onAdd={onAdd} />);

      await fillRequired(user);
      await markCurrent(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '012030');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ startDate: '2030-01' }));
    });
  });

  describe('fin anterior al inicio, por mes y año (CA-2.4.14; la parte de periodo de CA-2.4.13 es del PR 2)', () => {
    it('un fin anterior al inicio muestra el mensaje bajo «Fecha de fin» y no guarda (CA-2.4.14)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
      render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '052024');
      await user.type(screen.getByLabelText('Fecha de fin'), '052024');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ startDate: '2024-05', endDate: '2024-05' }),
      );
    });
  });

  describe('edad mínima: la regla es del servidor (CA-2.4.20)', () => {
    it('un inicio en el mes en que se cumplen 15 años se acepta y se envía; el cliente no consulta la fecha de nacimiento', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
      render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await markCurrent(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '032023');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ startDate: '2023-03', isCurrent: true }),
      );
    });
  });
});

/*
 * CM-273 (PR 2, `SPEC.md` §3.3 y D-T a D-AG). Textos esperados: literales del documento de criterios de HU-2.4
 * (v7). Estas pruebas leen los argumentos de `onAdd` con `mock.calls[0][0]` y no con `toHaveBeenCalledWith`,
 * para no depender de que la sección reenvíe o no el segundo argumento (el evento) de `handleSubmit`.
 */
type OnAdd = (values: WorkExperienceFormValues) => Promise<void>;
type OnRemove = (workExperienceId: string) => Promise<void>;

/** Promesa que la prueba resuelve o rechaza a mano. El rechazo propio queda atendido; el de una promesa derivada no. */
function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  promise.catch(() => {});
  return { promise, resolve, reject };
}

/** Deja correr las promesas pendientes (validación asíncrona de react-hook-form y cierre de la guarda). */
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

function makeItems(count: number): WorkExperienceItem[] {
  return Array.from({ length: count }, (_, index) => ({
    ...existingItem,
    id: `exp-${index + 1}`,
    position: `Cargo ${index + 1}`,
  }));
}

/** Cargo, empresa, «Trabajo aquí actualmente» y un inicio: un formulario válido hoy y después del PR 2. */
async function fillValidCurrent(user: User) {
  await fillRequired(user);
  await user.click(screen.getByText('Trabajo aquí actualmente'));
  await user.type(screen.getByLabelText('Fecha de inicio'), '062024');
}

async function pasteInto(user: User, label: string, text: string) {
  const field = screen.getByLabelText(label);
  await user.click(field);
  await user.paste(text);
  return field;
}

describe('WorkExperienceSection · inicio opcional (CM-273, PR 2; CA-2.4.15, 22, 23 y 53)', () => {
  it('«No recuerdo…» sin fecha de inicio ni de fin ni descripción se envía sin pedir el inicio (CA-2.4.15 y CA-2.4.53)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await fillRequired(user);
    await user.click(screen.getByText('No recuerdo la fecha exacta de finalización'));
    submitForm();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ startDate: '', endDate: '', description: '', unknownEnd: true }),
    );
    expect(screen.queryByText('Ingresa la fecha de inicio.')).not.toBeInTheDocument();
  });

  it('terminada con solo la fecha de fin 03/2023 se envía con el inicio vacío (CA-2.4.22)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await fillRequired(user);
    await user.type(screen.getByLabelText('Fecha de fin'), '032023');
    submitForm();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ startDate: '', endDate: '2023-03' }),
    );
  });

  it('terminada con solo la fecha de fin 02/2023 también se envía: la regla de edad es del servidor (CA-2.4.23)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await fillRequired(user);
    await user.type(screen.getByLabelText('Fecha de fin'), '022023');
    submitForm();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ startDate: '', endDate: '2023-02' }),
    );
  });
});

describe('WorkExperienceSection · longitudes y contador (CM-273, PR 2; CA-2.4.12, 17, 18 y 19)', () => {
  const POSITION_TOO_LONG = baseProps.positionErrorTooLong;
  const COMPANY_TOO_LONG = baseProps.companyErrorTooLong;
  const DESCRIPTION_TOO_LONG = baseProps.descriptionErrorTooLong;

  it('cargo de 101 caracteres: el campo no corta, el mensaje sale bajo «Cargo» y no se guarda (CA-2.4.18)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await user.type(screen.getByLabelText('Empresa'), 'CAMEIA');
    const position = await pasteInto(user, 'Cargo', 'a'.repeat(101));
    await user.click(screen.getByText('Trabajo aquí actualmente'));
    submitForm();

    expect(await screen.findByText(POSITION_TOO_LONG)).toBeInTheDocument();
    expect(position).toHaveAccessibleDescription(POSITION_TOO_LONG);
    expect(position).toHaveValue('a'.repeat(101));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('empresa de 101 caracteres: el mensaje sale bajo «Empresa» y no se guarda (CA-2.4.18)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await user.type(screen.getByLabelText('Cargo'), 'Desarrolladora backend');
    const company = await pasteInto(user, 'Empresa', 'a'.repeat(101));
    await user.click(screen.getByText('Trabajo aquí actualmente'));
    submitForm();

    expect(await screen.findByText(COMPANY_TOO_LONG)).toBeInTheDocument();
    expect(company).toHaveAccessibleDescription(COMPANY_TOO_LONG);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('empresa y cargo de 100 caracteres se guardan completos (CA-2.4.17)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await pasteInto(user, 'Cargo', 'c'.repeat(100));
    await pasteInto(user, 'Empresa', 'e'.repeat(100));
    await user.click(screen.getByText('Trabajo aquí actualmente'));
    // El inicio se escribe para que esta prueba solo dependa del largo (el inicio opcional es de otro criterio).
    await user.type(screen.getByLabelText('Fecha de inicio'), '062024');
    submitForm();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ position: 'c'.repeat(100), company: 'e'.repeat(100) }),
    );
    expect(screen.queryByText(POSITION_TOO_LONG)).not.toBeInTheDocument();
    expect(screen.queryByText(COMPANY_TOO_LONG)).not.toBeInTheDocument();
  });

  it('descripción de 501 caracteres: el campo no corta lo escrito y el contador marca «501 / 500 caracteres» (CA-2.4.12)', async () => {
    const user = userEvent.setup();
    render(<WorkExperienceSection {...baseProps} />);

    const description = await pasteInto(user, 'Descripción de funciones', 'a'.repeat(501));

    expect(description).toHaveValue('a'.repeat(501));
    expect(screen.getByText('501 / 500 caracteres')).toBeInTheDocument();
  });

  it('descripción de 501 caracteres: el mensaje sale bajo el campo y no se guarda (CA-2.4.12)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await fillValidCurrent(user);
    const description = await pasteInto(user, 'Descripción de funciones', 'a'.repeat(501));
    submitForm();

    expect(await screen.findByText(DESCRIPTION_TOO_LONG)).toBeInTheDocument();
    expect(description).toHaveAccessibleDescription(DESCRIPTION_TOO_LONG);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('descripción de 500 caracteres se guarda completa (CA-2.4.19)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await fillValidCurrent(user);
    await pasteInto(user, 'Descripción de funciones', 'a'.repeat(500));
    expect(screen.getByText('500 / 500 caracteres')).toBeInTheDocument();
    submitForm();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ description: 'a'.repeat(500) }),
    );
    expect(screen.queryByText(DESCRIPTION_TOO_LONG)).not.toBeInTheDocument();
  });

  it('el contador y la validación cuentan puntos de código con `unicodeLength`: 300 emojis son 300, no 600 (D-X)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await fillValidCurrent(user);
    await pasteInto(user, 'Descripción de funciones', '😀'.repeat(300));

    expect(screen.getByText('300 / 500 caracteres')).toBeInTheDocument();
    submitForm();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ description: '😀'.repeat(300) }),
    );
    expect(screen.queryByText(DESCRIPTION_TOO_LONG)).not.toBeInTheDocument();
  });
});

describe('WorkExperienceSection · tope de 4 experiencias (CM-273, PR 2; CA-2.4.47)', () => {
  const addButton = () => screen.getByRole('button', { name: 'Agregar experiencia' });

  it('con 4 experiencias «Agregar experiencia» queda deshabilitado y se lee el mensaje del tope', () => {
    render(<WorkExperienceSection {...baseProps} {...capProps} items={makeItems(4)} />);

    expect(addButton()).toBeDisabled();
    expect(screen.getByText(capProps.maxItemsMessage)).toBeInTheDocument();
  });

  it('el formulario sigue visible al llegar al tope (D-AB), a diferencia de las habilidades', () => {
    render(<WorkExperienceSection {...baseProps} {...capProps} items={makeItems(4)} />);

    expect(screen.getByLabelText('Cargo')).toBeInTheDocument();
    expect(screen.getByLabelText('Empresa')).toBeInTheDocument();
  });

  it('con 3 experiencias el botón está habilitado y no hay mensaje de tope', () => {
    render(<WorkExperienceSection {...baseProps} {...capProps} items={makeItems(3)} />);

    expect(addButton()).toBeEnabled();
    expect(screen.queryByText(capProps.maxItemsMessage)).not.toBeInTheDocument();
  });

  it('al guardar la cuarta (la lista pasa de 3 a 4) el botón se deshabilita y aparece el mensaje', () => {
    const { rerender } = render(
      <WorkExperienceSection {...baseProps} {...capProps} items={makeItems(3)} />,
    );

    rerender(<WorkExperienceSection {...baseProps} {...capProps} items={makeItems(4)} />);

    expect(addButton()).toBeDisabled();
    expect(screen.getByText(capProps.maxItemsMessage)).toBeInTheDocument();
  });

  it('Enter dentro de un campo no envía el formulario en el tope', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(
      <WorkExperienceSection {...baseProps} {...capProps} items={makeItems(4)} onAdd={onAdd} />,
    );

    await fillValidCurrent(user);
    await user.keyboard('{Enter}');
    await flush();

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('un envío directo del formulario en el tope tampoco llama a onAdd (precedente `SkillsSection`: `if (isAtMax) return`)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(
      <WorkExperienceSection {...baseProps} {...capProps} items={makeItems(4)} onAdd={onAdd} />,
    );

    await fillValidCurrent(user);
    submitForm();
    await flush();

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('eliminar sigue habilitado en el tope', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn<OnRemove>(() => Promise.resolve());
    render(
      <WorkExperienceSection
        {...baseProps}
        {...capProps}
        items={makeItems(4)}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Eliminar Cargo 1' }));

    expect(onRemove).toHaveBeenCalledWith('exp-1');
  });
});

describe('WorkExperienceSection · guarda de doble envío con promesa (CM-273, PR 2; RT-06-CA01, D-AC y D-AG)', () => {
  const addButton = () => screen.getByRole('button', { name: 'Agregar experiencia' });

  it('dos envíos síncronos en un mismo turno llaman una sola vez a onAdd (DF-004)', async () => {
    const user = userEvent.setup();
    const gate = deferred();
    const onAdd = vi.fn<OnAdd>(() => gate.promise);
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await fillValidCurrent(user);
    act(() => {
      fireEvent.click(addButton());
      fireEvent.click(addButton());
    });
    await flush();

    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('la guarda se suelta cuando la promesa termina: un envío posterior sí se atiende', async () => {
    const user = userEvent.setup();
    const gate = deferred();
    const onAdd = vi.fn<OnAdd>(() => gate.promise);
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await fillValidCurrent(user);
    act(() => {
      fireEvent.click(addButton());
      fireEvent.click(addButton());
    });
    await flush();
    expect(onAdd).toHaveBeenCalledOnce();

    act(() => {
      gate.resolve();
    });
    await flush();
    act(() => {
      fireEvent.click(addButton());
    });
    await flush();

    expect(onAdd).toHaveBeenCalledTimes(2);
  });

  it('la guarda también se suelta cuando la promesa se rechaza', async () => {
    const user = userEvent.setup();
    const gate = deferred();
    const onAdd = vi.fn<OnAdd>().mockReturnValueOnce(gate.promise).mockResolvedValue(undefined);
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    await fillValidCurrent(user);
    act(() => {
      fireEvent.click(addButton());
      fireEvent.click(addButton());
    });
    await flush();
    expect(onAdd).toHaveBeenCalledOnce();

    act(() => {
      gate.reject(new Error('El alta falló'));
    });
    await flush();
    act(() => {
      fireEvent.click(addButton());
    });
    await flush();

    expect(onAdd).toHaveBeenCalledTimes(2);
  });

  it('un envío inválido no activa la guarda: al corregir, el siguiente sí se atiende', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<WorkExperienceSection {...baseProps} onAdd={onAdd} />);

    act(() => {
      fireEvent.click(addButton());
      fireEvent.click(addButton());
    });
    await flush();
    expect(onAdd).not.toHaveBeenCalled();

    await fillValidCurrent(user);
    act(() => {
      fireEvent.click(addButton());
    });
    await flush();

    expect(onAdd).toHaveBeenCalledOnce();
  });

  describe('bajas: una guarda por elemento', () => {
    const removeButton = (position: string) =>
      screen.getByRole('button', { name: `Eliminar ${position}` });

    it('dos clics síncronos sobre el mismo elemento llaman una sola vez a onRemove; otro elemento no se bloquea', async () => {
      const gate = deferred();
      const onRemove = vi.fn<OnRemove>(() => gate.promise);
      render(<WorkExperienceSection {...baseProps} items={makeItems(2)} onRemove={onRemove} />);

      act(() => {
        fireEvent.click(removeButton('Cargo 1'));
        fireEvent.click(removeButton('Cargo 1'));
      });
      await flush();
      expect(onRemove).toHaveBeenCalledOnce();
      expect(onRemove).toHaveBeenCalledWith('exp-1');

      act(() => {
        fireEvent.click(removeButton('Cargo 2'));
      });
      await flush();

      expect(onRemove).toHaveBeenCalledTimes(2);
      expect(onRemove).toHaveBeenLastCalledWith('exp-2');
    });

    it('la guarda del elemento se suelta al terminar la promesa, también si se rechaza', async () => {
      const first = deferred();
      const second = deferred();
      const onRemove = vi
        .fn<OnRemove>()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise)
        .mockResolvedValue(undefined);
      render(<WorkExperienceSection {...baseProps} items={makeItems(1)} onRemove={onRemove} />);

      act(() => {
        fireEvent.click(removeButton('Cargo 1'));
        fireEvent.click(removeButton('Cargo 1'));
      });
      await flush();
      expect(onRemove).toHaveBeenCalledOnce();

      act(() => {
        first.resolve();
      });
      await flush();
      act(() => {
        fireEvent.click(removeButton('Cargo 1'));
      });
      await flush();
      expect(onRemove).toHaveBeenCalledTimes(2);

      act(() => {
        second.reject(new Error('La baja falló'));
      });
      await flush();
      act(() => {
        fireEvent.click(removeButton('Cargo 1'));
      });
      await flush();

      expect(onRemove).toHaveBeenCalledTimes(3);
    });
  });
});
