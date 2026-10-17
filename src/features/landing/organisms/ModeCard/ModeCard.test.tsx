/**
 * Comportamiento observable de {@link ModeCard} (`SPEC.md` §3.7): muestra
 * título, etiqueta, descripción y los textos de su línea de tiempo, y —igual
 * que `FeatureCard`— no expone ningún control: es contenido informativo.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ModeCard } from './ModeCard';

describe('ModeCard', () => {
  it('muestra título, etiqueta, descripción y los textos de la línea de tiempo', () => {
    render(
      <ModeCard
        mode="SIMULACION"
        title="Simulación"
        tag="Como la real"
        description="Un flujo continuo sin pausas."
        timelineStart="Sin pausas"
        timelineEnd="Evaluación completa al final"
        inView
      />,
    );

    expect(screen.getByRole('heading', { name: 'Simulación' })).toBeInTheDocument();
    expect(screen.getByText('Como la real')).toBeInTheDocument();
    expect(screen.getByText('Un flujo continuo sin pausas.')).toBeInTheDocument();
    expect(screen.getByText('Evaluación completa al final')).toBeInTheDocument();
  });

  it('no expone ningún control interactivo', () => {
    render(
      <ModeCard
        mode="ENTRENO"
        title="Entreno"
        tag="A tu ritmo"
        description="Repregunta cuando lo necesites."
        timelineStart="Respuesta"
        timelineEnd="Retroalimentación tras cada una"
        inView={false}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});
