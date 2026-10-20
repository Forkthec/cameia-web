/**
 * Comportamiento observable de {@link Button}, no implementación: que
 * dispara `onClick`, que `disabled` lo bloquea, que `loading` no reemplaza
 * el texto por un spinner ni cambia el ancho, y que `variant="icon"` sigue
 * siendo accesible sin texto visible.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Icon } from '@/design-system/icons/Icon';
import { Button, ButtonLink } from './Button';

describe('Button', () => {
  it('renderiza la etiqueta recibida y dispara onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Guardar</Button>);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disabled no dispara onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button disabled onClick={onClick}>
        Guardar
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('loading conserva el ancho: la etiqueta original sigue en el DOM, oculta, junto a la de carga', () => {
    render(
      <Button loading loadingLabel="Guardando">
        Guardar
      </Button>,
    );

    const button = screen.getByRole('button');
    // Ambas etiquetas coexisten (una con "invisible", que reserva su espacio
    // en el layout) en vez de que una reemplace a la otra: así el ancho del
    // botón nunca depende de cuál esté visible.
    expect(screen.getByText('Guardar', { selector: 'span' })).toHaveClass('invisible');
    expect(screen.getByText('Guardando', { selector: 'span' })).not.toHaveClass('invisible');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('sin loading, no hay ningún spinner reemplazando el texto', () => {
    render(<Button>Guardar</Button>);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Guardar');
  });

  it('variant="icon" no tiene texto visible pero conserva el nombre accesible', () => {
    render(
      <Button variant="icon" icon={<Icon name="close" />}>
        Cerrar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Cerrar' });
    // El texto sigue en el DOM (nombre accesible) pero visualmente oculto:
    // el wrapper directo del texto (no el propio <span> del texto) es sr-only.
    expect(screen.getByText('Cerrar').parentElement).toHaveClass('sr-only');
    // El ícono se fuerza a 20px sin importar lo que reciba el prop `icon`.
    expect(button.querySelector('svg')).toHaveAttribute('width', '20');
  });

  it('con iconPosition="end", el ícono va después de la etiqueta (CM-329)', () => {
    render(
      <Button icon={<Icon name="arrow-right" />} iconPosition="end">
        Crear cuenta
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Crear cuenta' });
    expect(button.lastElementChild?.tagName.toLowerCase()).toBe('svg');
  });
});

describe('ButtonLink', () => {
  it('es un enlace con las mismas clases de la variante que Button (CM-329)', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/inicio" variant="tertiary">
          Volver a inicio
        </ButtonLink>
        <Button variant="tertiary">Volver a inicio</Button>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Volver a inicio' });
    const button = screen.getByRole('button', { name: 'Volver a inicio' });
    expect(link).toHaveAttribute('href', '/inicio');
    expect(link).toHaveClass('bg-transparent', 'text-brand-base', 'hover:bg-brand-tint');
    expect(button).toHaveClass('bg-transparent', 'text-brand-base', 'hover:bg-brand-tint');
  });
});
