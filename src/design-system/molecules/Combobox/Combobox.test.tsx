/**
 * Comportamiento observable de {@link Combobox}: filtrado por texto,
 * selección con mouse y con teclado, quitar un seleccionado, y el mensaje de
 * sin resultados.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Combobox, type ComboboxOption } from './Combobox';

const ROLES: ComboboxOption[] = [
  { value: 'frontend', label: 'Desarrollador Frontend' },
  { value: 'backend', label: 'Desarrollador Backend' },
  { value: 'qa', label: 'Analista de QA' },
];

function ControlledCombobox({ initialSelected = [] as ComboboxOption[] }) {
  const [selected, setSelected] = useState(initialSelected);
  return (
    <Combobox
      label="Roles objetivo"
      options={ROLES}
      selected={selected}
      onSelectionChange={setSelected}
      noResultsLabel="Sin resultados"
      getRemoveLabel={(option) => `Quitar ${option.label}`}
    />
  );
}

describe('Combobox', () => {
  it('filtra las opciones al escribir', async () => {
    const user = userEvent.setup();
    render(<ControlledCombobox />);

    const input = screen.getByRole('combobox', { name: 'Roles objetivo' });
    await user.type(input, 'Backend');

    expect(screen.getByRole('option', { name: 'Desarrollador Backend' })).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Desarrollador Frontend' }),
    ).not.toBeInTheDocument();
  });

  it('seleccionar una opción la agrega como Chip y limpia la búsqueda', async () => {
    const user = userEvent.setup();
    render(<ControlledCombobox />);

    const input = screen.getByRole('combobox', { name: 'Roles objetivo' });
    await user.type(input, 'Frontend');
    await user.click(screen.getByRole('option', { name: 'Desarrollador Frontend' }));

    expect(screen.getByRole('button', { name: 'Desarrollador Frontend' })).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('quitar el Chip de un seleccionado lo devuelve a las opciones disponibles', async () => {
    const user = userEvent.setup();
    render(<ControlledCombobox initialSelected={[ROLES[0]!]} />);

    await user.click(screen.getByRole('button', { name: 'Quitar Desarrollador Frontend' }));

    expect(
      screen.queryByRole('button', { name: 'Desarrollador Frontend' }),
    ).not.toBeInTheDocument();
  });

  it('sin coincidencias, muestra el mensaje de sin resultados', async () => {
    const user = userEvent.setup();
    render(<ControlledCombobox />);

    await user.type(screen.getByRole('combobox', { name: 'Roles objetivo' }), 'xyz-no-existe');

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('ArrowDown + Enter selecciona la opción resaltada por teclado', async () => {
    const user = userEvent.setup();
    render(<ControlledCombobox />);

    const input = screen.getByRole('combobox', { name: 'Roles objetivo' });
    await user.click(input);
    await user.keyboard('{ArrowDown}{Enter}');

    expect(screen.getByRole('button', { name: 'Desarrollador Frontend' })).toBeInTheDocument();
  });

  it('onSelectionChange no se llama si no hay ninguna interacción', () => {
    const onSelectionChange = vi.fn();
    render(
      <Combobox
        label="Roles objetivo"
        options={ROLES}
        selected={[]}
        onSelectionChange={onSelectionChange}
        noResultsLabel="Sin resultados"
        getRemoveLabel={(option) => `Quitar ${option.label}`}
      />,
    );

    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});
