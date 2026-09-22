/**
 * Protege las reglas de presentación de `SPEC.md` §3 (`PRT-01.02`): que el
 * botón «Abrir correo» no exista cuando el dominio no tiene webmail conocido
 * (B-27), que la espera entre reenvíos se lea en el propio texto del botón y
 * no solo en un color o un atributo (§3, Accesibilidad), y que mientras corre
 * la activación no quede ninguna acción a mano.
 *
 * El organismo es presentacional: toda la copia entra por props, así que aquí
 * no se traduce nada — se pasan cadenas literales a propósito.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VerifyEmailPanel } from './VerifyEmailPanel';

const baseProps = {
  titleText: 'Verifica tu correo',
  sentToMessage: <span>Enviamos un enlace a ada@gmail.com</span>,
  instructionText: 'Revisa tu bandeja de entrada.',
  webmailUrl: 'https://mail.google.com/',
  openMailLabel: 'Abrir correo',
  resendLabel: 'Reenviar enlace',
  resendWaitingLabel: 'Reenviar enlace (45 s)',
  resendLoadingLabel: 'Reenviando…',
  resendCooldownSeconds: 0,
  isResending: false,
  onResend: vi.fn(),
  isActivating: false,
  activatingLabel: 'Activando tu cuenta…',
};

describe('VerifyEmailPanel', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el titular, el destinatario y la instrucción', () => {
    render(<VerifyEmailPanel {...baseProps} />);

    expect(screen.getByRole('heading', { name: 'Verifica tu correo' })).toBeInTheDocument();
    expect(screen.getByText('Enviamos un enlace a ada@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('Revisa tu bandeja de entrada.')).toBeInTheDocument();
  });

  it('abre el webmail en una pestaña nueva al pulsar «Abrir correo»', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();
    render(<VerifyEmailPanel {...baseProps} />);

    await user.click(screen.getByRole('button', { name: 'Abrir correo' }));

    expect(openSpy).toHaveBeenCalledWith(
      'https://mail.google.com/',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('no ofrece «Abrir correo» cuando el dominio no tiene webmail conocido', () => {
    render(<VerifyEmailPanel {...baseProps} webmailUrl={null} />);

    expect(screen.queryByRole('button', { name: 'Abrir correo' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reenviar enlace' })).toBeInTheDocument();
  });

  it('reenvía el enlace al pulsar el botón', async () => {
    const user = userEvent.setup();
    render(<VerifyEmailPanel {...baseProps} />);

    await user.click(screen.getByRole('button', { name: 'Reenviar enlace' }));

    expect(baseProps.onResend).toHaveBeenCalledOnce();
  });

  it('durante la espera deshabilita el reenvío y muestra los segundos en el texto', () => {
    render(<VerifyEmailPanel {...baseProps} resendCooldownSeconds={45} />);

    expect(screen.getByRole('button', { name: 'Reenviar enlace (45 s)' })).toBeDisabled();
  });

  it('mientras se activa la cuenta, anuncia el estado y retira las acciones', () => {
    render(<VerifyEmailPanel {...baseProps} isActivating />);

    expect(screen.getByRole('status')).toHaveTextContent('Activando tu cuenta…');
    expect(screen.queryByRole('button', { name: 'Abrir correo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reenviar enlace' })).not.toBeInTheDocument();
  });

  it('muestra el aviso con «Reintentar» solo cuando se le pasa la acción', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <VerifyEmailPanel
        {...baseProps}
        feedbackMessage="Todavía no pudimos confirmar tu verificación."
        retryLabel="Reintentar"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Todavía no pudimos confirmar tu verificación.',
    );
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('sin acción de reintento, el aviso se muestra sin botón', () => {
    render(
      <VerifyEmailPanel
        {...baseProps}
        feedbackMessage="Te enviamos un enlace nuevo."
        feedbackVariant="success"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });
});
