/**
 * Comportamiento observable de `Select` (SPEC.md §9, decisión D-B): la
 * opción "sin elegir" está deshabilitada y preseleccionada, un cambio real
 * emite `onChange` con el `value` elegido, `state="error"` marca
 * `aria-invalid`, y los ids externos que inyecta `FormField` (`id`,
 * `describedBy`) se respetan en vez de que el componente genere los suyos.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

const options = [
  { value: 'TECHNICAL', label: 'Técnico' },
  { value: 'UNDERGRADUATE', label: 'Pregrado' },
  { value: 'POSTGRADUATE', label: 'Posgrado' },
];

describe('Select', () => {
  it('la opción "sin elegir" está deshabilitada y preseleccionada cuando value es vacío', () => {
    render(
      <Select options={options} value="" onChange={() => {}} placeholder="Selecciona una opción" />,
    );

    const select = screen.getByRole<HTMLSelectElement>('combobox');
    expect(select.value).toBe('');
    const placeholderOption = screen.getByRole('option', { name: 'Selecciona una opción' });
    expect(placeholderOption).toBeDisabled();
  });

  it('elegir una opción real emite onChange con su value', async () => {
    const user = userEvent.setup();
    // Se captura el valor DENTRO del handler (no leyendo `event.target` después
    // de `await`): al ser un componente controlado con `value=""` fijo, React
    // ya revirtió el `<select>` del DOM real a su valor anterior para cuando
    // la aserción se ejecuta.
    let capturedValue: string | undefined;
    const onChange = vi.fn((event: { target: { value: string } }) => {
      capturedValue = event.target.value;
    });
    render(
      <Select options={options} value="" onChange={onChange} placeholder="Selecciona una opción" />,
    );

    await user.selectOptions(screen.getByRole('combobox'), 'UNDERGRADUATE');

    expect(onChange).toHaveBeenCalledOnce();
    expect(capturedValue).toBe('UNDERGRADUATE');
  });

  it('state="error" marca aria-invalid', () => {
    render(
      <Select
        options={options}
        value=""
        onChange={() => {}}
        placeholder="Selecciona una opción"
        state="error"
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('respeta el id y el describedBy externos, como los que inyecta FormField', () => {
    render(
      <Select
        options={options}
        value=""
        onChange={() => {}}
        placeholder="Selecciona una opción"
        id="nivel-educativo"
        describedBy="nivel-educativo-error-externo"
      />,
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'nivel-educativo');
    expect(select).toHaveAttribute('aria-describedby', 'nivel-educativo-error-externo');
  });
});
