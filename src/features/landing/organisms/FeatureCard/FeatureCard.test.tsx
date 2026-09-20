/**
 * Comportamiento observable de {@link FeatureCard}: renderiza título,
 * descripción e ícono recibidos, y no expone ningún `role` interactivo — es
 * contenido, no un control (`SPEC.md` §3.4/§9, decisión de no reutilizar
 * `CardSelectable`).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from '@/design-system/icons/Icon';
import { FeatureCard } from './FeatureCard';

describe('FeatureCard', () => {
  it('muestra el título, la descripción y el ícono recibidos', () => {
    render(
      <FeatureCard
        icon={<Icon name="microphone" title="" />}
        title="Simulacros por voz y texto"
        description="Practica entrevistas completas."
      />,
    );

    expect(screen.getByText('Simulacros por voz y texto')).toBeInTheDocument();
    expect(screen.getByText('Practica entrevistas completas.')).toBeInTheDocument();
  });

  it('no expone ningún role interactivo (no es un control seleccionable)', () => {
    render(
      <FeatureCard icon={<Icon name="microphone" />} title="Título" description="Descripción" />,
    );

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
