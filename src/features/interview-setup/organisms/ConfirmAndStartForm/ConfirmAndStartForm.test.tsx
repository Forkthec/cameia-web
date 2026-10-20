/**
 * Protege el paso final del wizard: resumen de configuracion y boton
 * "Iniciar entrevista" (CA-4.4.4, CA-4.4.5, CA-4.4.17). Fuente: backlog v8.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmAndStartForm } from './ConfirmAndStartForm';

const ROWS = [
  { label: 'Perfil', value: 'Mi perfil' },
  { label: 'Rol', value: 'Desarrollador' },
  { label: 'Modalidad', value: 'Simulación' },
];

function renderForm(props: Partial<React.ComponentProps<typeof ConfirmAndStartForm>> = {}) {
  const defaults: React.ComponentProps<typeof ConfirmAndStartForm> = {
    title: 'Confirmar e iniciar',
    subtitle: 'Revisa tu configuración.',
    rows: ROWS,
    startLabel: 'Iniciar entrevista',
    onStart: vi.fn(),
    isLoading: false,
    loadingLabel: 'Cargando…',
    isDisabled: false,
    backLabel: 'Atrás',
    onBack: vi.fn(),
    ...props,
  };
  return { ...render(<ConfirmAndStartForm {...defaults} />), props: defaults };
}

describe('ConfirmAndStartForm', () => {
  it('muestra el título, subtítulo y todas las filas del resumen', () => {
    renderForm();
    expect(screen.getByText('Confirmar e iniciar')).toBeInTheDocument();
    expect(screen.getByText('Revisa tu configuración.')).toBeInTheDocument();
    for (const row of ROWS) {
      expect(screen.getByText(row.label)).toBeInTheDocument();
      expect(screen.getByText(row.value)).toBeInTheDocument();
    }
  });

  it('llama a onStart al hacer clic en el botón primario', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();
    await user.click(screen.getByRole('button', { name: 'Iniciar entrevista' }));
    expect(props.onStart).toHaveBeenCalledOnce();
  });

  it('llama a onBack al hacer clic en el botón secundario', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();
    await user.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(props.onBack).toHaveBeenCalledOnce();
  });

  it('deshabilita el botón cuando isDisabled es true (CA-4.4.4)', () => {
    renderForm({ isDisabled: true });
    expect(screen.getByRole('button', { name: 'Iniciar entrevista' })).toBeDisabled();
  });

  it('deshabilita el botón durante la carga y muestra el label de carga (CA-4.4.17)', () => {
    renderForm({ isLoading: true });
    const btn = screen.getByRole('button', { name: /Cargando/ });
    expect(btn).toBeDisabled();
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('muestra el mensaje de datos incompletos cuando disabledMessage está presente', () => {
    renderForm({ disabledMessage: 'Faltan datos obligatorios.' });
    expect(screen.getByRole('status')).toHaveTextContent('Faltan datos obligatorios.');
  });

  it('muestra el mensaje de error cuando errorMessage está presente (CA-4.4.5)', () => {
    renderForm({ errorMessage: 'Ocurrió un error.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Ocurrió un error.');
  });

  it('no muestra alertas cuando no hay mensajes de error ni de datos incompletos', () => {
    renderForm();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('no llama a onStart cuando el botón está deshabilitado', async () => {
    const user = userEvent.setup();
    const { props } = renderForm({ isDisabled: true });
    await user.click(screen.getByRole('button', { name: 'Iniciar entrevista' }));
    expect(props.onStart).not.toHaveBeenCalled();
  });
});
