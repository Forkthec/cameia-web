/**
 * Comportamiento observable de `Radio`, no implementación: que `onChange`
 * se dispara al seleccionarse, que dentro de un mismo grupo solo una
 * opción queda marcada, y que `disabled` bloquea el evento.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Radio } from './Radio';

describe('Radio', () => {
  it('dispara onChange al seleccionarse', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Radio checked={false} onChange={onChange} name="tono" value="CALIDO">
        Cálido
      </Radio>,
    );

    await user.click(screen.getByLabelText('Cálido'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('solo una opción del grupo queda marcada', () => {
    const onChange = vi.fn();
    render(
      <>
        <Radio checked name="tono" value="CALIDO" onChange={onChange}>
          Cálido
        </Radio>
        <Radio checked={false} name="tono" value="ESTRICTO" onChange={onChange}>
          Estricto
        </Radio>
      </>,
    );

    expect(screen.getByRole('radio', { name: 'Cálido' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Estricto' })).not.toBeChecked();
  });

  it('disabled no dispara onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Radio checked={false} onChange={onChange} name="tono" value="CALIDO" disabled>
        Cálido
      </Radio>,
    );

    await user.click(screen.getByLabelText('Cálido'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
