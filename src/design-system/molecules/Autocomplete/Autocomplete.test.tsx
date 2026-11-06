/**
 * Protege el Autocomplete single-select con grupos opcionales.
 * CLAUDE.md §14.8: describe en ingles, it en espanol.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Autocomplete, type AutocompleteOption, type AutocompleteGroup } from './Autocomplete';

const OPTIONS: AutocompleteOption[] = [
  { value: '1', label: 'Frontend Developer' },
  { value: '2', label: 'Backend Developer' },
  { value: '3', label: 'QA Analyst' },
];

const GROUPS: AutocompleteGroup[] = [
  { label: 'De tu perfil', options: [OPTIONS[0]!] },
  { label: 'Otros roles', options: [OPTIONS[1]!, OPTIONS[2]!] },
];

function renderAutocomplete(props: Partial<React.ComponentProps<typeof Autocomplete>> = {}) {
  const defaults: React.ComponentProps<typeof Autocomplete> = {
    label: 'Rol objetivo',
    options: OPTIONS,
    selected: null,
    onSelect: vi.fn(),
    noResultsLabel: 'Sin resultados',
    ...props,
  };
  return render(<Autocomplete {...defaults} />);
}

describe('Autocomplete', () => {
  it('al montarse con una opción elegida, el campo la muestra (volver a un paso)', () => {
    renderAutocomplete({ selected: OPTIONS[1]! });
    expect(screen.getByRole('combobox')).toHaveValue('Backend Developer');
  });

  it('muestra opciones al enfocar el campo', async () => {
    const user = userEvent.setup();
    renderAutocomplete();
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  });

  it('filtra opciones al escribir', async () => {
    const user = userEvent.setup();
    renderAutocomplete();
    await user.type(screen.getByRole('combobox'), 'Front');
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.queryByText('QA Analyst')).not.toBeInTheDocument();
  });

  it('llama onSelect al elegir una opcion', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderAutocomplete({ onSelect });
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Backend Developer'));
    expect(onSelect).toHaveBeenCalledWith({ value: '2', label: 'Backend Developer' });
  });

  it('muestra grupos cuando se proveen', async () => {
    const user = userEvent.setup();
    renderAutocomplete({ groups: GROUPS });
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('De tu perfil')).toBeInTheDocument();
    expect(screen.getByText('Otros roles')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay resultados', async () => {
    const user = userEvent.setup();
    renderAutocomplete();
    await user.type(screen.getByRole('combobox'), 'zzzzz');
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('muestra mensaje de error', () => {
    renderAutocomplete({ errorMessage: 'Elige un rol' });
    expect(screen.getByText('Elige un rol')).toBeInTheDocument();
  });

  it('limpia seleccion si el texto cambia despues de elegir', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderAutocomplete({ onSelect, selected: { value: '1', label: 'Frontend Developer' } });
    const input = screen.getByRole('combobox');
    await user.type(input, 'x');
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
