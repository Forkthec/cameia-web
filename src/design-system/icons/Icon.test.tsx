/**
 * Pruebas de humo de {@link Icon}: que renderiza, que respeta el tamaño
 * recibido, y su contrato de accesibilidad (decorativo sin `title`, nombre
 * accesible con `title`).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renderiza el ícono solicitado', () => {
    const { container } = render(<Icon name="microphone" />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('respeta el tamaño recibido', () => {
    const { container } = render(<Icon name="microphone" size={48} />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('sin title es decorativo y lleva aria-hidden', () => {
    const { container } = render(<Icon name="microphone" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('con title expone un nombre accesible', () => {
    render(<Icon name="microphone" title="Grabar audio" />);

    expect(screen.getByRole('img', { name: 'Grabar audio' })).toBeInTheDocument();
  });
});
