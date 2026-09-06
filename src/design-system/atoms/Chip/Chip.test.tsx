import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from './Chip';

describe('Chip', () => {
  it('dispara onClick al seleccionarse y refleja el estado en aria-pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Chip selected onClick={onClick}>
        React
      </Chip>,
    );
    const chip = screen.getByRole('button', { name: 'React' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');

    await user.click(chip);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('sin onRemove no muestra botón de quitar', () => {
    render(<Chip>React</Chip>);

    expect(screen.queryByRole('button', { name: /quitar/i })).not.toBeInTheDocument();
  });

  it('con onRemove muestra un botón de quitar con nombre accesible propio', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(
      <Chip onRemove={onRemove} removeLabel="Quitar React">
        React
      </Chip>,
    );

    await user.click(screen.getByRole('button', { name: 'Quitar React' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
