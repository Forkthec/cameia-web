import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('con src, renderiza la imagen con su texto alternativo', () => {
    render(<Avatar src="/foto.jpg" alt="Ana Gómez" fallback="AG" />);

    expect(screen.getByRole('img', { name: 'Ana Gómez' })).toHaveAttribute('src', '/foto.jpg');
  });

  it('sin src, muestra las iniciales como respaldo', () => {
    render(<Avatar alt="Ana Gómez" fallback="AG" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AG')).toBeInTheDocument();
  });
});
