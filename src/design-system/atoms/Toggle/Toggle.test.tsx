import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('dispara onChange y se anuncia como switch', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Toggle checked={false} onChange={onChange}>
        Notificaciones
      </Toggle>,
    );

    const toggle = screen.getByRole('switch', { name: 'Notificaciones' });
    await user.click(toggle);

    expect(onChange).toHaveBeenCalledOnce();
  });

  it('refleja el estado encendido', () => {
    render(
      <Toggle checked onChange={() => {}}>
        Notificaciones
      </Toggle>,
    );

    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('disabled no dispara onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Toggle checked={false} onChange={onChange} disabled>
        Notificaciones
      </Toggle>,
    );

    await user.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
