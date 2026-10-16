/**
 * Comportamiento observable de `MonthField` (CM-273, PR 1; `SPEC.md` §3.3 y D-K, D-L, D-N, D-O): entrada de
 * texto con máscara «mm/aaaa» que entrega al formulario el TEXTO CRUDO (sin validarlo: el esquema de Zod lo
 * valida y lo transforma a «AAAA-MM»), más un panel flotante de 12 meses con flechas de año, que va del año
 * actual hacia atrás 110 años y muestra apagados los meses posteriores al mes actual; `Escape` y la salida del
 * foco lo cierran (patrón de `MenuUsuario` y `Combobox`).
 *
 * Los nombres de las propiedades (`currentMonth`, `locale`, `openPanelLabel`, `panelLabel`,
 * `previousYearLabel`, `nextYearLabel`) y las funciones ARIA (disparador con `aria-expanded` y
 * `aria-controls`, panel `role="dialog"` con nombre, un botón por mes) son propuesta de estas pruebas en
 * rojo: el SPEC no los fija. Los textos de abajo son datos de la prueba, no llaves de i18n (el design system
 * no usa `useTranslation`, `CLAUDE.md` §14.7).
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormField } from '../FormField';
import { MonthField } from './MonthField';

const texts = {
  placeholder: 'mm/aaaa',
  locale: 'es-CO',
  openPanelLabel: 'Abrir selector de mes',
  panelLabel: 'Elegir mes y año',
  previousYearLabel: 'Año anterior',
  nextYearLabel: 'Año siguiente',
};

interface HarnessProps {
  initial?: string;
  onTextChange?: (text: string) => void;
  state?: 'default' | 'error' | 'disabled';
  currentMonth?: string;
  error?: string;
}

/** `MonthField` controlado, dentro de un `FormField` como lo monta cada sección. */
function Harness({
  initial = '',
  onTextChange,
  state,
  currentMonth = '2026-10',
  error,
}: HarnessProps) {
  const [value, setValue] = useState(initial);

  return (
    <FormField label="Fecha de inicio" error={error}>
      <MonthField
        value={value}
        onChange={(text) => {
          setValue(text);
          onTextChange?.(text);
        }}
        state={state}
        currentMonth={currentMonth}
        {...texts}
      />
    </FormField>
  );
}

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: texts.openPanelLabel }));
  const dialog = screen.getByRole('dialog', { name: texts.panelLabel });
  const previous = within(dialog).getByRole('button', { name: texts.previousYearLabel });
  const next = within(dialog).getByRole('button', { name: texts.nextYearLabel });
  const months = within(dialog)
    .getAllByRole('button')
    .filter((button) => button !== previous && button !== next);

  return { dialog, previous, next, months };
}

describe('MonthField · texto', () => {
  it('entrega al formulario el texto que muestra la máscara, no un valor transformado', async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    render(<Harness onTextChange={onTextChange} />);

    const input = screen.getByLabelText('Fecha de inicio');
    await user.type(input, '062024');

    expect(input).toHaveValue('06/2024');
    expect(onTextChange).toHaveBeenLastCalledWith('06/2024');
    expect(onTextChange.mock.calls.every(([text]) => typeof text === 'string')).toBe(true);
  });

  it('entrega tal cual un texto inválido como «13/2024»: la validación es del esquema, no del campo', async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    render(<Harness onTextChange={onTextChange} />);

    const input = screen.getByLabelText('Fecha de inicio');
    await user.type(input, '132024');

    expect(input).toHaveValue('13/2024');
    expect(onTextChange).toHaveBeenLastCalledWith('13/2024');
  });

  it('entrega el texto incompleto mientras se escribe', async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    render(<Harness onTextChange={onTextChange} />);

    await user.type(screen.getByLabelText('Fecha de inicio'), '0620');

    expect(onTextChange).toHaveBeenLastCalledWith('06/20');
  });

  it('teclear la barra no la duplica', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByLabelText('Fecha de inicio');
    await user.type(input, '06/2024');

    expect(input).toHaveValue('06/2024');
  });

  it('ignora lo que no es dígito y no pasa de seis dígitos', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByLabelText('Fecha de inicio');
    await user.type(input, 'a06b2024xx99');

    expect(input).toHaveValue('06/2024');
  });

  it('al pegar, aplica la máscara', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByLabelText('Fecha de inicio');
    await user.click(input);
    await user.paste('062024');
    expect(input).toHaveValue('06/2024');

    await user.clear(input);
    await user.paste('ab06cd2024');
    expect(input).toHaveValue('06/2024');
  });

  it('al borrar hacia atrás, no deja la barra colgando', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByLabelText('Fecha de inicio');
    await user.type(input, '062');
    expect(input).toHaveValue('06/2');

    await user.keyboard('{Backspace}');
    expect(input).toHaveValue('06');

    await user.keyboard('{Backspace}');
    expect(input).toHaveValue('0');
  });

  it('deja teclear un mes futuro: no lo corrige (D-N; el esquema lo rechaza con su mensaje)', async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    render(<Harness currentMonth="2026-10" onTextChange={onTextChange} />);

    await user.type(screen.getByLabelText('Fecha de inicio'), '112026');

    expect(onTextChange).toHaveBeenLastCalledWith('11/2026');
  });

  it('muestra el marcador de posición', () => {
    render(<Harness />);

    expect(screen.getByPlaceholderText('mm/aaaa')).toBeInTheDocument();
  });
});

