/**
 * Comportamiento observable de `StepList`, no implementación: que
 * renderiza las cuatro secciones recibidas, y que marca la sección
 * actual con `aria-current="step"`.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StepList, type StepListItem } from './StepList';

const items: StepListItem[] = [
  { label: 'Información general', status: 'complete' },
  { label: 'Experiencia laboral y educación', status: 'current' },
  { label: 'Habilidades y expectativas', status: 'upcoming' },
  { label: 'Roles objetivo', status: 'upcoming' },
];

describe('StepList', () => {
  it('renderiza las cuatro secciones', () => {
    render(<StepList items={items} label="Secciones del perfil" />);

    expect(screen.getByText('Información general')).toBeInTheDocument();
    expect(screen.getByText('Experiencia laboral y educación')).toBeInTheDocument();
    expect(screen.getByText('Habilidades y expectativas')).toBeInTheDocument();
    expect(screen.getByText('Roles objetivo')).toBeInTheDocument();
  });

  it('marca la sección actual con aria-current="step"', () => {
    render(<StepList items={items} label="Secciones del perfil" />);

    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'step');
  });

  it('CM-195: muestra secondaryLabel junto al label cuando viene, y nada cuando no', () => {
    const itemsWithSecondary: StepListItem[] = [
      ...items,
      { label: 'Experiencia laboral', status: 'upcoming', secondaryLabel: 'Opcional' },
    ];
    render(<StepList items={itemsWithSecondary} label="Secciones del perfil" />);

    expect(screen.getByText('Opcional')).toBeInTheDocument();
  });
});
