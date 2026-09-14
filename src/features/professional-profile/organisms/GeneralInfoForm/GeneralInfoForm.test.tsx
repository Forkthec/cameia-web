/**
 * Comportamiento observable de `GeneralInfoForm` (HU-2.3, CA-2.3.3,
 * CA-2.3.5): que muestra los valores iniciales, que bloquea el envío sin
 * llamar a `onSubmit` cuando `name` queda vacío o supera 120 caracteres, que
 * el campo de resumen no deja escribir más de 2000 caracteres
 * (`maxLength`) y que el contador refleja el conteo real, y que un envío
 * válido llega a `onSubmit` con los valores actuales.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GeneralInfoForm } from './GeneralInfoForm';

const baseProps = {
  formId: 'general-info-form',
  name: 'Ana María Pérez',
  summary: 'Desarrolladora backend con experiencia en Java.',
  onSubmit: () => {},
  nameLabel: 'Nombre del perfil',
  nameErrorRequired: 'Ingresa un nombre para el perfil.',
  nameErrorTooLong: 'El nombre no puede superar los 120 caracteres.',
  summaryLabel: 'Resumen profesional',
  summaryErrorTooLong: 'El resumen no puede superar los 2000 caracteres.',
  summaryCounterLabel: (count: number, max: number) => `${count}/${max} caracteres`,
};

describe('GeneralInfoForm', () => {
  it('muestra los valores iniciales de name y summary', () => {
    render(<GeneralInfoForm {...baseProps} />);

    expect(screen.getByLabelText('Nombre del perfil')).toHaveValue('Ana María Pérez');
    expect(screen.getByLabelText('Resumen profesional')).toHaveValue(
      'Desarrolladora backend con experiencia en Java.',
    );
  });

  it('el contador refleja el conteo real de summary', () => {
    render(<GeneralInfoForm {...baseProps} />);

    // 'Desarrolladora backend con experiencia en Java.'.length === 47
    expect(screen.getByText('47/2000 caracteres')).toBeInTheDocument();
  });

  it('name vacío bloquea el envío y no llama a onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<GeneralInfoForm {...baseProps} onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText('Nombre del perfil'));
    // El botón que envía este formulario vive en WizardLayout, fuera de este
    // componente (conectado por el atributo HTML form): se dispara el
    // submit del <form> directamente por su id.
    const form = document.getElementById('general-info-form') as HTMLFormElement;
    form.requestSubmit();

    expect(await screen.findByText('Ingresa un nombre para el perfil.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('name mayor a 120 caracteres bloquea el envío', async () => {
    const onSubmit = vi.fn();
    render(<GeneralInfoForm {...baseProps} onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText('Nombre del perfil');
    // `maxLength` en el campo ya impide teclear o pegar más de 120
    // caracteres — por eso esta prueba no usa userEvent.type (lo respeta y
    // trunca) sino fireEvent.change, para verificar la red de seguridad de
    // zod cuando el valor llega igual (p. ej. por un estado externo).
    fireEvent.change(nameInput, { target: { value: 'a'.repeat(121) } });
    // Ver nota arriba sobre por qué se accede al <form> por id.
    const form = document.getElementById('general-info-form') as HTMLFormElement;
    form.requestSubmit();

    expect(
      await screen.findByText('El nombre no puede superar los 120 caracteres.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('el resumen no acepta más de 2000 caracteres al escribir', () => {
    render(<GeneralInfoForm {...baseProps} />);

    expect(screen.getByLabelText('Resumen profesional')).toHaveAttribute('maxlength', '2000');
  });

  it('un envío válido llega a onSubmit con los valores actuales', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<GeneralInfoForm {...baseProps} onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText('Nombre del perfil');
    await user.clear(nameInput);
    await user.type(nameInput, 'Ana Pérez');
    // Ver nota arriba sobre por qué se accede al <form> por id.
    const form = document.getElementById('general-info-form') as HTMLFormElement;
    form.requestSubmit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      { name: 'Ana Pérez', summary: 'Desarrolladora backend con experiencia en Java.' },
      expect.anything(),
    );
  });
});
