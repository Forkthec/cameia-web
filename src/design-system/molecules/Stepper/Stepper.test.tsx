/**
 * Comportamiento observable de `Stepper`, no implementación: que
 * renderiza los pasos recibidos, marca el paso actual con
 * `aria-current="step"`, y expone un nombre accesible para la lista
 * completa (no solo para cada paso suelto).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stepper, type Step } from './Stepper';

const steps: Step[] = [
  { label: 'Oferta y rol', status: 'complete' },
  { label: 'Modo y tono', status: 'current' },
  { label: 'Idioma y forma de respuesta', status: 'upcoming' },
];

describe('Stepper', () => {
  it('renderiza los tres pasos', () => {
    render(<Stepper steps={steps} label="Progreso del asistente" />);

    expect(screen.getByText('Oferta y rol')).toBeInTheDocument();
    expect(screen.getByText('Modo y tono')).toBeInTheDocument();
    expect(screen.getByText('Idioma y forma de respuesta')).toBeInTheDocument();
  });

  it('marca el paso actual con aria-current="step"', () => {
    render(<Stepper steps={steps} label="Progreso del asistente" />);

    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'step');
  });

  it('expone un nombre accesible para la lista completa', () => {
    render(<Stepper steps={steps} label="Progreso del asistente" />);

    expect(screen.getByRole('list', { name: 'Progreso del asistente' })).toBeInTheDocument();
  });
});