describe('MonthField · integración con FormField y react-hook-form', () => {
  it('recibe el id y el describedBy de FormField: la etiqueta y el mensaje quedan asociados al campo de texto', () => {
    render(<Harness error="Ingresa una fecha válida con el formato mm/aaaa." state="error" />);

    const input = screen.getByLabelText('Fecha de inicio');

    expect(input).toHaveAccessibleDescription('Ingresa una fecha válida con el formato mm/aaaa.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('reenvía la referencia al <input> de texto (para que el foco automático al primer error funcione)', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <MonthField
        ref={ref}
        value=""
        onChange={() => {}}
        currentMonth="2026-10"
        id="mes"
        {...texts}
      />,
    );

    ref.current?.focus();

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveFocus();
  });

  it('el disparador del panel no envía el formulario que lo contiene', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Harness />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: texts.openPanelLabel }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('MonthField · estado deshabilitado (mientras se agrega)', () => {
  it('deshabilita el campo de texto y el disparador del panel', () => {
    render(<Harness state="disabled" />);

    expect(screen.getByLabelText('Fecha de inicio')).toBeDisabled();
    expect(screen.getByRole('button', { name: texts.openPanelLabel })).toBeDisabled();
  });

  it('no abre el panel', async () => {
    const user = userEvent.setup();
    render(<Harness state="disabled" />);

    await user.click(screen.getByRole('button', { name: texts.openPanelLabel }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('MonthField · panel', () => {
  it('empieza cerrado y el disparador lo anuncia', () => {
    render(<Harness />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: texts.openPanelLabel })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('al abrirlo, el disparador queda expandido y apunta al panel con aria-controls', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const { dialog } = await openPanel(user);
    const trigger = screen.getByRole('button', { name: texts.openPanelLabel });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(dialog.id).not.toBe('');
    expect(trigger).toHaveAttribute('aria-controls', dialog.id);
  });

  it('ofrece 12 meses, cada uno con nombre accesible, y las dos flechas de año', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const { months, previous, next } = await openPanel(user);

    expect(months).toHaveLength(12);
    expect(previous).toBeInTheDocument();
    expect(next).toBeInTheDocument();
    for (const month of months) {
      expect((month.getAttribute('aria-label') ?? month.textContent ?? '').trim()).not.toBe('');
    }
  });

  it('abre en el año del mes actual recibido y lo muestra', async () => {
    const user = userEvent.setup();
    render(<Harness currentMonth="2026-10" />);

    const { dialog } = await openPanel(user);

    expect(within(dialog).getByText('2026')).toBeInTheDocument();
  });

  it('elegir un mes entrega «mm/aaaa» del año mostrado', async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    render(<Harness onTextChange={onTextChange} />);

    const { months } = await openPanel(user);
    await user.click(months[2] as HTMLElement); // marzo

    expect(onTextChange).toHaveBeenLastCalledWith('03/2026');
  });

  it('las flechas cambian el año mostrado y el mes elegido usa ese año', async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    render(<Harness onTextChange={onTextChange} />);

    const { dialog, previous, months } = await openPanel(user);
    await user.click(previous);

    expect(within(dialog).getByText('2025')).toBeInTheDocument();

    await user.click(months[5] as HTMLElement); // junio

    expect(onTextChange).toHaveBeenLastCalledWith('06/2025');
  });

  it('en el año actual, los meses posteriores al mes actual se muestran apagados y no se pueden elegir', async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    render(<Harness currentMonth="2026-10" onTextChange={onTextChange} />);

    const { months } = await openPanel(user);

    // octubre es el mes actual: se puede elegir; noviembre y diciembre son futuros.
    expect(months[9]).toBeEnabled();
    expect(months[10]).toBeDisabled();
    expect(months[11]).toBeDisabled();

    await user.click(months[10] as HTMLElement);

    expect(onTextChange).not.toHaveBeenCalled();
  });

  it('en un año anterior no hay ningún mes apagado', async () => {
    const user = userEvent.setup();
    render(<Harness currentMonth="2026-10" />);

    const { previous, months } = await openPanel(user);
    await user.click(previous);

    for (const month of months) {
      expect(month).toBeEnabled();
    }
  });

  it('no se puede avanzar más allá del año actual', async () => {
    const user = userEvent.setup();
    render(<Harness currentMonth="2026-10" />);

    const { next } = await openPanel(user);

    expect(next).toBeDisabled();
  });

  // El panel abre en el año del valor, así que el tope se alcanza sin navegar: 2026 - 110 = 1916.
  it('llega hasta 110 años atrás (1916 desde 2026): en el año tope «Año anterior» está deshabilitado', async () => {
    const user = userEvent.setup();
    render(<Harness initial="06/1916" currentMonth="2026-10" />);

    const { dialog, previous } = await openPanel(user);

    expect(within(dialog).getByText('1916')).toBeInTheDocument();
    expect(previous).toBeDisabled();
  });

  it('un año más reciente que el tope (1917) todavía deja ir al año anterior, y no más allá de 1916', async () => {
    const user = userEvent.setup();
    render(<Harness initial="06/1917" currentMonth="2026-10" />);

    const { dialog, previous } = await openPanel(user);

    expect(within(dialog).getByText('1917')).toBeInTheDocument();
    expect(previous).toBeEnabled();

    await user.click(previous);

    expect(within(dialog).getByText('1916')).toBeInTheDocument();
    expect(previous).toBeDisabled();
  });

  it('con un valor «mm/aaaa» válido, abre en el año de ese valor', async () => {
    const user = userEvent.setup();
    render(<Harness initial="06/2020" currentMonth="2026-10" />);

    const { dialog, next } = await openPanel(user);

    expect(within(dialog).getByText('2020')).toBeInTheDocument();
    expect(next).toBeEnabled();
  });

  it('con el campo vacío, un texto incompleto o un mes inexistente, abre en el año actual', async () => {
    const user = userEvent.setup();

    for (const initial of ['', '06/20', '13/2020']) {
      const { unmount } = render(<Harness initial={initial} currentMonth="2026-10" />);
      const { dialog } = await openPanel(user);

      expect(within(dialog).getByText('2026')).toBeInTheDocument();
      unmount();
    }
  });

  it('con un año fuera del rango del panel (futuro o de hace más de 110 años), abre en el año actual', async () => {
    const user = userEvent.setup();

    for (const initial of ['06/2030', '06/1800']) {
      const { unmount } = render(<Harness initial={initial} currentMonth="2026-10" />);
      const { dialog } = await openPanel(user);

      expect(within(dialog).getByText('2026')).toBeInTheDocument();
      unmount();
    }
  });

  it('al reabrirlo, vuelve al año del valor y no al último año navegado', async () => {
    const user = userEvent.setup();
    render(<Harness initial="06/2020" currentMonth="2026-10" />);

    const { previous } = await openPanel(user);
    await user.click(previous);
    await user.keyboard('{Escape}');
    const { dialog } = await openPanel(user);

    expect(within(dialog).getByText('2020')).toBeInTheDocument();
  });

  it('el botón de un mes y las flechas de año cancelan el mousedown: el foco no sale del componente (Safari no enfoca botones al hacer clic)', async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    render(<Harness onTextChange={onTextChange} />);

    const { previous, next, months } = await openPanel(user);
    // «Año siguiente» está deshabilitado en el año actual: se retrocede uno para poder probarlo.
    await user.click(previous);

    // `fireEvent` devuelve `false` cuando algún manejador llamó a `preventDefault`.
    expect(fireEvent.mouseDown(months[2] as HTMLElement)).toBe(false);
    expect(fireEvent.mouseDown(previous)).toBe(false);
    expect(fireEvent.mouseDown(next)).toBe(false);
    expect(screen.getByRole('dialog', { name: texts.panelLabel })).toBeInTheDocument();
    expect(onTextChange).not.toHaveBeenCalled();
  });

  it('elegir un mes con el teclado (Enter) también lo entrega', async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    render(<Harness onTextChange={onTextChange} />);

    const { months } = await openPanel(user);
    act(() => {
      (months[2] as HTMLElement).focus();
    });
    await user.keyboard('{Enter}');

    expect(onTextChange).toHaveBeenLastCalledWith('03/2026');
  });

  it('Escape cierra el panel y devuelve el foco al disparador', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const { months } = await openPanel(user);
    act(() => {
      (months[0] as HTMLElement).focus();
    });
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: texts.openPanelLabel })).toHaveFocus();
  });

  it('se cierra cuando el foco sale del componente', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness />
        <button type="button">Afuera</button>
      </>,
    );

    await openPanel(user);
    await user.click(screen.getByRole('button', { name: 'Afuera' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
