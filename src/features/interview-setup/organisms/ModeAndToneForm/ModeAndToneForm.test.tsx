/**
 * Protege el paso 2 del wizard: modo y tono (CA-4.3.1, CA-4.3.2, CA-4.3.5,
 * CA-4.3.6). Fuente: backlog v8.2.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ModeAndToneForm } from './ModeAndToneForm';
import type { InterviewMode, InterviewTone } from '../../model/interviewSetup.types';

const MODE_LABELS: Record<InterviewMode, string> = {
  SIMULACION: 'Simulación',
  ENTRENO: 'Entreno',
};

const TONE_LABELS: Record<InterviewTone, string> = {
  PROFESIONAL_NEUTRO: 'Profesional y neutro',
  CALIDO: 'Cálido',
  ESTRICTO: 'Estricto',
  MOTIVADOR: 'Motivador',
};

const TONE_DESCRIPTIONS: Record<InterviewTone, string> = {
  PROFESIONAL_NEUTRO: 'Desc neutro',
  CALIDO: 'Desc cálido',
  ESTRICTO: 'Desc estricto',
  MOTIVADOR: 'Desc motivador',
};

function renderForm(props: Partial<React.ComponentProps<typeof ModeAndToneForm>> = {}) {
  const defaults: React.ComponentProps<typeof ModeAndToneForm> = {
    selectedMode: 'SIMULACION',
    selectedTone: 'PROFESIONAL_NEUTRO',
    onModeChange: vi.fn(),
    onToneChange: vi.fn(),
    modeLabel: 'Modalidad',
    toneLabel: 'Tono',
    modeLabels: MODE_LABELS,
    toneLabels: TONE_LABELS,
    toneDescriptions: TONE_DESCRIPTIONS,
    comingSoonLabel: 'Próximamente',
    ...props,
  };
  return { ...render(<ModeAndToneForm {...defaults} />), props: defaults };
}

describe('ModeAndToneForm', () => {
  it('muestra las dos modalidades con Simulación seleccionada (CA-4.3.1)', () => {
    renderForm();
    expect(screen.getByText('Simulación')).toBeInTheDocument();
    expect(screen.getByText('Entreno')).toBeInTheDocument();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
  });

  it('muestra los 4 tonos con sus descripciones (CA-4.3.2)', () => {
    renderForm();
    expect(screen.getByText('Profesional y neutro')).toBeInTheDocument();
    expect(screen.getByText('Cálido')).toBeInTheDocument();
    expect(screen.getByText('Estricto')).toBeInTheDocument();
    expect(screen.getByText('Motivador')).toBeInTheDocument();
    expect(screen.getByText('Desc neutro')).toBeInTheDocument();
  });

  it('no llama a onModeChange al hacer clic en Entreno (deshabilitado)', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();
    await user.click(screen.getByText('Entreno'));
    expect(props.onModeChange).not.toHaveBeenCalled();
  });

  it('llama a onToneChange al seleccionar otro tono (CA-4.3.5)', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();
    await user.click(screen.getByText('Cálido'));
    expect(props.onToneChange).toHaveBeenCalledWith('CALIDO');
  });

  it('tiene radiogroups accesibles para modalidad y tono', () => {
    renderForm();
    expect(screen.getByRole('radiogroup', { name: 'Modalidad' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Tono' })).toBeInTheDocument();
  });
});
