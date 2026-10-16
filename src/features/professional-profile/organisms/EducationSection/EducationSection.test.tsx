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
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { EducationItem } from '../../model/profile.types';
import type { EducationFormValues } from '../../schemas/education.schema';
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
  // CM-273 (PR 2, D-AG): `onAdd` y `onRemove` devuelven una promesa (la de `mutateAsync` en la página).
  onAdd: () => Promise.resolve(),
  onRemove: () => Promise.resolve(),
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
  // CM-273 (PR 2, `SPEC.md` §3.3 punto 3): mensajes de longitud, literales del backlog; los nombres de las
  // propiedades son propuesta de estas pruebas en rojo.
  degreeErrorTooLong: 'El título obtenido no puede superar los 150 caracteres.',
  institutionErrorTooLong: 'La institución no puede superar los 150 caracteres.',
};

/** Tope de la sección (CM-273, PR 2, D-V y D-AB); `maxItems` y `maxItemsMessage` son propuesta de estas pruebas. */
const capProps = {
  maxItems: 5,
  maxItemsMessage: 'Ya tienes el máximo de 5 formaciones académicas.',
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
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<EducationSection {...baseProps} onAdd={onAdd} />);

    await fillValidForm(user);
    const form = document.getElementById('education-form') as HTMLFormElement;
    form.requestSubmit();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        level: 'UNDERGRADUATE',
        degree: 'Ingeniería de Sistemas',
        institution: 'Universidad del Cauca',
        startDate: '2018-01',
        endDate: '2023-12',
        inProgress: false,
      }),
    );
  });

  it('nivel sin elegir bloquea el envío y no llama a onAdd', async () => {
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
    const onRemove = vi.fn(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
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
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
      render(<EducationSection {...baseProps} currentMonth="2026-10" onAdd={onAdd} />);

      await fillRequired(user);
      await user.click(screen.getByText('En curso'));
      await user.type(screen.getByLabelText('Fecha de inicio'), '102026');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ startDate: '2026-10', inProgress: true }),
      );
    });

    it('un fin en el mes actual se guarda (CA-2.4.55)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
      render(<EducationSection {...baseProps} currentMonth="2026-10" onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '022022');
      await user.type(screen.getByLabelText('Fecha de fin'), '102026');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ startDate: '2022-02', endDate: '2026-10' }),
      );
    });

    it('usa el mes que recibe por propiedad, no el reloj del sistema', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
      // Con el reloj real (2026) «01/2030» sería futuro; con el mes recibido (2030-01) no lo es.
      render(<EducationSection {...baseProps} currentMonth="2030-01" onAdd={onAdd} />);

      await fillRequired(user);
      await user.click(screen.getByText('En curso'));
      await user.type(screen.getByLabelText('Fecha de inicio'), '012030');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ startDate: '2030-01' }));
    });
  });

  describe('fin anterior al inicio, por mes y año (CA-2.4.30; la parte de periodo de CA-2.4.29 es del PR 2)', () => {
    it('un fin en el mismo mes que el inicio se acepta (la comparación es por mes y año)', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
      render(<EducationSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '022025');
      await user.type(screen.getByLabelText('Fecha de fin'), '022025');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ startDate: '2025-02', endDate: '2025-02' }),
      );
    });
  });

  describe('nacimiento: la regla es del servidor (CA-2.4.31)', () => {
    it('un inicio en el mes de nacimiento se acepta y se envía; el cliente no consulta la fecha de nacimiento', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
      render(<EducationSection {...baseProps} onAdd={onAdd} />);

      await fillRequired(user);
      await user.type(screen.getByLabelText('Fecha de inicio'), '032008');
      submitForm();

      await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
      expect(onAdd.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ startDate: '2008-03' }));
    });
  });
});

/*
 * CM-273 (PR 2, `SPEC.md` §3.3 y D-T a D-AG). Textos esperados: literales del documento de criterios de HU-2.4
 * (v7). Estas pruebas leen los argumentos de `onAdd` con `mock.calls[0][0]` y no con `toHaveBeenCalledWith`,
 * para no depender de que la sección reenvíe o no el segundo argumento (el evento) de `handleSubmit`.
 */
type OnAdd = (values: EducationFormValues) => Promise<void>;
type OnRemove = (educationId: string) => Promise<void>;

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

function makeItems(count: number): EducationItem[] {
  return Array.from({ length: count }, (_, index) => ({
    ...existingItem,
    id: `edu-${index + 1}`,
    degree: `Título ${index + 1}`,
  }));
}

