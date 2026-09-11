/**
 * Comportamiento observable de `Pill`, no implementación: que es
 * puramente decorativo — no expone rol interactivo y su tipo no admite
 * `onClick` — a diferencia de `Chip`, que sí es accionable.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Pill } from './Pill';

describe('Pill', () => {
  it('renderiza el texto recibido', () => {
    render(<Pill>Nuevo</Pill>);

    expect(screen.getByText('Nuevo')).toBeInTheDocument();
  });

  it('no expone rol interactivo', () => {
    render(<Pill>Nuevo</Pill>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('el tipo no acepta onClick', () => {
    // Esta línea existe solo para que TypeScript falle si alguien le agrega
    // onClick a PillProps: la prueba en sí no necesita ejecutarlo.
    // @ts-expect-error Pill no acepta onClick: es informativa, nunca clicable.
    const element = <Pill onClick={() => {}}>Nuevo</Pill>;
    expect(element).toBeTruthy();
  });
});
