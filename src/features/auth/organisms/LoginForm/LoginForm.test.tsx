/**
 * Comportamiento observable de `LoginForm` (CA-1.3.1/CA-1.3.2): valida
 * correo/contraseña en cliente antes de llamar a `onSubmit`, muestra el
 * estado de carga en el botón, y cuando recibe `genericErrorMessage` (error
 * de Firebase) lo muestra en un `AlertInline` y pone ambos campos en estado
 * de error sin mensaje individual (confirmado contra Figma, ver TSDoc de
 * `LoginForm.tsx`).
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

const baseProps = {
  isSubmitting: false,
  onSubmit: () => {},
  titleText: 'Inicia sesión',
  googleButtonLabel: 'Continuar con Google',
  dividerLabel: 'o',
  correoLabel: 'Correo electrónico',
  correoPlaceholder: 'correo@ejemplo.com',
  correoErrorRequired: 'Ingresa tu correo electrónico.',
  correoErrorInvalid: 'Ingresa un correo electrónico válido.',
  correoErrorMuyLargo: 'El correo no puede superar los 254 caracteres.',
  contrasenaLabel: 'Contraseña',
  contrasenaPlaceholder: '••••••••',
  contrasenaErrorRequired: 'Ingresa tu contraseña.',
  showPasswordLabel: 'Mostrar contraseña',
  hidePasswordLabel: 'Ocultar contraseña',
  forgotPasswordLabel: '¿Olvidaste tu contraseña?',
  submitLabel: 'Ingresar',
  submitLoadingLabel: 'Ingresando…',
  footerQuestion: '¿No tienes cuenta?',
  footerCta: 'Crear cuenta',
};

function renderLoginForm(props: Partial<typeof baseProps> & { genericErrorMessage?: string } = {}) {
  return render(
    <MemoryRouter>
      <LoginForm {...baseProps} {...props} />
    </MemoryRouter>,
  );
}

describe('LoginForm', () => {
  it('campos vacíos bloquean el envío y muestran los errores requeridos', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderLoginForm({ onSubmit });

    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Ingresa tu correo electrónico.')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('un correo con formato inválido bloquea el envío', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderLoginForm({ onSubmit });

    await user.type(screen.getByLabelText('Correo electrónico'), 'no-es-un-correo');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Ingresa un correo electrónico válido.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('un envío válido llega a onSubmit con los valores diligenciados', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderLoginForm({ onSubmit });

    await user.type(screen.getByLabelText('Correo electrónico'), 'ada@cameia.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      { correo: 'ada@cameia.com', contrasena: 'secreta123' },
      expect.anything(),
    );
  });

  it('isSubmitting deshabilita el botón y muestra el gerundio', () => {
    renderLoginForm({ isSubmitting: true });

    const button = screen.getByRole('button', { name: 'Ingresando…' });
    expect(button).toBeDisabled();
  });

  it('con genericErrorMessage, lo muestra en una alerta y ambos campos quedan en error', () => {
    renderLoginForm({ genericErrorMessage: 'Correo o contraseña incorrectos' });

    expect(screen.getByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true');
  });

  it('el botón de Google y el enlace de recuperación están deshabilitados', () => {
    renderLoginForm();

    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' })).toBeDisabled();
  });
});