async function pasteInto(user: User, label: string, text: string) {
  const field = screen.getByLabelText(label);
  await user.click(field);
  await user.paste(text);
  return field;
}

/** Nivel, título, institución e inicio válidos (sin fin): un formulario válido hoy y después del PR 2. */
async function fillValidInProgress(user: User) {
  await fillRequired(user);
  await user.type(screen.getByLabelText('Fecha de inicio'), '012018');
  await user.click(screen.getByText('En curso'));
}

describe('EducationSection · longitudes (CM-273, PR 2; CA-2.4.27 y CA-2.4.28)', () => {
  const DEGREE_TOO_LONG = baseProps.degreeErrorTooLong;
  const INSTITUTION_TOO_LONG = baseProps.institutionErrorTooLong;

  it('título obtenido de 151 caracteres: el mensaje sale bajo el campo y no se guarda (CA-2.4.28)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<EducationSection {...baseProps} onAdd={onAdd} />);

    await user.selectOptions(screen.getByLabelText('Nivel educativo'), 'UNDERGRADUATE');
    await user.type(screen.getByLabelText('Institución'), 'Universidad del Cauca');
    const degree = await pasteInto(user, 'Título obtenido', 'a'.repeat(151));
    await user.type(screen.getByLabelText('Fecha de inicio'), '012018');
    await user.click(screen.getByText('En curso'));
    submitForm();

    expect(await screen.findByText(DEGREE_TOO_LONG)).toBeInTheDocument();
    expect(degree).toHaveAccessibleDescription(DEGREE_TOO_LONG);
    expect(degree).toHaveValue('a'.repeat(151));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('institución de 151 caracteres: el mensaje sale bajo el campo y no se guarda (CA-2.4.28)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<EducationSection {...baseProps} onAdd={onAdd} />);

    await user.selectOptions(screen.getByLabelText('Nivel educativo'), 'UNDERGRADUATE');
    await user.type(screen.getByLabelText('Título obtenido'), 'Ingeniería de Sistemas');
    const institution = await pasteInto(user, 'Institución', 'a'.repeat(151));
    await user.type(screen.getByLabelText('Fecha de inicio'), '012018');
    await user.click(screen.getByText('En curso'));
    submitForm();

    expect(await screen.findByText(INSTITUTION_TOO_LONG)).toBeInTheDocument();
    expect(institution).toHaveAccessibleDescription(INSTITUTION_TOO_LONG);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('institución y título obtenido de 150 caracteres se guardan completos (CA-2.4.27)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<EducationSection {...baseProps} onAdd={onAdd} />);

    await user.selectOptions(screen.getByLabelText('Nivel educativo'), 'UNDERGRADUATE');
    await pasteInto(user, 'Título obtenido', 't'.repeat(150));
    await pasteInto(user, 'Institución', 'i'.repeat(150));
    await user.type(screen.getByLabelText('Fecha de inicio'), '012018');
    await user.click(screen.getByText('En curso'));
    submitForm();

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(onAdd.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ degree: 't'.repeat(150), institution: 'i'.repeat(150) }),
    );
    expect(screen.queryByText(DEGREE_TOO_LONG)).not.toBeInTheDocument();
    expect(screen.queryByText(INSTITUTION_TOO_LONG)).not.toBeInTheDocument();
  });
});

describe('EducationSection · tope de 5 formaciones (CM-273, PR 2; CA-2.4.10)', () => {
  const addButton = () => screen.getByRole('button', { name: 'Agregar formación' });

  it('con 5 formaciones «Agregar formación» queda deshabilitado y se lee el mensaje del tope', () => {
    render(<EducationSection {...baseProps} {...capProps} items={makeItems(5)} />);

    expect(addButton()).toBeDisabled();
    expect(screen.getByText(capProps.maxItemsMessage)).toBeInTheDocument();
  });

  it('el formulario sigue visible al llegar al tope (D-AB)', () => {
    render(<EducationSection {...baseProps} {...capProps} items={makeItems(5)} />);

    expect(screen.getByLabelText('Título obtenido')).toBeInTheDocument();
    expect(screen.getByLabelText('Institución')).toBeInTheDocument();
  });

  it('con 4 formaciones el botón está habilitado y no hay mensaje de tope', () => {
    render(<EducationSection {...baseProps} {...capProps} items={makeItems(4)} />);

    expect(addButton()).toBeEnabled();
    expect(screen.queryByText(capProps.maxItemsMessage)).not.toBeInTheDocument();
  });

  it('al guardar la quinta (la lista pasa de 4 a 5) el botón se deshabilita y aparece el mensaje', () => {
    const { rerender } = render(
      <EducationSection {...baseProps} {...capProps} items={makeItems(4)} />,
    );

    rerender(<EducationSection {...baseProps} {...capProps} items={makeItems(5)} />);

    expect(addButton()).toBeDisabled();
    expect(screen.getByText(capProps.maxItemsMessage)).toBeInTheDocument();
  });

  it('Enter dentro de un campo no envía el formulario en el tope', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<EducationSection {...baseProps} {...capProps} items={makeItems(5)} onAdd={onAdd} />);

    await fillValidInProgress(user);
    await user.keyboard('{Enter}');
    await flush();

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('un envío directo del formulario en el tope tampoco llama a onAdd (precedente `SkillsSection`: `if (isAtMax) return`)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn<OnAdd>(() => Promise.resolve());
    render(<EducationSection {...baseProps} {...capProps} items={makeItems(5)} onAdd={onAdd} />);

    await fillValidInProgress(user);
    submitForm();
    await flush();

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('eliminar sigue habilitado en el tope', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn<OnRemove>(() => Promise.resolve());
    render(
      <EducationSection {...baseProps} {...capProps} items={makeItems(5)} onRemove={onRemove} />,
    );

    await user.click(screen.getByRole('button', { name: 'Eliminar Título 1' }));

    expect(onRemove).toHaveBeenCalledWith('edu-1');
  });
});

