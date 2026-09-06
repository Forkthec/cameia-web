import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Divider } from './Divider';

describe('Divider', () => {
  it('horizontal (por defecto) renderiza un <hr>', () => {
    const { container } = render(<Divider />);

    expect(container.querySelector('hr')).toBeInTheDocument();
  });

  it('vertical expone role="separator" con la orientación correcta', () => {
    const { getByRole } = render(<Divider orientation="vertical" />);

    expect(getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });
});
