/**
 * Comportamiento observable de `WizardLayout`, no implementación: que
 * renderiza los pasos y el contenido recibidos, que la acción primaria
 * dispara `onPrimaryAction`, y que sin `onBack` no se renderiza la
 * acción secundaria — la plantilla de los asistentes multi-paso
 * (CLAUDE.md §4).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormEvent } from 'react';
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

  // CM-53: con `primaryActionFormId`, el botón envía el `<form>` de la
  // sección (type="submit" + atributo form) en vez de disparar un onClick.
  it('con primaryActionFormId dispara el submit del form en vez de onClick', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    const onPrimaryAction = vi.fn();

    render(
      <WizardLayout
        steps={steps}
        stepsLabel="Progreso del asistente"
        primaryActionLabel="Guardar borrador"
        onPrimaryAction={onPrimaryAction}
        primaryActionFormId="seccion-form"
      >
        <form id="seccion-form" onSubmit={onSubmit}>
          <p>Paso actual</p>
        </form>
      </WizardLayout>,
    );

    const button = screen.getByRole('button', { name: 'Guardar borrador' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('form', 'seccion-form');

    await user.click(button);
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onPrimaryAction).not.toHaveBeenCalled();
  });
});
