/**
 * Comportamiento observable de `RegisterForm` (CA-1.1.1/CA-1.1.3): valida
 * los campos obligatorios, las causas de `fechaNacimiento` y las reglas
 * reales de `contrasena` (`PasswordPolicy.java`: 12-64 caracteres, sin
 * contraseñas comunes) en cliente antes de llamar a `onSubmit`; cuando
 * recibe `duplicateEmailErrorMessage`, pone el campo `correo` en error y
 * revela el bloque de dos acciones (Figma); `birthDateRejectedByServer`
 * fuerza el mismo tratamiento visual que "menor de edad" de cliente hasta
 * que la persona edita el campo; el medidor de fuerza acompaña el campo
 * Contraseña.
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
  celularPaisLabel: 'País',
  celularBuscarPaisLabel: 'Buscar país',
  celularSinResultadosLabel: 'No encontramos ese país.',
  celularNumeroLabel: 'Celular',
  celularNumeroPlaceholder: '300 000 0000',
  celularAyuda: 'Formato internacional, por ejemplo +57 300 000 0000',
  celularErrorInvalido: 'Revisa el número, no coincide con el formato del país elegido.',
  contrasenaLabel: 'Contraseña',
  contrasenaPlaceholder: '••••••••',
  contrasenaErrorMuyCorta: 'La contraseña debe tener al menos 12 caracteres.',
  contrasenaErrorMuyLarga: 'La contraseña no puede superar los 64 caracteres.',
  contrasenaErrorComun: 'Esta contraseña es demasiado común, elige otra.',
  contrasenaFuerzaDebil: 'Débil',
  contrasenaFuerzaAceptable: 'Aceptable',
  contrasenaFuerzaBuena: 'Buena',
  contrasenaFuerzaFuerte: 'Fuerte',
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

const VALID_PASSWORD = 'ClaveSegura2026';

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
  await user.type(screen.getByLabelText('Contraseña'), VALID_PASSWORD);
  await user.type(screen.getByLabelText('Confirmar contraseña'), VALID_PASSWORD);
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
    expect(
      screen.getByText('La contraseña debe tener al menos 12 caracteres.'),
    ).toBeInTheDocument();
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

  it('el campo de fecha de nacimiento no deja elegir un día posterior a hoy', () => {
    renderRegisterForm();

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveAttribute('max', today);
  });

  it('el campo de fecha de nacimiento no deja elegir una fecha de más de 110 años', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-06T15:00:00Z'));

    renderRegisterForm();

    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveAttribute('min', '1915-09-07');

    vi.useRealTimers();
  });

  it('de noche en Colombia (UTC-5), el límite de fecha no se adelanta al día que ya rige en UTC', () => {
    vi.stubEnv('TZ', 'America/Bogota');
    vi.useFakeTimers();
    // 8 p. m. del 19-sep-2026 en Bogotá = 1 a. m. del 20-sep-2026 en UTC.
    vi.setSystemTime(new Date('2026-09-20T01:00:00Z'));

    renderRegisterForm();

    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveAttribute('max', '2026-09-19');

    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('de noche en Colombia (UTC-5), elegir el día siguiente sí se marca como fecha futura', async () => {
    vi.stubEnv('TZ', 'America/Bogota');
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // 8 p. m. del 19-sep-2026 en Bogotá = 1 a. m. del 20-sep-2026 en UTC:
    // "mañana" para la persona (20-sep) ya es "hoy" en UTC.
    vi.setSystemTime(new Date('2026-09-20T01:00:00Z'));
    const user = userEvent.setup();
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
      target: { value: '2026-09-20' },
    });
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('Fecha de nacimiento inválida')).toBeInTheDocument();

    vi.useRealTimers();
    vi.unstubAllEnvs();
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

  it('una contraseña de menos de 12 caracteres bloquea el envío', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderRegisterForm({ onSubmit });

    await user.type(screen.getByLabelText('Contraseña'), 'corta123');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(
      await screen.findByText('La contraseña debe tener al menos 12 caracteres.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('una contraseña de más de 64 caracteres bloquea el envío', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    await user.type(screen.getByLabelText('Contraseña'), 'a'.repeat(65));
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(
      await screen.findByText('La contraseña no puede superar los 64 caracteres.'),
    ).toBeInTheDocument();
  });

  it('una contraseña común (aunque cumpla la longitud) bloquea el envío', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    await user.type(screen.getByLabelText('Contraseña'), 'password1234');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(
      await screen.findByText('Esta contraseña es demasiado común, elige otra.'),
    ).toBeInTheDocument();
  });

  it('el medidor de fuerza acompaña el valor escrito en Contraseña', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    await user.type(screen.getByLabelText('Contraseña'), 'ClaveSegura2026!');

    expect(await screen.findByText('Fuerte')).toBeInTheDocument();
  });

  it('con contrasenaServerErrorMessage, el campo Contraseña queda en error con ese texto', () => {
    renderRegisterForm({
      contrasenaServerErrorMessage: 'Tu contraseña no cumple los requisitos de seguridad.',
    });

    expect(
      screen.getByText('Tu contraseña no cumple los requisitos de seguridad.'),
    ).toBeInTheDocument();
  });

  it('confirmar contraseña que no coincide bloquea el envío', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderRegisterForm({ onSubmit });

    await fillValidFormExceptSubmit(user);
    await user.clear(screen.getByLabelText('Confirmar contraseña'));
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'otra-clave-distinta-1');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('el celular es opcional: un envío sin número no lo bloquea', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderRegisterForm({ onSubmit });

    await fillValidFormExceptSubmit(user);
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
  });

  it('Colombia es el país por defecto del celular', () => {
    renderRegisterForm();

    expect(screen.getByRole('button', { name: 'País' })).toHaveTextContent('CO +57');
    expect(screen.getByLabelText('Celular')).toHaveAttribute('placeholder', '300 000 0000');
  });

  it('un celular que no coincide con el país elegido bloquea el envío', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderRegisterForm({ onSubmit });

    await fillValidFormExceptSubmit(user);
    await user.type(screen.getByLabelText('Celular'), '123');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(
      await screen.findByText('Revisa el número, no coincide con el formato del país elegido.'),
    ).toBeInTheDocument();
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
        contrasena: VALID_PASSWORD,
        confirmarContrasena: VALID_PASSWORD,
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
