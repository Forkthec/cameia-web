import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('dispara onChange al hacer clic en la etiqueta', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Checkbox checked={false} onChange={onChange}>
        Acepto los términos
      </Checkbox>,
    );

    await user.click(screen.getByLabelText('Acepto los términos'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('refleja el estado marcado en el input nativo', () => {
    render(
      <Checkbox checked onChange={() => {}}>
        Acepto los términos
      </Checkbox>,
    );

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('disabled no dispara onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Checkbox checked={false} onChange={onChange} disabled>
        Acepto los términos
      </Checkbox>,
    );

    await user.click(screen.getByLabelText('Acepto los términos'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
