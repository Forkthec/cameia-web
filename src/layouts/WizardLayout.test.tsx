import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Step } from '@/design-system/molecules/Stepper';
import { WizardLayout } from './WizardLayout';

const steps: Step[] = [
  { label: 'Oferta y rol', status: 'current' },
  { label: 'Modo y tono', status: 'upcoming' },
  { label: 'Idioma y forma de respuesta', status: 'upcoming' },
];

describe('WizardLayout', () => {
  it('renderiza los pasos y el contenido', () => {
    render(
      <WizardLayout
        steps={steps}
        stepsLabel="Progreso del asistente"
        primaryActionLabel="Continuar"
        onPrimaryAction={vi.fn()}
      >
        <p>Paso actual</p>
      </WizardLayout>,
    );

    expect(screen.getByText('Oferta y rol')).toBeInTheDocument();
    expect(screen.getByText('Paso actual')).toBeInTheDocument();
  });

  it('llama a onPrimaryAction al hacer clic en la acción primaria', async () => {
    const user = userEvent.setup();
    const onPrimaryAction = vi.fn();
    render(
      <WizardLayout
        steps={steps}
        stepsLabel="Progreso del asistente"
        primaryActionLabel="Continuar"
        onPrimaryAction={onPrimaryAction}
      >
        <p>Paso actual</p>
      </WizardLayout>,
    );

    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onPrimaryAction).toHaveBeenCalledOnce();
  });

  it('sin onBack no renderiza la acción secundaria', () => {
    render(
      <WizardLayout
        steps={steps}
        stepsLabel="Progreso del asistente"
        primaryActionLabel="Continuar"
        onPrimaryAction={vi.fn()}
      >
        <p>Paso actual</p>
      </WizardLayout>,
    );

    expect(screen.queryByRole('button', { name: 'Atrás' })).not.toBeInTheDocument();
  });
});
