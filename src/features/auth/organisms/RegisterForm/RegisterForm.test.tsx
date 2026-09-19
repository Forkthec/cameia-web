/**
 * Comportamiento observable de `RegisterForm` (CA-1.1.1/CA-1.1.3): valida
 * los campos obligatorios y las cuatro causas de `fechaNacimiento` en
 * cliente antes de llamar a `onSubmit`; cuando recibe
 * `duplicateEmailErrorMessage`, pone el campo `correo` en error y revela el
 * bloque de dos acciones (Figma); `birthDateRejectedByServer` fuerza el
 * mismo tratamiento visual que "menor de edad" de cliente hasta que la
 * persona edita el campo.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';

const baseProps = {
  isSubmitting: false,
  onSubmit: () => {},
  titleText: 'Crea tu cuenta',
  googleButtonLabel: 'Continuar con Google',
  dividerLabel: 'o',
  nombreLabel: 'Nombre(s)',
  nombrePlaceholder: 'Escribe aquí',
  nombreErrorRequired: 'Ingresa tu nombre.',
  apellidoLabel: 'Apellido(s)',
  apellidoPlaceholder: 'Escribe aquí',
  apellidoErrorRequired: 'Ingresa tu apellido.',
  fechaNacimientoLabel: 'Fecha de nacimiento',
  fechaNacimientoAyuda: 'Debes ser mayor de edad',
  fechaNacimientoErrorFutura: 'Fecha de nacimiento inválida',
  fechaNacimientoErrorImplausible: 'Verifica tu fecha de nacimiento',
  fechaNacimientoErrorFormatoInvalido: 'Formato de fecha inválido',
  correoLabel: 'Correo electrónico',
  correoPlaceholder: 'correo@ejemplo.com',
  correoErrorRequired: 'Ingresa tu correo electrónico.',
  correoErrorInvalid: 'Ingresa un correo electrónico válido.',
  duplicateEmailLoginLabel: 'Iniciar sesión',
  duplicateEmailRecoverLabel: 'Recuperar contraseña',
  celularLabel: 'Celular',
  celularPlaceholder: '+57 300 000 0000',
  contrasenaLabel: 'Contraseña',
  contrasenaPlaceholder: '••••••••',
  contrasenaErrorRequired: 'Ingresa tu contraseña.',
  confirmarContrasenaLabel: 'Confirmar contraseña',
  confirmarContrasenaPlaceholder: '••••••••',
  confirmarContrasenaErrorRequired: 'Confirma tu contraseña.',
  confirmarContrasenaErrorNoCoincide: 'Las contraseñas no coinciden.',
  showPasswordLabel: 'Mostrar contraseña',
  hidePasswordLabel: 'Ocultar contraseña',
  pronombresLabel: 'Pronombres',
  pronombresPlaceholder: 'Selecciona una opción',
  pronombresOptions: [
    { value: 'HE', label: 'Él' },
    { value: 'SHE', label: 'Ella' },
    { value: 'THEY', label: 'Elle' },
  ],
  pronombresErrorRequired: 'Selecciona una opción.',
  submitLabel: 'Registrarse',
  submitLoadingLabel: 'Registrando…',
  footerQuestion: '¿Ya tienes cuenta?',
  footerCta: 'Inicia sesión',
};

function renderRegisterForm(props: Partial<typeof baseProps & Record<string, unknown>> = {}) {
  return render(
    <MemoryRouter>
      <RegisterForm {...baseProps} {...props} />
    </MemoryRouter>,
  );
}

async function fillValidFormExceptSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre(s)'), 'Ada');
  await user.type(screen.getByLabelText('Apellido(s)'), 'Lovelace');
  fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
    target: { value: '1990-01-01' },
  });
  await user.type(screen.getByLabelText('Correo electrónico'), 'ada@cameia.com');
  await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'secreta123');
  await user.selectOptions(screen.getByLabelText('Pronombres'), 'SHE');
}

describe('RegisterForm', () => {
  it('campos vacíos bloquean el envío y muestran los errores requeridos', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderRegisterForm({ onSubmit });

    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('Ingresa tu nombre.')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu apellido.')).toBeInTheDocument();
    expect(screen.getByText('Formato de fecha inválido')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu correo electrónico.')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument();
    expect(screen.getByText('Confirma tu contraseña.')).toBeInTheDocument();
    expect(screen.getByText('Selecciona una opción.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('una fecha de nacimiento futura muestra su propio mensaje', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
      target: { value: '2099-01-01' },
    });
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('Fecha de nacimiento inválida')).toBeInTheDocument();
  });

  it('una fecha de nacimiento con más de 110 años muestra su propio mensaje', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
      target: { value: '1900-01-01' },
    });
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('Verifica tu fecha de nacimiento')).toBeInTheDocument();
  });

  it('menor de edad reutiliza el mismo texto que el helper permanente', async () => {
    const user = userEvent.setup();
    const currentYear = new Date().getUTCFullYear();
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
      target: { value: `${currentYear - 10}-01-01` },
    });
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findAllByText('Debes ser mayor de edad')).not.toHaveLength(0);
  });

  it('confirmar contraseña que no coincide bloquea el envío', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderRegisterForm({ onSubmit });

    await fillValidFormExceptSubmit(user);
    await user.clear(screen.getByLabelText('Confirmar contraseña'));
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'otra-clave');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('un envío válido llega a onSubmit con los valores diligenciados', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderRegisterForm({ onSubmit });

    await fillValidFormExceptSubmit(user);
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Ada',
        apellido: 'Lovelace',
        fechaNacimiento: '1990-01-01',
        correo: 'ada@cameia.com',
        contrasena: 'secreta123',
        confirmarContrasena: 'secreta123',
        pronombres: 'SHE',
      }),
      expect.anything(),
    );
  });

  it('con duplicateEmailErrorMessage, el campo correo queda en error y aparece el bloque de dos acciones', () => {
    renderRegisterForm({ duplicateEmailErrorMessage: 'Ese correo ya tiene una cuenta.' });

    expect(screen.getByText('Ese correo ya tiene una cuenta.')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recuperar contraseña' })).toBeDisabled();
  });

  it('con birthDateRejectedByServer, fechaNacimiento queda en error con el texto de "menor de edad"', () => {
    renderRegisterForm({ birthDateRejectedByServer: true });

    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Debes ser mayor de edad')).toBeInTheDocument();
  });

  it('el botón de Google está deshabilitado', () => {
    renderRegisterForm();

    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeDisabled();
  });

  it('isSubmitting deshabilita el botón y muestra el gerundio', () => {
    renderRegisterForm({ isSubmitting: true });

    expect(screen.getByRole('button', { name: 'Registrando…' })).toBeDisabled();
  });
});