describe('EducationSection · guarda de doble envío con promesa (CM-273, PR 2; RT-06-CA01, D-AC y D-AG)', () => {
  const addButton = () => screen.getByRole('button', { name: 'Agregar formación' });

  it('dos envíos síncronos en un mismo turno llaman una sola vez a onAdd (DF-004)', async () => {
    const user = userEvent.setup();
    const gate = deferred();
    const onAdd = vi.fn<OnAdd>(() => gate.promise);
    render(<EducationSection {...baseProps} onAdd={onAdd} />);

    await fillValidInProgress(user);
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
    render(<EducationSection {...baseProps} onAdd={onAdd} />);

    await fillValidInProgress(user);
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
    render(<EducationSection {...baseProps} onAdd={onAdd} />);

    await fillValidInProgress(user);
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
    render(<EducationSection {...baseProps} onAdd={onAdd} />);

    act(() => {
      fireEvent.click(addButton());
      fireEvent.click(addButton());
    });
    await flush();
    expect(onAdd).not.toHaveBeenCalled();

    await fillValidInProgress(user);
    act(() => {
      fireEvent.click(addButton());
    });
    await flush();

    expect(onAdd).toHaveBeenCalledOnce();
  });

  describe('bajas: una guarda por elemento', () => {
    const removeButton = (degree: string) =>
      screen.getByRole('button', { name: `Eliminar ${degree}` });

    it('dos clics síncronos sobre el mismo elemento llaman una sola vez a onRemove; otro elemento no se bloquea', async () => {
      const gate = deferred();
      const onRemove = vi.fn<OnRemove>(() => gate.promise);
      render(<EducationSection {...baseProps} items={makeItems(2)} onRemove={onRemove} />);

      act(() => {
        fireEvent.click(removeButton('Título 1'));
        fireEvent.click(removeButton('Título 1'));
      });
      await flush();
      expect(onRemove).toHaveBeenCalledOnce();
      expect(onRemove).toHaveBeenCalledWith('edu-1');

      act(() => {
        fireEvent.click(removeButton('Título 2'));
      });
      await flush();

      expect(onRemove).toHaveBeenCalledTimes(2);
      expect(onRemove).toHaveBeenLastCalledWith('edu-2');
    });

    it('la guarda del elemento se suelta al terminar la promesa, también si se rechaza', async () => {
      const first = deferred();
      const second = deferred();
      const onRemove = vi
        .fn<OnRemove>()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise)
        .mockResolvedValue(undefined);
      render(<EducationSection {...baseProps} items={makeItems(1)} onRemove={onRemove} />);

      act(() => {
        fireEvent.click(removeButton('Título 1'));
        fireEvent.click(removeButton('Título 1'));
      });
      await flush();
      expect(onRemove).toHaveBeenCalledOnce();

      act(() => {
        first.resolve();
      });
      await flush();
      act(() => {
        fireEvent.click(removeButton('Título 1'));
      });
      await flush();
      expect(onRemove).toHaveBeenCalledTimes(2);

      act(() => {
        second.reject(new Error('La baja falló'));
      });
      await flush();
      act(() => {
        fireEvent.click(removeButton('Título 1'));
      });
      await flush();

      expect(onRemove).toHaveBeenCalledTimes(3);
    });
  });
});
