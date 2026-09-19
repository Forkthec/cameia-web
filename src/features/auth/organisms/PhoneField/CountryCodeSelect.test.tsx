/**
 * Comportamiento observable de `CountryCodeSelect`: el disparador muestra
 * `{ISO} +{indicativo}` sin truncarse, el panel filtra por nombre completo,
 * seleccionar una opción llama a `onChange` y cierra el panel, y `Escape`
 * cierra sin cambiar el valor — mismo contrato que un `<select>`, con
 * buscador.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CountryCodeSelect } from './CountryCodeSelect';

const baseProps = {
  value: 'CO',
  onChange: () => {},
  label: 'País',
  buscarLabel: 'Buscar país',
  sinResultadosLabel: 'No encontramos ese país.',
};

describe('CountryCodeSelect', () => {
  it('muestra el ISO y el indicativo de Colombia sin truncarse', () => {
    render(<CountryCodeSelect {...baseProps} />);

    expect(screen.getByRole('button', { name: 'País' })).toHaveTextContent('CO +57');
  });

  it('al abrir, filtra por nombre y seleccionar llama a onChange con el ISO', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountryCodeSelect {...baseProps} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'País' }));
    await user.type(screen.getByRole('combobox', { name: 'Buscar país' }), 'Argentina');
    await user.click(screen.getByRole('option', { name: /Argentina/ }));

    expect(onChange).toHaveBeenCalledWith('AR');
  });

  it('sin coincidencias, muestra el mensaje de sin resultados', async () => {
    const user = userEvent.setup();
    render(<CountryCodeSelect {...baseProps} />);

    await user.click(screen.getByRole('button', { name: 'País' }));
    await user.type(screen.getByRole('combobox', { name: 'Buscar país' }), 'xyz-no-existe');

    expect(screen.getByText('No encontramos ese país.')).toBeInTheDocument();
  });

  it('Escape cierra el panel sin llamar a onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountryCodeSelect {...baseProps} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'País' }));
    await user.keyboard('{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('ArrowDown + Enter selecciona la primera opción filtrada por teclado', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountryCodeSelect {...baseProps} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'País' }));
    await user.type(screen.getByRole('combobox', { name: 'Buscar país' }), 'Argentina');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('AR');
  });
});
