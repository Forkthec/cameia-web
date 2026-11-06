/**
 * Comportamiento observable de `ProfileActionsBar` (PRT-02.03): "Guardar
 * borrador" está enlazado al formulario de Información General por el
 * atributo HTML `form` (no por `onClick`), muestra el gerundio mientras
 * guarda, "Finalizar y Continuar" llama a `onFinish` cuando está habilitado,
 * se deshabilita con su explicación asociada por `aria-describedby` cuando
 * no lo está, muestra el gerundio mientras finaliza (CM-65), y la barra de
 * progreso expone el valor y el máximo reales.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileActionsBar } from './ProfileActionsBar';

const baseProps = {
  draftFormId: 'general-info-form',
  completenessValue: 2,
  completenessMax: 5,
  completenessLabel: 'Completitud del Perfil Profesional',
  completenessFraction: '2 de 5 campos obligatorios',
  saveDraftLabel: 'Guardar borrador',
  savingDraftLabel: 'Guardando…',
  finishLabel: 'Finalizar y Continuar',
  onFinish: () => {},
  isFinishDisabled: true,
  finishDisabledHint: 'Agrega al menos una habilidad y un rol objetivo para poder finalizar.',
  finalizingLabel: 'Finalizando…',
};

describe('ProfileActionsBar', () => {
  it('el botón de borrador envía el formulario de Información General por el atributo form', () => {
    render(<ProfileActionsBar {...baseProps} />);

    const saveButton = screen.getByRole('button', { name: 'Guardar borrador' });
    expect(saveButton).toHaveAttribute('type', 'submit');
    expect(saveButton).toHaveAttribute('form', 'general-info-form');
  });

  it('mientras guarda, muestra el gerundio y queda deshabilitado', () => {
    render(<ProfileActionsBar {...baseProps} isSavingDraft />);

    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  });

  it('"Finalizar y Continuar" está deshabilitado con su explicación asociada', () => {
    render(<ProfileActionsBar {...baseProps} />);

    const finishButton = screen.getByRole('button', { name: 'Finalizar y Continuar' });
    expect(finishButton).toBeDisabled();
    const describedBy = finishButton.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      'Agrega al menos una habilidad y un rol objetivo para poder finalizar.',
    );
  });

  it('la barra de progreso expone el valor y el máximo reales', () => {
    render(<ProfileActionsBar {...baseProps} />);

    const progressbar = screen.getByRole('progressbar', {
      name: 'Completitud del Perfil Profesional',
    });
    expect(progressbar).toHaveAttribute('aria-valuenow', '2');
    expect(progressbar).toHaveAttribute('aria-valuemax', '5');
  });

  it('habilitado, un clic en "Finalizar y Continuar" llama a onFinish', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<ProfileActionsBar {...baseProps} isFinishDisabled={false} onFinish={onFinish} />);

    await user.click(screen.getByRole('button', { name: 'Finalizar y Continuar' }));

    expect(onFinish).toHaveBeenCalledOnce();
  });

  it('mientras finaliza, muestra el gerundio y queda deshabilitado', () => {
    render(<ProfileActionsBar {...baseProps} isFinishDisabled={false} isFinalizing />);

    expect(screen.getByRole('button', { name: 'Finalizando…' })).toBeDisabled();
  });
});
