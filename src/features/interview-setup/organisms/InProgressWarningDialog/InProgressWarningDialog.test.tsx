/**
 * Protege el dialogo de aviso de entrevista en curso (CA-4.4.7).
 * Fuente: backlog v8, HU-4.4.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InProgressWarningDialog } from './InProgressWarningDialog';

function renderDialog(props: Partial<React.ComponentProps<typeof InProgressWarningDialog>> = {}) {
  const defaults: React.ComponentProps<typeof InProgressWarningDialog> = {
    title: 'Entrevista en curso',
    message: 'Tienes una entrevista en curso.',
    startNewLabel: 'Iniciar la nueva',
    backToInterviewLabel: 'Volver a mi entrevista',
    cancelLabel: 'Cancelar',
    onStartNew: vi.fn(),
    onBackToInterview: vi.fn(),
    onCancel: vi.fn(),
    ...props,
  };
  return { ...render(<InProgressWarningDialog {...defaults} />), props: defaults };
}

describe('InProgressWarningDialog', () => {
  it('muestra el título y el mensaje del aviso', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Entrevista en curso')).toBeInTheDocument();
    expect(screen.getByText('Tienes una entrevista en curso.')).toBeInTheDocument();
  });

  it('llama a onStartNew al hacer clic en el botón primario', async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Iniciar la nueva' }));
    expect(props.onStartNew).toHaveBeenCalledOnce();
  });

  it('llama a onBackToInterview al hacer clic en el botón secundario', async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Volver a mi entrevista' }));
    expect(props.onBackToInterview).toHaveBeenCalledOnce();
  });

  it('llama a onCancel al hacer clic en el botón de cierre', async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(props.onCancel).toHaveBeenCalledOnce();
  });
});
